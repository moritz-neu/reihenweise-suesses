(function (RS) {
  'use strict';

  // Spielstand-Spiegel: Zweitkopie, falls nur der localStorage gelöscht wird. In der App-Hülle
  // der Speicher der App (RS.Native), sonst IndexedDB.
  RS.Save.setMirror(RS.Native.mirror() || RS.SaveMirror.indexedDb());
  if (RS.Platform && RS.Platform.isStandalone()) { RS.SaveMirror.requestPersistence(); }

  RS.App = {
    save: RS.Save.load(),
    persist: function () {
      return RS.Save.store(RS.App.save);
    }
  };

  // Ton erst nach einer Nutzeraktion: jede Eingabe erzeugt bzw. setzt den Audio-Kontext
  // fort (bei laufendem Kontext ist der Aufruf billig). Bei Touch zählen erst pointerup,
  // touchend und click als Nutzeraktion, iOS verlangt den Aufruf in touchend oder click.
  RS.Audio.setSettings(RS.App.save.settings);
  // Ruhige Kulisse: Klasse rs-calm am Dokument (css/ambient.css), aus dem Spielstand.
  RS.App.applyMotion = function () {
    document.documentElement.classList.toggle('rs-calm', RS.App.save.settings.motion === false);
  };
  RS.App.applyMotion();
  function unlockAudio() { RS.Audio.unlock(); }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(function (type) {
    document.addEventListener(type, unlockAudio, true);
  });

  // Langes Drücken mit dem Finger öffnet kein Kontextmenü (Maus: Rechtsklick bleibt).
  var touchPointer = false;
  document.addEventListener('pointerdown', function (e) {
    touchPointer = e.pointerType === 'touch' || e.pointerType === 'pen';
  }, true);
  document.addEventListener('contextmenu', function (e) {
    if (touchPointer) { e.preventDefault(); }
  });

  // Offline-Betrieb: Service Worker (nur über http(s) und nicht auf dem Hub, siehe RS.Platform).
  if (RS.Platform && RS.Platform.canServiceWorker()) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* ohne Offline-Speicher weiter */ });
    });
    // Neue Version: Der neue Service Worker übernimmt sofort (skipWaiting, clients.claim). Lief
    // vorher schon eine Version, lädt die Seite einmal neu, damit alle Dateien zusammenpassen.
    // Nie mitten im Level oder Endlos-Lauf und nie bei offenem Dialog: dann beim nächsten
    // Bildschirmwechsel. Beim allerersten Besuch (noch kein Service Worker) gibt es kein Neuladen.
    var hadController = Boolean(navigator.serviceWorker.controller);
    var updateReady = false;
    var reloading = false;
    var reloadWhenIdle = function () {
      if (!updateReady || reloading || !RS.UI.current) { return; }
      var screen = RS.UI.current();
      if (screen === 'game' || screen === 'endless' || RS.UI.isDialogOpen()) { return; }
      reloading = true;
      window.location.reload();
    };
    RS.App.reloadWhenIdle = reloadWhenIdle;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) { return; }
      updateReady = true;
      reloadWhenIdle();
    });
  }

  // Start erst nach dem Abgleich mit dem Spiegel (höchstens 1,5 s, meist wenige ms).
  RS.Save.restore().then(function (result) {
    if (result === 'restored') {
      RS.App.save = RS.Save.load();
      RS.Audio.setSettings(RS.App.save.settings);
      RS.App.applyMotion();
    }
    RS.UI.init(document.getElementById('app'));
    if (!RS.Native.installBack()) { RS.UI.Back.install(window); }
    if (RS.App.reloadWhenIdle) { RS.UI.onChange(RS.App.reloadWhenIdle); }
    RS.UI.show('menu');
    RS.UI.News.showIfDue();
  });
})(window.RS = window.RS || {});
