(function (RS) {
  'use strict';

  // Bildschirm-Verwaltung: Jeder Bildschirm registriert sich als
  // RS.UI.screens[name] = { mount(root, params), unmount() }.
  // RS.UI.show(name, params) zeigt genau einen Bildschirm an.

  var root = null;
  var current = null;   // { name, screen }
  var listeners = [];   // laufen nach jedem Bildschirmwechsel und jedem Öffnen/Schließen eines Dialogs

  function onChange(fn) { listeners.push(fn); }
  function changed() { listeners.forEach(function (fn) { fn(); }); }

  function init(rootEl) {
    root = rootEl;
  }

  function show(name, params) {
    var screen = RS.UI.screens[name];
    if (!screen) { throw new Error('Unbekannter Bildschirm: ' + name); }
    closeDialog();
    if (current && current.screen.unmount) { current.screen.unmount(); }
    root.innerHTML = '';
    root.setAttribute('data-screen', name);
    current = { name: name, screen: screen };
    screen.mount(root, params || {});
    window.scrollTo(0, 0);
    changed();
  }

  function currentName() {
    return current ? current.name : null;
  }

  // Kleiner DOM-Helfer: el('button', 'btn', 'Text')
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  // ---------- Dialog im Spiel (statt window.confirm/alert) ----------

  var openDialog = null;   // { overlay, onKey, onClose, previousFocus }

  // opts = {
  //   title, text?, body?: Node (eigener Inhalt unter dem Text), className?: zusätzliche
  //   Klasse am Dialogkasten, buttons: [{ label, className?, onClick?, keepOpen? }],
  //   focus?: Index des Knopfs, der den Fokus bekommt (Standard 0),
  //   ein Knopf mit back: true ist der, den die Zurück-Taste (Android) drückt,
  //   onCancel?, onClose?
  // }
  // Ein Klick auf einen Knopf schließt den Dialog und ruft dann onClick auf
  // (mit keepOpen: true bleibt er offen, nur onClick läuft).
  // Escape oder ein Klick neben den Dialog ruft onCancel auf. Ein Dialog OHNE onCancel
  // ignoriert Escape und Klicks neben den Dialog: er schließt nur über seine Knöpfe.
  // onClose läuft bei jedem Schließen, auch wenn ein anderer Dialog oder ein
  // Bildschirmwechsel ihn verdrängt.
  // Solange ein Dialog offen ist, ist #app `inert`: nichts dahinter ist bedienbar.
  function dialog(opts) {
    closeDialog();
    var overlay = el('div', 'overlay');
    var box = el('div', 'dialog' + (opts.className ? ' ' + opts.className : ''));
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    var title = el('h2', 'dialog-title', opts.title);
    title.id = 'rs-dialog-title';
    box.setAttribute('aria-labelledby', title.id);
    box.appendChild(title);

    if (opts.text) {
      var text = el('p', 'dialog-text', opts.text);
      text.id = 'rs-dialog-text';
      box.setAttribute('aria-describedby', text.id);
      box.appendChild(text);
    }

    if (opts.body) { box.appendChild(opts.body); }

    var actions = el('div', 'dialog-actions');
    var buttons = [];
    (opts.buttons || []).forEach(function (b) {
      var btn = el('button', 'btn ' + (b.className || ''), b.label);
      btn.type = 'button';
      if (b.back) { btn.setAttribute('data-back', ''); }
      btn.addEventListener('click', function () {
        if (!b.keepOpen) { closeDialog(); }
        if (b.onClick) { b.onClick(btn); }
      });
      actions.appendChild(btn);
      buttons.push(btn);
    });
    box.appendChild(actions);
    overlay.appendChild(box);

    function cancel() {
      if (!opts.onCancel) { return; }
      closeDialog();
      opts.onCancel();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { cancel(); }
    });

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
      if (e.key === 'Tab' && buttons.length) {
        // Fokus bleibt im Dialog
        var first = buttons[0];
        var last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);

    openDialog = { overlay: overlay, onKey: onKey, onClose: opts.onClose || null,
      previousFocus: document.activeElement, cancel: opts.onCancel ? cancel : null };
    if (root) { root.setAttribute('inert', ''); }
    document.body.appendChild(overlay);
    if (buttons.length) { (buttons[opts.focus || 0] || buttons[0]).focus(); }
    changed();
    return overlay;
  }

  // Zurück-Taste im offenen Dialog: wie Escape (onCancel), sonst der Knopf mit back: true.
  // true, wenn ein Dialog offen war (die Taste ist dann verbraucht, auch wenn nichts passiert).
  function backInDialog() {
    if (!openDialog) { return false; }
    if (openDialog.cancel) { openDialog.cancel(); return true; }
    var btn = openDialog.overlay.querySelector('[data-back]');
    if (btn) { btn.click(); }
    return true;
  }

  function closeDialog() {
    if (!openDialog) { return; }
    var d = openDialog;
    openDialog = null;
    document.removeEventListener('keydown', d.onKey);
    if (d.overlay.parentNode) { d.overlay.parentNode.removeChild(d.overlay); }
    if (root) { root.removeAttribute('inert'); }
    if (d.previousFocus && d.previousFocus.focus && document.body.contains(d.previousFocus)) {
      d.previousFocus.focus();
    }
    if (d.onClose) { d.onClose(); }
    changed();
  }

  function isDialogOpen() {
    return Boolean(openDialog);
  }

  // ---------- Platzhalter (werden von späteren Bildschirmen ersetzt) ----------

  function placeholder(title, text) {
    return {
      mount: function (rootEl) {
        var s = el('section', 'screen placeholder');
        s.appendChild(el('h1', 'screen-title', title));
        s.appendChild(el('p', null, text));
        var back = el('button', 'btn btn--gold', 'Zurück zum Menü');
        back.type = 'button';
        back.addEventListener('click', function () { RS.UI.show('menu'); });
        s.appendChild(back);
        rootEl.appendChild(s);
        back.focus();
      },
      unmount: function () {}
    };
  }

  RS.UI = {
    screens: {
      map: placeholder('Abenteuer', 'Die Levelkarte von Kandishain entsteht gerade.'),
      game: placeholder('Spielfeld', 'Das Spielfeld entsteht gerade.')
    },
    init: init,
    show: show,
    current: currentName,
    el: el,
    dialog: dialog,
    closeDialog: closeDialog,
    isDialogOpen: isDialogOpen,
    backInDialog: backInDialog,
    onChange: onChange
  };
})(window.RS = window.RS || {});
