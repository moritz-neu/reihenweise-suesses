(function (RS) {
  'use strict';

  RS.STORY = {
    prologue: [
      'Willkommen in Kandishain, dem Zuckerdorf! Früher strahlten hier alle Häuser in den bunten Farben der Bonbons.',
      'Dann kam ein Zauber: Zuckerglasur und Lakritz haben das ganze Dorf eingehüllt, und das Leuchten ist erloschen.',
      'Ich bin Annika, die Zuckerfee. Ich bleibe an deiner Seite!',
      'Gemeinsam bringen wir Haus für Haus das Licht zurück. Los geht es!'
    ],
    levels: {
      1: {
        intro: 'Tauscht zwei Nachbarn, bis drei gleiche Bonbons in einer Reihe liegen. Sammle so viele Punkte, wie du kannst!',
        win: 'Wunderbar! Das erste Haus leuchtet wieder.'
      },
      2: {
        intro: 'Hier fehlen ein paar Ecken im Spielfeld. Das macht nichts, du findest trotzdem deinen Weg.',
        win: 'Das zweite Haus funkelt! Kandishain wird heller.'
      },
      3: {
        intro: 'Neue Spezialbonbons: Vier in einer Reihe ergeben ein Streifen-Bonbon, L oder T eine Bombe, fünf eine Farbkugel. Sammle 25 Bonbons in Rot!',
        win: 'Das dritte Haus erstrahlt in Rot und Gold!'
      },
      4: {
        intro: 'Heute brauchen wir Blau und Gelb: je 20 Bonbons in Blau und in Gelb.',
        win: 'Schau nur, das vierte Haus blinzelt dir zu!'
      },
      5: {
        intro: 'Sammle 25 Bonbons in Grün und fülle nebenbei dein Punktekonto. Du schaffst das!',
        win: 'Das fünfte Haus glitzert wie frischer Tau.'
      },
      6: {
        intro: 'Achtung, Zuckerglasur! Löse ein Bonbon auf ihrem Feld auf oder triff sie mit einem Spezialbonbon, dann springt sie ab (dicke Glasur braucht zwei Treffer).',
        win: 'Die Glasur zerspringt, und das sechste Haus leuchtet wieder!'
      },
      7: {
        intro: 'Die Mitte steckt unter dicker Glasur: Dort musst du zweimal ran. Geduld, kleiner Zuckerstern!',
        win: 'Mitten im Dorf funkelt jetzt das siebte Haus.'
      },
      8: {
        intro: 'Das Lakritzgitter hält ein Bonbon fest, bis du es in einer Reihe auflöst oder ein Spezialbonbon das Feld trifft. Sammle außerdem 20 Bonbons in Violett!',
        win: 'Das Gitter ist geknackt! Das achte Haus strahlt.'
      },
      9: {
        intro: 'Der Zauber wird stärker: Oben Lakritz, unten Glasur. Löse alles auf und sammle 20 Bonbons in Gelb!',
        win: 'Fast geschafft! Das neunte Haus leuchtet warm.'
      },
      10: {
        intro: 'Auf dem Dorfplatz wartet Graf Lakritz, der den Zauber über das Dorf gelegt hat: Triff ihn mit vielen Bonbons, am liebsten in seiner Schwachstellen-Farbe!',
        win: 'Graf Lakritz ist besiegt, und das zehnte Haus erstrahlt wieder!'
      },
      11: {
        intro: 'Willkommen in den Frostzuckerbergen, hier glitzert alles vor Kälte: Sammle Punkte, damit uns warm wird!',
        win: 'Die erste Berghütte leuchtet, und der Schnee funkelt mit ihr.'
      },
      12: {
        intro: 'Der Gletscher schimmert in kühlen Farben, deshalb brauchen wir je 25 Bonbons in Blau und in Violett.',
        win: 'Prima, der Gletscher glänzt wieder in seinen schönsten Farben!'
      },
      13: {
        intro: 'Neu ist Eis: Ein vereistes Bonbon taut auf, wenn du daneben eine Reihe auflöst, und nebenbei sammelst du 26 Bonbons in Grün.',
        win: 'Das Eis ist geschmolzen, und die Tannen am Hang leuchten grün.'
      },
      14: {
        intro: 'Die Glasur ist zurück und liegt mitten zwischen den Eisbonbons, also befreie alle Felder davon!',
        win: 'Glasur und Eis sind weg, und der Bergsee glitzert wieder.'
      },
      15: {
        intro: 'Dickes Eis braucht zwei Treffer, und Lakritzgitter halten die Ecken fest, doch du sammelst trotzdem 24 Bonbons in Gelb.',
        win: 'Das dicke Eis ist geknackt, und die Bergsonne lacht dir zu!'
      },
      16: {
        intro: 'Achtung, Schokolade: Sie wächst jeden Zug ein Stück, wenn du keine davon entfernst, also löse direkt daneben Reihen auf!',
        win: 'Keine Schokolade mehr weit und breit, und die Hütte am Pass strahlt.'
      },
      17: {
        intro: 'Die Schokolade versteckt sich zwischen Eisbonbons, und erst wenn alle Schokolade verschwunden ist, haben wir es geschafft.',
        win: 'Eis und Schokolade sind besiegt, und der Wasserfall glitzert wie Kandis.'
      },
      18: {
        intro: 'Glasur und Schokolade versperren den Weg zur Seilbahn, und außerdem brauchen wir 20 Bonbons in Rot.',
        win: 'Wunderbar, die Seilbahn zum Gipfel leuchtet wieder!'
      },
      19: {
        intro: 'Kurz vor dem Gipfel kommt alles zusammen: Eis, Lakritz, Glasur und Schokolade.',
        win: 'Der Weg zum Eispalast ist frei, und Kandara wartet schon.'
      },
      20: {
        intro: 'Auf dem Gipfel thront Eiskönigin Kandara, die hinter dem ganzen Zauber steckt: Zeig ihr, wie stark süße Farben sind!',
        win: 'Kandara ist besiegt, und der Eispalast schmilzt zu glitzerndem Zuckerwasser!'
      }
    },
    bosses: {
      lakritz: {
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
      },
      kandara: {
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
    world2Intro: [
      'Hinter dem alten Tor liegen die Frostzuckerberge. Hier ist Graf Lakritz hingeflohen.',
      'Auch hier ist das Leuchten erloschen. Eis und Schokolade bedecken die Hänge.',
      'Ganz oben im Eispalast wohnt Eiskönigin Kandara. Ich glaube, sie steckt hinter allem!',
      'Bleib dicht bei mir, es wird kalt. Gemeinsam bringen wir das Licht auch hierher!'
    ],
    interlude: [
      'Sieh nur, das Kristallbonbon auf dem Dorfplatz glüht wieder!',
      'Graf Lakritz rennt davon und schlüpft durch das alte Tor am Ende des Dorfes.',
      'Hinter dem Tor glitzern die Frostzuckerberge, und von dort weht ein eisiger Wind.',
      'Kandishain dankt dir, doch unsere Reise geht weiter!'
    ],
    grandFinale: [
      'Kandaras Eis ist geschmolzen, und auf dem Gipfel funkelt ein zweites Kristallbonbon.',
      'Sein Licht strahlt über die Frostzuckerberge bis hinunter nach Kandishain.',
      'In beiden Welten leuchten jetzt alle Häuser und Hütten in bunten Bonbonfarben.',
      'Danke, du bist der mutigste Naschkünstler, den ich kenne!',
      'Im Endlos-Modus warten noch unzählige Bonbons auf dich, wann immer du magst.'
    ],
    gateLocked: 'Besiege Graf Lakritz, um das Tor zu öffnen.',
    shop: [
      'Für jeden Stern schenkt dir Kandishain Zuckerstangen, und im Endlos-Modus verdienst du sie mit Punkten.',
      'Hier tauschst du sie gegen Joker: fünf Züge mehr oder meinen Zuckerhammer, der ein Bonbon zerschlägt.',
      'Setz sie im Level über die Leiste unter dem Spielfeld ein!'
    ]
  };
})(window.RS = window.RS || {});
