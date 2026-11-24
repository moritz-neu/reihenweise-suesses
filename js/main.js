(function (RS) {
  'use strict';

  // Spielstand-Spiegel (IndexedDB): Zweitkopie, falls nur der localStorage gelöscht wird.
  RS.Save.setMirror(RS.SaveMirror.indexedDb());
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
  }

  // Start erst nach dem Abgleich mit dem Spiegel (höchstens 1,5 s, meist wenige ms).
  RS.Save.restore().then(function (result) {
    if (result === 'restored') {
      RS.App.save = RS.Save.load();
      RS.Audio.setSettings(RS.App.save.settings);
    }
    RS.UI.init(document.getElementById('app'));
    RS.UI.Back.install(window);
    RS.UI.show('menu');
  });
})(window.RS = window.RS || {});
