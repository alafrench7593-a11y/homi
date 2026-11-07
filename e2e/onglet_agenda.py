import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/agenda-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    R['onglets']=[t.get_attribute('aria-label') for t in pg.get_by_role('tab').all()]
    left=[tid(pg,f'tab-{n}').bounding_box() for n in ['index','agenda','track']]; right=[tid(pg,f'tab-{n}').bounding_box() for n in ['community','ask','profile']]
    orb=pg.get_by_role('tab', name='Outils').bounding_box()
    R['outils_centre_exact']=abs(orb['x']+orb['width']/2-195)<1.5
    R['largeurs_egales']=max(x['width'] for x in left+right)-min(x['width'] for x in left+right)<1
    R['largeur_min']=round(min(x['width'] for x in left+right),1)
    pg.screenshot(path=SHOT+'barre.png', clip={'x':0,'y':734,'width':390,'height':110})
    tid(pg,'tab-agenda').click(); pg.wait_for_timeout(2500)
    body=pg.inner_text('body')
    R['ouvre_agenda']=pg.url.endswith('/agenda') and 'Agenda' in body and tid(pg,'tab-agenda').get_attribute('aria-selected')=='true'
    R['pas_de_bouton_retour']=pg.get_by_role('button', name='Retour').filter(visible=True).count()==0
    R['creation_evenement']=has(pg,'calendar-add')
    tid(pg,'calendar-add').click(); pg.wait_for_timeout(1200)
    R['fenetre_creation']='Nouvel événement' in pg.inner_text('body')
    pg.screenshot(path=SHOT+'ecran.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    # l'ancienne adresse marche toujours
    pg.goto(B+'/calendar'); pg.wait_for_timeout(2500)
    R['ancienne_adresse_calendar']='Agenda' in pg.inner_text('body')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
