(function (RS) {
  'use strict';

  // Welt 3, Karamellwüste: Zuckersand-Dünen, Karamellpyramiden, Lutscherkakteen unter
  // einem warmen Nachthimmel, Karamell-Kuppelhäuser, ein Tor aus hartem Karamell und der
  // Karamellkoloss als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in die Frostzuckerberge (Wegesanfang),
  // gate = Tor nach Station 10, pyramids = [x, Grundlinie, halbe Breite, Höhe],
  // hills = ferne Dünen, ground = naher Sand, trees = Lutscherkakteen.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[190, 580], [350, 548], [510, 585], [670, 552], [830, 520],
        [910, 400], [760, 330], [580, 360], [400, 318], [300, 190]],
      backGate: [70, 585],
      gate: [440, 140],
      crystal: [585, 112],
      moon: [880, 80],
      pyramids: [[150, 330, 120, 150], [330, 330, 85, 105], [690, 330, 135, 180], [870, 330, 80, 95]],
      hills: [
        [[0, 352], [200, 322], [420, 346], [640, 314], [860, 340], [1000, 320]],
        [[0, 420], [240, 398], [480, 428], [720, 392], [1000, 412]]
      ],
      ground: [
        [[0, 500], [220, 478], [460, 505], [700, 468], [900, 445], [1000, 455]],
        [[0, 612], [350, 594], [700, 618], [1000, 600]]
      ],
      trees: [[270, 470], [440, 460], [600, 495], [740, 625], [880, 600], [965, 470],
        [660, 262], [225, 330], [290, 410], [880, 280], [120, 420], [420, 630]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[165, 1195], [295, 1075], [105, 955], [300, 835], [100, 715],
        [290, 595], [110, 475], [300, 355], [115, 250], [250, 150]],
      backGate: [318, 1250],
      gate: [155, 118],
      crystal: [78, 100],
      moon: [342, 58],
      pyramids: [[80, 300, 75, 105], [300, 300, 100, 150]],
      hills: [
        [[0, 300], [130, 276], [270, 296], [400, 272]],
        [[0, 430], [150, 386], [300, 406], [400, 374]],
        [[0, 668], [120, 626], [280, 654], [400, 614]],
        [[0, 906], [160, 874], [300, 894], [400, 864]]
      ],
      ground: [
        [[0, 1140], [140, 1104], [290, 1124], [400, 1094]],
        [[0, 1270], [200, 1250], [400, 1266]]
      ],
      trees: [[370, 1150], [30, 1040], [30, 780], [370, 900], [370, 650], [30, 540],
        [30, 330], [370, 420], [370, 220], [40, 1250]]
    }
  };

  // Karamellpyramide: Schattenseite rechts, Schichtfugen und eine glänzende Karamellkappe.
  function pyramid(p, i) {
    var x = p[0];
    var base = p[1];
    var hw = p[2];
    var top = base - p[3];
    var out = '<g class="art-pyramid' + (i % 2 ? ' art-pyramid--b' : '') + '">';
    out += path('art-pyramid-body', 'M' + (x - hw) + ' ' + base + ' L' + x + ' ' + top + ' L' + (x + hw) + ' ' + base + ' Z');
    out += path('art-pyramid-shade', 'M' + x + ' ' + top + ' L' + (x + hw) + ' ' + base + ' L' + (x + hw * 0.2) + ' ' + base + ' Z');
    var lines = '';
    [0.4, 0.62, 0.82].forEach(function (f) {
      var y = top + p[3] * f;
      var half = hw * f;
      lines += 'M' + (x - half).toFixed(1) + ' ' + y.toFixed(1) + ' H' + (x + half).toFixed(1) + ' ';
    });
    out += path('art-pyramid-lines', lines);
    var cy = top + p[3] * 0.24;
    var cw = hw * 0.24;
    out += path('art-pyramid-cap', 'M' + (x - cw).toFixed(1) + ' ' + cy.toFixed(1) + ' L' + x + ' ' + top +
      ' L' + (x + cw).toFixed(1) + ' ' + cy.toFixed(1) + ' q-' + (cw * 0.3).toFixed(1) + ' 9 -' + (cw * 0.55).toFixed(1) +
      ' 1 q-' + (cw * 0.35).toFixed(1) + ' 13 -' + (cw * 0.7).toFixed(1) + ' 0 q-' + (cw * 0.4).toFixed(1) + ' 8 -' +
      (cw * 0.75).toFixed(1) + ' -1 Z');
    return out + '</g>';
  }

  // Warmer Schimmer am Horizont hinter den Pyramiden.
  function haze(layout) {
    var y = layout.h > layout.w ? 250 : 300;
    return '<ellipse class="art-desert-haze" cx="' + layout.w / 2 + '" cy="' + y + '" rx="' + layout.w * 0.7 + '" ry="90"/>';
  }

  // Hintere Kulisse: Sterne, Mond, Horizontschimmer, Pyramiden, Dünen. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 311 + layout.w, skyEnd);
    out += K.moon(layout.moon) + haze(layout) + '<g class="art-pyramids">';
    layout.pyramids.forEach(function (p, i) { out += pyramid(p, i); });
    out += '</g>' + K.hills(layout);
    return out + '</svg>';
  }

  // Lutscherkaktus: gestreifter Zuckerkaktus mit zwei Armen und einer Lutscherblüte.
  function cactus(x, y, i) {
    var cls = 'art-cactus' + (i % 3 === 1 ? ' art-cactus--mint' : (i % 3 === 2 ? ' art-cactus--lime' : ''));
    return '<g class="art-tree ' + cls + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="24" rx="13" ry="3"/>' +
      path('art-cactus-body', 'M-6 24 V-18 a6 6 0 0 1 12 0 V24 Z' +
        ' M-6 6 H-12 a4 4 0 0 1 -4 -4 V-8 a3 3 0 0 1 6 0 V0 H-6 Z' +
        ' M6 -2 H12 a2 2 0 0 0 2 -2 V-14 a3 3 0 0 1 6 0 V-2 a6 6 0 0 1 -6 6 H6 Z') +
      path('art-cactus-stripes', 'M-2 -20 V22 M2.5 -20 V22 M-13 -6 V2 M17 -12 V-2') +
      '<circle class="art-cactus-bloom" data-color="' + ((i + 3) % 6) + '" cx="0" cy="-26" r="5.5"/>' +
      path('art-cactus-swirl', 'M0 -26 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3.5 3.5 0 1 1 -6 0.5') +
      '</g>';
  }

  // Vordergrund: naher Sand, Weg, Lutscherkakteen, Karamell-Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.trees.forEach(function (t, i) { out += cactus(t[0], t[1], i); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'caramel');
    return out + '</svg>';
  }

  // Station als Karamell-Kuppelhaus: Kuppel in Bonbonfarbe mit Lutscherspitze, Karamelltropfen.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w3" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-chimney" x="29" y="2" width="2" height="8" rx="1"/>' +
      '<circle class="house-button" data-color="' + ((color + 3) % 6) + '" cx="30" cy="3.5" r="3"/>' +
      path('house-roof', 'M8 30 A22 21 0 0 1 52 30 Z', ' data-color="' + color + '"') +
      path('house-dome-shine', 'M15 24 A16 16 0 0 1 27 13') +
      '<rect class="house-body" x="9" y="28" width="42" height="27" rx="3"/>' +
      path('house-drip', 'M9 28 H51 V31 q-2.5 5 -5 0 q-2.5 3 -5 0 q-3 6 -6 0 q-2.5 3 -5 0 q-3 5 -6 0 ' +
        'q-2.5 3 -5 0 q-3 6 -6 0 q-2 3 -4 0 Z') +
      '<circle class="house-window" cx="20" cy="40" r="5"/>' +
      path('house-window-cross', 'M20 35 V45 M15 40 H25') +
      path('house-door', 'M33 55 V43 a6 6 0 0 1 12 0 V55 Z') +
      '<circle class="house-knob" cx="42.5" cy="49.5" r="1.2"/>' +
      path('house-sand', 'M11 52 h4 M20 53 h3 M47 52 h2') +
      '</svg>';
  }

  var clipCount = 0;

  // Tor aus hartem Karamell: Bogen aus Karamellblöcken mit Tropfen, geschlossen mit
  // Lakritzstäben davor. Die Klassen gate-portal, gate-bars und gate-sparkle teilen sich
  // die Öffnungsanimation mit den anderen Toren.
  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var clip = 'rs-gate-clip-3-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w3" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
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
      path('gate-caramel', 'M6 92 V46 A34 34 0 0 1 74 46 V92 H63 V46 A23 23 0 0 0 17 46 V92 Z') +
      path('gate-caramel-joints', 'M6 70 H17 M63 70 H74 M6 50 H17 M63 50 H74 M12 28 L21 34 M68 28 L59 34 M40 12 V23') +
      path('gate-caramel-shine', 'M10 88 V48 A30 30 0 0 1 30 17') +
      path('gate-caramel-drip', 'M24 21 q2 7 4 0 Z M48 19 q2.5 9 5 0 Z M66 40 q2 6 4 0 Z M8 60 q1.5 6 3 0 Z') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 0 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z') +
        path('gate-sparkle gate-sparkle--s', 'M4 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M76 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Karamellkoloss: großer Karamell-Golem mit Sandkörnern und sanften Augen, umhüllt vom
  // dunklen Schimmer des Bitterzaubers (Rune auf der Brust, Schwaden um den Kopf).
  var KOLOSS_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="128" rx="46" ry="5.5" fill="#000" opacity="0.28"/>' +
      // Schimmer des Bitterzaubers hinter der Figur
      '<ellipse class="kl-spell" cx="60" cy="66" rx="56" ry="60" fill="#5b2a86" opacity="0.32"/>' +
      // Beine
      '<rect class="kl-body" x="30" y="100" width="22" height="26" rx="9" fill="#c97a2e"/>' +
      '<rect class="kl-body" x="68" y="100" width="22" height="26" rx="9" fill="#c97a2e"/>' +
      // Arme mit Fäusten
      '<path class="kl-body" d="M26 58 Q8 64 8 92 Q8 104 18 104 Q28 104 27 92 Q27 78 34 72 Z" fill="#c97a2e"/>' +
      '<path class="kl-body" d="M94 58 Q112 64 112 92 Q112 104 102 104 Q92 104 93 92 Q93 78 86 72 Z" fill="#c97a2e"/>' +
      '<circle class="kl-fist" cx="17" cy="100" r="9" fill="#b36a24"/>' +
      '<circle class="kl-fist" cx="103" cy="100" r="9" fill="#b36a24"/>' +
      // Rumpf mit hellem Bauch
      '<path class="kl-body" d="M24 62 Q24 46 44 44 L76 44 Q96 46 96 62 L94 100 Q92 112 76 112 L44 112 Q28 112 26 100 Z" fill="#d98a3a"/>' +
      '<path class="kl-belly" d="M38 70 Q38 60 50 60 L70 60 Q82 60 82 70 L80 96 Q78 104 68 104 L52 104 Q42 104 40 96 Z" fill="#f2b866"/>' +
      // Rune des Bitterzaubers
      '<path class="kl-rune" d="M60 70 l9 12 -9 12 -9 -12 Z M60 76 v12 M54 82 h12" stroke="#7d3cc0" stroke-width="2.4" ' +
        'fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
      // Kopf mit Karamelltropfen
      '<path class="kl-body" d="M34 44 Q32 16 60 14 Q88 16 86 44 Q86 54 74 56 L46 56 Q34 54 34 44 Z" fill="#d98a3a"/>' +
      '<path class="kl-drip" d="M38 30 Q44 16 60 15 Q76 16 82 30 Q78 34 76 30 Q72 38 68 30 Q64 34 60 29 Q55 37 51 30 ' +
        'Q47 34 44 30 Q40 36 38 30 Z" fill="#f5c27a"/>' +
      '<path d="M44 22 Q50 18 56 18" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.55"/>' +
      // Sandkörner
      '<g class="kl-grains" fill="#fbe3b0">' +
        '<circle cx="30" cy="70" r="1.3"/><circle cx="34" cy="88" r="1"/><circle cx="88" cy="74" r="1.3"/>' +
        '<circle cx="86" cy="94" r="1"/><circle cx="46" cy="108" r="1.1"/><circle cx="74" cy="108" r="1.2"/>' +
        '<circle cx="15" cy="84" r="1.1"/><circle cx="105" cy="82" r="1.1"/><circle cx="40" cy="118" r="1"/>' +
        '<circle cx="80" cy="120" r="1"/><circle cx="40" cy="46" r="1"/><circle cx="80" cy="48" r="1.2"/>' +
      '</g>' +
      // Sanfte Augen, sanfter Mund
      '<ellipse cx="50" cy="40" rx="6" ry="6.5" fill="#fffaf0"/>' +
      '<ellipse cx="70" cy="40" rx="6" ry="6.5" fill="#fffaf0"/>' +
      '<circle class="kl-pupil" cx="50.5" cy="41" r="3.4" fill="#5a2c10"/>' +
      '<circle class="kl-pupil" cx="69.5" cy="41" r="3.4" fill="#5a2c10"/>' +
      '<circle cx="51.8" cy="39.4" r="1.2" fill="#fff"/><circle cx="70.8" cy="39.4" r="1.2" fill="#fff"/>' +
      '<path class="kl-brow" d="M43 32 Q48 29 54 31 M66 31 Q72 29 77 32" stroke="#8a4a18" stroke-width="2" ' +
        'stroke-linecap="round" fill="none"/>' +
      '<path d="M53 50 Q60 54 67 50" stroke="#8a4a18" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="43" cy="48" r="2.6" fill="#f08a5a" opacity="0.45"/><circle cx="77" cy="48" r="2.6" fill="#f08a5a" opacity="0.45"/>' +
      // Schwaden des Bitterzaubers um den Kopf
      '<path class="kl-wisp" d="M28 40 q-6 -6 0 -12 q6 -6 0 -12 q-5 -5 -1 -10 M92 40 q6 -6 0 -12 q-6 -6 0 -12 q5 -5 1 -10" ' +
        'stroke="#7d3cc0" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.7"/>' +
      // Risse ab der zweiten Phase
      '<path class="kl-crack" d="M30 66 l6 6 -2 6 5 6 M88 60 l-5 7 3 5 -4 7 M58 18 l2 6 -3 4" stroke="#6b3a12" ' +
        'stroke-width="1.4" fill="none" opacity="0"/>' +
    '</svg>';

  RS.UI.WorldArt.register(3, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return KOLOSS_SVG; }
  });
})(window.RS = window.RS || {});
