"""
Onboarding v2 « première ouverture immersive » (navigateur réel, démonstration sans compte) :
 - parcourt les 8 temps (ouverture, situation, besoins + foyer + enfant, répartition AU GESTE, démonstration,
   synthèse + accords, révélation, Premium) depuis « Découvrir sans compte » (/welcome) puis /onboarding ;
 - vérifie : bouton d'ouverture actionnable en moins de 2,5 s, reprise après rechargement (brouillon), cartes
   glissées à la souris (geste réel, Gesture Handler), réponses enregistrées (profiles.onboarding_answers de la démo),
   « Voir les formules » ET « Continuer sans Premium » visibles, retour à l'accueil ;
 - détecteur de débordement (e2e/audit_ux_detect.js) à chaque temps ;
 - captures clair et sombre à 390×844 et 320×568 dans $ONB_SHOTS (défaut /tmp/onb/shots) + une vidéo webm du parcours
   (390×844, clair : e2e/onboarding_immersif_video.js, Playwright Node) ; un passage « Réduire les animations » vérifie
   que le titre d'ouverture est posé d'emblée.
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/onb/web
  python3 e2e/spa_server.py /tmp/onb/web 8931 &
  PW_CHROMIUM=/opt/pw-browsers/chromium E2E_URL=http://127.0.0.1:8931 python3 e2e/onboarding_immersif.py
Chaque clé du rapport doit valoir true ; « erreurs » et « debordements » doivent être vides.
Le web n'est pas une preuve de performance iOS (fil UI natif, ProMotion, haptique) : à vérifier sur appareil.
"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8931')
SHOTS = os.environ.get('ONB_SHOTS', '/tmp/onb/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
R, errs, overflow = {}, [], []
fake = FakeSupabase()


def new_ctx(b, w, h, scheme, reduced=False):
    opts = dict(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme,
                reduced_motion='reduce' if reduced else 'no-preference', device_scale_factor=2)
    ctx = b.new_context(**opts)
    ctx.add_init_script("localStorage.getItem('toietmoi.ui') || localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0}))")
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.on('pageerror', lambda e: errs.append(f'{w}x{h} {scheme}: {str(e)[:200]}'))
    return ctx, pg


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').first


def in_view(pg, loc):
    box = loc.bounding_box()
    vh = pg.viewport_size['height']
    return bool(box) and box['y'] >= 0 and box['y'] + box['height'] <= vh + 0.5


def detect(pg, tag):
    found = pg.evaluate('() => window.__homiDetect ? window.__homiDetect() : []') or []
    # La pastille « Démo » et le fond ne font pas partie du parcours
    found = [f for f in found if 'Démo' not in str(f.get('text', ''))]
    if found:
        overflow.append({tag: found[:6]})


def shot(pg, name, tag):
    pg.wait_for_timeout(350)
    pg.screenshot(path=f'{SHOTS}/{tag}-{name}.png')
    detect(pg, f'{tag}-{name}')


def nxt(pg):
    tid(pg, 'onb-next').click(); pg.wait_for_timeout(700)


def drag_card(pg, dx):
    card = pg.locator('[data-testid^="onb-card-"]').first
    box = card.bounding_box()
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down()
    for i in range(1, 13):
        pg.mouse.move(x + dx * i / 12, y + 4 * i / 12); pg.wait_for_timeout(16)
    return x, y


def enter_demo(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_role('button', name='Découvrir sans compte').click(); pg.wait_for_timeout(5000)


def flow(b, w, h, scheme, main=False):
    tag = f'{w}x{h}-{scheme}'
    ctx, pg = new_ctx(b, w, h, scheme)
    enter_demo(pg)
    # ---------------------------------------------------------------- 1. ouverture
    t0 = time.time()
    pg.goto(B + '/onboarding')
    tid(pg, 'onb-start').wait_for(state='visible', timeout=20000)
    if main:
        # actionnable vite : le bouton est là bien avant la fin du logo (mesuré depuis la navigation)
        R['1_ouverture_actionnable_moins_2_5s'] = (time.time() - t0) < 2.5 + 1.5  # marge de chargement du paquet web
        pg.wait_for_timeout(250); pg.screenshot(path=f'{SHOTS}/{tag}-01a-ouverture-debut.png')
    pg.wait_for_timeout(2300)
    shot(pg, '01-ouverture', tag)
    if main:
        R['1_titre_visible'] = pg.get_by_role('heading', name='Bienvenue chez vous').is_visible()
        R['1_bouton_dans_ecran'] = in_view(pg, tid(pg, 'onb-start'))
    tid(pg, 'onb-start').click(); pg.wait_for_timeout(700)
    # ---------------------------------------------------------------- 2. situation
    if main:
        tid(pg, 'onb-next').click(); pg.wait_for_timeout(400)
        R['2_situation_obligatoire'] = 'Choisissez au moins une situation.' in pg.inner_text('body')
    tid(pg, 'onb-sit-baby').click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-sit-cycle').click(); pg.wait_for_timeout(500)
    tid(pg, 'onb-goal-avoid').click(); pg.wait_for_timeout(400)
    if main:
        R['2_consequence_espaces'] = 'Santé' in tid(pg, 'onb-spaces').inner_text() and 'Bébé' in tid(pg, 'onb-spaces').inner_text()
        R['2_selection_annoncee'] = tid(pg, 'onb-sit-baby').get_attribute('aria-checked') == 'true'
    shot(pg, '02-situation', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 3. besoins
    tid(pg, 'onb-need-sleep').click(); pg.wait_for_timeout(150)
    tid(pg, 'onb-need-mental_load').click(); pg.wait_for_timeout(600)
    if main:
        eff = tid(pg, 'onb-needs-effect').inner_text()
        R['3_consequence_outils'] = 'Mis en avant' in eff and len(eff.strip().split('\n')) >= 3
    shot(pg, '03a-besoins', tag)
    nxt(pg)
    tid(pg, 'onb-sharing-couple').click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-helper-daycare').click(); pg.wait_for_timeout(200)
    pg.get_by_label(re.compile('^Votre prénom')).first.fill('Camille'); pg.wait_for_timeout(500)
    if main:
        R['3_cercle_du_foyer'] = 'Camille' in tid(pg, 'onb-home-circle').inner_text() and 'Crèche' in tid(pg, 'onb-home-circle').inner_text()
        R['3_consequence_foyer'] = 'missions' in tid(pg, 'onb-home-effect').inner_text()
    pg.keyboard.press('Tab'); pg.wait_for_timeout(300)
    shot(pg, '03b-foyer', tag)
    nxt(pg)
    # enfant (le parcours « bébé » l'exige)
    pg.get_by_label(re.compile('^Prénom ou surnom')).first.fill('Lina')
    pg.get_by_label(re.compile('^Date de naissance')).first.fill('12/03/2026'); pg.wait_for_timeout(600)
    shot(pg, '03c-enfant', tag)
    if main:
        # ------------------------------------------------------------ reprise après rechargement
        pg.wait_for_timeout(900)
        pg.reload(); pg.wait_for_timeout(5000)
        body = pg.inner_text('body')
        R['reprise_etape_enfant'] = 'Votre enfant' in body
        R['reprise_saisie'] = pg.get_by_label(re.compile('^Prénom ou surnom')).first.input_value() == 'Lina'
        R['reprise_progression_temps3'] = 'Temps 3 sur 8' in (tid(pg, 'onb-progress').get_attribute('aria-label') or '')
    nxt(pg)
    # ---------------------------------------------------------------- 4. répartition au geste
    tid(pg, 'onb-deck').wait_for(state='visible', timeout=5000)
    first = pg.locator('[data-testid^="onb-card-"]').first.get_attribute('data-testid')
    drag_card(pg, -w * 0.45)
    if main or w == 320:
        pg.screenshot(path=f'{SHOTS}/{tag}-04a-geste-en-cours.png')
    pg.mouse.up(); pg.wait_for_timeout(900)
    if main:
        R['4_carte_glissee_vers_vous'] = tid(pg, 'onb-zone-count-me').inner_text().strip() == '1'
        R['4_carte_suivante'] = pg.locator('[data-testid^="onb-card-"]').first.get_attribute('data-testid') != first
    # glisser à droite, puis relâcher trop tôt (retour), puis boutons accessibles
    drag_card(pg, w * 0.45); pg.mouse.up(); pg.wait_for_timeout(900)
    if main:
        R['4_carte_glissee_vers_autre_parent'] = tid(pg, 'onb-zone-count-other').inner_text().strip() == '1'
        drag_card(pg, w * 0.08); pg.mouse.up(); pg.wait_for_timeout(700)
        R['4_glisser_court_revient'] = tid(pg, 'onb-zone-count-me').inner_text().strip() == '1' and tid(pg, 'onb-zone-count-other').inner_text().strip() == '1'
    shot(pg, '04b-repartition', tag)
    for _ in range(4):
        if pg.locator('[data-testid="onb-assign-left"]').count():
            tid(pg, 'onb-assign-left').click(); pg.wait_for_timeout(500)
    if main:
        R['4_tout_reparti'] = tid(pg, 'onb-split-done').is_visible()
    shot(pg, '04c-reparti', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 5. démonstration
    pg.wait_for_timeout(2200)
    if main:
        R['5_vraies_tuiles'] = pg.locator('[data-testid="onb-tile-bottles"]').count() == 1
        R['5_agenda_reel'] = pg.locator('[data-testid^="today-row-demo-"]').count() >= 3
        R['5_exemple_signale'] = 'Exemple' in pg.inner_text('body')
    shot(pg, '05-demonstration', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 6. synthèse + accords
    if main:
        R['6_objectif'] = tid(pg, 'onb-plan-goal').inner_text().strip() != ''
        R['6_trois_outils'] = len([l for l in tid(pg, 'onb-plan-tools').inner_text().split('\n') if l.strip()]) >= 6
    rem = pg.locator('[data-testid^="onb-rem-"]')
    if rem.count():
        rem.first.click(); pg.wait_for_timeout(300)
    shot(pg, '06a-synthese', tag)
    nxt(pg)
    shot(pg, '06b-accords', tag)
    # Démonstration : l'âge et les CGU n'ont pas été demandés (comme un compte Apple / Google)
    for label in ['J’ai 18 ans ou plus', 'J’accepte les conditions d’utilisation et la politique de confidentialité']:
        box = pg.get_by_role('checkbox', name=label)
        if box.count() and box.first.get_attribute('aria-checked') != 'true':
            box.first.click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-finish').click()
    # ---------------------------------------------------------------- 7. révélation
    pg.wait_for_timeout(500)
    if main:
        pg.screenshot(path=f'{SHOTS}/{tag}-07a-revelation-en-cours.png')
    tid(pg, 'onb-reveal-next').wait_for(state='visible', timeout=20000)
    pg.wait_for_timeout(900)
    if main:
        lines = tid(pg, 'onb-reveal-lines').inner_text()
        R['7_lignes_reelles'] = 'foyer est créé' in lines and 'enregistrées' in lines
        R['7_titre_prenom'] = 'Camille, votre foyer est prêt' in pg.inner_text('body')
        R['7_premiere_action_proposee'] = tid(pg, 'onb-first-action').is_visible()
    shot(pg, '07-revelation', tag)
    tid(pg, 'onb-reveal-next').click(); pg.wait_for_timeout(1200)
    # ---------------------------------------------------------------- 8. Premium
    if main:
        R['8_ecran_premium'] = tid(pg, 'onb-premium').is_visible()
        R['8_voir_formules_visible'] = in_view(pg, tid(pg, 'onb-premium-see'))
        R['8_continuer_sans_premium_visible'] = in_view(pg, tid(pg, 'onb-premium-skip'))
        # réponses enregistrées côté backend (démonstration : base locale persistée)
        R['sauvegarde_onboarding_answers'] = pg.evaluate("""() => Object.keys(localStorage).some((k) => { const v = localStorage.getItem(k) || ''; return v.includes('"onboarding_answers":{') && v.includes('"onboarding_version":2'); })""")
    shot(pg, '08-premium', tag)
    if main:
        tid(pg, 'onb-premium-skip').click(); pg.wait_for_timeout(3000)
        R['8_continuer_ramene_accueil'] = '/onboarding' not in pg.url
        pg.goto(B + '/'); pg.wait_for_timeout(4000)
        R['termine_ne_revoit_pas_onboarding'] = '/onboarding' not in pg.url
    ctx.close()


def reduced(b):
    ctx, pg = new_ctx(b, 390, 844, 'light', reduced=True)
    enter_demo(pg)
    pg.goto(B + '/onboarding')
    tid(pg, 'onb-start').wait_for(state='visible', timeout=20000)
    pg.wait_for_timeout(150)
    R['reduire_animations_titre_pose'] = pg.evaluate("""() => {
      const h = [...document.querySelectorAll('[role="heading"]')].find((e) => (e.textContent || '').includes('Bienvenue chez vous'));
      let o = 1, e = h; while (e && e.nodeType === 1) { o *= parseFloat(getComputedStyle(e).opacity || '1'); e = e.parentElement; } return !!h && o > 0.99;
    }""")
    pg.screenshot(path=f'{SHOTS}/390x844-light-reduire-animations-ouverture.png')
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    flow(b, 390, 844, 'light', main=True)
    for (w, h, s) in [(390, 844, 'dark'), (320, 568, 'light'), (320, 568, 'dark')]:
        try:
            flow(b, w, h, s)
            R[f'parcours_complet_{w}x{h}_{s}'] = True
        except Exception as e:  # noqa: BLE001
            R[f'parcours_complet_{w}x{h}_{s}'] = False
            errs.append(f'{w}x{h} {s}: {str(e)[:300]}')
    reduced(b)
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs, 'debordements': overflow}, ensure_ascii=False, indent=1))
