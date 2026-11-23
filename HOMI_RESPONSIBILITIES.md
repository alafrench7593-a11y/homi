# HOMI — Responsabilités par domaine

Établi le 14/11/2026. Réutilise `family_domains` (« Confier un domaine », 20261107000300) — aucune nouvelle table.

## Principe

Un domaine peut être **porté** par une personne. Ses missions lui arrivent directement : la personne qui demande n'a pas à choisir ni à organiser le travail de l'autre. Un domaine sans responsable garde ses missions « à prendre » : tout membre qui a accès à l'organisation est prévenu, le premier qui accepte devient responsable de cette mission.

## Les 8 responsabilités HOMI

| Responsabilité | Clé `family_domains` | Catégories de mission rattachées |
|---|---|---|
| Courses | `shopping` | shopping |
| Repas | `meals` | feeding |
| Bébé | `baby` (nouvelle) | diapers |
| Crèche et garde | `childcare` (nouvelle) | childcare, packing |
| Animaux | `pets` (nouvelle) | pets |
| Ménage / maison | `home` | housework, organization |
| Administratif | `admin` | admin |
| Santé familiale | `health` | health, appointments |

(`sleep` → `nights`, domaine existant des relais de nuit.) Correspondance serveur `_mission_domain_of`, miroir `MISSION_DOMAIN_OF`, comparée par test Jest. Les 4 autres domaines existants (école, activités, anniversaires, linge, vacances, vêtements, nuits…) restent disponibles dans « Confier un domaine ».

## Règles

- `create_mission` sans destinataire : responsable du domaine s'il existe, n'est pas l'autrice et peut recevoir la mission (membre, accès « organisation », enfant concerné autorisé) ; sinon mission « à prendre ».
- Le choix explicite d'une personne l'emporte toujours sur le domaine.
- Écran `/family/missions/responsibilities` : qui porte quoi, « les domaines que je porte », nombre de missions **en cours par domaine** (jamais par personne : pas de score, pas de classement, pas de comparaison).
- Confier un domaine reste un outil Premium existant (`_enforce_tool('family_domains')`), inchangé.
- Une nounou n'est proposée que si elle a l'accès « organisation » ; pour une mission liée à un enfant, seulement si cet enfant lui est confié.
