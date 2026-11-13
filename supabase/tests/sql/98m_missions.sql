-- =====================================================================
-- Missions familiales (14/11/2026) — transitions serveur, droits, nounou par enfant, événements idempotents,
-- article de courses lié sans doublon, historique non modifiable. Scénario A de HOMI_COUPLE_MISSIONS.md.
-- =====================================================================
\set OW 'd098b000-0000-4000-8000-000000000001'
\set CP 'd098b000-0000-4000-8000-000000000002'
\set NN 'd098b000-0000-4000-8000-000000000003'
\set XX 'd098b000-0000-4000-8000-000000000004'
\set NL 'd098b000-0000-4000-8000-000000000005'
\set H  'd098b000-0000-4000-8000-0000000000a1'
\set XH 'd098b000-0000-4000-8000-0000000000a2'
\set K1 'd098b000-0000-4000-8000-0000000000c1'
\set K2 'd098b000-0000-4000-8000-0000000000c2'
\set L1 'd098b000-0000-4000-8000-0000000000d1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'm98-mere@exemple.test'), (:'CP', 'm98-conjoint@exemple.test'), (:'NN', 'm98-nounou@exemple.test'),
  (:'XX', 'm98-autre@exemple.test'), (:'NL', 'm98-nounou-sans-listes@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98m', :'OW'), (:'XH', 'Autre 98m', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 400), (:'K2', :'H', 'Noé', current_date - 2000);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,lists}', '{daily,lists}', null),
  (:'H', :'NN', 'caregiver', '{daily,lists}', '{daily,lists}', array[:'K1']::uuid[]),
  (:'H', :'NL', 'caregiver', '{daily}', '{daily}', array[:'K1']::uuid[]);
insert into public.shopping_lists (id, household_id, title, created_by) values (:'L1', :'H', 'Courses de la semaine', :'OW');
insert into public.shopping_items (list_id, household_id, label) values (:'L1', :'H', 'Lait');
create temp table m98 (k text primary key, id uuid);
grant all on m98 to authenticated;

-- ===================================================================== Scénario A : création
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into m98 select 'A', (public.create_mission(:'H', 'Acheter des couches taille 4 aujourd''hui', :'CP', 'shopping', null,
  date_trunc('day', now()) + interval '18 hours', false, 'high', null, null, null, null, 'Couches taille 4', null, null,
  'd098b000-0000-4000-8000-0000000000e1') ->> 'id')::uuid;
reset role;
select tests.ok((select mission_state = 'pending' and status = 'todo' and assignee_id = :'CP' and created_by = :'OW' and domain_key = 'shopping'
  from public.family_tasks where id = (select id from m98 where k = 'A')), 'mission A : créée « À accepter », destinataire et domaine posés par le serveur');
select tests.ok((select count(*) from public.family_task_events where task_id = (select id from m98 where k = 'A') and kind = 'created') = 1,
  'mission A : création historisée');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Nouvelle mission : Acheter des couches taille 4 aujourd''hui'
  and deep_link = '/family/missions/' || (select id from m98 where k = 'A')) = 1, 'mission A : le conjoint reçoit « Nouvelle mission : … » (lien vers la mission)');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Une tâche vous est confiée') = 0
  and (select count(*) from public.notifications where user_id = :'OW') = 0, 'mission A : une seule notification, rien pour l''autrice');
select tests.ok((select status = 'done' and depth = 0 from public.household_events where type = 'mission.requested' and entity_id = (select id::text from m98 where k = 'A')),
  'mission A : événement « mission.requested » publié et traité');
-- Rejoué avec le même client_id : la même mission, rien de neuf
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok((public.create_mission(:'H', 'Acheter des couches taille 4 aujourd''hui', :'CP', 'shopping', null, null, false, 'high', null, null, null, null,
  'Couches taille 4', null, null, 'd098b000-0000-4000-8000-0000000000e1') ->> 'id')::uuid = (select id from m98 where k = 'A')
  and tests.count('select * from public.family_tasks where mission_state is not null') = 1, 'création rejouée (même client_id) : même mission, aucun doublon');

-- ===================================================================== droits : rien de direct, seul le destinataire répond
select tests.throws($$insert into public.family_tasks (household_id, title, mission_state) values ('d098b000-0000-4000-8000-0000000000a1', 'x', 'pending')$$,
  'garde : une mission ne se crée pas par insertion directe');
select tests.throws(format('select public.mission_respond(%L, ''accept'')', (select id from m98 where k = 'A')), 'non-destinataire : l''autrice ne peut pas accepter à la place');
update public.family_tasks set notes = 'Marque habituelle' where id = (select id from m98 where k = 'A');
select tests.ok((select notes = 'Marque habituelle' from public.family_tasks where id = (select id from m98 where k = 'A')), 'créatrice : peut préciser la description');
set request.jwt.claim.sub = :'CP';
select tests.throws(format('update public.family_tasks set mission_state = ''accepted'' where id = %L', (select id from m98 where k = 'A')), 'garde : état non modifiable directement');
select tests.throws(format('update public.family_tasks set status = ''done'' where id = %L', (select id from m98 where k = 'A')), 'garde : statut non modifiable directement');
select tests.throws(format('update public.family_tasks set title = ''Autre'' where id = %L', (select id from m98 where k = 'A')), 'garde : le destinataire ne réécrit pas la mission');
select tests.throws(format('select public.update_if_version(''family_tasks'', %L, 2, ''{"status":"done"}'')', (select id from m98 where k = 'A')), 'garde : update_if_version ne contourne pas les règles');
set request.jwt.claim.sub = :'NN';
select tests.throws(format('select public.mission_respond(%L, ''accept'')', (select id from m98 where k = 'A')), 'non-destinataire : la nounou ne peut pas accepter');
set request.jwt.claim.sub = :'XX';
select tests.ok(public.mission_respond((select id from m98 where k = 'A'), 'accept') ->> 'status' = 'not_found', 'autre foyer : la mission n''existe pas pour lui');
select tests.ok(tests.count('select * from public.family_tasks where household_id = ''d098b000-0000-4000-8000-0000000000a1''') = 0, 'autre foyer : aucune mission lisible');
select tests.throws($$select public.create_mission('d098b000-0000-4000-8000-0000000000a1', 'Intrusion')$$, 'autre foyer : ne peut pas créer de mission chez nous');
set request.jwt.claim.sub = :'OW';
select tests.throws($$select public.create_mission('d098b000-0000-4000-8000-0000000000a1', 'Hors foyer', 'd098b000-0000-4000-8000-000000000004')$$,
  'destinataire hors du foyer refusé');
select tests.throws($$select public.create_mission('d098b000-0000-4000-8000-0000000000a1', 'Pour moi', 'd098b000-0000-4000-8000-000000000001')$$,
  'mission à soi-même refusée (c''est une tâche)');
select tests.throws($$select public.create_mission('d098b000-0000-4000-8000-0000000000a1', 'Sans organisation', 'd098b000-0000-4000-8000-000000000005')$$,
  'nounou sans accès à l''organisation : ne peut pas recevoir de mission');

-- ===================================================================== Scénario A : acceptation → article de courses
set request.jwt.claim.sub = :'CP';
select tests.ok(public.mission_respond((select id from m98 where k = 'A'), 'accept', null, null, null, 2) ->> 'status' = 'ok', 'mission A : le conjoint accepte');
reset role;
select tests.ok((select mission_state = 'accepted' and responded_at is not null and shopping_item_id is not null from public.family_tasks where id = (select id from m98 where k = 'A')),
  'mission A : acceptée, article de courses lié');
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and label = 'Couches taille 4' and list_id = :'L1' and not checked) = 1,
  'mission A : « Couches taille 4 » ajouté à la liste de courses existante');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title like 'Mission acceptée : %') = 1, 'mission A : l''autrice est prévenue de l''acceptation');
-- Rejeu : même réponse, même événement, même consommateur → rien de neuf
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok((public.mission_respond((select id from m98 where k = 'A'), 'accept') ->> 'unchanged')::boolean, 'rejeu : « J''accepte » renvoyé deux fois → inchangé, sans erreur');
reset role;
select tests.ok((select count(*) from public.family_task_events where task_id = (select id from m98 where k = 'A') and kind = 'accepted') = 1
  and (select count(*) from public.household_events where type = 'mission.accepted' and entity_id = (select id::text from m98 where k = 'A')) = 1,
  'rejeu : une seule entrée d''historique et un seul événement');
select public._consume_mission_event(e) from public.household_events e where type = 'mission.accepted' and entity_id = (select id::text from m98 where k = 'A');
select public._consume_mission_event(e) from public.household_events e where type = 'mission.accepted' and entity_id = (select id::text from m98 where k = 'A');
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and label = 'Couches taille 4') = 1
  and (select count(*) from public.notifications where user_id = :'OW' and title like 'Mission acceptée : %') = 1,
  'idempotence : consommateur rejoué deux fois → toujours un article et une notification');
select tests.ok(public._emit_household_event(:'H', 'mission.accepted', 'family_tasks', (select id::text from m98 where k = 'A'), '{}',
  (select idempotency_key from public.household_events where type = 'mission.accepted' and entity_id = (select id::text from m98 where k = 'A')))
  = (select id from public.household_events where type = 'mission.accepted' and entity_id = (select id::text from m98 where k = 'A')),
  'idempotence : même clé rejouée → même événement');
select tests.ok(public.process_household_events(50) = 0, 'consommateur planifié : rien d''autre à traiter');

-- ===================================================================== anti-doublon : article identique déjà sur la liste
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into m98 select 'L', (public.create_mission(:'H', 'Acheter du lait avant 18 h', :'CP', 'shopping', null, null, false, 'normal', null, null, null, null, 'lait') ->> 'id')::uuid;
set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from m98 where k = 'L'), 'accept');
reset role;
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and lower(label) = 'lait') = 1
  and (select shopping_item_id = (select id from public.shopping_items where household_id = :'H' and label = 'Lait') from public.family_tasks where id = (select id from m98 where k = 'L')),
  'anti-doublon : « lait » déjà sur la liste → rattaché, pas recréé');

-- ===================================================================== Scénario A : terminé → article coché, confirmation
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from m98 where k = 'A'), 'start');
select tests.ok((select mission_state = 'in_progress' and status = 'todo' from public.family_tasks where id = (select id from m98 where k = 'A')), 'mission A : « Je m''en occupe » → En cours');
select public.mission_respond((select id from m98 where k = 'A'), 'complete');
reset role;
select tests.ok((select mission_state = 'done' and status = 'done' and done_by = :'CP' and done_at is not null from public.family_tasks where id = (select id from m98 where k = 'A')),
  'mission A : terminée (fait par : le conjoint, posé par le serveur)');
select tests.ok((select checked and checked_by = :'CP' from public.shopping_items where id = (select shopping_item_id from public.family_tasks where id = (select id from m98 where k = 'A'))),
  'mission A : article de courses coché à la fin confirmée');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title like 'Mission terminée : %') = 1, 'mission A : l''autrice reçoit la confirmation');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title like '%commencé%') = 0, '« En cours » ne déclenche pas de notification (pas de relance)');
select tests.ok((select array_agg(kind order by created_at, kind) from public.family_task_events where task_id = (select id from m98 where k = 'A'))
  = array['created', 'updated', 'accepted', 'started', 'done'], 'historique horodaté complet : créée, précisée, acceptée, en cours, terminée');
select tests.ok((select count(*) from public.household_events where type = 'task.completed' and entity_id = (select id::text from m98 where k = 'A')) = 1,
  'fin de mission : « task.completed » publié une fois (bus existant)');

-- ===================================================================== transitions interdites
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok((public.mission_respond((select id from m98 where k = 'A'), 'complete') ->> 'unchanged')::boolean, 'terminée puis « C''est terminé » rejoué → inchangé');
select tests.throws(format('select public.mission_respond(%L, ''decline'')', (select id from m98 where k = 'A')), 'interdit : refuser une mission terminée');
select tests.throws(format('select public.mission_respond(%L, ''postpone'', null, now() + interval ''1 day'')', (select id from m98 where k = 'A')), 'interdit : reporter une mission terminée');
select tests.throws(format('select public.mission_respond(%L, ''dance'')', (select id from m98 where k = 'A')), 'interdit : action inconnue');
set request.jwt.claim.sub = :'OW';
select tests.throws(format('select public.mission_respond(%L, ''cancel'')', (select id from m98 where k = 'A')), 'interdit : annuler une mission terminée');

-- ===================================================================== refus SANS justification, puis proposée à quelqu'un d'autre
insert into m98 select 'D', (public.create_mission(:'H', 'Sortir les poubelles ce soir', :'CP', 'housework') ->> 'id')::uuid;
set request.jwt.claim.sub = :'CP';
select tests.ok(public.mission_respond((select id from m98 where k = 'D'), 'decline') ->> 'status' = 'ok', 'refus sans justification accepté');
reset role;
select tests.ok((select mission_state = 'declined' and status = 'todo' from public.family_tasks where id = (select id from m98 where k = 'D'))
  and (select not (detail ? 'note') from public.family_task_events where task_id = (select id from m98 where k = 'D') and kind = 'declined'),
  'refus : état « Refusée », aucune justification exigée ni inventée');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title = 'Mission non prise : Sortir les poubelles ce soir') = 1,
  'refus : notification neutre à l''autrice');
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.throws(format('select public.mission_respond(%L, ''accept'')', (select id from m98 where k = 'D')), 'interdit : accepter après avoir refusé (la créatrice décide de la suite)');
select tests.throws(format('select public.mission_respond(%L, ''reassign'', null, null, %L)', (select id from m98 where k = 'D'), :'NN'), 'interdit : le destinataire ne réattribue pas');
set request.jwt.claim.sub = :'OW';
select public.mission_respond((select id from m98 where k = 'D'), 'reassign', null, null, :'NN');
reset role;
select tests.ok((select mission_state = 'pending' and assignee_id = :'NN' from public.family_tasks where id = (select id from m98 where k = 'D'))
  and (select count(*) from public.notifications where user_id = :'NN' and title = 'Nouvelle mission : Sortir les poubelles ce soir') = 1,
  'proposée à quelqu''un d''autre : « À accepter » et notifiée à la nouvelle personne');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(public.mission_respond((select id from m98 where k = 'D'), 'decline', 'Je finis à 19 h') ->> 'status' = 'ok', 'refus avec justification facultative');
reset role;
select tests.ok((select detail ->> 'note' = 'Je finis à 19 h' from public.family_task_events where task_id = (select id from m98 where k = 'D') and kind = 'declined' and actor_id = :'NN'),
  'refus : justification facultative gardée dans l''historique');

-- ===================================================================== autre moment, précision, annulation, rappels limités
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into m98 select 'P', (public.create_mission(:'H', 'Récupérer Lou à la crèche', :'CP', 'childcare', null, now() + interval '2 hours', false, 'normal', null, :'K1') ->> 'id')::uuid;
set request.jwt.claim.sub = :'CP';
select tests.throws(format('select public.mission_respond(%L, ''postpone'')', (select id from m98 where k = 'P')), 'autre moment : un moment est obligatoire');
select tests.throws(format('select public.mission_respond(%L, ''postpone'', null, now() - interval ''1 day'')', (select id from m98 where k = 'P')), 'autre moment : jamais dans le passé');
select public.mission_respond((select id from m98 where k = 'P'), 'postpone', null, date_trunc('hour', now()) + interval '1 day');
select public.mission_respond((select id from m98 where k = 'P'), 'ask', 'Quelle porte ?');
reset role;
select tests.ok((select mission_state = 'postponed' and due_at = date_trunc('hour', now()) + interval '1 day' from public.family_tasks where id = (select id from m98 where k = 'P')),
  '« Je propose un autre horaire » → Reportée, nouveau moment enregistré');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title like 'Autre moment proposé : %') = 1
  and (select count(*) from public.notifications where user_id = :'OW' and title like 'Une précision est demandée : %') = 1,
  'report et « Besoin de précision » : l''autrice est prévenue');
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.throws(format('select public.mission_respond(%L, ''cancel'')', (select id from m98 where k = 'P')), 'interdit : le destinataire n''annule pas (il refuse)');
set request.jwt.claim.sub = :'OW';
select public.mission_respond((select id from m98 where k = 'P'), 'remind');
select tests.throws(format('select public.mission_respond(%L, ''remind'')', (select id from m98 where k = 'P')), 'rappels limités : un seul par 24 h');
select public.mission_respond((select id from m98 where k = 'P'), 'cancel');
reset role;
select tests.ok((select mission_state = 'cancelled' and status = 'cancelled' from public.family_tasks where id = (select id from m98 where k = 'P'))
  and (select count(*) from public.notifications where user_id = :'CP' and title = 'Mission annulée : Récupérer Lou à la crèche') = 1,
  'annulation par la créatrice : « Annulée », le destinataire est prévenu');

-- ===================================================================== nounou : enfant hors périmètre
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws(format('select public.create_mission(%L, ''Bain de Noé'', %L, ''other'', null, null, false, ''normal'', null, %L)', :'H', :'NN', :'K2'),
  'nounou : ne reçoit pas de mission pour un enfant non confié');
insert into m98 select 'K2', (public.create_mission(:'H', 'Vaccin de Noé', :'CP', 'health', null, null, false, 'normal', null, :'K2') ->> 'id')::uuid;
insert into m98 select 'K1', (public.create_mission(:'H', 'Préparer le sac de crèche', :'NN', 'packing', null, null, false, 'normal', null, :'K1') ->> 'id')::uuid;
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count(format('select * from public.family_tasks where id = %L', (select id from m98 where k = 'K2'))) = 0
  and tests.count(format('select * from public.family_task_events where task_id = %L', (select id from m98 where k = 'K2'))) = 0,
  'nounou : mission et historique d''un enfant non confié invisibles');
select tests.ok(public.mission_respond((select id from m98 where k = 'K2'), 'accept') ->> 'status' = 'not_found', 'nounou : réponse à une mission d''un enfant non confié → introuvable');
select tests.throws(format('select public.create_mission(%L, ''Pour Noé'', %L, ''other'', null, null, false, ''normal'', null, %L)', :'H', :'CP', :'K2'),
  'nounou : ne crée pas de mission pour un enfant non confié');
select tests.ok(tests.count(format('select * from public.family_tasks where id = %L', (select id from m98 where k = 'K1'))) = 1
  and public.mission_respond((select id from m98 where k = 'K1'), 'accept') ->> 'status' = 'ok', 'nounou : voit et accepte la mission de l''enfant confié');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'NN' and title = 'Nouvelle mission : Vaccin de Noé') = 0, 'nounou : aucune notification sur un enfant non confié');

-- ===================================================================== responsabilités par domaine, mission « à prendre »
-- Confier un domaine est un outil Premium (« Confier un domaine ») : la propriétaire est abonnée ici
select tests.set_premium(:'OW', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_domains (household_id, key, owner_id) values (:'H', 'shopping', :'CP') on conflict (household_id, key) do update set owner_id = excluded.owner_id;
select tests.ok((public.create_mission(:'H', 'Racheter des croquettes', null, 'shopping') ->> 'assignee_id')::uuid = :'CP',
  'domaine « courses » porté par le conjoint : la mission lui arrive sans choisir');
insert into m98 select 'O', (public.create_mission(:'H', 'Vérifier l''assurance', null, 'other') ->> 'id')::uuid;
reset role;
select tests.ok((select assignee_id is null from public.family_tasks where id = (select id from m98 where k = 'O'))
  and (select count(*) from public.notifications where title = 'Nouvelle mission : Vérifier l''assurance' and user_id in (:'CP', :'NN')) = 2
  and (select count(*) from public.notifications where title = 'Nouvelle mission : Vérifier l''assurance' and user_id in (:'OW', :'NL')) = 0,
  'mission « à prendre » : prévenus ceux qui ont accès à l''organisation, pas l''autrice');
set role authenticated; set request.jwt.claim.sub = :'NN';
select public.mission_respond((select id from m98 where k = 'O'), 'accept');
set request.jwt.claim.sub = :'CP';
select tests.throws(format('select public.mission_respond(%L, ''accept'')', (select id from m98 where k = 'O')), 'mission prise par une autre personne : plus disponible');
reset role;
select tests.ok((select assignee_id = :'NN' and mission_state = 'accepted' from public.family_tasks where id = (select id from m98 where k = 'O')), 'mission « à prendre » : la première qui accepte devient responsable');

-- ===================================================================== historique non modifiable
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws(format('update public.family_task_events set kind = ''done'' where task_id = %L', (select id from m98 where k = 'D')), 'historique : modification refusée (membre)');
select tests.throws(format('delete from public.family_task_events where task_id = %L', (select id from m98 where k = 'D')), 'historique : effacement refusé (membre)');
reset role;
select tests.throws(format('update public.family_task_events set detail = ''{}'' where task_id = %L', (select id from m98 where k = 'D')), 'historique : modification refusée même pour le serveur');
select tests.throws(format('delete from public.family_task_events where task_id = %L', (select id from m98 where k = 'D')), 'historique : effacement refusé même pour le serveur');
select tests.throws('truncate public.family_task_events', 'historique : TRUNCATE refusé');
delete from public.family_tasks where id = (select id from m98 where k = 'L');
select tests.ok((select count(*) from public.family_task_events where task_id = (select id from m98 where k = 'L')) = 0, 'historique : effacé seulement avec sa tâche (cascade)');

-- ===================================================================== matrice des transitions (miroir de src/lib/domain/missions.ts)
select tests.ok((select string_agg(s || '>' || a || '=' || coalesce(public._mission_next_state(s, a), '-'), ' ' order by s, a)
  from unnest(array['accepted','cancelled','declined','done','in_progress','pending','postponed']) s,
       unnest(array['accept','ask','cancel','complete','decline','postpone','reassign','remind','start']) a)
  = 'accepted>accept=- accepted>ask=accepted accepted>cancel=cancelled accepted>complete=done accepted>decline=declined accepted>postpone=postponed accepted>reassign=- accepted>remind=accepted accepted>start=in_progress cancelled>accept=- cancelled>ask=- cancelled>cancel=- cancelled>complete=- cancelled>decline=- cancelled>postpone=- cancelled>reassign=- cancelled>remind=- cancelled>start=- declined>accept=- declined>ask=- declined>cancel=cancelled declined>complete=- declined>decline=- declined>postpone=- declined>reassign=pending declined>remind=- declined>start=- done>accept=- done>ask=- done>cancel=- done>complete=- done>decline=- done>postpone=- done>reassign=- done>remind=- done>start=- in_progress>accept=- in_progress>ask=in_progress in_progress>cancel=cancelled in_progress>complete=done in_progress>decline=declined in_progress>postpone=postponed in_progress>reassign=- in_progress>remind=- in_progress>start=- pending>accept=accepted pending>ask=pending pending>cancel=cancelled pending>complete=done pending>decline=declined pending>postpone=postponed pending>reassign=pending pending>remind=pending pending>start=in_progress postponed>accept=accepted postponed>ask=postponed postponed>cancel=cancelled postponed>complete=done postponed>decline=declined postponed>postpone=postponed postponed>reassign=- postponed>remind=postponed postponed>start=in_progress',
  'transitions : matrice complète identique à celle de l''application');

-- ===================================================================== ex-membre
delete from public.household_members where household_id = :'H' and user_id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(public.mission_respond((select id from m98 where k = 'K2'), 'accept') ->> 'status' = 'not_found'
  and tests.count('select * from public.family_tasks where household_id = ''d098b000-0000-4000-8000-0000000000a1''') = 0,
  'membre retiré : plus aucune mission lisible ni modifiable');
reset role;
