"""
Notifications et « C'est fait » (07/11/2026) — version web de démonstration :
  - « Ma journée » : cocher un rappel et une tâche, l'état survit au rechargement, décocher fonctionne ;
  - « Mes notifications » : réglages enregistrés, heures calmes, liens vers biberon et rappels, accès depuis Profil et Réglages.
La programmation réelle sur téléphone ne peut pas être testée sur le web (testée en unitaire avec expo-notifications simulé).
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B = 'http://127.0.0.1:8822'; R = {}; errs = []
SHOT = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e') + '/notifs-'
os.makedirs(os.path.dirname(SHOT), exist_ok=True)
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF)
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); const me = s.session.userId;
      const hid = s.tables.household_members.find(m => m.user_id === me).household_id; const now = new Date().toISOString();
      const d = new Date(); d.setHours(23, 40, 0, 0);
      s.tables.reminders = [...(s.tables.reminders||[]), { id: 'r-fait-1', user_id: me, household_id: hid, child_id: null, pregnancy_id: null, appointment_id: null, category: 'custom', title: 'Vitamine D (test)', body: null, schedule: { type: 'daily', hour: 23, minute: 50 }, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: null, created_at: now, updated_at: now }];
      s.tables.family_tasks = [...(s.tables.family_tasks||[]), { id: 't-fait-1', household_id: hid, title: 'Lessive (test)', status: 'todo', due_at: d.toISOString(), assignee_id: me, created_by: me, created_at: now, updated_at: now, done_at: null, done_by: null, recurrence: null, category: 'home', notes: null }];
      localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""")
    pg.reload(); pg.wait_for_timeout(3000)
    pg.goto(B + '/profile'); pg.wait_for_timeout(3500)
    R['case_rappel'] = has(pg, 'hub-check-r-fait-1')
    R['case_tache'] = has(pg, 'hub-check-t-fait-1')
    pg.screenshot(path=SHOT + 'journee-avant.png')
    if R['case_rappel'] and R['case_tache']:
        R['role_checkbox'] = tid(pg, 'hub-check-r-fait-1').get_attribute('role') == 'checkbox'
        tid(pg, 'hub-check-r-fait-1').click(); pg.wait_for_timeout(1500)
        tid(pg, 'hub-check-t-fait-1').click(); pg.wait_for_timeout(1500)
        R['toast_bravo'] = 'c’est noté comme fait' in pg.inner_text('body')
        R['rappel_enregistre'] = demo(pg, "s => (s.tables.daily_checks||[]).filter(c => c.reminder_id === 'r-fait-1' && c.user_id === s.session.userId && c.source === 'app').length") == 1
        R['tache_faite'] = demo(pg, "s => { const t = s.tables.family_tasks.find(x => x.id === 't-fait-1'); return t.status === 'done' && !!t.done_at && t.done_by === s.session.userId }")
        R['compteur'] = '2 sur 2 faits' in tid(pg, 'hub-myday').inner_text()
        pg.screenshot(path=SHOT + 'journee-fait.png')
        pg.reload(); pg.wait_for_timeout(3500)
        R['coche_apres_rechargement'] = tid(pg, 'hub-check-r-fait-1').get_attribute('aria-checked') == 'true' and tid(pg, 'hub-check-t-fait-1').get_attribute('aria-checked') == 'true'
        tid(pg, 'hub-check-r-fait-1').click(); pg.wait_for_timeout(1500)
        R['decocher_rappel'] = demo(pg, "s => (s.tables.daily_checks||[]).filter(c => c.reminder_id === 'r-fait-1').length") == 0
        tid(pg, 'hub-check-t-fait-1').click(); pg.wait_for_timeout(1500)
        R['decocher_tache'] = demo(pg, "s => s.tables.family_tasks.find(x => x.id === 't-fait-1').status") == 'todo'
    # Accès à « Mes notifications »
    pg.goto(B + '/profile'); pg.wait_for_timeout(2500)
    R['lien_espace'] = has(pg, 'hub-notifs'); R['lien_reglages_profil'] = has(pg, 'profile-notifs')
    tid(pg, 'hub-notifs').click(); pg.wait_for_timeout(2500)
    R['page_ouverte'] = pg.url.endswith('/settings/notifications') and 'Mes notifications' in pg.inner_text('body')
    body = pg.inner_text('body')
    R['contenu'] = all(x in body for x in ['Rendez-vous', 'Tâches du foyer', 'Échéances à préparer', 'Papiers qui expirent', 'Prochain biberon', 'Heures calmes', 'Les médicaments, traitements et biberons sonnent toujours'])
    R['honnete_web'] = 'arrivent sur l’application iPhone ou Android' in body
    R['prochaines_listees'] = 'Lessive (test)' in tid(pg, 'nt-next').inner_text()
    pg.screenshot(path=SHOT + 'reglages.png', full_page=True)
    # interrupteur « Tâches du foyer » : enregistré et retiré des prochaines notifications
    sw = tid(pg, 'nt-auto').get_by_role('switch').nth(1)
    sw.click(); pg.wait_for_timeout(1500)
    tid(pg, 'nt-to-8').click(); pg.wait_for_timeout(1200)
    prefs = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.auto-notifs-prefs.v1') || '{}'"))
    R['reglage_enregistre'] = prefs.get('tasks') is False and prefs.get('quietTo') == 8 and prefs.get('appointments') is True
    R['tache_retiree_des_prochaines'] = 'Lessive (test)' not in tid(pg, 'nt-next').inner_text()
    pg.reload(); pg.wait_for_timeout(3000)
    R['reglage_apres_rechargement'] = tid(pg, 'nt-auto').get_by_role('switch').nth(1).get_attribute('aria-checked') == 'false' and tid(pg, 'nt-to-8').get_attribute('aria-checked') == 'true'
    tid(pg, 'nt-reminders').click(); pg.wait_for_timeout(2000)
    R['lien_rappels'] = '/settings/reminders' in pg.url
    pg.goto(B + '/settings/notifications'); pg.wait_for_timeout(2500)
    tid(pg, 'nt-bottle').click(); pg.wait_for_timeout(2000)
    R['lien_biberon'] = '/track/bottle' in pg.url and 'introuvable' not in pg.inner_text('body').lower()
    pg.goto(B + '/settings'); pg.wait_for_timeout(2500)
    R['lien_reglages'] = has(pg, 'settings-notifs')
    # anglais
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/settings/notifications'); pg.wait_for_timeout(2500)
    R['anglais'] = 'My notifications' in pg.inner_text('body') and 'Quiet hours' in pg.inner_text('body')
    b.close()
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
