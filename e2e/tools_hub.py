"""
HOMI — centre d'outils (« Mes outils ») : captures 390 × 844 et vérifications à l'écran.
Démonstration sans compte, Premium actif (comme e2e/hubs_v5.py).
  1. /tools : recherche en haut, « Mes favoris », « Pour <profil> » (6 au plus), 9 catégories + compte ;
  2. une catégorie (/tools/sleep) : outils, autres profils, « À lire » ;
  3. la fiche d'un outil (premier appui) et « Commencer » ; second appui = ouverture directe ;
  4. favori ajouté depuis une rangée, retrouvé dans « Mes favoris » ;
  5. trois recherches, dont une sans réponse (« Aucun outil ne correspond » + catégories) ;
  6. cibles tactiles ≥ 44 px, pas de défilement horizontal.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
Usage : NAV_URL=http://127.0.0.1:8991 OUT=<dossier> PW_CHROMIUM=<chrome-headless-shell> python3 e2e/tools_hub.py
"""
import json, os
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8991')
EXE = os.environ.get('PW_CHROMIUM') or None
OUT = os.environ.get('OUT', '/tmp/tools_hub')
os.makedirs(OUT, exist_ok=True)
R, errs = {}, []
PREMIUM = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter((x) => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual', entitlement: 'HOMI_PREMIUM', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }"""


def n(pg, sel):
    return pg.locator(sel).count()


def shot(pg, name, full=False):
    pg.screenshot(path=os.path.join(OUT, name + '.png'), full_page=full)


def search(pg, q):
    box = pg.locator('[data-testid="tools-search"]').first
    box.fill(''); box.fill(q); pg.wait_for_timeout(700)


def run(p):
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM)

    # 1. Mes outils
    pg.goto(B + '/tools'); pg.wait_for_timeout(2500)
    shot(pg, '01-mes-outils'); shot(pg, '01-mes-outils-entier', full=True)
    pg.locator('[data-testid="tools-categories"]').first.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    shot(pg, '01b-mes-outils-categories')
    R['recherche_en_haut'] = n(pg, '[data-testid="tools-search"]') == 1
    R['favoris_presents'] = n(pg, '[data-testid="tools-favorites"]') == 1
    feat = n(pg, '[data-testid="tools-featured"] [data-testid^="tools-featured-"]')
    R['pour_le_profil_6_max'] = 1 <= feat <= 6
    R['neuf_categories_et_compte'] = n(pg, '[data-testid="tools-categories"] [data-testid^="tools-category-"]') == 10
    R['plus_de_voir_les_autres'] = n(pg, '[data-testid^="tools-more-"]') == 0
    R['pas_de_defilement_horizontal'] = pg.evaluate('() => document.documentElement.scrollWidth <= window.innerWidth + 1')
    small = pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="tool-row-press-"], [data-testid^="tool-fav-"], [data-testid^="tools-category-"]')]
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && (r.height < 44 || r.width < 44)).length""")
    R['cibles_44pt'] = small == 0

    # 2. Une catégorie
    pg.locator('[data-testid="tools-category-sleep"]').first.click(); pg.wait_for_timeout(1800)
    R['categorie_ouverte'] = '/tools/sleep' in pg.url and n(pg, '[data-testid^="tool-row-press-"]:visible') >= 3
    shot(pg, '02-categorie-sommeil'); shot(pg, '02-categorie-sommeil-entier', full=True)

    # 3. Fiche d'un outil (premier appui), puis « Commencer »
    first = pg.locator('[data-testid^="tool-row-press-"]:visible').first
    tid = first.get_attribute('data-testid').replace('tool-row-press-', '')
    first.click(); pg.wait_for_timeout(1200)
    R['fiche_ouverte'] = n(pg, f'[data-testid="tool-sheet-{tid}"]') == 1 and n(pg, '[data-testid="tool-sheet-start"]') == 1
    shot(pg, '03-fiche-outil')
    pg.locator('[data-testid="tool-sheet-start"]').first.click(); pg.wait_for_timeout(2200)
    R['commencer_ouvre_l_outil'] = '/tools' not in pg.url and 'Page introuvable' not in pg.locator('body').inner_text()
    shot(pg, '03b-outil-ouvert')
    # second appui : l'outil est connu, il s'ouvre directement (pas de fiche)
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(2200)
    pg.locator(f'[data-testid="tool-row-press-{tid}"]:visible').first.click(); pg.wait_for_timeout(2000)
    R['outil_connu_ouverture_directe'] = '/tools' not in pg.url

    # 4. Favori depuis une rangée, retrouvé dans « Mes favoris » (et récents)
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(2200)
    star = pg.locator('[data-testid^="tool-fav-"]:visible').nth(1)
    fid = star.get_attribute('data-testid').replace('tool-fav-', '')
    star.click(); pg.wait_for_timeout(600)
    R['etoile_etat_annonce'] = star.get_attribute('aria-checked') == 'true'
    pg.goto(B + '/tools'); pg.wait_for_timeout(2200)
    R['favori_dans_mes_favoris'] = n(pg, f'[data-testid="tools-favorites"] [data-testid="tool-shortcut-{fid}"]') == 1
    R['recent_affiche'] = n(pg, f'[data-testid="tool-shortcut-{tid}"]') >= 1
    shot(pg, '04-favoris-et-recents')
    pg.locator(f'[data-testid="tools-favorites"] [data-testid="tool-shortcut-{fid}"]').first.click(); pg.wait_for_timeout(2000)
    R['favori_ouverture_directe'] = '/tools' not in pg.url and 'Page introuvable' not in pg.locator('body').inner_text()

    # 5. Recherches
    pg.goto(B + '/tools'); pg.wait_for_timeout(2200)
    search(pg, 'Mon bébé se réveille toutes les nuits')
    ids = pg.evaluate("""() => [...document.querySelectorAll('[data-testid="tools-results"] [data-testid^="tools-result-"]')].map((e) => e.getAttribute('data-testid').replace('tools-result-', ''))""")
    R['recherche_sommeil'] = 'family_nights' in ids and any(x in ids for x in ('kid_sleep', 'sleep_help'))
    shot(pg, '05-recherche-reveils-nuit')
    search(pg, 'liste de courses')
    ids = pg.evaluate("""() => [...document.querySelectorAll('[data-testid="tools-results"] [data-testid^="tools-result-"]')].map((e) => e.getAttribute('data-testid').replace('tools-result-', ''))""")
    R['recherche_courses'] = len(ids) > 0 and ids[0] == 'family_shopping'
    shot(pg, '06-recherche-courses')
    search(pg, 'météo de demain')
    R['recherche_sans_reponse_honnete'] = n(pg, '[data-testid="tools-no-match"]') == 1 and n(pg, '[data-testid="tools-results"]') == 0 \
        and n(pg, '[data-testid="tools-no-match"] [data-testid^="tools-category-"]') == 9 and 'Aucun outil ne correspond' in pg.locator('body').inner_text()
    shot(pg, '07-recherche-sans-reponse')

    # 6. Autres vues : catégorie sans outil, compte, guides, sombre
    for cat, name in [('cycle', '08-categorie-cycle'), ('account', '09-compte-et-reglages'), ('health', '10-categorie-sante')]:
        pg.goto(B + f'/tools/{cat}'); pg.wait_for_timeout(2000)
        shot(pg, name, full=(cat == 'health'))
    pg.goto(B + '/guide'); pg.wait_for_timeout(2000)
    R['index_des_guides'] = n(pg, '[data-testid="guides-list"]') == 1 or 'Aucun guide' in pg.locator('body').inner_text()
    shot(pg, '11-guides')
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
