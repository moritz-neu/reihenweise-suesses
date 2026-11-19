(function (RS) {
  'use strict';

  // Platzhalter für Sound: Die Oberfläche meldet jedes Ereignis hier,
  // damit Klänge später ohne Umbau eingehängt werden können.
  RS.Audio = {
    enabled: false,
    play: function (event) { /* noch kein Sound */ }
  };
})(window.RS = window.RS || {});
