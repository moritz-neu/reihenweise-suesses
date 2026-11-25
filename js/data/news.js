(function (RS) {
  'use strict';

  // Neuigkeiten je Spielversion, neueste zuerst, in Spielersprache (kurz, höchstens 4 Zeilen).
  // Die oberste Version muss zur obersten Version im CHANGELOG und zu VERSION in sw.js passen
  // (tools/check_store.py prüft das). Nach einem Update zeigt das Hauptmenü einmal die noch
  // ungelesenen Versionen (höchstens zwei); gelesen ist eine Version mit dem Merker news:<version>.
  var NEWS = [
    { version: '6.5.0', date: '25.11.2026', items: [
      'Neuer Schalter im Hauptmenü: „Kulisse: ruhig“ hält Bewohner, Szenen und Konfetti still.'
    ] },
    { version: '6.4.0', date: '25.11.2026', items: [
      'Im Endlos-Modus reist du mit: Alle 3000 Punkte wechselt die Kulisse in die nächste Welt, mit ihrer Musik.'
    ] },
    { version: '6.3.0', date: '25.11.2026', items: [
      'Die Weltenübersicht zeigt jede Welt mit ihrem eigenen Horizont.',
      'Nach einem Sieg fliegt Annika zum nächsten Level, und gesperrte Level sagen dir, was vorher dran ist.',
      'Updates kommen zuverlässiger an, auch direkt nach einer neuen Version.'
    ] },
    { version: '6.2.0', date: '25.11.2026', items: [
      'Ab und zu ziehen Bewohner durchs Bild: Lebkuchenmann, Schneehase, Kamel, Ballon, Segelboot und mehr.',
      'Im Hauptmenü spaziert ein Lebkuchenmann durchs Dorf.'
    ] },
    { version: '6.1.0', date: '25.11.2026', items: [
      'Jede Welt hat jetzt eigene Kulissen mit Himmel, Horizont und kleinen Bewohnern.',
      'Vom winkenden Lebkuchenmann über den hoppelnden Schneehasen bis zur Fledermaus.',
      'Auf der Karte zeigt Annika dir das nächste Level, und der Boss wartet schon oben.',
      'Nach jedem Sieg regnet es Konfetti.'
    ] },
    { version: '6.0.1', date: '25.11.2026', items: [
      'Neue Versionen laden sich von selbst, aber nie mitten im Level.',
      'Nach jedem Update erfährst du hier kurz, was neu ist.'
    ] },
    { version: '6.0.0', date: '25.11.2026', items: [
      'Jede Welt hat jetzt 100 Level: 900 neue Zwischenlevel zwischen den bisherigen.',
      'Die Levelkarte ist ein langer Weg nach oben, mit Sprung zum Boss und zum Anfang.',
      'Die Joker bleiben beim Spielen immer unten sichtbar.',
      'Joker im Laden kosten mehr, dafür gibt es viel mehr Zuckerstangen zu gewinnen.'
    ] },
    { version: '5.2.0', date: '24.11.2026', items: [
      'Das Spiel lässt sich als App installieren und läuft auch ohne Internet.',
      'Die Zurück-Taste führt eine Ebene zurück.',
      'Dein Spielstand ist doppelt gesichert.'
    ] },
    { version: '5.1.1', date: '24.11.2026', items: [
      'Graf Lakritz ist leichter: mehr Züge und weniger Lakritzgitter.'
    ] },
    { version: '5.1.0', date: '24.11.2026', items: [
      'Bessere Ansicht auf dem Handy.',
      'Ton und Musik laufen zuverlässiger.'
    ] },
    { version: '5.0.0', date: '24.11.2026', items: [
      'Sechs neue Welten bis zur Bitterburg mit Kirschen, Knallbonbons und Chamäleons.',
      'Neue Joker und das große Finale gegen Bitterkönig Amarus.'
    ] }
  ];

  var MAX_SHOWN = 2;

  function key(entry) { return 'news:' + entry.version; }

  // Ein neuer Spielstand hat noch keine Sterne und nichts gesehen.
  function isNewPlayer(save) {
    return Object.keys(save.stars).length === 0 && save.seen.length === 0;
  }

  // Ungelesene Versionen für das Fenster nach einem Update, neueste zuerst (höchstens zwei).
  // Neue Spieler sehen nichts.
  function due(save) {
    if (isNewPlayer(save)) { return []; }
    return NEWS.filter(function (n) { return !RS.Save.hasSeen(save, key(n)); }).slice(0, MAX_SHOWN);
  }

  // Markiert alle Versionen als gelesen; true, wenn sich etwas geändert hat.
  function markAllSeen(save) {
    var changed = false;
    NEWS.forEach(function (n) {
      if (!RS.Save.hasSeen(save, key(n))) { RS.Save.markSeen(save, key(n)); changed = true; }
    });
    return changed;
  }

  RS.NEWS = NEWS;
  RS.News = { latest: NEWS[0].version, due: due, markAllSeen: markAllSeen, isNewPlayer: isNewPlayer, MAX_SHOWN: MAX_SHOWN };
})(window.RS = window.RS || {});
