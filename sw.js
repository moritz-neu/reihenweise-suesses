// Service Worker von „Reihenweise Süßes“: Das Spiel läuft nach dem ersten Start offline.
// Beim Installieren landen alle Dateien aus ASSETS im Zwischenspeicher der Version; danach
// kommt jede Datei aus dem Speicher, und nur Unbekanntes geht ans Netz. Eine neue Version
// (VERSION ändern) lädt alles neu und räumt die alten Speicher beim Aktivieren weg.
// ASSETS muss jede Datei enthalten, die index.html lädt: python tools/check_store.py prüft das.
'use strict';

var VERSION = '6.0.1';
var CACHE = 'rs-' + VERSION;
var ASSETS = [
  './',
  'index.html',
  'datenschutz.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png',
  'css/theme.css',
  'css/screens.css',
  'css/board.css',
  'css/map.css',
  'css/shop.css',
  'css/boss.css',
  'js/platform.js',
  'js/logic/rng.js',
  'js/logic/board.js',
  'js/logic/specials.js',
  'js/logic/obstacles.js',
  'js/logic/cherries.js',
  'js/logic/fuses.js',
  'js/logic/chameleons.js',
  'js/logic/engine.js',
  'js/logic/goals.js',
  'js/logic/boss.js',
  'js/logic/session.js',
  'js/logic/jokers.js',
  'js/logic/shop.js',
  'js/save.js',
  'js/save-mirror.js',
  'js/logic/progress.js',
  'js/data/curve.js',
  'js/data/registry.js',
  'js/data/worlds/w01.js',
  'js/data/worlds/w01-extra.js',
  'js/data/worlds/w02.js',
  'js/data/worlds/w02-extra.js',
  'js/data/worlds/w03.js',
  'js/data/worlds/w03-extra.js',
  'js/data/worlds/w04.js',
  'js/data/worlds/w04-extra.js',
  'js/data/worlds/w05.js',
  'js/data/worlds/w05-extra.js',
  'js/data/worlds/w06.js',
  'js/data/worlds/w06-extra.js',
  'js/data/worlds/w07.js',
  'js/data/worlds/w07-extra.js',
  'js/data/worlds/w08.js',
  'js/data/worlds/w08-extra.js',
  'js/data/worlds/w09.js',
  'js/data/worlds/w09-extra.js',
  'js/data/worlds/w10.js',
  'js/data/worlds/w10-extra.js',
  'js/data/story.js',
  'js/data/news.js',
  'js/audio.js',
  'js/audio-sfx.js',
  'js/ui/screens.js',
  'js/ui/backnav.js',
  'js/ui/dialog.js',
  'js/ui/shop.js',
  'js/ui/menu.js',
  'js/ui/effects.js',
  'js/ui/boardfx.js',
  'js/ui/boardview.js',
  'js/ui/bossview.js',
  'js/ui/game.js',
  'js/ui/endless.js',
  'js/ui/mapkit.js',
  'js/ui/worlds/w01.js',
  'js/ui/worlds/w02.js',
  'js/ui/worlds/w03.js',
  'js/ui/worlds/w04.js',
  'js/ui/worlds/w05.js',
  'js/ui/worlds/w06.js',
  'js/ui/worlds/w07.js',
  'js/ui/worlds/w08.js',
  'js/ui/worlds/w09.js',
  'js/ui/worlds/w10.js',
  'js/ui/map.js',
  'js/ui/atlas.js',
  'js/ui/credits.js',
  'js/main.js',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.RS_SW = { VERSION: VERSION, CACHE: CACHE, ASSETS: ASSETS };

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    // cache: 'reload' umgeht den HTTP-Cache, damit keine alte Datei in die neue Version rutscht.
    return cache.addAll(ASSETS.map(function (url) { return new Request(url, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('rs-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) { return; }
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) { return hit; }
      return fetch(req).then(function (res) {
        if (res.ok && res.type === 'basic') { cache.put(req, res.clone()); }
        return res;
      }).catch(function () {
        // Offline und nicht im Speicher: Seitenaufrufe bekommen das Spiel, alles andere den Fehler.
        if (req.mode === 'navigate') { return cache.match('index.html'); }
        throw new Error('offline: ' + req.url);
      });
    });
  }));
});
