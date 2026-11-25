(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var ok = RS.assert.ok;

  function played() {
    var s = RS.Save.fresh();
    s.stars['w1-01'] = 3;
    s.seen.push('prolog');
    return s;
  }

  t('news: entries are newest first, with a version, a date and 1 to 4 short lines', function () {
    ok(RS.NEWS.length >= 2);
    eq(RS.News.latest, RS.NEWS[0].version);
    RS.NEWS.forEach(function (n, i) {
      ok(/^\d+\.\d+\.\d+$/.test(n.version), 'version ' + n.version);
      ok(/^\d{2}\.\d{2}\.\d{4}$/.test(n.date), 'date of ' + n.version);
      ok(n.items.length >= 1 && n.items.length <= 4, 'lines of ' + n.version);
      n.items.forEach(function (line) { ok(line.length <= 110, 'short line in ' + n.version); });
      if (i > 0) {
        var a = RS.NEWS[i - 1].version.split('.').map(Number);
        var b = n.version.split('.').map(Number);
        ok(a[0] * 1e6 + a[1] * 1e3 + a[2] > b[0] * 1e6 + b[1] * 1e3 + b[2], 'order at ' + n.version);
      }
    });
  });

  t('news: a player from an older version sees the two newest versions once', function () {
    var s = played();
    var due = RS.News.due(s);
    eq(due.length, 2);
    eq(due[0].version, RS.NEWS[0].version);
    eq(due[1].version, RS.NEWS[1].version);
    eq(RS.News.markAllSeen(s), true);
    eq(RS.News.due(s).length, 0, 'nothing after reading');
    eq(RS.News.markAllSeen(s), false);
  });

  t('news: after a later update only the new version is shown', function () {
    var s = played();
    RS.News.markAllSeen(s);
    s.seen = s.seen.filter(function (k) { return k !== 'news:' + RS.NEWS[0].version; });
    var due = RS.News.due(s);
    eq(due.length, 1);
    eq(due[0].version, RS.NEWS[0].version);
  });

  t('news: a new player sees nothing', function () {
    var s = RS.Save.fresh();
    eq(RS.News.isNewPlayer(s), true);
    eq(RS.News.due(s).length, 0);
  });

  t('news: the read markers survive store and load', function () {
    var m = {};
    var storage = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
    var s = played();
    RS.News.markAllSeen(s);
    RS.Save.store(s, storage);
    eq(RS.News.due(RS.Save.load(storage)).length, 0);
  });
})(window.RS = window.RS || {});
