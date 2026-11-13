"""
HOMI v2 — Réglages → Apparence et couleurs (démonstration, sans compte) :
 · changer d'apparence (Système / Clair / Sombre) et de palette : aperçu IMMÉDIAT (couleur du bouton principal,
   fond graphite ou ivoire) ;
 · persistance après rechargement de la page ;
 · retour en Auto (aperçu « Fin de journée » → Crépuscule, prévisible quelle que soit l'heure) ;
 · « Réduire les animations » émulé (reducedMotion = 'reduce') : aucun reflet, aucun faisceau, coche posée sans
   ressort, pas de halo de validation ; comparé au mouvement complet.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
Usage : NAV_URL=http://127.0.0.1:8881 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/apparence_v2.py
"""
import json, os
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8881')
EXE = os.environ.get('PW_CHROMIUM') or None  # ex. /opt/pw-browsers/chromium
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-v2/e2e'); os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

def hex_rgb(h):
    return 'rgb(%d, %d, %d)' % tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# Encres verrouillées (src/theme/tokens.ts, PALETTES) : clair = ink[0], sombre = glow[0]
PRIMARY = {
    ('light', 'menthe'): '#0A6459', ('dark', 'menthe'): '#5EE6D0',
    ('light', 'iris'): '#4540C8', ('dark', 'iris'): '#A9B2FF',
    ('light', 'crepuscule'): '#A63A1C', ('dark', 'crepuscule'): '#FF9C84',
    ('light', 'aurore'): '#0A6176', ('dark', 'aurore'): '#6FE3F5',
}

def primary(pg):
    return pg.evaluate("() => { const el = document.querySelector('[data-testid=\"preview-primary\"]'); return el ? getComputedStyle(el).backgroundColor : null }")

def ui_state(pg):
    return pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.ui') || '{}').state || {})")

def checked(pg, tid):
    return pg.evaluate(f"() => {{ const el = document.querySelector('[data-testid=\"{tid}\"]'); return el ? el.getAttribute('aria-checked') : null }}")

def login(ctx):
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    # Démo Premium (sinon une invitation Premium peut recouvrir l'écran pendant les clics)
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
      s.tables.subscriptions = (s.tables.subscriptions || []).filter((x) => x.user_id !== me);
      s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'aufildenous_premium_annual', store: 'test', period_type: 'annual', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    return pg

def scale_of(pg, tid):
    return pg.evaluate(f"""() => {{ const el = document.querySelector('[data-testid="{tid}"]'); if (!el) return null;
        const m = getComputedStyle(el).transform; if (!m || m === 'none') return 1; const v = m.match(/matrix\\(([^)]+)\\)/); return v ? parseFloat(v[1].split(',')[0]) : 1 }}""")

def opacity_of(pg, tid):
    return pg.evaluate(f"() => {{ const el = document.querySelector('[data-testid=\"{tid}\"]'); return el ? parseFloat(getComputedStyle(el).opacity) : null }}")

def run(p):
    b = p.chromium.launch(executable_path=EXE)
    # ---------------------------------------------------------------- mouvement complet
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, reduced_motion='no-preference')
    pg = login(ctx)
    pg.goto(B + '/settings'); pg.wait_for_timeout(3000)
    R['entree_reglages'] = pg.locator('[data-testid="settings-appearance"]').count() == 1
    pg.locator('[data-testid="settings-appearance"]').first.click(); pg.wait_for_timeout(2500)
    R['ecran_apparence'] = '/settings/appearance' in pg.url and pg.locator('[data-testid="palette-auto"]').count() == 1
    R['auto_par_defaut'] = checked(pg, 'palette-auto') == 'true'

    pg.locator('[data-testid="appearance-dark"]').first.click(); pg.wait_for_timeout(400)
    pg.locator('[data-testid="palette-menthe"]').first.click(); pg.wait_for_timeout(400)
    R['apercu_immediat_sombre_menthe'] = primary(pg) == hex_rgb(PRIMARY[('dark', 'menthe')])
    R['fond_graphite'] = pg.locator('[data-testid="bg-night"]').count() >= 1
    R['menthe_cochee'] = checked(pg, 'palette-menthe') == 'true' and checked(pg, 'palette-auto') == 'false'
    pg.screenshot(path=f'{SHOTS}/apparence_sombre_menthe.png')

    pg.locator('[data-testid="appearance-light"]').first.click(); pg.wait_for_timeout(400)
    R['apercu_immediat_clair_menthe'] = primary(pg) == hex_rgb(PRIMARY[('light', 'menthe')])
    pg.locator('[data-testid="palette-iris"]').first.click(); pg.wait_for_timeout(400)
    R['apercu_immediat_clair_iris'] = primary(pg) == hex_rgb(PRIMARY[('light', 'iris')])

    # persistance après rechargement
    pg.reload(); pg.wait_for_timeout(4000)
    st = ui_state(pg)
    R['persistance_stockage'] = st.get('themePreference') == 'light' and st.get('palettePreference') == 'iris'
    R['persistance_affichage'] = primary(pg) == hex_rgb(PRIMARY[('light', 'iris')]) and checked(pg, 'palette-iris') == 'true'
    owner = st.get('appearanceOwner')
    R['preference_par_compte'] = bool(owner) and (st.get('appearanceByUser') or {}).get(owner) == {'theme': 'light', 'palette': 'iris'}

    # retour en Auto
    pg.locator('[data-testid="palette-back-auto"]').first.click(); pg.wait_for_timeout(500)
    R['retour_auto'] = checked(pg, 'palette-auto') == 'true' and ui_state(pg).get('palettePreference') == 'auto'
    pg.locator('[data-testid="auto-preview-dusk"]').first.click(); pg.wait_for_timeout(500)
    R['auto_fin_de_journee_crepuscule'] = primary(pg) == hex_rgb(PRIMARY[('light', 'crepuscule')])
    pg.locator('[data-testid="auto-preview-dawn"]').first.click(); pg.wait_for_timeout(500)
    R['auto_matin_menthe'] = primary(pg) == hex_rgb(PRIMARY[('light', 'menthe')])
    pg.screenshot(path=f'{SHOTS}/apparence_auto_matin.png')
    pg.locator('[data-testid="auto-preview-dawn"]').first.click(); pg.wait_for_timeout(300)  # retour à l'heure réelle
    pg.reload(); pg.wait_for_timeout(4000)
    R['auto_persiste'] = ui_state(pg).get('palettePreference') == 'auto' and checked(pg, 'palette-auto') == 'true'

    # mouvement complet : reflet et faisceau présents, coche en ressort
    R['mouvement_reflet_present'] = pg.locator('[data-testid="press-sheen"]').count() >= 1
    R['mouvement_faisceau_present'] = pg.locator('[data-testid="glow-beam"]').count() >= 1
    pg.locator('[data-testid="preview-task"]').first.click(); pg.wait_for_timeout(40)
    full_scale = scale_of(pg, 'completion-disc')
    pg.wait_for_timeout(120)
    full_glow = opacity_of(pg, 'completion-glow')
    R['mouvement_coche_animee'] = full_scale is not None and full_scale < 0.995
    R['mouvement_halo_validation'] = full_glow is not None and full_glow > 0.05
    pg.wait_for_timeout(1200)
    R['mouvement_halo_bref'] = (opacity_of(pg, 'completion-glow') or 0) < 0.02
    ctx.close()

    # ---------------------------------------------------------------- Réduire les animations
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, reduced_motion='reduce')
    pg = login(ctx)
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(3500)
    R['reduit_aucun_reflet'] = pg.locator('[data-testid="press-sheen"]').count() == 0
    R['reduit_aucun_faisceau'] = pg.locator('[data-testid="glow-beam"]').count() == 0
    pg.locator('[data-testid="preview-task"]').first.click(); pg.wait_for_timeout(40)
    R['reduit_coche_immediate'] = abs((scale_of(pg, 'completion-disc') or 0) - 1) < 1e-3 and (opacity_of(pg, 'completion-disc') or 0) > 0.99
    pg.wait_for_timeout(120)
    R['reduit_pas_de_halo'] = (opacity_of(pg, 'completion-glow') or 0) < 0.01
    pg.locator('[data-testid="palette-crepuscule"]').first.click(); pg.wait_for_timeout(50)
    R['reduit_changement_immediat'] = primary(pg) == hex_rgb(PRIMARY[('light', 'crepuscule')])  # Système → clair (Chromium)
    pg.screenshot(path=f'{SHOTS}/apparence_reduit.png')
    ctx.close()
    b.close()

with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'erreurs': errs[:5]}, ensure_ascii=False, indent=1))
