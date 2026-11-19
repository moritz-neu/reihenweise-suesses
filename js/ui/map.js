(function (RS) {
  'use strict';

  // Levelkarte: das nächtliche Kandishain mit einem geschwungenen Weg und zehn Häusern.
  // Zwei Anordnungen: quer (breite Fenster) und hoch (schmale Fenster, scrollt senkrecht).

  var el = RS.UI.el;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var NARROW = '(max-width: 720px), (max-aspect-ratio: 4/5)';

  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      points: [[95, 560], [255, 525], [415, 565], [580, 530], [745, 485],
        [880, 365], [725, 285], [540, 315], [350, 270], [420, 135]],
      crystal: [610, 92],
      moon: [90, 80],
      trees: [[175, 470], [335, 455], [495, 480], [660, 600], [820, 575], [965, 470],
        [640, 235], [255, 200], [290, 385], [860, 245], [110, 380], [950, 600]]
    },
    tall: {
      w: 400, h: 1300,
      points: [[100, 1220], [300, 1100], [110, 980], [290, 860], [100, 740],
        [300, 620], [110, 500], [290, 380], [100, 260], [270, 150]],
      crystal: [110, 80],
      moon: [340, 60],
      trees: [[30, 1120], [370, 1010], [370, 760], [30, 860], [30, 620], [370, 520],
        [370, 280], [30, 380], [30, 160], [210, 1240]]
    }
  };

  // Kleines Haus je Station; Dachfarbe aus der Bonbon-Palette.
  function houseSvg(index) {
    return '<svg class="station-house" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<path class="house-roof" data-color="' + (index % 6) + '" d="M4 26 L30 4 L56 26 Z"/>' +
      '<rect class="house-chimney" x="41" y="8" width="7" height="12"/>' +
      '<rect class="house-body" x="10" y="24" width="40" height="30" rx="2"/>' +
      '<rect class="house-window" x="15" y="30" width="11" height="11" rx="2"/>' +
      '<path class="house-door" d="M33 54 V40 a6 6 0 0 1 12 0 V54 Z"/>' +
      '<circle class="house-attic" cx="30" cy="18" r="3.5"/>' +
    '</svg>';
  }

  // Catmull-Rom-Kurve durch alle Punkte als SVG-Pfad.
  function curve(points) {
    var d = 'M' + points[0][0] + ' ' + points[0][1];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
        ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function scenery(layout, progressCount, crystalLit) {
    var svg = svgEl('svg', {
      'class': 'map-scenery', viewBox: '0 0 ' + layout.w + ' ' + layout.h,
      preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false'
    });
    var w = layout.w;
    var h = layout.h;
    // Hügel im Hintergrund
    svg.appendChild(svgEl('path', { 'class': 'map-hill-far',
      d: 'M0 ' + h * 0.55 + ' Q ' + w * 0.25 + ' ' + h * 0.42 + ' ' + w * 0.5 + ' ' + h * 0.52 +
        ' T ' + w + ' ' + h * 0.48 + ' V' + h + ' H0 Z' }));
    svg.appendChild(svgEl('path', { 'class': 'map-hill',
      d: 'M0 ' + h * 0.78 + ' Q ' + w * 0.3 + ' ' + h * 0.68 + ' ' + w * 0.6 + ' ' + h * 0.8 +
        ' T ' + w + ' ' + h * 0.74 + ' V' + h + ' H0 Z' }));
    // Mond
    var mx = layout.moon[0];
    var my = layout.moon[1];
    svg.appendChild(svgEl('path', { 'class': 'map-moon',
      d: 'M' + mx + ' ' + (my - 26) + ' A26 26 0 1 0 ' + mx + ' ' + (my + 26) +
        ' A18 26 0 0 1 ' + mx + ' ' + (my - 26) + ' Z' }));
    // Lolli-Bäume abseits des Wegs
    layout.trees.forEach(function (t, i) {
      var tree = svgEl('g', { 'class': 'map-tree', transform: 'translate(' + t[0] + ' ' + t[1] + ')' });
      tree.appendChild(svgEl('rect', { x: -1.5, y: 0, width: 3, height: 18 }));
      tree.appendChild(svgEl('circle', { cx: 0, cy: -2, r: 9, 'data-color': String((i + 2) % 6) }));
      svg.appendChild(tree);
    });
    var pts = layout.points;
    // Weg: ganzer Weg gedämpft, freigeschalteter Teil golden
    var d = curve(pts);
    svg.appendChild(svgEl('path', { 'class': 'map-path-bed', d: d }));
    svg.appendChild(svgEl('path', { 'class': 'map-path', d: d }));
    if (progressCount > 1) {
      svg.appendChild(svgEl('path', { 'class': 'map-path-lit', d: curve(pts.slice(0, progressCount)) }));
    }
    // Kristallbonbon auf dem Dorfplatz
    var cx = layout.crystal[0];
    var cy = layout.crystal[1];
    var crystal = svgEl('g', { 'class': 'map-crystal' + (crystalLit ? ' is-lit' : ''),
      transform: 'translate(' + cx + ' ' + cy + ')' });
    crystal.appendChild(svgEl('ellipse', { 'class': 'map-crystal-base', cx: 0, cy: 26, rx: 26, ry: 7 }));
    crystal.appendChild(svgEl('path', { 'class': 'map-crystal-gem', d: 'M0 -26 L18 0 L0 26 L-18 0 Z' }));
    crystal.appendChild(svgEl('path', { 'class': 'map-crystal-shine', d: 'M0 -26 L6 0 L0 26 L-18 0 Z' }));
    svg.appendChild(crystal);
    return svg;
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

  function renderMap(holder) {
    var save = RS.App.save;
    var layout = LAYOUTS[mq && mq.matches ? 'tall' : 'wide'];
    var unlocked = Math.min(save.unlocked, RS.LEVELS.length);
    holder.innerHTML = '';
    holder.className = 'map-world map-world--' + (layout === LAYOUTS.tall ? 'tall' : 'wide');
    holder.style.aspectRatio = layout.w + ' / ' + layout.h;
    holder.appendChild(scenery(layout, unlocked, save.finaleSeen || Boolean(save.stars[RS.LEVELS.length])));

    var focusTarget = null;
    RS.LEVELS.forEach(function (level, i) {
      var pt = layout.points[i];
      var stars = save.stars[level.id] || 0;
      var open = level.id <= unlocked;
      var state = stars > 0 ? 'done' : (open ? 'next' : 'locked');
      var b = el('button', 'station station--' + state);
      b.type = 'button';
      b.style.left = (pt[0] / layout.w * 100) + '%';
      b.style.top = (pt[1] / layout.h * 100) + '%';
      b.innerHTML = houseSvg(i);
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
    return focusTarget;
  }

  function mount(root) {
    var save = RS.App.save;
    section = el('section', 'screen map');

    var head = el('header', 'map-head');
    var back = el('button', 'btn btn--ghost', 'Zurück');
    back.type = 'button';
    back.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.show('menu');
    });
    head.appendChild(back);
    head.appendChild(el('h1', 'screen-title', 'Kandishain'));
    var total = el('p', 'map-total');
    total.appendChild(el('span', 'map-total-star', '★'));
    total.appendChild(document.createTextNode(' ' + totalStars(save) + ' / ' + RS.LEVELS.length * 3));
    total.setAttribute('aria-label', totalStars(save) + ' von ' + RS.LEVELS.length * 3 + ' Sternen');
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

    var world = el('div', 'map-world');
    section.appendChild(world);
    root.appendChild(section);

    mq = window.matchMedia ? window.matchMedia(NARROW) : null;
    var focusTarget = renderMap(world);
    onMedia = function () {
      if (section) { renderMap(world); }
    };
    if (mq) {
      if (mq.addEventListener) { mq.addEventListener('change', onMedia); }
      else if (mq.addListener) { mq.addListener(onMedia); }
    }

    (focusTarget || back).focus();

    if (!save.prologueSeen) {
      RS.UI.Dialog.say(RS.STORY.prologue, { skippable: true }).then(function () {
        RS.App.save.prologueSeen = true;
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

  RS.UI.screens.map = { mount: mount, unmount: unmount, LAYOUTS: LAYOUTS };
})(window.RS = window.RS || {});
