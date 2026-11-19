(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var deq = RS.assert.deepEqual;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function key(p) { return p.r + ',' + p.c; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }
  function sorted(cells) {
    return cells.slice().sort(function (p, q) { return p.r - q.r || p.c - q.c; });
  }
  function newCtx() {
    return { stage: 1, events: [], swap: null, triggered: new Set(), toClear: new Map() };
  }
  function clearedKeys(ctx) {
    var keys = [];
    ctx.toClear.forEach(function (p) { keys.push(key(p)); });
    return keys.sort();
  }
  function keysOf(cells) { return cells.map(key).sort(); }
  // Events of stage 1 only: candies do not move within a stage, so pos identifies a candy there.
  function stage1(events) {
    var end = events.map(function (e) { return e.type; }).indexOf('cleared');
    return events.slice(0, end + 1);
  }
  // All playable cells in the given row/column ranges (inclusive), row-major.
  function block(board, r0, r1, c0, c1) {
    var out = [];
    for (var r = Math.max(0, r0); r <= Math.min(board.rows - 1, r1); r++) {
      for (var c = Math.max(0, c0); c <= Math.min(board.cols - 1, c1); c++) {
        if (board.mask[r][c]) { out.push(P(r, c)); }
      }
    }
    return out;
  }
  function union(lists) {
    var seen = {};
    var out = [];
    lists.forEach(function (l) {
      l.forEach(function (p) { if (!seen[key(p)]) { seen[key(p)] = true; out.push(p); } });
    });
    return sorted(out);
  }

  function grid6() {
    return [
      '0 1 2 3 4 5',
      '1 2 3 4 5 0',
      '2 3 4 5 0 1',
      '3 4 5 0 1 2',
      '4 5 0 1 2 3',
      '5 0 1 2 3 4'
    ];
  }

  // ---- areas ----

  t('stripeH clears its row', function () {
    var b = B.fromRows(['0 1 2 3', '4 0h # 5', '1 2 3 4', '5 4 3 2']);
    deq(RS.Specials.area(b, P(1, 1), 'stripeH'), [P(1, 0), P(1, 1), P(1, 3)]);
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(1, 1), ctx, true);
    deq(clearedKeys(ctx), keysOf([P(1, 0), P(1, 1), P(1, 3)]));
    deq(ofType(ctx.events, 'specialTriggered'), [{
      type: 'specialTriggered', pos: P(1, 1), special: 'stripeH', cells: [P(1, 0), P(1, 1), P(1, 3)]
    }]);
  });

  t('stripeV clears its column', function () {
    var b = B.fromRows(['0 1 2 3', '4 0v 2 5', '1 # 3 4', '5 4 3 2']);
    deq(RS.Specials.area(b, P(1, 1), 'stripeV'), [P(0, 1), P(1, 1), P(3, 1)]);
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(1, 1), ctx, true);
    deq(clearedKeys(ctx), keysOf([P(0, 1), P(1, 1), P(3, 1)]));
  });

  t('bomb clears 3x3 clipped at the corner', function () {
    var b = B.fromRows(['0b 1 2 3', '# 0 2 5', '1 2 3 4', '5 4 3 2']);
    deq(RS.Specials.area(b, P(0, 0), 'bomb'), [P(0, 0), P(0, 1), P(1, 1)]);
    deq(RS.Specials.area(b, P(2, 2), 'bomb'), block(b, 1, 3, 1, 3));
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(0, 0), ctx, false);
    deq(clearedKeys(ctx), keysOf([P(0, 0), P(0, 1), P(1, 1)]));
  });

  t('colorball swapped with color 2 clears all 2s', function () {
    var b = B.fromRows([
      '* 2 0 1',
      '1 3 2 4',
      '2 4 5 0',
      '3 2 1 5'
    ]);
    var ballId = B.get(b, P(0, 0)).id;
    var twoIds = [P(0, 1), P(1, 2), P(2, 0), P(3, 1)].map(function (p) { return B.get(b, p).id; });
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, true);
    eq(ofType(res.events, 'swapRejected').length, 0);
    var first = stage1(res.events);
    eq(ofType(first, 'matched').length, 0, 'stage 1 is the colorball, not a match');
    deq(ofType(first, 'specialTriggered'), [{
      type: 'specialTriggered', pos: P(0, 1), special: 'colorball',
      cells: [P(0, 0), P(1, 2), P(2, 0), P(3, 1)]
    }]);
    var cleared = ofType(first, 'cleared')[0];
    deq(cleared.candies.map(function (c) { return c.id; }).sort(),
      twoIds.concat([ballId]).sort());
    eq(cleared.points, 5 * RS.Engine.POINTS.CANDY);
  });

  t('colorball hit by effect uses most frequent color, tie -> lowest index', function () {
    // Normal candies: 1 x3, 3 x3, 0 x1. The 4-stripes would win if specials counted.
    var b = B.fromRows([
      '3 1 4h 4h',
      '1 * 4v 3',
      '0 1 3 4b'
    ]);
    deq(RS.Specials.area(b, P(1, 1), 'colorball'), [P(0, 1), P(1, 0), P(2, 1)]);
    deq(RS.Specials.area(b, P(1, 1), 'colorball', 3), [P(0, 0), P(1, 3), P(2, 2)]);
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(1, 1), ctx, false);
    deq(ofType(ctx.events, 'specialTriggered')[0],
      { type: 'specialTriggered', pos: P(1, 1), special: 'colorball', cells: [P(0, 1), P(1, 0), P(2, 1)] });
    deq(clearedKeys(ctx), keysOf([P(0, 1), P(1, 0), P(1, 1), P(2, 1)]));
  });

  t('colorball without any colored candy clears only itself', function () {
    var b = B.fromRows(['* _', '_ #']);
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(0, 0), ctx, false);
    deq(ofType(ctx.events, 'specialTriggered'),
      [{ type: 'specialTriggered', pos: P(0, 0), special: 'colorball', cells: [] }]);
    deq(clearedKeys(ctx), ['0,0']);
  });

  // ---- combos ----

  t('stripe+stripe cross', function () {
    var rows = grid6();
    rows[2] = '2 3h 4v 5 0 1';
    var b = B.fromRows(rows);
    var res = RS.Specials.combo(b, P(2, 1), P(2, 2));
    deq(sorted(res.cells), union([block(b, 2, 2, 0, 5), block(b, 0, 5, 2, 2)]));
    eq(res.transform, undefined);
  });

  t('stripe+bomb 3 rows 3 cols', function () {
    var rows = grid6();
    rows[2] = '2 3 4b 5 0 1';
    rows[3] = '3 4 5h 0 1 2';
    var b = B.fromRows(rows);
    var res = RS.Specials.combo(b, P(3, 2), P(2, 2));
    deq(sorted(res.cells), union([block(b, 1, 3, 0, 5), block(b, 0, 5, 1, 3)]));
    eq(res.cells.length, 27);
  });

  t('bomb+bomb 5x5', function () {
    var rows = grid6();
    rows[2] = '2 3 4b 5b 0 1';
    var b = B.fromRows(rows);
    var res = RS.Specials.combo(b, P(2, 3), P(2, 2));
    deq(sorted(res.cells), block(b, 0, 4, 0, 4));
    eq(res.cells.length, 25);
  });

  t('colorball+colorball clears all', function () {
    var rows = grid6();
    rows[0] = '# 1 2 3 4 5';
    rows[2] = '2 3 * * 0 1';
    var b = B.fromRows(rows);
    var res = RS.Specials.combo(b, P(2, 2), P(2, 3));
    deq(sorted(res.cells), block(b, 0, 5, 0, 5));
    eq(res.cells.length, 35);

    var swapRes = RS.Engine.swap(b, P(2, 2), P(2, 3));
    eq(swapRes.valid, true);
    eq(ofType(stage1(swapRes.events), 'cleared')[0].candies.length, 35);
  });

  t('colorball+stripe turns all partner-colored candies into stripes and triggers them', function () {
    var b = B.fromRows([
      '* 2h 0 1',
      '1 3 2 4',
      '2 4 5 0',
      '3 2 1 5'
    ]);
    var ballId = B.get(b, P(0, 0)).id;
    var partnerId = B.get(b, P(0, 1)).id;
    var targets = [P(1, 2), P(2, 0), P(3, 1)];
    var targetIds = targets.map(function (p) { return B.get(b, p).id; });

    var combo = RS.Specials.combo(b, P(0, 1), P(0, 0));
    deq(combo.transform, { color: 2, special: 'stripeH' });

    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, true);
    var first = stage1(res.events);
    var createdEvents = ofType(first, 'specialCreated');
    deq(createdEvents.map(function (e) { return e.id; }), targetIds);
    createdEvents.forEach(function (e, i) {
      deq(e.pos, targets[i]);
      eq(e.color, 2);
      ok(e.special === 'stripeH' || e.special === 'stripeV', 'stripe kind ' + e.special);
    });
    var triggered = ofType(first, 'specialTriggered');
    var lastCreated = first.lastIndexOf(createdEvents[createdEvents.length - 1]);
    createdEvents.forEach(function (e) {
      var hits = triggered.filter(function (tr) { return key(tr.pos) === key(e.pos); });
      eq(hits.length, 1, 'transformed candy at ' + key(e.pos) + ' triggers once');
      eq(hits[0].special, e.special);
      ok(first.indexOf(hits[0]) > lastCreated, 'triggered after all rewrites');
    });
    var clearedIds = ofType(first, 'cleared')[0].candies.map(function (c) { return c.id; });
    targetIds.concat([ballId, partnerId]).forEach(function (id) {
      ok(clearedIds.indexOf(id) >= 0, 'cleared id ' + id);
    });
  });

  // ---- chains ----

  t('chain: stripe hits bomb hits stripe, each triggered once', function () {
    // stripeH (0,0) hits bomb (0,1); the bomb hits (0,0) again and stripeV (1,0),
    // whose column hits (0,0) a third time.
    var b = B.fromRows([
      '0h 1b 2 3',
      '3v 4 5 0',
      '1 2 3 4',
      '5 0 1 2'
    ]);
    var idAt = {};
    [P(0, 0), P(0, 1), P(1, 0)].forEach(function (p) { idAt[key(p)] = B.get(b, p).id; });
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(0, 0), ctx, true);
    var perId = {};
    ofType(ctx.events, 'specialTriggered').forEach(function (e) {
      var id = idAt[key(e.pos)];
      perId[id] = (perId[id] || 0) + 1;
    });
    deq(Object.keys(perId).length, 3);
    Object.keys(perId).forEach(function (id) { eq(perId[id], 1, 'id ' + id); });
    eq(ctx.triggered.size, 3);
    deq(clearedKeys(ctx), keysOf(union([block(b, 0, 0, 0, 3), block(b, 0, 3, 0, 0), block(b, 0, 1, 0, 2)])));
  });

  t('two adjacent colorballs hit by a bomb terminate', function () {
    // Bomb next to a bomb next to two colorballs; color 1 (most frequent) holds a stripe too.
    var b = B.fromRows([
      '1 1 2 1',
      '0b 0b * *',
      '1 3 2 1v',
      '4 1 5 3'
    ]);
    var ctx = newCtx();
    RS.Engine._hitCell(b, P(1, 0), ctx, false);
    var triggered = ofType(ctx.events, 'specialTriggered');
    var perPos = {};
    triggered.forEach(function (e) { perPos[key(e.pos)] = (perPos[key(e.pos)] || 0) + 1; });
    deq(Object.keys(perPos).sort(), ['1,0', '1,1', '1,2', '1,3', '2,3']);
    Object.keys(perPos).forEach(function (k) { eq(perPos[k], 1, 'once at ' + k); });

    // Through a full resolve as well (cascades continue normally afterwards).
    var b2 = B.fromRows([
      '1 1 2 1',
      '0b 0b * *',
      '1 3 2 1v',
      '4 1 5 3'
    ]);
    var ctx2 = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map() };
    RS.Engine._hitCell(b2, P(1, 0), ctx2, false);
    RS.Engine._resolve(b2, ctx2);
    ok(ofType(ctx2.events, 'cleared').length >= 1);
  });

  t('special+special swap is valid even without a color match', function () {
    var rows = [
      '0h 1v 2 3',
      '1 2 3 4',
      '2 3 4 5',
      '3 4 5 0'
    ];
    var b = B.fromRows(rows);
    var idA = B.get(b, P(0, 0)).id;
    var idB = B.get(b, P(0, 1)).id;
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, true);
    eq(ofType(res.events, 'swapRejected').length, 0);
    deq(res.events.slice(0, 2).map(function (e) { return e.type; }), ['swapped', 'cascade']);
    var first = stage1(res.events);
    eq(ofType(first, 'matched').length, 0);
    var trig = ofType(first, 'specialTriggered');
    // Both swapped specials are reported, the cell dragged onto (b) first; the cross is centered on b.
    deq(trig.map(function (e) { return key(e.pos); }), ['0,1', '0,0']);
    var cross = union([block(b, 0, 0, 0, 3), block(b, 0, 3, 1, 1)]);
    deq(sorted(trig[0].cells), cross);
    var clearedIds = ofType(first, 'cleared')[0].candies.map(function (c) { return c.id; });
    ok(clearedIds.indexOf(idA) >= 0 && clearedIds.indexOf(idB) >= 0, 'both swapped specials cleared');
    eq(clearedIds.length, cross.length);
  });

  t('normal swap without specials and without match is still reverted', function () {
    var rows = ['0 1 2 3', '1 2 3 4', '2 3 4 5', '3 4 5 0'];
    var b = B.fromRows(rows);
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, false);
    deq(B.toRows(b), rows);
  });

  t('R9: an existing special inside a match triggers and never becomes the new special', function () {
    // Dragging the stripeH (1,2) up makes 0 0 0h 0. b=(0,2) holds the stripe, so the
    // new stripeV goes to the next free cell (0,0); the old stripe fires and is cleared.
    var b = B.fromRows([
      '0 0 1 0',
      '2 3 0h 4',
      '3 4 5 2',
      '4 5 2 3'
    ]);
    var stripeId = B.get(b, P(1, 2)).id;
    var newId = B.get(b, P(0, 0)).id;
    var res = RS.Engine.swap(b, P(1, 2), P(0, 2));
    eq(res.valid, true);
    var first = stage1(res.events);
    deq(ofType(first, 'specialCreated'),
      [{ type: 'specialCreated', pos: P(0, 0), id: newId, special: 'stripeV', color: 0 }]);
    deq(ofType(first, 'specialTriggered').map(function (e) { return [key(e.pos), e.special]; }),
      [['0,2', 'stripeH']]);
    var clearedIds = ofType(first, 'cleared')[0].candies.map(function (c) { return c.id; });
    ok(clearedIds.indexOf(stripeId) >= 0, 'old stripe cleared');
    ok(clearedIds.indexOf(newId) < 0, 'new special survives');
  });
})(window.RS = window.RS || {});
