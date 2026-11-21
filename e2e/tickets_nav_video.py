"""
Vidéo courte (tickets navigation et design) : « Découvrir sans compte » → accueil de la visite → barre d'onglets
(appui, changement d'onglet) → Mes outils → bouton palette → changement de thème → accueil.
Capture d'images en continu (CDP Page.startScreencast), assemblées par ffmpeg (système).

  NAV_URL=http://127.0.0.1:8982 OUT=/tmp/tn/video python3 e2e/tickets_nav_video.py
"""
import base64, os, subprocess, time
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8982')
OUT = os.environ.get('OUT', '/tmp/tn/video')
FR = os.path.join(OUT, 'frames')
os.makedirs(FR, exist_ok=True)
for f in os.listdir(FR): os.remove(os.path.join(FR, f))
TID = lambda t: f'[data-testid="{t}"]'

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.goto(B + '/intro?scene=start'); pg.locator(TID('intro-demo')).wait_for(timeout=120000); pg.wait_for_timeout(1500)
    cdp = ctx.new_cdp_session(pg)
    frames = []
    cdp.on('Page.screencastFrame', lambda e: (frames.append((time.time(), e['data'])), cdp.send('Page.screencastFrameAck', {'sessionId': e['sessionId']})))
    cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 80, 'maxWidth': 780, 'maxHeight': 1688, 'everyNthFrame': 1})
    t0 = time.time()

    def click(tid, wait=900):
        try:
            pg.locator(TID(tid)).first.click(timeout=8000)
        except Exception:
            pass
        pg.wait_for_timeout(wait)

    click('intro-demo', 200)
    pg.locator(TID('tab-health')).wait_for(timeout=60000); pg.wait_for_timeout(1500)
    for tab in ('tab-health', 'tab-baby', 'tab-household', 'tab-index'):
        bb = pg.locator(TID(tab)).first.bounding_box()
        pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(300); pg.mouse.up(); pg.wait_for_timeout(1100)
    click('home-tools-entry', 1800)
    if pg.locator(TID('tools-intro-ok')).count(): click('tools-intro-ok', 700)
    pg.mouse.wheel(0, 900); pg.wait_for_timeout(900); pg.mouse.wheel(0, 2500); pg.wait_for_timeout(1200)
    pg.go_back(); pg.wait_for_timeout(1500)
    click('home-theme', 1200)
    for pal in ('nacre', 'graphite', 'lavande'):
        click(f'theme-{pal}', 1100)
    click('theme-apply', 1500)
    click('tab-health', 1200); click('tab-index', 1500)
    cdp.send('Page.stopScreencast')
    b.close()

# images à cadence fixe (25 i/s) : chaque image est répétée jusqu'à la suivante
fps = 25
if frames:
    start = frames[0][0]; end = frames[-1][0] + 0.5
    n = 0; j = 0
    t = start
    while t < end:
        while j + 1 < len(frames) and frames[j + 1][0] <= t: j += 1
        with open(os.path.join(FR, f'{n:05d}.jpg'), 'wb') as f: f.write(base64.b64decode(frames[j][1]))
        n += 1; t += 1 / fps
    mp4 = os.path.join(OUT, 'visite_barre_theme.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(FR, '%05d.jpg'), '-vf', 'scale=390:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', mp4], check=True)
    print(mp4, n, 'images', round(end - start, 1), 's')
