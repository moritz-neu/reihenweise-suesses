(function (RS) {
  'use strict';

  var SPECIAL_BY_SUFFIX = { h: 'stripeH', v: 'stripeV', b: 'bomb' };
  var SUFFIX_BY_SPECIAL = { stripeH: 'h', stripeV: 'v', bomb: 'b' };
  var MAX_CREATE_TRIES = 100;
  var MAX_SHUFFLE_TRIES = 100;

  function grid(rows, cols, value) {
    var g = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) { row.push(value); }
      g.push(row);
    }
    return g;
  }

  function emptyBoard(rows, cols, colors, seed) {
    return {
      rows: rows,
      cols: cols,
      colors: colors,
      mask: grid(rows, cols, true),
      candies: grid(rows, cols, null),
      glaze: grid(rows, cols, 0),
      lock: grid(rows, cols, false),
      ice: grid(rows, cols, 0),
      choco: grid(rows, cols, false),
      crate: grid(rows, cols, 0),
      rng: RS.createRng(seed),
      nextId: 1
    };
  }

  function newCandy(board, color, special) {
    return { id: board.nextId++, color: color, special: special };
  }

  function inBounds(board, pos) {
    return pos.r >= 0 && pos.r < board.rows && pos.c >= 0 && pos.c < board.cols;
  }

  function isPlayable(board, pos) {
    return inBounds(board, pos) && board.mask[pos.r][pos.c] === true;
  }

  function get(board, pos) {
    return inBounds(board, pos) ? board.candies[pos.r][pos.c] : null;
  }

  function parseToken(board, token) {
    if (token === '#') { return { mask: false, candy: null }; }
    if (token === '_') { return { mask: true, candy: null }; }
    if (token === '*') { return { mask: true, candy: newCandy(board, null, 'colorball') }; }
    var m = /^([0-5])([hvb]?)$/.exec(token);
    if (!m) { throw new Error('Unknown board token: ' + token); }
    return {
      mask: true,
      candy: newCandy(board, Number(m[1]), m[2] ? SPECIAL_BY_SUFFIX[m[2]] : null)
    };
  }

  function fromRows(rows, opts) {
    opts = opts || {};
    var parsed = rows.map(function (line) { return line.trim().split(/\s+/); });
    var board = emptyBoard(rows.length, parsed[0].length,
      opts.colors === undefined ? 6 : opts.colors,
      opts.seed === undefined ? 1 : opts.seed);
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var cell = parseToken(board, parsed[r][c]);
        board.mask[r][c] = cell.mask;
        board.candies[r][c] = cell.candy;
        if (opts.glaze) { board.glaze[r][c] = Number(opts.glaze[r].charAt(c)); }
        if (opts.lock) { board.lock[r][c] = opts.lock[r].charAt(c) === 'L'; }
        if (opts.ice) { board.ice[r][c] = Number(opts.ice[r].charAt(c)); }
        if (opts.choco && opts.choco[r].charAt(c) === 'C') {
          board.choco[r][c] = true;
          board.candies[r][c] = null;
        }
        if (opts.crate && Number(opts.crate[r].charAt(c)) > 0) {
          board.crate[r][c] = Number(opts.crate[r].charAt(c));
          board.candies[r][c] = null;
        }
      }
    }
    return board;
  }

  function toRows(board) {
    var out = [];
    for (var r = 0; r < board.rows; r++) {
      var tokens = [];
      for (var c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (!board.mask[r][c]) { tokens.push('#'); }
        else if (!candy) { tokens.push('_'); }
        else if (candy.special === 'colorball') { tokens.push('*'); }
        else { tokens.push(String(candy.color) + (SUFFIX_BY_SPECIAL[candy.special] || '')); }
      }
      out.push(tokens.join(' '));
    }
    return out;
  }

  // Color used for matching; null for void, empty cells and colorballs.
  function colorAt(board, r, c) {
    var candy = board.candies[r][c];
    if (board.ice[r][c] > 0) { return null; }
    return candy && candy.color !== null ? candy.color : null;
  }

  // Maximal straight runs of >= 3 same-colored candies along one line.
  // get(i) returns the color at index i of the line, n is the line length.
  function runsInLine(n, get, makeCell, orientation, out) {
    var start = 0;
    for (var i = 1; i <= n; i++) {
      if (i === n || get(i) === null || get(i) !== get(start)) {
        if (get(start) !== null && i - start >= 3) {
          var cells = [];
          for (var k = start; k < i; k++) { cells.push(makeCell(k)); }
          out.push({ color: get(start), cells: cells, orientation: orientation });
        }
        start = i;
      }
    }
  }

  function findRuns(board) {
    var runs = [];
    var r, c;
    for (r = 0; r < board.rows; r++) {
      runsInLine(board.cols,
        function (i) { return colorAt(board, r, i); },
        function (i) { return { r: r, c: i }; }, 'h', runs);
    }
    for (c = 0; c < board.cols; c++) {
      runsInLine(board.rows,
        function (i) { return colorAt(board, i, c); },
        function (i) { return { r: i, c: c }; }, 'v', runs);
    }
    return runs;
  }

  function findMatches(board) {
    var groups = [];
    findRuns(board).forEach(function (run) {
      var group = { color: run.color, keys: {}, runs: [run] };
      groups = groups.filter(function (g) {
        var touches = g.color === run.color && run.cells.some(function (p) {
          return g.keys[p.r * board.cols + p.c];
        });
        if (touches) {
          Object.keys(g.keys).forEach(function (k) { group.keys[k] = true; });
          group.runs = group.runs.concat(g.runs);
        }
        return !touches;
      });
      run.cells.forEach(function (p) { group.keys[p.r * board.cols + p.c] = true; });
      groups.push(group);
    });
    return groups.map(function (g) {
      var longest = g.runs[0];
      var hasH = false;
      var hasV = false;
      g.runs.forEach(function (run) {
        if (run.orientation === 'h') { hasH = true; } else { hasV = true; }
        var longer = run.cells.length > longest.cells.length;
        var tieForH = run.cells.length === longest.cells.length &&
          run.orientation === 'h' && longest.orientation === 'v';
        if (longer || tieForH) { longest = run; }
      });
      var shape = longest.cells.length >= 5 ? 'line5'
        : (hasH && hasV) ? 'LT'
        : longest.cells.length === 4 ? 'line4' : 'line3';
      var cells = Object.keys(g.keys).map(Number).sort(function (a, b) { return a - b; })
        .map(function (k) { return { r: Math.floor(k / board.cols), c: k % board.cols }; });
      return { color: g.color, cells: cells, shape: shape, orientation: longest.orientation };
    });
  }

  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function canSwap(board, a, b) {
    return isPlayable(board, a) && isPlayable(board, b) &&
      get(board, a) !== null && get(board, b) !== null &&
      !board.lock[a.r][a.c] && !board.lock[b.r][b.c] &&
      board.ice[a.r][a.c] === 0 && board.ice[b.r][b.c] === 0 &&
      !board.choco[a.r][a.c] && !board.choco[b.r][b.c] &&
      !board.crate[a.r][a.c] && !board.crate[b.r][b.c] &&
      isAdjacent(a, b);
  }

  function swapCandies(board, a, b) {
    var tmp = board.candies[a.r][a.c];
    board.candies[a.r][a.c] = board.candies[b.r][b.c];
    board.candies[b.r][b.c] = tmp;
  }

  function isValuableMove(board, a, b) {
    var ca = get(board, a);
    var cb = get(board, b);
    if (ca.special && cb.special) { return true; }
    if (ca.special === 'colorball' || cb.special === 'colorball') { return true; }
    swapCandies(board, a, b);
    var matches = findMatches(board).length > 0;
    swapCandies(board, a, b);
    return matches;
  }

  function findPossibleMoves(board) {
    var moves = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var a = { r: r, c: c };
        [{ r: r, c: c + 1 }, { r: r + 1, c: c }].forEach(function (b) {
          if (canSwap(board, a, b) && isValuableMove(board, a, b)) {
            moves.push({ a: a, b: b });
          }
        });
      }
    }
    return moves;
  }

  function isSettled(board) {
    return findMatches(board).length === 0 && findPossibleMoves(board).length > 0;
  }

  // Rearranges normal, unlocked candies so that there are no matches but a possible move.
  // Returns {id, pos} for every candy that changed position (or color, in the fallback).
  function shuffle(board) {
    var cells = [];
    var originals = [];
    var r, c, i;
    for (r = 0; r < board.rows; r++) {
      for (c = 0; c < board.cols; c++) {
        var candy = board.candies[r][c];
        if (board.mask[r][c] && candy && !candy.special && !board.lock[r][c] &&
            board.ice[r][c] === 0 && !board.choco[r][c] && !board.crate[r][c]) {
          cells.push({ r: r, c: c });
          originals.push({ candy: candy, color: candy.color });
        }
      }
    }
    function place(order) {
      cells.forEach(function (p, k) { board.candies[p.r][p.c] = order[k]; });
    }
    var settled = false;
    var tries;
    for (tries = 0; tries < MAX_SHUFFLE_TRIES && !settled; tries++) {
      var order = originals.map(function (o) { return o.candy; });
      for (i = order.length - 1; i > 0; i--) {
        var j = board.rng.int(i + 1);
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      place(order);
      settled = isSettled(board);
    }
    if (!settled) {
      place(originals.map(function (o) { return o.candy; }));
      for (tries = 0; tries < MAX_SHUFFLE_TRIES && !settled; tries++) {
        originals.forEach(function (o) { o.candy.color = board.rng.int(board.colors); });
        settled = isSettled(board);
      }
    }
    var result = [];
    cells.forEach(function (p, k) {
      var now = board.candies[p.r][p.c];
      var before = originals.filter(function (o) { return o.candy === now; })[0];
      if (now !== originals[k].candy || now.color !== before.color) {
        result.push({ id: now.id, pos: { r: p.r, c: p.c } });
      }
    });
    return result;
  }

  // Fills every playable cell without creating a run of three.
  function fillRandom(board) {
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (!board.mask[r][c] || board.choco[r][c] || board.crate[r][c]) { continue; }
        var banned = {};
        if (c >= 2 && colorAt(board, r, c - 1) !== null &&
            colorAt(board, r, c - 1) === colorAt(board, r, c - 2)) {
          banned[colorAt(board, r, c - 1)] = true;
        }
        if (r >= 2 && colorAt(board, r - 1, c) !== null &&
            colorAt(board, r - 1, c) === colorAt(board, r - 2, c)) {
          banned[colorAt(board, r - 1, c)] = true;
        }
        var allowed = [];
        for (var k = 0; k < board.colors; k++) { if (!banned[k]) { allowed.push(k); } }
        board.candies[r][c] = newCandy(board, allowed[board.rng.int(allowed.length)], null);
      }
    }
  }

  function applyLayout(board, layout) {
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var ch = layout[r].charAt(c);
        board.mask[r][c] = ch !== '.';
        board.glaze[r][c] = ch === '1' || ch === 'K' ? 1 : ch === '2' ? 2 : 0;
        board.lock[r][c] = ch === 'L' || ch === 'K';
        board.ice[r][c] = ch === 'I' ? 1 : ch === 'J' ? 2 : 0;
        board.choco[r][c] = ch === 'C';
        board.crate[r][c] = ch === 'X' ? 1 : ch === 'Y' ? 2 : ch === 'Z' ? 3 : 0;
      }
    }
  }

  function create(opts) {
    var board = emptyBoard(opts.rows, opts.cols, opts.colors, opts.seed);
    if (opts.layout) { applyLayout(board, opts.layout); }
    for (var attempt = 0; attempt < MAX_CREATE_TRIES; attempt++) {
      board.candies = grid(board.rows, board.cols, null);
      fillRandom(board);
      if (RS.Board.findPossibleMoves(board).length > 0) { return board; }
    }
    RS.Board.shuffle(board);
    return board;
  }

  RS.Board = {
    fromRows: fromRows,
    create: create,
    get: get,
    inBounds: inBounds,
    isPlayable: isPlayable,
    findMatches: findMatches,
    toRows: toRows,
    isAdjacent: isAdjacent,
    canSwap: canSwap,
    findPossibleMoves: findPossibleMoves,
    shuffle: shuffle
  };
})(window.RS = window.RS || {});
