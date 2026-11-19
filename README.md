# Reihenweise Süßes

Ein eigenständiges Match-3-Spiel im Browser: Tausche benachbarte Bonbons, bilde Reihen und bring mit der Zuckerfee Annika das Dorf Kandishain wieder zum Leuchten. Es gibt zehn Level im Abenteuer-Modus und einen Endlos-Modus gegen die Zeit.

## Spielen (lokal)

`index.html` per Doppelklick öffnen. Das Spiel läuft direkt unter `file://`, ohne Installation, Server oder Internetverbindung. Unterstützt werden aktuelle Versionen von Chrome, Edge und Firefox.

Sterne gibt es für übrige Züge: Wer ein Level schafft, bekommt einen Stern, zwei Sterne mit mindestens einem Viertel der Züge übrig und drei Sterne mit mindestens der Hälfte (jeweils aufgerundet). Die Punkte zählen nur für die Anzeige und Punkteziele.

Zuckerstangen sind die Währung des Spiels. Wer ein Level zum ersten Mal schafft, bekommt 5 Zuckerstangen je Stern. Beim erneuten Spielen gibt es 5 je neu dazugewonnenem Stern und immer 2 obendrauf. Eine Endlos-Runde bringt 1 Zuckerstange je vollen 1000 Punkten. Neue Spielstände starten mit 0 Zuckerstangen.

Dafür gibt es im Laden auf der Levelkarte zwei Joker: „+5 Züge“ für 30 Zuckerstangen und den „Zuckerhammer“ für 20, der ein Bonbon mit einem Schlag entfernt und keinen Zug kostet. Vom Vorrat passen höchstens 10 je Joker. Zum Start liegt von jedem einer bereit. Joker gelten nur im Abenteuer-Modus, übrige Züge zählen für die Sterne ganz normal mit. Geht ein Level verloren, bietet der Dialog mit vorhandenem Vorrat eine Rettung an.

Der Fortschritt (freigeschaltete Level, Sterne, Endlos-Rekord, Zuckerstangen, Joker-Vorrat) liegt im `localStorage` des Browsers. Ältere Spielstände werden beim Laden umgewandelt, ohne dass Fortschritt verloren geht. Ist kein Speicher verfügbar, läuft das Spiel ohne Speichern weiter.

## Tests

- **Im Browser:** `tests/tests.html` per Doppelklick öffnen. Die Seite zeigt jedes Testergebnis und unten die Zusammenfassung `RESULT: PASS n/n`.
- **Auf der Kommandozeile** (Git Bash, im Repo-Wurzelverzeichnis):

  ```bash
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-first-run --dump-dom "file:///$(pwd -W)/tests/tests.html" 2>/dev/null | grep -o 'id="summary">RESULT: [^<]*'
  ```

  Grün ist die Ausgabe `id="summary">RESULT: PASS n/n`. Unter macOS geht dasselbe mit Chrome und denselben Schaltern.

## Balancing-Simulator

`tests/balance.html` ist ein Entwicklerwerkzeug und gehört nicht zur Testseite. Ein Bot spielt jedes Level mit 200 Startwerten, jeder Lauf auf einem eigenen Feld. Er probiert jeden möglichen Zug auf einer Kopie der Sitzung aus und spielt wie ein Mensch auf die Ziele: zuerst ein Zug, der das Level gewinnt, dann der meiste Fortschritt auf die offenen Ziele (Glasurschichten, Bonbons der gesuchten Farbe, Punkte nur bei offenem Punkteziel), dann die meisten Punkte. Gleichstände entscheidet sein eigener Zufall. Er sieht auch die nachfallenden Bonbons voraus, seine Siegquoten überschätzen deshalb menschliche Spielerinnen und Spieler. Die Seite zeigt je Level die Siegquote, den Median der Punkte, die Sternverteilung und weitere Kennzahlen. Ein Lauf dauert etwa eineinhalb Minuten.

Parameter in der Adresse:

- `?seeds=50` Anzahl der Startwerte (Standard 200)
- `&levels=8,9,10` nur diese Level
- `&set=9.moves=24;9.stars=8500/11500;5.g1=20` Probewerte, ohne `js/data/levels.js` zu ändern (`gN` ist die Zielmenge des N-ten Ziels)
- `&boards=fixed` fester Level-Startwert wie im Spiel (der Bot spielt dann oft jede Partie gleich, die Quote ist nur 0 oder 100 %)
- `&bot=greedy` einfacher gieriger Bot, der nur Punkte zählt

Die Zielwerte für die Siegquote des Bots: Level 1–2 mindestens 90 %, Level 3–5 mindestens 70 %, Level 6–8 mindestens 50 %, Level 9–10 mindestens 30 %.

## Projektstruktur

```
index.html          Einstieg, lädt alle Skripte in fester Reihenfolge
css/                Stil „Mystische Zuckernacht": Farben, Bonbons, Karte, HUD, Dialoge, Laden (shop.css)
js/logic/           Spiellogik ohne DOM: Zufall, Feld, Spezialsteine, Hindernisse,
                    Ziele, Sitzung (Level und Endlos), Laden und Joker (shop.js)
js/data/            die 10 Level und die Story-Texte
js/ui/              Bildschirme: Startmenü, Levelkarte, Spielfeld, Endlos, Dialoge, Laden (shop.js), Effekte
js/save.js          Speichern und Laden (localStorage)
js/audio.js         leere Ereignis-Schnittstelle, Sound folgt später
js/main.js          Start und Verdrahtung
tests/              Testseite, Test-Runner, Tests je Logik-Modul, Balancing-Simulator
```

Alle Dateien sind klassische `<script>`-Tags ohne ES-Module und hängen ihre Exporte an den Namensraum `window.RS`. Die Logik liefert zu jedem Zug eine geordnete Liste von Ereignissen, die Darstellung spielt sie als Animation ab.

