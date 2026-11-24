(function (RS) {
  'use strict';

  // Welt 8, Marzipanschloss: ein Schloss aus Marzipan auf einem Hügel unter einem rosa
  // Nachthimmel, Schlossgärten mit Marzipanrosen und Wimpelstangen, Wimpelketten zwischen
  // den Stationen, kleine Schlosstürme als Stationen, ein Burgtor mit Fallgitter und
  // Ritter Mandelbart als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in den Knallhafen (Wegesanfang),
  // gate = Tor nach Station 10, castle = Schloss [x, Fuß y, Größe], hills = Hügel,
  // ground = Schlossgarten, props = Rosenbüsche und Wimpelstangen [x, y],
  // bunting = Wimpelketten [x1, y1, x2, y2], pearls = schwebende Zuckerperlen [x, y, Farbe].
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[205, 585], [350, 550], [495, 585], [645, 550], [795, 518],
        [905, 418], [750, 332], [568, 362], [392, 322], [285, 196]],
      backGate: [88, 584],
      gate: [150, 150],
      crystal: [430, 112],
      moon: [870, 80],
      castle: [640, 306, 1.15],
      hills: [
        [[0, 296], [140, 310], [350, 290], [580, 306], [800, 286], [1000, 300]],
        [[0, 334], [400, 340], [700, 332], [1000, 336]]
      ],
      ground: [
        [[0, 488], [300, 470], [550, 482], [800, 462], [1000, 470]],
        [[0, 612], [320, 598], [680, 616], [1000, 604]]
      ],
      props: [[170, 470], [330, 465], [500, 495], [660, 455], [940, 560], [965, 455],
        [470, 405], [70, 430], [880, 615], [420, 630], [30, 520], [230, 400]],
      bunting: [[350, 550, 495, 585], [645, 550, 795, 518], [568, 362, 750, 332]],
      pearls: [[120, 140, 0], [300, 70, 1], [560, 60, 3], [760, 150, 4], [960, 210, 5], [480, 220, 2]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[165, 1195], [295, 1075], [105, 955], [300, 835], [100, 715],
        [290, 595], [110, 475], [300, 355], [130, 250], [250, 150]],
      backGate: [320, 1250],
      gate: [118, 118],
      crystal: [345, 450],
      moon: [330, 58],
      castle: [330, 296, 0.5],
      hills: [
        [[0, 292], [120, 274], [280, 296], [400, 282]],
        [[0, 332], [200, 326], [400, 330]],
        [[0, 652], [110, 622], [270, 640], [400, 618]],
        [[0, 894], [150, 872], [290, 886], [400, 868]]
      ],
      ground: [
        [[0, 1136], [130, 1102], [280, 1122], [400, 1096]],
        [[0, 1272], [200, 1252], [400, 1268]]
      ],
      props: [[30, 1140], [370, 1150], [370, 950], [30, 840], [30, 610], [370, 700],
        [365, 525], [30, 380], [40, 1260]],
      bunting: [[295, 1075, 105, 955], [100, 715, 290, 595]],
      pearls: [[60, 150, 0], [200, 40, 3], [370, 170, 1], [40, 560, 4], [360, 780, 5]]
    }
  };

  // Schloss aus Marzipan: Hauptbau mit Zinnen, zwei Seitentürme und ein hoher Mittelturm mit
  // spitzen Dächern in Bonbonfarben, Wimpel auf den Spitzen, warme Fenster und ein Torbogen.
  function tower(x, top, w, color) {
    var h = w / 2;
    return '<rect class="art-castle-wall" x="' + (x - h) + '" y="' + top + '" width="' + w + '" height="' + (-top) + '"/>' +
      path('art-castle-roof', 'M' + (x - h - 4) + ' ' + top + ' L' + x + ' ' + (top - w * 1.2) + ' L' + (x + h + 4) + ' ' + top + ' Z',
        ' data-color="' + color + '"') +
      path('art-castle-pole', 'M' + x + ' ' + (top - w * 1.2) + ' V' + (top - w * 1.2 - 12)) +
      path('art-castle-flag', 'M' + x + ' ' + (top - w * 1.2 - 12) + ' l11 3 -11 3 Z', ' data-color="' + ((color + 2) % 6) + '"') +
      '<rect class="art-castle-window" x="' + (x - 3) + '" y="' + (top + 10) + '" width="6" height="9" rx="3"/>';
  }

  function crenels(x1, x2, y) {
    var out = '';
    for (var x = x1; x + 6 <= x2; x += 10) {
      out += '<rect class="art-castle-wall" x="' + x + '" y="' + (y - 6) + '" width="6" height="7"/>';
    }
    return out;
  }

  function castle(c) {
    return '<g class="art-castle" transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">' +
      '<rect class="art-castle-wall" x="-62" y="-80" width="124" height="80"/>' +
      crenels(-62, 62, -80) +
      tower(-80, -116, 30, 0) + tower(80, -116, 30, 4) + tower(0, -142, 36, 3) +
      path('art-castle-trim', 'M-62 -58 H62') +
      '<rect class="art-castle-window" x="-40" y="-50" width="8" height="12" rx="4"/>' +
      '<rect class="art-castle-window" x="32" y="-50" width="8" height="12" rx="4"/>' +
      path('art-castle-door', 'M-14 0 V-22 A14 14 0 0 1 14 -22 V0 Z') +
      '</g>';
  }

  // Schwebende Zuckerperle mit kleinem Glanzpunkt.
  function pearl(p) {
    return '<g class="art-pearl" transform="translate(' + p[0] + ' ' + p[1] + ')">' +
      '<circle class="art-pearl-ball" r="4.5" data-color="' + p[2] + '"/>' +
      '<circle class="art-pearl-shine" cx="-1.5" cy="-1.5" r="1.4"/></g>';
  }

  // Hintere Kulisse: Sterne, Mond, Zuckerperlen, Hügel mit dem Marzipanschloss.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 270 : 300;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 811 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-pearls">';
    layout.pearls.forEach(function (p) { out += pearl(p); });
    out += '</g>';
    var hills = layout.hills;
    out += K.hills({ hills: hills.slice(0, 1), w: layout.w, h: layout.h }) + castle(layout.castle);
    out += K.hills({ hills: hills.slice(1), w: layout.w, h: layout.h }).replace(/art-hill--(\d)/g, function (m, n) {
      return 'art-hill--' + (Number(n) + 1);
    });
    return out + '</svg>';
  }

  // Wimpelkette: ein leicht durchhängendes Band mit dreieckigen Wimpeln in Bonbonfarben.
  function bunting(b, k) {
    var x1 = b[0];
    var y1 = b[1] - 46;
    var x2 = b[2];
    var y2 = b[3] - 46;
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2 + 18;
    var out = '<g class="art-bunting">' + path('art-bunting-line', 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2);
    for (var i = 1; i < 8; i++) {
      var t = i / 8;
      var x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * mx + t * t * x2;
      var y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * my + t * t * y2;
      out += path('art-bunting-flag', 'M' + (x - 5).toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x + 5).toFixed(1) + ' ' +
        y.toFixed(1) + ' L' + x.toFixed(1) + ' ' + (y + 10).toFixed(1) + ' Z', ' data-color="' + ((i + k) % 6) + '"');
    }
    return out + '</g>';
  }

  // Marzipanrosenbusch: runder Busch mit drei Rosen.
  function roseBush(i) {
    return '<circle class="art-bush" cx="-7" cy="8" r="9"/><circle class="art-bush" cx="7" cy="8" r="9"/>' +
      '<circle class="art-bush" cx="0" cy="0" r="10"/>' +
      '<circle class="art-rose" cx="-6" cy="2" r="3.4" data-color="' + (i % 2 === 0 ? 0 : 4) + '"/>' +
      '<circle class="art-rose" cx="5" cy="-3" r="3.4" data-color="' + (i % 4 === 0 ? 4 : 0) + '"/>' +
      '<circle class="art-rose" cx="3" cy="9" r="3" data-color="1"/>' +
      path('art-rose-swirl', 'M-7 2 a1.4 1.4 0 1 1 1.4 1 M4 -3 a1.4 1.4 0 1 1 1.4 1');
  }

  // Wimpelstange: gedrechselte Stange mit Kugel und wehendem Wimpel in Bonbonfarbe.
  function pennantPole(i) {
    return path('art-pole', 'M0 20 V-22') +
      '<circle class="art-pole-knob" cx="0" cy="-24" r="2.6"/>' +
      path('art-pole-flag', 'M1 -20 Q10 -18 18 -14 Q10 -10 1 -8 Z', ' data-color="' + (((i - 1) / 2 + 1) % 6) + '"');
  }

  // Im Schlossgarten abwechselnd ein Rosenbusch und eine Wimpelstange.
  function prop(p, i) {
    return '<g class="art-tree art-prop" transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.3)">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="20" rx="13" ry="3"/>' +
      (i % 2 === 0 ? roseBush(i) : pennantPole(i)) + '</g>';
  }

  // Vordergrund: Schlossgarten, Weg, Wimpelketten, Rosenbüsche, Wimpelstangen, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.bunting.forEach(function (b, k) { out += bunting(b, k); });
    layout.props.forEach(function (p, i) { out += prop(p, i); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'marzipan');
    return out + '</svg>';
  }

  // Station als kleiner Schlossturm: runder Turm aus Marzipan mit spitzem Dach in Bonbonfarbe,
  // Wimpel, Bogenfenster, Tür und ein Zinnenkranz.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w8" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-body" x="17" y="24" width="26" height="30" rx="2"/>' +
      path('house-stones', 'M17 30 H43 M17 44 H43') +
      '<rect class="house-crenel" x="14" y="21" width="32" height="5" rx="1"/>' +
      path('house-roof', 'M12 22 L30 6 L48 22 Z', ' data-color="' + color + '"') +
      path('house-flag-pole', 'M30 6 V0') +
      path('house-flag', 'M30 0 l8 2.5 -8 2.5 Z', ' data-color="' + ((color + 3) % 6) + '"') +
      path('house-window', 'M26 38 V31 A4 4 0 0 1 34 31 V38 Z') +
      path('house-door', 'M25 54 V48 A5 5 0 0 1 35 48 V54 Z') +
      '</svg>';
  }

  var clipCount = 0;

  // Burgtor aus Marzipan: zwei Tortürme mit Zinnen, ein Bogen mit Mandelsteinen, oben ein Wimpel.
  // Die Lakritzstäbe sind hier das Fallgitter. Die Klassen gate-portal, gate-bars und
  // gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  function gateTower(x) {
    return '<rect class="gate-tower" x="' + (x - 8) + '" y="30" width="16" height="62"/>' +
      '<rect class="gate-tower" x="' + (x - 9) + '" y="24" width="5" height="7"/>' +
      '<rect class="gate-tower" x="' + (x - 2.5) + '" y="24" width="5" height="7"/>' +
      '<rect class="gate-tower" x="' + (x + 4) + '" y="24" width="5" height="7"/>' +
      '<rect class="gate-tower-window" x="' + (x - 2) + '" y="40" width="4" height="8" rx="2"/>';
  }

  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var arch = 'M14 92 V46 A26 26 0 0 1 66 46 V92';
    var clip = 'rs-gate-clip-8-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w8" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="36" ry="5"/>' +
      gateTower(8) + gateTower(72) +
      '<defs><clipPath id="' + clip + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#' + clip + ')"><g class="gate-bars">' +
        '<rect x="22" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="37" y="20" width="6" height="72" rx="3"/>' +
        '<rect x="52" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="17" y="50" width="46" height="5" rx="2.5"/>' +
        '<rect x="17" y="70" width="46" height="5" rx="2.5"/>' +
        path('gate-bar-shine', 'M24 34 V88 M39 24 V88 M54 34 V88') +
      '</g></g>' +
      path('gate-marzipan', arch) + path('gate-marzipan-stones', arch) +
      path('gate-pole', 'M40 20 V4') +
      path('gate-pennant', 'M40 4 L54 8 L40 12 Z') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M58 -12 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M20 8 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M78 6 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Ritter Mandelbart: Ritter in silberner Rüstung mit rosa Wappenrock, unter dem offenen Visier
  // ein langer Bart aus Mandelsplittern, ein Federbusch auf dem Helm. Links trägt er einen Schild
  // mit einer Mandel als Wappen, rechts eine Lanze aus Mandelkrokant mit Wimpel. Ab Phase 2
  // glüht der Schild (md-glow), er runzelt die Stirn (md-brow), der Federbusch färbt sich rot
  // (md-plume) und er reißt die Lanze höher (md-arm).
  function almond(x, y, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="3.2" ry="5.6" transform="rotate(' + rot + ' ' + x + ' ' + y + ')" ' +
      'fill="#e2b07a" stroke="#a86e3a" stroke-width="0.8"/>';
  }

  var BEARD = [[50, 72, 20], [56, 76, 8], [64, 76, -8], [70, 72, -20], [53, 83, 12], [60, 86, 0], [67, 83, -12], [60, 95, 0],
    [56, 92, 10], [64, 92, -10]];

  var MANDELBART_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="42" ry="5" fill="#000" opacity="0.28"/>' +
      // Beine in Beinschienen
      '<rect x="44" y="104" width="12" height="22" rx="3" fill="#c8ccd8" stroke="#7a7e94" stroke-width="1"/>' +
      '<rect x="64" y="104" width="12" height="22" rx="3" fill="#c8ccd8" stroke="#7a7e94" stroke-width="1"/>' +
      '<path d="M40 126 H58 V122 H44 Z M62 126 H80 L76 122 H62 Z" fill="#8a8ea4"/>' +
      // Brustpanzer und rosa Wappenrock mit Mandel
      '<path d="M38 108 Q34 76 60 70 Q86 76 82 108 Z" fill="#d4d8e4" stroke="#7a7e94" stroke-width="1.2"/>' +
      '<path d="M46 108 L48 82 Q60 78 72 82 L74 108 Z" fill="#f29ac0" stroke="#c0608a" stroke-width="1"/>' +
      '<ellipse cx="60" cy="97" rx="5" ry="8" fill="#e2b07a" stroke="#a86e3a" stroke-width="1"/>' +
      '<path d="M44 108 H76" stroke="#e8b84a" stroke-width="3" stroke-linecap="round"/>' +
      // Schild mit Mandelwappen
      '<g class="md-shield">' +
        '<path d="M14 82 H38 V100 Q38 114 26 120 Q14 114 14 100 Z" fill="#b48ae0" stroke="#e8b84a" stroke-width="2"/>' +
        '<path class="md-glow" d="M14 82 H38 V100 Q38 114 26 120 Q14 114 14 100 Z" fill="none" stroke="#ffe27a" stroke-width="3" opacity="0"/>' +
        '<ellipse cx="26" cy="99" rx="5" ry="8.5" fill="#e2b07a" stroke="#a86e3a" stroke-width="1"/>' +
        '<path d="M26 92 Q24 99 26 106" stroke="#a86e3a" stroke-width="0.8" fill="none"/>' +
      '</g>' +
      // Rechter Arm mit Lanze aus Mandelkrokant und Wimpel
      '<g class="md-arm">' +
        '<path d="M80 84 Q92 86 96 76" stroke="#c8ccd8" stroke-width="8" stroke-linecap="round" fill="none"/>' +
        '<path d="M97 112 L102 14" stroke="#c08a4a" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M98.6 92 L100.6 88 M99.4 76 L101.4 72 M100.2 60 L102.2 56 M101 44 L103 40" stroke="#7a4a22" stroke-width="1.4"/>' +
        '<path d="M102 6 L106 18 L98 18 Z" fill="#e8ecf4" stroke="#7a7e94" stroke-width="0.8"/>' +
        '<path d="M101.4 22 L118 26 L101 31 Z" fill="#f29ac0"/>' +
        '<circle cx="96" cy="76" r="5.5" fill="#a8acbc" stroke="#7a7e94" stroke-width="1"/>' +
      '</g>' +
      // Helm mit offenem Visier, Gesicht, Brauen und Federbusch
      '<path class="md-plume" d="M60 26 Q64 8 80 6 Q72 14 74 24 Q68 20 60 28 Z" fill="#f29ac0"/>' +
      '<path d="M38 56 Q38 26 60 26 Q82 26 82 56 L78 70 H42 Z" fill="#d4d8e4" stroke="#7a7e94" stroke-width="1.2"/>' +
      '<path d="M45 46 H75 V66 Q60 72 45 66 Z" fill="#f6d2b0"/>' +
      '<path d="M44 44 H76" stroke="#7a7e94" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="53" cy="53" r="2.4" fill="#2a1e2e"/><circle cx="67" cy="53" r="2.4" fill="#2a1e2e"/>' +
      '<circle cx="53.8" cy="52.2" r="0.8" fill="#fff"/><circle cx="67.8" cy="52.2" r="0.8" fill="#fff"/>' +
      '<path d="M60 31 V43" stroke="#e8b84a" stroke-width="2"/>' +
      '<path class="md-brow" d="M48 48 Q52 50 57 49 M63 49 Q68 50 72 48" stroke="#5a3a22" stroke-width="2.2" ' +
        'stroke-linecap="round" fill="none" opacity="0"/>' +
      // Bart aus Mandelsplittern
      BEARD.map(function (b) { return almond(b[0], b[1], b[2]); }).join('') +
    '</svg>';

  RS.UI.WorldArt.register(8, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return MANDELBART_SVG; }
  });
})(window.RS = window.RS || {});
