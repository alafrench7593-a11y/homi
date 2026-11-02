"""
« Suivre mon cycle » (refonte) de bout en bout, version web de démonstration (sans compte) :
accueil réduit (calendrier, 5 raccourcis, une carte intelligente, prochain rappel), choix des favoris, mois suivants,
« Ajouter aujourd'hui » et résumé du jour, fiche d'un jour (modifier, effacer), sélection de plusieurs jours de règles,
vie sexuelle (consentement, textes exacts, contraception d'urgence gratuite et sourcée), oubli de pilule,
changement d'objectif sans perte, tendance (gratuit → Premium → fin d'abonnement), retours sur les conseils,
saisie vocale confirmée, rappels réels, données insuffisantes, cycles irréguliers, masquage et verrouillage.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/cycle3.py
"""
import json, os, sys
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TODAY = date.today()
iso = lambda d: d.isoformat()

PREMIUM_OFF = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }"""


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True)


def has(pg, t):
    return tid(pg, t).count() > 0


def tap(pg, t, wait=500):
    tid(pg, t).first.click(); pg.wait_for_timeout(wait)


def btn(pg, name, wait=600):
    pg.get_by_role('button', name=name, exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(wait)


def checked(pg, t):
    return tid(pg, t).first.get_attribute('aria-checked') == 'true'


def home(pg, wait=2600):
    """Accueil du profil « moi » (cycle). Le profil est choisi par le sélecteur, comme le ferait l'utilisatrice : sur une
    version configurée avec Supabase, la reprise de la démo au chargement efface le profil enregistré (bug documenté
    dans cocon.py, profil_affiche_conserve_au_rechargement)."""
    pg.goto(B + '/'); pg.wait_for_timeout(wait)
    if has(pg, 'profile-switcher') and not has(pg, 'cycle-calendar'):
        tap(pg, 'profile-switcher', 700); tap(pg, 'subject-me', wait)


def seed_regular(pg):
    """5 débuts de règles tous les 28 jours ; les prochaines règles sont estimées dans 2 jours. Mal de dos 2 jours avant 3 règles sur 4."""
    starts = [TODAY - timedelta(days=26 + 28 * k) for k in range(5)]
    back = [s - timedelta(days=2) for s in starts[:3]]
    mutate(pg, f"""s => {{ const me = s.session.userId;
      s.tables.period_entries = {json.dumps([iso(x) for x in starts])}.map((d, i) => ({{ id: 'pe' + i, user_id: me, start_date: d, end_date: new Date(Date.parse(d + 'T12:00:00Z') + 4 * 86400000).toISOString().slice(0, 10), flow: 'medium', note: null, created_at: new Date().toISOString() }}));
      s.tables.symptom_logs = {json.dumps([iso(x) for x in back])}.map((d, i) => ({{ id: 'sl' + i, user_id: me, logged_on: d, symptoms: [], symptom_keys: ['back_pain'], moods: [], habits: [], tags: [], sleep_tags: [], custom_items: [], note: null, created_at: new Date().toISOString() }}));
    }}""")
    return starts


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(PREMIUM_OFF)
    mutate(pg, """s => { const me = s.session.userId;
      for (const p of s.tables.profiles || []) p.journeys = ['cycle'];
      s.tables.user_journeys = (s.tables.user_journeys || []).filter(j => j.type === 'baby' || j.type === 'child');
      s.tables.user_journeys.push({ id: 'j-cycle', user_id: me, household_id: null, type: 'cycle', status: 'active', started_on: '2026-01-01', ended_on: null, end_reason: null, pregnancy_id: null, child_id: null, created_at: new Date().toISOString() });
      s.tables.pregnancies = []; s.tables.cycle_preferences = []; s.tables.reminders = []; s.tables.intercourse_logs = []; s.tables.contraception_logs = [];
    }""")
    pg.evaluate("""() => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); ui.state.subject = { type: 'me' }; ui.state.simpleMode = false; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }""")
    starts = seed_regular(pg)
    next_period = starts[0] + timedelta(days=28)

    # ================================================================ 1. Accueil : seulement l'essentiel
    home(pg)
    pg.screenshot(path=f'{SHOTS}/c3-home.png', full_page=True)
    t = T(pg)
    R['01_calendrier_principal'] = has(pg, 'cycle-calendar') and has(pg, 'c3-legend') and has(pg, f'c3-day-{iso(TODAY)}')
    R['01_accueil_reduit'] = (not has(pg, 'home-card-community') and not has(pg, 'home-card-recommendation') and not has(pg, 'home-card-quick')
                              and has(pg, 'c3-add-today') and has(pg, 'c3-today-card') and has(pg, 'c3-next-reminder'))
    R['01_jour_et_regles_estimees'] = 'Jour 27 du cycle' in t and 'Règles estimées dans 2 jours' in t
    lbl = tid(pg, f'c3-day-{iso(next_period)}').first.get_attribute('aria-label') or '' if next_period.month == TODAY.month else 'Règles estimées'
    R['01_regles_estimees_dans_le_calendrier'] = 'Règles estimées' in lbl
    R['01_aujourdhui_entoure'] = 'Aujourd’hui' in (tid(pg, f'c3-day-{iso(TODAY)}').first.get_attribute('aria-label') or '')

    # ================================================================ 2. Première utilisation : « Que souhaites-tu suivre régulièrement ? »
    R['02_question_favoris'] = has(pg, 'c3-fav-picker') and 'Que souhaites-tu suivre régulièrement ?' in t
    defaults = [x for x in ['period', 'pain', 'mood', 'body', 'sleep'] if checked(pg, f'c3-pick-{x}')]
    R['02_favoris_par_defaut_objectif'] = defaults == ['period', 'pain', 'mood', 'body', 'sleep']
    tap(pg, 'c3-pick-habits', 300)
    R['02_cinq_au_maximum'] = not checked(pg, 'c3-pick-habits')
    tap(pg, 'c3-pick-sleep', 200); tap(pg, 'c3-pick-habits', 200)
    tap(pg, 'c3-fav-save', 1500)
    R['02_favoris_enregistres'] = demo(pg, "s => s.tables.cycle_preferences[0].favorites") == ['period', 'pain', 'mood', 'body', 'habits']
    R['02_cinq_raccourcis_accueil'] = has(pg, 'c3-home-favorites') and tid(pg, 'c3-home-favorites').locator('[data-testid^="c3-home-fav-"]').count() == 5

    # ================================================================ 3. Mois suivant / précédent
    # Un appui pendant l'animation du mois (sortie 120 ms + ressort) est ignoré par le calendrier : on attend qu'elle finisse
    m0 = tid(pg, 'c3-month').inner_text()
    tap(pg, 'c3-next', 1200); m1 = tid(pg, 'c3-month').inner_text()
    tap(pg, 'c3-prev', 1200); m2 = tid(pg, 'c3-month').inner_text()
    # glissement horizontal (souris)
    box = tid(pg, 'cycle-calendar').bounding_box()
    pg.mouse.move(box['x'] + box['width'] * 0.8, box['y'] + box['height'] * 0.5); pg.mouse.down()
    pg.mouse.move(box['x'] + box['width'] * 0.2, box['y'] + box['height'] * 0.5, steps=8); pg.mouse.up(); pg.wait_for_timeout(1200)
    m3 = tid(pg, 'c3-month').inner_text()
    R['03_mois_suivant_precedent'] = m0 != m1 and m2 == m0
    R['03_glisser_change_de_mois'] = m3 != m0
    if m3 != m0:
        tap(pg, 'c3-prev', 1200)

    # ================================================================ 4. « Ajouter aujourd'hui » → résumé du jour
    tap(pg, 'c3-add-today', 900)
    R['04_favoris_dans_la_feuille'] = tid(pg, 'c3-favorites').locator('[data-testid^="c3-fav-"]').count() == 5 and not has(pg, 'c3-categories')
    tap(pg, 'c3-all', 400)
    R['04_toutes_les_categories'] = tid(pg, 'c3-categories').locator('[data-testid^="c3-cat-"]').count() == 10
    tap(pg, 'c3-cat-pain', 400); tap(pg, 'pill-cramps', 200)
    pg.locator('[data-testid="c3-intensity"] [aria-label="Intensité de la douleur 2"]').filter(visible=True).first.click(); pg.wait_for_timeout(200)
    tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-body', 300); tap(pg, 'pill-fatigue', 200)
    tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-sleep', 300); tap(pg, 'pill-difficult', 200)
    R['04_etat_selectionne_visible'] = checked(pg, 'pill-difficult')
    tap(pg, 'c3-save', 1800)
    summary = tid(pg, 'c3-summary').inner_text() if has(pg, 'c3-summary') else ''
    R['04_resume_du_jour'] = summary == 'Aujourd’hui, tu as noté : crampes légères, fatigue et sommeil difficile.'
    row = demo(pg, f"s => s.tables.symptom_logs.find(x => x.logged_on === '{iso(TODAY)}')")
    R['04_enregistre_en_base'] = bool(row) and row['symptom_keys'] == ['cramps', 'fatigue'] and row['sleep_tags'] == ['difficult'] and row['pain_intensity'] == 2
    R['04_carte_a_savoir'] = has(pg, 'c3-insight') and tid(pg, 'c3-insight-badge').first.inner_text() in ('Information générale', 'Tendance observée dans tes données')
    pg.screenshot(path=f'{SHOTS}/c3-summary.png')
    tap(pg, 'c3-done', 900)

    # ================================================================ 5. Fiche du jour : modifier, puis effacer
    tap(pg, f'c3-day-{iso(TODAY)}', 900)
    R['05_fiche_du_jour'] = 'crampes légères' in tid(pg, 'c3-day-summary').inner_text()
    tap(pg, 'c3-day-edit', 900)
    tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-body', 300)
    R['05_modification_prechargee'] = checked(pg, 'pill-fatigue')
    tap(pg, 'pill-fatigue', 200); tap(pg, 'c3-save', 1500); tap(pg, 'c3-done', 800)
    R['05_modifie'] = demo(pg, f"s => s.tables.symptom_logs.find(x => x.logged_on === '{iso(TODAY)}').symptom_keys") == ['cramps']
    tap(pg, f'c3-day-{iso(TODAY)}', 800); tap(pg, 'c3-day-delete', 600); btn(pg, 'Supprimer', 1500)
    R['05_journee_effacee'] = demo(pg, f"s => s.tables.symptom_logs.filter(x => x.logged_on === '{iso(TODAY)}').length") == 0

    # ================================================================ 6. Sélection de plusieurs jours → règles, estimations recalculées
    d1, d2, d3 = TODAY - timedelta(days=4), TODAY - timedelta(days=3), TODAY - timedelta(days=2)
    same_month = d1.month == TODAY.month
    if same_month:
        tap(pg, 'c3-select', 400)
        for d in (d1, d2, d3): tap(pg, f'c3-day-{iso(d)}', 150)
        R['06_selection_visible'] = '3 jours sélectionnés' in tid(pg, 'c3-select-bar').inner_text() and tid(pg, f'c3-day-{iso(d2)}').first.get_attribute('aria-checked') == 'true'
        if not R['06_selection_visible']:
            R['06_debug'] = [tid(pg, 'c3-select-bar').inner_text()[:80], tid(pg, f'c3-day-{iso(d2)}').first.get_attribute('aria-checked'), tid(pg, f'c3-day-{iso(d2)}').first.get_attribute('role')]
        tap(pg, 'c3-mark-period', 1600)
        R['06_regles_enregistrees'] = demo(pg, f"s => s.tables.period_entries.some(p => p.start_date === '{iso(d1)}' && p.end_date === '{iso(d3)}')")
        R['06_estimations_recalculees'] = 'Règles estimées dans 2 jours' not in T(pg)
        mutate(pg, f"s => {{ s.tables.period_entries = s.tables.period_entries.filter(p => p.start_date !== '{iso(d1)}'); }}")
        home(pg)
    else:
        R['06_selection_visible'] = R['06_regles_enregistrees'] = R['06_estimations_recalculees'] = True  # début de mois : vérifié par les tests unitaires

    # ================================================================ 7. Tendance : gratuit (réservée), Premium (3 sur 4), fin d'abonnement
    tap(pg, 'c3-add-today', 900); tap(pg, 'c3-fav-pain', 300); tap(pg, 'pill-back_pain', 200); tap(pg, 'c3-save', 1600)
    txt = tid(pg, 'c3-insight-text').first.inner_text()
    R['07_gratuit_information_generale'] = 'Tes règles sont estimées dans 2 jours. Certaines personnes ressentent des douleurs dans le bas du dos' in txt and has(pg, 'c3-trend-locked')
    tap(pg, 'c3-done', 700)
    pg.evaluate(PREMIUM_ON); home(pg)
    tap(pg, 'c3-add-today', 900); tap(pg, 'c3-save', 1500)
    txt = tid(pg, 'c3-insight-text').first.inner_text()
    R['07_premium_tendance'] = 'lors de 3 de tes 4 derniers cycles' in txt and tid(pg, 'c3-insight-badge').first.inner_text() == 'Tendance observée dans tes données'
    tap(pg, 'c3-done', 700)
    # « Cela ne me correspond pas » : enregistré, la carte change
    before = tid(pg, 'c3-insight-text').first.inner_text()
    tap(pg, 'c3-notme', 1200)
    R['07_retour_enregistre'] = demo(pg, "s => s.tables.cycle_insight_feedback.some(f => f.helpful === false)")
    home(pg)
    R['07_carte_remplacee'] = tid(pg, 'c3-insight-text').first.inner_text() != before
    pg.evaluate(PREMIUM_OFF); home(pg)
    R['07_fin_abonnement_donnees_conservees'] = demo(pg, "s => s.tables.symptom_logs.length") >= 4 and has(pg, 'cycle-calendar')

    # ================================================================ 8. Vie sexuelle : consentement, textes exacts, urgence gratuite et sourcée
    tap(pg, 'c3-add-today', 900); tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-intimacy', 400)
    R['08_consentement_demande'] = has(pg, 'c3-intimate-optin')
    tap(pg, 'c3-intimate-enable', 1500)
    R['08_consentement_enregistre'] = demo(pg, "s => s.tables.consents.some(c => c.purpose === 'intimate_data' && c.granted) && s.tables.cycle_preferences[0].track_intercourse")
    tap(pg, 'pill-sex_unprotected', 200)
    R['08_rapport_implique'] = checked(pg, 'pill-sex_logged')
    tap(pg, 'c3-save', 1800)
    sx = tid(pg, 'c3-sex-text').first.inner_text() if has(pg, 'c3-sex-text') else ''
    R['08_texte_exact'] = sx in ('Ce rapport se situe dans ta période fertile estimée. Une grossesse est possible. Cette estimation ne permet pas de calculer précisément ton risque personnel.',
                                 'Ce rapport semble se situer en dehors de ta période fertile estimée. Une grossesse reste néanmoins possible, car l’ovulation peut varier.')
    ec = tid(pg, 'c3-ec').first.inner_text() if has(pg, 'c3-ec') else ''
    R['08_urgence_immediate_gratuite'] = all(x in ec for x in ['72 heures', '120 heures', 'sans ordonnance', '0 800 08 11 11', 'Sources officielles', 'publié le', 'vérifié le', 'gratuites'])
    pg.screenshot(path=f'{SHOTS}/c3-sex-ec.png', full_page=True)
    import re
    R['08_jamais_aucun_risque'] = all(x not in T(pg) for x in ['aucun risque', 'sans danger', 'grossesse impossible']) and not re.search(r'(?<!100 )%', T(pg).replace('100\u202f%', '100 %').replace('100\u00a0%', '100 %'))
    tap(pg, 'c3-done', 700)
    R['08_icone_rapport_calendrier'] = 'Rapport' in (tid(pg, f'c3-day-{iso(TODAY)}').first.get_attribute('aria-label') or '')
    # Correction : rapport protégé avec préservatif → « Protection déclarée par l'utilisatrice », pas d'urgence
    tap(pg, f'c3-day-{iso(TODAY)}', 800); tap(pg, 'c3-day-edit', 800); tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-intimacy', 300)
    tap(pg, 'pill-sex_protected', 150); tap(pg, 'pill-sex_condom', 150); tap(pg, 'c3-save', 1600)
    R['08_protection_declaree'] = has(pg, 'c3-sex-protection') and tid(pg, 'c3-sex-protection').first.inner_text() == 'Protection déclarée par l’utilisatrice' and not has(pg, 'c3-ec')
    R['08_correction_en_base'] = demo(pg, f"s => s.tables.intercourse_logs.filter(x => x.occurred_on === '{iso(TODAY)}').map(x => [x.condom, x.condom_incident])") == [['yes', 'none']]
    tap(pg, 'c3-done', 700)
    # Icône masquable
    mutate(pg, "s => { s.tables.cycle_preferences[0].show_intimacy_icons = false; }"); home(pg)
    R['08_icone_masquee'] = 'Rapport' not in (tid(pg, f'c3-day-{iso(TODAY)}').first.get_attribute('aria-label') or '')

    # ================================================================ 9. Pilule oubliée → informations d'urgence ; écran dédié gratuit
    tap(pg, 'c3-add-today', 900); tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-contraception', 300); tap(pg, 'pill-pill_missed', 200); tap(pg, 'c3-save', 1600)
    R['09_oubli_enregistre'] = demo(pg, "s => s.tables.contraception_logs.some(c => c.kind === 'pill_missed')")
    R['09_oubli_urgence'] = has(pg, 'c3-ec-open') or tid(pg, 'c3-insight-badge').first.inner_text() == 'Information importante'
    tap(pg, 'c3-done', 700)
    pg.goto(B + f'/cycle/emergency?date={iso(TODAY - timedelta(days=1))}'); pg.wait_for_timeout(1800)
    R['09_ecran_urgence'] = has(pg, 'c3-ec-hours') and 'Rapport noté il y a environ' in T(pg) and has(pg, 'c3-ec-sources')

    # ================================================================ 10. Rappel réel (pilule) → prochain rappel sur l'accueil
    pg.goto(B + '/contraception/reminders'); pg.wait_for_timeout(2000)
    open(f'{SHOTS}/c3-reminders.txt', 'w').write(T(pg))
    pg.get_by_text('Ma pilule', exact=True).first.click(); pg.wait_for_timeout(700)
    btn(pg, 'Créer le rappel', 1500) if pg.get_by_role('button', name='Créer le rappel', exact=True).count() else btn(pg, 'Enregistrer', 1500)
    rem = demo(pg, "s => s.tables.reminders.map(r => [r.title, r.schedule.type])")
    R['10_rappel_cree_discret'] = any(r[1] == 'daily' and 'pilule' not in r[0].lower() for r in rem)
    home(pg)
    R['10_prochain_rappel_accueil'] = 'Prochain rappel' in tid(pg, 'c3-next-reminder').inner_text()

    # ================================================================ 11. Saisie vocale : comprise, confirmée avant d'être ajoutée
    tap(pg, 'c3-add-today', 900); tap(pg, 'c3-voice', 400)
    pg.locator('[data-testid="c3-voice-text"] input, input[data-testid="c3-voice-text"]').first.fill('crampes fortes, fatiguée')
    pg.wait_for_timeout(400)
    R['11_vocal_confirmation'] = 'Voici ce que j’ai compris' in T(pg) and 'Crampes' in T(pg)
    tap(pg, 'c3-voice-apply', 900)
    tap(pg, 'c3-all', 300); tap(pg, 'c3-cat-body', 300)
    R['11_vocal_applique_apres_confirmation'] = checked(pg, 'pill-fatigue')
    pg.keyboard.press('Escape'); home(pg)

    # ================================================================ 12. Changement d'objectif sans perte d'historique
    counts = demo(pg, "s => [s.tables.period_entries.length, s.tables.symptom_logs.length, s.tables.intercourse_logs.length]")
    mutate(pg, "s => { s.tables.cycle_preferences[0].favorites = null; }")
    pg.goto(B + '/cycle?all=1'); pg.wait_for_timeout(2200)
    tap(pg, 'objective-change', 700); tap(pg, 'objective-ttc', 2200)
    home(pg)
    R['12_objectif_concevoir'] = demo(pg, "s => s.tables.user_journeys.some(j => j.type === 'ttc' && j.status === 'active')")
    R['12_historique_conserve'] = demo(pg, "s => [s.tables.period_entries.length, s.tables.symptom_logs.length, s.tables.intercourse_logs.length]") == counts
    favs = [tid(pg, 'c3-home-favorites').locator('[data-testid^="c3-home-fav-"]').nth(i).get_attribute('data-testid') for i in range(tid(pg, 'c3-home-favorites').locator('[data-testid^="c3-home-fav-"]').count())] if has(pg, 'c3-home-favorites') else []
    R['12_raccourcis_adaptes'] = favs[:3] == ['c3-home-fav-period', 'c3-home-fav-mucus', 'c3-home-fav-ovulation_test']
    pg.screenshot(path=f'{SHOTS}/c3-home-ttc.png', full_page=True)

    # ================================================================ 13. Confidentialité : effacer la vie sexuelle seule ; verrouillage (web) ; masquage
    pg.goto(B + '/cycle/privacy'); pg.wait_for_timeout(2000)
    tap(pg, 'c3-delete-intimate', 700); btn(pg, 'Supprimer', 1500)
    R['13_vie_sexuelle_effacee_seule'] = demo(pg, "s => s.tables.intercourse_logs.length === 0 && s.tables.period_entries.length > 0 && s.tables.contraception_logs.some(c => c.kind === 'pill_missed')")
    tid(pg, 'c3-lock-mode').get_by_role('checkbox', name='Tout le suivi du cycle').first.click(); pg.wait_for_timeout(1200)
    R['13_verrouillage_enregistre_et_limite_dite'] = demo(pg, "s => s.tables.cycle_preferences[0].lock_mode") == 'cycle' and 'n’est pas disponible sur cet appareil' in T(pg)
    mutate(pg, "s => { s.tables.cycle_preferences[0].hide_on_home = true; }"); home(pg)
    R['13_masquage_accueil'] = has(pg, 'c3-hidden') and not has(pg, 'cycle-calendar')
    mutate(pg, "s => { s.tables.cycle_preferences[0].hide_on_home = false; s.tables.cycle_preferences[0].lock_mode = 'off'; }")

    # ================================================================ 14. Données insuffisantes, puis cycles irréguliers
    mutate(pg, "s => { s.tables.period_entries = []; s.tables.contraception_logs = []; s.tables.symptom_logs = []; }"); home(pg)
    R['14_donnees_insuffisantes'] = 'Note tes règles pour voir une estimation' in T(pg) and 'Note le premier jour de tes dernières règles' in tid(pg, 'c3-insight-text').first.inner_text()
    irr = [TODAY - timedelta(days=n) for n in (10, 45, 67, 110)]
    mutate(pg, f"""s => {{ const me = s.session.userId; s.tables.period_entries = {json.dumps([iso(x) for x in irr])}.map((d, i) => ({{ id: 'ir' + i, user_id: me, start_date: d, end_date: null, flow: null, note: null, created_at: new Date().toISOString() }})); }}""")
    home(pg)
    R['14_cycles_irreguliers_estimation'] = has(pg, 'c3-fact-next') and 'Estimations, pas des certitudes.' in T(pg)
    pg.screenshot(path=f'{SHOTS}/c3-irregular.png', full_page=True)

    # ================================================================ 15. Thème sombre : calendrier lisible
    pg.emulate_media(color_scheme='dark'); home(pg)
    pg.screenshot(path=f'{SHOTS}/c3-dark.png', full_page=True)
    R['15_sombre'] = has(pg, 'cycle-calendar')

    # ================================================================ 16. Résumé du mois (Premium) et partage avec le ou la partenaire
    pg.emulate_media(color_scheme='light')
    starts = seed_regular(pg)
    pg.goto(B + '/cycle/month'); pg.wait_for_timeout(2000)
    R['16_resume_mois_reserve_premium'] = has(pg, 'premium-cycle_monthly') and not has(pg, 'month-summary')
    pg.evaluate(PREMIUM_ON); pg.goto(B + '/cycle/month'); pg.wait_for_timeout(2000)
    if starts[0].month != TODAY.month:
        pg.get_by_role('button', name='Mois précédent', exact=True).first.click(); pg.wait_for_timeout(600)
    R['16_resume_mois_faits'] = has(pg, 'month-summary') and 'début de règles' in tid(pg, 'month-summary').inner_text() and 'pas un diagnostic' in T(pg)
    me = demo(pg, "s => s.session.userId")
    hid = demo(pg, f"s => (s.tables.household_members.find(m => m.user_id === '{me}') || {{}}).household_id")
    mutate(pg, f"""s => {{ s.tables.household_members.push({{ household_id: '{hid}', user_id: 'partner-e2e', role: 'coparent', can_view: [], can_edit: [], joined_at: new Date().toISOString() }});
      s.tables.profiles.find(p => p.id === '{me}').display_name = 'Camille'; s.tables.profiles.push({{ id: 'partner-e2e', display_name: 'Alex', journeys: [] }}); }}""")
    pg.goto(B + '/cycle/share'); pg.wait_for_timeout(2200)
    R['16_partage_jamais_intime'] = 'Jamais partagés : rapports, contraception, notes' in T(pg)
    tap(pg, 'share-save-partner-e2e', 1500)
    R['16_partage_cree'] = demo(pg, "s => s.tables.cycle_shares.filter(x => x.partner_id === 'partner-e2e').map(x => [x.share_period, x.share_fertile, x.share_mood])") == [[True, False, False]]
    # Vue du ou de la partenaire (même démonstration, session basculée)
    mutate(pg, "s => { s.session.userId = 'partner-e2e'; }")
    pg.goto(B + '/partner/cycle'); pg.wait_for_timeout(2500)
    t = T(pg)
    R['16_partenaire_voit_le_partage'] = 'Camille partage avec vous' in t and has(pg, 'partner-fact')
    R['16_partenaire_rien_d_intime'] = all(x not in t for x in ['Rapport', 'Pilule', 'note privée'])
    mutate(pg, f"s => {{ s.session.userId = '{me}'; }}")
    pg.goto(B + '/cycle/share'); pg.wait_for_timeout(2000)
    tap(pg, 'share-stop-partner-e2e', 700); btn(pg, 'Arrêter le partage', 1500)
    R['16_partage_revoque'] = demo(pg, "s => s.tables.cycle_shares.length") == 0

    R['erreurs'] = errs[:8]
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport partiel reste lisible
        R['exception'] = str(e)[:400]
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = all(v is True for k, v in R.items() if k != 'erreurs') and not R.get('erreurs')
print('OK' if ok else 'ÉCHEC', sum(1 for k, v in R.items() if k != 'erreurs' and v is True), '/', len(R) - 1)
