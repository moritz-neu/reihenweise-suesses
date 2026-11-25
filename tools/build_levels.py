"""Erzeugt die Zwischenlevel von „Reihenweise Süßes“ und schreibt js/data/worlds/wNN-extra.js.

Aufruf im Projektordner (Windows, macOS, Linux):
    python tools/build_levels.py            alle Welten 1 bis 10
    python tools/build_levels.py 3 4        nur Welt 3 und 4
    python tools/build_levels.py --seeds 60 weniger Bot-Läufe je Messung (schneller, ungenauer)

Je Welt startet ein unsichtbarer Browser (Edge oder Chrome, sonst Umgebungsvariable BROWSER)
tools/generate.html?welt=N; die Welten laufen parallel. Neben der Datendatei entsteht
tools/reports/wNN.json mit Zielquote, gemessener Quote und Zügen je Level (für docs/balancing.md).
Eine Welt dauert etwa 20 bis 60 Minuten. Endet mit Code 0, wenn alle Welten fertig sind.
"""
import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANDIDATES = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'microsoft-edge', 'google-chrome', 'chromium',
]


def off_target(r):
    # Getroffen: höchstens 5 Punkte schwerer oder 8 Punkte leichter als die Nachbarn (im Zweifel leichter).
    d = r['measured'] - r['target']
    return d < -5 or d > 8


def penalty(r):
    # Abstand zum Ziel; zu schwer wiegt doppelt.
    d = r['measured'] - r['target']
    return -2 * d if d < 0 else d


def find_browser():
    if os.environ.get('BROWSER'):
        return os.environ['BROWSER']
    for c in CANDIDATES:
        if os.path.isfile(c) or shutil.which(c):
            return c
    sys.exit('Kein Browser gefunden; BROWSER=<Pfad zu Edge oder Chrome> setzen.')


def file_url(path):
    path = os.path.abspath(path).replace('\\', '/')
    return 'file:///' + path.lstrip('/')


def pre(dom, name):
    m = re.search(r'<pre id="%s">(.*?)</pre>' % name, dom, re.S)
    return html.unescape(m.group(1)) if m else ''


def render(world, levels):
    lines = [
        '(function (RS) {',
        "  'use strict';",
        '',
        '  // Zwischenlevel der Welt %d, erzeugt und ausgemessen von tools/generate.html.' % world,
        '  // Nicht von Hand ändern: neu erzeugen mit  python tools/build_levels.py %d' % world,
        '  RS.Worlds.insert(%d, [' % world,
    ]
    for i, level in enumerate(levels):
        text = json.dumps(level, ensure_ascii=False, separators=(', ', ': '))
        lines.append('    ' + text + (',' if i < len(levels) - 1 else ''))
    lines += ['  ]);', '})(window.RS = window.RS || {});', '']
    return '\n'.join(lines)


def build(world, seeds, browser):
    profile = tempfile.mkdtemp(prefix='rs-gen-%d-' % world)
    try:
        url = file_url(os.path.join(ROOT, 'tools', 'generate.html')) + '?welt=%d&seeds=%d' % (world, seeds)
        out = subprocess.run([browser, '--headless=new', '--disable-gpu', '--no-first-run',
                              '--user-data-dir=' + profile, '--virtual-time-budget=36000000',
                              '--dump-dom', url], capture_output=True, timeout=4 * 3600)
        dom = out.stdout.decode('utf-8', 'replace')
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    summary = pre(dom, 'summary')
    if not summary.startswith('GENERATE: DONE'):
        return world, 'FEHLER ' + (summary or 'keine Ausgabe')[:500]
    levels = json.loads(pre(dom, 'data'))
    report = json.loads(pre(dom, 'report'))
    with open(os.path.join(ROOT, 'js', 'data', 'worlds', 'w%02d-extra.js' % world), 'w', encoding='utf-8', newline='\n') as f:
        f.write(render(world, levels))
    os.makedirs(os.path.join(ROOT, 'tools', 'reports'), exist_ok=True)
    with open(os.path.join(ROOT, 'tools', 'reports', 'w%02d.json' % world), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    off = sum(1 for r in report if off_target(r))
    return world, '%s, %d außerhalb der Toleranz' % (summary, off)


def run_page(query, browser, tag):
    profile = tempfile.mkdtemp(prefix='rs-gen-%s-' % tag)
    try:
        url = file_url(os.path.join(ROOT, 'tools', 'generate.html')) + '?' + query
        out = subprocess.run([browser, '--headless=new', '--disable-gpu', '--no-first-run',
                              '--user-data-dir=' + profile, '--virtual-time-budget=36000000',
                              '--dump-dom', url], capture_output=True, timeout=4 * 3600)
        return out.stdout.decode('utf-8', 'replace')
    finally:
        shutil.rmtree(profile, ignore_errors=True)


def read_extras(world):
    path = os.path.join(ROOT, 'js', 'data', 'worlds', 'w%02d-extra.js' % world)
    levels = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('{'):
                levels.append(json.loads(line.rstrip(',')))
    return levels


def fix_jobs(seeds, chunk, variant='', only_ids=None):
    """Aufträge zum Nachbessern: je Welt die Level außerhalb der Toleranz, in Paketen."""
    jobs = []
    for world in range(1, 11):
        rp = os.path.join(ROOT, 'tools', 'reports', 'w%02d.json' % world)
        if not os.path.isfile(rp):
            continue
        with open(rp, encoding='utf-8') as f:
            report = json.load(f)
        ids = [r['id'] for r in report]
        off = [r['id'] for r in report if r['measured'] - r['target'] < -5]   # nur zu schwere
        if only_ids is not None:
            off = [x for x in ids if x in only_ids]
        patterns = {r['id']: r['pattern'] for r in report}
        for i in range(0, len(off), chunk):
            part = off[i:i + chunk]
            prevs = [patterns.get(ids[ids.index(x) - 1], '') if ids.index(x) > 0 else '' for x in part]
            jobs.append((world, 'welt=%d&seeds=%d&tune=2&variant=%s&only=%s&prevs=%s' % (world, seeds, variant, ','.join(part), ','.join(prevs))))
    return jobs


def merge(world, dom, force=False):
    """Übernimmt nachgebesserte Level, wenn sie näher an der Zielkurve liegen."""
    if not pre(dom, 'summary').startswith('GENERATE: DONE'):
        return 'FEHLER ' + pre(dom, 'summary')[:300]
    new_levels = {l['id']: l for l in json.loads(pre(dom, 'data'))}
    new_report = {r['id']: r for r in json.loads(pre(dom, 'report'))}
    rp = os.path.join(ROOT, 'tools', 'reports', 'w%02d.json' % world)
    with open(rp, encoding='utf-8') as f:
        report = json.load(f)
    levels = read_extras(world)
    better = 0
    for i, r in enumerate(report):
        n = new_report.get(r['id'])
        if n and (force or penalty(n) < penalty(r)):
            report[i] = n
            levels = [new_levels[r['id']] if l['id'] == r['id'] else l for l in levels]
            better += 1
    with open(os.path.join(ROOT, 'js', 'data', 'worlds', 'w%02d-extra.js' % world), 'w', encoding='utf-8', newline='\n') as f:
        f.write(render(world, levels))
    with open(rp, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    return '%d von %d verbessert' % (better, len(new_report))


def write_doc():
    """Schreibt docs/balancing.md aus allen vorhandenen tools/reports/wNN.json."""
    folder = os.path.join(ROOT, 'tools', 'reports')
    if not os.path.isdir(folder):
        return
    rows = []
    summary = []
    for name in sorted(os.listdir(folder)):
        if not re.match(r'w\d{2}\.json$', name):
            continue
        with open(os.path.join(folder, name), encoding='utf-8') as f:
            report = json.load(f)
        world = int(name[1:3])
        off = [r for r in report if off_target(r)]
        summary.append('| %d | %d | %d | %s |' % (world, len(report), len(off), ', '.join(r['id'] for r in off) or '-'))
        rows.append('\n## Welt %d\n\n| Level | Züge | Ziele | Muster | Ziel%% | Sieg%% |\n|---|---|---|---|---|---|' % world)
        for r in report:
            rows.append('| %s | %d | %s | %s | %s | %d |' % (r['id'], r['moves'], r['goals'], r['pattern'],
                                                           ('%g' % r['target']).replace('.', ','), r['measured']))
    head = [
        '# Balancing der Zwischenlevel',
        '',
        'Erzeugt von `python tools/build_levels.py` (Werkzeug `tools/generate.html`). Gemessen mit dem Bot aus',
        '`tests/balance.js` ohne Joker, 100 Läufe je Messung. Ziel ist die gemessene Siegquote der beiden alten Nachbarn (stufenlos dazwischen);',
        'getroffen heißt höchstens 5 Punkte schwerer oder 8 Punkte leichter.',
        'Die 100 alten Level stehen in der Tabelle der README.',
        '',
        '| Welt | Zwischenlevel | außerhalb der Toleranz | Level |',
        '|---|---|---|---|',
    ]
    with open(os.path.join(ROOT, 'docs', 'balancing.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(head + summary + rows) + '\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('worlds', nargs='*', type=int, default=list(range(1, 11)))
    ap.add_argument('--seeds', type=int, default=100)
    ap.add_argument('--jobs', type=int, default=10)
    ap.add_argument('--variant', default='', help='beim Nachbessern: andere Feldvarianten probieren (z. B. 2, 3)')
    ap.add_argument('--soften', action='store_true', help='Zwischenlevel nur leichter an die Nachbarn angleichen (tools/soften.html)')
    ap.add_argument('--ids', default='', help='mit --fix: genau diese Kennungen neu erzeugen (Komma-Liste)')
    ap.add_argument('--fix', action='store_true', help='nur die Level außerhalb der Toleranz mit weiterem Spielraum neu erzeugen')
    ap.add_argument('--doc', action='store_true', help='nur docs/balancing.md aus den vorhandenen Berichten schreiben')
    args = ap.parse_args()
    if args.doc:
        write_doc()
        return 0
    browser = find_browser()
    if args.soften:
        profile = tempfile.mkdtemp(prefix='rs-soften-')
        try:
            out = subprocess.run([browser, '--headless=new', '--disable-gpu', '--no-first-run',
                                  '--user-data-dir=' + profile, '--dump-dom',
                                  file_url(os.path.join(ROOT, 'tools', 'soften.html'))], capture_output=True, timeout=600)
            dom = out.stdout.decode('utf-8', 'replace')
        finally:
            shutil.rmtree(profile, ignore_errors=True)
        summary = pre(dom, 'summary')
        if not summary.startswith('SOFTEN: DONE'):
            print('FEHLER ' + (summary or 'keine Ausgabe'))
            return 1
        data = json.loads(pre(dom, 'data'))
        for world, levels in data.items():
            with open(os.path.join(ROOT, 'js', 'data', 'worlds', 'w%02d-extra.js' % int(world)), 'w', encoding='utf-8', newline='\n') as f:
                f.write(render(int(world), levels))
        print(summary)
        return 0
    if args.fix:
        import threading
        lock = threading.Lock()
        only_ids = set(args.ids.split(',')) if args.ids else None
        jobs = fix_jobs(args.seeds, 4, args.variant, only_ids)
        print('%d Pakete zum Nachbessern' % len(jobs), flush=True)

        def run(job):
            world, query = job
            dom = run_page(query, browser, 'fix%d' % world)
            with lock:   # eine Welt-Datei wird nie von zwei Paketen zugleich geschrieben
                msg = merge(world, dom, only_ids is not None)
            print('Welt %d: %s' % (world, msg), flush=True)

        with ThreadPoolExecutor(max_workers=args.jobs) as pool:
            list(pool.map(run, jobs))
        write_doc()
        return 0
    browser = find_browser()
    ok = True
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        for world, msg in pool.map(lambda w: build(w, args.seeds, browser), args.worlds):
            print('Welt %d: %s' % (world, msg), flush=True)
            ok = ok and not msg.startswith('FEHLER')
    write_doc()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
