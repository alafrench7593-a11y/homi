-- =====================================================================
-- « Mon sommeil » : carnet personnel et privé, invisible pour le reste du foyer
-- =====================================================================
\set MAYA  '55555555-5555-4555-8555-555555555555'
\set NOAM  '66666666-6666-4666-8666-666666666666'

insert into auth.users (id, email) values (:'MAYA', 'maya@exemple.test'), (:'NOAM', 'noam@exemple.test');

-- ---------------------------------------------------------------- MAYA crée son foyer et invite Noam avec TOUS les droits
set role authenticated; set request.jwt.claim.sub = :'MAYA';
create temp table maya_ctx as select public.create_household('Foyer de Maya') as hid;
grant select on maya_ctx to authenticated;
create temp table maya_inv as select public.create_household_invitation((select hid from maya_ctx), 'coparent',
  array['daily','health','documents','pregnancy','lists','names','profile'],
  array['daily','health','documents','pregnancy','lists','names','profile']) as token;
grant select on maya_inv to authenticated;

insert into public.parent_sleep_logs (log_date, bedtime, wake_time, night_wakings, waking_details, sleep_minutes, naps, quality, fatigue, mood, note)
values (current_date, now() - interval '8 hours', now(), 2, '[{"at":"02:10","minutes":25}]', 420, '[{"start":"14:00","end":"14:40"}]', 2, 4, 3, 'Nuit hachée');
select tests.ok(tests.count('select * from public.parent_sleep_logs') = 1, 'mon sommeil : ajout et lecture par la personne concernée');
update public.parent_sleep_logs set sleep_minutes = 400, duration_edited = true where log_date = current_date;
select tests.ok((select sleep_minutes from public.parent_sleep_logs where log_date = current_date) = 400, 'mon sommeil : modification de sa propre nuit');
select tests.throws($$insert into public.parent_sleep_logs (log_date) values (current_date)$$, 'mon sommeil : une seule entrée par jour');
select tests.throws($$insert into public.parent_sleep_logs (log_date, bedtime, wake_time) values (current_date - 1, now(), now() - interval '1 hour')$$,
  'mon sommeil : réveil antérieur au coucher refusé');
select tests.throws($$insert into public.parent_sleep_logs (log_date, fatigue) values (current_date - 2, 9)$$, 'mon sommeil : échelle de fatigue bornée (1 à 5)');
select tests.throws($$insert into public.parent_sleep_logs (log_date, naps) values (current_date - 3, '{"start":"14:00"}')$$, 'mon sommeil : siestes au format liste uniquement');
select tests.throws($$insert into public.parent_sleep_logs (user_id, log_date) values ('66666666-6666-4666-8666-666666666666', current_date - 4)$$,
  'mon sommeil : impossible d''écrire au nom d''une autre personne');
reset role;

-- ---------------------------------------------------------------- NOAM rejoint le foyer (tous domaines) mais ne voit rien
set role authenticated; set request.jwt.claim.sub = :'NOAM';
select tests.ok(public.accept_household_invitation((select token from maya_inv)) = (select hid from maya_ctx), 'mon sommeil : Noam rejoint le foyer de Maya');
select tests.ok(tests.count('select * from public.household_members where household_id = (select hid from maya_ctx)') = 2, 'mon sommeil : Noam est bien membre du même foyer');
select tests.ok(tests.count('select * from public.parent_sleep_logs') = 0, 'isolation : un membre du foyer (tous droits) ne voit pas le sommeil de Maya');
update public.parent_sleep_logs set note = 'piraté';
delete from public.parent_sleep_logs;
insert into public.parent_sleep_logs (log_date, sleep_minutes, fatigue) values (current_date, 300, 5);
select tests.ok(tests.count('select * from public.parent_sleep_logs') = 1, 'mon sommeil : Noam a son propre carnet, séparé');
reset role;

set role authenticated; set request.jwt.claim.sub = :'MAYA';
select tests.ok((select note from public.parent_sleep_logs where log_date = current_date) = 'Nuit hachée', 'isolation : un membre du foyer ne peut ni modifier ni supprimer la nuit de Maya');
select tests.ok(tests.count('select * from public.parent_sleep_logs') = 1, 'isolation : Maya ne voit pas le carnet de Noam');
delete from public.parent_sleep_logs where log_date = current_date;
select tests.ok(tests.count('select * from public.parent_sleep_logs') = 0, 'mon sommeil : suppression de sa propre nuit');
reset role;

set role anon;
select tests.throws($$select * from public.parent_sleep_logs$$, 'anonyme : aucun accès au carnet de sommeil');
reset role;

-- Suppression du compte : le carnet part avec lui
delete from auth.users where id = :'NOAM';
select tests.ok((select count(*) from public.parent_sleep_logs where user_id = :'NOAM') = 0, 'suppression du compte : carnet de sommeil effacé');
