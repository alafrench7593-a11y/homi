"""
Communauté et cartes de suivi de bout en bout (web de démonstration, données conservées sur l'appareil) :
profil communautaire (identifiant @ unique, présentation, illustration, photo SANS métadonnées), publication texte +
photos (géolocalisation retirée avant l'envoi), avertissement d'information sensible, anonymat, commentaire, réponse,
modification et suppression, j'aime, enregistrer, profil d'un membre (visibilité respectée), signaler et bloquer,
préférences de notifications, notification qui ouvre le commentaire, conservation après rechargement, onglet « Moi »
(profil communautaire / compte privé), barre de navigation, cartes de suivi selon le profil (et mode nuit).
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/communaute.py
"""
import base64, io, json, os, re, sys
from playwright.sync_api import sync_playwright
from PIL import Image

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []
TMP = os.path.join(SHOTS, 'photos'); os.makedirs(TMP, exist_ok=True)


def gps_photo(name, color):
    """JPEG avec métadonnées EXIF : appareil et position GPS (à retirer avant l'envoi)."""
    img = Image.new('RGB', (1200, 900), color)
    for x in range(0, 1200, 60):
        for y in range(0, 900, 60):
            img.putpixel((x, y), (255, 255, 255))
    exif = Image.Exif()
    exif[0x010F] = 'TestPhone'          # Make
    exif[0x0110] = 'Modele Secret'      # Model
    gps = {1: 'N', 2: (48.0, 51.0, 24.0), 3: 'E', 4: (2.0, 21.0, 7.0)}
    exif[0x8825] = gps                  # GPSInfo
    path = os.path.join(TMP, name)
    img.save(path, 'JPEG', exif=exif.tobytes(), quality=90)
    raw = open(path, 'rb').read()
    assert b'Exif' in raw and b'TestPhone' in raw
    return path


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg):
    return pg.inner_text('body')


def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def has(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0


def go(pg, path, wait=2500):
    pg.goto(B + path); pg.wait_for_timeout(wait)


def text(pg, t):
    return tid(pg, t).inner_text() if has(pg, t) else ''


def file_bytes(pg, path):
    uri = demo(pg, f"s => (s.tables._files.find(f => f.path === '{path}') || {{}}).uri")
    if not uri or ',' not in uri:
        return b''
    return base64.b64decode(uri.split(',', 1)[1])


def clean(raw):
    """Aucune métadonnée : ni segment Exif / XMP, ni marque de l'appareil, ni GPS."""
    return bool(raw) and raw[:2] == b'\xff\xd8' and b'Exif' not in raw and b'TestPhone' not in raw and b'Modele Secret' not in raw and b'GPS' not in raw


def confirm_modal(pg, label):
    btn = pg.get_by_role('button', name=label).filter(visible=True)
    if btn.count():
        btn.last.click(); pg.wait_for_timeout(1200)


def pick_files(pg, test_id, paths):
    with pg.expect_file_chooser() as fc:
        tid(pg, test_id).click()
    fc.value.set_files(paths)
    pg.wait_for_timeout(3500)


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
    lina = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Lina').id")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")

    # ================================================================ Barre de navigation
    go(pg, '/', 3000)
    dock = [pg.locator('[role="tab"]').nth(i).get_attribute('aria-label') for i in range(pg.locator('[role="tab"]').count())]
    R['barre_onglets'] = all(x in dock for x in ['Accueil', 'Suivi', 'Communauté', 'Questions']) and 'Moi' not in dock and any((x or '').startswith('Mon profil') for x in dock)

    # ================================================================ Profil communautaire : identifiant, présentation, illustration
    go(pg, '/community/profile', 2800)
    tid(pg, 'profile-handle').fill('papadenour'); tid(pg, 'profile-save').click(); pg.wait_for_timeout(1500)
    R['identifiant_unique'] = 'déjà pris' in T(pg)
    tid(pg, 'profile-handle').fill('@Camille_Test'); pg.wait_for_timeout(200)
    R['identifiant_apercu_arobase'] = '@camille_test' in T(pg)
    tid(pg, 'profile-bio-input').fill('Maman de jumeaux bientôt, curieuse et bienveillante.')
    tid(pg, 'journey-jumeaux').click(); tid(pg, 'preset-leaf').click()
    tid(pg, 'profile-save').click(); pg.wait_for_timeout(1800)
    prof = demo(pg, f"s => s.tables.community_profiles.find(p => p.user_id === '{me}')")
    R['profil_enregistre'] = prof['handle'] == 'camille_test' and prof['bio'].startswith('Maman de jumeaux') and prof['journey_label'] == 'jumeaux' and prof['avatar_preset'] == 'leaf'

    # Photo de profil : nettoyée (aucune métadonnée), puis supprimée
    go(pg, '/community/profile', 2800)
    pick_files(pg, 'profile-photo-pick', [gps_photo('avatar.jpg', (200, 120, 160))])
    av = demo(pg, f"s => s.tables.community_profiles.find(p => p.user_id === '{me}').avatar_path")
    R['avatar_photo_ajoutee'] = bool(av) and av.startswith(me + '/')
    R['avatar_sans_metadonnees'] = clean(file_bytes(pg, av)) if av else False
    tid(pg, 'profile-photo-remove').click(); pg.wait_for_timeout(600); confirm_modal(pg, 'Retirer')
    R['avatar_supprime_definitivement'] = demo(pg, f"s => s.tables.community_profiles.find(p => p.user_id === '{me}').avatar_path") is None and file_bytes(pg, av) == b''

    # ================================================================ Publication avec photos (GPS retiré)
    go(pg, '/community/new', 2800)
    tid(pg, 'composer-all-categories').click(); pg.wait_for_timeout(700); tid(pg, 'category-jumeaux-triples').click(); pg.wait_for_timeout(400)
    pg.get_by_text('Témoignage', exact=True).filter(visible=True).first.click()
    tid(pg, 'composer-title').fill('Nos premières semaines')
    tid(pg, 'composer-body').fill('Témoignage : préparer les biberons à l’avance nous a sauvés. Et vous, quelle astuce ?')
    pick_files(pg, 'composer-add-photo', [gps_photo('a.jpg', (90, 140, 200)), gps_photo('b.jpg', (220, 180, 90))])
    R['photos_previsualisees'] = pg.locator('[data-testid="composer-photos"] img').count() >= 2
    pg.get_by_text('Aperçu', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(500)
    R['apercu_avant_publication'] = has(pg, 'composer-preview') and '@camille_test' in text(pg, 'composer-preview') and 'Nos premières semaines' in text(pg, 'composer-preview')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(3500)
    post = demo(pg, "s => s.tables.posts.find(p => p.title === 'Nos premières semaines')")
    photos = demo(pg, f"s => s.tables.post_photos.filter(x => x.post_id === '{post['id']}').map(x => x.path)") if post else []
    R['publication_photos_enregistrees'] = bool(post) and post['kind'] == 'testimony' and len(photos) == 2 and '/community/post/' in pg.url
    R['photos_sans_gps_ni_appareil'] = len(photos) == 2 and all(clean(file_bytes(pg, ph)) for ph in photos)
    sizes = [len(file_bytes(pg, ph)) for ph in photos]
    R['photos_compressees'] = all(0 < s < 3 * 1024 * 1024 for s in sizes)
    R['photos_affichees'] = pg.locator('img').count() >= 2 and has(pg, 'post-testimony-note')

    # ================================================================ Information sensible : avertissement avant publication
    go(pg, '/community/new', 2800)
    tid(pg, 'composer-cat-grossesse').click()
    tid(pg, 'composer-body').fill('Appelez-moi au 06 12 34 56 78 pour échanger')
    R['avertissement_en_direct'] = 'numéro de téléphone' in text(pg, 'composer-hint')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(900)
    R['avertissement_avant_publier'] = has(pg, 'composer-preview') and 'Avant de publier' in T(pg) and demo(pg, "s => s.tables.posts.filter(p => p.body.startsWith('Appelez-moi')).length") == 0
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(800); confirm_modal(pg, 'Publier quand même'); pg.wait_for_timeout(1500)
    R['sensible_mis_en_relecture'] = demo(pg, "s => (s.tables.posts.find(p => p.body.startsWith('Appelez-moi')) || {}).status") == 'pending_review'

    # ================================================================ Publication anonyme
    go(pg, '/community/new', 2800)
    tid(pg, 'composer-cat-grossesse').click()
    tid(pg, 'composer-body').fill('Je me sens parfois dépassée, est-ce normal à 26 semaines ?')
    pg.get_by_text('Anonyme', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(300)
    R['anonymat_explique'] = has(pg, 'composer-anon-help')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(2500)
    R['publication_anonyme'] = demo(pg, "s => (s.tables.posts.find(p => p.body.startsWith('Je me sens parfois')) || {}).anonymous") is True and 'Anonyme (vous)' in T(pg) and '@camille_test' not in text(pg, 'post-full')

    # ================================================================ Commenter, répondre, modifier, supprimer
    target = demo(pg, "s => s.tables.posts.find(p => p.title === 'Réveils à 5 h du matin').id")
    go(pg, f'/community/post/{target}', 3000)
    tid(pg, 'comment-input').fill('Chez nous, un coucher un peu plus tard a aidé.'); tid(pg, 'comment-send').click(); pg.wait_for_timeout(1500)
    mine = demo(pg, f"s => s.tables.comments.find(c => c.author_id === '{me}' && c.post_id === '{target}')")
    R['commentaire_publie'] = bool(mine)
    pg.get_by_role('button', name='Répondre').filter(visible=True).first.click(); pg.wait_for_timeout(300)
    tid(pg, 'comment-input').fill('Merci pour ce retour !'); tid(pg, 'comment-send').click(); pg.wait_for_timeout(1500)
    R['reponse_a_un_commentaire'] = demo(pg, f"s => s.tables.comments.some(c => c.author_id === '{me}' && c.parent_id && c.body === 'Merci pour ce retour !')")
    pg.get_by_role('button', name='Modifier').filter(visible=True).first.click(); pg.wait_for_timeout(500)
    tid(pg, 'comment-edit-input').fill('Chez nous, décaler le coucher de 20 minutes a aidé.'); tid(pg, 'comment-edit-save').click(); pg.wait_for_timeout(1500)
    R['commentaire_modifie'] = demo(pg, f"s => s.tables.comments.some(c => c.author_id === '{me}' && c.body.startsWith('Chez nous, décaler') && c.edited_at)") and 'modifié' in T(pg)
    n_before = demo(pg, f"s => s.tables.comments.filter(c => c.author_id === '{me}').length")
    pg.get_by_role('button', name='Supprimer').filter(visible=True).last.click(); pg.wait_for_timeout(600); confirm_modal(pg, 'Supprimer')
    R['commentaire_supprime'] = demo(pg, f"s => s.tables.comments.filter(c => c.author_id === '{me}').length") < n_before

    # ================================================================ J'aime, enregistrer, retrouver dans « Moi »
    tid(pg, 'post-like').click(); pg.wait_for_timeout(900)
    tid(pg, 'post-save').click(); pg.wait_for_timeout(900)
    R['aimer_enregistrer'] = demo(pg, f"s => s.tables.post_likes.some(l => l.post_id === '{target}' && l.user_id === '{me}') && s.tables.saved_posts.some(l => l.post_id === '{target}' && l.user_id === '{me}')")
    go(pg, '/moi', 3000)
    R['moi_profil_communautaire'] = has(pg, 'moi-community') and '@camille_test' in text(pg, 'profile-header') and 'Maman de jumeaux' in text(pg, 'profile-header')
    R['moi_compteurs'] = re.search(r'3\s*publications', text(pg, 'profile-stats').replace('\n', ' ')) is not None
    R['moi_mes_publications'] = 'Nos premières semaines' in text(pg, 'profile-tabs') and 'Je me sens parfois' in text(pg, 'profile-tabs')
    tid(pg, 'profile-tab-Réponses').click(); pg.wait_for_timeout(800)
    R['moi_mes_reponses'] = 'Chez nous, décaler' in text(pg, 'profile-tabs')
    tid(pg, 'profile-tab-Photos').click(); pg.wait_for_timeout(1200)
    R['moi_mes_photos'] = pg.locator('[data-testid="profile-photos"] img').count() >= 2
    tid(pg, 'profile-tab-Enregistrés').click(); pg.wait_for_timeout(800)
    R['moi_enregistres'] = 'Réveils à 5 h du matin' in text(pg, 'profile-tabs')
    pg.get_by_text('Aimées', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(800)
    R['moi_aimees'] = 'Réveils à 5 h du matin' in text(pg, 'profile-tabs')
    R['moi_aucune_donnee_privee'] = not re.search(r'Lina|Noé|26 SA|Petite Lune|biberon de|médicament', text(pg, 'profile-header'))
    pg.screenshot(path=f'{SHOTS}/communaute_moi.png', full_page=True)
    pg.get_by_text('Compte privé', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    acc = text(pg, 'moi-account')
    R['moi_compte_prive'] = all(x in acc for x in ['Lina', 'Noé', 'Abonnement', 'Notifications', 'Confidentialité', 'Personnes bloquées', 'Sécurité', 'Aide', 'Exporter mes données', 'Supprimer mon compte']) and has(pg, 'moi-sign-out')
    pg.screenshot(path=f'{SHOTS}/communaute_compte.png', full_page=True)

    # ================================================================ Modifier puis supprimer sa publication (photos effacées)
    go(pg, f"/community/new?edit={post['id']}", 3000)
    tid(pg, 'composer-body').fill('Témoignage modifié : préparer les biberons à l’avance nous a vraiment sauvés.')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(2500)
    R['publication_modifiee'] = demo(pg, f"s => (s.tables.posts.find(p => p.id === '{post['id']}') || {{}}).body").startswith('Témoignage modifié') and 'modifiée' in T(pg)
    tid(pg, 'post-menu').click(); pg.wait_for_timeout(500)
    pg.get_by_text('Supprimer définitivement', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(600); confirm_modal(pg, 'Supprimer')
    R['publication_supprimee_definitivement'] = demo(pg, f"s => s.tables.posts.some(p => p.id === '{post['id']}')") is False \
        and demo(pg, f"s => s.tables.post_photos.filter(x => x.post_id === '{post['id']}').length") == 0 and all(file_bytes(pg, ph) == b'' for ph in photos)

    # ================================================================ Profil d'un autre membre (visibilité respectée)
    go(pg, f'/community/post/{target}', 3000)
    tid(pg, 'post-author').click(); pg.wait_for_timeout(2500)
    R['ouvrir_profil_membre'] = '/community/u/' in pg.url and has(pg, 'member-profile') and 'Toujours partante' in text(pg, 'profile-header')
    go(pg, '/community/u/clem_2026', 2800)
    R['profil_discret_respecte'] = has(pg, 'member-profile') and 'profil discret' in text(pg, 'profile-header') and not has(pg, 'profile-stats')

    # ================================================================ Signaler et bloquer un membre
    go(pg, '/community/u/papadenour', 2800)
    tid(pg, 'member-report').click(); pg.wait_for_timeout(600); tid(pg, 'report-harassment').click(); pg.wait_for_timeout(1200)
    R['signaler_membre'] = demo(pg, "s => s.tables.reports.some(r => r.reported_user === 'demo-voisin-2' && r.reason === 'harassment')")
    tid(pg, 'member-block').click(); pg.wait_for_timeout(600); confirm_modal(pg, 'Bloquer')
    R['bloquer_membre'] = demo(pg, f"s => s.tables.user_blocks.some(x => x.blocker_id === '{me}' && x.blocked_id === 'demo-voisin-2')")
    go(pg, '/community?mode=recent', 3000)
    R['contenus_bloques_masques'] = 'PapaDeNour' not in T(pg)
    go(pg, '/community/blocked', 2500)
    pg.get_by_role('button', name='Débloquer').filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    R['debloquer'] = demo(pg, f"s => s.tables.user_blocks.some(x => x.blocker_id === '{me}' && x.blocked_id === 'demo-voisin-2')") is False

    # ================================================================ Notifications : réglages et ouverture du commentaire
    go(pg, '/community/notifications', 2500)
    pg.get_by_role('switch', name='Réactions').filter(visible=True).first.click(); pg.wait_for_timeout(1200)
    R['notifications_desactivables'] = demo(pg, f"s => (s.tables.community_notification_prefs.find(x => x.user_id === '{me}') || {{}}).reaction") is False
    cid = demo(pg, f"s => s.tables.comments.find(c => c.post_id === '{target}' && c.author_id !== '{me}').id")
    mutate(pg, f"""s => s.tables.notifications.push({{ id: 'e2e-notif', user_id: '{me}', category: 'community_reply', title: 'PapaDeNour a répondu à votre commentaire', body: 'Avec plaisir', deep_link: '/community/post/{target}?comment={cid}', payload: {{ post_id: '{target}', comment_id: '{cid}' }}, read_at: null, created_at: new Date().toISOString() }})""")
    go(pg, '/notifications', 2800)
    pg.get_by_text('PapaDeNour a répondu à votre commentaire').filter(visible=True).first.click(); pg.wait_for_timeout(3000)
    R['notification_ouvre_commentaire'] = f'comment={cid}' in pg.url and has(pg, 'comment-focused')

    # ================================================================ Conservation après fermeture (rechargement complet)
    pg.reload(); pg.wait_for_timeout(3500)
    go(pg, '/moi', 3000)
    R['donnees_conservees'] = '@camille_test' in text(pg, 'profile-header') and 'Je me sens parfois' in text(pg, 'profile-tabs')

    # ================================================================ Cartes de suivi selon le profil
    def subject(key):
        go(pg, '/', 2500)
        tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
        tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(1200)

    def track_of(key):
        """Écran Suivi, puis profil choisi avec le sélecteur de cet écran. Le profil est choisi APRÈS le chargement : sur une
        version configurée avec Supabase, la reprise de la démo au chargement efface le profil enregistré (bug documenté
        dans cocon.py, profil_affiche_conserve_au_rechargement)."""
        go(pg, '/track', 3200)
        tid(pg, 'profile-switcher').click(); pg.wait_for_timeout(700)
        tid(pg, f'subject-{key}').click(); pg.wait_for_timeout(2000)
    track_of(lina)
    cards = [k for k in ['bottle', 'breastfeed', 'diaper', 'sleep', 'meal', 'medication', 'appointment', 'mother_sleep', 'mood'] if has(pg, f'track-card-{k}')]
    R['cartes_bebe_diversification'] = set(cards) == {'meal', 'sleep', 'bottle', 'diaper'}
    R['carte_derniere_info_biberon'] = bool(re.match(r'Dernier biberon (à|hier à) \d+ h( \d\d)? – \d+ ml', text(pg, 'track-info-bottle')))
    R['carte_derniere_info_change'] = text(pg, 'track-info-diaper').startswith('Dernier change')
    R['carte_ajout_rapide_visible'] = all(has(pg, f'track-add-{k}') for k in cards)
    pg.screenshot(path=f'{SHOTS}/cartes_suivi_bebe.png', full_page=True)
    tid(pg, 'track-see-all').click(); pg.wait_for_timeout(800)
    R['voir_tous_les_suivis'] = has(pg, 'track-all') and has(pg, 'track-card-observation') and 'Retour haptique' in T(pg)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    track_of(lina)
    tid(pg, 'track-add-diaper').click(); pg.wait_for_timeout(1800)
    R['ajout_rapide_ouvre_saisie'] = '/track/diaper' in pg.url
    track_of(lina)
    open_before = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length")
    tid(pg, 'track-add-sleep').click(); pg.wait_for_timeout(1500)
    open_after = demo(pg, f"s => s.tables.sleeps.filter(x => x.child_id === '{lina}' && !x.ended_at).length")
    R['sommeil_ajout_rapide'] = open_before != open_after
    track_of(noe)
    R['cartes_enfant_plus_grand'] = set(k for k in ['bottle', 'breastfeed', 'diaper', 'sleep', 'meal', 'medication', 'appointment'] if has(pg, f'track-card-{k}')) == {'meal', 'sleep', 'medication', 'appointment'}
    track_of('preg')
    shown = [k for k in ['bottle', 'breastfeed', 'diaper', 'pumping', 'feel', 'mother_sleep', 'mood', 'eat', 'meal', 'appointment'] if has(pg, f'track-card-{k}')]
    R['cartes_grossesse'] = set(shown) == {'feel', 'mother_sleep', 'mood', 'eat'}
    tid(pg, 'track-see-all').click(); pg.wait_for_timeout(800)
    R['grossesse_jamais_biberon_tetee_couche'] = not any(has(pg, f'track-card-{k}') for k in ['bottle', 'breastfeed', 'diaper', 'pumping'])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    # Mode nuit : fond bleu nuit, contraste lisible
    pg.evaluate("() => { const raw = JSON.parse(localStorage.getItem('toietmoi.ui') || '{}'); raw.state = { ...(raw.state || {}), themePreference: 'night' }; localStorage.setItem('toietmoi.ui', JSON.stringify(raw)); }")
    pg.reload(); pg.wait_for_timeout(3500)
    go(pg, '/track', 3200)
    bg = pg.evaluate("() => { const el = document.querySelector('[data-testid=\"track-card-mood\"] [role=\"button\"]'); return el ? getComputedStyle(el).backgroundColor : null; }")
    R['cartes_mode_nuit_verre_sombre'] = bg == 'rgba(255, 255, 255, 0.06)'
    pg.screenshot(path=f'{SHOTS}/cartes_suivi_nuit.png', full_page=True)
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append('SCRIPT après ' + (list(R)[-1] if R else '-') + ' : ' + str(e).splitlines()[0][:300])
ok = sum(1 for v in R.values() if v)
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
print('erreurs:', errs[:8])
print(f'communaute: OK {ok} / {len(R)} false={len(R) - ok} err={len(errs)}')
sys.exit(0 if ok == len(R) and not errs else 1)
