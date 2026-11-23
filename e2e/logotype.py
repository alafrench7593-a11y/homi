"""
Logo HOMI v5 « encre » (logo de la propriétaire) dans un navigateur réel (Chromium, deviceScaleFactor 2) :
 1. planche de lisibilité : symbole, mot-symbole et logo complet (SVG livrés d'assets/brand) en hauteurs réelles
    16 → 1024 px, encre sur ivoire rosé et ivoire sur prune-anthracite ; icônes PNG générées à 60 / 48 / 32 px ;
 2. séquence animée de l'ouverture de « Découvrir HOMI » (/discover, logo branché par `setDiscoverOpening`) en temps
    réel (une image toutes les ≈ 100 ms pendant 2 s, nommées par leur instant), clair et sombre : le corps « M » monte,
    les deux têtes se posent, « HOMI » se révèle, le point du i se pose ;
 3. vidéo webm de l'animation (temps réel, clair ; e2e/logotype_video.js, Playwright Node — NODE_PATH=$(npm root -g)) ;
 4. « Réduire les animations » : état final directement (accueil sans compte : logo présent, annoncé HOMI) ;
 5. /welcome, connexion, accueil (démo) et Réglages › À propos, clair et sombre, 390 × 844 : logo lisible, encre en
    clair, ivoire en sombre, aucune trace du violet de l'ancienne maison.
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/logo5/web
  python3 e2e/spa_server.py /tmp/logo5/web 8995 &
  E2E_URL=http://127.0.0.1:8995 E2E_SHOTS=/tmp/logo5/shots python3 e2e/logotype.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import base64, glob, json, os, pathlib, subprocess, time
from playwright.sync_api import sync_playwright

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8995')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/logo5/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
if CHROMIUM and os.path.isdir(CHROMIUM):
    CHROMIUM = (glob.glob(os.path.join(CHROMIUM, '**', 'chrome'), recursive=True) or [None])[0]
ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
INK, IVORY = '#1F1B1A', '#F7F1E8'
R, errs = {}, []
PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual',
    entitlement: 'HOMI_PREMIUM', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""


def data_uri(s):
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()


def png_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


def planche_html():
    rows = []
    for tone, label, bg, col in [('encre', 'encre sur ivoire rosé (#FBF4F2)', '#FBF4F2', '#5A4A4A'), ('ivoire', 'ivoire sur prune-anthracite (#1A1217)', '#1A1217', '#BBAEAE')]:
        for art, sizes in [('symbole', [16, 24, 32, 48, 64, 96, 128, 256]), ('logo', [16, 20, 24, 32, 48, 64, 96, 128]), ('motsymbole', [16, 24, 32, 64])]:
            s = (BRAND / f'homi-{art}-{tone}.svg').read_text()
            cells = ''.join(f'<div><img src="{data_uri(s)}" height="{n}"><span>{n}</span></div>' for n in sizes)
            rows.append(f'<h2>{art} — {label}</h2><div class="row" style="background:{bg};color:{col}">{cells}</div>')
        s = (BRAND / f'homi-logo-{tone}.svg').read_text()
        rows.append(f'<h2>logo — 1024 px de large</h2><div class="row" style="background:{bg};color:{col}"><div><img src="{data_uri(s)}" width="1024"><span>1024</span></div></div>')
    icon, fav = ROOT / 'assets' / 'icon.png', ROOT / 'assets' / 'favicon.png'
    icons = ''.join(f'<div><img src="{png_uri(icon)}" width="{n}" height="{n}" style="border-radius:{n * 0.225}px"><span>icône {n}</span></div>' for n in [60, 48, 32])
    rows.append(f'<h2>Icône d’app (PNG générés)</h2><div class="row" style="background:#FFFFFF">{icons}<div><img src="{png_uri(fav)}" width="32" height="32"><span>favicon</span></div>'
                f'<div><img src="{png_uri(icon)}" width="256" height="256" style="border-radius:58px"><span>icon.png (256)</span></div></div>')
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
      body {{ margin: 0; padding: 24px; background: #E9E1DC; font: 13px Helvetica, Arial, sans-serif; color: #4A4040; width: 1180px; }}
      .row {{ display: flex; flex-wrap: wrap; align-items: flex-end; gap: 22px; padding: 16px; margin-bottom: 12px; border-radius: 6px; }}
      .row span {{ display: block; font-size: 10px; margin-top: 4px; }}
      h2 {{ font-size: 14px; color: #1F1B1A; margin: 12px 0 6px; }} img {{ display: block; }}
    </style></head><body><h2>HOMI v5 « encre » — hauteurs réelles</h2>{''.join(rows)}</body></html>"""


def state(theme, seen=False):
    return f"localStorage.setItem('toietmoi.ui', JSON.stringify({{state:{{cinematicSeen:{'true' if seen else 'false'},introSeen:true,themePreference:'{theme}',paletteName:'auto'}},version:0}}))"


def svg_fills(pg, sel):
    """Couleurs de remplissage des tracés SVG rendus sous `sel` (web : attribut fill)."""
    return pg.evaluate(f"""() => [...document.querySelectorAll('{sel} path')].map((p) => (p.getAttribute('fill') || getComputedStyle(p).fill || '').toUpperCase())""")


def ink_ok(fills, theme):
    want = INK if theme == 'light' else IVORY
    norm = {'RGB(31, 27, 26)': INK, 'RGB(247, 241, 232)': IVORY}
    got = {norm.get(f, f) for f in fills if f and f != 'NONE'}
    return len(got) == 1 and want.upper() in got


def run(p):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    # 1. planche
    ctx = b.new_context(viewport={'width': 1230, 'height': 900}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.set_content(planche_html()); pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SHOTS}/1-planche-logo.png', full_page=True)
    R['planche'] = pg.evaluate('() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)')
    ctx.close()

    # 2. séquence animée de l'ouverture de Découvrir HOMI, temps réel, clair et sombre
    for theme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='no-preference')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.add_init_script(state(theme))
        pg.goto(B + '/')
        pg.wait_for_selector('[data-testid="discover-logo"]', timeout=15000)
        t0 = time.time()
        R[f'{theme}_logo_anime'] = pg.locator('[data-testid="discover-logo"]').count() > 0 and pg.locator('[data-testid="discover-logo-static"]').count() == 0
        R[f'{theme}_nom_annonce'] = pg.locator('[data-testid="discover-logo"][aria-label="HOMI"]').count() >= 1
        R[f'{theme}_deux_tetes_corps_nom_point'] = all(pg.locator(f'[data-testid="discover-logo-{k}"]').count() == 1 for k in ['body', 'head-0', 'head-1', 'name', 'dot'])
        i, last = 0, -1.0
        while time.time() - t0 < 2.0:
            now = time.time() - t0
            if now - last < 0.095:
                continue
            last = now
            pg.screenshot(path=f'{SHOTS}/2-sequence-{theme}-{i:02d}-{int(now * 1000):04d}ms.png', clip={'x': 0, 'y': 180, 'width': 390, 'height': 360}, animations='allow')
            i += 1
        R[f'{theme}_images_sequence'] = i >= 12
        R[f'{theme}_nom_revele'] = pg.locator('[data-testid="discover-logo-name"]').first.is_visible()
        R[f'{theme}_couleur_logo'] = ink_ok(svg_fills(pg, '[data-testid="discover-logo"]'), theme)
        ctx.close()

    # 3. vidéo (temps réel) : Playwright Node (recordVideo), e2e/logotype_video.js
    out = f'{SHOTS}/3-animation-logo.webm'
    env = dict(os.environ, NAV_URL=B, E2E_VIDEO=out)
    if CHROMIUM: env['PW_CHROMIUM'] = CHROMIUM
    env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
    v = subprocess.run(['node', str(ROOT / 'e2e' / 'logotype_video.js')], env=env, capture_output=True, text=True, timeout=120)
    if v.returncode != 0 and os.path.isdir('/opt/pw-browsers'):
        # Playwright Node : navigateurs (et ffmpeg de l'enregistrement) de sa propre version
        env = {k: x for k, x in env.items() if k != 'PW_CHROMIUM'}
        env['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
        v = subprocess.run(['node', str(ROOT / 'e2e' / 'logotype_video.js')], env=env, capture_output=True, text=True, timeout=120)
    R['video'] = os.path.exists(out) and os.path.getsize(out) > 10000
    if not R['video']: errs.append('video: ' + (v.stderr or v.stdout)[-200:])

    # 4. Réduire les animations : accueil sans compte, logo présent, aucune intro animée
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.add_init_script(state('light', seen=True))
    pg.goto(B + '/welcome'); pg.wait_for_selector('[data-testid="welcome-start"]', timeout=20000); pg.wait_for_timeout(800)
    R['reduit_logo_accueil'] = pg.locator('[data-testid="welcome-wordmark"]').first.is_visible() and pg.locator('[data-testid="welcome-wordmark"][aria-label="HOMI"]').count() >= 1
    R['reduit_sans_intro'] = pg.locator('[data-testid="launch-intro"]').count() == 0
    pg.screenshot(path=f'{SHOTS}/4-welcome-reduit.png')
    ctx.close()

    # 5. /welcome, connexion, accueil (démo), Réglages › À propos — clair et sombre
    for theme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='no-preference', color_scheme=theme)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.add_init_script(state(theme, seen=True))
        pg.goto(B + '/welcome'); pg.wait_for_selector('[data-testid="welcome-start"]', timeout=20000); pg.wait_for_timeout(3000)
        R[f'{theme}_welcome_logo'] = ink_ok(svg_fills(pg, '[data-testid="welcome-wordmark"]'), theme)
        pg.screenshot(path=f'{SHOTS}/5-welcome-{theme}.png')
        pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(2500)
        wm = pg.locator('[data-testid="entry-wordmark"]').first
        R[f'{theme}_connexion_logo'] = wm.is_visible() and wm.get_attribute('aria-label') == 'HOMI' and ink_ok(svg_fills(pg, '[data-testid="entry-wordmark"]'), theme)
        pg.screenshot(path=f'{SHOTS}/6-connexion-{theme}.png')
        pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
        pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4500)
        pg.evaluate(PREMIUM)  # l'accueil complet (sinon : l'offre Premium de la démo)
        pg.goto(B + '/'); pg.wait_for_timeout(3500)
        pg.screenshot(path=f'{SHOTS}/7-accueil-{theme}.png')
        pg.goto(B + '/settings'); pg.wait_for_timeout(3000)
        sw = pg.locator('[data-testid="settings-wordmark"]').first
        sw.scroll_into_view_if_needed(); pg.wait_for_timeout(600)
        R[f'{theme}_reglages_a_propos'] = sw.is_visible() and ink_ok(svg_fills(pg, '[data-testid="settings-wordmark"]'), theme)
        pg.screenshot(path=f'{SHOTS}/8-reglages-a-propos-{theme}.png')
        # aucune trace du violet de l'ancienne maison dans les SVG de l'interface
        R[f'{theme}_sans_violet'] = pg.evaluate("() => !/#7A52E6|#3F2196|#7C55EA|#3B1E8E/i.test(document.body.innerHTML)")
        ctx.close()
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = [e for e in errs if 'cloudfront' not in e][:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
