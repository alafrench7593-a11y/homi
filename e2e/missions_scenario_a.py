"""
Missions familiales — scénario A complet dans la démo web (14/11/2026), voir HOMI_COUPLE_MISSIONS.md :
une mère crée « Acheter des couches taille 4 aujourd'hui » pour son conjoint → il la voit dans « Reçues » avec la
notification « Nouvelle mission : … » → « J'accepte » → l'article « Couches taille 4 » est dans la liste de courses →
« C'est terminé » → l'article est coché → la mère voit « Terminée » et la confirmation dans ses notifications.
La démonstration n'a qu'un compte : « Voir comme … » (démo seulement) passe d'une personne du foyer à l'autre ;
le serveur émulé applique les mêmes règles (seul le destinataire répond).
Usage :
  npx expo export --platform web --clear --output-dir /tmp/homi-mis/dist && python3 e2e/spa_server.py /tmp/homi-mis/dist 8861 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8861 E2E_SHOTS=/tmp/homi-mis/shots python3 e2e/missions_scenario_a.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8861')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-mis/shots')
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


def switch(pg):
    tid(pg, 'mission-demo-switch').click()
    pg.wait_for_timeout(2500)


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

    # 0. Point d'entrée : onglet Famille → accès direct « Missions »
    pg.goto(B + '/household'); pg.wait_for_timeout(3500)
    R['entree_famille'] = tid(pg, 'hub-entry-missions').count() > 0
    shot(pg, '00-famille-hub')
    tid(pg, 'hub-entry-missions').click(); pg.wait_for_timeout(3000)
    R['ecran_missions'] = pg.url.rstrip('/').endswith('/family/missions')
    # Le conjoint rejoint le foyer de démonstration, puis on revient du côté de la mère
    switch(pg)
    R['conjoint_cree'] = demo_state(pg)['session']['userId'] != mother
    switch(pg)
    R['retour_mere'] = demo_state(pg)['session']['userId'] == mother
    shot(pg, '01-missions-vide-mere')

    # 1. Création (modèle neutre « couches »), destinataire : le conjoint
    pg.goto(B + '/family/missions/new'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-tpl-diapers').click(); pg.wait_for_timeout(500)
    R['modele_prerempli'] = pg.locator('[data-testid="mission-title"]').filter(visible=True).first.input_value() == TITLE
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    tid(pg, 'mission-who-coparent').click(); pg.wait_for_timeout(300)
    shot(pg, '02-creation-mission')
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    tid(pg, 'mission-send').click(); pg.wait_for_timeout(3500)
    R['detail_apres_envoi'] = '/family/missions/' in pg.url and tid(pg, 'mission-state-pending').count() > 0
    mission_id = pg.url.rstrip('/').split('/')[-1]
    R['creatrice_ne_peut_pas_accepter'] = tid(pg, 'mission-reply-accept').count() == 0
    shot(pg, '03-envoyee-a-accepter')

    # 2. Côté conjoint : notification reçue, mission dans « Reçues », « J'accepte »
    switch(pg)
    s = demo_state(pg)
    partner = s['session']['userId']
    notes = [n for n in s['tables'].get('notifications', []) if n['user_id'] == partner]
    R['notification_conjoint'] = any(n['title'] == 'Nouvelle mission : ' + TITLE and n['deep_link'] == f'/family/missions/{mission_id}' for n in notes)
    pg.goto(B + '/family/missions'); pg.wait_for_timeout(3000)
    R['recue_par_conjoint'] = tid(pg, f'mission-{mission_id}').count() > 0
    R['prenom_demandeuse_liste'] = 'Camille vous demande' in (tid(pg, f'mission-who-line-{mission_id}').inner_text() if tid(pg, f'mission-who-line-{mission_id}').count() else '')
    shot(pg, '04-conjoint-recues')
    tid(pg, f'mission-{mission_id}').click(); pg.wait_for_timeout(3000)
    R['prenoms_detail'] = 'Demandée par Camille' in (tid(pg, 'mission-from').inner_text() if tid(pg, 'mission-from').count() else '')
    R['reponses_rapides'] = all(tid(pg, f'mission-reply-{a}').count() > 0 for a in ['accept', 'start', 'complete', 'postpone', 'ask', 'decline'])
    shot(pg, '05-conjoint-detail-reponses')
    tid(pg, 'mission-reply-accept').click(); pg.wait_for_timeout(2500)
    R['acceptee'] = tid(pg, 'mission-state-accepted').count() > 0
    R['article_dans_courses_detail'] = 'Ajouté à la liste de courses' in (tid(pg, 'mission-shopping-state').inner_text() if tid(pg, 'mission-shopping-state').count() else '')
    items = [i for i in demo_state(pg)['tables'].get('shopping_items', []) if i['label'] == 'Couches taille 4']
    R['article_unique_non_coche'] = len(items) == 1 and not items[0]['checked']
    shot(pg, '06-acceptee-article-ajoute')
    pg.goto(B + '/meals/shopping'); pg.wait_for_timeout(3500)
    R['liste_courses_affiche_article'] = pg.get_by_text('Couches taille 4').count() > 0
    shot(pg, '07-liste-de-courses')

    # 3. Terminé → article coché
    pg.goto(B + f'/family/missions/{mission_id}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-reply-complete').click(); pg.wait_for_timeout(2500)
    R['terminee'] = tid(pg, 'mission-state-done').count() > 0
    items = [i for i in demo_state(pg)['tables'].get('shopping_items', []) if i['label'] == 'Couches taille 4']
    R['article_coche'] = len(items) == 1 and items[0]['checked']
    shot(pg, '08-terminee-conjoint')

    # 4. Côté mère : statut « Terminée », historique complet, confirmation reçue
    switch(pg)
    s = demo_state(pg)
    mine = [n['title'] for n in s['tables'].get('notifications', []) if n['user_id'] == mother]
    R['confirmation_mere'] = ('Mission acceptée : ' + TITLE) in mine and ('Mission terminée : ' + TITLE) in mine
    pg.goto(B + f'/family/missions/{mission_id}'); pg.wait_for_timeout(3000)
    R['mere_voit_terminee'] = tid(pg, 'mission-state-done').count() > 0
    hist = tid(pg, 'mission-history').inner_text() if tid(pg, 'mission-history').count() else ''
    R['historique'] = all(w in hist for w in ['Mission demandée', 'Acceptée', 'Terminée'])
    shot(pg, '09-mere-detail-terminee')
    pg.goto(B + '/family/missions?tab=sent'); pg.wait_for_timeout(3000)
    shot(pg, '10-mere-envoyees')
    pg.goto(B + '/notifications'); pg.wait_for_timeout(3000)
    R['centre_notifications'] = pg.get_by_text(re.compile('Mission terminée')).count() > 0
    shot(pg, '11-mere-notifications')
    pg.goto(B + '/family/missions/responsibilities'); pg.wait_for_timeout(3000)
    R['responsabilites'] = tid(pg, 'resp-shopping').count() > 0 and tid(pg, 'resp-pets').count() > 0
    shot(pg, '12-responsabilites')
    # Dock : « Nouvelle mission » dans l'ajout rapide
    pg.goto(B + '/household'); pg.wait_for_timeout(3000)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1200)
    R['dock_nouvelle_mission'] = pg.get_by_role('button', name=re.compile('Nouvelle mission')).count() > 0
    shot(pg, '13-dock-ajout-rapide')
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs') and not errs else 1)
