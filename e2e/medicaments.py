"""
Médicaments (07/11/2026) — version web de démonstration :
  - traitement de la maman (privé) : ajout, rappels créés, prise cochée puis décochée ;
  - traitement d'un enfant ajouté depuis le même écran, visible aussi dans sa fiche « Besoins particuliers » ;
  - « Ma journée » : cocher une prise = « Pris » ; réglage de relance dans « Mes notifications ».
La programmation sur téléphone n'est pas testable sur le web (testée en unitaire, expo-notifications simulé).
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B = 'http://127.0.0.1:8822'; R = {}; errs = []
SHOT = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e') + '/meds-'
os.makedirs(os.path.dirname(SHOT), exist_ok=True)
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def fill(pg, t, v): tid(pg, t).locator('input, textarea').first.fill(v) if tid(pg, t).locator('input, textarea').count() else tid(pg, t).fill(v)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    pg.goto(B + '/profile'); pg.wait_for_timeout(3000)
    R['lien_espace'] = has(pg, 'hub-meds')
    tid(pg, 'hub-meds').scroll_into_view_if_needed(); tid(pg, 'hub-meds').click(); pg.wait_for_timeout(2500)
    body = pg.inner_text('body')
    R['ecran_ouvert'] = pg.url.endswith('/medications') and 'Médicaments' in body
    R['regle_affichee'] = 'ne calcule, ne propose et ne modifie aucune dose' in body and '15 (ou 112)' in body
    R['moi_par_defaut_et_prive'] = tid(pg, 'med-who-me').get_attribute('aria-checked') == 'true' and 'Visible par vous seule' in body
    # 1. Mon traitement
    tid(pg, 'me-treatment-add').click(); pg.wait_for_timeout(1200)
    fill(pg, 't-name', 'Fer (test)'); fill(pg, 't-dose', '1 comprimé'); fill(pg, 't-times', '08:00, 20:00')
    tid(pg, 't-save').click(); pg.wait_for_timeout(2500)
    mine = demo(pg, "s => { const me = s.session.userId; const t = (s.tables.my_treatments||[]).find(x => x.name === 'Fer (test)'); return t ? { id: t.id, own: t.user_id === me, rem: s.tables.reminders.filter(r => r.my_treatment_id === t.id).map(r => [r.category, r.title, r.body, r.schedule.hour, r.user_id === me]) } : null }")
    R['mon_traitement_enregistre'] = bool(mine and mine['own'])
    R['deux_rappels_crees'] = bool(mine) and sorted(x[3] for x in mine['rem']) == [8, 20] and all(x[0] == 'medication' and x[1] == 'Fer (test)' and x[2] == '1 comprimé' and x[4] for x in mine['rem'])
    mid = mine['id'] if mine else 'x'
    R['prises_du_jour'] = has(pg, f'med-check-me-{mid}-08:00') and has(pg, f'med-check-me-{mid}-20:00')
    tid(pg, f'med-check-me-{mid}-08:00').click(); pg.wait_for_timeout(1500)
    R['coche_pris'] = demo(pg, f"s => (s.tables.my_treatment_logs||[]).filter(l => l.treatment_id === '{mid}' && l.status === 'taken').length") == 1
    R['compteur'] = '1 prise(s) notée(s) sur 2' in tid(pg, 'med-today').inner_text()
    tid(pg, f'med-check-me-{mid}-08:00').click(); pg.wait_for_timeout(1500)
    R['decoche'] = demo(pg, f"s => (s.tables.my_treatment_logs||[]).filter(l => l.treatment_id === '{mid}').length") == 0
    # 2. Traitement d'un enfant, depuis le même écran
    tid(pg, 'med-who-Lina').click(); pg.wait_for_timeout(1500)
    R['bascule_enfant'] = 'Traitements de Lina' in pg.inner_text('body')
    tid(pg, 'treatment-add').click(); pg.wait_for_timeout(1200)
    fill(pg, 't-name', 'Sirop (test)'); fill(pg, 't-dose', '5 ml'); fill(pg, 't-times', '09:00')
    tid(pg, 't-save').click(); pg.wait_for_timeout(2500)
    child = demo(pg, "s => { const t = (s.tables.child_treatments||[]).find(x => x.name === 'Sirop (test)'); const c = s.tables.children.find(x => x.first_name === 'Lina'); return t ? { id: t.id, cid: c.id, ok: t.child_id === c.id, rem: s.tables.reminders.filter(r => r.treatment_id === t.id).length } : null }")
    R['traitement_enfant_enregistre'] = bool(child and child['ok'] and child['rem'] == 1)
    if child:
        key = f"med-check-{child['cid']}-{child['id']}-09:00"
        R['prise_enfant_du_jour'] = has(pg, key)
        tid(pg, key).click(); pg.wait_for_timeout(1500)
        R['prise_enfant_notee'] = demo(pg, f"s => (s.tables.treatment_logs||[]).filter(l => l.treatment_id === '{child['id']}' && l.status === 'taken').length") == 1
        pg.screenshot(path=SHOT + 'ecran.png', full_page=True)
        # même donnée dans la fiche de l'enfant (rien n'est dupliqué)
        pg.goto(B + f"/child/{child['cid']}/needs?tab=treatments"); pg.wait_for_timeout(3000)
        R['fiche_enfant_coherente'] = 'Sirop (test)' in pg.inner_text('body') and tid(pg, 'dose-taken-09:00').get_attribute('aria-checked') == 'true'
    # 3. Ma journée : cocher la prise de 20:00 = « Pris »
    rid = demo(pg, f"s => (s.tables.reminders.find(r => r.my_treatment_id === '{mid}' && r.schedule.hour === 20) || {{}}).id")
    pg.goto(B + '/profile'); pg.wait_for_timeout(3500)
    R['prise_dans_ma_journee'] = has(pg, f'hub-check-{rid}')
    if R['prise_dans_ma_journee']:
        tid(pg, f'hub-check-{rid}').click(); pg.wait_for_timeout(1500)
        R['ma_journee_note_pris'] = demo(pg, f"s => (s.tables.my_treatment_logs||[]).some(l => l.treatment_id === '{mid}' && l.status === 'taken' && new Date(l.scheduled_for).getHours() === 20)")
        R['pas_de_daily_check_pour_un_medicament'] = demo(pg, f"s => (s.tables.daily_checks||[]).filter(c => c.reminder_id === '{rid}').length") == 0
        pg.screenshot(path=SHOT + 'journee.png')
    # 4. Mes notifications : relance
    pg.goto(B + '/settings/notifications'); pg.wait_for_timeout(2500)
    R['reglage_relance'] = 'Relance si une prise n’est pas notée' in pg.inner_text('body') and has(pg, 'nt-meds')
    sw = pg.get_by_role('switch', name='Relance si une prise n’est pas notée').first
    sw.click(); pg.wait_for_timeout(1200)
    R['relance_enregistree'] = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.auto-notifs-prefs.v1') || '{}'")).get('doseFollowUp') is False
    # 5. Anglais
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/medications'); pg.wait_for_timeout(2500)
    R['anglais'] = 'Medicines' in pg.inner_text('body') and 'My treatments' in pg.inner_text('body')
    b.close()
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
