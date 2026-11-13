"""
Entrée dans l'app HOMI (navigateur réel, faux Supabase) :
 A. démonstration : entrer, retrouver la pastille « Démo » sur plusieurs écrans, la quitter depuis la pastille ;
 B. connexion en 320×568 clavier ouvert (fenêtre réduite à la hauteur visible au-dessus du clavier) : le champ actif
    et le bouton « Se connecter » restent visibles ;
 C. états : erreur réseau à la connexion, e-mail déjà utilisé à l'inscription (raccourci « Se connecter »),
    chargement puis lien expiré sur /auth/callback ;
 D. accueil sans compte : une seule action principale, texte disponible immédiatement.
  npx expo export --platform web --clear --output-dir dist && python3 e2e/spa_server.py dist 8921 &
  E2E_URL=http://127.0.0.1:8921 python3 e2e/entree_homi.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from fake_supabase import FakeSupabase, FakeRealtime

B = os.environ.get('E2E_URL', 'http://127.0.0.1:8921')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/entree'); os.makedirs(SHOTS, exist_ok=True)
CHROMIUM = os.environ.get('PW_CHROMIUM')
R, errs = {}, []
fake = FakeSupabase()


def new_page(b, w=390, h=844, network=True):
    ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    if network:
        pg.route('http://sb.fake.test/**', fake.route)
        pg.route_web_socket(re.compile(r'wss?://sb\.fake\.test/realtime/.*'), FakeRealtime().attach)
    else:
        pg.route('http://sb.fake.test/**', lambda r: r.abort('internetdisconnected'))
    pg.add_init_script("localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0}))")
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    return ctx, pg


def in_view(pg, loc):
    box = loc.bounding_box()
    vh = pg.viewport_size['height']
    return bool(box) and box['y'] >= 0 and box['y'] + box['height'] <= vh + 0.5


def run(p):
    b = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()

    # ------------------------------------------------ D. accueil sans compte
    ctx, pg = new_page(b)
    pg.goto(B + '/welcome')
    # le texte et l'action principale sont là dès la première image de l'écran (seule la scène s'anime) :
    # à l'instant où le bouton apparaît, titre et bouton sont déjà entièrement opaques
    pg.wait_for_selector('[data-testid="welcome-start"]', state='visible', timeout=20000)
    R['D_titre_et_action_immediats'] = pg.evaluate("""() => {
      const op = (e) => { let o = 1; while (e && e.nodeType === 1) { o *= parseFloat(getComputedStyle(e).opacity || '1'); e = e.parentElement; } return o; };
      const btn = document.querySelector('[data-testid="welcome-start"]');
      const title = [...document.querySelectorAll('[role="heading"]')].find((e) => (e.textContent || '').includes('Vivez chaque étape'));
      return !!btn && !!title && op(btn) > 0.99 && op(title) > 0.99;
    }""")
    pg.wait_for_timeout(1500)
    R['D_une_seule_action_principale'] = pg.locator('[data-testid="welcome-start"]').count() == 1
    R['D_aide_et_langue'] = pg.get_by_role('button', name='Besoin d’aide maintenant').count() == 1 and pg.get_by_role('button', name=re.compile('^Langue')).count() == 1
    ctx.close()

    # ------------------------------------------------ A. démonstration : entrer puis quitter depuis la pastille
    ctx, pg = new_page(b)
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_role('button', name='Découvrir sans compte').click(); pg.wait_for_timeout(5000)
    pill = pg.locator('[data-testid="demo-pill"]').first
    R['A_pastille_visible'] = pill.is_visible() and in_view(pg, pill)
    R['A_texte_quitter_visible'] = pg.get_by_text('Quitter la démo', exact=True).first.is_visible()
    leave = pg.get_by_role('button', name='Quitter la démonstration')
    R['A_bouton_quitter_accessible'] = leave.count() == 1
    pg.screenshot(path=f'{SHOTS}/a-demo-accueil.png')
    for path in ['/family', '/settings']:
        pg.goto(B + path); pg.wait_for_timeout(3000)
        R[f'A_pastille_sur_{path.strip("/")}'] = pg.locator('[data-testid="demo-pill"]').first.is_visible()
    pg.get_by_role('button', name='Quitter la démonstration').click(); pg.wait_for_timeout(4000)
    R['A_quitter_ramene_accueil'] = '/welcome' in pg.url and 'Vivez chaque étape' in pg.inner_text('body')
    R['A_pastille_disparue'] = pg.locator('[data-testid="demo-pill"]').count() == 0
    ctx.close()

    # ------------------------------------------------ B. 320×568 clavier ouvert
    ctx, pg = new_page(b, 320, 568)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.screenshot(path=f'{SHOTS}/b-320-ferme.png')
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test')
    pwd = pg.get_by_label('Mot de passe', exact=True)
    pwd.focus()
    pg.set_viewport_size({'width': 320, 'height': 568 - 260})  # clavier logiciel ≈ 260 px
    pg.wait_for_timeout(900)
    pwd.focus(); pg.wait_for_timeout(600)
    pg.screenshot(path=f'{SHOTS}/b-320-clavier.png')
    R['B_champ_actif_visible'] = in_view(pg, pwd)
    R['B_bouton_principal_visible'] = in_view(pg, pg.locator('[data-testid="signin-submit"]').first)
    pg.set_viewport_size({'width': 320, 'height': 568}); pg.wait_for_timeout(400)
    ctx.close()

    # ------------------------------------------------ C. états
    ctx, pg = new_page(b, network=False)
    pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3000)
    pg.get_by_label('Adresse e-mail').fill('sarah@exemple.test'); pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
    pg.locator('[data-testid="signin-submit"]').first.click(); pg.wait_for_timeout(2500)
    t = pg.inner_text('body')
    R['C_erreur_reseau_lisible'] = 'connexion internet' in t or 'réseau' in t.lower()
    pg.screenshot(path=f'{SHOTS}/c-reseau.png')
    ctx.close()

    ctx, pg = new_page(b)
    for i in range(2):
        pg.goto(B + '/auth/sign-up'); pg.wait_for_timeout(3000)
        pg.get_by_label('Adresse e-mail').fill('deja@exemple.test')
        pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1'); pg.get_by_label('Confirmer le mot de passe').fill('abcdefg1')
        pg.get_by_role('checkbox', name='J’ai 18 ans ou plus').click()
        pg.get_by_role('checkbox', name='J’accepte les conditions d’utilisation et la politique de confidentialité').click()
        btn = pg.locator('[data-testid="signup-submit"]').first
        btn.click()
        try: btn.click(force=True, timeout=1500)  # double appui : un seul envoi (le bouton peut déjà être désactivé)
        except Exception: pass
        pg.wait_for_timeout(2500)
    t = pg.inner_text('body')
    R['C_email_deja_utilise'] = 'Un compte existe déjà' in t
    R['C_raccourci_se_connecter'] = pg.get_by_role('button', name='Se connecter avec cette adresse').count() == 1
    R['C_un_envoi_par_tentative'] = len(fake.signup_bodies) == 1
    pg.screenshot(path=f'{SHOTS}/c-deja-utilise.png')
    pg.get_by_role('button', name='Se connecter avec cette adresse').click(); pg.wait_for_timeout(1500)
    R['C_raccourci_mene_connexion'] = '/auth/sign-in' in pg.url
    pg.goto(B + '/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); pg.wait_for_timeout(2500)
    R['C_lien_expire'] = 'Ce lien n’est plus valable' in pg.inner_text('body') and pg.get_by_role('button', name='Recevoir un nouveau lien').count() == 1
    pg.screenshot(path=f'{SHOTS}/c-lien-expire.png')
    ctx.close()

    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # le rapport s'affiche toujours, avec l'étape qui a échoué
        R['exception'] = str(e)[:300]

R['erreurs'] = [e for e in errs if 'cloudfront' not in e][:8]
print(json.dumps(R, ensure_ascii=False, indent=1))
