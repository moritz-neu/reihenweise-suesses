(function (RS) {
  'use strict';

  // Balancing-Simulator (Entwicklerwerkzeug, nicht Teil von tests.html).
  // Ein Bot spielt jedes Level mit vielen Bot-Startwerten: Er probiert jeden möglichen Zug
  // auf einer Kopie der Sitzung aus und nimmt den besten. Zielbewusst (Standard): zuerst
  // ein Zug, der das Level gewinnt, dann der meiste Fortschritt auf die offenen Ziele, dann
  // die meisten Punkte. Gleichstände entscheidet sein eigener Zufallsgenerator.
  // Aufruf: balance.html?seeds=200&levels=1,2,3  (Standard: 200 Startwerte, alle Level)
  // Probewerte ohne levels.js zu ändern: &set=9.moves=30;5.g1=20
  // (gN = Zielmenge des N-ten Ziels).
  // Standard: jeder Lauf bekommt einen eigenen Feld-Startwert (wechselnde Verläufe).
  // &boards=fixed nutzt den festen Level-Startwert; dann spielt der Bot in manchen Leveln
  // jede Partie gleich und die Siegquote ist nur 0 oder 100 %.
  // &bot=greedy: einfacher gieriger Bot, der nur Punkte zählt.

  // ---------- kopierbarer Zufallsgenerator ----------
  // Derselbe mulberry32 wie RS.createRng, aber mit sichtbarem Zustand, damit sich ein
  // Spielfeld samt Zufallsgenerator kopieren lässt. Wird vor dem Erzeugen der Sitzungen
  // als RS.createRng eingesetzt; checkRng() prüft, dass beide dieselbe Folge liefern.
  var originalRng = RS.createRng;

  function cloneableRng(state) {
    var rng = { state: state >>> 0 };
    rng.next = function () {
      rng.state = (rng.state + 0x6D2B79F5) >>> 0;
      var t = rng.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.int = function (n) { return Math.floor(rng.next() * n); };
    return rng;
  }

  function checkRng() {
    [1, 1001, 123456789].forEach(function (seed) {
      var a = originalRng(seed);
      var b = cloneableRng(seed);
      for (var i = 0; i < 1000; i++) {
        if (a.next() !== b.next()) { throw new Error('kopierbarer Zufallsgenerator weicht ab (Seed ' + seed + ')'); }
      }
    });
  }

  function cloneBoard(board) {
    var copy = {};
    Object.keys(board).forEach(function (k) {
      if (k !== 'rng') { copy[k] = board[k]; }
    });
    copy = JSON.parse(JSON.stringify(copy));
    copy.rng = cloneableRng(board.rng.state);
    return copy;
  }

  function cloneSession(s) {
    return {
      mode: s.mode,
      level: s.level,
      board: cloneBoard(s.board),
      goals: JSON.parse(JSON.stringify(s.goals)),
      status: s.status
    };
  }

  // ---------- Bot ----------

  // Fortschritt eines Zugs auf die noch offenen Ziele (wie ein Mensch, der auf die Ziele
  // spielt): Glasurschichten für ein Glasurziel, Bonbons der Farbe für ein Sammelziel,
  // Punkte nur für ein offenes Punkteziel. Jeweils höchstens bis zum Rest des Ziels.
  function goalProgress(before, events, gain) {
    var progress = 0;
    before.goals.forEach(function (g) {
      var rest = g.target - g.count;
      if (rest <= 0) { return; }
      var n = 0;
      events.forEach(function (e) {
        if (g.type === 'glaze' && e.type === 'obstacleHit' && e.kind === 'glaze') { n++; }
        if (g.type === 'collect' && e.type === 'cleared') {
          n += e.candies.filter(function (c) { return c.color === g.color; }).length;
        }
      });
      if (g.type === 'score') { n = gain / RS.Engine.POINTS.CANDY; }
      progress += Math.min(rest, n);
    });
    return progress;
  }

  // greedy = true: nur die Punkte zählen (einfacher gieriger Bot).
  function playLevel(level, botSeed, varyBoard, greedy) {
    var botRng = originalRng(botSeed);
    var def = level;
    if (varyBoard) {
      def = Object.assign({}, level, { seed: level.seed + 7919 * botSeed });
    }
    var s = RS.Session.startLevel(def);
    while (s.status === 'playing') {
      var moves = RS.Board.findPossibleMoves(s.board);
      if (!moves.length) { break; }
      var best = [];
      var bestKey = null;
      moves.forEach(function (m) {
        var trial = cloneSession(s);
        var before = trial.goals.score;
        var events = RS.Session.move(trial, m.a, m.b);
        var gain = trial.goals.score - before;
        var key = greedy ? [gain] : [
          trial.status === 'won' ? 1 : 0,
          goalProgress(s.goals, events, gain),
          gain
        ];
        var cmp = bestKey ? compareKeys(key, bestKey) : 1;
        if (cmp > 0) { bestKey = key; best = [m]; }
        else if (cmp === 0) { best.push(m); }
      });
      var pick = best[botRng.int(best.length)];
      RS.Session.move(s, pick.a, pick.b);
    }
    return {
      won: s.status === 'won',
      score: s.goals.score,
      stars: RS.Goals.starsFor(s.goals),
      movesLeft: s.goals.movesLeft,
      goalsLeft: s.goals.goals.map(function (g) { return g.target - g.count; })
    };
  }

  function compareKeys(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return a[i] > b[i] ? 1 : -1; }
    }
    return 0;
  }

  function median(list) {
    if (!list.length) { return 0; }
    var a = list.slice().sort(function (x, y) { return x - y; });
    var mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
  }

  // p-Quantil (0..1) einer Liste, nächster Rang
  function quantile(list, p) {
    if (!list.length) { return 0; }
    var a = list.slice().sort(function (x, y) { return x - y; });
    return a[Math.min(a.length - 1, Math.floor(p * a.length))];
  }

  function goalText(g) {
    if (g.type === 'score') { return g.target + ' P'; }
    if (g.type === 'collect') { return g.target + '×F' + g.color; }
    return 'Glasur';
  }

  function pad(v, n) {
    var s = String(v);
    while (s.length < n) { s = ' ' + s; }
    return s;
  }

  // Wendet die Probewerte aus ?set= auf Kopien der Level an.
  function applyOverrides(levels, spec) {
    if (!spec) { return levels; }
    var copy = JSON.parse(JSON.stringify(levels));
    spec.split(';').forEach(function (part) {
      var m = /^(\d+)\.(moves|g\d)=(.+)$/.exec(part.trim());
      if (!m) { throw new Error('unbekannter Probewert: ' + part); }
      var level = copy[Number(m[1]) - 1];
      if (m[2] === 'moves') { level.moves = Number(m[3]); }
      else { level.goals[Number(m[2].slice(1))].target = Number(m[3]); }
    });
    return copy;
  }

  function run() {
    var params = new URLSearchParams(location.search);
    var seeds = Number(params.get('seeds')) || 200;
    var vary = params.get('boards') !== 'fixed';
    var greedy = params.get('bot') === 'greedy';
    var only = params.get('levels') ? params.get('levels').split(',').map(Number) : null;
    var out = document.getElementById('out');
    var lines = [];
    var started = Date.now();

    checkRng();
    RS.createRng = cloneableRng;

    lines.push('Bot-Startwerte je Level: ' + seeds + (vary ? ', Feld-Startwert je Lauf verschieden' : ', fester Level-Startwert') +
      (greedy ? ', Bot: nur Punkte' : ', Bot: zielbewusst'));
    lines.push('Lv Züge Ziele              2★/3★ ab Rest Sieg%  Med.alle  Med.Sieg  1★/2★/3★ (je % aller Läufe)  Med.Restzüge  Sieg-Punkte P10/P50/P90  Med.Zielrest bei Niederlage');
    applyOverrides(RS.LEVELS, params.get('set')).forEach(function (level) {
      if (only && only.indexOf(level.id) < 0) { return; }
      var results = [];
      for (var b = 1; b <= seeds; b++) { results.push(playLevel(level, b, vary, greedy)); }
      var wins = results.filter(function (r) { return r.won; });
      var losses = results.filter(function (r) { return !r.won; });
      var starCount = [0, 0, 0, 0];
      results.forEach(function (r) { starCount[r.stars]++; });
      function pct(n) { return Math.round(n / results.length * 100); }
      lines.push(
        pad(level.id, 2) + ' ' + pad(level.moves, 4) + ' ' +
        (level.goals.map(goalText).join(' + ') + '                  ').slice(0, 18) + ' ' +
        (RS.Goals.starMoves(level.moves).join('/') + '            ').slice(0, 12) + ' ' +
        pad(pct(wins.length), 6) + ' ' +
        pad(median(results.map(function (r) { return r.score; })), 9) + ' ' +
        pad(median(wins.map(function (r) { return r.score; })), 9) + '  ' +
        pad(pct(starCount[1]) + '/' + pct(starCount[2]) + '/' + pct(starCount[3]), 12) +
        pad(median(wins.map(function (r) { return r.movesLeft; })), 30) + '  ' +
        pad([0.1, 0.5, 0.9].map(function (q) {
          return quantile(wins.map(function (r) { return r.score; }), q);
        }).join('/'), 23) + '  ' +
        (losses.length ? level.goals.map(function (g, i) {
          return median(losses.map(function (r) { return r.goalsLeft[i]; }));
        }).join(' + ') : '-')
      );
    });
    lines.push('Laufzeit: ' + Math.round((Date.now() - started) / 1000) + ' s');
    RS.createRng = originalRng;
    out.textContent = lines.join('\n');
    document.getElementById('summary').textContent = 'BALANCE: DONE';
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { run(); }
    catch (e) { document.getElementById('summary').textContent = 'BALANCE: ERROR ' + (e && e.message ? e.message : e); }
  });
})(window.RS = window.RS || {});
