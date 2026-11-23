# HOMI — Audit de la source (Au fil de nous)

Établi le 13/11/2026 sur la copie transférée (`au-fil-de-nous-source.zip`, branche `premium-experience`, commit `ea244bc`).
Légende : **VÉRIFIÉ** = exécuté ou compté ici avec preuve · **REPRIS** = chiffre de `INVENTAIRE_TRANSFERT.md`, non recompté · **NON VÉRIFIÉ**.

## 1. Provenance et isolation

| Point | État |
|---|---|
| Archive = branche `premium-experience` (diff récursif fichiers du zip vs historique git) | VÉRIFIÉ : identiques |
| Historique (303 commits) poussé dans ce dépôt : `main` = `premium-experience` ; autres branches sous `source/*` (dont `source/build-11-presume`, ex-tag) | VÉRIFIÉ |
| Secrets dans les fichiers et tout l'historique (`.env`, `.p8/.p12/.pem`, keystore, JWT Supabase, `sbp_`, `sk_`, Google, GitHub, Expo, RevenueCat) | VÉRIFIÉ : aucun. Seule alerte : clé ECDSA générée à l'exécution dans `supabase/functions/_tests/apple_revocation.ts` (faux positif) |
| Données personnelles | REPRIS : e-mail et adresse du propriétaire retirés de l'historique avant transfert |
| Lien Drive de l'archive | **Accessible sans authentification** au 13/11 : à restreindre |

**Isolation appliquée sur la branche `homi/fondations`** :
- `src/config/brand.json` → HOMI (`slug`/`scheme` `homi`, `bundleId` provisoire `app.homi.family`, contact provisoire `support@homi.invalid`).
- `app.config.ts` : compte Expo et ID de projet EAS d'Au fil de nous retirés (lus seulement depuis `EXPO_OWNER` / `EXPO_PUBLIC_EAS_PROJECT_ID`).
- 7 scripts `*.command` supprimés : ils ciblaient le projet Supabase de production d'Au fil de nous (`rbfz…`), TestFlight et GitHub d'origine.
- Nom de marque remplacé dans `src/` et les 5 langues (≈ 440 occurrences) ; `legal-site/` régénéré.

**Dépendances résiduelles à Au fil de nous (à traiter avant tout build)** :
| Élément | Où | Risque |
|---|---|---|
| Produits/droits RevenueCat `aufildenous_*`, `AU_FIL_DE_NOUS_*` | `src/lib/premium/offers.ts`, `plans.ts`, `supabase/functions/revenuecat-webhook`, migrations | Achats branchés sur le mauvais catalogue si les clés AFDN sont réutilisées |
| Nom de marque dans 10 migrations SQL et 3 fonctions serveur (e-mails, contenus) | `supabase/` | Affichage « Au fil de nous » côté serveur → nouvelle migration HOMI |
| Éditeur des mentions légales (personne physique, société en cours) | `src/content/legal` | Textes juridiques à refaire pour HOMI |
| Logo, icônes, vidéos d'intro (46 Mo), captures store | `assets/`, `store/` | Identité visuelle AFDN encore présente |
| Domaine du site juridique, liens de support | `legal-site/`, `src/content/legal` | Pointent vers l'identité AFDN |

## 2. État de départ vérifié (avant toute refonte)

| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | VÉRIFIÉ : 0 erreur |
| Jest (`CI=1 npx jest --forceExit --maxWorkers=4`) | VÉRIFIÉ : 128 suites / **1 435 réussis**, 0 échec (66 s) ; après isolation : 129 / 1 436 |
| Tests SQL/RLS (`bash supabase/tests/run-local.sh`, PostgreSQL 16 local) | VÉRIFIÉ : **1 525 réussis, 0 échec** (98 migrations appliquées) |
| Textes en dur (`scripts/i18n-scan.js`) | VÉRIFIÉ : 0 |
| Routes (`scripts/gen-routes.js --check`) | VÉRIFIÉ : 217 routes à jour |
| ESLint | NON VÉRIFIÉ (non configuré dans la source) |
| Tests Playwright `e2e/` (46 scripts Python, web) | NON VÉRIFIÉ ici |
| iPhone / Android réels, achats sandbox, notifications | NON VÉRIFIÉ (aucun appareil ; jamais fait dans la source non plus) |

## 3. Les chiffres de référence, réconciliés

| Chiffre | Résumé 9/11 | Constaté | Statut |
|---|---|---|---|
| Écrans | 216 | **218** fichiers d'écran, **217** routes | VÉRIFIÉ |
| Outils | 141 | **155** entrées de catalogue (outil × thème) · **154** adresses distinctes · **127** écrans distincts sans paramètres ; l'inventaire source annonce 148 | VÉRIFIÉ — **le nombre dépend de la méthode** ; référence HOMI = `MATRICE_OUTILS.csv` (155 lignes) |
| Thèmes | 17 | 18 définis, **17** non vides (« Souvenirs et étapes » vide) | VÉRIFIÉ |
| Articles | 1 133 | 1 139 FR ; EN 1 154 mises à jour (écart non expliqué) ; ES/DE/IT non relus, non publiés | REPRIS |
| Espaces communautaires | 15 | **14** actifs (anciens archivés) | REPRIS |
| Fonctions serveur | — | **17** dossiers ; 14 en production d'après les scripts | VÉRIFIÉ / REPRIS |
| Migrations / tables | — | **98** migrations ; 190 tables, RLS partout | VÉRIFIÉ / REPRIS |
| Tests DB | 1 290+ | **1 525** assertions SQL réussies | VÉRIFIÉ |

Garde-fou ajouté : `src/__tests__/homiToolMatrix.test.ts` échoue si le catalogue tombe sous 148 outils ou 17 thèmes non vides.
Régénérer la matrice : `HOMI_MATRIX_OUT=$PWD/MATRICE_OUTILS.csv CI=1 npx jest src/__tests__/homiToolMatrix.test.ts`.

## 4. Architecture héritée (ce que HOMI garde)

- Expo SDK 57, React Native 0.86, Expo Router (`src/app`, 217 routes), TypeScript strict.
- Données : Supabase (Postgres + RLS par compte et par foyer : `_apply_owner_policies` ×26, `_apply_household_policies` ×54), React Query, Zustand, persistance AsyncStorage (hors ligne + synchronisation).
- Achats : RevenueCat ; Premium strict codé (`src/lib/premium/access.ts`, `20261108000300_premium_strict.sql`), **coupé en production** (`premium_policy.strict = false`).
- Sécurité santé : aucune dose calculée, assistant structuré (En bref / Quoi faire / À surveiller / Quand consulter / Sources), numéros 15 / 112 / 3114.
- i18n : 5 langues ; 0 texte en dur.

## 5. Écarts entre la source et le prompt HOMI

| Exigence HOMI | Source | Écart |
|---|---|---|
| Nouvelle DA premium (midnight violet, plum, lilac, champagne, pearl), clair/sombre | Palette rose poudré / pêche verrouillée par `contrast.test.ts` | **Refonte complète** des jetons + tests de contraste |
| Full motion (Reanimated/Skia, morphs, shared elements, Reduce Motion) | 56 fichiers `Animated` ; **0** usage de Reanimated | **Absent** — à construire |
| Navigation Home / Health / Baby / Family / Community | 7 onglets : Accueil, Agenda, Suivi, Outils, Communauté, Questions, Profil | **À refondre** (sans perdre les 217 routes) |
| Logo maison + famille, SVG, variantes | Logo PNG Au fil de nous | **À créer** |
| Allaitement V5 (timer persistant, tirage, stock, mixte, sevrage…) | Partiel ; branche `source/v6-allaitement` **en cours, non intégrée** | Intégrer puis compléter |
| Sommeil (tendances, export pédiatre, relais) | Partiel ; `source/v6-sommeil` **en cours** | Intégrer puis compléter |
| Premium Famille 15,99 € (2 comptes) | `source/v6-famille` **en cours**, migration jamais appliquée | Intégrer ; recâbler produits HOMI |
| Communauté visible et contextuelle | 14 espaces, onglet dédié | Conserver ; liens contextuels à ajouter |
| Google Play | Non configuré | À faire |
| Tests appareils / Maestro | Absents | À faire (hors de ce conteneur) |

## 6. Décisions produit tranchées par les documents

- **Prix** : 10,99 €/mois individuel, 15,99 €/mois famille (2 comptes Premium distincts, décision du 13/11 dans `source/v6-famille`), essai 3 jours ; 6 mois 49,99 € et annuel 79,99 € conservés comme SKUs existants ; **Assistant IA seul : 7,99 €/mois dans le code**, « environ 5 € » dans le résumé → le code fait foi, à confirmer. Famille annuel : non défini.
- **Premium strict vs communauté gratuite** : aucune décision écrite rendant la communauté gratuite n'a été trouvée. Le verrou strict existe mais est **coupé en production**. HOMI garde le mécanisme et l'interrupteur serveur ; l'état par défaut reste à décider par le propriétaire.

## 7. Prochaines étapes (ordre proposé)

1. Marque et logo HOMI (SVG, icône, splash) ; jetons du design system + tests de contraste.
2. Nouvelle coque de navigation (5 onglets) au-dessus des 217 routes existantes ; recherche universelle des outils.
3. Intégrer `source/v6-allaitement`, `source/v6-sommeil`, `source/v6-famille` avec tests.
4. Catalogue RevenueCat HOMI ; nouveau projet Supabase ; migration de marque.
5. Motion (Reanimated) avec Reduce Motion ; puis E2E et essais sur appareils.
