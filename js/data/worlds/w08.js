(function (RS) {
  'use strict';

  // Welt 8 (Marzipanschloss): Neuheit Joker Regenbogenstaub (löst alle Bonbons einer Farbe auf).
  // Sammelziele einer Farbe und Hindernisse unter vielen Bonbons laden zum Regenbogenstaub ein;
  // balanciert ist jedes Level ohne Joker. Die Level mischen alle bekannten Mechaniken:
  // Glasur, Lakritz, Eis, Schokolade, Kisten, Kirschen und Knallbonbons.
  // w8-05 (Kirschen) spielt mit fünf Farben, alle anderen mit sechs.
  // Züge und Zielmengen aus dem Balancing-Simulator (README).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win, extra) {
    var def = { id: 'w8-0' + p, colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
    if (extra) { Object.keys(extra).forEach(function (k) { def[k] = extra[k]; }); }
    return def;
  }

  RS.Worlds.register({
    id: 8, key: 'marzipan', name: 'Marzipanschloss', novelty: { kind: 'joker', key: 'regenbogen' },
    intro: [
      'Hinter dem Knallbonbontor erhebt sich das Marzipanschloss. Seine Türme sind mit Mandeln und Zuckerperlen verziert.',
      'Hier hilft ein neuer Joker: der Regenbogenstaub, der alle Bonbons einer Farbe auf einmal auflöst.',
      'Tippe auf den Regenbogenstaub und dann auf ein Bonbon, schon verschwinden alle Bonbons seiner Farbe. Er kostet dich keinen Zug!',
      'Damit du gleich loslegen kannst, schenke ich dir zwei Prisen Regenbogenstaub. Auf den Zinnen wacht schon Ritter Mandelbart!'
    ],
    chapterEnd: [
      'Ritter Mandelbart senkt seine Lanze und verneigt sich vor Annika.',
      'Er verrät, dass Amarus einst ein Schüler der Zuckerfeen war, bis er seine Süße verlor.',
      'Dann löst sich aus seinem Wappenschild ein Sternsplitter, der violett wie Veilchenmarzipan funkelt!'
    ],
    gateLocked: 'Besiege Ritter Mandelbart, um das Tor zu öffnen.',
    // Feierlicher Schlossreigen, harmonisch Moll mit Leitton, helle Glocken.
    music: {
      tempo: 92, root: 64, scale: [0, 2, 3, 5, 7, 8, 11], lead: 'bell',
      bass: [0, null, null, null, 4, null, null, null, 5, null, null, null, 4, null, null, null],
      drums: 'k...s...k.k.s...',
      melodies: [
        [7, null, 8, 9, 11, null, 10, 9, 8, null, 7, 6, 7, null, null, null],
        [9, null, 11, null, 12, null, 11, 10, 9, null, 8, null, 6, null, 7, null],
        [4, null, 6, 7, null, 9, 8, null, 7, 6, null, 4, 5, null, null, null]
      ]
    },
    boss: {
      key: 'mandelbart', name: 'Ritter Mandelbart', hp: 770, weak: [1, 4], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'crate', count: 3, level: 2 },
        { every: 2, kind: 'glaze', count: 4, level: 2 }],
      story: {
        intro: [
          { who: 'boss', text: 'Halt, wer klopft da an das Tor meines Marzipanschlosses?' },
          { who: 'annika', text: 'Wir bringen die Süße zurück ins Schloss, Ritter Mandelbart!' },
          { who: 'boss', text: 'Dann mauere ich eure Bonbons in Kisten aus Marzipan ein!' },
          { who: 'annika', text: 'Gelbe Bonbons schlagen Lücken in seine Rüstung, los geht es!' }
        ],
        phase2: [
          { who: 'boss', text: 'Jetzt gieße ich dicke Mandelglasur über das ganze Feld!' },
          { who: 'annika', text: 'Ein Regenbogenstaub löst viel Glasur auf einmal, und jetzt trifft ihn Violett am härtesten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Meine Rüstung bröckelt wie trockenes Marzipan!' },
          { who: 'annika', text: 'Jetzt stehen die Tore des Marzipanschlosses wieder für alle offen!' }
        ]
      }
    },
    levels: [
      level(1, 6, 15, [{ type: 'collect', color: 4, target: 27 }], [
        'x.xxxx.x', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        'Im Schlosshof warten 27 Bonbons in Violett, und ein Regenbogenstaub holt viele auf einmal!',
        'Prima, der Schlosshof leuchtet violett.'),
      level(2, 6, 17, [{ type: 'collect', color: 0, target: 34 }], [
        'xxxxxxxx', 'xLxxxxLx', 'xxLxxLxx', 'xxxxxxxx', 'xxxxxxxx', 'xxLxxLxx', 'xLxxxxLx', 'xxxxxxxx'],
        'Lakritzketten sperren die Zugbrücke, also sammle dazwischen 34 Bonbons in Rot!',
        'Die Zugbrücke senkt sich, und der Weg ins Schloss ist frei.'),
      level(3, 6, 16, [{ type: 'glaze' }, { type: 'score', target: 6000 }], [
        'x.xxxx.x', 'x1x22x1x', 'x122221x', 'xx2112xx', 'xx2112xx', 'x122221x', 'x1xxxx1x', 'xxxxxxxx'],
        'Glasur klebt auf dem Marmorboden der Halle, und dazu brauchen wir 6000 Punkte.',
        'Der Boden glänzt, und die Kronleuchter funkeln.'),
      level(4, 6, 17, [{ type: 'crate' }], [
        'xxxxxxxx', 'xYxxxxYx', 'xZYxxYZx', 'xxxxxxxx', 'xxxxxxxx', 'xZYxxYZx', 'xYxxxxYx', 'xxxxxxxx'],
        'Lebkuchenkisten stapeln sich in der Vorratskammer, also brich sie alle auf!',
        'Alle Kisten sind offen, und es duftet nach Mandeln.'),
      level(5, 5, 14, [{ type: 'cherry', target: 3 }, { type: 'collect', color: 2, target: 18 }], [
        'xxxRRxxx', 'xxxxxxxx', 'xIxxxxIx', 'xxxxxxxx', 'xxxxxxxx', 'xIxxxxIx', 'xxxxxxxx', 'xxxxxxxx'],
        'Kirschen sind in den Schlossgarten gerollt, also bring drei heim und sammle 18 Bonbons in Grün!',
        'Die Kirschen sind im Korb, und der Schlossgarten blüht.',
        { cherries: { total: 3, onBoard: 2 } }),
      level(6, 6, 15, [{ type: 'choco' }], [
        'xxxxxxxx', 'xCCxxCCx', 'CCCxxCCC', 'xxxIIxxx', 'xxxIIxxx', 'CCCxxCCC', 'xCCxxCCx', 'xxxxxxxx'],
        'Bittere Schokolade quillt aus den Kellergewölben, also entferne sie, bevor sie sich ausbreitet!',
        'Keine Schokolade mehr, und der Keller duftet wieder süß.'),
      level(7, 6, 18, [{ type: 'collect', color: 3, target: 24 }, { type: 'fuse', target: 5 }], [
        'xxxxxxxx', 'xFxxxxFx', 'xxLxxLxx', 'xxxFFxxx', 'xxxxxxxx', 'xxLxxLxx', 'xFxxxxFx', 'xxxxxxxx'],
        'Im Turmzimmer zischen Knallbonbons, also entschärfe fünf und sammle 24 Bonbons in Blau!',
        'Alle Knallbonbons sind entschärft, und im Turmzimmer ist es still.',
        { fuses: { start: 10, spawnEvery: 5 } }),
      level(8, 6, 18, [{ type: 'glaze' }, { type: 'crate' }], [
        '.xxxxxx.', 'xKxYYxKx', 'x2xxxx2x', 'x1xZZx1x', 'x1xZZx1x', 'x2xxxx2x', 'xKxYYxKx', '.xxxxxx.'],
        'Kisten, Lakritz und dicke Glasur versperren den Thronsaal, also räume alles fort!',
        'Der Thronsaal ist frei, und die Banner wehen.'),
      level(9, 6, 20, [{ type: 'collect', color: 1, target: 29 }, { type: 'crate' }], [
        'xxx..xxx', 'xIxYYxIx', 'xJxxxxJx', 'xxxxxxxx', 'xxxxxxxx', 'xJxxxxJx', 'xIxYYxIx', 'xxx..xxx'],
        'Vor Mandelbarts Turm sammeln wir 29 Bonbons in Gelb und brechen die Kisten auf.',
        'Der Weg zum Turm ist frei, und oben klirrt schon eine Rüstung.'),
      // Bosskampf gegen Ritter Mandelbart: offener Burghof mit zwei Zinnenlücken,
      // die Kisten und die dicke Glasur bringt er selbst.
      { id: 'w8-10', boss: true, colors: 6, moves: 40, layout: [
        'x.xxxx.x', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Auf den Zinnen seines Turms hebt Ritter Mandelbart seine Lanze aus Mandelkrokant.',
        win: 'Mandelbart ist besiegt, und über dem Marzipanschloss weht eine bunte Fahne!' }
    ]
  });
})(window.RS = window.RS || {});
