-- =====================================================================
-- Prénoms des membres (16/11/2026) — household_member_names : prénom affiché + photo, rien d'autre ;
-- membres actifs d'un même foyer seulement ; nounou : les parents du foyer qui l'emploie.
-- =====================================================================
\set OW 'ab98ee00-0000-4000-8000-000000000001'
\set CP 'ab98ee00-0000-4000-8000-000000000002'
\set NN 'ab98ee00-0000-4000-8000-000000000003'
\set N2 'ab98ee00-0000-4000-8000-000000000004'
\set RV 'ab98ee00-0000-4000-8000-000000000005'
\set XO 'ab98ee00-0000-4000-8000-000000000006'
\set H  'ab98ee00-0000-4000-8000-0000000000a1'
\set HX 'ab98ee00-0000-4000-8000-0000000000a2'
\set F1 'ab98ee00-0000-4000-8000-00000000f001'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'n98-owner@exemple.test'), (:'CP', 'n98-coparent@exemple.test'), (:'NN', 'n98-nounou@exemple.test'),
  (:'N2', 'n98-nounou2@exemple.test'), (:'RV', 'n98-revoque@exemple.test'), (:'XO', 'n98-autre@exemple.test');
update public.profiles set display_name = 'Camille' where id = :'OW';
update public.profiles set display_name = '  Sam  ', avatar_path = :'CP' || '/' || :'F1' || '.jpg', locale = 'fr' where id = :'CP';
update public.profiles set display_name = 'Zoé' where id = :'NN';
update public.profiles set display_name = 'Inès' where id = :'N2';
update public.profiles set display_name = 'Alex' where id = :'RV';
update public.profiles set display_name = 'Intrus' where id = :'XO';
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98n', :'OW'), (:'HX', 'Autre foyer 98n', :'XO');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'HX', :'XO', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'CP', 'coparent', '{daily,lists}', '{daily,lists}'),
  (:'H', :'NN', 'caregiver', '{daily}', '{daily}'),
  (:'H', :'N2', 'caregiver', '{daily}', '{daily}'),
  (:'H', :'RV', 'coparent', '{daily}', '{daily}');

-- Forme du résultat : exactement ces 5 colonnes (rien d'autre du profil)
select tests.ok(pg_get_function_result('public.household_member_names(uuid)'::regprocedure)
  = 'TABLE(household_id uuid, user_id uuid, role text, display_name text, avatar_path text)', 'prénoms : seules 5 colonnes exposées (aucun autre champ du profil)');
select tests.ok(not has_function_privilege('anon', 'public.household_member_names(uuid)', 'execute'), 'prénoms : visiteur sans compte (anon) → exécution refusée');
select tests.ok(has_function_privilege('authenticated', 'public.household_member_names(uuid)', 'execute'), 'prénoms : compte connecté → exécution permise');

set role authenticated;
-- Propriétaire : tous les membres actifs du foyer, prénoms nettoyés, photo
set request.jwt.claim.sub = :'OW';
select tests.ok((select display_name from public.household_member_names(:'H') where user_id = :'CP') = 'Sam', 'prénoms : la propriétaire lit « Sam » (espaces retirés), pas « Coparent »');
select tests.ok((select avatar_path from public.household_member_names(:'H') where user_id = :'CP') = :'CP' || '/' || :'F1' || '.jpg', 'prénoms : photo du co-parent exposée');
select tests.ok((select count(*) from public.household_member_names(:'H')) = 5, 'prénoms : la propriétaire voit les 5 membres actifs (nounous comprises)');
select tests.ok((select display_name from public.household_member_names(:'H') where user_id = :'NN') = 'Zoé', 'prénoms : la propriétaire voit le prénom de la nounou qu''elle emploie');
select tests.ok((select count(*) from public.household_member_names(null) where household_id = :'HX') = 0, 'prénoms : rien d''un foyer dont on n''est pas membre (appel sans foyer)');
select tests.ok((select count(*) from public.household_member_names(:'HX')) = 0, 'prénoms : autre foyer demandé explicitement → vide (négatif)');
-- Le profil reste illisible en lecture directe
select tests.ok(tests.count('select * from public.profiles where id = ''ab98ee00-0000-4000-8000-000000000002''') = 0, 'prénoms : le profil du co-parent reste illisible en lecture directe');

-- Co-parent : voit la propriétaire et les nounous
set request.jwt.claim.sub = :'CP';
select tests.ok((select display_name from public.household_member_names(:'H') where user_id = :'OW') = 'Camille', 'prénoms : le co-parent lit « Camille »');
select tests.ok((select count(*) from public.household_member_names(:'H')) = 5, 'prénoms : le co-parent voit tous les membres actifs');

-- Nounou : elle-même + les parents, jamais l'autre professionnelle
set request.jwt.claim.sub = :'NN';
select tests.ok((select count(*) from public.household_member_names(:'H') where user_id in (:'OW', :'CP', :'RV')) = 3, 'prénoms : la nounou voit les prénoms des parents du foyer qui l''emploie');
select tests.ok((select count(*) from public.household_member_names(:'H') where user_id = :'N2') = 0, 'prénoms : la nounou ne voit PAS l''autre nounou du foyer (négatif)');
select tests.ok((select count(*) from public.household_member_names(:'H') where user_id = :'NN') = 1, 'prénoms : la nounou se voit elle-même');
select tests.ok((select count(*) from public.household_member_names(:'H')) = 4, 'prénoms : nounou → exactement 4 lignes (parents + elle-même)');
select tests.ok((select count(*) from public.household_member_names(null) where household_id = :'HX') = 0, 'prénoms : la nounou ne voit rien d''un autre foyer');

-- Autre foyer
set request.jwt.claim.sub = :'XO';
select tests.ok((select count(*) from public.household_member_names(:'H')) = 0, 'prénoms : personne d''un autre foyer → aucun prénom du foyer (négatif)');
select tests.ok((select count(*) from public.household_member_names(null) where user_id in (:'OW', :'CP', :'NN')) = 0, 'prénoms : autre foyer, appel global → aucun membre du foyer');

-- Membre révoqué (retrait par la propriétaire) : plus rien, immédiatement
set request.jwt.claim.sub = :'RV';
select tests.ok((select count(*) from public.household_member_names(:'H')) = 5, 'prénoms : membre actif avant révocation (témoin)');
set request.jwt.claim.sub = :'OW';
delete from public.household_members where household_id = :'H' and user_id = :'RV';
set request.jwt.claim.sub = :'RV';
select tests.ok((select count(*) from public.household_member_names(:'H')) = 0, 'prénoms : membre révoqué → plus aucun prénom (négatif)');
select tests.ok((select count(*) from public.household_member_names(null) where household_id = :'H') = 0, 'prénoms : membre révoqué, appel global → rien du foyer');
set request.jwt.claim.sub = :'OW';
select tests.ok((select count(*) from public.household_member_names(:'H') where user_id = :'RV') = 0, 'prénoms : le membre révoqué disparaît de la liste des autres');

-- Nounou révoquée
delete from public.household_members where household_id = :'H' and user_id = :'NN';
set request.jwt.claim.sub = :'NN';
select tests.ok((select count(*) from public.household_member_names(:'H')) = 0, 'prénoms : nounou retirée → plus aucun prénom des parents (négatif)');

-- Session vide
set request.jwt.claim.sub = '';
select tests.ok((select count(*) from public.household_member_names(null)) = 0, 'prénoms : sans session → rien');
reset role;
