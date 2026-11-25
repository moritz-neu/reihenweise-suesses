(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  t('ambient: every world has a sky, a horizon and three known figures', function () {
    RS.Worlds.list().forEach(function (w) {
      var a = RS.UI.Ambient.WORLDS[w.id];
      ok(a, 'ambient of world ' + w.id);
      eq(a.sky.length, 2, 'sky of world ' + w.id);
      eq(a.figures.length, 3, 'figures of world ' + w.id);
      a.figures.forEach(function (f) {
        ok(RS.UI.Ambient.FIGURES[f.f], 'figure ' + f.f);
        ok(/^[a-z]+$/.test(f.anim), 'animation of ' + f.f);
      });
    });
  });

  t('ambient: the game layer is decorative, never clickable, with horizon and figures', function () {
    var layer = RS.UI.Ambient.gameLayer(7);
    eq(layer.getAttribute('aria-hidden'), 'true');
    ok(layer.querySelector('.ambient-horizon svg'), 'horizon');
    ok(layer.querySelectorAll('.amb-fig').length >= 3, 'figures');
    eq(layer.querySelectorAll('button, a, [tabindex]').length, 0, 'nothing to focus');
  });

  t('ambient: map sections get two figures and a darker veil towards the boss', function () {
    var low = RS.UI.Ambient.mapLayer(3, 0, 10);
    var high = RS.UI.Ambient.mapLayer(3, 9, 10);
    eq((low.match(/class="amb-fig /g) || []).length, 2);
    ok(/--amb-dusk:0\.00/.test(low), 'no veil at the bottom');
    ok(/--amb-dusk:1\.00/.test(high), 'full veil at the top');
    ok(low !== RS.UI.Ambient.mapLayer(3, 1, 10), 'sections differ');
  });

  t('ambient: a single figure for menu and atlas is hidden from screen readers', function () {
    var html = RS.UI.Ambient.figure(4, 0, 'atlas-fig');
    ok(/aria-hidden="true"/.test(html));
    ok(/amb-parrot/.test(html));
  });
  t('ambient: every world has a small scene with a known figure that crosses the screen now and then', function () {
    RS.Worlds.list().forEach(function (w) {
      var sc = RS.UI.Ambient.SCENES[w.id];
      ok(sc && RS.UI.Ambient.FIGURES[sc.f], 'scene of world ' + w.id);
      ok(sc.dur >= 45, 'calm pace in world ' + w.id);
      var n = RS.UI.Ambient.scene(w.id);
      eq(n.querySelectorAll('.amb-fig').length, sc.flock || 1);
    });
    ok(RS.UI.Ambient.gameLayer(9).querySelector('.amb-scene--rev'), 'fish swim the other way');
  });
})(window.RS = window.RS || {});
