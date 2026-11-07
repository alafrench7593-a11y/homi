-- Offres du 07/11/2026 : Assistant IA (250 questions), outils à vie à 1 €, mois gratuit, données consultables.
\set OA 'f9c00000-0000-4000-8000-000000000001'
\set OB 'f9c00000-0000-4000-8000-000000000002'
\set OC 'f9c00000-0000-4000-8000-000000000003'
\set OH 'f9c00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'OA', 'offre-a@exemple.test'), (:'OB', 'offre-b@exemple.test'), (:'OC', 'offre-c@exemple.test');
insert into public.households (id, name, created_by) values (:'OH', 'Foyer offres', :'OA');
insert into public.household_members (household_id, user_id, role) values (:'OH', :'OA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'OH', :'OB', 'coparent') on conflict do nothing;

-- Pendant le mois gratuit : tout est ouvert
set role authenticated; set request.jwt.claim.sub = :'OC';
select tests.ok(public.has_tool('custody') and public.has_tool('pma_tracker'), 'offres : outils ouverts pendant le mois gratuit');
select tests.ok(public.has_tool('emergency'), 'offres : un outil gratuit reste toujours ouvert');
select tests.ok((public.my_access()->>'trial_until')::timestamptz >= timestamptz '2026-12-07 00:00:00+01', 'offres : comptes existants, essai jusqu''au 07/12/2026 au moins');
insert into public.pma_protocols (id, kind, label, started_on) values ('f9c00000-0000-4000-8000-0000000000c1', 'fiv', 'FIV', current_date);

-- Après le mois gratuit (simulé en remplaçant temporairement la date de fin d'essai)
reset role;
create temporary table _saved_def as select pg_get_functiondef('public._tool_trial_until(uuid)'::regprocedure) as d;
create or replace function public._tool_trial_until(p_user uuid) returns timestamptz language sql stable security definer set search_path = public as $$ select now() - interval '1 day' $$;
set role authenticated; set request.jwt.claim.sub = :'OC';
select tests.ok(not public.has_tool('pma_tracker'), 'offres : après l''essai, outil payant fermé sans achat');
select tests.throws($$insert into public.pma_logs (protocol_id, kind) values ('f9c00000-0000-4000-8000-0000000000c1', 'note')$$,
  'offres : après l''essai, ajout refusé (premium_required)');
select tests.ok((select count(*) from public.pma_protocols) = 1, 'offres : après l''essai, les données restent consultables');
update public.pma_protocols set label = 'FIV 1' where id = 'f9c00000-0000-4000-8000-0000000000c1';
select tests.ok((select label from public.pma_protocols) = 'FIV 1', 'offres : après l''essai, modification encore possible');
select tests.ok(public.has_tool('emergency'), 'offres : outil gratuit toujours ouvert après l''essai');

-- Achat à vie (écrit par le serveur) : ouvert pour soi et pour le coparent du foyer
reset role;
insert into public.entitlement_grants (user_id, entitlement, product_id, store, active) values (:'OA', 'TOOL_CUSTODY', 'aufildenous_tool_custody', 'app_store', true);
set role authenticated; set request.jwt.claim.sub = :'OA';
select tests.ok(public.has_tool('custody') and not public.has_tool('pma_tracker'), 'offres : outil acheté ouvert, les autres restent fermés');
set request.jwt.claim.sub = :'OB';
select tests.ok(public.has_tool('custody'), 'offres : outil acheté par un parent ouvert pour le coparent');
insert into public.custody_plans (household_id, label_a, label_b, cycle, anchor_on) values (:'OH', 'A', 'B', 'AAAAAAABBBBBBB', current_date);
select tests.ok((select count(*) from public.custody_plans) = 1, 'offres : le coparent peut ajouter dans l''outil acheté');
set request.jwt.claim.sub = :'OC';
select tests.ok(not public.has_tool('custody'), 'offres : hors du foyer, l''achat ne sert pas');
select tests.throws($$insert into public.entitlement_grants (user_id, entitlement, active) values ('f9c00000-0000-4000-8000-000000000003', 'TOOL_PMA_TRACKER', true)$$,
  'offres : impossible de s''attribuer un droit soi-même');

-- Assistant IA : 250 questions par mois
reset role;
select tests.ok(public._plan_limit_of('assistant_questions_per_month', 'f9c00000-0000-4000-8000-000000000003') = (select free_value from public.plan_limits where key = 'assistant_questions_per_month'),
  'offres : sans offre, quota gratuit de l''assistant');
insert into public.entitlement_grants (user_id, entitlement, product_id, active, expires_at) values (:'OC', 'ASSISTANT_IA', 'aufildenous_ai_monthly', true, now() + interval '20 days');
select tests.ok(public._plan_limit_of('assistant_questions_per_month', 'f9c00000-0000-4000-8000-000000000003') = 250, 'offres : Assistant IA → 250 questions par mois');
select tests.ok(public._plan_limit_of('product_scans_per_month', 'f9c00000-0000-4000-8000-000000000003') = (select free_value from public.plan_limits where key = 'product_scans_per_month'),
  'offres : l''Assistant IA ne donne pas les autres avantages Premium');
update public.entitlement_grants set expires_at = now() - interval '1 minute' where user_id = :'OC' and entitlement = 'ASSISTANT_IA';
select tests.ok(public._plan_limit_of('assistant_questions_per_month', 'f9c00000-0000-4000-8000-000000000003') < 250, 'offres : Assistant IA expiré → retour au quota gratuit');

-- Restauration de la vraie définition
do $$ begin execute (select d from _saved_def); end $$;
select tests.ok(public._tool_trial_until('f9c00000-0000-4000-8000-000000000003') >= timestamptz '2026-12-07 00:00:00+01', 'offres : définition de l''essai restaurée');
