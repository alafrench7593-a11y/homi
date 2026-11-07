import sys, json, base64, io
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
from PIL import Image
import piexif
B='http://127.0.0.1:8822'; R={}; errs=[]
IMG='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/img/'
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/enfant-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def upload(pg, f):
    with pg.expect_file_chooser() as fc: tid(pg,'pp-library').click()
    fc.value.set_files(IMG+f); pg.wait_for_timeout(3500)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    lina=demo(pg,"s => s.tables.children.find(c => c.first_name === 'Lina')")
    R['enfant_demo']=lina['first_name'] if lina else None
    pg.goto(B+f"/child/{lina['id']}"); pg.wait_for_timeout(3500)
    R['bouton_photo_fiche']=has(pg,'child-photo')
    tid(pg,'child-photo').click(); pg.wait_for_timeout(800)
    body=pg.inner_text('body')
    R['fenetre_enfant']='Photo de Lina' in body and 'qui ont accès à cet enfant' in body and not has(pg,'pp-remove')
    pg.screenshot(path=SHOT+'fenetre.png')
    upload(pg,'portrait.jpg')
    c=demo(pg,f"s => s.tables.children.find(c => c.id === '{lina['id']}')")
    path=c.get('photo_path')
    R['chemin']=path
    R['chemin_ok']=bool(path) and path.startswith(f"{lina['household_id']}/children/{lina['id']}/") and path.endswith('.jpg')
    f=demo(pg,f"s => (s.tables._files||[]).find(f => f.path === '{path}')")
    R['espace_avatars']=bool(f) and f['bucket']=='avatars'
    if f and f['uri'].startswith('data:'):
        raw=base64.b64decode(f['uri'].split(',',1)[1]); im=Image.open(io.BytesIO(raw))
        R['carre_512']=im.size==(512,512)
        try: R['sans_gps']=not piexif.load(raw).get('GPS')
        except Exception: R['sans_gps']=True
    R['fiche_affiche_image']=pg.locator('[data-testid="child-photo"] img').count()>=1
    pg.screenshot(path=SHOT+'fiche.png', clip={'x':0,'y':0,'width':390,'height':260})
    # Profil › Ma famille
    pg.goto(B+'/profile'); pg.wait_for_timeout(3000)
    R['profil_famille_image']=pg.locator('[data-testid="profile-child-Lina"] img').count()>=1
    tid(pg,'profile-child-Lina').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    pg.screenshot(path=SHOT+'profil.png')
    # sélecteur de profil (accueil)
    pg.goto(B+'/'); pg.wait_for_timeout(3500)
    if has(pg,'profile-switcher'):
        tid(pg,'profile-switcher').click(); pg.wait_for_timeout(800)
        R['selecteur_image']=pg.locator(f'[data-testid="subject-{lina["id"]}"] img').count()>=1
        pg.screenshot(path=SHOT+'selecteur.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    else:
        R['selecteur_image']='bouton absent'
    # changer puis supprimer
    pg.goto(B+f"/child/{lina['id']}"); pg.wait_for_timeout(3000)
    tid(pg,'child-photo').click(); pg.wait_for_timeout(800)
    upload(pg,'portrait2.jpg')
    path2=demo(pg,f"s => s.tables.children.find(c => c.id === '{lina['id']}').photo_path")
    R['changee']=bool(path2) and path2!=path
    R['ancienne_effacee']=demo(pg,f"s => !(s.tables._files||[]).some(f => f.path === '{path}')")
    tid(pg,'child-photo').click(); pg.wait_for_timeout(800)
    tid(pg,'pp-remove').click(); pg.wait_for_timeout(800)
    pg.get_by_role('button', name='Supprimer la photo').filter(visible=True).last.click(); pg.wait_for_timeout(2000)
    R['supprimee']=demo(pg,f"s => !s.tables.children.find(c => c.id === '{lina['id']}').photo_path")
    R['fichier_supprime']=demo(pg,f"s => !(s.tables._files||[]).some(f => f.path === '{path2}')")
    R['initiales_revenues']=pg.locator('[data-testid="child-photo"] img').count()==0
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
