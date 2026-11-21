"""
Communauté entre deux mamans, de bout en bout (web de démonstration, données conservées sur l'appareil) :
  photo d'une publication (web : sélecteur de fichiers, GPS retiré, < 3 Mo ; anonyme = pas de photo),
  suivre (bouton du profil, liste « Abonnements », notification « nouvelle abonnée », se désabonner, suivre à nouveau),
  écrire (bouton « Écrire » → conversation ouverte entre deux mamans qui se suivent), répondre (pastille de non-lus,
  boîte de réception, bulles), demande de message (accepter ; plafond de 3 messages → échec + « Renvoyer »),
  bloquer depuis la conversation (conversation retirée des deux boîtes, suivi coupé, profil indisponible).
Deux comptes : la visiteuse de la démonstration (Anna) et une deuxième maman (Béa) ajoutée au moteur local ; on passe
de l'une à l'autre en changeant la session enregistrée, puis en rechargeant la page.
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/dist-e2e && python3 e2e/spa_server.py /tmp/dist-e2e 8822 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8822 python3 e2e/messagerie.py
"""
import base64, json, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
TMP = os.path.join(SHOTS, 'photos'); os.makedirs(TMP, exist_ok=True)
R, errs = {}, []
STEP = ['-']
EXE = os.environ.get('PW_CHROMIUM') or None  # ex. /opt/pw-browsers/chromium
BEA = 'e2e-bea-0000-4000-8000-000000000002'


def gps_photo(name, color, size=(3024, 4032)):
    """Grande photo « de téléphone » (12 Mpx, en hauteur) avec appareil et position GPS."""
    img = Image.new('RGB', size, color)
    for x in range(0, size[0], 97):
        for y in range(0, size[1], 89):
            img.putpixel((x, y), (255, 255, 255))
    exif = Image.Exif(); exif[0x010F] = 'TestPhone'; exif[0x0110] = 'Modele Secret'
    exif[0x8825] = {1: 'N', 2: (48.0, 51.0, 24.0), 3: 'E', 4: (2.0, 21.0, 7.0)}
    path = os.path.join(TMP, name); img.save(path, 'JPEG', exif=exif.tobytes(), quality=95)
    return path


def demo(pg, js):
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def mutate(pg, js):
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (" + js + ")(s); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }")


def T(pg): return pg.inner_text('body')
def tid(pg, t):
    STEP[0] = t
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first
def has(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count() > 0
def count(pg, t): return pg.locator(f'[data-testid="{t}"]').filter(visible=True).count()
def go(pg, path, wait=2600): pg.goto(B + path); pg.wait_for_timeout(wait)
def text(pg, t): return tid(pg, t).inner_text() if has(pg, t) else ''
def shot(pg, name): pg.screenshot(path=f'{SHOTS}/{name}.png')


def file_bytes(pg, path):
    uri = demo(pg, f"s => (s.tables._files.find(f => f.path === '{path}') || {{}}).uri")
    return base64.b64decode(uri.split(',', 1)[1]) if uri and ',' in uri else b''


def clean(raw):
    return bool(raw) and raw[:2] == b'\xff\xd8' and b'Exif' not in raw and b'TestPhone' not in raw and b'GPS' not in raw


def confirm_modal(pg, label):
    btn = pg.get_by_role('button', name=label).filter(visible=True)
    if btn.count(): btn.last.click(); pg.wait_for_timeout(1200)


def as_user(pg, uid, path='/community', wait=3000):
    """Change de compte dans le moteur local (session enregistrée), puis recharge l'application."""
    mutate(pg, f"s => {{ const u = s.users.find(x => x.id === '{uid}'); s.session = {{ userId: u.id, email: u.email }}; }}")
    go(pg, path, wait)


def premium(pg, uid):
    """La communauté fait partie de Premium (Premium strict) : abonnement de test actif dans le moteur local."""
    mutate(pg, f"""s => {{ s.tables.subscriptions = (s.tables.subscriptions || []).filter(x => x.user_id !== '{uid}');
      s.tables.subscriptions.push({{ user_id: '{uid}', status: 'active', product_id: 'homi_premium_monthly', store: 'test', period_type: 'monthly',
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true }}); }}""")


def type_and_send(pg, msg):
    tid(pg, 'dm-input').fill(msg); pg.wait_for_timeout(200)
    tid(pg, 'dm-send').click(); pg.wait_for_timeout(1500)


def run(p):
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page()
    pg.on('dialog', lambda d: d.accept())
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    go(pg, '/welcome', 2500)
    pg.evaluate("() => location.assign(\'/start/sample\')"); pg.wait_for_timeout(4500)
    anna = demo(pg, "s => s.session.userId")
    premium(pg, anna)

    # ---------------------------------------------------------------- Anna : profil communautaire
    go(pg, '/community/profile', 2800)
    tid(pg, 'profile-handle').fill('anna_maman')
    if has(pg, 'profile-pseudo'): tid(pg, 'profile-pseudo').fill('Anna Maman')
    sw = pg.get_by_role('switch', name='J’accepte les règles de la communauté').filter(visible=True)
    if sw.count(): sw.first.click()
    tid(pg, 'profile-save').click(); pg.wait_for_timeout(1800)
    R['anna_profil'] = demo(pg, f"s => s.tables.community_profiles.some(p => p.user_id === '{anna}' && p.handle === 'anna_maman')")

    # ---------------------------------------------------------------- PHOTO : publication avec une grande photo (web)
    go(pg, '/community/new', 2800)
    tid(pg, 'composer-cat-sommeil').click() if has(pg, 'composer-cat-sommeil') else None
    tid(pg, 'composer-body').fill('Vos astuces pour les siestes en poussette ? Photo de notre balade.')
    with pg.expect_file_chooser() as fc:
        tid(pg, 'composer-add-photo').click()
    fc.value.set_files([gps_photo('grande.jpg', (120, 150, 200))])
    pg.wait_for_timeout(5000)
    R['photo_previsualisee'] = pg.locator('[data-testid="composer-photos"] img').count() >= 1 and not has(pg, 'composer-photo-error')
    shot(pg, '01_photo_composer')
    # anonyme : le bouton d'ajout disparaît, la raison est dite, la publication est bloquée avant l'envoi
    pg.get_by_text('Anonyme', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(500)
    R['anonyme_sans_ajout_photo'] = not has(pg, 'composer-add-photo') and 'Pas de photo dans une publication anonyme' in text(pg, 'composer-photo-note')
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(1200)
    R['anonyme_photo_refusee_avant_envoi'] = has(pg, 'composer-photo-anon-error') and demo(pg, "s => s.tables.posts.filter(p => (p.body || '').startsWith('Vos astuces pour les siestes')).length") == 0
    shot(pg, '02_photo_anonyme_refusee')
    pg.get_by_text('@anna_maman', exact=True).filter(visible=True).first.click(); pg.wait_for_timeout(400)
    tid(pg, 'composer-publish').click(); pg.wait_for_timeout(4000)
    post = demo(pg, "s => s.tables.posts.find(p => (p.body || '').startsWith('Vos astuces pour les siestes'))")
    photos = demo(pg, f"s => s.tables.post_photos.filter(x => x.post_id === '{post['id']}').map(x => x.path)") if post else []
    R['photo_publiee'] = bool(post) and len(photos) == 1 and photos[0].startswith(anna + '/') and '/community/post/' in pg.url
    raw = file_bytes(pg, photos[0]) if photos else b''
    R['photo_sans_gps_jpeg'] = clean(raw)
    R['photo_sous_3_mo'] = 0 < len(raw) < 3 * 1024 * 1024
    R['photo_affichee'] = pg.locator('img').count() >= 1
    shot(pg, '03_photo_publiee')

    # ---------------------------------------------------------------- Deuxième maman (Béa) dans le moteur local
    mutate(pg, f"""s => {{
      const now = new Date().toISOString();
      s.users.push({{ id: '{BEA}', email: 'bea@exemple.test', pw: 0 }});
      const base = s.tables.profiles.find(p => p.id === '{anna}');
      s.tables.profiles.push({{ ...base, id: '{BEA}', display_name: 'Béa' }});
      for (const m of s.tables.household_members.filter(m => m.user_id === '{anna}')) s.tables.household_members.push({{ ...m, user_id: '{BEA}', role: 'coparent' }});
      s.tables.subscriptions.push({{ user_id: '{BEA}', status: 'active', product_id: 'homi_premium_monthly', store: 'test', period_type: 'monthly', expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), will_renew: true }});
      s.tables.community_profiles.push({{ user_id: '{BEA}', pseudonym: 'Béa Lune', handle: 'bea_lune', avatar_preset: 'flower', visibility: 'members', journey_label: 'bebe', rules_accepted_at: now, created_at: now }});
    }}""")

    # ---------------------------------------------------------------- SUIVRE : Anna suit Béa
    go(pg, '/community/u/bea_lune', 3000)
    R['profil_bea_visible'] = has(pg, 'member-profile') and has(pg, 'follow-bea_lune') and has(pg, 'write-bea_lune')
    tid(pg, 'follow-bea_lune').click(); pg.wait_for_timeout(1500)
    R['suivre_enregistre'] = demo(pg, f"s => s.tables.member_follows.some(f => f.follower_id === '{anna}' && f.followee_id === '{BEA}')")
    R['bouton_abonnee'] = 'Abonné' in text(pg, 'follow-bea_lune') or 'Suivi' in text(pg, 'follow-bea_lune')
    shot(pg, '04_suivre_profil')
    go(pg, '/community/following', 2800)
    R['liste_abonnements'] = '@bea_lune' in text(pg, 'following-list')
    # se désabonner depuis la liste, puis suivre à nouveau
    tid(pg, 'follow-bea_lune').click(); pg.wait_for_timeout(1500)
    R['se_desabonner'] = not demo(pg, f"s => s.tables.member_follows.some(f => f.follower_id === '{anna}' && f.followee_id === '{BEA}')")
    go(pg, '/community/u/bea_lune', 2800)
    tid(pg, 'follow-bea_lune').click(); pg.wait_for_timeout(1500)
    R['suivre_a_nouveau'] = demo(pg, f"s => s.tables.member_follows.some(f => f.follower_id === '{anna}' && f.followee_id === '{BEA}')")

    # ---------------------------------------------------------------- Béa : notification, suit en retour, écrit
    as_user(pg, BEA, '/notifications', 3000)
    R['notif_nouvelle_abonnee'] = 'Anna Maman' in T(pg) or 'anna_maman' in T(pg)
    shot(pg, '05_notification_abonnee')
    go(pg, '/community/u/anna_maman', 3000)
    tid(pg, 'follow-anna_maman').click(); pg.wait_for_timeout(1500)
    R['suivi_mutuel'] = demo(pg, f"s => s.tables.member_follows.some(f => f.follower_id === '{BEA}' && f.followee_id === '{anna}')")
    go(pg, '/community?mode=following', 3000)
    R['fil_abonnements_montre_ses_publications'] = 'Vos astuces pour les siestes' in T(pg)
    go(pg, '/community/u/anna_maman', 3000)
    tid(pg, 'write-anna_maman').click(); pg.wait_for_timeout(3000)
    R['ecrire_ouvre_conversation'] = '/community/messages/' in pg.url and has(pg, 'dm-input') and not has(pg, 'dm-request-sent')
    conv = pg.url.rstrip('/').split('/')[-1]
    type_and_send(pg, 'Bonjour Anna ! Ta photo de balade m’a donné envie de sortir.')
    R['message_envoye'] = has(pg, 'dm-sent') and count(pg, 'dm-bubble-mine') == 1
    shot(pg, '06_conversation_bea')

    # ---------------------------------------------------------------- Anna : pastille, boîte, répond
    as_user(pg, anna, '/community', 3500)
    # 1 message de Béa + 2 messages de Maïa et 1 demande de PapaDeNour (personnages de la démonstration)
    R['pastille_non_lus'] = text(pg, 'community-messages-badge') == '4'
    shot(pg, '07_communaute_pastille')
    tid(pg, 'community-messages').click(); pg.wait_for_timeout(2800)
    R['boite_reception'] = has(pg, 'dm-row-bea_lune') and has(pg, 'dm-unread-bea_lune') and 'Ta photo de balade' in text(pg, 'dm-inbox')
    R['demo_conversation_maia'] = has(pg, 'dm-row-maia_et_sohan')
    shot(pg, '08_boite_reception')
    tid(pg, 'dm-row-bea_lune').click(); pg.wait_for_timeout(2800)
    R['message_recu'] = count(pg, 'dm-bubble-theirs') == 1 and 'Ta photo de balade' in T(pg)
    type_and_send(pg, 'Merci Béa ! On se retrouve au parc jeudi ?')
    R['reponse_envoyee'] = count(pg, 'dm-bubble-mine') == 1 and has(pg, 'dm-sent')
    pg.wait_for_timeout(800)
    R['lu_apres_ouverture'] = demo(pg, f"s => s.tables.dm_participants.find(x => x.conversation_id === '{conv}' && x.user_id === '{anna}').unread_count") == 0
    shot(pg, '09_conversation_anna')
    # clavier ouvert : le champ reste visible
    tid(pg, 'dm-input').click(); pg.wait_for_timeout(500)
    box = tid(pg, 'dm-input').bounding_box()
    R['champ_visible'] = bool(box) and box['y'] + box['height'] <= 844

    # demande de message de la démonstration (PapaDeNour) : accepter
    go(pg, '/community/messages?tab=requests', 2800)
    R['demandes_recues'] = has(pg, 'dm-row-papadenour')
    shot(pg, '10_demandes')
    tid(pg, 'dm-row-papadenour').click(); pg.wait_for_timeout(2600)
    R['demande_proposee'] = has(pg, 'dm-request') and has(pg, 'dm-accept') and not has(pg, 'dm-input')
    shot(pg, '11_demande_ouverte')
    tid(pg, 'dm-accept').click(); pg.wait_for_timeout(2000)
    R['demande_acceptee'] = has(pg, 'dm-input') and not has(pg, 'dm-request')

    # demande envoyée par Anna à Clem (pas de suivi mutuel) : 3 messages, puis échec visible + « Renvoyer »
    go(pg, '/community/u/clem_2026', 2800)
    tid(pg, 'write-clem_2026').click(); pg.wait_for_timeout(2800)
    R['demande_envoyee_annoncee'] = has(pg, 'dm-empty') and 'demande' in text(pg, 'dm-empty')
    type_and_send(pg, 'Bonjour Clem, nos bébés ont le même âge.')
    type_and_send(pg, 'Vous allez au parc de la Tête d’or ?')
    R['messages_restants_annonces'] = '1 message' in text(pg, 'dm-request-sent')
    # Refus du serveur (coordonnées dans une demande) : la bulle reste, en échec, avec la raison, « Renvoyer » et « Supprimer »
    type_and_send(pg, 'Écrivez-moi au 06 12 34 56 78')
    R['echec_affiche_avec_raison'] = has(pg, 'dm-failed') and 'coordonnées' in text(pg, 'dm-failed') and has(pg, 'dm-retry') and has(pg, 'dm-discard')
    shot(pg, '12_demande_echec_renvoyer')
    tid(pg, 'dm-retry').click(); pg.wait_for_timeout(1800)
    R['renvoyer_sans_doublon'] = count(pg, 'dm-failed') == 1 and demo(pg, f"s => s.tables.dm_messages.filter(m => m.body.startsWith('Écrivez-moi au')).length") == 0
    tid(pg, 'dm-discard').click(); pg.wait_for_timeout(600)
    R['supprimer_message_en_echec'] = not has(pg, 'dm-failed')
    type_and_send(pg, 'Troisième message')
    R['plafond_atteint'] = 'Demande envoyée' in text(pg, 'dm-request-sent')
    shot(pg, '12b_demande_plafond')

    # ---------------------------------------------------------------- Béa : lit la réponse, puis bloque Anna depuis la conversation
    as_user(pg, BEA, f'/community/messages/{conv}', 3500)
    R['reponse_recue'] = 'On se retrouve au parc jeudi' in T(pg)
    tid(pg, 'dm-menu').click(); pg.wait_for_timeout(900)
    shot(pg, '13_menu_conversation')
    tid(pg, 'dm-menu-block').click(); pg.wait_for_timeout(700); confirm_modal(pg, 'Bloquer')
    pg.wait_for_timeout(1800)
    R['bloquer_depuis_conversation'] = demo(pg, f"s => s.tables.user_blocks.some(x => x.blocker_id === '{BEA}' && x.blocked_id === '{anna}')")
    R['suivi_coupe_par_blocage'] = demo(pg, f"s => !s.tables.member_follows.some(f => (f.follower_id === '{anna}' && f.followee_id === '{BEA}') || (f.follower_id === '{BEA}' && f.followee_id === '{anna}'))")
    R['conversation_retiree_chez_bea'] = pg.url.rstrip('/').endswith('/community/messages') and not has(pg, 'dm-row-anna_maman')
    shot(pg, '14_apres_blocage_bea')
    go(pg, '/community/blocked', 2600)
    R['liste_bloquees'] = has(pg, 'blocked-anna_maman')

    # ---------------------------------------------------------------- Anna : plus rien
    as_user(pg, anna, '/community/messages', 3000)
    R['conversation_retiree_chez_anna'] = not has(pg, 'dm-row-bea_lune')
    go(pg, f'/community/messages/{conv}', 3000)
    R['conversation_indisponible'] = 'Conversation indisponible' in T(pg) and not has(pg, 'dm-input')
    go(pg, '/community/u/bea_lune', 3000)
    R['profil_indisponible'] = not has(pg, 'write-bea_lune') and not has(pg, 'follow-bea_lune')
    shot(pg, '15_anna_profil_indisponible')
    R['aucun_texte_dans_les_notifications'] = demo(pg, "s => s.tables.notifications.filter(n => n.category === 'community_message').every(n => n.body === null && !JSON.stringify(n).includes('balade'))")
    b.close()


with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # noqa: BLE001
        errs.append('SCRIPT après ' + (list(R)[-1] if R else '-') + ' (' + STEP[0] + ') : ' + str(e).splitlines()[0][:300])
ok = sum(1 for v in R.values() if v)
print(json.dumps({**R, 'erreurs': errs}, ensure_ascii=False, indent=1))
print(f'messagerie: OK {ok} / {len(R)} false={len(R) - ok} err={len(errs)}')
sys.exit(0 if ok == len(R) and not errs else 1)
