(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  // Layout characters: void, cell, glaze, lock, thick glaze, ice, chocolate, crates, cherry, fuse candy,
  // chameleon.
  var VALID = 'x.12LKIJCXYZRFH';

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

  t('levels: boss levels w1-10 and w2-10 with 40/40 moves and single boss goal', function () {
    var ten = RS.Worlds.level('w1-10');
    var twenty = RS.Worlds.level('w2-10');
    eq(ten.boss, 'lakritz');
    eq(ten.moves, 40);
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

  // ---------- Welt 5: Kirschgarten Morellia ----------

  function count(text, ch) { return text.split(ch).length - 1; }

  // Kirschen eines Levels: die Layout-Kirschen zählen zur Gesamtzahl der Regel.
  function cherryTotal(l) {
    var placed = count(l.layout.join(''), 'R');
    return l.cherries ? l.cherries.total : placed;
  }

  t('levels: world 5 holds w5-01..w5-10 and brings cherries', function () {
    var w = RS.Worlds.get(5);
    ok(w, 'world 5 registered');
    eq(w.key, 'kirschgarten');
    eq(w.name, 'Kirschgarten Morellia');
    RS.assert.deepEqual(w.novelty, { kind: 'mechanic', key: 'cherry' });
    eq(w.gateLocked, 'Besiege die Krähe Krawalla, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(5);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w5-' + (i < 9 ? '0' : '') + (i + 1)); });
    // Fünf Farben lassen Kirschen öfter fallen; der Boss kämpft wie überall mit sechs.
    lv.forEach(function (l) { ok(l.colors === (l.isBoss ? 6 : 5), 'colors of ' + l.id); });
  });

  t('levels: cherries only from world 5, every w5 level holds 2 to 4', function () {
    RS.Worlds.levels().forEach(function (l) {
      if (l.world < 5) {
        ok(!/R/.test(l.layout.join('')) && l.cherries === undefined, 'no cherries in ' + l.id);
      }
    });
    RS.Worlds.inWorld(5).forEach(function (l) {
      var placed = count(l.layout.join(''), 'R');
      var total = cherryTotal(l);
      ok(total >= 2 && total <= 4, l.id + ' has ' + total + ' cherries');
      if (l.cherries) {
        ok(l.cherries.total >= placed, 'rule total covers the layout cherries in ' + l.id);
        ok(l.cherries.onBoard >= 1 && l.cherries.onBoard <= total, 'onBoard in ' + l.id);
      }
      ok(!/R/.test(l.layout[7]), 'no cherry starts in the basket row of ' + l.id);
      if (!l.isBoss) {
        var goal = l.goals.filter(function (g) { return g.type === 'cherry'; })[0];
        ok(goal, 'cherry goal in ' + l.id);
        eq(goal.target, total, 'cherry goal of ' + l.id + ' asks for every cherry');
      }
    });
  });

  t('levels: cherry goals never ask for more cherries than the level holds', function () {
    RS.Worlds.levels().forEach(function (l) {
      l.goals.forEach(function (g) {
        if (g.type === 'cherry') { ok(g.target >= 1 && g.target <= cherryTotal(l), 'cherries for ' + l.id); }
      });
    });
  });

  t('levels: w5-01 introduces cherries with a cherry goal only', function () {
    var l = RS.Worlds.level('w5-01');
    RS.assert.deepEqual(l.goals.map(function (g) { return g.type; }), ['cherry']);
    ok(/Kirsche/.test(l.intro), 'intro explains cherries');
  });

  t('levels: w5-02..w5-09 mix every known obstacle and goal', function () {
    var kinds = {};
    RS.Worlds.inWorld(5).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(l.goals.length >= 2, 'a second goal in ' + l.id);
      ok(/[12KLIJCXYZ]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score']
      .forEach(function (k) { ok(kinds[k], k + ' in world 5'); });
  });

  t('levels: w5 layout cherries stay on the board at the start', function () {
    RS.Worlds.inWorld(5).forEach(function (l) {
      var s = RS.Session.startLevel(l);
      eq(s.board.cherryOnBoard, count(l.layout.join(''), 'R'), 'layout cherries stay on the board in ' + l.id);
    });
  });

  t('levels: boss w5-10 is the Krähe Krawalla with glaze, then lock rows', function () {
    var l = RS.Worlds.level('w5-10');
    eq(l.boss, 'krawalla');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.krawalla;
    eq(b.name, 'Krähe Krawalla');
    RS.assert.deepEqual(b.weak, [0, 2]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'glaze', count: 3, level: 2 },
      { every: 2, kind: 'lock', count: 2, row: 6 }]);
    eq(b.hp, 620);
    ok(/Krawalla/.test(l.intro + l.win), 'w5-10 is about Krawalla');
  });

  t('story: world 5 explains cherries and ends with the spy and the Sternenkrone', function () {
    var w = RS.Worlds.get(5);
    ok(/Kirsche/.test(w.intro.join(' ')), 'intro explains cherries');
    ok(/Krawalla/.test(w.intro.join(' ')), 'intro names the boss');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Rot/.test(scenes) && /Grün/.test(scenes), 'Annika names both weak colours');
    var end = w.chapterEnd.join(' ');
    ok(/Späherin/.test(end), 'Krawalla was the spy');
    ok(/Amarus/.test(end), 'chapter end names Amarus');
    ok(/Sternenkrone/.test(end), 'Amarus fears the Sternenkrone');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });

  // ---------- Welt 6: Zuckerwattenwolken ----------

  // Enge Stelle: ein Feld mit mindestens zwei Seiten an Leerfeldern oder am Rand.
  function tight(l, r, c) {
    var shut = 0;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
      var row = l.layout[r + d[0]];
      var ch = row === undefined ? undefined : row.charAt(c + d[1]);
      if (!ch || ch === '.') { shut++; }
    });
    return shut >= 2;
  }

  t('levels: world 6 holds w6-01..w6-10 and brings the Feentausch', function () {
    var w = RS.Worlds.get(6);
    ok(w, 'world 6 registered');
    eq(w.key, 'wolken');
    eq(w.name, 'Zuckerwattenwolken');
    RS.assert.deepEqual(w.novelty, { kind: 'joker', key: 'feentausch' });
    eq(w.gateLocked, 'Besiege die Gewitterhexe Wolkira, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(6);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w6-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id); });
    eq(RS.Worlds.level('w6-10').colors, 6, 'the boss fights with six colours');
  });

  t('levels: w6-01 invites the Feentausch with glaze in tight cloud corners', function () {
    var l = RS.Worlds.level('w6-01');
    ok(l.goals.some(function (g) { return g.type === 'glaze'; }), 'glaze goal in w6-01');
    var glaze = 0;
    var tightGlaze = 0;
    l.layout.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) {
        if (ch === '1' || ch === '2') {
          glaze++;
          if (tight(l, r, c)) { tightGlaze++; }
        }
      });
    });
    ok(glaze > 0 && tightGlaze === glaze, 'every glaze cell of w6-01 sits in a tight spot');
    ok(/Feentausch/.test(l.intro), 'intro names the Feentausch');
  });

  t('levels: w6-02..w6-09 use every known obstacle, cherries and goal', function () {
    var kinds = {};
    RS.Worlds.inWorld(6).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZ]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      if (/R/.test(text)) { kinds.cherry = true; }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'cherry',
      'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score', 'goal cherry']
      .forEach(function (k) { ok(kinds[k], k + ' in world 6'); });
  });

  t('levels: boss w6-10 is the Gewitterhexe Wolkira with ice, then chocolate', function () {
    var l = RS.Worlds.level('w6-10');
    eq(l.boss, 'wolkira');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.wolkira;
    eq(b.name, 'Gewitterhexe Wolkira');
    RS.assert.deepEqual(b.weak, [3, 5]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'ice', count: 3, level: 1 },
      { every: 2, kind: 'choco', count: 2 }]);
    eq(b.hp, 660);
    ok(/Wolkira/.test(l.intro + l.win), 'w6-10 is about Wolkira');
  });

  t('story: world 6 gives two Feentausch and ends with the nine splinters', function () {
    var w = RS.Worlds.get(6);
    var intro = w.intro.join(' ');
    ok(/Feentausch/.test(intro), 'intro names the Feentausch');
    ok(/schenke/.test(intro) && /zwei/.test(intro), 'intro announces the gift of two');
    ok(/Wolkira/.test(intro), 'intro names the boss');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Blau/.test(scenes) && /Orange/.test(scenes), 'Annika names both weak colours');
    ok(/Feentausch/.test(scenes), 'Annika suggests the Feentausch in the fight');
    var end = w.chapterEnd.join(' ');
    ok(/neun/.test(end), 'the crown needs nine splinters');
    ok(/Sternenkrone|Krone/.test(end), 'chapter end speaks of the crown');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });

  // ---------- Welt 7: Knallhafen ----------

  t('levels: world 7 holds w7-01..w7-10 and brings the Knallbonbons', function () {
    var w = RS.Worlds.get(7);
    ok(w, 'world 7 registered');
    eq(w.key, 'knallhafen');
    eq(w.name, 'Knallhafen');
    RS.assert.deepEqual(w.novelty, { kind: 'mechanic', key: 'fuse' });
    eq(w.gateLocked, 'Besiege Kapitän Knallfrosch, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(7);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w7-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id); });
    eq(RS.Worlds.level('w7-10').colors, 6, 'the boss fights with six colours');
  });

  t('levels: every w7 level has Knallbonbons, early ones with more time', function () {
    var lastStart = 99;
    RS.Worlds.inWorld(7).forEach(function (l) {
      if (l.isBoss) { return; }
      var placed = count(l.layout.join(''), 'F');
      ok(l.fuses, 'fuse rule in ' + l.id);
      ok(placed > 0 || l.fuses.spawnEvery > 0, 'Knallbonbons in ' + l.id);
      ok(l.fuses.start >= 8 && l.fuses.start <= 12, 'start 8..12 in ' + l.id);
      ok(l.fuses.start <= lastStart, 'start does not rise in ' + l.id);
      lastStart = l.fuses.start;
      var spawnOk = l.fuses.spawnEvery >= 3 && l.fuses.spawnEvery <= 6;
      ok(spawnOk || (l.pos === 1 && l.fuses.spawnEvery === 0), 'spawnEvery 3..6 in ' + l.id);
      var s = RS.Session.startLevel(l);
      var onBoard = 0;
      s.board.candies.forEach(function (row) {
        row.forEach(function (c) {
          if (c && c.fuse !== undefined) { onBoard++; eq(c.fuse, l.fuses.start, 'counter in ' + l.id); }
        });
      });
      eq(onBoard, placed, 'layout Knallbonbons start on the board in ' + l.id);
    });
  });

  t('levels: w7-01 introduces Knallbonbons with a fuse goal and at least 15 moves', function () {
    var l = RS.Worlds.level('w7-01');
    ok(l.moves >= 15, 'at least 15 moves in w7-01');
    ok(l.goals.some(function (g) { return g.type === 'fuse'; }), 'fuse goal in w7-01');
    ok(/Knallbonbon/.test(l.intro), 'intro names the Knallbonbons');
  });

  t('levels: w7 fuse goals fit the supply, other levels carry the fuses as a threat', function () {
    var kinds = {};
    RS.Worlds.inWorld(7).forEach(function (l) {
      if (l.isBoss) { return; }
      var fuse = l.goals.filter(function (g) { return g.type === 'fuse'; })[0];
      if (fuse) {
        kinds.goal = true;
        var spawned = l.fuses.spawnEvery ? Math.floor((l.moves - 1) / l.fuses.spawnEvery) : 0;
        ok(fuse.target > 0 && fuse.target <= count(l.layout.join(''), 'F') + spawned, 'fuse goal fits in ' + l.id);
        if (l.pos >= 2) { ok(l.goals.length >= 2, 'a goal beside the fuse goal in ' + l.id); }
      } else {
        kinds.threat = true;
      }
    });
    ok(kinds.goal, 'fuse goals in world 7');
    ok(kinds.threat, 'fuse threats in world 7');
  });

  t('levels: w7-02..w7-09 mix Knallbonbons with every known obstacle and goal', function () {
    var kinds = {};
    RS.Worlds.inWorld(7).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZR]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      if (/R/.test(text)) { kinds.cherry = true; }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'cherry',
      'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score', 'goal cherry', 'goal fuse']
      .forEach(function (k) { ok(kinds[k], k + ' in world 7'); });
  });

  t('levels: boss w7-10 is Kapitän Knallfrosch with Knallbonbons, then Knallbonbons and crates', function () {
    var l = RS.Worlds.level('w7-10');
    eq(l.boss, 'knallfrosch');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.knallfrosch;
    eq(b.name, 'Kapitän Knallfrosch');
    RS.assert.deepEqual(b.weak, [5, 1]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'fuse', count: 2, level: 7 },
      [{ every: 2, kind: 'fuse', count: 2, level: 5 }, { kind: 'crate', count: 2, level: 1 }]]);
    eq(b.hp, 700);
    ok(/Knallfrosch/.test(l.intro + l.win), 'w7-10 is about Knallfrosch');
  });

  t('story: world 7 explains the countdown and ends with the sea chart', function () {
    var w = RS.Worlds.get(7);
    var intro = w.intro.join(' ');
    ok(/Knallbonbon/.test(intro), 'intro names the Knallbonbons');
    ok(/Zähler/.test(intro), 'intro explains the countdown');
    ok(/null/.test(intro), 'intro tells that a counter at zero loses');
    ok(/\+5 Züge/.test(intro), 'intro tells that +5 Züge helps the fuses');
    ok(/Knallfrosch/.test(intro), 'intro names the boss');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Orange/.test(scenes) && /Gelb/.test(scenes), 'Annika names both weak colours');
    var end = w.chapterEnd.join(' ');
    ok(/Seekarte/.test(end), 'Knallfrosch hands over the sea chart');
    ok(/Bitterburg/.test(end), 'the chart leads to the Bitterburg');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });

  // ---------- Welt 8: Marzipanschloss ----------

  t('levels: world 8 holds w8-01..w8-10 and brings the Regenbogenstaub', function () {
    var w = RS.Worlds.get(8);
    ok(w, 'world 8 registered');
    eq(w.key, 'marzipan');
    eq(w.name, 'Marzipanschloss');
    RS.assert.deepEqual(w.novelty, { kind: 'joker', key: 'regenbogen' });
    eq(w.gateLocked, 'Besiege Ritter Mandelbart, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(8);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w8-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id); });
    eq(RS.Worlds.level('w8-10').colors, 6, 'the boss fights with six colours');
  });

  t('levels: w8-01 invites the Regenbogenstaub with a one-colour collect goal', function () {
    var l = RS.Worlds.level('w8-01');
    ok(l.moves >= 15, 'at least 15 moves in w8-01');
    var collect = l.goals.filter(function (g) { return g.type === 'collect'; });
    eq(collect.length, 1, 'one collect goal in w8-01');
    eq(l.goals.length, 1, 'the colour is the only goal');
    ok(/Regenbogenstaub/.test(l.intro), 'intro names the Regenbogenstaub');
  });

  t('levels: w8-02..w8-09 mix every known mechanic and goal', function () {
    var kinds = {};
    RS.Worlds.inWorld(8).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZRF]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      if (/R/.test(text)) { kinds.cherry = true; }
      if (/F/.test(text)) { kinds.fuse = true; ok(l.fuses, 'fuse rule in ' + l.id); }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'cherry', 'fuse',
      'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score', 'goal cherry', 'goal fuse']
      .forEach(function (k) { ok(kinds[k], k + ' in world 8'); });
  });

  t('levels: boss w8-10 is Ritter Mandelbart with crates, then thick glaze', function () {
    var l = RS.Worlds.level('w8-10');
    eq(l.boss, 'mandelbart');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.mandelbart;
    eq(b.name, 'Ritter Mandelbart');
    RS.assert.deepEqual(b.weak, [1, 4]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'crate', count: 3, level: 2 },
      { every: 2, kind: 'glaze', count: 4, level: 2 }]);
    eq(b.hp, 770);
    ok(/Mandelbart/.test(l.intro + l.win), 'w8-10 is about Mandelbart');
  });

  t('story: world 8 gives two Regenbogenstaub and tells where Amarus comes from', function () {
    var w = RS.Worlds.get(8);
    var intro = w.intro.join(' ');
    ok(/Regenbogenstaub/.test(intro), 'intro names the Regenbogenstaub');
    ok(/Farbe/.test(intro), 'intro tells that it clears one colour');
    ok(/schenke/.test(intro) && /zwei/.test(intro), 'intro announces the gift of two');
    ok(/Mandelbart/.test(intro), 'intro names the boss');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Gelb/.test(scenes) && /Violett/.test(scenes), 'Annika names both weak colours');
    ok(/Regenbogenstaub/.test(scenes), 'Annika suggests the Regenbogenstaub in the fight');
    var end = w.chapterEnd.join(' ');
    ok(/Amarus/.test(end), 'chapter end names Amarus');
    ok(/Zuckerfee/.test(end) && /Schüler/.test(end), 'Amarus was a pupil of the Zuckerfeen');
    ok(/Süße/.test(end) && /verlor/.test(end), 'Amarus lost his sweetness');
    ok(/Sternsplitter/.test(end), 'chapter end hands over the Sternsplitter');
  });

  // ---------- Welt 9: Schillerbucht ----------

  t('levels: world 9 holds w9-01..w9-10 and brings the chameleons', function () {
    var w = RS.Worlds.get(9);
    ok(w, 'world 9 registered');
    eq(w.key, 'schillerbucht');
    eq(w.name, 'Schillerbucht');
    RS.assert.deepEqual(w.novelty, { kind: 'mechanic', key: 'chameleon' });
    eq(w.gateLocked, 'Besiege die Seeschlange Schillerzahn, um das Tor zu öffnen.');
    var lv = RS.Worlds.inWorld(9);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w9-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id); });
    eq(RS.Worlds.level('w9-10').colors, 6, 'the boss fights with six colours');
  });

  t('levels: every w9 level has chameleons together with a collect goal', function () {
    RS.Worlds.inWorld(9).forEach(function (l) {
      if (l.isBoss) { return; }
      var placed = count(l.layout.join(''), 'H');
      var rule = l.chameleons;
      ok(placed > 0 || (rule && rule.spawnEvery > 0), 'chameleons in ' + l.id);
      if (rule) { ok(rule.spawnEvery >= 3 && rule.spawnEvery <= 6, 'spawnEvery 3..6 in ' + l.id); }
      ok(l.goals.some(function (g) { return g.type === 'collect'; }), 'collect goal in ' + l.id);
      var s = RS.Session.startLevel(l);
      var onBoard = 0;
      s.board.candies.forEach(function (row) { row.forEach(function (c) { if (c && c.chameleon) { onBoard++; } }); });
      eq(onBoard, placed, 'layout chameleons start on the board in ' + l.id);
    });
  });

  t('levels: w9-01 introduces chameleons with at least 15 moves', function () {
    var l = RS.Worlds.level('w9-01');
    ok(l.moves >= 15, 'at least 15 moves in w9-01');
    ok(/H/.test(l.layout.join('')), 'chameleons on the first board');
    ok(/Chamäleon/.test(l.intro), 'intro names the chameleons');
  });

  t('levels: w9-02..w9-09 mix chameleons with every known mechanic and goal', function () {
    var kinds = {};
    RS.Worlds.inWorld(9).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZRF]/.test(text), 'obstacles in ' + l.id);
      if (/[12K]/.test(text)) { kinds.glaze = true; }
      if (/[LK]/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      if (/R/.test(text)) { kinds.cherry = true; ok(l.cherries, 'cherry rule in ' + l.id); }
      if (/F/.test(text)) { kinds.fuse = true; ok(l.fuses, 'fuse rule in ' + l.id); }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'cherry', 'fuse',
      'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score', 'goal cherry', 'goal fuse']
      .forEach(function (k) { ok(kinds[k], k + ' in world 9'); });
  });

  t('levels: boss w9-10 is Schillerzahn with chameleons, then chameleons and ice', function () {
    var l = RS.Worlds.level('w9-10');
    eq(l.boss, 'schillerzahn');
    eq(l.moves, 40);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.schillerzahn;
    eq(b.name, 'Seeschlange Schillerzahn');
    RS.assert.deepEqual(b.weak, [2, 3]);
    RS.assert.deepEqual(b.thresholds, [0.5]);
    RS.assert.deepEqual(b.attacks, [
      { every: 3, kind: 'chameleon', count: 3 },
      [{ every: 2, kind: 'chameleon', count: 2 }, { kind: 'ice', count: 2, level: 2 }]]);
    eq(b.hp, 990);
    ok(/Schillerzahn/.test(l.intro + l.win), 'w9-10 is about Schillerzahn');
  });

  t('story: world 9 explains the chameleons and ends with the Sternenkrone', function () {
    var w = RS.Worlds.get(9);
    var intro = w.intro.join(' ');
    ok(/Chamäleon/.test(intro), 'intro names the chameleons');
    ok(/Farbe/.test(intro) && /jedem Zug/.test(intro), 'intro tells that they change colour after every move');
    ok(/gerade zeigt/.test(intro), 'intro tells that they count for the colour they show');
    ok(/Schillerzahn/.test(intro), 'intro names the boss');
    var story = w.boss.story;
    var introScenes = story.intro.map(function (l) { return l.text; }).join(' ');
    var phase2Scenes = story.phase2.map(function (l) { return l.text; }).join(' ');
    ok(/Grün/.test(introScenes) && !/Blau/.test(introScenes), 'the intro names Grün, the weak colour of phase 1');
    ok(/Blau/.test(phase2Scenes) && !/Grün/.test(phase2Scenes), 'phase 2 names Blau, the weak colour of phase 2');
    var end = w.chapterEnd.join(' ');
    ok(/letzte Sternsplitter|letzten Sternsplitter/.test(end), 'Schillerzahn guarded the last splinter');
    ok(/Seeweg/.test(end), 'Schillerzahn guarded the sea route');
    ok(/neun/.test(end) && /Sternenkrone/.test(end), 'Annika forms the crown from nine splinters');
    ok(/Annika/.test(end), 'Annika forms the crown');
  });

  // ---------- Welt 10: Bitterburg (Finale) ----------

  t('levels: world 10 holds w10-01..w10-10 and brings the Zauberbombe', function () {
    var w = RS.Worlds.get(10);
    ok(w, 'world 10 registered');
    eq(w.key, 'bitterburg');
    eq(w.name, 'Bitterburg');
    RS.assert.deepEqual(w.novelty, { kind: 'joker', key: 'zauberbombe' });
    eq(w.gateLocked, 'Besiege Bitterkönig Amarus, um das Spiel zu vollenden.');
    eq(w.id, RS.Worlds.FINAL_WORLD, 'the Bitterburg is the final world');
    var lv = RS.Worlds.inWorld(10);
    eq(lv.length, 10);
    lv.forEach(function (l, i) { eq(l.id, 'w10-' + (i < 9 ? '0' : '') + (i + 1)); });
    lv.forEach(function (l) { ok(l.colors === 5 || l.colors === 6, 'colors of ' + l.id); });
    eq(RS.Worlds.level('w10-10').colors, 6, 'the finale fights with six colours');
  });

  // Größte Zahl an Hindernisfeldern in einem 3 × 3-Ausschnitt (so viel trifft eine Zauberbombe).
  function densestBlock(layout) {
    var best = 0;
    for (var r = 0; r <= 5; r++) {
      for (var c = 0; c <= 5; c++) {
        var n = 0;
        for (var dr = 0; dr < 3; dr++) {
          for (var dc = 0; dc < 3; dc++) { if (/[12KLIJCXYZ]/.test(layout[r + dr][c + dc])) { n++; } }
        }
        best = Math.max(best, n);
      }
    }
    return best;
  }

  t('levels: w10-01 invites the Zauberbombe with dense obstacle clusters', function () {
    var l = RS.Worlds.level('w10-01');
    ok(l.moves >= 15, 'at least 15 moves in w10-01');
    ok(densestBlock(l.layout) >= 6, 'a 3x3 block with at least six obstacles in w10-01');
    ok(/Zauberbombe/.test(l.intro), 'intro names the Zauberbombe');
  });

  t('levels: w10-02..w10-09 combine every mechanic and goal of the game', function () {
    var kinds = {};
    RS.Worlds.inWorld(10).forEach(function (l) {
      if (l.isBoss || l.pos < 2) { return; }
      var text = l.layout.join('');
      ok(/[12KLIJCXYZRF]/.test(text), 'obstacles in ' + l.id);
      ok(densestBlock(l.layout) >= 4, 'an obstacle cluster for the Zauberbombe in ' + l.id);
      if (/[12]/.test(text)) { kinds.glaze = true; }
      if (/L/.test(text)) { kinds.lock = true; }
      if (/[IJ]/.test(text)) { kinds.ice = true; }
      if (/C/.test(text)) { kinds.choco = true; }
      if (/[XYZ]/.test(text)) { kinds.crate = true; }
      if (/R/.test(text)) { kinds.cherry = true; ok(l.cherries, 'cherry rule in ' + l.id); }
      if (/F/.test(text)) { kinds.fuse = true; ok(l.fuses, 'fuse rule in ' + l.id); }
      if (/H/.test(text) || l.chameleons) { kinds.chameleon = true; }
      l.goals.forEach(function (g) { kinds['goal ' + g.type] = true; });
    });
    ['glaze', 'lock', 'ice', 'choco', 'crate', 'cherry', 'fuse', 'chameleon',
      'goal crate', 'goal collect', 'goal glaze', 'goal choco', 'goal score', 'goal cherry', 'goal fuse']
      .forEach(function (k) { ok(kinds[k], k + ' in world 10'); });
  });

  t('levels: finale w10-10 is Bitterkönig Amarus with three phases of double attacks', function () {
    var l = RS.Worlds.level('w10-10');
    eq(l.boss, 'amarus');
    eq(l.moves, 50);
    RS.assert.deepEqual(l.goals, [{ type: 'boss' }]);
    var b = RS.BOSSES.amarus;
    eq(b.name, 'Bitterkönig Amarus');
    RS.assert.deepEqual(b.weak, [4, 0, 3]);
    RS.assert.deepEqual(b.thresholds, [0.66, 0.33]);
    RS.assert.deepEqual(b.attacks, [
      [{ every: 3, kind: 'lock', count: 3 }, { every: 3, kind: 'ice', count: 2, level: 2 }],
      [{ every: 2, kind: 'crate', count: 3, level: 2 }, { every: 2, kind: 'choco', count: 2 }],
      [{ every: 2, kind: 'fuse', count: 2, level: 6 }, { every: 2, kind: 'chameleon', count: 2 }]]);
    eq(b.hp, 1015);
    ok(/Amarus/.test(l.intro + l.win), 'w10-10 is about Amarus');
  });

  t('story: world 10 gives two Zauberbomben, and Amarus gets his sweetness back', function () {
    var w = RS.Worlds.get(10);
    var intro = w.intro.join(' ');
    ok(/Zauberbombe/.test(intro), 'intro names the Zauberbombe');
    ok(/drei mal drei/.test(intro), 'intro tells that it clears three by three cells');
    ok(/schenke/.test(intro) && /zwei/.test(intro), 'intro announces the gift of two');
    ok(/Amarus/.test(intro) && /Sternenkrone/.test(intro), 'Annika arrives at the castle of Amarus with the crown');
    var s = w.boss.story;
    ok(s.phase2 && s.phase3, 'three phases of story');
    var scenes = bossLines(w).map(function (l) { return l.text; }).join(' ');
    ok(/Violett/.test(scenes) && /Rot/.test(scenes) && /Blau/.test(scenes), 'Annika names all three weak colours');
    var defeat = s.defeat.map(function (l) { return l.text; }).join(' ');
    ok(/Süße/.test(defeat), 'Amarus gets his sweetness back in the defeat');
    ok(!/vernichtet|zerstört/.test(defeat), 'Amarus is redeemed, not destroyed');
    var end = w.chapterEnd.join(' ');
    ok(w.chapterEnd.length >= 2 && w.chapterEnd.length <= 3, 'two or three lines of chapter end');
    ok(/Amarus/.test(end) && /Süße/.test(end), 'Amarus has his sweetness back');
    ok(/alle(n)? Welten/.test(end), 'all worlds shine again');
  });
})(window.RS = window.RS || {});
