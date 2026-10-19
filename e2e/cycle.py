"""
Module cycle de bout en bout (version web de démonstration, sans compte) :
règles (5 flux, saisie passée, modification), calendrier (enregistré ≠ estimé, détail du jour), symptômes,
pertes (3 étapes, orientation immédiate), fiche, saignement inhabituel (orientation AVANT l'enregistrement),
journal, statistiques, export PDF, carte d'accueil personnalisable, masquage, effacement de toutes les données.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/cycle.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, subprocess, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def T(pg):
    return pg.inner_text('body')


def click(pg, name, exact=True):
    pg.get_by_role('button', name=name, exact=exact).filter(visible=True).last.click()


def pick(pg, name):
    """Puce de choix (radio ou case) par son libellé."""
    pg.locator(f'[aria-label="{name}"]').filter(visible=True).first.click()


def fill(pg, label, value, nth=0):
    pg.get_by_label(label, exact=True).filter(visible=True).nth(nth).fill(value)


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)

    # Parcours « suivre mon cycle » et profil « moi » (pour la carte d'accueil)
    pg.evaluate("""() => {
      const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1'));
      for (const p of s.tables.profiles || []) p.journeys = ['cycle'];
      // Parcours « suivre mon cycle » actif (table user_journeys) ; plus de grossesse en cours
      const me = s.tables.profiles[0].id;
      s.tables.user_journeys = (s.tables.user_journeys || []).filter(j => j.type === 'baby' || j.type === 'child');
      s.tables.user_journeys.push({ id: 'j-cycle', user_id: me, household_id: null, type: 'cycle', status: 'active', started_on: '2026-01-01', ended_on: null, end_reason: null, pregnancy_id: null, child_id: null, created_at: new Date().toISOString() });
      s.tables.pregnancies = []; // pas de grossesse en cours : sinon aucune alerte de contraception d'urgence (règle voulue)
      s.tables.period_entries = []; s.tables.symptom_logs = [];
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
      const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}');
      ui.state.subject = { type: 'me' }; localStorage.setItem('toietmoi.ui', JSON.stringify(ui));
    }""")

    # 1. Règles : deux saisies passées, flux, modification
    pg.goto(B + '/cycle?all=1'); pg.wait_for_timeout(2500)
    R['1_hub_ouvert'] = 'Aucune règle enregistrée' in T(pg)
    fill(pg, 'Premier jour', '20/08/2026'); fill(pg, 'Dernier jour', '24/08/2026'); pick(pg, 'Moyen')
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    fill(pg, 'Premier jour', '17/09/2026'); fill(pg, 'Dernier jour', '30/09/2026'); pick(pg, 'Très abondant')
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    rows = demo(pg, "s => s.tables.period_entries.map(p => [p.start_date, p.end_date, p.flow])")
    R['1_regles_passees_enregistrees'] = sorted(rows) == [['2026-08-20', '2026-08-24', 'medium'], ['2026-09-17', '2026-09-30', 'very_heavy']]
    # Erreur : fin avant début
    fill(pg, 'Premier jour', '10/10/2026'); fill(pg, 'Dernier jour', '05/10/2026'); click(pg, 'Enregistrer'); pg.wait_for_timeout(600)
    R['1_validation_dates'] = 'La date de fin doit être valide' in T(pg)
    fill(pg, 'Dernier jour', '')
    # Modification explicite de la 2e saisie (jamais silencieuse)
    pg.get_by_role('button', name='Modifier', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(600)
    fill(pg, 'Dernier jour', '21/09/2026'); pick(pg, 'Abondant'); click(pg, 'Enregistrer les modifications'); pg.wait_for_timeout(1500)
    rows = demo(pg, "s => s.tables.period_entries.map(p => [p.start_date, p.end_date, p.flow])")
    R['1_modification'] = ['2026-09-17', '2026-09-21', 'heavy'] in rows and len(rows) == 2
    t = T(pg)
    R['1_estimation_libellee'] = 'Prochaines règles estimées' in t and 'estimations' in t
    pg.screenshot(path=f'{SHOTS}/cycle-hub.png', full_page=True)

    # 2. Calendrier : enregistré et estimé distincts, détail du jour
    pg.goto(B + '/cycle/calendar'); pg.wait_for_timeout(2000)
    click(pg, 'Mois précédent'); pg.wait_for_timeout(900)
    t = T(pg)
    R['2_legende'] = 'Règles enregistrées' in t and 'Règles estimées' in t
    day = pg.locator('[aria-label*="18 septembre"]').filter(visible=True).first
    day.click(); pg.wait_for_timeout(900)
    R['2_detail_jour'] = 'Règles enregistrées' in T(pg) and pg.get_by_role('button', name='Noter des symptômes').filter(visible=True).count() > 0
    pg.screenshot(path=f'{SHOTS}/cycle-calendar.png', full_page=True)
    click(pg, 'Noter des symptômes'); pg.wait_for_timeout(1500)

    # 3. Symptômes du jour choisi, intensité, échelles
    R['3_date_reprise'] = pg.get_by_label('Jour', exact=True).filter(visible=True).first.input_value() == '18/09/2026'
    pick(pg, 'Crampes'); pick(pg, 'Fatigue'); pg.wait_for_timeout(300)
    pg.get_by_role('button', name='Forte', exact=True).filter(visible=True).first.click()
    pg.locator('[aria-label="Humeur 2/5"]').filter(visible=True).first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    s = demo(pg, "s => s.tables.symptom_logs.map(x => [x.logged_on, x.symptom_keys, x.intensities, x.mood])")
    R['3_symptomes'] = any(x[0] == '2026-09-18' and set(x[1]) == {'cramps', 'fatigue'} and x[2].get('cramps') == 3 and x[3] == 2 for x in s)

    # 4. Pertes : orientation immédiate + fiches liées
    pg.goto(B + '/cycle/discharge/new'); pg.wait_for_timeout(1800)
    pick(pg, 'Modérée'); pick(pg, 'Blanc crème'); pick(pg, 'Grumeleuse')
    click(pg, 'Continuer'); pg.wait_for_timeout(600)
    pick(pg, 'Démangeaisons'); pg.wait_for_timeout(500)
    R['4_orientation_immediate'] = 'Consultation conseillée' in T(pg) and 'plusieurs causes possibles' in T(pg)
    R['4_fiches_liees'] = pg.get_by_role('button', name='Démangeaisons et irritation', exact=False).filter(visible=True).count() + pg.get_by_role('button', name='Pertes épaisses', exact=False).filter(visible=True).count() > 0
    click(pg, 'Continuer'); pg.wait_for_timeout(600)
    R['4_contexte_jour_du_cycle'] = 'Jour ' in T(pg) and 'du cycle' in T(pg)
    fill(pg, 'Note', 'Après la piscine')
    pg.screenshot(path=f'{SHOTS}/cycle-discharge.png', full_page=True)
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1800)
    d = demo(pg, "s => s.tables.discharge_logs.map(x => [x.amount, x.color, x.textures, x.symptoms, x.note])")
    R['4_pertes_enregistrees'] = d == [['moderate', 'creamy_white', ['lumpy'], ['itching'], 'Après la piscine']]
    t = T(pg)
    R['4_recapitulatif_et_conseil'] = 'Récapitulatif' in t and 'Plusieurs causes sont possibles' in t and 'D’après ce que vous avez indiqué' in t and 'Démangeaisons' in t
    pg.screenshot(path=f'{SHOTS}/cycle-recap-discharge.png', full_page=True)

    # 5. Fiche pédagogique : sources officielles
    pg.goto(B + '/cycle/guides/clear-fluid'); pg.wait_for_timeout(1800)
    t = T(pg)
    R['5_fiche_sources'] = 'NHS' in t and 'Quand demander un avis' in t and 'Limites' in t

    # 6. Saignement pendant une grossesse, abondant : urgence affichée AVANT l'enregistrement
    pg.goto(B + '/cycle/bleeding'); pg.wait_for_timeout(1800)
    R['6_aide_sans_rien_remplir'] = 'Besoin d’aide tout de suite' in T(pg)
    pick(pg, 'Pendant une grossesse'); pg.wait_for_timeout(300)
    R['6_consulter_des_le_choix'] = 'Demandez un avis médical' in T(pg)
    pick(pg, 'Abondant'); pg.wait_for_timeout(300)
    R['6_urgence_avant_enregistrement'] = 'Appelez les urgences maintenant' in T(pg) and demo(pg, "s => s.tables.bleeding_logs.length") == 0
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    R['6_saignement_enregistre'] = demo(pg, "s => s.tables.bleeding_logs.map(x => [x.kind, x.amount])") == [['during_pregnancy', 'heavy']]

    # 7. Journal
    pg.goto(B + '/cycle/journal?date=2026-09-19'); pg.wait_for_timeout(1800)
    fill(pg, 'Note', 'Journée fatigante mais sereine.'); click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    R['7_journal'] = demo(pg, "s => s.tables.cycle_journal.map(x => [x.entry_on, x.body])") == [['2026-09-19', 'Journée fatigante mais sereine.']]

    # 8. Statistiques descriptives
    pg.goto(B + '/cycle/stats'); pg.wait_for_timeout(2000)
    t = T(pg)
    R['8_stats'] = '28 j' in t and 'Crampes' in t and 'Cycle du' in t
    pg.screenshot(path=f'{SHOTS}/cycle-stats.png', full_page=True)

    # 9. Export PDF (sans le journal par défaut)
    pg.goto(B + '/cycle/export'); pg.wait_for_timeout(1800)
    with pg.expect_download() as dl: click(pg, 'Télécharger le PDF')
    path = f'{SHOTS}/cycle.pdf'; dl.value.save_as(path)
    out = subprocess.run(['node', '-e', "const {PDFDocument}=require('pdf-lib');PDFDocument.load(require('fs').readFileSync(process.argv[1])).then(d=>console.log(d.getPageCount()))", path], capture_output=True, text=True, cwd=os.getcwd())
    R['9_export_pdf'] = dl.value.suggested_filename.startswith('cycle-') and out.stdout.strip().isdigit() and int(out.stdout.strip()) >= 1
    txt = subprocess.run(['pdftotext', path, '-'], capture_output=True, text=True).stdout  # le texte du PDF est compressé : on l'extrait
    R['9_contenu_pdf'] = 'Crampes, Fatigue' in txt and 'Démangeaisons' in txt and '(estimation)' in txt
    R['9_journal_exclu'] = 'Journal' not in txt and 'sereine' not in txt

    # 10. Carte d'accueil : données, personnalisation, masquage
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    t = T(pg)
    R['10_carte_accueil'] = 'Dernières règles (enregistrées)' in t and 'Prochaines règles (estimation)' in t and 'Noter mes règles' in t
    click(pg, 'Personnaliser cette carte'); pg.wait_for_timeout(1500)
    pg.get_by_role('switch', name='Statistiques').filter(visible=True).first.click()
    pick(pg, 'Calendrier'); pick(pg, 'Journal'); pg.wait_for_timeout(300)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    t = T(pg)
    R['10_personnalisation'] = 'Durée moyenne des règles' in t and pg.get_by_role('button', name='Journal', exact=True).filter(visible=True).count() > 0
    pg.goto(B + '/cycle/privacy'); pg.wait_for_timeout(1500)
    pg.get_by_role('switch', name='Masquer mon cycle sur l’accueil').filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    t = T(pg)
    R['10_masquage'] = 'Données masquées' in t and 'Dernières règles (enregistrées)' not in t
    pg.screenshot(path=f'{SHOTS}/cycle-home-hidden.png')

    # 12. Rapports : activation, rapport non protégé en période fertile estimée, puis rapport protégé, puis incertain
    pg.goto(B + '/cycle/intimacy'); pg.wait_for_timeout(1800)
    if 'Activer le suivi des rapports' in T(pg):
        click(pg, 'Activer le suivi des rapports'); pg.wait_for_timeout(1500)
    R['12_rapport_sans_detail_possible'] = pg.get_by_role('button', name='Ajouter des détails (facultatif)').filter(visible=True).count() > 0
    from datetime import date, timedelta
    fr = lambda d: d.strftime('%d/%m/%Y')
    today = date.today()
    # règles récentes pour que le jour J-1 tombe dans la fenêtre estimée : début il y a 13 jours, cycles de 28 jours
    pg.evaluate(f"""() => {{ const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session?.user?.id || (s.tables.profiles[0]||{{}}).id;
      const d = (n) => {{ const x = new Date(Date.now() - n*86400000); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }}; // date LOCALE (pas UTC)
      s.tables.period_entries = [d(69), d(41), d(13)].map((x, i) => ({{ id: 'pp'+i, user_id: me, start_date: x, end_date: null, flow: null, note: null, created_at: new Date().toISOString() }}));
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }}""")
    pg.goto(B + '/cycle/intimacy'); pg.wait_for_timeout(1800)
    fill(pg, 'Date', fr(today - timedelta(days=1)))
    click(pg, 'Ajouter des détails (facultatif)'); pg.wait_for_timeout(500)
    pg.locator('[aria-label="Préservatif"] [aria-label="Non"]').filter(visible=True).first.click()
    pg.locator('[aria-label="Contraception habituelle"] [aria-label="Non"]').filter(visible=True).first.click()
    pg.locator('[aria-label="Souhait de grossesse"] [aria-label="Non"]').filter(visible=True).first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(2200)
    t = T(pg)
    R['T1_conseil_rapport_non_protege'] = 'Risque de grossesse possible' in t and 'Avis médical rapide' in t
    R['T1_incertitude_ovulation'] = 'n’est qu’une estimation' in t and 'fenêtre fertile estimée' in t
    R['T1_actions'] = all(pg.get_by_role('button', name=n).filter(visible=True).count() > 0 for n in ['Informations sur la contraception d’urgence', 'Trouver un professionnel de santé', 'Comprendre le risque de grossesse', 'Modifier ma réponse'])
    R['T1_aucune_certitude'] = 'vous êtes enceinte' not in t.lower()
    pg.screenshot(path=f'{SHOTS}/cycle-sex-risk.png', full_page=True)
    # Trouver un professionnel : annuaire officiel, aucune intégration fictive (Test 10)
    click(pg, 'Trouver un professionnel de santé'); pg.wait_for_timeout(1500)
    t = T(pg)
    R['T10_recherche_pro'] = 'Vous souhaitez en parler à un professionnel' in t and 'Centres de santé sexuelle' in t and 'Annuaire santé' in t and 'Doctolib' not in t
    # le site s'ouvre dans un nouvel onglet : on enregistre l'adresse demandée (l'environnement de test n'a pas accès à Internet)
    pg.evaluate("() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; }")
    click(pg, 'Rechercher un professionnel'); pg.wait_for_timeout(500)
    opened = pg.evaluate('() => window.__opened')
    R['T10_destination_valide'] = opened == ['https://www.questionsexualite.fr/trouver-un-professionnel']
    # Rapport protégé sans incident : aucune alerte (Test 2)
    pg.goto(B + '/cycle/intimacy'); pg.wait_for_timeout(1500)
    click(pg, 'Ajouter des détails (facultatif)'); pg.wait_for_timeout(400)
    pg.locator('[aria-label="Préservatif"] [aria-label="Oui"]').filter(visible=True).first.click(); pg.wait_for_timeout(300)
    pg.locator('[aria-label="Incident de préservatif"] [aria-label="Aucun"]').filter(visible=True).first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(2000)
    t = T(pg)
    R['T2_protege_aucune_alerte'] = 'Rien de particulier à signaler' in t and 'contraception d’urgence' not in t
    # Protection incertaine (Test 3)
    pg.goto(B + '/cycle/intimacy'); pg.wait_for_timeout(1500)
    click(pg, 'Ajouter des détails (facultatif)'); pg.wait_for_timeout(400)
    pg.locator('[aria-label="Préservatif"] [aria-label="Je ne sais pas"]').filter(visible=True).first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(2000)
    t = T(pg)
    R['T3_incertain_question'] = 'Souhaitez-vous préciser la protection' in t and 'Pouvez-vous préciser' in t
    rows = demo(pg, "s => s.tables.intercourse_logs.map(x => [x.condom, x.usual_contraception, x.pregnancy_wish])")
    R['T3_absence_reponse_non_convertie'] = ['unsure', None, None] in [[r[0], r[1], r[2]] for r in rows]

    # 13. Douleurs : jauge, zone sur la silhouette, retentissement → conseil (Tests 5, 11)
    pg.goto(B + '/cycle/pain'); pg.wait_for_timeout(1800)
    for _ in range(6): pg.get_by_role('button', name='Augmenter').filter(visible=True).first.click()
    pg.locator('[aria-label="Zones (liste)"] [aria-label="Bas-ventre"]').filter(visible=True).first.click()
    pg.wait_for_timeout(300)
    pg.locator('[aria-label="Retentissement"] [aria-label="Travail"]').filter(visible=True).first.click()
    pg.locator('[aria-label="Par rapport à d’habitude"] [aria-label="Habituelle"]').filter(visible=True).first.click()
    pg.screenshot(path=f'{SHOTS}/cycle-pain.png', full_page=True)
    click(pg, 'Enregistrer'); pg.wait_for_timeout(2000)
    t = T(pg)
    R['T5_douleur_quotidien_consultation'] = 'Vos douleurs méritent d’être prises au sérieux' in t and pg.get_by_role('button', name='Trouver un professionnel de santé').filter(visible=True).count() > 0
    p = demo(pg, "s => s.tables.symptom_logs.filter(x => x.pain_intensity != null).map(x => [x.pain_intensity, x.pain_locations, x.pain_impact])")
    R['T11_donnees_enregistrees'] = [5, ['lower_abdomen'], ['work']] in p  # 6 appuis sur « + » depuis « non renseignée » : 0 puis 1…5
    # Douleur forte + malaise : urgence (Test 6)
    pg.goto(B + '/cycle/pain'); pg.wait_for_timeout(1800)
    for _ in range(3): pg.get_by_role('button', name='Augmenter').filter(visible=True).first.click()
    click(pg, 'Préciser d’autres signes (facultatif)'); pg.wait_for_timeout(400)
    pg.locator('[aria-label="Signes associés"] [aria-label="Malaise ou étourdissements"]').filter(visible=True).first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(2000)
    t = T(pg)
    R['T6_urgence'] = 'Appelez les urgences' in t and 'Urgence' in t and pg.get_by_role('button', name='Numéros d’urgence').filter(visible=True).count() > 0

    # 14. Mes conseils, roue du cycle, « Mes règles ont commencé » + annulation
    pg.goto(B + '/cycle/advice'); pg.wait_for_timeout(1800)
    t = T(pg)
    R['14_mes_conseils'] = 'Mes conseils' in t and 'Risque de grossesse possible' in t and 'Rien n’est envoyé à un service externe' in t
    pg.goto(B + '/cycle?all=1'); pg.wait_for_timeout(2500)
    t = T(pg)
    R['14_roue_du_cycle'] = pg.locator('[aria-label*="Jour 14 d’un cycle"]').count() > 0 and 'Fenêtre fertile (estimée)' in t
    vis = lambda name: pg.get_by_role('button', name=name).filter(visible=True)
    vis('Ovulation (estimée)').first.click(); pg.wait_for_timeout(500)
    R['14_phase_detail'] = 'n’est confirmée par aucune mesure' in T(pg)
    pg.screenshot(path=f'{SHOTS}/cycle-ring.png', full_page=True)
    # fin des règles en un geste, puis annulation
    vis('Mes règles sont terminées').first.click(); pg.wait_for_timeout(1500)
    R['14_regles_terminees'] = demo(pg, "s => s.tables.period_entries.find(p => p.id === 'pp2').end_date") is not None and 'Fin des règles enregistrée' in T(pg)
    vis('Annuler').first.click(); pg.wait_for_timeout(1500)
    R['14_annulation_fin'] = demo(pg, "s => s.tables.period_entries.find(p => p.id === 'pp2').end_date") is None
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.period_entries.find(p => p.id === 'pp2').end_date = (() => { const x = new Date(Date.now() - 9*86400000); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })(); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.goto(B + '/cycle?all=1'); pg.wait_for_timeout(2500)
    before = demo(pg, "s => s.tables.period_entries.length")
    vis('Mes règles ont commencé').first.click(); pg.wait_for_timeout(1500)
    R['14_regles_commencees'] = demo(pg, "s => s.tables.period_entries.length") == before + 1 and 'jour 1' in T(pg)
    vis('Annuler').first.click(); pg.wait_for_timeout(1500)
    R['14_annulation'] = demo(pg, "s => s.tables.period_entries.length") == before
    # Suppression d'un événement : ses conseils disparaissent (Test 9)
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.intercourse_logs = []; localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.goto(B + '/cycle/advice'); pg.wait_for_timeout(1800)
    R['T9_conseil_supprime_avec_l_evenement'] = 'Risque de grossesse possible' not in T(pg)

    # 11. Effacer toutes les données du cycle (confirmation)
    pg.goto(B + '/cycle/privacy'); pg.wait_for_timeout(1500)
    click(pg, 'Effacer mes données du cycle'); pg.wait_for_timeout(800)
    pg.get_by_role('button', name='Tout effacer').filter(visible=True).last.click(); pg.wait_for_timeout(2500)
    counts = demo(pg, "s => ['period_entries','symptom_logs','discharge_logs','bleeding_logs','cycle_journal'].map(t => s.tables[t].length)")
    R['11_effacement'] = counts == [0, 0, 0, 0, 0] and 'Aucune règle enregistrée' in T(pg)
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({'resultats': R, 'ok': all(R.values()), 'erreurs': errs}, ensure_ascii=False, indent=1))
sys.exit(0 if all(R.values()) and not errs else 1)
