(function (RS) {
  'use strict';

  function pos(r, c) { return { r: r, c: c }; }

  function isStripe(special) { return special === 'stripeH' || special === 'stripeV'; }

  // All playable cells with rows r0..r1 and columns c0..c1 (clipped to the board), row-major.
  function block(board, r0, r1, c0, c1) {
    var cells = [];
    for (var r = Math.max(0, r0); r <= Math.min(board.rows - 1, r1); r++) {
      for (var c = Math.max(0, c0); c <= Math.min(board.cols - 1, c1); c++) {
        if (board.mask[r][c]) { cells.push(pos(r, c)); }
      }
    }
    return cells;
  }

  // Union of cell lists without duplicates, row-major.
  function union(lists) {
    var seen = {};
    var cells = [];
    lists.forEach(function (list) {
      list.forEach(function (p) {
        var k = p.r + ',' + p.c;
        if (!seen[k]) { seen[k] = true; cells.push(p); }
      });
    });
    return cells.sort(function (p, q) { return p.r - q.r || p.c - q.c; });
  }

  function cellsOfColor(board, color) {
    return block(board, 0, board.rows - 1, 0, board.cols - 1).filter(function (p) {
      var candy = board.candies[p.r][p.c];
      return candy !== null && candy.color === color;
    });
  }

  // Most frequent color among normal (non-special) candies; ties go to the lowest index.
  // null when the board holds no normal candy.
  function mostFrequentColor(board) {
    var counts = [];
    block(board, 0, board.rows - 1, 0, board.cols - 1).forEach(function (p) {
      var candy = board.candies[p.r][p.c];
      if (candy && !candy.special) { counts[candy.color] = (counts[candy.color] || 0) + 1; }
    });
    var best = null;
    counts.forEach(function (n, color) {
      if (n && (best === null || n > counts[best])) { best = color; }
    });
    return best;
  }

  // Cells hit when `special` at `p` triggers.
  function area(board, p, special, colorHint) {
    if (special === 'stripeH') { return block(board, p.r, p.r, 0, board.cols - 1); }
    if (special === 'stripeV') { return block(board, 0, board.rows - 1, p.c, p.c); }
    if (special === 'bomb') { return block(board, p.r - 1, p.r + 1, p.c - 1, p.c + 1); }
    if (special === 'colorball') {
      var color = colorHint === undefined || colorHint === null ? mostFrequentColor(board) : colorHint;
      return color === null ? [] : cellsOfColor(board, color);
    }
    return [];
  }

  // Effect of swapping a with b (spec 4.3), centered on b, the cell dragged onto.
  // Returns null when the swap is no combo (then the usual match check applies).
  function combo(board, a, b) {
    var ca = RS.Board.get(board, a);
    var cb = RS.Board.get(board, b);
    if (!ca || !cb) { return null; }
    var ballA = ca.special === 'colorball';
    var ballB = cb.special === 'colorball';
    if (ballA && ballB) {
      return { cells: block(board, 0, board.rows - 1, 0, board.cols - 1) };
    }
    if (ballA || ballB) {
      var ballPos = ballA ? a : b;
      var otherPos = ballA ? b : a;
      var other = ballA ? cb : ca;
      // The colorball itself is cleared by the engine together with the swapped pair.
      if (!other.special) { return { cells: area(board, ballPos, 'colorball', other.color) }; }
      return {
        cells: cellsOfColor(board, other.color).filter(function (p) {
          return p.r !== otherPos.r || p.c !== otherPos.c;
        }),
        transform: { color: other.color, special: other.special }
      };
    }
    if (!ca.special || !cb.special) { return null; }
    var stripes = (isStripe(ca.special) ? 1 : 0) + (isStripe(cb.special) ? 1 : 0);
    if (stripes === 2) {
      return { cells: union([area(board, b, 'stripeH'), area(board, b, 'stripeV')]) };
    }
    if (stripes === 1) {
      return {
        cells: union([
          block(board, b.r - 1, b.r + 1, 0, board.cols - 1),
          block(board, 0, board.rows - 1, b.c - 1, b.c + 1)
        ])
      };
    }
    return { cells: block(board, b.r - 2, b.r + 2, b.c - 2, b.c + 2) };
  }

  // The special a candy becomes in a colorball transform; stripes pick a random direction.
  function transformKind(board, special) {
    if (!isStripe(special)) { return special; }
    return board.rng.int(2) === 0 ? 'stripeH' : 'stripeV';
  }

  RS.Specials = {
    area: area,
    combo: combo,
    transformKind: transformKind,
    mostFrequentColor: mostFrequentColor
  };
})(window.RS = window.RS || {});
