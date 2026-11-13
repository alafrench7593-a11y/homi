"""
Audit n° 2 « Authentification et compte » (navigateur réel, faux Supabase avec RLS émulée).
 A. inscription : champs vides, mot de passe faible, e-mail déjà utilisé, inscription valide ;
 B. connexion : compte non confirmé, mauvais identifiants, confirmation, lien de confirmation déjà utilisé ;
 C. déconnexion : plus aucune donnée du foyer à l'écran, dans le cache du navigateur ni après « retour arrière » ;
 D. accès direct par URL aux écrans protégés sans session : redirection, aucune donnée ;
 E. session : jeton expiré rafraîchi, rafraîchissement refusé → accueil de connexion, jeton révoqué en cours de route ;
 F. mot de passe : oubli (adresse inconnue = même réponse), lien déjà utilisé, mot de passe faible lisible
    (écran de réinitialisation et Profil › Mon compte) ;
 G. suppression du compte : échec du service (rien n'est effacé, message), puis succès (session et cache effacés) ;
    export des données avant suppression ;
 H. démonstration : entrée, sortie, puis connexion à un vrai compte sans aucune donnée de démonstration ;
 I. retour d'une connexion Apple/Google refusée ou annulée (le vrai fournisseur n'est pas joignable ici).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit2/dist
  python3 e2e/spa_server.py /tmp/audit2/dist 8972 &
  E2E_URL=http://127.0.0.1:8972 python3 e2e/audit_auth.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys, time, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime, now

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8972')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/audit-auth'); os.makedirs(SHOTS, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
R, errs, DBG = {}, [], {}
SECRET = 'Maëlle'  # prénom affiché du vrai compte (« Bon après-midi, Maëlle ») : jamais visible sans session
CHILD = 'Zéphyrine'  # prénom de son enfant (cache, export)


class RlsFake(FakeSupabase):
    """Faux Supabase + émulation de la RLS : sans session, aucune ligne ; jeton inconnu (révoqué) → 401."""
    def __init__(self):
        super().__init__()
        self.delete_ok = False
        self.deleted = []

    def dispatch(self, method, path, params, body, headers, uid):
        token = headers.get('authorization', '').replace('Bearer ', '')
        if path.startswith('/rest/v1/') and uid is None:
            if token and token != 'fake-anon-key':
                return 401, {'code': 'PGRST301', 'message': 'JWT expired'}
            if method in ('GET', 'HEAD'): return 200, []
            return 401, {'code': '42501', 'message': 'permission denied'}
        if path == '/rest/v1/rpc/export_my_data':
            return 200, {'profile': next((p for p in self.t('profiles') if p['id'] == uid), None),
                         'children': [c for c in self.t('children')]}
        if path == '/functions/v1/delete-account':
            if not uid: return 401, {'error': 'unauthorized'}
            if body.get('confirm') != 'SUPPRIMER': return 400, {'error': 'confirmation_required'}
            if not self.delete_ok: return 500, {'error': 'server_error'}
            self.deleted.append(uid)
            self.users.pop(uid, None)
            for k in [k for k, v in self.tokens.items() if v == uid]: self.tokens.pop(k)
            return 200, {'ok': True, 'files_removed': 0, 'files_pending': 0}
        return super().dispatch(method, path, params, body, headers, uid)


fake = RlsFake()
CUR = [None]


def sleep(sec):
    if CUR[0] is not None: CUR[0].wait_for_timeout(int(sec * 1000))
    else: time.sleep(sec)


def T(pg):
    try: return pg.inner_text('body')
    except Exception: return ''


def wait_text(pg, txt, timeout=12):
    end = time.time() + timeout
    while time.time() < end:
        if (txt(T(pg)) if callable(txt) else txt in T(pg)): return True
        sleep(0.3)
    return False


def shot(pg, n): pg.screenshot(path=os.path.join(SHOTS, f'{n}.png'))


def new_page(b, init_storage=None):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', accept_downloads=True)
    pg = ctx.new_page()
    CUR[0] = pg
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.add_init_script("try { if (!localStorage.getItem('toietmoi.ui')) localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0})) } catch (e) { /* about:blank */ }")
    pg.on('pageerror', lambda e: errs.append(f'[{list(R)[-1] if R else "début"}] {str(e)[:200]} @ {pg.url}'))
    pg.on('console', lambda m: errs.append('console: ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    return ctx, pg


def seed_account(email, pw='bonjour123', child=CHILD, name=SECRET):
    """Compte confirmé, onboarding terminé, un enfant (comme après un vrai parcours)."""
    uid = str(uuid.uuid4())
    u = {'id': uid, 'email': email, 'password': pw, 'confirmed': True, 'meta': {}}
    fake.users[uid] = u
    fake.premium_users.add(uid)  # Premium strict : l'accueil complet n'est ouvert qu'aux comptes Premium
    fake.trigger_new_user(u)
    prof = next(p for p in fake.t('profiles') if p['id'] == uid)
    prof.update({'display_name': name, 'onboarding_completed': True, 'journeys': ['baby']})
    hid = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == uid)
    fake.t('children').append({'id': str(uuid.uuid4()), 'household_id': hid, 'first_name': child, 'birth_date': '2026-03-12', 'sex': None,
                               'photo_path': None, 'archived': False, 'enabled_tracking': ['sleep'], 'allergies_declared': [], 'created_at': now()})
    return uid


def sign_in(pg, email, pw):
    pg.goto(B + '/auth/sign-in'); wait_text(pg, 'Adresse e-mail', 15)
    pg.get_by_label('Adresse e-mail', exact=True).fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill(pw)
    pg.get_by_role('button', name='Se connecter').last.click()


def storage(pg):
    try: return pg.evaluate('() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))')
    except Exception: return ''


def session_key(pg):
    return pg.evaluate("() => Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k)) || null")


def path(pg): return re.sub(r'^https?://[^/]+', '', pg.url)


PROTECTED = ['/settings', '/settings/account', '/settings/privacy', '/(tabs)', '/household', '/documents', '/cycle', '/journal', '/child/123', '/notifications', '/calendar']

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS, executable_path=os.environ['PW_CHROMIUM']) if os.environ.get('PW_CHROMIUM') else p.chromium.launch(args=ARGS)

    # ------------------------------------------------ A. inscription
    ctx, pg = new_page(b)
    pg.goto(B + '/auth/sign-up'); wait_text(pg, 'Créer mon compte', 15)
    pg.get_by_role('button', name='Créer mon compte').last.click(); sleep(0.8)
    t = T(pg)
    R['A_champs_vides_refuses'] = 'Indiquez votre adresse e-mail' in t and '18 ans ou plus' in t and len(fake.signup_bodies) == 0
    pg.get_by_label('Adresse e-mail', exact=True).fill('nina@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abc'); pg.get_by_label('Confirmer le mot de passe', exact=True).fill('abc')
    pg.get_by_role('checkbox', name='J’ai 18 ans ou plus').click()
    pg.get_by_role('checkbox', name='J’accepte les conditions d’utilisation et la politique de confidentialité').click()
    pg.get_by_role('button', name='Créer mon compte').last.click(); sleep(0.8)
    R['A_mdp_faible_refuse'] = 'Au moins 8 caractères' in T(pg) and len(fake.signup_bodies) == 0 and '\u0001' not in T(pg)
    seed_account('deja@exemple.test')
    pg.get_by_label('Adresse e-mail', exact=True).fill('Deja@Exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1'); pg.get_by_label('Confirmer le mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Créer mon compte').last.click(); sleep(1.5)
    R['A_email_deja_utilise'] = 'Un compte existe déjà' in T(pg) and pg.get_by_role('button', name='Se connecter').count() >= 1
    shot(pg, 'a1-deja-utilise')
    pg.get_by_label('Adresse e-mail', exact=True).fill('nina@exemple.test')
    pg.get_by_role('button', name='Créer mon compte').last.click()
    R['A_inscription_valide'] = wait_text(pg, 'Vérifiez vos e-mails')
    nina = next(u['id'] for u in fake.users.values() if u['email'] == 'nina@exemple.test')

    # ------------------------------------------------ B. connexion
    sign_in(pg, 'nina@exemple.test', 'abcdefg1'); sleep(1.5)
    R['B_compte_non_confirme'] = 'Confirmez d’abord votre adresse e-mail' in T(pg) and not session_key(pg)
    sign_in(pg, 'nina@exemple.test', 'mauvais12'); sleep(1.5)
    R['B_mauvais_identifiants'] = 'Adresse e-mail ou mot de passe incorrect' in T(pg) and not session_key(pg)
    sign_in(pg, 'inconnue@exemple.test', 'abcdefg12'); sleep(1.5)
    R['B_compte_inconnu_meme_message'] = 'Adresse e-mail ou mot de passe incorrect' in T(pg)
    code = next(k for k, v in fake.codes.items() if v[0] == nina and v[1] == 'signup')
    pg.goto(B + f'/auth/callback?code={code}')
    R['B_confirmation_connecte'] = wait_text(pg, 'Bienvenue', 12) and bool(session_key(pg))
    ctx.close()
    ctx, pg = new_page(b)
    pg.goto(B + f'/auth/callback?code={code}')  # même lien, ouvert une seconde fois (autre navigateur)
    R['B_lien_deja_utilise'] = wait_text(pg, 'Ce lien n’est plus valable', 12) and not session_key(pg)
    shot(pg, 'b1-lien-utilise')
    ctx.close()

    # ------------------------------------------------ C. déconnexion
    maelle = seed_account('maelle@exemple.test')
    ctx, pg = new_page(b)
    sign_in(pg, 'maelle@exemple.test', 'bonjour123')
    R['C_connecte_donnees_visibles'] = wait_text(pg, SECRET, 15)
    shot(pg, 'c0-connecte')
    pg.goto(B + '/settings'); wait_text(pg, 'Se déconnecter', 12)
    pg.get_by_role('button', name=re.compile('Se déconnecter')).first.click(); sleep(1)
    if pg.get_by_role('button', name=re.compile('Se déconnecter')).count() > 1:
        pg.get_by_role('button', name=re.compile('Se déconnecter')).last.click()
    wait_text(pg, 'Commencer', 10); sleep(3)
    R['C_retour_accueil_sans_donnees'] = path(pg).startswith('/welcome') and SECRET not in T(pg)
    st = storage(pg)
    R['C_session_effacee'] = not session_key(pg)
    R['C_cache_navigateur_vide'] = SECRET not in st and CHILD not in st
    for _ in range(3):
        try: pg.go_back(timeout=5000)
        except Exception: pass
        sleep(2)
        if SECRET in T(pg) or not pg.url.startswith('http'): break
    R['C_retour_arriere_sans_donnees'] = SECRET not in T(pg)
    shot(pg, 'c1-retour-arriere')
    pg.reload(); sleep(5)
    R['C_rechargement_sans_donnees'] = SECRET not in T(pg) and not path(pg).startswith('/settings')
    ctx.close()

    # Déconnexion puis fermeture IMMÉDIATE de l'onglet : à la réouverture, rien du compte sur l'appareil
    ctx, pg = new_page(b)
    sign_in(pg, 'maelle@exemple.test', 'bonjour123'); wait_text(pg, SECRET, 15); sleep(3)
    pg.goto(B + '/settings'); wait_text(pg, 'Se déconnecter', 12)
    pg.get_by_role('button', name=re.compile('Se déconnecter')).first.click(); sleep(1)
    if pg.get_by_role('button', name=re.compile('Se déconnecter')).count() > 1:
        pg.get_by_role('button', name=re.compile('Se déconnecter')).last.click()
    sleep(0.4)
    pg.goto(B + '/welcome'); sleep(6)
    R['C_fermeture_rapide_cache_vide'] = SECRET not in storage(pg) and CHILD not in storage(pg) and SECRET not in T(pg)
    ctx.close()

    # ------------------------------------------------ D. accès direct sans session
    ctx, pg = new_page(b)
    seen, leaks = [], []
    for u in PROTECTED:
        pg.goto(B + u); sleep(3.5)
        seen.append((u, path(pg)))
        if SECRET in T(pg) or CHILD in T(pg): leaks.append(u)
    R['D_redirection_vers_accueil'] = all(pth.startswith('/welcome') for _, pth in seen) or seen
    R['D_aucune_donnee_affichee'] = not leaks or leaks
    shot(pg, 'd0-acces-direct')
    ctx.close()

    # ------------------------------------------------ E. session expirée / rafraîchie / révoquée
    ctx, pg = new_page(b)
    sign_in(pg, 'maelle@exemple.test', 'bonjour123'); wait_text(pg, SECRET, 15)
    key = session_key(pg)
    raw = json.loads(pg.evaluate(f"() => localStorage.getItem('{key}')"))
    # jeton d'accès expiré, jeton de rafraîchissement valable → rafraîchi en silence, toujours connectée
    raw['expires_at'] = int(time.time()) - 60
    pg.evaluate(f"(v) => localStorage.setItem('{key}', v)", json.dumps(raw))
    refresh_before = len([c for c in fake.calls if 'grant_type=refresh_token' in c[1]])
    pg.goto(B + '/'); sleep(6)
    R['E_jeton_expire_rafraichi'] = len([c for c in fake.calls if 'grant_type=refresh_token' in c[1]]) > refresh_before and SECRET in T(pg)
    # rafraîchissement refusé (session révoquée ailleurs) → accueil de connexion, aucune donnée
    raw = json.loads(pg.evaluate(f"() => localStorage.getItem('{key}')"))
    raw['expires_at'] = int(time.time()) - 60
    for k in [k for k, v in fake.tokens.items() if v == maelle]: fake.tokens.pop(k)
    pg.evaluate(f"(v) => localStorage.setItem('{key}', v)", json.dumps(raw))
    pg.goto(B + '/settings'); sleep(7)
    R['E_rafraichissement_refuse_deconnecte'] = path(pg).startswith('/welcome') and SECRET not in T(pg) and SECRET not in storage(pg) and CHILD not in storage(pg)
    _st = storage(pg); DBG['Ec'] = _st[max(0, _st.find(SECRET) - 500): _st.find(SECRET) + 100] if SECRET in _st else ''
    DBG['E'] = (path(pg), SECRET in T(pg), [k for k, v in json.loads(storage(pg) or '{}').items() if SECRET in v or CHILD in v or re.search(r'toietmoi\.(cache|lastUser|offline)', k)])
    shot(pg, 'e1-session-refusee')
    ctx.close()
    # jeton révoqué pendant l'utilisation (non expiré localement) : refus 401 → rafraîchissement refusé → déconnexion
    ctx, pg = new_page(b)
    sign_in(pg, 'maelle@exemple.test', 'bonjour123'); wait_text(pg, SECRET, 15)
    for k in [k for k, v in fake.tokens.items() if v == maelle]: fake.tokens.pop(k)
    pg.goto(B + '/settings/account'); sleep(8)
    R['E_jeton_revoque_deconnecte'] = path(pg).startswith('/welcome') and not session_key(pg)
    ctx.close()

    # ------------------------------------------------ F. mot de passe
    ctx, pg = new_page(b)
    pg.goto(B + '/auth/forgot'); wait_text(pg, 'Recevoir le lien', 12)
    pg.get_by_label('Adresse e-mail', exact=True).fill('personne@exemple.test'); pg.get_by_role('button', name='Recevoir le lien').last.click(); sleep(2)
    R['F_oubli_adresse_inconnue_meme_reponse'] = 'C’est envoyé' in T(pg) and 'Si un compte existe' in T(pg)
    pg.goto(B + '/auth/forgot'); wait_text(pg, 'Recevoir le lien', 12)
    pg.get_by_label('Adresse e-mail', exact=True).fill('maelle@exemple.test'); pg.get_by_role('button', name='Recevoir le lien').last.click(); sleep(2)
    rcode = next(k for k, v in fake.codes.items() if v[0] == maelle and v[1] == 'recovery')
    pg.goto(B + f'/auth/reset?code={rcode}'); wait_text(pg, 'Nouveau mot de passe', 12)
    pg.get_by_label('Nouveau mot de passe', exact=True).fill('abc'); pg.get_by_label('Confirmer le mot de passe', exact=True).fill('abc')
    pg.get_by_role('button', name='Enregistrer').click(); sleep(1)
    R['F_reset_mdp_faible_message_lisible'] = 'Au moins 8 caractères' in T(pg) and '\u0001' not in T(pg)
    pg.get_by_label('Nouveau mot de passe', exact=True).fill('nouveau123'); pg.get_by_label('Confirmer le mot de passe', exact=True).fill('nouveau124')
    pg.get_by_role('button', name='Enregistrer').click(); sleep(1)
    R['F_reset_confirmation_differente'] = fake.users[maelle]['password'] == 'bonjour123'
    pg.get_by_label('Confirmer le mot de passe', exact=True).fill('nouveau123')
    pg.get_by_role('button', name='Enregistrer').click(); sleep(3)
    R['F_reset_ok'] = fake.users[maelle]['password'] == 'nouveau123'
    ctx.close()
    ctx, pg = new_page(b)
    pg.goto(B + f'/auth/reset?code={rcode}'); sleep(6)
    R['F_lien_reset_deja_utilise'] = 'Ce lien n’est plus valable' in T(pg)
    # Profil › Mon compte : mot de passe trop court → message lisible (et non une clé technique)
    sign_in(pg, 'maelle@exemple.test', 'nouveau123'); wait_text(pg, SECRET, 15)
    pg.goto(B + '/settings/account'); wait_text(pg, 'Changer le mot de passe', 12)
    pg.get_by_label('Nouveau mot de passe', exact=True).fill('abc'); pg.get_by_label('Confirmer le mot de passe', exact=True).fill('abc')
    pg.get_by_role('button', name='Changer le mot de passe').click(force=True); sleep(1)
    t = T(pg)
    R['F_compte_mdp_faible_message_lisible'] = 'Au moins 8 caractères' in t and '\u0001' not in t and 'v.password' not in t
    shot(pg, 'f1-compte-mdp-faible')

    # ------------------------------------------------ G. export puis suppression du compte
    with pg.expect_download(timeout=10000) as dl:
        pg.get_by_role('button', name='Exporter (fichier JSON)').click()
    data = open(dl.value.path(), encoding='utf-8').read()
    R['G_export_avant_suppression'] = CHILD in data
    def delete_flow():
        pg.get_by_role('button', name='Supprimer mon compte').last.click(); sleep(1)
        pg.get_by_role('button', name='Continuer').last.click(); sleep(1)
        pg.get_by_label('Confirmation', exact=True).fill('SUPPRIMER')
        pg.get_by_role('button', name='Supprimer définitivement').click()
        return wait_text(pg, 'La suppression n’a pas pu aboutir', 6)
    msg = delete_flow()
    R['G_echec_service_message_et_compte_garde'] = msg and bool(session_key(pg)) and maelle in fake.users
    DBG['G0'] = (T(pg)[-400:], bool(session_key(pg)), maelle in fake.users)
    shot(pg, 'g0-echec-suppression')
    pg.keyboard.press('Escape'); sleep(1)
    pg.goto(B + '/settings/account'); wait_text(pg, 'Supprimer mon compte', 12)
    fake.delete_ok = True
    delete_flow(); sleep(3)
    st = storage(pg)
    R['G_suppression_ok_accueil'] = maelle in fake.deleted and path(pg).startswith('/welcome')
    R['G_session_et_cache_effaces'] = not session_key(pg) and SECRET not in st and CHILD not in st and not re.search(r'toietmoi\.(lastUser|offline)', st)
    DBG['G1c'] = [m.start() for m in re.finditer(SECRET, st)] and st[max(0, st.find(SECRET) - 700): st.find(SECRET) + 200]
    DBG['G1'] = (session_key(pg), [k for k, v in json.loads(st or '{}').items() if SECRET in v or CHILD in v or re.search(r'toietmoi\.(cache|lastUser|offline)', k)])
    shot(pg, 'g1-supprime')
    sign_in(pg, 'maelle@exemple.test', 'nouveau123'); sleep(2)
    R['G_reconnexion_impossible'] = 'Adresse e-mail ou mot de passe incorrect' in T(pg)
    ctx.close()

    # ------------------------------------------------ H. démonstration → vrai compte
    seed_account('vrai@exemple.test', child='Octavie', name='Octavie')
    ctx, pg = new_page(b)
    pg.goto(B + '/welcome'); wait_text(pg, 'Découvrir sans compte', 15)
    rest_before = len([c for c in fake.calls if c[1].startswith('/rest/')])
    pg.get_by_role('button', name='Découvrir sans compte').click()
    R['H_demo_entree'] = wait_text(pg, 'Lina', 15)
    R['H_demo_sans_appel_serveur'] = len([c for c in fake.calls if c[1].startswith('/rest/')]) == rest_before
    q = pg.get_by_role('button', name=re.compile('Quitter la démonstration'))
    if q.count(): q.first.click()
    sleep(4)
    R['H_demo_sortie'] = 'Découvrir sans compte' in T(pg) or path(pg).startswith('/welcome')
    sign_in(pg, 'vrai@exemple.test', 'bonjour123')
    R['H_vrai_compte_donnees'] = wait_text(pg, 'Octavie', 15)
    sleep(2)
    t = T(pg)
    R['H_aucune_donnee_demo_dans_vrai_compte'] = 'Lina' not in t and 'Noé' not in t and 'Démonstration' not in t
    R['H_aucune_ecriture_demo_vers_serveur'] = not any(c.get('first_name') in ('Lina', 'Noé') for c in fake.t('children'))
    shot(pg, 'h1-vrai-compte')
    ctx.close()

    # ------------------------------------------------ I. retour Apple / Google refusé ou annulé
    ctx, pg = new_page(b)
    pg.goto(B + '/auth/callback?error=access_denied&error_code=provider_disabled&error_description=Unsupported+provider%3A+provider+is+not+enabled'); sleep(4)
    R['I_fournisseur_desactive_message'] = 'n’est pas encore activée' in T(pg)
    R['I_aucun_message_technique'] = 'Unsupported provider' not in T(pg)
    pg.goto(B + '/auth/callback?error=access_denied&error_description=User+cancelled'); sleep(4)
    R['I_annulation_sans_session'] = not session_key(pg) and 'User cancelled' not in T(pg)
    shot(pg, 'i1-fournisseur')
    ctx.close()

    R['erreurs'] = [e for e in errs if 'cloudfront' not in e and '401' not in e and 'JWT' not in e][:8]
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
if os.environ.get('AUDIT_DEBUG'): print(json.dumps(DBG, ensure_ascii=False, indent=1))
