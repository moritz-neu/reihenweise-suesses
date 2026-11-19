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
    return '';
  }

  function goalIcon(g) {
    if (g.type === 'collect') {
      var candy = el('span', 'candy');
      candy.setAttribute('data-color', String(g.color));
      return candy;
    }
    if (g.type === 'glaze') { return el('span', 'hud-glaze-icon'); }
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
  // }
  // Danach startet der Tipp neu, solange die Sitzung läuft, sonst stoppt er.
  // Rückgabe { view, hint, section, playEvents(events), isDead(), teardown() }. teardown entfernt alle
  // Listener und Zeitgeber, die mountBoard angelegt hat, und zerstört das Feld.
  function mountBoard(root, opts) {
    var session = opts.session;
    var dead = false;

    var section = el('section', 'screen game' + (opts.className ? ' ' + opts.className : ''));
    var head = el('header', 'game-head');
    var back = el('button', 'btn btn--ghost', opts.back.label);
    back.type = 'button';
    back.addEventListener('click', function () {
      RS.Audio.play({ type: 'click' });
      RS.UI.dialog({
        title: opts.back.confirmTitle,
        text: opts.back.confirmText,
        buttons: [
          { label: opts.back.stayLabel, className: 'btn--ghost' },
          { label: opts.back.leaveLabel, onClick: function () { RS.UI.show(opts.back.target); } }
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
    layout.appendChild(holder);
    section.appendChild(layout);
    if (opts.footer) { section.appendChild(opts.footer); }
    root.appendChild(section);

    var view = RS.UI.BoardView.create(holder, session.board);
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

    view.onSwap(function (a, b) {
      if (!playing() || view.isBusy()) { return; }
      hint.stop();
      var events = RS.Session.move(session, a, b);
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

  function createHud(level, goals) {
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
    setScore(0);
    setMoves(level.moves);
    return { el: hud, apply: apply, setSticks: setSticks };
  }

  // ---------- Ergebnis-Überlagerungen ----------

  function resultBody(lines, annikaText) {
    var body = el('div', 'result');
    lines.forEach(function (l) { body.appendChild(l); });
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

  function showWin(levelId, won, reward) {
    var stars = el('div', 'result-stars');
    stars.setAttribute('aria-label', won.stars + ' von 3 Sternen');
    stars.setAttribute('role', 'img');
    for (var s = 1; s <= 3; s++) {
      var star = el('span', 'result-star' + (s <= won.stars ? ' is-on' : ''), '★');
      star.style.animationDelay = (0.25 + s * 0.3) + 's';
      stars.appendChild(star);
    }
    var level = RS.LEVELS[levelId - 1];
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
    var story = RS.STORY.levels[levelId] || {};
    RS.UI.dialog({
      title: 'Level ' + levelId + ' geschafft!',
      className: 'dialog--result dialog--annika',
      body: resultBody(lines, story.win || ''),
      buttons: [{ label: 'Zur Karte', className: 'btn--gold', onClick: function () {
        RS.Audio.play({ type: 'click' });
        var save = RS.App.save;
        if (levelId === RS.LEVELS.length && !save.finaleSeen) {
          RS.UI.Dialog.say(RS.STORY.finale, { skippable: true }).then(function () {
            RS.App.save.finaleSeen = true;
            RS.App.persist();
            RS.UI.show('map');
          });
        } else {
          RS.UI.show('map');
        }
      } }]
    });
  }

  // rescue (optional): { stock, use() } bietet „+5 Züge einsetzen“ an.
  function showLose(levelId, lost, rescue) {
    var lines = [scoreLine('Punkte:', formatNumber(lost.score))];
    if (rescue) {
      lines.push(el('p', 'result-line', 'Du hast noch ' + rescue.stock + ' × +5 Züge.'));
    }
    var buttons = [
      { label: 'Zur Karte', className: 'btn--ghost', onClick: function () { RS.UI.show('map'); } },
      { label: 'Nochmal', className: rescue ? 'btn--ghost' : 'btn--gold', onClick: function () {
        RS.Audio.play({ type: 'click' });
        RS.UI.show('game', { levelId: levelId });
      } }
    ];
    if (rescue) {
      buttons.push({ label: '+5 Züge einsetzen und weiterspielen', className: 'btn--gold', onClick: function () {
        RS.Audio.play({ type: 'click' });
        rescue.use();
      } });
    }
    RS.UI.dialog({
      title: 'Keine Züge mehr',
      className: 'dialog--result dialog--annika',
      body: resultBody(lines,
        'Oh, so knapp! Atme kurz durch, dann klappt es beim nächsten Versuch.'),
      buttons: buttons,
      focus: buttons.length - 1
    });
  }

  // ---------- Joker-Leiste ----------

  // ctl: { canUse(), useMoves(), toggleHammer() }; liefert { el, update(busy), setHammer(on) }
  function createJokerBar(ctl) {
    var bar = el('div', 'joker-bar');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Joker');
    var buttons = {};
    RS.Shop.JOKERS.forEach(function (kind) {
      var info = RS.UI.Shop.jokerInfo[kind];
      var btn = el('button', 'btn btn--ghost joker-btn');
      btn.type = 'button';
      btn.setAttribute('data-joker', kind);
      btn.title = info.text;
      btn.appendChild(RS.UI.Shop.jokerIcon(kind));
      if (kind === 'hammer') { btn.setAttribute('aria-pressed', 'false'); }
      btn.appendChild(el('span', 'joker-name', info.name));
      var stock = el('span', 'joker-stock');
      btn.appendChild(stock);
      btn.addEventListener('click', function () {
        if (kind === 'moves') { ctl.useMoves(); } else { ctl.toggleHammer(); }
      });
      bar.appendChild(btn);
      buttons[kind] = { btn: btn, stock: stock };
    });

    function update(busy) {
      var ok = ctl.canUse() && !busy;
      RS.Shop.JOKERS.forEach(function (kind) {
        var n = RS.App.save.jokers[kind];
        var b = buttons[kind];
        b.stock.textContent = '×' + n;
        b.btn.setAttribute('aria-label', RS.UI.Shop.jokerInfo[kind].name + ', Vorrat ' + n);
        b.btn.disabled = n < 1 || !ok;
      });
    }

    function setHammer(on) {
      buttons.hammer.btn.classList.toggle('is-active', on);
      buttons.hammer.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    return { el: bar, update: update, setHammer: setHammer };
  }

  // ---------- Bildschirm ----------

  var active = null;   // Rückgabe von mountBoard

  function mount(root, params) {
    var levelId = Number(params.levelId);
    var level = RS.LEVELS[levelId - 1];
    if (!level || levelId > RS.App.save.unlocked) {
      // Unbekanntes oder gesperrtes Level: zurück zur Karte (nach dem aktuellen Wechsel)
      setTimeout(function () { RS.UI.show('map'); }, 0);
      return;
    }

    var session = RS.Session.startLevel(level);
    var hud = createHud(level, session.goals.goals);

    // Ein Sieg wird sofort gespeichert, damit er auch bei Verlassen, Neuladen oder
    // Schließen während der Gewinn-Kaskade zählt; der Dialog folgt nach der Animation.
    var reward = 0;
    var hammerOn = false;
    var bar = null;

    function moved(events) {
      var res = RS.Save.recordWin(RS.App.save, levelId, events);
      if (res) {
        reward = res.reward;
        RS.App.persist();
        hud.setSticks();
      }
    }

    function canUse() {
      return Boolean(active) && !active.isDead() && session.status === 'playing' &&
        !RS.UI.isDialogOpen();
    }

    function setHammer(on) {
      hammerOn = on;
      if (active) { active.view.setPicker(on ? pick : null); }
      if (bar) { bar.setHammer(on); }
    }

    function refreshBar() {
      if (bar) { bar.update(Boolean(active) && active.view.isBusy()); }
    }

    function useMoves() {
      if (!canUse() || active.view.isBusy() || RS.App.save.jokers.moves < 1) { return; }
      var events = RS.Session.addMoves(session, RS.Shop.EXTRA_MOVES);
      if (!events.length) { return; }
      RS.Audio.play({ type: 'click' });
      RS.Shop.use(RS.App.save, 'moves');
      RS.App.persist();
      hud.apply(events);
      refreshBar();
    }

    function toggleHammer() {
      if (hammerOn) { setHammer(false); return; }
      if (!canUse() || active.view.isBusy() || RS.App.save.jokers.hammer < 1) { return; }
      RS.Audio.play({ type: 'click' });
      setHammer(true);
    }

    function pick(pos) {
      if (!canUse() || active.view.isBusy() || RS.App.save.jokers.hammer < 1) { return; }
      var events = RS.Session.smash(session, pos);
      if (!events.length || events.some(function (e) { return e.type === 'smashRejected'; })) {
        return;   // Hammer bleibt aktiv, nichts wird verbraucht
      }
      RS.Shop.use(RS.App.save, 'hammer');
      RS.App.persist();
      moved(events);
      setHammer(false);
      bar.update(true);
      active.playEvents(events);
    }

    function rescue() {
      if (!RS.Shop.use(RS.App.save, 'moves')) { return; }
      var events = RS.Session.addMoves(session, RS.Shop.EXTRA_MOVES);
      RS.App.persist();
      hud.apply(events);
      refreshBar();
      active.hint.restart();
    }

    function finished(events) {
      hud.apply(events);
      setHammer(false);
      events.forEach(function (e) {
        if (e.type === 'levelWon') {
          showWin(levelId, e, reward);
        } else if (e.type === 'levelLost') {
          var stock = RS.App.save.jokers.moves;
          showLose(levelId, e, stock >= 1 ? { stock: stock, use: rescue } : null);
        }
      });
      refreshBar();
    }

    bar = createJokerBar({ canUse: canUse, useMoves: useMoves, toggleHammer: toggleHammer });

    active = mountBoard(root, {
      title: 'Level ' + levelId,
      hud: hud.el,
      session: session,
      back: {
        label: 'Zurück zur Karte',
        confirmTitle: 'Level verlassen?',
        confirmText: 'Dein Fortschritt in diesem Level geht verloren.',
        stayLabel: 'Weiterspielen',
        leaveLabel: 'Zur Karte',
        target: 'map'
      },
      footer: bar.el,
      onMoved: function (events) { moved(events); bar.update(true); },
      onFinished: finished
    });
    refreshBar();
  }

  function unmount() {
    if (active) { active.view.setPicker(null); active.teardown(); }
    active = null;
  }

  RS.UI.screens.game = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
