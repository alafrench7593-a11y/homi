import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]; yt=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/va-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('request', lambda r: yt.append(r.url) if ('youtube' in r.url or 'ytimg' in r.url) else None)
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3500)
    # accueil
    R['accueil_carte']=has(pg,'home-videos') and '20 vidéos officielles' in pg.inner_text('body')
    if has(pg,'home-videos'):
        tid(pg,'home-videos').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=SHOT+'accueil.png')
        tid(pg,'home-videos-sleep').click(); pg.wait_for_timeout(2500)
        R['accueil_vers_theme_sommeil']='/videos' in pg.url and has(pg,'vid-card-qG88EmGtSPQ') and not has(pg,'vid-card-O2IzhSBA0OI')
    # section complète
    pg.goto(B+'/videos'); pg.wait_for_timeout(3000)
    tid(pg,'vid-topic-all').click(); pg.wait_for_timeout(800)
    R['toutes_20']=pg.locator('[data-testid^="vid-card-"]').filter(visible=True).count()==20
    R['articles_sous_videos']=pg.locator('[data-testid^="vid-art-"]').filter(visible=True).count()>=40
    R['rien_youtube_avant_lecture']=len(yt)==0
    tid(pg,'vid-topic-feeding').click(); pg.wait_for_timeout(800)
    R['theme_allaitement']=has(pg,'vid-card-O2IzhSBA0OI') and pg.locator('[data-testid^="vid-card-"]').filter(visible=True).count()==2
    body=pg.inner_text('body')
    R['article_allaitement_lie']='Allaitement' in body
    pg.screenshot(path=SHOT+'section.png')
    tid(pg,'video-play-O2IzhSBA0OI').click(); pg.wait_for_timeout(1500)
    fr=pg.locator('iframe[data-testid="video-frame"]')
    R['lecture_dans_appli']=fr.count()==1 and fr.first.get_attribute('src').startswith('https://www.youtube-nocookie.com/embed/O2IzhSBA0OI?')
    # article lié
    art=pg.locator('[data-testid^="vid-art-O2IzhSBA0OI-"]').filter(visible=True).first
    art.click(); pg.wait_for_timeout(2500)
    R['ouvre_article']='/article/' in pg.url and len(pg.inner_text('body'))>500
    # bibliothèque
    pg.goto(B+'/library'); pg.wait_for_timeout(3500)
    tid(pg,'library-videos').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    R['bibliotheque_bloc_videos']=has(pg,'library-videos') and 'Aucune vidéo publiée' not in pg.inner_text('body')
    pg.screenshot(path=SHOT+'bibliotheque.png')
    tid(pg,'library-videos-open').click(); pg.wait_for_timeout(2000)
    R['bibliotheque_vers_section']='/videos' in pg.url
    # profil
    pg.goto(B+'/profile'); pg.wait_for_timeout(3000)
    R['profil_ligne']=has(pg,'profile-videos')
    # maman solo
    pg.goto(B+'/family/solo'); pg.wait_for_timeout(3000)
    R['solo_lien_section']=has(pg,'sol-videos-all')
    tid(pg,'sol-videos-all').click(); pg.wait_for_timeout(2000)
    R['solo_vers_section']='/videos' in pg.url
    # catalogue
    pg.goto(B+'/tools'); pg.wait_for_timeout(2500)
    R['catalogue']='Vidéos & articles' in pg.inner_text('body')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
