(function (RS) {
  'use strict';

  // Target bot win rate (percent, no jokers) per level. Tolerance: +/- TOLERANCE points.
  // level: { world, pos, isBoss } (an augmented def from RS.Worlds).
  RS.Curve = {
    TOLERANCE: 5,
    target: function (level) {
      var w = level.world;
      if (level.isBoss) {
        return w >= 10 ? 22 : Math.round(78 - 6.5 * (w - 1));
      }
      var value = 90 - 6.5 * (w - 1) - 0.5 * (level.pos - 1);
      if (w >= 3 && level.pos === 1) { value += 5; }
      return value;
    }
  };
})(window.RS = window.RS || {});
