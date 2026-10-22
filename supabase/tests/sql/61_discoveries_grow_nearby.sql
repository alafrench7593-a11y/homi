-- =====================================================================
-- « Ses découvertes », « Je grandis », « Près de chez moi » : séparation des enfants et des foyers, quota gratuit,
-- étapes principales gratuites / suivi complet Premium, favoris strictement personnels, signalements.
-- =====================================================================
\set DA 'b0e61000-0000-4000-8000-000000000001'
\set DB 'b0e61000-0000-4000-8000-000000000002'
\set DX 'b0e61000-0000-4000-8000-000000000003'
\set DADM 'b0e61000-0000-4000-8000-000000000004'
\set HF 'b0e61000-0000-4000-8000-0000000000f0'
\set HX 'b0e61000-0000-4000-8000-0000000000f1'
\set LINA 'b0e61000-0000-4000-8000-0000000000c1'
\set NOE 'b0e61000-0000-4000-8000-0000000000c2'
reset role;
insert into auth.users (id, email) values (:'DA', 'deco-a@exemple.test'), (:'DB', 'deco-b@exemple.test'), (:'DX', 'deco-x@exemple.test'), (:'DADM', 'deco-adm@exemple.test');
insert into public.households (id, name, created_by) values (:'HF', 'Foyer découvertes', :'DA'), (:'HX', 'Autre foyer', :'DX');
insert into public.household_members (household_id, user_id, role) values (:'HF', :'DA', 'owner'), (:'HF', :'DB', 'coparent'), (:'HX', :'DX', 'owner') on conflict do nothing;
insert into public.children (id, household_id, first_name, birth_date) values (:'LINA', :'HF', 'Lina', current_date - 240), (:'NOE', :'HF', 'Noé', current_date - 2000);
insert into public.user_roles (user_id, role) values (:'DADM', 'admin') on conflict do nothing;

-- Aliments : fiche, historique, statut, quota gratuit par enfant
set role authenticated; set request.jwt.claim.sub = :'DA';
insert into public.food_introductions (household_id, child_id, food_name, food_key, status, first_tried_on, texture, preparation, note)
  values (:'HF', :'LINA', 'Carotte', 'carrot', 'liked', current_date - 3, 'smooth', 'vapeur', 'Grand sourire');
insert into public.food_introductions (household_id, child_id, food_name, food_key, status, favorite) values (:'HF', :'LINA', 'Œuf', 'egg', 'not_yet', true);
select tests.throws(format($$insert into public.food_introductions (household_id, child_id, food_name, food_key, status) values (%L, %L, 'Poire', 'pear', 'tasted')$$, :'HF', :'LINA'), 'aliment goûté : date de découverte obligatoire');
select tests.throws(format($$insert into public.food_introductions (household_id, child_id, food_name, food_key, status, first_tried_on) values (%L, %L, 'Pomme', 'apple', 'mange', current_date)$$, :'HF', :'LINA'), 'aliment : statut contrôlé');
select tests.throws(format($$insert into public.food_introductions (household_id, child_id, food_name, food_key, status) values (%L, %L, 'Carotte bis', 'carrot', 'not_yet')$$, :'HF', :'LINA'), 'aliment : une seule fiche par aliment et par enfant');
insert into public.food_introductions (household_id, child_id, food_name, food_key, status, first_tried_on) values (:'HF', :'NOE', 'Carotte', 'carrot', 'refused', current_date - 1);
select tests.ok((select status from public.food_introductions where child_id = :'LINA' and food_key = 'carrot') = 'liked'
  and (select status from public.food_introductions where child_id = :'NOE' and food_key = 'carrot') = 'refused', 'aliments : Lina et Noé jamais mélangés');
insert into public.food_tastings (household_id, child_id, food_key, food_name, tasted_on, status, reaction, reaction_note) values (:'HF', :'LINA', 'carrot', 'Carotte', current_date - 3, 'tasted', false, null), (:'HF', :'LINA', 'carrot', 'Carotte', current_date, 'liked', true, 'rougeurs autour de la bouche');
select tests.ok(tests.count(format('select * from public.food_tastings where child_id = %L', :'LINA')) = 2, 'historique : chaque proposition est conservée');
select tests.throws(format($$insert into public.food_tastings (household_id, child_id, food_name, tasted_on, status) values (%L, %L, 'Pomme', current_date, 'tasted')$$, :'HX', :'LINA'), 'historique : impossible pour l''enfant d''un autre foyer');
-- quota gratuit : 15 aliments par enfant (3 déjà pour Lina et Noé confondus, 2 pour Lina)
do $$ begin for i in 1..13 loop
  insert into public.food_introductions (household_id, child_id, food_name, food_key, status) values ('b0e61000-0000-4000-8000-0000000000f0', 'b0e61000-0000-4000-8000-0000000000c1', 'Aliment ' || i, 'food_' || i, 'not_yet');
end loop; end $$;
select tests.throws(format($$insert into public.food_introductions (household_id, child_id, food_name, food_key, status) values (%L, %L, 'Seizième', 'food_16', 'not_yet')$$, :'HF', :'LINA'), 'version gratuite : 15 aliments suivis par enfant');
insert into public.food_introductions (household_id, child_id, food_name, food_key, status) values (:'HF', :'NOE', 'Poire', 'pear', 'not_yet');
select tests.ok(tests.count(format('select * from public.food_introductions where child_id = %L', :'NOE')) = 2, 'quota compté séparément pour chaque enfant');
update public.food_introductions set status = 'tasted', first_tried_on = current_date where child_id = :'LINA' and food_key = 'egg';
select tests.ok((select status from public.food_introductions where child_id = :'LINA' and food_key = 'egg') = 'tasted', 'quota atteint : les fiches existantes restent modifiables');
reset role;
set role authenticated; set request.jwt.claim.sub = :'DX';
select tests.ok(tests.count('select * from public.food_introductions') = 0 and tests.count('select * from public.food_tastings') = 0, 'aliments : invisibles d''un autre foyer');
reset role;

-- Étapes : principales gratuites, suivi complet Premium, « ne pas suivre » toujours possible
set role authenticated; set request.jwt.claim.sub = :'DA';
select tests.ok(tests.count('select * from public.development_steps where main') > 10, 'étapes : catalogue publié avec les étapes principales');
insert into public.child_steps (household_id, child_id, step_key, status, observed_on, note) values (:'HF', :'LINA', 'sits_alone', 'observed', current_date - 2, 'Tout seul sur le tapis');
insert into public.child_steps (household_id, child_id, step_key, status) values (:'HF', :'LINA', 'moves_around', 'in_progress');
select tests.throws(format($$insert into public.child_steps (household_id, child_id, step_key, status) values (%L, %L, 'stands_up', 'observed')$$, :'HF', :'LINA'), 'étape non principale : suivi complet réservé à Premium');
insert into public.child_steps (household_id, child_id, step_key, status) values (:'HF', :'LINA', 'stands_up', 'not_tracked');
select tests.throws(format($$insert into public.child_steps (household_id, child_id, step_key, status) values (%L, %L, 'inventee', 'observed')$$, :'HF', :'LINA'), 'étape : clé du catalogue obligatoire');
select tests.throws(format($$insert into public.child_steps (household_id, child_id, step_key, status) values (%L, %L, 'walks', 'retard')$$, :'HF', :'LINA'), 'étape : aucun statut de jugement');
select tests.ok(tests.count(format('select * from public.child_steps where child_id = %L', :'NOE')) = 0, 'étapes : jamais mélangées entre Lina et Noé');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'child_steps') = 3 and jsonb_array_length(public.export_my_data() -> 'food_tastings') = 2, 'export RGPD : étapes et historique des aliments');
reset role;
set role authenticated; set request.jwt.claim.sub = :'DB';
select tests.ok(tests.count('select * from public.child_steps') = 3, 'étapes : visibles du co-parent du foyer');
reset role;
set role authenticated; set request.jwt.claim.sub = :'DX';
select tests.ok(tests.count('select * from public.child_steps') = 0, 'étapes : invisibles d''un autre foyer');
update public.development_steps set main = true where key = 'stands_up';
select tests.ok(not (select main from public.development_steps where key = 'stands_up'), 'catalogue : modifiable seulement par l''administration');
reset role;

-- Près de chez moi : favoris personnels, signalements lus par la modération
set role authenticated; set request.jwt.claim.sub = :'DA';
insert into public.place_favorites (place_id, name, kind, address, lat, lon, source) values ('osm:node/123', 'Bibliothèque municipale', 'library', '1 place de la Mairie', 48.85, 2.35, 'OpenStreetMap');
select tests.throws($$insert into public.place_favorites (place_id, name, kind) values ('osm:node/123', 'Doublon', 'library')$$, 'favori : une seule fois par lieu');
select tests.throws($$insert into public.place_favorites (place_id, name, kind) values ('mon domicile', 'Maison', 'home')$$, 'favori : identifiant de lieu public contrôlé');
insert into public.place_reports (place_id, place_name, reason, comment) values ('osm:node/123', 'Bibliothèque municipale', 'hours', 'Fermée le lundi');
select tests.throws($$insert into public.place_reports (place_id, place_name, reason) values ('osm:node/123', 'Bibliothèque', 'pas content')$$, 'signalement : motif contrôlé');
reset role;
set role authenticated; set request.jwt.claim.sub = :'DB';
select tests.ok(tests.count('select * from public.place_favorites') = 0 and tests.count('select * from public.place_reports') = 0, 'lieux : favoris et signalements jamais visibles du co-parent ni des autres membres');
reset role;
set role authenticated; set request.jwt.claim.sub = :'DADM';
select tests.ok(tests.count('select * from public.place_reports') >= 1, 'signalements : lus par la modération');
reset role;
