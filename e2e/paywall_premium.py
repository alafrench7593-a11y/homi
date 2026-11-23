"""
Écran Premium v2 (15/11/2026) — version web de DÉMONSTRATION (« Découvrir sans compte » : achat simulé sur des
données fictives, aucun paiement ; StoreKit / RevenueCat réels NON testables ici) :
  prix de la grille démo (14,99 / 69,99 / 119,99 €), économies 22 / 33 %, essai 3 jours, chronologie avec la vraie date
  J+3, sélection d'une formule, liens légaux, achat simulé, état abonné·e (plus d'offre de nouveau client), restauration,
  « Plus tard » depuis l'onboarding, débordements (e2e/audit_ux_detect.js), captures clair / sombre en 390 × 844 et
  320 × 568, vidéo webm.

Page d'abonnement (Réglages › Abonnement, 17/11/2026), dans les 4 états × 2 largeurs × clair / sombre :
  non abonné éligible (promesse, 3 blocs du comparatif, formules calculées, essai daté, renouvellement automatique
  visible AVEC le bouton sans défiler, restaurer, gérer, CGU, « Continuer sans m'abonner »), non éligible (aucune
  mention d'essai), abonné (formule, échéance, origine, changer de formule, gérer), abonné partagé (Premium ouvert par
  l'autre adulte du foyer : la règle du serveur est rejouée par la démonstration).
  Captures : abonnement_<état>_<thème>_<largeur>.png (écran) et …_page.png (page entière).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/pay/web
  python3 e2e/spa_server.py /tmp/pay/web 8941 &
  (vidéo : PLAYWRIGHT_BROWSERS_PATH doit contenir le ffmpeg attendu par Playwright)
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8941 python3 e2e/paywall_premium.py
  (sans le ffmpeg de Playwright : ajouter PW_VIDEO=0)
"""
import json, os, re, shutil, sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8941')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/pay/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
MOIS = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
R, errs, overflow = {}, [], {}


def sp(text):
    return re.sub(r'[\u00a0\u202f]', ' ', text or '')


def T(pg):
    return sp(pg.inner_text('body'))


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def go(pg, path, wait=3000):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def j3():
    # même fuseau que le navigateur (Europe/Paris) : sinon la date diffère entre 23 h et minuit UTC
    today = datetime.now(ZoneInfo('Europe/Paris')).date()
    d = today + timedelta(days=3)
    return f"{d.day} {MOIS[d.month]}" + (f" {d.year}" if d.year != today.year else '')


def no_sub(pg):
    mutate(pg, "s => { const me = s.session.userId; s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me); }")


def enter_demo(pg):
    go(pg, '/welcome', 2500)
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4500)
    no_sub(pg)


def detect(pg, key):
    found = pg.evaluate('() => window.__homiDetect ? window.__homiDetect() : []')
    # Le logo animé (SVG) et la pastille de démonstration ne sont pas des textes de l'écran Premium
    found = [f for f in found if 'Démo' not in json.dumps(f, ensure_ascii=False) and 'Quitter' not in json.dumps(f, ensure_ascii=False)]
    overflow[key] = found
    return found


FRAMES = f'{SHOTS}/frames'
_frame = [0]


def frames(pg, n=1, every=90):
    """Images pour la vidéo de secours (ffmpeg du système) quand l'enregistrement Playwright n'est pas disponible."""
    os.makedirs(FRAMES, exist_ok=True)
    for _ in range(n):
        pg.screenshot(path=f'{FRAMES}/{_frame[0]:04d}.png'); _frame[0] += 1
        pg.wait_for_timeout(every)


def shoot(pg, name):
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
    # page entière : la zone qui défile (ScrollView) est agrandie le temps de la capture
    pg.screenshot(path=f'{SHOTS}/{name}_page.png', full_page=True)


def full_scroll_capture(pg, name):
    """Capture de toute la hauteur de l'écran Premium (zone qui défile déroulée)."""
    h = pg.evaluate("""() => { const el = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).overflowY === 'auto' && d.scrollHeight > d.clientHeight + 40 && d.querySelector('[data-testid="pw2-title"]'));
      return el ? el.scrollHeight : 0; }""")
    vp = pg.viewport_size
    if h:
        pg.set_viewport_size({'width': vp['width'], 'height': min(h + 140, 6000)}); pg.wait_for_timeout(500)
        pg.screenshot(path=f'{SHOTS}/{name}_full.png')
        pg.set_viewport_size(vp); pg.wait_for_timeout(300)


def scenario_main(b):
    # PW_VIDEO=0 : pas d'enregistrement Playwright (son ffmpeg peut manquer) ; la vidéo est alors montée depuis les images
    video_opts = {} if os.environ.get('PW_VIDEO') == '0' else {'record_video_dir': f'{SHOTS}/video', 'record_video_size': {'width': 390, 'height': 844}}
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, color_scheme='light', **video_opts)
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    enter_demo(pg)
    pg.goto(B + '/premium'); frames(pg, 30, 60); pg.wait_for_timeout(1500)
    txt = T(pg)
    R['ouvre_premium'] = has(pg, 'premium-screen') and has(pg, 'pw2-title')
    R['fermeture_visible'] = has(pg, 'pw2-close')
    # 390 × 844 : titre, les 3 formules et le bouton principal visibles sans défiler (19/11/2026)
    R['formules_et_bouton_sans_defiler'] = pg.evaluate("""() => ['pw2-title', 'pw2-plan-annual', 'pw2-plan-six_months', 'pw2-plan-monthly', 'pw2-buy'].every((id) => {
      const e = [...document.querySelectorAll(`[data-testid="${id}"]`)].find((x) => x.getBoundingClientRect().height > 0);
      const r = e && e.getBoundingClientRect(); return !!r && r.top >= 0 && r.bottom <= window.innerHeight; })""")
    R['avantages_reels'] = has(pg, 'pw2-benefits') and 'Biberons, tétées, sommeil' in txt and 'co-parent' in txt
    R['prix_demo'] = all(x in txt for x in ['119,99 €', '69,99 €', '14,99 €'])
    R['economies_22_33'] = 'économie de 33 %' in txt and 'économie de 22 %' in txt and '11,67 € / mois' in txt and '10,00 € / mois' in txt
    R['badge_sobre_annuel'] = 'Le plus avantageux' in sp(tid(pg, 'pw2-plan-annual').inner_text())
    R['annuel_selectionne_defaut'] = tid(pg, 'pw2-plan-annual').get_attribute('aria-checked') == 'true'
    R['essai_3_jours_partout'] = all(has(pg, f'pw2-trial-{p}') for p in ['annual', 'six_months', 'monthly'])
    tl = sp(tid(pg, 'pw2-timeline').inner_text()) if has(pg, 'pw2-timeline') else ''
    R['chronologie_date_reelle'] = 'Aujourd’hui' in tl and 'Pendant 3 jours' in tl and f'L’essai se termine le {j3()}' in tl and f'Le {j3()}' in tl and 'Premier prélèvement : 119,99 € pour la formule 12 mois' in tl
    R['aucune_promesse_de_rappel'] = not re.search(r'nous vous (préviendrons|rappellerons)|rappel avant', txt, re.I)
    R['bouton_essai_exact'] = sp(tid(pg, 'pw2-buy').inner_text()).strip() == 'Commencer l’essai de 3 jours'
    R['renouvellement_et_annulation'] = 'Renouvellement automatique : 119,99 € par an' in txt and 'Réglages iOS › votre identifiant Apple › Abonnements' in txt
    R['renouvellement_visible_avec_le_bouton'] = together(pg, 'pw2-buy')
    R['mention_demo'] = 'Démonstration : montants de la grille prévue' in txt
    R['aucune_fausse_urgence'] = not re.search(r'(offre limitée|plus que|expire dans|\d+:\d\d:\d\d|témoign)', txt, re.I)
    R['debordement_390'] = len(detect(pg, 'clair_390')) == 0
    shoot(pg, 'premium_clair_390')
    full_scroll_capture(pg, 'premium_clair_390')

    # Sélection : 6 mois (ressort, état radio) → chronologie et bouton suivent
    pg.mouse.wheel(0, 900); frames(pg, 6, 120)
    tid(pg, 'pw2-plan-six_months').click(); frames(pg, 10, 40); pg.wait_for_timeout(300)
    tl = sp(tid(pg, 'pw2-timeline').inner_text())
    R['selection_6_mois'] = tid(pg, 'pw2-plan-six_months').get_attribute('aria-checked') == 'true' and tid(pg, 'pw2-plan-annual').get_attribute('aria-checked') == 'false'
    R['chronologie_suit_selection'] = '69,99 € pour la formule 6 mois' in tl
    R['lecture_accessible_prix'] = '69,99 € pour 6 mois' in sp(tid(pg, 'pw2-plan-six_months').get_attribute('aria-label') or '') and 'économie' in (tid(pg, 'pw2-plan-six_months').get_attribute('aria-label') or '')
    shoot(pg, 'premium_clair_390_6mois')

    # Liens légaux
    tid(pg, 'pw2-legal-terms').click(); pg.wait_for_timeout(2000)
    R['lien_cgu'] = '/legal/terms' in pg.url
    pg.go_back(); pg.wait_for_timeout(2500)
    tid(pg, 'pw2-legal-privacy').click(); pg.wait_for_timeout(2000)
    R['lien_confidentialite'] = '/legal/privacy' in pg.url
    pg.go_back(); pg.wait_for_timeout(3000)

    # Restauration sans achat : rien trouvé, aucun Premium
    tid(pg, 'pw2-restore').click(); pg.wait_for_timeout(1800)
    R['restauration_rien'] = 'Aucun abonnement actif trouvé' in T(pg) and has(pg, 'pw2-plans')

    # Achat simulé (démonstration) : 6 mois avec essai
    tid(pg, 'pw2-plan-six_months').click(); pg.wait_for_timeout(500)
    tid(pg, 'pw2-buy').click(); frames(pg, 20, 120); pg.wait_for_timeout(1000)
    txt = T(pg)
    frames(pg, 6, 150)
    R['achat_simule_abonne'] = has(pg, 'pw2-subscriber') and 'Premium est actif' in txt and 'Formule actuelle : 6 mois' in txt
    R['abonne_sans_offre_nouveau_client'] = not has(pg, 'pw2-plans') and not has(pg, 'pw2-buy')
    R['abonne_gerer'] = has(pg, 'pw2-manage')
    shoot(pg, 'premium_abonne_clair_390')
    go(pg, '/premium', 4000)
    R['abonne_apres_rechargement'] = has(pg, 'pw2-subscriber') and not has(pg, 'pw2-plans')

    # Restauration réussie : couverte par Jest (src/__tests__/paywallPremium.test.tsx) — ici la démonstration garde ses
    # données en mémoire et ne relit pas un abonnement ajouté par le script sans rechargement.
    no_sub(pg); go(pg, '/premium', 4000)
    R['offre_revient_sans_abonnement'] = has(pg, 'pw2-plans')

    # Depuis l'onboarding : « Plus tard » → accueil
    no_sub(pg); go(pg, '/premium?from=onboarding', 4000)
    R['onboarding_plus_tard_visible'] = has(pg, 'pw2-later')
    tid(pg, 'pw2-later').click(); pg.wait_for_timeout(3000)
    R['onboarding_plus_tard_accueil'] = '/premium' not in pg.url
    # Depuis l'onboarding : achat → accueil
    go(pg, '/premium?from=onboarding', 4000)
    tid(pg, 'pw2-buy').click(); pg.wait_for_timeout(3500)
    R['onboarding_achat_accueil'] = '/premium' not in pg.url
    no_sub(pg)
    video = pg.video.path() if pg.video else None
    ctx.close()
    if video and os.path.exists(video):
        shutil.copy(video, f'{SHOTS}/paywall_premium.webm')
    elif shutil.which('ffmpeg') and os.path.isdir(FRAMES):
        os.system(f'ffmpeg -y -loglevel error -framerate 8 -i {FRAMES}/%04d.png -vf scale=390:-2 -c:v libvpx-vp9 -b:v 1M {SHOTS}/paywall_premium.webm')
    R['video'] = os.path.exists(f'{SHOTS}/paywall_premium.webm')


def together(pg, buy):
    """Le bouton d'achat et la phrase de renouvellement automatique sont visibles en même temps, sans défiler de plus."""
    return pg.evaluate("""(buy) => { const vis = (id) => [...document.querySelectorAll(`[data-testid="${id}"]`)].find((x) => x.getBoundingClientRect().height > 0);
      const b = vis(buy), r = vis('pw2-renew'); if (!b || !r) return false; b.scrollIntoView({ block: 'center' });
      const inside = (e) => { const q = e.getBoundingClientRect(); return q.top >= 0 && q.bottom <= window.innerHeight; };
      return inside(b) && inside(r) && /Renouvellement automatique/.test(r.innerText); }""", buy)


SCROLLER = "[...document.querySelectorAll('div')].filter(d => getComputedStyle(d).overflowY === 'auto' && d.scrollHeight > d.clientHeight + 40).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]"


def page_capture(pg, name):
    """Écran tel qu'affiché (haut de page), puis page entière (zone qui défile déroulée)."""
    pg.evaluate("() => { const el = " + SCROLLER + "; if (el) el.scrollTop = 0; }")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/{name}.png')
    h = pg.evaluate("() => { const el = " + SCROLLER + "; return el ? el.scrollHeight + (window.innerHeight - el.clientHeight) : 0; }")
    vp = pg.viewport_size
    if h:
        pg.set_viewport_size({'width': vp['width'], 'height': min(h + 40, 7000)}); pg.wait_for_timeout(700)
        pg.screenshot(path=f'{SHOTS}/{name}_page.png')
        pg.set_viewport_size(vp); pg.wait_for_timeout(300)


SUB_ROW = """(user, days) => ({ user_id: user, entitlement: 'HOMI_PREMIUM', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual', price: 119.99, currency: 'EUR',
  status: days > 0 ? 'active' : 'expired', expires_at: new Date(Date.now() + days * 86400000).toISOString(), will_renew: days > 0, started_at: new Date(Date.now() - 40 * 86400000).toISOString(), trial_ends_at: null })"""
CAM, HH = '00000000-0000-4000-8000-00000000ca11', '00000000-0000-4000-8000-0000000000f1'


def set_state(pg, state):
    """Prépare les données de démonstration de l'état voulu (compte de démonstration, aucune boutique)."""
    if state == 'eligible':
        js = "s => { s.tables.subscriptions = []; }"
    elif state == 'non_eligible':  # un abonnement a déjà existé : l'essai n'est plus proposé
        js = "s => { s.tables.subscriptions = [(" + SUB_ROW + ")(s.session.userId, -5)]; }"
    elif state == 'abonne':
        js = "s => { s.tables.subscriptions = [(" + SUB_ROW + ")(s.session.userId, 320)]; }"
    else:  # abonné partagé : Camille a créé un foyer et s'est abonnée ; la personne affichée l'a rejoint comme co-parent
        js = """s => { const me = s.session.userId, cam = '%s', hh = '%s';
          s.tables.subscriptions = [(%s)(cam, 200)];
          s.tables.profiles = (s.tables.profiles || []).filter(p => p.id !== cam).concat([{ id: cam, display_name: 'Camille' }]);
          s.tables.households = (s.tables.households || []).filter(h => h.id !== hh).concat([{ id: hh, name: 'Foyer de Camille', created_by: cam, created_at: '2026-10-01T08:00:00Z' }]);
          s.tables.household_members = (s.tables.household_members || []).filter(m => m.household_id !== hh).concat([
            { household_id: hh, user_id: cam, role: 'owner', joined_at: '2026-10-01T08:00:00Z', can_view: [], can_edit: [] },
            { household_id: hh, user_id: me, role: 'coparent', joined_at: '2026-10-02T08:00:00Z', can_view: [], can_edit: [] }]); }""" % (CAM, HH, SUB_ROW)
    mutate(pg, js)


def clear_shared(pg):
    mutate(pg, "s => { const hh = '%s'; s.tables.household_members = (s.tables.household_members || []).filter(m => m.household_id !== hh); s.tables.households = (s.tables.households || []).filter(h => h.id !== hh); s.tables.subscriptions = []; }" % HH)


def scenario_page(b, scheme, w, h, checks):
    """Page d'abonnement dans les 4 états ; `checks` : assertions détaillées de contenu (une seule fois, 390 clair)."""
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, color_scheme=scheme)
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f'PAGE abonnement {scheme} {w} ' + str(e)[:200]))
    enter_demo(pg)
    key = f'{"sombre" if scheme == "dark" else "clair"}_{w}'
    for state in ['eligible', 'non_eligible', 'abonne', 'partage']:
        set_state(pg, state)
        go(pg, '/settings/subscription', 4500)
        txt = T(pg)
        offer = sp(tid(pg, 'sub3-offer').inner_text()) if has(pg, 'sub3-offer') else ''
        k = f'{state}_{key}'
        R[f'page_debordement_{k}'] = len(detect(pg, f'page_{k}')) == 0
        if state == 'eligible':
            R[f'page_eligible_{key}'] = has(pg, 'sub3-promise') and all(has(pg, x) for x in ['sub3-free', 'sub3-premium', 'sub3-family', 'pw2-plans', 'pw2-timeline', 'plan-buy'])
            if checks:
                R['page_promesse'] = 'Premium ouvre le suivi complet de votre famille' in sp(tid(pg, 'sub3-promise').inner_text())
                R['page_sans_abonnement_reel'] = all(x in sp(tid(pg, 'sub3-free').inner_text()) for x in ['numéros d’urgence', 'alertes officielles de rappel', 'Export de toutes vos données', 'Rien n’est effacé'])
                R['page_premium_par_besoin'] = all(x in sp(tid(pg, 'sub3-premium').inner_text()) for x in ['Pour moi', 'Pour mon enfant', 'Pour ma famille', 'Mes outils'])
                R['page_en_famille'] = all(x in sp(tid(pg, 'sub3-family').inner_text()) for x in ['sans supplément', 'Un seul autre adulte', 'nounou'])
                R['page_prix_calcules'] = all(x in offer for x in ['119,99 €', '69,99 €', '14,99 €', 'économie de 33 %', 'économie de 22 %', '10,00 € / mois', '11,67 € / mois'])
                R['page_conseillee_expliquee'] = 'Le plus avantageux' in offer and 'prix ramené au mois est le plus bas' in offer
                tl = sp(tid(pg, 'pw2-timeline').inner_text())
                R['page_essai_dates'] = 'Pendant 3 jours' in tl and f'L’essai se termine le {j3()}' in tl and 'Premier prélèvement : 119,99 € pour la formule 12 mois' in tl and 'Réglages iOS › votre identifiant Apple › Abonnements' in tl
                R['page_bouton_essai'] = sp(tid(pg, 'plan-buy').inner_text()).strip() == 'Commencer l’essai de 3 jours'
                R['page_lecture_formule'] = all(x in sp(tid(pg, 'pw2-plan-annual').get_attribute('aria-label') or '') for x in ['12 mois', '119,99 € par an', '10,00 € par mois', '33 % d’économie', '3 jours d’essai gratuit'])
                R['page_restaurer_gerer_liens'] = all(has(pg, x) for x in ['sub-restore', 'sub-manage-link', 'sub-legal-links', 'sub3-continue-free'])
                R['page_aucune_urgence'] = not re.search(r'(offre limitée|plus que \d|expire dans|\d+:\d\d:\d\d|témoign|Familiale|\+ ?5 ?€)', txt, re.I)
                R['page_aucune_case'] = pg.locator('input[type="checkbox"], [role="checkbox"], [role="switch"]').filter(visible=True).count() == 0
            page_capture(pg, f'abonnement_{state}_{key}')
            R[f'page_renouvellement_avec_bouton_{key}'] = together(pg, 'plan-buy')
            pg.wait_for_timeout(300); pg.screenshot(path=f'{SHOTS}/abonnement_{state}_{key}_achat.png')
            continue
        if state == 'non_eligible':
            R[f'page_non_eligible_{key}'] = has(pg, 'pw2-plans') and not has(pg, 'pw2-timeline') and not re.search(r'essai|offert|gratuit', offer, re.I) \
                and sp(tid(pg, 'plan-buy').inner_text()).strip() == 'S’abonner — 119,99 € / an' and 'essai' not in (tid(pg, 'pw2-plan-annual').get_attribute('aria-label') or '')
            page_capture(pg, f'abonnement_{state}_{key}')
            R[f'page_non_eligible_renouvellement_{key}'] = together(pg, 'plan-buy')
            pg.wait_for_timeout(300); pg.screenshot(path=f'{SHOTS}/abonnement_{state}_{key}_achat.png')
            continue
        card = sp(tid(pg, 'my-subscription').inner_text())
        # ouvrir la page en étant déjà abonné·e n'est pas une activation : pas de bandeau « Premium activé »
        R[f'page_sans_fausse_activation_{k}'] = not has(pg, 'premium-activated')
        if state == 'abonne':
            R[f'page_abonne_{key}'] = all(x in card for x in ['HOMI Premium', '12 mois', 'Prochain renouvellement', 'Achat personnel']) and has(pg, 'sub-manage') and has(pg, 'sub-restore') \
                and 'Passer à la formule' in sp(tid(pg, 'plan-buy').inner_text()) and has(pg, 'pw2-current-annual') and not has(pg, 'sub3-promise') and not re.search(r'essai|offert', offer, re.I)
        else:
            R[f'page_partage_{key}'] = 'offert par Camille' in card and 'Partagé par Camille' in card and 'rien à payer' in card \
                and not has(pg, 'pw2-plans') and not has(pg, 'plan-buy') and not has(pg, 'sub-manage') and has(pg, 'sub-restore')
        page_capture(pg, f'abonnement_{state}_{key}')
    clear_shared(pg)
    ctx.close()


def scenario_shots(b, scheme, w, h):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, color_scheme=scheme)
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f'PAGE {scheme} {w} ' + str(e)[:200]))
    enter_demo(pg)
    go(pg, '/premium', 4500)
    key = f'{"sombre" if scheme == "dark" else "clair"}_{w}'
    R[f'debordement_{key}'] = len(detect(pg, key)) == 0
    shoot(pg, f'premium_{key}')
    full_scroll_capture(pg, f'premium_{key}')
    tid(pg, 'pw2-buy').click(); pg.wait_for_timeout(3500)
    R[f'abonne_{key}'] = has(pg, 'pw2-subscriber')
    shoot(pg, f'premium_abonne_{key}')
    no_sub(pg)
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    scenario_main(b)
    scenario_shots(b, 'light', 320, 568)
    scenario_shots(b, 'dark', 390, 844)
    scenario_shots(b, 'dark', 320, 568)
    scenario_page(b, 'light', 390, 844, True)
    scenario_page(b, 'dark', 390, 844, False)
    scenario_page(b, 'light', 320, 568, False)
    scenario_page(b, 'dark', 320, 568, False)
    b.close()

R['aucune_erreur_page'] = not [e for e in errs if e.startswith('PAGE')]
print(json.dumps(R, ensure_ascii=False, indent=1))
bad = {k: v for k, v in overflow.items() if v}
if bad:
    print('DÉBORDEMENTS', json.dumps(bad, ensure_ascii=False, indent=1)[:4000])
if errs:
    print('ERREURS', errs[:12])
fails = [k for k, v in R.items() if v is not True]
print('ÉCHECS', fails)
sys.exit(1 if fails else 0)
