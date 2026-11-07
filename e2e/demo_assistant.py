"""Démo reliée à l'assistant : la question part vers assistant-demo (serveur simulé ici), compteur du jour, limite sans offre Premium.
  python3 e2e/demo_assistant.py  (avec dist servi sur 8822)"""
import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; seen=[]
ANS={"answer":"Réponse de test","structured":{"short":"Lavez-vous les mains, eau d’abord puis poudre, mesurette rase.","actions":["Suivre la boîte"],"watch":[],"consult":["Demandez à la PMI."],"questions":[],"sources":[],"updated_on":"2026-11-07"},"sources":[],"safety":"none","demo":True,"stored":False,"limit":3}
def handler(route, req):
    seen.append(json.loads(req.post_data or '{}'))
    n=len(seen)
    if n<=1: route.fulfill(status=200, content_type='application/json', body=json.dumps(ANS))
    else: route.fulfill(status=402, content_type='application/json', body=json.dumps({"error":"quota_reached","message":"Vous avez utilisé les 3 questions de la démonstration pour aujourd’hui. Créez un compte gratuit pour continuer à poser vos questions.","limit":3}))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.route('**/functions/v1/assistant-demo', handler)
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3500)
    # depuis l'accueil, le lien « Réponse plus détaillée avec l'IA en ligne » ouvre l'assistant en ligne
    pg.locator('[data-testid="home-ai-input"]').filter(visible=True).first.fill('Comment préparer un biberon ?')
    pg.locator('[data-testid="home-ai-online"]').filter(visible=True).first.click(); pg.wait_for_timeout(4000)
    t=pg.inner_text('body')
    R['requete_envoyee']=len(seen)==1 and seen[0].get('message')=='Comment préparer un biberon ?' and len(seen[0].get('device_id',''))==36
    R['aucune_donnee_profil_envoyee']=set(seen[0].keys())<= {'message','device_id','recent_turns'} if seen else False
    R['reponse_affichee']='mesurette rase' in t
    R['compteur_jour_2_sur_3']='il vous reste 2 questions aujourd’hui (sur 3)' in t
    pg.screenshot(path='/tmp/demo-ai-1.png')
    box=pg.get_by_placeholder('Écrivez votre question…').filter(visible=True).last
    box.fill('Et la nuit ?'); pg.wait_for_timeout(300); pg.locator('[data-testid="chat-send"]').filter(visible=True).first.click(); pg.wait_for_timeout(3500)
    t=pg.inner_text('body')
    R['limite_message']='3 questions de la démonstration' in t
    R['compteur_epuise']='épuisées pour aujourd’hui' in t
    R['pas_de_paywall_premium']='Premium' not in t[-1500:]
    pg.screenshot(path='/tmp/demo-ai-2.png')
    print(json.dumps(R,ensure_ascii=False,indent=1)); print(seen)
