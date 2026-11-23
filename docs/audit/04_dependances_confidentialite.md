# Audit 04 — API, dépendances et confidentialité

Établi le 13/11/2026 sur `homi/fondations` (≥ `8c2ef14`). Périmètre : secrets (fichiers et historique), données
personnelles dans les journaux et Sentry, validation des entrées (fonctions Deno, RPC), dépendances `npm audit`,
autorisations natives et stockage local.

Contrôle rejouable : `node scripts/homi/privacy-check.mjs [--history] [--dist <dossier>]` (une ligne OK / ÉCHEC par
contrôle, code 1 en cas d'échec, aucune valeur secrète affichée).

## Synthèse

| # | Gravité | Constat | État |
|---|---|---|---|
| C1 | Moyenne | Sentry natif démarré **avant** l'accord ; blocages iOS / arrêts système / NDK envoyés sans filtre ni accord | **Corrigé** |
| C2 | Moyenne | Fichier `.env` (envoyé à EAS) conçu pour recevoir aussi les secrets serveur ; `.easignore` laissait passer `.env.*`, clés `.p8`/`.pem`… | **Corrigé** (archive) + **contrôle** ajouté ; reste une consigne d'usage |
| C3 | Faible | Rapports Sentry : valeurs citées (`"…"`, `« … »`, `Key (col)=(valeur)` de Postgres), `tags`, `mechanism.data` non nettoyés | **Corrigé** |
| C4 | Faible | Fonctions Deno : corps JSON lus sans limite de taille ; `document_id` (document-read) et `scan_id` (scan-explain) non validés ; `brand`/`name` libres (product-lookup › recalls), jokers ILIKE non échappés | **Corrigé** |
| C5 | Faible | `assistant` journalisait `e.message` d'une erreur de flux (peut citer une saisie) | **Corrigé** |
| D1 | Info | `decode-uri-component` 0.2.2 (DoS exponentiel, confirmé : 1 000 × `%C3` → 57 s) via `query-string` ← `expo-router` | **Non atteignable** (voir § 4) |
| D2 | Info | 13 autres alertes : outils de construction (`@expo/cli`, config-plugins, `node-forge`, `glob`, `xcode`…) | **Non atteignables** à l'exécution |
| — | — | Aucun secret dans les fichiers suivis, dans l'historique complet (319 commits) ni dans le bundle web | Vérifié |

## 1. Secrets

**Méthode** : expressions des formats connus (JWT `eyJ…` dont `service_role`, `sbp_`/`sb_secret_`, `AIza`
Google/Gemini, `sk-ant-`/`sk-proj-`/`sk-…` Anthropic/OpenAI, `sk_live`, `ghp_`/`github_pat_`, `re_` Resend, `whsec_`,
`appl_`/`goog_` RevenueCat, clés privées PEM, `AKIA`, `xox*`) sur `git ls-files`, sur `git log --all -p` (89 Mo,
319 commits) et sur la liste de tous les fichiers jamais ajoutés (`.env`, `.p8`, `.p12`, `.pem`, keystore,
`credentials.json`, `google-services.json`…).

**Résultat** : aucun secret. Seuls « faux positifs » examinés :
- `supabase/functions/_tests/apple_revocation.ts` : clé PEM **générée au test** (`crypto.subtle`), jamais une vraie clé ;
- `src/lib/demoMode.ts` : mot de passe `demonstration-locale-1` du compte de **démonstration locale** (backend simulé
  sur l'appareil après `enterDemoMode()`), sans valeur sur Supabase ;
- `supabase/config.toml` : uniquement des références `env(…)`.

**Bundle web** : `npx expo export --platform web --output-dir /tmp/audit4/dist` (39 Mo, 7 fichiers) puis
`privacy-check --dist` : aucune clé ; seuls les **noms** de variables serveur apparaissent (textes de l'écran
d'état des services), jamais de valeur. Le contrôle décode tout JWT trouvé et n'accepte que le rôle `anon`
(un `service_role` est signalé — vérifié sur un faux bundle). Limite : export fait sans `.env` (aucun présent dans
l'environnement d'audit) ; le contrôle compare aussi les valeurs de `.env` / `.env.local` quand ils existent.
L'application ne lit que `process.env.EXPO_PUBLIC_*` (contrôle automatique sur `src/`).

Publiques par nature (à restreindre chez le fournisseur, pas à cacher) : clé `anon` Supabase, clés RevenueCat
`appl_`/`goog_`, DSN Sentry, `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY` (restriction par référent HTTP obligatoire), clés
Maps natives (restriction par identifiant d'application / SHA-1, déjà indiqué dans `app.config.ts`).

**C2 — `.env` envoyé à EAS** (confirmé par lecture, non exploité) : `.easignore` transmet volontairement `.env`
(clés publiques), mais `.env.example` (« copiez ce fichier en `.env` ») et `scripts/check-services.mjs` y placent
aussi `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`… Ces valeurs partiraient alors dans
l'archive de construction EAS (serveurs tiers, conservée avec le build). Elles ne sont **pas** inlinées dans le
bundle (seules les `EXPO_PUBLIC_*` le sont). Corrections :
- `.easignore` exclut désormais `.env.*` (sauf `.env.example`), `*.p8`, `*.p12`, `*.pem`, `*.key`, keystores,
  `*.mobileprovision`, `credentials.json`, `supabase/.temp/`, `coverage/` ;
- `privacy-check` **échoue** si un `.env` local contient un secret serveur rempli (liste tirée de `.env.example`).
- Consigne : secrets serveur dans `.env.local` (non envoyé) ou uniquement `supabase secrets set`.
  Si une configuration publique de production était dans `.env.production`, la déplacer dans `.env` ou dans les
  variables d'environnement EAS (ce fichier n'est plus envoyé).

## 2. Données personnelles dans les journaux

**Application** : aucun `console.log/info/debug` ; un seul `console.warn` (clé i18n manquante, `__DEV__` seulement).

**Fonctions Deno** : 35 appels `console.error`, tous limités à un code (`error.code`, statut HTTP, nom d'état).
Un seul écart : **C5** `assistant/index.ts` journalisait `e.message` d'une erreur du flux (une `PostgrestError` ou un
message d'erreur peut citer une valeur saisie) → remplacé par le statut Gemini ou le **nom** de l'erreur. Contrôle
automatique : aucun journal serveur contenant `.message`, `body`, `.text`, `email`, `JSON.stringify`, `raw`.

Non modifié, signalé : `calendar-feed` reçoit son jeton secret dans l'URL (`?token=`) — imposé par les agendas
externes ; il peut figurer dans les journaux d'accès de Supabase. Atténuation existante : empreinte en base,
révocable, limite 60/h.

**Sentry (C1, C3)** — `src/lib/crashReporting.ts` :
- *Reproduction C1* : `initCrashReporting()` (module `_layout.tsx`) appelait `Sentry.init` au lancement, **avant**
  la lecture de `privacy_settings.crash_reports_enabled`. Le filtre `beforeSend` JS bloquait les erreurs JS sans
  accord, mais le SDK natif (Sentry Cocoa 7.11 : `enableAppHangTracking`, `enableWatchdogTerminationTracking`
  vrais par défaut ; Android : NDK) envoie ses événements **sans passer par ce filtre** (lecture de
  `RNSentryModuleImpl.java` / `SentrySDKWrapper.m` : seul `enableCrashHandler` était coupé).
- *Correction* : `Sentry.init` n'est appelé qu'après l'accord (`setCrashReportingAllowed(true)`), une seule fois ;
  `enableAppHangTracking`, `enableWatchdogTerminationTracking`, `enableNdk`, `attachThreads`,
  `enableAutoPerformanceTracing`, `enableCaptureFailedRequests` à `false`. Retrait de l'accord : plus rien n'est
  transmis (`beforeSend` → `null`) ; le SDK reste chargé jusqu'au prochain lancement.
- *C3* : nettoyage étendu aux valeurs entre guillemets/chevrons et au détail Postgres `Key (…)=(…)` ; suppression de
  `tags`, `threads`, `exception.mechanism.data`.
- *Tests* : `src/__tests__/crashReporting.test.ts` (pas d'init sans accord, une seule init avec les options natives
  coupées, nettoyage).

**Notifications** : push serveur → texte générique sur écran verrouillé sauf accord (`push-rules`, test existant) ;
canaux Android `lockscreenVisibility: PRIVATE` ; rappels locaux de médicament masqués (`lockScreenText`). Les autres
rappels locaux affichent le titre saisi par la personne (iOS selon le réglage « Aperçus ») — choix produit, non
modifié (hors périmètre : `src/lib/notifications.ts`).

## 3. Validation des entrées

Nouveau module pur `supabase/functions/_shared/body.ts` (testé par Jest, `src/__tests__/serverInput.test.ts`) :
`readJsonBody(req, max)` (taille vérifiée sur `Content-Length` et sur le texte reçu, 413 au-delà ; objet attendu),
`isUuid`, `optText`, `escapeLike`.

| Fonction | Avant | Après |
|---|---|---|
| `document-read` | `document_id` : chaîne quelconque ; corps illimité | UUID strict ; 64 Ko |
| `document-extract` | UUID déjà vérifié ; corps illimité | 64 Ko |
| `places` | corps illimité (lat/lon/rayon/photo déjà validés) | 4 Ko |
| `scan-explain` | `scan_id` libre (ignoré par la RLS si invalide) | UUID strict ; 64 Ko |
| `community-ai` | UUID déjà vérifiés | 4 Ko |
| `product-lookup` | `recalls` : `brand`/`name` de tout type et toute taille (objet → exception dans `fold`, chaîne géante vers RappelConso) ; `ilike('brand', …)` interprétait `%`/`_` | texte borné (120/200), jokers échappés ; 16 Ko |
| `assistant` / `assistant-demo` | `req.json()` sans limite (contenus déjà bornés ensuite) | 256 Ko / 128 Ko |
| `delete-account` | code Apple de longueur libre | 16 Ko, code ≤ 1 024 caractères |

**SSRF** : aucune URL fournie par le client n'est appelée. `places` n'accepte qu'un nom de photo
`places/…/photos/…` (expression stricte) vers l'hôte Google fixe ; `product-lookup` construit les URL Open
Food Facts / Open Prices / RappelConso à partir de chiffres, d'une catégorie `xx:[a-z0-9-]` ou d'un terme échappé
et tronqué ; `document-read`/`document-extract` ne lisent que le stockage, chemin préfixé par le foyer.

**Injection dans les prompts** : `scan-explain` (champs tronqués, réponse rejetée si elle change le verdict ou
promet l'innocuité), `assistant` (détection de détournement + audit de la réponse), `community-ai` (texte lu sous
RLS, mentions neutralisées, pseudonymes refusés en sortie). Une injection ne peut viser que la réponse de la
personne elle-même ; pas de donnée d'un tiers dans ces prompts. Risque résiduel accepté.

**RPC SQL** (70 appelées par le client, échantillon des paramètres libres) : `update_if_version` (SQL dynamique)
protégé par liste blanche de tables et de colonnes, `format('%I')` et `security invoker` ; `report_member`,
`create_private_group`, `create_mission`, `claim_push_device` bornés par des contraintes de table ou `left()`.
Écart faible non corrigé (migrations hors périmètre) : `search_members`, `search_posts(_advanced)` sans longueur
maximale de `p_query` et jokers `%`/`_` non échappés — résultats limités à ce que la personne peut déjà lire et au
`p_limit` ; à borner (`left(p_query, 100)`) dans une prochaine migration.

**Champs texte côté application** : schémas zod (`src/lib/validation.ts`) et `maxLength` présents sur les
formulaires examinés ; les limites qui font foi sont celles de la base (contraintes `char_length`).

## 4. Dépendances (`npm audit --omit=dev`)

15 alertes (6 élevées, 8 modérées, 1 faible). **Atteignables à l'exécution : 0. Corrigées : 0** (aucune mise à jour
installée : `node_modules` est partagé entre agents et aucune alerte n'est exposée).

| Paquet | Gravité | Chemin | Atteignable ? |
|---|---|---|---|
| `decode-uri-component` 0.2.2, `query-string` 7.1.3, `expo-router` 57.0.28 | élevée | runtime | **Non** : DoS confirmé sur la bibliothèque, mais `expo-router` n'utilise `query-string` que pour `stringify` (pas de décodage) ; l'analyse des liens entrants passe par `fork/getStateFromPath` (`URLSearchParams`/`decodeURIComponent`) ; `queryString.parse` n'existe que dans `react-navigation/core/getStateFromPath.js`, non branché par expo-router ; aucun usage dans `src/`. Correctif amont seulement en expo-router 58 (SDK 58) ; `decode-uri-component` 0.5.1 est ESM seul (incompatible `require` de query-string 7) → pas de `overrides`. |
| `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/fingerprint`, `zod` 3 (d'`@expo/cli`), `node-forge`, `glob`, `minimatch`, `deepmerge`, `uuid` 7, `xcode` | élevée → faible | outils de construction / prébuild | **Non** (jamais dans le bundle). Corrigé par `expo@57.0.33` (`@expo/cli` 57.0.34, config 57.0.11…), compatible SDK 57 : à appliquer par `npx expo install expo@~57.0.33 && npx expo install --fix` lors d'une fenêtre de mise à jour, puis tsc + Jest. **Appliqué par l'audit 10** (`docs/audit/10_non_regression.md` § 1) : 15 → 6 alertes. |

## 5. Confidentialité de l'appareil

- **Autorisations** : Android `CAMERA`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` ; micro désactivé
  (image-picker, camera) ; position au premier plan seulement (aucune position en arrière-plan ni service de
  premier plan) ; textes iOS clairs dans 5 langues ; `NSPrivacyTracking: false`. Contrôle automatique.
- **`allowBackup: false`** (Android) : cache, file hors ligne et clé des photos du cycle hors sauvegarde Google.
- **Jetons** : session Supabase dans le Trousseau / Keystore (`expo-secure-store`, `AFTER_FIRST_UNLOCK`, découpée),
  effacée à la réinstallation ; **web** : `localStorage` (inhérent au navigateur — vulnérable à un XSS, aucun
  `dangerouslySetInnerHTML` relevé dans ce périmètre).
- **Cache après déconnexion** : `qc.clear()` à tout changement de compte ou déconnexion (le cache persistant
  `toietmoi.cache.v1` est réécrit vide), rappels locaux annulés, file hors ligne d'un autre compte effacée ;
  suppression du compte → `wipeLocalData()` (AsyncStorage `toietmoi.*`, clé des photos, exports). Le cache
  persistant (AsyncStorage) n'est pas chiffré : protégé par le chiffrement de l'appareil et `allowBackup: false`.

## 6. Vérifications

- `npx tsc --noEmit` : 0 erreur ; `node scripts/i18n-scan.js` : 0 texte en dur.
- Jest (suite complète, `--maxWorkers=2`) : **144 suites, 1 676 tests au vert** (réf. 143 / 1 667 ; + `serverInput.test.ts`, 3 tests ajoutés à `crashReporting.test.ts`).
- `node scripts/homi/privacy-check.mjs --history --dist /tmp/audit4/dist` : tout au vert.

## 7. Limites

- Deno absent : les fonctions modifiées ne sont pas vérifiées par `deno check` ; la logique ajoutée est dans un
  module pur testé par Jest, les modifications des `index.ts` sont mécaniques.
- Pas d'appel aux services réels (Sentry, EAS) : le comportement natif de Sentry est déduit du code source du SDK
  7.11 présent dans `node_modules`.
- Bundle web exporté sans `.env` réel ; bundles natifs (Hermes) non exportés.
