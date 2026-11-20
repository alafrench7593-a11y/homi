"""
Crédits HOMI Aura (26/11/2026) — version web de DÉMONSTRATION (« Découvrir sans compte » : faux magasin, aucun paiement,
aucune IA appelée ; StoreKit / RevenueCat / Gemini réels NON testables ici, voir docs/CREDITS_IA.md § 6) :
  sans abonnement (aucun crédit, aucun pack), page d'abonnement avec la carte HOMI Famille (prix de la grille de
  démonstration, renouvellement visible, crédits expliqués sans promesse), achat simulé de Famille (1 500 crédits),
  « Mes crédits » (mensuels, achetés, utilisés, renouvellement), analyse d'essai (coût affiché avant confirmation,
  solde qui bouge), épuisement → feuille « Vous n'avez plus de crédits » (renouvellement, 3 packs), achat simulé d'un
  pack (solde acheté), historique (libellés lisibles), débordements (e2e/audit_ux_detect.js).
  Captures 390 × 844 et 320 × 568 : credits_<écran>_<largeur>.png (+ _page.png : page entière).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/credits/web
  python3 e2e/spa_server.py /tmp/credits/web 8952 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8952 E2E_SHOTS=/tmp/credits/shots python3 e2e/credits_demo.py
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8952')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/credits/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
R, errs, overflow = {}, [], {}
SCROLLER = "[...document.querySelectorAll('div')].filter(d => getComputedStyle(d).overflowY === 'auto' && d.scrollHeight > d.clientHeight + 40).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]"


def sp(text):
    return re.sub(r'[  ]', ' ', text or '')


def T(pg):
    return sp(pg.inner_text('body'))


def vis(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True)


def has(pg, t):
    return vis(pg, t).count() > 0


def text_of(pg, t):
    return sp(vis(pg, t).first.inner_text()) if has(pg, t) else ''


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def go(pg, path, wait=3500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def detect(pg, key):
    found = pg.evaluate('() => window.__homiDetect ? window.__homiDetect() : []')
    found = [f for f in found if 'Démo' not in json.dumps(f, ensure_ascii=False) and 'Quitter' not in json.dumps(f, ensure_ascii=False)]
    overflow[key] = found
    return found


def scroll_to(pg, t):
    pg.evaluate("(t) => { const e = [...document.querySelectorAll(`[data-testid=\"${t}\"]`)].find((x) => x.getBoundingClientRect().height > 0); if (e) e.scrollIntoView({ block: 'start' }); }", t)
    pg.wait_for_timeout(500)


def shoot(pg, name, full=True):
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)
    if full:
        h = pg.evaluate(f"() => {{ const el = {SCROLLER}; return el ? el.scrollHeight : 0; }}")
        vp = pg.viewport_size
        if h:
            pg.set_viewport_size({'width': vp['width'], 'height': min(h + 160, 7000)}); pg.wait_for_timeout(600)
            pg.screenshot(path=f'{SHOTS}/{name}_page.png')
            pg.set_viewport_size(vp); pg.wait_for_timeout(400)


def no_sub(pg):
    mutate(pg, "s => { const me = s.session.userId; s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== me); }")


def set_balance(pg, monthly, purchased):
    # Épuisement simulé : lignes « ajustement » du grand livre de démonstration (le solde reste la somme des mouvements)
    mutate(pg, f"""s => {{ const me = s.session.userId; const accs = s.tables.credit_accounts || []; const subs = s.tables.subscriptions || [];
      const a = accs.find(x => x.payer_id === me) || accs[0]; if (!a) return;
      const dm = {monthly} - a.monthly_balance, dp = {purchased} - a.purchased_balance;
      (s.tables.credit_ledger ||= []).push({{ id: 'e2e-adj-' + Date.now(), account_id: a.id, actor_id: me, kind: 'adjust', amount: dm + dp, monthly_delta: dm, purchased_delta: dp, action: null, product_id: null, created_at: new Date().toISOString() }});
      a.monthly_balance = {monthly}; a.purchased_balance = {purchased}; }}""")


def confirm_dialog(pg, label_re):
    btn = pg.get_by_role('button', name=re.compile(label_re)).filter(visible=True)
    if btn.count():
        btn.last.click(); pg.wait_for_timeout(1500); return True
    return False


def run(b, width, height, first):
    ctx = b.new_context(viewport={'width': width, 'height': height}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2, color_scheme='light')
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    no_sub(pg)
    w = str(width)

    # 1) Sans abonnement : aucun crédit, aucun pack
    go(pg, '/settings/credits')
    if first:
        R['sans_abonnement_aucun_credit'] = has(pg, 'credits-nosub') and 'Sans abonnement, il n’y a pas de crédits HOMI Aura' in T(pg) and not has(pg, 'credits-packs')
        R['sans_abonnement_1000_1500'] = '1 000 crédits par mois' in T(pg) and '1 500 crédits par mois' in T(pg)

    # 2) Page d'abonnement : carte Famille, crédits expliqués, aucune ancienne offre
    go(pg, '/settings/subscription', 4500)
    scroll_to(pg, 'family-offer')
    txt = T(pg)
    if first:
        R['famille_prix_grille'] = text_of(pg, 'family-price') == '19,99 € par mois'
        R['famille_renouvellement_visible'] = 'renouvelé automatiquement' in text_of(pg, 'family-renewal')
        R['famille_explique'] = 'tous les adultes du foyer' in text_of(pg, 'family-offer') and '1 500 crédits HOMI Aura par mois en commun' in text_of(pg, 'family-offer')
        R['credits_sans_promesse'] = 'pas encore ouverte' in text_of(pg, 'credits-info') and 'Premium : 1 000 crédits par mois' in text_of(pg, 'credits-info')
        R['anciennes_offres_absentes'] = not has(pg, 'offer-ai') and not has(pg, 'offer-tools') and 'Assistant IA' not in txt
    R[f'debordement_abonnement_{w}'] = len(detect(pg, f'abonnement_{w}')) == 0
    shoot(pg, f'credits_abonnement_famille_{w}')

    # 3) Achat simulé de Famille → 1 500 crédits
    vis(pg, 'family-buy').first.click(); pg.wait_for_timeout(3000)
    if first:
        R['famille_achetee'] = has(pg, 'family-current') or 'Bienvenue dans HOMI Famille' in T(pg)

    # 4) Mes crédits : solde, renouvellement
    go(pg, '/settings/credits')
    if first:
        R['solde_1500'] = text_of(pg, 'credits-total') == '1 500 crédits disponibles' and '1 500' in text_of(pg, 'credits-monthly')
        R['renouvellement_affiche'] = bool(re.search(r'\d+ \S+ : 1 500 crédits mensuels', text_of(pg, 'credits-renewal')))
        R['solde_commun_foyer'] = 'Solde commun aux adultes du foyer' in T(pg) or 'Solde partagé' in T(pg)
        R['packs_grille_demo'] = all(p in T(pg) for p in ['3,99 €', '8,99 €', '19,99 €']) and has(pg, 'credits-packs-demo')
    R[f'debordement_credits_{w}'] = len(detect(pg, f'credits_{w}')) == 0
    shoot(pg, f'credits_mes_credits_{w}')

    # 5) Analyse d'essai : coût affiché avant, confirmation, solde qui bouge
    btn = text_of(pg, 'credits-demo-analyze-button')
    if first:
        R['cout_affiche_avant'] = 'Analyser avec HOMI Aura — 3 crédits' in btn
    scroll_to(pg, 'credits-demo-analyze-button')
    vis(pg, 'credits-demo-analyze-button').first.click(); pg.wait_for_timeout(1200)
    if first:
        R['confirmation_avec_cout'] = 'Cette analyse utilise 3 crédits' in T(pg)
    confirm_dialog(pg, r'^Analyser \(3 crédits\)')
    go(pg, '/settings/credits')
    if first:
        R['solde_baisse'] = text_of(pg, 'credits-total') == '1 497 crédits disponibles' and '3' in text_of(pg, 'credits-used')
        R['historique_debit'] = 'Analyse d’un outil' in text_of(pg, 'credits-history') and 'Crédits mensuels' in text_of(pg, 'credits-history')

    # 6) Épuisement → feuille « Vous n'avez plus de crédits »
    set_balance(pg, 0, 0)
    go(pg, '/settings/credits')
    if first:
        R['epuise_zero'] = text_of(pg, 'credits-total') == '0 crédit disponible'
    scroll_to(pg, 'credits-demo-analyze-button')
    vis(pg, 'credits-demo-analyze-button').first.click(); pg.wait_for_timeout(2000)
    sheet = text_of(pg, 'credits-out-sheet')
    if first:
        R['feuille_ouverte'] = has(pg, 'credits-out-sheet') and 'Vous n’avez plus de crédits' in T(pg)
        R['feuille_cout_et_renouvellement'] = 'Cette action demande 3 crédits. Il vous en reste 0.' in sheet and bool(re.search(r'Vos 1 500 crédits mensuels reviennent le \d+', sheet))
        R['feuille_3_packs'] = all(has(pg, f'pack-buy-homi_credits_{n}') for n in (300, 800, 2000))
        R['feuille_plus_tard'] = has(pg, 'credits-out-later')
    R[f'debordement_feuille_{w}'] = len(detect(pg, f'feuille_{w}')) == 0
    shoot(pg, f'credits_feuille_packs_{w}', full=False)

    # 7) Achat simulé d'un pack depuis la feuille → solde acheté
    vis(pg, 'pack-buy-homi_credits_300').last.click(); pg.wait_for_timeout(2500)
    go(pg, '/settings/credits')
    if first:
        R['pack_achete'] = text_of(pg, 'credits-total') == '300 crédits disponibles' and '300' in text_of(pg, 'credits-purchased')
        R['historique_pack'] = 'Pack de 300 crédits' in text_of(pg, 'credits-history')
    # 8) Une analyse consomme les crédits achetés quand les mensuels sont épuisés
    scroll_to(pg, 'credits-demo-analyze-button')
    vis(pg, 'credits-demo-analyze-button').first.click(); pg.wait_for_timeout(1200)
    confirm_dialog(pg, r'^Analyser \(3 crédits\)')
    go(pg, '/settings/credits')
    if first:
        R['achetes_consommes_ensuite'] = text_of(pg, 'credits-total') == '297 crédits disponibles' and '297' in text_of(pg, 'credits-purchased')
        R['historique_sans_contenu'] = not re.search(r'question\s*:', text_of(pg, 'credits-history'), re.I)
    shoot(pg, f'credits_historique_{w}')
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    run(b, 390, 844, True)
    run(b, 320, 568, False)
    b.close()

R['erreurs'] = errs
R['debordements'] = {k: v for k, v in overflow.items() if v}
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = all(v is True for k, v in R.items() if k not in ('erreurs', 'debordements')) and not errs
sys.exit(0 if ok else 1)
