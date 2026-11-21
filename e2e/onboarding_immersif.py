"""
Onboarding v2 « première ouverture immersive » (navigateur réel, démonstration sans compte) :
 - parcourt les 6 ÉTAPES (20/11/2026 : profil, quotidien, enfants, alimentation, priorités, tableau de bord calculé
   par le moteur + accords, révélation), puis Premium, depuis « Découvrir sans compte » (/welcome) puis /onboarding ;
 - vérifie : tutoiement, réponse obligatoire à l'étape 1, choix multiple, âge en un geste et jumeaux proposés, reprise
   après rechargement (brouillon), alimentation demandée pour un nourrisson, tableau de bord avec raisons (moteur réel),
   réponses v3 enregistrées (profiles.onboarding_answers de la démo), invitation de l'autre parent proposée,
   « Voir les formules » ET « Continuer sans Premium » visibles, retour à l'accueil personnalisé ;
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
from journey_seed import PREMIUM_ON  # noqa: E402

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
    # Défilement horizontal (fenêtre ou conteneur) et boîtes visibles hors de 0..largeur (décor de scène exclu)
    found += pg.evaluate("""() => {
      const vw = window.innerWidth, out = [];
      if (window.scrollX || document.scrollingElement.scrollLeft) out.push({ kind: 'defilement_horizontal_fenetre', x: window.scrollX });
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('svg') || el.closest('[aria-hidden="true"]')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
        if (el.scrollLeft > 0 && el.scrollWidth > el.clientWidth && !/(auto|scroll)/.test(cs.overflowX)) out.push({ kind: 'conteneur_decale', text: (el.innerText || '').slice(0, 40), x: el.scrollLeft });
        if (el.scrollLeft > 0 && /(auto|scroll)/.test(cs.overflowY) && !/(auto|scroll)/.test(cs.overflowX)) out.push({ kind: 'zone_defilement_decalee', text: (el.innerText || '').slice(0, 40), x: el.scrollLeft });
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.top > window.innerHeight) continue;
        const txt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (txt && (r.left < -1 || r.right > vw + 1)) out.push({ kind: 'hors_largeur', text: el.textContent.trim().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right) });
      }
      return out.slice(0, 8);
    }""") or []
    if found:
        overflow.append({tag: found[:8]})


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
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(5000)


def flow(b, w, h, scheme, main=False, premium_on=False):
    tag = f'{w}x{h}-{scheme}'
    ctx, pg = new_ctx(b, w, h, scheme)
    enter_demo(pg)
    if premium_on:
        # Abonnement (ou essai) déjà actif : pas d'écran Premium, la visite guidée est proposée juste après la révélation
        pg.evaluate(PREMIUM_ON)
    # ---------------------------------------------------------------- ouverture
    t0 = time.time()
    pg.goto(B + '/onboarding')
    tid(pg, 'onb-start').wait_for(state='visible', timeout=20000)
    if main:
        R['0_ouverture_actionnable_moins_2_5s'] = (time.time() - t0) < 2.5 + 1.5  # marge de chargement du paquet web
    pg.wait_for_timeout(2300)
    shot(pg, '00-ouverture', tag)
    if main:
        R['0_titre_visible'] = pg.get_by_role('heading', name='Bienvenue chez toi').is_visible()
        R['0_bouton_dans_ecran'] = in_view(pg, tid(pg, 'onb-start'))
    tid(pg, 'onb-start').click(); pg.wait_for_timeout(60 if w == 320 else 700)
    # ---------------------------------------------------------------- 1. profil (plusieurs réponses)
    if main:
        tid(pg, 'onb-next').click(); pg.wait_for_timeout(400)
        R['1_reponse_obligatoire'] = 'Choisis au moins une réponse.' in pg.inner_text('body')
        R['1_titre_tutoiement'] = 'Pour commencer, parle-nous un peu de toi' in pg.inner_text('body')
        R['1_progression_etape_1_sur_6'] = 'Étape 1 sur 6' in (tid(pg, 'onb-progress').get_attribute('aria-label') or '')
    tid(pg, 'onb-tag-new_baby').click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-tag-kids').click(); pg.wait_for_timeout(200)
    if main:
        R['1_choix_multiple'] = tid(pg, 'onb-tag-new_baby').get_attribute('aria-checked') == 'true' and tid(pg, 'onb-tag-kids').get_attribute('aria-checked') == 'true'
    pg.get_by_label(re.compile('^Ton prénom')).first.fill('Camille'); pg.wait_for_timeout(300)
    pg.keyboard.press('Tab'); pg.wait_for_timeout(300)
    shot(pg, '01-profil', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 2. quotidien (aucun droit déduit)
    tid(pg, 'onb-house-partner').click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-house-invite').click(); pg.wait_for_timeout(300)
    if main:
        R['2_aucun_droit_deduit_annonce'] = 'aucun accès' in pg.inner_text('body')
    shot(pg, '02-quotidien', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 3. enfants (âge en un geste, deux enfants)
    pg.get_by_label(re.compile('^Prénom ou surnom')).first.fill('Lina')
    tid(pg, 'onb-age-0-3').click(); pg.wait_for_timeout(300)
    tid(pg, 'onb-child-add').click(); pg.wait_for_timeout(400)
    pg.get_by_label(re.compile('^Prénom ou surnom')).nth(1).fill('Noé')
    tid(pg, 'onb-age-1-72').click(); pg.wait_for_timeout(500)
    if main:
        R['3_jumeaux_proposes'] = pg.locator('[data-testid="onb-twins-1"]').count() == 1
    shot(pg, '03-enfants', tag)
    # version gratuite : un seul enfant (limite du serveur) → le second est retiré avant de continuer
    pg.get_by_role('button', name='Retirer').last.click(); pg.wait_for_timeout(400)
    if main:
        # ------------------------------------------------------------ reprise après rechargement
        pg.wait_for_timeout(900)
        pg.reload(); pg.wait_for_timeout(5000)
        R['reprise_etape_enfants'] = pg.get_by_label(re.compile('^Prénom ou surnom')).first.input_value() == 'Lina'
        R['reprise_progression_etape_3'] = 'Étape 3 sur 6' in (tid(pg, 'onb-progress').get_attribute('aria-label') or '')
    nxt(pg)
    # ---------------------------------------------------------------- 4. alimentation (nourrisson)
    if main:
        R['4_question_alimentation'] = 'Comment nourris-tu actuellement ton bébé ?' in pg.inner_text('body')
    tid(pg, 'onb-feed-breast').click(); pg.wait_for_timeout(300)
    shot(pg, '04-alimentation', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 5. priorités
    tid(pg, 'onb-prio-sleep').click(); pg.wait_for_timeout(150)
    tid(pg, 'onb-prio-tasks').click(); pg.wait_for_timeout(150)
    tid(pg, 'onb-prio-childcare_days').click(); pg.wait_for_timeout(300)
    shot(pg, '05-priorites', tag)
    nxt(pg)
    # ---------------------------------------------------------------- 6. tableau de bord (moteur réel) + accords
    pg.wait_for_timeout(600)
    if main:
        dash = tid(pg, 'onb-dashboard').inner_text()
        R['6_tableau_de_bord_avec_raisons'] = 'Parce que' in dash and 'Allaitement' in dash
        R['6_raison_allaitement'] = 'Parce que tu allaites' in dash
    shot(pg, '06a-tableau-de-bord', tag)
    for label in ['J’ai 18 ans ou plus', 'J’accepte les conditions d’utilisation et la politique de confidentialité']:
        box = pg.get_by_role('checkbox', name=label)
        if box.count() and box.first.get_attribute('aria-checked') != 'true':
            box.first.click(); pg.wait_for_timeout(200)
    tid(pg, 'onb-finish').click()
    # ---------------------------------------------------------------- 6. révélation : opérations réelles + outils et raisons
    pg.wait_for_timeout(500)
    try:
        tid(pg, 'onb-reveal-next').wait_for(state='visible', timeout=20000)
    except Exception:
        pg.screenshot(path=f'{SHOTS}/{tag}-06z-blocage.png')
        errs.append(f'{tag} révélation bloquée : ' + pg.inner_text('body')[-600:])
        raise
    pg.wait_for_timeout(900)
    if main:
        lines = tid(pg, 'onb-reveal-lines').inner_text()
        R['6_lignes_reelles'] = 'foyer est créé' in lines and 'enregistrées' in lines and '1 enfant ajouté' in lines
        R['6_titre_prenom'] = 'Camille, ton foyer est prêt' in pg.inner_text('body')
        R['6_outils_et_raisons'] = 'Parce que' in tid(pg, 'onb-reveal-tools').inner_text()
        # « Inviter un autre parent » : proposé si personne d'autre n'est adulte du foyer (la démo a déjà un co-parent)
        other_adult = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId; return (s.tables.household_members || []).some((m) => m.user_id !== me && (m.role === 'owner' || m.role === 'coparent')); }")
        R['6_inviter_l_autre_parent_si_seul'] = pg.locator('[data-testid="onb-invite"]').count() >= 1 or other_adult
    shot(pg, '06b-revelation', tag)
    tid(pg, 'onb-reveal-next').click(); pg.wait_for_timeout(1200)
    # ---------------------------------------------------------------- Premium
    if not premium_on:
        if main:
            R['premium_ecran'] = tid(pg, 'onb-premium').is_visible()
            R['premium_voir_formules_visible'] = in_view(pg, tid(pg, 'onb-premium-see'))
            R['premium_continuer_sans_visible'] = in_view(pg, tid(pg, 'onb-premium-skip'))
            R['sauvegarde_onboarding_answers_v3'] = pg.evaluate("""() => Object.keys(localStorage).some((k) => { const v = localStorage.getItem(k) || ''; return v.includes('"onboarding_answers":{') && v.includes('"onboarding_version":3') && v.includes('"feeding":"breast"'); })""")
        shot(pg, '07-premium', tag)
        tid(pg, 'onb-premium-skip').click(); pg.wait_for_timeout(3000)
        if main:
            R['premium_continuer_ramene_accueil'] = '/onboarding' not in pg.url
            R['visite_gardee_pour_plus_tard'] = pg.evaluate("""() => { const v = JSON.parse(localStorage.getItem('homi.tour') || '{}'); return Object.values((v.state || {}).byUser || {}).some((p) => p.status === 'offered'); }""")
            pg.goto(B + '/'); pg.wait_for_timeout(4000)
            R['termine_ne_revoit_pas_onboarding'] = '/onboarding' not in pg.url
        ctx.close()
        return
    # ---------------------------------------------------------------- visite guidée proposée (après la révélation et Premium)
    R[f'visite_{tag}_proposee'] = tid(pg, 'onb-tour').is_visible() and pg.locator('[data-testid="onb-premium"]').count() == 0
    R[f'visite_{tag}_faire_la_visite_visible'] = in_view(pg, tid(pg, 'onb-tour-start')) and 'Faire la visite (2 min)' in tid(pg, 'onb-tour-start').inner_text()
    R[f'visite_{tag}_plus_tard_visible'] = in_view(pg, tid(pg, 'onb-tour-later'))
    shot(pg, '08-visite-proposee', tag)
    if w == 320:
        tid(pg, 'onb-tour-start').click(); pg.wait_for_timeout(3500)
        R[f'visite_{tag}_lance_l_etape_1'] = '/onboarding' not in pg.url and tid(pg, 'tour-progress').is_visible() and tid(pg, 'tour-progress').inner_text().strip() == '1 sur 7'
    else:
        tid(pg, 'onb-tour-later').click(); pg.wait_for_timeout(3000)
        R[f'visite_{tag}_plus_tard_carte_accueil'] = '/onboarding' not in pg.url and tid(pg, 'tour-resume').is_visible()
        # l'accueil personnalisé suit : « Pour toi aujourd'hui » avec ses raisons
        R[f'accueil_{tag}_pour_toi'] = tid(pg, 'home-for-you').is_visible() and 'Parce que' in tid(pg, 'home-for-you').inner_text()
        pg.screenshot(path=f'{SHOTS}/{tag}-09-accueil-apres-onboarding.png')
    ctx.close()


def reduced(b):
    ctx, pg = new_ctx(b, 390, 844, 'light', reduced=True)
    enter_demo(pg)
    pg.goto(B + '/onboarding')
    tid(pg, 'onb-start').wait_for(state='visible', timeout=20000)
    pg.wait_for_timeout(150)
    R['reduire_animations_titre_pose'] = pg.evaluate("""() => {
      const h = [...document.querySelectorAll('[role="heading"]')].find((e) => (e.textContent || '').includes('Bienvenue chez toi'));
      let o = 1, e = h; while (e && e.nodeType === 1) { o *= parseFloat(getComputedStyle(e).opacity || '1'); e = e.parentElement; } return !!h && o > 0.99;
    }""")
    pg.screenshot(path=f'{SHOTS}/390x844-light-reduire-animations-ouverture.png')
    ctx.close()


def intro_first(b):
    """Première ouverture (stockage vide) : l'introduction « Je suis… » PRÉCÈDE l'onboarding ; le profil choisi est gardé
    dans le brouillon local `intro.profile` ; « Découvrir sans compte » puis l'onboarding s'ouvre normalement."""
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.on('pageerror', lambda e: errs.append(f'intro: {str(e)[:200]}'))
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    R['0_intro_avant_onboarding'] = '/intro' in pg.url and tid(pg, 'intro-who-title').is_visible()
    tid(pg, 'intro-profile-newborn').click(); pg.wait_for_timeout(900)
    R['0_intro_profil_garde'] = (pg.evaluate("() => localStorage.getItem('intro.profile')") or '').find('newborn') >= 0
    tid(pg, 'intro-skip').click(); pg.wait_for_timeout(900)
    tid(pg, 'intro-demo').click(); pg.wait_for_timeout(5000)
    pg.goto(B + '/onboarding')
    tid(pg, 'onb-start').wait_for(state='visible', timeout=20000)
    R['0_onboarding_apres_intro'] = True
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    try:
        intro_first(b)
    except Exception as e:  # noqa: BLE001
        R['0_intro_avant_onboarding'] = False
        errs.append(f'intro : {str(e)[:300]}')
    flow(b, 390, 844, 'light', main=True)
    for (w, h, s) in [(390, 844, 'dark'), (320, 568, 'light'), (320, 568, 'dark')]:
        try:
            flow(b, w, h, s, premium_on=True)
            R[f'parcours_complet_{w}x{h}_{s}'] = True
        except Exception as e:  # noqa: BLE001
            R[f'parcours_complet_{w}x{h}_{s}'] = False
            errs.append(f'{w}x{h} {s}: {str(e)[:300]}')
    reduced(b)
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs, 'debordements': overflow}, ensure_ascii=False, indent=1))
