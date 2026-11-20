"""
Onboarding « première réussite » et paywall de conclusion (03/12/2026) — version web de DÉMONSTRATION (faux magasin,
grille signalée, aucun paiement, aucune IA ; StoreKit / RevenueCat réels, VoiceOver réel et notifications réelles NON
testables ici : voir docs/PAYWALL_ONBOARDING.md § 9).

Partie 1 — maquettes : /dev/paywall (vrai composant PaywallView) pour les directions A, B, C × essai / sans essai,
  à 390 × 844 et 320 × 568 (deviceScaleFactor 2) → maquette_<dir>_<essai|sans-essai>_<largeur>.png (+ _page.png).
Partie 2 — parcours réel sans compte : première ouverture → /start → étape de vie → besoin → démo (sieste ajoutée,
  heure visible) → résultat → offres (titre A/B, cartes, frise, bouton, conditions) → changement de formule → croix
  (retour au résultat) → « Voir les offres » → bouton sans compte → inscription → reprise au paywall (formule gardée)
  → achat annulé / en attente d'approbation / échec → achat confirmé → confirmation (date, rappel, outil) → abonné·e
  qui rouvre /start : renvoyé·e hors du parcours. Catalogue hors ligne, essai indisponible, restauration sans achat.
  Les autres parcours (grossesse, enfant, relais) : démo et titre. FR et EN, petit et grand écran, texte agrandi
  (zoom 130 %), réduction des mouvements.

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/paywall/web
  python3 e2e/spa_server.py /tmp/paywall/web 8961 &
  NAV_URL=http://127.0.0.1:8961 E2E_SHOTS=/tmp/paywall/shots python3 e2e/paywall_premiere_reussite.py
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8961')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/paywall/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
R, errs, overflow = {}, [], {}
SCROLLER = "[...document.querySelectorAll('div')].filter(d => getComputedStyle(d).overflowY === 'auto' && d.scrollHeight > d.clientHeight + 40).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]"


def sp(text):
    return re.sub(r'[  ]', ' ', text or '')


def T(pg):
    return sp(pg.inner_text('body'))


def vis(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True)


def has(pg, t):
    return vis(pg, t).count() > 0


def text_of(pg, t):
    return sp(vis(pg, t).first.inner_text()) if has(pg, t) else ''


def go(pg, path, wait=3500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def click(pg, t, wait=1200):
    vis(pg, t).first.click(); pg.wait_for_timeout(wait)


def disabled(pg, t):
    el = vis(pg, t).first
    return el.get_attribute('aria-disabled') == 'true' or el.is_disabled()


def detect(pg, key):
    found = pg.evaluate('() => window.__homiDetect ? window.__homiDetect() : []')
    found = [f for f in found if 'Démo' not in json.dumps(f, ensure_ascii=False) and 'Quitter' not in json.dumps(f, ensure_ascii=False)]
    overflow[key] = found
    return found


def shoot(pg, name, full=True):
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
    if full:
        h = pg.evaluate(f"() => {{ const el = {SCROLLER}; return el ? el.scrollHeight : 0; }}")
        vp = pg.viewport_size
        if h:
            pg.set_viewport_size({'width': vp['width'], 'height': min(h + 220, 7000)}); pg.wait_for_timeout(600)
            pg.screenshot(path=f'{SHOTS}/{name}_page.png')
            pg.set_viewport_size(vp); pg.wait_for_timeout(400)


def sim(pg, key, value):
    if value is None:
        pg.evaluate(f"() => localStorage.removeItem('{key}')")
    else:
        pg.evaluate(f"() => localStorage.setItem('{key}', '{value}')")


def context(b, width, height, locale='fr-FR', reduced='no-preference'):
    ctx = b.new_context(viewport={'width': width, 'height': height}, locale=locale, timezone_id='Europe/Paris', device_scale_factor=2,
                        color_scheme='light', reduced_motion=reduced)
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    return ctx, pg


# ------------------------------------------------------------------ partie 1 : maquettes
def mockups(b, width, height):
    ctx, pg = context(b, width, height)
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    for d in 'ABC':
        for trial in ('1', '0'):
            go(pg, f'/dev/paywall?direction={d}&trial={trial}&need=feed_sleep&variant=need', 3000)
            label = 'essai' if trial == '1' else 'sans-essai'
            ok = has(pg, f'fw-paywall-{d}')
            R[f'maquette_{d}_{label}_{width}'] = ok
            cta = text_of(pg, 'fw-pw-cta')
            if width == 390:
                R[f'maquette_{d}_{label}_bouton'] = ('Démarrer mes 3 jours gratuits' in cta) if trial == '1' else ('S’abonner à 14,99 €/mois' in cta)
                R[f'maquette_{d}_{label}_conditions'] = ('Gratuit jusqu’au 6 décembre, puis 14,99 €/mois. Renouvellement automatique.' in text_of(pg, 'fw-pw-terms-line')) if trial == '1' \
                    else ('14,99 €/mois, débité aujourd’hui. Renouvellement automatique.' in text_of(pg, 'fw-pw-terms-line'))
            R[f'debordement_maquette_{d}_{label}_{width}'] = len(detect(pg, f'maquette_{d}_{label}_{width}')) == 0
            shoot(pg, f'maquette_{d}_{label}_{width}')
    # Variante A/B : titre générique (même écran)
    go(pg, '/dev/paywall?direction=B&trial=1&need=feed_sleep&variant=generic', 3000)
    if width == 390:
        R['ab_titre_generique'] = text_of(pg, 'fw-pw-title') == 'Tout HOMI, pour toi et ta famille'
    shoot(pg, f'maquette_B_titre-generique_{width}', full=False)
    # États : chargement, hors ligne, annulé, en attente
    for q, name in (('catalog=loading', 'chargement'), ('catalog=offline', 'hors-ligne'), ('phase=cancelled', 'annule'), ('phase=deferred', 'attente')):
        go(pg, f'/dev/paywall?direction=B&trial=1&need=feed_sleep&{q}', 2500)
        if name == 'hors-ligne' and width == 390:
            R['etat_hors_ligne_achat_desactive'] = has(pg, 'fw-pw-catalog-offline') and disabled(pg, 'fw-pw-cta')
        shoot(pg, f'etat_{name}_{width}', full=False)
    ctx.close()


# ------------------------------------------------------------------ partie 2 : parcours réel
def flow(b, width, height, first):
    ctx, pg = context(b, width, height)
    w = str(width)
    go(pg, '/', 4500)
    if first:
        R['premiere_ouverture_vers_start'] = '/start' in pg.url and has(pg, 'fw-step-stage')
        R['aura_nommee'] = 'Aura' in text_of(pg, 'fw-aura') and 'HOMI Aura' not in T(pg)
    shoot(pg, f'parcours_1_etape_{w}', full=False)
    click(pg, 'fw-stage-baby', 1500)
    if first:
        R['besoin_titre_tutoiement'] = 'Qu’est-ce qui te faciliterait la journée ?' in T(pg)
        R['besoins_max_4'] = pg.locator('[data-testid^="fw-need-"]').filter(visible=True).count() <= 5
    shoot(pg, f'parcours_2_besoin_{w}', full=False)
    click(pg, 'fw-need-feed_sleep', 1800)
    if first:
        R['demo_exemple_signale'] = 'Exemple' in text_of(pg, 'fw-demo-sleepLog') and 'Pas encore notée' in text_of(pg, 'fw-last-nap')
    shoot(pg, f'parcours_3_demo_{w}', full=False)
    click(pg, 'fw-add-nap', 2500)
    nap = text_of(pg, 'fw-last-nap')
    if first:
        R['resultat_juste_apres'] = has(pg, 'fw-step-result') and bool(re.search(r'Réveil à \d{2}:\d{2}', nap))
        R['resultat_quotidien'] = 'Au quotidien, tu retrouverais' in T(pg)
    R[f'debordement_resultat_{w}'] = len(detect(pg, f'resultat_{w}')) == 0
    shoot(pg, f'parcours_4_resultat_{w}')
    # retour arrière puis retour au résultat
    click(pg, 'fw-back', 1200)
    if first:
        R['retour_arriere'] = has(pg, 'fw-step-need')
    click(pg, 'fw-need-feed_sleep', 1500)
    if first:
        R['demo_conservee_apres_retour'] = has(pg, 'fw-step-result') or 'Réveil à' in text_of(pg, 'fw-last-nap')
    go(pg, '/start?step=result', 3000)
    click(pg, 'fw-see-offers', 4500)
    title = text_of(pg, 'fw-pw-title')
    if first:
        R['paywall_titre_variante'] = title in ('Repas et siestes, au même endroit', 'Tout HOMI, pour toi et ta famille')
        R['paywall_apercu_resultat'] = 'Sieste ajoutée' in text_of(pg, 'fw-pw-preview')
        R['paywall_grille_demo_signalee'] = has(pg, 'fw-pw-demo-grid')
        R['paywall_croix_visible'] = has(pg, 'fw-pw-close')
        R['paywall_liens'] = all(has(pg, t) for t in ('fw-pw-restore', 'fw-pw-terms', 'fw-pw-privacy'))
        R['paywall_mensuel_preselectionne'] = 'Démarrer mes 3 jours gratuits' in text_of(pg, 'fw-pw-cta')
        R['paywall_frise_date'] = bool(re.search(r'Premier paiement : 14,99 €, puis 14,99 € par mois', text_of(pg, 'fw-pw-timeline')))
        R['carte_premium_coparent'] = 'Pour toi et ton ou ta co-parent' in text_of(pg, 'fw-plan-premium-monthly')
        R['carte_famille_foyer_credits'] = 'Tous les adultes du foyer + 1 500 crédits Aura partagés' in text_of(pg, 'fw-plan-family-monthly')
        R['benefices_max_3'] = pg.locator('[data-testid^="fw-pw-benefit-"]').filter(visible=True).count() <= 3
    R[f'debordement_paywall_{w}'] = len(detect(pg, f'paywall_{w}')) == 0
    shoot(pg, f'integre_paywall_essai_{w}')
    # changement de formule : tout suit
    click(pg, 'fw-plan-premium-annual', 900)
    if first:
        R['annuel_montant_total'] = '119,99 € par an' in text_of(pg, 'fw-billed-premium-annual') and 'soit 10,00 € par mois' in text_of(pg, 'fw-plan-premium-annual')
        R['annuel_economie_base'] = '33 % de moins que 12 × 14,99 €' in text_of(pg, 'fw-plan-premium-annual')
        R['annuel_frise_suit'] = 'puis 119,99 € par an' in text_of(pg, 'fw-pw-timeline')
        R['annuel_conditions_suivent'] = 'puis 119,99 €/an' in text_of(pg, 'fw-pw-terms-line')
    click(pg, 'fw-plan-family-monthly', 900)
    if first:
        R['famille_sans_essai_bouton'] = 'S’abonner à 19,99 €/mois' in text_of(pg, 'fw-pw-cta')
        R['famille_benefices'] = 'Ouvert à tous les adultes du foyer' in text_of(pg, 'fw-pw-benefits')
        R['famille_frise_sans_essai'] = 'essai' not in text_of(pg, 'fw-pw-timeline').lower() and 'gratuit' not in text_of(pg, 'fw-pw-timeline').lower()
    shoot(pg, f'integre_paywall_famille_{w}', full=False)
    # croix → résultat de la démo ; « Voir les offres » → retour
    click(pg, 'fw-pw-close', 3000)
    if first:
        R['croix_retour_resultat'] = has(pg, 'fw-step-result') and 'Réveil à' in T(pg)
    click(pg, 'fw-see-offers', 3500)
    if first:
        R['voir_les_offres_retour'] = has(pg, 'fw-pw-cta') and 'S’abonner à 19,99 €/mois' in text_of(pg, 'fw-pw-cta')
    click(pg, 'fw-plan-premium-monthly', 800)
    # sans compte : inscription entre le choix et l'achat
    click(pg, 'fw-pw-cta', 3500)
    if first:
        R['compte_avant_achat'] = '/auth/sign-up' in pg.url
    pg.get_by_label('Adresse e-mail').fill(f'parent{w}@exemple.test')
    pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.get_by_label('Confirmer le mot de passe').fill('abcdefg1')
    boxes = pg.get_by_role('checkbox').filter(visible=True)
    for i in range(boxes.count()):
        boxes.nth(i).click(); pg.wait_for_timeout(150)
    vis(pg, 'signup-submit').first.click(); pg.wait_for_timeout(6000)
    if first:
        R['reprise_apres_inscription'] = '/start/offers' in pg.url and 'Ton compte est prêt' in T(pg)
        R['formule_gardee'] = 'Démarrer mes 3 jours gratuits' in text_of(pg, 'fw-pw-cta') and pg.locator('[data-testid="fw-plan-premium-monthly"][aria-checked="true"]').count() > 0
    shoot(pg, f'integre_reprise_compte_{w}', full=False)
    # issues d'achat simulées (faux magasin)
    for v, t in (('cancelled', 'fw-pw-state-cancelled'), ('deferred', 'fw-pw-state-deferred'), ('pending', 'fw-pw-state-pending'), ('network', 'fw-pw-state-failed')):
        sim(pg, 'homi.demo.purchase-sim', v)
        click(pg, 'fw-pw-cta', 2500)
        if first:
            R[f'achat_{v}'] = has(pg, t) and '/start/offers' in pg.url
        if v == 'cancelled':
            shoot(pg, f'integre_achat_annule_{w}', full=False)
    sim(pg, 'homi.demo.purchase-sim', None)
    # restauration sans achat
    click(pg, 'fw-pw-restore', 2500)
    if first:
        R['restauration_rien'] = has(pg, 'fw-pw-state-restore_none')
    click(pg, 'fw-pw-cta', 5000)
    if first:
        R['achat_confirme_confirmation'] = '/start/done' in pg.url and has(pg, 'fw-done')
        R['confirmation_formule'] = 'Premium mensuel' in text_of(pg, 'fw-done-plan')
        R['confirmation_date_montant'] = bool(re.search(r'Gratuit jusqu’au \d+ \S+ \d{4}, puis 14,99 € par mois', text_of(pg, 'fw-done-billing')))
        R['confirmation_outil'] = 'Ouvrir le suivi de bébé' in text_of(pg, 'fw-done-open')
        R['confirmation_invitation'] = has(pg, 'fw-done-invite')
        R['confirmation_gestion'] = has(pg, 'fw-done-manage')
    R[f'debordement_confirmation_{w}'] = len(detect(pg, f'confirmation_{w}')) == 0
    shoot(pg, f'integre_confirmation_{w}')
    click(pg, 'fw-rem-set', 1500)
    if first:
        R['rappel_etat_reel_web'] = has(pg, 'fw-rem-unsupported')
    # abonné·e : ne revoit jamais le parcours de vente
    go(pg, '/start', 4000)
    if first:
        R['abonne_pas_de_parcours'] = '/start' not in pg.url
    go(pg, '/start/offers', 4000)
    if first:
        R['abonne_pas_de_paywall'] = '/start/offers' not in pg.url
    ctx.close()


def catalog_states(b):
    ctx, pg = context(b, 390, 844)
    go(pg, '/start', 3500)
    click(pg, 'fw-stage-child', 1200); click(pg, 'fw-need-mornings', 1500)
    R['routine_demo'] = has(pg, 'fw-demo-routine')
    click(pg, 'fw-add-tshirt-crew', 800); click(pg, 'fw-step-tshirt-crew', 2500)
    R['routine_resultat'] = has(pg, 'fw-step-result') and 'Je m’habille' in text_of(pg, 'fw-result-text')
    click(pg, 'fw-see-offers', 4500)
    R['routine_titre'] = text_of(pg, 'fw-pw-title') in ('Des matins où chacun sait quoi faire', 'Tout HOMI, pour toi et ta famille')
    sim(pg, 'homi.demo.catalog-sim', 'offline')
    go(pg, '/start/offers', 4000)
    R['catalogue_hors_ligne'] = has(pg, 'fw-pw-catalog-offline') and disabled(pg, 'fw-pw-cta') and has(pg, 'fw-pw-retry')
    shoot(pg, 'integre_hors_ligne_390', full=False)
    sim(pg, 'homi.demo.catalog-sim', 'notrial')
    go(pg, '/start/offers', 4000)
    R['essai_indisponible_bouton'] = 'S’abonner à 14,99 €/mois' in text_of(pg, 'fw-pw-cta') and 'Gratuit' not in text_of(pg, 'fw-pw-terms-line')
    shoot(pg, 'integre_paywall_sans_essai_390', full=False)
    sim(pg, 'homi.demo.catalog-sim', None)
    ctx.close()
    # grossesse et relais
    ctx, pg = context(b, 390, 844)
    go(pg, '/start', 3500)
    click(pg, 'fw-stage-pregnancy', 1200); click(pg, 'fw-need-prepare_birth', 1500)
    click(pg, 'fw-check-0', 2500)
    R['grossesse_resultat'] = has(pg, 'fw-step-result') and 'Coché à' in text_of(pg, 'fw-result-text')
    click(pg, 'fw-back', 1000)
    click(pg, 'fw-need-relay', 1500)
    R['relais_prive'] = 'Humeur et journal intime' in text_of(pg, 'fw-relay-private') and 'Poids' in text_of(pg, 'fw-relay-private')
    click(pg, 'fw-relay-send', 2500)
    R['relais_resultat'] = has(pg, 'fw-step-result') and 'restent privés' in text_of(pg, 'fw-result-text')
    shoot(pg, 'parcours_relais_resultat_390')
    ctx.close()


def english_large_reduced(b):
    ctx, pg = context(b, 390, 844, locale='en-US', reduced='reduce')
    go(pg, '/', 4500)
    pg.evaluate("() => localStorage.setItem('toietmoi.ui.v1', localStorage.getItem('toietmoi.ui.v1') || '{}')")
    # Langue anglaise : préférence de l'appareil (en-US) ; si l'app reste en français, on le signale
    R['en_etape'] = 'Where is your family at?' in T(pg)
    click(pg, 'fw-stage-baby', 1000); click(pg, 'fw-need-feed_sleep', 1500); click(pg, 'fw-add-nap', 2000)
    click(pg, 'fw-see-offers', 4500)
    R['en_paywall'] = 'Start my 3 free days' in text_of(pg, 'fw-pw-cta') and 'Renews automatically' in text_of(pg, 'fw-pw-terms-line')
    R['reduction_mouvements_rendu'] = has(pg, 'fw-pw-cta')
    shoot(pg, 'integre_paywall_en_390', full=False)
    # Texte agrandi (approximation web : zoom 130 %)
    pg.evaluate("() => { document.body.style.zoom = '1.3'; }"); pg.wait_for_timeout(800)
    R['texte_agrandi_bouton_visible'] = vis(pg, 'fw-pw-cta').first.is_visible()
    shoot(pg, 'integre_paywall_en_texte_agrandi_390', full=False)
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    for i, (wd, ht) in enumerate(((390, 844), (320, 568))):
        mockups(b, wd, ht)
    for i, (wd, ht) in enumerate(((390, 844), (320, 568))):
        flow(b, wd, ht, i == 0)
    catalog_states(b)
    english_large_reduced(b)
    b.close()

failed = [k for k, v in R.items() if not v]
print(json.dumps(R, ensure_ascii=False, indent=1))
print('ERREURS CONSOLE', len(errs), errs[:8])
print('DÉBORDEMENTS', {k: v[:3] for k, v in overflow.items() if v})
print(f'{len(R) - len(failed)}/{len(R)} vérifications OK', 'ÉCHECS:', failed)
sys.exit(1 if failed else 0)
