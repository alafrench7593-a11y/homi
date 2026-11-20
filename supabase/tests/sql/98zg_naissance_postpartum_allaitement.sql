-- =====================================================================
-- Naissance, post-partum, allaitement (27/11/2026) — 20261127000200_naissance_postpartum_allaitement.sql
-- 39 contractions · 44 projet de naissance · 48 préparation du coparent (liste privée partageable) · 58/60 rééducation
-- et cicatrisation · 73/74 stock de lait · 76/77 difficultés et douleurs d'allaitement · 79 laits infantiles
-- Comptes distincts : parent enceinte puis allaitante (OW), second parent (CP), nounou confirmée de Lou (NN),
-- non-membre (XX), ancien membre (EX, co-parent retiré du foyer en fin de fichier).
-- =====================================================================
\set OW 'f27b0000-0000-4000-8000-000000000001'
\set CP 'f27b0000-0000-4000-8000-000000000002'
\set NN 'f27b0000-0000-4000-8000-000000000003'
\set XX 'f27b0000-0000-4000-8000-000000000005'
\set EX 'f27b0000-0000-4000-8000-000000000006'
\set H  'f27b0000-0000-4000-8000-0000000000a1'
\set H2 'f27b0000-0000-4000-8000-0000000000a2'
\set K1 'f27b0000-0000-4000-8000-0000000000c1'
\set PG 'f27b0000-0000-4000-8000-0000000000b1'
\set S1 'f27b0000-0000-4000-8000-0000000000d1'
\set L1 'f27b0000-0000-4000-8000-0000000000e1'
\set PU 'f27b0000-0000-4000-8000-0000000000f1'
\set BF 'f27b0000-0000-4000-8000-0000000000f2'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zg-parent@exemple.test'), (:'CP', 'f98zg-parent2@exemple.test'),
  (:'NN', 'f98zg-nounou@exemple.test'), (:'XX', 'f98zg-inconnu@exemple.test'), (:'EX', 'f98zg-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zg', :'OW'), (:'H2', 'Autre foyer 98zg', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,pregnancy,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,pregnancy,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 60);
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'PG', :'H', :'OW', current_date + 20);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true);
select tests.set_premium(:'XX', true); select tests.set_premium(:'NN', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW'; select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';

-- ================================================================ 39 Contractions (personnel)
set request.jwt.claim.sub = :'OW';
insert into public.contractions (session_id, pregnancy_id, started_at, ended_at) values
  (:'S1', :'PG', now() - interval '20 minutes', now() - interval '19 minutes'),
  (:'S1', :'PG', now() - interval '12 minutes', now() - interval '11 minutes 10 seconds');
insert into public.contractions (session_id, pregnancy_id, started_at) values (:'S1', :'PG', now() - interval '30 seconds');
select tests.ok(tests.count($$select * from public.contractions where user_id = 'f27b0000-0000-4000-8000-000000000001'$$) = 3, 'contractions : enregistrées (horodatages absolus), une en cours');
update public.contractions set ended_at = now() where ended_at is null;
select tests.ok(tests.count('select * from public.contractions where ended_at is null') = 0, 'contractions : fin enregistrée sur la même ligne');
select tests.throws(format($$insert into public.contractions (session_id, started_at, ended_at) values (%L, now(), now() - interval '1 minute')$$, :'S1'), 'contraction : fin avant le début refusée');
select tests.throws(format($$insert into public.contractions (session_id, started_at, ended_at) values (%L, now() - interval '2 hours', now())$$, :'S1'), 'contraction : durée invraisemblable refusée');
select tests.throws(format($$insert into public.contractions (user_id, session_id, started_at) values (%L, %L, now())$$, :'CP', :'S1'), 'contraction : jamais au nom d''une autre personne');
delete from public.contractions where started_at < now() - interval '15 minutes';
select tests.ok(tests.count('select * from public.contractions') = 2, 'contractions : suppression d''une saisie');

-- ================================================================ 44 Projet de naissance (personnel)
insert into public.birth_plans (pregnancy_id, answers) values (:'PG', '{"support":{"choices":["partner","midwife"],"note":"Ma sœur si possible"},"ambiance":{"choices":["dim_light","music"]}}');
select tests.ok(tests.count($$select * from public.birth_plans where answers->'support'->>'note' = 'Ma sœur si possible'$$) = 1, 'projet de naissance : réponses enregistrées');
insert into public.birth_plans (pregnancy_id, answers) values (:'PG', '{"ambiance":{"choices":["quiet"]}}')
  on conflict (user_id, pregnancy_id) do update set answers = excluded.answers;
select tests.ok(tests.count('select * from public.birth_plans') = 1 and tests.count($$select * from public.birth_plans where answers ? 'ambiance' and not answers ? 'support'$$) = 1,
  'projet de naissance : un par grossesse, modifiable');
select tests.throws(format($$insert into public.birth_plans (pregnancy_id, answers) values (%L, '{"Section libre":{"choices":["x"]}}') on conflict (user_id, pregnancy_id) do update set answers = excluded.answers$$, :'PG'), 'projet : clé de section inconnue refusée');
select tests.throws(format($$insert into public.birth_plans (pregnancy_id, answers) values (%L, '{"support":{"note":%s}}') on conflict (user_id, pregnancy_id) do update set answers = excluded.answers$$, :'PG', to_json(repeat('a', 1200))::text), 'projet : note trop longue refusée');
set request.jwt.claim.sub = :'XX';
select tests.throws(format($$insert into public.birth_plans (pregnancy_id, answers) values (%L, '{}')$$, :'PG'), 'projet : grossesse d''un autre foyer refusée');

-- ================================================================ 48 Préparation du coparent : liste privée puis partagée
set request.jwt.claim.sub = :'OW';
insert into public.checklists (id, household_id, pregnancy_id, kind, title, private_to_creator) values (:'L1', :'H', null, 'coparent', 'Préparation du coparent à l''accouchement', true);
insert into public.checklist_items (checklist_id, household_id, label, note) values (:'L1', :'H', 'Numéro de la maternité', '01 23 45 67 89'), (:'L1', :'H', 'Trajet repéré', null);
select tests.ok(tests.count($$select * from public.checklists where id = 'f27b0000-0000-4000-8000-0000000000e1' and created_by = 'f27b0000-0000-4000-8000-000000000001'$$) = 1, 'liste : autrice posée par le serveur');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count($$select * from public.checklists where id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 0
  and tests.count($$select * from public.checklist_items where checklist_id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 0, 'liste privée : invisible du second parent tant qu''elle n''est pas partagée');
update public.checklists set private_to_creator = false where id = :'L1';
insert into public.checklist_items (checklist_id, household_id, label) select :'L1', :'H', 'Ajout' where false;
select tests.throws(format($$insert into public.checklist_items (checklist_id, household_id, label) values (%L, %L, 'Intrus')$$, :'L1', :'H'), 'liste privée : le second parent n''y ajoute rien');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.checklists where private_to_creator$$) = 1, 'liste privée : le second parent n''a pas pu la partager à sa place');
update public.checklists set private_to_creator = false where id = :'L1';
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count($$select * from public.checklist_items where checklist_id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 2, 'liste partagée par la personne enceinte : visible du second parent');
update public.checklist_items set done = true, done_by = :'CP' where label = 'Trajet repéré';
select tests.throws(format($$update public.checklists set private_to_creator = true where id = %L$$, :'L1'), 'liste : seul l''autrice la reprend en privé');
reset role;
update public.household_members set can_view = array_append(can_view, 'lists') where user_id = :'NN' and not ('lists' = any(can_view));
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count($$select * from public.checklist_items where checklist_id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 0
  and tests.count($$select * from public.checklists where id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 0, 'nounou (même avec accès aux listes) : ne voit pas la préparation partagée entre parents');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.checklist_items where done and done_by = 'f27b0000-0000-4000-8000-000000000002'$$) = 1, 'liste partagée : le second parent a coché');
update public.checklists set private_to_creator = true where id = :'L1';
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count($$select * from public.checklist_items where checklist_id = 'f27b0000-0000-4000-8000-0000000000e1'$$) = 0, 'liste reprise en privé : de nouveau invisible');

-- ================================================================ 58 / 60 Rééducation périnéale et cicatrisation (personnel)
set request.jwt.claim.sub = :'OW';
insert into public.reminders (user_id, category, title, schedule, timezone, enabled, deep_link)
  values (:'OW', 'postnatal', 'Séance prévue', jsonb_build_object('type', 'once', 'at', now() + interval '2 days'), 'Europe/Paris', true, '/postpartum/pelvic') returning id as rem \gset
insert into public.postpartum_care_logs (kind, at, status, practitioner, reminder_id) values ('pelvic_session', now() + interval '2 days', 'planned', 'Sage-femme du quartier', :'rem');
insert into public.postpartum_care_logs (kind, at, status) values ('pelvic_session', now() - interval '5 days', 'done');
insert into public.postpartum_care_logs (kind, at, feeling, pain, note) values ('healing', now() - interval '1 day', 'better', 3, 'Moins de tiraillements');
select tests.ok(tests.count('select * from public.postpartum_care_logs') = 3, 'post-partum : séances prévues / faites et journal de cicatrisation enregistrés');
update public.postpartum_care_logs set status = 'done' where status = 'planned';
select tests.ok(tests.count($$select * from public.postpartum_care_logs where status = 'done'$$) = 2, 'séance : marquée faite');
select tests.throws($$insert into public.postpartum_care_logs (kind, at, pain) values ('healing', now(), 11)$$, 'cicatrisation : douleur au-delà de 10 refusée');
select tests.throws($$insert into public.postpartum_care_logs (kind, at) values ('pelvic_session', now())$$, 'séance : statut obligatoire');
insert into storage.objects (bucket_id, name) values ('documents', :'H' || '/partage.jpg');
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'postnatal', 'Photo partagée', :'H' || '/partage.jpg', 'image/jpeg', 1000, false) returning id as doc_shared \gset
select tests.throws(format($$insert into public.postpartum_care_logs (kind, at, pain, document_id) values ('healing', now(), 2, %L)$$, :'doc_shared'), 'cicatrisation : la photo doit rester privée');
insert into storage.objects (bucket_id, name) values ('documents', :'H' || '/cicatrice.jpg');
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
  values (:'H', 'postnatal', 'Photo', :'H' || '/cicatrice.jpg', 'image/jpeg', 1000, true) returning id as doc_priv \gset
insert into public.postpartum_care_logs (kind, at, pain, document_id) values ('healing', now(), 2, :'doc_priv');
select tests.ok(tests.count('select * from public.postpartum_care_logs where document_id is not null') = 1, 'cicatrisation : photo privée facultative');

-- ================================================================ 73 / 74 Stock de lait (parents)
insert into public.pumpings (id, child_id, household_id, at, amount_ml, side) values (:'PU', :'K1', :'H', now() - interval '3 hours', 120, 'both');
insert into public.milk_stock (household_id, child_id, pumping_id, expressed_at, amount_ml, location, use_by)
  values (:'H', :'K1', :'PU', now() - interval '3 hours', 120, 'fridge', now() + interval '45 hours');
insert into public.milk_stock (household_id, child_id, expressed_at, amount_ml, location, use_by)
  values (:'H', :'K1', now() - interval '30 days', 90, 'freezer', now() + interval '90 days');
select tests.ok(tests.count($$select * from public.milk_stock where status = 'stored'$$) = 2, 'stock : deux contenants enregistrés (dont un relié à la séance de tire-lait)');
select tests.throws(format($$insert into public.milk_stock (household_id, expressed_at, amount_ml, location, use_by) values (%L, now(), 100, 'fridge', now() - interval '1 hour')$$, :'H'), 'stock : date limite avant le tirage refusée');
select tests.throws(format($$insert into public.milk_stock (household_id, expressed_at, amount_ml, location, use_by) values (%L, now(), 0, 'fridge', now() + interval '1 day')$$, :'H'), 'stock : quantité nulle refusée');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.milk_stock') = 2, 'second parent : voit le stock');
update public.milk_stock set status = 'used', closed_at = now() where location = 'freezer';
select tests.ok(tests.count($$select * from public.milk_stock where status = 'used'$$) = 1, 'second parent : consomme le plus ancien');
set request.jwt.claim.sub = :'XX';
select tests.throws(format($$insert into public.milk_stock (household_id, pumping_id, expressed_at, amount_ml, location, use_by) values (%L, %L, now(), 100, 'fridge', now() + interval '1 day')$$, :'H2', :'PU'),
  'stock : séance de tire-lait d''un autre foyer refusée');

-- ================================================================ 76 / 77 Difficultés et douleurs d'allaitement (personnel)
set request.jwt.claim.sub = :'OW';
insert into public.breastfeeds (id, child_id, household_id, side, started_at, ended_at) values (:'BF', :'K1', :'H', 'left', now() - interval '2 hours', now() - interval '1 hour 45 minutes');
insert into public.breastfeeding_issues (child_id, breastfeed_id, at, side, kind, pain, note) values (:'K1', :'BF', now() - interval '2 hours', 'left', 'sore_nipple', 6, 'Douleur à la prise du sein');
insert into public.breastfeeding_issues (child_id, at, kind, pain) values (:'K1', now() - interval '1 day', 'engorgement', 4);
select tests.ok(tests.count('select * from public.breastfeeding_issues') = 2, 'allaitement : difficultés et douleurs notées (tétée liée facultative)');
select tests.throws(format($$insert into public.breastfeeding_issues (child_id, at, kind, pain) values (%L, now(), 'latch', 12)$$, :'K1'), 'douleur : échelle 0–10');
select tests.throws(format($$insert into public.breastfeeding_issues (child_id, at, kind) values (%L, now(), 'diagnostic')$$, :'K1'), 'difficulté : type inconnu refusé');
update public.breastfeeding_issues set pain = 5 where kind = 'sore_nipple';
select tests.ok(tests.count('select * from public.breastfeeding_issues where pain = 5') = 1, 'difficulté : modifiable');

-- ================================================================ 79 Laits infantiles (parents ; nounou en lecture)
insert into public.formula_changes (child_id, household_id, brand, kind, started_on, ended_on, reason) values (:'K1', :'H', 'Lait A', 'first_age', current_date - 50, current_date - 20, 'start');
insert into public.formula_changes (child_id, household_id, brand, kind, started_on, reason, observations) values (:'K1', :'H', 'Lait B', 'anti_regurgitation', current_date - 20, 'professional_advice', 'Sur conseil du pédiatre');
select tests.ok(tests.count('select * from public.formula_changes') = 2, 'laits infantiles : historique enregistré');
select tests.throws(format($$insert into public.formula_changes (child_id, household_id, brand, kind, started_on, ended_on) values (%L, %L, 'X', 'other', current_date, current_date - 1)$$, :'K1', :'H'), 'lait : fin avant le début refusée');

-- ================================================================ Second parent, nounou, non-membre
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.contractions') = 0 and tests.count('select * from public.birth_plans') = 0
  and tests.count('select * from public.postpartum_care_logs') = 0 and tests.count('select * from public.breastfeeding_issues') = 0,
  'second parent : aucune donnée personnelle de l''autre (contractions, projet, post-partum, allaitement)');
update public.breastfeeding_issues set note = 'lu';
delete from public.postpartum_care_logs;
select tests.ok(tests.count('select * from public.formula_changes') = 2, 'second parent : voit les laits infantiles');
update public.formula_changes set observations = 'Bien toléré' where brand = 'Lait B';
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.formula_changes') = 2, 'nounou confirmée de Lou : lit les laits infantiles (biberons)');
select tests.throws(format($$insert into public.formula_changes (child_id, household_id, brand, kind, started_on) values (%L, %L, 'Lait C', 'other', current_date)$$, :'K1', :'H'), 'nounou : n''écrit pas l''historique des laits');
update public.formula_changes set brand = 'modifié';
select tests.ok(tests.count('select * from public.milk_stock') = 0 and tests.count('select * from public.contractions') = 0
  and tests.count('select * from public.breastfeeding_issues') = 0 and tests.count('select * from public.birth_plans') = 0, 'nounou : ni stock, ni données personnelles');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.formula_changes') = 0 and tests.count('select * from public.milk_stock') = 0
  and tests.count('select * from public.postpartum_care_logs') = 0, 'non-membre : rien');
select tests.throws(format($$insert into public.formula_changes (child_id, household_id, brand, kind, started_on) values (%L, %L, 'Intrus', 'other', current_date)$$, :'K1', :'H'), 'non-membre : écriture refusée');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.formula_changes where brand = 'modifié'$$) = 0 and tests.count($$select * from public.formula_changes where observations = 'Bien toléré'$$) = 1
  and tests.count('select * from public.postpartum_care_logs') = 4 and tests.count($$select * from public.breastfeeding_issues where note = 'lu'$$) = 0,
  'écritures de la nounou, du second parent sur les données personnelles : sans effet');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.milk_stock') = 2 and tests.count('select * from public.formula_changes') = 2, 'co-parent (avant départ) : voit stock et laits');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.milk_stock') = 0 and tests.count('select * from public.formula_changes') = 0
  and tests.count('select * from public.contractions') = 0 and tests.count('select * from public.checklist_items') = 0, 'ancien membre : plus rien');
select tests.throws(format($$insert into public.milk_stock (household_id, expressed_at, amount_ml, location, use_by) values (%L, now(), 100, 'fridge', now() + interval '1 day')$$, :'H'), 'ancien membre : écriture refusée');

-- ================================================================ Export RGPD
set request.jwt.claim.sub = :'OW';
select tests.ok(jsonb_array_length(public.export_my_data()->'birth_feeding'->'contractions') = 2
  and jsonb_array_length(public.export_my_data()->'birth_feeding'->'milk_stock') = 2
  and jsonb_array_length(public.export_my_data()->'birth_feeding'->'postpartum_care') = 4, 'export : données de naissance et d''allaitement dans « Exporter mes données »');
set request.jwt.claim.sub = :'CP';
select tests.ok(jsonb_array_length(public.export_my_data()->'birth_feeding'->'contractions') = 0
  and jsonb_array_length(public.export_my_data()->'birth_feeding'->'formula_changes') = 2, 'export du second parent : sans les données personnelles de l''autre');

reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false);
select tests.set_premium(:'XX', false); select tests.set_premium(:'NN', false);
