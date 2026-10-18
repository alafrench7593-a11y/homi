#!/usr/bin/env python3
"""
Génère src/content/whoGrowth.ts à partir des tables officielles des Standards de croissance
de l'OMS (2006), 0–60 mois, telles que redistribuées par le paquet pygrowup (UNICEF, licence BSD,
voir scripts/who/LICENSE-pygrowup). Aucune valeur n'est modifiée : L, M, S par mois révolu, plus
les colonnes SD publiées (utilisées par les tests pour vérifier le calcul).
Source : https://www.who.int/tools/child-growth-standards
Usage : python3 scripts/build-who-growth.py
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'content', 'whoGrowth.ts')
FILES = {
    'weight': [('wfa_{s}_0_5', None)],
    'length': [('lhfa_{s}_0_2', None), ('lhfa_{s}_2_5', 'height')],
    'head': [('hcfa_{s}_0_5', None)],
    'bmi': [('bmifa_{s}_0_2', None), ('bmifa_{s}_2_5', 'height')],
}
SD = ['SD3neg', 'SD2neg', 'SD1neg', 'SD0', 'SD1', 'SD2', 'SD3']
def rows(name):
    data = json.load(open(os.path.join(HERE, 'who', name + '_zscores.json')))
    out = []
    for r in data:
        out.append([int(r['Month']), float(r['L']), float(r['M']), float(r['S'])] + [float(r[k]) for k in SD])
    return out
tables = {}
for ind, parts in FILES.items():
    for sex, s in (('male', 'boys'), ('female', 'girls')):
        merged = {}
        for tmpl, kind in parts:
            for r in rows(tmpl.format(s=s)):
                # à 24 mois : la table « debout » (2–5 ans) remplace la table « couché » (0–2 ans)
                if r[0] in merged and kind is None:
                    continue
                merged[r[0]] = r
        tables[f'{ind}_{sex}'] = [merged[k] for k in sorted(merged)]
lines = [
    '/**',
    ' * Standards de croissance de l\'enfant de l\'OMS (2006), 0–60 mois. FICHIER GÉNÉRÉ — ne pas modifier :',
    ' * python3 scripts/build-who-growth.py. Source : https://www.who.int/tools/child-growth-standards',
    ' * (tables redistribuées par pygrowup, UNICEF, licence BSD). Une ligne par mois révolu :',
    ' * [mois, L, M, S, -3 ET, -2 ET, -1 ET, médiane, +1 ET, +2 ET, +3 ET] (valeurs publiées, arrondies par l\'OMS).',
    ' * Taille : couchée jusqu\'à 24 mois exclus, debout à partir de 24 mois (convention OMS).',
    ' */',
    'export type WhoRow = [number, number, number, number, number, number, number, number, number, number, number];',
    'export const WHO_GROWTH: Record<string, WhoRow[]> = {',
]
for k, v in tables.items():
    lines.append(f'  {k}: [')
    for r in v:
        lines.append('    [' + ', '.join(repr(x) if not float(x).is_integer() or i == 0 else str(int(x)) if i == 0 else repr(x) for i, x in enumerate(r)) + '],')
    lines.append('  ],')
lines.append('};')
open(OUT, 'w').write('\n'.join(lines) + '\n')
print('écrit', OUT, {k: len(v) for k, v in tables.items()})
