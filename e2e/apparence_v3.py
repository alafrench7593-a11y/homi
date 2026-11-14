"""
HOMI v4 « lumière minérale » (le fichier garde son nom v3) — Réglages → Apparence et couleurs + panneau du bas gestuel
(démonstration, sans compte) :
 · palettes v4 (Auto, Brume pêche, Aurore lilas, Lagune turquoise, Ambre minéral) ; Lagune turquoise : aperçu immédiat,
   persistance après rechargement et par compte ; une préférence v3 enregistrée (« turquoise ») est migrée ;
 · changement de palette INTERPOLÉ (une couleur intermédiaire observée pendant la transition), puis posé ;
 · « Réduire les animations » émulé (reducedMotion = 'reduce') : changement immédiat, aucun reflet, scène fixe ;
 · panneau du bas : ouverture, le panneau SUIT le doigt (glisser la poignée), retour au cran si relâché tôt,
   fermeture en glissant vers le bas, fermeture par le voile et par le bouton Fermer, champ texte (clavier) utilisable
   dans le panneau ;
 · scène d'ESPACE : immersive à la racine de chaque espace (composition propre à l'espace), calme sur les écrans
   internes ; aucune particule ni astre (« arcs » répétés) ;
 · lentille : le sélecteur et la barre d'onglets ont une lentille qui glisse sous l'option active.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
Usage : NAV_URL=http://127.0.0.1:8901 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/apparence_v3.py
"""
import json, os, re
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8901')
EXE = os.environ.get('PW_CHROMIUM') or None
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-v4/e2e'); os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

def hex_rgb(h):
    return 'rgb(%d, %d, %d)' % tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# Encres verrouillées (src/theme/tokens.ts, PALETTES) : clair = ink[0], sombre = glow[0]
PRIMARY = {
    ('light', 'lagune'): '#00636A', ('dark', 'lagune'): '#55DCD2',
    ('light', 'ambre'): '#7C4A0C', ('dark', 'ambre'): '#F0BC6C',
    ('light', 'peche'): '#9A4122', ('light', 'lilas'): '#5B3DB0',
}

def primary(pg):
    return pg.evaluate("() => { const el = document.querySelector('[data-testid=\"preview-primary\"]'); return el ? getComputedStyle(el).backgroundColor : null }")

def ui_state(pg):
    return pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.ui') || '{}').state || {})")

def checked(pg, tid):
    return pg.evaluate(f"() => {{ const el = document.querySelector('[data-testid=\"{tid}\"]'); return el ? el.getAttribute('aria-checked') : null }}")

def count(pg, tid):
    return pg.locator(f'[data-testid="{tid}"]').count()

def translate_y(pg, tid):
    return pg.evaluate(f"""() => {{ const el = document.querySelector('[data-testid="{tid}"]'); if (!el) return null;
        const m = getComputedStyle(el).transform; if (!m || m === 'none') return 0; const v = m.match(/matrix\\(([^)]+)\\)/); return v ? parseFloat(v[1].split(',')[5]) : 0 }}""")

def login(ctx):
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
      s.tables.subscriptions = (s.tables.subscriptions || []).filter((x) => x.user_id !== me);
      s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'aufildenous_premium_annual', store: 'test', period_type: 'annual', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    return pg

def drag(pg, tid, dy, steps=12, release=True):
    box = pg.locator(f'[data-testid="{tid}"]').first.bounding_box()
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down()
    for i in range(1, steps + 1):
        pg.mouse.move(x, y + dy * i / steps); pg.wait_for_timeout(16)
    if release:
        pg.mouse.up()

def run(p):
    b = p.chromium.launch(executable_path=EXE)
    # ---------------------------------------------------------------- mouvement complet
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, reduced_motion='no-preference')
    pg = login(ctx)
    pg.goto(B + '/'); pg.wait_for_timeout(3000)
    R['scene_immersive_accueil'] = count(pg, 'scene-immersive') >= 1 and count(pg, 'scene-space-home') >= 1
    R['lentille_onglets'] = count(pg, 'tab-indicator') == 1  # barre d'onglets : une seule lentille
    for route, space in [('/health', 'health'), ('/baby', 'baby'), ('/household', 'family'), ('/community', 'community'), ('/settings', 'settings')]:
        pg.goto(B + route); pg.wait_for_timeout(2500)
        R[f'scene_espace_{space}'] = count(pg, f'scene-space-{space}') >= 1 and count(pg, 'scene-immersive') >= 1
    pg.goto(B + '/cycle'); pg.wait_for_timeout(3000)
    R['scene_calme_ecran_interne'] = count(pg, 'scene-calm') >= 1 and count(pg, 'scene-immersive') == 0 and count(pg, 'scene-space-health') >= 1
    R['aucun_astre_ni_cercle'] = pg.evaluate("() => document.querySelectorAll('[data-testid^=\"scene-space-\"] circle').length") == 0
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(3000)
    R['cinq_choix_v4'] = all(count(pg, f'palette-{c}') == 1 for c in ['auto', 'peche', 'lilas', 'lagune', 'ambre'])
    R['anciennes_palettes_retirees'] = all(count(pg, f'palette-{c}') == 0 for c in ['turquoise', 'aurore', 'crepuscule', 'menthe', 'iris'])
    R['lentille_selecteur'] = count(pg, 'choice-indicator') >= 1

    pg.locator('[data-testid="appearance-light"]').first.click(); pg.wait_for_timeout(500)
    pg.locator('[data-testid="palette-lagune"]').first.click(); pg.wait_for_timeout(600)
    R['lagune_appliquee'] = primary(pg) == hex_rgb(PRIMARY[('light', 'lagune')]) and checked(pg, 'palette-lagune') == 'true'
    pg.screenshot(path=f'{SHOTS}/v4_clair_lagune.png')

    # transition interpolée : couleur intermédiaire pendant ~360 ms, puis la nouvelle palette
    pg.locator('[data-testid="palette-ambre"]').first.click()
    seen = set()
    for _ in range(14):
        seen.add(primary(pg)); pg.wait_for_timeout(30)
    pg.wait_for_timeout(400)
    end = hex_rgb(PRIMARY[('light', 'ambre')]); start = hex_rgb(PRIMARY[('light', 'lagune')])
    R['palette_interpolee'] = len(seen - {end, start, None}) >= 1
    R['palette_posee'] = primary(pg) == end

    # sombre + Lagune turquoise, persistance après rechargement et par compte
    pg.locator('[data-testid="appearance-dark"]').first.click(); pg.wait_for_timeout(300)
    pg.locator('[data-testid="palette-lagune"]').first.click(); pg.wait_for_timeout(600)
    pg.reload(); pg.wait_for_timeout(4000)
    st = ui_state(pg)
    R['persistance_stockage'] = st.get('themePreference') == 'dark' and st.get('palettePreference') == 'lagune'
    R['persistance_affichage'] = primary(pg) == hex_rgb(PRIMARY[('dark', 'lagune')]) and checked(pg, 'palette-lagune') == 'true'
    owner = st.get('appearanceOwner')
    R['preference_par_compte'] = bool(owner) and (st.get('appearanceByUser') or {}).get(owner) == {'theme': 'dark', 'palette': 'lagune'}
    R['aucune_particule'] = pg.evaluate("() => document.querySelectorAll('[data-testid=\"bg-night\"] circle').length") == 0
    # migration : une préférence v3 enregistrée (« crepuscule », compte actif) devient la plus proche (Ambre minéral)
    pg.evaluate("""(o) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui')); ui.state.palettePreference = 'crepuscule';
      ui.state.appearanceByUser[o] = { theme: 'dark', palette: 'crepuscule' }; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }""", owner)
    pg.reload(); pg.wait_for_timeout(4000)
    R['migration_v3_vers_v4'] = checked(pg, 'palette-ambre') == 'true' and primary(pg) == hex_rgb(PRIMARY[('dark', 'ambre')])
    pg.locator('[data-testid="palette-lagune"]').first.click(); pg.wait_for_timeout(600)

    # ---------------------------------------------------------------- panneau du bas gestuel
    pg.locator('[data-testid="demo-sheet-open"]').first.scroll_into_view_if_needed()
    pg.locator('[data-testid="demo-sheet-open"]').first.click(); pg.wait_for_timeout(900)
    R['panneau_ouvert'] = count(pg, 'sheet-panel') == 1
    rest = translate_y(pg, 'sheet') or 0
    drag(pg, 'sheet-handle', 90, release=False)
    during = translate_y(pg, 'sheet') or 0
    R['panneau_suit_le_doigt'] = during - rest > 50
    pg.mouse.up(); pg.wait_for_timeout(700)
    R['panneau_revient_au_cran'] = abs((translate_y(pg, 'sheet') or 0) - rest) < 4 and count(pg, 'sheet-panel') == 1
    pg.screenshot(path=f'{SHOTS}/v4_panneau_sombre.png')
    # clavier : le champ du panneau prend le focus et reçoit la saisie
    pg.locator('[data-testid="demo-sheet-field"]').first.click(); pg.keyboard.type('Pain et lait'); pg.wait_for_timeout(300)
    R['panneau_champ_saisie'] = pg.locator('[data-testid="demo-sheet-field"]').first.input_value() == 'Pain et lait'
    box = pg.locator('[data-testid="demo-sheet-field"]').first.bounding_box()
    R['panneau_champ_visible'] = box is not None and 0 <= box['y'] <= 844 - box['height']
    # fermer en glissant vers le bas
    drag(pg, 'sheet-handle', 420); pg.wait_for_timeout(900)
    R['panneau_ferme_glisse'] = count(pg, 'sheet-panel') == 0
    # fermer par le voile
    pg.locator('[data-testid="demo-sheet-open"]').first.click(); pg.wait_for_timeout(800)
    pg.locator('[data-testid="sheet-backdrop"]').first.click(position={'x': 30, 'y': 30}); pg.wait_for_timeout(700)
    R['panneau_ferme_voile'] = count(pg, 'sheet-panel') == 0
    # fermer par le bouton Fermer
    pg.locator('[data-testid="demo-sheet-open"]').first.click(); pg.wait_for_timeout(800)
    pg.locator('[data-testid="sheet-panel"] [aria-label="Fermer"]').first.click(); pg.wait_for_timeout(700)
    R['panneau_ferme_bouton'] = count(pg, 'sheet-panel') == 0
    R['mouvement_reflet_present'] = count(pg, 'press-sheen') >= 1
    ctx.close()

    # ---------------------------------------------------------------- Réduire les animations
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, reduced_motion='reduce')
    pg = login(ctx)
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(3500)
    R['reduit_aucun_reflet'] = count(pg, 'press-sheen') == 0
    pg.locator('[data-testid="palette-lagune"]').first.click(); pg.wait_for_timeout(50)
    R['reduit_changement_immediat'] = primary(pg) == hex_rgb(PRIMARY[('light', 'lagune')])
    pg.locator('[data-testid="palette-ambre"]').first.click(); pg.wait_for_timeout(50)
    R['reduit_changement_immediat_2'] = primary(pg) == hex_rgb(PRIMARY[('light', 'ambre')])
    # scène fixe : la transformation des plans ne bouge pas
    t1 = pg.evaluate("() => [...document.querySelectorAll('[data-testid=\"scene-calm\"] *')].map((e) => getComputedStyle(e).transform).join('|').slice(0, 2000)")
    pg.wait_for_timeout(1200)
    t2 = pg.evaluate("() => [...document.querySelectorAll('[data-testid=\"scene-calm\"] *')].map((e) => getComputedStyle(e).transform).join('|').slice(0, 2000)")
    R['reduit_scene_fixe'] = t1 == t2
    pg.locator('[data-testid="demo-sheet-open"]').first.scroll_into_view_if_needed()
    pg.locator('[data-testid="demo-sheet-open"]').first.click(); pg.wait_for_timeout(150)
    R['reduit_panneau_immediat'] = count(pg, 'sheet-panel') == 1 and abs(translate_y(pg, 'sheet') or 0) < 2
    pg.screenshot(path=f'{SHOTS}/v4_reduit_panneau.png')
    ctx.close()
    b.close()

with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'erreurs': errs[:5]}, ensure_ascii=False, indent=1))
raise SystemExit(0 if all(R.values()) and not errs else 1)
