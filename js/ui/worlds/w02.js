(function (RS) {
  'use strict';

  // Welt 2, Frostzuckerberge: Puderzuckerberge, Polarlicht, Eisbonbon-Tannen,
  // Eisbonbonhütten, Tore am Anfang und Ende und Eiskönigin Kandara als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück nach Kandishain (Wegesanfang),
  // gate = Tor nach Station 10, peaks = [x, Gipfelhöhe, halbe Breite] über peakBase.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[200, 585], [345, 540], [500, 582], [660, 548], [815, 505],
        [905, 385], [745, 322], [560, 348], [380, 300], [465, 168]],
      backGate: [72, 585],
      gate: [600, 140],
      crystal: [690, 92],
      moon: [905, 72],
      peaks: [[120, 175, 190], [330, 128, 200], [520, 120, 210], [690, 82, 220], [880, 150, 180], [1010, 205, 150]],
      peakBase: 430,
      hills: [
        [[0, 400], [180, 360], [400, 392], [620, 340], [820, 362], [1000, 330]]
      ],
      ground: [
        [[0, 502], [220, 480], [460, 512], [700, 470], [900, 442], [1000, 452]],
        [[0, 610], [350, 592], [700, 618], [1000, 598]]
      ],
      trees: [[270, 470], [420, 455], [590, 490], [740, 625], [880, 590], [965, 470],
        [640, 262], [250, 330], [300, 400], [880, 270], [140, 400], [420, 632]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[235, 1195], [105, 1075], [295, 955], [100, 835], [300, 715],
        [110, 595], [290, 475], [100, 355], [285, 250], [150, 150]],
      backGate: [82, 1250],
      gate: [245, 118],
      crystal: [322, 100],
      moon: [58, 58],
      peaks: [[40, 170, 120], [150, 118, 150], [320, 78, 150], [420, 150, 120]],
      peakBase: 330,
      hills: [
        [[0, 318], [130, 286], [270, 306], [400, 280]],
        [[0, 430], [150, 384], [300, 404], [400, 372]],
        [[0, 668], [120, 624], [280, 652], [400, 612]],
        [[0, 906], [160, 872], [300, 892], [400, 862]]
      ],
      ground: [
        [[0, 1140], [140, 1104], [290, 1124], [400, 1094]],
        [[0, 1270], [200, 1250], [400, 1266]]
      ],
      trees: [[30, 1150], [370, 1040], [370, 780], [30, 900], [30, 650], [370, 540],
        [370, 330], [30, 420], [30, 220], [360, 1250]]
    }
  };

  // Puderzuckerberge: Dreiecksgipfel mit welliger Schneekappe.
  function mountains(layout) {
    var base = layout.peakBase;
    var out = '<g class="art-mountains">';
    layout.peaks.forEach(function (p, i) {
      var x = p[0];
      var y = p[1];
      var hw = p[2];
      out += path('art-mountain' + (i % 2 ? ' art-mountain--b' : ''),
        'M' + (x - hw) + ' ' + base + ' Q' + (x - hw * 0.25) + ' ' + (y + 30) + ' ' + x + ' ' + y +
        ' Q' + (x + hw * 0.25) + ' ' + (y + 30) + ' ' + (x + hw) + ' ' + base + ' Z');
      var cy = y + (base - y) * 0.32;
      var cw = hw * 0.36;
      out += path('art-snowcap',
        'M' + (x - cw) + ' ' + cy + ' Q' + (x - cw * 0.45) + ' ' + (y + 10) + ' ' + x + ' ' + y +
        ' Q' + (x + cw * 0.45) + ' ' + (y + 10) + ' ' + (x + cw) + ' ' + cy +
        ' q-' + cw * 0.25 + ' 12 -' + cw * 0.5 + ' 2 q-' + cw * 0.25 + ' 14 -' + cw * 0.5 + ' 0' +
        ' q-' + cw * 0.25 + ' 12 -' + cw * 0.5 + ' 4 q-' + cw * 0.25 + ' 10 -' + cw * 0.5 + ' -6 Z');
    });
    return out + '</g>';
  }

  function aurora(layout) {
    var w = layout.w;
    var top = layout.h > layout.w ? 40 : 30;
    var out = '<g class="art-aurora">';
    [[0, 'a'], [38, 'b'], [70, 'c']].forEach(function (band) {
      var y = top + band[0];
      out += path('art-aurora-band art-aurora-band--' + band[1],
        'M0 ' + (y + 40) + ' C' + w * 0.25 + ' ' + (y - 10) + ' ' + w * 0.45 + ' ' + (y + 70) + ' ' + w * 0.65 + ' ' +
        (y + 20) + ' S' + w * 0.9 + ' ' + (y - 5) + ' ' + w + ' ' + (y + 30));
    });
    return out + '</g>';
  }

  // Hintere Kulisse: Sterne, Polarlicht, Mond, Berge, Hügel. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 194 + layout.w, skyEnd);
    out += aurora(layout) + K.moon(layout.moon) + mountains(layout) + K.hills(layout);
    return out + '</svg>';
  }

  // Eisbonbon-Tanne: drei Stufen mit Schneerand und Sternchen.
  function fir(x, y, i) {
    var cls = 'art-fir' + (i % 3 === 1 ? ' art-fir--mint' : (i % 3 === 2 ? ' art-fir--rose' : ''));
    return '<g class="art-tree ' + cls + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="24" rx="13" ry="3"/>' +
      '<rect class="art-fir-trunk" x="-3" y="14" width="6" height="10" rx="1.5"/>' +
      path('art-fir-body', 'M0 -30 L13 -10 H7 L17 4 H9 L20 17 H-20 L-9 4 H-17 L-7 -10 H-13 Z') +
      path('art-fir-snow', 'M-7 -10 q3.5 3 7 0 q3.5 3 7 0 M-9 4 q4.5 3 9 0 q4.5 3 9 0 M-20 17 q5 3 10 0 q5 3 10 0 q5 3 10 0 q5 3 10 0') +
      path('art-fir-star', 'M0 -38 l2 4.5 4.5 0.5 -3.5 3 1 4.5 -4 -2.5 -4 2.5 1 -4.5 -3.5 -3 4.5 -0.5 Z') +
      '</g>';
  }

  // Vordergrund: naher Boden, Weg, Tannen, Eiskristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.trees.forEach(function (t, i) { out += fir(t[0], t[1], i); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'ice');
    return out + '</svg>';
  }

  // Station als Eisbonbonhütte mit Schneehaube und Eiszapfen.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w2" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-chimney" x="40" y="9" width="7" height="12" rx="1"/>' +
      path('house-roof', 'M3 27 L30 5 L57 27 Z', ' data-color="' + color + '"') +
      path('house-snow', 'M30 2 C38 6 47 14 54 21 c3 3 2 7 -2 6 c-3 -1 -4 2 -7 1 c-3 -1 -5 2 -8 0 ' +
        'c-3 -2 -5 1 -8 0 c-3 -1 -5 2 -8 0 c-3 -1 -5 2 -8 0 c-4 0 -6 -3 -4 -6 C13 14 22 6 30 2 Z') +
      '<rect class="house-snow" x="39" y="6" width="9" height="4" rx="2"/>' +
      '<rect class="house-body" x="10" y="26" width="40" height="29" rx="3"/>' +
      path('house-icicles', 'M12 26 l2 6 2 -6 Z M22 26 l1.5 4 1.5 -4 Z M38 26 l2 7 2 -7 Z M46 26 l1.5 4 1.5 -4 Z') +
      path('house-frost', 'M13 50 h34') +
      '<rect class="house-window" x="15" y="32" width="11" height="11" rx="5.5"/>' +
      path('house-window-cross', 'M20.5 32 V43 M15 37.5 H26') +
      path('house-door', 'M33 55 V42 a6 6 0 0 1 12 0 V55 Z') +
      '<circle class="house-attic" cx="30" cy="17" r="3.2"/>' +
      '</svg>';
  }

  function gate() { return K.archGate(2); }

  // Eiskönigin Kandara: Kleid aus Eis, Eiszacken-Kragen, Zepter mit Schneeflocke und
  // eine Krone aus Eiskristallen mit Eisbonbons.
  var KANDARA_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="134" rx="40" ry="5" fill="#000" opacity="0.28"/>' +
      // Haar hinten
      '<path class="kd-hair" d="M36 46 Q30 98 20 118 Q40 114 46 96 L74 96 Q80 114 100 118 Q90 98 84 46 Z" fill="#dff4ff"/>' +
      // Eiszacken-Kragen
      '<path class="kd-collar" d="M34 64 L26 38 L42 50 L44 28 L54 46 L60 30 L66 46 L76 28 L78 50 L94 38 L86 64 Z" ' +
        'fill="#bfe9ff" opacity="0.75"/>' +
      // Kleid mit gezacktem Saum
      '<path class="kd-gown" d="M60 64 L26 132 Q60 140 94 132 Z" fill="#7fd0f2"/>' +
      '<path class="kd-gown-dark" d="M50 64 L70 64 L67 88 L53 88 Z" fill="#3fa3d6"/>' +
      '<path d="M30 126 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7 l5 -7 l5 7" stroke="#fff" ' +
        'stroke-width="1.6" fill="none" opacity="0.75"/>' +
      '<path d="M56 96 l4 -6 l4 6 l-4 6 Z M44 112 l3 -4 l3 4 l-3 4 Z M70 112 l3 -4 l3 4 l-3 4 Z" fill="#fff" opacity="0.7"/>' +
      // Arme und Zepter
      '<path d="M51 70 Q38 80 34 94" stroke="#eef3ff" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M69 70 Q82 78 90 70" stroke="#eef3ff" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M88 104 L95 40" stroke="#bfe9ff" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="kd-flake" d="M96 24 v18 M88 28 l16 10 M88 38 l16 -10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="96" cy="33" r="2.6" fill="#a8e6ff"/>' +
      // Kopf
      '<circle cx="60" cy="48" r="14" fill="#eef3ff"/>' +
      '<path class="kd-hair" d="M46 47 Q47 31 60 31 Q73 31 74 47 Q67 39 60 41 Q52 39 46 47 Z" fill="#dff4ff"/>' +
      '<ellipse class="kd-eye" cx="55" cy="49.5" rx="2.2" ry="1.7" fill="#3a6ea8"/>' +
      '<ellipse class="kd-eye" cx="65" cy="49.5" rx="2.2" ry="1.7" fill="#3a6ea8"/>' +
      '<path d="M52 48 q3 -2.4 6 0 M62 48 q3 -2.4 6 0" stroke="#2a1840" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
      '<path class="kd-brow" d="M51 43.5 L58 45 M69 43.5 L62 45" stroke="#7a8fc0" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M56 55.5 Q60 58.5 64.5 55" stroke="#6b7fd6" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="51" cy="53" r="2.4" fill="#b8d8ff" opacity="0.6"/><circle cx="69" cy="53" r="2.4" fill="#b8d8ff" opacity="0.6"/>' +
      // Krone: Band, Kristallzacken, Eisbonbons
      '<path class="kd-crown" d="M45 35 L75 35 L73 28 L47 28 Z" fill="#bfe9ff"/>' +
      '<path class="kd-crystal" d="M47 28 L50 14 L54 28 Z M56 28 L60 7 L64 28 Z M66 28 L70 14 L73 28 Z" ' +
        'fill="#e8fbff" stroke="#7fd0f2" stroke-width="0.8"/>' +
      '<circle class="kd-candy" cx="50" cy="13" r="3" fill="#a8e6ff"/>' +
      '<circle class="kd-candy" cx="60" cy="6" r="3.6" fill="#a8e6ff"/>' +
      '<circle class="kd-candy" cx="70" cy="13" r="3" fill="#a8e6ff"/>' +
      '<path class="kd-candy" d="M55 31.5 l-3.5 -2.8 v5.6 Z M65 31.5 l3.5 -2.8 v5.6 Z" fill="#a8e6ff"/>' +
      '<ellipse class="kd-candy" cx="60" cy="31.5" rx="4.5" ry="2.8" fill="#a8e6ff"/>' +
      '<path d="M58.5 4.5 a1.5 1.5 0 0 1 2.5 0" stroke="#fff" stroke-width="1" fill="none"/>' +
      '<path class="kd-crack" d="M59 9 l2 5 l-2.5 4 l3 6 M70 16 l-1 4 l2 3" stroke="#6b4fd6" stroke-width="1.1" ' +
        'fill="none" opacity="0"/>' +
    '</svg>';

  RS.UI.WorldArt.register(2, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return KANDARA_SVG; }
  });
})(window.RS = window.RS || {});
