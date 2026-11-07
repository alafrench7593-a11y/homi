import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]; opened=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/solo-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    # capture des liens ouverts (sms:, https:) sans quitter la page
    pg.evaluate("() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; }")
    R['accueil_sans_carte_avant']=not has(pg,'home-solo')

    pg.goto(B+'/family/solo'); pg.wait_for_timeout(3000)
    tid(pg,'sol-sit-solo').click(); pg.wait_for_timeout(1500)
    R['situation_enregistree']=demo(pg,"s => s.tables.profiles.some(p => p.family_situation === 'solo')")
    # cercle d'aide
    tid(pg,'sol-circle-add').click(); pg.wait_for_timeout(800)
    tid(pg,'sc-name').fill('Mamie Jo'); tid(pg,'sc-phone').fill('06 12 34 56 78')
    tid(pg,'sc-help-nights').click(); tid(pg,'sc-help-pickup').click()
    tid(pg,'sc-save').click(); pg.wait_for_timeout(1500)
    R['cercle_ajoute']=has(pg,'sol-c-Mamie Jo') and demo(pg,"s => (s.tables.support_circle||[]).length")==1
    tid(pg,'sol-circle-add').click(); pg.wait_for_timeout(800)
    tid(pg,'sc-name').fill('Inès'); tid(pg,'sc-phone').fill('n importe quoi'); tid(pg,'sc-save').click(); pg.wait_for_timeout(800)
    R['telephone_invalide_refuse']='ne semble pas valide' in pg.inner_text('body')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    if has(pg,'sc-name'): pg.goto(B+'/family/solo'); pg.wait_for_timeout(2500)
    # demander un coup de main
    tid(pg,'sol-ask-nights').click(); pg.wait_for_timeout(500)
    R['aide_nuit_proposee']=has(pg,'sol-sms-Mamie Jo')
    tid(pg,'sol-ask-meals').click(); pg.wait_for_timeout(500)
    R['aide_repas_personne']=has(pg,'sol-ask-none')
    pg.screenshot(path=SHOT+'cercle.png', full_page=False)
    # aides
    body=pg.inner_text('body')
    R['aides']=all(x in body for x in ['Allocation de soutien familial','case T','12 ans','Simuler toutes mes aides'])
    R['aides_sans_montant']='€' not in body
    tid(pg,'sol-aid-asf').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    pg.screenshot(path=SHOT+'aides.png')
    # gestes
    tid(pg,'sol-g-open-crying').click(); pg.wait_for_timeout(600)
    body=pg.inner_text('body')
    R['geste_pleurs']='Ne secouez jamais' in body and has(pg,'sol-g-video-crying')
    tid(pg,'sol-g-crying').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    pg.screenshot(path=SHOT+'gestes.png')
    # préparer le dossier CAF -> papiers
    tid(pg,'sol-aid-prep-asf').click(); pg.wait_for_timeout(2500)
    R['dossier_caf_ouvert']='/family/papers' in pg.url and has(pg,'pp-dossier') and 'Dossier CAF' in pg.inner_text('body')
    # accueil
    pg.goto(B+'/'); pg.wait_for_timeout(3500)
    R['accueil_carte_solo']=has(pg,'home-solo') and '1 personne dans mon cercle' in pg.inner_text('body')
    if has(pg,'home-solo'):
        tid(pg,'home-solo').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=SHOT+'accueil.png')
    # je décroche avec le cercle
    pg.goto(B+'/family/offduty'); pg.wait_for_timeout(3000)
    pg.evaluate("() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; }")
    R['decroche_possible']=tid(pg,'off-go').is_enabled()
    R['decroche_message_sms']='Un SMS déjà écrit' in pg.inner_text('body')
    tid(pg,'off-go').click(); pg.wait_for_timeout(2500)
    opened=pg.evaluate("() => window.__opened")
    R['decroche_actif_relais_mamie']=has(pg,'off-active') and 'Mamie Jo' in pg.inner_text('body')
    R['decroche_ligne']=demo(pg,"s => (s.tables.offduty_periods||[]).some(o => !!o.relay_contact_id)")
    R['sms_ouvert']=any(u.startswith('sms:0612345678') for u in opened) if opened else 'non capturé: '+str(opened)
    pg.screenshot(path=SHOT+'decroche.png')
    tid(pg,'off-stop').click(); pg.wait_for_timeout(1500)
    # réglages famille
    pg.goto(B+'/settings/family'); pg.wait_for_timeout(2500)
    R['reglages_lien']=has(pg,'fam-situation')
    # catalogue
    pg.goto(B+'/tools'); pg.wait_for_timeout(2500)
    R['catalogue']='Maman solo' in pg.inner_text('body')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
