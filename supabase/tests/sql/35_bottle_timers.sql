-- =====================================================================
-- Minuteur biberon : un minuteur actif par enfant, partage selon le domaine 'daily'
-- =====================================================================
\set ROSE  'b0771e00-0000-4000-8000-000000000001'
\set PAUL  'b0771e00-0000-4000-8000-000000000002'
\set NINA  'b0771e00-0000-4000-8000-000000000003'
\set OSCAR 'b0771e00-0000-4000-8000-000000000004'
\set ETRANGER 'b0771e00-0000-4000-8000-000000000005'

insert into auth.users (id, email) values
  (:'ROSE', 'rose@exemple.test'), (:'PAUL', 'paul@exemple.test'), (:'NINA', 'nina@exemple.test'),
  (:'OSCAR', 'oscar@exemple.test'), (:'ETRANGER', 'etranger@exemple.test');

-- ---------------------------------------------------------------- ROSE : foyer, jumelles, invitations
set role authenticated; set request.jwt.claim.sub = :'ROSE';
create temp table bt_ctx as select public.create_household('Foyer de Rose') as hid;
grant select on bt_ctx to authenticated;
-- Paul : coparent avec le suivi quotidien (lecture + écriture)
create temp table bt_inv_paul as select public.create_household_invitation((select hid from bt_ctx), 'coparent', array['daily','profile'], array['daily']) as token;
-- Nina : coparent SANS le domaine 'daily'
create temp table bt_inv_nina as select public.create_household_invitation((select hid from bt_ctx), 'coparent', array['profile','lists'], array['lists']) as token;
-- Oscar : proche en lecture seule sur le suivi quotidien
create temp table bt_inv_oscar as select public.create_household_invitation((select hid from bt_ctx), 'caregiver', array['daily'], array[]::text[]) as token;
grant select on bt_inv_paul, bt_inv_nina, bt_inv_oscar to authenticated;

insert into public.children (household_id, first_name, birth_date) select hid, 'Jade', current_date - 40 from bt_ctx;
insert into public.children (household_id, first_name, birth_date) select hid, 'Lou', current_date - 40 from bt_ctx;
create temp table bt_kids as select id, first_name from public.children where first_name in ('Jade', 'Lou');
grant select on bt_kids to authenticated;

insert into public.bottles (child_id, household_id, at, prepared_ml, consumed_ml, planned_next_ml, milk_type, note)
  select id, (select hid from bt_ctx), now() - interval '1 hour', 150, 120, 150, 'Lait 1er âge', 'Rot après 60 ml' from bt_kids where first_name = 'Jade';
select tests.ok((select planned_next_ml from public.bottles b join bt_kids k on k.id = b.child_id where k.first_name = 'Jade') = 150,
  'biberon : quantité prévue pour le prochain biberon enregistrée telle que saisie');
select tests.ok((select created_by from public.bottles b join bt_kids k on k.id = b.child_id where k.first_name = 'Jade') = :'ROSE',
  'biberon : « enregistré par » renseigné automatiquement');
select tests.throws($$insert into public.bottles (child_id, household_id, at, planned_next_ml) select id, (select hid from bt_ctx), now(), 900 from bt_kids where first_name = 'Jade'$$,
  'biberon : quantité prévue bornée (0 à 500 ml)');

insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, planned_ml)
  select id, (select hid from bt_ctx), now() - interval '1 hour', 210, now() - interval '1 hour' + interval '210 minutes', 150 from bt_kids where first_name = 'Jade';
select tests.ok(tests.count('select * from public.bottle_timers where status = ''active''') = 1, 'minuteur : création et lecture par la propriétaire');
select tests.ok((select household_id from public.bottle_timers limit 1) = (select hid from bt_ctx), 'minuteur : foyer recopié depuis l''enfant');

-- Unicité : un seul minuteur actif par enfant
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours' from bt_kids where first_name = 'Jade'$$,
  'unicité : impossible d''avoir deux minuteurs actifs pour le même enfant');
-- Jumelles : chacune son minuteur
insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours' from bt_kids where first_name = 'Lou';
select tests.ok(tests.count('select * from public.bottle_timers where status = ''active''') = 2, 'jumeaux : un minuteur actif par enfant');
-- Remplacement : l'ancien est clôturé, le nouveau peut être créé ; l'historique garde plusieurs minuteurs terminés
update public.bottle_timers set status = 'done' where child_id = (select id from bt_kids where first_name = 'Lou') and status = 'active';
insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at)
  select id, (select hid from bt_ctx), now(), 240, now() + interval '4 hours' from bt_kids where first_name = 'Lou';
update public.bottle_timers set status = 'cancelled' where child_id = (select id from bt_kids where first_name = 'Lou') and status = 'active';
insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at)
  select id, (select hid from bt_ctx), now(), 120, now() + interval '2 hours' from bt_kids where first_name = 'Lou';
select tests.ok(tests.count('select * from public.bottle_timers where child_id = (select id from bt_kids where first_name = ''Lou'')') = 3
  and tests.count('select * from public.bottle_timers where child_id = (select id from bt_kids where first_name = ''Lou'') and status = ''active''') = 1,
  'unicité : remplacement possible, un seul actif et l''historique conservé');
select tests.throws($$update public.bottle_timers set status = 'active' where child_id = (select id from bt_kids where first_name = 'Lou') and status = 'done'$$,
  'unicité : impossible de réactiver un ancien minuteur à côté de l''actif');

-- Contrôles de cohérence
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_ctx), now(), 2000, now() + interval '1 hour', 'cancelled' from bt_kids where first_name = 'Jade'$$, 'minuteur : délai borné (10 min à 12 h)');
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_ctx), now(), 180, now() - interval '1 hour', 'cancelled' from bt_kids where first_name = 'Jade'$$, 'minuteur : échéance antérieure au dernier biberon refusée');
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours', 'paused' from bt_kids where first_name = 'Jade'$$, 'minuteur : statut limité à active / cancelled / done');
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, planned_ml, status)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours', 1200, 'cancelled' from bt_kids where first_name = 'Jade'$$, 'minuteur : quantité prévue bornée');
reset role;

-- ---------------------------------------------------------------- Autre famille : aucun accès
set role authenticated; set request.jwt.claim.sub = :'ETRANGER';
select tests.ok(tests.count('select * from public.bottle_timers') = 0, 'isolation : une autre famille ne voit aucun minuteur');
update public.bottle_timers set due_at = due_at + interval '1 hour';
delete from public.bottle_timers;
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours', 'cancelled' from bt_kids where first_name = 'Jade'$$,
  'isolation : une autre famille ne peut pas créer de minuteur pour un enfant étranger');
create temp table bt_other as select public.create_household('Foyer étranger') as hid;
grant select on bt_other to authenticated;
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_other), now(), 180, now() + interval '3 hours', 'cancelled' from bt_kids where first_name = 'Jade'$$,
  'isolation : impossible de rattacher l''enfant d''un autre foyer à son propre foyer');
reset role;

-- ---------------------------------------------------------------- NINA : coparent sans le domaine 'daily'
set role authenticated; set request.jwt.claim.sub = :'NINA';
select tests.ok(public.accept_household_invitation((select token from bt_inv_nina)) = (select hid from bt_ctx), 'Nina rejoint le foyer (sans suivi quotidien)');
select tests.ok(tests.count('select * from public.bottle_timers') = 0, 'permissions : un coparent sans « daily » ne voit pas les minuteurs');
select tests.ok(tests.count('select * from public.bottles') = 0, 'permissions : un coparent sans « daily » ne voit pas les biberons');
update public.bottle_timers set status = 'cancelled';
select tests.throws($$insert into public.bottle_timers (child_id, household_id, last_bottle_at, interval_minutes, due_at, status)
  select id, (select hid from bt_ctx), now(), 180, now() + interval '3 hours', 'cancelled' from bt_kids where first_name = 'Jade'$$,
  'permissions : un coparent sans « daily » ne peut pas créer de minuteur');
reset role;

-- ---------------------------------------------------------------- OSCAR : lecture seule
set role authenticated; set request.jwt.claim.sub = :'OSCAR';
select tests.ok(public.accept_household_invitation((select token from bt_inv_oscar)) = (select hid from bt_ctx), 'Oscar rejoint le foyer (lecture seule)');
select tests.ok(tests.count('select * from public.bottle_timers where status = ''active''') = 2, 'permissions : lecture seule « daily » → voit les minuteurs');
update public.bottle_timers set status = 'cancelled' where status = 'active';
reset role;

-- ---------------------------------------------------------------- PAUL : coparent avec « daily »
set role authenticated; set request.jwt.claim.sub = :'PAUL';
select tests.ok(public.accept_household_invitation((select token from bt_inv_paul)) = (select hid from bt_ctx), 'Paul rejoint le foyer (suivi quotidien)');
select tests.ok(tests.count('select * from public.bottle_timers where status = ''active''') = 2, 'coparent « daily » : voit les minuteurs des deux enfants (lecture seule n''a rien modifié)');
update public.bottle_timers set due_at = due_at + interval '15 minutes' where child_id = (select id from bt_kids where first_name = 'Jade') and status = 'active';
select tests.ok((select due_at - last_bottle_at from public.bottle_timers where child_id = (select id from bt_kids where first_name = 'Jade') and status = 'active') = interval '225 minutes',
  'coparent « daily » : peut reporter le rappel de 15 min');
reset role;

-- ---------------------------------------------------------------- Vérifications finales (propriétaire)
set role authenticated; set request.jwt.claim.sub = :'ROSE';
select tests.ok(tests.count('select * from public.bottle_timers where status = ''active''') = 2, 'propriétaire : les tentatives d''un étranger et d''un coparent sans droit n''ont rien changé');
reset role;

set role anon;
select tests.throws($$select * from public.bottle_timers$$, 'anonyme : aucun accès aux minuteurs');
reset role;

-- Suppression de l'enfant : ses minuteurs partent avec lui
delete from public.children where id = (select id from bt_kids where first_name = 'Lou');
select tests.ok((select count(*) from public.bottle_timers where child_id = (select id from bt_kids where first_name = 'Lou')) = 0, 'suppression de l''enfant : minuteurs effacés');
