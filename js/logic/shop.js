(function (RS) {
  'use strict';

  var PRICES = {};
  var JOKERS = RS.Jokers.KINDS.slice();
  RS.Jokers.LIST.forEach(function (j) { PRICES[j.kind] = j.price; });
  var MAX_STOCK = RS.Jokers.MAX_STOCK;
  var START_STOCK = 1;
  var EXTRA_MOVES = 5;
  var PER_STAR = 5;
  var REPLAY_BONUS = 2;
  var POINTS_PER_STICK = 1000;

  function known(kind) { return JOKERS.indexOf(kind) !== -1; }

  // Zuckerstangen je Stern: 5 in Welt 1 und 2, danach 5 + (Welt - 2).
  function perStar(worldId) {
    return PER_STAR + Math.max(0, (worldId || 1) - 2);
  }

  // Erster Sieg: perStar je Stern. Wiederholung: perStar je neuem Stern plus 2.
  function winReward(previousBest, stars, worldId) {
    var gained = perStar(worldId) * Math.max(0, stars - previousBest);
    return previousBest > 0 ? gained + REPLAY_BONUS : gained;
  }

  function endlessReward(score) {
    return Math.floor(score / POINTS_PER_STICK);
  }

  function buyProblem(data, kind) {
    if (!known(kind)) { return 'unknown'; }
    if (data.jokers[kind] >= MAX_STOCK) { return 'full'; }
    if (data.sticks < PRICES[kind]) { return 'money'; }
    return null;
  }

  function buy(data, kind) {
    if (buyProblem(data, kind) !== null) { return false; }
    data.sticks -= PRICES[kind];
    data.jokers[kind] += 1;
    return true;
  }

  function use(data, kind) {
    if (!known(kind) || data.jokers[kind] < 1) { return false; }
    data.jokers[kind] -= 1;
    return true;
  }

  RS.Shop = {
    PRICES: PRICES, JOKERS: JOKERS, MAX_STOCK: MAX_STOCK, PER_STAR: PER_STAR,
    REPLAY_BONUS: REPLAY_BONUS, POINTS_PER_STICK: POINTS_PER_STICK,
    START_STOCK: START_STOCK, EXTRA_MOVES: EXTRA_MOVES,
    perStar: perStar, winReward: winReward, endlessReward: endlessReward,
    buyProblem: buyProblem, buy: buy, use: use
  };
})(window.RS = window.RS || {});
