"""
Tickets navigation et design (21/11/2026) : captures avant / après et vérifications chiffrées dans l'export web.

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/tn/dist
  python3 e2e/spa_server.py /tmp/tn/dist 8982 &
  NAV_URL=http://127.0.0.1:8982 OUT=/tmp/tn/shots TAG=apres python3 e2e/tickets_nav.py > rapport.json

Profils : visiteur (« Découvrir sans compte », démonstration sans abonnement), abonné (démonstration + abonnement de
démonstration dans localStorage), compte sans Premium (vrai mode, faux Supabase e2e/fake_supabase.py, compte confirmé
et onboardé). Thèmes : Olive HOMI, Blanc nacré, Noir graphite. Le script tolère l'ancienne version (TAG=avant) :
une clé absente vaut null.
"""
import json, os, sys, time, uuid
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8982')
OUT = os.environ.get('OUT', '/tmp/tn/shots')
TAG = os.environ.get('TAG', 'apres')
os.makedirs(OUT, exist_ok=True)
TID = lambda t: f'[data-testid="{t}"]'
R, errs = {}, []

PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId; const now = new Date();
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, entitlement: 'HOMI_PREMIUM', status: 'active', product_id: 'homi_premium_monthly', store: 'test', period_type: 'monthly',
    expires_at: new Date(now.getTime() + 30 * 86400000).toISOString(), will_renew: true, tier: 'premium', updated_at: now.toISOString() });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""


def shot(pg, name, full=False, clip=None):
    p = f'{OUT}/{TAG}_{name}.png'
    try:
        pg.screenshot(path=p, full_page=full, clip=clip) if clip else pg.screenshot(path=p, full_page=full)
    except Exception as e:  # noqa: BLE001
        errs.append(f'capture {name}: {str(e)[:80]}')
    return p


def vis(pg, tid):
    loc = pg.locator(TID(tid))
    try:
        return loc.count() > 0 and loc.first.is_visible()
    except Exception:
        return False


def tap(pg, tid, timeout=4000):
    try:
        pg.locator(TID(tid)).first.click(timeout=timeout); return True
    except Exception:
        return False


def wait(pg, tid, timeout=30):
    t = time.time()
    while time.time() - t < timeout:
        if vis(pg, tid): return True
        pg.wait_for_timeout(100)
    return False


def ctx_for(p, w=390, h=844, scale=2, dark=False):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale, locale='fr-FR', timezone_id='Europe/Paris', color_scheme='dark' if dark else 'light')
    return b, ctx


def visit(pg):
    pg.goto(B + '/intro?scene=start'); wait(pg, 'intro-demo', 120); tap(pg, 'intro-demo')
    wait(pg, 'tab-health', 60); pg.wait_for_timeout(1500)
    if vis(pg, 'aura-intro-later'): tap(pg, 'aura-intro-later'); pg.wait_for_timeout(500)


def scroll_bottom(pg):
    pg.evaluate("""() => { const all = [...document.querySelectorAll('div')].filter((d) => { const s = getComputedStyle(d); return /(auto|scroll)/.test(s.overflowY) && d.scrollHeight > d.clientHeight + 20; });
      for (const el of all) el.scrollTop = el.scrollHeight; }""")
    pg.wait_for_timeout(600)


# dernière carte accessible : le bas du dernier élément de « Mes outils » est au-dessus de la barre flottante
LAST_OK = """() => {
  const dock = document.querySelector('[data-testid="dock"]'); const top = dock && getComputedStyle(dock).display !== 'none' ? Math.min(...[...dock.querySelectorAll('[data-testid="tab-bar-glass"]')].map((e) => e.getBoundingClientRect().top), innerHeight) : innerHeight;
  const ids = ['tools-legend', 'tools-community-open', 'tools-category-account', 'tools-category-family'];
  for (const id of ids) { const e = [...document.querySelectorAll('[data-testid="' + id + '"]')].pop(); if (e) { const r = e.getBoundingClientRect(); return { id, bas: Math.round(r.bottom), barre: Math.round(top), ok: r.bottom <= top + 1 }; } }
  return null;
}"""

# éléments coupés : texte dont le contenu déborde de sa boîte (hauteur ou largeur), cartes sorties de l'écran à droite
CUT = """() => {
  const out = [];
  for (const e of document.querySelectorAll('[data-testid^="tools-category-"], [data-testid^="tools-featured-"], [data-testid="tools-intro"], [data-testid="tools-preview"], [data-testid="tools-legend"]')) {
    const r = e.getBoundingClientRect(); if (r.width === 0) continue;
    if (r.right > innerWidth + 1 || r.left < -1) out.push(e.dataset.testid + ' hors écran');
    for (const t of e.querySelectorAll('div[dir="auto"]')) { if (t.scrollHeight > t.clientHeight + 2 && getComputedStyle(t).overflow === 'hidden' && !t.closest('[data-intentional]')) out.push(e.dataset.testid + ' texte coupé : ' + t.textContent.slice(0, 30)); }
  }
  return [...new Set(out)].slice(0, 12);
}"""


def calm(pg):
    """Présentation d'Aura (comptes réels, première arrivée) fermée ; introduction d'ouverture terminée."""
    pg.wait_for_timeout(1800)
    if vis(pg, 'aura-intro-later'): tap(pg, 'aura-intro-later'); pg.wait_for_timeout(600)


def tools_pass(pg, who, theme_tag=''):
    pg.goto(B + '/tools'); wait(pg, 'tools-search', 40); calm(pg)
    R[f'{who}_verrou_ecran'] = vis(pg, 'premium-gate')
    R[f'{who}_intro'] = vis(pg, 'tools-intro')
    R[f'{who}_cadenas'] = pg.locator('[data-testid^="tool-tile-locked-"], [data-testid^="tools-category-locked-"]').count()
    R[f'{who}_apercu'] = vis(pg, 'tools-preview')
    shot(pg, f'outils_{who}{theme_tag}_haut')
    if vis(pg, 'tools-intro-skip'): tap(pg, 'tools-intro-skip'); pg.wait_for_timeout(500)
    scroll_bottom(pg)
    R[f'{who}_derniere_carte'] = pg.evaluate(LAST_OK)
    R[f'{who}_coupes'] = pg.evaluate(CUT)
    shot(pg, f'outils_{who}{theme_tag}_bas')


def set_theme(pg, palette):
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(2500)
    if vis(pg, f'theme-{palette}'):
        tap(pg, f'theme-{palette}'); pg.wait_for_timeout(400); tap(pg, 'theme-inline-apply')
    else:
        tap(pg, f'palette-{palette}')
    pg.wait_for_timeout(800)


def tabbar_zoom(pg, name):
    """Barre d'onglets agrandie (×3) : repos, appui maintenu sur « Moi », actif."""
    bar = pg.locator(TID('tab-bar-glass')).first
    try:
        bb = bar.bounding_box()
    except Exception:
        bb = None
    if not bb: return
    clip = {'x': bb['x'], 'y': bb['y'], 'width': bb['width'], 'height': bb['height']}
    shot(pg, f'barre_{name}_repos', clip=clip)
    t = pg.locator(TID('tab-health')).first.bounding_box()
    pg.mouse.move(t['x'] + t['width'] / 2, t['y'] + t['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(260)
    shot(pg, f'barre_{name}_appui', clip=clip)
    pg.mouse.up(); pg.wait_for_timeout(900)
    shot(pg, f'barre_{name}_actif', clip=clip)
    tap(pg, 'tab-index'); pg.wait_for_timeout(600)


def light_inside(pg):
    """Lumière : la couche allumée n'est jamais plus grande que l'icône (ancien halo : 1,9 × l'icône)."""
    return pg.evaluate("""() => [...document.querySelectorAll('[data-testid$="-light"], [data-testid$="-light-active"], [data-testid="dock-add-light"]')].map((e) => {
      const r = e.getBoundingClientRect(); const ic = e.parentElement.getBoundingClientRect();
      return { id: e.dataset.testid, ratio: Math.round(r.width / Math.max(1, ic.width) * 100) / 100 };
    })""")


def run(p):
    # --------------------------------------------------- visiteur : accueil, barre, Mes outils, thèmes, vidéo
    b, ctx = ctx_for(p)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.goto(B + '/welcome'); wait(pg, 'welcome-demo', 120); shot(pg, 'welcome')
    visit(pg)
    R['visiteur_accueil_verrou'] = vis(pg, 'premium-gate')
    shot(pg, 'accueil_visiteur')
    R['lumiere_ratio'] = light_inside(pg)
    tabbar_zoom(pg, 'olive_clair')
    tools_pass(pg, 'visiteur')
    # catégorie + fiche d'outil (visiteur)
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(2500); shot(pg, 'categorie_sommeil_visiteur')
    R['visiteur_categorie_verrou'] = vis(pg, 'premium-gate')
    R['visiteur_categorie_cadenas'] = pg.locator('[data-testid^="tool-locked-"]').count()
    # thèmes : Blanc nacré, Noir graphite (réglages), panneau de l'accueil
    for pal in ('nacre', 'graphite'):
        set_theme(pg, pal)
        pg.evaluate("() => { const all = [...document.querySelectorAll('div')].filter((d) => /(auto|scroll)/.test(getComputedStyle(d).overflowY)); for (const el of all) el.scrollTop = 0; }")
        pg.wait_for_timeout(2500)
        shot(pg, f'reglages_apparence_{pal}')
        pg.goto(B + '/'); wait(pg, 'tab-health', 30); pg.wait_for_timeout(2800)
        shot(pg, f'accueil_{pal}')
        tabbar_zoom(pg, f'{pal}')
        tools_pass(pg, 'visiteur', f'_{pal}')
    set_theme(pg, 'olive')
    pg.goto(B + '/'); wait(pg, 'home-theme', 30); tap(pg, 'home-theme'); pg.wait_for_timeout(900); shot(pg, 'panneau_couleurs')
    tap(pg, 'theme-graphite'); pg.wait_for_timeout(700); shot(pg, 'panneau_couleurs_apercu_graphite')
    # fermeture sans valider → Olive revient
    pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
    R['panneau_annulation_ok'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference") == 'olive'
    b.close()

    # --------------------------------------------------- tailles d'écran, texte agrandi, clavier (visiteur)
    for (w, h) in ((320, 568), (375, 667), (390, 844)):
        b, ctx = ctx_for(p, w, h)
        pg = ctx.new_page(); visit(pg)
        tools_pass(pg, f'visiteur_{w}x{h}')
        # texte agrandi : zoom CSS 130 % (la mise en page se refait à 1/1,3 de la largeur)
        pg.evaluate("() => { document.documentElement.style.zoom = '1.3'; }"); pg.wait_for_timeout(1200)
        pg.evaluate("() => { const all = [...document.querySelectorAll('div')].filter((d) => /(auto|scroll)/.test(getComputedStyle(d).overflowY)); for (const el of all) el.scrollTop = 0; }")
        shot(pg, f'outils_{w}x{h}_zoom130_haut'); scroll_bottom(pg); shot(pg, f'outils_{w}x{h}_zoom130_bas')
        R[f'zoom130_{w}x{h}_coupes'] = pg.evaluate(CUT)
        pg.evaluate("() => { document.documentElement.style.zoom = '1'; }"); pg.wait_for_timeout(600)
        # clavier ouvert : champ de recherche focalisé, hauteur réduite de la place du clavier
        pg.evaluate("() => { const all = [...document.querySelectorAll('div')].filter((d) => /(auto|scroll)/.test(getComputedStyle(d).overflowY)); for (const el of all) el.scrollTop = 0; }")
        try:
            pg.locator(f'{TID("tools-search")} input, input[aria-label]').first.click(timeout=3000)
        except Exception:
            pass
        pg.set_viewport_size({'width': w, 'height': max(300, h - 300)}); pg.wait_for_timeout(900)
        shot(pg, f'outils_{w}x{h}_clavier')
        R[f'clavier_{w}x{h}_barre_masquee'] = pg.evaluate("() => { const d = document.querySelector('[data-testid=\"dock\"]'); return !d || getComputedStyle(d).display === 'none' || d.getBoundingClientRect().top >= innerHeight; }")
        b.close()

    # --------------------------------------------------- abonné (démonstration + abonnement de démonstration)
    b, ctx = ctx_for(p)
    pg = ctx.new_page(); visit(pg)
    pg.evaluate(PREMIUM); pg.reload(); wait(pg, 'tab-health', 60); pg.wait_for_timeout(1500)
    tools_pass(pg, 'abonne')
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(2500)
    R['abonne_categorie_cadenas'] = pg.locator('[data-testid^="tool-locked-"]').count()
    R['abonne_categorie_verrou'] = vis(pg, 'premium-gate')
    shot(pg, 'categorie_sommeil_abonne')
    b.close()

    # --------------------------------------------------- compte sans Premium (vrai mode, faux Supabase)
    fake = FakeSupabase()
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': 'sarah@exemple.test', 'password': 'motdepasse1', 'confirmed': True, 'meta': {'first_name': 'Sarah'}}
    fake.trigger_new_user(fake.users[uid])
    for row in fake.t('profiles'):
        if row['id'] == uid: row.update({'onboarding_completed': True, 'display_name': 'Sarah', 'journeys': ['cycle']})
    b, ctx = ctx_for(p)
    ctx.route('http://sb.fake.test/**', fake.route)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(4000)
    try:
        pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test'); pg.get_by_label('Mot de passe', exact=True).fill('motdepasse1')
        tap(pg, 'signin-submit'); pg.wait_for_timeout(6000)
    except Exception as e:  # noqa: BLE001
        errs.append('connexion: ' + str(e)[:100])
    R['sans_premium_url_apres_connexion'] = pg.url.replace(B, '')
    R['sans_premium_accueil_verrou'] = vis(pg, 'premium-gate')
    tools_pass(pg, 'sans_premium')
    pg.goto(B + '/tools/sleep'); pg.wait_for_timeout(2500)
    R['sans_premium_categorie_cadenas'] = pg.locator('[data-testid^="tool-locked-"]').count()
    shot(pg, 'categorie_sommeil_sans_premium')
    # outil réservé ouvert depuis l'aperçu : l'écran Premium le couvre (droits réels), retour visible
    pg.goto(B + '/sleep'); pg.wait_for_timeout(3000)
    R['sans_premium_outil_verrouille'] = vis(pg, 'premium-gate')
    R['sans_premium_outil_retour'] = vis(pg, 'premium-gate-back')
    # Réglages › Apparence (vrai compte sans Premium : réservé, inchangé)
    pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(2500)
    R['sans_premium_apparence_verrou'] = vis(pg, 'premium-gate')
    b.close()

    # --------------------------------------------------- ticket 6 : entrées, aperçu, retour, rechargement (visiteur)
    b, ctx = ctx_for(p)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append('t6 ' + str(e)[:160])); visit(pg)
    T6 = {}
    pg.goto(B + '/settings'); pg.wait_for_timeout(2500); shot(pg, 'reglages')
    try:
        pg.get_by_text('Apparence et couleurs', exact=False).first.click(timeout=4000)
    except Exception:
        errs.append('entrée Apparence introuvable')
    pg.wait_for_timeout(2500)
    T6['reglages_vers_apparence'] = pg.url.replace(B, '')
    T6['apparence_verrou'] = vis(pg, 'premium-gate')
    T6['apparence_meme_selecteur'] = vis(pg, 'theme-picker-inline')
    shot(pg, 'reglages_apparence_olive')
    # aperçu puis retour arrière (bouton) : thème confirmé conservé
    if vis(pg, 'theme-rose'):
        tap(pg, 'theme-rose'); pg.wait_for_timeout(500)
        T6['apercu_rose_actif'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference") != 'rose'
        tap(pg, 'screen-back'); pg.wait_for_timeout(1200)
        T6['retour_bouton_url'] = pg.url.replace(B, '')
        T6['retour_bouton_theme'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference")
        pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(2000)
        tap(pg, 'theme-glacier'); pg.wait_for_timeout(400); pg.go_back(); pg.wait_for_timeout(1200)
        T6['retour_geste_theme'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference")
        T6['retour_geste_apercu'] = pg.evaluate("() => document.body.innerText.length > 0")
        # passage rapide entre les 8 thèmes, puis Appliquer, puis accueil, puis rechargement
        pg.goto(B + '/settings/appearance'); pg.wait_for_timeout(2000)
        for pal in ('nacre', 'graphite', 'sable', 'olive', 'lavande', 'glacier', 'rose', 'amethyste'):
            tap(pg, f'theme-{pal}', 2000); pg.wait_for_timeout(120)
        tap(pg, 'theme-lavande'); pg.wait_for_timeout(300); tap(pg, 'theme-inline-apply'); pg.wait_for_timeout(800)
        T6['applique'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference")
        pg.goto(B + '/'); wait(pg, 'tab-health', 30); pg.wait_for_timeout(1000); shot(pg, 'accueil_apres_lavande')
        pg.reload(); wait(pg, 'tab-health', 60); pg.wait_for_timeout(1500)
        T6['apres_rechargement'] = pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.ui')).state.palettePreference")
        T6['fond_apres_rechargement'] = pg.evaluate("() => getComputedStyle(document.querySelector('[data-testid=\"bg-powder\"], [data-testid=\"bg-night\"]')).backgroundColor")
    # bouton palette de l'accueil → « Plus de réglages » → Apparence
    pg.goto(B + '/'); wait(pg, 'home-theme', 30); tap(pg, 'home-theme'); pg.wait_for_timeout(900)
    tap(pg, 'theme-more'); pg.wait_for_timeout(2500)
    T6['panneau_vers_apparence'] = pg.url.replace(B, '')
    T6['panneau_vers_apparence_verrou'] = vis(pg, 'premium-gate')
    # Personnaliser l'accueil (Réglages › Mon accueil)
    pg.goto(B + '/settings'); pg.wait_for_timeout(2000)
    try:
        pg.get_by_text("Mon accueil", exact=False).first.click(timeout=4000)
    except Exception:
        errs.append('entrée Mon accueil introuvable')
    pg.wait_for_timeout(2500)
    T6['mon_accueil_url'] = pg.url.replace(B, '')
    T6['mon_accueil_verrou'] = vis(pg, 'premium-gate')
    T6['mon_accueil_texte'] = len(pg.locator('body').inner_text())
    shot(pg, 'reglages_mon_accueil')
    R['ticket6'] = T6
    # Compte : Réglages (haut), Profil (bas), Mon compte en mode suppression (visiteur)
    pg.goto(B + '/settings'); pg.wait_for_timeout(2500); shot(pg, 'compte_reglages_haut')
    R['compte_reglages_ligne_suppression'] = vis(pg, 'settings-delete-account')
    scroll_bottom(pg); shot(pg, 'compte_reglages_bas')
    R['compte_reglages_deconnexion'] = vis(pg, 'settings-sign-out')
    R['compte_reglages_deconnexion_libelle'] = pg.locator(TID('settings-sign-out')).first.get_attribute('aria-label') if pg.locator(TID('settings-sign-out')).count() else None
    pg.goto(B + '/profile'); pg.wait_for_timeout(2500); scroll_bottom(pg); shot(pg, 'compte_profil_bas')
    R['compte_profil_deconnexion'] = vis(pg, 'profile-sign-out')
    pg.goto(B + '/settings'); pg.wait_for_timeout(2000)
    if tap(pg, 'settings-delete-account'):
        pg.wait_for_timeout(2500)
        R['compte_suppression_2_appuis_url'] = pg.url.replace(B, '')
        R['compte_suppression_visible'] = vis(pg, 'account-delete-start')
        shot(pg, 'compte_suppression')
        tap(pg, 'account-delete-start'); pg.wait_for_timeout(900); shot(pg, 'compte_suppression_confirmation')
    else:
        pg.goto(B + '/settings/account'); pg.wait_for_timeout(2500); shot(pg, 'compte_suppression'); scroll_bottom(pg); shot(pg, 'compte_suppression_bas')
    b.close()


with sync_playwright() as p:
    run(p)
R['erreurs'] = errs[:20]
print(json.dumps(R, ensure_ascii=False, indent=1))
