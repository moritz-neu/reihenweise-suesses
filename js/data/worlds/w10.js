(function (RS) {
  'use strict';

  // Welt 10 (Bitterburg), das Finale: Neuheit Joker Zauberbombe (sprengt ein Feld von 3 × 3).
  // Dichte Hindernisgruppen laden zur Zauberbombe ein; balanciert ist jedes Level ohne Joker.
  // Die Level verbinden alle Mechaniken des Spiels: Glasur, Lakritz, Eis, Schokolade, Kisten,
  // Kirschen, Knallbonbons und Chamäleons. w10-05 (Kirschen) spielt mit fünf Farben, alle
  // anderen mit sechs. Bitterkönig Amarus kämpft in drei Phasen mit je zwei Angriffen.
  // Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win, extra) {
    var def = { id: 'w10-' + ('0' + p).slice(-2), colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
    if (extra) { Object.keys(extra).forEach(function (k) { def[k] = extra[k]; }); }
    return def;
  }

  RS.Worlds.register({
    id: 10, key: 'bitterburg', name: 'Bitterburg', novelty: { kind: 'joker', key: 'zauberbombe' },
    intro: [
      'Am Ende des Seewegs ragt die Bitterburg aus grauem Fels, und über ihren Türmen hängen bittere Wolken. Ich trage die Sternenkrone bei mir, denn hier wohnt Bitterkönig Amarus.',
      'Für den letzten Weg gibt es einen neuen Joker: die Zauberbombe, die ein Feld von drei mal drei Feldern sprengt.',
      'Tippe auf die Zauberbombe und dann auf ein Feld, schon fliegen dort Bonbons und Hindernisse fort. Sie kostet dich keinen Zug!',
      'Damit du gleich loslegen kannst, schenke ich dir zwei Zauberbomben. Im höchsten Turm wartet Amarus schon auf uns!'
    ],
    chapterEnd: [
      'Annika setzt Amarus die Sternenkrone auf, und er bekommt seine Süße zurück.',
      'Die Bitterburg färbt sich bunt wie Zuckerguss, und die bitteren Wolken lösen sich auf.',
      'Von Kandishain bis zur Schillerbucht leuchten alle Welten wieder süß und hell!'
    ],
    gateLocked: 'Besiege Bitterkönig Amarus, um das Spiel zu vollenden.',
    // Siegsätze der Zwischenlevel (in wNN-extra.js), abwechselnd verwendet.
    winLines: [
      'Ein bitterer Stein bröckelt aus der Mauer.',
      'Ein Lichtstrahl dringt in die dunklen Gänge.',
      'Die schwarzen Fahnen werden ein wenig bunter.',
      'Ein Gitter in der Burg springt klirrend auf.',
      'Die Fackeln brennen auf einmal hell und warm.',
      'Ein Hauch von Süße weht durch die Hallen.',
      'Ein Burggespenst kichert und verschwindet.',
      'Die Treppe zum nächsten Turm wird sichtbar.',
      'Der Sternsplitter in deiner Tasche pulsiert.',
      'Ein Fenster zerspringt und lässt Sternenlicht herein.',
      'Die Bitterkeit weicht Schritt für Schritt zurück.',
      'Ein Wandteppich zeigt plötzlich ein Lächeln.',
      'Die Kerzen im Gang flackern hoffnungsvoll.',
      'Ein Echo von Lachen hallt durch die Burg.',
      'Annika ballt entschlossen die Faust.'
    ],
    // Düsterer Burgmarsch, phrygisch mit kleiner Sekunde, Chip-Melodie über dem Akkord-Pad.
    // Die Bossfassung (dunkler, schneller) ist die Musik des Finales.
    music: {
      tempo: 88, root: 62, scale: [0, 1, 3, 5, 7, 8, 10], lead: 'chip',
      bass: [0, null, null, null, null, null, 1, null, 0, null, null, null, 5, null, 6, null],
      drums: 'k...s..hk.k.s..h',
      melodies: [
        [7, null, 8, 7, null, 5, 4, null, 5, null, 4, 3, 4, null, null, null],
        [4, null, 5, null, 7, null, 8, 7, 5, null, 4, null, 1, null, 0, null],
        [0, null, 1, 0, null, 3, 4, null, 5, 4, null, 3, 1, null, null, null]
      ]
    },
    boss: {
      key: 'amarus', name: 'Bitterkönig Amarus', hp: 1015, weak: [4, 0, 3], thresholds: [0.66, 0.33],
      attacks: [
        [{ every: 3, kind: 'lock', count: 3 }, { every: 3, kind: 'ice', count: 2, level: 2 }],
        [{ every: 2, kind: 'crate', count: 3, level: 2 }, { every: 2, kind: 'choco', count: 2 }],
        [{ every: 2, kind: 'fuse', count: 2, level: 6 }, { every: 2, kind: 'chameleon', count: 2 }]],
      story: {
        intro: [
          { who: 'boss', text: 'Wer wagt es, mit dieser Krone vor meinen Thron zu treten?' },
          { who: 'annika', text: 'Wir bringen dir deine Süße zurück, Bitterkönig Amarus!' },
          { who: 'boss', text: 'Süße brauche ich nicht, ich sperre eure Bonbons in Lakritz und Eis!' },
          { who: 'annika', text: 'Violette Bonbons treffen ihn am härtesten, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Jetzt mauere ich eure Bonbons in Kisten ein und lasse bittere Schokolade fließen!' },
          { who: 'annika', text: 'Eine Zauberbombe sprengt viele Kisten auf einmal, und jetzt trifft ihn Rot am härtesten!' }
        ],
        phase3: [
          { who: 'boss', text: 'Zum Schluss zünde ich Knallbonbons und lasse eure Farben tanzen!' },
          { who: 'annika', text: 'Gleich ist es geschafft, und jetzt trifft Blau sein bitteres Herz!' }
        ],
        defeat: [
          { who: 'boss', text: 'Was ist das für ein warmes Gefühl, es schmeckt nach Honig und Vanille?' },
          { who: 'annika', text: 'Das ist deine Süße, Amarus, sie war nie ganz verloren!' },
          { who: 'boss', text: 'Danke, Annika, ab heute soll die Bitterburg wieder ein süßer Ort sein!' }
        ]
      }
    },
    levels: [
      level(1, 6, 22, [{ type: 'crate' }], [
        'xxxxxxxx', 'xYYYxxxx', 'xYZYxxxx', 'xYYYxxxx', 'xxxxYYYx', 'xxxxYZYx', 'xxxxYYYx', 'xxxxxxxx'],
        'Vor dem Burgtor türmen sich bittere Kisten, und eine Zauberbombe sprengt viele auf einmal!',
        'Alle Kisten sind offen, und das Burgtor rückt näher.'),
      level(2, 6, 14, [{ type: 'collect', color: 4, target: 30 }], [
        'xxxxxxxx', 'xLLxxLLx', 'xLLHHLLx', 'xxxxxxxx', 'xxHxxHxx', 'xLLxxLLx', 'xLLxxLLx', 'xxxxxxxx'],
        'Lakritzketten hängen an der Zugbrücke, und Chamäleons schillern dazwischen, also sammle 30 Bonbons in Violett!',
        'Die Zugbrücke senkt sich mit einem lauten Knarren.',
        { chameleons: { spawnEvery: 5 } }),
      level(3, 6, 16, [{ type: 'glaze' }, { type: 'fuse', target: 4 }], [
        'xxxxxxxx', 'x22xx22x', 'x21xx12x', 'xxxFFxxx', 'xFxxxxFx', 'x12xx21x', 'x22xx22x', 'xxxxxxxx'],
        'Im Burghof klebt bittere Glasur, und Knallbonbons zischen, also räume die Glasur fort und entschärfe vier!',
        'Der Burghof glänzt, und kein Knallbonbon zischt mehr.',
        { fuses: { start: 10, spawnEvery: 6 } }),
      level(4, 6, 19, [{ type: 'crate' }, { type: 'collect', color: 5, target: 22 }], [
        'xxxxxxxx', 'xYYxxYYx', 'xYZxxZYx', 'xxIIIIxx', 'xxIJJIxx', 'xxxxxxxx', 'xZYxxYZx', 'xxxxxxxx'],
        'In der Waffenkammer stehen Kisten auf eisigem Boden, also brich sie auf und sammle 22 Bonbons in Orange!',
        'Die Waffenkammer ist leer, und das Eis taut.'),
      level(5, 5, 13, [{ type: 'cherry', target: 3 }, { type: 'collect', color: 2, target: 27 }], [
        'xxxRRxxx', 'xxxxxxxx', 'xIIxxIIx', 'xIJxxJIx', 'xxxxxxxx', 'xxHxxHxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Im Burggarten hängen die letzten Kirschen, also bring drei heim und sammle 27 Bonbons in Grün!',
        'Die Kirschen sind gerettet, und im Burggarten sprießt frisches Gras.',
        { cherries: { total: 3, onBoard: 2 } }),
      level(6, 6, 13, [{ type: 'choco' }, { type: 'collect', color: 3, target: 30 }], [
        'xxxxxxxx', 'xCCxxCCx', 'xCCxxCCx', 'xxxHHxxx', 'xxHxxHxx', 'xCCxxCCx', 'xCCxxCCx', 'xxxxxxxx'],
        'Aus dem Burgkeller quillt bittere Schokolade, also entferne sie und sammle 30 Bonbons in Blau!',
        'Der Keller ist sauber, und es duftet wieder süß.',
        { chameleons: { spawnEvery: 5 } }),
      level(7, 6, 17, [{ type: 'fuse', target: 4 }, { type: 'crate' }], [
        'xxxxxxxx', 'xFxYYxFx', 'xLxYYxLx', 'xLLxxLLx', 'xxxFFxxx', 'xxxxxxxx', 'xYYxxYYx', 'xxFxxFxx'],
        'Im Pulverturm zischen Knallbonbons zwischen Kisten und Lakritz, also entschärfe vier und brich die Kisten auf!',
        'Der Pulverturm ist sicher, und die Treppe nach oben ist frei.',
        { fuses: { start: 10, spawnEvery: 5 } }),
      level(8, 6, 14, [{ type: 'score', target: 7500 }, { type: 'collect', color: 1, target: 30 }], [
        'xxxxxxxx', 'xIIxxIIx', 'xIJHHJIx', 'xxxxxxxx', 'xxHxxHxx', 'xIJxxJIx', 'xIIxxIIx', 'xxxxxxxx'],
        'Im Spiegelsaal glitzert bitteres Eis, und wir brauchen 7500 Punkte und 30 Bonbons in Gelb.',
        'Die Spiegel funkeln, und in jedem leuchtet ein goldenes Licht.',
        { chameleons: { spawnEvery: 4 } }),
      level(9, 6, 18, [{ type: 'glaze' }, { type: 'crate' }, { type: 'collect', color: 0, target: 23 }], [
        'xxx..xxx', 'xKKxxKKx', 'xK1YY1Kx', 'xxHxxHxx', 'xxxFFxxx', 'x1xYYx1x', 'xKKxxKKx', 'xxx..xxx'],
        'Vor dem Thronsaal warten Glasur, Kisten und Knallbonbons, also räume alles fort und sammle 23 Bonbons in Rot!',
        'Die Tür zum Thronsaal schwingt auf, und dahinter wartet Amarus.',
        { fuses: { start: 10, spawnEvery: 6 } }),
      // Finale gegen Bitterkönig Amarus: der Thronsaal mit zwei Säulen am Rand, Lakritz, Eis,
      // Kisten, Schokolade, Knallbonbons und Chamäleons bringt er in drei Phasen selbst.
      { id: 'w10-10', boss: true, colors: 6, moves: 50, layout: [
        '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Im Thronsaal erhebt sich Bitterkönig Amarus von seinem dunklen Thron.',
        win: 'Amarus ist besiegt, und die Bitterburg wird wieder süß!' }
    ]
  });
})(window.RS = window.RS || {});
