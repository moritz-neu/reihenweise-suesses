(function (RS) {
  'use strict';

  // Spielfeld-Ansicht: zeichnet ein RS.Board, spielt Engine-Ereignisse als Animation ab
  // und meldet Tausch-Wünsche (Ziehen oder Klick-Klick).
  //
  // Aufbau (Ebenen von unten nach oben): Kacheln, Glasur, Bonbons, Lakritzgitter, Effekte.
  // Jedes Element ist eine Zelle groß und wird per transform: translate(c*100%, r*100%)
  // platziert; so passt alles ohne Messen zu jeder Feldgröße.

  var el = RS.UI.el;

  var DUR = {
    swap: 150, rejected: 150, matched: 220, cleared: 220, created: 260,
    beam: 320, shockwave: 320, swirl: 420, fell: 200, spawned: 200, shuffled: 400,
    stagePause: 70
  };

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Bei reduzierter Bewegung laufen alle Animationen fast ohne Dauer.
  function dur(ms) { return reducedMotion() ? 1 : ms; }

  function tf(r, c) { return 'translate(' + (c * 100) + '%,' + (r * 100) + '%)'; }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Web-Animation mit Promise; fehlt die API, ist sie sofort fertig.
  // Ein Zeitgeber sichert ab, dass das Promise auch dann endet, wenn der Browser keine
  // Bilder zeichnet (Hintergrund-Tab, Headless): dann geht das Spiel trotzdem weiter.
  function animate(node, keyframes, ms, easing) {
    if (!node || !node.animate) { return Promise.resolve(); }
    var d = dur(ms);
    var a = node.animate(keyframes, { duration: d, easing: easing || 'ease-out' });
    var fallback = wait(d + 60).then(function () {
      if (a.playState !== 'finished') {
        try { a.finish(); } catch (err) { /* abgebrochen: nichts zu tun */ }
      }
    });
    return Promise.race([a.finished, fallback]).then(function () {}, function () {});
  }

  function grid(rows, cols, value) {
    var g = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) { row.push(value); }
      g.push(row);
    }
    return g;
  }

  function isNeighbor(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function create(container, board) {
    var root = el('div', 'bv-board');
    var tiles = el('div', 'bv-layer bv-tiles');
    var glazeLayer = el('div', 'bv-layer bv-glazes');
    var pieceLayer = el('div', 'bv-layer bv-pieces');
    var lockLayer = el('div', 'bv-layer bv-locks');
    root.appendChild(tiles);
    root.appendChild(glazeLayer);
    root.appendChild(pieceLayer);
    root.appendChild(lockLayer);
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Spielfeld');
    container.appendChild(root);

    var effects = RS.UI.Effects.create(root, board.rows, board.cols);

    var current = board;
    var rows = 0;
    var cols = 0;
    var maskKey = '';
    var ids = [];            // ids[r][c] = Bonbon-id, wie die Ansicht sie gerade zeigt
    var pieces = {};         // id -> { el, body, candy, r, c, color, special }
    var glazeEls = [];
    var lockEls = [];

    var busy = false;
    var destroyed = false;   // nach destroy(): laufende Abspielung bricht ab
    var swapHandler = null;
    var pickHandler = null;  // gesetzt: Klick wählt eine Zelle aus, kein Tausch
    var selected = null;     // Pos der ersten angeklickten Zelle
    var hint = null;         // { a, b }
    var queue = Promise.resolve();

    // ---------- Aufbau ----------

    function buildStatic(b) {
      rows = b.rows;
      cols = b.cols;
      root.style.setProperty('--bv-rows', rows);
      root.style.setProperty('--bv-cols', cols);
      tiles.innerHTML = '';
      glazeLayer.innerHTML = '';
      lockLayer.innerHTML = '';
      glazeEls = grid(rows, cols, null);
      lockEls = grid(rows, cols, null);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (!b.mask[r][c]) { continue; }
          var tile = el('div', 'bv-cell bv-tile' + ((r + c) % 2 ? ' bv-tile--alt' : ''));
          tile.style.transform = tf(r, c);
          tiles.appendChild(tile);
          var g = el('div', 'bv-cell bv-glaze');
          g.style.transform = tf(r, c);
          glazeLayer.appendChild(g);
          glazeEls[r][c] = g;
          var l = el('div', 'bv-cell bv-lock');
          l.style.transform = tf(r, c);
          lockLayer.appendChild(l);
          lockEls[r][c] = l;
        }
      }
      maskKey = maskSignature(b);
    }

    function maskSignature(b) {
      return b.rows + 'x' + b.cols + ':' + b.mask.map(function (row) {
        return row.map(function (m) { return m ? '1' : '0'; }).join('');
      }).join('/');
    }

    function setGlaze(r, c, strength) {
      var g = glazeEls[r] && glazeEls[r][c];
      if (g) { g.setAttribute('data-strength', String(strength || 0)); }
    }

    function setLock(r, c, locked) {
      var l = lockEls[r] && lockEls[r][c];
      if (l) { l.setAttribute('data-on', locked ? '1' : '0'); }
    }

    function makePiece(id, color, special) {
      var node = el('div', 'bv-cell bv-piece');
      node.setAttribute('data-id', String(id));
      var body = el('div', 'bv-body');
      var candy = el('div', 'candy');
      body.appendChild(el('div', 'bv-glow'));
      body.appendChild(candy);
      body.appendChild(el('div', 'bv-mark'));
      node.appendChild(body);
      pieceLayer.appendChild(node);
      var p = { el: node, body: body, candy: candy, r: -1, c: -1, color: undefined, special: undefined };
      pieces[id] = p;
      setLook(p, color, special);
      return p;
    }

    function setLook(p, color, special) {
      if (p.color !== color) {
        p.color = color;
        if (color === null || color === undefined) { p.candy.removeAttribute('data-color'); }
        else { p.candy.setAttribute('data-color', String(color)); }
      }
      if (p.special !== special) {
        p.special = special;
        if (special) { p.el.setAttribute('data-special', special); }
        else { p.el.removeAttribute('data-special'); }
      }
    }

    function place(p, r, c) {
      p.r = r;
      p.c = c;
      p.el.style.transform = tf(r, c);
    }

    function removePiece(id) {
      var p = pieces[id];
      if (!p) { return; }
      if (p.el.parentNode) { p.el.parentNode.removeChild(p.el); }
      delete pieces[id];
    }

    function pieceAt(pos) {
      var id = ids[pos.r] && ids[pos.r][pos.c];
      return id === null || id === undefined ? null : pieces[id] || null;
    }

    // ---------- render: vollständiger Abgleich mit dem Brett ----------

    function render(b) {
      current = b || current;
      b = current;
      if (maskSignature(b) !== maskKey) { buildStatic(b); }
      ids = grid(rows, cols, null);
      var seen = {};
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          setGlaze(r, c, b.glaze[r][c]);
          setLock(r, c, b.lock[r][c]);
          var candy = b.mask[r][c] ? b.candies[r][c] : null;
          if (!candy) { continue; }
          var p = pieces[candy.id] || makePiece(candy.id, candy.color, candy.special);
          setLook(p, candy.color, candy.special || null);
          if (p.r !== r || p.c !== c) { place(p, r, c); }
          p.el.style.opacity = '';
          ids[r][c] = candy.id;
          seen[candy.id] = true;
        }
      }
      Object.keys(pieces).forEach(function (id) {
        if (!seen[id]) { removePiece(id); }
      });
      refreshMarks();
    }

    // Auswahl und Tipp als Klassen an den Bonbons
    function refreshMarks() {
      Object.keys(pieces).forEach(function (id) {
        var p = pieces[id];
        p.el.classList.toggle('is-selected', Boolean(selected && selected.r === p.r && selected.c === p.c));
        p.el.classList.toggle('is-hint', Boolean(hint && (
          (hint.a.r === p.r && hint.a.c === p.c) || (hint.b.r === p.r && hint.b.c === p.c))));
      });
    }

    // ---------- Animationen je Ereignis ----------

    function moveAnim(p, from, to, ms, easing) {
      place(p, to.r, to.c);
      return animate(p.el, [{ transform: tf(from.r, from.c) }, { transform: tf(to.r, to.c) }], ms, easing);
    }

    function swapIds(a, b) {
      var t = ids[a.r][a.c];
      ids[a.r][a.c] = ids[b.r][b.c];
      ids[b.r][b.c] = t;
    }

    function playSwap(a, b, ms) {
      var pa = pieceAt(a);
      var pb = pieceAt(b);
      swapIds(a, b);
      var jobs = [];
      if (pa) { pa.el.style.zIndex = '2'; jobs.push(moveAnim(pa, a, b, ms, 'ease-in-out')); }
      if (pb) { jobs.push(moveAnim(pb, b, a, ms, 'ease-in-out')); }
      return Promise.all(jobs).then(function () { if (pa) { pa.el.style.zIndex = ''; } });
    }

    // Ungültiger Tausch ohne vorheriges `swapped`: kurz anstupsen und zurückfedern.
    function playNudge(a, b) {
      var pa = pieceAt(a);
      if (!pa) { return Promise.resolve(); }
      var dr = isNeighbor(a, b) ? (b.r - a.r) * 0.3 : 0;
      var dc = isNeighbor(a, b) ? (b.c - a.c) * 0.3 : 0.12;
      var base = tf(a.r, a.c);
      var out = 'translate(' + ((a.c + dc) * 100) + '%,' + ((a.r + dr) * 100) + '%)';
      var frames = [{ transform: base }, { transform: out }, { transform: base }];
      var jobs = [animate(pa.el, frames, DUR.rejected, 'ease-in-out')];
      var pb = isNeighbor(a, b) ? pieceAt(b) : null;
      if (pb) {
        var baseB = tf(b.r, b.c);
        var outB = 'translate(' + ((b.c - dc) * 100) + '%,' + ((b.r - dr) * 100) + '%)';
        jobs.push(animate(pb.el, [{ transform: baseB }, { transform: outB }, { transform: baseB }],
          DUR.rejected, 'ease-in-out'));
      }
      return Promise.all(jobs);
    }

    function playMatched(group) {
      var jobs = [];
      group.forEach(function (e) {
        e.cells.forEach(function (pos) {
          var p = pieceAt(pos);
          if (!p) { return; }
          jobs.push(animate(p.body, [
            { transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1.05)' }
          ], DUR.matched));
          jobs.push(animate(p.body.firstChild, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.8 }], DUR.matched));
        });
      });
      return Promise.all(jobs);
    }

    function playCleared(e) {
      var jobs = [];
      e.candies.forEach(function (cd) {
        var p = pieces[cd.id];
        effects.burst(cd.pos, cd.special === 'colorball' ? null : cd.color, cd.special ? 14 : 8);
        if (ids[cd.pos.r] && ids[cd.pos.r][cd.pos.c] === cd.id) { ids[cd.pos.r][cd.pos.c] = null; }
        if (!p) { return; }
        p.el.style.opacity = '0';
        jobs.push(animate(p.el, [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], DUR.cleared)
          .then(function () { removePiece(cd.id); }));
        jobs.push(animate(p.body, [
          { transform: 'scale(1.05)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(0.2)' }
        ], DUR.cleared, 'ease-in'));
      });
      return Promise.all(jobs);
    }

    function playCreated(group) {
      var jobs = [];
      group.forEach(function (e) {
        var p = pieces[e.id] || pieceAt(e.pos);
        if (!p) { return; }
        setLook(p, e.color, e.special);
        effects.sparkle(e.pos);
        jobs.push(animate(p.body, [
          { transform: 'scale(0.6) rotate(-30deg)' }, { transform: 'scale(1.25) rotate(10deg)' },
          { transform: 'scale(1) rotate(0deg)' }
        ], DUR.created, 'ease-out'));
      });
      return Promise.all(jobs);
    }

    // Volle Reihen/Spalten in einer Zellenliste (für Streifen und ihre Kombos).
    function fullLines(cells) {
      var rowCount = {};
      var colCount = {};
      cells.forEach(function (p) {
        rowCount[p.r] = (rowCount[p.r] || 0) + 1;
        colCount[p.c] = (colCount[p.c] || 0) + 1;
      });
      var h = [];
      var v = [];
      var r, c, n;
      for (r = 0; r < rows; r++) {
        n = 0;
        for (c = 0; c < cols; c++) { if (current.mask[r][c]) { n++; } }
        if (n > 1 && rowCount[r] === n) { h.push(r); }
      }
      for (c = 0; c < cols; c++) {
        n = 0;
        for (r = 0; r < rows; r++) { if (current.mask[r][c]) { n++; } }
        if (n > 1 && colCount[c] === n) { v.push(c); }
      }
      return { h: h, v: v };
    }

    function playTriggered(e) {
      var p = pieceAt(e.pos);
      var color = p ? p.color : null;
      if (p) {
        animate(p.body, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1.1)' }],
          DUR.matched);
      }
      var ms;
      if (e.special === 'stripeH' || e.special === 'stripeV') {
        var lines = fullLines(e.cells);
        if (!lines.h.length && !lines.v.length) {
          if (e.special === 'stripeH') { lines.h.push(e.pos.r); } else { lines.v.push(e.pos.c); }
        }
        lines.h.forEach(function (r) { effects.beam('h', r, color, dur(DUR.beam)); });
        lines.v.forEach(function (c) { effects.beam('v', c, color, dur(DUR.beam)); });
        ms = DUR.beam;
      } else if (e.special === 'bomb') {
        var radius = 1;
        e.cells.forEach(function (q) {
          radius = Math.max(radius, Math.abs(q.r - e.pos.r), Math.abs(q.c - e.pos.c));
        });
        effects.shockwave(e.pos, radius + 0.6, dur(DUR.shockwave));
        ms = DUR.shockwave;
      } else {
        effects.swirl(e.pos, e.cells, dur(DUR.swirl));
        ms = DUR.swirl;
      }
      // Getroffene Zellen kurz aufleuchten lassen
      e.cells.forEach(function (q) {
        var t = pieceAt(q);
        if (t && t !== p) {
          animate(t.body.firstChild, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], ms * 0.8);
        }
      });
      return wait(dur(ms * 0.75));
    }

    function playObstacles(group) {
      group.forEach(function (e) {
        var node;
        if (e.kind === 'glaze') {
          node = glazeEls[e.pos.r] && glazeEls[e.pos.r][e.pos.c];
          setGlaze(e.pos.r, e.pos.c, e.remaining);
          burstWhite(e.pos);
          if (node) { animate(node, [{ opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1.08)' },
            { opacity: 1, transform: tf(e.pos.r, e.pos.c) }], 200); }
        } else {
          node = lockEls[e.pos.r] && lockEls[e.pos.r][e.pos.c];
          setLock(e.pos.r, e.pos.c, e.remaining > 0);
          burstWhite(e.pos);
          if (node && e.remaining === 0) {
            animate(node, [
              { opacity: 1, transform: tf(e.pos.r, e.pos.c) },
              { opacity: 0, transform: tf(e.pos.r, e.pos.c) + ' scale(1.4) rotate(12deg)' }
            ], 260);
          }
        }
      });
      // Hindernisse brechen nebenbei; das nächste Ereignis muss nicht warten.
      return Promise.resolve();
    }

    function burstWhite(pos) {
      effects.burst(pos, '#ffffff', 6);
    }

    function playFell(e) {
      var jobs = [];
      e.moves.forEach(function (m) {
        if (ids[m.from.r][m.from.c] === m.id) { ids[m.from.r][m.from.c] = null; }
      });
      e.moves.forEach(function (m) {
        ids[m.to.r][m.to.c] = m.id;
        var p = pieces[m.id];
        if (p) { jobs.push(moveAnim(p, m.from, m.to, DUR.fell, 'ease-in')); }
      });
      return Promise.all(jobs);
    }

    function playSpawned(e) {
      var perColumn = {};
      e.candies.forEach(function (cd) {
        perColumn[cd.pos.c] = Math.max(perColumn[cd.pos.c] || 0, cd.pos.r + 1);
      });
      var jobs = [];
      e.candies.forEach(function (cd) {
        var p = pieces[cd.id] || makePiece(cd.id, cd.color, cd.special || null);
        ids[cd.pos.r][cd.pos.c] = cd.id;
        var from = { r: cd.pos.r - perColumn[cd.pos.c], c: cd.pos.c };
        jobs.push(moveAnim(p, from, cd.pos, DUR.spawned, 'ease-in'));
        jobs.push(animate(p.el, [{ opacity: 0 }, { opacity: 1 }], DUR.spawned * 0.6));
      });
      return Promise.all(jobs);
    }

    function playShuffled(e) {
      var jobs = [];
      var moved = e.candies.map(function (cd) {
        var p = pieces[cd.id];
        return { cd: cd, p: p, from: p ? { r: p.r, c: p.c } : null };
      });
      moved.forEach(function (m) {
        if (m.from && ids[m.from.r][m.from.c] === m.cd.id) { ids[m.from.r][m.from.c] = null; }
      });
      moved.forEach(function (m) {
        ids[m.cd.pos.r][m.cd.pos.c] = m.cd.id;
        if (!m.p) { return; }
        if (m.cd.color !== undefined) { setLook(m.p, m.cd.color, m.p.special); }
        var center = { r: (rows - 1) / 2, c: (cols - 1) / 2 };
        var mid = { r: (m.from.r + center.r) / 2, c: (m.from.c + center.c) / 2 };
        place(m.p, m.cd.pos.r, m.cd.pos.c);
        jobs.push(animate(m.p.el, [
          { transform: tf(m.from.r, m.from.c) }, { transform: tf(mid.r, mid.c) },
          { transform: tf(m.cd.pos.r, m.cd.pos.c) }
        ], DUR.shuffled, 'ease-in-out'));
        jobs.push(animate(m.p.body, [
          { transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(0.7) rotate(180deg)' },
          { transform: 'scale(1) rotate(360deg)' }
        ], DUR.shuffled, 'ease-in-out'));
      });
      return Promise.all(jobs);
    }

    // Spielt alle Ereignisse der Reihe nach. Gleichzeitig laufen nur Ereignisse, die im
    // Spiel im selben Augenblick passieren: aufeinanderfolgende `matched` (eine Stufe),
    // aufeinanderfolgende `specialCreated` (z. B. Farbball-Kombo) und Hindernis-Treffer.
    function runEvents(events) {
      var i = 0;
      var swapPending = null;

      function takeGroup(type) {
        var group = [];
        while (i < events.length && events[i].type === type) {
          RS.Audio.play(events[i]);
          group.push(events[i]);
          i++;
        }
        return group;
      }

      function step() {
        if (destroyed || i >= events.length) { return Promise.resolve(); }
        var e = events[i];
        var job;
        if (e.type === 'matched') { job = playMatched(takeGroup('matched')); }
        else if (e.type === 'specialCreated') { job = playCreated(takeGroup('specialCreated')); }
        else if (e.type === 'obstacleHit') { job = playObstacles(takeGroup('obstacleHit')); }
        else {
          RS.Audio.play(e);
          i++;
          if (e.type === 'swapped') {
            swapPending = e;
            job = playSwap(e.a, e.b, DUR.swap);
          } else if (e.type === 'swapRejected') {
            job = swapPending ? playSwap(e.b, e.a, DUR.rejected) : playNudge(e.a, e.b);
            swapPending = null;
          } else if (e.type === 'cascade') {
            job = e.stage > 1 ? wait(dur(DUR.stagePause)) : Promise.resolve();
          } else if (e.type === 'specialTriggered') { job = playTriggered(e); }
          else if (e.type === 'cleared') { job = playCleared(e); }
          else if (e.type === 'fell') { job = playFell(e); }
          else if (e.type === 'spawned') { job = playSpawned(e); }
          else if (e.type === 'shuffled') { job = playShuffled(e); }
          else { job = Promise.resolve(); }   // Sitzungs-Ereignisse: nur Ton
        }
        return job.then(step);
      }
      return step();
    }

    function play(events) {
      clearHint();
      var run = queue.then(function () {
        return runEvents(events || []);
      }).then(function () {
        if (!destroyed) { render(current); }
      }, function (err) {
        if (!destroyed) { render(current); }
        throw err;
      });
      queue = run.catch(function () {});
      return run;
    }

    // ---------- Eingabe ----------

    var drag = null;   // { id, start: Pos, x, y, cell, moved }

    function cellFromEvent(ev) {
      var rect = root.getBoundingClientRect();
      var cw = rect.width / cols;
      var ch = rect.height / rows;
      var c = Math.floor((ev.clientX - rect.left) / cw);
      var r = Math.floor((ev.clientY - rect.top) / ch);
      if (r < 0 || c < 0 || r >= rows || c >= cols) { return null; }
      return { pos: { r: r, c: c }, size: Math.min(cw, ch) };
    }

    function usable(pos) {
      return Boolean(pos && current.mask[pos.r][pos.c] && ids[pos.r][pos.c] !== null);
    }

    function select(pos) {
      selected = pos;
      refreshMarks();
    }

    function requestSwap(a, b) {
      select(null);
      if (swapHandler) { swapHandler({ r: a.r, c: a.c }, { r: b.r, c: b.c }); }
    }

    function onPointerDown(ev) {
      if (busy || (ev.button !== undefined && ev.button !== 0)) { return; }
      var hit = cellFromEvent(ev);
      if (!hit || !usable(hit.pos)) { drag = null; return; }
      ev.preventDefault();
      drag = { id: ev.pointerId, start: hit.pos, x: ev.clientX, y: ev.clientY, size: hit.size, moved: false };
      if (root.setPointerCapture) {
        try { root.setPointerCapture(ev.pointerId); } catch (err) { /* egal */ }
      }
    }

    function onPointerMove(ev) {
      if (!drag || drag.id !== ev.pointerId || drag.moved) { return; }
      if (pickHandler) { return; }
      if (busy) { drag = null; return; }
      var dx = ev.clientX - drag.x;
      var dy = ev.clientY - drag.y;
      var threshold = drag.size / 4;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) { return; }
      drag.moved = true;
      var target = Math.abs(dx) > Math.abs(dy)
        ? { r: drag.start.r, c: drag.start.c + (dx > 0 ? 1 : -1) }
        : { r: drag.start.r + (dy > 0 ? 1 : -1), c: drag.start.c };
      if (target.r < 0 || target.c < 0 || target.r >= rows || target.c >= cols) { return; }
      requestSwap(drag.start, target);
    }

    function onPointerUp(ev) {
      if (!drag || drag.id !== ev.pointerId) { return; }
      var d = drag;
      drag = null;
      if (busy || d.moved) { return; }
      var pos = d.start;
      if (pickHandler) {
        var up = cellFromEvent(ev);
        if (!up || up.pos.r !== pos.r || up.pos.c !== pos.c) { return; }   // anderswo losgelassen: abbrechen
        pickHandler({ r: pos.r, c: pos.c });
        return;
      }
      if (selected && selected.r === pos.r && selected.c === pos.c) { select(null); return; }
      if (selected && isNeighbor(selected, pos)) { requestSwap(selected, pos); return; }
      select(pos);
    }

    function onPointerCancel() { drag = null; }

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    // ---------- öffentliche Schnittstelle ----------

    function setBusy(value) {
      busy = Boolean(value);
      root.classList.toggle('is-busy', busy);
      if (busy) { drag = null; select(null); }
    }

    function setPicker(handler) {
      pickHandler = handler || null;
      root.classList.toggle('is-picking', Boolean(pickHandler));
      if (pickHandler) { select(null); }
    }

    function showHint(move) {
      hint = move ? { a: move.a, b: move.b } : null;
      refreshMarks();
    }

    function clearHint() {
      if (!hint) { return; }
      hint = null;
      refreshMarks();
    }

    function destroy() {
      destroyed = true;
      clearHint();
      effects.destroy();
      if (root.parentNode) { root.parentNode.removeChild(root); }
      pieces = {};
      swapHandler = null;
      pickHandler = null;
    }

    buildStatic(board);
    render(board);

    return {
      el: root,
      render: render,
      play: play,
      onSwap: function (handler) { swapHandler = handler; },
      setBusy: setBusy,
      setPicker: setPicker,
      isBusy: function () { return busy; },
      showHint: showHint,
      clearHint: clearHint,
      destroy: destroy
    };
  }

  RS.UI.BoardView = { create: create, DURATIONS: DUR };
})(window.RS = window.RS || {});
