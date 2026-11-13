"""
Introduction HOMI de première ouverture (/cinematic, vectorielle, sans vidéo) dans un navigateur réel :
lancement à la première ouverture, durée courte, aucune vidéo, « Passer », marquée vue et jamais rejouée,
« Réduire les animations » → directement l'introduction en diapositives, « Revoir » depuis les réglages.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/cinematique.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, time
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/cinematique')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
CHROMIUM = os.environ.get('PW_CHROMIUM')


def ctx_for(p, reduce=False):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce' if reduce else 'no-preference')
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
    # 1. Première ouverture : introduction HOMI, puis l'introduction en diapositives
    b, pg = ctx_for(p)
    pg.goto(B + '/')
    R['premiere_ouverture_lance_intro'] = wait_url(pg, lambda u: '/cinematic' in u, 6) is not None
    pg.wait_for_timeout(700)
    pg.screenshot(path=f'{SHOTS}/intro-700ms.png')
    R['aucune_video'] = pg.locator('video').count() == 0
    R['passer_visible'] = pg.locator('[data-testid="homi-intro-skip"]').first.is_visible()
    t = time.time()
    left = wait_url(pg, lambda u: '/cinematic' not in u, 6)
    R['duree_courte_moins_3s'] = left is not None and time.time() - t < 3.2
    pg.wait_for_timeout(800)
    R['fin_vers_intro'] = pg.url.rstrip('/').endswith('/intro')
    R['marquee_vue'] = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.ui')") or '{}').get('state', {}).get('cinematicSeen') is True
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['pas_rejouee_a_l_ouverture'] = '/cinematic' not in pg.url
    b.close()

    # 2. « Passer »
    b, pg = ctx_for(p)
    pg.goto(B + '/'); wait_url(pg, lambda u: '/cinematic' in u, 6); pg.wait_for_timeout(300)
    t = time.time(); pg.locator('[data-testid="homi-intro-skip"]').first.click()
    wait_url(pg, lambda u: '/cinematic' not in u, 3)
    R['passer_rapide'] = '/cinematic' not in pg.url and time.time() - t < 1.5
    b.close()

    # 3. « Réduire les animations » : aucune animation, directement l'introduction en diapositives
    b, pg = ctx_for(p, reduce=True)
    pg.goto(B + '/')
    wait_url(pg, lambda u: u.rstrip('/').endswith('/intro'), 6)
    R['reduit_direct_vers_intro'] = pg.url.rstrip('/').endswith('/intro')
    R['reduit_sans_intro_animee'] = pg.locator('[data-testid="homi-intro"]').count() == 0
    b.close()

    # 4. « Revoir l'introduction animée » depuis Réglages › Mon accueil (démonstration sans compte)
    b, pg = ctx_for(p)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_role('button', name='Découvrir sans compte').click(); pg.wait_for_timeout(4000)
    # Réglages › Mon accueil est réservé à Premium : abonnement de démonstration actif
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
      s.tables.subscriptions = (s.tables.subscriptions || []).filter((x) => x.user_id !== me);
      s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'aufildenous_premium_annual', store: 'test', period_type: 'annual', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.goto(B + '/settings/home'); pg.wait_for_timeout(3000)
    btn = pg.locator('[data-testid="settings-replay-cinematic"]').first
    R['reglages_bouton_revoir'] = btn.is_visible()
    btn.click(); pg.wait_for_timeout(600)
    R['revoir_lance_intro'] = '/cinematic' in pg.url and pg.locator('[data-testid="homi-intro"]').count() >= 1
    pg.locator('[data-testid="homi-intro-skip"]').first.click(); pg.wait_for_timeout(1500)
    R['revoir_retour_reglages'] = '/settings/home' in pg.url
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
