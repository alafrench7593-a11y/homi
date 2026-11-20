"""
HOMI Aura (20/11/2026) — version web de DÉMONSTRATION sans serveur (« Découvrir sans compte » : modèle SIMULÉ par
règles, crédits de démonstration, aucune IA appelée ; Gemini et ElevenLabs réels NON testables ici, voir
docs/HOMI_AURA.md § 11) :
  consentement avant la première question, coût affiché AVANT, conversation, cartes d'action, événement ajouté
  SEULEMENT après la feuille de confirmation, crédit débité (solde qui baisse de 1), détresse gratuite et immédiate,
  repli LOCAL honnête (outils et articles, sans IA), 174 traducteur émotionnel (brouillon de « Se comprendre »),
  200 découverte (visite guidée), « Analyser avec HOMI IA » sur l'humeur (aperçu + accord), Réduire les animations,
  débordements (e2e/audit_ux_detect.js). Captures 390 × 844 et 320 × 568, clair et sombre : aura_<écran>_<largeur>_<thème>.png.

  npx expo export --platform web --clear --output-dir <dossier>/dist        # SANS EXPO_PUBLIC_SUPABASE_URL : démo seule
  python3 e2e/spa_server.py <dossier>/dist <port> &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:<port> E2E_SHOTS=<captures> python3 e2e/aura_demo.py
"""
import json, os, re
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8960')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/aura/shots')
EXE = os.environ.get('PW_CHROMIUM') or None
os.makedirs(SHOTS, exist_ok=True)
DETECT_JS = open(os.path.join(os.path.dirname(__file__), 'audit_ux_detect.js'), encoding='utf-8').read()
R, errs, overflow = {}, [], {}


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


def go(pg, path, wait=3500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def wait_for(pg, t, ms=8000):
    end = ms
    while end > 0 and not has(pg, t):
        pg.wait_for_timeout(200); end -= 200
    return has(pg, t)


def detect(pg, key):
    found = pg.evaluate('() => window.__homiDetect ? window.__homiDetect() : []')
    found = [f for f in found if 'Démo' not in json.dumps(f, ensure_ascii=False) and 'Quitter' not in json.dumps(f, ensure_ascii=False)]
    overflow[key] = found
    return found


def shoot(pg, name):
    pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)


def scroll_to(pg, t):
    pg.evaluate("(t) => { const e = [...document.querySelectorAll(`[data-testid=\"${t}\"]`)].find((x) => x.getBoundingClientRect().height > 0); if (e) e.scrollIntoView({ block: 'center' }); }", t)
    pg.wait_for_timeout(500)


def say(pg, text):
    box = vis(pg, 'aura-input').first
    box.click(); box.fill(text); pg.wait_for_timeout(200)
    vis(pg, 'aura-send').first.click(); pg.wait_for_timeout(1800)


def balance(pg):
    m = re.search(r'([\d ]+) crédits? disponibles?', text_of(pg, 'aura-cost'))
    return int(m.group(1).replace(' ', '')) if m else None


def run(b, width, height, scheme, first):
    ctx = b.new_context(viewport={'width': width, 'height': height}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2,
                        color_scheme=scheme, reduced_motion='reduce' if scheme == 'dark' else 'no-preference')
    ctx.add_init_script(DETECT_JS)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    k = f'{width}_{scheme}'
    # La démonstration démarre sans abonnement : HOMI Aura est derrière Premium (écran de l'abonnement, comme l'ancien
    # onglet Questions). Achat SIMULÉ de la formule Famille (faux magasin, aucun paiement) pour ouvrir Aura.
    go(pg, '/assistant')
    if first:
        R['sans_abonnement_porte_premium'] = has(pg, 'premium-gate')
    go(pg, '/settings/subscription', 4500)
    if has(pg, 'family-buy'):
        vis(pg, 'family-buy').first.scroll_into_view_if_needed(); vis(pg, 'family-buy').first.click(); pg.wait_for_timeout(3500)

    # 1) Accueil d'Aura : mode démonstration annoncé, consentement AVANT la première question (accord retiré du foyer de démo)
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables.consents = (s.tables.consents || []).filter(c => c.purpose !== 'ai_assistant'); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
    go(pg, '/assistant')
    if first:
        R['mode_demo_annonce'] = 'Démonstration : réponses simulées, aucune IA' in text_of(pg, 'aura-mode')
        R['consentement_avant'] = has(pg, 'aura-consent')
    shoot(pg, f'aura_consentement_{k}')
    if has(pg, 'aura-consent-accept'):
        vis(pg, 'aura-consent-accept').first.click(); pg.wait_for_timeout(1500)
    if first:
        R['cout_affiche_avant'] = '1 crédit par question' in text_of(pg, 'aura-cost')
        R['suggestions'] = vis(pg, 'aura-suggestion').count() == 3
    R[f'debordement_accueil_{k}'] = len(detect(pg, f'accueil_{k}')) == 0
    shoot(pg, f'aura_accueil_{k}')

    # 2) Conversation : cartes d'action, débit d'1 crédit, rien d'écrit avant confirmation
    before = balance(pg)
    say(pg, 'Aide-moi à organiser la semaine et le rendez-vous chez la pédiatre')
    wait_for(pg, 'aura-reply')
    if first:
        R['reponse'] = has(pg, 'aura-reply')
        R['cartes_evenement_et_plan'] = has(pg, 'aura-action-event') and has(pg, 'aura-action-plan')
        R['proposition_annoncee'] = 'rien n’est fait sans ton accord' in T(pg)
        R['credit_debite_1'] = '1 crédit utilisé' in text_of(pg, 'aura-charged') and before is not None and balance(pg) == before - 1
    R[f'debordement_reponse_{k}'] = len(detect(pg, f'reponse_{k}')) == 0
    scroll_to(pg, 'aura-action-event')
    shoot(pg, f'aura_reponse_actions_{k}')
    vis(pg, 'aura-event-open').first.click(); pg.wait_for_timeout(1200)
    if first:
        R['feuille_confirmation'] = has(pg, 'aura-event-sheet') and 'Ajouter cet événement ?' in T(pg)
    shoot(pg, f'aura_confirmation_evenement_{k}')
    vis(pg, 'aura-event-confirm').first.click(); pg.wait_for_timeout(1800)
    if first:
        R['evenement_ajoute_apres_confirmation'] = 'Ajouté à l’agenda' in T(pg)

    # 3) Détresse : immédiate, gratuite
    before = balance(pg)
    say(pg, 'je veux mourir')
    if first:
        R['detresse_orientation'] = has(pg, 'aura-safety') and '3114' in T(pg)
        R['detresse_gratuite'] = balance(pg) == before
    scroll_to(pg, 'aura-safety')
    shoot(pg, f'aura_detresse_{k}')

    # 4) Repli LOCAL honnête (sans IA)
    go(pg, '/assistant?mode=local')
    say(pg, 'chronomètre de tétée')
    wait_for(pg, 'aura-local-reply')
    if first:
        R['local_annonce'] = 'Mode local, sans IA' in text_of(pg, 'aura-mode') and 'Gratuit, sur ce téléphone' in text_of(pg, 'aura-cost')
        R['local_honnete'] = 'je ne comprends pas vraiment ton message' in T(pg)
    say(pg, 'zzkx qwvb')
    if first:
        R['local_rien_trouve_dit'] = has(pg, 'aura-local-none')
    R[f'debordement_local_{k}'] = len(detect(pg, f'local_{k}')) == 0
    shoot(pg, f'aura_local_{k}')

    # 5) 174 — traducteur émotionnel (simulé) : 3 reformulations, brouillon de « Se comprendre »
    go(pg, '/assistant?theme=emotion_translator')
    if has(pg, 'aura-ref-draft'):
        vis(pg, 'aura-ref-draft').first.fill('Tu ne fais jamais rien le soir !'); pg.wait_for_timeout(200)
        vis(pg, 'aura-ref-go').first.click(); pg.wait_for_timeout(1800)
    if first:
        R['174_trois_reformulations'] = vis(pg, 'aura-ref-option').count() == 3
    shoot(pg, f'aura_174_{k}')
    if has(pg, 'aura-ref-option'):
        vis(pg, 'aura-ref-option').first.click(); pg.wait_for_timeout(300)
        vis(pg, 'aura-ref-use').first.click(); pg.wait_for_timeout(2500)
        if first:
            R['174_brouillon_se_comprendre'] = '/family/understand/compose' in pg.url

    # 6) 200 — découverte
    go(pg, '/assistant?theme=discovery')
    if first:
        R['200_visite_guidee'] = has(pg, 'aura-tour')
    shoot(pg, f'aura_200_{k}')

    # 7) « Analyser avec HOMI IA » sur l'humeur : aperçu + accord
    go(pg, '/me/mood', 4000)
    if has(pg, 'mood-3'):
        vis(pg, 'mood-3').first.click(); pg.wait_for_timeout(600)
        vis(pg, 'mood-main-action').first.click(); pg.wait_for_timeout(2500)
    scroll_to(pg, 'aura-analysis-mood')
    if first:
        R['analyse_humeur_posee'] = has(pg, 'aura-analysis-mood')
        R['analyse_apercu_exact'] = 'Bilans : 1' in text_of(pg, 'aura-analysis-mood-preview')
        R['analyse_bouton_apres_accord_seulement'] = not has(pg, 'aura-analysis-mood-ai-button')
    sw = pg.locator('[data-testid="aura-analysis-mood"] [role="switch"]').filter(visible=True)
    if sw.count():
        sw.first.click(); pg.wait_for_timeout(600)
    if first:
        R['analyse_cout_affiche'] = 'Analyser avec HOMI IA — 3 crédits' in text_of(pg, 'aura-analysis-mood-ai-button')
    scroll_to(pg, 'aura-analysis-mood')
    shoot(pg, f'aura_analyse_humeur_{k}')
    if has(pg, 'aura-analysis-mood-ai-button'):
        vis(pg, 'aura-analysis-mood-ai-button').first.click(); pg.wait_for_timeout(1200)
        btn = pg.get_by_role('button', name=re.compile(r'^Analyser \(3 crédits\)')).filter(visible=True)
        if btn.count():
            btn.last.click(); pg.wait_for_timeout(2500)
    if first:
        R['analyse_resultat'] = has(pg, 'aura-analysis-mood-result') and '3 crédits utilisés' in text_of(pg, 'aura-analysis-mood-result')
    scroll_to(pg, 'aura-analysis-mood-result')
    shoot(pg, f'aura_analyse_resultat_{k}')

    # 8) Compte en ESSAI : abonnement actif requis, repli local proposé (aucun crédit d'essai)
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); for (const x of (s.tables.subscriptions || [])) if (x.user_id === s.session.userId) x.status = 'trial'; localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
    go(pg, '/assistant')
    if first:
        R['essai_abonnement_actif_requis'] = has(pg, 'aura-needs-sub') and 'l’essai gratuit donne accès aux outils, pas à l’IA' in T(pg)
    shoot(pg, f'aura_essai_{k}')
    if has(pg, 'aura-sub-local'):
        vis(pg, 'aura-sub-local').first.click(); pg.wait_for_timeout(800)
        if first:
            R['essai_repli_local'] = 'Mode local, sans IA' in text_of(pg, 'aura-mode')
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    run(b, 390, 844, 'light', True)
    run(b, 390, 844, 'dark', False)
    run(b, 320, 568, 'light', False)
    run(b, 320, 568, 'dark', False)
    b.close()

R['erreurs'] = errs
R['debordements'] = {k: v for k, v in overflow.items() if v}
print(json.dumps(R, ensure_ascii=False, indent=1))
