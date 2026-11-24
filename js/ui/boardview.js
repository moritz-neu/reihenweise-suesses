(function (RS) {
  'use strict';

  // Spielfeld-Ansicht: zeichnet ein RS.Board, spielt Engine-Ereignisse als Animation ab
  // und meldet Tausch-Wünsche (Ziehen oder Klick-Klick).
  //
  // Aufbau (Ebenen von unten nach oben): Kacheln, Glasur, Schokolade, Lebkuchenkisten, Bonbons, Eis,
  // Lakritzgitter, Effekte. Kirsche, Knallbonbon und Chamäleon sind Attribute am Bonbon
  // (data-cherry, data-fuse, data-chameleon).
  // Jedes Element ist eine Zelle groß und wird per transform: translate(c*100%, r*100%)
  // platziert; so passt alles ohne Messen zu jeder Feldgröße.

  var el = RS.UI.el;

  var DUR = {
    swap: 150, rejected: 150, matched: 220, cleared: 220, created: 260,
    beam: 320, shockwave: 320, swirl: 420, fell: 200, spawned: 200, shuffled: 400, spread: 360,
    cherry: 300, fuse: 220, explode: 560, shift: 360, rainbow: 560, bombed: 360, fairy: 320,
    stagePause: 70
  };

  var FUSE_LOW = 3;   // ab hier pulsiert der Zähler rot

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
    var chocoLayer = el('div', 'bv-layer bv-chocos');
    var crateLayer = el('div', 'bv-layer bv-crates');
    var pieceLayer = el('div', 'bv-layer bv-pieces');
    var iceLayer = el('div', 'bv-layer bv-ices');
    var lockLayer = el('div', 'bv-layer bv-locks');
    root.appendChild(tiles);
    root.appendChild(glazeLayer);
    root.appendChild(chocoLayer);
    root.appendChild(crateLayer);
    root.appendChild(pieceLayer);
    root.appendChild(iceLayer);
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
    var iceEls = [];
    var chocoEls = [];
    var crateEls = [];

    var busy = false;
    var destroyed = false;   // nach destroy(): laufende Abspielung bricht ab
    var swapHandler = null;
    var pickHandler = null;  // gesetzt: Klick wählt eine Zelle aus, kein Tausch
    var selected = null;     // Pos der ersten angeklickten Zelle
    var hint = null;         // { a, b }
    var eventHook = null;    // spielt Ereignisse ab, die das Feld nicht kennt (z. B. Boss)
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
      iceLayer.innerHTML = '';
      chocoLayer.innerHTML = '';
      crateLayer.innerHTML = '';
      iceEls = grid(rows, cols, null);
      chocoEls = grid(rows, cols, null);
      crateEls = grid(rows, cols, null);
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
          var ic = el('div', 'bv-cell bv-ice');
          ic.style.transform = tf(r, c);
          iceLayer.appendChild(ic);
          iceEls[r][c] = ic;
          var cz = el('div', 'bv-cell bv-choco');
          cz.style.transform = tf(r, c);
          chocoLayer.appendChild(cz);
          chocoEls[r][c] = cz;
          var kx = el('div', 'bv-cell bv-crate');
          kx.style.transform = tf(r, c);
          crateLayer.appendChild(kx);
          crateEls[r][c] = kx;
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

    function setIce(r, c, level) {
      var n = iceEls[r] && iceEls[r][c];
      if (n) { n.setAttribute('data-level', String(level || 0)); }
    }

    function setChoco(r, c, on) {
      var n = chocoEls[r] && chocoEls[r][c];
      if (n) { n.setAttribute('data-on', on ? '1' : '0'); }
    }

    // Lebkuchenkiste: Stufe 0 (keine) bis 3.
    function setCrate(r, c, level) {
      var n = crateEls[r] && crateEls[r][c];
      if (n) { n.setAttribute('data-level', String(level || 0)); }
    }

    // cd: Bonbon oder Ereignis-Eintrag { color, special, cherry?, fuse?, chameleon? }
    function makePiece(id, cd) {
      var node = el('div', 'bv-cell bv-piece');
      node.setAttribute('data-id', String(id));
      var body = el('div', 'bv-body');
      var candy = el('div', 'candy');
      body.appendChild(el('div', 'bv-glow'));
      body.appendChild(candy);
      body.appendChild(el('div', 'bv-mark'));
      // Knallbonbon: Zündschnur und Zähler (nur sichtbar mit data-fuse)
      var fuse = el('div', 'bv-fuse');
      fuse.appendChild(el('span', 'bv-wick'));
      var num = el('span', 'bv-fuse-num');
      fuse.appendChild(num);
      body.appendChild(fuse);
      node.appendChild(body);
      pieceLayer.appendChild(node);
      var p = { el: node, body: body, candy: candy, fuseNum: num, r: -1, c: -1,
        color: undefined, special: undefined, fuse: undefined, cherry: false, chameleon: false };
      pieces[id] = p;
      setLook(p, cd.color, cd.special || null);
      setMarks(p, cd);
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

    // Kirsche, Knallbonbon-Zähler und Chamäleon-Rand als Attribute am Bonbon.
    function setMarks(p, cd) {
      setCherry(p, Boolean(cd.cherry));
      setFuse(p, cd.fuse);
      setChameleon(p, Boolean(cd.chameleon));
    }

    function setCherry(p, on) {
      if (p.cherry === on) { return; }
      p.cherry = on;
      if (on) { p.el.setAttribute('data-cherry', '1'); } else { p.el.removeAttribute('data-cherry'); }
    }

    // n: Zählerstand oder undefined (kein Knallbonbon)
    function setFuse(p, n) {
      if (n === null) { n = undefined; }
      if (p.fuse === n) { return; }
      p.fuse = n;
      if (n === undefined) {
        p.el.removeAttribute('data-fuse');
        p.el.classList.remove('is-fuse-low');
        return;
      }
      p.el.setAttribute('data-fuse', String(n));
      p.el.classList.toggle('is-fuse-low', n <= FUSE_LOW);
      p.fuseNum.textContent = String(n);
    }

    function setChameleon(p, on) {
      if (p.chameleon === on) { return; }
      p.chameleon = on;
      if (on) { p.el.setAttribute('data-chameleon', '1'); } else { p.el.removeAttribute('data-chameleon'); }
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
          setIce(r, c, b.ice ? b.ice[r][c] : 0);
          setChoco(r, c, b.choco ? b.choco[r][c] : false);
          setCrate(r, c, b.crate ? b.crate[r][c] : 0);
          var candy = b.mask[r][c] ? b.candies[r][c] : null;
          if (!candy) { continue; }
          var p = pieces[candy.id] || makePiece(candy.id, candy);
          setLook(p, candy.color, candy.special || null);
          setMarks(p, candy);
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

    // fairy: Feentausch, beide Bonbons heben sich dabei kurz an.
    function playSwap(a, b, ms, fairy) {
      var pa = pieceAt(a);
      var pb = pieceAt(b);
      swapIds(a, b);
      var jobs = [];
      if (pa) { pa.el.style.zIndex = '2'; jobs.push(moveAnim(pa, a, b, ms, 'ease-in-out')); }
      if (pb) { jobs.push(moveAnim(pb, b, a, ms, 'ease-in-out')); }
      if (fairy) {
        [pa, pb].forEach(function (p) {
          if (!p) { return; }
          jobs.push(animate(p.body, [{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(12deg)' },
            { transform: 'scale(1)' }], ms, 'ease-in-out'));
        });
      }
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
        } else if (e.kind === 'ice') {
          node = iceEls[e.pos.r] && iceEls[e.pos.r][e.pos.c];
          setIce(e.pos.r, e.pos.c, e.remaining);
          effects.splinter(e.pos, e.remaining === 0 ? 12 : 6);
          if (node) {
            animate(node, e.remaining === 0
              ? [{ opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1)' },
                 { opacity: 0, transform: tf(e.pos.r, e.pos.c) + ' scale(1.25)' }]
              : [{ opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1.1)' },
                 { opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1)' }], 240);
          }
        } else if (e.kind === 'crate') {
          node = crateEls[e.pos.r] && crateEls[e.pos.r][e.pos.c];
          setCrate(e.pos.r, e.pos.c, e.remaining);
          effects.crumble(e.pos, e.remaining === 0 ? 14 : 7);
          if (node) {
            animate(node, e.remaining === 0
              ? [{ opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1)' },
                 { opacity: 0, transform: tf(e.pos.r, e.pos.c) + ' scale(0.6) rotate(8deg)' }]
              : [{ opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' rotate(-6deg) scale(1.06)' },
                 { opacity: 1, transform: tf(e.pos.r, e.pos.c) }], 240);
          }
        } else if (e.kind === 'choco') {
          node = chocoEls[e.pos.r] && chocoEls[e.pos.r][e.pos.c];
          setChoco(e.pos.r, e.pos.c, false);
          effects.crumble(e.pos, 12);
          if (node) {
            animate(node, [
              { opacity: 1, transform: tf(e.pos.r, e.pos.c) + ' scale(1)' },
              { opacity: 0, transform: tf(e.pos.r, e.pos.c) + ' scale(0.5) rotate(-10deg)' }
            ], 260);
          }
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

    // Boss-Angriff: Der Wurf ist gelandet (eventHook), jetzt erscheinen die neuen Hindernisse.
    var ATTACK_COLORS = { lock: '#6b4a5c', crate: '#c98a4b', choco: '#8a4a22', fuse: '#ff6a00', chameleon: null };

    function showAttack(e) {
      e.cells.forEach(function (p) {
        var node;
        var piece = pieceAt(p);
        var color = ATTACK_COLORS.hasOwnProperty(e.kind) ? ATTACK_COLORS[e.kind] : '#bfeaff';
        effects.burst(p, color, 8);
        if (e.kind === 'fuse' || e.kind === 'chameleon') {
          // Das Bonbon bleibt; es bekommt Zündschnur und Zähler oder den Chamäleon-Rand.
          if (!piece) { return; }
          if (e.kind === 'fuse') { setFuse(piece, e.level); } else { setChameleon(piece, true); }
          animate(piece.body, [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 220,
            'cubic-bezier(.3,1.5,.5,1)');
          return;
        }
        if (e.kind === 'crate' || e.kind === 'choco') {
          // Kiste oder Schokolade ersetzt das Bonbon der Zelle.
          var gone = ids[p.r] && ids[p.r][p.c];
          if (gone !== null && gone !== undefined) { ids[p.r][p.c] = null; removePiece(gone); }
        }
        if (e.kind === 'lock') { setLock(p.r, p.c, true); node = lockEls[p.r] && lockEls[p.r][p.c]; }
        else if (e.kind === 'glaze') { setGlaze(p.r, p.c, e.level); node = glazeEls[p.r] && glazeEls[p.r][p.c]; }
        else if (e.kind === 'crate') { setCrate(p.r, p.c, e.level); node = crateEls[p.r] && crateEls[p.r][p.c]; }
        else if (e.kind === 'choco') { setChoco(p.r, p.c, true); node = chocoEls[p.r] && chocoEls[p.r][p.c]; }
        else { setIce(p.r, p.c, e.level); node = iceEls[p.r] && iceEls[p.r][p.c]; }
        if (node) {
          animate(node, [{ opacity: 0, transform: tf(p.r, p.c) + ' scale(1.5)' },
            { opacity: 1, transform: tf(p.r, p.c) + ' scale(1)' }], 220, 'cubic-bezier(.3,1.5,.5,1)');
        }
      });
      return wait(dur(160));
    }

    function burstWhite(pos) {
      effects.burst(pos, '#ffffff', 6);
    }

    // Schokolade breitet sich aus: Strang von Zelle zu Zelle, das Bonbon dort verschwindet.
    function playChocoSpread(e) {
      effects.flow(e.from, e.to, DUR.spread);
      var p = pieces[e.candyId] || pieceAt(e.to);
      if (p && ids[e.to.r] && ids[e.to.r][e.to.c] === e.candyId) { ids[e.to.r][e.to.c] = null; }
      var jobs = [];
      if (p) {
        jobs.push(animate(p.body, [{ transform: 'scale(1)' }, { transform: 'scale(0.1)' }], DUR.spread, 'ease-in')
          .then(function () { removePiece(e.candyId); }));
      }
      var node = chocoEls[e.to.r] && chocoEls[e.to.r][e.to.c];
      setChoco(e.to.r, e.to.c, true);
      if (node) {
        jobs.push(animate(node, [
          { opacity: 0, transform: tf(e.to.r, e.to.c) + ' scale(0.2)' },
          { opacity: 1, transform: tf(e.to.r, e.to.c) + ' scale(1)' }
        ], DUR.spread, 'ease-out'));
      }
      return Promise.all(jobs);
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
        var p = pieces[cd.id] || makePiece(cd.id, cd);
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

    // Kirsche eingesammelt: sie fällt unten aus dem Feld.
    function playCherry(e) {
      // Nur die Kirsche selbst: liegt ihre id nicht vor, bleibt das Bonbon der Zelle unberührt.
      var p = pieces[e.id];
      if (ids[e.pos.r] && ids[e.pos.r][e.pos.c] === e.id) { ids[e.pos.r][e.pos.c] = null; }
      effects.burst(e.pos, '#ff4d7a', 10);
      if (!p) { return Promise.resolve(); }
      var from = tf(e.pos.r, e.pos.c);
      var to = tf(e.pos.r + 1.3, e.pos.c);
      p.el.style.transform = to;
      p.el.style.opacity = '0';
      return animate(p.el, [{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], DUR.cherry, 'ease-in')
        .then(function () { removePiece(e.id); });
    }

    // Neue Zählerstände; ein Zähler, der sich ändert, hüpft kurz.
    function playFuseTick(e) {
      e.cells.forEach(function (x) {
        var p = pieces[x.id] || pieceAt(x.pos);
        if (!p) { return; }
        setFuse(p, x.fuse);
        animate(p.fuseNum, [{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], DUR.fuse,
          'cubic-bezier(.3,1.5,.5,1)');
      });
      return wait(dur(DUR.fuse * 0.6));
    }

    function playFuseSpawned(e) {
      var p = pieces[e.id] || pieceAt(e.pos);
      effects.burst(e.pos, '#ff9f43', 8);
      if (!p) { return Promise.resolve(); }
      setFuse(p, e.fuse);
      return animate(p.body, [{ transform: 'scale(0.7)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        DUR.fuse, 'ease-out');
    }

    // Entschärft: Das Bonbon ist meist schon aufgelöst; Rauchwölkchen an der Zelle.
    function playFuseDefused(e) {
      effects.burst(e.pos, '#d8d0e8', 10);
      effects.sparkle(e.pos);
      var p = pieces[e.id];
      if (p) { setFuse(p, undefined); }
      return Promise.resolve();
    }

    // Verloren durch ein Knallbonbon: jedes Bonbon mit Zähler 0 explodiert, das Feld wackelt.
    function playFuseExplosion() {
      var hits = Object.keys(pieces).map(function (id) { return pieces[id]; })
        .filter(function (p) { return p.fuse === 0; });
      var jobs = [];
      hits.forEach(function (p) {
        var pos = { r: p.r, c: p.c };
        effects.shockwave(pos, 2.2, dur(DUR.explode));
        effects.burst(pos, '#ff6a00', 24);
        effects.burst(pos, '#ffd24d', 16);
        jobs.push(animate(p.body, [
          { transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.3 }, { transform: 'scale(1)' }
        ], DUR.explode, 'ease-out'));
      });
      if (hits.length) {
        jobs.push(animate(root, [
          { transform: 'translate(0,0)' }, { transform: 'translate(-1.5%,0.8%)' }, { transform: 'translate(1.5%,-0.8%)' },
          { transform: 'translate(-1%,0)' }, { transform: 'translate(0,0)' }
        ], DUR.explode, 'linear'));
      }
      return Promise.all(jobs);
    }

    // Chamäleon wechselt die Farbe: die alte Farbe blendet über der neuen aus.
    function playChameleonShift(e) {
      var jobs = [];
      e.changes.forEach(function (x) {
        var p = pieces[x.id] || pieceAt(x.pos);
        if (!p) { return; }
        var ghost = null;
        if (p.color !== null && p.color !== undefined && p.color !== x.color) {
          ghost = el('div', 'candy bv-ghost');
          ghost.setAttribute('data-color', String(p.color));
          p.body.insertBefore(ghost, p.candy.nextSibling);
        }
        setLook(p, x.color, p.special);
        effects.burst(x.pos, x.color, 4);
        jobs.push(animate(p.candy, [{ opacity: 0 }, { opacity: 1 }], DUR.shift, 'ease-in-out'));
        if (ghost) {
          jobs.push(animate(ghost, [{ opacity: 1 }, { opacity: 0 }], DUR.shift, 'ease-in-out')
            .then(function () { if (ghost.parentNode) { ghost.parentNode.removeChild(ghost); } }));
        }
      });
      return Promise.all(jobs);
    }

    function playChameleonSpawned(e) {
      var p = pieces[e.id] || pieceAt(e.pos);
      effects.sparkle(e.pos);
      if (!p) { return Promise.resolve(); }
      setChameleon(p, true);
      return animate(p.body, [{ transform: 'scale(0.7)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        DUR.fuse, 'ease-out');
    }

    // Regenbogenstaub: ein Regenbogenband zieht über das Feld, die Bonbons der Farbe leuchten auf.
    function playRainbow(e) {
      var cells = [];
      Object.keys(pieces).forEach(function (id) {
        var p = pieces[id];
        if (p.color === e.color && pieceAt({ r: p.r, c: p.c }) === p) { cells.push({ r: p.r, c: p.c }); }
      });
      effects.sweep(cells, dur(DUR.rainbow));
      cells.forEach(function (q) {
        var t = pieceAt(q);
        if (t) { animate(t.body.firstChild, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.3 }], DUR.rainbow); }
      });
      return wait(dur(DUR.rainbow * 0.8));
    }

    // Zauberbombe: Druckwelle mit Glitzer über das 3×3-Feld.
    function playBombed(e) {
      effects.shockwave(e.pos, 1.8, dur(DUR.bombed));
      effects.glitter(e.pos, 40);
      return wait(dur(DUR.bombed * 0.7));
    }

    // Feentausch: Sternchen an beiden Zellen; der folgende Tausch läuft langsamer und federt.
    function playFairy(e) {
      effects.sparkle(e.a);
      effects.sparkle(e.b);
      return wait(dur(80));
    }

    // Spielt alle Ereignisse der Reihe nach. Gleichzeitig laufen nur Ereignisse, die im
    // Spiel im selben Augenblick passieren: aufeinanderfolgende `matched` (eine Stufe),
    // aufeinanderfolgende `specialCreated` (z. B. Farbball-Kombo) und Hindernis-Treffer.
    function runEvents(events) {
      var i = 0;
      var swapPending = null;
      var fairyPending = false;

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
          // Nach dem Feentausch klingt der Tausch selbst nicht noch einmal.
          if (!(e.type === 'swapped' && fairyPending)) { RS.Audio.play(e); }
          i++;
          if (e.type === 'fairySwap') {
            fairyPending = true;
            job = playFairy(e);
          } else if (e.type === 'swapped') {
            swapPending = e;
            job = fairyPending ? playSwap(e.a, e.b, DUR.fairy, true) : playSwap(e.a, e.b, DUR.swap);
            fairyPending = false;
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
          else if (e.type === 'chocoSpread') { job = playChocoSpread(e); }
          else if (e.type === 'cherryCollected') { job = playCherry(e); }
          else if (e.type === 'fuseTick') { job = playFuseTick(e); }
          else if (e.type === 'fuseSpawned') { job = playFuseSpawned(e); }
          else if (e.type === 'fuseDefused') { job = playFuseDefused(e); }
          else if (e.type === 'chameleonShift') { job = playChameleonShift(e); }
          else if (e.type === 'chameleonSpawned') { job = playChameleonSpawned(e); }
          else if (e.type === 'rainbow') { job = playRainbow(e); }
          else if (e.type === 'bombed') { job = playBombed(e); }
          else if (e.type === 'levelLost' && e.reason === 'fuse') { job = playFuseExplosion(); }
          else if (e.type === 'swept') {
            // Zuckerbesen: ein Strahl fegt über die ganze Reihe.
            effects.beam('h', e.row, null, dur(DUR.beam));
            job = wait(dur(DUR.beam * 0.75));
          }
          else {
            // Sitzungs-Ereignisse: Ton, dazu ggf. der eventHook (Boss-Anzeige)
            job = eventHook ? Promise.resolve(eventHook(e)) : Promise.resolve();
            if (e.type === 'bossAttack') { job = job.then(function () { return showAttack(e); }); }
          }
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
      // Mit scharfem Joker zählt jede Feldzelle (auch Kiste oder Schokolade), sonst nur Bonbons.
      var ok = hit && (pickHandler ? current.mask[hit.pos.r][hit.pos.c] : usable(hit.pos));
      if (!ok) { drag = null; return; }
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
      // Scharf schalten wie lösen hebt jede Markierung auf (auch das erste Feld des Feentauschs),
      // sonst würde ein Klick auf den Nachbarn danach einen echten Zug auslösen.
      select(null);
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

    // Lage einer Zelle im Fenster (für Effekte außerhalb des Felds)
    function cellRect(pos) {
      var rect = root.getBoundingClientRect();
      var w = rect.width / cols;
      var h = rect.height / rows;
      return { left: rect.left + pos.c * w, top: rect.top + pos.r * h, width: w, height: h };
    }

    function destroy() {
      destroyed = true;
      eventHook = null;
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
      setEventHook: function (fn) { eventHook = fn || null; },
      cellRect: cellRect,
      setBusy: setBusy,
      setPicker: setPicker,
      // Markiert eine Zelle (erstes Feld beim Feentausch); null hebt die Markierung auf.
      markPick: function (pos) { select(pos ? { r: pos.r, c: pos.c } : null); },
      isBusy: function () { return busy; },
      showHint: showHint,
      clearHint: clearHint,
      destroy: destroy
    };
  }

  RS.UI.BoardView = { create: create, DURATIONS: DUR };
})(window.RS = window.RS || {});
