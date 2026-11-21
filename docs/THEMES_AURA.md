# HOMI — Huit thèmes d’accueil et Aura présente partout (21/11/2026)

Brief de la propriétaire : « HOMI — Refonte Apple premium et intégration d’Aura » (références 01 à 05).
Branche : `homi/themes-aura` (partie de `homi/fondations`). Rien n’est déployé ni publié.

## 1. Correspondance écran → composant → changement

| Écran / zone | Composant réel | Changement |
|---|---|---|
| Accueil, en-tête | `src/app/(tabs)/index.tsx` | Mot-symbole HOMI (`BrandName`, dessin de la propriétaire, couleur du texte du thème), cloche, **bouton palette**, puis urgences, Communauté (pictogramme sur l’accueil, nom accessible complet) et avatar. Marges 20 pt (16 pt sous 360 pt) : tout tient à 320 pt avec des cibles de 44 pt. |
| Accueil, sélecteur | `src/features/themePicker/ThemePicker.tsx` | Panneau de verre « Personnaliser l’accueil » (`GlassSheet`), 8 vignettes nacrées en 2 colonnes, coche + contour + état « coché » annoncé, « Appliquer le thème », lien « Plus de réglages d’apparence ». |
| Accueil, Aura | `src/features/aura/AuraEntry.tsx` (`AuraHomeEntry`) | Rangée « Demander à Aura » sous « Mes outils » : une interaction ouvre Aura. |
| Accueil, agenda vide | `src/features/day5/NextUp.tsx` (`compactEmpty`) | « Aucun rendez-vous aujourd’hui » en rangée sobre (pictogramme calendrier), comme la référence 01 ; l’illustration reste quand il y a un rendez-vous. |
| Sections du jour | `src/features/day5/DayParts.tsx` (`DaySection`) | « À traiter », « Agenda du jour » : titre de section (et non plus libellé gris). |
| Barre flottante | `src/components/glass/GlassNavigation.tsx` (`GlassTabBar`) | La pastille de l’onglet actif devient une **lentille de verre** : reflet clair en haut, arête lumineuse, lueur interne douce du thème. `TabItem` (rendu des pictogrammes) et le bouton central de `Dock.tsx` ne sont pas touchés (travail parallèle sur les icônes). |
| Tous les écrans d’outil | `src/components/Screen.tsx` (`AuraToolButton`) | Petit disque de verre avec la lentille d’Aura dans l’en-tête : ouvre Aura sur cet outil (`/assistant?tool=<id>`), seulement pour un identifiant réel du catalogue. |
| Aura (conversation) | `src/features/aura/AuraScreen.tsx` | Carte « À propos de [outil] » (deux questions d’usage, « Revenir à [outil] » si l’outil est accessible), micro (dictée), « Écouter la réponse », arrêt de la voix en quittant l’écran ou en arrière-plan, « Revoir la présentation d’Aura » dans ses réglages. Le robot compagnon reste dans la conversation. |
| Présentation d’Aura | `src/features/aura/AuraEntry.tsx` (`AuraIntroHost`, `AuraIntro`, `AuraIntroLens`), monté dans `src/app/(tabs)/_layout.tsx` | Fenêtre de verre une fois par compte : lentille + trois lumières qui se rapprochent puis se stabilisent, message de la propriétaire, Parler à Aura / Écrire / Plus tard. |
| Réglages › Aide | `src/app/settings/index.tsx` | « Revoir la présentation d’Aura ». |
| Réglages › Apparence | `src/app/settings/appearance.tsx` | Les 8 thèmes (+ Adaptatif) avec leurs aperçus réels ; inchangé dans sa mécanique. |

## 2. Jetons partagés (src/theme/tokens.ts)

- `THEME_STARTS` : couleurs de départ de la propriétaire, reprises **telles quelles** (fond, surface, accent, texte) et verrouillées par `contrast.test.ts`.
- Chaque thème fournit un jeu clair, un jeu sombre et un jeu nuit (écran /night), puis `buildTheme` dérive : fond, surfaces (carte, élevée, creux), contours (`border`, `material.lines`), texte, texte secondaire, accent et second accent, **texte sur accent** (`tokens.text.onAccent`), action principale (= l’accent : bouton « J’accepte » de la référence), statuts, graphiques, et la nouvelle **lueur interne** `tokens.glow` (`inner`, `soft`, `edge`).
- Thèmes sombres par nature : Noir graphite et Nuit améthyste (`scheme: 'dark'`, `effectiveMode`) restent sombres même en apparence « Clair ». Les six autres suivent Système / Clair / Sombre ; leur version sombre est un jeu profond teinté de leur famille.
- Le verre (`src/theme/glass.ts`) se résout à partir de ces jetons pour les huit thèmes (voile de contraste calculé, `glassContrast.test.ts`). Un fond opaque est utilisé avec Réduire la transparence et sur les appareils sans flou (`resolveGlassTier`, inchangé).
- Ajustements faits pour tenir 4,5:1 partout (les couleurs de départ ne sont PAS modifiées) : rouge d’alerte éclairci sur Noir graphite (`#FF8C8C`), Blanc nacré sombre (`#FF8C8C`) et Nuit améthyste (`#FF8A9A`) ; pastilles et fonds doux des thèmes à surface teintée (Brume lavande, Bleu glacier, Rose poudré) posés sur la surface éclaircie (`paper`) ; vignettes du sélecteur Olive, Noir graphite et Nuit améthyste assombries pour que leur libellé dépasse 4,5:1.

## 3. Persistance, aperçu, annulation, relancement

Architecture existante conservée : préférences d’apparence **locales, par compte** (`appearanceByUser` dans le magasin `toietmoi.ui`, AsyncStorage).

- Toucher une vignette : `previewTheme(p)` — toute l’application prend le thème tout de suite, **rien n’est enregistré** (`themePreview` est exclu de la persistance).
- « Appliquer le thème » : `applyThemePreview()` enregistre le thème pour le compte actif.
- Fermer le panneau (voile, geste, croix, retour) : `cancelThemePreview()` — le thème confirmé revient.
- Relancement : la restauration (`merge`) efface tout aperçu et redonne exactement le thème appliqué.
- Personnes déjà inscrites : leur choix est **migré** vers le thème le plus proche (`migratePalette`) — Rose poudré et pêche → Rose poudré, Lavande → Brume lavande, Bleu nuit et cyan → Bleu glacier, Sauge → Olive HOMI, Champagne → Beige sable ; anciennes valeurs v3/v4 → Rose poudré (elles affichaient déjà « Rose poudré et pêche »). Le mode Adaptatif est conservé (moi → Rose poudré, grossesse → Brume lavande, enfant → Olive HOMI, post-partum → Beige sable, famille → Bleu glacier). Une nouvelle installation part d’**Olive HOMI**.

## 4. Aura : présence, actions, contexte

- **Présentation** : une fois par compte (`auraIntroSeen[userId]`, persisté), 1,2 s après la première arrivée sur l’accueil, jamais pendant la visite guidée ; marquée vue dès qu’on ouvre Aura. Relance : réglages d’Aura et Réglages › Aide (`requestAuraIntro`, non persisté). « Parler à Aura » n’est proposé que si une voie vocale existe (`dictationMode() !== 'none'`).
- **Accueil** : « Demander à Aura » ouvre `/assistant` (une interaction).
- **Depuis un outil** : `AuraToolButton` → `/assistant?tool=<id>` ; `auraToolContext` n’accepte qu’un identifiant réel (`resolveTool`) ; sinon aucun contexte. Aura reçoit uniquement le nom de l’outil, **dans le texte de la question que la personne choisit** (« Comment utiliser Allaitement ? ») — aucune donnée de l’outil, aucun journal, aucune donnée de santé n’est jointe.
- **Registre d’actions réutilisé** (rien de nouveau côté serveur sauf le tri de la recherche) : `search_tools` / `propose_open_tool` / événement / mission / plan / journal (`supabase/functions/_shared/aura-tools.ts`). Une proposition d’ouverture n’est retenue que si l’identifiant est dans le catalogue envoyé par l’application (`toAction`), puis revérifiée côté application (`sanitizeActions`) : outil inventé, route externe ou action inconnue → aucune carte, aucun lien. Les écritures (événement, mission) restent des **propositions confirmées** dans une feuille. Crédits, consentement, sécurité et paywall : inchangés.
- **Recherche** (seul changement serveur) : l’outil qui couvre le plus de mots de la demande passe devant, puis le score départage (« Où noter sa sieste ? » → Sommeil de l’enfant au lieu de « Noter un biberon »). Testé en Deno (`aura-tools_test.ts`) et en Jest (catalogue réel du profil bébé).
- **Catalogue envoyé** : outils du profil affiché, puis ceux des autres profils du foyer auxquels la personne a déjà accès (`useAllToolEntries`, droits du co-parent inchangés) — sans cela, « Mon bébé prend le sein » depuis le profil Grossesse proposait « Sommeil de l’enfant ». Les cartes sont revalidées contre ce même catalogue.
- **Réponses** : « Mon bébé prend le sein » → « Ouvrir Allaitement » (`baby_breastfeed`) ; « Où noter sa sieste ? » → outil sommeil. Vérifié : recherche du serveur sur le vrai catalogue (Jest), modèle **simulé** de la démonstration (Jest + captures web), mode local sans IA (captures web). **Gemini réel non appelé** dans ce travail.

## 5. Voix : ce qui marche vraiment, ce qui manque

| Capacité | État réel |
|---|---|
| Lecture à voix haute (« Écouter la réponse ») | `expo-speech ~57.0.3` (version du SDK 57 d’après `expo/bundledNativeModules.json`, ajoutée par `npx expo install expo-speech`). Web : fonctionne (speechSynthesis du navigateur, vérifié dans Chromium). iPhone / Android : **demande une nouvelle compilation** (`eas build` ou `npx expo run:ios`) ; l’app déjà installée ne contient pas le module `ExpoSpeech` → bouton masqué (détection `requireOptionalNativeModule`), aucune erreur. Sur demande seulement ; arrêt au bouton, à l’envoi d’une nouvelle question, en quittant l’écran et en arrière-plan (appel). |
| Dictée (« Parler à Aura », micro du champ) | Web : reconnaissance du navigateur (`SpeechRecognition`), micro demandé au premier appui, texte partiel dans le champ, arrêter / annuler, refus géré. iPhone / Android : **pas de module de reconnaissance dans l’app** ; le micro place le curseur dans le champ et explique d’utiliser le micro du **clavier** (dictée du système, autorisation demandée par iOS lui-même). Le texte reste visible et corrigeable avant l’envoi. |
| Ce qui manque pour une dictée native dans l’app | Un module de reconnaissance vocale compatible SDK 57 (ex. module tiers « expo-speech-recognition ») + `NSSpeechRecognitionUsageDescription` / `NSMicrophoneUsageDescription` + nouvelle compilation. Non ajouté : non documenté dans la doc officielle versionnée (que ce poste ne pouvait pas joindre : docs.expo.dev refusé par le proxy) et l’app déclare aujourd’hui `microphonePermission: false`. |
| Services payants | Aucun (ElevenLabs refusé, aucun code). Test : `aura.test.tsx` « Voix : celle du téléphone seulement ». |

## 6. Mouvement (Full Motion)

Lentille d’Aura immobile au repos ; à l’ouverture de la présentation, trois lumières qui se rapprochent puis se stabilisent, éclat qui apparaît ensuite ; pendant une réponse, robot qui réfléchit (existant) ; à l’écoute, trois points (le niveau sonore réel n’est pas exposé par l’API du navigateur). Vignettes qui se compriment dès l’appui, coche en ressort léger, changement de couleurs en fondu (voile du fond), lentille de l’onglet qui glisse (indicateur liquide existant). Réduire les animations : pose finale immédiate partout.

## 7. Vérifications et limites

Voir le rapport de livraison (chiffres). Limites non testables ici : iPhone réel (verre natif iOS 26, Dynamic Type réel, VoiceOver réel, haptique), lecture vocale native (demande une compilation), dictée du clavier iOS, réponses de Gemini réel (aucun appel au modèle), co-parent sur deux appareils. Le texte agrandi est simulé sur le web.
