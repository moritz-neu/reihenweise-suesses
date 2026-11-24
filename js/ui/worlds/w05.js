(function (RS) {
  'use strict';

  // Welt 5, Kirschgarten Morellia: blühende Kirschbäume voller roter Kirschenpaare,
  // ferne Blütenhaine und schwebende Blütenblätter unter einem rosa Abendhimmel,
  // Gartenhäuser als Stationen, ein Tor aus zwei verschlungenen Kirschzweigen und
  // die Krähe Krawalla als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in den Kaugummi-Dschungel (Wegesanfang),
  // gate = Tor nach Station 10, groves = ferne Blütenhaine [x, Fuß, Größe],
  // hills = ferne Hügel, ground = naher Boden, trees = Kirschbäume [x, y],
  // petals = Anzahl der schwebenden Blütenblätter.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[205, 585], [350, 550], [495, 585], [645, 550], [795, 518],
        [905, 418], [750, 332], [568, 362], [392, 322], [285, 196]],
      backGate: [88, 584],
      gate: [150, 150],
      crystal: [430, 112],
      moon: [860, 80],
      groves: [[70, 330, 1.1], [300, 318, 0.8], [520, 334, 1.3], [700, 322, 0.9], [940, 330, 1.2]],
      hills: [
        [[0, 330], [180, 312], [400, 340], [620, 316], [820, 344], [1000, 322]],
        [[0, 418], [240, 398], [500, 430], [780, 402], [1000, 426]]
      ],
      ground: [
        [[0, 460], [160, 448], [380, 476], [620, 500], [840, 470], [1000, 492]],
        [[0, 604], [320, 620], [680, 596], [1000, 614]]
      ],
      trees: [[170, 470], [330, 465], [500, 495], [660, 455], [940, 560], [965, 450],
        [640, 270], [180, 300], [70, 430], [880, 615], [420, 630], [30, 520]],
      petals: 28
    },
    tall: {
      w: 400, h: 1300,
      route: [[165, 1195], [295, 1075], [105, 955], [300, 835], [100, 715],
        [290, 595], [110, 475], [300, 355], [130, 250], [250, 150]],
      backGate: [320, 1250],
      gate: [118, 118],
      crystal: [330, 205],
      moon: [330, 58],
      groves: [[40, 300, 0.9], [200, 290, 0.7], [360, 304, 1]],
      hills: [
        [[0, 276], [120, 298], [280, 272], [400, 296]],
        [[0, 378], [110, 404], [260, 384], [400, 426]],
        [[0, 618], [130, 650], [290, 622], [400, 662]],
        [[0, 868], [110, 896], [250, 876], [400, 904]]
      ],
      ground: [
        [[0, 1096], [120, 1122], [270, 1102], [400, 1136]],
        [[0, 1268], [200, 1252], [400, 1272]]
      ],
      trees: [[30, 1140], [370, 1150], [370, 950], [30, 840], [30, 610], [370, 700],
        [370, 470], [30, 380], [30, 236], [40, 1260]],
      petals: 22
    }
  };

  // Ferner Blütenhain: dunkler Stamm mit einer Wolke aus rosa Blüten, ohne Einzelheiten.
  function grove(g) {
    var s = g[2];
    return '<g class="art-grove" transform="translate(' + g[0] + ' ' + g[1] + ') scale(' + s + ')">' +
      path('art-grove-trunk', 'M-3 0 Q-2 -14 -6 -26 L-1 -27 Q2 -16 3 0 Z') +
      path('art-grove-crown', 'M-34 -30 a16 14 0 0 1 14 -20 a18 16 0 0 1 30 -6 a16 14 0 0 1 22 14 ' +
        'a13 12 0 0 1 -6 22 H-28 a12 11 0 0 1 -6 -10 Z') +
      '</g>';
  }

  // Hintere Kulisse: Sterne, Mond, ferne Blütenhaine, Hügel. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 557 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-groves">';
    layout.groves.forEach(function (g) { out += grove(g); });
    out += '</g>';
    out += K.hills(layout);
    return out + '</svg>';
  }

  // Kirschenpaar: zwei rote Kirschen an einem gemeinsamen Stiel mit Blatt.
  function cherryPair(x, y, s) {
    return '<g class="art-cherry" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      path('art-cherry-stem', 'M-4 2 Q-2 -8 2 -12 M4 3 Q4 -6 2 -12') +
      path('art-cherry-leaf', 'M2 -12 q6 -5 11 -2 q-5 5 -11 2 Z') +
      '<circle class="art-cherry-fruit" cx="-4.5" cy="4" r="3.6"/>' +
      '<circle class="art-cherry-fruit" cx="4.5" cy="5" r="3.6"/>' +
      '<circle class="art-cherry-shine" cx="-5.6" cy="2.8" r="1"/>' +
      '<circle class="art-cherry-shine" cx="3.4" cy="3.8" r="1"/>' +
      '</g>';
  }

  // Kirschbaum: krummer Stamm mit Ast, eine Blütenkrone in Rosa oder Weiß und
  // zwei Kirschenpaare, die unten aus der Krone hängen.
  function tree(x, y, i) {
    var cls = 'art-cherrytree' + (i % 3 === 1 ? ' art-cherrytree--white' : (i % 3 === 2 ? ' art-cherrytree--deep' : ''));
    return '<g class="art-tree ' + cls + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="24" rx="16" ry="3.2"/>' +
      path('art-cherrytree-trunk', 'M-4 24 Q-1 10 -7 -2 L-2 -4 Q1 4 4 -6 L7 -4 Q3 8 4 24 Z') +
      path('art-cherrytree-crown', 'M-22 -6 a11 10 0 0 1 6 -16 a12 11 0 0 1 20 -6 a11 10 0 0 1 16 10 ' +
        'a9 8 0 0 1 -2 15 H-16 a8 7 0 0 1 -6 -3 Z') +
      path('art-cherrytree-blossom', 'M-14 -14 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 ' +
        'M2 -22 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M12 -10 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0') +
      cherryPair(-9, -1, 0.9) + cherryPair(10, 2, 0.8) +
      '</g>';
  }

  // Schwebende Blütenblätter: feste Plätze, einige trudeln sacht hin und her.
  function petals(layout) {
    var r = K.rng(613 + layout.w);
    var out = '<g class="art-petals">';
    for (var i = 0; i < layout.petals; i++) {
      var x = (r() * layout.w).toFixed(1);
      var y = (40 + r() * (layout.h - 80)).toFixed(1);
      var turn = Math.round(r() * 360);
      out += '<g transform="translate(' + x + ' ' + y + ')"><g class="art-petal' + (i % 3 === 0 ? ' is-drift' : '') +
        '" style="animation-delay:' + (r() * 5).toFixed(1) + 's">' +
        path('art-petal-leaf', 'M0 -4 q4 2 0 8 q-4 -6 0 -8 Z', ' transform="rotate(' + turn + ')"') + '</g></g>';
    }
    return out + '</g>';
  }

  // Vordergrund: naher Boden, Weg, Kirschbäume, Blütenblätter, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.trees.forEach(function (t, i) { out += tree(t[0], t[1], i); });
    out += petals(layout);
    out += K.crystal(layout.crystal, opts.crystalLit, 'cherry');
    return out + '</svg>';
  }

  // Station als Gartenhaus: Holzhäuschen mit Bonbondach, rundem Fenster, Blumenkasten
  // und einem Kirschenpaar auf dem Dachfirst, daneben ein kleiner Lattenzaun.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w5" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      path('house-fence', 'M2 56 V44 M8 56 V44 M52 56 V44 M58 56 V44 M0 48 H10 M50 48 H60') +
      '<rect class="house-body" x="11" y="26" width="38" height="29" rx="2"/>' +
      path('house-plank', 'M11 34 H49 M11 42 H49') +
      path('house-roof', 'M5 28 L30 8 L55 28 Q30 23 5 28 Z', ' data-color="' + color + '"') +
      '<circle class="house-window" cx="21" cy="36" r="5"/>' +
      path('house-window-cross', 'M21 31 V41 M16 36 H26') +
      '<rect class="house-flowerbox" x="14" y="42" width="14" height="3.4" rx="1.2"/>' +
      '<circle class="house-flower" cx="17" cy="41" r="1.6"/><circle class="house-flower" cx="21" cy="40.4" r="1.6"/>' +
      '<circle class="house-flower" cx="25" cy="41" r="1.6"/>' +
      path('house-door', 'M33 55 V42 a5 5 0 0 1 10 0 V55 Z') +
      '<circle class="house-knob" cx="40.5" cy="49" r="1.1"/>' +
      '<g class="house-cherry">' +
        path('house-cherry-stem', 'M27 4 Q29 -2 31 -4 M33 4 Q32 -1 31 -4') +
        '<circle class="house-cherry-fruit" cx="27" cy="6" r="3"/><circle class="house-cherry-fruit" cx="33" cy="6.4" r="3"/>' +
      '</g>' +
      '</svg>';
  }

  var clipCount = 0;

  // Tor aus zwei verschlungenen Kirschzweigen: Rinde als Bogen, rosa Blüten darauf und
  // ein Kirschenpaar am Scheitel, geschlossen mit Lakritzstäben davor. Die Klassen
  // gate-portal, gate-bars und gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  var BLOSSOMS = [[9, 70], [12, 40], [24, 20], [56, 20], [68, 40], [71, 70]];

  function blossom(b) {
    return '<g class="gate-blossom" transform="translate(' + b[0] + ' ' + b[1] + ')">' +
      '<circle class="gate-blossom-petal" cx="0" cy="-3" r="2.6"/><circle class="gate-blossom-petal" cx="2.9" cy="-0.9" r="2.6"/>' +
      '<circle class="gate-blossom-petal" cx="1.8" cy="2.4" r="2.6"/><circle class="gate-blossom-petal" cx="-1.8" cy="2.4" r="2.6"/>' +
      '<circle class="gate-blossom-petal" cx="-2.9" cy="-0.9" r="2.6"/>' +
      '<circle class="gate-blossom-heart" cx="0" cy="0" r="1.3"/></g>';
  }

  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var arch = 'M11 92 V46 A29 29 0 0 1 69 46 V92';
    var clip = 'rs-gate-clip-5-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w5" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="34" ry="5"/>' +
      '<defs><clipPath id="' + clip + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#' + clip + ')"><g class="gate-bars">' +
        '<rect x="22" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="37" y="20" width="6" height="72" rx="3"/>' +
        '<rect x="52" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="17" y="58" width="46" height="6" rx="3"/>' +
        path('gate-bar-shine', 'M24 34 V88 M39 24 V88 M54 34 V88') +
      '</g></g>' +
      path('gate-branch', arch) +
      path('gate-branch-twist', 'M11 92 C17 80 6 68 12 56 C18 44 8 32 22 22 C32 15 48 15 58 22 ' +
        'C72 32 62 44 68 56 C74 68 63 80 69 92') +
      path('gate-branch-shine', 'M9 86 V48 A31 31 0 0 1 28 19') +
      BLOSSOMS.map(blossom).join('') +
      '<g class="gate-cherry">' +
        path('gate-cherry-stem', 'M35 9 Q37 2 40 0 M45 9 Q43 3 40 0') +
        '<circle class="gate-cherry-fruit" cx="35" cy="11" r="4"/><circle class="gate-cherry-fruit" cx="45" cy="11.6" r="4"/>' +
        path('gate-cherry-shine', 'M33.4 9.6 a2 2 0 0 1 1.6 -1.4 M43.4 10.2 a2 2 0 0 1 1.6 -1.4') +
      '</g>' +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 -12 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M4 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M76 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Krähe Krawalla: schwarzblaue Krähe mit Federschopf, großen Augen und gelbem Schnabel.
  // Sie hockt auf einem Kirschzweig und hält ein gestohlenes Kirschenpaar im Schnabel.
  // Ab Phase 2 sträubt sie die Federn (kr-ruff), runzelt die Stirn und hebt den Flügel.
  var KRAWALLA_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="44" ry="5" fill="#000" opacity="0.28"/>' +
      // Kirschzweig mit Blüten
      '<path d="M6 112 Q40 104 70 110 Q96 114 116 104" stroke="#5a3424" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<path d="M88 112 q8 6 16 4" stroke="#5a3424" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<g fill="#ffc4dc"><circle cx="14" cy="106" r="4"/><circle cx="104" cy="116" r="3.6"/><circle cx="110" cy="102" r="3.2"/></g>' +
      '<g fill="#ff8fbf"><circle cx="14" cy="106" r="1.4"/><circle cx="104" cy="116" r="1.2"/><circle cx="110" cy="102" r="1.1"/></g>' +
      // Schwanzfedern, Körper, Bauch und Flügel
      '<path class="kr-tail" d="M30 92 L4 100 L10 90 L0 86 L14 82 Z" fill="#1c1f3a"/>' +
      '<path class="kr-body" d="M24 86 Q18 52 48 40 Q80 30 92 62 Q98 96 66 104 Q36 108 24 86 Z" fill="#262a4c"/>' +
      '<path class="kr-belly" d="M50 98 Q40 80 52 66 Q70 58 80 74 Q86 96 66 102 Z" fill="#3a4170"/>' +
      '<g class="kr-wing">' +
        '<path d="M30 84 Q30 60 52 58 Q66 60 64 74 Q58 92 30 84 Z" fill="#1c1f3a"/>' +
        '<path d="M34 80 Q42 70 54 68 M36 86 Q46 80 58 78" stroke="#4a527f" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      // Federschopf und gesträubte Federn ab Phase 2
      '<path class="kr-crest" d="M56 30 L52 14 L60 24 L62 8 L67 24 L74 12 L72 30 Z" fill="#262a4c"/>' +
      '<path class="kr-ruff" d="M26 66 L16 60 L26 58 M88 54 L100 48 L94 58 M40 46 L34 36 L44 42" stroke="#262a4c" ' +
        'stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0"/>' +
      // Kopf, Augen und Brauen
      '<circle class="kr-head" cx="66" cy="44" r="20" fill="#262a4c"/>' +
      '<path d="M54 34 Q60 28 70 28" stroke="#5a64a0" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.7"/>' +
      '<ellipse cx="60" cy="44" rx="6.5" ry="7.5" fill="#fffaf6"/>' +
      '<ellipse cx="75" cy="43" rx="6" ry="7" fill="#fffaf6"/>' +
      '<circle class="kr-pupil" cx="61.5" cy="45.5" r="3.4" fill="#16182c"/>' +
      '<circle class="kr-pupil" cx="76.5" cy="44.5" r="3.2" fill="#16182c"/>' +
      '<circle cx="63" cy="44" r="1.2" fill="#fff"/><circle cx="77.8" cy="43" r="1.1" fill="#fff"/>' +
      '<path class="kr-brow" d="M53 34 Q58 37 66 36 M70 35 Q76 37 82 33" stroke="#0e1022" stroke-width="2.6" ' +
        'stroke-linecap="round" fill="none" opacity="0"/>' +
      // Schnabel mit dem gestohlenen Kirschenpaar
      '<path class="kr-beak" d="M80 48 L102 54 L80 58 Z" fill="#f5b631"/>' +
      '<path d="M80 53 L100 54" stroke="#c07a14" stroke-width="1.2" fill="none"/>' +
      '<path d="M96 54 Q100 62 96 70 M96 54 Q104 60 106 68" stroke="#4f7a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="96" cy="73" r="4.6" fill="#d8233f"/><circle cx="106" cy="71" r="4.6" fill="#d8233f"/>' +
      '<circle cx="94.6" cy="71.4" r="1.2" fill="#fff" opacity="0.7"/><circle cx="104.6" cy="69.4" r="1.2" fill="#fff" opacity="0.7"/>' +
      // Krallen auf dem Zweig
      '<path d="M50 104 v6 M46 110 h8 M68 104 v6 M64 110 h8" stroke="#f5b631" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  RS.UI.WorldArt.register(5, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return KRAWALLA_SVG; }
  });
})(window.RS = window.RS || {});
