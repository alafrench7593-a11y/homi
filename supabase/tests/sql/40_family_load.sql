-- =====================================================================
-- Charge familiale : tâches, historique, récurrence, demandes de relais,
-- créneaux (nuit, temps pour soi), routines, cloisonnement des foyers.
-- Ana (propriétaire), Ben (coparent, droits par défaut), Carl (autre foyer).
-- =====================================================================
\set ANA  'e2e2e2e2-0000-4000-8000-000000000001'
\set BEN  'e2e2e2e2-0000-4000-8000-000000000002'
\set CARL 'e2e2e2e2-0000-4000-8000-000000000003'
\set FOYER 'e2e2e2e2-0000-4000-8000-0000000000f0'

insert into auth.users (id, email) values (:'ANA', 'fl-ana@exemple.test'), (:'BEN', 'fl-ben@exemple.test'), (:'CARL', 'fl-carl@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer d''Ana', :'ANA');
insert into public.household_members (household_id, user_id, role) values (:'FOYER', :'BEN', 'coparent');

set role authenticated; set request.jwt.claim.sub = :'ANA';
insert into public.family_tasks (household_id, title, category, assignee_id, due_at, recurrence, essential)
  values (:'FOYER', 'Biberons de la nuit', 'feeding', :'BEN', date_trunc('day', now()) + interval '22 hours', '{"type":"daily"}', true),
         (:'FOYER', 'Courses', 'shopping', null, now() + interval '1 day', null, false);
select tests.ok(tests.count('select * from public.family_task_events where kind = ''created''') = 2, 'tâches : création historisée');
select tests.throws(format($$insert into public.family_tasks (household_id, title, assignee_id) values (%L, 'X', %L)$$, :'FOYER', :'CARL'), 'tâches : impossible de confier une tâche à quelqu''un hors du foyer');
select tests.throws(format($$insert into public.family_tasks (household_id, title, recurrence) values (%L, 'X', '{"type":"hourly"}')$$, :'FOYER'), 'tâches : récurrence inconnue refusée');
select tests.throws($$insert into public.family_task_events (task_id, household_id, kind) select id, household_id, 'done' from public.family_tasks limit 1$$, 'historique : impossible d''écrire l''historique à la main');

set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.notifications where category = ''family'' and title = ''Une tâche vous est confiée''') = 1, 'tâches : Ben est prévenu qu''une tâche lui est confiée (texte neutre)');
update public.family_tasks set status = 'done' where title = 'Biberons de la nuit';
select tests.ok((select done_by = :'BEN' and done_at is not null from public.family_tasks where title = 'Biberons de la nuit' and status = 'done'), 'tâches : « fait par » et « fait le » renseignés par le serveur');
select tests.ok(tests.count('select * from public.family_tasks where title = ''Biberons de la nuit'' and status = ''todo'' and due_at > now()') = 1, 'récurrence : la prochaine occurrence est créée');
update public.family_tasks set status = 'todo' where title = 'Biberons de la nuit' and status = 'done';
update public.family_tasks set status = 'done' where title = 'Biberons de la nuit' and status = 'todo' and due_at < now() + interval '1 day' and due_at > now() - interval '1 day';
select tests.ok(tests.count('select * from public.family_tasks where title = ''Biberons de la nuit''') = 2, 'récurrence : refaire « fait » ne crée pas de doublon');

-- Demandes
insert into public.care_requests (household_id, kind, message) values (:'FOYER', 'rest', 'Je dors 2 h');
set request.jwt.claim.sub = :'ANA';
select tests.ok(tests.count('select * from public.notifications where title = ''Besoin de repos'' and body = ''Ouvrez l’application pour répondre.''') = 1, 'demandes : Ana est prévenue, sans détail sur l''écran verrouillé');
update public.care_requests set status = 'accepted';
select tests.ok((select status = 'accepted' and responded_by = :'ANA' from public.care_requests), 'demandes : Ana accepte, la réponse est horodatée');
set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.notifications where title = ''Demande acceptée''') = 1, 'demandes : Ben est prévenu de la réponse');
select tests.throws($$update public.care_requests set status = 'accepted'$$, 'demandes : on ne répond pas à sa propre demande');
-- « Peux-tu prendre cette tâche ? »
insert into public.care_requests (household_id, kind, task_id) select :'FOYER', 'take_task', id from public.family_tasks where title = 'Courses';
set request.jwt.claim.sub = :'ANA';
update public.care_requests set status = 'accepted' where kind = 'take_task';
select tests.ok((select assignee_id = :'ANA' from public.family_tasks where title = 'Courses'), 'demandes : tâche acceptée → elle change de responsable');
select tests.throws($$update public.care_requests set message = 'modifié' where kind = 'take_task'$$, 'demandes : une réponse ne réécrit pas le message de l''autre');

-- Créneaux
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (:'FOYER', 'night', :'BEN', date_trunc('day', now()) + interval '22 hours', date_trunc('day', now()) + interval '30 hours');
select tests.throws(format($$insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (%L, 'me_time', %L, now(), now() + interval '1 hour')$$, :'FOYER', :'BEN'), 'temps pour soi : on ne réserve pas le temps d''un autre');
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (:'FOYER', 'me_time', :'ANA', now() + interval '2 hours', now() + interval '4 hours');
select tests.throws(format($$insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (%L, 'night', %L, now(), now() + interval '30 hours')$$, :'FOYER', :'ANA'), 'créneaux : plus de 24 h refusé');
set request.jwt.claim.sub = :'BEN';
insert into public.care_requests (household_id, kind, shift_id) select :'FOYER', 'swap_slot', id from public.care_shifts where kind = 'night';
set request.jwt.claim.sub = :'ANA';
update public.care_requests set status = 'accepted' where kind = 'swap_slot';
select tests.ok((select user_id = :'ANA' and status = 'swapped' from public.care_shifts where kind = 'night'), 'relais de nuit : échange accepté → le créneau change de responsable');

-- Routines
insert into public.routines (household_id, title, kind, items) values (:'FOYER', 'Sac de crèche', 'bag', array['Couches','Tenue de rechange','Doudou']);
select tests.throws(format($$insert into public.routines (household_id, title, items) values (%L, 'Vide', '{}')$$, :'FOYER'), 'routines : au moins une étape');

-- Autre foyer
set request.jwt.claim.sub = :'CARL';
select tests.ok(tests.count('select * from public.family_tasks') + tests.count('select * from public.care_requests') + tests.count('select * from public.care_shifts') + tests.count('select * from public.routines') + tests.count('select * from public.family_task_events') = 0, 'cloisonnement : rien de visible depuis un autre foyer');
select tests.throws(format($$insert into public.care_requests (household_id, kind) values (%L, 'relay')$$, :'FOYER'), 'cloisonnement : impossible de demander un relais dans un foyer étranger');
reset role;

-- Ben sans le domaine « listes » : plus d'accès
update public.household_members set can_view = array['daily'] where user_id = :'BEN';
set role authenticated; set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.family_tasks') = 0, 'droits : sans « Listes et organisation », les tâches ne sont pas visibles');
reset role;
