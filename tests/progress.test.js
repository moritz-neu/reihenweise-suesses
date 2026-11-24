(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  function testWorld(worldId, ids) {
    var levels = ids.map(function (id) {
      return { id: id, colors: 5, moves: 20, goals: [{ type: 'score', target: 1000 }], layout: ALL, intro: 'Los!', win: 'Geschafft!' };
    });
    levels.push({ id: 'w' + worldId + '-boss', boss: true, colors: 6, moves: 30, layout: ALL, intro: 'Boss!', win: 'Besiegt!' });
    return {
      id: worldId, key: 'test' + worldId, name: 'Testwelt', novelty: null,
      intro: ['a', 'b', 'c', 'd'], chapterEnd: ['x', 'y'], gateLocked: 'zu',
      boss: { key: 'testboss' + worldId, name: 'Testboss', hp: 100, weak: [0, 1], thresholds: [0.5], attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }],
        story: { intro: [{ who: 'boss', text: 'Hi' }], phase2: [{ who: 'boss', text: 'Au' }], defeat: [{ who: 'boss', text: 'Autsch' }] } },
      levels: levels
    };
  }

  function winWorld(save, worldId) {
    RS.Worlds.inWorld(worldId).forEach(function (l) { save.stars[l.id] = 1; });
  }

  t('progress: first level of world 1 playable on a fresh save', function () {
    var s = RS.Save.fresh();
    eq(RS.Progress.isPlayable(s, 'w1-01'), true);
    eq(RS.Progress.isPlayable(s, 'w1-02'), false);
    eq(RS.Progress.isWorldOpen(s, 1), true);
    eq(RS.Progress.nextLevel(s), 'w1-01');
  });

  t('progress: next level playable after a win', function () {
    var s = RS.Save.fresh();
    s.stars['w1-01'] = 1;
    eq(RS.Progress.isWon(s, 'w1-01'), true);
    eq(RS.Progress.isPlayable(s, 'w1-02'), true);
    eq(RS.Progress.nextLevel(s), 'w1-02');
    s.stars['w1-02'] = 0;
    eq(RS.Progress.isWon(s, 'w1-02'), false, '0 stars is no win');
  });

  t('progress: world 2 opens only after w1-10 won', function () {
    var s = RS.Save.fresh();
    eq(RS.Progress.isWorldOpen(s, 2), false);
    eq(RS.Progress.isPlayable(s, 'w2-01'), false);
    s.stars['w1-09'] = 3;
    eq(RS.Progress.isWorldOpen(s, 2), false);
    s.stars['w1-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 2), true);
    eq(RS.Progress.isPlayable(s, 'w2-01'), true);
    eq(RS.Progress.isWorldOpen(s, 3), false, 'world 3 waits for w2-10');
  });

  t('progress: level after an unwon level is locked', function () {
    var s = RS.Save.fresh();
    s.stars['w1-01'] = 2;
    eq(RS.Progress.isPlayable(s, 'w1-03'), false);
    eq(RS.Progress.isPlayable(s, 'nope'), false);
  });

  t('progress: inserted level never blocks', function () {
    try {
      RS.Worlds.register(testWorld(98, ['w98-01']));
      RS.Worlds.register(testWorld(99, ['w99-01', 'w99-01b', 'w99-02']));
      var s = RS.Save.fresh();
      winWorld(s, 1);
      winWorld(s, 2);
      eq(RS.Progress.isWorldOpen(s, 99), false, 'world 98 boss not won');
      s.stars['w98-01'] = 1;
      s.stars['w98-boss'] = 1;
      eq(RS.Progress.isWorldOpen(s, 99), true);
      s.stars['w99-01'] = 3;
      s.stars['w99-02'] = 1;
      eq(RS.Progress.isPlayable(s, 'w99-01b'), true, 'inserted level is playable');
      eq(RS.Progress.isPlayable(s, 'w99-boss'), true, 'boss stays reachable');
      var s2 = RS.Save.fresh();
      s2.stars['w99-01'] = 3;
      eq(RS.Progress.isPlayable(s2, 'w99-01b'), false, 'world 99 closed');
    } finally {
      if (RS.Worlds.get(99)) { RS.Worlds._unregister(99); }
      if (RS.Worlds.get(98)) { RS.Worlds._unregister(98); }
    }
    eq(RS.Worlds.get(99), undefined);
    eq(RS.Worlds.get(98), undefined);
  });

  t('progress: a later win unlocks a skipped level', function () {
    var s = RS.Save.fresh();
    s.stars['w1-01'] = 3;
    s.stars['w1-03'] = 1;
    eq(RS.Progress.isPlayable(s, 'w1-02'), true, 'skipped level with a later win');
    eq(RS.Progress.isPlayable(s, 'w1-04'), true, 'after w1-03');
    eq(RS.Progress.isPlayable(s, 'w1-05'), false);
  });

  t('progress: startWorld', function () {
    var s = RS.Save.fresh();
    eq(RS.Progress.startWorld(s), 1);
    winWorld(s, 1);
    eq(RS.Progress.startWorld(s), 2);
    s.stars['w2-01'] = 2;
    eq(RS.Progress.startWorld(s), 2);
    winWorld(s, 2);
    eq(RS.Progress.startWorld(s), 3, 'world 3 after w2-10');
    RS.Worlds.list().forEach(function (w) { winWorld(s, w.id); });
    var list = RS.Worlds.list();
    eq(RS.Progress.startWorld(s), list[list.length - 1].id, 'last registered world when all are won');
  });

  t('progress: worldStars', function () {
    var s = RS.Save.fresh();
    s.stars['w1-01'] = 3;
    s.stars['w1-02'] = 2;
    s.stars['w2-01'] = 1;
    RS.assert.deepEqual(RS.Progress.worldStars(s, 1), { stars: 5, max: 30 });
    RS.assert.deepEqual(RS.Progress.worldStars(s, 2), { stars: 1, max: 30 });
  });

  t('progress: isComplete false while world 10 is not registered', function () {
    var s = RS.Save.fresh();
    winWorld(s, 1);
    winWorld(s, 2);
    eq(RS.Progress.isComplete(s), false);
  });

  t('progress: v3 world-2 player keeps everything and starts in world 2', function () {
    var stars = {};
    for (var n = 1; n <= 10; n++) { stars[n] = n === 10 ? 2 : 3; }
    stars[11] = 1;
    var raw = { version: 3, unlocked: 12, stars: stars, endlessHighscore: 50, prologueSeen: true, finaleSeen: true,
      sticks: 140, jokers: { moves: 3, hammer: 2 }, shopSeen: true,
      gateOpenSeen: true, world2IntroSeen: true, grandFinaleSeen: false };
    var m = {};
    var storage = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
    storage.setItem(RS.Save.KEY, JSON.stringify(raw));
    var d = RS.Save.load(storage);
    var expected = {};
    for (var i = 1; i <= 11; i++) { expected[RS.Save.legacyId(i)] = stars[i]; }
    RS.assert.deepEqual(d.stars, expected);
    eq(d.stars['w1-10'], 2);
    eq(d.stars['w2-01'], 1);
    eq(d.sticks, 140);
    eq(d.jokers.moves, 3);
    eq(d.jokers.hammer, 2);
    eq(RS.Save.hasSeen(d, 'tor:1'), true);
    eq(RS.Save.hasSeen(d, 'intro:2'), true);
    eq(RS.Save.hasSeen(d, 'kapitel:1'), true);
    eq(RS.Save.hasSeen(d, 'kapitel:2'), false);
    eq(RS.Progress.startWorld(d), 2);
    eq(RS.Progress.isPlayable(d, 'w2-02'), true);
  });
  function memStorage() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }

  // Registriert Testwelten für alle fehlenden Welten bis FINAL_WORLD, führt fn aus und
  // entfernt sie danach wieder.
  function withAllWorlds(fn) {
    var added = [];
    try {
      for (var n = 1; n <= RS.Worlds.FINAL_WORLD; n++) {
        if (!RS.Worlds.get(n)) {
          RS.Worlds.register(testWorld(n, ['w' + n + '-01']));
          added.push(n);
        }
      }
      fn();
    } finally {
      added.forEach(function (id) { RS.Worlds._unregister(id); });
    }
  }

  function finalBoss() {
    var lv = RS.Worlds.inWorld(RS.Worlds.FINAL_WORLD);
    return lv[lv.length - 1].id;
  }

  t('progress: markComplete only after final boss', function () {
    withAllWorlds(function () {
      var s = RS.Save.fresh();
      eq(RS.Progress.markComplete(s), false, 'fresh save');
      eq(s.completed, false);
      for (var n = 1; n < RS.Worlds.FINAL_WORLD; n++) { winWorld(s, n); }
      RS.Worlds.inWorld(RS.Worlds.FINAL_WORLD).forEach(function (l) {
        if (!l.isBoss) { s.stars[l.id] = 3; }
      });
      eq(RS.Progress.markComplete(s), false, 'everything but the final boss');
      eq(s.completed, false);
      s.stars[finalBoss()] = 1;
      eq(RS.Progress.markComplete(s), true, 'final boss won');
      eq(s.completed, true);
      eq(RS.Progress.markComplete(s), false, 'second call changes nothing');
      eq(s.completed, true);
    });
    var lone = RS.Save.fresh();
    lone.stars['w10-10'] = 3;
    if (!RS.Worlds.get(RS.Worlds.FINAL_WORLD)) {
      eq(RS.Progress.markComplete(lone), false, 'no final world registered');
      eq(lone.completed, false);
    }
  });

  t('progress: completed survives store/load', function () {
    withAllWorlds(function () {
      var storage = memStorage();
      var s = RS.Save.fresh();
      s.stars[finalBoss()] = 2;
      RS.Progress.markComplete(s);
      eq(RS.Save.store(s, storage), true);
      var d = RS.Save.load(storage);
      eq(d.completed, true);
      eq(RS.Progress.markComplete(d), false, 'already complete after reload');
      var plain = RS.Save.load(memStorage());
      eq(plain.completed, false, 'fresh load is not complete');
    });
  });

  t('progress: all levels stay playable after completion', function () {
    withAllWorlds(function () {
      var s = RS.Save.fresh();
      RS.Worlds.list().forEach(function (w) { winWorld(s, w.id); });
      eq(RS.Progress.markComplete(s), true);
      RS.Worlds.levels().forEach(function (l) {
        eq(RS.Progress.isPlayable(s, l.id), true, l.id + ' playable');
        eq(RS.Progress.isWorldOpen(s, l.world), true, 'world ' + l.world + ' open');
      });
      eq(RS.Progress.nextLevel(s), null, 'nothing left unwon');
      eq(RS.Worlds.get(RS.Progress.startWorld(s)) !== undefined, true, 'map opens on a real world');
      var first = RS.Worlds.levels()[0].id;
      var res = RS.Save.recordWin(s, first, [{ type: 'levelWon', stars: 3, score: 1000, bonus: 0 }]);
      eq(res !== null, true, 'a replay still records');
      eq(s.stars[first], 3, 'better stars are kept');
      eq(s.completed, true, 'completion stays');
    });
  });

  RS.test('progress: totalStars counts only registered levels', function () {
    var d = RS.Save.fresh();
    d.stars['w1-01'] = 3;
    d.stars['w1-02'] = 2;
    var before = RS.Progress.totalStars(d);
    RS.assert.equal(before, 5);
    d.stars['w42-07'] = 3;
    RS.assert.equal(RS.Progress.totalStars(d), 5, 'unknown id ignored');
    RS.assert.equal(d.stars['w42-07'], 3, 'unknown id stays stored');
  });

})(window.RS = window.RS || {});
