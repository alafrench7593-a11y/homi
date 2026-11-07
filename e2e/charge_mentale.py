import sys, json
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/cm-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def rows(pg,t): return demo(pg, f"s => (s.tables['{t}']||[]).length")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)

    # 1. Vider ma tête
    pg.goto(B+'/family/brain-dump'); pg.wait_for_timeout(2500)
    before=rows(pg,'family_tasks')
    tid(pg,'dump-text').fill('vaccin de Lina mardi, acheter des couches, appeler la CAF, réunion école jeudi 18h')
    tid(pg,'dump-sort').click(); pg.wait_for_timeout(800)
    R['dump_tri_4']=pg.locator('[data-testid^="dump-item-"]').filter(visible=True).count()==4
    pg.screenshot(path=SHOT+'dump.png', full_page=True)
    tid(pg,'dump-save').click(); pg.wait_for_timeout(2000)
    R['dump_enregistre']=demo(pg,"s => ['family_tasks','family_events','shopping_items','reminders'].reduce((n,t)=>n+(s.tables[t]||[]).length,0)")>before

    # 2. Domaines
    pg.goto(B+'/family/domains'); pg.wait_for_timeout(2500)
    R['domaines_12']=pg.locator('[data-testid^="dom-"]').filter(visible=True).count()>=12
    pg.screenshot(path=SHOT+'domaines.png', full_page=True)

    # 3. Qui y pense
    pg.goto(B+'/family/load'); pg.wait_for_timeout(2500)
    R['charge_ecran']='Qui y pense' in pg.inner_text('body')
    pg.screenshot(path=SHOT+'charge.png', full_page=True)

    # 4. Échéances
    pg.goto(B+'/family/prep'); pg.wait_for_timeout(2500)
    btn=pg.locator('[data-testid^="prep-do-"]').filter(visible=True)
    R['prep_items']=btn.count()
    if btn.count():
        t0=rows(pg,'family_tasks'); btn.first.click(); pg.wait_for_timeout(2000)
        R['prep_cree_taches']=rows(pg,'family_tasks')>t0
    pg.screenshot(path=SHOT+'echeances.png', full_page=True)

    # 5. Je décroche
    pg.goto(B+'/family/offduty'); pg.wait_for_timeout(2500)
    R['off_ecran']='Je décroche' in pg.inner_text('body')
    R['off_pluriel']='3 heures' in pg.inner_text('body') and '3 heure ' not in pg.inner_text('body')
    if has(pg,'off-go') and tid(pg,'off-go').is_enabled():
        tid(pg,'off-go').click(); pg.wait_for_timeout(2000)
        R['off_actif']=has(pg,'off-active')
        pg.screenshot(path=SHOT+'decroche.png', full_page=True)
        if has(pg,'off-stop'): tid(pg,'off-stop').click(); pg.wait_for_timeout(1500); R['off_repris']=not has(pg,'off-active')
    else:
        R['off_seul_message']='Invitez l’autre parent' in pg.inner_text('body')
        pg.screenshot(path=SHOT+'decroche.png', full_page=True)

    # 6. Carnet
    pg.goto(B+'/family/notebook'); pg.wait_for_timeout(2500)
    tid(pg,'nb-new').click(); pg.wait_for_timeout(800)
    tid(pg,'nb-s-codes').click(); pg.wait_for_timeout(300)
    R['carnet_alerte_codes']='Jamais de code de carte bancaire' in pg.inner_text('body')
    tid(pg,'nb-title').fill('Digicode immeuble'); tid(pg,'nb-save').click(); pg.wait_for_timeout(1800)
    R['carnet_note']='Digicode immeuble' in pg.inner_text('body') and rows(pg,'house_notes')==1
    pg.screenshot(path=SHOT+'carnet.png', full_page=True)

    # 7. Point de couple
    pg.goto(B+'/family/couple'); pg.wait_for_timeout(2500)
    tid(pg,'cp-heavy').fill('Les nuits'); tid(pg,'cp-save').click(); pg.wait_for_timeout(1800)
    R['couple_enregistre']=rows(pg,'couple_checkins')==1
    pg.screenshot(path=SHOT+'couple.png', full_page=True)

    # 8. Je suis à bout
    pg.goto(B+'/family/exhausted'); pg.wait_for_timeout(2500)
    for q in ['tired','sleep','irritable','distance','overwhelmed','no_time']: tid(pg,f'ex-{q}-3').click()
    tid(pg,'ex-done').click(); pg.wait_for_timeout(1800)
    body=pg.inner_text('body')
    R['epuisement_haut']=has(pg,'ex-result-high') and '3114' in body and 'médecin' in body
    R['epuisement_pas_diagnostic']='diagnostic' in body and 'normal' not in body.lower()
    R['epuisement_enregistre']=rows(pg,'exhaustion_checkins')==1
    pg.screenshot(path=SHOT+'epuisement.png', full_page=True)

    # 9. Papiers
    pg.goto(B+'/family/papers'); pg.wait_for_timeout(2500)
    tid(pg,'pp-proc-school').click(); pg.wait_for_timeout(800)
    R['papiers_dossier']=has(pg,'pp-dossier') and 'sur' in pg.inner_text('body')
    tid(pg,'pp-kind-id_card').click(); pg.wait_for_timeout(800)
    tid(pg,'pp-expires').fill('01/12/2026'); tid(pg,'pp-save').click(); pg.wait_for_timeout(1800)
    R['papiers_expiration_alerte']='à renouveler bientôt' in pg.inner_text('body')
    pg.screenshot(path=SHOT+'papiers.png', full_page=True)
    tid(pg,'pp-kind-id_card').click(); pg.wait_for_timeout(800)
    tid(pg,'pp-photo').click(); pg.wait_for_timeout(2500)
    R['scan_parametres']='paper=' in pg.url and 'title=' in pg.url
    with pg.expect_file_chooser() as fc: pg.get_by_text('Prendre une photo').filter(visible=True).first.click()
    fc.value.set_files('/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/img/carte.jpg')
    pg.wait_for_selector('text=Page 1', timeout=30000); pg.wait_for_timeout(500)
    pg.get_by_text('Continuer').filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    R['scan_titre_prerempli']=pg.locator('input').evaluate_all("els => els.some(e => e.value === 'Carte d’identité')")
    pg.screenshot(path=SHOT+'scan.png', full_page=True)
    pg.get_by_text('Enregistrer en PDF').filter(visible=True).first.click(); pg.wait_for_timeout(5000)
    R['papier_lie_au_document']=demo(pg,"s => (s.tables.family_papers||[]).some(p => p.kind === 'id_card' && p.document_id && (s.tables.documents||[]).some(d => d.id === p.document_id))")
    pg.goto(B+'/family/papers'); pg.wait_for_timeout(2500)
    R['papier_statut_pret']='Expire bientôt' in pg.inner_text('body')

    # 10. Catalogue
    pg.goto(B+'/tools'); pg.wait_for_timeout(2500)
    R['catalogue']=all(x in pg.inner_text('body') for x in ['Vider ma tête','Papiers de la famille','Je décroche'])
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
