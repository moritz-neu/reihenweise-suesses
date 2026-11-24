(function (RS) {
  'use strict';

  // Welt 7, Knallhafen: ein Hafen am Brausemeer unter einem Nachthimmel mit Zuckerfeuerwerk,
  // ein Leuchtturm am fernen Ufer, Segelboote und Wellen, Fässer mit Knallbonbons, Poller und
  // Bojen am Kai, Hafenhäuser als Stationen, ein Tor aus einem riesigen Knallbonbon und
  // Kapitän Knallfrosch als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in die Zuckerwattenwolken (Wegesanfang),
  // gate = Tor nach Station 10, fireworks = Feuerwerk [x, y, Radius, Farbe], lighthouse =
  // Leuchtturm [x, Fuß y, Größe], hills = fernes Ufer und Meer, ground = Kai,
  // ships = Segelboote [x, y, Größe], props = Fässer und Poller am Kai, auf dem Wasser Bojen [x, y],
  // water = Wasser zwischen [y Ufer, y Kai], waves = Wellenbereich [y oben, y unten, Anzahl], gulls = Möwen [x, y].
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[795, 585], [650, 550], [505, 585], [355, 550], [205, 518],
        [95, 418], [250, 332], [432, 362], [608, 322], [715, 196]],
      backGate: [912, 584],
      gate: [850, 150],
      crystal: [570, 112],
      moon: [140, 80],
      fireworks: [[300, 92, 26, 0], [430, 170, 17, 1], [745, 78, 22, 3], [965, 58, 16, 5]],
      lighthouse: [42, 300, 1],
      hills: [
        [[0, 300], [200, 286], [420, 306], [650, 290], [860, 310], [1000, 296]],
        [[0, 336], [300, 332], [600, 340], [1000, 334]]
      ],
      ground: [
        [[0, 470], [200, 462], [450, 482], [700, 470], [1000, 488]],
        [[0, 604], [320, 616], [680, 598], [1000, 612]]
      ],
      ships: [[540, 420, 0.8], [880, 398, 1], [335, 430, 0.7]],
      props: [[830, 470], [670, 465], [500, 495], [340, 455], [60, 560], [35, 450],
        [380, 405], [930, 430], [120, 615], [580, 630], [970, 520], [700, 425]],
      water: [336, 462],
      waves: [350, 455, 22],
      gulls: [[220, 150], [520, 210], [640, 60], [900, 240]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[235, 1195], [105, 1075], [295, 955], [100, 835], [300, 715],
        [110, 595], [290, 475], [100, 355], [270, 250], [150, 150]],
      backGate: [80, 1250],
      gate: [282, 118],
      crystal: [70, 205],
      moon: [70, 58],
      fireworks: [[190, 52, 18, 0], [360, 36, 13, 3]],
      lighthouse: [365, 296, 0.75],
      hills: [
        [[0, 282], [120, 296], [280, 274], [400, 292]],
        [[0, 330], [200, 326], [400, 332]],
        [[0, 618], [130, 640], [290, 622], [400, 652]],
        [[0, 868], [110, 886], [250, 872], [400, 894]]
      ],
      ground: [
        [[0, 1096], [120, 1122], [270, 1102], [400, 1136]],
        [[0, 1268], [200, 1252], [400, 1272]]
      ],
      ships: [[330, 420, 0.7], [330, 1010, 0.6]],
      props: [[370, 1140], [30, 1150], [30, 950], [370, 840], [370, 610], [30, 700],
        [30, 470], [370, 380], [360, 1260]],
      water: [330, 1096],
      waves: [340, 1080, 30],
      gulls: [[200, 330], [320, 560], [60, 760]]
    }
  };

  var FIREWORK_COLORS = ['#ff6b8a', '#ffd84a', '#7fe07a', '#6ec6ff', '#c58cff', '#ff9a3c'];

  // Zuckerfeuerwerk: Strahlen um einen hellen Kern, an den Spitzen kleine Funken.
  function firework(f) {
    var color = FIREWORK_COLORS[f[3] % 6];
    var out = '<g class="art-firework" style="color:' + color + '" transform="translate(' + f[0] + ' ' + f[1] + ')">';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      var x1 = (Math.cos(a) * f[2] * 0.3).toFixed(1);
      var y1 = (Math.sin(a) * f[2] * 0.3).toFixed(1);
      var x2 = (Math.cos(a) * f[2]).toFixed(1);
      var y2 = (Math.sin(a) * f[2]).toFixed(1);
      out += path('art-firework-ray', 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2) +
        '<circle class="art-firework-spark" cx="' + x2 + '" cy="' + y2 + '" r="1.6"/>';
    }
    return out + '<circle class="art-firework-core" r="2.6"/></g>';
  }

  // Leuchtturm: rot-weiß geringelter Turm mit Laterne und einem schwachen Lichtkegel.
  function lighthouse(l) {
    return '<g class="art-lighthouse" transform="translate(' + l[0] + ' ' + l[1] + ') scale(' + l[2] + ')">' +
      path('art-lighthouse-beam', 'M0 -96 L70 -118 L70 -78 Z') +
      path('art-lighthouse-tower', 'M-13 0 L-8 -84 L8 -84 L13 0 Z') +
      path('art-lighthouse-ring', 'M-12.2 -14 L12.2 -14 L11.4 -28 L-11.4 -28 Z M-10.6 -42 L10.6 -42 L9.8 -56 L-9.8 -56 Z ' +
        'M-9 -70 L9 -70 L8.4 -84 L-8.4 -84 Z') +
      '<rect class="art-lighthouse-lamp" x="-6" y="-100" width="12" height="16" rx="2"/>' +
      path('art-lighthouse-roof', 'M-9 -100 L0 -110 L9 -100 Z') +
      '<rect class="art-lighthouse-deck" x="-11" y="-86" width="22" height="3" rx="1"/>' +
      '</g>';
  }

  // Möwe: zwei geschwungene Flügel.
  function gull(g) {
    return path('art-gull', 'M' + (g[0] - 9) + ' ' + g[1] + ' q4.5 -5 9 0 q4.5 -5 9 0');
  }

  // Hintere Kulisse: Sterne, Mond, Feuerwerk, Möwen, fernes Ufer mit Leuchtturm, Meer.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 270 : 300;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 677 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-fireworks">';
    layout.fireworks.forEach(function (f) { out += firework(f); });
    out += '</g><g class="art-gulls">';
    layout.gulls.forEach(function (g) { out += gull(g); });
    out += '</g>';
    out += K.hills(layout) + lighthouse(layout.lighthouse);
    return out + '</svg>';
  }

  // Segelboot: Rumpf in Bonbonfarbe, Mast, zwei Segel und ein Wimpel.
  function ship(s, i) {
    return '<g class="art-ship" transform="translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')">' +
      path('art-ship-hull', 'M-26 -6 L26 -6 L18 6 L-18 6 Z', ' data-color="' + ((i * 2 + 1) % 6) + '"') +
      path('art-ship-stripe', 'M-23 -1 H23') +
      path('art-ship-mast', 'M0 -6 V-50') +
      path('art-ship-sail', 'M2 -48 Q20 -30 18 -10 L2 -10 Z') +
      path('art-ship-sail art-ship-sail--jib', 'M-2 -44 L-2 -10 L-18 -10 Z') +
      path('art-ship-pennant', 'M0 -50 L10 -47 L0 -44 Z') +
      '</g>';
  }

  // Wellen: kurze helle Bögen an festen Plätzen, einige wiegen sacht.
  function waves(layout) {
    var w = layout.waves;
    var r = K.rng(733 + layout.w);
    var out = '<g class="art-waves">';
    for (var i = 0; i < w[2]; i++) {
      var x = (r() * layout.w).toFixed(1);
      var y = (w[0] + r() * (w[1] - w[0])).toFixed(1);
      out += '<g transform="translate(' + x + ' ' + y + ')">' +
        path('art-wave' + (i % 3 === 0 ? ' is-bob' : ''), 'M-12 0 q6 -5 12 0 q6 -5 12 0',
          ' style="animation-delay:' + (r() * 4).toFixed(1) + 's"') + '</g>';
    }
    return out + '</g>';
  }

  // Fass voller Knallbonbons: Holzfass mit Reifen, oben ein Bonbon mit glimmender Zündschnur.
  function barrel(i) {
    return '<rect class="art-barrel" x="-10" y="-6" width="20" height="26" rx="5"/>' +
      path('art-barrel-hoop', 'M-10 0 H10 M-10 14 H10') +
      '<circle class="art-barrel-candy" cx="0" cy="-10" r="6" data-color="' + (i % 6) + '"/>' +
      path('art-barrel-wick', 'M2 -15 q3 -4 6 -3') +
      '<circle class="art-barrel-spark" cx="8.5" cy="-18.5" r="1.8"/>';
  }

  // Poller mit aufgewickeltem Tau.
  function bollard() {
    return '<rect class="art-bollard" x="-7" y="-4" width="14" height="24" rx="3"/>' +
      '<rect class="art-bollard-cap" x="-10" y="-8" width="20" height="6" rx="3"/>' +
      path('art-bollard-rope', 'M-7 6 Q0 10 7 6 M-7 11 Q0 15 7 11');
  }

  // Boje: rot-weiß geringelt mit kleinem Licht.
  function buoy() {
    return path('art-buoy', 'M-9 18 L-6 -4 L6 -4 L9 18 Z') +
      path('art-buoy-ring', 'M-7.6 8 H7.6 L8.2 13 H-8.2 Z') +
      '<circle class="art-buoy-light" cx="0" cy="-8" r="3.2"/>';
  }

  // Auf dem Wasser eine Boje, am Kai abwechselnd ein Fass und ein Poller.
  function prop(p, i, water) {
    var wet = p[1] > water[0] && p[1] < water[1];
    return '<g class="art-tree art-prop" transform="translate(' + p[0] + ' ' + p[1] + ')">' +
      (wet ? '' : '<ellipse class="art-tree-shadow" cx="0" cy="21" rx="13" ry="3"/>') +
      (wet ? buoy() : (i % 2 === 0 ? barrel(i) : bollard())) + '</g>';
  }

  // Vordergrund: Wellen, Segelboote, Kai, Weg, Fässer, Poller, Bojen, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + waves(layout);
    layout.ships.forEach(function (s, i) { out += ship(s, i); });
    out += K.ground(layout) + K.road(opts.path, opts.lit);
    layout.props.forEach(function (p, i) { out += prop(p, i, layout.water); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'harbor');
    return out + '</svg>';
  }

  // Station als Hafenhaus: Holzhütte auf einem Steg, Giebeldach in Bonbonfarbe, Bullauge,
  // Tür und ein Rettungsring im Giebel.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w7" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-post" x="13" y="44" width="4" height="12" rx="1"/>' +
      '<rect class="house-post" x="43" y="44" width="4" height="12" rx="1"/>' +
      '<rect class="house-body" x="12" y="22" width="36" height="22" rx="2"/>' +
      path('house-plank', 'M12 29 H48 M12 36 H48') +
      path('house-roof', 'M7 24 L30 5 L53 24 Z', ' data-color="' + color + '"') +
      '<circle class="house-lifering" cx="30" cy="16" r="4.2"/>' +
      '<circle class="house-window" cx="21" cy="33" r="5"/>' +
      '<circle class="house-porthole" cx="21" cy="33" r="5"/>' +
      '<rect class="house-door" x="32" y="29" width="10" height="15" rx="1.5"/>' +
      '<circle class="house-knob" cx="39.5" cy="37" r="1.1"/>' +
      '<rect class="house-deck" x="5" y="43" width="50" height="4" rx="1.5"/>' +
      '</svg>';
  }

  var clipCount = 0;

  // Tor aus einem riesigen Knallbonbon: die geringelte Bonbonhülle als Bogen, an beiden Füßen
  // die gedrehten Enden des Papiers, oben eine Zündschnur mit Funken, geschlossen mit
  // Lakritzstäben davor. Die Klassen gate-portal, gate-bars und gate-sparkle teilen sich die
  // Öffnungsanimation mit den anderen Toren.
  function wrapperEnd(x) {
    return path('gate-cracker-end', 'M' + x + ' 85 L' + (x - 9) + ' 95 L' + (x + 9) + ' 95 Z') +
      '<rect class="gate-cracker-knot" x="' + (x - 3.5) + '" y="82" width="7" height="5" rx="2"/>';
  }

  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var arch = 'M12.5 84 V46 A27.5 27.5 0 0 1 67.5 46 V84';
    var clip = 'rs-gate-clip-7-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w7" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
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
      path('gate-cracker', arch) + path('gate-cracker-stripes', arch) +
      wrapperEnd(12.5) + wrapperEnd(67.5) +
      path('gate-wick', 'M40 18.5 Q36 10 42 4') +
      '<circle class="gate-wick-glow" cx="42" cy="3.5" r="2.6"/>' +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M42 -14 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M4 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M76 22 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Kapitän Knallfrosch: grüner Frosch mit Zweispitz (Anker am Hut) und dunkelblauem
  // Kapitänsrock mit Goldknöpfen. Links hält er ein orangefarbenes Knallbonbon, rechts hebt er
  // eine glimmende Lunte. Ab Phase 2 sprühen Funken (kf-spark), er runzelt die Stirn (kf-brow),
  // die Wangen glühen (kf-cheek) und er reißt die Lunte höher (kf-arm).
  var KNALLFROSCH_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="42" ry="5" fill="#000" opacity="0.28"/>' +
      // Froschbeine und Füße
      '<path d="M32 124 Q24 106 42 102 L50 120 Z M88 124 Q96 106 78 102 L70 120 Z" fill="#5aae4a" stroke="#3a7a32" stroke-width="1.2"/>' +
      '<ellipse cx="30" cy="125" rx="11" ry="4" fill="#6cc25a"/><ellipse cx="90" cy="125" rx="11" ry="4" fill="#6cc25a"/>' +
      // Kapitänsrock mit hellem Bauch und Goldknöpfen
      '<path d="M38 122 Q34 86 60 78 Q86 86 82 122 Z" fill="#2c3e75"/>' +
      '<ellipse cx="60" cy="104" rx="12" ry="16" fill="#d6ecaa"/>' +
      '<path d="M48 84 L52 120 M72 84 L68 120" stroke="#e8b84a" stroke-width="1.6" fill="none"/>' +
      '<circle cx="45" cy="98" r="2" fill="#ffd25a"/><circle cx="46" cy="110" r="2" fill="#ffd25a"/>' +
      '<circle cx="75" cy="98" r="2" fill="#ffd25a"/><circle cx="74" cy="110" r="2" fill="#ffd25a"/>' +
      // Linker Arm mit Knallbonbon
      '<path d="M41 90 Q28 96 26 106" stroke="#2c3e75" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<path d="M13 112 L6 106 L6 118 Z M31 112 L38 106 L38 118 Z" fill="#ffb05a" stroke="#c96a1a" stroke-width="0.8"/>' +
      '<circle cx="22" cy="112" r="8" fill="#ff9a3c" stroke="#c96a1a" stroke-width="1"/>' +
      '<path d="M17 108 Q22 106 26 109" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.7"/>' +
      '<circle cx="26" cy="106" r="4.5" fill="#6cc25a"/>' +
      // Rechter Arm mit glimmender Lunte und Funken
      '<g class="kf-arm">' +
        '<path d="M79 90 Q92 84 95 72" stroke="#2c3e75" stroke-width="7" stroke-linecap="round" fill="none"/>' +
        '<path d="M95 72 L104 44" stroke="#8a5a3a" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="95" cy="71" r="4.5" fill="#6cc25a"/>' +
        '<circle cx="104.5" cy="42.5" r="3" fill="#ffcf4a"/>' +
        '<path class="kf-spark" d="M104 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z M114 40 l1.2 3 3 1.2 -3 1.2 ' +
          '-1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z M95 36 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1 Z" fill="#ffe14a" opacity="0"/>' +
      '</g>' +
      // Kopf mit breitem Maul, Wangen und Brauen
      '<ellipse cx="60" cy="62" rx="25" ry="17" fill="#6cc25a" stroke="#3a7a32" stroke-width="1.2"/>' +
      '<path d="M43 65 Q60 78 77 65" stroke="#2a4a22" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle class="kf-cheek" cx="40" cy="66" r="3.4" fill="#f2a6a0" opacity="0.7"/>' +
      '<circle class="kf-cheek" cx="80" cy="66" r="3.4" fill="#f2a6a0" opacity="0.7"/>' +
      // Zweispitz mit Goldkante und Anker
      '<path d="M34 36 Q60 4 86 36 Q60 27 34 36 Z" fill="#22305e"/>' +
      '<path d="M36 35 Q60 26 84 35" stroke="#e8b84a" stroke-width="2" fill="none"/>' +
      '<path d="M60 16 V28 M56 19 H64 M55 25 Q60 30 65 25" stroke="#ffd25a" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
      // Glupschaugen auf dem Kopf
      '<circle cx="47" cy="46" r="9" fill="#6cc25a" stroke="#3a7a32" stroke-width="1.2"/>' +
      '<circle cx="73" cy="46" r="9" fill="#6cc25a" stroke="#3a7a32" stroke-width="1.2"/>' +
      '<circle cx="47" cy="46" r="6.4" fill="#fffaf0"/><circle cx="73" cy="46" r="6.4" fill="#fffaf0"/>' +
      '<circle cx="48" cy="47" r="3" fill="#1e2a1a"/><circle cx="72" cy="47" r="3" fill="#1e2a1a"/>' +
      '<circle cx="49" cy="45.6" r="1" fill="#fff"/><circle cx="73" cy="45.6" r="1" fill="#fff"/>' +
      '<path class="kf-brow" d="M39 38 Q44 41 54 40 M66 40 Q76 41 81 38" stroke="#22305e" stroke-width="2.4" ' +
        'stroke-linecap="round" fill="none" opacity="0"/>' +
    '</svg>';

  RS.UI.WorldArt.register(7, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return KNALLFROSCH_SVG; }
  });
})(window.RS = window.RS || {});
