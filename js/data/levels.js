(function (RS) {
  'use strict';

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  // Sterne ergeben sich aus den übrigen Zügen (RS.Goals.starMoves), nicht aus Punkten.
  // Welt 1 (Kandishain): Level 1–10, Welt 2 (Frostzuckerberge): Level 11–20.
  function level(id, colors, moves, goals, layout, boss) {
    var def = { id: id, world: id <= 10 ? 1 : 2, colors: colors, moves: moves, seed: 1000 + id, goals: goals, layout: layout };
    if (boss) { def.boss = boss; }
    return def;
  }

  var BOSS = [{ type: 'boss' }];

  RS.LEVELS = [
    level(1, 5, 20, [{ type: 'score', target: 3000 }], ALL),
    level(2, 5, 18, [{ type: 'score', target: 4000 }], [
      '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.']),
    level(3, 5, 18, [{ type: 'collect', color: 0, target: 25 }], ALL),
    level(4, 6, 22, [{ type: 'collect', color: 3, target: 20 }, { type: 'collect', color: 1, target: 20 }], [
      '..xxxx..', '..xxxx..', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '..xxxx..', '..xxxx..']),
    level(5, 6, 24, [{ type: 'score', target: 8000 }, { type: 'collect', color: 2, target: 25 }], ALL),
    level(6, 6, 18, [{ type: 'glaze' }], [
      'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '11111111', '11111111', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx']),
    level(7, 6, 22, [{ type: 'glaze' }], [
      'xxxxxxxx', 'x111111x', 'x122221x', 'x122221x', 'x122221x', 'x122221x', 'x111111x', 'xxxxxxxx']),
    level(8, 6, 24, [{ type: 'glaze' }, { type: 'collect', color: 4, target: 20 }], [
      'LLLLLLLL', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '11111111', '11111111', 'xxxxxxxx']),
    level(9, 6, 26, [{ type: 'glaze' }, { type: 'collect', color: 1, target: 20 }], [
      '.KKKKKK.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.111111.', '.111111.']),
    // Bosskampf gegen Graf Lakritz: freies Feld, das Lakritzgitter bringt er selbst mit.
    level(10, 6, 36, BOSS, ALL, 'lakritz'),
    // Welt 2: Züge und Zielmengen aus dem Balancing-Simulator (README, Abschnitt Balancing).
    level(11, 6, 20, [{ type: 'score', target: 5200 }], [
      '...xx...', '..xxxx..', '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx']),
    level(12, 6, 22, [{ type: 'collect', color: 3, target: 25 }, { type: 'collect', color: 4, target: 25 }], [
      'xxx..xxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.', '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxx..xxx']),
    level(13, 6, 16, [{ type: 'collect', color: 2, target: 26 }], [
      'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xIIxxIIx', 'xIIxxIIx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx']),
    level(14, 6, 17, [{ type: 'glaze' }], [
      'xxxxxxxx', 'xx1111xx', 'I122221I', 'I122221I', 'I122221I', 'I122221I', 'xx1111xx', 'xxxxxxxx']),
    level(15, 6, 18, [{ type: 'collect', color: 1, target: 24 }], [
      'xxxxxxxx', 'xLxxxxLx', 'xxJxxJxx', 'xxxJJxxx', 'xxxJJxxx', 'xxJxxJxx', 'xLxxxxLx', 'xxxxxxxx']),
    level(16, 6, 15, [{ type: 'choco' }], [
      'xxxxxxxx', 'xxxxxxxx', 'xCCCCCCx', 'xCCxxCCx', 'xCCxxCCx', 'xCCCCCCx', 'xxxxxxxx', 'xxxxxxxx']),
    level(17, 6, 15, [{ type: 'choco' }], [
      'xxxxxxxx', 'xIxxxxIx', 'ICCCCCCI', 'xCxIIxCx', 'xCxIIxCx', 'ICCCCCCI', 'xIxxxxIx', 'xxxxxxxx']),
    level(18, 6, 15, [{ type: 'choco' }, { type: 'glaze' }, { type: 'collect', color: 0, target: 20 }], [
      'xxxxxxxx', 'x111111x', 'x1CCCC1x', 'xxxxxxxx', 'xxxxxxxx', 'x1CCCC1x', 'x111111x', 'xxxxxxxx']),
    level(19, 6, 19, [{ type: 'glaze' }, { type: 'choco' }], [
      '.xxxxxx.', 'xLxCCxLx', 'xIxCCxIx', 'x1J22J1x', 'x1J22J1x', 'xIxCCxIx', 'xKxCCxKx', '.xxxxxx.']),
    // Bosskampf gegen Eiskönigin Kandara: ein paar Glasurfelder liegen schon am Anfang.
    level(20, 6, 40, BOSS, [
      'xxxxxxxx', 'xxxxxxxx', 'xx1xx1xx', 'xxxxxxxx', 'xxxxxxxx', 'xx1xx1xx', 'xxxxxxxx', 'xxxxxxxx'], 'kandara')
  ];
})(window.RS = window.RS || {});
