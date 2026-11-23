"""
Tickets 4 et 5 (21/11/2026) — rejoue dans la version web exportée :
  4 : Papiers de la famille → « Scanner un document » (bouton, appareil photo du navigateur = choix d'un fichier,
      aperçu, recadrage, nom, profil, enregistrement, retour aux papiers) ;
  5 : Aura (présentation, conversation, états d'erreur / saisie bloquée avec l'action utile, raison du mode sans IA,
      voix), « Se comprendre » (brouillon), analyse d'un outil de suivi (biberons), recherche d'outils vers la vraie route.
Aucune IA n'est appelée : version « prod » (adresse Supabase factice) = Aura sans IA (application telle que livrée) ;
version « demo » (sans serveur) = réponses SIMULÉES, signalées comme telles. Captures : <SHOTS>/<LABEL>_<étape>.png ;
VIDEO=1 : images en continu dans <SHOTS>/frames_<LABEL>/ (assemblées ensuite par ffmpeg).

  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx expo export --platform web --clear --output-dir <dist>
  python3 e2e/spa_server.py <dist> <port> &
  PW_CHROMIUM=... NAV_URL=http://127.0.0.1:<port> E2E_SHOTS=<dossier> LABEL=apres_prod python3 e2e/tickets_scan_aura.py
"""
import json, os, re, datetime
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8990')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/tickets/shots')
LABEL = os.environ.get('LABEL', 'apres')
EXE = os.environ.get('PW_CHROMIUM') or None
VIDEO = os.environ.get('VIDEO') == '1'
DOC = os.environ.get('DOC_IMAGE')
os.makedirs(SHOTS, exist_ok=True)
FRAMES = os.path.join(SHOTS, f'frames_{LABEL}')
if VIDEO:
    os.makedirs(FRAMES, exist_ok=True)
R, errs = {}, []
frame_n = [0]


def sp(t):
    return re.sub(r'[  ]', ' ', t or '')


def vis(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True)


def has(pg, t):
    return vis(pg, t).count() > 0


def body(pg):
    return sp(pg.inner_text('body'))


def frame(pg):
    if VIDEO:
        pg.screenshot(path=os.path.join(FRAMES, f'{frame_n[0]:05d}.png'))
        frame_n[0] += 1


def wait(pg, ms):
    """Attente qui capture des images en continu pour la vidéo (environ 6 images par seconde)."""
    if not VIDEO:
        pg.wait_for_timeout(ms); return
    left = ms
    while left > 0:
        frame(pg); pg.wait_for_timeout(120); left -= 160


def shoot(pg, name):
    pg.screenshot(path=f'{SHOTS}/{LABEL}_{name}.png')
    frame(pg)


def go(pg, path, ms=3500):
    pg.goto(B + path); wait(pg, ms)


def wait_for(pg, t, ms=9000):
    while ms > 0 and not has(pg, t):
        wait(pg, 200); ms -= 200
    return has(pg, t)


def click(pg, t, ms=900):
    vis(pg, t).first.scroll_into_view_if_needed(); vis(pg, t).first.click(); wait(pg, ms)


def click_text(pg, text, ms=900):
    loc = pg.get_by_text(text, exact=True).filter(visible=True)
    if loc.count() == 0:
        return False
    loc.first.scroll_into_view_if_needed(); loc.first.click(); wait(pg, ms)
    return True


def scroll_to(pg, t):
    pg.evaluate("(t) => { const e = [...document.querySelectorAll(`[data-testid=\"${t}\"]`)].find((x) => x.getBoundingClientRect().height > 0); if (e) e.scrollIntoView({ block: 'center' }); }", t)
    wait(pg, 500)


def demo_state(pg, js):
    pg.evaluate("(js) => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (new Function('s', js))(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }", js)


SUB = """const now = new Date(); const exp = new Date(now.getTime() + 30 * 86400000);
s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== s.session.userId);
s.tables.subscriptions.push({ user_id: s.session.userId, entitlement: 'HOMI_PREMIUM', status: 'active', product_id: 'homi_premium_monthly', store: 'test', period_type: 'monthly', expires_at: exp.toISOString(), will_renew: true, tier: 'premium', updated_at: now.toISOString() });
if (CREDITS) { s.tables.credit_accounts = (s.tables.credit_accounts || []).filter(a => a.payer_id !== s.session.userId);
  s.tables.credit_accounts.push({ id: 'acc-test', payer_id: s.session.userId, household_id: null, holder_kind: 'user', tier: 'premium', monthly_allowance: 100, monthly_balance: 100, purchased_balance: 0, period_start: now.toISOString(), period_end: exp.toISOString(), created_at: now.toISOString() }); }""".replace('CREDITS', 'true' if os.environ.get('CREDITS') == '1' else 'false')


def step(name, fn, pg):
    try:
        fn(pg)
    except Exception as e:  # une étape qui échoue ne bloque pas les suivantes ; elle est notée
        R[f'ERREUR_{name}'] = str(e)[:300]
        try:
            shoot(pg, f'erreur_{name}')
        except Exception:
            pass


# ------------------------------------------------------------------ ticket 4
def papers(pg):
    go(pg, '/family/papers', 4000)
    R['papiers_bouton_scanner'] = has(pg, 'pp-scan')
    shoot(pg, 'papiers_1_ecran')
    if not has(pg, 'pp-scan'):
        return
    click(pg, 'pp-scan', 2500)
    R['papiers_ouvre_scanner'] = '/documents/scan' in pg.url
    shoot(pg, 'papiers_2_scanner')
    if DOC:
        # Sur le web, « Prendre une photo » ouvre le sélecteur du navigateur (appareil photo du téléphone, fichier sur ordinateur)
        with pg.expect_file_chooser(timeout=8000) as fc:
            pg.get_by_text('Prendre une photo', exact=True).filter(visible=True).first.click()
        fc.value.set_files(DOC)
        wait(pg, 5000)
        shoot(pg, 'papiers_3_page')
        R['papiers_page_ajoutee'] = 'Page 1' in body(pg)
        # aperçu, puis recadrage
        if click_text(pg, 'Aperçu', 1500):
            shoot(pg, 'papiers_4_apercu')
            click_text(pg, 'Modifier les pages', 1000)
        crop = pg.locator('[aria-label$="touche pour recadrer"]').filter(visible=True)
        if crop.count():
            crop.first.click(); wait(pg, 1200); shoot(pg, 'papiers_5_recadrage')
            R['papiers_recadrage'] = 'coins' in body(pg).lower() or 'Appliquer' in body(pg)
            click_text(pg, 'Appliquer', 1500) or click_text(pg, 'Annuler', 800)
        click_text(pg, 'Continuer', 2500)
        name = pg.get_by_label('Nom du document').filter(visible=True)
        if name.count():
            name.first.fill('Livret de famille')
        wait(pg, 400)
        shoot(pg, 'papiers_6_infos')
        R['papiers_profil_affiche'] = 'Ce document sera associé à' in body(pg)
        vis(pg, 'scan-save').first.click() if has(pg, 'scan-save') else click_text(pg, 'Enregistrer en PDF', 0)
        wait(pg, 5000)
        shoot(pg, 'papiers_7_enregistre')
        R['papiers_enregistre'] = has(pg, 'scan-back-papers') or 'enregistré' in body(pg).lower()
        R['papiers_retour_papiers'] = has(pg, 'scan-back-papers')


# ------------------------------------------------------------------ ticket 5
def aura_open(pg, path='/assistant'):
    go(pg, path, 4500)


def aura_say(pg, text):
    box = vis(pg, 'aura-input').first
    box.click(); box.fill(text); wait(pg, 300)
    vis(pg, 'aura-send').first.click(); wait(pg, 2500)


def aura(pg):
    aura_open(pg)
    R['aura_ecran'] = has(pg, 'aura-screen')
    R['aura_porte_premium'] = has(pg, 'premium-gate')
    shoot(pg, 'aura_1_ouverture')
    R['aura_raison_sans_ia'] = sp(vis(pg, 'aura-local-reason').first.inner_text()) if has(pg, 'aura-local-reason') else None
    R['aura_saisie_bloquee_expliquee'] = sp(vis(pg, 'aura-blocked').first.inner_text()) if has(pg, 'aura-blocked') else None
    if has(pg, 'aura-blocked'):
        shoot(pg, 'aura_2_bloque_explique')
    if has(pg, 'aura-input') and vis(pg, 'aura-input').first.is_editable():
        aura_say(pg, 'Où noter sa sieste ?')
        wait_for(pg, 'aura-local-reply', 6000) or wait_for(pg, 'aura-reply', 6000)
        shoot(pg, 'aura_3_sieste')
        R['aura_reponse'] = has(pg, 'aura-local-reply') or has(pg, 'aura-reply') or has(pg, 'aura-error')
        R['aura_reponse_simulee_signalee'] = 'réponses simulées' in body(pg)
        opener = pg.locator('[data-testid^="aura-local-open-"], [data-testid^="aura-open-"]').filter(visible=True)
        R['aura_propose_outil'] = opener.evaluate_all('(els) => els.map((e) => e.getAttribute("data-testid"))')
        if opener.count():
            opener.first.scroll_into_view_if_needed(); opener.first.click(); wait(pg, 3500)
            R['aura_outil_ouvert_url'] = pg.url.replace(B, '')
            shoot(pg, 'aura_4_outil_ouvert')


def aura_breast(pg):
    aura_open(pg)
    if has(pg, 'aura-input') and vis(pg, 'aura-input').first.is_editable():
        aura_say(pg, 'Mon bébé prend le sein')
        opener = pg.locator('[data-testid^="aura-local-open-"], [data-testid^="aura-open-"]').filter(visible=True)
        R['aura_sein_outils'] = opener.evaluate_all('(els) => els.map((e) => e.getAttribute("data-testid"))')
        shoot(pg, 'aura_5_sein')


def aura_states(pg):
    """Démonstration : sans abonnement, sans accord, solde épuisé ; réglages (état réel de la voix)."""
    demo_state(pg, "s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== s.session.userId);")
    aura_open(pg)
    R['etat_sans_abonnement'] = sp(vis(pg, 'aura-blocked').first.inner_text()) if has(pg, 'aura-blocked') else (sp(vis(pg, 'aura-needs-sub').first.inner_text()) if has(pg, 'aura-needs-sub') else body(pg)[:200])
    shoot(pg, 'aura_6_sans_abonnement')
    demo_state(pg, SUB + "s.tables.consents = (s.tables.consents || []).filter(c => c.purpose !== 'ai_assistant');")
    aura_open(pg)
    R['etat_sans_accord'] = sp(vis(pg, 'aura-blocked').first.inner_text()) if has(pg, 'aura-blocked') else None
    shoot(pg, 'aura_7_sans_accord')
    if has(pg, 'aura-blocked-consent'):
        click(pg, 'aura-blocked-consent', 1200)
        R['feuille_accord'] = has(pg, 'aura-consent-sheet')
        shoot(pg, 'aura_8_feuille_accord')
        if has(pg, 'aura-consent-sheet-accept'):
            click(pg, 'aura-consent-sheet-accept', 1500)
    if has(pg, 'aura-input') and vis(pg, 'aura-input').first.is_editable():
        aura_say(pg, 'Aide-moi à organiser la semaine')
        wait_for(pg, 'aura-reply', 8000)
        R['reponse_simulee'] = 'réponses simulées' in body(pg)
        shoot(pg, 'aura_9_reponse_simulee')
    pg.keyboard.press('Escape'); wait(pg, 600)
    if has(pg, 'aura-settings'):
        vis(pg, 'aura-settings').first.click(force=True); wait(pg, 1200)
        R['voix_etat'] = sp(vis(pg, 'aura-voice-status').first.inner_text()) if has(pg, 'aura-voice-status') else None
        shoot(pg, 'aura_10_reglages_voix')
        pg.keyboard.press('Escape'); wait(pg, 600)


def understand(pg):
    go(pg, '/family/understand', 4000)
    R['comprendre_aura'] = has(pg, 'und-aura')
    if has(pg, 'und-aura'):
        scroll_to(pg, 'und-aura')
    shoot(pg, 'comprendre_1')
    if has(pg, 'und-aura-need'):
        click(pg, 'und-aura-need', 3500)
        R['comprendre_route'] = pg.url.replace(B, '')
        shoot(pg, 'comprendre_2_besoin')
        if has(pg, 'aura-ref-draft'):
            f = vis(pg, 'aura-ref-draft').first
            f.click(); f.fill('J’ai besoin de dormir une nuit complète cette semaine'); wait(pg, 300)
            if has(pg, 'aura-ref-go') and vis(pg, 'aura-ref-go').first.is_enabled():
                click(pg, 'aura-ref-go', 3500)
        if has(pg, 'aura-ref-option'):
            vis(pg, 'aura-ref-option').first.click(); wait(pg, 500)
            shoot(pg, 'comprendre_3_propositions')
            click(pg, 'aura-ref-use', 3000)
            R['comprendre_brouillon_url'] = pg.url.replace(B, '')
            shoot(pg, 'comprendre_4_brouillon')


def bottles(pg):
    kid = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const c = (s.tables.children || []).sort((a, b) => (a.birth_date < b.birth_date ? 1 : -1))[0]; return c ? c.id : null; }")
    if kid and os.environ.get('SEED_BOTTLES') == '1':
        # jeu d'essai : 4 jours de biberons (3 par jour) pour l'enfant le plus jeune, à partir d'une ligne existante
        demo_state(pg, """const kid = (s.tables.children || []).sort((a, b) => (a.birth_date < b.birth_date ? 1 : -1))[0];
          const base = (s.tables.bottles || []).find(b => b.child_id === kid.id) || { household_id: kid.household_id, created_by: s.session.userId, milk_type: null, note: null };
          s.tables.bottles = s.tables.bottles || [];
          for (let d = 0; d < 4; d++) for (const h of [7, 11, 15]) { const at = new Date(Date.now() - d * 86400000); at.setHours(h, 0, 0, 0);
            s.tables.bottles.push({ ...base, id: 'seed-' + d + '-' + h, child_id: kid.id, at: at.toISOString(), prepared_ml: 150, consumed_ml: 120 + h, planned_next_ml: null, created_at: at.toISOString() }); }""")
    go(pg, f'/bottle/history?child={kid}&view=week' if kid else '/bottle/history', 4500)
    R['biberons_analyse'] = has(pg, 'aura-analysis-bottle')
    if has(pg, 'aura-analysis-bottle'):
        scroll_to(pg, 'aura-analysis-bottle')
        R['biberons_periode'] = sp(vis(pg, 'aura-analysis-bottle-period').first.inner_text()) if has(pg, 'aura-analysis-bottle-period') else None
        R['biberons_insuffisant'] = sp(vis(pg, 'aura-analysis-bottle-empty').first.inner_text()) if has(pg, 'aura-analysis-bottle-empty') else None
    shoot(pg, 'biberons_1_analyse')
    tog = vis(pg, 'aura-analysis-bottle').locator('[role="switch"]') if has(pg, 'aura-analysis-bottle') else None
    if tog is not None and tog.count():
        tog.first.click(); wait(pg, 700)
        ai = pg.locator('[data-testid^="aura-analysis-bottle-ai"]').filter(visible=True)
        R['biberons_bouton_cout'] = sp(ai.first.inner_text()) if ai.count() else None
        btn = ai.locator('[role="button"]').filter(visible=True) if ai.count() else None
        if btn is not None and btn.count():
            btn.first.click(); wait(pg, 1500)
            shoot(pg, 'biberons_2_confirmation')
            conf = pg.get_by_role('button', name=re.compile(r'^Analyser \(')).filter(visible=True)
            if conf.count():
                conf.first.click(); wait(pg, 3500)
        wait_for(pg, 'aura-analysis-bottle-result', 6000)
        if has(pg, 'aura-analysis-bottle-result'):
            scroll_to(pg, 'aura-analysis-bottle-result')
        R['biberons_resultat_simule'] = has(pg, 'aura-analysis-bottle-simulated')
        shoot(pg, 'biberons_3_resultat')
    # outil de suivi déjà équipé : sommeil
    if kid:
        go(pg, f'/sleep/{kid}', 4500)
        if has(pg, 'aura-analysis-sleep'):
            scroll_to(pg, 'aura-analysis-sleep')
        R['sommeil_analyse'] = has(pg, 'aura-analysis-sleep')
        R['sommeil_periode'] = sp(vis(pg, 'aura-analysis-sleep-period').first.inner_text()) if has(pg, 'aura-analysis-sleep-period') else None
        shoot(pg, 'sommeil_1_analyse')
        tog = vis(pg, 'aura-analysis-sleep').locator('[role="switch"]')
        if tog.count():
            tog.first.click(); wait(pg, 600)
            ai = vis(pg, 'aura-analysis-sleep-ai')
            btn = ai.locator('[role="button"]') if ai.count() else None
            if btn is not None and btn.count():
                btn.first.click(); wait(pg, 1500)
                click_text(pg, 'Confirmer', 2500) or click_text(pg, 'Analyser', 2500)
            R['sommeil_resultat_simule'] = has(pg, 'aura-analysis-sleep-simulated')
            shoot(pg, 'sommeil_2_resultat')


def run():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EXE)
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris', device_scale_factor=2)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
        go(pg, '/welcome', 2500)
        click_text(pg, 'Découvrir sans compte', 2500)
        pg.evaluate("() => location.assign('/start/sample')"); wait(pg, 5000)
        demo_state(pg, SUB)
        go(pg, '/', 3000)
        mode = os.environ.get('STEPS', 'all')
        if mode in ('all', 'video'):
            step('papiers', papers, pg)
            step('aura', aura, pg)
        if mode == 'all':
            step('aura_sein', aura_breast, pg)
            step('comprendre', understand, pg)
            step('biberons', bottles, pg)
            step('aura_etats', aura_states, pg)
        b.close()
    R['erreurs_page'] = errs[:10]
    R['date'] = datetime.datetime.now().isoformat(timespec='seconds')
    out = os.path.join(SHOTS, f'{LABEL}_resultats.json')
    json.dump(R, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(R, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    run()
