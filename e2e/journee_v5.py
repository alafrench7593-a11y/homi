"""
Journée v5 « Lumière corail » (16/11/2026) : accueil, agenda familial, résumé du soir, biberons, notifications.
Démo web + Premium actif. Deux usages :
  - captures (clair / sombre, 390 × 844 et 320 × 568) : MODE=shots SHOTS=/tmp/v5b/shots/apres
  - parcours (défaut) : « J'accepte » sur la demande en tête, « Fait » dans l'agenda, ouverture d'un événement,
    sélection d'une date, liens de l'accueil ; vérifie l'état réel de la démo (localStorage).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/v5b/web
  python3 e2e/spa_server.py /tmp/v5b/web 8982 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8982 python3 e2e/journee_v5.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8982')
MODE = os.environ.get('MODE', 'test')
SHOTS = os.environ.get('SHOTS', '/tmp/v5b/shots/apres')
EXE = os.environ.get('PW_CHROMIUM') or '/opt/pw-browsers/chromium'
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [None])[0]
os.makedirs(SHOTS, exist_ok=True)

PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual',
    entitlement: 'HOMI_PREMIUM', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""
# La démo n'a aucune notification : trois rappels réalistes (non lu, rappel produit, lu) pour voir la liste
NOTIFS = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  const at = (min) => new Date(Date.now() - min * 60000).toISOString();
  s.tables.notifications = (s.tables.notifications || []).filter(x => !String(x.id).startsWith('e2e-v5-'));
  s.tables.notifications.push(
    { id: 'e2e-v5-1', user_id: me, category: 'reminder', title: 'Rappel biberon · Lina', body: 'Le prochain biberon était prévu à 18 h 30.', deep_link: '/bottle', payload: {}, read_at: null, created_at: at(12) },
    { id: 'e2e-v5-2', user_id: me, category: 'family', title: 'Sam a accepté « Récupérer Lina à la crèche »', body: null, deep_link: '/family', payload: {}, read_at: null, created_at: at(95) },
    { id: 'e2e-v5-3', user_id: me, category: 'reminder', title: 'Rendez-vous demain à 10 h 30', body: 'Échographie du 3e trimestre.', deep_link: null, payload: {}, read_at: at(30), created_at: at(60 * 26) });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""
ROUTES = [('accueil', '/'), ('agenda', '/calendar'), ('resume', '/summary'), ('biberons', '/bottle'), ('notifications', '/notifications')]
errs = []


def start(b, w, h, scheme):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM)
    pg.evaluate(NOTIFS)
    return ctx, pg


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def shots(b):
    for scheme in ('light', 'dark'):
        for (w, h) in ((390, 844), (320, 568)):
            ctx, pg = start(b, w, h, scheme)
            for name, path in ROUTES:
                pg.goto(B + path); pg.wait_for_timeout(3500)
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}.png')
                pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, int(h * 0.8)); pg.wait_for_timeout(700)
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}-bas.png')
            # Fiche biberon d'un enfant : chronologie du jour dépliée
            lina = next((c for c in state(pg)['tables'].get('children', []) if c['first_name'] == 'Lina'), None)
            if lina:
                pg.goto(B + f'/bottle/{lina["id"]}'); pg.wait_for_timeout(3500)
                tog = tid(pg, 'bottle-day-toggle')
                if tog.count():
                    tog.scroll_into_view_if_needed(); tog.click(); pg.wait_for_timeout(600)
                    pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, int(h * 0.5)); pg.wait_for_timeout(700)
                pg.screenshot(path=f'{SHOTS}/biberon-enfant-{w}-{scheme}.png')
            ctx.close()


def test(b):
    R = {}
    ctx, pg = start(b, 390, 844, 'light')
    pg.goto(B + '/'); pg.wait_for_timeout(4000)
    s = state(pg)
    me = s['session']['userId']
    # Accueil : prochain événement, demandes en tête, une seule action principale
    R['accueil_prochain_evenement'] = tid(pg, 'home-next-up').count() > 0
    R['accueil_illustration'] = pg.locator('[data-testid="home-next-up-art"]').count() > 0
    R['accueil_section_a_traiter'] = tid(pg, 'home-urgent').count() > 0
    R['accueil_reste_journee'] = tid(pg, 'home-today-tasks').count() > 0
    R['accueil_sans_compteurs'] = pg.locator('[data-testid="home-today-summary"]').count() == 0
    pending = next((t for t in s['tables'].get('family_tasks', []) if t.get('mission_state') == 'pending' and t['assignee_id'] == me), None)
    R['demande_trouvee'] = bool(pending)
    if pending:
        btn = tid(pg, f'today-accept-{pending["id"]}')
        R['une_action_principale'] = pg.locator('[data-testid^="today-accept-"]').filter(visible=True).count() == 1
        btn.click(); pg.wait_for_timeout(2600)
        after = next((t for t in state(pg)['tables']['family_tasks'] if t['id'] == pending['id']), {})
        R['j_accepte_serveur'] = after.get('mission_state') == 'accepted'
    pg.screenshot(path=f'{SHOTS}/e2e-01-accueil-apres-accepte.png')
    # Lien « Ouvrir l'agenda »
    tid(pg, 'home-today-open-agenda').scroll_into_view_if_needed(); tid(pg, 'home-today-open-agenda').click(); pg.wait_for_timeout(2500)
    R['lien_agenda'] = '/calendar' in pg.url
    # Agenda : « Fait » sur une tâche du jour
    done_btn = pg.locator('[data-testid^="cal-done-"]').filter(visible=True).first
    R['agenda_bouton_fait'] = done_btn.count() > 0
    if done_btn.count():
        task_id = done_btn.get_attribute('data-testid').replace('cal-done-', '')
        done_btn.scroll_into_view_if_needed(); done_btn.click(); pg.wait_for_timeout(2200)
        t2 = next((t for t in state(pg)['tables']['family_tasks'] if t['id'] == task_id), {})
        R['agenda_fait_serveur'] = t2.get('status') == 'done'
    # Sélection d'une date (bandeau semaine) : passe en vue jour
    days = pg.locator('[data-testid^="cal-day-"]').filter(visible=True)
    R['bandeau_semaine'] = days.count() == 7
    if days.count() == 7:
        days.nth(6).click(); pg.wait_for_timeout(900)
        R['date_choisie'] = days.nth(6).get_attribute('aria-selected') == 'true' or days.nth(6).get_attribute('aria-checked') == 'true' or 'true' in (days.nth(6).get_attribute('aria-selected') or '')
    pg.screenshot(path=f'{SHOTS}/e2e-02-agenda-date.png')
    # Ouverture d'un événement (fiche)
    pg.goto(B + '/calendar'); pg.wait_for_timeout(3000)
    ev = None
    for e in state(pg)['tables'].get('family_events', []):
        loc = pg.locator(f'[data-testid="cal-item-event:{e["id"]}"], [data-testid^="cal-today-event:{e["id"]}"]').filter(visible=True)
        if loc.count():
            ev = loc.first; break
    R['evenement_visible'] = ev is not None
    if ev is not None:
        ev.scroll_into_view_if_needed(); ev.click(); pg.wait_for_timeout(1200)
        R['fiche_ouverte'] = pg.get_by_text('Modifier l’événement').count() + pg.get_by_text("Modifier l'événement").count() > 0
        pg.screenshot(path=f'{SHOTS}/e2e-03-fiche.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    # Ajouter un événement : action principale en bas
    add = tid(pg, 'calendar-add')
    R['agenda_action_ajouter'] = add.count() > 0
    # Notifications et résumé : chargent sans erreur
    pg.goto(B + '/notifications'); pg.wait_for_timeout(2500)
    R['notifications_lignes'] = pg.locator('[data-testid^="notif-row-e2e-v5-"]').filter(visible=True).count() == 3
    pg.get_by_role('button', name='Marquer comme lue : Rappel biberon · Lina').first.click() if pg.get_by_role('button', name='Marquer comme lue : Rappel biberon · Lina').count() else None
    pg.wait_for_timeout(1500)
    n1 = next((n for n in state(pg)['tables'].get('notifications', []) if n['id'] == 'e2e-v5-1'), {})
    R['notification_marquee_lue'] = bool(n1.get('read_at'))
    pg.goto(B + '/summary'); pg.wait_for_timeout(2500)
    R['resume'] = pg.locator('[data-testid="summary-sections"], [data-testid="summary-periods"]').count() > 0
    pg.goto(B + '/bottle'); pg.wait_for_timeout(2500)
    R['biberons'] = pg.locator('[data-testid="bottle-children"]').count() > 0
    ctx.close()
    R['erreurs'] = errs[:8]
    print(json.dumps(R, ensure_ascii=False, indent=1))
    return all(v for k, v in R.items() if k != 'erreurs') and not errs


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ok = True
    if MODE == 'shots':
        shots(b)
        print(json.dumps({'captures': SHOTS, 'erreurs': errs[:8]}, ensure_ascii=False))
    else:
        ok = test(b)
    b.close()
sys.exit(0 if ok else 1)
