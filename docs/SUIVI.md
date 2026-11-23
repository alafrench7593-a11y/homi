# Suivi compact — HOMI (`homi/fondations`)

Règles : AGENTS.md. Détail : `docs/AUDIT_LANCEMENT_2026-11-23.md`, tutos : `docs/TUTOS_CONFIGURATION.md`, iPhone : `docs/SCENARIO_IPHONE.md`.

## Fait (23/11/2026)
- Aura 2.0 (tranche 1) : enregistrer sieste/nuit et biberon depuis le chat (confirmation, anti-doublon, droits), lire le sommeil du jour ; 175 tests Aura OK ; Chromium bout en bout OK.
- Réconciliation : 136 lignes = 127 outils + 9 entrées de compte ; 127/127 ouverts depuis leur entrée (passes base, éviter, projet bébé, cycle, post-partum ; démo Premium).
- Préprod : migrations 20261206 + 20261207 validées depuis l'interface ; déployées en prod (148 migrations).
- Contrôles confidentialité documentés (audit § 7.2) ; conservation `20261208000100` écrite, **non déployée en prod** (tuto § 7).
- Corrections : saisie agenda (14H30, date sans année), textes superposés web (Relais de nuit), lisibilité barre d'onglets,
  « Sommeil du jour » (320 px), cycle toujours visible dans « Moi », menu Compte (navigation après fermeture + « Se déconnecter »),
  visite guidée (cadence de mesure bornée), aperçu paywall web en dev (`/start/offers?apercu=1`).
- Web : build local vérifié — `/` site sans requête externe, `/demo` 0 requête backend, `/app` reliée à la prod.
- Build 13 sur TestFlight (commit 7f0d7ff) ; ne contient pas les corrections suivantes.

## Ouvert
- Mission Master : `docs/MISSION_MASTER_AUDIT.md` (Print Studio fait ; profil sensoriel, mode parent TDAH, Garde Secours, Reddit à faire).

- Aura 2.0 : voir `docs/AURA_IMPLEMENTATION.md` (sieste, biberon, sommeil du jour, RDV, mission (envoi vérifié), tétée par côté, lectures (médicament, biberons, couche, tétées), guidage sans IA faits ; 4 661 tests OK ; fonction `assistant` déployée en prod : version 10, 23/11).

- iPhone réel (scénario) ; liens Vercel publics (accès connecteur : lecture seule, projet invisible).
- Risques : prénoms masqués avant Gemini (déployé, v10) ; analytics grossesse ↔ compte ; journal du foyer sans purge.
- Google OAuth (identifiants à fournir). Build 14 : seulement sur ordre.
