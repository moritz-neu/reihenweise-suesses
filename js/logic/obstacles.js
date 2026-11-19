(function (RS) {
  'use strict';

  function pos(r, c) { return { r: r, c: c }; }

  // Sugar glaze: one layer less per hit. null when the cell has no glaze.
  function hitGlaze(board, p) {
    if (board.glaze[p.r][p.c] <= 0) { return null; }
    board.glaze[p.r][p.c]--;
    return { type: 'obstacleHit', pos: pos(p.r, p.c), kind: 'glaze', remaining: board.glaze[p.r][p.c] };
  }

  // Licorice lock: one hit removes it. null when the cell is not locked.
  function hitLock(board, p) {
    if (!board.lock[p.r][p.c]) { return null; }
    board.lock[p.r][p.c] = false;
    return { type: 'obstacleHit', pos: pos(p.r, p.c), kind: 'lock', remaining: 0 };
  }

  function countGlaze(board) {
    var n = 0;
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (board.glaze[r][c] > 0) { n++; }
      }
    }
    return n;
  }

  RS.Obstacles = {
    hitGlaze: hitGlaze,
    hitLock: hitLock,
    countGlaze: countGlaze
  };
})(window.RS = window.RS || {});
