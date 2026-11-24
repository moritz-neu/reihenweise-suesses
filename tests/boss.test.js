(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }
  function indexOfType(events, type) {
    for (var i = 0; i < events.length; i++) { if (events[i].type === type) { return i; } }
    return -1;
  }
  function count(board, grid, test) {
    var n = 0;
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) { if (test(board[grid][r][c])) { n++; } }
    }
    return n;
  }
  // Damage that takes a fresh boss down to exactly 50 % (phase 2), whatever its hp.
  function half(boss) { return Math.ceil(boss.max / 2); }
  function cleared(colors) {
    return { type: 'cleared', points: 0, candies: colors.map(function (c, i) {
      return { id: i, color: c, special: null, pos: P(0, i) };
    }) };
  }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  var ROWS = ['1 2 3 4 5 1', '2 3 4 1 2 5', '3 4 5 1 4 5', '0 0 2 0 4 3'];
  // Swapping the two stripes at (3,0) and (3,1) is a combo.
  var COMBO_ROWS = ['1 2 3 4 5 1', '2 3 4 1 2 5', '3 4 5 1 4 5', '0h 1h 2 3 4 3'];
  var FULL = 'xxxxxxxx';

  function levelDef(boss, goals, layout, moves) {
    return { id: 't', colors: 5, seed: 1, moves: moves || 36, layout: layout || [], goals: goals, boss: boss };
  }
  function bossSession(rows, opts, boss, goals, moves) {
    return RS.Session._fromBoard(levelDef(boss || 'lakritz', goals || [{ type: 'boss' }], [], moves),
      B.fromRows(rows || ROWS, opts || { colors: 5 }));
  }
  function play(s) { return RS.Session.move(s, P(3, 2), P(3, 3)); }
  function layoutSession(layout, boss, goals) {
    return RS.Session.startLevel(levelDef(boss || 'lakritz', goals || [{ type: 'boss' }], layout, 36));
  }

  // Damage
  t('boss: 1 damage per candy, 2 in weak colour', function () {
    var boss = RS.Boss.create('lakritz');
    eq(boss.weak, 0);
    eq(RS.Boss.damageFrom(boss, [cleared([1, 2, 3])], false), 3);
    eq(RS.Boss.damageFrom(boss, [cleared([0, 0, 1]), cleared([0])], false), 7);
    eq(RS.Boss.damageFrom(boss, [cleared([null, 0])], false), 3);
  });

  t('boss: combo bonus 10', function () {
    var boss = RS.Boss.create('lakritz');
    eq(RS.Boss.damageFrom(boss, [cleared([1, 2])], true), 12);
    var s = bossSession(COMBO_ROWS);
    var ev = RS.Session.move(s, P(3, 0), P(3, 1));
    eq(ofType(ev, 'swapRejected').length, 0);
    var damaged = ofType(ev, 'bossDamaged');
    eq(damaged.length, 1);
    var expected = RS.Boss.damageFrom(RS.Boss.create('lakritz'), ev, false) + RS.Boss.COMBO_BONUS;
    eq(damaged[0].damage, expected);
    eq(s.boss.hp, s.boss.max - expected);
    var plain = bossSession(ROWS);
    var ev2 = play(plain);
    eq(ofType(ev2, 'bossDamaged')[0].damage, RS.Boss.damageFrom(RS.Boss.create('lakritz'), ev2, false));
  });

  t('boss: goal follows hp and the win check works as today', function () {
    var s = bossSession(ROWS);
    var ev = play(s);
    var g = s.goals.goals[0];
    eq(g.target, s.boss.max);
    eq(g.count, s.boss.max - s.boss.hp);
    eq(ofType(ev, 'goalProgress').length, 1);
  });

  t('boss: hammer deals damage, no attack', function () {
    var s = bossSession(ROWS);
    s.boss.counter = 2;
    var ev = RS.Session.smash(s, P(3, 0));
    var damaged = ofType(ev, 'bossDamaged');
    eq(damaged.length, 1);
    ok(damaged[0].damage >= 1);
    eq(ofType(ev, 'bossAttack').length, 0);
    eq(s.boss.counter, 2);
    eq(s.boss.charge, ofType(ev, 'spellCharge')[0].charge);
  });

  // Phases
  t('boss: phase 2 exactly once at 50 %', function () {
    var boss = RS.Boss.create('lakritz');
    eq(ofType(RS.Boss.apply(boss, half(boss) - 1), 'bossPhase').length, 0);
    eq(boss.phase, 1);
    var ev = RS.Boss.apply(boss, 1);
    eq(ofType(ev, 'bossPhase').length, 1);
    eq(ofType(ev, 'bossPhase')[0].phase, 2);
    eq(boss.phase, 2);
    eq(ofType(RS.Boss.apply(boss, 20), 'bossPhase').length, 0);
    eq(boss.hp, boss.max - half(boss) - 20);
  });

  t('boss: weak colour changes in phase 2', function () {
    var boss = RS.Boss.create('lakritz');
    var ev = RS.Boss.apply(boss, half(boss));
    eq(boss.weak, 3);
    eq(ofType(ev, 'bossPhase')[0].weak, 3);
    eq(RS.Boss.damageFrom(boss, [cleared([0, 3])], false), 3);
    var k = RS.Boss.create('kandara');
    eq(k.weak, 1);
    RS.Boss.apply(k, half(k));
    eq(k.weak, 4);
  });

  t('boss: defeat emits bossDefeated and hp never below 0', function () {
    var boss = RS.Boss.create('lakritz');
    var ev = RS.Boss.apply(boss, 1000);
    eq(boss.hp, 0);
    eq(ofType(ev, 'bossDefeated').length, 1);
    eq(ofType(ev, 'bossDamaged')[0].hp, 0);
  });

  // Attacks
  t('boss: lakritz attacks after every 3rd move in both phases, the counter carries over', function () {
    var board = B.create({ rows: 8, cols: 8, colors: 5, seed: 3 });
    var boss = RS.Boss.create('lakritz');
    eq(RS.Boss.step(boss, board).length, 0);
    eq(RS.Boss.step(boss, board).length, 0);
    eq(ofType(RS.Boss.step(boss, board), 'bossAttack').length, 1);
    eq(boss.counter, 0);
    eq(RS.Boss.step(boss, board).length, 0);
    RS.Boss.apply(boss, half(boss));
    eq(boss.counter, 1);
    eq(RS.Boss.step(boss, board).length, 0);
    eq(ofType(RS.Boss.step(boss, board), 'bossAttack').length, 1);
    eq(RS.Boss.step(boss, board).length, 0);
    eq(RS.Boss.step(boss, board).length, 0);
    eq(ofType(RS.Boss.step(boss, board), 'bossAttack').length, 1);
  });

  t('boss: a swap move counts and attacks through the session', function () {
    var s = bossSession(ROWS);
    s.boss.counter = 2;
    var ev = play(s);
    eq(ofType(ev, 'bossAttack').length, 1);
    eq(ofType(ev, 'bossAttack')[0].boss, 'lakritz');
  });

  t('boss: no attack after winning or losing move', function () {
    var won = bossSession(ROWS, null, 'lakritz', [{ type: 'score', target: 60 }]);
    won.boss.counter = 2;
    var ev = play(won);
    eq(won.status, 'won');
    eq(ofType(ev, 'bossAttack').length, 0);
    eq(won.boss.counter, 2);
    var lost = bossSession(ROWS, null, 'lakritz', [{ type: 'score', target: 100000 }], 1);
    lost.boss.counter = 2;
    ev = play(lost);
    eq(lost.status, 'lost');
    eq(ofType(ev, 'bossAttack').length, 0);
    eq(lost.boss.counter, 2);
  });

  t('boss: lakritz phase 2 locks 2 + 3 cells in one row', function () {
    var board = B.create({ rows: 8, cols: 8, colors: 5, seed: 7 });
    var boss = RS.Boss.create('lakritz');
    RS.Boss.apply(boss, half(boss));
    boss.counter = 2;
    var atk = ofType(RS.Boss.step(boss, board), 'bossAttack')[0];
    eq(atk.kind, 'lock');
    eq(atk.phase, 2);
    eq(atk.cells.length, 5);
    eq(count(board, 'lock', Boolean), 5);
    for (var i = 1; i < 3; i++) {
      eq(atk.cells[i].r, atk.cells[0].r);
      eq(atk.cells[i].c, atk.cells[0].c + i);
    }
    var phase1 = RS.Boss.create('lakritz');
    phase1.counter = 2;
    var b2 = B.create({ rows: 8, cols: 8, colors: 5, seed: 8 });
    eq(ofType(RS.Boss.step(phase1, b2), 'bossAttack')[0].cells.length, 2);
    eq(count(b2, 'lock', Boolean), 2);
  });

  t('boss: kandara phase 1 glaze 2, phase 2 ice 2', function () {
    var board = B.create({ rows: 8, cols: 8, colors: 5, seed: 5 });
    var boss = RS.Boss.create('kandara');
    boss.counter = 2;
    var atk = ofType(RS.Boss.step(boss, board), 'bossAttack')[0];
    eq(atk.kind, 'glaze');
    eq(atk.level, 2);
    eq(atk.cells.length, 3);
    atk.cells.forEach(function (p) { eq(board.glaze[p.r][p.c], 2); });
    RS.Boss.apply(boss, half(boss));
    boss.counter = 1;
    atk = ofType(RS.Boss.step(boss, board), 'bossAttack')[0];
    eq(atk.kind, 'ice');
    eq(atk.level, 2);
    eq(atk.cells.length, 3);
    atk.cells.forEach(function (p) { eq(board.ice[p.r][p.c], 2); });
  });

  t('boss: 200 random attacks never target specials or blocked cells and always leave a possible move', function () {
    var layout = [FULL, 'xLxxIxxx', 'xxxCxxxx', 'xx2xxxLx', FULL, 'xxxxJxxx', 'xCxxxxxx', FULL];
    for (var i = 0; i < 200; i++) {
      var board = B.create({ rows: 8, cols: 8, colors: 5, seed: 100 + i, layout: layout });
      // sprinkle specials so the attack has to avoid them
      for (var k = 0; k < 6; k++) {
        var p = P(board.rng.int(8), board.rng.int(8));
        var candy = board.candies[p.r][p.c];
        if (candy && !board.choco[p.r][p.c]) { candy.special = k % 2 ? 'stripeH' : 'bomb'; }
      }
      var boss = RS.Boss.create(i % 2 ? 'kandara' : 'lakritz');
      if (i % 4 >= 2) { RS.Boss.apply(boss, boss.max / 2); }
      boss.counter = 5;
      var free = {};
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) { free[r + ',' + c] = RS.Obstacles.isFree(board, P(r, c)); }
      }
      var glazeBefore = board.glaze.map(function (row) { return row.slice(); });
      var ev = RS.Boss.step(boss, board);
      var atk = ofType(ev, 'bossAttack')[0];
      ok(atk, 'attack ' + i);
      atk.cells.forEach(function (q) {
        ok(free[q.r + ',' + q.c], 'target free ' + i);
        if (atk.kind === 'glaze') { eq(glazeBefore[q.r][q.c], 0); }
      });
      ok(B.findPossibleMoves(board).length > 0, 'possible move ' + i);
    }
  });


  // Bosses with a list of phases and the crate attack
  var temps = [];
  function tempBoss(key, d) {
    RS.BOSSES[key] = d;
    if (temps.indexOf(key) < 0) { temps.push(key); }
    return RS.Boss.create(key);
  }
  function dropTemps() {
    temps.forEach(function (k) { delete RS.BOSSES[k]; });
    temps = [];
  }
  // A test that registers temporary bosses always removes them again, even when it fails.
  function tt(name, fn) {
    t(name, function () {
      try { fn(); } finally { dropTemps(); }
    });
  }
  function threePhase() {
    return tempBoss('tPhases', { name: 'T', hp: 100, weak: [0, 1, 2], thresholds: [0.66, 0.33],
      attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'ice', count: 1, level: 1, every: 2 },
        { kind: 'crate', count: 2, level: 2, every: 1 }] });
  }

  tt('boss: three phases switch at 66 % and 33 %', function () {
    var boss = threePhase();
    eq(boss.phase, 1);
    eq(boss.weak, 0);
    eq(ofType(RS.Boss.apply(boss, 33), 'bossPhase').length, 0);
    var ev = RS.Boss.apply(boss, 1);
    eq(boss.hp, 66);
    eq(boss.phase, 2);
    eq(boss.weak, 1);
    eq(ofType(ev, 'bossPhase').length, 1);
    eq(ofType(ev, 'bossPhase')[0].phase, 2);
    eq(ofType(ev, 'bossPhase')[0].weak, 1);
    eq(ofType(RS.Boss.apply(boss, 10), 'bossPhase').length, 0);
    ev = RS.Boss.apply(boss, 23);
    eq(boss.hp, 33);
    eq(boss.phase, 3);
    eq(boss.weak, 2);
    eq(ofType(ev, 'bossPhase')[0].phase, 3);
    eq(ofType(RS.Boss.apply(boss, 5), 'bossPhase').length, 0);
    eq(boss.phase, 3);
  });

  tt('boss: one big hit crosses two thresholds', function () {
    var boss = threePhase();
    boss.counter = 1;
    var ev = RS.Boss.apply(boss, 70);
    var phases = ofType(ev, 'bossPhase');
    eq(phases.length, 2);
    eq(phases[0].phase, 2);
    eq(phases[0].weak, 1);
    eq(phases[1].phase, 3);
    eq(phases[1].weak, 2);
    eq(boss.phase, 3);
    eq(boss.weak, 2);
    eq(boss.counter, 1);
    ok(indexOfType(ev, 'bossDamaged') < indexOfType(ev, 'bossPhase'));
    // a killing blow crosses no further phase
    var dead = threePhase();
    eq(ofType(RS.Boss.apply(dead, 100), 'bossPhase').length, 0);
    eq(dead.phase, 1);
  });

  tt('boss: a def without thresholds has two phases at 50 %', function () {
    var boss = tempBoss('tPlain', { name: 'T', hp: 40, weak: [0, 3],
      attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }] });
    eq(ofType(RS.Boss.apply(boss, 19), 'bossPhase').length, 0);
    eq(ofType(RS.Boss.apply(boss, 1), 'bossPhase').length, 1);
    eq(boss.phase, 2);
    eq(boss.weak, 3);
  });

  tt('boss: crate attack hits free candies only', function () {
    var layout = [FULL, 'xLxxIxxx', 'xxxCxxxx', 'xx2xxxLx', FULL, 'xxxxJxxx', 'xCxxxxxx', FULL];
    for (var i = 0; i < 100; i++) {
      var board = B.create({ rows: 8, cols: 8, colors: 5, seed: 300 + i, layout: layout });
      for (var k = 0; k < 6; k++) {
        var p = P(board.rng.int(8), board.rng.int(8));
        var candy = board.candies[p.r][p.c];
        if (candy && !board.choco[p.r][p.c]) { candy.special = k % 2 ? 'stripeH' : 'bomb'; }
      }
      var boss = threePhase();
      RS.Boss.apply(boss, 70);
      boss.counter = 0;
      var free = {};
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) { free[r + ',' + c] = RS.Obstacles.isFree(board, P(r, c)); }
      }
      var ev = RS.Boss.step(boss, board);
      var atk = ofType(ev, 'bossAttack')[0];
      ok(atk, 'attack ' + i);
      eq(atk.kind, 'crate');
      eq(atk.level, 2);
      eq(atk.phase, 3);
      eq(atk.cells.length, 2);
      atk.cells.forEach(function (q) {
        ok(free[q.r + ',' + q.c], 'target free ' + i);
        eq(board.crate[q.r][q.c], 2);
        eq(board.candies[q.r][q.c], null);
      });
      eq(count(board, 'crate', function (v) { return v > 0; }), 2 + count(B.create({ rows: 8, cols: 8, colors: 5, seed: 1, layout: layout }), 'crate', function (v) { return v > 0; }));
      ok(B.findPossibleMoves(board).length > 0, 'possible move ' + i);
    }
  });

  t('spell: clears crates after locks before glaze', function () {
    // 2 ice, 2 locks, 2 crates (level 3 and 2), 3 glaze: ice, locks and crates fill the six slots
    var layout = [FULL, 'xIIxxxxx', 'xxxLLxxx', 'xxxxxxZY', '1x1x1xxx', FULL, FULL, FULL];
    var s = layoutSession(layout);
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    eq(ofType(ev, 'spellCast')[0].cells.length, 6);
    eq(count(s.board, 'ice', function (v) { return v > 0; }), 0);
    eq(count(s.board, 'lock', Boolean), 0);
    eq(count(s.board, 'crate', function (v) { return v > 0; }), 0);
    eq(count(s.board, 'glaze', function (v) { return v > 0; }), 3);
    eq(count(s.board, 'candies', function (v) { return v === null; }), 0, 'no empty cell left');
    var crateHits = ofType(ev, 'obstacleHit').filter(function (e) { return e.kind === 'crate'; });
    eq(crateHits.length, 5);
    // crates beat glaze when slots run short: 5 ice/lock cells leave one slot
    var s2 = layoutSession([FULL, 'xIIxxxxx', 'xxxLLLxx', 'xxxxxxZ1', FULL, FULL, FULL, FULL]);
    s2.boss.charge = 40;
    RS.Session.starSpell(s2);
    eq(count(s2.board, 'crate', function (v) { return v > 0; }), 0);
    eq(count(s2.board, 'glaze', function (v) { return v > 0; }), 1);
  });

  // Spell
  t('spell: charge caps at 40', function () {
    var boss = RS.Boss.create('lakritz');
    var ev = RS.Boss.charge(boss, 15);
    eq(ev[0].type, 'spellCharge');
    eq(ev[0].charge, 15);
    eq(ev[0].max, 40);
    RS.Boss.charge(boss, 100);
    eq(boss.charge, 40);
    eq(RS.Boss.SPELL_MAX, 40);
  });

  t('spell: only at full charge', function () {
    var s = layoutSession([FULL, 'xxIxxxxx', FULL, FULL, FULL, FULL, FULL, FULL]);
    s.boss.charge = 39;
    eq(RS.Session.starSpell(s).length, 0);
    eq(s.boss.charge, 39);
    s.boss.charge = 40;
    ok(ofType(RS.Session.starSpell(s), 'spellCast').length === 1);
    eq(s.boss.charge, 0);
  });

  t('spell: 25 damage and up to 6 obstacles, ice before lock before glaze', function () {
    var layout = [FULL, 'xIIxxxxx', 'xxxLLLxx', '1x1x1x1x', FULL, FULL, FULL, FULL];
    var s = layoutSession(layout);
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    var cast = ofType(ev, 'spellCast')[0];
    eq(cast.cells.length, 6);
    eq(count(s.board, 'ice', function (v) { return v > 0; }), 0);
    eq(count(s.board, 'lock', Boolean), 0);
    eq(count(s.board, 'glaze', function (v) { return v > 0; }), 3);
    eq(s.boss.hp, s.boss.max - 25);
    eq(ofType(ev, 'bossDamaged')[0].damage, 25);
    ok(indexOfType(ev, 'spellCast') < indexOfType(ev, 'obstacleHit'));
    ok(indexOfType(ev, 'obstacleHit') < indexOfType(ev, 'bossDamaged'));
    // fewer than 6 obstacles: removes just those; glaze 2 goes away completely
    var s2 = layoutSession([FULL, 'x2xxxxxx', FULL, FULL, FULL, FULL, FULL, FULL]);
    s2.boss.charge = 40;
    var ev2 = RS.Session.starSpell(s2);
    eq(ofType(ev2, 'spellCast')[0].cells.length, 1);
    eq(s2.board.glaze[1][1], 0);
    eq(ofType(ev2, 'obstacleHit').length, 2);
  });

  t('spell: a freed candy completing a row cascades like the hammer', function () {
    var rows = ['0 0 0 4 5 1', '2 3 4 1 2 5', '3 4 5 1 4 5', '1 2 3 4 5 1'];
    var s = RS.Session._fromBoard(levelDef('lakritz', [{ type: 'boss' }]),
      B.fromRows(rows, { colors: 5, ice: ['002000', '000000', '000000', '000000'] }));
    eq(B.findMatches(s.board).length, 0);
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    eq(B.findMatches(s.board).length, 0);
    ok(ofType(ev, 'cleared').length > 0);
    ok(s.boss.hp < s.boss.max - 25);
    eq(s.status, 'playing');
  });

  t('spell: no attack, no spread, no move cost', function () {
    var s = layoutSession(['xxxxxxxC', FULL, FULL, FULL, FULL, FULL, FULL, FULL]);
    s.boss.charge = 40;
    s.boss.counter = 2;
    var moves = s.goals.movesLeft;
    var ev = RS.Session.starSpell(s);
    ok(ev.length > 0);
    eq(ofType(ev, 'bossAttack').length, 0);
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(s.goals.movesLeft, moves);
    eq(s.boss.counter, 2);
    eq(s.status, 'playing');
    eq(ofType(ev, 'goalProgress').length, 1);
  });

  t('spell: can win the level', function () {
    var s = layoutSession([FULL, FULL, FULL, FULL, FULL, FULL, FULL, FULL]);
    s.boss.hp = 20;
    s.goals.goals[0].count = s.boss.max - 20;
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    eq(ofType(ev, 'bossDefeated').length, 1);
    eq(ofType(ev, 'levelWon').length, 1);
    eq(s.status, 'won');
  });

  t('spell: never a loss at zero moves', function () {
    var s = layoutSession([FULL, FULL, FULL, FULL, FULL, FULL, FULL, FULL]);
    s.goals.movesLeft = 0;
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    eq(ofType(ev, 'levelLost').length, 0);
    eq(s.status, 'playing');
  });

  t('spell: [] after end and in non-boss levels', function () {
    var s = layoutSession([FULL, FULL, FULL, FULL, FULL, FULL, FULL, FULL]);
    s.boss.charge = 40;
    s.status = 'won';
    eq(RS.Session.starSpell(s).length, 0);
    s.status = 'lost';
    eq(RS.Session.starSpell(s).length, 0);
    var plain = RS.Session._fromBoard(levelDef(undefined, [{ type: 'score', target: 100 }]),
      B.fromRows(ROWS, { colors: 5 }));
    eq(RS.Session.starSpell(plain).length, 0);
    var endless = RS.Session._fromBoard(null, B.fromRows(ROWS, { colors: 5 }), 'endless');
    eq(RS.Session.starSpell(endless).length, 0);
  });

  t('spell: charges from cleared candies in a move', function () {
    var s = bossSession(ROWS);
    var ev = play(s);
    var n = 0;
    ofType(ev, 'cleared').forEach(function (e) { n += e.candies.length; });
    eq(s.boss.charge, Math.min(40, n));
    ok(s.boss.charge >= 3);
  });

  // Attack arrays and the new kinds
  function freeBoard(seed) {
    return B.create({ rows: 8, cols: 8, colors: 5, seed: seed, layout: [FULL, FULL, FULL, FULL, FULL, FULL, FULL, FULL] });
  }
  function dueBoss(key, attacks) {
    var boss = tempBoss(key, { name: 'T', hp: 100, weak: [0], thresholds: [], attacks: attacks });
    return boss;
  }

  tt('boss: attack array shares counter and runs all', function () {
    var board = freeBoard(501);
    var boss = tempBoss('tArr', { name: 'T', hp: 100, weak: [0, 1], thresholds: [0.5],
      attacks: [{ kind: 'lock', count: 1, every: 9 },
        [{ kind: 'lock', count: 2, every: 2 }, { kind: 'ice', count: 3, level: 2, every: 9 }]] });
    RS.Boss.apply(boss, 50);
    eq(boss.phase, 2);
    boss.counter = 0;
    eq(RS.Boss.step(boss, board).length, 0, 'not due after one move');
    eq(boss.counter, 1);
    var ev = RS.Boss.step(boss, board);
    var atks = ofType(ev, 'bossAttack');
    eq(atks.length, 2);
    eq(atks[0].kind, 'lock');
    eq(atks[0].cells.length, 2);
    eq(atks[1].kind, 'ice');
    eq(atks[1].cells.length, 3);
    eq(atks[1].level, 2);
    eq(boss.counter, 0);
    eq(count(board, 'lock', Boolean), 2);
    eq(count(board, 'ice', function (v) { return v === 2; }), 3);
    atks[1].cells.forEach(function (q) {
      ok(!atks[0].cells.some(function (o) { return o.r === q.r && o.c === q.c; }), 'second attack picks after the first');
    });
  });

  tt('boss: fuse attack sets the fuse on free candies', function () {
    var board = freeBoard(502);
    var boss = dueBoss('tFuse', [{ kind: 'fuse', count: 2, level: 6, every: 1 }]);
    var ev = RS.Boss.step(boss, board);
    var atk = ofType(ev, 'bossAttack')[0];
    eq(atk.kind, 'fuse');
    eq(atk.level, 6);
    eq(atk.cells.length, 2);
    atk.cells.forEach(function (q) { eq(board.candies[q.r][q.c].fuse, 6); });
    eq(count(board, 'candies', function (v) { return v && v.fuse !== undefined; }), 2);
  });

  tt('boss: chameleon attack marks free candies', function () {
    var board = freeBoard(503);
    var boss = dueBoss('tCham', [{ kind: 'chameleon', count: 2, every: 1 }]);
    var ev = RS.Boss.step(boss, board);
    var atk = ofType(ev, 'bossAttack')[0];
    eq(atk.kind, 'chameleon');
    eq(atk.cells.length, 2);
    atk.cells.forEach(function (q) { eq(board.candies[q.r][q.c].chameleon, true); });
    eq(count(board, 'candies', function (v) { return v && v.chameleon; }), 2);
  });

  tt('boss: choco attack removes the candy and sets chocolate', function () {
    var board = freeBoard(504);
    var boss = dueBoss('tChoco', [{ kind: 'choco', count: 3, every: 1 }]);
    var ev = RS.Boss.step(boss, board);
    var atk = ofType(ev, 'bossAttack')[0];
    eq(atk.kind, 'choco');
    eq(atk.cells.length, 3);
    atk.cells.forEach(function (q) {
      eq(board.candies[q.r][q.c], null);
      eq(board.choco[q.r][q.c], true);
    });
    eq(count(board, 'choco', Boolean), 3);
    ok(B.findPossibleMoves(board).length > 0, 'possible move');
  });

  t('spell: order with fuse is ice, fuse, lock, crate, glaze', function () {
    // 1 ice, 2 fuses, 2 locks, 1 crate, 3 glaze: ice, fuses, locks, crate fill the six slots
    var layout = [FULL, 'xIxxxxxx', 'xxxLLxxx', 'xxxxxxZx', '1x1x1xxx', 'xxxxxxxx', FULL, FULL];
    var s = layoutSession(layout);
    s.board.candies[5][1].fuse = 5;
    s.board.candies[5][4].fuse = 4;
    s.boss.charge = 40;
    var ev = RS.Session.starSpell(s);
    eq(ofType(ev, 'spellCast')[0].cells.length, 6);
    eq(count(s.board, 'ice', function (v) { return v > 0; }), 0);
    eq(count(s.board, 'candies', function (v) { return v && v.fuse !== undefined; }), 0);
    eq(count(s.board, 'lock', Boolean), 0);
    eq(count(s.board, 'crate', function (v) { return v > 0; }), 0);
    eq(count(s.board, 'glaze', function (v) { return v > 0; }), 3);
    var defused = ofType(ev, 'fuseDefused');
    eq(defused.length, 2);
    ok(s.board.candies[5][1] && s.board.candies[5][4], 'defused candies stay');
    // fuses beat locks when slots run short: 5 ice cells leave one slot
    var s2 = layoutSession([FULL, 'xIIIIIxx', 'xxxxxxxx', 'xxxxLxxx', FULL, FULL, FULL, FULL]);
    s2.board.candies[2][1].fuse = 3;
    s2.boss.charge = 40;
    RS.Session.starSpell(s2);
    eq(s2.board.candies[2][1].fuse, undefined);
    eq(s2.board.lock[3][4], true);
  });

  tt('boss: amarus-like three-phase boss walks phases 1-2-3 with matching attacks', function () {
    var boss = tempBoss('tAmarus', { name: 'T', hp: 100, weak: [4, 0, 3], thresholds: [0.66, 0.33],
      attacks: [[{ every: 3, kind: 'lock', count: 3 }, { every: 3, kind: 'ice', count: 2, level: 2 }],
        [{ every: 2, kind: 'crate', count: 3, level: 2 }, { every: 2, kind: 'choco', count: 2 }],
        [{ every: 2, kind: 'fuse', count: 2, level: 6 }, { every: 2, kind: 'chameleon', count: 2 }]] });
    var board = freeBoard(505);
    var expected = [['lock', 'ice'], ['crate', 'choco'], ['fuse', 'chameleon']];
    var every = [3, 2, 2];
    for (var ph = 1; ph <= 3; ph++) {
      eq(boss.phase, ph);
      eq(boss.weak, [4, 0, 3][ph - 1]);
      boss.counter = 0;
      var ev = [];
      for (var i = 0; i < every[ph - 1]; i++) { ev = RS.Boss.step(boss, board); }
      var kinds = ofType(ev, 'bossAttack').map(function (e) { return e.kind; });
      RS.assert.deepEqual(kinds, expected[ph - 1]);
      ofType(ev, 'bossAttack').forEach(function (e) { eq(e.phase, ph); });
      if (ph === 1) { eq(ofType(RS.Boss.apply(boss, 34), 'bossPhase').length, 1); }
      if (ph === 2) { eq(ofType(RS.Boss.apply(boss, 33), 'bossPhase').length, 1); }
    }
    eq(boss.phase, 3);
  });

  t('boss: no temporary boss stays registered', function () {
    ['tAmarus', 'tPhases', 'tPlain', 'tArr', 'tFuse', 'tCham', 'tChoco'].forEach(function (k) {
      eq(RS.BOSSES[k], undefined, 'leaked ' + k);
    });
  });
})(window.RS = window.RS || {});
