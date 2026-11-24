(function (RS) {
  'use strict';

  // Welt 9 (Schillerbucht): Neuheit Chamäleon-Bonbons (Layout-Zeichen H, Levelfeld chameleons {spawnEvery}).
  // Ein Chamäleon wechselt nach jedem Zug zur nächsten Farbe und zählt für die Farbe, die es gerade
  // zeigt. Jedes Level hat Chamäleons und ein Sammelziel, dazu kommen alle bekannten Mechaniken:
  // Glasur, Lakritz, Eis, Schokolade, Kisten, Kirschen und Knallbonbons.
  // w9-05 (Kirschen) spielt mit fünf Farben, alle anderen mit sechs.
  // Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, chameleons, intro, win, extra) {
    var def = { id: 'w9-' + ('0' + p).slice(-2), colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
    if (chameleons) { def.chameleons = chameleons; }
    if (extra) { Object.keys(extra).forEach(function (k) { def[k] = extra[k]; }); }
    return def;
  }

  RS.Worlds.register({
    id: 9, key: 'schillerbucht', name: 'Schillerbucht', novelty: { kind: 'mechanic', key: 'chameleon' },
    intro: [
      'Hinter dem Marzipanschloss öffnet sich die Schillerbucht, in der das Wasser in allen Farben schimmert. Hier beginnt der Seeweg zur Bitterburg.',
      'Neu sind Chamäleon-Bonbons: Sie wechseln nach jedem Zug ihre Farbe, immer zur nächsten.',
      'Ein Chamäleon zählt für die Farbe, die es gerade zeigt. Bring es also in eine Reihe, wenn seine Farbe gesucht ist!',
      'Eis hält ein Chamäleon fest, dann wechselt es nicht mehr. In der Tiefe der Bucht lauert schon die Seeschlange Schillerzahn!'
    ],
    chapterEnd: [
      'Schillerzahn rollt sich im seichten Wasser zusammen und gibt den Seeweg zur Bitterburg frei.',
      'Unter ihren Schuppen hat sie den letzten Sternsplitter bewacht, der in allen Farben schillert!',
      'Annika fügt die neun Sternsplitter zur Sternenkrone zusammen, und am Horizont fällt der Schatten von Amarus auf das Meer.'
    ],
    gateLocked: 'Besiege die Seeschlange Schillerzahn, um das Tor zu öffnen.',
    // Fröhlicher Calypso am Strand, mixolydisch, mit Marimba und Steeldrum-Rhythmus.
    music: {
      tempo: 116, root: 60, scale: [0, 2, 4, 5, 7, 9, 10], lead: 'marimba',
      bass: [0, null, null, 4, null, null, 4, null, 3, null, null, 0, null, 4, null, null],
      drums: 'k..hk.s.k..hk.sh',
      melodies: [
        [7, null, 9, 11, null, 9, 11, null, 13, null, 11, 9, 10, null, 7, null],
        [11, null, 11, 13, null, 11, 9, null, 10, 9, null, 7, 9, null, null, null],
        [4, null, 6, 7, null, 7, 9, null, 6, null, 7, 6, 4, null, null, null]
      ]
    },
    boss: {
      key: 'schillerzahn', name: 'Seeschlange Schillerzahn', hp: 990, weak: [2, 3], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'chameleon', count: 3 },
        [{ every: 2, kind: 'chameleon', count: 2 }, { kind: 'ice', count: 2, level: 2 }]],
      story: {
        intro: [
          { who: 'boss', text: 'Zisch, wer wagt sich in meine schillernde Bucht?' },
          { who: 'annika', text: 'Wir brauchen den Seeweg zur Bitterburg, Schillerzahn!' },
          { who: 'boss', text: 'Dann färbe ich eure Bonbons um, bis ihr keine Farbe mehr erkennt!' },
          { who: 'annika', text: 'Grüne Bonbons treffen ihre Schuppen am härtesten, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Jetzt friere ich die Bucht ein und lasse noch mehr Bonbons schillern!' },
          { who: 'annika', text: 'Eis hält die Chamäleons fest, und jetzt trifft Blau die Seeschlange am härtesten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Zisch, meine Schuppen verlieren ihren Glanz!' },
          { who: 'annika', text: 'Jetzt schimmert die Schillerbucht wieder friedlich in allen Farben!' }
        ]
      }
    },
    levels: [
      level(1, 6, 15, [{ type: 'collect', color: 3, target: 32 }], [
        'xxxxxxxx', 'xxHxxHxx', 'xxxxxxxx', 'xHxxxxHx', 'xxxxxxxx', 'xxHxxHxx', 'xxxxxxxx', '..xxxx..'],
        null,
        'Chamäleon-Bonbons wechseln nach jedem Zug die Farbe, also fang sie, wenn sie Blau zeigen, und sammle 32 Bonbons in Blau!',
        'Prima, die Bucht schimmert blau wie das tiefe Meer.'),
      level(2, 6, 13, [{ type: 'collect', color: 0, target: 29 }, { type: 'collect', color: 1, target: 29 }], [
        'xxxxxxxx', 'xLxHHxLx', 'xxxxxxxx', 'LxHxxHxL', 'xxxxxxxx', 'xLxxxxLx', 'xxxHHxxx', 'xxxxxxxx'],
        { spawnEvery: 5 },
        'Lakritztang hängt am Strand, und wir sammeln 29 Bonbons in Rot und 29 in Gelb.',
        'Der Strand ist sauber, und die Muscheln glänzen rot und gelb.'),
      level(3, 6, 15, [{ type: 'glaze' }, { type: 'collect', color: 2, target: 25 }], [
        'x11xx11x', 'x1xHHx1x', 'xxxxxxxx', '1xHxxHx1', '1xxxxxx1', 'xxHxxHxx', 'x1xxxx1x', 'xx1111xx'],
        { spawnEvery: 5 },
        'Glasur klebt auf den Felsen der Bucht, und dazu sammeln wir 25 Bonbons in Grün.',
        'Die Felsen glänzen, und das Seegras wiegt sich grün.'),
      level(4, 6, 18, [{ type: 'crate' }, { type: 'collect', color: 5, target: 23 }], [
        'xxxxxxxx', 'xYxHHxYx', 'xZxxxxZx', 'xxHxxHxx', 'xxxxxxxx', 'xYxxxxYx', 'xZYxxYZx', 'xxxxxxxx'],
        { spawnEvery: 5 },
        'Treibgutkisten liegen am Ufer, also brich sie auf und sammle 23 Bonbons in Orange!',
        'Alle Kisten sind offen, und der Sand leuchtet orange in der Abendsonne.'),
      level(5, 5, 15, [{ type: 'cherry', target: 4 }, { type: 'collect', color: 4, target: 26 }], [
        'xxxRRxxx', 'xxxxxxxx', 'xxHxxHxx', 'xIxxxxIx', 'xxxxxxxx', 'xxHxxHxx', 'xxxxxxxx', 'xxxxxxxx'],
        { spawnEvery: 4 },
        'Kirschen schaukeln in den Wellen, also bring vier an Land und sammle 26 Bonbons in Violett!',
        'Die Kirschen sind an Land, und die Bucht glitzert violett.',
        { cherries: { total: 4, onBoard: 2 } }),
      level(6, 6, 14, [{ type: 'choco' }, { type: 'collect', color: 3, target: 27 }], [
        'xxxxxxxx', 'xCCxxCCx', 'CCxHHxCC', 'xxxIIxxx', 'xxxxxxxx', 'CCxHHxCC', 'xCCxxCCx', 'xxxxxxxx'],
        { spawnEvery: 5 },
        'Bittere Schokolade treibt in die Bucht, also entferne sie und sammle 27 Bonbons in Blau!',
        'Keine Schokolade mehr, und das Wasser ist wieder klar und blau.'),
      level(7, 6, 15, [{ type: 'collect', color: 0, target: 32 }, { type: 'fuse', target: 4 }], [
        'xxxxxxxx', 'xFxHHxFx', 'xxxxxxxx', 'xHxFFxHx', 'xxxxxxxx', 'xxHxxHxx', 'xFxxxxFx', 'xxxxxxxx'],
        { spawnEvery: 5 },
        'Am Anleger zischen Knallbonbons, also entschärfe vier und sammle 32 Bonbons in Rot!',
        'Alle Knallbonbons sind entschärft, und am Anleger ist es wieder ruhig.',
        { fuses: { start: 10, spawnEvery: 6 } }),
      level(8, 6, 14, [{ type: 'score', target: 7000 }, { type: 'collect', color: 1, target: 32 }], [
        'xxxxxxxx', 'xIxHHxIx', 'xJxxxxJx', 'xxHxxHxx', 'xxHxxHxx', 'xJxxxxJx', 'xIxxxxIx', 'xxxxxxxx'],
        { spawnEvery: 4 },
        'In der Grotte glitzert gefrorene Gischt, und wir brauchen 7000 Punkte und 32 Bonbons in Gelb.',
        'Die Grotte funkelt, und ein Lichtstrahl fällt golden ins Wasser.'),
      level(9, 6, 17, [{ type: 'glaze' }, { type: 'crate' }, { type: 'collect', color: 2, target: 28 }], [
        'xxx..xxx', 'xKxHHxKx', 'x1xYYx1x', 'xHxxxxHx', 'xxxxxxxx', 'x1xYYx1x', 'xKxxxxKx', 'xxx..xxx'],
        { spawnEvery: 4 },
        'Vor der Höhle der Seeschlange räumen wir Glasur und Kisten fort und sammeln 28 Bonbons in Grün.',
        'Der Weg zur Höhle ist frei, und aus der Tiefe schillert es unheimlich.'),
      // Bosskampf gegen die Seeschlange Schillerzahn: offene Bucht mit zwei Felsen am Grund,
      // die Chamäleons und das Eis bringt sie selbst.
      { id: 'w9-10', boss: true, colors: 6, moves: 40, layout: [
        'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.'],
        intro: 'Aus den schillernden Wellen hebt die Seeschlange Schillerzahn ihren Kopf.',
        win: 'Schillerzahn ist besiegt, und der Seeweg zur Bitterburg liegt offen vor uns!' }
    ]
  });
})(window.RS = window.RS || {});
