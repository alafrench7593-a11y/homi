"""
Accueil — « Aujourd'hui dans le foyer » sur petit écran (320 × 568), démo web + Premium (13/11/2026).
Vérifie : la section en tête (ce qui m'attend mis en avant, responsable nommé, statut en toutes lettres), une seule
recherche d'outils sur l'accueil, l'ajout d'une tâche depuis l'accueil puis sa validation (statut « Fait »), la validation
de la mission qui m'attend (statut « Terminée » côté serveur émulé), l'absence de bouton sur la mission de quelqu'un
d'autre, la création d'une mission via « Confier une mission » et son affichage « À accepter » chez la co-parente.
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-home/dist
  python3 e2e/spa_server.py /tmp/homi-home/dist 8891 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8891 E2E_SHOTS=/tmp/homi-home/e2e python3 e2e/home_today.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8891')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-home/e2e')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
NEW_TASK = 'Arroser les plantes du balcon'
MILK = 'Acheter du lait avant 18 h'


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def demo_state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def task_by_title(pg, title):
    return next((t for t in demo_state(pg)['tables'].get('family_tasks', []) if t['title'] == title), None)


def row_status(pg, task_id):
    loc = pg.locator(f'[data-testid="today-status-{task_id}"]')
    return loc.first.inner_text() if loc.count() else ''


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))

    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.goto(B + '/'); pg.wait_for_timeout(4000)
    me = demo_state(pg)['session']['userId']

    # 1. La section est en tête, visible sans défiler, avec ce qui m'attend mis en avant
    sec = tid(pg, 'home-today')
    box = sec.bounding_box() if sec.count() else None
    R['section_visible_sans_defiler'] = bool(box) and box['y'] < 568 * 0.75
    R['titre'] = pg.get_by_text('Aujourd’hui dans le foyer').count() > 0
    R['resume'] = 'à faire' in (tid(pg, 'home-today-summary').inner_text() if tid(pg, 'home-today-summary').count() else '')
    milk = task_by_title(pg, MILK)
    R['mission_qui_m_attend_en_premier'] = bool(milk) and tid(pg, 'today-emphasis').count() > 0 and MILK in tid(pg, 'today-emphasis').inner_text()
    R['statut_en_toutes_lettres'] = bool(milk) and 'À accepter' in row_status(pg, milk['id'])
    R['responsable_nomme'] = bool(milk) and 'Camille' in tid(pg, f'today-open-{milk["id"]}').inner_text()
    R['une_seule_recherche_outils'] = pg.locator('[data-testid="home-tool-search"]').count() == 1 and pg.locator('[data-testid="all-tools"]').count() == 0
    shot(pg, '01-accueil-320')

    # 2. La mission de quelqu'un d'autre : aucun bouton pour la terminer
    pickup = next((t for t in demo_state(pg)['tables']['family_tasks'] if t.get('mission_state') == 'accepted' and t['assignee_id'] != me), None)
    R['mission_d_un_autre_sans_bouton'] = bool(pickup) and pg.locator(f'[data-testid="today-row-{pickup["id"]}"]').count() == 1 \
        and pg.locator(f'[data-testid="today-complete-{pickup["id"]}"]').count() == 0

    # 3. Ajouter une tâche depuis l'accueil (ajout rapide existant), puis la terminer
    tid(pg, 'home-today-add').click(); pg.wait_for_timeout(1200)
    R['feuille_ajout'] = tid(pg, 'today-add-sheet').count() > 0 and tid(pg, 'today-add-mission').count() > 0
    tid(pg, 'today-add-title').fill(NEW_TASK)
    shot(pg, '02-ajout')
    tid(pg, 'today-add-submit').click(); pg.wait_for_timeout(2500)
    created = task_by_title(pg, NEW_TASK)
    R['tache_creee_pour_moi'] = bool(created) and created['assignee_id'] == me and created['status'] == 'todo'
    R['tache_visible_a_faire'] = bool(created) and 'À faire' in row_status(pg, created['id'])
    btn = pg.locator(f'[data-testid="today-complete-{created["id"]}"]').filter(visible=True).first if created else None
    if btn is not None and btn.count():
        btn.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
        bb = btn.bounding_box()
        R['cible_bouton_48px'] = bool(bb) and bb['height'] >= 48 and tid(pg, 'home-today-add').bounding_box()['height'] >= 48
        shot(pg, '03-avant-terminer')
        btn.click(); pg.wait_for_timeout(350)
        shot(pg, '04-validation-animee')
        pg.wait_for_timeout(2000)
    after = task_by_title(pg, NEW_TASK)
    R['tache_terminee_serveur'] = bool(after) and after['status'] == 'done' and after['done_by'] == me
    R['tache_statut_fait'] = bool(after) and 'Fait' in row_status(pg, after['id'])
    shot(pg, '05-tache-faite')

    # 4. Terminer la mission qui m'attend (mission_respond « complete »)
    tid(pg, f'today-complete-{milk["id"]}').scroll_into_view_if_needed()
    tid(pg, f'today-complete-{milk["id"]}').click(); pg.wait_for_timeout(2600)
    m2 = task_by_title(pg, MILK)
    R['mission_terminee_serveur'] = bool(m2) and m2['mission_state'] == 'done' and m2['status'] == 'done'
    R['mission_statut_terminee'] = 'Terminée' in row_status(pg, milk['id'])
    shot(pg, '06-mission-terminee')

    # 5. Créer une mission (écran existant) pour la co-parente ; elle apparaît « À accepter » sans bouton pour moi
    tid(pg, 'home-today-add').scroll_into_view_if_needed()
    tid(pg, 'home-today-add').click(); pg.wait_for_timeout(1200)
    tid(pg, 'today-add-mission').click(); pg.wait_for_timeout(3000)
    R['ecran_nouvelle_mission'] = '/family/missions/new' in pg.url
    tid(pg, 'mission-tpl-laundry').click(); pg.wait_for_timeout(300)
    tid(pg, 'mission-who-coparent').click(); pg.wait_for_timeout(300)
    tid(pg, 'mission-date-today').click(); pg.wait_for_timeout(300)
    tid(pg, 'mission-send').click(); pg.wait_for_timeout(3000)
    sent = next((t for t in demo_state(pg)['tables']['family_tasks'] if t.get('mission_state') == 'pending' and t['created_by'] == me), None)
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    R['mission_creee_visible'] = bool(sent) and pg.locator(f'[data-testid="today-row-{sent["id"]}"]').count() == 1
    R['mission_creee_a_accepter'] = bool(sent) and 'À accepter' in row_status(pg, sent['id'])
    R['mission_creee_sans_bouton_pour_moi'] = bool(sent) and pg.locator(f'[data-testid="today-complete-{sent["id"]}"]').count() == 0
    shot(pg, '07-accueil-apres')
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = all(v for k, v in R.items() if k != 'erreurs') and not errs
sys.exit(0 if ok else 1)
