"""
HOMI v6 — Réglages → Apparence et couleurs : cinq palettes + Adaptatif, en clair et en sombre (démo web, sans compte).
Remplace e2e/apparence_v3.py (palettes v4, retirées le 16/11/2026).

Vérifie :
 · les 5 palettes + « Adaptatif » sont proposées, chacune avec son aperçu réel (pastilles, mini-carte, mini-bouton) ;
   les anciennes palettes (v3 / v4) ne le sont plus ;
 · chaque palette, en clair ET en sombre : application immédiate (fond de page, aplat de l'action principale = jetons
   de src/theme/tokens.ts), option cochée, aperçu de la tuile aux couleurs de SA palette ;
 · persistance après rechargement, préférence par compte ;
 · migration : une ancienne préférence enregistrée (« lagune ») revient à la palette par défaut ;
 · Adaptatif : la palette suit le profil affiché (correspondance fixe), et change quand le profil change ;
 · « Rétablir par défaut » : Système + Rose poudré et pêche ;
 · Réduire les animations : aucun fondu (opacité 1 tout de suite) ; mouvement complet : fondu observé puis posé.
Captures (MODE=shots ou par défaut à la fin) : accueil et écran d'apparence dans chaque palette, clair et sombre,
390 × 844, dans SHOTS.

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/v6/web
  python3 e2e/spa_server.py /tmp/v6/web 8986 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8986 SHOTS=/tmp/v6/palettes python3 e2e/apparence_v6.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8986')
SHOTS = os.environ.get('SHOTS', '/tmp/v6/palettes')
EXE = os.environ.get('PW_CHROMIUM') or '/opt/pw-browsers/chromium'
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [None])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

PALETTES = ['homi', 'lavande', 'nuit', 'sauge', 'champagne']
# Démo : Premium actif (sinon l'écran Premium recouvre les écrans réservés)
PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual',
    entitlement: 'HOMI_PREMIUM', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""
# Jetons verrouillés par src/__tests__/contrast.test.ts : (fond de page, aplat de l'action principale)
TOKENS = {
    ('light', 'homi'): ('#FBF4F2', '#3B1D2C'), ('dark', 'homi'): ('#1A1217', '#FFA08A'),
    ('light', 'lavande'): ('#F7F4FB', '#2E1F52'), ('dark', 'lavande'): ('#15121D', '#BDA7FF'),
    ('light', 'nuit'): ('#F2F6FA', '#14294A'), ('dark', 'nuit'): ('#0F1622', '#8ADCE8'),
    ('light', 'sauge'): ('#F4F6F1', '#1F3A2D'), ('dark', 'sauge'): ('#111713', '#A9D6B6'),
    ('light', 'champagne'): ('#F9F5EE', '#3A2A1C'), ('dark', 'champagne'): ('#181410', '#EBCB8E'),
}
ADAPTIVE = {'me': 'homi', 'pregnancy': 'lavande', 'child': 'sauge', 'postpartum': 'champagne', 'family': 'nuit'}


def rgb(h):
    return 'rgb(%d, %d, %d)' % tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def page_bg(pg):
    return pg.evaluate("""() => { const el = document.querySelector('[data-testid="bg-powder"], [data-testid="bg-night"]'); return el ? getComputedStyle(el).backgroundColor : null }""")


def fill(pg, tid):
    """Premier fond non transparent de l'élément ou de ses descendants."""
    return pg.evaluate("""(tid) => { const root = document.querySelector(`[data-testid="${tid}"]`); if (!root) return null;
      for (const el of [root, ...root.querySelectorAll('*')]) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; }
      return null }""", tid)


def opacity(pg, tid):
    return pg.evaluate("""(tid) => { const el = document.querySelector(`[data-testid="${tid}"]`); return el ? parseFloat(getComputedStyle(el).opacity) : null }""", tid)


def ui_state(pg):
    return pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.ui') || '{}').state || {})")


def checked(pg, tid):
    return pg.evaluate("""(tid) => { const el = document.querySelector(`[data-testid="${tid}"]`); return el ? (el.getAttribute('aria-checked') || el.getAttribute('aria-selected')) : null }""", tid)


def count(pg, tid):
    return pg.locator(f'[data-testid="{tid}"]').count()


def click(pg, tid, wait=700):
    pg.locator(f'[data-testid="{tid}"]').first.click(); pg.wait_for_timeout(wait)


def start(b, scheme='light', motion='no-preference'):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme, reduced_motion=motion)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM)
    return ctx, pg


def set_ui(pg, patch):
    pg.evaluate("""(patch) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui')); Object.assign(ui.state, patch);
      const o = ui.state.appearanceOwner; if (o && ui.state.appearanceByUser && ui.state.appearanceByUser[o]) {
        if (patch.palettePreference) ui.state.appearanceByUser[o].palette = patch.palettePreference;
        if (patch.themePreference) ui.state.appearanceByUser[o].theme = patch.themePreference; }
      localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }""", patch)


def run(p):
    b = p.chromium.launch(executable_path=EXE)
    # ---------------------------------------------------------------- mouvement complet
    ctx, pg = start(b)
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(3000)
    R['cinq_palettes_et_adaptatif'] = all(count(pg, f'palette-{c}') == 1 for c in PALETTES + ['adaptive'])
    R['apercu_reel_par_palette'] = all(count(pg, f'palette-preview-{c}') == 1 for c in PALETTES)
    R['anciennes_palettes_retirees'] = all(count(pg, f'palette-{c}') == 0 for c in ['auto', 'peche', 'lilas', 'lagune', 'ambre', 'turquoise', 'aurore', 'crepuscule', 'menthe', 'iris'])
    R['systeme_clair_sombre_conserves'] = all(count(pg, f'appearance-{m}') >= 1 for m in ['system', 'light', 'dark'])
    R['defaut_rose_poudre'] = checked(pg, 'palette-homi') == 'true' and ui_state(pg).get('palettePreference') == 'homi'

    for mode in ['light', 'dark']:
        click(pg, f'appearance-{mode}', 500)
        # chaque tuile est dessinée avec les jetons de SA palette, dans l'apparence en cours
        R[f'apercus_{mode}'] = all(fill(pg, f'palette-preview-{c}') == rgb(TOKENS[(mode, c)][0]) for c in PALETTES)
        for c in PALETTES:
            click(pg, f'palette-{c}')
            bg, action = TOKENS[(mode, c)]
            R[f'{c}_{mode}'] = page_bg(pg) == rgb(bg) and fill(pg, 'ds-primary') == rgb(action) and checked(pg, f'palette-{c}') == 'true'
            pg.screenshot(path=f'{SHOTS}/apparence_{c}_{mode}.png')

    # fondu sobre : une opacité intermédiaire est observée juste après le changement, puis l'état final
    click(pg, 'appearance-light', 500)
    click(pg, 'palette-homi')
    pg.locator('[data-testid="palette-sauge"]').first.click()
    seen = set()
    for _ in range(10):
        seen.add(opacity(pg, 'theme-fade')); pg.wait_for_timeout(25)
    pg.wait_for_timeout(500)
    R['fondu_sobre'] = any(o is not None and o < 0.999 for o in seen) and opacity(pg, 'theme-fade') == 1

    # persistance après rechargement, préférence par compte
    click(pg, 'appearance-dark', 400)
    click(pg, 'palette-nuit')
    pg.reload(); pg.wait_for_timeout(4000)
    st = ui_state(pg)
    owner = st.get('appearanceOwner')
    R['persistance_stockage'] = st.get('themePreference') == 'dark' and st.get('palettePreference') == 'nuit'
    R['persistance_affichage'] = page_bg(pg) == rgb(TOKENS[('dark', 'nuit')][0]) and checked(pg, 'palette-nuit') == 'true'
    R['preference_par_compte'] = bool(owner) and (st.get('appearanceByUser') or {}).get(owner) == {'theme': 'dark', 'palette': 'nuit'}

    # migration : une ancienne palette enregistrée revient à la palette par défaut, l'apparence est conservée
    set_ui(pg, {'palettePreference': 'lagune'})
    pg.reload(); pg.wait_for_timeout(4000)
    st = ui_state(pg)
    R['migration_ancienne_palette'] = checked(pg, 'palette-homi') == 'true' and page_bg(pg) == rgb(TOKENS[('dark', 'homi')][0]) and st.get('themePreference') == 'dark'

    # Adaptatif : la palette suit le profil affiché, puis change avec lui
    click(pg, 'appearance-light', 400)
    click(pg, 'palette-adaptive')
    st = ui_state(pg)
    prof = st.get('adaptiveProfile')
    R['adaptatif_enregistre'] = st.get('palettePreference') == 'adaptive' and checked(pg, 'palette-adaptive') == 'true' and count(pg, 'adaptive-map') == 1
    R['adaptatif_suit_le_profil'] = prof in ADAPTIVE and page_bg(pg) == rgb(TOKENS[('light', ADAPTIVE[prof])][0])
    other = {'type': 'me'} if prof != 'me' else None
    if other is None:
        # la démo affiche « Moi » : passer sur un autre profil réellement présent (enfant, sinon grossesse)
        other = pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const t = s.tables || {};
          const c = (t.children || [])[0]; if (c) return { type: 'child', id: c.id };
          const g = (t.pregnancies || []).find((x) => x.status === 'active' || !x.ended_at); return g ? { type: 'pregnancy', id: g.id } : null }""")
    if other:
        pg.evaluate("""(subject) => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui')); ui.state.subject = subject; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }""", other)
        pg.reload(); pg.wait_for_timeout(5000)
        st = ui_state(pg)
        prof2 = st.get('adaptiveProfile')
        R['adaptatif_change_avec_le_profil'] = prof2 in ADAPTIVE and prof2 != prof and page_bg(pg) == rgb(TOKENS[('light', ADAPTIVE[prof2])][0])
        pg.screenshot(path=f'{SHOTS}/apparence_adaptatif_{prof2}.png')
    else:
        R['adaptatif_change_avec_le_profil'] = False

    # Rétablir par défaut
    click(pg, 'palette-champagne')
    click(pg, 'appearance-dark', 400)
    click(pg, 'appearance-reset', 900)
    st = ui_state(pg)
    R['retablir_par_defaut'] = st.get('palettePreference') == 'homi' and st.get('themePreference') == 'system' and checked(pg, 'palette-homi') == 'true' and page_bg(pg) == rgb(TOKENS[('light', 'homi')][0])
    ctx.close()

    # ---------------------------------------------------------------- Réduire les animations : aucun fondu
    ctx, pg = start(b, motion='reduce')
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(3000)
    click(pg, 'appearance-light', 400)
    pg.locator('[data-testid="palette-lavande"]').first.click()
    seen = set()
    for _ in range(8):
        seen.add(opacity(pg, 'theme-fade')); pg.wait_for_timeout(25)
    R['reduire_animations_immediat'] = seen == {1} and page_bg(pg) == rgb(TOKENS[('light', 'lavande')][0])
    ctx.close()

    # ---------------------------------------------------------------- captures de l'accueil, chaque palette, clair et sombre
    ctx, pg = start(b)
    ok = True
    for mode in ['light', 'dark']:
        for c in PALETTES:
            set_ui(pg, {'palettePreference': c, 'themePreference': mode})
            pg.goto(B + '/'); pg.wait_for_timeout(4500)
            ok = ok and page_bg(pg) == rgb(TOKENS[(mode, c)][0])
            pg.screenshot(path=f'{SHOTS}/accueil_{c}_{mode}.png')
    R['accueil_dans_chaque_palette'] = ok
    ctx.close()
    b.close()


with sync_playwright() as p:
    run(p)
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
print('ECHECS', [k for k, v in R.items() if k != 'erreurs' and v is not True], 'ERREURS', len(errs))
