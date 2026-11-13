# HOMI — Règles des notifications

Établi le 13/11/2026. Migration `20261113000600_notifications_respectueuses.sql` ; fonction `supabase/functions/send-push` ;
logique pure `supabase/functions/_shared/push-rules.ts` (tests Jest `src/__tests__/pushRules.test.ts`, Deno `push-rules_test.ts`) ;
calcul des heures calmes en SQL `push_quiet_until()` (tests `98_hors_ligne_notifications.sql`).

## 1. Deux familles de notifications

| Famille | Où elle est décidée | Heures calmes |
|---|---|---|
| **Locales** (biberon, médicaments, rendez-vous, tâches, échéances, papiers) | Programmées sur le téléphone (`src/lib/notifications.ts`, `src/lib/domain/autoNotifs.ts`) | Sur le téléphone : décalées au matin, **sauf médicaments, traitements et biberon** (jamais décalés) |
| **Serveur** (centre de notifications : demandes d'aide, tâches confiées, relais de nuit, communauté, abonnement, rappels de produits) | Table `notifications` → `send-push` | **Désormais appliquées par le serveur** (ci-dessous) |

## 2. Heures calmes côté serveur

- Réglages : `notification_settings` (une ligne par personne, strictement personnelle) — `quiet_enabled`, `quiet_start`, `quiet_end`, `time_zone` (fuseau IANA vérifié), `lockscreen_details`. Recopiés depuis Réglages > Notifications (`useSaveAutoPrefs`, heures pleines + fuseau du téléphone).
- Sans réglage enregistré : **22 h → 7 h, Europe/Paris** (mêmes valeurs que l'application).
- `send-push` (webhook à l'insertion + passage planifié toutes les 15 min) :
  1. prend les notifications non envoyées dont l'heure est venue (`deliver_after` nul ou passé) ;
  2. pour chaque destinataire, `push_quiet_until(personne, maintenant)` donne la fin des heures calmes **dans son fuseau** (fenêtres qui passent minuit comprises) ;
  3. non urgente + heures calmes → `deliver_after` = fin des heures calmes ; elle partira au passage suivant. **Jamais perdue, jamais dupliquée** (réservation atomique `pushed_at`).
- **Urgences** : `notifications.urgent = true` part immédiatement, canal Android « alertes », priorité haute. Seul le serveur peut poser `urgent` (aucun client ne peut créer de notification ; `urgent`, `pushed_at`, `deliver_after` sont figés pour un client).

## 3. Confidentialité de l'écran verrouillé

- **Par défaut** : titre « Nouvelle notification » (ou « Information importante » pour une urgence) et texte « Ouvrez l'application pour voir le détail. », dans la langue de la personne (5 langues). Aucun prénom d'enfant, aucun contenu de demande, aucune donnée de santé.
- **Détail** seulement si la personne l'a choisi : Réglages > Notifications > « Afficher le détail sur l'écran verrouillé » (`lockscreen_details`).
- **Toujours génériques**, même avec le détail : communauté (un nom de groupe peut révéler un sujet de santé) et rappels de produits (un nom de lait infantile peut révéler une naissance).

## 4. Pas de preuve de lecture

- L'envoi ne touche jamais `read_at`. Une notification n'est « lue » que lorsque la personne l'ouvre ou la marque elle-même dans l'application.
- Aucune information « vu à 21 h 04 » n'est montrée à l'émetteur (une nounou, un co-parent). Une demande d'aide reste « en attente » jusqu'à une **réponse explicite** (accepter / décliner), jamais déduite d'une lecture.

## 5. Préparation des modes de communication

Préparé, non construit :
- les préférences de communication du foyer (canal préféré, moments à éviter, ton) pourront s'ajouter à `notification_settings` (colonnes par catégorie) sans changer `send-push` : `planDelivery()` reçoit déjà la fin des heures calmes et l'urgence ;
- les événements métier (`household_events`) permettront de choisir **qui** prévenir d'un fait (ex. `timesheet.submitted` → propriétaire seulement) au lieu de notifier depuis chaque déclencheur ;
- regroupement (« 3 nouvelles demandes ») : à faire dans `send-push` en groupant les lignes différées par destinataire au moment de l'envoi.

## 6. Ce qui reste

- Passage planifié de `send-push` (toutes les 15 min) à créer dans le tableau de bord Supabase (non déployé ici).
- Préférences par catégorie et par émetteur ; actions interactives sur les notifications serveur.
- Test d'envoi réel sur appareil (jamais fait).
