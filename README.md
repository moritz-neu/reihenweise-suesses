# Reihenweise Süßes

Ein eigenständiges Match-3-Spiel im Browser: Tausche benachbarte Bonbons, bilde Reihen und bring mit der Zuckerfee Annika zehn Welten wieder zum Leuchten, von Kandishain bis zur Bitterburg. Es gibt hundert Level in zehn Welten im Abenteuer-Modus, zehn Bosskämpfe mit einem Finale in drei Phasen gegen Bitterkönig Amarus, Musik und Soundeffekte und einen Endlos-Modus gegen die Zeit. Wer das Finale schafft, sieht einen Abspann und bekommt eine Krone im Hauptmenü.

## Spielen (lokal)

`index.html` per Doppelklick öffnen. Das Spiel läuft direkt unter `file://`, ohne Installation, Server oder Internetverbindung. Unterstützt werden aktuelle Versionen von Chrome, Edge und Firefox.

Das Abenteuer hat zehn Welten mit je zehn Leveln: Kandishain (Welt 1), Frostzuckerberge (2), Karamellwüste (3), Kaugummi-Dschungel (4), Kirschgarten Morellia (5), Zuckerwattenwolken (6), Knallhafen (7), Marzipanschloss (8), Schillerbucht (9) und Bitterburg (10). Der Welten-Atlas zeigt sie alle, die noch verschlossenen als Silhouetten. Am Ende jeder Welt steht ein Tor, das verschlossen bleibt, bis der Boss der Welt besiegt ist („Besiege Graf Lakritz, um das Tor zu öffnen.“). Danach öffnet es sich und führt in die nächste Welt; dort bringt ein Tor zurück. Nach dem Sieg über Bitterkönig Amarus in Welt 10 folgen das Kapitelende, ein einmaliger Abspann mit einer Szene je Welt und Annikas Abschied. Danach trägt das Hauptmenü eine Krone und einen Knopf, mit dem sich der Abspann wiederholen lässt; alle Level bleiben spielbar.

Das jeweils zehnte Level einer Welt ist ein Bosskampf: Graf Lakritz (Welt 1), Eiskönigin Kandara (2), Karamellkoloss (3), Kaugummi-Krake Blubba (4), Krähe Krawalla (5), Gewitterhexe Wolkira (6), Kapitän Knallfrosch (7), Ritter Mandelbart (8), Seeschlange Schillerzahn (9) und Bitterkönig Amarus (10). Das Ziel ist, die Lebensleiste des Bosses auf 0 zu bringen:

- Jedes aufgelöste Bonbon macht 1 Schaden, ein Bonbon in der Schwachstellen-Farbe des Bosses 2 (Farbkugeln zählen 1). Eine Kombination aus zwei Spezialsteinen oder mit einer Farbkugel gibt einmalig +10. Der Zuckerhammer macht ebenfalls Schaden.
- Die Bosse der Welten 1 bis 9 haben zwei Phasen, Amarus hat drei. Sinkt das Leben auf die Hälfte (bei Amarus auf zwei Drittel und ein Drittel), wechseln die Schwachstelle (Graf Lakritz: Rot, dann Blau; Kandara: Gelb, dann Violett; Koloss: Orange, dann Gelb; Blubba: Grün, dann Violett; Krawalla: Rot, dann Grün; Wolkira: Blau, dann Orange; Knallfrosch: Orange, dann Gelb; Mandelbart: Gelb, dann Violett; Schillerzahn: Grün, dann Blau; Amarus: Violett, Rot, Blau) und der Angriffsrhythmus.
- Er greift nach jedem 3. Zug an, in Phase 2 nach jedem 2. (Graf Lakritz auch in Phase 2 nur nach jedem 3.). Jeder Boss hat dafür ein Angriffs-Array mit einem Eintrag je Phase; ein Eintrag kann auch mehrere Angriffe verbinden, die einen gemeinsamen Zähler teilen. Graf Lakritz sperrt je Angriff zwei Bonbons mit Lakritzgittern (in Phase 2 zusätzlich drei nebeneinander in einer Reihe), Kandara legt dicke Glasur, später dickes Eis auf Bonbons, der Koloss setzt Kisten, Blubba dicke Glasur und Gitter, Krawalla Glasur und Gitter, Wolkira Eis und Schokolade, Knallfrosch Knallbonbons (später zusätzlich Kisten), Mandelbart Kisten und Glasur, Schillerzahn Chamäleons (später zusätzlich Eis) und Amarus Gitter und Eis, dann Kisten und Schokolade, zuletzt Knallbonbons und Chamäleons. Hammer, Sternenzauber und „+5 Züge“ zählen nicht als Zug.
- Der Sternenzauber lädt sich mit jedem aufgelösten Bonbon auf und ist bei 40 voll. Per Knopf macht er 25 Schaden (unabhängig von der Schwachstelle) und entfernt bis zu 6 Hindernisse. Er kostet keinen Zug und löst keinen Angriff aus.

Neue Hindernisse in Welt 2: Eis liegt auf einem Bonbon (Stufe 1 oder 2). Es lässt sich nicht tauschen und fällt nicht, taut aber durch Reihen in der Nachbarschaft sowie durch Spezialsteine und Hammer. Schokolade belegt ein Feld und wächst nach einem Zug, in dem keine Schokolade entfernt wurde, auf ein Nachbarbonbon. Das neue Ziel „Schokolade entfernen“ verlangt, alle Schokolade zu beseitigen.

Neu in Welt 3: Lebkuchenkisten (Stufe 1 bis 3). Sie liegen statt eines Bonbons auf dem Feld, lassen sich nicht tauschen und verlieren bei Treffern in der Nachbarschaft eine Stufe. Das Ziel „Kisten“ verlangt, alle zu beseitigen. In Welt 4 gibt es den neuen Joker Zuckerbesen, der eine ganze Reihe abräumt.

Neu in Welt 5: Kirschen. Eine Kirsche liegt statt eines Bonbons auf dem Feld und gehört nie zu einer Reihe. Reihen unter ihr lassen sie nach unten fallen; erreicht sie den untersten Platz ihrer Spalte, landet sie im Korb. Das Ziel „Kirschen“ verlangt, alle einzusammeln. In Welt 6 kommt der Joker Feentausch dazu (tauscht zwei Nachbarn auch ohne Reihe). Neu in Welt 7: Knallbonbons mit Zündschnur. Ihr Zähler sinkt nach jedem Zug; steht er auf 0, ist das Level verloren. Sie werden entschärft, indem sie in einer Reihe aufgelöst werden (Ziel „Knallbonbons entschärfen“), und eine Rettung verlängert alle Zünder. In Welt 8 kommt der Regenbogenstaub (entfernt alle Bonbons einer Farbe). Neu in Welt 9: Chamäleons, Bonbons, die nach jedem Zug die Farbe wechseln. In Welt 10 kommt die Zauberbombe (sprengt ein Feld von drei mal drei), und die Level verbinden alle Mechaniken des Spiels.

Sterne gibt es für übrige Züge: Wer ein Level schafft, bekommt einen Stern, zwei Sterne mit mindestens einem Viertel der Züge übrig und drei Sterne mit mindestens der Hälfte (jeweils aufgerundet). Die Punkte zählen nur für die Anzeige und Punkteziele.

Zuckerstangen sind die Währung des Spiels. Wer ein Level zum ersten Mal schafft, bekommt je Stern 5 Zuckerstangen in Welt 1 und 2, danach je Welt eine mehr: 6 in Welt 3, 7 in Welt 4 und so weiter bis 13 in Welt 10 (also 5, 5, 6, 7, 8, 9, 10, 11, 12, 13). Beim erneuten Spielen gibt es 5 je neu dazugewonnenem Stern und immer 2 obendrauf. Eine Endlos-Runde bringt 1 Zuckerstange je vollen 1000 Punkten. Neue Spielstände starten mit 0 Zuckerstangen.

Dafür gibt es im Laden auf der Levelkarte die Joker „+5 Züge“ für 30 Zuckerstangen, den „Zuckerhammer“ für 20, der ein Bonbon mit einem Schlag entfernt, und den „Zuckerbesen“ für 25, der eine ganze Reihe räumt, den „Feentausch“ für 15, der zwei Nachbarn tauscht, den „Regenbogenstaub“ für 35, der alle Bonbons einer Farbe entfernt, und die „Zauberbombe“ für 30, die ein Feld von drei mal drei sprengt. Alle Joker außer „+5 Züge“ kosten keinen Zug. Der Laden zeigt nur Joker, deren Welt offen ist (der Besen nach dem Sieg über den Karamellkoloss, der Feentausch nach Krawalla, der Regenbogenstaub nach Knallfrosch, die Zauberbombe nach Schillerzahn). Vom Vorrat passen höchstens 10 je Joker. Zum Start liegt von „+5 Züge“ und Hammer je einer bereit, von jedem neuen Joker gibt es zwei geschenkt, sobald seine Einführungswelt (4, 6, 8, 10) betreten wird. Joker gelten nur im Abenteuer-Modus, übrige Züge zählen für die Sterne ganz normal mit. Geht ein Level verloren, bietet der Dialog mit vorhandenem Vorrat eine Rettung an.

Der Fortschritt (freigeschaltete Level, Abschluss des Spiels, Sterne, Tor- und Story-Stand, Endlos-Rekord, Zuckerstangen, Joker-Vorrat, Einstellungen für Musik und Effekte) liegt im `localStorage` des Browsers. Eine Zweitkopie liegt in IndexedDB (`js/save-mirror.js`): Ist der `localStorage` beim Start leer, holt das Spiel den Stand von dort zurück. Der Spielstand hat das Format Version 4; ältere Stände (Version 1 bis 3) werden beim Laden umgewandelt, ohne dass Fortschritt verloren geht. Ist kein Speicher verfügbar, läuft das Spiel ohne Speichern weiter.

## Als App (Play Store)

Das Spiel ist als installierbare Web-App vorbereitet und kann so in eine App-Hülle für den Play Store (später auch den App Store) gepackt werden. Eine `index.html` dient allen Zielen; was nur auf einem Ziel gilt, entscheidet `js/platform.js`.

- **Installierbar und offline:** `manifest.webmanifest` (Name „Reihenweise Süßes“, Kurzname „Süßes“, Vollbild, Hochformat, Nachtblau) und `sw.js` (Service Worker). Nach dem ersten Start über http(s) liegen alle Dateien im Offline-Speicher. Unter `file://` und auf dem Hub gibt es keinen Service Worker.
- **Neue Version:** `VERSION` in `sw.js` muss zur obersten Version im CHANGELOG passen, sonst behalten installierte Apps die alten Dateien. Eine neue Datei, die `index.html` lädt, gehört auch in `ASSETS` von `sw.js`. Beides prüft `python tools/check_store.py` (Windows, macOS, Linux; Ausgabe `STORE CHECK: OK`).
- **Bedienung wie eine App:** kein Zoomen, kein Gummiband am Rand, kein Markieren, kein Menü bei langem Drücken mit dem Finger. Ein Handy quer zeigt einen Hinweis zum Drehen. Ränder für Kerbe und Gestenleiste kommen aus `env(safe-area-inset-*)` (CSS-Variablen `--safe-top` usw. in `css/theme.css`).
- **Spielfeld auf dem Handy:** Anzeigen und Joker-Leiste sind bis 600 px Breite kompakt (Joker nur mit Zeichen und Vorrat). Das Feld wird so weit verkleinert (höchstens bis 240 px), dass alles ohne Scrollen passt (`fitBoard` in `js/ui/game.js`).
- **Zurück-Taste (Android und Browser):** schließt erst einen offenen Dialog, drückt sonst den Zurück-Knopf des Bildschirms (mit dessen Rückfrage, etwa „Level verlassen?“) und schließt im Hauptmenü die App (`js/ui/backnav.js`). Neue Bildschirme markieren ihren Zurück-Knopf mit `RS.UI.Back.mark(button)`, Dialogknöpfe mit `back: true`.
- **Datenschutz:** `datenschutz.html` und ein Knopf im Hauptmenü. Vor der Veröffentlichung die Platzhalter `[NAME]`, `[ANSCHRIFT]`, `[E-MAIL]` und `[HOSTER …]` ausfüllen und den Text rechtlich prüfen lassen. Die Seite muss öffentlich erreichbar sein, der Play Store verlangt ihren Link.
- **Store-Grafiken in `store/`:** Symbol 512 × 512 für den Play Store (`play-icon-512.png`), Titelgrafik 1024 × 500 (`feature-graphic-1024x500.png`), sechs Handy-Fotos 1080 × 2160 (`screenshots/`), dazu `icon-1024.png` und `splash-2732.png` als Vorlagen für eine App-Hülle. Die App-Symbole liegen in `icons/` (Quellen `icon.svg` und `icon-maskable.svg`).
- **App-Hülle (noch offen):** Empfohlen ist Capacitor. Es packt die Dateien in die App, braucht keine eigene Domain und taugt später auch für iOS. Ein Spiegel für dessen Speicher (`@capacitor/preferences`) lässt sich mit `RS.Save.setMirror` einsetzen. Eine Trusted Web Activity bräuchte `/.well-known/assetlinks.json` im Hauptverzeichnis der Domain, das geht unter `moritz-neu.github.io/reihenweise-suesses/` nicht.

## Musik und Effekte

Musik und Soundeffekte entstehen zur Laufzeit mit Web Audio, es gibt keine Audiodateien. Jeder Bildschirm hat seine Musik, jede Welt ein eigenes Motiv (Tempo, Tonleiter, Klangfarbe, Bass, Trommeln, Melodien) in ihrer Weltdatei. Im Hauptmenü schalten zwei Schalter Musik und Effekte getrennt ein und aus; die Wahl steht im Spielstand. Browser geben Ton erst nach der ersten Eingabe frei, deshalb startet der Ton mit dem ersten Klick oder Tipp. Ohne Web Audio läuft das Spiel still weiter.

## Neues Level ergänzen

1. In der Weltdatei `js/data/worlds/wNN.js` einen neuen Eintrag in `levels` anlegen, mit frischer Id (zum Beispiel `w3-11`), `colors`, `moves`, `goals`, `layout`, `intro` (die Aufgabe in einem Satz) und `win`. Die Seeds kommen aus der Id.
2. Mit `tests/balance.html?levels=w3-11` messen und `moves` und Zielmengen verschieben, bis das Urteil `OK` lautet (Zielquote aus `js/data/curve.js`). Mit `&set=w3-11.moves=30` lässt sich ohne Dateiänderung probieren.
3. Die Tests laufen lassen (Abschnitt Tests) und die Zeile in die Tabelle im Balancing-Abschnitt aufnehmen.

## Neue Welt ergänzen

1. Zwei Dateien anlegen: `js/data/worlds/wNN.js` (Daten: `RS.Worlds.register({ id, key, name, novelty, intro, chapterEnd, gateLocked, music, boss, levels })`, Vorbild `w03.js`) und `js/ui/worlds/wNN.js` (Kartenbild, Bossfigur und Atlas-Stil, Vorbild `w03.js` im Ordner `ui/worlds`).
2. Beide Dateien als `<script>`-Tags eintragen, in `index.html`, `tests/tests.html` und `tests/balance.html`, jeweils hinter den Dateien der vorigen Welt.
3. Ein Musikmotiv (`music`) für die Welt schreiben; `RS.Worlds` prüft es beim Registrieren.
4. Das erste Level der Welt ist ein Einführungslevel für die Neuheit und hat mindestens 15 Züge. Liest es dann `ZU LEICHT`, ist das in Ordnung.
5. Mit dem Balancing-Simulator (`welt=N`) einstellen, die Tabelle ergänzen und die Tests laufen lassen.

## Tests

- **Im Browser:** `tests/tests.html` per Doppelklick öffnen. Die Seite zeigt jedes Testergebnis und unten die Zusammenfassung `RESULT: PASS n/n`.
- **Auf der Kommandozeile** (Git Bash, im Repo-Wurzelverzeichnis):

  ```bash
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/tests.html" 2>/dev/null | grep -o 'id="summary">RESULT: [^<]*'
  ```

  Grün ist die Ausgabe `id="summary">RESULT: PASS n/n`. Unter macOS geht dasselbe mit Chrome und denselben Schaltern.

## Balancing-Simulator

`tests/balance.html` ist ein Entwicklerwerkzeug und gehört nicht zur Testseite. Ein Bot spielt jedes Level mit 200 Startwerten, jeder Lauf auf einem eigenen Feld. Er probiert jeden Zug auf einer Kopie der Sitzung aus und nimmt zuerst einen Gewinnzug, dann den meisten Fortschritt auf die offenen Ziele, dann die meisten Punkte; Gleichstände entscheidet sein Zufall, im Bosskampf löst er den Sternenzauber bei voller Leiste aus und Joker nutzt er nie. Für Kirschen (je Zeile Weg 0,2 Fortschritt) und Knallbonbons (Bonus 5 für das Entschärfen bei Zähler 2 oder weniger) gibt es eigene Regeln, die Heuristiken stehen als Kommentare in `tests/balance.js`. Er sieht nachfallende Bonbons voraus, seine Quoten sind deshalb obere Grenzen für Menschen. Eine Welt mit 200 Startwerten dauert etwa eineinhalb bis zwei Minuten; für mehr Tempo lassen sich mehrere Welten in eigenen Browser-Prozessen mit je eigenem `--user-data-dir` messen.

Parameter in der Adresse:

- `?seeds=50` Anzahl der Startwerte (Standard 200)
- `&welt=3` nur diese Welt; ohne `welt` und `levels` laufen alle registrierten Level
- `&levels=w3-01,w3-02` nur diese Level (Ids)
- `&set=w3-01.moves=30;w1-05.g1=20` Probewerte, ohne die Weltdateien zu ändern (`gN` ist die Zielmenge des N-ten Ziels)
- `&set=w3-10.hp=500` Probewert für die Leben des Bosses in diesem Level
- `&boards=fixed` fester Level-Startwert wie im Spiel (der Bot spielt dann oft jede Partie gleich, die Quote ist nur 0 oder 100 %)
- `&bot=greedy` einfacher gieriger Bot, der nur Punkte zählt

Unbekannte Level-Ids, eine unbekannte Welt oder ein unmöglicher Probewert (`hp` ohne Boss, `g0`, ein nicht vorhandenes Ziel) enden mit `BALANCE: ERROR` und der Ursache statt mit einer leeren Tabelle.

Jede Zeile zeigt die Zielquote aus `RS.Curve`, die gemessene Quote und das Urteil: `OK` (Abweichung höchstens 5 Punkte), `ZU LEICHT` (mehr als 5 über dem Ziel) oder `ZU SCHWER` (mehr als 5 darunter).

Headless (Git Bash, Edge), Beispiel eine Welt mit 20 Startwerten:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/balance.html?welt=1&seeds=20" 2>/dev/null | grep -A14 'id="out"'
```

Voller Lauf (alle registrierten Level, 200 Startwerte) mit demselben Befehl ohne Parameter: Er dauert je Welt etwa 1 bis 2 Minuten (`--virtual-time-budget` war nicht nötig). Reicht der Tool-Timeout nicht für alle Welten, Welt für Welt mit `welt=N` laufen lassen oder `seeds=50` nehmen:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/balance.html" 2>/dev/null | grep -E 'Außerhalb|Laufzeit|w[0-9]+-[0-9]+ |summary"'
```

Die Zielquote je Level kommt aus `RS.Curve` (Siegquote des Bots ohne Joker, Toleranz ±5 Punkte). Stand der Welten 1 bis 10 mit 200 Startwerten (24.11.2026): Alle Level liegen auf `OK`, außer w1-01, w1-02, w1-03, w1-05 (schon in 3.0.1 `ZU LEICHT`, der Bot sättigt dort bei etwa 100 %), w6-01 (Einführungslevel mit 15 Zügen) und w1-10: Graf Lakritz ist auf Wunsch aus dem Spieltest bewusst leichter (40 Züge, weniger Gitter), der Bot gewinnt dort 97 %. Die Leben der Bosse stehen im `boss`-Block der Weltdatei. Die normalen Level der Welt 5 sowie w6-01, w6-07, w7-05, w8-05, w9-05 und w10-05 spielen mit fünf Farben, damit Kirschen oft genug fallen. In Welt 7 und in w10-03 und w10-07 bestimmen die Knallbonbons die Schwierigkeit mehr als die Züge, in w8-06 die Dichte der Schokolade. Das Finale (Amarus, 50 Züge) reagiert stark auf die Leben: 60 mehr oder weniger verschieben die Quote um rund 15 Punkte.

| Level | Züge | Ziele | Zielquote % | Gemessen % |
|---|---|---|---|---|
| w1-01 | 20 | 3000 Punkte (wie 3.0.1) | 90 | 100 |
| w1-02 | 18 | 4000 Punkte (wie 3.0.1) | 89,5 | 100 |
| w1-03 | 18 | 25 Rot (wie 3.0.1) | 89 | 100 |
| w1-04 | 22 | 20 Blau + 20 Gelb (wie 3.0.1) | 88,5 | 90 |
| w1-05 | 24 | 6000 Punkte + 25 Grün (wie 3.0.1) | 88 | 98 |
| w1-06 | 20 | Glasur | 87,5 | 85 |
| w1-07 | 25 | Glasur | 87 | 82 |
| w1-08 | 32 | Glasur + 20 Violett | 86,5 | 84 |
| w1-09 | 47 | Glasur + 10 Gelb | 86 | 84 |
| w1-10 | 40 | Boss, 520 Leben, weniger Gitter (bewusst leichter) | 78 | 97 |
| w2-01 | 21 | 5200 Punkte | 83,5 | 81 |
| w2-02 | 24 | 25 Blau + 25 Violett | 83 | 87 |
| w2-03 | 20 | 26 Grün | 82,5 | 86 |
| w2-04 | 22 | Glasur | 82 | 81 |
| w2-05 | 21 | 24 Gelb | 81,5 | 83 |
| w2-06 | 20 | Schokolade | 81 | 76 |
| w2-07 | 24 | Schokolade | 80,5 | 76 |
| w2-08 | 23 | Schokolade + Glasur + 20 Rot | 80 | 80 |
| w2-09 | 34 | Glasur + Schokolade | 79,5 | 77 |
| w2-10 | 40 | Boss, 625 Leben | 72 | 70 |
| w3-01 | 15 | 16 Kisten | 82 | 83 |
| w3-02 | 18 | Kisten + 24 Orange | 76,5 | 78 |
| w3-03 | 19 | Kisten + 5000 Punkte | 76 | 78 |
| w3-04 | 20 | Glasur + Kisten | 75,5 | 72 |
| w3-05 | 18 | Kisten + 24 Gelb | 75 | 76 |
| w3-06 | 26 | Kisten | 74,5 | 76 |
| w3-07 | 20 | Schokolade + Kisten | 74 | 76 |
| w3-08 | 28 | Glasur + 20 Rot | 73,5 | 76 |
| w3-09 | 39 | Kisten + Glasur | 73 | 74 |
| w3-10 | 40 | Boss, 720 Leben | 65 | 63 |
| w4-01 | 19 | Glasur in zwei ganzen Reihen | 75,5 | 75 |
| w4-02 | 20 | 30 Grün | 70 | 68 |
| w4-03 | 25 | Glasur + 5000 Punkte | 69,5 | 68 |
| w4-04 | 14 | Kisten | 69 | 71 |
| w4-05 | 20 | 28 Blau | 68,5 | 64 |
| w4-06 | 22 | Schokolade + Glasur | 68 | 65 |
| w4-07 | 24 | Glasur + Kisten | 67,5 | 64 |
| w4-08 | 22 | Glasur + 26 Violett | 67 | 66 |
| w4-09 | 26 | Kisten + Glasur | 66,5 | 64 |
| w4-10 | 40 | Boss, 615 Leben | 59 | 60 |
| w5-01 | 16 | 3 Kirschen | 69 | 70 |
| w5-02 | 18 | 3 Kirschen + 22 Rot | 63,5 | 60 |
| w5-03 | 19 | 3 Kirschen + Glasur | 63 | 68 |
| w5-04 | 21 | 3 Kirschen + Kisten | 62,5 | 64 |
| w5-05 | 25 | 4 Kirschen + 5000 Punkte | 62 | 63 |
| w5-06 | 20 | 3 Kirschen + Schokolade | 61,5 | 64 |
| w5-07 | 22 | 4 Kirschen + 24 Gelb | 61 | 59 |
| w5-08 | 24 | 4 Kirschen + Glasur | 60,5 | 62 |
| w5-09 | 26 | 4 Kirschen + Kisten + Glasur | 60 | 64 |
| w5-10 | 40 | Boss, 620 Leben | 52 | 52 |
| w6-01 | 15 | Glasur in engen Wolkenbuchten | 62,5 | 69 |
| w6-02 | 22 | 26 Blau | 57 | 54 |
| w6-03 | 18 | Glasur + 6500 Punkte | 56,5 | 56 |
| w6-04 | 24 | Kisten | 56 | 57 |
| w6-05 | 22 | 34 Orange | 55,5 | 55 |
| w6-06 | 16 | Schokolade | 55 | 56 |
| w6-07 | 20 | 3 Kirschen + 18 Gelb | 54,5 | 53 |
| w6-08 | 18 | Glasur + Kisten | 54 | 53 |
| w6-09 | 25 | Kisten + Glasur | 53,5 | 57 |
| w6-10 | 40 | Boss, 660 Leben | 46 | 47 |
| w7-01 | 15 | 6 Knallbonbons entschärfen | 56 | 56 |
| w7-02 | 19 | 30 Rot, Knallbonbons als Gefahr | 50,5 | 49 |
| w7-03 | 22 | Glasur + 5 Knallbonbons | 50 | 48 |
| w7-04 | 28 | Kisten, Knallbonbons als Gefahr | 49,5 | 52 |
| w7-05 | 16 | 3 Kirschen + 4 Knallbonbons | 49 | 51 |
| w7-06 | 16 | Schokolade, Knallbonbons als Gefahr | 48,5 | 48 |
| w7-07 | 19 | 6000 Punkte + 4 Knallbonbons | 48 | 47 |
| w7-08 | 23 | Glasur + Kisten, Knallbonbons als Gefahr | 47,5 | 46 |
| w7-09 | 24 | 20 Orange + 5 Knallbonbons | 47 | 45 |
| w7-10 | 40 | Boss, 700 Leben | 39 | 40 |
| w8-01 | 15 | 27 Violett | 49,5 | 52 |
| w8-02 | 17 | 34 Rot | 44 | 41 |
| w8-03 | 16 | Glasur + 6000 Punkte | 43,5 | 46 |
| w8-04 | 17 | Kisten | 43 | 44 |
| w8-05 | 14 | 3 Kirschen + 18 Grün | 42,5 | 42 |
| w8-06 | 15 | Schokolade | 42 | 45 |
| w8-07 | 18 | 24 Blau + 5 Knallbonbons | 41,5 | 41 |
| w8-08 | 18 | Glasur + Kisten | 41 | 41 |
| w8-09 | 20 | 29 Gelb + Kisten | 40,5 | 41 |
| w8-10 | 40 | Boss, 770 Leben | 33 | 32 |
| w9-01 | 15 | 32 Blau | 43 | 44 |
| w9-02 | 13 | 29 Rot + 29 Gelb | 37,5 | 37 |
| w9-03 | 15 | Glasur + 25 Grün | 37 | 42 |
| w9-04 | 18 | Kisten + 23 Orange | 36,5 | 39 |
| w9-05 | 15 | 4 Kirschen + 26 Violett (5 Farben) | 36 | 40 |
| w9-06 | 14 | Schokolade + 27 Blau | 35,5 | 34 |
| w9-07 | 15 | 32 Rot + 4 Knallbonbons | 35 | 38 |
| w9-08 | 14 | 7000 Punkte + 32 Gelb | 34,5 | 37 |
| w9-09 | 17 | Glasur + Kisten + 28 Grün | 34 | 38 |
| w9-10 | 40 | Boss, 990 Leben | 26 | 28 |
| w10-01 | 22 | Kisten (zwei Blöcke 3 × 3) | 36,5 | 36 |
| w10-02 | 14 | 30 Violett | 31 | 34 |
| w10-03 | 16 | Glasur + 4 Knallbonbons | 30,5 | 30 |
| w10-04 | 19 | Kisten + 22 Orange | 30 | 33 |
| w10-05 | 13 | 3 Kirschen + 27 Grün (5 Farben) | 29,5 | 34 |
| w10-06 | 13 | Schokolade + 30 Blau | 29 | 26 |
| w10-07 | 17 | 4 Knallbonbons + Kisten | 28,5 | 32 |
| w10-08 | 14 | 7500 Punkte + 30 Gelb | 28 | 25 |
| w10-09 | 18 | Glasur + Kisten + 23 Rot | 27,5 | 26 |
| w10-10 | 50 | Boss, 1015 Leben | 22 | 23 |

Der Bot sieht nachfallende Bonbons voraus. Deshalb sind Züge und Zielmengen großzügiger als es für Menschen nötig wäre, und die Bosse brauchen weniger Leben als die Richtwerte der Spec nahelegen würden.

## Projektstruktur

```
index.html          Einstieg, lädt alle Skripte in fester Reihenfolge
manifest.webmanifest, sw.js   Installierbare Web-App und Offline-Speicher
datenschutz.html    Datenschutzerklärung (Platzhalter ausfüllen)
icons/, store/      App-Symbole; Grafiken und Fotos für den Store
tools/check_store.py  Prüft Offline-Liste, Version und Manifest vor einem Release
css/                Stil „Mystische Zuckernacht": Farben, Bonbons, Karte, HUD, Dialoge, Laden (shop.css),
                    Bosskampf (boss.css)
js/logic/           Spiellogik ohne DOM: Zufall, Feld, Spezialsteine, Hindernisse,
                    Kirschen (cherries.js), Knallbonbons (fuses.js), Chamäleons (chameleons.js),
                    Ziele, Sitzung (Level und Endlos), Laden (shop.js), Joker-Tabelle (jokers.js),
                    Bosskampf (boss.js), Fortschritt und Weltöffnung (progress.js)
js/data/            Welt-Registry (registry.js), Schwierigkeitskurve (curve.js), Story-Texte,
                    worlds/ mit einer Datei je Welt, w01.js bis w10.js (Level, Boss, Musikmotiv, Texte)
js/ui/              Bildschirme: Startmenü, Welten-Atlas (atlas.js), Abspann (credits.js), Levelkarte (map.js, mapkit.js),
                    Spielfeld (game.js, boardview.js, boardfx.js), Endlos, Dialoge, Laden (shop.js), Effekte, Bossfigur (bossview.js),
                    Zurück-Taste (backnav.js),
                    worlds/ mit Kartenbild und Bossfigur je Welt, w01.js bis w10.js
js/save.js          Speichern und Laden (localStorage, Format Version 4)
js/save-mirror.js   Zweitkopie des Spielstands in IndexedDB
js/platform.js      Wo läuft das Spiel (Hub, Service Worker, installierte App)
js/audio.js         Web-Audio-Motor: Sequenzer, Musik je Bildschirm, Einstellungen
js/audio-sfx.js     Tabelle der Soundeffekte
js/main.js          Start und Verdrahtung
tests/              Testseite, Test-Runner, Tests je Logik-Modul (u. a. boss.test.js), Balancing-Simulator
```

Alle Dateien sind klassische `<script>`-Tags ohne ES-Module und hängen ihre Exporte an den Namensraum `window.RS`. Die Logik liefert zu jedem Zug eine geordnete Liste von Ereignissen, die Darstellung spielt sie als Animation ab.

## Bekannte Grenzen

- Der Bot spielt stärker als Menschen, die Siegquoten sind obere Grenzen.
- Level mit vielen Zündschnur-Bonbons reagieren kaum auf die Zahl der Züge.
- Einige Level spielen mit fünf statt sechs Farben.
- Gespeichert wird nur im Browser, es gibt keinen Abgleich zwischen Geräten.
- Auf dem Handy gibt es keine eigenen Touch-Gesten, nur Tippen und Ziehen wie bisher.
- Der Spiegel in IndexedDB hilft nicht, wenn der Browser alle Websitedaten auf einmal löscht.
- Es gibt noch keine App-Hülle; der Play-Store-Eintrag braucht Capacitor (oder eine eigene Domain für eine Trusted Web Activity).
