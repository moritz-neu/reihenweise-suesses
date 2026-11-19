(function (RS) {
  'use strict';

  RS.test('rng: same seed gives same sequence', function () {
    var a = RS.createRng(42);
    var b = RS.createRng(42);
    for (var i = 0; i < 5; i++) {
      RS.assert.equal(a.next(), b.next(), 'value ' + i);
    }
  });

  RS.test('rng: different seeds differ', function () {
    RS.assert.ok(RS.createRng(1).next() !== RS.createRng(2).next());
  });

  RS.test('rng: int stays in range', function () {
    var rng = RS.createRng(7);
    var seen = {};
    for (var i = 0; i < 1000; i++) {
      var v = rng.int(6);
      RS.assert.ok(Number.isInteger(v) && v >= 0 && v <= 5, 'out of range: ' + v);
      seen[v] = true;
    }
    for (var k = 0; k < 6; k++) {
      RS.assert.ok(seen[k], 'value ' + k + ' never occurred');
    }
  });
})(window.RS = window.RS || {});
