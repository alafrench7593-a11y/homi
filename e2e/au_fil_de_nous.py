"""
« Au fil de nous » dans le navigateur (démonstration, sans compte) :
 · fond rose poudré le jour, bleu nuit et prune la nuit (jamais noir) ;
 · accueil : l'illustration de l'étape du profil affiché (femme seule, grossesse, Lina, Noé, famille) ;
 · présentation : l'illustration évolue avec le défilement, jusqu'aux dix ans.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e'); os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
INIT = """(() => { try { const p = sessionStorage.getItem('__patch'); if (!p) return; const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); Object.assign(ui.state, JSON.parse(p)); localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); } catch (e) {} })()"""

def rgb(pg, testid):
    return pg.evaluate(f"() => {{ const el = document.querySelector('[data-testid=\"{testid}\"]'); return el ? getComputedStyle(el).backgroundColor : null }}")

def caption(pg):
    t = pg.locator('[data-testid="home-story-caption"]').all_inner_texts()
    return t[0] if t else ''

def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    ctx.add_init_script(INIT)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate("p => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': 'light'})
    pg.goto(B + '/'); pg.wait_for_timeout(4000)
    R['fond_rose_poudre'] = rgb(pg, 'bg-powder') == 'rgb(242, 221, 216)'
    R['nom_au_fil_de_nous'] = 'Au fil de nous' in pg.inner_text('body')
    kids = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return s.tables.children.map(c => [c.id, c.first_name]); }")
    seen = {}
    for key in ['me'] + [k[0] for k in kids] + ['family', 'preg']:
        pg.locator('[aria-label^="Profil affiché"]').first.click(); pg.wait_for_timeout(700)
        pg.locator(f'[data-testid="subject-{key}"]').first.click(); pg.wait_for_timeout(2600)
        seen[key] = caption(pg)
    names = {k[0]: k[1] for k in kids}
    R['accueil_femme_seule_pour_moi'] = seen['me'] == 'Votre histoire, à votre rythme'
    R['accueil_grossesse_semaine'] = seen['preg'].startswith('Le ventre s’arrondit · ') and 'SA' in seen['preg']
    R['accueil_age_de_chaque_enfant'] = all(seen[i].startswith(n + ',') for i, n in names.items())
    R['accueil_famille'] = seen['family'] == 'Toute la famille'
    R['illustration_annoncee'] = pg.locator('[data-testid="home-story-art"][aria-label^="Illustration"]').count() == 1
    box = pg.locator('[data-testid="home-story"]').bounding_box()
    R['bandeau_discret'] = box is not None and box['height'] <= 140
    pg.screenshot(path=f'{SHOTS}/afdn_accueil.png')
    # nuit : bleu nuit et prune, jamais noir
    pg.evaluate("p => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': 'dark'})
    pg.goto(B + '/'); pg.wait_for_timeout(4000)
    R['nuit_bleu_nuit'] = rgb(pg, 'bg-night') == 'rgb(31, 35, 68)'
    pg.screenshot(path=f'{SHOTS}/afdn_nuit.png')
    pg.evaluate("p => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': 'light'})
    # présentation
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    pg.locator('[data-testid="home-story"]').first.click(); pg.wait_for_timeout(2500)
    R['presentation_ouverte'] = '/story' in pg.url
    label = lambda: pg.locator('[data-testid="story-art"] [role="img"]').first.get_attribute('aria-label') or ''
    first = label()
    pg.mouse.move(195, 700)
    for _ in range(60): pg.mouse.wheel(0, 120); pg.wait_for_timeout(40)
    pg.wait_for_timeout(1200)
    last = label()
    R['presentation_debut_femme_seule'] = 'femme seule' in first
    R['presentation_fin_main_dans_la_main'] = 'main dans la main' in last
    pg.screenshot(path=f'{SHOTS}/afdn_presentation_fin.png')
    b.close()

with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append(f'exception: {str(e)[:300]}')
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
bad = [k for k, v in R.items() if v is not True]
print('ÉCHECS :', bad)
sys.exit(1 if bad or errs else 0)
