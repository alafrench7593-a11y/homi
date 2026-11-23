"""
Direction artistique « Liquid Glass » (20/11/2026) — captures et courtes vidéos AVANT / APRÈS de l'application réelle
(export web, mode démo + Premium injecté). Outil de PRÉSENTATION : il ne fait pas partie de l'application.

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/homi-da/dist
  python3 e2e/spa_server.py /tmp/homi-da/dist 8961 &
  NAV_URL=http://127.0.0.1:8961 DA_OUT=/tmp/homi-da/apres DA_VIDEO=1 python3 e2e/da_liquid_glass.py

Écrit : <DA_OUT>/<vue>-<appareil>-<thème>.png, <DA_OUT>/video/*.webm et <DA_OUT>/rapport.json (mesures : cibles
tactiles < 44 pt de la barre, débordements horizontaux, erreurs de la console).
"""
import base64, json, os, subprocess, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8961')
OUT = os.environ.get('DA_OUT', '/tmp/homi-da/out')
VIDEO = os.environ.get('DA_VIDEO') == '1'
ONLY = os.environ.get('DA_ONLY')  # liste de vues séparées par des virgules
os.makedirs(OUT, exist_ok=True)

PREMIUM = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId; const now = new Date();
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, entitlement: 'HOMI_PREMIUM', status: 'active', product_id: 'homi_premium_monthly', store: 'test',
    period_type: 'monthly', expires_at: new Date(now.getTime() + 30 * 86400000).toISOString(), will_renew: true, tier: 'premium', updated_at: now.toISOString() });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""

# vue → (adresse, défilement facultatif)
VIEWS = [
    ('accueil', '/', 0),
    ('accueil-bas', '/', 1400),
    ('outils', '/tools', 0),
    ('outils-categorie', '/tools/sleep', 0),
    ('enfant', '/baby', 0),
    ('famille', '/household', 0),
    ('moi', '/health', 0),
    ('aura', '/ask', 0),
    ('sommeil', '/night', 0),
    ('mon-sommeil', '/me/sleep', 0),
    ('routines', '/family/routines', 0),
    ('taches', '/family', 0),
    ('repas', '/meals?for=baby', 0),
    ('allaitement', '/track/breastfeed', 0),
    ('profil', '/profile', 0),
    ('icones', '/dev/icons', 0),
    ('reglages-apropos', '/settings', 6000),
]
DEVICES = [('390', 390, 844), ('320', 320, 568)]
REPORT = {'erreurs': [], 'debordements': {}, 'cibles_barre': {}}


class Recorder:
    """Vidéo par le « screencast » de Chromium (CDP) puis ffmpeg : images horodatées → MP4 à cadence réelle."""

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


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def enter_demo(pg):
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM)
    pg.goto(B + '/'); pg.wait_for_timeout(3500)


def overflow(pg):
    return pg.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")


def tab_targets(pg):
    return pg.evaluate("""() => [...document.querySelectorAll('[role="tab"], [data-testid="quick-add"]')].filter(e => e.offsetParent !== null)
      .map(e => { const r = e.getBoundingClientRect(); return [e.getAttribute('aria-label') || e.textContent, Math.round(r.width), Math.round(r.height)]; })""")


def shots(br, scheme, dev, w, h, reduced=False):
    ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, color_scheme=scheme,
                                 reduced_motion='reduce' if reduced else 'no-preference', locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: REPORT['erreurs'].append(f'{dev}-{scheme} PAGE {str(e)[:200]}'))
    enter_demo(pg)
    for name, path, scroll in VIEWS:
        if ONLY and name not in ONLY.split(','):
            continue
        pg.goto(B + path); pg.wait_for_timeout(2600)
        if scroll:
            pg.evaluate("""(y) => { const els = [...document.querySelectorAll('[data-testid=\"screen-scroll\"], [data-testid=\"home-scroll\"]')].filter(e => e.offsetParent !== null);
              const el = els[els.length - 1] || document.scrollingElement; el.scrollTop = y; }""", scroll); pg.wait_for_timeout(1200)
        suffix = f'{dev}-{scheme}' + ('-rm' if reduced else '')
        pg.screenshot(path=f'{OUT}/{name}-{suffix}.png')
        o = overflow(pg)
        if o > 0:
            REPORT['debordements'][f'{name}-{suffix}'] = o
        if name == 'accueil':
            REPORT['cibles_barre'][suffix] = tab_targets(pg)
    ctx.close()


def videos(br):
    vdir = f'{OUT}/video'
    os.makedirs(vdir, exist_ok=True)
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()

    def clip(name, fn):
        r = Recorder(pg, f'{vdir}/{name}.mp4')
        try:
            fn()
        finally:
            r.stop()

    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(3500)
    pg.evaluate(PREMIUM); pg.goto(B + '/'); pg.wait_for_timeout(3000)

    # 1. logo : la signature animée (galerie : symbole de verre + familles de logos rejouées, minuteur)
    def logo():
        pg.goto(B + '/dev/icons'); pg.wait_for_timeout(2400)
        for t in ['logos-replay', 'logos-timer']:
            if tid(pg, t).count():
                tid(pg, t).click(); pg.wait_for_timeout(1800)
        if tid(pg, 'logos-timer').count():
            tid(pg, 'logos-timer').click(); pg.wait_for_timeout(800)
    clip('1-logo', logo)
    pg.goto(B + '/'); pg.wait_for_timeout(2500)

    # 2. accueil + barre : défilement sous le verre, onglets touchés vite (transitions interrompues)
    def home():
        pg.mouse.wheel(0, 900); pg.wait_for_timeout(900); pg.mouse.wheel(0, -900); pg.wait_for_timeout(700)
        for t in ['tab-health', 'tab-baby', 'tab-household', 'tab-index', 'tab-baby', 'tab-index']:
            loc = tid(pg, t)
            if loc.count():
                loc.click(); pg.wait_for_timeout(240)
        pg.wait_for_timeout(900)
    clip('2-accueil-barre', home)

    # 3. un bouton : l'action centrale (pression, feuille, fermeture)
    def button():
        if tid(pg, 'quick-add').count():
            b = tid(pg, 'quick-add').bounding_box()
            pg.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(350); pg.mouse.up()
            pg.wait_for_timeout(1300)
            pg.keyboard.press('Escape'); pg.wait_for_timeout(900)
    clip('3-bouton', button)

    # 4. un outil : catalogue → recherche par phrase → ouverture → minuteur
    def tool():
        pg.goto(B + '/tools'); pg.wait_for_timeout(2200)
        box = pg.locator('input').filter(visible=True).first
        if box.count():
            box.click(); box.type('Mon bébé prend le sein', delay=40); pg.wait_for_timeout(1500)
            hit = pg.locator('[data-testid^="tool-row-"], [data-testid^="search-result-"]').filter(visible=True).first
            if hit.count():
                hit.click(); pg.wait_for_timeout(1600)
        pg.goto(B + '/track/breastfeed'); pg.wait_for_timeout(2000)
        start = pg.locator('[data-testid*="start"]').filter(visible=True).first
        if start.count():
            start.click(); pg.wait_for_timeout(2500)
    clip('4-outil', tool)

    # 5. Aura : ouverture, saisie, suggestions
    def aura():
        pg.goto(B + '/ask'); pg.wait_for_timeout(2500)
        inp = pg.locator('textarea, input').filter(visible=True).first
        if inp.count():
            inp.click(); inp.type('Comment aider mon bébé à dormir ?', delay=35); pg.wait_for_timeout(1200)
    clip('5-aura', aura)
    ctx.close()


with sync_playwright() as p:
    br = p.chromium.launch()
    try:
        if os.environ.get('DA_SHOTS', '1') == '1':
            shots(br, 'light', '390', 390, 844)
            shots(br, 'dark', '390', 390, 844)
            shots(br, 'light', '320', 320, 568)
        if os.environ.get('DA_RM') == '1':
            shots(br, 'light', '390', 390, 844, reduced=True)
        if VIDEO:
            videos(br)
    finally:
        br.close()
json.dump(REPORT, open(f'{OUT}/rapport.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in REPORT.items()}, ensure_ascii=False))
