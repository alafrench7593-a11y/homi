"""
Historique et journal du sommeil de l'enfant (13/11/2026), version web de démonstration.
Pour fr et de, à 320×568, 390×844 et 430×932 :
  - aucun débordement horizontal, aucune clé de traduction brute, aucune erreur JavaScript ;
  - barres 7 / 14 / 30 jours + alternative textuelle ; nuit dépliée (réveils, repas notés) ;
  - journal : ajout d'une difficulté ; résumé pour le pédiatre ; choix de l'enfant (Lina / Noé) ;
  - thème « nuit » (préférence d'affichage) : captures pour relecture.
  env -u CI npx expo export --platform web --output-dir <dist> && python3 e2e/spa_server.py <dist> 8852 &
  NAV_URL=http://127.0.0.1:8852 E2E_SHOTS=<dossier> python3 e2e/sommeil_historique.py
"""
import json, os, re
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8852')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e/sommeil')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
RAW_KEY = re.compile(r'\b(sj|u4|l7|l3)\.[a-zA-Z]+[.a-zA-Z_]*\b')
NAMES = {'fr': 'Français', 'de': 'Deutsch'}


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")


def overflow(pg):
    return pg.evaluate('() => document.documentElement.scrollWidth - window.innerWidth')


def check(pg, key, w):
    body = pg.inner_text('body')
    R[f'{key}_pas_de_debordement'] = overflow(pg) <= 0
    raw = RAW_KEY.findall(body)
    R[f'{key}_pas_de_cle_brute'] = not raw
    if raw: errs.append(f'{key} clés brutes : {raw[:5]}')
    return body


def run(p):
    b = p.chromium.launch()
    for lang in ['fr', 'de']:
        for (w, h) in [(320, 568), (390, 844), (430, 932)]:
            key = f'{lang}_{w}'
            ctx = b.new_context(viewport={'width': w, 'height': h}, locale='fr-FR', timezone_id='Europe/Paris')
            pg = ctx.new_page()
            pg.on('console', lambda m, k=key: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'video' not in m.text.lower() and errs.append(f'{k}: {m.text[:200]}'))
            pg.on('pageerror', lambda e, k=key: errs.append(f'{k} PAGE {str(e)[:200]}'))
            pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
            pg.get_by_text('Découvrir sans compte').first.click()
            pg.wait_for_function("() => { try { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return !!(s && s.session); } catch { return false; } }", timeout=20000)
            pg.wait_for_timeout(2500)
            if lang != 'fr':
                pg.goto(B + '/settings/language'); pg.wait_for_timeout(2000)
                pg.get_by_role('radio', name=NAMES[lang]).first.click(); pg.wait_for_timeout(2000)
            lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
            noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
            pg.goto(B + f'/sleep/history/{lina}'); pg.wait_for_timeout(3500)
            body = check(pg, key, w)
            R[f'{key}_titre'] = 'Lina' in body
            R[f'{key}_barres'] = tid(pg, 'sj-bars').count() == 1
            pg.screenshot(path=f'{SHOTS}/{key}_historique.png', full_page=True)
            # 30 jours + texte
            tid(pg, 'sj-range-30').click(); pg.wait_for_timeout(900)
            tid(pg, 'sj-as-text').click(); pg.wait_for_timeout(500)
            R[f'{key}_texte_30_jours'] = pg.locator('[data-testid="sleep-bars-text"] > *').count() == 30
            check(pg, key + '_30j', w)
            pg.screenshot(path=f'{SHOTS}/{key}_30jours.png', full_page=False)
            # Une nuit dépliée
            tid(pg, 'sj-night').click(); pg.wait_for_timeout(500)
            detail = tid(pg, 'sj-night-detail')
            R[f'{key}_nuit_detail'] = detail.count() == 1 and len(detail.inner_text().strip()) > 0
            # Journal : une difficulté
            tid(pg, 'sj-add-diff').click(); pg.wait_for_timeout(800)
            sheet = tid(pg, 'sj-note-sheet')
            sheet.locator('[role="button"], [role="checkbox"]').filter(has_text=re.compile('Réveils fréquents|Häufiges Aufwachen')).first.click(); pg.wait_for_timeout(200)
            tid(pg, 'sj-note-save').click(); pg.wait_for_timeout(1500)
            R[f'{key}_note_ajoutee'] = demo(pg, "s => (s.tables.sleep_notes || []).some(n => n.kind === 'difficulty' && n.tags.includes('night_wakings'))")
            R[f'{key}_note_affichee'] = re.search('Réveils fréquents|Häufiges Aufwachen', tid(pg, 'sj-journal').inner_text()) is not None
            # Résumé pour le pédiatre
            tid(pg, 'sj-pro-preview').click(); pg.wait_for_timeout(500)
            txt = tid(pg, 'sj-pro-text').inner_text()
            R[f'{key}_resume'] = 'Lina' in txt and ('Réveils fréquents' in txt or 'Häufiges Aufwachen' in txt)
            check(pg, key + '_fin', w)
            pg.screenshot(path=f'{SHOTS}/{key}_journal_resume.png', full_page=True)
            # Choix de l'enfant
            pg.get_by_role('button', name=re.compile('Noé')).first.click(); pg.wait_for_timeout(2500)
            R[f'{key}_enfant_noe'] = noe in pg.url and 'Noé' in pg.inner_text('body')
            # Planificateur : lien vers l'historique, sélecteur d'enfant
            pg.goto(B + f'/sleep/{lina}'); pg.wait_for_timeout(3000)
            R[f'{key}_planificateur_lien'] = tid(pg, 'sleep-history-link').count() == 1 and tid(pg, 'sleep-children').count() == 1
            check(pg, key + '_planif', w)
            if w == 390:
                # Thème nuit (préférence d'affichage persistée)
                pg.evaluate("() => { const k = 'toietmoi.ui'; const v = JSON.parse(localStorage.getItem(k) || '{\"state\":{},\"version\":0}'); v.state.themePreference = 'night'; localStorage.setItem(k, JSON.stringify(v)); }")
                pg.goto(B + f'/sleep/history/{lina}'); pg.wait_for_timeout(3500)
                bg = pg.evaluate("() => getComputedStyle(document.body).backgroundColor")
                check(pg, key + '_nuit', w)
                pg.screenshot(path=f'{SHOTS}/{key}_theme_nuit.png', full_page=True)
                pg.goto(B + f'/sleep/{lina}?tab=safety'); pg.wait_for_timeout(3000)
                pg.screenshot(path=f'{SHOTS}/{key}_theme_nuit_securite.png', full_page=True)
                R[f'{key}_theme_nuit_capture'] = True
                R[f'{key}_fond_body'] = bg
            ctx.close()
    b.close()


with sync_playwright() as p:
    run(p)
print(json.dumps(R, ensure_ascii=False, indent=1))
print('ERREURS', json.dumps(errs, ensure_ascii=False, indent=1))
bad = [k for k, v in R.items() if v is False]
print('ÉCHECS', bad)
