"""
Profil et barre du bas (HOMI, 13/11/2026) : le profil n'est plus un onglet ; c'est l'avatar en haut à droite des
écrans (initiale sans photo, photo dès qu'elle est choisie). La barre garde 5 onglets + le bouton d'action, sans
débordement, à 390 et 320 px de large.
  python3 e2e/spa_server.py dist 8822 &  puis  python3 e2e/barre_bas_profil.py
Variables : NAV_URL (serveur), E2E_SHOTS (captures), PW_CHROMIUM (navigateur, ex. /opt/pw-browsers/chromium).
"""
import json, os, struct, sys, zlib
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('PW_CHROMIUM') or None
R = {}; errs = []
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def portrait_png(w=96, h=96):
    """Petite image PNG (dégradé lilas) fabriquée à la volée : aucun fichier de test à fournir."""
    rows = b''.join(b'\x00' + b''.join(bytes((205 - y // 3, 190 - x // 4, 250)) for x in range(w)) for y in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xFFFFFFFF)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    for w, h, name in [(390, 844, 'iphone'), (320, 568, 'petit')]:
        pg = b.new_page(viewport={'width': w, 'height': h}, locale='fr-FR')
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
        pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
        pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
        R[f'{name}_onglets'] = [t.get_attribute('aria-label') for t in pg.locator('[role="tab"][data-testid^="tab-"]').all()]
        R[f'{name}_profil_hors_barre'] = not has(pg, 'tab-profile') and len(R[f'{name}_onglets']) == 5
        R[f'{name}_avatar_en_haut_a_droite'] = has(pg, 'header-avatar-initial') or has(pg, 'header-avatar')
        av = (tid(pg, 'header-avatar-initial') if has(pg, 'header-avatar-initial') else tid(pg, 'header-avatar')).bounding_box()
        R[f'{name}_avatar_position'] = bool(av and av['y'] < 140 and av['x'] > w * 0.6)
        R[f'{name}_initiale_sans_photo'] = has(pg, 'header-avatar-initial')
        R[f'{name}_pas_de_debordement'] = pg.evaluate('() => document.documentElement.scrollWidth <= window.innerWidth')
        R[f'{name}_action_dans_l_ecran'] = (lambda bb: bool(bb and bb['x'] + bb['width'] <= w))(tid(pg, 'quick-add').bounding_box() if has(pg, 'quick-add') else tid(pg, 'cocoon-add').bounding_box())
        pg.screenshot(path=f'{SHOTS}/barrebas-{name}.png', clip={'x': 0, 'y': h - 110, 'width': w, 'height': 110})
        if name == 'iphone':
            pg.get_by_role('button', name=__import__('re').compile('^Mon profil')).first.click(); pg.wait_for_timeout(2500)
            R['ouvre_profil'] = pg.url.endswith('/profile')
            if has(pg, 'profile-photo'):
                tid(pg, 'profile-photo').click(); pg.wait_for_timeout(800)
                with pg.expect_file_chooser() as fc: tid(pg, 'pp-library').click()
                fc.value.set_files({'name': 'portrait.png', 'mimeType': 'image/png', 'buffer': portrait_png()}); pg.wait_for_timeout(3500)
            R['photo_dans_avatar'] = has(pg, 'header-avatar') and not has(pg, 'header-avatar-initial')
            pg.get_by_role('tab', name='Accueil').click(); pg.wait_for_timeout(2500)
            R['retour_accueil_photo_reste'] = has(pg, 'header-avatar') and not has(pg, 'header-avatar-initial')
        pg.close()
    R['erreurs'] = errs
    b.close()
    print(json.dumps(R, ensure_ascii=False, indent=1))
