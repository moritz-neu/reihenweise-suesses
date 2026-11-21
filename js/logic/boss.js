(function (RS) {
  'use strict';

  var SPELL_MAX = 40;
  var SPELL_DAMAGE = 25;
  var SPELL_CLEARS = 6;
  var COMBO_BONUS = 10;

  function def(boss) { return RS.BOSSES[boss.id]; }

  function create(id) {
    var d = RS.BOSSES[id];
    return { id: id, hp: d.hp, max: d.hp, phase: 1, weak: d.weak[0], counter: 0, charge: 0 };
  }

  // 1 per cleared candy, 2 in the weak colour (a colourball counts 1), +10 for a combo swap.
  function damageFrom(boss, events, wasCombo) {
    var damage = wasCombo ? COMBO_BONUS : 0;
    events.forEach(function (e) {
      if (e.type !== 'cleared') { return; }
      e.candies.forEach(function (c) { damage += c.color !== null && c.color === boss.weak ? 2 : 1; });
    });
    return damage;
  }

  function apply(boss, damage) {
    var events = [];
    boss.hp = Math.max(0, boss.hp - damage);
    events.push({ type: 'bossDamaged', damage: damage, hp: boss.hp, max: boss.max });
    if (boss.phase === 1 && boss.hp > 0 && boss.hp * 2 <= boss.max) {
      boss.phase = 2;
      boss.weak = def(boss).weak[1];
      events.push({ type: 'bossPhase', phase: 2, weak: boss.weak });
    }
    if (boss.hp === 0) { events.push({ type: 'bossDefeated' }); }
    return events;
  }

  function charge(boss, clearedCount) {
    boss.charge = Math.min(SPELL_MAX, boss.charge + clearedCount);
    return [{ type: 'spellCharge', charge: boss.charge, max: SPELL_MAX }];
  }

  function cellsWhere(board, test) {
    var out = [];
    for (var r = 0; r < board.rows; r++) {
      for (var c = 0; c < board.cols; c++) {
        var p = { r: r, c: c };
        if (test(p)) { out.push(p); }
      }
    }
    return out;
  }

  // Takes up to n distinct entries out of list, chosen with the board's RNG.
  function pick(list, n, rng) {
    var pool = list.slice();
    var out = [];
    while (out.length < n && pool.length > 0) {
      out.push(pool.splice(rng.int(pool.length), 1)[0]);
    }
    return out;
  }

  function sameCell(a, b) { return a.r === b.r && a.c === b.c; }

  // n adjacent free cells of one random row, or [] when no row has such a stretch.
  function rowStretch(board, n, rng) {
    var rows = [];
    for (var r = 0; r < board.rows; r++) { rows.push(r); }
    while (rows.length > 0) {
      var row = rows.splice(rng.int(rows.length), 1)[0];
      var starts = [];
      for (var c0 = 0; c0 + n <= board.cols; c0++) {
        var allFree = true;
        for (var k = 0; k < n; k++) {
          if (!RS.Obstacles.isFree(board, { r: row, c: c0 + k })) { allFree = false; break; }
        }
        if (allFree) { starts.push(c0); }
      }
      if (starts.length > 0) {
        var start = starts[rng.int(starts.length)];
        var cells = [];
        for (var i = 0; i < n; i++) { cells.push({ r: row, c: start + i }); }
        return cells;
      }
    }
    return [];
  }

  function attackCells(board, attack) {
    var cells = attack.row ? rowStretch(board, attack.row, board.rng) : [];
    var candidates = cellsWhere(board, function (p) {
      if (!RS.Obstacles.isFree(board, p)) { return false; }
      if (attack.kind === 'glaze' && board.glaze[p.r][p.c] > 0) { return false; }
      return !cells.some(function (q) { return sameCell(p, q); });
    });
    return cells.concat(pick(candidates, attack.count, board.rng));
  }

  function applyAttack(board, attack, cells) {
    cells.forEach(function (p) {
      if (attack.kind === 'lock') { board.lock[p.r][p.c] = true; }
      else if (attack.kind === 'glaze') { board.glaze[p.r][p.c] = attack.level; }
      else { board.ice[p.r][p.c] = attack.level; }
    });
  }

  // Counts one swap move; when an attack is due it strikes and keeps a move possible.
  function step(boss, board) {
    boss.counter++;
    var attack = def(boss).attacks[boss.phase - 1];
    if (boss.counter < attack.every) { return []; }
    boss.counter = 0;
    var cells = attackCells(board, attack);
    if (cells.length === 0) { return []; }
    applyAttack(board, attack, cells);
    var events = [{ type: 'bossAttack', boss: boss.id, phase: boss.phase, kind: attack.kind,
      cells: cells, level: attack.level || 1 }];
    RS.Engine.shuffleIfDead(board, events);
    return events;
  }

  // 0 = ice, 1 = lock, 2 = glaze: the obstacle that ranks a cell for the spell.
  function spellRank(board, p) {
    if (board.ice[p.r][p.c] > 0) { return 0; }
    if (board.lock[p.r][p.c]) { return 1; }
    return board.glaze[p.r][p.c] > 0 ? 2 : -1;
  }

  // Removes every obstacle on the cell, all levels of ice and glaze included.
  function clearCell(board, p, events) {
    var hit;
    while ((hit = RS.Obstacles.hitIce(board, p))) { events.push(hit); }
    if ((hit = RS.Obstacles.hitLock(board, p))) { events.push(hit); }
    while ((hit = RS.Obstacles.hitGlaze(board, p))) { events.push(hit); }
  }

  // Star spell: empties the bar, clears up to 6 obstacle cells (ice, lock, glaze), deals damage.
  function castSpell(boss, board) {
    var chosen = [];
    for (var rank = 0; rank < 3 && chosen.length < SPELL_CLEARS; rank++) {
      var cells = cellsWhere(board, function (p) { return spellRank(board, p) === rank; });
      chosen = chosen.concat(pick(cells, SPELL_CLEARS - chosen.length, board.rng));
    }
    var events = [{ type: 'spellCast', cells: chosen }];
    chosen.forEach(function (p) { clearCell(board, p, events); });
    boss.charge = 0;
    return events.concat(apply(boss, SPELL_DAMAGE),
      [{ type: 'spellCharge', charge: 0, max: SPELL_MAX }]);
  }

  RS.Boss = {
    SPELL_MAX: SPELL_MAX, SPELL_DAMAGE: SPELL_DAMAGE, SPELL_CLEARS: SPELL_CLEARS, COMBO_BONUS: COMBO_BONUS,
    create: create, damageFrom: damageFrom, apply: apply, charge: charge, step: step, castSpell: castSpell
  };
})(window.RS = window.RS || {});
