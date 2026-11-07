"""
Simulation iPhone (Hermes) sur la version web de démonstration.

La version web tourne dans Chromium, qui fournit des outils JavaScript absents du moteur de l'appli sur iPhone
(Hermes) ou de React Native. Ce script les RETIRE de la page avant le démarrage de l'appli, puis ouvre TOUS les
écrans de src/app en mode démonstration (« Découvrir sans compte ») et relève chaque écran « Oups, cet écran a
rencontré un problème » avec son détail pour le support, ainsi que les erreurs JavaScript non rattrapées.

Retirés ou modifiés (comme sur iPhone) :
  - Intl.PluralRules, RelativeTimeFormat, ListFormat, DisplayNames, Segmenter, Locale, DurationFormat, supportedValuesOf
  - Intl.NumberFormat refuse style « unit » et notation « compact » ; DateTimeFormat#formatToParts ne renvoie qu'une
    partie « literal » (implémentation Apple de Hermes) ; formatRange absent
  - structuredClone, Object.groupBy, Map.groupBy, Promise.withResolvers, Array.fromAsync, Set#union & co,
    AbortSignal.timeout / any, TextDecoder, crypto (aucun objet global crypto en React Native)
  - new Blob([...texte]) et URL.createObjectURL lèvent une erreur (React Native)
NB : sur l'appli réelle (Expo SDK 57), TextDecoder, structuredClone et AbortSignal.timeout/any sont rajoutés par
Expo (expo/src/winter) ; les retirer ici rend la simulation plus sévère que l'iPhone, jamais plus indulgente.

Usage :
  SIM_URL=http://127.0.0.1:8831 python3 e2e/iphone_sim.py [sortie.json] [--plain] [--only=/route,/route2]
  --plain : sans retrait (contrôle : Chromium normal).
"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import ensure  # noqa: E402

B = os.environ.get('SIM_URL', 'http://127.0.0.1:8831')
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = ARGS[0] if ARGS else '/tmp/iphone_sim.json'
PLAIN = '--plain' in sys.argv
ONLY = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--only=')), None)
APP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'app')

HERMES = r"""
(() => {
  const G = globalThis, I = G.Intl;
  const kill = (o, k) => { try { Object.defineProperty(o, k, { value: undefined, configurable: true, writable: true }); delete o[k]; } catch (e) {} };
  ['PluralRules', 'RelativeTimeFormat', 'ListFormat', 'DisplayNames', 'Segmenter', 'Locale', 'DurationFormat', 'supportedValuesOf'].forEach((k) => kill(I, k));
  const NF = I.NumberFormat;
  const NF2 = function NumberFormat(tag, o) {
    if (o && (o.style === 'unit' || o.notation === 'compact')) throw new RangeError('[iPhone] NumberFormat: option non prise en charge');
    return new NF(tag, o);
  };
  NF2.prototype = NF.prototype; NF2.supportedLocalesOf = NF.supportedLocalesOf;
  I.NumberFormat = NF2;
  kill(NF.prototype, 'formatRange'); kill(NF.prototype, 'formatRangeToParts');
  const DTF = I.DateTimeFormat;
  DTF.prototype.formatToParts = function (d) { return [{ type: 'literal', value: this.format(d) }]; };
  kill(DTF.prototype, 'formatRange'); kill(DTF.prototype, 'formatRangeToParts');
  kill(G, 'structuredClone'); kill(Object, 'groupBy'); kill(Map, 'groupBy'); kill(Promise, 'withResolvers'); kill(Array, 'fromAsync');
  ['union', 'intersection', 'difference', 'symmetricDifference', 'isSubsetOf', 'isSupersetOf', 'isDisjointFrom'].forEach((k) => kill(Set.prototype, k));
  if (G.AbortSignal) { kill(AbortSignal, 'timeout'); kill(AbortSignal, 'any'); }
  kill(G, 'TextDecoder');
  kill(G, 'crypto');
  const OB = G.Blob;
  const B2 = function Blob(parts, opts) {
    if (parts && Array.from(parts).some((p) => typeof p === 'string')) throw new Error('[iPhone] new Blob([texte]) non pris en charge');
    return new OB(parts, opts);
  };
  B2.prototype = OB.prototype; G.Blob = B2;
  URL.createObjectURL = function () { throw new Error('[iPhone] URL.createObjectURL non pris en charge'); };
  // Texte posé directement dans une View (ex. {n && <X/>} avec n = 0) : accepté par le web, mais sur iPhone
  // « Text strings must be rendered within a <Text> component » fait tomber l'écran. On le signale.
  G.__iphoneRaw = [];
  const seen = new Set();
  const check = (n) => {
    if (!n || n.nodeType !== 3 || !n.nodeValue || !n.nodeValue.trim()) return;
    const p = n.parentElement;
    // View de react-native-web : <div class="css-…"> sans attribut dir (un <Text> porte dir="auto", un Text imbriqué est un <span>)
    if (!p || p.tagName !== 'DIV' || p.hasAttribute('dir') || !/^css-/.test(String(p.className))) return;
    const msg = '[iPhone] texte hors <Text> : « ' + n.nodeValue.trim().slice(0, 60) + ' » dans ' + location.pathname;
    if (seen.has(msg)) return; seen.add(msg); G.__iphoneRaw.push(msg); console.error(msg);
  };
  const scan = (root) => { if (root.nodeType === 3) return check(root); if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) check(t); };
  const start = () => { scan(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { if (m.type === 'characterData') check(m.target); m.addedNodes.forEach(scan); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  G.__iphoneSim = true;
})();
"""


def routes_from_tree():
    out = []
    for root, _, files in os.walk(APP):
        for f in files:
            if not f.endswith('.tsx') or f.startswith('_') or f.startswith('+'):
                continue
            rel = os.path.relpath(os.path.join(root, f), APP)[:-4]
            parts = [p for p in rel.split(os.sep) if not (p.startswith('(') and p.endswith(')'))]
            if parts and parts[-1] == 'index':
                parts = parts[:-1]
            out.append('/' + '/'.join(parts))
    return sorted(set(out))


TABLES = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1') || '{}'); const t = s.tables || {};
  const first = (n, f) => { const r = (t[n] || []).find(f || (() => true)); return r || null; };
  return {
    child: (first('children') || {}).id, journey: (first('user_journeys') || {}).id,
    post: (first('community_posts') || first('posts') || {}).id, group: (first('community_groups') || first('groups') || {}).id,
    album: (first('community_albums') || {}).id, doc: (first('documents') || {}).id, product: (first('products') || first('baby_products') || {}).id,
    scan: (first('product_scans') || first('scans') || {}).id, discharge: (first('discharge_logs') || first('cervical_discharge_logs') || {}).id,
    handle: (first('community_profiles', (p) => p.user_id !== (s.session || {}).userId) || first('community_profiles') || {}).handle,
    recipe: (first('recipes') || {}).slug,
    names: Object.keys(t).sort().join(','), taille_demo: (localStorage.getItem('toietmoi.demo.v1') || '').length } }"""


# Données absentes de la démonstration de départ (aucun document, produit, scan, album ni observation de pertes) :
# une ligne de chaque, au format des types de l'appli (src/lib/types.ts, types-scanner.ts, hooks-products.ts,
# hooks-cycle2.ts), pour ouvrir aussi les écrans de détail correspondants.
SEED = """() => {
  const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const t = s.tables; const me = s.session.userId;
  const hh = (t.households || [])[0]; const now = new Date().toISOString(); const day = now.slice(0, 10);
  const put = (n, row) => { t[n] = (t[n] || []).filter((r) => r.id !== row.id); t[n].push(row); };
  put('documents', { id: 'sim-doc-1', household_id: hh ? hh.id : null, uploaded_by: me, pregnancy_id: null, child_id: null, category: 'other', custom_category: null,
    title: 'Compte rendu (simulation)', doc_date: day, notes: null, storage_path: 'sim/doc.pdf', mime_type: 'application/pdf', size_bytes: 1000, page_count: 1,
    private_to_uploader: true, favorite: false, archived: false, ocr_text: 'Hémoglobine 12,5 g/dL (11,5 - 15,5)', ocr_source: 'manual', review_status: 'to_verify', created_at: now, updated_at: now });
  put('discharge_logs', { id: 'sim-dis-1', user_id: me, observed_at: now, amount: 'moderate', color: 'white', textures: ['creamy'], odor: null, symptoms: [],
    recent_sex: null, contraception: null, pregnancy: null, intimate_product: null, antibiotics: null, note: null });
  put('community_albums', { id: 'sim-album-1', owner_id: me, title: 'Album (simulation)', description: null, created_at: now });
  put('kid_products', { id: 'sim-prod-1', barcode: '3000000000001', category: 'cream', brand: 'Marque', name: 'Liniment (simulation)', image_url: null, image_credit: null,
    composition: 'Huile d’olive, eau de chaux', quantity_label: '500 ml', quantity_value: 500, quantity_unit: 'ml', maker_min_months: 0, maker_age_label: 'Dès la naissance',
    benefits: [], precautions: [], data_source: 'manual', source_url: null, data_retrieved_at: day, status: 'published', reviewed_by_label: null, nutrition: null, is_demo: true, created_at: now, updated_at: now });
  put('product_scans', { id: 'sim-scan-1', user_id: me, kind: 'product', method: 'barcode', barcode: '3000000000001', product_id: null, food_id: null, confirmed: true,
    product_snapshot: { name: 'Liniment (simulation)', brand: 'Marque', image_url: null }, target_profile: null, target_age_months: null, answers: {}, verdict: null,
    certainty: null, sources: [], is_demo: true, analysed_at: null, created_at: now });
  localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s));
}"""


def harvest(pg, prefix):
    hrefs = pg.eval_on_selector_all('a[href]', 'els => els.map(e => e.getAttribute("href"))')
    return [h for h in hrefs if h and h.startswith(prefix)]


def main():
    res = {'mode': 'plain' if PLAIN else 'iphone', 'routes': [], 'errors': {}, 'pageerrors': {}, 'unresolved': []}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
        if not PLAIN:
            ctx.add_init_script(HERMES)
        pg = ctx.new_page()
        current = {'errs': []}
        pg.on('pageerror', lambda e: current['errs'].append(str(e)[:300]))
        pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
        if not PLAIN:
            assert pg.evaluate('() => !!globalThis.__iphoneSim && typeof Intl.PluralRules === "undefined" && typeof globalThis.crypto === "undefined"')
        welcome_err = 'a rencontré un problème' in pg.inner_text('body')
        if welcome_err:
            res['errors']['/welcome (avant démo)'] = pg.locator('[data-testid="error-detail"]').first.inner_text() if pg.locator('[data-testid="error-detail"]').count() else '?'
        pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
        pg.evaluate(SEED)
        ids = pg.evaluate(TABLES)
        # identifiants du contenu fourni avec l'appli (src/content, src/lib/recipes) et des lignes ajoutées par SEED
        ids.update({'article': 'baby-blues-ou-depression', 'guide': 'clear-fluid', 'recipe': 'puree-carotte-pomme-de-terre',
                    'doc': 'sim-doc-1', 'discharge': 'sim-dis-1', 'album': 'sim-album-1', 'product': 'sim-prod-1', 'scan': 'sim-scan-1'})
        res['ids'] = ids
        # identifiants supplémentaires lus dans les écrans de liste
        for listing, prefix, key in [('/library', '/article/', 'article'), ('/cycle/guides', '/cycle/guides/', 'guide'),
                                     ('/meals', '/meals/', 'recipe_link'), ('/community', '/community/post/', 'post_link'),
                                     ('/community/groups', '/community/group/', 'group_link'), ('/products', '/products/', 'product_link'),
                                     ('/scanner/history', '/scanner/result/', 'scan_link'), ('/journeys', '/journeys/', 'journey_link'),
                                     ('/community/albums', '/community/album/', 'album_link'), ('/documents', '/documents/', 'doc_link')]:
            seed = {}
            ensure(pg, listing, seed)
            pg.goto(B + listing); pg.wait_for_timeout(2200)
            hs = [h for h in harvest(pg, prefix) if h.count('/') == prefix.count('/') and h.rstrip('/') != prefix.rstrip('/')]
            hs = [h for h in hs if not re.search(r'/(new|menu|pantry|rankings|settings|shopping|compare|blocked|scan|book|export)$', h.split('?')[0])]
            if hs:
                ids[key] = hs[0].split('?')[0][len(prefix):]
        def pick(*keys):
            for k in keys:
                if ids.get(k):
                    return ids[k]
            return None
        subst = {
            '/article/[slug]': pick('article'), '/cycle/guides/[slug]': pick('guide'), '/meals/[slug]': pick('recipe', 'recipe_link'),
            '/community/post/[id]': pick('post_link', 'post'), '/community/group/[id]': pick('group_link', 'group'),
            '/community/album/[id]': pick('album_link', 'album'), '/community/u/[handle]': pick('handle'),
            '/products/[id]': pick('product_link', 'product'), '/scanner/result/[id]': pick('scan_link', 'scan'),
            '/journeys/[id]': pick('journey_link', 'journey'), '/documents/[id]': pick('doc_link', 'doc'),
            '/cycle/discharge/[id]': pick('discharge') or 'new', '/fertility/test/[kind]': 'ovulation', '/legal/[doc]': 'privacy',
            '/track/[kind]': 'bottle',
        }
        routes = []
        for r in routes_from_tree():
            if '[' not in r:
                routes.append(r); continue
            if r in subst:
                if subst[r]:
                    routes.append(r.replace(re.search(r'\[[^\]]+\]', r).group(0), subst[r]))
                else:
                    res['unresolved'].append(r)
                continue
            child = ids.get('child')
            if child and re.search(r'\[(id|childId)\]', r):
                routes.append(re.sub(r'\[(id|childId)\]', child, r))
            else:
                res['unresolved'].append(r)
        # variantes utiles des écrans à paramètre
        routes += ['/fertility/test/pregnancy', '/legal/terms', '/track/sleep', '/track/breastfeed', '/track/diaper', '/track/pumping',
                   '/cycle/discharge/new']
        if ONLY:
            routes = ONLY
        seed = {}
        for r in routes:
            current['errs'] = []
            ensure(pg, r, seed)
            if r.startswith('/journeys/') and r != '/journeys/blocked':
                # les parcours de la démo changent avec ensure() : identifiant lu au moment de la visite
                jid = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const j = (s.tables.user_journeys || []).find((x) => x.user_id === s.session.userId && x.status === 'active'); return j ? j.id : null }")
                r = '/journeys/' + jid if jid else r
            try:
                pg.goto(B + r); pg.wait_for_timeout(1700)
                body = pg.inner_text('body')
            except Exception as e:  # noqa: BLE001
                body = ''
                current['errs'].append('NAV ' + str(e)[:200])
            entry = {'route': r, 'url': pg.url.replace(B, '')}
            if re.search(r'introuvable|n’existe plus|not found', body, re.I):
                entry['introuvable'] = True  # écran « élément introuvable » (donnée de démonstration absente)
            if 'a rencontré un problème' in body or 'Détail pour le support' in body:
                det = pg.locator('[data-testid="error-detail"]')
                entry['error'] = det.first.inner_text() if det.count() else 'écran Oups (détail introuvable)'
                res['errors'][r] = entry['error']
            if not PLAIN:
                raw = pg.evaluate('() => { const r = globalThis.__iphoneRaw || []; globalThis.__iphoneRaw = []; return r; }')
                if raw:
                    entry['texte_hors_text'] = raw
                    res.setdefault('raw_text', {})[r] = raw
            if current['errs']:
                res['pageerrors'][r] = current['errs'][:3]
            res['routes'].append(entry)
            print(('ERREUR ' if 'error' in entry else 'TEXTE  ' if 'texte_hors_text' in entry else 'ok     ') + r
                  + ('  -> ' + entry.get('error', '') if 'error' in entry else '') + ('  -> ' + ' | '.join(entry['texte_hors_text']) if 'texte_hors_text' in entry else ''), flush=True)
        b.close()
    res['summary'] = {'testees': len(res['routes']), 'en_erreur': len(res['errors']), 'avec_erreur_js': len(res['pageerrors']),
                      'texte_hors_text': len(res.get('raw_text', {})), 'non_resolues': res['unresolved']}
    with open(OUT, 'w') as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    print(json.dumps(res['summary'], ensure_ascii=False))


if __name__ == '__main__':
    main()
