"""
Cinq langues (08/11/2026) — version web de démonstration, largeur 375 px (plus petit iPhone pris en charge).
Pour chaque langue (fr, en, es, de, it) :
  - choix de la langue (Réglages › Langue) ; persistance après rechargement ;
  - parcours principaux : accueil, agenda, suivi, outils, communauté, profil, médicaments, notifications, abonnement,
    cycle, grossesse, réglages, langue, compte, avis ;
  - aucun débordement horizontal ; aucun texte français resté sur l'écran (mots-témoins) hors noms propres ;
  - format de date dans la langue ; captures d'écran pour relecture.
La relecture du sens (traductions médicales) reste humaine.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from journey_seed import SIMPLE_OFF  # noqa: E402

B = 'http://127.0.0.1:8822'
SHOTS = os.environ.get('E2E_SHOTS', '/tmp/toietmoi-e2e') + '/lang5'
os.makedirs(SHOTS, exist_ok=True)
NAMES = {'fr': 'Français', 'en': 'English', 'es': 'Español', 'de': 'Deutsch', 'it': 'Italiano'}
SCREENS = ['/', '/agenda', '/track', '/tools', '/community', '/profile', '/medications', '/settings/notifications',
           '/settings/subscription', '/cycle', '/pregnancy', '/settings', '/settings/language', '/settings/account', '/feedback', '/library']
# Mots français qui ne devraient plus apparaître dans une autre langue (hors noms propres : CAF, PMI, Au fil de nous…)
FR_WORDS = re.compile(r"\b(Réglages|Bonjour|Mes |Ajouter|Enregistrer|Rendez-vous|aujourd’hui|Fermer|Retour|Paramètres|Suivant|Annuler|Valider|grossesse|enfant)\b")
R, errs, warns = {}, [], []
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang in ['fr', 'en', 'es', 'de', 'it']:
        ctx = b.new_context(viewport={'width': 375, 'height': 812}, locale='fr-FR', timezone_id='Europe/Paris')
        pg = ctx.new_page()
        missing = []
        pg.on('console', lambda m, missing=missing: '[i18n]' in m.text and missing.append(m.text[:120]))
        pg.on('pageerror', lambda e: errs.append(f'{lang}: {str(e)[:160]}'))
        pg.goto(B + '/welcome'); pg.wait_for_timeout(2500)
        pg.get_by_text('Découvrir sans compte').first.click(); pg.wait_for_timeout(4500)
        pg.evaluate(SIMPLE_OFF); pg.reload(); pg.wait_for_timeout(2500)
        pg.goto(B + '/settings/language'); pg.wait_for_timeout(2000)
        pg.get_by_role('radio', name=NAMES[lang]).first.click(); pg.wait_for_timeout(2500)
        pg.reload(); pg.wait_for_timeout(2500)
        R[f'{lang}_langue_gardee'] = pg.get_by_role('radio', name=NAMES[lang]).first.get_attribute('aria-checked') == 'true'
        R[f'{lang}_html_lang'] = (pg.evaluate('() => document.documentElement.lang') or '').startswith(lang)
        over, frleft = [], []
        for path in SCREENS:
            pg.goto(B + path); pg.wait_for_timeout(2200)
            body = pg.inner_text('body')
            if 'introuvable' in body.lower() and lang == 'fr': errs.append(f'{lang} {path}: introuvable')
            if pg.evaluate('() => document.documentElement.scrollWidth > window.innerWidth + 1'): over.append(path)
            if lang != 'fr':
                hits = sorted(set(FR_WORDS.findall(body)))
                if hits: frleft.append(f'{path}: {hits[:5]}')
            pg.screenshot(path=f'{SHOTS}/{lang}{path.replace("/", "_") or "_home"}.png')
        R[f'{lang}_pas_de_debordement'] = not over
        if over: warns.append(f'{lang} débordement : {over}')
        R[f'{lang}_aucune_cle_manquante'] = not missing
        if missing: warns.append(f'{lang} clés : {missing[:3]}')
        R[f'{lang}_pas_de_francais_resté'] = not frleft
        if frleft: warns.append(f'{lang} français : {frleft[:6]}')
        # Date longue dans la langue
        d = pg.evaluate("""() => new Intl.DateTimeFormat(document.documentElement.lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(2026, 10, 8))""")
        R[f'{lang}_date'] = d
        ctx.close()
    b.close()
R['erreurs'] = errs
R['remarques'] = warns
print(json.dumps(R, ensure_ascii=False, indent=1))
