"""
Régression (audit 05 → correctif coordinateur) : en démonstration, un rechargement complet ou une adresse ouverte
directement ne doit JAMAIS renvoyer vers /welcome. Cause corrigée : l'écoute de la session démarrait avant le
rétablissement du mode démo (src/lib/auth.tsx).
  PW_CHROMIUM=/opt/pw-browsers/chromium E2E_URL=http://127.0.0.1:8811 python3 e2e/demo_rechargement.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os
from playwright.sync_api import sync_playwright

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
R, errs = {}, []

with sync_playwright() as p:
    exe = os.environ.get('PW_CHROMIUM')
    b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    pg = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR').new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(3000)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    for path in ['/household', '/family/missions', '/settings']:
        pg.goto(B + path); pg.wait_for_timeout(4000)
        R[f'adresse_directe{path}'] = pg.url.split('?')[0].endswith(path)
    pg.reload(); pg.wait_for_timeout(4500)
    R['rechargement_reste_sur_la_page'] = pg.url.split('?')[0].endswith('/settings')
    b.close()

print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
raise SystemExit(0 if all(R.values()) and not errs else 1)
