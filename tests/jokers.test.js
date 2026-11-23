(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var deep = RS.assert.deepEqual;
  var ok = RS.assert.ok;
  var J = RS.Jokers;

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  function stubWorld(worldId) {
    var levels = [];
    for (var i = 1; i <= 9; i++) {
      levels.push({ id: 'w' + worldId + '-0' + i, colors: 5, moves: 20, goals: [{ type: 'score', target: 1000 }], layout: ALL, intro: 'Los!', win: 'Geschafft!' });
    }
    levels.push({ id: 'w' + worldId + '-10', boss: true, colors: 6, moves: 30, layout: ALL, intro: 'Boss!', win: 'Besiegt!' });
    return {
      id: worldId, key: 'stub' + worldId, name: 'Stubwelt', novelty: null,
      intro: ['a', 'b', 'c', 'd'], chapterEnd: ['x', 'y'], gateLocked: 'zu',
      boss: { key: 'stubboss' + worldId, name: 'Stubboss', hp: 100, weak: [0, 1], thresholds: [0.5], attacks: [{ kind: 'lock', count: 1, every: 3 }, { kind: 'lock', count: 1, every: 2 }],
        story: { intro: [{ who: 'boss', text: 'Hi' }], phase2: [{ who: 'boss', text: 'Au' }], defeat: [{ who: 'boss', text: 'Autsch' }] } },
      levels: levels
    };
  }

  // Registers a stub world 3 (only if missing), runs fn, always unregisters what it added.
  function withWorld3(fn) {
    var added = !RS.Worlds.get(3);
    try {
      if (added) { RS.Worlds.register(stubWorld(3)); }
      fn();
    } finally {
      if (added) { RS.Worlds._unregister(3); }
    }
  }

  t('jokers: table', function () {
    deep(J.KINDS, ['moves', 'hammer', 'besen']);
    var b = J.get('besen');
    eq(b.name, 'Zuckerbesen');
    eq(b.price, 25);
    eq(b.world, 4);
    eq(b.target, 'cell');
    eq(b.text, 'Räumt eine ganze Reihe ab.');
    eq(J.get('moves').target, 'none');
    eq(J.get('moves').text, 'Fünf Züge mehr im laufenden Level.');
    eq(J.get('hammer').text, 'Zerschlägt ein Bonbon deiner Wahl – samt Glasur und Gitter.');
    eq(J.get('hammer').price, 20);
    eq(J.get('bomb'), undefined);
  });

  t('jokers: available hides besen until w3-10 is won', function () {
    withWorld3(function () {
      var s = RS.Save.fresh();
      deep(J.available(s).map(function (j) { return j.kind; }), ['moves', 'hammer']);
      s.stars['w1-10'] = 1;
      s.stars['w2-10'] = 1;
      deep(J.available(s).map(function (j) { return j.kind; }), ['moves', 'hammer']);
      s.stars['w3-10'] = 1;
      deep(J.available(s).map(function (j) { return j.kind; }), ['moves', 'hammer', 'besen']);
    });
  });

  t('jokers: giftDue returns besen for world 4 only once', function () {
    var s = RS.Save.fresh();
    eq(J.giftDue(s, 4), 'besen');
    eq(J.giftDue(s, 1), null, 'world 1 jokers are never gifted');
    eq(J.giftDue(s, 3), null);
    J.giveGift(s, 'besen');
    eq(J.giftDue(s, 4), null);
    eq(s.jokers.besen, 2);
    eq(RS.Save.hasSeen(s, 'geschenk:besen'), true);
  });

  t('jokers: real registry gifts the besen on entering world 4 after w3-10', function () {
    ok(RS.Worlds.get(4), 'world 4 registered');
    eq(RS.Worlds.get(4).novelty.key, 'besen');
    var s = RS.Save.fresh();
    ['w1-10', 'w2-10', 'w3-10'].forEach(function (id) { s.stars[id] = 1; });
    eq(RS.Progress.isWorldOpen(s, 4), true);
    eq(J.giftDue(s, 4), 'besen');
    ok(J.available(s).some(function (j) { return j.kind === 'besen'; }), 'shop offers the besen');
  });

  t('jokers: giveGift caps at 10', function () {
    var s = RS.Save.fresh();
    s.jokers.besen = 9;
    J.giveGift(s, 'besen');
    eq(s.jokers.besen, 10);
  });
})(window.RS = window.RS || {});
