(function (RS) {
  'use strict';

  // mulberry32: small seedable PRNG
  RS.createRng = function (seed) {
    var state = seed >>> 0;

    function next() {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function int(n) {
      return Math.floor(next() * n);
    }

    return { next: next, int: int };
  };
})(window.RS = window.RS || {});
