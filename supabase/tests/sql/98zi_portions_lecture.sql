-- =====================================================================
-- Portions préparées et lecture (28/11/2026) — 20261128300300_portions_preparees.sql, 20261128300400_lecture.sql
-- Comptes distincts : propriétaire (OW), second parent (CP), co-parent limité à Max (CL), nounou confirmée de Lou (NN),
-- non-membre (XX), ancien membre (EX, co-parent retiré du foyer).
-- =====================================================================
\set OW 'f28c0000-0000-4000-8000-000000000001'
\set CP 'f28c0000-0000-4000-8000-000000000002'
\set NN 'f28c0000-0000-4000-8000-000000000003'
\set CL 'f28c0000-0000-4000-8000-000000000004'
\set XX 'f28c0000-0000-4000-8000-000000000005'
\set EX 'f28c0000-0000-4000-8000-000000000006'
\set H  'f28c0000-0000-4000-8000-0000000000a1'
\set H2 'f28c0000-0000-4000-8000-0000000000a2'
\set K1 'f28c0000-0000-4000-8000-0000000000c1'
\set K2 'f28c0000-0000-4000-8000-0000000000c2'
\set KX 'f28c0000-0000-4000-8000-0000000000c9'
\set B1 'f28c0000-0000-4000-8000-0000000000b1'
\set U1 'f28c0000-0000-4000-8000-0000000000e1'
\set R1 'f28c0000-0000-4000-8000-0000000000f1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zi-parent@exemple.test'), (:'CP', 'f98zi-parent2@exemple.test'), (:'CL', 'f98zi-limite@exemple.test'),
  (:'NN', 'f98zi-nounou@exemple.test'), (:'XX', 'f98zi-inconnu@exemple.test'), (:'EX', 'f98zi-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zi', :'OW'), (:'H2', 'Autre foyer 98zi', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300), (:'K2', :'H', 'Max', current_date - 2200),
  (:'KX', :'H2', 'Zoé', current_date - 900);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'CL', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', array[:'K2']::uuid[]);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true); select tests.set_premium(:'XX', true); select tests.set_premium(:'CL', true);

set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';

-- ================================================================ 122 Portions : lot, décompte, échéance saisie
insert into public.prepared_portions (id, household_id, child_id, label, recipe_slug, portions_total, prepared_on, storage, use_by)
  values (:'B1', :'H', :'K1', 'Purée carotte – patate douce', 'puree-carotte-patate-douce', 8, current_date - 2, 'freezer', current_date + 26);
select tests.throws($$insert into public.prepared_portions (household_id, label, portions_total, storage) values ('f28c0000-0000-4000-8000-0000000000a1', 'X', 0, 'freezer')$$, 'portions : nombre nul refusé');
select tests.throws($$insert into public.prepared_portions (household_id, label, portions_total, storage) values ('f28c0000-0000-4000-8000-0000000000a1', 'X', 4, 'cave')$$, 'portions : lieu inconnu refusé');
select tests.throws($$insert into public.prepared_portions (household_id, label, portions_total, storage, prepared_on, use_by) values ('f28c0000-0000-4000-8000-0000000000a1', 'X', 4, 'fridge', current_date, current_date - 1)$$,
  'portions : date limite avant la préparation refusée');
select tests.throws($$insert into public.prepared_portions (household_id, child_id, label, portions_total, storage) values ('f28c0000-0000-4000-8000-0000000000a1', 'f28c0000-0000-4000-8000-0000000000c9', 'X', 4, 'fridge')$$,
  'portions : enfant d''un autre foyer refusé');
insert into public.prepared_portion_uses (id, portion_id, household_id, count) values (:'U1', :'B1', :'H2', 2);
insert into public.prepared_portion_uses (id, portion_id, household_id, count) values (:'U1', :'B1', :'H', 2) on conflict (id) do nothing;
select tests.ok((select coalesce(sum(count), 0) from public.prepared_portion_uses where portion_id = :'B1') = 2
  and tests.count($$select * from public.prepared_portion_uses where household_id = 'f28c0000-0000-4000-8000-0000000000a1' and used_by = 'f28c0000-0000-4000-8000-000000000001'$$) = 1,
  'portions : utilisation décomptée une seule fois (envoi répété), foyer du lot, personne posée par le serveur');
set request.jwt.claim.sub = :'CP';
insert into public.prepared_portion_uses (portion_id, household_id, count) values (:'B1', :'H', 5);
select tests.throws(format($$insert into public.prepared_portion_uses (portion_id, household_id, count) values (%L, %L, 2)$$, :'B1', :'H'), 'portions : jamais plus que ce qui reste (1 restante)');
select tests.throws(format($$update public.prepared_portions set portions_total = 3 where id = %L$$, :'B1'), 'portions : nombre préparé jamais sous ce qui a été utilisé');
update public.prepared_portions set portions_total = 10, use_by = current_date + 20 where id = :'B1';
select tests.ok(tests.count($$select * from public.prepared_portions where portions_total = 10 and use_by = current_date + 20$$) = 1, 'second parent : corrige le lot');
delete from public.prepared_portion_uses where portion_id = :'B1' and count = 5;
select tests.ok((select sum(count) from public.prepared_portion_uses where portion_id = :'B1') = 2, 'second parent : annule une utilisation');

set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.prepared_portions') = 0 and tests.count('select * from public.prepared_portion_uses') = 0, 'nounou confirmée : aucune portion');
select tests.throws(format($$insert into public.prepared_portion_uses (portion_id, household_id) values (%L, %L)$$, :'B1', :'H'), 'nounou : décompte refusé');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.prepared_portions') = 0, 'non-membre : aucune portion du foyer');
select tests.throws(format($$insert into public.prepared_portions (household_id, label, portions_total, storage) values (%L, 'X', 2, 'fridge')$$, :'H'), 'non-membre : écriture refusée');
update public.prepared_portions set label = 'piraté' where id = :'B1';

-- ================================================================ 133 Lecture : journal par enfant, favoris
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.prepared_portions where label = 'piraté'$$) = 0, 'non-membre : modification sans effet');
insert into public.reading_logs (id, child_id, household_id, title, story_key, read_on, minutes, reader_id, reaction)
  values (:'R1', :'K1', :'H2', 'La petite lune qui ne voulait pas dormir', 'petite_lune', current_date - 1, 10, :'OW', 'loved');
insert into public.reading_logs (child_id, household_id, title, reader_label, reaction) values (:'K2', :'H', 'Le loup qui voulait changer de couleur', 'Mamie', 'liked');
insert into public.reading_logs (child_id, household_id, title, reader_id) values (:'K2', :'H', 'Petit Ours Brun', :'CP');
select tests.ok(tests.count($$select * from public.reading_logs where household_id = 'f28c0000-0000-4000-8000-0000000000a1'$$) = 3, 'lecture : rattachée au foyer de l''enfant');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title, reader_id) values (%L, %L, 'X', %L)$$, :'K1', :'H', :'XX'), 'lecture : lecteur hors du foyer refusé');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title, reaction) values (%L, %L, 'X', 'bored')$$, :'K1', :'H'), 'lecture : réaction inconnue refusée');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title, minutes) values (%L, %L, 'X', 0)$$, :'K1', :'H'), 'lecture : durée nulle refusée');
insert into public.reading_favorites (child_id, household_id, title) values (:'K1', :'H', 'La petite lune qui ne voulait pas dormir');
select tests.throws(format($$insert into public.reading_favorites (child_id, household_id, title) values (%L, %L, '  la petite lune qui ne voulait pas dormir ')$$, :'K1', :'H'), 'favoris : un titre une seule fois par enfant');

set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.reading_logs') = 3 and tests.count('select * from public.reading_favorites') = 1, 'second parent : voit tout le journal et les favoris');
update public.reading_logs set minutes = 12 where id = :'R1';
select tests.ok(tests.count($$select * from public.reading_logs where minutes = 12 and created_by = 'f28c0000-0000-4000-8000-000000000001'$$) = 1, 'second parent : modifie (autrice d''origine conservée)');
set request.jwt.claim.sub = :'CL';
select tests.ok(tests.count('select * from public.reading_logs') = 2 and tests.count($$select * from public.reading_logs where child_id = 'f28c0000-0000-4000-8000-0000000000c1'$$) = 0,
  'co-parent limité à Max : seulement les lectures de Max');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title) values (%L, %L, 'X')$$, :'K1', :'H'), 'co-parent limité : pas de lecture pour un enfant hors périmètre');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.reading_logs') = 0 and tests.count('select * from public.reading_favorites') = 0, 'nounou confirmée : aucun journal de lecture');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title) values (%L, %L, 'X')$$, :'K1', :'H'), 'nounou : saisie refusée');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.reading_logs') = 0, 'non-membre : aucun journal');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title) values (%L, %L, 'X')$$, :'K1', :'H'), 'non-membre : écriture refusée');
delete from public.reading_logs where child_id = :'K1';
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.reading_logs') = 3, 'non-membre : suppression sans effet');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'reading'->'logs') = 3 and jsonb_array_length(public.export_my_data()->'prepared_portions'->'batches') = 1
  and jsonb_array_length(public.export_my_data()->'prepared_portions'->'uses') = 1, 'export : lecture et portions');
set request.jwt.claim.sub = :'NN';
select tests.ok(jsonb_array_length(public.export_my_data()->'reading'->'logs') = 0 and jsonb_array_length(public.export_my_data()->'prepared_portions'->'batches') = 0, 'export nounou : rien');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.reading_logs') = 3 and tests.count('select * from public.prepared_portions') = 1, 'co-parent (avant départ) : voit lecture et portions');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.reading_logs') = 0 and tests.count('select * from public.prepared_portions') = 0
  and tests.count('select * from public.prepared_portion_uses') = 0 and tests.count('select * from public.reading_favorites') = 0, 'ancien membre : plus rien');
select tests.throws(format($$insert into public.reading_logs (child_id, household_id, title) values (%L, %L, 'X')$$, :'K1', :'H'), 'ancien membre : écriture refusée');

-- ================================================================ Suppression
set request.jwt.claim.sub = :'OW';
delete from public.prepared_portions where id = :'B1';
select tests.ok(tests.count('select * from public.prepared_portion_uses') = 0, 'suppression du lot : utilisations supprimées avec lui');
reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false); select tests.set_premium(:'XX', false); select tests.set_premium(:'CL', false);
