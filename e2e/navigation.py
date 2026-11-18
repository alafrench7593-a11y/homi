"""
Navigation HOMI (refonte du 17/11/2026) : 4 onglets — Aujourd'hui · Moi · Enfant · Famille — autour de l'ACTION RAPIDE
CENTRALE (« Ajouter » : feuille de 4 à 6 actions du profil ; « Publier » sur Communauté). « Outils » : entrée fixe en
tête d'Aujourd'hui et dans la feuille centrale. Communauté : bouton nommé en haut à droite des écrans d'onglet (hors
barre). Avatar en haut à droite : feuille « Mon compte » (Mon profil, Réglages, Urgences) — plus de bouton Réglages
dans l'en-tête (21/11/2026). Routes d'onglet hors barre (/community, /track, /ask, /agenda) : valides, avec un
bouton Retour, et l'onglet parent allumé. Sélecteur de profil universel : avatars, glissement, indicateur de pages.
Version web de démonstration (sans compte), servie par spa_server.py :
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/navigation.py
Navigateur : celui de Playwright, ou PW_CHROMIUM=/chemin/vers/chrome (ex. /opt/pw-browsers/chromium).
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import ensure, PREMIUM_ON, SET_BODY  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
def _dump_on_error(kind, value, tb):
    # En cas d'arrêt inattendu : le rapport partiel est quand même affiché (pour savoir où l'on en était)
    print(json.dumps({**R, 'erreurs': errs, 'arret': str(value)[:300]}, ensure_ascii=False, indent=1))
    sys.__excepthook__(kind, value, tb)


sys.excepthook = _dump_on_error
TABS_FR = ['Aujourd’hui', 'Moi', 'Enfant', 'Famille']


def tabs(pg):
    return [t.get_attribute('aria-label') for t in pg.locator('[role="tab"][data-testid^="tab-"]').all()]


def tid(pg, t):
    """Élément visible portant ce testID ; s'il y en a plusieurs (un onglet inactif reste monté sous l'écran affiché),
    celui qui est réellement au premier plan (touchable en son centre)."""
    loc = pg.locator(f'[data-testid="{t}"]').filter(visible=True)
    n = loc.count()
    if n > 1:
        for i in range(n):
            if loc.nth(i).evaluate("e => { const r = e.getBoundingClientRect(); const x = r.x + r.width / 2, y = r.y + r.height / 2; const h = document.elementFromPoint(x, y); return !!h && (e.contains(h) || h.contains(e)) && y >= 0 && y <= innerHeight }"):
                return loc.nth(i)
    return loc.first


def selected(pg, name):
    return pg.get_by_role('tab', name=name).get_attribute('aria-selected') == 'true'


def header_ok(pg, avatar_name=re.compile('^(Mon profil|My profile)'), community=True):
    """Communauté (nommée) et avatar présents dans le coin supérieur droit, cibles ≥ 44 px, sans chevauchement (ni
    entre eux, ni avec le sélecteur de profil) ; plus de bouton Réglages dans l'en-tête (il est dans la feuille de l'avatar)."""
    a = pg.get_by_role('button', name=avatar_name).filter(visible=True).first
    if not a.count(): return False
    ba = a.bounding_box()
    w = pg.viewport_size['width']
    no_settings = pg.locator('[data-testid="header-settings"]').filter(visible=True).count() == 0
    ok = bool(ba and ba['y'] < 140 and ba['x'] > w * 0.6 and ba['x'] + ba['width'] <= w and no_settings)
    if not community: return ok
    c = pg.locator('[data-testid="header-community"]').filter(visible=True).first
    if not c.count(): return False
    bc = c.bounding_box()
    name_ok = c.get_attribute('aria-label') in ('Communauté', 'Community')
    sw = pg.locator('[data-testid="profile-switcher"], [data-testid$="-profiles"]').filter(visible=True).first
    bw = sw.bounding_box() if sw.count() else None
    clear_switcher = (not bw) or bc['y'] + bc['height'] <= bw['y'] + 1
    return bool(ok and name_ok and bc['width'] >= 44 and bc['height'] >= 44 and bc['y'] < 140 and bc['x'] >= w * 0.3 and bc['x'] + bc['width'] <= ba['x'] + 1
                and bc['x'] + bc['width'] <= w and clear_switcher)


def open_account_sheet(pg):
    """Appui sur l'avatar : la feuille « Mon compte » s'ouvre (Mon profil, Réglages, Urgences)."""
    tid(pg, 'header-account').click(); pg.wait_for_timeout(1200)
    return pg.locator('[data-testid="account-sheet"]').filter(visible=True).count() == 1


LAST_ABOVE_BAR = """() => {
  // Écran au premier plan : la zone qui défile visible ; on la fait défiler jusqu'en bas, puis on compare le bas de son
  // DERNIER élément au haut de la barre de verre (qui flotte au-dessus du contenu)
  const vis = (e) => { const r = e.getBoundingClientRect(); return e.offsetParent !== null && r.width > 0 && r.height > 0; };
  const bar = [...document.querySelectorAll('[data-testid="tab-bar-glass-glass"]')].find(vis);
  const sc = [...document.querySelectorAll('[data-testid="screen-scroll"]')].filter(vis).pop();
  if (!bar || !sc) return { ok: false, why: 'absent' };
  sc.scrollTop = sc.scrollHeight;
  const inner = sc.firstElementChild || sc;
  const kids = [...inner.children].filter(vis);
  const last = kids[kids.length - 1];
  if (!last) return { ok: false, why: 'vide' };
  const top = bar.getBoundingClientRect().top, bottom = last.getBoundingClientRect().bottom;
  return { ok: bottom <= top - 4, bottom: Math.round(bottom), barTop: Math.round(top) };
}"""


def last_above_bar(pg):
    """Défile jusqu'en bas de l'écran affiché : le dernier élément est-il entièrement au-dessus de la barre flottante ?"""
    pg.evaluate(LAST_ABOVE_BAR); pg.wait_for_timeout(500)
    return pg.evaluate(LAST_ABOVE_BAR)


def active_profile(pg):
    """Nom accessible du profil affiché dans le sélecteur universel de l'écran au premier plan (un onglet inactif reste
    monté, figé, sous l'écran affiché : on ne lit pas le sien)."""
    return pg.evaluate("""() => { const top = (e) => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (e.contains(h) || h.contains(e)); };
      const all = [...document.querySelectorAll('[role="radio"][aria-checked="true"]')].filter(e => e.offsetParent !== null);
      const a = all.find(top) || all[all.length - 1]; return a ? a.getAttribute('aria-label') : null; }""")


def pager_index(pg):
    return pg.evaluate("""() => { const p = [...document.querySelectorAll('[data-testid="profile-pager"]')].find(e => e.offsetParent !== null); if (!p) return -1;
      return [...p.children].findIndex(d => d.getAttribute('data-testid') === 'profile-pager-active'); }""")


def swipe(pg, direction, y=None):
    """Glissement horizontal à la souris sur le tableau de bord (hors bord gauche) : -1 = vers la gauche (profil suivant)."""
    w, h = pg.viewport_size['width'], pg.viewport_size['height']
    bb = pg.locator('[data-testid="profile-swipe"]').filter(visible=True).first.bounding_box()
    y = y or min(h - 110, max(bb['y'] + 70, h * 0.62))
    x0, x1 = (w * 0.8, w * 0.25) if direction < 0 else (w * 0.3, w * 0.85)
    pg.mouse.move(x0, y); pg.mouse.down(); pg.mouse.move((x0 + x1) / 2, y, steps=6); pg.mouse.move(x1, y, steps=6); pg.mouse.up(); pg.wait_for_timeout(1200)


def bar_metrics(pg):
    """Géométrie de la barre : onglets, bouton d'action, tailles et coupure des libellés."""
    return pg.evaluate("""() => {
      const tabs = [...document.querySelectorAll('[role="tab"][data-testid^="tab-"]')].filter(t => t.offsetParent !== null);
      const act = [...document.querySelectorAll('[data-testid="quick-add"],[data-testid="community-publish"],[data-testid="cocoon-add"]')].find(e => e.offsetParent !== null);
      const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
      return {
        tabs: tabs.map(t => {
          const label = [...t.querySelectorAll('div,span')].filter(e => e.childElementCount === 0 && e.textContent.trim()).pop();
          return { ...box(t), label: label ? label.textContent : '', size: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
                   cut: label ? label.scrollWidth > label.clientWidth + 0.5 : true };
        }),
        action: act ? { ...box(act), id: act.getAttribute('data-testid') } : null,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    }""")


def open_demo(pg):
    """Démo sans compte, Premium actif (sinon l'écran « Cet espace fait partie de Premium » couvre tout)."""
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON); pg.reload(); pg.wait_for_timeout(3500)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    open_demo(pg)

    # 1. Barre : 4 onglets dans l'ordre, action rapide AU CENTRE (entre le 2e et le 3e onglet), sur la même ligne
    R['1_barre_4_onglets'] = tabs(pg) == TABS_FR
    m = bar_metrics(pg)
    t = m['tabs']
    R['1_action_au_centre'] = bool(m['action'] and len(t) == 4 and abs(m['action']['x'] + m['action']['w'] / 2 - 195) <= 2
                                   and t[1]['x'] + t[1]['w'] <= m['action']['x'] + 1 and m['action']['x'] + m['action']['w'] <= t[2]['x'] + 1
                                   and abs((m['action']['y'] + m['action']['h'] / 2) - (t[0]['y'] + t[0]['h'] / 2)) < 6)
    R['1_action_nom_accessible'] = tid(pg, 'quick-add').get_attribute('aria-label') == 'Ajouter' and m['action']['w'] >= 48
    R['1_libelles_12px_390'] = all(x['size'] >= 12 and not x['cut'] for x in t)
    # Communauté : hors de la barre, ouverte en UN geste par le bouton en haut à droite
    R['1_communaute_hors_barre'] = pg.get_by_role('tab', name='Communauté').count() == 0
    tid(pg, 'header-community').click(); pg.wait_for_timeout(1800)
    R['1_communaute_ouvre_la_vraie_section'] = pg.url.endswith('/community') and 'forum des parents' in pg.inner_text('body')
    R['1_onglet_actif'] = selected(pg, 'Aujourd’hui')
    # un seul bouton d'action : « Publier » remplace « Ajouter » sur Communauté
    R['1_un_seul_bouton_flottant_communaute'] = bar_metrics(pg)['action']['id'] == 'community-publish' and pg.locator('[data-testid="quick-add"]').filter(visible=True).count() == 0
    pg.screenshot(path=f'{SHOTS}/nav-communaute.png')
    # « Retour » depuis la Communauté ramène d'où l'on vient (Aujourd'hui), sans boucle
    pg.get_by_role('button', name='Retour').filter(visible=True).first.click(); pg.wait_for_timeout(1500)
    R['1_communaute_retour'] = pg.url.rstrip('/') == B and selected(pg, 'Aujourd’hui')

    # 2-3. Aujourd'hui : urgences, notifications, Communauté (nommée) et avatar en haut à droite — 4 éléments, plus de
    #      Réglages dans l'en-tête ; sélecteur de profil et entrée « Outils » en tête
    pg.get_by_role('tab', name='Aujourd’hui').click(); pg.wait_for_timeout(1500)
    R['2_3_accueil_profil_reglages_en_haut_a_droite'] = header_ok(pg)
    R['2_urgence_et_notifications_conservees'] = pg.get_by_role('button', name='Besoin d’aide maintenant').count() == 1 and pg.get_by_role('button', name=re.compile('^Notifications')).count() == 1
    # même rangée que la cloche : urgences, notifications, Communauté, avatar (la pastille « Démo » est au-dessus)
    R['2_entete_accueil_4_elements'] = pg.evaluate("""() => {
      const front = (e) => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (e.contains(h) || h.contains(e)); };
      const bell = [...document.querySelectorAll('[data-testid="home-bell"]')].find(e => e.offsetParent !== null && front(e));
      if (!bell) return -1; const b = bell.getBoundingClientRect(), mid = b.y + b.height / 2;
      const outer = (e) => !e.parentElement.closest('[role="button"], button');
      // seulement ce qui est au premier plan (un onglet inactif reste monté sous l'écran affiché)
      return [...document.querySelectorAll('[role="button"], button')].filter(e => { const r = e.getBoundingClientRect(); return e.offsetParent !== null && r.width > 0 && outer(e) && r.y <= mid && r.y + r.height >= mid && front(e); }).length; }""") == 4
    hc390 = tid(pg, 'header-community')
    R['2_communaute_libelle_visible_390'] = 'Communauté' in (hc390.inner_text() or '')
    R['2_feuille_avatar'] = open_account_sheet(pg) and all(tid(pg, x).count() == 1 for x in ['account-sheet-profile', 'account-sheet-settings', 'account-sheet-emergency'])
    pg.screenshot(path=f'{SHOTS}/nav-feuille-avatar.png')
    tid(pg, 'account-sheet-emergency').click(); pg.wait_for_timeout(1500)
    R['2_urgences_depuis_la_feuille'] = pg.url.endswith('/emergency')
    pg.goto(B + '/'); pg.wait_for_timeout(2000)
    sw, te, ht = tid(pg, 'profile-switcher').bounding_box(), tid(pg, 'home-tools-entry').bounding_box(), tid(pg, 'home-today').bounding_box()
    R['2_selecteur_puis_outils_puis_journee'] = bool(sw and te and ht and sw['y'] < te['y'] < ht['y'])
    tid(pg, 'home-tools-entry').click(); pg.wait_for_timeout(1500)
    R['2_entree_outils'] = pg.url.endswith('/tools')
    pg.goto(B + '/'); pg.wait_for_timeout(2000)
    pg.screenshot(path=f'{SHOTS}/nav-accueil.png')

    # 4. Profil : données du compte connecté (avatar en haut à droite, plus d'onglet Profil)
    name = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const u = s.session && s.session.userId; const p = s.tables.profiles.find(x => x.id === u); return p ? (p.display_name || '') : '' }")
    open_account_sheet(pg)
    tid(pg, 'account-sheet-profile').click(); pg.wait_for_timeout(1800)
    body = pg.inner_text('body')
    R['4_profil_ouvert'] = pg.url.endswith('/profile') and 'MES PARCOURS' in body
    R['4_profil_donnees_du_compte'] = (name in body) if name else ('Mon profil' in body)
    R['4_profil_lien_publications'] = 'Mes publications' in body
    # Réglages : derrière l'avatar (feuille « Mon compte »)
    open_account_sheet(pg)
    tid(pg, 'account-sheet-settings').click(); pg.wait_for_timeout(1500)
    R['3_reglages_ouverts'] = pg.url.endswith('/settings') and 'Langue et pays' in pg.inner_text('body')
    for sub in ['/settings/account', '/settings/privacy', '/settings/reminders', '/settings/language', '/settings/home']:
        pg.goto(B + sub); pg.wait_for_timeout(1200)
        R[f'3_reglage_{sub.split("/")[-1]}'] = 'introuvable' not in pg.inner_text('body').lower()

    # 5. En-tête sur les écrans principaux (onglets, hubs, anciennes routes)
    seed = {}
    for path in ['/', '/health', '/baby', '/household', '/community', '/track', '/tools', '/ask', '/agenda', '/cycle', '/calendar', '/fertility', '/contraception']:
        ensure(pg, path, seed)  # écrans de cycle : ouverts avec le parcours correspondant (garde d'accès)
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'5_entete_{path.strip("/") or "accueil"}'] = header_ok(pg, community=path != '/community')
    # routes d'onglet hors barre : bouton Retour + onglet parent allumé
    for path, parent in [('/track', 'Enfant'), ('/ask', 'Moi'), ('/agenda', 'Famille'), ('/community', 'Aujourd’hui')]:
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'5_ancienne_route_{path.strip("/")}_retour_et_parent'] = pg.get_by_role('button', name='Retour').filter(visible=True).count() >= 1 and selected(pg, parent)
    pg.goto(B + '/settings/privacy'); pg.wait_for_timeout(1200)
    R['5_ecran_detail_sans_entete_compte'] = pg.get_by_role('button', name='Retour').count() >= 1 and pg.get_by_role('button', name=re.compile('^Mon profil')).count() == 0

    # 6. Fluidité : une recherche saisie dans Communauté survit à un changement d'onglet
    pg.goto(B + '/'); pg.wait_for_timeout(1500)
    tid(pg, 'header-community').click(); pg.wait_for_timeout(1500)
    box = pg.get_by_placeholder('Sommeil, purée… ou @membre')
    if box.count():
        box.fill('Brouillon conservé ?')
        pg.get_by_role('tab', name='Moi').click(); pg.wait_for_timeout(1000)
        tid(pg, 'header-community').click(); pg.wait_for_timeout(1000)
        R['6_pas_de_reinitialisation'] = pg.get_by_placeholder('Sommeil, purée… ou @membre').input_value() == 'Brouillon conservé ?'
    else:
        R['6_pas_de_reinitialisation'] = False

    # 7. Liens internes : notifications, espace de communauté, route du profil
    pg.goto(B + '/'); pg.wait_for_timeout(1500)
    pg.get_by_role('button', name=re.compile('^Notifications')).first.click(); pg.wait_for_timeout(1500)
    R['7_cloche_vers_notifications'] = pg.url.endswith('/notifications')
    pg.goto(B + '/community?space=grossesse'); pg.wait_for_timeout(1800)
    R['7_lien_espace_communaute'] = 'Grossesse' in pg.inner_text('body')
    pg.goto(B + '/profile'); pg.wait_for_timeout(1500)
    R['7_lien_direct_profil'] = 'MES PARCOURS' in pg.inner_text('body')
    pg.goto(B + '/scanner'); pg.wait_for_timeout(1500)
    R['7_scanner_toujours_accessible'] = 'introuvable' not in pg.inner_text('body').lower()

    # 8. Rien n'est masqué : en bas de chaque onglet, le dernier élément finit au-dessus de la barre
    for path in ['/', '/health', '/baby', '/household', '/community']:
        pg.goto(B + path); pg.wait_for_timeout(2000)
        pg.mouse.move(195, 400)
        for _ in range(30): pg.mouse.wheel(0, 1200); pg.wait_for_timeout(60)
        pg.wait_for_timeout(800)
        gap = pg.evaluate("""() => {
          const bar = [...document.querySelectorAll('[role="tablist"]')].find(e => e.querySelector('[data-testid^="tab-"]')); if (!bar) return null;
          const top = bar.getBoundingClientRect().top;
          // textes visibles de l'écran (hors barre et bouton d'action) : le plus bas doit finir au-dessus de la barre
          const skip = (e) => e.closest('[role="tablist"],[aria-hidden="true"]') || e.closest('[data-testid="quick-add"],[data-testid="community-publish"],[data-testid="cocoon-add"]');
          const H = window.innerHeight;
          const leaves = [...document.querySelectorAll('div,span')].filter(e => e.childElementCount === 0 && e.textContent.trim() && e.offsetParent !== null && !skip(e))
            .map(e => e.getBoundingClientRect()).filter(r => r.height > 0 && r.top < H && r.bottom > 0);
          if (!leaves.length) return null;
          return top - Math.max(...leaves.map(r => r.bottom));
        }""")
        R[f'8_contenu_visible_{path.strip("/") or "accueil"}'] = gap is not None and gap >= 8

    # 11. Action rapide centrale : 4 à 6 actions du profil, « Tous mes outils », sieste → saisie de sommeil,
    #     rendez-vous et tâche disponibles depuis un autre onglet que l'accueil
    # (les étapes 5 à 8 ont changé le parcours « corps » pour ouvrir les écrans du cycle : on remet la grossesse de la démo)
    pg.evaluate(SET_BODY, ['pregnancy', False])
    lina = pg.evaluate("() => (JSON.parse(localStorage.getItem('toietmoi.demo.v1')).tables.children.find(c => c.first_name === 'Lina') || {}).id")
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    tid(pg, f'subject-{lina}').scroll_into_view_if_needed(); tid(pg, f'subject-{lina}').click(); pg.wait_for_timeout(1500)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1200)
    ids = pg.evaluate("""() => [...document.querySelectorAll('[data-testid="quick-sheet"] [data-testid^="qa-"][role="button"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid'))""")
    acts = [i for i in ids if i not in ('qa-tools', 'qa-customize')]
    R['11_feuille_4_a_6_actions'] = 4 <= len(acts) <= 6 and 'qa-tools' in ids
    R['11_actions_du_bebe'] = acts[:6] == ['qa-bottle', 'qa-breastfeed', 'qa-nap', 'qa-observation', 'qa-task', 'qa-appointment']
    R['11_libelles_explicites'] = 'Enregistrer une sieste' in tid(pg, 'qa-nap').inner_text() and 'Ajouter un rendez-vous' in tid(pg, 'qa-appointment').inner_text()
    R['11_cibles_48px'] = all(b2['height'] >= 48 for b2 in [tid(pg, i).bounding_box() for i in acts])
    pg.screenshot(path=f'{SHOTS}/nav-action-centrale.png')
    tid(pg, 'qa-nap').click(); pg.wait_for_timeout(2200)
    R['11_sieste_ouvre_la_saisie_de_sommeil'] = '/track/sleep' in pg.url and '/night' not in pg.url and f'child={lina}' in pg.url
    pg.goto(B + '/baby'); pg.wait_for_timeout(2200)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1000)
    tid(pg, 'qa-appointment').click(); pg.wait_for_timeout(2500)
    R['11_rendez_vous_formulaire_ouvert'] = '/appointments' in pg.url and 'new=quick' in pg.url and pg.get_by_text('Nouveau rendez-vous').count() + pg.locator('input').count() > 0
    pg.goto(B + '/household'); pg.wait_for_timeout(2200)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1000)
    tid(pg, 'qa-task').click(); pg.wait_for_timeout(1200)
    R['11_tache_depuis_un_autre_onglet'] = tid(pg, 'today-add-sheet').count() > 0 and tid(pg, 'today-add-title').count() > 0
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    # choisir ses actions rapides (par profil), puis rétablir
    pg.goto(B + '/'); pg.wait_for_timeout(2200)
    tid(pg, 'quick-add').click(); pg.wait_for_timeout(1000)
    tid(pg, 'qa-customize').click(); pg.wait_for_timeout(700)
    tid(pg, 'qa-pick-appointment').click(); tid(pg, 'qa-pick-diaper').click(); pg.wait_for_timeout(300)
    tid(pg, 'qa-pick-save').click(); pg.wait_for_timeout(700)
    ids2 = pg.evaluate("""() => [...document.querySelectorAll('[data-testid="quick-sheet"] [data-testid^="qa-"][role="button"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid'))""")
    R['11_actions_choisies'] = 'qa-diaper' in ids2 and 'qa-appointment' not in ids2
    tid(pg, 'qa-customize').click(); pg.wait_for_timeout(600); tid(pg, 'qa-pick-reset').click(); pg.wait_for_timeout(600)
    pg.goto(B + '/'); pg.wait_for_timeout(2200)

    # 12. Sélecteur de profil universel : toucher un avatar, puis glisser sur le tableau de bord (profil suivant /
    #     précédent), indicateur de pages ; l'accueil suit (sous-titre, agenda du jour du profil)
    tid(pg, 'subject-preg').scroll_into_view_if_needed(); tid(pg, 'subject-preg').click(); pg.wait_for_timeout(1500)
    R['12_avatar_grossesse_actif'] = (active_profile(pg) or '').startswith('Ma grossesse') and pager_index(pg) == 1
    R['12_un_seul_anneau'] = pg.locator('[data-testid="profile-ring"]').filter(visible=True).count() == 1
    before = tid(pg, 'home-agenda-for').inner_text() if tid(pg, 'home-agenda-for').count() else ''
    swipe(pg, -1)
    R['12_glissement_gauche_profil_suivant'] = (active_profile(pg) or '').startswith('Lina') and pager_index(pg) == 2
    after = tid(pg, 'home-agenda-for').inner_text() if tid(pg, 'home-agenda-for').count() else ''
    R['12_accueil_suit_le_profil'] = 'Lina' in after and after != before and 'Lina' in tid(pg, 'home-date').inner_text()
    pg.screenshot(path=f'{SHOTS}/nav-profil-glisse.png')
    swipe(pg, 1)
    R['12_glissement_droite_profil_precedent'] = (active_profile(pg) or '').startswith('Ma grossesse') and pager_index(pg) == 1
    # le bord gauche de l'écran n'est pas capté (geste de retour iOS) : un glissement qui y commence ne change rien
    w0 = pg.viewport_size['width']
    pg.mouse.move(6, 520); pg.mouse.down(); pg.mouse.move(w0 * 0.4, 520, steps=6); pg.mouse.move(w0 * 0.8, 520, steps=6); pg.mouse.up(); pg.wait_for_timeout(1000)
    R['12_bord_gauche_non_capte'] = (active_profile(pg) or '').startswith('Ma grossesse')
    # le même sélecteur sur les onglets Moi / Enfant / Famille, synchronisé ; glisser sur Enfant change d'enfant
    pg.goto(B + '/baby'); pg.wait_for_timeout(2200)
    R['12_meme_selecteur_sur_les_onglets'] = tid(pg, 'hub-baby-profiles').count() == 1 and (active_profile(pg) or '').startswith('Ma grossesse')
    tid(pg, f'subject-{lina}').click(); pg.wait_for_timeout(1200)
    swipe(pg, -1)
    R['12_enfant_suivant_par_glissement'] = (active_profile(pg) or '').startswith('Noé')
    pg.goto(B + '/'); pg.wait_for_timeout(2200)
    R['12_profil_conserve_entre_onglets'] = (active_profile(pg) or '').startswith('Noé')

    # 13. Personnaliser sur place : masquer un module, le réafficher, rétablir
    c = tid(pg, 'home-customize'); c.scroll_into_view_if_needed(); c.click(); pg.wait_for_timeout(1200)
    R['13_mode_edition_sur_place'] = tid(pg, 'home-editor').count() == 1 and pg.url.rstrip('/') == B
    tid(pg, 'home-edit-toggle-agenda').locator('[role="switch"]').first.click(); pg.wait_for_timeout(500)
    tid(pg, 'home-editor-done').scroll_into_view_if_needed(); tid(pg, 'home-editor-done').click(); pg.wait_for_timeout(1000)
    R['13_module_masque'] = pg.locator('[data-testid="home-card-agenda"]').count() == 0 and pg.locator('[data-testid="home-card-next"]').count() == 1
    c = tid(pg, 'home-customize'); c.scroll_into_view_if_needed(); c.click(); pg.wait_for_timeout(1000)
    tid(pg, 'home-edit-reset').scroll_into_view_if_needed(); tid(pg, 'home-edit-reset').click(); pg.wait_for_timeout(700)
    tid(pg, 'home-editor-done').scroll_into_view_if_needed(); tid(pg, 'home-editor-done').click(); pg.wait_for_timeout(1000)
    R['13_retabli_par_defaut'] = pg.locator('[data-testid="home-card-agenda"]').count() == 1
    order = pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="home-card-"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid').replace('home-card-', ''))""")
    R['13_ordre_du_tableau_de_bord'] = order[:4] == ['next', 'quick', 'main', 'agenda']

    # 13b. Réorganiser SANS glisser (lecteur d'écran, clavier) : « Descendre » sur « Prochaine action », ordre enregistré
    c = tid(pg, 'home-customize'); c.scroll_into_view_if_needed(); c.click(); pg.wait_for_timeout(1000)
    down = pg.locator('[data-testid="home-edit-down-next"]').first
    lab = down.get_attribute('aria-label') or ''
    R['13b_action_descendre_nommee'] = lab.startswith('Descendre') and 'Prochaine action' in lab and down.get_attribute('role') == 'button'
    row = pg.locator('[data-testid="home-edit-next"] [aria-label*="position"]').first
    R['13b_position_annoncee'] = (row.get_attribute('aria-label') or '').endswith('position 1 sur ' + str(pg.locator('[data-testid^="home-edit-toggle-"]').count()))
    down.evaluate('e => e.click()'); pg.wait_for_timeout(700)
    R['13b_confirmation_toast'] = 'Ordre enregistré' in pg.inner_text('body')
    R['13b_position_suivante'] = (pg.locator('[data-testid="home-edit-next"] [aria-label*="position"]').first.get_attribute('aria-label') or '').find('position 2 sur') >= 0
    tid(pg, 'home-editor-done').scroll_into_view_if_needed(); tid(pg, 'home-editor-done').click(); pg.wait_for_timeout(1000)
    order = pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="home-card-"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid').replace('home-card-', ''))""")
    R['13b_ordre_applique'] = order[:2] == ['quick', 'next']
    pg.reload(); pg.wait_for_timeout(3000)
    order = pg.evaluate("""() => [...document.querySelectorAll('[data-testid^="home-card-"]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid').replace('home-card-', ''))""")
    R['13b_ordre_conserve_apres_rechargement'] = order[:2] == ['quick', 'next']
    c = tid(pg, 'home-customize'); c.scroll_into_view_if_needed(); c.click(); pg.wait_for_timeout(1000)
    tid(pg, 'home-edit-reset').scroll_into_view_if_needed(); tid(pg, 'home-edit-reset').click(); pg.wait_for_timeout(700)
    tid(pg, 'home-editor-done').scroll_into_view_if_needed(); tid(pg, 'home-editor-done').click(); pg.wait_for_timeout(1000)

    # 13c. Barre translucide et flottante : en bas de chaque écran d'onglet, le dernier élément reste AU-DESSUS d'elle
    for path in ['/', '/tools', '/health', '/baby', '/household']:
        pg.goto(B + path); pg.wait_for_timeout(2600)
        res = last_above_bar(pg)
        R[f'13c_bas_de_page_visible_390_{path.strip("/") or "accueil"}'] = res.get('ok') is True or res

    # 14. Onglet « Enfant » adaptatif : sans enfant → « Grossesse » ; sans enfant ni grossesse → ajout, jamais un cul-de-sac
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.children = []; s.tables.user_journeys = s.tables.user_journeys.filter(j => j.type !== 'baby' && j.type !== 'child');
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.goto(B + '/baby'); pg.wait_for_timeout(3000)
    R['14_onglet_grossesse'] = tabs(pg) == ['Aujourd’hui', 'Moi', 'Grossesse', 'Famille'] and selected(pg, 'Grossesse') and 'Ma grossesse' in pg.inner_text('body')
    R['14_grossesse_libelles_non_coupes'] = all(not x['cut'] and x['size'] >= 12 for x in bar_metrics(pg)['tabs'])
    pg.screenshot(path=f'{SHOTS}/nav-onglet-grossesse.png')
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.pregnancies = []; s.tables.user_journeys = s.tables.user_journeys.filter(j => j.type !== 'pregnancy');
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.goto(B + '/baby'); pg.wait_for_timeout(3000)
    R['14_ni_enfant_ni_grossesse_propose_d_ajouter'] = tabs(pg) == TABS_FR and tid(pg, 'child-tab-empty').count() == 1 and tid(pg, 'child-tab-add-child').count() == 1 and tid(pg, 'child-tab-add-pregnancy').count() == 1
    tid(pg, 'child-tab-add-child').click(); pg.wait_for_timeout(2000)
    R['14_ajout_ouvre_un_ecran'] = '/profiles/new' in pg.url and 'introuvable' not in pg.inner_text('body').lower()
    ctx.close()

    # 9. Petit écran (320 × 568) : libellés ≥ 11 px sans coupure, onglets ≥ 44 px, rien ne déborde
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR'); pg = ctx.new_page()
    open_demo(pg)
    m = bar_metrics(pg)
    R['9_onglets_dans_l_ecran'] = len(m['tabs']) == 4 and all(t['x'] >= 0 and t['x'] + t['w'] <= 320 and t['w'] >= 44 for t in m['tabs'])
    R['9_libelles_11px_sans_coupure'] = all(t['size'] >= 11 and not t['cut'] for t in m['tabs'])
    R['9_action_au_centre'] = bool(m['action'] and abs(m['action']['x'] + m['action']['w'] / 2 - 160) <= 2 and m['action']['w'] >= 48)
    R['9_pas_de_debordement'] = not m['overflow']
    R['9_entete_petit_ecran'] = header_ok(pg)
    hc = tid(pg, 'header-community').bounding_box()
    R['9_communaute_dans_l_ecran'] = bool(hc and hc['x'] >= 0 and hc['x'] + hc['width'] <= 320)
    R['9_urgences_et_notifications_320'] = all(tid(pg, x).count() == 1 for x in ['home-help', 'home-bell'])
    pg.screenshot(path=f'{SHOTS}/nav-entete-320.png')
    R['9_feuille_avatar_320'] = open_account_sheet(pg)
    pg.screenshot(path=f'{SHOTS}/nav-feuille-avatar-320.png')
    pg.keyboard.press('Escape'); pg.goto(B + '/'); pg.wait_for_timeout(1800)
    for path in ['/health', '/baby', '/household', '/tools']:
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'9_entete_320_{path.strip("/")}'] = header_ok(pg) and not bar_metrics(pg)['overflow']
    for path in ['/', '/tools', '/health', '/baby', '/household']:
        pg.goto(B + path); pg.wait_for_timeout(2400)
        res = last_above_bar(pg)
        R[f'9_bas_de_page_visible_320_{path.strip("/") or "accueil"}'] = res.get('ok') is True or res
    pg.goto(B + '/'); pg.wait_for_timeout(1800)
    R['9_tailles_libelles'] = sorted({t['size'] for t in m['tabs']})
    pg.screenshot(path=f'{SHOTS}/nav-320.png')

    # 10. Anglais
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['10_barre_en_anglais'] = tabs(pg) == ['Today', 'Me', 'Child', 'Family']
    R['10_entete_en_anglais'] = header_ok(pg, re.compile('^My profile'))
    pg.goto(B + '/community'); pg.wait_for_timeout(1800)
    R['10_communaute_en_anglais'] = 'parents’ forum' in pg.inner_text('body')
    pg.screenshot(path=f'{SHOTS}/nav-en.png')
    ctx.close(); b.close()

R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
