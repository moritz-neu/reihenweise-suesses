(function (RS) {
  'use strict';
  var B = RS.Board;
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  function P(r, c) { return { r: r, c: c }; }
  function ofType(events, type) { return events.filter(function (e) { return e.type === type; }); }
  function indexOf(events, type) {
    for (var i = 0; i < events.length; i++) { if (events[i].type === type) { return i; } }
    return -1;
  }

  // Swapping (0,2) and (0,3) makes 0-0-0 in the top row. The chameleon at (3,2) is colour 0 and
  // becomes 1, which completes 1-1-1 in the bottom row.
  var ROWS = ['0 0 2 0 3 2', '2 3 3 2 0 3', '3 2 0 3 2 0', '1 1 0 3 2 3'];
  var NEVER = [{ type: 'score', target: 1000000 }];

  function session(goals, extra, chameleons) {
    var board = B.fromRows(ROWS, { colors: 4 });
    board.candies[3][2].chameleon = true;
    board.chameleonRule = chameleons || null;
    var def = { id: 't', colors: 4, seed: 1, moves: 20, layout: [], goals: goals, chameleons: chameleons };
    Object.keys(extra || {}).forEach(function (k) { def[k] = extra[k]; });
    return RS.Session._fromBoard(def, board);
  }
  function play(s) { return RS.Session.move(s, P(0, 2), P(0, 3)); }
  function clearedPoints(events) {
    var n = 0;
    ofType(events, 'cleared').forEach(function (e) { n += e.points; });
    return n;
  }

  t('chameleons: shift cycles colour', function () {
    var b = B.fromRows(['0 1 2 3', '2 3 0 1', '0 1 2 3', '2 3 0 1'], { colors: 4 });
    b.candies[0][0].chameleon = true;
    b.candies[1][1].chameleon = true;
    var id = b.candies[1][1].id;
    var ev = RS.Chameleons.shift(b);
    eq(b.candies[0][0].color, 1);
    eq(b.candies[1][1].color, 0);
    eq(b.candies[2][2].color, 2);
    eq(ev.length, 1);
    eq(ev[0].type, 'chameleonShift');
    eq(ev[0].changes.length, 2);
    eq(ev[0].changes[1].id, id);
    eq(ev[0].changes[1].color, 0);
    eq(ev[0].changes[1].pos.r, 1);
    eq(RS.Chameleons.shift(B.fromRows(['0 1', '1 0'], { colors: 4 })).length, 0);
  });

  t('chameleons: frozen chameleon does not shift', function () {
    var b = B.fromRows(['0 1 2 3', '2 3 0 1', '0 1 2 3', '2 3 0 1'], { colors: 4 });
    b.candies[0][0].chameleon = true;
    b.ice[0][0] = 1;
    eq(RS.Chameleons.shift(b).length, 0);
    eq(b.candies[0][0].color, 0);
  });

  t('chameleons: a colourball chameleon does not shift', function () {
    var b = B.fromRows(['* 1 2 3', '2 3 0 1', '0 1 2 3', '2 3 0 1'], { colors: 4 });
    b.candies[0][0].chameleon = true;
    eq(RS.Chameleons.shift(b).length, 0);
    eq(b.candies[0][0].color, null);
  });

  t('chameleons: shift match resolves without move and counts goals and boss damage', function () {
    var s = session(NEVER, { boss: 'lakritz' });
    var ev = play(s);
    var at = indexOf(ev, 'chameleonShift');
    ok(at > 0);
    var after = ev.slice(at);
    var cleared = ofType(after, 'cleared');
    ok(cleared.length >= 1);
    ok(cleared[0].candies.length >= 3);
    ok(ofType(after, 'bossDamaged').length >= 1);
    eq(s.goals.movesLeft, 19);
    eq(s.moveNo, 1);
    eq(s.goals.score, clearedPoints(ev));
    eq(s.status, 'playing');
  });

  t('chameleons: a win by the shift cascade stops the step', function () {
    var s = session([{ type: 'collect', color: 1, target: 3 }], null, { spawnEvery: 1 });
    s.board.candies[1][4].fuse = 1;
    var ev = play(s);
    eq(s.status, 'won');
    eq(ofType(ev, 'levelWon').length, 1);
    ok(indexOf(ev, 'chameleonShift') >= 0);
    eq(ofType(ev, 'fuseTick').length, 0);
    eq(ofType(ev, 'levelLost').length, 0);
    eq(ofType(ev, 'chameleonSpawned').length, 0);
  });

  t('chameleons: dead board after shift reshuffles', function () {
    var s = session(NEVER);
    var b = B.fromRows(['0 1 2 3', '2 3 0 1', '0 1 2 3', '2 3 0 1'], { colors: 4 });
    b.candies[0][0].chameleon = true;
    s.board = b;
    var ev = [];
    RS.Session._shiftChameleons(s, ev);
    ok(indexOf(ev, 'chameleonShift') >= 0);
    ok(RS.Board.findPossibleMoves(b).length > 0);
    var flagged = 0;
    b.candies.forEach(function (row) { row.forEach(function (c) { if (c.chameleon) { flagged++; } }); });
    eq(flagged, 1);
  });

  t('chameleons: jokers and spell do not shift', function () {
    var s = session(NEVER, { boss: 'lakritz' });
    var ev = RS.Session.smash(s, P(2, 0));
    eq(ofType(ev, 'chameleonShift').length, 0);
    eq(s.board.candies[3][2].color, 0);
    s.boss.charge = RS.Boss.SPELL_MAX;
    ev = RS.Session.starSpell(s);
    eq(ofType(ev, 'chameleonShift').length, 0);
    eq(s.board.candies[3][2].color, 0);
  });

  t('chameleons: spawn every Nth move on a free topmost candy', function () {
    var b = B.fromRows(['0 1 2 3', '2 3 0 1', '0 1 2 3', '2 3 0 1'], { colors: 4 });
    b.lock[0][0] = true;
    b.candies[0][1].fuse = 5;
    var rule = { spawnEvery: 3 };
    eq(RS.Chameleons.spawn(b, rule, 1).length, 0);
    eq(RS.Chameleons.spawn(b, rule, 2).length, 0);
    eq(RS.Chameleons.spawn(b, null, 3).length, 0);
    var ev = RS.Chameleons.spawn(b, rule, 3);
    eq(ev.length, 1);
    eq(ev[0].type, 'chameleonSpawned');
    eq(ev[0].pos.r, 0);
    ok(ev[0].pos.c >= 2);
    eq(b.candies[0][ev[0].pos.c].chameleon, true);
    eq(b.candies[0][ev[0].pos.c].id, ev[0].id);
    // a chameleon is not free: it is not picked again, nor by fuse, boss or spread
    ok(!RS.Obstacles.isFree(b, P(0, ev[0].pos.c)));
  });

  t('chameleons: layout H places one, flag survives gravity and shuffle, ends when cleared', function () {
    var b = B.create({ rows: 8, cols: 8, colors: 4, seed: 3,
      layout: ['--------', '--------', '--------', '--------', '--------', '--------', '--------', '---H----'] });
    eq(b.candies[7][3].chameleon, true);
    var id = b.candies[7][3].id;
    RS.Board.shuffle(b);
    var found = null;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) { if (b.candies[r][c].id === id) { found = b.candies[r][c]; } }
    }
    eq(found.chameleon, true);
    var ctx = { stage: 0, events: [], swap: null, triggered: new Set(), toClear: new Map(), combo: null };
    var holder = b.candies[7][3];
    ctx.toClear = new Map([['7,3', P(7, 3)]]);
    RS.Engine._resolve(b, ctx);
    ok(b.candies[7][3] !== holder);
  });
})(window.RS);
