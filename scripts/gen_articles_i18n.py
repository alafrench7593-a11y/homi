#!/usr/bin/env python3
"""
Génère la migration des articles traduits (espagnol, allemand, italien) — 08/11/2026.
  python3 scripts/gen_articles_i18n.py <es|de|it> supabase/migrations/<AAAAMMJJhhmmss>_articles_<langue>.sql
Source : content-i18n/articles/<langue>/*.json (un fichier par fichier source français, clé = slug).
Additif : ne remplit que title_<langue>, summary_<langue>, body_md_<langue> ; le français et l'anglais ne sont jamais modifiés.
Une migration déjà écrite ne se modifie jamais : le fichier de sortie doit être NOUVEAU.
Les articles traduits ne s'affichent qu'une fois la langue publiée par l'administration (table content_locales).
"""
import glob, json, os, re, sys

lang, out = sys.argv[1], sys.argv[2]
if lang not in ('es', 'de', 'it'): sys.exit('langue : es, de ou it')
if not re.match(r'^supabase/migrations/\d{14}_[a-z0-9_]+\.sql$', out): sys.exit('sortie : supabase/migrations/<AAAAMMJJhhmmss>_<nom>.sql')
if os.path.exists(out): sys.exit(f'{out} existe déjà : une migration écrite ne se modifie pas.')
q = lambda v: "'" + v.replace("'", "''") + "'"
rows = {}
for p in sorted(glob.glob(f'content-i18n/articles/{lang}/*.json')):
    for slug, a in json.load(open(p, encoding='utf-8')).items():
        if not a or not a.get('title', '').strip() or not a.get('body_md', '').strip(): sys.exit(f'{p}: {slug} : traduction vide')
        rows[slug] = a
lines = [
    f'-- Articles en {lang} — FICHIER GÉNÉRÉ par scripts/gen_articles_i18n.py (ne pas modifier à la main) : {os.path.basename(out)}.',
    f'-- Additif : seules les colonnes *_{lang} sont remplies (français et anglais inchangés). Traductions À RELIRE : elles ne',
    f"-- s'affichent qu'après publication de la langue dans l'administration (content_locales.articles_published).",
    f'-- Retour arrière : update public.articles set title_{lang} = null, summary_{lang} = null, body_md_{lang} = null;',
]
for slug in sorted(rows):
    a = rows[slug]
    lines.append(f"update public.articles set title_{lang} = {q(a['title'])}, summary_{lang} = {q(a['summary'])}, body_md_{lang} = {q(a['body_md'])} where slug = {q(slug)};")
open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(f'{out} : {len(rows)} articles')
