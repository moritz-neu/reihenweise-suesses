(function (RS) {
  'use strict';

  // Musik und Soundeffekte, vollständig zur Laufzeit mit der Web Audio API erzeugt:
  // Oszillatoren, Hüllkurven, Filter und Rauschen. Keine Dateien, kein Netz.
  // Ohne AudioContext (alte Browser, Tests) ist jede Funktion ein stiller No-op.

  var MUSIC_GAIN = 0.12;
  var SFX_GAIN = 0.35;
  var FADE = 0.8;          // Überblenden zwischen zwei Stücken
  var OFF_FADE = 0.25;     // Ausblenden, wenn die Musik abgeschaltet wird
  var LOOKAHEAD = 0.15;    // so weit im Voraus werden Noten geplant
  var TICK_MS = 40;
  var MERGE = 0.04;        // gleiche Effekte innerhalb von 40 ms klingen einmal
  var LOOP_BARS = 8;
  var ORDER = [0, 1, 0, 2, 0, 1, 2, 1];   // Melodie-Variante je Takt der Schleife

  var ctx = null;
  var buses = null;        // { music, sfx }
  var tracks = [];         // laufende Stücke; höchstens eines ohne stopAt
  var timer = 0;
  var desired = null;      // { id, boss, endless }: was gerade laufen soll
  var settings = { music: true, sfx: true };
  var stage = 1;           // aktuelle Kaskadenstufe (für die Tonhöhe von `cleared`)
  var lastPlayed = {};
  var pending = {};        // Effekte, die auf resume() warten: höchstens einer je Merge-Schlüssel
  var resuming = false;    // ein resume() läuft noch
  var PENDING_MAX_AGE = 1500;   // ms: ein wartender Effekt klingt später nicht mehr nach
  var warned = {};         // Funktionen, die schon eine Warnung geloggt haben
  var clock = defaultClock;

  function defaultClock() {
    return window.performance && window.performance.now ? window.performance.now() : Date.now();
  }

  // Die erste gefangene Störung je Funktion wird einmal gemeldet, weitere bleiben still.
  function warnOnce(fn, e) {
    if (warned[fn]) { return; }
    warned[fn] = true;
    try { console.warn('Reihenweise Süßes Audio: ' + fn + ': ' + (e && e.message ? e.message : e)); } catch (x) { /* still bleiben */ }
  }

  // Hält den aktuellen Wert eines Parameters ab now fest, bevor Geplantes verworfen wird.
  function holdParam(p, now) {
    if (p.cancelAndHoldAtTime) { p.cancelAndHoldAtTime(now); return; }
    var held = p.value;
    p.cancelScheduledValues(now);
    p.setValueAtTime(held, now);
  }

  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // ---------- Bausteine: Hüllkurve, Ton, Rauschen ----------

  // Verbindet src über eine Hüllkurve mit dest; gibt das Ende der Hüllkurve zurück.
  function envelope(c, src, dest, t, a, hold, dec, g) {
    var v = c.createGain();
    v.gain.setValueAtTime(0.0001, t);
    v.gain.linearRampToValueAtTime(g, t + a);
    if (hold > 0) { v.gain.setValueAtTime(g, t + a + hold); }
    v.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + dec);
    src.connect(v);
    v.connect(dest);
    return t + a + hold + dec;
  }

  function filter(c, type, f, t, o) {
    var bq = c.createBiquadFilter();
    bq.type = type;
    bq.frequency.setValueAtTime(f, t);
    if (o.fTo) { bq.frequency.exponentialRampToValueAtTime(o.fTo, t + (o.fTime || o.dec)); }
    bq.Q.setValueAtTime(o.q || 0.7, t);
    return bq;
  }

  // o = { type, f, to?, glide?, detune?, lp?, fTo?, q?, a?, hold?, dec, g }
  function tone(c, dest, t, o) {
    var osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) { osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || o.dec)); }
    if (o.detune) { osc.detune.setValueAtTime(o.detune, t); }
    var out = osc;
    if (o.lp) {
      out = filter(c, 'lowpass', o.lp, t, o);
      osc.connect(out);
    }
    var end = envelope(c, out, dest, t, o.a || 0.004, o.hold || 0, o.dec, o.g);
    osc.start(t);
    osc.stop(end + 0.05);
  }

  function noiseBuffer(c) {
    if (!c._rsNoise) {
      var len = Math.floor(c.sampleRate * 2);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      var seed = 12345;
      for (var i = 0; i < len; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        data[i] = seed / 0x3fffffff - 1;
      }
      c._rsNoise = buf;
    }
    return c._rsNoise;
  }

  // o = { filter: 'bandpass'|'highpass'|'lowpass', f, fTo?, q?, a?, hold?, dec, g }
  function noise(c, dest, t, o) {
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    var bq = filter(c, o.filter || 'bandpass', o.f, t, o);
    src.connect(bq);
    var end = envelope(c, bq, dest, t, o.a || 0.002, o.hold || 0, o.dec, o.g);
    src.start(t, Math.random() * 0.5);
    src.stop(end + 0.05);
  }

  // Tonfolge: freqs nacheinander im Abstand step, jeder Ton mit den Angaben o.
  function run(c, dest, t, freqs, step, o) {
    freqs.forEach(function (f, i) {
      var p = {};
      Object.keys(o).forEach(function (k) { p[k] = o[k]; });
      p.f = f;
      tone(c, dest, t + i * step, p);
    });
  }

  // ---------- Klangfarben der Musik ----------
  // Jede Stimme: (c, dest, t, midi, dur, vel)

  var VOICES = {
    // Glockenspiel: reiner Grundton mit kurzen, hellen Teiltönen.
    bell: function (c, d, t, m, dur, v) {
      var f = hz(m);
      tone(c, d, t, { f: f, dec: 1.1, g: 0.42 * v });
      tone(c, d, t, { f: f * 2.0, dec: 0.45, g: 0.1 * v });
      tone(c, d, t, { f: f * 3.01, dec: 0.18, g: 0.06 * v });
    },
    // Gezupfte Saite: Sägezahn, dessen Tiefpass schnell zufällt.
    pluck: function (c, d, t, m, dur, v) {
      var f = hz(m);
      tone(c, d, t, { type: 'sawtooth', f: f, lp: Math.min(f * 6, 6000), fTo: f * 1.2, fTime: 0.25,
        q: 1.2, dec: Math.min(0.6, dur + 0.25), g: 0.3 * v });
      tone(c, d, t, { type: 'triangle', f: f, dec: 0.4, g: 0.12 * v });
    },
    // Weiche Fläche aus zwei verstimmten Sägezähnen, dazu hohe Glöckchen.
    pad: function (c, d, t, m, dur, v) {
      var f = hz(m);
      var hold = Math.max(0.05, dur - 0.3);
      [-7, 7].forEach(function (cents) {
        tone(c, d, t, { type: 'sawtooth', f: f, detune: cents, lp: 1100, a: 0.25, hold: hold, dec: 0.6, g: 0.13 * v });
      });
      tone(c, d, t, { f: f * 4, dec: 0.7, g: 0.07 * v });
      tone(c, d, t + 0.09, { f: f * 6, dec: 0.4, g: 0.035 * v });
    },
    // Marimba: Holzklang mit kurzem Anschlag im vierfachen Teilton.
    marimba: function (c, d, t, m, dur, v) {
      var f = hz(m);
      tone(c, d, t, { f: f, dec: 0.45, g: 0.5 * v });
      tone(c, d, t, { f: f * 3.93, dec: 0.06, g: 0.12 * v });
      tone(c, d, t, { type: 'triangle', f: f * 2, dec: 0.12, g: 0.06 * v });
    },
    // Chiptune: gefilterte Rechteckwelle.
    chip: function (c, d, t, m, dur, v) {
      tone(c, d, t, { type: 'square', f: hz(m), lp: 2400, hold: Math.min(dur * 0.6, 0.2), dec: 0.12, g: 0.16 * v });
    }
  };

  function bassVoice(c, d, t, m, dur, v, boss) {
    var f = hz(m);
    if (boss) {
      tone(c, d, t, { type: 'sawtooth', f: f, lp: 520, fTo: 180, fTime: 0.3, q: 2, hold: Math.min(dur * 0.5, 0.3),
        dec: 0.3, g: 0.3 * v });
      tone(c, d, t, { f: f / 2, hold: Math.min(dur * 0.5, 0.3), dec: 0.3, g: 0.28 * v });
    } else {
      // gezupfter Bass
      tone(c, d, t, { type: 'triangle', f: f, lp: 700, fTo: 250, fTime: 0.3, dec: Math.min(0.55, dur + 0.15), g: 0.42 * v });
    }
  }

  // Leise Begleitakkorde über den ganzen Takt.
  function chordVoice(c, d, t, notes, dur, gain, boss) {
    notes.forEach(function (m) {
      tone(c, d, t, { type: 'triangle', f: hz(m), lp: boss ? 600 : 900, a: 0.3, hold: Math.max(0.1, dur - 0.7),
        dec: 0.5, g: gain });
    });
  }

  // Schlagzeug: Kick, Schlag (Snare, Besen, Handtrommel oder Tom) und Becken/Schüttelrohr.
  var DRUMS = {
    kick: function (c, d, t, v) {
      tone(c, d, t, { f: 130, to: 45, glide: 0.12, dec: 0.28, g: 0.45 * v });
    },
    snare: function (c, d, t, v) {
      noise(c, d, t, { filter: 'bandpass', f: 1800, q: 0.8, dec: 0.13, g: 0.32 * v });
      tone(c, d, t, { type: 'triangle', f: 190, dec: 0.06, g: 0.18 * v });
    },
    brush: function (c, d, t, v) {
      noise(c, d, t, { filter: 'bandpass', f: 3200, q: 0.6, a: 0.02, dec: 0.2, g: 0.13 * v });
    },
    hand: function (c, d, t, v) {
      tone(c, d, t, { f: 380, to: 290, glide: 0.06, dec: 0.09, g: 0.32 * v });
      noise(c, d, t, { filter: 'highpass', f: 3000, dec: 0.03, g: 0.12 * v });
    },
    tom: function (c, d, t, v) {
      tone(c, d, t, { f: 230, to: 150, glide: 0.12, dec: 0.18, g: 0.42 * v });
    },
    hat: function (c, d, t, v) {
      noise(c, d, t, { filter: 'highpass', f: 7000, dec: 0.04, g: 0.11 * v });
    },
    shaker: function (c, d, t, v) {
      noise(c, d, t, { filter: 'bandpass', f: 6200, q: 1.5, a: 0.015, dec: 0.06, g: 0.1 * v });
    }
  };

  // Welche Trommeln zu welcher Klangfarbe passen.
  var KITS = {
    bell: { s: 'snare', h: 'hat' },
    pad: { s: 'brush', h: 'hat' },
    pluck: { s: 'hand', h: 'shaker' },
    marimba: { s: 'tom', h: 'shaker' },
    chip: { s: 'snare', h: 'hat' }
  };

  // ---------- Motiv -> spielbare Fassung ----------

  // Dunkler machen: große Terz, Sexte, Septime und übermäßige Quarte rücken einen Halbton tiefer.
  var DARKER = { 4: 3, 6: 5, 9: 8, 11: 10 };

  function darken(scale) {
    var out = [];
    scale.forEach(function (s) {
      var d = DARKER[s] !== undefined ? DARKER[s] : s;
      if (out.indexOf(d) === -1) { out.push(d); }
    });
    return out.sort(function (a, b) { return a - b; });
  }

  // Akkordfolge der Schleife: nur Stufen, über denen die Skala eine reine Quinte hat.
  function progression(scale) {
    var picks = [3, 4, 5, 1, 2, 6].filter(function (s) {
      return s < scale.length && scale.indexOf((scale[s] + 7) % 12) !== -1;
    });
    while (picks.length < 3) { picks.push(0); }
    return [0, picks[0], picks[1], 0, picks[2], picks[0], picks[1], 0];
  }

  // opts.boss: Moll bzw. dunkler, etwa 15 % schneller, kräftigerer Bass und Trommeln.
  // opts.endless: etwas schneller.
  function variant(m, opts) {
    opts = opts || {};
    var boss = Boolean(opts.boss);
    var tempo = m.tempo * (boss ? 1.15 : opts.endless ? 1.08 : 1);
    var scale = boss ? darken(m.scale) : m.scale.slice();
    var root = boss && m.root >= 66 ? m.root - 12 : m.root;
    var bassBase = root;
    while (bassBase > 47) { bassBase -= 12; }
    var drums = m.drums;
    if (boss) {
      drums = drums.split('').map(function (ch, i) { return i % 8 === 0 ? 'k' : ch; }).join('');
    }
    return {
      tempo: tempo, stepDur: 60 / tempo / 4, root: root, scale: scale, lead: m.lead, bass: m.bass,
      drums: drums, melodies: m.melodies, prog: progression(scale), boss: boss, bassBase: bassBase,
      kit: KITS[m.lead]
    };
  }

  // Stufe (darf negativ sein oder über die Skala hinausgehen) -> MIDI-Ton ab base.
  function note(v, base, deg) {
    var len = v.scale.length;
    var oct = Math.floor(deg / len);
    return base + v.scale[deg - oct * len] + 12 * oct;
  }

  // Schritte bis zum nächsten Ton derselben Spur (für Haltetöne).
  function span(steps, i) {
    var n = 1;
    while (i + n < 16 && steps[i + n] === null) { n++; }
    return n;
  }

  // Plant alles, was in Takt `bar`, Schritt `step` (Sechzehntel) erklingt; gibt die Zahl der Noten zurück.
  function stepNotes(c, dest, v, bar, step, t) {
    var sd = v.stepDur;
    var inLoop = bar % LOOP_BARS;
    var loop = Math.floor(bar / LOOP_BARS);
    var shift = v.prog[inLoop];
    var len = v.scale.length;
    var melShift = shift > len / 2 ? shift - len : shift;   // Melodie höchstens drei Stufen verschieben
    var mel = v.melodies[(ORDER[inLoop] + loop) % v.melodies.length];
    var accent = step % 4 === 0 ? 1 : 0.78;
    var count = 0;

    if (step === 0) {
      var chord = [0, 2, 4].map(function (d) {
        var m = note(v, v.bassBase + 12, d + shift);
        return m > v.bassBase + 26 ? m - 12 : m;
      });
      chordVoice(c, dest, t, chord, 16 * sd, v.lead === 'pad' ? 0.035 : 0.05, v.boss);
      count++;
    }
    var d = mel[step];
    if (d !== null && d !== undefined) {
      VOICES[v.lead](c, dest, t, note(v, v.root, d + melShift), span(mel, step) * sd, accent);
      count++;
    }
    if (v.bass && v.bass[step] !== null && v.bass[step] !== undefined) {
      var b = note(v, v.bassBase, v.bass[step] + shift);
      while (b > v.bassBase + 14) { b -= 12; }
      bassVoice(c, dest, t, b, span(v.bass, step) * sd, v.boss ? 1.25 : 1, v.boss);
      count++;
    }
    var hit = v.drums.charAt(step);
    if (hit !== '.') {
      var vel = (v.boss ? 1.25 : 1) * accent;
      if (hit === 'k') { DRUMS.kick(c, dest, t, vel); } else { DRUMS[v.kit[hit]](c, dest, t, vel); }
      count++;
    }
    return count;
  }

  // Ein ganzer Takt ab t (für Tests und als Bezug für die Sequenzer-Schritte).
  function bar(c, dest, m, opts, index, t) {
    var v = variant(m, opts);
    var n = 0;
    for (var s = 0; s < 16; s++) { n += stepNotes(c, dest, v, index, s, t + s * v.stepDur); }
    return n;
  }

  // ---------- Sequenzer mit Vorausplanung ----------

  function keyOf(want) {
    return want.id + (want.boss ? ':boss' : '') + (want.endless ? ':endless' : '');
  }

  function current() {
    return tracks.filter(function (tr) { return tr.stopAt === null; })[0] || null;
  }

  function tick() {
    try {
      if (!ctx) { return; }
      var now = ctx.currentTime;
      tracks = tracks.filter(function (tr) {
        if (tr.stopAt !== null && now > tr.stopAt + 1.2) {
          tr.gain.disconnect();
          return false;
        }
        return true;
      });
      tracks.forEach(function (tr) {
        if (tr.nextTime < now) { tr.nextTime = now + 0.05; }   // nach einer Pause neu ansetzen
        while (tr.nextTime < now + LOOKAHEAD && (tr.stopAt === null || tr.nextTime < tr.stopAt)) {
          stepNotes(ctx, tr.gain, tr.v, tr.bar, tr.step, tr.nextTime);
          tr.nextTime += tr.v.stepDur;
          tr.step++;
          if (tr.step === 16) { tr.step = 0; tr.bar++; }
        }
      });
      if (!tracks.length) { stopTimer(); }
    } catch (e) { warnOnce('tick', e); stopTimer(); }
  }

  function startTimer() {
    if (!timer && tracks.length) { timer = setInterval(tick, TICK_MS); }
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = 0; }
  }

  function fadeOut(tr, dur) {
    var now = ctx.currentTime;
    holdParam(tr.gain.gain, now);
    tr.gain.gain.linearRampToValueAtTime(0.0001, now + dur);
    tr.stopAt = now + dur;
  }

  // Bringt die laufende Musik in Einklang mit `desired` und den Einstellungen.
  function apply() {
    if (!ctx) { return; }
    var want = desired && settings.music ? desired : null;
    var key = want ? keyOf(want) : null;
    var cur = current();
    if (cur && cur.key === key) { return; }
    if (cur) { fadeOut(cur, key ? FADE : OFF_FADE); }
    var world = want && RS.Worlds ? RS.Worlds.get(want.id) : null;
    if (world && validMusic(world.music)) {
      var now = ctx.currentTime;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(1, now + FADE);
      g.connect(buses.music);
      tracks.push({ key: key, v: variant(world.music, want), gain: g, bar: 0, step: 0, nextTime: now + 0.06, stopAt: null });
    }
    if (!document.hidden) { startTimer(); }
    tick();
  }

  // ---------- Effekte ----------

  function clearedFreq(s) { return 523.25 * Math.pow(2, (Math.min(Math.max(s, 1), 12) - 1) * 2 / 12); }

  var KIT = {
    tone: tone, noise: noise, run: run, hz: hz, voices: VOICES, clearedFreq: clearedFreq,
    stage: function () { return stage; }
  };

  function table() { return RS.AudioSfx || {}; }

  function hasEffect(type) {
    return typeof type === 'string' && Object.prototype.hasOwnProperty.call(table(), type);
  }

  // Plant den Effekt zu `event` auf c ab t; true, wenn etwas erklingt.
  function effect(c, dest, event, t) {
    if (!event || !hasEffect(event.type)) { return false; }
    return table()[event.type](KIT, c, dest, t, event) !== false;
  }

  // Musik kurz leiser bei Sieg, Niederlage und Bosssieg.
  function duck() {
    var g = buses.music.gain;
    var now = ctx.currentTime;
    holdParam(g, now);
    g.linearRampToValueAtTime(MUSIC_GAIN * 0.35, now + 0.08);
    g.setValueAtTime(MUSIC_GAIN * 0.35, now + 1.8);
    g.linearRampToValueAtTime(MUSIC_GAIN, now + 2.6);
  }
  var DUCK = { levelWon: true, levelLost: true, bossDefeated: true, endlessOver: true };

  // ---------- AudioContext ----------

  function validMusic(m) {
    return Boolean(RS.Worlds && RS.Worlds.validMusic && RS.Worlds.validMusic(m));
  }

  function onVisibility() {
    if (!ctx) { return; }
    try {
      if (document.hidden) {
        stopTimer();
        if (ctx.suspend) { ctx.suspend().catch(function () {}); }
      } else {
        if (ctx.resume) { ctx.resume().catch(function () {}); }
        startTimer();
      }
    } catch (e) { warnOnce('onVisibility', e); }
  }

  // Erzeugt den Kontext beim ersten Mal: Musik- und Effektbus über einen Kompressor.
  function ensure() {
    if (ctx) { return true; }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { return false; }
    try {
      var c = new Ctor();
      var comp = c.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      comp.connect(c.destination);
      var music = c.createGain();
      music.gain.value = MUSIC_GAIN;
      music.connect(comp);
      var sfx = c.createGain();
      sfx.gain.value = SFX_GAIN;
      sfx.connect(comp);
      ctx = c;
      buses = { music: music, sfx: sfx };
      document.addEventListener('visibilitychange', onVisibility);
      return true;
    } catch (e) {
      ctx = null;
      buses = null;
      return false;
    }
  }

  // ---------- Öffentliche Schnittstelle ----------

  // Ein Kontext, der weder läuft noch geschlossen ist ('suspended', Safaris 'interrupted'),
  // wird fortgesetzt; danach erklingen die wartenden Effekte.
  function needsResume() {
    return ctx.state !== 'running' && ctx.state !== 'closed' && !document.hidden;
  }

  // Wirft resume() sofort, fällt das Wartende weg und die Sperre fällt, die nächste Geste versucht es neu.
  function resume(caller) {
    resuming = true;
    var p;
    try { p = ctx.resume(); } catch (e) {
      resuming = false;
      pending = {};
      warnOnce(caller, e);
      return;
    }
    var done = function () { resuming = false; flush(); };
    if (p && typeof p.then === 'function') {
      p.then(done, function () { resuming = false; pending = {}; });
    } else {
      done();
    }
  }

  // Spielt die wartenden Effekte; was länger als 1,5 s wartet, fällt weg.
  function flush() {
    try {
      var list = pending;
      pending = {};
      if (!ctx || ctx.state !== 'running' || !settings.sfx) { return; }
      var now = clock();
      Object.keys(list).forEach(function (key) {
        if (now - list[key].at <= PENDING_MAX_AGE) { fire(list[key].event, key); }
      });
    } catch (e) { warnOnce('flush', e); }
  }

  // Nach einer Nutzeraktion: Kontext erzeugen bzw. fortsetzen, gewünschte Musik starten.
  // Jede Geste ruft resume() auf, solange der Kontext nicht läuft: Ein früheres resume()
  // außerhalb einer Geste kann unbeantwortet hängen bleiben.
  function unlock() {
    try {
      if (!ensure()) { return; }
      if (needsResume()) { resume('unlock'); }
      apply();
    } catch (e) { warnOnce('unlock', e); }
  }

  function setSettings(s) {
    try {
      if (!s || typeof s !== 'object') { return; }
      if (typeof s.music === 'boolean') { settings.music = s.music; }
      if (typeof s.sfx === 'boolean') { settings.sfx = s.sfx; }
      apply();
    } catch (e) { warnOnce('setSettings', e); }
  }

  // music(worldId, { boss, endless }) startet oder blendet über; music(null) blendet aus.
  function music(worldId, opts) {
    try {
      opts = opts || {};
      desired = worldId ? { id: worldId, boss: Boolean(opts.boss), endless: Boolean(opts.endless) } : null;
      apply();
    } catch (e) { warnOnce('music', e); }
  }

  // Spielt den Effekt jetzt; gleiche Effekte innerhalb von 40 ms klingen einmal.
  function fire(event, key) {
    var now = ctx.currentTime;
    if (lastPlayed[key] !== undefined && now - lastPlayed[key] < MERGE) { return; }
    lastPlayed[key] = now;
    if (effect(ctx, buses.sfx, event, now + 0.005) && DUCK[event.type]) { duck(); }
  }

  function play(event) {
    try {
      if (!event) { return; }
      if (event.type === 'cascade') { stage = event.stage || 1; return; }
      if (!settings.sfx || !ctx || !hasEffect(event.type)) { return; }
      var key = event.type + ':' + (event.kind || event.special || '');
      if (ctx.state === 'running') { fire(event, key); return; }
      if (!needsResume()) { return; }
      // Der Kontext startet gerade (erster Klick) oder wurde unterbrochen: der neueste
      // Effekt je Schlüssel wartet auf resume(), ältere gleiche fallen weg.
      pending[key] = { event: event, at: clock() };
      if (!resuming) { resume('play'); }
    } catch (e) { warnOnce('play', e); }
  }

  // Für Tests: vergisst den Kontext samt Stücken, Wartendem und Merk-Zeiten.
  function reset() {
    stopTimer();
    document.removeEventListener('visibilitychange', onVisibility);
    tracks = [];
    ctx = null;
    buses = null;
    lastPlayed = {};
    pending = {};
    resuming = false;
    warned = {};
    clock = defaultClock;
  }

  RS.Audio = {
    play: play,
    music: music,
    setSettings: setSettings,
    unlock: unlock,
    validMusic: validMusic,
    hasEffect: hasEffect,
    isRunning: function () { return Boolean(ctx) && ctx.state === 'running'; },
    settings: function () { return { music: settings.music, sfx: settings.sfx }; },
    // für Tests: Effekte und Takte auf einem beliebigen (Offline-)Kontext planen
    _effect: effect,
    _bar: bar,
    _variant: variant,
    _clearedFreq: clearedFreq,
    _stage: function () { return stage; },
    _reset: reset,
    _setClock: function (fn) { clock = typeof fn === 'function' ? fn : defaultClock; }
  };
})(window.RS = window.RS || {});
