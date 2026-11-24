(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var deq = RS.assert.deepEqual;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }
  function cherriesOnBoard(b) {
    var out = [];
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) {
        if (b.candies[r][c] && b.candies[r][c].cherry) { out.push(P(r, c)); }
      }
    }
    return out;
  }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  function rows(first, bottom) {
    return [
      first || '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      '3 4 5 1 4 5',
      bottom || '0 0 2 0 4 3'
    ];
  }

  t('cherry falls and is collected at the bottom', function () {
    var b = B.fromRows([
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      'c 4 5 1 4 5',
      '0 0 2 0 4 3'
    ]);
    var id = B.get(b, P(2, 0)).id;
    var res = RS.Engine.swap(b, P(3, 2), P(3, 3));
    eq(res.valid, true);
    deq(ofType(res.events, 'cherryCollected'), [{ type: 'cherryCollected', pos: P(3, 0), id: id }]);
    deq(cherriesOnBoard(b), []);
    ok(b.candies[3][0] && !b.candies[3][0].cherry, 'the freed cell is refilled with a normal candy');
  });

  t('cherry above void/crate/choco collected at lowest fall slot', function () {
    var none = '........';
    var b = B.fromRows([
      '1 2 3 4 1 2 3 4',
      '2 3 4 1 2 3 4 1',
      '3 4 1 2 3 4 1 2',
      'c c c 2 4 1 2 0',
      '# 1 2 3 1 0 0 2'
    ], {
      crate: ['00000000', '00000000', '00000000', '00000000', '01000000'],
      choco: [none, none, none, none, '..C.....']
    });
    var ids = [B.get(b, P(3, 0)).id, B.get(b, P(3, 1)).id, B.get(b, P(3, 2)).id];
    var res = RS.Engine.swap(b, P(3, 7), P(4, 7));
    eq(res.valid, true);
    var collected = ofType(res.events, 'cherryCollected');
    deq(collected.map(function (e) { return e.pos; }), [P(3, 0), P(3, 1), P(3, 2)]);
    deq(collected.map(function (e) { return e.id; }), ids);
    deq(cherriesOnBoard(b), []);
    eq(b.crate[4][1], 1);
    eq(b.choco[4][2], true);
  });

  t('cherry falls from row 0 onto the void, crate and choco columns and is collected there', function () {
    var none = '........';
    var b = B.fromRows([
      'c c c 4 1 2 3 4',
      '2 3 4 1 2 3 4 1',
      '3 4 1 2 3 4 1 2',
      '1 2 3 2 4 1 2 0',
      '# 1 2 3 1 0 0 2'
    ], {
      crate: ['00000000', '00000000', '00000000', '00000000', '01000000'],
      choco: [none, none, none, none, '..C.....']
    });
    var ids = [B.get(b, P(0, 0)).id, B.get(b, P(0, 1)).id, B.get(b, P(0, 2)).id];
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map(), combo: null };
    for (var r = 1; r <= 3; r++) {
      for (var c = 0; c <= 2; c++) { ctx.toClear.set(r + ',' + c, P(r, c)); }
    }
    RS.Engine._resolve(b, ctx);
    var fell = ofType(ctx.events, 'fell')[0];
    ids.forEach(function (id, i) {
      ok(fell.moves.some(function (m) { return m.id === id && m.from.r === 0 && m.to.r === 3 && m.to.c === i; }),
        'cherry ' + i + ' fell from row 0 to row 3');
    });
    var collected = ofType(ctx.events, 'cherryCollected');
    deq(collected.map(function (e) { return e.pos; }), [P(3, 0), P(3, 1), P(3, 2)]);
    deq(collected.map(function (e) { return e.id; }), ids);
    deq(cherriesOnBoard(b), []);
    eq(b.crate[4][1], 1);
    eq(b.choco[4][2], true);
  });

  t('cherry is collected in cascade stage 2 when the cascade frees its column', function () {
    var b = B.fromRows([
      '2 3 4 0 2',
      '1 4 3 2 0',
      '0 1 c 3 4',
      '4 0 1 2 3'
    ], { colors: 5 });
    var id = B.get(b, P(2, 2)).id;
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map(), combo: null };
    [P(2, 0), P(3, 0), P(3, 1)].forEach(function (p) { ctx.toClear.set(p.r + ',' + p.c, p); });
    RS.Engine._resolve(b, ctx);
    var stageAt = function (n) {
      for (var i = 0; i < ctx.events.length; i++) {
        if (ctx.events[i].type === 'cascade' && ctx.events[i].stage === n) { return i; }
      }
      return -1;
    };
    var collectedAt = -1;
    ctx.events.forEach(function (e, i) { if (e.type === 'cherryCollected') { collectedAt = i; } });
    eq(ofType(ctx.events, 'cherryCollected').length, 1);
    eq(ofType(ctx.events, 'cherryCollected')[0].id, id);
    deq(ofType(ctx.events, 'cherryCollected')[0].pos, P(3, 2));
    ok(stageAt(2) > 0, 'a second cascade stage ran');
    ok(collectedAt > stageAt(2), 'collected after stage 2 started');
    ok(stageAt(3) < 0 || collectedAt < stageAt(3), 'collected before stage 3');
    deq(cherriesOnBoard(b), []);
  });

  t('cherry never matches', function () {
    var b = B.fromRows(['c c c 1', '1 2 3 2', '2 3 1 3', '3 1 2 1']);
    eq(B.findMatches(b).length, 0);
    var b2 = B.fromRows(['0 0 c 0', '1 2 3 2', '2 3 1 3', '3 1 2 1']);
    eq(B.findMatches(b2).length, 0);
    var b3 = B.fromRows(['c 1 2 3', 'c 2 3 1', 'c 3 1 2', '1 2 3 1']);
    eq(B.findMatches(b3).length, 0);
  });

  t('hit and stripe leave cherry', function () {
    // Hammer on a glazed cherry: the glaze goes, the cherry stays, nothing is cleared.
    var b = B.fromRows(['1 2 3 4', '2 c 4 1', '3 4 1 2', '4 1 2 3'], { glaze: ['0000', '0100', '0000', '0000'] });
    var id = B.get(b, P(1, 1)).id;
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, true);
    eq(b.glaze[1][1], 0);
    var cleared = ofType(res.events, 'cleared');
    eq(cleared[0].candies.length, 0);
    eq(B.get(b, P(1, 1)).id, id);
    eq(B.get(b, P(1, 1)).cherry, true);
    deq(ofType(res.events, 'cherryCollected'), []);
    // A stripe sweeps the bottom row: the cherry there is passed over, then collected.
    var b2 = B.fromRows(rows('1 2 3 4 5 1', '0h 0 2 0 4 c'));
    var id2 = B.get(b2, P(3, 5)).id;
    var res2 = RS.Engine.swap(b2, P(3, 2), P(3, 3));
    eq(res2.valid, true);
    ofType(res2.events, 'cleared').forEach(function (e) {
      e.candies.forEach(function (c) { ok(c.id !== id2, 'cherry is not in a cleared list'); });
    });
    deq(ofType(res2.events, 'cherryCollected').map(function (e) { return e.id; }), [id2]);
  });

  t('smash on a plain cherry is rejected, on a locked one valid', function () {
    var rowsA = ['1 2 3 4', '2 c 4 1', '3 4 1 2', '4 1 2 3'];
    var b = B.fromRows(rowsA);
    var res = RS.Engine.smash(b, P(1, 1));
    eq(res.valid, false);
    eq(ofType(res.events, 'smashRejected').length, 1);
    eq(B.get(b, P(1, 1)).cherry, true);
    var bl = B.fromRows(rowsA, { lock: ['0000', '0L00', '0000', '0000'] });
    var rl = RS.Engine.smash(bl, P(1, 1));
    eq(rl.valid, true);
    eq(bl.lock[1][1], false);
    eq(B.get(bl, P(1, 1)).cherry, true);
  });

  t('session: smash on a plain cherry is rejected and reports smashRejected', function () {
    var lv = { id: 't', colors: 5, seed: 1, moves: 5, layout: [], goals: [{ type: 'score', target: 100000 }] };
    var s = RS.Session._fromBoard(lv, B.fromRows(['1 2 3 4', '2 c 4 1', '3 4 1 2', '4 1 2 3'], { colors: 5 }));
    var ev = RS.Session.smash(s, P(1, 1));
    eq(ofType(ev, 'smashRejected').length, 1);
    eq(ofType(ev, 'smashed').length, 0);
    eq(s.goals.movesLeft, 5);
  });

  t('swap with cherry valid only with match', function () {
    var layout = ['1 2 3 4 1', '0 0 c 0 2', '2 3 4 1 3', '3 4 1 2 4'];
    var b = B.fromRows(layout);
    var moves = B.findPossibleMoves(b);
    ok(moves.some(function (m) {
      return m.a.r === 1 && m.a.c === 2 && m.b.r === 1 && m.b.c === 3;
    }), 'the completing swap is listed');
    ok(!moves.some(function (m) {
      return m.a.r === 1 && m.a.c === 2 && m.b.r === 2 && m.b.c === 2;
    }), 'a swap without a match is not listed');
    var bad = RS.Engine.swap(b, P(1, 2), P(2, 2));
    eq(bad.valid, false);
    deq(B.toRows(b), B.toRows(B.fromRows(layout)));
    var good = RS.Engine.swap(b, P(1, 2), P(1, 3));
    eq(good.valid, true);
  });

  t('colourball with cherry is no combo', function () {
    var b = B.fromRows(['* c 1 2', '2 1 2 1', '1 2 1 2', '2 1 2 1']);
    eq(RS.Specials.combo(b, P(0, 0), P(0, 1)), null);
    eq(RS.Specials.combo(b, P(0, 1), P(0, 0)), null);
    ok(!B.findPossibleMoves(b).some(function (m) {
      return m.a.r === 0 && m.a.c === 0 && m.b.r === 0 && m.b.c === 1;
    }), 'swap is not offered as a move');
    var res = RS.Engine.swap(b, P(0, 0), P(0, 1));
    eq(res.valid, false);
    eq(B.get(b, P(0, 0)).special, 'colorball');
    eq(B.get(b, P(0, 1)).cherry, true);
  });

  t('shuffle keeps cherry in place', function () {
    for (var seed = 1; seed <= 5; seed++) {
      var b = B.fromRows(['1 2 3 4 1', '2 c 4 1 2', '3 4 1 2 3', '4 1 2 3 4'], { seed: seed });
      var id = B.get(b, P(1, 1)).id;
      var moved = B.shuffle(b);
      eq(B.get(b, P(1, 1)).id, id);
      eq(B.get(b, P(1, 1)).cherry, true);
      ok(!moved.some(function (m) { return m.id === id; }), 'cherry is not reported as moved');
    }
  });

  t('spawn respects onBoard and total', function () {
    function fresh(b) { return { id: b.nextId++, color: 0, special: null }; }
    var b = B.fromRows(['1 2 3 4', '2 3 4 1', '3 4 1 2', 'c 1 2 3']);
    b.cherryRule = { total: 3, onBoard: 2 };
    eq(b.cherryOnBoard, 1);
    eq(b.cherrySpawned, 1);
    var x1 = RS.Cherries.spawnInto(b, fresh(b));
    eq(x1.cherry, true);
    eq(x1.color, null);
    var x2 = RS.Cherries.spawnInto(b, fresh(b));
    ok(!x2.cherry, 'onBoard limit reached');
    eq(x2.color, 0);
    var events = [];
    eq(RS.Cherries.collect(b, events), 1);
    eq(b.cherryOnBoard, 1);
    var x3 = RS.Cherries.spawnInto(b, fresh(b));
    eq(x3.cherry, true);
    eq(b.cherrySpawned, 3);
    b.candies[3][1] = x3;
    eq(RS.Cherries.collect(b, events), 1);
    var x4 = RS.Cherries.spawnInto(b, fresh(b));
    ok(!x4.cherry, 'total limit reached');
    // Through the engine: the spawn step makes exactly one cherry.
    var e = B.fromRows(rows());
    e.cherryRule = { total: 1, onBoard: 1 };
    var res = RS.Engine.swap(e, P(3, 2), P(3, 3));
    var spawnedCherries = 0;
    ofType(res.events, 'spawned').forEach(function (s) {
      s.candies.forEach(function (c) { if (c.cherry) { spawnedCherries++; } });
    });
    eq(spawnedCherries, 1);
    eq(e.cherrySpawned, 1);
  });

  t('cherry goal counts collected', function () {
    var levelDef = { moves: 5, colors: 6, goals: [{ type: 'cherry', target: 2 }] };
    var b = B.fromRows([
      '1 2 3 4 5 1',
      '2 3 4 1 2 5',
      'c 4 5 1 4 5',
      '0 0 2 0 4 3'
    ]);
    var state = RS.Goals.create(levelDef, b);
    RS.Goals.apply(state, [{ type: 'cherryCollected', pos: P(3, 0), id: 1 }]);
    eq(state.goals[0].count, 1);
    eq(RS.Goals.allDone(state), false);
    RS.Goals.apply(state, [{ type: 'cherryCollected', pos: P(3, 1), id: 2 }]);
    eq(RS.Goals.allDone(state), true);

    var session = RS.Session._fromBoard({ moves: 5, colors: 6, goals: [{ type: 'cherry', target: 1 }] }, b);
    var events = RS.Session.move(session, P(3, 2), P(3, 3));
    eq(session.goals.goals[0].count, 1);
    eq(session.status, 'won');
    ok(ofType(events, 'levelWon').length === 1);
  });

  t('startLevel counts layout cherries and collects at once', function () {
    var layout = [
      '00000000', '00000000', '00000000', 'R0000000',
      '00000000', '00000000', '00000000', 'R0000000'
    ];
    var session = RS.Session.startLevel({
      id: 'x', moves: 10, colors: 5, seed: 7, layout: layout,
      goals: [{ type: 'cherry', target: 3 }], cherries: { total: 2, onBoard: 1 }
    });
    deq(session.board.cherryRule, { total: 2, onBoard: 1 });
    eq(session.board.cherrySpawned, 2);
    // The bottom cherry is collected at once; the upper one drops onto the candies below it.
    eq(session.board.cherryOnBoard, 1);
    deq(cherriesOnBoard(session.board), [P(4, 0)]);
    eq(session.goals.goals[0].count, 1);
    eq(session.status, 'playing');
  });

  t('start cascade counts score and collect goal', function () {
    var layout = [
      '00000000', '00000000', '00000000', '00000000',
      '00000000', '00000000', '00000000', 'R0000000'
    ];
    var goals = [{ type: 'score', target: 1000000 }];
    for (var col = 0; col < 5; col++) { goals.push({ type: 'collect', color: col, target: 1000 }); }
    var found = null;
    for (var seed = 1; seed <= 300 && !found; seed++) {
      var s = RS.Session.startLevel({ id: 'x', moves: 10, colors: 5, seed: seed, layout: layout, goals: goals });
      if (s.goals.score > 0) { found = s; }
    }
    ok(found, 'some seed makes the refill cascade at the start');
    var collected = 0;
    found.goals.goals.forEach(function (g) { if (g.type === 'collect') { collected += g.count; } });
    ok(collected >= 3, 'the cleared candies count for the collect goals');
    eq(found.goals.movesLeft, 10);
    eq(found.moveNo, 0);
    eq(found.status, 'playing');
    // A start cascade never wins: even with every goal met the level stays playing.
    var easy = RS.Session.startLevel({ id: 'x', moves: 10, colors: 5, seed: found.level.seed, layout: layout,
      goals: [{ type: 'score', target: 1 }] });
    eq(RS.Goals.allDone(easy.goals), true);
    eq(easy.status, 'playing');
  });
})(window.RS);
