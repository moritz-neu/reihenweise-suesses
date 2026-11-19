(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  var VALID = 'x.12LK';

  function strings(value, out) {
    if (typeof value === 'string') { out.push(value); }
    else if (Array.isArray(value)) { value.forEach(function (v) { strings(v, out); }); }
    else if (value && typeof value === 'object') { Object.keys(value).forEach(function (k) { strings(value[k], out); }); }
    return out;
  }

  t('levels: 10 levels with ids 1..10', function () {
    eq(RS.LEVELS.length, 10);
    RS.LEVELS.forEach(function (lv, i) { eq(lv.id, i + 1); eq(lv.seed, 1000 + i + 1); });
  });

  t('levels: each layout is 8 strings of 8 valid chars', function () {
    RS.LEVELS.forEach(function (lv) {
      eq(lv.layout.length, 8, 'rows of level ' + lv.id);
      lv.layout.forEach(function (row) {
        eq(row.length, 8, 'cols of level ' + lv.id);
        row.split('').forEach(function (ch) { ok(VALID.indexOf(ch) >= 0, 'char ' + ch + ' in level ' + lv.id); });
      });
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

  t('story: intro and win for each level, prologue and finale non-empty', function () {
    var S = RS.STORY;
    ok(S.prologue.length >= 3 && S.prologue.length <= 4);
    ok(S.finale.length >= 3 && S.finale.length <= 4);
    RS.LEVELS.forEach(function (lv) {
      ok(S.levels[lv.id].intro.length > 0, 'intro ' + lv.id);
      ok(S.levels[lv.id].win.length > 0, 'win ' + lv.id);
    });
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
    var lines = S.prologue.concat(S.finale);
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
