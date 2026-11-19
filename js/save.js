(function (RS) {
  'use strict';

  var KEY = 'reihenweise-suesses/v1';
  var MAX_LEVEL = 10;

  function fresh() {
    return {
      version: 2, unlocked: 1, stars: {}, endlessHighscore: 0, prologueSeen: false, finaleSeen: false,
      sticks: 0, jokers: { moves: RS.Shop.START_STOCK, hammer: RS.Shop.START_STOCK }, shopSeen: false
    };
  }

  function defaultStorage() {
    try { return window.localStorage || null; } catch (e) { return null; }
  }

  function isInt(v, min, max) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= min && v <= max;
  }

  function validBase(d) {
    if (!isInt(d.unlocked, 1, MAX_LEVEL)) { return false; }
    if (!d.stars || typeof d.stars !== 'object' || Array.isArray(d.stars)) { return false; }
    var ids = Object.keys(d.stars);
    for (var i = 0; i < ids.length; i++) {
      if (!isInt(d.stars[ids[i]], 0, 3)) { return false; }
    }
    if (typeof d.endlessHighscore !== 'number' || !isFinite(d.endlessHighscore) || d.endlessHighscore < 0) { return false; }
    return typeof d.prologueSeen === 'boolean' && typeof d.finaleSeen === 'boolean';
  }

  function isObject(d) { return !!d && typeof d === 'object' && !Array.isArray(d); }

  function validV2(d) {
    if (!validBase(d)) { return false; }
    if (!isInt(d.sticks, 0, 1e9)) { return false; }
    if (!isObject(d.jokers)) { return false; }
    if (!isInt(d.jokers.moves, 0, RS.Shop.MAX_STOCK) || !isInt(d.jokers.hammer, 0, RS.Shop.MAX_STOCK)) { return false; }
    return typeof d.shopSeen === 'boolean';
  }

  // Ein gültiger Stand der Version 1 behält alles und bekommt die neuen Felder.
  function migrate(d) {
    d.version = 2;
    d.sticks = 0;
    d.jokers = { moves: RS.Shop.START_STOCK, hammer: RS.Shop.START_STOCK };
    d.shopSeen = false;
    return d;
  }

  function load(storage) {
    try {
      var s = storage || defaultStorage();
      if (!s) { return fresh(); }
      var raw = s.getItem(KEY);
      if (raw === null || raw === undefined) { return fresh(); }
      var d = JSON.parse(raw);
      if (!isObject(d)) { return fresh(); }
      if (d.version === 1 && validBase(d)) { return migrate(d); }
      if (d.version === 2 && validV2(d)) { return d; }
      return fresh();
    } catch (e) {
      return fresh();
    }
  }

  function store(data, storage) {
    try {
      var s = storage || defaultStorage();
      if (!s) { return false; }
      s.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function recordLevel(data, levelId, stars) {
    var best = data.stars[levelId] || 0;
    if (stars > best) { data.stars[levelId] = stars; }
    if (stars >= 1) { data.unlocked = Math.min(MAX_LEVEL, Math.max(data.unlocked, levelId + 1)); }
    return data;
  }

  // Trägt einen Sieg aus den Ereignissen eines Zugs ein (sofort, nicht erst nach der
  // Animation) und schreibt die Belohnung gut. Gibt { event, reward } zurück oder null,
  // wenn der Zug nicht gewann.
  function recordWin(data, levelId, events) {
    for (var i = 0; i < events.length; i++) {
      if (events[i].type === 'levelWon') {
        var reward = RS.Shop.winReward(data.stars[levelId] || 0, events[i].stars);
        data.sticks = Math.min(1e9, data.sticks + reward);
        recordLevel(data, levelId, events[i].stars);
        return { event: events[i], reward: reward };
      }
    }
    return null;
  }

  function recordEndless(data, score) {
    if (score > data.endlessHighscore) { data.endlessHighscore = score; }
    var reward = RS.Shop.endlessReward(score);
    data.sticks = Math.min(1e9, data.sticks + reward);
    return reward;
  }

  function reset(storage) {
    try {
      var s = storage || defaultStorage();
      if (s) { s.removeItem(KEY); }
    } catch (e) { /* nothing to reset */ }
  }

  RS.Save = {
    KEY: KEY,
    fresh: fresh,
    load: load,
    store: store,
    recordLevel: recordLevel,
    recordWin: recordWin,
    recordEndless: recordEndless,
    reset: reset
  };
})(window.RS = window.RS || {});
