"""
Rappel du prochain biberon, dans le navigateur (version web de démonstration), avec une horloge contrôlée
(Europe/Paris, 20/10/2026) :
  1. biberon à 13 h 10 + 3 h 30 → « Prochain rappel de biberon de Lina à 16 h 40. »
  2. nouveau biberon à 16 h 50, intervalle repris → 20 h 20
  3. report de 30 min, modification de l'intervalle, heure choisie directement
  4. deuxième bébé (Malo) : rappel indépendant ; l'enregistrement pour Lina ne touche pas Malo
  5. annulation
  6. fiche de l'enfant : prochain rappel affiché en heure, pas de « il y a … »
Les notifications système ne peuvent pas être vérifiées dans un navigateur : elles le sont dans
src/__tests__/bottleReminder.test.ts (déclencheur absolu, redémarrage, autorisations, doublons).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/biberon.py
"""
import json, os
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
PARIS = timezone(timedelta(hours=2))


def at(h, m):
    return datetime(2026, 10, 20, h, m, tzinfo=PARIS)


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2200):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def next_text(pg):
    return tid(pg, 'bottle-next').inner_text().replace('\n', ' ')


def record(pg, child, hhmm, delay_label=None):
    go(pg, f'/track/bottle?child={child}')
    pg.locator('input[aria-label="Ou une heure précise"]').filter(visible=True).first.fill(hhmm)
    pg.wait_for_timeout(200)
    if delay_label:
        pg.get_by_text(delay_label, exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(300)
    banner = tid(pg, 'bottle-reminder').inner_text().replace('\n', ' ')
    tid(pg, 'track-save').click(); pg.wait_for_timeout(1800)
    return banner


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.clock.install(time=at(13, 15))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    hid = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').household_id")
    # Deuxième bébé suivi au biberon (jumeaux, fratrie rapprochée)
    mutate(pg, f"s => {{ s.tables.children.push({{ id: 'e2e-malo', household_id: '{hid}', first_name: 'Malo', birth_date: '2026-08-01', sex: 'male', photo_path: null, from_pregnancy_id: null, multiple_group: null, enabled_tracking: ['bottle', 'diaper', 'sleep'], allergies_declared: [], habits: null, archived: false, created_at: new Date().toISOString() }}); const me = s.tables.user_journeys.find(j => j.child_id === '{lina}').user_id; s.tables.user_journeys.push({{ id: 'e2e-j-malo', user_id: me, status: 'active', ended_on: null, end_reason: null, pregnancy_id: null, child_id: 'e2e-malo', household_id: '{hid}', type: 'baby', started_on: '2026-08-01', created_at: new Date().toISOString() }}); s.tables.bottle_timers = (s.tables.bottle_timers || []).filter(t => t.child_id !== '{lina}'); }}")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    # Biberon seulement pour les bébés (0 à 2 ans ou « Mon bébé est né ») : jamais pour Noé (~6 ans)
    go(pg, f'/bottle/{noe}')
    R['0_pas_de_biberon_pour_noe'] = 'Pas de biberon pour Noé' in pg.inner_text('body')
    go(pg, f'/track/bottle?child={noe}')
    R['0_saisie_refusee_pour_noe'] = 'Ce profil n’est pas concerné' in pg.inner_text('body')
    go(pg, f'/bottle/{lina}')
    R['0_noe_absent_des_choix'] = pg.get_by_text('Noé', exact=True).count() == 0
    R['ecran_sans_rappel'] = 'Aucun rappel prévu pour Lina' in next_text(pg)
    R['pas_de_chronometre_principal'] = 'il y a' not in pg.inner_text('body')

    # 1. 13 h 10 + 3 h 30
    banner = record(pg, lina, '13h10', '3 h 30')
    R['1_apercu_avant_enregistrement'] = 'Prochain rappel de biberon de Lina à 16 h 40.' in banner
    go(pg, f'/bottle/{lina}')
    R['1_rappel_16h40'] = 'Prochain rappel de biberon de Lina à 16 h 40.' in next_text(pg)
    R['1_dernier_biberon_13h10'] = '13 h 10' in tid(pg, 'bottle-last').inner_text()
    pg.screenshot(path=f'{SHOTS}/bib_16h40.png')

    # 2. nouveau biberon à 16 h 50, intervalle habituel repris automatiquement
    pg.clock.set_system_time(at(16, 52))
    banner = record(pg, lina, '16h50')
    R['2_intervalle_repris'] = '20 h 20' in banner
    go(pg, f'/bottle/{lina}')
    R['2_rappel_20h20'] = 'Prochain rappel de biberon de Lina à 20 h 20.' in next_text(pg)
    R['2_un_seul_rappel_actif'] = demo(pg, f"s => s.tables.bottle_timers.filter(t => t.child_id === '{lina}' && t.status === 'active').length") == 1

    # 3. report de 30 min, intervalle, heure directe
    tid(pg, 'bottle-edit').click(); pg.wait_for_timeout(600)
    pg.get_by_text('30 min', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    R['3_report_30min_20h50'] = 'à 20 h 50' in next_text(pg)
    tid(pg, 'bottle-edit').click(); pg.wait_for_timeout(600)
    pg.get_by_text('2 h 30', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(200)
    tid(pg, 'bottle-save-interval').click(); pg.wait_for_timeout(1200)
    R['3_intervalle_2h30_19h20'] = 'à 19 h 20' in next_text(pg)
    tid(pg, 'bottle-edit').click(); pg.wait_for_timeout(600)
    pg.locator('input[aria-label="Heure précise"]').filter(visible=True).first.fill('21h05'); pg.wait_for_timeout(200)
    tid(pg, 'bottle-set-time').click(); pg.wait_for_timeout(1200)
    R['3_heure_choisie_21h05'] = 'à 21 h 05' in next_text(pg)

    # 4. deuxième bébé
    record(pg, 'e2e-malo', '13h40', '3 h 30')
    go(pg, '/bottle/e2e-malo')
    R['4_malo_17h10'] = 'Prochain rappel de biberon de Malo à 17 h 10.' in next_text(pg)
    record(pg, lina, '16h52')  # nouveau biberon de Lina
    go(pg, '/bottle/e2e-malo')
    R['4_malo_inchange'] = 'Malo à 17 h 10' in next_text(pg)
    R['4_prenom_avant_enregistrement'] = True
    go(pg, f'/track/bottle?child={lina}')
    R['4_prenom_avant_enregistrement'] = 'Enregistrer pour Lina' in pg.inner_text('body') and 'Prochain rappel pour Lina' in pg.inner_text('body')

    # 5. annulation (Lina) : Malo garde son rappel
    go(pg, f'/bottle/{lina}')
    tid(pg, 'bottle-cancel').click(); pg.wait_for_timeout(600)
    pg.locator('[aria-label="Annuler le rappel"]').filter(visible=True).last.click(); pg.wait_for_timeout(1200)
    R['5_annule'] = 'Aucun rappel prévu pour Lina' in next_text(pg)
    go(pg, '/bottle/e2e-malo')
    R['5_malo_conserve'] = 'Malo à 17 h 10' in next_text(pg)

    # Fiche de Noé : aucune carte ni action biberon
    go(pg, f'/child/{noe}')
    R['6_fiche_noe_sans_biberon'] = 'Rappel biberon' not in pg.inner_text('body') and 'Prochain rappel de biberon' not in pg.inner_text('body')
    # 6. fiche de l'enfant (Malo)
    go(pg, '/child/e2e-malo')
    body = pg.inner_text('body')
    R['6_fiche_prochain_rappel'] = 'Prochain rappel de biberon de Malo à 17 h 10.' in body
    pg.screenshot(path=f'{SHOTS}/bib_fiche.png')
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps({**R, 'erreurs': errs[:10]}, ensure_ascii=False, indent=1))
print('OK' if all(R.values()) and not errs else 'ÉCHEC', sum(R.values()), '/', len(R))
