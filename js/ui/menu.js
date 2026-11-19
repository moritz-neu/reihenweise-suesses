(function (RS) {
  'use strict';

  var el = RS.UI.el;

  // Dorf Kandishain als Silhouette (Hügel, Häuser, Turm, leuchtende Fenster)
  var VILLAGE_SVG =
    '<svg class="menu-village" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<path class="hill-far" d="M0 170 Q 160 120 330 160 T 680 150 T 1000 140 T 1200 150 V260 H0 Z"/>' +
      '<g class="house">' +
        // links: kleine Häuser
        '<path d="M60 200 L60 160 L95 128 L130 160 L130 200 Z"/>' +
        '<path d="M140 205 L140 150 L185 112 L230 150 L230 205 Z"/>' +
        '<rect x="200" y="118" width="12" height="22"/>' +
        '<path d="M245 210 L245 172 L275 146 L305 172 L305 210 Z"/>' +
        // Mitte: Turm mit Spitze und Lolli
        '<path d="M520 215 L520 110 L545 60 L570 110 L570 215 Z"/>' +
        '<rect x="543" y="30" width="4" height="32"/>' +
        '<circle cx="545" cy="26" r="9"/>' +
        '<path d="M430 215 L430 160 L470 124 L510 160 L510 215 Z"/>' +
        '<path d="M580 215 L580 150 L630 108 L680 150 L680 215 Z"/>' +
        '<rect x="648" y="114" width="13" height="24"/>' +
        // rechts: Häuser mit Zuckerstangen-Zaun
        '<path d="M760 210 L760 166 L800 132 L840 166 L840 210 Z"/>' +
        '<path d="M850 205 L850 145 L900 102 L950 145 L950 205 Z"/>' +
        '<path d="M970 200 L970 162 L1005 132 L1040 162 L1040 200 Z"/>' +
        '<path d="M1060 205 L1060 150 L1100 116 L1140 150 L1140 205 Z"/>' +
        '<rect x="1110" y="118" width="11" height="20"/>' +
      '</g>' +
      '<g class="windows">' +
        '<rect class="window" x="86" y="168" width="16" height="16" rx="3"/>' +
        '<rect class="window window--candy0" x="160" y="160" width="16" height="18" rx="3"/>' +
        '<rect class="window" x="195" y="160" width="16" height="18" rx="3"/>' +
        '<circle class="window window--candy3" cx="275" cy="182" r="8"/>' +
        '<rect class="window window--candy4" x="460" y="170" width="18" height="18" rx="3"/>' +
        '<rect class="window" x="536" y="120" width="18" height="26" rx="9"/>' +
        '<rect class="window window--candy2" x="536" y="165" width="18" height="18" rx="3"/>' +
        '<rect class="window" x="600" y="162" width="18" height="20" rx="3"/>' +
        '<rect class="window window--candy5" x="640" y="162" width="18" height="20" rx="3"/>' +
        '<circle class="window window--candy0" cx="630" cy="132" r="7"/>' +
        '<rect class="window window--candy3" x="790" y="174" width="18" height="18" rx="3"/>' +
        '<rect class="window" x="870" y="155" width="18" height="20" rx="3"/>' +
        '<rect class="window window--candy4" x="910" y="155" width="18" height="20" rx="3"/>' +
        '<rect class="window window--candy5" x="996" y="170" width="16" height="16" rx="3"/>' +
        '<rect class="window window--candy2" x="1090" y="160" width="18" height="18" rx="3"/>' +
      '</g>' +
      '<path class="hill" d="M0 215 Q 200 190 420 212 T 820 205 T 1200 200 V260 H0 Z"/>' +
    '</svg>';

  // Feste Positionen der großen Funkelsterne: [links %, oben %, Größe px, Verzögerung s]
  var SPARKLES = [
    [8, 12, 14, 0], [18, 34, 10, -1.2], [30, 8, 12, -2.1], [70, 26, 10, -0.6],
    [82, 44, 14, -1.8], [92, 18, 10, -2.6], [12, 56, 9, -0.9], [88, 62, 9, -1.5],
    [44, 4, 9, -2.9], [60, 10, 11, -0.3]
  ];

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

    section.appendChild(el('div', 'menu-moon'));
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

    var village = el('div');
    village.innerHTML = VILLAGE_SVG;
    section.appendChild(village.firstChild);

    root.appendChild(section);
  }

  function unmount() {
    section = null;
  }

  RS.UI.screens.menu = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
