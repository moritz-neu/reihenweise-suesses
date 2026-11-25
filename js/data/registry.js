(function (RS) {
  'use strict';

  var worlds = [];
  // Zwischenlevel je Welt (RS.Worlds.insert): { worldId: [def, ...] }, Kennung <altes Level>-SS.
  var extras = {};
  var cache = null;   // { list, byId, byWorld } - die augmentierte Levelliste, bis sich etwas ändert
  var EXTRA_ID = /^(w\d+-\d{2}[a-z]?)-(\d{2})$/;
  // Boss entries of the old data files must survive: never reassign RS.BOSSES.
  RS.BOSSES = RS.BOSSES || {};

  function need(n, cond, what) {
    if (!cond) { throw new Error('Welt ' + n + ': ' + what); }
  }

  var ATTACK_KINDS = ['lock', 'glaze', 'ice', 'crate', 'fuse', 'chameleon', 'choco'];
  function isLines(v) { return Array.isArray(v) && v.length > 0; }

  // ---------- Musikmotiv einer Welt (wird von RS.Audio abgespielt) ----------
  // { tempo: BPM 60..180, root: MIDI 45..72, scale: Halbtöne ab 0 aufsteigend (5..8),
  //   lead: Klangfarbe, bass: 16 Stufen oder null, drums: 16 Zeichen aus k s h .,
  //   melodies: mindestens 2 Varianten zu je 16 Stufen (null = Pause) }
  var LEADS = ['bell', 'pluck', 'pad', 'marimba', 'chip'];

  function isInt(v, min, max) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= min && v <= max;
  }

  function validSteps(steps, max) {
    return Array.isArray(steps) && steps.length === 16 &&
      steps.every(function (d) { return d === null || isInt(d, 0, max); }) &&
      steps.some(function (d) { return d !== null; });
  }

  function validMusic(m) {
    if (!m || typeof m !== 'object') { return false; }
    if (typeof m.tempo !== 'number' || !(m.tempo >= 60 && m.tempo <= 180)) { return false; }
    if (!isInt(m.root, 45, 72) || LEADS.indexOf(m.lead) === -1) { return false; }
    var sc = m.scale;
    if (!Array.isArray(sc) || sc.length < 5 || sc.length > 8 || sc[0] !== 0) { return false; }
    for (var i = 0; i < sc.length; i++) {
      if (!isInt(sc[i], 0, 11) || (i > 0 && sc[i] <= sc[i - 1])) { return false; }
    }
    var max = sc.length * 3;
    if (m.bass !== null && !validSteps(m.bass, max)) { return false; }
    if (typeof m.drums !== 'string' || !/^[ksh.]{16}$/.test(m.drums)) { return false; }
    return Array.isArray(m.melodies) && m.melodies.length >= 2 &&
      m.melodies.every(function (mel) { return validSteps(mel, max); });
  }

  function validate(def) {
    var n = def && def.id;
    need(n, def && typeof def.id === 'number', 'id fehlt');
    need(n, typeof def.key === 'string' && def.key, 'key fehlt');
    need(n, typeof def.name === 'string' && def.name, 'name fehlt');
    need(n, def.novelty === null || (def.novelty && def.novelty.kind && def.novelty.key), 'novelty fehlt');
    need(n, isLines(def.intro), 'intro fehlt');
    need(n, isLines(def.chapterEnd), 'chapterEnd fehlt');
    need(n, typeof def.gateLocked === 'string' && def.gateLocked, 'gateLocked fehlt');
    need(n, def.winLines === undefined || isLines(def.winLines), 'winLines ungültig');
    // Testwelten dürfen ohne Musik auskommen; ein vorhandenes Motiv muss gültig sein.
    need(n, def.music === undefined || validMusic(def.music), 'music ungültig');
    var b = def.boss;
    need(n, b && typeof b.key === 'string' && b.name && b.hp > 0, 'boss fehlt');
    need(n, Array.isArray(b.weak) && Array.isArray(b.thresholds) && Array.isArray(b.attacks), 'boss weak/thresholds/attacks fehlen');
    need(n, b.weak.length === b.thresholds.length + 1, 'boss.weak braucht ' + (b.thresholds.length + 1) + ' Farben (eine je Phase)');
    need(n, b.attacks.length === b.thresholds.length + 1, 'boss.attacks braucht ' + (b.thresholds.length + 1) + ' Angriffe (einen je Phase)');
    b.attacks.forEach(function (phase, i) {
      var list = Array.isArray(phase) ? phase : [phase];
      need(n, list.length > 0, 'boss.attacks[' + i + '] ist leer');
      list.forEach(function (a, k) {
        var at = 'boss.attacks[' + i + ']' + (Array.isArray(phase) ? '[' + k + ']' : '');
        a = a || {};
        need(n, ATTACK_KINDS.indexOf(a.kind) >= 0, at + '.kind unbekannt');
        need(n, Number.isInteger(a.count) && a.count >= 1, at + '.count ungültig');
        need(n, k > 0 || (Number.isInteger(a.every) && a.every >= 1), at + '.every ungültig');
      });
    });
    need(n, b.story && isLines(b.story.intro) && isLines(b.story.defeat), 'boss.story fehlt');
    b.thresholds.forEach(function (th, i) {
      need(n, isLines(b.story['phase' + (i + 2)]), 'boss.story.phase' + (i + 2) + ' fehlt');
    });
    need(n, isLines(def.levels), 'levels fehlen');
    def.levels.forEach(function (l, i) {
      need(n, l.id && l.layout && l.colors && l.moves, 'Level ' + (i + 1) + ' unvollständig');
      need(n, l.boss === true || isLines(l.goals), 'Level ' + l.id + ' ohne goals');
      need(n, l.intro && l.win, 'Level ' + l.id + ' ohne intro/win');
    });
    need(n, def.levels[def.levels.length - 1].boss === true, 'Boss ist nicht das letzte Level');
    need(n, def.levels.filter(function (l) { return l.boss; }).length === 1, 'genau ein Boss-Level erwartet');
  }

  function hashSeed(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) { h = (h * 31 + id.charCodeAt(i)) >>> 0; }
    return 1000 + h;
  }

  function sorted() {
    return worlds.slice().sort(function (a, b) { return a.id - b.id; });
  }

  // slot: Platz des alten Levels (1..slots), step: 0 = altes Level, 1..10 = Zwischenlevel danach.
  function augment(def, w, pos, num, slot, step, slots) {
    var out = {};
    Object.keys(def).forEach(function (k) { out[k] = def[k]; });
    out.world = w.id;
    out.pos = pos;
    out.num = num;
    out.slot = slot;
    out.step = step;
    out.slots = slots;
    out.label = w.id + '-' + pos;
    out.isBoss = def.boss === true;
    out.seed = def.seed !== undefined ? def.seed : hashSeed(def.id);
    if (out.isBoss) {
      out.boss = w.boss.key;
      out.goals = [{ type: 'boss' }];
    }
    return out;
  }

  function build() {
    var list = [];
    var byId = {};
    var byWorld = {};
    sorted().forEach(function (w) {
      var mine = byWorld[w.id] = [];
      var ext = extras[w.id] || [];
      var slots = w.levels.length;
      w.levels.forEach(function (l, i) {
        var row = [l];
        ext.forEach(function (e) { if (EXTRA_ID.exec(e.id)[1] === l.id) { row.push(e); } });
        row.forEach(function (d, k) {
          var a = augment(d, w, mine.length + 1, list.length + 1, i + 1, k, slots);
          mine.push(a);
          list.push(a);
          byId[a.id] = a;
        });
      });
    });
    return { list: list, byId: byId, byWorld: byWorld };
  }

  function levelsCache() {
    if (!cache) { cache = build(); }
    return cache;
  }

  function validateExtra(w, l, oldIds) {
    var n = w.id;
    var m = EXTRA_ID.exec(l && l.id || '');
    need(n, m, 'Zwischenlevel-Kennung ungültig: ' + (l && l.id));
    need(n, oldIds[m[1]] && !oldIds[m[1]].boss, 'Zwischenlevel ' + l.id + ' ohne passendes altes Level');
    need(n, l.layout && l.colors && l.moves && isLines(l.goals) && l.intro && l.win, 'Zwischenlevel ' + l.id + ' unvollständig');
    need(n, !l.boss, 'Zwischenlevel ' + l.id + ' darf kein Boss sein');
  }

  RS.Worlds = {
    FINAL_WORLD: 10,
    hashSeed: hashSeed,
    // Fügt die Zwischenlevel einer registrierten Welt ein (ersetzt frühere Zwischenlevel).
    // Reihenfolge je altem Level nach der Kennung (…-01 bis …-10).
    insert: function (worldId, levels) {
      var w = RS.Worlds.get(worldId);
      need(worldId, w, 'Welt nicht registriert');
      var oldIds = {};
      w.levels.forEach(function (l) { oldIds[l.id] = l; });
      var seen = {};
      levels.forEach(function (l) {
        validateExtra(w, l, oldIds);
        need(worldId, !seen[l.id], 'Zwischenlevel doppelt: ' + l.id);
        seen[l.id] = true;
      });
      extras[worldId] = levels.slice().sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
      cache = null;
    },
    validMusic: validMusic,
    register: function (def) {
      validate(def);
      RS.Worlds._unregister(def.id);
      worlds.push(def);
      cache = null;
      var b = def.boss;
      RS.BOSSES[b.key] = { name: b.name, hp: b.hp, weak: b.weak, thresholds: b.thresholds, attacks: b.attacks };
    },
    // Test helper: removes a world and its boss from RS.BOSSES.
    _unregister: function (id) {
      worlds = worlds.filter(function (w) {
        if (w.id !== id) { return true; }
        delete RS.BOSSES[w.boss.key];
        return false;
      });
      delete extras[id];
      cache = null;
    },
    list: function () { return sorted(); },
    get: function (id) {
      return worlds.filter(function (w) { return w.id === id; })[0];
    },
    // Alle Level in Spielreihenfolge (zwischengespeichert; die Objekte nicht verändern).
    levels: function () { return levelsCache().list; },
    level: function (id) { return levelsCache().byId[id]; },
    inWorld: function (id) { return levelsCache().byWorld[id] || []; }
  };
})(window.RS = window.RS || {});
