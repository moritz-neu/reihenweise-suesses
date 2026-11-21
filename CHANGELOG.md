# Changelog

Alle nennenswerten Änderungen an „Reihenweise Süßes". Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionen nach [Semantic Versioning](https://semver.org/lang/de/).

## [3.0.1] – 2026-11-21

### Geändert
- Level 5 ist leichter: Das Punkteziel sinkt von 8000 auf 6000 Punkte.

## [3.0.0] – 2026-11-20

### Neu
- Zweite Welt „Frostzuckerberge“ mit den Leveln 11–20 und eigener Karte. Ein Tor nach Station 10 bleibt verschlossen, bis Graf Lakritz besiegt ist, und führt dann in die neue Welt; dort bringt ein Tor zurück.
- Bosskämpfe: Level 10 gegen Graf Lakritz (36 Züge, 600 Leben) und Level 20 gegen Eiskönigin Kandara (40 Züge, 730 Leben). Die Leben hat der Balancing-Simulator festgelegt.
  - Lebensleiste, Schwachstellen-Farbe (doppelter Schaden) und zwei Phasen mit schnellerem Angriffsrhythmus.
  - Angriffe: Lakritzgitter (Graf Lakritz), dicke Glasur und dickes Eis (Kandara).
  - Sternenzauber: lädt mit jedem aufgelösten Bonbon, bei 40 voll, macht 25 Schaden und entfernt bis zu 6 Hindernisse.
  - Szenen für Intro, Phasenwechsel und Sieg, Bossfiguren als SVG und Effekte für Treffer, Angriff und Sieg.
- Neue Hindernisse Eis (Stufe 1 und 2, auf einem Bonbon) und Schokolade (belegt ein Feld und breitet sich aus) sowie das Ziel „Schokolade entfernen“.
- Story für Welt 2, Einleitung beim ersten Betreten, großes Finale nach Level 20.
- Cartoon-Optik für Hauptmenü und Levelkarten: gezeichnete Hintergründe, Häuser, Bäume und Tor.
- Hinweis zu den Hintergründen: Es sind gezeichnete Ersatz-Hintergründe (SVG und Farbverlauf), keine generierten Bilder, weil sich keine erzeugen ließen. Eigene Bilder lassen sich später in `img/` ablegen; dafür genügt es, die Variablen `--photo-*` in `css/map.css` zu ändern (eine Zeile).

### Geändert
- Level 10 ist jetzt der Bosskampf Graf Lakritz. Das bisherige Finale nach Level 10 ist das Zwischenfinale, in dem der Graf durch das Tor flieht. Gespeicherte Sterne für Level 10 bleiben erhalten.
- Spielstand-Format Version 3 (Level 1–20, Merker für Tor, Welt-2-Einleitung und großes Finale). Spielstände der Versionen 1 und 2 werden beim Laden verlustfrei umgewandelt. Wer Level 10 schon geschafft hat, bekommt Level 11 freigeschaltet, und das Tor öffnet sich einmal mit Animation.

## [2.0.0] – 2026-11-19

### Neu
- Zuckerstangen als Währung: 5 je Stern beim ersten Sieg, beim erneuten Spielen 5 je neuem Stern plus 2, im Endlos-Modus 1 je 1000 Punkte.
- Laden auf der Levelkarte mit den Jokern „+5 Züge“ (30 Zuckerstangen) und „Zuckerhammer“ (20). Vorrat höchstens 10 je Joker, zum Start je 1.
- Joker im Abenteuer-Modus: „+5 Züge“ gibt genau 5 Züge, der Zuckerhammer entfernt ein Bonbon. Sie zählen normal für Sterne und Zugbonus.
- Rettung im Verlieren-Dialog, wenn Joker im Vorrat sind.
- Belohnungszeile „+N Zuckerstangen“ im Ergebnis-Dialog und am Ende einer Endlos-Runde.

### Geändert
- Die Zuckerfee heißt jetzt Annika.
- Spielstand-Format Version 2 (Zuckerstangen, Joker-Vorrat). Alte Spielstände werden beim Laden umgewandelt und behalten Level, Sterne und Rekord.

## [1.1.0] – 2026-11-19

### Geändert
- Sterne hängen jetzt an den übrigen Zügen statt an Punkteschwellen: ★★ ab einem Viertel, ★★★ ab der Hälfte der Züge übrig. Bisher bekam, wer ein Level schnell schaffte, oft weniger Sterne als jemand, der länger brauchte.
- Die Sternleiste sitzt bei den Zügen und zeigt, ab wie vielen übrigen Zügen es zwei und drei Sterne gibt. Der Ergebnis-Dialog nennt die übrigen Züge und die Regel.

## [1.0.0] – 2026-11-19

### Neu
- Abenteuer-Modus mit 10 Leveln auf der Karte von Kandishain und der Geschichte um die Zuckerfee Mira.
- Spezialsteine (Streifen, Bombe, Farbkugel) samt Kombinationen, Hindernisse Zuckerglasur und Lakritzgitter.
- Endlos-Modus mit Zeitleiste und Rekord.
- Fortschritt und Rekord werden im Browser gespeichert.
