"""
Audit 06 « Outils de suivi et résultats » — démo web, horloge simulée, trois fuseaux.
Les jeux de données sont ceux de src/__tests__/fixtures/auditSuivi.ts (résultats calculés à la main) :
  A. Biberons d'une semaine (Paris, « maintenant » = dim. 15/11/2026 20 h) : tuiles Aujourd'hui = 2 biberons / 240 ml,
     7 jours = 7 biberons / 700 ml ; rechargement : mêmes chiffres ; historique : jour sans biberon → état explicite.
  B. Onglet Suivi, graphique « Lait bu par jour (ml) » : vendredi 13 = 0 ml (180 ml PRÉPARÉS, quantité bue non notée).
  C. Fuseaux : New York → tuile du jour = 1 biberon / 130 ml ; Auckland (déjà le 16) → aucun biberon aujourd'hui.
  D. Grossesse : terme 01/01/2027, le 13/11/2026 → « 34 SA ».
  E. Poids de grossesse à New York : mesures du 01/03 et du 01/04 → l'axe affiche « 1 mars » (pas « 28 févr. »).
  F. Tétée : chronomètre démarré, horloge avancée de 5 min SANS que les minuteurs JavaScript tournent (arrière-plan),
     « Arrêter et enregistrer » aussitôt → durée enregistrée ≈ 5 min (et non la dernière valeur affichée).
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit6/dist
  python3 e2e/spa_server.py /tmp/audit6/dist 8976 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8976 python3 e2e/audit_suivi.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON, SET_BODY  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8976')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/audit6/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

NOW_BOTTLES = '2026-11-15T19:00:00Z'   # dimanche 15/11/2026, 20 h à Paris
NOW_PREG = '2026-11-13T11:00:00Z'      # vendredi 13/11/2026, midi à Paris
# Jeu « BOTTLES_WEEK » (mêmes instants que la fixture Jest)
BOTTLES = [
    ('b1', '2026-11-09T08:00:00+01:00', 150, 120), ('b2', '2026-11-09T12:00:00+01:00', 150, 150),
    ('b3', '2026-11-11T09:00:00+01:00', 120, 90), ('b4', '2026-11-13T10:00:00+01:00', 180, None),
    ('b5', '2026-11-14T23:50:00+01:00', 120, 100), ('b6', '2026-11-15T00:10:00+01:00', 120, 110),
    ('b7', '2026-11-15T07:00:00+01:00', 150, 130),
]

SEED_BOTTLES = """(rows) => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1'));
  const kids = s.tables.children; const me = s.session.userId;
  s.tables.bottles = [];
  for (const c of kids) for (const [id, at, prep, cons] of rows) s.tables.bottles.push({ id: 'audit-' + id + '-' + c.id, child_id: c.id, household_id: c.household_id,
    at: new Date(at).toISOString(), prepared_ml: prep, consumed_ml: cons, milk_type: null, note: null, planned_next_ml: null, in_progress: false,
    started_at: null, ended_at: null, paused_at: null, paused_seconds: 0, created_by: me, created_at: new Date(at).toISOString(), updated_at: new Date(at).toISOString() });
  s.tables.bottle_timers = [];
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""

SEED_PREGNANCY = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  const p = (s.tables.pregnancies || []).find((x) => x.status === 'active');
  if (!p) return null;
  p.due_date = '2027-01-01'; p.lmp_date = '2026-03-20';
  s.tables.maternal_weights = [
    { id: 'audit-w1', user_id: me, pregnancy_id: p.id, measured_on: '2026-03-01', weight_kg: 61.2, note: null, professional_note: null, created_at: '2026-03-01T09:00:00Z' },
    { id: 'audit-w2', user_id: me, pregnancy_id: p.id, measured_on: '2026-04-01', weight_kg: 62.4, note: null, professional_note: null, created_at: '2026-04-01T09:00:00Z' },
  ];
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
  return p.id;
}"""


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def shot(pg, name):
    pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def label(pg, t):
    loc = tid(pg, t)
    return (loc.get_attribute('aria-label') or loc.inner_text()) if loc.count() else ''


def nums(txt):
    return [int(x) for x in re.findall(r'\d+', (txt or '').replace(' ', '').replace(' ', ''))]


def new_page(b, tz, now):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id=tz)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(f'[{tz}] ' + m.text[:200]))
    pg.on('pageerror', lambda e: errs.append(f'[{tz}] PAGE ' + str(e)[:200]))
    pg.clock.install(time=now)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON)
    return ctx, pg


def lina_of(pg):
    return next(c for c in state(pg)['tables']['children'] if c['first_name'] == 'Lina')['id']


def bottle_tiles(pg, lina, period):
    pg.goto(f'{B}/bottle/{lina}'); pg.wait_for_timeout(2500)
    if period == 'week':
        tid(pg, 'bottle-stats-week').click(); pg.wait_for_timeout(800)
    return label(pg, 'bottle-stats-count'), label(pg, 'bottle-stats-ml')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)

    # ---------------------------------------------------------------- A. Paris : tuiles, rechargement, historique
    ctx, pg = new_page(b, 'Europe/Paris', NOW_BOTTLES)
    lina = lina_of(pg)
    pg.evaluate(SEED_BOTTLES, BOTTLES)
    c_day, m_day = bottle_tiles(pg, lina, 'day')
    R['A_jour_2_biberons_240_ml'] = 2 in nums(c_day) and 240 in nums(m_day)
    shot(pg, 'A1-jour')
    c_wk, m_wk = bottle_tiles(pg, lina, 'week')
    R['A_semaine_7_biberons_700_ml'] = 7 in nums(c_wk) and 700 in nums(m_wk) and 880 not in nums(m_wk)
    shot(pg, 'A2-semaine')
    pg.reload(); pg.wait_for_timeout(3000)
    c_day2, m_day2 = label(pg, 'bottle-stats-count'), label(pg, 'bottle-stats-ml')
    R['A_rechargement_memes_chiffres'] = (2 in nums(c_day2) and 240 in nums(m_day2)) or (7 in nums(c_day2) and 700 in nums(m_day2))
    pg.goto(f'{B}/bottle/history?child={lina}'); pg.wait_for_timeout(2500)
    # Jeudi 12 = 3 jours avant aujourd'hui (chips : 0 aujourd'hui, 1 hier, 2 ven. 13, 3 jeu. 12)
    tid(pg, 'bottle-history-day-3').click(); pg.wait_for_timeout(700)
    body = pg.inner_text('body')
    R['A_historique_jour_vide_explicite'] = 'Aucun biberon' in body and pg.locator('[data-testid^="bottle-history-row-"]').filter(visible=True).count() == 0
    shot(pg, 'A3-historique-jour-vide')
    tid(pg, 'bottle-history-day-2').click(); pg.wait_for_timeout(700)
    rows13 = pg.locator('[data-testid^="bottle-history-row-"]').filter(visible=True)
    txt13 = ' '.join(rows13.all_inner_texts())
    print('historique vendredi 13 :', txt13)
    R['A_historique_vendredi_1_biberon_prepare_180'] = rows13.count() == 1 and '180' in txt13

    # ---------------------------------------------------------------- B. Onglet Suivi : graphique « Lait bu par jour »
    # Profil affiché dans l'onglet Suivi : Lina (et non la grossesse de la démo)
    pg.evaluate("""(id) => { const raw = localStorage.getItem('toietmoi.ui'); const v = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      v.state = { ...(v.state || {}), subject: { type: 'child', id } }; localStorage.setItem('toietmoi.ui', JSON.stringify(v)); }""", lina)
    pg.goto(B + '/track'); pg.wait_for_timeout(3500)
    pg.mouse.wheel(0, 2500); pg.wait_for_timeout(800)
    chart = pg.locator('[aria-label^="Quantité de lait bue par jour"]').first
    lab = chart.get_attribute('aria-label') if chart.count() else ''
    print('graphique lait :', lab, '| url :', pg.url)
    pairs = dict(re.findall(r'(\w+) : (\d+) ml', lab or ''))
    R['B_graphique_lait_bu_vendredi_0'] = pairs.get('ven') == '0' and pairs.get('lun') == '270' and pairs.get('dim') == '240'
    shot(pg, 'B-suivi-graphique')
    ctx.close()

    # ---------------------------------------------------------------- C. Autres fuseaux : la journée est celle du fuseau
    ctx, pg = new_page(b, 'America/New_York', NOW_BOTTLES)
    lina = lina_of(pg); pg.evaluate(SEED_BOTTLES, BOTTLES)
    c_ny, m_ny = bottle_tiles(pg, lina, 'day')
    R['C_new_york_1_biberon_130_ml'] = 1 in nums(c_ny) and 130 in nums(m_ny)
    shot(pg, 'C1-new-york')
    ctx.close()
    ctx, pg = new_page(b, 'Pacific/Auckland', NOW_BOTTLES)
    lina = lina_of(pg); pg.evaluate(SEED_BOTTLES, BOTTLES)
    c_akl, m_akl = bottle_tiles(pg, lina, 'day')
    R['C_auckland_jour_vide'] = not any(n > 0 for n in nums(c_akl) + nums(m_akl))
    shot(pg, 'C2-auckland')
    ctx.close()

    # ---------------------------------------------------------------- D/E. Grossesse : SA, puis poids à New York
    ctx, pg = new_page(b, 'Europe/Paris', NOW_PREG)
    pid = pg.evaluate(SEED_PREGNANCY)
    pg.evaluate(SET_BODY, ['pregnancy', False])
    pg.goto(B + '/pregnancy'); pg.wait_for_timeout(3500)
    R['D_grossesse_34_SA'] = bool(pid) and '34 SA' in pg.inner_text('body')
    shot(pg, 'D-grossesse')
    ctx.close()
    ctx, pg = new_page(b, 'America/New_York', NOW_PREG)
    pg.evaluate(SEED_PREGNANCY); pg.evaluate(SET_BODY, ['pregnancy', False])
    pg.goto(B + '/pregnancy/weight'); pg.wait_for_timeout(3500)
    svg_txt = pg.evaluate("() => [...document.querySelectorAll('svg text')].map((t) => t.textContent).join(' | ')")
    print('axe du poids :', svg_txt)
    R['E_poids_axe_1_mars_new_york'] = '1 mars' in svg_txt and '28 févr.' not in svg_txt and '1 avr.' in svg_txt
    R['E_poids_derniere_mesure'] = '62,4 kg' in pg.inner_text('body')
    shot(pg, 'E-poids-new-york')
    ctx.close()

    # ---------------------------------------------------------------- F. Tétée : arrêt juste après un retour d'arrière-plan
    ctx, pg = new_page(b, 'Europe/Paris', NOW_BOTTLES)
    lina = lina_of(pg)
    pg.goto(f'{B}/track/breastfeed?child={lina}'); pg.wait_for_timeout(3000)
    before = len(state(pg)['tables'].get('breastfeeds') or [])
    pg.get_by_text('Démarrer le chronomètre').first.click(); pg.wait_for_timeout(1500)
    t0 = pg.evaluate('() => Date.now()')
    pg.clock.pause_at((t0 + 500) / 1000)          # minuteurs à l'arrêt (application en arrière-plan)
    pg.clock.set_system_time((t0 + 300_000) / 1000)  # + 5 min à l'horloge, sans tic d'affichage
    pg.get_by_text('Arrêter et enregistrer').first.click(); pg.wait_for_timeout(300)
    pg.clock.resume(); pg.wait_for_timeout(2500)
    feeds = sorted(state(pg)['tables'].get('breastfeeds') or [], key=lambda f: f.get('created_at') or f['started_at'])
    last = feeds[-1] if len(feeds) > before else None
    dur = None
    if last and last.get('ended_at'):
        from datetime import datetime
        f = lambda s: datetime.fromisoformat(s.replace('Z', '+00:00'))
        dur = (f(last['ended_at']) - f(last['started_at'])).total_seconds()
    R['F_tetee_duree_5_min_apres_arriere_plan'] = dur is not None and 295 <= dur <= 310
    R['F_tetee_duree_observee_s'] = dur is not None  # valeur détaillée ci-dessous
    print('durée tétée enregistrée (s) :', dur)
    shot(pg, 'F-tetee')
    ctx.close()
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
ok = all(R.values()) and not errs
print('VERT' if ok else 'ROUGE')
sys.exit(0 if ok else 1)
