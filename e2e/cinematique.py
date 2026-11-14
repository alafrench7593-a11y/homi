"""
Ancienne route /cinematic (première ouverture) dans un navigateur réel — depuis le 14/11/2026 elle REDIRIGE vers
« Découvrir HOMI » (/discover), dont l'ouverture joue le logo maison animé (`HomiLogoAnimated`, branché par
`setDiscoverOpening` dans src/app/_layout.tsx). Le parcours complet de /discover (chapitres, catalogue, démos, Passer,
relance depuis Réglages) est couvert par e2e/decouvrir_homi.py ; ce script vérifie seulement ce qui reste propre à
l'ancienne route et au logo de l'ouverture :
 - /cinematic et /cinematic?replay=1 mènent à /discover, aucune vidéo ;
 - l'ouverture affiche la maison animée (quatre silhouettes, nom HOMI annoncé) ;
 - « Réduire les animations » : la maison en version fixe (aucun calque animé).
  npx expo export --platform web --clear --output-dir /tmp/maison/dist && python3 e2e/spa_server.py /tmp/maison/dist 19011 &
  NAV_URL=http://127.0.0.1:19011 python3 e2e/cinematique.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, time
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:19011')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/maison/cinematique')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
CHROMIUM = os.environ.get('PW_CHROMIUM')
SEEN = "localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true,themePreference:'light'},version:0}))"


def ctx_for(p, reduce=False):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce' if reduce else 'no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    return b, pg


def wait_url(pg, pred, timeout):
    t = time.time()
    while time.time() - t < timeout:
        if pred(pg.url): return time.time() - t
        pg.wait_for_timeout(50)
    return None


def run(p):
    # 1. /cinematic?replay=1 (« Revoir ») → /discover, ouverture sur la maison animée
    b, pg = ctx_for(p)
    pg.add_init_script(SEEN)
    pg.goto(B + '/cinematic?replay=1')
    R['revoir_redirige_vers_discover'] = wait_url(pg, lambda u: '/discover' in u, 8) is not None
    pg.wait_for_selector('[data-testid="discover-logo"]', timeout=10000)
    R['maison_animee'] = pg.locator('[data-testid="discover-logo-static"]').count() == 0
    R['quatre_silhouettes'] = pg.locator('[data-testid^="discover-logo-figure-"]').count() == 4
    R['nom_annonce'] = pg.locator('[data-testid="discover-logo"][aria-label="HOMI"]').count() >= 1
    R['aucune_video'] = pg.locator('video').count() == 0
    pg.wait_for_timeout(1100)
    pg.screenshot(path=f'{SHOTS}/ouverture-maison.png')
    b.close()

    # 2. /cinematic sans paramètre → /discover aussi
    b, pg = ctx_for(p)
    pg.add_init_script(SEEN)
    pg.goto(B + '/cinematic')
    R['cinematic_redirige_vers_discover'] = wait_url(pg, lambda u: '/discover' in u, 8) is not None
    b.close()

    # 3. « Réduire les animations » : maison en version fixe
    b, pg = ctx_for(p, reduce=True)
    pg.add_init_script(SEEN)
    pg.goto(B + '/cinematic?replay=1')
    wait_url(pg, lambda u: '/discover' in u, 8)
    pg.wait_for_selector('[data-testid="discover-opening"]', timeout=10000); pg.wait_for_timeout(600)
    R['reduit_maison_fixe'] = pg.locator('[data-testid="discover-logo-static"]').count() >= 1 and pg.locator('[data-testid^="discover-logo-figure-"]').count() == 0
    pg.screenshot(path=f'{SHOTS}/reduit-maison-fixe.png')
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
