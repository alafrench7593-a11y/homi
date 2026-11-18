# Espace Nounou

Carnet de liaison rempli par la nounou, photos prises dans HOMI et partagées en privé avec les parents, messages
parents–nounou. Migrations : `20261121000100_espace_nounou.sql`, `20261121000200_nounou_perimetre.sql`.
Tests : `supabase/tests/sql/98zb_espace_nounou.sql`, `src/__tests__/nounou.test.ts`, `e2e/espace_nounou.py`.

## Modèle de données

| Donnée | Où | Remarque |
| --- | --- | --- |
| Biberon, repas, sieste, change, observation | tables de suivi existantes (`bottles`, `meals`, `sleeps`, `diapers`, `child_observations`) | mêmes lignes que le suivi bébé ; auteur = `created_by` (forcé par le serveur), `origin` = parent / caregiver / custody (posée par le serveur), `client_id` idempotent |
| Activité, arrivée, départ | `childcare_events` | n'existait pas ; mêmes règles que le suivi (domaine « daily », périmètre par enfant) |
| Information importante | `child_observations.important` + `important_kind` | température = valeur mesurée (`kind = 'temperature'`), jamais interprétée |
| Lien nounou ↔ enfant | `childcare_links` | invitation, acceptation, confirmation, révocation (horodatées) |
| Réglages par enfant | `childcare_settings` | `photos_allowed` (faux par défaut), conservation, téléchargement, discrétion |
| Journal des autorisations | `childcare_consents` | chaque accord / retrait, horodaté |
| Photos | `childcare_photos` + bucket privé `child-photos` | chemin `<foyer>/<enfant>/<id client>.jpg` (même format que l'album : « ajouter aux souvenirs » réutilise le fichier) |
| Messages | `childcare_messages` | texte, `important` ; aucune colonne de lecture / présence |
| Préférences de notification | `childcare_notify_prefs` | par parent et par enfant |

## Règles d'accès (serveur)

- Invitation (`childcare_invite`, parent = propriétaire ou co-parent ayant accès à l'enfant) : réutilise
  `household_invitations` (jeton haché, usage unique, 72 h, révocable), rôle `caregiver`, domaine `daily`,
  **aucun enfant** (`child_scope = '{}'`), grossesse fermée. Le parcours du co-parent n'est pas modifié.
- Acceptation : `accept_household_invitation` (parcours commun) ou `childcare_accept` (nounou déjà membre du foyer).
  Le lien passe « acceptée » ; la nounou ne voit encore **rien**.
- Confirmation explicite d'un parent (`childcare_confirm`) : l'enfant entre dans `child_scope` ; toute la RLS existante
  (domaines + enfants autorisés) s'applique. `childcare_add_child` : confier un autre enfant à une nounou déjà membre.
- Révocation (`childcare_revoke`) : l'enfant sort du périmètre à la seconde (suivi, photos, fichiers, messages) ; plus
  aucun enfant → la personne est retirée du foyer. Les liens signés de photos durent 5 minutes.
- Photos : écriture (ligne et fichier) seulement par une nounou **confirmée, non révoquée, pour CET enfant**, si
  `photos_allowed` est vrai et si la photo est déclarée « un seul enfant » (`only_this_child`, sinon refus).
  Lecture : parents de l'enfant, et l'autrice tant que son accès est actif. Suppression : parents, ou l'autrice active.
  Un fichier encore référencé (garde ou album) n'est jamais effacé.
- Messages : parents de l'enfant et nounou active seulement.
- Périmètre de la nounou dans le foyer : politiques restrictives sur `family_domains`, `family_prep`,
  `offduty_periods`, `postpartum_shared_status`, `reminders` (rien du couple, de la charge mentale, du post-partum).
  Le carnet de la maison (`house_notes`) reste visible (fait pour la personne qui garde).

## Confidentialité des photos

- Prise dans HOMI uniquement (caméra ouverte à la demande, autorisation demandée à ce moment) ; jamais enregistrée dans
  la photothèque de la nounou ; fichiers temporaires effacés après l'envoi ou l'annulation.
- Avant l'envoi : JPEG, grand côté 1600 px, **tous les segments de métadonnées retirés** (EXIF dont GPS, XMP,
  commentaires) puis vérifiés (`stripJpegMetadata`, `jpegMetadataReport`).
- Coupure réseau : la photo prête attend dans `Documents/childcare-outbox` (répertoire privé de l'app, non chiffré
  au-delà de la protection des données d'iOS), renvoyée une seule fois (même identifiant client), puis effacée.
- Notifications : « HOMI — Nouveau souvenir » / « Une nouvelle photo de <prénom ou bébé> est disponible. », jamais
  d'image ; sur l'écran verrouillé, texte générique sauf accord explicite (règle existante de `send-push`).
- **Aucune reconnaissance faciale, aucune analyse d'image, aucun usage d'entraînement.** HOMI ne détecte pas les
  enfants présents : la nounou répond à la question ; « oui » bloque le partage.
- Conservation : 30 jours (défaut), 1 an ou jusqu'à suppression. Purge : `childcare_purge_expired()` est prête mais
  **pas encore planifiée** (aucune tâche pg_cron dans le projet) ; à planifier côté serveur (Supabase Cron, quotidien).
  En attendant, l'app appelle `childcare_purge_now()` à l'ouverture de l'espace par un parent. Les fichiers partent
  ensuite par `storage_deletions` (fonction `storage-cleanup`, déjà à planifier).

## À tester sur iPhone (non vérifiable sur le web)

1. Caméra : première demande d'autorisation au moment de « Prendre une photo » (texte NSCameraUsageDescription).
2. Autorisation refusée : explication + « Ouvrir les Réglages », retour au carnet possible.
3. Photo prise : aperçu, Reprendre / Conserver ; la photo n'apparaît PAS dans l'app Photos de la nounou.
4. Photo envoyée : ouvrir le fichier téléchargé côté parent avec un lecteur EXIF → aucune position, aucun modèle.
5. Mode avion pendant l'envoi → « en attente d'envoi », retour du réseau → une seule photo côté parents.
6. Notifications push aux parents (photo, message, information importante) ; écran verrouillé sans détail.
7. « Enregistrer dans mes Photos » (parent, réglage activé) : demande d'autorisation d'AJOUT seulement.
8. Révocation pendant que la nounou a l'app ouverte : plus rien au prochain affichage ; lien de photo expiré en 5 min.
9. VoiceOver, texte agrandi, Réduire les animations sur « Mes gardes », la saisie rapide et la photo.
10. Nouvelle build de développement nécessaire (`expo-media-library` ajouté).
