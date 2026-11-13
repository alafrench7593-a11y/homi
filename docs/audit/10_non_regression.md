# Audit n°10 — Performance et non-régression

Établi le 13/11/2026 sur `homi/fondations` (≥ `08096c7`, puis fusion de `ee5a249` avant la campagne finale).
Seul le **web** est exécutable ici (ni simulateur, ni Maestro, ni EAS). Mesures : Chromium 390 × 844, processeur
ralenti × 4 (`Emulation.setCPUThrottlingRate`), démonstration + Premium. Matrice outil → résultat :
`docs/audit/MATRICE_OUTILS_VERIFIEE.csv` (§ 6).

## 1. Dépendances (recommandation de l'audit 4 appliquée)

| | Avant | Après |
|---|---|---|
| `expo` | ~57.0.30 (`@expo/cli` 57.0.2x) | **~57.0.33** (`@expo/cli` 57.0.34) |
| Alignement SDK 57 (`expo install --fix`, hors ligne : l'API Expo est bloquée par le proxy) | — | expo-router 57.0.31, expo-notifications 57.0.25, expo-sharing 57.0.26, expo-location ~57.0.23, expo-dev-client, expo-gl, expo-glass-effect 57.0.5, expo-image-manipulator / -picker, expo-linking, expo-splash-screen (correctifs) |
| `npm audit --omit=dev` | 15 (6 élevées, 8 modérées, 1 faible) | **6 (3 élevées, 3 modérées)** |

- `--fix` voulait **rétrograder** Reanimated 4.7.1 → 4.5.1, worklets 0.13.0 → 0.10.1, Gesture Handler 3.3 → 2.32 et
  react-native-maps 1.29.11 → 1.27.2 (versions volontairement en avance, cf. `MOTION_SYSTEM.md`) : refusé, et ces quatre
  paquets sont désormais dans `expo.install.exclude` (`package.json`).
- Premier essai : `expo-modules-core` s'est retrouvé imbriqué sous `expo/node_modules` (conflit de pair optionnel avec
  worklets 0.13) → **51 suites Jest cassées** (`expo-crypto` : « Super expression must either be null or a function »).
  Corrigé en le remettant à la racine, comme avant ; `npm ci` vérifié (avertissement de pair seulement, déjà présent avant).
- Alertes restantes : `query-string`/`decode-uri-component` via `expo-router` (non atteignable, analyse de l'audit 4 ;
  correctif seulement en SDK 58), `minimatch` via `@expo/fingerprint` (outil de construction). Aucune n'est dans un
  chemin d'exécution de l'application.
- Après mise à jour : tsc 0, Jest 155 / 1 826, export web OK. `npx expo-doctor` : **19 / 21** ; les 2 échecs sont des
  contrôles en ligne (schéma de configuration sur `exp.host`, React Native Directory) bloqués par le proxy ; « versions
  conformes au SDK installé », « pas de doublons » et « pairs requis installés » sont verts.

## 2. Performance web mesurée

Script rejouable : `e2e/perf_web.py` (variantes `base`, `reduit` = Réduire les animations, `sansflou` = backdrop-filter
neutralisé, `sansscene` = fond masqué). « Repos » = temps de tâches du fil principal (`Performance.getMetrics`,
`TaskDuration`) pendant 4–5 s sans interaction, en ms par seconde (1 000 = fil saturé).

### 2.1 Causes trouvées et corrigées

1. **Boucles décoratives qui tournaient hors écran.** Les onglets restent montés : en consultant Bébé ou Communauté,
   l'Accueil continuait d'animer le bébé à naître (flottement, battement, liseré : 4 boucles `Animated`), « Au fil de
   nous » (respiration, halo, mini-vidéo) et la rotation de ses étapes (≈ 1 200 écritures de style/s relevées par
   `MutationObserver`). Correction : `Screen` fournit `ScreenFocusContext` (`useScreenFocused`, `src/components/screenChrome.ts`) ;
   `FetusArt`, `FamilyStoryArt` et `useRotatingChapter` s'arrêtent quand l'écran n'est pas affiché (rotation en
   pause, étape conservée). Tests : `src/__tests__/perfAmbient.test.tsx`.
2. **Fond `DesertScene` recalculé en JS à chaque image sur le web** (Reanimated n'a pas de fil UI sur le web : 3 à 4
   plans × 60 images/s). Correction : sur le web, la même dérive (amplitude, demi-période 11 s, aller-retour) est une
   animation CSS (`webDriftStyle`, compositeur) ; natif inchangé (Reanimated, fil UI). Vérifié dans la page : 4
   animations CSS actives, translation qui progresse ; capture identique.
3. **Régression trouvée par la non-régression** (biberon, § 4) : corrigée.

### 2.2 Mesures avant / après

| Mesure (CPU × 4) | Avant | Après |
|---|---|---|
| Fil principal au repos, onglet Bébé ouvert après l'Accueil | 852–971 ms/s | **5–142 ms/s** |
| Fil principal au repos, onglet Communauté ouvert après l'Accueil | 948–995 ms/s | **4–134 ms/s** |
| Fil principal au repos, écran avec le seul fond calme (`/baby` ouvert directement) | 272–296 ms/s | **1–63 ms/s** |
| Fil principal au repos, Accueil affiché (bébé à naître + « Au fil de nous » à l'écran) | 580–695 ms/s | 656–753 ms/s (inchangé, voir § 2.4) |
| Idem avec Réduire les animations | 0,4 ms/s | 0,6 ms/s |
| Premier rendu utile, accueil sans compte (médiane de 4, alterné A/B) | 3 320 ms | 3 313 ms |
| Premier rendu utile, Accueil démo + Premium (médiane de 4) | 4 308 ms | **3 465 ms** (−20 %) |
| Long tasks pendant le chargement de l'Accueil (médiane) | 3 379 ms | **2 612 ms** |
| FCP accueil sans compte | 3 088 ms | 3 300 ms (bruit : 2 672–3 300 selon les passages) |
| Défilement Accueil : FPS / p95 / images > 50 ms | 55,7 / 16,8 ms / 1 | 52,6–55 / 16,8 ms / 1 |
| Défilement hub Bébé | 59,7 / 16,8 ms / 0 | 60 / 16,7 ms / 0 |
| Défilement Communauté (liste virtualisée) | 43,3 / 33,4 ms / 6 (909 ms de long tasks) | 39,6–42,6 / 33–117 ms / 5–6 (≈ 0,9–1,2 s) |
| Défilement historique du biberon | 60 / 16,7 ms / 0 | 60 / 16,7 ms / 0 |
| Tas JS après GC : départ → 10 → 20 navigations | 53,2 → 77,3 → 78,0 Mo | 53,0 → 77,3 → 77,6 Mo |
| Nœuds DOM : départ → 20 navigations | 763 → 4 580 | 764 → 4 572 |

Mémoire : le tas monte quand les 5 onglets sont montés une première fois puis **plafonne** (+0,3 à +0,7 Mo entre la 10ᵉ
et la 20ᵉ navigation) : pas de fuite. Le verre (flou) : neutraliser `backdrop-filter` ne change ni le repos (718 contre
642 ms/s, bruit) ni les FPS de défilement (57 / 60 / 39,9 / 59,7) — son coût est du côté GPU, non mesurable ici.
Réduire les animations : repos de l'Accueil 642 → 0,4 ms/s (la préférence est bien respectée).

### 2.3 Taille du bundle web (`--dump-sourcemap`, analyse par carte de source)

| Fichier | Brut | gzip |
|---|---|---|
| `entry-*.js` (chargé au démarrage) | 13,95 Mo | 3,86 Mo |
| `demoCatalog-*.js` (chargé à l'entrée en démo) | 10,76 Mo | 3,11 Mo |
| 3 autres morceaux | 1,17 Mo | 0,32 Mo |
| Export complet (dont `assets/` 14 Mo : mini-vidéos « Au fil de nous » 7,6 Mo pour 10 WebP animés, police d'icônes 1,3 Mo) | 39,7 Mo | — |

Plus gros contributeurs de `entry` : **traductions `src/i18n` 3,87 Mo (31 %)** — les 5 langues chargées d'emblée
(fr 0,81, de 0,79, es 0,78, it 0,77, en 0,71) —, `src/app` 1,32, `src/lib` 1,21, `src/features` 0,72, `src/content` 0,70,
Reanimated 0,62, zod 0,49, expo-router 0,42, Sentry ≈ 0,6 (core + react-native + replay), react-native-web 0,28,
Gesture Handler 0,26. `demoCatalog` = 100 % `src/content` (articles du guide).

### 2.4 Non corrigé (recommandations, mesures à l'appui)

- **Boucles décoratives À L'ÉCRAN sur le web** : sur l'Accueil affiché, bébé à naître + « Au fil de nous » occupent
  ≈ 65–75 % du fil principal à CPU × 4 (≈ 170 ms/s sans ralentissement). Sur iOS / Android elles passent par le pilote
  natif (`useNativeDriver`) et ne coûtent rien au JS. Piste : même traitement que le fond (animation CSS sur le web),
  en séparant le flottement de l'inclinaison au doigt (deux `transform` sur la même vue aujourd'hui).
- **Langues** : charger seulement la langue active (les 4 autres à la demande) retirerait ≈ 3 Mo bruts / ≈ 0,8 Mo gzip
  du démarrage. Changement d'architecture i18n : hors de la portée « cause évidente ».
- **Mini-vidéos WebP** 0,7 à 0,9 Mo chacune (deux affichées à la fois sur l'Accueil) : à réencoder (résolution / qualité).
- **Communauté** : déjà virtualisée (`VirtualList`, lots de 12, fenêtre 7) ; les long tasks viennent du montage des
  cartes pendant un défilement rapide (840 px/s scripté). Rien d'évident ; `PostCard` pourrait être mémoïsé.

## 3. Builds disponibles

| Commande | Résultat |
|---|---|
| `npx expo export --platform web --clear` | OK (2 min 20) |
| `npx expo export --platform ios` | **OK** : bytecode Hermes v98, 42 Mo, 4 246 modules (1 min 43) |
| `npx expo export --platform android` | **OK** : bytecode Hermes v98, 42 Mo, 4 223 modules (1 min 41) |
| `npx expo-doctor` | 19 / 21 (2 contrôles en ligne bloqués par le proxy, § 1) |
| `npx expo lint` | indisponible : aucune configuration ESLint dans le dépôt, la commande tente d'en installer une (proxy) |
| EAS (`eas build`), simulateurs, Maestro | non exécutables ici |

Les bundles Hermes prouvent que le code JS compile pour iOS et Android ; ils ne prouvent rien sur le natif (modules,
autorisations, Liquid Glass, flou natif, rendu réel des animations Reanimated sur le fil UI).

## 4. Non-régression (version finale : `ee5a249` fusionné + corrections de l'audit 10)

Export web `--clear` avec le faux Supabase (`EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test`), servi sur un port libre
(18994, puis 18996 pour la correction du biberon) ; chaque script reçoit `NAV_URL` / `E2E_URL` (les ports fixes 8811,
8921, 8971… étaient occupés par d'autres agents, d'où l'usage des variables plutôt que des ports par défaut).

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| Jest `CI=1 npx jest --forceExit --maxWorkers=2 --testTimeout=90000 --testPathIgnorePatterns=/node_modules/` | **156 suites / 1 837 tests verts** (réf. après `ee5a249` : 155 / 1 831 ; + `perfAmbient` 5 tests, + 1 test biberon) |
| SQL `PGPORT_TEST=54410 bash supabase/tests/run-local.sh` | **1 987 réussis / 0 échec** |
| `node scripts/i18n-scan.js` | 0 texte en dur |
| `node scripts/gen-routes.js --check` | 230 routes, à jour |
| `node scripts/homi/privacy-check.mjs` | 11 contrôles OK, « tous au vert » |
| `node scripts/homi/inventory.mjs --check` | à jour (230 routes, 231 fichiers, 155 outils) |
| `e2e/demo_rechargement.py` | 4 / 4 |
| `e2e/etape1_auth.py` | 41 / 41 |
| `e2e/entree_homi.py` | 18 / 18 |
| `e2e/audit_auth.py` | 41 / 41 |
| `e2e/audit_navigation.py` (phases lancées séparément : `routes free`, `tools`, `sweep`) | 230 routes + 230 sans Premium : **0 défaut** ; 143 outils ouverts depuis leur point d'entrée, Retour vers l'onglet : **0 défaut** (`pp_bottle` hors des parcours de démo, comme à l'audit 1) ; balayage : 1 contrôle « sans effet » = avatar « Mon profil » sur `/profile`, attendu (N-08 de l'audit 1) |
| `e2e/missions_scenario_a.py` | 24 / 24 |
| `e2e/courses_stocks_scenarios.py` | 35 / 35 |
| `e2e/home_today.py` | 26 / 26 |
| `e2e/accueil_missions_v3.py` | 37 / 37 |
| `e2e/apparence_v3.py` | 25 / 25 |
| `e2e/humeur_journal_v3.py` | 186 / 186 |
| `e2e/scanner_v3.py` (version adaptée par `ee5a249`) | 43 / 43 |
| `e2e/biberon_v3.py` | 30 / 34 → **34 / 34** après correction (voir ci-dessous) |
| `e2e/cinematique.py` | 13 / 13 |
| `e2e/audit_saisie.py` | 220 vérifications vraies, `tout_vert` |
| `e2e/audit_suivi.py` | 13 / 13, VERT |
| `e2e/audit_foyer.py` | 37 / 37 |
| `e2e/audit_fiabilite.py` | 19 / 19 |
| `e2e/audit_ux.py` (liste « connus » vide) | 22 / 22, aucune erreur |
| `e2e/perf_web.py` (nouveau) | sortie 0, aucune erreur de page dans les 4 variantes |

**Échecs analysés**

- `biberon_v3.py` — **régression réelle, corrigée** : `1_commande_ronde_visible_sans_defiler` rouge (commande ronde de
  595 px de bas sur un écran de 568). Depuis les titres sans coupure de mot (audit 09, `524b3af`), « Biberon de Lina »
  tient sur deux lignes. Le clic Playwright faisait alors défiler la page de 27 px, d'où `2_meme_emplacement` et
  `8_reduit_session` rouges en cascade. Correction `sessionLayout()` (`src/features/bottleSession.tsx`) : sur écran
  court, cadran à 30 % de la hauteur (plancher de 168 px inchangé) et carte resserrée ; grands écrans inchangés.
  Test Jest ajouté (`bottleV3.test.tsx`) ; script vert (34 / 34).
- `biberon_v3.py` `5_historique_lignes_mates` — **instable (heure)** : le passage a eu lieu à 23 h 55 (Paris) ; le
  script avance l'horloge de 12 min 34 s, la journée affichée par l'historique devenait le lendemain (vide). Vert
  au passage suivant. Le script ne fige pas l'heure de départ : à corriger dans le script si on le rejoue près de minuit.
- `audit_navigation.py` — **pas d'échec, mais lent** : la phase `tools` passe ≈ 25 min dans la recherche universelle du
  dernier parcours sans rien afficher (seuls les outils trouvés sont imprimés) ; deux premiers passages ont été coupés par
  mes délais (40 min pour les 4 phases d'affilée) et ressemblaient à un blocage. Rejoué phase par phase, avec un
  navigateur inspectable : aucune page bloquée, sortie 0. Le balayage sort en 1 pour l'avatar de `/profile` (attendu).
- Le conteneur a redémarré pendant la campagne : les scripts déjà verts (export de `ee5a249` fusionné) n'ont été
  rejoués que s'ils touchaient une modification ultérieure (`biberon_v3.py`) ; `audit_navigation.py` a été rejoué en
  entier sur l'export final.

## 5. Fichiers

- `package.json`, `package-lock.json` : § 1.
- `src/components/scene/DesertScene.tsx`, `src/components/Screen.tsx`, `src/components/screenChrome.ts`,
  `src/components/FetusArt.tsx`, `src/features/story/FamilyStoryArt.tsx`, `src/features/story/StoryHomeStrip.tsx` : § 2.
- `src/features/bottleSession.tsx` : § 4.
- Tests : `src/__tests__/perfAmbient.test.tsx`, `src/__tests__/bottleV3.test.tsx`.
- Scripts : `e2e/perf_web.py`, `scripts/homi/matrix-verified.mjs`.

## 6. Matrice outil → résultat

`node scripts/homi/matrix-verified.mjs` assemble `MATRICE_OUTILS.csv` (155 outils) avec `tools_entry.csv` (audit 1,
rapproché par adresse ou clé d'outil), `tools_saisie.csv` (5), `tools_suivi.csv` (6), `tools_foyer.csv` (7, par
adresse), `tools_fiabilite.csv` (8, par parcours), l'inventaire de refonte (`HOMI_SCREEN_INVENTORY.csv`) et le rejeu de
l'audit 10 (`docs/audit/10_e2e.json`). Statut final : « corrigé » si un audit de parcours (5 à 8) a corrigé ; sinon
« validé » si un audit l'a vérifié (profondeur indiquée : parcours ou ouverture seule) ; sinon « bloqué » avec la cause
et le test restant. Les réserves (caméra, sélecteur natif, services réels) restent écrites même quand le parcours web
est validé.

| Total | Validés | dont ouverture seule (audits 1 et 10) | Corrigés | Bloqués | Validés / corrigés avec réserve |
|---|---|---|---|---|---|
| **155** | **106** | 48 | **36** | **13** | 11 |

Bloqués : 12 outils dont la saisie et le résultat n'ont été rejoués par aucun audit de parcours (audit 6 : « hors calcul,
non rejoué » — symptômes du cycle, historique / à éviter / rappels du scanner, temps pour soi, examens, journal,
glaire, rapports, PMA de la fertilité, récupération post-partum, dents) : leur ouverture est validée (audits 1 et 10),
le test restant est la saisie de bout en bout ; 1 outil dépendant d'un service réel (`/outings`, lieux Google : clé et
réseau). Réserves : caméra et sélecteur de fichiers natifs (documents, scanner), assistant en ligne désactivé, envoi
réel des notifications et achats (services réels). Aucun outil sans source.
