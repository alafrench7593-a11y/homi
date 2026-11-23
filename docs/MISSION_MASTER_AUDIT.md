# Mission Master — audit et avancement (23/11/2026)

Méthode : registre des outils (`src/lib/journeys/tools.ts`) et routes réelles, pas de relecture intégrale.

## Matrice des 12 outils prioritaires
| Outil demandé | Existant (route) | État réel | Action |
|---|---|---|---|
| Routine | `family/kid-routines`, `kid-routine/[id]` | routines en images par moment | **impression ajoutée** ; textes corrigés : papier d’abord, pas d’écran imposé à l’enfant |
| Relais | `family/relay`, `family/nights` | relais, nuits, mot libre, brouillon figé | réutilisé tel quel |
| Transmission | `childcare` (nounou), `kid_card`, `family/relay` | carnet nounou + fiche enfant | réutilisé ; fiche imprimable = Print Studio (checklist) |
| Charge mentale | `family/load`, `domains`, `missions`, `review` | répartition, missions, bilan | réutilisé ; mission confiée par Aura (vérifiée) |
| Émotions | `child/[id]/wellbeing`, `needs` (observations) | journal parent | réutilisé |
| Food Explorer | `child/[id]/discoveries`, `meals/*` | découvertes, repas, courses | réutilisé |
| Santé Express | `health-tracking`, `appointments`, `consult/questions`, `documents` | complet | réutilisé ; Aura prépare les RDV |
| Parent Pause | `family/exhausted`, `offduty`, `me-time`, `sos` | complet | réutilisé |
| Garde Secours | `childcare`, `family/urgent`, `custody`, cercle `family/solo` | fait (23/11) : SMS prérempli depuis Urgence, fiche de garde imprimable (allergies, traitements, contacts, profil sensoriel) | réutilisé, sans nouvelle table |
| Autonomie | `kid_routines`, `kid_steps` | routines | supports imprimables ajoutés |
| École | `child/[id]/school`, `homework` | complet | réutilisé |
| Coparentalité | `family/custody`, `expenses`, `history`, droits par enfant (RLS) | complet, droits corrigés 23/11 | réutilisé |

## Neuro (TDAH / autisme, diagnostic jamais obligatoire)
| Besoin | Existant | Fait cette session |
|---|---|---|
| Espace central | `child/[id]/needs` (TDAH, TSA, dys, sensoriel, observations, traitements) | lien vers le kit imprimable |
| Maintenant / Ensuite | — | **Print Studio** |
| Cartes de communication | — | **Print Studio** (12 essentielles + personnalisées) |
| Histoires sociales | — | **Print Studio** (le parent écrit et relit) |
| Routine en micro-étapes | routines en images | Aura « met 45 min à se préparer » → routine + impression |
| Profil sensoriel structuré, journal de situations structuré | fait (23/11) : `src/lib/neuro/structured.ts`, `features/neuro/NeuroPanels.tsx` ; stocké dans `child_need_entries`, sans migration | fiche imprimable « Ce qui aide mon enfant » |
| Mode parent TDAH (3 priorités) | fait (23/11) : outil `focus_day` → `/family/focus` ; choix gardés sur l’appareil (missions reçues incluses, aucune modification partagée), « Juste 10 minutes », report du reste | 128 outils au catalogue |

## Print Studio (`/print`)
Routine, Maintenant/Ensuite, cartes, histoire sociale, checklist ; A4 ou A5 ; texte échappé ; pictogrammes imprimables ;
téléphone : PDF partagé ; web : impression d’un cadre isolé. **Bug corrigé** : sur le web, `expo-print` imprimait la page
de l’appli au lieu du document (aussi pour l’export « Mes données »). Preuve : `docs/print_studio_fiches.png`.

## Recherche Reddit
**0 témoignage vérifié** : reddit.com refusé par la politique réseau de la session (HTTP 403 du proxy). Aucune source inventée.

## Non fait
Restant : refonte design system et animations, tests natifs (sans build), recherche Reddit (réseau bloqué).
system / motion, tests natifs iOS/Android, recherche Reddit.
