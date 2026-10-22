"""
« Le cocon du jour » (accueil d'un profil enfant), version web de démonstration, sans compte.
Démo de départ : Camille, Lina (bébé) et Noé (enfant).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/cocon.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, sys
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def text(pg, t):
    return tid(pg, t).inner_text() if has(pg, t) else ''


def ids(pg, prefix):
    return pg.evaluate(f"() => [...document.querySelectorAll('[data-testid^=\"{prefix}\"]')].map(e => e.getAttribute('data-testid'))")


def go(pg, path, wait=2600):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def today_at(h, m=0):
    d = datetime.now().replace(hour=h, minute=m, second=0, microsecond=0)
    return d.astimezone().isoformat()


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    hid = demo(pg, f"s => s.tables.children.find(c => c.id === '{lina}').household_id")
    # Lina : 8 mois, tous les suivis ; quelques événements d'aujourd'hui (repas à 0 h 30 et 0 h 40 pour qu'ils soient passés)
    birth = (datetime.now() - timedelta(days=245)).date().isoformat()
    mutate(pg, f"""s => {{ const c = s.tables.children.find(c => c.id === '{lina}'); c.birth_date = '{birth}'; c.sex = 'female';
      for (const k of ['bottle','diaper','sleep','meal','breastfeed']) if (!c.enabled_tracking.includes(k)) c.enabled_tracking.push(k);
      s.tables.meals.push({{ id: 'e2e-meal', child_id: '{lina}', household_id: '{hid}', at: '{today_at(0, 30)}', description: 'Compote', foods: [], texture: 'smooth', reaction_note: null }});
      s.tables.diapers.push({{ id: 'e2e-diaper', child_id: '{lina}', household_id: '{hid}', at: '{today_at(0, 40)}', wet: true, stool: false }});
      s.tables.meals.push({{ id: 'e2e-noe-meal', child_id: '{noe}', household_id: '{hid}', at: '{today_at(0, 20)}', description: 'Pâtes', foods: [], texture: 'family', reaction_note: null }}); }}""")
    pg.evaluate(f"() => {{ const ui = JSON.parse(localStorage.getItem('toietmoi.ui') || '{{\"state\":{{}},\"version\":0}}'); ui.state.subject = {{ type: 'child', id: '{lina}' }}; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }}")
    go(pg, '/', 3800)
    pg.screenshot(path=f'{SHOTS}/cocon_lina.png')

    # 1. Premier écran : profils, cocon, frise, 3 infos, « + Ajouter », un conseil — pas de grille de 4 cases
    R['1_bulles_enfants'] = has(pg, f'bubble-{lina}') and has(pg, f'bubble-{noe}') and has(pg, 'bubble-add') and has(pg, 'profile-switcher')
    R['1_cocon'] = has(pg, 'cocoon-card') and text(pg, 'cocoon-name') == 'Lina' and '8 mois' in text(pg, 'cocoon-age')
    R['1_plus_de_grille'] = not has(pg, 'track-cards') and not has(pg, 'home-card-quick') and not has(pg, 'home-card-community') and not has(pg, 'all-tools')
    R['1_bouton_ajouter'] = has(pg, 'cocoon-add')
    R['1_trois_infos'] = len([i for i in ids(pg, 'cocoon-info-') if i]) == 3
    R['1_a_retenir'] = has(pg, 'cocoon-keep') and has(pg, 'home-today')
    # Photo / initiales au centre (jamais sur le côté)
    card = tid(pg, 'cocoon-card').bounding_box(); av = tid(pg, 'cocoon-avatar').bounding_box()
    R['2_photo_centree'] = abs((card['x'] + card['width'] / 2) - (av['x'] + av['width'] / 2)) < 4
    # 3. Frise : vrais événements de Lina
    rib = ids(pg, 'ribbon-')
    R['3_frise_vrais_evenements'] = 'ribbon-meal-e2e-meal' in rib and 'ribbon-diaper-e2e-diaper' in rib and 'ribbon-meal-e2e-noe-meal' not in rib
    R['3_ligne_heure_actuelle'] = pg.locator('[data-testid="cocoon-now-line"]').count() == 1
    # Infos d'un bébé en diversification : repas, biberon, sommeil
    R['4_infos_diversification'] = ids(pg, 'cocoon-info-') == ['cocoon-info-meal', 'cocoon-info-bottle', 'cocoon-info-sleep']

    # 3. Toucher un événement : voir, modifier, supprimer
    pg.locator('[data-testid="ribbon-meal-e2e-meal"]').first.click(); pg.wait_for_timeout(900)
    R['3_evenement_detail'] = has(pg, 'cocoon-event') and 'Compote' in text(pg, 'cocoon-event')
    tid(pg, 'cocoon-event-edit').click(); pg.wait_for_timeout(1800)
    R['3_modifier_ouvre_saisie'] = '/track/meal' in pg.url and 'id=e2e-meal' in pg.url
    pg.go_back(); pg.wait_for_timeout(2200)
    pg.locator('[data-testid="ribbon-diaper-e2e-diaper"]').first.click(); pg.wait_for_timeout(900)
    tid(pg, 'cocoon-event-delete').click(); pg.wait_for_timeout(700)
    pg.get_by_role('button', name='Supprimer').last.click(); pg.wait_for_timeout(1500)
    R['3_supprimer'] = demo(pg, "s => s.tables.diapers.some(d => d.id === 'e2e-diaper')") is False and 'ribbon-diaper-e2e-diaper' not in ids(pg, 'ribbon-')

    # 5. « + Ajouter » : feuille, 4 favoris, ajout réel qui apparaît aussitôt dans la frise
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(900)
    favs = pg.evaluate("() => [...document.querySelectorAll('[data-testid=\"cocoon-add-sheet\"] [data-testid^=\"cocoon-add-\"]')].map(e => e.getAttribute('data-testid'))")
    actions = [f for f in favs if f not in ('cocoon-add-customize',)]
    R['5_feuille_actions'] = set(actions) >= {'cocoon-add-bottle', 'cocoon-add-breastfeed', 'cocoon-add-meal', 'cocoon-add-diaper', 'cocoon-add-sleep', 'cocoon-add-medication', 'cocoon-add-symptom', 'cocoon-add-note'}
    R['5_favoris_age'] = actions[:4] == ['cocoon-add-meal', 'cocoon-add-bottle', 'cocoon-add-sleep', 'cocoon-add-diaper']
    pg.screenshot(path=f'{SHOTS}/cocon_ajouter.png')
    before = demo(pg, f"s => s.tables.bottles.filter(x => x.child_id === '{lina}').map(x => x.id)")
    tid(pg, 'cocoon-add-bottle').click(); pg.wait_for_timeout(1800)
    R['5_ouvre_saisie_biberon'] = '/track/bottle' in pg.url and f'child={lina}' in pg.url
    tid(pg, 'track-save').click(); pg.wait_for_timeout(2200)
    new = [x for x in demo(pg, f"s => s.tables.bottles.filter(x => x.child_id === '{lina}').map(x => x.id)") if x not in before]
    R['10_frise_actualisee_apres_ajout'] = len(new) == 1 and f'ribbon-bottle-{new[0]}' in ids(pg, 'ribbon-') and pg.url.rstrip('/') == B
    # Symptôme et note : type présélectionné
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(800)
    tid(pg, 'cocoon-add-note').click(); pg.wait_for_timeout(1800)
    R['5_note_preselectionnee'] = '/track/observation' in pg.url and 'obs=note' in pg.url and 'Titre' in pg.inner_text('body')
    pg.go_back(); pg.wait_for_timeout(2200)
    # Favoris personnalisés : « Note » à la place de « Couche », conservé
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(800)
    tid(pg, 'cocoon-add-customize').click(); pg.wait_for_timeout(400)
    tid(pg, 'cocoon-add-diaper').click(); pg.wait_for_timeout(300)
    tid(pg, 'cocoon-add-note').click(); pg.wait_for_timeout(300)
    tid(pg, 'cocoon-add-customize').click(); pg.wait_for_timeout(400)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    go(pg, '/', 3500)
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(800)
    favs = pg.evaluate("() => [...document.querySelectorAll('[data-testid=\"cocoon-add-sheet\"] [data-testid^=\"cocoon-add-\"]')].map(e => e.getAttribute('data-testid'))")
    R['5_favoris_personnalises'] = 'cocoon-add-note' in favs[:4] and 'cocoon-add-diaper' not in favs[:4]
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)

    # Sommeil depuis le cocon (fonction conservée)
    open_before = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length")
    if has(pg, 'sleep-asleep'):
        tid(pg, 'sleep-asleep').click(); pg.wait_for_timeout(1500)
        R['sommeil_endormissement'] = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length") == open_before + 1 and 'dort' in text(pg, 'sleep-now-state')
        tid(pg, 'sleep-awake').click(); pg.wait_for_timeout(1500)
        R['sommeil_reveil'] = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length") == open_before
    else:
        tid(pg, 'sleep-awake').click(); pg.wait_for_timeout(1500)
        R['sommeil_reveil'] = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length") == open_before - 1
    R['sommeil_liens'] = has(pg, 'sleep-open')

    # 1. Changer d'enfant par la bulle : tout change, rien ne se mélange
    tid(pg, f'bubble-{noe}').click(); pg.wait_for_timeout(1800)
    rib = ids(pg, 'ribbon-')
    R['1_bulle_change_enfant'] = text(pg, 'cocoon-name') == 'Noé' and 'ribbon-meal-e2e-noe-meal' in rib and 'ribbon-meal-e2e-meal' not in rib
    R['4_infos_enfant_plus_grand'] = ids(pg, 'cocoon-info-')[:2] == ['cocoon-info-sleep', 'cocoon-info-meal'] or ids(pg, 'cocoon-info-')[0] == 'cocoon-info-meal'
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(800)
    R['5_jamais_biberon_enfant'] = not has(pg, 'cocoon-add-bottle')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SHOTS}/cocon_noe.png')
    # Glisser la carte : retour à Lina
    box = tid(pg, 'cocoon-card').bounding_box()
    y = box['y'] + 80
    pg.mouse.move(box['x'] + box['width'] - 30, y); pg.mouse.down()
    for k in range(1, 13):
        pg.mouse.move(box['x'] + box['width'] - 30 - k * 20, y); pg.wait_for_timeout(16)
    pg.mouse.up(); pg.wait_for_timeout(1500)
    R['1_glisser_change_enfant'] = text(pg, 'cocoon-name') == 'Lina'

    # 4. Suivis désactivés : jamais de couche ni de biberon
    mutate(pg, f"s => {{ const c = s.tables.children.find(c => c.id === '{lina}'); c.enabled_tracking = c.enabled_tracking.filter(k => k !== 'diaper' && k !== 'bottle'); }}")
    go(pg, '/', 3500)
    inf = ids(pg, 'cocoon-info-')
    R['4_suivis_desactives_masques'] = 'cocoon-info-bottle' not in inf and 'cocoon-info-diaper' not in inf and len(inf) == 3 and not any(r.startswith('ribbon-bottle') or r.startswith('ribbon-diaper') for r in ids(pg, 'ribbon-'))
    tid(pg, 'cocoon-add').click(); pg.wait_for_timeout(800)
    R['5_feuille_sans_suivis_desactives'] = not has(pg, 'cocoon-add-bottle') and not has(pg, 'cocoon-add-diaper')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)

    # 9. « Voir toute la journée » → suivi détaillé
    tid(pg, 'cocoon-all-day').click(); pg.wait_for_timeout(2000)
    R['9_voir_toute_la_journee'] = '/track' in pg.url
    # Les autres profils restent accessibles
    go(pg, '/', 3000)
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, 'subject-me').click(); pg.wait_for_timeout(1500)
    R['profils_autres_accessibles'] = not has(pg, 'cocoon') and has(pg, 'home-card-main')

    # 8. Nuit : lisible (texte clair sur fond sombre)
    pg.evaluate(f"() => {{ const ui = JSON.parse(localStorage.getItem('toietmoi.ui')); ui.state.subject = {{ type: 'child', id: '{lina}' }}; ui.state.themePreference = 'night'; localStorage.setItem('toietmoi.ui', JSON.stringify(ui)); }}")
    go(pg, '/', 3500)
    col = pg.evaluate("() => { const el = document.querySelector('[data-testid=\"cocoon-name\"]'); return el ? getComputedStyle(el).color : null; }")
    R['8_nuit_lisible'] = bool(col) and all(int(v) > 200 for v in col[col.index('(') + 1:col.index(')')].split(',')[:3])
    pg.screenshot(path=f'{SHOTS}/cocon_nuit.png')
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append(f'exception: {e}'[:400])
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
ok = [k for k, v in R.items() if k != 'erreurs' and v is True]
print(f'OK {len(ok)} / {len(R) - 1}')
sys.exit(0 if len(ok) == len(R) - 1 and not errs else 1)
