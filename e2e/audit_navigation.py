"""
Audit n° 1 « Inventaire et navigation » (13/11/2026) — robot rejouable sur la version web de démonstration.

  npx expo export --platform web --clear --output-dir /tmp/audit1/dist
  python3 e2e/spa_server.py /tmp/audit1/dist 8971 &
  NAV_URL=http://127.0.0.1:8971 PW_CHROMIUM=/opt/pw-browsers/chromium python3 e2e/audit_navigation.py [phases]

Phases (toutes par défaut) :
  routes   chaque route de src/lib/routes.generated.ts ouverte par URL directe (lien profond), démo + Premium,
           identifiants de démo réels pour les routes dynamiques ; puis « Retour » depuis ce lien direct.
  free     les mêmes routes SANS Premium : seule l'absence de plantage / page introuvable est exigée
           (l'écran « Cet espace fait partie de Premium » est un résultat attendu).
  tools    chaque outil du registre central (src/lib/journeys/tools.ts) ouvert depuis son point d'entrée normal :
           sa carte dans l'onglet hub (Santé, Bébé, Famille), sinon la recherche universelle ; puis « Retour »
           doit ramener à l'onglet hub, onglet parent toujours allumé.
  sweep    boutons et liens sans effet sur les écrans principaux (clic sans navigation ni changement visible).

Sorties (AUDIT_OUT, défaut /tmp/audit1/out) : audit_nav.json (tout), tools_entry.csv (une ligne par outil).
Code de sortie 1 si un défaut bloquant est trouvé (plantage, page introuvable, écran blanc, outil KO, retour KO).
"""
import csv, json, os, re, sys, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from journey_seed import PREMIUM_ON, SET_BODY, body_for  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8971')
EXE = os.environ.get('PW_CHROMIUM') or None
OUT = os.environ.get('AUDIT_OUT', '/tmp/audit1/out')
os.makedirs(OUT, exist_ok=True)
PHASES = [a for a in sys.argv[1:] if not a.startswith('-')] or ['routes', 'free', 'tools', 'sweep']
ONLY = os.environ.get('AUDIT_ONLY')  # filtre (sous-chaîne) sur les routes / outils, pour rejouer un cas

PREMIUM_OFF = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
  s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }"""

# ------------------------------------------------------------------ inventaire (sources du dépôt)
def app_routes():
    src = open(os.path.join(ROOT, 'src/lib/routes.generated.ts'), encoding='utf8').read()
    return re.findall(r"'(/[^']*)'", src)


def tool_defs():
    """(id, scopes) du registre central, dans l'ordre."""
    src = open(os.path.join(ROOT, 'src/lib/journeys/tools.ts'), encoding='utf8').read()
    consts = {'ALL': ['avoid', 'ttc', 'cycle', 'none', 'pregnancy', 'postpartum', 'baby', 'child', 'family'],
              'ME': ['avoid', 'ttc', 'cycle', 'none'], 'KID': ['baby', 'child'], 'HOME_LIFE': ['none', 'child', 'family']}
    consts['ADULT'] = consts['ME'] + ['pregnancy', 'postpartum']
    consts['TOGETHER'] = consts['ADULT'] + ['baby', 'child', 'family']
    out = []
    for m in re.finditer(r"\{ id: '(\w+)', theme: '(\w+)'.*?scopes: (\[[^\]]*\]|\w+)", src):
        raw = m.group(3)
        if raw in consts: sc = consts[raw]
        else:
            sc = []
            for part in re.findall(r"\.\.\.ADULT\.filter[^,]*|\.\.\.(\w+)|'(\w+)'", raw[1:-1]):
                if isinstance(part, tuple):
                    if part[0]: sc += consts[part[0]]
                    elif part[1]: sc.append(part[1])
            if 'ADULT.filter' in raw: sc += [x for x in consts['ADULT'] if x != 'pregnancy']
        out.append({'id': m.group(1), 'theme': m.group(2), 'scopes': sc})
    return out


def tool_labels():
    lab = {}
    d = os.path.join(ROOT, 'src/i18n/fr')
    for f in os.listdir(d):
        for m in re.finditer(r"'tool\.(\w+)':\s*(['\"])(.*?)(?<!\\)\2", open(os.path.join(d, f), encoding='utf8').read()):
            lab[m.group(1)] = m.group(3).replace("\\'", "'")
    return lab


# ------------------------------------------------------------------ identifiants réels de la démo
IDS_JS = """() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const T = (n) => s.tables[n] || [];
  const kids = T('children'); const baby = kids.find(c => (Date.now() - Date.parse(c.birth_date)) < 2 * 365.25 * 864e5) || kids[0];
  const first = (...names) => { for (const n of names) if (T(n).length) return T(n)[0].id; return null; };
  return { child: baby && baby.id, kid: (kids.find(c => c !== baby) || baby || {}).id, post: first('posts'), group: first('community_groups'),
    handle: (T('community_profiles')[0] || {}).handle, stock: first('household_stocks'), journey: first('user_journeys'), doc: first('documents'),
    mission: first('family_missions', 'missions'), scan: first('scans', 'scan_history'), routine: first('kid_routines'), album: first('community_albums', 'albums'),
    discharge: first('discharge_logs'), mood: first('mood_checkins') }; }"""

STATIC = {'/article/[slug]': '/article/a-bout-face-aux-pleurs-de-bebe', '/cycle/guides/[slug]': '/cycle/guides/clear-fluid',
          '/guide/[topic]': '/guide/illnesses', '/legal/[doc]': '/legal/privacy', '/fertility/test/[kind]': '/fertility/test/ovulation',
          '/track/[kind]': '/track/bottle', '/meals/[slug]': '/meals/me-patate-douce-poulet'}
DYN_KEY = {'/bottle/[childId]': 'child', '/sleep/[childId]': 'child', '/sleep/difficult/[childId]': 'child', '/sleep/help/[childId]': 'child',
           '/community/album/[id]': 'album', '/community/group/[id]': 'group', '/community/post/[id]': 'post', '/community/u/[handle]': 'handle',
           '/cycle/discharge/[id]': 'discharge', '/documents/[id]': 'doc', '/family/kid-routine/[id]': 'routine', '/family/missions/[id]': 'mission',
           '/family/stocks/[id]': 'stock', '/journeys/[id]': 'journey', '/me/mood/[id]': 'mood', '/products/[id]': None, '/scanner/result/[id]': 'scan'}


def concrete(route, ids):
    """Adresse concrète d'une route (None si aucun identifiant de démo : on teste alors un identifiant inexistant)."""
    if route in STATIC: return STATIC[route], True
    if route.startswith('/child/[id]'): return route.replace('[id]', ids.get('child') or 'audit-inexistant'), bool(ids.get('child'))
    if route in DYN_KEY:
        v = ids.get(DYN_KEY[route]) if DYN_KEY[route] else None
        return re.sub(r'\[[^\]]+\]', v or 'audit-inexistant', route), bool(v)
    if '[' in route:  # route dynamique ajoutée depuis : identifiant inexistant (l'écran doit le dire proprement)
        return re.sub(r'\[[^\]]+\]', 'audit-inexistant', route), False
    return route, True


# ------------------------------------------------------------------ outils de page
SKIP_CONSOLE = ('ERR_TUNNEL', 'Failed to load resource', 'ERR_NAME_NOT_RESOLVED', 'net::', 'sb.fake.test', 'Download the React DevTools')


class Page:
    def __init__(self, ctx):
        self.pg = ctx.new_page()
        self.errs = []
        self.pg.on('console', lambda m: m.type == 'error' and not any(s in m.text for s in SKIP_CONSOLE) and self.errs.append('console: ' + m.text[:220]))
        self.pg.on('pageerror', lambda e: self.errs.append('exception: ' + str(e)[:220]))
        self.body = None

    def take_errs(self):
        e, self.errs = self.errs, []
        return e

    def settle(self, first=900, cap=5000):
        """Attend que le texte de la page cesse de changer (chargements, animations d'entrée)."""
        self.pg.wait_for_timeout(first)
        last, stable, t0 = None, 0, time.time()
        while time.time() - t0 < cap / 1000:
            try: cur = self.pg.evaluate('() => document.body.innerText.length')
            except Exception: cur = None
            if cur == last: stable += 1
            else: stable = 0
            if stable >= 3: break
            last = cur
            self.pg.wait_for_timeout(250)

    def path(self):
        u = self.pg.url[len(B):] if self.pg.url.startswith(B) else self.pg.url
        return u or '/'

    def text(self):
        try: return self.pg.inner_text('body')
        except Exception: return ''

    def state(self):
        """Classement de l'écran affiché."""
        txt = self.text()
        p = self.path()
        flags = []
        if self.pg.locator('[data-testid="error-detail"]').count(): flags.append('plantage')
        if 'Cette page n’existe pas' in txt: flags.append('introuvable')
        if 'Impossible d’afficher ces informations' in txt: flags.append('erreur_donnees')
        if '/journeys/blocked' in p: flags.append('garde_parcours')
        if 'Cet espace fait partie de Premium' in txt: flags.append('premium')
        if re.search(r'\b(introuvable|n’existe plus)\b', txt, re.I) and 'introuvable' not in flags and 'Page introuvable' not in txt: flags.append('donnee_introuvable')
        visible = re.sub(r'\s+', ' ', txt).strip()
        # écran blanc : presque aucun texte (la barre d'onglets seule compte ~45 caractères)
        if len(visible) < 60: flags.append('ecran_blanc')
        return {'path': p, 'flags': flags, 'chars': len(visible)}

    def back_button(self):
        b = self.pg.get_by_role('button', name=re.compile(r'^(Retour|Back)$')).filter(visible=True)
        # écrans plein écran (nuit difficile, aide pour cette nuit…) : bouton « Fermer »
        return (b if b.count() else self.pg.get_by_role('button', name=re.compile(r'^Fermer( l’aide pour cette nuit)?$')).filter(visible=True)).first


def enter_demo(ctx, premium=True):
    P = Page(ctx)
    pg = P.pg
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON if premium else PREMIUM_OFF)
    pg.reload(); P.settle(1500)
    P.take_errs()
    return P


def set_body(P, need, cur):
    if need != cur.get('body'):
        if need is None:
            need = ('default', False)
            P.pg.evaluate("""(j) => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.user_journeys = j; localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""", cur['default_journeys'])
        else:
            P.pg.evaluate(SET_BODY, list(need))
        cur['body'] = need


BLOCKING = {'plantage', 'introuvable', 'ecran_blanc', 'erreur_donnees', 'onglet_plante', 'session_perdue'}
# Écran attendu après « Retour » / « Fermer » depuis un lien direct (sans historique) : l'écran parent, jamais l'Accueil
# (audit 01 N-07 : écrans plein écran du sommeil ouverts par une notification)
EXPECTED_BACK = {'/sleep/tonight': '/baby', '/sleep/difficult/[childId]': '/baby', '/sleep/help/[childId]': '/baby'}


# ------------------------------------------------------------------ phase routes (liens profonds)
def phase_routes(b, premium=True):
    S = {}

    def fresh():
        if S.get('ctx'):
            try: S['ctx'].close()
            except Exception: pass
        S['ctx'] = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
        S['P'] = enter_demo(S['ctx'], premium)
        S['cur'] = {'default_journeys': S['P'].pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1')).tables.user_journeys"), 'body': None}
        S['ids'] = S['P'].pg.evaluate(IDS_JS)
        S['n'] = 0
    fresh()
    rows = []
    for route in app_routes():
        if ONLY and ONLY not in route: continue
        # un onglet neuf toutes les 40 adresses (mémoire du navigateur, machine partagée)
        if S['n'] >= 40: fresh()
        S['n'] += 1
        try:
            rows.append(check_route(S, route, premium))
        except Exception as e:  # onglet planté : on le note, on repart d'un onglet neuf
            rows.append({'route': route, 'url': route, 'path': '', 'flags': ['onglet_plante'], 'errors': [str(e)[:200]]})
            print('KO ' + route + ' onglet planté : ' + str(e)[:100], flush=True)
            fresh()
    S['ctx'].close()
    return rows


def check_route(S, route, premium):
    P, cur, ids = S['P'], S['cur'], S['ids']
    if True:
        url, real = concrete(route, ids)
        # écrans d'un parcours : ouverts avec ce parcours actif (sinon garde d'accès, résultat attendu)
        need = body_for(url)
        if route.startswith('/bottle') or route.startswith('/track/'): need = None
        set_body(P, tuple(need) if need else None, cur)
        P.pg.goto(B + url); P.settle()
        st = P.state()
        errs = P.take_errs()
        if errs: st['flags'].append('exception_console')
        # lien direct renvoyé vers l'accueil public : la session (démonstration) n'a pas été reprise (N-10)
        if st['path'].split('?')[0] in ('/welcome', '/intro') and not url.startswith(('/welcome', '/intro', '/auth', '/onboarding', '/cinematic')):
            st['flags'].append('session_perdue')
        if not premium and 'premium' in st['flags']: pass  # écran Premium attendu sans abonnement
        row = {'route': route, 'url': url, 'id_reel': real, **st, 'errors': errs[:4]}
        # Retour depuis un lien direct (pas d'historique) : doit rester dans l'application, sur un écran valide
        bb = P.back_button()
        # écran Premium (sans abonnement) : il recouvre l'écran et son « Retour » (constat N-05, hors navigation)
        if 'premium' in st['flags'] and not premium:
            row['retour'] = '(écran Premium)'
        elif bb.count() and route not in ('/', '/welcome'):
            before = P.path()
            try:
                bb.click(timeout=3000)
                P.settle(700, 3000)
                st2 = P.state()
                row['retour'] = st2['path']
                row['retour_ok'] = st2['path'] != before and P.pg.url.startswith(B) and not (set(st2['flags']) & BLOCKING)
                if route in EXPECTED_BACK and st2['path'].split('?')[0] != EXPECTED_BACK[route]:
                    row['retour_ok'] = False; row['retour_attendu'] = EXPECTED_BACK[route]
                row['retour_flags'] = st2['flags']
            except Exception as e:
                row['retour'] = 'ERREUR ' + str(e)[:80]; row['retour_ok'] = False
            P.take_errs()
        ok = not (set(row['flags']) & (BLOCKING | {'exception_console'})) and row.get('retour_ok', True)
        print(('OK ' if ok else 'KO ') + route, row['path'], row['flags'], row.get('retour', ''), flush=True)
        return row


# ------------------------------------------------------------------ phase outils (point d'entrée normal)
HUBS = {'health': ('/health', 'Santé'), 'baby': ('/baby', 'Bébé'), 'family': ('/household', 'Famille')}
BODIES = [None, ('ttc', False), ('avoid', False), ('cycle', False), ('pregnancy', True)]


def expand_hub(P):
    for _ in range(3):
        btns = P.pg.locator('[data-testid^="hub-more-"], [data-testid$="-others-show"]').filter(visible=True)
        n = btns.count()
        clicked = False
        for i in range(n):
            el = btns.nth(i)
            try:
                if re.search(r'Voir plus|Afficher|autres', el.inner_text() or '', re.I):
                    el.click(timeout=1500); P.pg.wait_for_timeout(250); clicked = True
            except Exception: pass
        if not clicked: break


HUB_SCOPE = '[data-testid^="hub-"]:is([data-testid="hub-health"],[data-testid="hub-baby"],[data-testid="hub-family"])'


def hub_cards(P):
    """Libellés accessibles des cartes d'outils visibles DANS le contenu du hub (pas l'en-tête : Réglages, Notifications…)."""
    return P.pg.evaluate("""(sel) => [...document.querySelectorAll(sel + ' [role="button"][aria-label]')].filter(e => e.offsetParent !== null).map(e => e.getAttribute('aria-label'))""", HUB_SCOPE)


def phase_tools(b):
    """Pour chaque parcours de démo : chaque onglet hub est ouvert une fois, toutes ses cartes sont dépliées, puis
    chaque carte d'un outil pas encore vérifié est touchée ; « Retour » doit ramener à l'onglet (navigation dans
    l'application, sans rechargement). Les outils sans carte sont cherchés dans la recherche universelle."""
    defs = tool_defs()
    labels = tool_labels()
    by_label = {}
    for d in defs: by_label.setdefault(labels.get(d['id'], d['id']), []).append(d)
    S = {}

    def fresh(body):
        if S.get('ctx'):
            try: S['ctx'].close()
            except Exception: pass
        S['ctx'] = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
        S['P'] = enter_demo(S['ctx'], True)
        S['cur'] = {'default_journeys': S['P'].pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1')).tables.user_journeys"), 'body': None}
        set_body(S['P'], body, S['cur'])

    done = {}
    for body in BODIES:
        fresh(body)
        pname = (body[0] + ('+postpartum' if body[1] else '')) if body else 'démo (grossesse, bébé, enfant)'
        for hub, (hpath, hname) in HUBS.items():
            P = S['P']
            P.pg.goto(B + hpath); P.settle(); expand_hub(P)
            for lab in list(dict.fromkeys(hub_cards(P))):
                # carte « libellé, précision » ; bandeau d'urgence « libellé. précision » (un libellé peut contenir une virgule)
                base = next((L for L in sorted(by_label, key=len, reverse=True) if lab == L or lab.startswith(L + ', ') or lab.startswith(L + '. ')), None)
                if not base: continue
                cands = [d for d in by_label.get(base, []) if not (d['id'] in done and done[d['id']]['ok'])]
                if not cands or (ONLY and not any(ONLY in d['id'] for d in cands)): continue
                d = cands[0]
                try:
                    row = open_card(S['P'], d, base, lab, hub, hpath, hname, pname)
                except Exception as e:
                    row = {'id': d['id'], 'libelle': base, 'theme': d['theme'], 'parcours': pname, 'ok': False, 'entree': f'onglet {hname} (carte)', 'route': '', 'observation': 'onglet planté : ' + str(e)[:100]}
                    fresh(body)
                if row is None: continue
                # un même libellé peut désigner plusieurs outils (ex. « Résumés ») : on note les autres avec le même résultat
                for x in cands:
                    done[x['id']] = {**row, 'id': x['id'], 'theme': x['theme']} if x is not d else row
                print(('OK ' if row['ok'] else 'KO ') + d['id'], row['entree'], row.get('route', ''), row['observation'], flush=True)
                P = S['P']
                if P.path().split('?')[0].rstrip('/') != hpath:
                    P.pg.goto(B + hpath); P.settle()
                expand_hub(P)
        # outils sans carte dans ce parcours : recherche universelle
        P = S['P']
        for d in defs:
            k = d['id']
            if (k in done and done[k]['ok'] is not None) or (ONLY and ONLY not in k): continue
            lab = labels.get(k, k)
            try:
                row = open_search(P, d, lab, pname)
            except Exception as e:
                row = {'id': k, 'libelle': lab, 'theme': d['theme'], 'parcours': pname, 'ok': False, 'entree': 'recherche', 'route': '', 'observation': 'onglet planté : ' + str(e)[:100]}
                fresh(body); P = S['P']
            if row['ok'] is not None or k not in done: done[k] = row
            if row['ok'] is not None: print(('OK ' if row['ok'] else 'KO ') + k, row['entree'], row.get('route', ''), row['observation'], flush=True)
    S['ctx'].close()
    for d in defs:
        if d['id'] not in done and not ONLY:
            done[d['id']] = {'id': d['id'], 'libelle': labels.get(d['id'], d['id']), 'theme': d['theme'], 'ok': None, 'entree': '', 'route': '', 'observation': 'jamais proposé'}
    return [done[d['id']] for d in defs if d['id'] in done]


def judge(P, row, hpath):
    """Écran ouvert puis « Retour » : classement commun (carte ou recherche)."""
    P.settle(900, 4000)
    st = P.state()
    errs = P.take_errs()
    row['route'] = st['path']
    bad = set(st['flags']) & BLOCKING
    obs = []
    if bad: obs.append('écran : ' + ', '.join(sorted(bad)))
    if 'garde_parcours' in st['flags']: obs.append('garde de parcours'); bad.add('garde')
    if errs: obs.append('exceptions : ' + ' | '.join(errs[:2])); bad.add('exception')
    if st['path'].split('?')[0].rstrip('/') == hpath: obs.append('clic sans effet (resté sur l’onglet)'); bad.add('sans_effet')
    else:
        bb = P.back_button()
        if bb.count():
            try:
                bb.click(timeout=3000); P.settle(600, 2500)
                back = P.path().split('?')[0]
                row['retour'] = back
                if back.rstrip('/') != hpath: obs.append(f'Retour → {back} (attendu {hpath})'); bad.add('retour')
            except Exception as e:
                obs.append('Retour en échec ' + str(e)[:60]); bad.add('retour')
        else:
            row['retour'] = '(pas de bouton Retour)'
            obs.append('pas de bouton Retour visible')
            P.pg.go_back(); P.settle(600, 2500)
            if P.path().split('?')[0].rstrip('/') != hpath: obs.append('retour du navigateur hors de l’onglet'); bad.add('retour')
    row['ok'] = not bad
    row['observation'] = '; '.join(obs) or 'ouvert, Retour vers l’onglet'
    return row


def open_card(P, d, base, lab, hub, hpath, hname, pname):
    row = {'id': d['id'], 'libelle': base, 'theme': d['theme'], 'parcours': pname, 'entree': f'onglet {hname} (carte)'}
    P.take_errs()
    card = P.pg.locator(HUB_SCOPE + ' [role="button"][aria-label="%s"]' % lab.replace('"', '\\"')).filter(visible=True).first
    if not card.count(): return None  # la grille a changé (profil affiché) : la carte sera revue plus tard
    card.scroll_into_view_if_needed(timeout=3000); card.click(timeout=3000)
    return judge(P, row, hpath)


def open_search(P, d, lab, pname):
    k = d['id']
    hpath = HUBS['family'][0]
    row = {'id': k, 'libelle': lab, 'theme': d['theme'], 'parcours': pname, 'entree': 'recherche (onglet Famille)'}
    if P.path().split('?')[0].rstrip('/') != hpath:
        P.pg.goto(B + hpath); P.settle()
    P.pg.locator('[data-testid="hub-family-search"]').filter(visible=True).first.click()
    P.pg.wait_for_timeout(500)
    inp = P.pg.locator('[data-testid="tool-search-input"]').filter(visible=True).first
    inp.fill(lab); P.pg.wait_for_timeout(500)
    res = P.pg.locator(f'[data-testid="tool-search-result-{k}"]').filter(visible=True).first
    if not res.count():
        P.pg.keyboard.press('Escape'); P.pg.goto(B + hpath); P.settle(500, 2000)
        row.update(ok=None, route='', observation='hors des parcours de démo testés (aucune carte, aucun résultat de recherche)')
        return row
    P.take_errs()
    res.click()
    return judge(P, row, hpath)


# ------------------------------------------------------------------ phase boutons sans effet
SWEEP = ['/', '/health', '/baby', '/household', '/community', '/tools', '/profile', '/settings', '/track', '/ask', '/agenda', '/family',
         '/family/missions', '/family/stocks', '/meals/shopping', '/notifications', '/journeys', '/library', '/calendar', '/appointments', '/documents']
DANGER = re.compile(r'supprim|effac|déconnect|quitter|retirer|réinitialis|annuler|bloquer|signaler|vider|terminer|fin de|urgence|appeler|15|112|partager|exporter|imprimer|télécharger', re.I)


def snapshot(P):
    return P.pg.evaluate("""() => [location.pathname + location.search, document.body.innerText.length, document.querySelectorAll('[role="dialog"],[aria-modal="true"]').length,
      [...document.querySelectorAll('[aria-checked],[aria-selected],[aria-expanded],[aria-pressed]')].map(e => (e.getAttribute('aria-checked')||'') + (e.getAttribute('aria-selected')||'') + (e.getAttribute('aria-expanded')||'') + (e.getAttribute('aria-pressed')||'')).join(''),
      document.body.innerText.slice(0, 4000)]""")


def phase_sweep(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    P = enter_demo(ctx, True)
    found = []
    for path in SWEEP:
        if ONLY and ONLY not in path: continue
        P.pg.goto(B + path); P.settle()
        labels = P.pg.evaluate("""() => { const seen = new Set(); return [...document.querySelectorAll('[role="button"][aria-label],[role="link"][aria-label],a[href][aria-label]')]
          .filter(e => e.offsetParent !== null && !e.closest('[role="tablist"]')).map(e => e.getAttribute('aria-label')).filter(l => l && !seen.has(l) && seen.add(l)); }""")
        for lab in labels[:40]:
            if DANGER.search(lab): continue
            P.pg.goto(B + path); P.settle(700, 3000)
            el = P.pg.locator(f'[aria-label="{lab}"]').filter(visible=True).first
            if not el.count(): continue
            before = snapshot(P)
            try: el.click(timeout=2000)
            except Exception: continue
            P.pg.wait_for_timeout(1300)
            after = snapshot(P)
            if before == after:
                found.append({'ecran': path, 'bouton': lab})
                print('SANS EFFET', path, lab, flush=True)
            P.take_errs()
    ctx.close()
    return found


if __name__ == '__main__':
    R = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EXE)
        name = 'audit_nav' + ('_' + '_'.join(PHASES) if sys.argv[1:] else '') + '.json'
        save = lambda: json.dump(R, open(os.path.join(OUT, name), 'w'), ensure_ascii=False, indent=1)
        if 'routes' in PHASES: R['routes'] = phase_routes(b, True); save()
        if 'free' in PHASES: R['routes_sans_premium'] = phase_routes(b, False); save()
        if 'tools' in PHASES: R['outils'] = phase_tools(b); save()
        if 'sweep' in PHASES: R['sans_effet'] = phase_sweep(b); save()
        b.close()
    if 'outils' in R:
        with open(os.path.join(OUT, 'tools_entry.csv'), 'w', newline='', encoding='utf8') as f:
            w = csv.writer(f)
            w.writerow(['id', 'libelle', 'point_entree', 'route', 'ouverture', 'observation'])
            for r in R['outils']:
                w.writerow([r['id'], r['libelle'], r.get('entree', ''), r.get('route', ''), 'OK' if r['ok'] else ('KO' if r['ok'] is False else 'NON TESTÉ'), r.get('observation', '')])
    bad = 0
    for key in ('routes', 'routes_sans_premium'):
        for r in R.get(key, []):
            if set(r['flags']) & (BLOCKING | {'exception_console'}) or r.get('retour_ok') is False: bad += 1
    bad += sum(1 for r in R.get('outils', []) if r['ok'] is False)
    bad += len(R.get('sans_effet', []))
    summary = {k: len(v) for k, v in R.items()}
    print(json.dumps({'resume': summary, 'defauts': bad}, ensure_ascii=False))
    sys.exit(1 if bad else 0)
