"""
HOMI — onglets hub (Moi, Enfant, Famille ; refonte du 17/11/2026 : sélecteur de profil universel) : CHAQUE outil listé s'ouvre sur un vrai écran (jamais « Page
introuvable »). Démonstration sans compte, Premium actif.
Pour chaque hub : urgences, outils de chaque catégorie (rendus depuis le catalogue central, sans liste repliée),
accès nommés aux catégories complètes. Avant chaque clic, le profil « Ma grossesse » est réaffiché (un outil d'un autre profil
sélectionne ce profil). Vérifie aussi : urgences en tête du hub Moi, recherche et sélecteur de profil (avatars) présents,
aucune cible d'outil < 44 px de haut.
Chaque clé du rapport doit valoir true ; « introuvables » et « erreurs » doivent être vides.
Usage : NAV_URL=http://127.0.0.1:8983 PW_CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell python3 e2e/hubs_v5.py
"""
import json, os, re
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8983')
EXE = os.environ.get('PW_CHROMIUM') or None
R, errs, missing = {}, [], []
HUBS = [('health', '/health'), ('baby', '/baby'), ('family', '/household')]
PREMIUM = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter((x) => x.user_id !== me);
  s.tables.subscriptions.push({ user_id: me, status: 'active', product_id: 'homi_premium_annual', store: 'test', period_type: 'annual', entitlement: 'HOMI_PREMIUM', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }"""


def count(pg, sel):
    return pg.locator(sel).count()


def prepare(pg, hub, route):
    """Ouvre le hub et réaffiche « Ma grossesse » (un outil d'un autre profil sélectionne ce profil)."""
    pg.goto(B + route); pg.wait_for_timeout(1800)
    chip = pg.locator(f'[data-testid="hub-{hub}-profiles"] [data-testid="subject-preg"]')
    if chip.count() and chip.first.get_attribute('aria-checked') != 'true':
        chip.first.click(); pg.wait_for_timeout(900)


def targets(pg, hub):
    """Liste (sélecteur, rang, nom) de tout ce qui ouvre un écran dans le hub : urgences, outils (rendus depuis le
    catalogue par ToolLinks), accès nommés aux catégories complètes."""
    out = []
    for sel in [f'[data-testid="hub-{hub}"] [data-testid^="hub-urgent-"]', f'[data-testid="hub-{hub}"] [data-testid^="tool-row-press-"]',
                f'[data-testid="hub-{hub}"] [data-testid*="-all-"][role="link"]']:
        loc = pg.locator(sel)
        for i in range(loc.count()):
            out.append((sel, i, (loc.nth(i).get_attribute('aria-label') or '')[:60]))
    return out


def run(p):
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM)

    pg.goto(B + '/health'); pg.wait_for_timeout(2500)
    order = pg.evaluate("""() => { const h = document.querySelector('[data-testid="hub-health"]'); const u = h && h.querySelector('[data-testid^="hub-urgent-"]');
      const s = h && h.querySelector('[data-testid="hub-health-search"]'); if (!u || !s) return false;
      return !!(u.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); }""")
    R['urgences_en_tete_sante'] = order is True
    R['recherche_et_profils'] = count(pg, '[data-testid="hub-health-search"]') == 1 and count(pg, '[data-testid="hub-health-profiles"]') == 1
    small = pg.evaluate("""() => [...document.querySelectorAll('[data-testid="hub-health"] [data-testid^="tool-row-press-"], [data-testid="hub-health"] [data-testid^="tool-fav-"], [data-testid="hub-health"] [data-testid*="-all-"]')]
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height < 44).length""")
    R['cibles_44pt'] = small == 0

    total = 0
    for hub, route in HUBS:
        prepare(pg, hub, route)
        items = targets(pg, hub)
        R[f'{hub}_outils_listes'] = len(items) >= 5
        txt = pg.locator(f'[data-testid="hub-{hub}"]').inner_text()
        R[f'{hub}_aucun_voir_les_autres'] = count(pg, '[data-testid^="hub-more-"]') == 0 and not re.search(r'Voir (plus|les \d+|\d+)|autres\)', txt)
        R[f'{hub}_acces_nommes_aux_categories'] = count(pg, f'[data-testid="hub-{hub}"] [data-testid*="-all-"][role="link"]') >= 1 and ('Tous les outils' in txt or 'Explorer les outils' in txt)
        R[f'{hub}_plus_d_acces_directs_en_double'] = count(pg, f'[data-testid="hub-{hub}-entries"]') == 0
        for sel, i, name in items:
            prepare(pg, hub, route)
            loc = pg.locator(sel)
            if loc.count() <= i:
                missing.append(f'{hub}: {name} (introuvable dans la liste)'); continue
            el = loc.nth(i)
            el.scroll_into_view_if_needed()
            el.click(); pg.wait_for_timeout(1400)
            body = pg.locator('body').inner_text()
            if 'Page introuvable' in body or count(pg, '[data-testid="not-found"]'):
                missing.append(f'{hub}: {name} → {pg.url}')
            elif urlparse(pg.url).path.rstrip('/') == route:
                missing.append(f'{hub}: {name} → aucun écran ouvert')
            total += 1
    R['outils_cliques'] = total
    R['aucune_page_introuvable'] = not missing
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'introuvables': missing, 'erreurs': errs[:5]}, ensure_ascii=False, indent=1))
