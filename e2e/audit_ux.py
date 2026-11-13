"""
Audit 09 — UX, accessibilité et mouvement (démo web, petit écran 320 × 568). Rejouable.

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit9/dist
  python3 e2e/spa_server.py /tmp/audit9/dist 8979 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8979 E2E_SHOTS=/tmp/audit9/shots python3 e2e/audit_ux.py

Partie A — débordements (détecteur e2e/audit_ux_detect.js) sur ~30 écrans représentatifs, 5 configurations :
  clair Turquoise texte 1 ; clair Turquoise texte 1,3 ; sombre Crépuscule texte 1,3 ;
  clavier ouvert (fenêtre réduite à 320 × 308 : 568 − 260 px de clavier iPhone SE + barre de suggestions,
  comme le KeyboardAvoidingView « padding » de Screen/Sheet) sombre Turquoise, premier champ focalisé ;
  clavier ouvert + texte 1,3 clair Crépuscule.
  Texte agrandi : simulation fidèle de `fontScale` (min(échelle, maxFontSizeMultiplier) par texte, voir le détecteur).
  Au clavier, le champ focalisé doit rester visible et non recouvert, et la zone qui défile garder ≥ 96 px
  (libellé + champ d'une ligne : en-tête replié, barre d'onglets masquée).
Partie B — accessibilité et mouvement sur des écrans réels : focus clavier visible (Tab) et ordre logique, noms
  accessibles des boutons icône / interrupteurs / choix, « Réduire les animations » (aucun fantôme qui capte les
  clics), Sheet : fermeture par Échap, par le voile et par le bouton, retour arrière possible pendant une transition,
  contraste mesuré en pixels (texte sur verre).
Sortie : JSON { A: {écran: {config: [constats]}}, B: {clé: bool}, erreurs } ; code 1 si un constat bloquant.
`AUDIT_ONLY=/,/me/mood` : seulement ces écrans ; `AUDIT_CFG=0,3` : seulement ces configurations ;
`AUDIT_PART=A|B` : une seule partie.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8979')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/audit9/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
PART = os.environ.get('AUDIT_PART', 'AB')
W, H, KB = 320, 568, 260

INIT = """(() => { try { const p = sessionStorage.getItem('__patch'); if (!p) return; const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); const P = JSON.parse(p); Object.assign(ui.state, P); if (ui.state.appearanceOwner) { ui.state.appearanceByUser = ui.state.appearanceByUser || {}; ui.state.appearanceByUser[ui.state.appearanceOwner] = { theme: P.themePreference, palette: P.palettePreference }; } localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); } catch (e) {} })()"""

PUBLIC = ['/welcome', '/auth/sign-in', '/auth/sign-up', '/auth/forgot']
ROUTES = ['/', '/health', '/baby', '/household', '/community',
          '/family/missions', '/family/missions/new', '/family/stocks', '/family/stocks/new', '/meals/shopping',
          '/me/mood', '/me/mood#choix', '/me/diary', '/scanner', '/scanner/product', '/scanner/product#inconnu', '/scanner/history',
          '/bottle', '/bottle/history', '/settings', '/settings/appearance', '/settings/account', '/settings/notifications',
          '/onboarding', '/today', '/notifications', '/calendar', '/me', '/family']
# Étapes d'interaction (après chargement) pour atteindre l'état décrit dans les captures des pilotes
STEPS = {
    '/me/mood#choix': ['mood-4'],
    '/scanner/product#inconnu': ['@fill:scan-query:4006381333931', 'scan-search'],
}
CONFIGS = [
    {'name': 'clair-turquoise-1', 'theme': 'light', 'palette': 'turquoise', 'scale': 1.0, 'kb': False},
    {'name': 'clair-turquoise-1.3', 'theme': 'light', 'palette': 'turquoise', 'scale': 1.3, 'kb': False},
    {'name': 'sombre-crepuscule-1.3', 'theme': 'dark', 'palette': 'crepuscule', 'scale': 1.3, 'kb': False},
    {'name': 'clavier-sombre-turquoise-1', 'theme': 'dark', 'palette': 'turquoise', 'scale': 1.0, 'kb': True},
    {'name': 'clavier-clair-crepuscule-1.3', 'theme': 'light', 'palette': 'crepuscule', 'scale': 1.3, 'kb': True},
]
if os.environ.get('AUDIT_ONLY'):
    keep = os.environ['AUDIT_ONLY'].split(',')
    ROUTES = [r for r in ROUTES if r in keep]
    PUBLIC = [r for r in PUBLIC if r in keep]
if os.environ.get('AUDIT_CFG'):
    CONFIGS = [CONFIGS[int(i)] for i in os.environ['AUDIT_CFG'].split(',')]
# Constats qui font échouer la suite (les autres sont rapportés : troncature volontaire, cible tactile à revoir)
BLOCKING = {'texte_hors_ecran', 'texte_rogne', 'texte_deborde_sa_boite', 'texte_tronque', 'mot_coupe', 'libelle_hors_bouton', 'bouton_hors_ecran',
            'bouton_principal_2_lignes', 'champ_masque', 'zone_saisie_etroite', 'cible_tactile_trop_petite'}

R_A, R_B, errs = {}, {}, []

FOCUS_FIRST_FIELD = """() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(e).visibility !== 'hidden'; };
  const f = [...document.querySelectorAll('input:not([type=hidden]):not([readonly]), textarea')].filter(vis)[0];
  if (!f) return false; f.focus(); return true; }"""
# Champ focalisé : visible en entier, non recouvert (point central), zone qui défile assez haute
FIELD_CHECK = """() => {
  const out = []; const H = window.innerHeight; const f = document.activeElement;
  if (!f || !(f.tagName === 'INPUT' || f.tagName === 'TEXTAREA')) return out;
  const r = f.getBoundingClientRect();
  const cx = Math.min(window.innerWidth - 1, Math.max(0, r.left + Math.min(r.width / 2, 40))), cy = r.top + Math.min(r.height / 2, 14);
  const hit = cy >= 0 && cy < H ? document.elementFromPoint(cx, cy) : null;
  // rognage par un ancêtre (zone qui défile trop basse : le champ n'apparaît que sur quelques pixels)
  let visTop = Math.max(0, r.top), visBot = Math.min(H, r.bottom);
  for (let e = f.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowY !== 'visible') { const c = e.getBoundingClientRect(); visTop = Math.max(visTop, c.top); visBot = Math.min(visBot, c.bottom); } }
  const need = Math.min(r.height, 40);
  if (visBot - visTop < need - 1 || !hit || !(hit === f || f.contains(hit) || hit.contains(f)))
    out.push({ kind: 'champ_masque', text: (f.getAttribute('aria-label') || f.placeholder || '').slice(0, 60), visible: Math.round(visBot - visTop), y: Math.round(r.top) });
  const sc = [...document.querySelectorAll('[data-testid="screen-scroll"]')].filter((e) => e.contains(f))[0];
  if (sc) { const s = sc.getBoundingClientRect(); const h = Math.min(H, s.bottom) - Math.max(0, s.top); if (h < 96) out.push({ kind: 'zone_saisie_etroite', text: Math.round(h) + ' px sur ' + H }); }
  return out; }"""


# Navigation DANS l'application (history.pushState + popstate, comme un lien) : un rechargement complet de la démo
# renvoie actuellement vers /welcome (session de démonstration non relue au démarrage — signalé, zone auth)
NAV = "(p) => { window.history.pushState(null, '', p); window.dispatchEvent(new PopStateEvent('popstate', { state: null })); }"


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def run_steps(pg, route):
    for s in STEPS.get(route, []):
        if s.startswith('@fill:'):
            _, t, v = s.split(':', 2)
            loc = tid(pg, t)
            if loc.count():
                loc.fill(v)
        else:
            loc = tid(pg, s)
            if loc.count():
                loc.click()
        pg.wait_for_timeout(900)


def detect(pg, scale):
    if scale != 1:
        for _ in range(3):
            pg.evaluate('(k) => window.__homiTextScale(k)', scale); pg.wait_for_timeout(250)
    return pg.evaluate('() => window.__homiDetect()')


def enter_demo(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4200)
    pg.evaluate(PREMIUM_ON)
    # Premium relu au démarrage : rechargement de l'Accueil (la session de démo y est conservée)
    pg.reload(); pg.wait_for_timeout(3500)


def new_ctx(b, cfg, reduced=False):
    ctx = b.new_context(viewport={'width': W, 'height': H}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2,
                        reduced_motion='reduce' if reduced else 'no-preference')
    ctx.add_init_script(INIT)
    ctx.add_init_script(DETECT_JS)
    # Taille de texte : police racine du navigateur (lue par l'application pour ses choix de mise en page,
    # src/theme/fontScale.ts) + agrandissement de chaque texte par le détecteur (plafonds data-fsmax)
    if cfg.get('scale', 1) != 1:
        ctx.add_init_script("(() => { const set = () => { if (document.documentElement) document.documentElement.style.fontSize = '%spx'; else setTimeout(set, 0); }; set(); })()" % (16 * cfg['scale']))
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f"{cfg['name']} {str(e)[:160]}"))
    return ctx, pg


def audit_route(pg, cfg, r, public=False):
    if cfg['kb']:
        pg.set_viewport_size({'width': W, 'height': H})
    if public:
        pg.goto(B + r.split('#')[0]); pg.wait_for_timeout(2000)
    else:
        pg.evaluate(NAV, r.split('#')[0]); pg.wait_for_timeout(2600)
    run_steps(pg, r)
    found = []
    if cfg['kb']:
        if not pg.evaluate(FOCUS_FIRST_FIELD):
            return None  # écran sans champ : la configuration clavier ne s'applique pas
        pg.set_viewport_size({'width': W, 'height': H - KB}); pg.wait_for_timeout(900)
        pg.evaluate(FOCUS_FIRST_FIELD); pg.wait_for_timeout(700)  # Field fait défiler jusqu'au champ
        if cfg['scale'] != 1:
            pg.evaluate('(k) => window.__homiTextScale(k)', cfg['scale']); pg.wait_for_timeout(400)
            pg.evaluate(FOCUS_FIRST_FIELD); pg.wait_for_timeout(600)
        found += pg.evaluate(FIELD_CHECK)
    found += detect(pg, cfg['scale'])
    if os.environ.get('AUDIT_SHOTS', '1') == '1' and (found or os.environ.get('AUDIT_SHOTS_ALL')):
        pg.screenshot(path=f"{SHOTS}/A-{cfg['name']}-{r.strip('/').replace('/', '_').replace('#', '-') or 'accueil'}.png")
    return found


def part_a(b):
    for cfg in CONFIGS:
        ctx, pg = new_ctx(b, cfg)
        pg.goto(B + '/welcome'); pg.wait_for_timeout(1500)
        pg.evaluate("(p) => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': cfg['theme'], 'palettePreference': cfg['palette']})
        for r in PUBLIC:
            f = audit_route(pg, cfg, r, public=True)
            if f:
                R_A.setdefault(r, {})[cfg['name']] = f
        enter_demo(pg)
        for r in ROUTES:
            try:
                f = audit_route(pg, cfg, r)
            except Exception as e:  # noqa: BLE001
                errs.append(f"{cfg['name']} {r} {str(e)[:160]}"); continue
            if f:
                R_A.setdefault(r, {})[cfg['name']] = f
        ctx.close()


# ---------------------------------------------------------------- Partie B
FOCUS_INFO = """() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  // champ `Field` : son halo (liseré de la couleur principale, voir ui.tsx) remplace l'anneau du navigateur
  const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || (cs.boxShadow && cs.boxShadow !== 'none') || e.getAttribute('data-field') === '1';
  return { name: (e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim().slice(0, 40), role: e.getAttribute('role') || e.tagName.toLowerCase(), x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), ring, inView: r.bottom > 0 && r.top < window.innerHeight }; }"""
UNNAMED = """() => { const out = []; for (const e of document.querySelectorAll('[role=button],[role=switch],[role=radio],[role=checkbox],[role=tab],button,a[href],input,textarea')) {
  const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; let hid = false; for (let p = e; p; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden' || p.getAttribute('aria-hidden') === 'true') { hid = true; break; } } if (hid) continue;
  const name = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || e.getAttribute('title') || '').trim();
  const labelled = e.getAttribute('aria-labelledby');
  if (!name && !labelled) out.push((e.getAttribute('role') || e.tagName) + ' ' + (e.getAttribute('data-testid') || ''));
  const role = e.getAttribute('role');
  if ((role === 'switch' || role === 'checkbox' || role === 'radio') && !e.hasAttribute('aria-checked')) out.push(role + ' sans état ' + (e.getAttribute('data-testid') || name.slice(0, 30)));
} return out; }"""
# Éléments qui CAPTENT les clics sans être visibles (fantôme de morph / voile de Sheet restés en place)
GHOSTS = """() => { const out = []; const W = window.innerWidth, H = window.innerHeight;
  for (const [x, y] of [[W / 2, H / 2], [W / 2, H / 3], [W / 4, H * 0.6], [W * 0.75, H * 0.4]]) {
    const e = document.elementFromPoint(x, y); if (!e) continue;
    let op = 1; for (let p = e; p; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity || '1');
    if (op < 0.05) out.push((e.getAttribute('data-testid') || e.tagName) + ' @' + Math.round(x) + ',' + Math.round(y)); }
  return out; }"""
# Contraste mesuré : couleur du texte (calculée) contre la couleur RÉELLE du fond sous le texte (pixels de la capture)
TEXT_SAMPLES = """() => { const out = []; for (const el of document.querySelectorAll('div[dir="auto"]')) {
  if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
  const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) continue;
  let hid = false, op = 1; for (let p = el; p; p = p.parentElement) { const cs = getComputedStyle(p); op *= parseFloat(cs.opacity || '1'); if (cs.visibility === 'hidden' || cs.display === 'none') hid = true; }
  if (hid || op < 0.9) continue; if (el.closest('[aria-disabled="true"]')) continue;
  // glyphes d'icônes (zone privée Unicode : contraste « non textuel » 3:1, hors de ce contrôle) et textes vides
  const txt = el.innerText.replace(/[\uE000-\uF8FF]|[\uDB80-\uDBFF][\uDC00-\uDFFF]/g, '').trim(); if (!txt) continue;
  // texte recouvert (pied d'écran, voile) : le fond mesuré ne serait pas le sien
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
  const cs = getComputedStyle(el); const m = cs.color.match(/[\\d.]+/g); if (!m) continue;
  out.push({ text: el.innerText.trim().slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height, rgb: m.slice(0, 3).map(Number), a: m[3] ? Number(m[3]) : 1, size: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight) >= 600 || /Bold|SemiBold/i.test(cs.fontFamily) });
  if (out.length > 60) break; } return out; }"""
HIDE_TEXT = """(on) => { let s = document.getElementById('__hidetext'); if (!on) { s && s.remove(); return; } if (!s) { s = document.createElement('style'); s.id = '__hidetext'; document.head.appendChild(s); } s.textContent = 'div[dir=auto],span[dir=auto],input,textarea{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}'; }"""


def lum(c):
    def ch(v):
        v = v / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def ratio(a, b2):
    la, lb = lum(a), lum(b2)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def measure_contrast(pg, tag):
    """Fond réel sous chaque texte (capture sans les glyphes), pire point de la boîte, contre la couleur du texte."""
    from io import BytesIO
    try:
        from PIL import Image
    except ImportError:
        return [{'text': 'PIL absent : contraste non mesuré'}]
    samples = pg.evaluate(TEXT_SAMPLES)
    pg.evaluate(HIDE_TEXT, True); pg.wait_for_timeout(120)
    img = Image.open(BytesIO(pg.screenshot())).convert('RGB')
    pg.evaluate(HIDE_TEXT, False)
    sx = img.width / pg.viewport_size['width']
    bad = []
    for s in samples:
        worst = 99.0
        for fx in (0.1, 0.3, 0.5, 0.7, 0.9):
            for fy in (0.2, 0.5, 0.8):
                px = img.getpixel((min(img.width - 1, int((s['x'] + s['w'] * fx) * sx)), min(img.height - 1, int((s['y'] + s['h'] * fy) * sx))))
                fg = [round(s['rgb'][i] * s['a'] + px[i] * (1 - s['a'])) for i in range(3)]
                worst = min(worst, ratio(fg, px))
        large = s['size'] >= 24 or (s['size'] >= 18.66 and s['bold'])
        need = 3.0 if large else 4.5
        if worst < need:
            bad.append({'ecran': tag, 'text': s['text'], 'ratio': round(worst, 2), 'requis': need})
    return bad


def part_b(b):
    cfg = {'name': 'B'}
    ctx, pg = new_ctx(b, cfg)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(1500)
    pg.evaluate("(p) => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': 'dark', 'palettePreference': 'turquoise'})
    enter_demo(pg)

    # B1. Focus clavier visible et ordre logique (haut → bas, sans saut arrière de plus d'une ligne)
    for r in ['/me/mood', '/settings/appearance', '/family/missions/new']:
        pg.evaluate(NAV, r); pg.wait_for_timeout(2600)
        pg.mouse.click(2, 300)
        seq = []
        for _ in range(14):
            pg.keyboard.press('Tab'); pg.wait_for_timeout(90)
            info = pg.evaluate(FOCUS_INFO)
            if info:
                seq.append(info)
        R_B[f'focus_visible_{r}'] = bool(seq) and all(s['ring'] for s in seq)
        back_jumps = [(a['name'], c['name']) for a, c in zip(seq, seq[1:]) if c['y'] < a['y'] - 60 and not (a['y'] > 400 and c['y'] < 120)]
        R_B[f'info_ordre_focus_{r}'] = len(back_jumps) <= 1
        if not R_B[f'focus_visible_{r}'] or not R_B[f'info_ordre_focus_{r}']:
            R_B[f'detail_focus_{r}'] = [s for s in seq if not s['ring']][:4] or back_jumps[:4]
        pg.screenshot(path=f'{SHOTS}/B-focus-{r.strip("/").replace("/", "_")}.png')

    # B2. Noms accessibles (boutons icône, interrupteurs, choix)
    unnamed = {}
    for r in ['/', '/health', '/baby', '/household', '/me/mood', '/settings', '/settings/appearance', '/settings/notifications', '/family/missions', '/family/stocks', '/scanner', '/bottle']:
        pg.evaluate(NAV, r); pg.wait_for_timeout(2400)
        u = pg.evaluate(UNNAMED)
        if u:
            unnamed[r] = u[:6]
    R_B['noms_accessibles'] = not unnamed
    if unnamed:
        R_B['detail_noms'] = unnamed

    # B3. Sheet : Échap, voile, bouton « Fermer » (feuille de l'humeur ou de l'accueil)
    pg.evaluate(NAV, '/community/albums'); pg.wait_for_timeout(2400)
    R_B.update(sheet_checks(pg))

    # B4. Contraste mesuré (pixels) — 4 combinaisons thème × palette
    bad = []
    for theme, pal in [('light', 'turquoise'), ('dark', 'turquoise'), ('light', 'crepuscule'), ('dark', 'crepuscule')]:
        pg.evaluate("(p) => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': theme, 'palettePreference': pal})
        pg.goto(B + '/'); pg.wait_for_timeout(3000)  # apparence relue au démarrage (l'Accueil garde la session)
        for r in ['/', '/me/mood', '/settings/appearance', '/family/missions', '/scanner']:
            pg.evaluate(NAV, r); pg.wait_for_timeout(2600)
            bad += measure_contrast(pg, f'{theme}-{pal} {r}')
    R_B['contraste_mesure'] = not bad
    if bad:
        R_B['detail_contraste'] = bad[:25]
    ctx.close()

    # B5. Réduire les animations : aucun fantôme, transition carte → détail immédiate, retour possible
    ctx2, pg2 = new_ctx(b, {'name': 'reduit'}, reduced=True)
    pg2.goto(B + '/welcome'); pg2.wait_for_timeout(1500)
    enter_demo(pg2)
    pg2.goto(B + '/'); pg2.wait_for_timeout(2600)
    row = pg2.locator('[data-testid^="today-row"], [data-testid="today-emphasis"]').filter(visible=True).first
    ok_back = True
    if row.count():
        row.click(); pg2.wait_for_timeout(150)
        pg2.go_back(); pg2.wait_for_timeout(1400)  # retour PENDANT la transition
        ok_back = pg2.url.rstrip('/') == B.rstrip('/') or pg2.url.endswith('/')
    R_B['retour_pendant_transition'] = ok_back
    R_B['reduit_sans_fantome_accueil'] = not pg2.evaluate(GHOSTS)
    pg2.evaluate(NAV, '/scanner/history'); pg2.wait_for_timeout(2400)
    opener = pg2.locator('[data-testid^="scan-open-"]').filter(visible=True).first
    if opener.count():
        opener.click(); pg2.wait_for_timeout(500)
        R_B['reduit_detail_immediat'] = '/scanner/result/' in pg2.url
        pg2.go_back(); pg2.wait_for_timeout(1200)
        R_B['reduit_sans_fantome_historique'] = not pg2.evaluate(GHOSTS)
    pg2.evaluate(NAV, '/community/albums'); pg2.wait_for_timeout(2400)
    R_B.update({f'reduit_{k}': v for k, v in sheet_checks(pg2).items()})
    ctx2.close()

    # B6. Avec animations : après une transition carte → détail → retour, rien ne capte les clics
    ctx3, pg3 = new_ctx(b, {'name': 'anim'})
    pg3.goto(B + '/welcome'); pg3.wait_for_timeout(1500)
    enter_demo(pg3)
    pg3.evaluate(NAV, '/scanner/history'); pg3.wait_for_timeout(2400)
    opener = pg3.locator('[data-testid^="scan-open-"]').filter(visible=True).first
    if opener.count():
        opener.click(); pg3.wait_for_timeout(1600)
        pg3.go_back(); pg3.wait_for_timeout(1600)
        R_B['anime_sans_fantome_apres_morph'] = not pg3.evaluate(GHOSTS)
    ctx3.close()


SHEET_OPENERS = ['[data-testid="album-create"]', '[data-testid="sheet-open"]']


def sheet_checks(pg):
    """Ouvre une feuille (Sheet) de l'écran courant ; la ferme par Échap, par le voile puis par le bouton."""
    res = {}
    # Toute feuille ouverte par un bouton « i » / « aide » ; à défaut, le menu du compte (en haut à droite)
    opener = None
    for sel in SHEET_OPENERS + ['[aria-label*="Aide"]', '[aria-label*="aide"]', '[aria-label*="Plus"]', '[aria-label*="options"]']:
        loc = pg.locator(sel).filter(visible=True).first
        if loc.count():
            opener = loc; break
    if not opener:
        res['sheet_ouvrable'] = None
        return res

    def is_open():
        return pg.locator('[data-testid="sheet"], [aria-modal="true"]').filter(visible=True).count() > 0

    for how in ['echap', 'voile', 'bouton']:
        opener.click(); pg.wait_for_timeout(700)
        if not is_open():
            res['sheet_ouvrable'] = False; return res
        if how == 'echap':
            pg.keyboard.press('Escape')
        elif how == 'voile':
            pg.mouse.click(pg.viewport_size['width'] / 2, 30)
        else:
            btn = pg.locator('[data-testid="sheet-close"]').filter(visible=True).first
            if btn.count():
                btn.click()
        pg.wait_for_timeout(800)
        res[f'sheet_ferme_{how}'] = not is_open()
        res[f'sheet_sans_fantome_{how}'] = not pg.evaluate(GHOSTS)
        if is_open():
            pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    return res


with sync_playwright() as p:
    br = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    if 'A' in PART:
        part_a(br)
    if 'B' in PART:
        part_b(br)
    br.close()

blocking = {r: {c: [f for f in fs if f['kind'] in BLOCKING] for c, fs in cfgs.items()} for r, cfgs in R_A.items()}
blocking = {r: {c: fs for c, fs in cfgs.items() if fs} for r, cfgs in blocking.items()}
blocking = {r: c for r, c in blocking.items() if c}
summary = {
    'ecrans_testes': len(ROUTES) + len(PUBLIC),
    'ecrans_en_defaut': sorted(blocking),
    'A_bloquants': blocking,
    'A_autres': {r: {c: [f for f in fs if f['kind'] not in BLOCKING] for c, fs in cfgs.items()} for r, cfgs in R_A.items()},
    'B': R_B,
    'erreurs': errs[:10],
}
out = json.dumps(summary, ensure_ascii=False, indent=1)
open(os.path.join(SHOTS, 'rapport.json'), 'w', encoding='utf-8').write(out)
print(out[:20000])
b_fail = [k for k, v in R_B.items() if v is False and not k.startswith('info_')]
sys.exit(1 if blocking or b_fail or errs else 0)
