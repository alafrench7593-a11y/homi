"""
Mini-réseau social, fidélisation et Premium, de bout en bout (web de démonstration, données conservées sur l'appareil) :
accueil court (4 actions, une publication, une recommandation, « Voir la communauté », résumé du jour), suivre un membre,
fil « Abonnements », catégorie suivie, recherche de membres, sondage (vote), publication avec sondage et mention,
groupe du mois de naissance (mois seulement), publication dans un groupe, version gratuite complète, groupe privé
(Premium) avec invitation et épinglage, album partagé (photo sans GPS), profil personnalisé et badge, filtres avancés,
dossiers, résumé d'une longue discussion (extraits, sans IA en démonstration), journal d'activité, résumé du matin
(réglages + écran), comparatif Gratuit / Premium, fin d'abonnement (données conservées), conservation après rechargement.
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/social.py
"""
import json, os, re
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright
from PIL import Image

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TMP = os.path.join(SHOTS, 'photos'); os.makedirs(TMP, exist_ok=True)


def gps_photo(name, color):
    img = Image.new('RGB', (900, 700), color)
    exif = Image.Exif(); exif[0x010F] = 'TestPhone'; exif[0x8825] = {1: 'N', 2: (48.0, 51.0, 24.0), 3: 'E', 4: (2.0, 21.0, 7.0)}
    path = os.path.join(TMP, name); img.save(path, 'JPEG', exif=exif.tobytes(), quality=90)
    return path


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg): return pg.inner_text('body')
def tid(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def go(pg, path, wait=2600): pg.goto(B + path); pg.wait_for_timeout(wait)
def text(pg, t): return tid(pg, t).inner_text() if has(pg, t) else ''


def file_bytes(pg, path):
    import base64
    uri = demo(pg, f"s => (s.tables._files.find(f => f.path === '{path}') || {{}}).uri")
    return base64.b64decode(uri.split(',', 1)[1]) if uri and ',' in uri else b''


def confirm_modal(pg, label):
    btn = pg.get_by_role('button', name=label).filter(visible=True)
    if btn.count(): btn.last.click(); pg.wait_for_timeout(1200)


def premium(pg, me, on):
    exp = (datetime.now(timezone.utc) + (timedelta(days=30) if on else timedelta(days=-1))).isoformat()
    mutate(pg, f"""s => {{ s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== '{me}');
      s.tables.subscriptions.push({{ user_id: '{me}', status: '{'active' if on else 'expired'}', product_id: 'aufildenous_premium_monthly', store: 'test', period_type: 'monthly', expires_at: '{exp}', will_renew: {str(on).lower()} }}); }}""")


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('dialog', lambda d: d.accept())
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    me = demo(pg, "s => s.session.userId")
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina')")

    # ================================================================ Accueil court
    go(pg, '/', 3500)
    t = T(pg)
    R['accueil_carte_principale'] = has(pg, 'home-card-main')
    R['accueil_4_actions'] = has(pg, 'home-card-quick')
    R['accueil_publication_communaute'] = has(pg, 'home-community') and has(pg, 'home-see-community')
    R['accueil_recommandation'] = has(pg, 'home-card-recommendation')
    R['accueil_pas_de_fil_social'] = pg.locator('[data-testid^="post-"]').count() == 0 and not has(pg, 'home-card-assistant') and not has(pg, 'home-card-article')
    R['accueil_resume_du_jour'] = has(pg, 'home-today')
    tid(pg, 'home-see-community').click(); pg.wait_for_timeout(2500)
    R['accueil_voir_la_communaute'] = pg.url.rstrip('/').endswith('/community')

    # ================================================================ Profil communautaire (gratuit)
    go(pg, '/community/profile', 2800)
    tid(pg, 'profile-handle').fill('social_test'); tid(pg, 'profile-pseudo').fill('Sarah Test') if has(pg, 'profile-pseudo') else None
    sw = pg.get_by_role('switch', name='J’accepte les règles de la communauté')
    if sw.count(): sw.first.click()
    tid(pg, 'profile-save').click(); pg.wait_for_timeout(2000)
    R['profil_cree_gratuit'] = demo(pg, f"s => !!s.tables.community_profiles.find(p => p.user_id === '{me}' && p.handle === 'social_test')")

    # ================================================================ Rechercher un membre, le suivre, fil « Abonnements »
    go(pg, '/community', 3000)
    R['onglets_fils'] = all(has(pg, f'feed-tab-{m}') for m in ['foryou', 'following', 'recent', 'saved'])
    tid(pg, 'community-search').fill('@papa'); pg.wait_for_timeout(1800)
    R['recherche_membre'] = has(pg, 'member-results') and '@papadenour' in text(pg, 'member-results')
    tid(pg, 'follow-papadenour').click(); pg.wait_for_timeout(1500)
    R['suivre_membre_gratuit'] = demo(pg, f"s => s.tables.member_follows.some(f => f.follower_id === '{me}' && f.followee_id === 'demo-voisin-2')")
    go(pg, '/community?mode=following', 3000)
    R['fil_abonnements'] = 'Tableau de relais pour les nuits' in T(pg)
    R['abonnements_sans_anonyme'] = 'Je me sens loin de mon bébé' not in T(pg)
    # Catégorie suivie
    go(pg, '/community?space=sommeil', 3000)
    tid(pg, 'category-follow').click(); pg.wait_for_timeout(1200)
    R['categorie_suivie'] = demo(pg, f"s => s.tables.forum_subscriptions.some(x => x.user_id === '{me}' && x.forum_id === s.tables.posts.find(p => p.title === 'Réveils à 5 h du matin').forum_id)")

    # ================================================================ Sondage : voter
    poll = demo(pg, "s => s.tables.posts.find(p => p.title === 'À quelle heure couchez-vous votre bébé ?')")
    go(pg, f"/community/post/{poll['id']}", 3000)
    R['sondage_affiche'] = has(pg, 'poll') and 'votes anonymes' in text(pg, 'poll')
    opt = demo(pg, f"s => s.tables.poll_options.find(o => o.post_id === '{poll['id']}' && o.position === 2).id")
    tid(pg, f'poll-option-{opt}').click(); pg.wait_for_timeout(1500)
    R['sondage_vote'] = demo(pg, f"s => s.tables.poll_votes.some(v => v.user_id === '{me}' && v.option_id === '{opt}')") and '%' in text(pg, 'poll')

    # ================================================================ Publier un sondage avec une mention
    go(pg, '/community/new', 2800)
    tid(pg, 'composer-cat-sommeil').click() if has(pg, 'composer-cat-sommeil') else None
    tid(pg, 'composer-title').fill('Sieste du matin : à quelle heure ?')
    tid(pg, 'composer-body').fill('Petit sondage pour comparer. @maia'); pg.wait_for_timeout(1500)
    R['mention_suggestions'] = has(pg, 'composer-mentions') and '@maia_et_sohan' in text(pg, 'composer-mentions')
    pg.get_by_text('@maia_et_sohan', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(300)
    sw = pg.get_by_role('switch', name='Ajouter un sondage'); sw.first.click(); pg.wait_for_timeout(300)
    tid(pg, 'composer-poll-0').fill('Avant 9 h'); tid(pg, 'composer-poll-1').fill('Après 9 h')
    if not has(pg, 'composer-cat-sommeil'):
        tid(pg, 'composer-all-categories').click(); pg.wait_for_timeout(600); tid(pg, 'category-sommeil').click(); pg.wait_for_timeout(300)
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(3000)
    mine = demo(pg, "s => s.tables.posts.find(p => p.title === 'Sieste du matin : à quelle heure ?')")
    R['sondage_publie'] = bool(mine) and demo(pg, f"s => s.tables.poll_options.filter(o => o.post_id === '{mine['id']}').length") == 2 if mine else False
    R['mention_notifiee'] = demo(pg, "s => s.tables.notifications.some(n => n.user_id === 'demo-voisine-1' && n.category === 'community_mention')")
    R['mention_lien_profil'] = '@maia_et_sohan' in T(pg)

    # ================================================================ Groupe du mois de naissance (gratuit)
    go(pg, '/community/groups', 3000)
    month = lina['birth_date'][:7]
    R['groupe_mois_propose'] = has(pg, 'cohort-suggestions') and 'Lina' not in text(pg, 'cohort-suggestions')
    tid(pg, f'join-cohort-birth-{month}').click(); pg.wait_for_timeout(2500)
    gid = demo(pg, f"s => (s.tables.community_groups.find(g => g.kind === 'cohort' && g.cohort_month === '{month}-01') || {{}}).id")
    R['groupe_mois_rejoint'] = bool(gid) and demo(pg, f"s => s.tables.group_members.some(m => m.group_id === '{gid}' && m.user_id === '{me}')") and '/community/group/' in pg.url
    tid(pg, 'group-publish').click(); pg.wait_for_timeout(2500)
    tid(pg, 'composer-body').fill('Qui a des astuces pour les poussées dentaires ?')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(2500)
    R['publication_dans_groupe'] = demo(pg, f"s => s.tables.posts.some(p => p.group_id === '{gid}' && p.body.startsWith('Qui a des astuces'))")

    # ================================================================ Groupe privé : Premium (aperçu d'abord)
    go(pg, '/community/groups', 3000)
    tid(pg, 'group-create').click(); pg.wait_for_timeout(1200)
    R['groupe_prive_apercu_premium'] = has(pg, 'premium-preview') and 'Créez votre groupe privé de parents' in T(pg)
    premium(pg, me, True)
    go(pg, '/community/groups', 3000)
    tid(pg, 'group-create').click(); pg.wait_for_timeout(1000)
    tid(pg, 'group-name').fill('Copines de la maternité'); tid(pg, 'group-create-submit').click(); pg.wait_for_timeout(2500)
    pgid = demo(pg, "s => (s.tables.community_groups.find(g => g.name === 'Copines de la maternité') || {}).id")
    R['groupe_prive_cree'] = bool(pgid) and '/community/group/' in pg.url
    tid(pg, 'group-invite').click(); pg.wait_for_timeout(700)
    tid(pg, 'group-invite-handle').fill('@clem_2026'); tid(pg, 'group-invite-send').click(); pg.wait_for_timeout(1500)
    R['invitation_envoyee'] = demo(pg, f"s => s.tables.group_invitations.some(i => i.group_id === '{pgid}' && i.invited_id === 'demo-voisine-3' && i.status === 'pending')") \
        and demo(pg, "s => s.tables.notifications.some(n => n.user_id === 'demo-voisine-3' && n.category === 'community_group')")
    tid(pg, 'group-publish').click(); pg.wait_for_timeout(2500)
    tid(pg, 'composer-body').fill('Bienvenue dans notre groupe !'); tid(pg, 'composer-publish').click(); pg.wait_for_timeout(2500)
    ppost = demo(pg, f"s => s.tables.posts.find(p => p.group_id === '{pgid}')")
    go(pg, f'/community/group/{pgid}', 3000)
    tid(pg, 'post-menu').click(); pg.wait_for_timeout(600)
    tid(pg, 'post-pin').click(); pg.wait_for_timeout(1500)
    R['epingler_dans_groupe'] = demo(pg, f"s => !!s.tables.posts.find(p => p.id === '{ppost['id']}').pinned_at") and 'Épinglée' in T(pg)
    go(pg, '/community?mode=recent', 3000)
    R['groupe_prive_hors_fils'] = 'Bienvenue dans notre groupe' not in T(pg)

    # ================================================================ Album partagé : photo sans GPS
    go(pg, '/community/albums', 3000)
    tid(pg, 'album-create').click(); pg.wait_for_timeout(800)
    tid(pg, 'album-title').fill('Premiers pas'); tid(pg, 'album-create-submit').click(); pg.wait_for_timeout(2500)
    aid = demo(pg, "s => (s.tables.community_albums.find(a => a.title === 'Premiers pas') || {}).id")
    with pg.expect_file_chooser() as fc:
        tid(pg, 'album-add').click()
    fc.value.set_files([gps_photo('album.jpg', (120, 200, 160))]); pg.wait_for_timeout(4000)
    path = demo(pg, f"s => (s.tables.album_photos.find(p => p.album_id === '{aid}') || {{}}).path")
    raw = file_bytes(pg, path) if path else b''
    R['album_photo_ajoutee'] = bool(path) and has(pg, 'album-photos')
    R['album_photo_sans_gps'] = bool(raw) and b'Exif' not in raw and b'TestPhone' not in raw and b'GPS' not in raw
    tid(pg, 'album-share').click(); pg.wait_for_timeout(600)
    tid(pg, 'album-share-handle').fill('papadenour'); tid(pg, 'album-share-send').click(); pg.wait_for_timeout(1500)
    R['album_partage_choisi'] = demo(pg, f"s => s.tables.album_shares.some(x => x.album_id === '{aid}' && x.user_id === 'demo-voisin-2')")

    # ================================================================ Profil personnalisé et badge (Premium)
    go(pg, '/community/profile', 3000)
    tid(pg, 'accent-menthe').click(); tid(pg, 'banner-prairie').click()
    tid(pg, 'profile-about').fill('Maman de Lina. J’aime les balades et les recettes simples.')
    pg.get_by_role('switch', name='Afficher un badge Premium').first.click()
    tid(pg, 'profile-custom-save').click(); pg.wait_for_timeout(1800)
    prof = demo(pg, f"s => s.tables.community_profiles.find(p => p.user_id === '{me}')")
    R['profil_personnalise'] = prof.get('accent') == 'menthe' and prof.get('banner') == 'prairie' and prof.get('show_premium_badge') is True
    go(pg, '/community/u/social_test', 3000)
    R['badge_premium_discret'] = has(pg, 'premium-badge')

    # ================================================================ Filtres avancés, dossiers, résumé, journal
    go(pg, '/community', 3000)
    tid(pg, 'community-filters').click(); pg.wait_for_timeout(800)
    pg.get_by_text('Sondages', exact=True).filter(visible=True).first.click()
    tid(pg, 'filters-apply').click(); pg.wait_for_timeout(2000)
    R['filtres_avances'] = has(pg, 'filters-count') and 'avec vos filtres' in text(pg, 'filters-count') and 'À quelle heure couchez-vous' in T(pg) and 'Tableau de relais' not in T(pg)
    go(pg, f"/community/post/{poll['id']}", 3000)
    tid(pg, 'post-save').click(); pg.wait_for_timeout(1000)
    tid(pg, 'post-menu').click(); pg.wait_for_timeout(500)
    tid(pg, 'post-folder').click(); pg.wait_for_timeout(700)
    pg.get_by_label('Nouveau dossier').fill('Sommeil'); tid(pg, 'folder-create').click(); pg.wait_for_timeout(1200)
    pg.get_by_text('Sommeil', exact=True).filter(visible=True).last.click(); pg.wait_for_timeout(1200)
    R['dossier_enregistrements'] = demo(pg, f"s => {{ const f = s.tables.saved_folders.find(x => x.user_id === '{me}' && x.name === 'Sommeil'); return !!f && s.tables.saved_posts.some(x => x.user_id === '{me}' && x.folder_id === f.id); }}")
    # Longue discussion : 6 réponses → résumé (extraits sans IA en démonstration)
    long = demo(pg, "s => s.tables.posts.find(p => p.title === 'Réveils à 5 h du matin')")
    mutate(pg, f"""s => {{ const p = s.tables.posts.find(x => x.id === '{long['id']}');
      for (let i = 0; i < 6; i++) {{ s.tables.comments.push({{ id: 'c-long-' + i, post_id: p.id, parent_id: null, author_id: i % 2 ? 'demo-voisine-1' : 'demo-voisine-3', body: 'Chez nous, décaler le coucher de quinze minutes a aidé au bout de ' + (i + 3) + ' jours.', status: 'visible', report_count: 0, created_at: new Date(Date.now() - (10 - i) * 60000).toISOString() }}); p.comment_count += 1; }} }}""")
    go(pg, f"/community/post/{long['id']}", 3200)
    tid(pg, 'ai-summarize').click(); pg.wait_for_timeout(1800)
    R['resume_discussion'] = 'L’essentiel de la discussion' in text(pg, 'ai-summary') and 'sans IA' in text(pg, 'ai-summary')
    go(pg, '/community/activity', 3000)
    R['journal_activite'] = has(pg, 'activity-list') and 'Sieste du matin' in text(pg, 'activity-list')

    # ================================================================ Résumé du matin : réglages + écran
    go(pg, '/community/notifications', 3000)
    pg.get_by_role('switch', name='Résumé du matin').first.click(); pg.wait_for_timeout(1200)
    pg.get_by_text('7 h 30', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    d = demo(pg, f"s => s.tables.daily_digest_prefs.find(x => x.user_id === '{me}')")
    R['resume_matin_choisi'] = bool(d) and d['morning'] is True and d['morning_time'].startswith('07:30') and d['evening'] is False
    R['notifications_par_type'] = all(x in T(pg) for x in ['Mentions', 'Nouveaux abonné·es', 'Publications des membres suivis', 'Activité de mes groupes privés'])
    go(pg, '/today?moment=morning', 3500)
    R['ecran_resume_matin'] = has(pg, 'digest-items') and has(pg, 'digest-question') and 'Résumé du matin' in T(pg)
    R['resume_sans_culpabilite'] = not re.search(r'rien noté|vous avez oublié|pensez à noter', T(pg), re.I)
    tid(pg, 'digest-question-share').click(); pg.wait_for_timeout(2500)
    R['question_du_jour_partageable'] = '/community/new' in pg.url and len(tid(pg, 'composer-title').input_value()) > 10

    # ================================================================ Comparatif Gratuit / Premium
    go(pg, '/settings/subscription', 3200)
    t = T(pg)
    R['comparatif_communaute'] = 'Groupes privés et invitations' in t and 'suivre des membres et des catégories' in t and has(pg, 'no-targeted-ads')

    # ================================================================ Fin d'abonnement : rien n'est supprimé
    premium(pg, me, False)
    go(pg, f'/community/group/{pgid}', 3200)
    R['fin_abonnement_groupe_conserve'] = 'Bienvenue dans notre groupe' in T(pg) and 'continue de fonctionner' in T(pg)
    go(pg, '/community/albums', 3000)
    R['fin_abonnement_album_conserve'] = has(pg, f'album-{aid}')
    go(pg, '/community/u/social_test', 3000)
    R['fin_abonnement_badge_retire'] = not has(pg, 'premium-badge')
    R['fin_abonnement_dossier_conserve'] = demo(pg, f"s => s.tables.saved_folders.some(x => x.user_id === '{me}')")
    go(pg, '/community/groups', 3000)
    tid(pg, 'group-create').click(); pg.wait_for_timeout(1000)
    R['fin_abonnement_nouveau_groupe_en_pause'] = has(pg, 'premium-preview')

    # ================================================================ Conservation après rechargement
    pg.reload(); pg.wait_for_timeout(3500)
    go(pg, '/community/following', 3000)
    R['conservation_rechargement'] = '@papadenour' in T(pg) and demo(pg, f"s => s.tables.group_members.some(m => m.group_id === '{gid}' && m.user_id === '{me}')")
    pg.screenshot(path=f'{SHOTS}/social-following.png', full_page=True)
    b.close()


with sync_playwright() as p:
    run(p)
ok = sum(1 for v in R.values() if v is True)
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
print(f'social: OK {ok} / {len(R)} false={sum(1 for v in R.values() if v is not True)} err={len(errs)}')
