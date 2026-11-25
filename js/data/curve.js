(function (RS) {
  'use strict';

  // Ziel-Siegquote des Bots (Prozent, ohne Joker) je Level. Toleranz: +/- TOLERANCE Punkte.
  // level: { world, pos, isBoss, slot?, step?, slots? } (ein augmentiertes Level aus RS.Worlds).
  // Alte Level rechnen mit ihrem Platz unter den alten Leveln (slot, sonst pos). Zwischenlevel
  // (step 1..10) liegen stufenlos zwischen ihren beiden alten Nachbarn: Anteil step / 11.
  var STEPS = 10;

  function base(w, slot, isBoss) {
    if (isBoss) {
      return w >= 10 ? 22 : Math.round(78 - 6.5 * (w - 1));
    }
    var value = 90 - 6.5 * (w - 1) - 0.5 * (slot - 1);
    if (w >= 3 && slot === 1) { value += 5; }
    return value;
  }

  RS.Curve = {
    TOLERANCE: 5,
    STEPS: STEPS,
    target: function (level) {
      var w = level.world;
      var slot = level.slot || level.pos;
      if (!level.step) { return base(w, slot, level.isBoss); }
      var from = base(w, slot, false);
      var to = base(w, slot + 1, level.slots ? slot + 1 === level.slots : false);
      return Math.round((from + (to - from) * level.step / (STEPS + 1)) * 2) / 2;
    }
  };
})(window.RS = window.RS || {});
