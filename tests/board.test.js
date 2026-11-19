(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;

  function only(rows) { return B.findMatches(B.fromRows(rows)); }

  t('fromRows/toRows round trip', function () {
    var rows = ['0 1h #', '2 * _', '3v 4b 5'];
    var b = B.fromRows(rows);
    RS.assert.deepEqual(B.toRows(b), rows);
    eq(b.mask[0][2], false);
    eq(B.get(b, { r: 1, c: 1 }).special, 'colorball');
    eq(B.get(b, { r: 1, c: 1 }).color, null);
    eq(B.get(b, { r: 1, c: 2 }), null);
    eq(B.isPlayable(b, { r: 1, c: 2 }), true);
    eq(B.isPlayable(b, { r: 0, c: 2 }), false);
    eq(B.inBounds(b, { r: 3, c: 0 }), false);
  });

  t('findMatches: horizontal 3', function () {
    var m = only(['0 0 0 1', '1 2 3 2']);
    eq(m.length, 1);
    eq(m[0].shape, 'line3');
    eq(m[0].orientation, 'h');
    eq(m[0].cells.length, 3);
    eq(m[0].color, 0);
  });

  t('findMatches: vertical 4', function () {
    var m = only(['0 1', '0 2', '0 1', '0 2']);
    eq(m.length, 1);
    eq(m[0].shape, 'line4');
    eq(m[0].orientation, 'v');
  });

  t('findMatches: 5 in a row', function () {
    var m = only(['2 2 2 2 2 1']);
    eq(m.length, 1);
    eq(m[0].shape, 'line5');
  });

  t('findMatches: L shape', function () {
    var m = only(['0 1 2', '0 3 4', '0 0 0']);
    eq(m.length, 1);
    eq(m[0].shape, 'LT');
    eq(m[0].cells.length, 5);
  });

  t('findMatches: T shape', function () {
    var m = only(['0 0 0', '1 0 2', '3 0 4']);
    eq(m.length, 1);
    eq(m[0].shape, 'LT');
    eq(m[0].cells.length, 5);
  });

  t('findMatches: line of 5 crossing a vertical 3', function () {
    var m = only(['1 1 0 2 3', '2 3 0 4 5', '0 0 0 0 0']);
    eq(m.length, 1);
    eq(m[0].shape, 'line5');
    eq(m[0].orientation, 'h');
  });

  t('findMatches: two separate matches of different colors', function () {
    var m = only(['0 0 0', '1 2 3', '4 4 4']);
    eq(m.length, 2);
    eq(m[0].color !== m[1].color, true);
  });

  t('findMatches: void cell breaks a run', function () {
    eq(only(['0 0 # 0']).length, 0);
  });

  t('findMatches: colorballs and empty cells never match', function () {
    eq(only(['* * *', '_ _ _']).length, 0);
  });

  t('create: no initial matches for seeds 1..20', function () {
    for (var seed = 1; seed <= 20; seed++) {
      var b = B.create({ rows: 8, cols: 8, colors: 6, seed: seed });
      eq(B.findMatches(b).length, 0, 'seed ' + seed);
      eq(b.rows, 8);
      eq(b.cols, 8);
    }
  });

  t('create: same seed gives same board', function () {
    var a = B.create({ rows: 8, cols: 8, colors: 5, seed: 7 });
    var b = B.create({ rows: 8, cols: 8, colors: 5, seed: 7 });
    RS.assert.deepEqual(B.toRows(a), B.toRows(b));
  });

  t('create: layout sets mask, glaze and lock', function () {
    var layout = ['.xxxxxx2', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx',
                  'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '1xxxxxLK'];
    var b = B.create({ rows: 8, cols: 8, colors: 6, seed: 3, layout: layout });
    eq(b.mask[0][0], false);
    eq(b.candies[0][0], null);
    eq(b.glaze[0][7], 2);
    eq(b.glaze[7][0], 1);
    eq(b.lock[7][6], true);
    eq(b.glaze[7][6], 0);
    eq(b.lock[7][7], true);
    eq(b.glaze[7][7], 1);
    eq(b.lock[0][1], false);
    eq(b.candies[7][7] !== null, true);
    eq(B.findMatches(b).length, 0);
  });

  function deadRows() {
    var base = ['0', '1', '2', '3'];
    var rows = [];
    for (var r = 0; r < 8; r++) {
      var tokens = [];
      for (var c = 0; c < 8; c++) { tokens.push(base[(c + 2 * r) % 4]); }
      rows.push(tokens.join(' '));
    }
    return rows;
  }

  t('isAdjacent: orthogonal neighbors only', function () {
    var p = { r: 2, c: 2 };
    eq(B.isAdjacent(p, { r: 2, c: 3 }), true);
    eq(B.isAdjacent(p, { r: 3, c: 2 }), true);
    eq(B.isAdjacent(p, { r: 1, c: 2 }), true);
    eq(B.isAdjacent(p, { r: 3, c: 3 }), false);
    eq(B.isAdjacent(p, { r: 2, c: 2 }), false);
    eq(B.isAdjacent(p, { r: 2, c: 4 }), false);
  });

  t('canSwap: false for void, empty, locked, non-adjacent', function () {
    var b = B.fromRows(['0 1 #', '_ 2 3'], { lock: ['..L', '...'] });
    eq(B.canSwap(b, { r: 0, c: 0 }, { r: 0, c: 1 }), true);
    eq(B.canSwap(b, { r: 0, c: 1 }, { r: 0, c: 2 }), false, 'void');
    eq(B.canSwap(b, { r: 0, c: 0 }, { r: 1, c: 0 }), false, 'empty');
    eq(B.canSwap(b, { r: 0, c: 1 }, { r: 1, c: 1 }), true);
    eq(B.canSwap(b, { r: 1, c: 1 }, { r: 1, c: 2 }), true);
    var l = B.fromRows(['0 1 2'], { lock: ['.L.'] });
    eq(B.canSwap(l, { r: 0, c: 0 }, { r: 0, c: 1 }), false, 'locked');
    eq(B.canSwap(l, { r: 0, c: 0 }, { r: 0, c: 2 }), false, 'not adjacent');
    eq(B.canSwap(l, { r: 0, c: 0 }, { r: 0, c: 0 }), false, 'same cell');
    eq(B.canSwap(l, { r: 0, c: 2 }, { r: 0, c: 3 }), false, 'out of bounds');
  });

  t('findPossibleMoves finds the single move', function () {
    var b;
    b = B.fromRows(['0 1 0 3', '1 0 3 4', '2 3 4 1', '3 4 1 2']);
    RS.assert.deepEqual(B.findPossibleMoves(b), [{ a: { r: 0, c: 1 }, b: { r: 1, c: 1 } }]);
  });

  t('findPossibleMoves counts special+special and colorball+candy', function () {
    var b = B.fromRows(['0 1h 2b 3', '4 5 4 5', '1 3 5 0', '* 2 2 3']);
    eq(B.findMatches(b).length, 0);
    var moves = B.findPossibleMoves(b);
    var has = function (a, c) {
      return moves.some(function (m) {
        return m.a.r === a.r && m.a.c === a.c && m.b.r === c.r && m.b.c === c.c;
      });
    };
    eq(has({ r: 0, c: 1 }, { r: 0, c: 2 }), true, 'stripe + bomb');
    eq(has({ r: 2, c: 0 }, { r: 3, c: 0 }), true, 'candy + colorball');
  });

  t('findPossibleMoves is empty on a dead board', function () {
    var b = B.fromRows(deadRows(), { colors: 4 });
    eq(B.findMatches(b).length, 0);
    eq(B.findPossibleMoves(b).length, 0);
  });

  t('findPossibleMoves leaves the board unchanged and orders row-major', function () {
    var rows = ['0 1 0 0', '1 0 2 3', '2 3 0 1', '3 2 1 3'];
    var b = B.fromRows(rows);
    var moves = B.findPossibleMoves(b);
    RS.assert.deepEqual(B.toRows(b), rows);
    eq(moves.length > 1, true);
    for (var i = 1; i < moves.length; i++) {
      var p = moves[i - 1].a, q = moves[i].a;
      eq(p.r < q.r || (p.r === q.r && p.c <= q.c), true, 'order at ' + i);
    }
  });

  t('shuffle: dead board becomes playable', function () {
    var b = B.fromRows(deadRows(), { colors: 4, seed: 5 });
    eq(B.findPossibleMoves(b).length, 0);
    b.candies[0][0] = { id: 900, color: 0, special: 'stripeH' };
    b.candies[3][3] = { id: 901, color: 2, special: null };
    b.lock[3][3] = true;
    var kept = { s: B.get(b, { r: 0, c: 0 }), l: B.get(b, { r: 3, c: 3 }) };
    var moved = B.shuffle(b);
    eq(B.findMatches(b).length, 0);
    eq(B.findPossibleMoves(b).length > 0, true);
    eq(B.get(b, { r: 0, c: 0 }), kept.s);
    eq(B.get(b, { r: 3, c: 3 }), kept.l);
    eq(moved.length > 0, true);
    moved.forEach(function (m) {
      eq(m.id !== 900 && m.id !== 901, true);
      eq(B.get(b, m.pos).id, m.id);
    });
  });

  t('shuffle terminates on a pathological board', function () {
    var b = B.fromRows(['0 0 0', '0 0 0', '0 0 0'], { colors: 1 });
    var moved = B.shuffle(b);
    eq(Array.isArray(moved), true);
    eq(b.candies[1][1] !== null, true);
  });

  t('create: shuffles when no move is found in 100 tries', function () {
    var realFind = B.findPossibleMoves;
    var realShuffle = B.shuffle;
    var shuffles = 0;
    var b;
    try {
      B.findPossibleMoves = function () { return []; };
      B.shuffle = function (board) { shuffles++; return realShuffle(board); };
      b = B.create({ rows: 8, cols: 8, colors: 6, seed: 4 });
    } finally {
      B.findPossibleMoves = realFind;
      B.shuffle = realShuffle;
    }
    eq(shuffles, 1);
    eq(B.findMatches(b).length, 0);
    eq(B.findPossibleMoves(b).length > 0, true);
  });
})(window.RS = window.RS || {});
