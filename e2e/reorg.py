"""
Réorganisation par profil + « Éviter une grossesse » / « Projet bébé » (version web de démonstration, sans compte).
Tests demandés : accueil avec un nouveau-né, parcours grossesse, calendrier du cycle, rappels de vaccins (+ aide pour la nuit).
Démo de départ : Camille enceinte, Lina (bébé) et Noé (enfant).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/reorg.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from datetime import date, datetime, timedelta
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import SET_BODY, SIMPLE_OFF  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
SA = re.compile(r'\b\d{1,2}\s*SA\b')


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2300):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def subject(pg, key):
    go(pg, '/')
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(900)


JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']


def daylabel(d):
    return f'{JOURS[d.weekday()]} {d.day} {MOIS[d.month - 1]}'


def sexuality_articles():
    """(slug, titre) des articles « sexualité » de la bibliothèque (source : src/content/articles/library.ts)."""
    src = open(os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'articles', 'library.ts'), encoding='utf-8').read()
    out = []
    for block in re.split(r'\n  \{\n', src)[1:]:
        if re.search(r"category: 'sexualite'", block):
            out.append((re.search(r"slug: '([^']+)'", block).group(1), re.search(r"title: '((?:[^'\\]|\\.)*)'", block).group(1).replace("\\'", "'")))
    return out


def iso(d):
    return d.isoformat()


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    preg = demo(pg, "s => (s.tables.pregnancies.find(p => p.status === 'active') || {}).id")
    tomorrow = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat()
    in3 = (datetime.now() + timedelta(days=3)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat()

    # ================================================================ 1. Accueil avec un nouveau-né
    # Lina a 3 semaines ; un ancien rendez-vous de grossesse existe pour demain ; un rendez-vous pédiatre pour Lina dans 3 jours
    mutate(pg, f"""s => {{
      s.tables.children.find(c => c.id === '{lina}').birth_date = '{iso(date.today() - timedelta(days=21))}';
      const hid = s.tables.children.find(c => c.id === '{lina}').household_id;
      s.tables.appointments = (s.tables.appointments || []).filter(a => !String(a.id).startsWith('e2e-'));
      s.tables.appointments.push({{ id: 'e2e-echo', household_id: hid, pregnancy_id: '{preg}', child_id: null, for_parent: false, kind: 'ultrasound', title: 'Échographie du 3e trimestre', starts_at: '{tomorrow}', location_label: null, notes: null, questions: [], created_at: new Date().toISOString() }});
      s.tables.appointments.push({{ id: 'e2e-pedia', household_id: hid, pregnancy_id: null, child_id: '{lina}', for_parent: false, kind: 'pediatric', title: 'Pédiatre de Lina', starts_at: '{in3}', location_label: null, notes: null, questions: [], created_at: new Date().toISOString() }});
      const me = s.tables.profiles[0].id;
      s.tables.notifications = (s.tables.notifications || []).filter(n => !String(n.id).startsWith('e2e-'));
      s.tables.notifications.push({{ id: 'e2e-old', user_id: me, category: 'reminder', title: 'Test d’ovulation du jour', body: null, deep_link: '/fertility/log', payload: {{}}, read_at: null, created_at: new Date().toISOString() }});
    }}""")
    subject(pg, lina)
    pg.mouse.wheel(0, 2500); pg.wait_for_timeout(500)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/reorg_home_baby.png', full_page=True)
    R['1_accueil_bebe_pas_echographie_3e_trimestre'] = 'Échographie du 3e trimestre' not in t
    R['1_accueil_bebe_pas_de_SA'] = not SA.search(t)
    R['1_accueil_bebe_rendez_vous_pediatre'] = 'Pédiatre de Lina' in t
    R['1_accueil_raccourcis_et_tous_mes_outils'] = tid(pg, 'all-tools').is_visible()
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    R['1_selecteur_sans_post_partum_independant'] = 'Mon post-partum' not in T(pg)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    go(pg, '/notifications')
    R['1_ancienne_notification_masquee'] = 'Test d’ovulation du jour' not in T(pg)
    go(pg, '/tools', 2600)
    pg.mouse.wheel(0, 8000); pg.wait_for_timeout(500)
    t = T(pg)
    R['1_outils_essentiels_nouveau_ne'] = all(x in t for x in ['Aide pour la nuit', 'Vaccins'])
    R['1_categories_retirees'] = 'Journal et souvenirs' not in t and 'École ou mode de garde' not in t
    # le même rendez-vous de grossesse reste visible sur le profil de la grossesse
    subject(pg, 'preg')
    pg.mouse.wheel(0, 2500); pg.wait_for_timeout(500)
    R['1_echographie_visible_sur_profil_grossesse'] = 'Échographie du 3e trimestre' in T(pg)

    # ================================================================ 2. Parcours grossesse
    go(pg, '/tools', 2600)
    pg.mouse.wheel(0, 8000); pg.wait_for_timeout(500)
    t = T(pg)
    R['2_grossesse_outils_prevus'] = all(x in t for x in ['Sexualité pendant la grossesse', 'Articles et vidéos', 'Idées de prénoms'])
    # Les outils de Lina restent listés à part (« Outils des autres profils ») : rien de bébé dans la partie grossesse
    mine = t.split('Outils des autres profils')[0]
    R['2_grossesse_rien_de_bebe_ne'] = not any(x in mine for x in ['Biberon', 'Couches', 'Aide pour la nuit', 'Dents'])
    R['2_outils_des_autres_profils_separes'] = 'Pour Lina' in t.split('Outils des autres profils')[-1]
    go(pg, '/library?cat=sexualite', 3000)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(400)
    t = T(pg)
    sex = sexuality_articles()
    R['2_articles_sexualite_grossesse'] = len(sex) >= 5 and sum(1 for _, title in sex if title in t) >= 5 and 'À vérifier' in t
    slug = sex[0][0]
    go(pg, f'/article/{slug}', 2500)
    t = T(pg)
    R['2_article_statut_et_references'] = 'À vérifier' in tid(pg, 'article-status').inner_text() and 'Références' in t and 'consulté le' in t
    go(pg, '/library', 2500)
    pg.mouse.wheel(0, 30000); pg.wait_for_timeout(600)
    R['2_section_videos_honnete'] = tid(pg, 'videos-empty').is_visible() and 'validation par un professionnel qualifié' in T(pg)

    # ================================================================ 3. Calendrier du cycle (« Éviter une grossesse »)
    pg.evaluate(SET_BODY, ['avoid', False])
    subject(pg, 'me')
    t = T(pg)
    R['3_eviter_calendrier_depuis_accueil'] = 'Calendrier' in t
    R['3_eviter_pas_de_SA'] = not SA.search(t)
    mutate(pg, "s => { s.tables.period_entries = []; }")
    go(pg, '/cycle/calendar', 2600)
    d1 = date.today() - timedelta(days=4)
    lab = pg.locator(f'[aria-label^="{daylabel(d1)}"]').first
    lab.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-start').click(); pg.wait_for_timeout(1200)
    R['3_toucher_un_jour_debut_regles'] = demo(pg, f"s => s.tables.period_entries.some(p => p.start_date === '{iso(d1)}')")
    d2 = date.today() - timedelta(days=1)
    lab2 = pg.locator(f'[aria-label^="{daylabel(d2)}"]').first
    lab2.click(); pg.wait_for_timeout(700)
    R['3_jour_dans_les_regles_reconnu'] = tid(pg, 'cal-covering').is_visible()
    tid(pg, 'cal-act-end').click(); pg.wait_for_timeout(1200)
    R['3_fin_des_regles'] = demo(pg, f"s => s.tables.period_entries.some(p => p.start_date === '{iso(d1)}' && p.end_date === '{iso(d2)}')")
    # cycles précédents conservés avec leur durée, estimations approximatives
    mutate(pg, f"""s => {{ const me = s.tables.profiles[0].id;
      s.tables.period_entries.push({{ id: 'e2e-p1', user_id: me, start_date: '{iso(d1 - timedelta(days=29))}', end_date: '{iso(d1 - timedelta(days=25))}', flow: null, note: null, created_at: new Date().toISOString() }});
      s.tables.period_entries.push({{ id: 'e2e-p2', user_id: me, start_date: '{iso(d1 - timedelta(days=57))}', end_date: '{iso(d1 - timedelta(days=53))}', flow: null, note: null, created_at: new Date().toISOString() }}); }}""")
    go(pg, '/cycle/calendar', 2600)
    pg.mouse.wheel(0, 3000); pg.wait_for_timeout(500)
    hist = tid(pg, 'cal-history').inner_text()
    R['3_cycles_precedents_avec_duree'] = '29 jours' in hist and '28 jours' in hist
    est = tid(pg, 'cal-estimates').inner_text()
    R['3_estimations_approximatives'] = 'approximatives' in est and 'Période fertile estimée' in est
    R['3_jamais_sans_risque'] = tid(pg, 'cal-avoid-warning').is_visible() and 'Aucun jour n’est sans risque' in est
    pg.screenshot(path=f'{SHOTS}/reorg_calendar.png', full_page=True)
    # Supprimer une saisie (avec confirmation)
    lab2.click(); pg.wait_for_timeout(700)
    tid(pg, 'cal-act-delete').click(); pg.wait_for_timeout(600)
    pg.get_by_role('button', name='Supprimer', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(1200)
    R['3_supprimer_une_saisie'] = demo(pg, f"s => !s.tables.period_entries.some(p => p.start_date === '{iso(d1)}')")
    # Projet bébé : calendrier accessible, jamais de semaines de grossesse tant qu'aucune grossesse n'est créée
    pg.evaluate(SET_BODY, ['ttc', False])
    subject(pg, 'me')
    t = T(pg)
    R['3_projet_bebe_calendrier_accueil'] = 'Calendrier' in t and not SA.search(t)
    go(pg, '/tools', 2600)
    pg.mouse.wheel(0, 8000); pg.wait_for_timeout(500)
    t = T(pg)
    R['3_projet_bebe_outils'] = all(x in t for x in ['Calendrier du cycle', 'Glaire']) and 'Évolution' not in t
    pg.evaluate(SET_BODY, ['pregnancy', False])

    # ================================================================ 4. Rappels de vaccins
    mutate(pg, f"s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{iso(date.today() - timedelta(days=52))}'; s.tables.child_vaccinations = []; s.tables.reminders = (s.tables.reminders || []).filter(r => r.child_id !== '{lina}'); }}")
    go(pg, f'/child/{lina}/vaccines', 2800)
    t = T(pg)
    R['4_source_et_date_affichees'] = 'Calendrier des vaccinations 2026' in tid(pg, 'vaccine-source').inner_text() and 'juillet 2026' in t
    R['4_prochaines_echeances_2_mois'] = tid(pg, 'vaccine-next-2').is_visible() and 'obligatoire' in t
    R['4_jamais_en_retard'] = 'retard' not in t.replace('« en retard »', '')
    tid(pg, 'vaccine-remind-2').click(); pg.wait_for_timeout(1200)
    R['4_rappel_cree'] = demo(pg, f"s => s.tables.reminders.some(r => r.child_id === '{lina}' && r.deep_link === '/child/{lina}/vaccines')")
    tid(pg, 'vaccine-open-2').click(); pg.wait_for_timeout(700)
    tid(pg, 'vaccine-plan').click(); pg.wait_for_timeout(1500)
    appt = demo(pg, f"s => (s.tables.appointments.find(a => a.child_id === '{lina}' && a.kind === 'vaccination') || {{}}).id")
    R['4_rendez_vous_prevu'] = bool(appt)
    go(pg, f'/child/{lina}/vaccines', 2500)
    tid(pg, f'vaccine-questions-{appt}').click(); pg.wait_for_timeout(600)
    pg.get_by_text('Peut-on en faire plusieurs le même jour ?').first.click(); pg.wait_for_timeout(300)
    tid(pg, 'vaccine-questions-save').click(); pg.wait_for_timeout(1000)
    R['4_questions_preparees'] = demo(pg, f"s => s.tables.appointments.find(a => a.id === '{appt}').questions.length === 1")
    tid(pg, f'vaccine-complete-{appt}').click(); pg.wait_for_timeout(600)
    pg.get_by_role('button', name='Rendez-vous fait', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(1500)
    R['4_rendez_vous_marque_fait'] = demo(pg, f"s => !!s.tables.appointments.find(a => a.id === '{appt}').completed_at")
    R['4_vaccins_notes_saisie_parent'] = demo(pg, f"s => s.tables.child_vaccinations.filter(v => v.child_id === '{lina}' && v.source === 'parent' && v.calendar_key).length >= 2")
    pg.mouse.wheel(0, 4000); pg.wait_for_timeout(400)
    R['4_registre_affiche'] = 'Noté par le parent' in T(pg)
    pg.screenshot(path=f'{SHOTS}/reorg_vaccines.png', full_page=True)

    # ================================================================ 5. Aide pour la nuit
    subject(pg, lina)
    go(pg, f'/night/help?child={lina}', 2600)
    t = T(pg)
    R['5_aide_nuit_resume'] = tid(pg, 'night-summary').is_visible()
    R['5_aide_nuit_reperes_age'] = tid(pg, 'night-advice').is_visible()
    R['5_aide_nuit_statut_a_verifier'] = 'À vérifier' in tid(pg, 'night-status').inner_text()
    R['5_aide_nuit_sans_promesse'] = not re.search(r'fera ses nuits|votre faute', t, re.I)
    pg.screenshot(path=f'{SHOTS}/reorg_night.png', full_page=True)

    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'erreurs': errs[:10]}, ensure_ascii=False, indent=1))
print('OK' if all(R.values()) and not errs else 'ÉCHEC', sum(R.values()), '/', len(R))
