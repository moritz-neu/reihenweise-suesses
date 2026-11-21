(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }

  // Swapping (3,2) and (3,3) makes a horizontal 0-0-0 in the bottom row (cols 0..2).
  var ROWS = ['1 2 3 4 5 1', '2 3 4 1 2 5', '3 4 5 1 4 5', '0 0 2 0 4 3'];

  function level(goals, moves) {
    return { id: 't', colors: 5, seed: 1, moves: moves, layout: [], goals: goals };
  }
  function session(goals, moves, boardOpts) {
    var lv = level(goals, moves);
    return RS.Session._fromBoard(lv, B.fromRows(ROWS, boardOpts || { colors: 5 }));
  }
  function play(s) { return RS.Session.move(s, P(3, 2), P(3, 3)); }

  t('session: invalid swap costs no move', function () {
    var s = session([{ type: 'score', target: 60 }], 5);
    var ev = RS.Session.move(s, P(0, 0), P(2, 2));
    eq(s.goals.movesLeft, 5);
    eq(s.status, 'playing');
    eq(ofType(ev, 'movesChanged').length, 0);
    eq(ofType(ev, 'swapRejected').length, 1);
  });

  t('session: valid swap costs one move and emits scoreChanged/movesChanged/goalProgress', function () {
    var s = session([{ type: 'score', target: 100000 }], 5);
    var ev = play(s);
    eq(s.goals.movesLeft, 4);
    var sc = ofType(ev, 'scoreChanged');
    eq(sc.length, 1);
    ok(sc[0].score >= 60);
    eq(sc[0].score, s.goals.score);
    eq(ofType(ev, 'movesChanged')[0].movesLeft, 4);
    var gp = ofType(ev, 'goalProgress');
    eq(gp.length, 1);
    ok(gp[0].goals !== s.goals.goals, 'goal list is a copy');
    eq(gp[0].goals[0].type, 'score');
  });

  t('session: collect goal counts cleared candies of that color, capped at target', function () {
    var s = session([{ type: 'collect', color: 0, target: 2 }], 5);
    play(s);
    eq(s.goals.goals[0].count, 2);
    var s2 = session([{ type: 'collect', color: 4, target: 50 }], 5);
    play(s2);
    eq(s2.goals.goals[0].count, 0);
  });

  t('session: collect goal counts specials of the color, not colorballs', function () {
    var st = RS.Goals.create(level([{ type: 'collect', color: 1, target: 10 }], 5), B.fromRows(ROWS, { colors: 5 }));
    RS.Goals.apply(st, [{ type: 'cleared', points: 0, candies: [
      { id: 1, color: 1, special: 'stripeH', pos: P(0, 0) },
      { id: 2, color: null, special: 'colorball', pos: P(0, 1) },
      { id: 3, color: 1, special: null, pos: P(0, 2) },
      { id: 4, color: 2, special: null, pos: P(0, 3) }
    ] }]);
    eq(st.goals[0].count, 2);
  });

  t('session: glaze goal counts fully removed glaze', function () {
    var opts = { colors: 5, glaze: ['000000', '000000', '000000', '200000'] };
    var s = session([{ type: 'glaze' }], 5, opts);
    eq(s.goals.goals[0].target, 1);
    play(s);
    eq(s.goals.goals[0].count, 0); // glaze 2 -> 1 only
    var s2 = session([{ type: 'glaze' }], 5, { colors: 5, glaze: ['000000', '000000', '000000', '100000'] });
    play(s2);
    eq(s2.goals.goals[0].count, 1);
  });

  t('session: win on the very last move is a win', function () {
    var s = session([{ type: 'score', target: 60 }], 1);
    var ev = play(s);
    eq(s.status, 'won');
    eq(ofType(ev, 'levelWon').length, 1);
    eq(ofType(ev, 'levelLost').length, 0);
  });

  t('session: loss when moves run out', function () {
    var s = session([{ type: 'score', target: 100000 }], 1);
    var ev = play(s);
    eq(s.status, 'lost');
    eq(ofType(ev, 'levelLost').length, 1);
    eq(ofType(ev, 'levelLost')[0].score, s.goals.score);
    eq(ofType(ev, 'levelWon').length, 0);
  });

  t('session: bonus 250 per remaining move', function () {
    var s = session([{ type: 'score', target: 60 }], 3);
    var ev = play(s);
    var won = ofType(ev, 'levelWon')[0];
    eq(RS.Goals.BONUS_PER_MOVE, 250);
    eq(won.bonus, 500);
    eq(won.score, s.goals.score);
    ok(won.score >= 560);
    // scoreChanged reports the final score including bonus
    var sc = ofType(ev, 'scoreChanged');
    eq(sc[sc.length - 1].score, won.score);
  });

  t('session: starMoves are 25 % and 50 % of the moves, rounded up', function () {
    eq(RS.Goals.STAR_SHARES[0], 0.25);
    eq(RS.Goals.STAR_SHARES[1], 0.5);
    RS.assert.deepEqual(RS.Goals.starMoves(20), [5, 10]);
    RS.assert.deepEqual(RS.Goals.starMoves(18), [5, 9]);
    RS.assert.deepEqual(RS.Goals.starMoves(1), [1, 1]);
  });

  t('session: stars depend on moves left, not on score', function () {
    var lv = level([{ type: 'score', target: 60 }], 20);
    var st = RS.Goals.create(lv, B.fromRows(ROWS, { colors: 5 }));
    eq(RS.Goals.starsFor(st), 0);
    RS.Goals.apply(st, [{ type: 'cleared', points: 59, candies: [] }]);
    eq(RS.Goals.starsFor(st), 0);
    RS.Goals.apply(st, [{ type: 'cleared', points: 1, candies: [] }]);
    eq(RS.Goals.allDone(st), true);
    st.movesLeft = 10; eq(RS.Goals.starsFor(st), 3);
    st.movesLeft = 9; eq(RS.Goals.starsFor(st), 2);
    st.movesLeft = 5; eq(RS.Goals.starsFor(st), 2);
    st.movesLeft = 4; eq(RS.Goals.starsFor(st), 1);
    st.movesLeft = 0; eq(RS.Goals.starsFor(st), 1);
    st.score = 999999; st.movesLeft = 0; eq(RS.Goals.starsFor(st), 1);
  });

  t('session: an early win gives levelWon with 3 stars', function () {
    var s = session([{ type: 'score', target: 60 }], 3);
    var won = ofType(play(s), 'levelWon')[0];
    eq(s.goals.movesLeft, 2);
    eq(won.stars, 3);
  });

  t('session: input after win or loss returns []', function () {
    var won = session([{ type: 'score', target: 60 }], 3);
    play(won);
    var score = won.goals.score;
    eq(RS.Session.move(won, P(3, 2), P(3, 3)).length, 0);
    eq(won.goals.score, score);
    var lost = session([{ type: 'score', target: 100000 }], 1);
    play(lost);
    eq(RS.Session.move(lost, P(3, 2), P(3, 3)).length, 0);
  });

  t('session: startLevel builds the board from the level definition', function () {
    var layout = [];
    for (var i = 0; i < 8; i++) { layout.push('oooooooo'); }
    var lv = { id: 'x', colors: 5, seed: 7, moves: 12, layout: layout, goals: [{ type: 'score', target: 100 }] };
    var s = RS.Session.startLevel(lv);
    eq(s.mode, 'level');
    eq(s.status, 'playing');
    eq(s.board.rows, 8);
    eq(s.goals.movesLeft, 12);
  });
  function endless(boardOpts) {
    return RS.Session._fromBoard(null, B.fromRows(ROWS, boardOpts || { colors: 5 }), 'endless');
  }

  t('endless: startEndless gives a full time bar and an 8x8 board', function () {
    var s = RS.Session.startEndless(3);
    eq(s.mode, 'endless');
    eq(s.status, 'playing');
    eq(s.score, 0);
    eq(s.time, 60);
    eq(s.max, 60);
    eq(s.board.rows, 8);
    eq(s.board.colors, 6);
  });

  t('endless: tick drains time', function () {
    var s = endless();
    var ev = RS.Session.tick(s, 1.5);
    eq(s.time, 58.5);
    eq(ev.length, 1);
    eq(ev[0].type, 'timeChanged');
    eq(ev[0].time, 58.5);
    eq(ev[0].max, 60);
  });

  t('endless: clearing candies refills time', function () {
    var s = endless();
    s.time = 10;
    var ev = play(s);
    ok(s.time >= 10 + RS.Session.ENDLESS.REFILL_PER_CANDY * 3 - 1e-9, 'refilled by at least 3 candies');
    ok(s.time <= s.max);
    eq(ofType(ev, 'timeChanged')[0].time, s.time);
    eq(ofType(ev, 'scoreChanged')[0].score, s.score);
    ok(s.score >= 60);
  });

  t('endless: time never exceeds max', function () {
    var s = endless();
    s.time = 59.9;
    play(s);
    eq(s.time, 60);
  });

  t('endless: invalid swap returns engine events only', function () {
    var s = endless();
    var ev = RS.Session.move(s, P(0, 0), P(2, 2));
    eq(ofType(ev, 'swapRejected').length, 1);
    eq(ofType(ev, 'scoreChanged').length + ofType(ev, 'timeChanged').length, 0);
  });

  t('endless: time 0 ends the game exactly once', function () {
    var s = endless();
    var ev = RS.Session.tick(s, 100);
    eq(s.time, 0);
    eq(s.status, 'over');
    eq(ofType(ev, 'timeChanged').length, 1);
    eq(ofType(ev, 'endlessOver').length, 1);
    eq(RS.Session.tick(s, 1).length, 0);
  });

  t('endless: move after over returns []', function () {
    var s = endless();
    RS.Session.tick(s, 100);
    eq(RS.Session.move(s, P(3, 2), P(3, 3)).length, 0);
  });

  function smashSession(goals, moves) { return session(goals, moves); }

  t('session: smash costs no move', function () {
    var s = smashSession([{ type: 'score', target: 100000 }], 5);
    var ev = RS.Session.smash(s, P(0, 0));
    eq(s.goals.movesLeft, 5);
    eq(s.status, 'playing');
    eq(ofType(ev, 'scoreChanged').length, 1);
    eq(ofType(ev, 'levelLost').length, 0);
  });

  t('session: smash can win', function () {
    var s = smashSession([{ type: 'score', target: 10 }], 5);
    var ev = RS.Session.smash(s, P(0, 0));
    eq(s.status, 'won');
    var won = ofType(ev, 'levelWon');
    eq(won.length, 1);
    eq(won[0].bonus, 5 * 250);
  });

  t('session: smash after end and in endless returns []', function () {
    var s = smashSession([{ type: 'score', target: 10 }], 5);
    RS.Session.smash(s, P(0, 0));
    eq(RS.Session.smash(s, P(1, 1)).length, 0);
    var e = RS.Session._fromBoard(null, B.fromRows(ROWS, { colors: 5 }), 'endless');
    eq(RS.Session.smash(e, P(0, 0)).length, 0);
  });

  t('session: addMoves while playing', function () {
    var s = smashSession([{ type: 'score', target: 100000 }], 5);
    var ev = RS.Session.addMoves(s, 5);
    eq(s.goals.movesLeft, 10);
    eq(ev.length, 1);
    eq(ev[0].type, 'movesChanged');
    eq(ev[0].movesLeft, 10);
  });

  t('session: addMoves revives lost, not won', function () {
    var s = smashSession([{ type: 'score', target: 100000 }], 5);
    s.status = 'lost';
    s.goals.movesLeft = 0;
    eq(RS.Session.addMoves(s, 5).length, 1);
    eq(s.status, 'playing');
    eq(s.goals.movesLeft, 5);
    s.status = 'won';
    eq(RS.Session.addMoves(s, 5).length, 0);
    eq(s.status, 'won');
    eq(s.goals.movesLeft, 5);
  });

  t('session: addMoves in endless returns []', function () {
    var e = RS.Session._fromBoard(null, B.fromRows(ROWS, { colors: 5 }), 'endless');
    eq(RS.Session.addMoves(e, 5).length, 0);
  });

  // Chocolate spread after swap moves.
  var NOWIN = [{ type: 'score', target: 100000 }];
  function chocoCount(b) { return RS.Obstacles.countChoco(b); }

  t('choco: spreads when none removed', function () {
    var s = session(NOWIN, 5, { colors: 5, choco: ['.....C', '......', '......', '......'] });
    var ev = play(s);
    var sp = ofType(ev, 'chocoSpread');
    eq(sp.length, 1);
    eq(ofType(ev, 'obstacleHit').length, 0);
    eq(chocoCount(s.board), 2);
    eq(s.board.choco[sp[0].to.r][sp[0].to.c], true);
    eq(s.board.candies[sp[0].to.r][sp[0].to.c], null);
    eq(s.board.choco[sp[0].from.r][sp[0].from.c], true);
    ok(sp[0].candyId !== undefined);
  });

  t('choco: no spread when one was removed', function () {
    var s = session(NOWIN, 5, { colors: 5, choco: ['.....C', '......', 'C.....', '......'] });
    var ev = play(s);
    ok(ofType(ev, 'obstacleHit').some(function (e) { return e.kind === 'choco'; }));
    eq(ofType(ev, 'chocoSpread').length, 0);
  });

  t('choco: no spread from hammer', function () {
    var s = session(NOWIN, 5, { colors: 5, choco: ['.....C', '......', '......', '......'] });
    var ev = RS.Session.smash(s, P(3, 0));
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(chocoCount(s.board), 1);
  });

  t('choco: no free neighbour, no spread', function () {
    var s = session(NOWIN, 5, { colors: 5, choco: ['.....C', '......', '......', '......'],
      lock: ['....L.', '.....L', '......', '......'] });
    var ev = play(s);
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(chocoCount(s.board), 1);
  });

  t('choco: no spread after winning move', function () {
    var s = session([{ type: 'score', target: 60 }], 5, { colors: 5, choco: ['.....C', '......', '......', '......'] });
    var ev = play(s);
    eq(s.status, 'won');
    eq(ofType(ev, 'chocoSpread').length, 0);
    eq(chocoCount(s.board), 1);
  });

  t('choco: spread raises the goal target, goal completes only when board is clear', function () {
    var s = session([{ type: 'choco' }], 5, { colors: 5, choco: ['.....C', '......', '......', '......'] });
    eq(s.goals.goals[0].target, 1);
    var ev = play(s);
    eq(ofType(ev, 'chocoSpread').length, 1);
    eq(s.goals.goals[0].target, 2);
    var prog = ofType(ev, 'goalProgress');
    eq(prog[prog.length - 1].goals[0].target, 2);
    ok(prog.length >= 2);
    var hit = { type: 'obstacleHit', pos: P(0, 5), kind: 'choco', remaining: 0 };
    RS.Goals.apply(s.goals, [hit]);
    eq(RS.Goals.allDone(s.goals), false);
    RS.Goals.apply(s.goals, [hit]);
    eq(RS.Goals.allDone(s.goals), true);
  });
})(window.RS = window.RS || {});
