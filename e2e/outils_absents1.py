"""
Outils absents (27/11/2026) — version web de démonstration, vrais gestes, deux personnes du foyer (Camille, Sam).
Règles de la démo = 20261127000100 / 20261127000200 (la RLS réelle à comptes distincts est vérifiée par
supabase/tests/sql/98zf et 98zg).
 172 mode embrouille · 179 moments à deux · 39 contractions · 44 projet de naissance · 48 préparation du coparent ·
 58 rééducation · 60 cicatrisation · 73/74 stock de lait · 76/77 difficultés d'allaitement · 79 laits infantiles
Captures 390×844 et 320×568, clair et sombre.
Usage : E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/outils_absents1.py
"""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF, SET_BODY

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/absents1')
os.makedirs(SHOTS, exist_ok=True)
SAM = '5a4d0000-0000-4000-8000-00000000d3a0'
R = {}; errs = []


def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def mutate(pg, js): pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
def body(pg): return pg.inner_text('body')
def go(pg, path, wait=2600): pg.goto(B + path); pg.wait_for_timeout(wait)
def fill(pg, t, v):
    el = tid(pg, t); el.scroll_into_view_if_needed(); el.fill(v)
def click(pg, t, wait=600):
    el = tid(pg, t); el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(wait)
def switch(pg, uid):
    mutate(pg, f"s => {{ s.session = {{ ...s.session, userId: '{uid}', email: null }}; }}"); pg.reload(); pg.wait_for_timeout(2500)
def fr(d): return d.strftime('%d/%m/%Y')
def confirm_ok(pg, label, wait=1300):
    # fenêtre de confirmation de l'application (web) : le dernier bouton visible portant ce libellé
    pg.get_by_role('button', name=label, exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(wait)
def toggle(pg, t, wait=900):
    el = pg.locator(f'[data-testid="{t}"] [role="switch"]').filter(visible=True).first
    el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(wait)


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('dialog', lambda d: d.accept())
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.evaluate(SET_BODY, ['pregnancy', True]); pg.reload(); pg.wait_for_timeout(3000)
    ME = demo(pg, "s => s.session.userId")
    LINA = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    today = datetime.date.fromisoformat(pg.evaluate("() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }"))
    tomorrow = today + datetime.timedelta(days=1)
    R['demo_exemples'] = demo(pg, "s => (s.tables.formula_changes||[]).length === 2 && (s.tables.milk_stock||[]).length === 3")

    # ============================================================ 172 Mode embrouille
    go(pg, '/family/couple')
    R['couple_entree_mode'] = has(pg, 'cp-calm-open') and has(pg, 'cp-understand') and has(pg, 'cp-moments-open')
    click(pg, 'cp-calm-open', 2500)
    R['calm_ecran'] = '/family/calm' in pg.url and 'Mode embrouille' in body(pg)
    toggle(pg, 'calm-toggle')
    R['calm_active_personnel'] = demo(pg, f"s => (s.tables.calm_modes||[]).some(m => m.user_id === '{ME}' && m.active)") and 'Activé pour vous' in tid(pg, 'calm-status').inner_text()
    R['calm_personne_prevenue'] = demo(pg, f"s => !(s.tables.notifications||[]).some(n => n.user_id === '{SAM}' && /embrouille/i.test(n.title))")
    go(pg, '/family/couple')
    R['couple_reduit'] = has(pg, 'cp-calm-hidden') and not has(pg, 'cp-understand') and not has(pg, 'cp-heavy') and not has(pg, 'cp-moments-open')
    go(pg, '/family/calm')
    click(pg, 'calm-new', 900)
    click(pg, 'calm-tpl-pickup', 500)
    click(pg, 'calm-when-tomorrow', 300); fill(pg, 'calm-when-time', '16:30')
    if has(pg, 'calm-child-Lina'): click(pg, 'calm-child-Lina', 300)
    R['calm_apercu'] = 'Récupérer Lina' in tid(pg, 'calm-preview').inner_text()
    R['calm_aucun_champ_libre'] = pg.locator('textarea').filter(visible=True).count() == 0 and not has(pg, 'calm-message')
    click(pg, 'calm-send', 1500)
    req = demo(pg, "s => { const r = (s.tables.calm_requests||[])[0]; const t = r && s.tables.family_tasks.find(x => x.id === r.task_id); return r && t && { tpl: r.template_key, to: r.to_user, notes: t.notes, state: t.mission_state, title: t.title, due: t.due_at }; }")
    R['calm_demande_mission'] = bool(req) and req['tpl'] == 'pickup' and req['to'] == SAM and req['notes'] is None and req['state'] == 'pending' and req['title'].startswith('Récupérer Lina')
    click(pg, 'calm-time-pickup', 900); fill(pg, 'calm-edit-when-time', '17:15'); click(pg, 'calm-edit-save', 1200)
    due2 = demo(pg, "s => s.tables.family_tasks.find(x => x.id === s.tables.calm_requests[0].task_id).due_at")
    R['calm_heure_modifiee'] = due2 != req['due'] and pg.evaluate(f"() => new Date('{due2}').getHours()") == 17
    pg.screenshot(path=f'{SHOTS}/parcours-calm-envoye.png', full_page=True)
    switch(pg, SAM)
    go(pg, '/family/calm')
    R['calm_recue_par_sam'] = has(pg, 'calm-in-pickup') and has(pg, 'calm-reply-accept-pickup') and has(pg, 'calm-reply-decline-pickup')
    click(pg, 'calm-reply-accept-pickup', 1300)
    R['calm_ok_je_men_occupe'] = demo(pg, "s => s.tables.family_tasks.find(x => x.id === s.tables.calm_requests[0].task_id).mission_state") == 'accepted'
    click(pg, 'calm-reply-complete-pickup', 1300)
    R['calm_fait'] = demo(pg, "s => s.tables.family_tasks.find(x => x.id === s.tables.calm_requests[0].task_id).mission_state") == 'done' and has(pg, 'calm-history')
    click(pg, 'calm-new', 900); click(pg, 'calm-tpl-medicine', 400); click(pg, 'calm-when-tomorrow', 300); fill(pg, 'calm-when-time', '20:00')
    if has(pg, 'calm-child-Noé'): click(pg, 'calm-child-Noé', 300)
    click(pg, 'calm-send', 1500)
    switch(pg, ME)
    go(pg, '/family/calm')
    click(pg, 'calm-reply-decline-medicine', 1300)
    R['calm_je_ne_peux_pas'] = demo(pg, "s => { const r = s.tables.calm_requests.find(x => x.template_key === 'medicine'); return s.tables.family_tasks.find(x => x.id === r.task_id).mission_state; }") == 'declined'
    R['calm_aucun_compteur'] = not any(w in body(pg) for w in ['%', 'statistique :', 'refus :'])
    toggle(pg, 'calm-toggle')
    R['calm_desactive_main'] = demo(pg, f"s => s.tables.calm_modes.some(m => m.user_id === '{ME}' && !m.active)")
    go(pg, '/family/couple')
    R['couple_retabli'] = has(pg, 'cp-understand') and has(pg, 'cp-moments-open')

    # ============================================================ 179 Moments à deux
    go(pg, '/family/moments')
    click(pg, 'mom-propose', 900); click(pg, 'mom-idea-coffee', 400); click(pg, 'mom-propose-send', 1300)
    click(pg, 'mom-propose', 900); click(pg, 'mom-idea-board_game', 400); click(pg, 'mom-propose-send', 1300)
    R['moment_propose'] = demo(pg, f"s => s.tables.couple_moments.filter(m => m.from_user === '{ME}' && m.status === 'proposed').length") == 2 and has(pg, 'mom-wait-coffee')
    R['moment_notification_neutre'] = demo(pg, f"s => s.tables.notifications.some(n => n.user_id === '{SAM}' && n.title === 'Une idée de moment à deux')")
    switch(pg, SAM)
    go(pg, '/family/moments')
    R['moment_recu'] = has(pg, 'mom-in-coffee') and 'Aucune justification demandée' in tid(pg, 'mom-in-coffee').inner_text()
    click(pg, 'mom-plan-coffee', 900)
    click(pg, 'mom-plan-tomorrow', 300); fill(pg, 'mom-plan-time', '21:00'); click(pg, 'mom-plan-save', 1300)
    R['moment_accepte_planifie'] = demo(pg, "s => { const m = s.tables.couple_moments.find(x => x.idea_key === 'coffee'); return m.status === 'accepted' && !!m.planned_at; }") and has(pg, 'mom-up-coffee')
    click(pg, 'mom-decline-board_game', 1200)
    R['moment_decline_sans_justification'] = demo(pg, "s => s.tables.couple_moments.find(x => x.idea_key === 'board_game').status") == 'declined'
    go(pg, '/calendar', 3000)
    R['moment_agenda'] = 'Un café ensemble' in body(pg)
    go(pg, '/family/moments')
    click(pg, 'mom-done-coffee', 1300)
    switch(pg, ME)
    go(pg, '/family/moments')
    R['moment_historique'] = has(pg, 'mom-past-coffee') and demo(pg, f"s => s.tables.notifications.filter(n => n.user_id === '{ME}' && n.deep_link === '/family/moments').length") == 1
    pg.screenshot(path=f'{SHOTS}/parcours-moments.png', full_page=True)

    # ============================================================ 39 Contractions
    go(pg, '/pregnancy/contractions', 3000)
    R['ctr_rappel_maternite'] = 'consignes de votre maternité ou de votre sage-femme' in body(pg) and has(pg, 'ctr-emergency')
    click(pg, 'ctr-press', 2200); click(pg, 'ctr-press', 900)
    click(pg, 'ctr-press', 1500)
    pg.reload(); pg.wait_for_timeout(3500)  # application rechargée en pleine contraction
    R['ctr_persistance_rechargement'] = 'Contraction en cours' in body(pg) and demo(pg, "s => s.tables.contractions.filter(c => !c.ended_at).length") == 1
    click(pg, 'ctr-press', 1200)
    rows = demo(pg, "s => s.tables.contractions.map(c => ({ s: c.started_at, e: c.ended_at, sid: c.session_id }))")
    R['ctr_horodatages_absolus'] = len(rows) == 2 and all(r['e'] for r in rows) and len({r['sid'] for r in rows}) == 1
    R['ctr_moyennes'] = tid(pg, 'ctr-stats').inner_text().split('\n')[1].strip() == '2' and has(pg, 'ctr-stats60')
    click(pg, 'ctr-row-0', 900); click(pg, 'ctr-edit-dur-60', 200); click(pg, 'ctr-edit-save', 1200)
    R['ctr_modifiee'] = demo(pg, "s => s.tables.contractions.some(c => Date.parse(c.ended_at) - Date.parse(c.started_at) === 60000)")
    with pg.expect_download() as dl:
        click(pg, 'ctr-export', 1500)
    R['ctr_export_pdf'] = dl.value.suggested_filename.startswith('contractions-') and dl.value.suggested_filename.endswith('.pdf')
    click(pg, 'ctr-row-1', 900); click(pg, 'ctr-edit-delete', 900); confirm_ok(pg, 'Supprimer')
    R['ctr_suppression'] = demo(pg, "s => s.tables.contractions.length") == 1

    # ============================================================ 44 Projet de naissance
    go(pg, '/pregnancy/birth-plan', 3000)
    click(pg, 'bp-opt-support-partner', 200); click(pg, 'bp-opt-ambiance-dim_light', 200); click(pg, 'bp-opt-feeding-undecided', 200)
    fill(pg, 'bp-note-support', 'Ma sœur si possible')
    click(pg, 'bp-save', 1300)
    plan = demo(pg, "s => (s.tables.birth_plans||[])[0]")
    R['bp_enregistre'] = bool(plan) and plan['answers']['support']['choices'] == ['partner'] and plan['answers']['support']['note'] == 'Ma sœur si possible'
    pg.reload(); pg.wait_for_timeout(3000)
    click(pg, 'bp-opt-feeding-undecided', 200); click(pg, 'bp-opt-feeding-breastfeeding', 200); click(pg, 'bp-save', 1300)
    R['bp_modifie'] = demo(pg, "s => s.tables.birth_plans.length === 1 && s.tables.birth_plans[0].answers.feeding.choices.join() === 'breastfeeding'")
    click(pg, 'bp-mode-preview', 800)
    R['bp_apercu'] = 'Accompagnement' in tid(pg, 'bp-preview').inner_text() and 'Allaitement' in tid(pg, 'bp-preview').inner_text()
    with pg.expect_download() as dl:
        click(pg, 'bp-export', 1500)
    R['bp_export_pdf'] = dl.value.suggested_filename.startswith('projet-de-naissance')

    # ============================================================ 48 Préparation du coparent
    go(pg, '/family/birth-partner', 3000)
    click(pg, 'bpp-create', 2000)
    lst = demo(pg, "s => s.tables.checklists.find(l => l.kind === 'coparent' && l.created_by)")
    R['bpp_liste_privee'] = bool(lst) and lst['private_to_creator'] is True and demo(pg, f"s => s.tables.checklist_items.filter(i => i.checklist_id === '{lst['id']}').length") == 22
    click(pg, 'bpp-item-0', 900); fill(pg, 'bpp-f-note', '01 23 45 67 89'); click(pg, 'bpp-f-save', 1200)
    click(pg, 'bpp-check-40', 900)
    R['bpp_note_et_coche'] = has(pg, 'bpp-note-0') and demo(pg, "s => s.tables.checklist_items.some(i => i.position === 40 && i.done)")
    switch(pg, SAM); go(pg, '/family/birth-partner', 3000)
    R['bpp_invisible_avant_partage'] = not has(pg, 'bpp-share') and has(pg, 'bpp-create')
    switch(pg, ME); go(pg, '/family/birth-partner', 3000)
    toggle(pg, 'bpp-share-toggle', 1300)
    R['bpp_partagee'] = demo(pg, f"s => s.tables.checklists.find(l => l.id === '{lst['id']}').private_to_creator") is False
    switch(pg, SAM); go(pg, '/family/birth-partner', 3000)
    R['bpp_visible_apres_partage'] = has(pg, 'bpp-note-0') and 'Partagée par' in body(pg)
    switch(pg, ME)

    # ============================================================ 58 Rééducation périnéale
    go(pg, '/postpartum/pelvic', 3000)
    click(pg, 'ppc-add', 900); click(pg, 'ppc-when-tomorrow', 200); fill(pg, 'ppc-when-time', '10:00'); fill(pg, 'ppc-who', 'Sage-femme du quartier'); click(pg, 'ppc-save', 1300)
    s1 = demo(pg, "s => (s.tables.postpartum_care_logs||[]).find(l => l.kind === 'pelvic_session')")
    R['ppc_seance_et_rappel'] = bool(s1) and s1['status'] == 'planned' and demo(pg, f"s => s.tables.reminders.some(r => r.id === '{s1['reminder_id']}' && r.deep_link === '/postpartum/pelvic' && r.schedule.type === 'once')")
    click(pg, 'ppc-add', 900); click(pg, 'ppc-when-today', 200); fill(pg, 'ppc-when-time', '00:05'); click(pg, 'ppc-save', 1300)
    R['ppc_passee_faite'] = demo(pg, "s => s.tables.postpartum_care_logs.filter(l => l.kind === 'pelvic_session' && l.status === 'done').length") == 1
    click(pg, 'ppc-row-planned', 900); click(pg, 'ppc-delete', 900); confirm_ok(pg, 'Supprimer la séance')
    R['ppc_suppression_et_rappel'] = demo(pg, f"s => !s.tables.reminders.some(r => r.id === '{s1['reminder_id']}') && s.tables.postpartum_care_logs.filter(l => l.kind === 'pelvic_session').length === 1")

    # ============================================================ 60 Cicatrisation
    go(pg, '/postpartum/healing', 3000)
    click(pg, 'heal-add', 900); click(pg, 'heal-f-better', 200); click(pg, 'heal-pain-3', 200); fill(pg, 'heal-note', 'Moins de tiraillements'); click(pg, 'heal-save', 1300)
    R['heal_enregistre'] = demo(pg, "s => s.tables.postpartum_care_logs.some(l => l.kind === 'healing' && l.pain === 3 && l.feeling === 'better')") and has(pg, 'heal-row-3')
    click(pg, 'heal-row-3', 900); click(pg, 'heal-pain-2', 200); click(pg, 'heal-save', 1300)
    R['heal_modifie'] = has(pg, 'heal-row-2')
    R['heal_prive_et_consulter'] = 'Visible par vous seule' in body(pg) and 'Consultez votre sage-femme' in body(pg)

    # ============================================================ 73/74 Stock de lait (relié au tire-lait)
    go(pg, f'/track/pumping?child={LINA}', 3000)
    R['tirelait_lien_stock'] = has(pg, 'track-milk-stock-open')
    click(pg, 'track-save', 1500)
    pump = demo(pg, f"s => s.tables.pumpings.filter(p => p.child_id === '{LINA}').sort((a, b) => b.at.localeCompare(a.at))[0]")
    go(pg, f'/feeding/milk-stock?child={LINA}', 3000)
    R['stock_seance_a_ranger'] = has(pg, f"milk-store-{pump['amount_ml']}")
    click(pg, f"milk-store-{pump['amount_ml']}", 900)
    R['stock_conservation_texte'] = 'selon les consignes de votre professionnel de santé ou de votre maternité' in tid(pg, 'milk-f-advice').inner_text()
    click(pg, 'milk-f-save', 1500)
    it = demo(pg, f"s => s.tables.milk_stock.find(m => m.pumping_id === '{pump['id']}')")
    R['stock_relie_tirelait'] = bool(it) and it['amount_ml'] == pump['amount_ml'] and round((pg.evaluate(f"() => Date.parse('{it['use_by']}') - Date.parse('{it['expressed_at']}')") / 3600000)) == 48
    R['stock_rappel'] = demo(pg, f"s => s.tables.reminders.some(r => r.deep_link === '/feeding/milk-stock?item={it['id']}')")
    oldest = demo(pg, "s => s.tables.milk_stock.filter(m => m.status === 'stored').sort((a, b) => a.expressed_at.localeCompare(b.expressed_at))[0].id")
    click(pg, 'milk-first-thaw', 1300)
    R['stock_decongele'] = demo(pg, f"s => {{ const m = s.tables.milk_stock.find(x => x.id === '{oldest}'); return m.location === 'fridge' && !!m.thawed_at; }}")
    click(pg, 'milk-first-used', 1300)
    R['stock_plus_ancien_utilise'] = demo(pg, f"s => s.tables.milk_stock.find(x => x.id === '{oldest}').status") == 'used'
    click(pg, 'milk-row-0', 900); click(pg, 'milk-act-discard', 1300)
    R['stock_historique'] = has(pg, 'milk-history') and demo(pg, "s => s.tables.milk_stock.filter(m => m.status === 'discarded').length") == 1

    # ============================================================ 76/77 Difficultés et douleurs (tétées)
    go(pg, f'/track/breastfeed?child={LINA}', 3000)
    R['tetees_lien_difficultes'] = has(pg, 'track-feed-issues-open')
    click(pg, 'track-feed-issues-open', 2500)
    click(pg, 'bfi-add', 900); click(pg, 'bfi-kind-sore_nipple', 200); click(pg, 'bfi-side-left', 200); click(pg, 'bfi-pain-6', 200)
    fill(pg, 'bfi-note', 'Douleur à la prise du sein'); click(pg, 'bfi-save', 1300)
    R['bfi_enregistree'] = demo(pg, "s => (s.tables.breastfeeding_issues||[]).some(i => i.kind === 'sore_nipple' && i.pain === 6 && i.side === 'left')") and has(pg, 'bfi-row-sore_nipple')
    R['bfi_par_jour'] = has(pg, f'bfi-day-{today.isoformat()}') and 'douleur la plus forte : 6/10' in tid(pg, f'bfi-day-{today.isoformat()}').inner_text()
    nq = demo(pg, "s => (s.tables.consultation_questions||[]).length")
    click(pg, 'bfi-q-add', 1300)
    R['bfi_questions_consultante'] = demo(pg, "s => (s.tables.consultation_questions||[]).length") == nq + 2 and demo(pg, "s => s.tables.consultation_questions.some(q => q.question.startsWith('Pouvez-vous regarder la prise'))")
    go(pg, f'/track/breastfeed?child={LINA}', 3000)
    R['tetees_affiche_difficulte'] = 'Mamelon douloureux' in tid(pg, 'track-feed-issues').inner_text()

    # ============================================================ 79 Laits infantiles
    go(pg, f'/feeding/formula?child={LINA}', 3000)
    R['lait_actuel'] = 'Lait 2e âge (marque A)' in tid(pg, 'fml-current').inner_text()
    click(pg, 'fml-add', 900); fill(pg, 'fml-f-brand', 'Lait de croissance (marque B)'); click(pg, 'fml-f-kind-growing', 200); click(pg, 'fml-f-reason-age', 200)
    fill(pg, 'fml-f-obs', 'Transition sur une semaine'); pg.wait_for_timeout(300)
    R['lait_cloture_proposee'] = 'sera noté jusqu’au' in body(pg)
    click(pg, 'fml-f-save', 1500)
    yday = (today - datetime.timedelta(days=1)).isoformat()
    R['lait_historique'] = demo(pg, f"s => s.tables.formula_changes.some(f => f.kind === 'second_age' && f.ended_on === '{yday}') && s.tables.formula_changes.some(f => f.kind === 'growing' && !f.ended_on)")
    go(pg, f'/child/{LINA}?tab=etapes', 3500)
    R['lait_frise_enfant'] = has(pg, 'frise-formula') and 'Lait de croissance (marque B)' in tid(pg, 'frise-formula').inner_text()
    R['erreurs_page'] = errs[:]

    # ============================================================ Captures
    screens = [('calm', '/family/calm'), ('moments', '/family/moments'), ('contractions', '/pregnancy/contractions'), ('projet-naissance', '/pregnancy/birth-plan'),
               ('coparent', '/family/birth-partner'), ('reeducation', '/postpartum/pelvic'), ('cicatrisation', '/postpartum/healing'),
               ('stock-lait', f'/feeding/milk-stock?child={LINA}'), ('difficultes', f'/feeding/difficulties?child={LINA}'), ('laits', f'/feeding/formula?child={LINA}'),
               ('couple', '/family/couple')]
    overflow = []
    for (w, h) in [(390, 844), (320, 568)]:
        for scheme in ['light', 'dark']:
            pg.set_viewport_size({'width': w, 'height': h}); pg.emulate_media(color_scheme=scheme)
            for name, path in screens:
                go(pg, path, 2600)
                sw = pg.evaluate("() => document.documentElement.scrollWidth")
                if sw > w + 1: overflow.append(f'{name} {w} {scheme} {sw}')
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}.png')
                for k in range(1, 4):
                    moved = pg.evaluate("""(h) => { const el = [...document.querySelectorAll('[data-testid="screen-scroll"]')].find(e => e.offsetParent !== null);
                      if (!el) return false; const before = el.scrollTop; el.scrollTop = before + h * 0.75; return el.scrollTop > before; }""", h)
                    if not moved: break
                    pg.wait_for_timeout(400); pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}-{k}.png')
    R['sans_debordement_horizontal'] = not overflow
    if overflow: R['debordements'] = overflow
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
ok = all(v is True for k, v in R.items() if k not in ('erreurs_page', 'debordements')) and not R.get('erreurs_page')
sys.exit(0 if ok else 1)
