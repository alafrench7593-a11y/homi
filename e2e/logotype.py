"""
Logo HOMI v5 « maison » dans un navigateur réel (Chromium, deviceScaleFactor 2) :
 1. planche de lisibilité : la maison (SVG livrés d'assets/brand) en tailles réelles 16 → 256 px, clair / sombre /
    monochrome, et l'icône PNG générée (48 / 1024) ;
 2. séquence animée de l'ouverture de « Découvrir HOMI » (/discover, logo branché par `setDiscoverOpening`) image
    par image (captures en temps réel pendant 3,2 s, nommées par leur instant), en clair et en sombre : contour tracé +
    reflet sur le bord → maison illuminée → parent, parent, enfant, enfant → nom HOMI → la maison s'ouvre en panneau ;
 3. vidéo webm de l'animation (temps réel, clair ; e2e/logotype_video.js, Playwright Node — NODE_PATH=$(npm root -g)) ;
 4. « Réduire les animations » : état final directement (accueil sans compte : maison + nom présents) ;
 5. connexion et accueil (clair / sombre) : la maison et le nom HOMI lisibles.
  npx expo export --platform web --clear --output-dir /tmp/maison/dist && python3 e2e/spa_server.py /tmp/maison/dist 19011 &
  E2E_URL=http://127.0.0.1:19011 python3 e2e/logotype.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide. Captures : $E2E_SHOTS (défaut /tmp/maison/shots).
"""
import base64, json, os, pathlib, subprocess, time
from playwright.sync_api import sync_playwright

B = os.environ.get('E2E_URL', 'http://127.0.0.1:19011')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/maison/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
R, errs = {}, []


def data_uri(s, color=None):
    if color: s = s.replace('currentColor', color)
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()


def png_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


def planche_html():
    rows = []
    for tone, label, bg, col in [('light', 'clair (ivoire)', '#F1EEE7', None), ('dark', 'sombre (obsidienne)', '#06090B', None), ('mono', 'monochrome', '#FFFFFF', '#13181A')]:
        s = (BRAND / f'homi-mark-{tone}.svg').read_text()
        cells = ''.join(f'<div><img src="{data_uri(s, col)}" width="{n}" height="{n}"><span>{n}</span></div>' for n in [16, 24, 32, 48, 64, 96, 128, 256])
        rows.append(f'<h2>{label}</h2><div class="row" style="background:{bg};color:{"#A9B3B4" if tone == "dark" else "#4A5154"}">{cells}</div>')
    icon = ROOT / 'assets' / 'icon.png'
    fav = ROOT / 'assets' / 'favicon.png'
    rows.append(f'<h2>Icône (PNG générés)</h2><div class="row" style="background:#E4E1DA"><div><img src="{png_uri(fav)}" width="48" height="48"><span>favicon 48</span></div>'
                f'<div><img src="{png_uri(icon)}" width="512" height="512"><span>icon.png 1024 (affichée 512)</span></div></div>')
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
      body {{ margin: 0; padding: 24px; background: #E4E1DA; font: 13px Helvetica, Arial, sans-serif; color: #4A5154; }}
      .row {{ display: flex; align-items: flex-end; gap: 22px; padding: 16px; margin-bottom: 12px; border-radius: 6px; }}
      .row span {{ display: block; font-size: 10px; margin-top: 4px; }}
      h2 {{ font-size: 15px; color: #13181A; margin: 14px 0 6px; }} img {{ display: block; }}
    </style></head><body><h2>HOMI — logo maison, tailles réelles</h2>{''.join(rows)}</body></html>"""


def state(theme, seen=False):
    return f"localStorage.setItem('toietmoi.ui', JSON.stringify({{state:{{cinematicSeen:{'true' if seen else 'false'},introSeen:true,themePreference:'{theme}',paletteName:'auto'}},version:0}}))"


def run(p):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    # 1. planche
    ctx = b.new_context(viewport={'width': 1000, 'height': 900}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.set_content(planche_html()); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/1-planche-maison.png', full_page=True)
    R['planche'] = pg.evaluate('() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)')
    ctx.close()

    # 2. séquence animée de l'ouverture de Découvrir HOMI, horloge pilotée, clair et sombre
    for theme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='no-preference')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        # première ouverture : / → /discover (l'introduction de lancement ne joue pas, rien ne recouvre l'ouverture)
        pg.add_init_script(state(theme))
        pg.goto(B + '/')
        pg.wait_for_selector('[data-testid="discover-logo"]', timeout=15000)
        t0 = time.time()
        R[f'{theme}_logo_maison_anime'] = pg.locator('[data-testid="discover-logo"]').count() > 0 and pg.locator('[data-testid="discover-logo-static"]').count() == 0
        R[f'{theme}_nom_annonce'] = pg.locator('[data-testid="discover-logo"][aria-label="HOMI"]').count() >= 1
        R[f'{theme}_quatre_silhouettes'] = pg.locator('[data-testid^="discover-logo-figure-"]').count() == 4
        # temps réel : captures aussi rapprochées que possible pendant 3,2 s, nommées par leur instant (ms)
        i = 0
        while time.time() - t0 < 3.2:
            ms = int((time.time() - t0) * 1000)
            pg.screenshot(path=f'{SHOTS}/2-sequence-{theme}-{i:02d}-{ms:04d}ms.png', clip={'x': 0, 'y': 60, 'width': 390, 'height': 640}, animations='allow')
            i += 1
        R[f'{theme}_images_sequence'] = i >= 12
        R[f'{theme}_nom_revele'] = pg.locator('[data-testid="discover-logo-name"]').first.is_visible()
        ctx.close()

    # 3. vidéo (temps réel) : Playwright Node (recordVideo), e2e/logotype_video.js
    out = f'{SHOTS}/3-animation-maison.webm'
    env = dict(os.environ, NAV_URL=B, E2E_VIDEO=out)
    env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
    subprocess.run(['node', str(ROOT / 'e2e' / 'logotype_video.js')], env=env, capture_output=True, text=True, timeout=120)
    R['video'] = os.path.exists(out) and os.path.getsize(out) > 10000

    # 4. Réduire les animations : accueil sans compte, maison + nom, aucune intro animée
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.add_init_script(state('light', seen=True))
    pg.goto(B + '/welcome'); pg.wait_for_selector('[data-testid="welcome-start"]', timeout=20000); pg.wait_for_timeout(800)
    R['reduit_maison_et_nom_accueil'] = pg.locator('[data-testid="welcome-wordmark"]').first.is_visible() and pg.locator('[data-testid="welcome-wordmark"][aria-label="HOMI"]').count() >= 1
    R['reduit_sans_intro'] = pg.locator('[data-testid="launch-intro"]').count() == 0
    pg.screenshot(path=f'{SHOTS}/4-accueil-reduit.png')
    ctx.close()

    # 5. connexion et accueil, clair et sombre
    for theme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', reduced_motion='no-preference')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.add_init_script(state(theme, seen=True))
        pg.goto(B + '/welcome'); pg.wait_for_selector('[data-testid="welcome-start"]', timeout=20000); pg.wait_for_timeout(3200)
        pg.screenshot(path=f'{SHOTS}/5-accueil-{theme}.png')
        pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(2500)
        R[f'{theme}_connexion_nom_lisible'] = pg.locator('[data-testid="entry-wordmark"]').first.is_visible() and 'HOMI' in pg.locator('[data-testid="entry-wordmark"]').first.inner_text()
        pg.screenshot(path=f'{SHOTS}/6-connexion-{theme}.png')
        ctx.close()
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = [e for e in errs if 'cloudfront' not in e][:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
