(function (RS) {
  'use strict';

  // Welt 2 (Frostzuckerberge): Züge und Zielmengen aus dem Balancing-Simulator (README, Abschnitt Balancing).
  // Seeds: 1000 + alte Level-Nummer (11..20).
  function level(n, colors, moves, goals, layout, intro, win) {
    var p = n - 10;
    return { id: 'w2-' + ('0' + p).slice(-2), seed: 1000 + n, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
  }

  RS.Worlds.register({
    id: 2, key: 'frostzuckerberge', name: 'Frostzuckerberge', novelty: null,
    intro: [
      'Hinter dem alten Tor liegen die Frostzuckerberge. Hier ist Graf Lakritz hingeflohen.',
      'Auch hier ist das Leuchten erloschen. Eis und Schokolade bedecken die Hänge.',
      'Ganz oben im Eispalast wohnt Eiskönigin Kandara. Ich glaube, sie steckt hinter allem!',
      'Bleib dicht bei mir, es wird kalt. Gemeinsam bringen wir das Licht auch hierher!'
    ],
    chapterEnd: [
      'Kandaras Eis ist geschmolzen, und auf dem Gipfel funkelt ein zweites Kristallbonbon.',
      'Mit letzter Kraft flüstert Kandara, dass ihr Meister, der Bitterkönig Amarus, dich nie in Ruhe lassen wird.',
      'In beiden Welten leuchten jetzt alle Häuser, doch ich ahne, dass unsere Reise erst beginnt!'
    ],
    gateLocked: 'Besiege Eiskönigin Kandara, um das Tor zu öffnen.',
    // Ruhig und glitzernd, Lydisch, weiche Flächen mit hohen Glöckchen, langsamer.
    music: {
      tempo: 84, root: 62, scale: [0, 2, 4, 6, 7, 9, 11], lead: 'pad',
      bass: [0, null, null, null, null, null, null, null, 4, null, null, null, null, null, null, null],
      drums: 'k...h...s...h..h',
      melodies: [
        [0, null, null, null, 4, null, null, null, 3, null, null, null, 2, null, null, null],
        [4, null, null, null, 5, null, null, null, 4, null, null, null, 1, null, null, null],
        [7, null, null, null, 6, null, 4, null, 3, null, null, null, 4, null, null, null]
      ]
    },
    boss: {
      key: 'kandara', name: 'Eiskönigin Kandara', hp: 625, weak: [1, 4], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'glaze', count: 3, level: 2 },
        { every: 2, kind: 'ice', count: 3, level: 2 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Ihr habt meinen Grafen verjagt, wie niedlich.' },
          { who: 'annika', text: 'Dann steckst du hinter dem Zauber über Kandishain, Kandara!' },
          { who: 'boss', text: 'Ganz recht, und bald friert jede Farbe in beiden Welten ein.' },
          { who: 'annika', text: 'Nicht mit uns, Gelb bringt ihr Eis zum Bröckeln!' }
        ],
        phase2: [
          { who: 'boss', text: 'Spürt den Frost, ich lasse alles zu Eis erstarren!' },
          { who: 'annika', text: 'Ihre Krone bekommt Risse, jetzt hilft Violett!' }
        ],
        defeat: [
          { who: 'boss', text: 'Meine Krone schmilzt, wie kann das sein?' },
          { who: 'annika', text: 'Gegen so viel Mut hilft eben kein Eis der Welt!' }
        ]
      }
    },
    levels: [
      level(11, 6, 21, [{ type: 'score', target: 5200 }], [
        '...xx...', '..xxxx..', '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Willkommen in den Frostzuckerbergen, hier glitzert alles vor Kälte: Sammle Punkte, damit uns warm wird!',
        'Die erste Berghütte leuchtet, und der Schnee funkelt mit ihr.'),
      level(12, 6, 24, [{ type: 'collect', color: 3, target: 25 }, { type: 'collect', color: 4, target: 25 }], [
        'xxx..xxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.', '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxx..xxx'],
        'Der Gletscher schimmert in kühlen Farben, deshalb brauchen wir je 25 Bonbons in Blau und in Violett.',
        'Prima, der Gletscher glänzt wieder in seinen schönsten Farben!'),
      level(13, 6, 20, [{ type: 'collect', color: 2, target: 26 }], [
        'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xIIxxIIx', 'xIIxxIIx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Neu ist Eis: Ein vereistes Bonbon taut auf, wenn du daneben eine Reihe auflöst, und nebenbei sammelst du 26 Bonbons in Grün.',
        'Das Eis ist geschmolzen, und die Tannen am Hang leuchten grün.'),
      level(14, 6, 22, [{ type: 'glaze' }], [
        'xxxxxxxx', 'xx1111xx', 'I122221I', 'I122221I', 'I122221I', 'I122221I', 'xx1111xx', 'xxxxxxxx'],
        'Die Glasur ist zurück und liegt mitten zwischen den Eisbonbons, also befreie alle Felder davon!',
        'Glasur und Eis sind weg, und der Bergsee glitzert wieder.'),
      level(15, 6, 21, [{ type: 'collect', color: 1, target: 24 }], [
        'xxxxxxxx', 'xLxxxxLx', 'xxJxxJxx', 'xxxJJxxx', 'xxxJJxxx', 'xxJxxJxx', 'xLxxxxLx', 'xxxxxxxx'],
        'Dickes Eis braucht zwei Treffer, und Lakritzgitter halten die Ecken fest, doch du sammelst trotzdem 24 Bonbons in Gelb.',
        'Das dicke Eis ist geknackt, und die Bergsonne lacht dir zu!'),
      level(16, 6, 20, [{ type: 'choco' }], [
        'xxxxxxxx', 'xxxxxxxx', 'xCCCCCCx', 'xCCxxCCx', 'xCCxxCCx', 'xCCCCCCx', 'xxxxxxxx', 'xxxxxxxx'],
        'Achtung, Schokolade: Sie wächst jeden Zug ein Stück, wenn du keine davon entfernst, also löse direkt daneben Reihen auf!',
        'Keine Schokolade mehr weit und breit, und die Hütte am Pass strahlt.'),
      level(17, 6, 24, [{ type: 'choco' }], [
        'xxxxxxxx', 'xIxxxxIx', 'ICCCCCCI', 'xCxIIxCx', 'xCxIIxCx', 'ICCCCCCI', 'xIxxxxIx', 'xxxxxxxx'],
        'Die Schokolade versteckt sich zwischen Eisbonbons, und erst wenn alle Schokolade verschwunden ist, haben wir es geschafft.',
        'Eis und Schokolade sind besiegt, und der Wasserfall glitzert wie Kandis.'),
      level(18, 6, 23, [{ type: 'choco' }, { type: 'glaze' }, { type: 'collect', color: 0, target: 20 }], [
        'xxxxxxxx', 'x111111x', 'x1CCCC1x', 'xxxxxxxx', 'xxxxxxxx', 'x1CCCC1x', 'x111111x', 'xxxxxxxx'],
        'Glasur und Schokolade versperren den Weg zur Seilbahn, und außerdem brauchen wir 20 Bonbons in Rot.',
        'Wunderbar, die Seilbahn zum Gipfel leuchtet wieder!'),
      level(19, 6, 34, [{ type: 'glaze' }, { type: 'choco' }], [
        '.xxxxxx.', 'xLxCCxLx', 'xIxCCxIx', 'x1J22J1x', 'x1J22J1x', 'xIxCCxIx', 'xKxCCxKx', '.xxxxxx.'],
        'Kurz vor dem Gipfel kommt alles zusammen: Eis, Lakritz, Glasur und Schokolade.',
        'Der Weg zum Eispalast ist frei, und Kandara wartet schon.'),
      // Bosskampf gegen Eiskönigin Kandara: ein paar Glasurfelder liegen schon am Anfang.
      { id: 'w2-10', seed: 1020, boss: true, colors: 6, moves: 40, layout: [
        'xxxxxxxx', 'xxxxxxxx', 'xx1xx1xx', 'xxxxxxxx', 'xxxxxxxx', 'xx1xx1xx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Auf dem Gipfel thront Eiskönigin Kandara, die hinter dem ganzen Zauber steckt: Zeig ihr, wie stark süße Farben sind!',
        win: 'Kandara ist besiegt, und der Eispalast schmilzt zu glitzerndem Zuckerwasser!' }
    ]
  });
})(window.RS = window.RS || {});
