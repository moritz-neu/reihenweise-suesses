(function (RS) {
  'use strict';

  // Abspielen der Mechanik-Ereignisse auf dem Spielfeld: Kirschen, Knallbonbons, Chamäleons,
  // Schokolade, Joker (Regenbogenstaub, Zauberbombe, Zuckerbesen, Feentausch) und Boss-Angriffe.
  // RS.UI.BoardView baut je Feld einen Kontext und reicht diese Ereignistypen hierher durch:
  //   ctx = { pieces, pieceAt(pos), pieceOf({ id, pos }), cellRect(pos), removePiece(id),
  //     setFuse(piece, n), setChameleon(piece, on), animate(node, frames, ms, easing), effects,
  //     el, setLook(piece, color, special), releaseCell(pos, id?), setObstacle(kind, pos, value) }
  // pieces ist id -> Bonbon der Ansicht ({ el, body, candy, fuseNum, r, c, color, special, fuse }).
  // create(ctx) liefert { Ereignistyp: play(e) -> Promise }, dazu fuseLost (Niederlage durch ein
  // Knallbonbon) und attackLanded (Boss-Angriff nach der Boss-Anzeige), die das Feld selbst einordnet.

  var el = RS.UI.el;

  // beam: Strahl des Zuckerbesens, so lang wie der eines Streifenbonbons
  var DUR = { cherry: 300, fuse: 220, explode: 560, shift: 360, rainbow: 560, bombed: 360, beam: 320, spread: 360 };

  var SPRING = 'cubic-bezier(.3,1.5,.5,1)';   // federt über das Ziel hinaus und zurück

  // Boss-Angriff: Farbe der Funken je Art; Eis und Glasur sprühen hellblau.
  var ATTACK_COLORS = { lock: '#6b4a5c', crate: '#c98a4b', choco: '#8a4a22', fuse: '#ff6a00', chameleon: null };

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Bei reduzierter Bewegung laufen alle Animationen fast ohne Dauer.
  function dur(ms) { return reducedMotion() ? 1 : ms; }

  function tf(r, c) { return 'translate(' + (c * 100) + '%,' + (r * 100) + '%)'; }

  function pause(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, dur(ms)); });
  }

  function create(ctx) {
    var effects = ctx.effects;
    var animate = ctx.animate;
    var pieceOf = ctx.pieceOf;

    // Kirsche eingesammelt: sie fällt unten aus dem Feld.
    function cherryCollected(e) {
      // Nur die Kirsche selbst: liegt ihre id nicht vor, bleibt das Bonbon der Zelle unberührt.
      var p = ctx.pieces[e.id];
      ctx.releaseCell(e.pos, e.id);
      effects.burst(e.pos, '#ff4d7a', 10);
      if (!p) { return Promise.resolve(); }
      var from = tf(e.pos.r, e.pos.c);
      var to = tf(e.pos.r + 1.3, e.pos.c);
      p.el.style.transform = to;
      p.el.style.opacity = '0';
      return animate(p.el, [{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], DUR.cherry, 'ease-in')
        .then(function () { ctx.removePiece(e.id); });
    }

    // Ein neues Knallbonbon oder Chamäleon springt kurz auf.
    function popIn(p) {
      return animate(p.body, [{ transform: 'scale(0.7)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        DUR.fuse, 'ease-out');
    }

    // Neue Zählerstände; ein Zähler, der sich ändert, hüpft kurz.
    function fuseTick(e) {
      e.cells.forEach(function (x) {
        var p = pieceOf(x);
        if (!p) { return; }
        ctx.setFuse(p, x.fuse);
        animate(p.fuseNum, [{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], DUR.fuse, SPRING);
      });
      return pause(DUR.fuse * 0.6);
    }

    function fuseSpawned(e) {
      var p = pieceOf(e);
      effects.burst(e.pos, '#ff9f43', 8);
      if (!p) { return Promise.resolve(); }
      ctx.setFuse(p, e.fuse);
      return popIn(p);
    }

    // Entschärft: Das Bonbon ist meist schon aufgelöst; Rauchwölkchen an der Zelle.
    function fuseDefused(e) {
      effects.burst(e.pos, '#d8d0e8', 10);
      effects.sparkle(e.pos);
      var p = ctx.pieces[e.id];
      if (p) { ctx.setFuse(p, undefined); }
      return Promise.resolve();
    }

    // Verloren durch ein Knallbonbon: jedes Bonbon mit Zähler 0 explodiert, das Feld wackelt.
    function fuseLost() {
      var pieces = ctx.pieces;
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
        jobs.push(animate(ctx.el, [
          { transform: 'translate(0,0)' }, { transform: 'translate(-1.5%,0.8%)' }, { transform: 'translate(1.5%,-0.8%)' },
          { transform: 'translate(-1%,0)' }, { transform: 'translate(0,0)' }
        ], DUR.explode, 'linear'));
      }
      return Promise.all(jobs);
    }

    // Chamäleon wechselt die Farbe: die alte Farbe blendet über der neuen aus.
    function chameleonShift(e) {
      var jobs = [];
      e.changes.forEach(function (x) {
        var p = pieceOf(x);
        if (!p) { return; }
        var ghost = null;
        if (p.color !== null && p.color !== undefined && p.color !== x.color) {
          ghost = el('div', 'candy bv-ghost');
          ghost.setAttribute('data-color', String(p.color));
          p.body.insertBefore(ghost, p.candy.nextSibling);
        }
        ctx.setLook(p, x.color, p.special);
        effects.burst(x.pos, x.color, 4);
        jobs.push(animate(p.candy, [{ opacity: 0 }, { opacity: 1 }], DUR.shift, 'ease-in-out'));
        if (ghost) {
          jobs.push(animate(ghost, [{ opacity: 1 }, { opacity: 0 }], DUR.shift, 'ease-in-out')
            .then(function () { if (ghost.parentNode) { ghost.parentNode.removeChild(ghost); } }));
        }
      });
      return Promise.all(jobs);
    }

    function chameleonSpawned(e) {
      var p = pieceOf(e);
      effects.sparkle(e.pos);
      if (!p) { return Promise.resolve(); }
      ctx.setChameleon(p, true);
      return popIn(p);
    }

    // Regenbogenstaub: ein Regenbogenband zieht über das Feld, die Bonbons der Farbe leuchten auf.
    function rainbow(e) {
      var pieces = ctx.pieces;
      var cells = [];
      Object.keys(pieces).forEach(function (id) {
        var p = pieces[id];
        if (p.color === e.color && ctx.pieceAt({ r: p.r, c: p.c }) === p) { cells.push({ r: p.r, c: p.c }); }
      });
      effects.sweep(cells, dur(DUR.rainbow));
      cells.forEach(function (q) {
        var t = ctx.pieceAt(q);
        if (t) { animate(t.body.firstChild, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.3 }], DUR.rainbow); }
      });
      return pause(DUR.rainbow * 0.8);
    }

    // Zauberbombe: Druckwelle mit Glitzer über das 3×3-Feld.
    function bombed(e) {
      effects.shockwave(e.pos, 1.8, dur(DUR.bombed));
      effects.glitter(e.pos, 40);
      return pause(DUR.bombed * 0.7);
    }

    // Zuckerbesen: ein Strahl fegt über die ganze Reihe.
    function swept(e) {
      effects.beam('h', e.row, null, dur(DUR.beam));
      return pause(DUR.beam * 0.75);
    }

    // Feentausch: Sternchen an beiden Zellen; der folgende Tausch läuft langsamer und federt.
    function fairySwap(e) {
      effects.sparkle(e.a);
      effects.sparkle(e.b);
      return pause(80);
    }

    // Schokolade breitet sich aus: Strang von Zelle zu Zelle, das Bonbon dort verschwindet.
    function chocoSpread(e) {
      effects.flow(e.from, e.to, DUR.spread);
      var p = pieceOf({ id: e.candyId, pos: e.to });
      var jobs = [];
      if (p) {
        ctx.releaseCell(e.to, e.candyId);
        jobs.push(animate(p.body, [{ transform: 'scale(1)' }, { transform: 'scale(0.1)' }], DUR.spread, 'ease-in')
          .then(function () { ctx.removePiece(e.candyId); }));
      }
      var node = ctx.setObstacle('choco', e.to, true);
      jobs.push(animate(node, [
        { opacity: 0, transform: tf(e.to.r, e.to.c) + ' scale(0.2)' },
        { opacity: 1, transform: tf(e.to.r, e.to.c) + ' scale(1)' }
      ], DUR.spread, 'ease-out'));
      return Promise.all(jobs);
    }

    // Boss-Angriff: Der Wurf ist gelandet (Boss-Anzeige), jetzt erscheinen die neuen Hindernisse.
    function attackLanded(e) {
      e.cells.forEach(function (p) {
        var piece = ctx.pieceAt(p);
        var color = ATTACK_COLORS.hasOwnProperty(e.kind) ? ATTACK_COLORS[e.kind] : '#bfeaff';
        effects.burst(p, color, 8);
        if (e.kind === 'fuse' || e.kind === 'chameleon') {
          // Das Bonbon bleibt; es bekommt Zündschnur und Zähler oder den Chamäleon-Rand.
          if (!piece) { return; }
          if (e.kind === 'fuse') { ctx.setFuse(piece, e.level); } else { ctx.setChameleon(piece, true); }
          animate(piece.body, [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 220, SPRING);
          return;
        }
        if (e.kind === 'crate' || e.kind === 'choco') {
          // Kiste oder Schokolade ersetzt das Bonbon der Zelle.
          var gone = ctx.releaseCell(p);
          if (gone !== null) { ctx.removePiece(gone); }
        }
        var kind = ['lock', 'glaze', 'crate', 'choco'].indexOf(e.kind) !== -1 ? e.kind : 'ice';
        var node = ctx.setObstacle(kind, p, kind === 'lock' || kind === 'choco' ? true : e.level);
        animate(node, [{ opacity: 0, transform: tf(p.r, p.c) + ' scale(1.5)' },
          { opacity: 1, transform: tf(p.r, p.c) + ' scale(1)' }], 220, SPRING);
      });
      return pause(160);
    }

    return {
      cherryCollected: cherryCollected,
      fuseTick: fuseTick,
      fuseSpawned: fuseSpawned,
      fuseDefused: fuseDefused,
      chameleonShift: chameleonShift,
      chameleonSpawned: chameleonSpawned,
      rainbow: rainbow,
      bombed: bombed,
      swept: swept,
      fairySwap: fairySwap,
      chocoSpread: chocoSpread,
      fuseLost: fuseLost,
      attackLanded: attackLanded
    };
  }

  RS.UI.BoardFx = { create: create, DURATIONS: DUR };
})(window.RS = window.RS || {});
