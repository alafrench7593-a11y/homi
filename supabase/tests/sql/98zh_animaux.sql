-- =====================================================================
-- Animaux du foyer (28/11/2026) — 20261128300200_animaux.sql
-- Comptes distincts : propriétaire (OW), second parent (CP), nounou confirmée de Lou (NN), non-membre (XX),
-- ancien membre (EX, co-parent retiré du foyer).
-- =====================================================================
\set OW 'f28b0000-0000-4000-8000-000000000001'
\set CP 'f28b0000-0000-4000-8000-000000000002'
\set NN 'f28b0000-0000-4000-8000-000000000003'
\set XX 'f28b0000-0000-4000-8000-000000000005'
\set EX 'f28b0000-0000-4000-8000-000000000006'
\set H  'f28b0000-0000-4000-8000-0000000000a1'
\set H2 'f28b0000-0000-4000-8000-0000000000a2'
\set K1 'f28b0000-0000-4000-8000-0000000000c1'
\set P1 'f28b0000-0000-4000-8000-0000000000b1'
\set P2 'f28b0000-0000-4000-8000-0000000000b2'
\set PX 'f28b0000-0000-4000-8000-0000000000b9'
\set S1 'f28b0000-0000-4000-8000-0000000000f1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zh-parent@exemple.test'), (:'CP', 'f98zh-parent2@exemple.test'),
  (:'NN', 'f98zh-nounou@exemple.test'), (:'XX', 'f98zh-inconnu@exemple.test'), (:'EX', 'f98zh-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zh', :'OW'), (:'H2', 'Autre foyer 98zh', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true); select tests.set_premium(:'XX', true);

set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';
set request.jwt.claim.sub = :'XX';
insert into public.pets (id, household_id, name, species) values (:'PX', :'H2', 'Rex', 'dog');

-- ================================================================ Fiches (propriétaire)
set request.jwt.claim.sub = :'OW';
insert into public.pets (id, household_id, name, species, birth_date, vet_name, vet_phone, created_by)
  values (:'P1', :'H', 'Caramel', 'dog', current_date - 1200, 'Clinique des Tilleuls', '01 23 45 67 89', :'CP');
insert into public.pets (id, household_id, name, species) values (:'P2', :'H', 'Moustache', 'cat');
select tests.ok(tests.count($$select * from public.pets where created_by = 'f28b0000-0000-4000-8000-000000000001'$$) = 2, 'animaux : fiches enregistrées, autrice posée par le serveur');
select tests.throws($$insert into public.pets (household_id, name, species) values ('f28b0000-0000-4000-8000-0000000000a1', 'Nessie', 'dragon')$$, 'animal : espèce inconnue refusée');
select tests.throws($$insert into public.pets (household_id, name, species) values ('f28b0000-0000-4000-8000-0000000000a1', '  ', 'cat')$$, 'animal : nom vide refusé');
select tests.throws($$insert into public.pets (household_id, name, species, birth_date) values ('f28b0000-0000-4000-8000-0000000000a1', 'Futur', 'cat', current_date + 30)$$, 'animal : naissance dans le futur refusée');

-- ================================================================ Soins et rappels : dates saisies
insert into public.pet_care (pet_id, household_id, kind, done_on, next_due, note) values (:'P1', :'H2', 'vaccine', current_date - 330, current_date + 35, 'Rappel annuel indiqué par la clinique');
insert into public.pet_care (pet_id, household_id, kind, done_on, next_due) values (:'P1', :'H', 'deworming', current_date - 80, current_date + 10);
insert into public.pet_care (pet_id, household_id, kind, label, next_due) values (:'P2', :'H', 'flea', 'Pipette', current_date - 2);
select tests.ok(tests.count($$select * from public.pet_care where household_id = 'f28b0000-0000-4000-8000-0000000000a1'$$) = 3,
  'soins : rattachés au foyer de l''animal (un foyer envoyé est ignoré)');
select tests.throws(format($$insert into public.pet_care (pet_id, household_id, kind) values (%L, %L, 'vaccine')$$, :'P1', :'H'), 'soin : ni date faite ni prochaine date → refusé');
select tests.throws(format($$insert into public.pet_care (pet_id, household_id, kind, next_due) values (%L, %L, 'vaccine', current_date)$$, :'PX', :'H'), 'soin : animal d''un autre foyer refusé');

-- ================================================================ Tâches récurrentes : missions ordinaires rattachées à l'animal
select (public.create_mission(:'H', 'Promener Caramel', :'CP', 'pets', null, now() + interval '2 hours', false, 'normal', '{"type":"daily"}'::jsonb, null, :'P1', null, null, null, null, gen_random_uuid())->>'id') as m1 \gset
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and pet_id = %L and category = 'pets' and recurrence->>'type' = 'daily'$$, :'m1', :'P1')) = 1,
  'mission « Promener Caramel » : récurrente, rattachée à l''animal');
select tests.throws(format($$select public.create_mission(%L, 'Nourrir Rex', null, 'pets', null, null, false, 'normal', null, null, %L, null, null, null, null, gen_random_uuid())$$, :'H', :'PX'),
  'mission : animal d''un autre foyer refusé');
insert into public.household_stocks (id, household_id, label, category, pet_id) values (:'S1', :'H', 'Croquettes Caramel', 'pet_food', :'P1');
select tests.ok(tests.count($$select * from public.household_stocks where pet_id = 'f28b0000-0000-4000-8000-0000000000b1'$$) = 1, 'stock : croquettes rattachées à l''animal');
select tests.throws(format($$insert into public.household_stocks (household_id, label, category, pet_id) values (%L, 'Croquettes', 'pet_food', %L)$$, :'H', :'PX'), 'stock : animal d''un autre foyer refusé');

-- ================================================================ Second parent
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.pets') = 2 and tests.count('select * from public.pet_care') = 3, 'second parent : voit fiches et soins');
update public.pet_care set done_on = current_date, next_due = current_date + 90 where pet_id = :'P1' and kind = 'deworming';
select tests.ok(tests.count($$select * from public.pet_care where kind = 'deworming' and next_due = current_date + 90 and created_by = 'f28b0000-0000-4000-8000-000000000001'$$) = 1,
  'second parent : note le soin fait et la prochaine date (autrice d''origine conservée)');

-- ================================================================ Nounou, non-membre
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.pets') = 0 and tests.count('select * from public.pet_care') = 0, 'nounou confirmée : ni fiches ni soins');
select tests.throws($$insert into public.pets (household_id, name, species) values ('f28b0000-0000-4000-8000-0000000000a1', 'Intrus', 'cat')$$, 'nounou : création refusée');
update public.pets set name = 'changé' where household_id = :'H';
delete from public.pet_care where household_id = :'H';
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count($$select * from public.pets where household_id = 'f28b0000-0000-4000-8000-0000000000a1'$$) = 0
  and tests.count($$select * from public.pet_care where household_id = 'f28b0000-0000-4000-8000-0000000000a1'$$) = 0, 'non-membre : rien du foyer');
select tests.throws($$insert into public.pets (household_id, name, species) values ('f28b0000-0000-4000-8000-0000000000a1', 'Intrus', 'cat')$$, 'non-membre : écriture refusée');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.pets where name = 'changé'$$) = 0 and tests.count('select * from public.pet_care') = 3, 'nounou et non-membre : sans effet');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'pets'->'pets') = 2 and jsonb_array_length(public.export_my_data()->'pets'->'care') = 3, 'export : fiches et soins');
set request.jwt.claim.sub = :'NN';
select tests.ok(jsonb_array_length(public.export_my_data()->'pets'->'pets') = 0, 'export nounou : aucun animal');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.pets') = 2, 'co-parent (avant départ) : voit les animaux');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.pets') = 0 and tests.count('select * from public.pet_care') = 0, 'ancien membre : plus rien');
select tests.throws($$insert into public.pets (household_id, name, species) values ('f28b0000-0000-4000-8000-0000000000a1', 'Encore', 'cat')$$, 'ancien membre : écriture refusée');

-- ================================================================ Suppression : soins supprimés, missions et stocks gardés (lien vidé)
set request.jwt.claim.sub = :'OW';
delete from public.pets where id = :'P1';
select tests.ok(tests.count($$select * from public.pet_care where pet_id = 'f28b0000-0000-4000-8000-0000000000b1'$$) = 0, 'suppression : soins supprimés avec la fiche');
select tests.ok(tests.count(format($$select * from public.family_tasks where id = %L and pet_id is null$$, :'m1')) = 1
  and tests.count($$select * from public.household_stocks where id = 'f28b0000-0000-4000-8000-0000000000f1' and pet_id is null$$) = 1,
  'suppression : mission et stock gardés, lien vers l''animal vidé');
reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false); select tests.set_premium(:'XX', false);
