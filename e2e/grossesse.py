"""
Grossesse et vaccins, version web de démonstration, sans compte.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/grossesse.py
Vérifie : « Mes actions du jour » (grossesse, jamais biberon ni couche), aucun contenu hors sujet sur l'accueil
grossesse (brossage des dents, échographie du 3e trimestre au début), « Comment je me sens aujourd'hui ? »,
calendrier de grossesse (périodes datées, véritable rendez-vous, rappels, terme corrigé sans déplacer un
rendez-vous confirmé, grossesse multiple), « Bien manger enceinte », vaccins de Lina et Noé séparés.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, sys
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


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def T(pg):
    return pg.inner_text('body')


def go(pg, path, wait=2800):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(1200)


def fr(d):
    return d.strftime('%d/%m/%Y')


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pid = demo(pg, "s => s.tables.pregnancies[0].id")
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    uid = demo(pg, "s => s.tables.user_journeys[0].user_id")
    # Début de grossesse (10 SA, un bébé) : terme = DDR + 287 j ; rappel de brossage de dents sans enfant
    today = date.today()
    lmp = today - timedelta(days=70)
    due = lmp + timedelta(days=287)
    mutate(pg, f"""s => {{ const p = s.tables.pregnancies.find(x => x.id === '{pid}'); p.due_date = '{due.isoformat()}'; p.lmp_date = '{lmp.isoformat()}'; p.due_date_source = 'lmp'; p.multiplicity = 'single';
      s.tables.expected_babies = s.tables.expected_babies.filter(e => !(e.pregnancy_id === '{pid}' && e.position > 1));
      s.tables.reminders.push({{ id: 'e2e-teeth', user_id: '{uid}', household_id: '{hid}', child_id: null, pregnancy_id: null, category: 'custom', title: 'Brossage des dents du soir', body: '', schedule: {{ type: 'daily', hour: 19, minute: 30 }}, enabled: true, deep_link: '/teeth', journey_type: null, created_at: new Date().toISOString() }}); }}""")
    subject(pg, 'preg')
    go(pg, '/', 3500)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/grossesse_accueil.png', full_page=True)
    R['accueil_grande_carte_grossesse_conservee'] = has(pg, 'pregnancy-hero') or '10 SA' in t
    R['accueil_mes_actions_du_jour'] = 'Mes actions du jour' in t and has(pg, 'track-card-feel') and has(pg, 'track-card-eat')
    R['accueil_jamais_biberon_couche'] = not any(has(pg, f'track-card-{k}') for k in ['bottle', 'breastfeed', 'diaper', 'pumping'])
    R['accueil_quatre_au_plus'] = len([1 for k in ['feel', 'mother_sleep', 'mood', 'eat', 'appointment', 'echo', 'weight'] if has(pg, f'track-card-{k}')]) <= 4
    R['accueil_pas_de_brossage'] = 'Brossage des dents' not in t
    R['accueil_pas_d_echo_t3_a_10_SA'] = 'Échographie du 3e trimestre' not in t and 'troisième échographie' not in t.lower()
    R['accueil_plus_de_grandes_cases'] = 'Repas' not in [x.strip() for x in t.split('\n')]

    # « Voir tout » et personnalisation
    tid(pg, 'track-see-all').click(); pg.wait_for_timeout(800)
    R['voir_tout'] = has(pg, 'track-all') and not any(has(pg, f'track-card-{k}') for k in ['bottle', 'diaper', 'period'])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)

    # ===================================== « Comment je me sens aujourd'hui ? »
    go(pg, '/pregnancy/feel', 3000)
    R['feel_pas_de_mouvements_a_10_SA'] = not has(pg, 'feel-sym-movements')
    tid(pg, 'feel-sym-nausea').click(); tid(pg, 'feel-intensity-2').click()
    # Depuis 35f7675, début, fréquence et note sont repliés derrière « feel-more »
    if not has(pg, 'feel-freq-several'): tid(pg, 'feel-more').click(); pg.wait_for_timeout(400)
    tid(pg, 'feel-freq-several').click()
    tid(pg, 'feel-note').fill('Surtout le matin')
    tid(pg, 'feel-save').click(); pg.wait_for_timeout(1500)
    t = T(pg)
    R['feel_carte_trois_parties'] = all(x in t for x in ['Fréquent à ce stade ?', 'Ce qui peut parfois aider', 'Quand demander conseil'])
    R['feel_phrase_prudente'] = 'Ce symptôme peut être fréquent à ce stade, mais d’autres causes sont possibles.' in t
    R['feel_jamais_rassurant_a_tort'] = not any(x in t.lower() for x in ["c'est normal", 'c’est normal', 'aucun danger', 'inutile de consulter', 'sans risque'])
    R['feel_enregistre_profil_grossesse'] = demo(pg, f"s => s.tables.pregnancy_symptom_logs.some(l => l.symptom === 'nausea' && l.pregnancy_id === '{pid}' && l.week_sa === 10 && l.note === 'Surtout le matin')")
    tid(pg, 'feel-another').click(); pg.wait_for_timeout(500)
    tid(pg, 'feel-sym-bleeding').click(); tid(pg, 'feel-intensity-3').click()
    tid(pg, 'feel-save').click(); pg.wait_for_timeout(1500)
    R['feel_securite_saignement_important'] = has(pg, 'feel-safety-emergency') and ('15' in T(pg) or '112' in T(pg))
    pg.screenshot(path=f'{SHOTS}/grossesse_feel.png', full_page=True)

    # ===================================== Calendrier de grossesse
    go(pg, '/pregnancy/calendar', 3200)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/grossesse_calendrier.png', full_page=True)
    R['cal_resume_SA_SG_trimestre'] = '10 SA' in t and '8 SG' in t and '1er trimestre' in t.replace('1ᵉʳ', '1er')
    R['cal_trois_periodes'] = all(has(pg, f'echo-echo_{i}') for i in (1, 2, 3))
    R['cal_formulations'] = all(x in t for x in ['Période indicative', 'À confirmer avec votre sage-femme ou votre médecin', 'Ajouter mon véritable rendez-vous'])
    e1_from = lmp + timedelta(days=77); e1_to = lmp + timedelta(days=97)
    w1 = tid(pg, 'echo-window-echo_1').inner_text()
    R['cal_dates_premiere_echo'] = str(e1_from.day) in w1 and str(e1_to.day) in w1
    # le rendez-vous du 3e trimestre de la démo est confirmé : il reste affiché, sans être déplacé
    t3_before = demo(pg, "s => (s.tables.appointments.find(a => (a.calendar_keys || []).includes('echo_3')) || {}).starts_at")
    # ajout du véritable rendez-vous de la 1re échographie, sans heure
    tid(pg, 'echo-add-echo_1').click(); pg.wait_for_timeout(800)
    tid(pg, 'care-appt-day').fill(fr(e1_from + timedelta(days=4)))
    tid(pg, 'care-appt-save').click(); pg.wait_for_timeout(1500)
    a1 = demo(pg, f"s => s.tables.appointments.find(a => a.pregnancy_id === '{pid}' && (a.calendar_keys || []).includes('echo_1'))")
    R['cal_rdv_ajoute_sans_heure_ni_lieu_inventes'] = bool(a1) and a1.get('time_set') is False and not a1.get('location_label')
    R['cal_rdv_affiche'] = has(pg, 'echo-appt-echo_1')
    # rappels : une semaine avant, la veille
    tid(pg, 'echo-appt-remind-echo_1').click(); pg.wait_for_timeout(800)
    for c in ['care-rem-week', 'care-rem-eve']:
        loc = pg.locator(f'[data-testid="{c}"]').filter(visible=True)
        if loc.count(): loc.first.click(); pg.wait_for_timeout(150)
    tid(pg, 'care-rem-save').click(); pg.wait_for_timeout(1200)
    R['cal_rappels_crees_futurs'] = demo(pg, f"s => {{ const r = s.tables.reminders.filter(r => r.pregnancy_id === '{pid}' && (r.deep_link || '').startsWith('/pregnancy/calendar')); return r.length >= 1 && r.every(x => new Date(x.schedule.at) > new Date()); }}")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    # terme corrigé de trois semaines : périodes recalculées, rendez-vous confirmés inchangés et signalés
    due2 = due - timedelta(days=21)
    mutate(pg, f"s => {{ const p = s.tables.pregnancies.find(x => x.id === '{pid}'); p.due_date = '{due2.isoformat()}'; p.lmp_date = null; p.due_date_source = 'professional'; }}")
    go(pg, '/pregnancy/calendar', 3200)
    t = T(pg)
    R['terme_corrige_recalcul'] = '13 SA' in t
    R['terme_corrige_rdv_non_deplaces'] = demo(pg, f"s => s.tables.appointments.find(a => a.id === '{a1['id']}').starts_at") == a1['starts_at'] and demo(pg, "s => (s.tables.appointments.find(a => (a.calendar_keys || []).includes('echo_3')) || {}).starts_at") == t3_before
    R['terme_corrige_rdv_signale'] = len([x for x in pg.evaluate("() => [...document.querySelectorAll('[data-testid^=\"preg-cal-moved-\"]')].map(e => e.getAttribute('data-testid'))")]) >= 1
    # date de début de grossesse (conception) saisie dans le formulaire : terme = conception + 39 semaines (41 SA)
    conception = today - timedelta(days=56)
    go(pg, '/pregnancy/edit', 2800)
    tid(pg, 'preg-date-mode-conception').click(); pg.wait_for_timeout(300)
    tid(pg, 'preg-date').fill(fr(conception))
    tid(pg, 'preg-edit-save').click(); pg.wait_for_timeout(2000)
    p = demo(pg, f"s => s.tables.pregnancies.find(x => x.id === '{pid}')")
    R['conception_terme_calcule'] = p['due_date'] == (conception + timedelta(days=273)).isoformat() and p['due_date_source'] == 'conception'
    R['conception_rdv_confirmes_inchanges'] = demo(pg, f"s => s.tables.appointments.find(a => a.id === '{a1['id']}').starts_at") == a1['starts_at']
    go(pg, '/pregnancy/calendar', 3000)
    t = T(pg)
    R['conception_resume'] = '10 SA' in t and 'date de début de grossesse' in t
    # grossesse multiple : pas de calendrier supplémentaire automatique
    mutate(pg, f"s => {{ s.tables.pregnancies.find(x => x.id === '{pid}').multiplicity = 'twins'; }}")
    go(pg, '/pregnancy/calendar', 3000)
    R['multiple_banniere_calendrier_equipe'] = has(pg, 'preg-cal-multiple') and len([1 for i in (1, 2, 3) if has(pg, f'echo-echo_{i}')]) == 3

    # ===================================== Bien manger enceinte
    go(pg, '/pregnancy/eat', 3500)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/grossesse_bien_manger.png', full_page=True)
    R['eat_titre'] = 'Bien manger enceinte' in t
    R['eat_aucun_complement'] = 'ne recommande aucun complément' in t
    R['eat_reperes'] = all(x in t for x in ['Fer', 'Calcium', 'Protéines', 'Fibres', 'B9'])
    R['eat_recettes'] = has(pg, 'eat-list')
    tid(pg, 'eat-need-nausea').click(); pg.wait_for_timeout(700)
    R['eat_filtre_nausees'] = has(pg, 'eat-list') or has(pg, 'eat-empty')
    tid(pg, 'eat-section-avoid').click(); pg.wait_for_timeout(500)
    R['eat_a_eviter_source'] = 'Alcool' in T(pg) and 'ameli' in T(pg).lower()

    # ===================================== Vaccins : Lina et Noé jamais mélangés
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{(today - timedelta(days=50)).isoformat()}'; s.tables.child_vaccinations = []; s.tables.reminders = s.tables.reminders.filter(r => !(r.deep_link || '').includes('/vaccines')); }}")
    go(pg, f'/child/{lina}/vaccines', 3000)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/vaccins_lina.png', full_page=True)
    R['vx_version_affichee'] = has(pg, 'vaccine-version') and '2026' in tid(pg, 'vaccine-version').inner_text()
    R['vx_formulations'] = 'À confirmer avec le médecin, le pédiatre, la sage-femme ou le pharmacien' in t and 'Créer un rappel' in t
    tid(pg, 'vaccine-remind-2').click(); pg.wait_for_timeout(800)
    tid(pg, 'care-rem-week').click(); pg.wait_for_timeout(150)
    tid(pg, 'care-rem-save').click(); pg.wait_for_timeout(1200)
    R['vx_rappel_lina_texte_officiel'] = demo(pg, f"s => s.tables.reminders.some(r => r.child_id === '{lina}' && r.body.startsWith('Selon le calendrier vaccinal français 2026, une vaccination est à vérifier prochainement pour Lina'))")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    go(pg, f'/child/{noe}/vaccines', 3000)
    R['vx_noe_sans_rappel_de_lina'] = 'Lina' not in T(pg) and demo(pg, f"s => !s.tables.reminders.some(r => r.child_id === '{noe}' && (r.deep_link || '').includes('/vaccines'))")
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append(f'exception: {str(e)[:300]}')
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
bad = [k for k, v in R.items() if v is not True]
print('ÉCHECS :', bad)
sys.exit(1 if bad or errs else 0)
