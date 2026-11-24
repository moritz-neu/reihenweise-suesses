(function (RS) {
  'use strict';

  // Balancing-Simulator (Entwicklerwerkzeug, nicht Teil von tests.html).
  // Ein Bot spielt jedes Level mit vielen Bot-Startwerten: Er probiert jeden möglichen Zug
  // auf einer Kopie der Sitzung aus und nimmt den besten. Zielbewusst (Standard): zuerst
  // ein Zug, der das Level gewinnt, dann der meiste Fortschritt auf die offenen Ziele, dann
  // die meisten Punkte. Gleichstände entscheidet sein eigener Zufallsgenerator.
  // Aufruf: balance.html?seeds=200&welt=3  (Standard: 200 Startwerte, alle Level der Registry)
  // &welt=N spielt eine Welt, &levels=w3-01,w3-02 einzelne Level (Ids).
  // Probewerte ohne die Weltdateien zu ändern: &set=w3-01.moves=30;w1-05.g1=20
  // (gN = Zielmenge des N-ten Ziels, hp = Leben des Bosses im Level: &set=w3-10.hp=500).
  // Je Zeile: Zielquote aus RS.Curve, gemessene Quote und Urteil (OK, ZU LEICHT, ZU SCHWER; Toleranz RS.Curve.TOLERANCE).
  // Standard: jeder Lauf bekommt einen eigenen Feld-Startwert (wechselnde Verläufe).
  // &boards=fixed nutzt den festen Level-Startwert; dann spielt der Bot in manchen Leveln
  // jede Partie gleich und die Siegquote ist nur 0 oder 100 %.
  // Kirschen, Zündschnur-Bonbons und Chamäleons: Kirschziel und Kirschen-Weg nach unten sowie
  // entschärfte Bonbons zählen als Fortschritt, Zähler <= 2 werden vorrangig entschärft; Chamäleons
  // braucht keine Sonderbehandlung.
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
      boss: s.boss ? JSON.parse(JSON.stringify(s.boss)) : null,
      moveNo: s.moveNo,
      lostBy: s.lostBy,
      status: s.status
    };
  }

  // ---------- Bot ----------

  var CHERRY_ROW = 0.2;    // Fortschritt je Zeile, die eine Kirsche nach unten rutscht
  var DANGER = 2;          // Zähler, ab dem ein Zündschnur-Bonbon als gefährlich gilt
  var DANGER_DEFUSE = 5;   // Fortschritt für das Entschärfen eines gefährlichen Bonbons

  // Fortschritt eines Zugs auf die noch offenen Ziele (wie ein Mensch, der auf die Ziele
  // spielt): Glasurschichten für ein Glasurziel, Bonbons der Farbe für ein Sammelziel,
  // Punkte nur für ein offenes Punkteziel, entfernte Schokolade für ein Schokoladenziel,
  // Bossschaden für ein Bossziel, jeder Kistentreffer für ein Kistenziel, jede eingesammelte
  // Kirsche und jedes entschärfte Zündschnur-Bonbon für das jeweilige Ziel (Joker nutzt der Bot nie).
  // Jeweils höchstens bis zum Rest des Ziels. Dazu mechanicBonus (Kirschen-Weg, Gefahrenregel).
  function goalProgress(before, events, gain) {
    var progress = 0;
    before.goals.forEach(function (g) {
      var rest = g.target - g.count;
      if (rest <= 0) { return; }
      var n = 0;
      events.forEach(function (e) {
        if (g.type === 'glaze' && e.type === 'obstacleHit' && e.kind === 'glaze') { n++; }
        if (g.type === 'choco' && e.type === 'obstacleHit' && e.kind === 'choco') { n++; }
        if (g.type === 'crate' && e.type === 'obstacleHit' && e.kind === 'crate') { n++; }
        if (g.type === 'cherry' && e.type === 'cherryCollected') { n++; }
        if (g.type === 'fuse' && e.type === 'fuseDefused') { n++; }
        if (g.type === 'boss' && e.type === 'bossDamaged') { n += e.damage; }
        if (g.type === 'collect' && e.type === 'cleared') {
          n += e.candies.filter(function (c) { return c.color === g.color; }).length;
        }
      });
      if (g.type === 'score') { n = gain / RS.Engine.POINTS.CANDY; }
      progress += Math.min(rest, n);
    });
    return progress;
  }

  // Zeile jedes Kirschen-Bonbons (Id -> Zeile) auf dem Feld.
  function cherryRows(board) {
    var rows = {};
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (candy && candy.cherry) { rows[candy.id] = r; }
      }
    }
    return rows;
  }

  // Ids der Bonbons mit Zündschnur-Zähler <= DANGER auf dem Feld.
  function dangerousFuses(board) {
    var ids = {};
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (candy && candy.fuse !== undefined && candy.fuse <= DANGER) { ids[candy.id] = true; }
      }
    }
    return ids;
  }

  // Zusatzfortschritt: Kirschen, die im Probezug nach unten rutschen (je Zeile 0,2, nur bei
  // offenem Kirschenziel), und Entschärfen eines Bonbons mit Zähler <= 2 (je 5).
  function mechanicBonus(before, trial, events) {
    var bonus = 0;
    var open = function (type) {
      return before.goals.goals.some(function (g) { return g.type === type && g.target - g.count > 0; });
    };
    if (open('cherry')) {
      var was = cherryRows(before.board);
      var now = cherryRows(trial.board);
      Object.keys(was).forEach(function (id) {
        if (now[id] !== undefined) { bonus += Math.max(0, now[id] - was[id]) * CHERRY_ROW; }
      });
      events.forEach(function (e) {
        if (e.type === 'cherryCollected' && was[e.id] !== undefined) { bonus += Math.max(0, e.pos.r - was[e.id]) * CHERRY_ROW; }
      });
    }
    var danger = dangerousFuses(before.board);
    events.forEach(function (e) {
      if (e.type === 'fuseDefused' && danger[e.id]) { bonus += DANGER_DEFUSE; }
    });
    return bonus;
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
      // Sternenzauber, sobald die Leiste voll ist (kostet keinen Zug).
      if (s.boss && s.boss.charge >= RS.Boss.SPELL_MAX) {
        RS.Session.starSpell(s);
        continue;
      }
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
          goalProgress(s.goals, events, gain) + mechanicBonus(s, trial, events),
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

  function goalText(g, level) {
    if (g.type === 'score') { return g.target + ' P'; }
    if (g.type === 'collect') { return g.target + '×F' + g.color; }
    if (g.type === 'choco') { return 'Schoko'; }
    if (g.type === 'crate') { return 'Kisten'; }
    if (g.type === 'cherry') { return g.target + ' Kirschen'; }
    if (g.type === 'fuse') { return g.target + ' Zündschn.'; }
    if (g.type === 'boss') { return 'Boss ' + RS.BOSSES[level.boss].hp + ' LP'; }
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
      var m = /^(w\d+-\d+)\.(moves|hp|g\d)=(.+)$/.exec(part.trim());
      if (!m) { throw new Error('unbekannter Probewert: ' + part); }
      var level = copy.filter(function (l) { return l.id === m[1]; })[0];
      if (!level) { throw new Error('unbekanntes Level im Probewert: ' + part); }
      if (m[2] === 'moves') { level.moves = Number(m[3]); }
      else if (m[2] === 'hp') { RS.BOSSES[level.boss].hp = Number(m[3]); }
      else { level.goals[Number(m[2].slice(1)) - 1].target = Number(m[3]); }
    });
    return copy;
  }

  function verdictFor(measured, target) {
    if (measured > target + RS.Curve.TOLERANCE) { return 'ZU LEICHT'; }
    if (measured < target - RS.Curve.TOLERANCE) { return 'ZU SCHWER'; }
    return 'OK';
  }

  function run() {
    var params = new URLSearchParams(location.search);
    var seeds = Number(params.get('seeds')) || 200;
    var vary = params.get('boards') !== 'fixed';
    var greedy = params.get('bot') === 'greedy';
    var only = params.get('levels') ? params.get('levels').split(',') : null;
    var welt = params.get('welt') ? Number(params.get('welt')) : null;
    var out = document.getElementById('out');
    var lines = [];
    var started = Date.now();

    checkRng();
    RS.createRng = cloneableRng;

    lines.push('Bot-Startwerte je Level: ' + seeds + (vary ? ', Feld-Startwert je Lauf verschieden' : ', fester Level-Startwert') +
      (greedy ? ', Bot: nur Punkte' : ', Bot: zielbewusst'));
    lines.push('Level  Züge Ziele              2★/3★ ab Rest Ziel% Sieg% Urteil     Med.alle  Med.Sieg  1★/2★/3★ (je % aller Läufe)  Med.Restzüge  Sieg-Punkte P10/P50/P90  Med.Zielrest bei Niederlage');
    var verdicts = { 'ZU LEICHT': 0, 'ZU SCHWER': 0 };
    applyOverrides(RS.Worlds.levels(), params.get('set')).forEach(function (level) {
      if (only && only.indexOf(level.id) < 0) { return; }
      if (welt !== null && level.world !== welt) { return; }
      var results = [];
      for (var b = 1; b <= seeds; b++) { results.push(playLevel(level, b, vary, greedy)); }
      var wins = results.filter(function (r) { return r.won; });
      var losses = results.filter(function (r) { return !r.won; });
      var starCount = [0, 0, 0, 0];
      results.forEach(function (r) { starCount[r.stars]++; });
      function pct(n) { return Math.round(n / results.length * 100); }
      var target = RS.Curve.target(level);
      var measured = pct(wins.length);
      var verdict = verdictFor(measured, target);
      if (verdict !== 'OK') { verdicts[verdict]++; }
      lines.push(
        pad(level.id, 6) + ' ' + pad(level.moves, 4) + ' ' +
        (level.goals.map(function (g) { return goalText(g, level); }).join(' + ') + '                  ').slice(0, 18) + ' ' +
        (RS.Goals.starMoves(level.moves).join('/') + '            ').slice(0, 12) + ' ' +
        pad(target, 6) + ' ' + pad(measured, 5) + ' ' + (verdict + '          ').slice(0, 10) + ' ' +
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
    lines.push('Außerhalb der Toleranz (±' + RS.Curve.TOLERANCE + '): ' + verdicts['ZU LEICHT'] + ' zu leicht, ' + verdicts['ZU SCHWER'] + ' zu schwer');
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
