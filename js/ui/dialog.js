(function (RS) {
  'use strict';

  // Annika, die Zuckerfee: kleine SVG-Figur mit Sprechblase.
  // RS.UI.Dialog.say(lines, { skippable }) zeigt Zeile für Zeile (ein Klick je Zeile).
  // RS.UI.Dialog.annika(text) liefert Figur + Blase als Baustein für andere Dialoge.

  var el = RS.UI.el;

  // Eigene Figur: Fee mit Bonbonflügeln, Zuckerstangen-Zauberstab und Sternenkrone.
  var ANNIKA_SVG =
    '<svg class="annika-svg" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<radialGradient id="annika-wing-a" cx="40%" cy="40%" r="70%">' +
          '<stop offset="0" stop-color="#ffe6f3"/><stop offset="0.6" stop-color="#ff8fc4" stop-opacity="0.75"/>' +
          '<stop offset="1" stop-color="#c77dff" stop-opacity="0.35"/>' +
        '</radialGradient>' +
        '<radialGradient id="annika-wing-b" cx="40%" cy="40%" r="70%">' +
          '<stop offset="0" stop-color="#e6fbff"/><stop offset="0.6" stop-color="#7fd8ff" stop-opacity="0.75"/>' +
          '<stop offset="1" stop-color="#4dffb0" stop-opacity="0.3"/>' +
        '</radialGradient>' +
        '<linearGradient id="annika-dress" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#ff6fa8"/><stop offset="1" stop-color="#b03df0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<g class="annika-wings">' +
        '<ellipse cx="34" cy="62" rx="26" ry="17" transform="rotate(-28 34 62)" fill="url(#annika-wing-a)"/>' +
        '<ellipse cx="86" cy="62" rx="26" ry="17" transform="rotate(28 86 62)" fill="url(#annika-wing-a)"/>' +
        '<ellipse cx="38" cy="86" rx="17" ry="11" transform="rotate(24 38 86)" fill="url(#annika-wing-b)"/>' +
        '<ellipse cx="82" cy="86" rx="17" ry="11" transform="rotate(-24 82 86)" fill="url(#annika-wing-b)"/>' +
      '</g>' +
      // Kleid als Bonbonwickel
      '<path d="M60 64 L42 112 Q60 120 78 112 Z" fill="url(#annika-dress)"/>' +
      '<path d="M46 102 Q60 108 74 102" stroke="#ffd78c" stroke-width="2" fill="none"/>' +
      '<path d="M42 112 l-6 6 l8 0 Z M78 112 l6 6 l-8 0 Z" fill="#ff6fa8"/>' +
      // Beine
      '<path d="M54 116 l-2 14 M66 116 l2 14" stroke="#f5d0b8" stroke-width="3" stroke-linecap="round"/>' +
      // Arme und Zauberstab
      '<path d="M50 74 Q40 82 36 92" stroke="#f5d0b8" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M70 74 Q82 70 88 58" stroke="#f5d0b8" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M88 60 L100 26" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M88 60 L100 26" stroke="#e0204f" stroke-width="3.5" stroke-dasharray="3 4" stroke-linecap="round"/>' +
      '<path class="annika-star" d="M101 12 l3.5 8 8.5 0.8 -6.5 5.6 2 8.4 -7.5 -4.4 -7.5 4.4 2 -8.4 -6.5 -5.6 8.5 -0.8 Z" fill="#ffd78c"/>' +
      // Kopf, Haare, Gesicht
      '<path d="M40 46 Q38 22 60 20 Q82 22 80 46 Q82 60 72 62 L48 62 Q38 60 40 46 Z" fill="#7a3fc0"/>' +
      '<circle cx="60" cy="46" r="16" fill="#ffe2cf"/>' +
      '<path d="M44 42 Q50 28 62 30 Q74 30 76 42 Q68 34 60 36 Q50 36 44 42 Z" fill="#7a3fc0"/>' +
      '<circle cx="54" cy="47" r="2.2" fill="#2a1840"/><circle cx="66" cy="47" r="2.2" fill="#2a1840"/>' +
      '<circle cx="54.8" cy="46.2" r="0.8" fill="#fff"/><circle cx="66.8" cy="46.2" r="0.8" fill="#fff"/>' +
      '<path d="M55 54 Q60 58 65 54" stroke="#c0446e" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<circle cx="50" cy="52" r="3" fill="#ff9fbf" opacity="0.6"/><circle cx="70" cy="52" r="3" fill="#ff9fbf" opacity="0.6"/>' +
      // Krone aus drei Bonbons
      '<circle cx="50" cy="24" r="4" fill="#ff4d7a"/><circle cx="60" cy="19" r="4.5" fill="#ffd24d"/>' +
      '<circle cx="70" cy="24" r="4" fill="#4dc3ff"/>' +
    '</svg>';

  function figure() {
    var f = el('div', 'annika');
    f.innerHTML = ANNIKA_SVG;
    return f;
  }

  // Figur + Sprechblase. Liefert { node, bubble, text }.
  function annika(text) {
    var node = el('div', 'annika-say');
    node.appendChild(figure());
    var bubble = el('div', 'annika-bubble');
    var p = el('p', 'annika-text', text);
    p.setAttribute('aria-live', 'polite');
    bubble.appendChild(p);
    node.appendChild(bubble);
    return { node: node, bubble: bubble, text: p };
  }

  // Zeigt die Zeilen nacheinander. Weiter (oder Klick auf die Blase) zeigt die nächste
  // Zeile; nach der letzten schließt der Dialog. Mit skippable (Standard) gibt es
  // *Überspringen*, und Escape überspringt ebenfalls. Das Promise endet in jedem Fall,
  // sobald der Dialog zu ist.
  function say(lines, opts) {
    var list = (lines || []).slice();
    var skippable = !opts || opts.skippable !== false;
    return new Promise(function (resolve) {
      if (!list.length) { resolve(); return; }
      var index = 0;
      var parts = annika(list[0]);
      var counter = el('p', 'annika-counter');
      parts.bubble.appendChild(counter);
      var nextButton = null;

      function update() {
        parts.text.textContent = list[index];
        counter.textContent = list.length > 1 ? (index + 1) + ' / ' + list.length : '';
        if (nextButton) {
          nextButton.textContent = index < list.length - 1 ? 'Weiter' : 'Los geht’s';
        }
        // kleines Aufploppen je Zeile
        parts.bubble.classList.remove('is-new');
        void parts.bubble.offsetWidth;
        parts.bubble.classList.add('is-new');
      }

      function next() {
        if (index < list.length - 1) { index++; update(); }
        else { RS.UI.closeDialog(); }
      }

      parts.bubble.addEventListener('click', next);

      var buttons = [];
      if (skippable) { buttons.push({ label: 'Überspringen', className: 'btn--ghost' }); }
      buttons.push({ label: 'Weiter', className: 'btn--gold', keepOpen: true, onClick: next });

      var overlay = RS.UI.dialog({
        title: 'Annika',
        className: 'dialog--annika',
        body: parts.node,
        buttons: buttons,
        focus: buttons.length - 1,
        onCancel: skippable ? function () {} : null,
        onClose: resolve
      });
      var btns = overlay.querySelectorAll('.dialog-actions .btn');
      nextButton = btns[btns.length - 1];
      update();
    });
  }

  RS.UI.Dialog = { say: say, annika: annika, figure: figure };
})(window.RS = window.RS || {});
