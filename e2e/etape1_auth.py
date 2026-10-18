"""Parcours navigateur de l'étape 1 (inscription et connexion) contre un faux Supabase."""
import json, os, time, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
R = {}
fake = FakeSupabase()
CUR = [None]
def sleep(sec):
    # Les réponses du faux serveur ne partent que pendant un appel Playwright : on attend « dans » la page
    if CUR[0] is not None: CUR[0].wait_for_timeout(int(sec * 1000))
    else: time.sleep(sec)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

def shot(pg, n): pg.screenshot(path=os.path.join(SHOTS, f'{n}.png'))
def T(pg): return pg.inner_text('body')
def wait_text(pg, txt, timeout=12):
    end = time.time() + timeout
    while time.time() < end:
        if txt in T(pg): return True
        sleep(0.3)
    return False

def new_page(b, errs):
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    pg = ctx.new_page()
    CUR[0] = pg
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route(re.compile(r'https://d8j0ntlcm91z4\.cloudfront\.net/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('console', lambda m: errs.append('console: ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    return ctx, pg

def signup(pg, email, pw='abcdefg1', double=False):
    pg.goto(B + '/auth/sign-up'); sleep(3)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill(pw)
    pg.get_by_label('Confirmer le mot de passe').fill(pw)
    pg.get_by_role('checkbox', name='J’ai 18 ans ou plus').click()
    pg.get_by_role('checkbox', name='J’accepte les conditions d’utilisation et la politique de confidentialité').click()
    btn = pg.get_by_role('button', name='Créer mon compte').last
    if double:
        btn.click(); btn.click(force=True); pg.keyboard.press('Enter')
    else:
        btn.click()
    return wait_text(pg, 'Vérifiez vos e-mails')

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    errs = []

    # ------------------------------------------------ A. inscription → confirmation → onboarding repris
    ctx, pg = new_page(b, errs)
    pg.goto(B + '/auth/sign-up'); sleep(4); shot(pg, 'a0-inscription')
    pg.get_by_label('Adresse e-mail').fill('pas-un-email'); pg.get_by_label('Mot de passe', exact=True).click(); sleep(0.4)
    R['A_validation_directe_email'] = 'ne semble pas valide' in T(pg)
    pg.get_by_label('Mot de passe', exact=True).fill('abc'); sleep(0.3)
    R['A_regles_mdp_affichees'] = all(x in T(pg) for x in ['8 caractères minimum', 'Au moins une lettre', 'Au moins un chiffre'])
    pg.get_by_label('Afficher le mot de passe').first.click(); sleep(0.3)
    R['A_afficher_masquer'] = pg.get_by_label('Mot de passe', exact=True).get_attribute('type') != 'password'
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1'); pg.get_by_label('Confirmer le mot de passe').fill('abcdefg1')
    pg.get_by_role('button', name='Créer mon compte').last.click(); sleep(1)
    R['A_refus_sans_18_ans'] = '18 ans ou plus pour créer un compte' in T(pg)
    R['A_liens_cgu'] = 'Lire les conditions d’utilisation' in T(pg) and 'Lire la politique de confidentialité' in T(pg)
    pg.get_by_role('checkbox', name='J’ai 18 ans ou plus').click()
    pg.get_by_role('checkbox', name='J’accepte les conditions d’utilisation et la politique de confidentialité').click()
    btn = pg.get_by_role('button', name='Créer mon compte').last
    btn.click()
    for extra in (lambda: btn.click(force=True, timeout=1500), lambda: pg.keyboard.press('Enter')):
        try: extra()  # tentatives de double envoi : le bouton peut déjà avoir disparu
        except Exception: pass
    R['A_ecran_verifiez'] = wait_text(pg, 'Vérifiez vos e-mails'); shot(pg, 'a1-verifiez')
    R['A_une_seule_inscription'] = len(fake.signup_bodies) == 1
    meta = fake.signup_bodies[0].get('data', {}) if fake.signup_bodies else {}
    R['A_consentements_metadonnees'] = meta.get('adult_confirmed') is True and meta.get('terms_version') == '2026-10'
    R['A_redirect_callback'] = any(c[1].startswith('/auth/v1/signup') and 'redirect_to=' in c[1] and 'auth%2Fcallback' in c[1] for c in fake.calls)
    t = T(pg); R['A_renvoyer_desactive_60s'] = bool(re.search(r'Renvoyer l’e-mail \(dans \d+ s\)', t))
    uid = next(iter(fake.users))
    R['A_trigger_profil_foyer_consents'] = (len([h for h in fake.t('households') if h['created_by'] == uid]) == 1
                                           and len([c for c in fake.t('consents') if c['user_id'] == uid]) == 3)
    # confirmation : lien expiré puis bon lien
    pg.goto(B + '/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); sleep(3)
    R['B_lien_expire'] = wait_text(pg, 'Ce lien n’est plus valable') and 'Recevoir un nouveau lien' in T(pg); shot(pg, 'b-lien-expire')
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test'); pg.get_by_role('button', name='Recevoir un nouveau lien').click(); sleep(1.5)
    R['B_renvoi_depuis_lien_expire'] = fake.resend_count == 1 and 'C’est renvoyé' in T(pg)
    code = next(k for k, v in fake.codes.items() if v[0] == uid and v[1] == 'signup')
    pg.goto(B + f'/auth/callback?code={code}'); sleep(5)
    R['A_confirmation_ouvre_onboarding'] = wait_text(pg, 'Bienvenue', 10); shot(pg, 'a2-onboarding')
    pg.get_by_label('Comment souhaitez-vous qu’on vous appelle ?').fill('Sarah')
    pg.get_by_role('button', name='Commencer').last.click(); sleep(1)
    pg.get_by_text('Je souhaite suivre plusieurs enfants').click(); sleep(0.3)
    pg.get_by_role('button', name='Continuer').last.click(); sleep(1)
    pg.get_by_label('Prénom ou surnom').first.fill('Lina') if pg.get_by_label('Prénom ou surnom').count() else pg.get_by_label(re.compile('Prénom')).first.fill('Lina')
    pg.get_by_label(re.compile('Date de naissance')).first.fill('12/03/2026'); sleep(1.5)
    # fermeture de l'app : rechargement complet
    pg.goto(B + '/'); sleep(6); shot(pg, 'a3-reprise')
    t = T(pg)
    R['A_reprise_onboarding'] = ('Votre enfant' in t or 'Vos enfants' in t) and pg.get_by_label(re.compile('Prénom')).first.input_value() == 'Lina'
    prof = next(x for x in fake.t('profiles') if x['id'] == uid)
    R['A_brouillon_dans_profil'] = bool(prof.get('onboarding_state')) and prof['onboarding_state'].get('step') == 'children'
    pg.get_by_role('button', name='Retour').last.click(); sleep(0.8)
    R['A_bouton_retour'] = 'Où en êtes-vous' in T(pg)
    pg.get_by_role('button', name='Continuer').last.click(); sleep(0.8)
    for _ in range(4):
        if pg.get_by_role('button', name='C’est parti').count(): break
        pg.get_by_role('button', name='Continuer').last.click(); sleep(0.8)
    pg.get_by_role('button', name='C’est parti').last.click(); sleep(5); shot(pg, 'a4-accueil')
    R['A_onboarding_termine_accueil'] = 'Accueil' in T(pg)
    R['A_un_seul_foyer_un_enfant'] = (len([m for m in fake.t('household_members') if m['user_id'] == uid]) == 1 and len(fake.t('children')) == 1)
    R['A_foyer_renomme'] = any(h['name'] == 'Famille de Sarah' for h in fake.t('households') if h['created_by'] == uid)
    R['A_brouillon_efface'] = prof.get('onboarding_state') is None
    # invitation créée par Sarah
    pg.goto(B + '/settings/family'); sleep(3)
    pg.get_by_role('button', name='Créer l’invitation').click(); sleep(2)
    token = fake.t('household_invitations')[-1]['token'] if fake.t('household_invitations') else None
    R['E_invitation_creee'] = bool(token)
    # déconnexion propre
    pg.goto(B + '/settings'); sleep(3)
    sign_out = pg.get_by_role('button', name=re.compile('Se déconnecter'))
    if sign_out.count():
        sign_out.first.click(); sleep(1.5)
        if pg.get_by_role('button', name=re.compile('Se déconnecter')).count() > 1: pg.get_by_role('button', name=re.compile('Se déconnecter')).last.click()
        sleep(3)
    R['C_deconnexion'] = 'Vivez chaque étape' in T(pg) or 'Commencer' in T(pg)
    shot(pg, 'c0-deconnecte')
    ctx.close()

    # ------------------------------------------------ C. connexion (erreur traduite puis succès) et D. mot de passe oublié
    ctx, pg = new_page(b, errs)
    pg.goto(B + '/auth/sign-in'); sleep(4)
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test'); pg.get_by_label('Mot de passe', exact=True).fill('mauvais1'); pg.keyboard.press('Enter'); sleep(2)
    R['C_erreur_en_francais'] = 'Adresse e-mail ou mot de passe incorrect' in T(pg); shot(pg, 'c1-erreur')
    pg.get_by_role('button', name='Mot de passe oublié ?').click(); sleep(2)
    pg.get_by_label('Adresse e-mail').last.fill('sarah@exemple.test'); pg.get_by_role('button', name='Recevoir le lien').last.click(); sleep(2)
    R['D_oubli_envoye'] = 'C’est envoyé' in T(pg) and len(fake.recover_bodies) == 1
    R['D_redirect_reset'] = '/auth/reset' in json.dumps(fake.recover_bodies[-1]) if fake.recover_bodies else False
    pg.goto(B + '/auth/reset'); sleep(4)
    R['D_reset_sans_lien_refuse'] = 'Ce lien n’est plus valable' in T(pg); shot(pg, 'd1-reset-sans-lien')
    rcode = next(k for k, v in fake.codes.items() if v[1] == 'recovery')
    pg.goto(B + f'/auth/reset?code={rcode}'); sleep(5); shot(pg, 'd2-reset')
    pg.get_by_label('Nouveau mot de passe').fill('nouveau123'); pg.get_by_label('Confirmer le mot de passe').fill('nouveau123')
    pg.get_by_role('button', name='Enregistrer').click(); sleep(4)
    R['D_nouveau_mdp_enregistre'] = fake.users[uid]['password'] == 'nouveau123'
    R['D_retour_accueil'] = 'Accueil' in T(pg)
    ctx.close()
    ctx, pg = new_page(b, errs)
    pg.goto(B + '/auth/sign-in'); sleep(4)
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test'); pg.get_by_label('Mot de passe', exact=True).fill('nouveau123'); pg.get_by_role('button', name='Se connecter').click(); sleep(5)
    R['C_connexion_ok'] = 'Accueil' in T(pg)
    pg.goto(B + '/'); sleep(4)
    R['C_session_persistante'] = 'Accueil' in T(pg)
    ctx.close()

    # ------------------------------------------------ E. coparent sans compte
    ctx, pg = new_page(b, errs)
    pg.goto(B + f'/settings/family?code={token}'); sleep(4); shot(pg, 'e1-invite-sans-compte')
    R['E_ecran_invitation'] = 'Vous êtes invité·e à rejoindre un foyer' in T(pg)
    pg.get_by_role('button', name='Créer mon compte').click(); sleep(2)
    R['E_bandeau_invitation_inscription'] = wait_text(pg, 'Vous avez été invité·e', 6)
    pg.get_by_label('Adresse e-mail').fill('alex@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('coparent1'); pg.get_by_label('Confirmer le mot de passe').fill('coparent1')
    pg.get_by_role('checkbox', name='J’ai 18 ans ou plus').click()
    pg.get_by_role('checkbox', name='J’accepte les conditions d’utilisation et la politique de confidentialité').click()
    pg.get_by_role('button', name='Créer mon compte').last.click(); wait_text(pg, 'Vérifiez vos e-mails')
    alex = next(u for u in fake.users.values() if u['email'] == 'alex@exemple.test')['id']
    acode = next(k for k, v in fake.codes.items() if v[0] == alex)
    pg.goto(B + f'/auth/callback?code={acode}'); sleep(6); shot(pg, 'e2-rejoindre')
    R['E_proposition_rejoindre'] = wait_text(pg, 'Rejoindre le foyer qui vous a invité·e', 8)
    pg.get_by_role('button', name='Rejoindre le foyer').first.click(); sleep(5); shot(pg, 'e3-apres')
    sarah_h = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == uid)
    R['E_alex_dans_le_foyer_de_sarah'] = any(m['user_id'] == alex and m['household_id'] == sarah_h and m['role'] == 'coparent' for m in fake.t('household_members'))
    R['E_foyer_vide_alex_supprime'] = not any(h['created_by'] == alex for h in fake.t('households'))
    R['E_suite_onboarding'] = 'Bienvenue' in T(pg)
    ctx.close()

    # ------------------------------------------------ F. démonstration sans compte
    ctx, pg = new_page(b, errs)
    pg.goto(B + '/welcome'); sleep(5)
    before = len([c for c in fake.calls if c[1].startswith('/rest/')])
    pg.get_by_role('button', name='Découvrir sans compte').click(); sleep(6); shot(pg, 'f1-demo')
    t = T(pg)
    R['F_demo_sans_compte'] = 'Démonstration' in t and ('Lina' in t or 'Accueil' in t)
    R['F_aucune_ecriture_reelle'] = len([c for c in fake.calls if c[1].startswith('/rest/')]) == before
    pg.get_by_role('button', name='Quitter la démonstration').click(); sleep(4)
    R['F_quitter_demo'] = 'Vivez chaque étape' in T(pg) or 'Commencer' in T(pg)
    ctx.close()

    R['erreurs'] = [e for e in errs if 'cloudfront' not in e][:8]
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
