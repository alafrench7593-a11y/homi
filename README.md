# Toi & Moi — « À chaque étape de votre histoire »

Application mobile française qui accompagne les familles du désir d'enfant aux 10 ans de l'enfant : grossesse (y compris multiple), naissance, post-partum, suivi quotidien du bébé, enfants, santé de l'adulte, assistant IA, communauté modérée et partage familial.

**Pile technique** : React Native · Expo SDK 57 · TypeScript strict · Expo Router · Supabase (Postgres + RLS, Auth, Storage, Edge Functions) · TanStack Query (persisté, hors connexion) · Zustand · RevenueCat · Expo Notifications.

> Le nom de l'app se change à un seul endroit : `src/config/brand.json` (nom, slogan, slug, scheme, bundle id).

---

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
   supabase secrets set ANTHROPIC_API_KEY=... REVENUECAT_WEBHOOK_SECRET=... REVENUECAT_SECRET_API_KEY=... EXPO_ACCESS_TOKEN=...
   supabase functions deploy assistant revenuecat-webhook delete-account send-push product-lookup document-extract
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
- **Push** (réponse à un post, rappel produit, messages de l'équipe) : nécessitent `EAS_PROJECT_ID` (via `eas init`), un build de développement ou de production (pas Expo Go sur Android), et `EXPO_ACCESS_TOKEN` côté fonctions. Les jetons sont enregistrés dans `push_devices`, l'envoi passe par la fonction `send-push`.
- Android : configurez FCM (`eas credentials`). iOS : clé APNs gérée par EAS.

## 5. Abonnements (RevenueCat)

1. Créez les produits dans App Store Connect / Google Play : `toietmoi_premium_monthly` (5,99 €) et `toietmoi_premium_annual` (39,99 €, 7 jours d'essai).
2. Dans RevenueCat : entitlement `premium`, offering par défaut avec ces deux produits.
3. Renseignez les clés publiques `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`.
4. Webhook RevenueCat → `https://<ref>.supabase.co/functions/v1/revenuecat-webhook`, en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.

Sans clés, l'achat est indisponible (Expo Go) ou simulé en mode démo. **Ce qui reste toujours gratuit** : urgences (15, 112, 3114, 119, 3919, 114), réponses de sécurité de l'assistant, suivi quotidien de base, bilan d'humeur.

## 6. Builds

```bash
eas init                                   # crée le projet EAS et renseigne EAS_PROJECT_ID
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
npm run db:test       # tests de sécurité SQL/RLS sur un Postgres local (92 assertions)
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
- Produits et rappels du scanner : données marquées `is_demo`.
- Abonnement en mode démo : bascule locale, sans paiement.
- Illustrations du bébé : images générées par IA, à faire valider par un professionnel de santé.

## 11. Services externes

Supabase · Anthropic (assistant, extraction de documents) · RevenueCat · Expo/EAS (builds, push) · Apple App Store / Google Play · Open Food Facts / Open Beauty Facts (scanner, optionnel).

## 12. Avant la mise en ligne

- [ ] Faire relire tous les contenus santé par des professionnels (sage-femme, pédiatre) et renseigner les relecteurs.
- [ ] Faire valider les illustrations du bébé.
- [ ] Supprimer les comptes et données de démonstration du seed.
- [ ] Politique de confidentialité, CGU, mentions légales ; registre RGPD ; hébergement de données de santé (HDS) si nécessaire.
- [ ] Vérifier les numéros d'urgence et ressources (15, 112, 3114, 119, 3919, 114).
- [ ] Configurer les secrets serveur, le webhook RevenueCat, FCM/APNs.
- [ ] Tester sur appareils réels iOS et Android, avec VoiceOver/TalkBack et grandes tailles de texte.
- [ ] Mettre en place la modération humaine de la communauté et la gestion des signalements.
- [ ] Fiches stores : captures, description, classification d'âge, section « données collectées ».
