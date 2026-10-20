"""
Nutrition 0–10 ans, produits enfants et sources, de bout en bout (version web de démonstration, sans compte) :
score visible, classements, brouillons IA invisibles des parents puis visibles avec le rôle de rédaction, import d'un lot,
catalogue de produits vide puis ajout d'un produit FICTIF de démonstration (signalé), comparateur, sources et lectures.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/nutrition.py
"""
import glob, json, os
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
HERE = os.path.dirname(os.path.abspath(__file__))
DRAFTS = [d for f in sorted(glob.glob(os.path.join(HERE, '..', 'src', 'content', 'recipes', 'drafts', 'lot-*.json'))) for d in json.load(open(f))]
DRAFT_SLUGS = {d['slug'] for d in DRAFTS}


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def go(pg, path, wait=2200):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(900)


def listed(pg):
    pg.mouse.wheel(0, 20000); pg.wait_for_timeout(300)
    return pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"recipe-\"]')].map(e => e.getAttribute('data-testid').slice(7))")


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    R['brouillons_dans_le_depot'] = len(DRAFTS) >= 499

    # ---- Liste des recettes (profil de Noé, ~6 ans) : score visible, aucun brouillon IA pour un parent
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    subject(pg, noe)
    go(pg, '/meals', 3000)
    slugs = listed(pg)
    R['liste_score_visible'] = pg.locator('[data-testid^="score-"]').count() > 0
    R['liste_sans_brouillon_ia'] = bool(slugs) and not (set(slugs) & DRAFT_SLUGS)
    first = next(s for s in slugs if s not in ('status', 'sources', 'allergens', 'precautions', 'score', 'cost') and not s.startswith('score'))
    go(pg, f'/meals/{first}')
    R['fiche_score_sur_100'] = has(pg, 'recipe-score') and '/100' in tid(pg, 'recipe-score').inner_text()
    R['fiche_cout_non_invente'] = has(pg, 'recipe-cost') and 'prix non disponible' in tid(pg, 'recipe-cost').inner_text()
    R['fiche_score_pas_nutriscore'] = 'Nutri-Score' in T(pg)  # la mention « pas le Nutri-Score officiel » est affichée
    pg.screenshot(path=f'{SHOTS}/nu_fiche.png')

    # ---- Classements
    go(pg, '/meals/rankings')
    R['classements_liste'] = has(pg, 'rankings-list') and pg.locator('[data-testid="rankings-list"] [data-testid^="recipe-"]').count() > 0
    for label in ['Économiques', 'Rapides', 'Équilibrées']:
        pg.get_by_text(label, exact=True).first.click(); pg.wait_for_timeout(500)
    R['classements_onglets'] = has(pg, 'rankings-list')
    pg.screenshot(path=f'{SHOTS}/nu_classements.png')

    # ---- Brouillon IA : introuvable pour un parent
    draft = DRAFTS[0]['slug']
    go(pg, f'/meals/{draft}')
    R['brouillon_invisible_parent'] = not has(pg, 'recipe-score')

    # ---- Produits : catalogue vide (aucun produit inventé)
    go(pg, '/products')
    R['produits_catalogue_vide'] = has(pg, 'products-empty')

    # ---- Sources et lectures
    go(pg, '/sources')
    R['sources_liste'] = has(pg, 'sources-list') and has(pg, 'resource-ameli-biberon') and 'Ouvrir sur le site d’origine' in T(pg)
    R['sources_dates'] = 'consulté le' in T(pg)
    pg.get_by_text('Recettes familiales', exact=True).first.click(); pg.wait_for_timeout(500)
    R['sources_recettes_familiales_vide_explique'] = has(pg, 'sources-empty') and 'n’a encore été vérifié' in T(pg)
    pg.screenshot(path=f'{SHOTS}/nu_sources.png')

    # ---- Rôle de rédaction (démonstration)
    go(pg, '/admin/recipes')
    tid(pg, 'demo-grant-editor').click(); pg.wait_for_timeout(1500)
    go(pg, f'/meals/{draft}')
    R['brouillon_visible_equipe'] = has(pg, 'recipe-score') and 'Brouillon' in T(pg)

    # ---- Import d'un lot JSON
    d = dict(DRAFTS[0]); d['slug'] = 'import-e2e-puree'; d['title'] = 'Purée importée de test'
    bad = dict(DRAFTS[0]); bad['slug'] = 'import-e2e-ko'; bad['ingredients'] = [['licorne', 1, 'u']]
    go(pg, '/admin/import-recipes')
    tid(pg, 'imp-text').fill(json.dumps([d, bad, DRAFTS[1]], ensure_ascii=False))
    tid(pg, 'imp-check').click(); pg.wait_for_timeout(800)
    s = tid(pg, 'imp-summary').inner_text()
    R['import_verification'] = '1 valide' in s and '2 à corriger' in s and 'hors dictionnaire' in T(pg) and 'Identifiant déjà utilisé' in T(pg)
    tid(pg, 'imp-import').click(); pg.wait_for_timeout(2000)
    R['import_brouillon_enregistre'] = demo(pg, "s => s.tables.recipes.some(r => r.slug === 'import-e2e-puree' && r.status === 'ai_draft' && !r.owner_id)")
    go(pg, '/meals/import-e2e-puree')
    R['import_visible_equipe'] = has(pg, 'recipe-score')
    pg.screenshot(path=f'{SHOTS}/nu_import.png')

    # ---- Produits : ajout par code-barres (démonstration : produit fictif signalé), publication, comparateur
    go(pg, '/admin/products')
    R['admin_produits_demo_signalee'] = 'produit fictif' in T(pg)
    for code in ['0000000000062', '0000000000086']:
        tid(pg, 'product-barcode').fill(code)
        tid(pg, 'product-add').click(); pg.wait_for_timeout(1500)
    prods = demo(pg, "s => s.tables.kid_products.map(p => ({ id: p.id, barcode: p.barcode, demo: !!p.is_demo, status: p.status }))")
    R['produits_ajoutes_fictifs_brouillon'] = len(prods) == 2 and all(p['demo'] and p['status'] == 'draft' for p in prods)
    for code in ['0000000000062', '0000000000086']:
        tid(pg, f'product-edit-{code}').click(); pg.wait_for_timeout(500)
        tid(pg, 'product-publish').click(); pg.wait_for_timeout(700)
        R.setdefault('publication_exige_verificateur', demo(pg, f"s => s.tables.kid_products.find(p => p.barcode === '{code}').status === 'draft'"))
        pg.locator('input[aria-label="Vérifié par"]').filter(visible=True).first.fill('Équipe test')
        tid(pg, 'product-publish').click(); pg.wait_for_timeout(900)
        pg.get_by_text('Annuler', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(400)
    R['produits_publies'] = demo(pg, "s => s.tables.kid_products.every(p => p.status === 'published')")
    go(pg, '/products')
    R['produits_liste'] = has(pg, 'product-0000000000062') and has(pg, 'product-0000000000086')
    pid = next(p['id'] for p in prods if p['barcode'] == '0000000000062')
    go(pg, f'/products/{pid}')
    t = T(pg)
    R['fiche_produit_fictif_signale'] = 'Produit fictif' in t
    R['fiche_produit_prix_non_invente'] = has(pg, 'product-prices') and 'Aucun prix' in tid(pg, 'product-prices').inner_text()
    R['fiche_produit_pas_un_traitement'] = has(pg, 'product-precautions')
    pg.screenshot(path=f'{SHOTS}/nu_produit.png')
    go(pg, '/products')
    tid(pg, 'compare-0000000000062').click(); tid(pg, 'compare-0000000000086').click(); pg.wait_for_timeout(300)
    tid(pg, 'products-compare').click(); pg.wait_for_timeout(1500)
    R['comparateur'] = has(pg, 'compare-table')
    pg.screenshot(path=f'{SHOTS}/nu_compare.png')

    # ---- Sources : ajout par l'équipe (brouillon puis publication)
    go(pg, '/admin/resources')
    tid(pg, 'res-slug').fill('test-e2e-source')
    tid(pg, 'res-title').fill('Page de test vérifiée')
    tid(pg, 'res-publisher').fill('Éditeur de test')
    tid(pg, 'res-description').fill('Résumé rédigé par l’équipe pour le test.')
    tid(pg, 'res-url').fill('https://exemple.fr/page')
    tid(pg, 'res-save').click(); pg.wait_for_timeout(1000)
    R['source_ajoutee_brouillon'] = demo(pg, "s => s.tables.external_resources.some(r => r.slug === 'test-e2e-source' && r.status === 'draft')")
    tid(pg, 'res-publish-test-e2e-source').click(); pg.wait_for_timeout(900)
    go(pg, '/sources')
    R['source_publiee_visible'] = has(pg, 'resource-test-e2e-source')
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'erreurs': errs[:10]}, ensure_ascii=False, indent=1))
print('OK' if all(R.values()) and not errs else 'ÉCHEC', sum(R.values()), '/', len(R))
