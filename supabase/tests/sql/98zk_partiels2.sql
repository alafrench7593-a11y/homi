-- =====================================================================
-- Outils complétés le 30/11/2026 : 27 examens (fertilité), 129 langage, 132 jeux, 136 activités, 137 devoirs,
-- 175 intimité (« desire »), 177 baromètre du couple.
-- Migrations 20261130100100…600. Comptes distincts : propriétaire (OW), second parent (CP), co-parent limité à Max
-- (CL), nounou confirmée de Lou (NN), non-membre (XX), ancien membre (EX, co-parent retiré du foyer).
-- =====================================================================
\set OW 'f30c0000-0000-4000-8000-000000000001'
\set CP 'f30c0000-0000-4000-8000-000000000002'
\set NN 'f30c0000-0000-4000-8000-000000000003'
\set CL 'f30c0000-0000-4000-8000-000000000004'
\set XX 'f30c0000-0000-4000-8000-000000000005'
\set EX 'f30c0000-0000-4000-8000-000000000006'
\set H  'f30c0000-0000-4000-8000-0000000000a1'
\set H2 'f30c0000-0000-4000-8000-0000000000a2'
\set K1 'f30c0000-0000-4000-8000-0000000000c1'
\set K2 'f30c0000-0000-4000-8000-0000000000c2'
\set KX 'f30c0000-0000-4000-8000-0000000000c9'
\set A1 'f30c0000-0000-4000-8000-0000000000d1'
\set A2 'f30c0000-0000-4000-8000-0000000000d2'
\set L1 'f30c0000-0000-4000-8000-0000000000e1'
\set G1 'f30c0000-0000-4000-8000-0000000000e2'
\set X1 'f30c0000-0000-4000-8000-0000000000e3'
\set W1 'f30c0000-0000-4000-8000-0000000000e4'
\set B1 'f30c0000-0000-4000-8000-0000000000f1'
\set B2 'f30c0000-0000-4000-8000-0000000000f2'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zk-parent@exemple.test'), (:'CP', 'f98zk-parent2@exemple.test'), (:'CL', 'f98zk-limite@exemple.test'),
  (:'NN', 'f98zk-nounou@exemple.test'), (:'XX', 'f98zk-inconnu@exemple.test'), (:'EX', 'f98zk-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zk', :'OW'), (:'H2', 'Autre foyer 98zk', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 700), (:'K2', :'H', 'Max', current_date - 2600),
  (:'KX', :'H2', 'Zoé', current_date - 900);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,health,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,health,lists,profile}', null),
  (:'H', :'CL', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', array[:'K2']::uuid[]);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true); select tests.set_premium(:'XX', true); select tests.set_premium(:'CL', true);

set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';

-- ================================================================ 27 Examens datés (rendez-vous du parcours fertilité)
insert into public.appointments (id, household_id, kind, title, starts_at, for_parent, private_to_creator, care_track)
  values (:'A1', :'H', 'blood_test', 'Bilan hormonal', now() + interval '5 days', true, true, 'fertility');
insert into public.appointments (id, household_id, kind, title, starts_at, for_parent, private_to_creator, shared_with_household, care_track)
  values (:'A2', :'H', 'ultrasound', 'Échographie pelvienne', now() + interval '12 days', true, false, true, 'fertility');
select tests.throws(format($$insert into public.appointments (household_id, kind, title, starts_at, for_parent, care_track) values (%L, 'exam', 'X', now(), true, 'cardio')$$, :'H'),
  'examens : parcours inconnu refusé');
update public.appointments set result_note = 'Résultats remis au médecin' where id = :'A1';
select tests.ok(tests.count($$select * from public.appointments where care_track = 'fertility'$$) = 2, 'examens : la personne voit ses examens datés');
select tests.throws(format($$update public.appointments set result_note = repeat('x', 1001) where id = %L$$, :'A1'), 'examens : note trop longue refusée');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count($$select * from public.appointments where care_track = 'fertility'$$) = 1, 'second parent : seulement l''examen partagé (le privé reste privé)');
update public.appointments set title = 'piraté' where id = :'A1';
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count($$select * from public.appointments where care_track = 'fertility'$$) = 0, 'nounou : aucun examen');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count($$select * from public.appointments where care_track = 'fertility'$$) = 0, 'non-membre : aucun examen');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.appointments where title = 'piraté'$$) = 0, 'second parent : l''examen privé n''est pas modifiable');

-- ================================================================ 129 Langage
insert into public.child_language_entries (id, child_id, household_id, kind, text, language, said_on) values (:'L1', :'K1', :'H2', 'word', 'mama', 'français', current_date - 60);
insert into public.child_language_entries (child_id, household_id, kind, text, said_on) values (:'K1', :'H', 'sentence', 'encore gâteau', current_date - 5);
insert into public.child_language_entries (child_id, household_id, kind, text, note) values (:'K1', :'H', 'language', 'arabe', 'Avec Mamie');
insert into public.child_language_entries (child_id, household_id, kind, text) values (:'K2', :'H', 'note', 'Raconte sa journée à table');
select tests.ok(tests.count($$select * from public.child_language_entries where household_id = 'f30c0000-0000-4000-8000-0000000000a1'$$) = 4, 'langage : rattaché au foyer de l''enfant');
select tests.throws(format($$insert into public.child_language_entries (child_id, household_id, kind, text) values (%L, %L, 'score', 'x')$$, :'K1', :'H'), 'langage : type inconnu refusé');
select tests.throws(format($$insert into public.child_language_entries (child_id, household_id, kind, text) values (%L, %L, 'word', '  ')$$, :'K1', :'H'), 'langage : mot vide refusé');
select tests.throws(format($$insert into public.child_language_entries (child_id, household_id, kind, text) values (%L, %L, 'word', 'x')$$, :'KX', :'H'), 'langage : enfant d''un autre foyer refusé');

-- ================================================================ 132 Jeux (favori, « on l'a fait »)
insert into public.child_game_marks (id, child_id, household_id, game_key, favorite) values (:'G1', :'K1', :'H', 'coucou_cache', true);
select tests.throws(format($$insert into public.child_game_marks (child_id, household_id, game_key) values (%L, %L, 'coucou_cache')$$, :'K1', :'H'), 'jeux : une seule ligne par enfant et par jeu');
select tests.throws(format($$insert into public.child_game_marks (child_id, household_id, game_key, done_count) values (%L, %L, 'tri_couleurs', 1)$$, :'K1', :'H'), 'jeux : « fait » sans date refusé');
select tests.throws(format($$insert into public.child_game_marks (child_id, household_id, game_key) values (%L, %L, 'Pas Bon!')$$, :'K1', :'H'), 'jeux : identifiant de jeu invalide refusé');

-- ================================================================ 136 Activités
insert into public.child_activities (id, child_id, household_id, name, place, slots, equipment, contact_name, contact_phone, reminder_minutes)
  values (:'X1', :'K2', :'H', 'Judo', 'Dojo municipal', '[{"day":3,"from":"14:00","to":"15:00"},{"day":6,"from":"10:00","to":"11:00"}]', 'Kimono, gourde', 'Paul', '06 12 34 56 78', 60);
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots) values (%L, %L, 'X', '[]')$$, :'K2', :'H'), 'activités : au moins un créneau');
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots) values (%L, %L, 'X', '[{"day":8,"from":"10:00","to":"11:00"}]')$$, :'K2', :'H'), 'activités : jour inconnu refusé');
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots) values (%L, %L, 'X', '[{"day":2,"from":"11:00","to":"10:00"}]')$$, :'K2', :'H'), 'activités : fin avant le début refusée');
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots, reminder_minutes) values (%L, %L, 'X', '[{"day":2,"from":"10:00","to":"11:00"}]', 7)$$, :'K2', :'H'), 'activités : délai de rappel inconnu refusé');
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots, starts_on, ends_on) values (%L, %L, 'X', '[{"day":2,"from":"10:00","to":"11:00"}]', current_date, current_date - 1)$$, :'K2', :'H'), 'activités : période à l''envers refusée');

-- ================================================================ 137 Devoirs
insert into public.child_homework (id, child_id, household_id, subject, instructions, due_on) values (:'W1', :'K2', :'H', 'Français', 'Lire la page 12', current_date + 1);
select tests.throws(format($$insert into public.child_homework (child_id, household_id, subject, instructions, due_on) values (%L, %L, 'Maths', ' ', current_date)$$, :'K2', :'H'), 'devoirs : consigne vide refusée');
set request.jwt.claim.sub = :'CP';
update public.child_homework set done_at = now(), done_by = :'OW' where id = :'W1';
select tests.ok(tests.count($$select * from public.child_homework where done_by = 'f30c0000-0000-4000-8000-000000000002' and created_by = 'f30c0000-0000-4000-8000-000000000001'$$) = 1,
  'devoirs : « fait » coché par le second parent (personne posée par le serveur, autrice conservée)');
update public.child_homework set done_at = null where id = :'W1';
select tests.ok(tests.count($$select * from public.child_homework where done_at is null and done_by is null$$) = 1, 'devoirs : décocher efface qui l''avait coché');
select tests.ok(tests.count('select * from public.child_language_entries') = 4 and tests.count('select * from public.child_game_marks') = 1
  and tests.count('select * from public.child_activities') = 1, 'second parent : voit langage, jeux et activités');
update public.child_activities set place = 'Gymnase' where id = :'X1';
update public.child_game_marks set done_count = 1, last_done_on = current_date where id = :'G1';
select tests.ok(tests.count($$select * from public.child_game_marks where done_count = 1$$) = 1 and tests.count($$select * from public.child_activities where place = 'Gymnase'$$) = 1,
  'second parent : modifie l''activité et coche « on l''a fait »');

set request.jwt.claim.sub = :'CL';
select tests.ok(tests.count('select * from public.child_language_entries') = 1 and tests.count('select * from public.child_activities') = 1
  and tests.count('select * from public.child_homework') = 1 and tests.count('select * from public.child_game_marks') = 0, 'co-parent limité à Max : seulement Max');
select tests.throws(format($$insert into public.child_homework (child_id, household_id, subject, instructions, due_on) values (%L, %L, 'X', 'Y', current_date)$$, :'K1', :'H'), 'co-parent limité : pas de devoir pour un enfant hors périmètre');

set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.child_language_entries') = 0 and tests.count('select * from public.child_game_marks') = 0
  and tests.count('select * from public.child_activities') = 0 and tests.count('select * from public.child_homework') = 0, 'nounou confirmée : rien');
select tests.throws(format($$insert into public.child_language_entries (child_id, household_id, kind, text) values (%L, %L, 'word', 'x')$$, :'K1', :'H'), 'nounou : saisie de langage refusée');
select tests.throws(format($$insert into public.child_homework (child_id, household_id, subject, instructions, due_on) values (%L, %L, 'X', 'Y', current_date)$$, :'K1', :'H'), 'nounou : devoir refusé');

set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.child_language_entries') = 0 and tests.count('select * from public.child_activities') = 0
  and tests.count('select * from public.child_homework') = 0 and tests.count('select * from public.child_game_marks') = 0, 'non-membre : rien');
select tests.throws(format($$insert into public.child_activities (child_id, household_id, name, slots) values (%L, %L, 'X', '[{"day":2,"from":"10:00","to":"11:00"}]')$$, :'K2', :'H'), 'non-membre : écriture refusée');
delete from public.child_homework;
update public.child_activities set name = 'piraté';
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.child_homework') = 1 and tests.count($$select * from public.child_activities where name = 'piraté'$$) = 0, 'non-membre : suppression et modification sans effet');

-- ================================================================ 177 Baromètre du couple
insert into public.couple_barometer (id, household_id, week_of, level, word) values (:'B1', :'H', date_trunc('week', current_date)::date, 4, 'On se retrouve');
select tests.throws(format($$insert into public.couple_barometer (household_id, week_of, level) values (%L, date_trunc('week', current_date)::date + 2, 3)$$, :'H'), 'baromètre : semaine commençant un lundi');
select tests.throws(format($$insert into public.couple_barometer (household_id, week_of, level) values (%L, date_trunc('week', current_date)::date - 7, 6)$$, :'H'), 'baromètre : 5 positions seulement');
select tests.throws(format($$insert into public.couple_barometer (household_id, user_id, week_of, level) values (%L, %L, date_trunc('week', current_date)::date - 7, 3)$$, :'H', :'CP'), 'baromètre : impossible d''écrire au nom de l''autre');
set request.jwt.claim.sub = :'CP';
insert into public.couple_barometer (id, household_id, week_of, level, shared) values (:'B2', :'H', date_trunc('week', current_date)::date, 2, true);
select tests.ok(tests.count('select * from public.couple_barometer') = 1, 'baromètre : la jauge privée de l''autre reste invisible');
update public.couple_barometer set level = 1 where id = :'B1';
delete from public.couple_barometer where id = :'B1';
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_barometer') = 2 and tests.count($$select * from public.couple_barometer where id = 'f30c0000-0000-4000-8000-0000000000f1' and level = 4$$) = 1,
  'baromètre : je vois la mienne et celle que l''autre a partagée ; la mienne est intacte');
select tests.throws(format($$update public.couple_barometer set user_id = %L where id = %L$$, :'CP', :'B1'), 'baromètre : autrice non modifiable');
update public.couple_barometer set shared = true where id = :'B1';
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_barometer') = 2, 'baromètre : partagée ensuite, visible de l''autre');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.couple_barometer') = 0, 'baromètre : nounou, rien');
select tests.throws(format($$insert into public.couple_barometer (household_id, week_of, level) values (%L, date_trunc('week', current_date)::date, 3)$$, :'H'), 'baromètre : nounou, écriture refusée');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.couple_barometer') = 0, 'baromètre : non-membre, rien');
select tests.throws(format($$insert into public.couple_barometer (household_id, week_of, level) values (%L, date_trunc('week', current_date)::date, 3)$$, :'H'), 'baromètre : non-membre, écriture refusée');

-- ================================================================ 175 Intimité : une envie, sans pression
set request.jwt.claim.sub = :'OW';
select tests.ok((public.couple_send(:'H', :'CP', 'share', 'J''ai envie qu''on se retrouve, sans aucune pression.', 'desire', null, null, 'f30c0000-0000-4000-8000-00000000e101')).situation = 'desire',
  'intimité : la situation « envie » est acceptée');
select tests.throws(format($$select public.couple_send(%L, %L, 'share', 'x', 'frequency')$$, :'H', :'CP'), 'intimité : situation inconnue refusée');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'child_language') = 4 and jsonb_array_length(public.export_my_data()->'child_homework') = 1
  and jsonb_array_length(public.export_my_data()->'child_activities') = 1 and jsonb_array_length(public.export_my_data()->'child_games') = 1
  and jsonb_array_length(public.export_my_data()->'couple_barometer') = 1, 'export : langage, jeux, activités, devoirs, ma seule jauge');
set request.jwt.claim.sub = :'NN';
select tests.ok(jsonb_array_length(public.export_my_data()->'child_language') = 0 and jsonb_array_length(public.export_my_data()->'couple_barometer') = 0, 'export nounou : rien');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
insert into public.couple_barometer (household_id, week_of, level, shared) values (:'H', date_trunc('week', current_date)::date, 3, true);
select tests.ok(tests.count('select * from public.child_homework') = 1 and tests.count('select * from public.couple_barometer') = 3, 'co-parent (avant départ) : voit devoirs et jauges partagées');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.child_language_entries') = 0 and tests.count('select * from public.child_activities') = 0
  and tests.count('select * from public.child_homework') = 0 and tests.count('select * from public.child_game_marks') = 0
  and tests.count('select * from public.couple_barometer') = 0, 'ancien membre : plus rien, pas même sa propre jauge');
select tests.throws(format($$insert into public.child_homework (child_id, household_id, subject, instructions, due_on) values (%L, %L, 'X', 'Y', current_date)$$, :'K1', :'H'), 'ancien membre : écriture refusée');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_barometer') = 2, 'ancien membre : sa jauge partagée n''est plus visible du foyer');

-- ================================================================ Suppression
delete from public.child_activities where id = :'X1';
delete from public.child_language_entries where id = :'L1';
select tests.ok(tests.count('select * from public.child_activities') = 0 and tests.count('select * from public.child_language_entries') = 3, 'propriétaire : supprime une activité et une entrée');
reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false); select tests.set_premium(:'XX', false); select tests.set_premium(:'CL', false);
