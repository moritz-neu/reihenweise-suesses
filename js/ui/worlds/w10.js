(function (RS) {
  'use strict';

  // Welt 10, Bitterburg: ein Gewitterhimmel mit bitteren Wolkenwirbeln und fernen Blitzen,
  // schroffe Felszacken, auf dem Gipfel die dunkle Bitterburg mit Spitztürmen, Bannern und
  // violett glühenden Fenstern, ein steiniger Weg hinauf, Dornenbüsche, bittere Kristalle und
  // Laternen mit violetter Flamme, Wachtürme als Stationen, ein dunkles Burgtor mit Fallgitter
  // als Tor zurück zur Schillerbucht und Bitterkönig Amarus als Boss. Ist Amarus besiegt,
  // färbt sich die Burg bunt wie Zuckerguss (is-sweet). Die Bitterburg ist die letzte Welt:
  // Der Weg endet am Thronsaal, ein Tor am Ende gibt es nicht (layout.gate bleibt für die
  // gemeinsame Kartenform und liegt am Burgtor).

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück zur Schillerbucht (Wegesanfang),
  // gate = Burgtor (ohne Tor-Knopf), castle = Bitterburg [x Mitte, y Fuß, Größe],
  // clouds = Wolkenwirbel [x, y, Größe], bolts = Blitze [x, y, Größe],
  // hills = Felszacken und Burgberg, ground = Weg am Fuß, props = Dornenbüsche, Kristalle
  // und Laternen [x, y].
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[170, 595], [330, 568], [490, 592], [650, 562], [810, 585],
        [905, 500], [770, 430], [600, 440], [440, 395], [600, 322]],
      backGate: [70, 595],
      gate: [600, 290],
      castle: [600, 296, 0.8],
      crystal: [250, 330],
      moon: [120, 70],
      clouds: [[230, 60, 1], [520, 40, 1.2], [860, 74, 1.1], [380, 120, 0.7], [960, 170, 0.6]],
      bolts: [[330, 92, 1], [800, 118, 0.8]],
      hills: [
        [[0, 330], [120, 250], [210, 320], [330, 236], [440, 300], [600, 230], [760, 300], [880, 240], [1000, 320]],
        [[0, 360], [180, 330], [380, 352], [600, 300], [820, 350], [1000, 340]]
      ],
      ground: [
        [[0, 470], [220, 456], [470, 478], [700, 460], [1000, 480]],
        [[0, 610], [320, 622], [680, 604], [1000, 618]]
      ],
      props: [[250, 482], [300, 470], [570, 494], [700, 470], [960, 560], [240, 398],
        [690, 360], [940, 420], [120, 480], [600, 630], [400, 478], [990, 470], [360, 330]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[110, 1195], [290, 1080], [110, 960], [300, 840], [110, 720],
        [290, 600], [110, 485], [290, 390], [130, 330], [200, 262]],
      backGate: [290, 1250],
      gate: [200, 222],
      castle: [200, 238, 0.55],
      crystal: [50, 410],
      moon: [56, 50],
      clouds: [[120, 46, 0.7], [320, 70, 0.8], [220, 110, 0.5]],
      bolts: [[300, 120, 0.6]],
      hills: [
        [[0, 300], [60, 230], [130, 290], [200, 210], [280, 280], [340, 226], [400, 290]],
        [[0, 330], [140, 300], [260, 320], [400, 306]]
      ],
      ground: [
        [[0, 1110], [130, 1096], [270, 1116], [400, 1100]],
        [[0, 1270], [200, 1254], [400, 1272]]
      ],
      props: [[30, 1140], [370, 1150], [30, 1010], [370, 910], [30, 640], [370, 720],
        [370, 480], [30, 560], [40, 1262], [360, 320], [30, 800]]
    }
  };

  // Bitterer Wolkenwirbel: drei dunkle, übereinanderliegende Bäusche mit einem Spiralstrich.
  function cloud(c) {
    return '<g class="art-bitter-cloud" transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">' +
      path('art-bitter-cloud-body', 'M-70 10 Q-74 -8 -52 -12 Q-46 -34 -18 -28 Q-4 -46 22 -34 Q50 -40 56 -16 Q78 -12 72 10 Z') +
      path('art-bitter-cloud-swirl', 'M-10 -6 q10 -10 20 0 q-4 10 -14 6 q-6 -4 0 -8') +
      path('art-bitter-cloud-rim', 'M-70 10 H72') + '</g>';
  }

  // Ferner Blitz, der ab und zu aufzuckt.
  function bolt(b, i) {
    return '<g transform="translate(' + b[0] + ' ' + b[1] + ') scale(' + b[2] + ')">' +
      path('art-bolt', 'M0 0 L-8 22 L2 22 L-6 46 L14 16 L4 16 L10 0 Z', ' style="animation-delay:' + (i * 2.3).toFixed(1) + 's"') +
      '</g>';
  }

  // Hintere Kulisse: Sterne, verhangener Mond, Wolkenwirbel, Blitze und Felszacken.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 300;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 1019 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-bolts">';
    layout.bolts.forEach(function (b, i) { out += bolt(b, i); });
    out += '</g><g class="art-bitter-clouds">';
    layout.clouds.forEach(function (c) { out += cloud(c); });
    out += '</g>';
    return out + K.hills(layout) + '</svg>';
  }

  // Die Bitterburg (Fuß in der Mitte bei 0 0): Felssockel, zwei Seitentürme und ein hoher
  // Bergfried mit Spitzdächern, Zinnenmauer, Banner, violett glühende Fensterschlitze, eine
  // Fensterrose und das Burgtor. Mit sweet (Amarus besiegt) färbt CSS sie bunt.
  function tower(x, w, top) {
    return path('art-burg-wall', 'M' + x + ' -36 V' + top + ' H' + (x + w) + ' V-36 Z') +
      path('art-burg-roof', 'M' + (x - 6) + ' ' + top + ' L' + (x + w / 2) + ' ' + (top - 70) + ' L' + (x + w + 6) + ' ' + top + ' Z',
        ' data-color="' + (x < 0 ? 4 : 0) + '"') +
      '<rect class="art-burg-window" x="' + (x + w / 2 - 3) + '" y="' + (top + 24) + '" width="6" height="16" rx="3"/>' +
      '<rect class="art-burg-window" x="' + (x + w / 2 - 3) + '" y="' + (top + 74) + '" width="6" height="16" rx="3"/>';
  }

  function castle(c, sweet) {
    var crenels = '';
    for (var x = -100; x < 100; x += 25) {
      crenels += '<rect class="art-burg-crenel" x="' + x + '" y="-154" width="14" height="14"/>';
    }
    return '<g class="art-bitterburg' + (sweet ? ' is-sweet' : '') + '" transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">' +
      path('art-burg-rock', 'M-176 4 Q-160 -26 -118 -38 L118 -38 Q160 -26 176 4 Z') +
      tower(-142, 44, -196) + tower(98, 44, -196) +
      path('art-burg-wall', 'M-100 -36 V-140 H100 V-36 Z') + crenels +
      path('art-burg-wall', 'M-40 -140 V-226 H40 V-140 Z') +
      path('art-burg-roof', 'M-50 -226 L0 -320 L50 -226 Z', ' data-color="3"') +
      path('art-burg-pole', 'M0 -320 V-346') +
      path('art-burg-flag', 'M0 -346 L24 -339 L0 -332 Z') +
      '<circle class="art-burg-rose" cx="0" cy="-190" r="15"/>' +
      path('art-burg-rose-lines', 'M0 -205 V-175 M-15 -190 H15 M-10.6 -200.6 L10.6 -179.4 M10.6 -200.6 L-10.6 -179.4') +
      path('art-burg-banner', 'M-78 -128 h20 v44 l-10 -9 l-10 9 Z', ' data-color="4"') +
      path('art-burg-banner', 'M58 -128 h20 v44 l-10 -9 l-10 9 Z', ' data-color="5"') +
      '<rect class="art-burg-window" x="-30" y="-120" width="7" height="18" rx="3.5"/>' +
      '<rect class="art-burg-window" x="23" y="-120" width="7" height="18" rx="3.5"/>' +
      path('art-burg-door', 'M-24 -36 V-70 A24 24 0 0 1 24 -70 V-36 Z') +
      path('art-burg-door-bars', 'M-12 -36 V-88 M0 -36 V-94 M12 -36 V-88 M-24 -62 H24') +
      '</g>';
  }

  // Dornenbusch: dunkle, gebogene Ranken mit Dornen auf einem kleinen Erdhügel.
  function thorns() {
    return path('art-thorn-mound', 'M-18 20 Q0 10 18 20 Z') +
      path('art-thorn', 'M0 18 Q-4 4 -14 -4 M0 18 Q2 0 4 -16 M0 18 Q6 6 17 0') +
      path('art-thorn-spikes', 'M-14 -4 l-5 -2 M-8 3 l-5 0 M-10 -1 l-1 -5 M4 -16 l-2 -5 M3 -6 l5 -2 M1 4 l-5 -1 M17 0 l5 -1 M11 6 l3 4 M13 2 l1 -5');
  }

  // Bitterer Kristall: drei dunkle Splitter mit hellem Schliff.
  function bitterCrystal() {
    return path('art-bitter-crystal', 'M-9 18 L-13 0 L-7 -12 L-1 0 L-3 18 Z') +
      path('art-bitter-crystal', 'M-3 18 L1 -22 L10 -2 L6 18 Z') +
      path('art-bitter-crystal', 'M6 18 L12 4 L17 18 Z') +
      path('art-bitter-crystal-shine', 'M1 -22 L3 18 M-7 -12 L-5 16');
  }

  // Laterne mit violetter Flamme, die leise flackert.
  function lantern(i) {
    return path('art-lantern-post', 'M0 22 V-14') +
      path('art-lantern-cap', 'M-8 -14 L0 -22 L8 -14 Z') +
      '<rect class="art-lantern-glass" x="-6" y="-14" width="12" height="16" rx="2"/>' +
      path('art-lantern-flame', 'M0 -1 Q-4 -5 0 -12 Q4 -5 0 -1 Z', ' style="animation-delay:' + (i * 0.4).toFixed(1) + 's"');
  }

  // Abwechselnd Dornenbusch, bitterer Kristall und Laterne.
  function prop(p, i) {
    var kind = i % 3;
    return '<g class="art-tree art-prop" transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.3)">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="20" rx="13" ry="3"/>' +
      (kind === 0 ? thorns() : kind === 1 ? bitterCrystal() : lantern(i)) + '</g>';
  }

  // Vordergrund: Bitterburg auf dem Gipfel, Boden, steiniger Weg, Dornen, Kristalle, Laternen
  // und das Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + castle(layout.castle, opts.crystalLit);
    out += K.ground(layout) + K.road(opts.path, opts.lit);
    layout.props.forEach(function (p, i) { out += prop(p, i); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'bitter');
    return out + '</svg>';
  }

  // Station als Wachturm: runder Turm mit Spitzdach in Bonbonfarbe, Wimpel, Zinnenkranz,
  // ein Bogenfenster, eine Tür und Steinfugen.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w10" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-body" x="17" y="26" width="26" height="29" rx="2"/>' +
      path('house-stones', 'M17 35 H43 M17 45 H43 M24 28 V35 M36 35 V45 M24 45 V55') +
      '<rect class="house-crenel" x="14" y="22" width="7" height="6"/>' +
      '<rect class="house-crenel" x="26.5" y="22" width="7" height="6"/>' +
      '<rect class="house-crenel" x="39" y="22" width="7" height="6"/>' +
      path('house-roof', 'M14 22 L30 5 L46 22 Z', ' data-color="' + color + '"') +
      path('house-pennant-pole', 'M30 5 V0.5') +
      path('house-pennant', 'M30 0.5 L38 3 L30 5.5 Z') +
      path('house-window', 'M26 41 V35 A4 4 0 0 1 34 35 V41 Z') +
      path('house-door', 'M25 55 V49 A5 5 0 0 1 35 49 V55 Z') +
      '</svg>';
  }

  var clipCount = 0;

  // Burgtor der Bitterburg (Tor zurück zur Schillerbucht): zwei dunkle Steintürme mit
  // Spitzdach, ein Steinbogen mit Dornenspitzen und ein Fallgitter. Die Klassen gate-portal,
  // gate-bars und gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  function gate() {
    var portal = 'M19 92 V48 A21 21 0 0 1 61 48 V92 Z';
    var arch = 'M15 92 V48 A25 25 0 0 1 65 48 V92';
    var clip = 'rs-gate-clip-10-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w10" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="38" ry="5"/>' +
      '<rect class="gate-tower" x="0" y="34" width="14" height="58" rx="1"/>' +
      '<rect class="gate-tower" x="66" y="34" width="14" height="58" rx="1"/>' +
      path('gate-tower-roof', 'M-2 34 L7 12 L16 34 Z M64 34 L73 12 L82 34 Z') +
      '<rect class="gate-tower-window" x="5" y="46" width="4" height="10" rx="2"/>' +
      '<rect class="gate-tower-window" x="71" y="46" width="4" height="10" rx="2"/>' +
      '<defs><clipPath id="' + clip + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#' + clip + ')"><g class="gate-bars">' +
        '<rect x="23" y="30" width="5" height="62" rx="2"/>' +
        '<rect x="37.5" y="24" width="5" height="68" rx="2"/>' +
        '<rect x="52" y="30" width="5" height="62" rx="2"/>' +
        '<rect x="19" y="54" width="42" height="5" rx="2"/>' +
        '<rect x="19" y="72" width="42" height="5" rx="2"/>' +
        path('gate-bar-shine', 'M25 34 V88 M39.5 28 V88 M54 34 V88') +
      '</g></g>' +
      path('gate-stone', arch) + path('gate-stone-joints', arch) +
      path('gate-spike', 'M22 30 L24 20 L28 27 Z M34 24 L40 12 L46 24 Z M52 27 L56 20 L58 30 Z') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 -6 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M18 10 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M62 8 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Bitterkönig Amarus: ein hagerer König im dunkelvioletten Mantel mit weitem Kragen, einer
  // gezackten schwarzen Krone und einem Zepter mit bitterem Kristall. Ab Phase 2 glühen seine
  // Augen rot und der Kristall flackert (am-eye, am-orb), in Phase 3 umgibt ihn ein dunkler
  // Wirbel (am-aura) und der Mantel leuchtet von innen (am-lining). In der Szene nach seiner
  // Niederlage (data-scene="defeat") und im Abspann bekommt er seine Süße zurück: Mantel und
  // Gesicht werden warm und rosa, die Krone golden mit dem Stern der Sternenkrone (am-star),
  // er lächelt (am-smile) und Zuckerfunken steigen auf (am-sweet).
  var AMARUS_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="44" ry="5" fill="#000" opacity="0.3"/>' +
      '<g class="am-aura" opacity="0">' +
        '<path d="M60 20 C110 22 116 96 88 124 M60 20 C10 22 4 96 32 124" stroke="#7a2ad0" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="10 7"/>' +
        '<circle cx="18" cy="70" r="3" fill="#b06aff"/><circle cx="104" cy="58" r="3" fill="#b06aff"/>' +
      '</g>' +
      // Mantel mit Futter, Gewand mit Borte
      '<path class="am-cape" d="M60 44 L22 126 Q60 132 98 126 Z" fill="#2a1640" stroke="#14081e" stroke-width="1.2"/>' +
      '<path class="am-lining" d="M60 50 L34 124 Q60 128 86 124 Z" fill="#5a1a4a"/>' +
      '<path class="am-robe" d="M60 56 L44 126 H76 Z" fill="#3a2058" stroke="#1e0e30" stroke-width="1"/>' +
      '<path class="am-trim" d="M60 60 V126 M50 100 H70" stroke="#8a7aa8" stroke-width="2.4" fill="none"/>' +
      // Kragen
      '<path class="am-collar" d="M36 54 L46 40 L60 50 L74 40 L84 54 L60 62 Z" fill="#4a2a6a" stroke="#1e0e30" stroke-width="1"/>' +
      // Zepter mit bitterem Kristall
      '<path d="M92 120 L88 48" stroke="#5a4a6a" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="am-orb" d="M88 30 L95 40 L88 50 L81 40 Z" fill="#4a1a6a" stroke="#b06aff" stroke-width="1.2"/>' +
      '<circle cx="86" cy="86" r="5" class="am-hand" fill="#a898b8"/>' +
      // Kopf mit Spitzbart
      '<path class="am-beard" d="M50 46 Q60 66 70 46 Z" fill="#1e1428"/>' +
      '<ellipse class="am-face" cx="60" cy="36" rx="12" ry="14" fill="#b8a8c8" stroke="#5a4a6a" stroke-width="1"/>' +
      '<circle class="am-cheek" cx="52" cy="41" r="2.6" fill="#ff9ab8" opacity="0"/>' +
      '<circle class="am-cheek" cx="68" cy="41" r="2.6" fill="#ff9ab8" opacity="0"/>' +
      '<ellipse class="am-eye" cx="55" cy="34" rx="2" ry="1.6" fill="#2a1a3a"/>' +
      '<ellipse class="am-eye" cx="65" cy="34" rx="2" ry="1.6" fill="#2a1a3a"/>' +
      '<path class="am-brow" d="M50 29 L58 32 M70 29 L62 32" stroke="#1e1428" stroke-width="2" stroke-linecap="round"/>' +
      '<path class="am-mouth" d="M55 45 Q60 41 65 45" stroke="#3a2a4a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path class="am-smile" d="M54 43 Q60 49 66 43" stroke="#a0405a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0"/>' +
      // Krone, darüber der Stern der Sternenkrone
      '<path class="am-crown" d="M46 24 L44 8 L51 16 L55 4 L60 14 L65 4 L69 16 L76 8 L74 24 Z" fill="#2e2638" stroke="#7a6a8a" stroke-width="1"/>' +
      '<circle class="am-gem" cx="60" cy="19" r="2.4" fill="#7a2ad0"/>' +
      '<path class="am-star" d="M60 -8 l2.6 5.4 5.9 0.8 -4.3 4.1 1.1 5.8 -5.3 -2.8 -5.3 2.8 1.1 -5.8 -4.3 -4.1 5.9 -0.8 Z" ' +
        'fill="#ffe27a" stroke="#ffb02e" stroke-width="0.8" opacity="0"/>' +
      '<g class="am-sweet" opacity="0">' +
        '<circle cx="26" cy="60" r="2.6" fill="#ff8fc8"/><circle cx="96" cy="72" r="2.6" fill="#ffd84a"/>' +
        '<circle cx="32" cy="96" r="2.2" fill="#7fe07a"/><circle cx="102" cy="104" r="2.2" fill="#6ec6ff"/>' +
        '<path d="M20 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z M100 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#fff4b0"/>' +
      '</g>' +
    '</svg>';

  RS.UI.WorldArt.register(10, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return AMARUS_SVG; }
  });
})(window.RS = window.RS || {});
