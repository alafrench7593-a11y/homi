-- =====================================================================
-- Parcours : un seul parcours « corps » actif, journeys calculé, rappels coupés à l'archivage, visibilité,
-- besoins particuliers et traitements (foyer, domaine santé), naissance détaillée.
-- =====================================================================
\set ZOE  'ba5e0000-0000-4000-8000-000000000001'
\set YAN  'ba5e0000-0000-4000-8000-000000000002'
\set OUT  'ba5e0000-0000-4000-8000-000000000003'
\set FAM  'ba5e0000-0000-4000-8000-0000000000f1'
\set PREG 'ba5e0000-0000-4000-8000-0000000000a1'
\set KID  'ba5e0000-0000-4000-8000-0000000000c1'
\set LIM  'ba5e0000-0000-4000-8000-000000000004'
insert into auth.users (id, email) values (:'ZOE', 'p-zoe@exemple.test'), (:'YAN', 'p-yan@exemple.test'), (:'OUT', 'p-out@exemple.test'), (:'LIM', 'p-lim@exemple.test');
insert into public.profiles (id, display_name) values (:'ZOE', 'Zoé'), (:'YAN', 'Yan'), (:'OUT', 'Autre'), (:'LIM', 'Proche') on conflict (id) do nothing;
insert into public.households (id, name, created_by) values (:'FAM', 'Foyer Zoé', :'ZOE');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FAM', :'YAN', 'coparent',
  array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile'])
  on conflict do nothing;
-- Un proche avec des droits limités (quotidien seulement) : ne voit ni la grossesse ni son issue
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FAM', :'LIM', 'caregiver', array['daily'], array[]::text[]) on conflict do nothing;
insert into public.household_members (household_id, user_id, role) select :'FAM', :'ZOE', 'owner'
  where not exists (select 1 from public.household_members where household_id = :'FAM' and user_id = :'ZOE');

set role authenticated; set request.jwt.claim.sub = :'ZOE';
-- Projet bébé
insert into public.user_journeys (type, status, started_on, ended_on, end_reason) values ('cycle', 'archived', current_date - 60, current_date - 40, 'changed');
insert into public.user_journeys (type, started_on) values ('ttc', current_date - 30);
insert into public.period_entries (start_date) values (current_date - 50), (current_date - 10);
select tests.ok((select journeys = array['ttc'] from public.profiles where id = :'ZOE'), 'parcours : profiles.journeys calculé à partir du parcours actif');
select tests.throws($$insert into public.user_journeys (type) values ('avoid')$$, 'parcours : deux parcours « corps » actifs refusés (projet bébé + éviter)');
insert into public.reminders (category, title, schedule, deep_link, journey_type) values ('tracking', 'Test d''ovulation', '{"type":"daily","hour":8,"minute":0}', '/fertility/log', 'ttc');
insert into public.reminders (category, title, schedule, deep_link) values ('custom', 'Rappel général', '{"type":"daily","hour":9,"minute":0}', '/');
insert into public.reminders (category, title, schedule, deep_link) values ('tracking', 'Noter mes règles', '{"type":"daily","hour":20,"minute":0}', '/cycle');
select tests.ok((select journey_type = 'ttc' from public.reminders where title = 'Noter mes règles'), 'rappels : parcours déduit du lien (cycle pendant un projet bébé)');

-- Test positif : la grossesse démarre, le projet bébé est archivé
insert into public.pregnancies (id, household_id, carrier_user_id, due_date, lmp_date, due_date_source, positive_test_date, multiplicity)
  values (:'PREG', :'FAM', :'ZOE', current_date + 230, current_date - 50, 'lmp', current_date - 20, 'twins');
update public.user_journeys set status = 'archived', ended_on = current_date, end_reason = 'pregnancy' where type = 'ttc' and status = 'active';
insert into public.user_journeys (household_id, type, pregnancy_id) values (:'FAM', 'pregnancy', :'PREG');
select tests.ok((select journeys = array['pregnant'] from public.profiles where id = :'ZOE'), 'parcours : passage projet bébé → grossesse');
select tests.ok((select bool_and(not enabled) from public.reminders where journey_type = 'ttc') and (select enabled from public.reminders where title = 'Rappel général'),
  'parcours : rappels de l''ancien parcours désactivés, les autres conservés');
select tests.ok(tests.count('select * from public.user_journeys where status = ''archived'' and type = ''ttc''') = 1, 'parcours : ancien parcours conservé (archivé)');
select tests.throws($$insert into public.user_journeys (type) values ('pregnancy')$$, 'parcours : grossesse sans grossesse associée refusée');

-- Yan (coparent) voit la grossesse du foyer, pas le projet bébé archivé de Zoé
set request.jwt.claim.sub = :'YAN';
select tests.ok(tests.count('select * from public.user_journeys where user_id = ''ba5e0000-0000-4000-8000-000000000001''') = 1
  and tests.count('select * from public.user_journeys where type = ''ttc''') = 0, 'parcours : le foyer voit la grossesse, jamais le parcours cycle');
update public.user_journeys set status = 'archived', ended_on = current_date where type = 'pregnancy';
select tests.throws(format($$select public.delete_journey(%L)$$, (select id from public.user_journeys where type = 'pregnancy' limit 1)), 'parcours : un autre membre ne peut pas supprimer mes parcours');
set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.user_journeys where type = ''pregnancy'' and status = ''active''') = 1, 'parcours : un autre membre ne peut pas modifier mes parcours');

set request.jwt.claim.sub = :'LIM';
select tests.ok(tests.count('select * from public.user_journeys where type = ''pregnancy''') = 0, 'parcours : un proche sans droit « grossesse » ne voit pas le parcours grossesse');
select tests.ok(public._reminder_journey_type(:'ZOE'::uuid, '/cycle', null, null) = 'cycle', 'rappels : la fonction ne révèle pas le parcours d''une autre personne');
set request.jwt.claim.sub = :'ZOE';
-- Naissance des jumeaux : deux profils, post-partum, grossesse terminée
insert into public.children (id, household_id, first_name, birth_date, birth_time, birth_weight_g, birth_length_cm, birth_term_weeks, from_pregnancy_id)
  values (:'KID', :'FAM', 'Lina', current_date, '08:42', 2650, 46.5, 37, :'PREG');
insert into public.children (household_id, first_name, birth_date, birth_weight_g, from_pregnancy_id) values (:'FAM', 'Adam', current_date, 2810, :'PREG');
select tests.throws(format($$insert into public.children (household_id, first_name, birth_date, birth_weight_g) values (%L, 'X', current_date, 99999)$$, :'FAM'), 'naissance : poids hors limites refusé');
update public.pregnancies set status = 'born', end_reason = 'born', ended_on = current_date where id = :'PREG';
update public.user_journeys set status = 'archived', ended_on = current_date, end_reason = 'born' where type = 'pregnancy';
insert into public.user_journeys (type) values ('postpartum');
select tests.throws(format($$insert into public.user_journeys (type, pregnancy_id) values ('cycle', %L)$$, :'PREG'), 'parcours : seul un parcours grossesse est rattaché à une grossesse');
insert into public.user_journeys (household_id, type, child_id) select :'FAM', 'baby', id from public.children where from_pregnancy_id = :'PREG';
select tests.ok((select journeys @> array['newborn','family'] and not journeys @> array['pregnant'] from public.profiles where id = :'ZOE'), 'parcours : grossesse terminée, post-partum et bébés actifs');
select tests.throws(format($$insert into public.user_journeys (household_id, type, child_id) values (%L, 'baby', %L)$$, :'FAM', :'KID'), 'parcours : un seul parcours actif par enfant');
-- Jumeaux : fermer le parcours bébé de Lina n'arrête pas les rappels d'Adam
insert into public.reminders (category, title, schedule, deep_link, child_id, journey_type)
  select 'bottle', 'Biberon ' || first_name, '{"type":"daily","hour":10,"minute":0}', '/bottle/' || id, id, 'baby' from public.children where from_pregnancy_id = :'PREG';
update public.user_journeys set status = 'archived', ended_on = current_date, end_reason = 'changed' where type = 'baby' and child_id = :'KID';
select tests.ok((select not enabled from public.reminders where title = 'Biberon Lina') and (select enabled from public.reminders where title = 'Biberon Adam'),
  'rappels : fermer le parcours d''un jumeau n''arrête que ses propres rappels');
update public.user_journeys set status = 'active', ended_on = null, end_reason = null where type = 'baby' and child_id = :'KID';

-- Besoins particuliers et traitement : foyer (santé) oui, personne extérieure non
insert into public.child_needs (household_id, child_id, kinds) values (:'FAM', :'KID', array['adhd','assessment']);
select tests.throws(format($$insert into public.child_needs (household_id, child_id, kinds) values (%L, %L, array['diagnostic_auto'])$$, :'FAM', :'KID'), 'besoins : catégorie inconnue refusée');
update public.child_needs set kinds = array['adhd','questions'] where child_id = :'KID';
select tests.ok((select kinds from public.child_needs where child_id = :'KID') = array['adhd','questions'], 'besoins : « Je me pose des questions » accepté, sans diagnostic');
insert into public.child_treatments (household_id, child_id, name, dose_text, times, start_date, instructions)
  values (:'FAM', :'KID', 'Traitement prescrit', '1 gélule (dose de l''ordonnance)', array['08:00'], current_date, 'Au petit-déjeuner');
select tests.throws(format($$insert into public.child_treatments (household_id, child_id, name, dose_text, times, start_date) values (%L, %L, 'X', 'Y', '{}', current_date)$$, :'FAM', :'KID'), 'traitement : au moins une heure de prise');
insert into public.treatment_logs (household_id, treatment_id, scheduled_for, status, note)
  select :'FAM', id, date_trunc('day', now()) + interval '8 hours', 'taken', 'Bien pris' from public.child_treatments;
select tests.throws(format($$insert into public.treatment_logs (household_id, treatment_id, scheduled_for, status) select %L, id, date_trunc('day', now()) + interval '8 hours', 'skipped' from public.child_treatments$$, :'FAM'),
  'traitement : une seule réponse par prise prévue');
set request.jwt.claim.sub = :'YAN';
select tests.ok(tests.count('select * from public.child_treatments') = 1 and tests.count('select * from public.treatment_logs') = 1, 'traitement : visible par le coparent (droits santé)');
set request.jwt.claim.sub = :'OUT';
select tests.ok(tests.count('select * from public.child_needs') + tests.count('select * from public.child_treatments') + tests.count('select * from public.user_journeys') = 0,
  'isolation : une personne extérieure ne voit ni besoins, ni traitements, ni parcours');

-- Suppression définitive demandée : grossesse archivée supprimée → parcours associé supprimé aussi
set request.jwt.claim.sub = :'ZOE';
select public.delete_journey((select id from public.user_journeys where type = 'ttc' and status = 'archived'));
select tests.ok(tests.count('select * from public.user_journeys where type = ''ttc''') = 0, 'parcours : suppression définitive d''un parcours archivé');
select tests.ok(tests.count('select * from public.period_entries where start_date = current_date - 10') = 0
  and tests.count('select * from public.period_entries where start_date = current_date - 50') = 1,
  'parcours : seules les données de la période du parcours supprimé sont effacées');

-- Supprimer la grossesse archivée : le post-partum et les parcours bébé restent
select public.delete_journey((select id from public.user_journeys where type = 'pregnancy'));
select tests.ok(tests.count('select * from public.user_journeys where status = ''active'' and type in (''postpartum'', ''baby'')') = 3
  and tests.count('select * from public.children where first_name in (''Lina'', ''Adam'')') = 2,
  'parcours : supprimer l''ancienne grossesse ne touche ni le post-partum ni les enfants');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'user_journeys') >= 3, 'export : parcours inclus');
reset role;
