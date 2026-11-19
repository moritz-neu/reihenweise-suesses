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

  RS.test('save: load returns fresh when empty', function () {
    RS.assert.deepEqual(RS.Save.load(fakeStorage()), RS.Save.fresh());
    RS.assert.deepEqual(RS.Save.fresh(),
      { version: 2, unlocked: 1, stars: {}, endlessHighscore: 0, prologueSeen: false, finaleSeen: false,
        sticks: 0, jokers: { moves: 1, hammer: 1 }, shopSeen: false });
  });

  RS.test('save: load returns fresh on corrupt JSON', function () {
    var s = fakeStorage();
    putRaw(s, '{not json');
    RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh());
  });

  RS.test('save: load returns fresh on unknown version', function () {
    var s = fakeStorage();
    var d = RS.Save.fresh(); d.version = 3; d.unlocked = 5;
    putRaw(s, d);
    RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh());
  });

  RS.test('save: load returns fresh on wrong types', function () {
    var bad = [
      { unlocked: 11 }, { unlocked: 0 }, { unlocked: '3' }, { unlocked: 2.5 },
      { stars: null }, { stars: { 1: 4 } }, { stars: { 1: 'x' } }, { stars: [] },
      { endlessHighscore: -1 }, { endlessHighscore: 'x' },
      { prologueSeen: 1 }, { finaleSeen: 'yes' }
    ];
    bad.forEach(function (patch) {
      var d = RS.Save.fresh();
      Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
      var s = fakeStorage();
      putRaw(s, d);
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
    RS.Save.recordLevel(d, 1, 3);
    RS.Save.recordLevel(d, 2, 1);
    RS.Save.recordEndless(d, 1234);
    d.prologueSeen = true;
    RS.assert.equal(RS.Save.store(d, s), true);
    RS.assert.deepEqual(RS.Save.load(s), d);
  });

  RS.test('save: recordLevel keeps better stars', function () {
    var d = RS.Save.fresh();
    RS.Save.recordLevel(d, 1, 3);
    RS.Save.recordLevel(d, 1, 1);
    RS.assert.equal(d.stars[1], 3);
    RS.Save.recordLevel(d, 2, 1);
    RS.Save.recordLevel(d, 2, 2);
    RS.assert.equal(d.stars[2], 2);
    RS.assert.equal(RS.Save.recordLevel(d, 2, 0), d, 'returns same object');
    RS.assert.equal(d.stars[2], 2);
  });

  RS.test('save: recordLevel unlocks next level', function () {
    var d = RS.Save.fresh();
    RS.Save.recordLevel(d, 1, 1);
    RS.assert.equal(d.unlocked, 2);
    RS.Save.recordLevel(d, 1, 2);
    RS.assert.equal(d.unlocked, 2);
    RS.Save.recordLevel(d, 4, 1);
    RS.assert.equal(d.unlocked, 5);
    RS.Save.recordLevel(d, 2, 3);
    RS.assert.equal(d.unlocked, 5, 'never lowers');
  });

  RS.test('save: recordLevel never unlocks beyond 10', function () {
    var d = RS.Save.fresh();
    RS.Save.recordLevel(d, 10, 3);
    RS.assert.equal(d.unlocked, 10);
    RS.Save.recordLevel(d, 9, 1);
    RS.assert.equal(d.unlocked, 10);
  });

  RS.test('save: recordLevel with 0 stars unlocks nothing', function () {
    var d = RS.Save.fresh();
    RS.Save.recordLevel(d, 1, 0);
    RS.assert.equal(d.unlocked, 1);
    RS.assert.equal(d.stars[1] || 0, 0);
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
  RS.test('save: recordWin saves the stars of a levelWon event right away', function () {
    var d = RS.Save.fresh();
    var won = RS.Save.recordWin(d, 1, [{ type: 'scoreChanged', score: 900 }, { type: 'levelWon', stars: 2, score: 900, bonus: 0 }]);
    RS.assert.equal(won.event.stars, 2);
    RS.assert.equal(d.stars[1], 2);
    RS.assert.equal(d.unlocked, 2);
  });

  RS.test('save: recordWin ignores events without a win', function () {
    var d = RS.Save.fresh();
    RS.assert.equal(RS.Save.recordWin(d, 1, [{ type: 'levelLost', score: 10 }, { type: 'movesChanged', movesLeft: 0 }]), null);
    RS.assert.deepEqual(d, RS.Save.fresh());
  });

  RS.test('save: migrates v1 without loss, gift only once', function () {
    var s = fakeStorage();
    var v1 = { version: 1, unlocked: 6, stars: { 1: 3, 2: 1 }, endlessHighscore: 4200, prologueSeen: true, finaleSeen: false };
    putRaw(s, v1);
    var expected = JSON.parse(JSON.stringify(v1));
    expected.sticks = 0; expected.jokers = { moves: 1, hammer: 1 }; expected.shopSeen = false; expected.version = 2;
    var d = RS.Save.load(s);
    RS.assert.deepEqual(d, expected);
    d.jokers.moves = 0;
    RS.Save.store(d, s);
    RS.assert.equal(RS.Save.load(s).jokers.moves, 0);
  });

  RS.test('save: rejects invalid v2', function () {
    var bad = [
      { sticks: -1 }, { sticks: 2.5 }, { jokers: { moves: 11, hammer: 0 } },
      { jokers: { moves: 1 } }, { jokers: null }, { shopSeen: 'no' }
    ];
    bad.forEach(function (patch) {
      var d = RS.Save.fresh();
      Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
      var s = fakeStorage();
      putRaw(s, d);
      RS.assert.deepEqual(RS.Save.load(s), RS.Save.fresh(), JSON.stringify(patch));
    });
  });

  RS.test('save: recordWin credits reward once and replay uses stored best', function () {
    var d = RS.Save.fresh();
    var r = RS.Save.recordWin(d, 1, [{ type: 'levelWon', stars: 2 }]);
    RS.assert.equal(r.reward, 10); RS.assert.equal(d.sticks, 10); RS.assert.equal(d.stars[1], 2);
    r = RS.Save.recordWin(d, 1, [{ type: 'levelWon', stars: 3 }]);
    RS.assert.equal(r.reward, 7); RS.assert.equal(d.sticks, 17);
    r = RS.Save.recordWin(d, 1, [{ type: 'levelWon', stars: 1 }]);
    RS.assert.equal(r.reward, 2); RS.assert.equal(d.sticks, 19); RS.assert.equal(d.stars[1], 3);
  });

  RS.test('save: recordWin without win credits nothing', function () {
    var d = RS.Save.fresh();
    RS.assert.equal(RS.Save.recordWin(d, 1, [{ type: 'levelLost', score: 1 }]), null);
    RS.assert.equal(d.sticks, 0);
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
    RS.Save.recordWin(d, 1, [{ type: 'levelWon', stars: 3 }]);
    RS.assert.equal(d.sticks, 1e9);
    d.sticks = 999999995;
    RS.Save.recordEndless(d, 15000);
    RS.assert.equal(d.sticks, 1e9);
    RS.Save.store(d, s);
    RS.assert.equal(RS.Save.load(s).sticks, 1e9);
  });

})(window.RS = window.RS || {});
