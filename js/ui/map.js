(function (RS) {
  'use strict';

  // Levelkarte einer Welt: gemeinsame Steuerung für Weg, Stationen und Tore. Die Zeichnung
  // kommt aus RS.UI.WorldArt (js/ui/worlds/wNN.js). Die Karte ist ein langer senkrechter Weg
  // (auf allen Geräten): die hohe Zeichnung der Welt (layouts.tall) wird als Abschnitte
  // übereinander gestapelt, jeder zweite gespiegelt, und erst gezeichnet, wenn er in die Nähe
  // des Bildschirms kommt. Alte Level sind Häuser, Zwischenlevel Bonbon-Steine.
  // Beim Betreten spielt die Karte die Story
  // der Welt: Prolog oder Einleitung mit Joker-Geschenk, nach dem Bosssieg das Kapitelende
  // und danach einmalig die Öffnung des Tors. In der letzten Welt folgen auf das
  // Kapitelende der Abschluss des Spiels und einmalig der Abspann.

  var el = RS.UI.el;
  var OFF = [-500, -500];   // Punkt außerhalb der Zeichnung (Mond, Kristall in unteren Abschnitten)

  // Wolken und Glitzer liegen über dem Bild: [links %, oben %, Breite %, Verzögerung s]
  var CLOUDS = [[18, 3, 14, 0], [42, 1, 11, -18], [58, 9, 11, -34], [74, 1, 9, -9]];
  var GLITTER = [[14, 8, 0], [30, 18, -1.1], [52, 6, -2.3], [72, 16, -0.7], [90, 9, -1.7],
    [8, 30, -2.8], [60, 26, -0.4], [44, 34, -1.9]];

  var section = null;
  var observer = null;

  function seen(key) { return RS.Save.hasSeen(RS.App.save, key); }

  function markSeen(key) {
    RS.Save.markSeen(RS.App.save, key);
    RS.App.persist();
  }

  function bossWon(save, worldId) {
    var lv = RS.Worlds.inWorld(worldId);
    return lv.length > 0 && RS.Progress.isWon(save, lv[lv.length - 1].id);
  }

  // Startwelt aus RS.Progress. Hat sich das Tor davor noch nicht sichtbar geöffnet,
  // beginnt die Karte eine Welt früher, damit man die Öffnung sieht.
  function defaultWorld(save) {
    var id = RS.Progress.startWorld(save);
    if (id > 1 && bossWon(save, id - 1) && !RS.Save.hasSeen(save, 'tor:' + (id - 1))) { return id - 1; }
    return id;
  }

  function goalSummary(level) {
    var kit = RS.UI.GameKit;
    var parts = level.goals.map(function (g) { return kit ? kit.goalLabel(g) : ''; });
    return 'Ziel: ' + parts.join(' · ') + ' · ' + level.moves + ' Züge';
  }

  function starRow(count) {
    var row = el('span', 'station-stars');
    for (var s = 1; s <= 3; s++) {
      row.appendChild(el('span', 'station-star' + (s <= count ? ' is-on' : ''), '★'));
    }
    return row;
  }

  function openIntro(level) {
    var body = el('div');
    body.appendChild(RS.UI.Dialog.annika(level.intro || '').node);
    body.appendChild(el('p', 'intro-goal', goalSummary(level)));
    RS.UI.dialog({
      title: 'Level ' + level.label,
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

  // ---------- Tore ----------

  // Tor am Ende der Welt: { target, label, state: 'closed' | 'open' | 'opening', tip }.
  // Ohne nächste Welt bleibt es zu und trägt „Fortsetzung folgt …“. Die letzte Welt
  // des Spiels hat kein Tor am Ende.
  function exitGate(save, world) {
    if (world.id >= RS.Worlds.FINAL_WORLD) { return null; }
    var next = RS.Worlds.get(world.id + 1);
    var open = Boolean(next) && RS.Progress.isWorldOpen(save, next.id);
    return {
      target: next ? next.id : null,
      label: next ? next.name : RS.STORY.toBeContinued,
      state: open ? 'open' : 'closed',
      tip: !next && bossWon(save, world.id) ? RS.STORY.toBeContinued : world.gateLocked
    };
  }

  // Tor am Anfang ab Welt 2: führt immer offen zurück.
  function backGate(world) {
    var prev = RS.Worlds.get(world.id - 1);
    return prev ? { target: prev.id, label: prev.name, state: 'open' } : null;
  }

  function gateButton(view, gate, kind, pt, layout) {
    var b = el('button', 'map-gate map-gate--' + kind + ' map-gate--w' + view.world.id +
      ' is-' + (gate.state === 'closed' ? 'closed' : 'open') + (gate.state === 'opening' ? ' is-opening' : '') +
      (gate.target ? '' : ' is-sealed'));
    b.type = 'button';
    place(b, pt, layout);
    b.innerHTML = view.art.gate(gate.state);
    b.appendChild(el('span', 'map-gate-label', gate.label));
    var name = gate.target ? 'Tor nach ' + gate.label : 'Tor: ' + gate.label;
    if (gate.state === 'closed') {
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-label', name + ', verschlossen. ' + gate.tip);
      var tip = el('span', 'map-gate-tip', gate.tip);
      tip.setAttribute('aria-hidden', 'true');
      b.appendChild(tip);
    } else {
      b.setAttribute('aria-label', name);
      b.addEventListener('click', function () {
        RS.Audio.play({ type: 'click' });
        RS.UI.show('map', { world: gate.target });
      });
    }
    return b;
  }

  // ---------- Karte ----------

  // Anzahl der Abschnitte: so viele, dass jeder Stützpunkt der hohen Zeichnung eine Station trägt.
  function segmentCount(levelCount, routeLength) {
    return Math.max(1, Math.ceil(levelCount / routeLength));
  }

  // Punkt eines Abschnitts in Koordinaten der ganzen Karte (Abschnitt 0 liegt unten,
  // ungerade Abschnitte sind gespiegelt).
  function toMap(pt, s, segs, layout) {
    var x = s % 2 ? layout.w - pt[0] : pt[0];
    return [x, pt[1] + (segs - 1 - s) * layout.h];
  }

  // Zeichnet einen Abschnitt (Kulisse und Vordergrund ohne Weg); Mond, Kristall und Wolken nur oben.
  function paintSegment(seg, view, layout, top, crystalLit) {
    var lay = top ? layout : Object.assign({}, layout, { moon: OFF, crystal: OFF });
    seg.innerHTML = view.art.backdrop(lay) + view.art.foreground(lay, {
      path: [OFF, [OFF[0] + 1, OFF[1]]], lit: [], crystalLit: crystalLit
    });
    if (top) { seg.appendChild(skyLayer()); }
    seg.setAttribute('data-painted', '1');
  }

  function stoneButton(level, state) {
    var b = el('button', 'station station--stone station--' + state);
    b.type = 'button';
    var gem = el('span', 'station-gem');
    gem.setAttribute('data-color', String(level.pos % 6));
    gem.setAttribute('aria-hidden', 'true');
    b.appendChild(gem);
    return b;
  }

  // view = { world, art, exit, back }
  function renderMap(holder, view) {
    var save = RS.App.save;
    var world = view.world;
    var layout = view.art.layouts.tall;
    var levels = RS.Worlds.inWorld(world.id);
    var segs = segmentCount(levels.length, layout.route.length);
    var H = segs * layout.h;
    var full = { w: layout.w, h: H };
    var route = [];
    for (var s = 0; s < segs; s++) {
      for (var k = 0; k < layout.route.length; k++) { route.push(toMap(layout.route[k], s, segs, layout)); }
    }
    var pts = RS.UI.MapKit.stations(route, levels.length);
    var open = levels.map(function (l) { return RS.Progress.isWon(save, l.id) || RS.Progress.isPlayable(save, l.id); });
    var litCount = open.lastIndexOf(true) + 1;
    var backPt = view.back && layout.backGate ? toMap(layout.backGate, 0, segs, layout) : null;
    var exitPt = view.exit ? toMap(layout.gate, segs - 1, segs, layout) : null;
    var head = backPt ? [backPt] : [];
    var exitLit = exitPt && view.exit.state !== 'closed' ? [exitPt] : [];
    var crystalLit = bossWon(save, world.id) || seen('kapitel:' + world.id);
    if (observer) { observer.disconnect(); observer = null; }
    holder.innerHTML = '';
    holder.className = 'map-world map-world--tall map-world--long map-world--w' + world.id;
    holder.style.aspectRatio = layout.w + ' / ' + H;

    // Abschnitte von oben nach unten; gezeichnet wird erst in der Nähe des Bildschirms.
    var pending = [];
    for (s = segs - 1; s >= 0; s--) {
      var seg = el('div', 'map-seg' + (s % 2 ? ' is-mirror' : ''));
      seg.style.top = ((segs - 1 - s) / segs * 100) + '%';
      seg.style.height = (100 / segs) + '%';
      seg.setAttribute('data-seg', String(s));
      holder.appendChild(seg);
      pending.push(seg);
    }
    function paint(segEl) {
      if (segEl.getAttribute('data-painted')) { return; }
      paintSegment(segEl, view, layout, Number(segEl.getAttribute('data-seg')) === segs - 1, crystalLit);
    }
    if (window.IntersectionObserver) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { paint(e.target); observer.unobserve(e.target); }
        });
      }, { rootMargin: '1500px 0px' });
      pending.forEach(function (segEl) { observer.observe(segEl); });
    } else {
      pending.forEach(paint);
    }

    // Ein durchgehender Weg über alle Abschnitte.
    var road = el('div');
    road.innerHTML = RS.UI.MapKit.svgOpen('map-scenery map-road', full) +
      RS.UI.MapKit.road(head.concat(pts, exitPt ? [exitPt] : []), head.concat(pts.slice(0, litCount), exitLit)) + '</svg>';
    holder.appendChild(road.firstChild);

    var exitBtn = null;
    if (backPt) { holder.appendChild(gateButton(view, view.back, 'back', backPt, full)); }
    if (exitPt) {
      exitBtn = gateButton(view, view.exit, 'exit', exitPt, full);
      holder.appendChild(exitBtn);
    }

    var nextBtn = null;
    var lastOpen = null;
    var houseIndex = 0;
    levels.forEach(function (level, i) {
      var stars = save.stars[level.id] || 0;
      var state = stars > 0 ? 'done' : (open[i] ? 'next' : 'locked');
      var b;
      if (level.step) {
        b = stoneButton(level, state);
      } else {
        b = el('button', 'station station--' + state);
        b.type = 'button';
        b.innerHTML = view.art.house(houseIndex);
        b.style.setProperty('--blink-delay', (-(houseIndex * 1.7) % 7).toFixed(1) + 's');
        houseIndex++;
      }
      place(b, pts[i], full);
      b.appendChild(el('span', 'station-num', String(level.pos)));
      if (state === 'done') { b.appendChild(starRow(stars)); }
      b.setAttribute('aria-label', 'Level ' + level.label + ', ' + (state === 'done'
        ? stars + ' von 3 Sternen' : (open[i] ? 'spielbar' : 'gesperrt')));
      if (open[i]) {
        b.addEventListener('click', function () {
          RS.Audio.play({ type: 'click' });
          openIntro(level);
        });
        lastOpen = b;
      } else {
        b.disabled = true;
      }
      if (state === 'next' && !nextBtn) { nextBtn = b; }
      holder.appendChild(b);
    });
    // Die Abschnitte rund um die Station, bei der die Karte öffnet, sofort zeichnen.
    var focusIndex = Math.max(0, nextBtn ? open.indexOf(true, 0) : litCount - 1);
    levels.forEach(function (l, i) { if (open[i] && !(save.stars[l.id] > 0) && i < focusIndex) { focusIndex = i; } });
    var focusSeg = view.exit && view.exit.state === 'opening' ? segs - 1 : Math.floor(focusIndex / layout.route.length);
    pending.forEach(function (segEl) {
      if (Math.abs(Number(segEl.getAttribute('data-seg')) - focusSeg) <= 1) { paint(segEl); }
    });
    if (view.exit && view.exit.state === 'opening') { return exitBtn; }
    return nextBtn || lastOpen;
  }

  // Zeigt eine Station oder ein Tor mittig im Fenster.
  function reveal(node) {
    if (!node) { return; }
    if (node.focus) { node.focus({ preventScroll: true }); }
    if (node.scrollIntoView) { node.scrollIntoView({ block: 'center' }); }
  }

  // ---------- Story beim Betreten ----------

  function sayOnce(lines, key) {
    return RS.UI.Dialog.say(lines, { skippable: true }).then(function () { markSeen(key); });
  }

  // Geschenk-Dialog; der Vorrat wächst beim Schließen.
  function giftDialog(kind) {
    var joker = RS.Jokers.get(kind);
    var text = RS.STORY.gift.replace('{n}', String(RS.Jokers.GIFT)).replace('{name}', joker.name);
    return new Promise(function (resolve) {
      var body = el('div', 'gift');
      body.appendChild(RS.UI.Shop.jokerIcon(kind));
      body.appendChild(el('p', 'gift-text', text));
      body.appendChild(el('p', 'gift-desc', joker.text));
      RS.Audio.play({ type: 'gift' });
      RS.UI.dialog({
        title: 'Ein Geschenk!',
        className: 'dialog--gift',
        body: body,
        buttons: [{ label: 'Danke!', className: 'btn--gold' }],
        onCancel: function () {},
        onClose: function () {
          RS.Jokers.giveGift(RS.App.save, kind);
          RS.App.persist();
          resolve();
        }
      });
    });
  }

  // Prolog (Welt 1) bzw. Einleitung und Geschenk (ab Welt 2), danach das Kapitelende
  // nach dem Bosssieg; onChapter läuft danach, zuletzt onFinale, falls angegeben. Jeder
  // Schritt läuft nur, solange diese Karte noch zu sehen ist.
  function playStory(world, mine, chapterDue, onChapter, onFinale) {
    function alive() { return section === mine; }
    var steps = [];
    var introKey = world.id === 1 ? 'prolog' : 'intro:' + world.id;
    if (!seen(introKey)) { steps.push(function () { return sayOnce(world.intro, introKey); }); }
    steps.push(function () {
      var kind = RS.Jokers.giftDue(RS.App.save, world.id);
      return kind ? giftDialog(kind) : null;
    });
    if (chapterDue) {
      steps.push(function () { return sayOnce(world.chapterEnd, 'kapitel:' + world.id); });
      steps.push(onChapter);
    }
    if (onFinale) { steps.push(onFinale); }
    steps.reduce(function (chain, step) {
      return chain.then(function () { return alive() ? step() : null; });
    }, Promise.resolve());
  }

  // Kleine Zeichen für die Kopfknöpfe. Auf breiten Fenstern steht nur der Text; auf
  // schmalen (css/map.css, bis 720 px) nur das Zeichen, der Name bleibt aria-label und title.
  var HEAD_ICONS = {
    'Zurück': '<path d="M14.5 5 L7.5 12 L14.5 19" fill="none" stroke="currentColor" stroke-width="2.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    'Welten': '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<ellipse cx="12" cy="12" rx="3.6" ry="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
      '<path d="M3.8 9 H20.2 M3.8 15 H20.2" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    'Zum Boss': '<path d="M6 14 L12 8 L18 14" fill="none" stroke="currentColor" stroke-width="2.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/><path d="M6 5 H18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    'Zum Anfang': '<path d="M6 10 L12 16 L18 10" fill="none" stroke="currentColor" stroke-width="2.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/><path d="M6 19 H18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    'Laden': '<path d="M5 9 H19 L17.8 20 H6.2 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linejoin="round"/>' +
      '<path d="M9 9 V7 a3 3 0 0 1 6 0 V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };

  function headButton(label, className, onClick) {
    var b = el('button', 'btn btn--head ' + className);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.title = label;
    b.innerHTML = '<svg class="head-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      HEAD_ICONS[label] + '</svg>';
    b.appendChild(el('span', 'head-label', label));
    b.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      onClick();
    });
    return b;
  }

  // params.world: Kennzahl einer offenen Welt; ohne Angabe die Startwelt.
  function mount(root, params) {
    var save = RS.App.save;
    var worldId = Number(params && params.world) || defaultWorld(save);
    if (!RS.Worlds.get(worldId) || !RS.Progress.isWorldOpen(save, worldId)) { worldId = defaultWorld(save); }
    var world = RS.Worlds.get(worldId);
    RS.Audio.music(worldId);
    var view = { world: world, art: RS.UI.WorldArt.get(worldId), exit: exitGate(save, world), back: backGate(world) };
    // Das Tor öffnet sich genau einmal (tor:N), nach dem Kapitelende.
    var opening = Boolean(view.exit) && view.exit.state === 'open' && !seen('tor:' + worldId);
    var chapterDue = bossWon(save, worldId) && !seen('kapitel:' + worldId);
    // Nach dem Finalsieg: Abschluss speichern und den Abspann genau einmal zeigen (abspann).
    // Brach das zuletzt nach dem Kapitelende ab, holt der nächste Besuch es nach.
    var finaleDue = worldId === RS.Worlds.FINAL_WORLD && bossWon(save, worldId) && !seen('abspann');
    if (opening) { view.exit.state = chapterDue ? 'closed' : 'opening'; }
    section = el('section', 'screen map map--w' + worldId);
    var mine = section;

    var head = el('header', 'map-head');
    var nav = el('div', 'map-nav');
    var back = RS.UI.Back.mark(headButton('Zurück', 'btn--ghost', function () { RS.UI.show('menu'); }));
    nav.appendChild(back);
    nav.appendChild(headButton('Welten', 'btn--ghost', function () {
      RS.UI.show('atlas', { from: 'map', world: worldId });
    }));
    head.appendChild(nav);
    head.appendChild(el('h1', 'screen-title', world.name));
    var ws = RS.Progress.worldStars(save, worldId);
    var total = el('p', 'map-total');
    total.appendChild(el('span', 'map-total-star', '★'));
    total.appendChild(document.createTextNode(' ' + ws.stars + ' / ' + ws.max));
    total.setAttribute('aria-label', ws.stars + ' von ' + ws.max + ' Sternen in dieser Welt');
    var side = el('div', 'map-side');
    side.appendChild(total);
    var balance = RS.UI.Shop.balance(save);
    side.appendChild(balance);
    side.appendChild(headButton('Laden', 'btn--gold', function () {
      RS.UI.Shop.open(function () {
        var fresh = RS.UI.Shop.balance(RS.App.save);
        if (balance.parentNode) { balance.parentNode.replaceChild(fresh, balance); }
        balance = fresh;
      });
    }));
    head.appendChild(side);
    section.appendChild(head);

    var holder = el('div', 'map-world');
    section.appendChild(holder);

    // Sprungknöpfe am Rand: zum Boss (oben) und zum Anfang (unten) der langen Karte.
    var jump = el('div', 'map-jump');
    jump.appendChild(headButton('Zum Boss', 'btn--ghost map-jump-btn', function () {
      var stations = holder.querySelectorAll('.station');
      reveal(holder.querySelector('.map-gate--exit') || stations[stations.length - 1]);
    }));
    jump.appendChild(headButton('Zum Anfang', 'btn--ghost map-jump-btn', function () {
      reveal(holder.querySelector('.station'));
    }));
    section.appendChild(jump);
    root.appendChild(section);

    var focusTarget = renderMap(holder, view);
    if (view.exit && view.exit.state === 'opening') {
      // Die Öffnung spielt genau einmal; ein neuer Aufbau zeigt das Tor offen.
      view.exit.state = 'open';
      markSeen('tor:' + worldId);
      RS.Audio.play({ type: 'gateOpen' });
    }

    // RS.UI.show scrollt nach dem Aufbau nach oben; erst danach zur Station springen.
    setTimeout(function () { if (section === mine) { reveal(focusTarget || back); } }, 0);

    playStory(world, mine, chapterDue, function () {
      if (!opening) { return; }
      view.exit.state = 'opening';
      var gateBtn = renderMap(holder, view);
      RS.Audio.play({ type: 'gateOpen' });
      view.exit.state = 'open';
      markSeen('tor:' + worldId);
      reveal(gateBtn);
    }, finaleDue ? function () {
      RS.Progress.markComplete(RS.App.save);
      markSeen('abspann');
      RS.UI.show('credits');
    } : null);
  }

  function unmount() {
    if (observer) { observer.disconnect(); observer = null; }
    section = null;
  }

  RS.UI.screens.map = { mount: mount, unmount: unmount, defaultWorld: defaultWorld,
    segmentCount: segmentCount, toMap: toMap };
})(window.RS = window.RS || {});
