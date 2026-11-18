"""
Captures de contrôle des finitions du 21/11/2026 (démo sans compte, Premium actif), à 390 × 844 et 320 × 568 :
en-tête de l'accueil, feuille de l'avatar, Communauté (filtres qui s'estompent, bouton Messages dans l'en-tête),
fiche d'outil avec « Problème résolu », catégorie « École, crèche et garde ».
  NAV_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> PW_CHROMIUM=<chrome> python3 e2e/finitions_captures.py
Le rapport JSON vérifie aussi la géométrie (rien ne déborde, cibles ≥ 44 px, fondu présent).
"""
import json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-finitions')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def n(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()


def overflow(pg):
    return pg.evaluate('() => document.documentElement.scrollWidth > innerWidth + 1')


def run(b, w, h):
    tag = f'{w}'
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f'{tag} PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3500)

    # 1. En-tête de l'accueil
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    boxes = {k: tid(pg, k).bounding_box() for k in ['home-help', 'home-bell', 'header-community', 'header-account']}
    R[f'{tag}_entete_4_elements_dans_l_ecran'] = all(bb and bb['x'] >= 0 and bb['x'] + bb['width'] <= w and bb['height'] >= 44 for bb in boxes.values())
    xs = [boxes[k]['x'] for k in ['home-help', 'home-bell', 'header-community', 'header-account']]
    R[f'{tag}_entete_ordre'] = xs == sorted(xs)
    R[f'{tag}_entete_sans_reglages'] = n(pg, 'header-settings') == 0
    R[f'{tag}_communaute_nom_accessible'] = tid(pg, 'header-community').get_attribute('aria-label') == 'Communauté'
    R[f'{tag}_communaute_libelle_visible'] = ('Communauté' in tid(pg, 'header-community').inner_text()) == (w >= 360)
    pg.screenshot(path=f'{SHOTS}/accueil-entete-{tag}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 330)})
    pg.screenshot(path=f'{SHOTS}/accueil-{tag}.png')
    # 2. Feuille de l'avatar
    tid(pg, 'header-account').click(); pg.wait_for_timeout(1400)
    R[f'{tag}_feuille_avatar'] = n(pg, 'account-sheet') == 1 and all(n(pg, x) == 1 for x in ['account-sheet-profile', 'account-sheet-settings', 'account-sheet-emergency'])
    pg.screenshot(path=f'{SHOTS}/feuille-avatar-{tag}.png')
    tid(pg, 'account-sheet-settings').click(); pg.wait_for_timeout(1500)
    R[f'{tag}_feuille_avatar_reglages'] = pg.url.endswith('/settings')

    # 3. Communauté : filtres et bouton Messages dans l'en-tête
    pg.goto(B + '/community'); pg.wait_for_timeout(3000)
    cat = tid(pg, 'community-categories').bounding_box()
    R[f'{tag}_filtres_jusqu_au_bord'] = bool(cat and cat['x'] <= 1 and abs(cat['x'] + cat['width'] - w) <= 1)
    R[f'{tag}_filtres_fondu_droit'] = n(pg, 'community-categories-fade') == 1
    msg = tid(pg, 'community-messages').bounding_box()
    hdr = tid(pg, 'screen-header').bounding_box() if n(pg, 'screen-header') else None
    R[f'{tag}_messages_dans_l_en_tete'] = bool(msg and hdr and msg['y'] >= hdr['y'] and msg['y'] + msg['height'] <= hdr['y'] + hdr['height'] + 1)
    R[f'{tag}_messages_plus_dans_la_rangee'] = pg.evaluate("""() => { const g = [...document.querySelectorAll('[data-testid="community-groups"]')].find(e => e.offsetParent !== null);
      return !g || !g.parentElement.querySelector('[data-testid="community-messages"]'); }""")
    R[f'{tag}_communaute_sans_debordement'] = not overflow(pg)
    pg.screenshot(path=f'{SHOTS}/communaute-{tag}.png')
    # en fin de défilement, le fondu disparaît
    pg.evaluate("""() => { const s = [...document.querySelectorAll('[data-testid="community-categories"]')].find(e => e.offsetParent !== null); if (s) s.scrollLeft = s.scrollWidth; }""")
    pg.wait_for_timeout(700)
    R[f'{tag}_filtres_fondu_absent_en_fin'] = n(pg, 'community-categories-fade') == 0
    pg.screenshot(path=f'{SHOTS}/communaute-filtres-fin-{tag}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 520)})

    # 4. Fiche d'outil : « Problème résolu »
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(3000)
    row = pg.locator('[data-testid="tool-row-press-family_nights"]').filter(visible=True).first
    if row.count():
        row.click(); pg.wait_for_timeout(1500)
    sheet = n(pg, 'tool-sheet-family_nights') == 1
    prob = tid(pg, 'tool-sheet-problem').inner_text() if n(pg, 'tool-sheet-problem') else ''
    R[f'{tag}_fiche_probleme_redige'] = sheet and 'Vous vous levez toutes les nuits et l’autre parent ne sait pas quand prendre le relais.' in prob and '·' not in prob
    start = tid(pg, 'tool-sheet-start').bounding_box() if n(pg, 'tool-sheet-start') else None
    R[f'{tag}_fiche_commencer_visible'] = bool(start and start['y'] + start['height'] <= h)
    pg.screenshot(path=f'{SHOTS}/fiche-outil-relais-{tag}.png')

    # 5. Catégorie « École, crèche et garde » : 5 vrais outils, dont « Garde et nounou »
    pg.goto(B + '/tools/school'); pg.wait_for_timeout(3000)
    txt = pg.inner_text('body')
    R[f'{tag}_ecole_garde_et_nounou'] = 'Garde et nounou' in txt
    R[f'{tag}_ecole_sans_debordement'] = not overflow(pg)
    pg.screenshot(path=f'{SHOTS}/categorie-ecole-garde-{tag}.png', full_page=False)
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    run(b, 390, 844)
    run(b, 320, 568)
    b.close()
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
