(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;

  function loc(protocol, hostname) { return { protocol: protocol, hostname: hostname }; }
  var NAV = { serviceWorker: {} };

  t('platform: the hub menu loads only on mindsquare hub hosts', function () {
    eq(RS.Platform.isHub(loc('https:', 'training-hub.msr2.de')), true);
    eq(RS.Platform.isHub(loc('https:', 'agents.mindsquare.de')), true);
    eq(RS.Platform.isHub(loc('https:', 'moritz-neu.github.io')), false);
    eq(RS.Platform.isHub(loc('https:', 'localhost')), false);
    eq(RS.Platform.isHub(loc('file:', '')), false);
    eq(RS.Platform.isHub(loc('https:', 'evilmsr2.de')), false);
  });

  t('platform: service worker only over http(s), never on the hub or without support', function () {
    eq(RS.Platform.canServiceWorker(loc('https:', 'moritz-neu.github.io'), NAV), true);
    eq(RS.Platform.canServiceWorker(loc('http:', 'localhost'), NAV), true);
    eq(RS.Platform.canServiceWorker(loc('file:', ''), NAV), false);
    eq(RS.Platform.canServiceWorker(loc('https:', 'training-hub.msr2.de'), NAV), false);
    eq(RS.Platform.canServiceWorker(loc('https:', 'moritz-neu.github.io'), {}), false);
  });

  t('platform: no hub menu script under file://', function () {
    eq(document.querySelectorAll('script[src*="waffle"]').length, 0);
  });
})(window.RS = window.RS || {});
