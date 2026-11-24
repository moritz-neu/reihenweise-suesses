(function (RS) {
  'use strict';

  // Weltübergreifende Texte. Prolog, Level-, Boss- und Kapiteltexte stehen in den
  // Weltdateien (js/data/worlds/wNN.js); der Prolog ist die Einleitung von Welt 1.
  RS.STORY = {
    shop: [
      'Für jeden Stern schenkt dir Kandishain Zuckerstangen, und im Endlos-Modus verdienst du sie mit Punkten.',
      'Hier tauschst du sie gegen Joker: fünf Züge mehr oder meinen Zuckerhammer, der ein Bonbon zerschlägt.',
      'Setz sie im Level über die Leiste unter dem Spielfeld ein!'
    ],
    atlas: {
      title: 'Weltenübersicht',
      intro: 'Hier siehst du alle Welten unserer Reise.',
      locked: 'Noch verborgen',
      shard: 'Sternsplitter gefunden'
    },
    gift: 'Annika schenkt dir {n} × {name}!',
    toBeContinued: 'Fortsetzung folgt …',
    // Abspann nach dem Finale: je Welt ein Dank (Schlüssel = Welt-Id), für Welten ohne
    // eigenen Satz die allgemeine Zeile mit {name}; danach Annikas Abschied und „Ende“.
    credits: {
      title: 'Abspann',
      worlds: {
        1: 'Danke, Kandishain, dass in deinen Lebkuchenhäusern wieder alle Fenster leuchten.',
        2: 'Danke, Frostzuckerberge, dass euer Eis jetzt nur noch auf Sorbets glitzert.',
        3: 'Danke, Karamellwüste, dass der sanfte Koloss wieder frei durch warmen Sand stapft.',
        4: 'Danke, Kaugummi-Dschungel, dass Blubba nur noch zum Spaß rosa Blasen pustet.',
        5: 'Danke, Kirschgarten Morellia, dass deine Bäume wieder voller roter Kirschen hängen.',
        6: 'Danke, Zuckerwattenwolken, dass über euch wieder Regenbogen statt Gewitter stehen.',
        7: 'Danke, Knallhafen, dass deine Knallbonbons jetzt nur noch zum Feiern krachen.',
        8: 'Danke, Marzipanschloss, dass Ritter Mandelbart seine Tore wieder für alle öffnet.',
        9: 'Danke, Schillerbucht, dass deine Wellen wieder in allen Farben schimmern.',
        10: 'Danke, Bitterburg, dass Amarus seine Süße wiedergefunden hat und nun mit uns feiert.'
      },
      fallback: 'Danke, {name}, dass du wieder süß und hell leuchtest.',
      farewell: [
        'Du hast alle Welten zum Leuchten gebracht, und die Sternenkrone strahlt heller als je zuvor.',
        'Ohne dich wäre Kandishain heute noch bitter und grau.',
        'Komm jederzeit wieder, ich hebe dir ein Bonbon auf!'
      ],
      end: 'Ende'
    }
  };
})(window.RS = window.RS || {});
