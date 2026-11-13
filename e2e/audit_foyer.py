"""
Audit n°7 « Parcours du foyer et intégrations » (18/11/2026) — parcours rejouable, voir docs/audit/07_foyer_integrations.md.

Partie 1 — démo web (un foyer, « Voir comme Sam » pour passer de Camille, l'autrice, à Sam, le co-parent) :
  missions : refus SANS justification, annulation réservée à l'autrice, « Petit rappel » limité (1 par 24 h),
  autre horaire proposé, mission refusée absente de l'agenda ; courses : article d'une mission coché par une personne
  qui n'en est PAS la destinataire (aucune fin forcée, proposition neutre au destinataire) ; centre de notifications,
  aucune preuve de lecture.
Partie 2 — faux Supabase, deux navigateurs en même temps (Camille propriétaire Premium, Alex co-parent) :
  invitation créée → acceptée → code rejoué refusé → lien ouvert par une personne déjà membre refusé SANS changer ses
  droits (F1) → révocation → départ du foyer ; temps réel : coupure du WebSocket puis réabonnement (R1 : la relecture
  à la reprise est prouvée par Jest, le faux Realtime ne transmettant pas l'état « SUBSCRIBED »).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \\
    npx expo export --platform web --clear --output-dir /tmp/audit7/dist && python3 e2e/spa_server.py /tmp/audit7/dist 8977 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8977 E2E_SHOTS=/tmp/audit7/shots python3 e2e/audit_foyer.py
Chaque clé du rapport doit valoir true (sauf « informations_non_bloquantes ») ; « erreurs » doit être vide.
"""
import datetime, glob, json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402
from fake_supabase import FakeSupabase, FakeRealtime, now  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8977')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/audit7/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs, INFO = {}, [], {}
IGNORED = ('ERR_TUNNEL', 'Failed to load resource', 'sb.fake.test')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name):
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def watch(pg, who):
    pg.on('console', lambda m: m.type == 'error' and not any(x in m.text for x in IGNORED) and errs.append(f'{who}: {m.text[:200]}'))
    pg.on('pageerror', lambda e: errs.append(f'{who} PAGE {str(e)[:200]}'))


def demo(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def rows(pg, table):
    return demo(pg)['tables'].get(table, [])


def switch(pg):
    if tid(pg, 'mission-demo-switch').count() == 0:   # la pastille « voir comme … » vit dans les écrans Missions
        pg.goto(B + '/family/missions'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-demo-switch').click()
    pg.wait_for_timeout(2500)


def task(pg, mid):
    return next((t for t in rows(pg, 'family_tasks') if t['id'] == mid), {})


def notes_of(pg, uid):
    return [n for n in rows(pg, 'notifications') if n['user_id'] == uid]


def new_mission(pg, template):
    """Camille → Sam, depuis un modèle neutre ; renvoie (id, titre)."""
    pg.goto(B + '/family/missions/new'); pg.wait_for_timeout(3000)
    tid(pg, f'mission-tpl-{template}').click(); pg.wait_for_timeout(500)
    title = pg.locator('[data-testid="mission-title"]').filter(visible=True).first.input_value()
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    tid(pg, 'mission-who-coparent').click(); pg.wait_for_timeout(300)
    tid(pg, 'mission-next').click(); pg.wait_for_timeout(700)
    tid(pg, 'mission-send').click(); pg.wait_for_timeout(3500)
    return pg.url.rstrip('/').split('/')[-1], title


def body(pg):
    return pg.locator('body').inner_text()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)

    # ============================================================ Partie 1 : démo (Camille ⇄ Sam)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page(); watch(pg, 'demo')
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    camille = demo(pg)['session']['userId']
    pg.goto(B + '/family/missions'); pg.wait_for_timeout(3000)
    switch(pg); sam = demo(pg)['session']['userId']; switch(pg)
    R['demo_deux_personnes'] = sam != camille and demo(pg)['session']['userId'] == camille

    # --- M1 : refus sans justification, puis annulation par l'autrice seulement
    m1, t1 = new_mission(pg, 'bins')
    R['M1_creee_a_accepter'] = task(pg, m1).get('mission_state') == 'pending'
    switch(pg)
    pg.goto(B + f'/family/missions/{m1}'); pg.wait_for_timeout(3000)
    R['M1_destinataire_sans_annulation'] = tid(pg, 'mission-cancel').count() == 0
    tid(pg, 'mission-reply-decline').click(); pg.wait_for_timeout(800)
    R['M1_justification_facultative'] = tid(pg, 'mission-panel-decline').count() > 0
    tid(pg, 'mission-decline-confirm').click(); pg.wait_for_timeout(2500)
    t = task(pg, m1)
    R['M1_refus_sans_justification'] = t.get('mission_state') == 'declined'
    ev = [e for e in rows(pg, 'family_task_events') if e['task_id'] == m1 and e['kind'] == 'declined']
    R['M1_aucune_justification_inventee'] = len(ev) == 1 and not (ev[0].get('detail') or {}).get('note')
    shot(pg, '01-refus-sans-justification')
    switch(pg)
    R['M1_autrice_prevenue_non_prise'] = any(n['title'].startswith('Mission non prise') for n in notes_of(pg, camille))
    pg.goto(B + '/calendar'); pg.wait_for_timeout(3500)
    R['M1_refusee_absente_agenda'] = t1 not in body(pg)
    shot(pg, '02-agenda-sans-mission-refusee')
    pg.goto(B + f'/family/missions/{m1}'); pg.wait_for_timeout(3000)
    R['M1_autrice_peut_annuler'] = tid(pg, 'mission-cancel').count() > 0
    tid(pg, 'mission-cancel').click(); pg.wait_for_timeout(800)
    pg.get_by_role('button', name=re.compile('^Annuler la mission$|^Annuler$')).last.click(); pg.wait_for_timeout(2500)
    R['M1_annulee'] = task(pg, m1).get('mission_state') == 'cancelled'
    R['M1_destinataire_prevenu_annulation'] = any(n['title'].startswith('Mission annulée') for n in notes_of(pg, sam))

    # --- M2 : petit rappel limité (1 / 24 h), autre horaire proposé
    m2, t2 = new_mission(pg, 'laundry')
    pg.goto(B + f'/family/missions/{m2}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-remind').click(); pg.wait_for_timeout(2500)
    R['M2_rappel_envoye'] = bool(task(pg, m2).get('last_reminded_at')) and sum(n['title'].startswith('Petit rappel') for n in notes_of(pg, sam)) == 1
    R['M2_second_rappel_impossible'] = tid(pg, 'mission-remind').count() == 0 and 'un rappel par jour' in body(pg).lower()
    shot(pg, '03-rappel-limite')
    switch(pg)
    pg.goto(B + f'/family/missions/{m2}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-reply-postpone').click(); pg.wait_for_timeout(800)
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).strftime('%d/%m/%Y')
    inputs = pg.locator('[data-testid="mission-panel-postpone"] input')
    inputs.nth(0).fill(tomorrow); inputs.nth(1).fill('10:00')
    tid(pg, 'mission-postpone-confirm').click(); pg.wait_for_timeout(2500)
    t = task(pg, m2)
    R['M2_autre_horaire'] = t.get('mission_state') == 'postponed' and (t.get('due_at') or '') > now()
    R['M2_autrice_prevenue'] = any(n['title'].startswith('Autre moment proposé') for n in notes_of(pg, camille))
    shot(pg, '04-autre-horaire')

    # --- M3 : article coché par une personne qui n'est PAS la destinataire
    switch(pg)
    m3, t3 = new_mission(pg, 'diapers')
    switch(pg)
    pg.goto(B + f'/family/missions/{m3}'); pg.wait_for_timeout(3000)
    tid(pg, 'mission-reply-accept').click(); pg.wait_for_timeout(2500)
    item = next((i for i in rows(pg, 'shopping_items') if task(pg, m3).get('shopping_item_id') == i['id']), None)
    R['M3_article_cree_a_l_acceptation'] = item is not None and not item['checked']
    switch(pg)  # Camille coche l'article de la mission de Sam
    pg.goto(B + '/meals/shopping'); pg.wait_for_timeout(3500)
    tid(pg, f"shop-{item['ingredient_key'] or item['label']}" if item else 'shop-none').click(); pg.wait_for_timeout(2500)
    item = next(i for i in rows(pg, 'shopping_items') if i['id'] == item['id']) if item else {}
    R['M3_article_coche'] = bool(item.get('checked'))
    R['M3_mission_pas_terminee_a_sa_place'] = task(pg, m3).get('mission_state') == 'accepted'
    R['M3_proposition_neutre_au_destinataire'] = any(n['title'].startswith('Article coché') for n in notes_of(pg, sam))
    shot(pg, '05-coche-par-autre')
    switch(pg)
    pg.goto(B + f'/family/missions/{m3}'); pg.wait_for_timeout(3000)
    R['M3_detail_signale_coche_autre'] = tid(pg, 'mission-item-checked-other').count() > 0
    tid(pg, 'mission-reply-complete').click(); pg.wait_for_timeout(2500)
    R['M3_destinataire_termine'] = task(pg, m3).get('mission_state') == 'done'

    # --- Centre de notifications, aucune preuve de lecture
    R['notifs_non_lues_tant_que_non_ouvertes'] = all(not n.get('read_at') for n in notes_of(pg, camille))
    pg.goto(B + '/notifications'); pg.wait_for_timeout(3500)
    R['centre_notifications_sam'] = 'Petit rappel' in body(pg) and 'Mission annulée' in body(pg)
    shot(pg, '06-centre-notifications-sam')
    R['lecture_de_sam_invisible_pour_camille'] = all(not n.get('read_at') for n in notes_of(pg, camille))
    ctx.close()

    # ============================================================ Partie 2 : faux Supabase, deux navigateurs
    fake = FakeSupabase()

    def account(email, name):
        uid = str(uuid.uuid4())
        fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
        fake.trigger_new_user(fake.users[uid])
        next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': name})
        return uid

    def browser(who, rt=None):
        c = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
        c.route('http://sb.fake.test/**', fake.route)
        c.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
        pg_ = c.new_page(); watch(pg_, who)
        if rt: pg_.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), rt.attach)
        return c, pg_

    def sign_in(pg_, email):
        pg_.goto(B + '/auth/sign-in'); pg_.wait_for_timeout(3500)
        pg_.get_by_label('Adresse e-mail').fill(email)
        pg_.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
        pg_.get_by_role('button', name='Se connecter').last.click(); pg_.wait_for_timeout(4000)

    def join(pg_, code):
        pg_.goto(B + '/settings/family'); pg_.wait_for_timeout(3500)
        pg_.get_by_label('Code d’invitation').fill(code)
        pg_.get_by_role('button', name='Rejoindre le foyer').last.click(); pg_.wait_for_timeout(3000)

    cam = account('camille@exemple.test', 'Camille'); fake.premium_users.add(cam)
    alex = account('alex@exemple.test', 'Alex')
    zoe = account('zoe@exemple.test', 'Zoé')
    hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == cam)
    rt = FakeRealtime()
    ca, pa = browser('camille', rt)
    cb, pb = browser('alex')
    sign_in(pa, 'camille@exemple.test'); sign_in(pb, 'alex@exemple.test')

    # --- Invitation : créer, accepter, rejouer, déjà membre (F1), révoquer
    pa.goto(B + '/settings/family'); pa.wait_for_timeout(3500)
    pa.get_by_role('button', name='Créer l’invitation').click(); pa.wait_for_timeout(2500)
    inv1 = fake.t('household_invitations')[-1] if fake.t('household_invitations') else {}
    R['I_invitation_creee_code_affiche'] = bool(inv1) and inv1['token'] in body(pa)
    shot(pa, '10-invitation-creee')
    join(pb, inv1.get('token', ''))
    R['I_acceptee_alex_coparent'] = any(m['user_id'] == alex and m['household_id'] == hid and m['role'] == 'coparent' for m in fake.t('household_members'))
    join(pb, inv1.get('token', ''))
    R['I_code_rejoue_refuse'] = 'Invitation invalide ou expirée' in body(pb)
    pa.goto(B + '/settings/family'); pa.wait_for_timeout(3500)
    pa.get_by_role('button', name='Créer l’invitation').click(); pa.wait_for_timeout(2500)
    inv2 = fake.t('household_invitations')[-1]
    rights_before = next(dict(m) for m in fake.t('household_members') if m['user_id'] == alex and m['household_id'] == hid)
    join(pb, inv2['token'])
    rights_after = next(dict(m) for m in fake.t('household_members') if m['user_id'] == alex and m['household_id'] == hid)
    R['F1_deja_membre_message_clair'] = 'Vous faites déjà partie de ce foyer' in body(pb)
    R['F1_droits_inchanges_invitation_intacte'] = rights_before == rights_after and not inv2['accepted_at'] \
        and len([m for m in fake.t('household_members') if m['user_id'] == alex and m['household_id'] == hid]) == 1
    shot(pb, '11-deja-membre')
    pa.goto(B + '/settings/family'); pa.wait_for_timeout(3500)
    R['I_invitation_en_attente_listee'] = pa.get_by_role('button', name='Révoquer').count() > 0
    pa.get_by_role('button', name='Révoquer').first.click(); pa.wait_for_timeout(2500)
    R['I_revoquee'] = bool(inv2.get('revoked_at'))
    cz, pz = browser('zoe')
    sign_in(pz, 'zoe@exemple.test'); join(pz, inv2['token'])
    R['I_revoquee_refusee'] = 'Invitation invalide ou expirée' in body(pz) and not any(m['user_id'] == zoe and m['household_id'] == hid for m in fake.t('household_members'))
    cz.close()

    # --- Temps réel : reconnexion après une coupure (R1)
    pa.goto(B + '/family'); pa.wait_for_timeout(4000)
    R['T_abonnement_foyer'] = bool(rt.joins) and any(s.get('filter') == f'household_id=eq.{hid}' for s in rt.joins[-1][1])
    joins_before = len(rt.joins)
    rt.ws.close()                                   # coupure (réseau instable, serveur redémarré)
    title = 'Sortir le linge ' + uuid.uuid4().hex[:4]
    fake.t('family_tasks').append({'id': str(uuid.uuid4()), 'household_id': hid, 'title': title, 'category': 'housework', 'status': 'todo', 'priority': 'normal',
                                   'essential': False, 'due_at': now(), 'assignee_id': None, 'created_by': alex, 'created_at': now(), 'updated_at': now(),
                                   'recurrence': None, 'notes': None, 'routine_id': None})   # ajoutée par Alex pendant la coupure
    for _ in range(30):
        pa.wait_for_timeout(1000)
        if len(rt.joins) > joins_before and pa.get_by_text(title).count(): break
    R['T_reabonnement_apres_coupure'] = len(rt.joins) > joins_before
    # Limite du faux Realtime : realtime-js 2.118 n'y appelle jamais le rappel d'état (« SUBSCRIBED »), même au premier
    # abonnement (vérifié sur une version instrumentée) ; la relecture à la reprise (R1) est donc prouvée par Jest
    # (sync.test.tsx, au niveau du hook) et reste à observer sur Supabase réel. Information, pas un critère.
    INFO['T_changement_manque_relu_sans_action'] = pa.get_by_text(title).count() > 0
    shot(pa, '12-reconnexion')

    # --- Départ du foyer (Alex)
    pb.goto(B + '/settings/family'); pb.wait_for_timeout(3500)
    pb.get_by_role('button', name='Quitter ce foyer').click(); pb.wait_for_timeout(1000)
    pb.get_by_role('button', name='Quitter', exact=True).last.click(); pb.wait_for_timeout(3000)
    R['D_alex_parti'] = not any(m['user_id'] == alex and m['household_id'] == hid for m in fake.t('household_members'))
    R['D_proprietaire_ne_peut_pas_partir'] = (pa.goto(B + '/settings/family') or True) and pa.wait_for_timeout(3000) is None \
        and pa.get_by_role('button', name='Quitter ce foyer').count() == 0
    shot(pb, '13-depart')
    ca.close(); cb.close()
    b.close()

R['erreurs'] = errs
R['informations_non_bloquantes'] = INFO
print(json.dumps(R, ensure_ascii=False, indent=1))
