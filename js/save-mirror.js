(function (RS) {
  'use strict';

  // Spiegel für den Spielstand (siehe RS.Save.setMirror): eine Zweitkopie in IndexedDB.
  // Löscht ein Aufräumprogramm nur den localStorage, holt das Spiel den Stand beim nächsten
  // Start von hier zurück. Eine App-Hülle (z. B. Capacitor Preferences) kann später einen
  // eigenen Spiegel mit derselben Schnittstelle einsetzen: read, write(text), remove.

  var DB = 'reihenweise-suesses';
  var STORE = 'save';
  var ID = 'current';

  function indexedDb(idb) {
    idb = idb || (typeof indexedDB !== 'undefined' ? indexedDB : null);
    if (!idb) { return null; }
    var opening = null;

    function open() {
      if (!opening) {
        opening = new Promise(function (resolve, reject) {
          var req = idb.open(DB, 1);
          req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
          req.onsuccess = function () { resolve(req.result); };
          req.onerror = function () { reject(req.error); };
          req.onblocked = function () { reject(new Error('blocked')); };
        });
        opening.catch(function () { opening = null; });
      }
      return opening;
    }

    function run(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE, mode);
          var req = fn(tx.objectStore(STORE));
          tx.oncomplete = function () { resolve(req.result); };
          tx.onerror = function () { reject(tx.error); };
          tx.onabort = function () { reject(tx.error); };
        });
      });
    }

    return {
      read: function () {
        return run('readonly', function (s) { return s.get(ID); }).then(function (v) {
          return typeof v === 'string' ? v : null;
        });
      },
      write: function (text) { return run('readwrite', function (s) { return s.put(text, ID); }); },
      remove: function () { return run('readwrite', function (s) { return s.delete(ID); }); }
    };
  }

  // Bittet den Browser, den Speicher dieser Seite nicht bei Platzmangel zu räumen.
  // Chrome gewährt das meist für installierte Apps; das Ergebnis ist egal.
  function requestPersistence(nav) {
    nav = nav || navigator;
    try {
      if (nav.storage && nav.storage.persist) { return nav.storage.persist().catch(function () { return false; }); }
    } catch (e) { /* nicht unterstützt */ }
    return Promise.resolve(false);
  }

  RS.SaveMirror = { indexedDb: indexedDb, requestPersistence: requestPersistence };
})(window.RS = window.RS || {});
