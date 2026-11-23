(function (RS) {
  'use strict';

  var worlds = [];
  // Boss entries of the old data files must survive: never reassign RS.BOSSES.
  RS.BOSSES = RS.BOSSES || {};

  function need(n, cond, what) {
    if (!cond) { throw new Error('Welt ' + n + ': ' + what); }
  }

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
    // Testwelten dürfen ohne Musik auskommen; ein vorhandenes Motiv muss gültig sein.
    need(n, def.music === undefined || validMusic(def.music), 'music ungültig');
    var b = def.boss;
    need(n, b && typeof b.key === 'string' && b.name && b.hp > 0, 'boss fehlt');
    need(n, Array.isArray(b.weak) && Array.isArray(b.thresholds) && Array.isArray(b.attacks), 'boss weak/thresholds/attacks fehlen');
    need(n, b.weak.length === b.thresholds.length + 1, 'boss.weak braucht ' + (b.thresholds.length + 1) + ' Farben (eine je Phase)');
    need(n, b.attacks.length === b.thresholds.length + 1, 'boss.attacks braucht ' + (b.thresholds.length + 1) + ' Angriffe (einen je Phase)');
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

  function augment(def, w, pos, num) {
    var out = {};
    Object.keys(def).forEach(function (k) { out[k] = def[k]; });
    out.world = w.id;
    out.pos = pos;
    out.num = num;
    out.isBoss = def.boss === true;
    out.seed = def.seed !== undefined ? def.seed : hashSeed(def.id);
    if (out.isBoss) {
      out.boss = w.boss.key;
      out.goals = [{ type: 'boss' }];
    }
    return out;
  }

  RS.Worlds = {
    FINAL_WORLD: 10,
    validMusic: validMusic,
    register: function (def) {
      validate(def);
      RS.Worlds._unregister(def.id);
      worlds.push(def);
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
    },
    list: function () { return sorted(); },
    get: function (id) {
      return worlds.filter(function (w) { return w.id === id; })[0];
    },
    levels: function () {
      var out = [];
      sorted().forEach(function (w) {
        w.levels.forEach(function (l, i) { out.push(augment(l, w, i + 1, out.length + 1)); });
      });
      return out;
    },
    level: function (id) {
      return RS.Worlds.levels().filter(function (l) { return l.id === id; })[0];
    },
    inWorld: function (id) {
      return RS.Worlds.levels().filter(function (l) { return l.world === id; });
    }
  };
})(window.RS = window.RS || {});
