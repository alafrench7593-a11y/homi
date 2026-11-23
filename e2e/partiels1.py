"""
Numéros partiels complétés (29/11/2026) — version web de démonstration, vrais gestes, deux parents du foyer (Camille,
Sam). Règles de la démo = 20261129400100 (la RLS réelle à comptes distincts est vérifiée par
supabase/tests/sql/98zk_partiels_suivi_allaitement.sql).
 42 analyses · 50 souvenirs de grossesse · 51/57 rendez-vous et questions postnatales · 53 récupération physique ·
 72 lots de lait tiré · 75/83/84 journal alimentaire et export · 80 relais de biberons · 81 consultante en lactation ·
 120/123 DME et refus
Captures 390×844 et 320×568, clair et sombre.
Usage : E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/partiels1.py
"""
import datetime, json, os, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF, SET_BODY

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/partiels1')
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
def text_click(pg, txt, wait=700):
    el = pg.get_by_text(txt, exact=True).filter(visible=True).last; el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(wait)
def switch(pg, uid):
    mutate(pg, f"s => {{ s.session = {{ ...s.session, userId: '{uid}', email: null }}; }}"); pg.reload(); pg.wait_for_timeout(2500)
def confirm_ok(pg, label, wait=1300):
    pg.get_by_role('button', name=label, exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(wait)
def fr(d): return d.strftime('%d/%m/%Y')


# Une photo d'échographie factice (dégradé), fabriquée pour le test
IMG = os.path.join(tempfile.mkdtemp(), 'echo.jpg')
try:
    from PIL import Image
    im = Image.new('RGB', (320, 240))
    for x in range(320):
        for y in range(0, 240, 4):
            im.putpixel((x, y), (x % 256, (x + y) % 256, 120))
    im.save(IMG, 'JPEG')
except Exception:  # pragma: no cover
    IMG = None

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('dialog', lambda d: d.accept())
    go(pg, '/welcome')
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.evaluate(SET_BODY, ['pregnancy', True]); pg.reload(); pg.wait_for_timeout(3000)
    ME = demo(pg, "s => s.session.userId")
    LINA = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    HID = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').household_id")
    today = datetime.date.fromisoformat(pg.evaluate("() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }"))
    yday = today - datetime.timedelta(days=1)
    R['demo_exemples'] = demo(pg, "s => (s.tables.lab_results||[]).length === 4 && (s.tables.bottle_relays||[]).length === 2 && (s.tables.pregnancy_memories||[]).length === 1")

    try:
        # ============================================================ 42 Analyses médicales
        go(pg, '/documents')
        R['42_entree_documents'] = has(pg, 'docs-labs')
        click(pg, 'docs-labs', 2500)
        R['42_ecran'] = '/documents/labs' in pg.url and has(pg, 'lab-group-hemoglobine') and '11,9 g/dL' in tid(pg, 'lab-last-hemoglobine').inner_text()
        click(pg, 'lab-group-hemoglobine', 900)
        R['42_courbe_et_reference'] = has(pg, 'lab-detail-hemoglobine') and pg.locator('[data-testid="lab-detail-hemoglobine"] svg').count() > 0 and 'Référence du laboratoire : 11,5 – 16' in body(pg)
        click(pg, 'lab-add', 900)
        fill(pg, 'lab-f-name', 'TSH'); fill(pg, 'lab-f-value', '1,8'); fill(pg, 'lab-f-unit', 'mUI/L'); click(pg, 'lab-f-date-yesterday', 200); fill(pg, 'lab-f-ref', '0,4 – 4')
        click(pg, 'lab-f-save', 1500)
        R['42_valeur_saisie'] = demo(pg, f"s => s.tables.lab_results.some(l => l.name === 'TSH' && l.value === 1.8 && l.unit === 'mUI/L' && l.lab_reference === '0,4 – 4' && l.measured_on === '{yday.isoformat()}' && l.user_id === '{ME}')")
        click(pg, 'lab-group-tsh', 900); click(pg, 'lab-add-tsh', 900)
        R['42_meme_nom_propose'] = tid(pg, 'lab-f-name').input_value() == 'TSH'
        fill(pg, 'lab-f-value', '2,1'); click(pg, 'lab-f-save', 1500)
        if not has(pg, 'lab-detail-tsh'): click(pg, 'lab-group-tsh', 900)
        R['42_courbe_deux_valeurs'] = pg.locator('[data-testid="lab-detail-tsh"] svg').count() > 0
        click(pg, f'lab-row-tsh-{today.isoformat()}', 900); fill(pg, 'lab-f-value', '2,2'); click(pg, 'lab-f-save', 1500)
        R['42_modification'] = demo(pg, "s => s.tables.lab_results.some(l => l.name === 'TSH' && l.value === 2.2) && !s.tables.lab_results.some(l => l.value === 2.1)")
        if not has(pg, 'lab-detail-tsh'): click(pg, 'lab-group-tsh', 900)
        click(pg, f'lab-row-tsh-{today.isoformat()}', 900); click(pg, 'lab-f-delete', 700); confirm_ok(pg, 'Supprimer la valeur')
        R['42_suppression'] = demo(pg, "s => s.tables.lab_results.filter(l => l.name === 'TSH').length") == 1
        DOC = 'd0c00000-0000-4000-8000-0000000000aa'
        mutate(pg, f"s => {{ (s.tables.documents = s.tables.documents || []).push({{ id: '{DOC}', household_id: '{HID}', uploaded_by: '{ME}', category: 'blood_test', title: 'Bilan sanguin du 3e trimestre', storage_path: '{HID}/bilan.pdf', mime_type: 'application/pdf', size_bytes: 1000, page_count: 1, private_to_uploader: true, archived: false, created_at: new Date().toISOString() }}); }}")
        go(pg, f'/documents/{DOC}', 3000)
        R['42_depuis_document'] = has(pg, 'doc-labs')
        click(pg, 'doc-labs', 2500)
        R['42_feuille_ouverte_liee'] = has(pg, 'lab-from-doc') and has(pg, 'lab-f-name')
        fill(pg, 'lab-f-name', 'Ferritine'); fill(pg, 'lab-f-value', '30'); fill(pg, 'lab-f-unit', 'µg/L'); click(pg, 'lab-f-save', 1500)
        R['42_liee_au_document'] = demo(pg, f"s => s.tables.lab_results.some(l => l.name === 'Ferritine' && l.value === 30 && l.document_id === '{DOC}')")
        R['42_aucune_interpretation'] = has(pg, 'lab-no-advice') and not any(w in body(pg).lower() for w in [' normale', ' anormal', 'trop bas', 'trop élevé'])
        pg.screenshot(path=f'{SHOTS}/parcours-42-analyses.png', full_page=True)

        # ============================================================ 50 Souvenirs de grossesse
        go(pg, '/me/diary')
        R['50_onglet_journal'] = has(pg, 'diary-tab-pregnancy')
        tid(pg, 'diary-tab-pregnancy').click(); pg.wait_for_timeout(2000)
        R['50_ecran'] = 'tab=pregnancy' in pg.url and has(pg, 'pm-view') and 'Premiers coups de pied' in body(pg)
        click(pg, 'pm-add', 900); click(pg, 'pm-f-kind-ultrasound', 200)
        week = tid(pg, 'pm-f-week').input_value()
        due = demo(pg, "s => s.tables.pregnancies.find(p => p.status === 'active').due_date")
        expected_week = (287 - (datetime.date.fromisoformat(due) - today).days) // 7
        R['50_semaine_calculee'] = week == str(expected_week)
        fill(pg, 'pm-f-title', 'Deuxième échographie'); fill(pg, 'pm-f-body', 'Elle bougeait beaucoup, on a vu sa main.')
        if IMG:
            with pg.expect_file_chooser() as fc:
                tid(pg, 'pm-f-photo').click()
            fc.value.set_files(IMG); pg.wait_for_timeout(3500)
        click(pg, 'pm-f-save', 1800)
        mem = demo(pg, "s => s.tables.pregnancy_memories.find(m => m.title === 'Deuxième échographie')")
        R['50_souvenir_enregistre'] = bool(mem) and mem['kind'] == 'ultrasound' and mem['week_sa'] == expected_week and mem['user_id'] == ME
        R['50_photo_privee'] = bool(mem) and len(mem['photo_ids']) == 1 and demo(pg, f"s => s.tables.documents.some(d => d.id === '{mem['photo_ids'][0] if mem and mem['photo_ids'] else ''}' && d.private_to_uploader && d.category === 'ultrasound' && d.uploaded_by === '{ME}')")
        click(pg, f'pm-card-{today.isoformat()}', 900); fill(pg, 'pm-f-title', 'Échographie du 2e trimestre'); click(pg, 'pm-f-save', 1500)
        R['50_modification'] = demo(pg, "s => s.tables.pregnancy_memories.some(m => m.title === 'Échographie du 2e trimestre')")
        pg.screenshot(path=f'{SHOTS}/parcours-50-souvenirs.png', full_page=True)
        switch(pg, SAM)
        go(pg, '/me/diary?tab=pregnancy')
        R['50_prive_pour_sam'] = has(pg, 'pm-view') and not has(pg, f'pm-card-{today.isoformat()}') and 'Échographie du 2e trimestre' not in body(pg)
        switch(pg, ME)
        mutate(pg, "s => { const p = s.tables.pregnancies.find(x => x.status === 'active'); p.status = 'born'; p.end_reason = 'born'; }")
        go(pg, '/me/diary')
        R['50_conserves_apres_naissance'] = has(pg, 'diary-tab-pregnancy')
        go(pg, '/me/diary?tab=pregnancy')
        R['50_conserves_apres_naissance'] = R['50_conserves_apres_naissance'] and has(pg, f'pm-card-{today.isoformat()}')
        click(pg, f'pm-card-{today.isoformat()}', 900); click(pg, 'pm-f-delete', 700); confirm_ok(pg, 'Supprimer le souvenir')
        R['50_suppression_photos_gardees'] = demo(pg, "s => !s.tables.pregnancy_memories.some(m => m.title === 'Échographie du 2e trimestre')") and (not mem or demo(pg, f"s => s.tables.documents.some(d => d.id === '{mem['photo_ids'][0] if mem['photo_ids'] else ''}')"))
        mutate(pg, "s => { const p = s.tables.pregnancies.find(x => x.status === 'born'); if (p) { p.status = 'active'; p.end_reason = null; } }")

        # ============================================================ 51 / 57 Rendez-vous et questions postnatales
        go(pg, '/postpartum/support?focus=postnatal', 3000)
        R['51_ecran'] = has(pg, 'pn-plan') and 'HOMI n’en ajoute aucun' in body(pg)
        click(pg, 'pn-add', 2500)
        R['51_saisie_rdv'] = '/appointments' in pg.url
        pg.get_by_placeholder('Échographie du 2e trimestre').filter(visible=True).last.fill('Consultation postnatale')
        pg.get_by_placeholder('JJ/MM/AAAA').filter(visible=True).last.fill(fr(today + datetime.timedelta(days=10)))
        pg.get_by_placeholder('14h30').filter(visible=True).last.fill('09:30')
        pg.get_by_role('button', name='Ajouter', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(1800)
        appt = demo(pg, "s => s.tables.appointments.find(a => a.title === 'Consultation postnatale')")
        R['51_rdv_enregistre'] = bool(appt) and appt['kind'] == 'postnatal'
        go(pg, '/postpartum/support?focus=postnatal', 3000)
        R['51_calendrier_semaines'] = has(pg, f"pn-appt-{appt['id'] if appt else 'x'}") and 'semaines après la naissance' in tid(pg, 'pn-upcoming').inner_text()
        fill(pg, 'pn-questions-field', 'Quand puis-je reprendre le sport ?'); click(pg, 'pn-questions-add', 1300)
        R['57_question_theme'] = demo(pg, "s => s.tables.consultation_questions.some(q => q.question === 'Quand puis-je reprendre le sport ?' && q.journey === 'postpartum' && q.theme === 'postnatal')")
        click(pg, 'pn-copy', 1500)
        R['57_copiee_dans_rdv'] = demo(pg, "s => s.tables.appointments.find(a => a.title === 'Consultation postnatale').questions.includes('Quand puis-je reprendre le sport ?')")
        go(pg, '/consult/questions?theme=postnatal', 2600)
        R['57_liste_themee'] = 'Questions postnatales' in body(pg) and 'Quand puis-je reprendre le sport ?' in body(pg)
        pg.screenshot(path=f'{SHOTS}/parcours-51-57-postnatal.png', full_page=True)

        # ============================================================ 53 Récupération physique
        go(pg, '/postpartum/checkin', 3000)
        text_click(pg, 'Ma récupération physique', 900) if not has(pg, 'ppb-fields') and pg.get_by_text('Ma récupération physique', exact=True).count() else None
        if not has(pg, 'ppb-fields'):
            btn = pg.get_by_role('button').filter(has_text='physique').filter(visible=True).first
            btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(800)
        R['53_champs'] = has(pg, 'ppb-fields') and has(pg, 'ppb-healing') and has(pg, 'ppb-pelvic')
        click(pg, 'ppb-scar-better', 200); click(pg, 'ppb-perineum-same', 200); click(pg, 'ppb-bleeding-light', 200)
        click(pg, 'pp-checkin-save', 2500)
        R['53_enregistre'] = demo(pg, f"s => s.tables.postpartum_checkins.some(c => c.user_id === '{ME}' && c.scar_feeling === 'better' && c.perineum_feeling === 'same' && c.bleeding === 'light')")
        go(pg, '/postpartum/history', 2800)
        R['53_historique'] = has(pg, 'ppb-history') and 'cicatrice : Mieux' in tid(pg, 'ppb-history').inner_text()
        go(pg, '/postpartum/checkin', 2600)
        if not has(pg, 'ppb-fields'):
            btn = pg.get_by_role('button').filter(has_text='physique').filter(visible=True).first
            btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(800)
        click(pg, 'ppb-healing', 2200)
        R['53_relie_cicatrisation'] = '/postpartum/healing' in pg.url

        # ============================================================ 72 Lots et contenants de lait tiré
        PU = 'p0000000-0000-4000-8000-0000000000aa'
        mutate(pg, f"s => {{ (s.tables.pumpings = s.tables.pumpings || []).push({{ id: '{PU}', household_id: '{HID}', child_id: '{LINA}', at: new Date(Date.now() - 30 * 60000).toISOString(), amount_ml: 200, side: 'both', created_by: '{ME}', created_at: new Date().toISOString() }}); }}")
        go(pg, f'/feeding/milk-stock?child={LINA}', 3000)
        R['72_seance_a_ranger'] = has(pg, 'milk-store-200')
        click(pg, 'milk-store-200', 900); click(pg, 'milk-f-count-2', 400)
        R['72_partage_propose'] = tid(pg, 'milk-f-part-0').input_value() == '100' and tid(pg, 'milk-f-part-1').input_value() == '100'
        fill(pg, 'milk-f-part-1', '80'); click(pg, 'milk-f-ct-bag', 200); fill(pg, 'milk-f-label', 'Sachet du matin')
        click(pg, 'milk-f-save', 1800)
        lot = demo(pg, f"s => s.tables.milk_stock.filter(m => m.pumping_id === '{PU}').map(m => [m.amount_ml, m.container, m.label]).sort()")
        R['72_deux_contenants'] = lot == [[100, 'bag', 'Sachet du matin 1'], [80, 'bag', 'Sachet du matin 2']] or sorted(lot) == sorted([[100, 'bag', 'Sachet du matin 1'], [80, 'bag', 'Sachet du matin 2']])
        R['72_reste_propose'] = has(pg, 'milk-partial') and '20 ml à ranger sur 200 ml' in tid(pg, 'milk-partial').inner_text()
        click(pg, 'milk-rest-200', 900)
        R['72_reste_prerempli'] = tid(pg, 'milk-f-amount').input_value() == '20'
        fill(pg, 'milk-f-amount', '30'); click(pg, 'milk-f-save', 1300)
        R['72_total_borne'] = 'dépasse la quantité tirée' in body(pg) and demo(pg, f"s => s.tables.milk_stock.filter(m => m.pumping_id === '{PU}').length") == 2
        fill(pg, 'milk-f-amount', '20'); click(pg, 'milk-f-save', 1500)
        R['72_lot_complet'] = demo(pg, f"s => s.tables.milk_stock.filter(m => m.pumping_id === '{PU}').reduce((n, m) => n + m.amount_ml, 0)") == 200 and 'lot : 1/3' in tid(pg, 'milk-list').inner_text()
        pg.screenshot(path=f'{SHOTS}/parcours-72-lots.png', full_page=True)

        # ============================================================ 75 / 83 / 84 Journal alimentaire
        go(pg, f'/bottle/{LINA}', 3000)
        R['75_entree_biberons'] = has(pg, 'bottle-journal') and has(pg, 'bottle-relays')
        click(pg, 'bottle-journal', 3000)
        R['75_vue_mixte'] = 'scope=all' in pg.url and has(pg, 'fj-view') and has(pg, 'fj-totals')
        split_line = tid(pg, 'fj-split-line').inner_text()
        R['75_repartition'] = '% au sein' in split_line and '% au biberon' in split_line
        R['75_tetees_et_biberons_du_jour'] = pg.locator('[data-testid^="fj-row-breast-"]').filter(visible=True).count() >= 1 and pg.locator('[data-testid^="fj-row-bottle-"]').filter(visible=True).count() >= 1
        R['123_refus_dans_journal'] = 'refusé : Courgette' in tid(pg, 'fj-list').inner_text()
        click(pg, 'fj-view-week', 1200)
        R['83_semaine'] = has(pg, 'fj-week-chart') and has(pg, 'fj-week') and has(pg, 'fj-hours')
        R['83_sans_norme'] = 'devrait' in body(pg) and not any(w in body(pg) for w in ['recommandé', 'insuffisant', 'trop peu'])
        with pg.expect_download() as dl:
            click(pg, 'fj-csv', 300)
        path = dl.value.path(); csv = open(path, encoding='utf-8-sig').read()
        R['84_export_csv'] = dl.value.suggested_filename.endswith('.csv') and csv.startswith('"Date";"Heure";"Type"') and 'Tétée' in csv and 'Biberon' in csv and 'Courgette' in csv
        with pg.expect_download() as dl2:
            click(pg, 'fj-pdf', 300)
        R['84_export_pdf'] = dl2.value.suggested_filename.endswith('.pdf') and open(dl2.value.path(), 'rb').read(5) == b'%PDF-'
        pg.screenshot(path=f'{SHOTS}/parcours-75-83-journal-semaine.png', full_page=True)

        # ============================================================ 80 Relais de biberons
        go(pg, f'/bottle/{LINA}', 3000)
        click(pg, 'bottle-relays', 3000)
        R['80_ecran'] = 'focus=bottles' in pg.url and has(pg, 'brl-section') and has(pg, 'brl-open')
        R['80_exemples'] = pg.locator('[data-testid^="brl-row-"]').filter(visible=True).count() >= 2
        pg.get_by_text('Prévoir', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(900)
        soon = (datetime.datetime.now() + datetime.timedelta(minutes=15))
        fill(pg, 'brl-f-when-date', fr(soon.date())); fill(pg, 'brl-f-when-time', soon.strftime('%H:%M')); fill(pg, 'brl-f-ml', '150')
        click(pg, f'brl-f-who-{ME}', 200); click(pg, 'brl-f-count-2', 300); click(pg, 'brl-f-every-2', 300)
        R['80_apercu'] = has(pg, 'brl-f-preview')
        fill(pg, 'brl-f-note', 'Lait tiré au réfrigérateur')
        click(pg, 'brl-f-save', 1800)
        new = demo(pg, f"s => s.tables.bottle_relays.filter(r => r.note === 'Lait tiré au réfrigérateur').map(r => r.assigned_to)")
        R['80_relais_prevus'] = len(new) == 2 and new[0] == ME and new[1] in (ME, SAM) and new != [ME, ME] or (len(new) == 2 and demo(pg, f"s => s.tables.care_shifts.some(c => c.kind === 'night')"))
        rid = demo(pg, f"s => s.tables.bottle_relays.filter(r => r.note === 'Lait tiré au réfrigérateur').sort((a, b) => a.planned_at.localeCompare(b.planned_at))[0].id")
        click(pg, f'brl-record-{rid}', 3000)
        R['80_noter_le_biberon'] = '/track/bottle' in pg.url and 'relay=' in pg.url
        click(pg, 'track-save', 2500)
        rel = demo(pg, f"s => s.tables.bottle_relays.find(r => r.id === '{rid}')")
        R['80_relie_au_biberon'] = rel['status'] == 'given' and bool(rel['bottle_id']) and demo(pg, f"s => s.tables.bottles.some(b => b.id === '{rel['bottle_id']}')")
        switch(pg, SAM)
        go(pg, f'/family/nights?focus=bottles&child={LINA}', 3000)
        R['80_vu_par_sam'] = has(pg, 'brl-section') and has(pg, 'brl-done')
        switch(pg, ME)
        pg.screenshot(path=f'{SHOTS}/parcours-80-relais.png', full_page=True)

        # ============================================================ 81 Consultante en lactation
        go(pg, f'/feeding/difficulties?child={LINA}', 3000)
        if has(pg, 'bfi-q-add'): click(pg, 'bfi-q-add', 1500)
        R['81_questions_lactation'] = demo(pg, "s => s.tables.consultation_questions.filter(q => q.theme === 'lactation').length") >= 1 and has(pg, 'bfi-q-list')
        click(pg, 'bfi-q-open', 2600)
        R['81_liste_themee'] = 'theme=lactation' in pg.url and 'Pour la consultante en lactation' in body(pg)
        fill(pg, 'cq-list-field', 'Comment tirer mon lait au travail ?'); click(pg, 'cq-list-add', 1300)
        R['81_ajout_theme'] = demo(pg, "s => s.tables.consultation_questions.some(q => q.question === 'Comment tirer mon lait au travail ?' && q.theme === 'lactation')")

        # ============================================================ 120 / 123 DME et refus
        go(pg, f'/child/{LINA}/discoveries?mode=blw', 3500)
        R['120_journal_dme'] = has(pg, 'dc-blw') and 'Brocoli' in tid(pg, 'dc-blw').inner_text() and 'à pleine main' in tid(pg, 'dc-blw').inner_text()
        click(pg, 'dc-food-carrot', 1200)
        R['120_mode_dme_par_defaut'] = has(pg, 'dc-grasp-pincer')
        click(pg, 'dc-grasp-pincer', 200); click(pg, 'dc-outcome-ate', 200); click(pg, 'dc-save', 2200)
        R['120_proposition_dme'] = demo(pg, "s => s.tables.food_tastings.some(t => t.food_key === 'carrot' && t.method === 'blw' && t.grasp === 'pincer' && t.outcome === 'ate' && t.status !== 'refused')")
        go(pg, f'/child/{LINA}/discoveries?focus=refusals', 3500)
        R['123_refus_structure'] = has(pg, 'dc-refusals') and 'proposé 2 fois · refusé 2 fois' in tid(pg, 'dc-refusal-zucchini').inner_text()
        R['123_dernier_etat_tel_quel'] = 'puis goûté' in tid(pg, 'dc-refusal-broccoli').inner_text()
        click(pg, 'dc-refusal-zucchini', 1200); click(pg, 'dc-outcome-refused', 200); click(pg, 'dc-save', 2000)
        go(pg, f'/child/{LINA}/discoveries?focus=refusals', 3000)
        R['123_compte_mis_a_jour'] = 'proposé 3 fois · refusé 3 fois' in tid(pg, 'dc-refusal-zucchini').inner_text()
        go(pg, f'/track/meal?child={LINA}', 3000)
        pg.get_by_placeholder(pg.evaluate("() => ''") or 'x').count()
        foods = pg.locator('input').filter(visible=True)
        lab = pg.get_by_text('Aliments', exact=False).filter(visible=True).first
        field = pg.get_by_label('Aliments', exact=False).filter(visible=True)
        (field.first if field.count() else foods.nth(1)).fill('Carotte, Poire'); pg.wait_for_timeout(400)
        R['123_repas_refus_propose'] = has(pg, 'track-meal-refused')
        click(pg, 'track-refused-Poire', 200)
        click(pg, 'track-save', 2500)
        R['123_repas_refus_enregistre'] = demo(pg, "s => s.tables.meals.some(m => (m.refused_foods||[]).includes('Poire') && m.foods.includes('Carotte'))") and demo(pg, "s => s.tables.food_tastings.some(t => t.food_name === 'Poire' && t.status === 'refused')")
        R['erreurs_page'] = errs[:]


    except Exception as e:  # rapport partiel : la clé en échec apparaît dans le JSON
        R['exception'] = str(e)[:300]
        pg.screenshot(path=f'{SHOTS}/echec.png', full_page=True)
        print(json.dumps(R, ensure_ascii=False, indent=1)); sys.exit(1)
    # ============================================================ Captures
    screens = [('analyses', '/documents/labs'), ('souvenirs', '/me/diary?tab=pregnancy'), ('postnatal', '/postpartum/support?focus=postnatal'), ('checkin', '/postpartum/checkin'),
               ('stock-lots', f'/feeding/milk-stock?child={LINA}'), ('journal', f'/bottle/history?child={LINA}&scope=all'), ('relais', f'/family/nights?focus=bottles&child={LINA}'),
               ('lactation', f'/feeding/difficulties?child={LINA}'), ('dme', f'/child/{LINA}/discoveries?mode=blw'), ('refus', f'/child/{LINA}/discoveries?focus=refusals')]
    overflow = []
    for (w, h) in [(390, 844), (320, 568)]:
        for scheme in ['light', 'dark']:
            pg.set_viewport_size({'width': w, 'height': h}); pg.emulate_media(color_scheme=scheme)
            for name, path in screens:
                go(pg, path, 2800)
                if name == 'checkin' and not has(pg, 'ppb-fields'):
                    btn = pg.get_by_role('button').filter(has_text='physique').filter(visible=True).first
                    if btn.count(): btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(600); pg.evaluate("() => { const el = [...document.querySelectorAll('[data-testid=\"screen-scroll\"]')].find(e => e.offsetParent !== null); if (el) el.scrollTop = 0; }")
                sw = pg.evaluate("() => document.documentElement.scrollWidth")
                if sw > w + 1: overflow.append(f'{name} {w} {scheme} {sw}')
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}.png')
                for k in range(1, 5):
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
