-- =====================================================================
-- Numéros partiels complétés (29/11/2026) — 20261129400100_partiels_suivi_allaitement.sql
-- 42 analyses · 50 souvenirs de grossesse · 53 check-in physique · 57/81 thèmes de questions · 72 contenants ·
-- 80 relais de biberons · 120/123 DME et refus
-- Comptes distincts : parent (OW), second parent (CP), nounou confirmée de Lou (NN), non-membre (XX),
-- ancien membre (EX, co-parent retiré du foyer en fin de fichier).
-- =====================================================================
\set OW 'f29a0000-0000-4000-8000-000000000001'
\set CP 'f29a0000-0000-4000-8000-000000000002'
\set NN 'f29a0000-0000-4000-8000-000000000003'
\set XX 'f29a0000-0000-4000-8000-000000000005'
\set EX 'f29a0000-0000-4000-8000-000000000006'
\set H  'f29a0000-0000-4000-8000-0000000000a1'
\set H2 'f29a0000-0000-4000-8000-0000000000a2'
\set K1 'f29a0000-0000-4000-8000-0000000000c1'
\set K2 'f29a0000-0000-4000-8000-0000000000c2'
\set PG 'f29a0000-0000-4000-8000-0000000000b1'
\set PU 'f29a0000-0000-4000-8000-0000000000f1'
\set BO 'f29a0000-0000-4000-8000-0000000000f3'
\set BX 'f29a0000-0000-4000-8000-0000000000f4'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zk-parent@exemple.test'), (:'CP', 'f98zk-parent2@exemple.test'),
  (:'NN', 'f98zk-nounou@exemple.test'), (:'XX', 'f98zk-inconnu@exemple.test'), (:'EX', 'f98zk-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zk', :'OW'), (:'H2', 'Autre foyer 98zk', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,pregnancy,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,pregnancy,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 230), (:'K2', :'H2', 'Autre', current_date - 100);
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'PG', :'H', :'OW', current_date + 60);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true);
select tests.set_premium(:'XX', true); select tests.set_premium(:'NN', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW'; select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';

-- Documents : un privé de OW, un partagé avec le foyer, un privé de CP
reset role;
insert into storage.objects (bucket_id, name) values ('documents', :'H' || '/bilan.pdf'), ('documents', :'H' || '/echo.jpg'),
  ('documents', :'H' || '/partage.pdf'), ('documents', :'H' || '/cp.pdf');
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'blood_test', 'Bilan sanguin', :'H' || '/bilan.pdf', 'application/pdf', 1000, true) returning id as doc_bilan \gset
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'ultrasound', 'Échographie', :'H' || '/echo.jpg', 'image/jpeg', 1000, true) returning id as doc_echo \gset
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'blood_test', 'Bilan partagé', :'H' || '/partage.pdf', 'application/pdf', 1000, false) returning id as doc_shared \gset
reset role;
insert into public.documents (household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', :'CP', 'blood_test', 'Bilan de CP', :'H' || '/cp.pdf', 'application/pdf', 1000, true) returning id as doc_cp \gset
set role authenticated;

-- ================================================================ 42 Analyses médicales (personnel)
set request.jwt.claim.sub = :'OW';
insert into public.lab_results (pregnancy_id, document_id, name, value, unit, measured_on, lab_reference)
  values (:'PG', :'doc_bilan', 'Hémoglobine', 12.4, 'g/dL', current_date - 60, '11,5 – 16');
insert into public.lab_results (pregnancy_id, document_id, name, value, unit, measured_on, lab_reference)
  values (:'PG', :'doc_shared', '  Hémoglobine ', 11.9, 'g/dL', current_date - 20, '11,5 – 16');
insert into public.lab_results (name, value, unit, measured_on) values ('Ferritine', 18, 'µg/L', current_date - 20);
select tests.ok(tests.count('select * from public.lab_results') = 3 and tests.count($$select * from public.lab_results where name = 'Hémoglobine'$$) = 2,
  'analyses : valeurs saisies (nom nettoyé, unité, date, référence recopiée), liées au document');
select tests.ok(tests.count($$select * from public.lab_results where lab_reference = '11,5 – 16'$$) = 2, 'analyses : référence du laboratoire gardée telle quelle');
update public.lab_results set value = 12.1 where name = 'Ferritine';
select tests.ok(tests.count('select * from public.lab_results where value = 12.1') = 1, 'analyses : modifiable');
select tests.throws(format($$insert into public.lab_results (document_id, name, value, measured_on) values (%L, 'X', 1, current_date)$$, :'doc_cp'), 'analyses : document privé d''une autre personne refusé');
select tests.throws($$insert into public.lab_results (name, value, measured_on) values ('', 1, current_date)$$, 'analyses : nom obligatoire');
select tests.throws(format($$insert into public.lab_results (user_id, name, value, measured_on) values (%L, 'X', 1, current_date)$$, :'CP'), 'analyses : jamais au nom d''une autre personne');
set request.jwt.claim.sub = :'XX';
select tests.throws(format($$insert into public.lab_results (pregnancy_id, name, value, measured_on) values (%L, 'X', 1, current_date)$$, :'PG'), 'analyses : grossesse d''un autre foyer refusée');
set request.jwt.claim.sub = :'OW';
delete from public.lab_results where name = 'Ferritine';
select tests.ok(tests.count('select * from public.lab_results') = 2, 'analyses : suppression');

-- ================================================================ 50 Souvenirs de grossesse (personnel)
insert into public.pregnancy_memories (pregnancy_id, happened_on, week_sa, kind, title, body, photo_ids)
  values (:'PG', current_date - 30, 22, 'ultrasound', 'Deuxième échographie', 'Il bougeait beaucoup.', array[:'doc_echo']::uuid[]);
insert into public.pregnancy_memories (pregnancy_id, happened_on, week_sa, body) values (:'PG', current_date - 3, 30, 'Premiers coups de pied sentis par Sam.');
select tests.ok(tests.count('select * from public.pregnancy_memories') = 2, 'souvenirs : texte, date, semaine, échographie privée');
select tests.throws(format($$insert into public.pregnancy_memories (happened_on, photo_ids) values (current_date, array[%L]::uuid[])$$, :'doc_shared'), 'souvenirs : une photo partagée avec le foyer refusée (privée seulement)');
select tests.throws(format($$insert into public.pregnancy_memories (happened_on, photo_ids) values (current_date, array[%L]::uuid[])$$, :'doc_cp'), 'souvenirs : photo d''une autre personne refusée');
select tests.throws($$insert into public.pregnancy_memories (happened_on) values (current_date)$$, 'souvenirs : vide refusé');
select tests.throws($$insert into public.pregnancy_memories (happened_on, week_sa, body) values (current_date, 50, 'x')$$, 'souvenirs : semaine invraisemblable refusée');
update public.pregnancy_memories set title = 'Les coups de pied' where week_sa = 30;
select tests.ok(tests.count($$select * from public.pregnancy_memories where title = 'Les coups de pied'$$) = 1, 'souvenirs : modifiable');

-- ================================================================ 53 Check-in post-partum : cicatrice, périnée, saignements
insert into public.postpartum_checkins (checkin_date, pain, scar_feeling, perineum_feeling, bleeding) values (current_date, 2, 'better', 'same', 'light');
select tests.ok(tests.count($$select * from public.postpartum_checkins where scar_feeling = 'better' and perineum_feeling = 'same' and bleeding = 'light'$$) = 1, 'check-in : champs cicatrice / périnée / saignements');
select tests.throws($$insert into public.postpartum_checkins (checkin_date, bleeding) values (current_date - 1, 'hemorragie')$$, 'check-in : niveau de saignement inconnu refusé');

-- ================================================================ 57 / 81 Questions par thème
insert into public.consultation_questions (journey, question, theme) values ('postpartum', 'Quand reprendre le sport ?', 'postnatal'), ('general', 'Pouvez-vous regarder la prise du sein ?', 'lactation');
select tests.ok(tests.count($$select * from public.consultation_questions where theme = 'lactation'$$) = 1
  and tests.count($$select * from public.consultation_questions where theme = 'postnatal'$$) = 1, 'questions : thèmes postnatal et lactation');
select tests.throws($$insert into public.consultation_questions (journey, question, theme) values ('general', 'x', 'diagnostic')$$, 'questions : thème inconnu refusé');

-- ================================================================ 72 Contenants depuis une séance de tire-lait
insert into public.pumpings (id, child_id, household_id, at, amount_ml, side) values (:'PU', :'K1', :'H', now() - interval '2 hours', 200, 'both');
insert into public.milk_stock (household_id, child_id, pumping_id, expressed_at, amount_ml, location, use_by, container, label)
  values (:'H', :'K1', :'PU', now() - interval '2 hours', 120, 'freezer', now() + interval '90 days', 'bag', 'Sachet 1'),
         (:'H', :'K1', :'PU', now() - interval '2 hours', 80, 'fridge', now() + interval '40 hours', 'bottle', null);
select tests.ok(tests.count($$select * from public.milk_stock where pumping_id = 'f29a0000-0000-4000-8000-0000000000f1'$$) = 2, 'lot : une séance rangée en deux contenants');
select tests.throws(format($$insert into public.milk_stock (household_id, pumping_id, expressed_at, amount_ml, location, use_by) values (%L, %L, now(), 10, 'fridge', now() + interval '1 day')$$, :'H', :'PU'), 'lot : total au-delà de la quantité tirée refusé');
select tests.throws($$update public.milk_stock set amount_ml = 130 where label = 'Sachet 1'$$, 'lot : modification au-delà de la quantité tirée refusée');
select tests.throws($$update public.milk_stock set container = 'carton' where label = 'Sachet 1'$$, 'contenant : type inconnu refusé');

-- ================================================================ 80 Relais de biberons (parents)
insert into public.bottles (id, child_id, household_id, at, prepared_ml, consumed_ml) values (:'BO', :'K1', :'H', now() - interval '10 minutes', 150, 140);
insert into public.bottles (id, child_id, household_id, at, prepared_ml) values (:'BX', :'K1', :'H', now() - interval '3 hours', 120);
insert into public.bottle_relays (household_id, child_id, planned_at, planned_ml, assigned_to, note) values (:'H', :'K1', now() + interval '3 hours', 150, :'CP', 'Lait tiré au réfrigérateur');
insert into public.bottle_relays (household_id, child_id, planned_at, planned_ml, assigned_to) values (:'H', :'K1', now() - interval '15 minutes', 150, :'OW');
select tests.ok(tests.count('select * from public.bottle_relays') = 2 and tests.count($$select * from public.bottle_relays where created_by = 'f29a0000-0000-4000-8000-000000000001'$$) = 2,
  'relais : biberons attribués (autrice posée par le serveur)');
select tests.throws(format($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to) values (%L, %L, now(), %L)$$, :'H', :'K1', :'NN'), 'relais : la nounou n''est pas un parent à qui attribuer');
select tests.throws(format($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to) values (%L, %L, now(), %L)$$, :'H', :'K2', :'OW'), 'relais : enfant d''un autre foyer refusé');
select tests.throws($$update public.bottle_relays set status = 'given' where assigned_to = 'f29a0000-0000-4000-8000-000000000001'$$, 'relais : « donné » demande l''heure');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.bottle_relays') = 2, 'second parent : voit les relais');
update public.bottle_relays set status = 'given', given_at = now(), bottle_id = :'BO' where assigned_to = :'OW';
select tests.ok(tests.count($$select * from public.bottle_relays where status = 'given' and bottle_id = 'f29a0000-0000-4000-8000-0000000000f3'$$) = 1, 'relais : relié au biberon réellement noté');

-- ================================================================ 120 / 123 DME et refus
set request.jwt.claim.sub = :'OW';
insert into public.food_tastings (child_id, household_id, food_name, food_key, tasted_on, status, method, grasp, outcome, texture)
  values (:'K1', :'H', 'Brocoli', 'brocoli', current_date - 2, 'tasted', 'blw', 'palm', 'tasted', 'pieces'),
         (:'K1', :'H', 'Brocoli', 'brocoli', current_date - 1, 'refused', 'blw', 'not_taken', 'refused', 'pieces');
select tests.ok(tests.count($$select * from public.food_tastings where method = 'blw'$$) = 2, 'DME : mode, prise en main et issue enregistrés');
select tests.throws(format($$insert into public.food_tastings (child_id, household_id, food_name, tasted_on, status, outcome) values (%L, %L, 'Poire', current_date, 'tasted', 'refused')$$, :'K1', :'H'), 'refus : issue et statut cohérents');
select tests.throws(format($$insert into public.food_tastings (child_id, household_id, food_name, tasted_on, status, grasp) values (%L, %L, 'Poire', current_date, 'tasted', 'avale')$$, :'K1', :'H'), 'DME : prise en main inconnue refusée');
insert into public.meals (child_id, household_id, at, foods, refused_foods) values (:'K1', :'H', now(), array['carotte', 'poisson'], array['poisson']);
select tests.ok(tests.count($$select * from public.meals where 'poisson' = any(refused_foods)$$) = 1, 'repas : aliments refusés structurés');
select tests.throws(format($$insert into public.meals (child_id, household_id, at, foods, refused_foods) values (%L, %L, now(), array['carotte'], array['poire'])$$, :'K1', :'H'), 'repas : un refus porte sur un aliment du repas');

-- ================================================================ Second parent, nounou, non-membre
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.lab_results') = 0 and tests.count('select * from public.pregnancy_memories') = 0,
  'second parent : ni analyses ni souvenirs de l''autre');
update public.lab_results set value = 0;
delete from public.pregnancy_memories;
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.bottle_relays') = 0 and tests.count('select * from public.lab_results') = 0
  and tests.count('select * from public.pregnancy_memories') = 0, 'nounou : ni relais, ni données personnelles');
select tests.throws(format($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to) values (%L, %L, now(), %L)$$, :'H', :'K1', :'OW'), 'nounou : n''organise pas les relais des parents');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.bottle_relays') = 0 and tests.count('select * from public.lab_results') = 0, 'non-membre : rien');
select tests.throws(format($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to) values (%L, %L, now(), %L)$$, :'H', :'K1', :'XX'), 'non-membre : écriture refusée');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.lab_results where value = 0') = 0 and tests.count('select * from public.pregnancy_memories') = 2,
  'écritures du second parent sur les données personnelles : sans effet');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.bottle_relays') = 2, 'co-parent (avant départ) : voit les relais');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.bottle_relays') = 0 and tests.count('select * from public.lab_results') = 0, 'ancien membre : plus rien');
select tests.throws(format($$insert into public.bottle_relays (household_id, child_id, planned_at, assigned_to) values (%L, %L, now(), %L)$$, :'H', :'K1', :'EX'), 'ancien membre : écriture refusée');

-- ================================================================ Souvenirs gardés après la naissance (grossesse effacée)
reset role;
delete from public.pregnancies where id = :'PG';
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.pregnancy_memories where pregnancy_id is null') = 2 and tests.count('select * from public.lab_results') = 2,
  'souvenirs et analyses : conservés quand la grossesse se termine');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'partiels1'->'lab_results') = 2
  and jsonb_array_length(public.export_my_data()->'partiels1'->'pregnancy_memories') = 2
  and jsonb_array_length(public.export_my_data()->'partiels1'->'bottle_relays') = 2, 'export : analyses, souvenirs et relais dans « Exporter mes données »');
set request.jwt.claim.sub = :'CP';
select tests.ok(jsonb_array_length(public.export_my_data()->'partiels1'->'lab_results') = 0
  and jsonb_array_length(public.export_my_data()->'partiels1'->'bottle_relays') = 2, 'export du second parent : sans les données personnelles de l''autre');

reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false);
select tests.set_premium(:'XX', false); select tests.set_premium(:'NN', false);
