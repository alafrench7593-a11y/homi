# Aura 2.0 — rapport du 25/11/2026

## Chiffres (mesurés)
| Mesure | Valeur | Preuve |
|---|---|---|
| Outils du catalogue | 137 | `src/lib/journeys/tools.ts` |
| Outils reliés à Aura (bouton contextuel + fiche) | 137 / 137 | `auraToolContext`, `auraCatalogCoverage.test.ts` |
| Types d'actions Aura reconnues sans IA | 23 | `AURA_INTENT_KINDS` |
| Scénarios Aura testés | 299 (10 suites), 100 % réussis | `npx jest src/__tests__/aura` |
| Suite complète | 4 923 / 4 923 | `npx jest -w 2` |
| Dépendances ajoutées | 0 | `package.json` inchangé depuis le build 15 |

## Problèmes signalés → statut
| Problème | Correction | Statut | Test |
|---|---|---|---|
| Crédits consommés inutilement | Outil proposé d'abord (gratuit) ; IA seulement sur « Demander une réponse détaillée » | Corrigé | aura.test |
| « 1 crédit par question » | Capacité en % (barre), seuils 75/90/100 %, répartition, « Ajouter des crédits » | Corrigé | creditsUsage, credits |
| Barre d'écriture qui cache l'écran | Coût et urgence dans la conversation ; en bas seulement la saisie | Corrigé (à vérifier iPhone) | aura.test |
| « 6 biberons à partir de midi toutes les 2 h » non enregistrés | Série comprise (chiffres ou lettres), jamais dans le futur, sans doublon | Corrigé | auraUnderstanding, auraBottleSeries |
| Plusieurs actions dans une phrase | Biberon + sommeil + couche + tétée → une carte, un « Enregistrer » ; côté de tétée demandé | Ajouté | auraUnderstanding |
| Historique Aura | Sur l'appareil, par compte : recherche, reprise, renommage, suppression ; effacé à la déconnexion | Ajouté | auraHistory |
| Scanner / photo depuis Aura | Bouton + : photo, import photo/PDF, code-barres (parcours existants, lecture confirmée) | Ajouté | — (iPhone) |
| Introductions par profil | Grossesse, bébé, enfant, famille, cycle, post-partum, deux parents ; revisibles | Ajouté | sectionIntro (61) |
| Aura dans chaque outil | Exemples de phrases par outil + minuteur de sieste actif signalé | Ajouté | auraUnderstanding |
| Crédits dans Profil / Moi | Ligne « Utilisation Aura » | Corrigé | — |
| Photo de profil | Existait déjà (Profil, fiche enfant) | Déjà présent | — |
| Sélecteur d'heure dans les saisies | Horloge automatique sur tous les champs heure ; dates DD/MM/YYYY reconnues | Corrigé | inlineClock |
| Retour impossible / écran figé | Balayage retour iOS désactivé hors 1re étape des parcours à étapes (annulation impossible côté natif) | Corrigé (cause probable) | scanner*, iPhone |
| Fond derrière minuteurs et cadres | Halos retirés | Corrigé (à vérifier iPhone) | — |
| « Mon cycle » lent | Blocs lourds affichés après l'animation | Corrigé | — |

## Non fait / limites (honnête)
- Bugs non reproduits sans iPhone : visite guidée, affichage biberon, changement d'écran, clavier Aura → besoin d'une vidéo d'écran.
- Historique local seulement (pas de synchronisation entre appareils) : choix de confidentialité et compatibilité OTA.
- Analyse IA de documents : passe par le parcours « Documents » existant (consentement, confirmation), pas de nouveau modèle.
- Routage des modèles côté serveur, achats de packs réels : inchangés (déjà en place via RevenueCat ; prix fixés dans App Store Connect).
- Bibliothèques citées (LangGraph, Langfuse…) : non ajoutées — aucune n'est nécessaire au code actuel ; 0 dépendance.

## OTA
Aucun changement natif depuis le build 15 (package.json, app.config.ts inchangés) → publiable en OTA sur le canal production, après validation.
