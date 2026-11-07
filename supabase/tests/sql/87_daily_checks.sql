-- « C'est fait » sur un rappel : personnel, une validation par jour, seulement sur ses propres rappels.
\set DA 'd0870000-0000-4000-8000-000000000001'
\set DB 'd0870000-0000-4000-8000-000000000002'
\set DH 'd0870000-0000-4000-8000-0000000000f1'
\set DR1 'd0870000-0000-4000-8000-0000000000a1'
\set DR2 'd0870000-0000-4000-8000-0000000000a2'
reset role;
insert into auth.users (id, email) values (:'DA', 'check-a@exemple.test'), (:'DB', 'check-b@exemple.test');
insert into public.households (id, name, created_by) values (:'DH', 'Foyer checks', :'DA');
insert into public.household_members (household_id, user_id, role) values (:'DH', :'DA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'DH', :'DB', 'coparent') on conflict do nothing;
insert into public.reminders (id, user_id, household_id, category, title, schedule, timezone, enabled) values
  (:'DR1', :'DA', :'DH', 'custom', 'Vitamine D', '{"type":"daily","hour":8,"minute":30}', 'Europe/Paris', true),
  (:'DR2', :'DB', :'DH', 'custom', 'Rappel de B', '{"type":"daily","hour":9,"minute":0}', 'Europe/Paris', true);

set role authenticated; set request.jwt.claim.sub = :'DA';
insert into public.daily_checks (reminder_id, on_date, source) values (:'DR1', current_date, 'notification');
select tests.ok((select count(*) from public.daily_checks) = 1, 'c''est fait : rappel validé pour aujourd''hui');
select tests.throws(format('insert into public.daily_checks (reminder_id, on_date) values (%L, current_date)', :'DR1'), 'c''est fait : une seule validation par jour');
insert into public.daily_checks (reminder_id, on_date) values (:'DR1', current_date - 1);
select tests.ok((select count(*) from public.daily_checks) = 2, 'c''est fait : un autre jour se valide à part');
select tests.throws(format('insert into public.daily_checks (reminder_id, on_date) values (%L, current_date)', :'DR2'), 'c''est fait : impossible de valider le rappel de quelqu''un d''autre');
select tests.throws(format('insert into public.daily_checks (reminder_id, on_date, source) values (%L, current_date - 2, %L)', :'DR1', 'pirate'), 'c''est fait : source bornée');
delete from public.daily_checks where on_date = current_date - 1;
select tests.ok((select count(*) from public.daily_checks) = 1, 'c''est fait : décocher');

set request.jwt.claim.sub = :'DB';
select tests.ok((select count(*) from public.daily_checks) = 0, 'c''est fait : jamais visible des autres membres du foyer');

set request.jwt.claim.sub = :'DA';
select tests.ok(jsonb_array_length(public.export_my_data()->'daily_checks') = 1 and public.export_my_data() ? 'support_circle', 'c''est fait : export RGPD complet');
reset role;
delete from public.reminders where id = :'DR1';
select tests.ok((select count(*) from public.daily_checks where reminder_id = 'd0870000-0000-4000-8000-0000000000a1') = 0, 'c''est fait : supprimé avec le rappel');
