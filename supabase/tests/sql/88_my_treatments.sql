-- Traitements de la maman : strictement personnels, prises notées uniquement sur ses propres traitements.
\set MA 'd0880000-0000-4000-8000-000000000001'
\set MB 'd0880000-0000-4000-8000-000000000002'
\set MH 'd0880000-0000-4000-8000-0000000000f1'
\set MT1 'd0880000-0000-4000-8000-0000000000a1'
\set MT2 'd0880000-0000-4000-8000-0000000000a2'
reset role;
insert into auth.users (id, email) values (:'MA', 'med-a@exemple.test'), (:'MB', 'med-b@exemple.test');
insert into public.households (id, name, created_by) values (:'MH', 'Foyer médicaments', :'MA');
insert into public.household_members (household_id, user_id, role) values (:'MH', :'MA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'MH', :'MB', 'coparent') on conflict do nothing;
insert into public.my_treatments (id, user_id, name, dose_text, times, start_date) values (:'MT2', :'MB', 'Traitement de B', '1 comprimé', '{08:00}', current_date);

set role authenticated; set request.jwt.claim.sub = :'MA';
insert into public.my_treatments (id, name, dose_text, times, start_date) values (:'MT1', 'Fer', '1 comprimé', '{08:00,20:00}', current_date);
select tests.ok((select count(*) from public.my_treatments) = 1, 'mes traitements : je ne vois que les miens');
select tests.throws($$insert into public.my_treatments (name, dose_text, times, start_date) values ('X', '  ', '{08:00}', current_date)$$, 'mes traitements : dose obligatoire');
select tests.throws($$insert into public.my_treatments (name, dose_text, times, start_date) values ('X', '1', '{}', current_date)$$, 'mes traitements : au moins une heure de prise');
select tests.throws($$insert into public.my_treatments (name, dose_text, times, start_date, end_date) values ('X', '1', '{08:00}', current_date, current_date - 1)$$, 'mes traitements : fin après le début');
insert into public.my_treatment_logs (treatment_id, scheduled_for, status) values (:'MT1', date_trunc('day', now()) + interval '8 hours', 'taken');
select tests.ok((select count(*) from public.my_treatment_logs) = 1, 'mes traitements : prise notée');
select tests.throws(format('insert into public.my_treatment_logs (treatment_id, scheduled_for, status) values (%L, now(), %L)', :'MT1', 'perdu'), 'mes traitements : statut borné');
select tests.throws(format('insert into public.my_treatment_logs (treatment_id, scheduled_for, status) values (%L, now(), %L)', :'MT2', 'taken'), 'mes traitements : impossible de noter la prise de quelqu''un d''autre');
insert into public.reminders (user_id, household_id, category, title, schedule, timezone, enabled, my_treatment_id) values
  (:'MA', :'MH', 'medication', 'Fer', '{"type":"daily","hour":8,"minute":0}', 'Europe/Paris', true, :'MT1');
select tests.ok((select count(*) from public.reminders where my_treatment_id = :'MT1') = 1, 'mes traitements : rappel lié');
select tests.throws(format('insert into public.reminders (user_id, household_id, category, title, schedule, timezone, enabled, my_treatment_id) values (%L, %L, %L, %L, %L, %L, true, %L)', :'MA', :'MH', 'medication', 'X', '{"type":"daily","hour":8,"minute":0}', 'Europe/Paris', :'MT2'), 'mes traitements : rappel impossible sur le traitement de quelqu''un d''autre');
select tests.ok(jsonb_array_length(public.export_my_data()->'my_treatments') = 1 and jsonb_array_length(public.export_my_data()->'my_treatment_logs') = 1 and public.export_my_data() ? 'daily_checks', 'mes traitements : export RGPD complet');

set request.jwt.claim.sub = :'MB';
select tests.ok((select count(*) from public.my_treatments where id = :'MT1') = 0 and (select count(*) from public.my_treatment_logs) = 0, 'mes traitements : invisibles pour le co-parent');
update public.my_treatments set name = 'piraté' where id = :'MT1';
reset role;
select tests.ok((select name from public.my_treatments where id = :'MT1') = 'Fer', 'mes traitements : le co-parent ne peut pas les modifier');
delete from public.my_treatments where id = :'MT1';
select tests.ok((select count(*) from public.reminders where my_treatment_id = 'd0880000-0000-4000-8000-0000000000a1') = 0 and (select count(*) from public.my_treatment_logs where treatment_id = 'd0880000-0000-4000-8000-0000000000a1') = 0, 'mes traitements : rappels et prises supprimés avec le traitement');
