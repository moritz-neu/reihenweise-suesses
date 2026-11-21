(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  var VALID = 'x.12LKIJC';

  function strings(value, out) {
    if (typeof value === 'string') { out.push(value); }
    else if (Array.isArray(value)) { value.forEach(function (v) { strings(v, out); }); }
    else if (value && typeof value === 'object') { Object.keys(value).forEach(function (k) { strings(value[k], out); }); }
    return out;
  }

  t('levels: 20 levels, ids 1..20, worlds 1 and 2', function () {
    eq(RS.LEVELS.length, 20);
    RS.LEVELS.forEach(function (lv, i) {
      eq(lv.id, i + 1);
      eq(lv.seed, 1000 + i + 1);
      eq(lv.world, lv.id <= 10 ? 1 : 2, 'world of level ' + lv.id);
    });
  });

  t('levels: boss levels 10 and 20 with 36/40 moves and single boss goal', function () {
    var ten = RS.LEVELS[9];
    var twenty = RS.LEVELS[19];
    eq(ten.boss, 'lakritz');
    eq(ten.moves, 36);
    eq(ten.colors, 6);
    eq(twenty.boss, 'kandara');
    eq(twenty.moves, 40);
    eq(twenty.colors, 6);
    [ten, twenty].forEach(function (lv) {
      eq(lv.goals.length, 1, 'goals of level ' + lv.id);
      eq(lv.goals[0].type, 'boss');
      ok(RS.BOSSES[lv.boss], 'boss data for level ' + lv.id);
    });
    ok(!/[12KLIJC]/.test(ten.layout.join('')), 'level 10 has no obstacles');
    ok(/[12]/.test(twenty.layout.join('')), 'level 20 starts with some glaze');
    RS.LEVELS.forEach(function (lv) {
      if (lv.id !== 10 && lv.id !== 20) { ok(lv.boss === undefined, 'no boss in level ' + lv.id); }
    });
  });

  t('levels: every layout is 8x8 and only uses known characters', function () {
    RS.LEVELS.forEach(function (lv) {
      eq(lv.layout.length, 8, 'rows of level ' + lv.id);
      lv.layout.forEach(function (row) {
        eq(row.length, 8, 'cols of level ' + lv.id);
        row.split('').forEach(function (ch) { ok(VALID.indexOf(ch) >= 0, 'char ' + ch + ' in level ' + lv.id); });
      });
    });
  });

  t('levels: 13 has ice, 16 has chocolate and a choco goal', function () {
    ok(/I/.test(RS.LEVELS[12].layout.join('')), 'ice in level 13');
    ok(/C/.test(RS.LEVELS[15].layout.join('')), 'chocolate in level 16');
    ok(RS.LEVELS[15].goals.some(function (g) { return g.type === 'choco'; }), 'choco goal in level 16');
  });

  t('levels: ice and chocolate only in world 2, choco goals have chocolate', function () {
    RS.LEVELS.forEach(function (lv) {
      var text = lv.layout.join('');
      if (lv.world === 1) { ok(!/[IJC]/.test(text), 'no world-2 obstacles in level ' + lv.id); }
      if (lv.goals.some(function (g) { return g.type === 'choco'; })) { ok(/C/.test(text), 'chocolate in level ' + lv.id); }
    });
  });

  t('levels: each level has at least one goal and moves, no score star thresholds', function () {
    RS.LEVELS.forEach(function (lv) {
      ok(lv.goals.length >= 1, 'goals of level ' + lv.id);
      ok(lv.moves > 0);
      ok(lv.stars === undefined, 'level ' + lv.id + ' must not define score star thresholds');
    });
  });

  t('levels: glaze-goal levels contain glaze', function () {
    RS.LEVELS.forEach(function (lv) {
      var hasGoal = lv.goals.some(function (g) { return g.type === 'glaze'; });
      if (hasGoal) { ok(/[12K]/.test(lv.layout.join('')), 'glaze in level ' + lv.id); }
    });
  });

  t('levels: collect colors are below the color count', function () {
    RS.LEVELS.forEach(function (lv) {
      lv.goals.forEach(function (g) { if (g.type === 'collect') { ok(g.color < lv.colors, 'level ' + lv.id); } });
    });
  });

  t('levels: each level starts without match and with a possible move', function () {
    RS.LEVELS.forEach(function (lv) {
      var s = RS.Session.startLevel(lv);
      eq(RS.Board.findMatches(s.board).length, 0, 'matches in level ' + lv.id);
      ok(RS.Board.findPossibleMoves(s.board).length > 0, 'moves in level ' + lv.id);
    });
  });

  t('story: intro and win for 1..20', function () {
    var S = RS.STORY;
    ok(S.prologue.length >= 3 && S.prologue.length <= 4);
    for (var id = 1; id <= 20; id++) {
      ok(S.levels[id] && S.levels[id].intro.length > 0, 'intro ' + id);
      ok(S.levels[id] && S.levels[id].win.length > 0, 'win ' + id);
    }
    ok(/Lakritz/.test(S.levels[10].intro + S.levels[10].win), 'level 10 is about the count');
    ok(/Kandara/.test(S.levels[20].intro + S.levels[20].win), 'level 20 is about Kandara');
  });

  t('story: boss scenes complete', function () {
    ['lakritz', 'kandara'].forEach(function (id) {
      var b = RS.STORY.bosses[id];
      ok(b, 'scenes for ' + id);
      ok(b.intro.length >= 2 && b.intro.length <= 4, 'intro length ' + id);
      b.intro.forEach(function (line, i) {
        eq(line.who, i % 2 === 0 ? 'boss' : 'annika', 'alternating speaker ' + id + ' ' + i);
        ok(line.text.length > 0);
      });
      eq(b.phase2.length, 2, 'phase2 ' + id);
      eq(b.defeat.length, 2, 'defeat ' + id);
      b.phase2.concat(b.defeat).forEach(function (line) {
        ok(line.who === 'boss' || line.who === 'annika', 'speaker ' + id);
        ok(line.text.length > 0);
      });
    });
  });

  t('story: world2Intro, interlude, grandFinale present', function () {
    var S = RS.STORY;
    eq(S.world2Intro.length, 4);
    ok(S.interlude.length >= 3 && S.interlude.length <= 4);
    ok(/Tor/.test(S.interlude.join(' ')), 'the count flees through the gate');
    ok(S.grandFinale.length >= 4 && S.grandFinale.length <= 5);
    eq(S.gateLocked, 'Besiege Graf Lakritz, um das Tor zu öffnen.');
    ok(S.finale === undefined, 'old finale is now the interlude');
  });

  t('story: one sentence per line except world2Intro', function () {
    function count(text) { return text.split(/[.!?…]+/).filter(function (x) { return x.trim().length > 0; }).length; }
    var S = RS.STORY;
    var single = S.interlude.concat(S.grandFinale, [S.gateLocked]);
    for (var id = 10; id <= 20; id++) { single.push(S.levels[id].intro, S.levels[id].win); }
    ['lakritz', 'kandara'].forEach(function (b) {
      S.bosses[b].intro.concat(S.bosses[b].phase2, S.bosses[b].defeat).forEach(function (l) { single.push(l.text); });
    });
    single.forEach(function (l) { eq(count(l), 1, 'one sentence: ' + l); });
    S.world2Intro.forEach(function (l) { ok(count(l) >= 1 && count(l) <= 2, 'world2Intro: ' + l); });
  });

  t('story: collect levels name their color in the intro', function () {
    var names = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];
    RS.LEVELS.forEach(function (lv) {
      lv.goals.forEach(function (g) {
        if (g.type === 'collect') { ok(RS.STORY.levels[lv.id].intro.indexOf(names[g.color]) >= 0, 'level ' + lv.id); }
      });
    });
  });

  t('story: no text mentions Candy Crush', function () {
    var all = strings(RS.STORY, []).join('\n').toLowerCase();
    ok(all.length > 0);
    ok(all.indexOf('candy crush') < 0);
  });
  t('story: every line has at most 2 sentences', function () {
    function count(text) { return text.split(/[.!?]+/).filter(function (x) { return x.trim().length > 0; }).length; }
    var S = RS.STORY;
    var lines = S.prologue.slice();
    RS.LEVELS.forEach(function (lv) { lines.push(S.levels[lv.id].intro, S.levels[lv.id].win); });
    lines.forEach(function (l) { ok(count(l) <= 2, 'too long: ' + l); });
  });

  t('story: the fairy is called Annika', function () {
    var text = JSON.stringify(RS.STORY);
    ok(text.indexOf('Annika') >= 0, 'Annika named');
    ok(!/mira/i.test(text), 'no Mira left');
  });

  t('story: shop intro has three short lines', function () {
    eq(RS.STORY.shop.length, 3);
    RS.STORY.shop.forEach(function (l) {
      eq(l.match(/[.!?]/g).length, 1, 'one sentence end: ' + l);
      ok(/[.!?]$/.test(l), 'ends with it: ' + l);
    });
  });
})(window.RS = window.RS || {});
