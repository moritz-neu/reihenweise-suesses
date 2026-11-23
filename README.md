# Reihenweise Süßes

Ein eigenständiges Match-3-Spiel im Browser: Tausche benachbarte Bonbons, bilde Reihen und bring mit der Zuckerfee Annika die Welten Kandishain, Frostzuckerberge, Karamellwüste und Kaugummi-Dschungel wieder zum Leuchten. Es gibt vierzig Level in vier Welten im Abenteuer-Modus, vier Bosskämpfe, Musik und Soundeffekte und einen Endlos-Modus gegen die Zeit.

## Spielen (lokal)

`index.html` per Doppelklick öffnen. Das Spiel läuft direkt unter `file://`, ohne Installation, Server oder Internetverbindung. Unterstützt werden aktuelle Versionen von Chrome, Edge und Firefox.

Das Abenteuer hat vier Welten mit je zehn Leveln: Kandishain (Welt 1), Frostzuckerberge (2), Karamellwüste (3) und Kaugummi-Dschungel (4). Der Welten-Atlas zeigt sie alle, die kommenden als Silhouetten. Am Ende jeder Welt steht ein Tor, das verschlossen bleibt, bis der Boss der Welt besiegt ist („Besiege Graf Lakritz, um das Tor zu öffnen.“). Danach öffnet es sich und führt in die nächste Welt; dort bringt ein Tor zurück. Hinter Welt 4 endet die Geschichte vorerst mit „Fortsetzung folgt“.

Das jeweils zehnte Level einer Welt ist ein Bosskampf: Graf Lakritz (Welt 1), Eiskönigin Kandara (2), Karamellkoloss (3) und Kaugummi-Krake Blubba (4). Das Ziel ist, die Lebensleiste des Bosses auf 0 zu bringen:

- Jedes aufgelöste Bonbon macht 1 Schaden, ein Bonbon in der Schwachstellen-Farbe des Bosses 2 (Farbkugeln zählen 1). Eine Kombination aus zwei Spezialsteinen oder mit einer Farbkugel gibt einmalig +10. Der Zuckerhammer macht ebenfalls Schaden.
- Die vier Bosse haben zwei Phasen, die Boss-Logik kann auch drei. Sinkt das Leben auf die Hälfte, wechseln die Schwachstelle (Graf Lakritz: Rot, dann Blau; Kandara: Gelb, dann Violett; Koloss: Orange, dann Gelb; Blubba: Grün, dann Violett) und der Angriffsrhythmus.
- Er greift nach jedem 3. Zug an, in Phase 2 nach jedem 2. Graf Lakritz sperrt Bonbons mit Lakritzgittern (in Phase 2 zusätzlich eine halbe Reihe), Kandara legt dicke Glasur, später dickes Eis auf Bonbons, der Koloss setzt Kisten, Blubba dicke Glasur und Gitter. Hammer, Sternenzauber und „+5 Züge“ zählen nicht als Zug.
- Der Sternenzauber lädt sich mit jedem aufgelösten Bonbon auf und ist bei 40 voll. Per Knopf macht er 25 Schaden (unabhängig von der Schwachstelle) und entfernt bis zu 6 Hindernisse. Er kostet keinen Zug und löst keinen Angriff aus.

Neue Hindernisse in Welt 2: Eis liegt auf einem Bonbon (Stufe 1 oder 2). Es lässt sich nicht tauschen und fällt nicht, taut aber durch Reihen in der Nachbarschaft sowie durch Spezialsteine und Hammer. Schokolade belegt ein Feld und wächst nach einem Zug, in dem keine Schokolade entfernt wurde, auf ein Nachbarbonbon. Das neue Ziel „Schokolade entfernen“ verlangt, alle Schokolade zu beseitigen.

Neu in Welt 3: Lebkuchenkisten (Stufe 1 bis 3). Sie liegen statt eines Bonbons auf dem Feld, lassen sich nicht tauschen und verlieren bei Treffern in der Nachbarschaft eine Stufe. Das Ziel „Kisten“ verlangt, alle zu beseitigen. In Welt 4 gibt es den neuen Joker Zuckerbesen, der eine ganze Reihe abräumt.

Sterne gibt es für übrige Züge: Wer ein Level schafft, bekommt einen Stern, zwei Sterne mit mindestens einem Viertel der Züge übrig und drei Sterne mit mindestens der Hälfte (jeweils aufgerundet). Die Punkte zählen nur für die Anzeige und Punkteziele.

Zuckerstangen sind die Währung des Spiels. Wer ein Level zum ersten Mal schafft, bekommt je Stern 5 Zuckerstangen in Welt 1 und 2, 6 in Welt 3 und 7 in Welt 4 (je Welt eine mehr). Beim erneuten Spielen gibt es 5 je neu dazugewonnenem Stern und immer 2 obendrauf. Eine Endlos-Runde bringt 1 Zuckerstange je vollen 1000 Punkten. Neue Spielstände starten mit 0 Zuckerstangen.

Dafür gibt es im Laden auf der Levelkarte die Joker „+5 Züge“ für 30 Zuckerstangen, den „Zuckerhammer“ für 20, der ein Bonbon mit einem Schlag entfernt, und den „Zuckerbesen“ für 25, der eine ganze Reihe räumt. Hammer und Besen kosten keinen Zug. Der Laden zeigt nur Joker, deren Welt offen ist (der Besen nach dem Sieg über den Karamellkoloss). Vom Vorrat passen höchstens 10 je Joker. Zum Start liegt von „+5 Züge“ und Hammer je einer bereit, vom Besen gibt es zwei geschenkt, sobald Welt 4 betreten wird. Joker gelten nur im Abenteuer-Modus, übrige Züge zählen für die Sterne ganz normal mit. Geht ein Level verloren, bietet der Dialog mit vorhandenem Vorrat eine Rettung an.

Der Fortschritt (freigeschaltete Level, Sterne, Tor- und Story-Stand, Endlos-Rekord, Zuckerstangen, Joker-Vorrat, Einstellungen für Musik und Effekte) liegt im `localStorage` des Browsers. Der Spielstand hat das Format Version 4; ältere Stände (Version 1 bis 3) werden beim Laden umgewandelt, ohne dass Fortschritt verloren geht. Ist kein Speicher verfügbar, läuft das Spiel ohne Speichern weiter.

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

`tests/balance.html` ist ein Entwicklerwerkzeug und gehört nicht zur Testseite. Ein Bot spielt jedes Level mit 200 Startwerten, jeder Lauf auf einem eigenen Feld. Er probiert jeden möglichen Zug auf einer Kopie der Sitzung aus und spielt wie ein Mensch auf die Ziele: zuerst ein Zug, der das Level gewinnt, dann der meiste Fortschritt auf die offenen Ziele (Glasurschichten, entfernte Schokolade, Bossschaden, Bonbons der gesuchten Farbe, Punkte nur bei offenem Punkteziel), dann die meisten Punkte. In Bosskämpfen löst er den Sternenzauber aus, sobald die Leiste voll ist. Gleichstände entscheidet sein eigener Zufall. Er sieht auch die nachfallenden Bonbons voraus, seine Siegquoten überschätzen deshalb menschliche Spielerinnen und Spieler. Die Seite zeigt je Level die Siegquote, den Median der Punkte, die Sternverteilung und weitere Kennzahlen. Eine Welt mit 200 Startwerten dauert etwa eineinhalb bis zwei Minuten.

Parameter in der Adresse:

- `?seeds=50` Anzahl der Startwerte (Standard 200)
- `&welt=3` nur diese Welt; ohne `welt` und `levels` laufen alle registrierten Level
- `&levels=w3-01,w3-02` nur diese Level (Ids)
- `&set=w3-01.moves=30;w1-05.g1=20` Probewerte, ohne die Weltdateien zu ändern (`gN` ist die Zielmenge des N-ten Ziels)
- `&set=w3-10.hp=500` Probewert für die Leben des Bosses in diesem Level
- `&boards=fixed` fester Level-Startwert wie im Spiel (der Bot spielt dann oft jede Partie gleich, die Quote ist nur 0 oder 100 %)
- `&bot=greedy` einfacher gieriger Bot, der nur Punkte zählt

Jede Zeile zeigt die Zielquote aus `RS.Curve`, die gemessene Quote und das Urteil: `OK` (Abweichung höchstens 5 Punkte), `ZU LEICHT` (mehr als 5 über dem Ziel) oder `ZU SCHWER` (mehr als 5 darunter). Der Bot zählt jeden Kistentreffer als Fortschritt für ein Kistenziel und nutzt nie Joker.

Headless (Git Bash, Edge), Beispiel eine Welt mit 20 Startwerten:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/balance.html?welt=1&seeds=20" 2>/dev/null | grep -A14 'id="out"'
```

Voller Lauf (alle registrierten Level, 200 Startwerte) mit demselben Befehl ohne Parameter: Er dauert je Welt etwa 1 bis 2 Minuten (`--virtual-time-budget` war nicht nötig). Reicht der Tool-Timeout nicht für alle Welten, Welt für Welt mit `welt=N` laufen lassen oder `seeds=50` nehmen:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/balance.html" 2>/dev/null | grep -E 'Außerhalb|Laufzeit|w[0-9]+-[0-9]+ |summary"'
```

Die Zielquote je Level kommt aus `RS.Curve` (Siegquote des Bots ohne Joker, Toleranz ±5 Punkte). Stand der Welten 1 bis 4 mit 200 Startwerten (Stand 23.11.2026), kein Level der Welten 1 und 2 ist schwerer als in 3.0.1. Level, die schon in 3.0.1 `ZU LEICHT` waren (w1-01, w1-02, w1-03, w1-05), behalten ihre Werte und lesen weiter `ZU LEICHT`, weil der Bot dort bei etwa 100 % sättigt und viel stärker spielt als Menschen. Alle anderen Level liegen auf `OK`. Die Leben der Bosse stehen im `boss`-Block der Weltdatei.

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
| w1-10 | 36 | Boss, 520 Leben | 78 | 77 |
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

Der Bot sieht nachfallende Bonbons voraus. Deshalb sind Züge und Zielmengen großzügiger als es für Menschen nötig wäre, und die Bosse brauchen weniger Leben als die Richtwerte der Spec nahelegen würden.

## Projektstruktur

```
index.html          Einstieg, lädt alle Skripte in fester Reihenfolge
css/                Stil „Mystische Zuckernacht": Farben, Bonbons, Karte, HUD, Dialoge, Laden (shop.css),
                    Bosskampf (boss.css)
js/logic/           Spiellogik ohne DOM: Zufall, Feld, Spezialsteine, Hindernisse,
                    Ziele, Sitzung (Level und Endlos), Laden (shop.js), Joker-Tabelle (jokers.js),
                    Bosskampf (boss.js), Fortschritt und Weltöffnung (progress.js)
js/data/            Welt-Registry (registry.js), Schwierigkeitskurve (curve.js), Story-Texte,
                    worlds/ mit einer Datei je Welt (Level, Boss, Musikmotiv, Texte)
js/ui/              Bildschirme: Startmenü, Welten-Atlas (atlas.js), Levelkarte (map.js, mapkit.js),
                    Spielfeld (game.js), Endlos, Dialoge, Laden (shop.js), Effekte, Bossfigur (bossview.js),
                    worlds/ mit Kartenbild und Bossfigur je Welt
js/save.js          Speichern und Laden (localStorage, Format Version 4)
js/audio.js         Web-Audio-Motor: Sequenzer, Musik je Bildschirm, Einstellungen
js/audio-sfx.js     Tabelle der Soundeffekte
js/main.js          Start und Verdrahtung
tests/              Testseite, Test-Runner, Tests je Logik-Modul (u. a. boss.test.js), Balancing-Simulator
```

Alle Dateien sind klassische `<script>`-Tags ohne ES-Module und hängen ihre Exporte an den Namensraum `window.RS`. Die Logik liefert zu jedem Zug eine geordnete Liste von Ereignissen, die Darstellung spielt sie als Animation ab.
