"""
Audit 10 — performance web mesurée (Chromium, CPU ralenti ×4 par CDP, fenêtre 390×844, démo + Premium).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit10/dist
  python3 e2e/spa_server.py /tmp/audit10/dist 18993 --gzip &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:18993 python3 e2e/perf_web.py [variante ...]

Variantes : base, reduit (Réduire les animations), sansflou (backdrop-filter neutralisé), sansscene (fond masqué).
Mesures : premier rendu utile (accueil sans compte, Accueil), long tasks, FPS pendant un défilement scripté
(Accueil, hub Bébé, Communauté, historique du biberon), coût au repos (TaskDuration CDP sur 5 s sans interaction),
tas JS après ramasse-miettes avant / après 20 navigations par la barre d'onglets. Sortie : JSON (stdout).
"""
import json, os, sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:18993')
EXE = os.environ.get('PW_CHROMIUM') or None
RATE = float(os.environ.get('CPU_RATE', '4'))
VARIANTS = sys.argv[1:] or ['base', 'reduit', 'sansflou', 'sansscene']

INIT = """(() => {
  window.__lt = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
})()"""
NO_BLUR = "*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}"
NO_SCENE = "[data-testid^='scene-'],[data-testid='bg-powder'],[data-testid='bg-night']{display:none!important}"

SCROLL_JS = """(ms) => new Promise((done) => {
  const all = [...document.querySelectorAll('div')].filter((d) => { const s = getComputedStyle(d); return /(auto|scroll)/.test(s.overflowY) && d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 300; });
  const el = all.sort((a, b) => b.clientHeight - a.clientHeight)[0];
  if (!el) return done({ scroller: false });
  const max = el.scrollHeight - el.clientHeight; let dir = 1; const t0 = performance.now(); let last = t0; const d = [];
  const lt0 = window.__lt.length;
  const step = (now) => {
    d.push(now - last); last = now;
    el.scrollTop = Math.max(0, Math.min(max, el.scrollTop + dir * 14));
    if (el.scrollTop >= max || el.scrollTop <= 0) dir = -dir;
    if (now - t0 < ms) requestAnimationFrame(step); else {
      d.shift(); const s = [...d].sort((a, b) => a - b); const sum = d.reduce((a, b) => a + b, 0);
      const lt = window.__lt.slice(lt0).filter(([st]) => st >= t0);
      done({ scroller: true, hauteur: el.scrollHeight, frames: d.length, fps: Math.round(1000 * d.length / sum * 10) / 10,
        p95_ms: Math.round(s[Math.floor(s.length * 0.95)] * 10) / 10, images_lentes_gt50ms: d.filter((x) => x > 50).length,
        long_tasks: lt.length, long_tasks_ms: Math.round(lt.reduce((a, [, x]) => a + x, 0)) });
    }
  };
  requestAnimationFrame((n) => { last = n; requestAnimationFrame(step); });
})"""


def metrics(cdp):
    return {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}


def heap(cdp):
    cdp.send('HeapProfiler.collectGarbage'); cdp.send('HeapProfiler.collectGarbage')
    return round(cdp.send('Runtime.getHeapUsage')['usedSize'] / 1048576, 1)


def run(p, variant):
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris',
                        reduced_motion='reduce' if variant == 'reduit' else 'no-preference')
    ctx.add_init_script(INIT)
    css = NO_BLUR if variant == 'sansflou' else NO_SCENE if variant == 'sansscene' else ''
    if css:
        ctx.add_init_script("(() => { const add = () => { const s = document.createElement('style'); s.textContent = %s; (document.head || document.documentElement).appendChild(s); }; if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); })()" % json.dumps(css))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    cdp = ctx.new_cdp_session(pg)
    cdp.send('Performance.enable'); cdp.send('HeapProfiler.enable')
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': RATE})
    R = {'variante': variant, 'cpu_x': RATE}
    # 1. accueil sans compte (premier lancement, cache vide)
    pg.goto(B + '/welcome', wait_until='commit')
    pg.get_by_text('Découvrir sans compte').first.wait_for(timeout=120000)
    R['welcome_rendu_utile_ms'] = round(pg.evaluate('performance.now()'))
    R['welcome_fcp_ms'] = round(pg.evaluate("(performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0"))
    R['welcome_long_tasks'] = pg.evaluate('[window.__lt.length, Math.round(window.__lt.reduce((a, [, d]) => a + d, 0))]')
    pg.wait_for_timeout(1500)
    pg.get_by_text('Découvrir sans compte').first.click()
    pg.wait_for_selector('[data-testid^="home-card-"]', timeout=120000)
    pg.evaluate(PREMIUM_ON)
    # 2. Accueil (démo + Premium) après rechargement : cache HTTP chaud, session de démo rétablie
    pg.reload(wait_until='commit')
    pg.wait_for_selector('[data-testid^="home-card-"]', timeout=120000)
    R['accueil_rendu_utile_ms'] = round(pg.evaluate('performance.now()'))
    R['accueil_long_tasks'] = pg.evaluate('[window.__lt.length, Math.round(window.__lt.reduce((a, [, d]) => a + d, 0))]')
    pg.wait_for_timeout(2500)
    # 3. coût au repos (fond animé, horloges) : 5 s sans interaction
    m0 = metrics(cdp); pg.wait_for_timeout(5000); m1 = metrics(cdp)
    R['repos_accueil_task_ms_par_s'] = round((m1['TaskDuration'] - m0['TaskDuration']) * 1000 / 5, 1)
    R['repos_accueil_script_ms_par_s'] = round((m1['ScriptDuration'] - m0['ScriptDuration']) * 1000 / 5, 1)
    R['repos_accueil_layout_par_s'] = round((m1['LayoutCount'] - m0['LayoutCount']) / 5, 1)
    R['repos_accueil_style_par_s'] = round((m1['RecalcStyleCount'] - m0['RecalcStyleCount']) / 5, 1)
    # 4. défilement
    for name, path in [('accueil', None), ('hub_bebe', '/baby'), ('communaute', '/community'), ('biberon_historique', '/bottle/history')]:
        if path:
            pg.goto(B + path); pg.wait_for_timeout(5000)
        R[f'defilement_{name}'] = pg.evaluate(SCROLL_JS, 3000)
    # 5. mémoire : 20 navigations par la barre d'onglets (sans rechargement)
    pg.goto(B + '/'); pg.wait_for_selector('[data-testid^="home-card-"]', timeout=120000); pg.wait_for_timeout(2500)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    h0 = heap(cdp); n0 = pg.evaluate("document.getElementsByTagName('*').length")
    tabs = ['health', 'baby', 'household', 'community', 'index']
    seq = []
    for i in range(20):
        tname = tabs[i % len(tabs)]
        loc = pg.locator(f'[data-testid="tab-{tname}"]').first
        if loc.count():
            loc.click(); seq.append(tname)
        pg.wait_for_timeout(700)
        if i == 9:
            h10 = heap(cdp)
    pg.wait_for_timeout(1500)
    h20 = heap(cdp); n20 = pg.evaluate("document.getElementsByTagName('*').length")
    R['memoire'] = {'tas_mo_depart': h0, 'tas_mo_10_nav': h10, 'tas_mo_20_nav': h20, 'noeuds_dom_depart': n0, 'noeuds_dom_20_nav': n20, 'navigations': len(seq)}
    R['erreurs'] = errs
    b.close()
    return R


with sync_playwright() as p:
    out = [run(p, v) for v in VARIANTS]
print(json.dumps(out, ensure_ascii=False, indent=1))
