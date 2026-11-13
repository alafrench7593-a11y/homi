"""
Courses et stocks (15/11/2026, phase 6) — scénarios A (complet, étape 8 comprise) et F dans la démo web.
Voir HOMI_SHOPPING_STOCKS_SPEC.md. La démonstration n'a qu'un compte : « Voir comme … » (démo seulement) passe d'une
personne du foyer à l'autre ; le serveur émulé applique les mêmes règles que 20261115000200_courses_stocks.sql.

  A. La mère suit le stock « Couches taille 4 » → mission « Acheter des couches taille 4 aujourd'hui » pour le
     conjoint → il accepte → l'article est dans la liste, RELIÉ au stock → « C'est terminé » → article coché, stock
     « acheté, à valider » (quantité inchangée) → (étape 8) validation de l'achat → stock de couches actualisé.
  F. Stock de croquettes au seuil → SUGGESTION (aucune mission) → confirmation → mission pour le responsable →
     acceptée → article dans les courses → le destinataire coche l'article (mission terminée par la coche) →
     validation de l'achat → stock mis à jour ; « achat confirmé » publié pour le futur budget.

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx expo export --platform web --clear --output-dir /tmp/homi-stk/dist
  python3 e2e/spa_server.py /tmp/homi-stk/dist 8871 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8871 E2E_SHOTS=/tmp/homi-stk/shots python3 e2e/courses_stocks_scenarios.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8871')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-stk/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TITLE = "Acheter des couches taille 4 aujourd’hui"


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    pg.wait_for_timeout(700)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def demo_state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def table(pg, name):
    return demo_state(pg)['tables'].get(name, [])


def switch(pg):
    tid(pg, 'mission-demo-switch').click()
    pg.wait_for_timeout(2500)


def top(pg, t):
    if tid(pg, t).count():
        tid(pg, t).scroll_into_view_if_needed()
        pg.wait_for_timeout(300)


def fill(pg, t, v):
    tid(pg, t).fill(v)
    pg.wait_for_timeout(150)


def add_stock(pg, label, cat, qty, unit, threshold, size=None, resp=None):
    pg.goto(B + '/family/stocks/new'); pg.wait_for_timeout(3000)
    fill(pg, 'stock-label', label)
    tid(pg, f'stock-cat-{cat}').click()
    if size:
        fill(pg, 'stock-size', size)
    fill(pg, 'stock-qty', qty)
    fill(pg, 'stock-threshold', threshold)
    tid(pg, f'stock-unit-{unit}').click()
    if resp:
        tid(pg, f'stock-resp-{resp}').click()
    tid(pg, 'stock-save').click(); pg.wait_for_timeout(2500)
    return next(s for s in table(pg, 'household_stocks') if s['label'] == label)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))

    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    mother = demo_state(pg)['session']['userId']

    # ------------------------------------------------------------ points d'entrée
    pg.goto(B + '/household'); pg.wait_for_timeout(3500)
    R['entree_famille_courses_stocks'] = tid(pg, 'hub-entry-shopping').count() > 0 and tid(pg, 'hub-entry-stocks').count() > 0
    shot(pg, 'A00-famille-entrees')
    pg.goto(B + '/baby'); pg.wait_for_timeout(3500)
    R['entree_bebe_stocks'] = tid(pg, 'hub-entry-baby-stocks').count() > 0
    shot(pg, 'A00b-bebe-entree-stocks')
    # Le conjoint rejoint le foyer de démonstration, puis retour côté mère
    pg.goto(B + '/family/stocks'); pg.wait_for_timeout(3000)
    switch(pg)
    partner = demo_state(pg)['session']['userId']
    switch(pg)
    R['retour_mere'] = demo_state(pg)['session']['userId'] == mother and partner != mother

    # ============================================================ Scénario A
    couches = add_stock(pg, 'Couches', 'diapers', '20', 'u', '10', size='taille 4')
    R['A_stock_couches_cree'] = couches['restock_state'] == 'ok' and float(couches['qty_estimate']) == 20
    pg.goto(B + '/family/stocks/baby'); pg.wait_for_timeout(3000)
    R['A_stocks_bebe_liste'] = tid(pg, f"stock-{couches['id']}").count() > 0
    shot(pg, 'A01-stocks-bebe')
    pg.goto(B + '/family/missions/new'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-tpl-diapers').click(); pg.wait_for_timeout(500)
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)  # création en étapes (16/11/2026)
    tid(pg, 'mission-who-coparent').click(); pg.wait_for_timeout(300)
    shot(pg, 'A02-creation-mission')
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    tid(pg, 'mission-send').click(); pg.wait_for_timeout(3500)
    mission_a = pg.url.rstrip('/').split('/')[-1]
    R['A_mission_envoyee'] = tid(pg, 'mission-state-pending').count() > 0
    R['A_demandee_par_vous'] = pg.get_by_text('Demandée par vous').count() > 0
    shot(pg, 'A03-envoyee')
    switch(pg)
    R['A_notification_conjoint'] = any(n['title'] == 'Nouvelle mission : ' + TITLE and n['user_id'] == partner for n in table(pg, 'notifications'))
    pg.goto(B + f'/family/missions/{mission_a}'); pg.wait_for_timeout(3000)
    R['A_pour_vous_minuscule'] = pg.get_by_text('Pour vous', exact=True).count() > 0 and pg.get_by_text('Pour Vous', exact=True).count() == 0
    shot(pg, 'A04-conjoint-detail-pour-vous')
    tid(pg, 'mission-reply-accept').click(); pg.wait_for_timeout(2500)
    items = [i for i in table(pg, 'shopping_items') if i['label'] == 'Couches taille 4']
    R['A_article_unique_relie_au_stock'] = len(items) == 1 and items[0].get('stock_id') == couches['id'] and not items[0]['checked']
    shot(pg, 'A05-acceptee')
    pg.goto(B + '/meals/shopping'); pg.wait_for_timeout(3500)
    R['A_liste_courses'] = pg.get_by_text('Couches taille 4').count() > 0
    shot(pg, 'A06-liste-de-courses')
    pg.goto(B + f'/family/missions/{mission_a}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-reply-complete').click(); pg.wait_for_timeout(2500)
    items = [i for i in table(pg, 'shopping_items') if i['label'] == 'Couches taille 4']
    st = next(s for s in table(pg, 'household_stocks') if s['id'] == couches['id'])
    R['A_terminee_article_coche'] = tid(pg, 'mission-state-done').count() > 0 and items[0]['checked']
    R['A_stock_a_valider_quantite_inchangee'] = st['restock_state'] == 'bought' and float(st['qty_estimate']) == 20
    done_events = [e for e in table(pg, 'family_task_events') if e['task_id'] == mission_a and e['kind'] == 'done']
    R['A_anti_boucle_une_seule_fin'] = len(done_events) == 1
    shot(pg, 'A07-terminee')
    switch(pg)
    R['A_confirmation_mere'] = any(n['title'] == 'Mission terminée : ' + TITLE and n['user_id'] == mother for n in table(pg, 'notifications'))
    # Étape 8 : la mère valide l'achat → stock de couches actualisé
    pg.goto(B + f"/family/stocks/{couches['id']}"); pg.wait_for_timeout(3000)
    R['A8_carte_validation'] = tid(pg, f"purchase-{couches['id']}").count() > 0
    shot(pg, 'A08a-stock-achat-a-valider')
    fill(pg, 'purchase-qty', '52')
    tid(pg, 'purchase-validate').click(); pg.wait_for_timeout(2500)
    st = next(s for s in table(pg, 'household_stocks') if s['id'] == couches['id'])
    R['A8_stock_couches_actualise'] = float(st['qty_estimate']) == 72 and st['restock_state'] == 'ok'
    R['A8_affiche'] = '72 unités' in (tid(pg, 'stock-detail-qty').inner_text() if tid(pg, 'stock-detail-qty').count() else '')
    top(pg, 'stock-detail')
    shot(pg, 'A08b-stock-couches-actualise')

    # ============================================================ Scénario F
    croq = add_stock(pg, 'Croquettes', 'pet_food', '5', 'sac', '2', resp=partner)
    R['F_stock_cree_au_dessus_du_seuil'] = croq['restock_state'] == 'ok'
    pg.goto(B + f"/family/stocks/{croq['id']}"); pg.wait_for_timeout(3000)
    tid(pg, 'stock-edit').click(); pg.wait_for_timeout(800)
    fill(pg, 'stock-qty', '2')
    tid(pg, 'stock-save').click(); pg.wait_for_timeout(2500)
    st = next(s for s in table(pg, 'household_stocks') if s['id'] == croq['id'])
    R['F_seuil_atteint_suggestion'] = st['restock_state'] == 'suggested'
    R['F_aucune_mission_automatique'] = not any(t.get('product_label') == 'Croquettes' for t in table(pg, 'family_tasks'))
    R['F_carte_suggestion'] = tid(pg, f"restock-{croq['id']}").count() > 0
    top(pg, f"restock-{croq['id']}")
    shot(pg, 'F01-suggestion-croquettes')
    pg.goto(B + '/family/stocks'); pg.wait_for_timeout(3000)
    R['F_mis_en_avant_liste'] = tid(pg, 'stocks-attention').count() > 0 and tid(pg, f"restock-confirm-{croq['id']}").count() > 0
    shot(pg, 'F02-stocks-a-prevoir')
    tid(pg, f"restock-confirm-{croq['id']}").click(); pg.wait_for_timeout(3500)
    tasks = [t for t in table(pg, 'family_tasks') if t.get('product_label') == 'Croquettes']
    mission_f = tasks[0]['id'] if tasks else ''
    R['F_confirmation_mission_attribuee'] = len(tasks) == 1 and tasks[0]['assignee_id'] == partner and tasks[0]['mission_state'] == 'pending' and tasks[0]['category'] == 'pets'
    R['F_detail_mission_ouvert'] = mission_f != '' and mission_f in pg.url
    shot(pg, 'F03-mission-creee')
    switch(pg)
    pg.goto(B + f'/family/missions/{mission_f}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-reply-accept').click(); pg.wait_for_timeout(2500)
    items = [i for i in table(pg, 'shopping_items') if i['label'] == 'Croquettes']
    R['F_article_dans_les_courses'] = len(items) == 1 and items[0].get('stock_id') == croq['id']
    pg.goto(B + '/meals/shopping'); pg.wait_for_timeout(3500)
    shot(pg, 'F04-courses-croquettes')
    tid(pg, 'shop-Croquettes').click(); pg.wait_for_timeout(2500)
    t = next(x for x in table(pg, 'family_tasks') if x['id'] == mission_f)
    st = next(s for s in table(pg, 'household_stocks') if s['id'] == croq['id'])
    R['F_coche_destinataire_termine_mission'] = t['mission_state'] == 'done'
    R['F_quantite_inchangee_a_la_coche'] = st['restock_state'] == 'bought' and float(st['qty_estimate']) == 2
    shot(pg, 'F05-coche-achat')
    pg.goto(B + f"/family/stocks/{croq['id']}"); pg.wait_for_timeout(3000)
    shot(pg, 'F06-achat-a-valider')
    fill(pg, 'purchase-qty', '3')
    tid(pg, 'purchase-validate').click(); pg.wait_for_timeout(2500)
    st = next(s for s in table(pg, 'household_stocks') if s['id'] == croq['id'])
    R['F_stock_mis_a_jour_apres_validation'] = float(st['qty_estimate']) == 5 and st['restock_state'] == 'ok'
    ev = [e for e in table(pg, 'household_events') if e['type'] == 'stock.purchase_confirmed' and e['entity_id'] == croq['id']]
    R['F_evenement_achat_confirme_budget'] = len(ev) == 1 and ev[0]['status'] == 'pending'
    R['F_historique'] = 'Achat validé' in (tid(pg, 'stock-history').inner_text() if tid(pg, 'stock-history').count() else '')
    top(pg, 'stock-detail')
    shot(pg, 'F07-stock-mis-a-jour')
    # Doublon : « Lait » ajouté deux fois → alerte, fusion
    pg.goto(B + '/meals/shopping'); pg.wait_for_timeout(3000)
    fill(pg, 'shop-add-label', 'Lait'); tid(pg, 'shop-add').click(); pg.wait_for_timeout(1500)
    fill(pg, 'shop-add-label', 'lait'); tid(pg, 'shop-add').click(); pg.wait_for_timeout(1500)
    R['doublon_alerte'] = tid(pg, 'shop-dup-merge').count() > 0
    shot(pg, 'D01-doublon-alerte')
    tid(pg, 'shop-dup-merge').click(); pg.wait_for_timeout(1500)
    lait = [i for i in table(pg, 'shopping_items') if i['label'].lower() == 'lait']
    R['doublon_fusionne'] = len(lait) == 1 and float(lait[0].get('qty') or 0) == 2
    R['historique_courses'] = tid(pg, 'shop-history').count() > 0
    shot(pg, 'D02-liste-historique')
    # Dock : « Ajouter aux courses »
    pg.goto(B + '/household'); pg.wait_for_timeout(3000)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1200)
    R['dock_ajouter_aux_courses'] = pg.get_by_role('button', name=re.compile('Ajouter aux courses')).count() > 0
    shot(pg, 'D03-dock')
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs') and not errs else 1)
