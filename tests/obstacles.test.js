(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var deq = RS.assert.deepEqual;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }
  function at(p) { return function (e) { return e.pos.r === p.r && e.pos.c === p.c; }; }

  // Events of one cascade stage (between its `cascade` event and the next one).
  function stage(events, n) {
    var out = [];
    var current = 0;
    events.forEach(function (e) {
      if (e.type === 'cascade') { current = e.stage; return; }
      if (current === n) { out.push(e); }
    });
    return out;
  }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  function rows(bottom) {
    return [
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      '3 4 5 1 4 5',
      bottom || '0 0 2 0 4 3'
    ];
  }
  var NONE = ['000000', '000000', '000000', '000000'];

  t('obstacles: hitGlaze / hitLock / countGlaze', function () {
    var b = B.fromRows(['0 1', '2 3'], { glaze: ['20', '01'], lock: ['L.', '..'] });
    eq(RS.Obstacles.countGlaze(b), 2);
    deq(RS.Obstacles.hitGlaze(b, P(0, 0)), { type: 'obstacleHit', pos: P(0, 0), kind: 'glaze', remaining: 1 });
    deq(RS.Obstacles.hitGlaze(b, P(0, 0)), { type: 'obstacleHit', pos: P(0, 0), kind: 'glaze', remaining: 0 });
    eq(RS.Obstacles.hitGlaze(b, P(0, 0)), null);
    eq(RS.Obstacles.countGlaze(b), 1);
    deq(RS.Obstacles.hitLock(b, P(0, 0)), { type: 'obstacleHit', pos: P(0, 0), kind: 'lock', remaining: 0 });
    eq(b.lock[0][0], false);
    eq(RS.Obstacles.hitLock(b, P(0, 0)), null);
  });

  t('glaze 2 needs two hits', function () {
    var b = B.fromRows(rows(), { glaze: ['000000', '000000', '000000', '200000'] });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(3, 0), kind: 'glaze', remaining: 1 }]);
    eq(b.glaze[3][0], 1);
    // Same match again on the same cell (new candies, glaze kept).
    b.candies = B.fromRows(rows()).candies;
    var res2 = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res2.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(3, 0), kind: 'glaze', remaining: 0 }]);
    eq(b.glaze[3][0], 0);
    eq(RS.Obstacles.countGlaze(b), 0);
  });

  t('glaze under a stripe area is hit', function () {
    var b = B.fromRows(rows('0 0h 2 0 4 3'), { glaze: ['000000', '000000', '000000', '000011'] });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res.events, 1), 'obstacleHit'), [
      { type: 'obstacleHit', pos: P(3, 4), kind: 'glaze', remaining: 0 },
      { type: 'obstacleHit', pos: P(3, 5), kind: 'glaze', remaining: 0 }
    ]);
  });

  t('a cell is hit at most once per stage (match + stripe on the same glaze)', function () {
    var b = B.fromRows(rows('0 0h 2 0 4 3'), { glaze: ['000000', '000000', '000000', '220000'] });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res.events, 1), 'obstacleHit'), [
      { type: 'obstacleHit', pos: P(3, 0), kind: 'glaze', remaining: 1 },
      { type: 'obstacleHit', pos: P(3, 1), kind: 'glaze', remaining: 1 }
    ]);
  });

  t('locked candy cannot be swapped', function () {
    var b = B.fromRows(rows(), { lock: ['......', '......', '......', '...L..'], glaze: NONE });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, false);
    deq(res.events, [{ type: 'swapRejected', a: P(3, 2), b: P(3, 3) }]);
    deq(B.toRows(b), rows());
    eq(b.lock[3][3], true);
  });

  t('locked candy does not fall, others fall past it', function () {
    var b = B.fromRows(rows(), { lock: ['......', '.L....', '......', '......'] });
    var lockedId = B.get(b, P(1, 1)).id;
    var aboveId = B.get(b, P(0, 1)).id;
    var belowId = B.get(b, P(2, 1)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var moves = ofType(stage(res.events, 1), 'fell')[0].moves;
    ok(!moves.some(function (m) { return m.id === lockedId; }), 'locked candy does not move');
    deq(moves.filter(function (m) { return m.id === belowId || m.id === aboveId; }), [
      { id: belowId, from: P(2, 1), to: P(3, 1) },
      { id: aboveId, from: P(0, 1), to: P(2, 1) }
    ]);
    // The spawn fills the top cell above the lock.
    ok(ofType(stage(res.events, 1), 'spawned')[0].candies.some(function (c) {
      return c.pos.r === 0 && c.pos.c === 1;
    }));
  });

  t('match with locked candy removes lock and candy, cell is refilled', function () {
    var b = B.fromRows(rows(), { lock: ['......', '......', '......', 'L.....'] });
    var lockedId = B.get(b, P(3, 0)).id;
    var aboveId = B.get(b, P(2, 0)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    var first = stage(res.events, 1);
    deq(ofType(first, 'obstacleHit'), [{ type: 'obstacleHit', pos: P(3, 0), kind: 'lock', remaining: 0 }]);
    ok(ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === lockedId; }), 'candy cleared');
    eq(b.lock[3][0], false);
    // The cell is a fall slot again: the candy above falls in, the top gets a new one.
    deq(ofType(first, 'fell')[0].moves.filter(function (m) { return m.id === aboveId; }),
      [{ id: aboveId, from: P(2, 0), to: P(3, 0) }]);
    ok(ofType(first, 'spawned')[0].candies.some(function (c) { return c.pos.r === 0 && c.pos.c === 0; }));
    ok(B.get(b, P(3, 0)) !== null);
  });

  t('effect on locked candy removes lock, candy stays', function () {
    var b = B.fromRows(rows('0 0h 2 0 4 3'), { lock: ['......', '......', '......', '....L.'] });
    var lockedId = B.get(b, P(3, 4)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var first = stage(res.events, 1);
    deq(ofType(first, 'obstacleHit'), [{ type: 'obstacleHit', pos: P(3, 4), kind: 'lock', remaining: 0 }]);
    ok(!ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === lockedId; }), 'candy stays');
    eq(b.lock[3][4], false);
  });

  t('effect on a locked special does not trigger it', function () {
    var b = B.fromRows(rows('0 0h 2 0 4v 3'), { lock: ['......', '......', '......', '....L.'] });
    var lockedId = B.get(b, P(3, 4)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var first = stage(res.events, 1);
    deq(ofType(first, 'specialTriggered').map(function (e) { return e.pos; }), [P(3, 1)]);
    ok(!ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === lockedId; }), 'special stays');
    eq(b.lock[3][4], false);
  });

  t('colorball transform skips a locked candy of the partner color', function () {
    var b = B.fromRows([
      '* 1h 2 3',
      '4 5 1 2',
      '3 1 4 5'
    ], { lock: ['....', '....', '.L..'] });
    var lockedId = B.get(b, P(2, 1)).id;
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, true);
    var first = stage(res.events, 1);
    deq(ofType(first, 'specialCreated').map(function (e) { return e.pos; }), [P(1, 2)]);
    ok(ofType(first, 'obstacleHit').some(at(P(2, 1))), 'lock hit');
    ok(!ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === lockedId; }), 'candy stays');
    eq(b.lock[2][1], false);
  });

  t('matched locked candy is cleared even when an effect reaches it first', function () {
    // Row 0 matches first; its stripeV runs down column 1 and reaches the locked (2,1)
    // before the vertical match of column 1 is hit.
    var b = B.fromRows([
      '0 0v 0 3',
      '4 1 5 2',
      '5 1 4 3',
      '2 1 3 4'
    ], { lock: ['....', '....', '.L..', '....'] });
    var lockedId = B.get(b, P(2, 1)).id;
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map() };
    RS.Engine._resolve(b, ctx);
    var first = stage(ctx.events, 1);
    eq(ofType(first, 'obstacleHit').filter(at(P(2, 1))).length, 1);
    ok(ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === lockedId; }), 'cleared');
  });

  t('obstacle hits add 50 points each', function () {
    // Stage 1: glaze (3,0), lock (3,0), glaze (3,1) = 3 obstacle hits + 3 candies.
    var b = B.fromRows(rows(), {
      glaze: ['000000', '000000', '000000', '110000'],
      lock: ['......', '......', '......', 'L.....']
    });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var first = stage(res.events, 1);
    eq(ofType(first, 'obstacleHit').length, 3);
    eq(ofType(first, 'cleared')[0].points, 3 * RS.Engine.POINTS.CANDY + 3 * RS.Engine.POINTS.OBSTACLE);
  });

  t('locked candies take part in matches', function () {
    var b = B.fromRows(['0 0 0 2'], { lock: ['LL..'] });
    deq(B.findMatches(b).map(function (m) { return m.cells; }), [[P(0, 0), P(0, 1), P(0, 2)]]);
  });

  function iceAt(r, c, level) {
    var g = NONE.slice();
    g[r] = g[r].substring(0, c) + level + g[r].substring(c + 1);
    return g;
  }
  function chocoAt(r, c) {
    var g = ['......', '......', '......', '......'];
    g[r] = g[r].substring(0, c) + 'C' + g[r].substring(c + 1);
    return g;
  }

  t('obstacles: hitIce / hitChoco / countChoco / isFree', function () {
    var b = B.fromRows(['0 1 2 3'], { ice: ['2000'], choco: ['..C.'] });
    deq(RS.Obstacles.hitIce(b, P(0, 0)), { type: 'obstacleHit', pos: P(0, 0), kind: 'ice', remaining: 1 });
    deq(RS.Obstacles.hitIce(b, P(0, 0)), { type: 'obstacleHit', pos: P(0, 0), kind: 'ice', remaining: 0 });
    eq(RS.Obstacles.hitIce(b, P(0, 0)), null);
    eq(RS.Obstacles.countChoco(b), 1);
    deq(RS.Obstacles.hitChoco(b, P(0, 2)), { type: 'obstacleHit', pos: P(0, 2), kind: 'choco', remaining: 0 });
    eq(RS.Obstacles.hitChoco(b, P(0, 2)), null);
    eq(RS.Obstacles.countChoco(b), 0);
    var f = B.fromRows(['0 1h 2 3 4 5'], { ice: ['000100'], lock: ['.....L'], choco: ['....C.'] });
    eq(RS.Obstacles.isFree(f, P(0, 0)), true);
    eq(RS.Obstacles.isFree(f, P(0, 1)), false, 'special');
    eq(RS.Obstacles.isFree(f, P(0, 3)), false, 'ice');
    eq(RS.Obstacles.isFree(f, P(0, 4)), false, 'choco');
    eq(RS.Obstacles.isFree(f, P(0, 5)), false, 'lock');
    eq(RS.Obstacles.isFree(f, P(3, 3)), false, 'outside');
  });

  t('ice: frozen candy cannot be swapped', function () {
    var b = B.fromRows(rows(), { ice: iceAt(3, 3, 1) });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, false);
    deq(res.events, [{ type: 'swapRejected', a: P(3, 2), b: P(3, 3) }]);
    deq(B.toRows(b), rows());
  });

  t('ice: frozen candy is not part of a match', function () {
    var b = B.fromRows(['0 0 0 2'], { ice: ['0010'] });
    eq(B.findMatches(b).length, 0);
  });

  t('ice: neighbour match thaws one level', function () {
    var b = B.fromRows(rows(), { ice: iceAt(2, 1, 1) });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    deq(ofType(stage(res.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(2, 1), kind: 'ice', remaining: 0 }]);
    eq(b.ice[2][1], 0);
    eq(ofType(stage(res.events, 1), 'cleared')[0].points,
      3 * RS.Engine.POINTS.CANDY + RS.Engine.POINTS.OBSTACLE);
  });

  t('ice: level 2 needs two hits', function () {
    var b = B.fromRows(rows(), { ice: iceAt(2, 1, 2) });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(2, 1), kind: 'ice', remaining: 1 }]);
    eq(b.ice[2][1], 1);
    var frozen = B.get(b, P(2, 1));
    b.candies = B.fromRows(rows()).candies;
    b.candies[2][1] = frozen;
    var res2 = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res2.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(2, 1), kind: 'ice', remaining: 0 }]);
    eq(b.ice[2][1], 0);
  });

  t('ice: stripe through ice thaws, does not clear candy', function () {
    var b = B.fromRows(rows('0 0h 2 0 4v 3'), { ice: iceAt(3, 4, 1) });
    var frozenId = B.get(b, P(3, 4)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var first = stage(res.events, 1);
    deq(ofType(first, 'obstacleHit'), [{ type: 'obstacleHit', pos: P(3, 4), kind: 'ice', remaining: 0 }]);
    deq(ofType(first, 'specialTriggered').map(function (e) { return e.pos; }), [P(3, 1)]);
    ok(!ofType(first, 'cleared')[0].candies.some(function (c) { return c.id === frozenId; }), 'candy stays');
    eq(B.get(b, P(3, 4)).id, frozenId);
  });

  t('ice: frozen candy does not fall', function () {
    var b = B.fromRows(rows(), { ice: iceAt(1, 1, 1) });
    var frozenId = B.get(b, P(1, 1)).id;
    var aboveId = B.get(b, P(0, 1)).id;
    var belowId = B.get(b, P(2, 1)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var moves = ofType(stage(res.events, 1), 'fell')[0].moves;
    ok(!moves.some(function (m) { return m.id === frozenId; }), 'frozen candy does not move');
    deq(moves.filter(function (m) { return m.id === belowId || m.id === aboveId; }), [
      { id: belowId, from: P(2, 1), to: P(3, 1) },
      { id: aboveId, from: P(0, 1), to: P(2, 1) }
    ]);
    eq(B.get(b, P(1, 1)).id, frozenId);
  });

  t('choco: neighbour match removes chocolate (+50 points)', function () {
    var b = B.fromRows(rows(), { choco: chocoAt(2, 1) });
    eq(B.get(b, P(2, 1)), null);
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    var first = stage(res.events, 1);
    deq(ofType(first, 'obstacleHit'), [{ type: 'obstacleHit', pos: P(2, 1), kind: 'choco', remaining: 0 }]);
    eq(b.choco[2][1], false);
    eq(ofType(first, 'cleared')[0].points, 3 * RS.Engine.POINTS.CANDY + RS.Engine.POINTS.OBSTACLE);
    ok(B.get(b, P(2, 1)) !== null, 'cell is a candy slot again');
  });

  t('choco: stripe hit removes chocolate', function () {
    var b = B.fromRows(rows('0 0h 2 0 4 3'), { choco: chocoAt(3, 5) });
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(ofType(stage(res.events, 1), 'obstacleHit'),
      [{ type: 'obstacleHit', pos: P(3, 5), kind: 'choco', remaining: 0 }]);
    eq(b.choco[3][5], false);
  });

  t('choco: candies fall past chocolate', function () {
    var b = B.fromRows(rows(), { choco: chocoAt(1, 1) });
    var aboveId = B.get(b, P(0, 1)).id;
    var belowId = B.get(b, P(2, 1)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var moves = ofType(stage(res.events, 1), 'fell')[0].moves;
    deq(moves.filter(function (m) { return m.id === belowId || m.id === aboveId; }), [
      { id: belowId, from: P(2, 1), to: P(3, 1) },
      { id: aboveId, from: P(0, 1), to: P(2, 1) }
    ]);
    eq(b.choco[1][1], true);
    eq(B.get(b, P(1, 1)), null, 'nothing spawns on chocolate');
  });

  t('choco: goal counts removed chocolate', function () {
    var b = B.fromRows(rows(), { choco: ['......', '......', '.C....', '..C...'] });
    var st = RS.Goals.create({ moves: 5, goals: [{ type: 'choco' }] }, b);
    eq(st.goals[0].target, 2);
    RS.Goals.apply(st, [{ type: 'obstacleHit', pos: P(2, 1), kind: 'choco', remaining: 0 },
      { type: 'obstacleHit', pos: P(0, 0), kind: 'glaze', remaining: 0 }]);
    eq(st.goals[0].count, 1);
    eq(RS.Goals.allDone(st), false);
    RS.Goals.apply(st, [{ type: 'obstacleHit', pos: P(3, 2), kind: 'choco', remaining: 0 }]);
    eq(RS.Goals.allDone(st), true);
  });

  t('shuffle: frozen, locked and chocolate cells stay where they are', function () {
    // 12 of 16 cells are frozen or locked, one more is chocolate: it must still finish.
    var b = B.fromRows(['0 1 2 3', '1 2 3 4', '2 3 4 5', '3 4 5 0'], {
      ice: ['1212', '2121', '0000', '0000'],
      lock: ['....', '....', 'LLLL', '....'],
      choco: ['....', '....', '....', 'C...']
    });
    var before = B.toRows(b);
    B.shuffle(b);
    var after = B.toRows(b);
    deq(after.slice(0, 3), before.slice(0, 3));
    eq(b.choco[3][0], true);
    eq(B.get(b, P(3, 0)), null);
  });

  t('layout: I J C parse', function () {
    var b = B.create({ rows: 2, cols: 5, colors: 6, seed: 3, layout: ['IJC.x', 'xxxxx'] });
    eq(b.ice[0][0], 1);
    eq(b.ice[0][1], 2);
    eq(b.ice[0][2], 0);
    eq(b.choco[0][2], true);
    eq(b.choco[0][0], false);
    eq(b.mask[0][2], true);
    eq(b.mask[0][3], false);
    eq(B.get(b, P(0, 2)), null, 'no candy on chocolate');
    ok(B.get(b, P(0, 0)) !== null, 'candy under ice');
    ok(B.get(b, P(0, 1)) !== null, 'candy under ice 2');
  });
})(window.RS = window.RS || {});
