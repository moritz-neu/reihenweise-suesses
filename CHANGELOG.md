# Changelog

Alle nennenswerten Änderungen an „Reihenweise Süßes". Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionen nach [Semantic Versioning](https://semver.org/lang/de/).

## [6.2.0] – 2026-11-25

Version 6.2.0 ist auf GitHub (Pages) veröffentlicht.

### Neu
- Kleine Szenen: In jeder Welt zieht etwa einmal pro Minute ein Bewohner quer durchs Bild (Lebkuchenmann, Schneehase, Kamel, Papagei, Biene, Heißluftballon, Segelboot, Ritter, Fischschwarm, Fledermäuse); im Hauptmenü spaziert ein Lebkuchenmann durchs Dorf.

### Verbessert
- Der Bildschirmwechsel blendet ab halber Deckkraft ein, damit ein angehaltener Übergang den Bildschirm nie fast unsichtbar lässt.

## [6.1.0] – 2026-11-25

### Neu
- Lebendige Kulissen je Welt (`js/ui/ambient.js`, `css/ambient.css`): eigener Himmel, eine Horizont-Silhouette (Dächer, Berge, Dünen, Dschungel, Kirschbäume, Wolken, Hafen mit Leuchtturm, Burg, Wellen, Bitterburg) und drei kleine animierte Figuren je Welt, im Spiel, hinter der Karte und auf breiten Fenstern zwei mehr. Schnee, Blüten und Kaugummiblasen ziehen langsam durchs Bild.
- Auf der langen Karte zwei Bewohner je Abschnitt und ein Schleier, der zum Boss hin dunkler wird.
- Figuren auch in der Weltenübersicht und im Hauptmenü.
- Bosskämpfe mit dunklerem Himmel und einem langsam pulsierenden Glühen am Horizont.
- Karte: Annika schwebt über dem nächsten spielbaren Level, der Boss der Welt wartet neben seiner Station, bis er besiegt ist.
- Konfetti nach jedem geschafften Level (beim Boss mehr), sanfte Bildschirmwechsel, im Hauptmenü Sternschnuppen und eine vorbeifliegende Annika.
- Spielfeld und Anzeigen leuchten in den Farben der Welt; lange Kettenreaktionen bekommen ein kurzes Lob („Super!“, „Klasse!“, „Zuckersüß!“, „Fantastisch!“).
- Bonbons glänzen ab und zu auf, Streifen-Bonbons schimmern, Bomben pulsieren; Bosssieg mit goldenem Lichtblitz, Toröffnung mit Konfetti.
- Alle Bewegungen sind langsam, liegen hinter dem Spiel und fangen keine Klicks ab; bei „Bewegung reduzieren“ steht alles still.

## [6.0.1] – 2026-11-25

### Verbessert
- Neue Version ohne Umweg: Liegt eine neue Version bereit, lädt das Spiel einmal von selbst neu, aber nie mitten im Level, im Endlos-Lauf oder bei offenem Dialog (dann beim nächsten Bildschirmwechsel).
- Neuigkeiten im Spiel: Nach einem Update zeigt das Hauptmenü einmal kurz, was neu ist (höchstens die zwei neuesten Versionen), danach mit „Los geht’s“ weggeklickt. Neue Spieler sehen es nicht. Der Knopf „Neuigkeiten“ im Hauptmenü zeigt alle Versionen.

## [6.0.0] – 2026-11-25

Jede Welt hat 100 statt 10 Level. Spielstand-Format bleibt Version 4; Stände aus 5.x laden mit allen Sternen.

### Neu
- 900 Zwischenlevel: je 10 zwischen zwei bisherigen Leveln, die alten stehen auf den Plätzen 1, 12, 23 … 89, der Boss auf Platz 100. Die Zwischenlevel nutzen nur Mechaniken, die ihre Welt kennt, sind mit dem Bot so schwer wie ihre beiden Nachbarn ausgemessen und haben mindestens so viele Züge wie diese, bei höchstens 10 % mehr Punkten oder Bonbons je Zug.
- Lange Levelkarte von unten nach oben mit 100 Stationen: alte Level als Häuser, Zwischenlevel als Bonbon-Steine, Sprungknöpfe zum Boss und zum Anfang; die Karte öffnet beim nächsten Level.
- Einleitungen der Zwischenlevel nennen die Aufgabe, 15 Siegsätze je Welt.
- Generator `tools/generate.html` und Bauskript `tools/build_levels.py`; Messwerte in `docs/balancing.md`.
- Die Joker-Leiste bleibt beim Spielen immer sichtbar am unteren Rand (PC und Handy); das Feld passt sich auch an spätere Höhenänderungen an (Adressleiste, Zoom).

### Geändert
- Levelnummern zählen innerhalb der Welt („Level 3-34“).
- Ladenpreise etwa das Fünffache: Feentausch 75, Zuckerhammer 100, Zuckerbesen 125, +5 Züge 150, Zauberbombe 150, Regenbogenstaub 175.
- Die Karte ist auf allen Geräten senkrecht; die quer liegende Desktop-Karte entfällt.

## [5.2.0] – 2026-11-24

Vorbereitung für den Google Play Store. Spielstand-Format bleibt Version 4.

### Neu
- Installierbare Web-App: Manifest (Kurzname „Süßes“, Vollbild, Hochformat) und Service Worker, damit das Spiel nach dem ersten Start offline läuft.
- App-Symbol (rund und eckig), Startbildschirm-Vorlage, Store-Titelgrafik und sechs Handy-Fotos in `store/`.
- Datenschutzerklärung (`datenschutz.html`, mit Platzhaltern) und Knopf „Datenschutz“ im Hauptmenü.
- Zurück-Taste unter Android und im Browser: schließt Dialoge und führt eine Ebene zurück, im Hauptmenü schließt sie die App.
- Zweitkopie des Spielstands in IndexedDB; ein gelöschter `localStorage` wird beim Start daraus zurückgeholt.
- `tools/check_store.py` prüft Offline-Liste, Version und Manifest.

### Verbessert
- Bedienung wie eine App: kein Zoomen, kein Gummiband, kein Markieren, kein Kontextmenü bei langem Drücken, Hinweis bei quer gehaltenem Handy, Ränder für Kerbe und Gestenleiste.
- Spiel auf dem Handy: kompakte Anzeigen und Joker-Leiste; das Spielfeld passt samt Bossleiste und Jokern ohne Scrollen auf den Bildschirm.

## [5.1.1] – 2026-11-24

### Geändert
- Bosskampf gegen Graf Lakritz (w1-10) ist leichter: 40 statt 36 Züge. Er sperrt je Angriff zwei statt drei Bonbons, in Phase 2 nur noch nach jedem 3. Zug (statt jedem 2.) zwei Bonbons und drei nebeneinander (statt drei und vier). Der Balancing-Bot gewinnt jetzt 97 % statt 77 %.

## [5.1.0] – 2026-11-24

Aufräum-Release ohne neue Level und ohne Änderung der Balancing-Werte. Spielstand-Format bleibt Version 4, Stände aus 4.0.0 und 5.0.0 laden unverändert.

### Behoben
- Zündschnur im letzten Zug: Der Zünder-Tick läuft auch im letzten Zug. Erreicht ein Zähler im letzten Zug 0, gilt das Level als durch die Zündschnur verloren, und „+5 Züge“ verlängert dann auch die Zünder.
- Start-Kaskade: Bonbons, die beim Aufbau des Feldes kaskadieren, zählen für Punkte und Ziele mit.

### Verbessert
- Handy-Layout: Der Kartenkopf ist bis 720 px Breite einzeilig und 40 px hoch, mit Zeichen-Knöpfen für Zurück, Welten und Laden (mit `aria-label` und `title`), gekürztem Titel und kleinen Vorrats-Chips. Die Weltenübersicht läuft bei langen Namen nicht mehr seitlich über; ihr Kopf bleibt bis 600 px zweizeilig. Desktop unverändert.
- Audio: Wartende Effekte verfallen nach 1,5 s, eine Sperre nach einem synchronen `resume`-Fehler fällt wieder, jede Funktion warnt nur einmal, Fades lesen den Wert vor dem Abbrechen, und die Effekte Tor öffnen, Boss besiegt und Zauber enden binnen 0,7 s.
- Code-Struktur: Die Spielfeld-Ansicht ist geteilt, `RS.UI.BoardFx` (`js/ui/boardfx.js`) spielt die Effekte der neuen Mechaniken und Boss-Angriffe ab. Die Logik hat gemeinsame Helfer (`isBlockerCell`, `newCherry`, eine Swap-Kontextfabrik, einheitliche Joker-Ablehnung), die Weltdateien bauen Ids mit einem `level()`-Helfer.
- Stärkere Tests: Temporäre Welten und Bosse werden immer entfernt, Tests für Chamäleons, Kirschen, Zündschnur und Joker prüfen mehr, Boss-Leben und Story sind festgenagelt, ein Spielstand aus 5.0.0 und alle 100 Ids sind abgedeckt.

### Entwicklerwerkzeug
- Balancing-Simulator: Unbekannte Level-Ids, eine unbekannte Welt und unmögliche Probewerte (`hp` ohne Boss, `g0`, ein nicht vorhandenes Ziel) enden mit `BALANCE: ERROR` und benennen das Problem. Kirschen-Zeilen und gefährliche Zünder werden einmal je Zug statt je Kandidat berechnet, die Kisten-Heuristik ist kommentiert.
- README: Belohnung je Stern bis Welt 10, gestraffter Balancing-Abschnitt, Abschnitt „Bekannte Grenzen“, `boardfx.js` in der Projektstruktur.

## [5.0.0] – 2026-11-24

Version 5.0.0 ist auf GitHub (Pages) veröffentlicht.

### Neu
- Welten 5 bis 10 mit je zehn Leveln, eigener Karte, Story, Tor und Musikmotiv: Kirschgarten Morellia (Level 41–50), Zuckerwattenwolken (51–60), Knallhafen (61–70), Marzipanschloss (71–80), Schillerbucht (81–90) und Bitterburg (91–100). Das Spiel hat jetzt 100 Level.
- Bosse mit Leben: Krähe Krawalla (Welt 5, 620), Gewitterhexe Wolkira (Welt 6, 660), Kapitän Knallfrosch (Welt 7, 700), Ritter Mandelbart (Welt 8, 770), Seeschlange Schillerzahn (Welt 9, 990) und Bitterkönig Amarus (Welt 10, 1015). Jeder Boss hat ein Angriffs-Array je Phase; Einträge können mehrere Angriffe mit gemeinsamem Zähler verbinden.
- Finale gegen Bitterkönig Amarus in drei Phasen mit 50 Zügen, Doppelangriffen und Phase-3-Abzeichen.
- Abspann mit einer Szene je Welt und Annikas Abschied, einmalig nach dem Finale. Das Hauptmenü zeigt danach eine Krone und einen Knopf, der den Abspann wiederholt; alle Level bleiben spielbar.
- Neue Hindernisse und Bonbons: Kirschen (Welt 5, fallen in den Korb), Knallbonbons mit Zündschnur und Zähler (Welt 7, verlieren das Level bei 0, Rettung verlängert die Zünder) und Chamäleons, die nach jedem Zug die Farbe wechseln (Welt 9). Neue Ziele „Kirschen“ und „Knallbonbons entschärfen“.
- Neue Joker: Feentausch (Welt 6, 15 Zuckerstangen), Regenbogenstaub (Welt 8, 35) und Zauberbombe (Welt 10, 30). Jeder kostet keinen Zug, zwei gibt es beim ersten Betreten der Welt geschenkt.
- Neue Töne, Wurfgeschosse und Animationen für die neuen Mechaniken und Joker.

### Geändert
- Balancing-Bot: Bei Kirschenzielen zählt jede Zeile Weg einer Kirsche 0,2 Fortschritt, bei Knallbonbons bekommt das Entschärfen bei Zähler 2 oder weniger einen Bonus von 5, Chamäleons brauchen keine Regel. Die Tabelle im README deckt alle zehn Welten ab.
- Die normalen Level der Welt 5 und einzelne Level mit Kirschen spielen mit fünf statt sechs Farben, damit Kirschen oft genug fallen.
- Spielstand-Format bleibt Version 4; ein Abschluss-Merker ist ergänzt, ältere Stände laden unverändert.

### Behoben
- Feentausch: Wird der Joker wieder abgewählt, bleibt keine Markierung zurück, die den nächsten Klick als echten Zug tauscht.

## [4.0.0] – 2026-11-23

Version 4.0.0 ist auf GitHub (Pages) veröffentlicht.

### Neu
- Welt 3 „Karamellwüste“ (Level 21–30) und Welt 4 „Kaugummi-Dschungel“ (Level 31–40), je mit eigener Karte, Story, Tor und Musikmotiv.
- Lebkuchenkisten (Stufe 1 bis 3) als neues Hindernis und das Ziel „Kisten“; die Kisten brechen bei Treffern in der Nachbarschaft Stufe um Stufe auf.
- Neuer Joker Zuckerbesen (25 Zuckerstangen), der eine ganze Reihe abräumt. Er erscheint im Laden nach dem Sieg über den Karamellkoloss, zwei gibt es beim ersten Betreten von Welt 4 geschenkt.
- Bosse Karamellkoloss (Welt 3, 720 Leben) und Kaugummi-Krake Blubba (Welt 4, 615 Leben). Die Boss-Logik unterstützt jetzt auch drei Phasen.
- Weltenübersicht als Übersicht aller Welten, die kommenden als Silhouetten. Kapitelenden mit eigenem Text je Welt; hinter Welt 4 steht „Fortsetzung folgt“.
- Joker-Tabelle mit Name, Preis, Einführungswelt und Wirkung; Laden und Spielleiste lesen daraus und zeigen nur Joker offener Welten.
- Belohnung je Stern wächst mit der Welt: 5 in Welt 1 und 2, 6 in Welt 3, 7 in Welt 4. Der Wiederholungsbonus bleibt 2.
- Musik je Bildschirm und Welt sowie Soundeffekte, erzeugt mit Web Audio ohne Audiodateien. Zwei Schalter im Hauptmenü (Musik, Effekte), die Wahl wird gespeichert.

### Geändert
- Welt 1 und 2 sind leichter. Kein Level ist schwerer als in 3.0.1; Level, die schon leicht genug waren, behalten ihre Werte. Graf Lakritz hat 520 statt 600 Leben, Eiskönigin Kandara 625 statt 730. Level 9 der Welt 1 nennt in der Einleitung jetzt die richtige Zielmenge.
- Spielstand-Format Version 4 (Einstellungen für Musik und Effekte, Vorrat je Joker-Sorte, Merker für Geschenke). Spielstände der Versionen 1 bis 3 werden beim Laden verlustfrei umgewandelt.

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
