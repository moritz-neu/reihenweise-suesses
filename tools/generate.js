(function (RS) {
  'use strict';

  // Generator der Zwischenlevel (Entwicklerwerkzeug, läuft in tools/generate.html).
  // Aufruf: generate.html?welt=3&seeds=100  (optional &only=w3-04-02 für ein einzelnes Level)
  // Je Welt entstehen 10 Zwischenlevel hinter jedem alten Level außer dem Boss (90 bei 10 alten
  // Leveln). Ein Zwischenlevel folgt seinen alten Nachbarn A (davor) und B (danach; vor dem Boss
  // gilt A als B): nur Mechaniken, die die Welt bis dahin kennt; Dichte, Zielmengen und Regeln
  // wachsen stufenlos von A nach B (Anteil step / 11). Alles hängt nur von festen Startwerten ab.
  // Ausmessen: Der Bot (RS.Balance) schaut nicht auf die übrigen Züge. Jeder Lauf spielt deshalb
  // mit großem Zugvorrat und merkt sich, im wievielten Zug er gewann; daraus folgt die Siegquote
  // für jede Zugzahl. Ziel ist die gemessene Siegquote der beiden alten Nachbarn (stufenlos
  // dazwischen), gewählt wird die Zugzahl nahe den Nachbarn mit der Quote am nächsten daran.
  // Liegt sie außerhalb (5 schwerer, 8 leichter), werden Zielmengen bzw. Hindernisse angepasst (bis 5 Versuche).
  // Ausgabe: <pre id="data"> (JSON der Level) und <pre id="report"> (JSON der Messwerte),
  // <pre id="summary"> GENERATE: DONE oder GENERATE: ERROR …

  var STEPS = 10;
  // Variante beim Nachbessern (&variant=N): andere Feldformen und Zufallswahlen für dasselbe Level.
  var VARIANT = typeof location !== 'undefined' ? (new URLSearchParams(location.search).get('variant') || '') : '';
  var COLOR_NAMES = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];
  var OBSTACLE_CHARS = '12KLIJCXYZ';

  // ---------- Hilfen ----------

  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function count(text, chars) {
    var n = 0;
    for (var i = 0; i < text.length; i++) { if (chars.indexOf(text.charAt(i)) >= 0) { n++; } }
    return n;
  }
  function pick(rng, list) { return list[rng.int(list.length)]; }

  // ---------- Merkmale eines alten Levels ----------

  function features(level) {
    var text = level.layout.join('');
    var f = {
      level: level,
      colors: level.colors,
      moves: level.moves,
      goals: level.isBoss ? [] : level.goals,
      kinds: {},
      obstacles: count(text, OBSTACLE_CHARS),
      voids: count(text, '.'),
      cherries: level.cherries ? level.cherries.total : count(text, 'R'),
      cherryOnBoard: level.cherries ? level.cherries.onBoard : count(text, 'R'),
      fuses: level.fuses || null,
      fuseCells: count(text, 'F'),
      chameleons: level.chameleons || null,
      chameleonCells: count(text, 'H')
    };
    if (/[12K]/.test(text)) { f.kinds.glaze = /2/.test(text) ? 2 : 1; }
    if (/[LK]/.test(text)) { f.kinds.lock = 1; }
    if (/[IJ]/.test(text)) { f.kinds.ice = /J/.test(text) ? 2 : 1; }
    if (/C/.test(text)) { f.kinds.choco = 1; }
    if (/[XYZ]/.test(text)) { f.kinds.crate = /Z/.test(text) ? 3 : /Y/.test(text) ? 2 : 1; }
    return f;
  }

  // ---------- Muster (8 × 8, links-rechts-symmetrisch, nach Vorrang geordnet) ----------

  function mirrorPairs(cells) {
    var out = [];
    var seen = {};
    cells.forEach(function (p) {
      [[p[0], p[1]], [p[0], 7 - p[1]]].forEach(function (q) {
        var k = q[0] * 8 + q[1];
        if (!seen[k]) { seen[k] = true; out.push(q); }
      });
    });
    return out;
  }

  function byRows(rows, cols) {
    var cells = [];
    rows.forEach(function (r) { cols.forEach(function (c) { cells.push([r, c]); }); });
    return cells;
  }

  var HALF = [0, 1, 2, 3];
  var PATTERNS = {
    rowsMiddle: function () { return mirrorPairs(byRows([3, 4, 2, 5], [3, 2, 1, 0])); },
    bandBottom: function () { return mirrorPairs(byRows([7, 6, 5], [3, 2, 1, 0])); },
    bandTop: function () { return mirrorPairs(byRows([2, 3, 1], [3, 2, 1, 0])); },
    corners: function () {
      return mirrorPairs([[7, 0], [6, 0], [7, 1], [6, 1], [0, 0], [1, 0], [0, 1], [1, 1],
        [5, 0], [7, 2], [2, 0], [0, 2], [5, 1], [6, 2], [2, 1], [1, 2]]);
    },
    center: function () {
      return mirrorPairs([[3, 3], [4, 3], [2, 3], [5, 3], [3, 2], [4, 2], [2, 2], [5, 2],
        [1, 3], [6, 3], [3, 1], [4, 1]]);
    },
    frame: function () {
      var cells = [];
      for (var c = 0; c < 4; c++) { cells.push([7, c]); }
      for (var r = 6; r >= 0; r--) { cells.push([r, 0]); }
      for (c = 1; c < 4; c++) { cells.push([0, c]); }
      return mirrorPairs(cells);
    },
    diamond: function () {
      var cells = [];
      for (var r = 0; r < 8; r++) { HALF.forEach(function (c) { cells.push([r, c]); }); }
      cells.sort(function (a, b) {
        return (Math.abs(a[0] - 3.5) + Math.abs(a[1] - 3.5)) - (Math.abs(b[0] - 3.5) + Math.abs(b[1] - 3.5));
      });
      return mirrorPairs(cells.filter(function (p) { return Math.abs(p[0] - 3.5) + Math.abs(p[1] - 3.5) >= 2; }));
    },
    columns: function () { return mirrorPairs(byRows([7, 6, 5, 4, 3, 2], [0]).concat(byRows([7, 6, 5, 4], [1]))); },
    pillars: function () { return mirrorPairs(byRows([7, 6, 5, 4, 3, 2, 1], [2]).concat(byRows([7, 6, 5], [1]))); },
    checker: function () {
      var cells = [];
      [2, 3, 4, 5, 6, 1].forEach(function (r) { HALF.forEach(function (c) { if ((r + c) % 2 === 0) { cells.push([r, c]); } }); });
      return mirrorPairs(cells);
    },
    diagonals: function () {
      var cells = [];
      for (var i = 0; i < 4; i++) { cells.push([7 - i, i]); cells.push([i, i]); }
      for (i = 0; i < 3; i++) { cells.push([6 - i, i]); cells.push([i + 1, i]); }
      return mirrorPairs(cells);
    },
    ring: function () {
      return mirrorPairs([[2, 2], [2, 3], [5, 2], [5, 3], [3, 2], [4, 2], [1, 2], [1, 3], [6, 2], [6, 3],
        [3, 1], [4, 1]]);
    },
    stripes: function () { return mirrorPairs(byRows([1, 3, 5, 7], [1, 2, 3, 0])); }
  };
  var PATTERN_NAMES = Object.keys(PATTERNS);

  var VOIDS = [
    [[0, 0]], [[7, 0]], [[0, 0], [7, 0]], [[3, 0], [4, 0]], [[0, 3]], [[7, 3]], [[0, 0], [0, 1], [1, 0]]
  ];

  // ---------- Ein Zwischenlevel bauen ----------

  // tune: { amount (Faktor Zielmengen), density (Faktor Hindernisse), dropGoal }
  function buildLevel(w, slot, step, A, B, pool, tune, prevPattern) {
    var id = A.level.id + '-' + ('0' + step).slice(-2);
    var rng = RS.Balance.originalRng(hash(id + (VARIANT ? '#' + VARIANT : '')));
    var t = step / (STEPS + 1);
    var near = t < 0.5 ? A : B;
    var far = near === A ? B : A;
    var colors = near.colors;

    // Hindernisarten: die des näheren Nachbarn, oft eine des anderen, selten eine aus dem Vorrat der Welt.
    var kinds = Object.keys(near.kinds);
    Object.keys(far.kinds).forEach(function (k) { if (kinds.indexOf(k) < 0 && rng.next() < 0.5) { kinds.push(k); } });
    if (kinds.length && rng.next() < 0.25) {
      var extra = pool.kinds.filter(function (k) { return kinds.indexOf(k) < 0; });
      if (extra.length) { kinds.push(pick(rng, extra)); }
    }
    if (!kinds.length && pool.kinds.length && (A.obstacles + B.obstacles) > 0) { kinds.push(pick(rng, pool.kinds)); }
    while (kinds.length > 3) { kinds.splice(rng.int(kinds.length), 1); }

    var obstacleTarget = Math.round(lerp(A.obstacles, B.obstacles, t) * (0.8 + rng.next() * 0.4) * tune.density);
    if (!kinds.length) { obstacleTarget = 0; }
    obstacleTarget = clamp(obstacleTarget - obstacleTarget % 2, 0, 30);

    // Mechaniken der Welt: Neuheit immer, sonst wie die Nachbarn.
    var novelty = pool.novelty;
    var wantCherries = pool.cherries && (novelty === 'cherry' || ((A.cherries || B.cherries) && rng.next() < 0.7));
    var wantFuses = pool.fuses && (novelty === 'fuse' || ((A.fuses || B.fuses) && rng.next() < 0.7));
    var wantChameleons = pool.chameleons && (novelty === 'chameleon' || ((A.chameleons || B.chameleons) && rng.next() < 0.7));

    // Feld
    var grid = [];
    for (var r = 0; r < 8; r++) { grid.push('xxxxxxxx'.split('')); }
    if ((A.voids || B.voids) && rng.next() < 0.5) {
      pick(rng, VOIDS).forEach(function (p) { grid[p[0]][p[1]] = '.'; grid[p[0]][7 - p[1]] = '.'; });
    }
    var patternName;
    do { patternName = pick(rng, PATTERN_NAMES); } while (patternName === prevPattern);
    var cells = PATTERNS[patternName]().filter(function (p) { return grid[p[0]][p[1]] === 'x'; });
    var second = PATTERNS[pick(rng, PATTERN_NAMES)]().filter(function (p) { return grid[p[0]][p[1]] === 'x'; });

    function charFor(kind) {
      var level = (near.kinds[kind] || far.kinds[kind] || 1);
      if (kind === 'glaze') { return level >= 2 && rng.next() < 0.6 ? '2' : '1'; }
      if (kind === 'lock') { return rng.next() < 0.3 ? 'K' : 'L'; }
      if (kind === 'ice') { return level >= 2 && rng.next() < 0.5 ? 'J' : 'I'; }
      if (kind === 'choco') { return 'C'; }
      var lv = 1 + rng.int(Math.max(1, level));
      return lv >= 3 ? 'Z' : lv === 2 ? 'Y' : 'X';
    }

    var placed = 0;
    if (obstacleTarget > 0) {
      // Erste Art auf das Hauptmuster, weitere Arten auf ein zweites Muster.
      var shares = kinds.map(function (k, i) { return i === 0 ? 0.6 : 0.4 / (kinds.length - 1); });
      if (kinds.length === 1) { shares = [1]; }
      kinds.forEach(function (kind, i) {
        var want = Math.round(obstacleTarget * shares[i]);
        if (kind === 'choco') { want = Math.min(want, 6); }
        var source = i === 0 ? cells : second;
        var ch = charFor(kind);
        for (var j = 0; j < source.length && want > 0; j += 2) {
          var a = source[j];
          var b = source[j + 1] || a;
          if (grid[a[0]][a[1]] !== 'x' || grid[b[0]][b[1]] !== 'x') { continue; }
          grid[a[0]][a[1]] = ch;
          grid[b[0]][b[1]] = ch;
          want -= a === b ? 1 : 2;
          placed += a === b ? 1 : 2;
        }
      });
    }

    function freeCells(rows) {
      var out = [];
      rows.forEach(function (rr) { for (var c = 0; c < 8; c++) { if (grid[rr][c] === 'x') { out.push([rr, c]); } } });
      return out;
    }
    function putSome(ch, n, rows) {
      var free = freeCells(rows);
      var done = 0;
      while (done < n && free.length) {
        var p = free.splice(rng.int(free.length), 1)[0];
        grid[p[0]][p[1]] = ch;
        done++;
      }
      return done;
    }

    var def = { id: id, colors: colors, moves: 0, goals: [], layout: null };

    if (wantCherries) {
      var total = Math.round(lerp(A.cherries || 3, B.cherries || 3, t));
      total = clamp(total, 2, 4);
      var onBoard = clamp(Math.round(lerp(A.cherryOnBoard || 2, B.cherryOnBoard || 2, t)), 1, total);
      onBoard = putSome('R', onBoard, [0, 1]);
      if (total > onBoard) { def.cherries = { total: total, onBoard: Math.max(onBoard, 1) }; }
      def._cherryTotal = def.cherries ? total : onBoard;
    }
    if (wantFuses) {
      var fa = A.fuses || B.fuses;
      var fb = B.fuses || A.fuses;
      def.fuses = {
        start: Math.round(lerp(fa.start, fb.start, t)),
        spawnEvery: Math.round(lerp(fa.spawnEvery || 0, fb.spawnEvery || 0, t))
      };
      def._fuseCells = putSome('F', clamp(Math.round(lerp(A.fuseCells || 3, B.fuseCells || 3, t)), 2, 5), [1, 2, 3, 4, 5, 6]);
    }
    if (wantChameleons) {
      var ca = A.chameleons || B.chameleons;
      var cb = B.chameleons || A.chameleons;
      def.chameleons = { spawnEvery: Math.max(3, Math.round(lerp(ca.spawnEvery, cb.spawnEvery, t))) };
      putSome('H', clamp(Math.round(lerp(A.chameleonCells || 3, B.chameleonCells || 3, t)), 1, 4), [1, 2, 3, 4, 5, 6]);
    }
    def.layout = grid.map(function (row) { return row.join(''); });
    var text = def.layout.join('');

    // Ziele
    var candidates = [];
    function addType(type) { if (candidates.indexOf(type) < 0) { candidates.push(type); } }
    near.goals.concat(far.goals).forEach(function (g) { addType(g.type); });
    if (/[12K]/.test(text)) { addType('glaze'); }
    if (/[XYZ]/.test(text)) { addType('crate'); }
    candidates = candidates.filter(function (type) {
      if (type === 'glaze') { return /[12K]/.test(text); }
      if (type === 'crate') { return /[XYZ]/.test(text); }
      if (type === 'choco') { return /C/.test(text); }
      if (type === 'cherry') { return Boolean(def._cherryTotal); }
      if (type === 'fuse') { return Boolean(def._fuseCells); }
      return type === 'collect' || type === 'score';
    });
    if (!candidates.length) { candidates = ['collect']; }

    var want = Math.max(near.goals.length, 1);
    if (rng.next() < 0.3) { want = Math.max(far.goals.length, 1); }
    if (tune.dropGoal) { want = 1; }
    want = clamp(want, 1, 3);
    var types = [];
    // Pflichtziele der Neuheit
    if (novelty === 'cherry' && def._cherryTotal) { types.push('cherry'); }
    if (novelty === 'chameleon') { types.push('collect'); }
    var rot = candidates.slice(step % candidates.length).concat(candidates.slice(0, step % candidates.length));
    rot.forEach(function (type) { if (types.length < want && types.indexOf(type) < 0) { types.push(type); } });
    if (!types.length) { types.push(candidates[0]); }

    // Zielmenge aus der Menge je Zug der Nachbarn mal den Zügen in ihrer Nähe, damit ein
    // Zwischenlevel je Zug nicht mehr verlangt als seine Nachbarn.
    function neighbourAmount(type) {
      var a = A.goals.filter(function (g) { return g.type === type; })[0];
      var b = B.goals.filter(function (g) { return g.type === type; })[0];
      var ra = a ? a.target / A.moves : null;
      var rb = b ? b.target / B.moves : null;
      if (ra === null && rb === null) { return null; }
      var movesNear = lerp(A.moves, B.moves, t);
      if (ra === null) { return rb * movesNear; }
      if (rb === null) { return ra * movesNear; }
      return lerp(ra, rb, t) * movesNear;
    }

    var usedColors = [];
    types.forEach(function (type) {
      var g = { type: type };
      if (type === 'collect') {
        var color;
        do { color = rng.int(colors); } while (usedColors.indexOf(color) >= 0 && usedColors.length < colors);
        usedColors.push(color);
        var base = neighbourAmount('collect') || (18 + 1.2 * w);
        g.color = color;
        g.target = clamp(Math.round(base * (0.85 + rng.next() * 0.3) * tune.amount * (types.length > 1 ? 0.85 : 1)), 8, 45);
      } else if (type === 'score') {
        var sb = neighbourAmount('score') || (3000 + 300 * w);
        g.target = clamp(Math.round(sb * (0.85 + rng.next() * 0.3) * tune.amount / 100) * 100, 1500, 12000);
      } else if (type === 'cherry') {
        g.target = def._cherryTotal;
      } else if (type === 'fuse') {
        g.target = clamp(def._fuseCells + (def.fuses.spawnEvery ? 1 : 0), 1, 8);
      }
      def.goals.push(g);
    });
    delete def._cherryTotal;
    def._fuseCellsCount = def._fuseCells || 0;
    delete def._fuseCells;
    def._pattern = patternName;
    return def;
  }

  // ---------- Texte ----------

  function goalPhrase(g) {
    if (g.type === 'collect') { return 'sammle ' + g.target + ' Bonbons in ' + COLOR_NAMES[g.color]; }
    if (g.type === 'score') { return 'hol ' + g.target.toLocaleString('de-DE') + ' Punkte'; }
    if (g.type === 'glaze') { return 'löse die ganze Glasur'; }
    if (g.type === 'crate') { return 'brich alle Kisten auf'; }
    if (g.type === 'choco') { return 'räume die Schokolade fort'; }
    if (g.type === 'cherry') { return g.target === 1 ? 'bring die Kirsche in den Korb' : 'bring ' + g.target + ' Kirschen in den Korb'; }
    if (g.type === 'fuse') { return 'entschärfe ' + g.target + ' Knallbonbons'; }
    return '';
  }

  var OPENERS = ['', 'Auf geht’s: ', 'Weiter so, ', 'Schaffst du das? ', 'Gleich weiter: ', 'Annika ruft: '];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function introFor(def, step) {
    var phrases = def.goals.map(goalPhrase);
    var body = phrases.length > 1 ? phrases.slice(0, -1).join(', ') + ' und ' + phrases[phrases.length - 1] : phrases[0];
    var fuseGoal = def.goals.some(function (g) { return g.type === 'fuse'; });
    var warn = def.fuses && !fuseGoal ? ' Pass auf die Knallbonbons auf!' :
      def.chameleons && step % 3 === 0 ? ' Die Chamäleons wechseln ständig die Farbe!' : '';
    var opener = OPENERS[step % OPENERS.length];
    if (warn && opener === 'Schaffst du das? ') { opener = ''; }
    var text = opener ? (opener.slice(-2) === ': ' || opener.slice(-2) === '? ' ? opener + cap(body) : opener + body) : cap(body);
    return text + '!' + warn;
  }

  // ---------- Messen ----------

  function measure(def, budget, seeds) {
    var wins = [];
    for (var b = 1; b <= seeds; b++) {
      var seed = def.seed !== undefined ? def.seed : RS.Worlds.hashSeed(def.id);
      var r = RS.Balance.playLevel(Object.assign({}, def, { moves: budget, seed: seed }), b, true, false);
      wins.push(r.won ? budget - r.movesLeft : Infinity);
    }
    return function rate(m) {
      return Math.round(wins.filter(function (x) { return x <= m; }).length / seeds * 100);
    };
  }

  function bestMoves(rate, lo, hi, target) {
    var best = lo;
    var bestDiff = Infinity;
    for (var m = lo; m <= hi; m++) {
      var d = Math.abs(rate(m) - target);
      if (d < bestDiff) { best = m; bestDiff = d; }
    }
    return best;
  }

  function startsCleanly(def, seed) {
    var s = RS.Session.startLevel(Object.assign({}, def, { seed: seed }));
    if (s.status !== 'playing') { return false; }
    if (!RS.Board.findPossibleMoves(s.board).length) { return false; }
    return !s.goals.goals.every(function (g) { return g.count >= g.target; });
  }

  // ---------- Welt ----------

  function poolFor(w, olds) {
    var kinds = {};
    olds.forEach(function (o) { Object.keys(features(o).kinds).forEach(function (k) { kinds[k] = true; }); });
    var world = RS.Worlds.get(w);
    var novelty = world.novelty && world.novelty.kind === 'mechanic' ? world.novelty.key : null;
    return {
      kinds: Object.keys(kinds),
      novelty: novelty,
      cherries: w >= 5,
      fuses: w >= 7,
      chameleons: w >= 9
    };
  }

  // Spielraum um die Nachbarn: Züge 0,8- bis 1,4-fach, Zielmengen und Hindernisse 0,5- bis 1,3-fach.
  // Ziel ist die gemessene Siegquote der beiden alten Nachbarn (stufenlos dazwischen), nicht die
  // Kurve: der Bot spielt viel stärker als Menschen und gewinnt frühe alte Level fast immer; ein
  // Zwischenlevel soll sich so schwer anfühlen wie seine Nachbarn. Im Zweifel leichter: bis 5 Punkte
  // schwerer oder 8 Punkte leichter als das Ziel gelten als getroffen.
  var MOVES_LO = 0.8;
  var MOVES_HI = 1.4;
  var K_LO = 0.5;
  var K_HI = 1.3;
  var HARDER = 5;
  var EASIER = 8;

  // only: Liste einzelner Kennungen (Nachbessern); prevs: Muster des Levels davor je Kennung.
  // wide (Nachbessern zu schwerer Level, &tune=2): bis 1,8-fache Züge, Zielmengen und Hindernisse ab 0,3-fach.
  function generateWorld(w, seeds, only, prevs, wide) {
    var world = RS.Worlds.get(w);
    if (!world) { throw new Error('unknown world: ' + w); }
    var olds = RS.Worlds.inWorld(w).filter(function (l) { return !l.step; });
    var pool = poolFor(w, olds);
    var out = [];
    var report = [];
    var prevPattern = null;
    // Siegquote der alten Level bei ihren eigenen Zügen (der Boss zählt nicht).
    var oldRate = olds.map(function (o) { return o.isBoss ? null : measure(o, o.moves, seeds)(o.moves); });
    for (var i = 0; i < olds.length - 1; i++) {
      var A = features(olds[i]);
      var bossNext = olds[i + 1].isBoss;
      var B = bossNext ? A : features(olds[i + 1]);
      var rateA = oldRate[i];
      var rateB = bossNext ? rateA : oldRate[i + 1];
      for (var step = 1; step <= STEPS; step++) {
        var id = olds[i].id + '-' + ('0' + step).slice(-2);
        if (only && only.indexOf(id) < 0) { continue; }
        if (only && prevs && prevs[id]) { prevPattern = prevs[id]; }
        var t = step / (STEPS + 1);
        var target = Math.round(lerp(rateA, rateB, t));
        var movesNear = lerp(A.moves, B.moves, t);
        var lo = Math.max(8, Math.round(movesNear * MOVES_LO));
        var hi = Math.max(lo + 3, Math.round(movesNear * (wide ? 1.8 : MOVES_HI)));
        var kLo = wide ? 0.3 : K_LO;
        var kHi = K_HI;
        var k = 1;
        var tune = { amount: 1, density: 1, dropGoal: false };
        var best = null;
        var trail = [];
        for (var attempt = 1; attempt <= 5; attempt++) {
          tune.amount = k;
          tune.density = k;
          tune.dropGoal = Boolean(wide) && attempt >= 2;   // beim Nachbessern: nur ein Ziel
          var def = buildLevel(w, i + 1, step, A, B, pool, tune, prevPattern);
          if (!startsCleanly(def, RS.Worlds.hashSeed(id))) { kHi = k; k = (kLo + k) / 2; continue; }
          var rate = measure(def, hi, seeds);
          var moves = bestMoves(rate, lo, hi, target);
          var got = rate(moves);
          var diff = got - target;
          var penalty = diff < 0 ? -diff * 2 : diff;   // zu schwer wiegt doppelt
          trail.push(k.toFixed(2) + '/' + moves + ':' + got);
          if (!best || penalty < best.penalty) {
            best = { def: def, moves: moves, measured: got, diff: diff, penalty: penalty, attempt: attempt };
          }
          if (diff >= -HARDER && diff <= EASIER) { break; }
          if (diff < 0) { kHi = k; k = (kLo + k) / 2; }   // zu schwer: leichter machen
          else { kLo = k; k = (k + kHi) / 2; }            // zu leicht: schwerer machen
        }
        if (!best) { throw new Error('kein gültiges Feld für ' + id); }
        var d = best.def;
        d.moves = best.moves;
        // Zündschnur-Ziel muss in den Vorrat passen (Feld plus Nachschub in den Zügen).
        d.goals.forEach(function (g) {
          if (g.type === 'fuse') {
            var supply = d._fuseCellsCount + (d.fuses.spawnEvery ? Math.floor((d.moves - 1) / d.fuses.spawnEvery) : 0);
            g.target = clamp(g.target, 1, supply);
          }
        });
        prevPattern = d._pattern;
        report.push({ id: id, target: target, measured: best.measured, moves: d.moves, attempts: best.attempt, trail: trail.join(' '),
          pattern: d._pattern, goals: d.goals.map(function (g) { return g.type; }).join('+'),
          neighbours: [olds[i].id + ':' + rateA + '%/' + A.moves, (bossNext ? 'Boss' : olds[i + 1].id + ':' + rateB + '%/' + B.moves)] });
        delete d._pattern;
        delete d._fuseCellsCount;
        d.intro = introFor(d, step);
        var lines = world.winLines || ['Geschafft!'];
        d.win = lines[(i * STEPS + step - 1) % lines.length];
        out.push(d);
      }
    }
    return { levels: out, report: report };
  }

  RS.Generate = { generateWorld: generateWorld, buildLevel: buildLevel, introFor: introFor, features: features };

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(location.search);
    if (!params.get('welt')) { return; }
    var summary = document.getElementById('summary');
    try {
      RS.Balance.checkRng();
      RS.createRng = RS.Balance.cloneableRng;
      var started = Date.now();
      var only = params.get('only') ? params.get('only').split(',') : null;
      var prevs = {};
      if (only && params.get('prevs')) {
        params.get('prevs').split(',').forEach(function (p, i) { prevs[only[i]] = p; });
      }
      var res = generateWorld(Number(params.get('welt')), Number(params.get('seeds')) || 100, only, prevs,
        params.get('tune') === '2');
      document.getElementById('data').textContent = JSON.stringify(res.levels);
      document.getElementById('report').textContent = JSON.stringify(res.report);
      summary.textContent = 'GENERATE: DONE ' + res.levels.length + ' Level in ' + Math.round((Date.now() - started) / 1000) + ' s';
    } catch (e) {
      summary.textContent = 'GENERATE: ERROR ' + (e && e.message ? e.message : e) + (e && e.stack ? '\n' + e.stack : '');
    } finally {
      RS.createRng = RS.Balance.originalRng;
    }
  });
})(window.RS = window.RS || {});
