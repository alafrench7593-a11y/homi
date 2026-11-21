"""
Personnalisation (20/11/2026) — accueil et catalogue sur l'export web en mode démonstration, profils fictifs A, B, D, F, G
de la propriétaire (mêmes faits que src/__tests__/fixtures/personas.ts), injectés dans la base de démonstration :
réponses d'onboarding v3, grossesse, enfants (âges relatifs à aujourd'hui), parcours, nounou associée.
Vérifie : « Pour toi aujourd'hui » (outils attendus + raison en petit), « Ton enfant » (et son changement d'enfant
pour F), « Explorer les outils » (barre de recherche), catalogue filtré (puces combinables, état vide utile,
entrées « à découvrir »), catalogue accessible sans onboarding terminé (G), « Ne plus me proposer » (masqué).
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/p2/web
  python3 e2e/spa_server.py /tmp/p2/web 5xxxx &
  PW_CHROMIUM=/opt/pw-browsers/chromium E2E_URL=http://127.0.0.1:5xxxx P2_SHOTS=/tmp/p2/shots python3 e2e/personnalisation.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime  # noqa: E402
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8931')
SHOTS = os.environ.get('P2_SHOTS', '/tmp/p2/shots'); os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
R, errs = {}, []
fake = FakeSupabase()

SET_PERSONA = """([p]) => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  const hid = s.tables.household_members.find((m) => m.user_id === me).household_id;
  const now = new Date().toISOString();
  const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const prof = s.tables.profiles.find((x) => x.id === me);
  prof.onboarding_completed = p.completed !== false; prof.onboarding_answers = p.answers || null; prof.onboarding_version = p.answers ? 3 : null; prof.display_name = 'Camille';
  s.tables.children = (p.children || []).map((c) => ({ id: c.id, household_id: hid, first_name: c.name, birth_date: day(c.days), sex: null, photo_path: null, from_pregnancy_id: null, multiple_group: null, enabled_tracking: ['bottle', 'diaper', 'sleep', 'meal', 'growth'], allergies_declared: [], habits: null, archived: false, created_at: now }));
  s.tables.pregnancies = p.dueIn ? [{ id: 'pp1', household_id: hid, carrier_user_id: me, due_date: day(-p.dueIn), lmp_date: null, due_date_source: 'professional', multiplicity: 'single', status: 'active', reminders_wanted: [], topics: [], created_at: now }] : [];
  const row = (type, extra) => ({ id: 'e2e-' + type + (extra.child_id || ''), user_id: me, household_id: hid, type, status: 'active', started_on: day(30), ended_on: null, end_reason: null, pregnancy_id: null, child_id: null, created_at: now, ...extra });
  s.tables.user_journeys = [
    ...(p.dueIn ? [row('pregnancy', { pregnancy_id: 'pp1' })] : []),
    ...(p.postpartum ? [row('postpartum', {})] : []),
    ...(p.children || []).map((c) => row(c.days < 730 ? 'baby' : 'child', { child_id: c.id })),
  ];
  s.tables.household_members = s.tables.household_members.filter((m) => m.user_id === me);
  if (p.nanny) s.tables.household_members.push({ household_id: hid, user_id: 'e2e-nanny', role: 'caregiver', joined_at: now });
  s.tables.food_introductions = [];
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
  const raw = localStorage.getItem('toietmoi.ui'); const v = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  v.state = { ...(v.state || {}), simpleMode: false, toolFavorites: [], toolPinned: [], toolHidden: [], subject: p.subject || { type: 'me' } };
  localStorage.setItem('toietmoi.ui', JSON.stringify(v));
  localStorage.removeItem('homi.recentTools');
}"""

A3 = lambda **k: {'v': 3, 'profile': [], 'household': 'partner', 'invite': False, 'feeding': None, 'priorities': [], **k}
PERSONAS = {
    'A': {'answers': A3(profile=['pregnant'], priorities=['pregnancy', 'appointments']), 'dueIn': 120},
    'B': {'answers': A3(profile=['new_baby'], feeding='breast', priorities=['sleep']), 'postpartum': True, 'children': [{'id': 'lina', 'name': 'Lina', 'days': 66}], 'subject': {'type': 'child', 'id': 'lina'}},
    'D': {'answers': A3(profile=['kids'], priorities=['school', 'activities']), 'children': [{'id': 'noe', 'name': 'Noé', 'days': 2270}], 'subject': {'type': 'child', 'id': 'noe'}},
    'F': {'answers': A3(profile=['kids', 'new_baby'], feeding='formula', priorities=['childcare_days', 'meals']), 'postpartum': True, 'nanny': True,
          'children': [{'id': 'lea', 'name': 'Léa', 'days': 130}, {'id': 'tom', 'name': 'Tom', 'days': 1660}, {'id': 'zoe', 'name': 'Zoé', 'days': 2780}], 'subject': {'type': 'child', 'id': 'zoe'}},
    'G': {'completed': False},
}


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def ctx_for(b, w, h):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
    ctx.add_init_script("localStorage.getItem('toietmoi.ui') || localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0}))")
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.on('pageerror', lambda e: errs.append(f'{w}x{h}: {str(e)[:200]}'))
    return ctx, pg


def setup(b, key, w, h):
    ctx, pg = ctx_for(b, w, h)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(5000)
    pg.evaluate(SET_PERSONA, [PERSONAS[key]])
    pg.evaluate(PREMIUM_ON)
    return ctx, pg


def home(pg, key, w, h):
    pg.goto(B + '/'); pg.wait_for_timeout(6000)
    tid(pg, 'home-for-you').wait_for(state='visible', timeout=20000)
    pg.wait_for_timeout(800)
    pg.screenshot(path=f'{SHOTS}/{w}x{h}-accueil-{key}.png', full_page=True)
    return tid(pg, 'home-for-you').inner_text()


def explore_shot(pg, key, w, h):
    loc = tid(pg, 'home-for-you')
    loc.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SHOTS}/{w}x{h}-accueil-{key}-pour-toi.png')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    for (w, h) in [(390, 844), (320, 568)]:
        main = w == 390
        # ---------------------------------------------------------------- A : femme enceinte
        ctx, pg = setup(b, 'A', w, h)
        t = home(pg, 'A', w, h); explore_shot(pg, 'A', w, h)
        if main:
            R['A_grossesse_en_tete'] = 'Ma grossesse semaine par semaine' in t and 'Parce que vous êtes enceinte' in t
            R['A_pas_de_biberon'] = 'Noter un biberon' not in t and 'Couches' not in t
            R['A_pas_de_ton_enfant'] = pg.locator('[data-testid="home-your-child"]').count() == 0
            R['A_barre_de_recherche_accueil'] = tid(pg, 'home-search').is_visible() if pg.locator('[data-testid="home-search"]').count() else False
        ctx.close()
        # ---------------------------------------------------------------- B : bébé de 2 mois allaité
        ctx, pg = setup(b, 'B', w, h)
        t = home(pg, 'B', w, h); explore_shot(pg, 'B', w, h)
        if main:
            R['B_allaitement_raison'] = 'Allaitement' in t and 'Parce que vous allaitez' in t
            R['B_age_raison'] = 'Parce que Lina a 2 mois' in t
            R['B_ton_enfant_lina'] = 'Lina' in tid(pg, 'home-your-child').inner_text()
            # appui long : « Ne plus me proposer » → l'outil disparaît (rien n'est supprimé, rétablissable)
            tile = pg.locator('[data-testid^="home-for-you-"]').filter(has_text='Allaitement').first
            tile.click(delay=900); pg.wait_for_timeout(900)
            if pg.locator('[data-testid="home-for-you-hide"]').count():
                tid(pg, 'home-for-you-hide').click(); pg.wait_for_timeout(1200)
                R['B_masque_jamais_propose'] = pg.locator('[data-testid="home-for-you-baby_breastfeed"]').count() == 0
                R['B_masque_enregistre'] = pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.ui')).state.toolHidden || []).includes('baby_breastfeed')")
            else:
                R['B_masque_jamais_propose'] = False
            # catalogue filtré : Âge 0–6 mois × Sommeil
            pg.goto(B + '/tools'); pg.wait_for_timeout(4000)
            tid(pg, 'tools-filter-toggle').click(); pg.wait_for_timeout(500)
            tid(pg, 'tools-filter-age-infant_0_6').click(); pg.wait_for_timeout(300)
            tid(pg, 'tools-filter-cat-sleep').click(); pg.wait_for_timeout(800)
            ft = tid(pg, 'tools-filtered').inner_text()
            R['B_filtre_age_categorie'] = 'Sommeil de l’enfant' in ft and 'Mon sommeil' not in ft
            pg.screenshot(path=f'{SHOTS}/{w}x{h}-catalogue-filtre-B.png', full_page=True)
            tid(pg, 'tools-filter-favorites').click(); pg.wait_for_timeout(600)
            R['B_etat_vide_utile'] = tid(pg, 'tools-filtered-empty').is_visible() and 'Effacer les filtres' in tid(pg, 'tools-filtered').inner_text()
            pg.screenshot(path=f'{SHOTS}/{w}x{h}-catalogue-filtre-vide.png')
        ctx.close()
        # ---------------------------------------------------------------- D : enfant de 6 ans
        ctx, pg = setup(b, 'D', w, h)
        t = home(pg, 'D', w, h); explore_shot(pg, 'D', w, h)
        if main:
            R['D_ecole_proposee'] = 'École ou mode de garde' in t
            R['D_pas_de_bebe'] = 'Couches' not in t and 'Allaitement' not in t
            R['D_ton_enfant_noe'] = 'Noé' in tid(pg, 'home-your-child').inner_text() and 'Parce que Noé a 6 ans' in tid(pg, 'home-your-child').inner_text()
        ctx.close()
        # ---------------------------------------------------------------- F : trois enfants, changer d'enfant
        ctx, pg = setup(b, 'F', w, h)
        t = home(pg, 'F', w, h); explore_shot(pg, 'F', w, h)
        if main:
            R['F_nounou_carnet'] = 'Carnet de liaison numérique' in t or 'Garde et nounou' in t
            zoe = tid(pg, 'home-your-child').inner_text()
            R['F_ton_enfant_zoe'] = 'Zoé' in zoe and 'Routines en images' in zoe
            pg.evaluate("() => { const v = JSON.parse(localStorage.getItem('toietmoi.ui')); v.state.subject = { type: 'child', id: 'lea' }; localStorage.setItem('toietmoi.ui', JSON.stringify(v)); }")
            home(pg, 'F-lea', w, h)
            lea = tid(pg, 'home-your-child').inner_text()
            R['F_changer_enfant_adapte'] = 'Léa' in lea and 'Routines en images' not in lea and ('Noter un biberon' in lea or 'Sommeil de l’enfant' in lea)
        ctx.close()
        # ---------------------------------------------------------------- G : sans informations
        ctx, pg = setup(b, 'G', w, h)
        pg.goto(B + '/tools'); pg.wait_for_timeout(5000)
        if main:
            R['G_catalogue_sans_onboarding'] = '/tools' in pg.url and '/onboarding' not in pg.url
        if pg.locator('[data-testid="tools-filter-toggle"]').count():
            tid(pg, 'tools-filter-toggle').click(); pg.wait_for_timeout(500)
            tid(pg, 'tools-filter-cat-feeding').click(); pg.wait_for_timeout(900)
            if main:
                R['G_tout_explorable_a_decouvrir'] = tid(pg, 'tools-filtered-locked').is_visible() and 'Allaitement' in tid(pg, 'tools-filtered-locked').inner_text()
                tid(pg, 'tools-locked-baby_breastfeed').click(); pg.wait_for_timeout(1000)
                R['G_fiche_mene_au_parcours'] = tid(pg, 'tool-sheet-locked').is_visible() and 'Ajouter ce profil' in tid(pg, 'tool-sheet-start').inner_text()
            pg.screenshot(path=f'{SHOTS}/{w}x{h}-catalogue-G-a-decouvrir.png', full_page=True)
        elif main:
            R['G_tout_explorable_a_decouvrir'] = False
        # accueil de G (onboarding non terminé : on le marque terminé sans réponse, pour voir l'accueil « découvrir »)
        pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.profiles[0].onboarding_completed = true; localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
        t = home(pg, 'G', w, h); explore_shot(pg, 'G', w, h)
        if main:
            R['G_decouvrir'] = 'Pour découvrir HOMI' in t
            R['G_explorer_les_outils'] = tid(pg, 'home-explore-all').is_visible() if pg.locator('[data-testid="home-explore-all"]').count() else False
        ctx.close()
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
