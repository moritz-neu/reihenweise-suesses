(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  // Layout characters: void, cell, glaze, lock, thick glaze, ice, chocolate, crates.
  var VALID = 'x.12LKIJCXYZ';

  function strings(value, out) {
    if (typeof value === 'string') { out.push(value); }
    else if (Array.isArray(value)) { value.forEach(function (v) { strings(v, out); }); }
    else if (value && typeof value === 'object') { Object.keys(value).forEach(function (k) { strings(value[k], out); }); }
    return out;
  }

  function sentences(text) {
    return text.split(/[.!?…]+/).filter(function (x) { return x.trim().length > 0; }).length;
  }

  function bossLines(world) {
    var s = world.boss.story;
    var out = [];
    Object.keys(s).forEach(function (part) { s[part].forEach(function (l) { out.push(l); }); });
    return out;
  }

  function first20() {
    return RS.Worlds.levels().filter(function (l) { return l.world <= 2; });
  }

  t('levels: worlds 1 and 2 hold w1-01..w2-10 with the old seeds', function () {
    var lv = first20();
    eq(lv.length, 20);
    lv.forEach(function (l, i) {
      var n = i + 1;
      eq(l.id, RS.Save.legacyId(n));
      eq(l.num, n);
      eq(l.seed, 1000 + n);
      eq(l.world, n <= 10 ? 1 : 2, 'world of ' + l.id);
    });
    ok(RS.LEVELS === undefined, 'old level list is gone');
  });

  t('levels: boss levels w1-10 and w2-10 with 36/40 moves and single boss goal', function () {
    var ten = RS.Worlds.level('w1-10');
    var twenty = RS.Worlds.level('w2-10');
    eq(ten.boss, 'lakritz');
    eq(ten.moves, 36);
    eq(ten.colors, 6);
    eq(twenty.boss, 'kandara');
    eq(twenty.moves, 40);
    eq(twenty.colors, 6);
    [ten, twenty].forEach(function (l) {
      eq(l.goals.length, 1, 'goals of ' + l.id);
      eq(l.goals[0].type, 'boss');
      ok(RS.BOSSES[l.boss], 'boss data for ' + l.id);
    });
    ok(!/[12KLIJC]/.test(ten.layout.join('')), 'w1-10 has no obstacles');
    ok(/[12]/.test(twenty.layout.join('')), 'w2-10 starts with some glaze');
    RS.Worlds.levels().forEach(function (l) {
      if (!l.isBoss) { ok(l.boss === undefined, 'no boss in ' + l.id); }
    });
  });

  t('levels: every layout is 8x8 and only uses known characters', function () {
    RS.Worlds.levels().forEach(function (l) {
      eq(l.layout.length, 8, 'rows of ' + l.id);
      l.layout.forEach(function (row) {
        eq(row.length, 8, 'cols of ' + l.id);
        row.split('').forEach(function (ch) { ok(VALID.indexOf(ch) >= 0, 'char ' + ch + ' in ' + l.id); });
      });
    });
  });

  t('levels: w2-03 has ice, w2-06 has chocolate and a choco goal', function () {
    ok(/I/.test(RS.Worlds.level('w2-03').layout.join('')), 'ice in w2-03');
    var choco = RS.Worlds.level('w2-06');
    ok(/C/.test(choco.layout.join('')), 'chocolate in w2-06');
    ok(choco.goals.some(function (g) { return g.type === 'choco'; }), 'choco goal in w2-06');
  });

  t('levels: ice and chocolate only from world 2, choco goals have chocolate', function () {
    RS.Worlds.levels().forEach(function (l) {
      var text = l.layout.join('');
      if (l.world === 1) { ok(!/[IJC]/.test(text), 'no world-2 obstacles in ' + l.id); }
      if (l.goals.some(function (g) { return g.type === 'choco'; })) { ok(/C/.test(text), 'chocolate in ' + l.id); }
    });
  });

  t('levels: each level has at least one goal and moves, no score star thresholds', function () {
    RS.Worlds.levels().forEach(function (l) {
      ok(l.goals.length >= 1, 'goals of ' + l.id);
      ok(l.moves > 0);
      ok(l.stars === undefined, l.id + ' must not define score star thresholds');
    });
  });

  t('levels: glaze-goal levels contain glaze', function () {
    RS.Worlds.levels().forEach(function (l) {
      var hasGoal = l.goals.some(function (g) { return g.type === 'glaze'; });
      if (hasGoal) { ok(/[12K]/.test(l.layout.join('')), 'glaze in ' + l.id); }
    });
  });

  t('levels: collect colors are below the color count', function () {
    RS.Worlds.levels().forEach(function (l) {
      l.goals.forEach(function (g) { if (g.type === 'collect') { ok(g.color < l.colors, l.id); } });
    });
  });

  t('levels: each level starts without match and with a possible move', function () {
    RS.Worlds.levels().forEach(function (l) {
      var s = RS.Session.startLevel(l);
      eq(RS.Board.findMatches(s.board).length, 0, 'matches in ' + l.id);
      ok(RS.Board.findPossibleMoves(s.board).length > 0, 'moves in ' + l.id);
    });
  });

  t('story: the bosses of w1-10 and w2-10 are named in their texts', function () {
    var a = RS.Worlds.level('w1-10');
    var b = RS.Worlds.level('w2-10');
    ok(/Lakritz/.test(a.intro + a.win), 'w1-10 is about the count');
    ok(/Kandara/.test(b.intro + b.win), 'w2-10 is about Kandara');
  });

  t('story: boss scenes complete and alternating in the intro', function () {
    RS.Worlds.list().forEach(function (w) {
      var s = w.boss.story;
      ok(s.intro.length >= 2 && s.intro.length <= 4, 'intro length ' + w.boss.key);
      s.intro.forEach(function (line, i) {
        eq(line.who, i % 2 === 0 ? 'boss' : 'annika', 'alternating speaker ' + w.boss.key + ' ' + i);
        ok(line.text.length > 0);
      });
      bossLines(w).forEach(function (line) {
        ok(line.who === 'boss' || line.who === 'annika', 'speaker ' + w.boss.key);
        ok(line.text.length > 0);
      });
    });
  });

  t('story: world 1 intro is the prologue', function () {
    var intro = RS.Worlds.get(1).intro;
    eq(intro.length, 4);
    ok(/^Willkommen in Kandishain/.test(intro[0]));
    ok(/Annika/.test(intro.join(' ')));
  });

  t('story: chapter ends tell of the Sternsplitter, Kandara names Amarus', function () {
    ok(/Tor/.test(RS.Worlds.get(1).chapterEnd.join(' ')), 'the count flees through the gate');
    ok(/Sternsplitter/.test(RS.Worlds.get(1).chapterEnd.join(' ')));
    ok(/Amarus/.test(RS.Worlds.get(2).chapterEnd.join(' ')));
  });

  t('story: one sentence per line outside world intros and world-1 level texts', function () {
    var single = [];
    RS.Worlds.list().forEach(function (w) {
      single = single.concat(w.chapterEnd, [w.gateLocked]);
      bossLines(w).forEach(function (l) { single.push(l.text); });
    });
    RS.Worlds.levels().forEach(function (l) {
      if (l.world >= 2 || l.isBoss) { single.push(l.intro, l.win); }
    });
    single.push(RS.STORY.toBeContinued);
    single.forEach(function (l) { eq(sentences(l), 1, 'one sentence: ' + l); });
  });

  t('story: every line has at most 2 sentences', function () {
    var lines = [];
    RS.Worlds.list().forEach(function (w) { lines = lines.concat(w.intro); });
    RS.Worlds.levels().forEach(function (l) { lines.push(l.intro, l.win); });
    lines.forEach(function (l) { ok(sentences(l) <= 2, 'too long: ' + l); });
  });

  t('story: collect levels name their color in the intro', function () {
    var names = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];
    RS.Worlds.levels().forEach(function (l) {
      l.goals.forEach(function (g) {
        if (g.type === 'collect') { ok(l.intro.indexOf(names[g.color]) >= 0, l.id); }
      });
    });
  });

  t('story: no text mentions Candy Crush, the fairy is called Annika', function () {
    var all = strings([RS.STORY, RS.Worlds.list()], []).join('\n');
    ok(all.length > 0);
    ok(all.toLowerCase().indexOf('candy crush') < 0);
    ok(all.indexOf('Annika') >= 0, 'Annika named');
    ok(!/mira/i.test(all), 'no Mira left');
  });

  t('story: story.js keeps only cross-world texts', function () {
    var S = RS.STORY;
    ['prologue', 'levels', 'bosses', 'interlude', 'grandFinale', 'world2Intro', 'gateLocked'].forEach(function (k) {
      ok(S[k] === undefined, 'no ' + k + ' in story.js');
    });
    eq(S.toBeContinued, 'Fortsetzung folgt …');
    ok(S.atlas && S.atlas.title, 'atlas texts');
  });

  t('story: shop intro has three short lines', function () {
    eq(RS.STORY.shop.length, 3);
    RS.STORY.shop.forEach(function (l) {
      eq(l.match(/[.!?]/g).length, 1, 'one sentence end: ' + l);
      ok(/[.!?]$/.test(l), 'ends with it: ' + l);
    });
  });

  // ---------- Welt 3: Karamellwüste ----------

  function crateLevels(l) {
    var text = l.layout.join('');
    return [/X/.test(text), /Y/.test(text), /Z/.test(text)];
  }

  t('levels: world 3 holds w3-01..w3-10, crates only from world 3', function () {
    var w = RS.Worlds.get(3);
    ok(w, 'world 3 registered');
    eq(w.key, 'karamellwueste');
    eq(w.name, 'Karamellwüste');
    RS.assert.deepEqual(w.novelty, { kind: 'mechanic', key: 'crate' });
    eq(w.gateLocked, 'Besiege den Karamellkoloss, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(3);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w3-' + (i < 9 ? '0' : '') + (i + 1)); });
    RS.Worlds.levels().forEach(function (l) {
      if (l.world < 3) { ok(!/[XYZ]/.test(l.layout.join('')), 'no crates in ' + l.id); }
    });
  });

  t('levels: w3-01 introduces crates of level 1 with a crate goal', function () {
    var l = RS.Worlds.level('w3-01');
    RS.assert.deepEqual(crateLevels(l), [true, false, false]);
    ok(l.goals.some(function (g) { return g.type === 'crate'; }), 'crate goal in w3-01');
    ok(/Kiste/.test(l.intro), 'intro explains crates');
  });

  t('levels: every w3 level has crates, level 2 from w3-03, level 3 from w3-06', function () {
    var kinds = {};
    RS.Worlds.inWorld(3).forEach(function (l) {
      if (l.isBoss) { return; }
      var c = crateLevels(l);
      ok(c[0] || c[1] || c[2], 'crates in ' + l.id);
      if (l.pos < 3) { ok(!c[1], 'no level-2 crates in ' + l.id); }
      if (l.pos < 6) { ok(!c[2], 'no level-3 crates in ' + l.id); }
      l.goals.forEach(function (g) { kinds[g.type] = true; });
      if (/C/.test(l.layout.join(''))) { kinds.chocoCells = true; }
      if (/[LK]/.test(l.layout.join(''))) { kinds.lockCells = true; }
      if (/[IJ]/.test(l.layout.join(''))) { kinds.iceCells = true; }
    });
    ok(RS.Worlds.inWorld(3).some(function (l) { return !l.isBoss && crateLevels(l)[1]; }), 'level-2 crates used');
    ok(RS.Worlds.inWorld(3).some(function (l) { return !l.isBoss && crateLevels(l)[2]; }), 'level-3 crates used');
    ['crate', 'collect', 'score', 'glaze', 'choco'].forEach(function (k) { ok(kinds[k], 'goal ' + k + ' in world 3'); });
    ['chocoCells', 'lockCells', 'iceCells'].forEach(function (k) { ok(kinds[k], k + ' in world 3'); });
  });

  t('levels: introduction levels of worlds 3+ give at least 15 moves', function () {
    RS.Worlds.list().forEach(function (w) {
      if (w.id < 3) { return; }
      var first = RS.Worlds.inWorld(w.id)[0];
      ok(first.moves >= 15, first.id + ' has ' + first.moves + ' moves');
    });
  });

  t('levels: crate goals have crates', function () {
    RS.Worlds.levels().forEach(function (l) {
      if (l.goals.some(function (g) { return g.type === 'crate'; })) { ok(/[XYZ]/.test(l.layout.join('')), 'crates in ' + l.id); }
    });
  });

  t('levels: boss w3-10 is the Karamellkoloss throwing crates', function () {
    var l = RS.Worlds.level('w3-10');
    eq(l.boss, 'koloss');
    eq(l.moves, 40);
    eq(l.colors, 6);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.koloss;
    eq(b.name, 'Karamellkoloss');
    RS.assert.deepEqual(b.weak, [5, 1]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'crate', count: 3, level: 1 },
      { every: 2, kind: 'crate', count: 3, level: 2 }]);
    ok(b.hp > 0);
    ok(/Koloss/.test(l.intro + l.win), 'w3-10 is about the Koloss');
  });

  t('story: world 3 explains crates, senses a Bitterzauber and ends with the Bitterburg', function () {
    var w = RS.Worlds.get(3);
    ok(/Kiste/.test(w.intro.join(' ')), 'intro explains crates');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Bitterzauber/.test(scenes), 'Annika senses a Bitterzauber');
    var end = w.chapterEnd.join(' ');
    ok(/Bitterburg/.test(end), 'chapter end tells of the Bitterburg');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });

  // ---------- Welt 4: Kaugummi-Dschungel ----------

  function longestRow(l, chars) {
    var best = 0;
    l.layout.forEach(function (row) {
      var run = 0;
      row.split('').forEach(function (ch) {
        run = chars.indexOf(ch) >= 0 ? run + 1 : 0;
        best = Math.max(best, run);
      });
    });
    return best;
  }

  t('levels: world 4 holds w4-01..w4-10 and brings the Zuckerbesen', function () {
    var w = RS.Worlds.get(4);
    ok(w, 'world 4 registered');
    eq(w.key, 'kaugummidschungel');
    eq(w.name, 'Kaugummi-Dschungel');
    RS.assert.deepEqual(w.novelty, { kind: 'joker', key: 'besen' });
    eq(w.gateLocked, 'Besiege die Kaugummi-Krake Blubba, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(4);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w4-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { eq(l.colors, 6, 'colors of ' + l.id); });
  });

  t('levels: w4-01 invites the Besen with long rows of glaze or lock', function () {
    var l = RS.Worlds.level('w4-01');
    ok(longestRow(l, '12KL') >= 6, 'a long glaze or lock row in w4-01');
    ok(l.goals.some(function (g) { return g.type === 'glaze'; }), 'glaze goal in w4-01');
    ok(/Zuckerbesen/.test(l.intro), 'intro names the Zuckerbesen');
  });

  t('levels: w4-02..w4-09 use every known obstacle', function () {
    var kinds = {};
    RS.Worlds.inWorld(4).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZ]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score']
      .forEach(function (k) { ok(kinds[k], k + ' in world 4'); });
  });

  t('levels: boss w4-10 is the Kaugummi-Krake Blubba with glaze, then lock rows', function () {
    var l = RS.Worlds.level('w4-10');
    eq(l.boss, 'blubba');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.blubba;
    eq(b.name, 'Kaugummi-Krake Blubba');
    RS.assert.deepEqual(b.weak, [2, 4]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'glaze', count: 3, level: 2 },
      { every: 2, kind: 'lock', count: 2, row: 6 }]);
    ok(b.hp > 0);
    ok(/Blubba/.test(l.intro + l.win), 'w4-10 is about Blubba');
  });

  t('story: world 4 introduces the Besen as a gift and ends with the Bitterbrunnen', function () {
    var w = RS.Worlds.get(4);
    var intro = w.intro.join(' ');
    ok(/Zuckerbesen/.test(intro), 'intro names the Zuckerbesen');
    ok(/schenke/.test(intro), 'intro announces the gift');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Grün/.test(scenes) && /Violett/.test(scenes), 'Annika names both weak colours');
    ok(/Zuckerbesen/.test(scenes), 'Annika suggests the Zuckerbesen against the rows');
    var end = w.chapterEnd.join(' ');
    ok(/Bitterbrunnen/.test(end), 'chapter end reveals the Bitterbrunnen');
    ok(/Amarus/.test(end), 'chapter end names Amarus');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });
})(window.RS = window.RS || {});
