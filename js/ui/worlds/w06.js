(function (RS) {
  'use strict';

  // Welt 6, Zuckerwattenwolken: ein Wolkenmeer unter einem lila-blauen Abendhimmel mit
  // blassem Regenbogen, ferne Wolkentürme, Zuckerwatte am Stiel und treibende Wölkchen,
  // Wolkenhäuser als Stationen, ein Tor aus Zuckerwatte mit Regenbogenband und
  // die Gewitterhexe Wolkira als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück in den Kirschgarten (Wegesanfang),
  // gate = Tor nach Station 10, rainbow = blasser Regenbogen [Mitte x, Fuß y, Radius],
  // towers = ferne Wolkentürme [x, Fuß, Größe], hills = ferne Wolkenbänke,
  // ground = nahes Wolkenmeer, sticks = Zuckerwatte am Stiel [x, y], puffs = Anzahl der Wölkchen.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[795, 585], [650, 550], [505, 585], [355, 550], [205, 518],
        [95, 418], [250, 332], [432, 362], [608, 322], [715, 196]],
      backGate: [912, 584],
      gate: [850, 150],
      crystal: [570, 112],
      moon: [140, 80],
      rainbow: [470, 330, 300],
      towers: [[60, 330, 1.1], [300, 322, 0.8], [520, 336, 1.2], [760, 324, 0.9], [950, 334, 1.1]],
      hills: [
        [[0, 330], [180, 312], [400, 340], [620, 316], [820, 344], [1000, 322]],
        [[0, 418], [240, 398], [500, 430], [780, 402], [1000, 426]]
      ],
      ground: [
        [[0, 460], [160, 448], [380, 476], [620, 500], [840, 470], [1000, 492]],
        [[0, 604], [320, 620], [680, 596], [1000, 614]]
      ],
      sticks: [[830, 470], [670, 465], [500, 495], [340, 455], [60, 560], [35, 450],
        [360, 270], [820, 300], [930, 430], [120, 615], [580, 630], [970, 520]],
      puffs: 16
    },
    tall: {
      w: 400, h: 1300,
      route: [[235, 1195], [105, 1075], [295, 955], [100, 835], [300, 715],
        [110, 595], [290, 475], [100, 355], [270, 250], [150, 150]],
      backGate: [80, 1250],
      gate: [282, 118],
      crystal: [70, 205],
      moon: [70, 58],
      rainbow: [220, 300, 150],
      towers: [[40, 300, 0.9], [200, 290, 0.7], [360, 304, 1]],
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
      sticks: [[370, 1140], [30, 1150], [30, 950], [370, 840], [370, 610], [30, 700],
        [30, 470], [370, 380], [370, 236], [360, 1260]],
      puffs: 12
    }
  };

  // Wolkenform aus fünf Bögen, Fuß bei y = 0, etwa 64 breit und 30 hoch.
  var CLOUD = 'M-32 0 a12 11 0 0 1 4 -18 a14 13 0 0 1 22 -9 a15 14 0 0 1 26 2 a12 11 0 0 1 14 14 ' +
    'a9 8 0 0 1 -2 11 Z';

  // Blasser Regenbogen: drei Bögen in Rosa, Gelb und Hellblau.
  function rainbow(rb) {
    var x = rb[0];
    var y = rb[1];
    var out = '<g class="art-rainbow">';
    ['a', 'b', 'c'].forEach(function (k, i) {
      var r = rb[2] - i * 14;
      out += path('art-rainbow-band art-rainbow-band--' + k,
        'M' + (x - r) + ' ' + y + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y);
    });
    return out + '</g>';
  }

  // Ferner Wolkenturm: drei gestapelte Wolken, ohne Einzelheiten.
  function tower(t) {
    return '<g class="art-cloudtower" transform="translate(' + t[0] + ' ' + t[1] + ') scale(' + t[2] + ')">' +
      path('art-cloudtower-puff', CLOUD, ' transform="scale(1.3)"') +
      path('art-cloudtower-puff', CLOUD, ' transform="translate(4 -26) scale(0.95)"') +
      path('art-cloudtower-puff', CLOUD, ' transform="translate(-2 -48) scale(0.6)"') +
      '</g>';
  }

  // Hintere Kulisse: Sterne, Mond, Regenbogen, Wolkentürme, Wolkenbänke. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 661 + layout.w, skyEnd);
    out += K.moon(layout.moon) + rainbow(layout.rainbow) + '<g class="art-cloudtowers">';
    layout.towers.forEach(function (t) { out += tower(t); });
    out += '</g>';
    out += K.hills(layout);
    return out + '</svg>';
  }

  // Zuckerwatte am Stiel: heller Holzstab mit einer flauschigen Watteknolle in Rosa,
  // Himmelblau oder Flieder und zwei hellen Lichtpunkten.
  function stick(x, y, i) {
    var cls = 'art-floss' + (i % 3 === 1 ? ' art-floss--blue' : (i % 3 === 2 ? ' art-floss--lilac' : ''));
    return '<g class="art-tree ' + cls + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="24" rx="13" ry="3"/>' +
      '<rect class="art-floss-stick" x="-1.6" y="-2" width="3.2" height="26" rx="1.6"/>' +
      path('art-floss-ball', 'M-15 -6 a9 9 0 0 1 2 -14 a10 10 0 0 1 13 -9 a10 10 0 0 1 13 7 ' +
        'a9 9 0 0 1 2 14 a8 8 0 0 1 -10 6 a9 8 0 0 1 -11 0 a8 8 0 0 1 -9 -4 Z') +
      path('art-floss-swirl', 'M1 -15 a2.5 2.5 0 1 1 -3 -3 a5.5 5.5 0 1 1 7 6.5') +
      '<circle class="art-floss-shine" cx="-7" cy="-20" r="2.2"/><circle class="art-floss-shine" cx="7" cy="-24" r="1.4"/>' +
      '</g>';
  }

  // Treibende Wölkchen: feste Plätze, einige ziehen sacht hin und her.
  function puffs(layout) {
    var r = K.rng(719 + layout.w);
    var out = '<g class="art-puffs">';
    for (var i = 0; i < layout.puffs; i++) {
      var x = (r() * layout.w).toFixed(1);
      var y = (40 + r() * (layout.h - 80)).toFixed(1);
      var s = (0.35 + r() * 0.35).toFixed(2);
      out += '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="art-puff' +
        (i % 2 === 0 ? ' is-drift' : '') + '" style="animation-delay:' + (r() * 6).toFixed(1) + 's">' +
        path('art-puff-body', CLOUD) + '</g></g>';
    }
    return out + '</g>';
  }

  // Vordergrund: nahes Wolkenmeer, Weg, Zuckerwatte, Wölkchen, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.sticks.forEach(function (t, i) { out += stick(t[0], t[1], i); });
    out += puffs(layout);
    out += K.crystal(layout.crystal, opts.crystalLit, 'cloud');
    return out + '</svg>';
  }

  // Station als Wolkenhaus: rundes Häuschen auf einer Wolke, mit Kuppeldach in Bonbonfarbe,
  // Rundfenster, Tür und einem kleinen Wimpel auf der Kuppel.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w6" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      path('house-flag-pole', 'M30 2 V12') +
      path('house-flag', 'M30 2 L40 5 L30 8 Z', ' data-color="' + ((index + 3) % 6) + '"') +
      '<rect class="house-body" x="13" y="24" width="34" height="24" rx="5"/>' +
      path('house-roof', 'M9 26 Q9 8 30 8 Q51 8 51 26 Z', ' data-color="' + color + '"') +
      path('house-roof-rim', 'M9 26 H51') +
      '<circle class="house-window" cx="22" cy="35" r="5"/>' +
      path('house-window-cross', 'M22 30 V40 M17 35 H27') +
      path('house-door', 'M33 48 V38 a5 5 0 0 1 10 0 V48 Z') +
      '<circle class="house-knob" cx="40.5" cy="43.5" r="1.1"/>' +
      path('house-cloud', 'M4 56 a7 7 0 0 1 4 -10 a9 9 0 0 1 14 -2 a10 10 0 0 1 16 0 a9 9 0 0 1 14 2 ' +
        'a7 7 0 0 1 4 10 Z') +
      '</svg>';
  }

  var clipCount = 0;

  // Tor aus Zuckerwatte: ein Regenbogenband in drei Farben als Bogen, an Fuß und Scheitel
  // flauschige Wattewolken, geschlossen mit Lakritzstäben davor. Die Klassen gate-portal,
  // gate-bars und gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  var GATE_PUFFS = [[12, 88, 1], [68, 88, 1], [40, 15, 0.9], [9, 60, 0.6], [71, 60, 0.6]];

  function gatePuff(p) {
    return '<g class="gate-puff" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')">' +
      '<circle cx="-7" cy="1" r="6"/><circle cx="0" cy="-3" r="7.5"/><circle cx="7" cy="1" r="6"/>' +
      '<circle class="gate-puff-shine" cx="-2" cy="-6" r="2.4"/></g>';
  }

  function arc(r) {
    return 'M' + (40 - r) + ' 92 V46 A' + r + ' ' + r + ' 0 0 1 ' + (40 + r) + ' 46 V92';
  }

  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var clip = 'rs-gate-clip-6-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w6" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
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
      path('gate-rainbow gate-rainbow--a', arc(30.5)) +
      path('gate-rainbow gate-rainbow--b', arc(27.5)) +
      path('gate-rainbow gate-rainbow--c', arc(24.5)) +
      GATE_PUFFS.map(gatePuff).join('') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 -14 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M4 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M76 24 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Gewitterhexe Wolkira: blasse Hexe mit spitzem Hut (Blitz am Hutband), Haaren aus grauen
  // Wolkenfetzen und Sternenumhang. Sie sitzt in einer dunklen Gewitterwolke und hebt einen
  // Blitzstab. Ab Phase 2 zucken Blitze aus der Wolke (wk-bolt), die Wolke wird schwärzer,
  // sie runzelt die Stirn und reißt den Stab höher.
  var WOLKIRA_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="44" ry="5" fill="#000" opacity="0.28"/>' +
      // Blitze unter der Wolke ab Phase 2
      '<path class="wk-bolt" d="M34 112 L28 122 L34 122 L28 132" stroke="#ffe14a" stroke-width="3" ' +
        'stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0"/>' +
      '<path class="wk-bolt" d="M88 112 L94 121 L88 121 L95 131" stroke="#ffe14a" stroke-width="3" ' +
        'stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0"/>' +
      // Umhang mit Sternen
      '<path d="M36 104 Q40 72 60 64 Q80 72 84 104 Z" fill="#4a3a7a"/>' +
      '<path d="M46 90 l1.4 3 3 1.2 -3 1.2 -1.4 3 -1.4 -3 -3 -1.2 3 -1.2 Z M72 84 l1.2 2.6 2.6 1 -2.6 1 -1.2 2.6 ' +
        '-1.2 -2.6 -2.6 -1 2.6 -1 Z" fill="#ffe7a0"/>' +
      // Arm mit Blitzstab
      '<g class="wk-wand">' +
        '<path d="M76 74 Q86 72 92 64" stroke="#4a3a7a" stroke-width="7" stroke-linecap="round" fill="none"/>' +
        '<circle cx="92" cy="63" r="4" fill="#d9d2f0"/>' +
        '<path d="M92 64 L104 36" stroke="#8a5a3a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M104 22 L98 34 L104 34 L100 44 L110 30 L104 30 L108 22 Z" fill="#ffe14a" stroke="#c99a10" stroke-width="1"/>' +
      '</g>' +
      // Haare aus Wolkenfetzen, Kopf, Augen, Brauen und Grinsen
      '<g class="wk-hair" fill="#9aa4c8">' +
        '<circle cx="44" cy="52" r="7"/><circle cx="42" cy="62" r="6"/><circle cx="76" cy="52" r="7"/>' +
        '<circle cx="78" cy="62" r="6"/></g>' +
      '<circle cx="60" cy="52" r="15" fill="#ddd6f2"/>' +
      '<ellipse cx="54" cy="51" rx="4.2" ry="5" fill="#fffaf6"/>' +
      '<ellipse cx="66" cy="51" rx="4.2" ry="5" fill="#fffaf6"/>' +
      '<circle cx="54.6" cy="52" r="2.4" fill="#2a1f4e"/><circle cx="66.6" cy="52" r="2.4" fill="#2a1f4e"/>' +
      '<circle cx="55.4" cy="51" r="0.8" fill="#fff"/><circle cx="67.4" cy="51" r="0.8" fill="#fff"/>' +
      '<path class="wk-brow" d="M49 44 Q53 47 58 46 M62 46 Q67 47 71 44" stroke="#2a1f4e" stroke-width="2.2" ' +
        'stroke-linecap="round" fill="none" opacity="0"/>' +
      '<path d="M53 59 Q60 64 67 59" stroke="#6a3a6a" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<circle cx="49" cy="57" r="2.4" fill="#f2a6c8" opacity="0.6"/><circle cx="71" cy="57" r="2.4" fill="#f2a6c8" opacity="0.6"/>' +
      // Spitzer Hut mit Blitz am Hutband
      '<path d="M34 42 Q60 34 86 42 Q86 46 82 46 Q60 40 38 46 Q34 46 34 42 Z" fill="#33285e"/>' +
      '<path d="M45 41 Q52 22 62 4 Q68 14 66 22 Q72 30 76 40 Q60 36 45 41 Z" fill="#3d3070"/>' +
      '<path d="M46 38 Q60 34 75 37 L76 40 Q60 36 45 41 Z" fill="#7fd0ff"/>' +
      '<path d="M60 31 L57 37 L60 37 L58 42 L64 35 L61 35 L63 31 Z" fill="#ffe14a"/>' +
      // Gewitterwolke vorne
      '<path class="wk-cloud" d="M16 116 a13 12 0 0 1 8 -20 a17 15 0 0 1 26 -10 a19 17 0 0 1 32 2 ' +
        'a15 13 0 0 1 22 14 a11 10 0 0 1 -2 14 Z" fill="#5b5f86"/>' +
      '<path d="M30 98 a12 10 0 0 1 18 -8 M62 90 a14 12 0 0 1 20 2" stroke="#8d92b8" stroke-width="2.4" ' +
        'stroke-linecap="round" fill="none"/>' +
    '</svg>';

  RS.UI.WorldArt.register(6, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return WOLKIRA_SVG; }
  });
})(window.RS = window.RS || {});
