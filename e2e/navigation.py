"""
Navigation HOMI (13/11/2026) : 5 onglets — Accueil · Santé · Bébé · Famille · Communauté — et, sur la même ligne,
un bouton d'action rond (« + » ajout rapide ; « Publier » sur Communauté ; « Ajouter » du cocon sur l'accueil d'un
enfant). Profil + Réglages en haut à droite. Anciennes routes d'onglet (/track, /ask, /agenda) : valides, avec un
bouton Retour, et l'onglet parent allumé (Bébé, Santé, Famille).
Version web de démonstration (sans compte), servie par spa_server.py :
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/navigation.py
Navigateur : celui de Playwright, ou PW_CHROMIUM=/chemin/vers/chrome (ex. /opt/pw-browsers/chromium).
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import ensure, PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TABS_FR = ['Accueil', 'Santé', 'Bébé', 'Famille', 'Communauté']


def tabs(pg):
    return [t.get_attribute('aria-label') for t in pg.locator('[role="tab"][data-testid^="tab-"]').all()]


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def selected(pg, name):
    return pg.get_by_role('tab', name=name).get_attribute('aria-selected') == 'true'


def header_ok(pg, avatar_name=re.compile('^(Mon profil|My profile)')):
    """Réglages et avatar présents, dans le coin supérieur droit."""
    s = pg.get_by_role('button', name=re.compile('^(Réglages|Settings)$')).first
    a = pg.get_by_role('button', name=avatar_name).first
    if not (s.count() and a.count()): return False
    bs, ba = s.bounding_box(), a.bounding_box()
    w = pg.viewport_size['width']
    return bool(bs and ba and ba['y'] < 140 and bs['y'] < 140 and ba['x'] > w * 0.6 and ba['x'] > bs['x'])


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

    # 1. Barre : 5 onglets dans l'ordre, bouton d'action sur la même ligne, à droite de la capsule
    R['1_barre_5_onglets'] = tabs(pg) == TABS_FR
    m = bar_metrics(pg)
    last = m['tabs'][-1] if m['tabs'] else None
    R['1_action_sur_la_meme_ligne'] = bool(m['action'] and last and abs((m['action']['y'] + m['action']['h'] / 2) - (last['y'] + last['h'] / 2)) < 6 and m['action']['x'] >= last['x'] + last['w'])
    R['1_libelles_12px_390'] = all(t['size'] >= 12 and not t['cut'] for t in m['tabs'])
    pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1800)
    R['1_communaute_ouvre_la_vraie_section'] = pg.url.endswith('/community') and 'forum des parents' in pg.inner_text('body')
    R['1_onglet_actif'] = selected(pg, 'Communauté')
    # un seul bouton d'action : « Publier » remplace le « + » sur Communauté
    R['1_un_seul_bouton_flottant_communaute'] = bar_metrics(pg)['action']['id'] == 'community-publish' and pg.locator('[data-testid="quick-add"]').filter(visible=True).count() == 0
    pg.screenshot(path=f'{SHOTS}/nav-communaute.png')

    # 2-3. Accueil : avatar + Réglages en haut à droite
    pg.get_by_role('tab', name='Accueil').click(); pg.wait_for_timeout(1500)
    R['2_3_accueil_profil_reglages_en_haut_a_droite'] = header_ok(pg)
    R['2_urgence_et_notifications_conservees'] = pg.get_by_role('button', name='Besoin d’aide maintenant').count() == 1 and pg.get_by_role('button', name=re.compile('^Notifications')).count() == 1
    pg.screenshot(path=f'{SHOTS}/nav-accueil.png')

    # 4. Profil : données du compte connecté (avatar en haut à droite, plus d'onglet Profil)
    name = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const u = s.session && s.session.userId; const p = s.tables.profiles.find(x => x.id === u); return p ? (p.display_name || '') : '' }")
    pg.get_by_role('button', name=re.compile('^Mon profil')).first.click(); pg.wait_for_timeout(1800)
    body = pg.inner_text('body')
    R['4_profil_ouvert'] = pg.url.endswith('/profile') and 'MES PARCOURS' in body
    R['4_profil_donnees_du_compte'] = (name in body) if name else ('Mon profil' in body)
    R['4_profil_lien_publications'] = 'Mes publications' in body
    pg.get_by_role('button', name='Réglages').first.click(); pg.wait_for_timeout(1500)
    R['3_reglages_ouverts'] = pg.url.endswith('/settings') and 'Langue et pays' in pg.inner_text('body')
    for sub in ['/settings/account', '/settings/privacy', '/settings/reminders', '/settings/language', '/settings/home']:
        pg.goto(B + sub); pg.wait_for_timeout(1200)
        R[f'3_reglage_{sub.split("/")[-1]}'] = 'introuvable' not in pg.inner_text('body').lower()

    # 5. En-tête sur les écrans principaux (onglets, hubs, anciennes routes)
    seed = {}
    for path in ['/', '/health', '/baby', '/household', '/community', '/track', '/tools', '/ask', '/agenda', '/cycle', '/calendar', '/fertility', '/contraception']:
        ensure(pg, path, seed)  # écrans de cycle : ouverts avec le parcours correspondant (garde d'accès)
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'5_entete_{path.strip("/") or "accueil"}'] = header_ok(pg)
    # anciennes routes d'onglet : bouton Retour + onglet parent allumé
    for path, parent in [('/track', 'Bébé'), ('/ask', 'Santé'), ('/agenda', 'Famille')]:
        pg.goto(B + path); pg.wait_for_timeout(1800)
        R[f'5_ancienne_route_{path.strip("/")}_retour_et_parent'] = pg.get_by_role('button', name='Retour').filter(visible=True).count() >= 1 and selected(pg, parent)
    pg.goto(B + '/settings/privacy'); pg.wait_for_timeout(1200)
    R['5_ecran_detail_sans_entete_compte'] = pg.get_by_role('button', name='Retour').count() >= 1 and pg.get_by_role('button', name=re.compile('^Mon profil')).count() == 0

    # 6. Fluidité : une recherche saisie dans Communauté survit à un changement d'onglet
    pg.goto(B + '/'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1500)
    box = pg.get_by_placeholder('Sommeil, purée… ou @membre')
    if box.count():
        box.fill('Brouillon conservé ?')
        pg.get_by_role('tab', name='Santé').click(); pg.wait_for_timeout(1000)
        pg.get_by_role('tab', name='Communauté').click(); pg.wait_for_timeout(1000)
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
    ctx.close()

    # 9. Petit écran (320 × 568) : libellés ≥ 11 px sans coupure, onglets ≥ 44 px, rien ne déborde
    ctx = b.new_context(viewport={'width': 320, 'height': 568}, locale='fr-FR'); pg = ctx.new_page()
    open_demo(pg)
    m = bar_metrics(pg)
    R['9_onglets_dans_l_ecran'] = len(m['tabs']) == 5 and all(t['x'] >= 0 and t['x'] + t['w'] <= 320 and t['w'] >= 44 for t in m['tabs'])
    R['9_libelles_11px_sans_coupure'] = all(t['size'] >= 11 and not t['cut'] for t in m['tabs'])
    R['9_action_dans_l_ecran'] = bool(m['action'] and m['action']['x'] + m['action']['w'] <= 320)
    R['9_pas_de_debordement'] = not m['overflow']
    R['9_entete_petit_ecran'] = header_ok(pg)
    R['9_tailles_libelles'] = sorted({t['size'] for t in m['tabs']})
    pg.screenshot(path=f'{SHOTS}/nav-320.png')

    # 10. Anglais
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['10_barre_en_anglais'] = tabs(pg) == ['Home', 'Health', 'Baby', 'Family', 'Community']
    R['10_entete_en_anglais'] = header_ok(pg, re.compile('^My profile'))
    pg.goto(B + '/community'); pg.wait_for_timeout(1800)
    R['10_communaute_en_anglais'] = 'parents’ forum' in pg.inner_text('body')
    pg.screenshot(path=f'{SHOTS}/nav-en.png')
    ctx.close(); b.close()

R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
