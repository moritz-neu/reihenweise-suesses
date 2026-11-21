(function (RS) {
  'use strict';

  // weak: weak colour per phase. attacks: [phase 1, phase 2].
  // hp from the balancing simulator (tests/balance.html, 200 seeds): level 10 about 50 %, level 20 about 33 %.
  RS.BOSSES = {
    lakritz: { name: 'Graf Lakritz', hp: 600, weak: [0, 3], attacks: [
      { every: 3, kind: 'lock', count: 3 },
      { every: 2, kind: 'lock', count: 3, row: 4 } ] },
    kandara: { name: 'Eiskönigin Kandara', hp: 730, weak: [1, 4], attacks: [
      { every: 3, kind: 'glaze', count: 3, level: 2 },
      { every: 2, kind: 'ice', count: 3, level: 2 } ] }
  };
})(window.RS = window.RS || {});
