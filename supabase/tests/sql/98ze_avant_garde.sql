-- =====================================================================
-- Avant la garde (25/11/2026) — 20261125000100_avant_garde.sql
-- Comptes distincts : parent (OW), second parent (CP), nounou confirmée de Lou (NN), nounou d'un autre enfant (NO),
-- non-membre (XX), ancien membre (EX, co-parent retiré du foyer), nounou révoquée en fin de fichier (NN).
-- =====================================================================
\set OW 'd0be0000-0000-4000-8000-000000000001'
\set CP 'd0be0000-0000-4000-8000-000000000002'
\set NN 'd0be0000-0000-4000-8000-000000000003'
\set NO 'd0be0000-0000-4000-8000-000000000004'
\set XX 'd0be0000-0000-4000-8000-000000000005'
\set EX 'd0be0000-0000-4000-8000-000000000006'
\set H  'd0be0000-0000-4000-8000-0000000000a1'
\set H2 'd0be0000-0000-4000-8000-0000000000a2'
\set K1 'd0be0000-0000-4000-8000-0000000000c1'
\set K2 'd0be0000-0000-4000-8000-0000000000c2'
\set C1 'd0be0000-0000-4000-8000-0000000000d1'
\set C2 'd0be0000-0000-4000-8000-0000000000d2'
\set Q1 'd0be0000-0000-4000-8000-0000000000e1'
\set V1 'd0be0000-0000-4000-8000-0000000000e2'
\set QX 'd0be0000-0000-4000-8000-0000000000e3'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98ze-parent@exemple.test'), (:'CP', 'f98ze-parent2@exemple.test'),
  (:'NN', 'f98ze-nounou@exemple.test'), (:'NO', 'f98ze-autre@exemple.test'), (:'XX', 'f98ze-inconnu@exemple.test'), (:'EX', 'f98ze-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98ze', :'OW'), (:'H2', 'Autre foyer 98ze', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300), (:'K2', :'H', 'Max', current_date - 700);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true); select tests.set_premium(:'XX', true);

-- Nounous : NN confirmée pour Lou, NO confirmée pour Max (parcours de l'espace nounou)
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
select (public.childcare_invite(:'K2', 'Odile'))->>'token' as t_no \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'NO'; select public.childcare_accept(:'t_no');
set request.jwt.claim.sub = :'OW';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id in (:'NN', :'NO');

-- ================================================================ 142/143 Candidates : fiche, statut, tarif (parents)
insert into public.childcare_candidates (id, household_id, name, kind, phone, availability, rate_mode, hourly_rate, hours_per_week, weeks_per_year, days_per_week, meal_fee_per_day, upkeep_fee_per_day, notes)
  values (:'C1', :'H', 'Sophie Martin', 'assmat', '06 00 00 00 00', 'Lun–ven 8h–18h', 'hourly', 4.20, 40, 52, 5, 4.5, 3.6, 'Jardin, deux autres enfants');
insert into public.childcare_candidates (id, household_id, name, kind, rate_mode, monthly_fee, created_by)
  values (:'C2', :'H', 'Crèche Les Lutins', 'creche', 'monthly', 380, :'CP');
select tests.ok(tests.count($$select * from public.childcare_candidates where created_by = 'd0be0000-0000-4000-8000-000000000001'$$) = 2,
  'candidates : enregistrées, auteur posé par le serveur (un auteur déclaré est ignoré)');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind) values ('d0be0000-0000-4000-8000-0000000000a1', 'X', 'robot')$$, 'candidate : type inconnu refusé');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind, hourly_rate) values ('d0be0000-0000-4000-8000-0000000000a1', 'X', 'nanny', -3)$$, 'candidate : tarif négatif refusé');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind) values ('d0be0000-0000-4000-8000-0000000000a1', '   ', 'nanny')$$, 'candidate : nom vide refusé');

set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.childcare_candidates') = 2, 'second parent : voit les candidates du foyer');
update public.childcare_candidates set status = 'interview', interview_at = now() + interval '2 days' where id = :'C1';
select tests.ok(tests.count($$select * from public.childcare_candidates where status = 'interview' and created_by = 'd0be0000-0000-4000-8000-000000000001'$$) = 1,
  'second parent : modifie le statut (auteur d''origine conservé)');

-- ================================================================ 144/145 Questions d'entretien, checklist de visite, réponses
set request.jwt.claim.sub = :'OW';
insert into public.childcare_prep_items (id, household_id, kind, template_key, position) values (:'Q1', :'H', 'interview', 'experience', 0), (:'V1', :'H', 'visit', 'hygiene', 0);
insert into public.childcare_prep_items (household_id, kind, template_key, position) values (:'H', 'interview', 'experience', 5) on conflict (household_id, kind, template_key) do nothing;
select tests.ok(tests.count($$select * from public.childcare_prep_items where template_key = 'experience'$$) = 1, 'modèle : une seule ligne par question du modèle (envoi répété sans doublon)');
insert into public.childcare_prep_items (household_id, kind, label, position) values (:'H', 'interview', 'Accepte-t-elle les couches lavables ?', 10);
select tests.throws($$insert into public.childcare_prep_items (household_id, kind) values ('d0be0000-0000-4000-8000-0000000000a1', 'visit')$$, 'question : ni modèle ni texte → refusée');
insert into public.childcare_prep_answers (candidate_id, item_id, answer) values (:'C1', :'Q1', '12 ans d''expérience, agréée pour 3 enfants');
insert into public.childcare_prep_answers (candidate_id, item_id, checked) values (:'C2', :'V1', true);
insert into public.childcare_prep_answers (candidate_id, item_id, answer) values (:'C1', :'Q1', 'Agrément renouvelé en 2025')
  on conflict (candidate_id, item_id) do update set answer = excluded.answer;
select tests.ok(tests.count($$select * from public.childcare_prep_answers where household_id = 'd0be0000-0000-4000-8000-0000000000a1'$$) = 2
  and tests.count($$select * from public.childcare_prep_answers where answer like 'Agrément%%'$$) = 1, 'réponses : une par candidate et par question, rattachées au foyer');
set request.jwt.claim.sub = :'XX';
insert into public.childcare_prep_items (id, household_id, kind, label) values (:'QX', :'H2', 'interview', 'Question d''un autre foyer');
set request.jwt.claim.sub = :'OW';
select tests.throws(format($$insert into public.childcare_prep_answers (candidate_id, item_id, answer) values (%L, %L, 'x')$$, :'C1', :'QX'), 'réponse : question d''un autre foyer refusée');
set request.jwt.claim.sub = :'CP';
update public.childcare_prep_answers set checked = true where candidate_id = :'C1' and item_id = :'Q1';
select tests.ok(tests.count($$select * from public.childcare_prep_answers where checked and updated_by = 'd0be0000-0000-4000-8000-000000000002'$$) = 1, 'second parent : coche, auteur de la modification noté');

-- ================================================================ Nounou : aucune donnée de sélection (candidates, tarifs, notes)
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_candidates') = 0 and tests.count('select * from public.childcare_prep_items') = 0
  and tests.count('select * from public.childcare_prep_answers') = 0, 'nounou confirmée : ni candidates, ni tarifs, ni questions, ni notes d''entretien');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind) values ('d0be0000-0000-4000-8000-0000000000a1', 'Moi', 'nanny')$$, 'nounou : ne crée pas de candidate');
update public.childcare_candidates set notes = 'modifié' where household_id = :'H';
delete from public.childcare_prep_answers where household_id = :'H';
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count('select * from public.childcare_candidates') = 0, 'nounou d''un autre enfant : aucune candidate');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count($$select * from public.childcare_candidates where household_id = 'd0be0000-0000-4000-8000-0000000000a1'$$) = 0
  and tests.count($$select * from public.childcare_prep_answers where household_id = 'd0be0000-0000-4000-8000-0000000000a1'$$) = 0, 'non-membre : rien du foyer');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind) values ('d0be0000-0000-4000-8000-0000000000a1', 'Intrus', 'nanny')$$, 'non-membre : écriture refusée');
update public.childcare_candidates set name = 'piraté' where id = :'C1';
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.childcare_candidates where notes = 'modifié' or name = 'piraté'$$) = 0
  and tests.count('select * from public.childcare_prep_answers') = 2, 'nounou et non-membre : modifications et suppressions sans effet');

-- ================================================================ 148 Planning prévu
insert into public.childcare_schedules (child_id, household_id, label, days, starts_on)
  values (:'K1', :'H', 'Chez Sophie', '[{"wd":1,"start":"08:30","end":"17:30"},{"wd":2,"start":"08:30","end":"17:30"},{"wd":4,"start":"08:30","end":"17:30"}]', current_date - 30);
select tests.throws(format($$insert into public.childcare_schedules (child_id, household_id, label, days) values (%L, %L, 'x', '[{"wd":8,"start":"08:00","end":"09:00"}]')$$, :'K1', :'H'), 'planning : jour invalide refusé');
select tests.throws(format($$insert into public.childcare_schedules (child_id, household_id, label, days) values (%L, %L, 'x', '[{"wd":1,"start":"18:00","end":"09:00"}]')$$, :'K1', :'H'), 'planning : fin avant le début refusée');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_schedules') = 1, 'nounou confirmée : voit SES horaires de garde (Lou)');
select tests.throws(format($$insert into public.childcare_schedules (child_id, household_id, label, days) values (%L, %L, 'x', '[]')$$, :'K1', :'H'), 'nounou : ne crée pas de planning');
update public.childcare_schedules set label = 'changé';
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count('select * from public.childcare_schedules') = 0, 'nounou d''un autre enfant : aucun planning de Lou');

-- ================================================================ 150 Absences et congés
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.childcare_schedules where label = 'Chez Sophie'$$) = 1, 'planning : la nounou n''a rien modifié');
insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on, note) values (:'K1', :'H', 'child', current_date + 3, current_date + 4, 'Chez les grands-parents');
insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on) values (:'K1', :'H', 'closure', current_date + 20, current_date + 30);
insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on, caregiver_id) values (:'K1', :'H', 'caregiver_leave', current_date + 10, current_date + 12, :'NN');
select tests.throws(format($$insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on) values (%L, %L, 'child', current_date, current_date - 1)$$, :'K1', :'H'), 'absence : fin avant le début refusée');
select tests.throws(format($$insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on, caregiver_id) values (%L, %L, 'child', current_date, current_date, %L)$$, :'K1', :'H', :'NN'), 'absence de l''enfant : pas de personne rattachée');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_absences') = 2 and tests.count($$select * from public.childcare_absences where kind = 'closure'$$) = 0,
  'nounou : voit l''absence de l''enfant et SES congés, rien d''autre');
insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on, note) values (:'K1', :'H', 'child', current_date + 40, current_date + 41, 'Congé');
select tests.ok(tests.count($$select * from public.childcare_absences where from_on = current_date + 40 and kind = 'caregiver_leave' and caregiver_id = 'd0be0000-0000-4000-8000-000000000003'$$) = 1,
  'nounou : saisit SES congés (genre et personne posés par le serveur)');
select tests.throws(format($$insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on) values (%L, %L, 'caregiver_leave', current_date, current_date)$$, :'K2', :'H'), 'nounou : pas de congé sur un enfant non confié');
delete from public.childcare_absences where kind = 'child';
update public.childcare_absences set to_on = from_on + 1 where from_on = current_date + 40;
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count('select * from public.childcare_absences') = 0, 'nounou d''un autre enfant : aucune absence de Lou ni congé d''une autre nounou');
select tests.throws(format($$insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on) values (%L, %L, 'caregiver_leave', current_date, current_date)$$, :'K1', :'H'), 'nounou d''un autre enfant : pas de congé sur Lou');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.childcare_absences') = 0 and tests.count('select * from public.childcare_schedules') = 0, 'non-membre : ni absences ni planning');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.childcare_absences') = 4 and tests.count($$select * from public.childcare_absences where kind = 'child'$$) = 1
  and tests.count($$select * from public.childcare_absences where from_on = current_date + 40 and to_on = current_date + 41$$) = 1,
  'second parent : voit tout ; la nounou n''a pas effacé l''absence de l''enfant, a modifié SON congé');

-- ================================================================ 149 Heures : arrivées / départs du carnet de liaison (aucune double saisie)
set request.jwt.claim.sub = :'NN';
insert into public.childcare_events (child_id, household_id, kind, at) values (:'K1', :'H', 'arrival', date_trunc('day', now()) - interval '1 day' + interval '8 hours 30 minutes'),
  (:'K1', :'H', 'departure', date_trunc('day', now()) - interval '1 day' + interval '17 hours 15 minutes');
select tests.ok(tests.count($$select * from public.childcare_events where kind in ('arrival','departure')$$) = 2, 'heures : la nounou voit ses pointages');
set request.jwt.claim.sub = :'OW';
insert into public.childcare_events (child_id, household_id, kind, at) values (:'K1', :'H', 'arrival', date_trunc('day', now()) - interval '2 days' + interval '9 hours');
select tests.ok(tests.count($$select * from public.childcare_events where kind in ('arrival','departure') and child_id = 'd0be0000-0000-4000-8000-0000000000c1'$$) = 3,
  'heures : le parent voit et complète les mêmes arrivées / départs (childcare_events)');
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count($$select * from public.childcare_events where child_id = 'd0be0000-0000-4000-8000-0000000000c1'$$) = 0, 'heures : rien de Lou pour la nounou d''un autre enfant');

-- ================================================================ 151 Coffre-fort : catégorie « garde »
set request.jwt.claim.sub = :'OW';
insert into storage.objects (bucket_id, name) values ('documents', :'H' || '/contrat-sophie.pdf');
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'childcare', 'Contrat de travail — Sophie', :'H' || '/contrat-sophie.pdf', 'application/pdf', 1000, false);
select tests.ok(tests.count($$select * from public.documents where category = 'childcare'$$) = 1, 'coffre-fort : document « garde » enregistré dans le coffre existant');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count($$select * from public.documents where category = 'childcare'$$) = 0, 'coffre-fort : le contrat n''est pas visible de la nounou');

-- ================================================================ Export RGPD
set request.jwt.claim.sub = :'OW';
select tests.ok(jsonb_array_length(public.export_my_data()->'childcare_prep'->'candidates') = 2
  and jsonb_array_length(public.export_my_data()->'childcare_prep'->'absences') = 4, 'export : candidates et absences du foyer dans « Exporter mes données »');
set request.jwt.claim.sub = :'NN';
select tests.ok(jsonb_array_length(public.export_my_data()->'childcare_prep'->'candidates') = 0
  and jsonb_array_length(public.export_my_data()->'childcare_prep'->'absences') = 3, 'export nounou : aucune candidate ; ses congés et l''absence de l''enfant seulement');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.childcare_candidates') = 2, 'co-parent (avant départ) : voit les candidates');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.childcare_candidates') = 0 and tests.count('select * from public.childcare_prep_answers') = 0
  and tests.count('select * from public.childcare_absences') = 0 and tests.count('select * from public.childcare_schedules') = 0, 'ancien membre : plus rien');
select tests.throws($$insert into public.childcare_candidates (household_id, name, kind) values ('d0be0000-0000-4000-8000-0000000000a1', 'Encore', 'nanny')$$, 'ancien membre : écriture refusée');

-- ================================================================ Nounou révoquée : plus d'horaires ni de congés
set request.jwt.claim.sub = :'OW';
select public.childcare_revoke((select id from public.childcare_links where caregiver_id = :'NN'));
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_absences') = 0 and tests.count('select * from public.childcare_schedules') = 0, 'nounou révoquée : plus de planning ni de congés');
select tests.throws(format($$insert into public.childcare_absences (child_id, household_id, kind, from_on, to_on) values (%L, %L, 'caregiver_leave', current_date, current_date)$$, :'K1', :'H'), 'nounou révoquée : saisie refusée');

-- ================================================================ Suppression d'une candidate : ses réponses partent avec elle
set request.jwt.claim.sub = :'OW';
delete from public.childcare_candidates where id = :'C1';
select tests.ok(tests.count($$select * from public.childcare_prep_answers where candidate_id = 'd0be0000-0000-4000-8000-0000000000d1'$$) = 0, 'suppression : fiche et réponses supprimées ensemble');
reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false); select tests.set_premium(:'XX', false);
