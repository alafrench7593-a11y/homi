-- =====================================================================
-- Audit de confidentialité du 23/11/2026 : trois fuites rejouées (familles fictives) et corrigées par
-- 20261207000100_confidentialite_audit.sql. Un foyer (propriétaire OW, co-parent LIMITÉ à K1 sans grossesse : CL,
-- co-parent complet : CP) et un autre foyer (XX).
-- =====================================================================
\set OW 'd0990000-0000-4000-8000-000000000001'
\set CL 'd0990000-0000-4000-8000-000000000002'
\set CP 'd0990000-0000-4000-8000-000000000003'
\set XX 'd0990000-0000-4000-8000-000000000004'
\set H  'd0990000-0000-4000-8000-0000000000a1'
\set XH 'd0990000-0000-4000-8000-0000000000a2'
\set K1 'd0990000-0000-4000-8000-0000000000c1'
\set K2 'd0990000-0000-4000-8000-0000000000c2'
\set PG 'd0990000-0000-4000-8000-0000000000d1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f99-owner@exemple.test'), (:'CL', 'f99-limite@exemple.test'),
  (:'CP', 'f99-coparent@exemple.test'), (:'XX', 'f99-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 99', :'OW'), (:'XH', 'Autre 99', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 200), (:'K2', :'H', 'Zélie', current_date - 100);
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'PG', :'H', :'OW', current_date + 60);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access) values
  (:'H', :'CL', 'coparent', '{daily,documents,lists,health}', '{daily,lists}', array[:'K1']::uuid[], false),
  (:'H', :'CP', 'coparent', '{daily,documents,lists,health}', '{daily,lists,health}', null, true);
insert into storage.objects (bucket_id, name) values ('documents', :'H' || '/k2.pdf'), ('documents', :'H' || '/pg.pdf');

set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader, child_id)
  values (:'H', 'other', 'Bilan K2 confidentiel', :'H' || '/k2.pdf', 'application/pdf', 10, false, :'K2');
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader, pregnancy_id)
  values (:'H', 'other', 'Écho grossesse confidentielle', :'H' || '/pg.pdf', 'application/pdf', 10, false, :'PG');
insert into public.family_tasks (household_id, title, child_id) values (:'H', 'Tâche K2 confidentielle', :'K2'), (:'H', 'Tâche K1', :'K1');
insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to, note) values (:'H', :'K2', now(), :'OW', 'Relais K2'), (:'H', :'K1', now(), :'OW', 'Relais K1');
insert into public.appointments (household_id, kind, title, starts_at, for_parent) values (:'H', 'consultation', 'RDV pour moi', now() + interval '2 days', true);
insert into public.appointments (household_id, kind, title, starts_at, child_id) values (:'H', 'consultation', 'RDV Lou', now() + interval '3 days', :'K1');

-- B1 : journal d'audit
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H' and after->>'title' like '%confidentiel%') >= 3,
  'audit 2311 : la propriétaire lit tout le journal de son foyer');
set request.jwt.claim.sub = :'CL';
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H' and coalesce(after, before)::text like '%confidentiel%') = 0,
  'audit 2311 : co-parent limité à Lou → aucune ligne du journal sur Zélie ni sur la grossesse');
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H' and after->>'title' = 'Tâche K1') = 1,
  'audit 2311 : co-parent limité → les lignes de Lou restent lisibles');
set request.jwt.claim.sub = :'XX';
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H') = 0, 'audit 2311 : autre foyer → journal invisible');

-- B2 : outils parent liés à un enfant
set request.jwt.claim.sub = :'CL';
select tests.ok((select count(*) from public.bottle_relays where child_id = :'K2') = 0, 'audit 2311 : relais biberon de Zélie invisible au co-parent limité');
select tests.ok((select count(*) from public.bottle_relays where child_id = :'K1') = 1, 'audit 2311 : relais biberon de Lou visible au co-parent limité');
select tests.throws($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to, note) values ('d0990000-0000-4000-8000-0000000000a1', 'd0990000-0000-4000-8000-0000000000c2', now(), 'd0990000-0000-4000-8000-000000000002', 'x')$$,
  'audit 2311 : co-parent limité ne crée pas de relais pour Zélie');
set request.jwt.claim.sub = :'CP';
select tests.ok((select count(*) from public.bottle_relays where household_id = :'H') = 2, 'audit 2311 : co-parent complet voit les deux relais');
set request.jwt.claim.sub = :'XX';
select tests.ok((select count(*) from public.bottle_relays where household_id = :'H') = 0, 'audit 2311 : autre foyer → aucun relais');

-- B3 : flux d'agenda (iCal) du co-parent complet : jamais le rendez-vous « pour moi » de la propriétaire
reset role; set request.jwt.claim.sub = '';
insert into public.calendar_feeds (household_id, user_id, label, token_hash, include_health_titles)
  values (:'H', :'CP', 'Agenda CP', encode(extensions.digest('jeton-f99', 'sha256'), 'hex'), true);
select tests.ok(not (public.calendar_feed_data('jeton-f99')::text like '%RDV pour moi%'), 'audit 2311 : flux iCal du co-parent sans le rendez-vous « pour moi »');
select tests.ok(public.calendar_feed_data('jeton-f99')::text like '%RDV Lou%', 'audit 2311 : flux iCal garde les rendez-vous partagés');
reset role; set request.jwt.claim.sub = '';
