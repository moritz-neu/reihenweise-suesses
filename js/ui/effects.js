(function (RS) {
  'use strict';

  // Partikel-Effekte auf einem <canvas> über dem Spielfeld.
  // Alles wird in Zellen-Einheiten gespeichert (x = Spalte, y = Reihe, Mitte einer Zelle = +0.5)
  // und erst beim Zeichnen in Pixel umgerechnet; so stimmt es auch nach einer Größenänderung.
  // Die rAF-Schleife läuft nur, solange etwas zu zeichnen ist.

  var MAX_PARTICLES = 300;

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function readPalette() {
    var style = getComputedStyle(document.documentElement);
    var colors = [];
    for (var i = 0; i < 6; i++) {
      colors.push(style.getPropertyValue('--candy-' + i + '-glow').trim() || '#ffffff');
    }
    return { candy: colors, gold: style.getPropertyValue('--gold').trim() || '#ffd78c' };
  }

  // create(host, rows, cols): legt das Canvas in `host` an (host muss positioniert sein).
  function create(host, rows, cols) {
    var canvas = document.createElement('canvas');
    canvas.className = 'bv-effects';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var palette = readPalette();
    var width = 0;        // CSS-Pixel
    var height = 0;
    var dpr = 1;
    var particles = [];
    var shapes = [];      // { start, dur, draw(k) }
    var rafId = 0;
    var last = 0;
    var destroyed = false;

    // Liest die Größe nur, wenn die Schleife startet oder der ResizeObserver meldet.
    function resize() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var d = window.devicePixelRatio || 1;
      if (w === width && h === height && d === dpr) { return; }
      width = w;
      height = h;
      dpr = d;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var observer = null;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
    }

    function cw() { return width / cols; }
    function ch() { return height / rows; }
    function px(x) { return x * cw(); }
    function py(y) { return y * ch(); }

    // color: Farbindex 0..5, ein CSS-Farbwert oder null (Regenbogen)
    function colorOf(color) {
      if (typeof color === 'string') { return color; }
      if (color === null || color === undefined) {
        return palette.candy[Math.floor(Math.random() * palette.candy.length)];
      }
      return palette.candy[color] || palette.gold;
    }

    function enabled() { return !reducedMotion(); }

    function addParticle(p) {
      if (particles.length >= MAX_PARTICLES) { particles.shift(); }
      particles.push(p);
    }

    function addShape(ms, draw) {
      shapes.push({ start: performance.now(), dur: ms, draw: draw });
      start();
    }

    function start() {
      if (rafId || destroyed) { return; }
      resize();
      last = 0;
      rafId = requestAnimationFrame(frame);
    }

    function frame(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      drawShapes(now);
      drawParticles(dt, now);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (particles.length || shapes.length) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = 0;
        ctx.clearRect(0, 0, width, height);
      }
    }

    function drawParticles(dt, now) {
      var alive = [];
      var unit = cw();
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { continue; }
        p.vy += p.gravity * dt;
        p.vx *= 1 - Math.min(1, p.drag * dt);
        p.vy *= 1 - Math.min(1, p.drag * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        var k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.fillStyle = p.color;
        if (p.star) {
          drawStar(px(p.x), py(p.y), p.size * unit * (0.6 + 0.4 * k), now / 300);
        } else {
          ctx.beginPath();
          ctx.arc(px(p.x), py(p.y), p.size * unit * (0.4 + 0.6 * k), 0, Math.PI * 2);
          ctx.fill();
        }
        alive.push(p);
      }
      particles = alive;
    }

    function drawStar(x, y, s, angle) {
      ctx.beginPath();
      for (var i = 0; i < 8; i++) {
        var rad = i % 2 === 0 ? s : s * 0.35;
        var ang = angle + i * Math.PI / 4;
        ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawShapes(now) {
      var alive = [];
      for (var i = 0; i < shapes.length; i++) {
        var s = shapes[i];
        var k = (now - s.start) / s.dur;
        if (k >= 1) { continue; }
        s.draw(Math.max(0, k));
        alive.push(s);
      }
      shapes = alive;
    }

    // ---------- öffentliche Effekte (pos = {r, c}) ----------

    // Funken, die aus einer Zelle platzen (beim Auflösen eines Bonbons).
    function burst(pos, color, count) {
      if (!enabled()) { return; }
      var n = count || 8;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var v = 3.2 * (0.4 + Math.random() * 0.8);
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 1,
          gravity: 9, drag: 2.5, size: 0.05 + Math.random() * 0.06,
          life: 0.45 + Math.random() * 0.3, max: 0.75, color: colorOf(color), star: false
        });
      }
      start();
    }

    // Goldene Sternchen um eine Zelle (neues Spezial-Bonbon).
    function sparkle(pos) {
      if (!enabled()) { return; }
      for (var i = 0; i < 10; i++) {
        var ang = (i / 10) * Math.PI * 2;
        var v = 1 + Math.random() * 1.2;
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          gravity: 0, drag: 3, size: 0.1 + Math.random() * 0.06,
          life: 0.5 + Math.random() * 0.2, max: 0.7,
          color: i % 2 ? '#ffffff' : palette.gold, star: true
        });
      }
      start();
    }

    function beamStops(grad, glow) {
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.3, glow);
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.7, glow);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    }

    // Leuchtender Strahl über eine Reihe ('h') oder Spalte ('v'), wächst von der Mitte aus.
    function beam(orientation, index, color, ms) {
      if (!enabled()) { return; }
      var glow = colorOf(color);
      addShape(ms, function (k) {
        var grow = Math.min(1, k * 3);
        ctx.globalAlpha = 1 - Math.max(0, (k - 0.5) * 2);
        var thick = 0.25 + 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.5));
        var grad;
        if (orientation === 'h') {
          var y = py(index + 0.5);
          var t = thick * ch();
          var half = width * grow / 2;
          grad = ctx.createLinearGradient(0, y - t, 0, y + t);
          beamStops(grad, glow);
          ctx.fillStyle = grad;
          ctx.fillRect(width / 2 - half, y - t, half * 2, t * 2);
        } else {
          var x = px(index + 0.5);
          var tv = thick * cw();
          var halfV = height * grow / 2;
          grad = ctx.createLinearGradient(x - tv, 0, x + tv, 0);
          beamStops(grad, glow);
          ctx.fillStyle = grad;
          ctx.fillRect(x - tv, height / 2 - halfV, tv * 2, halfV * 2);
        }
      });
      for (var i = 0; i < 14; i++) {
        var along = Math.random() * (orientation === 'h' ? cols : rows);
        var ang = Math.random() * Math.PI * 2;
        addParticle({
          x: orientation === 'h' ? along : index + 0.5,
          y: orientation === 'h' ? index + 0.5 : along,
          vx: Math.cos(ang), vy: Math.sin(ang), gravity: 0, drag: 2, size: 0.07,
          life: 0.4 + Math.random() * 0.2, max: 0.6, color: '#ffffff', star: false
        });
      }
    }

    // Druckwelle: wachsender Ring um eine Zelle (Bombe). radius in Zellen.
    function shockwave(pos, radius, ms) {
      if (!enabled()) { return; }
      addShape(ms, function (k) {
        var x = px(pos.c + 0.5);
        var y = py(pos.r + 0.5);
        var r = radius * cw() * (0.2 + 0.8 * Math.sqrt(k));
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = cw() * (0.35 * (1 - k) + 0.05);
        ctx.strokeStyle = palette.gold;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = (1 - k) * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });
      for (var i = 0; i < 24; i++) {
        var ang = (i / 24) * Math.PI * 2;
        var v = radius * 2.2;
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          gravity: 0, drag: 4, size: 0.08, life: 0.45, max: 0.45,
          color: i % 2 ? palette.gold : '#ffffff', star: false
        });
      }
    }

    // Wirbel: Regenbogen-Spirale am Farbball und Lichtbahnen zu allen getroffenen Zellen.
    function swirl(pos, targets, ms) {
      if (!enabled()) { return; }
      var list = targets || [];
      addShape(ms, function (k) {
        var x = px(pos.c + 0.5);
        var y = py(pos.r + 0.5);
        var spin = k * Math.PI * 4;
        ctx.lineWidth = cw() * 0.08;
        ctx.globalAlpha = 1 - k;
        for (var i = 0; i < 6; i++) {
          ctx.strokeStyle = palette.candy[i];
          ctx.beginPath();
          var rad = cw() * (0.3 + k * 1.2);
          ctx.arc(x, y, rad, spin + i * Math.PI / 3, spin + i * Math.PI / 3 + Math.PI / 4);
          ctx.stroke();
        }
        var reach = Math.min(1, k * 2.2);
        ctx.globalAlpha = 1 - Math.max(0, (k - 0.55) * 2.2);
        ctx.lineWidth = cw() * 0.07;
        list.forEach(function (t, j) {
          var tx = px(t.c + 0.5);
          var ty = py(t.r + 0.5);
          ctx.strokeStyle = palette.candy[j % 6];
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (tx - x) * reach, y + (ty - y) * reach);
          ctx.stroke();
        });
      });
      list.forEach(function (t) {
        addParticle({
          x: t.c + 0.5, y: t.r + 0.5, vx: 0, vy: -0.5, gravity: 0, drag: 1, size: 0.12,
          life: 0.55, max: 0.55, color: '#ffffff', star: true
        });
      });
    }

    // Eissplitter: eckige, helle Stücke fliegen aus der Zelle (Eis bricht).
    function splinter(pos, count) {
      if (!enabled()) { return; }
      var n = count || 9;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var v = 2.4 * (0.5 + Math.random() * 0.8);
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 0.8,
          gravity: 7, drag: 2, size: 0.07 + Math.random() * 0.07,
          life: 0.5 + Math.random() * 0.3, max: 0.8,
          color: i % 3 ? '#bfeaff' : '#ffffff', star: i % 2 === 0
        });
      }
      start();
    }

    // Schokoladenkrümel: braune Brocken fallen aus der Zelle.
    function crumble(pos, count) {
      if (!enabled()) { return; }
      var n = count || 10;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var v = 1.6 * (0.3 + Math.random() * 0.9);
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 1.2,
          gravity: 12, drag: 1.5, size: 0.06 + Math.random() * 0.07,
          life: 0.5 + Math.random() * 0.3, max: 0.8,
          color: i % 2 ? '#a0612f' : '#6b3a1c', star: false
        });
      }
      start();
    }

    // Fließende Schokolade: ein Strang wächst von einer Zelle in die Nachbarzelle.
    function flow(from, to, ms) {
      if (!enabled()) { return; }
      addShape(ms, function (k) {
        var e = 1 - Math.pow(1 - k, 2);
        var x0 = from.c + 0.5;
        var y0 = from.r + 0.5;
        var x = x0 + (to.c - from.c) * e;
        var y = y0 + (to.r - from.r) * e;
        ctx.globalAlpha = 0.85 * (1 - Math.max(0, k - 0.6) / 0.4);
        ctx.strokeStyle = '#8a4a22';
        ctx.lineWidth = cw() * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px(x0), py(y0));
        ctx.lineTo(px(x), py(y));
        ctx.stroke();
        ctx.fillStyle = '#b5703a';
        ctx.beginPath();
        ctx.arc(px(x), py(y), cw() * (0.12 + 0.18 * e), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Glitzer-Explosion: viele bunte Sternchen und Funken platzen aus einer Zelle (Boss besiegt).
    function glitter(pos, count) {
      if (!enabled()) { return; }
      var n = count || 60;
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var v = 1.2 + Math.random() * 2.6;
        addParticle({
          x: pos.c + 0.5, y: pos.r + 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 0.6,
          gravity: 1.6, drag: 1.4, size: 0.04 + Math.random() * 0.06,
          life: 0.8 + Math.random() * 0.7, max: 1.5,
          color: i % 4 === 0 ? '#ffffff' : i % 4 === 1 ? palette.gold : colorOf(null), star: i % 2 === 0
        });
      }
      start();
    }

    function destroy() {
      destroyed = true;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (observer) { observer.disconnect(); }
      particles = [];
      shapes = [];
      if (canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }

    return {
      canvas: canvas,
      burst: burst,
      sparkle: sparkle,
      splinter: splinter,
      crumble: crumble,
      flow: flow,
      beam: beam,
      shockwave: shockwave,
      swirl: swirl,
      glitter: glitter,
      enabled: enabled,
      isIdle: function () { return !rafId; },
      count: function () { return particles.length; },
      destroy: destroy
    };
  }

  RS.UI.Effects = { create: create, MAX_PARTICLES: MAX_PARTICLES };
})(window.RS = window.RS || {});
