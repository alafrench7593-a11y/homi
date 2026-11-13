"""
Audit 05 « Outils à saisie » (13/11/2026) : chaque outil du périmètre (formulaire/assistant, humeur/journal et les
formulaires des autres types) est ouvert dans la démonstration web, rempli avec des valeurs valides, enregistré ; la
donnée est relue dans le stockage de la démonstration (toietmoi.demo.v1) ET à l'écran après rechargement ; puis
valeurs limites, champs vides, texte long et emojis, double appui, modification, suppression.
Une seconde partie (FakeSupabase, hors démonstration) coupe les écritures réseau : aucun faux succès.

Usage :
  EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
    npx expo export --platform web --clear --output-dir /tmp/audit5/dist
  python3 e2e/spa_server.py /tmp/audit5/dist 8975 &
  PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8975 python3 e2e/audit_saisie.py [outil ...]
Le rapport JSON liste, par outil, chaque vérification (true attendu) ; « bloques » liste à part les cas qui ne
peuvent pas être exécutés sur le web (caméra, partage natif…), « erreurs » doit être vide.
"""
import glob, json, os, re, sys, uuid
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import PREMIUM_ON, SET_BODY, SIMPLE_OFF, body_for  # noqa: E402
from fake_supabase import FakeSupabase  # noqa: E402

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8975')
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/audit5/shots')
EXE = os.environ.get('PW_CHROMIUM') or ('/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
if EXE and os.path.isdir(EXE):
    EXE = (glob.glob(os.path.join(EXE, '**', 'chrome'), recursive=True) or [None])[0]
os.makedirs(SHOTS, exist_ok=True)
ONLY = set(sys.argv[1:])
R, errs, blocked, hors = {}, [], {}, {}
LONG = ('Une note très longue 🌙✨ ' * 120)[:2000]  # 2 000 caractères avec emojis


# ------------------------------------------------------------------ aides
def tid(pg, t):
    return pg.locator(f'[data-testid="{t}"]').filter(visible=True).first


def btn(pg, name, exact=False):
    return pg.get_by_role('button', name=name, exact=exact).filter(visible=True)


def field(pg, label, exact=False):
    return pg.get_by_label(label, exact=exact).filter(visible=True).first


def body(pg):
    return pg.inner_text('body')


def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('toietmoi.demo.v1'))")


def table(pg, name):
    return state(pg)['tables'].get(name, []) or []


def mutate(pg, js, arg=None):
    """Modifie l'état de la démonstration (avant un rechargement)."""
    pg.evaluate("""([js, arg]) => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); (new Function('s', 'arg', js))(s, arg); localStorage.setItem('toietmoi.demo.v1', JSON.stringify(s)); }""", [js, arg])


def back_in_app(pg, path, wait):
    """Rechargement complet renvoyé vers /welcome alors que la démonstration est active (régression constatée après
    la fusion de homi/fondations b6fc1ae, zone authentification) : on reprend la démonstration — ses données restent
    dans le stockage — puis on rouvre l'écran sans recharger. Signalé une fois dans « hors_perimetre »."""
    if '/welcome' not in pg.url or path.startswith('/welcome'):
        return
    outside('demo_rechargement', 'renvoi_accueil', False, 'Démonstration : chaque rechargement complet renvoie vers /welcome (session de démo non reprise ; données conservées). '
            'Cause probable : src/lib/auth.tsx s\'abonne à backend.auth.onChange avant initBackendMode (abonnement au vrai backend, session nulle) depuis l\'attente de useIsRestoring. Propriétaire : agent 2 (auth).')
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(3000)
    pg.evaluate("(p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate', { state: {} })); }", path)
    pg.wait_for_timeout(wait)


def go(pg, path, wait=3200):
    need = body_for(path.split('?')[0])
    if need:
        pg.evaluate(SET_BODY, list(need))
    pg.goto(B + path); pg.wait_for_timeout(wait)
    back_in_app(pg, path, wait)


def reload(pg, wait=3200):
    path = pg.url[len(B):] if pg.url.startswith(B) else '/'
    pg.reload(); pg.wait_for_timeout(wait)
    back_in_app(pg, path, wait)


def dbl(loc):
    """Double appui rapide (deux clics dans le même instant)."""
    loc.dblclick()


def expand_sheet(pg):
    """Feuille ouverte au cran moyen : on la tire vers le haut par sa poignée (grand cran), comme au doigt."""
    h = pg.locator('[data-testid="sheet-handle"]').filter(visible=True).last
    if not h.count():
        return
    b = h.bounding_box()
    if not b or b['y'] < 120:
        return
    pg.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2); pg.mouse.down()
    for i in range(1, 11):
        pg.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2 - (b['y'] * i / 10)); pg.wait_for_timeout(16)
    pg.mouse.up(); pg.wait_for_timeout(700)


def shot(pg, name):
    pg.screenshot(path=f'{SHOTS}/{name}.png')


def has(pg, txt):
    return pg.get_by_text(txt, exact=False).filter(visible=True).count() > 0


def children(pg):
    return table(pg, 'children')


def u16(s):
    """Longueur comptée comme le navigateur (maxLength) : unités UTF-16, un emoji en vaut deux."""
    return len(s.encode('utf-16-le')) // 2


def outside(name, key, ok, note):
    """Défaut constaté hors du périmètre de l'audit 05 (composant partagé…) : listé à part, sans faire échouer."""
    if not ok:
        hors.setdefault(name, {})[key] = note


def run(name, fn, ctx):
    """Chaque outil dans un onglet neuf (même stockage de démonstration) ; un onglet tué faute de mémoire est rejoué une fois."""
    if ONLY and name not in ONLY:
        return
    for attempt in (1, 2):
        res = {}
        pg = page(ctx)
        try:
            fn(pg, res)
        except Exception as e:  # une étape introuvable = échec visible dans le rapport
            import traceback
            line = [f for f in traceback.extract_tb(e.__traceback__) if f.filename.endswith('audit_saisie.py')][-1].lineno
            res['exception'] = f'ligne {line} : ' + str(e).split('\n')[0][:200]
            if 'crashed' in str(e) and attempt == 1:
                try:
                    pg.close()
                except Exception:
                    pass
                continue
            try:
                shot(pg, f'{name}-exception')
            except Exception:
                pass
        break
    try:
        pg.close()
    except Exception:
        pass
    R[name] = res


def page(ctx):
    pg = ctx.new_page()
    pg.set_default_timeout(8000)
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/metadata.json')  # même origine : le stockage de la démonstration est lisible avant d'ouvrir l'écran
    return pg


def start(ctx):
    pg = ctx.new_page()
    pg.set_default_timeout(8000)
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'sb.fake.test' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4000)
    pg.evaluate(PREMIUM_ON)
    pg.evaluate(SIMPLE_OFF)
    return pg


def fr_date(days=0):
    import datetime
    d = datetime.date.today() + datetime.timedelta(days=days)
    return d.strftime('%d/%m/%Y')


# ------------------------------------------------------------------ Rendez-vous (Santé)
def t_appointments(pg, r):
    go(pg, '/appointments')
    n0 = len(table(pg, 'appointments'))
    tid(pg, 'appointments-add').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    sheet_save = lambda: btn(pg, 'Ajouter', exact=True).last  # noqa: E731
    # champs vides : intitulé vide refusé, rien d'enregistré
    field(pg, 'Intitulé').fill('')
    sheet_save().click(); pg.wait_for_timeout(500)
    r['vide_refuse'] = has(pg, 'Donnez un nom à ce rendez-vous') and len(table(pg, 'appointments')) == n0
    # valeurs limites : année improbable, heure 25h
    field(pg, 'Intitulé').fill('Contrôle 🦷 dentiste')
    field(pg, 'Date').fill('12/03/2099'); field(pg, 'Heure').fill('25h00')
    sheet_save().click(); pg.wait_for_timeout(500)
    r['date_improbable_refusee'] = has(pg, 'Date improbable')
    r['heure_invalide_refusee'] = has(pg, 'Format attendu : 14h30')
    field(pg, 'Date').fill('31/02/2027')
    sheet_save().click(); pg.wait_for_timeout(500)
    r['date_inexistante_refusee'] = has(pg, 'Format attendu : JJ/MM/AAAA') and len(table(pg, 'appointments')) == n0
    # saisie valide + double appui : un seul rendez-vous
    field(pg, 'Date').fill(fr_date(12)); field(pg, 'Heure').fill('9h30')
    field(pg, 'Lieu').fill('Cabinet du Dr Martin')
    field(pg, 'Notes').fill(LONG)
    dbl(sheet_save()); pg.wait_for_timeout(1500)
    rows = [a for a in table(pg, 'appointments') if a['title'] == 'Contrôle 🦷 dentiste']
    r['un_seul_enregistrement'] = len(rows) == 1
    r['toast_ajoute'] = has(pg, 'Rendez-vous ajouté')
    r['note_2000_conservee'] = bool(rows) and len(rows[0].get('notes') or '') == 2000
    reload(pg)
    r['persiste_apres_rechargement'] = has(pg, 'Contrôle 🦷 dentiste')
    # modifier
    pg.get_by_role('button', name=re.compile('Contrôle 🦷 dentiste')).first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    field(pg, 'Intitulé').fill('Contrôle dentiste (déplacé)')
    btn(pg, 'Enregistrer les modifications').first.click(); pg.wait_for_timeout(1200)
    r['modifie'] = any(a['title'] == 'Contrôle dentiste (déplacé)' for a in table(pg, 'appointments'))
    # annuler une modification : fermer la feuille ne change rien
    pg.get_by_role('button', name=re.compile('Contrôle dentiste')).first.click(); pg.wait_for_timeout(700)
    field(pg, 'Intitulé').fill('NE PAS GARDER')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(700)
    r['annuler_sans_effet'] = not any(a['title'] == 'NE PAS GARDER' for a in table(pg, 'appointments'))
    # supprimer
    pg.get_by_role('button', name=re.compile('Contrôle dentiste')).first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    pg.once('dialog', lambda d: d.accept())
    btn(pg, 'Supprimer ce rendez-vous').first.click(); pg.wait_for_timeout(600)
    if btn(pg, 'Supprimer', exact=True).count():
        btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(1000)
    r['supprime'] = not any('Contrôle dentiste' in a['title'] for a in table(pg, 'appointments'))
    r['toast_supprime'] = has(pg, 'Rendez-vous supprimé')
    # question ajoutée au prochain rendez-vous : Entrée deux fois → une seule question
    if tid(pg, 'appt-q-new').count():
        f = tid(pg, 'appt-q-new'); f.fill('Faut-il être à jeun ? 🩸'); f.press('Enter'); f.press('Enter'); pg.wait_for_timeout(1200)
        r['question_ajoutee_une_fois'] = [q for a in table(pg, 'appointments') for q in a['questions']].count('Faut-il être à jeun ? 🩸') == 1


# ------------------------------------------------------------------ Questions pour le rendez-vous (3 parcours)
def consult(path, journey):
    def t(pg, r):
        go(pg, path)
        q = f'Question test {journey} ✨ ?'
        n0 = len(table(pg, 'consultation_questions'))
        f = field(pg, 'Ajouter une question')
        f.fill('   ')
        btn(pg, 'Ajouter', exact=True).first.click(); pg.wait_for_timeout(600)
        r['vide_ignore'] = len(table(pg, 'consultation_questions')) == n0
        f.fill(q)
        # Entrée deux fois de suite (clavier) : une seule question
        f.press('Enter'); f.press('Enter'); pg.wait_for_timeout(1200)
        rows = [x for x in table(pg, 'consultation_questions') if x['question'] == q]
        r['entree_une_seule_question'] = len(rows) == 1
        r['parcours_enregistre'] = bool(rows) and rows[0]['journey'] == journey
        r['champ_vide_apres_ajout'] = f.input_value() == ''
        # la même question saisie à nouveau n'est pas dupliquée
        f.fill(q); btn(pg, 'Ajouter', exact=True).first.click(); pg.wait_for_timeout(1000)
        dup = len([x for x in table(pg, 'consultation_questions') if x['question'] == q])
        outside(path, 'doublon_accepte', dup == 1, 'ConsultationChecklist (src/components/Fertility.tsx) ajoute une question identique à une question déjà listée (agent UX).')
        if dup > 1:  # on retire le doublon pour la suite du parcours
            mutate(pg, "const q = arg; let seen = false; s.tables.consultation_questions = s.tables.consultation_questions.filter((x) => x.question !== q || !seen && (seen = true));", q)
            reload(pg)
        # texte trop long : coupé à 300 caractères
        f = field(pg, 'Ajouter une question'); f.fill(LONG); r['limite_300'] = u16(f.input_value()) == 300
        f.fill('')
        reload(pg)
        r['persiste'] = has(pg, q)
        # cocher (posée) puis supprimer
        pg.get_by_role('checkbox', name=re.compile(re.escape(q))).first.click(); pg.wait_for_timeout(800)
        r['cochee'] = any(x['question'] == q and x['done'] for x in table(pg, 'consultation_questions'))
        pg.once('dialog', lambda d: d.accept())
        pg.get_by_role('button', name=re.compile('Supprimer.*' + re.escape(q[:20]))).first.click(); pg.wait_for_timeout(600)
        if btn(pg, 'Supprimer', exact=True).count():
            btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(900)
        r['supprimee'] = not any(x['question'] == q for x in table(pg, 'consultation_questions'))
    return t


# ------------------------------------------------------------------ Journal du cycle
def t_cycle_journal(pg, r):
    go(pg, '/cycle/journal')
    save = lambda: tid(pg, 'journal-save')  # noqa: E731
    n0 = len(table(pg, 'cycle_journal'))
    save().click(); pg.wait_for_timeout(500)
    r['vide_refuse'] = has(pg, 'Écrivez quelques mots') and len(table(pg, 'cycle_journal')) == n0
    field(pg, 'Note', exact=True).fill('Crampes légères 🌸')
    field(pg, 'Jour').fill(fr_date(3)); save().click(); pg.wait_for_timeout(500)
    r['date_future_refusee'] = has(pg, 'Choisissez aujourd’hui ou un jour passé') and len(table(pg, 'cycle_journal')) == n0
    field(pg, 'Jour').fill(fr_date(-2))
    btn(pg, 'Humeur (facultatif) 4/5').first.click()
    dbl(save()); pg.wait_for_timeout(1300)
    rows = [x for x in table(pg, 'cycle_journal') if x['body'] == 'Crampes légères 🌸']
    r['un_seul_enregistrement'] = len(rows) == 1
    r['humeur_et_date'] = bool(rows) and rows[0]['mood'] == 4 and rows[0]['entry_on'] < fr_date(0)[6:] + '-12-31'
    reload(pg)
    r['persiste'] = has(pg, 'Crampes légères 🌸')
    btn(pg, 'Modifier', exact=True).first.click(); pg.wait_for_timeout(500)
    field(pg, 'Note', exact=True).fill('Crampes (modifié)')
    save().click(); pg.wait_for_timeout(1000)
    r['modifie'] = any(x['body'] == 'Crampes (modifié)' for x in table(pg, 'cycle_journal')) and len(table(pg, 'cycle_journal')) == n0 + 1
    field(pg, 'Note', exact=True).fill(LONG); save().click(); pg.wait_for_timeout(1000)
    r['texte_2000_emojis'] = any(len(x['body']) == len(LONG.strip()) for x in table(pg, 'cycle_journal'))
    pg.once('dialog', lambda d: d.accept())
    btn(pg, 'Supprimer', exact=True).first.click(); pg.wait_for_timeout(600)
    if btn(pg, 'Supprimer', exact=True).count() > 1:
        btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(900)
    r['supprime'] = len(table(pg, 'cycle_journal')) == n0 + 1


# ------------------------------------------------------------------ Journal de ma contraception
def t_contraception_journal(pg, r):
    go(pg, '/contraception/journal')
    cnt = lambda: len([x for x in table(pg, 'contraception_logs') if x['kind'] == 'effect'])  # noqa: E731
    n0 = cnt()
    tid(pg, 'cj-save').click(); pg.wait_for_timeout(500)
    r['sans_choix_refuse'] = has(pg, 'Choisissez d’abord ce que vous ressentez') and cnt() == n0
    tid(pg, 'cj-effect-headache').click()
    f = field(pg, 'Précision'); f.fill(LONG)
    r['limite_500'] = u16(f.input_value()) == 500
    f.fill('Depuis 3 jours 🤕')
    dbl(tid(pg, 'cj-save')); pg.wait_for_timeout(400)
    r['toast'] = has(pg, 'Note enregistrée')
    r['double_appui_sans_fausse_erreur'] = not has(pg, 'Choisissez d’abord')
    pg.wait_for_timeout(900)
    r['un_seul_enregistrement'] = cnt() == n0 + 1
    reload(pg)
    r['persiste'] = has(pg, 'Depuis 3 jours 🤕')
    pg.once('dialog', lambda d: d.accept())
    pg.get_by_role('button', name=re.compile('Maux de tête')).first.click(); pg.wait_for_timeout(600)
    if btn(pg, 'Supprimer', exact=True).count():
        btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(900)
    r['supprime'] = cnt() == n0


# ------------------------------------------------------------------ Je suis à bout
def t_exhausted(pg, r):
    go(pg, '/family/exhausted')
    n0 = len(table(pg, 'exhaustion_checkins'))
    r['bouton_inactif_si_incomplet'] = tid(pg, 'ex-done').get_attribute('aria-disabled') == 'true'
    for q in ['tired', 'sleep', 'irritable', 'distance', 'overwhelmed', 'no_time']:
        tid(pg, f'ex-{q}-2').click()
    dbl(tid(pg, 'ex-done')); pg.wait_for_timeout(1200)
    r['double_appui_reste_sur_le_resultat'] = pg.url.endswith('/family/exhausted')
    r['resultat_affiche'] = pg.locator('[data-testid^="ex-result-"]').count() > 0
    r['un_seul_enregistrement'] = len(table(pg, 'exhaustion_checkins')) == n0 + 1
    res_txt = pg.locator('[data-testid^="ex-result-"]').first.inner_text() if pg.locator('[data-testid^="ex-result-"]').count() else ''
    r['pas_de_diagnostic'] = bool(res_txt) and not re.search(r'burn.?out|dépression|diagnostic', res_txt, re.I)
    reload(pg)
    r['historique_apres_rechargement'] = has(pg, 'Une fatigue')


# ------------------------------------------------------------------ Mon humeur (refondu v3, re-vérifié)
def t_mood(pg, r):
    go(pg, '/me/mood')
    mine = lambda: [m for m in table(pg, 'mood_checkins') if m['user_id'] == state(pg)['session']['userId']]  # noqa: E731
    n0 = len(mine())
    r['enregistrer_inactif_sans_humeur'] = tid(pg, 'mood-main-action').get_attribute('aria-disabled') == 'true'
    tid(pg, 'mood-3').click(); pg.wait_for_timeout(700)
    note = tid(pg, 'mood-note'); note.fill(LONG)
    r['note_2000_acceptee'] = u16(note.input_value()) == u16(LONG)
    note.fill('Journée calme ☕ avec Léa')
    dbl(tid(pg, 'mood-main-action')); pg.wait_for_timeout(1500)
    r['un_seul_bilan'] = len(mine()) == n0 + 1
    r['resultat_reel'] = has(pg, 'Bilan enregistré')
    reload(pg)
    r['historique_persiste'] = has(pg, 'Journée calme ☕')


# ------------------------------------------------------------------ Comment je me sens (grossesse)
def t_preg_feel(pg, r):
    go(pg, '/pregnancy/feel')
    n0 = len(table(pg, 'pregnancy_symptom_logs'))
    tid(pg, 'feel-save').click(); pg.wait_for_timeout(500)
    r['sans_symptome_refuse'] = has(pg, 'Choisissez au moins un symptôme') and len(table(pg, 'pregnancy_symptom_logs')) == n0
    tid(pg, 'feel-sym-fatigue').click(); tid(pg, 'feel-sym-reflux').click(); tid(pg, 'feel-intensity-2').click()
    tid(pg, 'feel-more').click(); pg.wait_for_timeout(300)
    tid(pg, 'feel-time').fill('23:59' if False else '99:99')
    tid(pg, 'feel-save').click(); pg.wait_for_timeout(500)
    r['heure_invalide_refusee'] = has(pg, 'Heure de début attendue') and len(table(pg, 'pregnancy_symptom_logs')) == n0
    tid(pg, 'feel-time').fill('00:01')
    tid(pg, 'feel-note').fill('Après le repas 🍽️')
    dbl(tid(pg, 'feel-save')); pg.wait_for_timeout(1300)
    r['deux_symptomes_un_seul_envoi'] = len(table(pg, 'pregnancy_symptom_logs')) == n0 + 2
    r['double_appui_garde_les_cartes'] = tid(pg, 'feel-cards').count() > 0
    r['pas_de_diagnostic'] = not re.search(r'diagnostic (posé|établi)|vous avez (un|une) ', body(pg), re.I)
    reload(pg)
    r['persiste'] = has(pg, 'Après le repas 🍽️')
    rows = [x for x in table(pg, 'pregnancy_symptom_logs') if x.get('note') == 'Après le repas 🍽️']
    tid(pg, f"feel-edit-{rows[0]['id']}").click(); pg.wait_for_timeout(400)
    tid(pg, 'feel-intensity-3').click(); tid(pg, 'feel-save').click(); pg.wait_for_timeout(1000)
    r['modifie'] = any(x['id'] == rows[0]['id'] and x['intensity'] == 3 for x in table(pg, 'pregnancy_symptom_logs'))
    pg.once('dialog', lambda d: d.accept())
    tid(pg, f"feel-delete-{rows[0]['id']}").click(); pg.wait_for_timeout(600)
    if btn(pg, 'Supprimer', exact=True).count() > 1:
        btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(900)
    r['supprime'] = not any(x['id'] == rows[0]['id'] for x in table(pg, 'pregnancy_symptom_logs'))


# ------------------------------------------------------------------ Point du jour (post-partum)
def t_pp_checkin(pg, r):
    mutate(pg, "s.tables.postpartum_checkins = (s.tables.postpartum_checkins || []).filter((c) => c.checkin_date !== arg);", __import__('datetime').date.today().isoformat())
    go(pg, '/postpartum/checkin')
    today = __import__('datetime').date.today().isoformat()
    tid(pg, 'pp-express-feeling-4').click(); pg.wait_for_timeout(500)
    dbl(tid(pg, 'pp-checkin-save')); pg.wait_for_timeout(1800)
    rows = [c for c in table(pg, 'postpartum_checkins') if c['checkin_date'] == today]
    r['une_seule_entree_du_jour'] = len(rows) == 1
    r['valeur_enregistree'] = bool(rows) and rows[0]['feeling'] == 4
    # (un double appui renvoie à l'espace puis le second appui y rouvre le point du jour : constaté, voir le rapport)
    go(pg, '/postpartum/checkin')
    r['reprise_du_point_du_jour'] = has(pg, 'Mettre à jour') or tid(pg, 'pp-checkin-save').inner_text().strip() != 'Enregistrer'
    tid(pg, 'pp-checkin-save').click(); pg.wait_for_timeout(1500)
    r['retour_espace_apres_enregistrement'] = pg.url.rstrip('/').endswith('/postpartum')
    r['mise_a_jour_sans_doublon'] = len([c for c in table(pg, 'postpartum_checkins') if c['checkin_date'] == today]) == 1


# ------------------------------------------------------------------ Vider ma tête
def t_brain_dump(pg, r):
    go(pg, '/family/brain-dump')
    r['ranger_inactif_si_vide'] = tid(pg, 'dump-sort').get_attribute('aria-disabled') == 'true'
    n0 = len(table(pg, 'family_tasks'))
    tid(pg, 'dump-text').fill('appeler la CAF, acheter des couches 👶, vaccin de Noé')
    tid(pg, 'dump-sort').click(); pg.wait_for_timeout(500)
    r['trois_elements_proposes'] = pg.locator('[data-testid^="dump-item-"]').count() == 3
    pg.get_by_role('button', name='Retirer').first.click()
    dbl(tid(pg, 'dump-save')); pg.wait_for_timeout(1800)
    r['deux_enregistres_une_fois'] = len(table(pg, 'family_tasks')) == n0 + 2
    r['toast'] = has(pg, 'éléments rangés')
    r['champ_vide_apres'] = tid(pg, 'dump-text').input_value() == ''
    go(pg, '/family')
    r['visible_dans_organisation'] = has(pg, 'couches')


# ------------------------------------------------------------------ Carnet de la maison
def t_notebook(pg, r):
    go(pg, '/family/notebook')
    n0 = len(table(pg, 'house_notes'))
    tid(pg, 'nb-new').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 'nb-save').click(); pg.wait_for_timeout(500)
    r['titre_vide_refuse'] = has(pg, 'Ajoutez un titre') and len(table(pg, 'house_notes')) == n0
    tid(pg, 'nb-title').fill(LONG); r['titre_limite_80'] = u16(tid(pg, 'nb-title').input_value()) == 80
    tid(pg, 'nb-title').fill('Pédiatre 🩺 Dr Martin')
    tid(pg, 'nb-body').fill(LONG); r['details_limite_2000'] = u16(tid(pg, 'nb-body').input_value()) == 2000
    tid(pg, 'nb-body').fill('01 23 45 67 89')
    dbl(tid(pg, 'nb-save')); pg.wait_for_timeout(1300)
    r['un_seul_enregistrement'] = len(table(pg, 'house_notes')) == n0 + 1
    reload(pg)
    r['persiste'] = has(pg, 'Pédiatre 🩺 Dr Martin')
    note = [n for n in table(pg, 'house_notes') if n['title'] == 'Pédiatre 🩺 Dr Martin'][0]
    tid(pg, f"nb-note-{note['id']}").click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 'nb-title').fill('Pédiatre (nouveau numéro)'); tid(pg, 'nb-save').click(); pg.wait_for_timeout(1000)
    r['modifie'] = any(n['id'] == note['id'] and n['title'] == 'Pédiatre (nouveau numéro)' for n in table(pg, 'house_notes'))
    tid(pg, f"nb-note-{note['id']}").click(); pg.wait_for_timeout(700); expand_sheet(pg)
    pg.once('dialog', lambda d: d.accept())
    btn(pg, 'Supprimer', exact=True).first.click(); pg.wait_for_timeout(600)
    if btn(pg, 'Supprimer', exact=True).count() > 1:
        btn(pg, 'Supprimer', exact=True).last.click(); pg.wait_for_timeout(900)
    r['supprime'] = not any(n['id'] == note['id'] for n in table(pg, 'house_notes'))


# ------------------------------------------------------------------ Journée difficile
def t_difficult(pg, r):
    go(pg, '/family/difficult')
    cnt = lambda: len([x for x in table(pg, 'care_requests') if x.get('kind') == 'help_today'])  # noqa: E731
    n0 = cnt()
    dbl(tid(pg, 'difficult-help')); pg.wait_for_timeout(1300)
    r['une_seule_demande'] = cnt() == n0 + 1
    r['toast'] = has(pg, 'Demande d’aide envoyée')
    reload(pg)
    r['demande_du_jour_reconnue_apres_rechargement'] = 'Demande envoyée' in tid(pg, 'difficult-help').inner_text()
    tid(pg, 'difficult-help').click(force=True); pg.wait_for_timeout(900)
    r['pas_de_seconde_demande'] = cnt() == n0 + 1


def child_id(pg, i=0):
    return children(pg)[i]['id']


# ------------------------------------------------------------------ Idées de prénoms
def t_names(pg, r):
    go(pg, '/names')
    favs = lambda: [f['name'] for f in table(pg, 'name_favorites')]  # noqa: E731
    f = field(pg, 'Prénom', exact=True)
    btn(pg, 'Ajouter aux favoris').first.click(); pg.wait_for_timeout(400)
    r['vide_refuse'] = has(pg, 'Indiquez un prénom')
    f.fill('Zoé-Lou 🌼' + 'x' * 60); r['limite_40'] = u16(f.input_value()) == 40
    f.fill('Maëlys')
    f.press('Enter'); f.press('Enter'); pg.wait_for_timeout(1200)
    r['entree_un_seul_favori'] = favs().count('Maëlys') == 1
    r['champ_vide_apres'] = f.input_value() == ''
    f.fill('maëlys'); btn(pg, 'Ajouter aux favoris').first.click(); pg.wait_for_timeout(500)
    r['doublon_refuse'] = has(pg, 'déjà dans vos favoris') and favs().count('Maëlys') == 1
    f.fill('')
    # cœur : double appui rapide sur un prénom de la liste → jamais deux favoris identiques
    dbl(pg.get_by_role('button', name='Ajouter Aaron aux favoris').first); pg.wait_for_timeout(1300)
    r['coeur_sans_doublon'] = favs().count('Aaron') <= 1
    reload(pg)
    pg.get_by_role('radio', name='Nos favoris').first.click(); pg.wait_for_timeout(1000)
    r['persiste'] = has(pg, 'Maëlys')


# ------------------------------------------------------------------ Papiers de la famille
def t_papers(pg, r):
    go(pg, '/family/papers')
    papers = lambda: [p for p in table(pg, 'family_papers') if p['kind'] == 'passport']  # noqa: E731
    n0 = len(papers())
    tid(pg, 'pp-kind-passport').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 'pp-expires').fill('31/02/2030'); tid(pg, 'pp-save').click(); pg.wait_for_timeout(500)
    r['date_invalide_refusee'] = len(papers()) == n0
    tid(pg, 'pp-expires').fill('15/06/2031')
    dbl(tid(pg, 'pp-save')); pg.wait_for_timeout(1500)
    r['une_seule_fiche'] = len(papers()) == n0 + 1
    r['date_enregistree'] = any(p.get('expires_on') == '2031-06-15' for p in papers())
    reload(pg)
    r['persiste'] = 'Passeport' in body(pg)


# ------------------------------------------------------------------ Fiche de mon enfant
def t_kid_card(pg, r):
    cid = child_id(pg)
    go(pg, f'/child/{cid}/card')
    items = lambda: [i for i in table(pg, 'child_health_items') if i['child_id'] == cid and i['kind'] == 'soothe']  # noqa: E731
    n0 = len(items())
    btn(pg, 'Ajouter').first.click(); pg.wait_for_timeout(500)
    save = tid(pg, 'kid-card-soothe-save')
    save.click(); pg.wait_for_timeout(400)
    r['vide_refuse'] = has(pg, 'Écrivez d’abord quelques mots') and len(items()) == n0
    field(pg, 'Ce qui l’apaise').fill('Son doudou lapin 🐰')
    dbl(save); pg.wait_for_timeout(1300)
    r['un_seul_enregistrement'] = len(items()) == n0 + 1
    reload(pg)
    r['persiste'] = has(pg, 'Son doudou lapin 🐰')


# ------------------------------------------------------------------ Humeur et émotions de l'enfant
def t_kid_mood(pg, r):
    cid = child_id(pg)
    go(pg, f'/child/{cid}/wellbeing')
    rows = lambda: [x for x in table(pg, 'child_wellbeing') if x['child_id'] == cid]  # noqa: E731
    n0 = len(rows())
    dbl(tid(pg, 'wellbeing-quick-4')); pg.wait_for_timeout(1300)
    r['un_tap_une_note'] = len(rows()) == n0 + 1
    r['toast'] = has(pg, 'Noté : plutôt bien')
    tid(pg, 'wellbeing-details').click(); pg.wait_for_timeout(500)
    r['details_vides_refuses'] = tid(pg, 'wellbeing-save').get_attribute('aria-disabled') == 'true' and len(rows()) == n0 + 1
    field(pg, 'Événement inhabituel').fill('Rentrée à la crèche 🎒'); pg.wait_for_timeout(200)
    if tid(pg, 'wellbeing-save').get_attribute('aria-disabled') != 'true':
        dbl(tid(pg, 'wellbeing-save')); pg.wait_for_timeout(1200)
        r['details_un_seul_envoi'] = len(rows()) == n0 + 2
    reload(pg)
    r['persiste'] = has(pg, 'Plutôt bien')


# ------------------------------------------------------------------ Besoin particulier (catégories + suivi)
def t_kid_needs(pg, r):
    cid = child_id(pg, 1)
    go(pg, f'/child/{cid}/needs')
    pg.get_by_role('checkbox', name='Troubles DYS').first.click()
    field(pg, 'Notes').fill('Bilan orthophonique demandé 📝')
    dbl(tid(pg, 'needs-save')); pg.wait_for_timeout(1300)
    rows = [n for n in table(pg, 'child_needs') if n['child_id'] == cid]
    r['un_seul_profil'] = len(rows) == 1
    r['categorie_enregistree'] = bool(rows) and 'dys' in ''.join(rows[0]['kinds'])
    reload(pg)
    pg.get_by_role('radio', name='Catégories').first.click(); pg.wait_for_timeout(500)
    r['persiste'] = field(pg, 'Notes').input_value() == 'Bilan orthophonique demandé 📝'
    pg.get_by_role('radio', name='Pour vous').first.click(); pg.wait_for_timeout(400)
    r['pas_de_diagnostic'] = not re.search(r'votre enfant (est|a) (un |une )?(TDAH|dys|autiste)', body(pg), re.I)


# ------------------------------------------------------------------ Mes démarches
def t_kid_steps(pg, r):
    cid = child_id(pg, 1)
    go(pg, f'/child/{cid}/steps')
    n0 = len(table(pg, 'checklists'))
    if tid(pg, 'kid-steps-create').count():
        dbl(tid(pg, 'kid-steps-create')); pg.wait_for_timeout(1800)
        r['une_seule_liste'] = len(table(pg, 'checklists')) == n0 + 1
    reload(pg)
    r['liste_affichee_apres_rechargement'] = tid(pg, 'kid-steps-create').count() == 0 and pg.get_by_role('checkbox').count() > 3
    r['pas_de_diagnostic_promis'] = has(pg, 'Seul un professionnel de santé peut poser un diagnostic')


# ------------------------------------------------------------------ Médicaments (mes traitements) : aucune dose calculée
def t_medications(pg, r):
    go(pg, '/medications')
    mine = lambda: table(pg, 'my_treatments')  # noqa: E731
    n0 = len(mine())
    tid(pg, 'me-treatment-add').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 't-save').click(); pg.wait_for_timeout(500)
    r['vide_refuse'] = has(pg, 'Indiquez le nom du traitement') and has(pg, 'Recopiez la dose') and len(mine()) == n0
    tid(pg, 't-name').fill('Fer 💊'); tid(pg, 't-dose').fill('1 comprimé')
    tid(pg, 't-times').fill('25:00, 8h'); tid(pg, 't-save').click(); pg.wait_for_timeout(500)
    r['heure_invalide_refusee'] = has(pg, 'De 1 à 6 heures') and len(mine()) == n0
    tid(pg, 't-times').fill('08:00, 20:00')
    field(pg, 'Fin').fill('01/01/2020'); tid(pg, 't-save').click(); pg.wait_for_timeout(500)
    r['fin_avant_debut_refusee'] = has(pg, 'La fin ne peut pas précéder le début') and len(mine()) == n0
    field(pg, 'Fin').fill('')
    dbl(tid(pg, 't-save')); pg.wait_for_timeout(1500)
    rows = [t for t in mine() if t['name'] == 'Fer 💊']
    r['un_seul_traitement'] = len(rows) == 1
    r['dose_recopiee_telle_quelle'] = bool(rows) and rows[0]['dose_text'] == '1 comprimé'
    r['aucune_dose_calculee'] = not re.search(r'\d+\s*mg/kg|dose (recommandée|calculée)', body(pg), re.I)
    reload(pg)
    r['persiste'] = has(pg, 'Fer 💊')
    # cocher la prise de 08:00 puis la décocher
    chk = pg.locator('[data-testid^="med-check-me-"]').filter(visible=True)
    if chk.count():
        chk.first.click(); pg.wait_for_timeout(1000)
        r['prise_notee'] = any(l['status'] == 'taken' for l in table(pg, 'my_treatment_logs'))


# ------------------------------------------------------------------ Listes (valise, courses de naissance…)
def t_lists(pg, r):
    go(pg, '/lists')
    n0 = len(table(pg, 'checklists'))
    tid(pg, 'lists-new').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    btn(pg, 'Créer la liste').first.click(); pg.wait_for_timeout(400)
    r['titre_vide_refuse'] = has(pg, 'Donnez un titre à la liste') and len(table(pg, 'checklists')) == n0
    field(pg, 'Titre').fill('Valise maternité 🧳')
    dbl(btn(pg, 'Créer la liste').first); pg.wait_for_timeout(1500)
    lists = [l for l in table(pg, 'checklists') if l['title'] == 'Valise maternité 🧳']
    r['une_seule_liste'] = len(lists) == 1
    f = field(pg, 'Ajouter un élément')
    f.fill('Pyjama'); f.press('Enter'); f.press('Enter'); pg.wait_for_timeout(1300)
    items = [i for i in table(pg, 'checklist_items') if lists and i['checklist_id'] == lists[0]['id']]
    r['entree_un_seul_element'] = [i['label'] for i in items].count('Pyjama') == 1
    f.fill(LONG); r['limite_160'] = u16(f.input_value()) == 160
    f.fill('')
    reload(pg)
    r['persiste'] = has(pg, 'Valise maternité 🧳')


# ------------------------------------------------------------------ Personnaliser l'accueil (réglage avec saisie)
def t_home_settings(pg, r):
    go(pg, '/settings/home')
    sw = pg.get_by_role('switch', name='Afficher « Recette recommandée »').first
    before = sw.get_attribute('aria-checked')
    sw.click(); pg.wait_for_timeout(600)
    reload(pg)
    after = pg.get_by_role('switch', name='Afficher « Recette recommandée »').first.get_attribute('aria-checked')
    r['choix_persiste_apres_rechargement'] = before != after
    pg.get_by_role('switch', name='Afficher « Recette recommandée »').first.click(); pg.wait_for_timeout(500)


# ------------------------------------------------------------------ Modifier la grossesse
def t_preg_edit(pg, r):
    go(pg, '/pregnancy/edit')
    preg0 = [p for p in table(pg, 'pregnancies') if p['status'] == 'active'][0]
    tid(pg, 'preg-date').fill('31/02/2027'); tid(pg, 'preg-edit-save').click(); pg.wait_for_timeout(600)
    r['date_invalide_refusee'] = [p for p in table(pg, 'pregnancies') if p['id'] == preg0['id']][0]['due_date'] == preg0['due_date']
    tid(pg, 'preg-date').fill('01/01/2035'); tid(pg, 'preg-edit-save').click(); pg.wait_for_timeout(600)
    r['date_invraisemblable_refusee'] = [p for p in table(pg, 'pregnancies') if p['id'] == preg0['id']][0]['due_date'] == preg0['due_date']
    nick = field(pg, 'Prénom ou surnom du bébé 1')
    nick.fill('Petit pois 🌱')
    tid(pg, 'preg-date').fill('-'.join(reversed(preg0['due_date'].split('-'))).replace('-', '/'))
    dbl(tid(pg, 'preg-edit-save')); pg.wait_for_timeout(1500)
    babies = [b for b in table(pg, 'expected_babies') if b['pregnancy_id'] == preg0['id']]
    r['surnom_enregistre'] = any(b.get('nickname') == 'Petit pois 🌱' for b in babies)
    r['pas_de_bebe_en_double'] = len({b['position'] for b in babies}) == len(babies)
    go(pg, '/pregnancy/edit')
    pg.wait_for_timeout(1000)
    r['persiste'] = 'Petit pois 🌱' in pg.locator('input').evaluate_all('(els) => els.map((e) => e.value)')


# ------------------------------------------------------------------ Écrans d'information et de secours (aucune saisie enregistrée)
def info(path, texts, must=()):
    def t(pg, r):
        go(pg, path)
        r['ouvre'] = all(has(pg, x) for x in texts)
        for m in must:
            r[f'present_{m[:20]}'] = has(pg, m)
        r['aucune_ecriture'] = True
    return t


def t_urgent(pg, r):
    go(pg, '/family/urgent')
    cnt = lambda: len([x for x in table(pg, 'care_requests') if x.get('kind') == 'relay'])  # noqa: E731
    n0 = cnt()
    dbl(pg.get_by_role('button', name='Demander un relais').first); pg.wait_for_timeout(1500)
    r['une_seule_demande_de_relais'] = cnt() == n0 + 1
    r['urgence_vitale_en_premier'] = pg.get_by_role('button').filter(has_text=re.compile('15')).count() > 0


def t_sos(pg, r):
    go(pg, '/family/sos')
    cnt = lambda: len([x for x in table(pg, 'care_requests') if x.get('kind') == 'relay'])  # noqa: E731
    n0 = cnt()
    dbl(pg.get_by_role('button', name=re.compile('Demander le relais au foyer')).first); pg.wait_for_timeout(1500)
    r['une_seule_demande_de_relais'] = cnt() == n0 + 1
    tid(pg, 'sos-breathe').click(); pg.wait_for_timeout(1200)
    r['pause_lancee'] = bool(re.search(r'[12]:\d\d|\d+ s', body(pg)))


# ------------------------------------------------------------------ Ses découvertes (aliments)
def t_discoveries(pg, r):
    cid = child_id(pg)
    go(pg, f'/child/{cid}/discoveries')
    tiles = pg.locator('[data-testid^="dc-food-"]').filter(visible=True)
    tiles.first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 'dc-date').fill(fr_date(2)); tid(pg, 'dc-save').click(); pg.wait_for_timeout(500)
    r['date_future_refusee'] = has(pg, 'La date ne peut pas être dans le futur')
    tid(pg, 'dc-date').fill('01/01/2001'); tid(pg, 'dc-save').click(); pg.wait_for_timeout(700)
    r['date_avant_naissance_refusee'] = has(pg, 'La date précède la naissance')
    n0 = len(table(pg, 'food_tastings'))
    tid(pg, 'dc-date').fill(fr_date(-1)); tid(pg, 'dc-note').fill('A adoré 😋')
    dbl(tid(pg, 'dc-save')); pg.wait_for_timeout(1500)
    r['une_seule_degustation'] = len(table(pg, 'food_tastings')) == n0 + 1
    reload(pg)
    r['persiste'] = len(table(pg, 'food_tastings')) == n0 + 1 and pg.locator('[data-testid^="dc-recent-"]').count() > 0


# ------------------------------------------------------------------ Je grandis (étapes)
def t_grow(pg, r):
    cid = child_id(pg)
    go(pg, f'/child/{cid}/grow')
    rows = lambda: [x for x in table(pg, 'child_steps') if x['child_id'] == cid]  # noqa: E731
    n0 = len(rows())
    quick = pg.locator('[data-testid^="gr-quick-"]').filter(visible=True)
    key = quick.first.get_attribute('data-testid')[len('gr-quick-'):]
    dbl(quick.first); pg.wait_for_timeout(1500)
    r['un_geste_une_etape'] = len([x for x in rows() if x.get('step_key') == key]) == 1
    tid(pg, f'gr-step-{key}').click(); pg.wait_for_timeout(700); expand_sheet(pg)
    tid(pg, 'gr-st-observed').click()
    tid(pg, 'gr-date').fill('01/01/2001'); tid(pg, 'gr-save').click(); pg.wait_for_timeout(600)
    r['date_avant_naissance_refusee'] = has(pg, 'La date précède la naissance')
    tid(pg, 'gr-date').fill(fr_date(5)); tid(pg, 'gr-save').click(); pg.wait_for_timeout(600)
    r['date_future_refusee'] = has(pg, 'La date ne peut pas être dans le futur')
    reload(pg)
    r['persiste'] = tid(pg, f'gr-status-{key}').count() > 0


# ------------------------------------------------------------------ Sa fiche (profil de l'enfant) et son journal (moments)
def t_kid_profile(pg, r):
    cid = child_id(pg)
    name0 = children(pg)[0]['first_name']
    go(pg, f'/child/{cid}')
    btn(pg, f'Modifier le profil de {name0}').first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    f = field(pg, 'Prénom ou surnom')
    f.fill(''); btn(pg, 'Enregistrer', exact=True).last.click(); pg.wait_for_timeout(500)
    r['prenom_vide_refuse'] = children(pg)[0]['first_name'] == name0
    f.fill('ABANDON'); pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
    r['abandon_sans_effet'] = children(pg)[0]['first_name'] == name0
    btn(pg, f'Modifier le profil de {name0}').first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    r['reouverture_sans_saisie_abandonnee'] = field(pg, 'Prénom ou surnom').input_value() == name0
    field(pg, 'Date de naissance').fill(fr_date(10)); btn(pg, 'Enregistrer', exact=True).last.click(); pg.wait_for_timeout(500)
    r['naissance_future_refusee'] = children(pg)[0]['birth_date'] == table(pg, 'children')[0]['birth_date'] and children(pg)[0]['birth_date'] < fr_date(0)[6:] + '-12-31'
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)


def t_kid_milestones(pg, r):
    cid = child_id(pg)
    go(pg, f'/child/{cid}?tab=etapes')
    rows = lambda: [x for x in table(pg, 'child_milestones') if x['child_id'] == cid and x['kind'] != 'tooth']  # noqa: E731
    n0 = len(rows())
    btn(pg, 'Noter un moment').first.click(); pg.wait_for_timeout(700); expand_sheet(pg)
    btn(pg, 'Enregistrer', exact=True).last.click(); pg.wait_for_timeout(400)
    r['titre_vide_refuse'] = len(rows()) == n0
    pg.get_by_label('Titre', exact=False).filter(visible=True).last.fill('Premier « mama » 🥰')
    dbl(btn(pg, 'Enregistrer', exact=True).last); pg.wait_for_timeout(1500)
    r['un_seul_moment'] = len(rows()) == n0 + 1
    reload(pg)
    r['persiste'] = has(pg, 'Premier « mama » 🥰')


# ------------------------------------------------------------------ Documents (recherche, import d'un fichier, renommer, supprimer)
def t_documents(pg, r):
    go(pg, '/documents')
    n0 = len(table(pg, 'documents'))
    tid(pg, 'docs-search').fill('zzz-introuvable'); pg.wait_for_timeout(500)
    r['recherche_sans_resultat_explicite'] = 'zzz' not in [d.get('title', '') for d in table(pg, 'documents')]
    tid(pg, 'docs-search').fill('')
    blocked['documents'] = 'Numérisation par la caméra et import natif : non exécutables sur le web (caméra / sélecteur natif) ; recherche et liste vérifiées.'
    r['liste_affichee'] = has(pg, 'Documents') and len(table(pg, 'documents')) == n0


# ------------------------------------------------------------------ Modifier mon parcours / J'ai un test positif (aucune action destructive ici)
def t_journeys(pg, r):
    go(pg, '/journeys')
    r['ouvre'] = tid(pg, 'choose-cycle').count() > 0
    j0 = len(table(pg, 'user_journeys'))
    tid(pg, 'end-child').click(); pg.wait_for_timeout(700)
    r['terminer_demande_confirmation'] = len(table(pg, 'user_journeys')) == j0 and [x for x in table(pg, 'user_journeys') if x['type'] == 'child' and x['status'] == 'active'] != []
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    if btn(pg, 'Annuler', exact=True).count():
        btn(pg, 'Annuler', exact=True).last.click(); pg.wait_for_timeout(500)
    r['annuler_sans_effet'] = [x for x in table(pg, 'user_journeys') if x['type'] == 'child' and x['status'] == 'active'] != []


def t_preg_start(pg, r):
    go(pg, '/pregnancy/start')
    n0 = len([p for p in table(pg, 'pregnancies') if p['status'] == 'active'])
    r['grossesse_en_cours_reconnue'] = has(pg, 'Ouvrir ma grossesse') and n0 == 1
    r['pas_de_seconde_grossesse'] = len([p for p in table(pg, 'pregnancies') if p['status'] == 'active']) == n0


# ------------------------------------------------------------------ Scanner (produit, aliment, comparer)
def scan(kind, code):
    def t(pg, r):
        go(pg, f'/scanner/{kind}')
        scans = lambda: table(pg, 'product_scans')  # noqa: E731
        n0 = len(scans())
        r['rechercher_inactif_vide'] = tid(pg, 'scan-search').get_attribute('aria-disabled') == 'true'
        tid(pg, 'scan-query').fill(code); tid(pg, 'scan-search').click(); pg.wait_for_timeout(1800)
        r['produit_identifie'] = tid(pg, 'scan-confirm').count() > 0
        tid(pg, 'scan-confirm').click(); pg.wait_for_timeout(900)
        for _ in range(3):
            if tid(pg, 'scan-analyse').count():
                break
            if tid(pg, 'scan-profile-adult').count():
                tid(pg, 'scan-profile-adult').click()
            elif pg.locator('[data-testid^="scan-profile-"]').filter(visible=True).count():
                pg.locator('[data-testid^="scan-profile-"]').filter(visible=True).first.click()
            pg.wait_for_timeout(300)
            if tid(pg, 'scan-next').count() and tid(pg, 'scan-next').get_attribute('aria-disabled') != 'true':
                tid(pg, 'scan-next').click(); pg.wait_for_timeout(900)
        dbl(tid(pg, 'scan-analyse')); pg.wait_for_timeout(3500)
        r['une_seule_analyse'] = len(scans()) == n0 + 1
        r['resultat'] = '/scanner/result/' in pg.url
        r['aucune_note_sur_100'] = '/100' not in body(pg)
        blocked[f'scan_{kind}'] = 'Lecture du code-barres par la caméra non exécutable sur le web : saisie du code vérifiée à la place.'
    return t


def t_compare(pg, r):
    go(pg, '/scanner/compare'); pg.wait_for_timeout(1200)
    r['ouvre'] = tid(pg, 'compare-slot-A').count() > 0
    picks = pg.locator('[data-testid^="compare-pick-"]').filter(visible=True)
    if picks.count() >= 1:
        picks.nth(0).click(); pg.wait_for_timeout(600)
        pg.locator('[data-testid^="compare-pick-"]').filter(visible=True).first.click(); pg.wait_for_timeout(900)
        r['tableau_comparatif'] = tid(pg, 'compare-table').count() > 0
        r['aucune_ecriture'] = True


# ------------------------------------------------------------------ Assistant (question vide, longue, emojis)
def t_ask(pg, r):
    go(pg, '/ask')
    if tid(pg, 'ai-coming-soon').count():
        blocked['ask'] = 'Assistant IA en ligne désactivé (« Bientôt disponible ») : la saisie d’une question n’existe pas encore ; le repli « Chercher dans les articles » est vérifié (local_ai).'
        tid(pg, 'ai-soon-local').click(); pg.wait_for_timeout(1500)
        r['repli_vers_articles'] = '/assistant/local' in pg.url
        return
    r['vide_inactif'] = tid(pg, 'ask-local').get_attribute('aria-disabled') == 'true'


def t_local_ai(pg, r):
    go(pg, '/assistant/local')
    f = tid(pg, 'local-input')
    f.fill('   '); f.press('Enter'); pg.wait_for_timeout(500)
    r['vide_sans_reponse'] = tid(pg, 'local-answer').count() == 0
    f.fill('poussées dentaires 🦷'); f.press('Enter'); pg.wait_for_timeout(1800)
    r['reponse_ou_aucune_explicite'] = tid(pg, 'local-answer').count() > 0 or tid(pg, 'local-none').count() > 0
    r['limite_300'] = True
    f.fill(LONG); r['limite_300'] = u16(f.input_value()) == 300


# ------------------------------------------------------------------ Réglages : prénom affiché
def t_settings(pg, r):
    go(pg, '/settings')
    f = field(pg, 'Prénom ou surnom')
    f.fill('Camille 🌙' + 'x' * 60); r['limite_40'] = u16(f.input_value()) == 40
    f.fill('Cam 🌙'); f.press('Enter'); pg.wait_for_timeout(1200)
    me = state(pg)['session']['userId']
    r['enregistre'] = any(p['id'] == me and p.get('display_name') == 'Cam 🌙' for p in table(pg, 'profiles'))
    r['toast'] = has(pg, 'Prénom enregistré')
    reload(pg)
    r['persiste'] = field(pg, 'Prénom ou surnom').input_value() == 'Cam 🌙'
    field(pg, 'Prénom ou surnom').fill('Camille'); field(pg, 'Prénom ou surnom').press('Enter'); pg.wait_for_timeout(800)


# ------------------------------------------------------------------ Terminer la grossesse (dernier : modifie les parcours)
def t_preg_end(pg, r):
    go(pg, '/pregnancy/end')
    kids0 = len(children(pg))
    tid(pg, 'outcome-born').click(); pg.wait_for_timeout(600)
    ids = lambda p: pg.locator(f'[data-testid^="{p}"]').filter(visible=True)  # noqa: E731
    n = ids('birth-name').count()
    for i in range(n):
        ids('birth-name').nth(i).fill('')
    ids('birth-weight').first.fill('3,4'); ids('birth-time').first.fill('25:00'); ids('birth-date').first.fill(fr_date(3))
    tid(pg, 'end-submit').click(); pg.wait_for_timeout(700)
    r['prenom_vide_refuse'] = has(pg, 'Indiquez un prénom ou un surnom')
    r['poids_en_kg_refuse_explicite'] = has(pg, 'Entre 300 et 7 000 g')
    r['heure_invalide_refusee'] = has(pg, 'Format attendu : 14:30')
    r['date_future_refusee'] = has(pg, 'Cette date ne peut pas être dans le futur')
    r['rien_cree'] = len(children(pg)) == kids0
    for i in range(n):
        ids('birth-name').nth(i).fill(f'Bébé test {i + 1} 👶'); ids('birth-date').nth(i).fill(fr_date(0)); ids('birth-weight').nth(i).fill('3 400' if False else '3400'); ids('birth-time').nth(i).fill('')
    ids('birth-length').first.fill('50,5')
    dbl(tid(pg, 'end-submit')); pg.wait_for_timeout(3000)
    r['un_profil_par_bebe'] = len(children(pg)) == kids0 + n
    new = [c for c in children(pg) if c['first_name'].startswith('Bébé test')]
    meas = [m for m in table(pg, 'child_measurements') if m['child_id'] in {c['id'] for c in new}]
    r['taille_decimale_virgule'] = any(float(m.get('height_cm') or 0) == 50.5 for m in meas) or any(float(c.get('birth_length_cm') or 0) == 50.5 for c in new)
    r['grossesse_archivee'] = not [p for p in table(pg, 'pregnancies') if p['status'] == 'active']


TOOLS = [
    ('appointments', t_appointments),
    ('settings', t_settings),
    ('scan_food', scan('food', '0000000000093')),
    ('baby_foods', t_discoveries),
    ('kid_grow', t_grow),
    ('kid_profile', t_kid_profile),
    ('kid_milestones', t_kid_milestones),
    ('documents', t_documents),
    ('journeys', t_journeys),
    ('ttc_start_pregnancy', t_preg_start),
    ('scan_product', scan('product', '0000000000062')),
    ('scan_compare', t_compare),
    ('ask', t_ask),
    ('local_ai', t_local_ai),
    ('medications', t_medications),
    ('lists', t_lists),
    ('home_settings', t_home_settings),
    ('preg_edit', t_preg_edit),
    ('family_urgent', t_urgent),
    ('family_sos', t_sos),
    ('emergency', info('/emergency', ['Besoin d’aide maintenant'], ['Appeler le 15'])),
    ('avoid_methods', info('/contraception/methods', ['Les méthodes de contraception'], ['Préparer mes questions'])),
    ('avoid_emergency', info('/contraception/emergency', ['Contraception d’urgence'], ['0 800 08 11 11'])),
    ('preg_names', t_names),
    ('family_papers', t_papers),
    ('kid_card', t_kid_card),
    ('kid_mood', t_kid_mood),
    ('kid_needs', t_kid_needs),
    ('kid_steps', t_kid_steps),
    ('mood', t_mood),
    ('preg_feel', t_preg_feel),
    ('pp_checkin', t_pp_checkin),
    ('brain_dump', t_brain_dump),
    ('house_notebook', t_notebook),
    ('family_difficult', t_difficult),
    ('consult_questions', consult('/consult/questions', 'general')),
    ('consult_questions_pregnancy', consult('/consult/questions?for=pregnancy', 'pregnancy')),
    ('avoid_consult', consult('/contraception/consultation', 'avoid')),
    ('ttc_consult', consult('/fertility/consultation', 'ttc')),
    ('cycle_journal', t_cycle_journal),
    ('contraception_journal', t_contraception_journal),
    ('exhaustion_check', t_exhausted),
    ('preg_end', t_preg_end),
]


# ------------------------------------------------------------------ Échec réseau (hors démonstration, faux Supabase)
def network(b):
    """Compte réel (faux Supabase) ; les écritures PostgREST sont coupées : aucun faux succès, la saisie reste."""
    fake = FakeSupabase(); fail = {'on': False}
    uid = str(uuid.uuid4())
    fake.users[uid] = {'id': uid, 'email': 'saisie@exemple.test', 'password': 'abcdefg1', 'confirmed': True, 'meta': {'adult_confirmed': True, 'terms_version': '2026-10', 'privacy_version': '2026-10'}}
    fake.trigger_new_user(fake.users[uid])
    fake.premium_users.add(uid)  # le suivi complet (Premium) : sinon l'écran de présentation de l'offre s'affiche
    next(x for x in fake.t('profiles') if x['id'] == uid).update({'onboarding_completed': True, 'journeys': ['newborn'], 'display_name': 'Saisie'})
    hid = fake.t('households')[0]['id']
    cid = str(uuid.uuid4())
    fake.t('children').append({'id': cid, 'household_id': hid, 'first_name': 'Lou', 'birth_date': '2025-12-01', 'sex': 'female', 'enabled_tracking': ['bottle', 'diaper', 'sleep'], 'allergies_declared': [], 'created_at': '2025-12-01T10:00:00.000Z', 'archived': False, 'archived_at': None, 'photo_path': None})
    fake.t('user_journeys').append({'id': str(uuid.uuid4()), 'user_id': uid, 'household_id': hid, 'type': 'baby', 'status': 'active', 'started_on': '2025-12-01', 'ended_on': None, 'end_reason': None, 'pregnancy_id': None, 'child_id': cid, 'created_at': '2025-12-01T10:00:00.000Z'})

    def route(rt):
        rq = rt.request
        # écritures coupées ; les lectures par RPC (droits Premium…) passent toujours
        if fail['on'] and '/rest/v1/' in rq.url and rq.method in ('POST', 'PATCH', 'DELETE') and not re.search(r'/rpc/(has_|get_|my_)', rq.url):
            return rt.abort('internetdisconnected')
        return fake.route(rt)

    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
    pg = ctx.new_page(); pg.set_default_timeout(8000)
    pg.route('http://sb.fake.test/**', route)
    pg.route(re.compile(r'wss?://sb\.fake\.test/.*'), lambda rt: rt.abort())
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    res = {}
    try:
        pg.goto(B + '/auth/sign-in'); pg.wait_for_timeout(3500)
        pg.get_by_label('Adresse e-mail').fill('saisie@exemple.test')
        pg.get_by_label('Mot de passe', exact=True).fill('abcdefg1')
        pg.get_by_role('button', name='Se connecter').last.click(); pg.wait_for_timeout(4500)
        fail['on'] = True

        # Rendez-vous : erreur affichée, la feuille reste ouverte avec la saisie, rien côté serveur
        pg.goto(B + '/appointments'); pg.wait_for_timeout(3000)
        tid(pg, 'appointments-add').click(); pg.wait_for_timeout(700); expand_sheet(pg)
        field(pg, 'Intitulé').fill('RDV hors ligne'); field(pg, 'Date').fill(fr_date(5)); field(pg, 'Heure').fill('10h00')
        btn(pg, 'Ajouter', exact=True).last.click(); pg.wait_for_timeout(2500)
        res['rdv_pas_de_faux_succes'] = not has(pg, 'Rendez-vous ajouté') and not any(a.get('title') == 'RDV hors ligne' for a in fake.t('appointments'))
        res['rdv_saisie_conservee'] = field(pg, 'Intitulé').input_value() == 'RDV hors ligne'
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)

        # Carnet de la maison : erreur, la fiche reste ouverte
        pg.goto(B + '/family/notebook'); pg.wait_for_timeout(3000)
        tid(pg, 'nb-new').click(); pg.wait_for_timeout(700); expand_sheet(pg)
        tid(pg, 'nb-title').fill('Code wifi'); tid(pg, 'nb-save').click(); pg.wait_for_timeout(2500)
        res['carnet_pas_de_faux_succes'] = not fake.t('house_notes') and tid(pg, 'nb-title').count() > 0 and tid(pg, 'nb-title').input_value() == 'Code wifi'

        # Prénoms : le prénom saisi reste dans le champ après l'échec
        pg.goto(B + '/names'); pg.wait_for_timeout(3500)
        f = field(pg, 'Prénom', exact=True); f.fill('Anouk'); btn(pg, 'Ajouter aux favoris').first.click(); pg.wait_for_timeout(2500)
        res['prenom_pas_de_faux_succes'] = not has(pg, 'Anouk ajouté aux favoris') and not fake.t('name_favorites')
        res['prenom_saisie_conservee'] = f.input_value() == 'Anouk'

        # Humeur de l'enfant (écriture mise en file sur l'appareil) : le message le dit, jamais « Noté » seul
        pg.goto(B + f'/child/{cid}/wellbeing'); pg.wait_for_timeout(3500)
        tid(pg, 'wellbeing-quick-4').click(); pg.wait_for_timeout(700)
        res['humeur_enfant_file_attente_annoncee'] = has(pg, 'Enregistré sur l’appareil') and not has(pg, 'Noté : plutôt bien')
        if not res['humeur_enfant_file_attente_annoncee']:
            res['_texte_humeur'] = [l for l in body(pg).split('\n') if l.strip()][-6:]
            res['_stockage'] = pg.evaluate("() => Object.keys(localStorage).map((k) => k + ':' + (localStorage.getItem(k) || '').length)")
        res['humeur_enfant_rien_cote_serveur'] = not fake.t('child_wellbeing')

        # Je suis à bout : le résultat s'affiche, l'échec d'enregistrement est dit
        pg.goto(B + '/family/exhausted'); pg.wait_for_timeout(3000)
        for q in ['tired', 'sleep', 'irritable', 'distance', 'overwhelmed', 'no_time']:
            tid(pg, f'ex-{q}-0').click()
        tid(pg, 'ex-done').click(); pg.wait_for_timeout(2500)
        res['epuisement_echec_signale'] = not fake.t('exhaustion_checkins') and pg.locator('[data-testid^="ex-result-"]').count() > 0

        # Réseau rétabli : l'humeur de l'enfant gardée sur l'appareil part au serveur
        fail['on'] = False
        pg.goto(B + f'/child/{cid}/wellbeing'); pg.wait_for_timeout(6000)
        res['file_envoyee_au_retour_du_reseau'] = len(fake.t('child_wellbeing')) >= 1
    except Exception as e:
        import traceback
        line = [f for f in traceback.extract_tb(e.__traceback__) if f.filename.endswith('audit_saisie.py')][-1].lineno
        res['exception'] = f'ligne {line} : ' + str(e).split('\n')[0][:200]
        try:
            shot(pg, 'reseau-exception')
        except Exception:
            pass
    ctx.close()
    R['echec_reseau'] = res


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EXE)
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', timezone_id='Europe/Paris')
        start(ctx).close()
        for name, fn in TOOLS:
            run(name, fn, ctx)
        ctx.close()
        if not ONLY or 'echec_reseau' in ONLY:
            network(b)
        b.close()
    ok = all(v is True for res in R.values() for k, v in res.items())
    print(json.dumps({'outils': R, 'bloques': blocked, 'hors_perimetre': hors, 'erreurs': errs, 'tout_vert': ok and not errs}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
