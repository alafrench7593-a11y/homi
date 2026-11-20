"""
Outils complétés le 30/11/2026 — version web de démonstration (la RLS réelle à comptes distincts est vérifiée par
supabase/tests/sql/98zk_partiels2.sql). Parcours réels :
 27  examens datés du parcours fertilité (saisie, rappel, rendez-vous, note après l'examen, modification, suppression) ;
 129 journal du langage (mot, phrase, langue de la maison, frise, doublon refusé, modification, suppression, repères indicatifs) ;
 132 jeux selon l'âge (tranche de l'enfant, filtres, favori, « on l'a fait ») ;
 136 activités extrascolaires (créneaux, erreurs, rappels hebdomadaires, agenda familial, Ma journée, modification, suppression) ;
 137 devoirs (semaine, échéance, fait / à faire, rappel la veille, encore à faire, modification, suppression, École) ;
 175 « Se comprendre » : envie de proximité, rien d'envoyé sans confirmation ;
 177 baromètre du couple (privé par défaut, jauge privée de l'autre invisible, partagée visible, effacer) ;
 199 recommandations d'articles avec leur raison, article enregistré plus reproposé.
Captures 390×844 et 320×568, clair et sombre.
Usage : E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/partiels2.py
"""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SET_BODY, SIMPLE_OFF

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/partiels2')
os.makedirs(SHOTS, exist_ok=True)
R = {}; errs = []
import atexit
atexit.register(lambda: None if R.get('_fin') else print('PARTIEL', json.dumps(R, ensure_ascii=False)))


def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def mutate(pg, js): pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
def body(pg): return pg.inner_text('body')
def go(pg, path, wait=2500): pg.goto(B + path); pg.wait_for_timeout(wait)
def fill(pg, t, v):
    el = tid(pg, t); el.scroll_into_view_if_needed(); el.fill(v)
def click(pg, t, wait=500):
    el = tid(pg, t); el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(wait)
def confirm_delete(pg):
    pg.get_by_role('button', name='Supprimer').last.click(); pg.wait_for_timeout(1300)
def fr(d): return d.strftime('%d/%m/%Y')


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    R['demo_exemples_presents'] = demo(pg, "s => (s.tables.child_language_entries||[]).length >= 5 && (s.tables.child_activities||[]).length === 2 && (s.tables.child_homework||[]).length === 3 && (s.tables.couple_barometer||[]).length === 3")
    me = demo(pg, "s => s.session.userId")
    hid = demo(pg, f"s => s.tables.household_members.find(m => m.user_id === '{me}').household_id")
    partner = demo(pg, f"s => s.tables.household_members.find(m => m.household_id === '{hid}' && m.user_id !== '{me}').user_id")
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    now = pg.evaluate("() => { const d = new Date(); return [new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10), d.getHours(), d.getMinutes()]; }")
    today = datetime.date.fromisoformat(now[0]); hour = now[1]
    mutate(pg, "s => { for (const t of ['child_language_entries','child_game_marks','child_activities','child_homework','couple_barometer']) s.tables[t] = []; s.tables.appointments = (s.tables.appointments||[]).filter(a => a.care_track !== 'fertility'); }")

    # ================================================================ 27 Examens datés (fertilité) — parcours « projet bébé » actif
    if not os.environ.get('E2E_SKIP_EXAMS'):
        pg.evaluate(SET_BODY, ['ttc', False])
        go(pg, '/fertility/exams', 3000)
        R['examens_vide_et_guide'] = has(pg, 'ex-empty') and 'Examens' in body(pg) and 'Un spermogramme pour le partenaire' in body(pg)
        click(pg, 'ex-main-add', 900)
        click(pg, 'ex-kind-blood_test', 200); click(pg, 'ex-suggest-0', 200)
        d1 = today + datetime.timedelta(days=5)
        fill(pg, 'ex-f-date', fr(d1)); fill(pg, 'ex-f-time', '8h30'); fill(pg, 'ex-f-place', 'Laboratoire du centre'); fill(pg, 'ex-f-notes', 'À jeun')
        click(pg, 'ex-lead-day', 200); click(pg, 'ex-f-save', 1800)
        ex = demo(pg, "s => s.tables.appointments.find(a => a.care_track === 'fertility')")
        R['examen_enregistre'] = ex is not None and ex['kind'] == 'blood_test' and ex['for_parent'] is True and ex['private_to_creator'] is True and ex['location_label'] == 'Laboratoire du centre' \
            and ex['title'] == 'Un bilan hormonal par prise de sang' and ex['starts_at'][:10] in (d1.isoformat(), (d1 - datetime.timedelta(days=1)).isoformat())
        R['examen_rappel'] = demo(pg, f"s => (s.tables.reminders||[]).some(r => r.appointment_id === '{ex['id']}' && r.category === 'exam' && r.schedule.type === 'once' && r.deep_link === '/fertility/exams')")
        R['examen_liste'] = has(pg, f"ex-row-{ex['id']}") and 'privé' in tid(pg, f"ex-row-{ex['id']}").inner_text()
        click(pg, f"ex-row-{ex['id']}", 900); fill(pg, 'ex-f-place', 'Laboratoire Pasteur'); click(pg, 'ex-f-save', 1500)
        R['examen_modifie'] = demo(pg, f"s => s.tables.appointments.find(a => a.id === '{ex['id']}').location_label") == 'Laboratoire Pasteur'
        # examen passé : la note « après l'examen » apparaît
        click(pg, 'ex-add', 900); fill(pg, 'ex-f-title', 'Échographie pelvienne'); click(pg, 'ex-kind-ultrasound', 200)
        fill(pg, 'ex-f-date', fr(today - datetime.timedelta(days=10))); click(pg, 'ex-f-save', 1500)
        past = demo(pg, "s => s.tables.appointments.find(a => a.care_track === 'fertility' && a.title === 'Échographie pelvienne')")
        click(pg, f"ex-row-{past['id']}", 900)
        R['examen_passe_note_visible'] = has(pg, 'ex-f-result')
        fill(pg, 'ex-f-result', 'Compte rendu remis à la gynécologue'); click(pg, 'ex-f-save', 1500)
        R['examen_passe_note'] = demo(pg, f"s => s.tables.appointments.find(a => a.id === '{past['id']}').result_note") == 'Compte rendu remis à la gynécologue' and has(pg, 'ex-past')
        go(pg, '/appointments?all=1', 3000)
        R['examen_dans_rendez_vous'] = 'Un bilan hormonal par prise de sang' in body(pg)
        go(pg, '/fertility/exams', 3000)
        pg.screenshot(path=f'{SHOTS}/parcours-examens.png', full_page=True)
        click(pg, f"ex-row-{past['id']}", 900); click(pg, 'ex-f-delete', 700); confirm_delete(pg)
        R['examen_suppression'] = demo(pg, f"s => !s.tables.appointments.some(a => a.id === '{past['id']}')") and not has(pg, f"ex-row-{past['id']}")
    pg.evaluate(SET_BODY, ['pregnancy', False])

    # ================================================================ 129 Langage
    go(pg, f'/child/{lina}/language', 3000)
    R['langage_vide'] = has(pg, 'lg-empty')
    click(pg, 'lg-add', 900); fill(pg, 'lg-f-text', 'mama'); fill(pg, 'lg-f-date', fr(today - datetime.timedelta(days=60))); fill(pg, 'lg-f-language', 'Français'); click(pg, 'lg-f-save', 1500)
    click(pg, 'lg-add-sentence', 900); fill(pg, 'lg-f-text', 'encore gâteau'); click(pg, 'lg-f-save', 1500)
    click(pg, 'lg-add-language', 900); fill(pg, 'lg-f-text', 'Arabe'); fill(pg, 'lg-f-note', 'Avec Mamie'); click(pg, 'lg-f-save', 1500)
    rows = demo(pg, "s => s.tables.child_language_entries.map(e => ({ id: e.id, kind: e.kind, text: e.text, said_on: e.said_on, language: e.language, note: e.note, child: e.child_id }))")
    R['langage_enregistre'] = len(rows) == 3 and all(r['child'] == lina for r in rows) \
        and any(r['kind'] == 'word' and r['text'] == 'mama' and r['language'] == 'Français' for r in rows) \
        and any(r['kind'] == 'sentence' and r['said_on'] == today.isoformat() for r in rows) and any(r['kind'] == 'language' and r['note'] == 'Avec Mamie' and r['said_on'] is None for r in rows)
    m0 = (today - datetime.timedelta(days=60)).strftime('%Y-%m'); m1 = today.strftime('%Y-%m')
    R['langage_frise'] = has(pg, f'lg-month-{m0}') and has(pg, f'lg-month-{m1}') and '« encore gâteau »' in body(pg) and 'Arabe · Avec Mamie' in tid(pg, 'lg-languages').inner_text()
    click(pg, 'lg-add', 900); fill(pg, 'lg-f-text', 'MAMA'); click(pg, 'lg-f-save', 900)
    R['langage_doublon_refuse'] = 'déjà noté' in body(pg) and len(demo(pg, "s => s.tables.child_language_entries")) == 3
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    word = next(r for r in rows if r['kind'] == 'word')
    go(pg, f'/child/{lina}/language', 2500)
    click(pg, f"lg-entry-{word['id']}", 900); fill(pg, 'lg-f-text', 'maman'); click(pg, 'lg-f-save', 1500)
    R['langage_modifie'] = demo(pg, f"s => s.tables.child_language_entries.find(e => e.id === '{word['id']}').text") == 'maman'
    click(pg, 'lg-refs-toggle', 700)
    refs = tid(pg, 'lg-refs-list').inner_text()
    R['langage_reperes_indicatifs'] = 'indicatif' in refs and 'pas un diagnostic' in refs and refs.count('vers ') >= 5
    R['langage_sans_norme'] = all(w not in body(pg).lower() for w in ['retard', 'en avance', 'score', 'anormal'])
    pg.screenshot(path=f'{SHOTS}/parcours-langage.png', full_page=True)
    sentence = next(r for r in rows if r['kind'] == 'sentence')
    click(pg, f"lg-entry-{sentence['id']}", 900); click(pg, 'lg-f-delete', 700); confirm_delete(pg)
    R['langage_suppression'] = len(demo(pg, "s => s.tables.child_language_entries")) == 2 and 'encore gâteau' not in body(pg)

    # ================================================================ 132 Jeux
    go(pg, f'/child/{lina}/games', 3000)
    R['jeux_tranche_enfant'] = '8 jeux' in tid(pg, 'gm-count').inner_text() and has(pg, 'gm-card-transvaser') and not has(pg, 'gm-card-marelle') and 'Toujours avec un adulte' in body(pg)
    click(pg, 'gm-place-out', 600)
    R['jeux_filtre_exterieur'] = has(pg, 'gm-card-bulles') and not has(pg, 'gm-card-transvaser')
    click(pg, 'gm-place-out', 400); click(pg, 'gm-dur-short', 600)
    R['jeux_filtre_duree'] = has(pg, 'gm-card-tri_couleurs') and not has(pg, 'gm-card-pate_a_sel')
    click(pg, 'gm-dur-short', 400)
    click(pg, 'gm-fav-bulles', 1200)
    R['jeux_favori'] = demo(pg, f"s => s.tables.child_game_marks.some(m => m.game_key === 'bulles' && m.favorite && m.child_id === '{lina}')")
    click(pg, 'gm-fav-only', 700)
    R['jeux_favoris_seulement'] = has(pg, 'gm-card-bulles') and '1 jeu' in tid(pg, 'gm-count').inner_text()
    click(pg, 'gm-fav-only', 500)
    click(pg, 'gm-card-pate_a_sel', 900)
    R['jeux_fiche'] = 'Matériel' in body(pg) and 'ne se mange pas' in body(pg)
    click(pg, 'gm-done', 1300)
    R['jeux_fait'] = demo(pg, "s => s.tables.child_game_marks.some(m => m.game_key === 'pate_a_sel' && m.done_count === 1 && m.last_done_on)") and 'Fait une fois' in body(pg)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    click(pg, 'gm-band-6_10', 600)
    R['jeux_autre_tranche'] = has(pg, 'gm-card-marelle') is False and has(pg, 'gm-card-cuisiner')
    pg.screenshot(path=f'{SHOTS}/parcours-jeux.png', full_page=True)

    # ================================================================ 136 Activités
    go(pg, f'/child/{noe}/activities', 3000)
    R['activites_vide'] = 'Aucune activité' in body(pg)
    click(pg, 'act-add', 900)
    fill(pg, 'act-f-name', 'X'); fill(pg, 'act-slot-0-from', '15h'); fill(pg, 'act-slot-0-to', '14h'); click(pg, 'act-f-save', 800)
    R['activites_erreur_horaires'] = 'La fin doit être après le début' in body(pg) and len(demo(pg, "s => s.tables.child_activities")) == 0
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    click(pg, 'act-add', 900)
    fill(pg, 'act-f-name', 'Judo'); fill(pg, 'act-f-place', 'Dojo municipal')
    click(pg, 'act-slot-0-day-3', 200); fill(pg, 'act-slot-0-from', '14h'); fill(pg, 'act-slot-0-to', '15h')
    click(pg, 'act-add-slot', 400); click(pg, 'act-slot-1-day-6', 200); fill(pg, 'act-slot-1-from', '10:00'); fill(pg, 'act-slot-1-to', '11:00')
    fill(pg, 'act-f-equipment', 'Kimono, gourde'); fill(pg, 'act-f-contact', 'Paul'); fill(pg, 'act-f-phone', '06 12 34 56 78')
    click(pg, 'act-lead-60', 200); click(pg, 'act-f-save', 2000)
    act = demo(pg, "s => s.tables.child_activities[0]")
    R['activite_enregistree'] = act is not None and act['child_id'] == noe and act['slots'] == [{'day': 3, 'from': '14:00', 'to': '15:00'}, {'day': 6, 'from': '10:00', 'to': '11:00'}] \
        and act['reminder_minutes'] == 60 and act['contact_phone'] == '06 12 34 56 78' and act['equipment'] == 'Kimono, gourde'
    rem = demo(pg, f"s => (s.tables.reminders||[]).filter(r => r.deep_link === '/child/{noe}/activities?a={act['id']}').map(r => r.schedule)")
    R['activite_rappels_hebdo'] = sorted([(r['weekdays'][0], r['hour']) for r in rem]) == [(3, 13), (6, 9)] and all(r['type'] == 'weekly' for r in rem)
    R['activite_carte'] = 'Prochaine séance' in tid(pg, f"act-card-{act['id']}").inner_text() and 'À prévoir : Kimono, gourde' in body(pg)
    # une séance aujourd'hui, plus tard dans la soirée : elle apparaît dans la journée
    wd = today.isoweekday()
    click(pg, 'act-add', 900); fill(pg, 'act-f-name', 'Piano'); click(pg, f'act-slot-0-day-{wd}', 200); fill(pg, 'act-slot-0-from', '23:00'); fill(pg, 'act-slot-0-to', '23:45'); click(pg, 'act-f-save', 1800)
    piano = demo(pg, "s => s.tables.child_activities.find(a => a.name === 'Piano')")
    go(pg, '/calendar?view=week', 3500)
    R['activite_agenda_familial'] = 'Judo · Noé' in body(pg) and 'Piano · Noé' in body(pg)
    pg.screenshot(path=f'{SHOTS}/parcours-agenda-activites.png', full_page=True)
    pg.get_by_text('Piano · Noé').first.click(); pg.wait_for_timeout(2500)
    R['activite_agenda_ouvre'] = f'/child/{noe}/activities' in pg.url and has(pg, 'act-f-name')
    go(pg, '/profile', 3500)
    R['activite_ma_journee'] = 'Piano' in body(pg)
    go(pg, f'/child/{noe}/activities', 3000)
    click(pg, f"act-card-{act['id']}", 900); fill(pg, 'act-f-place', 'Gymnase Jean-Moulin'); click(pg, 'act-lead-0', 200); click(pg, 'act-f-save', 1800)
    R['activite_modifiee'] = demo(pg, f"s => s.tables.child_activities.find(a => a.id === '{act['id']}').place") == 'Gymnase Jean-Moulin' \
        and demo(pg, f"s => !(s.tables.reminders||[]).some(r => r.deep_link === '/child/{noe}/activities?a={act['id']}')")
    click(pg, f"act-card-{piano['id']}", 900); click(pg, 'act-f-delete', 700); confirm_delete(pg)
    R['activite_suppression'] = demo(pg, "s => s.tables.child_activities.length") == 1

    # ================================================================ 137 Devoirs
    go(pg, f'/child/{noe}/homework', 3000)
    R['devoirs_semaine_vide'] = 'Rien à faire cette semaine' in body(pg)
    click(pg, 'hw-add', 900); fill(pg, 'hw-f-subject', 'Lecture'); fill(pg, 'hw-f-instructions', 'Lire la page 12'); click(pg, 'hw-f-tomorrow', 200); click(pg, 'hw-f-save', 1800)
    click(pg, 'hw-add', 900); fill(pg, 'hw-f-subject', 'Mathématiques'); fill(pg, 'hw-f-instructions', 'Fiche des additions'); fill(pg, 'hw-f-due', fr(today + datetime.timedelta(days=2))); click(pg, 'hw-f-save', 1800)
    hws = demo(pg, "s => s.tables.child_homework.map(h => ({ id: h.id, subject: h.subject, due: h.due_on, done: h.done_at }))")
    lec = next(h for h in hws if h['subject'] == 'Lecture')
    R['devoirs_enregistres'] = len(hws) == 2 and lec['due'] == (today + datetime.timedelta(days=1)).isoformat()
    rem_hw = demo(pg, f"s => (s.tables.reminders||[]).filter(r => r.deep_link === '/child/{noe}/homework?h={lec['id']}').map(r => r.schedule.at)")
    R['devoirs_rappel_veille'] = (len(rem_hw) == 1 and '18:00' in pg.evaluate("(a) => { const d = new Date(a); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }", rem_hw[0])) if hour < 18 else len(rem_hw) == 0
    R['devoirs_semaine'] = has(pg, f"hw-row-{lec['id']}") or 'Lire la page 12' in body(pg)
    click(pg, f"hw-check-{lec['id']}", 1300)
    R['devoirs_fait'] = demo(pg, f"s => {{ const h = s.tables.child_homework.find(x => x.id === '{lec['id']}'); return !!h.done_at; }}") \
        and demo(pg, f"s => !(s.tables.reminders||[]).some(r => r.deep_link === '/child/{noe}/homework?h={lec['id']}')")
    click(pg, f"hw-check-{lec['id']}", 1300)
    R['devoirs_decoche'] = demo(pg, f"s => s.tables.child_homework.find(x => x.id === '{lec['id']}').done_at") is None
    mutate(pg, f"s => s.tables.child_homework.push({{ id: 'hw-late-1', household_id: '{hid}', child_id: '{noe}', subject: 'Anglais', instructions: 'Apprendre les couleurs', due_on: '{(today - datetime.timedelta(days=9)).isoformat()}', done_at: null, done_by: null, remind_eve: false, created_by: '{me}', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }})")
    go(pg, f'/child/{noe}/homework', 3000)
    R['devoirs_encore_a_faire'] = has(pg, 'hw-late') and 'Apprendre les couleurs' in tid(pg, 'hw-late').inner_text()
    week0 = tid(pg, 'hw-week').inner_text()
    click(pg, 'hw-next', 700)
    R['devoirs_semaine_suivante'] = tid(pg, 'hw-week').inner_text() != week0
    click(pg, 'hw-prev', 700)
    pg.screenshot(path=f'{SHOTS}/parcours-devoirs.png', full_page=True)
    maths = next(h for h in hws if h['subject'] == 'Mathématiques')
    click(pg, f"hw-row-{maths['id']}", 900); fill(pg, 'hw-f-instructions', 'Fiche des additions, exercices 1 à 3'); click(pg, 'hw-f-save', 1500)
    R['devoirs_modifie'] = demo(pg, f"s => s.tables.child_homework.find(x => x.id === '{maths['id']}').instructions") == 'Fiche des additions, exercices 1 à 3'
    click(pg, f"hw-row-{maths['id']}", 900); click(pg, 'hw-f-delete', 700); confirm_delete(pg)
    R['devoirs_suppression'] = demo(pg, f"s => !s.tables.child_homework.some(x => x.id === '{maths['id']}')")
    go(pg, f'/child/{noe}/school', 3000)
    R['ecole_liens'] = 'devoirs à faire' in tid(pg, 'school-homework').inner_text() and 'Judo' in tid(pg, 'school-activities').inner_text()
    click(pg, 'school-homework', 2200)
    R['ecole_ouvre_devoirs'] = f'/child/{noe}/homework' in pg.url

    # ================================================================ 177 Baromètre du couple
    go(pg, '/family/couple', 3500)
    R['barometre_present'] = has(pg, 'bm-card') and 'Facultatif' in body(pg)
    click(pg, 'bm-level-4', 300); fill(pg, 'bm-word', 'On a ri dimanche'); click(pg, 'bm-save', 1500)
    mine = demo(pg, f"s => s.tables.couple_barometer.find(r => r.user_id === '{me}')")
    R['barometre_prive_par_defaut'] = mine is not None and mine['level'] == 4 and mine['shared'] is False and 'gardée pour toi' in tid(pg, 'bm-status').inner_text()
    wk = mine['week_of']
    mutate(pg, f"s => s.tables.couple_barometer.push({{ id: 'bm-p', household_id: '{hid}', user_id: '{partner}', week_of: '{wk}', level: 2, word: 'Semaine chargée', shared: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }})")
    go(pg, '/family/couple', 3500)
    R['barometre_jauge_privee_autre_invisible'] = not has(pg, 'bm-partner') and 'Semaine chargée' not in body(pg)
    mutate(pg, "s => { s.tables.couple_barometer.find(r => r.id === 'bm-p').shared = true; }")
    go(pg, '/family/couple', 3500)
    R['barometre_partage_visible'] = has(pg, 'bm-partner') and 'Pluvieux' in tid(pg, 'bm-partner').inner_text() and 'Semaine chargée' in body(pg)
    R['barometre_sans_comparaison'] = all(w not in body(pg).lower() for w in ['moyenne', 'score', 'écart', '%'])
    sw = pg.get_by_role('switch', name='Partager avec').first
    if sw.count(): sw.scroll_into_view_if_needed(); sw.click(); pg.wait_for_timeout(300)
    click(pg, 'bm-save', 1500)
    R['barometre_partage_choisi'] = demo(pg, f"s => s.tables.couple_barometer.find(r => r.user_id === '{me}').shared") is True
    pg.screenshot(path=f'{SHOTS}/parcours-barometre.png', full_page=True)
    click(pg, 'bm-clear', 1300)
    R['barometre_efface'] = demo(pg, f"s => !s.tables.couple_barometer.some(r => r.user_id === '{me}')")

    # ================================================================ 175 Intimité sans pression
    go(pg, '/family/understand', 3000)
    R['intimite_situation_envie'] = has(pg, 'und-sit-desire') and 'sans pression' in tid(pg, 'und-sit-desire').inner_text()
    n0 = demo(pg, "s => (s.tables.couple_messages||[]).length")
    click(pg, 'und-sit-desire', 2500)
    R['intimite_formulation'] = 'pas une demande' in tid(pg, 'und-text').input_value()
    click(pg, 'und-variant-short', 500)
    R['intimite_variantes'] = 'sans aucune pression' in tid(pg, 'und-text').input_value()
    click(pg, 'und-send', 1200)
    R['intimite_rien_sans_confirmation'] = has(pg, 'und-confirm') and demo(pg, "s => (s.tables.couple_messages||[]).length") == n0
    pg.screenshot(path=f'{SHOTS}/parcours-intimite-confirmation.png')
    click(pg, 'und-confirm-go', 2500)
    R['intimite_envoye_apres_confirmation'] = demo(pg, "s => (s.tables.couple_messages||[]).some(m => m.situation === 'desire')") and not has(pg, 'und-rest')

    # ================================================================ 199 Recommandations d'articles
    go(pg, '/library', 4500)
    recs = pg.locator('[data-testid^="library-rec-"]').filter(visible=True)
    R['recos_presentes'] = has(pg, 'library-for-you') and recs.count() >= 3 and 'Parce que' in tid(pg, 'library-for-you').inner_text()
    first_slug = recs.first.get_attribute('data-testid').replace('library-rec-', '') if recs.count() else ''
    if first_slug:
        go(pg, f'/article/{first_slug}', 3500)
        pg.get_by_role('button', name='Ajouter aux favoris').first.click(); pg.wait_for_timeout(1500)
        go(pg, '/library', 4500)
    R['recos_sans_article_enregistre'] = bool(first_slug) and not has(pg, f'library-rec-{first_slug}') and has(pg, 'library-for-you')
    R['erreurs_page'] = errs[:]

    # ================================================================ Captures : nouvelle démonstration (exemples)
    ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    screens = [('examens', '/fertility/exams'), ('langage', f'/child/{lina}/language'), ('jeux', f'/child/{lina}/games'), ('activites', f'/child/{noe}/activities'),
               ('devoirs', f'/child/{noe}/homework'), ('ecole', f'/child/{noe}/school'), ('grandir', f'/child/{lina}/grow'), ('couple', '/family/couple'),
               ('se-comprendre', '/family/understand'), ('envie', '/family/understand/compose?situation=desire'), ('bibliotheque', '/library'), ('agenda', '/calendar?view=week')]
    overflow = []
    for (w, h) in [(390, 844), (320, 568)]:
        for scheme in ['light', 'dark']:
            pg.set_viewport_size({'width': w, 'height': h}); pg.emulate_media(color_scheme=scheme)
            for name, path in screens:
                pg.evaluate(SET_BODY, ['ttc' if path.startswith('/fertility') else 'pregnancy', False])
                go(pg, path, 2800)
                sw = pg.evaluate("() => document.documentElement.scrollWidth")
                if sw > w + 1: overflow.append(f'{name} {w} {scheme} {sw}')
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}.png')
                for k in range(1, 4):
                    moved = pg.evaluate("""(h) => { const el = [...document.querySelectorAll('[data-testid="screen-scroll"]')].find(e => e.offsetParent !== null);
                      if (!el) return false; const before = el.scrollTop; el.scrollTop = before + h * 0.75; return el.scrollTop > before; }""", h)
                    if not moved: break
                    pg.wait_for_timeout(400); pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}-{k}.png')
    # feuilles de saisie (390, clair et sombre)
    for scheme in ['light', 'dark']:
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.emulate_media(color_scheme=scheme)
        go(pg, f'/child/{noe}/activities', 2800); click(pg, 'act-add', 900); pg.screenshot(path=f'{SHOTS}/feuille-activite-390-{scheme}.png')
        go(pg, f'/child/{noe}/homework', 2800); click(pg, 'hw-add', 900); pg.screenshot(path=f'{SHOTS}/feuille-devoir-390-{scheme}.png')
        pg.evaluate(SET_BODY, ['ttc', False]); go(pg, '/fertility/exams', 2800); click(pg, 'ex-main-add', 900); pg.evaluate(SET_BODY, ['pregnancy', False]); pg.screenshot(path=f'{SHOTS}/feuille-examen-390-{scheme}.png')
        go(pg, f'/child/{lina}/games', 2800); click(pg, 'gm-card-transvaser', 900); pg.screenshot(path=f'{SHOTS}/feuille-jeu-390-{scheme}.png')
    R['sans_debordement_horizontal'] = not overflow
    if overflow: R['debordements'] = overflow
    R['erreurs_page'] = errs[:]
    b.close()

R['_fin'] = True
print(json.dumps({k: v for k, v in R.items() if k != '_fin'}, ensure_ascii=False, indent=1))
ok = all(v is True for k, v in R.items() if k not in ('erreurs_page', 'debordements', '_fin')) and not R.get('erreurs_page')
sys.exit(0 if ok else 1)
