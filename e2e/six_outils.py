"""
Six outils (07/11/2026), version web de démonstration :
  compteur de mesurettes, suivi PMA, rappels partagés avec le foyer, alertes produits rappelés,
  routines en pictogrammes (mode enfant), garde alternée.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/six_outils.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import SET_BODY, SIMPLE_OFF  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")


def patch(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2400):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def ok_screen(pg):
    t = T(pg)
    return 'Oups' not in t and 'rencontré un problème' not in t


def shot(pg, name):
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=True)


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    me = demo(pg, "s => s.session.userId")
    hid = demo(pg, "s => s.tables.household_members.find(m => m.user_id === s.session.userId).household_id")

    # ---- 1. compteur de mesurettes
    go(pg, '/bottle/scoops')
    R['mesurettes_ouvre'] = ok_screen(pg) and 'Compteur de mesurettes' in T(pg)
    tid(pg, 'sc-ratio').fill('30'); tid(pg, 'sc-water').fill('150'); pg.wait_for_timeout(500)
    R['mesurettes_calcul_juste'] = '5 mesurettes rases' in T(pg)
    for _ in range(5):
        tid(pg, 'sc-tap').click(); pg.wait_for_timeout(120)
    R['mesurettes_compte'] = '5 / 5' in T(pg) and 'C’est le compte' in T(pg)
    shot(pg, 'six-mesurettes')
    tid(pg, 'sc-water').fill('160'); pg.wait_for_timeout(400)
    R['mesurettes_pas_d_arrondi'] = 'ne tombe pas juste' in T(pg) and '0' in tid(pg, 'sc-count').inner_text()
    go(pg, '/bottle/scoops', 1800)
    R['mesurettes_regle_memorisee'] = tid(pg, 'sc-ratio').input_value() == '30'

    # ---- 2. suivi PMA (parcours « avoir un enfant »)
    pg.evaluate(SET_BODY, ['ttc', False])
    go(pg, '/fertility/pma')
    R['pma_ouvre_vide'] = ok_screen(pg) and 'Aucun protocole' in T(pg)
    pg.get_by_role('button', name='Nouveau protocole').first.click(); pg.wait_for_timeout(700)
    tid(pg, 'pma-kind-fiv').click()
    tid(pg, 'pma-protocol-save').click(); pg.wait_for_timeout(1800)
    R['pma_protocole_cree'] = demo(pg, "s => (s.tables.pma_protocols || []).some(p => p.kind === 'fiv')") and 'Jour 1' in T(pg)
    pg.get_by_text('Ajouter', exact=True).first.click(); pg.wait_for_timeout(700)
    tid(pg, 'pma-med-name').fill('Traitement test'); tid(pg, 'pma-med-time').fill('20:00')
    tid(pg, 'pma-med-save').click(); pg.wait_for_timeout(2000)
    R['pma_traitement_et_rappel'] = demo(pg, "s => (s.tables.pma_meds || []).some(m => m.name === 'Traitement test') && (s.tables.reminders || []).some(r => (r.deep_link || '').startsWith('/fertility/pma?med=') && r.schedule.hour === 20 && r.category === 'medication')")
    med = demo(pg, "s => s.tables.pma_meds[0].id")
    tid(pg, f'pma-take-{med}').click(); pg.wait_for_timeout(1500)
    R['pma_prise_notee'] = demo(pg, "s => (s.tables.pma_logs || []).some(l => l.kind === 'dose')") and '1/1' in T(pg)
    tid(pg, 'pma-step-retrieval').click(); pg.wait_for_timeout(300)
    tid(pg, 'pma-step-save').click(); pg.wait_for_timeout(1500)
    R['pma_etape_notee'] = demo(pg, "s => (s.tables.pma_logs || []).some(l => l.kind === 'retrieval')") and 'Ponction' in T(pg)
    shot(pg, 'six-pma')

    # ---- 3. rappels partagés : un rappel partagé par un autre membre du foyer apparaît (lecture seule)
    patch(pg, f"""s => {{
      s.tables.household_members.push({{ household_id: '{hid}', user_id: 'demo-partner-six', role: 'coparent', can_view: ['daily','health','lists','profile'], can_edit: ['daily','lists'], joined_at: new Date().toISOString() }});
      s.tables.reminders.push({{ id: 'six-shared-1', user_id: 'demo-partner-six', household_id: '{hid}', category: 'custom', title: 'Injection de 20 h', body: null, schedule: {{ type: 'daily', hour: 20, minute: 0 }}, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: null, shared: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }});
    }}""")
    pg.reload(); pg.wait_for_timeout(2500)
    go(pg, '/settings/reminders', 2800)
    R['rappels_partages_visibles'] = tid(pg, 'rem-shared-list').is_visible() and 'Injection de 20 h' in T(pg)
    pg.locator('[data-testid="reminder-new"]').filter(visible=True).first.click(); pg.wait_for_timeout(900)
    R['rappels_option_partager'] = tid(pg, 'rem-share-row').is_visible()
    tid(pg, 'rem-title').fill('Rappel partagé test'); pg.wait_for_timeout(200)
    tid(pg, 'rem-share-row').locator('[role="switch"]').first.click(); pg.wait_for_timeout(300)
    pg.get_by_role('button', name='Créer le rappel').first.click(); pg.wait_for_timeout(2000)
    R['rappels_partage_enregistre'] = demo(pg, "s => s.tables.reminders.some(r => r.title === 'Rappel partagé test' && r.shared === true && r.user_id === s.session.userId)")
    shot(pg, 'six-rappels')

    # ---- 4. alertes produits rappelés
    go(pg, '/scanner/recalls')
    R['rappels_produits_ouvre'] = ok_screen(pg) and 'Alertes produits rappelés' in T(pg)
    R['rappels_produits_option_foyer'] = tid(pg, 'rc-share').is_visible()
    tid(pg, 'rc-share').locator('[role="switch"]').first.click(); pg.wait_for_timeout(1500)
    R['rappels_produits_foyer_active'] = demo(pg, "s => (s.tables.recall_watch_prefs || []).some(p => p.share_household === true)")
    tid(pg, 'rc-check').click(); pg.wait_for_timeout(2500)
    R['rappels_produits_verifier_sans_plantage'] = ok_screen(pg)
    shot(pg, 'six-rappels-produits')

    # ---- 5. routines en pictogrammes
    go(pg, '/family/kid-routines')
    R['routines_ouvre'] = ok_screen(pg) and 'Routines en images' in T(pg)
    tid(pg, 'kr-new').click(); pg.wait_for_timeout(800)
    tid(pg, 'kr-moment-morning').click(); pg.wait_for_timeout(200)
    tid(pg, 'kr-add-hand-wash').click(); pg.wait_for_timeout(200)
    tid(pg, 'kr-save').click(); pg.wait_for_timeout(1800)
    rid = demo(pg, "s => (s.tables.kid_routines || [])[0] && s.tables.kid_routines[0].id")
    n = demo(pg, "s => (s.tables.kid_routines || [])[0].steps.length")
    R['routine_creee_avec_etapes'] = bool(rid) and n == 8
    shot(pg, 'six-routines')
    tid(pg, f'kr-open-{rid}').click(); pg.wait_for_timeout(2200)
    R['mode_enfant_ouvre'] = tid(pg, 'kid-mode').is_visible() and f'0 / {n}' in T(pg)
    for i in range(n):
        tid(pg, f'kid-step-{i}').click(); pg.wait_for_timeout(500)
    pg.wait_for_timeout(800)
    R['mode_enfant_bravo'] = tid(pg, 'kid-bravo').is_visible() and demo(pg, f"s => (s.tables.kid_routine_checks || []).filter(c => c.routine_id === '{rid}').length") == n
    shot(pg, 'six-mode-enfant')
    tid(pg, 'kid-step-0').click(); pg.wait_for_timeout(900)
    R['mode_enfant_decocher'] = f'{n - 1} / {n}' in T(pg)
    tid(pg, 'kid-exit').click(); pg.wait_for_timeout(600)
    R['mode_enfant_appui_simple_ne_quitte_pas'] = tid(pg, 'kid-mode').is_visible()

    # ---- 6. garde alternée
    go(pg, '/family/custody')
    R['garde_ouvre_vide'] = ok_screen(pg) and 'Aucun rythme de garde' in T(pg)
    pg.get_by_role('button', name='Nouveau rythme').first.click(); pg.wait_for_timeout(800)
    tid(pg, 'cu-a').fill('Chez maman'); tid(pg, 'cu-b').fill('Chez papa')
    tid(pg, 'cu-pattern-week').click()
    tid(pg, 'cu-save').click(); pg.wait_for_timeout(2000)
    R['garde_rythme_cree'] = demo(pg, "s => (s.tables.custody_plans || []).some(p => p.cycle === 'AAAAAAABBBBBBB')")
    R['garde_aujourdhui'] = tid(pg, 'cu-today').is_visible() and ('Chez maman' in tid(pg, 'cu-today').inner_text())
    R['garde_calendrier_28_jours'] = pg.locator('[data-testid^="cu-day-"]').count() == 28
    R['garde_prochaine_passation'] = 'Prochaine passation' in T(pg) and 'Chez papa' in tid(pg, 'cu-today').inner_text()
    shot(pg, 'six-garde')

    # ---- catalogue : les nouveaux outils sont déclarés et s'ouvrent depuis leur adresse
    for path in ['/fertility/pma', '/bottle/scoops', '/scanner/recalls', '/family/kid-routines', '/family/custody']:
        go(pg, path, 1600)
        R[f'route_{path.strip("/").replace("/", "_")}'] = ok_screen(pg)
    b.close()


if __name__ == '__main__':
    try:
        with sync_playwright() as p:
            run(p)
    finally:
        R['erreurs'] = errs[:20]
        print(json.dumps(R, ensure_ascii=False, indent=1))
