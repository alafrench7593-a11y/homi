import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]; yt=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/video-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('request', lambda r: yt.append(r.url) if ('youtube' in r.url or 'ytimg' in r.url or 'googlevideo' in r.url) else None)
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    pg.goto(B+'/family/solo'); pg.wait_for_timeout(3000)
    tid(pg,'sol-videos').scroll_into_view_if_needed(); pg.wait_for_timeout(500)
    R['section_videos']=has(pg,'sol-videos') and pg.locator('[data-testid^="video-play-"]').filter(visible=True).count()>=8
    R['rien_charge_avant_lecture']=len(yt)==0
    pg.screenshot(path=SHOT+'liste.png')
    tid(pg,'sol-v-topic-me').click(); pg.wait_for_timeout(500)
    R['theme_pour_moi']=has(pg,'video-play-cF5O8Mkz-Is') and not has(pg,'video-play--9O4Go_lidQ')
    tid(pg,'sol-v-topic-baby').click(); pg.wait_for_timeout(500)
    tid(pg,'video-play-qG88EmGtSPQ').click(); pg.wait_for_timeout(1500)
    fr=pg.locator('iframe[data-testid="video-frame"]')
    R['lecteur_dans_l_appli']=fr.count()==1
    src=fr.first.get_attribute('src') if fr.count() else ''
    R['lecteur_sans_cookie']=src.startswith('https://www.youtube-nocookie.com/embed/qG88EmGtSPQ?') and 'autoplay=1' in src and 'rel=0' in src
    R['url_lecteur']=src
    R['requete_youtube_apres_appui']=any('youtube-nocookie.com/embed/qG88EmGtSPQ' in u for u in yt)
    R['meme_page']='/family/solo' in pg.url
    pg.screenshot(path=SHOT+'lecture.png')
    # vidéo dans la fiche « quand bébé pleure »
    tid(pg,'sol-g-open-crying').click(); pg.wait_for_timeout(600)
    R['video_dans_geste_pleurs']=has(pg,'sol-g-video-crying') and has(pg,'video-play--9O4Go_lidQ')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
