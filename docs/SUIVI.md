# Suivi compact — HOMI (`homi/fondations`)

Règles : AGENTS.md. Détail : `docs/AUDIT_LANCEMENT_2026-11-23.md`, tutos : `docs/TUTOS_CONFIGURATION.md`, iPhone : `docs/SCENARIO_IPHONE.md`.

## Fait (23/11/2026)
- Aura 2.0 (tranche 1) : enregistrer sieste/nuit et biberon depuis le chat (confirmation, anti-doublon, droits), lire le sommeil du jour ; 175 tests Aura OK ; Chromium bout en bout OK.
- Réconciliation : 136 lignes = 127 outils + 9 entrées de compte ; 127/127 ouverts depuis leur entrée (passes base, éviter, projet bébé, cycle, post-partum ; démo Premium).
- Préprod : migrations 20261206 + 20261207 validées depuis l'interface ; déployées en prod (148 migrations).
- Contrôles confidentialité documentés (audit § 7.2) ; conservation `20261208000100` **appliquée en prod le 23/11** (fonction + tâche quotidienne vérifiées).
- Corrections : saisie agenda (14H30, date sans année), textes superposés web (Relais de nuit), lisibilité barre d'onglets,
  « Sommeil du jour » (320 px), cycle toujours visible dans « Moi », menu Compte (navigation après fermeture + « Se déconnecter »),
  visite guidée (cadence de mesure bornée), aperçu paywall web en dev (`/start/offers?apercu=1`).
- Web : build local vérifié — `/` site sans requête externe, `/demo` 0 requête backend, `/app` reliée à la prod.
- Build 13 sur TestFlight (commit 7f0d7ff) ; ne contient pas les corrections suivantes.

- Site web (23/11) : refonte aux couleurs de l'app (Blanc nacré : fond perle, sphères chromées, noir premium, verre), motion design (lignes révélées, parallaxe, téléphone collant avec 5 vrais écrans, bandeau d'outils), mène à /app (cartes → /outil/<id>) ; e2e site 14/14, /app 16/16. Doc : docs/SITE_WEB.md.

## Ouvert
- Mission Master : `docs/MISSION_MASTER_AUDIT.md` (Print Studio, profil sensoriel et journal de situations, Garde Secours, mode parent TDAH faits ; design, tests natifs, Reddit à faire).

- Aura 2.0 : voir `docs/AURA_IMPLEMENTATION.md` (sieste, biberon, sommeil du jour, RDV, mission (envoi vérifié), tétée par côté, lectures (médicament, biberons, couche, tétées), guidage sans IA faits ; 4 661 tests OK ; fonction `assistant` déployée en prod : version 10, 23/11).

- iPhone réel (scénario) ; liens Vercel publics (accès connecteur : lecture seule, projet invisible).
- Risques : prénoms masqués avant Gemini (déployé, v10) ; analytics grossesse ↔ compte ; journal du foyer sans purge.
- Google OAuth (identifiants à fournir). Build 14 : seulement sur ordre.
- Fusion : PR #1 (main = homi/fondations, ancien main dans archive/main-2026-11-13) ; maquette design à valider.
- Design (23/11) : Blanc nacré en noir et gris, fond perle (reflets + sphères chromées), cartes en verre translucide, initiales d'enfants en gris ; opaque si « Réduire la transparence ». Reste : points de « Mes apps », robot Aura, pictogrammes de la barre d'onglets.
- Inscription (23/11) : « Où en est ta famille ? » à choix multiples (besoins réunis, profils préremplis) ; « Mes apps » : section « Autres outils » grisés, déblocables via « Modifier mon parcours ».
- Design (23/11, suite) : fond perle supprimé (fond uni blanc / noir premium) ; verre liquide sur les cartes (matériau, reflet, liseré, arête) et le bord partagé glassEdge ; icônes de la barre d'onglets en niveaux de gris.
- Web (23/11) : /start/offers affiche le vrai paywall en vitrine (grille indicative, « Disponible sur l'app iPhone », aucun achat ni requête boutique).
- Audit final avant build (23/11) : HOMI_FINAL_PREBUILD_AUDIT.md — BUILD BLOQUÉ (4 points non vérifiables sans iPhone : achats sandbox, compte/Apple, natif, performance).
- Compte (23/11) : « Supprimer mon compte » dans le menu Compte ; suppression = une feuille, une case « je comprends », un bouton (plus de mot à taper). Vérifié démo web.
- Avant build (23/11) : « mode enfant » retiré (aucun écran pour l'enfant ; ancienne adresse → version imprimable) ; relais juste après minuit (soirée conservée : début = min(minuit, maintenant − 12 h)).
- Intro (24/11) : présentation Keynote en 7 tableaux au premier lancement (/intro → « Commencer » → /start), Passer, Précédent, progression qui suit le doigt ; vérifiée web 390 et 320 px.
- Ambassadors (24/11, branche homi/ambassadors, NON déployé) : tables + RLS + RPC (attribution figée au 1er paiement, 30 % de l'encaissé net, 6 mois, délai 45 j, versement manuel finance), webhook RevenueCat branché, lien /r/<code> (clic anonyme agrégé, code gardé 30 j, rattaché après connexion). SQL 2831/0, Jest ok. Reste : page /ambassadors, candidature, tableau de bord, admin, docs.
- Ambassadors UI (24/11) : /ambassadors (programme + simulateur), candidature, tableau de bord, admin (validation, versement manuel), code à l'inscription, entrée Réglages ; hors Premium. Jest 4726/4726, e2e/ambassadors.py 20/20. Migration toujours NON déployée ; check-list : docs/ambassadors/HOMI_AFFILIATE_LAUNCH_CHECKLIST.md.
- Ambassadors (24/11) : migration 20261209000100 déployée en production avec l'accord de la propriétaire (8 tables, RLS active, droits vérifiés, chaîne d'export RGPD OK). Webhook RevenueCat et app NON redéployés.
- Ambassadors (24/11) : conditions v1-2026-11 validées (David PRINCIVIL EI, droit français) → écran /legal/ambassadors + page /ambassadeurs/ (source unique, générateur scripts/web/gen-ambassador-terms.py) ; migration 20261210000100 (tâche quotidienne de libération des commissions) testée en local (SQL 2831/0), PAS encore en production.
- Rôles (24/11) : homixyz@gmail.com = admin en production (accord explicite de la propriétaire) ; homixyz+apple@gmail.com volontairement sans rôle. Tâche quotidienne cron toujours à planifier (refusée par les permissions de la session).
- Ambassadors (24/11) : doc RevenueCat vérifiée → formule du net corrigée (brut × (1 − taxe − commission), l'ancienne surestimait ~3 %) ; takehome ignoré ; tests Jest 28/28.
- 24/11/2026 : aucun accès sans paiement (Moi et aperçu Mes outils fermés aux comptes non abonnés ; restent ouverts : compte, abonnement, données, légal, urgences, démo) ; intro + tableau Relais ; visite guidée réparée sur le web (154/156).
- 24/11/2026 : QA complète (128/128 ouverture, 48 créations prouvées, parcours ciblés) ; corrigés : Aura prénom cité, interrupteurs sans libellé, dates coupées, vibrations la nuit ; rapports HOMI_TOOL_QA_INVENTORY.md + HOMI_COMPLETE_TOOL_QA_REPORT.md (BUILD BLOQUÉ).
- 24/11/2026 : programme Ambassadeurs (base versionnée + RLS 2829/0, calculs partagés, webhook, page /ambassadeurs/ du site avec simulateur, écran /ambassador) ; migration NON appliquée en production.
- Ambassadors (24/11) : site et app reliés en UN programme (règles et simulateur partagés, ?ref du site repris par l'app, boutons du site → /ambassadors, /ambassador → /ambassadors, conditions /conditions-ambassadeurs/) ; implémentation parallèle retirée du code (tables ambassador_* vides laissées en prod) ; webhook v9 + cron déployés ; Jest 4731/4731, SQL 2831/0, e2e 28/28.
- Ambassadors finance (24/11) : audit (docs/ambassadors/HOMI_AMBASSADORS_FINANCIAL_AUDIT.md) ; corrigés : sandbox, client déjà payant, 6 paiements max, arrondi half-up (3,19 €), double versement (verrou + référence unique), registre en ajout seul, traçabilité brut/taxe/frais/taux ; SQL 2852/0, Jest 4733/4733. Migration 20261211000100 + webhook NON déployés (décisions à valider).
- 24/11/2026 : nettoyage production de l'ancienne implémentation Ambassadeurs (tables ambassador_*, referral_attributions, fonctions, vue) ; export RGPD rebranché et vérifié ; programme conservé : affiliate_*.
- 24/11/2026 : mission GitHub — dépôts web écartés (raisons dans HOMI_UPGRADE_TRACKER.md), FlashList inutile (mesure), recherche « ne dor pas », comparaison 7 j sous les biberons.
- Site (24/11) : refonte étape 1 — nouveau hero, récit 7 écrans réels, /fonctionnalites/ (121 outils, recherche sans IA, filtres, 17 captures réelles), SEO JSON-LD ; e2e 22/22. Non publié en production.
- 24/11/2026 : Aura Vision lot 1 — Aura reconnaît « cette ordonnance / ce médicament / cette liste… » et propose photo, fichier ou code-barres (avertissement crédits + santé) ; lecture de document facturée 5 crédits côté serveur (réservation, aucun débit si échec, texte déjà lu = gratuit) — fonction document-read NON déployée en production.
- 24/11/2026 : Aura Vision lots 2-3 — tableau de bord admin « Coûts IA » (comptages sans identifiant, coûts = estimations saisies) ; boîte de médicament /scanner/medicine via la BDPM officielle (code EAN/Data Matrix/CIP7 ou nom, notice officielle, aucune posologie, sans IA ni crédit) ; script d'import BDPM. Migrations, import et document-read NON appliqués en production. Rapport : AURA_VISION_REPORT.md.
- 24/11/2026 : PRODUCTION Aura Vision — migrations admin_ai_usage + medicine_bdpm appliquées et enregistrées, BDPM importée (20 894 / 17 184 commercialisées), document-read v9 déployée (401 sans compte, coût 5 crédits). Coûts estimés non saisis.
- 24/11/2026 : coûts IA chiffrés au tarif officiel Gemini (lecture ≈ 0,002 €, question ≈ 0,0016 €) ; aucune facture Gemini trouvée → clé probablement gratuite (contenus utilisés par Google) ; estimations non saisies en production (refus du contrôle automatique).
- 24/11/2026 : facturation Gemini confirmée active par la propriétaire (offre payante) ; rapport corrigé.
- 24/11/2026 : PRODUCTION — coûts estimés saisis (document_read 0,0020 €, assistant_question 0,0016 €).
- 24/11/2026 : motion lot 2 — anneau du sommeil 24 h, biberon gradué animé, anneau par sein (allaitement) ; démo : nuit/sieste d'aujourd'hui sans chevauchement ; aucune dépendance ajoutée.
- 24/11/2026 : onglet Enfant organisé comme la maquette (en-tête prénom/âge/taille/poids, 8 accès, « Aujourd'hui », synthèse du jour factuelle, sommeil coupé à minuit) ; couleurs du thème ; HOMI_MOTION_SYSTEM.md (poids JS iOS +0,038 %).
- Démo (24/11) : fonctions Ambassadors simulées sans argent (tableau de bord « pas encore candidaté », candidature refusée en démo) — corrige l'échec /ambassadors/dashboard signalé par audit_navigation.
- Site (24/11) : homifamille.com officiel, menu commun 6 groupes (desktop + mobile), pied de page complet, /contact/ (messagerie pré-remplie ; envoi serveur prêt, non déployé), llms.txt, JSON-LD complet ; e2e 19/19 + 22/22 + 28/28.
- 24/11/2026 : couleurs des apps rétablies — une couleur par famille d'outil (logos + cartes du catalogue + logo « Mes apps »), allaitement rose, croissance bleue ; contraste vérifié (Jest 4788/4788).
