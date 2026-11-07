"""
Améliorations du 07/11/2026 — version web de démonstration :
  - « Donner mon avis » : envoi, suivi visible, statut changé par l'équipe (écran réservé), suppression ;
  - « Confier à … » en un geste sur une tâche qui m'est confiée ;
  - carte de soutien après plusieurs jours d'humeur basse (masquable pour la semaine) ;
  - réglages : rappel hebdomadaire du bilan d'humeur et widget « Bébé » détaillé.
Le widget lui-même (iOS) et les notifications ne sont pas testables sur le web.
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from journey_seed import SIMPLE_OFF
B = 'http://127.0.0.1:8822'; R = {}; errs = []
SHOT = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e') + '/ameli-'
os.makedirs(os.path.dirname(SHOT), exist_ok=True)
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def demo(pg, js): return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); return (" + js + ")(s); }")
def mutate(pg, js): pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(3000)

    # 1. Donner mon avis
    pg.goto(B + '/profile'); pg.wait_for_timeout(3000)
    R['avis_lien_profil'] = has(pg, 'profile-feedback')
    tid(pg, 'profile-feedback').scroll_into_view_if_needed(); tid(pg, 'profile-feedback').click(); pg.wait_for_timeout(2500)
    R['avis_ecran'] = '/feedback' in pg.url and 'Donner mon avis' in pg.inner_text('body')
    tid(pg, 'fb-send').click(); pg.wait_for_timeout(800)
    R['avis_vide_refuse'] = 'Écrivez quelques mots' in pg.inner_text('body')
    tid(pg, 'fb-kind-idea').click(); pg.wait_for_timeout(300)
    box = tid(pg, 'fb-body'); (box.locator('textarea, input').first if box.locator('textarea, input').count() else box).fill('Une liste de courses partagée avec mon conjoint')
    tid(pg, 'fb-send').click(); pg.wait_for_timeout(2000)
    row = demo(pg, "s => { const f = (s.tables.app_feedback||[])[0]; return f ? { kind: f.kind, body: f.body, screen: f.screen, platform: f.platform, status: f.status, own: f.user_id === s.session.userId } : null }")
    R['avis_enregistre'] = bool(row) and row['kind'] == 'idea' and row['screen'] == '/profile' and row['platform'] == 'web' and row['status'] == 'new' and row['own']
    R['avis_merci'] = 'Merci ! Votre avis est bien envoyé.' in pg.inner_text('body')
    R['avis_suivi_visible'] = 'Mes avis et leur suivi' in pg.inner_text('body') and 'Reçu' in pg.inner_text('body')
    pg.screenshot(path=SHOT + 'avis.png', full_page=True)
    # équipe : écran réservé aux rôles moderator/admin
    pg.goto(B + '/admin/feedback'); pg.wait_for_timeout(2500)
    R['avis_equipe_reserve'] = 'Réservé à l’équipe de modération' in pg.inner_text('body')
    mutate(pg, "s => { s.tables.user_roles = [...(s.tables.user_roles||[]), { user_id: s.session.userId, role: 'moderator' }] }")
    pg.reload(); pg.wait_for_timeout(3000)
    fid = demo(pg, "s => s.tables.app_feedback[0].id")
    R['avis_equipe_lit'] = has(pg, f'fba-{fid}') and 'Une liste de courses partagée' in pg.inner_text('body')
    tid(pg, f'fba-{fid}-planned').click(); pg.wait_for_timeout(1500)
    R['avis_statut_change'] = demo(pg, "s => s.tables.app_feedback[0].status") == 'planned'
    pg.goto(B + '/feedback'); pg.wait_for_timeout(2500)
    R['avis_suivi_mis_a_jour'] = tid(pg, f'fb-status-{fid}').inner_text() == 'Prévu'

    # 2. Confier à l'autre parent
    mutate(pg, """s => { const me = s.session.userId; const hid = s.tables.household_members.find(m => m.user_id === me).household_id;
      if (!s.tables.household_members.some(m => m.household_id === hid && m.user_id !== me)) s.tables.household_members.push({ household_id: hid, user_id: 'partner-test', role: 'coparent', domains: null, child_scope: null, created_at: new Date().toISOString() });
      const d = new Date(); d.setHours(18, 0, 0, 0);
      s.tables.family_tasks.push({ id: 't-confier', household_id: hid, title: 'Bain (test)', status: 'todo', due_at: d.toISOString(), assignee_id: me, created_by: me, category: 'other', priority: 'normal', essential: false, recurrence: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), done_at: null, done_by: null }); }""")
    pg.goto(B + '/family'); pg.wait_for_timeout(3500)
    R['confier_bouton'] = has(pg, 'family-give-t-confier')
    if R['confier_bouton']:
        label = tid(pg, 'family-give-t-confier').inner_text()
        tid(pg, 'family-give-t-confier').click(); pg.wait_for_timeout(1800)
        other = demo(pg, "s => s.tables.family_tasks.find(t => t.id === 't-confier').assignee_id")
        R['confier_un_geste'] = other not in (None, demo(pg, "s => s.session.userId"))
        R['confier_libelle'] = label.startswith('Confier à')
        R['confier_disparait'] = not has(pg, 'family-give-t-confier')

    # 3. Carte de soutien après 3 jours d'humeur basse
    pg.goto(B + '/profile'); pg.wait_for_timeout(2500)
    R['pas_de_carte_sans_raison'] = not has(pg, 'profile-mood-support')
    mutate(pg, """s => { const me = s.session.userId; const mk = (n, mood) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(9, 0, 0, 0); return { id: 'mood-t' + n, user_id: me, checked_at: d.toISOString(), mood, feelings: ['Fatigue'], safety_concern: false, journal: null }; };
      s.tables.mood_checkins = [...(s.tables.mood_checkins||[]).filter(m => m.user_id !== me), mk(0, 2), mk(2, 1), mk(4, 2)]; }""")
    pg.reload(); pg.wait_for_timeout(3500)
    R['carte_soutien'] = has(pg, 'profile-mood-support') and 'Ces derniers jours ont l’air lourds' in pg.inner_text('body') and '3114' in pg.inner_text('body')
    R['carte_sans_diagnostic'] = all(x not in pg.inner_text('body').lower() for x in ['dépression', 'score', 'c’est normal'])
    pg.screenshot(path=SHOT + 'soutien.png')
    tid(pg, 'profile-mood-support-relay').click(); pg.wait_for_timeout(2000)
    R['carte_relais'] = '/family/offduty' in pg.url
    pg.goto(B + '/profile'); pg.wait_for_timeout(3000)
    tid(pg, 'profile-mood-support-hide').click(); pg.wait_for_timeout(800)
    pg.reload(); pg.wait_for_timeout(3000)
    R['carte_masquee_semaine'] = not has(pg, 'profile-mood-support')
    pg.goto(B + '/me/mood'); pg.wait_for_timeout(3000)
    R['ecran_humeur_ok'] = 'introuvable' not in pg.inner_text('body').lower()

    # 4. Réglages
    pg.goto(B + '/settings/notifications'); pg.wait_for_timeout(2500)
    body = pg.inner_text('body')
    R['reglages_humeur_widget'] = 'Rappel de mon bilan d’humeur' in body and 'Widget « Bébé » (iPhone)' in body and 'Jamais le nom d’un médicament' in body
    pg.get_by_role('switch', name='Rappel de mon bilan d’humeur').first.click(); pg.wait_for_timeout(800)
    pg.get_by_role('switch', name='Afficher les heures dans le widget').first.click(); pg.wait_for_timeout(1000)
    pr = json.loads(pg.evaluate("() => localStorage.getItem('toietmoi.auto-notifs-prefs.v1') || '{}'"))
    R['reglages_enregistres'] = pr.get('weeklyMood') is True and pr.get('widgetDetails') is True
    R['prochaine_humeur_listee'] = 'bilan d’humeur' in tid(pg, 'nt-next').inner_text()
    pg.goto(B + '/settings'); pg.wait_for_timeout(2500)
    R['avis_lien_reglages'] = has(pg, 'settings-feedback')
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1800)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(2000)
    pg.goto(B + '/feedback'); pg.wait_for_timeout(2500)
    R['anglais'] = 'Give feedback' in pg.inner_text('body')
    b.close()
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
