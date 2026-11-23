(function (RS) {
  'use strict';

  // Effekt-Tabelle von RS.Audio: je Ereignistyp eine Funktion (k, c, d, t, e).
  // k: Bausteine aus js/audio.js { tone, noise, run, hz, voices, stage }, c: AudioContext,
  // d: Ziel-Knoten, t: Startzeit, e: das Ereignis. Gibt eine Funktion false zurück, bleibt
  // das Ereignis still. Kurz, höchstens etwa 0,5 s, außer Sieg und Niederlage.
  // Eine neue Mechanik bekommt hier ihren Effekt; fehlt er, bleibt das Ereignis still.

  var C5 = 523.25;

  function semis(base, list) { return list.map(function (s) { return base * Math.pow(2, s / 12); }); }

  // Dumpfer Doppelton für abgelehnte Aktionen.
  function dull(k, c, d, t) {
    k.tone(c, d, t, { type: 'triangle', f: 185, lp: 650, dec: 0.09, g: 0.45 });
    k.tone(c, d, t + 0.11, { type: 'triangle', f: 150, lp: 600, dec: 0.11, g: 0.4 });
  }

  function bells(k, c, d, t, freqs, step, g) {
    freqs.forEach(function (f, i) {
      k.tone(c, d, t + i * step, { f: f, dec: 0.5, g: g });
      k.tone(c, d, t + i * step, { f: f * 2.0, dec: 0.18, g: g * 0.25 });
    });
  }

  var OBSTACLES = {
    // Glasur klirrt
    glaze: function (k, c, d, t) {
      k.tone(c, d, t, { f: 2637, dec: 0.12, g: 0.24 });
      k.tone(c, d, t + 0.015, { f: 3951, dec: 0.08, g: 0.09 });
      k.noise(c, d, t, { filter: 'highpass', f: 6000, dec: 0.05, g: 0.08 });
    },
    // Lakritz schnalzt
    lock: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'highpass', f: 2500, dec: 0.025, g: 0.35 });
      k.tone(c, d, t, { type: 'square', f: 900, to: 260, glide: 0.05, lp: 2000, dec: 0.06, g: 0.12 });
    },
    // Eis knackt
    ice: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'bandpass', f: 3600, q: 0.6, dec: 0.05, g: 0.32 });
      k.noise(c, d, t + 0.035, { filter: 'bandpass', f: 1600, q: 0.8, dec: 0.07, g: 0.28 });
      k.tone(c, d, t, { f: 3100, dec: 0.04, g: 0.06 });
    },
    // Schokolade schmatzt
    choco: function (k, c, d, t) {
      k.tone(c, d, t, { f: 320, to: 110, glide: 0.15, lp: 900, dec: 0.18, g: 0.4 });
      k.noise(c, d, t, { filter: 'lowpass', f: 700, dec: 0.1, g: 0.18 });
    },
    // Kiste pocht
    crate: function (k, c, d, t) {
      k.tone(c, d, t, { f: 150, to: 105, glide: 0.08, dec: 0.11, g: 0.6 });
      k.noise(c, d, t, { filter: 'bandpass', f: 750, q: 1.2, dec: 0.04, g: 0.22 });
      k.tone(c, d, t + 0.075, { f: 135, to: 100, glide: 0.08, dec: 0.09, g: 0.35 });
    }
  };

  var SPECIALS = {
    // Streifen: Wisch
    stripe: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'bandpass', f: 700, fTo: 5200, fTime: 0.25, q: 2, a: 0.02, dec: 0.3, g: 0.8 });
      k.tone(c, d, t, { type: 'triangle', f: 600, to: 1600, glide: 0.22, lp: 3000, dec: 0.25, g: 0.08 });
    },
    // Bombe: Bums
    bomb: function (k, c, d, t) {
      k.tone(c, d, t, { f: 170, to: 38, glide: 0.3, dec: 0.42, g: 0.9 });
      k.noise(c, d, t, { filter: 'lowpass', f: 900, fTo: 200, fTime: 0.3, dec: 0.32, g: 0.45 });
    },
    // Farbkugel: Glitzerlauf
    colorball: function (k, c, d, t) {
      k.run(c, d, t, semis(1046.5, [0, 2, 4, 7, 9, 12, 14, 16, 19]), 0.032, { dec: 0.14, g: 0.2 });
      k.noise(c, d, t, { filter: 'highpass', f: 7000, a: 0.05, dec: 0.3, g: 0.06 });
    }
  };

  RS.AudioSfx = {
    click: function (k, c, d, t) {
      k.tone(c, d, t, { type: 'triangle', f: 1250, to: 900, glide: 0.04, dec: 0.06, g: 0.4 });
    },
    swapped: function (k, c, d, t) {
      k.tone(c, d, t, { f: 480, to: 760, glide: 0.08, dec: 0.11, g: 0.4 });
      k.noise(c, d, t, { filter: 'bandpass', f: 1800, fTo: 3200, q: 1, dec: 0.07, g: 0.07 });
    },
    swapRejected: dull,
    smashRejected: dull,
    blastRejected: dull,
    // Aufgelöste Reihe: die Tonhöhe steigt mit der Kaskadenstufe.
    cleared: function (k, c, d, t) {
      var f = k.clearedFreq(k.stage());
      k.tone(c, d, t, { f: f, dec: 0.2, g: 0.45 });
      k.tone(c, d, t, { type: 'triangle', f: f * 1.5, dec: 0.09, g: 0.14 });
      k.noise(c, d, t, { filter: 'bandpass', f: 2500, q: 0.8, dec: 0.03, g: 0.1 });
    },
    specialCreated: function (k, c, d, t) {
      k.run(c, d, t, semis(659.25, [0, 4, 7, 12]), 0.045, { dec: 0.16, g: 0.3 });
    },
    specialTriggered: function (k, c, d, t, e) {
      var kind = e.special === 'stripeH' || e.special === 'stripeV' ? 'stripe' : e.special;
      if (!SPECIALS[kind]) { return false; }
      SPECIALS[kind](k, c, d, t);
    },
    obstacleHit: function (k, c, d, t, e) {
      if (!OBSTACLES[e.kind]) { return false; }
      OBSTACLES[e.kind](k, c, d, t);
    },
    chocoSpread: function (k, c, d, t) {
      k.tone(c, d, t, { f: 220, to: 90, glide: 0.2, lp: 700, dec: 0.22, g: 0.32 });
    },
    shuffled: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'bandpass', f: 900, fTo: 3600, fTime: 0.35, q: 0.8, a: 0.05, dec: 0.35, g: 0.8 });
      k.tone(c, d, t, { f: 400, to: 820, glide: 0.3, dec: 0.32, g: 0.08 });
    },
    // Joker: Hammer, Besen und „+5 Züge“
    smashed: function (k, c, d, t) {
      k.tone(c, d, t, { f: 210, to: 55, glide: 0.2, dec: 0.26, g: 0.8 });
      k.noise(c, d, t, { filter: 'bandpass', f: 1200, q: 0.8, dec: 0.08, g: 0.38 });
      k.tone(c, d, t + 0.01, { f: 1850, dec: 0.16, g: 0.1 });
    },
    swept: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'bandpass', f: 500, fTo: 3400, fTime: 0.4, q: 0.8, a: 0.06, dec: 0.4, g: 1.1 });
      k.noise(c, d, t + 0.12, { filter: 'highpass', f: 4000, a: 0.04, dec: 0.2, g: 0.08 });
    },
    jokerMoves: function (k, c, d, t) {
      k.run(c, d, t, semis(C5, [0, 4, 7, 12, 16]), 0.06, { type: 'triangle', lp: 3200, dec: 0.22, g: 0.32 });
    },
    // Bosse
    bossDamaged: function (k, c, d, t) {
      k.tone(c, d, t, { type: 'square', f: 300, to: 140, glide: 0.12, lp: 1300, dec: 0.16, g: 0.22 });
      k.noise(c, d, t, { filter: 'lowpass', f: 1600, dec: 0.1, g: 0.28 });
    },
    bossAttack: function (k, c, d, t) {
      [0, 9].forEach(function (cents) {
        k.tone(c, d, t, { type: 'sawtooth', f: 112, to: 68, glide: 0.4, detune: cents, lp: 720, q: 3,
          a: 0.05, dec: 0.45, g: 0.3 });
      });
      k.noise(c, d, t, { filter: 'lowpass', f: 400, a: 0.05, dec: 0.4, g: 0.2 });
    },
    bossPhase: function (k, c, d, t) {
      [[220, 261.63, 329.63], [207.65, 246.94, 311.13]].forEach(function (chord, i) {
        chord.forEach(function (f) {
          k.tone(c, d, t + i * 0.24, { type: 'sawtooth', f: f, lp: 1300, hold: 0.14, dec: 0.3, g: 0.11 });
        });
      });
      k.tone(c, d, t, { f: 82, to: 55, glide: 0.5, dec: 0.55, g: 0.5 });
    },
    spellCharge: function (k, c, d, t, e) {
      if (!e.max || e.charge < e.max) { return false; }   // nur wenn der Zauber bereit ist
      bells(k, c, d, t, [1318.5, 1975.5], 0.09, 0.2);
    },
    spellCast: function (k, c, d, t) {
      bells(k, c, d, t, semis(1046.5, [0, 4, 7, 11, 12, 16, 19, 23, 24]), 0.035, 0.16);
      k.noise(c, d, t, { filter: 'highpass', f: 6000, a: 0.1, dec: 0.4, g: 0.1 });
    },
    bossDefeated: function (k, c, d, t) {
      k.tone(c, d, t, { f: 150, to: 40, glide: 0.4, dec: 0.5, g: 0.8 });
      k.run(c, d, t + 0.12, semis(261.63, [0, 4, 7, 12, 16, 19, 24]), 0.07, { type: 'triangle', lp: 3500, dec: 0.4, g: 0.2 });
    },
    // Abschluss
    levelWon: function (k, c, d, t) {
      k.run(c, d, t, semis(392, [0, 5, 9, 12]), 0.12, { type: 'triangle', lp: 3500, dec: 0.25, g: 0.34 });
      semis(C5, [0, 4, 7, 12]).forEach(function (f) {
        k.tone(c, d, t + 0.5, { type: 'triangle', f: f, lp: 3500, hold: 0.3, dec: 0.7, g: 0.16 });
      });
      bells(k, c, d, t + 0.5, [2093], 0.1, 0.1);
    },
    levelLost: function (k, c, d, t) {
      k.run(c, d, t, semis(392, [0, -1, -2, -3]), 0.22, { type: 'triangle', lp: 1400, dec: 0.3, g: 0.36 });
      k.tone(c, d, t + 0.9, { type: 'triangle', f: 196 * Math.pow(2, -3 / 12), lp: 900, hold: 0.2, dec: 0.6, g: 0.3 });
    },
    endlessOver: function (k, c, d, t) {
      k.run(c, d, t, semis(C5, [0, 7, 12]), 0.1, { type: 'triangle', lp: 3200, dec: 0.35, g: 0.32 });
    },
    gateOpen: function (k, c, d, t) {
      k.noise(c, d, t, { filter: 'lowpass', f: 320, a: 0.2, dec: 0.8, g: 0.6 });
      bells(k, c, d, t + 0.25, semis(C5, [0, 7, 12, 16]), 0.15, 0.22);
    },
    gift: function (k, c, d, t) {
      bells(k, c, d, t, semis(1318.5, [0, 3, 8, 12]), 0.08, 0.2);
      k.noise(c, d, t, { filter: 'highpass', f: 7000, a: 0.05, dec: 0.3, g: 0.05 });
    }
  };
})(window.RS = window.RS || {});
