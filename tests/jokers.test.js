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
    deep(J.KINDS, ['moves', 'hammer', 'besen', 'feentausch', 'regenbogen', 'zauberbombe']);
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

  t('jokers: real registry gifts the feentausch on entering world 6 after w5-10', function () {
    ok(RS.Worlds.get(6), 'world 6 registered');
    eq(RS.Worlds.get(6).novelty.key, 'feentausch');
    var s = RS.Save.fresh();
    ['w1-10', 'w2-10', 'w3-10', 'w4-10'].forEach(function (id) { s.stars[id] = 1; });
    eq(RS.Progress.isWorldOpen(s, 6), false, 'world 6 waits for w5-10');
    ok(!J.available(s).some(function (j) { return j.kind === 'feentausch'; }), 'no feentausch before world 6');
    s.stars['w5-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 6), true);
    eq(J.giftDue(s, 6), 'feentausch');
    ok(J.available(s).some(function (j) { return j.kind === 'feentausch'; }), 'shop offers the feentausch');
    J.giveGift(s, 'feentausch');
    eq(s.jokers.feentausch, 2);
    eq(J.giftDue(s, 6), null, 'the gift comes only once');
  });

  t('jokers: real registry gifts the regenbogen on entering world 8 after w7-10', function () {
    ok(RS.Worlds.get(8), 'world 8 registered');
    eq(RS.Worlds.get(8).novelty.key, 'regenbogen');
    var s = RS.Save.fresh();
    ['w1-10', 'w2-10', 'w3-10', 'w4-10', 'w5-10', 'w6-10'].forEach(function (id) { s.stars[id] = 1; });
    eq(RS.Progress.isWorldOpen(s, 8), false, 'world 8 waits for w7-10');
    ok(!J.available(s).some(function (j) { return j.kind === 'regenbogen'; }), 'no regenbogen before world 8');
    s.stars['w7-10'] = 1;
    eq(RS.Progress.isWorldOpen(s, 8), true);
    eq(J.giftDue(s, 8), 'regenbogen');
    ok(J.available(s).some(function (j) { return j.kind === 'regenbogen'; }), 'shop offers the regenbogen');
    J.giveGift(s, 'regenbogen');
    eq(s.jokers.regenbogen, 2);
    eq(J.giftDue(s, 8), null, 'the gift comes only once');
  });

  t('jokers: giveGift caps at 10', function () {
    var s = RS.Save.fresh();
    s.jokers.besen = 9;
    J.giveGift(s, 'besen');
    eq(s.jokers.besen, 10);
  });

  t('jokers: table of feentausch, regenbogen, zauberbombe', function () {
    var f = J.get('feentausch');
    eq(f.name, 'Feentausch'); eq(f.price, 15); eq(f.world, 6); eq(f.target, 'pair');
    eq(f.text, 'Tauscht zwei Nachbarn, auch ohne Reihe.');
    var r = J.get('regenbogen');
    eq(r.name, 'Regenbogenstaub'); eq(r.price, 35); eq(r.world, 8); eq(r.target, 'cell');
    eq(r.text, 'Entfernt alle Bonbons einer Farbe.');
    var z = J.get('zauberbombe');
    eq(z.name, 'Zauberbombe'); eq(z.price, 30); eq(z.world, 10); eq(z.target, 'cell');
    eq(z.text, 'Sprengt ein Feld von drei mal drei.');
  });

  t('jokers: giftDue gives feentausch in world 6, regenbogen in 8, zauberbombe in 10', function () {
    var added = [];
    try {
      [6, 8, 10].forEach(function (id) {
        if (!RS.Worlds.get(id)) { RS.Worlds.register(stubWorld(id)); added.push(id); }
      });
      var s = RS.Save.fresh();
      eq(J.giftDue(s, 6), 'feentausch');
      eq(J.giftDue(s, 8), 'regenbogen');
      eq(J.giftDue(s, 10), 'zauberbombe');
      J.giveGift(s, 'feentausch');
      eq(J.giftDue(s, 6), null);
      eq(s.jokers.feentausch, 2);
      eq(J.giftDue(s, 8), 'regenbogen');
    } finally {
      added.forEach(function (id) { RS.Worlds._unregister(id); });
    }
  });
})(window.RS = window.RS || {});
