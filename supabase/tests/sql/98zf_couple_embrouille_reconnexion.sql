-- =====================================================================
-- Couple (27/11/2026) — 20261127000100_couple_embrouille_reconnexion.sql
-- 172 Mode embrouille (interrupteur personnel, demandes pratiques = missions sans texte libre)
-- 179 Missions de reconnexion (propositions acceptées / déclinées sans justification, planification, historique)
-- Comptes distincts : parent (OW), second parent (CP), nounou confirmée (NN), non-membre (XX),
-- ancien membre (EX, co-parent retiré du foyer en fin de fichier).
-- =====================================================================
\set OW 'f27a0000-0000-4000-8000-000000000001'
\set CP 'f27a0000-0000-4000-8000-000000000002'
\set NN 'f27a0000-0000-4000-8000-000000000003'
\set XX 'f27a0000-0000-4000-8000-000000000005'
\set EX 'f27a0000-0000-4000-8000-000000000006'
\set H  'f27a0000-0000-4000-8000-0000000000a1'
\set H2 'f27a0000-0000-4000-8000-0000000000a2'
\set K1 'f27a0000-0000-4000-8000-0000000000c1'
\set K2 'f27a0000-0000-4000-8000-0000000000c2'
\set CL 'f27a0000-0000-4000-8000-0000000000e1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zf-parent@exemple.test'), (:'CP', 'f98zf-parent2@exemple.test'),
  (:'NN', 'f98zf-nounou@exemple.test'), (:'XX', 'f98zf-inconnu@exemple.test'), (:'EX', 'f98zf-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zf', :'OW'), (:'H2', 'Autre foyer 98zf', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300), (:'K2', :'H', 'Max', current_date - 1700);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true);
select tests.set_premium(:'XX', true); select tests.set_premium(:'NN', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW'; select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';

-- ================================================================ 172 Interrupteur personnel
set request.jwt.claim.sub = :'OW';
insert into public.calm_modes (active) values (true);
select tests.ok(tests.count($$select * from public.calm_modes where active and user_id = 'f27a0000-0000-4000-8000-000000000001'$$) = 1, 'mode embrouille : activé par la personne (ligne à son nom)');
insert into public.calm_modes (user_id, active) values (:'CP', true) on conflict (user_id) do nothing;
select tests.ok(tests.count($$select * from public.calm_modes where user_id = 'f27a0000-0000-4000-8000-000000000002'$$) = 0, 'mode embrouille : aucune ligne créée au nom du second parent');
select tests.ok(tests.count($$select * from public.notifications where user_id = 'f27a0000-0000-4000-8000-000000000002'$$) = 0, 'mode embrouille : l''activation ne prévient personne');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.calm_modes') = 0, 'second parent : ne voit pas le mode de l''autre');
update public.calm_modes set active = false;
insert into public.calm_modes (active) values (false);
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.calm_modes') = 0, 'nounou : ne voit aucun mode');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.calm_modes where active$$) = 1, 'mode embrouille : le second parent n''a pas pu le couper');
update public.calm_modes set active = false;
select tests.ok(tests.count($$select * from public.calm_modes where not active$$) = 1, 'mode embrouille : se désactive à la main');
update public.calm_modes set active = true;

-- ================================================================ 172 Demandes pratiques (missions)
select (public.calm_request_send(:'H', 'pickup', :'CP', 'Récupérer Lou à la crèche', now() + interval '3 hours', :'K1', :'CL'))->>'task_id' as calm_task \gset
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and mission_state = 'pending' and assignee_id = 'f27a0000-0000-4000-8000-000000000002' and notes is null and category = 'childcare'$$, :'calm_task')) = 1,
  'demande : une mission « à accepter » pour l''autre parent, sans description, catégorie du modèle');
select public.calm_request_send(:'H', 'pickup', :'CP', 'Récupérer Lou à la crèche', now() + interval '3 hours', :'K1', :'CL');
select tests.ok(tests.count($$select * from public.calm_requests where household_id = 'f27a0000-0000-4000-8000-0000000000a1'$$) = 1, 'demande : rejouée (même identifiant) sans doublon');
select tests.ok(tests.count(format($$select * from public.family_task_events where task_id = %L$$, :'calm_task')) >= 1, 'demande : historique des missions réutilisé');
select tests.throws(format($$select public.calm_request_send(%L, 'tell_you_what_i_think', %L, 'Texte libre')$$, :'H', :'CP'), 'demande : modèle inconnu refusé (aucun texte libre)');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, E'Courses\nEt aussi un long message')$$, :'H', :'CP'), 'demande : titre sur plusieurs lignes refusé');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, 'Faire les courses')$$, :'H', :'OW'), 'demande : jamais à soi-même');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, 'Faire les courses')$$, :'H', :'NN'), 'demande : jamais à la nounou (adultes du couple seulement)');
select tests.throws($$insert into public.calm_requests (household_id, task_id, template_key, from_user, to_user) select household_id, id, 'paper', 'f27a0000-0000-4000-8000-000000000001', 'f27a0000-0000-4000-8000-000000000002' from public.family_tasks limit 1$$,
  'demande : aucune écriture directe dans la table');
reset role;
select tests.ok(tests.count($$select * from public.notifications where user_id = 'f27a0000-0000-4000-8000-000000000002' and payload ? 'task_id'$$) = 1,
  'demande : le second parent est prévenu (notification neutre des missions)');
select tests.ok(not exists (select 1 from public.notifications where user_id = :'CP' and (title ~* '(encore|oubli|toujours|urgent|!)' or body ~* '(encore|oubli|toujours|urgent|!)')), 'demande : notification sans reproche');
set role authenticated; set request.jwt.claim.sub = :'OW';
-- Modification de l'heure par l'expéditeur
select (public.calm_request_update((select id from public.calm_requests where task_id = :'calm_task'), now() + interval '4 hours'))->>'status' = 'ok' as upd_ok \gset
select tests.ok(:'upd_ok'::boolean and tests.count(format($$select * from public.family_tasks where id = %L and due_at > now() + interval '3 hours 30 minutes'$$, :'calm_task')) = 1, 'demande : l''expéditeur change l''heure (mission mise à jour)');

set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.calm_requests') = 1, 'second parent : voit la demande reçue');
select tests.ok((public.calm_request_update((select id from public.calm_requests limit 1), now()))->>'status' = 'not_found', 'second parent : ne modifie pas la demande de l''autre');
select public.mission_respond(:'calm_task', 'accept');
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and mission_state = 'accepted'$$, :'calm_task')) = 1, 'réponse en un geste : « OK, je m''en occupe »');
select public.mission_respond(:'calm_task', 'complete');
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and mission_state = 'done' and done_by = 'f27a0000-0000-4000-8000-000000000002'$$, :'calm_task')) = 1, 'réponse en un geste : « Fait »');
select (public.calm_request_send(:'H', 'medicine', :'OW', 'Donner le médicament de Max', now() + interval '1 hour', :'K2', null))->>'task_id' as calm2 \gset
set request.jwt.claim.sub = :'OW';
select public.mission_respond(:'calm2', 'decline');
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and mission_state = 'declined'$$, :'calm2')) = 1, 'réponse en un geste : « Je ne peux pas » (sans justification)');
select tests.ok(tests.count('select * from public.calm_requests') = 2, 'historique : les deux demandes, envoyée et reçue');

set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.calm_requests') = 0, 'nounou : aucune demande du couple visible');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, 'Courses')$$, :'H', :'OW'), 'nounou : n''envoie pas de demande');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.calm_requests') = 0, 'non-membre : rien');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, 'Courses')$$, :'H', :'OW'), 'non-membre : n''envoie rien dans ce foyer');

-- ================================================================ 179 Moments à deux
set request.jwt.claim.sub = :'OW';
insert into public.couple_moments (household_id, idea_key, to_user, status, responded_at) values (:'H', 'walk_10', :'CP', 'done', now());
select tests.ok(tests.count($$select * from public.couple_moments where idea_key = 'walk_10' and status = 'proposed' and responded_at is null and from_user = 'f27a0000-0000-4000-8000-000000000001'$$) = 1,
  'moment : proposé (état et autrice posés par le serveur)');
reset role;
select tests.ok(tests.count($$select * from public.notifications where user_id = 'f27a0000-0000-4000-8000-000000000002' and deep_link = '/family/moments'$$) = 1, 'moment : l''autre est prévenu (texte neutre)');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws(format($$insert into public.couple_moments (household_id, idea_key, to_user) values (%L, 'coffee', %L)$$, :'H', :'NN'), 'moment : jamais à la nounou');
select tests.throws(format($$insert into public.couple_moments (household_id, idea_key, to_user) values (%L, 'coffee', %L)$$, :'H', :'OW'), 'moment : jamais à soi-même');
select tests.throws($$insert into public.couple_moments (household_id, idea_key, to_user) values ('f27a0000-0000-4000-8000-0000000000a1', 'Un texte libre !', 'f27a0000-0000-4000-8000-000000000002')$$, 'moment : idée de la bibliothèque seulement');
update public.couple_moments set status = 'accepted';
select tests.ok(tests.count($$select * from public.couple_moments where status = 'proposed'$$) = 1, 'moment : pas de changement direct d''état (sans effet)');
select id as mom from public.couple_moments where idea_key = 'walk_10' \gset
select tests.throws(format($$select public.couple_moment_respond(%L, 'accept')$$, :'mom'), 'moment : l''autrice ne répond pas à sa place');

set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_moments') = 1, 'second parent : voit la proposition');
select tests.ok((public.couple_moment_respond(:'mom', 'accept'))->>'status' = 'ok', 'moment : accepté sans justification');
select tests.ok((public.couple_moment_respond(:'mom', 'accept'))->>'unchanged' = 'true', 'moment : réponse rejouée = inchangée');
select tests.ok((public.couple_moment_respond(:'mom', 'plan', now() + interval '2 days', 10::smallint))->>'status' = 'ok'
  and tests.count($$select * from public.couple_moments where planned_at > now() + interval '1 day' and duration_minutes = 10$$) = 1, 'moment : planifié (agenda)');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.notifications where user_id = 'f27a0000-0000-4000-8000-000000000001' and deep_link = '/family/moments'$$) = 1, 'moment : acceptation annoncée à l''autrice');
select tests.ok((public.couple_moment_respond(:'mom', 'done'))->>'status' = 'ok' and tests.count($$select * from public.couple_moments where status = 'done' and done_at is not null$$) = 1, 'moment : noté comme passé (historique)');
insert into public.couple_moments (household_id, idea_key, to_user) values (:'H', 'coffee', :'CP');
set request.jwt.claim.sub = :'CP';
select tests.ok((public.couple_moment_respond((select id from public.couple_moments where idea_key = 'coffee'), 'decline'))->>'status' = 'ok', 'moment : décliné sans justification');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.notifications where user_id = 'f27a0000-0000-4000-8000-000000000001' and deep_link = '/family/moments'$$) = 1, 'moment décliné : l''autrice n''est pas notifiée d''un refus');
select tests.ok(tests.count('select * from public.couple_moments') = 2, 'historique des moments : deux lignes');
delete from public.couple_moments where idea_key = 'coffee';
select tests.ok(tests.count('select * from public.couple_moments') = 1, 'moment : l''autrice efface sa proposition');
set request.jwt.claim.sub = :'CP';
delete from public.couple_moments;
select tests.ok(tests.count('select * from public.couple_moments') = 1, 'moment : le destinataire n''efface pas la proposition de l''autre');

set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.couple_moments') = 0, 'nounou : aucun moment du couple');
select tests.ok((public.couple_moment_respond(:'mom', 'cancel'))->>'status' = 'not_found', 'nounou : ne peut pas agir sur un moment');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.couple_moments') = 0, 'non-membre : aucun moment');
select tests.throws(format($$insert into public.couple_moments (household_id, idea_key, to_user) values (%L, 'coffee', %L)$$, :'H', :'OW'), 'non-membre : ne propose rien');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
insert into public.couple_moments (household_id, idea_key, to_user) values (:'H', 'photos_month', :'OW');
select tests.ok(tests.count('select * from public.couple_moments') = 1, 'co-parent (avant départ) : voit sa proposition');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.couple_moments') = 0 and tests.count('select * from public.calm_requests') = 0, 'ancien membre : plus rien (moments, demandes)');
select tests.throws(format($$select public.calm_request_send(%L, 'groceries', %L, 'Courses')$$, :'H', :'OW'), 'ancien membre : n''envoie plus de demande');
select tests.ok((public.couple_moment_respond(:'mom', 'done'))->>'status' = 'not_found', 'ancien membre : aucune action sur un moment');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.couple_moments where idea_key = 'photos_month'$$) = 1, 'propriétaire : la proposition de l''ancien membre reste dans son historique');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'birth_feeding'->'couple_moments') = 2
  and jsonb_array_length(public.export_my_data()->'birth_feeding'->'calm_requests') = 2
  and (public.export_my_data()->'birth_feeding'->'calm_mode'->>'active')::boolean, 'export : mode, demandes et moments dans « Exporter mes données »');

reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false);
select tests.set_premium(:'XX', false); select tests.set_premium(:'NN', false);
