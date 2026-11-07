import sys, json, datetime
sys.path.insert(0,'/home/claude/toi-et-moi/e2e')
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B='http://127.0.0.1:8822'; R={}; errs=[]
SHOT='/tmp/claude-0/-home-claude/fd705f98-b502-533e-b6f9-2f12806c0d2a/scratchpad/espace-'
def tid(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg,t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()>0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B+'/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF)
    # données du jour : un rappel quotidien à 23:50, un rappel désactivé, un rendez-vous aujourd'hui à 23:30
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
      const hid = s.tables.household_members.find(m => m.user_id === me).household_id; const now = new Date().toISOString();
      const d = new Date(); d.setHours(23, 30, 0, 0);
      s.tables.reminders = [...(s.tables.reminders||[]),
        { id: 'r-test-1', user_id: me, household_id: hid, child_id: null, pregnancy_id: null, appointment_id: null, category: 'custom', title: 'Vitamine D de Lina', body: null, schedule: { type: 'daily', hour: 23, minute: 50 }, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: null, created_at: now, updated_at: now },
        { id: 'r-test-2', user_id: me, household_id: hid, child_id: null, pregnancy_id: null, appointment_id: null, category: 'custom', title: 'Rappel coupé', body: null, schedule: { type: 'daily', hour: 23, minute: 55 }, timezone: 'Europe/Paris', enabled: false, snoozed_until: null, deep_link: null, created_at: now, updated_at: now }];
      s.tables.appointments = [...(s.tables.appointments||[]), { id: 'a-test-1', household_id: hid, pregnancy_id: null, child_id: null, for_parent: true, kind: 'other', title: 'Sage-femme (test)', starts_at: d.toISOString(), location_label: null, notes: null, questions: [], created_by: me }];
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.reload(); pg.wait_for_timeout(3000)
    pg.goto(B+'/profile'); pg.wait_for_timeout(3500)
    body=pg.inner_text('body')
    R['ma_journee']=has(pg,'hub-myday')
    R['rappel_du_jour']='Vitamine D de Lina' in tid(pg,'hub-myday').inner_text()
    R['rdv_du_jour']='Sage-femme (test)' in tid(pg,'hub-myday').inner_text()
    R['rappel_desactive_absent']='Rappel coupé' not in tid(pg,'hub-myday').inner_text()
    R['ordre_rdv_avant_rappel']=tid(pg,'hub-myday').inner_text().index('Sage-femme (test)') < tid(pg,'hub-myday').inner_text().index('Vitamine D de Lina')
    pg.screenshot(path=SHOT+'haut.png')
    R['sections']=all(has(pg,t) for t in ['hub-organize','hub-docs','hub-me']) and has(pg,'hub-child-Lina') and has(pg,'hub-child-Noé')
    R['rien_supprime']=all(x in body for x in ['Mon assistant IA','Bibliothèque','Vidéos & articles','Ajouter un enfant','Urgences']) and all(has(pg,t) for t in ['profile-community','profile-account','edit-journey','profile-photo','profile-ai','profile-library'])
    # liens
    checks={'hub-calendar':'/agenda','hub-reminders':'/settings/reminders','hub-family-org':'/family','hub-docs-all':'/documents','hub-docs-scan':'/documents/scan','hub-papers':'/family/papers','hub-book':'/documents/book','hub-child-Lina-vaccines':'/vaccines','hub-child-Lina-growth':'croissance','hub-child-Lina-tracking':'/health-tracking','hub-child-Lina-appointments':'/appointments','hub-child-Lina-card':'/card','hub-me-appointments':'/appointments','hub-me-space':'/me'}
    bad=[]
    for t,frag in checks.items():
        pg.goto(B+'/profile'); pg.wait_for_timeout(2200)
        el=tid(pg,t); el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(2000)
        if frag not in pg.url or 'Page introuvable' in pg.inner_text('body'): bad.append((t,pg.url))
    R['liens_ok']=not bad; R['liens_ko']=bad
    # boutons rapides
    pg.goto(B+'/profile'); pg.wait_for_timeout(2500)
    tid(pg,'hub-plan').click(); pg.wait_for_timeout(2500)
    R['planifier_ouvre_creation']='/calendar' in pg.url and 'Nouvel événement' in pg.inner_text('body')
    pg.goto(B+'/profile'); pg.wait_for_timeout(2500)
    tid(pg,'hub-reminder').click(); pg.wait_for_timeout(2500)
    R['rappel_ouvre_creation']='/settings/reminders' in pg.url and pg.locator('input').filter(visible=True).count()>=1
    pg.screenshot(path=SHOT+'rappel.png')
    pg.goto(B+'/profile'); pg.wait_for_timeout(2500)
    tid(pg,'hub-docs').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path=SHOT+'milieu.png')
    tid(pg,'hub-me').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path=SHOT+'bas.png')
    R['erreurs']=errs
    print(json.dumps(R,ensure_ascii=False,indent=1))
