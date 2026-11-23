-- =====================================================================
-- Audit 08 « Fiabilité et données » : ce que l'application suppose du serveur pour ne jamais créer de doublon,
-- ne jamais écraser en silence et ne jamais laisser d'état à moitié écrit.
--  1. Lignes antérieures à client_id / version : toujours modifiables, version posée, plusieurs client_id NULL admis.
--  2. Rejeu d'une insertion (file hors ligne, réponse perdue, double pression) : « on conflict … do nothing » sous RLS,
--     une seule ligne — tâches, articles (liste générée), demandes, stocks, rendez-vous et traitements (id posé par l'appareil).
--  3. Deux membres modifient la même tâche / le même stock : le second reçoit « conflict » + ligne actuelle, rien n'est écrasé.
--  4. Rejeu d'une réponse (mission acceptée, achat validé) : un seul effet, un seul article, un seul événement.
--  5. Échec au milieu d'une action composée (création de mission refusée) : rien d'écrit, aucun événement orphelin.
-- =====================================================================
\set OW 'd098f000-0000-4000-8000-000000000001'
\set CP 'd098f000-0000-4000-8000-000000000002'
\set XX 'd098f000-0000-4000-8000-000000000003'
\set H  'd098f000-0000-4000-8000-0000000000a1'
\set L1 'd098f000-0000-4000-8000-0000000000d1'
\set T0 'd098f000-0000-4000-8000-0000000000b0'
\set T1 'd098f000-0000-4000-8000-0000000000b1'
\set C1 'd098f000-0000-4000-8000-0000000000e1'
\set C2 'd098f000-0000-4000-8000-0000000000e2'
\set C3 'd098f000-0000-4000-8000-0000000000e3'
\set AP 'd098f000-0000-4000-8000-0000000000f1'
\set TR 'd098f000-0000-4000-8000-0000000000f2'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'fiab98y-mere@exemple.test'), (:'CP', 'fiab98y-pere@exemple.test'), (:'XX', 'fiab98y-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98y', :'OW');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'CP', 'coparent', '{daily,health,lists}', '{daily,health,lists}');
insert into public.shopping_lists (id, household_id, title, created_by) values (:'L1', :'H', 'Courses', :'OW');
select tests.set_premium(:'OW', true);
select tests.set_premium(:'CP', true);
create temp table f98 (k text primary key, id uuid, n numeric);
grant all on f98 to authenticated;

-- ===================================================================== 1. données antérieures à client_id / version
-- Deux tâches « d'avant » (aucun client_id) : admises toutes les deux, version posée par le serveur
insert into public.family_tasks (id, household_id, title, created_by) values (:'T0', :'H', 'Ancienne tâche A', :'OW');
insert into public.family_tasks (household_id, title, created_by) values (:'H', 'Ancienne tâche B', :'OW');
select tests.ok((select count(*) from public.family_tasks where household_id = :'H' and client_id is null) = 2
  and (select bool_and(version = 1) from public.family_tasks where household_id = :'H'),
  'données antérieures : plusieurs tâches sans client_id coexistent (NULL distincts), version = 1');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(public.update_if_version('family_tasks', :'T0', 1, '{"title":"Ancienne tâche A (renommée)"}') ->> 'status' = 'ok',
  'données antérieures : une ligne sans client_id se modifie par update_if_version');
reset role;
select tests.ok((select version = 2 and client_id is null from public.family_tasks where id = :'T0'), 'données antérieures : version +1, client_id reste NULL (jamais inventé)');

-- ===================================================================== 2. rejeu d'insertion : jamais de doublon
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_tasks (household_id, client_id, title) values (:'H', :'C1', 'Sortir les poubelles') on conflict (household_id, client_id) do nothing;
insert into public.family_tasks (household_id, client_id, title) values (:'H', :'C1', 'Sortir les poubelles') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.family_tasks where client_id = ''d098f000-0000-4000-8000-0000000000e1''') = 1,
  'tâche envoyée deux fois (file rejouée / réponse perdue) : une seule ligne');
-- Liste générée : articles à client_id déterministe (préfixe de la liste + position), lot rejoué en entier après une coupure
insert into public.shopping_items (household_id, list_id, client_id, label, position) values
  (:'H', :'L1', 'd098f000-0000-4000-8000-000000000000', 'Pâtes', 0) on conflict (household_id, client_id) do nothing;
insert into public.shopping_items (household_id, list_id, client_id, label, position) values
  (:'H', :'L1', 'd098f000-0000-4000-8000-000000000000', 'Pâtes', 0), (:'H', :'L1', 'd098f000-0000-4000-8000-000000000001', 'Riz', 1)
  on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.shopping_items where list_id = ''d098f000-0000-4000-8000-0000000000d1''') = 2,
  'liste générée reprise après échec partiel : les articles déjà écrits sont ignorés, les manquants ajoutés (2 articles, pas 3)');
insert into public.household_stocks (household_id, client_id, label, category) values (:'H', :'C2', 'Lessive', 'laundry') on conflict (household_id, client_id) do nothing;
insert into public.household_stocks (household_id, client_id, label, category) values (:'H', :'C2', 'Lessive', 'laundry') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.household_stocks where client_id = ''d098f000-0000-4000-8000-0000000000e2''') = 1, 'stock envoyé deux fois : une seule ligne');
-- Rendez-vous et traitement : id posé par l'appareil, renvoyé tel quel au nouvel essai
insert into public.appointments (id, household_id, kind, title, starts_at) values (:'AP', :'H', 'ultrasound', 'Échographie T3', now() + interval '10 days') on conflict (id) do nothing;
insert into public.appointments (id, household_id, kind, title, starts_at) values (:'AP', :'H', 'ultrasound', 'Échographie T3', now() + interval '10 days') on conflict (id) do nothing;
select tests.ok(tests.count('select * from public.appointments where household_id = ''d098f000-0000-4000-8000-0000000000a1''') = 1,
  'rendez-vous « Réessayer » après réponse perdue : même id → un seul rendez-vous, aucune erreur');
insert into public.my_treatments (id, name, dose_text, times, start_date) values (:'TR', 'Fer', '1 comprimé', '{08:00}', current_date) on conflict (id) do nothing;
insert into public.my_treatments (id, name, dose_text, times, start_date) values (:'TR', 'Fer', '1 comprimé', '{08:00}', current_date) on conflict (id) do nothing;
select tests.ok(tests.count('select * from public.my_treatments where user_id = ''d098f000-0000-4000-8000-000000000001''') = 1, 'traitement renvoyé (rappels en échec au premier essai) : un seul traitement');
set request.jwt.claim.sub = :'CP';
insert into public.care_requests (household_id, client_id, kind, message) values (:'H', :'C3', 'relay', 'Tu peux prendre le relais ?') on conflict (household_id, client_id) do nothing;
insert into public.care_requests (household_id, client_id, kind, message) values (:'H', :'C3', 'relay', 'Tu peux prendre le relais ?') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.care_requests where client_id = ''d098f000-0000-4000-8000-0000000000e3''') = 1, 'demande d''aide envoyée deux fois : une seule demande');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and created_at > now() - interval '1 minute' and deep_link like '%family%') <= 1,
  'demande rejouée : pas de seconde notification');
-- Un autre foyer ne « devine » pas une ligne par rejeu : son insertion est refusée, rien n'est révélé
set role authenticated; set request.jwt.claim.sub = :'XX';
select tests.throws($$insert into public.family_tasks (household_id, client_id, title) values ('d098f000-0000-4000-8000-0000000000a1', 'd098f000-0000-4000-8000-0000000000e1', 'x') on conflict (household_id, client_id) do nothing$$,
  'rejeu depuis un autre foyer : refusé (RLS), jamais absorbé en silence');

-- ===================================================================== 3. modifications concurrentes
set request.jwt.claim.sub = :'OW';
insert into public.family_tasks (id, household_id, title, notes) values (:'T1', :'H', 'Rendez-vous crèche', null);
-- Les deux lisent la version 1 ; le père modifie le titre en premier
set request.jwt.claim.sub = :'CP';
select tests.ok(public.update_if_version('family_tasks', :'T1', 1, '{"title":"Rendez-vous crèche 9 h"}') ->> 'status' = 'ok', 'concurrence : la première modification passe');
set request.jwt.claim.sub = :'OW';
select tests.ok((select r ->> 'status' = 'conflict' and r -> 'row' ->> 'title' = 'Rendez-vous crèche 9 h' and (r -> 'row' ->> 'version')::int = 2
  from (select public.update_if_version('family_tasks', 'd098f000-0000-4000-8000-0000000000b1', 1, '{"title":"Rendez-vous crèche 10 h"}') r) x),
  'concurrence : la seconde (même version lue) reçoit « conflict » et la ligne actuelle');
reset role;
select tests.ok((select title = 'Rendez-vous crèche 9 h' and version = 2 from public.family_tasks where id = :'T1'), 'concurrence : rien n''est écrasé en silence');
-- Champ différent : l'application reporte sa modification sur la version actuelle (version 2) → accepté
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(public.update_if_version('family_tasks', :'T1', 2, '{"status":"done"}') ->> 'status' = 'ok', 'report sur la version actuelle : accepté');
-- « Fait » des deux côtés : le second reçoit « conflict » avec status = done (même sens, l'appli n'affiche pas d'erreur)
set request.jwt.claim.sub = :'CP';
select tests.ok((select r ->> 'status' = 'conflict' and r -> 'row' ->> 'status' = 'done' from (select public.update_if_version('family_tasks', 'd098f000-0000-4000-8000-0000000000b1', 2, '{"status":"done"}') r) x),
  'double « fait » : le second voit que c''est déjà fait');
reset role;
select tests.ok((select count(*) from public.household_events where type = 'task.completed' and entity_id = :'T1') = 1, 'double « fait » : un seul fait « task.completed »');
-- Stock : même règle
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into f98 select 'S', id, null from public.household_stocks where client_id = :'C2';
select tests.ok(public.update_if_version('household_stocks', (select id from f98 where k = 'S'), 1, '{"qty_estimate":3}') ->> 'status' = 'ok', 'stock : première modification');
set request.jwt.claim.sub = :'CP';
select tests.ok(public.update_if_version('household_stocks', (select id from f98 where k = 'S'), 1, '{"qty_estimate":1}') ->> 'status' = 'conflict', 'stock : modification concurrente détectée');
reset role;
select tests.ok((select qty_estimate = 3 from public.household_stocks where client_id = :'C2'), 'stock : la quantité n''est pas écrasée');

-- ===================================================================== 4. rejeu d'une réponse : un seul effet
-- Achat validé, réponse perdue, nouvel essai avec la même version lue (2) : conflit, quantité ajoutée UNE fois
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(public.stock_validate_purchase((select id from f98 where k = 'S'), 2, 'add', 2) ->> 'status' = 'ok', 'achat validé (+2)');
select tests.ok((select r ->> 'status' = 'conflict' and (r -> 'row' ->> 'version')::int = 3 and r -> 'row' ->> 'last_validated_by' = 'd098f000-0000-4000-8000-000000000001'
  and (r -> 'row' ->> 'qty_estimate')::numeric = 5
  from (select public.stock_validate_purchase((select id from f98 where k = 'S'), 2, 'add', 2) r) x),
  'achat rejoué : « conflict » avec ma validation (version +1, par moi, quantité attendue) → l''appli l''affiche comme fait');
reset role;
select tests.ok((select qty_estimate = 5 from public.household_stocks where client_id = :'C2')
  and (select count(*) from public.household_events where type = 'stock.purchase_confirmed' and entity_id = (select id::text from f98 where k = 'S')) = 1,
  'achat rejoué : quantité ajoutée une seule fois, un seul fait « stock.purchase_confirmed »');
-- Mission d'achat acceptée deux fois (double pression / réponse perdue) : un seul article de courses
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into f98 select 'M', (public.create_mission(:'H', 'Acheter du lait', :'CP', 'shopping', null, null, false, 'normal', null, null, null, null, 'Lait', null, null,
  'd098f000-0000-4000-8000-0000000000e4') ->> 'id')::uuid, null;
set request.jwt.claim.sub = :'CP';
select tests.ok(public.mission_respond((select id from f98 where k = 'M'), 'accept') ->> 'status' = 'ok', 'mission acceptée');
select tests.ok(coalesce((public.mission_respond((select id from f98 where k = 'M'), 'accept') ->> 'unchanged')::boolean, false), 'mission acceptée une seconde fois : « déjà fait », rien de neuf');
reset role;
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and label ilike '%lait%') = 1
  and (select count(*) from public.household_events where type = 'mission.accepted' and entity_id = (select id::text from f98 where k = 'M')) = 1,
  'mission acceptée deux fois : un seul article de courses, un seul fait « mission.accepted »');

-- ===================================================================== 5. échec au milieu : rien d'écrit
insert into f98 select 'N', null, (select count(*) from public.family_tasks where household_id = :'H');
insert into f98 select 'E', null, (select count(*) from public.household_events where household_id = :'H');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws($$select public.create_mission('d098f000-0000-4000-8000-0000000000a1', 'Mission pour un inconnu', 'd098f000-0000-4000-8000-000000000003', 'shopping')$$,
  'mission confiée à quelqu''un hors du foyer : refusée');
reset role;
select tests.ok((select count(*) from public.family_tasks where household_id = :'H') = (select n from f98 where k = 'N')
  and (select count(*) from public.household_events where household_id = :'H') = (select n from f98 where k = 'E'),
  'action composée refusée : ni tâche, ni article, ni événement orphelin (tout ou rien)');

reset role; set request.jwt.claim.sub = '';
