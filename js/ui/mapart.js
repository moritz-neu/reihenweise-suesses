(function (RS) {
  'use strict';

  // Gezeichnete Cartoon-Kulissen der Levelkarte: Himmel, Hügel und Berge (hinten),
  // Wege, Bäume, Kristallbonbon (vorn), Häuser und Tore. Liefert nur SVG-Text.
  // Hintergrundbilder (img/*.webp) liegen als eigene Schicht zwischen Kulisse und
  // Vordergrund, siehe css/map.css (--photo-kandishain, --photo-frostberge).

  // Je Welt zwei Anordnungen: quer (wide) und hoch (tall). points = 10 Stationen,
  // gate = Tor (Welt 1 nach Station 10, Welt 2 am Wegesanfang), crystal = Kristallbonbon,
  // hills = ferne Landschaft (hinten nach vorn), ground = naher Boden.
  var WORLDS = {
    1: {
      id: 1, name: 'Kandishain', key: 'kandishain', target: 'Frostzuckerberge',
      layouts: {
        wide: {
          w: 1000, h: 640,
          points: [[95, 560], [255, 525], [415, 565], [580, 530], [745, 485],
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
          points: [[100, 1220], [300, 1100], [110, 980], [290, 860], [100, 740],
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
      }
    },
    2: {
      id: 2, name: 'Frostzuckerberge', key: 'frostberge', target: 'Kandishain',
      layouts: {
        wide: {
          w: 1000, h: 640,
          points: [[200, 585], [345, 540], [500, 582], [660, 548], [815, 505],
            [905, 385], [745, 322], [560, 348], [380, 300], [465, 168]],
          gate: [72, 585],
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
          points: [[235, 1195], [105, 1075], [295, 955], [100, 835], [300, 715],
            [110, 595], [290, 475], [100, 355], [285, 250], [150, 150]],
          gate: [82, 1250],
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
      }
    }
  };

  // Catmull-Rom-Kurve durch alle Punkte als SVG-Pfad.
  function curve(points) {
    var d = 'M' + points[0][0] + ' ' + points[0][1];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
        ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }

  // Fläche unter einer Hügelkante bis zum unteren Rand.
  function area(points, w, h) {
    return curve(points) + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
  }

  // Kleiner fester Zufall, damit die Sterne bei jedem Aufbau gleich liegen.
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function path(cls, d, extra) {
    return '<path class="' + cls + '" d="' + d + '"' + (extra || '') + '/>';
  }

  function svgOpen(cls, layout) {
    return '<svg class="' + cls + '" viewBox="0 0 ' + layout.w + ' ' + layout.h +
      '" preserveAspectRatio="none" aria-hidden="true" focusable="false">';
  }

  function stars(layout, seed, maxY) {
    var r = rng(seed);
    var out = '<g class="art-stars">';
    var count = Math.round(layout.w * maxY / 4200);
    for (var i = 0; i < count; i++) {
      out += '<circle cx="' + (r() * layout.w).toFixed(1) + '" cy="' + (r() * maxY).toFixed(1) +
        '" r="' + (0.8 + r() * 1.6).toFixed(1) + '"' + (i % 5 === 0 ? ' class="is-twinkle"' : '') + '/>';
    }
    return out + '</g>';
  }

  function moon(m) {
    var x = m[0];
    var y = m[1];
    return '<circle class="art-moon-glow" cx="' + x + '" cy="' + y + '" r="46"/>' +
      path('art-moon', 'M' + x + ' ' + (y - 28) + ' A28 28 0 1 0 ' + x + ' ' + (y + 28) +
        ' A19 28 0 0 1 ' + x + ' ' + (y - 28) + ' Z');
  }

  // Ferne Zuckerdorf-Silhouette auf einem Hügel (nur Welt 1, quer).
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

  // Hintere Kulisse: Sterne, Mond, ferne Hügel bzw. Berge. Liegt unter dem Bild.
  function backdrop(world, layout) {
    var w = layout.w;
    var h = layout.h;
    var skyEnd = layout.h > layout.w ? 260 : 320;
    var out = svgOpen('map-backdrop', layout) + stars(layout, world.id * 97 + w, skyEnd);
    if (world.id === 2) { out += aurora(layout); }
    out += moon(layout.moon);
    if (world.id === 2) { out += mountains(layout); }
    layout.hills.forEach(function (pts, i) {
      var cls = 'art-hill art-hill--' + (i + 1);
      out += path(cls, area(pts, w, h));
      out += path('art-hill-rim', curve(pts));
    });
    if (world.id === 1 && w > h) { out += villageSilhouette(96, 222); }
    return out + '</svg>';
  }

  // Lutscherbaum (Welt 1): Stiel, Bonbonscheibe mit Wirbel, Schleife.
  function lollipop(x, y, color) {
    return '<g class="art-tree art-lolli" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="art-tree-shadow" cx="0" cy="26" rx="11" ry="3"/>' +
      '<rect class="art-lolli-stick" x="-2" y="0" width="4" height="26" rx="2"/>' +
      '<circle class="art-lolli-disc" data-color="' + color + '" cx="0" cy="-6" r="14"/>' +
      path('art-lolli-swirl', 'M0 -6 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 1 a8 8 0 1 1 15 -3 a11 11 0 1 1 -19 6') +
      path('art-lolli-bow', 'M0 8 l-6 -4 v8 Z M0 8 l6 -4 v8 Z') +
      '</g>';
  }

  // Eisbonbon-Tanne (Welt 2): drei Stufen mit Schneerand und Sternchen.
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

  function crystal(c, lit, ice) {
    return '<g class="map-crystal' + (ice ? ' map-crystal--ice' : '') + (lit ? ' is-lit' : '') +
      '" transform="translate(' + c[0] + ' ' + c[1] + ')">' +
      '<ellipse class="map-crystal-base" cx="0" cy="26" rx="26" ry="7"/>' +
      path('map-crystal-gem', 'M0 -26 L18 0 L0 26 L-18 0 Z') +
      path('map-crystal-shine', 'M0 -26 L6 0 L0 26 L-18 0 Z') +
      '</g>';
  }

  // Wegpunkte inklusive Tor: Welt 1 endet am Tor, Welt 2 beginnt dort.
  function route(world, layout) {
    return world.id === 1 ? layout.points.concat([layout.gate]) : [layout.gate].concat(layout.points);
  }

  // Vordergrund: naher Boden, Weg (freigeschalteter Teil golden), Bäume, Kristallbonbon.
  // opts: { lit: Anzahl freigeschalteter Stationen dieser Welt, gateOpen, crystalLit }
  function foreground(world, layout, opts) {
    var w = layout.w;
    var h = layout.h;
    var out = svgOpen('map-scenery', layout);
    layout.ground.forEach(function (pts, i) {
      out += path('art-ground art-ground--' + (i + 1), area(pts, w, h));
      out += path('art-ground-rim', curve(pts));
    });
    var pts = route(world, layout);
    var d = curve(pts);
    out += path('map-path-bed', d) + path('map-path-road', d) + path('map-path', d);
    var litPts;
    if (world.id === 1) {
      litPts = opts.gateOpen ? pts : pts.slice(0, opts.lit);
    } else {
      litPts = pts.slice(0, opts.lit + 1);
    }
    if (litPts.length > 1) { out += path('map-path-lit', curve(litPts)); }
    layout.trees.forEach(function (t, i) {
      out += world.id === 1 ? lollipop(t[0], t[1], String((i + 2) % 6)) : fir(t[0], t[1], i);
    });
    out += crystal(layout.crystal, opts.crystalLit, world.id === 2);
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

  // Station als Haus. Welt 1: Lebkuchenhaus mit Zuckerguss; Welt 2: Eisbonbonhütte mit
  // Schneehaube und Eiszapfen. Die Dachfarbe kommt je Station aus der Bonbonpalette.
  function house(worldId, index) {
    var color = index % 6;
    var svg = '<svg class="station-house station-house--w' + worldId + '" viewBox="0 0 60 56" aria-hidden="true" focusable="false">';
    if (worldId === 2) {
      svg +=
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
        '<circle class="house-attic" cx="30" cy="17" r="3.2"/>';
    } else {
      svg +=
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
        '<circle class="house-attic" cx="30" cy="17" r="3.6"/>';
    }
    return svg + '</svg>';
  }

  // Tor: Zuckerstangen-Bogen; geschlossen mit Lakritzstäben davor.
  // Die Stäbe bleiben im SVG, damit die Öffnungsanimation sie wegschieben kann.
  function gate(worldId) {
    var arch = 'M14 92 V44 A26 26 0 0 1 66 44 V92';
    var portal = 'M17 92 V44 A23 23 0 0 1 63 44 V92 Z';
    return '<svg class="gate-svg gate-svg--w' + worldId + '" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="34" ry="5"/>' +
      '<defs><clipPath id="rs-gate-clip-' + worldId + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#rs-gate-clip-' + worldId + ')"><g class="gate-bars">' +
        '<rect x="22" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="37" y="20" width="6" height="72" rx="3"/>' +
        '<rect x="52" y="30" width="6" height="62" rx="3"/>' +
        '<rect x="17" y="56" width="46" height="6" rx="3"/>' +
        path('gate-bar-shine', 'M24 34 V88 M39 24 V88 M54 34 V88') +
      '</g></g>' +
      path('gate-arch', arch) + path('gate-arch-stripes', arch) +
      '<g class="gate-sparkles">' +
        path('gate-sparkle', 'M40 2 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z') +
        path('gate-sparkle gate-sparkle--s', 'M8 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
        path('gate-sparkle gate-sparkle--s', 'M72 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z') +
      '</g>' +
    '</svg>';
  }

  RS.UI = RS.UI || {};
  RS.UI.MapArt = {
    WORLDS: WORLDS,
    curve: curve,
    route: route,
    backdrop: backdrop,
    foreground: foreground,
    house: house,
    gate: gate
  };
})(window.RS = window.RS || {});
