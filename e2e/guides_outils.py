"""
Guides thématiques et nouveaux outils (04/11/2026), version web de démonstration :
  guides (maladies, urgences, hygiène, sport, activités, sommeil, alimentation, émotions, école, 1–3 ans, droits au
  travail, après une perte, PMA, à deux, néonat), questions pour le rendez-vous, mouvements de bébé, journal de
  contraception, fiche de l'enfant, démarches, « je craque », trousse règles.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/guides_outils.py
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import SET_BODY, SIMPLE_OFF  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
GUIDES = ['illnesses', 'firstaid', 'hygiene', 'sport', 'activities', 'kidsleep', 'kidfood', 'behaviour', 'school', 'toddler', 'work', 'loss', 'pma', 'couple', 'neonat']


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def go(pg, path, wait=2200):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def ok_screen(pg):
    t = T(pg)
    return 'Oups' not in t and 'rencontré un problème' not in t


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
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")

    # ---- guides : chaque guide s'ouvre, a ses sections et des fiches cliquables
    for g in GUIDES:
        go(pg, f'/guide/{g}' + (f'?child={lina}' if g == 'neonat' else ''), 2600)
        t = T(pg)
        n_sections = pg.locator('[data-testid^="guide-section-"]').count()
        n_articles = pg.locator('[data-testid^="guide-article-"]').count()
        R[f'guide_{g}_ouvre'] = ok_screen(pg) and n_sections >= 2 and n_articles >= 5 and 'fiche' in t
        pg.screenshot(path=f'{SHOTS}/guide-{g}.png', full_page=True)
    # une fiche s'ouvre depuis le guide des maladies
    go(pg, '/guide/illnesses', 2600)
    tid(pg, 'guide-article-varicelle-chez-l-enfant').click(); pg.wait_for_timeout(2500)
    R['guide_fiche_varicelle_ouvre'] = ok_screen(pg) and 'Varicelle' in T(pg) and '/article/varicelle' in pg.url
    # nouvelle fiche du lot b36 (roséole)
    go(pg, '/article/roseole-exantheme-subit-fievre-puis-eruption-que-faire', 2600)
    R['fiche_roseole_b36'] = ok_screen(pg) and 'Roséole' in T(pg)
    # âge corrigé affiché pour le guide néonat
    go(pg, f'/guide/neonat?child={lina}', 2600)
    R['neonat_age_corrige'] = tid(pg, 'guide-corrected-age').is_visible()

    # ---- questions pour le rendez-vous : moi, grossesse, enfant
    go(pg, '/consult/questions', 2600)
    R['questions_moi_ouvre'] = ok_screen(pg) and 'Mes questions pour le rendez-vous' in T(pg)
    pg.get_by_placeholder(re.compile('.+')).first.fill('Est-ce que je dois refaire un frottis ?'); pg.wait_for_timeout(300)
    pg.get_by_role('button', name='Ajouter', exact=True).first.click(); pg.wait_for_timeout(1500)
    R['questions_ajout'] = 'refaire un frottis' in T(pg)
    pg.screenshot(path=f'{SHOTS}/questions-moi.png', full_page=True)
    go(pg, f'/consult/questions?child={noe}', 2600)
    R['questions_enfant_ouvre'] = ok_screen(pg) and 'Noé' in T(pg) and 'refaire un frottis' not in T(pg)
    go(pg, '/consult/questions?for=pregnancy', 2600)
    R['questions_grossesse_ouvre'] = ok_screen(pg) and 'Ma grossesse' in T(pg)

    # ---- mouvements de bébé (parcours grossesse)
    pg.evaluate(SET_BODY, ['pregnancy', False])
    go(pg, '/pregnancy/moves', 2600)
    R['mouvements_ouvre'] = ok_screen(pg) and 'Mouvements de bébé' in T(pg) and 'maternité' in T(pg)
    tid(pg, 'moves-level-usual').click(); pg.wait_for_timeout(300)
    tid(pg, 'moves-save').click(); pg.wait_for_timeout(1800)
    R['mouvements_note'] = 'Comme d’habitude' in T(pg) and 'Note enregistrée' in T(pg) or demo(pg, "s => (s.tables.pregnancy_symptom_logs || []).some(l => l.symptom === 'movements')")
    tid(pg, 'moves-level-less').click(); pg.wait_for_timeout(500)
    R['mouvements_moins_alerte'] = 'appelez votre maternité maintenant' in T(pg)
    pg.screenshot(path=f'{SHOTS}/mouvements.png', full_page=True)

    # ---- journal de contraception + trousse règles (parcours éviter une grossesse)
    pg.evaluate(SET_BODY, ['avoid', False])
    go(pg, '/contraception/journal', 2600)
    R['journal_contraception_ouvre'] = ok_screen(pg) and 'Journal de ma contraception' in T(pg)
    tid(pg, 'cj-effect-mood').click(); pg.wait_for_timeout(300)
    tid(pg, 'cj-save').click(); pg.wait_for_timeout(1800)
    R['journal_contraception_note'] = demo(pg, "s => (s.tables.contraception_logs || []).some(l => l.kind === 'effect' && l.label === 'mood')")
    pg.screenshot(path=f'{SHOTS}/journal-contraception.png', full_page=True)
    go(pg, '/cycle/kit', 2600)
    R['trousse_ouvre'] = ok_screen(pg) and 'Trousse règles' in T(pg)
    pg.screenshot(path=f'{SHOTS}/trousse.png', full_page=True)

    # ---- fiche de l'enfant, démarches, je craque
    go(pg, f'/child/{noe}/card', 2600)
    R['fiche_enfant_ouvre'] = ok_screen(pg) and 'Fiche de mon enfant' in T(pg) and tid(pg, 'kid-card-allergies').is_visible()
    pg.get_by_text('Ajouter', exact=True).first.click(); pg.wait_for_timeout(600)
    tid(pg, 'kid-card-soothe-label').fill('Son doudou lapin et une pièce calme'); pg.wait_for_timeout(200)
    tid(pg, 'kid-card-soothe-save').click(); pg.wait_for_timeout(1800)
    R['fiche_enfant_apaise'] = 'doudou lapin' in T(pg)
    pg.screenshot(path=f'{SHOTS}/fiche-enfant.png', full_page=True)
    go(pg, f'/child/{noe}/steps', 2600)
    R['demarches_ouvre'] = ok_screen(pg) and 'Mes démarches' in T(pg)
    tid(pg, 'kid-steps-create').click(); pg.wait_for_timeout(2500)
    t = T(pg)
    R['demarches_liste_creee'] = 'pédiatre' in t and ('0 / 10' in t or '/ 10' in t or 'MDPH' in t)
    pg.screenshot(path=f'{SHOTS}/demarches.png', full_page=True)
    go(pg, '/family/sos', 2600)
    t = T(pg)
    R['je_craque_ouvre'] = ok_screen(pg) and 'Je craque' in t and 'Ne jamais le secouer' in t and '3114' in t
    tid(pg, 'sos-breathe').click(); pg.wait_for_timeout(1500)
    R['je_craque_minuteur'] = 'Respirez' in T(pg)
    pg.screenshot(path=f'{SHOTS}/je-craque.png', full_page=True)

    # ---- les nouveaux outils apparaissent dans « Tous mes outils » (profil Noé)
    go(pg, '/', 2500)
    tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
    tid(pg, f'subject-{noe}').click(); pg.wait_for_timeout(900)
    pg.evaluate("p => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate', { state: null })); }", '/tools'); pg.wait_for_timeout(2600)
    pg.mouse.wheel(0, 8000); pg.wait_for_timeout(500)
    t = T(pg).split('Outils des autres profils')[0]
    R['outils_noe_guides_visibles'] = all(x in t for x in ['Maladies de l’enfance', 'Urgences et premiers secours', 'Sport et activité', 'Fiche de mon enfant', 'Mes démarches', 'Je craque'])
    pg.screenshot(path=f'{SHOTS}/outils-noe.png', full_page=True)
    b.close()


if __name__ == '__main__':
    with sync_playwright() as p:
        try:
            run(p)
        except Exception as e:  # noqa: BLE001
            errs.append('EXC ' + str(e)[:300])
    R['erreurs'] = errs
    print(json.dumps(R, ensure_ascii=False, indent=1))
