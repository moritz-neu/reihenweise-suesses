(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  function testWorld(ids) {
    var levels = ids.map(function (id) {
      return { id: id, colors: 5, moves: 20, goals: [{ type: 'score', target: 1000 }], layout: ALL, intro: 'Los!', win: 'Geschafft!' };
    });
    levels.push({ id: 'w99-boss', boss: true, colors: 6, moves: 30, layout: ALL, intro: 'Boss!', win: 'Besiegt!' });
    return {
      id: 99, key: 'test', name: 'Testwelt', novelty: null,
      intro: ['a', 'b', 'c', 'd'], chapterEnd: ['x', 'y'], gateLocked: 'zu',
      boss: { key: 'testboss', name: 'Testboss', hp: 100, weak: [0, 1], thresholds: [0.5], attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }],
        story: { intro: [{ who: 'boss', text: 'Hi' }], phase2: [{ who: 'boss', text: 'Au' }], defeat: [{ who: 'boss', text: 'Autsch' }] } },
      levels: levels
    };
  }

  // A test that registers the temporary world 99 always removes it again, even when it fails.
  function t99(name, fn) {
    t(name, function () {
      try { fn(); } finally {
        if (RS.Worlds.get(99)) { RS.Worlds._unregister(99); }
      }
    });
  }

  t('registry: ids unique and well-formed', function () {
    var seen = {};
    RS.Worlds.levels().forEach(function (l) {
      ok(/^w\d+-\d{2}[a-z]?(-\d{2})?$/.test(l.id), 'format ' + l.id);
      ok(!seen[l.id], 'duplicate ' + l.id);
      seen[l.id] = true;
    });
  });

  t('registry: the 100 old ids follow w<world>-<two digit position> and the boss is wN-10', function () {
    var expected = [];
    for (var w = 1; w <= 10; w++) {
      for (var p = 1; p <= 10; p++) { expected.push('w' + w + '-' + (p < 10 ? '0' : '') + p); }
    }
    RS.assert.deepEqual(RS.Worlds.levels().filter(function (l) { return !l.step; }).map(function (l) { return l.id; }), expected);
    for (var n = 1; n <= 10; n++) {
      var lv = RS.Worlds.inWorld(n);
      eq(lv[lv.length - 1].id, 'w' + n + '-10', 'last level of world ' + n);
      eq(lv[lv.length - 1].isBoss, true, 'boss of world ' + n);
      eq(RS.Worlds.level('w' + n + '-10').isBoss, true, 'boss flag w' + n + '-10');
    }
  });

  t('registry: boss last in every world', function () {
    RS.Worlds.list().forEach(function (w) {
      var lv = RS.Worlds.inWorld(w.id);
      var bosses = lv.filter(function (l) { return l.isBoss; });
      eq(bosses.length, 1, 'one boss in world ' + w.id);
      eq(bosses[0].pos, lv.length, 'boss is last in world ' + w.id);
    });
  });

  t('registry: worlds 1-2 keep their content', function () {
    RS.assert.deepEqual(RS.Worlds.level('w1-03').goals, [{ type: 'collect', color: 0, target: 25 }]);
    eq(RS.Worlds.level('w2-06').layout[2], 'xCCCCCCx');
    eq(RS.Worlds.level('w1-01').seed, 1001);
    eq(RS.Worlds.level('w2-10').seed, 1020);
    eq(RS.Worlds.level('w1-10').boss, 'lakritz');
    eq(RS.Worlds.level('w2-10').boss, 'kandara');
    RS.assert.deepEqual(RS.Worlds.level('w1-10').goals, [{ type: 'boss' }]);
    eq(RS.BOSSES.kandara.hp, 625);
  });

  t('registry: num and pos', function () {
    eq(RS.Worlds.level('w2-01').num, RS.Worlds.inWorld(1).length + 1);
    eq(RS.Worlds.level('w2-01').pos, 1);
    eq(RS.Worlds.level('w2-01').world, 2);
    eq(RS.Worlds.level('nope'), undefined);
    eq(RS.Worlds.get(11), undefined);
    eq(RS.Worlds.FINAL_WORLD, 10);
  });

  t('registry: story complete', function () {
    RS.Worlds.levels().forEach(function (l) {
      ok(l.intro && l.intro.length > 0, 'intro ' + l.id);
      ok(l.win && l.win.length > 0, 'win ' + l.id);
    });
    RS.Worlds.list().forEach(function (w) {
      eq(w.intro.length, 4, 'intro lines world ' + w.id);
      ok(w.chapterEnd.length >= 2 && w.chapterEnd.length <= 3, 'chapterEnd lines world ' + w.id);
      ok(w.gateLocked, 'gateLocked world ' + w.id);
      ok(w.boss.story.intro.length > 0, 'story.intro world ' + w.id);
      ok(w.boss.story.defeat.length > 0, 'story.defeat world ' + w.id);
      w.boss.thresholds.forEach(function (th, i) {
        ok(w.boss.story['phase' + (i + 2)], 'story.phase' + (i + 2) + ' world ' + w.id);
      });
    });
  });

  t99('registry: inserted level', function () {
    var ids = ['w99-01', 'w99-01b', 'w99-02'];
    RS.Worlds.register(testWorld(ids));
    var first = RS.Worlds.inWorld(99).map(function (l) { return [l.pos, l.seed]; });
    eq(first[0][0], 1); eq(first[1][0], 2); eq(first[2][0], 3);
    var before = RS.Worlds.levels().filter(function (l) { return l.world < 99; }).length;
    eq(RS.Worlds.level('w99-01b').num, before + 2);
    ok(first[0][1] > 1000);
    RS.Worlds._unregister(99);
    eq(RS.Worlds.get(99), undefined);
    eq(RS.BOSSES.testboss, undefined);
    RS.Worlds.register(testWorld(ids));
    var second = RS.Worlds.inWorld(99).map(function (l) { return [l.pos, l.seed]; });
    RS.Worlds._unregister(99);
    RS.assert.deepEqual(second, first);
  });

  function extra(id) {
    return { id: id, colors: 5, moves: 18, goals: [{ type: 'score', target: 900 }], layout: ALL, intro: 'Zwischen!', win: 'Gut!' };
  }

  t99('registry: insert places intermediate levels after their old level, the boss stays last', function () {
    RS.Worlds.register(testWorld(['w99-01', 'w99-02']));
    RS.Worlds.insert(99, [extra('w99-01-02'), extra('w99-02-01'), extra('w99-01-01')]);
    var lv = RS.Worlds.inWorld(99);
    RS.assert.deepEqual(lv.map(function (l) { return l.id; }), ['w99-01', 'w99-01-01', 'w99-01-02', 'w99-02', 'w99-02-01', 'w99-boss']);
    RS.assert.deepEqual(lv.map(function (l) { return l.pos; }), [1, 2, 3, 4, 5, 6]);
    RS.assert.deepEqual(lv.map(function (l) { return l.slot + '/' + l.step; }), ['1/0', '1/1', '1/2', '2/0', '2/1', '3/0']);
    eq(lv[2].label, '99-3');
    eq(lv[5].isBoss, true);
    eq(lv[5].slots, 3);
    eq(RS.Worlds.level('w99-01-02').world, 99);
    ok(RS.Worlds.level('w99-01-02').seed > 1000);
    eq(RS.Worlds.level('w99-01-02').num, RS.Worlds.level('w99-01').num + 2);
  });

  t99('registry: insert rejects bad ids, a boss parent, duplicates and an unknown world', function () {
    RS.Worlds.register(testWorld(['w99-01', 'w99-02']));
    RS.assert.throws(function () { RS.Worlds.insert(99, [extra('w99-01x')]); });
    RS.assert.throws(function () { RS.Worlds.insert(99, [extra('w99-07-01')]); });
    RS.assert.throws(function () { RS.Worlds.insert(99, [extra('w99-boss-01')]); });
    RS.assert.throws(function () { RS.Worlds.insert(99, [extra('w99-01-01'), extra('w99-01-01')]); });
    RS.assert.throws(function () { RS.Worlds.insert(98, [extra('w98-01-01')]); });
    var bad = extra('w99-01-01');
    delete bad.intro;
    RS.assert.throws(function () { RS.Worlds.insert(99, [bad]); });
    eq(RS.Worlds.inWorld(99).length, 3, 'nothing inserted');
  });

  t99('registry: unregister drops the intermediate levels and the list is rebuilt', function () {
    RS.Worlds.register(testWorld(['w99-01']));
    RS.Worlds.insert(99, [extra('w99-01-01')]);
    eq(RS.Worlds.inWorld(99).length, 3);
    RS.Worlds._unregister(99);
    eq(RS.Worlds.level('w99-01-01'), undefined);
    RS.Worlds.register(testWorld(['w99-01']));
    eq(RS.Worlds.inWorld(99).length, 2);
  });

  t('registry: the level list is cached between calls', function () {
    ok(RS.Worlds.levels() === RS.Worlds.levels());
  });

  t('curve: intermediate levels lie between their old neighbours', function () {
    eq(RS.Curve.target({ world: 3, slot: 1, step: 5, slots: 10, pos: 6 }), 79.5);
    eq(RS.Curve.target({ world: 1, slot: 9, step: 10, slots: 10, pos: 99 }), 78.5);
    eq(RS.Curve.target({ world: 1, slot: 9, step: 0, slots: 10, pos: 89 }), 86);
    eq(RS.Curve.target({ world: 10, slot: 10, step: 0, slots: 10, pos: 100, isBoss: true }), 22);
  });

  t('registry: world 5 follows world 4 and opens after w4-10', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(4) >= 0 && ids.indexOf(5) === ids.indexOf(4) + 1, 'world 5 right after world 4');
    eq(RS.Worlds.level('w5-01').num, RS.Worlds.level('w4-10').num + 1);
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 4 && !l.isBoss) { s.stars[l.id] = 1; } });
    eq(RS.Progress.isWorldOpen(s, 5), false, 'world 5 waits for w4-10');
    s.stars['w4-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 5), true);
    eq(RS.Progress.isPlayable(s, 'w5-01'), true);
  });

  t('registry: world 6 follows world 5 and opens after w5-10', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(5) >= 0 && ids.indexOf(6) === ids.indexOf(5) + 1, 'world 6 right after world 5');
    eq(RS.Worlds.level('w6-01').num, RS.Worlds.level('w5-10').num + 1);
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 5 && !l.isBoss) { s.stars[l.id] = 1; } });
    ['w1-10', 'w2-10', 'w3-10', 'w4-10'].forEach(function (id) { s.stars[id] = 1; });
    eq(RS.Progress.isWorldOpen(s, 6), false, 'world 6 waits for w5-10');
    s.stars['w5-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 6), true);
    eq(RS.Progress.isPlayable(s, 'w6-01'), true);
  });

  t('registry: world 7 follows world 6 and opens after w6-10', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(6) >= 0 && ids.indexOf(7) === ids.indexOf(6) + 1, 'world 7 right after world 6');
    eq(RS.Worlds.level('w7-01').num, RS.Worlds.level('w6-10').num + 1);
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 6 && l.id !== 'w6-10') { s.stars[l.id] = 1; } });
    eq(RS.Progress.isWorldOpen(s, 7), false, 'world 7 waits for w6-10');
    s.stars['w6-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 7), true);
    eq(RS.Progress.isPlayable(s, 'w7-01'), true);
  });

  t('registry: world 8 follows world 7 and opens after w7-10', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(7) >= 0 && ids.indexOf(8) === ids.indexOf(7) + 1, 'world 8 right after world 7');
    eq(RS.Worlds.level('w8-01').num, RS.Worlds.level('w7-10').num + 1);
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 7 && l.id !== 'w7-10') { s.stars[l.id] = 1; } });
    eq(RS.Progress.isWorldOpen(s, 8), false, 'world 8 waits for w7-10');
    s.stars['w7-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 8), true);
    eq(RS.Progress.isPlayable(s, 'w8-01'), true);
  });

  t('registry: world 9 follows world 8 and opens after w8-10', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(8) >= 0 && ids.indexOf(9) === ids.indexOf(8) + 1, 'world 9 right after world 8');
    eq(RS.Worlds.level('w9-01').num, RS.Worlds.level('w8-10').num + 1);
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 8 && l.id !== 'w8-10') { s.stars[l.id] = 1; } });
    eq(RS.Progress.isWorldOpen(s, 9), false, 'world 9 waits for w8-10');
    s.stars['w8-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 9), true);
    eq(RS.Progress.isPlayable(s, 'w9-01'), true);
  });

  t('registry: world 10 follows world 9, opens after w9-10 and is the final world', function () {
    var ids = RS.Worlds.list().map(function (w) { return w.id; });
    ok(ids.indexOf(9) >= 0 && ids.indexOf(10) === ids.indexOf(9) + 1, 'world 10 right after world 9');
    eq(ids[ids.length - 1], RS.Worlds.FINAL_WORLD, 'no world after the final one');
    eq(RS.Worlds.level('w10-01').num, RS.Worlds.level('w9-10').num + 1);
    eq(RS.Worlds.levels().length, 1000, 'ten worlds of 100 levels');
    var s = RS.Save.fresh();
    RS.Worlds.levels().forEach(function (l) { if (l.world <= 9 && l.id !== 'w9-10') { s.stars[l.id] = 1; } });
    eq(RS.Progress.isWorldOpen(s, 10), false, 'world 10 waits for w9-10');
    s.stars['w9-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 10), true);
    eq(RS.Progress.isPlayable(s, 'w10-01'), true);
  });

  t99('registry: register validates', function () {
    var def = testWorld(['w99-01']);
    delete def.gateLocked;
    RS.assert.throws(function () { RS.Worlds.register(def); });
    eq(RS.Worlds.get(99), undefined);
  });

  t('registry: every world has valid music', function () {
    var list = RS.Worlds.list();
    ok(list.length >= 4, 'worlds registered');
    list.forEach(function (w) {
      ok(w.music, 'music world ' + w.id);
      ok(RS.Worlds.validMusic(w.music), 'valid music world ' + w.id);
    });
    var key = function (m) { return [m.tempo, m.root, m.scale.join(','), m.lead].join('|'); };
    var keys = list.map(function (w) { return key(w.music); });
    keys.forEach(function (k, i) { eq(keys.indexOf(k), i, 'distinct motif world ' + list[i].id); });
  });

  t99('registry: register rejects invalid music', function () {
    var def = testWorld(['w99-01']);
    def.music = { tempo: 300, root: 60, scale: [0, 2, 4, 5, 7], lead: 'bell', bass: null, drums: 'k...............',
      melodies: [[0], [1]] };
    RS.assert.throws(function () { RS.Worlds.register(def); });
    eq(RS.Worlds.get(99), undefined);
  });

  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }

  t('mapkit: stations keeps the route when the count matches', function () {
    var route = [[0, 0], [100, 40], [200, 0]];
    eq(RS.UI.MapKit.stations(route, 3), route);
  });

  t('mapkit: stations spreads n points at equal arc length', function () {
    var K = RS.UI.MapKit;
    var line = K.stations([[0, 0], [100, 0]], 3);
    eq(line.length, 3);
    line.forEach(function (p, i) {
      ok(Math.abs(p[0] - i * 50) < 0.5 && Math.abs(p[1]) < 0.5, 'point ' + i + ' ' + p);
    });
    var route = [[95, 560], [255, 525], [415, 565], [580, 530], [745, 485], [880, 365]];
    var pts = K.stations(route, 12);
    eq(pts.length, 12);
    RS.assert.deepEqual(pts[0], route[0]);
    RS.assert.deepEqual(pts[11], route[5]);
    var gaps = [];
    for (var i = 1; i < pts.length; i++) { gaps.push(dist(pts[i - 1], pts[i])); }
    var mean = gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length;
    gaps.forEach(function (g) { ok(Math.abs(g - mean) / mean < 0.05, 'even gap ' + g + ' vs ' + mean); });
  });

  t('world art: every registered world has layouts, gates, houses and a boss figure', function () {
    RS.Worlds.list().forEach(function (w) {
      var art = RS.UI.WorldArt.get(w.id);
      ok(art, 'art for world ' + w.id);
      ['wide', 'tall'].forEach(function (k) {
        var layout = art.layouts[k];
        ok(layout && layout.w > 0 && layout.h > 0, k + ' size world ' + w.id);
        ok(layout.route.length >= 2, k + ' route world ' + w.id);
        ok(layout.gate, k + ' gate world ' + w.id);
        if (w.id >= 2) { ok(layout.backGate, k + ' back gate world ' + w.id); }
        eq(K0(art.backdrop(layout)), '<svg', 'backdrop ' + k + ' world ' + w.id);
        eq(K0(art.foreground(layout, { path: layout.route, lit: layout.route.slice(0, 2), crystalLit: true })), '<svg');
      });
      eq(K0(art.house(0)), '<svg', 'house world ' + w.id);
      eq(K0(art.gate('closed')), '<svg', 'gate world ' + w.id);
      eq(K0(art.bossFigure()), '<svg', 'boss figure world ' + w.id);
    });
  });

  function K0(svg) { return String(svg).slice(0, 4); }

  t('curve: spec table', function () {
    var C = RS.Curve;
    eq(C.TOLERANCE, 5);
    eq(C.target(RS.Worlds.level('w1-01')), 90);
    eq(C.target(RS.Worlds.level('w1-09')), 86);
    eq(C.target(RS.Worlds.level('w1-10')), 78);
    eq(C.target(RS.Worlds.level('w2-01')), 83.5);
    eq(C.target(RS.Worlds.level('w2-10')), 72);
    eq(C.target({ world: 3, pos: 1, isBoss: false }), 82);
    eq(C.target({ world: 3, pos: 9, isBoss: false }), 73);
    eq(C.target({ world: 10, pos: 10, isBoss: true }), 22);
  });
  t99('registry: register rejects a boss whose phases do not match weak and attacks', function () {
    var def = testWorld(['w99-01']);
    def.boss.thresholds = [0.66, 0.33];
    def.boss.weak = [0, 1, 2];
    def.boss.attacks = [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }];
    def.boss.story.phase3 = [{ who: 'boss', text: 'Noch mal' }];
    RS.assert.throws(function () { RS.Worlds.register(def); });
    eq(RS.Worlds.get(99), undefined);
    def.boss.attacks.push({ kind: 'lock', count: 2, every: 2 });
    def.boss.weak = [0, 1];
    RS.assert.throws(function () { RS.Worlds.register(def); });
    eq(RS.Worlds.get(99), undefined);
  });

  t99('registry: a phase may hold an array of attacks, each validated', function () {
    function def3(attacks) {
      var d = testWorld(['w99-01']);
      d.boss.thresholds = [0.5];
      d.boss.attacks = attacks;
      return d;
    }
    var good = [{ kind: 'lock', count: 1, every: 3 },
      [{ kind: 'fuse', count: 2, level: 6, every: 2 }, { kind: 'chameleon', count: 2 }]];
    RS.Worlds.register(def3(good));
    ok(RS.Worlds.get(99), 'array phase accepted');
    RS.Worlds._unregister(99);
  });

  t99('registry: register rejects bad attack entries', function () {
    function bad(attacks) {
      var d = testWorld(['w99-01']);
      d.boss.attacks = attacks;
      RS.assert.throws(function () { RS.Worlds.register(d); });
      eq(RS.Worlds.get(99), undefined);
    }
    var ok1 = { kind: 'lock', count: 1, every: 3 };
    bad([ok1, []]);
    bad([ok1, [{ kind: 'lock', count: 1, every: 0 }]]);
    bad([ok1, { kind: 'lock', count: 1, every: 0 }]);
    bad([ok1, [{ kind: 'zap', count: 1, every: 2 }]]);
    bad([ok1, [{ kind: 'lock', count: 0, every: 2 }]]);
    bad([ok1, [{ kind: 'lock', count: 1.5, every: 2 }]]);
    bad([ok1, [{ kind: 'lock', count: 1, every: 2 }, { kind: 'zap', count: 1 }]]);
  });

})(window.RS = window.RS || {});
