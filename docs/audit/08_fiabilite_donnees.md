# Audit n°8 — Fiabilité et données

Établi le 13/11/2026 sur `homi/fondations` (≥ `4e586e8`, puis fusion de `b6fc1ae`). Après fusion : Jest 150 suites / 1 777 tests verts, SQL 1 987 / 0, e2e 19 / 19. Périmètre : erreurs réseau,
nouveaux essais, doubles pressions, modifications concurrentes, reprise après fermeture, déconnexion avec file non vide,
compatibilité des données anciennes, échecs partiels d'actions composées. Détail scénario par scénario :
`docs/audit/tools_fiabilite.csv`.

## 1. Méthode

- **Parcours web rejouable** `e2e/audit_fiabilite.py` : mode Supabase réel contre un faux serveur (`FiabFake`, dérivé de
  `e2e/fake_supabase.py`) qui applique les règles du vrai serveur (`on conflict … do nothing`, version +1,
  `update_if_version`). Pannes injectées par `page.route` : 500, 503 continu, **réponse perdue après écriture réussie**
  (le faux serveur écrit puis la connexion est coupée), `context.set_offline`, deux comptes du même foyer, fermeture de
  l'onglet en pleine file, anciennes clés `localStorage`. 19 vérifications.
- **Mesure avant / après** : le même script a été joué sur l'export du code d'origine (`/tmp/audit8/dist_before`) puis
  sur l'export corrigé (`--clear` dans les deux cas). Avant : **10 vérifications rouges** ; après : **toutes vertes**
  (observations : 2 tâches pour un double clic → 1 ; 2 demandes d'aide après « Réessayer » → 1 ; titre de l'autre
  écrasé → conservé ; note de l'autre effacée → conservée).
  Attention : les ports 8977/8978 étaient déjà occupés par d'autres agents ; les mesures valides ont été faites sur
  18977 (avant) et 18978 (après).
- **Jest** `src/__tests__/fiabiliteDonnees.test.ts` (24 cas) : délai dépassé, nouvel essai espacé, rejeu sans doublon,
  fusion à trois versions, cache ancien format, achat rejoué, identifiants de lot, isolation des comptes.
- **SQL** `supabase/tests/sql/98v_fiabilite_donnees.sql` (28 cas) : lignes antérieures à `client_id`/`version`,
  rejeu d'insertion sous RLS (tâches, articles, stocks, rendez-vous, traitements, demandes), concurrence
  `update_if_version`, rejeu de réponse (mission acceptée, achat validé), action composée refusée = tout ou rien.
  **Le serveur était déjà correct** sur tous ces points : aucune migration n'a été nécessaire ; les défauts étaient
  côté application.

## 2. Constats par gravité

### Haute

**H1 — Modification concurrente d'une tâche : écrasement silencieux** (`useSaveTask`, `src/lib/data/hooks-family-load.ts`).
- Étapes : Marie ouvre « Rendez-vous crèche » ; Paul le renomme « … 9 h » ; Marie enregistre « … 10 h ».
- Attendu : conflit détecté, rien d'écrasé, message compréhensible. Observé : titre de Paul écrasé sans rien dire.
  Pire : Paul ajoute une **note**, Marie ne change que le titre → la note de Paul est **effacée** (le formulaire renvoie
  tous ses champs, `notes: null` compris).
- Cause : `backend.update` direct ; `update_if_version` existait mais n'était branché que sur articles et stocks.
- Correction : `mergeUpdate` (`src/lib/offlineConflicts.ts`) avec la tâche lue à l'ouverture : seuls les champs
  modifiés partent à la version lue ; champ non touché par l'autre → reporté ; même valeur des deux côtés → rien ;
  vrai conflit → refus `code: 'conflict'`, message `rel.task.conflict`, liste relue. Cache sans `version` → relecture.
  Démo alignée (`applyTaskPatch`, `demo.ts`).
- Tests : e2e `S6_*`, `S6b_*` ; Jest « F3 » (8 cas) ; SQL « concurrence », « double fait ».

**H2 — « Réessayer » après une réponse perdue : doublons sur les envois directs** (demandes d'aide, rendez-vous,
traitements, listes de courses générées, lots de tâches).
- Étapes : « Demander le relais au foyer » ; le serveur écrit, la réponse se perd ; message d'erreur ; nouvel appui.
- Attendu : une demande. Observé : **deux demandes** (et deux notifications pour l'autre parent).
- Cause : `client_id`/`id` tiré au hasard à chaque essai (`client_id: uuid()` dans `mutationFn`).
- Correction : `src/lib/idempotency.ts` — identifiant stable tant que la même saisie n'a pas abouti
  (`withIdempotentId`), envoi `on conflict … do nothing` ; lots : `derivedId(lot, position)`.
- Tests : e2e `S5_*` ; Jest « F4 » ; SQL « rejeu d'insertion » (6 tables).

**H3 — Double pression sur « Ajouter » (ajout rapide du foyer) : deux tâches** (`src/app/family/index.tsx`).
- Observé avant : 2 tâches. Cause : `onPress={() => void quickAdd()}` ne renvoie pas la promesse, donc le verrou du
  `Button` ne s'applique pas ; et chaque appel tirait un nouveau `client_id`.
- Correction : la promesse est renvoyée ; créations de tâches / articles / stocks avec clé d'idempotence par contenu
  (deux envois simultanés identiques = même `client_id`). Test : e2e `S4_double_pression_un_seul_effet`.

### Moyenne

**M1 — Pas de nouvel essai automatique après un 500 / délai dépassé avec réseau présent** (`src/lib/offline.ts`).
Observé avant : la saisie restait en file jusqu'à un changement de réseau ou un retour au premier plan (e2e : file
non vide après 12 s). Correction : essais espacés 5 s, 15 s, 30 s, 1 min, 2 min, puis 5 min (`RETRY_DELAYS_MS`),
dans l'ordre, sans perte. Tests : e2e `S2_*`, `S3_*` ; Jest « F2 » (3 cas).

**M2 — Requêtes de données sans délai maximal** (`src/lib/backend/supabase.ts`). Une requête sans réponse laissait le
bouton « en cours » indéfiniment ; une interruption devenait un message générique non passager. Correction :
`timedFetch` (30 s, `/rest/v1/` seulement) + `wrap` : `AbortError` → « La réponse prend trop de temps. Réessayez. »,
code `timeout` (la file la garde). Tests : Jest « F1 » (3 cas). Non rejoué en e2e (30 s).

**M3 — Faux « Ajoutée » quand la saisie est seulement gardée en file** (hors ligne, après un 500). Correction : message
`rel.queued` « Gardé sur ce téléphone : envoi automatique dès que la connexion revient. » (ajout rapide et fiche
tâche). Tests : e2e `S1_message_honnete_hors_ligne`, `S2_pas_de_faux_ajoutee_apres_500`.

**M4 — Déconnexion avec file non vide : « Vos données restent enregistrées » était faux** (`src/app/settings/index.tsx`).
Si un autre compte se connecte ensuite, ces saisies sont effacées du téléphone (comportement voulu : jamais envoyées
sous un autre compte). Correction : dernier essai d'envoi, puis avertissement `rel.signOut.pending` avec le nombre.
Test : e2e `S8_*` (et vérification qu'aucune saisie de Marie ne part sous Paul).

**M5 — Liste de courses générée : échec partiel** (`useCreateShoppingList`). Liste créée, articles en échec → liste
vide orpheline, et « Réessayer » en créait une seconde. Correction : id de liste stable + articles à `client_id`
dérivé : la reprise complète la même liste. Test SQL « liste générée reprise après échec partiel ».

**M6 — Documents à plusieurs fichiers : échec au milieu** (`src/app/documents/scan.tsx`). Les fichiers déjà envoyés
étaient retirés, mais pas les fiches déjà créées → fiche pointant vers un fichier effacé. Correction : id de fiche posé
avant l'envoi, fiches retirées puis fichiers. Preuve : revue de code (politique `documents_del` : l'auteur peut
supprimer) ; non rejoué (envoi de fichiers non simulé par le faux serveur).

**M7 — Achat validé, réponse perdue, nouvel essai : faux « conflit »** (`useValidatePurchase`). Le serveur refuse à
juste titre (rien n'est compté deux fois) ; l'appli affichait une erreur pour un achat bien enregistré. Correction :
`isOwnReplayedPurchase` (une seule modification depuis la lecture, par moi, quantité attendue) → affiché comme fait.
Tests : Jest « F5 » ; SQL « achat rejoué ».

**M8 — Traitement créé mais rappels en échec : « Réessayer » créait un second traitement** (`useSaveMyTreatment`).
Correction : id stable ; rappels remplacés dans le même essai. Test SQL « traitement renvoyé ».

### Basse

**B1 — Démo : `update_if_version` des tâches sans historique ni occurrence suivante.** Corrigé (`applyTaskPatch`).

**B2 — Test instable** : `src/__tests__/bottleV3.test.tsx` « terminer : … deux appuis » a échoué une fois dans une
exécution complète chargée (« Unable to find node on an unmounted component »), vert seul et aux exécutions suivantes.

## 3. Ce qui était déjà correct (vérifié)

Reprise après fermeture en pleine file (`S7`) ; isolation des comptes (`S8`) ; ancienne file sans compte, cache
React Query illisible, apparence `night`, garde-manger local migré une fois même depuis deux onglets (`S9`) ;
mission acceptée deux fois = un seul article ; achat rejoué compté une fois ; lignes antérieures à `client_id` ;
humeur/journal (verrou `busy`, file hors ligne) ; prises de médicament (unicité `treatment_id, scheduled_for`).

## 4. Limites et suites

- Cocher / décocher un article (`useToggleShoppingItem`), répondre à une demande, modifier un rendez-vous : update
  direct (le dernier gagne). À brancher sur `mergeUpdate` (articles) ; les rendez-vous n'ont pas de `version`.
- Modifications hors ligne toujours non mises en file (§ 5 de `HOMI_SYNC_ARCHITECTURE.md`).
- Invitations : une double pression crée deux liens d'invitation (sans gravité, non corrigé — zone agent 7).
- Saisies d'écrans qui calculent l'heure au moment de l'appui (biberon, couche) : deux appuis = deux contenus ;
  la protection repose sur le verrou du `Button`.
- Seul le web est exécuté ; temps réel non rejoué ici ; `npx expo lint` indisponible (installation de configuration
  bloquée par le proxy).

## 5. Vérifications

`npx tsc --noEmit` 0 ; `node scripts/i18n-scan.js` 0 ; `node scripts/gen-routes.js --check` OK ; Jest vert ;
SQL vert ; `e2e/audit_fiabilite.py` vert (sortie 0).
