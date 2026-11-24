"""Captures RÉELLES de l'application HOMI pour le site (aucune image générée) : version web de l'app, mode démo
(famille fictive, aucune donnée de compte ni réseau), format iPhone 390×844 @3x → WebP 780 px de large.
Chaque capture est contrôlée : écran d'erreur, de chargement ou presque vide → rejetée et listée.
Usage : E2E_URL=http://127.0.0.1:8813 python3 e2e/captures_site.py <dossier de sortie>"""
import os, re, sys, io, json
from playwright.sync_api import sync_playwright
from PIL import Image

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8813')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'web/site/screens/v2'
os.makedirs(OUT, exist_ok=True)
SHOTS = [  # nom, adresse (« {child} » : enfant fictif de la démo), ce que l'écran doit montrer
  ('accueil', '/app', None), ('outils', '/tools', None),
  ('sommeil', '/outil/kid_sleep', None), ('biberon', '/outil/baby_bottle', None), ('journee-biberons', '/outil/baby_bottle_timer', None),
  ('allaitement', '/outil/baby_breastfeed', None), ('croissance', '/child/{child}/growth', None), ('developpement', '/outil/kid_grow', None),
  ('dents', '/outil/kid_teeth', None), ('vaccins', '/outil/kid_vaccines', None), ('diversification', '/outil/baby_foods', None),
  ('medicaments', '/medications', None), ('journal', '/outil/journal', None), ('couches', '/outil/baby_diaper', None),
  ('grossesse', '/outil/preg_evolution', None), ('contractions', '/pregnancy/contractions', None), ('preparation', '/outil/preg_lists', None),
  ('agenda', '/outil/family_calendar', None), ('relais-nuit', '/outil/family_nights', None), ('charge-mentale', '/outil/mental_load', None),
  ('taches', '/outil/family_tasks', None), ('courses', '/outil/family_shopping', None), ('co-parent', '/outil/pp_partner', None),
  ('communaute', '/outil/community', None), ('aura', '/outil/ask', None), ('cycle', '/outil/cycle_home', None),
  ('post-partum', '/outil/pp_recovery', None), ('resume', '/outil/summary', None),
]
BAD = re.compile(r"(Une erreur|Erreur inattendue|introuvable|Something went wrong|n'existe pas|Réessayer)", re.I)
report = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'))
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, locale='fr-FR', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.route(re.compile(r'https?://(?!127\.0\.0\.1).*'), lambda r: r.abort())   # aucun réseau externe
    pg.goto(B + '/demo'); pg.wait_for_timeout(5000)
    child = None
    pg.goto(B + '/outil/kid_teeth'); pg.wait_for_timeout(4000)
    m = re.search(r'([0-9a-f-]{36}|demo-[\w-]+)', pg.url); child = m.group(1) if m else None
    for name, url, _ in SHOTS:
        if '{child}' in url:
            if not child: report.append({'name': name, 'ok': False, 'why': 'enfant démo introuvable'}); continue
            url = url.replace('{child}', child)
        pg.goto(B + url); pg.wait_for_timeout(4500)
        txt = pg.inner_text('body')
        words = len(txt.split())
        why = 'texte d\'erreur' if BAD.search(txt) else 'presque vide' if words < 25 else 'chargement' if pg.locator('[data-testid="session-loading"]').count() else None
        png = pg.screenshot()
        img = Image.open(io.BytesIO(png)).convert('RGB').resize((780, 1688), Image.LANCZOS)
        path = os.path.join(OUT, f'{name}.webp')
        img.save(path, 'WEBP', quality=82, method=6)
        report.append({'name': name, 'url': re.sub(r'^https?://[^/]+', '', pg.url), 'ok': why is None, 'why': why, 'words': words, 'kb': os.path.getsize(path) // 1024})
    b.close()
json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), ensure_ascii=False, indent=1)
for r in report: print(('OK   ' if r['ok'] else 'REJET ') + r['name'], r.get('url', ''), r.get('why') or '', r.get('kb', ''), 'ko')
