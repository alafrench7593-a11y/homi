-- =====================================================================
-- Fondations du foyer (13/11/2026) — C. Journal d'audit commun (ajout seul)
-- =====================================================================
\set OW 'd0960000-0000-4000-8000-000000000001'
\set CP 'd0960000-0000-4000-8000-000000000002'
\set CL 'd0960000-0000-4000-8000-000000000003'
\set NN 'd0960000-0000-4000-8000-000000000004'
\set XX 'd0960000-0000-4000-8000-000000000005'
\set H  'd0960000-0000-4000-8000-0000000000a1'
\set XH 'd0960000-0000-4000-8000-0000000000a2'
\set K1 'd0960000-0000-4000-8000-0000000000c1'
\set T1 'd0960000-0000-4000-8000-0000000000f1'
\set D1 'd0960000-0000-4000-8000-0000000000d1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f96-owner@exemple.test'), (:'CP', 'f96-coparent@exemple.test'),
  (:'CL', 'f96-coparent-limite@exemple.test'), (:'NN', 'f96-nounou@exemple.test'), (:'XX', 'f96-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 96', :'OW'), (:'XH', 'Autre 96', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,documents,lists}', '{daily,lists}', null),
  (:'H', :'CL', 'coparent', '{daily}', '{daily}', null),
  (:'H', :'NN', 'caregiver', '{daily,lists}', '{daily,lists}', array[:'K1']::uuid[]);

-- Actions suivies : tâche (création, fin, modification), droits d'un membre, document, partage
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_tasks (id, household_id, title, notes) values (:'T1', :'H', 'Vaccin de Lou', 'Carnet de santé dans le tiroir');
update public.family_tasks set status = 'done' where id = :'T1';
select public.set_member_scope(:'H', :'NN', array[]::uuid[], false);
reset role; set request.jwt.claim.sub = '';
insert into public.documents (id, household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'D1', :'H', :'OW', 'other', 'Contrat', 'd0960000-0000-4000-8000-0000000000a1/contrat.pdf', 'application/pdf', 1000, false);
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.document_shares (document_id, user_id) values (:'D1', :'NN');

select tests.ok(tests.count('select * from public.household_audit_log where table_name = ''family_tasks'' and action = ''insert''') = 1
  and tests.count($$select * from public.household_audit_log where table_name = 'family_tasks' and action = 'update' and after ->> 'status' = 'done' and before ->> 'status' = 'todo'$$) = 1,
  'audit : création et fin de tâche journalisées (avant / après)');
select tests.ok((select actor_id from public.household_audit_log where table_name = 'family_tasks' and action = 'insert') = :'OW'
  and (select origin from public.household_audit_log where table_name = 'family_tasks' and action = 'insert') = 'client', 'audit : auteur et origine enregistrés');
select tests.ok(tests.count($$select * from public.household_audit_log where table_name = 'household_members' and action = 'update' and after ? 'child_scope' and after ? 'pregnancy_access'$$) = 1,
  'audit : changement des enfants autorisés d''un membre journalisé');
select tests.ok(tests.count($$select * from public.household_audit_log where table_name = 'document_shares' and action = 'insert'$$) = 1
  and tests.count($$select * from public.household_audit_log where table_name = 'documents' and action = 'insert' and origin = 'server'$$) = 1, 'audit : document et partage journalisés');
select tests.ok(not exists (select 1 from public.household_audit_log where after ? 'storage_path' or before ? 'storage_path' or after ? 'updated_at'),
  'audit : résumé sans chemin de fichier ni champ technique');
select tests.ok(tests.count($$select * from public.household_audit_log where table_name = 'family_tasks' and action = 'update' and after ? 'version'$$) = 0,
  'audit : la version technique n''apparaît pas dans le résumé');

-- Ajout seul : aucun client ne peut écrire, modifier ni effacer
select tests.throws($$insert into public.household_audit_log (household_id, origin, table_name, domain, action) values ('d0960000-0000-4000-8000-0000000000a1', 'client', 'family_tasks', 'lists', 'insert')$$,
  'audit : écriture directe par la propriétaire refusée');
select tests.throws($$update public.household_audit_log set after = '{}'::jsonb$$, 'audit : modification par la propriétaire refusée');
select tests.throws($$delete from public.household_audit_log$$, 'audit : effacement par la propriétaire refusé');
select tests.throws($$truncate public.household_audit_log$$, 'audit : vidage refusé');
reset role;
select tests.throws($$update public.household_audit_log set actor_id = null$$, 'audit : modification refusée même côté serveur');
select tests.throws($$delete from public.household_audit_log where household_id = 'd0960000-0000-4000-8000-0000000000a1'$$, 'audit : effacement direct refusé même côté serveur');
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H') >= 6, 'audit : entrées intactes après les tentatives');

-- Lecture selon les droits
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_audit_log where table_name = ''family_tasks''') = 2
  and tests.count('select * from public.household_audit_log where table_name = ''documents''') = 1
  and tests.count('select * from public.household_audit_log where table_name = ''household_members''') > 0, 'audit : co-parent lit le journal des domaines partagés');
select tests.throws($$insert into public.household_audit_log (household_id, origin, table_name, domain, action) values ('d0960000-0000-4000-8000-0000000000a1', 'client', 'family_tasks', 'lists', 'insert')$$, 'audit : écriture par un co-parent refusée');
set request.jwt.claim.sub = :'CL';
select tests.ok(tests.count('select * from public.household_audit_log where table_name in (''family_tasks'', ''documents'', ''document_shares'')') = 0
  and tests.count('select * from public.household_audit_log where table_name = ''household_members''') > 0, 'audit : co-parent limité au quotidien → tâches et documents non lisibles');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.household_audit_log where household_id = ''d0960000-0000-4000-8000-0000000000a1''') = 0, 'audit : une nounou ne lit jamais le journal du foyer qui l''emploie');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.household_audit_log where household_id = ''d0960000-0000-4000-8000-0000000000a1''') = 0, 'audit : autre foyer : rien de lisible');
set role anon; set request.jwt.claim.sub = '';
select tests.ok(tests.count('select * from public.household_audit_log') = 0, 'audit : sans compte : rien de lisible');
reset role;

-- Retrait d'un membre : journalisé, et l'ancien membre ne lit plus rien
set role authenticated; set request.jwt.claim.sub = :'OW';
delete from public.household_members where household_id = :'H' and user_id = :'CP';
select tests.ok(tests.count($$select * from public.household_audit_log where table_name = 'household_members' and action = 'delete' and before ->> 'user_id' = 'd0960000-0000-4000-8000-000000000002'$$) = 1,
  'audit : retrait d''un membre journalisé');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_audit_log where household_id = ''d0960000-0000-4000-8000-0000000000a1''') = 0, 'audit : membre retiré → plus aucune lecture du foyer quitté');
reset role;

-- Branchement d'une future table (pointages, contrats…) : réservé aux migrations
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws($$select public._attach_audit('family_tasks', 'lists')$$, 'audit : branchement réservé aux migrations');
reset role;
-- Suppression du foyer : le journal part avec lui (cascade autorisée)
delete from public.households where id = :'XH';
insert into public.households (id, name, created_by) values (:'XH', 'Autre 96 bis', :'XX');
delete from public.households where id = :'XH';
select tests.ok(not exists (select 1 from public.household_audit_log where household_id = :'XH'), 'audit : suppression d''un foyer → son journal est effacé (cascade)');
