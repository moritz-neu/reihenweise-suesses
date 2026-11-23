(function (RS) {
  'use strict';

  var KEY = 'reihenweise-suesses/v1';
  var MAX_LEVEL = 20;
  var LEGACY_KINDS = ['moves', 'hammer'];

  function kinds() { return RS.Jokers.KINDS; }

  function startJokers() {
    var j = {};
    kinds().forEach(function (k) { j[k] = LEGACY_KINDS.indexOf(k) !== -1 ? RS.Shop.START_STOCK : 0; });
    return j;
  }

  var SETTINGS = { music: true, sfx: true };

  function fresh() {
    return { version: 4, stars: {}, seen: [], sticks: 0, jokers: startJokers(), endlessHighscore: 0, completed: false,
      settings: fillSettings(null) };
  }

  function defaultStorage() {
    try { return window.localStorage || null; } catch (e) { return null; }
  }

  function isInt(v, min, max) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= min && v <= max;
  }

  function isObject(d) { return !!d && typeof d === 'object' && !Array.isArray(d); }

  function validStars(stars) {
    if (!isObject(stars)) { return false; }
    return Object.keys(stars).every(function (id) { return isInt(stars[id], 0, 3); });
  }

  function validScore(d) {
    return typeof d.endlessHighscore === 'number' && isFinite(d.endlessHighscore) && d.endlessHighscore >= 0;
  }

  function validBase(d) {
    if (!isInt(d.unlocked, 1, MAX_LEVEL)) { return false; }
    if (!validStars(d.stars) || !validScore(d)) { return false; }
    return typeof d.prologueSeen === 'boolean' && typeof d.finaleSeen === 'boolean';
  }

  function validV2(d) {
    if (!validBase(d)) { return false; }
    if (!isInt(d.sticks, 0, 1e9)) { return false; }
    if (!isObject(d.jokers)) { return false; }
    if (!isInt(d.jokers.moves, 0, RS.Jokers.MAX_STOCK) || !isInt(d.jokers.hammer, 0, RS.Jokers.MAX_STOCK)) { return false; }
    return typeof d.shopSeen === 'boolean';
  }

  function validV3(d) {
    if (!validV2(d)) { return false; }
    return typeof d.gateOpenSeen === 'boolean' && typeof d.world2IntroSeen === 'boolean' &&
      typeof d.grandFinaleSeen === 'boolean';
  }

  // Jede Sorte ist ein Bestand von 0 bis MAX_STOCK; fehlt eine Sorte, bekommt sie 0.
  // Gibt null zurück, wenn ein vorhandener Wert ungültig ist.
  function fillJokers(jokers) {
    if (!isObject(jokers)) { return null; }
    var out = {};
    var ok = true;
    kinds().forEach(function (k) {
      if (jokers[k] === undefined) { out[k] = 0; return; }
      if (!isInt(jokers[k], 0, RS.Jokers.MAX_STOCK)) { ok = false; }
      out[k] = jokers[k];
    });
    // Unbekannte Sorten (etwa aus einer neueren Version) bleiben erhalten, solange der Wert gültig ist.
    Object.keys(jokers).forEach(function (k) {
      if (out[k] === undefined && isInt(jokers[k], 0, RS.Jokers.MAX_STOCK)) { out[k] = jokers[k]; }
    });
    return ok ? out : null;
  }

  // Musik und Effekte: jeder fehlende oder ungültige Schalter bekommt seinen Standardwert,
  // der übrige Spielstand bleibt gültig.
  function fillSettings(settings) {
    var src = isObject(settings) ? settings : {};
    var out = {};
    Object.keys(SETTINGS).forEach(function (k) {
      out[k] = typeof src[k] === 'boolean' ? src[k] : SETTINGS[k];
    });
    return out;
  }

  function validV4(d) {
    if (!validStars(d.stars) || !validScore(d)) { return false; }
    if (!Array.isArray(d.seen) || !d.seen.every(function (k) { return typeof k === 'string'; })) { return false; }
    if (!isInt(d.sticks, 0, 1e9)) { return false; }
    return typeof d.completed === 'boolean' && fillJokers(d.jokers) !== null;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Levelnummer 1..20 der alten Stände -> Kennung w1-01 ... w2-10.
  function legacyId(n) {
    return n <= 10 ? 'w1-' + pad(n) : 'w2-' + pad(n - 10);
  }

  function legacyStars(old) {
    var out = {};
    Object.keys(old).forEach(function (key) {
      var n = Number(key);
      var id = /^\d+$/.test(key) && n >= 1 && n <= MAX_LEVEL ? legacyId(n) : key;
      out[id] = old[key];
    });
    return out;
  }

  // Ein gültiger Stand der Versionen 1 bis 3 wird verlustfrei zu Version 4.
  function migrateLegacy(d) {
    var flags = [
      [d.prologueSeen, 'prolog'], [d.shopSeen, 'laden'], [d.finaleSeen, 'kapitel:1'],
      [d.grandFinaleSeen, 'kapitel:2'], [d.gateOpenSeen, 'tor:1'], [d.world2IntroSeen, 'intro:2']
    ];
    var out = fresh();
    out.stars = legacyStars(d.stars);
    flags.forEach(function (f) { if (f[0]) { out.seen.push(f[1]); } });
    out.endlessHighscore = d.endlessHighscore;
    if (d.version >= 2) {
      out.sticks = d.sticks;
      out.jokers = fillJokers(d.jokers);
    }
    return out;
  }

  function load(storage) {
    try {
      var s = storage || defaultStorage();
      if (!s) { return fresh(); }
      var raw = s.getItem(KEY);
      if (raw === null || raw === undefined) { return fresh(); }
      var d = JSON.parse(raw);
      if (!isObject(d)) { return fresh(); }
      if (d.version === 1 && validBase(d)) { return migrateLegacy(d); }
      if (d.version === 2 && validV2(d)) { return migrateLegacy(d); }
      if (d.version === 3 && validV3(d)) { return migrateLegacy(d); }
      if (d.version === 4 && validV4(d)) {
        d.jokers = fillJokers(d.jokers);
        d.settings = fillSettings(d.settings);
        return d;
      }
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

  function hasSeen(data, key) { return data.seen.indexOf(key) !== -1; }

  function markSeen(data, key) {
    if (!hasSeen(data, key)) { data.seen.push(key); }
    return data;
  }

  // Trägt einen Sieg aus den Ereignissen eines Zugs ein (sofort, nicht erst nach der
  // Animation) und schreibt die Belohnung gut. Gibt { event, reward } zurück oder null,
  // wenn der Zug nicht gewann.
  function recordWin(data, levelId, events) {
    var level = RS.Worlds.level(levelId);
    var worldId = level ? level.world : 1;
    for (var i = 0; i < events.length; i++) {
      if (events[i].type === 'levelWon') {
        var prev = data.stars[levelId] || 0;
        var reward = RS.Shop.winReward(prev, events[i].stars, worldId);
        data.sticks = Math.min(1e9, data.sticks + reward);
        if (events[i].stars > prev) { data.stars[levelId] = events[i].stars; }
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
    hasSeen: hasSeen,
    markSeen: markSeen,
    legacyId: legacyId,
    recordWin: recordWin,
    recordEndless: recordEndless,
    reset: reset
  };
})(window.RS = window.RS || {});
