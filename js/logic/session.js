(function (RS) {
  'use strict';

  var ENDLESS = { START: 60, MAX: 60, REFILL_PER_CANDY: 0.4 };

  function fromBoard(levelDef, board, mode) {
    mode = mode || 'level';
    if (mode === 'endless') {
      return { mode: 'endless', level: null, board: board, score: 0,
        time: ENDLESS.START, max: ENDLESS.MAX, status: 'playing' };
    }
    return {
      mode: mode,
      level: levelDef,
      board: board,
      goals: RS.Goals.create(levelDef, board),
      status: 'playing'
    };
  }

  function startLevel(levelDef) {
    var board = RS.Board.create({
      rows: 8, cols: 8, colors: levelDef.colors, seed: levelDef.seed, layout: levelDef.layout
    });
    return fromBoard(levelDef, board, 'level');
  }

  function startEndless(seed) {
    var board = RS.Board.create({ rows: 8, cols: 8, colors: 6, seed: seed });
    return fromBoard(null, board, 'endless');
  }

  function moveEndless(session, events) {
    var stage = 1;
    events.forEach(function (e) {
      if (e.type === 'cascade') { stage = e.stage; }
      if (e.type === 'cleared') {
        session.score += e.points;
        session.time += ENDLESS.REFILL_PER_CANDY * e.candies.length * stage;
      }
    });
    session.time = Math.min(session.time, session.max);
    events.push({ type: 'scoreChanged', score: session.score });
    events.push({ type: 'timeChanged', time: session.time, max: session.max });
    return events;
  }

  function tick(session, dt) {
    if (session.mode !== 'endless' || session.status !== 'playing') { return []; }
    session.time = Math.max(0, session.time - dt);
    var events = [{ type: 'timeChanged', time: session.time, max: session.max }];
    if (session.time === 0) {
      session.status = 'over';
      events.push({ type: 'endlessOver', score: session.score });
    }
    return events;
  }

  // Shared tail of move and smash: goals, win check with move bonus, status events.
  function finishLevelAction(session, events, noLoss) {
    var state = session.goals;
    RS.Goals.apply(state, events);
    var done = RS.Goals.allDone(state);
    var bonus = 0;
    if (done) { bonus = state.movesLeft * RS.Goals.BONUS_PER_MOVE; state.score += bonus; }
    events.push({ type: 'scoreChanged', score: state.score });
    events.push({ type: 'movesChanged', movesLeft: state.movesLeft });
    events.push({ type: 'goalProgress', goals: state.goals.map(function (g) {
      var copy = {};
      Object.keys(g).forEach(function (k) { copy[k] = g[k]; });
      return copy;
    }) });
    if (done) {
      session.status = 'won';
      events.push({ type: 'levelWon', stars: RS.Goals.starsFor(state), score: state.score, bonus: bonus });
    } else if (!noLoss && state.movesLeft === 0) {
      session.status = 'lost';
      events.push({ type: 'levelLost', score: state.score });
    }
    return events;
  }

  function move(session, a, b) {
    if (session.status !== 'playing') { return []; }
    var res = RS.Engine.swap(session.board, a, b);
    var events = res.events.slice();
    if (!res.valid) { return events; }
    if (session.mode === 'endless') { return moveEndless(session, events); }
    session.goals.movesLeft--;
    return finishLevelAction(session, events, false);
  }

  function smash(session, p) {
    if (session.mode !== 'level' || session.status !== 'playing') { return []; }
    var res = RS.Engine.smash(session.board, p);
    var events = res.events.slice();
    if (!res.valid) { return events; }
    return finishLevelAction(session, events, true);
  }

  function addMoves(session, n) {
    if (session.mode !== 'level' || (session.status !== 'playing' && session.status !== 'lost')) { return []; }
    session.goals.movesLeft += n;
    session.status = 'playing';
    return [{ type: 'movesChanged', movesLeft: session.goals.movesLeft }];
  }

  RS.Session = {
    ENDLESS: ENDLESS, startLevel: startLevel, startEndless: startEndless,
    move: move, smash: smash, addMoves: addMoves, tick: tick, _fromBoard: fromBoard
  };
})(window.RS = window.RS || {});
