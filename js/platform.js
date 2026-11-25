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

  // In der App-Hülle (Capacitor, Android oder iOS)? Dort liegen alle Dateien in der App.
  function isNative(win) {
    var cap = (win || window).Capacitor;
    return Boolean(cap && (typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : cap.isNative));
  }

  function canServiceWorker(loc, nav, win) {
    loc = loc || location;
    nav = nav || navigator;
    return /^https?:$/.test(loc.protocol) && !isHub(loc) && !isNative(win) && 'serviceWorker' in nav;
  }

  // Als installierte App gestartet (Startbildschirm, Play-Store-Hülle)?
  function isStandalone() {
    try {
      return Boolean(window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true;
    } catch (e) { return false; }
  }

  RS.Platform = { isHub: isHub, isNative: isNative, canServiceWorker: canServiceWorker, isStandalone: isStandalone };

  // Startwächter: Steht nach 8 s noch kein Bildschirm (Skriptfehler, kaputte Datei), erscheint
  // statt einer leeren Seite ein Hinweis mit Knopf zum Neuladen.
  if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-rs-app')) {
    setTimeout(function () {
      var app = document.getElementById('app');
      if (!app || app.getAttribute('data-screen')) { return; }
      var box = document.createElement('div');
      box.setAttribute('role', 'alert');
      box.style.cssText = 'position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;gap:1rem;padding:1.5rem;text-align:center;background:#140c2e;color:#f4ecff;font:1.1rem system-ui,sans-serif';
      var p = document.createElement('p');
      p.textContent = 'Das Spiel konnte nicht starten. Bitte lade es neu.';
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Neu laden';
      b.style.cssText = 'padding:0.7em 1.6em;border:0;border-radius:999px;background:#f5b942;color:#3a2300;font:inherit;font-weight:700';
      b.addEventListener('click', function () { location.reload(); });
      box.appendChild(p);
      box.appendChild(b);
      document.body.appendChild(box);
    }, 8000);
  }

  if (typeof document !== 'undefined' && document.head && isHub()) {
    var s = document.createElement('script');
    s.src = '/embed/waffle.js';
    s.defer = true;
    document.head.appendChild(s);
  }
})(window.RS = window.RS || {});
