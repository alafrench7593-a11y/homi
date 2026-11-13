"""
Outil pilote « Humeur → journal » (refonte v3, 13/11/2026), démo web, petit écran 320 × 568.
Parcours complet : choisir une humeur (la lumière se déplace sous l'orbe choisi, la saisie apparaît) → saisir une
note → enregistrer (double clic : un seul bilan) → confirmation selon le résultat réel → la note est dans l'historique
→ ouvrir le détail (transition carte → détail) → revenir ; puis journal : humeur d'abord, la page s'ouvre, garder la
page, la retrouver dans « Mes pages », ouvrir son détail, revenir.
Variantes : sombre / clair × Turquoise / Crépuscule, texte agrandi 1,3 (sans débordement horizontal), Réduire les
animations (détail affiché sans fantôme ni fondu). Captures deviceScaleFactor 2.
Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-p1/dist
  python3 e2e/spa_server.py /tmp/homi-p1/dist 8931 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8931 E2E_SHOTS=/tmp/homi-p1/shots python3 e2e/humeur_journal_v3.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8931')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-p1/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [EXE])[0]
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

# Apparence par compte : appliquée avant le chargement de l'application (préférences de l'interface)
INIT = """(() => { try { const p = sessionStorage.getItem('__patch'); if (!p) return; const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{"state":{},"version":0}'); const P = JSON.parse(p); Object.assign(ui.state, P); if (ui.state.appearanceOwner) { ui.state.appearanceByUser = ui.state.appearanceByUser || {}; ui.state.appearanceByUser[ui.state.appearanceOwner] = { theme: P.themePreference, palette: P.palettePreference }; } localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); } catch (e) {} })()"""
ZOOM_TEXT = """() => { for (const el of document.querySelectorAll('div[dir], span, div')) {
  if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
  const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); if (!fs || el.dataset.z) continue;
  el.dataset.z = '1'; el.style.fontSize = (fs * 1.3) + 'px'; const lh = parseFloat(cs.lineHeight); if (lh) el.style.lineHeight = (lh * 1.3) + 'px'; } }"""


# Deux bilans RÉELS des jours précédents (sans texte) : la tuile de la semaine peut tracer son micrographique
SEED = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  const mk = (n, mood) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(9, 0, 0, 0); return { id: 'e2e-mood-' + n, user_id: me, checked_at: d.toISOString(), mood, feelings: ['Fatigue'], safety_concern: false, journal: null }; };
  s.tables.mood_checkins = [...(s.tables.mood_checkins || []).filter((m) => m.user_id !== me), mk(2, 3), mk(4, 2)];
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }"""


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def shot(pg, name, wait=500):
    pg.wait_for_timeout(wait)
    pg.evaluate("() => window.getSelection() && window.getSelection().removeAllRanges()")
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def rows(pg):
    s = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")
    me = s['session']['userId']
    return [m for m in s['tables'].get('mood_checkins', []) if m['user_id'] == me]


def no_hscroll(pg):
    return pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1")


def in_view(pg, loc):
    if not loc.count():
        return False
    b = loc.bounding_box()
    return bool(b) and b['y'] >= 0 and b['y'] + b['height'] <= pg.viewport_size['height'] + 1


def start(ctx, theme='dark', palette='turquoise'):
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON)
    pg.evaluate(SEED)
    appearance(pg, theme, palette)
    return pg


def appearance(pg, theme, palette):
    pg.evaluate("(p) => sessionStorage.setItem('__patch', JSON.stringify(p))", {'themePreference': theme, 'palettePreference': palette})


def go(pg, path, wait=3200, zoom=False):
    pg.goto(B + path); pg.wait_for_timeout(wait)
    if zoom:
        pg.evaluate(ZOOM_TEXT); pg.wait_for_timeout(300)


def journey(pg, tag, zoom=False, reduced=False):
    note = f'Promenade au soleil ({tag}).'
    page_txt = f'Premiers pas de Léa ({tag}).'
    k = lambda n: f'{tag}_{n}'  # noqa: E731

    # 1. Entrée : question + orbes, aucune saisie avant le choix, pas de bouton principal
    go(pg, '/me/mood', zoom=zoom)
    R[k('entree_sans_saisie')] = tid(pg, 'mood-details').count() == 0 and tid(pg, 'mood-main-action').get_attribute('aria-disabled') == 'true'
    R[k('orbes_radio')] = pg.locator('[data-testid="mood-group"] [role="radio"]').count() == 5
    shot(pg, f'{tag}-01-entree')

    # 2. Choisir : la lumière se pose sous l'orbe choisi, le libellé explicite s'affiche, la saisie apparaît
    tid(pg, 'mood-4').click(); pg.wait_for_timeout(250)
    if not reduced:
        shot(pg, f'{tag}-02a-choix-en-cours', wait=0)
    pg.wait_for_timeout(700)
    if zoom:
        pg.evaluate(ZOOM_TEXT)
    R[k('saisie_apparait')] = tid(pg, 'mood-details').count() > 0
    R[k('libelle_explicite')] = 'Aujourd’hui : Plutôt bien' in tid(pg, 'mood-chosen').inner_text()
    light = pg.locator('[data-testid="choice-light"]').first
    orb = tid(pg, 'mood-4')
    lb, ob = light.bounding_box(), orb.bounding_box()
    R[k('lumiere_sous_le_choix')] = bool(lb and ob) and abs((lb['x'] + lb['width'] / 2) - (ob['x'] + ob['width'] / 2)) < 6
    tid(pg, 'mood-2').click(); pg.wait_for_timeout(900)
    lb2, ob2 = light.bounding_box(), tid(pg, 'mood-2').bounding_box()
    R[k('lumiere_se_deplace')] = bool(lb2 and ob2) and abs((lb2['x'] + lb2['width'] / 2) - (ob2['x'] + ob2['width'] / 2)) < 6 and lb2['x'] < lb['x']
    tid(pg, 'mood-4').click(); pg.wait_for_timeout(700)
    shot(pg, f'{tag}-02-choix')

    # 3. Saisir : bouton principal pleine largeur, visible, libellé explicite
    field = pg.locator('[data-testid="mood-note"]').filter(visible=True).first
    field.scroll_into_view_if_needed(); field.click(); field.fill(note)
    btn = tid(pg, 'mood-main-action')
    R[k('bouton_visible_pendant_saisie')] = in_view(pg, btn) and 'Plutôt bien' in btn.inner_text()
    bw = btn.bounding_box()['width']
    R[k('bouton_pleine_largeur')] = bw >= 320 - 2 * 24 - 2
    shot(pg, f'{tag}-03-saisie')

    # 4. Enregistrer (double clic) → un seul bilan, confirmation réelle
    before = len(rows(pg))
    btn.dblclick(); pg.wait_for_timeout(250)
    R[k('largeur_stable_pendant_envoi')] = abs((tid(pg, 'mood-main-action').bounding_box() or {'width': bw})['width'] - bw) < 1 if tid(pg, 'mood-main-action').count() else True
    pg.wait_for_timeout(1500)
    saved = [m for m in rows(pg) if m.get('journal') == note]
    R[k('un_seul_bilan')] = len(saved) == 1 and len(rows(pg)) == before + 1 and saved[0]['mood'] == 4
    R[k('confirmation_reelle')] = tid(pg, 'mood-result-sent').count() > 0 and 'Bilan enregistré' in tid(pg, 'mood-result-sent').inner_text()
    R[k('composeur_referme')] = tid(pg, 'mood-details').count() == 0
    R[k('confirmation_visible')] = in_view(pg, tid(pg, 'mood-result-sent'))
    shot(pg, f'{tag}-04-resultat')
    week = tid(pg, 'mood-week')
    week.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    R[k('semaine_reelle')] = '3' in week.inner_text() and pg.locator('[data-testid="mood-week"] [data-testid="sparkline"], [data-testid="sparkline"]').count() > 0
    shot(pg, f'{tag}-04b-semaine')

    # 5. Historique : la note est dans la liste (surface mate), tuiles de la semaine
    entry = pg.locator('[data-testid="mood-entry"]').filter(has_text=note).first
    entry.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    R[k('dans_historique')] = entry.count() > 0
    R[k('tuile_semaine')] = tid(pg, 'mood-week').count() > 0
    R[k('sans_debordement_humeur')] = no_hscroll(pg)
    shot(pg, f'{tag}-05-historique')

    # 6. Détail (transition carte → détail), puis retour
    entry.click()
    if not reduced:
        try:
            pg.wait_for_selector('[data-testid="morph-ghost"]', state='attached', timeout=900)
            R[k('morph_fantome')] = True
            pg.wait_for_timeout(120)
        except Exception:
            R[k('morph_fantome')] = False
        shot(pg, f'{tag}-06a-morph', wait=0)
        pg.wait_for_timeout(1300)
        R[k('morph_fantome_retire')] = pg.locator('[data-testid="morph-ghost"]').count() == 0
    else:
        pg.wait_for_timeout(120)
        R[k('reduit_sans_fantome')] = pg.locator('[data-testid="morph-ghost"]').count() == 0
        R[k('reduit_detail_immediat')] = '/me/mood/' in pg.url and pg.evaluate("() => { const e = [...document.querySelectorAll('[data-testid=\"mood-detail\"]')].pop(); return !!e && parseFloat(getComputedStyle(e).opacity) > 0.99; }")
        pg.wait_for_timeout(800)
    if zoom:
        pg.evaluate(ZOOM_TEXT); pg.wait_for_timeout(300)
    R[k('detail_ouvert')] = '/me/mood/' in pg.url and note in tid(pg, 'mood-detail').inner_text()
    R[k('sans_debordement_detail')] = no_hscroll(pg)
    shot(pg, f'{tag}-06-detail')
    pg.get_by_role('button', name='Retour').filter(visible=True).first.click(); pg.wait_for_timeout(1600)
    R[k('retour_liste')] = pg.url.rstrip('/').endswith('/me/mood') and pg.locator('[data-testid="mood-entry"]').filter(has_text=note).count() > 0
    shot(pg, f'{tag}-07-retour')

    # 7. Journal : humeur d'abord → la page s'ouvre → garder → « Mes pages » → détail → retour
    go(pg, '/me/diary', zoom=zoom)
    R[k('journal_sans_champ_avant_choix')] = tid(pg, 'diary-text').count() == 0
    shot(pg, f'{tag}-08-journal')
    tid(pg, 'diary-mood-5').click(); pg.wait_for_timeout(700)
    t = pg.locator('[data-testid="diary-text"]').filter(visible=True).first
    R[k('journal_champ_apparait')] = t.count() > 0
    t.click(); t.fill(page_txt)
    R[k('journal_bouton_visible')] = in_view(pg, tid(pg, 'diary-save'))
    shot(pg, f'{tag}-09-journal-saisie')
    before = len(rows(pg))
    tid(pg, 'diary-save').dblclick(); pg.wait_for_timeout(1600)
    R[k('journal_une_page')] = len([m for m in rows(pg) if m.get('journal') == page_txt]) == 1 and len(rows(pg)) == before + 1
    R[k('journal_confirmation')] = tid(pg, 'diary-result-sent').count() > 0
    shot(pg, f'{tag}-10-journal-garde')
    pg_row = pg.locator('[data-testid="diary-page"]').filter(has_text=page_txt).first
    pg_row.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    R[k('journal_dans_mes_pages')] = pg_row.count() > 0
    R[k('sans_debordement_journal')] = no_hscroll(pg)
    shot(pg, f'{tag}-11-mes-pages')
    pg_row.click(); pg.wait_for_timeout(1500)
    R[k('journal_detail')] = page_txt in tid(pg, 'mood-detail').inner_text()
    shot(pg, f'{tag}-12-page-detail')
    pg.get_by_role('button', name='Retour').filter(visible=True).first.click(); pg.wait_for_timeout(1500)
    R[k('journal_retour')] = pg.url.rstrip('/').endswith('/me/diary')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    for theme, pal in [('dark', 'turquoise'), ('light', 'turquoise'), ('dark', 'crepuscule'), ('light', 'crepuscule')]:
        ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
        ctx.add_init_script(INIT)
        pg = start(ctx, theme, pal)
        journey(pg, f'{theme}-{pal}')
        ctx.close()
    # texte agrandi 1,3
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
    ctx.add_init_script(INIT)
    journey(start(ctx, 'light', 'turquoise'), 'zoom13', zoom=True)
    ctx.close()
    # Réduire les animations
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, reduced_motion='reduce')
    ctx.add_init_script(INIT)
    journey(start(ctx, 'dark', 'turquoise'), 'reduit', reduced=True)
    ctx.close()
    b.close()

R['erreurs'] = errs[:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
bad = [key for key, v in R.items() if key != 'erreurs' and v is not True]
print('ECHECS', bad)
sys.exit(1 if bad or errs else 0)
