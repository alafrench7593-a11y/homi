"""
Offre Premium de bout en bout (version web de démonstration, sans compte, achat simulé sur des données fictives) :
aperçu réel avant l'abonnement, feuille Premium avec les 3 formules, page « AU FIL DE NOUS PREMIUM » (avantages,
formules 12 mois / 6 mois / mensuel, badges, économies calculées, essai de 3 jours sur le mensuel seulement, conditions,
restauration, CGU et confidentialité), « Mon abonnement » (page et profil), changement de formule, fonctions débloquées,
quota de saisie vocale, fin d'essai, remboursement et expiration (données toujours lisibles), fonctions toujours gratuites.
  npx expo export --platform web --clear --output-dir /tmp/dist-sub && python3 e2e/spa_server.py /tmp/dist-sub 8833 &
  NAV_URL=http://127.0.0.1:8833 python3 e2e/premium.py
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


def sp(text):
    """Espaces insécables (formatage des montants par Intl : « 99,99 € ») → espaces ordinaires."""
    return re.sub(r'[\u00a0\u202f]', ' ', text)


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


def nav(pg, path, wait=2500):
    """Navigation interne (comme un lien de l'appli), sans recharger la page."""
    pg.evaluate("p => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate', { state: null })); }", path)
    pg.wait_for_timeout(wait)


def at(pg, path, key, wait=2500):
    """Ouvre `path` (rechargement : la démo relit les données modifiées), puis choisit le profil avec le sélecteur de l'écran,
    sinon depuis l'accueil puis par navigation interne. Le profil est choisi APRÈS le chargement : sur une version configurée
    avec Supabase, la reprise de la démo au chargement efface le profil enregistré (bug documenté dans cocon.py,
    profil_affiche_conserve_au_rechargement)."""
    go(pg, path, wait)
    if has(pg, 'profile-switcher'):
        tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
        if has(pg, f'subject-{key}'):
            tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(wait)
            return
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    subject(pg, key)
    nav(pg, path, wait)


def set_sub(pg, status, days):
    mutate(pg, f"""s => {{ const me = s.session.userId; s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
      s.tables.subscriptions.push({{ user_id: me, status: '{status}', product_id: 'aufildenous_premium_annual', store: 'test', period_type: 'annual',
        expires_at: new Date(Date.now() + {days} * 86400000).toISOString(), will_renew: {'true' if status in ('trial', 'active') else 'false'},
        started_at: new Date(Date.now() - 86400000).toISOString(), price: 99.99, currency: 'EUR',
        refunded_at: {"new Date().toISOString()" if status == 'refunded' else 'null'} }}); }}""")


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
    tid(pg, 'premium-sleep').click(); pg.wait_for_timeout(1200)

    # ================================================================ Feuille Premium : les 3 formules, accès direct
    sheet = tid(pg, 'premium-sheet-plans').inner_text() if has(pg, 'premium-sheet-plans') else ''
    R['feuille_3_formules'] = all(x in sheet for x in ['12 mois', '6 mois', 'Mensuel', '99,99', '54,99', '10,99'])
    R['feuille_badges'] = all(x in sheet for x in ['MEILLEURE OFFRE', 'ÉCONOMISEZ', 'SANS ENGAGEMENT LONGUE DURÉE'])
    R['feuille_mention_demo'] = 'Montants de démonstration' in sheet
    tid(pg, 'premium-sheet-plans').locator('[data-testid="plan-six_months"]').first.click(); pg.wait_for_timeout(500)
    R['feuille_bouton_formule_choisie'] = 'Continuer avec la formule 6 mois' in tid(pg, 'premium-see-plans').inner_text()
    pg.screenshot(path=f'{SHOTS}/premium_feuille.png')
    tid(pg, 'premium-see-plans').click(); pg.wait_for_timeout(2800)

    # ================================================================ Page « AU FIL DE NOUS PREMIUM »
    t = T(pg)
    R['abonnement_fonction_essayee'] = has(pg, 'sub-tried') and 'rythme personnalisé' in tid(pg, 'sub-tried').inner_text()
    hero = tid(pg, 'premium-hero').inner_text() if has(pg, 'premium-hero') else ''
    R['abonnement_titre_sous_titre'] = 'AU FIL DE NOUS PREMIUM' in hero and 'créer des liens, partager, découvrir et profiter pleinement de la communauté' in hero
    ben = tid(pg, 'premium-benefits').inner_text() if has(pg, 'premium-benefits') else ''
    R['abonnement_avantages_cartes'] = all(x in ben for x in ['Créer des liens', 'Partager', 'Découvrir', 'Profiter de la communauté'])
    ys = [tid(pg, f'plan-{k}').bounding_box()['y'] for k in ('annual', 'six_months', 'monthly')] if all(has(pg, f'plan-{k}') for k in ('annual', 'six_months', 'monthly')) else [0, 0, 0]
    R['abonnement_3_formules_12_6_1'] = ys[0] < ys[1] < ys[2]
    pa, ps, pm = (tid(pg, f'plan-{k}').inner_text() for k in ('annual', 'six_months', 'monthly'))
    R['abonnement_badges'] = 'MEILLEURE OFFRE' in pa and 'ÉCONOMISEZ' in ps and 'SANS ENGAGEMENT LONGUE DURÉE' in pm
    R['abonnement_prix_demo_grille'] = '99,99' in pa and '54,99' in ps and '10,99' in pm and has(pg, 'plans-demo-note')
    R['abonnement_economies_calculees'] = re.search(r'Économisez 24\s%', pa) is not None and re.search(r'Économisez 16\s%', ps) is not None and 'Économisez' not in pm
    R['abonnement_prix_par_mois'] = 'soit 8,33' in pa and 'soit 9,17' in ps
    R['essai_3_jours_mensuel_seulement'] = '3 jours gratuits' in pm and not has(pg, 'plan-trial-annual') and not has(pg, 'plan-trial-six_months')
    R['formule_preselectionnee_depuis_feuille'] = 'facturés tous les 6 mois' in tid(pg, 'plan-terms').inner_text()
    tid(pg, 'plan-annual').click(); pg.wait_for_timeout(600)
    terms = sp(tid(pg, 'plan-terms').inner_text())
    R['conditions_annuel'] = '99,99 € facturés une fois par an' in terms and 'Premier prélèvement à la confirmation' in terms and 'Renouvellement automatique' in terms and 'Résiliation à tout moment' in terms and 'Démonstration' in terms
    R['bouton_annuel'] = 'S’abonner — 99,99' in tid(pg, 'plan-buy').inner_text()
    tid(pg, 'plan-monthly').click(); pg.wait_for_timeout(600)
    terms = sp(tid(pg, 'plan-terms').inner_text())
    R['conditions_essai_mensuel'] = 'Essai gratuit de 3 jours, puis premier prélèvement de 10,99' in terms and 'rien ne vous sera prélevé' in terms and '10,99 € facturés chaque mois' in terms
    R['bouton_essai_mensuel'] = 'Commencer l’essai gratuit de 3 jours' in tid(pg, 'plan-buy').inner_text()
    R['abonnement_restauration_cgu_confidentialite'] = has(pg, 'sub-restore') and has(pg, 'plan-legal-links') and 'Conditions générales' in tid(pg, 'plan-legal-links').inner_text() and 'Politique de confidentialité' in tid(pg, 'plan-legal-links').inner_text() and 'Annulation : à tout moment' in tid(pg, 'sub-terms').inner_text()
    R['mon_abonnement_gratuit'] = has(pg, 'my-subscription') and 'Gratuit' in tid(pg, 'sub-status-pill').inner_text()
    R['abonnement_comparaison'] = 'Comparer Gratuit et Premium' in t and 'Partage avec le coparent, par profil' in t
    R['toujours_gratuit_liste'] = all(x in tid(pg, 'always-free').inner_text() for x in ['urgence', 'post-partum', 'rappel de produits', 'Suppression du compte', 'consentements', 'Signalement', 'déjà créées'])
    R['aucun_compte_a_rebours'] = not re.search(r'(offre expire|plus que \d|dernière chance|\d\d:\d\d:\d\d)', t, re.I)
    pg.screenshot(path=f'{SHOTS}/premium_abonnement.png', full_page=True)

    # ================================================================ Saisie vocale : 3 essais gratuits comptés côté serveur
    at(pg, '/track', lina, 2600)
    left0 = tid(pg, 'quick-left').inner_text()
    tid(pg, 'quick-text').fill('Lina s’est endormie à 13 h'); tid(pg, 'quick-parse').click(); pg.wait_for_timeout(400)
    R['vocal_comprend_sommeil'] = 'Lina s’endort' in tid(pg, 'quick-result').inner_text()
    tid(pg, 'quick-open').click(); pg.wait_for_timeout(1500)
    R['vocal_quota_compte'] = '3 essai' in left0 and demo(pg, "s => (s.tables.feature_usage[0] || {}).used") == 1
    mutate(pg, "s => { s.tables.feature_usage[0].used = 3; s.tables.sleeps = s.tables.sleeps.filter(x => x.ended_at); }")
    at(pg, '/track', lina, 2600)
    tid(pg, 'quick-text').fill('Lina a bu 150 ml à 13 h 10'); tid(pg, 'quick-parse').click(); pg.wait_for_timeout(400)
    tid(pg, 'quick-open').click(); pg.wait_for_timeout(1200)
    R['vocal_limite_message_clair'] = has(pg, 'premium-limit') and 'saisies vocales gratuites de ce mois' in T(pg) and 'reviennent le' in T(pg)
    tid(pg, 'premium-later').click(); pg.wait_for_timeout(500)

    # ================================================================ Menu hebdomadaire : aperçu réel, refus côté serveur
    go(pg, '/meals/menu', 3000)
    tid(pg, 'menu-generate').click(); pg.wait_for_timeout(900)
    R['menu_apercu_vrais_plats'] = has(pg, 'premium-preview-real') and '•' in tid(pg, 'premium-preview-real').inner_text()
    tid(pg, 'premium-later').click(); pg.wait_for_timeout(400)

    # ================================================================ Achat simulé (essai de 3 jours, mensuel) : fonctions débloquées
    go(pg, '/settings/subscription', 2600)
    tid(pg, 'plan-monthly').click(); pg.wait_for_timeout(500)
    tid(pg, 'plan-buy').click(); pg.wait_for_timeout(2500)
    R['essai_actif_date_fin'] = 'Essai gratuit jusqu’au' in tid(pg, 'sub-message').inner_text()
    R['essai_duree_3_jours'] = demo(pg, "s => { const r = s.tables.subscriptions.find(x => x.user_id === s.session.userId); return Math.round((Date.parse(r.expires_at) - Date.now()) / 86400000); }") == 3
    my = tid(pg, 'my-subscription').inner_text()
    R['mon_abonnement_essai'] = all(x in my for x in ['Formule', 'Mensuel', 'Statut', 'Essai', 'Date de début', 'Fin de l’essai', 'Premier prélèvement', '10,99', 'par mois', 'Démonstration'])
    R['mon_abonnement_boutons'] = has(pg, 'sub-manage') and has(pg, 'sub-restore') and has(pg, 'sub-legal-links')
    pg.screenshot(path=f'{SHOTS}/premium_mon_abonnement.png', full_page=True)
    # Changement de formule (mensuel → 12 mois) : la ligne est remplacée, jamais deux abonnements
    R['formule_actuelle_signalee'] = has(pg, 'plan-current-monthly')
    tid(pg, 'plan-annual').click(); pg.wait_for_timeout(500)
    R['bouton_changer_formule'] = 'Passer à la formule 12 mois' in tid(pg, 'plan-buy').inner_text()
    tid(pg, 'plan-buy').click(); pg.wait_for_timeout(2500)
    R['changement_formule_annuel'] = '12 mois' in tid(pg, 'my-sub-plan').inner_text() and demo(pg, "s => s.tables.subscriptions.filter(x => x.user_id === s.session.userId).length") == 1
    # Rubrique « MON ABONNEMENT » dans le profil
    go(pg, '/profile', 3000)
    R['profil_mon_abonnement'] = has(pg, 'my-subscription-section') and 'MON ABONNEMENT' in tid(pg, 'my-subscription-section').inner_text() and '12 mois' in tid(pg, 'my-subscription-section').inner_text()
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
    nav(pg, '/summary?period=week', 3000)
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
    set_sub(pg, 'refunded', 20)
    go(pg, '/settings/subscription', 2500)
    R['rembourse_statut_affiche'] = 'Remboursé' in tid(pg, 'sub-status-pill').inner_text() and 'remboursé' in tid(pg, 'sub-message').inner_text()
    go(pg, f'/sleep/{lina}?tab=trends', 2800)
    R['rembourse_droits_retires'] = not has(pg, 'sleep-rhythm') and has(pg, 'premium-sleep_insights')
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
    try:
        run(p)
    except Exception as e:  # noqa: BLE001 — le rapport JSON est toujours imprimé, l'exception compte comme erreur
        errs.append(f'exception: {str(e)[:300]}')
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = sum(1 for k, v in R.items() if k != 'erreurs' and v is True)
total = sum(1 for k in R if k != 'erreurs')
print(('OK' if ok == total and not errs else 'ÉCHEC'), ok, '/', total)
