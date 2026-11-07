import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF, SET_BODY
B='http://127.0.0.1:8822'; R={}; errs=[]
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    # pendant le mois gratuit
    pg.goto(B+'/family/custody'); pg.wait_for_timeout(3000)
    R['essai_bandeau']=tid(pg,'tool-offer-trial').count()>0 and 'Mois gratuit' in pg.inner_text('body')
    R['essai_contenu_ouvert']=pg.locator('[data-testid="tool-locked-content"]').count()==0
    pg.screenshot(path='/tmp/offre-essai.png')
    # outil gratuit : pas de bandeau
    pg.goto(B+'/family/sos'); pg.wait_for_timeout(2000)
    R['outil_gratuit_sans_bandeau']=pg.locator('[data-testid^="tool-offer-"]').count()==0
    # fin d'essai simulée
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (s.tables._access ??= [{}])[0].trial_until = new Date(Date.now() - 86400000).toISOString(); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.reload(); pg.wait_for_timeout(2500)
    pg.goto(B+'/family/custody'); pg.wait_for_timeout(3000)
    R['apres_essai_verrouille']=tid(pg,'tool-offer-locked').count()>0 and pg.locator('[data-testid="tool-locked-content"]').count()>0
    R['apres_essai_message']='reste consultable' in pg.inner_text('body')
    pg.screenshot(path='/tmp/offre-verrou.png')
    tid(pg,'tool-offer-buy').click(); pg.wait_for_timeout(3000)
    R['achat_a_vie_debloque']=pg.locator('[data-testid="tool-locked-content"]').count()==0 and demo(pg,"s => (s.tables.entitlement_grants||[]).some(g => g.entitlement === 'TOOL_CUSTODY' && g.active)")
    R['autre_outil_toujours_verrouille']=False
    pg.goto(B+'/bottle/scoops'); pg.wait_for_timeout(2500)
    R['autre_outil_toujours_verrouille']=pg.locator('[data-testid="tool-locked-content"]').count()>0
    # écran abonnement : offres
    pg.goto(B+'/settings/subscription'); pg.wait_for_timeout(3500)
    R['abonnement_offre_ia']=tid(pg,'offer-ai').count()>0 and '250 questions' in pg.inner_text('body')
    R['abonnement_outils']=pg.locator('[data-testid^="offer-tool-"]').filter(visible=True).count()>=10
    tid(pg,'offer-ai').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path='/tmp/offre-abonnement.png')
    tid(pg,'offer-ai-buy').click(); pg.wait_for_timeout(2500)
    R['ia_active']=tid(pg,'offer-ai-active').count()>0
    R['ia_quota_250']=pg.evaluate("async () => 1")==1
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
