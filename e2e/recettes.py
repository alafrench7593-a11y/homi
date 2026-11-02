"""
« Repas et recettes » de bout en bout (version web de démonstration, sans compte) : les 12 scénarios demandés,
plus l'écran « Que puis-je cuisiner avec ce que j'ai ? », la recette personnelle et la relecture (administration).
Démo de départ : Camille enceinte, Lina (bébé) et Noé (enfant, ~6 ans).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/recettes.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, subprocess, sys
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2200):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(900)


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def nav(pg, path, wait=2200):
    """Navigation interne (comme un lien de l'appli), sans recharger la page."""
    pg.evaluate("p => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate', { state: null })); }", path)
    pg.wait_for_timeout(wait)


def at(pg, path, key, wait=2200):
    """Ouvre `path` (rechargement : la démo relit les données modifiées), puis choisit le profil avec le sélecteur de l'écran,
    sinon depuis l'accueil puis par navigation interne. Le profil est choisi APRÈS le chargement : sur une version configurée
    avec Supabase, la reprise de la démo au chargement efface le profil enregistré (bug documenté dans cocon.py,
    profil_affiche_conserve_au_rechargement)."""
    go(pg, path, wait)
    if has(pg, 'profile-switcher'):
        tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
        if has(pg, f'subject-{key}'):
            tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(wait)
            return
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    subject(pg, key)
    nav(pg, path, wait)


def listed(pg):
    """Slugs des recettes affichées dans la liste (attributs data-testid « recipe-<slug> »)."""
    pg.mouse.wheel(0, 20000); pg.wait_for_timeout(300)
    return pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"recipe-\"]')].map(e => e.getAttribute('data-testid').slice(7)).filter(s => !['status','sources','allergens','precautions'].includes(s))")


def months_ago(m):
    return (date.today() - timedelta(days=int(m * 30.44))).isoformat()


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(PREMIUM_ON)  # menus hebdomadaires : fonction Premium (le parcours gratuit est vérifié par premium.py)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    go(pg, '/meals', 3000)  # premier passage : la bibliothèque est installée dans la base de démonstration
    # La bibliothèque n'est plus copiée dans le stockage local (reconstruite à chaque ouverture) : mêmes lignes, lues depuis le code
    lib = json.loads(subprocess.run(['npx', '-y', 'tsx', '--tsconfig', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tsconfig.scripts.json'), os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dump_recipes.ts')], capture_output=True, text=True, check=True).stdout)
    R['bibliotheque_64_recettes_en_base'] = len(lib) >= 64
    R['statuts_jamais_relu_par_defaut'] = all(v['status'] in ('ai_draft', 'to_review') for v in lib.values())
    title2slug = {v['title']: k for k, v in lib.items()}

    # ---- 1. Menu grossesse
    subject(pg, 'preg')
    go(pg, '/meals')
    R['1_titre_grossesse'] = 'Bien manger pendant ma grossesse' in T(pg)
    preg_list = listed(pg)
    R['1_liste_grossesse_uniquement'] = bool(preg_list) and all('pregnancy' in lib[s]['aud'] for s in preg_list)
    R['12_pas_de_puree_bebe_pour_femme_enceinte'] = not any('puree' in lib[s]['tags'] and 'pregnancy' not in lib[s]['aud'] for s in preg_list)
    go(pg, '/meals/menu')
    pg.get_by_text('2ᵉ trimestre').first.click()
    tid(pg, 'menu-generate').click(); pg.wait_for_timeout(800)
    titles = pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"menu-slot-\"]')].map(e => e.innerText)")
    R['1_menu_7_jours_2_repas'] = len(titles) == 14
    R['1_menu_que_des_recettes_grossesse'] = all('pregnancy' in lib[title2slug[t]]['aud'] for t in titles)
    first = titles[0]
    tid(pg, 'menu-replace-0-lunch').click(); pg.wait_for_timeout(400)
    R['1_remplacer_un_repas'] = tid(pg, 'menu-slot-0-lunch').inner_text() != first
    pg.screenshot(path=f'{SHOTS}/rc_menu.png')
    tid(pg, 'menu-save').click(); pg.wait_for_timeout(900)
    R['1_menu_enregistre_pour_le_foyer'] = demo(pg, "s => s.tables.meal_plans.length >= 1 && s.tables.meal_plan_items.length >= 14")

    # ---- 8. Liste de courses depuis le menu
    tid(pg, 'menu-to-shopping').click(); pg.wait_for_timeout(2000)
    R['8_liste_creee_et_ouverte'] = '/meals/shopping' in pg.url and demo(pg, "s => s.tables.shopping_items.length > 5")
    t = T(pg)
    R['8_rangee_par_rayon'] = 'Fruits et légumes' in t and 'Épicerie' in t
    R['8_deja_a_la_maison'] = 'Déjà à la maison' in t
    key = demo(pg, "s => s.tables.shopping_items.find(i => !i.at_home).ingredient_key")
    tid(pg, f'shop-{key}').click(); pg.wait_for_timeout(900)
    R['8_produit_coche_enregistre'] = demo(pg, f"s => s.tables.shopping_items.find(i => i.ingredient_key === '{key}').checked === true")
    pg.screenshot(path=f'{SHOTS}/rc_shopping.png')

    # ---- 2. Recette grossesse + 10. image et licence
    slug = preg_list[0]
    go(pg, f'/meals/{slug}')
    t = T(pg)
    R['2_precautions_grossesse'] = tid(pg, 'recipe-precautions').is_visible() and 'Précautions pendant la grossesse' in t
    R['2_ingredients_quantites_etapes'] = 'Ingrédients' in t and 'Préparation' in t and tid(pg, 'recipe-allergens').is_visible()
    R['2_statut_a_verifier'] = 'À vérifier' in tid(pg, 'recipe-status').inner_text()
    R['2_sources_et_date'] = 'Santé' in tid(pg, 'recipe-sources').inner_text() and 'Contrôlée le' in t
    R['2_conservation_et_interet'] = 'Conservation' in t and 'Intérêt nutritionnel' in t
    lic = tid(pg, 'photo-license').inner_text()
    R['10_licence_affichee'] = 'Illustration générée' in lic and 'Création propre' in lic
    R['10_image_declaree_generee'] = 'Illustration générée' in t
    ph = lib[slug]['photo']
    R['10_licence_en_base'] = ph.get('generated') is True and bool(ph.get('license')) and bool(ph.get('rights')) and bool(ph.get('author')) and ph.get('kind') == 'generated'
    tid(pg, 'servings').inner_text()
    before = tid(pg, f"ing-{lib[slug]['ings'][0]}").inner_text()
    pg.locator('[aria-label="Une portion de plus"]').first.click(); pg.wait_for_timeout(300)
    R['2_portions_ajustent_quantites'] = tid(pg, f"ing-{lib[slug]['ings'][0]}").inner_text() != before
    pg.screenshot(path=f'{SHOTS}/rc_detail.png', full_page=True)

    # ---- 3. Purée pour un bébé d'environ 6 mois
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{months_ago(6.3)}'; }}")
    at(pg, '/meals', lina)
    t = T(pg)
    R['3_titre_bebe'] = 'Les repas de Lina' in t
    baby6 = listed(pg)
    R['3_que_des_recettes_bebe'] = bool(baby6) and all('baby' in lib[s]['aud'] for s in baby6)
    R['3_textures_lisses_ou_ecrasees'] = all(any(x in ('smooth', 'mashed') for x in lib[s]['tex']) for s in baby6)
    R['3_purees_proposees'] = any('puree' in lib[s]['tags'] for s in baby6)
    R['3_jamais_de_miel_avant_1_an'] = not any('honey' in lib[s]['ings'] for s in baby6)
    R['12_bebe_pas_recette_enfant_5_ans'] = not any(lib[s]['aud'] == ['child'] for s in baby6)
    pg.screenshot(path=f'{SHOTS}/rc_baby6.png')

    # ---- 4. Changement de texture selon l'étape (âge) et selon le réglage du parent
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{months_ago(10.2)}'; }}")
    at(pg, '/meals', lina)
    baby10 = listed(pg)
    R['4_moulinee_vers_10_mois'] = any('ground' in lib[s]['tex'] and s not in baby6 for s in baby10)
    at(pg, '/meals/settings', lina)
    pg.get_by_text('Lisse', exact=True).first.click()
    tid(pg, 'food-settings-save').click(); pg.wait_for_timeout(1200)
    R['4_reglage_texture_enregistre'] = demo(pg, f"s => s.tables.child_food_settings.some(x => x.child_id === '{lina}' && x.texture === 'smooth')")
    at(pg, '/meals', lina)
    smooth = listed(pg)
    R['4_texture_du_parent_prime_sur_age'] = bool(smooth) and all('smooth' in lib[s]['tex'] for s in smooth) and len(smooth) < len(baby10)

    # ---- 5. Repas pour un enfant de 5 ans
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{noe}').birth_date = '{months_ago(62)}'; }}")
    at(pg, '/meals', noe)
    kid = listed(pg)
    R['5_titre_enfant'] = 'Les repas de Noé' in T(pg)
    R['5_que_des_recettes_enfant'] = bool(kid) and all('child' in lib[s]['aud'] for s in kid)
    R['5_pas_de_purees_bebe'] = not any('puree' in lib[s]['tags'] and 'child' not in lib[s]['aud'] for s in kid)

    # ---- 6. Allergène déclaré
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{noe}').allergies_declared = ['Lait de vache']; }}")
    at(pg, '/meals', noe)
    noMilk = listed(pg)
    R['6_allergie_affichee'] = 'Recettes sans : Lait' in tid(pg, 'meals-allergies').inner_text()
    R['6_aucune_recette_avec_lait'] = bool(noMilk) and not any('milk' in lib[s]['al'] for s in noMilk) and len(noMilk) < len(kid)
    milk_slug = next(s for s in kid if 'milk' in lib[s]['al'])
    at(pg, f'/meals/{milk_slug}', noe)
    R['6_fiche_avertit_pas_adaptee'] = 'Pas adaptée au profil affiché' in T(pg)
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{noe}').allergies_declared = []; }}")

    # ---- 7. Menu végétarien (filtre)
    at(pg, '/meals', noe)
    tid(pg, 'more-filters').click(); pg.wait_for_timeout(400)
    pg.get_by_text('Végétarien', exact=True).last.click(); pg.wait_for_timeout(500)
    veg = listed(pg)
    meat_keys = {'chicken', 'chicken_thigh', 'ground_beef', 'turkey_ham', 'ham', 'salmon', 'white_fish', 'mackerel', 'sardines', 'tuna'}
    R['7_filtre_vegetarien'] = bool(veg) and not any(set(lib[s]['ings']) & meat_keys for s in veg)

    # ---- 9. Famille avec plusieurs enfants
    at(pg, '/meals/menu', 'family')
    tid(pg, 'menu-generate').click(); pg.wait_for_timeout(900)
    t = T(pg)
    titles = pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"menu-slot-\"]')].map(e => e.innerText)")
    R['9_menu_familial'] = len(titles) > 0 and all('family' in lib[title2slug[x]]['aud'] for x in titles)
    R['9_adaptation_pour_chaque_enfant'] = 'Lina :' in t and 'Noé :' in t
    pg.screenshot(path=f'{SHOTS}/rc_family.png', full_page=True)

    # ---- 11. Recette suggérée depuis un produit scanné
    subject(pg, 'preg')
    mutate(pg, """s => { const me = s.tables.profiles[0].id; s.tables.product_scans = (s.tables.product_scans || []).filter(x => !x.id.startsWith('e2e-'));
      s.tables.product_scans.push({ id: 'e2e-scan-lentilles', user_id: me, kind: 'food', barcode: '3017620000000', product_snapshot: { name: 'Lentilles corail bio', brand: 'Exemple' }, created_at: new Date().toISOString() });
      s.tables.product_scans.push({ id: 'e2e-scan-lait-cru', user_id: me, kind: 'food', barcode: '3017620000001', product_snapshot: { name: 'Camembert au lait cru', brand: 'Exemple' }, created_at: new Date().toISOString() }); }""")
    go(pg, '/scanner/result/e2e-scan-lentilles', 2600)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(300)
    R['11_recettes_compatibles_apres_scan'] = tid(pg, 'scan-recipes').is_visible() and len(listed(pg)) > 0 and all('pregnancy' in lib[s]['aud'] for s in listed(pg))
    R['11_lien_ce_que_j_ai'] = tid(pg, 'scan-open-pantry').is_visible()
    go(pg, '/scanner/result/e2e-scan-lait-cru', 2600)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(300)
    R['11_precaution_lait_cru'] = tid(pg, 'scan-precautions').is_visible() and 'lait cru' in T(pg).lower()

    # ---- « Que puis-je cuisiner avec ce que j'ai ? »
    go(pg, '/meals/pantry')
    for name in ['pomme de terre', 'carotte', 'oignon']:
        tid(pg, 'pantry-search').fill(name.split()[0]); pg.wait_for_timeout(300)
        pg.locator(f'[aria-label^="J’ai {name}"]').first.click(); pg.wait_for_timeout(300)
    tid(pg, 'pantry-search').fill('')
    pg.wait_for_timeout(400)
    res = listed(pg)
    R['pantry_resultats_adaptes'] = len(res) > 0 and all('pregnancy' in lib[s]['aud'] for s in res)

    # ---- 12. Accueil : une seule recette recommandée, adaptée
    # Accueil court : la carte « Recette recommandée » est masquée par défaut ; on l'active dans Réglages › Mon accueil
    go(pg, '/settings/home', 2500)
    sw = pg.get_by_role('switch', name='Afficher « Recette recommandée »')
    R['12_carte_recette_activable'] = sw.count() == 1
    if sw.count() and sw.first.get_attribute('aria-checked') != 'true': sw.first.click(); pg.wait_for_timeout(500)
    go(pg, '/', 2800)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(400)
    R['12_une_seule_recette_accueil'] = pg.locator('[data-testid="home-recipe"]').count() == 1
    t1 = tid(pg, 'home-recipe-title').inner_text()
    R['12_accueil_grossesse_recette_grossesse'] = 'pregnancy' in lib[title2slug[t1]]['aud']
    subject(pg, lina)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(400)
    t2 = tid(pg, 'home-recipe-title').inner_text()
    R['12_accueil_bebe_recette_bebe'] = 'baby' in lib[title2slug[t2]]['aud'] and 'smooth' in lib[title2slug[t2]]['tex']
    subject(pg, noe)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(400)
    t3 = tid(pg, 'home-recipe-title').inner_text()
    R['12_accueil_enfant_recette_enfant'] = 'child' in lib[title2slug[t3]]['aud']

    # ---- Recette personnelle (jamais présentée comme relue)
    go(pg, '/meals/new')
    tid(pg, 'new-title').fill('Riz aux carottes de la maison')
    for q, name in [('riz', 'riz'), ('carot', 'carotte')]:
        tid(pg, 'new-ing-search').fill(q); pg.wait_for_timeout(300)
        pg.get_by_text(name, exact=True).last.click(); pg.wait_for_timeout(300)
    pg.locator('input[aria-label="Quantité"]').nth(0).fill('150')
    pg.locator('input[aria-label="Quantité"]').nth(1).fill('2')
    tid(pg, 'new-steps').fill('Faites cuire le riz 12 minutes.\nRâpez les carottes et mélangez avec le riz.')
    tid(pg, 'new-save').click(); pg.wait_for_timeout(2000)
    t = T(pg)
    R['recette_personnelle_creee'] = '/meals/riz-aux-carottes' in pg.url and 'Recette personnelle' in t
    R['recette_personnelle_statut_brouillon'] = demo(pg, "s => s.tables.recipes.some(r => r.owner_id && r.title === 'Riz aux carottes de la maison' && r.status === 'ai_draft')")

    # ---- Administration : relecture (rôle de rédaction de démonstration), retrait
    go(pg, '/admin/recipes')
    R['admin_reserve_sans_role'] = 'Réservé à l’équipe éditoriale' in T(pg)
    tid(pg, 'demo-grant-editor').click(); pg.wait_for_timeout(1500)
    target = preg_list[0]
    tid(pg, f'admin-review-{target}').click(); pg.wait_for_timeout(1000)
    R['admin_marquer_relue'] = demo(pg, f"s => s.tables.recipe_overrides.some(o => o.recipe_id === 'lib-{target}' && o.row.status === 'reviewed') && s.tables.recipe_reviews.some(v => v.status === 'reviewed')")
    go(pg, f'/meals/{target}')
    R['admin_statut_relu_sur_la_fiche'] = 'Relu' in tid(pg, 'recipe-status').inner_text()
    pg.screenshot(path=f'{SHOTS}/rc_admin.png')

    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001 — le rapport JSON est toujours imprimé, l'exception compte comme erreur
        errs.append(f'exception: {str(e)[:300]}')
print(json.dumps({**R, 'erreurs': errs[:10]}, ensure_ascii=False, indent=1))
print('OK' if all(R.values()) and not errs else 'ÉCHEC', sum(R.values()), '/', len(R))
