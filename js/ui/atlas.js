(function (RS) {
  'use strict';

  // Weltenübersicht: alle Welten des Spiels als Karten. Offene Welten zeigen Name, Sterne
  // und nach dem Kapitelende den Sternsplitter; ein Klick öffnet ihre Karte. Gesperrte
  // oder noch nicht vorhandene Welten sind ein Umriss ohne Namen und nicht anklickbar.

  var el = RS.UI.el;
  var section = null;

  var SHARD_SVG =
    '<svg class="atlas-shard-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 1.5 L15 9 L22.5 9.6 L16.6 14.4 L18.6 22 L12 17.8 L5.4 22 L7.4 14.4 L1.5 9.6 L9 9 Z" ' +
        'fill="#ffd78c" stroke="#fff6dc" stroke-width="1"/>' +
      '<path d="M12 1.5 L13.4 12 L9 9 Z" fill="#fff6dc" opacity="0.7"/>' +
    '</svg>';

  function lockedCard(n) {
    var card = el('div', 'atlas-card atlas-card--locked');
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', 'Welt ' + n + ', ' + RS.STORY.atlas.locked);
    card.appendChild(el('span', 'atlas-num', 'Welt ' + n));
    var shape = el('span', 'atlas-silhouette');
    shape.setAttribute('aria-hidden', 'true');
    card.appendChild(shape);
    card.appendChild(el('span', 'atlas-locked', RS.STORY.atlas.locked));
    return card;
  }

  function openCard(world, save) {
    var ws = RS.Progress.worldStars(save, world.id);
    var shard = RS.Save.hasSeen(save, 'kapitel:' + world.id);
    var b = el('button', 'atlas-card atlas-card--w' + world.id);
    b.type = 'button';
    b.appendChild(el('span', 'atlas-num', 'Welt ' + world.id));
    var art = RS.UI.WorldArt.get(world.id);
    var pic = el('span', 'atlas-art');
    pic.setAttribute('aria-hidden', 'true');
    if (art) { pic.innerHTML = art.house(world.id - 1); }
    b.appendChild(pic);
    // Eine kleine Figur der Welt hüpft, schwebt oder winkt in der Ecke der Karte.
    if (RS.UI.Ambient) { b.insertAdjacentHTML('beforeend', RS.UI.Ambient.figure(world.id, 0, 'atlas-fig')); }
    b.appendChild(el('span', 'atlas-name', world.name));
    var stars = el('span', 'atlas-stars');
    stars.appendChild(el('span', 'atlas-star', '★'));
    stars.appendChild(document.createTextNode(' ' + ws.stars + ' / ' + ws.max));
    b.appendChild(stars);
    if (shard) {
      var s = el('span', 'atlas-shard');
      s.innerHTML = SHARD_SVG;
      s.title = RS.STORY.atlas.shard;
      b.appendChild(s);
    }
    b.setAttribute('aria-label', 'Welt ' + world.id + ', ' + world.name + ', ' + ws.stars + ' von ' + ws.max +
      ' Sternen' + (shard ? ', ' + RS.STORY.atlas.shard : ''));
    b.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.show('map', { world: world.id });
    });
    return b;
  }

  // params.from === 'map': Zurück führt zur Karte von params.world, sonst ins Menü.
  function mount(root, params) {
    var save = RS.App.save;
    RS.Audio.music(1);
    section = el('section', 'screen atlas');
    var head = el('header', 'map-head atlas-head');
    var back = RS.UI.Back.mark(el('button', 'btn btn--ghost', 'Zurück'));
    back.type = 'button';
    back.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      if (params && params.from === 'map') { RS.UI.show('map', { world: params.world }); }
      else { RS.UI.show('menu'); }
    });
    head.appendChild(back);
    head.appendChild(el('h1', 'screen-title', RS.STORY.atlas.title));
    head.appendChild(el('span', 'game-head-spacer'));
    section.appendChild(head);
    section.appendChild(el('p', 'atlas-intro', RS.STORY.atlas.intro));

    var list = el('ul', 'atlas-list');
    var registered = RS.Worlds.list();
    var count = Math.max(RS.Worlds.FINAL_WORLD, registered.length ? registered[registered.length - 1].id : 0);
    var current = RS.Progress.startWorld(save);
    var focus = null;
    for (var n = 1; n <= count; n++) {
      var world = RS.Worlds.get(n);
      var li = el('li', 'atlas-item');
      var card = world && RS.Progress.isWorldOpen(save, n) ? openCard(world, save) : lockedCard(n);
      if (n === current && card.tagName === 'BUTTON') { focus = card; }
      li.appendChild(card);
      list.appendChild(li);
    }
    section.appendChild(list);
    root.appendChild(section);
    (focus || back).focus();
  }

  function unmount() { section = null; }

  RS.UI.screens.atlas = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
