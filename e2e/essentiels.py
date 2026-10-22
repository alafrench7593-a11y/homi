"""
Tests obligatoires de la réorganisation (version web de démonstration, sans compte).
Démo de départ : Camille enceinte, Lina (bébé) et Noé (enfant).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/essentiels.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from datetime import date, datetime, timedelta
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import SET_BODY  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
SA = re.compile(r'\b\d{1,2}\s*SA\b')
JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2400):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(1000)


def daylabel(d):
    return f'{JOURS[d.weekday()]} {d.day} {MOIS[d.month - 1]}'


def iso(d):
    return d.isoformat()


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    preg = demo(pg, "s => (s.tables.pregnancies.find(p => p.status === 'active') || {}).id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    # Lina : 7 mois (bébé suivi au biberon) ; Noé : 5 ans
    mutate(pg, f"""s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{iso(date.today() - timedelta(days=213))}';
      s.tables.children.find(c => c.id === '{noe}').birth_date = '{iso(date.today() - timedelta(days=5 * 365 + 30))}'; }}""")

    # ================================================================ Accueil limité à l'essentiel (mode simple)
    subject(pg, lina)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/ess_home_lina.png', full_page=True)
    # Profil enfant : « Le cocon du jour » (cocon, frise, 3 informations, « + Ajouter », un conseil), sans grille de cases
    ninfo = pg.locator('[data-testid^="cocoon-info-"]').count()
    R['accueil_essentiel'] = (tid(pg, 'home-card-main').is_visible() and pg.locator('[data-testid="cocoon"]').count() > 0 and ninfo == 3
                              and pg.locator('[data-testid="cocoon-add"]').count() > 0 and pg.locator('[data-testid="cocoon-ribbon"]').count() > 0
                              and pg.locator('[data-testid="home-card-quick"]').count() == 0 and pg.locator('[data-testid="home-journey"]').count() == 0)
    R['accueil_bebe_sans_SA'] = not SA.search(t)

    # ================================================================ Sélecteur de profils
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    ys = [tid(pg, f'subject-{k}').bounding_box()['y'] for k in ['me', 'preg', lina, noe, 'add']]
    labels = [tid(pg, f'subject-{k}').inner_text() for k in [lina, noe]]
    R['selecteur_moi_grossesse_lina_noe_ajouter'] = ys == sorted(ys) and 'Lina' in labels[0].split('\n') and 'Bébé Lina' not in labels[0] and 'Noé' in labels[1].split('\n') and 'Ajouter un profil' in tid(pg, 'subject-add').inner_text()
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)

    # ================================================================ Passage grossesse / Lina / Noé sans mélange
    subject(pg, 'preg')
    tp = T(pg)
    subject(pg, noe)
    tn = T(pg)
    R['grossesse_affiche_SA'] = bool(SA.search(tp)) and 'Biberon' not in tp
    R['noe_sans_SA_ni_biberon'] = not SA.search(tn) and 'Rappel biberon' not in tn and 'Lina' not in tn.split('Noé', 1)[-1][:400]
    go(pg, '/tools', 2600)
    mine = T(pg).split('Outils des autres profils')[0]
    R['outils_noe_sans_bebe_ni_grossesse'] = not any(x in mine for x in ['Biberon', 'Couches', 'Mon poids', 'Échographies'])

    # ================================================================ Grossesse : repères sourcés, cœur décoratif, rubriques, complément prescrit
    subject(pg, 'preg')
    go(pg, '/pregnancy', 3000)
    t = T(pg)
    R['grossesse_taille_poids_sources'] = 'mpedia' in tid(pg, 'fetal-source').inner_text() and 'pas les mesures de votre bébé' in t and 'poids moyen' in tid(pg, 'fetal-size').inner_text()
    R['grossesse_animation_coeur'] = pg.locator('[data-testid="fetus-heart"]').count() > 0
    R['grossesse_rubriques_voir_plus'] = tid(pg, 'preg-rubric-week').is_visible() and pg.locator('[data-testid="preg-rubric-community"]').count() == 0
    tid(pg, 'preg-rubrics-more').click(); pg.wait_for_timeout(500)
    R['grossesse_15_rubriques'] = all(pg.locator(f'[data-testid="preg-rubric-{k}"]').count() for k in
                                      ['week', 'body', 'weight', 'sleep', 'mood', 'meals', 'appointments', 'exams', 'docs', 'birth', 'lists', 'names', 'articles', 'assistant', 'community'])
    R['grossesse_prochain_rdv'] = tid(pg, 'preg-next-appt').is_visible()
    pg.screenshot(path=f'{SHOTS}/ess_pregnancy.png', full_page=True)
    go(pg, '/settings/reminders?new=supplement', 2600)
    R['complement_regle_affichee'] = 'déjà prescrit ou conseillé' in T(pg)
    tid(pg, 'rem-title').fill('Fer, comme prescrit')
    tid(pg, 'rem-time').fill('08:00')
    pg.get_by_role('button', name='Créer le rappel').filter(visible=True).first.click(); pg.wait_for_timeout(1500)
    R['complement_rattache_a_la_grossesse'] = demo(pg, f"s => s.tables.reminders.some(r => r.title === 'Fer, comme prescrit' && r.pregnancy_id === '{preg}' && !r.child_id && r.category === 'medication')")

    # ================================================================ Noé : médicament prescrit chaque jour à 17 h
    mutate(pg, f"s => {{ s.tables.child_treatments = s.tables.child_treatments.filter(t => t.child_id !== '{noe}'); s.tables.reminders = s.tables.reminders.filter(r => !r.treatment_id); }}")
    go(pg, f'/child/{noe}/needs?tab=treatments', 2600)
    tid(pg, 'treatment-add').click(); pg.wait_for_timeout(700)
    tid(pg, 't-name').fill('Traitement prescrit')
    tid(pg, 't-dose').fill('1 comprimé, comme sur l’ordonnance')
    tid(pg, 't-times').fill('17:00')
    tid(pg, 't-save').click(); pg.wait_for_timeout(1800)
    rows = demo(pg, "s => s.tables.reminders.filter(r => r.treatment_id).map(r => [r.child_id, r.schedule.type, r.schedule.hour, r.schedule.minute, r.title])")
    R['noe_medicament_17h_rattache_a_noe'] = rows == [[noe, 'daily', 17, 0, 'Noé · Traitement prescrit']]
    R['noe_actions_pris_reporter_ignorer'] = tid(pg, 'dose-17:00').is_visible() and all(x in T(pg) for x in ['Pris', 'Reporter', 'Ignorer'])
    tid(pg, 'dose-taken-17:00').click(); pg.wait_for_timeout(1200)
    R['noe_prise_notee'] = demo(pg, "s => s.tables.treatment_logs.filter(l => l.status === 'taken').length") >= 1
    go(pg, f'/child/{lina}/needs?tab=treatments', 2400)
    R['lina_sans_le_traitement_de_noe'] = 'Traitement prescrit' not in T(pg)

    # ================================================================ Neurodéveloppement : accessible sans diagnostic
    mutate(pg, f"s => {{ s.tables.child_needs = s.tables.child_needs.filter(n => n.child_id !== '{noe}'); }}")
    go(pg, f'/child/{noe}/needs', 2600)
    t = T(pg)
    R['besoin_particulier_titre_et_choix'] = 'Mon enfant a un besoin particulier' in t and all(x in t for x in ['TDAH', 'TSA', 'Troubles DYS', 'Troubles du langage', 'Difficultés sensorielles', 'Autre', 'Je me pose des questions'])
    pg.get_by_text('Je me pose des questions', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(300)
    pg.get_by_text('TDAH', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(300)
    tid(pg, 'needs-save').click(); pg.wait_for_timeout(1500)
    R['besoin_enregistre_sans_diagnostic'] = demo(pg, f"s => (s.tables.child_needs.find(n => n.child_id === '{noe}') || {{}}).kinds") == ['questions', 'adhd'] or demo(pg, f"s => (s.tables.child_needs.find(n => n.child_id === '{noe}') || {{}}).kinds") == ['adhd', 'questions']
    pg.get_by_role('radio', name='Pour vous').filter(visible=True).first.click() if pg.get_by_role('radio', name='Pour vous').count() else pg.get_by_text('Pour vous', exact=True).first.click()
    pg.wait_for_timeout(800)
    R['pour_vous_articles_tdah_et_questions'] = tid(pg, 'neuro-adhd').is_visible() and tid(pg, 'neuro-signs').is_visible() and tid(pg, 'neuro-medication').is_visible()
    R['articles_source_date_statut'] = 'Mis à jour le' in tid(pg, 'neuro-adhd').inner_text() and 'source' in tid(pg, 'neuro-adhd').inner_text()
    go(pg, '/article/neuro-premiers-signes-se-poser-des-questions', 2600)
    t = T(pg)
    R['article_neuro_ouvert_statut_references'] = 'À vérifier' in tid(pg, 'article-status').inner_text() and 'Références' in t and 'diagnostic' in t
    # Un parent sans aucun besoin coché trouve aussi les 17 articles
    subject(pg, lina)
    go(pg, '/library?cat=neurodeveloppement', 3000)
    pg.mouse.wheel(0, 8000); pg.wait_for_timeout(500)
    R['bibliotheque_neuro_pour_tous'] = T(pg).count('À vérifier') >= 10 and 'Le TDAH' in T(pg)

    # ================================================================ Recettes appétissantes, par âge, photo cohérente
    subject(pg, lina)
    go(pg, '/meals', 3000)
    t = T(pg)
    n0 = int(re.search(r'(\d+)\s+recette', tid(pg, 'recipes-count').inner_text()).group(1))
    R['recettes_bebe_7_mois'] = n0 >= 10 and 'Purée' in t and 'Lasagnes' not in t and 'Croque-monsieur' not in t
    R['recettes_filtres_rapides'] = all(x in tid(pg, 'rc-quick-filters').inner_text() for x in ['Classique', 'Familiale', 'Rapide', 'Petit budget', 'Poisson', 'Végétarien', 'Sans porc', 'Allergènes à exclure'])
    R['recettes_groupes_age_texture'] = tid(pg, 'rc-groups').is_visible() and 'Lisse' in tid(pg, 'rc-groups').inner_text()
    pg.get_by_text('Poisson', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(800)
    n1 = int(re.search(r'(\d+)\s+recette', tid(pg, 'recipes-count').inner_text()).group(1))
    R['recettes_filtre_poisson'] = 0 < n1 < n0 and 'recommandations françaises' in T(pg)
    go(pg, '/meals/puree-carotte-pomme-de-terre', 2800)
    ph = pg.locator('[data-testid="rphoto-puree-carotte-pomme-de-terre"]').first
    src = ph.locator('img').first.get_attribute('src') or ''
    R['photo_correspond_a_la_recette'] = 'carotte' in (ph.get_attribute('aria-label') or '').lower() and 'puree-carotte-pomme-de-terre' in src
    t = T(pg)
    R['fiche_congelation_statut_menu_courses'] = tid(pg, 'rc-freezing').is_visible() and 'À vérifier' in tid(pg, 'recipe-status').inner_text() and 'Ajouter au menu' in t and tid(pg, 'add-shopping').is_visible()
    tid(pg, 'rc-dislike').click(); pg.wait_for_timeout(1200)
    R['je_n_aime_pas_cette_idee'] = demo(pg, "s => s.tables.recipe_dislikes.some(d => d.recipe_slug === 'puree-carotte-pomme-de-terre')") and tid(pg, 'rc-disliked').is_visible()
    go(pg, '/meals', 3000)
    n2 = int(re.search(r'(\d+)\s+recette', tid(pg, 'recipes-count').inner_text()).group(1))
    R['idee_masquee_de_la_liste'] = n2 == n0 - 1 and tid(pg, 'recipes-hidden-toggle').is_visible()
    subject(pg, noe)
    go(pg, '/meals', 3000)
    t = T(pg)
    R['recettes_enfant_5_ans'] = 'Purée de courgette toute douce' not in t and int(re.search(r'(\d+)\s+recette', tid(pg, 'recipes-count').inner_text()).group(1)) >= 10

    # ================================================================ Prénoms : grande liste A–Z
    go(pg, '/names', 3000)
    cnt = tid(pg, 'names-count').inner_text()
    num = int(re.sub(r'\D', '', cnt.split('prénom')[0]) or 0)
    R['prenoms_grande_liste'] = num >= 1000

    # ================================================================ Vaccins et rendez-vous rattachés au bon enfant
    in3 = (datetime.now() + timedelta(days=3)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat()
    in5 = (datetime.now() + timedelta(days=5)).replace(hour=9, minute=30, second=0, microsecond=0).isoformat()
    mutate(pg, f"""s => {{ s.tables.appointments = s.tables.appointments.filter(a => !String(a.id).startsWith('ess-'));
      s.tables.appointments.push({{ id: 'ess-lina', household_id: '{hid}', pregnancy_id: null, child_id: '{lina}', for_parent: false, kind: 'pediatric', title: 'Pédiatre de Lina', starts_at: '{in3}', location_label: null, notes: null, questions: [], created_at: new Date().toISOString() }});
      s.tables.appointments.push({{ id: 'ess-noe', household_id: '{hid}', pregnancy_id: null, child_id: '{noe}', for_parent: false, kind: 'other', title: 'Orthophoniste de Noé', starts_at: '{in5}', location_label: null, notes: null, questions: [], created_at: new Date().toISOString() }}); }}""")
    go(pg, f'/appointments?child={noe}', 2600)
    t = T(pg)
    R['rdv_noe_seulement_sur_noe'] = 'Orthophoniste de Noé' in t and 'Pédiatre de Lina' not in t
    go(pg, f'/child/{lina}/vaccines', 2800)
    if pg.locator('[data-testid="vaccine-remind-2"]').count():
        tid(pg, 'vaccine-remind-2').click(); pg.wait_for_timeout(800)
        for c in ['care-rem-week', 'care-rem-two_weeks', 'care-rem-month']:
            loc = pg.locator(f'[data-testid="{c}"]')
            if loc.count() and loc.first.get_attribute('aria-disabled') != 'true':
                loc.first.click(); break
        tid(pg, 'care-rem-save').click(); pg.wait_for_timeout(1000)
        pg.keyboard.press('Escape')
    pg.wait_for_timeout(600)
    R['vaccins_rattaches_a_lina'] = 'Lina' in T(pg) and demo(pg, f"s => s.tables.reminders.filter(r => (r.deep_link || '').includes('/vaccines')).every(r => r.child_id === '{lina}')")

    # ================================================================ Saisie rapide « Lina a bu 150 ml à 14 h »
    subject(pg, lina)
    go(pg, '/track', 2600)
    tid(pg, 'quick-text').fill('Lina a bu 150 ml à 14 h')
    tid(pg, 'quick-parse').click(); pg.wait_for_timeout(500)
    res = tid(pg, 'quick-result').inner_text()
    R['saisie_rapide_comprise'] = 'Lina' in res and '150 ml' in res and '14 h 00' in res
    tid(pg, 'quick-open').click(); pg.wait_for_timeout(2500)
    before = demo(pg, f"s => s.tables.bottles.filter(x => x.child_id === '{lina}').length")
    tid(pg, 'track-save').click(); pg.wait_for_timeout(2500)
    last = demo(pg, f"s => s.tables.bottles.filter(x => x.child_id === '{lina}').sort((a, b) => b.created_at < a.created_at ? -1 : 1)[0]")
    at = datetime.fromisoformat(last['at'].replace('Z', '+00:00')).astimezone() if last else None
    R['saisie_rapide_enregistree_apres_verification'] = demo(pg, f"s => s.tables.bottles.filter(x => x.child_id === '{lina}').length") == before + 1 and last['consumed_ml'] == 150

    # ================================================================ Sommeil du bébé (estimation sur les relevés de la famille)
    go(pg, f'/child/{lina}', 2600)
    R['sommeil_bebe_carte'] = pg.locator('[data-testid="baby-sleep"]').count() > 0 and pg.locator('[data-testid="sleep-estimate"]').count() > 0

    # ================================================================ Cycle : règles du 16 au 20, modification, suppression
    pg.evaluate(SET_BODY, ['avoid', False])
    mutate(pg, "s => { s.tables.period_entries = []; s.tables.pregnancies.forEach(p => { if (p.status === 'active') { p.status = 'ended'; p.end_reason = 'unspecified'; } }); }")
    subject(pg, 'me')
    go(pg, '/cycle/calendar', 2800)
    today = date.today()
    base = today.replace(day=1) if today.day >= 20 else (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    if base.month != today.month:
        pg.get_by_role('button', name='Mois précédent').filter(visible=True).first.click(); pg.wait_for_timeout(700)
    d16, d20, d18 = base.replace(day=16), base.replace(day=20), base.replace(day=18)
    pg.locator(f'[aria-label^="{daylabel(d16)}"]').first.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-start').click(); pg.wait_for_timeout(1200)
    pg.locator(f'[aria-label^="{daylabel(d20)}"]').first.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-end').click(); pg.wait_for_timeout(1200)
    R['regles_16_au_20'] = demo(pg, f"s => s.tables.period_entries.map(p => [p.start_date, p.end_date])") == [[iso(d16), iso(d20)]]
    pg.locator(f'[aria-label^="{daylabel(d18)}"]').first.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-end').click(); pg.wait_for_timeout(1200)
    R['regles_modifiees_fin_le_18'] = demo(pg, f"s => s.tables.period_entries.map(p => [p.start_date, p.end_date])") == [[iso(d16), iso(d18)]]
    t = T(pg)
    R['calendrier_estimations'] = tid(pg, 'cal-estimates').is_visible() and 'Aucun jour n’est sans risque' in t
    # Changement d'objectif sans perte d'historique
    tid(pg, 'objective-change').click(); pg.wait_for_timeout(700)
    tid(pg, 'objective-ttc').click(); pg.wait_for_timeout(1800)
    R['objectif_concevoir_historique_conserve'] = 'concevoir' in tid(pg, 'cycle-objective').inner_text().lower() and demo(pg, "s => s.tables.period_entries.length") == 1 and tid(pg, 'cal-section-ttc').is_visible()
    tid(pg, 'objective-change').click(); pg.wait_for_timeout(700)
    tid(pg, 'objective-cycle').click(); pg.wait_for_timeout(1800)
    R['objectif_suivre_historique_conserve'] = demo(pg, "s => s.tables.period_entries.length") == 1 and demo(pg, "s => s.tables.user_journeys.filter(j => j.status === 'archived' && (j.type === 'avoid' || j.type === 'ttc')).length") >= 2
    # Suppression
    pg.locator(f'[aria-label^="{daylabel(d16)}"]').first.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-delete').click(); pg.wait_for_timeout(600)
    pg.get_by_role('button', name='Supprimer', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(1200)
    R['regles_supprimees'] = demo(pg, "s => s.tables.period_entries.length") == 0

    # ================================================================ Projet bébé → Ma grossesse ; calendrier masqué pendant la grossesse
    tid(pg, 'objective-change').click(); pg.wait_for_timeout(700)
    tid(pg, 'objective-ttc').click(); pg.wait_for_timeout(1800)
    tid(pg, 'cal-positive').click(); pg.wait_for_timeout(2400)
    lmp = (today - timedelta(days=42)).strftime('%d/%m/%Y')
    tid(pg, 'start-lmp').fill(lmp); pg.wait_for_timeout(500)
    tid(pg, 'start-submit').click(); pg.wait_for_timeout(3000)
    R['test_positif_cree_ma_grossesse'] = pg.url.endswith('/pregnancy') and demo(pg, "s => s.tables.pregnancies.filter(p => p.status === 'active').length") == 1
    subject(pg, 'me')
    t = T(pg)
    R['grossesse_pas_de_prochaines_regles'] = 'Prochaines règles' not in t and 'Période fertile' not in t
    go(pg, '/cycle/calendar', 2400)
    R['calendrier_menstruel_masque'] = '/journeys/blocked' in pg.url
    go(pg, '/tools', 2600)
    mine = T(pg).split('Outils des autres profils')[0]
    R['outils_grossesse_sans_pilule_ni_regles'] = not any(x in mine for x in ['Calendrier du cycle', 'Pilule', 'Période fertile'])

    pg.screenshot(path=f'{SHOTS}/ess_end.png', full_page=True)
    b.close()


with sync_playwright() as p:
    run(p)
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = sum(1 for k, v in R.items() if k != 'erreurs' and v is True)
total = sum(1 for k in R if k != 'erreurs')
print(('OK' if ok == total and not errs else 'ÉCHEC'), ok, '/', total)
