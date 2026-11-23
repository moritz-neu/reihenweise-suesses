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
      boss: levelDef.boss ? RS.Boss.create(levelDef.boss) : null,
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

  function goalProgressEvent(state) {
    return { type: 'goalProgress', goals: state.goals.map(function (g) {
      var copy = {};
      Object.keys(g).forEach(function (k) { copy[k] = g[k]; });
      return copy;
    }) };
  }

  // Boss takes damage and the star spell charges from the cleared candies of one action.
  function bossHit(session, events, wasCombo) {
    var boss = session.boss;
    if (!boss) { return; }
    var cleared = 0;
    events.forEach(function (e) { if (e.type === 'cleared') { cleared += e.candies.length; } });
    var damage = RS.Boss.damageFrom(boss, events, wasCombo);
    if (damage > 0) { events.push.apply(events, RS.Boss.apply(boss, damage)); }
    if (cleared > 0) { events.push.apply(events, RS.Boss.charge(boss, cleared)); }
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
    events.push(goalProgressEvent(state));
    if (done) {
      session.status = 'won';
      events.push({ type: 'levelWon', stars: RS.Goals.starsFor(state), score: state.score, bonus: bonus });
    } else if (!noLoss && state.movesLeft === 0) {
      session.status = 'lost';
      events.push({ type: 'levelLost', score: state.score });
    }
    return events;
  }

  var DIRS = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

  function freeNeighbours(board, p) {
    var out = [];
    DIRS.forEach(function (d) {
      var q = { r: p.r + d.r, c: p.c + d.c };
      if (RS.Obstacles.isFree(board, q)) { out.push(q); }
    });
    return out;
  }

  // One chocolate cell grows onto a free neighbour, unless chocolate was removed this move.
  function spreadChoco(session, events) {
    var board = session.board;
    if (RS.Obstacles.countChoco(board) === 0) { return; }
    var removed = events.some(function (e) { return e.type === 'obstacleHit' && e.kind === 'choco'; });
    if (removed) { return; }
    var sources = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (board.choco[r][c] && freeNeighbours(board, { r: r, c: c }).length > 0) { sources.push({ r: r, c: c }); }
      }
    }
    if (sources.length === 0) { return; }
    var from = sources[board.rng.int(sources.length)];
    var targets = freeNeighbours(board, from);
    var to = targets[board.rng.int(targets.length)];
    var candy = board.candies[to.r][to.c];
    board.candies[to.r][to.c] = null;
    board.choco[to.r][to.c] = true;
    events.push({ type: 'chocoSpread', from: from, to: to, candyId: candy.id });
    // The choco goal means "all chocolate removed": the new cell has to go, too.
    session.goals.goals.forEach(function (g) { if (g.type === 'choco') { g.target++; } });
    events.push(goalProgressEvent(session.goals));
    RS.Engine.shuffleIfDead(board, events);
  }

  // Runs after a swap move that left the level still playing: chocolate spread, then boss step.
  function afterSwapMove(session, events) {
    spreadChoco(session, events);
    if (session.boss) { events.push.apply(events, RS.Boss.step(session.boss, session.board)); }
  }

  function move(session, a, b) {
    if (session.status !== 'playing') { return []; }
    var wasCombo = session.boss ? Boolean(RS.Specials.combo(session.board, a, b)) : false;
    var res = RS.Engine.swap(session.board, a, b);
    var events = res.events.slice();
    if (!res.valid) { return events; }
    if (session.mode === 'endless') { return moveEndless(session, events); }
    session.goals.movesLeft--;
    bossHit(session, events, wasCombo);
    finishLevelAction(session, events, false);
    if (session.status === 'playing') { afterSwapMove(session, events); }
    return events;
  }

  // Shared body of the jokers: no move, no boss attack, no chocolate spread.
  function jokerAction(session, res) {
    var events = res.events.slice();
    if (!res.valid) { return events; }
    bossHit(session, events, false);
    return finishLevelAction(session, events, true);
  }

  function smash(session, p) {
    if (session.mode !== 'level' || session.status !== 'playing') { return []; }
    return jokerAction(session, RS.Engine.smash(session.board, p));
  }

  // Joker effect on the board: hammer hits one cell, besen sweeps the row of pos.
  function useJoker(session, kind, p) {
    if (session.mode !== 'level' || session.status !== 'playing') { return []; }
    if (kind === 'hammer') { return smash(session, p); }
    if (kind !== 'besen') { return []; }
    var cells = [];
    for (var c = 0; c < session.board.cols; c++) { cells.push({ r: p.r, c: c }); }
    return jokerAction(session, RS.Engine.blast(session.board, cells, { type: 'swept', row: p.r }));
  }

  // Star spell: only at a full bar; costs no move and triggers no attack or spread.
  function starSpell(session) {
    var boss = session.boss;
    if (session.mode !== 'level' || session.status !== 'playing' || !boss ||
      boss.charge < RS.Boss.SPELL_MAX) { return []; }
    var events = RS.Boss.castSpell(boss, session.board);
    // A removed crate leaves an empty cell to refill; freed candies may complete a match.
    // Both resolve like a hammer cascade.
    var crateGone = events.some(function (e) { return e.kind === 'crate' && e.remaining === 0; });
    if (crateGone || RS.Board.findMatches(session.board).length > 0) {
      var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map(), combo: null };
      if (crateGone) { RS.Engine._settle(session.board, ctx); } else { RS.Engine._resolve(session.board, ctx); }
      bossHit(session, ctx.events, false);
      events = events.concat(ctx.events);
    }
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
    move: move, smash: smash, useJoker: useJoker, starSpell: starSpell, addMoves: addMoves, tick: tick, _fromBoard: fromBoard
  };
})(window.RS = window.RS || {});
