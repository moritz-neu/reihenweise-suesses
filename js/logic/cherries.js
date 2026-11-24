(function (RS) {
  'use strict';

  // A cherry is a candy {id, color: null, special: null, cherry: true}: it never matches, no hit
  // clears it and it falls with gravity until it stands on the lowest fall slot of its column.

  function newCherry(board) {
    return { id: board.nextId++, color: null, special: null, cherry: true };
  }

  // Sets cherrySpawned and cherryOnBoard from the cherries currently on the board.
  function recount(board) {
    var n = 0;
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (candy && candy.cherry) { n++; }
      }
    }
    board.cherrySpawned = n;
    board.cherryOnBoard = n;
  }

  // Removes every cherry on the lowest fall slot of its column. Returns how many were removed.
  function collect(board, events) {
    var n = 0;
    for (var c = 0; c < board.cols; c++) {
      var r = board.rows - 1;
      while (r >= 0 && !RS.Engine.isFallSlot(board, r, c)) { r--; }
      var candy = r >= 0 ? board.candies[r][c] : null;
      if (candy && candy.cherry) {
        board.candies[r][c] = null;
        board.cherryOnBoard = Math.max(0, board.cherryOnBoard - 1);
        events.push({ type: 'cherryCollected', pos: { r: r, c: c }, id: candy.id });
        n++;
      }
    }
    return n;
  }

  // Turns a fresh spawned candy into a cherry while the level's rule allows another one.
  function spawnInto(board, candy) {
    var rule = board.cherryRule;
    if (!rule || board.cherryOnBoard >= rule.onBoard || board.cherrySpawned >= rule.total) { return candy; }
    board.cherryOnBoard++;
    board.cherrySpawned++;
    candy.color = null;
    candy.cherry = true;
    return candy;
  }

  RS.Cherries = { newCherry: newCherry, recount: recount, collect: collect, spawnInto: spawnInto };
})(window.RS = window.RS || {});
