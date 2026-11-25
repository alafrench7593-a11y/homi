"""Captures RÉELLES pour le film HOMI (homi-film/screenshots) : version web de l'app, mode démo (famille fictive),
iPhone 390×844 @3x → PNG 1170 px, bandeau « Démo » recadré. Rejette erreurs / écrans presque vides / redirections.
Usage : E2E_URL=http://127.0.0.1:8816 python3 e2e/captures_film.py"""
import os, re, io, json
from playwright.sync_api import sync_playwright
from PIL import Image
B = os.environ.get('E2E_URL', 'http://127.0.0.1:8816'); OUT = 'homi-film/public/screens'; os.makedirs(OUT, exist_ok=True)
SHOTS = [('accueil', '/app'), ('sommeil', '/outil/kid_sleep'), ('journee-biberons', '/outil/baby_bottle_timer'), ('biberon', '/outil/baby_bottle'),
  ('allaitement', '/outil/baby_breastfeed'), ('croissance', '/child/{c}/growth'), ('couches', '/outil/baby_diaper'), ('diversification', '/outil/baby_foods'),
  ('dents', '/outil/kid_teeth'), ('vaccins', '/outil/kid_vaccines'), ('medicaments', '/medications'), ('journal', '/outil/journal'),
  ('agenda', '/outil/family_calendar'), ('relais-nuit', '/outil/family_nights'), ('charge-mentale', '/outil/mental_load'), ('taches', '/outil/family_tasks'),
  ('courses', '/outil/family_shopping'), ('menu', '/outil/meal_menu'), ('communaute', '/outil/community'), ('aura', '/outil/ask'),
  ('mon-histoire', '/child/{c}/story'), ('album', '/child/{c}/album'), ('documents', '/outil/documents'), ('garde', '/outil/childcare'),
  ('routines', '/outil/kid_routines'), ('developpement', '/outil/kid_grow'), ('enfant', '/child/{c}'), ('outils', '/tools'), ('resume', '/outil/summary'),
  ('contractions', '/pregnancy/contractions'), ('grossesse', '/outil/preg_evolution'), ('sante', '/outil/kid_health')]
BAD = re.compile(r"(Une erreur|Erreur inattendue|introuvable|Something went wrong|n'existe pas|Impossible d'afficher)", re.I)
rep = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'))
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, locale='fr-FR', reduced_motion='reduce')
    pg = ctx.new_page(); pg.route(re.compile(r'https?://(?!127\.0\.0\.1).*'), lambda r: r.abort())
    pg.goto(B + '/demo'); pg.wait_for_timeout(6000)
    pg.goto(B + '/outil/kid_teeth'); pg.wait_for_timeout(4000)
    m = re.search(r'([0-9a-f]{8}-[0-9a-f-]{27})', pg.url); child = m.group(1) if m else ''
    for name, url in SHOTS:
        pg.goto(B + url.replace('{c}', child)); pg.wait_for_timeout(4500)
        txt = pg.inner_text('body'); final = re.sub(r'^https?://[^/]+', '', pg.url)
        why = 'erreur' if BAD.search(txt) else 'vide' if len(txt.split()) < 25 else 'redirigé vers /tools' if final.startswith('/tools') and name != 'outils' else None
        img = Image.open(io.BytesIO(pg.screenshot())).convert('RGB'); img = img.crop((0, 192, img.width, img.height))   # bandeau démo (64 px @3x)
        img.save(f'{OUT}/{name}.webp', 'WEBP', quality=88, method=6)
        rep.append({'name': name, 'url': final, 'ok': why is None, 'why': why})
    b.close()
json.dump(rep, open(f'{OUT}/report.json', 'w'), ensure_ascii=False, indent=1)
for r in rep: print(('OK   ' if r['ok'] else 'REJET ') + r['name'], r['url'][:60], r['why'] or '')
