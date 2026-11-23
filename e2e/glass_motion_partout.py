"""
Liquid Glass + Full Motion « partout » (21/11/2026) — captures AVANT / APRÈS de l'application réelle (export web,
famille d'exemple + Premium injecté) et vidéo d'environ 30 s. Outil de PRÉSENTATION : il ne fait pas partie de l'app.

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir <dist>
  python3 e2e/spa_server.py <dist> 8972 &
  NAV_URL=http://127.0.0.1:8972 GM_OUT=<dossier>/apres GM_VIDEO=1 python3 e2e/glass_motion_partout.py

Écrit <GM_OUT>/<écran>-<variante>.png (variantes : 390-clair, 390-graphite, 320-clair, 390-clair-rm = Réduire les
animations), <GM_OUT>/video.mp4 (si GM_VIDEO=1 ; capture d'images en continu par Chromium puis ffmpeg du système) et
<GM_OUT>/rapport.json (débordements horizontaux, erreurs de page).
"""
import base64, json, os, subprocess
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8972')
OUT = os.environ.get('GM_OUT', '/tmp/homi-gm/out')
VIDEO = os.environ.get('GM_VIDEO') == '1'
os.makedirs(OUT, exist_ok=True)
REPORT = {'erreurs': [], 'debordements': {}, 'video': []}

PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId; const now = new Date();
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, entitlement: 'HOMI_PREMIUM', status: 'active', product_id: 'homi_premium_monthly', store: 'test',
    period_type: 'monthly', expires_at: new Date(now.getTime() + 30 * 86400000).toISOString(), will_renew: true, tier: 'premium', updated_at: now.toISOString() });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""

# 8 écrans clés + la feuille du sélecteur de thème
SCREENS = [
    ('1-accueil', '/'),
    ('2-outils', '/tools'),
    ('3-suivi-bebe', '/track'),
    ('4-famille-missions', '/family'),
    ('5-agenda', '/calendar'),
    ('6-communaute', '/community'),
    ('7-aura', '/ask'),
    ('8-profil', '/profile'),
]


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def ids(pg):
    return pg.evaluate("() => [...document.querySelectorAll('[data-testid]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('data-testid'))")


def dismiss(pg):
    for t in ['aura-intro-later', 'tour-skip', 'tour-close']:
        if tid(pg, t).count():
            try:
                tid(pg, t).click(); pg.wait_for_timeout(700)
            except Exception:
                pass


def enter(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(2500)
    pg.goto(B + '/start/sample'); pg.wait_for_timeout(5000)
    pg.evaluate(PREMIUM)
    pg.goto(B + '/'); pg.wait_for_timeout(3500)
    dismiss(pg)


def pick_theme(pg, name):
    tid(pg, 'home-theme').click(); pg.wait_for_timeout(1200)
    tid(pg, f'theme-{name}').click(); pg.wait_for_timeout(900)
    tid(pg, 'theme-apply').click(); pg.wait_for_timeout(1500)


def shots(br, variant, w, h, theme=None, reduced=False):
    ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris',
                         reduced_motion='reduce' if reduced else 'no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: REPORT['erreurs'].append(f'{variant} {str(e)[:200]}'))
    enter(pg)
    if theme:
        pick_theme(pg, theme)
    for name, path in SCREENS:
        pg.goto(B + path); pg.wait_for_timeout(3200)
        dismiss(pg)
        pg.screenshot(path=f'{OUT}/{name}-{variant}.png')
        o = pg.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
        if o > 0:
            REPORT['debordements'][f'{name}-{variant}'] = o
    # feuille du sélecteur de thème (référence 01)
    pg.goto(B + '/'); pg.wait_for_timeout(3000); dismiss(pg)
    if tid(pg, 'home-theme').count():
        tid(pg, 'home-theme').click(); pg.wait_for_timeout(1600)
        pg.screenshot(path=f'{OUT}/9-selecteur-theme-{variant}.png')
    ctx.close()


class Recorder:
    """Images en continu (screencast Chromium par CDP) puis ffmpeg du système, à cadence réelle."""

    def __init__(self, pg, path):
        self.pg, self.path, self.frames = pg, path, []
        self.dir = path + '.frames'
        os.makedirs(self.dir, exist_ok=True)
        self.cdp = pg.context.new_cdp_session(pg)
        self.cdp.on('Page.screencastFrame', self._frame)
        self.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 85, 'everyNthFrame': 1})

    def _frame(self, ev):
        f = f'{self.dir}/{len(self.frames):05d}.jpg'
        open(f, 'wb').write(base64.b64decode(ev['data']))
        self.frames.append((f, ev['metadata']['timestamp']))
        try:
            self.cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']})
        except Exception:
            pass

    def stop(self):
        try:
            self.cdp.send('Page.stopScreencast')
        except Exception:
            pass
        if len(self.frames) < 2:
            return
        lst = self.path + '.txt'
        with open(lst, 'w') as fh:
            for (f, t), (_, t2) in zip(self.frames, self.frames[1:] + [(None, self.frames[-1][1] + 0.04)]):
                fh.write(f"file '{f}'\nduration {max(0.016, t2 - t):.3f}\n")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30',
                        '-pix_fmt', 'yuv420p', self.path], check=False)


def step(name):
    REPORT['video'].append(name)


def press_hold(pg, loc, ms=380):
    b = loc.bounding_box()
    pg.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up()


def video(br):
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    enter(pg)
    kids = [i for i in ids(pg) if i.startswith('subject-') and len(i) > 30 and not i.endswith('avatar-initial')]
    rec = Recorder(pg, f'{OUT}/video.mp4')
    try:
        # 1. appui sur un bouton (compression immédiate, puis feuille d'actions qui monte et se referme)
        if tid(pg, 'home-aura').count():
            press_hold(pg, tid(pg, 'home-aura'), 420); pg.wait_for_timeout(1100)
            pg.go_back(); pg.wait_for_timeout(900); step('appui : entrée Aura')
        # 2. changement d'onglet (goutte liquide qui glisse)
        for t in ['tab-baby', 'tab-household', 'tab-health', 'tab-index']:
            if tid(pg, t).count():
                tid(pg, t).click(); pg.wait_for_timeout(550)
        step('onglets')
        # 3. ouverture d'un outil depuis « Mes outils »
        if tid(pg, 'tab-index').count():
            tid(pg, 'tab-index').click(); pg.wait_for_timeout(800)
        tile = pg.locator('[data-testid^="home-for-you-"]').filter(visible=True).first
        if tile.count():
            tile.click(); pg.wait_for_timeout(1800); pg.go_back(); pg.wait_for_timeout(1000); step('ouverture d’un outil')
        # 4. ajout d'une sieste : profil de l'enfant, action « Sieste », retour → le ruban montre la sieste à sa place
        if kids:
            # l'enfant dont l'accueil montre le cocon (ruban de la journée)
            for k in kids:
                tid(pg, k).click(); pg.wait_for_timeout(1600)
                if tid(pg, 'cocoon-ribbon').count():
                    break
            pg.mouse.wheel(0, 260); pg.wait_for_timeout(600)
            if tid(pg, 'quick-add').count():
                tid(pg, 'quick-add').click(); pg.wait_for_timeout(1200)
                if tid(pg, 'qa-nap').count():
                    tid(pg, 'qa-nap').click(); pg.wait_for_timeout(2200)
                    save = pg.locator('[data-testid="track-save"], [data-testid^="track-save"]').filter(visible=True).first
                    if save.count():
                        save.click(); pg.wait_for_timeout(2600)
                    step('ajout d’une sieste')
        # 5. coche d'une tâche (tracée après la confirmation du serveur de démonstration)
        pg.goto(B + '/family'); pg.wait_for_timeout(2600)
        done = pg.locator('[data-testid^="family-done-"]').filter(visible=True).last
        if done.count():
            done.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
            done.click(); pg.wait_for_timeout(2000); step('coche d’une tâche')
        # 6. feuille du sélecteur de thème : aperçu, puis on referme (le thème confirmé revient)
        pg.goto(B + '/'); pg.wait_for_timeout(2600); dismiss(pg)
        if tid(pg, 'home-theme').count():
            tid(pg, 'home-theme').click(); pg.wait_for_timeout(1300)
            for th in ['sable', 'lavande', 'olive']:
                if tid(pg, f'theme-{th}').count():
                    tid(pg, f'theme-{th}').click(); pg.wait_for_timeout(700)
            tid(pg, 'theme-apply').click(); pg.wait_for_timeout(1200); step('sélecteur de thème')
        # 7. Aura
        pg.goto(B + '/ask'); pg.wait_for_timeout(2400)
        inp = tid(pg, 'aura-input')
        if inp.count():
            inp.click(); inp.type('Où noter sa sieste ?', delay=35); pg.wait_for_timeout(400)
            if tid(pg, 'aura-send').count():
                tid(pg, 'aura-send').click(); pg.wait_for_timeout(3800)
        step('Aura')
    finally:
        rec.stop()
    ctx.close()


with sync_playwright() as p:
    br = p.chromium.launch()
    try:
        if os.environ.get('GM_SHOTS', '1') == '1':
            shots(br, '390-clair', 390, 844)
            shots(br, '390-graphite', 390, 844, theme='graphite')
            shots(br, '320-clair', 320, 568)
            shots(br, '390-clair-rm', 390, 844, reduced=True)
        if VIDEO:
            video(br)
    finally:
        br.close()
json.dump(REPORT, open(f'{OUT}/rapport.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in REPORT.items()}, ensure_ascii=False), REPORT['video'])
