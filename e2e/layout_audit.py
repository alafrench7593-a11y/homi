"""
Audit automatique de mise en page sur TOUTES les pages : débordements horizontaux, textes coupés, boutons dont le libellé
sort, éléments hors de l'écran. Version web de démonstration :
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/layout_audit.py [--quick]
Configurations : 320×568 et 390×844, français et anglais, thème clair ; 390×844 sombre (+ mouvement réduit).
Le rapport JSON liste chaque problème (page, configuration, type, texte). Un rapport vide = aucun problème détecté.

Limites (dites dans le rapport final) : le web ne reproduit ni l'agrandissement de la police du système (iOS/Android),
ni le clavier logiciel ; la troncature volontaire (« … » avec accès au contenu complet) est signalée à part.
"""
import json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import ensure  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
QUICK = '--quick' in sys.argv
ROUTES = ['/', '/track', '/tools', '/community', '/ask', '/profile', '/me', '/me/mood', '/me/sleep', '/cycle', '/fertility', '/fertility/body',
          '/fertility/calendar', '/fertility/compatible', '/fertility/consultation', '/fertility/exams', '/fertility/history', '/fertility/intimacy',
          '/fertility/log', '/fertility/mucus', '/fertility/reminders', '/fertility/understand', '/contraception', '/contraception/consultation',
          '/contraception/emergency', '/contraception/history', '/contraception/log', '/contraception/methods', '/contraception/reminders',
          '/documents', '/documents/scan', '/documents/book', '/documents/export', '/calendar', '/journal', '/journeys', '/library', '/lists',
          '/names', '/notifications', '/emergency', '/family', '/family/nights', '/family/me-time', '/family/routines', '/family/review',
          '/family/history', '/family/difficult', '/family/urgent', '/postpartum', '/postpartum/checkin', '/postpartum/history', '/postpartum/support',
          '/postpartum/understand', '/postpartum/sharing', '/postpartum/partner', '/pregnancy', '/pregnancy/weight', '/pregnancy/feel', '/nearby', '/outings', '/outings?view=list', '/sleep/help/:lina', '/sleep/difficult/:lina', '/child/:lina/discoveries', '/child/:lina/grow', '/child/:noe/grow', '/child/:noe/discoveries', '/pregnancy/calendar', '/pregnancy/eat', '/scanner', '/scanner/food',
          '/scanner/product', '/scanner/history', '/scanner/avoid', '/scanner/compare', '/settings', '/settings/account', '/settings/family',
          '/settings/home', '/settings/language', '/settings/privacy', '/settings/reminders', '/settings/subscription', '/settings/sync',
          '/teeth', '/bottle', '/bottle/history', '/meals', '/meals/menu', '/meals/shopping', '/meals/pantry', '/meals/new', '/meals/settings', '/meals/fa-gratin-dauphinois', '/meals/puree-carotte-pomme-de-terre', '/sleep/:noe', '/sleep/:lina', '/sleep/:lina?tab=profile', '/sleep/:lina?tab=alerts', '/sleep/:lina?tab=trends', '/sleep/:lina?tab=safety', '/sleep/tonight', '/summary', '/summary?period=week', '/summary?family=1', '/admin/recipes', '/pregnancy/start', '/pregnancy/end', '/postpartum/recovery', '/journeys/blocked',
          '/child/:noe?tab=besoins', '/child/:noe/needs', '/child/:noe/needs?tab=treatments', '/child/:noe/needs?tab=follow', '/child/:noe/school', '/journeys/:arch', '/assistant/chat', '/community/new', '/community/profile', '/community/saved', '/moi', '/moi?tab=account', '/community/u/papadenour', '/community/u/clem_2026', '/community/rules', '/community/notifications', '/community/blocked', '/community?mode=recent', '/community?mode=following', '/community/groups', '/community/albums', '/community/events', '/community/activity', '/community/following', '/today', '/today?moment=evening', '/profiles/new', '/night', '/night/help?child=:noe', '/child/:noe/vaccines', '/library?cat=sexualite', '/article/rapports-pendant-la-grossesse-faq',
          '/cycle?all=1', '/cycle/calendar', '/cycle/symptoms', '/cycle/discharge', '/cycle/discharge/new', '/cycle/guides', '/cycle/guides/clear-fluid',
          '/cycle/guides/itching', '/cycle/bleeding', '/cycle/journal', '/cycle/stats', '/cycle/export', '/cycle/privacy', '/cycle/emergency', '/cycle/home-card',
          '/cycle/intimacy', '/cycle/pain', '/cycle/advice', '/cycle/risk', '/cycle/professional?reason=sex_risk',
          '/cycle/recap?type=sex&id=seed-sex', '/cycle/recap?type=pain&id=seed-pain', '/cycle/recap?type=discharge&id=seed-dis']

# Données de démonstration supplémentaires pour que les écrans de conseils aient du contenu (textes les plus longs)
SEED = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = (s.tables.profiles || [])[0]?.id;
  const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  s.tables.pregnancies = [];
  s.tables.cycle_preferences = [{ user_id: me, track_intercourse: true, hide_on_home: false, advice_enabled: true, detailed_notifications: false }];
  s.tables.intercourse_logs = [{ id: 'seed-sex', user_id: me, occurred_on: d(1), condom: 'yes', condom_incident: 'broke', pregnancy_wish: 'no', note: null, created_at: new Date().toISOString() }];
  s.tables.symptom_logs = [...(s.tables.symptom_logs || []), { id: 'seed-pain', user_id: me, logged_on: d(0), symptoms: [], symptom_keys: [], intensities: {}, pain_intensity: 8, pain_locations: ['lower_abdomen', 'lower_back'], pain_impact: ['work', 'sleep'], pain_associated: ['nausea'], pain_pattern: 'worse', pain_relief: 'not_helped' }];
  s.tables.discharge_logs = [{ id: 'seed-dis', user_id: me, observed_at: new Date().toISOString(), amount: 'heavy', color: 'greenish', textures: ['lumpy'], odor: 'unpleasant', symptoms: ['itching', 'burning', 'urinary'], note: null }];
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""
PUBLIC = ['/welcome', '/intro', '/auth/sign-in', '/auth/sign-up', '/auth/forgot']

# Détecteur exécuté dans la page : ne regarde que les éléments réellement visibles de l'écran actif
DETECT = r"""() => {
  const W = window.innerWidth, out = [];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0' || e.getAttribute('aria-hidden') === 'true') return false;
      if (cs.pointerEvents === 'none' && e.getAttribute('data-testid') === 'inactive') return false;
    }
    return true;
  };
  // conteneurs défilant horizontalement (listes de puces, carrousels) : un élément peut légitimement en dépasser
  const inHScroll = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1) return true; } return false; };
  const label = (el) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (document.documentElement.scrollWidth > W + 1) out.push({ kind: 'page_horizontal_scroll', text: String(document.documentElement.scrollWidth) });
  // 1. Texte coupé : contenu plus large/haut que sa boîte sans défilement, ou troncature
  for (const el of document.querySelectorAll('div[dir="auto"], span[dir="auto"]')) {
    if (!visible(el) || !el.innerText.trim()) continue;
    const cs = getComputedStyle(el);
    const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    const ellipsis = cs.textOverflow === 'ellipsis';
    if ((clamp || ellipsis) && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)) { out.push({ kind: el.closest('[data-truncate="intentional"]') ? 'intentional_truncation' : 'truncated', text: label(el) }); continue; }
    if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') out.push({ kind: 'text_overflow_x', text: label(el) });
    const r = el.getBoundingClientRect();
    if (!inHScroll(el) && (r.right > W + 1 || r.left < -1)) out.push({ kind: 'text_off_screen', text: label(el), x: Math.round(r.left), r: Math.round(r.right) });
  }
  // 2. Boutons : le libellé doit rester dans le bouton
  for (const b of document.querySelectorAll('[role="button"], button, [role="tab"]')) {
    if (!visible(b)) continue;
    const br = b.getBoundingClientRect();
    if (!inHScroll(b) && (br.right > W + 1 || br.left < -1)) out.push({ kind: 'button_off_screen', text: label(b), x: Math.round(br.left), r: Math.round(br.right) });
    for (const t of b.querySelectorAll('div[dir="auto"]')) {
      if (!visible(t)) continue;
      const tr = t.getBoundingClientRect();
      if (tr.right > br.right + 2 || tr.left < br.left - 2 || tr.bottom > br.bottom + 2 || tr.top < br.top - 2) { out.push({ kind: 'button_label_outside', text: label(t) }); break; }
    }
  }
  // 3. Textes qui se chevauchent (deux libellés visibles l'un sur l'autre, hors décor en position absolue)
  const leaves = [...document.querySelectorAll('div[dir="auto"]')].filter((el) => visible(el) && el.innerText.trim() && !el.querySelector('div[dir="auto"]') && !inHScroll(el));
  const absolute = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { if (getComputedStyle(e).position === 'absolute' || getComputedStyle(e).position === 'fixed') return true; } return false; };
  const rects = leaves.filter((el) => !absolute(el)).map((el) => [el, el.getBoundingClientRect()]).filter(([, r]) => r.bottom > 0 && r.top < window.innerHeight * 3);
  for (let i = 0; i < rects.length && i < 400; i++) for (let j = i + 1; j < rects.length && j < 400; j++) {
    const [a, ra] = rects[i], [b2, rb] = rects[j];
    if (a.contains(b2) || b2.contains(a)) continue;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 4 && oy > 4) out.push({ kind: 'text_overlap', text: label(a) + ' ⟂ ' + label(b2) });
  }
  // dédoublonnage
  const seen = new Set();
  return out.filter((o) => { const k = o.kind + o.text; if (seen.has(k)) return false; seen.add(k); return true; });
}"""

CONFIGS = [
    {'name': '320-fr', 'vp': (320, 568), 'locale': 'fr-FR', 'scheme': 'light'},
    {'name': '390-en', 'vp': (390, 844), 'locale': 'en-GB', 'scheme': 'light'},
    {'name': '390-fr-sombre', 'vp': (390, 844), 'locale': 'fr-FR', 'scheme': 'dark'},
    {'name': '320-en', 'vp': (320, 568), 'locale': 'en-GB', 'scheme': 'light'},
    # Tablette et ordinateur : sans le cadre « téléphone » de la version web (rendu pleine largeur, comme une tablette)
    {'name': '820-fr-tablette', 'vp': (820, 1180), 'locale': 'fr-FR', 'scheme': 'light', 'noframe': True},
    {'name': '1280-fr-ordinateur', 'vp': (1280, 800), 'locale': 'fr-FR', 'scheme': 'dark', 'noframe': True},
]
if QUICK:
    CONFIGS = CONFIGS[:1]
ROUTES += [r for r in ['/meals/rankings', '/products', '/products/compare', '/sources', '/admin/products', '/admin/resources', '/admin/import-recipes'] if r not in ROUTES]  # nutrition 0–10 ans, produits, sources
if os.environ.get('AUDIT_ONLY'):  # seulement certains écrans (séparés par des virgules)
    ROUTES = [r for r in ROUTES if r in os.environ['AUDIT_ONLY'].split(',')]
if os.environ.get('AUDIT_CFG'):  # une configuration par processus (exécution en parallèle)
    CONFIGS = [CONFIGS[int(os.environ['AUDIT_CFG'])]]

report, errors = {}, []
with sync_playwright() as p:
    b = p.chromium.launch()
    for cfg in CONFIGS:
        ctx = b.new_context(viewport={'width': cfg['vp'][0], 'height': cfg['vp'][1]}, locale=cfg['locale'], color_scheme=cfg['scheme'], reduced_motion='reduce')
        if cfg.get('noframe'):
            ctx.add_init_script("try { localStorage.setItem('toietmoi.frame', 'off') } catch (e) {}")
        pg = ctx.new_page()
        pg.on('pageerror', lambda e, c=cfg['name']: errors.append(f"{c} {str(e)[:160]}"))
        # Pages publiques (avant connexion)
        for r in PUBLIC:
            pg.goto(B + r); pg.wait_for_timeout(1800)
            found = pg.evaluate(DETECT)
            if found: report.setdefault(r, {})[cfg['name']] = found
        pg.goto(B + '/welcome'); pg.wait_for_timeout(2000)
        pg.get_by_text('Découvrir sans compte' if cfg['locale'].startswith('fr') else 'Try it without an account').first.click(); pg.wait_for_timeout(4000)
        seeded = False
        jstate = {}
        for r in ROUTES:
            ensure(pg, r, jstate)  # parcours voulu pour les écrans propres à un parcours (garde d'accès)
            if not seeded and (r.startswith('/cycle/') or r == '/cycle?all=1'):
                pg.evaluate(SEED); seeded = True  # données du cycle seulement pour les derniers écrans (les autres gardent la démo)
            if ':noe' in r or ':arch' in r or ':lina' in r:
                ids = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return [s.tables.children.find(c => c.first_name === 'Noé')?.id, (s.tables.user_journeys || []).find(j => j.status === 'archived')?.id || (s.tables.user_journeys || [])[0]?.id, s.tables.children.find(c => c.first_name === 'Lina')?.id]; }")
                r_go = r.replace(':noe', ids[0] or 'x').replace(':arch', ids[1] or 'x').replace(':lina', ids[2] or 'x')
            else:
                r_go = r
            pg.goto(B + r_go); pg.wait_for_timeout(1700)
            try:
                pg.mouse.wheel(0, 2000); pg.wait_for_timeout(300)  # contenu du bas aussi rendu
                found = pg.evaluate(DETECT)
            except Exception as e:  # noqa: BLE001
                found = [{'kind': 'audit_error', 'text': str(e)[:120]}]
            if found: report.setdefault(r, {})[cfg['name']] = found
        ctx.close()
    b.close()

summary = {}
for r, cfgs in report.items():
    for c, items in cfgs.items():
        for it in items: summary[it['kind']] = summary.get(it['kind'], 0) + 1
print(json.dumps({'pages': len(ROUTES) + len(PUBLIC), 'configurations': [c['name'] for c in CONFIGS], 'totaux': summary, 'problemes': report, 'erreurs': errors}, ensure_ascii=False, indent=1))
