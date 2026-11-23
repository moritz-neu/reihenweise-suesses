(function (RS) {
  'use strict';

  // Gemeinsame Bausteine der Kartenzeichnungen (liefern nur SVG-Text) und das Verzeichnis
  // der Weltzeichnungen. Jede Welt registriert sich mit
  // RS.UI.WorldArt.register(id, { layouts: { wide, tall }, backdrop(layout),
  //   foreground(layout, opts), house(index), gate(state), bossFigure() }).
  // Ein layout hat w, h, route (Stützpunkte des Wegs), gate (Tor am Ende), ab Welt 2
  // backGate (Tor am Anfang) und die Dekorpunkte, die die Welt braucht.
  // foreground bekommt opts = { path, lit, crystalLit }: path ist der ganze Weg mit Toren,
  // lit der leuchtende Teil.

  // Kontrollpunkte der Catmull-Rom-Kurve durch alle Punkte: je Abschnitt [p1, c1, c2, p2].
  function segments(points) {
    var out = [];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      out.push([p1,
        [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
        p2]);
    }
    return out;
  }

  // Die Kurve als SVG-Pfad.
  function curve(points) {
    var d = 'M' + points[0][0] + ' ' + points[0][1];
    segments(points).forEach(function (s) {
      d += ' C' + s[1][0].toFixed(1) + ' ' + s[1][1].toFixed(1) + ' ' + s[2][0].toFixed(1) + ' ' +
        s[2][1].toFixed(1) + ' ' + s[3][0] + ' ' + s[3][1];
    });
    return d;
  }

  function bezier(s, t) {
    var u = 1 - t;
    var a = u * u * u;
    var b = 3 * u * u * t;
    var c = 3 * u * t * t;
    var d = t * t * t;
    return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0],
      a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]];
  }

  var SAMPLES = 48;   // Stützstellen je Abschnitt für die Bogenlänge

  // n Stationen auf dem Weg: bei n === route.length genau die Stützpunkte, sonst n Punkte
  // in gleichem Bogenabstand auf derselben Kurve, die curve() zeichnet.
  function stations(route, n) {
    if (n === route.length) { return route; }
    if (n <= 1) { return [route[0]]; }
    var pts = [route[0]];
    segments(route).forEach(function (s) {
      for (var k = 1; k <= SAMPLES; k++) { pts.push(bezier(s, k / SAMPLES)); }
    });
    var len = [0];
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0];
      var dy = pts[i][1] - pts[i - 1][1];
      len.push(len[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    var total = len[len.length - 1];
    var out = [];
    var j = 1;
    for (var m = 0; m < n; m++) {
      var want = total * m / (n - 1);
      while (j < len.length - 1 && len[j] < want) { j++; }
      var span = len[j] - len[j - 1];
      var t = span > 0 ? Math.min(1, Math.max(0, (want - len[j - 1]) / span)) : 0;
      out.push([round1(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t),
        round1(pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t)]);
    }
    out[0] = route[0].slice();
    out[n - 1] = route[route.length - 1].slice();
    return out;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

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

  // Ferne Hügelketten (hinten nach vorn) mit heller Kante.
  function hills(layout) {
    var out = '';
    layout.hills.forEach(function (pts, i) {
      out += path('art-hill art-hill--' + (i + 1), area(pts, layout.w, layout.h));
      out += path('art-hill-rim', curve(pts));
    });
    return out;
  }

  // Naher Boden.
  function ground(layout) {
    var out = '';
    layout.ground.forEach(function (pts, i) {
      out += path('art-ground art-ground--' + (i + 1), area(pts, layout.w, layout.h));
      out += path('art-ground-rim', curve(pts));
    });
    return out;
  }

  // Der Weg mit Bett, Straße und Mittellinie, der freigeschaltete Teil golden.
  function road(pts, lit) {
    var d = curve(pts);
    var out = path('map-path-bed', d) + path('map-path-road', d) + path('map-path', d);
    if (lit && lit.length > 1) { out += path('map-path-lit', curve(lit)); }
    return out;
  }

  // Kristallbonbon: leuchtet, sobald der Boss der Welt besiegt ist.
  function crystal(c, lit, variant) {
    return '<g class="map-crystal' + (variant ? ' map-crystal--' + variant : '') + (lit ? ' is-lit' : '') +
      '" transform="translate(' + c[0] + ' ' + c[1] + ')">' +
      '<ellipse class="map-crystal-base" cx="0" cy="26" rx="26" ry="7"/>' +
      path('map-crystal-gem', 'M0 -26 L18 0 L0 26 L-18 0 Z') +
      path('map-crystal-shine', 'M0 -26 L6 0 L0 26 L-18 0 Z') +
      '</g>';
  }

  var clipCount = 0;

  // Zuckerstangen-Torbogen (Welt 1 und 2); geschlossen mit Lakritzstäben davor.
  // Die Stäbe bleiben im SVG, damit die Öffnungsanimation sie wegschieben kann.
  function archGate(worldId) {
    var arch = 'M14 92 V44 A26 26 0 0 1 66 44 V92';
    var portal = 'M17 92 V44 A23 23 0 0 1 63 44 V92 Z';
    var clip = 'rs-gate-clip-' + worldId + '-' + (++clipCount);
    return '<svg class="gate-svg gate-svg--w' + worldId + '" viewBox="0 0 80 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="gate-shadow" cx="40" cy="92" rx="34" ry="5"/>' +
      '<defs><clipPath id="' + clip + '">' + path('', portal) + '</clipPath></defs>' +
      path('gate-portal', portal) +
      '<g clip-path="url(#' + clip + ')"><g class="gate-bars">' +
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

  // ---------- Verzeichnis der Weltzeichnungen ----------

  var arts = {};

  RS.UI = RS.UI || {};
  RS.UI.WorldArt = {
    register: function (worldId, def) { arts[worldId] = def; },
    get: function (worldId) { return arts[worldId]; }
  };

  RS.UI.MapKit = {
    curve: curve,
    stations: stations,
    area: area,
    rng: rng,
    path: path,
    svgOpen: svgOpen,
    stars: stars,
    moon: moon,
    hills: hills,
    ground: ground,
    road: road,
    crystal: crystal,
    archGate: archGate
  };
})(window.RS = window.RS || {});
