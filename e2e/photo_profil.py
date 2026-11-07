import sys, json, base64, io
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
from PIL import Image
import piexif
B='http://127.0.0.1:8822'; R={}; errs=[]
IMG='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/img/'
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/photo-'
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
    R['initiale_avant']=has(pg,'header-avatar-initial')
    pg.goto(B+'/profile'); pg.wait_for_timeout(3000)
    R['lien_ajouter']='Ajouter une photo' in pg.inner_text('body')
    tid(pg,'profile-photo').click(); pg.wait_for_timeout(800)
    R['fenetre']=has(pg,'pp-camera') and has(pg,'pp-library') and not has(pg,'pp-remove') and 'sans sa position GPS' in pg.inner_text('body')
    pg.screenshot(path=SHOT+'fenetre.png')
    upload(pg,'portrait.jpg')
    path=demo(pg,"s => s.tables.profiles.find(p => p.id === s.session.userId)?.avatar_path")
    R['chemin_enregistre']=bool(path) and path.endswith('.jpg') and path.split('/')[0]==demo(pg,"s => s.session.userId")
    f=demo(pg,f"s => (s.tables._files||[]).find(f => f.path === '{path}')")
    R['fichier_prive_bucket']=bool(f) and f['bucket']=='profile-photos'
    if f and f['uri'].startswith('data:'):
        raw=base64.b64decode(f['uri'].split(',',1)[1]); im=Image.open(io.BytesIO(raw))
        R['taille_image']=im.size; R['carre']=im.size[0]==im.size[1] and im.size[0]<=512
        try: ex=piexif.load(raw); R['sans_gps']=not ex.get('GPS')
        except Exception: R['sans_gps']=True
        R['poids_ko']=round(len(raw)/1024)
    R['profil_affiche_photo']=has(pg,'profile-avatar') and not has(pg,'profile-avatar-initial')
    R['lien_changer']='Changer la photo' in pg.inner_text('body')
    pg.screenshot(path=SHOT+'profil.png')
    pg.goto(B+'/'); pg.wait_for_timeout(3500)
    R['accueil_photo_entete']=has(pg,'header-avatar') and not has(pg,'header-avatar-initial')
    pg.screenshot(path=SHOT+'accueil.png', clip={'x':0,'y':0,'width':390,'height':180})
    pg.goto(B+'/settings/family'); pg.wait_for_timeout(3000)
    R['foyer_photo_membre']=pg.locator('img[data-testid^="member-avatar-"], [data-testid^="member-avatar-"] img').count()>=1 or has(pg,'member-avatar-owner')
    R['foyer_photo_moi_image']=has(pg,'member-avatar-owner') and not has(pg,'member-avatar-owner-initial')
    # changer : l'ancienne photo est effacée
    pg.goto(B+'/profile'); pg.wait_for_timeout(2500)
    tid(pg,'profile-photo').click(); pg.wait_for_timeout(800)
    upload(pg,'portrait2.jpg')
    path2=demo(pg,"s => s.tables.profiles.find(p => p.id === s.session.userId)?.avatar_path")
    R['nouvelle_photo']=path2 and path2!=path
    R['ancienne_effacee']=demo(pg,f"s => !(s.tables._files||[]).some(f => f.path === '{path}')")
    # supprimer
    tid(pg,'profile-photo').click(); pg.wait_for_timeout(800)
    tid(pg,'pp-remove').click(); pg.wait_for_timeout(800)
    btn=pg.get_by_role('button', name='Supprimer la photo').filter(visible=True)
    btn.last.click(); pg.wait_for_timeout(2000)
    R['supprimee_profil']=demo(pg,"s => !s.tables.profiles.find(p => p.id === s.session.userId)?.avatar_path")
    R['supprimee_fichier']=demo(pg,f"s => !(s.tables._files||[]).some(f => f.path === '{path2}')")
    R['retour_initiale']=has(pg,'profile-avatar-initial')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
