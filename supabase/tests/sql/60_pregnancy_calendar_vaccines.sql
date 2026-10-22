-- =====================================================================
-- Symptômes de grossesse (personnels), vaccins reportés (foyer, par enfant), calendrier vaccinal versionné.
-- =====================================================================
\set PA 'b0e60000-0000-4000-8000-000000000001'
\set PB 'b0e60000-0000-4000-8000-000000000002'
\set PX 'b0e60000-0000-4000-8000-000000000003'
\set PADM 'b0e60000-0000-4000-8000-000000000004'
\set HF 'b0e60000-0000-4000-8000-0000000000f0'
\set HX 'b0e60000-0000-4000-8000-0000000000f1'
\set LINA 'b0e60000-0000-4000-8000-0000000000c1'
\set NOE 'b0e60000-0000-4000-8000-0000000000c2'
reset role;
insert into auth.users (id, email) values (:'PA', 'preg-a@exemple.test'), (:'PB', 'preg-b@exemple.test'), (:'PX', 'preg-x@exemple.test'), (:'PADM', 'preg-adm@exemple.test');
insert into public.households (id, name, created_by) values (:'HF', 'Foyer vaccins', :'PA'), (:'HX', 'Autre foyer', :'PX');
insert into public.household_members (household_id, user_id, role) values (:'HF', :'PA', 'owner'), (:'HF', :'PB', 'coparent'), (:'HX', :'PX', 'owner') on conflict do nothing;
insert into public.children (id, household_id, first_name, birth_date) values (:'LINA', :'HF', 'Lina', current_date - 200), (:'NOE', :'HF', 'Noé', current_date - 2000);
insert into public.user_roles (user_id, role) values (:'PADM', 'admin') on conflict do nothing;

-- Symptômes : strictement personnels
set role authenticated; set request.jwt.claim.sub = :'PA';
insert into public.pregnancy_symptom_logs (symptom, intensity, frequency, note, week_sa) values ('nausea', 2, 'several', 'le matin', 9);
select tests.throws($$insert into public.pregnancy_symptom_logs (symptom, intensity) values ('nausea', 5)$$, 'symptôme : intensité 1 à 3 seulement');
select tests.throws($$insert into public.pregnancy_symptom_logs (symptom, frequency) values ('nausea', 'toujours')$$, 'symptôme : fréquence contrôlée');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'pregnancy_symptom_logs') = 1, 'export RGPD : symptômes de grossesse inclus');
update public.pregnancy_symptom_logs set intensity = 3 where symptom = 'nausea';
select tests.ok((select intensity from public.pregnancy_symptom_logs limit 1) = 3, 'symptôme : modification par la personne');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PB';
select tests.ok(tests.count('select * from public.pregnancy_symptom_logs') = 0, 'symptômes : jamais visibles du co-parent');
reset role;

-- Vaccins reportés : par enfant, dans le foyer seulement
set role authenticated; set request.jwt.claim.sub = :'PA';
insert into public.child_vaccine_postponements (household_id, child_id, calendar_key, postponed_to, note) values (:'HF', :'LINA', 'menb_2', current_date + 14, 'fièvre');
select tests.throws(format($$insert into public.child_vaccine_postponements (household_id, child_id, calendar_key) values (%L, %L, 'menb_2')$$, :'HF', :'LINA'), 'report : une seule ligne par dose et par enfant');
select tests.throws(format($$insert into public.child_vaccine_postponements (household_id, child_id, calendar_key) values (%L, %L, 'Bad Key!')$$, :'HF', :'LINA'), 'report : clé du calendrier contrôlée');
select tests.ok(tests.count(format('select * from public.child_vaccine_postponements where child_id = %L', :'NOE')) = 0, 'report : jamais mélangé entre Lina et Noé');
insert into public.appointments (household_id, child_id, kind, title, starts_at, document_ids) values (:'HF', :'LINA', 'vaccination', 'Vaccins de Lina', now() + interval '10 days', array[gen_random_uuid()]);
select tests.ok((select cardinality(document_ids) from public.appointments where child_id = :'LINA') = 1, 'rendez-vous : document joint');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PB';
select tests.ok(tests.count('select * from public.child_vaccine_postponements') = 1, 'report : visible du co-parent du foyer');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PX';
select tests.ok(tests.count('select * from public.child_vaccine_postponements') = 0, 'report : invisible d''un autre foyer');
select tests.throws(format($$insert into public.child_vaccine_postponements (household_id, child_id, calendar_key) values (%L, %L, 'hexa_2')$$, :'HX', :'LINA'), 'report : impossible pour l''enfant d''un autre foyer');
reset role;

-- Calendrier vaccinal versionné : lecture si publié, écriture réservée à l'administration
set role authenticated; set request.jwt.claim.sub = :'PA';
select tests.throws($$insert into public.vaccine_calendars (country, version, label, effective_from, updated_on, source_url, rules, published) values ('FR', '2027', 'Calendrier 2027', '2027-04-01', '2027-04-01', 'https://exemple.test', '[]', true)$$, 'calendrier : écriture interdite aux comptes');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PADM';
insert into public.vaccine_calendars (country, version, label, effective_from, updated_on, source_url, rules, published) values ('FR', '2027-draft', 'Brouillon', '2027-04-01', '2027-04-01', 'https://exemple.test', '[]', false);
insert into public.vaccine_calendars (country, version, label, effective_from, updated_on, source_url, rules, published) values ('FR', '2027', 'Calendrier 2027', '2027-04-01', '2027-04-01', 'https://exemple.test', '[{"key":"hexa_1"}]', true);
select tests.throws($$insert into public.vaccine_calendars (country, version, label, effective_from, updated_on, source_url, rules) values ('FR', '2028', 'x', '2028-01-01', '2028-01-01', 'http://non-securise.test', '[]')$$, 'calendrier : source en https obligatoire');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PA';
select tests.ok(tests.count('select * from public.vaccine_calendars') = 1, 'calendrier : seulement les versions publiées sont lues');
reset role;
