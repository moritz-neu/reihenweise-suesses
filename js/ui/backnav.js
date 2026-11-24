(function (RS) {
  'use strict';

  // Zurück-Taste (Android, auch die Zurück-Taste des Browsers): eine Ebene zurück statt die
  // App zu schließen. Reihenfolge:
  // 1. ein offener Dialog: wie Escape, sonst sein Knopf mit back: true (RS.UI.backInDialog);
  // 2. der Zurück-Knopf des Bildschirms (Element mit data-back in #app), mit seiner eigenen
  //    Rückfrage, etwa „Level verlassen?“;
  // 3. im Hauptmenü ohne Dialog: nichts abfangen, die Taste schließt die App.
  // Technik: Solange es etwas abzufangen gibt, liegt ein zusätzlicher Verlaufseintrag (trap)
  // auf dem Verlauf. Die Taste nimmt ihn weg (popstate), wir handeln und legen ihn neu an.
  // Im Hauptmenü ohne Dialog wird er still entfernt, damit die nächste Taste die App schließt.

  // Ein Schritt zurück; liefert 'dialog', 'button' oder 'exit' (nichts zu tun).
  function handle(doc) {
    doc = doc || document;
    if (RS.UI.backInDialog()) { return 'dialog'; }
    var btn = doc.querySelector('#app [data-back]');
    if (btn) { btn.click(); return 'button'; }
    return 'exit';
  }

  function wanted() {
    return RS.UI.isDialogOpen() || Boolean(document.querySelector('#app [data-back]'));
  }

  function install(win) {
    win = win || window;
    var h = win.history;
    if (!h || !h.pushState) { return; }
    var trapped = false;
    var ignore = 0;

    function sync() {
      var want = wanted();
      try {
        if (want && !trapped) { h.pushState({ rs: 'trap' }, ''); trapped = true; }
        else if (!want && trapped) { trapped = false; ignore++; h.back(); }
      } catch (e) { /* Verlauf nicht verfügbar (z. B. Sandbox): Taste verhält sich normal */ }
    }

    win.addEventListener('popstate', function () {
      if (ignore) { ignore--; return; }
      trapped = false;
      handle(win.document);
      sync();
    });
    RS.UI.onChange(sync);
    sync();
  }

  // Markiert einen Knopf als Zurück-Knopf des Bildschirms.
  function mark(button) {
    button.setAttribute('data-back', '');
    return button;
  }

  RS.UI.Back = { handle: handle, install: install, mark: mark };
})(window.RS = window.RS || {});
