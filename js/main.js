(function (RS) {
  'use strict';

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

  RS.UI.init(document.getElementById('app'));
  RS.UI.show('menu');
})(window.RS = window.RS || {});
