# Audit n°7 — Parcours du foyer et intégrations

Établi le 18/11/2026 sur `homi/fondations` (≥ `6a870da`). Périmètre : tâches et missions, courses et stocks, invitations et
rôles, documents et médias, agenda et flux iCal, notifications, communauté, temps réel, intégrations externes.
Tableau détaillé (39 parcours) : `docs/audit/tools_foyer.csv`.
Correctifs : migration `supabase/migrations/20261118000700_audit_foyer_integrations.sql`, `src/lib/sync.ts`,
`src/app/settings/family.tsx` (+ clé `u1.fam.alreadyIn`, 5 langues), faux Supabase `e2e/fake_supabase.py` aligné.
Tests : SQL `supabase/tests/sql/98y_audit_foyer.sql` (36 vérifications, 12 rouges avant correctif), Jest
`src/__tests__/sync.test.tsx` (reprise après coupure), parcours `e2e/audit_foyer.py` (web : démo + faux Supabase à deux navigateurs).

## 1. Méthode et rôles

| Rôle | Comment il a été joué |
|---|---|
| Propriétaire (Camille) | démo web ; faux Supabase (compte Premium) ; SQL `authenticated` |
| Co-parent (Sam / Alex) | démo « Voir comme Sam » ; second navigateur sur le même faux Supabase ; SQL |
| Nounou `caregiver` limitée à un enfant, grossesse fermée | SQL (invitation réelle `create_household_invitation` → `accept_household_invitation`) |
| Membre parti / révoqué | SQL (suppression de sa ligne) ; navigateur « Quitter ce foyer » |
| Autre foyer, sans compte | SQL (`authenticated` sans lien, `anon`) ; troisième navigateur (code révoqué) |

Seul le web est exécutable ici. Les fonctions Deno ne sont pas exécutées (Deno absent) : revue du code + logique pure testée par Jest.

## 2. Constats par gravité

### Moyenne

**F1 — Une invitation ouverte par une personne déjà membre réécrit ses droits** (corrigé)
- Étapes : propriétaire → invitation « nounou » (Léa seule, grossesse fermée) ; le co-parent ouvre ce lien (curiosité, lien
  transféré au mauvais destinataire) → `accept_household_invitation`.
- Attendu : rien ne change pour le co-parent ; la nounou peut toujours utiliser son lien.
- Observé : `on conflict (household_id, user_id) do update` recopie `can_view`, `can_edit`, `child_scope`,
  `pregnancy_access` **sans changer le rôle** : le co-parent devient un « co-parent » limité au quotidien et aux listes, à un
  seul enfant, grossesse fermée (il perd l'accès aux documents, à la santé et à la grossesse) ; dans l'autre sens une nounou
  qui ouvre un lien co-parent reste `caregiver` mais reçoit tous les domaines et la grossesse ; l'invitation est consommée
  et la vraie destinataire reçoit « Invitation invalide ou expirée ». Même chose pour la propriétaire qui teste son lien.
- Cause : la conversion « invitation → membre » servait aussi de modification de droits.
- Correction : refus `23505` « Vous faites déjà partie de ce foyer. » **avant** toute écriture (invitation non consommée) ;
  les droits d'un membre ne se changent que par la propriétaire (Réglages > Famille, `set_member_scope`). L'écran affiche un
  message traduit (`u1.fam.alreadyIn`, 5 langues).
- Tests : 98y « F1 » (propriétaire, co-parent, nounou : 7 vérifications rouges avant) ; `e2e/audit_foyer.py`
  `F1_deja_membre_message_clair`, `F1_droits_inchanges_invitation_intacte`.

**R1 — Changements perdus après une coupure du temps réel** (corrigé)
- Étapes : Camille sur l'onglet Famille ; le WebSocket Realtime se coupe (réseau instable, serveur redémarré, mise en veille)
  alors que le navigateur reste « en ligne » ; Alex ajoute une tâche ; le canal se réabonne.
- Attendu : la tâche apparaît à la reprise.
- Observé : le canal se réabonne (« en direct » revient) mais aucun événement n'est rejoué : la tâche n'apparaît qu'au prochain
  retour au premier plan ou à l'expiration du cache. `onlineManager` ne couvre que la perte du réseau du navigateur.
- Correction : `reconnectWatcher` (`src/lib/sync.ts`) : au premier « en direct » qui suit une perte, toutes les tables
  couvertes par l'abonnement sont relues (une seule relecture groupée par `batcher`) ; jamais au premier abonnement.
- Tests : Jest `sync.test.tsx` « relit tout au retour du temps réel… » (logique) et « useRealtimeSync : la reprise après
  coupure relit les tâches et les notifications du foyer » (hook monté, rouge sans le correctif) ; `e2e/audit_foyer.py`
  `T_reabonnement_apres_coupure` (le canal se réabonne).
- Limite observée : dans le faux Realtime (`e2e/fake_supabase.py`), realtime-js 2.118 n'appelle **jamais** le rappel d'état
  de `channel.subscribe` (ni au premier abonnement, ni à la reprise ; vérifié sur une version web instrumentée :
  `window.__rt` vide), alors que les événements `postgres_changes` passent (`temps_reel.py`). La relecture à la reprise
  n'est donc pas observable dans le navigateur ici (`informations_non_bloquantes` du rapport) : **à vérifier sur Supabase
  réel** (couper le réseau 30 s, modifier depuis un autre compte, revenir). Si l'état n'arrivait pas non plus en
  production, l'indicateur « en direct » et cette reprise resteraient inertes : prévoir alors un repli sur les événements
  de la socket (`client.realtime` onOpen).

### Basse

**F2 — Mission refusée toujours présente dans l'agenda externe** (corrigé)
- Étapes : mission datée → « Je ne peux pas » → flux iCal (`calendar-feed` → `calendar_feed_data`).
- Attendu : comme dans l'application (`itemsBetween` : « mission refusée : plus dans l'agenda »).
- Observé : statut `todo` et pas de `mission_state` dans le flux : le filtre commun ne peut pas s'appliquer ; la mission reste
  dans Google / Apple / Outlook, chez la personne qui l'a refusée comme chez la demandeuse.
- Correction : filtre serveur `mission_state is distinct from 'declined'` + `mission_state` transmis.
- Tests : 98y « F2 » (3 vérifications rouges avant).

**B3 — Missions ouvertes d'un membre parti** (non corrigé, décision produit)
Après un départ ou un retrait, ses missions non terminées restent attribuées à l'ex-membre (« À accepter », « Acceptée »…).
L'autrice peut réattribuer (À accepter, Refusée) ou annuler ; une mission « Acceptée » ne peut qu'être annulée. Proposition :
au retrait, repasser ces missions en « Refusée » (historique « retiré du foyer ») pour que l'autrice décide.

**B4 — Notifications conservées par un ex-membre** (non corrigé, décision produit)
Ses anciennes notifications (ex. « Nouvelle mission : Préparer le goûter ») restent dans son centre de notifications (RLS
`user_id`). Les liens ne s'ouvrent plus (`not_found`). À trancher : effacer les notifications liées au foyer au départ.

**B5 — Invitation : pas de « Refuser » explicite** (validé, décision produit)
Refuser = ne pas accepter ; l'invitation expire après 7 jours ou est révoquée par la propriétaire. Aucun état visible par
l'invitante (pas de preuve de lecture).

## 3. Parcours validés (sans défaut)

- **Missions** (scénario A complet, refus sans justification, report jamais dans le passé, rappel 1 / 24 h serveur et écran,
  annulation par l'autrice seule — bouton absent et refus serveur pour le destinataire —, réattribution) : `missions_scenario_a.py`
  (24/24), `audit_foyer.py` M1–M3, SQL 98m.
- **Courses et stocks** (scénario F croquettes, doublons et fusion, coche par un non-destinataire : aucune fin forcée,
  proposition « Article coché » au destinataire, fin par le destinataire) : `courses_stocks_scenarios.py` (36/36), `audit_foyer.py` M3, SQL 98s.
- **Invitations** : code affiché une fois, empreinte SHA-256 seule stockée, rejoué / expiré / révoqué / inventé / sans compte
  refusés, co-parent ni lecteur ni révocateur ni créateur d'invitations, nounou avec choix d'enfants et grossesse fermée,
  départ (propriétaire ne peut pas partir) : SQL 98y, `audit_foyer.py` I_* et D_*.
- **Ce que voit chaque rôle ensuite** : nounou → un enfant, pas de grossesse, aucune invitation, aucune mission d'un enfant
  non confié ; ex-membre → plus rien, flux iCal coupé ; autre foyer → aucun membre ni prénom (SQL 98y, 95, 98n).
- **Documents et médias** : documents non partagés invisibles à la nounou, fichier compris (SQL 95) ; lecture des fichiers =
  relecture de la ligne sous RLS, aucun espace public (audit 3, SQL 85/86/98x).
- **Agenda** : périmètre enfant / grossesse dans le flux (98x S3), révocation (`agenda_abonnement.py`), refusées masquées (après F2).
- **Notifications** : texte générique sur l'écran verrouillé par défaut, communauté et rappels produits toujours génériques,
  heures calmes (fin dans le fuseau de la personne, urgences immédiates) : Jest `pushRules.test.ts`, `missions.test.ts` ;
  aucune preuve de lecture : `send-push` ne touche pas `read_at`, la lecture de Sam reste invisible à Camille (`audit_foyer.py`).
- **Communauté** : pseudonyme obligatoire (prénom refusé), signalement unique et masquage au 3e, blocage dans les deux sens,
  aucune publication automatique (aucune insertion serveur dans les publications ; seules les actions explicites de
  `hooks-community.ts` publient) : SQL 10/20/32/56, `communaute.py`.
- **Temps réel** : abonnement filtré par foyer / personne, tables privées non écoutées (`temps_reel.py`), reprise après coupure (R1).

## 4. Intégrations externes (service réel injoignable → « bloqué »)

| Service | Étape vérifiée ici | Test restant (production) |
|---|---|---|
| RevenueCat | webhook : secret Bearer obligatoire, comparaison à temps constant, refus si secret absent ; scénarios d'abonnement (Jest `subscriptionScenarios`, `premium`) | achat sandbox sur appareil, webhook réel |
| Push Expo | `send-push` : `x-webhook-secret` requis, réservation atomique `pushed_at`, heures calmes, texte générique (Jest `pushRules`, `missions`) | envoi sur appareil, passage planifié toutes les 15 min, catégorie « mission » interactive |
| Google Places | sans `GOOGLE_PLACES_API_KEY` → `not_configured`, jamais de faux résultat ; repli OSM (Jest `outings`, `osmOutings`) | clé réelle, quotas |
| Gemini | assistant : `ASSISTANT_ENABLED` / clé absente → 503 explicite ; scan-explain → `not_configured`, règles affichées (Jest `assistant`, `scanner`) | appel réel, quotas, coûts |
| Open Food Facts | désactivé sans `OPENFOODFACTS_USER_AGENT` ; cache ; RappelConso (Jest `scanner*`) | `deno test` des fichiers `_shared/*_test.ts`, appel réel |
| E-mail (Resend) | `auth-email` : signature Standard Webhooks ± 5 min, non configuré → erreur journalisée sans détail ; parcours d'inscription sur faux Supabase (`etape1_auth.py`) | envoi réel, délivrabilité |

Pour toutes : `deno check` non exécuté (Deno absent), secrets à vérifier au déploiement (liste : audit 3 § 6).

## 5. Commandes exécutées

```bash
PGPORT_TEST=54407 bash supabase/tests/run-local.sh          # avant : 1 906 / 0 ; après : 1 942 / 0
CI=1 npx jest --forceExit --maxWorkers=2 --testTimeout=90000 --testPathIgnorePatterns=/node_modules/   # 147 suites
npx tsc --noEmit ; node scripts/i18n-scan.js
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key npx expo export --platform web --clear --output-dir /tmp/audit7/dist
python3 e2e/spa_server.py /tmp/audit7/dist 8977 &
PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8977 python3 e2e/audit_foyer.py
PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8977 python3 e2e/missions_scenario_a.py
PW_CHROMIUM=/opt/pw-browsers/chromium NAV_URL=http://127.0.0.1:8977 python3 e2e/courses_stocks_scenarios.py
```

Rien n'a été déployé ; la migration est à appliquer sur une copie de la base de production avant déploiement.
