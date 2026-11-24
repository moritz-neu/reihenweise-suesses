"""Prüft die Store-Fassung von „Reihenweise Süßes“ vor einem Release.

Aufruf im Projektordner (Windows, macOS, Linux):  python tools/check_store.py
- Jede Datei, die index.html lädt (src/href), steht in ASSETS von sw.js.
- Jede Datei in ASSETS existiert.
- VERSION in sw.js passt zur obersten Version im CHANGELOG.
- manifest.webmanifest ist gültiges JSON, und seine Symbole existieren.
Endet mit Code 0 und „STORE CHECK: OK“ oder mit Code 1 und den Fehlern.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def main():
    errors = []
    sw = read('sw.js')
    assets = re.findall(r"^\s*'([^']+)',?$", sw.split('var ASSETS = [', 1)[1].split('];', 1)[0], re.M)
    refs = [r for r in re.findall(r'(?:src|href)="([^"#:]+)"', read('index.html')) if not r.startswith('/')]
    for r in refs:
        if r not in assets:
            errors.append('index.html lädt %s, aber sw.js ASSETS fehlt es' % r)
    for a in assets:
        if a != './' and not os.path.isfile(os.path.join(ROOT, a)):
            errors.append('ASSETS nennt %s, die Datei fehlt' % a)
    if len(set(assets)) != len(assets):
        errors.append('ASSETS enthält Einträge doppelt')
    version = re.search(r"var VERSION = '([^']+)'", sw).group(1)
    top = re.search(r'^## \[([^\]]+)\]', read('CHANGELOG.md'), re.M).group(1)
    if top != version:
        errors.append('sw.js VERSION %s passt nicht zur obersten CHANGELOG-Version %s' % (version, top))
    try:
        manifest = json.loads(read('manifest.webmanifest'))
        for icon in manifest.get('icons', []):
            if not os.path.isfile(os.path.join(ROOT, icon['src'])):
                errors.append('Manifest-Symbol %s fehlt' % icon['src'])
            if icon['src'] not in assets and icon['src'].endswith('.png'):
                errors.append('Manifest-Symbol %s fehlt in ASSETS' % icon['src'])
    except ValueError as e:
        errors.append('manifest.webmanifest ist kein gültiges JSON: %s' % e)
    if errors:
        for e in errors:
            print('STORE CHECK: ERROR ' + e)
        return 1
    print('STORE CHECK: OK (%d Dateien im Offline-Speicher, Version %s)' % (len(assets), version))
    return 0


if __name__ == '__main__':
    sys.exit(main())
