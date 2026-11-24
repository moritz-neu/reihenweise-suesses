(function (RS) {
  'use strict';

  // Welt 7 (Knallhafen): Neuheit Knallbonbons (Layout-Zeichen F, Levelfeld fuses {start, spawnEvery}).
  // Jedes Level hat Knallbonbons, entweder mit einem Ziel fuse oder als Gefahr neben anderen Zielen.
  // Der Startzähler sinkt von 12 (früh) auf 8 (spät), neue Knallbonbons kommen alle 6 bis 3 Züge.
  // w7-05 (Kirschen) spielt mit fünf Farben, alle anderen mit sechs.
  // Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, fuses, intro, win, cherries) {
    var def = { id: 'w7-' + ('0' + p).slice(-2), colors: colors, moves: moves, goals: goals, layout: layout, fuses: fuses,
      intro: intro, win: win };
    if (cherries) { def.cherries = cherries; }
    return def;
  }

  RS.Worlds.register({
    id: 7, key: 'knallhafen', name: 'Knallhafen', novelty: { kind: 'mechanic', key: 'fuse' },
    intro: [
      'Hinter dem Zuckerwattetor liegt der Knallhafen am Brausemeer. Bunte Schiffe bringen hier Feuerwerk aus Zucker an Land.',
      'Neu sind Knallbonbons: Sie tragen einen Zähler, der nach jedem Zug um eins sinkt.',
      'Löse sie in einer Reihe auf, dann sind sie entschärft. Fällt ein Zähler auf null, knallt es, und das Level ist verloren!',
      'Dann helfen „+5 Züge“, denn sie geben auch jedem Knallbonbon fünf Züge mehr. Am Leuchtturm lauert schon Kapitän Knallfrosch!'
    ],
    chapterEnd: [
      'Kapitän Knallfrosch zieht seinen Hut und quakt, dass er nie wieder für Amarus knallen will.',
      'Er überreicht Annika eine alte Seekarte, die den Weg über das Bittermeer zur Bitterburg zeigt.',
      'In der Kartenrolle steckt ein Sternsplitter, der orange wie ein Leuchtfeuer glüht!'
    ],
    gateLocked: 'Besiege Kapitän Knallfrosch, um das Tor zu öffnen.',
    // Seemannslied im wiegenden Sechsachteltakt, äolisch, mit hellem Chiptune-Lead.
    music: {
      tempo: 126, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], lead: 'chip',
      bass: [0, null, null, 4, null, null, 0, null, 3, null, null, 4, null, null, 0, null],
      drums: 'k..h..s..k..s.h.',
      melodies: [
        [7, null, null, 9, null, 10, 11, null, 10, 9, null, 7, 8, null, 7, null],
        [4, null, 7, 7, null, 9, 10, null, 9, 7, null, 6, 7, null, null, null],
        [11, null, 10, 9, null, 7, 8, null, 9, 10, null, 9, 7, null, null, null]
      ]
    },
    boss: {
      key: 'knallfrosch', name: 'Kapitän Knallfrosch', hp: 700, weak: [5, 1], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'fuse', count: 2, level: 7 },
        [{ every: 2, kind: 'fuse', count: 2, level: 5 }, { kind: 'crate', count: 2, level: 1 }]],
      story: {
        intro: [
          { who: 'boss', text: 'Quak, wer schippert da ungefragt in meinen Hafen?' },
          { who: 'annika', text: 'Wir holen die Süße zurück in den Knallhafen, Kapitän Knallfrosch!' },
          { who: 'boss', text: 'Dann werfe ich euch meine Knallbonbons an Deck!' },
          { who: 'annika', text: 'Bonbons in Orange löschen seine Lunten am besten, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Volle Breitseite, jetzt fliegen Knallbonbons und Kisten zugleich!' },
          { who: 'annika', text: 'Entschärfe die Knallbonbons schnell, und jetzt trifft ihn Gelb am härtesten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Quak, meine Knallbonbons sind nass und zischen nur noch!' },
          { who: 'annika', text: 'Jetzt knallt im Knallhafen nur noch das Feuerwerk zum Fest!' }
        ]
      }
    },
    levels: [
      level(1, 6, 15, [{ type: 'fuse', target: 6 }], [
        'xxxxxxxx', 'xFxxxxFx', 'xxxxxxxx', 'xxxFFxxx', 'xxxxxxxx', 'xFxxxxFx', 'xxxxxxxx', '..xxxx..'],
        { start: 12, spawnEvery: 0 },
        'Auf dem Kai liegen sechs Knallbonbons, also löse sie in Reihen auf, bevor ihr Zähler null erreicht!',
        'Alle Knallbonbons sind entschärft, und die Möwen jubeln.'),
      level(2, 6, 19, [{ type: 'collect', color: 0, target: 30 }], [
        'xxx..xxx', 'xLxxxxLx', 'xxxFxxxx', 'xxxxxxxx', 'LxxxxxxL', 'xxxxFxxx', 'xLxxxxLx', 'xxxxxxxx'],
        { start: 12, spawnEvery: 6 },
        'Lakritzpoller halten die Schiffe fest, und wir sammeln 30 Bonbons in Rot, bevor ein Knallbonbon zündet.',
        'Prima, die roten Bonbons sind an Bord.'),
      level(3, 6, 22, [{ type: 'glaze' }, { type: 'fuse', target: 5 }], [
        '.xxxxxx.', 'xx2xx2xx', 'x2FxxF2x', 'x212212x', 'x212212x', 'x2xxxx2x', 'xxxFFxxx', '.xxxxxx.'],
        { start: 11, spawnEvery: 5 },
        'Glasur klebt an den Planken, und fünf Knallbonbons wollen entschärft werden.',
        'Die Planken glänzen, und kein Knallbonbon hat gezündet.'),
      level(4, 6, 28, [{ type: 'crate' }], [
        'xxxxxxxx', 'xYxFFxYx', 'xZxxxxZx', 'xxYXXYxx', 'xxYXXYxx', 'xZxxxxZx', 'xYxxxxYx', 'xxxxxxxx'],
        { start: 11, spawnEvery: 5 },
        'Lebkuchenkisten stapeln sich am Kai, also brich sie auf und behalte die Knallbonbons im Blick!',
        'Alle Kisten sind offen, und die Ladung ist gerettet.'),
      level(5, 5, 16, [{ type: 'cherry', target: 3 }, { type: 'fuse', target: 4 }], [
        'xxxRRxxx', 'xxxxxxxx', 'xFxxxxFx', 'xx1xx1xx', 'xx1xx1xx', 'xxxxxxxx', 'xxFxxFxx', 'xxxxxxxx'],
        { start: 10, spawnEvery: 5 },
        'Kirschen sind auf das Schiff gerollt, also bring drei heim und entschärfe vier Knallbonbons!',
        'Die Kirschen sind im Korb, und der Hafen duftet süß.',
        { total: 3, onBoard: 2 }),
      level(6, 6, 16, [{ type: 'choco' }], [
        'xxxxxxxx', 'xCCxxCCx', 'xCCxxCCx', 'xxxFFxxx', 'xFxxxxFx', 'xCCxxCCx', 'xCCxxCCx', 'xxxxxxxx'],
        { start: 9, spawnEvery: 3 },
        'Bittere Schokolade quillt aus den Fässern, also entferne sie, bevor ein Knallbonbon zündet!',
        'Keine Schokolade mehr, und die Fässer duften wieder süß.'),
      level(7, 6, 19, [{ type: 'score', target: 6000 }, { type: 'fuse', target: 4 }], [
        '..xxxx..', '.xIxxIx.', 'xxxFFxxx', 'xIxxxxIx', 'xIxxxxIx', 'xxxxxxxx', '.xJxxJx.', '..xxxx..'],
        { start: 9, spawnEvery: 4 },
        'Eis hält die Boote fest, und wir brauchen 6000 Punkte und vier entschärfte Knallbonbons.',
        'Das Eis ist geschmolzen, und die Boote schaukeln frei.'),
      level(8, 6, 23, [{ type: 'glaze' }, { type: 'crate' }], [
        '.xxxxxx.', 'xKxZZxKx', 'x1xFFx1x', 'x2xxxx2x', 'x2xxxx2x', 'x1xxxx1x', 'xKxYYxKx', '.xxxxxx.'],
        { start: 9, spawnEvery: 4 },
        'Kisten, Lakritz und dicke Glasur versperren den Leuchtturm, also räume alles fort!',
        'Der Leuchtturm ist frei, und sein Licht strahlt über das Meer.'),
      level(9, 6, 24, [{ type: 'collect', color: 5, target: 20 }, { type: 'fuse', target: 5 }], [
        'xxx..xxx', 'xLxFFxLx', 'xIxxxxIx', 'xxxxxxxx', 'xxFxxFxx', 'xIxxxxIx', 'xLxxxxLx', 'xxx..xxx'],
        { start: 8, spawnEvery: 3 },
        'Kurz vor Knallfroschs Schiff sammeln wir 20 Bonbons in Orange und entschärfen fünf Knallbonbons.',
        'Der Weg zum Piratenschiff ist frei, und an Deck zischt es schon.'),
      // Bosskampf gegen Kapitän Knallfrosch: offenes Deck, die Knallbonbons wirft er selbst.
      { id: 'w7-10', boss: true, colors: 6, moves: 40, layout: [
        '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.'],
        intro: 'Auf seinem knallbunten Schiff schwenkt Kapitän Knallfrosch eine glimmende Lunte.',
        win: 'Knallfrosch ist besiegt, und über dem Knallhafen leuchtet ein Feuerwerk!' }
    ]
  });
})(window.RS = window.RS || {});
