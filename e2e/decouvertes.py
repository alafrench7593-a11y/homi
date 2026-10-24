"""
« Ses découvertes », « Je grandis », « Sorties près de chez moi », version web de démonstration, sans compte.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/decouvertes.py
Les services publics de cartes (géocodage, OpenStreetMap, tuiles) sont SIMULÉS ici par interception réseau
(réponses au format documenté, lieux marqués « (test) ») : ce scénario ne prouve pas que les vrais services
répondent, seulement que l'application les interroge et affiche correctement leurs réponses.
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import base64, json, os, re, sys
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def T(pg):
    return pg.inner_text('body')


def go(pg, path, wait=2800):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    sent = []

    def geo(route):
        sent.append(route.request.url)
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [4.8357, 45.7640]}, 'properties': {'label': 'Lyon', 'city': 'Lyon', 'postcode': '69001'}}]}))

    def overpass(route):
        sent.append(route.request.url + ' ' + (route.request.post_data or ''))
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'elements': [
            {'type': 'node', 'id': 101, 'lat': 45.7650, 'lon': 4.8362, 'tags': {'amenity': 'library', 'name': 'Bibliothèque (test)', 'opening_hours': 'Tu-Sa 10:00-18:00', 'wheelchair': 'yes'}},
            {'type': 'way', 'id': 102, 'center': {'lat': 45.7700, 'lon': 4.8450}, 'tags': {'leisure': 'park', 'name': 'Parc (test)'}},
        ]}))
    pg.route(re.compile(r'https://data\.geopf\.fr/.*'), geo)
    pg.route(re.compile(r'https://overpass-api\.de/.*'), overpass)
    pg.route(re.compile(r'https://tile\.openstreetmap\.org/.*'), lambda route: route.fulfill(status=200, content_type='image/png', body=PNG))

    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    birth = (date.today() - timedelta(days=245)).isoformat()
    mutate(pg, f"""s => {{ s.tables.children.find(c => c.id === '{lina}').birth_date = '{birth}';
      s.tables.food_introductions = (s.tables.food_introductions || []).filter(f => f.child_id !== '{lina}' && f.child_id !== '{noe}');
      s.tables.food_introductions.push({{ id: 'e2e-noe-carrot', household_id: '{hid}', child_id: '{noe}', food_key: 'carrot', food_name: 'Carotte', status: 'refused', first_tried_on: '{date.today().isoformat()}', reaction: false, favorite: false }});
      s.tables.food_tastings = []; s.tables.child_steps = []; }}""")

    # ===================================== Ses découvertes
    go(pg, f'/child/{lina}/discoveries', 3500)
    pg.screenshot(path=f'{SHOTS}/decouvertes_haut.png')
    t = T(pg)
    R['dc_titre'] = 'Ses découvertes' in t and 'Les découvertes de Lina' in t
    R['dc_mosaique'] = has(pg, 'dc-mosaic') and has(pg, 'dc-food-carrot')
    R['dc_lina_sans_donnees_de_noe'] = tid(pg, 'dc-state-carrot').inner_text() == 'À découvrir'
    tid(pg, 'dc-food-carrot').click(); pg.wait_for_timeout(800)
    R['dc_formulation_a_decouvrir'] = 'À découvrir lorsque son âge et sa situation le permettent' in T(pg)
    tid(pg, 'dc-status-liked').click(); tid(pg, 'dc-texture-smooth').click(); tid(pg, 'dc-prep-steamed').click()
    tid(pg, 'dc-note').fill('Grand sourire')
    tid(pg, 'dc-save').click(); pg.wait_for_timeout(500)
    R['dc_animation_decouverte'] = has(pg, 'dc-celebrate')
    pg.wait_for_timeout(1800)
    R['dc_fiche_enregistree'] = demo(pg, f"s => s.tables.food_introductions.some(f => f.child_id === '{lina}' && f.food_key === 'carrot' && f.status === 'liked' && f.texture === 'smooth' && f.preparation === 'steamed' && f.note === 'Grand sourire')")
    R['dc_historique'] = demo(pg, f"s => s.tables.food_tastings.filter(x => x.child_id === '{lina}').length === 1")
    R['dc_noe_inchange'] = demo(pg, f"s => s.tables.food_introductions.find(f => f.child_id === '{noe}' && f.food_key === 'carrot').status === 'refused'")
    R['dc_deja_decouvert'] = tid(pg, 'dc-state-carrot').inner_text() == 'Déjà découvert'
    R['dc_progression_sans_competition'] = 'Lina a découvert 1 légume' in T(pg) and not re.search(r'retard|\d+ sur \d+', T(pg))
    R['dc_cette_semaine'] = has(pg, 'dc-week')
    tid(pg, 'dc-search').fill('lentil'); pg.wait_for_timeout(400)
    R['dc_recherche'] = has(pg, 'dc-food-red_lentils') and not has(pg, 'dc-food-carrot')
    tid(pg, 'dc-search').fill(''); pg.wait_for_timeout(300)
    tid(pg, 'dc-cat-fruit').click(); pg.wait_for_timeout(300)
    R['dc_filtre_categorie'] = has(pg, 'dc-food-pear') and not has(pg, 'dc-food-carrot')
    tid(pg, 'dc-cat-all').click(); pg.wait_for_timeout(300)
    # réaction importante
    tid(pg, 'dc-react').click(); pg.wait_for_timeout(700)
    tid(pg, 'dc-sign-swelling').click(); pg.wait_for_timeout(300)
    R['dc_reaction_urgence'] = has(pg, 'dc-rx-emergency') and 'Appelez le 15 ou le 112 maintenant' in T(pg) and 'L’application ne diagnostique jamais une allergie.' in T(pg)
    tid(pg, 'dc-rx-food-carrot').click(); tid(pg, 'dc-rx-save').click(); pg.wait_for_timeout(1000)
    R['dc_reaction_notee'] = demo(pg, f"s => s.tables.food_introductions.find(f => f.child_id === '{lina}' && f.food_key === 'carrot').reaction === true")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    go(pg, f'/child/{lina}/discoveries', 3000)
    pg.mouse.wheel(0, 2600); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/decouvertes_mosaique.png')
    R['dc_allergenes'] = has(pg, 'dc-allergens') and 'Santé publique France' in T(pg)
    R['dc_sources'] = 'ameli.fr' in T(pg) and 'ANSES' in T(pg)

    # ===================================== Je grandis
    go(pg, f'/child/{lina}/grow', 3200)
    t = T(pg)
    pg.screenshot(path=f'{SHOTS}/je_grandis.png')
    R['gr_rythme'] = 'Chaque enfant évolue à son propre rythme' in t and 'Les découvertes de Lina' in t
    R['gr_sans_jugement'] = not re.search(r'en retard|échec|\d+ sur \d+', t)
    tid(pg, 'gr-step-sits_alone').click(); pg.wait_for_timeout(700)
    R['gr_fiche'] = all(x in T(pg) for x in ['En quelques mots', 'Sécurité', 'Une question à préparer pour un rendez-vous'])
    tid(pg, 'gr-st-observed').click(); tid(pg, 'gr-note').fill('Tout seul'); tid(pg, 'gr-ask').click()
    tid(pg, 'gr-save').click(); pg.wait_for_timeout(1000)
    R['gr_etape_enregistree'] = demo(pg, f"s => s.tables.child_steps.some(x => x.child_id === '{lina}' && x.step_key === 'sits_alone' && x.status === 'observed')")
    R['gr_recent'] = has(pg, 'gr-recent')
    tid(pg, 'gr-summary').click(); pg.wait_for_timeout(700)
    R['gr_resume_factuel'] = 'notes du parent' in T(pg) and 'ne pose aucun diagnostic' in T(pg)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    R['gr_noe_separe'] = demo(pg, f"s => !s.tables.child_steps.some(x => x.child_id === '{noe}')")

    # ===================================== Accueil de l'enfant : deux raccourcis résumés
    mutate_ui = "() => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{\"state\":{},\"version\":0}'); ui.state.subject = { type: 'child', id: 'LINA' }; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }"
    pg.evaluate(mutate_ui.replace('LINA', lina))
    go(pg, '/', 3800)
    R['accueil_raccourcis'] = has(pg, 'cs-discoveries') and has(pg, 'cs-grow')
    R['accueil_resume'] = 'Dernière découverte : Carotte' in text_of(pg, 'cs-discoveries') and 'Tient assis sans appui' in text_of(pg, 'cs-grow')
    tid(pg, 'cs-grow').click(); pg.wait_for_timeout(2000)
    R['accueil_ouvre_je_grandis'] = '/grow' in pg.url

    # ===================================== Sorties près de chez moi (lieux Google Places, fond de carte Google)
    # La démonstration n'a ni clé Google ni serveur : l'application doit le dire, sans jamais montrer de faux lieux.
    go(pg, '/nearby', 3500)
    R['out_ancien_lien_redirige'] = '/outings' in pg.url
    t = T(pg)
    R['out_titre'] = 'Sorties près de chez moi' in t
    R['out_aucune_rencontre'] = not re.search(r'rencontre|Je participe|Proposer une rencontre', t, re.I)
    R['out_types_prioritaires'] = all(has(pg, f'out-cat-{c}') for c in ['all', 'cafes', 'restaurants', 'parks', 'activities']) and has(pg, 'out-cat-support') and has(pg, 'out-kids-space')
    R['out_sans_filtre_equipements'] = not has(pg, 'out-equip-highchair') and 'Table à langer' not in t
    tid(pg, 'out-town').fill('8 bis allée des Tilleuls'); tid(pg, 'out-search').click(); pg.wait_for_timeout(800)
    R['out_jamais_adresse_perso'] = not any('Tilleuls' in s for s in sent)
    tid(pg, 'out-town').fill('Lyon'); tid(pg, 'out-search').click(); pg.wait_for_timeout(1500)
    tid(pg, 'out-townpick-69001').click(); pg.wait_for_timeout(2500)
    t = T(pg)
    R['out_etat_honnete_sans_cle'] = 'La recherche de lieux n’est pas encore disponible.' in t and has(pg, 'out-retry')
    R['out_aucun_faux_lieu'] = pg.locator('[data-testid^="out-place-"]').count() == 0 and pg.locator('[data-testid^="out-marker-"]').count() == 0
    pg.screenshot(path=f'{SHOTS}/sorties_sans_cle.png', full_page=True)
    tid(pg, 'out-cat-support').click(); pg.wait_for_timeout(800)
    R['out_filtre_secondaire_pmi'] = has(pg, 'out-directories') and 'monenfant.fr' in T(pg)
    # accueil : la carte est sur la page d'accueil, avec la même honnêteté
    pg.evaluate("() => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{\"state\":{},\"version\":0}'); ui.state.subject = { type: 'me' }; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }")
    go(pg, '/', 3500)
    R['out_carte_sur_accueil'] = has(pg, 'home-outings') and 'Sorties près de chez moi' in T(pg)
    R['out_accueil_etat_honnete'] = has(pg, 'home-outings-state') or has(pg, 'out-map-unavailable')
    pg.screenshot(path=f'{SHOTS}/accueil_sorties.png', full_page=True)
    go(pg, '/community', 3000)
    R['out_communaute'] = has(pg, 'community-outings') and 'Sorties près de chez moi' in T(pg)

    # ===================================== M'aider pour les nuits (accueil du bébé, page, nuit difficile)
    mutate_ui = "() => { const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{\"state\":{},\"version\":0}'); ui.state.subject = { type: 'child', id: 'LINA' }; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }"
    pg.evaluate(mutate_ui.replace('LINA', lina))
    go(pg, '/', 4000)
    R['nuits_carte_accueil_bebe'] = has(pg, 'nights-help-card') and 'M’aider pour les nuits' in T(pg)
    pg.screenshot(path=f'{SHOTS}/accueil_nuits.png', full_page=True)
    go(pg, f'/sleep/help/{lina}', 3500)
    t = T(pg)
    R['nuits_page'] = has(pg, 'nh-review') and has(pg, 'nh-safe') and has(pg, 'nh-routine') and 'Couchage sécuritaire' in t
    R['nuits_acces_ia_et_nuit_difficile'] = has(pg, 'nh-ai') and has(pg, 'nh-difficult')
    pg.screenshot(path=f'{SHOTS}/maider_nuits.png', full_page=True)
    go(pg, f'/sleep/difficult/{lina}', 3000)
    R['nuit_difficile_signes_dabord'] = has(pg, 'difficult-night') and 'D’abord : l’un de ces signes ?' in T(pg)
    tid(pg, 'dn-obs-parent_exhausted').click(); tid(pg, 'dn-next').click(); pg.wait_for_timeout(400); tid(pg, 'dn-next').click(); pg.wait_for_timeout(400)
    R['nuit_difficile_pistes_douces'] = 'D’abord vous' in T(pg) and not re.search(r'laissez[- ]le pleurer', T(pg), re.I)
    go(pg, f'/assistant/chat?topic=sleep&child={lina}', 3500)
    t = T(pg)
    R['ia_sommeil_identifiee'] = 'Assistant sommeil · IA' in t or 'intelligence artificielle' in t

    # ===================================== sommeil : rappel « vérifier » seulement à la demande
    mutate(pg, f"""s => {{ s.tables.sleeps = (s.tables.sleeps || []).filter(x => x.child_id !== '{lina}');
      s.tables.sleeps.push({{ id: 'e2e-nap', household_id: '{hid}', child_id: '{lina}', started_at: new Date(Date.now() - 20*60000).toISOString(), ended_at: null, kind: 'nap', wakeups: 0 }});
      s.tables.reminders = (s.tables.reminders || []).filter(r => !(r.deep_link || '').includes('check=1')); }}""")
    go(pg, f'/sleep/{lina}', 3500)
    R['sommeil_aucun_rappel_par_defaut'] = demo(pg, f"s => !s.tables.reminders.some(r => r.deep_link === '/sleep/{lina}?check=1')")
    if has(pg, 'wake-check-45'):
        tid(pg, 'wake-check-45').click(); pg.wait_for_timeout(1200)
        tid(pg, 'wake-check-snooze').click(); pg.wait_for_timeout(1200)
        R['sommeil_rappel_unique'] = demo(pg, f"s => s.tables.reminders.filter(r => r.deep_link === '/sleep/{lina}?check=1').length === 1 && s.tables.reminders.some(r => r.body === 'Rappel que vous avez programmé : vérifier si Lina est réveillée.')")
        tid(pg, 'wake-check-cancel').click(); pg.wait_for_timeout(1200)
        R['sommeil_rappel_annule'] = demo(pg, f"s => !s.tables.reminders.some(r => r.deep_link === '/sleep/{lina}?check=1')")
    else:
        R['sommeil_rappel_propose_pendant_sieste'] = False
    b.close()


def text_of(pg, t):
    return tid(pg, t).inner_text() if has(pg, t) else ''


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append(f'exception: {str(e)[:300]}')
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
bad = [k for k, v in R.items() if v is not True]
print('ÉCHECS :', bad)
sys.exit(1 if bad or errs else 0)
