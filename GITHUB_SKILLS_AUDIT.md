# Audit des skills GitHub — approfondissement (mission V6, 13/11/2026)

Suite de `LACTATION_SKILLS_AUDIT.md`. Agent E « Recherche ».

## 0. Ce qui a été fait, et ce qui n'a pas été fait
- **Lecture des `SKILL.md` réels** : les trois dépôts principaux ont été clonés en lecture seule (`git clone --depth 1`) dans le scratchpad, puis lus fichier par fichier. L'API GitHub est refusée dans cette session (« GitHub access to this repository is not enabled »), `raw.githubusercontent.com` répond. Versions lues :
  - `expo/skills` — commit `acc0b21` du 12/11/2026 — licence MIT ;
  - `software-mansion-labs/skills` — commit `43cde80` du 04/11/2026 — MIT (déclarée dans le README ; pas de fichier LICENSE à la racine) ;
  - `callstackincubator/agent-skills` — commit `59e9d17` du 08/10/2026 — MIT ;
  - `supabase/agent-skills` (02/10/2026, MIT), `RevenueCat/ai-toolkit` et `RevenueCat/rc-claude-code-plugin` (11/11/2026, MIT) — clonés et parcourus.
- **Rien n'a été installé. Aucun script téléchargé n'a été exécuté.** Les scripts ont été lus comme du texte.
- Le clonage de 5 autres dépôts a échoué faute de place disque (volume `/tmp` saturé par d'autres dossiers du scratchpad, pas par cet agent) ; ils ont été vérifiés par leur page GitHub (WebFetch) ou par recherche, comme indiqué dans le tableau 3.

### Contexte du projet utilisé pour juger la pertinence
Expo SDK 57 (`expo ~57.0.30`), React Native 0.86.3, `expo-router ~57.0.28`, `expo-haptics` et `@expo/ui ~57.0.25` **déclarés** (`@expo/ui` utilisé dans `src/widgets/*`). Reanimated 4.7.1, Worklets 0.13.0, Gesture Handler 3.3.0 **présents mais non déclarés** → interdits par les règles V6. Animations : `Animated` + pilote natif (`src/theme/motion.ts`). Tests : Jest (`jest-expo`) + `react-test-renderer` ; **pas** de `@testing-library/react-native`. Pas de FlashList. Ombres via `shadow*`/`elevation` (`src/theme/tokens.ts`).

---

## 1. Skills demandés, un par un

### 1.1 `expo/skills` (plugins/expo/skills/…)

**Remarque transversale** : chaque skill Expo demande de lancer `npx --yes @expo/agent-cli@latest …` (paquet **non épinglé**, téléchargé à chaque appel) et propose une commande `feedback` qui **envoie un message à Expo**. → À ne pas suivre ici : version non figée, envoi de données à un tiers. Les règles de conception, elles, sont réutilisables.

| Skill | Ce qu'il recommande concrètement | Scripts | Prérequis | Pertinence ici |
|---|---|---|---|---|
| **expo-overview** | Routeur : identifier le but, puis charger le bon skill. Détecter la version du SDK avant tout conseil ; lire la doc **de cette version** (`/versions/v57.0.0/…`), pas `latest` ; installer par `expo install` ; une montée de SDK est une tâche à part (`expo-upgrade`). | aucun | aucun | **Moyenne** — utile comme règle « doc versionnée ». |
| **expo-design-system** | Un seul point d'entrée de thème ; **aucune** couleur / taille / espacement en dur hors du thème ; échelle d'espacement multiple de 4 ; composant de texte unique ; contrat de composant (variants, tailles `sm/md/lg`, états *default / pressed / disabled / loading*, rôle et état d'accessibilité) ; « composer plutôt que configurer » ; extraire un composant seulement au besoin. Passe d'autocritique sur capture (hiérarchie, proximité, répétition, alignement). Liste de « native slop » : modale web centrée, tout en cartes, emoji comme icônes, dégradé violet, clignotement du spinner. Audit par `grep` (`references/audit.md`). | aucun | aucun | **Haute** — le projet a déjà `tokens.ts` ; l'audit et la liste de défauts s'appliquent tels quels. |
| **expo-native-ui** | Quatre états par écran de données ; `keyboardShouldPersistTaps="handled"` ; action principale jamais sous le clavier ; **chaque contrôle actif fait vraiment ce qu'il annonce** ; garder le brouillon tant que l'enregistrement n'a pas réussi ; `useWindowDimensions` plutôt que `Dimensions.get` ; zones sûres haut et bas ; `selectable` sur les données importantes et messages d'erreur ; `tabular-nums` pour les compteurs ; ombres `boxShadow` plutôt que `elevation` ; respecter HIG sur iOS et Material 3 sur Android. | aucun | aucun | **Haute** pour la partie « Behavior » ; partie SF Symbols / `Color` API à évaluer. |
| **expo-animation** | Ordre de décision : (1) faut-il animer ? — **rien** pour ce qui arrive 100+ fois par jour (onglets, clavier), < 150 ms pour ce qui arrive des dizaines de fois ; (2) nommer le but ; (3) outil le moins cher ; (4) `transform` + `opacity` seulement ; jamais `scale(0)` ; (5) ressort si un doigt est en jeu, sinon courbe *ease-out* forte `bezier(0.23, 1, 0.32, 1)`, jamais *ease-in* ; durées : appui 100–150 ms, bascule 150–200 ms, feuille ≈ 300 ms, navigation = durée système ; (7) retour à l'appui (`press-in`), `scale 0.97`, cible 44×44 pt avec `hitSlop` ; (8) haptique : une par action, même image que le visuel, jamais seule ; (9) « réduire les animations » = moins et plus doux, pas zéro ; ne jamais animer vers une hauteur codée en dur (texte agrandi). | aucun (fichier `RECIPES.md` : 11 recettes en Reanimated) | **Reanimated 4 + Worklets + Gesture Handler**, New Architecture | **Moyenne** — règle n° 2 « Reanimated, pas `Animated` » **incompatible** avec la règle V6 ; tout le reste (porte d'entrée, durées, courbes, haptique, accessibilité) s'applique avec `Animated`. |
| **expo-router** | Noms de fichiers en kebab-case ; ne rien mettre d'autre que des routes dans `app/` ; toujours une route `/` ; en SDK 56+, importer `expo-router/react-navigation` au lieu de `@react-navigation/*` ; `Link.Preview` / menus contextuels ; `presentation: 'formSheet'` pour les feuilles. | aucun | SDK 56+ pour certaines options | **Moyenne** — le projet n'importe pas `@react-navigation/*` directement (vérifié par `grep`). |
| **expo-ui** | Utiliser `@expo/ui` (SwiftUI / Jetpack Compose) par défaut pour feuilles, sélecteurs, curseurs, interrupteurs, menus ; `Host` obligatoire ; ne jamais importer `swift-ui` sur Android ni l'inverse ; `List` d'`@expo/ui` n'est **pas** une liste virtualisée. | `scripts/list-components.js` : lit `node_modules/@expo/ui` **localement** et liste composants et modificateurs ; pas de réseau, pas d'écriture | `@expo/ui`, SDK 56+ pour la couche universelle | **Faible à moyenne** — `@expo/ui` est là, mais remplacer les composants maison (`ui.tsx`) casserait l'unité visuelle ; à réserver à un cas précis (sélecteur de date ?). |
| **expo-data-fetching** | Quatre états ; **chargement ≠ vide** ; une actualisation garde le contenu en cache ; attendre l'hydratation avant de rediriger ; mutation : bloquer la double soumission, garder le brouillon en cas d'échec ; vérifier `response.ok` ; jetons dans `SecureStore` ; aucun secret dans `EXPO_PUBLIC_*`. | aucun | aucun | **Haute** — recoupe `States.tsx`, `offline.ts` et la règle « aucun secret ». |
| **expo-dev-client** | Construire un client de développement (EAS ou local, Xcode / Android Studio) ; TestFlight interne. | aucun | compte EAS, macOS pour iOS | **Faible ici** — aucun appareil ni simulateur dans cette session. |
| **eas-simulator** | Simulateurs distants pilotés par `agent-device` ; sessions à durée maximale ; toujours arrêter la session. **« EAS service — costs apply » ; réservé aux offres EAS payantes.** | aucun (commandes `npx eas-cli@latest`) | offre EAS payante | **Écarté** — service payant, interdit par les règles du propriétaire. |

### 1.2 `software-mansion-labs/skills`

| Skill | Recommandations | Scripts | Prérequis | Pertinence |
|---|---|---|---|---|
| **react-native-best-practices** | Routeur vers 9 sous-skills (animations, gestes, SVG, IA embarquée, texte riche, multithread, Bundle Mode, audio, JSI). Animations : **lire la version installée de Reanimated** avant d'écrire ; `runOnJS` interdit (remplacé par `scheduleOnRN`) ; animer des propriétés hors mise en page ; profiler en build *release* ; `useReducedMotion` ne lit le réglage **qu'au démarrage** ; tableau du comportement de chaque animation quand le mouvement est réduit. | aucun | Reanimated 4.x | **Faible pour le code** (tout suppose Reanimated) ; **sous-skill SVG** potentiellement utile (`react-native-svg` est disponible). |
| **pulsar-haptics** | Haptique avec le SDK Pulsar de Software Mansion ; dit lui-même **ne pas s'appliquer** à `expo-haptics`. | aucun | paquet `react-native-pulsar` | **Écarté** — nouvelle dépendance. |
| **radon-mcp** | Bonnes pratiques des 8 outils MCP de Radon IDE (`view_application_logs` d'abord, `view_screenshot`, `view_component_tree`, journaux réseau, `reload_application`, doc). | aucun | Radon IDE avec **licence active** (Radon AI = offre PRO, 25 $/mois ou 252 $/an d'après radon.swmansion.com/pricing), VS Code ≥ 1.99 ou Cursor, simulateur | **Écarté ici** — payant et sans simulateur. |

### 1.3 `callstackincubator/agent-skills`

| Skill | Recommandations | Scripts | Prérequis | Pertinence |
|---|---|---|---|---|
| **react-native-best-practices** | Cycle **mesurer → corriger → re-mesurer → valider** ; ne pas proposer `useMemo`/`useCallback` sans preuve de profilage ; ne pas signaler de « closure périmée » sans reproduction ; longues listes en `FlatList` (`keyExtractor`, `getItemLayout` si hauteur fixe) puis FlashList ; `TextInput` non contrôlé si la saisie rame ; éviter les imports « barrel » ; mesurer le TTI à froid. Notes de sécurité : épingler les versions, ne jamais `curl | sh`. | aucun | `agent-device` pour le profilage (sinon React DevTools à la main) | **Haute** pour les règles de revue (listes, preuves avant optimisation). |
| **react-navigation** | Ne vaut que pour React Navigation 7 utilisé directement (API statique / dynamique). | aucun | React Navigation 7 | **Faible** — le projet passe par Expo Router. |
| **react-native-testing** | (copie du skill officiel de `callstack/react-native-testing-library`) Priorité des requêtes `getByRole` > `getByLabelText` > … > `getByTestId` ; `findBy*` plutôt que `waitFor` + `getBy*` ; aucun effet de bord dans `waitFor` ; `userEvent` plutôt que `fireEvent` ; pas d'`act()` ni de `cleanup()` manuels ; préférer les props ARIA (`role`, `aria-label`). | aucun | `@testing-library/react-native` v13/v14 | **Conditionnelle** — la bibliothèque n'est pas installée et `package.json` est gelé pour cette mission. |
| **github-actions** | Actions composites pour produire des builds simulateur iOS / émulateur Android en CI, téléversement `actions/upload-artifact@v4`, récupération par `gh`. | aucun | dépôt GitHub distant | **Écarté pour l'instant** — pas de dépôt distant (un `.github/workflows/ci.yml` existe déjà). |
| **agent-device** | Pilotage d'appareils : lecture seule d'abord (`snapshot`), refs plutôt que coordonnées, re-capturer après chaque action, ne pas chercher sur le web. | les scripts du dossier `plugins/vendored/scripts/*.sh` servent à **maintenir le dépôt** (copie de skills), pas l'utilisateur | simulateur / appareil | **Écarté ici** — aucun appareil. |

---

## 2. Scripts exécutables trouvés (lus, non exécutés)

| Dépôt | Fichier | Ce qu'il fait | Risque |
|---|---|---|---|
| expo/skills | `plugins/expo/skills/expo-ui/scripts/list-components.js` | Lit `node_modules/@expo/ui` du projet passé en argument et affiche la liste des composants | Faible (lecture locale) |
| expo/skills | `plugins/expo/skills/eas-workflows/scripts/fetch.js` | Télécharge une URL passée en argument, met la réponse en cache 15 min dans le dossier du skill | Moyen (réseau vers une URL arbitraire) |
| expo/skills | `scripts/*`, `.claude/skills/expo-skill-eval/scripts/*.sh` | CI et évaluation **internes au dépôt** Expo (captures iOS/Android/web, fabrication de projets de test) | Hors usage |
| expo/skills (tous les skills) | commandes `npx --yes @expo/agent-cli@latest …` | Télécharge et exécute la dernière version d'un CLI à chaque appel ; `feedback` envoie un texte à Expo | **Élevé** : version non figée + envoi de données |
| callstackincubator | `plugins/vendored/scripts/*.sh` | Synchronisation des skills copiés depuis d'autres dépôts | Hors usage |
| supabase/agent-skills | `scripts/build-release.ts`, `test/sanity.test.ts` | Construction et tests du dépôt lui-même | Hors usage |
| RevenueCat | `scripts/sync-play-billing.mjs` | Synchronisation interne | Hors usage |

---

## 3. Autres dépôts examinés

| Dépôt | Existence vérifiée | Auteur | Licence | Maintenance | Contenu utile | Risques | Décision |
|---|---|---|---|---|---|---|---|
| `supabase/agent-skills` → **supabase-postgres-best-practices** | oui (clone) | Supabase (officiel) | MIT | commit 02/10/2026, v1.1.1 | RLS activée partout ; `(select auth.uid())` dans les politiques (évalué une fois, pas à chaque ligne) ; fonctions `security definer` dans un schéma privé avec `search_path = ''` et `revoke execute … from public, anon, authenticated` ; index sur les colonnes des politiques | Aucun script à exécuter | **Retenu (lecture)** — directement applicable aux migrations du projet |
| `RevenueCat/ai-toolkit` (25+ skills : entitlements-gate, paywall, troubleshoot, testing-setup…) | oui (clone) | RevenueCat (officiel) | MIT | 11/11/2026 | Vérifier un droit (`customerInfo.entitlements.active`), réagir aux changements | Plusieurs skills supposent le **MCP RevenueCat ou le CLI `rc`** (compte requis) | **Lecture ciblée** de `revenuecat-entitlements-gate` et `revenuecat-troubleshoot` seulement |
| `RevenueCat/rc-claude-code-plugin` | oui (clone) | RevenueCat | MIT | 11/11/2026 | Même famille (purchase-flow, migrate) | Idem | Doublon de l'ai-toolkit |
| `vercel-labs/agent-skills` → **react-native-guidelines** | oui (page GitHub, WebFetch) | Vercel (officiel) | MIT | 33,6 k étoiles | 16 règles : FlashList, mise en page, clavier, Reanimated, `expo-image`, Zustand | Pas de `react-native-skills` sous ce nom : le skill s'appelle `react-native-guidelines` | **Non retenu** — recouvre Callstack et Expo, oriente vers des dépendances absentes |
| `ucdavis/ai-skills-registry` → **accessibility-react-native** | oui (page GitHub) | UC Davis | MIT | 9 étoiles, 58 commits, date du dernier commit non affichée | Accessibilité RN / Expo | Petite audience, contenu non lu | **À lire avant toute adoption** (non lu ici) |
| Maestro (`mobile-dev-inc/maestro`, MCP intégré au CLI : `maestro mcp`) | oui (maestro.dev/mcp) | mobile.dev (Maestro) | « open source » ; licence non affichée sur la page consultée | — | Écrire et rejouer des parcours YAML depuis un agent | **Java 17 + émulateur/simulateur requis** | Non applicable dans cette session |
| `tovimx/maestro-mobile-testing-skill` | seulement via annuaires (skills.cat, jsDelivr) | particulier | non vérifiée | — | — | Auteur non identifié | **Écarté** |
| Localisation (i18n) | — | — | — | — | Uniquement des skills communautaires (annuaires tessl, playbooks, skills.sh…), aucun officiel trouvé | Auteurs inconnus | **Écarté** — le projet a déjà `scripts/i18n-scan.js` et le typage `Messages<typeof fr>` |
| Régression visuelle | — | — | — | — | Idem : skills communautaires seulement | Idem | **Écarté** — s'appuyer sur la doc officielle Playwright ; noter que `toHaveScreenshot` est une API de **Playwright Test (JS)**, absente de Playwright Python utilisé dans `e2e/` |
| Lottie / Rive / Skia | — | — | — | — | Aucun skill officiel trouvé ; seulement des skills communautaires | Nouvelles dépendances | **Écarté** |

---

## 4. Sélection recommandée (courte)

À utiliser **comme documents de référence** (copie locale lue par l'agent, sans installation par `npx skills add`, sans exécuter de script) :

1. **expo-design-system** — `SKILL.md` + `references/audit.md` + `references/native-slop.md` : audit de dérive du thème.
2. **expo-native-ui** (section *Behavior*) + **expo-data-fetching** (section *Every Screen Has Four States*) : états, formulaires, clavier.
3. **expo-animation** — uniquement les étapes 1, 2, 4, 5, 7, 8, 9 (transposées à `Animated`) ; **ignorer** la règle « Reanimated, pas Animated » et `RECIPES.md`.
4. **callstackincubator/react-native-best-practices** — règles de revue et `references/js-lists-flatlist-flashlist.md`.
5. **supabase-postgres-best-practices** — `references/security-rls-basics.md`, `security-rls-performance.md`, `security-privileges.md`.

Plus tard, si le propriétaire l'autorise : `react-native-testing` (après ajout de `@testing-library/react-native`), skills RevenueCat ciblés. Écartés : eas-simulator, radon-mcp (payants), pulsar-haptics (dépendance), agent-device / expo-dev-client (pas d'appareil), react-navigation (non utilisé), github-actions (pas de dépôt distant).

Si l'installation est un jour décidée : épingler une version (`npx skills@<version> add … --skill <nom>`), relire le dossier `scripts/` du skill, **ne pas** suivre les commandes `@expo/agent-cli@latest` ni `feedback`.

---

## 5. Règles extraites, applicables à CE code (pour le coordinateur)

Chaque règle cite sa source. Toutes sont compatibles avec `Animated` + pilote natif et avec le gel de `package.json`.

| # | Règle | Source | Constat rapide dans le code |
|---|---|---|---|
| R1 | **Ne pas animer** ce qui arrive des centaines de fois par jour (changement d'onglet, ouverture du clavier, bascules de réglages) ; jamais de glissement entre onglets. Ce qui arrive des dizaines de fois : < 150 ms ou rien. | expo-animation §1 | à vérifier sur la barre d'onglets |
| R2 | Animer **seulement `transform` et `opacity`** (exception : élément absolu sans enfant, ex. remplissage de barre de progression). | expo-animation §4 ; SWM animations-performance | déjà la règle V6 |
| R3 | **Jamais `scale(0)`** à l'entrée : partir de 0,95–0,97 avec opacité 0. | expo-animation §4 | — |
| R4 | Retour visuel **à l'appui** (`onPressIn`), 100–150 ms, échelle ≈ 0,97 ; les lignes pleine largeur changent de fond au lieu de rétrécir. | expo-animation §7 | `Tappable` à vérifier |
| R5 | **Jamais de courbe *ease-in*** sur l'interface ; entrée/sortie en *ease-out* fort `Easing.bezier(0.23, 1, 0.32, 1)` (disponible dans `Animated`). Navigation : durée système, ne pas la redéfinir. | expo-animation §5 | comparer avec `motion.ts` |
| R6 | Durées : appui 100–150 ms, petite bascule 150–200 ms, feuille / modale ≈ 300 ms ; rester sous 300 ms hors navigation. | expo-animation §5 | idem |
| R7 | « Réduire les animations » = **moins et plus doux, pas zéro** : garder fondus et changements de couleur qui expliquent un état, supprimer translation, échelle, rebond. | expo-animation §9 | `useReduceMotion()` existe |
| R8 | Ne jamais animer vers une **hauteur codée en dur** : le texte s'agrandit (`allowFontScaling`) ; mesurer avec `onLayout` ou animer un `transform`. | expo-animation §9 ; expo-design-system (Dynamic Type) | à vérifier sur les accordéons |
| R9 | Haptique : **une par action**, au même moment que le visuel, jamais sur un défilement ou une entrée non provoquée, **jamais seule** (souvent désactivée). | expo-animation §8 | `haptic()` dans `ui.tsx` |
| R10 | Cible tactile **≥ 44×44 pt (48 dp)** ; si le visuel est plus petit, ajouter `hitSlop` plutôt que l'agrandir ; `pressRetentionOffset` pour qu'un doigt qui glisse n'annule pas l'appui. | expo-animation §7 | `controlSize` dans `tokens.ts` |
| R11 | Tout écran de données a **quatre états** (chargement, erreur, vide, contenu) ; **ne jamais afficher « vide » pendant le premier chargement** ; une actualisation qui échoue garde le contenu affiché avec une erreur non bloquante. | expo-data-fetching ; expo-native-ui | `States.tsx` |
| R12 | Enregistrement : bloquer la double soumission pendant l'envoi ; en cas d'échec **garder le brouillon**, erreur sur place, bouton réessayer ; ne fermer le formulaire qu'après succès. | expo-data-fetching ; expo-native-ui | `Button` gère chargement/erreur ; `insertOrQueue` |
| R13 | **Chaque contrôle actif fait ce qu'il annonce** ; pas de gestionnaire vide ni de fausse alerte « succès ». | expo-native-ui (Behavior) | = règle « aucun faux bouton » |
| R14 | Formulaires défilants : `keyboardShouldPersistTaps="handled"` ; l'action principale ne doit jamais être cachée sous le clavier. | expo-native-ui | 36 occurrences de `keyboardShouldPersistTaps` dans `src` |
| R15 | Longues listes : liste virtualisée (`FlatList` / `VirtualList`), pas `ScrollView` + `map` ; `keyExtractor` stable ; `getItemLayout` si hauteur fixe ; **pas d'animation d'entrée par ligne** dans une liste virtualisée (animer le conteneur). | Callstack js-lists ; expo-animation (Never Ship) | 28 écrans `src/app` utilisent `ScrollView` : vérifier ceux qui listent des données |
| R16 | Pas de `useMemo` / `useCallback` / « closure périmée » ajoutés ou signalés **sans preuve** (profilage, reproduction). Mesurer → corriger → re-mesurer. | Callstack (Review Guardrails) | — |
| R17 | Le ressenti d'une animation ne se juge **qu'en build release sur l'appareil le plus lent** ; sinon l'écrire « non vérifié ». | expo-animation ; SWM performance | cohérent avec la règle V6 sur les tests |
| R18 | Données importantes et messages d'erreur : `<Text selectable>` ; compteurs et minuteurs : `fontVariant: ['tabular-nums']` (pour que les chiffres ne « dansent » pas). | expo-native-ui (Text Styling) | 7 `selectable`, 2 `tabular-nums` seulement |
| R19 | Accessibilité testable : chaque élément pressable porte un rôle et un nom accessibles (`accessibilityRole` + `accessibilityLabel`, ou `role` + `aria-label`) et son état (`disabled`, `busy`) — c'est ce qui rend possibles les requêtes `getByRole({ name })`. | expo-design-system (component contract) ; react-native-testing | 427 `accessibilityRole`, 461 `accessibilityLabel` |
| R20 | Migrations Supabase : RLS activée sur toute table ; dans les politiques écrire **`(select auth.uid())`** ; fonctions `security definer` dans un schéma privé, `set search_path = ''`, `revoke execute` pour `public, anon, authenticated` ; index sur les colonnes filtrées par les politiques. | supabase-postgres-best-practices (security-rls-*) | à contrôler sur les nouvelles migrations V6 |
| R21 | Aucun secret dans une variable `EXPO_PUBLIC_*` ; jetons dans `SecureStore`, pas dans `AsyncStorage`. | expo-data-fetching | audit du 29/10 : « seule la clé publique anon » |

Règles **non transposables** ici (notées pour mémoire) : utiliser Reanimated / `scheduleOnRN` / Gesture Handler ; ombres en `boxShadow` au lieu d'`elevation` (le thème actuel utilise `shadow*`/`elevation` : changer serait un chantier de design system, non demandé) ; `@expo/ui` par défaut pour tous les contrôles ; icônes SF Symbols.
