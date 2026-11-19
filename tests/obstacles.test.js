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
})(window.RS = window.RS || {});
