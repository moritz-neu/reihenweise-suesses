(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;

  // Ein temporäres #app mit optionalem Zurück-Knopf; wird immer wieder entfernt.
  function withApp(withBack, fn) {
    var app = document.createElement('div');
    app.id = 'app';
    var clicks = { n: 0 };
    if (withBack) {
      var b = RS.UI.Back.mark(document.createElement('button'));
      b.addEventListener('click', function () { clicks.n++; });
      app.appendChild(b);
    }
    document.body.appendChild(app);
    RS.UI.init(app);
    try { fn(clicks); }
    finally {
      RS.UI.closeDialog();
      app.parentNode.removeChild(app);
      RS.UI.init(null);
    }
  }

  t('back: the screen back button is pressed when no dialog is open', function () {
    withApp(true, function (clicks) {
      eq(RS.UI.Back.handle(), 'button');
      eq(clicks.n, 1);
    });
  });

  t('back: in the main menu without dialog nothing is caught', function () {
    withApp(false, function () { eq(RS.UI.Back.handle(), 'exit'); });
  });

  t('back: a dialog with onCancel is cancelled, the screen button stays untouched', function () {
    withApp(true, function (clicks) {
      var cancelled = 0;
      RS.UI.dialog({ title: 'x', buttons: [{ label: 'a' }], onCancel: function () { cancelled++; } });
      eq(RS.UI.Back.handle(), 'dialog');
      eq(cancelled, 1);
      eq(RS.UI.isDialogOpen(), false);
      eq(clicks.n, 0);
    });
  });

  t('back: a dialog without onCancel presses its back button', function () {
    withApp(false, function () {
      var picked = '';
      RS.UI.dialog({ title: 'x', buttons: [
        { label: 'Zur Karte', back: true, onClick: function () { picked = 'karte'; } },
        { label: 'Nochmal', onClick: function () { picked = 'nochmal'; } }] });
      eq(RS.UI.Back.handle(), 'dialog');
      eq(picked, 'karte');
      eq(RS.UI.isDialogOpen(), false);
    });
  });

  t('back: a dialog without onCancel and back button stays open and the key is used up', function () {
    withApp(true, function (clicks) {
      RS.UI.dialog({ title: 'Story', buttons: [{ label: 'Weiter' }] });
      eq(RS.UI.Back.handle(), 'dialog');
      eq(RS.UI.isDialogOpen(), true);
      eq(clicks.n, 0);
    });
  });

  t('back: onChange runs when a dialog opens and closes', function () {
    withApp(false, function () {
      var n = 0;
      RS.UI.onChange(function () { n++; });
      RS.UI.dialog({ title: 'x', buttons: [{ label: 'a' }] });
      eq(n, 1);
      RS.UI.closeDialog();
      eq(n, 2);
    });
  });
})(window.RS = window.RS || {});
