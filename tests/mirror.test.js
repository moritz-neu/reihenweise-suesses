(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;

  function fakeStorage() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }

  // Synchroner Spiegel für Tests: merkt sich Schreiben und Löschen.
  function fakeMirror() {
    var m = { text: null, writes: 0, removes: 0 };
    m.read = function () { return Promise.resolve(m.text); };
    m.write = function (text) { m.text = text; m.writes++; return Promise.resolve(); };
    m.remove = function () { m.text = null; m.removes++; return Promise.resolve(); };
    return m;
  }

  function withMirror(m, fn) {
    RS.Save.setMirror(m);
    try { fn(); } finally { RS.Save.setMirror(null); }
  }

  function played() {
    var d = RS.Save.fresh();
    d.stars['w1-01'] = 3;
    d.sticks = 42;
    return d;
  }

  t('mirror: store writes the same text to the mirror', function () {
    var m = fakeMirror();
    withMirror(m, function () {
      var s = fakeStorage();
      eq(RS.Save.store(played(), s), true);
      eq(m.text, s.getItem(RS.Save.KEY));
    });
  });

  t('mirror: reset also clears the mirror', function () {
    var m = fakeMirror();
    withMirror(m, function () {
      var s = fakeStorage();
      RS.Save.store(played(), s);
      RS.Save.reset(s);
      eq(m.removes, 1);
      eq(m.text, null);
    });
  });

  t('mirror: an empty browser storage is restored from a valid mirror', function () {
    var s = fakeStorage();
    eq(RS.Save.restoreFrom(JSON.stringify(played()), s), 'restored');
    var back = RS.Save.load(s);
    eq(back.stars['w1-01'], 3);
    eq(back.sticks, 42);
  });

  t('mirror: an existing browser save wins and is copied into the mirror once', function () {
    var m = fakeMirror();
    withMirror(m, function () {
      var s = fakeStorage();
      s.setItem(RS.Save.KEY, JSON.stringify(played()));
      var other = RS.Save.fresh();
      other.sticks = 7;
      eq(RS.Save.restoreFrom(JSON.stringify(other), s), 'kept');
      eq(JSON.parse(s.getItem(RS.Save.KEY)).sticks, 42);
      eq(m.text, s.getItem(RS.Save.KEY));
      eq(RS.Save.restoreFrom(m.text, s), 'kept');
      eq(m.writes, 1);
    });
  });

  t('mirror: invalid or empty mirror data is never restored', function () {
    var s = fakeStorage();
    eq(RS.Save.restoreFrom(null, s), 'none');
    eq(RS.Save.restoreFrom('{kaputt', s), 'none');
    eq(RS.Save.restoreFrom(JSON.stringify({ version: 99 }), s), 'none');
    eq(RS.Save.restoreFrom(JSON.stringify(RS.Save.fresh()), s), 'none');
    eq(s.getItem(RS.Save.KEY), null);
  });

  t('mirror: a v3 save in the mirror is restored as v4', function () {
    var s = fakeStorage();
    var v3 = { version: 3, unlocked: 2, stars: { 1: 2 }, endlessHighscore: 0, prologueSeen: true, finaleSeen: false,
      sticks: 5, jokers: { moves: 1, hammer: 1 }, shopSeen: false, gateOpenSeen: false, world2IntroSeen: false, grandFinaleSeen: false };
    var r = RS.Save.restoreFrom(JSON.stringify(v3), s);
    eq(r, 'restored');
    eq(JSON.parse(s.getItem(RS.Save.KEY)).version, 4);
  });

  t('mirror: a failing mirror never breaks storing', function () {
    function boom() { throw new Error('kaputt'); }
    withMirror({ read: boom, write: boom, remove: function () { return Promise.reject(new Error('x')); } }, function () {
      var s = fakeStorage();
      eq(RS.Save.store(played(), s), true);
      RS.Save.reset(s);
      eq(s.getItem(RS.Save.KEY), null);
    });
  });

  t('mirror: indexedDb returns null without IndexedDB', function () {
    eq(RS.SaveMirror.indexedDb(null) === null || typeof indexedDB !== 'undefined', true);
    eq(RS.SaveMirror.indexedDb({ open: function () {} }) !== null, true);
  });
})(window.RS = window.RS || {});
