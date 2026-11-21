(function (RS) {
  'use strict';

  var BONUS_PER_MOVE = 250;
  // Sterne nach übrigen Zügen: 2 Sterne ab 25 %, 3 Sterne ab 50 % der Züge übrig.
  var STAR_SHARES = [0.25, 0.5];

  // Wie viele Züge mindestens übrig sein müssen: [für 2 Sterne, für 3 Sterne].
  function starMoves(totalMoves) {
    return STAR_SHARES.map(function (share) { return Math.ceil(totalMoves * share); });
  }

  function create(levelDef, board) {
    return {
      score: 0,
      movesLeft: levelDef.moves,
      starMoves: starMoves(levelDef.moves),
      goals: levelDef.goals.map(function (g) {
        var goal = {};
        Object.keys(g).forEach(function (k) { goal[k] = g[k]; });
        goal.count = 0;
        if (g.type === 'glaze') { goal.target = RS.Obstacles.countGlaze(board); }
        if (g.type === 'choco') { goal.target = RS.Obstacles.countChoco(board); }
        if (g.type === 'boss') { goal.target = RS.BOSSES[levelDef.boss].hp; }
        return goal;
      })
    };
  }

  function cap(goal, n) { return Math.min(goal.target, n); }

  function apply(state, events) {
    events.forEach(function (e) {
      if (e.type === 'cleared') {
        state.score += e.points;
        state.goals.forEach(function (g) {
          if (g.type !== 'collect') { return; }
          var n = e.candies.filter(function (c) { return c.color === g.color; }).length;
          g.count = cap(g, g.count + n);
        });
      } else if (e.type === 'bossDamaged') {
        state.goals.forEach(function (g) {
          if (g.type === 'boss') { g.target = e.max; g.count = cap(g, e.max - e.hp); }
        });
      } else if (e.type === 'obstacleHit' && e.kind === 'glaze' && e.remaining === 0) {
        state.goals.forEach(function (g) {
          if (g.type === 'glaze') { g.count = cap(g, g.count + 1); }
        });
      } else if (e.type === 'obstacleHit' && e.kind === 'choco') {
        state.goals.forEach(function (g) {
          if (g.type === 'choco') { g.count = cap(g, g.count + 1); }
        });
      }
    });
    state.goals.forEach(function (g) {
      if (g.type === 'score') { g.count = cap(g, state.score); }
    });
  }

  function allDone(state) {
    return state.goals.every(function (g) { return g.count >= g.target; });
  }

  function starsFor(state) {
    if (!allDone(state)) { return 0; }
    if (state.movesLeft >= state.starMoves[1]) { return 3; }
    if (state.movesLeft >= state.starMoves[0]) { return 2; }
    return 1;
  }

  RS.Goals = {
    create: create, apply: apply, allDone: allDone, starsFor: starsFor, starMoves: starMoves,
    BONUS_PER_MOVE: BONUS_PER_MOVE, STAR_SHARES: STAR_SHARES
  };
})(window.RS = window.RS || {});
