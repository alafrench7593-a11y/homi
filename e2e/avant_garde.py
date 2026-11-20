"""
« Avant la garde » (25/11/2026) — version web de démonstration (règles de 20261125000100_avant_garde.sql côté parent ;
la RLS réelle à comptes distincts est vérifiée par supabase/tests/sql/98ze_avant_garde.sql).
Parcours : lien depuis /garde (parent) → 2 candidates créées (assistante maternelle au taux horaire, crèche au forfait)
→ entretien (réponse notée, question ajoutée) → visite (points cochés, note) → comparaison côte à côte et tri →
budget avant aides (montants exacts) — compte Premium (l'espace garde des parents l'est, comme l'Espace Nounou) → planning → pointage d'une semaine (5 jours) → absence → export CSV.
Captures 390×844 et 320×568, clair et sombre, de chaque écran.
Usage : version web exportée (voir e2e/README.md), puis
  E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/avant_garde.py
"""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/avant-garde')
os.makedirs(SHOTS, exist_ok=True)
R = {}; errs = []


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
def fr(d): return d.strftime('%d/%m/%Y')


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    # données d'exemple d'« Avant la garde » retirées : le parcours part de zéro
    R['demo_exemple_present'] = demo(pg, "s => (s.tables.childcare_candidates||[]).length >= 3 && (s.tables.childcare_events||[]).length > 0")
    mutate(pg, "s => { for (const t of ['childcare_candidates','childcare_prep_items','childcare_prep_answers','childcare_schedules','childcare_absences','childcare_events']) s.tables[t] = []; }")

    today = datetime.date.fromisoformat(pg.evaluate("() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }"))

    # 0. Entrée depuis /garde (parent)
    go(pg, '/garde', 3000)
    R['lien_garde_parent'] = has(pg, 'care-open-prep')
    click(pg, 'care-open-prep', 2500)
    R['accueil_avant_garde'] = '/garde/prep' in pg.url and 'Avant la garde' in body(pg) and has(pg, 'gp-open-contracts')

    # 1. Deux candidates
    go(pg, '/garde/prep/candidats')
    R['candidates_vide'] = 'Aucune candidate' in body(pg)
    click(pg, 'gp-cand-add', 900)
    fill(pg, 'gp-f-name', 'Sophie Martin'); fill(pg, 'gp-f-phone', '06 12 34 56 78')
    fill(pg, 'gp-f-availability', 'Lundi au jeudi, 8 h – 18 h')
    fill(pg, 'gp-f-rate', '4,60'); fill(pg, 'gp-f-hours', '36'); fill(pg, 'gp-f-weeks', '47'); fill(pg, 'gp-f-days', '4')
    fill(pg, 'gp-f-meal', '4,5'); fill(pg, 'gp-f-upkeep', '3,8')
    click(pg, 'gp-f-save', 1500)
    click(pg, 'gp-cand-add', 900)
    fill(pg, 'gp-f-name', 'Crèche Les Lutins'); click(pg, 'gp-f-kind-creche', 200); click(pg, 'gp-f-status-visited', 200)
    click(pg, 'gp-f-mode-monthly', 300); fill(pg, 'gp-f-monthly', '395'); fill(pg, 'gp-f-days', '4')
    click(pg, 'gp-f-save', 1500)
    rows = demo(pg, "s => s.tables.childcare_candidates.map(c => ({ id: c.id, name: c.name, kind: c.kind, mode: c.rate_mode, rate: c.hourly_rate, fee: c.monthly_fee, weeks: c.weeks_per_year }))")
    sophie = next((r for r in rows if r['name'] == 'Sophie Martin'), None)
    lutins = next((r for r in rows if r['name'] == 'Crèche Les Lutins'), None)
    R['candidates_creees'] = len(rows) == 2 and sophie and sophie['rate'] == 4.6 and sophie['weeks'] == 47 and lutins and lutins['kind'] == 'creche' and lutins['fee'] == 395
    R['candidates_cartes'] = has(pg, f"gp-cand-{sophie['id']}") and has(pg, f"gp-cand-{lutins['id']}") and '778,63' in body(pg)
    R['erreur_montant'] = True
    click(pg, 'gp-cand-add', 900); fill(pg, 'gp-f-name', 'Test'); fill(pg, 'gp-f-rate', 'abc'); click(pg, 'gp-f-save', 700)
    R['erreur_montant'] = 'Montant illisible' in body(pg) and len(demo(pg, "s => s.tables.childcare_candidates")) == 2
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    go(pg, '/garde/prep/candidats')

    # 2. Comparer : tri et colonnes
    click(pg, 'gp-sort-cost', 400)
    first = pg.locator('[data-testid^="gp-cand-"]').filter(visible=True).first.get_attribute('data-testid')
    R['tri_cout'] = first == f"gp-cand-{lutins['id']}"
    click(pg, 'gp-view-compare', 800)
    R['comparaison_colonnes'] = has(pg, f"gp-col-{sophie['id']}") and has(pg, f"gp-col-{lutins['id']}") and 'Disponibilités' in body(pg)

    # 3. Entretien (modèle posé une fois, réponse notée, question ajoutée)
    go(pg, f"/garde/prep/entretien?c={sophie['id']}", 3500)
    n_items = demo(pg, "s => s.tables.childcare_prep_items.filter(i => i.kind === 'interview').length")
    R['entretien_modele'] = n_items == 14 and 'Depuis combien de temps gardez-vous des enfants' in body(pg)
    fill(pg, 'gp-item-answer-experience', 'Douze ans, agréée pour 3 enfants')
    click(pg, 'gp-item-check-approval', 900)
    click(pg, 'gp-item-check-experience', 900)
    fill(pg, 'gp-prep-new', 'Accepte-t-elle les couches lavables ?'); click(pg, 'gp-prep-add', 1200)
    ans = demo(pg, f"s => s.tables.childcare_prep_answers.filter(a => a.candidate_id === '{sophie['id']}').map(a => ({{ a: a.answer, c: a.checked }}))")
    R['entretien_reponse'] = any(a['a'] == 'Douze ans, agréée pour 3 enfants' and a['c'] for a in ans)
    R['entretien_question_ajoutee'] = demo(pg, "s => s.tables.childcare_prep_items.some(i => i.label === 'Accepte-t-elle les couches lavables ?')") and 'couches lavables' in body(pg)
    R['entretien_doublon_modele'] = demo(pg, "s => s.tables.childcare_prep_items.filter(i => i.kind === 'interview' && i.template_key).length") == 14
    pg.screenshot(path=f'{SHOTS}/parcours-entretien.png', full_page=True)

    # 4. Visite de la crèche
    go(pg, f"/garde/prep/visite?c={lutins['id']}", 3500)
    click(pg, 'gp-item-check-hygiene', 900); click(pg, 'gp-item-check-safety', 900)
    fill(pg, 'gp-item-answer-hygiene', 'Coin change impeccable'); click(pg, 'gp-item-check-outdoor', 1000)
    R['visite_cochee'] = demo(pg, f"s => s.tables.childcare_prep_answers.filter(a => a.candidate_id === '{lutins['id']}' && a.checked).length") == 3
    R['visite_note'] = demo(pg, "s => s.tables.childcare_prep_answers.some(a => a.answer === 'Coin change impeccable')")
    R['visite_avancement'] = 'Vérifiés : 3 sur 13' in body(pg)

    # 5. Budget avant aides (4,60 × 36 × 47 / 12 + 4,5 × 4 × 47 / 12 + 3,8 × 4 × 47 / 12 = 778,63 €)
    go(pg, '/garde/prep/budget', 3000)
    R['budget_sophie'] = '778,63' in tid(pg, f"gp-bd-total-{sophie['id']}").inner_text()
    R['budget_creche'] = '395,00' in tid(pg, f"gp-bd-total-{lutins['id']}").inner_text()
    R['budget_moins_cher'] = 'Le moins élevé avant aides : Crèche Les Lutins' in body(pg)
    R['budget_aucune_aide_calculee'] = 'ne les calcule pas' in body(pg) and has(pg, 'gp-src-cmg')

    # 6. Planning
    go(pg, '/garde/prep/planning', 3000)
    click(pg, 'gp-pl-edit', 900)
    fill(pg, 'gp-pl-label', 'Chez Sophie'); fill(pg, 'gp-pl-from', fr(today - datetime.timedelta(days=35))); click(pg, 'gp-pl-day-5', 300)  # vendredi retiré
    click(pg, 'gp-pl-save', 1500)
    sch = demo(pg, "s => s.tables.childcare_schedules.map(x => ({ label: x.label, days: x.days.map(d => d.wd) }))")
    R['planning_enregistre'] = len(sch) == 1 and sch[0]['label'] == 'Chez Sophie' and sch[0]['days'] == [1, 2, 3, 4]
    R['planning_semaine'] = 'Prévu cette semaine : 36 h 00' in body(pg)

    # 7. Pointage d'une semaine (semaine dernière, du lundi au vendredi)
    monday = today - datetime.timedelta(days=today.weekday() + 7)
    go(pg, '/garde/prep/heures', 3000)
    click(pg, 'gp-hr-prev', 1200)
    for i, dep in enumerate(['17:30', '17:30', '17:30', '17:30', '12:30']):
        click(pg, 'gp-hr-add', 900)
        fill(pg, 'gp-hr-day', fr(monday + datetime.timedelta(days=i))); fill(pg, 'gp-hr-arr', '08:30'); fill(pg, 'gp-hr-dep', dep)
        click(pg, 'gp-hr-save', 1300)
    evs = demo(pg, "s => s.tables.childcare_events.filter(e => e.kind === 'arrival' || e.kind === 'departure').length")
    R['pointage_carnet'] = evs == 10  # mêmes lignes que l'arrivée / le départ du carnet de liaison
    R['pointage_total_semaine'] = tid(pg, 'gp-hr-worked').inner_text().strip() == '40 h 00'
    R['pointage_prevu'] = '36 h 00' in tid(pg, 'gp-hr-summary').inner_text()
    R['mention_sans_valeur_legale'] = 'pas de valeur légale' in body(pg)
    pg.screenshot(path=f'{SHOTS}/parcours-heures.png', full_page=True)
    # correction d'un pointage (vendredi : départ 13:00)
    click(pg, f"gp-hr-shift-{(monday + datetime.timedelta(days=4)).isoformat()}", 900)
    fill(pg, 'gp-hr-dep', '13:00'); click(pg, 'gp-hr-save', 1300)
    R['pointage_corrige'] = tid(pg, 'gp-hr-worked').inner_text().strip() == '40 h 30'

    # 8. Export CSV de la semaine
    with pg.expect_download() as dl:
        click(pg, 'gp-hr-export', 1200)
    path = dl.value.path(); csv = open(path, encoding='utf-8-sig').read()
    R['export_csv'] = csv.startswith('"Date";"Arrivée";"Départ"') and '"Total";"";"";"40 h 30";"40,5"' in csv and 'sans valeur légale' in csv
    open(f'{SHOTS}/heures.csv', 'w', encoding='utf-8').write(csv)

    # 9. Absence de l'enfant (lundi prochain) : visible au planning et retirée du prévu
    next_mon = today + datetime.timedelta(days=7 - today.weekday())
    go(pg, '/garde/prep/absences', 3000)
    click(pg, 'gp-ab-add', 900)
    fill(pg, 'gp-ab-from', fr(next_mon)); fill(pg, 'gp-ab-to', fr(next_mon)); fill(pg, 'gp-ab-note', 'Chez les grands-parents')
    click(pg, 'gp-ab-save', 1500)
    R['absence_enregistree'] = demo(pg, f"s => s.tables.childcare_absences.some(a => a.kind === 'child' && a.from_on === '{next_mon.isoformat()}')") and 'Chez les grands-parents' in body(pg)
    go(pg, '/garde/prep/planning', 3000)
    cell = tid(pg, f'gp-pl-cell-{next_mon.isoformat()}').get_attribute('aria-label') or ''
    R['absence_dans_planning'] = 'pas de garde' in cell and 'Absence de l’enfant' in cell
    go(pg, '/garde/prep/heures', 3000); click(pg, 'gp-hr-next', 1200)
    R['absence_dans_heures'] = '1 jour d’absence de l’enfant' in tid(pg, 'gp-hr-summary').inner_text() and '27 h 00' in tid(pg, 'gp-hr-summary').inner_text()

    # 10. Contrats : coffre de documents filtré sur « Garde »
    go(pg, '/garde/prep', 2500); click(pg, 'gp-open-contracts', 2500)
    R['contrats_coffre'] = '/documents' in pg.url and has(pg, 'docs-cat-filter')
    R['erreurs_page'] = errs[:]

    # 11. Captures : 390×844 et 320×568, clair et sombre ; aucune barre de défilement horizontale de la page
    screens = [('accueil', '/garde/prep'), ('modes', '/garde/prep/modes'), ('candidats', '/garde/prep/candidats'), ('fiche', f"/garde/prep/fiche?id={sophie['id']}"),
               ('entretien', f"/garde/prep/entretien?c={sophie['id']}"), ('visite', f"/garde/prep/visite?c={lutins['id']}"), ('budget', '/garde/prep/budget'),
               ('planning', '/garde/prep/planning'), ('heures', '/garde/prep/heures'), ('absences', '/garde/prep/absences')]
    overflow = []
    for (w, h) in [(390, 844), (320, 568)]:
        for scheme in ['light', 'dark']:
            pg.set_viewport_size({'width': w, 'height': h}); pg.emulate_media(color_scheme=scheme)
            for name, path in screens:
                go(pg, path, 2600)
                sw = pg.evaluate("() => document.documentElement.scrollWidth")
                if sw > w + 1: overflow.append(f'{name} {w} {scheme} {sw}')
                if name == 'candidats': click(pg, 'gp-view-compare', 800)
                pg.screenshot(path=f'{SHOTS}/{name}-{w}-{scheme}.png')
                # la page défile dans « screen-scroll » : captures successives jusqu'en bas
                for k in range(1, 6):
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
