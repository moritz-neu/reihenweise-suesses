(function (RS) {
  'use strict';

  // Welt 4 (Kaugummi-Dschungel): Neuheit Joker Zuckerbesen (räumt eine ganze Reihe ab).
  // Lange Reihen aus Glasur, Lakritz, Eis und Kisten laden zum Fegen ein; balanciert ist
  // jedes Level ohne Joker. Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win) {
    return { id: 'w4-0' + p, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
  }

  RS.Worlds.register({
    id: 4, key: 'kaugummidschungel', name: 'Kaugummi-Dschungel', novelty: { kind: 'joker', key: 'besen' },
    intro: [
      'Hinter dem Karamelltor wuchert der Kaugummi-Dschungel. Riesige Blätter tropfen hier vor süßem Kaugummi.',
      'Hier hilft ein neuer Joker: der Zuckerbesen, der eine ganze Reihe auf einmal abräumt.',
      'Tippe auf den Besen und dann auf eine Reihe, schon fegt er Bonbons, Glasur und Gitter weg. Er kostet dich keinen Zug!',
      'Damit du gleich loslegen kannst, schenke ich dir zwei Zuckerbesen. Irgendwo im Dickicht lauert die Kaugummi-Krake Blubba!'
    ],
    chapterEnd: [
      'Blubba lässt eine letzte Blase platzen und gibt kleinlaut zu, dass Amarus sie geschickt hat.',
      'Amarus will alle Süße der Welten in seinen Bitterbrunnen leiten, bis nichts mehr süß schmeckt.',
      'Aus ihrer geplatzten Blase fällt ein Sternsplitter, der rosa wie Kaugummi schimmert!'
    ],
    gateLocked: 'Besiege die Kaugummi-Krake Blubba, um das Tor zu öffnen.',
    // Verspielt und federnd, Dur-Pentatonik, Marimba, synkopierte Trommeln.
    music: {
      tempo: 120, root: 65, scale: [0, 2, 4, 7, 9], lead: 'marimba',
      bass: [0, null, null, 0, null, null, 3, null, null, null, 0, null, null, 3, null, null],
      drums: 'k..h..s.k.h..s.h',
      melodies: [
        [0, null, 2, 3, null, 2, 0, null, 1, null, 2, null, 4, 3, null, null],
        [5, null, 4, null, 3, 4, null, 3, 2, null, 0, null, 1, null, null, null],
        [2, 3, null, 5, null, 4, 3, null, 2, null, null, 1, 0, null, null, null]
      ]
    },
    boss: {
      key: 'blubba', name: 'Kaugummi-Krake Blubba', hp: 615, weak: [2, 4], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'glaze', count: 3, level: 2 },
        { every: 2, kind: 'lock', count: 2, row: 6 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Blubb, blubb, wer klebt denn da in meinem Dschungel fest?' },
          { who: 'annika', text: 'Wir sind gekommen, um den Dschungel zu befreien, Blubba!' },
          { who: 'boss', text: 'Dann wickle ich euch in meine klebrigste Glasur ein!' },
          { who: 'annika', text: 'Grüne Bonbons bringen ihre Blasen zum Platzen, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Jetzt kleben meine Gitter gleich reihenweise fest!' },
          { who: 'annika', text: 'Fege ihre Gitterreihen mit dem Zuckerbesen weg, und jetzt hilft Violett!' }
        ],
        defeat: [
          { who: 'boss', text: 'Plopp, meine allerschönste Blase ist geplatzt!' },
          { who: 'annika', text: 'Jetzt darf der Dschungel wieder bunt und süß sein!' }
        ]
      }
    },
    levels: [
      level(1, 6, 19, [{ type: 'glaze' }], [
        'xxxxxxxx', 'xxxxxxxx', '11111111', 'xxxxxxxx', 'xxxxxxxx', '11111111', 'xxxxxxxx', 'xxxxxxxx'],
        'Lange Glasurreihen ziehen sich durch den Dschungel, und ein Zuckerbesen fegt eine davon mit einem Schwung weg!',
        'Die Glasur ist fort, und das erste Baumhaus leuchtet zwischen den Blättern.'),
      level(2, 6, 20, [{ type: 'collect', color: 2, target: 30 }], [
        'xxxxxxxx', 'xxxxxxxx', 'xLLLLLLx', 'xxxxxxxx', 'xxxxxxxx', 'xLLLLLLx', 'xxxxxxxx', 'xxxxxxxx'],
        'Lakritzgitter hängen wie Lianen in langen Reihen, also sammle dazwischen 30 Bonbons in Grün!',
        'Prima, die Lianen schaukeln wieder frei im Wind.'),
      level(3, 6, 25, [{ type: 'glaze' }, { type: 'score', target: 5000 }], [
        'xxxxxxxx', 'x222222x', 'xxxxxxxx', 'xx1111xx', 'xx1111xx', 'xxxxxxxx', 'x222222x', 'xxxxxxxx'],
        'Dicke Glasur klebt in Streifen auf den Blättern, und dazu brauchen wir 5000 Punkte.',
        'Die Blätter glänzen, und die Glühwürmchen tanzen.'),
      level(4, 6, 14, [{ type: 'crate' }], [
        'xxxxxxxx', 'xxxxxxxx', 'XXXXXXXX', 'xxxxxxxx', 'xxxxxxxx', 'xYYYYYYx', 'xxxxxxxx', 'xxxxxxxx'],
        'Lebkuchenkisten stapeln sich in langen Reihen am Flussufer, also brich sie alle auf!',
        'Alle Kisten sind offen, und der Fluss plätschert wieder.'),
      level(5, 6, 20, [{ type: 'collect', color: 3, target: 28 }], [
        'xxxxxxxx', 'xxxxxxxx', 'IIxxxxII', 'xxIIIIxx', 'xxJJJJxx', 'IIxxxxII', 'xxxxxxxx', 'xxxxxxxx'],
        'Eisreihen halten die Kaugummiblüten fest, und wir sammeln 28 Bonbons in Blau.',
        'Das Eis ist geschmolzen, und die Blüten öffnen sich.'),
      level(6, 6, 22, [{ type: 'choco' }, { type: 'glaze' }], [
        'xxxxxxxx', 'x222222x', 'xxxCCxxx', 'xxCxxCxx', 'xxCxxCxx', 'xxxCCxxx', 'x222222x', 'xxxxxxxx'],
        'Schokolade wuchert zwischen dicken Glasurreihen, also entferne alle Schokolade und jede Glasur!',
        'Keine Schokolade mehr, und die Ranken atmen auf.'),
      level(7, 6, 24, [{ type: 'glaze' }, { type: 'crate' }], [
        'xxxxxxxx', 'xKKKKKKx', 'xxxxxxxx', 'XYxxxxYX', 'XYxxxxYX', 'xxxxxxxx', 'xKKKKKKx', 'xxxxxxxx'],
        'Gitter, Glasur und Kisten versperren den Pfad zu den Baumhäusern, also räume alles fort!',
        'Der Pfad ist frei, und die Baumhäuser winken mit ihren Laternen.'),
      level(8, 6, 22, [{ type: 'glaze' }, { type: 'collect', color: 4, target: 26 }], [
        'xxxxxxxx', 'x1I11I1x', 'xxxxxxxx', 'xZxxxxZx', 'xZxxxxZx', 'xxxxxxxx', 'x1I11I1x', 'xxxxxxxx'],
        'Glasur und Eis kleben rund um die Kisten, und außerdem brauchen wir 26 Bonbons in Violett.',
        'Wunderbar, die Kaugummiblüten leuchten violett in der Nacht.'),
      level(9, 6, 26, [{ type: 'crate' }, { type: 'glaze' }], [
        '.xxxxxx.', 'xKKZZKKx', 'xIxCCxIx', 'x222222x', 'xxxxxxxx', 'xIxCCxIx', 'xYYxxYYx', '.xxxxxx.'],
        'Kurz vor Blubbas Teich kommt alles zusammen: Kisten, Lakritz, Eis, Glasur und Schokolade.',
        'Der Weg zum Teich ist frei, und es blubbert schon.'),
      // Bosskampf gegen die Kaugummi-Krake Blubba: zwei Glasurstreifen liegen schon am Anfang.
      { id: 'w4-10', boss: true, colors: 6, moves: 40, layout: [
        'xxxxxxxx', 'xxxxxxxx', 'xx1111xx', 'xxxxxxxx', 'xxxxxxxx', 'xx1111xx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Mitten im Teich taucht die Kaugummi-Krake Blubba auf und lässt eine riesige Blase wachsen.',
        win: 'Blubba ist besiegt, und der ganze Dschungel duftet wieder süß!' }
    ]
  });
})(window.RS = window.RS || {});
