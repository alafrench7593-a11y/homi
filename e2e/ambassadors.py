"""HOMI Ambassadors sur la version web (faux Supabase, aucune donnée réelle) :
A. lien /r/<code>?c=… sans compte → clic compté, inscription avec code prérempli ; code invalide signalé
B. connexion → code rattaché automatiquement (source « link », campagne gardée)
C. présentation + simulateur (estimation exacte), candidature → « en attente »
D. support : validation ; finance : versement manuel avec référence ; l'ambassadeur voit son lien et ses agrégats
Usage : E2E_URL=http://127.0.0.1:8813 python3 e2e/ambassadors.py  (export web + scripts/web/build-site.mjs, servi par e2e/site_server.py)"""
import os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8813')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-amb'); os.makedirs(SHOTS, exist_ok=True)
fake = FakeSupabase()
RES = []
def check(name, ok, detail=''):
    RES.append(ok); print(('OK  ' if ok else 'ÉCHEC ') + name + (f' — {detail}' if detail else ''), flush=True)

def make_user(email):
    uid = str(uuid.uuid4())
    u = {'id': uid, 'email': email, 'password': 'abcdefg1', 'confirmed': True, 'meta': {}}
    fake.users[uid] = u; fake.trigger_new_user(u)
    for p in fake.t('profiles'):
        if p['id'] == uid: p.update({'display_name': email.split('@')[0], 'onboarding_completed': True, 'journeys': ['family']})
    return uid

SARAH, BOB, STAFF = make_user('sarah@example.test'), make_user('bob@example.test'), make_user('staff@example.test')
fake.t('user_roles').append({'user_id': STAFF, 'role': 'admin'})
SARAH_ID = str(uuid.uuid4())
fake.t('affiliates').append({'id': SARAH_ID, 'user_id': SARAH, 'code': 'sarah', 'status': 'active', 'first_name': 'Sarah', 'last_name': 'M', 'contact_email': 'sarah@example.test',
    'country': 'FR', 'language': 'fr', 'profile_type': 'maman', 'audience_size': None, 'promo_channel': None, 'created_at': '2026-11-20T00:00:00Z'})
CALLS = []

# Règles minimales du serveur (la vraie règle est testée en SQL : supabase/tests/sql/98zr_ambassadors.sql)
_rpc = fake.rpc
def rpc(fn, body, uid):
    if not fn.startswith('affiliate_'): return _rpc(fn, body, uid)
    CALLS.append((fn, body, uid))
    aff = lambda **k: next((a for a in fake.t('affiliates') if all(a[x] == v for x, v in k.items())), None)
    if fn == 'affiliate_record_click': return 200, bool(aff(code=body['p_code'], status='active'))
    if fn == 'affiliate_attach':
        a = aff(code=body['p_code'], status='active')
        return 200, ('unknown_code' if not a else 'self' if a['user_id'] == uid else 'ok')
    if fn == 'affiliate_apply':
        if aff(code=body['p_code']) or aff(user_id=uid): return 409, {'code': '23505', 'message': 'Ce code est déjà pris, ou tu as déjà une candidature'}
        a = {'id': str(uuid.uuid4()), 'user_id': uid, 'code': body['p_code'], 'status': 'pending', 'first_name': body['p_first_name'], 'last_name': body['p_last_name'],
             'contact_email': body['p_contact_email'], 'country': body['p_country'], 'language': body['p_language'], 'profile_type': body['p_profile_type'],
             'audience_size': body.get('p_audience_size'), 'promo_channel': body.get('p_promo_channel'), 'created_at': '2026-11-24T10:00:00Z'}
        fake.t('affiliates').append(a); return 200, a
    if fn == 'affiliate_my_summary':
        a = aff(user_id=uid)
        if not a: return 200, None
        led = [l for l in fake.t('affiliate_ledger') if l['affiliate_id'] == a['id']]
        cur = [{'currency': 'EUR', 'pending_minor': 318, 'available_minor': sum(l['amount_minor'] for l in led if l['status'] == 'available') or None,
                'paid_minor': -sum(l['amount_minor'] for l in led if l['kind'] == 'payout') or None, 'month_minor': 318}] if a['status'] == 'active' else []
        return 200, {'code': a['code'], 'status': a['status'], 'tier': 'starter', 'clicks_30d': 3, 'signups': 1, 'paying': 1, 'by_currency': cur, 'links': [{'campaign': '', 'feature': '', 'disabled': False}]}
    if fn == 'affiliate_set_status':
        next(a for a in fake.t('affiliates') if a['id'] == body['p_affiliate'])['status'] = body['p_status']; return 200, None
    if fn == 'affiliate_record_payout':
        led = [l for l in fake.t('affiliate_ledger') if l['affiliate_id'] == body['p_affiliate'] and l['status'] == 'available']
        total = sum(l['amount_minor'] for l in led)
        if total < 3000: return 400, {'code': 'P0001', 'message': 'Seuil de versement non atteint (30,00)'}
        for l in led: l['status'] = 'paid'
        fake.t('affiliate_ledger').append({'affiliate_id': body['p_affiliate'], 'status': 'paid', 'kind': 'payout', 'amount_minor': -total, 'currency': 'EUR'})
        return 200, {'amount_minor': total}
    return 404, {'message': fn}
fake.rpc = rpc

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'))
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    wait = lambda s: pg.wait_for_timeout(int(s * 1000))
    path = lambda: re.sub(r'^https?://[^/]+', '', pg.url)
    tid = lambda t: pg.locator(f'[data-testid="{t}"]')
    def field(t): return tid(t).locator('input, textarea').first if tid(t).locator('input, textarea').count() else tid(t)
    def sign_in(email):
        pg.goto(B + '/auth/sign-in'); wait(3)
        pg.get_by_label('Adresse e-mail').fill(email)
        pg.get_by_label('Mot de passe').first.fill('abcdefg1')
        tid('signin-submit').click(); wait(5)
    def sign_out():
        pg.evaluate("() => { Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k)); }")

    # S. page publique du site → même programme que l'app
    pg.goto(B + '/ambassadeurs/?ref=Sarah&c=insta'); wait(3)
    txt = re.sub(r'[\u00a0\u202f]', ' ', pg.inner_text('body'))
    check('site : règles du programme (30 %, 6 mois, 45 j, 30 €)', '30 %' in txt and '6 mois' in txt and '45 jours' in txt and '30,00 €' in txt)
    check('site : simulateur identique à l’app (90,00 € / 855,00 €)', '90,00' in pg.inner_text('#sim-monthly') and '855,00' in pg.inner_text('#sim-total'), pg.inner_text('#sim-monthly') + ' | ' + pg.inner_text('#sim-total'))
    check('site : aucun prix d’abonnement ni niveau', not re.search(r'14,99|Niveaux|Prix payé', txt))
    pend = pg.evaluate("() => localStorage.getItem('homi.affiliate.pending.v1')")
    check('site : ?ref gardé sous la clé de l’app', bool(pend) and '"code":"sarah"' in pend and '"campaign":"insta"' in pend, str(pend))
    check('site : clic compté', any(c[0] == 'affiliate_record_click' and c[1].get('p_code') == 'sarah' and c[1].get('p_campaign') == 'insta' for c in CALLS))
    for y in range(0, 4000, 300): pg.evaluate(f'window.scrollTo(0, {y})'); wait(0.15)
    pg.evaluate('window.scrollTo(0, 0)'); wait(0.5)
    pg.screenshot(path=os.path.join(SHOTS, 's-site.png'), full_page=True)
    pg.locator('a[data-amb-cta]').first.click(); wait(5)
    check('site → app : bouton vers /ambassadors', path().startswith('/ambassadors'), path())
    pg.goto(B + '/conditions-ambassadeurs/'); wait(1)
    check('conditions publiques : David PRINCIVIL EI, droit français', 'David PRINCIVIL' in pg.inner_text('body') and 'Droit français' in pg.inner_text('body'))
    pg.goto(B + '/ambassador'); wait(5)
    check('ancienne adresse /ambassador → /ambassadors', path().startswith('/ambassadors'), path())

    # A. lien ambassadeur sans compte
    pg.goto(B + '/r/sarah?c=tiktok&f=sommeil'); wait(5)
    check('lien /r → inscription', path().startswith('/auth/sign-up'), path())
    check('clic compté (anonyme, étiquettes gardées)', any(c[0] == 'affiliate_record_click' and c[1] == {'p_code': 'sarah', 'p_campaign': 'tiktok', 'p_feature': 'sommeil'} and c[2] is None for c in CALLS), str(CALLS[-1:]))
    code_in = field('signup-ambassador')
    check('code prérempli à l’inscription', code_in.input_value() == 'sarah', code_in.input_value())
    code_in.fill('A B'); wait(0.5)
    check('code invalide signalé', pg.get_by_text('Code invalide : 3 à 24 caractères').count() > 0)
    code_in.fill('sarah')
    pg.screenshot(path=os.path.join(SHOTS, 'a-inscription-code.png'))

    # B. connexion → rattachement
    sign_in('bob@example.test')
    att = [c for c in CALLS if c[0] == 'affiliate_attach']
    check('code rattaché après connexion', bool(att) and att[-1][1] == {'p_code': 'sarah', 'p_source': 'link', 'p_campaign': 'tiktok', 'p_feature': 'sommeil'} and att[-1][2] == BOB, str(att))
    pg.reload(); wait(5)
    check('rattaché une seule fois', len([c for c in CALLS if c[0] == 'affiliate_attach']) == 1)

    # C. présentation, simulateur, candidature
    pg.goto(B + '/ambassadors'); wait(4)
    check('présentation : 30 % pendant 6 mois', pg.get_by_text('30 % de ce que HOMI encaisse réellement').count() > 0)
    field('amb-sim-net').fill('10'); field('amb-sim-n').fill('5'); wait(0.5)
    cruise, total = tid('amb-sim-cruise').inner_text(), tid('amb-sim-total').inner_text()
    check('simulateur : 5 abonnés/mois × 3 € × 6 mois max', '90,00' in cruise and '855,00' in total, f'{cruise} | {total}')
    check('aucun prix d’abonnement affiché', not re.search(r'14,99|9,99|/ ?mois €', pg.inner_text('body')))
    pg.screenshot(path=os.path.join(SHOTS, 'c-presentation.png'), full_page=True)
    tid('amb-apply').click(); wait(3)
    field('amb-apply-code').fill('bob-papa'); field('amb-apply-first').fill('Bob'); field('amb-apply-last').fill('D')
    field('amb-apply-email').fill('bob@example.test'); field('amb-apply-country').fill('fr')
    tid('amb-profile-papa').click()
    tid('amb-apply-send').click(); wait(1)
    check('engagements obligatoires', pg.get_by_text('accepte les deux engagements').count() > 0)
    pg.get_by_label('J’accepte les conditions du programme HOMI Ambassadors.').click()
    pg.get_by_label('Je présenterai HOMI honnêtement', exact=False).click()
    tid('amb-apply-send').click(); wait(4)
    ap = [c for c in CALLS if c[0] == 'affiliate_apply']
    check('candidature envoyée (pays en majuscules, version des conditions)', bool(ap) and ap[-1][1]['p_country'] == 'FR' and ap[-1][1]['p_terms_version'].startswith('v1'), str(ap[-1][1] if ap else None))
    check('tableau de bord : en attente', path().startswith('/ambassadors/dashboard') and pg.get_by_text('En attente de validation').count() > 0, path())

    # D. administration : validation puis versement
    BOB_ID = next(a['id'] for a in fake.t('affiliates') if a['user_id'] == BOB)
    fake.t('affiliate_ledger').extend([{'affiliate_id': BOB_ID, 'status': 'available', 'kind': 'commission', 'amount_minor': 318, 'currency': 'EUR'},
                                        {'affiliate_id': BOB_ID, 'status': 'available', 'kind': 'adjustment', 'amount_minor': 3000, 'currency': 'EUR'}])
    sign_out(); sign_in('staff@example.test')
    pg.goto(B + '/admin/ambassadors'); wait(4)
    check('admin : candidature en attente listée', tid('amb-admin-bob-papa').count() == 1)
    tid('amb-admin-bob-papa-active').click(); wait(3)
    check('admin : validée', next(a for a in fake.t('affiliates') if a['id'] == BOB_ID)['status'] == 'active')
    tid('amb-admin-f-active').click(); wait(2)
    card = tid('amb-admin-bob-papa')
    check('finance : disponible 33,18 €', '33,18' in card.inner_text(), card.inner_text()[:200])
    card.get_by_label('Référence du virement').fill('VIR-2026-001')
    card.get_by_text('Marquer comme versé').click(); wait(3)
    po = [c for c in CALLS if c[0] == 'affiliate_record_payout']
    check('versement manuel enregistré avec référence', bool(po) and po[-1][1] == {'p_affiliate': BOB_ID, 'p_currency': 'EUR', 'p_reference': 'VIR-2026-001'}, str(po))
    pg.screenshot(path=os.path.join(SHOTS, 'd-admin.png'), full_page=True)

    sign_out(); sign_in('bob@example.test')
    pg.goto(B + '/ambassadors/dashboard'); wait(4)
    link = tid('amb-dash-link').inner_text()
    check('ambassadeur actif : lien de partage', '/r/bob-papa' in link, link[:120])
    body = pg.inner_text('body')
    check('tableau de bord : agrégats, aucun e-mail client', 'Abonnés payants' in body and 'sarah@' not in body and 'example.test' not in body)
    check('aucun débordement horizontal', pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
    pg.screenshot(path=os.path.join(SHOTS, 'e-tableau-de-bord.png'), full_page=True)
    check('aucune erreur JavaScript', not errs, '; '.join(errs[:3]))
    b.close()

print(f'{sum(RES)}/{len(RES)}')
sys.exit(0 if all(RES) else 1)
