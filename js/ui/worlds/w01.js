(function (RS) {
  'use strict';

  // Welt 1, Kandishain: Lutscherbäume, Lebkuchenhäuser, fernes Zuckerdorf,
  // Zuckerstangen-Tor am Ende und Graf Lakritz als Boss.

  var K = RS.UI.MapKit;
  var path = K.path;

  // route = die 10 Stationen, gate = Tor nach Station 10, crystal = Kristallbonbon,
  // hills = ferne Landschaft (hinten nach vorn), ground = naher Boden.
  var LAYOUTS = {
    wide: {
      w: 1000, h: 640,
      route: [[95, 560], [255, 525], [415, 565], [580, 530], [745, 485],
        [880, 365], [725, 285], [540, 315], [350, 270], [420, 135]],
      gate: [590, 118],
      crystal: [805, 112],
      moon: [92, 78],
      hills: [
        [[0, 250], [130, 212], [270, 236], [420, 150], [600, 128], [800, 138], [905, 196], [1000, 172]],
        [[0, 380], [150, 330], [300, 360], [480, 300], [650, 352], [830, 312], [1000, 336]]
      ],
      ground: [
        [[0, 500], [200, 470], [420, 505], [640, 458], [860, 425], [1000, 442]],
        [[0, 606], [300, 586], [600, 614], [1000, 592]]
      ],
      trees: [[175, 470], [335, 455], [495, 482], [660, 600], [820, 575], [965, 468],
        [640, 232], [255, 205], [290, 392], [880, 255], [110, 385], [950, 610]]
    },
    tall: {
      w: 400, h: 1300,
      route: [[100, 1220], [300, 1100], [110, 980], [290, 860], [100, 740],
        [300, 620], [110, 500], [290, 380], [100, 260], [270, 150]],
      gate: [112, 128],
      crystal: [330, 262],
      moon: [338, 58],
      hills: [
        [[0, 196], [100, 146], [220, 160], [330, 122], [400, 140]],
        [[0, 430], [150, 384], [300, 404], [400, 372]],
        [[0, 668], [120, 624], [280, 652], [400, 612]],
        [[0, 906], [160, 872], [300, 892], [400, 862]]
      ],
      ground: [
        [[0, 1140], [140, 1104], [290, 1124], [400, 1094]],
        [[0, 1262], [200, 1240], [400, 1258]]
      ],
      trees: [[30, 1120], [370, 1010], [370, 760], [30, 860], [30, 620], [370, 520],
        [370, 340], [30, 380], [30, 180], [210, 1250]]
    }
  };

  // Ferne Zuckerdorf-Silhouette auf einem Hügel (nur quer).
  function villageSilhouette(x, y) {
    var out = '<g class="art-far-village">';
    var houses = [[0, 16, 18], [20, 12, 26], [36, 18, 16], [58, 14, 22]];
    houses.forEach(function (hs) {
      var hx = x + hs[0];
      out += path('', 'M' + hx + ' ' + y + ' v-' + hs[2] + ' l' + hs[1] / 2 + ' -' + hs[1] * 0.7 +
        ' l' + hs[1] / 2 + ' ' + hs[1] * 0.7 + ' v' + hs[2] + ' Z');
      out += '<rect class="art-far-window" x="' + (hx + hs[1] / 2 - 2) + '" y="' + (y - hs[2] + 5) +
        '" width="4" height="4"/>';
    });
    return out + '</g>';
  }

  // Hintere Kulisse: Sterne, Mond, ferne Hügel, Dorfsilhouette. Liegt unter dem Bild.
  function backdrop(layout) {
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = K.svgOpen('map-backdrop', layout) + K.stars(layout, 97 + layout.w, skyEnd);
    out += K.moon(layout.moon) + K.hills(layout);
    if (layout.w > layout.h) { out += villageSilhouette(96, 222); }
    return out + '</svg>';
  }

  // Lutscherbaum: Stiel, Bonbonscheibe mit Wirbel, Schleife.
  function lollipop(x, y, color) {
    return '<g class="art-tree art-lolli" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="26" rx="11" ry="3"/>' +
      '<rect class="art-lolli-stick" x="-2" y="0" width="4" height="26" rx="2"/>' +
      '<circle class="art-lolli-disc" data-color="' + color + '" cx="0" cy="-6" r="14"/>' +
      path('art-lolli-swirl', 'M0 -6 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 1 a8 8 0 1 1 15 -3 a11 11 0 1 1 -19 6') +
      path('art-lolli-bow', 'M0 8 l-6 -4 v8 Z M0 8 l6 -4 v8 Z') +
      '</g>';
  }

  // Vordergrund: naher Boden, Weg, Lutscherbäume, Kristallbonbon.
  function foreground(layout, opts) {
    var out = K.svgOpen('map-scenery', layout) + K.ground(layout) + K.road(opts.path, opts.lit);
    layout.trees.forEach(function (t, i) { out += lollipop(t[0], t[1], String((i + 2) % 6)); });
    out += K.crystal(layout.crystal, opts.crystalLit);
    return out + '</svg>';
  }

  // Zuckerguss-Bögen unter der Traufe von x0 bis x1 auf Höhe y.
  function scallops(x0, x1, y, size) {
    var d = 'M' + x0 + ' ' + (y - 2) + ' H' + x1 + ' V' + y;
    var n = Math.round((x1 - x0) / size);
    var step = (x1 - x0) / n;
    for (var i = 0; i < n; i++) {
      d += ' q-' + (step / 2).toFixed(2) + ' ' + (size * 0.8).toFixed(2) + ' -' + step.toFixed(2) + ' 0';
    }
    return d + ' Z';
  }

  // Station als Lebkuchenhaus mit Zuckerguss; die Dachfarbe kommt aus der Bonbonpalette.
  function house(index) {
    var color = index % 6;
    return '<svg class="station-house station-house--w1" viewBox="0 0 60 56" aria-hidden="true" focusable="false">' +
      '<rect class="house-chimney" x="40" y="8" width="7" height="13" rx="1"/>' +
      path('house-roof', 'M3 27 L30 4 L57 27 Z', ' data-color="' + color + '"') +
      path('house-icing', 'M3.5 27 L30 4.5 L56.5 27') +
      '<rect class="house-body" x="10" y="26" width="40" height="29" rx="3"/>' +
      path('house-icing-drip', scallops(10, 50, 28, 5)) +
      '<rect class="house-window" x="14" y="33" width="12" height="11" rx="2"/>' +
      path('house-window-cross', 'M20 33 V44 M14 38.5 H26') +
      path('house-door', 'M33 55 V42 a6 6 0 0 1 12 0 V55 Z') +
      '<circle class="house-button" data-color="' + ((color + 2) % 6) + '" cx="14" cy="51" r="2"/>' +
      '<circle class="house-button" data-color="' + ((color + 4) % 6) + '" cx="27" cy="51" r="2"/>' +
      '<circle class="house-knob" cx="42.5" cy="49" r="1.2"/>' +
      '<circle class="house-attic" cx="30" cy="17" r="3.6"/>' +
      '</svg>';
  }

  function gate() { return K.archGate(1); }

  // Graf Lakritz: Lakritzschnecke mit Lakritzrad-Häuschen, Monokel, Umhang und Schnurrbart.
  var LAKRITZ_SVG =
    '<svg class="boss-svg" viewBox="0 0 140 120" aria-hidden="true" focusable="false">' +
      '<ellipse cx="72" cy="110" rx="56" ry="6" fill="#000" opacity="0.28"/>' +
      // Umhang flattert hinter dem Häuschen
      '<path class="lk-cape" d="M106 60 Q78 4 30 30 Q6 52 12 106 L70 104 Z" fill="#8c1838"/>' +
      '<path class="lk-lining" d="M100 62 Q76 16 34 36 Q16 56 20 100 L66 100 Z" fill="#e0204f" opacity="0.55"/>' +
      // Körper (Fuß und Hals)
      '<path class="lk-body" d="M14 104 Q12 92 30 92 L90 92 Q96 72 100 62 Q104 48 114 49 Q128 51 125 70 ' +
        'Q122 88 129 100 Q131 107 120 107 L22 107 Q14 107 14 104 Z" fill="#3b2a35"/>' +
      '<path d="M26 96 L88 96 M104 58 Q110 52 118 54" stroke="#fff" stroke-width="2" ' +
        'stroke-linecap="round" fill="none" opacity="0.18"/>' +
      // Hoher Kragen
      '<path class="lk-cape" d="M96 70 L86 42 L102 56 L106 40 L112 54 L122 40 L120 68 Z" fill="#8c1838"/>' +
      // Häuschen: Lakritzrad mit Bonbon in der Mitte
      '<circle class="lk-shell" cx="58" cy="62" r="31" fill="#2a1d25"/>' +
      '<path class="lk-spiral" d="M58 62 A4 4 0 0 1 66 62 A8 8 0 0 1 50 62 A12 12 0 0 1 74 62 ' +
        'A16 16 0 0 1 42 62 A20 20 0 0 1 82 62 A24 24 0 0 1 34 62" stroke="#5e4656" stroke-width="5" ' +
        'fill="none" stroke-linecap="round"/>' +
      '<path d="M36 46 Q46 34 60 33" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.22"/>' +
      '<circle class="lk-bead" cx="60" cy="62" r="5" fill="#e0204f"/>' +
      '<circle cx="58.5" cy="60.5" r="1.6" fill="#fff" opacity="0.7"/>' +
      // Fühler mit Augen, rechts das Monokel
      '<path d="M108 54 L102 30 M118 54 L124 32" stroke="#3b2a35" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="102" cy="27" r="6.5" fill="#fff"/><circle class="lk-pupil" cx="103.5" cy="28" r="2.8" fill="#1a1016"/>' +
      '<circle cx="124" cy="29" r="6.5" fill="#fff"/><circle class="lk-pupil" cx="122.5" cy="30" r="2.8" fill="#1a1016"/>' +
      '<circle cx="124" cy="29" r="9" fill="#bfe4ff" fill-opacity="0.22" stroke="#ffd78c" stroke-width="2"/>' +
      '<path d="M132 33 Q138 50 122 60" stroke="#ffd78c" stroke-width="1.2" fill="none"/>' +
      '<path class="lk-brow" d="M96 18 L107 22 M130 20 L119 23" stroke="#1a1016" stroke-width="2.4" stroke-linecap="round"/>' +
      // Schnurrbart aus roter Lakritzschnur und ein schiefes Grinsen
      '<path class="lk-tash" d="M113 66 q-6 -2 -9 2 q-2 4 2 4 M113 66 q6 -2 9 2 q2 4 -2 4" stroke="#e0204f" ' +
        'stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M108 75 Q114 79 121 73" stroke="#1a1016" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  RS.UI.WorldArt.register(1, {
    layouts: LAYOUTS,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate,
    bossFigure: function () { return LAKRITZ_SVG; }
  });
})(window.RS = window.RS || {});
