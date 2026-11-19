(function (RS) {
  'use strict';

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  // Sterne ergeben sich aus den übrigen Zügen (RS.Goals.starMoves), nicht aus Punkten.
  function level(id, colors, moves, goals, layout) {
    return { id: id, colors: colors, moves: moves, seed: 1000 + id, goals: goals, layout: layout };
  }

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
    level(10, 6, 24, [{ type: 'glaze' }, { type: 'collect', color: 5, target: 30 }], [
      '.111111.', 'xxxxxxxx', 'LLLLLLLL', 'xxx22xxx', 'xxx22xxx', 'LLLLLLLL', 'xxxxxxxx', '.111111.'])
  ];
})(window.RS = window.RS || {});
