"""
Parcours de bout en bout (version web de démonstration, sans compte) : les 14 scénarios demandés, dans l'interface.
Démo de départ : Camille, grossesse de jumeaux en cours, Lina (bébé, ~13 mois) et Noé (enfant, ~6 ans).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/parcours.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
SA = re.compile(r'\b\d{1,2}\s*SA\b')


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def label(pg, name):
    return pg.locator(f'[aria-label="{name}"]').filter(visible=True).first


def go(pg, path, wait=2200):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(900)


def tools_text(pg):
    go(pg, '/tools', 2600)
    pg.mouse.wheel(0, 6000); pg.wait_for_timeout(400)
    return T(pg)


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    me = demo(pg, "s => s.tables.profiles[0].id")
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")

    # ---- Profil : bouton visible « Modifier mon parcours »
    go(pg, '/profile')
    R['profil_bouton_modifier_parcours'] = tid(pg, 'edit-journey').is_visible()

    # ---- 7. Enceinte avec des enfants : sélecteur clair (ma grossesse, bébé Lina, enfant Noé, famille, moi)
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(800)
    t = T(pg)
    R['7_selecteur_grossesse_et_enfants'] = all(x in t for x in ['Ma grossesse', 'Bébé Lina', 'Enfant Noé', 'Toute la famille', 'Moi'])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    go(pg, '/')
    subject(pg, 'preg')
    R['7_grossesse_affichee_avec_SA'] = bool(SA.search(T(pg)))

    # ---- 9. Grossesse : ni biberons, ni couches, ni tétées, ni minuteur, ni diversification (outils + actions rapides)
    home = T(pg)
    t = tools_text(pg)
    banned = ['Biberons', 'Minuteur de biberon', 'Couches', 'Diversification', 'Allaitement']
    R['9_outils_grossesse_sans_biberons'] = not any(x in t for x in banned) and 'Évolution du bébé' in t and 'Préparation à l’accouchement' in t
    R['9_accueil_grossesse_sans_biberons'] = not any(x in home for x in ['Biberon', 'Couche', 'Tétée'])
    pg.screenshot(path=f'{SHOTS}/parcours-outils-grossesse.png', full_page=True)

    # ---- 10. Profil bébé : minuteur de biberon présent
    go(pg, '/'); subject(pg, lina)
    t = tools_text(pg)
    R['10_minuteur_biberon_bebe'] = 'Minuteur de biberon' in t and 'Couches' in t and 'Évolution du bébé' not in t
    pg.get_by_text('Minuteur de biberon').first.click(); pg.wait_for_timeout(2000)
    R['10_minuteur_ouvre_profil_lina'] = f'/bottle/{lina}' in pg.url
    # Prénom affiché avant d'enregistrer un biberon
    go(pg, f'/track/bottle?child={lina}')
    R['6bis_prenom_avant_enregistrement'] = 'Lina' in tid(pg, 'track-for').inner_text() and 'Enregistrer pour Lina' in T(pg)

    # ---- 8. Changer d'enfant : Noé (enfant) → outils différents
    go(pg, '/'); subject(pg, noe)
    t = tools_text(pg)
    R['8_changement_enfant_outils'] = 'Neurodéveloppement et besoins particuliers' in t and 'Minuteur de biberon' not in t and 'École ou mode de garde' in t
    go(pg, '/')
    R['8_actions_rapides_enfant'] = 'Traitement' in T(pg) and 'Biberon' not in T(pg)

    # ---- 11. Neurodéveloppement dans la fiche enfant + traitement recopié + rappel Pris
    go(pg, f'/child/{noe}?tab=besoins')
    R['11_onglet_besoins_fiche_enfant'] = tid(pg, 'needs-summary').is_visible()
    go(pg, f'/child/{noe}/needs?tab=treatments')
    tid(pg, 'treatment-add').click(); pg.wait_for_timeout(700)
    tid(pg, 't-name').fill('Traitement prescrit'); tid(pg, 't-dose').fill('1 comprimé (ordonnance)')
    tid(pg, 't-times').fill('00:01'); tid(pg, 't-save').click(); pg.wait_for_timeout(1500)
    tr_rows = demo(pg, "s => s.tables.child_treatments.map(t => [t.dose_text, t.times])")
    rem = demo(pg, "s => s.tables.reminders.filter(r => r.treatment_id).map(r => [r.title, r.body])")
    R['11_traitement_dose_recopiee'] = tr_rows == [['1 comprimé (ordonnance)', ['00:01']]]
    R['11_rappel_traitement_texte_saisi'] = rem == [['Noé · Traitement prescrit', '1 comprimé (ordonnance)']]
    tid(pg, 'dose-taken-00:01').click(); pg.wait_for_timeout(1200)
    R['11_prise_notee_pris'] = 'Pris' in tid(pg, 'dose-status-00:01').inner_text()
    pg.screenshot(path=f'{SHOTS}/parcours-traitement.png', full_page=True)

    # ---- 5. Fin de grossesse : jumeaux nés, un profil chacun, plus de SA ni de rappel de grossesse
    mutate(pg, f"""s => {{ s.tables.reminders = [...(s.tables.reminders || []), {{ id: 'rem-preg', user_id: '{me}', household_id: null, child_id: null, pregnancy_id: null, appointment_id: null, category: 'tracking', title: 'Mon poids (grossesse)', body: null, schedule: {{ type: 'weekly', weekdays: [1], hour: 8, minute: 0 }}, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: '/pregnancy/weight', journey_type: 'pregnancy', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }}]; }}""")
    go(pg, '/pregnancy/end')
    tid(pg, 'outcome-born').click(); pg.wait_for_timeout(800)
    # Offre gratuite (3 enfants) : 2 enfants + jumeaux → annoncé AVANT l'enregistrement, la grossesse n'est pas touchée
    R['5_limite_offre_annoncee'] = tid(pg, 'birth-limit').is_visible()
    mutate(pg, f"s => {{ s.tables.subscriptions = [{{ id: 'sub-e2e', user_id: '{me}', status: 'active', plan: 'premium', expires_at: null, created_at: new Date().toISOString() }}]; }}")
    go(pg, '/pregnancy/end')
    tid(pg, 'outcome-born').click(); pg.wait_for_timeout(600)
    tid(pg, 'birth-name-0').fill('Jade'); tid(pg, 'birth-weight-0').fill('2650'); tid(pg, 'birth-time-0').fill('08:42'); tid(pg, 'birth-term-0').fill('37')
    tid(pg, 'birth-name-1').fill('Elio'); tid(pg, 'birth-weight-1').fill('2810')
    tid(pg, 'end-submit').click(); pg.wait_for_timeout(3000)
    kids = demo(pg, "s => s.tables.children.filter(c => c.from_pregnancy_id).map(c => [c.first_name, c.birth_weight_g, c.birth_time])")
    R['5_un_profil_par_jumeau'] = sorted(kids) == [['Elio', 2810, None], ['Jade', 2650, '08:42']]
    R['5_fiche_bebe_ouverte'] = '/child/' in pg.url and '2650 g' in T(pg)
    act = demo(pg, f"s => s.tables.user_journeys.filter(j => j.user_id === '{me}' && j.status === 'active').map(j => j.type).sort()")
    R['5_post_partum_et_bebes_actifs'] = act == ['baby', 'baby', 'baby', 'child', 'postpartum']
    R['5_rappel_grossesse_arrete'] = demo(pg, "s => s.tables.reminders.find(r => r.id === 'rem-preg').enabled") is False
    go(pg, '/', 2600)
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(800)
    t = T(pg)
    R['5_plus_de_grossesse_ni_SA'] = 'Ma grossesse' not in t and not SA.search(t) and 'Mon post-partum' in t
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    go(pg, '/pregnancy')
    R['5_ecran_grossesse_ferme'] = '/journeys/blocked' in pg.url

    # ---- 6. Retour volontaire vers Projet bébé (confirmation, archivage par défaut)
    go(pg, '/journeys')
    tid(pg, 'choose-ttc').click(); pg.wait_for_timeout(800)
    R['6_confirmation_demandee'] = tid(pg, 'change-confirm').is_visible()
    tid(pg, 'change-confirm').click(); pg.wait_for_timeout(2500)
    go(pg, '/'); subject(pg, 'me')
    t = T(pg)
    R['6_accueil_projet_bebe'] = 'Parcours : Projet bébé' in t

    # ---- 1. Projet bébé : aucune SA, même avec une ancienne grossesse restée « active » sans parcours
    mutate(pg, "s => { const p = s.tables.pregnancies[0]; s.tables.pregnancies.push({ ...p, id: 'old-preg', status: 'active' }); }")
    go(pg, '/', 2600)
    t = T(pg)
    R['1_projet_bebe_sans_SA'] = not SA.search(t) and 'Parcours : Projet bébé' in t
    t = tools_text(pg)
    R['1_outils_projet_bebe'] = all(x in t for x in ['Tests d’ovulation et de grossesse', 'Glaire cervicale', 'Température (facultatif)', 'J’ai un test positif']) and 'Évolution du bébé' not in t and 'Biberons' not in t
    mutate(pg, "s => { s.tables.pregnancies = s.tables.pregnancies.filter(p => p.id !== 'old-preg'); }")

    # ---- 2 et 3. Projet bébé → grossesse (un bébé), terme calculé avec les dates saisies ; rappel du projet bébé arrêté
    mutate(pg, f"""s => {{
      const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
      const ttc = s.tables.user_journeys.find(j => j.user_id === '{me}' && j.type === 'ttc' && j.status === 'active'); ttc.started_on = d(60);
      s.tables.period_entries = [{{ id: 'per-1', user_id: '{me}', start_date: d(30), end_date: d(26), flow: 'medium', created_at: new Date().toISOString() }}];
      s.tables.reminders.push({{ id: 'rem-ttc', user_id: '{me}', household_id: null, child_id: null, pregnancy_id: null, appointment_id: null, category: 'tracking', title: 'Test d’ovulation', body: null, schedule: {{ type: 'daily', hour: 8, minute: 0 }}, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: '/fertility/log', journey_type: 'ttc', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }});
    }}""")
    go(pg, '/journeys')
    tid(pg, 'start-pregnancy').click(); pg.wait_for_timeout(2000)
    lmp = demo(pg, "s => { const d = new Date(Date.now() - 35 * 86400000); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }")
    tid(pg, 'start-lmp').fill(lmp); pg.wait_for_timeout(500)
    R['3_terme_calcule_non_estime'] = 'TERME CALCULÉ' in T(pg) and 'Terme estimé' not in tid(pg, 'start-due-result').inner_text()
    tid(pg, 'start-nick-0').fill('Petit pois')
    tid(pg, 'start-submit').click(); pg.wait_for_timeout(3000)
    preg = demo(pg, "s => s.tables.pregnancies.filter(p => p.status === 'active').map(p => [p.due_date_source, p.multiplicity])")
    R['2_grossesse_creee_tableau_de_bord'] = preg == [['lmp', 'single']] and pg.url.endswith('/pregnancy')
    R['3_un_bebe_attendu'] = demo(pg, "s => { const p = s.tables.pregnancies.find(x => x.status === 'active'); return s.tables.expected_babies.filter(b => b.pregnancy_id === p.id).map(b => b.nickname); }") == ['Petit pois']
    R['3_nouvelle_grossesse_5_SA'] = bool(re.search(r'\b5\s*SA', T(pg)))
    R['12_rappel_ancien_parcours_arrete'] = demo(pg, "s => s.tables.reminders.find(r => r.id === 'rem-ttc').enabled") is False
    R['12_autres_rappels_conserves'] = demo(pg, "s => s.tables.reminders.filter(r => r.treatment_id).every(r => r.enabled)") is True

    # ---- 13. Données archivées conservées et consultables
    go(pg, '/journeys')
    t = T(pg)
    R['13_parcours_precedents_listes'] = 'Mes parcours précédents' in t and t.count('Projet bébé') >= 2
    arch = demo(pg, f"s => s.tables.user_journeys.find(j => j.user_id === '{me}' && j.type === 'ttc' && j.status === 'archived' && j.end_reason === 'pregnancy').id")
    go(pg, f'/journeys/{arch}')
    t = T(pg)
    R['13_detail_donnees_conservees'] = 'DONNÉES CONSERVÉES' in t and '1 début de règles noté' in t
    pg.screenshot(path=f'{SHOTS}/parcours-precedent.png', full_page=True)

    # ---- 4. Nouvelle grossesse de jumeaux (date du test seule → terme estimé)
    go(pg, '/journeys'); tid(pg, 'choose-ttc').click(); pg.wait_for_timeout(800)
    R['6_note_grossesse_fermee'] = 'marquée comme terminée' in T(pg)
    tid(pg, 'change-confirm').click(); pg.wait_for_timeout(2500)
    R['6_grossesse_fermee_sans_precision'] = demo(pg, "s => s.tables.pregnancies.filter(p => p.end_reason === 'unspecified').length") == 1
    go(pg, '/pregnancy/start')
    test = demo(pg, "s => { const d = new Date(Date.now() - 3 * 86400000); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }")
    tid(pg, 'start-test').fill(test)
    label(pg, 'Jumeaux').click() if label(pg, 'Jumeaux').count() else pg.get_by_text('Jumeaux', exact=True).first.click()
    pg.wait_for_timeout(500)
    tid(pg, 'start-nick-0').fill('Soleil'); tid(pg, 'start-nick-1').fill('Lune')
    R['4_terme_estime_signale'] = tid(pg, 'start-estimated').is_visible()
    tid(pg, 'start-submit').click(); pg.wait_for_timeout(3000)
    R['4_deux_bebes_attendus'] = demo(pg, "s => { const p = s.tables.pregnancies.find(x => x.status === 'active'); return [p.multiplicity, s.tables.expected_babies.filter(b => b.pregnancy_id === p.id).map(b => b.nickname).sort()]; }") == ['twins', ['Lune', 'Soleil']]
    R['4_aucune_donnee_ancienne_grossesse'] = demo(pg, "s => { const p = s.tables.pregnancies.find(x => x.status === 'active'); return s.tables.maternal_weights.filter(w => w.pregnancy_id === p.id).length; }") == 0
    go(pg, '/', 2600)
    R['4_terme_estime_accueil'] = 'Terme estimé' in T(pg)

    # ---- 14. Suppression définitive demandée
    go(pg, f'/journeys/{arch}')
    tid(pg, 'delete-journey').click(); pg.wait_for_timeout(800)
    pg.get_by_role('button', name='Supprimer', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(2500)
    R['14_parcours_supprime'] = demo(pg, f"s => s.tables.user_journeys.some(j => j.id === '{arch}')") is False
    R['14_donnees_de_sa_periode_supprimees'] = demo(pg, "s => s.tables.period_entries.length") == 0
    R['14_autres_parcours_intacts'] = demo(pg, f"s => s.tables.user_journeys.filter(j => j.user_id === '{me}' && j.status === 'active').map(j => j.type).sort()") == ['baby', 'baby', 'baby', 'child', 'postpartum', 'pregnancy']

    # ---- Garde : un écran d'un parcours inactif ne s'ouvre pas
    go(pg, '/fertility')
    R['garde_ecran_parcours_inactif'] = '/journeys/blocked' in pg.url
    b.close()


if __name__ == '__main__':
  with sync_playwright() as p:
    run(p)
  print(json.dumps({'resultats': R, 'tous_ok': all(R.values()), 'erreurs': errs}, ensure_ascii=False, indent=1))
