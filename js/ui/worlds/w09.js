(function (RS) {
  'use strict';

  // Welt 9, Schillerbucht: eine Bucht unter einem Nachthimmel mit schillernden Lichtbändern,
  // ferne Palmeninseln, im Meer die Windungen der Seeschlange, Wellen mit bunten Glanzlichtern,
  // eine Sandbank, auf der der Weg in die Bucht hinausführt, Palmen, Schillermuscheln und
  // Korallen, Muschelhütten als Stationen, ein Korallentor mit Seestern und die Seeschlange
  // Schillerzahn als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, backGate = Tor zurück zum Marzipanschloss (Wegesanfang),
  // gate = Tor nach Station 10, ribbons = Lichtbänder am Himmel [y, Höhe, Farbe],
  // islands = ferne Inseln [x, y, Größe], coils = Windungen der Seeschlange [x, y, Größe],
  // hills = Inseln und Meer, ground = Strand, props = Palmen und Muscheln am Strand, im Wasser
  // Korallen [x, y], water = Wasser zwischen [y Horizont, y Strand], waves = Wellenbereich
  // [y oben, y unten, Anzahl], glints = bunte Glanzlichter auf dem Wasser [x, y, Farbe].
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[170, 590], [320, 560], [470, 588], [620, 560], [770, 585],
        [895, 500], [800, 405], [630, 385], [460, 410], [350, 315]],
      backGate: [70, 590],
      gate: [470, 238],
      crystal: [236, 214],
      moon: [880, 78],
      ribbons: [[70, 34, 2], [118, 26, 3], [160, 20, 4]],
      islands: [[120, 296, 1], [610, 292, 0.8], [960, 300, 0.7]],
      coils: [[720, 330, 1], [180, 360, 0.75]],
      hills: [
        [[0, 300], [200, 294], [420, 302], [650, 296], [860, 304], [1000, 298]],
        [[0, 304], [300, 302], [600, 306], [1000, 303]]
      ],
      ground: [
        [[0, 478], [220, 470], [470, 488], [700, 474], [1000, 490]],
        [[0, 606], [320, 618], [680, 600], [1000, 614]]
      ],
      props: [[250, 478], [300, 470], [560, 492], [690, 466], [960, 560], [240, 400],
        [560, 330], [930, 420], [130, 478], [600, 630], [420, 476], [990, 470]],
      water: [304, 470],
      waves: [318, 462, 24],
      glints: [[90, 330, 0], [260, 440, 1], [420, 352, 2], [540, 446, 3], [700, 430, 4], [880, 350, 5],
        [990, 400, 2], [360, 455, 4]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[110, 1195], [290, 1080], [110, 960], [300, 840], [110, 720],
        [290, 600], [110, 480], [290, 370], [140, 270], [270, 180]],
      backGate: [290, 1250],
      gate: [130, 112],
      crystal: [45, 215],
      moon: [330, 56],
      ribbons: [[60, 28, 2], [104, 22, 4]],
      islands: [[330, 296, 0.6], [60, 290, 0.5]],
      coils: [[300, 520, 0.7], [90, 860, 0.6]],
      hills: [
        [[0, 296], [130, 290], [270, 300], [400, 292]],
        [[0, 300], [200, 302], [400, 299]]
      ],
      ground: [
        [[0, 1110], [130, 1096], [270, 1116], [400, 1100]],
        [[0, 1270], [200, 1254], [400, 1272]]
      ],
      props: [[30, 1140], [370, 1150], [30, 1010], [370, 910], [30, 640], [370, 720],
        [370, 470], [30, 380], [40, 1262]],
      water: [300, 1096],
      waves: [320, 1080, 34],
      glints: [[60, 340, 0], [220, 430, 2], [360, 560, 4], [50, 680, 1], [210, 780, 3], [360, 1000, 5],
        [200, 1040, 2]]
    }
  };

  var SHIMMER = ['#ff6b8a', '#ffd84a', '#7fe07a', '#6ec6ff', '#c58cff', '#ff9a3c'];

  // Schillerndes Lichtband: eine sanft gewellte, halbdurchsichtige Bahn quer über den Himmel.
  function ribbon(r, w) {
    var y = r[0];
    var h = r[1];
    var d = 'M0 ' + y + ' C' + (w * 0.25) + ' ' + (y - h) + ' ' + (w * 0.5) + ' ' + (y + h) + ' ' + (w * 0.75) + ' ' + y +
      ' S' + w + ' ' + (y - h * 0.6) + ' ' + w + ' ' + y;
    return path('art-ribbon', d, ' style="stroke:' + SHIMMER[r[2] % 6] + '"');
  }

  // Ferne Insel: flacher Hügel mit zwei Palmen als Schattenriss.
  function island(s) {
    var palm = function (x, lean) {
      return path('art-island-trunk', 'M' + x + ' -8 Q' + (x + lean) + ' -22 ' + (x + lean * 1.4) + ' -34') +
        path('art-island-leaves', 'M' + (x + lean * 1.4) + ' -34 q-12 0 -16 8 M' + (x + lean * 1.4) + ' -34 q12 0 16 8' +
          ' M' + (x + lean * 1.4) + ' -34 q-6 -8 -14 -8 M' + (x + lean * 1.4) + ' -34 q6 -8 14 -8');
    };
    return '<g class="art-island" transform="translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')">' +
      path('art-island-land', 'M-60 4 Q-30 -14 0 -12 Q30 -14 60 4 Z') + palm(-12, -4) + palm(10, 5) + '</g>';
  }

  // Windungen der Seeschlange im Meer: drei schuppige Bögen, die aus dem Wasser ragen.
  function coils(c) {
    var out = '<g class="art-coils" transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')">';
    [[-70, 22], [-10, 30], [52, 24]].forEach(function (a, i) {
      var x = a[0];
      var r = a[1];
      out += path('art-coil', 'M' + (x - r) + ' 0 A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' 0 L' + (x + r - 9) + ' 0 A' +
        (r - 9) + ' ' + (r - 9) + ' 0 0 0 ' + (x - r + 9) + ' 0 Z', ' data-color="' + (i + 2) + '"') +
        path('art-coil-fin', 'M' + (x - 6) + ' ' + (-r + 1) + ' L' + x + ' ' + (-r - 8) + ' L' + (x + 6) + ' ' + (-r + 1) + ' Z');
    });
    return out + path('art-coil-water', 'M-104 0 H86') + '</g>';
  }

  // Hintere Kulisse: Sterne, Mond, Lichtbänder, Meer mit Inseln und den Windungen der Seeschlange.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 270 : 290;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 919 + layout.w, skyEnd);
    out += K.moon(layout.moon) + '<g class="art-ribbons">';
    layout.ribbons.forEach(function (r) { out += ribbon(r, layout.w); });
    out += '</g>';
    layout.islands.forEach(function (s) { out += island(s); });
    out += K.hills(layout);
    layout.coils.forEach(function (c) { out += coils(c); });
    return out + '</svg>';
  }

  // Wellen: kurze helle Bögen an festen Plätzen, einige wiegen sacht.
  function waves(layout) {
    var w = layout.waves;
    var r = K.rng(941 + layout.w);
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

  // Buntes Glanzlicht auf dem Wasser: ein kleiner Stern, der sacht aufleuchtet.
  function glint(g, i) {
    return path('art-glint', 'M' + g[0] + ' ' + (g[1] - 6) + ' l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6 Z',
      ' style="fill:' + SHIMMER[g[2] % 6] + ';animation-delay:' + (i * 0.7).toFixed(1) + 's"');
  }

  // Palme mit geschwungenem Stamm, fünf Wedeln und zwei Kokosnüssen.
  function palm(i) {
    var lean = i % 4 === 0 ? -1 : 1;
    var top = 'M' + (lean * 8) + ' -34';
    return path('art-palm-trunk', 'M0 20 Q' + (lean * 2) + ' -8 ' + (lean * 8) + ' -34') +
      path('art-palm-rings', 'M-3 10 H3 M-2.4 0 H3.6 M-1 -10 H5 M1 -20 H6.6', ' transform="translate(' + (lean > 0 ? 0 : -3) + ' 0)"') +
      path('art-palm-leaf', top + ' q-14 -6 -24 4 q12 -2 24 -4 Z') +
      path('art-palm-leaf', top + ' q14 -6 24 4 q-12 -2 -24 -4 Z') +
      path('art-palm-leaf', top + ' q-10 -14 -20 -12 q10 4 20 12 Z') +
      path('art-palm-leaf', top + ' q10 -14 20 -12 q-10 4 -20 12 Z') +
      path('art-palm-leaf', top + ' q-2 -14 4 -20 q-2 8 -4 20 Z') +
      '<circle class="art-palm-nut" cx="' + (lean * 8 - 3) + '" cy="-31" r="2.6"/>' +
      '<circle class="art-palm-nut" cx="' + (lean * 8 + 3) + '" cy="-30" r="2.6"/>';
  }

  // Schillermuschel: aufgefächerte Jakobsmuschel in Bonbonfarbe mit Rippen und einer Perle.
  function shell(i) {
    return path('art-shell', 'M0 16 L-15 4 Q-16 -12 0 -14 Q16 -12 15 4 Z', ' data-color="' + ((i * 2 + 1) % 6) + '"') +
      path('art-shell-ribs', 'M0 16 L-9 -10 M0 16 L-3 -13 M0 16 L3 -13 M0 16 L9 -10') +
      '<rect class="art-shell-foot" x="-5" y="13" width="10" height="6" rx="2"/>' +
      '<circle class="art-shell-pearl" cx="0" cy="-2" r="3"/>';
  }

  // Koralle im Wasser: verzweigte Äste in Bonbonfarbe.
  function coral(i) {
    return path('art-coral', 'M0 18 V2 M0 8 Q-8 4 -9 -8 M0 4 Q8 0 8 -12 M0 2 Q-2 -8 2 -16 M-9 -8 L-13 -13 M8 -12 L12 -16',
      ' data-color="' + ((i + 4) % 6) + '"');
  }

  // Im Wasser eine Koralle, am Strand abwechselnd eine Palme und eine Schillermuschel.
  function prop(p, i, water) {
    var wet = p[1] > water[0] && p[1] < water[1];
    return '<g class="art-tree art-prop" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + (wet ? 1.1 : 1.3) + ')">' +
      (wet ? '' : '<ellipse class="art-tree-shadow" cx="0" cy="20" rx="13" ry="3"/>') +
      (wet ? coral(i) : (i % 2 === 0 ? palm(i) : shell(i))) + '</g>';
  }

  // Vordergrund: Wellen, Glanzlichter, Sandbank unter dem Weg, Strand, Weg, Palmen, Muscheln,
  // Korallen und das Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + waves(layout) + '<g class="art-glints">';
    layout.glints.forEach(function (g, i) { out += glint(g, i); });
    out += '</g>' + path('art-sandbar', K.curve(opts.path)) + path('art-sandbar-rim', K.curve(opts.path));
    out += K.ground(layout) + K.road(opts.path, opts.lit);
    layout.props.forEach(function (p, i) { out += prop(p, i, layout.water); });
    out += K.crystal(layout.crystal, opts.crystalLit, 'bay');
    return out + '</svg>';
  }

  // Station als Muschelhütte auf Pfählen: runder Bau, darüber eine aufgefächerte Muschel in
  // Bonbonfarbe als Dach, ein rundes Fenster, eine Bogentür und ein Seestern an der Wand.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w9" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-post" x="15" y="44" width="4" height="12" rx="1"/>' +
      '<rect class="house-post" x="41" y="44" width="4" height="12" rx="1"/>' +
      '<rect class="house-body" x="13" y="24" width="34" height="21" rx="6"/>' +
      path('house-roof', 'M7 26 Q6 8 30 4 Q54 8 53 26 Z', ' data-color="' + color + '"') +
      path('house-shell-ribs', 'M30 25 L14 12 M30 25 L22 7 M30 25 V4.5 M30 25 L38 7 M30 25 L46 12') +
      '<circle class="house-window" cx="21" cy="34" r="4.6"/>' +
      '<circle class="house-porthole" cx="21" cy="34" r="4.6"/>' +
      path('house-door', 'M32 45 V36 A5 5 0 0 1 42 36 V45 Z') +
      path('house-starfish', 'M41 27.5 l1.1 2.6 2.8 0.2 -2.1 1.8 0.7 2.7 -2.5 -1.5 -2.5 1.5 0.7 -2.7 -2.1 -1.8 2.8 -0.2 Z') +
      '<rect class="house-deck" x="7" y="44" width="46" height="4" rx="1.5"/>' +
      '</svg>';
  }

  var clipCount = 0;

  // Korallentor: zwei verzweigte Korallensäulen, darüber ein Bogen aus Schillerperlen und oben
  // ein Seestern. Geschlossen stehen Lakritzstäbe davor. Die Klassen gate-portal, gate-bars und
  // gate-sparkle teilen sich die Öffnungsanimation mit den anderen Toren.
  function coralPillar(x, dir) {
    return path('gate-coral', 'M' + x + ' 92 V40 M' + x + ' 70 Q' + (x + dir * 10) + ' 66 ' + (x + dir * 11) + ' 54' +
      ' M' + x + ' 56 Q' + (x - dir * 8) + ' 50 ' + (x - dir * 8) + ' 40 M' + x + ' 44 Q' + (x + dir * 4) + ' 34 ' + (x + dir * 2) + ' 26');
  }

  function gate() {
    var portal = 'M17 92 V46 A23 23 0 0 1 63 46 V92 Z';
    var clip = 'rs-gate-clip-9-' + (++clipCount);
    var pearls = '';
    for (var i = 0; i <= 8; i++) {
      var a = Math.PI - i * Math.PI / 8;
      pearls += '<circle class="gate-pearl" cx="' + (40 + Math.cos(a) * 27).toFixed(1) + '" cy="' + (46 - Math.sin(a) * 27).toFixed(1) +
        '" r="4" style="fill:' + SHIMMER[i % 6] + '"/>';
    }
    return '<svg class="gate-svg gate-svg--w9" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="36" ry="5"/>' +
      '<defs><clipPath id="' + clip + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#' + clip + ')"><g class="gate-bars">' +
        '<rect x="22" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="37" y="20" width="6" height="72" rx="3"/>' +
        '<rect x="52" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="17" y="60" width="46" height="6" rx="3"/>' +
        path('gate-bar-shine', 'M24 34 V88 M39 24 V88 M54 34 V88') +
      '</g></g>' +
      coralPillar(13, -1) + coralPillar(67, 1) + pearls +
      path('gate-starfish', 'M40 4 l2.6 6.2 6.6 0.5 -5 4.3 1.6 6.5 -5.8 -3.5 -5.8 3.5 1.6 -6.5 -5 -4.3 6.6 -0.5 Z') +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M62 -10 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z') +
        path('gate-sparkle gate-sparkle--s', 'M14 8 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M78 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  // Seeschlange Schillerzahn: ein langer, türkis schillernder Leib mit violetten Schuppenbändern
  // steigt aus den Wellen, dahinter ragt eine Windung aus dem Wasser. Der Kopf trägt einen
  // Flossenkamm, Schlitzaugen und vorn den großen, perlmuttweißen Schillerzahn. Ab Phase 2
  // umgibt ein eisiger Schimmer den Kopf (sz-glow), Eiskristalle treiben im Wasser (sz-frost),
  // sie runzelt die Stirn (sz-brow), der Kamm färbt sich blau (sz-crest) und sie reckt den
  // Kopf höher (sz-head).
  var BODY = 'M62 120 Q94 106 88 80 Q82 60 64 56';
  var HUMP = 'M12 120 Q28 84 46 120';

  var SCHILLERZAHN_SVG =
    '<svg class="boss-svg" viewBox="0 0 120 134" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="129" rx="46" ry="5" fill="#000" opacity="0.28"/>' +
      // Windung hinten und Leib mit Schuppenbändern und hellem Bauch
      '<path d="' + HUMP + '" stroke="#2fb3a0" stroke-width="13" stroke-linecap="round" fill="none"/>' +
      '<path d="' + HUMP + '" stroke="#8a6ae0" stroke-width="13" stroke-dasharray="3 7" fill="none"/>' +
      '<path d="M26 92 L30 82 L34 92 Z" fill="#c58cff"/>' +
      '<path d="M98 98 L106 94 L99 88 Z M95 80 L104 74 L95 70 Z M88 64 L95 56 L86 56 Z" fill="#c58cff" stroke="#7a4ac0" stroke-width="0.8"/>' +
      '<path d="' + BODY + '" stroke="#2fb3a0" stroke-width="16" stroke-linecap="round" fill="none"/>' +
      '<path d="' + BODY + '" stroke="#8a6ae0" stroke-width="16" stroke-dasharray="3 8" fill="none"/>' +
      '<path d="M64 116 Q88 104 82 80" stroke="#d2f6e2" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.75"/>' +
      '<circle cx="90" cy="92" r="1.6" fill="#ffd84a"/><circle cx="86" cy="70" r="1.6" fill="#ff8fc8"/>' +
      '<circle cx="76" cy="112" r="1.6" fill="#ffd84a"/><circle cx="30" cy="100" r="1.6" fill="#ff8fc8"/>' +
      // Wellen davor
      '<path d="M0 118 Q10 112 20 118 T40 118 T60 118 T80 118 T100 118 T120 118 V134 H0 Z" fill="#2a6ab0" opacity="0.9"/>' +
      '<path d="M4 122 q5 -3 10 0 M34 124 q5 -3 10 0 M70 123 q5 -3 10 0 M100 122 q5 -3 10 0" stroke="#bfe8ff" ' +
        'stroke-width="1.4" stroke-linecap="round" fill="none"/>' +
      '<path class="sz-frost" d="M18 112 l3 -6 3 6 -3 2 Z M92 110 l3 -7 3 7 -3 2 Z M54 113 l2 -5 2 5 -2 1.5 Z" fill="#dff4ff" ' +
        'stroke="#8ad0ff" stroke-width="0.8" opacity="0"/>' +
      // Kopf mit Kamm, Auge, Nüstern und dem Schillerzahn
      '<g class="sz-head">' +
        '<ellipse class="sz-glow" cx="50" cy="45" rx="31" ry="23" fill="none" stroke="#bfe8ff" stroke-width="3" opacity="0"/>' +
        '<path class="sz-crest" d="M54 30 L58 14 L63 27 L69 16 L70 31 L77 24 L74 42 Z" fill="#c58cff" stroke="#7a4ac0" stroke-width="0.8"/>' +
        '<path d="M36 57 L39.5 73 L43 57 Z" fill="#f6fbff" stroke="#8ad0ff" stroke-width="1"/>' +
        '<path d="M38.4 60 L39.6 69" stroke="#ff9adf" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M49 60 L51 67 L53 60 Z" fill="#f6fbff" stroke="#8ad0ff" stroke-width="0.8"/>' +
        '<path d="M72 46 Q74 30 56 28 Q36 28 27 42 Q22 52 30 58 Q46 64 63 60 Q73 56 72 46 Z" fill="#36c0a8" stroke="#1e7a6e" stroke-width="1.2"/>' +
        '<path d="M30 57 Q44 63 62 59" stroke="#1e5a54" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
        '<path d="M58 50 q3 -3 6 0 M62 42 q3 -3 6 0 M64 52 q3 -3 6 0" stroke="#8a6ae0" stroke-width="1.2" fill="none"/>' +
        '<circle cx="31" cy="45" r="1.3" fill="#1e5a54"/><circle cx="35" cy="43" r="1.3" fill="#1e5a54"/>' +
        '<ellipse cx="51" cy="41" rx="6" ry="5.4" fill="#fff8d0"/>' +
        '<ellipse cx="51.5" cy="41" rx="1.6" ry="4" fill="#1e2a1a"/>' +
        '<circle cx="53" cy="39.2" r="1" fill="#fff"/>' +
        '<path class="sz-brow" d="M44 34 Q51 31 58 35" stroke="#1e5a54" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0"/>' +
      '</g>' +
    '</svg>';

  RS.UI.WorldArt.register(9, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return SCHILLERZAHN_SVG; }
  });
})(window.RS = window.RS || {});
