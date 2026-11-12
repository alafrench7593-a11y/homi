# Audit des skills GitHub — module Allaitement (13/11/2026)

Lecture faite des pages publiques des dépôts (README). **Aucun skill installé** à ce stade, **aucun script exécuté**.
Les fichiers `SKILL.md` individuels n'ont pas encore été lus un par un : c'est l'étape suivante avant toute installation.

| Dépôt | Auteur | Licence | Popularité | Skills pertinents | Décision |
|---|---|---|---|---|---|
| expo/skills | Expo (officiel) | MIT | 3,2 k étoiles | expo-overview, expo-native-ui, expo-animation, expo-router, expo-design-system, expo-ui, expo-data-fetching | **Retenu** (lecture des SKILL.md à faire). `expo-animation` suppose Reanimated + Gesture Handler |
| software-mansion-labs/skills | Software Mansion (auteurs de Reanimated) | MIT | 296 étoiles | react-native-best-practices (animations, gestes, worklets), pulsar-haptics | **Retenu en lecture** ; pulsar-haptics écarté (SDK supplémentaire) |
| callstackincubator/agent-skills | Callstack | MIT | 1,7 k étoiles | react-native-best-practices (performance), react-native-testing, github-actions, agent-device | **Retenu en lecture** ; agent-device demande un appareil ou simulateur (indisponible ici) |
| gigs-slc/react-native-skills | particulier inconnu | MIT | 3 étoiles | recopie de skills Expo / Callstack / Vercel | **Écarté** : auteur non identifié, doublon des sources officielles |
| gorhom/react-native-bottom-sheet | Gorhom | MIT | reconnu | panneaux inférieurs | **Non ajouté** : demande Reanimated + Gesture Handler ; le projet a déjà des feuilles et modales (`Overlays`) |

## Constat technique décisif
- `react-native-reanimated` et `react-native-gesture-handler` **ne sont pas** des dépendances du projet (toutes les animations utilisent `Animated` + pilote natif). Les skills d'animation Expo et Software Mansion supposent ces deux bibliothèques.
- Les ajouter impose une **nouvelle build native** et des tests sur appareil : décision à valider avant d'installer (règle « pas de dépendance sans justification »).

## Installation
Non effectuée. Méthode prévue après validation : `npx skills@latest add expo/skills --skill expo-animation` (etc.), après lecture du SKILL.md et du dossier `scripts` de chaque skill.
