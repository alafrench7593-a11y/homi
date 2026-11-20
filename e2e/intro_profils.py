"""
Introduction de première ouverture « Je suis… » (navigateur, aucun compte) :
 - première ouverture (stockage vide) : « / » mène à /intro, plus à la keynote ;
 - les 5 profils : chacun fait défiler 3 tableaux (une phrase + de vrais composants), le choix est gardé dans le
   brouillon local `intro.profile` ;
 - « Passer » mène à la dernière page (Commencer / J'ai déjà un compte / Découvrir sans compte) ;
 - balayage horizontal (souris) : avance et recule d'un tableau ; sans profil, le geste ne quitte pas « Je suis… » ;
 - Réduire les animations : la page choisie est posée en < 100 ms, sans glissement ;
 - aucune barre de défilement horizontale (320 pt), aucun texte coupé dans le pied ;
 - « Découvrir sans compte » ouvre l'accueil ; « Commencer » ouvre l'inscription ;
 - captures 320×568, 390×844, 430×932, clair et sombre, de deux profils ($INTRO_SHOTS).
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \\
    npx expo export --platform web --clear --output-dir /tmp/intro/web
  python3 e2e/spa_server.py /tmp/intro/web 8951 &
  E2E_URL=http://127.0.0.1:8951 INTRO_SHOTS=/tmp/intro/shots python3 e2e/intro_profils.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8951')
SHOTS = os.environ.get('INTRO_SHOTS', '/tmp/intro/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
R, errs = {}, []
fake = FakeSupabase()
PROFILES = ['pregnant', 'newborn', 'child', 'coparent', 'explore']
SCENES = {
    'pregnant': ['pregTiles', 'nextAction', 'pregTools'], 'newborn': ['feedTimer', 'babyTiles', 'familyProfiles'],
    'child': ['kidProfiles', 'weekPlan', 'kidTools'], 'coparent': ['careBook', 'split', 'coparentTools'],
    'explore': ['categories', 'everyone', 'today'],
}


def new_ctx(b, w, h, scheme='light', reduced=False):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme,
                        reduced_motion='reduce' if reduced else 'no-preference', device_scale_factor=2)
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.on('pageerror', lambda e: errs.append(f'{w}x{h} {scheme}: {str(e)[:200]}'))
    return ctx, pg


def visible(pg, t):
    loc = pg.locator(f'[data-testid="{t}"]')
    return any(loc.nth(i).is_visible() for i in range(loc.count()))


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]:visible').first


def page_on_screen(pg, n):
    """La page n est posée : son bord gauche est à 0 (à 2 px près)."""
    loc = pg.locator(f'[data-testid="intro-page-{n}"]')
    if not loc.count():
        return False
    b = loc.first.bounding_box()
    return bool(b) and abs(b['x']) <= 2


def wait_page(pg, n, ms=2500):
    for _ in range(ms // 50):
        if page_on_screen(pg, n):
            return True
        pg.wait_for_timeout(50)
    return False


def open_intro(pg):
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    return '/intro' in pg.url and visible(pg, 'intro-who-title')


def swipe(pg, dx):
    b = tid(pg, 'intro-stage').bounding_box()
    y = b['y'] + b['height'] * 0.5
    x0 = b['x'] + (b['width'] * (0.8 if dx < 0 else 0.2))
    pg.mouse.move(x0, y); pg.mouse.down()
    steps = 12
    for i in range(1, steps + 1):
        pg.mouse.move(x0 + dx * i / steps, y + i * 0.3); pg.wait_for_timeout(16)
    pg.mouse.up(); pg.wait_for_timeout(700)


def no_hscroll(pg):
    return pg.evaluate('() => document.scrollingElement.scrollWidth <= window.innerWidth + 1')


def profile_tour(b, p, w=390, h=844, scheme='light', shots=False):
    tag = f'{w}x{h}-{scheme}'
    ctx, pg = new_ctx(b, w, h, scheme)
    ok = open_intro(pg)
    R[f'{p}_{tag}_premiere_ouverture_intro'] = ok
    if shots:
        pg.screenshot(path=f'{SHOTS}/{tag}-{p}-0-je-suis.png')
    tid(pg, f'intro-profile-{p}').click()
    for k, scene in enumerate(SCENES[p], start=1):
        R[f'{p}_{tag}_tableau_{k}'] = wait_page(pg, k) and visible(pg, f'intro-scene-{scene}')
        R[f'{p}_{tag}_tableau_{k}_sans_defilement_horizontal'] = no_hscroll(pg)
        pg.wait_for_timeout(900)
        if shots:
            pg.screenshot(path=f'{SHOTS}/{tag}-{p}-{k}-{scene}.png')
        tid(pg, 'intro-next').click()
    R[f'{p}_{tag}_fin'] = wait_page(pg, 4) and visible(pg, 'intro-start') and visible(pg, 'intro-demo') and visible(pg, 'intro-sign-in')
    if shots:
        pg.wait_for_timeout(500)
        pg.screenshot(path=f'{SHOTS}/{tag}-{p}-4-commencer.png')
    saved = pg.evaluate("() => localStorage.getItem('intro.profile')")
    R[f'{p}_{tag}_brouillon_intro_profile'] = bool(saved) and json.loads(saved).get('profile') == p
    # pied : « Commencer » sur une ligne (hauteur d'un bouton)
    hb = tid(pg, 'intro-start').bounding_box()
    R[f'{p}_{tag}_commencer_une_ligne'] = bool(hb) and hb['height'] <= 64
    ctx.close()


def skip_swipe_reduce(b):
    # Passer
    ctx, pg = new_ctx(b, 390, 844)
    open_intro(pg)
    tid(pg, 'intro-skip').click()
    R['passer_mene_a_la_fin'] = wait_page(pg, 4) and visible(pg, 'intro-start')
    ctx.close()
    # balayage sans profil : reste sur « Je suis… »
    ctx, pg = new_ctx(b, 390, 844)
    open_intro(pg)
    swipe(pg, -260)
    R['balayage_sans_profil_reste'] = page_on_screen(pg, 0)
    tid(pg, 'intro-profile-newborn').click(); wait_page(pg, 1)
    swipe(pg, -260)
    R['balayage_avance'] = wait_page(pg, 2)
    swipe(pg, 260)
    R['balayage_recule'] = wait_page(pg, 1)
    # le doigt entraîne la page : pendant le geste, elle est à mi-chemin
    b0 = tid(pg, 'intro-stage').bounding_box()
    y = b0['y'] + b0['height'] / 2
    pg.mouse.move(b0['x'] + 300, y); pg.mouse.down()
    for i in range(1, 8):
        pg.mouse.move(b0['x'] + 300 - i * 15, y); pg.wait_for_timeout(16)
    mid = pg.locator('[data-testid="intro-page-1"]').first.bounding_box()
    R['la_page_suit_le_doigt'] = bool(mid) and -140 < mid['x'] < -40
    # le doigt s'arrête avant de se lever (aucun lancer) : sous le tiers de la largeur, la page revient
    for _ in range(6):
        pg.mouse.move(b0['x'] + 300 - 105, y); pg.wait_for_timeout(40)
    pg.mouse.up(); pg.wait_for_timeout(700)
    R['petit_geste_revient'] = page_on_screen(pg, 1)
    # « Découvrir sans compte » → accueil de la démonstration
    tid(pg, 'intro-skip').click(); wait_page(pg, 4)
    tid(pg, 'intro-demo').click(); pg.wait_for_timeout(5000)
    R['decouvrir_sans_compte_ouvre_l_accueil'] = '/intro' not in pg.url and not pg.url.rstrip('/').endswith('/welcome')
    ctx.close()
    # « Commencer » → inscription ; l'introduction n'est plus rejouée
    ctx, pg = new_ctx(b, 390, 844)
    open_intro(pg)
    tid(pg, 'intro-skip').click(); wait_page(pg, 4)
    tid(pg, 'intro-start').click(); pg.wait_for_timeout(2000)
    R['commencer_ouvre_l_inscription'] = '/auth/sign-up' in pg.url
    pg.goto(B + '/'); pg.wait_for_timeout(3000)
    R['intro_jouee_une_fois'] = '/intro' not in pg.url
    ctx.close()
    # Réduire les animations : page posée immédiatement
    ctx, pg = new_ctx(b, 390, 844, reduced=True)
    open_intro(pg)
    tid(pg, 'intro-profile-pregnant').click()
    pg.wait_for_timeout(100)
    R['reduire_animations_page_posee_100ms'] = page_on_screen(pg, 1)
    pg.screenshot(path=f'{SHOTS}/390x844-light-reduire-animations.png')
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    for prof in PROFILES:
        try:
            profile_tour(b, prof)
        except Exception as e:  # noqa: BLE001
            R[f'{prof}_parcours'] = False
            errs.append(f'{prof}: {str(e)[:300]}')
    for (w, h) in [(320, 568), (390, 844), (430, 932)]:
        for s in ['light', 'dark']:
            for prof in ['pregnant', 'newborn']:
                try:
                    profile_tour(b, prof, w, h, s, shots=True)
                except Exception as e:  # noqa: BLE001
                    R[f'{prof}_{w}x{h}_{s}_parcours'] = False
                    errs.append(f'{prof} {w}x{h} {s}: {str(e)[:300]}')
    try:
        skip_swipe_reduce(b)
    except Exception as e:  # noqa: BLE001
        R['passer_balayage_reduire'] = False
        errs.append(f'passer/balayage : {str(e)[:500]}')
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
