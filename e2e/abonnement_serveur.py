"""
Abonnement Premium hors démonstration (faux Supabase) : chaque état SERVEUR de la ligne `subscriptions` et ce que
l'application en montre, sans aucun achat (la version web n'a pas d'achat intégré, comme prévu) :
  utilisatrice sans abonnement (aucun paywall à l'ouverture, page sans prix ni bouton d'achat, feuille Premium au
  premier usage d'une fonction Premium avec « Plus tard »), profil 5 (souhaite souscrire), profil 6 (abonnée :
  accès, « Mon abonnement »), profil 7 (annule : accès jusqu'à l'échéance puis retiré), essai, renouvellement,
  expiration, remboursement (révocation immédiate), problème de paiement / période de grâce, en pause, changement de
  formule, achat de test (Sandbox), co-parent partagé (un seul), second co-parent non couvert. L'application n'écrit
  jamais dans `subscriptions` (seul le serveur le fait).
Version web construite avec le faux Supabase (voir e2e/README.md) :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/dist-e2e && python3 e2e/spa_server.py /tmp/dist-e2e 8811 &
  E2E_URL=http://127.0.0.1:8811 python3 e2e/abonnement_serveur.py
  IPHONE=1 … : mêmes parcours sans Intl.PluralRules / RelativeTimeFormat / ListFormat (conditions Hermes sur iPhone).
"""
import json, os, re, sys, uuid
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
IPHONE = os.environ.get('IPHONE') == '1'
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
fake = FakeSupabase(); R = {}; errs = []
MONEY = re.compile(r'\d+,\d\d\s?€')
NO_INTL = """(() => { try { delete Intl.PluralRules; delete Intl.RelativeTimeFormat; delete Intl.ListFormat; } catch (e) {} })();"""


def iso(days):
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S.000Z')


def user(email, name):
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {'adult_confirmed': True, 'terms_version': '2026-10', 'privacy_version': '2026-10'}}
    fake.trigger_new_user(fake.users[uid])
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': name})
    return uid


def set_sub(uid, status, days, product='aufildenous_premium_monthly', period='monthly', price=10.99, **extra):
    fake.T['subscriptions'] = [s for s in fake.t('subscriptions') if s['user_id'] != uid]
    if status is None: return
    row = {'user_id': uid, 'entitlement': 'AU_FIL_DE_NOUS_PREMIUM', 'status': status, 'product_id': product, 'store': 'app_store', 'period_type': period,
           'expires_at': iso(days) if days is not None else None, 'will_renew': status in ('trial', 'active', 'grace'), 'started_at': iso(-10),
           'trial_ends_at': iso(days) if status == 'trial' else None, 'price': price if status != 'trial' else None, 'currency': 'EUR',
           'refunded_at': iso(0) if status == 'refunded' else None, 'billing_issue_at': iso(-1) if status in ('grace', 'billing_issue') else None,
           'resumes_at': None, 'cancel_reason': None, 'environment': 'production'}
    row.update(extra)
    fake.t('subscriptions').append(row)


A = user('abonnee@exemple.test', 'Camille')       # abonnée (propriétaire du foyer)
COP = user('coparent@exemple.test', 'Sami')        # co-parent (arrivé le premier)
COP2 = user('coparent2@exemple.test', 'Alex')      # second co-parent : jamais couvert
hidA = next(m['household_id'] for m in fake.t('household_members') if m['user_id'] == A)
for u, when in ((COP, '2026-11-01T10:00:00.000Z'), (COP2, '2026-11-02T10:00:00.000Z')):
    fake.t('household_members').append({'household_id': hidA, 'user_id': u, 'role': 'coparent', 'can_view': ['daily'], 'can_edit': ['daily'], 'joined_at': when})


def T(pg): return re.sub(r'[  ]', ' ', pg.inner_text('body'))
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def txt(pg, t): return re.sub(r'[  ]', ' ', tid(pg, t).inner_text()) if has(pg, t) else ''


def login(ctx, email):
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.route(re.compile(r'https://(d8j0ntlcm91z4\.cloudfront\.net|cdn\.5sdesign\.art)/.*'), lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'{email} PAGE ' + str(e)[:200]))
    pg.on('console', lambda m: errs.append(f'{email} console: ' + m.text[:160]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3500)
    pg.get_by_label('Adresse e-mail').fill(email)
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4000)
    return pg


def sub_page(pg, wait=3200):
    pg.goto(B + '/settings/subscription'); pg.wait_for_timeout(wait)
    return T(pg)


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    if IPHONE: ctx.add_init_script(NO_INTL)
    try:
        pg = login(ctx, 'abonnee@exemple.test')
        # ============================================================ Sans abonnement : aucun paywall, gratuit utilisable
        set_sub(A, None, None)
        pg.goto(B + '/'); pg.wait_for_timeout(3500)
        R['gratuit_ouverture_sans_paywall'] = not has(pg, 'premium-preview') and 'Premium' not in pg.url
        t = sub_page(pg)
        R['gratuit_page_statut_gratuit'] = 'Gratuit' in txt(pg, 'sub-status-pill')
        R['gratuit_page_web_explique_achat_mobile'] = 'Abonnement dans l’application mobile' in t
        R['gratuit_page_aucun_prix_ni_achat'] = not MONEY.search(t) and not has(pg, 'plan-buy') and 'Montants de démonstration' not in t
        R['gratuit_page_comparaison_et_toujours_gratuit'] = has(pg, 'always-free') and 'Comparer Gratuit et Premium' in t
        pg.screenshot(path=f'{SHOTS}/abo_gratuit{"_iphone" if IPHONE else ""}.png', full_page=True)
        # ============================================================ Profil 5 : fonction Premium → présentation, « Plus tard »
        pg.goto(B + '/settings/family'); pg.wait_for_timeout(3500)
        if not has(pg, 'invite-create') and pg.get_by_text('Inviter quelqu’un').count(): pg.get_by_text('Inviter quelqu’un').first.click(); pg.wait_for_timeout(800)
        tid(pg, 'invite-create').click(); pg.wait_for_timeout(1500)
        t = T(pg)
        R['p5_fonction_premium_ouvre_presentation'] = has(pg, 'premium-preview') and 'Partagez les informations avec votre coparent' in t
        R['p5_presentation_gratuit_vs_premium'] = 'Gratuit :' in t and 'Premium :' in t
        R['p5_presentation_sans_faux_prix'] = not MONEY.search(txt(pg, 'premium-preview'))
        R['p5_aucune_invitation_creee_sans_premium'] = len(fake.t('household_invitations')) == 0
        tid(pg, 'premium-later').click(); pg.wait_for_timeout(700)
        R['p5_plus_tard_retour_ecran'] = not has(pg, 'premium-preview') and '/settings/family' in pg.url
        tid(pg, 'invite-create').click(); pg.wait_for_timeout(1500)
        tid(pg, 'premium-see-plans').click(); pg.wait_for_timeout(3200)
        R['p5_voir_formules_page_avec_fonction'] = '/settings/subscription' in pg.url and has(pg, 'sub-tried')
        R['p5_web_aucun_achat_rien_accorde'] = not has(pg, 'plan-buy') and not fake.premium_of(A)
        # ============================================================ Profil 6 : abonnée (mensuel, actif)
        set_sub(A, 'active', 20)
        t = sub_page(pg)
        R['p6_statut_actif'] = 'Actif' in txt(pg, 'sub-status-pill') and 'Au fil de nous Premium' in txt(pg, 'my-subscription')
        R['p6_mon_abonnement_formule_prix_dates'] = 'Mensuel' in txt(pg, 'my-sub-plan') and '10,99 € par mois' in txt(pg, 'my-sub-price') and 'Prochain renouvellement' in txt(pg, 'my-sub-next') and 'App Store' in txt(pg, 'my-sub-store')
        R['p6_renouvellement_message'] = 'Renouvellement automatique le' in txt(pg, 'sub-message')
        R['p6_gerer_abonnement_boutique'] = has(pg, 'sub-manage-link')
        R['p6_partage_affiche'] = 'Partagé avec Sami' in txt(pg, 'my-subscription')
        pg.screenshot(path=f'{SHOTS}/abo_actif{"_iphone" if IPHONE else ""}.png', full_page=True)
        pg.goto(B + '/profile'); pg.wait_for_timeout(3200)
        R['p6_rubrique_mon_abonnement_profil'] = 'MON ABONNEMENT' in txt(pg, 'my-subscription-section') and 'Actif' in txt(pg, 'my-subscription-section')
        pg.goto(B + '/settings/family'); pg.wait_for_timeout(3500)
        if not has(pg, 'invite-create') and pg.get_by_text('Inviter quelqu’un').count(): pg.get_by_text('Inviter quelqu’un').first.click(); pg.wait_for_timeout(800)
        tid(pg, 'invite-create').click(); pg.wait_for_timeout(1800)
        R['p6_fonction_premium_debloquee'] = not has(pg, 'premium-preview') and len(fake.t('household_invitations')) == 1
        # Changement de formule (fait par la boutique, transmis par le serveur) : 12 mois
        set_sub(A, 'active', 365, product='aufildenous_premium_annual', period='annual', price=99.99)
        sub_page(pg)
        R['changement_formule_12_mois'] = '12 mois' in txt(pg, 'my-sub-plan') and '99,99 € par an' in txt(pg, 'my-sub-price')
        # ============================================================ Essai gratuit
        set_sub(A, 'trial', 3)
        sub_page(pg)
        my = txt(pg, 'my-subscription')
        R['essai_statut_et_dates'] = 'Essai' in txt(pg, 'sub-status-pill') and 'Fin de l’essai' in my and 'Premier prélèvement' in my and 'Essai gratuit jusqu’au' in txt(pg, 'sub-message')
        # ============================================================ Profil 7 : annule → accès jusqu'à l'échéance, puis retiré
        set_sub(A, 'cancelled', 3)
        sub_page(pg)
        R['p7_annule_statut'] = 'Annulé' in txt(pg, 'sub-status-pill') and 'Fin des droits' in txt(pg, 'my-sub-next')
        R['p7_annule_acces_conserve'] = fake.premium_of(A) and 'Au fil de nous Premium' in txt(pg, 'my-subscription')
        set_sub(A, 'expired', -1, will_renew=False)
        t = sub_page(pg)
        R['p7_echeance_passee_acces_retire'] = not fake.premium_of(A) and 'Expiré' in txt(pg, 'sub-status-pill') and 'Version gratuite' in txt(pg, 'my-subscription')
        R['expiration_donnees_conservees_message'] = 'Vos données restent consultables' in txt(pg, 'sub-message')
        # ============================================================ Remboursement : révocation immédiate (échéance future)
        set_sub(A, 'refunded', 20)
        sub_page(pg)
        R['rembourse_revocation_immediate'] = not fake.premium_of(A) and 'Remboursé' in txt(pg, 'sub-status-pill') and 'remboursé' in txt(pg, 'sub-message')
        # ============================================================ Paiement refusé : grâce (accès maintenu) puis problème de paiement
        set_sub(A, 'grace', 5)
        sub_page(pg)
        R['grace_acces_maintenu_bandeau_paiement'] = fake.premium_of(A) and 'Période de grâce' in txt(pg, 'sub-status-pill') and 'moyen de paiement' in txt(pg, 'my-subscription')
        set_sub(A, 'billing_issue', 5)
        sub_page(pg)
        R['probleme_paiement_acces_suspendu'] = not fake.premium_of(A) and 'Problème de paiement' in txt(pg, 'sub-status-pill') and 'moyen de paiement' in txt(pg, 'my-subscription')
        # ============================================================ En pause (Google Play)
        set_sub(A, 'paused', -1, store='play_store', resumes_at=iso(30))
        sub_page(pg)
        R['pause_statut_reprise'] = not fake.premium_of(A) and 'En pause' in txt(pg, 'sub-status-pill') and 'Reprise prévue' in txt(pg, 'my-subscription')
        # ============================================================ Achat de test (Sandbox) signalé
        set_sub(A, 'active', 20, environment='sandbox')
        sub_page(pg)
        R['sandbox_signale'] = 'App Store (achat de test)' in txt(pg, 'my-sub-store')
        # ============================================================ Co-parent partagé : un seul
        pg.close()
        pg2 = login(ctx, 'coparent@exemple.test')
        t = sub_page(pg2)
        R['coparent_premium_offert'] = fake.premium_of(COP) and 'Premium vous est offert par Camille' in txt(pg2, 'sub-message')
        R['coparent_pas_de_formules_a_acheter'] = not has(pg2, 'premium-plans') and not has(pg2, 'plan-buy') and 'Choisissez votre formule' not in t
        pg2.screenshot(path=f'{SHOTS}/abo_coparent{"_iphone" if IPHONE else ""}.png', full_page=True)
        pg2.close()
        pg3 = login(ctx, 'coparent2@exemple.test')
        sub_page(pg3)
        R['second_coparent_non_couvert'] = not fake.premium_of(COP2) and 'Gratuit' in txt(pg3, 'sub-status-pill')
        pg3.close()
        # Fin de l'abonnement de l'abonnée : fin du partage
        set_sub(A, 'expired', -1)
        R['fin_abonnement_fin_du_partage'] = not fake.premium_of(COP)
        # ============================================================ Sécurité : l'application n'écrit jamais l'abonnement
        writes = [c for c in fake.calls if c[0] in ('POST', 'PATCH', 'PUT', 'DELETE') and '/rest/v1/subscriptions' in c[1]]
        R['application_n_ecrit_jamais_subscriptions'] = not writes
        R['aucune_rpc_demo_abonnement'] = not any('set_demo_subscription' in c[1] for c in fake.calls)
    except Exception as e:  # noqa: BLE001 — rapport toujours imprimé, l'exception compte comme erreur
        errs.append(f'exception: {str(e)[:300]}')
    b.close()

R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = sum(1 for k, v in R.items() if k != 'erreurs' and v is True)
total = sum(1 for k in R if k != 'erreurs')
print(('OK' if ok == total and not errs else 'ÉCHEC'), ok, '/', total, '(conditions iPhone)' if IPHONE else '')
