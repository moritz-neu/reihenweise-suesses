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
      moveNo: 0,
      lostBy: null,
      status: 'playing'
    };
  }

  function startLevel(levelDef) {
    var board = RS.Board.create({
      rows: 8, cols: 8, colors: levelDef.colors, seed: levelDef.seed, layout: levelDef.layout,
      fuseStart: levelDef.fuses ? levelDef.fuses.start : 9
    });
    board.cherryRule = levelDef.cherries || null;
    board.fuseRule = levelDef.fuses || null;
    board.chameleonRule = levelDef.chameleons || null;
    RS.Cherries.recount(board);
    var session = fromBoard(levelDef, board, 'level');
    // A layout cherry on the bottom fall slot is collected at once.
    var events = [];
    if (RS.Cherries.collect(board, events) > 0) {
      var ctx = { stage: 0, events: events, swap: null, triggered: new Set(), toClear: new Map(), combo: null };
      RS.Engine._settle(board, ctx);
      // The start cascade counts for score and goals like any other. It spends no move and cannot
      // lose; it cannot win either: the status stays 'playing' even if every goal is met by it.
      RS.Goals.apply(session.goals, events);
    }
    return session;
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

  // Resolves what a non-swap action freed like a hammer cascade: matches (or, with settleOnly, first
  // the refill of an emptied cell), boss damage included. Returns the new events, [] if nothing to do.
  function cascadeFreed(session, settleOnly) {
    if (!settleOnly && RS.Board.findMatches(session.board).length === 0) { return []; }
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map(), combo: null };
    if (settleOnly) { RS.Engine._settle(session.board, ctx); } else { RS.Engine._resolve(session.board, ctx); }
    bossHit(session, ctx.events, false);
    return ctx.events;
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
      loseByMoves(session, events);
    }
    return events;
  }

  function loseByMoves(session, events) {
    session.status = 'lost';
    session.lostBy = 'moves';
    events.push({ type: 'levelLost', score: session.goals.score });
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

  // Fuse tick: a counter at 0 loses the level at once (reason 'fuse'). Returns true on a loss.
  function tickFuses(session, events) {
    var res = RS.Fuses.tick(session.board);
    events.push.apply(events, res.events);
    if (!res.exploded) { return false; }
    session.status = 'lost';
    session.lostBy = 'fuse';
    events.push({ type: 'levelLost', score: session.goals.score, reason: 'fuse' });
    return true;
  }

  var STATUS_TYPES = ['scoreChanged', 'movesChanged', 'goalProgress'];

  // Chameleon shift: matches it creates resolve at once, without a move, and count for goals and
  // boss damage; a dead board is reshuffled. Returns true if the level is no longer playing (won).
  function shiftChameleons(session, events) {
    var own = RS.Chameleons.shift(session.board);
    if (own.length === 0) { return false; }
    var cascade = cascadeFreed(session, false);
    if (cascade.length === 0) {
      RS.Engine.shuffleIfDead(session.board, own);
      events.push.apply(events, own);
      return false;
    }
    own = own.concat(cascade);
    finishLevelAction(session, own, true);
    // The move already emitted a status set: the cascade's set carries the final values, so the
    // earlier one goes. Splice in place, the caller holds this array.
    for (var i = events.length - 1; i >= 0; i--) {
      if (STATUS_TYPES.indexOf(events[i].type) >= 0) { events.splice(i, 1); }
    }
    events.push.apply(events, own);
    return session.status !== 'playing';
  }

  // Runs after a swap move that left the level still playing, in this order: chameleon shift (a win
  // ends the step), fuse tick (a loss ends the step), fuse spawn, chameleon spawn, chocolate spread,
  // boss step.
  function afterSwapMove(session, events) {
    if (shiftChameleons(session, events)) { return; }
    if (tickFuses(session, events)) { return; }
    events.push.apply(events, RS.Fuses.spawn(session.board, session.board.fuseRule, session.moveNo));
    events.push.apply(events, RS.Chameleons.spawn(session.board, session.board.chameleonRule, session.moveNo));
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
    session.moveNo++;
    session.goals.movesLeft--;
    bossHit(session, events, wasCombo);
    // On the last move the moves loss waits for the fuse tick: a fuse at 0 makes it a fuse loss.
    var lastMove = session.goals.movesLeft === 0;
    finishLevelAction(session, events, lastMove);
    if (session.status !== 'playing') { return events; }
    // On the last move only the fuse tick runs: chameleon shift, spawns, chocolate spread and
    // the boss step are skipped because the level ends here, as intended.
    if (!lastMove) {
      afterSwapMove(session, events);
    } else if (!tickFuses(session, events)) {
      loseByMoves(session, events);
    }
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

  // p is left out of the event when the target is missing.
  function rejectJoker(kind, p) {
    var event = { type: 'jokerRejected', kind: kind };
    if (p) { event.pos = p; }
    return [event];
  }

  // Regenbogenstaub: every cell whose candy has the colour of the candy at p.
  function rainbow(session, p) {
    var board = session.board;
    var candy = RS.Board.isPlayable(board, p) ? RS.Board.get(board, p) : null;
    if (!candy || candy.color === null || candy.color === undefined || board.ice[p.r][p.c] > 0) {
      return rejectJoker('regenbogen', p);
    }
    var cells = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var q = RS.Board.isPlayable(board, { r: r, c: c }) ? board.candies[r][c] : null;
        if (q && q.color === candy.color) { cells.push({ r: r, c: c }); }
      }
    }
    return jokerAction(session, RS.Engine.blast(board, cells, { type: 'rainbow', color: candy.color }));
  }

  // Joker effect on the board. target: {a, b} for feentausch, a pos for the others.
  function useJoker(session, kind, target) {
    if (session.mode !== 'level' || session.status !== 'playing') { return []; }
    var board = session.board;
    var boardKinds = ['hammer', 'feentausch', 'regenbogen', 'zauberbombe', 'besen'];
    if (boardKinds.indexOf(kind) >= 0) {
      var missing = kind === 'feentausch' ? !target || !target.a || !target.b : !target;
      if (missing) { return rejectJoker(kind); }
    }
    if (kind === 'hammer') { return smash(session, target); }
    if (kind === 'feentausch') {
      return jokerAction(session, RS.Engine.forceSwap(board, target.a, target.b));
    }
    if (kind === 'regenbogen') { return rainbow(session, target); }
    if (kind === 'zauberbombe') {
      if (!RS.Board.isPlayable(board, target)) { return rejectJoker(kind, target); }
      return jokerAction(session, RS.Engine.blast(board, RS.Specials.area(board, target, 'bomb'), { type: 'bombed', pos: target }));
    }
    if (kind !== 'besen') { return []; }
    var cells = [];
    for (var c = 0; c < board.cols; c++) { cells.push({ r: target.r, c: c }); }
    return jokerAction(session, RS.Engine.blast(board, cells, { type: 'swept', row: target.r }));
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
    events = events.concat(cascadeFreed(session, crateGone));
    return finishLevelAction(session, events, true);
  }

  function addMoves(session, n) {
    if (session.mode !== 'level' || (session.status !== 'playing' && session.status !== 'lost')) { return []; }
    session.goals.movesLeft += n;
    var events = [{ type: 'movesChanged', movesLeft: session.goals.movesLeft }];
    // A fuse loss is rescued by more time on every fuse as well.
    if (session.status === 'lost' && session.lostBy === 'fuse') {
      events = events.concat(RS.Fuses.extend(session.board, n));
    }
    session.lostBy = null;
    session.status = 'playing';
    return events;
  }

  RS.Session = {
    ENDLESS: ENDLESS, startLevel: startLevel, startEndless: startEndless,
    move: move, smash: smash, useJoker: useJoker, starSpell: starSpell, addMoves: addMoves, tick: tick,
    // Test hook: runs the chameleon shift step on its own.
    _shiftChameleons: shiftChameleons, _fromBoard: fromBoard
  };
})(window.RS = window.RS || {});
