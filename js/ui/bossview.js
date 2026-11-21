(function (RS) {
  'use strict';

  // Bosskampf in der Darstellung: Boss-Leiste über dem Feld (Figur, Lebensleiste,
  // Schwachstelle, Phase, Sternenzauber), Effekte zu den Boss-Ereignissen und die
  // Szenen (Intro, Phase 2, Niederlage) als Dialog mit wechselnden Sprechern.
  //
  // RS.UI.BossView.create(container, bossState, def, opts?) ->
  //   { el, apply(events) -> Promise, play(event) -> Promise, setSpellEnabled(bool),
  //     onSpell(fn), destroy() }
  // opts.cellRect(pos) liefert die Lage einer Feldzelle im Fenster (Ziel für Würfe).

  var el = RS.UI.el;
  var COLOR_NAMES = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];
  var SHOT_MS = 520;
  var SHOT_GAP = 70;

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Web-Animation mit Promise; ein Zeitgeber sichert ab, dass sie auch ohne Zeichnen endet.
  function animate(node, keyframes, ms, easing) {
    if (!node || !node.animate) { return Promise.resolve(); }
    var a = node.animate(keyframes, { duration: ms, easing: easing || 'ease-out', fill: 'forwards' });
    var fallback = wait(ms + 80);
    return Promise.race([a.finished, fallback]).then(function () {}, function () {});
  }

  // ---------- Figuren (eigene Zeichnungen) ----------

  // Graf Lakritz: Lakritzschnecke mit Lakritzrad-Häuschen, Monokel, Umhang und Schnurrbart.
  var LAKRITZ_SVG =
    '<svg class="boss-svg" viewBox="0 0 140 120" aria-hidden="true" focusable="false">' +
      '<ellipse cx="72" cy="110" rx="56" ry="6" fill="#000" opacity="0.28"/>' +
      // Umhang flattert hinter dem Häuschen
      '<path class="lk-cape" d="M106 60 Q78 4 30 30 Q6 52 12 106 L70 104 Z" fill="#8c1838"/>' +
      '<path class="lk-lining" d="M100 62 Q76 16 34 36 Q16 56 20 100 L66 100 Z" fill="#e0204f" opacity="0.55"/>' +
      // Körper (Fuß und Hals)
      '<path class="lk-body" d="M14 104 Q12 92 30 92 L90 92 Q96 72 100 62 Q104 48 114 49 Q128 51 125 70 ' +
        'Q122 88 129 100 Q131 107 120 107 L22 107 Q14 107 14 104 Z" fill="#3b2a35"/>' +
      '<path d="M26 96 L88 96 M104 58 Q110 52 118 54" stroke="#fff" stroke-width="2" ' +
        'stroke-linecap="round" fill="none" opacity="0.18"/>' +
      // Hoher Kragen
      '<path class="lk-cape" d="M96 70 L86 42 L102 56 L106 40 L112 54 L122 40 L120 68 Z" fill="#8c1838"/>' +
      // Häuschen: Lakritzrad mit Bonbon in der Mitte
      '<circle class="lk-shell" cx="58" cy="62" r="31" fill="#2a1d25"/>' +
      '<path class="lk-spiral" d="M58 62 A4 4 0 0 1 66 62 A8 8 0 0 1 50 62 A12 12 0 0 1 74 62 ' +
        'A16 16 0 0 1 42 62 A20 20 0 0 1 82 62 A24 24 0 0 1 34 62" stroke="#5e4656" stroke-width="5" ' +
        'fill="none" stroke-linecap="round"/>' +
      '<path d="M36 46 Q46 34 60 33" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.22"/>' +
      '<circle class="lk-bead" cx="60" cy="62" r="5" fill="#e0204f"/>' +
      '<circle cx="58.5" cy="60.5" r="1.6" fill="#fff" opacity="0.7"/>' +
      // Fühler mit Augen, rechts das Monokel
      '<path d="M108 54 L102 30 M118 54 L124 32" stroke="#3b2a35" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="102" cy="27" r="6.5" fill="#fff"/><circle class="lk-pupil" cx="103.5" cy="28" r="2.8" fill="#1a1016"/>' +
      '<circle cx="124" cy="29" r="6.5" fill="#fff"/><circle class="lk-pupil" cx="122.5" cy="30" r="2.8" fill="#1a1016"/>' +
      '<circle cx="124" cy="29" r="9" fill="#bfe4ff" fill-opacity="0.22" stroke="#ffd78c" stroke-width="2"/>' +
      '<path d="M132 33 Q138 50 122 60" stroke="#ffd78c" stroke-width="1.2" fill="none"/>' +
      '<path class="lk-brow" d="M96 18 L107 22 M130 20 L119 23" stroke="#1a1016" stroke-width="2.4" stroke-linecap="round"/>' +
      // Schnurrbart aus roter Lakritzschnur und ein schiefes Grinsen
      '<path class="lk-tash" d="M113 66 q-6 -2 -9 2 q-2 4 2 4 M113 66 q6 -2 9 2 q2 4 -2 4" stroke="#e0204f" ' +
        'stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M108 75 Q114 79 121 73" stroke="#1a1016" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  // Eiskönigin Kandara: Kleid aus Eis, Eiszacken-Kragen, Zepter mit Schneeflocke und
  // eine Krone aus Eiskristallen mit Eisbonbons.
  var KANDARA_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="134" rx="40" ry="5" fill="#000" opacity="0.28"/>' +
      // Haar hinten
      '<path class="kd-hair" d="M36 46 Q30 98 20 118 Q40 114 46 96 L74 96 Q80 114 100 118 Q90 98 84 46 Z" fill="#dff4ff"/>' +
      // Eiszacken-Kragen
      '<path class="kd-collar" d="M34 64 L26 38 L42 50 L44 28 L54 46 L60 30 L66 46 L76 28 L78 50 L94 38 L86 64 Z" ' +
        'fill="#bfe9ff" opacity="0.75"/>' +
      // Kleid mit gezacktem Saum
      '<path class="kd-gown" d="M60 64 L26 132 Q60 140 94 132 Z" fill="#7fd0f2"/>' +
      '<path class="kd-gown-dark" d="M50 64 L70 64 L67 88 L53 88 Z" fill="#3fa3d6"/>' +
      '<path d="M30 126 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7" stroke="#fff" ' +
        'stroke-width="1.6" fill="none" opacity="0.75"/>' +
      '<path d="M56 96 l4 -6 l4 6 l-4 6 Z M44 112 l3 -4 l3 4 l-3 4 Z M70 112 l3 -4 l3 4 l-3 4 Z" fill="#fff" opacity="0.7"/>' +
      // Arme und Zepter
      '<path d="M51 70 Q38 80 34 94" stroke="#eef3ff" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M69 70 Q82 78 90 70" stroke="#eef3ff" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M88 104 L95 40" stroke="#bfe9ff" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="kd-flake" d="M96 24 v18 M88 28 l16 10 M88 38 l16 -10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="96" cy="33" r="2.6" fill="#a8e6ff"/>' +
      // Kopf
      '<circle cx="60" cy="48" r="14" fill="#eef3ff"/>' +
      '<path class="kd-hair" d="M46 47 Q47 31 60 31 Q73 31 74 47 Q67 39 60 41 Q52 39 46 47 Z" fill="#dff4ff"/>' +
      '<ellipse class="kd-eye" cx="55" cy="49.5" rx="2.2" ry="1.7" fill="#3a6ea8"/>' +
      '<ellipse class="kd-eye" cx="65" cy="49.5" rx="2.2" ry="1.7" fill="#3a6ea8"/>' +
      '<path d="M52 48 q3 -2.4 6 0 M62 48 q3 -2.4 6 0" stroke="#2a1840" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
      '<path class="kd-brow" d="M51 43.5 L58 45 M69 43.5 L62 45" stroke="#7a8fc0" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M56 55.5 Q60 58.5 64.5 55" stroke="#6b7fd6" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="51" cy="53" r="2.4" fill="#b8d8ff" opacity="0.6"/><circle cx="69" cy="53" r="2.4" fill="#b8d8ff" opacity="0.6"/>' +
      // Krone: Band, Kristallzacken, Eisbonbons
      '<path class="kd-crown" d="M45 35 L75 35 L73 28 L47 28 Z" fill="#bfe9ff"/>' +
      '<path class="kd-crystal" d="M47 28 L50 14 L54 28 Z M56 28 L60 7 L64 28 Z M66 28 L70 14 L73 28 Z" ' +
        'fill="#e8fbff" stroke="#7fd0f2" stroke-width="0.8"/>' +
      '<circle class="kd-candy" cx="50" cy="13" r="3" fill="#a8e6ff"/>' +
      '<circle class="kd-candy" cx="60" cy="6" r="3.6" fill="#a8e6ff"/>' +
      '<circle class="kd-candy" cx="70" cy="13" r="3" fill="#a8e6ff"/>' +
      '<path class="kd-candy" d="M55 31.5 l-3.5 -2.8 v5.6 Z M65 31.5 l3.5 -2.8 v5.6 Z" fill="#a8e6ff"/>' +
      '<ellipse class="kd-candy" cx="60" cy="31.5" rx="4.5" ry="2.8" fill="#a8e6ff"/>' +
      '<path d="M58.5 4.5 a1.5 1.5 0 0 1 2.5 0" stroke="#fff" stroke-width="1" fill="none"/>' +
      '<path class="kd-crack" d="M59 9 l2 5 l-2.5 4 l3 6 M70 16 l-1 4 l2 3" stroke="#6b4fd6" stroke-width="1.1" ' +
        'fill="none" opacity="0"/>' +
    '</svg>';

  var FIGURES = { lakritz: LAKRITZ_SVG, kandara: KANDARA_SVG };

  function figure(id, phase) {
    var f = el('div', 'boss-art');
    f.setAttribute('data-boss', id);
    f.setAttribute('data-phase', String(phase || 1));
    f.innerHTML = FIGURES[id] || '';
    return f;
  }

  // ---------- Szenen ----------

  function speakers(id, phase) {
    return { boss: { name: RS.BOSSES[id].name, figure: function () {
      var f = figure(id, phase);
      f.className += ' boss-say-figure';
      return f;
    } } };
  }

  // Spielt RS.STORY.bosses[id][part] ('intro', 'phase2', 'defeat'); Promise endet danach.
  function scene(id, part) {
    var story = RS.STORY.bosses && RS.STORY.bosses[id];
    var lines = story && story[part];
    if (!lines || !lines.length) { return Promise.resolve(); }
    return RS.UI.Dialog.say(lines, { skippable: true, speakers: speakers(id, part === 'intro' ? 1 : 2) });
  }

  // ---------- Boss-Leiste ----------

  function create(container, bossState, def, opts) {
    var options = opts || {};
    var id = bossState.id;
    var hp = bossState.hp;
    var max = bossState.max;
    var spellHandler = null;
    var shots = [];
    var destroyed = false;

    var panel = el('section', 'boss-panel');
    panel.setAttribute('data-boss', id);
    panel.setAttribute('aria-label', 'Boss ' + def.name);

    var stage = el('div', 'boss-stage');
    var art = figure(id, bossState.phase);
    stage.appendChild(art);
    var flash = el('div', 'boss-flash');
    stage.appendChild(flash);
    panel.appendChild(stage);
    // Glitzer-Canvas: 3 × 3 Zellen, die Figur ist die mittlere; so fliegt Glitzer über den Rand.
    var fxHost = el('div', 'boss-fx');
    stage.appendChild(fxHost);
    var fx = RS.UI.Effects.create(fxHost, 3, 3);

    var info = el('div', 'boss-info');
    var top = el('div', 'boss-top');
    top.appendChild(el('span', 'boss-name', def.name));
    var badge = el('span', 'boss-phase');
    top.appendChild(badge);
    info.appendChild(top);

    var hpBar = el('div', 'boss-hp');
    hpBar.setAttribute('role', 'progressbar');
    hpBar.setAttribute('aria-label', 'Lebenspunkte');
    hpBar.setAttribute('aria-valuemin', '0');
    var hpFill = el('div', 'boss-hp-fill');
    var hpText = el('span', 'boss-hp-text');
    hpBar.appendChild(hpFill);
    hpBar.appendChild(hpText);
    info.appendChild(hpBar);

    var row = el('div', 'boss-row');
    var weak = el('span', 'boss-weak');
    weak.appendChild(el('span', 'boss-weak-label', 'Schwachstelle'));
    var weakCandy = el('span', 'candy');
    weak.appendChild(weakCandy);
    var weakName = el('span', 'boss-weak-name');
    weak.appendChild(weakName);
    row.appendChild(weak);
    info.appendChild(row);

    var spell = el('div', 'boss-spell');
    var spellBar = el('div', 'boss-spell-bar');
    spellBar.setAttribute('role', 'progressbar');
    spellBar.setAttribute('aria-label', 'Sternenzauber-Ladung');
    spellBar.setAttribute('aria-valuemin', '0');
    spellBar.setAttribute('aria-valuemax', String(RS.Boss.SPELL_MAX));
    var spellFill = el('div', 'boss-spell-fill');
    spellBar.appendChild(spellFill);
    spell.appendChild(spellBar);
    var spellBtn = el('button', 'btn boss-spell-btn');
    spellBtn.type = 'button';
    spellBtn.appendChild(el('span', 'boss-spell-star', '★'));
    spellBtn.appendChild(document.createTextNode(' Sternenzauber'));
    spellBtn.title = 'Bei voller Leiste: 25 Schaden und bis zu 6 Hindernisse weg';
    spellBtn.disabled = true;
    spellBtn.addEventListener('click', function () { if (spellHandler) { spellHandler(); } });
    spell.appendChild(spellBtn);
    info.appendChild(spell);
    panel.appendChild(info);

    var status = el('p', 'sr-only');
    status.setAttribute('role', 'status');
    panel.appendChild(status);

    container.appendChild(panel);

    function setHp(value, maxValue) {
      hp = value;
      max = maxValue || max;
      var k = max > 0 ? hp / max : 0;
      hpFill.style.width = Math.max(0, Math.min(100, k * 100)) + '%';
      hpText.textContent = hp + ' / ' + max;
      hpBar.setAttribute('aria-valuemax', String(max));
      hpBar.setAttribute('aria-valuenow', String(hp));
      hpBar.classList.toggle('is-low', k <= 0.25);
    }

    function setPhase(phase, weakColor) {
      panel.setAttribute('data-phase', String(phase));
      art.setAttribute('data-phase', String(phase));
      badge.textContent = 'Phase ' + phase;
      weakCandy.setAttribute('data-color', String(weakColor));
      weakName.textContent = COLOR_NAMES[weakColor];
      weak.title = COLOR_NAMES[weakColor] + 'e Bonbons machen doppelten Schaden';
    }

    function setCharge(charge) {
      var full = charge >= RS.Boss.SPELL_MAX;
      spellFill.style.width = Math.min(100, charge / RS.Boss.SPELL_MAX * 100) + '%';
      spellBar.setAttribute('aria-valuenow', String(charge));
      spell.classList.toggle('is-full', full);
    }

    function restartClass(node, cls) {
      node.classList.remove(cls);
      void node.offsetWidth;
      node.classList.add(cls);
    }

    function center(rect) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    // ---------- Effekte ----------

    function hit(e) {
      setHp(e.hp, e.max);
      if (e.damage <= 0) { return Promise.resolve(); }
      restartClass(art, 'is-hit');
      var num = el('span', 'boss-dmg' + (e.damage >= 20 ? ' is-big' : ''), '−' + e.damage);
      num.style.left = (35 + Math.random() * 30) + '%';
      stage.appendChild(num);
      setTimeout(function () { if (num.parentNode) { num.parentNode.removeChild(num); } }, 900);
      return Promise.resolve();
    }

    // Ein Wurf von `from` (Fenster-Rechteck) zu jeder Zielzelle; endet, wenn alle gelandet sind.
    function throwAt(fromRect, cells, kind) {
      if (reducedMotion() || !options.cellRect || !document.body.animate) { return Promise.resolve(); }
      var start = center(fromRect);
      var jobs = cells.map(function (pos, i) {
        var rect = options.cellRect(pos);
        var end = center(rect);
        var size = Math.max(14, rect.width * 0.6);
        var shot = el('div', 'boss-shot');
        shot.setAttribute('data-kind', kind);
        shot.setAttribute('aria-hidden', 'true');
        shot.style.width = size + 'px';
        shot.style.height = size + 'px';
        shot.style.marginLeft = (-size / 2) + 'px';
        shot.style.marginTop = (-size / 2) + 'px';
        shot.style.opacity = '0';
        document.body.appendChild(shot);
        shots.push(shot);
        var lift = Math.min(120, Math.abs(end.x - start.x) * 0.3 + 40);
        var mid = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - lift };
        function at(p, s, rot) {
          return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + s + ') rotate(' + rot + 'deg)';
        }
        return wait(i * SHOT_GAP).then(function () {
          if (destroyed) { return null; }
          return animate(shot, [
            { opacity: 1, transform: at(start, 0.4, 0) },
            { opacity: 1, transform: at(mid, 1, 200), offset: 0.5 },
            { opacity: 1, transform: at(end, 0.9, 400) }
          ], SHOT_MS, 'ease-in-out');
        }).then(function () {
          if (shot.parentNode) { shot.parentNode.removeChild(shot); }
        });
      });
      return Promise.all(jobs);
    }

    function attack(e) {
      restartClass(art, 'is-attacking');
      status.textContent = def.name + ' greift an!';
      return throwAt(stage.getBoundingClientRect(), e.cells, e.kind);
    }

    function cast(e) {
      status.textContent = 'Sternenzauber!';
      setCharge(0);
      restartClass(spell, 'is-casting');
      return throwAt(spellBtn.getBoundingClientRect(), e.cells, 'star');
    }

    function phase(e) {
      setPhase(e.phase, e.weak);
      status.textContent = def.name + ' wird wütend: Phase ' + e.phase + ', Schwachstelle ' + COLOR_NAMES[e.weak];
      if (reducedMotion()) { return Promise.resolve(); }
      animate(flash, [{ opacity: 0 }, { opacity: 0.95, offset: 0.2 }, { opacity: 0 }], 650);
      restartClass(art, 'is-phase');
      return wait(700);
    }

    function defeated() {
      panel.classList.add('is-defeated');
      status.textContent = def.name + ' ist besiegt!';
      if (reducedMotion()) { return Promise.resolve(); }
      fx.glitter({ r: 1, c: 1 }, 90);
      return wait(1000);
    }

    // Spielt ein Ereignis ab (Promise); Ereignisse ohne Boss-Bezug sind sofort fertig.
    function play(e) {
      if (destroyed || !e) { return Promise.resolve(); }
      if (e.type === 'bossDamaged') { return hit(e); }
      if (e.type === 'bossPhase') { return phase(e); }
      if (e.type === 'bossDefeated') { return defeated(); }
      if (e.type === 'bossAttack') { return attack(e); }
      if (e.type === 'spellCast') { return cast(e); }
      if (e.type === 'spellCharge') { setCharge(e.charge); }
      return Promise.resolve();
    }

    function apply(events) {
      return (events || []).reduce(function (chain, e) {
        return chain.then(function () { return play(e); });
      }, Promise.resolve());
    }

    function destroy() {
      destroyed = true;
      spellHandler = null;
      fx.destroy();
      shots.forEach(function (s) { if (s.parentNode) { s.parentNode.removeChild(s); } });
      shots = [];
      if (panel.parentNode) { panel.parentNode.removeChild(panel); }
    }

    setHp(bossState.hp, bossState.max);
    setPhase(bossState.phase, bossState.weak);
    setCharge(bossState.charge);

    return {
      el: panel,
      apply: apply,
      play: play,
      setSpellEnabled: function (on) { spellBtn.disabled = !on; },
      onSpell: function (fn) { spellHandler = fn || null; },
      destroy: destroy
    };
  }

  RS.UI.BossView = { create: create, figure: figure, scene: scene };
})(window.RS = window.RS || {});
