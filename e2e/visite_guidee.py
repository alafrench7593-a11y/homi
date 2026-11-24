"""
Visite guidée DANS l'application réelle (navigateur, démonstration sans compte, Premium actif) :
 - relance depuis Réglages (« Revoir la visite guidée »), puis les 7 étapes en faisant les VRAIS gestes :
   1 « Suivant » ; 2 clic sur un autre avatar (le profil change dans le magasin) ; 3 « Mes outils » puis la recherche
   « mon bébé se réveille la nuit » et un résultat ; 4 « Essayer sans enregistrer », bouton central « Ajouter », une
   action, « Enregistrer » dans le vrai formulaire — AUCUNE ligne créée dans la base de démonstration — puis retour ;
   5 étoile d'un outil ; 6 « Ouvrir l'agenda » ; 7 « Personnaliser » (éditeur ouvert, rien d'enregistré), fin de
   visite avec retrait du favori ajouté ;
 - à chaque étape : la découpe tombe sur l'élément réel (écart ≤ 3 px avec la marge prévue), la bulle ne le recouvre
   pas, le compteur « n sur 7 » est juste ; hors de la découpe, les touchers sont arrêtés ;
 - « Passer » jusqu'au bout ; « Plus tard » puis reprise par la carte de l'accueil À LA MÊME ÉTAPE ; carte masquable ;
   relance depuis la feuille de l'avatar ; « Réduire les animations » : aucune indication animée ;
 - captures de chaque étape à 390×844 et 320×568, clair et sombre, dans $TOUR_SHOTS.
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/visite/web
  python3 e2e/spa_server.py /tmp/visite/web 8941 &
  PW_CHROMIUM=/opt/pw-browsers/chromium E2E_URL=http://127.0.0.1:8941 TOUR_SHOTS=/tmp/visite/shots python3 e2e/visite_guidee.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
Le web ne prouve ni les gestes natifs, ni l'haptique, ni VoiceOver : à vérifier sur iPhone.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime  # noqa: E402
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8941')
SHOTS = os.environ.get('TOUR_SHOTS', '/tmp/visite/shots'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
R, errs = {}, []
fake = FakeSupabase()
QUICK_PREF = ['qa-diaper', 'qa-nap', 'qa-meal', 'qa-observation', 'qa-bottle', 'qa-mood', 'qa-period', 'qa-appointment', 'qa-shopping']


def new_ctx(b, w, h, scheme, reduced=False):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris', color_scheme=scheme,
                        reduced_motion='reduce' if reduced else 'no-preference', device_scale_factor=2)
    ctx.add_init_script("localStorage.getItem('toietmoi.ui') || localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0}))")
    pg = ctx.new_page()
    pg.route('http://sb.fake.test/**', fake.route)
    pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    pg.on('pageerror', lambda e: errs.append(f'{w}x{h} {scheme}: {str(e)[:200]}'))
    return ctx, pg


def tid(pg, t):
    # l'élément VISIBLE (un écran d'onglet quitté reste monté, caché, avec les mêmes identifiants)
    return pg.locator(f'[data-testid="{t}"]:visible').first


def visible(pg, t):
    loc = pg.locator(f'[data-testid="{t}"]')
    return any(loc.nth(i).is_visible() for i in range(loc.count()))


def first_visible(pg, sel):
    loc = pg.locator(sel)
    vh = pg.viewport_size['height']
    for i in range(loc.count()):
        b = loc.nth(i).bounding_box()
        if b and b['width'] > 0 and b['y'] >= 0 and b['y'] + b['height'] <= vh:
            return loc.nth(i)
    return None


def enter_demo(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4500)
    pg.evaluate(PREMIUM_ON)
    pg.goto(B + '/'); pg.wait_for_timeout(4000)


def demo_rows(pg):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1') || '{}'); const t = s.tables || {}; return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])); }")


def progress(pg):
    return tid(pg, 'tour-progress').inner_text().strip() if visible(pg, 'tour-progress') else ''


def wait_step(pg, n, timeout=6000):
    """Attend la bulle de l'étape n (« n sur 7 »)."""
    for _ in range(timeout // 150):
        if progress(pg) == f'{n} sur 7':
            pg.wait_for_timeout(700)  # découpe posée (ressort « panneau »)
            return True
        pg.wait_for_timeout(150)
    return False


DOCK = 76  # capsule de la barre d'onglets (60 + 2 × 4) + écart de 8 : la découpe s'arrête au-dessus sur un onglet


def hole_on(pg, target, tag, key, above_dock=False):
    """La découpe entoure l'élément (marge de 6 px + liseré de 2 px) et la bulle ne le recouvre pas."""
    # la découpe est posée quand deux mesures successives sont identiques (ressort terminé)
    prev = None
    for _ in range(20):
        pg.wait_for_timeout(150)
        cur = tid(pg, 'tour-hole').bounding_box()
        if cur and prev and all(abs(cur[k] - prev[k]) < 0.5 for k in cur):
            break
        prev = cur
    hb, bb = tid(pg, 'tour-hole').bounding_box(), tid(pg, 'tour-bubble').bounding_box()
    t = target.bounding_box() if target else None
    ok = bool(hb and t)
    if ok:
        vw, vh = pg.viewport_size['width'], pg.viewport_size['height']
        ex = {'x': max(2, t['x'] - 6) - 2, 'y': max(2, t['y'] - 6) - 2}
        ex['r'] = min(vw - 2, t['x'] + t['width'] + 6) + 2
        ex['b'] = min(vh - 2, t['y'] + t['height'] + 6) + 2
        if above_dock:
            ex['b'] = min(ex['b'], vh - DOCK + 2)
        got = {'x': hb['x'], 'y': hb['y'], 'r': hb['x'] + hb['width'], 'b': hb['y'] + hb['height']}
        ok = all(abs(got[k] - ex[k]) <= 3 for k in ['x', 'y', 'r']) and (abs(got['b'] - ex['b']) <= 3 or (above_dock and got['b'] <= vh - DOCK + 3))
        if not ok:
            errs.append(f'{tag} {key} découpe {got} attendue {ex}')
    covered = bool(bb and t) and not (bb['y'] >= t['y'] + t['height'] - 1 or bb['y'] + bb['height'] <= t['y'] + 1)
    if covered:
        errs.append(f'{tag} {key} bulle sur l’élément {bb} {t}')
    R[f'{tag}_{key}_decoupe_exacte'] = ok
    R[f'{tag}_{key}_bulle_ne_masque_pas'] = not covered


def shot(pg, tag, name):
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{SHOTS}/{tag}-{name}.png')


def blocked_outside(pg):
    """Un clic hors de la découpe n'atteint pas l'application (bande transparente au-dessus)."""
    vw = pg.viewport_size['width']
    hit = pg.evaluate(f"() => {{ const e = document.elementFromPoint({vw - 6}, 6); return e ? (e.closest('[data-testid]')?.getAttribute('data-testid') || '') : ''; }}")
    return hit.startswith('tour-block') or hit.startswith('tour-')


# Mesure de la REPRISE (carte « Reprendre la visite » de l'accueil) : temps entre l'appui et la découpe posée sur
# l'élément, sauts de la découpe, clignotements de la bulle. Échantillonnage à chaque image (requestAnimationFrame).
PROBE = """() => {
  const T = window.__tourProbe = { click: null, samples: [], bubble: [] };
  document.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('[data-testid="tour-resume-start"]')) T.click = performance.now(); }, true);
  const loop = () => {
    if (T.click != null) {
      const now = performance.now();
      const hs = [...document.querySelectorAll('[data-testid="tour-hole"]')];
      const h = hs.find((x) => x.getBoundingClientRect().width > 0);
      if (h) { const r = h.getBoundingClientRect(); T.samples.push([now - T.click, r.x, r.y, r.width, r.height, +getComputedStyle(h).opacity]); }
      else T.samples.push([now - T.click, 0, 0, 0, 0, 0]);
      const b = [...document.querySelectorAll('[data-testid="tour-bubble"]')].some((x) => x.getBoundingClientRect().width > 0 && getComputedStyle(x).opacity !== '0');
      const last = T.bubble[T.bubble.length - 1];
      if (!last || last[1] !== b) T.bubble.push([now - T.click, b]);
    }
    if (T.click == null || performance.now() - T.click < 2500) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}"""


def resume_delay(pg):
    """Délai (ms) appui → découpe posée (à 3 px de sa place finale, opaque), nombre de sauts (> 24 px), clignotements."""
    pg.wait_for_timeout(2600)
    T = pg.evaluate('() => window.__tourProbe')
    s = [x for x in T['samples'] if x[3] > 4 and x[5] > 0.5]
    if not s:
        return {'ms': None, 'sauts': None, 'clignotements': None}
    fin = s[-1]
    arrive = next(x[0] for x in s if all(abs(x[i] - fin[i]) <= 3 for i in (1, 2, 3, 4)))
    jumps = sum(1 for a, b in zip(s, s[1:]) if max(abs(a[i] - b[i]) for i in (1, 2)) > 24)
    flicker = max(0, sum(1 for x in T['bubble'] if x[1]) - 1)
    return {'ms': round(arrive), 'premiere_image': round(s[0][0]), 'sauts': jumps, 'clignotements': flicker}


def full_tour(b, w, h, scheme, main=False):
    tag = f'{w}x{h}-{scheme}'
    ctx, pg = new_ctx(b, w, h, scheme)
    enter_demo(pg)
    # ------------------------------------------------------------- relance depuis Réglages
    pg.goto(B + '/settings/help'); pg.wait_for_timeout(2500)
    tid(pg, 'settings-tour').scroll_into_view_if_needed(); tid(pg, 'settings-tour').click()
    R[f'{tag}_relance_reglages'] = wait_step(pg, 1) and pg.url.rstrip('/') in (B, B + '/app')
    # ------------------------------------------------------------- 1. accueil
    hole_on(pg, None if not visible(pg, 'home-card-next') else union_target(pg, ['home-card-next', 'home-card-quick']), tag, '1', above_dock=True)
    if main:
        R['1_bloque_hors_decoupe'] = blocked_outside(pg)
        R['1_boutons'] = all(visible(pg, x) for x in ['tour-later', 'tour-skip', 'tour-quit', 'tour-next'])
    shot(pg, tag, '1-accueil')
    tid(pg, 'tour-next').click()
    # ------------------------------------------------------------- 2. changer de profil (clic sur un autre avatar)
    R[f'{tag}_2_atteinte'] = wait_step(pg, 2)
    hole_on(pg, tid(pg, 'profile-switcher-row'), tag, '2')
    if main:
        R['2_main_qui_glisse'] = visible(pg, 'tour-hand-swipe')
    shot(pg, tag, '2-profil')
    ring = pg.evaluate("() => { const r = document.querySelector('[aria-selected=\"true\"][data-testid^=\"subject-\"]'); return r ? r.getAttribute('data-testid') : ''; }")
    other = [x for x in pg.locator('[data-testid^="subject-"]').evaluate_all("els => els.map(e => e.getAttribute('data-testid'))")
             if x not in (ring, 'subject-add', 'subject-me-avatar') and not x.endswith('-row')]
    # un enfant de la démonstration (Lina) : ses actions rapides mènent aux saisies du suivi
    lina = pg.locator('[data-testid^="subject-"]:visible').filter(has_text='Lina')
    if lina.count():
        lina.last.click()
    else:
        pg.locator(f'[data-testid="{other[0]}"]:visible').first.click()
    # ------------------------------------------------------------- 3. trouver un outil
    R[f'{tag}_3_avance_au_changement_de_profil'] = wait_step(pg, 3)
    hole_on(pg, tid(pg, 'home-tools-entry'), tag, '3a')
    shot(pg, tag, '3a-mes-outils')
    tid(pg, 'home-tools-entry').click(); pg.wait_for_timeout(1800)
    R[f'{tag}_3_recherche_designee'] = wait_step(pg, 3)
    hole_on(pg, tid(pg, 'tools-search'), tag, '3b')
    pg.locator('[data-testid="tools-search"] input, input[data-testid="tools-search"]').first.fill('mon bébé se réveille la nuit'); pg.wait_for_timeout(1200)
    shot(pg, tag, '3b-recherche')
    res = first_visible(pg, '[data-testid^="tool-row-press-"]')
    R[f'{tag}_3_resultat_dans_la_decoupe'] = res is not None
    if res is None:
        ctx.close(); return
    res.click(); pg.wait_for_timeout(900)
    # ------------------------------------------------------------- 4. enregistrer une action (exercice)
    R[f'{tag}_4_avance_a_l_ouverture_d_un_outil'] = progress_after_sheet(pg, 4)
    hole_on(pg, tid(pg, 'quick-add'), tag, '4')
    shot(pg, tag, '4a-ajouter')
    tid(pg, 'tour-practice').click(); pg.wait_for_timeout(400)
    before = demo_rows(pg)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1200)
    shot(pg, tag, '4b-feuille')
    pick = next((q for q in QUICK_PREF if visible(pg, q)), None)
    R[f'{tag}_4_action_choisie'] = pick is not None
    tid(pg, pick).click(); pg.wait_for_timeout(2200)
    R[f'{tag}_4_bandeau_exercice'] = visible(pg, 'practice-banner')
    shot(pg, tag, '4c-formulaire-exercice')
    save = first_visible(pg, '[data-testid="track-save"]') or pg.get_by_role('button', name=re.compile('^Enregistrer')).last
    try:
        save.scroll_into_view_if_needed(); save.click(); pg.wait_for_timeout(1500)
    except Exception as e:  # noqa: BLE001
        errs.append(f'{tag} enregistrer : {str(e)[:120]}')
    after = demo_rows(pg)
    R[f'{tag}_4_aucune_ligne_creee'] = after == before
    if after != before:
        errs.append(f'{tag} lignes créées : {[k for k in after if after.get(k) != before.get(k)]}')
    if '/track/' in pg.url or 'practice' in pg.content() and visible(pg, 'practice-banner'):
        pg.go_back(); pg.wait_for_timeout(1500)
    if not any(pg.url.rstrip('/').endswith(x) for x in ['', '/tools', '/health', '/baby', '/household']):
        pg.goto(B + '/tools'); pg.wait_for_timeout(1500)
    # ------------------------------------------------------------- 5. favori
    R[f'{tag}_5_atteinte_apres_formulaire'] = wait_step(pg, 5) or (visible(pg, 'tour-pill') and '5 sur 7' in tid(pg, 'tour-pill').inner_text())
    R[f'{tag}_5_rien_ecrit_apres_exercice'] = demo_rows(pg) == before
    if visible(pg, 'tour-pill'):
        shot(pg, tag, '5a-pastille')
        tid(pg, 'tour-pill-resume').click(); pg.wait_for_timeout(1800)
    elif visible(pg, 'tour-goto'):
        tid(pg, 'tour-goto').click(); pg.wait_for_timeout(1800)
    wait_step(pg, 5)
    star = first_visible(pg, '[data-testid^="tool-fav-"]')
    hole_on(pg, star, tag, '5')
    shot(pg, tag, '5b-etoile')
    favs_before = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.toolFavorites || []")
    star.click(); pg.wait_for_timeout(900)
    favs_after = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.toolFavorites || []")
    # ------------------------------------------------------------- 6. agenda
    R[f'{tag}_6_avance_au_favori'] = len(favs_after) == len(favs_before) + 1 and (wait_step(pg, 6, 1500) or visible(pg, 'tour-pill'))
    if visible(pg, 'tour-pill'):
        tid(pg, 'tour-pill-resume').click(); pg.wait_for_timeout(2000)
    wait_step(pg, 6)
    pg.wait_for_timeout(800)
    hole_on(pg, tid(pg, 'home-today-open-agenda'), tag, '6')
    shot(pg, tag, '6-agenda')
    tid(pg, 'home-today-open-agenda').click(); pg.wait_for_timeout(2200)
    R[f'{tag}_6_agenda_ouvert'] = '/calendar' in pg.url
    # ------------------------------------------------------------- 7. personnaliser
    if visible(pg, 'tour-pill'):
        shot(pg, tag, '7a-pastille-agenda')
        tid(pg, 'tour-pill-resume').click(); pg.wait_for_timeout(2000)
    R[f'{tag}_7_atteinte'] = wait_step(pg, 7)
    pg.wait_for_timeout(900)
    hole_on(pg, tid(pg, 'home-customize'), tag, '7')
    if main:
        R['7_main_qui_touche'] = visible(pg, 'tour-hand-tap')
    shot(pg, tag, '7b-personnaliser')
    layouts_before = pg.evaluate("() => JSON.stringify(JSON.parse(localStorage.getItem('toietmoi.ui')).state.homeLayouts || {})")
    tid(pg, 'home-customize').click(); pg.wait_for_timeout(1500)
    R[f'{tag}_7_fin_de_visite'] = visible(pg, 'tour-done') and visible(pg, 'home-editor')
    R[f'{tag}_7_rien_enregistre_dans_l_editeur'] = pg.evaluate("() => JSON.stringify(JSON.parse(localStorage.getItem('toietmoi.ui')).state.homeLayouts || {})") == layouts_before
    pg.wait_for_timeout(600)
    if main:
        R['7_editeur_main_qui_fait_glisser'] = visible(pg, 'tour-hand-drag') and visible(pg, 'tour-drag-hint')
    shot(pg, tag, '8-fin-editeur')
    if visible(pg, 'tour-remove-fav'):
        tid(pg, 'tour-remove-fav').click(); pg.wait_for_timeout(600)
        R[f'{tag}_favori_retire_a_la_fin'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.toolFavorites || []") == favs_before
    tid(pg, 'tour-finish').click(); pg.wait_for_timeout(500)
    R[f'{tag}_terminee'] = not visible(pg, 'tour-done') and not visible(pg, 'tour-overlay')
    ctx.close()


def union_target(pg, ids):
    """Rectangle englobant de plusieurs éléments (locator factice)."""
    boxes = [tid(pg, i).bounding_box() for i in ids if visible(pg, i)]
    boxes = [x for x in boxes if x]
    x, y = min(b['x'] for b in boxes), min(b['y'] for b in boxes)
    r, bt = max(b['x'] + b['width'] for b in boxes), max(b['y'] + b['height'] for b in boxes)
    vh = pg.viewport_size['height']
    bt = min(bt, y + vh * 0.55)

    class Box:
        def bounding_box(self):
            return {'x': x, 'y': y, 'width': r - x, 'height': bt - y}
    return Box()


def progress_after_sheet(pg, n):
    """L'outil s'ouvre sur sa fiche (feuille) : la visite est déjà passée à l'étape suivante ; on referme la fiche."""
    pg.wait_for_timeout(600)
    if visible(pg, 'sheet-backdrop'):
        pg.keyboard.press('Escape'); pg.wait_for_timeout(700)
    if visible(pg, 'sheet-backdrop'):
        tid(pg, 'sheet-backdrop').click(position={'x': 10, 'y': 10}); pg.wait_for_timeout(700)
    if '/tools' not in pg.url and pg.url.rstrip('/') != B:
        pg.go_back(); pg.wait_for_timeout(1500)
    return wait_step(pg, n)


def skip_later_resume(b):
    ctx, pg = new_ctx(b, 390, 844, 'light')
    enter_demo(pg)
    # relance depuis la feuille de l'avatar
    tid(pg, 'header-account').click(); pg.wait_for_timeout(900)
    tid(pg, 'account-sheet-tour').click(); pg.wait_for_timeout(1800)
    R['relance_feuille_avatar'] = wait_step(pg, 1)
    tid(pg, 'tour-next').click(); wait_step(pg, 2)
    # Plus tard → carte de reprise « 2 sur 7 » sur l'accueil
    tid(pg, 'tour-later').click(); pg.wait_for_timeout(800)
    R['plus_tard_ferme_la_visite'] = not visible(pg, 'tour-overlay')
    R['carte_reprise'] = visible(pg, 'tour-resume') and '2 sur 7' in tid(pg, 'tour-resume').inner_text()
    pg.screenshot(path=f'{SHOTS}/390x844-light-reprise-carte.png')
    # rechargement : la reprise survit (progression par compte, sur l'appareil)
    pg.reload(); pg.wait_for_timeout(4500)
    R['carte_reprise_apres_rechargement'] = visible(pg, 'tour-resume')
    pg.evaluate(PROBE)
    tid(pg, 'tour-resume-start').click()
    d = resume_delay(pg)
    R['reprise_mesure'] = d
    R['reprise_moins_de_300_ms'] = d['ms'] is not None and d['ms'] < 300
    R['reprise_sans_saut_ni_clignotement'] = d['sauts'] == 0 and d['clignotements'] == 0
    R['reprise_a_la_meme_etape'] = wait_step(pg, 2)
    # Passer jusqu'au bout
    for n in range(2, 8):
        if visible(pg, 'tour-skip'):
            tid(pg, 'tour-skip').click(); pg.wait_for_timeout(500)
        elif visible(pg, 'tour-pill-resume'):
            tid(pg, 'tour-pill-resume').click(); pg.wait_for_timeout(1500); tid(pg, 'tour-skip').click(); pg.wait_for_timeout(500)
    R['passer_jusqu_au_bout'] = visible(pg, 'tour-done')
    tid(pg, 'tour-finish').click(); pg.wait_for_timeout(400)
    # carte masquable : nouvelle visite, plus tard, masquer
    pg.goto(B + '/settings/help'); pg.wait_for_timeout(2000)
    tid(pg, 'settings-tour').scroll_into_view_if_needed(); tid(pg, 'settings-tour').click(); wait_step(pg, 1)
    tid(pg, 'tour-later').click(); pg.wait_for_timeout(600)
    tid(pg, 'tour-resume-hide').click(); pg.wait_for_timeout(500)
    R['carte_reprise_masquable'] = not visible(pg, 'tour-resume')
    # Quitter la visite : rien ne reste
    pg.goto(B + '/settings/help'); pg.wait_for_timeout(2000)
    tid(pg, 'settings-tour').scroll_into_view_if_needed(); tid(pg, 'settings-tour').click(); wait_step(pg, 1)
    tid(pg, 'tour-quit').click(); pg.wait_for_timeout(600)
    R['quitter'] = not visible(pg, 'tour-overlay') and not visible(pg, 'tour-resume')
    # Élément hors de l'écran (pastille) : l'écran reste utilisable, rien n'arrête les touchers
    pg.goto(B + '/settings/help'); pg.wait_for_timeout(2000)
    tid(pg, 'settings-tour').scroll_into_view_if_needed(); tid(pg, 'settings-tour').click(); wait_step(pg, 1)
    # navigation DANS l'application (un rechargement de page vaut une fermeture : la visite passe « plus tard »)
    pg.go_back(); pg.wait_for_timeout(2000)  # retour système vers Réglages : jamais bloqué par la visite
    # Règle du 22/11 : quitter l'écran de l'étape met la visite en pause (pastille si elle n'y était pas encore)
    R['autre_ecran_pastille_sans_voile'] = not visible(pg, 'tour-veil') and (visible(pg, 'tour-pill') or not visible(pg, 'tour-overlay'))
    if visible(pg, 'tour-pill-later'): tid(pg, 'tour-pill-later').click(); pg.wait_for_timeout(400)
    # Aide contextuelle à la première ouverture d'un outil : une bulle, une seule fois
    pg.goto(B + '/tools'); pg.wait_for_timeout(2500)
    # la tuile peut être sous la ligne de flottaison (favoris, récents, « Pour ma grossesse » au-dessus)
    pg.locator('[data-testid^="tools-featured-"]').first.evaluate("e => e.scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(600)
    tile = first_visible(pg, '[data-testid^="tools-featured-"]')
    tile.click(); pg.wait_for_timeout(900)
    tid(pg, 'tool-sheet-start').click(); pg.wait_for_timeout(1800)
    R['aide_premiere_ouverture'] = visible(pg, 'tool-hint') and len(tid(pg, 'tool-hint-body').inner_text().strip()) > 10
    pg.screenshot(path=f'{SHOTS}/390x844-light-aide-premiere-ouverture.png')
    tid(pg, 'tool-hint-ok').click(); pg.wait_for_timeout(400)
    pg.go_back(); pg.wait_for_timeout(1500)
    tile = first_visible(pg, '[data-testid^="tools-featured-"]')
    tile.click(); pg.wait_for_timeout(1500)
    if visible(pg, 'tool-sheet-start'):
        tid(pg, 'tool-sheet-start').click(); pg.wait_for_timeout(1500)
    R['aide_une_seule_fois'] = not visible(pg, 'tool-hint')
    ctx.close()


def reduced(b):
    ctx, pg = new_ctx(b, 390, 844, 'light', reduced=True)
    enter_demo(pg)
    pg.goto(B + '/settings/help'); pg.wait_for_timeout(2000)
    tid(pg, 'settings-tour').scroll_into_view_if_needed(); tid(pg, 'settings-tour').click(); wait_step(pg, 1)
    tid(pg, 'tour-next').click(); wait_step(pg, 2)
    # reprise en animations réduites : découpe posée en moins de 100 ms
    tid(pg, 'tour-later').click(); pg.wait_for_timeout(800)
    pg.evaluate(PROBE)
    tid(pg, 'tour-resume-start').click()
    d = resume_delay(pg)
    R['reprise_reduite_mesure'] = d
    R['reprise_reduite_moins_de_100_ms'] = d['ms'] is not None and d['ms'] < 100
    wait_step(pg, 2)
    R['reduire_animations_aucune_main'] = not visible(pg, 'tour-hand-swipe') and visible(pg, 'tour-hole')
    pg.screenshot(path=f'{SHOTS}/390x844-light-reduire-animations-profil.png')
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    CONFIGS = [(390, 844, 'light'), (390, 844, 'dark'), (320, 568, 'light'), (320, 568, 'dark')]
    ONLY = os.environ.get('TOUR_ONLY')  # mise au point : « 390x844-light », ou « none » (seulement reprise / réduire)
    if ONLY:
        CONFIGS = [c for c in CONFIGS if f'{c[0]}x{c[1]}-{c[2]}' == ONLY]
    for i, (w, h, s) in enumerate(CONFIGS):
        try:
            full_tour(b, w, h, s, main=i == 0)
        except Exception as e:  # noqa: BLE001
            R[f'parcours_{w}x{h}_{s}'] = False
            errs.append(f'{w}x{h} {s}: {str(e)[:300]}')
    extra = [] if os.environ.get('TOUR_SKIP_EXTRA') else [('passer_plus_tard_reprise', skip_later_resume), ('reduire_animations', reduced)]
    for key, fn in extra:
        try:
            fn(b)
        except Exception as e:  # noqa: BLE001
            R[key] = False
            errs.append(f'{key} : {str(e)[:1500]}')
    b.close()

print(json.dumps({'rapport': R, 'erreurs': errs}, ensure_ascii=False, indent=1))
