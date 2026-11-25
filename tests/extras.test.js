(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  // Prüfungen für die erzeugten Zwischenlevel (js/data/worlds/wNN-extra.js) und die
  // Reihenfolge von 100 Leveln je Welt.

  var OLD_POS = [1, 12, 23, 34, 45, 56, 67, 78, 89, 100];

  function count(text, chars) {
    var n = 0;
    for (var i = 0; i < text.length; i++) { if (chars.indexOf(text.charAt(i)) >= 0) { n++; } }
    return n;
  }

  function extras() {
    return RS.Worlds.levels().filter(function (l) { return l.step > 0; });
  }

  t('extras: every world holds 100 levels, the old ones on 1, 12, 23 … 100', function () {
    RS.Worlds.list().forEach(function (w) {
      var lv = RS.Worlds.inWorld(w.id);
      eq(lv.length, 100, 'levels in world ' + w.id);
      var old = lv.filter(function (l) { return !l.step; }).map(function (l) { return l.pos; });
      RS.assert.deepEqual(old, OLD_POS, 'old positions in world ' + w.id);
      eq(lv[99].isBoss, true, 'boss last in world ' + w.id);
      eq(lv[99].id, 'w' + w.id + '-10');
    });
    eq(RS.Worlds.levels().length, 1000);
  });

  t('extras: ids, slots and steps follow the old level before them', function () {
    extras().forEach(function (l) {
      var m = /^(w(\d+)-(\d{2}))-(\d{2})$/.exec(l.id);
      ok(m, 'id ' + l.id);
      eq(Number(m[2]), l.world, 'world of ' + l.id);
      eq(Number(m[3]), l.slot, 'slot of ' + l.id);
      eq(Number(m[4]), l.step, 'step of ' + l.id);
      eq(l.pos, (l.slot - 1) * 11 + 1 + l.step, 'pos of ' + l.id);
      eq(l.label, l.world + '-' + l.pos);
    });
  });

  t('extras: layouts are 8x8 and use only mechanics the world already knows', function () {
    extras().forEach(function (l) {
      eq(l.layout.length, 8, 'rows of ' + l.id);
      l.layout.forEach(function (row) {
        eq(row.length, 8, 'row length of ' + l.id);
        ok(/^[x.12KLIJCXYZRFH]+$/.test(row), 'characters in ' + l.id);
      });
      var text = l.layout.join('');
      if (l.world < 2) { ok(!/[IJC]/.test(text), 'no ice or chocolate before world 2 in ' + l.id); }
      if (l.world < 3) { ok(!/[XYZ]/.test(text), 'no crates before world 3 in ' + l.id); }
      if (l.world < 5) { ok(!/R/.test(text) && !l.cherries, 'no cherries before world 5 in ' + l.id); }
      if (l.world < 7) { ok(!/F/.test(text) && !l.fuses, 'no fuses before world 7 in ' + l.id); }
      if (l.world < 9) { ok(!/H/.test(text) && !l.chameleons, 'no chameleons before world 9 in ' + l.id); }
      if (l.world === 5) { ok(/R/.test(text), 'cherries in every world 5 level, ' + l.id); }
      if (l.world === 7) { ok(/F/.test(text) && l.fuses, 'fuses in every world 7 level, ' + l.id); }
      if (l.world === 9) { ok(/H/.test(text) && l.chameleons, 'chameleons in every world 9 level, ' + l.id); }
    });
  });

  t('extras: every goal is reachable', function () {
    extras().forEach(function (l) {
      var text = l.layout.join('');
      ok(l.goals.length >= 1 && l.goals.length <= 3, 'goal count of ' + l.id);
      ok(l.moves >= 7 && l.moves <= 70, 'moves of ' + l.id);
      ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id);
      l.goals.forEach(function (g) {
        if (g.type === 'collect') { ok(g.color >= 0 && g.color < l.colors && g.target > 0, 'collect in ' + l.id); }
        if (g.type === 'score') { ok(g.target > 0, 'score in ' + l.id); }
        if (g.type === 'glaze') { ok(/[12K]/.test(text), 'glaze for the goal in ' + l.id); }
        if (g.type === 'crate') { ok(/[XYZ]/.test(text), 'crates for the goal in ' + l.id); }
        if (g.type === 'choco') { ok(/C/.test(text), 'chocolate for the goal in ' + l.id); }
        if (g.type === 'cherry') {
          var total = l.cherries ? l.cherries.total : count(text, 'R');
          ok(g.target >= 1 && g.target <= total, 'cherries for the goal in ' + l.id);
        }
        if (g.type === 'fuse') {
          var spawned = l.fuses.spawnEvery ? Math.floor((l.moves - 1) / l.fuses.spawnEvery) : 0;
          ok(g.target >= 1 && g.target <= count(text, 'F') + spawned, 'fuses for the goal in ' + l.id);
        }
      });
      if (l.world === 9) { ok(l.goals.some(function (g) { return g.type === 'collect'; }), 'collect goal in ' + l.id); }
    });
  });

  t('extras: every level starts without a match, with a possible move and open goals', function () {
    extras().forEach(function (l) {
      var s = RS.Session.startLevel(l);
      eq(s.status, 'playing', 'status of ' + l.id);
      ok(RS.Board.findPossibleMoves(s.board).length > 0, 'possible move in ' + l.id);
      eq(RS.Board.findMatches(s.board).length, 0, 'no match at the start of ' + l.id);
      ok(!s.goals.goals.every(function (g) { return g.count >= g.target; }), 'open goals in ' + l.id);
    });
  });

  t('extras: texts name the task and come from the world', function () {
    var colors = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];
    extras().forEach(function (l) {
      ok(typeof l.intro === 'string' && l.intro.length > 10, 'intro of ' + l.id);
      ok(l.intro.indexOf('—') < 0 && l.win.indexOf('—') < 0, 'no long dash in ' + l.id);
      l.goals.forEach(function (g) {
        if (g.type === 'collect') { ok(l.intro.indexOf(colors[g.color]) >= 0, 'color named in ' + l.id); }
      });
      ok(RS.Worlds.get(l.world).winLines.indexOf(l.win) >= 0, 'win line of ' + l.id);
    });
  });

  t('extras: curve targets of intermediate levels lie between their old neighbours', function () {
    extras().forEach(function (l) {
      var lv = RS.Worlds.inWorld(l.world);
      var before = lv[(l.slot - 1) * 11];
      var after = lv[l.slot * 11];
      var a = RS.Curve.target(before);
      var b = RS.Curve.target(after);
      var v = RS.Curve.target(l);
      ok(v <= Math.max(a, b) + 0.5 && v >= Math.min(a, b) - 0.5, 'target of ' + l.id);
    });
  });

  // Ein Zwischenlevel darf nicht viel mehr verlangen als seine alten Nachbarn (Spieltest 25.11.2026:
  // erzeugte Level mit 7400 Punkten in 11 Zügen neben 3000 Punkten in 20 Zügen).
  t('extras: at least the moves of the neighbours and at most 10 % more demand per move', function () {
    extras().forEach(function (l) {
      var lv = RS.Worlds.inWorld(l.world);
      var a = lv[(l.slot - 1) * 11];
      var b = lv[l.slot * 11];
      var near = b.isBoss ? [a] : [a, b];
      var bMoves = b.isBoss ? a.moves : b.moves;
      var movesNear = Math.round(a.moves + (bMoves - a.moves) * l.step / 11);
      ok(l.moves >= movesNear, 'moves of ' + l.id + ' (' + l.moves + ' vs ' + movesNear + ')');
      l.goals.forEach(function (g) {
        if (g.type !== 'score' && g.type !== 'collect') { return; }
        var rates = [];
        near.forEach(function (n) {
          n.goals.forEach(function (h) { if (h.type === g.type) { rates.push(h.target / n.moves); } });
        });
        if (!rates.length) { return; }
        var max = Math.max.apply(null, rates);
        ok(g.target / l.moves <= max * 1.1 + 1e-9, g.type + ' per move in ' + l.id + ' (' + (g.target / l.moves).toFixed(1) +
          ' vs ' + max.toFixed(1) + ')');
      });
    });
  });
})(window.RS = window.RS || {});
