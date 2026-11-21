# Reihenweise Süßes

Ein eigenständiges Match-3-Spiel im Browser: Tausche benachbarte Bonbons, bilde Reihen und bring mit der Zuckerfee Annika die Welten Kandishain und Frostzuckerberge wieder zum Leuchten. Es gibt zwanzig Level im Abenteuer-Modus, zwei Bosskämpfe und einen Endlos-Modus gegen die Zeit.

## Spielen (lokal)

`index.html` per Doppelklick öffnen. Das Spiel läuft direkt unter `file://`, ohne Installation, Server oder Internetverbindung. Unterstützt werden aktuelle Versionen von Chrome, Edge und Firefox.

Das Abenteuer hat zwei Welten: Level 1–10 spielen in Kandishain, Level 11–20 in den Frostzuckerbergen. Am Ende des Wegs in Kandishain steht ein Tor, das mit Lakritzstäben verschlossen ist, bis Level 10 gewonnen ist („Besiege Graf Lakritz, um das Tor zu öffnen.“). Danach öffnet es sich und führt zur Karte der Frostzuckerberge; dort bringt ein Tor zurück.

Level 10 (Graf Lakritz) und Level 20 (Eiskönigin Kandara) sind Bosskämpfe. Das Ziel ist, die Lebensleiste des Bosses auf 0 zu bringen:

- Jedes aufgelöste Bonbon macht 1 Schaden, ein Bonbon in der Schwachstellen-Farbe des Bosses 2 (Farbkugeln zählen 1). Eine Kombination aus zwei Spezialsteinen oder mit einer Farbkugel gibt einmalig +10. Der Zuckerhammer macht ebenfalls Schaden.
- Der Boss hat zwei Phasen. Sinkt sein Leben auf die Hälfte, wechseln die Schwachstelle (Graf Lakritz: Rot, dann Blau; Kandara: Gelb, dann Violett) und der Angriffsrhythmus.
- Er greift nach jedem 3. Zug an, in Phase 2 nach jedem 2. Graf Lakritz sperrt Bonbons mit Lakritzgittern (in Phase 2 zusätzlich eine halbe Reihe), Kandara legt dicke Glasur, später dickes Eis auf Bonbons. Hammer, Sternenzauber und „+5 Züge“ zählen nicht als Zug.
- Der Sternenzauber lädt sich mit jedem aufgelösten Bonbon auf und ist bei 40 voll. Per Knopf macht er 25 Schaden (unabhängig von der Schwachstelle) und entfernt bis zu 6 Hindernisse. Er kostet keinen Zug und löst keinen Angriff aus.

Neue Hindernisse in Welt 2: Eis liegt auf einem Bonbon (Stufe 1 oder 2). Es lässt sich nicht tauschen und fällt nicht, taut aber durch Reihen in der Nachbarschaft sowie durch Spezialsteine und Hammer. Schokolade belegt ein Feld und wächst nach einem Zug, in dem keine Schokolade entfernt wurde, auf ein Nachbarbonbon. Das neue Ziel „Schokolade entfernen“ verlangt, alle Schokolade zu beseitigen.

Sterne gibt es für übrige Züge: Wer ein Level schafft, bekommt einen Stern, zwei Sterne mit mindestens einem Viertel der Züge übrig und drei Sterne mit mindestens der Hälfte (jeweils aufgerundet). Die Punkte zählen nur für die Anzeige und Punkteziele.

Zuckerstangen sind die Währung des Spiels. Wer ein Level zum ersten Mal schafft, bekommt 5 Zuckerstangen je Stern. Beim erneuten Spielen gibt es 5 je neu dazugewonnenem Stern und immer 2 obendrauf. Eine Endlos-Runde bringt 1 Zuckerstange je vollen 1000 Punkten. Neue Spielstände starten mit 0 Zuckerstangen.

Dafür gibt es im Laden auf der Levelkarte zwei Joker: „+5 Züge“ für 30 Zuckerstangen und den „Zuckerhammer“ für 20, der ein Bonbon mit einem Schlag entfernt und keinen Zug kostet. Vom Vorrat passen höchstens 10 je Joker. Zum Start liegt von jedem einer bereit. Joker gelten nur im Abenteuer-Modus, übrige Züge zählen für die Sterne ganz normal mit. Geht ein Level verloren, bietet der Dialog mit vorhandenem Vorrat eine Rettung an.

Der Fortschritt (freigeschaltete Level, Sterne, Tor- und Story-Stand, Endlos-Rekord, Zuckerstangen, Joker-Vorrat) liegt im `localStorage` des Browsers. Ältere Spielstände werden beim Laden umgewandelt, ohne dass Fortschritt verloren geht. Ist kein Speicher verfügbar, läuft das Spiel ohne Speichern weiter.

## Tests

- **Im Browser:** `tests/tests.html` per Doppelklick öffnen. Die Seite zeigt jedes Testergebnis und unten die Zusammenfassung `RESULT: PASS n/n`.
- **Auf der Kommandozeile** (Git Bash, im Repo-Wurzelverzeichnis):

  ```bash
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/tests.html" 2>/dev/null | grep -o 'id="summary">RESULT: [^<]*'
  ```

  Grün ist die Ausgabe `id="summary">RESULT: PASS n/n`. Unter macOS geht dasselbe mit Chrome und denselben Schaltern.

## Balancing-Simulator

`tests/balance.html` ist ein Entwicklerwerkzeug und gehört nicht zur Testseite. Ein Bot spielt jedes Level mit 200 Startwerten, jeder Lauf auf einem eigenen Feld. Er probiert jeden möglichen Zug auf einer Kopie der Sitzung aus und spielt wie ein Mensch auf die Ziele: zuerst ein Zug, der das Level gewinnt, dann der meiste Fortschritt auf die offenen Ziele (Glasurschichten, entfernte Schokolade, Bossschaden, Bonbons der gesuchten Farbe, Punkte nur bei offenem Punkteziel), dann die meisten Punkte. In Bosskämpfen löst er den Sternenzauber aus, sobald die Leiste voll ist. Gleichstände entscheidet sein eigener Zufall. Er sieht auch die nachfallenden Bonbons voraus, seine Siegquoten überschätzen deshalb menschliche Spielerinnen und Spieler. Die Seite zeigt je Level die Siegquote, den Median der Punkte, die Sternverteilung und weitere Kennzahlen. Ein Lauf dauert etwa eineinhalb Minuten.

Parameter in der Adresse:

- `?seeds=50` Anzahl der Startwerte (Standard 200)
- `&levels=8,9,10` nur diese Level
- `&set=9.moves=24;9.stars=8500/11500;5.g1=20` Probewerte, ohne `js/data/levels.js` zu ändern (`gN` ist die Zielmenge des N-ten Ziels)
- `&set=10.hp=600` Probewert für die Leben des Bosses in diesem Level
- `&boards=fixed` fester Level-Startwert wie im Spiel (der Bot spielt dann oft jede Partie gleich, die Quote ist nur 0 oder 100 %)
- `&bot=greedy` einfacher gieriger Bot, der nur Punkte zählt

Die Zielwerte für die Siegquote des Bots: Level 1–2 mindestens 90 %, Level 3–5 mindestens 70 %, Level 6–8 mindestens 50 %, Level 9 mindestens 30 %. Für die Bosskämpfe und Welt 2: Level 10 (Graf Lakritz) 40–60 %, Level 11–12 mindestens 60 %, Level 13–16 mindestens 45 %, Level 17–19 mindestens 30 %, Level 20 (Eiskönigin Kandara) 25–45 %.

Ergebnis für Level 10–20 (200 Startwerte, Stand 20.11.2026). Die Leben der Bosse stehen in `js/data/bosses.js`.

| Level | Inhalt | Züge | Ziel | Siegquote Bot | Zielwert |
|---|---|---|---|---|---|
| 10 | Graf Lakritz | 36 | Boss, 600 Leben | 50 % | 40–60 % |
| 11 | Punkte im Frost-Look | 20 | 5200 Punkte | 72 % | ≥ 60 % |
| 12 | zwei Farben | 22 | 25 Blau + 25 Violett | 76 % | ≥ 60 % |
| 13 | Eis | 16 | 26 Grün | 58 % | ≥ 45 % |
| 14 | Eis und Glasur | 17 | Glasur | 56 % | ≥ 45 % |
| 15 | dickes Eis und Lakritz | 18 | 24 Gelb | 57 % | ≥ 45 % |
| 16 | Schokolade | 15 | Schokolade | 62 % | ≥ 45 % |
| 17 | Schokolade und Eis | 15 | Schokolade | 48 % | ≥ 30 % |
| 18 | Schokolade, Glasur, Farbe | 15 | Schokolade + Glasur + 20 Rot | 47 % | ≥ 30 % |
| 19 | alles gemischt | 19 | Glasur + Schokolade | 43 % | ≥ 30 % |
| 20 | Eiskönigin Kandara | 40 | Boss, 730 Leben | 33 % | 25–45 % |

Der Bot sieht nachfallende Bonbons voraus und braucht deshalb deutlich mehr Leben bei den Bossen als die Richtwerte der Spec (300 und 450), um die Zielquoten zu treffen.

## Projektstruktur

```
index.html          Einstieg, lädt alle Skripte in fester Reihenfolge
css/                Stil „Mystische Zuckernacht": Farben, Bonbons, Karte, HUD, Dialoge, Laden (shop.css),
                    Bosskampf (boss.css)
js/logic/           Spiellogik ohne DOM: Zufall, Feld, Spezialsteine, Hindernisse,
                    Ziele, Sitzung (Level und Endlos), Laden und Joker (shop.js),
                    Bosskampf (boss.js)
js/data/            die 20 Level, die Bosse (bosses.js) und die Story-Texte
js/ui/              Bildschirme: Startmenü, Levelkarte, Spielfeld, Endlos, Dialoge, Laden (shop.js), Effekte,
                    Bossfigur (bossview.js), Kartenbilder (mapart.js)
js/save.js          Speichern und Laden (localStorage)
js/audio.js         leere Ereignis-Schnittstelle, Sound folgt später
js/main.js          Start und Verdrahtung
tests/              Testseite, Test-Runner, Tests je Logik-Modul (u. a. boss.test.js), Balancing-Simulator
```

Alle Dateien sind klassische `<script>`-Tags ohne ES-Module und hängen ihre Exporte an den Namensraum `window.RS`. Die Logik liefert zu jedem Zug eine geordnete Liste von Ereignissen, die Darstellung spielt sie als Animation ab.

