"""
Planificateur de sommeil de bout en bout (web de démonstration, horloge fixée) :
enregistrement en deux grands boutons, heure modifiée, planning recalculé après modification et suppression,
estimations Premium et textes exacts, avis « trop tard » qui décale l'estimation, profil, notifications (choix,
délai, jours, plage silencieuse, arrêt complet), jumeaux séparés, tendances, sécurité sourcée, fiche pour un
professionnel, « Aide pour cette nuit » en bleu nuit, accueil réduit à l'essentiel.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/sommeil.py
"""
import json, os, re, sys
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TODAY = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def go(pg, path, wait=2500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def at(h, m=0, day=0):
    """ISO local → UTC de l'heure h:m du jour (day = décalage en jours)."""
    return (TODAY + timedelta(days=day, hours=h, minutes=m)).astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def text(pg, t):
    return tid(pg, t).inner_text() if has(pg, t) else ''


def mins(s):
    m = re.search(r'(\d{1,2}) h(?: (\d\d))?$', s or '')
    return int(m.group(1)) * 60 + int(m.group(2) or 0) if m else None


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id=os.environ.get('TZ_E2E', 'Europe/Paris'))
    pg = ctx.new_page()
    # Horloge fixée à 11 h 00 aujourd'hui (le planning dépend de l'heure)
    pg.clock.install(time=TODAY + timedelta(hours=11))
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    birth = (TODAY - timedelta(days=190)).date().isoformat()  # ≈ 6 mois
    # Lina : profil effacé, relevés remplacés par une journée maîtrisée ; un « jumeau » (Malo) avec ses propres relevés
    mutate(pg, f"""s => {{ const c = s.tables.children.find(c => c.id === '{lina}'); c.birth_date = '{birth}'; c.sex = 'female';
      if (!c.enabled_tracking.includes('sleep')) c.enabled_tracking.push('sleep');
      s.tables.sleep_profiles = []; s.tables.sleep_feedback = []; s.tables.subscriptions = [];
      s.tables.sleeps = [
        {{ id: 'n0', child_id: '{lina}', household_id: '{hid}', kind: 'night', started_at: '{at(19, 30, -1)}', ended_at: '{at(7)}', wakeups: 1, wake_events: [{{ at: '{at(2, 10)}', back_at: '{at(2, 30)}', minutes: 20 }}] }},
        {{ id: 'z1', child_id: '{lina}', household_id: '{hid}', kind: 'nap', started_at: '{at(9)}', ended_at: '{at(10)}', wakeups: 0, wake_events: [] }},
      ];
      s.tables.children.push({{ id: 'e2e-malo', household_id: '{hid}', first_name: 'Malo', birth_date: '{birth}', sex: 'male', photo_path: null, from_pregnancy_id: null, multiple_group: null, enabled_tracking: ['sleep', 'bottle', 'diaper'], allergies_declared: [], habits: null, archived: false, created_at: new Date().toISOString() }});
      const me = s.tables.user_journeys.find(j => j.child_id === '{lina}').user_id;
      s.tables.user_journeys.push({{ id: 'e2e-j-malo', user_id: me, status: 'active', ended_on: null, end_reason: null, pregnancy_id: null, child_id: 'e2e-malo', household_id: '{hid}', type: 'baby', started_on: '{birth}', created_at: new Date().toISOString() }});
      s.tables.sleeps.push({{ id: 'm1', child_id: 'e2e-malo', household_id: '{hid}', kind: 'nap', started_at: '{at(10, 30)}', ended_at: null, wakeups: 0, wake_events: [] }});
    }}""")

    # ================================================================ Gratuit : état, grands boutons, planning réalisé
    go(pg, f'/sleep/{lina}', 3200)
    R['etat_eveillee_depuis'] = text(pg, 'sleep-state') == 'Éveillée depuis 1 h'
    R['grand_bouton_s_endort'] = 'Mon enfant s’endort' in text(pg, 'sleep-record')
    R['gratuit_estimations_en_apercu'] = has(pg, 'premium-sleep_insights') and not has(pg, 'sleep-next')
    tl = text(pg, 'sleep-timeline')
    R['planning_realise_gratuit'] = 'Nuit' in tl and 'Sieste' in tl and 'Éveil en cours' in tl and '(estimation)' not in tl and 'Sommeil de jour : 1 h · 1 sieste(s)' in tl
    pg.screenshot(path=f'{SHOTS}/sommeil_gratuit.png', full_page=True)

    # ================================================================ Premium : estimations, textes exacts
    mutate(pg, """s => { const me = s.session.userId; s.tables.subscriptions = [{ user_id: me, status: 'active', product_id: 'toietmoi_premium_annual', store: 'test', period_type: 'annual', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true }]; }""")
    go(pg, f'/sleep/{lina}', 3200)
    nap0, routine0, bed0 = text(pg, 'sleep-line-nap'), text(pg, 'sleep-line-routine'), text(pg, 'sleep-line-bedtime')
    R['texte_prochaine_sieste'] = bool(re.fullmatch(r'Prochaine sieste estimée autour de \d{1,2} h( \d\d)?', nap0))
    R['texte_routine'] = bool(re.fullmatch(r'Commencez tranquillement la routine vers \d{1,2} h( \d\d)?', routine0))
    R['texte_coucher_fourchette'] = bool(re.fullmatch(r'Coucher du soir estimé entre \d{1,2} h( \d\d)? et \d{1,2} h( \d\d)?', bed0))
    R['estimations_pas_obligations'] = 'pas des obligations' in text(pg, 'sleep-basis') and 'approximatifs' in text(pg, 'sleep-basis') or 'ajustés' in text(pg, 'sleep-basis')
    tl = text(pg, 'sleep-timeline')
    R['planning_visuel_complet'] = all(x in tl for x in ['Sieste estimée (estimation)', 'Routine du soir (estimation)', 'Coucher estimé (estimation)'])
    R['aucune_obligation_ni_promesse'] = not re.search(r'doit absolument|il faut qu|fera ses nuits|(?<!ne )garanti', T(pg), re.I)
    pg.screenshot(path=f'{SHOTS}/sommeil_premium.png', full_page=True)

    # ================================================================ Modification d'une sieste → recalcul ; suppression → recalcul
    tid(pg, 'sleep-item-nap').click(); pg.wait_for_timeout(700)
    tid(pg, 'sleep-edit-start').fill('09:30'); tid(pg, 'sleep-edit-end').fill('10:30')
    tid(pg, 'sleep-edit-save').click(); pg.wait_for_timeout(1500)
    nap1 = text(pg, 'sleep-line-nap')
    R['sieste_modifiee_planning_recalcule'] = demo(pg, "s => s.tables.sleeps.find(x => x.id === 'z1').started_at") == at(9, 30) and mins(nap1) == mins(nap0) + 30
    R['etat_recalcule_apres_modif'] = text(pg, 'sleep-state') == 'Éveillée depuis 30 min'
    tid(pg, 'sleep-item-nap').click(); pg.wait_for_timeout(700)
    pg.once('dialog', lambda d: d.accept())
    tid(pg, 'sleep-edit-delete').click(); pg.wait_for_timeout(900)
    if has(pg, 'confirm-ok'):
        tid(pg, 'confirm-ok').click(); pg.wait_for_timeout(1200)
    else:
        btn = pg.get_by_role('button', name='Supprimer').filter(visible=True)
        if btn.count(): btn.last.click(); pg.wait_for_timeout(1200)
    R['sieste_supprimee'] = demo(pg, "s => s.tables.sleeps.filter(x => x.id === 'z1').length") == 0
    nap2 = text(pg, 'sleep-line-nap')
    R['suppression_aucune_heure_incoherente'] = text(pg, 'sleep-state') == 'Éveillée depuis 4 h' and ('est passée' in nap2)

    # ================================================================ Enregistrer avec une autre heure (oubli)
    tid(pg, 'sleep-other-time').click(); pg.wait_for_timeout(700)
    tid(pg, 'sleep-time-input').fill('10:45'); tid(pg, 'sleep-time-save').click(); pg.wait_for_timeout(1500)
    started = demo(pg, f"s => (s.tables.sleeps.find(x => x.child_id === '{lina}' && !x.ended_at) || {{}}).started_at")
    R['heure_modifiee_endormissement'] = bool(started) and datetime.fromisoformat(started.replace('Z', '+00:00')).astimezone().strftime('%H:%M') == '10:45'
    R['etat_endormie'] = text(pg, 'sleep-state').startswith('Endormie depuis 15 min')
    R['grand_bouton_se_reveille'] = 'Mon enfant se réveille' in text(pg, 'sleep-record')
    R['reveil_de_sieste_estime'] = 'Réveil de sieste estimé vers' in T(pg)
    tid(pg, 'sleep-awake').click(); pg.wait_for_timeout(1500)
    R['reveil_enregistre_un_appui'] = text(pg, 'sleep-state') == 'Éveillée depuis 0 min' and demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length") == 0

    # ================================================================ Avis « trop tard » → estimation suivante plus tôt
    R['avis_propose'] = has(pg, 'sleep-feedback') and 'Cette estimation était juste' in text(pg, 'sleep-feedback')
    nap_before = text(pg, 'sleep-line-nap')
    if has(pg, 'sleep-feedback'):
        pg.get_by_text('Trop tard', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(1500)
    R['avis_enregistre'] = demo(pg, "s => s.tables.sleep_feedback.map(f => f.verdict)") == ['late']
    nap_after = text(pg, 'sleep-line-nap')
    R['avis_ameliore_estimation'] = mins(nap_before) is not None and mins(nap_after) == mins(nap_before) - 10

    # ================================================================ Profil : enregistré, estimations recalculées
    go(pg, f'/sleep/{lina}?tab=profile', 2800)
    tid(pg, 'profile-wake').fill('07:00'); tid(pg, 'profile-bedtime').fill('20:30')
    pg.get_by_label('2 sieste(s)').filter(visible=True).first.click()
    pg.get_by_text('Réveils fréquents', exact=True).filter(visible=True).first.click()
    tid(pg, 'profile-save').click(); pg.wait_for_timeout(1500)
    prof = demo(pg, f"s => s.tables.sleep_profiles.find(p => p.child_id === '{lina}')")
    R['profil_enregistre'] = bool(prof) and prof['usual_bedtime'] == '20:30' and prof['nap_count'] == 2 and prof['difficulties'] == ['night_wakings']
    R['profil_seulement_pour_lina'] = demo(pg, "s => s.tables.sleep_profiles.filter(p => p.child_id === 'e2e-malo').length") == 0
    go(pg, f'/sleep/{lina}', 2800)
    R['profil_change_le_coucher'] = text(pg, 'sleep-line-bedtime') != bed0
    R['difficulte_propose_fiche_pro'] = has(pg, 'sleep-pro-link')

    # ================================================================ Notifications : choix, délai, jours, plage silencieuse, arrêt
    go(pg, f'/sleep/{lina}?tab=alerts', 2800)
    pg.get_by_role('switch', name='Recevoir les notifications de sommeil').filter(visible=True).first.click(); pg.wait_for_timeout(300)
    pg.get_by_text('30 min', exact=True).filter(visible=True).first.click()
    tid(pg, 'notify-quiet-from').fill('21:00'); tid(pg, 'notify-quiet-to').fill('07:30')
    tid(pg, 'notify-save').click(); pg.wait_for_timeout(1500)
    n = demo(pg, f"s => s.tables.sleep_profiles.find(p => p.child_id === '{lina}').notify")
    R['notifications_reglages_enregistres'] = n.get('enabled') is True and n.get('lead') == 30 and n.get('quiet_from') == '21:00' and len(n.get('days', [])) == 7
    prev = text(pg, 'notify-preview')
    R['notifications_textes'] = 'Lina est éveillée depuis' in prev and 'Vous pouvez commencer à observer ses signes de fatigue.' in prev and 'La prochaine sieste de Lina est estimée autour de' in prev and 'La routine du soir peut commencer dans 30 minutes.' in prev
    R['notifications_sans_culpabilisation'] = not re.search(r'doit|absolument|il faut', prev, re.I)
    R['notifications_web_honnete'] = 'Sur le web, les notifications ne s’affichent pas' in prev
    pg.get_by_role('switch', name='Routine du soir').filter(visible=True).first.click(); pg.wait_for_timeout(400)
    R['choix_des_notifications'] = 'La routine du soir peut commencer' not in text(pg, 'notify-preview')
    tid(pg, 'notify-stop').click(); pg.wait_for_timeout(1500)
    R['arret_complet'] = demo(pg, f"s => s.tables.sleep_profiles.find(p => p.child_id === '{lina}').notify.enabled") is False
    pg.screenshot(path=f'{SHOTS}/sommeil_notifications.png', full_page=True)

    # ================================================================ Jumeaux : Malo n'est pas mélangé
    go(pg, '/sleep/e2e-malo', 2800)
    R['jumeau_etat_propre'] = bool(re.fullmatch(r'Endormi depuis 3\d min \(sieste\)', text(pg, 'sleep-state')))
    R['jumeau_sans_avis_ni_profil_de_lina'] = not has(pg, 'sleep-feedback') and demo(pg, "s => s.tables.sleep_feedback.filter(f => f.child_id === 'e2e-malo').length") == 0

    # ================================================================ Tendances
    go(pg, f'/sleep/{lina}?tab=trends', 2800)
    R['resume_nuit'] = 'Coucher 19 h 30 · réveil 7 h' in text(pg, 'sleep-night-summary') and '1 réveil(s)' in text(pg, 'sleep-night-summary')
    R['resume_jour'] = 'sieste(s)' in text(pg, 'sleep-day-summary')
    R['moyennes_7_jours'] = all(x in text(pg, 'sleep-rhythm') for x in ['Coucher moyen', 'Réveil moyen', 'Siestes', 'réveils'])
    R['vue_7_jours'] = has(pg, 'sleep-weekly') and has(pg, 'sleep-changes')
    R['assistant_explique_sans_diagnostic'] = has(pg, 'sleep-ask') and 'sans poser de diagnostic' in T(pg)

    # ================================================================ Sécurité (gratuite, sourcée, datée) et fiche professionnel
    mutate(pg, "s => { s.tables.subscriptions = []; }")
    go(pg, f'/sleep/{lina}?tab=safety', 2800)
    safe = text(pg, 'safe-sleep')
    R['securite_gratuite_sources_datees'] = 'sur le dos' in safe and 'Santé.fr' in safe and 'publié le 05/12/2024' in safe and 'consulté le' in safe
    tid(pg, 'pro-sheet-make').click(); pg.wait_for_timeout(800)
    sheet = text(pg, 'pro-sheet-text')
    R['fiche_professionnel'] = 'Réveils fréquents' in sheet and 'pas un diagnostic' in sheet
    pg.screenshot(path=f'{SHOTS}/sommeil_securite.png', full_page=True)

    # ================================================================ Aide pour cette nuit (nuit, bleu foncé, grands boutons)
    mutate(pg, f"""s => {{ s.tables.sleeps = s.tables.sleeps.filter(x => x.child_id !== '{lina}' || x.id === 'n0');
      s.tables.sleeps.push({{ id: 'n1', child_id: '{lina}', household_id: '{hid}', kind: 'night', started_at: '{at(19, 45)}', ended_at: null, wakeups: 1, wake_events: [{{ at: '{at(23, 10)}', back_at: '{at(23, 30)}', minutes: 20 }}] }});
      s.tables.bottles.push({{ id: 'b-n', child_id: '{lina}', household_id: '{hid}', at: '{at(23, 15)}', prepared_ml: 150, consumed_ml: 120, created_at: new Date().toISOString() }}); }}""")
    pg.clock.set_system_time(TODAY + timedelta(hours=23, minutes=50))
    go(pg, f'/sleep/tonight?child={lina}', 3000)
    bg = pg.evaluate("() => getComputedStyle(document.querySelector('[data-testid=\"tonight\"]')).backgroundColor")
    R['nuit_bleu_fonce'] = bg == 'rgb(7, 11, 28)'
    R['nuit_dernier_reveil'] = text(pg, 'tonight-last-wake').endswith('23 h 10')
    R['nuit_dernier_repas'] = text(pg, 'tonight-last-feed').endswith('23 h 15')
    R['nuit_sommeil_precedent'] = text(pg, 'tonight-previous').endswith('3 h 25')
    R['nuit_reveils'] = text(pg, 'tonight-wakings').endswith('1')
    R['nuit_sans_son'] = pg.locator('audio').count() == 0 and 'Aucun son' in T(pg)
    box = tid(pg, 'sleep-night-waking').bounding_box()
    R['nuit_grands_boutons_bas'] = bool(box) and box['height'] >= 70 and box['width'] >= 150
    tid(pg, 'sleep-night-waking').click(); pg.wait_for_timeout(1200)
    R['nuit_reveil_note'] = 'Réveil de nuit depuis' in text(pg, 'tonight-state') and has(pg, 'sleep-back')
    tid(pg, 'sleep-back').click(); pg.wait_for_timeout(1200)
    R['nuit_rendormi'] = 'Endormie depuis 19 h 45' in text(pg, 'tonight-state') and demo(pg, "s => s.tables.sleeps.find(x => x.id === 'n1').wake_events.length") == 2
    pg.screenshot(path=f'{SHOTS}/sommeil_nuit.png', full_page=True)

    # ================================================================ Accueil : seulement l'essentiel
    go(pg, '/', 3000)
    pg.locator('[data-testid="profile-switcher"]').filter(visible=True).first.click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{lina}').click(); pg.wait_for_timeout(1500)
    R['accueil_carte_sommeil'] = has(pg, 'sleep-now') and 'Endormie depuis' in text(pg, 'sleep-now-state') and has(pg, 'sleep-record') and has(pg, 'sleep-open')
    R['accueil_pas_de_detail'] = not has(pg, 'sleep-timeline') and not has(pg, 'sleep-rhythm')
    R['accueil_lien_aide_nuit'] = has(pg, 'sleep-now-tonight')
    pg.screenshot(path=f'{SHOTS}/sommeil_accueil.png')
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001 — le rapport est affiché quoi qu'il arrive
        errs.append('SCRIPT ' + str(e).splitlines()[0][:200])
ok = sum(1 for v in R.values() if v)
print(json.dumps(R, ensure_ascii=False, indent=1))
print('erreurs:', errs[:8])
print(f'sommeil: OK {ok} / {len(R)} false={len(R) - ok} err={len(errs)}')
sys.exit(0 if ok == len(R) and not errs else 1)
