(function (RS) {
  'use strict';

  function fakeStorage() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      raw: m
    };
  }
  function throwingStorage() {
    function boom() { throw new Error('denied'); }
    return { getItem: boom, setItem: boom, removeItem: boom };
  }
  function putRaw(s, obj) { s.setItem(RS.Save.KEY, typeof obj === 'string' ? obj : JSON.stringify(obj)); }

  function v4(patch) {
    var d = RS.Save.fresh();
    Object.keys(patch || {}).forEach(function (k) { d[k] = patch[k]; });
    return d;
  }

  RS.test('save: load returns fresh when empty', function () {
    RS.assert.deepEqual(RS.Save.load(fakeStorage()), RS.Save.fresh());
    RS.assert.deepEqual(RS.Save.fresh(),
      { version: 4, stars: {}, seen: [], sticks: 0, jokers: { moves: 1, hammer: 1, besen: 0, feentausch: 0, regenbogen: 0, zauberbombe: 0 }, endlessHighscore: 0, completed: false,
        settings: { music: true, sfx: true } });
  });

  RS.test('save: load returns fresh on corrupt JSON', function () {
    var s = fakeStorage();
    putRaw(s, '{not json');
    RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh());
  });

  RS.test('save: load returns fresh on unknown version', function () {
    var s = fakeStorage();
    var d = v4({ sticks: 5 }); d.version = 5;
    putRaw(s, d);
    RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh());
  });

  RS.test('save: invalid v4 gives a fresh save', function () {
    var bad = [
      { stars: null }, { stars: { 'w1-01': 4 } }, { stars: { 'w1-01': 'x' } }, { stars: [] },
      { seen: 'tor:1' }, { seen: [1] }, { seen: null },
      { sticks: -1 }, { sticks: 2.5 }, { sticks: '3' },
      { jokers: { moves: 11, hammer: 0 } }, { jokers: { moves: -1, hammer: 0 } }, { jokers: null },
      { endlessHighscore: -1 }, { endlessHighscore: 'x' },
      { completed: 1 }, { completed: undefined }
    ];
    bad.forEach(function (patch) {
      var s = fakeStorage();
      putRaw(s, v4(patch));
      RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh(), JSON.stringify(patch));
    });
    var s2 = fakeStorage();
    putRaw(s2, 'null');
    RS.assert.deepEqual(RS.Save.load(s2), RS.Save.fresh(), 'null');
  });

  RS.test('save: load returns fresh when storage throws', function () {
    RS.assert.deepEqual(RS.Save.load(throwingStorage()), RS.Save.fresh());
  });

  RS.test('save: store returns false when storage throws', function () {
    RS.assert.equal(RS.Save.store(RS.Save.fresh(), throwingStorage()), false);
  });

  RS.test('save: store + load round trip', function () {
    var s = fakeStorage();
    var d = RS.Save.fresh();
    RS.Save.recordWin(d, 'w1-01', [{ type: 'levelWon', stars: 3 }]);
    RS.Save.recordWin(d, 'w1-02', [{ type: 'levelWon', stars: 1 }]);
    RS.Save.recordEndless(d, 1234);
    RS.Save.markSeen(d, 'prolog');
    RS.assert.equal(RS.Save.store(d, s), true);
    RS.assert.deepEqual(RS.Save.load(s), d);
  });

  RS.test('save: seen keys are remembered once', function () {
    var d = RS.Save.fresh();
    RS.assert.equal(RS.Save.hasSeen(d, 'tor:1'), false);
    RS.Save.markSeen(d, 'tor:1');
    RS.Save.markSeen(d, 'tor:1');
    RS.assert.equal(RS.Save.hasSeen(d, 'tor:1'), true);
    RS.assert.deepEqual(d.seen, ['tor:1']);
  });

  RS.test('save: legacyId maps 1-20', function () {
    RS.assert.equal(RS.Save.legacyId(1), 'w1-01');
    RS.assert.equal(RS.Save.legacyId(10), 'w1-10');
    RS.assert.equal(RS.Save.legacyId(11), 'w2-01');
    RS.assert.equal(RS.Save.legacyId(20), 'w2-10');
  });

  RS.test('save: recordEndless keeps highscore', function () {
    var d = RS.Save.fresh();
    RS.Save.recordEndless(d, 500);
    RS.Save.recordEndless(d, 300);
    RS.assert.equal(d.endlessHighscore, 500);
    RS.assert.equal(RS.Save.recordEndless(d, 900), 0);
    RS.assert.equal(d.endlessHighscore, 900);
  });

  RS.test('save: reset removes the key', function () {
    var s = fakeStorage();
    RS.Save.store(RS.Save.fresh(), s);
    RS.Save.reset(s);
    RS.assert.equal(s.getItem(RS.Save.KEY), null);
    RS.Save.reset(throwingStorage());
  });

  RS.test('save: recordWin takes a string id', function () {
    var d = RS.Save.fresh();
    var won = RS.Save.recordWin(d, 'w1-03', [{ type: 'scoreChanged', score: 900 }, { type: 'levelWon', stars: 2, score: 900, bonus: 0 }]);
    RS.assert.equal(won.event.stars, 2);
    RS.assert.equal(d.stars['w1-03'], 2);
    RS.assert.deepEqual(Object.keys(d.stars), ['w1-03']);
  });

  RS.test('save: recordWin ignores events without a win', function () {
    var d = RS.Save.fresh();
    RS.assert.equal(RS.Save.recordWin(d, 'w1-01', [{ type: 'levelLost', score: 10 }, { type: 'movesChanged', movesLeft: 0 }]), null);
    RS.assert.deepEqual(d, RS.Save.fresh());
  });

  RS.test('save: recordWin credits reward once and replay uses stored best', function () {
    var d = RS.Save.fresh();
    var r = RS.Save.recordWin(d, 'w1-01', [{ type: 'levelWon', stars: 2 }]);
    RS.assert.equal(r.reward, 10); RS.assert.equal(d.sticks, 10); RS.assert.equal(d.stars['w1-01'], 2);
    r = RS.Save.recordWin(d, 'w1-01', [{ type: 'levelWon', stars: 3 }]);
    RS.assert.equal(r.reward, 7); RS.assert.equal(d.sticks, 17);
    r = RS.Save.recordWin(d, 'w1-01', [{ type: 'levelWon', stars: 1 }]);
    RS.assert.equal(r.reward, 2); RS.assert.equal(d.sticks, 19); RS.assert.equal(d.stars['w1-01'], 3);
  });

  RS.test('save: recordWin reward per world', function () {
    var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];
    var levels = [{ id: 'w3-01', colors: 5, moves: 20, goals: [{ type: 'score', target: 1000 }], layout: ALL, intro: 'Los!', win: 'Geschafft!' },
      { id: 'w3-10', boss: true, colors: 6, moves: 30, layout: ALL, intro: 'Boss!', win: 'Besiegt!' }];
    var added = !RS.Worlds.get(3);
    try {
      if (added) {
        RS.Worlds.register({
          id: 3, key: 'stub3', name: 'Stubwelt', novelty: null,
          intro: ['a', 'b', 'c', 'd'], chapterEnd: ['x', 'y'], gateLocked: 'zu',
          boss: { key: 'stubboss3', name: 'Stubboss', hp: 100, weak: [0, 1], thresholds: [0.5], attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }],
            story: { intro: [{ who: 'boss', text: 'Hi' }], phase2: [{ who: 'boss', text: 'Au' }], defeat: [{ who: 'boss', text: 'Autsch' }] } },
          levels: levels
        });
      }
      var d = RS.Save.fresh();
      var r = RS.Save.recordWin(d, 'w3-01', [{ type: 'levelWon', stars: 3 }]);
      RS.assert.equal(r.reward, 18);
      RS.assert.equal(d.sticks, 18);
    } finally {
      if (added) { RS.Worlds._unregister(3); }
    }
  });

  RS.test('save: recordEndless pays sticks', function () {
    var d = RS.Save.fresh();
    RS.assert.equal(RS.Save.recordEndless(d, 8700), 8);
    RS.assert.equal(d.sticks, 8); RS.assert.equal(d.endlessHighscore, 8700);
    RS.assert.equal(RS.Save.recordEndless(d, 500), 0);
    RS.assert.equal(d.endlessHighscore, 8700);
  });

  RS.test('save: credited sticks are clamped at 1e9 and the save still loads', function () {
    var s = fakeStorage();
    var d = RS.Save.fresh();
    d.sticks = 999999995;
    RS.Save.recordWin(d, 'w1-01', [{ type: 'levelWon', stars: 3 }]);
    RS.assert.equal(d.sticks, 1e9);
    d.sticks = 999999995;
    RS.Save.recordEndless(d, 15000);
    RS.assert.equal(d.sticks, 1e9);
    RS.Save.store(d, s);
    RS.assert.equal(RS.Save.load(s).sticks, 1e9);
  });

  RS.test('save: v3 -> v4 keeps everything', function () {
    var s = fakeStorage();
    var stars = {};
    for (var n = 1; n <= 10; n++) { stars[n] = n === 10 ? 2 : 3; }
    stars[11] = 1;
    putRaw(s, { version: 3, unlocked: 12, stars: stars, endlessHighscore: 777, prologueSeen: true, finaleSeen: true,
      sticks: 140, jokers: { moves: 3, hammer: 2 }, shopSeen: true,
      gateOpenSeen: true, world2IntroSeen: true, grandFinaleSeen: false });
    var d = RS.Save.load(s);
    RS.assert.equal(d.version, 4);
    RS.assert.equal(d.stars['w1-01'], 3);
    RS.assert.equal(d.stars['w1-10'], 2);
    RS.assert.equal(d.stars['w2-01'], 1);
    RS.assert.equal(Object.keys(d.stars).length, 11);
    RS.assert.equal(d.sticks, 140);
    RS.assert.equal(d.endlessHighscore, 777);
    RS.assert.deepEqual(d.jokers, { moves: 3, hammer: 2, besen: 0, feentausch: 0, regenbogen: 0, zauberbombe: 0 });
    RS.assert.deepEqual(d.seen.slice().sort(), ['intro:2', 'kapitel:1', 'laden', 'prolog', 'tor:1']);
    RS.assert.equal(d.completed, false);
    RS.assert.equal('unlocked' in d, false);
    RS.assert.equal(RS.Progress.startWorld(d), 2);
  });

  RS.test('save: v3 grand finale maps to kapitel:2', function () {
    var s = fakeStorage();
    putRaw(s, { version: 3, unlocked: 20, stars: { 20: 1 }, endlessHighscore: 0, prologueSeen: false, finaleSeen: false,
      sticks: 0, jokers: { moves: 0, hammer: 0 }, shopSeen: false,
      gateOpenSeen: false, world2IntroSeen: false, grandFinaleSeen: true });
    var d = RS.Save.load(s);
    RS.assert.deepEqual(d.seen, ['kapitel:2']);
    RS.assert.equal(d.stars['w2-10'], 1);
    RS.assert.deepEqual(d.jokers, { moves: 0, hammer: 0, besen: 0, feentausch: 0, regenbogen: 0, zauberbombe: 0 });
  });

  RS.test('save: v1 and v2 -> v4', function () {
    var s = fakeStorage();
    putRaw(s, { version: 1, unlocked: 6, stars: { 1: 3, 2: 1 }, endlessHighscore: 4200, prologueSeen: true, finaleSeen: false });
    var d = RS.Save.load(s);
    RS.assert.deepEqual(d, { version: 4, stars: { 'w1-01': 3, 'w1-02': 1 }, seen: ['prolog'], sticks: 0,
      jokers: { moves: 1, hammer: 1, besen: 0, feentausch: 0, regenbogen: 0, zauberbombe: 0 }, endlessHighscore: 4200, completed: false,
      settings: { music: true, sfx: true } });
    d.jokers.moves = 0;
    RS.Save.store(d, s);
    RS.assert.equal(RS.Save.load(s).jokers.moves, 0, 'gift only once');

    var s2 = fakeStorage();
    putRaw(s2, { version: 2, unlocked: 10, stars: { 1: 3, 9: 2, 10: 1 }, endlessHighscore: 777, prologueSeen: true, finaleSeen: true,
      sticks: 42, jokers: { moves: 3, hammer: 0 }, shopSeen: true });
    var d2 = RS.Save.load(s2);
    RS.assert.deepEqual(d2.stars, { 'w1-01': 3, 'w1-09': 2, 'w1-10': 1 });
    RS.assert.equal(d2.sticks, 42);
    RS.assert.deepEqual(d2.jokers, { moves: 3, hammer: 0, besen: 0, feentausch: 0, regenbogen: 0, zauberbombe: 0 });
    RS.assert.deepEqual(d2.seen, ['prolog', 'laden', 'kapitel:1']);
  });

  RS.test('save: invalid v1-v3 give a fresh save', function () {
    var bad = [
      { version: 1, unlocked: 21, stars: {}, endlessHighscore: 0, prologueSeen: false, finaleSeen: false },
      { version: 1, unlocked: 1, stars: { 1: 4 }, endlessHighscore: 0, prologueSeen: false, finaleSeen: false },
      { version: 2, unlocked: 1, stars: {}, endlessHighscore: 0, prologueSeen: false, finaleSeen: false,
        sticks: -1, jokers: { moves: 1, hammer: 1 }, shopSeen: false },
      { version: 3, unlocked: 1, stars: {}, endlessHighscore: 0, prologueSeen: false, finaleSeen: false,
        sticks: 0, jokers: { moves: 1, hammer: 1 }, shopSeen: false,
        gateOpenSeen: 1, world2IntroSeen: false, grandFinaleSeen: false }
    ];
    bad.forEach(function (raw, i) {
      var s = fakeStorage();
      putRaw(s, raw);
      RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh(), 'case ' + i);
    });
  });

  RS.test('save: v4 missing joker kind gets 0', function () {
    var s = fakeStorage();
    putRaw(s, { version: 4, stars: { 'w1-01': 2 }, seen: ['prolog'], sticks: 30, jokers: { moves: 4 },
      endlessHighscore: 10, completed: false });
    var d = RS.Save.load(s);
    RS.assert.equal(d.jokers.moves, 4);
    RS.assert.equal(d.jokers.hammer, 0);
    RS.assert.equal(d.stars['w1-01'], 2);
    RS.assert.equal(d.sticks, 30);
    RS.assert.deepEqual(d.seen, ['prolog']);
  });

  RS.test('save: fresh has settings on', function () {
    RS.assert.deepEqual(RS.Save.fresh().settings, { music: true, sfx: true });
    var s = fakeStorage();
    var d = RS.Save.fresh();
    d.settings.music = false;
    RS.Save.store(d, s);
    RS.assert.deepEqual(RS.Save.load(s).settings, { music: false, sfx: true }, 'stored setting survives');
  });

  RS.test('save: v4 without settings keeps progress and gets defaults', function () {
    var s = fakeStorage();
    putRaw(s, { version: 4, stars: { 'w2-03': 3 }, seen: ['prolog', 'tor:1'], sticks: 55,
      jokers: { moves: 2, hammer: 3, besen: 1 }, endlessHighscore: 900, completed: false });
    var d = RS.Save.load(s);
    RS.assert.deepEqual(d.settings, { music: true, sfx: true });
    RS.assert.equal(d.stars['w2-03'], 3);
    RS.assert.equal(d.sticks, 55);
    RS.assert.deepEqual(d.jokers, { moves: 2, hammer: 3, besen: 1, feentausch: 0, regenbogen: 0, zauberbombe: 0 });
    RS.assert.deepEqual(d.seen, ['prolog', 'tor:1']);
  });

  RS.test('save: invalid settings value falls back to default', function () {
    var cases = [
      [{ music: 'nein', sfx: false }, { music: true, sfx: false }],
      [{ music: false }, { music: false, sfx: true }],
      [{ music: false, sfx: 0 }, { music: false, sfx: true }],
      [null, { music: true, sfx: true }],
      ['aus', { music: true, sfx: true }],
      [[false, false], { music: true, sfx: true }]
    ];
    cases.forEach(function (c, i) {
      var s = fakeStorage();
      var raw = RS.Save.fresh();
      raw.sticks = 12;
      raw.settings = c[0];
      putRaw(s, raw);
      var d = RS.Save.load(s);
      RS.assert.deepEqual(d.settings, c[1], 'case ' + i);
      RS.assert.equal(d.sticks, 12, 'progress kept, case ' + i);
    });
  });

  RS.test('save: v4 unknown star id kept', function () {
    var s = fakeStorage();
    var d = RS.Save.fresh();
    d.stars['w42-07'] = 3;
    putRaw(s, d);
    RS.assert.equal(RS.Save.load(s).stars['w42-07'], 3);
  });

  RS.test('save: v4 unknown joker kind is kept through load and store', function () {
    var s = fakeStorage();
    var d = RS.Save.fresh();
    d.jokers.feentausch = 3;
    d.jokers.kaputt = -2;
    putRaw(s, d);
    var loaded = RS.Save.load(s);
    RS.assert.equal(loaded.jokers.feentausch, 3);
    RS.assert.equal(loaded.jokers.kaputt, undefined, 'invalid unknown value dropped');
    RS.assert.equal(loaded.jokers.moves, 1, 'known kinds as before');
    RS.Save.store(loaded, s);
    RS.assert.equal(RS.Save.load(s).jokers.feentausch, 3);
  });

})(window.RS = window.RS || {});
