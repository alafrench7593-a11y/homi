# Aura — état d’implémentation

Mise à jour : 23/11/2026. Conception et règles : `docs/HOMI_AURA.md` ; crédits : `docs/CREDITS_IA.md`.

## Architecture réelle
```
message → matchIntent (local, sans IA, FR/EN, fautes, familier)
        ├─ intention reconnue → resolveIntent (données + droits ACTUELS) → carte (ouvrir / confirmer / répondre)
        │                         └─ « Enregistrer » → useAddLog (même chemin que les écrans) → RLS → cache invalidé
        ├─ mode local (assistant/local) : recherche d’outils et réponses rédigées, sans IA
        └─ sinon → fonction `assistant` (Gemini flash-lite, 12 messages d’historique max, 1 400 jetons de sortie max,
                   crédits, consentement) — **éteinte en production : aucune clé Gemini configurée**
```
Fichiers : `src/lib/aura/intents.ts` (logique pure), `src/features/aura/IntentCard.tsx` (cartes),
`src/features/aura/AuraScreen.tsx` (écran), `src/lib/aura/nextStep.ts` (prochaine étape), `supabase/functions/assistant`.

## Terminé (testé)
| Action | Niveau | Test |
|---|---|---|
| Retrouver chacun des 127 outils par son nom, FR et EN | 0 (sans IA) | `auraCatalogCoverage` |
| Ouvrir un outil du quotidien (sein, biberon, couche, sommeil) pour le bon enfant | 0 | `auraIntents` + Chromium |
| Corriger la fin d’une sieste (« j’ai mis 14 h 35, réveil 14 h 20 ») | 0 | idem |
| Préparer un relais, ajouter une mesure (curseur posé), changer d’enfant, outils de grossesse | 0 | idem |
| **Enregistrer une sieste/nuit** « endormi à 14 h 20, réveillé à 15 h 45 » : durée, minuit, futur, chevauchement | 0 + confirmation | `auraActions` + Chromium |
| **Enregistrer un biberon** « il vient de boire 150 ml » : doublon < 10 min refusé | 0 + confirmation | idem |
| **Lire le sommeil du jour** (« combien a-t-il dormi ? ») depuis les saisies réelles ; « aucun noté » sinon | 0 | idem |
| Explications (« comment utiliser… ») → réponse, pas de bouton | 0 / 2 | `auraIntents` |
| Droits relus à l’affichage ET à l’appui ; lecture seule = aucune écriture proposée | — | `auraActions`, `auraIntents` |

Chromium (démo, 23/11) : double appui = 1 ligne ; saisie visible dans Sommeil et Biberon ; la lecture d’Aura passe de
11 h 30 à 12 h 15 après l’ajout (synchronisation dans les deux sens) ; 0 erreur.

## À développer (par priorité)
1. Rendez-vous (« pédiatre mardi 10 h ») : réutiliser `parseFrDateTime` / `lenientFrDate` (agenda) + confirmation.
2. Tâche ou mission pour un membre (« rappelle à mon conjoint… ») : `useCreateMission` + choix du membre autorisé.
3. Allaitement « à gauche » : démarrer la séance avec le côté (paramètre `side` sur `/track/breastfeed`).
4. Lectures sans IA : médicament donné ce matin (`useLogDose`), biberons du jour, dernière couche.
5. Masquer les prénoms avant envoi au modèle ; mesurer en prod la part traitée sans IA (événement `aura_local_hit`).
6. Guidage dans l’interface : réutiliser la visite guidée (`features/tour`, ancres) pour « montre-moi où… ».

## Coût IA en production (estimation, hypothèses explicites)
[Supposition] prix Gemini flash-lite ≈ 0,10 $/M jetons d’entrée, 0,40 $/M de sortie (à vérifier sur la grille Google
au moment de la mise en service) ; requête en ligne ≈ 2 500 jetons d’entrée + 350 de sortie ≈ **0,0004 $** ;
utilisateur actif : 3 messages/jour, 60 % traités sans IA → 1,2 appel/jour ≈ 36/mois ≈ **0,014 $/mois**.

| Utilisateurs actifs | Appels IA / mois | Coût / mois |
|---|---|---|
| 100 | 3 600 | ≈ 1,5 $ |
| 1 000 | 36 000 | ≈ 15 $ |
| 10 000 | 360 000 | ≈ 140 $ |
| 100 000 | 3,6 M | ≈ 1 400 $ |

×5 environ si un modèle « flash » remplace « flash-lite ». La part sans IA (60 %) n’est **pas mesurée** : à instrumenter.
