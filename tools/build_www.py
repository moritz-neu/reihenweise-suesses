"""Stellt den Ordner www/ für die App-Hülle (Capacitor) zusammen.

Aufruf im Projektordner (Windows, macOS, Linux):  python tools/build_www.py
Kopiert nur, was die App braucht: index.html, datenschutz.html, manifest.webmanifest, css/, js/,
icons/. Tests, Werkzeuge, Doku, Store-Grafiken und der Service Worker bleiben draußen (in der
Hülle liegen alle Dateien in der App, RS.Platform.isNative schaltet den Service Worker ab).
Prüft danach, dass jede Datei, die index.html lädt, in www/ liegt.
Endet mit Code 0 und „WWW: OK“ oder mit Code 1 und den Fehlern.
"""
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'www')
FILES = ['index.html', 'datenschutz.html', 'manifest.webmanifest']
FOLDERS = ['css', 'js', 'icons']


def main():
    # Abgleichen statt löschen: Ein Sync-Dienst (OneDrive) hält Ordner manchmal kurz fest.
    os.makedirs(OUT, exist_ok=True)
    wanted = set()
    for name in FILES:
        shutil.copy2(os.path.join(ROOT, name), os.path.join(OUT, name))
        wanted.add(os.path.normpath(os.path.join(OUT, name)))
    for name in FOLDERS:
        shutil.copytree(os.path.join(ROOT, name), os.path.join(OUT, name), dirs_exist_ok=True)
        for folder, _, names in os.walk(os.path.join(ROOT, name)):
            for n in names:
                wanted.add(os.path.normpath(os.path.join(OUT, os.path.relpath(os.path.join(folder, n), ROOT))))
    for folder, _, names in os.walk(OUT):
        for n in names:
            path = os.path.normpath(os.path.join(folder, n))
            if path not in wanted:
                os.remove(path)   # Datei, die es im Projekt nicht mehr gibt
    with open(os.path.join(OUT, 'index.html'), encoding='utf-8') as f:
        html = f.read()
    errors = []
    for ref in re.findall(r'(?:src|href)="([^"#:]+)"', html):
        if not ref.startswith('/') and not os.path.isfile(os.path.join(OUT, ref)):
            errors.append('index.html lädt %s, die Datei fehlt in www/' % ref)
    count = 0
    size = 0
    for folder, _, names in os.walk(OUT):
        for n in names:
            count += 1
            size += os.path.getsize(os.path.join(folder, n))
    if errors:
        for e in errors:
            print('WWW: ERROR ' + e)
        return 1
    print('WWW: OK (%d Dateien, %.1f MB) in %s' % (count, size / 1e6, OUT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
