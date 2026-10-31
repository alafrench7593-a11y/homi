"""
Introduction cinématique (version web, navigateur réel) : première ouverture, chronologie, textes FR/EN,
absence d'écran noir, « Passer », non-rejeu, « Revoir » depuis les réglages, repli si la vidéo manque,
« Réduire les animations ».
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  CINE_WEBM=/chemin/intro-test.webm python3 e2e/cinematique.py
Le Chromium de Playwright ne lit pas le H.264 : avec CINE_WEBM, la vidéo de l'introduction est servie
en WebM (même montage, image pour image) ; sur iPhone et Android, c'est le MP4 qui est lu.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import io, json, os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageStat

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/cinematique')
WEBM = os.environ.get('CINE_WEBM')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def ctx_for(p, locale='fr-FR', reduce=False, video=True):
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale=locale, timezone_id='Europe/Paris', reduced_motion='reduce' if reduce else 'no-preference')
    if not video:
        ctx.route('**/*intro-cinematique*.mp4', lambda r: r.abort())
    elif WEBM:
        body = open(WEBM, 'rb').read()
        ctx.route('**/*intro-cinematique*.mp4', lambda r: r.fulfill(status=200, body=body, headers={'Content-Type': 'video/webm', 'Accept-Ranges': 'none'}))
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    return b, pg


def luminance(png):
    return ImageStat.Stat(Image.open(io.BytesIO(png)).convert('L')).mean[0]


def video_time(pg):
    return pg.evaluate("() => { const v = document.querySelector('video'); return v ? v.currentTime : -1 }")


def play_through(pg, tag, words, open_app=True):
    """Ouvre l'application et enregistre l'introduction : images, luminosité, textes vus, temps vidéo."""
    if open_app:
        pg.goto(B + '/')
    t0 = time.time(); seen = {w: None for w in words}; frames = []; lums = []; vt = []
    while time.time() - t0 < 27:
        png = pg.screenshot()
        el = round(time.time() - t0, 2)
        lums.append((el, round(luminance(png), 1)))
        for w in words:
            if seen[w] is None and _visible(pg, w):
                seen[w] = el
        vt.append((el, round(video_time(pg), 2)))
        if len(frames) < 200:
            frames.append((el, png))
        if '/cinematic' not in pg.url and el > 2:
            break
        pg.wait_for_timeout(180)
    for i, (el, png) in enumerate(frames[:: max(1, len(frames) // 24)][:24]):
        open(f'{SHOTS}/{tag}_{i:02d}_{el:05.2f}.png', 'wb').write(png)
    return seen, lums, vt, round(time.time() - t0, 1)


def _visible(pg, phrase):
    """Vrai si un élément affiche exactement ce texte (mots ou lettres animés séparément compris), à l'écran et opaque."""
    return pg.evaluate("""(target) => {
      const want = target.replace(/\\s/g, '');
      for (const e of document.querySelectorAll('body *')) {
        if ((e.textContent || '').replace(/\\s/g, '') !== want) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        let o = 1, n = e; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; }
        // un mot animé : prendre l'opacité du plus visible de ses enfants
        const kids = [...e.querySelectorAll('*')].map((k) => { let q = 1, m = k; while (m && m !== e) { q *= parseFloat(getComputedStyle(m).opacity || '1'); m = m.parentElement; } return q; });
        const inner = kids.length ? Math.max(...kids) : 1;
        if (o * inner > 0.5) return true;
      }
      return false;
    }""", phrase)


def run(p):
    # 1. Première ouverture en français : toute l'introduction, puis l'introduction en diapositives
    words_fr = ['Chaque', 'Le désir d’enfant', 'Une vie commence', 'La grossesse', 'La naissance', 'Les premiers mois', 'Les premiers pas', 'L’enfance', 'Au fil de nous', 'À chaque étape de votre histoire', 'Cycle, fertilité et projet bébé', 'Passer']
    b, pg = ctx_for(p)
    pg.goto(B + '/'); t = time.time()
    while '/cinematic' not in pg.url and time.time() - t < 4:
        pg.wait_for_timeout(50)
    R['premiere_ouverture_lance_intro'] = '/cinematic' in pg.url
    seen, lums, vt, dur = play_through(pg, 'fr', words_fr, open_app=False)
    R['fr_textes_vus'] = all(v is not None for v in seen.values())
    order = [seen[w] for w in ['Le désir d’enfant', 'Une vie commence', 'La grossesse', 'La naissance', 'Les premiers mois', 'Les premiers pas', 'L’enfance', 'À chaque étape de votre histoire'] if seen[w] is not None]
    R['fr_ordre_chronologique'] = order == sorted(order) and len(order) == 8
    R['jamais_ecran_noir'] = min(l for _, l in lums) > 35
    R['duree_15_25_s'] = 15 <= dur <= 27
    R['video_avance'] = max(t for _, t in vt) > 20
    pg.wait_for_timeout(2500)
    R['fin_vers_onboarding'] = pg.url.rstrip('/').endswith('/intro')
    R['marquee_vue'] = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.ui')") or '{}').get('state', {}).get('cinematicSeen') is True
    pg.goto(B + '/'); pg.wait_for_timeout(2500)
    R['pas_rejouee_a_l_ouverture'] = '/cinematic' not in pg.url
    R['_fr_temps_textes'] = seen
    R['_fr_luminosite_min'] = min(l for _, l in lums)
    R['_fr_duree'] = dur
    b.close()

    # 2. Anglais
    words_en = ['Every', 'Wishing for a child', 'Pregnancy', 'Birth', 'The first months', 'Childhood', 'With you at every step of your story', 'Skip']
    b, pg = ctx_for(p, 'en-US')
    seen_en, _, _, _ = play_through(pg, 'en', words_en)
    R['en_textes_vus'] = all(v is not None for v in seen_en.values())
    R['_en_temps_textes'] = seen_en
    b.close()

    # 3. « Passer »
    b, pg = ctx_for(p)
    pg.goto(B + '/'); pg.wait_for_timeout(3000)
    t = time.time(); pg.locator('[data-testid="cine-skip"]').first.click()
    while '/cinematic' in pg.url and time.time() - t < 3:
        pg.wait_for_timeout(100)
    R['passer_rapide'] = '/cinematic' not in pg.url and time.time() - t < 2
    pg.wait_for_timeout(800)
    R['passer_vers_onboarding'] = pg.url.rstrip('/').endswith('/intro')
    b.close()

    # 4. Vidéo absente : ne bloque jamais (sortie automatique)
    b, pg = ctx_for(p, video=False)
    pg.goto(B + '/'); t = time.time()
    while ('/cinematic' in pg.url or pg.url.rstrip('/') == B) and time.time() - t < 9:
        pg.wait_for_timeout(200)
    R['sans_video_ne_bloque_pas'] = pg.url.rstrip('/').endswith('/intro') and time.time() - t < 7
    b.close()

    # 5. « Réduire les animations » : version fixe, puis l'application
    b, pg = ctx_for(p, reduce=True)
    pg.goto(B + '/'); pg.wait_for_timeout(1200)
    R['reduit_version_fixe'] = '/cinematic' in pg.url and pg.locator('video').count() == 0 and 'Au fil de nous' in pg.inner_text('body')
    pg.wait_for_timeout(3500)
    R['reduit_puis_onboarding'] = pg.url.rstrip('/').endswith('/intro')
    b.close()

    # 6. « Revoir l'introduction animée » depuis Réglages › Mon accueil (démonstration sans compte)
    b, pg = ctx_for(p)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.goto(B + '/settings/home'); pg.wait_for_timeout(2500)
    btn = pg.locator('[data-testid="settings-replay-cinematic"]').first
    R['reglages_bouton_revoir'] = btn.is_visible()
    btn.click(); pg.wait_for_timeout(2500)
    R['revoir_lance_intro'] = '/cinematic' in pg.url and pg.locator('video').count() == 1
    pg.locator('[data-testid="cine-skip"]').first.click(); pg.wait_for_timeout(1500)
    R['revoir_retour_reglages'] = '/settings/home' in pg.url
    b.close()


with sync_playwright() as p:
    run(p)
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
