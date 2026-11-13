# Audit n° 2 — Authentification et compte (13/11/2026)

Périmètre : inscription, confirmation d'e-mail, connexion, déconnexion, mot de passe oublié et réinitialisation,
expiration et rafraîchissement de session, accès direct aux écrans protégés, connexion Apple / Google, suppression
du compte (fonction `delete-account` + `delete_user_account`), export des données, mode démonstration.

Méthode :

- **Navigateur réel** (Chromium, version web exportée) contre le **faux Supabase** (`e2e/fake_supabase.py`), étendu
  dans `e2e/audit_auth.py` par une **émulation de la RLS** (sans session : aucune ligne ; jeton inconnu ou révoqué :
  401 `PGRST301`) et par une fausse fonction `delete-account` (échec 500 puis succès).
- **PostgreSQL 16** avec toutes les migrations (`supabase/tests/run-local.sh`) pour la base, la RLS et la
  suppression de compte : `supabase/tests/sql/98t_audit_compte.sql`.
- **Jest** pour les régressions côté application : `src/__tests__/audit2Auth.test.tsx`.

## Synthèse

| # | Gravité | Constat | État |
|---|---------|---------|------|
| 1 | Élevée | Titre et notes des documents **privés** recopiés dans le journal d'audit du foyer, lisible par la propriétaire et les co-parents — y compris **après la suppression du compte** de l'autrice | Corrigé |
| 2 | Élevée | Session expirée ou refusée au démarrage : le **cache du compte précédent** (profil, enfants…) revenait sur l'appareil après avoir été effacé | Corrigé |
| 3 | Moyenne | Profil › Mon compte : mot de passe trop court → la clé technique `v.password.length` s'affichait | Corrigé |
| 4 | Moyenne | Export RGPD incomplet : abonnements de la communauté, liens d'agenda, alertes de rappel, appareils de notification, rôles absents | Corrigé |
| 5 | Faible | Échec de la suppression du compte : message générique « Le service est momentanément indisponible. » au lieu du message propre à la suppression | Corrigé |
| 6 | Info | Identifiant (UUID) d'une personne supprimée conservé comme `actor_id` dans le journal d'un foyer partagé conservé | Non corrigé (choix de conception, pseudonyme) |
| 7 | Info | iOS : rien n'impose d'activer Apple quand Google est activé (règle 4.8 de l'App Store) | Non corrigé (hors périmètre : `src/lib/socialProviders.ts`) |
| 8 | Info | `auth-email` : nom d'application par défaut « Au fil de nous » si le secret `APP_NAME` manque | Non corrigé (configuration) |

Tout le reste du parcours est conforme (voir « Vérifications sans anomalie »).

---

## 1. Documents privés visibles dans le journal d'audit (Élevée) — corrigé

- **Étapes** : B (co-parente, droit « documents ») dépose un document privé (`private_to_uploader`, valeur par défaut)
  « Bilan psy confidentiel », note « note intime ». A, propriétaire, lit `household_audit_log`. Puis le compte de B
  est supprimé (`delete_user_account`).
- **Attendu** : A ne voit ni le document ni son titre, nulle part ; après la suppression, rien de B ne reste lisible.
- **Observé** : `documents` filtre bien (0 ligne pour A), mais le journal contient une entrée `insert` avec
  `after.title = 'Bilan psy confidentiel'` et `after.notes = 'note intime'`, lisible par A. La suppression du compte
  ajoute une entrée `delete` avec `before.title`, et l'entrée `insert` reste, avec `actor_id` = B.
- **Cause** : `_audit_row()` (migration `20261113000300_journal_audit.sql`) journalise toutes les lignes de
  `documents` ; la lecture du journal (`_audit_readable`) ne dépend que du domaine « documents », pas de la
  confidentialité de la ligne.
- **Correction** : migration `20261116002000_audit_compte_documents_prives.sql` — une ligne de `documents` privée
  (état final de la ligne) n'est plus jamais journalisée ; les entrées déjà écrites pour des documents privés sont
  effacées (garde d'ajout seul désactivée le temps de la migration uniquement).
- **Test** : `98t_audit_compte.sql` — « le titre et les notes d'un document privé ne sont pas recopiés dans le
  journal du foyer », « la suppression du compte n'inscrit pas le titre du document privé dans le journal »,
  « un document partagé reste journalisé ».

## 2. Cache du compte précédent restauré après la déconnexion par expiration (Élevée) — corrigé

- **Étapes** (navigateur) : se connecter, afficher l'accueil (« Bon après-midi, Maëlle ») ; la session est révoquée
  ailleurs (jeton de rafraîchissement refusé) ; rouvrir l'application sur `/settings`.
- **Attendu** : accueil de connexion, et plus aucune donnée du compte sur l'appareil.
- **Observé** : redirection correcte vers `/welcome`, mais `localStorage["toietmoi.cache.v1"]` contenait encore le
  profil (« Maëlle ») et les données du foyer : prêtes à être lues par la personne suivante sur l'appareil.
- **Cause** : `PersistQueryClientProvider` relit le cache enregistré pendant que `AuthProvider` relit la session.
  Quand la session est connue avant la fin de cette relecture, `qc.clear()` s'exécute… puis la relecture remet les
  données du compte précédent dans le cache, qui est de nouveau écrit sur l'appareil.
- **Correction** (`src/lib/auth.tsx`) : la session n'est appliquée qu'une fois le cache relu (`useIsRestoring`) ;
  à chaque changement de compte (ou session absente), la copie sur l'appareil est aussi effacée immédiatement
  (`PERSISTED_CACHE_KEY`, partagé avec `src/app/_layout.tsx`). Le cache reste conservé quand c'est le même compte
  qu'à la dernière ouverture (consultation hors connexion).
- **Tests** : Jest `audit2Auth.test.tsx` (échoue sans la correction, passe avec ; le cas « même compte » vérifie que
  le cache hors connexion est conservé) ; navigateur `E_rafraichissement_refuse_deconnecte`,
  `C_fermeture_rapide_cache_vide`, `G_session_et_cache_effaces`.

## 3. Clé de traduction affichée dans Mon compte (Moyenne) — corrigé

- **Étapes** : Profil › Mon compte, nouveau mot de passe « abc » deux fois, « Changer le mot de passe ».
- **Attendu** : « Au moins 8 caractères. » — **Observé** : bandeau « v.password.length » (caractère de contrôle compris).
- **Cause** : `src/app/settings/account.tsx` affichait `issues[0].message` brut ; les schémas encodent une clé
  (`vk()`), traduite ailleurs par `issueText()`.
- **Correction** : `issueText(...)`. Aucun autre écran ne lit `issues[0].message` sans `issueText`.
- **Tests** : Jest `audit2Auth.test.tsx` ; navigateur `F_compte_mdp_faible_message_lisible`.

## 4. Export RGPD incomplet (Moyenne) — corrigé

- **Étapes** : comparer les tables qui référencent `auth.users` à celles lues par `export_my_data()` (et ses versions
  précédentes `_export_my_data_v*`).
- **Observé** : absentes — `member_follows` (abonnements), `calendar_feeds`, `scan_recall_alerts`, `push_devices`,
  `user_roles` (les autres absentes sont techniques : compteurs d'usage, modération, prix partagés…).
- **Correction** : même migration, clé `account_extra` ajoutée à l'export, **sans** empreinte de jeton d'agenda
  ni jeton de notification.
- **Test** : `98t_audit_compte.sql` (« l'export contient les abonnements de la communauté », « … les liens d'agenda,
  sans leur empreinte »).

## 5. Message d'échec de suppression (Faible) — corrigé

- **Étapes** : Mon compte › Supprimer mon compte, SUPPRIMER, fonction serveur en échec (500).
- **Observé** : toast « Le service est momentanément indisponible. » ; le compte et la session sont bien conservés.
- **Correction** : message « La suppression n'a pas pu aboutir. Réessayez ou écrivez-nous. » (réseau coupé : message
  hors connexion).
- **Test** : navigateur `G_echec_service_message_et_compte_garde`.

## 6 à 8. Constats non corrigés

- **6. `actor_id` conservé** : le journal d'un foyer conservé (co-parent) garde l'UUID de la personne supprimée,
  sans clé étrangère, par conception (« l'entrée survit au départ de la personne »). Ce n'est plus qu'un identifiant
  pseudonyme : le compte, le profil et l'e-mail sont supprimés. À arbitrer avec le DPO (remplacer par NULL ?).
- **7. Apple obligatoire avec Google sur iOS** : les boutons dépendent de `EXPO_PUBLIC_AUTH_APPLE` /
  `EXPO_PUBLIC_AUTH_GOOGLE` ; activer Google seul exposerait l'app à un refus App Store. À verrouiller dans
  `src/lib/socialProviders.ts` ou dans la configuration EAS.
- **8. `auth-email`** : définir le secret `APP_NAME=HOMI` (valeur par défaut « Au fil de nous »). Le changement
  d'adresse e-mail n'existe pas dans l'app (pas de chemin à tester).

## Vérifications sans anomalie

Navigateur (`e2e/audit_auth.py`, 41 vérifications) :

- inscription : champs vides refusés sans appel réseau ; mot de passe faible refusé, message lisible ; e-mail déjà
  utilisé (casse différente) → bandeau + « Se connecter » ; inscription valide → « Vérifiez vos e-mails » ;
- connexion : compte non confirmé → « Confirmez d'abord votre adresse e-mail » ; mauvais mot de passe et compte
  inconnu → même message (pas d'énumération) ; confirmation par lien → connectée ; même lien rouvert → « Ce lien
  n'est plus valable » sans session ;
- déconnexion : accueil sans données, session et cache effacés, « retour arrière » et rechargement sans données,
  fermeture immédiate de l'onglet après la déconnexion sans données restantes ;
- accès direct sans session à `/settings`, `/settings/account`, `/settings/privacy`, `/(tabs)`, `/household`,
  `/documents`, `/cycle`, `/journal`, `/child/123`, `/notifications`, `/calendar` → `/welcome`, aucune donnée ;
- session : jeton d'accès expiré rafraîchi en silence ; rafraîchissement refusé → accueil de connexion ; jeton révoqué
  en cours d'utilisation (401) → déconnexion locale (A-12) ;
- mot de passe : oubli avec une adresse inconnue → même réponse ; réinitialisation : mot de passe faible lisible,
  confirmation différente refusée, enregistrement, lien déjà utilisé refusé ;
- export JSON téléchargé avant la suppression ; suppression réussie → `/welcome`, session et cache effacés,
  reconnexion impossible ;
- démonstration : entrée sans aucun appel au serveur, sortie, puis vrai compte sans aucune donnée de démonstration
  (ni affichée, ni envoyée au serveur) ;
- retour Apple / Google : fournisseur désactivé → « Cette méthode de connexion n'est pas encore activée. », aucun
  message technique ; annulation → aucune session.

Base (`98t_audit_compte.sql`, 17 vérifications) : après `delete_user_account`, **aucune ligne** ne référence plus la
personne dans **toutes** les tables liées à `auth.users` (contrôle générique) ; identité supprimée ; foyer partagé,
enfant et document partagé (sans auteur) conservés pour l'autre parent ; seul le fichier privé est à effacer du
stockage ; avec un jeton encore valide de la personne supprimée : aucune lecture, aucune écriture, aucun compte
fantôme recréé par `ensure_my_account` ; foyer non partagé supprimé avec son journal ; `delete_user_account`
inaccessible depuis l'application. Toutes les clés étrangères vers `auth.users` sont en `cascade` ou `set null`.

## Ce qui reste à vérifier hors de cet environnement

- **Fournisseurs OAuth réels** (Apple, Google) : non joignables ici ; seuls la configuration, le retour
  `/auth/callback` et les chemins d'erreur ont été testés. À faire sur appareil : connexion Apple native (iPhone),
  Google (navigateur intégré), révocation Apple à la suppression du compte (`apple_authorization_code`).
- **E-mails réels** (hook `auth-email`, Resend) : signature, gabarits et liens non exercés (Deno absent ici ;
  `email_test.ts` à lancer avec `deno test`).
- **Appareil** : stockage sécurisé découpé (`secureStorage.ts`, Keychain/Keystore), effacement de la clé des photos
  du cycle, liens `toietmoi://auth/callback` et `…/auth/reset`, rafraîchissement au retour au premier plan.
- **Stockage Supabase réel** : effacement des fichiers par `delete-account` (seule la partie SQL est testée).
- **Lint** : `npx expo lint` n'est pas configuré dans le dépôt (il tente d'installer sa configuration) ;
  `tsc` est à 0.

## Commandes

```bash
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --clear --output-dir /tmp/audit2/dist
python3 e2e/spa_server.py /tmp/audit2/dist 8972 &
E2E_URL=http://127.0.0.1:8972 python3 e2e/audit_auth.py      # 41 clés à true, « erreurs » vide
PGPORT_TEST=54402 bash supabase/tests/run-local.sh             # dont 98t_audit_compte.sql
npx jest src/__tests__/audit2Auth.test.tsx
```
