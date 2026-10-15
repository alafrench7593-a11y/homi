-- =====================================================================
-- Parcours fertilité : confidentialité des données intimes.
-- Identités propres à ce fichier (le compte de Camille est supprimé
-- à la fin de 20_*.sql) : Inès (propriétaire), Sacha (coparent qui voit
-- TOUS les domaines, y compris « santé »), Zoé (inconnue).
-- =====================================================================
\set INES    'f1f1f1f1-0000-4000-8000-000000000001'
\set SACHA    'f1f1f1f1-0000-4000-8000-000000000002'
\set ZOE     '33333333-3333-4333-8333-333333333333'
\set FOYER   'f1f1f1f1-0000-4000-8000-0000000000f0'

insert into auth.users (id, email) values (:'INES', 'ines@exemple.test'), (:'SACHA', 'sacha@exemple.test');
update public.profiles set journeys = '{ttc}' where id = :'INES';
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer d''Inès', :'INES');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 (:'FOYER', :'SACHA', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']);

-- ================================================================ INÈS
set role authenticated; set request.jwt.claim.sub = :'INES';
insert into public.intercourse_logs (occurred_on, note) values (current_date - 2, 'note privée'), (current_date - 1, null);
insert into public.fertility_observations (observed_on, bbt_celsius, cervical_mucus) values (current_date - 2, 36.45, 'creamy'), (current_date - 1, 36.70, 'egg_white');
insert into public.contraception_methods (method, started_on, renewal_due_on) values ('implant', current_date - 30, current_date + 1065);
insert into public.consultation_questions (journey, question, household_id, shared) values
  ('ttc', 'Question privée', null, false),
  ('ttc', 'Question partagée avec Sacha', :'FOYER', true);
select tests.ok(tests.count('select * from public.intercourse_logs') = 2, 'fertilité : Inès voit ses rapports notés');
select tests.ok(tests.count('select * from public.fertility_observations') = 2, 'fertilité : Inès voit ses températures et glaire');
select tests.throws($$insert into public.intercourse_logs (user_id, occurred_on) values ('f1f1f1f1-0000-4000-8000-000000000002', current_date)$$,
  'fertilité : impossible d''écrire un rapport au nom d''une autre personne');
select tests.throws($$insert into public.fertility_observations (observed_on) values (current_date)$$,
  'fertilité : observation vide refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, bbt_celsius) values (current_date, 45)$$,
  'fertilité : température invraisemblable refusée');
select tests.throws($$insert into public.fertility_observations (observed_on, bbt_celsius) values (current_date - 1, 36.5)$$,
  'fertilité : une seule observation par jour');
select tests.throws($$insert into public.consultation_questions (journey, question, shared) values ('ttc', 'x', true)$$,
  'consultation : partage impossible sans foyer');
select tests.throws($$insert into public.consultation_questions (journey, question, household_id) values ('ttc', 'x', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  'consultation : impossible de rattacher une question à un foyer dont on n''est pas membre');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal' -> 'intercourse_logs') = 2, 'export RGPD : Inès retrouve ses propres rapports dans SON export');
reset role;

-- ================================================================ SACHA (coparent, domaine santé en lecture ET écriture)
set role authenticated; set request.jwt.claim.sub = :'SACHA';
select tests.ok(tests.count('select * from public.intercourse_logs') = 0, 'fertilité : le coparent ne peut PAS lire les rapports (même avec le domaine santé)');
select tests.ok(tests.count('select * from public.fertility_observations') = 0, 'fertilité : le coparent ne voit pas la température ni la glaire');
select tests.ok(tests.count('select * from public.contraception_methods') = 0, 'contraception : le coparent ne voit pas la méthode d''Inès');
update public.intercourse_logs set note = 'modifié' where user_id = :'INES';
delete from public.intercourse_logs where user_id = :'INES';
select tests.ok(tests.count('select * from public.consultation_questions') = 1, 'consultation : le coparent voit uniquement la question partagée');
update public.consultation_questions set question = 'modifiée par Sacha';
delete from public.consultation_questions;
select tests.ok((public.export_my_data() -> 'personal' -> 'intercourse_logs') = '[]'::jsonb, 'export : l''export du coparent ne contient pas les rapports d''Inès');
select tests.ok((public.export_my_data() -> 'personal' -> 'fertility_observations') = '[]'::jsonb, 'export : l''export du coparent ne contient pas les observations d''Inès');
reset role;
select tests.ok((select count(*) from public.intercourse_logs where user_id = :'INES' and coalesce(note, '') <> 'modifié') = 2, 'fertilité : le coparent ne peut ni modifier ni supprimer les rapports');
select tests.ok((select count(*) from public.consultation_questions where user_id = :'INES' and question not like 'modifiée%') = 2, 'consultation : le coparent ne peut ni modifier ni supprimer les questions');

-- Si Inès retire le partage, la question disparaît pour Sacha
set role authenticated; set request.jwt.claim.sub = :'INES';
update public.consultation_questions set shared = false where shared;
reset role;
set role authenticated; set request.jwt.claim.sub = :'SACHA';
select tests.ok(tests.count('select * from public.consultation_questions') = 0, 'consultation : partage retiré -> plus visible par le coparent');
reset role;

-- ================================================================ ZOÉ (inconnue) et anonyme
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.intercourse_logs') + tests.count('select * from public.fertility_observations')
  + tests.count('select * from public.contraception_methods') + tests.count('select * from public.consultation_questions') = 0,
  'fertilité : une inconnue ne voit rien');
reset role;
set role anon;
select tests.throws('select * from public.intercourse_logs', 'fertilité : aucun accès anonyme aux rapports');
reset role;

-- ================================================================ Suppression du compte : cascade
set role service_role;
select tests.ok(public.delete_user_account(:'INES') is not null, 'suppression : compte d''Inès supprimé');
reset role;
select tests.ok((select count(*) from public.intercourse_logs where user_id = :'INES') + (select count(*) from public.fertility_observations where user_id = :'INES')
  + (select count(*) from public.contraception_methods where user_id = :'INES') + (select count(*) from public.consultation_questions where user_id = :'INES') = 0,
  'suppression : données de fertilité et de contraception effacées avec le compte');
