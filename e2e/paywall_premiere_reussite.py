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


def links_in_view(pg):
    vh = pg.viewport_size['height']
    for t in ('fw-pw-restore', 'fw-pw-terms', 'fw-pw-privacy'):
        if not has(pg, t):
            return False
        bb = vis(pg, t).first.bounding_box()
        if not bb or bb['y'] + bb['height'] > vh + 1:
            return False
    return True


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
    # Famille d'exemple (mode démonstration) : /start/sample, ancienne destination de « Découvrir sans compte »
    go(pg, '/start/sample', 5000)
    for d in 'ABC':
        for trial in ('1', '0'):
            go(pg, f'/dev/paywall?direction={d}&trial={trial}&need=feed_sleep&variant=need', 3000)
            label = 'essai' if trial == '1' else 'sans-essai'
            ok = has(pg, f'fw-paywall-{d}')
            if d == 'A' and width == 390:
                R[f'maquette_A_{trial}_heros_resultat'] = 'Sieste ajoutée' in text_of(pg, 'fw-pw-preview') and not has(pg, 'fw-pw-timeline')
            R[f'maquette_{d}_{label}_{width}'] = ok
            cta = text_of(pg, 'fw-pw-cta')
            if width == 390:
                R[f'maquette_{d}_{label}_bouton'] = ('Commencer l’essai gratuit' in cta) if trial == '1' else ('M’abonner pour un an' in cta)
                R[f'maquette_{d}_{label}_conditions'] = ('3 jours gratuits, puis 119,99 €/an. Renouvellement automatique, annulable à tout moment.' in text_of(pg, 'fw-pw-terms-line')) if trial == '1' \
                    else ('119,99 €/an, débité aujourd’hui. Renouvellement automatique, annulable à tout moment.' in text_of(pg, 'fw-pw-terms-line'))
                # Passe Paywall Designer : liens Restaurer · Conditions · Confidentialité visibles sans défiler
                R[f'maquette_{d}_{label}_liens_visibles'] = links_in_view(pg)
                if d == 'B':
                    R[f'maquette_B_{label}_frise_rappel'] = has(pg, 'fw-pw-tl-remind') == (trial == '1')
            R[f'maquette_{d}_{label}_{width}_liens_visibles'] = links_in_view(pg)
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
        R['etape_reponses_en_bas'] = vis(pg, 'fw-stage-child').first.bounding_box()['y'] > height * 0.45
        R['aura_nommee'] = 'Aura' in text_of(pg, 'fw-aura') and 'HOMI Aura' not in T(pg)
    shoot(pg, f'parcours_1_etape_{w}', full=False)
    click(pg, 'fw-stage-baby', 1500)
    if first:
        R['besoin_titre_tutoiement'] = 'Qu’est-ce qui te faciliterait la journée ?' in T(pg)
        R['besoin_reprend_l_etape'] = 'J’ai un bébé' in text_of(pg, 'fw-need-echo')
        R['besoins_max_4'] = 0 < pg.locator('[data-testid^="fw-need-"][data-testid$="_birth"], [data-testid="fw-need-feed_sleep"], [data-testid="fw-need-mornings"], [data-testid="fw-need-relay"]').filter(visible=True).count() <= 4
    shoot(pg, f'parcours_2_besoin_{w}', full=False)
    click(pg, 'fw-need-feed_sleep', 1800)
    if first:
        R['demo_exemple_signale'] = 'Exemple' in text_of(pg, 'fw-demo-sleepLog') and 'Pas encore notée' in text_of(pg, 'fw-last-nap')
    shoot(pg, f'parcours_3_demo_{w}', full=False)
    click(pg, 'fw-add-nap', 2500)
    nap = text_of(pg, 'fw-last-nap')
    if first:
        R['resultat_juste_apres'] = has(pg, 'fw-step-result') and bool(re.search(r'Réveil à \d{2}:\d{2}', nap))
        R['resultat_court_sans_liste'] = 'Au quotidien' not in T(pg) and not has(pg, 'fw-daily')
        R['resultat_lien_famille_exemple'] = has(pg, 'fw-sample')
        q = pg.evaluate("() => localStorage.getItem('homi.analytics.queue.v1') || ''")
        R['mesure_ecrans_et_reponses'] = all(n in q for n in ('onboarding_step_viewed', 'onboarding_answer', 'demo_completed'))
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
        # B (intégré) : un seul héros, la frise ; l'aperçu du résultat est le héros de A (vérifié sur la maquette A)
        R['paywall_un_seul_heros'] = has(pg, 'fw-pw-timeline') and not has(pg, 'fw-pw-preview')
        R['paywall_grille_demo_signalee'] = has(pg, 'fw-pw-demo-grid')
        R['paywall_croix_visible'] = has(pg, 'fw-pw-close')
        R['paywall_liens'] = all(has(pg, t) for t in ('fw-pw-restore', 'fw-pw-terms', 'fw-pw-privacy'))
        R['paywall_annuel_preselectionne'] = 'Commencer l’essai gratuit' in text_of(pg, 'fw-pw-cta') and pg.locator('[data-testid="fw-plan-premium-annual"][aria-checked="true"]').count() > 0
        R['paywall_frise_date'] = bool(re.search(r'\d+ \S+\s*119,99 €', text_of(pg, 'fw-pw-timeline'))) and 'Gratuit' in text_of(pg, 'fw-pw-timeline')
        R['paywall_frise_sans_rappel_web'] = not has(pg, 'fw-pw-tl-remind')
        R['annuel_montant_total'] = '119,99 €/an' in text_of(pg, 'fw-billed-premium-annual') and '10,00 €/mois' in text_of(pg, 'fw-per-premium-annual')
        R['annuel_economie_base'] = '33 % vs mensuel' in text_of(pg, 'fw-saving-premium-annual')
        R['deux_formules_de_tete'] = has(pg, 'fw-plan-premium-monthly') and not has(pg, 'fw-plan-family-monthly') and has(pg, 'fw-pw-more')
        R['coparent_inclus_une_fois'] = 'Premium : co-parent inclus, sans supplément.' in text_of(pg, 'fw-pw-coparent') and T(pg).count('co-parent') == 1
        R['pas_de_liste_de_benefices'] = pg.locator('[data-testid^="fw-pw-benefit-"]').filter(visible=True).count() == 0
        R['pas_de_phrase_24h'] = '24 h' not in T(pg)
        R['liens_visibles_sans_defiler'] = links_in_view(pg)
    R[f'debordement_paywall_{w}'] = len(detect(pg, f'paywall_{w}')) == 0
    shoot(pg, f'integre_paywall_essai_{w}')
    # changement de formule : tout suit
    click(pg, 'fw-plan-premium-monthly', 900)
    if first:
        R['mensuel_montant'] = '14,99 €/mois' in text_of(pg, 'fw-billed-premium-monthly')
        R['mensuel_frise_suit'] = '14,99 €' in text_of(pg, 'fw-pw-timeline') and '119,99' not in text_of(pg, 'fw-pw-timeline')
        R['mensuel_conditions_suivent'] = 'puis 14,99 €/mois' in text_of(pg, 'fw-pw-terms-line')
    click(pg, 'fw-pw-more', 900)
    if first:
        R['autres_formules_depliees'] = has(pg, 'fw-plan-premium-six_months') and has(pg, 'fw-plan-family-monthly')
        R['six_mois_economie'] = '22 % vs mensuel' in text_of(pg, 'fw-plan-premium-six_months')
    click(pg, 'fw-plan-family-monthly', 900)
    if first:
        R['famille_sans_essai_bouton'] = 'M’abonner au mois' in text_of(pg, 'fw-pw-cta') and '19,99 €/mois, débité aujourd’hui' in text_of(pg, 'fw-pw-terms-line')
        R['famille_carte_foyer_credits_sans_essai'] = 'Tous les adultes + 1 500 crédits Aura · sans essai' in text_of(pg, 'fw-plan-family-monthly')
        R['famille_frise_sans_essai'] = 'essai' not in text_of(pg, 'fw-pw-timeline').lower() and 'gratuit' not in text_of(pg, 'fw-pw-timeline').lower()
    shoot(pg, f'integre_paywall_famille_{w}', full=False)
    # croix → résultat de la démo ; « Voir les offres » → retour
    click(pg, 'fw-pw-close', 3000)
    if first:
        R['croix_retour_resultat'] = has(pg, 'fw-step-result') and 'Réveil à' in T(pg)
    click(pg, 'fw-see-offers', 3500)
    if first:
        R['voir_les_offres_retour'] = has(pg, 'fw-pw-cta') and 'M’abonner au mois' in text_of(pg, 'fw-pw-cta') and has(pg, 'fw-plan-family-monthly')
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
        R['formule_gardee'] = 'Commencer l’essai gratuit' in text_of(pg, 'fw-pw-cta') and pg.locator('[data-testid="fw-plan-premium-monthly"][aria-checked="true"]').count() > 0
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
        R['confirmation_comment_arreter'] = 'Réglages › ton nom › Abonnements' in text_of(pg, 'fw-done-stop')
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
    R['essai_indisponible_bouton'] = 'M’abonner pour un an' in text_of(pg, 'fw-pw-cta') and 'gratuit' not in text_of(pg, 'fw-pw-terms-line').lower() and not has(pg, 'fw-pw-tl-charge')
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


def welcome_and_sample(b):
    """Décision de la propriétaire : « Découvrir sans compte » → /start ; famille d'exemple par le lien du résultat."""
    ctx, pg = context(b, 390, 844)
    go(pg, '/welcome', 3000)
    vis(pg, 'welcome-demo').first.click(); pg.wait_for_timeout(3000)
    R['decouvrir_sans_compte_vers_start'] = '/start' in pg.url and has(pg, 'fw-step-stage')
    click(pg, 'fw-stage-pregnancy', 1200); click(pg, 'fw-need-prepare_birth', 1500); click(pg, 'fw-check-0', 2500)
    click(pg, 'fw-sample', 6000)
    R['lien_famille_exemple'] = '/start' not in pg.url and 'Lina' in T(pg)
    shoot(pg, 'famille_exemple_depuis_resultat_390', full=False)
    ctx.close()


def english_large_reduced(b):
    ctx, pg = context(b, 390, 844, locale='en-US', reduced='reduce')
    go(pg, '/', 4500)
    pg.evaluate("() => localStorage.setItem('toietmoi.ui.v1', localStorage.getItem('toietmoi.ui.v1') || '{}')")
    # Langue anglaise : préférence de l'appareil (en-US) ; si l'app reste en français, on le signale
    R['en_etape'] = 'Where is your family at?' in T(pg)
    click(pg, 'fw-stage-baby', 1000); click(pg, 'fw-need-feed_sleep', 1500); click(pg, 'fw-add-nap', 2000)
    click(pg, 'fw-see-offers', 4500)
    R['en_paywall'] = 'Start free trial' in text_of(pg, 'fw-pw-cta') and 'Renews automatically, cancel anytime' in text_of(pg, 'fw-pw-terms-line')
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
    welcome_and_sample(b)
    english_large_reduced(b)
    b.close()

failed = [k for k, v in R.items() if not v]
print(json.dumps(R, ensure_ascii=False, indent=1))
print('ERREURS CONSOLE', len(errs), errs[:8])
print('DÉBORDEMENTS', {k: v[:3] for k, v in overflow.items() if v})
print(f'{len(R) - len(failed)}/{len(R)} vérifications OK', 'ÉCHECS:', failed)
sys.exit(1 if failed else 0)
