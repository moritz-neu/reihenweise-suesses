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

  // Ice on a candy: one level less per hit. null when the cell is not frozen.
  function hitIce(board, p) {
    if (board.ice[p.r][p.c] <= 0) { return null; }
    board.ice[p.r][p.c]--;
    return { type: 'obstacleHit', pos: pos(p.r, p.c), kind: 'ice', remaining: board.ice[p.r][p.c] };
  }

  // Chocolate: one hit removes it. null when the cell holds no chocolate.
  function hitChoco(board, p) {
    if (!board.choco[p.r][p.c]) { return null; }
    board.choco[p.r][p.c] = false;
    return { type: 'obstacleHit', pos: pos(p.r, p.c), kind: 'choco', remaining: 0 };
  }

  function countChoco(board) {
    var n = 0;
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (board.choco[r][c]) { n++; }
      }
    }
    return n;
  }

  // A playable cell with a normal candy and no lock, ice or chocolate.
  function isFree(board, p) {
    if (!RS.Board.isPlayable(board, p)) { return false; }
    var candy = board.candies[p.r][p.c];
    return Boolean(candy) && !candy.special && !board.lock[p.r][p.c] &&
      board.ice[p.r][p.c] === 0 && !board.choco[p.r][p.c];
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
    hitIce: hitIce,
    hitChoco: hitChoco,
    countChoco: countChoco,
    isFree: isFree,
    countGlaze: countGlaze
  };
})(window.RS = window.RS || {});
