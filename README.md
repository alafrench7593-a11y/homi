# Toi & Moi — « À chaque étape de votre histoire »

Application mobile française qui accompagne les familles du désir d'enfant aux 10 ans de l'enfant : grossesse (y compris multiple), naissance, post-partum, suivi quotidien du bébé, enfants, santé de l'adulte, assistant IA, communauté modérée et partage familial.

**Design** : « Aurore » — fond d’aurore boréale aux couleurs douces qui ondule lentement, cartes translucides ; clair et chaleureux le jour, aurore de nuit le soir (Space Grotesk + Manrope).

**Pile technique** : React Native · Expo SDK 57 · TypeScript strict · Expo Router · Supabase (Postgres + RLS, Auth, Storage, Edge Functions) · TanStack Query (persisté, hors connexion) · Zustand · RevenueCat · Expo Notifications.

> Le nom de l'app se change à un seul endroit : `src/config/brand.json` (nom, slogan, slug, scheme, bundle id).

---


## Organisation par parcours

Au premier lancement, l’utilisatrice choisit un ou plusieurs parcours : **éviter une grossesse**, **essayer d’avoir un enfant**, **enceinte**, **maman**, **plusieurs enfants** (modifiable dans Profil › Mes parcours, écran `/journeys`).

- **Navigation** : Accueil · Suivi · Questions · Communauté · Profil (+ bouton central d’ajout rapide).
- **Accueil** volontairement court : profil actif, une carte principale adaptée (grossesse, enfant, cycle), 3–4 actions rapides, prochain rappel ou rendez-vous, article du jour, « Poser une question » et « Tous mes outils ».
- **Tous mes outils** (`/tools`) : catégories affichées seulement si elles concernent le parcours (logique dans `src/lib/domain/journeys.ts`).
- **Concevoir** : `/fertility` (+ `log`, `body`, `intimacy` privé, `history`, `reminders`, `consultation`, `exams`). **Éviter une grossesse** : `/contraception` (+ `log`, `history`, `methods`, `emergency`, `reminders`, `consultation`). Toutes les dates sont des **estimations** ; aucun jour n’est présenté comme « sans risque ».
- **Mon sommeil** (`/me/sleep`), distinct du sommeil du bébé, avec résumé sur 7 jours.
- **Communauté** : 15 espaces ouverts à toutes et tous, publications, réponses, recherche, favoris, pseudonyme, notifications, signalement, blocage, modération.
- **Rappels proposés** selon le parcours (onboarding et Réglages › Rappels), jamais activés sans accord.
- **Dents** (`/teeth`), **Bibliothèque** (`/library`).

## 1. Démarrer en 2 minutes (mode démo, sans serveur)

```bash
npm install
npx expo start          # puis « i » (simulateur iOS), « a » (Android) ou scan du QR code avec Expo Go
```

Sans variables d'environnement, l'app démarre en **mode démo** : toutes les données sont stockées sur l'appareil (AsyncStorage) avec une famille d'exemple (grossesse gémellaire + deux enfants). Un bandeau « Mode démo » le signale. C'est idéal pour tester le parcours complet sans rien configurer.

Aperçu web : `npx expo start --web`.

## 2. Pré-requis

| Outil | Version |
|---|---|
| Node.js | 20 LTS ou plus |
| npm | 10+ |
| Expo CLI | via `npx expo` |
| Xcode (iOS) | 16+ — macOS uniquement |
| Android Studio (Android) | SDK 35+, un émulateur |
| Supabase CLI | 2.x (`brew install supabase/tap/supabase`) |
| EAS CLI | `npm i -g eas-cli` |

## 3. Brancher le vrai backend Supabase

1. Créez un projet sur supabase.com (région UE recommandée pour le RGPD).
2. Liez et poussez le schéma :
   ```bash
   supabase link --project-ref <ref>
   supabase db push                    # applique supabase/migrations/*
   psql "$DATABASE_URL" -f supabase/seed.sql   # optionnel : contenus et comptes de démonstration
   ```
3. Copiez `.env.example` en `.env` et renseignez `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Déployez les fonctions et leurs secrets :
   ```bash
   supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=... OPENFOODFACTS_USER_AGENT=... REVENUECAT_WEBHOOK_SECRET=... EXPO_ACCESS_TOKEN=... RESEND_API_KEY=... RESEND_FROM_EMAIL=...
   supabase functions deploy assistant revenuecat-webhook delete-account send-push product-lookup scan-explain document-extract
   ```
5. Auth › URL configuration : ajoutez `toietmoi://auth/callback` aux URL de redirection.

En local : `supabase start` puis utilisez l'URL/clé affichées.

**Comptes de démonstration du seed** : `camille@exemple.test` et `alex@exemple.test`, mot de passe `ToiEtMoi!2026` (à supprimer avant toute mise en production).

### Sécurité des données
- RLS activée sur **toutes** les tables ; accès par foyer via `can_access_household(foyer, domaine, écriture)`.
- Domaines de permission des co-parents : `daily`, `health`, `documents`, `pregnancy`, `lists`, `names`, `profile`.
- Les abonnements ne sont modifiables que par le serveur (webhook RevenueCat) ; `has_premium()` fait foi.
- Les clés IA restent côté serveur ; l'app n'appelle jamais directement un fournisseur d'IA.
- Stockage privé (documents, photos) avec URL signées de courte durée.

## 4. Notifications

- **Locales** (rappels biberon, vitamines, rendez-vous…) : programmées sur l'appareil par `syncLocalReminders` ; fonctionnent sans serveur. iOS limite à 64 notifications en attente : l'app planifie au plus près.
- **Push** (réponse à un post, rappel produit, messages de l'équipe) : nécessitent `EXPO_PUBLIC_EAS_PROJECT_ID` (via `eas init`), un build de développement ou de production (pas Expo Go sur Android), et `EXPO_ACCESS_TOKEN` côté fonctions. Les jetons sont enregistrés dans `push_devices`, l'envoi passe par la fonction `send-push`.
- Android : configurez FCM (`eas credentials`). iOS : clé APNs gérée par EAS.

## 5. Abonnements (RevenueCat)

1. Créez les produits dans App Store Connect / Google Play : `toietmoi_premium_monthly` (5,99 €) et `toietmoi_premium_annual` (39,99 €, 7 jours d'essai).
2. Dans RevenueCat : entitlement `premium`, offering par défaut avec ces deux produits.
3. Renseignez les clés publiques `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` / `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`.
4. Webhook RevenueCat → `https://<ref>.supabase.co/functions/v1/revenuecat-webhook`, en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.

Sans clés, l'achat est indisponible (Expo Go) ou simulé en mode démo. **Ce qui reste toujours gratuit** : urgences (15, 112, 3114, 119, 3919, 114), réponses de sécurité de l'assistant, suivi quotidien de base, bilan d'humeur.

## 6. Builds

```bash
eas init                                   # crée le projet EAS → copiez l’ID dans EXPO_PUBLIC_EAS_PROJECT_ID
eas build --profile development --platform ios|android   # client de développement
eas build --profile preview --platform android            # APK à partager
eas build --profile production --platform all
eas submit --platform ios|android
```
Builds locaux : `npm run ios` / `npm run android` (génèrent les dossiers natifs).

## 7. Illustrations du bébé (grossesse)

Les illustrations artistiques semaine par semaine (4 à 41 SA) se placent dans `src/assets/foetus/` :
```bash
npm run foetus:import -- "/chemin/vers/le/dossier"   # fichiers nommés avec la semaine : sa-04.png … sa-41.png
```
Le script recadre en carré, réduit à 1024 px, convertit en WebP et régénère `src/assets/foetus/index.ts`. Tant qu'aucune image n'est importée, l'app utilise l'illustration vectorielle animée. Toutes portent la mention **« illustration artistique, pas une échographie »** ; la lueur du cœur est décorative et ne mesure rien.

## 8. Tests et vérifications

```bash
npm run typecheck     # TypeScript strict
npm test              # tests unitaires (dates, grossesse, rappels, sécurité de l'assistant, backend démo)
npm run db:test       # tests de sécurité SQL/RLS sur un Postgres local (121 assertions)
npm run verify        # les trois
```

## 9. Arborescence

```
src/app/          écrans (Expo Router) — onglets dans (tabs)/
src/components/   UI (ui.tsx), illustrations, horloge du jour, dock, feuilles…
src/features/     blocs d'écran (accueil, ciel, suivi, profils, communauté)
src/lib/          données (backend Supabase/démo, hooks), domaine métier, notifications, hors-ligne, achats
src/theme/        thèmes clair / sombre / nuit et « ciel de la famille »
supabase/         migrations, seed, fonctions Edge, tests SQL
scripts/          outils (import des illustrations)
```

## 10. Ce qui est fait / simulé

**Fait et fonctionnel** : schéma complet + RLS testée, authentification, onboarding multi-parcours, accueil intelligent, univers grossesse (multiples, poids bienveillant), suivi quotidien (repas, biberons, tire-lait, couches, sommeil, mode nuit), rappels locaux, assistant IA sécurisé côté serveur (urgences détectées, jamais de diagnostic ni de dose), contenus sourcés, communauté avec modération et signalements, partage familial, export et suppression RGPD, mode hors connexion avec synchronisation, thèmes et accessibilité (tailles de texte, VoiceOver/TalkBack, réduction des animations).

**Simulé / données de démonstration** :
- Articles du seed : rédigés pour le développement, **non relus** par des professionnels (`reviewer_name` vide) — à faire valider avant publication.
- Produits, rappels et lignes CosIng / Ciqual du scanner dans le seed et le mode démo : données fictives marquées `is_demo`, affichées « Données de démonstration ».
- Abonnement en mode démo : bascule locale, sans paiement.
- Illustrations du bébé : images générées par IA, à faire valider par un professionnel de santé.

## 11. Services externes

Supabase · Gemini API (assistant, explication du scanner, lecture de documents) · Resend (e-mails) · RevenueCat · Expo/EAS (builds, push) · Apple App Store / Google Play · Open Food Facts / Open Beauty Facts / Open Products Facts et RappelConso (scanner) · CosIng et Ciqual (tables importées) · Google ML Kit sur le téléphone (lecture des photos du scanner, build de développement).

## 12. Avant la mise en ligne

- [ ] Faire relire tous les contenus santé par des professionnels (sage-femme, pédiatre) et renseigner les relecteurs.
- [ ] Faire valider les illustrations du bébé.
- [ ] Scanner : importer CosIng et Ciqual (`npm run cosing:import`, `npm run ciqual:import`), faire relire les sources marquées « to_review » dans `scanSources.ts`, vérifier en réel les champs du jeu RappelConso.
- [ ] Supprimer les comptes et données de démonstration du seed.
- [ ] Politique de confidentialité, CGU, mentions légales ; registre RGPD ; hébergement de données de santé (HDS) si nécessaire.
- [ ] Vérifier les numéros d'urgence et ressources (15, 112, 3114, 119, 3919, 114).
- [ ] Configurer les secrets serveur, le webhook RevenueCat, FCM/APNs.
- [ ] Tester sur appareils réels iOS et Android, avec VoiceOver/TalkBack et grandes tailles de texte.
- [ ] Mettre en place la modération humaine de la communauté et la gestion des signalements.
- [ ] Fiches stores : captures, description, classification d'âge, section « données collectées ».

## Assistant IA

L’onglet **Questions** (accessible depuis tous les parcours) est l’accueil de l’assistant : nouvelle conversation, idées de questions selon le parcours (contraception, projet bébé, grossesse, bébé, enfant, famille), questions restantes, réponses favorites et historique privé (suppression d’une conversation ou de tout l’historique). L’écran de conversation est `src/app/assistant/chat.tsx`.

**Ce que fait l’assistant**
- Chaque conversation commence par : « Vous échangez avec un assistant d’intelligence artificielle spécialisé dans l’information en santé et parentalité. Il ne remplace pas un médecin, une sage-femme, un pédiatre ou les services d’urgence. »
- Réponses en français, **structurées** : *En bref*, *Ce que vous pouvez faire*, *À surveiller*, *Quand demander un avis professionnel*, *Pour mieux vous répondre* (questions courtes si une information manque), *Sources* et date de mise à jour. Le serveur **supprime toute source** qui n’est pas sur la liste des sites officiels autorisés (`ALLOWED_SOURCE_DOMAINS` dans `supabase/functions/_shared/assistant-format.ts` : ameli.fr, sante.gouv.fr, has-sante.fr, santepubliquefrance.fr, mpedia.fr, 1000-premiers-jours.fr, service-public.fr, 3114.fr…).
- **Urgences** : `assessSafety` (`_shared/safety.ts`) détecte les signaux d’alerte (détresse respiratoire, saignement, perte des eaux, contractions avant terme, pré-éclampsie, phlébite, fièvre après l’accouchement, nourrisson mou ou fébrile, purpura, idées suicidaires…) **avant tout appel à l’IA** et renvoie une carte d’orientation gratuite : 15, 112, 3114 (détresse psychologique), 114 par SMS (personnes sourdes ou malentendantes).
- **Contexte** (parcours, phase estimée du cycle, semaine de grossesse, grossesse multiple, âge des enfants, quelques données saisies sous forme de nombres) envoyé **uniquement si la personne l’active** pour la conversation (choix mémorisé dans `assistant_conversations.context_enabled`), puis nettoyé côté serveur (`sanitizeContext` : listes fermées et nombres bornés, aucun texte libre).
- Consignes (`_shared/assistant-prompt.ts`) : jamais de diagnostic, de prescription, de dose, d’interprétation seule d’une analyse/échographie/photo, de promesse de sécurité, de « consultation inutile », ni de source inventée ; refus poli hors sujet ; données encadrées par des balises et traitées comme des données. Les réponses sont contrôlées (`auditAnswer`) et remplacées par une version prudente si nécessaire.
- **Diffusion progressive** : la fonction relaie en Server-Sent Events le flux de l’API Gemini (`streamGenerateContent?alt=sse`, client `_shared/gemini.ts`) ; l’app affiche le texte au fur et à mesure (`fetch` du navigateur sur le web, `expo/fetch` sur iOS/Android) et bascule sans diffusion si le flux n’est pas lisible.
- **Retours « Utile / Pas utile »** dans `assistant_feedback` (RLS : propriétaire uniquement, seulement sur ses propres réponses), **favoris** (`assistant_messages.saved`), **quota** gratuit/premium vérifié par le serveur (`consume_assistant_quota`, 5 puis 300 questions par mois selon `plan_limits`), affiché via `assistant_quota_status()` avec bandeau premium quand il est atteint. Une question est rendue (`refund_assistant_quota`) si le service d’IA échoue.
- **Protection** : JWT vérifié, lectures sous RLS avec le client de l’utilisateur, limite de débit (8/min, 120/jour), 2 000 caractères maximum, détection des tentatives de détournement (refus sans consommer de question). Les conversations ne sont **jamais publiées** dans la communauté.

**Historique, arrêt, nouvel essai**
- L’historique n’est conservé **qu’avec l’accord de la personne** : désactivé par défaut, activé par « Garder mes conversations » (dans la conversation ou Réglages › Confidentialité), accord daté dans `privacy_settings.ai_history_consented_at` (migration `20261029000200_assistant_history_consent.sql`). Sans accord, rien n’est enregistré ; la conversation garde quand même son contexte : l’app joint les derniers échanges (`recent_turns`, 12 au plus, nettoyés par `sanitizeRecentTurns`) pour la réponse en cours seulement.
- Bouton **Arrêter la réponse** pendant la diffusion, **Réessayer** sur une réponse arrêtée ou en erreur, délai maximal de 90 s côté app, 30 s pour une réponse complète et 60 s pour le flux côté serveur.
- Si le service n’est pas configuré : l’utilisatrice voit seulement « L’assistant n’est pas disponible pour le moment. Réessayez plus tard. » ; l’état détaillé est dans **Réglages › État des services** (mode développeur : toucher 7 fois le numéro de version).

**Mise en service, pas à pas** (vous seul·e saisissez les clés, dans votre terminal, jamais dans l’app ni dans le dépôt)
1. Projet Supabase : créez-le sur supabase.com, installez la CLI, puis `supabase login` et `supabase link --project-ref <identifiant du projet>`.
2. Base : `supabase db push` (toutes les migrations de `supabase/migrations`).
3. Clé Gemini : créez-la sur **Google AI Studio** (aistudio.google.com › « Get API key » › « Create API key »), puis :
   ```bash
   supabase secrets set GEMINI_API_KEY=<votre clé>
   supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite      # facultatif : modèle stable, modifiable sans republier l’app
   ```
4. Fonction : `supabase functions deploy assistant` (vérification du JWT activée par défaut).
5. Application : dans `.env` (non versionné), `EXPO_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co` et `EXPO_PUBLIC_SUPABASE_ANON_KEY=<clé anon publique>` (clé publique prévue pour l’app ; la clé « service_role » ne doit jamais y figurer), puis relancez l’app.
6. Vérification : Réglages › État des services doit indiquer « Gemini » configuré ; posez une question, poursuivez, fermez puis rouvrez la conversation (si l’historique est activé), supprimez-la.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies automatiquement aux fonctions par Supabase.

**Sans clé IA** : aucune réponse n’est simulée, aucune question n’est décomptée (`ai_not_configured`). La démonstration publiée (sans Supabase) ne peut donc pas répondre : seule l’orientation en cas d’urgence (règles locales, sans IA) y reste active.

Tests : `npm test` (`src/__tests__/assistant.test.ts`, `assistantChat.test.tsx`, `safety.test.ts`) et `npm run db:test` (`supabase/tests/sql/33_assistant.sql`, `63_assistant_history_consent.sql`).

## Scanner

Routes : `/scanner` (accueil), `/scanner/product`, `/scanner/food` (« Puis-je manger ou donner cet aliment ? »), `/scanner/result/[id]`, `/scanner/history`, `/scanner/compare`. Parcours : code-barres (caméra `expo-camera`), photo, photo de la liste d’ingrédients, import d’une photo ou recherche par nom/EAN → **confirmation** (« Est-ce bien ce produit ? ») → fiche Open Food / Beauty / Products Facts (fonction `product-lookup`) → **RappelConso** → règles déterministes (`src/lib/domain/scanProduct.ts`, `scanFood.ts`, sources datées dans `scanSources.ts`) → explication en clair par **Gemini** (`scan-explain`), qui reprend le verdict des règles sans pouvoir le changer.

- **Lecture locale des photos** : Google ML Kit (`@react-native-ml-kit/barcode-scanning`, `@react-native-ml-kit/text-recognition`) sur le téléphone, aucune image envoyée. Modules natifs : **build de développement nécessaire** (`npx expo run:ios|android` ou EAS). Sur le web et dans Expo Go, l’app affiche « Lecture locale indisponible ici : utilisez la saisie manuelle ».
- **Secrets** : `OPENFOODFACTS_USER_AGENT` (active les bases Open Facts ; sans lui, aucune base n’est interrogée et l’app le dit), `GEMINI_API_KEY` (sans clé : `{ ai: 'not_configured' }`, l’app affiche l’explication des règles « Explication IA non configurée »), facultatifs `RAPPELCONSO_ENABLED`, `RAPPELCONSO_DATASET` (défaut `rappelconso-v2-gtin-espaces`).
- **Tables de référence** (lecture seule pour les utilisateurs) : `cosing_ingredients` et `ciqual_foods`, remplies par `npm run cosing:import -- fichier.csv` et `npm run ciqual:import -- dossier --version "…" --date AAAA-MM-JJ` (fichiers officiels, `--dry-run` pour vérifier). Table vide ⇒ « information non disponible ».
- Historique, résultats et favoris privés (RLS), quota mensuel d’analyses côté serveur ; rappels toujours gratuits, avec notification pour les produits de l’historique et des favoris.

Tests : `src/__tests__/scanner.test.ts`, `scannerScreens.test.tsx`, Deno `supabase/functions/_shared/{open-facts,rappelconso,scan-explain}_test.ts`, SQL `supabase/tests/sql/34_scanner.sql`.

## Sorties près de chez moi

Carte sur l’**accueil** (carte « Sorties près de chez moi », réglable dans Réglages › Mon accueil) et écran `/outings` (vues Carte et Liste ; `/nearby` y redirige). Lieux publics seulement : cafés et salons de thé, restaurants familles, parcs et aires de jeux, activités parents-enfants ; « PMI et accompagnement » en filtre secondaire (avec les annuaires officiels). Filtres : type de lieu, espace bébé ou enfant. **Aucune rencontre entre membres** (création et inscriptions bloquées en base par `20261029000100_outings_public_places_only.sql`, anciennes données conservées et exportables).

**Pour le moment : solution gratuite (OpenStreetMap), sans clé ni facturation.** Fond de carte à tuiles OpenStreetMap (déplacement, zoom, recentrage, attribution « © contributeurs OpenStreetMap »), lieux lus dans OpenStreetMap via l’API Overpass (`overpass-api.de`, puis `overpass.private.coffee` en secours), photos libres Wikimedia Commons avec auteur et licence quand le lieu en a une (sinon une illustration annoncée comme telle). Seule la position arrondie (~1 km) de la commune choisie est envoyée. Comme pour Google, les cafés et restaurants ne sont montrés que s’ils sont renseignés comme accueillant les enfants (espace enfants, table à langer, chaise haute) ; beaucoup ne le sont pas encore dans OpenStreetMap, l’écran le dit. Ces services publics sont gratuits mais à usage modéré (politiques d’usage d’OpenStreetMap) : pour un grand nombre d’utilisateurs, prévoir un fournisseur de tuiles et un serveur Overpass adaptés, ou passer à Google ci-dessous. Code : `src/lib/domain/osmPlaces.ts`, `src/features/outings/OsmMap.tsx`.

**Plus tard (payant) : Google.** Le chemin Google reste en place et s’active seulement avec `EXPO_PUBLIC_PLACES_PROVIDER=google` **et** les clés de carte ci-dessous ; sinon l’application revient d’elle-même à OpenStreetMap.

- **Lieux et photos : Google Places API (New)**, appelée uniquement par la fonction serveur `places` (clé `GOOGLE_PLACES_API_KEY`, jamais dans l’app). Position envoyée arrondie à ~1 km, limite d’appels par personne, aucun résultat stocké (cache non persistant). Cafés et restaurants gardés seulement si Google les indique adaptés aux enfants ; « non renseigné » sinon, jamais supposé.
- **Fond de carte Google** (obligatoire pour afficher des lieux Google) : `react-native-maps` (`PROVIDER_GOOGLE`) sur iOS/Android, Maps JavaScript API sur le web. Ces clés de carte sont des clés « client » prévues par Google, à **restreindre** : identifiant iOS / paquet Android + SHA-1, ou domaine du site.
- Sans clé : l’app affiche « La recherche de lieux n’est pas encore disponible » et aucune carte factice ; état détaillé dans Réglages › État des services (vérification réelle de la clé Places).

**Mise en service** (Google Cloud, facturation activée ; vous saisissez les clés vous-même)
1. Console Google Cloud › API et services : activez **Places API (New)**, **Maps SDK for Android**, **Maps SDK for iOS**, **Maps JavaScript API**.
2. Clé serveur (restreinte à « Places API (New) ») : `supabase secrets set GOOGLE_PLACES_API_KEY=<clé>` puis `supabase functions deploy places`.
3. Clés de carte : au moment de la construction, variables `GOOGLE_MAPS_IOS_API_KEY` et `GOOGLE_MAPS_ANDROID_API_KEY` (par exemple secrets EAS), et pour le web `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY` (restreinte au domaine). Une nouvelle build est nécessaire pour iOS/Android.

Tests : `src/__tests__/outings.test.tsx` (réponses Google simulées au format de l’API), SQL `62_outings_meetups.sql`, e2e `e2e/decouvertes.py`.

## Comprendre mon cycle et mes tests (parcours « Projet bébé »)

Écrans : `src/app/fertility/understand.tsx` (accueil), `mucus.tsx` (glaire), `test/[kind].tsx` (photo d'un test d'ovulation ou de grossesse), `calendar.tsx` (calendrier privé), `compatible.tsx` (tests pris en charge).

**Module d'analyse séparé** : `src/lib/cycleAnalysis/`
- `decode.ts` : photo → pixels, sur l'appareil (canvas sur le web, expo-image-manipulator + jpeg-js sur mobile), 640 px max.
- `quality.ts` : luminosité, surexposition, netteté, résolution. Si la qualité est insuffisante → « Photo inexploitable ».
- `lines.ts` : recadrage guidé (l'utilisatrice touche l'extrémité C puis l'extrémité T de la fenêtre), profil d'intensité le long de la bande, soustraction du fond, pics significatifs (> 3 × bruit), ligne de contrôle côté C, ligne de test côté T.
- `brands.ts` : liste FERMÉE des tests compatibles avec les règles de chaque notice (délai de lecture, règle de positivité, source et date).
- `interpret.ts` : résultat proposé + niveau de confiance, toujours à confirmer. Résultats : Pic de LH possible / non détecté, Résultat possiblement positif / négatif, Test invalide, Résultat incertain, Photo inexploitable.
- `mucus.ts` : catégories éducatives de la glaire, messages prudents (jamais de confirmation d'ovulation).
- `privacy.ts` : suppression de l'image, chiffrement AES-256-GCM sur l'appareil (clé dans le trousseau), nettoyage des journaux.
- `session.ts` : enregistrement ; l'image locale est supprimée dans tous les cas.

**Serveur** : migration `20261017000100_cycle_tests.sql` (colonnes d'analyse, `cycle_preferences`, bucket privé `cycle-private` limité au dossier de l'utilisatrice), fonction `cycle-photo` (glaire uniquement, consentement obligatoire, rien n'est conservé ni journalisé). Les photos de TESTS ne quittent jamais le téléphone.

**À faire avant publication** : calibrer les seuils (`QUALITY_THRESHOLDS`, `LINE_THRESHOLDS`, seuils de rapport T/C) sur un jeu de vraies photos de chaque test compatible ; vérifier les notices françaises de chaque boîte ; compte Gemini API en formule payante (Google n'utilise alors pas les données pour l'entraînement) ; build de développement pour tester la lecture d'écran (ML Kit) et le chiffrement sur téléphone.
