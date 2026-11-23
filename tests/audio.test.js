(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  // Every event type the spec (section 12) gives its own effect.
  var EFFECTS = [
    { type: 'click' }, { type: 'swapped' }, { type: 'swapRejected' },
    { type: 'cleared' },
    { type: 'specialCreated', special: 'bomb' },
    { type: 'specialTriggered', special: 'stripeH' }, { type: 'specialTriggered', special: 'stripeV' },
    { type: 'specialTriggered', special: 'bomb' }, { type: 'specialTriggered', special: 'colorball' },
    { type: 'obstacleHit', kind: 'glaze' }, { type: 'obstacleHit', kind: 'lock' }, { type: 'obstacleHit', kind: 'ice' },
    { type: 'obstacleHit', kind: 'choco' }, { type: 'obstacleHit', kind: 'crate' },
    { type: 'smashed' }, { type: 'swept' }, { type: 'jokerMoves' },
    { type: 'bossDamaged' }, { type: 'bossAttack' }, { type: 'bossPhase' }, { type: 'spellCast' }, { type: 'bossDefeated' },
    { type: 'levelWon' }, { type: 'levelLost' }, { type: 'gateOpen' }, { type: 'gift' }
  ];

  function offline() {
    var Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    return Off ? new Off(1, 44100, 44100) : null;
  }

  function withoutAudio(fn) {
    var saved = { a: window.AudioContext, w: window.webkitAudioContext };
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    try { fn(); } finally {
      window.AudioContext = saved.a;
      window.webkitAudioContext = saved.w;
    }
  }

  // Ein Stub-AudioContext: zählt Oszillatoren und resume(); resume() löst erst mit finish() auf.
  function noop() {}
  function param() {
    return { value: 0, setValueAtTime: noop, linearRampToValueAtTime: noop, exponentialRampToValueAtTime: noop,
      cancelScheduledValues: noop, setTargetAtTime: noop };
  }
  function node(extra) {
    var n = { connect: noop, disconnect: noop };
    Object.keys(extra || {}).forEach(function (k) { n[k] = extra[k]; });
    return n;
  }
  function stubClass(startState, made) {
    return function StubContext() {
      var self = this;
      var waiters = [];
      made.push(self);
      self.state = startState;
      self.currentTime = 1;
      self.sampleRate = 8000;
      self.destination = node();
      self.oscillators = 0;
      self.resumes = 0;
      self.resume = function () {
        self.resumes++;
        return { then: function (ok) { waiters.push(ok); } };
      };
      self.finish = function () {
        self.state = 'running';
        waiters.splice(0).forEach(function (ok) { if (ok) { ok(); } });
      };
      self.suspend = function () { return { then: noop, catch: noop }; };
      self.createGain = function () { return node({ gain: param() }); };
      self.createDynamicsCompressor = function () {
        return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
      };
      self.createOscillator = function () {
        self.oscillators++;
        return node({ type: '', frequency: param(), detune: param(), start: noop, stop: noop });
      };
      self.createBiquadFilter = function () { return node({ type: '', frequency: param(), Q: param() }); };
      self.createBuffer = function (ch, len) { return { getChannelData: function () { return new Float32Array(len); } }; };
      self.createBufferSource = function () { return node({ buffer: null, start: noop, stop: noop }); };
    };
  }

  // Führt fn mit einem frischen Stub-Kontext aus und stellt danach alles wieder her.
  function withStub(startState, fn) {
    var saved = { a: window.AudioContext, w: window.webkitAudioContext };
    var made = [];
    RS.Audio._reset();
    window.AudioContext = stubClass(startState, made);
    window.webkitAudioContext = undefined;
    RS.Audio.setSettings({ music: false, sfx: true });
    try { fn(made); } finally {
      RS.Audio._reset();
      window.AudioContext = saved.a;
      window.webkitAudioContext = saved.w;
      RS.Audio.setSettings({ music: true, sfx: true });
    }
  }

  t('audio: unlock resumes a suspended or interrupted context', function () {
    ['suspended', 'interrupted'].forEach(function (state) {
      withStub(state, function (made) {
        RS.Audio.unlock();
        eq(made.length, 1, 'context created (' + state + ')');
        eq(made[0].resumes, 1, 'resume called (' + state + ')');
        RS.Audio.play({ type: 'click' });
        eq(made[0].resumes, 1, 'play adds no second resume while one is in flight (' + state + ')');
        RS.Audio.unlock();
        eq(made[0].resumes, 2, 'every gesture reaches resume, an earlier one may hang outside a gesture (' + state + ')');
        made[0].finish();
        eq(RS.Audio.isRunning(), true, 'running after resume (' + state + ')');
        RS.Audio.unlock();
        eq(made[0].resumes, 2, 'a running context is not resumed again (' + state + ')');
      });
    });
    ['running', 'closed'].forEach(function (state) {
      withStub(state, function (made) {
        RS.Audio.unlock();
        eq(made[0].resumes, 0, 'no resume for ' + state);
      });
    });
  });

  t('audio: an effect during resume plays once the resume resolves', function () {
    withStub('suspended', function (made) {
      RS.Audio.unlock();
      var c = made[0];
      RS.Audio.play({ type: 'click' });
      RS.Audio.play({ type: 'click' });
      RS.Audio.play({ type: 'click' });
      RS.Audio.play({ type: 'swapped' });
      RS.Audio.play({ type: 'nope' });
      eq(c.oscillators, 0, 'nothing plays before the resume resolves');
      c.finish();
      eq(c.oscillators, 2, 'one click and one swap after the resume, older duplicates dropped');
      RS.Audio.play({ type: 'swapped' });
      eq(c.oscillators, 2, 'the same effect within 40 ms merges');
      RS.Audio.play({ type: 'smashed' });
      eq(c.oscillators, 4, 'a running context plays at once');
    });
    withStub('interrupted', function (made) {
      RS.Audio.unlock();
      made[0].finish();
      made[0].state = 'interrupted';   // Safari unterbricht den laufenden Kontext
      RS.Audio.play({ type: 'click' });
      eq(made[0].resumes, 2, 'play resumes an interrupted context');
      made[0].finish();
      eq(made[0].oscillators, 1, 'the click plays after the resume');
    });
  });

  t('audio: no pending effect while effects are off', function () {
    withStub('suspended', function (made) {
      RS.Audio.unlock();
      RS.Audio.play({ type: 'click' });
      RS.Audio.setSettings({ sfx: false });
      made[0].finish();
      eq(made[0].oscillators, 0, 'switched off before the resume resolved');
      RS.Audio.play({ type: 'click' });
      eq(made[0].oscillators, 0, 'off stays silent');
    });
  });

  t('audio: no AudioContext is a silent no-op', function () {
    withoutAudio(function () {
      RS.Audio.unlock();
      RS.Audio.setSettings({ music: false, sfx: false });
      RS.Audio.setSettings({ music: true, sfx: true });
      RS.Audio.setSettings(null);
      RS.Audio.music(2, { boss: true });
      RS.Audio.music(1, { endless: true });
      EFFECTS.forEach(function (e) { RS.Audio.play(e); });
      RS.Audio.play(null);
      RS.Audio.play({});
      RS.Audio.music(null);
      eq(RS.Audio.isRunning(), false, 'no context was created');
    });
  });

  t('audio: unknown event is silent', function () {
    eq(RS.Audio.hasEffect('nope'), false);
    eq(RS.Audio.hasEffect('fell'), false, 'falling candies stay quiet');
    eq(RS.Audio.hasEffect(undefined), false);
    var ctx = offline();
    if (!ctx) { return; }
    eq(RS.Audio._effect(ctx, ctx.destination, { type: 'nope' }, 0), false);
    eq(RS.Audio._effect(ctx, ctx.destination, null, 0), false);
  });

  t('audio: every spec effect exists and schedules', function () {
    EFFECTS.forEach(function (e) { ok(RS.Audio.hasEffect(e.type), 'effect ' + e.type); });
    var ctx = offline();
    if (!ctx) { return; }
    EFFECTS.forEach(function (e, i) {
      eq(RS.Audio._effect(ctx, ctx.destination, e, 0.02 * i), true, 'scheduled ' + e.type + ' ' + (e.kind || e.special || ''));
    });
  });

  t('audio: cleared pitch rises with the cascade stage', function () {
    var A = RS.Audio;
    ok(A._clearedFreq(1) < A._clearedFreq(2) && A._clearedFreq(2) < A._clearedFreq(4), 'rising pitch');
    eq(A._clearedFreq(40), A._clearedFreq(12), 'pitch is capped');
    withoutAudio(function () {
      A.play({ type: 'cascade', stage: 3 });
      eq(A._stage(), 3, 'a cascade event sets the stage');
      A.play({ type: 'cascade', stage: 1 });
      eq(A._stage(), 1);
    });
  });

  t('audio: validMusic accepts every registered world and rejects a wrong drum length', function () {
    RS.Worlds.list().forEach(function (w) {
      eq(RS.Audio.validMusic(w.music), true, 'world ' + w.id);
    });
    var m = JSON.parse(JSON.stringify(RS.Worlds.get(1).music));
    m.drums = m.drums.slice(1);
    eq(RS.Audio.validMusic(m), false, '15 drum steps');
    eq(RS.Audio.validMusic(null), false, 'null');
    var bad = JSON.parse(JSON.stringify(RS.Worlds.get(1).music));
    bad.melodies = [bad.melodies[0]];
    eq(RS.Audio.validMusic(bad), false, 'one melody only');
    bad = JSON.parse(JSON.stringify(RS.Worlds.get(1).music));
    bad.lead = 'kazoo';
    eq(RS.Audio.validMusic(bad), false, 'unknown lead');
  });

  t('audio: every world motif schedules plain, boss and endless bars', function () {
    var ctx = offline();
    if (!ctx) { return; }
    RS.Worlds.list().forEach(function (w) {
      [{}, { boss: true }, { endless: true }].forEach(function (opts) {
        for (var bar = 0; bar < 8; bar++) {
          var n = RS.Audio._bar(ctx, ctx.destination, w.music, opts, bar, 0.01 + bar * 0.05);
          ok(n > 0, 'notes in bar ' + bar + ' world ' + w.id);
        }
      });
    });
  });

  t('audio: boss is darker and about 15 % faster, endless a bit faster', function () {
    var m = RS.Worlds.get(1).music;
    var plain = RS.Audio._variant(m, {});
    var boss = RS.Audio._variant(m, { boss: true });
    var endless = RS.Audio._variant(m, { endless: true });
    ok(Math.abs(boss.tempo / plain.tempo - 1.15) < 0.01, 'boss tempo ' + boss.tempo);
    ok(endless.tempo > plain.tempo && endless.tempo < boss.tempo, 'endless tempo ' + endless.tempo);
    eq(plain.scale.indexOf(4) !== -1, true, 'world 1 has a major third');
    eq(boss.scale.indexOf(4), -1, 'boss has no major third');
    eq(boss.scale.indexOf(3) !== -1, true, 'boss has a minor third');
  });
})(window.RS = window.RS || {});
