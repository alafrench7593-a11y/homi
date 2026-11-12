# Au fil de nous — mission « Premium Mobile Experience » : audit et première tranche

Branche : `premium-experience` (créée le 12/11/2026 depuis `master`, rien de poussé, rien de déployé).
Règle suivie : un point non exécuté est écrit « non vérifié », jamais « réussi ».

## 1. Outils réellement disponibles

| Outil demandé | État constaté | Conséquence |
|---|---|---|
| GitHub MCP / GitHub CLI | Absent. Le dépôt local n'a aucun dépôt distant ; le jeton `gh` de l'environnement est refusé | Audit fait avec Git local. Pull requests, issues et historiques GitHub Actions : **non vérifiables** |
| Context7, Supabase MCP, Sentry MCP | Absents | Schéma et politiques d'accès relus dans `supabase/migrations` et testés par `supabase/tests` ; crashs Sentry **non consultés** |
| Playwright | Présent | Tests réels de l'application exportée pour le web (pas un test natif iOS/Android) |
| iPhone / Android réels, simulateurs | Absents | Clavier natif, encoche, haptique, 60 images/s, Dynamic Type natif : **non vérifiés** |

## 2. Inventaire (étape A)

- 217 routes (`src/lib/routes.generated.ts`), 1 240 fichiers TypeScript, 128 suites de tests (1 435 tests).
- Expo SDK 57, React Native 0.86, Expo Router, Supabase, RevenueCat, EAS. 5 langues (fr source, en, es, de, it).
- Design system déjà en place : `src/theme/tokens.ts` (couleurs par thème, espacements, rayons, polices), `src/theme/motion.ts` (durées, courbes, ressorts, retours succès/erreur, « réduire les animations »), `Tappable` (pression 0,98 + ressort), `Button` (chargement, désactivé, succès, erreur), `Appear`, `StaggerItem`, `MotionKit`.
- Introduction : cinématique (`/cinematic`, une seule fois, rejouable, repli en cas d'erreur) puis diapositives (`/intro`, « Passer » toujours visible).

## 3. Base de référence avant modification (exécutée)

| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `node scripts/i18n-scan.js` | 0 texte en dur |
| Jest (127 suites, 1 429 tests) | 127 réussies |
| Robot de cadrage du 11/11 (213 écrans × 320/375/430 fr, 320 de, 320 it) | 0 débordement, 0 photo déformée, 0 texte coupé |

## 4. Écarts par rapport au cahier des charges (étape B)

| Priorité | Écart | État |
|---|---|---|
| P1 | Pas de vrai journal intime : `/journal` est un relevé d'évènements de l'enfant ; le texte personnel n'existait qu'en champ secondaire du bilan d'humeur, sans relecture ni modification | **Corrigé** (voir 5) |
| P2 | Hiérarchie typographique incomplète (6 tailles, pas de rôles Label / Button / Heading L / Body L, familles décidées dans le composant) | **Corrigé** : jetons `typography` |
| P2 | Pas de jetons d'élévation ni de tailles de contrôle | **Corrigé** : jetons `elevation`, `controlSize` (pas encore appliqués aux 34 ombres existantes) |
| P2 | Aucune intégration continue (pas de dossier `.github`) | **Corrigé** : `.github/workflows/ci.yml` (jamais exécuté : pas de dépôt distant) |
| P3 | La phrase d'ouverture « Chaque histoire mérite d'être précieusement gardée. » absente de l'introduction | **Corrigé** (5 langues) |
| P3 | 751 couleurs hexadécimales et 63 tailles de police écrites en dur dans les écrans | **À faire**, par lots, avec contrôle visuel avant/après |
| P3 | Introduction : 11 diapositives au lieu des 7 demandées ; pas de diapositive « Le journal » | **À faire** (décision produit : raccourcir = retirer du contenu existant) |
| P3 | Photos dans une page du journal | **À faire** : demande une colonne et un espace de stockage privés (migration à valider) |
| P4 | Transitions à éléments partagés, graphiques animés au changement de période | **À faire** |
| P4 | Reanimated / Skia / Rive / Lottie | **Non installés, volontairement** : le système actuel (Animated + pilote natif, transform et opacité seulement) couvre les besoins ; ajouter Reanimated impose une nouvelle build native et des tests sur appareil que je ne peux pas faire ici |
| — | Tests natifs de bout en bout (Maestro), paiement sandbox, restauration d'achat, suppression de compte sur appareil | **Non vérifiés** (aucun appareil) |
| — | Performance (démarrage, mémoire, images/s) | **Non mesurée** |

## 5. Ce qui a été construit dans cette tranche

### Mon journal intime (`/me/diary`)
- Pages datées, humeur du jour, chronologie par mois, voix éditoriale (Instrument Serif italique) pour les dates.
- Écrire, relire (page qui se déplie), modifier, supprimer (avec confirmation).
- Aucune migration : les pages sont les bilans d'humeur qui portent un texte (`mood_checkins.journal`), donc **privées par construction** (politique « propriétaire uniquement », déjà testée dans `supabase/tests`), incluses dans l'export et la suppression de compte existants.
- Protections : double appui = une seule page ; brouillon conservé si l'on quitte l'écran ; erreurs claires (page vide, humeur manquante, plus de 6 000 caractères).
- Prudence santé : aucun score, aucun diagnostic ; une humeur « très difficile » affiche le message d'aide existant et le bouton vers les numéros d'aide.
- Accès : « Moi » › « Mon journal intime ».

### Tests exécutés sur le journal (Playwright, application web exportée, mode démo)
| Vérification | 320×568 fr | 430×932 fr | 320×568 de |
|---|---|---|---|
| Débordement, texte coupé, clé de traduction brute, écran d'erreur (introduction, « Moi », journal) | 0 | 0 | 0 |
| Page vide refusée, humeur manquante refusée | oui | oui | non rejoué |
| Brouillon conservé après aller-retour | oui | oui | non rejoué |
| Double appui sur « Garder cette page » → 1 seule page | oui | oui | non rejoué |
| Modification chargée, enregistrée, sans doublon | oui | oui | non rejoué |
| Humeur « très difficile » → aide proposée | oui | oui | non rejoué |
| Pages toujours là après rechargement | oui | oui | non rejoué |
| Suppression avec confirmation | oui | oui | non rejoué |
| Erreurs JavaScript | 0 | 0 | 0 |

Après modification : `tsc` 0 erreur, 0 texte en dur, routes à jour (217), Jest **128 suites / 1 435 tests réussis**.

**Non vérifié** : le journal sur iPhone réel (clavier qui recouvre le champ, haptique), contre le serveur Supabase réel (testé en mode démo uniquement), en espagnol et en italien à l'écran (les traductions existent et sont typées), en taille de texte agrandie.

## 6. Fichiers modifiés
`src/theme/tokens.ts`, `src/lib/domain/diary.ts` (nouveau), `src/app/me/diary.tsx` (nouveau), `src/app/me/index.tsx`, `src/app/intro.tsx`, `src/i18n/{fr,en,es,de,it}/diary.ts` (nouveaux), `src/i18n/*/index.ts`, `src/i18n/*/intro.ts`, `src/lib/routes.generated.ts`, `src/__tests__/diary.test.ts` (nouveau), `.github/workflows/ci.yml` (nouveau).

## 7. Suite proposée (dans l'ordre)
1. Appliquer les jetons `typography` / `elevation` dans les composants de base, puis résorber les couleurs en dur par lots (robot de cadrage avant/après).
2. Journal : photos (migration à valider), entrée depuis l'accueil de chaque parcours, souvenirs des enfants dans la même chronologie.
3. Accueil par parcours : audit bloc par bloc (cycle, grossesse, maternité) et hiérarchie.
4. Introduction : resserrer à 7 écrans avec une diapositive « Le journal » (à valider, car cela retire des diapositives existantes).
5. Inventaire complet des boutons avec test associé ; tests Maestro sur appareil ; mesures de performance.
