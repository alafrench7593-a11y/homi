"""
Ticket 1 (complément) : appui sur « Découvrir sans compte » (/intro) → accueil de la visite RENDU (barre d'onglets
présente et visible dans le DOM, qu'un écran soit posé dessus ou non). Mesure la vitesse de chargement de la
démonstration indépendamment du verrou Premium. Démarrage à froid, 3 essais, médiane, réseau normal ou lent (CDP).

  NAV_URL=http://127.0.0.1:8981 python3 e2e/visite_rendu.py [essais] [normal,lent] [attente_ms]
`attente_ms` : temps passé sur /intro avant l'appui (lecture de l'écran ; le préchargement s'y fait).
"""
import json, os, statistics, sys, time
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8981')
N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
NETS = sys.argv[2].split(',') if len(sys.argv) > 2 else ['normal', 'lent']
WAIT = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
out = {}
with sync_playwright() as p:
    for net in NETS:
        vals = []
        for _ in range(N):
            b = p.chromium.launch()
            ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
            ctx.route('**/sb.fake.test/**', (lambda r: None) if net == 'lent' else (lambda r: r.abort('namenotresolved')))
            pg = ctx.new_page()
            if net == 'lent':
                cdp = ctx.new_cdp_session(pg); cdp.send('Network.enable')
                cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 400, 'downloadThroughput': 190 * 1024, 'uploadThroughput': 90 * 1024})
            pg.goto(B + '/intro?scene=start', wait_until='commit')
            pg.locator('[data-testid="intro-demo"]').wait_for(timeout=300000)
            pg.wait_for_timeout(WAIT)
            t0 = time.time(); pg.locator('[data-testid="intro-demo"]').click()
            try:
                pg.locator('[data-testid="tab-health"]').wait_for(state='visible', timeout=300000)
                vals.append(round((time.time() - t0) * 1000))
            except Exception:
                vals.append(None)
            b.close()
        ok = [v for v in vals if v is not None]
        out[net] = {'essais_ms': vals, 'mediane_ms': round(statistics.median(ok)) if ok else None}
print(json.dumps({'attente_sur_intro_ms': WAIT, **out}, ensure_ascii=False))
