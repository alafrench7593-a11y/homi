"""
Parcours navigateur À DEUX COMPTES (19/11/2026) : missions terminées, espace du co-parent, confidentialité,
Couple → « Se comprendre ». Faux serveur : e2e/fake_couple.py (RLS émulée + fonctions serveur), deux contextes de
navigateur (Camille, propriétaire ; Sam, co-parent invité), un seul « serveur ».
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \\
    npx expo export --platform web --clear --output-dir <dist>
  python3 e2e/spa_server.py <dist> <port> &
  E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> PW_CHROMIUM=/opt/pw-browsers python3 e2e/couple_comprendre.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import now  # noqa: E402
from fake_couple import FakeCouple  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-couple')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
ONLY = os.environ.get('E2E_ONLY', '')
R, errs = {}, []
fake = FakeCouple()


def account(email, name):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': name})
    return uid


cam = account('camille@exemple.test', 'Camille')
sam = account('sam@exemple.test', 'Sam')
hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == cam)
fake.premium_users.add(cam)
kid = str(uuid.uuid4())
fake.t('children').append({'id': kid, 'household_id': hid, 'first_name': 'Lina', 'birth_date': '2025-09-01', 'archived': False, 'sex': None, 'enabled_tracking': [], 'created_at': now()})
fake.t('user_journeys').append({'id': str(uuid.uuid4()), 'user_id': cam, 'household_id': hid, 'type': 'baby', 'status': 'active', 'child_id': kid, 'pregnancy_id': None,
                                'started_on': '2025-09-01', 'created_at': now(), 'updated_at': now()})
# Données privées de Camille (jamais lisibles par Sam)
fake.t('period_entries').append({'id': str(uuid.uuid4()), 'user_id': cam, 'start_date': '2026-11-10', 'end_date': None, 'created_at': now()})
fake.t('mood_checkins').append({'id': str(uuid.uuid4()), 'user_id': cam, 'mood': 2, 'journal': 'journal intime', 'created_at': now()})
preg = str(uuid.uuid4())
fake.t('pregnancies').append({'id': preg, 'household_id': hid, 'carrier_user_id': cam, 'due_date': '2027-05-01', 'status': 'active', 'multiplicity': 'single',
                              'due_date_source': 'due_date', 'reminders_wanted': [], 'topics': [], 'created_at': now(), 'share_basics': None, 'share_medical': None})


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t, timeout=0):
    if timeout:
        try:
            pg.locator(f'[data-testid="{t}"]').filter(visible=True).first.wait_for(timeout=timeout)
        except Exception:
            return False
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def body(pg):
    return pg.inner_text('body')


def shot(pg, name):
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)


def direct(pg, uid, path):
    """Requête DIRECTE au serveur avec le jeton du compte (comme un client malveillant le ferait)."""
    token = fake.session(uid)['access_token']
    return pg.evaluate("""async ([url, token]) => { const r = await fetch(url, { headers: { authorization: 'Bearer ' + token, apikey: 'fake-anon-key' } });
      return { status: r.status, body: await r.json() }; }""", ['http://sb.fake.test' + path, token])


def open_ctx(b, uid, email, width=390, scheme='light'):
    ctx = b.new_context(viewport={'width': width, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme)
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), lambda ws: None)
    pg.on('pageerror', lambda e: errs.append(f'{email} PAGE ' + str(e)[:200]))
    pg.on('console', lambda m: errs.append(f'{email} ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_' not in m.text else None)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    return ctx, pg


def go(pg, path, wait=3000):
    pg.goto(B + path); pg.wait_for_timeout(wait)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    cctx, cpg = open_ctx(b, cam, 'camille@exemple.test')

    # ================================================================ 1. invitation de l'autre parent (lien à usage unique)
    go(cpg, '/family/couple')
    R['01_proposition_inviter'] = has(cpg, 'cp-invite', 6000) and 'Ajouter l’autre parent à votre famille ?' in body(cpg)
    shot(cpg, 'cam-01-couple-invitation')
    tid(cpg, 'cp-invite-now').click(); cpg.wait_for_timeout(3000)
    R['02_vers_reglages_famille'] = '/settings/family' in cpg.url
    cpg.get_by_role('button', name='Créer l’invitation').click(); cpg.wait_for_timeout(2500)
    token = fake.t('household_invitations')[-1]['token'] if fake.t('household_invitations') else None
    R['03_invitation_creee'] = bool(token)

    sctx, spg = open_ctx(b, sam, 'sam@exemple.test')
    go(spg, f'/settings/family?code={token}', 4000)
    spg.get_by_role('button', name='Rejoindre le foyer').first.click(); spg.wait_for_timeout(4000)
    R['04_sam_a_rejoint'] = any(m['household_id'] == hid and m['user_id'] == sam and m['role'] == 'coparent' for m in fake.t('household_members'))
    R['05_lien_usage_unique'] = next(i for i in fake.t('household_invitations') if i['token'] == token)['accepted_at'] is not None
    fake.premium_users.add(sam)  # comme _premium_of : l'abonnement de la propriétaire couvre le co-parent
    fake.t('family_member_profiles').append({'household_id': hid, 'user_id': sam, 'family_label': 'Papa', 'share_missions': True, 'share_domains': True,
                                             'share_availability': False, 'share_calendar': True, 'share_activities': True, 'updated_at': now()})
    spg.reload(); spg.wait_for_timeout(3000)

    # ================================================================ 2. espace du co-parent, profil familial, confidentialité
    go(spg, '/family/my-place', 4000)
    R['06_ma_place_sam'] = has(spg, 'place-children', 5000) and 'Lina' in body(spg) and has(spg, 'place-missions') and has(spg, 'place-couple')
    shot(spg, 'sam-02-ma-place')
    go(spg, f'/family/member/{cam}', 4000)
    R['07_profil_familial_camille'] = has(spg, 'member-name', 5000) and tid(spg, 'member-name').inner_text() == 'Camille'
    R['07b_aucune_donnee_privee_affichee'] = not re.search(r'règles|cycle|grossesse|humeur|journal intime', body(spg).lower())
    shot(spg, 'sam-03-profil-camille')
    go(cpg, f'/family/member/{sam}', 4000)
    R['08_camille_voit_role_papa'] = has(cpg, 'member-role', 5000) and tid(cpg, 'member-role').inner_text() == 'Papa'
    shot(cpg, 'cam-04-profil-sam')
    # Requêtes directes avec le jeton de Sam : rien de privé ne revient
    for t in ('period_entries', 'mood_checkins', 'couple_feelings', 'pregnancies'):
        R[f'09_direct_sam_{t}_vide'] = direct(spg, sam, f'/rest/v1/{t}?select=*')['body'] == []
    # Interface : l'écran de grossesse ne montre pas celle de Camille à Sam
    go(spg, '/pregnancy', 3500)
    R['10_ecran_grossesse_ferme_a_sam'] = 'mai 2027' not in body(spg).lower() and '1 mai' not in body(spg).lower()
    shot(spg, 'sam-04-grossesse-fermee')

    # ================================================================ 3. Se comprendre : ressenti privé
    go(cpg, '/family/understand', 3500)
    R['11_se_comprendre'] = has(cpg, 'und-feelings', 5000)
    tid(cpg, 'und-feel-tired').click(); tid(cpg, 'und-feel-rest').click(); cpg.wait_for_timeout(500)
    R['12_aide_detresse'] = has(cpg, 'und-help') and 'professionnel de santé' in body(cpg)
    tid(cpg, 'und-note').fill('Les nuits sont courtes en ce moment.')
    shot(cpg, 'cam-05-ressentis')
    tid(cpg, 'und-keep').click(); cpg.wait_for_timeout(2000)
    R['13_ressenti_enregistre_prive'] = any(f['user_id'] == cam for f in fake.t('couple_feelings'))
    R['14_ressenti_invisible_sam_direct'] = direct(spg, sam, '/rest/v1/couple_feelings?select=*')['body'] == []
    R['14b_ressenti_visible_camille_direct'] = len(direct(cpg, cam, '/rest/v1/couple_feelings?select=*')['body']) == 1

    # ================================================================ 4. situation → formulation modifiée → confirmation
    tid(cpg, 'und-sit-fatigue').click(); cpg.wait_for_timeout(2500)
    tid(cpg, 'und-variant-short').click(); cpg.wait_for_timeout(600)
    R['15_variante_courte'] = 'Je manque de forces' in tid(cpg, 'und-text').input_value()
    shot(cpg, 'cam-06-situation-fatigue')
    final = tid(cpg, 'und-text').input_value() + ' Merci de m’écouter.'
    tid(cpg, 'und-text').fill(final)
    msgs_before = len(fake.t('couple_messages'))
    tid(cpg, 'und-send').click(); cpg.wait_for_timeout(1200)
    R['16_confirmation_texte_exact'] = has(cpg, 'und-confirm', 3000) and tid(cpg, 'und-confirm-text').inner_text() == final and 'À : Sam' in tid(cpg, 'und-confirm-to').inner_text()
    R['17_rien_envoye_avant_confirmation'] = len(fake.t('couple_messages')) == msgs_before
    shot(cpg, 'cam-07-confirmation')
    tid(cpg, 'und-confirm-go').click(); cpg.wait_for_timeout(2500)
    sent = [m for m in fake.t('couple_messages') if m['author_id'] == cam]
    R['18_message_envoye_texte_exact'] = len(sent) == 1 and sent[0]['body'] == final and sent[0]['recipient_id'] == sam
    notes = [n for n in fake.t('notifications') if n['user_id'] == sam and n['deep_link'] == '/family/understand/inbox']
    R['19_notification_neutre_sans_contenu'] = len(notes) == 1 and notes[0]['title'] == 'Camille souhaite partager quelque chose avec vous' and 'forces' not in json.dumps(notes[0])
    R['20_proposition_repos'] = has(cpg, 'und-rest', 4000) and 'Voulez-vous organiser un moment de repos ?' in body(cpg)
    shot(cpg, 'cam-08-proposition-repos')

    # ================================================================ 5. réception et réponse
    go(spg, '/family/understand/inbox', 4000)
    R['21_sam_recoit'] = final in body(spg) and 'Message de votre partenaire' in body(spg)
    shot(spg, 'sam-05-reception')
    tid(spg, 'und-reply-text').fill('Je comprends. Comment je peux t’aider ?')
    tid(spg, 'und-reply-send').click(); spg.wait_for_timeout(1000)
    R['22_confirmation_reponse'] = has(spg, 'und-confirm', 3000) and 'À : Camille' in tid(spg, 'und-confirm-to').inner_text()
    shot(spg, 'sam-06-reponse-confirmation')
    tid(spg, 'und-confirm-go').click(); spg.wait_for_timeout(2500)
    R['23_reponse_envoyee'] = any(m['author_id'] == sam and m['body'] == 'Je comprends. Comment je peux t’aider ?' and m['kind'] == 'reply' for m in fake.t('couple_messages'))

    # ================================================================ 6. demande de coup de main → mission
    tid(cpg, 'und-rest-yes').click(); cpg.wait_for_timeout(3000)
    tid(cpg, 'und-req-bedtime').click(); cpg.wait_for_timeout(600)
    R['24_demande_prete'] = tid(cpg, 'und-req-text').input_value() == 'Tu peux gérer le coucher ce soir ?'
    shot(cpg, 'cam-09-demande')
    tid(cpg, 'und-req-send').click(); cpg.wait_for_timeout(1000)
    R['25_aucune_mission_avant_confirmation'] = not any(t['title'] == 'Gérer le coucher ce soir' for t in fake.t('family_tasks'))
    tid(cpg, 'und-confirm-go').click(); cpg.wait_for_timeout(3000)
    mission = next((t for t in fake.t('family_tasks') if t['title'] == 'Gérer le coucher ce soir'), None)
    R['26_demande_de_mission_creee'] = bool(mission) and mission['assignee_id'] == sam and mission['mission_state'] == 'pending'
    R['27_notification_nouvelle_mission'] = any(n['user_id'] == sam and n['title'] == 'Camille t’a confié une mission' and 'coucher' not in (n.get('body') or '')
                                                 for n in fake.t('notifications'))
    cpg.wait_for_timeout(1500)
    R['27b_camille_voit_reponse'] = 'Je comprends. Comment je peux t’aider ?' in body(cpg)
    shot(cpg, 'cam-10-fil-apres-demande')

    go(spg, '/family/understand/inbox', 4000)
    req = next(m for m in fake.t('couple_messages') if m['kind'] == 'request')
    shot(spg, 'sam-07-demande-recue')
    tid(spg, f'und-req-accept-{req["id"]}').click(); spg.wait_for_timeout(2500)
    R['28_sam_accepte'] = mission['mission_state'] == 'accepted'

    # ================================================================ 7. cycle de la mission jusqu'à l'historique
    go(spg, '/family/missions', 4000)
    R['29_dans_mes_missions'] = has(spg, f'mission-{mission["id"]}', 5000)
    shot(spg, 'sam-08-missions-actives')
    tid(spg, f'mission-quick-start-{mission["id"]}').click(); spg.wait_for_timeout(2500)
    R['30_en_cours'] = mission['mission_state'] == 'in_progress'
    tid(spg, f'mission-quick-complete-{mission["id"]}').click(); spg.wait_for_timeout(400)
    R['31_coche_de_confirmation'] = has(spg, f'mission-done-{mission["id"]}', 2000)
    shot(spg, 'sam-09-mission-terminee-coche')
    spg.wait_for_timeout(2000)
    R['32_statut_en_base'] = mission['mission_state'] == 'done' and mission['done_by'] == sam and bool(mission['done_at'])
    R['33_retiree_des_actives'] = not has(spg, f'mission-{mission["id"]}')
    shot(spg, 'sam-10-missions-apres')
    spg.reload(); spg.wait_for_timeout(4000)
    R['34_pas_de_retour_apres_actualisation'] = not has(spg, f'mission-{mission["id"]}')
    go(spg, '/family/missions/done', 4000)
    R['35_historique_sam'] = has(spg, f'done-{mission["id"]}', 5000) and 'Gérer le coucher ce soir' in body(spg)
    shot(spg, 'sam-11-historique')
    go(cpg, '/family/missions/done', 4000)
    R['36_historique_camille'] = has(cpg, f'done-{mission["id"]}', 5000) and 'Faite par Sam' in body(cpg)
    R['36b_date_heure'] = bool(re.search(r'\d{1,2}:\d{2}', tid(cpg, f'done-when-{mission["id"]}').inner_text()))
    shot(cpg, 'cam-11-historique')
    R['37_notification_terminee_camille'] = sum(1 for n in fake.t('notifications') if n['user_id'] == cam and n['title'] == 'Sam a terminé : Gérer le coucher ce soir') == 1
    go(cpg, '/family/missions', 3500)
    R['38_absente_actives_camille'] = not has(cpg, f'mission-{mission["id"]}')
    shot(cpg, 'cam-12-missions-actives')

    # Préférence coupée : seconde mission, pas de notification « terminée »
    fake.t('notification_settings').append({'user_id': cam, 'mission_done': False, 'couple_discreet': False})
    st, m2 = fake.rpc('create_mission', {'p_household': hid, 'p_title': 'Sortir les poubelles', 'p_assignee': sam, 'p_category': 'housework'}, cam)
    fake.rpc('mission_respond', {'p_task': m2['id'], 'p_action': 'complete'}, sam)
    R['39_preference_respectee'] = not any(n['user_id'] == cam and 'Sortir les poubelles' in n['title'] and 'terminé' in n['title'] for n in fake.t('notifications'))

    # ================================================================ 8. lien réutilisé, invitation expirée, ancien membre
    tctx, tpg = open_ctx(b, account('tiers@exemple.test', 'Tiers'), 'tiers@exemple.test')
    go(tpg, f'/settings/family?code={token}', 4000)
    tpg.get_by_role('button', name='Rejoindre le foyer').first.click(); tpg.wait_for_timeout(3000)
    R['40_lien_reutilise_refuse'] = not any(m['household_id'] == hid and m['user_id'] not in (cam, sam) for m in fake.t('household_members'))
    fake.rpc('create_household_invitation', {'p_household': hid, 'p_role': 'coparent'}, cam)
    fake.t('household_invitations')[-1]['expires_at'] = '2020-01-01T00:00:00Z'
    expired = fake.t('household_invitations')[-1]['token']
    go(tpg, f'/settings/family?code={expired}', 4000)
    tpg.get_by_role('button', name='Rejoindre le foyer').first.click(); tpg.wait_for_timeout(3000)
    R['41_invitation_expiree_refusee'] = not any(m['household_id'] == hid and m['user_id'] not in (cam, sam) for m in fake.t('household_members')) and 'expirée' in body(tpg)
    shot(tpg, 'tiers-14-invitation-expiree')
    tctx.close()
    keep = [m for m in fake.t('household_members') if m['household_id'] == hid and m['user_id'] == sam]
    fake.T['household_members'] = [m for m in fake.t('household_members') if not (m['household_id'] == hid and m['user_id'] == sam)]
    R['42_ancien_membre_plus_de_messages'] = direct(spg, sam, '/rest/v1/couple_messages?select=*')['body'] == []
    R['43_ancien_membre_plus_de_missions'] = direct(spg, sam, f'/rest/v1/family_tasks?select=*&household_id=eq.{hid}')['body'] == []
    st, out = fake.rpc('mission_respond', {'p_task': m2['id'], 'p_action': 'complete'}, sam)
    R['44_ancien_membre_mission_introuvable'] = out == {'status': 'not_found'}
    st, out = fake.rpc('couple_send', {'p_household': hid, 'p_recipient': cam, 'p_kind': 'share', 'p_body': 'x'}, sam)
    R['45_ancien_membre_ne_peut_plus_ecrire'] = st == 403
    fake.t('household_members').extend(keep)

    # ================================================================ 9. captures : mes informations, sombre, 320 pt
    go(spg, '/family/my-info', 3500); shot(spg, 'sam-13-mes-infos')
    go(cpg, '/family/my-info', 3500)
    R['46_partage_grossesse_propose_a_camille'] = has(cpg, 'info-pregnancy', 4000)
    shot(cpg, 'cam-13-mes-infos-grossesse')
    dctx, dpg = open_ctx(b, cam, 'camille@exemple.test', scheme='dark')
    for path, name in [('/family/understand', 'cam-sombre-se-comprendre'), ('/family/understand/compose?situation=no_sex_now', 'cam-sombre-situation'),
                       ('/family/missions/done', 'cam-sombre-historique'), ('/family/understand/inbox', 'cam-sombre-fil'), (f'/family/member/{sam}', 'cam-sombre-profil-sam')]:
        go(dpg, path, 3500); shot(dpg, name)
    dctx.close()
    d2, s2 = open_ctx(b, sam, 'sam@exemple.test', scheme='dark')
    for path, name in [('/family/my-place', 'sam-sombre-ma-place'), ('/family/missions', 'sam-sombre-missions'), ('/family/understand/inbox', 'sam-sombre-reception'),
                       ('/family/my-info', 'sam-sombre-mes-infos')]:
        go(s2, path, 3500); shot(s2, name)
    d2.close()
    nctx, npg = open_ctx(b, cam, 'camille@exemple.test', width=320)
    wide = []
    for path, name in [('/family/understand', 'cam-320-se-comprendre'), ('/family/understand/compose?situation=tenderness', 'cam-320-situation'),
                       ('/family/understand/inbox', 'cam-320-fil'), ('/family/missions/done', 'cam-320-historique'), ('/family/my-info', 'cam-320-mes-infos')]:
        go(npg, path, 3500); shot(npg, name)
        if not npg.evaluate('() => document.documentElement.scrollWidth <= 321'): wide.append(path)
    R['47_320_sans_defilement_horizontal'] = not wide
    nctx.close()
    b.close()

R['erreurs'] = [e for e in errs if 'Warning' not in e][:10]
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if all(v for k, v in R.items() if k != 'erreurs') and not R['erreurs'] else 1)
