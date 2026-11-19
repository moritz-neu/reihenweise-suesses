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
        intro: 'Befreie alles von Glasur und sammle 30 Bonbons in Orange. Dann glüht das Kristallbonbon wieder.',
        win: 'Geschafft! Das zehnte Haus erstrahlt, und auf dem Dorfplatz regt sich ein Licht.'
      }
    },
    shop: [
      'Für jeden Stern schenkt dir Kandishain Zuckerstangen, und im Endlos-Modus verdienst du sie mit Punkten.',
      'Hier tauschst du sie gegen Joker: fünf Züge mehr oder meinen Zuckerhammer, der ein Bonbon zerschlägt.',
      'Setz sie im Level über die Leiste unter dem Spielfeld ein!'
    ],
    finale: [
      'Sieh nur: Das Kristallbonbon auf dem Dorfplatz glüht wieder!',
      'Alle zehn Häuser leuchten, und die Glasur ist längst nur noch Zuckerstaub.',
      'Kandishain dankt dir, mutiger Naschkünstler. Ohne dich wäre es dunkel geblieben.',
      'Magst du weiterspielen? Im Endlos-Modus warten noch unzählige Bonbons auf dich.'
    ]
  };
})(window.RS = window.RS || {});
