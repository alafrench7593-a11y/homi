-- =====================================================================
-- Parcours « cycle » et centres d'intérêt : valeurs autorisées, rien d'autre.
-- =====================================================================
\set CLE 'c7c1e000-0000-4000-8000-000000000046'
insert into auth.users (id, email) values (:'CLE', 'cycle-cle@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'CLE';
update public.profiles set journeys = array['cycle'], interests = array['health','community'] where id = :'CLE';
select tests.ok((select journeys = array['cycle'] and interests = array['health','community'] from public.profiles where id = :'CLE'), 'parcours : « cycle » et intérêts santé/communauté acceptés');
select tests.throws($$update public.profiles set journeys = array['inconnu'] where id = 'c7c1e000-0000-4000-8000-000000000046'$$, 'parcours : une valeur inconnue est refusée');
select tests.throws($$update public.profiles set interests = array['publicite'] where id = 'c7c1e000-0000-4000-8000-000000000046'$$, 'intérêts : une valeur inconnue est refusée');
reset role;
