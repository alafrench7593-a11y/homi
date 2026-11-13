# Au fil de nous — inventaire de transfert (13/11/2026)

Fiche établie à partir du code (branche `premium-experience`, commit de transfert), **sans modifier le code applicatif**.
Chaque chiffre a été compté dans le dépôt ; quand il diffère du résumé du 9 novembre, l'écart est indiqué.
« Non trouvé » = l'information n'existe pas dans le dépôt.

## 1. Branches

| Branche | Contenu | État |
|---|---|---|
| `master` | Dernier état **déployé** : serveur v7 (migrations jusqu'à `20261110000200_assistant_payant.sql`, 14 fonctions serveur), pages juridiques, base du build iOS 13 | stable |
| `premium-experience` | `master` + journal intime (`/me/diary`), jetons typographiques, logo PNG nettoyé, introduction en 8 scènes, intégration continue GitHub Actions, ce document | **non déployé**, testé (Jest 128 suites / 1 435 tests) |
| `v6-allaitement` | accueil « L'alimentation de mon bébé », chronomètre de tétée, tirage détaillé, réserve de lait (+ migration `20261113000100_allaitement.sql`) | **travail en cours** au moment du transfert, non intégré |
| `v6-sommeil` | sommeil de l'enfant : historique 7/14/30 jours, journal, résumé pour le pédiatre | **travail en cours**, non intégré |
| `v6-famille` | Premium Famille côté serveur (titulaire + 1 partenaire), fin du partage du Premium individuel, écrans famille (+ migration `20261113000300_premium_famille.sql`) | **travail en cours**, non intégré |
| `v6-icones` | 47 pictogrammes SVG `MaternityIcon` + tests | terminé, non intégré |
| `v6-recherche` | Documents : Reddit, skills GitHub, MCP, applis de référence | terminé, non intégré |
| `worktree-agent-*` (3) | Anciennes branches de travail du 04/11 (tests d'abonnement, icône, export PDF du cycle) | historiques, en grande partie déjà reprises dans `master` |

**Build 11 TestFlight du 7 novembre : branche non identifiable avec certitude.** Les builds sont lancés avec
`EAS_NO_VCS=1` (aucun commit enregistré par Expo) et aucun document du dépôt ne cite « build 11 ». L'état du code le
plus probable est le dernier commit du 7 novembre, `aefc8b9` (« Donner mon avis, widget Bébé… », 07/11 11:42) :
le commit suivant date du 09/11 23:42. Un tag `build-11-presume` pointe sur ce commit — **présumé, non confirmé**.
Le travail « 5 langues, Premium strict, nouveaux prix » (commits `0c492af`, `ec0f076`, `958f2cf` du 09/11) est
**depuis déployé** côté serveur (v7, 10–11/11) et inclus dans le build 13 ; il est dans `master`.

## 2. Stack et versions (`package.json`, `app.config.ts`, `eas.json`)

| Élément | Version |
|---|---|
| Expo SDK | `~57.0.30` (expo-router `~57.0.28`) |
| React Native / React | `0.86.3` / `19.2.3` |
| TypeScript | `~6.0.3` |
| Supabase JS | `^2.118.0` (projet hébergé eu-west-1, Irlande) |
| RevenueCat | `react-native-purchases ^10.14.0` |
| Données | `@tanstack/react-query ^5.104.3`, `zustand ^5.0.15`, persistance AsyncStorage |
| Suivi d'erreurs | `@sentry/react-native ~7.11.0` (rien envoyé sans accord) |
| Tests | Jest `^29.7.0` + `jest-expo`, tests SQL (pgTAP-like, `supabase/tests`), tests Deno des fonctions, scripts Playwright Python (`e2e/`) |
| Animations | `Animated` (pilote natif) ; Reanimated 4.7 / Gesture Handler 3.3 présents seulement comme dépendances d'expo-router (non déclarés, non utilisés) |
| EAS | `eas.json` (cli ≥ 16, build production `autoIncrement`) |

## 3. Écrans

- **217 routes** (`src/lib/routes.generated.ts`, généré par `scripts/gen-routes.js`), **218 fichiers d'écran** dans `src/app` (hors `_layout` et `+not-found`).
- Écart avec le 9/11 (216) : **+1** (`/me/diary`, journal intime, branche `premium-experience`).

## 4. Outils (onglet « Outils », `src/lib/domain/toolCatalog.ts`)

- **18 thèmes définis** ; **17 contiennent des outils** (le thème « Souvenirs et étapes » n'a aucun outil dans le catalogue).
- **148 outils distincts** (adresse d'écran unique) en cumulant tous les parcours. Écart avec le 9/11 (141) : **+7**.
  Comptage exécuté avec `toolCatalog()` pour les 9 parcours (`avoid, ttc, cycle, none, pregnancy, postpartum, baby, child, family`).
- Par parcours : avoid 56 · ttc 64 · cycle 51 · none 52 · pregnancy 60 · postpartum 58 · baby 84 · child 73 · family 59.
- Par thème : Alimentation 16 · Sommeil 5 · Changes 2 · Dents 1 · Croissance 8 · Santé 15 · Humeur 11 · Grossesse 10 ·
  Cycle 18 · Scanner 6 · Calendrier 4 · Tâches 9 · Relais 4 · Pour soi 2 · Surcharge 5 · Rappels 8 · Ressources 24.

## 5. Espaces communautaires (`supabase/migrations/20261022000100_community_v2.sql`)

**14 espaces actifs** (écart avec le 9/11 : **−1**, le résumé en annonçait 15) : Suivi du cycle · Projet bébé · Grossesse ·
Jumeaux et triplés · Nouveau-né · Allaitement · Biberon · Sommeil · Diversification et repas · Santé et développement ·
Troubles neurodéveloppementaux · Post-partum et bien-être de la mère · Parents de plusieurs enfants · Questions générales.
Les anciens espaces (Fertilité, Accouchement, Parents d'enfants, Rencontres locales…) sont **archivés**, leurs publications fusionnées.

## 6. Articles

| Langue | Nombre | Statut |
|---|---|---|
| Français (source) | **1 139** articles (nombre d'articles distincts traduits ; insertions réparties dans `20261020000400`, `20261021000300`, `20261029000300`, `20261030000100`, `20261105000500`) | publiés |
| Anglais | 1 154 mises à jour distinctes dans `20261104000500_articles_en.sql` (écart avec 1 139 **non expliqué** : à vérifier en base) | publiés |
| Espagnol / Allemand / Italien | **1 139** chacun (`20261108000400/500/600`) | **à relire, non publiés** (affichés seulement après publication de la langue dans `content_locales`) |

Écart avec le 9/11 (1 133) : **+6**. Relecture humaine des traductions es/de/it et médicale : **non faite**.
Contenu de l'application : `src/content/articles/**` (+ `en/`, 55 fichiers).

## 7. Serveur Supabase

- **17 fonctions serveur** (`supabase/functions`) : assistant, assistant-demo, auth-email, calendar-feed, community-ai,
  cycle-photo, delete-account, document-extract, document-read, places, product-lookup, revenuecat-webhook, scan-explain,
  send-push, service-status, storage-cleanup, subscription-sync. (14 sont déployées en production d'après le script v7 ;
  calendar-feed, service-status et storage-cleanup n'y figurent pas → **état en production non vérifié** pour ces 3.)
- **98 migrations**, **190 tables** créées ; RLS activée sur toutes les tables via `enable row level security`
  (107 occurrences directes) et les fonctions `_apply_owner_policies` (26 appels) et `_apply_household_policies` (54 appels).
- **69 fichiers de tests SQL** (`supabase/tests/sql`), lancés par `bash supabase/tests/run-local.sh` (Postgres local, ~6 min).

## 8. Tests

```
npx tsc --noEmit -p .                                   # typage : 0 erreur
node scripts/i18n-scan.js                               # textes en dur : 0
node scripts/gen-routes.js --check                      # routes à jour
CI=1 npx jest --forceExit --maxWorkers=2 --testTimeout=90000
bash supabase/tests/run-local.sh                        # tests SQL / RLS
```
- Jest sur `premium-experience` : **128 suites, 1 435 tests réussis** (exécuté le 12/11). Écart avec le 9/11 (1 290) : **+145**.
- 46 scripts de parcours Playwright dans `e2e/` (version web). **Aucun test sur iPhone ni Android réel** dans le dépôt.

## 9. Abonnements (RevenueCat, App Store) et Premium strict

| Produit (App Store) | Prix | Droit RevenueCat | Offre `default` |
|---|---|---|---|
| `aufildenous_premium_monthly` | 10,99 €/mois, essai 3 jours | `AU_FIL_DE_NOUS_PREMIUM` | `$rc_monthly` |
| `aufildenous_premium_6months` | 49,99 € | `AU_FIL_DE_NOUS_PREMIUM` | `$rc_six_month` |
| `aufildenous_premium_annual` | 79,99 € | `AU_FIL_DE_NOUS_PREMIUM` | `$rc_annual` |
| `aufildenous_family_monthly` (créé le 13/11) | 15,99 €/mois, essai 3 jours | `AU_FIL_DE_NOUS_FAMILLE` + `AU_FIL_DE_NOUS_PREMIUM` | `famille_mensuel` |
| `aufildenous_ai_monthly` | 7,99 €/mois | `ASSISTANT_IA` | — |
| anciens `toietmoi_premium_monthly` / `_annual` | — | `premium` (ancien droit) | non proposés, conservés |
| 12 outils « à vie » `aufildenous_tool_*` | prix de la boutique | `TOOL_*` | ancienne offre, achats honorés |

Tous les abonnements Apple sont « Finaliser avant soumission » (à soumettre avec une version de l'app). Google Play : **non trouvé** (aucune configuration).

**Premium strict tel que codé** (`src/lib/premium/access.ts`, `supabase/migrations/20261108000300_premium_strict.sql`) :
- interrupteur serveur `premium_policy.strict` ; **en production : `false`** (verrou installé mais coupé, `20261110000100`) ;
- verrou actif : toute **nouvelle saisie** dans les tables de suivi (`STRICT_TABLES`) est refusée sans Premium par un
  déclencheur ; la lecture, la suppression, l'export et le serveur ne sont jamais bloqués ;
- restent libres : inscription, introduction, parcours, profils, réglages, export/suppression, urgences, rappels de produits, mentions légales ;
- indépendamment du verrou : menus de la semaine, routine du coucher, analyse du sommeil, diversification et
  **invitation du partenaire** sont réservés au Premium (`require_premium`) ; l'assistant IA est payant
  (`premium_policy.assistant_paid = true`) et affiché « Bientôt disponible » (secret serveur `ASSISTANT_ENABLED` absent) ;
- limites de l'offre gratuite : table `plan_limits` (documents 15, enfants 3, listes 4, scans 10/mois, rappels 5…).
- Partage : aujourd'hui en production, le Premium individuel est partagé avec **un** co-parent (`_premium_partner_of`) ;
  la branche `v6-famille` réserve ce partage au Premium Famille (décision du 13/11, **non déployée**).

## 10. Défauts connus et travaux non terminés

- **Non vérifié sur appareil réel** : clavier, notifications, achats, révocation Apple, fluidité des animations, Android.
- Contrat Apple des applications payantes incomplet (fiscalité, banque) ; passage du compte développeur à une société en cours.
- Google Cloud sans facturation : carte « Sorties près de chez moi » (Places, Maps iOS) non branchée.
- Assistant IA coupé (nouvelle clé Gemini à créer).
- Traductions es/de/it et contenus santé à relire avant publication.
- Branches `v6-*` non intégrées ni testées ensemble ; migrations `20261113000100/300` jamais appliquées.
- Écart d'articles anglais (1 154 vs 1 139) à expliquer.
- `REVENUECAT_SECRET_API_KEY` absent du serveur (facultatif) ; jetons Supabase `sbp_` à révoquer côté compte (hors dépôt).
- Rapports détaillés : `AU_FIL_DE_NOUS_RELEASE_AUDIT.md` (verdict NOT READY), `docs/PREMIUM_EXPERIENCE_AUDIT.md`, `AGENT_WORKBOARD.md`.

## 11. Identifiants non secrets présents dans le dépôt

Référence du projet Supabase (`rbfzsfxwksxfcherhqqj`), Team ID Apple, ID de la clé « Sign in with Apple », App ID App Store
Connect, nom du compte Expo, ID de projet EAS. Ce ne sont pas des secrets, mais ils identifient les comptes du propriétaire.
Clés publiques : la clé « anon » Supabase et les clés publiques RevenueCat **ne sont pas dans le dépôt** (fichier `.env` local et variables EAS).
