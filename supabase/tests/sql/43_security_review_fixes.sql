-- =====================================================================
-- Non-régression des failles trouvées par la relecture de sécurité indépendante.
-- Mia (propriétaire), Nils (coparent, tous les droits), Oli (proche sans « organisation »).
-- =====================================================================
\set MIA  'b5b5b5b5-0000-4000-8000-000000000001'
\set NILS 'b5b5b5b5-0000-4000-8000-000000000002'
\set OLI  'b5b5b5b5-0000-4000-8000-000000000003'
\set FOYER 'b5b5b5b5-0000-4000-8000-0000000000f0'
\set METIME 'b5b5b5b5-0000-4000-8000-0000000000a1'
\set NUIT   'b5b5b5b5-0000-4000-8000-0000000000a2'

insert into auth.users (id, email) values (:'MIA', 'sec-mia@exemple.test'), (:'NILS', 'sec-nils@exemple.test'), (:'OLI', 'sec-oli@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer de Mia', :'MIA');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 (:'FOYER', :'NILS', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']),
 (:'FOYER', :'OLI', 'caregiver', array['daily'], array['daily']);

-- ================================================================ 1. export : rendez-vous privé d'un autre membre
set role authenticated; set request.jwt.claim.sub = :'MIA';
insert into public.appointments (household_id, for_parent, kind, title, starts_at, private_to_creator) values (:'FOYER', true, 'consultation', 'PSY-SECRET', now() + interval '1 day', true);
insert into public.appointments (household_id, for_parent, kind, title, starts_at) values (:'FOYER', false, 'pediatric', 'Pédiatre partagé', now() + interval '2 days');
select tests.ok(public.export_my_data()::text like '%PSY-SECRET%', 'export : Mia retrouve son propre rendez-vous privé');
set request.jwt.claim.sub = :'NILS';
select tests.ok(public.export_my_data()::text not like '%PSY-SECRET%', 'export : le rendez-vous privé de Mia n''apparaît pas dans l''export de Nils');
select tests.ok(public.export_my_data()::text like '%Pédiatre partagé%', 'export : les rendez-vous partagés restent dans l''export');

-- ================================================================ 2. échange : s'approprier le temps pour soi d'un autre
set request.jwt.claim.sub = :'MIA';
insert into public.care_shifts (id, household_id, kind, user_id, starts_at, ends_at) values (:'METIME', :'FOYER', 'me_time', :'MIA', now() + interval '3 hours', now() + interval '4 hours');
insert into public.care_shifts (id, household_id, kind, user_id, starts_at, ends_at) values (:'NUIT', :'FOYER', 'night', :'MIA', now() + interval '10 hours', now() + interval '18 hours');
select tests.throws(format($$insert into public.care_requests (household_id, kind, shift_id) values (%L, 'swap_slot', %L)$$, :'FOYER', :'METIME'), 'échange : un temps pour soi ne peut pas être proposé à l''échange');
insert into public.care_requests (household_id, kind, shift_id) values (:'FOYER', 'swap_slot', :'NUIT');
set request.jwt.claim.sub = :'NILS';
select tests.throws(format($$update public.care_requests set shift_id = %L, status = 'accepted' where kind = 'swap_slot'$$, :'METIME'), 'échange : le créneau visé ne peut pas être remplacé en répondant');
select tests.throws(format($$insert into public.care_requests (household_id, kind, shift_id) values (%L, 'swap_slot', %L)$$, :'FOYER', :'NUIT'), 'échange : on ne propose que ses propres nuits');
update public.care_requests set status = 'accepted' where kind = 'swap_slot';
select tests.ok((select user_id = :'NILS' from public.care_shifts where id = :'NUIT') and (select user_id = :'MIA' from public.care_shifts where id = :'METIME'),
  'échange : la nuit change de responsable, le temps pour soi de Mia reste à Mia');

-- ================================================================ 3. temps pour soi d'un autre
select tests.throws(format($$update public.care_shifts set status = 'cancelled' where id = %L$$, :'METIME'), 'temps pour soi : un autre membre ne peut pas l''annuler');
select tests.throws(format($$delete from public.care_shifts where id = %L$$, :'METIME'), 'temps pour soi : un autre membre ne peut pas le supprimer');
select tests.throws(format($$update public.care_shifts set kind = 'me_time' where id = %L$$, :'NUIT'), 'créneaux : le type ne change pas');

-- ================================================================ 9. demande traitée rouverte
set request.jwt.claim.sub = :'MIA';
select tests.throws($$update public.care_requests set status = 'open' where kind = 'swap_slot'$$, 'demandes : une demande acceptée ne peut pas être rouverte');

-- ================================================================ 5 + 8. tâches : notification neutre, droits, « fait par »
insert into public.family_tasks (household_id, title, assignee_id) values (:'FOYER', 'Rendez-vous chez le psychiatre', :'NILS');
insert into public.family_tasks (household_id, title, assignee_id) values (:'FOYER', 'Tâche pour Oli', :'OLI');
set request.jwt.claim.sub = :'NILS';
select tests.ok((select count(*) = 1 and bool_and(body = 'Ouvrez l’application pour la voir.') from public.notifications where title = 'Une tâche vous est confiée'), 'tâches : notification sans le titre de la tâche');
update public.family_tasks set status = 'done', done_by = :'MIA' where title = 'Rendez-vous chez le psychiatre';
select tests.ok((select done_by = :'NILS' from public.family_tasks where title = 'Rendez-vous chez le psychiatre'), 'tâches : « fait par » est toujours la personne connectée');
set request.jwt.claim.sub = :'OLI';
select tests.ok(tests.count('select * from public.notifications where category = ''family''') = 0, 'tâches : pas de notification pour qui n''a pas accès à l''organisation');

-- ================================================================ 4. départ du foyer
set request.jwt.claim.sub = :'MIA';
insert into public.postpartum_settings (share_household_id, share_rest_need) values (:'FOYER', true);
insert into public.postpartum_shared_status (household_id, rest_need) values (:'FOYER', 'high');
set request.jwt.claim.sub = :'NILS';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 1, 'partage : visible tant que Mia est dans le foyer');
reset role;
delete from public.household_members where user_id = :'MIA' and household_id = :'FOYER';
set role authenticated; set request.jwt.claim.sub = :'NILS';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 0, 'partage : invisible dès que Mia quitte le foyer');
set request.jwt.claim.sub = :'MIA';
select tests.ok((select share_household_id is null from public.postpartum_settings), 'partage : le foyer choisi est oublié au départ');

-- ================================================================ 10. professionnel vide
reset role;
insert into public.household_members (household_id, user_id, role) values (:'FOYER', :'MIA', 'owner');
insert into public.children (id, household_id, first_name, birth_date) values ('b5b5b5b5-0000-4000-8000-0000000000c1', :'FOYER', 'Léo', current_date - 900);
set role authenticated; set request.jwt.claim.sub = :'MIA';
select tests.throws(format($$insert into public.child_health_trackers (child_id, household_id, kind, label, high_threshold, thresholds_from_plan, plan_by) values ('b5b5b5b5-0000-4000-8000-0000000000c1', %L, 'measure', 'X', 2, true, '   ')$$, :'FOYER'), 'santé : un repère exige le nom du professionnel (pas d''espaces)');
reset role;
