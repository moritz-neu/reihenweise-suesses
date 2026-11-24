(function (RS) {
  'use strict';

  // Wo läuft das Spiel? Eine index.html für alle Ziele (GitHub Pages, Play Store, Hub, file://).
  // - Hub (mindsquare Agent Hub): nur dort wird das Hub-Menü (/embed/waffle.js) geladen,
  //   und dort gibt es keinen Service Worker (der Hub prüft jede Anfrage per SSO).
  // - Service Worker nur über http(s) und nicht auf dem Hub; unter file:// gibt es keinen.
  // Wird im <head> geladen, vor allen anderen Skripten.

  var HUB_HOST = /(^|\.)(msr2|mindsquare)\.de$/;

  function isHub(loc) {
    return HUB_HOST.test(String((loc || location).hostname || ''));
  }

  function canServiceWorker(loc, nav) {
    loc = loc || location;
    nav = nav || navigator;
    return /^https?:$/.test(loc.protocol) && !isHub(loc) && 'serviceWorker' in nav;
  }

  // Als installierte App gestartet (Startbildschirm, Play-Store-Hülle)?
  function isStandalone() {
    try {
      return Boolean(window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true;
    } catch (e) { return false; }
  }

  RS.Platform = { isHub: isHub, canServiceWorker: canServiceWorker, isStandalone: isStandalone };

  if (typeof document !== 'undefined' && document.head && isHub()) {
    var s = document.createElement('script');
    s.src = '/embed/waffle.js';
    s.defer = true;
    document.head.appendChild(s);
  }
})(window.RS = window.RS || {});
