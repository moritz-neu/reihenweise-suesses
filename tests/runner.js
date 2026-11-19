(function (RS) {
  'use strict';

  var tests = [];
  var loadErrors = [];

  // Script errors during page load (syntax error, missing dependency) count as failed tests.
  window.addEventListener('error', function (e) {
    var where = e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '';
    loadErrors.push((e.message || 'script error') + where);
  });

  function fail(msg, detail) {
    throw new Error((msg ? msg + ': ' : '') + detail);
  }

  RS.test = function (name, fn) {
    tests.push({ name: name, fn: fn });
  };

  RS.assert = {
    equal: function (actual, expected, msg) {
      if (actual !== expected) {
        fail(msg, 'expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      }
    },
    deepEqual: function (actual, expected, msg) {
      var a = JSON.stringify(actual);
      var e = JSON.stringify(expected);
      if (a !== e) {
        fail(msg, 'expected ' + e + ' but got ' + a);
      }
    },
    ok: function (value, msg) {
      if (!value) {
        fail(msg, 'expected a truthy value but got ' + JSON.stringify(value));
      }
    },
    throws: function (fn, msg) {
      var threw = false;
      try { fn(); } catch (e) { threw = true; }
      if (!threw) {
        fail(msg, 'expected function to throw');
      }
    }
  };

  function run() {
    var list = document.createElement('ul');
    var failed = 0;
    loadErrors.forEach(function (msg) {
      var li = document.createElement('li');
      failed++;
      li.textContent = 'FAIL script error during load - ' + msg;
      list.appendChild(li);
    });
    tests.forEach(function (t) {
      var li = document.createElement('li');
      try {
        t.fn();
        li.textContent = 'PASS ' + t.name;
      } catch (e) {
        failed++;
        li.textContent = 'FAIL ' + t.name + ' - ' + (e && e.message ? e.message : String(e));
      }
      list.appendChild(li);
    });
    document.body.appendChild(list);
    var summary = document.createElement('pre');
    summary.id = 'summary';
    var total = tests.length + loadErrors.length;
    summary.textContent = failed === 0
      ? 'RESULT: PASS ' + total + '/' + total
      : 'RESULT: FAIL ' + failed + '/' + total;
    document.body.appendChild(summary);
  }

  document.addEventListener('DOMContentLoaded', run);
})(window.RS = window.RS || {});
