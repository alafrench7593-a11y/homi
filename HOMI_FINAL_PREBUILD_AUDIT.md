# HOMI — Audit final avant build (23/11/2026)

Branche `homi/fondations`. Aucun build, aucune soumission, aucun déploiement lancé pendant cet audit.
Plateformes réellement utilisées : **Chromium (export web de l'app, moteur de démonstration local)**, Jest (Node),
PostgreSQL 16 local (migrations + tests RLS). **Aucun test sur simulateur iOS ni sur iPhone** : il n'y en a pas dans
cet environnement. Rien de ce qui suit ne vaut test natif.

## A. Inventaire

| Élément | Nombre | Source |
|---|---|---|
| Routes (écrans) de l'application | 308 | `src/lib/routes.generated.ts` |
| Écrans parcourus automatiquement (hors admin, outils de développement, routes paramétrées sans donnée) | 253 routes × 2 largeurs (390 et 320 px), texte normal et ×1,3 | `crawl.js` (scratchpad) |
| Outils du catalogue | 128 outils + 9 entrées de compte | `src/lib/journeys/tools.ts` |
| Tests unitaires et d'intégration (Jest) | 4 701 dans 251 suites | `npx jest` |
| Tests base de données (RLS, logique) | 2 794 | `npm run db:test` |

## B. Bugs identifiés et corrigés pendant l'audit

| Bug | Correction | Preuve |
|---|---|---|
| Inscription : besoins limités à **2** (le plus ancien était remplacé) | Limite retirée (`MAX_NEEDS = NEEDS.length`) | `onboardingPersonalize.test.ts` |
| « Où en est ta famille ? » : un seul choix possible | Choix multiples, besoins réunis, profils préremplis après l'inscription | Chromium : 2 étapes cochées → 4 besoins |
| Dates à saisir uniquement au clavier (31 champs JJ/MM/AAAA) | Calendrier déplié sous chaque champ : Aujourd'hui, Hier, mois ±, choix direct de l'année ; saisie clavier conservée ; aucune fenêtre modale | `calendarGrid.test.ts` ; Chromium : Hier → 22/11/2026, 2024 + mois suivant + 15 → 15/12/2024 |
| Sous-titres d'écran d'outil coupés (2 lignes) avec texte agrandi | 3 lignes | crawl : 100 → 25 textes tronqués |
| Bouton « Noter une température ou un symptôme » sur 2 lignes | Libellé court automatique | crawl |
| « Premium » coupé par césure automatique (Aura, web) | Césure désactivée sur ce texte | inspection DOM (hyphens: auto) |
| Liquid Glass absent des cartes de l'Accueil (styles propres) | Bord de verre partagé (reflet, liseré, arête) branché sur 4 composants + `glassEdge` (38 écrans) | captures |
| Thèmes en couleur, icônes d'onglets et robot Aura colorés | Noir, blanc et gris ; seuls Blanc nacré et Noir graphite proposés ; rouge réservé aux urgences | captures, tests de thème |
| Web : paywall remplacé par un écran neutre | Vrai paywall en vitrine (grille indicative, « Disponible sur l'app iPhone », aucun achat, aucune requête boutique) | Chromium |

## C. UX/UI (crawl automatique)

- **Erreurs JavaScript** : 0. **Clés de traduction brutes** : 0. **Écran qui ne charge pas** : 0.
- **Textes qui se chevauchent** : 186 signalements bruts → **0 réel** une fois exclus le contenu qui défile sous la
  barre d'onglets ou un bouton flottant (comportement voulu).
- **Restant (mineur, documenté)** : 25 textes tronqués **uniquement à 130 %** (« Grossesse » dans le sélecteur de
  profil, heures dans l'historique) ; cibles tactiles < 44 px sur les jours du calendrier de cycle et les puces de
  période de la courbe de croissance ; textes « hors écran » de /discover et /cinematic = diapositives suivantes d'un
  carrousel (voulu).
- **Non vérifié** : Dynamic Island, clavier iOS réel, VoiceOver, safe areas d'un vrai iPhone.

## D. Onboarding

- Étape 1 « Où en est ta famille ? » : choix multiples (vérifié Chromium) ; étape « profil » et « priorités » de
  l'onboarding du foyer : choix multiples sans limite (code + tests) ; les réponses restent modifiables
  (« Modifier mes réponses »). Champs à réponse unique (foyer, alimentation) laissés exclusifs, volontairement.
- **Non fait** : refonte de l'introduction « Keynote » en 7 tableaux (l'introduction actuelle avec Aura est conservée).

## E. Paywall

- Grille dans le code : 14,99 €/mois, 69,99 €/6 mois, 119,99 €/an, 3 jours d'essai, Famille 19,99 € (= +5 €).
- **Non vérifié** : configuration réelle App Store Connect et RevenueCat (aucun accès ici) ; achats sandbox, essai,
  restauration, expiration, changement d'offre. Sur iPhone, les prix affichés sont ceux de la boutique (StoreKit) : une
  offre absente n'est pas affichée (logique testée par Jest).

## F. Dates et heures

- Sélecteur d'heure (`TimePicker`) : préréglages (maintenant, −15 min…), saisie HH:MM, « Hier », heures inexistantes /
  doublées au changement d'heure gérées (tests existants). Pas de fenêtre modale, donc pas de double fenêtre.
- Sommeil : 14 h 20 → 15 h 30 = 1 h 10 ; début corrigé 14 h 35 → 14 h 20 repris par la durée, le total du jour, la
  dernière sieste et le relais (`sleepSummary.test.ts`, 11 tests) ; sessions traversant minuit et jours sans saisie
  couverts. Fin corrigée et lecture par Aura vérifiées en Chromium plus tôt dans la session.
- **Non vérifié** : molette native iOS (non utilisée), comportement du clavier numérique iOS réel.

## G. Aura

- Registre central (`tools.ts`) relu par Aura ; bouton Aura contextuel dans l'en-tête de chaque écran d'outil
  (`AuraToolButton`), 19 points d'accès ; intentions locales sans IA (ouvrir un outil, noter sieste / biberon / RDV,
  mission, tétée, supports imprimables) avec confirmation avant toute écriture ; prénoms masqués avant Gemini (en
  production, v10). Tests : `auraActions`, `auraIntents`, `auraPrivacy`, vérification du catalogue entier.
- **Non vérifié ici** : réponses de l'IA en ligne sur un compte réel (coût), suggestions proactives sur appareil.

## H. Synchronisation

- File hors ligne avec `client_id` anti-doublon, mises à jour versionnées (conflits refusés), tests Jest.
- **Non vérifié** : deux téléphones réels connectés au même foyer en temps réel.

## I. Sécurité

- `npm run db:test` : **2 794 réussis, 0 échoué** (RLS : isolation entre foyers, droits santé, aidants, missions,
  suppression).
- Aucune clé d'administration Supabase dans le client (recherche `service_role` / `sb_secret_` : 0).
- Migration de conservation appliquée en production le 23/11 (purge quotidienne vérifiée).
- **Non vérifié** : connexion Apple / Google réelles, réinitialisation du mot de passe par e-mail, suppression de compte
  sur appareil.

## J. Performance

- **Non mesurée** : aucune mesure de FPS, mémoire ou démarrage n'est possible sans appareil. Le flou du verre est
  limité aux barres et feuilles ; les cartes utilisent un dégradé et des bordures (pas de flou par carte).

## K. Tests exécutés

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | OK |
| `npx jest` | 4 701 / 4 701 |
| `npm run db:test` | 2 794 / 0 |
| Crawl Chromium (253 routes × 2 largeurs × 2 tailles de texte) | voir C |
| Parcours Chromium ciblés | inscription multiple, outils verrouillés, paywall web, calendrier, « 3 choses », profil sensoriel, Garde Secours |
| `npx expo lint` | **non lancé** (interdit par la propriétaire) |
| Simulateur iOS / iPhone / sandbox achats | **non disponibles ici** |

## L. État final (principales fonctionnalités)

| Fonctionnalité | État |
|---|---|
| Inscription à choix multiples, besoins sans limite | Terminée et testée (web) |
| Calendrier des champs date | Terminée et testée (web) |
| Outils grisés et déblocables | Terminée et testée (web) |
| Paywall web en vitrine | Terminée et testée (web) |
| Paywall iPhone (achat, essai, restauration) | Développée, **non testée** (sandbox) |
| Liquid Glass noir / blanc | Développée, testée web, **non vérifiée sur iPhone** |
| Profil sensoriel, journal de situations, Garde Secours, « 3 choses » | Terminées et testées (web) |
| Sommeil et corrections | Terminée et testée (calcul + web) |
| RLS / isolation des familles | Terminée et testée (PostgreSQL) |
| Introduction « Keynote » 7 tableaux | **Non réalisée** |
| Mesures de performance | **Non réalisées** (pas d'appareil) |
| Recherche Reddit (Mission Master) | **Non réalisée** (réseau) |

## M. Décision de build

**BUILD BLOQUÉ**

Aucun critère bloquant n'a été **constaté** (aucun crash, aucune erreur JS, aucune fuite de données dans les tests RLS,
aucun sélecteur inutilisable sur le web). Mais plusieurs critères bloquants **ne peuvent pas être vérifiés ici** et le
cahier des charges interdit de les tenir pour validés :

1. Paiement et abonnement : achats sandbox, essai, restauration, statut reconnu — exige un appareil et App Store
   Connect / RevenueCat.
2. Suppression de compte, connexion Apple, déconnexion / réinstallation sur iPhone.
3. Clavier, sélecteurs et Liquid Glass sur iPhone réel (petit écran, Dynamic Island, texte agrandi, VoiceOver).
4. Performance mesurée sur un iPhone ancien.

**Correction nécessaire** : ces quatre points ne peuvent se vérifier qu'avec une version installée sur iPhone. La
seule voie est un **build de test interne** (profil développement / TestFlight interne, sans soumission App Store),
sur **autorisation explicite** de la propriétaire, suivi d'une recette sur appareil des quatre points ci-dessus.
