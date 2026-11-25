(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  function fakePrefs() {
    var m = {};
    return {
      store: m,
      get: function (o) { return Promise.resolve({ value: Object.prototype.hasOwnProperty.call(m, o.key) ? m[o.key] : null }); },
      set: function (o) { m[o.key] = o.value; return Promise.resolve(); },
      remove: function (o) { delete m[o.key]; return Promise.resolve(); }
    };
  }

  t('native: in the browser there is no native platform, mirror or back plugin', function () {
    eq(RS.Platform.isNative({}), false);
    eq(RS.Native.mirror({}), null);
    eq(RS.Native.installBack({}), false);
    eq(RS.Platform.isNative({ Capacitor: { isNativePlatform: function () { return false; } } }), false);
  });

  t('native: inside the app shell no service worker is used', function () {
    var win = { Capacitor: { isNativePlatform: function () { return true; } } };
    eq(RS.Platform.isNative(win), true);
    eq(RS.Platform.canServiceWorker({ protocol: 'https:', hostname: 'localhost' }, { serviceWorker: {} }, win), false);
    eq(RS.Platform.canServiceWorker({ protocol: 'https:', hostname: 'localhost' }, { serviceWorker: {} }, {}), true);
  });

  t('native: the preferences mirror writes and removes the save text', function () {
    var prefs = fakePrefs();
    var m = RS.Native.mirror({ Capacitor: { Plugins: { Preferences: prefs } } });
    ok(m, 'mirror with the plugin');
    m.write('{"version":4}');
    eq(prefs.store[RS.Native.KEY], '{"version":4}');
    ok(typeof m.read().then === 'function', 'read returns a promise');
    m.remove();
    eq(prefs.store[RS.Native.KEY], undefined);
  });

  t('native: the back button plugin closes the app only in the main menu', function () {
    var handler = null;
    var exits = 0;
    var app = { addListener: function (name, fn) { if (name === 'backButton') { handler = fn; } }, exitApp: function () { exits++; } };
    eq(RS.Native.installBack({ Capacitor: { Plugins: { App: app } } }), true);
    ok(handler, 'listener registered');
    var root = document.createElement('div');
    root.id = 'app';
    var clicks = 0;
    var b = RS.UI.Back.mark(document.createElement('button'));
    b.addEventListener('click', function () { clicks++; });
    root.appendChild(b);
    document.body.appendChild(root);
    try {
      handler();
      eq(clicks, 1, 'screen back button pressed');
      eq(exits, 0);
      root.removeChild(b);
      handler();
      eq(exits, 1, 'main menu: exit');
    } finally { root.parentNode.removeChild(root); }
  });
})(window.RS = window.RS || {});
