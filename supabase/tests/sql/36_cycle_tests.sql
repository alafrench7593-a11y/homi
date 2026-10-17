-- =====================================================================
-- « Comprendre mon cycle et mes tests » : glaire, tests d'ovulation et
-- de grossesse, préférences, stockage privé des photos chiffrées.
-- Identités propres à ce fichier : Léa (propriétaire), Nina (autre
-- compte, même foyer avec TOUS les domaines), Zoé (inconnue).
-- =====================================================================
\set LEA     'c7c7c7c7-0000-4000-8000-000000000001'
\set NINA    'c7c7c7c7-0000-4000-8000-000000000002'
\set ZOE     '33333333-3333-4333-8333-333333333333'
\set FOYER   'c7c7c7c7-0000-4000-8000-0000000000f0'
\set PHOTO   'c7c7c7c7-0000-4000-8000-000000000001/c7c7c7c7-0000-4000-8000-0000000000a1.enc'

insert into auth.users (id, email) values (:'LEA', 'cycle-lea@exemple.test'), (:'NINA', 'cycle-nina@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer de Léa', :'LEA');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 (:'FOYER', :'NINA', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']);

-- ================================================================ LÉA
set role authenticated; set request.jwt.claim.sub = :'LEA';

-- Glaire : nouvelles valeurs, texture / sensation seules, suggestion photo
insert into public.fertility_observations (observed_on, cervical_mucus) values (current_date - 6, 'unusual'), (current_date - 5, 'unknown');
insert into public.fertility_observations (observed_on, mucus_texture) values (current_date - 4, 'stretchy');
insert into public.fertility_observations (observed_on, mucus_sensation) values (current_date - 3, 'slippery');
insert into public.fertility_observations (observed_on, cervical_mucus, mucus_texture, mucus_sensation, photo_suggestion, photo_confidence, photo_path)
  values (current_date - 2, 'egg_white', 'stretchy', 'wet', 'egg_white', 0.62, :'PHOTO');
select tests.ok(tests.count('select * from public.fertility_observations where cervical_mucus in (''unusual'',''unknown'')') = 2, 'cycle : nouvelles valeurs de glaire acceptées (inhabituelle, je ne sais pas)');
select tests.ok(tests.count('select * from public.fertility_observations where cervical_mucus is null and bbt_celsius is null and note is null') = 2, 'cycle : une observation avec seulement la texture ou la sensation est valide');
select tests.ok((select photo_confidence from public.fertility_observations where observed_on = current_date - 2) = 0.62, 'cycle : Léa relit la suggestion photo et sa confiance');

select tests.throws($$insert into public.fertility_observations (observed_on, cervical_mucus) values (current_date - 20, 'mauvaise')$$, 'cycle : valeur de glaire inconnue refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, mucus_texture) values (current_date - 20, 'gluante')$$, 'cycle : texture inconnue refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, mucus_sensation) values (current_date - 20, 'chaude')$$, 'cycle : sensation inconnue refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, cervical_mucus, photo_suggestion) values (current_date - 20, 'dry', 'fertile')$$, 'cycle : suggestion photo inconnue refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, cervical_mucus, photo_confidence) values (current_date - 20, 'dry', 1.5)$$, 'cycle : confiance 1.5 refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, cervical_mucus, photo_path) values (current_date - 20, 'dry', 'c7c7c7c7-0000-4000-8000-000000000001/photo.jpg')$$, 'cycle : chemin de photo non chiffré (.jpg) refusé');
select tests.throws($$insert into public.fertility_observations (observed_on, cervical_mucus, photo_path) values (current_date - 20, 'dry', 'c7c7c7c7-0000-4000-8000-000000000002/c7c7c7c7-0000-4000-8000-0000000000a9.enc')$$, 'cycle : chemin de photo dans le dossier d''une autre personne refusé');

-- Tests d'ovulation
insert into public.ovulation_tests (tested_at, result, brand_id, brand_label, format, minutes_after, within_read_window,
                                    analysis_outcome, analysis_confidence, analysis_method, user_confirmed, photo_path)
  values (now() - interval '1 day', 'uncertain', 'generic_lh', 'Test LH générique', 'lines', 7, 'yes',
          'lh_peak_possible', 0.55, 'on_device_lines', true, :'PHOTO');
select tests.ok((select analysis_outcome || '/' || format || '/' || within_read_window || '/' || user_confirmed::text from public.ovulation_tests) = 'lh_peak_possible/lines/yes/true',
  'ovulation : Léa enregistre et relit marque, format, délai et analyse');
select tests.ok((select column_default from information_schema.columns where table_name = 'ovulation_tests' and column_name = 'user_confirmed') = 'false',
  'ovulation : « confirmé par la personne » vaut faux par défaut');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, analysis_outcome) values (now(), 'positive', 'possibly_positive')$$, 'ovulation : résultat d''analyse inconnu refusé');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, format) values (now(), 'positive', 'cross')$$, 'ovulation : format « croix » refusé (réservé aux tests de grossesse)');
select tests.throws($$insert into public.ovulation_tests (tested_at, result) values (now(), 'enceinte')$$, 'ovulation : résultat inconnu refusé');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, analysis_confidence) values (now(), 'negative', 1.5)$$, 'ovulation : confiance 1.5 refusée');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, minutes_after) values (now(), 'negative', 2000)$$, 'ovulation : délai de lecture invraisemblable refusé');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, brand_id) values (now(), 'negative', repeat('x', 61))$$, 'ovulation : identifiant de marque trop long refusé');
select tests.throws($$insert into public.ovulation_tests (tested_at, result, photo_path) values (now(), 'negative', '../c7c7c7c7-0000-4000-8000-000000000001/x.enc')$$, 'ovulation : chemin de photo mal formé refusé');

-- Tests de grossesse
insert into public.pregnancy_tests (tested_at, result, brand_id, brand_label, format, minutes_after, within_read_window,
                                    analysis_outcome, analysis_confidence, analysis_method, user_confirmed, expected_period_on, photo_path)
  values (now(), 'faint', 'generic_hcg', 'Test hCG générique', 'cross', 4, 'yes',
          'possibly_positive', 0.40, 'on_device_lines', false, current_date + 2, :'PHOTO');
insert into public.pregnancy_tests (tested_at, result, analysis_outcome) values (now() - interval '2 days', 'uncertain', 'unusable');
select tests.ok(tests.count('select * from public.pregnancy_tests where format = ''cross'' and expected_period_on = current_date + 2') = 1, 'grossesse : Léa enregistre format croix et date des règles attendues');
select tests.throws($$insert into public.pregnancy_tests (tested_at, result, analysis_outcome) values (now(), 'positive', 'lh_peak_possible')$$, 'grossesse : résultat d''analyse inconnu refusé');
select tests.throws($$insert into public.pregnancy_tests (tested_at, result, analysis_confidence) values (now(), 'positive', 1.5)$$, 'grossesse : confiance 1.5 refusée');
select tests.throws($$insert into public.pregnancy_tests (tested_at, result, analysis_method) values (now(), 'positive', 'cloud_ai')$$, 'grossesse : méthode d''analyse inconnue refusée');
select tests.throws($$insert into public.pregnancy_tests (tested_at, result, photo_path) values (now(), 'positive', 'c7c7c7c7-0000-4000-8000-000000000001/test.png')$$, 'grossesse : chemin de photo non chiffré refusé');

-- Préférences
insert into public.cycle_preferences (track_intercourse) values (true);
select tests.ok((select track_intercourse from public.cycle_preferences where user_id = :'LEA'), 'préférences : Léa enregistre son choix (suivi des rapports)');
select tests.throws($$insert into public.cycle_preferences (track_intercourse) values (false)$$, 'préférences : une seule ligne par personne');
select tests.throws($$insert into public.cycle_preferences (user_id, track_intercourse) values ('c7c7c7c7-0000-4000-8000-000000000002', true)$$, 'préférences : impossible d''écrire au nom d''une autre personne');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal' -> 'cycle_preferences') = 1, 'export RGPD : Léa retrouve ses préférences du cycle');
select tests.ok((public.export_my_data() -> 'personal' -> 'ovulation_tests' -> 0 ->> 'analysis_outcome') = 'lh_peak_possible', 'export RGPD : les nouvelles colonnes des tests sont exportées');

-- Stockage chiffré : dossier personnel
insert into storage.objects (bucket_id, name) values ('cycle-private', :'PHOTO');
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''cycle-private''') = 1, 'stockage : Léa dépose et voit sa photo chiffrée');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('cycle-private', 'c7c7c7c7-0000-4000-8000-000000000001/photo.jpg')$$, 'stockage : fichier non chiffré (.jpg) refusé');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('cycle-private', 'c7c7c7c7-0000-4000-8000-000000000002/c7c7c7c7-0000-4000-8000-0000000000b1.enc')$$, 'stockage : Léa ne peut pas déposer dans le dossier de Nina');
reset role;

select tests.ok((select not public and file_size_limit = 6291456 and allowed_mime_types = array['application/octet-stream'] from storage.buckets where id = 'cycle-private'),
  'stockage : bucket cycle-private privé, 6 Mo, octets opaques uniquement');
select tests.ok(not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd = 'UPDATE' and qual like '%cycle-private%'),
  'stockage : aucune politique de modification sur cycle-private');

-- ================================================================ NINA (même foyer, tous les domaines)
set role authenticated; set request.jwt.claim.sub = :'NINA';
select tests.ok(tests.count('select * from public.ovulation_tests') = 0, 'confidentialité : Nina ne voit pas les tests d''ovulation de Léa');
select tests.ok(tests.count('select * from public.pregnancy_tests') = 0, 'confidentialité : Nina ne voit pas les tests de grossesse de Léa');
select tests.ok(tests.count('select * from public.fertility_observations') = 0, 'confidentialité : Nina ne voit pas les observations de glaire de Léa');
select tests.ok(tests.count('select * from public.cycle_preferences') = 0, 'confidentialité : Nina ne voit pas les préférences de Léa');
update public.ovulation_tests set result = 'negative' where user_id = :'LEA';
update public.cycle_preferences set track_intercourse = false where user_id = :'LEA';
delete from public.pregnancy_tests where user_id = :'LEA';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''cycle-private''') = 0, 'stockage : Nina ne voit pas les fichiers de Léa');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('cycle-private', 'c7c7c7c7-0000-4000-8000-000000000001/c7c7c7c7-0000-4000-8000-0000000000b2.enc')$$, 'stockage : Nina ne peut pas déposer dans le dossier de Léa');
delete from storage.objects where bucket_id = 'cycle-private';
update storage.objects set name = 'c7c7c7c7-0000-4000-8000-000000000002/vol.enc' where bucket_id = 'cycle-private';
select tests.ok((public.export_my_data() -> 'personal' -> 'cycle_preferences') = '[]'::jsonb, 'export : l''export de Nina ne contient pas les préférences de Léa');
reset role;
select tests.ok((select result from public.ovulation_tests where user_id = :'LEA') = 'uncertain', 'confidentialité : Nina ne peut pas modifier un test de Léa');
select tests.ok((select track_intercourse from public.cycle_preferences where user_id = :'LEA'), 'confidentialité : Nina ne peut pas modifier les préférences de Léa');
select tests.ok((select count(*) from public.pregnancy_tests where user_id = :'LEA') = 2, 'confidentialité : Nina ne peut pas supprimer un test de Léa');
select tests.ok((select count(*) from storage.objects where bucket_id = 'cycle-private' and name = :'PHOTO') = 1, 'stockage : Nina ne peut ni supprimer ni renommer le fichier de Léa');

-- Léa peut modifier ses préférences (updated_at mis à jour) et supprimer son fichier
set role authenticated; set request.jwt.claim.sub = :'LEA';
update public.cycle_preferences set track_intercourse = false;
select tests.ok(not (select track_intercourse from public.cycle_preferences), 'préférences : Léa modifie son choix');
update storage.objects set name = 'c7c7c7c7-0000-4000-8000-000000000001/c7c7c7c7-0000-4000-8000-0000000000c1.enc' where bucket_id = 'cycle-private';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''cycle-private'' and name = ''' || :'PHOTO' || '''') = 1, 'stockage : même la propriétaire ne peut pas réécrire un fichier (supprimer puis renvoyer)');
delete from storage.objects where bucket_id = 'cycle-private';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''cycle-private''') = 0, 'stockage : Léa supprime sa photo chiffrée');
reset role;

-- ================================================================ ZOÉ (inconnue) et anonyme
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.ovulation_tests') + tests.count('select * from public.pregnancy_tests')
  + tests.count('select * from public.fertility_observations') + tests.count('select * from public.cycle_preferences') = 0,
  'cycle : une inconnue ne voit rien');
reset role;
set role anon;
select tests.throws('select * from public.cycle_preferences', 'préférences : aucun accès anonyme');
reset role;

-- ================================================================ Suppression du compte : cascade
set role service_role;
select tests.ok(public.delete_user_account(:'LEA') is not null, 'suppression : compte de Léa supprimé');
reset role;
select tests.ok((select count(*) from public.ovulation_tests where user_id = :'LEA') + (select count(*) from public.pregnancy_tests where user_id = :'LEA')
  + (select count(*) from public.fertility_observations where user_id = :'LEA') + (select count(*) from public.cycle_preferences where user_id = :'LEA') = 0,
  'suppression : tests, observations et préférences effacés avec le compte');
