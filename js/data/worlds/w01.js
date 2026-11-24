(function (RS) {
  'use strict';

  var ALL = ['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'];

  // Welt 1 (Kandishain). Seeds: 1000 + alte Level-Nummer.
  function level(n, colors, moves, goals, layout, intro, win) {
    var id = 'w1-' + ('0' + n).slice(-2);
    return { id: id, seed: 1000 + n, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
  }

  RS.Worlds.register({
    id: 1, key: 'kandishain', name: 'Kandishain', novelty: null,
    intro: [
      'Willkommen in Kandishain, dem Zuckerdorf! Früher strahlten hier alle Häuser in den bunten Farben der Bonbons.',
      'Dann kam ein Zauber: Zuckerglasur und Lakritz haben das ganze Dorf eingehüllt, und das Leuchten ist erloschen.',
      'Ich bin Annika, die Zuckerfee. Ich bleibe an deiner Seite!',
      'Gemeinsam bringen wir Haus für Haus das Licht zurück. Los geht es!'
    ],
    chapterEnd: [
      'Sieh nur, das Kristallbonbon auf dem Dorfplatz glüht wieder!',
      'Graf Lakritz flieht durch das alte Tor, und dabei fällt ein Sternsplitter von seinem Umhang.',
      'Kandishain dankt dir, doch hinter dem Tor warten die Frostzuckerberge, und unsere Reise geht weiter!'
    ],
    gateLocked: 'Besiege Graf Lakritz, um das Tor zu öffnen.',
    // Fröhlich, Dur, Glockenspiel über gezupftem Bass, mittleres Tempo.
    music: {
      tempo: 112, root: 72, scale: [0, 2, 4, 5, 7, 9, 11], lead: 'bell',
      bass: [0, null, null, 4, null, null, 0, null, 0, null, null, 4, null, null, 4, null],
      drums: 'k.h.s.h.k.k.s.h.',
      melodies: [
        [0, null, 2, null, 4, null, 2, null, 4, null, 5, 4, 2, null, null, null],
        [4, null, 4, 5, 7, null, 4, null, 5, null, 4, null, 2, null, 0, null],
        [7, null, 6, null, 5, null, 4, null, 2, null, 4, null, 1, null, null, null]
      ]
    },
    boss: {
      key: 'lakritz', name: 'Graf Lakritz', hp: 520, weak: [0, 3], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'lock', count: 3 },
        { every: 2, kind: 'lock', count: 3, row: 4 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Hoho, wer wagt es, meinen schönen Lakritzzauber zu stören?' },
          { who: 'annika', text: 'Wir holen das Licht nach Kandishain zurück, Graf Lakritz!' },
          { who: 'boss', text: 'Dann fangt euch in meinen Gittern, ihr Zuckerschnecken!' },
          { who: 'annika', text: 'Rote Bonbons treffen ihn besonders hart, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Genug gespielt, jetzt wird mein Lakritz richtig zäh!' },
          { who: 'annika', text: 'Er ist angeschlagen, jetzt hilft Blau am meisten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Das ist nicht das Ende, meine Herrin wird sich rächen!' },
          { who: 'annika', text: 'Seine Herrin, wen meint er nur damit?' }
        ]
      }
    },
    levels: [
      level(1, 5, 20, [{ type: 'score', target: 3000 }], ALL,
        'Tauscht zwei Nachbarn, bis drei gleiche Bonbons in einer Reihe liegen. Sammle so viele Punkte, wie du kannst!',
        'Wunderbar! Das erste Haus leuchtet wieder.'),
      level(2, 5, 18, [{ type: 'score', target: 4000 }], [
        '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.'],
        'Hier fehlen ein paar Ecken im Spielfeld. Das macht nichts, du findest trotzdem deinen Weg.',
        'Das zweite Haus funkelt! Kandishain wird heller.'),
      level(3, 5, 18, [{ type: 'collect', color: 0, target: 25 }], ALL,
        'Neue Spezialbonbons: Vier in einer Reihe ergeben ein Streifen-Bonbon, L oder T eine Bombe, fünf eine Farbkugel. Sammle 25 Bonbons in Rot!',
        'Das dritte Haus erstrahlt in Rot und Gold!'),
      level(4, 6, 22, [{ type: 'collect', color: 3, target: 20 }, { type: 'collect', color: 1, target: 20 }], [
        '..xxxx..', '..xxxx..', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '..xxxx..', '..xxxx..'],
        'Heute brauchen wir Blau und Gelb: je 20 Bonbons in Blau und in Gelb.',
        'Schau nur, das vierte Haus blinzelt dir zu!'),
      level(5, 6, 24, [{ type: 'score', target: 6000 }, { type: 'collect', color: 2, target: 25 }], ALL,
        'Sammle 25 Bonbons in Grün und fülle nebenbei dein Punktekonto. Du schaffst das!',
        'Das fünfte Haus glitzert wie frischer Tau.'),
      level(6, 6, 20, [{ type: 'glaze' }], [
        'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '11111111', '11111111', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Achtung, Zuckerglasur! Löse ein Bonbon auf ihrem Feld auf oder triff sie mit einem Spezialbonbon, dann springt sie ab (dicke Glasur braucht zwei Treffer).',
        'Die Glasur zerspringt, und das sechste Haus leuchtet wieder!'),
      level(7, 6, 25, [{ type: 'glaze' }], [
        'xxxxxxxx', 'x111111x', 'x122221x', 'x122221x', 'x122221x', 'x122221x', 'x111111x', 'xxxxxxxx'],
        'Die Mitte steckt unter dicker Glasur: Dort musst du zweimal ran. Geduld, kleiner Zuckerstern!',
        'Mitten im Dorf funkelt jetzt das siebte Haus.'),
      level(8, 6, 32, [{ type: 'glaze' }, { type: 'collect', color: 4, target: 20 }], [
        'LLLLLLLL', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', '11111111', '11111111', 'xxxxxxxx'],
        'Das Lakritzgitter hält ein Bonbon fest, bis du es in einer Reihe auflöst oder ein Spezialbonbon das Feld trifft. Sammle außerdem 20 Bonbons in Violett!',
        'Das Gitter ist geknackt! Das achte Haus strahlt.'),
      level(9, 6, 47, [{ type: 'glaze' }, { type: 'collect', color: 1, target: 10 }], [
        '.KKKKKK.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.xxxxxx.', '.111111.', '.111111.'],
        'Der Zauber wird stärker: Oben Lakritz, unten Glasur. Löse alles auf und sammle 10 Bonbons in Gelb!',
        'Fast geschafft! Das neunte Haus leuchtet warm.'),
      // Bosskampf gegen Graf Lakritz: freies Feld, das Lakritzgitter bringt er selbst mit.
      { id: 'w1-10', seed: 1010, boss: true, colors: 6, moves: 36, layout: ALL,
        intro: 'Auf dem Dorfplatz wartet Graf Lakritz, der den Zauber über das Dorf gelegt hat: Triff ihn mit vielen Bonbons, am liebsten in seiner Schwachstellen-Farbe!',
        win: 'Graf Lakritz ist besiegt, und das zehnte Haus erstrahlt wieder!' }
    ]
  });
})(window.RS = window.RS || {});
