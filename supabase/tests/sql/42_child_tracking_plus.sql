-- =====================================================================
-- Compléments du suivi de l'enfant : chronomètre biberon, sommeil, selles,
-- observations digestives, bien-être, suivi de santé (seuils du plan seulement),
-- vaccins, produits à éviter, droits par domaine.
-- =====================================================================
\set HUGO 'a4a4a4a4-0000-4000-8000-000000000001'
\set IDA  'a4a4a4a4-0000-4000-8000-000000000002'
\set JOE  'a4a4a4a4-0000-4000-8000-000000000003'
\set FOYER 'a4a4a4a4-0000-4000-8000-0000000000f0'
\set AUTRE 'a4a4a4a4-0000-4000-8000-0000000000f1'
\set BEBE 'a4a4a4a4-0000-4000-8000-0000000000c1'
\set BEBE2 'a4a4a4a4-0000-4000-8000-0000000000c2'

insert into auth.users (id, email) values (:'HUGO', 'ct-hugo@exemple.test'), (:'IDA', 'ct-ida@exemple.test'), (:'JOE', 'ct-joe@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer de Hugo', :'HUGO'), (:'AUTRE', 'Foyer de Joe', :'JOE');
-- Ida : aide à domicile, quotidien seulement (pas la santé)
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FOYER', :'IDA', 'caregiver', array['daily'], array['daily']);
insert into public.children (id, household_id, first_name, birth_date) values (:'BEBE', :'FOYER', 'Noé', current_date - 120), (:'BEBE2', :'AUTRE', 'Zia', current_date - 90);

set role authenticated; set request.jwt.claim.sub = :'HUGO';
-- Biberon chronométré
insert into public.bottles (child_id, household_id, at, started_at, in_progress) values (:'BEBE', :'FOYER', now(), now() - interval '5 minutes', true);
select tests.throws(format($$insert into public.bottles (child_id, household_id, at, started_at, in_progress) values (%L, %L, now(), now(), true)$$, :'BEBE', :'FOYER'), 'chronomètre : un seul biberon en cours par enfant');
update public.bottles set paused_at = now(), paused_seconds = 0 where in_progress;
update public.bottles set paused_at = null, paused_seconds = 60, ended_at = now(), in_progress = false, consumed_ml = 90, prepared_ml = 120 where in_progress;
select tests.ok((select ended_at >= started_at and paused_seconds = 60 and not in_progress from public.bottles where child_id = :'BEBE'), 'chronomètre : pause, reprise et fin enregistrées');
select tests.throws(format($$insert into public.bottles (child_id, household_id, at, in_progress) values (%L, %L, now(), true)$$, :'BEBE', :'FOYER'), 'chronomètre : « en cours » exige une heure de début');

-- Sommeil, selles, observations
insert into public.sleeps (child_id, household_id, started_at, ended_at, kind, wake_events) values (:'BEBE', :'FOYER', now() - interval '9 hours', now() - interval '1 hour', 'night', '[{"at":"2026-10-18T02:10:00Z","minutes":15}]');
select tests.throws(format($$insert into public.sleeps (child_id, household_id, started_at, ended_at, kind) values (%L, %L, now() - interval '2 hours', now(), 'sieste')$$, :'BEBE', :'FOYER'), 'sommeil : type inconnu refusé');
insert into public.diapers (child_id, household_id, at, stool, stool_color, stool_consistency, blood_seen) values (:'BEBE', :'FOYER', now(), true, 'pale', 'soft', false);
select tests.throws(format($$insert into public.diapers (child_id, household_id, at, stool, stool_color) values (%L, %L, now(), true, 'violet')$$, :'BEBE', :'FOYER'), 'selles : couleur inconnue refusée');
insert into public.child_observations (child_id, household_id, at, kind, intensity) values (:'BEBE', :'FOYER', now(), 'vomit', 2), (:'BEBE', :'FOYER', now(), 'bloating', 1);
insert into public.child_observations (child_id, household_id, at, kind, value_num, temp_method) values (:'BEBE', :'FOYER', now(), 'temperature', 38.4, 'rectal');
select tests.ok(tests.count('select * from public.child_observations where kind in (''vomit'',''bloating'')') = 2, 'observations : vomissements et ballonnements acceptés');

-- Bien-être
insert into public.child_wellbeing (child_id, household_id, mood, crying, appetite, note) values (:'BEBE', :'FOYER', 3, 2, 2, 'Grognon après la crèche');
select tests.throws(format($$insert into public.child_wellbeing (child_id, household_id, mood) values (%L, %L, 3)$$, :'BEBE2', :'FOYER'), 'bien-être : enfant d''un autre foyer refusé');

-- Suivi de santé : seuils uniquement depuis un plan validé
insert into public.child_health_trackers (id, child_id, household_id, kind, label, unit, plan_note, plan_by, plan_date, low_threshold, high_threshold, thresholds_from_plan, contexts)
  values ('a4a4a4a4-0000-4000-8000-0000000000d1', :'BEBE', :'FOYER', 'measure', 'Glycémie capillaire', 'g/L', 'Contrôles selon le protocole remis.', 'Dr Martin, diabétologue', current_date - 10, 0.7, 1.8, true, array['avant repas','au coucher']);
select tests.throws(format($$insert into public.child_health_trackers (child_id, household_id, kind, label, unit, high_threshold) values (%L, %L, 'measure', 'Glycémie', 'g/L', 2)$$, :'BEBE', :'FOYER'), 'santé : un seuil sans plan validé est refusé');
select tests.throws(format($$insert into public.child_health_trackers (child_id, household_id, kind, label, high_threshold, thresholds_from_plan) values (%L, %L, 'observation', 'Attention', 3, true)$$, :'BEBE', :'FOYER'), 'santé : pas de seuil sur une observation');
insert into public.child_health_trackers (id, child_id, household_id, kind, label, contexts) values ('a4a4a4a4-0000-4000-8000-0000000000d2', :'BEBE', :'FOYER', 'observation', 'Attention et concentration', array['maison','école']);
insert into public.child_health_entries (tracker_id, child_id, household_id, value, context, source) values ('a4a4a4a4-0000-4000-8000-0000000000d1', :'BEBE', :'FOYER', 1.2, 'avant repas', 'parent');
select tests.throws(format($$insert into public.child_health_entries (tracker_id, child_id, household_id, value) values ('a4a4a4a4-0000-4000-8000-0000000000d2', %L, %L, 5)$$, :'BEBE', :'FOYER'), 'santé : une observation ne prend pas de valeur chiffrée');
insert into public.child_health_entries (tracker_id, child_id, household_id, context, note, source) values ('a4a4a4a4-0000-4000-8000-0000000000d2', :'BEBE', :'FOYER', 'école', 'Mot de la maîtresse : difficile de rester assis', 'imported');
select tests.ok(not exists (select 1 from information_schema.columns where table_name in ('child_health_trackers','child_health_entries') and column_name ~ '(dose|diagnos|score|insulin)'),
  'santé : aucune colonne de dose, de diagnostic ou de score');

-- Vaccins, produits à éviter
insert into public.child_vaccinations (child_id, household_id, vaccine, given_on, dose_label, source) values (:'BEBE', :'FOYER', 'Hexavalent', current_date - 60, '1re injection', 'carnet');
select tests.throws(format($$insert into public.child_vaccinations (child_id, household_id, vaccine, given_on) values (%L, %L, 'X', current_date + 3)$$, :'BEBE', :'FOYER'), 'vaccins : date future refusée (registre de ce qui a été fait)');
insert into public.avoid_products (household_id, child_id, barcode, product_name, reason) values (:'FOYER', :'BEBE', '3017620422003', 'Pâte à tartiner', 'Contient des noisettes');
select tests.throws(format($$insert into public.avoid_products (household_id, child_id, barcode, product_name) values (%L, %L, '3017620422003', 'Doublon')$$, :'FOYER', :'BEBE'), 'à éviter : pas de doublon pour le même enfant');

-- ================================================================ IDA (quotidien seulement)
set request.jwt.claim.sub = :'IDA';
select tests.ok(tests.count('select * from public.child_wellbeing') = 1, 'droits : l''aide à domicile voit le bien-être (quotidien)');
select tests.ok(tests.count('select * from public.child_health_trackers') + tests.count('select * from public.child_health_entries') + tests.count('select * from public.child_vaccinations') + tests.count('select * from public.avoid_products') = 0,
  'droits : sans le domaine « santé », ni suivi de santé, ni vaccins, ni produits à éviter');
-- ================================================================ JOE (autre foyer)
set request.jwt.claim.sub = :'JOE';
select tests.ok(tests.count('select * from public.child_wellbeing') + tests.count('select * from public.child_health_entries') = 0, 'cloisonnement : rien de l''enfant d''un autre foyer');
reset role;
