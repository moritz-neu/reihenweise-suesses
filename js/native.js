(function (RS) {
  'use strict';

  // Brücke zur App-Hülle (Capacitor, Android und iOS). Im Browser tut diese Datei nichts.
  // In der Hülle stellt Capacitor window.Capacitor bereit; installierte Plugins hängen ohne
  // Bundler an Capacitor.Plugins. Genutzt werden, wenn vorhanden:
  // - Preferences: Zweitkopie des Spielstands im Speicher der App (statt IndexedDB), weil iOS den
  //   Web-Speicher einer App bei Platzmangel räumen darf;
  // - App: Zurück-Taste von Android (eine Ebene zurück, im Hauptmenü App schließen).
  // Fehlt ein Plugin, gilt das Verhalten des Browsers (IndexedDB-Spiegel, Verlauf-Falle).

  var KEY = 'spielstand';

  function plugins(win) {
    var cap = (win || window).Capacitor;
    return cap && cap.Plugins ? cap.Plugins : {};
  }

  // Spiegel mit der Schnittstelle von RS.Save.setMirror, oder null ohne Preferences-Plugin.
  function mirror(win) {
    var prefs = plugins(win).Preferences;
    if (!prefs || !prefs.get || !prefs.set) { return null; }
    return {
      read: function () {
        return prefs.get({ key: KEY }).then(function (r) { return r && typeof r.value === 'string' ? r.value : null; });
      },
      write: function (text) { return prefs.set({ key: KEY, value: text }); },
      remove: function () { return prefs.remove({ key: KEY }); }
    };
  }

  // Zurück-Taste über das App-Plugin; true, wenn sie übernommen wurde (dann keine Verlauf-Falle).
  function installBack(win) {
    var app = plugins(win).App;
    if (!app || !app.addListener) { return false; }
    app.addListener('backButton', function () {
      if (RS.UI.Back.handle() === 'exit' && app.exitApp) { app.exitApp(); }
    });
    return true;
  }

  RS.Native = { mirror: mirror, installBack: installBack, KEY: KEY };
})(window.RS = window.RS || {});
