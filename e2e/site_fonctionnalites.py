"""Site : accueil (nouveau titre, 7 écrans réels du récit) et /fonctionnalites/ (121 outils, filtres, recherche sans IA).
Usage : E2E_URL=http://127.0.0.1:8813 python3 e2e/site_fonctionnalites.py  (export web + build-site, e2e/site_server.py)"""
import os, re, sys
from playwright.sync_api import sync_playwright
B = os.environ.get('E2E_URL', 'http://127.0.0.1:8813'); SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-feat'); os.makedirs(SHOTS, exist_ok=True)
RES = []
def check(n, ok, d=''): RES.append(ok); print(('OK  ' if ok else 'ÉCHEC ') + n + (f' — {d}' if d else ''), flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'))
    for w, h, tag in [(390, 844, 'mobile'), (1440, 900, 'desktop')]:
        pg = b.new_page(viewport={'width': w, 'height': h}); errs = []; bad = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:150]))
        pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 and '/site/' in r.url else None)
        pg.goto(B + '/'); pg.wait_for_timeout(1500)
        h1 = re.sub(r'\s+', ' ', pg.inner_text('h1'))
        check(f'{tag} accueil : titre', 'Toute votre vie de famille. Enfin réunie.' in h1, h1)
        check(f'{tag} accueil : 7 écrans réels dans le récit', pg.locator('[data-screen]').count() == 7)
        for y in range(0, 9000, 400): pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(60)
        check(f'{tag} accueil : aucune image manquante', not bad, ', '.join(bad[:3]))
        check(f'{tag} accueil : pas de débordement horizontal', pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
        pg.goto(B + '/fonctionnalites/'); pg.wait_for_timeout(1500)
        n = pg.locator('.feat-item').count()
        check(f'{tag} fonctionnalités : 121 outils dans le HTML', n == 121, str(n))
        check(f'{tag} fonctionnalités : galerie d’écrans réels', pg.locator('.feat-gallery img').count() >= 15)
        pg.fill('#feat-q', 'mon bébé ne dort pas beaucoup'); pg.wait_for_timeout(500)
        vis = [x.strip() for x in pg.locator('.feat-item:not([hidden]) b').all_inner_texts()]
        check(f'{tag} recherche « mon bébé ne dort pas beaucoup » → outils sommeil', any('ommeil' in v or 'nuit' in v.lower() for v in vis) and 0 < len(vis) <= 12, ' | '.join(vis))
        pg.fill('#feat-q', ''); pg.wait_for_timeout(300)
        pg.click('.feat-chips button[data-stage="pregnancy"]'); pg.wait_for_timeout(300)
        vis = pg.locator('.feat-item:not([hidden]) b').all_inner_texts()
        check(f'{tag} filtre Grossesse', any('rossesse' in v for v in vis) and len(vis) < 121, f'{len(vis)} outils')
        check(f'{tag} fonctionnalités : pas de débordement', pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
        for y in range(0, 12000, 600): pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(40)
        check(f'{tag} fonctionnalités : aucune ressource manquante', not bad, ', '.join(bad[:3]))
        pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{SHOTS}/fonctionnalites-{tag}.png', full_page=False)
        pg.goto(B + '/'); pg.wait_for_timeout(1200); pg.screenshot(path=f'{SHOTS}/accueil-{tag}.png')
        check(f'{tag} aucune erreur JavaScript', not errs, '; '.join(errs[:2]))
        pg.close()
    b.close()
print(f'{sum(RES)}/{len(RES)}'); sys.exit(0 if all(RES) else 1)
