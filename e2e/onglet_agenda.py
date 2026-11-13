"""
Agenda du foyer dans la navigation HOMI (13/11/2026) : plus d'onglet « Agenda » dans la barre ; on l'ouvre depuis
l'onglet Famille (accès direct « Agenda »), l'onglet Famille reste allumé, un bouton Retour ramène à Famille, et
l'ancienne adresse /calendar marche toujours.
  python3 e2e/spa_server.py dist 8822 &  puis  python3 e2e/onglet_agenda.py
Variables : NAV_URL (serveur), E2E_SHOTS (captures), PW_CHROMIUM (navigateur, ex. /opt/pw-browsers/chromium).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('PW_CHROMIUM') or None
R = {}; errs = []
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def sel(pg, name): return tid(pg, f'tab-{name}').get_attribute('aria-selected') == 'true'

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE); pg = b.new_page(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    R['onglets'] = [t.get_attribute('aria-label') for t in pg.locator('[role="tab"][data-testid^="tab-"]').all()]
    R['agenda_hors_de_la_barre'] = not has(pg, 'tab-agenda') and R['onglets'] == ['Accueil', 'Santé', 'Bébé', 'Famille', 'Communauté']
    # Famille → accès direct « Agenda »
    tid(pg, 'tab-household').click(); pg.wait_for_timeout(2000)
    R['famille_ouverte'] = pg.url.endswith('/household') and sel(pg, 'household')
    R['acces_direct_agenda'] = has(pg, 'hub-entry-agenda')
    tid(pg, 'hub-entry-agenda').click(); pg.wait_for_timeout(2500)
    body = pg.inner_text('body')
    R['ouvre_agenda'] = pg.url.endswith('/agenda') and 'Agenda' in body
    R['onglet_famille_reste_allume'] = sel(pg, 'household')
    R['bouton_retour'] = pg.get_by_role('button', name='Retour').filter(visible=True).count() >= 1
    R['creation_evenement'] = has(pg, 'calendar-add')
    pg.screenshot(path=f'{SHOTS}/agenda-ecran.png')
    tid(pg, 'calendar-add').click(); pg.wait_for_timeout(1200)
    R['fenetre_creation'] = 'Nouvel événement' in pg.inner_text('body')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    pg.get_by_role('button', name='Retour').filter(visible=True).first.click(); pg.wait_for_timeout(1800)
    R['retour_vers_famille'] = pg.url.endswith('/household')
    # lien direct sans historique : Retour mène à l'onglet parent (Famille), pas à l'accueil
    pg.goto(B + '/agenda'); pg.wait_for_timeout(2500)
    pg.get_by_role('button', name='Retour').filter(visible=True).first.click(); pg.wait_for_timeout(1800)
    R['lien_direct_retour_famille'] = pg.url.endswith('/household')
    # l'ancienne adresse marche toujours
    pg.goto(B + '/calendar'); pg.wait_for_timeout(2500)
    R['ancienne_adresse_calendar'] = 'Agenda' in pg.inner_text('body')
    R['erreurs'] = errs
    b.close()
    print(json.dumps(R, ensure_ascii=False, indent=1))
