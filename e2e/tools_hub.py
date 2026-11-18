"""
HOMI — centre d'outils (« Mes outils ») : captures 390 × 844 et vérifications à l'écran.
Démonstration sans compte, Premium actif (comme e2e/hubs_v5.py).
  1. /tools : recherche en haut, « Mes favoris », « Pour <profil> » (6 au plus), 9 catégories + compte ;
  2. une catégorie (/tools/sleep) : outils, autres profils, « À lire » ;
  3. la fiche d'un outil (premier appui) et « Commencer » ; second appui = ouverture directe ;
  4. favori ajouté depuis une rangée, retrouvé dans « Mes favoris » ;
  5. trois recherches, dont une sans réponse (« Aucun outil ne correspond » + catégories) ;
  6. cibles tactiles ≥ 44 px, pas de défilement horizontal ;
  7. la Communauté en bloc distinct ; 8. la rubrique des soins (couches), raccourcis contextuels, ancien lien ;
  9. descriptions entières (fr, de, en) ; 10. menus rebranchés sur le registre ; 11. onglets Moi / Enfant / Famille
     pour deux profils ; 12. catégories en allemand et en anglais.
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


def rows(pg):
    """Identifiants des outils affichés (rangées visibles)."""
    return pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="tool-row-press-"]')].filter((e) => e.offsetParent !== null).map((e) => e.getAttribute('data-testid').replace('tool-row-press-', ''))""")


def untruncated(pg):
    """Chaque description de rangée est affichée en entier (aucune ellipse) et tient en 4 lignes au plus."""
    return pg.evaluate("""() => { const els = [...document.querySelectorAll('[data-testid^="tool-desc-"]')].filter((e) => e.offsetParent !== null);
      return els.length > 0 && els.every((e) => { const lh = parseFloat(getComputedStyle(e).lineHeight) || 20; return e.scrollHeight <= e.clientHeight + 1 && e.clientHeight <= lh * 4 + 2; }); }""")


def search(pg, q):
    box = pg.locator('[data-testid="tools-search-input"]').first
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
    # verre : recherche et tuiles compactes (« Pour <profil> ») en verre ; les listes de texte restent opaques
    R['recherche_en_verre'] = n(pg, '[data-testid="tools-search-material"]') == 1
    R['tuiles_pour_profil_en_verre'] = n(pg, '[data-testid="tools-featured"] [data-testid^="tool-tile-"][data-testid$="-material"]') == feat
    R['categories_opaques'] = n(pg, '[data-testid="tools-categories"] [data-testid$="-material"]') == 0
    # champ actif et vide : catégories suggérées
    # (on remonte d'abord : un défilement pendant le toucher ferme le clavier, comme sur un téléphone)
    pg.mouse.move(195, 400); pg.mouse.wheel(0, -5000); pg.wait_for_timeout(600)
    pg.locator('[data-testid="tools-search-input"]').first.click(); pg.wait_for_timeout(500)
    R['categories_suggerees_champ_vide'] = n(pg, '[data-testid^="tools-suggest-"]') >= 3
    pg.keyboard.press('Tab'); pg.wait_for_timeout(300)

    # 2. Une catégorie
    pg.locator('[data-testid="tools-category-sleep"]').first.click(); pg.wait_for_timeout(1800)
    R['categorie_ouverte'] = '/tools/sleep' in pg.url and n(pg, '[data-testid^="tool-row-press-"]:visible') >= 3
    shot(pg, '02-categorie-sommeil'); shot(pg, '02-categorie-sommeil-entier', full=True)

    # 3. Fiche d'un outil (premier appui), puis « Commencer »
    first = pg.locator('[data-testid^="tool-row-press-"]:visible').first
    tid = first.get_attribute('data-testid').replace('tool-row-press-', '')
    first.click(); pg.wait_for_timeout(1200)
    R['fiche_ouverte'] = n(pg, f'[data-testid="tool-sheet-{tid}"]') == 1 and n(pg, '[data-testid="tool-sheet-start"]') == 1
    R['fiche_en_verre'] = n(pg, '[data-testid="sheet-panel-material"]') == 1
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

    # 6. Autres vues : catégorie sans outil, compte, guides
    for cat, name in [('cycle', '08-categorie-cycle'), ('account', '09-compte-et-reglages'), ('health', '10-categorie-sante')]:
        pg.goto(B + f'/tools/{cat}'); pg.wait_for_timeout(2000)
        shot(pg, name, full=(cat == 'health'))
    pg.goto(B + '/guide'); pg.wait_for_timeout(2000)
    R['index_des_guides'] = n(pg, '[data-testid="guides-list"]') == 1 or 'Aucun guide' in pg.locator('body').inner_text()
    shot(pg, '11-guides')

    # 7. Communauté : un bloc à part, sous les 9 catégories (pas un outil de « Couple et foyer »)
    pg.goto(B + '/tools'); pg.wait_for_timeout(2400)
    blk = pg.locator('[data-testid="tools-community"]').first
    R['communaute_bloc_distinct'] = blk.count() == 1 and n(pg, '[data-testid="tools-categories"] [data-testid="tools-community"]') == 0 \
        and pg.evaluate("""() => { const c = document.querySelector('[data-testid="tools-categories"]'), k = document.querySelector('[data-testid="tools-community"]');
          return !!c && !!k && !!(c.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING); }""")
    blk.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    shot(pg, '12-outils-bloc-communaute'); shot(pg, '12-outils-entier', full=True)
    pg.goto(B + '/tools/couple'); pg.wait_for_timeout(2000)
    R['communaute_hors_couple_et_foyer'] = n(pg, '[data-testid="tool-row-press-community"]') == 0
    pg.goto(B + '/tools'); pg.wait_for_timeout(2200)
    pg.locator('[data-testid="tools-community-open"]').first.click(); pg.wait_for_timeout(2200)
    R['communaute_s_ouvre'] = '/community' in pg.url

    # 8. Soins : les couches y sont (plus dans l'alimentation) ; raccourcis contextuels ; ancien lien de catégorie
    pg.goto(B + '/tools/care'); pg.wait_for_timeout(2400)
    care = rows(pg)
    R['soins_couches_dents_scanner'] = all(x in care for x in ('baby_diaper', 'kid_teeth', 'scan_product'))
    R['soins_titre'] = 'Soins, quotidien et croissance' in pg.locator('body').inner_text()
    R['descriptions_entieres_soins'] = untruncated(pg)
    shot(pg, '13-categorie-soins'); shot(pg, '13-categorie-soins-entier', full=True)
    pg.goto(B + '/tools/feeding'); pg.wait_for_timeout(2200)
    feed = rows(pg)
    R['alimentation_sans_couches'] = 'baby_diaper' not in feed and 'scan_food' in feed
    R['raccourcis_contextuels'] = 'Aussi utile ici' in pg.locator('body').inner_text()
    shot(pg, '14-categorie-alimentation', full=True)
    pg.goto(B + '/tools/growth'); pg.wait_for_timeout(2200)
    R['ancien_lien_categorie'] = 'Soins, quotidien et croissance' in pg.locator('body').inner_text() and 'baby_diaper' in rows(pg)
    pg.goto(B + '/tools/pregnancy'); pg.wait_for_timeout(2200)
    R['scanners_en_raccourci_grossesse'] = all(x in rows(pg) for x in ('scan_food', 'scan_product'))
    # un favori posé depuis un raccourci est celui de l'outil (même étoile dans sa catégorie principale)
    pg.locator('[data-testid="tool-fav-scan_food"]:visible').first.click(); pg.wait_for_timeout(500)
    pg.goto(B + '/tools/feeding'); pg.wait_for_timeout(2200)
    R['un_seul_favori_par_outil'] = pg.locator('[data-testid="tool-fav-scan_food"]:visible').first.get_attribute('aria-checked') == 'true'

    # 9. Descriptions entières (4 lignes au plus, jamais coupées à 390 pt) dans toutes les catégories
    full = True
    for cat in ['feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple', 'family']:
        pg.goto(B + f'/tools/{cat}'); pg.wait_for_timeout(1800)
        full = full and (untruncated(pg) or not rows(pg))
    R['descriptions_entieres_fr'] = full

    # 10. Menus rebranchés sur le registre : rangées du catalogue + accès nommé à la catégorie
    for route, box, shelf, name in [('/pregnancy', 'preg-rubrics', 'pregnancy', '15-menu-grossesse'), ('/me', 'me-tools', 'health', '16-menu-moi-aussi'),
                                   ('/family', 'family-tools', 'family', '17-menu-foyer'), ('/track', 'track-preg', 'pregnancy', '18-menu-suivi')]:
        pg.goto(B + route); pg.wait_for_timeout(2600)
        cnt = n(pg, f'[data-testid="{box}"] [data-testid^="tool-row-press-"]')
        link = pg.locator(f'[data-testid="{box}-all-{shelf}"]')
        R[f'menu_{box}'] = cnt >= 3 and link.count() >= 1 and not __import__('re').search(r'Voir (les )?\d+ autres|\(\d+ de plus\)', pg.locator('body').inner_text())
        if link.count():
            link.first.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        shot(pg, name); shot(pg, name + '-entier', full=True)
    pg.goto(B + '/pregnancy'); pg.wait_for_timeout(2400)
    link = pg.locator('[data-testid="preg-rubrics-all-pregnancy"]').first
    R['acces_nomme_grossesse'] = (link.get_attribute('aria-label') or '').startswith('Tous les outils de grossesse')
    link.click(); pg.wait_for_timeout(2000)
    R['acces_nomme_ouvre_la_categorie'] = pg.url.endswith('/tools/pregnancy')
    # même outil, même nom, dans le menu et dans la catégorie
    pg.goto(B + '/pregnancy'); pg.wait_for_timeout(2200)
    menu_label = pg.locator('[data-testid="tool-row-press-preg_calendar"]').first.get_attribute('aria-label') or ''
    pg.goto(B + '/tools/pregnancy'); pg.wait_for_timeout(2200)
    cat_label = pg.locator('[data-testid="tool-row-press-preg_calendar"]').first.get_attribute('aria-label') or ''
    R['meme_nom_menu_et_catalogue'] = bool(menu_label) and menu_label.split('.')[0] == cat_label.split('.')[0]

    # 11. Onglets Moi / Enfant / Famille pour deux profils : outils du catalogue, accès nommés, aucun « Voir les N autres »
    lina = pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.demo.v1')).tables.children.find(c => c.first_name === 'Lina') || {}).id")
    for prof, chip in [('grossesse', 'subject-preg'), ('lina', f'subject-{lina}')]:
        for hub, route in [('health', '/health'), ('baby', '/baby'), ('family', '/household')]:
            pg.goto(B + route); pg.wait_for_timeout(2400)
            c = pg.locator(f'[data-testid="hub-{hub}-profiles"] [data-testid="{chip}"]')
            if c.count() and c.first.get_attribute('aria-checked') != 'true':
                c.first.click(); pg.wait_for_timeout(1200)
            txt = pg.locator(f'[data-testid="hub-{hub}"]').first.inner_text()
            ids = pg.evaluate("""(h) => [...document.querySelectorAll(`[data-testid="hub-${h}"] [data-testid^="tool-row-press-"]`)].filter((e) => e.offsetParent !== null).map((e) => e.getAttribute('data-testid').replace('tool-row-press-', ''))""", hub)
            R[f'onglet_{hub}_{prof}'] = len(ids) >= 3 and ('Tous les outils' in txt or 'Explorer les outils' in txt) and 'Voir plus' not in txt and n(pg, '[data-testid^="hub-more-"]') == 0
            if hub == 'family':
                R[f'famille_sans_grossesse_ni_cycle_{prof}'] = not any(x.startswith(('preg_', 'cycle_', 'avoid_', 'ttc_', 'pp_')) for x in ids)
            if hub == 'baby' and prof == 'lina':
                R['enfant_sante_de_l_enfant'] = 'kid_vaccines' in ids or 'appointments' in ids
            if hub == 'health' and prof == 'lina':
                R['moi_sans_sante_de_l_enfant'] = not any(x in ids for x in ('kid_vaccines', 'kid_health', 'kid_treatments'))
            if hub == 'baby' and prof == 'grossesse':
                # profil « grossesse » affiché : aucun outil propre dans Enfant (donc pas de scanner) ; seuls ceux des enfants du foyer, à leur nom
                R['enfant_rien_pour_un_profil_sans_enfant'] = n(pg, '[data-testid="hub-baby"] [data-testid^="hub-group-"]') == 0 and n(pg, '[data-testid="hub-baby-others"]') == 1
            shot(pg, f'19-onglet-{hub}-{prof}'); shot(pg, f'19-onglet-{hub}-{prof}-entier', full=True)

    # 11b. Petit écran (320 × 568) : la fiche d'un outil jamais ouvert montre « Commencer » sans défiler ; le dernier outil
    # d'une catégorie se lit en entier en bas de la liste virtualisée
    ctx2 = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce')
    pg2 = ctx2.new_page()
    pg2.goto(B + '/welcome'); pg2.wait_for_timeout(2500)
    pg2.get_by_text('Découvrir sans compte').first.click(); pg2.wait_for_timeout(4000)
    pg2.evaluate(PREMIUM)
    for cat in ['sleep', 'health', 'feeding']:
        pg2.goto(B + f'/tools/{cat}'); pg2.wait_for_timeout(2400)
        first = pg2.locator('[data-testid^="tool-row-press-"]:visible').first
        first.click(); pg2.wait_for_timeout(1200)
        st = pg2.locator('[data-testid="tool-sheet-start"]').first
        bb = st.bounding_box() if st.count() else None
        R[f'fiche_320_commencer_sans_defiler_{cat}'] = bool(bb and bb['y'] >= 0 and bb['y'] + bb['height'] <= 568)
        shot(pg2, f'22-fiche-320-{cat}')
        pg2.keyboard.press('Escape'); pg2.wait_for_timeout(700)
        last = pg2.evaluate("""() => { const l = [...document.querySelectorAll('[data-testid^="tools-category-list-"]')].find(e => e.offsetParent !== null); if (!l) return null;
          l.scrollTop = l.scrollHeight; return true; }"""); pg2.wait_for_timeout(900)
        ok = pg2.evaluate("""() => { const l = [...document.querySelectorAll('[data-testid^="tools-category-list-"]')].find(e => e.offsetParent !== null); if (!l) return false; l.scrollTop = l.scrollHeight;
          const rows = [...l.querySelectorAll('[data-testid^="tool-row-press-"]')].filter(e => e.offsetParent !== null); const r = rows[rows.length - 1].getBoundingClientRect();
          return r.bottom <= innerHeight && r.top >= 0; }""")
        R[f'categorie_320_dernier_outil_visible_{cat}'] = bool(last) and ok
    ctx2.close()

    # 12. Allemand et anglais : descriptions entières dans les catégories
    for lang, radio, cat, name in [('de', 'Deutsch', 'health', '20-categorie-sante-allemand'), ('en', 'English', 'care', '21-categorie-soins-anglais')]:
        pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
        pg.get_by_role('radio', name=radio).click(); pg.wait_for_timeout(2000)
        ok = True
        for c2 in ['feeding', 'sleep', 'care', 'health', 'pregnancy', 'couple', 'family']:
            pg.goto(B + f'/tools/{c2}'); pg.wait_for_timeout(1700)
            ok = ok and (untruncated(pg) or not rows(pg))
        R[f'descriptions_entieres_{lang}'] = ok
        pg.goto(B + f'/tools/{cat}'); pg.wait_for_timeout(2200)
        shot(pg, name); shot(pg, name + '-entier', full=True)
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='Français').click(); pg.wait_for_timeout(1500)
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
