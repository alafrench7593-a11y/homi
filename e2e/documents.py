"""
Documents : scanner, import, lecture, résumé, correction, ordonnance, carnet, profil, recherche, rappel, export, suppression.
Version web de démonstration (sans compte) :
  npx expo export --platform web --clear && python3 e2e/spa_server.py dist 8822 &
  python3 e2e/documents.py <dossier_de_fichiers_de_test>
Le dossier contient page1.jpg, page2.jpg (photos de feuilles sur fond sombre), ordonnance.pdf, lettre.docx, enorme.pdf (> 25 Mo).
Chaque clé du rapport doit valoir true ; « erreurs » doit être vide.
Limites : la caméra réelle, la détection native du téléphone (ML Kit) et le service de lecture serveur ne sont pas exercés ici.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

B = os.environ.get('NAV_URL', 'http://127.0.0.1:8822')
F = sys.argv[1]
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e')
os.makedirs(SHOTS, exist_ok=True)
R, errs = {}, []

BLOOD = """LABORATOIRE DES LILAS
Dr Martin Dupont
Prélèvement du 23/09/2026
COMPTE RENDU D'ANALYSES
Hémoglobine 11,8 g/dL (12,0 - 16,0)
Ferritine 9 µg/L (15 - 150)
TSH 2,1 mUI/L
Conclusion : contrôle conseillé dans 3 mois.
Rendez-vous de contrôle le 03/12/2030"""
ORDO = """Dr Claire Bernard
Paris, le 12 octobre 2026
ORDONNANCE
AMOXICILLINE 250 mg/5 ml poudre pour suspension buvable
1 dose-poids matin et soir pendant 6 jours
DOLIPRANE 2,4 % suspension buvable
si fièvre, 1 dose-poids toutes les 6 heures"""


def demo(pg, js):
    # tables absentes = vides (le mode démo ne crée une table qu'à la première écriture)
    return pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('toietmoi.demo.v1')); s.tables = new Proxy(s.tables, { get: (o, k) => o[k] || [] }); return (" + js + ")(s); }")


def T(pg):
    return pg.inner_text('body')


def click(pg, name, exact=True):
    pg.get_by_role('button', name=name, exact=exact).filter(visible=True).last.click()


def vis(pg, text):
    """Texte visible (les écrans d'onglets restent montés en arrière-plan)."""
    return pg.get_by_text(text, exact=True).filter(visible=True)


def run(p):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR', accept_downloads=True)
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and errs.append(m.text[:200]))
    pg.on('pageerror', lambda e: errs.append('PAGE ' + str(e)[:200]))
    pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
    pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
    before = demo(pg, "s => s.tables.documents.length")

    # 1-4. Scanner : une page, puis une deuxième ; recadrage ; ordre des pages
    pg.goto(B + '/documents'); pg.wait_for_timeout(2000)
    click(pg, 'Scanner un document'); pg.wait_for_timeout(1500)
    with pg.expect_file_chooser() as fc: click(pg, 'Prendre une photo')
    R['1_capture_ouvre_l_appareil_photo'] = fc.value.element.get_attribute('capture') is not None
    fc.value.set_files(F + '/page1.jpg')
    pg.wait_for_selector('text=Page 1', timeout=30000); pg.wait_for_timeout(500)
    R['1_page_scannee'] = 'Bords de la feuille détectés' in T(pg)
    with pg.expect_file_chooser() as fc: click(pg, 'Ajouter une page')
    fc.value.set_files(F + '/page2.jpg')
    pg.wait_for_selector('text=Page 2', timeout=30000); pg.wait_for_timeout(500)
    R['2_deux_pages'] = 'Page 2' in T(pg)
    pg.screenshot(path=f'{SHOTS}/doc-pages.png', full_page=True)
    srcs = lambda: pg.eval_on_selector_all('img', "els => els.map(e => e.src).filter(s => s.startsWith('data:image/jpeg'))")
    first_before = srcs()[0]
    # Recadrage : déplacer le coin haut gauche
    click(pg, 'Recadrer la page 1'); pg.wait_for_timeout(800)
    corner = pg.get_by_label('Coin haut gauche').filter(visible=True).first.bounding_box()
    pg.mouse.move(corner['x'] + 15, corner['y'] + 15); pg.mouse.down(); pg.mouse.move(corner['x'] + 60, corner['y'] + 70, steps=6); pg.mouse.up()
    pg.screenshot(path=f'{SHOTS}/doc-crop.png')
    click(pg, 'Appliquer'); pg.wait_for_timeout(2500)
    R['3_recadrage_applique'] = srcs()[0] != first_before and 'Bords non détectés' in T(pg)
    # Rotation et niveaux de gris
    click(pg, 'Faire pivoter la page 2'); pg.wait_for_timeout(1500)
    vis(pg, 'Niveaux de gris').first.click(); pg.wait_for_timeout(1500)
    # Réorganiser : la page 2 monte en première position
    p2 = srcs()[1]
    click(pg, 'Monter la page 2'); pg.wait_for_timeout(800)
    R['4_pages_reorganisees'] = srcs()[0] == p2
    click(pg, 'Aperçu'); pg.wait_for_timeout(800)
    R['4_apercu'] = len(srcs()) == 2
    click(pg, 'Continuer'); pg.wait_for_timeout(1200)

    # 12. Profil associé affiché clairement, choix d'un enfant
    pg.get_by_label('Nom du document').filter(visible=True).first.fill('Prise de sang septembre')
    vis(pg, 'Santé').first.click(); vis(pg, 'Analyse sanguine').first.click()
    vis(pg, 'Lina').first.click(); pg.wait_for_timeout(300)
    R['12_profil_affiche_avant_enregistrement'] = 'Ce document sera associé à : Lina' in T(pg)
    vis(pg, 'Moi').first.click(); pg.wait_for_timeout(300)
    click(pg, 'Enregistrer en PDF'); pg.wait_for_timeout(5000)
    R['2_enregistre_en_pdf'] = 'Document enregistré' in T(pg) or 'Votre document est enregistré' in T(pg)
    doc = demo(pg, "s => { const d = s.tables.documents[s.tables.documents.length - 1]; const f = s.tables._files.find(x => x.path === d.storage_path); return { id: d.id, pages: d.page_count, mime: d.mime_type, priv: d.private_to_uploader, pdf: f && f.uri.startsWith('data:application/pdf'), child: d.child_id } }")
    R['2_pdf_deux_pages_prive_par_defaut'] = doc['pages'] == 2 and doc['mime'] == 'application/pdf' and doc['pdf'] and doc['priv'] is True and doc['child'] is None
    pg.screenshot(path=f'{SHOTS}/doc-saved.png')
    click(pg, 'Ouvrir le document'); pg.wait_for_timeout(2500)

    # 7. Texte : le mode démo n'envoie rien au service de lecture → saisie
    click(pg, 'Lire le texte (service de lecture)'); pg.wait_for_timeout(600)
    click(pg, 'Envoyer pour lecture'); pg.wait_for_timeout(1500)
    R['7_service_lecture_non_utilise_en_demo'] = 'aucun document n’est envoyé' in T(pg)
    click(pg, 'Saisir ou coller le texte'); pg.wait_for_timeout(500)
    pg.get_by_label('Texte', exact=True).filter(visible=True).first.fill(BLOOD)
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    body = T(pg)
    R['7_texte_enregistre_a_verifier'] = 'Saisi à la main' in body and 'À vérifier' in body
    R['7_valeurs_reperees_exactes'] = '11,8 g/dL' in body and 'plage indiquée sur le document : 12,0 - 16,0' in body and 'TSH' in body
    # Date repérée : proposée, pas imposée
    R['7_date_detectee_a_confirmer'] = 'détectée automatiquement, à confirmer' in body
    click(pg, re.compile('^Confirmer la date du'), exact=False); pg.wait_for_timeout(1000)
    R['7_date_confirmee'] = 'confirmée par vous' in T(pg)

    # 9. Corriger une information mal reconnue
    click(pg, 'Corriger'); pg.wait_for_timeout(600)
    pg.get_by_label('Valeur').filter(visible=True).nth(2).filter(visible=True).first.fill('2,10')
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    R['9_correction_enregistree'] = '2,10' in T(pg) and 'Extrait automatiquement — à vérifier' in T(pg)
    click(pg, 'J’ai vérifié'); pg.wait_for_timeout(1200)
    R['9_marque_verifie'] = 'Vérifié par vous' in T(pg)
    click(pg, 'Confirmé par un professionnel'); pg.wait_for_timeout(500)
    save_disabled = pg.get_by_role('button', name='Enregistrer', exact=True).last.is_disabled()
    pg.get_by_label('Source de la confirmation').filter(visible=True).first.fill('Relu avec ma médecin le 25/09/2026')
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1200)
    R['9_professionnel_seulement_avec_source'] = save_disabled and 'Confirmé par un professionnel' in T(pg) and 'Source indiquée' in T(pg)

    # 8. Résumé : trois niveaux, origine de chaque information
    click(pg, 'Résumer ce document'); pg.wait_for_timeout(1500)
    s = T(pg)
    R['8_resume_rapide'] = 'Type de document' in s and 'Conclusion : contrôle conseillé dans 3 mois.' in s and 'Écrit dans le document' in s
    vis(pg, 'Détaillé').first.click(); pg.wait_for_timeout(1200)
    s = T(pg)
    R['8_resume_detaille'] = 'Valeurs et éléments chiffrés' in s and 'Questions à poser au professionnel' in s and not re.search(r'\b(normal|anormal|carence|anémie)\b', s, re.I)
    vis(pg, 'Explication simple').first.click(); pg.wait_for_timeout(1200)
    R['8_explication_simple'] = 'Termes expliqués' in T(pg) and 'Explication générale' in T(pg)
    pg.screenshot(path=f'{SHOTS}/doc-resume.png', full_page=True)

    # 14. Rappel depuis une date confirmée
    click(pg, 'Ajouter un rappel'); pg.wait_for_timeout(700)
    R['14_date_ambigue_signalee'] = 'peut se lire de deux façons' in T(pg)
    pg.get_by_label('Date', exact=True).filter(visible=True).last.fill('03/12/2030')
    click(pg, 'Créer le rappel'); pg.wait_for_timeout(1500)
    rem = demo(pg, f"s => s.tables.reminders.filter(r => r.deep_link === '/documents/{doc['id']}')")
    R['14_rappel_cree_discret'] = len(rem) == 1 and rem[0]['title'] == 'Rappel' and rem[0]['schedule']['at'].startswith('2030-12-03')

    # 10. Ordonnance : import d'un PDF, texte, classement
    pg.goto(B + '/documents'); pg.wait_for_timeout(1500)
    click(pg, 'Importer'); pg.wait_for_timeout(600)
    with pg.expect_file_chooser() as fc: click(pg, 'PDF ou fichier (Fichiers, Drive…)')
    R['5_import_multiple_possible'] = fc.value.is_multiple()
    fc.value.set_files(F + '/ordonnance.pdf'); pg.wait_for_timeout(2500)
    R['5_import_pdf'] = '1 fichier importé' in T(pg)
    vis(pg, 'Santé').first.click(); vis(pg, 'Ordonnance').first.click()
    vis(pg, 'Noé').first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(3500)
    o = demo(pg, "s => { const d = s.tables.documents[s.tables.documents.length - 1]; return { id: d.id, cat: d.category, pages: d.page_count, child: d.child_id } }")
    noe = demo(pg, "s => s.tables.children.find(c => c.first_name === 'Noé').id")
    R['10_ordonnance_classee'] = o['cat'] == 'prescription' and o['pages'] == 2
    R['12_associee_au_bon_profil'] = o['child'] == noe
    pg.goto(B + f"/documents/{o['id']}"); pg.wait_for_timeout(2500)
    click(pg, 'Saisir ou coller le texte'); pg.wait_for_timeout(400)
    pg.get_by_label('Texte', exact=True).filter(visible=True).first.fill(ORDO)
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1500)
    s = T(pg)
    R['10_ordonnance_archivee_par_defaut'] = 'Prescription archivée' in s and 'ne dit pas de commencer, d’arrêter' in s
    R['10_dose_et_duree_non_devinees'] = 'Durée : non indiquée' in s and 'AMOXICILLINE' in s
    pg.screenshot(path=f'{SHOTS}/doc-ordonnance.png', full_page=True)
    # Changement de profil : avertissement avant
    click(pg, 'Modifier'); pg.wait_for_timeout(600)
    vis(pg, 'Lina').first.click()
    click(pg, 'Enregistrer'); pg.wait_for_timeout(800)
    R['12_avertissement_changement_profil'] = 'Changer le profil associé ?' in T(pg)
    click(pg, 'Annuler'); pg.wait_for_timeout(600)

    # 6. Import d'une photo (passe par l'éditeur de pages)
    pg.goto(B + '/documents'); pg.wait_for_timeout(1500)
    click(pg, 'Importer'); pg.wait_for_timeout(500)
    with pg.expect_file_chooser() as fc: click(pg, 'Photos de ma galerie')
    fc.value.set_files(F + '/page2.jpg'); pg.wait_for_selector('text=Page 1', timeout=30000)
    R['6_import_photo_editeur'] = 'Améliorer la lisibilité' in T(pg)
    click(pg, 'Continuer'); pg.wait_for_timeout(800)
    pg.get_by_label('Nom du document').filter(visible=True).first.fill('Carnet vaccins photo')
    vis(pg, 'Santé').first.click(); vis(pg, 'Vaccination').first.click()
    click(pg, 'Enregistrer en PDF'); pg.wait_for_timeout(4000)

    # 20. Erreurs : format non pris en charge, fichier trop volumineux
    pg.goto(B + '/documents'); pg.wait_for_timeout(1500)
    click(pg, 'Importer'); pg.wait_for_timeout(500)
    with pg.expect_file_chooser() as fc: click(pg, 'PDF ou fichier (Fichiers, Drive…)')
    fc.value.set_files([F + '/lettre.docx', F + '/enorme.pdf']); pg.wait_for_timeout(2500)
    s = T(pg)
    R['20_format_refuse'] = 'format non pris en charge' in s
    R['20_fichier_trop_volumineux'] = 'fichier trop volumineux' in s
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)

    # 13. Recherche
    pg.goto(B + '/documents'); pg.wait_for_timeout(2000)
    pg.get_by_label('Rechercher').filter(visible=True).first.fill('ferritine'); pg.wait_for_timeout(900)
    R['13_recherche_texte'] = '1 résultat' in T(pg) and 'Prise de sang septembre' in T(pg)
    pg.get_by_label('Rechercher').filter(visible=True).first.fill('ordonnances de cette année'); pg.wait_for_timeout(900)
    R['13_recherche_langage_courant'] = 'Compris :' in T(pg) and 'ordonnance' in T(pg).lower()
    pg.get_by_label('Rechercher').filter(visible=True).first.fill('')

    # 11. Carnet de santé
    pg.goto(B + '/documents/book'); pg.wait_for_timeout(2000)
    s = T(pg)
    R['11_carnet_moi'] = 'Derniers résultats' in s and 'Prise de sang septembre' in s and 'Confirmé par un professionnel' in s
    vis(pg, 'Noé').first.click(); pg.wait_for_timeout(800)
    R['11_carnet_enfant_ordonnance'] = 'Ordonnances enregistrées' in T(pg) and 'Prescription archivée' in T(pg)
    pg.screenshot(path=f'{SHOTS}/doc-carnet.png', full_page=True)

    # 15. Export de plusieurs documents
    pg.goto(B + '/documents'); pg.wait_for_timeout(2000)
    pg.get_by_label('Exporter').filter(visible=True).first.click(); pg.wait_for_timeout(600)
    pg.get_by_label(re.compile('^Prise de sang septembre')).filter(visible=True).first.click()
    pg.get_by_label(re.compile('^Carnet vaccins photo')).filter(visible=True).first.click()
    click(pg, re.compile('^Exporter 2 documents'), exact=False); pg.wait_for_timeout(2000)
    pg.get_by_label('Ajouter les résumés').filter(visible=True).first.click(); pg.wait_for_timeout(300)
    R['15_apercu_et_risques'] = 'Avant de partager' in T(pg) and 'Index des documents' in T(pg)
    click(pg, 'Créer le dossier PDF'); pg.wait_for_timeout(5000)
    with pg.expect_download() as dl: click(pg, 'Télécharger le dossier')
    path = dl.value.path()
    data = open(path, 'rb').read()
    R['15_dossier_pdf'] = data[:5] == b'%PDF-' and dl.value.suggested_filename.endswith('.pdf')
    # pdf-lib compresse les objets : on compte les pages avec pdf-lib (index + 2 pages + 1 page + 1 page de résumé)
    import subprocess
    n = subprocess.run(['node', '-e', "require('pdf-lib').PDFDocument.load(require('fs').readFileSync(process.argv[1])).then(d => console.log(d.getPageCount()))", path], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).stdout.strip()
    R['15_dossier_pages'] = n.isdigit() and int(n) >= 5
    R['15_dossier_nombre_de_pages'] = int(n) if n.isdigit() else n

    # 16-17. Suppression et données dérivées
    pg.goto(B + f"/documents/{doc['id']}"); pg.wait_for_timeout(2500)
    click(pg, 'Supprimer le document'); pg.wait_for_timeout(600)
    R['16_confirmation_avant_suppression'] = 'Supprimer définitivement ?' in T(pg)
    click(pg, 'Supprimer'); pg.wait_for_timeout(2500)
    left = demo(pg, f"s => ({{ doc: s.tables.documents.some(d => d.id === '{doc['id']}'), ex: (s.tables.document_extractions || []).some(x => x.document_id === '{doc['id']}'), rem: s.tables.reminders.some(r => r.deep_link === '/documents/{doc['id']}'), file: s.tables._files.some(f => f.path && f.path.includes('{doc['id']}')) }})")
    R['16_document_supprime'] = not left['doc']
    R['17_donnees_derivees_supprimees'] = not left['ex'] and not left['rem']

    # 20. Document illisible → nouvelle numérisation ou saisie
    o2 = demo(pg, "s => s.tables.documents[s.tables.documents.length - 1].id")
    pg.goto(B + f'/documents/{o2}'); pg.wait_for_timeout(2500)
    click(pg, 'Saisir ou coller le texte'); pg.wait_for_timeout(400)
    pg.get_by_label('Texte', exact=True).filter(visible=True).first.fill('§§ ¤¤ ## ?? ~~\n@@ ## ¤¤')
    click(pg, 'Enregistrer'); pg.wait_for_timeout(1200)
    click(pg, 'Résumer ce document'); pg.wait_for_timeout(1000)
    R['20_document_illisible'] = 'Lecture insuffisante' in T(pg)

    # Anglais : écrans traduits
    pg.goto(B + '/settings/language'); pg.wait_for_timeout(1500)
    pg.get_by_role('radio', name='English').click(); pg.wait_for_timeout(1800)
    pg.goto(B + '/documents'); pg.wait_for_timeout(2000)
    R['anglais'] = 'Scan a document' in T(pg) and 'Health record' in T(pg)
    ctx.close(); b.close()

with sync_playwright() as p:
    try:
        run(p)
    except Exception as e:  # rapport partiel : la vérification en cours est notée en échec
        R['ARRET'] = str(e).split('\n')[0][:200]
R['erreurs'] = errs
print(json.dumps(R, ensure_ascii=False, indent=1))
