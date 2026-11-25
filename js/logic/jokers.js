(function (RS) {
  'use strict';

  var GIFT = 2;
  var MAX_STOCK = 10;

  // Preise etwa das Fünffache von 5.x, weil es mit 100 Leveln je Welt zehnmal so viele Belohnungen gibt (6.0.0).
  // target: 'none' wirkt sofort, 'cell' braucht ein Feld auf dem Brett, 'pair' zwei Nachbarfelder.
  var LIST = [
    { kind: 'moves', name: '+5 Züge', price: 150, world: 1, target: 'none', text: 'Fünf Züge mehr im laufenden Level.' },
    { kind: 'hammer', name: 'Zuckerhammer', price: 100, world: 1, target: 'cell', text: 'Zerschlägt ein Bonbon deiner Wahl – samt Glasur und Gitter.' },
    { kind: 'besen', name: 'Zuckerbesen', price: 125, world: 4, target: 'cell', text: 'Räumt eine ganze Reihe ab.' },
    { kind: 'feentausch', name: 'Feentausch', price: 75, world: 6, target: 'pair', text: 'Tauscht zwei Nachbarn, auch ohne Reihe.' },
    { kind: 'regenbogen', name: 'Regenbogenstaub', price: 175, world: 8, target: 'cell', text: 'Entfernt alle Bonbons einer Farbe.' },
    { kind: 'zauberbombe', name: 'Zauberbombe', price: 150, world: 10, target: 'cell', text: 'Sprengt ein Feld von drei mal drei.' }
  ];
  var KINDS = LIST.map(function (j) { return j.kind; });

  function get(kind) {
    return LIST.filter(function (j) { return j.kind === kind; })[0];
  }

  // Nur Joker, deren Welt offen ist.
  function available(save) {
    return LIST.filter(function (j) { return RS.Progress.isWorldOpen(save, j.world); });
  }

  // Die in dieser Welt eingeführte Sorte, falls ihr Geschenk noch aussteht. Welt 1 verschenkt nichts.
  function giftDue(save, worldId) {
    if (worldId === 1) { return null; }
    for (var i = 0; i < LIST.length; i++) {
      if (LIST[i].world === worldId && !RS.Save.hasSeen(save, 'geschenk:' + LIST[i].kind)) { return LIST[i].kind; }
    }
    return null;
  }

  function giveGift(save, kind) {
    save.jokers[kind] = Math.min(MAX_STOCK, (save.jokers[kind] || 0) + GIFT);
    RS.Save.markSeen(save, 'geschenk:' + kind);
  }

  RS.Jokers = {
    LIST: LIST, KINDS: KINDS, GIFT: GIFT, MAX_STOCK: MAX_STOCK,
    get: get, available: available, giftDue: giftDue, giveGift: giveGift
  };
})(window.RS = window.RS || {});
