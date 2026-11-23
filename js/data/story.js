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
    toBeContinued: 'Fortsetzung folgt …'
  };
})(window.RS = window.RS || {});
