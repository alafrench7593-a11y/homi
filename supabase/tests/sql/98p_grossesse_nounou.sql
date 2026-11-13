-- =====================================================================
-- Confidentialité (14/11/2026) — grossesse FERMÉE par défaut pour une nounou ; co-parents inchangés
-- =====================================================================
\set OW 'd098a000-0000-4000-8000-000000000001'
\set NN 'd098a000-0000-4000-8000-000000000002'
\set CP 'd098a000-0000-4000-8000-000000000003'
\set N2 'd098a000-0000-4000-8000-000000000004'
\set N3 'd098a000-0000-4000-8000-000000000005'
\set C2 'd098a000-0000-4000-8000-000000000006'
\set H  'd098a000-0000-4000-8000-0000000000a1'
\set P  'd098a000-0000-4000-8000-0000000000b1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'g98-owner@exemple.test'), (:'NN', 'g98-nounou@exemple.test'), (:'CP', 'g98-coparent@exemple.test'),
  (:'N2', 'g98-nounou2@exemple.test'), (:'N3', 'g98-nounou3@exemple.test'), (:'C2', 'g98-coparent2@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98p', :'OW');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.pregnancies (id, household_id, carrier_user_id, due_date, status) values (:'P', :'H', :'OW', current_date + 90, 'active');

-- Insertion directe (autre interface, service) SANS préciser pregnancy_access
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'NN', 'caregiver', '{daily,pregnancy}', '{daily}'), (:'H', :'CP', 'coparent', '{daily,pregnancy}', '{daily}');
select tests.ok((select not pregnancy_access from public.household_members where user_id = :'NN' and household_id = :'H'),
  'grossesse : nounou insérée sans choix → accès FERMÉ par défaut');
select tests.ok((select pregnancy_access from public.household_members where user_id = :'CP' and household_id = :'H'),
  'grossesse : co-parent inséré sans choix → accès conservé (inchangé)');
-- Même une valeur VRAIE forcée par une autre interface est refusée sans accord explicite de la propriétaire
insert into public.household_members (household_id, user_id, role, can_view, can_edit, pregnancy_access) values (:'H', :'N2', 'caregiver', '{pregnancy}', '{}', true);
select tests.ok((select not pregnancy_access from public.household_members where user_id = :'N2' and household_id = :'H'),
  'grossesse : nounou « pregnancy_access = vrai » forcé hors fonction serveur → refermé');

set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(not public.can_access_pregnancy(:'P'), 'grossesse : nounou sans accord → can_access_pregnancy faux');
select tests.ok(tests.count('select * from public.pregnancies where id = ''d098a000-0000-4000-8000-0000000000b1''') = 0, 'grossesse : nounou sans accord → grossesse illisible (négatif)');
set request.jwt.claim.sub = :'CP';
select tests.ok(public.can_access_pregnancy(:'P'), 'grossesse : co-parent garde l''accès');

-- Invitations : défaut par rôle, accord explicite respecté (inviter est une fonction Premium)
reset role; select tests.set_premium(:'OW', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
create temp table g98 (k text, token text);
grant all on g98 to authenticated;
insert into g98 select 'nn', public.create_household_invitation(:'H', 'caregiver', '{daily,pregnancy}', '{daily}', null, '{}');
insert into g98 select 'cp', public.create_household_invitation(:'H', 'coparent');
insert into g98 select 'nx', public.create_household_invitation(:'H', 'caregiver', '{daily,pregnancy}', '{daily}', null, '{}', true);
reset role;
select tests.ok((select count(*) from public.household_invitations where household_id = :'H' and role = 'caregiver' and not pregnancy_access) = 1
  and (select count(*) from public.household_invitations where household_id = :'H' and role = 'caregiver' and pregnancy_access) = 1,
  'invitation nounou : fermée par défaut, ouverte seulement sur accord explicite');
select tests.ok((select pregnancy_access from public.household_invitations where household_id = :'H' and role = 'coparent'),
  'invitation co-parent : ouverte par défaut (inchangé)');
-- Acceptation : la nounou invitée avec accord explicite reçoit l'accès, l'autre non
set role authenticated; set request.jwt.claim.sub = :'N3';
select public.accept_household_invitation((select token from g98 where k = 'nx'));
set request.jwt.claim.sub = :'C2';
select public.accept_household_invitation((select token from g98 where k = 'cp'));
reset role;
select tests.ok((select pregnancy_access from public.household_members where user_id = :'N3' and household_id = :'H'),
  'acceptation : accord explicite de la propriétaire recopié pour la nounou');
select tests.ok((select pregnancy_access from public.household_members where user_id = :'C2' and household_id = :'H'),
  'acceptation : co-parent invité garde l''accès par défaut');
-- Le marqueur d'accord ne fuit pas hors de la fonction
select tests.ok(coalesce(current_setting('homi.pregnancy_grant', true), '') = '', 'accord explicite : marqueur remis à zéro après la fonction');

-- set_member_scope : NULL = inchangé (avant : NULL ouvrait la grossesse)
set role authenticated; set request.jwt.claim.sub = :'OW';
select public.set_member_scope(:'H', :'NN', '{}', null);
reset role;
select tests.ok((select not pregnancy_access from public.household_members where user_id = :'NN' and household_id = :'H'),
  'set_member_scope : paramètre absent → accès inchangé (reste fermé)');
set role authenticated; set request.jwt.claim.sub = :'OW';
select public.set_member_scope(:'H', :'NN', '{}', true);
reset role;
select tests.ok((select pregnancy_access from public.household_members where user_id = :'NN' and household_id = :'H'),
  'set_member_scope : la propriétaire peut ouvrir explicitement');
select tests.ok((select count(*) from public.household_audit_log where table_name = 'household_members' and action = 'update'
  and household_id = :'H' and after ->> 'pregnancy_access' = 'true') = 1, 'ouverture de la grossesse à une nounou : journalisée (audit)');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.throws($$select public.set_member_scope('d098a000-0000-4000-8000-0000000000a1', 'd098a000-0000-4000-8000-000000000002', null, true)$$,
  'set_member_scope : une nounou ne s''ouvre pas la grossesse elle-même');
reset role;

-- Changement de rôle co-parent → nounou : la grossesse se referme
update public.household_members set role = 'caregiver' where household_id = :'H' and user_id = :'CP';
select tests.ok((select not pregnancy_access and child_scope = '{}' from public.household_members where user_id = :'CP' and household_id = :'H'),
  'rôle co-parent → nounou : grossesse refermée et aucun enfant');
