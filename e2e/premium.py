"""
Offre Premium de bout en bout (version web de démonstration, sans compte, achat simulé) :
aperçu réel avant l'abonnement, écran d'abonnement (formules, prix facturé, renouvellement, annulation, restauration),
essai, fonctions débloquées, quota de saisie vocale, fin d'essai et expiration (données toujours lisibles),
fonctions toujours gratuites.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/premium.py
"""
import json, os, re, sys
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def go(pg, path, wait=2500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(1000)


def set_sub(pg, status, days):
    mutate(pg, f"""s => {{ const me = s.session.userId; s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
      s.tables.subscriptions.push({{ user_id: me, status: '{status}', product_id: 'toietmoi_premium_annual', store: 'test', period_type: '{'trial' if status == 'trial' else 'annual'}',
        expires_at: new Date(Date.now() + {days} * 86400000).toISOString(), will_renew: {'true' if status in ('trial', 'active') else 'false'} }}); }}""")


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    mutate(pg, f"""s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{(date.today() - timedelta(days=200)).isoformat()}';
      const c = s.tables.children.find(c => c.id === '{lina}'); if (!c.enabled_tracking.includes('sleep')) c.enabled_tracking.push('sleep');
      s.tables.subscriptions = []; s.tables.feature_usage = []; }}""")
    # Quelques sommeils notés (7 jours) pour un aperçu réel
    mutate(pg, f"""s => {{ for (let d = 1; d <= 6; d++) {{ const st = new Date(); st.setDate(st.getDate() - d); st.setHours(13, 0, 0, 0);
      const en = new Date(st.getTime() + 90 * 60000); s.tables.sleeps.push({{ id: 'pz' + d, child_id: '{lina}', household_id: '{hid}', started_at: st.toISOString(), ended_at: en.toISOString(), wakeups: 0, kind: 'nap' }});
      const n = new Date(st); n.setHours(20, 0, 0, 0); const ne = new Date(n.getTime() + 10 * 3600000); s.tables.sleeps.push({{ id: 'pn' + d, child_id: '{lina}', household_id: '{hid}', started_at: n.toISOString(), ended_at: ne.toISOString(), wakeups: 1, kind: 'night' }}); }} }}""")

    # ================================================================ Version gratuite : pas de blocage à l'ouverture
    subject(pg, lina)
    R['ouverture_sans_paywall'] = not has(pg, 'premium-preview') and has(pg, 'home-card-main')
    go(pg, f'/child/{lina}', 3000)
    R['sommeil_gratuit_boutons'] = has(pg, 'sleep-asleep') or has(pg, 'sleep-awake')
    tid(pg, 'premium-sleep').click(); pg.wait_for_timeout(900)
    prev = tid(pg, 'premium-preview-real').inner_text()
    R['apercu_reel_avant_abonnement'] = has(pg, 'premium-preview') and 'Découvrez le rythme personnalisé de Lina' in T(pg) and bool(re.search(r'\d+ temps d’éveil déjà notés', prev))
    R['apercu_gratuit_vs_premium'] = 'Gratuit :' in T(pg) and 'Premium :' in T(pg)
    pg.screenshot(path=f'{SHOTS}/premium_apercu.png')
    tid(pg, 'premium-later').click(); pg.wait_for_timeout(600)
    R['plus_tard_ferme_sans_pression'] = not has(pg, 'premium-preview')
    tid(pg, 'premium-sleep').click(); pg.wait_for_timeout(800)
    tid(pg, 'premium-see-plans').click(); pg.wait_for_timeout(2500)

    # ================================================================ Écran d'abonnement
    t = T(pg)
    R['abonnement_fonction_essayee'] = has(pg, 'sub-tried') and 'rythme personnalisé' in tid(pg, 'sub-tried').inner_text()
    R['abonnement_annuel_mis_en_valeur'] = has(pg, 'plan-annual') and 'Le plus avantageux' in tid(pg, 'plan-annual').inner_text() and tid(pg, 'plan-annual').bounding_box()['y'] < tid(pg, 'plan-monthly').bounding_box()['y']
    terms = tid(pg, 'plan-terms-annual').inner_text()
    R['abonnement_prix_total_essai_renouvellement'] = '39,99 € facturés une fois par an' in terms and '7 jours gratuits' in terms and 'Renouvellement automatique le' in terms
    R['abonnement_mensuel'] = '5,99 € facturés chaque mois' in tid(pg, 'plan-terms-monthly').inner_text()
    R['abonnement_annulation_restauration_gestion'] = has(pg, 'sub-restore') and has(pg, 'sub-manage-link') and 'Annulation : à tout moment' in tid(pg, 'sub-terms').inner_text()
    R['abonnement_comparaison'] = 'Comparer Gratuit et Premium' in t and 'Partage avec le coparent, par profil' in t
    R['toujours_gratuit_liste'] = all(x in tid(pg, 'always-free').inner_text() for x in ['urgence', 'post-partum', 'rappel de produits', 'Suppression du compte', 'consentements', 'Signalement', 'déjà créées'])
    R['aucun_compte_a_rebours'] = not re.search(r'(offre expire|plus que \d|dernière chance|\d\d:\d\d:\d\d)', t, re.I)
    pg.screenshot(path=f'{SHOTS}/premium_abonnement.png', full_page=True)

    # ================================================================ Saisie vocale : 3 essais gratuits comptés côté serveur
    go(pg, '/track', 2600)
    left0 = tid(pg, 'quick-left').inner_text()
    tid(pg, 'quick-text').fill('Lina s’est endormie à 13 h'); tid(pg, 'quick-parse').click(); pg.wait_for_timeout(400)
    R['vocal_comprend_sommeil'] = 'Lina s’endort' in tid(pg, 'quick-result').inner_text()
    tid(pg, 'quick-open').click(); pg.wait_for_timeout(1500)
    R['vocal_quota_compte'] = '3 essai' in left0 and demo(pg, "s => (s.tables.feature_usage[0] || {}).used") == 1
    mutate(pg, "s => { s.tables.feature_usage[0].used = 3; s.tables.sleeps = s.tables.sleeps.filter(x => x.ended_at); }")
    go(pg, '/track', 2600)
    tid(pg, 'quick-text').fill('Lina a bu 150 ml à 13 h 10'); tid(pg, 'quick-parse').click(); pg.wait_for_timeout(400)
    tid(pg, 'quick-open').click(); pg.wait_for_timeout(1200)
    R['vocal_limite_message_clair'] = has(pg, 'premium-limit') and 'saisies vocales gratuites de ce mois' in T(pg) and 'reviennent le' in T(pg)
    tid(pg, 'premium-later').click(); pg.wait_for_timeout(500)

    # ================================================================ Menu hebdomadaire : aperçu réel, refus côté serveur
    go(pg, '/meals/menu', 3000)
    tid(pg, 'menu-generate').click(); pg.wait_for_timeout(900)
    R['menu_apercu_vrais_plats'] = has(pg, 'premium-preview-real') and '•' in tid(pg, 'premium-preview-real').inner_text()
    tid(pg, 'premium-later').click(); pg.wait_for_timeout(400)

    # ================================================================ Achat simulé (essai) : fonctions débloquées
    go(pg, '/settings/subscription', 2600)
    tid(pg, 'plan-buy-annual').click(); pg.wait_for_timeout(2500)
    R['essai_actif_date_fin'] = 'Essai gratuit jusqu’au' in tid(pg, 'sub-message').inner_text()
    go(pg, f'/sleep/{lina}?tab=trends', 3000)
    R['premium_sommeil_debloque'] = has(pg, 'sleep-rhythm') and has(pg, 'sleep-changes') and has(pg, 'sleep-weekly') and 'Nuit :' in tid(pg, 'sleep-rhythm').inner_text()
    go(pg, f'/sleep/{lina}?tab=profile', 3000)
    tid(pg, 'routine-time').fill('19:45')
    pg.get_by_text('+ Bain', exact=True).first.click(); pg.get_by_text('+ Histoire', exact=True).first.click()
    tid(pg, 'routine-save').click(); pg.wait_for_timeout(1500)
    R['routine_du_coucher_enregistree'] = demo(pg, f"s => (s.tables.bedtime_routines.find(r => r.child_id === '{lina}') || {{}}).steps") == ['Bain', 'Histoire']
    go(pg, '/meals/menu', 3000)
    tid(pg, 'menu-generate').click(); pg.wait_for_timeout(1200)
    R['menu_hebdomadaire_genere'] = not has(pg, 'premium-preview') and pg.locator('[data-testid^="menu-slot-"]').count() >= 7
    tid(pg, 'menu-save').click(); pg.wait_for_timeout(1500)
    R['menu_enregistre_cote_serveur'] = demo(pg, "s => s.tables.meal_plans.length") >= 1
    subject(pg, lina)
    go(pg, '/summary?period=week', 3000)
    R['resume_semaine_premium'] = has(pg, 'summary-sections') and 'Sommeil' in tid(pg, 'summary-sections').inner_text()

    # ================================================================ Fin d'essai : retour gratuit, données toujours lisibles
    set_sub(pg, 'trial', -1)
    go(pg, f'/sleep/{lina}?tab=trends', 3000)
    R['fin_essai_retour_gratuit'] = has(pg, 'premium-sleep_insights') and not has(pg, 'sleep-rhythm')
    go(pg, '/settings/subscription', 2500)
    R['fin_essai_message_donnees'] = 'Vos données restent consultables' in tid(pg, 'sub-message').inner_text()
    R['donnees_conservees_apres_fin'] = demo(pg, "s => s.tables.bedtime_routines.length") == 1
    go(pg, '/meals/menu', 3000)
    R['menu_existant_lisible_apres_fin'] = pg.locator('[data-testid^="menu-slot-"]').count() >= 7

    # ================================================================ Renouvellement, annulation jusqu'à l'échéance, expiration
    set_sub(pg, 'active', 30)
    go(pg, '/settings/subscription', 2500)
    R['renouvellement_date_affichee'] = 'Renouvellement automatique le' in tid(pg, 'sub-message').inner_text()
    set_sub(pg, 'cancelled', 3)
    go(pg, '/settings/subscription', 2500)
    R['annule_actif_jusqu_echeance'] = 'sans renouvellement' in tid(pg, 'sub-message').inner_text()
    go(pg, f'/sleep/{lina}?tab=trends', 2800)
    R['annule_fonctions_encore_actives'] = has(pg, 'sleep-rhythm')
    set_sub(pg, 'expired', -1)
    go(pg, f'/sleep/{lina}?tab=trends', 2800)
    R['expire_fonctions_en_pause'] = not has(pg, 'sleep-rhythm') and has(pg, 'premium-sleep_insights')

    # ================================================================ Toujours gratuit après expiration
    go(pg, '/emergency', 2500)
    R['urgences_gratuites'] = '15' in T(pg) and '112' in T(pg)
    go(pg, '/settings/privacy', 2500)
    R['export_et_suppression_accessibles'] = 'Exporter' in T(pg) or 'export' in T(pg).lower()
    pg.screenshot(path=f'{SHOTS}/premium_fin.png')
    b.close()


with sync_playwright() as p:
    run(p)
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = sum(1 for k, v in R.items() if k != 'erreurs' and v is True)
total = sum(1 for k in R if k != 'erreurs')
print(('OK' if ok == total and not errs else 'ÉCHEC'), ok, '/', total)
