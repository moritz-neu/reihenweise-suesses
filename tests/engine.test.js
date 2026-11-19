(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var deq = RS.assert.deepEqual;

  function P(r, c) { return { r: r, c: c }; }
  function types(events) { return events.map(function (e) { return e.type; }); }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  // Columns 4/5 hold a move that survives the resolve: swap (0,4)/(0,5) -> vertical 5-5-5.
  function simpleRows() {
    return [
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      '3 4 5 1 4 5',
      '0 0 2 0 4 3'
    ];
  }

  t('engine: POINTS constants', function () {
    deq(RS.Engine.POINTS, { CANDY: 20, OBSTACLE: 50 });
  });

  t('swap rejected: not adjacent / void / empty / same cell / locked', function () {
    var rows = ['0 1 #', '2 _ 3', '4 5 0'];
    var cases = [
      [P(0, 0), P(2, 2)],   // not adjacent
      [P(0, 1), P(0, 2)],   // void
      [P(1, 0), P(1, 1)],   // empty
      [P(0, 0), P(0, 0)],   // same cell
      [P(2, 0), P(2, 1)]    // locked
    ];
    cases.forEach(function (ab, i) {
      var b = B.fromRows(rows, { lock: ['...', '...', 'L..'] });
      var res = RS.Engine.swap(b, ab[0], ab[1]);
      eq(res.valid, false, 'case ' + i);
      deq(B.toRows(b), rows, 'case ' + i);
      deq(res.events, [{ type: 'swapRejected', a: ab[0], b: ab[1] }], 'case ' + i);
    });
  });

  t('swap without match is reverted', function () {
    var rows = simpleRows();
    var b = B.fromRows(rows);
    var idA = B.get(b, P(0, 0)).id;
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, false);
    deq(B.toRows(b), rows);
    eq(B.get(b, P(0, 0)).id, idA);
    deq(res.events, [
      { type: 'swapped', a: P(0, 0), b: P(0, 1) },
      { type: 'swapRejected', a: P(0, 0), b: P(0, 1) }
    ]);
  });

  t('simple match clears 3 and scores 60', function () {
    var b = B.fromRows(simpleRows());
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    var cleared = ofType(res.events, 'cleared');
    eq(cleared.length, 1, 'one stage only');
    eq(cleared[0].points, 60);
    // ids are row-major from 1; (3,2) now holds the swapped-in 0 with id 22.
    deq(cleared[0].candies, [
      { id: 19, color: 0, special: null, pos: P(3, 0) },
      { id: 20, color: 0, special: null, pos: P(3, 1) },
      { id: 22, color: 0, special: null, pos: P(3, 2) }
    ]);
    deq(ofType(res.events, 'matched'),
      [{ type: 'matched', color: 0, cells: [P(3, 0), P(3, 1), P(3, 2)], shape: 'line3' }]);
  });

  t('gravity: candies above fall down', function () {
    var b = B.fromRows(simpleRows());
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    var fell = ofType(res.events, 'fell');
    eq(fell.length, 1);
    deq(fell[0].moves, [
      { id: 13, from: P(2, 0), to: P(3, 0) },
      { id: 7, from: P(1, 0), to: P(2, 0) },
      { id: 1, from: P(0, 0), to: P(1, 0) },
      { id: 14, from: P(2, 1), to: P(3, 1) },
      { id: 8, from: P(1, 1), to: P(2, 1) },
      { id: 2, from: P(0, 1), to: P(1, 1) },
      { id: 15, from: P(2, 2), to: P(3, 2) },
      { id: 9, from: P(1, 2), to: P(2, 2) },
      { id: 3, from: P(0, 2), to: P(1, 2) }
    ]);
    deq(B.toRows(b).slice(1), [
      '1 2 3 1 2 5',
      '2 3 4 1 4 5',
      '3 4 5 2 4 3'
    ]);
    [0, 1, 2].forEach(function (c) { eq(B.get(b, P(0, c)) !== null, true, 'spawn at col ' + c); });
    var spawned = ofType(res.events, 'spawned');
    eq(spawned.length, 1);
    deq(spawned[0].candies.map(function (s) { return s.pos; }), [P(0, 0), P(0, 1), P(0, 2)]);
    spawned[0].candies.forEach(function (s) {
      var candy = B.get(b, s.pos);
      eq(candy.id, s.id);
      eq(candy.color, s.color);
      eq(s.special, null);
      eq(s.id >= 25, true, 'fresh id');
      eq(s.color >= 0 && s.color < b.colors, true, 'color in range');
    });
    eq(b.nextId, 28);
  });

  t('gravity falls through void cells', function () {
    var b = B.fromRows([
      '1 2 3 4 5 1',
      '# 3 4 1 2 5',
      '3 4 5 1 4 5',
      '0 0 2 0 4 3'
    ]);
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(ofType(res.events, 'cascade').length, 1);
    var col0 = ofType(res.events, 'fell')[0].moves.filter(function (m) { return m.from.c === 0; });
    deq(col0, [
      { id: 12, from: P(2, 0), to: P(3, 0) },
      { id: 1, from: P(0, 0), to: P(2, 0) }
    ]);
    deq(B.toRows(b).slice(1), [
      '# 2 3 1 2 5',
      '1 3 4 1 4 5',
      '3 4 5 2 4 3'
    ]);
    eq(b.mask[1][0], false);
    eq(B.get(b, P(1, 0)), null);
    var spawnedPos = ofType(res.events, 'spawned')[0].candies.map(function (s) { return s.pos; });
    deq(spawnedPos, [P(0, 0), P(0, 1), P(0, 2)]);
  });

  t('gravity skips locked cells: their candy stays, others fall past', function () {
    var b = B.fromRows([
      '1 2 3 4 5 1',
      '5 3 4 1 2 5',
      '3 4 5 1 4 5',
      '0 0 2 0 4 3'
    ], { lock: ['......', 'L.....', '......', '......'] });
    var lockedId = B.get(b, P(1, 0)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(ofType(res.events, 'cascade').length, 1);
    eq(B.get(b, P(1, 0)).id, lockedId);
    var col0 = ofType(res.events, 'fell')[0].moves.filter(function (m) { return m.from.c === 0; });
    deq(col0, [
      { id: 13, from: P(2, 0), to: P(3, 0) },
      { id: 1, from: P(0, 0), to: P(2, 0) }
    ]);
    deq(B.toRows(b).slice(1), [
      '5 2 3 1 2 5',
      '1 3 4 1 4 5',
      '3 4 5 2 4 3'
    ]);
  });

  t('cascade stage 2 doubles points', function () {
    // After the first clear, row 3 becomes "3 2 2 2 4 3": a second match in cols 1..3.
    var b = B.fromRows([
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      '3 2 2 1 4 5',
      '0 0 2 0 4 3'
    ]);
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    deq(ofType(res.events, 'cascade').slice(0, 2),
      [{ type: 'cascade', stage: 1 }, { type: 'cascade', stage: 2 }]);
    var cleared = ofType(res.events, 'cleared');
    eq(cleared[0].points, 60);
    var second = cleared[1];
    eq(second.points, 20 * 2 * second.candies.length);
    var ids = second.candies.map(function (c) { return c.id; });
    // (3,1)/(3,2) got ids 14/15 by falling; (3,3) holds the swapped-out 2 with id 21.
    [14, 15, 21].forEach(function (id) { eq(ids.indexOf(id) >= 0, true, 'cleared id ' + id); });
  });

  t('events order per stage: cascade, matched, cleared, fell, spawned', function () {
    var b = B.fromRows(simpleRows());
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    deq(types(res.events), ['swapped', 'cascade', 'matched', 'cleared', 'fell', 'spawned']);

    var b2 = B.fromRows([
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      '3 2 2 1 4 5',
      '0 0 2 0 4 3'
    ]);
    var evs = types(RS.Engine.swap(b2, P(3, 2), P(3, 3)).events);
    deq(evs.slice(0, 11),
      ['swapped', 'cascade', 'matched', 'cleared', 'fell', 'spawned',
        'cascade', 'matched', 'cleared', 'fell', 'spawned']);
  });

  t('no moves after resolve triggers shuffled', function () {
    // 3x3: the only move clears the bottom row; seed 3 spawns a top row that leaves no move.
    var b = B.fromRows(['1 2 4', '3 4 0', '0 0 5'], { seed: 3 });
    eq(B.findPossibleMoves(b).length, 1);
    var res = RS.Engine.swap(b, P(1, 2), P(2, 2));
    eq(res.valid, true);
    var evs = types(res.events);
    eq(evs[evs.length - 1], 'shuffled');
    eq(evs.indexOf('shuffled'), evs.length - 1, 'shuffled only once, at the end');
    var shuffled = res.events[res.events.length - 1];
    eq(shuffled.candies.length > 0, true);
    shuffled.candies.forEach(function (s) {
      var candy = B.get(b, s.pos);
      eq(candy.id, s.id);
      eq(candy.color, s.color);
    });
    eq(B.findMatches(b).length, 0);
    eq(B.findPossibleMoves(b).length > 0, true);
  });

  t('shuffled event via stubbed findPossibleMoves carries id, pos, color', function () {
    var b = B.fromRows(simpleRows());
    var realFind = B.findPossibleMoves;
    var calls = 0;
    var res;
    try {
      B.findPossibleMoves = function (board) {
        calls++;
        return calls === 1 ? [] : realFind(board);
      };
      res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    } finally {
      B.findPossibleMoves = realFind;
    }
    var last = res.events[res.events.length - 1];
    eq(last.type, 'shuffled');
    last.candies.forEach(function (s) {
      deq(Object.keys(s).sort(), ['color', 'id', 'pos']);
      eq(B.get(b, s.pos).id, s.id);
      eq(B.get(b, s.pos).color, s.color);
    });
  });

  // ---- Task 5: special creation ----
  function created(res) { return ofType(res.events, 'specialCreated'); }

  t('4 in a row by horizontal swap creates stripeH at b', function () {
    var b = B.fromRows(['0 1 0 0 0', '2 3 4 5 2', '3 4 5 2 3', '4 5 2 3 4']);
    var id = B.get(b, P(0, 0)).id; // the 0 that is dragged onto (0,1)
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, true);
    var sc = created(res);
    eq(sc.length, 1);
    deq(sc[0], { type: 'specialCreated', pos: P(0, 1), id: id, special: 'stripeH', color: 0 });
    var evs = types(res.events);
    eq(evs.indexOf('matched') < evs.indexOf('specialCreated'), true);
    eq(evs.indexOf('specialCreated') < evs.indexOf('cleared'), true);
  });

  t('4 in a column by horizontal swap creates stripeH', function () {
    var b = B.fromRows(['0 1 2', '0 3 4', '5 0 1', '0 2 3']);
    var res = RS.Engine.swap(b, P(2, 1), P(2, 0));
    eq(res.valid, true);
    var sc = created(res);
    eq(sc.length, 1);
    eq(sc[0].special, 'stripeH');
    deq(sc[0].pos, P(2, 0));
  });

  t('4 in a row by vertical swap creates stripeV', function () {
    var b = B.fromRows(['0 0 1 0', '2 3 0 4', '3 4 5 2', '4 5 2 3']);
    var res = RS.Engine.swap(b, P(1, 2), P(0, 2));
    eq(res.valid, true);
    var sc = created(res);
    eq(sc.length, 1);
    eq(sc[0].special, 'stripeV');
    deq(sc[0].pos, P(0, 2));
  });

  t('L creates bomb at the corner when the swap is elsewhere', function () {
    var b = B.fromRows([
      '0 0 0 2 3 4',
      '0 3 4 5 2 3',
      '0 4 5 2 3 1',
      '2 5 3 4 1 2',
      '3 2 4 5 1 4'
    ]);
    var id = B.get(b, P(0, 0)).id;
    var res = RS.Engine.swap(b, P(2, 4), P(2, 5));
    eq(res.valid, true);
    var sc = created(res).filter(function (e) { return e.special === 'bomb'; });
    eq(sc.length, 1);
    deq(sc[0].pos, P(0, 0));
    eq(sc[0].id, id);
    eq(sc[0].color, 0);
  });

  t('5 in a row creates colorball with color null', function () {
    var b = B.fromRows(['0 0 1 0 0', '2 3 0 4 5', '3 4 5 2 3', '4 5 2 3 4']);
    var id = B.get(b, P(1, 2)).id;
    var res = RS.Engine.swap(b, P(1, 2), P(0, 2));
    eq(res.valid, true);
    var sc = created(res);
    eq(sc.length, 1);
    deq(sc[0], { type: 'specialCreated', pos: P(0, 2), id: id, special: 'colorball', color: null });
    var candy = B.get(b, P(0, 2));
    eq(candy.id, id);
    eq(candy.special, 'colorball');
    eq(candy.color, null);
  });

  t('created special is not cleared', function () {
    var b = B.fromRows(['0 0 1 0 0', '2 3 0 4 5', '3 4 5 2 3', '4 5 2 3 4']);
    var res = RS.Engine.swap(b, P(1, 2), P(0, 2));
    var sc = created(res)[0];
    var cleared = ofType(res.events, 'cleared')[0];
    eq(cleared.candies.some(function (c) { return c.id === sc.id; }), false);
    eq(cleared.candies.length, 4);
    eq(cleared.points, 4 * RS.Engine.POINTS.CANDY);
  });

  t('without a swap the match orientation and middle cell decide', function () {
    var b = B.fromRows(['2 3 4 5 2 3', '1 1 1 1 3 4', '3 4 5 2 4 5', '4 5 2 3 5 2']);
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map() };
    RS.Engine._resolve(b, ctx);
    var sc = ofType(ctx.events, 'specialCreated');
    eq(sc.length >= 1, true);
    eq(sc[0].special, 'stripeH');
    deq(sc[0].pos, P(1, 2));
  });

  var SM = ['0 1 2 3', '1 2 3 0', '2 3 0 1', '3 0 1 2'];
  function noNulls(b) {
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) {
        if (B.isPlayable(b, P(r, c)) && !B.get(b, P(r, c))) { return false; }
      }
    }
    return true;
  }

  t('smash: clears one candy and refills', function () {
    var b = B.fromRows(SM, { colors: 4 });
    var id = B.get(b, P(1, 1)).id;
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, true);
    eq(res.events[0].type, 'smashed');
    deq(res.events[0].pos, P(1, 1));
    var cleared = ofType(res.events, 'cleared')[0];
    eq(cleared.candies.some(function (c) { return c.id === id; }), true);
    eq(noNulls(b), true);
  });

  t('smash: glaze loses one layer', function () {
    var b = B.fromRows(SM, { colors: 4, glaze: ['0000', '0200', '0000', '0000'] });
    var id = B.get(b, P(1, 1)).id;
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, true);
    eq(b.glaze[1][1], 1);
    var cleared = ofType(res.events, 'cleared')[0];
    eq(cleared.candies.some(function (c) { return c.id === id; }), true);
  });

  t('smash: lock is removed and candy cleared', function () {
    var b = B.fromRows(SM, { colors: 4, lock: ['....', '.L..', '....', '....'] });
    var id = B.get(b, P(1, 1)).id;
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, true);
    eq(b.lock[1][1], false);
    var cleared = ofType(res.events, 'cleared')[0];
    eq(cleared.candies.some(function (c) { return c.id === id; }), true);
  });

  t('smash: special triggers its area', function () {
    var b = B.fromRows(['0 1 2 3', '1 2h 3 0', '2 3 0 1', '3 0 1 2'], { colors: 4 });
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, true);
    eq(ofType(res.events, 'specialTriggered').length >= 1, true);
  });

  t('smash: rejected on void and empty cell', function () {
    var b = B.fromRows(['0 1 2 3', '1 # 3 0', '2 _ 0 1', '3 0 1 2'], { colors: 4 });
    var before = B.toRows(b);
    [P(1, 1), P(2, 1)].forEach(function (p) {
      var res = RS.Engine.smash(b, p);
      eq(res.valid, false);
      deq(res.events, [{ type: 'smashRejected', pos: p }]);
      deq(B.toRows(b), before);
    });
  });
})(window.RS = window.RS || {});
