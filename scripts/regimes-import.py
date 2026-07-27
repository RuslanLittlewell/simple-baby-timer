#!/usr/bin/env python3
"""Regenerate src/features/regimes/data.ts from the published Google Sheet.

Usage:  python3 scripts/regimes-import.py
No third-party deps — reads the .xlsx (zip + XML) directly.
"""
import io, os, re, json, zipfile, urllib.request, xml.etree.ElementTree as ET
from collections import OrderedDict

SHEET_URL = ("https://docs.google.com/spreadsheets/d/e/"
             "2PACX-1vSBsSO77IdSBVLUzc0N-n1xZ-mey-P4TOeDlnZRwhbNlYGibqUwigPblrDVD5"
             "ngAGQHDFUgS7mNO89f/pub?output=xlsx")
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'features', 'regimes', 'data.ts')
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def col_to_idx(ref):
    idx = 0
    for c in re.match(r'([A-Z]+)', ref).group(1):
        idx = idx * 26 + (ord(c) - ord('A') + 1)
    return idx - 1


def read_sheet(z, shared, n):
    root = ET.fromstring(z.read(f'xl/worksheets/sheet{n}.xml'))
    rows = []
    for row in root.iter(f'{NS}row'):
        cells = {}
        for c in row.findall(f'{NS}c'):
            ci = col_to_idx(c.get('r'))
            t, v, isn = c.get('t'), c.find(f'{NS}v'), c.find(f'{NS}is')
            if t == 's' and v is not None:
                val = shared[int(v.text)]
            elif isn is not None:
                val = ''.join(x.text or '' for x in isn.iter(f'{NS}t'))
            else:
                val = v.text if v is not None else ''
            cells[ci] = val
        rows.append(cells)
    return rows


def cell(r, i):
    return (r.get(i, '') or '').strip()


def parse_time(s):
    s = s.replace('—', '–').replace('-', '–')
    m = re.match(r'^(\d{1,2}):(\d{2})\s*–\s*(\d{1,2}):(\d{2})$', s)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2)), int(m.group(3)) * 60 + int(m.group(4))
    m = re.match(r'^(\d{1,2}):(\d{2})$', s)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2)), None
    return None, None


def classify(a):
    s = a.lower()
    if 'сон' in s or 'сна' in s: return 'sleep'
    if any(k in s for k in ['молоч', 'смесь', 'грудн']): return 'milk'
    if any(k in s for k in ['кормлен', 'перекус', 'завтрак', 'обед', 'ужин', 'прикорм', 'еда', 'питани']): return 'meal'
    if any(k in s for k in ['ритуал', 'ванна', 'умыван', 'книг', 'зуб', 'приглуш', 'купани']): return 'ritual'
    if any(k in s for k in ['подъём', 'подъем', 'пробужд']): return 'wake'
    if any(k in s for k in ['прогул', 'игр', 'активн', 'животе']): return 'play'
    return 'other'


def main():
    raw = urllib.request.urlopen(SHEET_URL).read()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        shared, root = [], ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall(f'{NS}si'):
            shared.append(''.join(t.text or '' for t in si.iter(f'{NS}t')))
        s1, s2 = read_sheet(z, shared, 1), read_sheet(z, shared, 2)

    summ = OrderedDict()
    for r in s1[3:]:
        age = cell(r, 0)
        if age:
            summ[age] = {'sleep24': cell(r, 1), 'naps': cell(r, 2), 'wakeWindow': cell(r, 3),
                         'wakeUp': cell(r, 5), 'nightSleep': cell(r, 6), 'features': cell(r, 7)}

    ages, order = OrderedDict(), []
    for r in s2[3:]:
        age, variant = cell(r, 0), cell(r, 1)
        action = cell(r, 3)
        if not age and not action:
            continue
        if age not in ages:
            ages[age] = OrderedDict(); order.append(age)
        ages[age].setdefault('_src', cell(r, 5))
        a, b = parse_time(cell(r, 2))
        ages[age].setdefault(variant, []).append(
            {'time': cell(r, 2), 'startMin': a, 'endMin': b,
             'action': action, 'note': cell(r, 4), 'kind': classify(action)})

    result = []
    for age in order:
        variants = [{'name': v, 'steps': s} for v, s in ages[age].items() if v != '_src']
        timed = any(st['startMin'] is not None for v in variants for st in v['steps'])
        result.append({'age': age, 'timed': timed, 'summary': summ.get(age),
                       'source': ages[age].get('_src', ''), 'variants': variants})

    ts = ("// AUTO-GENERATED from the published Google Sheet by scripts/regimes-import.py.\n"
          "// Do not edit by hand.\n"
          "import { type RegimeAge } from './types';\n\n"
          "export const REGIMES: RegimeAge[] = "
          + json.dumps(result, ensure_ascii=False, indent=2) + ";\n")
    with open(OUT, 'w') as f:
        f.write(ts)
    print(f"Wrote {os.path.relpath(OUT)} — {len(result)} age groups.")


if __name__ == '__main__':
    main()
