import json, html
FR = [
 ('Éditeur et objet', "Le programme HOMI Ambassadors est proposé par David PRINCIVIL, entrepreneur individuel (EI), SIREN 131194466, éditeur de HOMI (contact : homixyz@gmail.com). L’ambassadeur recommande l’application HOMI ; il n’est ni salarié, ni mandataire, ni représentant de l’éditeur."),
 ('Candidature', "Un compte HOMI et 18 ans révolus sont requis. L’éditeur peut accepter, refuser ou suspendre une candidature ; un refus n’a pas à être motivé."),
 ('Attribution', "Une famille est rattachée à l’ambassadeur dont le code ou le lien est le dernier utilisé dans les 30 jours qui précèdent son premier paiement. Ce rattachement devient définitif au premier paiement. Toute auto-recommandation est exclue."),
 ('Commission', "30 % du montant réellement encaissé net par l’éditeur (après taxes et commission de la boutique d’applications), pour chaque paiement d’abonnement intervenu dans les 6 mois qui suivent le premier paiement. Les essais gratuits ne donnent lieu à aucune commission. Aucune commission n’est versée pour le recrutement d’autres ambassadeurs : le programme n’a qu’un seul niveau."),
 ('Remboursements', "Un paiement remboursé annule la commission correspondante. Si elle a déjà été versée, elle est déduite des versements suivants."),
 ('Disponibilité et versement', "Une commission devient disponible 45 jours après le paiement. Le versement se fait par virement, dès 30 € disponibles, après validation par l’éditeur. Les informations bancaires et fiscales nécessaires peuvent être demandées. L’ambassadeur reste seul responsable de ses déclarations sociales et fiscales."),
 ('Communication loyale', "L’ambassadeur présente HOMI honnêtement. Sont interdits : toute promesse médicale ou de résultat de santé, les faux avis, le spam, l’achat de mots-clés sur la marque HOMI, toute usurpation de l’identité de HOMI et le ciblage de mineurs. Tout contenu sponsorisé doit être signalé comme tel (en France : mention « publicité » ou « collaboration commerciale »)."),
 ('Données personnelles', "L’ambassadeur ne voit que des chiffres globaux : clics, inscriptions, abonnés payants, montants. Il ne reçoit jamais l’identité, l’adresse e-mail ni les données familiales des personnes recommandées. Les données de candidature (identité de contact, pays, profil) servent uniquement à gérer le programme ; elles figurent dans l’export des données du compte et sont effacées avec lui."),
 ('Fraude', "Les clics artificiels, les comptes fictifs et les achats remboursés en série entraînent l’annulation des commissions concernées et la suspension du compte ambassadeur."),
 ('Modification et fin', "L’éditeur peut modifier ou arrêter le programme. Toute modification défavorable est annoncée 30 jours à l’avance. Les commissions déjà acquises restent dues, sauf fraude. L’ambassadeur peut quitter le programme à tout moment en écrivant à homixyz@gmail.com."),
 ('Droit applicable', "Droit français. En cas de litige, une solution amiable sera recherchée avant toute action."),
]
EN = [
 ('Publisher and purpose', "The HOMI Ambassadors program is offered by David PRINCIVIL, sole trader (EI, France), SIREN 131194466, publisher of HOMI (contact: homixyz@gmail.com). Ambassadors recommend the HOMI app; they are not employees, agents or representatives of the publisher. The French version of these terms prevails."),
 ('Application', "A HOMI account and being 18 or older are required. The publisher may accept, reject or suspend an application without giving reasons."),
 ('Attribution', "A family is attributed to the ambassador whose code or link was the last one used within the 30 days before its first payment. Attribution becomes final at the first payment. Self-referral is excluded."),
 ('Commission', "30% of the amount actually collected net by the publisher (after taxes and the app store fee), for each subscription payment made within 6 months after the first payment. Free trials earn no commission. There is no commission for recruiting other ambassadors: the program has a single level."),
 ('Refunds', "A refunded payment cancels the related commission. If it was already paid out, it is deducted from later payouts."),
 ('Availability and payout', "A commission becomes available 45 days after the payment. Payouts are made by bank transfer once 30 EUR is available, after approval by the publisher. Bank and tax details may be requested. Ambassadors are solely responsible for their own tax and social declarations."),
 ('Fair communication', "Ambassadors present HOMI honestly. Forbidden: any medical or health-outcome promise, fake reviews, spam, bidding on the HOMI brand, impersonating HOMI and targeting minors. Sponsored content must be disclosed as such, as required by local law."),
 ('Personal data', "Ambassadors only see totals: clicks, sign-ups, paying subscribers, amounts. They never receive the identity, email address or family data of the people they referred. Application data (contact identity, country, profile) is used only to run the program; it is included in the account data export and deleted with the account."),
 ('Fraud', "Artificial clicks, fake accounts and repeated refunded purchases lead to cancellation of the related commissions and suspension of the ambassador account."),
 ('Changes and termination', "The publisher may change or end the program. Any unfavourable change is announced 30 days in advance. Commissions already earned remain due, except in case of fraud. Ambassadors may leave the program at any time by writing to homixyz@gmail.com."),
 ('Governing law', "French law. In case of dispute, an amicable solution will be sought before any action."),
]
UPDATED_FR, UPDATED_EN = '24 novembre 2026', 'November 24, 2026'
def ts(var, title, upd, secs):
    s = ',\n'.join(f"    {{ title: {json.dumps(t, ensure_ascii=False)}, body: {json.dumps(b, ensure_ascii=False)} }}" for t, b in secs)
    return f"const {var}: LegalDoc = {{\n  title: {json.dumps(title, ensure_ascii=False)},\n  updated: {json.dumps(upd)},\n  sections: [\n{s},\n  ],\n}};\n"
open('src/content/legalAmbassadors.ts','w').write(
 "/**\n * Conditions du programme HOMI Ambassadors, version v1-2026-11 (validées par la propriétaire le 24/11/2026).\n"
 " * Source unique : écran /legal/ambassadors et page publique /ambassadeurs/ (legal-site, générée par\n"
 " * scripts/web/gen-ambassador-terms.py). Le français fait foi ; es/de/it affichent l'anglais.\n */\n"
 "import type { LegalDoc } from './legal';\nimport { localized } from '@/i18n/localized';\n\n"
 + ts('AMB_FR','Conditions du programme HOMI Ambassadors',UPDATED_FR,FR) + '\n' + ts('AMB_EN','HOMI Ambassadors program terms',UPDATED_EN,EN)
 + "\nexport const AMBASSADOR_TERMS: LegalDoc = localized(AMB_FR, AMB_EN);\n")
import os
os.makedirs('legal-site/ambassadeurs', exist_ok=True)
src=open('legal-site/cgu/index.html').read()
head=src.split('<body>')[0].replace("Conditions générales d’utilisation · HOMI","Conditions du programme HOMI Ambassadors · HOMI")
nav=src.split('<nav>')[1].split('</nav>')[0].replace('../','../')
body=''.join(f"<section><h2>{html.escape(t)}</h2><p>{html.escape(b)}</p></section>\n" for t,b in FR)
open('legal-site/ambassadeurs/index.html','w').write(head+'<body><main><p class="m">HOMI · Version v1-2026-11</p><h1>Conditions du programme HOMI Ambassadors</h1><p class="m">'+UPDATED_FR+'</p>\n<nav>'+nav+'</nav>\n'+body+'</main></body></html>\n')
print('ok')
