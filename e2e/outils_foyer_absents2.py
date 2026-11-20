"""
Outils du foyer du 28/11/2026 — version web de démonstration (la RLS réelle à comptes distincts est vérifiée par
supabase/tests/sql/98zg_depenses_foyer.sql, 98zh_animaux.sql, 98zi_portions_lecture.sql).
Parcours réels : 186 dépenses (ajout, modification, suppression, totaux, répartition, export CSV) ; 189 animaux (fiche,
soin et rappel daté, tâche récurrente = mission, stock lié, choix de l'animal dans une mission, suppression) ; 122 portions
(lot depuis une recette, date limite en jours saisie, utilisation, annulation, alerte) ; 133/134 lecture (journal, semaine,
favori, histoire en grand texte, mode nuit, notée dans le journal) ; 161 relais dans « Ma place » ; plus de « bientôt ».
Captures 390×844 et 320×568, clair et sombre, de chaque écran.
Usage : E2E_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> python3 e2e/outils_foyer_absents2.py
"""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import PREMIUM_ON, SIMPLE_OFF

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8811')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/outils-foyer')
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
def fr(d): return d.strftime('%d/%m/%Y')
# couleur du texte de l'histoire : foncée en clair, claire en mode nuit
BG = """() => { const el = [...document.querySelectorAll('[data-testid="st-text"] div')].find(e => e.innerText.length > 20); return el ? getComputedStyle(el).color : ''; }"""


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    R['demo_exemples_presents'] = demo(pg, "s => (s.tables.household_expenses||[]).length >= 6 && (s.tables.pets||[]).length === 1 && (s.tables.prepared_portions||[]).length === 2 && (s.tables.reading_logs||[]).length >= 3")
    me = demo(pg, "s => s.session.userId")
    hid = demo(pg, f"s => s.tables.household_members.find(m => m.user_id === '{me}').household_id")
    partner = demo(pg, f"s => s.tables.household_members.find(m => m.household_id === '{hid}' && m.user_id !== '{me}').user_id")
    today = datetime.date.fromisoformat(pg.evaluate("() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }"))
    # les parcours partent de zéro (les exemples restent pour les captures, remis plus bas)
    mutate(pg, "s => { for (const t of ['household_expenses','pets','pet_care','prepared_portions','prepared_portion_uses','reading_logs','reading_favorites']) s.tables[t] = []; }")

    # ================================================================ 186 Dépenses
    go(pg, '/family/expenses', 3000)
    R['depenses_vide'] = 'Aucune dépense ce mois-ci' in body(pg)
    click(pg, 'fx-add', 900)
    fill(pg, 'fx-f-amount', '100'); fill(pg, 'fx-f-date', fr(today)); click(pg, 'fx-f-cat-food', 200); fill(pg, 'fx-f-note', 'Courses du samedi')
    click(pg, 'fx-f-save', 1500)
    click(pg, 'fx-add', 900)
    fill(pg, 'fx-f-amount', '40,00'); fill(pg, 'fx-f-date', fr(today)); click(pg, 'fx-f-cat-leisure', 200); click(pg, 'fx-f-payer-other', 200); fill(pg, 'fx-f-note', 'Cinéma')
    click(pg, 'fx-f-save', 1500)
    rows = demo(pg, "s => s.tables.household_expenses.map(e => ({ id: e.id, amount: e.amount, paid_by: e.paid_by, category: e.category, share: e.payer_share }))")
    R['depenses_enregistrees'] = len(rows) == 2 and any(r['amount'] == 100 and r['paid_by'] == me and r['share'] == 50 for r in rows) and any(r['amount'] == 40 and r['paid_by'] == partner for r in rows)
    R['depenses_liste'] = 'Courses du samedi' in body(pg) and 'Cinéma' in body(pg) and '140,00' in tid(pg, 'fx-month-total').inner_text()
    click(pg, 'fx-add', 900); fill(pg, 'fx-f-amount', 'abc'); click(pg, 'fx-f-save', 600)
    R['depenses_erreur_montant'] = 'Montant illisible' in body(pg) and len(demo(pg, "s => s.tables.household_expenses")) == 2
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    go(pg, '/family/expenses', 3000)
    click(pg, 'fx-tab-totals', 700)
    R['depenses_totaux'] = '100,00' in tid(pg, 'fx-cat-total-food').inner_text() and '40,00' in tid(pg, 'fx-cat-total-leisure').inner_text() and '100,00' in tid(pg, 'fx-adult-total-me').inner_text()
    click(pg, 'fx-tab-split', 700)
    R['depenses_repartition'] = '30,00' in tid(pg, 'fx-transfers').inner_text() and ' doit ' in tid(pg, 'fx-transfers').inner_text()
    pg.screenshot(path=f'{SHOTS}/parcours-depenses-repartition.png', full_page=True)
    # modification : 40 → 60 (la part de Sam devient 80 ; Sam doit 20)
    other_id = next(r['id'] for r in rows if r['amount'] == 40)
    click(pg, 'fx-tab-list', 600); click(pg, f'fx-row-{other_id}', 900)
    fill(pg, 'fx-f-amount', '60'); click(pg, 'fx-f-save', 1500)
    click(pg, 'fx-tab-split', 700)
    R['depenses_modifiee'] = demo(pg, f"s => s.tables.household_expenses.find(e => e.id === '{other_id}').amount") == 60 and '20,00' in tid(pg, 'fx-transfers').inner_text()
    # dépense non partagée (pour moi seule) : 20 €, ne change pas la répartition
    click(pg, 'fx-add', 900); fill(pg, 'fx-f-amount', '20'); fill(pg, 'fx-f-date', fr(today)); click(pg, 'fx-f-share-100', 200); click(pg, 'fx-f-save', 1500)
    R['depenses_non_partagee'] = '20,00' in tid(pg, 'fx-transfers').inner_text() and demo(pg, "s => s.tables.household_expenses.some(e => e.payer_share === 100)")
    with pg.expect_download() as dl:
        click(pg, 'fx-export-period', 1200)
    csv = open(dl.value.path(), encoding='utf-8-sig').read()
    R['depenses_export_csv'] = csv.startswith('"Date";"Catégorie";"Montant (€)"') and '"Total";"";"180,00"' in csv and 'Cinéma' in csv
    open(f'{SHOTS}/depenses.csv', 'w', encoding='utf-8').write(csv)
    click(pg, 'fx-tab-list', 600); click(pg, f'fx-row-{other_id}', 900); click(pg, 'fx-f-delete', 700)
    pg.get_by_role('button', name='Supprimer').last.click(); pg.wait_for_timeout(1200)
    R['depenses_suppression'] = len(demo(pg, "s => s.tables.household_expenses")) == 2 and 'Cinéma' not in body(pg)

    # ================================================================ 189 Animaux
    go(pg, '/family/pets', 3000)
    R['animaux_vide'] = 'Aucun animal' in body(pg) and 'aucun calendrier vétérinaire' in body(pg)
    click(pg, 'pet-add', 900)
    fill(pg, 'pet-f-name', 'Caramel'); click(pg, 'pet-f-sp-dog', 200); fill(pg, 'pet-f-birth', fr(today - datetime.timedelta(days=800)))
    fill(pg, 'pet-f-vet', 'Clinique des Tilleuls'); fill(pg, 'pet-f-phone', '01 23 45 67 89')
    click(pg, 'pet-f-save', 2500)
    pet = demo(pg, "s => s.tables.pets[0]")
    R['animal_fiche'] = pet and pet['name'] == 'Caramel' and pet['species'] == 'dog' and f"/family/pets/{pet['id']}" in pg.url and '2 ans' in body(pg)
    # soin daté par le parent + rappel du téléphone
    nxt = today + datetime.timedelta(days=10)
    click(pg, 'pet-care-add', 900); click(pg, 'pet-c-kind-deworming', 200)
    fill(pg, 'pet-c-done', fr(today - datetime.timedelta(days=80))); fill(pg, 'pet-c-next', fr(nxt)); click(pg, 'pet-c-save', 1800)
    care = demo(pg, "s => s.tables.pet_care[0]")
    R['animal_soin'] = care and care['kind'] == 'deworming' and care['next_due'] == nxt.isoformat() and 'Vermifuge' in body(pg)
    R['animal_rappel'] = demo(pg, f"s => (s.tables.reminders||[]).some(r => r.deep_link === '/family/pets/{pet['id']}?care={care['id']}' && r.schedule.type === 'once' && r.title.includes('Caramel'))")
    # tâche récurrente → mission « Animaux » rattachée à l'animal
    click(pg, 'pet-task-add-walk', 2500)
    task = demo(pg, f"s => s.tables.family_tasks.find(t => t.pet_id === '{pet['id']}')")
    R['animal_tache_mission'] = task is not None and task['category'] == 'pets' and (task.get('recurrence') or {}).get('type') == 'daily' and task['title'] == 'Promener Caramel' and '/family/missions/' in pg.url
    go(pg, f"/family/pets/{pet['id']}", 3000)
    R['animal_tache_visible'] = 'Promener Caramel' in tid(pg, 'pet-tasks').inner_text()
    # stock lié depuis la fiche
    click(pg, 'pet-stock-add', 2500)
    R['stock_animal_preselectionne'] = has(pg, f"stock-pet-{pet['id']}")
    fill(pg, 'stock-label', 'Croquettes Caramel'); click(pg, 'stock-save', 2000)
    R['stock_lie'] = demo(pg, f"s => s.tables.household_stocks.some(x => x.label === 'Croquettes Caramel' && x.pet_id === '{pet['id']}')")
    go(pg, f"/family/pets/{pet['id']}", 3000)
    R['stock_visible_fiche'] = 'Croquettes Caramel' in tid(pg, 'pet-stocks').inner_text()
    pg.screenshot(path=f'{SHOTS}/parcours-animal.png', full_page=True)
    # nouvelle mission : l'animal se choisit (plus de « bientôt »)
    go(pg, '/family/missions/new?template=kibble', 3000)
    click(pg, 'mission-next', 600); click(pg, 'mission-next', 900)
    R['mission_choix_animal'] = has(pg, f"mission-pet-{pet['id']}") and 'bientôt' not in body(pg).lower()
    click(pg, f"mission-pet-{pet['id']}", 300); click(pg, 'mission-send', 2500)
    R['mission_avec_animal'] = demo(pg, f"s => s.tables.family_tasks.filter(t => t.pet_id === '{pet['id']}').length") == 2
    # nouveau stock : animal associé proposé (plus de « bientôt »)
    go(pg, '/family/stocks/new', 3000)
    R['stock_choix_animal'] = has(pg, f"stock-pet-{pet['id']}") and 'bientôt' not in body(pg).lower()
    # suppression de la fiche : soins supprimés, missions et stocks gardés
    go(pg, f"/family/pets/{pet['id']}", 3000)
    click(pg, 'pet-delete', 700); pg.get_by_role('button', name='Supprimer').last.click(); pg.wait_for_timeout(1800)
    R['animal_suppression'] = demo(pg, "s => s.tables.pets.length === 0 && s.tables.pet_care.length === 0") and '/family/pets' in pg.url \
        and demo(pg, "s => s.tables.family_tasks.some(t => t.title === 'Promener Caramel') && s.tables.household_stocks.some(x => x.label === 'Croquettes Caramel')")

    # ================================================================ 122 Portions préparées
    go(pg, '/meals/portions', 3500)
    R['portions_vide'] = 'Aucune portion préparée' in body(pg)
    click(pg, 'pt-add', 1200)
    fill(pg, 'pt-f-recipe', 'carotte'); pg.wait_for_timeout(900)
    recipe_chip = pg.locator('[data-testid^="pt-f-recipe-dd-"]').filter(visible=True).first
    R['portions_recherche_recette'] = recipe_chip.count() > 0
    if recipe_chip.count(): recipe_chip.click(); pg.wait_for_timeout(500)
    fill(pg, 'pt-f-count', '6'); fill(pg, 'pt-f-prepared', fr(today))
    click(pg, 'pt-f-fridge', 300)
    R['portions_conseil_recette_source'] = 'Conseil de conservation de la recette' in body(pg) and 'Sources de la recette' in body(pg)
    click(pg, 'pt-f-mode-days', 300); fill(pg, 'pt-f-days', '2')
    R['portions_aucune_duree_inventee'] = 'HOMI ne propose aucune durée de conservation' in body(pg)
    click(pg, 'pt-f-save', 1800)
    bt = demo(pg, "s => s.tables.prepared_portions[0]")
    R['portions_lot'] = bt and bt['portions_total'] == 6 and bt['storage'] == 'fridge' and bt['use_by'] == (today + datetime.timedelta(days=2)).isoformat() and (bt['recipe_slug'] or '').startswith('dd-')
    R['portions_alerte'] = has(pg, f"pt-alert-{bt['id']}") and 'Date limite proche' in body(pg)
    click(pg, f"pt-use-{bt['id']}", 1200); click(pg, f"pt-use-{bt['id']}", 1200)
    R['portions_decompte'] = '4 / 6' in tid(pg, f"pt-row-{bt['id']}").inner_text() and demo(pg, "s => s.tables.prepared_portion_uses.length") == 2
    click(pg, f"pt-undo-{bt['id']}", 1200)
    R['portions_annulation'] = '5 / 6' in tid(pg, f"pt-row-{bt['id']}").inner_text()
    # modification : impossible de descendre sous ce qui est utilisé
    click(pg, f"pt-row-{bt['id']}", 1000); fill(pg, 'pt-f-count', '0'); click(pg, 'pt-f-save', 700)
    R['portions_erreur_nombre'] = 'Nombre de portions' in body(pg)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/parcours-portions.png', full_page=True)

    # ================================================================ 133 / 134 Lecture
    go(pg, '/reading', 3000)
    R['lecture_vide'] = 'Aucune lecture notée' in body(pg)
    click(pg, 'rd-add', 900)
    fill(pg, 'rd-f-title', 'Petit Ours Brun'); fill(pg, 'rd-f-minutes', '10'); click(pg, 'rd-f-reaction-loved', 200); click(pg, 'rd-f-save', 1500)
    click(pg, 'rd-add', 900)
    fill(pg, 'rd-f-title', 'Petit ours brun'); fill(pg, 'rd-f-date', fr(today - datetime.timedelta(days=1)) if today.weekday() > 0 else fr(today))
    fill(pg, 'rd-f-reader-label', 'Mamie'); click(pg, 'rd-f-save', 1500)
    logs = demo(pg, "s => s.tables.reading_logs.map(l => ({ title: l.title, minutes: l.minutes, reaction: l.reaction, reader_id: l.reader_id, reader_label: l.reader_label }))")
    R['lecture_journal'] = len(logs) == 2 and any(l['minutes'] == 10 and l['reaction'] == 'loved' and l['reader_id'] == me for l in logs) and any(l['reader_label'] == 'Mamie' and l['reader_id'] is None for l in logs)
    R['lecture_semaine'] = 'cette semaine' in tid(pg, 'rd-week-summary').inner_text() and '10 min' in tid(pg, 'rd-week-summary').inner_text()
    R['lecture_plus_lus'] = '2 fois' in body(pg)
    pg.locator('[data-testid^="rd-top-"]').filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    R['lecture_favori'] = demo(pg, "s => s.tables.reading_favorites.length") == 1 and has(pg, 'rd-favorites')
    R['lecture_sans_culpabilite'] = all(w not in body(pg).lower() for w in ['série', 'objectif', 'manqué', 'dommage'])
    click(pg, 'rd-open-library', 2500)
    R['histoires_bibliotheque'] = pg.locator('[data-testid^="st-open-"]').filter(visible=True).count() >= 4 and '2–4 ans' in body(pg)
    click(pg, 'st-band-all', 600)
    R['histoires_douze'] = pg.locator('[data-testid^="st-open-"]').filter(visible=True).count() == 12
    click(pg, 'st-open-phare', 2500)
    R['histoire_lecture'] = 'La lumière du petit phare' in body(pg) and 'petit phare rayé blanc et rouge' in body(pg)
    size0 = pg.evaluate("() => parseFloat(getComputedStyle([...document.querySelectorAll('[data-testid=\"st-text\"] div')].find(e => e.innerText.length > 20)).fontSize)")
    click(pg, 'st-bigger', 500)
    size1 = pg.evaluate("() => parseFloat(getComputedStyle([...document.querySelectorAll('[data-testid=\"st-text\"] div')].find(e => e.innerText.length > 20)).fontSize)")
    R['histoire_grand_texte'] = size0 >= 22 and size1 > size0
    bg0 = pg.evaluate(BG)
    click(pg, 'st-night', 1200)
    R['histoire_mode_nuit'] = bg0 != pg.evaluate(BG) and pg.get_by_text('Mode nuit').first.is_visible()
    pg.screenshot(path=f'{SHOTS}/parcours-histoire-nuit.png')
    click(pg, 'st-night', 600)
    click(pg, 'st-log', 900); click(pg, 'rd-f-save', 1500)
    R['histoire_notee_journal'] = demo(pg, "s => s.tables.reading_logs.some(l => l.story_key === 'phare' && l.title === 'La lumière du petit phare' && l.minutes >= 1)")

    # ================================================================ 161 Ma place (Espace co-parent) et « bientôt »
    go(pg, '/family/my-place', 3000)
    R['ma_place_relais'] = has(pg, 'place-relays') and has(pg, 'place-couple') and has(pg, 'place-missions')
    click(pg, 'place-relays', 2500)
    R['ma_place_relais_ouvre'] = '/family/nights' in pg.url
    go(pg, '/meals/shopping', 3000)
    R['courses_sans_bientot'] = 'Photo du produit' not in body(pg)
    R['erreurs_page'] = errs[:]

    # ================================================================ Captures : nouvelle démonstration (exemples réalistes)
    ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    go(pg, '/welcome')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3000)
    pet_id = demo(pg, "s => (s.tables.pets[0] || {}).id")
    screens = [('depenses', '/family/expenses'), ('animaux', '/family/pets'), ('portions', '/meals/portions'), ('lecture', '/reading'),
               ('histoires', '/reading/stories'), ('histoire', '/reading/story/petite_lune'), ('ma-place', '/family/my-place'), ('animal', f'/family/pets/{pet_id}')]
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

R['_fin'] = True
print(json.dumps({k: v for k, v in R.items() if k != '_fin'}, ensure_ascii=False, indent=1))
ok = all(v is True for k, v in R.items() if k not in ('erreurs_page', 'debordements', '_fin')) and not R.get('erreurs_page')
sys.exit(0 if ok else 1)
