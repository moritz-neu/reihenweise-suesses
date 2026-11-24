(function (RS) {
  'use strict';

  // Welt 5 (Kirschgarten Morellia): Neuheit Kirschen (Layout-Zeichen R, Levelfeld cherries).
  // Jedes Level hat 2 bis 4 Kirschen und ein Kirschenziel über alle Kirschen, dazu bekannte
  // Hindernisse und Ziele. Fünf Farben, damit Kirschen oft genug fallen (der Boss kämpft mit sechs).
  // Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win, cherries) {
    var def = { id: 'w5-0' + p, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
    if (cherries) { def.cherries = cherries; }
    return def;
  }

  RS.Worlds.register({
    id: 5, key: 'kirschgarten', name: 'Kirschgarten Morellia', novelty: { kind: 'mechanic', key: 'cherry' },
    intro: [
      'Hinter dem Kaugummitor blüht der Kirschgarten Morellia. Unter rosa Blüten reifen hier die süßesten Kirschen.',
      'Neu sind Kirschen: Sie liegen statt eines Bonbons auf dem Feld und gehören nie zu einer Reihe.',
      'Löse Reihen unter einer Kirsche auf, dann fällt sie nach unten. Erreicht sie den Boden, landet sie in unserem Korb!',
      'Doch über den Bäumen kreist die Krähe Krawalla. Pass gut auf unsere Kirschen auf!'
    ],
    chapterEnd: [
      'Krawalla plustert ihre zerzausten Federn und gibt zu, dass sie die Späherin von Amarus war.',
      'Sie krächzt, dass Amarus nichts so sehr fürchtet wie die Sternenkrone.',
      'Dann lässt sie einen Sternsplitter fallen, der rot wie eine reife Kirsche funkelt!'
    ],
    gateLocked: 'Besiege die Krähe Krawalla, um das Tor zu öffnen.',
    // Dorisch, gezupfte Melodie, wiegender Gartenrhythmus.
    music: {
      tempo: 104, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], lead: 'pluck',
      bass: [0, null, null, null, 4, null, null, null, 3, null, null, null, 4, null, 5, null],
      drums: 'k...h.s.k.h.s..h',
      melodies: [
        [4, null, 5, null, 7, null, 5, 4, 2, null, 3, null, 4, null, null, null],
        [7, null, 8, 7, 5, null, 4, null, 5, null, 2, null, 3, 2, 0, null],
        [0, 2, 4, null, 5, null, 4, 2, 3, null, null, 5, 4, null, null, null]
      ]
    },
    boss: {
      key: 'krawalla', name: 'Krähe Krawalla', hp: 620, weak: [0, 2], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'glaze', count: 3, level: 2 },
        { every: 2, kind: 'lock', count: 2, row: 6 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Krah, krah, wer pflückt da meine Kirschen?' },
          { who: 'annika', text: 'Die Kirschen gehören dem ganzen Garten, Krawalla!' },
          { who: 'boss', text: 'Dann klebe ich jeden Ast mit dicker Glasur zu!' },
          { who: 'annika', text: 'Rote Bonbons zausen ihr Gefieder am meisten, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Krah, jetzt sperre ich ganze Reihen hinter Lakritz!' },
          { who: 'annika', text: 'Ihre Federn sträuben sich, jetzt trifft Grün sie am härtesten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Krah, meine schönen Federn sind ganz zerzaust!' },
          { who: 'annika', text: 'Jetzt dürfen die Kirschen im Garten wieder in Ruhe reifen!' }
        ]
      }
    },
    levels: [
      level(1, 5, 16, [{ type: 'cherry', target: 3 }], [
        'xxRxxRxx', 'xxxxxxxx', 'xxxRxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Reife Kirschen hängen oben im Garten, also löse Reihen unter ihnen auf, bis alle drei unten im Korb liegen!',
        'Drei Kirschen liegen im Korb, und das erste Gartenhaus leuchtet.'),
      level(2, 5, 18, [{ type: 'cherry', target: 3 }, { type: 'collect', color: 0, target: 22 }], [
        '.xRxxRx.', 'xxxxxxxx', 'xxxxxxxx', 'xLxxxxLx', 'xLxxxxLx', 'xxxxxxxx', 'xxxxxxxx', '.xxxxxx.'],
        'Zwischen Lakritzpfählen hängen zwei Kirschen, eine dritte fällt noch vom Baum, und dazu sammeln wir 22 Bonbons in Rot.',
        'Prima, der Korb füllt sich mit roten Kirschen.',
        { total: 3, onBoard: 2 }),
      level(3, 5, 19, [{ type: 'cherry', target: 3 }, { type: 'glaze' }], [
        'xRxxxRxx', 'xxxRxxxx', 'xxxxxxxx', 'x111111x', 'x111111x', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Glasur klebt auf den Wegen zwischen den Bäumen, also löse sie und bring drei Kirschen in den Korb!',
        'Die Wege glänzen, und die Kirschen sind sicher im Korb.'),
      level(4, 5, 21, [{ type: 'cherry', target: 3 }, { type: 'crate' }], [
        'xxRxxRxx', 'xxxxxxxx', 'xxxxxxxx', 'XXxxxxXX', 'xxxXXxxx', 'xxxXXxxx', 'YXxxxxXY', 'xxxxxxxx'],
        'Lebkuchenkisten stehen unter den Bäumen, also brich sie auf, während die Kirschen an ihnen vorbei in den Korb fallen!',
        'Alle Kisten sind offen, und die Kirschen purzeln in den Korb.',
        { total: 3, onBoard: 2 }),
      level(5, 5, 25, [{ type: 'cherry', target: 4 }, { type: 'score', target: 5000 }], [
        'xxRxxRxx', 'xxxxxxxx', 'xLLxxLLx', 'xxxxxxxx', 'xxxxxxxx', 'xLLxxLLx', 'xxxxxxxx', 'xxxxxxxx'],
        'Lakritz hängt in den Ästen, und neben vier Kirschen brauchen wir 5000 Punkte.',
        'Wunderbar, die Äste wiegen sich wieder frei im Wind.',
        { total: 4, onBoard: 2 }),
      level(6, 5, 20, [{ type: 'cherry', target: 3 }, { type: 'choco' }], [
        'xxRxxRxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxCCxxx', 'xxCxxCxx', 'xxxxxxxx', 'CxxxxxxC', 'CCxxxxCC'],
        'Schokolade wuchert über die Wiese, also entferne sie ganz und sammle dabei drei Kirschen!',
        'Keine Schokolade mehr, und die Wiese blüht wieder.',
        { total: 3, onBoard: 2 }),
      level(7, 5, 22, [{ type: 'cherry', target: 4 }, { type: 'collect', color: 1, target: 24 }], [
        'xxxRxxxx', 'xxxxxxxx', 'IIxxxxII', 'xxIJJIxx', 'xxxxxxxx', 'IxxxxxxI', 'xxxxxxxx', 'xxxxxxxx'],
        'Eis hält die Blüten fest, also sammle 24 Bonbons in Gelb und vier Kirschen!',
        'Das Eis ist geschmolzen, und die Blüten duften süß.',
        { total: 4, onBoard: 2 }),
      level(8, 5, 24, [{ type: 'cherry', target: 4 }, { type: 'glaze' }], [
        'xxRxxRxx', 'xxxxxxxx', 'x2KxxK2x', 'xxxxxxxx', 'xxxxxxxx', 'x2KxxK2x', 'xxxxxxxx', 'xxxxxxxx'],
        'Glasur und Lakritz kleben an den Zweigen, also räume sie fort und bring vier Kirschen heim!',
        'Die Zweige sind frei, und die Bienen summen wieder.',
        { total: 4, onBoard: 2 }),
      level(9, 5, 26, [{ type: 'cherry', target: 4 }, { type: 'crate' }, { type: 'glaze' }], [
        '.xRxxRx.', 'xxxxxxxx', 'xYxCCxYx', 'x222222x', 'xxxxxxxx', 'xIxXXxIx', 'xxxxxxxx', '.xxxxxx.'],
        'Kurz vor Krawallas Nest kommt alles zusammen: Kisten, Glasur, Eis, Schokolade und vier Kirschen.',
        'Der Weg zum Nest ist frei, und von oben krächzt es schon.',
        { total: 4, onBoard: 2 }),
      // Bosskampf gegen die Krähe Krawalla: zwei Kirschen hängen noch, ein Glasurstreifen liegt schon.
      { id: 'w5-10', boss: true, colors: 6, moves: 40, layout: [
        'xRxxxxRx', 'xxxxxxxx', 'xxxxxxxx', 'xx1111xx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Auf dem höchsten Kirschbaum hockt die Krähe Krawalla und schlägt wütend mit den Flügeln.',
        win: 'Krawalla ist besiegt, und der ganze Kirschgarten blüht wieder!' }
    ]
  });
})(window.RS = window.RS || {});
