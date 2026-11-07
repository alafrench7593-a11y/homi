import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]
IMG='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/img/'
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/barrebas-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,name in [(390,844,'iphone'),(375,667,'petit')]:
        pg=b.new_page(viewport={'width':w,'height':h}, locale='fr-FR')
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
        pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
        pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
        labels=[t.get_attribute('aria-label') for t in pg.get_by_role('tab').all()]
        R[f'{name}_onglets']=labels
        R[f'{name}_profil_dans_barre']=has(pg,'tab-profile') and 'Camille' in tid(pg,'tab-profile').inner_text()
        R[f'{name}_initiale_sans_photo']=has(pg,'tab-profile-avatar-initial')
        # outils toujours au centre
        bar=pg.locator('[data-testid="tab-index"]').first.bounding_box(); prof=tid(pg,'tab-profile').bounding_box()
        R[f'{name}_profil_a_droite']=prof['x']>bar['x']
        # libellés non coupés / pas de débordement horizontal
        R[f'{name}_pas_de_debordement']=pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth")
        if name=='iphone':
            tid(pg,'tab-profile').click(); pg.wait_for_timeout(2500)
            R['ouvre_profil']=pg.url.endswith('/profile') and tid(pg,'tab-profile').get_attribute('aria-selected')=='true'
            tid(pg,'profile-photo').click(); pg.wait_for_timeout(800)
            with pg.expect_file_chooser() as fc: tid(pg,'pp-library').click()
            fc.value.set_files(IMG+'portrait.jpg'); pg.wait_for_timeout(3500)
            R['photo_dans_barre']=has(pg,'tab-profile-avatar') and not has(pg,'tab-profile-avatar-initial')
            pg.screenshot(path=SHOT+'actif.png', clip={'x':0,'y':h-110,'width':w,'height':110})
            tid(pg,'tab-index').click(); pg.wait_for_timeout(2500)
            R['retour_accueil_photo_reste']=has(pg,'tab-profile-avatar') and tid(pg,'tab-profile').get_attribute('aria-selected')=='false'
            pg.screenshot(path=SHOT+'accueil.png', clip={'x':0,'y':h-110,'width':w,'height':110})
        else:
            pg.screenshot(path=SHOT+'petit.png', clip={'x':0,'y':h-110,'width':w,'height':110})
        pg.close()
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
