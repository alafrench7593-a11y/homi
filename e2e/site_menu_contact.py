"""Site : menu commun (desktop + mobile), pages réelles derrière chaque lien, page contact (messagerie pré-remplie),
filtres par lien (#etape / #q), llms.txt, sitemap. Usage : E2E_URL=http://127.0.0.1:8813 python3 e2e/site_menu_contact.py"""
import os, re, sys, urllib.request, urllib.parse
from playwright.sync_api import sync_playwright
B = os.environ.get('E2E_URL', 'http://127.0.0.1:8813'); SHOTS = os.environ.get('E2E_SHOTS', '/tmp/homi-menu'); os.makedirs(SHOTS, exist_ok=True)
RES = []
def check(n, ok, d=''): RES.append(ok); print(('OK  ' if ok else 'ÉCHEC ') + n + (f' — {d}' if d else ''), flush=True)
def status(u):
    try: return urllib.request.urlopen(B + u).status
    except Exception as e: return getattr(e, 'code', 0)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'))
    pg = b.new_page(viewport={'width': 1440, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:150]))
    for page in ['/', '/fonctionnalites/', '/ambassadeurs/', '/contact/']:
        pg.goto(B + page); pg.wait_for_timeout(800)
        check(f'menu commun présent sur {page}', pg.locator('details.mm').count() == 3 and pg.locator('.mm-link').count() == 3 and pg.locator('.foot-cols').count() == 1)
    pg.goto(B + '/'); pg.wait_for_timeout(800)
    hrefs = sorted(set(pg.eval_on_selector_all('.nav a[href^="/"], .footer a[href^="/"]', 'els => els.map(e => e.getAttribute("href"))')))
    app = ('/app', '/auth/', '/ambassadors/')  # routes de l'app : réécriture Vercel, absente du serveur statique local
    bad = [h for h in hrefs if not ('127.0.0.1' in B and h.startswith(app)) and status(urllib.parse.quote(h.split('#')[0], safe='/')) != 200]
    check(f'menu + pied de page : {len(hrefs)} liens, tous répondent', not bad, ', '.join(bad))
    pg.click('details.mm:nth-of-type(1) >> summary', timeout=3000) if False else pg.locator('details.mm summary', has_text='Grossesse & Bébé').click(); pg.wait_for_timeout(300)
    check('desktop : panneau Grossesse ouvert', pg.locator('details.mm[open] .mm-panel').is_visible())
    pg.screenshot(path=f'{SHOTS}/menu-desktop.png')
    pg.locator('details.mm[open] a[href="/fonctionnalites#etape=pregnancy"]').click(); pg.wait_for_timeout(1500)
    vis = pg.locator('.feat-item:not([hidden])').count()
    check('lien #etape=pregnancy → catalogue filtré', '/fonctionnalites' in pg.url and 0 < vis < 121 and pg.locator('.feat-chips button[data-stage="pregnancy"][aria-pressed="true"]').count() == 1, f'{vis} outils')
    pg.goto(B + '/fonctionnalites/#etape=baby&q=sommeil'); pg.wait_for_timeout(1500)
    names = pg.locator('.feat-item:not([hidden]) b').all_inner_texts()
    check('lien Bébé › Sommeil → sommeil de l’enfant, pas celui de l’adulte', 'Sommeil de l’enfant' in names and 'Mon sommeil' not in names, ' | '.join(names[:6]))
    pg.close()
    m = b.new_page(viewport={'width': 390, 'height': 844})
    m.on('pageerror', lambda e: errs.append(str(e)[:150]))
    m.goto(B + '/'); m.wait_for_timeout(800)
    check('mobile : liens masqués, bouton menu visible', m.locator('.mm-burger').is_visible() and not m.locator('.mm-list').is_visible())
    m.click('.mm-burger'); m.wait_for_timeout(300)
    check('mobile : menu ouvert', m.locator('.mm-list').is_visible() and m.get_attribute('.mm-burger', 'aria-expanded') == 'true')
    m.locator('details.mm summary', has_text='Grossesse & Bébé').click(); m.wait_for_timeout(300)
    m.screenshot(path=f'{SHOTS}/menu-mobile.png')
    check('mobile : sous-catégories dépliées', m.locator('details.mm[open] a', has_text='Biberons et allaitement').is_visible())
    check('mobile : pas de débordement menu ouvert', m.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
    m.keyboard.press('Escape'); m.wait_for_timeout(200)
    check('mobile : Échap ferme le menu', not m.locator('.mm-list').is_visible())
    m.goto(B + '/contact/'); m.wait_for_timeout(800)
    check('contact : sans service serveur, aucun bouton « Envoyer » trompeur', not m.locator('[data-cta="contact-send"]').is_visible())
    m.select_option('select[name="category"]', 'Presse'); m.fill('input[name="name"]', 'Julie'); m.fill('input[name="subject"]', 'Interview'); m.fill('textarea[name="message"]', 'Bonjour HOMI')
    href = m.get_attribute('[data-mail]', 'href')
    check('contact : messagerie pré-remplie vers homixyz@gmail.com', href.startswith('mailto:homixyz@gmail.com?subject=%5BPresse%5D%20Interview') and 'Bonjour%20HOMI' in href, href[:90])
    check('contact : pas de débordement', m.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
    m.screenshot(path=f'{SHOTS}/contact-mobile.png', full_page=True)
    check('aucune erreur JavaScript', not errs, '; '.join(errs[:3]))
    b.close()
llms = urllib.request.urlopen(B + '/llms.txt').read().decode()
check('llms.txt : description factuelle + outils', llms.startswith('# HOMI') and 'pas encore sur l\'App Store' in llms and llms.count('\n- ') > 100)
sm = urllib.request.urlopen(B + '/sitemap.xml').read().decode()
check('sitemap : contact, fonctionnalités, ambassadeurs', all(u in sm for u in ['/contact<', '/fonctionnalites<', '/ambassadeurs<']))
print(f'{sum(RES)}/{len(RES)}'); sys.exit(0 if all(RES) else 1)
