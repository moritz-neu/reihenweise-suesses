(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var deq = RS.assert.deepEqual;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  var ROWS = ['1 2 3 4 5 1', '2 3 4 1 2 5', '3 4 5 1 4 5', '0 0 2 0 4 3'];

  function level(goals, moves, fuses) {
    return { id: 't', colors: 5, seed: 1, moves: moves, layout: [], goals: goals, fuses: fuses };
  }
  // A session on ROWS; every [r, c, n] in marks gets a fuse counter n.
  function session(goals, moves, fuses, marks) {
    var board = B.fromRows(ROWS, { colors: 5 });
    (marks || []).forEach(function (m) { board.candies[m[0]][m[1]].fuse = m[2]; });
    board.fuseRule = fuses || null;
    return RS.Session._fromBoard(level(goals, moves, fuses), board);
  }
  var NEVER = [{ type: 'score', target: 1000000 }];
  var NOSPAWN = { start: 9, spawnEvery: 0 };
  function play(s) { return RS.Session.move(s, P(3, 2), P(3, 3)); }
  // Sorted counters of all fuse candies (candies fall, so cells are not stable).
  function values(b) {
    var out = [];
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) {
        if (b.candies[r][c] && b.candies[r][c].fuse !== undefined) { out.push(b.candies[r][c].fuse); }
      }
    }
    return out.sort(function (x, y) { return x - y; });
  }
  function fuseCount(b) {
    var n = 0;
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) { if (b.candies[r][c] && b.candies[r][c].fuse) { n++; } }
    }
    return n;
  }

  t('fuses: tick lowers counters', function () {
    var b = B.fromRows(ROWS, { colors: 5 });
    b.candies[0][0].fuse = 5;
    b.candies[1][1].fuse = 2;
    var res = RS.Fuses.tick(b);
    eq(b.candies[0][0].fuse, 4);
    eq(b.candies[1][1].fuse, 1);
    eq(res.exploded, false);
    eq(res.events.length, 1);
    eq(res.events[0].type, 'fuseTick');
    deq(res.events[0].cells.map(function (x) { return [x.pos.r, x.pos.c, x.fuse]; }), [[0, 0, 4], [1, 1, 1]]);
    var res2 = RS.Fuses.tick(b);
    eq(res2.exploded, true);
    eq(b.candies[1][1].fuse, 0);
    var none = RS.Fuses.tick(B.fromRows(ROWS, { colors: 5 }));
    eq(none.events.length, 0);
    eq(none.exploded, false);
  });

  t('fuses: clearing defuses and counts goal', function () {
    var s = session([{ type: 'fuse', target: 2 }], 5, NOSPAWN, [[3, 0, 4], [3, 1, 4]]);
    var ev = play(s);
    var d = ofType(ev, 'fuseDefused');
    eq(d.length, 2);
    deq(d.map(function (e) { return e.pos; }), [P(3, 0), P(3, 1)]);
    eq(s.goals.goals[0].count, 2);
    eq(s.status, 'won');
  });

  t('fuses: zero after non-winning move loses with reason fuse', function () {
    var s = session(NEVER, 5, NOSPAWN, [[0, 0, 1]]);
    var ev = play(s);
    eq(s.status, 'lost');
    eq(s.lostBy, 'fuse');
    var lost = ofType(ev, 'levelLost');
    eq(lost.length, 1);
    eq(lost[0].reason, 'fuse');
    eq(lost[0].score, s.goals.score);
    eq(s.goals.movesLeft, 4);
  });

  t('fuses: out of moves is not a fuse loss', function () {
    var s = session(NEVER, 1, NOSPAWN, [[0, 0, 5]]);
    var ev = play(s);
    eq(s.status, 'lost');
    eq(ofType(ev, 'levelLost')[0].reason, undefined);
    eq(s.lostBy, 'moves');
  });

  t('fuses: last move with fuse at 1 is a fuse loss and rescue extends fuses', function () {
    var s = session(NEVER, 1, NOSPAWN, [[0, 0, 1], [1, 1, 3]]);
    var ev = play(s);
    eq(s.goals.movesLeft, 0);
    eq(s.status, 'lost');
    eq(s.lostBy, 'fuse');
    var lost = ofType(ev, 'levelLost');
    eq(lost.length, 1);
    eq(lost[0].reason, 'fuse');
    RS.Session.addMoves(s, 5);
    eq(s.status, 'playing');
    deq(values(s.board), [5, 7]);
  });

  t('fuses: last move without fuse danger stays a moves loss', function () {
    var s = session(NEVER, 1, NOSPAWN, [[0, 0, 2]]);
    var ev = play(s);
    eq(s.status, 'lost');
    eq(s.lostBy, 'moves');
    var lost = ofType(ev, 'levelLost');
    eq(lost.length, 1);
    eq(lost[0].reason, undefined);
    deq(values(s.board), [1]);
  });

  t('fuses: win on the same move beats the fuse', function () {
    var s = session([{ type: 'score', target: 60 }], 5, NOSPAWN, [[0, 0, 1]]);
    var ev = play(s);
    eq(s.status, 'won');
    eq(ofType(ev, 'levelWon').length, 1);
    eq(ofType(ev, 'levelLost').length, 0);
    eq(ofType(ev, 'fuseTick').length, 0);
    deq(values(s.board), [1]);
  });

  t('fuses: winning on the last move beats a fuse that would reach 0', function () {
    var s = session([{ type: 'score', target: 60 }], 1, NOSPAWN, [[0, 0, 1]]);
    var ev = play(s);
    eq(s.goals.movesLeft, 0);
    eq(s.status, 'won');
    eq(ofType(ev, 'levelWon').length, 1);
    eq(ofType(ev, 'levelLost').length, 0);
    eq(ofType(ev, 'fuseTick').length, 0);
    deq(values(s.board), [1]);
  });

  t('fuses: rescue adds 5 moves and 5 to every fuse', function () {
    var s = session(NEVER, 5, NOSPAWN, [[0, 0, 1], [1, 1, 3]]);
    play(s);
    eq(s.status, 'lost');
    var ev = RS.Session.addMoves(s, 5);
    eq(s.status, 'playing');
    eq(s.goals.movesLeft, 9);
    deq(values(s.board), [5, 7]);
    eq(ofType(ev, 'movesChanged')[0].movesLeft, 9);
    eq(s.lostBy, null);
  });

  t('fuses: a normal out-of-moves rescue leaves the counters alone', function () {
    var s = session(NEVER, 1, NOSPAWN, [[0, 0, 5]]);
    play(s);
    eq(s.status, 'lost');
    var ev = RS.Session.addMoves(s, 5);
    eq(s.status, 'playing');
    deq(values(s.board), [4]); // ticked on the last move, not extended
    eq(ev.length, 1);
  });

  t('fuses: spawn every Nth move in top row', function () {
    var b = B.fromRows(ROWS, { colors: 5 });
    var rule = { start: 7, spawnEvery: 3 };
    eq(RS.Fuses.spawn(b, rule, 1).length, 0);
    eq(RS.Fuses.spawn(b, rule, 2).length, 0);
    eq(fuseCount(b), 0);
    var ev = RS.Fuses.spawn(b, rule, 3);
    eq(ev.length, 1);
    eq(ev[0].type, 'fuseSpawned');
    eq(ev[0].pos.r, 0);
    eq(b.candies[0][ev[0].pos.c].fuse, 7);
    eq(b.candies[0][ev[0].pos.c].id, ev[0].id);
    eq(fuseCount(b), 1);
    eq(RS.Fuses.spawn(b, { start: 7, spawnEvery: 0 }, 3).length, 0);
    eq(RS.Fuses.spawn(b, null, 3).length, 0);
  });

  t('fuses: session counts valid swap moves and spawns on the Nth', function () {
    var s = session(NEVER, 9, { start: 7, spawnEvery: 2 });
    eq(s.moveNo, 0);
    var invalid = RS.Session.move(s, P(0, 0), P(2, 2));
    eq(ofType(invalid, 'swapRejected').length, 1);
    eq(s.moveNo, 0);
    var ev = play(s);
    eq(s.moveNo, 1);
    eq(ofType(ev, 'fuseSpawned').length, 0);
    var m = B.findPossibleMoves(s.board)[0];
    ev = RS.Session.move(s, m.a, m.b);
    eq(s.moveNo, 2);
    eq(ofType(ev, 'fuseSpawned').length, 1);
  });

  t('fuses: spawn goes to the topmost row with a free candy', function () {
    var b = B.fromRows(['# # 1 2', '3 4 1 2', '3 4 1 2'], { colors: 5 });
    b.candies[0][2].special = 'stripeH';
    b.candies[0][3].fuse = 4;
    var ev = RS.Fuses.spawn(b, { start: 6, spawnEvery: 1 }, 1);
    eq(ev.length, 1);
    eq(ev[0].pos.r, 1);
    eq(RS.Obstacles.isFree(b, ev[0].pos), false, 'a fused candy is no longer free');
  });

  t('fuses: hammer and jokers do not tick', function () {
    var s = session(NEVER, 5, { start: 9, spawnEvery: 1 }, [[0, 0, 1]]);
    var ev = RS.Session.smash(s, P(3, 0));
    eq(ofType(ev, 'fuseTick').length, 0);
    eq(s.status, 'playing');
    deq(values(s.board), [1]);
    eq(s.moveNo, 0);
    ev = RS.Session.useJoker(s, 'besen', P(2, 0));
    eq(ofType(ev, 'fuseTick').length, 0);
    eq(ofType(ev, 'fuseSpawned').length, 0);
    eq(s.status, 'playing');
    deq(values(s.board), [1]);
    eq(s.moveNo, 0);
    eq(s.goals.movesLeft, 5);
  });

  t('fuses: hammer defuses a fuse candy', function () {
    var s = session([{ type: 'fuse', target: 1 }], 5, NOSPAWN, [[3, 0, 4]]);
    var ev = RS.Session.smash(s, P(3, 0));
    eq(ofType(ev, 'fuseDefused').length, 1);
    eq(s.status, 'won');
  });

  // Swapping (2,2) and (2,3) makes a vertical 0-0-0-0 in column 3 (rows 0..3), line4.
  var LINE4 = ['1 2 3 0 5 1', '2 3 4 0 2 5', '3 4 0 5 4 5', '5 2 4 0 1 3'];

  t('fuses: fuse candy is never turned into a special', function () {
    var b = B.fromRows(LINE4, { colors: 6 });
    b.candies[2][2].fuse = 6; // the swapped-in candy: the preferred spot, but fused
    var res = RS.Engine.swap(b, P(2, 2), P(2, 3));
    eq(res.valid, true);
    var made = ofType(res.events, 'specialCreated');
    eq(made.length, 1);
    ok(!(made[0].pos.r === 2 && made[0].pos.c === 3), 'the fused candy is not the special');
    eq(ofType(res.events, 'fuseDefused').length, 1);
  });

  t('fuses: a match of fuse candies only makes no special at all', function () {
    var b = B.fromRows(LINE4, { colors: 6 });
    [[0, 3], [1, 3], [2, 2], [3, 3]].forEach(function (p) { b.candies[p[0]][p[1]].fuse = 6; });
    var res = RS.Engine.swap(b, P(2, 2), P(2, 3));
    eq(res.valid, true);
    eq(ofType(res.events, 'specialCreated').length, 0);
    eq(ofType(res.events, 'fuseDefused').length, 4);
  });

  t('fuses: layout F places a fuse candy with the level start', function () {
    var layout = ['F.......', '........', '........', '........', '........', '........', '........', '........'];
    var s = RS.Session.startLevel({ id: 't', colors: 5, seed: 3, moves: 20, layout: layout,
      goals: NEVER, fuses: { start: 6, spawnEvery: 0 } });
    eq(s.board.candies[0][0].fuse, 6);
    eq(s.board.fuseRule.start, 6);
    var s2 = RS.Session.startLevel({ id: 't', colors: 5, seed: 3, moves: 20, layout: layout, goals: NEVER });
    eq(s2.board.candies[0][0].fuse, 9);
    eq(s2.board.fuseRule, null);
    eq(s2.moveNo, 0);
  });

  // The same board with a chocolate cell, a chameleon rule and the first boss, all due on this move.
  function dueSession(fuseValue) {
    var board = B.fromRows(ROWS, { colors: 5, choco: ['.....C', '......', '......', '......'] });
    board.candies[1][1].fuse = fuseValue;
    board.fuseRule = { start: 9, spawnEvery: 1 };
    board.chameleonRule = { spawnEvery: 1 };
    var s = RS.Session._fromBoard({ id: 't', colors: 5, seed: 1, moves: 5, layout: [], goals: NEVER,
      boss: 'lakritz', fuses: board.fuseRule, chameleons: board.chameleonRule }, board);
    s.boss.counter = 2;
    return s;
  }

  t('fuses: a fuse loss ends the step before spawn, chocolate spread and boss step', function () {
    var control = dueSession(5);
    var cev = play(control);
    eq(ofType(cev, 'fuseSpawned').length, 1, 'control: a fuse spawns');
    eq(ofType(cev, 'chameleonSpawned').length, 1, 'control: a chameleon spawns');
    eq(ofType(cev, 'chocoSpread').length, 1, 'control: the chocolate spreads');
    eq(ofType(cev, 'bossAttack').length, 1, 'control: the boss attacks');

    var s = dueSession(1);
    var ev = play(s);
    eq(s.status, 'lost');
    eq(s.lostBy, 'fuse');
    eq(ofType(ev, 'levelLost')[0].reason, 'fuse');
    eq(ofType(ev, 'fuseSpawned').length, 0);
    eq(ofType(ev, 'chameleonSpawned').length, 0);
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(ofType(ev, 'bossAttack').length, 0);
    eq(s.boss.counter, 2, 'the boss did not count the move');
    eq(RS.Obstacles.countChoco(s.board), 1);
  });

  t('fuses: a fuse candy is never a chocolate spread target', function () {
    // The chocolate sits at (3,5); its only free neighbours (3,4) and (2,5) both hold a fuse.
    var board = B.fromRows(ROWS, { colors: 5, choco: ['......', '......', '......', '.....C'] });
    board.candies[3][4].fuse = 9;
    board.candies[2][5].fuse = 9;
    var s = RS.Session._fromBoard(level(NEVER, 5, null), board);
    var ev = play(s);
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(RS.Obstacles.countChoco(s.board), 1);
    deq(values(s.board), [8, 8]);
  });

  t('fuses: a fuse candy is never a boss attack target', function () {
    var board = B.fromRows(ROWS, { colors: 5 });
    var free = [P(0, 0), P(1, 1), P(2, 2), P(3, 3)];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var isFree = free.some(function (p) { return p.r === r && p.c === c; });
        if (!isFree) { board.candies[r][c].fuse = 9; }
      }
    }
    var boss = RS.Boss.create('lakritz');
    boss.counter = 2;
    var ev = RS.Boss.step(boss, board);
    var atk = ofType(ev, 'bossAttack')[0];
    eq(atk.kind, 'lock');
    eq(atk.cells.length, 2);
    atk.cells.forEach(function (q) {
      ok(free.some(function (p) { return p.r === q.r && p.c === q.c; }), 'target is a plain candy');
      eq(board.candies[q.r][q.c].fuse, undefined);
    });
    eq(fuseCount(board), 20);
    var locked = 0;
    board.lock.forEach(function (row, r) {
      row.forEach(function (v, c) {
        if (v) { locked++; eq(board.candies[r][c].fuse, undefined, 'no lock on a fuse candy'); }
      });
    });
    eq(locked, 2);
  });
})(window.RS);
