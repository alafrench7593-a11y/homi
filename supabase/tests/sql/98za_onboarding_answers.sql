-- =====================================================================
-- Onboarding v2 (19/11/2026) — profiles.onboarding_answers / onboarding_version :
-- chacun écrit et relit SES réponses ; aucune fuite entre comptes (lecture, écriture, prénoms des membres).
-- =====================================================================
\set A 'ab98fa00-0000-4000-8000-000000000001'
\set B 'ab98fa00-0000-4000-8000-000000000002'
\set H 'ab98fa00-0000-4000-8000-0000000000a1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'A', 'o98-a@exemple.test'), (:'B', 'o98-b@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer o98', :'A');
insert into public.household_members (household_id, user_id, role) values (:'H', :'A', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'H', :'B', 'coparent', '{daily}', '{daily}');

select tests.ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'onboarding : RLS active sur profiles');
select tests.ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_answers' and data_type = 'jsonb'), 'onboarding : colonne onboarding_answers (jsonb)');
select tests.ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_version'), 'onboarding : colonne onboarding_version');
select tests.ok(pg_get_function_result('public.household_member_names(uuid)'::regprocedure) not ilike '%onboarding%', 'onboarding : réponses absentes des prénoms des membres');

set role authenticated;
-- A enregistre ses réponses et les relit
set request.jwt.claim.sub = :'A';
update public.profiles set onboarding_answers = '{"v":2,"situations":["baby"],"needs":["sleep"],"sharing":"couple","recommendations":{"tools":["kid_sleep","family_nights","baby_bottle_history"]}}'::jsonb,
  onboarding_version = 2, onboarding_completed = true where id = :'A';
select tests.ok((select onboarding_answers->'situations'->>0 from public.profiles where id = :'A') = 'baby', 'onboarding : A relit ses réponses');
select tests.ok((select onboarding_version from public.profiles where id = :'A') = 2, 'onboarding : A relit la version du parcours');

-- B (même foyer) ne lit pas les réponses de A
set request.jwt.claim.sub = :'B';
select tests.ok(tests.count('select onboarding_answers from public.profiles where id = ''ab98fa00-0000-4000-8000-000000000001''') = 0, 'onboarding : le co-parent ne lit PAS les réponses de A (négatif)');
select tests.ok(tests.count('select 1 from public.household_member_names(''ab98fa00-0000-4000-8000-0000000000a1'') m where m::text ilike ''%situations%''') = 0, 'onboarding : rien des réponses de A via les prénoms des membres (négatif)');
-- B tente d'écraser les réponses de A : aucune ligne touchée
update public.profiles set onboarding_answers = '{"pirate":true}'::jsonb, onboarding_version = 9 where id = :'A';
reset role; set request.jwt.claim.sub = '';
select tests.ok((select onboarding_answers ? 'pirate' from public.profiles where id = :'A') is false, 'onboarding : B ne peut pas modifier les réponses de A (négatif)');
select tests.ok((select onboarding_version from public.profiles where id = :'A') = 2, 'onboarding : version de A inchangée après la tentative de B');

-- Visiteur sans compte : rien
set role anon;
select tests.ok(tests.count('select onboarding_answers from public.profiles') = 0, 'onboarding : anon ne lit aucune réponse (négatif)');

-- Contraintes : objet JSON seulement, taille bornée, version dans l'intervalle
reset role;
set role authenticated; set request.jwt.claim.sub = :'B';
select tests.throws($$update public.profiles set onboarding_answers = '["liste"]'::jsonb where id = 'ab98fa00-0000-4000-8000-000000000002'$$, 'onboarding : une liste JSON est refusée (objet attendu)');
select tests.throws($$update public.profiles set onboarding_answers = jsonb_build_object('x', (select string_agg(md5(g::text), '') from generate_series(1, 400) g)) where id = 'ab98fa00-0000-4000-8000-000000000002'$$, 'onboarding : réponses trop volumineuses refusées');
select tests.throws($$update public.profiles set onboarding_version = 0 where id = 'ab98fa00-0000-4000-8000-000000000002'$$, 'onboarding : version hors intervalle refusée');
update public.profiles set onboarding_answers = '{"v":2,"situations":["home"]}'::jsonb, onboarding_version = 2 where id = :'B';
select tests.ok((select onboarding_answers->'situations'->>0 from public.profiles where id = :'B') = 'home', 'onboarding : B enregistre ses propres réponses');
set request.jwt.claim.sub = :'A';
select tests.ok((select onboarding_answers->'situations'->>0 from public.profiles where id = :'A') = 'baby', 'onboarding : les réponses de A restent les siennes');
select tests.ok(tests.count('select 1 from public.profiles where id = ''ab98fa00-0000-4000-8000-000000000002''') = 0, 'onboarding : A ne lit pas le profil de B (négatif)');
reset role; set request.jwt.claim.sub = '';
