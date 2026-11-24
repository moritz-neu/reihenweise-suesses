(function (RS) {
  'use strict';

  // A fuse candy is a normal coloured candy with `fuse: n` (n >= 1). It matches like any candy;
  // every swap move lowers all counters by one, clearing it defuses it. At 0 the level is lost.

  function fuseCells(board) {
    var cells = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (candy && candy.fuse !== undefined) { cells.push({ r: r, c: c, candy: candy }); }
      }
    }
    return cells;
  }

  function cellEntries(cells) {
    return cells.map(function (x) { return { pos: { r: x.r, c: x.c }, id: x.candy.id, fuse: x.candy.fuse }; });
  }

  // Lowers every counter by one. exploded: a counter reached 0.
  function tick(board) {
    var cells = fuseCells(board);
    if (cells.length === 0) { return { events: [], exploded: false }; }
    var exploded = false;
    cells.forEach(function (x) {
      x.candy.fuse = Math.max(0, x.candy.fuse - 1);
      if (x.candy.fuse === 0) { exploded = true; }
    });
    return { events: [{ type: 'fuseTick', cells: cellEntries(cells) }], exploded: exploded };
  }

  // Raises every counter (rescue after a fuse loss). Returns the fuseTick event with the new values.
  function extend(board, n) {
    var cells = fuseCells(board);
    if (cells.length === 0) { return []; }
    cells.forEach(function (x) { x.candy.fuse += n; });
    return [{ type: 'fuseTick', cells: cellEntries(cells) }];
  }

  // Every spawnEvery-th move one random free candy of the topmost row that has one gets a fuse.
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
      candy.fuse = rule.start;
      return [{ type: 'fuseSpawned', pos: { r: r, c: col }, id: candy.id, fuse: rule.start }];
    }
    return [];
  }

  RS.Fuses = { tick: tick, extend: extend, spawn: spawn };
})(window.RS = window.RS || {});
