(function (RS) {
  'use strict';

  // Levelkarte: zwei Welten (Kandishain, Frostzuckerberge), je zehn Häuser an einem
  // geschwungenen Weg und ein Tor dazwischen. Zwei Anordnungen: quer (breite Fenster)
  // und hoch (schmale Fenster, scrollt senkrecht). Die Zeichnungen liefert RS.UI.MapArt.

  var el = RS.UI.el;
  var Art = RS.UI.MapArt;
  var NARROW = '(max-width: 720px), (max-aspect-ratio: 4/5)';

  // Wolken und Glitzer liegen über dem Bild: [links %, oben %, Breite %, Verzögerung s]
  var CLOUDS = [[18, 3, 14, 0], [42, 1, 11, -18], [58, 9, 11, -34], [74, 1, 9, -9]];
  var GLITTER = [[14, 8, 0], [30, 18, -1.1], [52, 6, -2.3], [72, 16, -0.7], [90, 9, -1.7],
    [8, 30, -2.8], [60, 26, -0.4], [44, 34, -1.9]];

  function worldOf(level) {
    return level.world || (level.id > 10 ? 2 : 1);
  }

  // Startwelt: die des höchsten freigeschalteten Levels. Hat sich das Tor noch nicht
  // sichtbar geöffnet, beginnt die Karte in Kandishain, damit man die Öffnung sieht.
  function defaultWorld(save) {
    var top = Math.min(save.unlocked, RS.LEVELS.length);
    var level = RS.LEVELS[top - 1];
    var world = level ? worldOf(level) : 1;
    if (world === 2 && (!RS.Save.isGateOpen(save) || !save.gateOpenSeen)) { world = 1; }
    return world;
  }

  function goalSummary(level) {
    var kit = RS.UI.GameKit;
    var parts = level.goals.map(function (g) { return kit ? kit.goalLabel(g) : ''; });
    return 'Ziel: ' + parts.join(' · ') + ' · ' + level.moves + ' Züge';
  }

  var section = null;
  var mq = null;
  var onMedia = null;

  function totalStars(save) {
    var sum = 0;
    Object.keys(save.stars).forEach(function (id) { sum += save.stars[id]; });
    return sum;
  }

  function starRow(count) {
    var row = el('span', 'station-stars');
    for (var s = 1; s <= 3; s++) {
      row.appendChild(el('span', 'station-star' + (s <= count ? ' is-on' : ''), '★'));
    }
    return row;
  }

  function openIntro(level) {
    var story = RS.STORY.levels[level.id] || {};
    var body = el('div');
    body.appendChild(RS.UI.Dialog.annika(story.intro || '').node);
    body.appendChild(el('p', 'intro-goal', goalSummary(level)));
    RS.UI.dialog({
      title: 'Level ' + level.id,
      className: 'dialog--annika',
      body: body,
      buttons: [
        { label: 'Zurück', className: 'btn--ghost' },
        { label: 'Start', className: 'btn--gold', onClick: function () {
          RS.Audio.play({ type: 'click' });
          RS.UI.show('game', { levelId: level.id });
        } }
      ],
      focus: 1,
      onCancel: function () {}
    });
  }

  function place(node, pt, layout) {
    node.style.left = (pt[0] / layout.w * 100) + '%';
    node.style.top = (pt[1] / layout.h * 100) + '%';
  }

  // Wolken und Glitzer über dem Bild (gezeichnet, nur Dekoration).
  function skyLayer() {
    var layer = el('div', 'map-sky');
    layer.setAttribute('aria-hidden', 'true');
    CLOUDS.forEach(function (c) {
      var cloud = el('span', 'map-cloud');
      cloud.style.left = c[0] + '%';
      cloud.style.top = c[1] + '%';
      cloud.style.width = c[2] + '%';
      cloud.style.animationDelay = c[3] + 's';
      layer.appendChild(cloud);
    });
    GLITTER.forEach(function (g) {
      var star = el('span', 'sparkle map-glitter');
      star.style.left = g[0] + '%';
      star.style.top = g[1] + '%';
      star.style.animationDelay = g[2] + 's';
      layer.appendChild(star);
    });
    return layer;
  }

  // Tor-Knopf. Welt 1: führt in die Frostzuckerberge (zu, offen oder gerade öffnend).
  // Welt 2: führt immer offen zurück nach Kandishain.
  function gateButton(world, layout, state, onPass) {
    var b = el('button', 'map-gate map-gate--w' + world.id + ' is-' + (state === 'closed' ? 'closed' : 'open') +
      (state === 'opening' ? ' is-opening' : ''));
    b.type = 'button';
    place(b, layout.gate, layout);
    b.innerHTML = Art.gate(world.id);
    b.appendChild(el('span', 'map-gate-label', world.target));
    if (state === 'closed') {
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-label', 'Tor nach ' + world.target + ', verschlossen. ' + RS.STORY.gateLocked);
      var tip = el('span', 'map-gate-tip', RS.STORY.gateLocked);
      tip.setAttribute('aria-hidden', 'true');
      b.appendChild(tip);
    } else {
      b.setAttribute('aria-label', 'Tor nach ' + world.target);
      b.addEventListener('click', function () {
        RS.Audio.play({ type: 'click' });
        onPass();
      });
    }
    return b;
  }

  // view = { world, gateState, onPass }
  function renderMap(holder, view) {
    var save = RS.App.save;
    var world = view.world;
    var tall = Boolean(mq && mq.matches);
    var layout = world.layouts[tall ? 'tall' : 'wide'];
    var unlocked = Math.min(save.unlocked, RS.LEVELS.length);
    var levels = RS.LEVELS.filter(function (level) { return worldOf(level) === world.id; });
    var litCount = levels.filter(function (level) { return level.id <= unlocked; }).length;
    var lastId = levels[levels.length - 1].id;
    holder.innerHTML = '';
    holder.className = 'map-world map-world--' + (tall ? 'tall' : 'wide') + ' map-world--w' + world.id;
    holder.style.aspectRatio = layout.w + ' / ' + layout.h;

    var art = el('div', 'map-art');
    art.innerHTML = Art.backdrop(world, layout);
    holder.appendChild(art.firstChild);
    var photo = el('div', 'map-photo');
    photo.setAttribute('aria-hidden', 'true');
    holder.appendChild(photo);
    holder.appendChild(skyLayer());
    art.innerHTML = Art.foreground(world, layout, {
      lit: litCount,
      gateOpen: view.gateState !== 'closed',
      crystalLit: world.id === 1 ? (save.finaleSeen || Boolean(save.stars[lastId]))
        : (save.grandFinaleSeen || Boolean(save.stars[lastId]))
    });
    holder.appendChild(art.firstChild);

    var gateBtn = gateButton(world, layout, world.id === 1 ? view.gateState : 'open', view.onPass);
    holder.appendChild(gateBtn);

    var focusTarget = null;
    levels.forEach(function (level, i) {
      var pt = layout.points[i];
      var stars = save.stars[level.id] || 0;
      var open = level.id <= unlocked;
      var state = stars > 0 ? 'done' : (open ? 'next' : 'locked');
      var b = el('button', 'station station--' + state);
      b.type = 'button';
      place(b, pt, layout);
      b.style.setProperty('--blink-delay', (-(i * 1.7) % 7).toFixed(1) + 's');
      b.innerHTML = Art.house(world.id, level.id - 1);
      b.appendChild(el('span', 'station-num', String(level.id)));
      if (state === 'done') { b.appendChild(starRow(stars)); }
      b.setAttribute('aria-label', 'Level ' + level.id + ', ' + (state === 'done'
        ? stars + ' von 3 Sternen' : (open ? 'spielbar' : 'gesperrt')));
      if (open) {
        b.addEventListener('click', function () {
          RS.Audio.play({ type: 'click' });
          openIntro(level);
        });
      } else {
        b.disabled = true;
      }
      if (state === 'next' || (!focusTarget && open && level.id === unlocked)) { focusTarget = b; }
      holder.appendChild(b);
    });
    if (view.gateState === 'opening') { focusTarget = gateBtn; }
    return focusTarget;
  }

  // params.world: 1 oder 2; ohne Angabe die Welt des höchsten freigeschalteten Levels.
  function mount(root, params) {
    var save = RS.App.save;
    var gateOpen = RS.Save.isGateOpen(save);
    var worldId = Number(params && params.world) || defaultWorld(save);
    if (worldId !== 2 || !gateOpen) { worldId = 1; }
    var world = Art.WORLDS[worldId];
    var view = {
      world: world,
      gateState: !gateOpen ? 'closed' : (worldId === 1 && !save.gateOpenSeen ? 'opening' : 'open'),
      onPass: function () { RS.UI.show('map', { world: worldId === 1 ? 2 : 1 }); }
    };
    section = el('section', 'screen map map--w' + worldId);

    var head = el('header', 'map-head');
    var back = el('button', 'btn btn--ghost', 'Zurück');
    back.type = 'button';
    back.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.show('menu');
    });
    head.appendChild(back);
    head.appendChild(el('h1', 'screen-title', world.name));
    var total = el('p', 'map-total');
    var max = RS.LEVELS.length * 3;
    total.appendChild(el('span', 'map-total-star', '★'));
    total.appendChild(document.createTextNode(' ' + totalStars(save) + ' / ' + max));
    total.setAttribute('aria-label', totalStars(save) + ' von ' + max + ' Sternen');
    var side = el('div', 'map-side');
    var balance = RS.UI.Shop.balance(save);
    side.appendChild(balance);
    var shopBtn = el('button', 'btn btn--gold', 'Laden');
    shopBtn.type = 'button';
    shopBtn.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.Shop.open(function () {
        var fresh = RS.UI.Shop.balance(RS.App.save);
        if (balance.parentNode) { balance.parentNode.replaceChild(fresh, balance); }
        balance = fresh;
      });
    });
    side.appendChild(shopBtn);
    side.insertBefore(total, balance);
    head.appendChild(side);
    section.appendChild(head);

    var holder = el('div', 'map-world');
    section.appendChild(holder);
    root.appendChild(section);

    mq = window.matchMedia ? window.matchMedia(NARROW) : null;
    var focusTarget = renderMap(holder, view);
    if (view.gateState === 'opening') {
      // Die Öffnung spielt genau einmal; ein neuer Aufbau (Fenstergröße) zeigt das Tor offen.
      view.gateState = 'open';
      save.gateOpenSeen = true;
      RS.App.persist();
    }
    onMedia = function () {
      if (section) { renderMap(holder, view); }
    };
    if (mq) {
      if (mq.addEventListener) { mq.addEventListener('change', onMedia); }
      else if (mq.addListener) { mq.addListener(onMedia); }
    }

    (focusTarget || back).focus();

    if (worldId === 1 && !save.prologueSeen) {
      RS.UI.Dialog.say(RS.STORY.prologue, { skippable: true }).then(function () {
        RS.App.save.prologueSeen = true;
        RS.App.persist();
      });
    } else if (worldId === 2 && !save.world2IntroSeen) {
      RS.UI.Dialog.say(RS.STORY.world2Intro, { skippable: true }).then(function () {
        RS.App.save.world2IntroSeen = true;
        RS.App.persist();
      });
    }
  }

  function unmount() {
    if (mq && onMedia) {
      if (mq.removeEventListener) { mq.removeEventListener('change', onMedia); }
      else if (mq.removeListener) { mq.removeListener(onMedia); }
    }
    mq = null;
    onMedia = null;
    section = null;
  }

  RS.UI.screens.map = { mount: mount, unmount: unmount, WORLDS: Art.WORLDS, defaultWorld: defaultWorld };
})(window.RS = window.RS || {});
