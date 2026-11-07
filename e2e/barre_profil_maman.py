import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]
IMG='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/img/'
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/barre-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    # sans photo : initiale
    R['barre_initiale_sans_photo']=has(pg,'subject-me-avatar-initial')
    # ajout de la photo de la maman
    pg.goto(B+'/profile'); pg.wait_for_timeout(2500)
    tid(pg,'profile-photo').click(); pg.wait_for_timeout(800)
    with pg.expect_file_chooser() as fc: tid(pg,'pp-library').click()
    fc.value.set_files(IMG+'portrait.jpg'); pg.wait_for_timeout(3500)
    pg.goto(B+'/'); pg.wait_for_timeout(3500)
    R['barre_photo_maman']=pg.locator('[data-testid="profile-switcher"] img[data-testid="subject-me-avatar"], [data-testid="profile-switcher"] [data-testid="subject-me-avatar"]').count()>=1 and not has(pg,'subject-me-avatar-initial')
    pg.screenshot(path=SHOT+'accueil.png', clip={'x':0,'y':0,'width':390,'height':300})
    tid(pg,'profile-switcher').click(); pg.wait_for_timeout(800)
    R['liste_moi_photo']=pg.locator('[data-testid="subject-me"] [data-testid="subject-me-avatar"]').count()>=1
    pg.screenshot(path=SHOT+'liste.png')
    lina=demo(pg,"s => s.tables.children.find(c => c.first_name === 'Lina').id")
    tid(pg,f'subject-{lina}').click(); pg.wait_for_timeout(3000)
    R['bulle_moi']=has(pg,'bubble-me') and has(pg,'bubble-me-avatar') and not has(pg,'bubble-me-avatar-initial')
    R['bulle_moi_prenom']='Camille' in tid(pg,'bubble-me').inner_text()
    R['bulle_moi_en_premier']=pg.locator('[data-testid="profile-bubbles"] [data-testid^="bubble-"]').first.get_attribute('data-testid')=='bubble-me'
    pg.screenshot(path=SHOT+'bulles.png', clip={'x':0,'y':0,'width':390,'height':330})
    tid(pg,'bubble-me').click(); pg.wait_for_timeout(2500)
    R['retour_moi']=not has(pg,'profile-bubbles') and 'Moi' in tid(pg,'profile-switcher').inner_text()
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
