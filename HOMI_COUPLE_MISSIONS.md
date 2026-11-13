# HOMI — Missions dans le couple : scénario A et règles anti-abus

Établi le 14/11/2026. Objectif : se demander un coup de main pratique sans WhatsApp ni SMS, sans que l'outil devienne un instrument de contrôle.

## Scénario A — « Il manque des couches »

| # | Qui | Geste | Ce que fait HOMI (serveur) | Preuve |
|---|---|---|---|---|
| 1 | Mère | Famille → Missions → Nouvelle mission → modèle « Acheter des couches taille 4 aujourd'hui » (produit « Couches taille 4 », 18 h), pour : conjoint | `create_mission` : mission « À accepter », historique « Mission demandée », événement `mission.requested` | SQL « mission A : créée… » ; E2E `02`, `03` |
| 2 | Conjoint | reçoit « HOMI · Nouvelle mission : Acheter des couches taille 4 aujourd'hui » | consommateur → notification neutre (écran verrouillé générique par défaut, heures calmes respectées par `send-push`) | SQL « le conjoint reçoit… » ; E2E `notification_conjoint`, `04` |
| 3 | Conjoint | « J'accepte » (ou Refuser / Autre horaire / Commencer / Terminer / Besoin de précision) | `mission_respond('accept')` → Acceptée ; `mission.accepted` → article « Couches taille 4 » ajouté à la liste de courses (ou rattaché s'il y est déjà) ; la mère est prévenue | SQL, E2E `05`, `06`, `07` |
| 4 | Mère | voit le statut « Acceptée » puis « En cours » | lecture de la même ligne (temps réel du foyer existant) | E2E `09`, `10` |
| 5 | Conjoint | « C'est terminé » après l'achat | Terminée (`done_by` posé par le serveur) ; `mission.completed` → article coché ; `task.completed` publié (futur stock) | SQL « article coché » ; E2E `08` |
| 6 | Mère | reçoit « Mission terminée : … » | notification de confirmation | E2E `confirmation_mere`, `11` |
| 7 | Conjoint ou mère | (variante) coche « Couches taille 4 » dans la liste | `shopping.item_checked` : la mission se termine seulement si c'est le **destinataire** qui coche ; sinon proposition neutre, rien de forcé (15/11/2026) | SQL `98s` « coche par … » |
| 8 | Mère | valide l'achat sur le stock « Couches taille 4 » (+52) | l'article était relié au stock (même produit) ; le stock était « acheté, à valider » (quantité inchangée) ; `stock_validate_purchase` → stock actualisé, `stock.purchase_confirmed` publié pour le futur budget | SQL `98s` « scénario A (étape 8) » ; E2E `e2e/courses_stocks_scenarios.py` `A8_*`, captures `/tmp/homi-stk/shots/A08a…`, `A08b…` |

Captures : `/tmp/homi-mis/shots/00-famille-hub.png` … `13-dock-ajout-rapide.png` (démo web, 390 × 844).

## Règles anti-abus (appliquées par le serveur, pas seulement l'interface)

| Risque | Règle |
|---|---|
| Score d'obéissance, classement | Aucun compteur par personne, aucun taux d'acceptation, aucun « délai de réponse » ; les responsabilités montrent des missions en cours **par domaine** |
| Relances agressives | Aucune relance automatique ; « Petit rappel » à l'initiative de l'autrice, **1 par 24 h** (refusé au-delà) ; « En cours » ne notifie personne ; occurrence récurrente suivante créée sans notification |
| Lecture obligatoire / preuve de lecture | Jamais de « vu » : la notification n'est pas marquée lue à l'envoi, rien n'expose `read_at` ; l'écran le dit (« seule une réponse compte ») |
| Justification forcée d'un refus | Refus sans texte accepté ; mot facultatif (≤ 300) |
| Répondre à la place de l'autre | Seul le destinataire accepte / refuse / commence / termine ; l'autrice ne le peut pas (testé) |
| Réécrire la demande après coup côté destinataire | Seule l'autrice modifie le contenu ; le destinataire propose un autre moment |
| Effacer les traces | Historique en ajout seul, même pour le serveur |
| Ton culpabilisant | Modèles et notifications neutres (garde-fou `isNeutralText`, 5 langues) ; « Mission non prise » plutôt que « refusée » dans la notification |
| Nounou exposée à un autre enfant | Mission liée à un enfant non confié : invisible, non attribuable, sans notification |
| Ex-membre | Plus rien de lisible ni de modifiable (`not_found`) ; son appareil purge le cache du foyer |
| Organiser le travail de l'autre | Responsable de domaine destinataire par défaut ; mission « à prendre » sinon |
