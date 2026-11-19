(function (RS) {
  'use strict';

  // Endlos-Bildschirm: Zeitleiste, Punkte, Rekord, Spielfeld, Tipp nach 5 s Ruhe.
  // Die Uhr läuft über requestAnimationFrame und ruft RS.Session.tick auf. Sie hält an,
  // solange ein Zug abgespielt wird, ein Dialog offen ist oder der Tab verborgen ist.

  var el = RS.UI.el;
  var Kit = RS.UI.GameKit;
  var MAX_DT = 0.25;   // Sekunden: ein hängender Frame frisst nie mehr Zeit als das
  var LOW_TIME = 10;   // Sekunden: darunter wird die Zeitleiste zur Warnung

  // ---------- HUD ----------

  function createHud(session, best) {
    var hud = el('aside', 'hud hud--endless');
    hud.setAttribute('aria-label', 'Spielstand');

    var timeBox = el('div', 'hud-box hud-time');
    var timeHead = el('div', 'hud-time-head');
    timeHead.appendChild(el('span', 'hud-label', 'Zeit'));
    var timeValue = el('span', 'hud-time-value');
    timeHead.appendChild(timeValue);
    timeBox.appendChild(timeHead);
    var bar = el('div', 'timebar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Verbleibende Zeit in Sekunden');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(session.max));
    var fill = el('div', 'timebar-fill');
    bar.appendChild(fill);
    timeBox.appendChild(bar);
    hud.appendChild(timeBox);

    var scoreBox = el('div', 'hud-box hud-score');
    scoreBox.appendChild(el('span', 'hud-label', 'Punkte'));
    var scoreValue = el('span', 'hud-value', Kit.formatNumber(session.score));
    scoreBox.appendChild(scoreValue);
    hud.appendChild(scoreBox);

    var bestBox = el('div', 'hud-box hud-best');
    bestBox.appendChild(el('span', 'hud-label', 'Rekord'));
    bestBox.appendChild(el('span', 'hud-value', Kit.formatNumber(best)));
    hud.appendChild(bestBox);

    var shownSeconds = -1;

    function setTime(time, max) {
      fill.style.width = Math.max(0, Math.min(100, time / max * 100)) + '%';
      var low = time < LOW_TIME;
      timeBox.classList.toggle('is-low', low);
      var seconds = Math.ceil(time);
      if (seconds !== shownSeconds) {
        shownSeconds = seconds;
        timeValue.textContent = seconds + ' s';
        bar.setAttribute('aria-valuenow', String(seconds));
      }
    }

    function apply(events) {
      events.forEach(function (e) {
        if (e.type === 'scoreChanged') { scoreValue.textContent = Kit.formatNumber(e.score); }
        else if (e.type === 'timeChanged') { setTime(e.time, e.max); }
      });
    }

    setTime(session.time, session.max);
    return { el: hud, apply: apply };
  }

  // ---------- Ergebnis ----------

  function showOver(score, previousBest, reward) {
    var record = score > previousBest;
    var body = el('div', 'result');
    var line = el('p', 'result-line');
    line.appendChild(document.createTextNode('Punkte: '));
    line.appendChild(el('strong', null, Kit.formatNumber(score)));
    body.appendChild(line);
    if (record) {
      body.appendChild(el('p', 'result-record', 'Neuer Rekord!'));
    } else {
      var bestLine = el('p', 'result-line');
      bestLine.appendChild(document.createTextNode('Dein Rekord: '));
      bestLine.appendChild(el('strong', null, Kit.formatNumber(previousBest)));
      body.appendChild(bestLine);
    }
    if (reward > 0) { body.appendChild(Kit.rewardLine(reward)); }
    body.appendChild(RS.UI.Dialog.annika(record
      ? 'So hell hat Kandishain lange nicht geleuchtet!'
      : 'Die Zeit ist um. Noch eine Runde?').node);
    RS.UI.dialog({
      title: 'Zeit abgelaufen',
      className: 'dialog--result dialog--annika',
      body: body,
      buttons: [
        { label: 'Menü', className: 'btn--ghost', onClick: function () {
          RS.Audio.play({ type: 'click' });
          RS.UI.show('menu');
        } },
        { label: 'Nochmal', className: 'btn--gold', onClick: function () {
          RS.Audio.play({ type: 'click' });
          RS.UI.show('endless');
        } }
      ],
      focus: 1
    });
  }

  // ---------- Bildschirm ----------

  var active = null;   // { board: Rückgabe von mountBoard, stopClock, onVisibility }

  function mount(root) {
    var session = RS.Session.startEndless(Date.now() % 1e9);
    var previousBest = RS.App.save.endlessHighscore;
    var hud = createHud(session, previousBest);
    var last = null;   // Zeitstempel des letzten gezählten Frames; null = neu ansetzen
    var frameId = 0;

    var board = Kit.mountBoard(root, {
      className: 'endless',
      title: 'Endlos',
      hud: hud.el,
      session: session,
      back: {
        label: 'Zurück zum Menü',
        confirmTitle: 'Runde beenden?',
        confirmText: 'Deine Punkte aus dieser Runde zählen dann nicht.',
        stayLabel: 'Weiterspielen',
        leaveLabel: 'Zum Menü',
        target: 'menu'
      },
      onFinished: function (events) {
        hud.apply(events);
        last = null;   // die Zeit des Abspielens zählt nicht
      }
    });
    var view = board.view;

    function stopClock() {
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      last = null;
    }

    function gameOver(score) {
      stopClock();
      board.hint.stop();
      var reward = RS.Save.recordEndless(RS.App.save, score);
      RS.App.persist();
      showOver(score, previousBest, reward);
    }

    function paused() {
      return view.isBusy() || document.hidden || RS.UI.isDialogOpen();
    }

    function frame(now) {
      frameId = 0;
      if (board.isDead() || session.status !== 'playing') { return; }
      if (paused() || last === null) {
        last = paused() ? null : now;
      } else {
        var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
        last = now;
        var events = RS.Session.tick(session, dt);
        hud.apply(events);
        var over = events.filter(function (e) { return e.type === 'endlessOver'; })[0];
        if (over) { gameOver(over.score); return; }
      }
      frameId = requestAnimationFrame(frame);
    }

    // Nach dem Zurückkehren in den Tab zählt die Uhr ab dem nächsten Frame neu.
    function onVisibility() { last = null; }
    document.addEventListener('visibilitychange', onVisibility);

    active = { board: board, stopClock: stopClock, onVisibility: onVisibility };
    frameId = requestAnimationFrame(frame);
  }

  function unmount() {
    var state = active;
    active = null;
    if (!state) { return; }
    state.stopClock();
    document.removeEventListener('visibilitychange', state.onVisibility);
    state.board.teardown();
  }

  RS.UI.screens.endless = { mount: mount, unmount: unmount };
})(window.RS = window.RS || {});
