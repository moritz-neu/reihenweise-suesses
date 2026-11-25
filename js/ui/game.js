(function (RS) {
  'use strict';

  // Level-Spielbildschirm: HUD (Ziele, Züge, Punkte, Sternleiste), Spielfeld, Tipp nach
  // 5 s Ruhe, Ergebnis-Überlagerungen. RS.UI.GameKit enthält die Teile, die auch der
  // Endlos-Bildschirm nutzen kann (Tipp-Zeitgeber, Zug abspielen, Zahlen, Ziel-Symbole).

  var el = RS.UI.el;
  var HINT_DELAY = 5000;
  var COLOR_NAMES = ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Orange'];

  // ---------- Bausteine (wiederverwendbar) ----------

  function formatNumber(n) {
    return Math.round(n).toLocaleString('de-DE');
  }

  function goalLabel(g) {
    if (g.type === 'score') { return formatNumber(g.target) + ' Punkte'; }
    if (g.type === 'collect') { return g.target + '× ' + COLOR_NAMES[g.color]; }
    if (g.type === 'glaze') { return 'alle Glasur lösen'; }
    if (g.type === 'choco') { return 'alle Schokolade entfernen'; }
    if (g.type === 'crate') { return 'alle Kisten entfernen'; }
    if (g.type === 'cherry') { return g.target + '× Kirschen einsammeln'; }
    if (g.type === 'fuse') { return g.target + '× Knallbonbons entschärfen'; }
    if (g.type === 'boss') { return 'Boss besiegen'; }
    return '';
  }

  function goalIcon(g) {
    if (g.type === 'collect') {
      var candy = el('span', 'candy');
      candy.setAttribute('data-color', String(g.color));
      return candy;
    }
    if (g.type === 'glaze') { return el('span', 'hud-glaze-icon'); }
    if (g.type === 'choco') { return el('span', 'hud-choco-icon'); }
    if (g.type === 'crate') { return el('span', 'hud-crate-icon'); }
    if (g.type === 'cherry') { return el('span', 'hud-cherry-icon'); }
    if (g.type === 'fuse') { return el('span', 'hud-fuse-icon'); }
    if (g.type === 'boss') { return el('span', 'hud-boss-icon', '⚔'); }
    return el('span', 'hud-score-icon', '★');
  }

  // Tipp-Zeitgeber: nach HINT_DELAY ohne Eingabe zeigt die Ansicht einen möglichen Zug.
  // canShow() entscheidet, ob gerade ein Tipp passt (sonst wird neu gewartet).
  function createHint(view, getBoard, canShow) {
    var timer = 0;
    function stop() {
      if (timer) { clearTimeout(timer); timer = 0; }
      view.clearHint();
    }
    function fire() {
      timer = 0;
      if (!canShow() || view.isBusy()) { restart(); return; }
      var move = RS.Board.findPossibleMoves(getBoard())[0];
      if (move) { view.showHint(move); }
    }
    function restart() {
      stop();
      timer = setTimeout(fire, HINT_DELAY);
    }
    return { restart: restart, stop: stop };
  }

  // Spielt die Ereignisse eines Zugs ab. done(events) läuft danach auch dann, wenn die
  // Animation fehlschlägt (danach ist das Feld wieder frei); der Fehler wird dann
  // in der Konsole gemeldet, damit ein Darstellungsfehler nicht unbemerkt bleibt.
  function playMove(view, events, done) {
    view.setBusy(true);
    function finish() {
      view.setBusy(false);
      done(events);
    }
    return view.play(events).then(finish, function (err) {
      finish();
      if (window.console && console.error) { console.error('Animation fehlgeschlagen:', err); }
    });
  }

  // Baut das gemeinsame Gerüst eines Spielbildschirms und verdrahtet das Spielfeld:
  // Kopfzeile mit Zurück-Knopf (mit Rückfrage), HUD, Feld, Tipp-Zeitgeber, Zug ausführen
  // und abspielen; jede Eingabe startet die Tipp-Wartezeit neu.
  // opts = {
  //   className?, title, hud: Node, session,
  //   back: { label, confirmTitle, confirmText, stayLabel, leaveLabel, target },
  //   onMoved?(events): sofort nach dem Zug, vor dem Abspielen (auch wenn der Spieler
  //     während der Animation geht; z. B. zum Speichern eines Siegs)
  //   onFinished(events): nach dem Abspielen eines Zugs (nie nach teardown)
  //   footer?: Node, wird nach dem Spielfeld angehängt
  //   top?: Node, steht in einer Spalte direkt über dem Spielfeld (Boss-Leiste)
  // }
  // Danach startet der Tipp neu, solange die Sitzung läuft, sonst stoppt er.
  // Rückgabe { view, hint, section, playEvents(events), isDead(), teardown() }. teardown entfernt alle
  // Listener und Zeitgeber, die mountBoard angelegt hat, und zerstört das Feld.
  function mountBoard(root, opts) {
    var session = opts.session;
    var dead = false;

    var section = el('section', 'screen game' + (opts.className ? ' ' + opts.className : ''));
    // Lebendige Kulisse der Welt hinter dem Spiel (js/ui/ambient.js).
    if (opts.world) { section.classList.add('game--w' + opts.world); }
    if (opts.world && RS.UI.Ambient) {
      var amb = RS.UI.Ambient.gameLayer(opts.world);
      if (opts.className && opts.className.indexOf('game--boss') >= 0) { amb.classList.add('ambient--boss'); }
      section.appendChild(amb);
    }
    var head = el('header', 'game-head');
    var back = RS.UI.Back.mark(el('button', 'btn btn--ghost', opts.back.label));
    back.type = 'button';
    back.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.dialog({
        title: opts.back.confirmTitle,
        text: opts.back.confirmText,
        buttons: [
          { label: opts.back.stayLabel, className: 'btn--ghost' },
          { label: opts.back.leaveLabel, onClick: function () { RS.UI.show(opts.back.target, opts.back.params); } }
        ],
        onCancel: function () {}
      });
    });
    head.appendChild(back);
    head.appendChild(el('h1', 'screen-title', opts.title));
    head.appendChild(el('span', 'game-head-spacer'));
    section.appendChild(head);

    var layout = el('div', 'game-layout');
    layout.appendChild(opts.hud);
    var holder = el('div', 'game-board');
    if (opts.top) {
      var main = el('div', 'game-main');
      main.appendChild(opts.top);
      main.appendChild(holder);
      layout.appendChild(main);
    } else {
      layout.appendChild(holder);
    }
    section.appendChild(layout);
    if (opts.footer) { section.appendChild(opts.footer); }
    root.appendChild(section);

    var view = RS.UI.BoardView.create(holder, session.board);

    // Das Feld passt immer ganz auf den Bildschirm: Ragt der Inhalt unten über das sichtbare
    // Fenster (kleines Handy, Adressleiste, Zoom, Bossleiste, Joker-Leiste), wird das quadratische
    // Feld um genau so viel schmaler, höchstens bis 200 px. Läuft nach dem Aufbau, kurz danach
    // noch einmal und bei jeder Änderung der Fenstergröße oder der Anzeigen über dem Feld.
    var fitFrame = 0;
    function viewportHeight() {
      return window.visualViewport ? window.visualViewport.height : window.innerHeight;
    }
    function fitBoard() {
      fitFrame = 0;
      var b = holder.querySelector('.bv-board');
      if (!b || dead) { return; }
      b.style.width = '';
      var last = section.lastElementChild;
      var pad = parseFloat(getComputedStyle(section).paddingBottom) || 0;
      var bottom = last.getBoundingClientRect().bottom + window.scrollY + pad;
      var over = Math.ceil(bottom - viewportHeight());
      if (over > 0) {
        var w = b.getBoundingClientRect().width;
        b.style.width = Math.max(200, Math.floor(w - over)) + 'px';
      }
    }
    function scheduleFit() {
      if (!fitFrame) { fitFrame = requestAnimationFrame(fitBoard); }
    }
    window.addEventListener('resize', scheduleFit);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', scheduleFit); }
    var fitObserver = window.ResizeObserver ? new ResizeObserver(scheduleFit) : null;
    if (fitObserver) {
      fitObserver.observe(head);
      if (opts.hud) { fitObserver.observe(opts.hud); }
      if (opts.top) { fitObserver.observe(opts.top); }
      if (opts.footer) { fitObserver.observe(opts.footer); }
    }
    var fitLater = setTimeout(scheduleFit, 300);
    scheduleFit();
    function playing() { return !dead && session.status === 'playing'; }
    var hint = createHint(view, function () { return session.board; }, function () {
      return playing() && !RS.UI.isDialogOpen();
    });

    function finished(events) {
      if (dead) { return; }
      opts.onFinished(events);
      if (playing()) { hint.restart(); } else { hint.stop(); }
    }

    // Spielt Ereignisse ab, die nicht aus einem Tausch stammen (z. B. Zuckerhammer).
    function playEvents(events) {
      hint.stop();
      return playMove(view, events, finished);
    }

    // Lob für lange Kettenreaktionen: ab der dritten Kaskadenstufe ein kurzes Wort über dem Feld.
    var PRAISE = ['Super!', 'Klasse!', 'Zuckersüß!', 'Fantastisch!'];
    function praise(events) {
      var stage = 0;
      events.forEach(function (e) { if (e.type === 'cascade' && e.stage > stage) { stage = e.stage; } });
      if (stage < 3) { return; }
      var word = el('div', 'bv-praise', PRAISE[Math.min(stage - 3, PRAISE.length - 1)]);
      word.setAttribute('aria-hidden', 'true');
      setTimeout(function () {
        if (dead) { return; }
        holder.appendChild(word);
        setTimeout(function () { if (word.parentNode) { word.parentNode.removeChild(word); } }, 1400);
      }, 450);
    }

    view.onSwap(function (a, b) {
      if (!playing() || view.isBusy()) { return; }
      hint.stop();
      var events = RS.Session.move(session, a, b);
      praise(events);
      if (opts.onMoved) { opts.onMoved(events); }
      playMove(view, events, finished);
    });

    // Jede Eingabe löscht den Tipp und startet die Wartezeit neu.
    function onInput() {
      if (playing() && !view.isBusy()) { hint.restart(); }
    }
    section.addEventListener('pointerdown', onInput, true);
    document.addEventListener('keydown', onInput, true);

    function teardown() {
      if (dead) { return; }
      dead = true;
      hint.stop();
      window.removeEventListener('resize', scheduleFit);
      if (window.visualViewport) { window.visualViewport.removeEventListener('resize', scheduleFit); }
      if (fitObserver) { fitObserver.disconnect(); }
      clearTimeout(fitLater);
      if (fitFrame) { cancelAnimationFrame(fitFrame); fitFrame = 0; }
      section.removeEventListener('pointerdown', onInput, true);
      document.removeEventListener('keydown', onInput, true);
      view.destroy();
    }

    hint.restart();
    back.focus();
    return { view: view, hint: hint, section: section, playEvents: playEvents,
      isDead: function () { return dead; }, teardown: teardown };
  }

  RS.UI.GameKit = {
    HINT_DELAY: HINT_DELAY,
    formatNumber: formatNumber,
    goalLabel: goalLabel,
    goalIcon: goalIcon,
    createHint: createHint,
    playMove: playMove,
    mountBoard: mountBoard
  };

  // ---------- HUD ----------

  function createHud(level, goals, startScore) {
    var hud = el('aside', 'hud');
    hud.setAttribute('aria-label', 'Spielstand');

    var movesBox = el('div', 'hud-box hud-moves');
    movesBox.appendChild(el('span', 'hud-label', 'Züge'));
    var movesValue = el('span', 'hud-value', String(level.moves));
    movesBox.appendChild(movesValue);
    // Sternleiste nach übrigen Zügen: volle Leiste = alle Züge übrig.
    var need = RS.Goals.starMoves(level.moves);
    var bar = el('div', 'starbar');
    bar.setAttribute('aria-hidden', 'true');
    var fill = el('div', 'starbar-fill');
    bar.appendChild(fill);
    var marks = [
      { at: 0, el: null },
      { at: need[0], el: null },
      { at: need[1], el: null }
    ];
    marks.forEach(function (m, i) {
      m.el = el('span', 'starbar-mark', '★');
      m.el.style.left = Math.max(4, Math.min(100, m.at / level.moves * 100)) + '%';
      m.el.setAttribute('data-stars', String(i + 1));
      bar.appendChild(m.el);
    });
    movesBox.appendChild(bar);
    movesBox.appendChild(el('span', 'starbar-caption',
      '★★★ ab ' + need[1] + ' übrigen Zügen · ★★ ab ' + need[0]));
    hud.appendChild(movesBox);

    var scoreBox = el('div', 'hud-box hud-score');
    scoreBox.appendChild(el('span', 'hud-label', 'Punkte'));
    var scoreValue = el('span', 'hud-value', '0');
    scoreBox.appendChild(scoreValue);
    hud.appendChild(scoreBox);

    var sticksBox = el('div', 'hud-box hud-sticks');
    sticksBox.appendChild(el('span', 'hud-label', 'Zuckerstangen'));
    var sticksNode = RS.UI.Shop.balance(RS.App.save);
    sticksBox.appendChild(sticksNode);
    hud.appendChild(sticksBox);

    var goalsBox = el('div', 'hud-box hud-goals');
    goalsBox.appendChild(el('span', 'hud-label', 'Ziele'));
    var list = el('ul', 'hud-goal-list');
    var rows = goals.map(function (g) {
      var li = el('li', 'hud-goal');
      li.appendChild(goalIcon(g));
      var count = el('span', 'hud-goal-count');
      li.appendChild(count);
      li.title = goalLabel(g);
      list.appendChild(li);
      return { li: li, count: count };
    });
    goalsBox.appendChild(list);
    hud.appendChild(goalsBox);

    var status = el('p', 'sr-only');
    status.setAttribute('role', 'status');
    hud.appendChild(status);

    var allDone = false;

    function setGoals(list2) {
      allDone = list2.every(function (g) { return g.count >= g.target; });
      list2.forEach(function (g, i) {
        var row = rows[i];
        if (!row) { return; }
        row.count.textContent = g.type === 'score'
          ? formatNumber(g.count) + ' / ' + formatNumber(g.target)
          : g.count + ' / ' + g.target;
        row.li.classList.toggle('is-done', g.count >= g.target);
        row.li.setAttribute('aria-label', goalLabel(g) + ': ' + g.count + ' von ' + g.target);
      });
      marks[0].el.classList.toggle('is-on', allDone);
    }

    function setScore(score) {
      scoreValue.textContent = formatNumber(score);
    }

    function setMoves(n) {
      movesValue.textContent = String(n);
      movesBox.classList.toggle('is-low', n <= 5);
      fill.style.width = Math.max(0, Math.min(100, n / level.moves * 100)) + '%';
      // Marken 2 und 3 leuchten, solange diese Sterne noch erreichbar sind.
      marks[1].el.classList.toggle('is-on', n >= marks[1].at);
      marks[2].el.classList.toggle('is-on', n >= marks[2].at);
    }

    function setSticks() {
      var fresh = RS.UI.Shop.balance(RS.App.save);
      sticksBox.replaceChild(fresh, sticksNode);
      sticksNode = fresh;
    }

    function apply(events) {
      var said = [];
      events.forEach(function (e) {
        if (e.type === 'scoreChanged') { setScore(e.score); }
        else if (e.type === 'movesChanged') { setMoves(e.movesLeft); said.push(e.movesLeft + ' Züge übrig'); }
        else if (e.type === 'goalProgress') { setGoals(e.goals); }
      });
      if (said.length) { status.textContent = said[said.length - 1]; }
    }

    setGoals(goals);
    setScore(startScore);
    setMoves(level.moves);
    return { el: hud, apply: apply, setSticks: setSticks };
  }

  // ---------- Ergebnis-Überlagerungen ----------

  function resultBody(lines, annikaText, worldId) {
    var body = el('div', 'result');
    lines.forEach(function (l) { body.appendChild(l); });
    // Im Siegfenster hüpft der Bewohner der Welt vor Freude.
    if (worldId && RS.UI.Ambient) {
      body.insertAdjacentHTML('beforeend', RS.UI.Ambient.figure(worldId, 0, 'result-fig'));
    }
    body.appendChild(RS.UI.Dialog.annika(annikaText).node);
    return body;
  }

  function scoreLine(label, value) {
    var p = el('p', 'result-line');
    p.appendChild(document.createTextNode(label + ' '));
    p.appendChild(el('strong', null, value));
    return p;
  }

  function rewardLine(n) {
    var p = el('p', 'result-line result-reward');
    p.appendChild(RS.UI.Shop.stickIcon());
    p.appendChild(el('strong', null, '+' + n + ' Zuckerstangen'));
    return p;
  }

  RS.UI.GameKit.rewardLine = rewardLine;

  function showWin(level, won, reward) {
    if (RS.UI.Ambient) {
      if (level.isBoss) { RS.UI.Ambient.flash(); }
      RS.UI.Ambient.confetti(level.isBoss ? 90 : 46);
    }
    var stars = el('div', 'result-stars');
    stars.setAttribute('aria-label', won.stars + ' von 3 Sternen');
    stars.setAttribute('role', 'img');
    for (var s = 1; s <= 3; s++) {
      var star = el('span', 'result-star' + (s <= won.stars ? ' is-on' : ''), '★');
      star.style.animationDelay = (0.25 + s * 0.3) + 's';
      stars.appendChild(star);
    }
    var need = RS.Goals.starMoves(level.moves);
    var left = Math.round(won.bonus / RS.Goals.BONUS_PER_MOVE);
    var lines = [stars, scoreLine('Übrige Züge:', left + ' von ' + level.moves)];
    var rule = el('p', 'result-line result-rule',
      won.stars < 3
        ? 'Sterne gibt es für übrige Züge: ★★ ab ' + need[0] + ', ★★★ ab ' + need[1] + '.'
        : 'Alle drei Sterne – mindestens ' + need[1] + ' Züge übrig!');
    lines.push(rule);
    lines.push(scoreLine('Punkte:', formatNumber(won.score)));
    if (won.bonus > 0) { lines.push(scoreLine('davon Zugbonus:', '+' + formatNumber(won.bonus))); }
    if (reward > 0) { lines.push(rewardLine(reward)); }
    RS.UI.dialog({
      title: 'Level ' + level.label + ' geschafft!',
      className: 'dialog--result dialog--annika',
      body: resultBody(lines, level.win || '', level.world),
      // Nach dem Bosssieg spielt die Karte das Kapitelende und öffnet das Tor.
      buttons: [{ label: 'Zur Karte', className: 'btn--gold', back: true, onClick: function () {
        RS.Audio.play({ type: 'click' });
        RS.UI.show('map', mapParams(level));
      } }]
    });
  }

  // rescue (optional): { stock, use() } bietet „+5 Züge einsetzen“ an.
  // lost.reason 'fuse': ein Knallbonbon ist explodiert; die Rettung setzt auch alle Zähler hoch.
  function showLose(level, lost, rescue) {
    var fuse = lost.reason === 'fuse';
    var lines = [scoreLine('Punkte:', formatNumber(lost.score))];
    if (rescue) {
      lines.push(el('p', 'result-line', 'Du hast noch ' + rescue.stock + ' × +5 Züge.'));
      if (fuse) { lines.push(el('p', 'result-line result-rule', 'Dazu bekommt jedes Knallbonbon 5 Züge mehr.')); }
    }
    var buttons = [
      { label: 'Zur Karte', className: 'btn--ghost', back: true, onClick: function () { RS.UI.show('map', mapParams(level)); } },
      { label: 'Nochmal', className: rescue ? 'btn--ghost' : 'btn--gold', onClick: function () {
        RS.Audio.play({ type: 'click' });
        RS.UI.show('game', { levelId: level.id });
      } }
    ];
    if (rescue) {
      buttons.push({ label: '+5 Züge einsetzen und weiterspielen', className: 'btn--gold', onClick: function () {
        RS.Audio.play({ type: 'click' });
        rescue.use();
      } });
    }
    RS.UI.dialog({
      title: fuse ? 'Ein Knallbonbon ist explodiert!' : 'Keine Züge mehr',
      className: 'dialog--result dialog--annika',
      body: resultBody(lines, fuse
        ? 'Bumm, entschärfe die Knallbonbons, bevor ihr Zähler auf null fällt.'
        : 'Oh, so knapp! Atme kurz durch, dann klappt es beim nächsten Versuch.'),
      buttons: buttons,
      focus: buttons.length - 1
    });
  }

  // ---------- Joker-Leiste ----------

  // Eine Taste je eingeführtem Joker (RS.Jokers.available). Joker mit target 'cell' oder 'pair'
  // werden scharf geschaltet (immer nur einer), danach wählt ein Klick aufs Feld die Zelle
  // (beim Paar: erst eine Zelle, dann ihren Nachbarn).
  // ctl: { canUse(), useMoves(), toggle(kind) }; liefert { el, update(busy), setArmed(kind) }
  function createJokerBar(jokers, ctl) {
    var bar = el('div', 'joker-bar');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Joker');
    var buttons = {};
    var armed = null;
    jokers.forEach(function (j) {
      var btn = el('button', 'btn btn--ghost joker-btn');
      btn.type = 'button';
      btn.setAttribute('data-joker', j.kind);
      btn.title = j.text;
      btn.appendChild(RS.UI.Shop.jokerIcon(j.kind));
      var aimed = j.target === 'cell' || j.target === 'pair';
      if (aimed) { btn.setAttribute('aria-pressed', 'false'); }
      btn.appendChild(el('span', 'joker-name', j.name));
      var stock = el('span', 'joker-stock');
      btn.appendChild(stock);
      btn.addEventListener('click', function () {
        if (aimed) { ctl.toggle(j.kind); } else if (j.kind === 'moves') { ctl.useMoves(); }
      });
      bar.appendChild(btn);
      buttons[j.kind] = { btn: btn, stock: stock, name: j.name };
    });

    function update(busy) {
      var ok = ctl.canUse() && !busy;
      Object.keys(buttons).forEach(function (kind) {
        var n = RS.App.save.jokers[kind] || 0;
        var b = buttons[kind];
        b.stock.textContent = '×' + n;
        b.btn.setAttribute('aria-label', b.name + ', Vorrat ' + n);
        // Ein scharfer Joker bleibt bedienbar, damit ein zweiter Klick ihn wieder löst.
        b.btn.disabled = kind !== armed && (n < 1 || !ok);
      });
    }

    function setArmed(kind) {
      armed = kind || null;
      Object.keys(buttons).forEach(function (k) {
        if (!buttons[k].btn.hasAttribute('aria-pressed')) { return; }
        buttons[k].btn.classList.toggle('is-active', k === armed);
        buttons[k].btn.setAttribute('aria-pressed', k === armed ? 'true' : 'false');
      });
    }

    return { el: bar, update: update, setArmed: setArmed };
  }

  // ---------- Bildschirm ----------

  var introSeen = {};   // Boss-Intro nur beim ersten Versuch je Seitenladen

  // Karte nach dem Spielen: in der Welt des gespielten Levels.
  function mapParams(level) {
    return { world: level.world };
  }

  var active = null;   // Rückgabe von mountBoard
  var activeBoss = null;   // Boss-Leiste (RS.UI.BossView) in Bosslevels
  var onKey = null;    // Escape löst einen scharfen Joker

  function has(events, type) {
    return events.some(function (e) { return e.type === type; });
  }

  var REJECTIONS = ['smashRejected', 'blastRejected', 'jokerRejected', 'swapRejected'];

  // Ein abgelehnter Joker liefert nur das Ablehnungs-Ereignis (Feentausch: swapRejected).
  function rejected(events) {
    return !events.length || REJECTIONS.some(function (type) { return has(events, type); });
  }

  function mount(root, params) {
    var save = RS.App.save;
    var levelId = String(params.levelId);
    var level = RS.Worlds.level(levelId);
    if (!level || !(RS.Progress.isWon(save, levelId) || RS.Progress.isPlayable(save, levelId))) {
      // Unbekanntes oder gesperrtes Level: zurück zur Karte (nach dem aktuellen Wechsel)
      setTimeout(function () { RS.UI.show('map'); }, 0);
      return;
    }

    RS.Audio.music(level.world, { boss: level.isBoss });
    var session = RS.Session.startLevel(level);
    var hud = createHud(level, session.goals.goals, session.goals.score);

    // Ein Sieg wird sofort gespeichert, damit er auch bei Verlassen, Neuladen oder
    // Schließen während der Gewinn-Kaskade zählt; der Dialog folgt nach der Animation.
    var reward = 0;
    var armed = null;   // scharf geschalteter Joker mit Zielfeld
    var pairFirst = null;   // Feentausch: erste gewählte Zelle
    var bar = null;
    var boss = null;
    if (session.boss) {
      boss = RS.UI.BossView.create(document.createDocumentFragment(), session.boss,
        RS.BOSSES[session.boss.id], { cellRect: function (pos) { return active.view.cellRect(pos); } });
    }

    function moved(events) {
      var res = RS.Save.recordWin(RS.App.save, levelId, events);
      if (res) {
        reward = res.reward;
        // Sieg über den Boss der letzten Welt: die Krone gilt sofort (idempotent).
        RS.Progress.markComplete(RS.App.save);
        RS.App.persist();
        hud.setSticks();
      }
    }

    function canUse() {
      return Boolean(active) && !active.isDead() && session.status === 'playing' &&
        !RS.UI.isDialogOpen();
    }

    function busy() { return Boolean(active) && active.view.isBusy(); }

    function setArmed(kind) {
      armed = kind || null;
      pairFirst = null;
      if (active) { active.view.setPicker(armed ? pick : null); }
      if (bar) { bar.setArmed(armed); }
      refreshBar();
    }

    function refreshBar() {
      if (bar) { bar.update(busy()); }
      if (boss) { boss.setSpellEnabled(canUse() && !busy() && session.boss.charge >= RS.Boss.SPELL_MAX); }
    }

    // Während eine Aktion abläuft, sind Joker und Sternenzauber gesperrt.
    function lockControls() {
      bar.update(true);
      if (boss) { boss.setSpellEnabled(false); }
    }

    function castSpell() {
      if (!canUse() || busy()) { return; }
      var events = RS.Session.starSpell(session);
      if (!events.length) { return; }
      RS.Audio.play({ type: 'click' });
      setArmed(null);
      moved(events);
      lockControls();
      active.playEvents(events);
    }

    function useMoves() {
      if (!canUse() || busy() || RS.App.save.jokers.moves < 1) { return; }
      var events = RS.Session.addMoves(session, RS.Shop.EXTRA_MOVES);
      if (!events.length) { return; }
      RS.Audio.play({ type: 'jokerMoves' });
      RS.Shop.use(RS.App.save, 'moves');
      RS.App.persist();
      hud.apply(events);
      refreshBar();
    }

    function toggle(kind) {
      if (armed === kind) { setArmed(null); return; }
      if (!canUse() || busy() || (RS.App.save.jokers[kind] || 0) < 1) { return; }
      RS.Audio.play({ type: 'click' });
      setArmed(kind);
    }

    function adjacent(a, b) {
      return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
    }

    // Klick aufs Feld mit scharfem Joker: Hammer trifft die Zelle, Besen fegt ihre Reihe,
    // Regenbogenstaub nimmt die Farbe, Zauberbombe sprengt 3 × 3. Beim Feentausch wählt der
    // erste Klick eine Zelle, ein Klick auf ihren Nachbarn tauscht, jeder andere wählt neu.
    function pick(pos) {
      var kind = armed;
      if (!kind || !canUse() || busy() || (RS.App.save.jokers[kind] || 0) < 1) { return; }
      var target = pos;
      if (RS.Jokers.get(kind).target === 'pair') {
        if (pairFirst && pairFirst.r === pos.r && pairFirst.c === pos.c) { pairFirst = null; }
        else if (!pairFirst || !adjacent(pairFirst, pos)) { pairFirst = pos; }
        else { target = { a: pairFirst, b: pos }; pairFirst = null; }
        active.view.markPick(pairFirst);
        if (target === pos) { return; }
      }
      var events = RS.Session.useJoker(session, kind, target);
      if (rejected(events)) {
        // Joker bleibt scharf, nichts wird verbraucht
        if (events.length) { RS.Audio.play(events[0]); }
        return;
      }
      RS.Shop.use(RS.App.save, kind);
      RS.App.persist();
      moved(events);
      setArmed(null);
      lockControls();
      // Der Feentausch bekommt vorab sein eigenes Glitzern und seinen Ton.
      active.playEvents(target.a ? [{ type: 'fairySwap', a: target.a, b: target.b }].concat(events) : events);
    }

    function rescue() {
      if (!RS.Shop.use(RS.App.save, 'moves')) { return; }
      var events = RS.Session.addMoves(session, RS.Shop.EXTRA_MOVES);
      RS.Audio.play({ type: 'jokerMoves' });
      RS.App.persist();
      // Nach einem Knallbonbon-Verlust zeigt das Feld die hochgesetzten Zähler (fuseTick).
      if (has(events, 'fuseTick')) {
        lockControls();
        active.playEvents(events);
        return;
      }
      hud.apply(events);
      refreshBar();
      active.hint.restart();
    }

    function showResult(events) {
      events.forEach(function (e) {
        if (e.type === 'levelWon') {
          showWin(level, e, reward);
        } else if (e.type === 'levelLost') {
          var stock = RS.App.save.jokers.moves;
          showLose(level, e, stock >= 1 ? { stock: stock, use: rescue } : null);
        }
      });
      refreshBar();
    }

    // Im Bosslevel laufen nach der Animation erst die Szenen (je Phasenwechsel eine,
    // dann die Niederlage), danach das Ergebnis.
    function finished(events) {
      hud.apply(events);
      setArmed(null);
      var parts = [];
      if (boss) {
        events.forEach(function (e) { if (e.type === 'bossPhase') { parts.push('phase' + e.phase); } });
        if (has(events, 'levelWon')) { parts.push('defeat'); }
      }
      if (!parts.length) { showResult(events); return; }
      var me = active;
      refreshBar();
      boss.setSpellEnabled(false);
      parts.reduce(function (chain, part) {
        return chain.then(function () { return me.isDead() ? null : RS.UI.BossView.scene(session.boss.id, part); });
      }, Promise.resolve()).then(function () {
        if (!me.isDead()) { showResult(events); }
      });
    }

    bar = createJokerBar(RS.Jokers.available(save), { canUse: canUse, useMoves: useMoves, toggle: toggle });

    active = mountBoard(root, {
      title: 'Level ' + level.label,
      world: level.world,
      hud: hud.el,
      session: session,
      back: {
        label: 'Zurück zur Karte',
        confirmTitle: 'Level verlassen?',
        confirmText: 'Dein Fortschritt in diesem Level geht verloren.',
        stayLabel: 'Weiterspielen',
        leaveLabel: 'Zur Karte',
        target: 'map',
        params: mapParams(level)
      },
      footer: bar.el,
      top: boss ? boss.el : null,
      className: boss ? 'game--boss' : '',
      onMoved: function (events) { moved(events); lockControls(); },
      onFinished: finished
    });
    onKey = function (e) {
      if (e.key === 'Escape' && armed && !RS.UI.isDialogOpen()) { setArmed(null); }
    };
    document.addEventListener('keydown', onKey);
    refreshBar();
    if (boss) {
      activeBoss = boss;
      var me = active;
      boss.onSpell(castSpell);
      me.view.setEventHook(boss.play);
      // Vor dem ersten Zug: die Boss-Szene mit wechselnden Sprechern
      if (introSeen[session.boss.id]) { return; }
      introSeen[session.boss.id] = true;
      RS.UI.BossView.scene(session.boss.id, 'intro').then(function () {
        if (!me.isDead()) { refreshBar(); }
      });
    }
  }

  function unmount() {
    if (onKey) { document.removeEventListener('keydown', onKey); }
    if (active) { active.view.setPicker(null); active.teardown(); }
    if (activeBoss) { activeBoss.destroy(); }
    onKey = null;
    active = null;
    activeBoss = null;
  }

  RS.UI.screens.game = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
