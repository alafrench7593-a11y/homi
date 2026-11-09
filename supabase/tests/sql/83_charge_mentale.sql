-- Charge mentale (07/11/2026) : domaines, échéances, je décroche, carnet, point de couple, je suis à bout, papiers.
\set MA 'f9d00000-0000-4000-8000-000000000001'
\set MB 'f9d00000-0000-4000-8000-000000000002'
\set MN 'f9d00000-0000-4000-8000-000000000003'
\set MX 'f9d00000-0000-4000-8000-000000000004'
\set MH 'f9d00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'MA', 'cm-a@exemple.test'), (:'MB', 'cm-b@exemple.test'), (:'MN', 'cm-nounou@exemple.test'), (:'MX', 'cm-x@exemple.test');
insert into public.households (id, name, created_by) values (:'MH', 'Foyer charge', :'MA');
insert into public.household_members (household_id, user_id, role) values (:'MH', :'MA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'MH', :'MB', 'coparent'), (:'MH', :'MN', 'caregiver') on conflict do nothing;

-- outils réservés (Premium ou achat à vie) depuis la fin du mois gratuit (08/11/2026) ; le co-parent est couvert
select tests.set_premium(:'MA', true);
set role authenticated; set request.jwt.claim.sub = :'MA';
insert into public.family_domains (household_id, key, owner_id) values (:'MH', 'vaccines', :'MB');
insert into public.family_prep (household_id, key, occurs_on) values (:'MH', 'back_to_school', '2027-09-01');
select tests.throws($$insert into public.family_prep (household_id, key, occurs_on) values ('f9d00000-0000-4000-8000-0000000000f1', 'back_to_school', '2027-09-01')$$, 'charge : une échéance n''est préparée qu''une fois');
insert into public.offduty_periods (household_id, ends_at, relay_to) values (:'MH', now() + interval '3 hours', :'MB');
select tests.throws($$insert into public.offduty_periods (household_id, ends_at) values ('f9d00000-0000-4000-8000-0000000000f1', now() + interval '3 days')$$, 'charge : « je décroche » limité à 24 h');
insert into public.house_notes (household_id, section, title, body) values (:'MH', 'contacts', 'École', '01 00 00 00 00');
insert into public.couple_checkins (household_id, week_of, heavy) values (:'MH', '2026-11-09', 'Les nuits');
insert into public.exhaustion_checkins (answers) values ('{2,3,1,2,2,1}');
select tests.throws($$insert into public.exhaustion_checkins (answers) values ('{4,0,0,0,0,0}')$$, 'charge : réponses bornées de 0 à 3');
insert into public.family_papers (household_id, kind, expires_on) values (:'MH', 'id_card', '2030-01-01');

set request.jwt.claim.sub = :'MB';
select tests.ok((select owner_id from public.family_domains where key = 'vaccines') = 'f9d00000-0000-4000-8000-000000000002', 'charge : le coparent voit le domaine qui lui est confié');
select tests.ok((select count(*) from public.couple_checkins) = 1, 'charge : le coparent voit le point de couple');
select tests.ok((select count(*) from public.exhaustion_checkins) = 0, 'charge : « je suis à bout » jamais visible du conjoint');
select tests.ok((select count(*) from public.offduty_periods) = 1, 'charge : le relais voit la période « je décroche »');
delete from public.offduty_periods;
set request.jwt.claim.sub = :'MA';
select tests.ok((select count(*) from public.offduty_periods) = 1, 'charge : seule la personne qui décroche peut supprimer sa période');

set request.jwt.claim.sub = :'MN';
select tests.ok((select count(*) from public.couple_checkins) = 0, 'charge : le point de couple n''est jamais visible de la nounou');
select tests.ok((select count(*) from public.house_notes) = 1, 'charge : la nounou voit le carnet de la maison');

set request.jwt.claim.sub = :'MX';
select tests.ok((select count(*) from public.family_domains) + (select count(*) from public.family_papers) + (select count(*) from public.house_notes) = 0, 'charge : rien n''est visible hors du foyer');

set request.jwt.claim.sub = :'MA';
select tests.ok(jsonb_array_length(public.export_my_data()->'family_papers') = 1 and jsonb_array_length(public.export_my_data()->'exhaustion_checkins') = 1, 'charge : export RGPD complet');
select tests.ok((select count(*) from public.paid_tools where key in ('family_domains','family_prep')) = 2, 'charge : domaines et échéances parmi les outils à vie');
reset role;
