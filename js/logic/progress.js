(function (RS) {
  'use strict';

  function won(save, id) { return (save.stars[id] || 0) >= 1; }

  function bossOf(worldId) {
    var lv = RS.Worlds.inWorld(worldId);
    return lv.length ? lv[lv.length - 1] : null;
  }

  function isWon(save, id) { return won(save, id); }

  // Welt 1 ist immer offen; jede weitere, wenn der Boss der Welt davor besiegt ist.
  function isWorldOpen(save, worldId) {
    if (worldId === 1) { return true; }
    if (!RS.Worlds.get(worldId - 1)) { return false; }
    var boss = bossOf(worldId - 1);
    return !!boss && won(save, boss.id);
  }

  // Spielbar: erstes Level einer offenen Welt, Vorgänger gewonnen oder irgendein späteres gewonnen.
  function isPlayable(save, id) {
    var level = RS.Worlds.level(id);
    if (!level || !isWorldOpen(save, level.world)) { return false; }
    var lv = RS.Worlds.inWorld(level.world);
    var idx = level.pos - 1;
    if (idx === 0 || won(save, lv[idx - 1].id)) { return true; }
    for (var i = idx + 1; i < lv.length; i++) {
      if (won(save, lv[i].id)) { return true; }
    }
    return false;
  }

  // Die Welt, in der die Karte öffnet: die erste offene Welt, deren Boss noch steht,
  // sonst die letzte vorhandene Welt.
  function startWorld(save) {
    var list = RS.Worlds.list();
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (isWorldOpen(save, w.id) && !won(save, bossOf(w.id).id)) { return w.id; }
    }
    return list.length ? list[list.length - 1].id : 1;
  }

  // Das erste spielbare, noch nicht gewonnene Level in der Reihenfolge der Welten, sonst null.
  function nextLevel(save) {
    var all = RS.Worlds.levels();
    for (var i = 0; i < all.length; i++) {
      if (!won(save, all[i].id) && isPlayable(save, all[i].id)) { return all[i].id; }
    }
    return null;
  }

  function worldStars(save, worldId) {
    var lv = RS.Worlds.inWorld(worldId);
    var stars = 0;
    lv.forEach(function (l) { stars += save.stars[l.id] || 0; });
    return { stars: stars, max: lv.length * 3 };
  }

  // Summe der Sterne aller registrierten Level; unbekannte Kennungen im Spielstand zählen nicht.
  function totalStars(save) {
    var sum = 0;
    RS.Worlds.levels().forEach(function (l) { sum += save.stars[l.id] || 0; });
    return sum;
  }

  // Abgeschlossen: die letzte Welt ist vorhanden und ihr Boss besiegt.
  function isComplete(save) {
    if (!RS.Worlds.get(RS.Worlds.FINAL_WORLD)) { return false; }
    var boss = bossOf(RS.Worlds.FINAL_WORLD);
    return !!boss && won(save, boss.id);
  }

  // Setzt save.completed, sobald der Boss der letzten Welt besiegt ist; true, wenn sich
  // dabei etwas geändert hat. Ein abgeschlossenes Spiel bleibt abgeschlossen.
  function markComplete(save) {
    if (save.completed || !isComplete(save)) { return false; }
    save.completed = true;
    return true;
  }

  RS.Progress = {
    isWon: isWon, isWorldOpen: isWorldOpen, isPlayable: isPlayable, startWorld: startWorld,
    nextLevel: nextLevel, worldStars: worldStars, totalStars: totalStars, isComplete: isComplete,
    markComplete: markComplete
  };
})(window.RS = window.RS || {});
