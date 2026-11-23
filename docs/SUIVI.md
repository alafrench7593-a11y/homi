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
