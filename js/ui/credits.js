(function (RS) {
  'use strict';

  // Abspann: je registrierter Welt eine Szene (Name, Bossfigur, Dank), danach Annikas
  // Abschied und „Ende“. Weiter blättert, Überspringen und Escape führen ins Hauptmenü,
  // das auch nach der letzten Szene folgt. Mit reduzierter Bewegung zeigt der Abspann
  // alles auf einmal als ruhige Liste. Die Gesehen-Marken setzt die Karte, nicht der Abspann.

  var el = RS.UI.el;
  var section = null;
  var onKey = null;

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function thanks(world) {
    var c = RS.STORY.credits;
    return c.worlds[world.id] || c.fallback.replace('{name}', world.name);
  }

  function bossFigure(world) {
    var f = el('div', 'boss-art credits-figure');
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('data-boss', world.boss.key);
    f.setAttribute('data-phase', '1');
    // Im Abspann sind alle Bosse versöhnt: die Figur steht wie nach ihrer Niederlage.
    f.setAttribute('data-scene', 'defeat');
    var art = RS.UI.WorldArt.get(world.id);
    if (art && art.bossFigure) { f.innerHTML = art.bossFigure(); }
    return f;
  }

  function worldScene(world) {
    var s = el('article', 'credits-scene credits-scene--world credits-scene--w' + world.id);
    s.appendChild(el('p', 'credits-kicker', 'Welt ' + world.id));
    s.appendChild(el('h2', 'credits-name', world.name));
    s.appendChild(bossFigure(world));
    s.appendChild(el('p', 'credits-boss', world.boss.name));
    s.appendChild(el('p', 'credits-line', thanks(world)));
    return s;
  }

  function farewellScene() {
    var s = el('article', 'credits-scene credits-scene--farewell');
    s.appendChild(RS.UI.Dialog.figure());
    s.appendChild(el('h2', 'credits-name', 'Annika'));
    var list = el('ul', 'credits-farewell');
    RS.STORY.credits.farewell.forEach(function (line, i) {
      var li = el('li', 'credits-line', line);
      li.style.animationDelay = (0.3 + i * 0.9) + 's';
      list.appendChild(li);
    });
    s.appendChild(list);
    return s;
  }

  function endScene() {
    var s = el('article', 'credits-scene credits-scene--end');
    s.appendChild(el('h2', 'credits-end', RS.STORY.credits.end));
    return s;
  }

  function scenes() {
    var out = RS.Worlds.list().map(worldScene);
    out.push(farewellScene());
    out.push(endScene());
    return out;
  }

  function button(label, className, onClick) {
    var b = el('button', 'btn ' + className, label);
    b.type = 'button';
    b.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      onClick();
    });
    return b;
  }

  function finish() { RS.UI.show('menu'); }

  // Ruhige Fassung: alle Szenen untereinander, ein Knopf ins Menü.
  function mountStatic() {
    section.classList.add('credits--static');
    var list = el('ol', 'credits-list');
    scenes().forEach(function (s) {
      var li = el('li', 'credits-item');
      li.appendChild(s);
      list.appendChild(li);
    });
    section.appendChild(list);
    var actions = el('div', 'credits-actions');
    var skip = button('Überspringen', 'btn--ghost', finish);
    var next = button('Weiter', 'btn--gold', finish);
    actions.appendChild(skip);
    actions.appendChild(next);
    section.appendChild(actions);
    onKey = function (e) {
      if (e.key === 'Escape' && !RS.UI.isDialogOpen()) { e.preventDefault(); finish(); }
    };
    document.addEventListener('keydown', onKey);
    return next;
  }

  // Szene für Szene: Weiter blättert, nach „Ende“ geht es ins Menü.
  function mountScenes() {
    var all = scenes();
    var index = 0;
    var stage = el('div', 'credits-stage');
    stage.setAttribute('aria-live', 'polite');
    section.appendChild(stage);
    var actions = el('div', 'credits-actions');
    var skip = button('Überspringen', 'btn--ghost', finish);
    var next = button('Weiter', 'btn--gold', function () {
      if (index < all.length - 1) { index++; render(); }
      else { finish(); }
    });
    actions.appendChild(skip);
    actions.appendChild(next);
    section.appendChild(actions);

    function render() {
      stage.innerHTML = '';
      stage.appendChild(all[index]);
      skip.hidden = index === all.length - 1;
      next.focus();
    }

    onKey = function (e) {
      if (e.key === 'Escape' && !RS.UI.isDialogOpen()) { e.preventDefault(); finish(); }
    };
    document.addEventListener('keydown', onKey);
    render();
    return next;
  }

  function mount(root) {
    RS.Audio.music(1);
    section = el('section', 'screen credits');
    section.appendChild(el('h1', 'screen-title credits-title', RS.STORY.credits.title));
    root.appendChild(section);
    var focus = reducedMotion() ? mountStatic() : mountScenes();
    focus.focus();
  }

  function unmount() {
    if (onKey) { document.removeEventListener('keydown', onKey); }
    onKey = null;
    section = null;
  }

  RS.UI.screens.credits = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
