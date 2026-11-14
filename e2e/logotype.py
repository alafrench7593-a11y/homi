"""
Logotype HOMI v4 « lentille » dans un navigateur réel (Chromium, deviceScaleFactor 2) :
 1. planche des deux pistes (SVG d'assets/brand/explorations, tailles réelles 16/24/32/48/96, couleur et monochrome) ;
 2. variantes livrées (mot-symbole et signe : clair, sombre, monochrome) et icône à 24 / 48 / 1024 ;
 3. séquence animée de /cinematic image par image (horloge de Playwright pilotée, 64 images par pas de 12 ms d’horloge simulée),
    en clair et en sombre : reflet qui révèle le mot → volume de la lentille → panneau ;
 4. « Réduire les animations » : état final directement (accueil sans compte : mot-symbole présent).
  npx expo export --platform web --clear --output-dir /tmp/logo/dist && python3 e2e/spa_server.py /tmp/logo/dist 19001 &
  E2E_URL=http://127.0.0.1:19001 python3 e2e/logotype.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide. Captures : $E2E_SHOTS (défaut /tmp/logo/shots).
"""
import json, os, pathlib
from playwright.sync_api import sync_playwright

B = os.environ.get('E2E_URL', 'http://127.0.0.1:19001')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/logo/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
R, errs = {}, []


def svg(path):
    return (BRAND / path).read_text()


def sheet_html(body, bg='#E4E1DA'):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
      body {{ margin: 0; padding: 24px; background: {bg}; font: 13px Helvetica, Arial, sans-serif; color: #4A5154; }}
      .row {{ display: flex; align-items: flex-end; gap: 18px; padding: 16px; margin-bottom: 12px; border-radius: 6px; }}
      .row span {{ display: block; font-size: 10px; margin-top: 4px; }}
      .light {{ background: #F1EEE7; }} .dark {{ background: #06090B; color: #A9B3B4; }} .mono {{ background: #FFFFFF; color: #13181A; }}
      h2 {{ font-size: 15px; color: #13181A; margin: 18px 0 8px; }}
      img {{ display: block; }}
    </style></head><body>{body}</body></html>"""


def data_uri(s, color=None):
    import base64
    if color: s = s.replace('currentColor', color)
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()


def pistes_page():
    out = ['<h2>HOMI — deux pistes de logotype, tailles réelles (mot : hauteur, signe : côté)</h2>']
    for piste, titre in [('piste1-lentille', 'Piste 1 — le O lentille de verre (retenue)'), ('piste2-foyer', 'Piste 2 — foyer (H à toit) et lien (anneaux, ligature MI)')]:
        out.append(f'<h2>{titre}</h2>')
        for tone in ['light', 'dark', 'mono']:
            w = svg(f'explorations/{piste}-wordmark-{tone}.svg'); g = svg(f'explorations/{piste}-sign-{tone}.svg')
            col = '#13181A' if tone == 'mono' else None
            cells = ''.join(f'<div><img src="{data_uri(w, col)}" height="{h}"><span>{h}</span></div>' for h in [16, 24, 32, 48, 96])
            cells += ''.join(f'<div><img src="{data_uri(g, col)}" height="{s}" width="{s}"><span>signe {s}</span></div>' for s in [16, 24, 32, 48])
            out.append(f'<div class="row {tone}">{cells}</div>')
    return sheet_html(''.join(out))


def variantes_page():
    out = ['<h2>Logotype retenu — mot-symbole et signe compact</h2>']
    for tone, label in [('light', 'clair (ivoire)'), ('dark', 'sombre (obsidienne)'), ('mono', 'monochrome')]:
        col = '#13181A' if tone == 'mono' else None
        w = svg(f'homi-wordmark-{tone}.svg'); g = svg(f'homi-sign-{tone}.svg')
        out.append(f'<div class="row {tone}"><div><img src="{data_uri(w, col)}" height="120"><span>{label} — 120</span></div>'
                   f'<div><img src="{data_uri(w, col)}" height="32"><span>32</span></div><div><img src="{data_uri(w, col)}" height="18"><span>18</span></div>'
                   f'<div><img src="{data_uri(g, col)}" height="96" width="96"><span>signe 96</span></div><div><img src="{data_uri(g, col)}" height="24" width="24"><span>24</span></div></div>')
    if (BRAND / 'preview').exists():
        import base64
        cells = ''
        for s in [24, 48, 1024]:
            b = base64.b64encode((BRAND / 'preview' / f'icon-{s}.png').read_bytes()).decode()
            shown = 256 if s == 1024 else s
            cells += f'<div><img src="data:image/png;base64,{b}" width="{shown}" height="{shown}" style="image-rendering:auto"><span>icône {s}{" (affichée 256)" if s == 1024 else ""}</span></div>'
        out.append(f'<h2>Icône d’application (PNG générés)</h2><div class="row mono">{cells}</div>')
    return sheet_html(''.join(out))


def run(p):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    # 1–2. planches (fichiers SVG livrés, rendus par le navigateur)
    ctx = b.new_context(viewport={'width': 1100, 'height': 900}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.set_content(pistes_page()); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/1-planche-pistes.png', full_page=True)
    pg.set_content(variantes_page()); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/2-variantes-icone.png', full_page=True)
    R['planches'] = all(pg.evaluate('() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)') for _ in [0])
    ctx.close()

    # 3. séquence animée /cinematic, horloge pilotée, clair et sombre
    for theme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='no-preference')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.add_init_script(f"localStorage.setItem('toietmoi.ui', JSON.stringify({{state:{{cinematicSeen:false,introSeen:true,themePreference:'{theme}',paletteName:'auto'}},version:0}}))")
        pg.clock.install()
        pg.goto(B + '/cinematic?replay=1')
        # chargement : on avance l'horloge jusqu'à ce que l'introduction soit montée
        for _ in range(100):
            if pg.locator('[data-testid="homi-intro-logo"]').count() > 0: break
            pg.clock.run_for(50)
        R[f'{theme}_intro_montee'] = pg.locator('[data-testid="homi-intro-logo"]').count() > 0
        R[f'{theme}_nom_annonce'] = pg.locator('[data-testid="homi-intro-logo"][aria-label="HOMI"]').count() >= 1 or pg.get_by_role('heading', name='HOMI').count() >= 1
        frames = []
        # pas de 12 ms d'horloge Playwright entre deux images (numérotées : l'horloge simulée de rAF n'est pas
        # exactement l'horloge murale, seules l'ordre et la continuité comptent ici)
        for i in range(64):
            path = f'{SHOTS}/3-sequence-{theme}-{i:02d}.png'
            pg.screenshot(path=path, clip={'x': 0, 'y': 160, 'width': 390, 'height': 520})
            frames.append(path)
            pg.clock.run_for(12)
        R[f'{theme}_panneau_deploye'] = pg.locator('[data-testid="homi-lens-panel"]').count() >= 1 or '/cinematic' not in pg.url
        ctx.close()

    # 4. Réduire les animations : accueil sans compte, mot-symbole présent, aucune intro animée
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.add_init_script("localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true,themePreference:'light'},version:0}))")
    pg.goto(B + '/welcome'); pg.wait_for_selector('[data-testid="welcome-start"]', timeout=20000); pg.wait_for_timeout(800)
    R['reduit_mot_symbole_accueil'] = pg.locator('[data-testid="welcome-wordmark"]').first.is_visible()
    R['reduit_sans_intro'] = pg.locator('[data-testid="launch-intro"]').count() == 0
    pg.screenshot(path=f'{SHOTS}/4-accueil-reduit.png')
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(2500)
    R['connexion_nom_lisible'] = pg.locator('[data-testid="entry-wordmark"]').first.is_visible()
    pg.screenshot(path=f'{SHOTS}/5-connexion.png')
    ctx.close()
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]
R['erreurs'] = [e for e in errs if 'cloudfront' not in e][:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
