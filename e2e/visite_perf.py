"""
Ticket 1 — mode visite : temps entre l'appui sur « Découvrir sans compte » et le premier écran utilisable
(élément interactif visible, au premier plan, ET réponse au toucher), démarrage à froid (contexte neuf, cache vide).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/visite/dist
  python3 e2e/spa_server.py /tmp/visite/dist 8981 &
  NAV_URL=http://127.0.0.1:8981 python3 e2e/visite_perf.py [essais] [normal,trou_noir,lent] > mesures.json

Réseaux : « normal » (sb.fake.test refusé tout de suite, comme une adresse qui n'existe pas), « trou_noir »
(sb.fake.test ne répond jamais : chaque requête attend son délai d'expiration), « lent » (CDP
Network.emulateNetworkConditions : 400 ms de latence, 50 ko/s ; plus le trou noir).
Parcours : /welcome → « Découvrir sans compte » → /start (étape 1 utilisable) ; /intro (dernier tableau) →
« Découvrir sans compte » → accueil de la visite ; Moi / Aujourd'hui, Mes outils, une catégorie, retours arrière ;
sortie de la visite puis réouverture. Une étape impossible (écran recouvert) vaut null.
Requêtes vers le faux Supabase comptées (doublons signalés). Sortie : JSON, médiane de N essais par réseau.
"""
import json, os, statistics, sys, time
from collections import Counter
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8981')
EXE = os.environ.get('PW_CHROMIUM') or None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
NETS = (sys.argv[2].split(',') if len(sys.argv) > 2 else ['normal', 'trou_noir', 'lent'])
TID = lambda t: f'[data-testid="{t}"]'

# Utilisable = visible, au premier plan au point de toucher, et la page répond (deux images en < 120 ms)
USABLE_JS = """async (sel) => {
  const el = [...document.querySelectorAll(sel)].find((e) => { const r = e.getBoundingClientRect(); return r.width >= 4 && r.height >= 4 && r.bottom > 0 && r.top < innerHeight; });
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const st = getComputedStyle(el); if (st.visibility === 'hidden' || +st.opacity === 0) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) return false;
  const t0 = performance.now();
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  return performance.now() - t0 < 120;
}"""


def wait_usable(pg, sel, timeout=60):
    t = time.time()
    while time.time() - t < timeout:
        try:
            if pg.evaluate(USABLE_JS, sel): return True
        except Exception:
            pass
        pg.wait_for_timeout(25)
    return False


def visible(pg, tid):
    loc = pg.locator(TID(tid))
    try:
        return loc.count() > 0 and loc.first.is_visible()
    except Exception:
        return False


def tap(pg, tid):
    """Appui réel au centre : s'il est intercepté par un écran posé dessus, il n'atteint pas sa cible."""
    try:
        pg.locator(TID(tid)).first.click(timeout=3000)
    except Exception:
        pass


def timed(pg, action, sel, timeout=60):
    t0 = time.time(); action()
    ok = wait_usable(pg, sel, timeout)
    return round((time.time() - t0) * 1000) if ok else None


def new_ctx(p, net):
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    reqs = []
    ctx.on('request', lambda r: reqs.append(r.method + ' ' + r.url.split('sb.fake.test')[1].split('?')[0]) if 'sb.fake.test' in r.url else None)
    if net in ('trou_noir', 'lent'):
        ctx.route('**/sb.fake.test/**', lambda route: None)  # jamais de réponse
    else:
        ctx.route('**/sb.fake.test/**', lambda route: route.abort('namenotresolved'))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    if net == 'lent':
        cdp = ctx.new_cdp_session(pg)
        cdp.send('Network.enable')
        cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 400, 'downloadThroughput': 50 * 1024, 'uploadThroughput': 20 * 1024})
    return b, ctx, pg, reqs, errs


def trial(p, net):
    R = {}
    # A. /welcome → « Découvrir sans compte » → /start utilisable
    b, ctx, pg, reqs, errs = new_ctx(p, net)
    t0 = time.time(); pg.goto(B + '/welcome', wait_until='commit')
    R['welcome_utilisable_ms'] = round((time.time() - t0) * 1000) if wait_usable(pg, TID('welcome-demo'), 180) else None
    R['A_decouvrir_vers_start_ms'] = timed(pg, lambda: tap(pg, 'welcome-demo'), TID('fw-stage-baby'))
    b.close()
    # B. /intro (dernier tableau) → « Découvrir sans compte » → premier écran utilisable de la visite
    b, ctx, pg, reqs, errs = new_ctx(p, net)
    pg.goto(B + '/intro?scene=start', wait_until='commit')
    wait_usable(pg, TID('intro-demo'), 180)
    reqs.clear()
    R['B_visite_premier_ecran_ms'] = timed(pg, lambda: tap(pg, 'intro-demo'), TID('tab-health'))
    t1 = time.time()
    R['B_accueil_contenu_ms'] = (R['B_visite_premier_ecran_ms'] or 0) + round((time.time() - t1) * 1000) if wait_usable(pg, TID('home-tools-entry'), 30) else None
    pg.wait_for_timeout(600)
    R['B_verrou_sur_accueil'] = visible(pg, 'premium-gate')
    # Présentation d'Aura (première arrivée, 1,2 s après l'accueil) : fermée par « Plus tard » ; son arrivée est notée
    t2 = time.time(); R['B_aura_intro_apres_ms'] = None
    while time.time() - t2 < 4:
        if visible(pg, 'aura-intro-later'):
            R['B_aura_intro_apres_ms'] = round((time.time() - t2) * 1000); pg.wait_for_timeout(400); tap(pg, 'aura-intro-later'); pg.wait_for_timeout(500); break
        pg.wait_for_timeout(50)
    R['B_verrou_sur_accueil'] = R['B_verrou_sur_accueil'] or visible(pg, 'premium-gate')
    # C. onglets, Mes outils, une catégorie, retours arrière (null : impossible, écran recouvert)
    R['C_onglet_moi_ms'] = timed(pg, lambda: tap(pg, 'tab-health'), TID('tab-index'), 8)
    R['C_onglet_accueil_ms'] = timed(pg, lambda: tap(pg, 'tab-index'), TID('home-tools-entry'), 8)
    R['C_mes_outils_ms'] = timed(pg, lambda: tap(pg, 'home-tools-entry'), '[data-testid="tools-search"], [data-testid="tools-intro-skip"]', 8)
    if visible(pg, 'tools-intro-skip'): tap(pg, 'tools-intro-skip'); pg.wait_for_timeout(400)
    R['C_mes_outils_ecran'] = 'outils' if visible(pg, 'tools-search') else ('verrou' if visible(pg, 'premium-gate') else 'autre')
    R['C_categorie_ms'] = timed(pg, lambda: tap(pg, 'tools-category-sleep'), '[data-testid^="tool-row-press-"]', 8)
    R['C_retour_ms'] = timed(pg, lambda: pg.go_back(), TID('tools-search'), 8)
    R['C_retour2_ms'] = timed(pg, lambda: pg.go_back(), TID('home-tools-entry'), 8)
    # D. sortie de la visite puis réouverture
    R['D_sortie_ms'] = timed(pg, lambda: tap(pg, 'demo-leave'), TID('welcome-demo'), 20)
    pg.goto(B + '/intro?scene=start', wait_until='commit'); wait_usable(pg, TID('intro-demo'), 60)
    R['D_reouverture_ms'] = timed(pg, lambda: tap(pg, 'intro-demo'), TID('home-tools-entry'), 30)
    c = Counter(reqs)
    R['requetes_supabase'] = len(reqs)
    R['requetes_doublons'] = {k: v for k, v in c.items() if v > 1}
    R['requetes_detail'] = sorted(c)[:20]
    R['url_finale'] = pg.url.replace(B, '')
    R['erreurs'] = errs[:5]
    b.close()
    return R


def med(xs):
    xs = [x for x in xs if isinstance(x, (int, float)) and not isinstance(x, bool)]
    return round(statistics.median(xs)) if xs else None


with sync_playwright() as p:
    out = {}
    for net in NETS:
        runs = [trial(p, net) for _ in range(N)]
        keys = [k for k in runs[0] if k.endswith('_ms')]
        out[net] = {'mediane': {k: med([r[k] for r in runs]) for k in keys},
                    'verrou_sur_accueil': [r['B_verrou_sur_accueil'] for r in runs],
                    'mes_outils_ecran': [r['C_mes_outils_ecran'] for r in runs], 'essais': runs}
    print(json.dumps(out, ensure_ascii=False, indent=1))
