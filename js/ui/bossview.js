(function (RS) {
  'use strict';

  // Bosskampf in der Darstellung: Boss-Leiste über dem Feld (Figur, Lebensleiste,
  // Schwachstelle, bis zu drei Phasen, Sternenzauber), Effekte zu den Boss-Ereignissen
  // und die Szenen (Intro, Phasenwechsel, Niederlage) als Dialog mit wechselnden Sprechern.
  // Figur und Szenentexte kommen aus der Welt des Bosses (RS.UI.WorldArt, RS.Worlds).
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

  // ---------- Figuren (aus den Weltzeichnungen) ----------

  // Die Welt, deren Boss diesen Schlüssel trägt.
  function worldOf(id) {
    return RS.Worlds.list().filter(function (w) { return w.boss.key === id; })[0];
  }

  function figure(id, phase) {
    var f = el('div', 'boss-art');
    f.setAttribute('data-boss', id);
    f.setAttribute('data-phase', String(phase || 1));
    var world = worldOf(id);
    var art = world && RS.UI.WorldArt.get(world.id);
    f.innerHTML = art ? art.bossFigure() : '';
    return f;
  }

  // ---------- Szenen ----------

  // Die Figur trägt die Szene als data-scene, damit eine Welt etwa die Niederlage eigens
  // zeichnen kann (Amarus bekommt dort seine Süße zurück).
  function speakers(id, phase, part) {
    return { boss: { name: RS.BOSSES[id].name, figure: function () {
      var f = figure(id, phase);
      f.className += ' boss-say-figure';
      if (part) { f.setAttribute('data-scene', part); }
      return f;
    } } };
  }

  // Phase, in der die Figur bei einer Szene steht: intro 1, phaseN N, defeat die letzte.
  function scenePhase(world, part) {
    if (part === 'intro') { return 1; }
    var m = /^phase(\d+)$/.exec(part);
    return m ? Number(m[1]) : world.boss.thresholds.length + 1;
  }

  // Spielt die Story-Szene part ('intro', 'phase2', 'phase3', …, 'defeat') des Bosses aus
  // seiner Weltdatei; das Promise endet danach.
  function scene(id, part) {
    var world = worldOf(id);
    var lines = world && world.boss.story[part];
    if (!lines || !lines.length) { return Promise.resolve(); }
    return RS.UI.Dialog.say(lines, { skippable: true, speakers: speakers(id, scenePhase(world, part), part) });
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
    var phases = (def.thresholds || [0.5]).length + 1;   // 2 oder 3 Phasen
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
      badge.textContent = 'Phase ' + phase + ' / ' + phases;
      badge.title = 'Phase ' + phase + ' von ' + phases;
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
