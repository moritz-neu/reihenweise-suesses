(function (RS) {
  'use strict';

  // A chameleon is a normal coloured candy with `chameleon: true`. After every swap move it moves
  // on to the next colour; clearing it removes the flag with the candy.

  function shiftable(board, r, c) {
    var candy = board.candies[r][c];
    return Boolean(candy) && candy.chameleon === true && candy.color !== null && board.ice[r][c] === 0;
  }

  // Every chameleon that is not frozen (and not a colourball) changes to (color + 1) % colors.
  function shift(board) {
    var changes = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (!shiftable(board, r, c)) { continue; }
        var candy = board.candies[r][c];
        candy.color = (candy.color + 1) % board.colors;
        changes.push({ id: candy.id, pos: { r: r, c: c }, color: candy.color });
      }
    }
    return changes.length > 0 ? [{ type: 'chameleonShift', changes: changes }] : [];
  }

  // Every spawnEvery-th move one random free candy of the topmost row that has one becomes a chameleon.
  function spawn(board, rule, moveNo) {
    if (!rule || !rule.spawnEvery || moveNo % rule.spawnEvery !== 0) { return []; }
    for (var r = 0; r < board.rows; r++) {
      var free = [];
      for (var c = 0; c < board.cols; c++) {
        if (RS.Obstacles.isFree(board, { r: r, c: c })) { free.push(c); }
      }
      if (free.length === 0) { continue; }
      var col = free[board.rng.int(free.length)];
      var candy = board.candies[r][col];
      candy.chameleon = true;
      return [{ type: 'chameleonSpawned', pos: { r: r, c: col }, id: candy.id }];
    }
    return [];
  }

  RS.Chameleons = { shift: shift, spawn: spawn };
})(window.RS = window.RS || {});
