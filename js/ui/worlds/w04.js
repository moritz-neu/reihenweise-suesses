(function (RS) {
  'use strict';

  // Welt 4, Kaugummi-Dschungel: riesige Blätter, Kaugummiblüten-Bäume, Lianen und
  // Glühwürmchen unter einem grünen Nachthimmel, Baumhäuser als Stationen, ein Tor aus
  // verdrehten Kaugummiranken und die Kaugummi-Krake Blubba als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in die Karamellwüste (Wegesanfang),
  // gate = Tor nach Station 10, leaves = Riesenblätter [x, Fuß, Länge, Neigung in Grad],
  // vines = Lianen [x, Länge], hills = ferne Hügel, ground = naher Boden,
  // trees = Kaugummiblüten-Bäume, flies = Anzahl der Glühwürmchen.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[810, 580], [650, 548], [490, 585], [330, 552], [170, 520],
        [90, 400], [240, 330], [420, 360], [600, 318], [700, 190]],
      backGate: [930, 585],
      gate: [560, 140],
      crystal: [415, 112],
      moon: [120, 80],
      leaves: [[60, 360, 170, -18], [250, 352, 120, 14], [520, 348, 95, -28], [720, 352, 180, -8], [920, 358, 130, 22]],
      vines: [[180, 130], [330, 70], [790, 150], [930, 95]],
      hills: [
        [[0, 320], [140, 340], [360, 314], [580, 346], [800, 322], [1000, 352]],
        [[0, 412], [280, 392], [520, 428], [760, 398], [1000, 420]]
      ],
      ground: [
        [[0, 455], [100, 445], [300, 468], [540, 505], [780, 478], [1000, 500]],
        [[0, 600], [300, 618], [650, 594], [1000, 612]]
      ],
      trees: [[730, 470], [560, 460], [400, 495], [260, 625], [120, 600], [35, 470],
        [340, 262], [775, 330], [710, 410], [120, 280], [880, 420], [580, 630]],
      flies: 26
    },
    tall: {
      w: 400, h: 1300,
      route: [[235, 1195], [105, 1075], [295, 955], [100, 835], [300, 715],
        [110, 595], [290, 475], [100, 355], [285, 250], [150, 150]],
      backGate: [82, 1250],
      gate: [245, 118],
      crystal: [322, 100],
      moon: [58, 58],
      leaves: [[30, 300, 120, -16], [210, 296, 80, 8], [370, 302, 140, 20]],
      vines: [[120, 90], [360, 130]],
      hills: [
        [[0, 272], [130, 296], [270, 276], [400, 300]],
        [[0, 374], [100, 406], [250, 386], [400, 430]],
        [[0, 614], [120, 654], [280, 626], [400, 668]],
        [[0, 864], [100, 894], [240, 874], [400, 906]]
      ],
      ground: [
        [[0, 1094], [110, 1124], [260, 1104], [400, 1140]],
        [[0, 1266], [200, 1250], [400, 1270]]
      ],
      trees: [[30, 1150], [370, 1040], [370, 780], [30, 900], [30, 650], [370, 540],
        [370, 330], [30, 420], [30, 220], [360, 1250]],
      flies: 22
    }
  };

  // Riesenblatt: wächst vom Fuß schräg nach oben, mit Mittelrippe und Seitenadern.
  function leaf(l, i) {
    var x = l[0];
    var base = l[1];
    var len = l[2];
    var half = len * 0.32;
    var d = 'M0 0 C' + (-half) + ' ' + (-len * 0.3) + ' ' + (-half * 0.8) + ' ' + (-len * 0.8) + ' 0 ' + (-len) +
      ' C' + (half * 0.8) + ' ' + (-len * 0.8) + ' ' + half + ' ' + (-len * 0.3) + ' 0 0 Z';
    var veins = 'M0 -4 V' + (-len * 0.94).toFixed(1);
    [0.25, 0.45, 0.65].forEach(function (f) {
      var y = -len * f;
      var w = half * (0.85 - f * 0.5);
      veins += ' M0 ' + y.toFixed(1) + ' q' + (-w * 0.5).toFixed(1) + ' ' + (-len * 0.05).toFixed(1) + ' ' +
        (-w).toFixed(1) + ' ' + (-len * 0.12).toFixed(1) +
        ' M0 ' + y.toFixed(1) + ' q' + (w * 0.5).toFixed(1) + ' ' + (-len * 0.05).toFixed(1) + ' ' +
        w.toFixed(1) + ' ' + (-len * 0.12).toFixed(1);
    });
    return '<g class="art-leaf' + (i % 2 ? ' art-leaf--b' : '') + '" transform="translate(' + x + ' ' + base +
      ') rotate(' + l[3] + ')">' + path('art-leaf-body', d) + path('art-leaf-veins', veins) + '</g>';
  }

  // Liane: hängt vom oberen Rand herab, mit kleinen Blättchen.
  function vine(v) {
    var x = v[0];
    var len = v[1];
    var d = 'M' + x + ' 0';
    var leaves = '';
    for (var y = 0; y < len; y += 30) {
      var dir = (y / 30) % 2 ? -1 : 1;
      d += ' q' + (dir * 10) + ' 15 0 30';
      leaves += path('art-vine-leaf', 'M' + x + ' ' + (y + 15) + ' q' + (dir * 9) + ' -8 ' + (dir * 14) + ' 0 q' +
        (dir * -6) + ' 6 ' + (dir * -14) + ' 0 Z');
    }
    return '<g class="art-vine">' + path('art-vine-stem', d) + leaves + '</g>';
  }

  // Hintere Kulisse: Sterne, Mond, Riesenblätter, Lianen, Hügel. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 433 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-leaves">';
    layout.leaves.forEach(function (l, i) { out += leaf(l, i); });
    out += '</g>';
    layout.vines.forEach(function (v) { out += vine(v); });
    out += K.hills(layout);
    return out + '</svg>';
  }

  // Kaugummiblüten-Baum: krummer Stamm, rundes Laub und Kaugummiblasen als Blüten.
  function tree(x, y, i) {
    var cls = 'art-gumtree' + (i % 3 === 1 ? ' art-gumtree--teal' : (i % 3 === 2 ? ' art-gumtree--lime' : ''));
    var c1 = (i + 4) % 6;
    var c2 = (i + 1) % 6;
    return '<g class="art-tree ' + cls + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="24" rx="15" ry="3.2"/>' +
      path('art-gumtree-trunk', 'M-4 24 Q-2 8 -6 -4 L2 -6 Q4 8 4 24 Z') +
      path('art-gumtree-crown', 'M-20 -8 a11 10 0 0 1 8 -16 a12 11 0 0 1 22 -2 a10 10 0 0 1 10 16 ' +
        'a8 7 0 0 1 -10 9 H-12 a8 7 0 0 1 -8 -7 Z') +
      path('art-gumtree-shine', 'M-14 -14 q3 -6 10 -8') +
      '<circle class="art-gumtree-bloom" data-color="' + c1 + '" cx="-9" cy="-12" r="4.2"/>' +
      '<circle class="art-gumtree-bloom" data-color="' + c2 + '" cx="9" cy="-18" r="3.6"/>' +
      '<circle class="art-gumtree-bloom" data-color="' + c1 + '" cx="13" cy="-5" r="3"/>' +
      '<circle class="art-gumtree-bloom-shine" cx="-10.4" cy="-13.4" r="1.2"/>' +
      '<circle class="art-gumtree-bloom-shine" cx="7.9" cy="-19.2" r="1"/>' +
      '</g>';
  }

  // Glühwürmchen: feste Punkte mit Leuchthof, einige blinken.
  function fireflies(layout) {
    var r = K.rng(977 + layout.w);
    var top = layout.h > layout.w ? 300 : 340;
    var out = '<g class="art-flies">';
    for (var i = 0; i < layout.flies; i++) {
      var x = (r() * layout.w).toFixed(1);
      var y = (top + r() * (layout.h - top - 20)).toFixed(1);
      out += '<g class="art-fly' + (i % 3 === 0 ? ' is-blink' : '') + '" style="animation-delay:' + (r() * 4).toFixed(1) + 's">' +
        '<circle class="art-fly-glow" cx="' + x + '" cy="' + y + '" r="5"/>' +
        '<circle class="art-fly-dot" cx="' + x + '" cy="' + y + '" r="1.6"/></g>';
    }
    return out + '</g>';
  }

  // Vordergrund: naher Boden, Weg, Kaugummiblüten-Bäume, Glühwürmchen, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.trees.forEach(function (t, i) { out += tree(t[0], t[1], i); });
    out += fireflies(layout);
    out += K.crystal(layout.crystal, opts.crystalLit, 'gum');
    return out + '</svg>';
  }

  // Station als Baumhaus: Hütte auf einer Plattform mit Blätterdach in Bonbonfarbe,
  // Leiter am Stamm und einer Kaugummiblase auf dem Dach.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w4" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      path('house-trunk', 'M25 56 Q27 44 26 34 H34 Q33 44 35 56 Z') +
      path('house-ladder', 'M38 34 V55 M44 34 V55 M38 40 H44 M38 46 H44 M38 52 H44') +
      '<rect class="house-deck" x="5" y="30" width="50" height="4.5" rx="2"/>' +
      '<rect class="house-body" x="12" y="14" width="36" height="17" rx="2"/>' +
      path('house-roof', 'M3 18 Q30 -6 57 18 Q44 13 30 16 Q16 13 3 18 Z', ' data-color="' + color + '"') +
      path('house-leafvein', 'M8 16 Q30 2 52 16 M30 6 V15') +
      '<circle class="house-button" data-color="' + ((color + 3) % 6) + '" cx="30" cy="4" r="3"/>' +
      '<circle class="house-window" cx="21" cy="22.5" r="4"/>' +
      path('house-window-cross', 'M21 18.5 V26.5 M17 22.5 H25') +
      path('house-door', 'M33 31 V23 a5 5 0 0 1 10 0 V31 Z') +
      '<circle class="house-knob" cx="40.5" cy="27.5" r="1.1"/>' +
      path('house-liana', 'M27 34 q-4 5 0 10 q4 5 0 10') +
      '</svg>';
  }

  var clipCount = 0;

  // Tor aus verdrehten Kaugummiranken: zwei ineinander gedrehte Ranken als Bogen, Blätter
  // und eine Kaugummiblase obenauf, geschlossen mit Lakritzstäben davor. Die Klassen
  // gate-portal, gate-bars und gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var arch = 'M11 92 V46 A29 29 0 0 1 69 46 V92';
    var clip = 'rs-gate-clip-4-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w4" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
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
      path('gate-gum', arch) +
      path('gate-gum-twist', arch) +
      path('gate-gum-shine', 'M9 86 V48 A31 31 0 0 1 28 19') +
      path('gate-gum-leaf', 'M6 60 q-6 -8 2 -14 q4 8 -2 14 Z M74 66 q6 -8 -2 -14 q-4 8 2 14 Z ' +
        'M20 22 q-9 -2 -8 -10 q8 1 8 10 Z M60 22 q9 -2 8 -10 q-8 1 -8 10 Z') +
      '<circle class="gate-gum-bubble" cx="40" cy="12" r="7"/>' +
      path('gate-gum-bubble-shine', 'M36 9 a4.5 4.5 0 0 1 4 -2.6') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 -2 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M4 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M76 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Kaugummi-Krake Blubba: rosa Kaugummikrake mit Tupfen, sechs geringelten Armen mit
  // Saugnäpfen und gespitztem Mund, aus dem eine große Kaugummiblase wächst.
  var ARMS = [
    'M30 64 Q14 88 22 106 Q28 118 14 122',
    'M39 68 Q30 96 38 112 Q42 122 32 126',
    'M50 70 Q47 98 53 114 Q57 124 48 128',
    'M62 70 Q66 98 61 114 Q58 124 68 128',
    'M72 68 Q82 94 76 110 Q72 120 84 124',
    'M78 62 Q98 80 94 100 Q92 112 106 114'
  ];

  var BLUBBA_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="58" cy="129" rx="48" ry="5" fill="#000" opacity="0.28"/>' +
      // Arme mit Saugnäpfen
      '<g class="bl-arms" fill="none" stroke="#f0609f" stroke-width="10" stroke-linecap="round">' +
        ARMS.map(function (d) { return '<path class="bl-arm" d="' + d + '"/>'; }).join('') +
      '</g>' +
      '<g class="bl-suckers" fill="#ffc2e2">' +
        '<circle cx="20" cy="96" r="1.8"/><circle cx="21" cy="110" r="1.6"/><circle cx="34" cy="100" r="1.8"/>' +
        '<circle cx="38" cy="116" r="1.6"/><circle cx="49" cy="104" r="1.8"/><circle cx="53" cy="118" r="1.6"/>' +
        '<circle cx="64" cy="104" r="1.8"/><circle cx="61" cy="118" r="1.6"/><circle cx="78" cy="100" r="1.8"/>' +
        '<circle cx="76" cy="114" r="1.6"/><circle cx="94" cy="92" r="1.8"/><circle cx="96" cy="106" r="1.6"/>' +
      '</g>' +
      // Kopf mit Tupfen
      '<path class="bl-body" d="M22 70 Q14 16 52 12 Q90 16 82 70 Q52 80 22 70 Z" fill="#ff6fb7"/>' +
      '<path class="bl-belly" d="M30 68 Q52 76 74 68 Q70 60 52 60 Q34 60 30 68 Z" fill="#ff9ccd"/>' +
      '<g class="bl-spots" fill="#ffa6d6">' +
        '<circle cx="34" cy="26" r="4"/><circle cx="46" cy="18" r="2.6"/><circle cx="70" cy="22" r="3.4"/>' +
        '<circle cx="26" cy="46" r="2.4"/><circle cx="78" cy="38" r="2.2"/>' +
      '</g>' +
      '<path d="M30 30 Q36 18 48 16" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.6"/>' +
      // Augen, Wangen, Brauen ab Phase 2
      '<ellipse cx="42" cy="42" rx="7.5" ry="8.5" fill="#fffaf6"/>' +
      '<ellipse cx="62" cy="42" rx="7.5" ry="8.5" fill="#fffaf6"/>' +
      '<circle class="bl-pupil" cx="43.5" cy="44" r="4" fill="#4a1238"/>' +
      '<circle class="bl-pupil" cx="63.5" cy="44" r="4" fill="#4a1238"/>' +
      '<circle cx="45" cy="42" r="1.4" fill="#fff"/><circle cx="65" cy="42" r="1.4" fill="#fff"/>' +
      '<path class="bl-brow" d="M34 31 Q40 34 48 32 M56 32 Q64 34 70 31" stroke="#8a1f5c" stroke-width="2.4" ' +
        'stroke-linecap="round" fill="none" opacity="0"/>' +
      '<circle cx="33" cy="56" r="3.4" fill="#ff3d8f" opacity="0.4"/><circle cx="68" cy="58" r="3" fill="#ff3d8f" opacity="0.4"/>' +
      // Gespitzter Mund und die Kaugummiblase
      '<path class="bl-neck" d="M75 54 Q80 50 84 48 L86 54 Q80 56 76 58 Z" fill="#ff8fc6"/>' +
      '<circle cx="74" cy="56" r="3.6" fill="#c2306f"/>' +
      '<circle cx="74" cy="56" r="3.6" fill="none" stroke="#ff9ccd" stroke-width="1.6"/>' +
      '<g class="bl-bubble">' +
        '<circle cx="99" cy="40" r="18" fill="#ff8fd0" opacity="0.82" stroke="#ffd3ee" stroke-width="1.6"/>' +
        '<path d="M89 32 A12 12 0 0 1 99 26" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.85"/>' +
        '<circle cx="107" cy="48" r="2" fill="#fff" opacity="0.6"/>' +
      '</g>' +
    '</svg>';

  RS.UI.WorldArt.register(4, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return BLUBBA_SVG; }
  });
})(window.RS = window.RS || {});
