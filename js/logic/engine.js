(function (RS) {
  'use strict';

  var POINTS = { CANDY: 20, OBSTACLE: 50 };

  function pos(r, c) { return { r: r, c: c }; }
  function key(p) { return p.r + ',' + p.c; }

  function swapCandies(board, a, b) {
    var tmp = board.candies[a.r][a.c];
    board.candies[a.r][a.c] = board.candies[b.r][b.c];
    board.candies[b.r][b.c] = tmp;
  }

  // A cell that gravity fills: playable and not locked (locked candies stay put).
  function isFallSlot(board, r, c) {
    return board.mask[r][c] && !board.lock[r][c];
  }

  function pushObstacleEvent(ctx, event) {
    if (!event) { return; }
    ctx.events.push(event);
    ctx.obstacleHits = (ctx.obstacleHits || 0) + 1;
  }

  // The single place where a cell gets hit: hits glaze and lock, marks the candy for removal
  // and triggers a special candy. A cell is hit at most once per stage (ctx.hit); each special
  // triggers at most once per swap (ctx.triggered), so chains end.
  // viaMatch: true when the hit comes from a match. A locked candy loses its lock on any hit,
  // but only a match clears it; an effect leaves the candy (and its special) in place.
  // A cell that is part of a match of this stage (ctx.matched) counts as matched even when an
  // effect reaches it before the match does.
  function hitCell(board, p, ctx, viaMatch) {
    if (!RS.Board.isPlayable(board, p)) { return; }
    var k = key(p);
    ctx.hit = ctx.hit || new Set();
    if (ctx.hit.has(k)) { return; }
    ctx.hit.add(k);
    var matched = viaMatch || Boolean(ctx.matched && ctx.matched.has(k));
    pushObstacleEvent(ctx, RS.Obstacles.hitGlaze(board, p));
    if (board.lock[p.r][p.c]) {
      pushObstacleEvent(ctx, RS.Obstacles.hitLock(board, p));
      if (!matched) { return; }
    }
    var candy = RS.Board.get(board, p);
    if (!candy) { return; }
    ctx.toClear.set(k, pos(p.r, p.c));
    if (candy.special && !ctx.triggered.has(candy.id)) {
      ctx.triggered.add(candy.id);
      var cells = RS.Specials.area(board, p, candy.special);
      ctx.events.push({
        type: 'specialTriggered', pos: pos(p.r, p.c), special: candy.special, cells: cells
      });
      cells.forEach(function (q) { RS.Engine._hitCell(board, q, ctx, false); });
    }
  }

  function triggeredEvent(board, p, cells) {
    return {
      type: 'specialTriggered',
      pos: pos(p.r, p.c),
      special: board.candies[p.r][p.c].special,
      cells: cells.slice()
    };
  }

  // Stage 1 of a combo swap (two specials, or a colorball with anything). Both swapped
  // candies count as triggered and are cleared; their own effect is replaced by the combo.
  function applyCombo(board, ctx, a, b, combo) {
    var ends = [b, a].filter(function (p) { return board.candies[p.r][p.c].special; });
    ends.forEach(function (p) { ctx.triggered.add(board.candies[p.r][p.c].id); });
    if (combo.transform) {
      var ball = board.candies[a.r][a.c].special === 'colorball' ? a : b;
      ctx.events.push(triggeredEvent(board, ball, combo.cells));
      // Rewrite every normal candy of the partner color first, then trigger them all.
      // Locked candies are not transformed; the combo hit only removes their lock.
      combo.cells.forEach(function (p) {
        var candy = board.candies[p.r][p.c];
        if (candy.special || board.lock[p.r][p.c]) { return; }
        candy.special = RS.Specials.transformKind(board, combo.transform.special);
        ctx.events.push({
          type: 'specialCreated',
          pos: pos(p.r, p.c),
          id: candy.id,
          special: candy.special,
          color: candy.color
        });
      });
    } else {
      ends.forEach(function (p) { ctx.events.push(triggeredEvent(board, p, combo.cells)); });
    }
    combo.cells.concat([a, b]).forEach(function (p) { RS.Engine._hitCell(board, p, ctx, false); });
  }

  // Removes every candy collected in ctx.toClear and emits the stage's one `cleared` event
  // (also when only obstacles were hit); then resets the per-stage hit bookkeeping.
  function clearCollected(board, ctx) {
    var candies = [];
    ctx.toClear.forEach(function (p) {
      var candy = board.candies[p.r][p.c];
      if (!candy) { return; }
      candies.push({ id: candy.id, color: candy.color, special: candy.special, pos: pos(p.r, p.c) });
      board.candies[p.r][p.c] = null;
    });
    ctx.toClear = new Map();
    ctx.events.push({
      type: 'cleared',
      candies: candies,
      points: POINTS.CANDY * ctx.stage * candies.length + POINTS.OBSTACLE * (ctx.obstacleHits || 0)
    });
    ctx.hit = new Set();
    ctx.matched = new Set();
    ctx.obstacleHits = 0;
  }

  // Per column, bottom-up: candies drop into the lowest free fall slot below them.
  // Void and locked cells are skipped, so candies fall through/past them.
  function applyGravity(board, ctx) {
    var moves = [];
    for (var c = 0; c < board.cols; c++) {
      var target = board.rows - 1;
      for (var r = board.rows - 1; r >= 0; r--) {
        if (!isFallSlot(board, r, c)) { continue; }
        var candy = board.candies[r][c];
        if (!candy) { continue; }
        while (!isFallSlot(board, target, c) || (target > r && board.candies[target][c])) {
          target--;
        }
        if (target !== r) {
          board.candies[target][c] = candy;
          board.candies[r][c] = null;
          moves.push({ id: candy.id, from: pos(r, c), to: pos(target, c) });
        }
        target--;
      }
    }
    ctx.events.push({ type: 'fell', moves: moves });
  }

  // Fills the empty fall slots top-down (row-major) with fresh candies.
  function spawn(board, ctx) {
    var candies = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        if (isFallSlot(board, r, c) && !board.candies[r][c]) {
          var candy = { id: board.nextId++, color: board.rng.int(board.colors), special: null };
          board.candies[r][c] = candy;
          candies.push({ id: candy.id, color: candy.color, special: null, pos: pos(r, c) });
        }
      }
    }
    ctx.events.push({ type: 'spawned', candies: candies });
  }

  function sortRowMajor(cells) {
    return cells.slice().sort(function (p, q) { return p.r - q.r || p.c - q.c; });
  }

  function containsCell(cells, p) {
    return cells.some(function (q) { return q.r === p.r && q.c === p.c; });
  }

  // Where the special of a match is created (see spec 4.3): stage 1 follows the swap
  // (the dragged-to cell b first), otherwise the shared cell of an LT or the middle of a line.
  // A cell already holding a special is never picked (it is triggered and cleared instead).
  function specialPosition(board, match, ctx, taken) {
    var sorted = sortRowMajor(match.cells);
    var preferred = null;
    if (ctx.stage === 1 && ctx.swap) {
      if (containsCell(sorted, ctx.swap.b)) { preferred = ctx.swap.b; }
      else if (containsCell(sorted, ctx.swap.a)) { preferred = ctx.swap.a; }
    }
    if (!preferred && match.shape === 'LT') {
      preferred = sorted.filter(function (p) {
        var horizontal = containsCell(sorted, pos(p.r, p.c - 1)) || containsCell(sorted, pos(p.r, p.c + 1));
        var vertical = containsCell(sorted, pos(p.r - 1, p.c)) || containsCell(sorted, pos(p.r + 1, p.c));
        return horizontal && vertical;
      })[0] || null;
    }
    if (!preferred) { preferred = sorted[Math.floor(sorted.length / 2)]; }
    function free(p) {
      var candy = board.candies[p.r][p.c];
      return !taken[key(p)] && candy !== null && !candy.special;
    }
    if (free(preferred)) { return preferred; }
    // Taken by another match of this stage, or already special: take the next free cell.
    return sorted.filter(free)[0] || null;
  }

  function specialKind(match, ctx) {
    if (match.shape === 'line5') { return 'colorball'; }
    if (match.shape === 'LT') { return 'bomb'; }
    var horizontal = ctx.stage === 1 && ctx.swap ? ctx.swap.a.r === ctx.swap.b.r : match.orientation === 'h';
    return horizontal ? 'stripeH' : 'stripeV';
  }

  // Every match bigger than line3 turns one of its candies into a special instead of clearing it.
  function createSpecials(board, matches, ctx) {
    var taken = {};
    matches.forEach(function (m) {
      if (m.shape === 'line3') { return; }
      var p = specialPosition(board, m, ctx, taken);
      if (!p) { return; }
      var candy = board.candies[p.r][p.c];
      taken[key(p)] = true;
      candy.special = specialKind(m, ctx);
      if (candy.special === 'colorball') { candy.color = null; }
      ctx.toClear.delete(key(p));
      ctx.events.push({
        type: 'specialCreated',
        pos: pos(p.r, p.c),
        id: candy.id,
        special: candy.special,
        color: candy.color
      });
    });
  }

  // Runs cascade stages until the board has no matches, then reshuffles a dead board.
  // A caller may pre-fill ctx.toClear to run a stage without a match. A combo swap sets
  // ctx.combo: stage 1 then runs the combo instead of matches, later stages cascade as usual.
  function resolve(board, ctx) {
    var matches = ctx.combo || ctx.smash ? [] : RS.Board.findMatches(board);
    while (matches.length > 0 || ctx.toClear.size > 0 || ctx.combo || ctx.smash) {
      ctx.stage++;
      ctx.events.push({ type: 'cascade', stage: ctx.stage });
      if (ctx.combo) {
        applyCombo(board, ctx, ctx.combo.a, ctx.combo.b, ctx.combo.result);
        ctx.combo = null;
      }
      if (ctx.smash) {
        RS.Engine._hitCell(board, ctx.smash, ctx, true);
        ctx.smash = null;
      }
      matches.forEach(function (m) {
        ctx.events.push({ type: 'matched', color: m.color, cells: m.cells, shape: m.shape });
      });
      ctx.matched = new Set();
      matches.forEach(function (m) {
        m.cells.forEach(function (p) { ctx.matched.add(key(p)); });
      });
      matches.forEach(function (m) {
        m.cells.forEach(function (p) { RS.Engine._hitCell(board, p, ctx, true); });
      });
      createSpecials(board, matches, ctx);
      clearCollected(board, ctx);
      applyGravity(board, ctx);
      spawn(board, ctx);
      matches = RS.Board.findMatches(board);
    }
    if (RS.Board.findPossibleMoves(board).length === 0) {
      var moved = RS.Board.shuffle(board);
      ctx.events.push({
        type: 'shuffled',
        candies: moved.map(function (m) {
          return { id: m.id, pos: m.pos, color: board.candies[m.pos.r][m.pos.c].color };
        })
      });
    }
  }

  function swap(board, a, b) {
    if (!RS.Board.canSwap(board, a, b)) {
      return { valid: false, events: [{ type: 'swapRejected', a: a, b: b }] };
    }
    var ctx = {
      stage: 0,
      events: [],
      swap: { a: a, b: b },
      triggered: new Set(),
      toClear: new Map(),
      combo: null
    };
    swapCandies(board, a, b);
    ctx.events.push({ type: 'swapped', a: a, b: b });
    // Two specials or a colorball: a combo, valid without a color match.
    var combo = RS.Specials.combo(board, a, b);
    if (combo) {
      ctx.combo = { a: a, b: b, result: combo };
    } else if (RS.Board.findMatches(board).length === 0) {
      swapCandies(board, a, b);
      ctx.events.push({ type: 'swapRejected', a: a, b: b });
      return { valid: false, events: ctx.events };
    }
    RS.Engine._resolve(board, ctx);
    return { valid: true, events: ctx.events };
  }

  // Hammer joker: hits one cell like a match would (glaze, lock, special), then resolves.
  function smash(board, p) {
    if (!RS.Board.isPlayable(board, p) || !RS.Board.get(board, p)) {
      return { valid: false, events: [{ type: 'smashRejected', pos: p }] };
    }
    var ctx = {
      stage: 0,
      events: [{ type: 'smashed', pos: p }],
      swap: null,
      triggered: new Set(),
      toClear: new Map(),
      combo: null,
      smash: p
    };
    RS.Engine._resolve(board, ctx);
    return { valid: true, events: ctx.events };
  }

  RS.Engine = {
    POINTS: POINTS,
    swap: swap,
    smash: smash,
    _resolve: resolve,
    _hitCell: hitCell
  };
})(window.RS = window.RS || {});
