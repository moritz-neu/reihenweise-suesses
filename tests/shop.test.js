(function (RS) {
  'use strict';
  var t = RS.test;
  var eq = RS.assert.equal;
  var deep = RS.assert.deepEqual;
  var S = RS.Shop;

  function d(sticks, moves, hammer) { return { sticks: sticks, jokers: { moves: moves, hammer: hammer } }; }

  t('shop: constants', function () {
    deep(S.PRICES, { moves: 30, hammer: 20 });
    eq(S.MAX_STOCK, 10);
    eq(S.EXTRA_MOVES, 5);
    eq(S.START_STOCK, 1);
  });

  t('shop: first win pays 5 per star', function () {
    eq(S.winReward(0, 1), 5);
    eq(S.winReward(0, 2), 10);
    eq(S.winReward(0, 3), 15);
  });

  t('shop: replay pays new stars plus 2', function () {
    eq(S.winReward(2, 2), 2);
    eq(S.winReward(3, 1), 2);
    eq(S.winReward(1, 3), 12);
    eq(S.winReward(2, 3), 7);
  });

  t('shop: endless pays per full 1000', function () {
    eq(S.endlessReward(0), 0);
    eq(S.endlessReward(999), 0);
    eq(S.endlessReward(1000), 1);
    eq(S.endlessReward(8700), 8);
  });

  t('shop: buy with enough money', function () {
    var x = d(50, 1, 1);
    eq(S.buy(x, 'hammer'), true);
    eq(x.sticks, 30);
    eq(x.jokers.hammer, 2);
  });

  t('shop: buy without money changes nothing', function () {
    var x = d(29, 1, 1);
    eq(S.buyProblem(x, 'moves'), 'money');
    eq(S.buy(x, 'moves'), false);
    deep(x, d(29, 1, 1));
  });

  t('shop: buy with full stock changes nothing', function () {
    var x = d(100, 10, 0);
    eq(S.buyProblem(x, 'moves'), 'full');
    eq(S.buy(x, 'moves'), false);
    eq(x.sticks, 100);
  });

  t('shop: buy twice with money for one', function () {
    var x = d(20, 0, 0);
    eq(S.buy(x, 'hammer'), true);
    eq(S.buy(x, 'hammer'), false);
    deep(x, d(0, 0, 1));
  });

  t('shop: use', function () {
    var x = d(0, 1, 0);
    eq(S.use(x, 'moves'), true);
    eq(S.use(x, 'moves'), false);
    eq(S.use(x, 'hammer'), false);
    eq(x.jokers.moves, 0);
  });

  t('shop: unknown kind', function () {
    eq(S.buyProblem(d(99, 0, 0), 'bomb'), 'unknown');
    eq(S.buy(d(99, 0, 0), 'bomb'), false);
    eq(S.use(d(99, 0, 0), 'bomb'), false);
  });
})(window.RS = window.RS || {});
