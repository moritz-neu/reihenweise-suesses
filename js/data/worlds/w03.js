(function (RS) {
  'use strict';

  // Welt 3 (Karamellwüste): Neuheit Lebkuchenkisten (X, Y, Z = Stufe 1, 2, 3).
  // Züge und Zielmengen aus dem Balancing-Simulator (README, Abschnitt Balancing).
  // Seeds: aus der Level-Id (RS.Worlds).
  function level(p, colors, moves, goals, layout, intro, win) {
    return { id: 'w3-' + ('0' + p).slice(-2), colors: colors, moves: moves, goals: goals, layout: layout, intro: intro, win: win };
  }

  RS.Worlds.register({
    id: 3, key: 'karamellwueste', name: 'Karamellwüste', novelty: { kind: 'mechanic', key: 'crate' },
    intro: [
      'Hinter dem Tor glüht die Karamellwüste. Warmer Zuckersand reicht hier bis zum Horizont.',
      'Neu sind Lebkuchenkisten: Sie liegen statt eines Bonbons auf dem Feld und lassen sich nicht tauschen.',
      'Löse direkt neben einer Kiste eine Reihe auf, dann bricht sie eine Stufe auf. Manche Kisten halten zwei oder drei Treffer aus!',
      'Irgendwo zwischen den Dünen stampft ein riesiger Karamellkoloss. Gemeinsam schaffen wir auch das!'
    ],
    chapterEnd: [
      'Der Bitterzauber ist gebrochen, und der Koloss ist wieder der sanfte Riese, der er immer war.',
      'Er erzählt von der Bitterburg, in der Bitterkönig Amarus hinter dunklen Mauern wohnt.',
      'Zum Dank schenkt er mir einen Sternsplitter, der so warm wie Karamell leuchtet!'
    ],
    gateLocked: 'Besiege den Karamellkoloss, um das Tor zu öffnen.',
    // Warm, Hijaz-artige Skala mit übermäßiger Sekunde, Zupfklang, Handtrommel.
    music: {
      tempo: 100, root: 62, scale: [0, 1, 4, 5, 7, 8, 10], lead: 'pluck',
      bass: [0, null, null, null, null, null, 0, null, 4, null, null, null, null, null, null, null],
      drums: 'k.s..hs.k.h.s.h.',
      melodies: [
        [4, null, 5, 4, 2, null, 1, null, 2, null, null, null, 0, null, null, null],
        [0, null, 1, null, 2, null, 3, null, 4, null, 3, 2, 1, null, null, null],
        [7, null, 6, 5, 4, null, 5, null, 4, null, 2, null, 1, null, 0, null]
      ]
    },
    boss: {
      key: 'koloss', name: 'Karamellkoloss', hp: 720, weak: [5, 1], thresholds: [0.5],
      attacks: [
        { every: 3, kind: 'crate', count: 3, level: 1 },
        { every: 2, kind: 'crate', count: 3, level: 2 } ],
      story: {
        intro: [
          { who: 'boss', text: 'Rumms, wer stampft da durch meine Dünen?' },
          { who: 'annika', text: 'Wir bringen das Licht in die Wüste zurück, großer Koloss!' },
          { who: 'boss', text: 'Grrr, alles hier soll bitter und still bleiben!' },
          { who: 'annika', text: 'Ich spüre einen Bitterzauber auf ihm, Orange löst ihn am besten!' }
        ],
        phase2: [
          { who: 'boss', text: 'Rumms, rumms, meine Kisten werden immer härter!' },
          { who: 'annika', text: 'Der Bitterzauber bröckelt, jetzt hilft Gelb am meisten!' }
        ],
        defeat: [
          { who: 'boss', text: 'Oh, mir ist so leicht, was habe ich nur getan?' },
          { who: 'annika', text: 'Du warst verzaubert, und jetzt bist du wieder frei!' }
        ]
      }
    },
    levels: [
      level(1, 6, 15, [{ type: 'crate' }], [
        'xxxxxxxx', 'xXxxxxXx', 'xxXXXXxx', 'xXxxxxXx', 'xXxxxxXx', 'xxXXXXxx', 'xXxxxxXx', 'xxxxxxxx'],
        'Neu sind Lebkuchenkisten: Löse direkt neben einer Kiste eine Reihe auf, bis alle Kisten zerbrochen sind!',
        'Die Kisten sind offen, und das erste Kuppelhaus leuchtet in der Wüste.'),
      level(2, 6, 18, [{ type: 'crate' }, { type: 'collect', color: 5, target: 24 }], [
        'xxxxxxxx', 'xXxxxxXx', 'xxxxxxxx', 'XxxXXxxX', 'XxxXXxxX', 'xxxxxxxx', 'xXxxxxXx', 'xxxxxxxx'],
        'Zwischen den Kisten liegt Orange im Sand, also sammle 24 Bonbons in Orange und brich alle Kisten auf!',
        'Prima, die Dünen schimmern jetzt wie warmes Karamell.'),
      level(3, 6, 19, [{ type: 'crate' }, { type: 'score', target: 5000 }], [
        '..xxxx..', '.xxxxxx.', 'xxXYYXxx', 'xxYxxYxx', 'xxYxxYxx', 'xxXYYXxx', '.xxxxxx.', '..xxxx..'],
        'Manche Kisten sind doppelt verschnürt und brauchen zwei Treffer, und dazu sammelst du 5000 Punkte.',
        'Die dicken Kisten sind geknackt, und die Karamellpyramide glänzt.'),
      level(4, 6, 20, [{ type: 'glaze' }, { type: 'crate' }], [
        'xxxxxxxx', 'x11XX11x', 'x1xxxx1x', 'XxY22YxX', 'XxY22YxX', 'x1xxxx1x', 'x11XX11x', 'xxxxxxxx'],
        'Glasur klebt zwischen den Kisten im Sand, also befreie alle Felder davon und öffne jede Kiste!',
        'Glasur und Kisten sind weg, und die Oase glitzert wieder.'),
      level(5, 6, 18, [{ type: 'crate' }, { type: 'collect', color: 1, target: 24 }], [
        'xxxxxxxx', 'xLxYYxLx', 'xxxxxxxx', 'XLxxxxLX', 'XLxxxxLX', 'xxxxxxxx', 'xLxYYxLx', 'xxxxxxxx'],
        'Lakritzgitter halten die Kisten fest, doch du brichst sie auf und sammelst 24 Bonbons in Gelb.',
        'Die Gitter sind gesprengt, und die Wüstensonne strahlt.'),
      level(6, 6, 26, [{ type: 'crate' }], [
        'xxxxxxxx', 'xIxxxxIx', 'xxYZZYxx', 'IxZxxZxI', 'IxZxxZxI', 'xxYZZYxx', 'xIxxxxIx', 'xxxxxxxx'],
        'Achtung, bunt verschnürte Kisten halten sogar drei Treffer aus, und dazwischen liegt Eis!',
        'Selbst die stärksten Kisten sind offen, und der Lutscherkaktus blüht.'),
      level(7, 6, 20, [{ type: 'choco' }, { type: 'crate' }], [
        'xxxxxxxx', 'xxXCCXxx', 'xYxCCxYx', 'xxxxxxxx', 'xxxxxxxx', 'xYxCCxYx', 'xxXCCXxx', 'xxxxxxxx'],
        'Schokolade wächst zwischen den Kisten, also entferne alle Schokolade und jede Kiste!',
        'Keine Schokolade mehr, und die Karawanserei leuchtet warm.'),
      level(8, 6, 28, [{ type: 'glaze' }, { type: 'collect', color: 0, target: 20 }], [
        'xxxxxxxx', 'x1YxxY1x', 'x1IZZI1x', 'xxxxxxxx', 'xxxxxxxx', 'x1IZZI1x', 'x1YxxY1x', 'xxxxxxxx'],
        'Glasur und Eis liegen rund um die Kisten, und außerdem brauchen wir 20 Bonbons in Rot.',
        'Wunderbar, der Sonnenuntergang färbt die Pyramiden rot.'),
      level(9, 6, 39, [{ type: 'crate' }, { type: 'glaze' }], [
        '.xxxxxx.', 'xKxZZxKx', 'xIxCCxIx', 'x1Y22Y1x', 'x1Y22Y1x', 'xIxCCxIx', 'xKxZZxKx', '.xxxxxx.'],
        'Kurz vor dem Koloss kommt alles zusammen: Kisten, Lakritz, Eis, Glasur und Schokolade.',
        'Der Weg zum Koloss ist frei, und der Boden bebt schon.'),
      // Bosskampf gegen den Karamellkoloss: ein paar Kisten liegen schon am Anfang.
      { id: 'w3-10', boss: true, colors: 6, moves: 40, layout: [
        'xxxxxxxx', 'xxxxxxxx', 'xxXxxXxx', 'xxxxxxxx', 'xxxxxxxx', 'xxXxxXxx', 'xxxxxxxx', 'xxxxxxxx'],
        intro: 'Mitten in der Wüste erhebt sich der Karamellkoloss, und ein dunkler Zauber glimmt in seinen Augen.',
        win: 'Der Koloss ist befreit, und die ganze Wüste glüht wieder golden!' }
    ]
  });
})(window.RS = window.RS || {});
