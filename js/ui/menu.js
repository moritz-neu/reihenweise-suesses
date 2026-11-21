(function (RS) {
  'use strict';

  var el = RS.UI.el;

  // Ferne Bonbonhügel mit Dorfsilhouette: liegt unter dem Hintergrundbild.
  var FAR_SVG =
    '<svg class="menu-far" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<path class="far-hill far-hill--1" d="M0 120 Q 90 60 190 100 Q 300 40 420 96 Q 520 56 640 92 Q 760 30 880 90 Q 990 50 1090 92 Q 1150 70 1200 84 V220 H0 Z"/>' +
      '<g class="far-village">' +
        '<path d="M300 86 v-16 l9 -8 9 8 v16 Z M322 86 v-24 l7 -7 7 7 v24 Z M340 86 v-14 l10 -9 10 9 v14 Z"/>' +
        '<path d="M820 82 v-18 l9 -8 9 8 v18 Z M842 82 v-30 l6 -10 6 10 v30 Z M858 82 v-16 l10 -9 10 9 v16 Z"/>' +
      '</g>' +
      '<g class="far-lights">' +
        '<rect x="307" y="74" width="4" height="4"/><rect x="327" y="68" width="4" height="4"/><rect x="348" y="76" width="4" height="4"/>' +
        '<rect x="827" y="70" width="4" height="4"/><rect x="846" y="60" width="4" height="4"/><rect x="866" y="72" width="4" height="4"/>' +
      '</g>' +
      '<path class="far-hill far-hill--2" d="M0 170 Q 150 120 300 158 T 620 150 T 940 146 T 1200 150 V220 H0 Z"/>' +
    '</svg>';

  // Dorf im Vordergrund: [x, Breite, Höhe, Dachfarbe]; die Mitte trägt einen Turm.
  var HOUSES = [[60, 70, 50, 0], [160, 90, 62, 3], [272, 64, 46, 5], [440, 84, 58, 2],
    [636, 96, 64, 1], [782, 74, 52, 0], [872, 92, 62, 4], [996, 70, 48, 2], [1088, 88, 58, 5]];
  var TREES = [[30, 1], [250, 4], [370, 0], [740, 3], [975, 5], [1185, 2]];
  var BASE = 206;

  function villageHouse(h, n) {
    var x = h[0];
    var w = h[1];
    var top = BASE - h[2];
    var peak = top - w * 0.5;
    var out = '<rect class="v-body" x="' + x + '" y="' + top + '" width="' + w + '" height="' + h[2] + '" rx="3"/>' +
      '<path class="v-roof" data-color="' + h[3] + '" d="M' + (x - 7) + ' ' + (top + 2) + ' L' + (x + w / 2) + ' ' + peak +
        ' L' + (x + w + 7) + ' ' + (top + 2) + ' Z"/>' +
      '<path class="v-icing" d="M' + (x - 6) + ' ' + (top + 2) + ' L' + (x + w / 2) + ' ' + (peak + 1) +
        ' L' + (x + w + 6) + ' ' + (top + 2) + '"/>';
    var drip = 'M' + x + ' ' + top + ' H' + (x + w) + ' V' + (top + 3);
    var steps = Math.round(w / 8);
    for (var i = 0; i < steps; i++) { drip += ' q-' + (w / steps / 2) + ' 6 -' + (w / steps) + ' 0'; }
    out += '<path class="v-drip" d="' + drip + ' Z"/>';
    var winY = top + 14;
    var doorX = x + w * 0.62;
    out += '<rect class="window" style="animation-delay:' + (-n * 1.3) + 's" x="' + (x + w * 0.16) + '" y="' + winY +
      '" width="' + (w * 0.26) + '" height="' + (w * 0.22) + '" rx="3"/>';
    out += '<circle class="window" style="animation-delay:' + (-n * 2.1 - 0.7) + 's" cx="' + (x + w / 2) + '" cy="' +
      (top - w * 0.2) + '" r="' + (w * 0.07) + '"/>';
    out += '<path class="v-door" d="M' + doorX + ' ' + BASE + ' v-' + (h[2] * 0.42) + ' a' + (w * 0.11) + ' ' + (w * 0.11) +
      ' 0 0 1 ' + (w * 0.22) + ' 0 v' + (h[2] * 0.42) + ' Z"/>';
    return out;
  }

  function villageTower() {
    return '<rect class="v-body" x="548" y="96" width="56" height="110" rx="3"/>' +
      '<path class="v-roof" data-color="4" d="M540 100 L576 40 L612 100 Z"/>' +
      '<path class="v-icing" d="M541 100 L576 41 L611 100"/>' +
      '<rect class="v-stick" x="574" y="14" width="4" height="28" rx="2"/>' +
      '<circle class="v-lolli" cx="576" cy="12" r="10"/>' +
      '<path class="v-swirl" d="M576 12 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -8 1"/>' +
      '<rect class="window" style="animation-delay:-2.4s" x="566" y="112" width="20" height="28" rx="10"/>' +
      '<rect class="window" style="animation-delay:-4.1s" x="566" y="152" width="20" height="18" rx="3"/>' +
      '<path class="v-door" d="M566 206 v-22 a10 10 0 0 1 20 0 v22 Z"/>';
  }

  function villageTree(t) {
    var x = t[0];
    return '<g class="v-tree">' +
      '<rect class="v-stick" x="' + (x - 2.5) + '" y="' + (BASE - 44) + '" width="5" height="46" rx="2"/>' +
      '<circle class="v-lolli" data-color="' + t[1] + '" cx="' + x + '" cy="' + (BASE - 56) + '" r="20"/>' +
      '<path class="v-swirl" d="M' + x + ' ' + (BASE - 56) + ' m-3 0 a3 3 0 1 1 6 0 a7 7 0 1 1 -13 1 a11 11 0 1 1 21 -4 a15 15 0 1 1 -26 8"/>' +
      '</g>';
  }

  function villageFence() {
    var out = '<g class="v-fence">' +
      '<path class="v-rail" d="M-600 216 H1800 M-600 228 H1800"/><path class="v-rail-stripes" d="M-600 216 H1800 M-600 228 H1800"/>';
    for (var x = -598; x < 1800; x += 34) {
      out += '<path class="v-post" d="M' + x + ' 238 V208 a5 5 0 0 1 10 0"/>' +
        '<path class="v-post-stripes" d="M' + x + ' 238 V208 a5 5 0 0 1 10 0"/>';
    }
    return out + '</g>';
  }

  // Vordergrund: Hügel, Lutscherbäume, Lebkuchenhäuser, Zuckerstangen-Zaun, Schokoladenbach.
  // Die Szene ist 2400 breit (Mitte 0..1200, links und rechts wiederholt), damit breite,
  // niedrige Fenster nicht die Dächer abschneiden; schmale Fenster zeigen die Mitte.
  function villageSvg() {
    var out = '<svg class="menu-village" viewBox="-600 0 2400 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<path class="v-ground" d="M-600 196 Q -400 184 -200 196 T 200 194 T 600 200 T 1000 196 T 1400 194 T 1800 196 V260 H-600 Z"/>' +
      '<path class="v-ground-rim" d="M-600 196 Q -400 184 -200 196 T 200 194 T 600 200 T 1000 196 T 1400 194 T 1800 196"/>';
    [-1200, 0, 1200].forEach(function (dx) {
      TREES.forEach(function (t) {
        if (t[0] + dx > -620 && t[0] + dx < 1820) { out += villageTree([t[0] + dx, t[1]]); }
      });
    });
    [-1200, 0, 1200].forEach(function (dx) {
      HOUSES.forEach(function (h, n) {
        if (h[0] + dx > -640 && h[0] + dx < 1800) { out += villageHouse([h[0] + dx, h[1], h[2], h[3]], n + (dx ? 9 + dx / 300 : 0)); }
      });
    });
    out += villageTower();
    out += villageFence();
    out += '<path class="v-creek" d="M-600 242 C -400 232 -200 252 0 240 S 400 252 600 242 S 1000 232 1200 244 S 1600 234 1800 242 V260 H-600 Z"/>' +
      '<path class="v-ripple" d="M-580 250 C -380 244 -200 258 0 249 S 400 258 600 250 S 1000 242 1200 252 S 1600 244 1790 250"/>' +
      '<path class="v-ripple v-ripple--b" d="M-560 256 C -360 252 -180 260 20 256 S 420 260 620 256 S 980 250 1180 257 S 1580 252 1770 256"/>';
    return out + '</svg>';
  }

  // Feste Positionen der großen Funkelsterne: [links %, oben %, Größe px, Verzögerung s]
  var SPARKLES = [
    [8, 12, 14, 0], [18, 34, 10, -1.2], [30, 8, 12, -2.1], [70, 26, 10, -0.6],
    [82, 44, 14, -1.8], [92, 18, 10, -2.6], [12, 56, 9, -0.9], [88, 62, 9, -1.5],
    [44, 4, 9, -2.9], [60, 10, 11, -0.3]
  ];

  // Wolken: [links %, oben %, Breite rem, Verzögerung s]
  var CLOUDS = [[4, 14, 11, 0], [24, 34, 8, -20], [62, 20, 10, -36], [80, 6, 7, -12]];

  var section = null;

  function totalStars(save) {
    var sum = 0;
    Object.keys(save.stars).forEach(function (id) { sum += save.stars[id]; });
    return sum;
  }

  function renderProgress(p) {
    var save = RS.App.save;
    var max = (RS.LEVELS ? RS.LEVELS.length : 10) * 3;
    p.innerHTML = '';
    p.appendChild(document.createTextNode('Sterne: '));
    p.appendChild(el('strong', null, totalStars(save) + ' / ' + max));
    p.appendChild(document.createTextNode(' · Endlos-Rekord: '));
    p.appendChild(el('strong', null, RS.UI.GameKit.formatNumber(save.endlessHighscore)));
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

  function askReset(progress, notice) {
    RS.UI.dialog({
      title: 'Fortschritt zurücksetzen?',
      text: 'Alle Sterne, freigeschalteten Level und dein Endlos-Rekord werden gelöscht. Das lässt sich nicht rückgängig machen.',
      buttons: [
        { label: 'Abbrechen', className: 'btn--ghost' },
        {
          label: 'Zurücksetzen',
          onClick: function () {
            RS.Save.reset();
            RS.App.save = RS.Save.fresh();
            RS.App.persist();
            renderProgress(progress);
            notice.textContent = 'Dein Fortschritt wurde zurückgesetzt.';
          }
        }
      ],
      onCancel: function () {}
    });
  }

  function mount(root) {
    section = el('section', 'screen menu');

    // Schichten: gezeichnete Ferne (Mond, Hügel), Hintergrundbild, Wolken und Glitzer,
    // Inhalt, Dorf im Vordergrund. Das Bild verdeckt nur die gezeichnete Ferne.
    var far = el('div', 'menu-backdrop');
    far.setAttribute('aria-hidden', 'true');
    far.appendChild(el('div', 'menu-moon'));
    far.insertAdjacentHTML('beforeend', FAR_SVG);
    section.appendChild(far);
    var photo = el('div', 'menu-photo');
    photo.setAttribute('aria-hidden', 'true');
    section.appendChild(photo);
    var clouds = el('div', 'menu-clouds');
    clouds.setAttribute('aria-hidden', 'true');
    CLOUDS.forEach(function (c) {
      var cloud = el('span', 'menu-cloud');
      cloud.style.left = c[0] + '%';
      cloud.style.top = c[1] + '%';
      cloud.style.width = c[2] + 'rem';
      cloud.style.animationDelay = c[3] + 's';
      clouds.appendChild(cloud);
    });
    section.appendChild(clouds);
    var sparkles = el('div', 'menu-sparkles');
    sparkles.setAttribute('aria-hidden', 'true');
    SPARKLES.forEach(function (s) {
      var star = el('span', 'sparkle');
      star.style.left = s[0] + '%';
      star.style.top = s[1] + '%';
      star.style.width = s[2] + 'px';
      star.style.height = s[2] + 'px';
      star.style.animationDelay = s[3] + 's';
      sparkles.appendChild(star);
    });
    section.appendChild(sparkles);

    var head = el('header', 'menu-head');
    head.appendChild(el('p', 'menu-kicker', 'Ein Zuckerabenteuer in Kandishain'));
    var title = el('h1', 'menu-title');
    title.appendChild(el('span', null, 'Reihenweise'));
    title.appendChild(el('span', null, 'Süßes'));
    head.appendChild(title);
    var candies = el('ul', 'menu-candies');
    candies.setAttribute('aria-hidden', 'true');
    for (var c = 0; c < 6; c++) {
      var li = el('li');
      var candy = el('span', 'candy');
      candy.setAttribute('data-color', String(c));
      li.appendChild(candy);
      candies.appendChild(li);
    }
    head.appendChild(candies);
    section.appendChild(head);

    var actions = el('nav', 'menu-actions');
    actions.setAttribute('aria-label', 'Hauptmenü');
    var progress = el('p', 'menu-progress');
    var notice = el('p', 'menu-notice');
    notice.setAttribute('role', 'status');

    var adventure = button('Abenteuer', '', function () { RS.UI.show('map'); });
    actions.appendChild(adventure);
    actions.appendChild(button('Endlos', 'btn--blue', function () { RS.UI.show('endless'); }));
    renderProgress(progress);
    actions.appendChild(progress);

    var extras = el('div', 'menu-extras');
    extras.appendChild(button('Fortschritt zurücksetzen', 'btn--ghost', function () {
      notice.textContent = '';
      askReset(progress, notice);
    }));
    var sound = el('button', 'btn btn--ghost', 'Sound (bald)');
    sound.type = 'button';
    sound.disabled = true;
    sound.title = 'Sound kommt in einer späteren Version';
    extras.appendChild(sound);
    actions.appendChild(extras);
    actions.appendChild(notice);
    section.appendChild(actions);

    section.insertAdjacentHTML('beforeend', villageSvg());

    root.appendChild(section);
  }

  function unmount() {
    section = null;
  }

  RS.UI.screens.menu = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
