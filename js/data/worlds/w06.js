(function (RS) {
  'use strict';

  // Welt 6 (Zuckerwattenwolken): Neuheit Joker Feentausch (tauscht zwei Nachbarn, auch ohne Reihe).
  // Wolkenförmige Felder mit Buchten aus Leerfeldern laden zum freien Tausch ein; balanciert ist
  // jedes Level ohne Joker. Züge und Zielmengen aus dem Balancing-Simulator (README).
  // w6-01 (Glasur in engen Buchten) und w6-07 (Kirschen) spielen mit fünf Farben, alle anderen mit sechs.
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win, cherries) {
    var def = { id: 'w6-0' + p, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
    if (cherries) { def.cherries = cherries; }
    return def;
  }

  RS.Worlds.register({
    id: 6, key: 'wolken', name: 'Zuckerwattenwolken', novelty: { kind: 'joker', key: 'feentausch' },
    intro: [
      'Hinter dem Kirschzweigtor schweben die Zuckerwattenwolken. Rosa und himmelblau tragen sie kleine Wolkenhäuser über den Himmel.',
      'Hier hilft ein neuer Joker: der Feentausch, der zwei Nachbarn tauscht, auch wenn dabei keine Reihe entsteht.',
      'Tippe auf den Feentausch und dann auf zwei benachbarte Bonbons, schon tauschen sie die Plätze. Er kostet dich keinen Zug!',
      'Damit du gleich loslegen kannst, schenke ich dir zwei Feentausche. Hinter den dunklen Wolken grollt die Gewitterhexe Wolkira!'
    ],
    chapterEnd: [
      'Wolkira lässt den letzten Donner verhallen und lächelt zum ersten Mal.',
      'Sie erklärt, dass die Sternenkrone neun Sternsplitter braucht, damit sie Amarus bezwingen kann.',
      'Dann regnet aus ihrer Wolke ein Sternsplitter, der himmelblau wie ein Sommermorgen glitzert!'
    ],
    gateLocked: 'Besiege die Gewitterhexe Wolkira, um das Tor zu öffnen.',
    // Schwebend und ruhig, Dur-Pentatonik, weiche Fläche mit hohen Glöckchen.
    music: {
      tempo: 76, root: 67, scale: [0, 2, 4, 7, 9], lead: 'pad',
      bass: [0, null, null, null, null, null, null, null, 3, null, null, null, 4, null, null, null],
      drums: 'k.......s.....h.',
      melodies: [
        [4, null, null, 5, 7, null, null, null, 6, null, 5, null, 4, null, null, null],
        [7, null, null, null, 9, null, 8, null, 7, null, null, 5, 6, null, null, null],
        [2, null, 4, null, 5, null, null, 4, 3, null, null, null, 2, null, 0, null]
      ]
    },
    boss: {
      key: 'wolkira', name: 'Gewitterhexe Wolkira', hp: 660, weak: [3, 5], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'ice', count: 3, level: 1 },
        { every: 2, kind: 'choco', count: 2 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Hihi, wer stapft da durch meine Gewitterwolken?' },
          { who: 'annika', text: 'Wir bringen die Sonne zurück in die Wolken, Wolkira!' },
          { who: 'boss', text: 'Dann friere ich eure Bonbons mit eisigem Hagel ein!' },
          { who: 'annika', text: 'Blaue Bonbons lassen ihre Blitze verpuffen, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Jetzt lasse ich bittere Schokolade aus den Wolken regnen!' },
          { who: 'annika', text: 'Ein Feentausch neben der Schokolade hilft, und jetzt trifft Orange sie am härtesten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Mein schönes Gewitter verzieht sich zu einem Nieselregen!' },
          { who: 'annika', text: 'Jetzt scheint die Sonne wieder über den Zuckerwattenwolken!' }
        ]
      }
    },
    levels: [
      level(1, 5, 15, [{ type: 'glaze' }], [
        '..1xx1..', '.1xxxx1.', '1xxxxxx1', 'xxxxxxxx', 'xxxxxxxx', '1xxxxxx1', '.1xxxx1.', '..1xx1..'],
        'Glasur klebt in den engen Wolkenbuchten, und ein Feentausch bringt dort jedes Bonbon an seinen Platz!',
        'Die Glasur ist fort, und das erste Wolkenhaus leuchtet rosa.'),
      level(2, 6, 22, [{ type: 'collect', color: 3, target: 26 }], [
        '.xxxxxx.', 'xLxxxxLx', 'xLx..xLx', 'xxx..xxx', 'xxxxxxxx', 'xLxxxxLx', 'xLxxxxLx', '.xxxxxx.'],
        'Lakritzpfähle halten die Wolke fest, also sammle dazwischen 26 Bonbons in Blau!',
        'Prima, die Wolke schwebt wieder frei.'),
      level(3, 6, 18, [{ type: 'glaze' }, { type: 'score', target: 6500 }], [
        '..xxxx..', '.x1xx1x.', 'xxIxxIxx', 'x122221x', 'x122221x', 'xxIxxIxx', '.x1xx1x.', '..xxxx..'],
        'Glasur und Eis liegen auf dem Wolkenpfad, und dazu brauchen wir 6500 Punkte.',
        'Der Wolkenpfad glänzt, und die Sterne zwinkern uns zu.'),
      level(4, 6, 24, [{ type: 'crate' }], [
        'xxx..xxx', 'xXYxxYXx', 'xYZxxZYx', 'xxxxxxxx', 'xxxxxxxx', 'xYZxxZYx', 'xXYxxYXx', 'xxx..xxx'],
        'Lebkuchenkisten sind in den Wolken hängen geblieben, also brich sie alle auf!',
        'Alle Kisten sind offen, und die Wolke wird ganz leicht.'),
      level(5, 6, 22, [{ type: 'collect', color: 5, target: 34 }], [
        '.xxxxxx.', 'xIIxxIIx', 'xxxxxxxx', 'xxJxxJxx', 'xxJxxJxx', 'xxxxxxxx', 'xIIxxIIx', '.xxxxxx.'],
        'Hagelkörner frieren die Wolke ein, und wir sammeln 34 Bonbons in Orange.',
        'Das Eis ist geschmolzen, und die Wolke glüht im Abendrot.'),
      level(6, 6, 16, [{ type: 'choco' }], [
        'xx.xx.xx', 'xCxxxxCx', 'xCCxxCCx', 'x1C11C1x', 'x1C11C1x', 'xCCxxCCx', 'xCxxxxCx', 'xx.xx.xx'],
        'Bittere Schokolade quillt durch die Wolken, also entferne sie ganz!',
        'Keine Schokolade mehr, und die Zuckerwatte duftet wieder süß.'),
      level(7, 5, 20, [{ type: 'cherry', target: 3 }, { type: 'collect', color: 1, target: 18 }], [
        'xxRxxRxx', 'xxxxxxxx', 'xLx..xLx', 'xxx..xxx', 'xxxxxxxx', 'xLxxxxLx', 'xxxxxxxx', 'xxxxxxxx'],
        'Kirschen aus dem Garten sind bis in die Wolken geflogen, also bring drei heim und sammle 18 Bonbons in Gelb!',
        'Die Kirschen sind zurück, und die Wolke strahlt gelb wie die Sonne.',
        { total: 3, onBoard: 2 }),
      level(8, 6, 18, [{ type: 'glaze' }, { type: 'crate' }], [
        '.xxxxxx.', 'xKxZZxKx', 'x1xxxx1x', 'x2xxxx2x', 'x2xxxx2x', 'x1xxxx1x', 'xKxYYxKx', '.xxxxxx.'],
        'Kisten, Lakritz und dicke Glasur kleben am Wolkenrand, also räume alles fort!',
        'Der Wolkenrand ist frei, und die Häuser winken mit ihren Fähnchen.'),
      level(9, 6, 25, [{ type: 'crate' }, { type: 'glaze' }], [
        '.xx..xx.', 'xKxZZxKx', 'xIxCCxIx', 'x222222x', 'xxxxxxxx', 'xIxCCxIx', 'xYYxxYYx', '.xx..xx.'],
        'Kurz vor Wolkiras Gewitter kommt alles zusammen: Kisten, Lakritz, Eis, Glasur und Schokolade.',
        'Der Weg zum Gewitter ist frei, und es donnert schon.'),
      // Bosskampf gegen die Gewitterhexe Wolkira: zwei Wolkenbuchten und ein paar Hagelkörner.
      { id: 'w6-10', boss: true, colors: 6, moves: 40, layout: [
        '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxIxxIxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.'],
        intro: 'Mitten in einer schwarzen Gewitterwolke schwingt die Gewitterhexe Wolkira ihren Blitzstab.',
        win: 'Wolkira ist besiegt, und die Zuckerwattenwolken leuchten wieder rosa!' }
    ]
  });
})(window.RS = window.RS || {});
