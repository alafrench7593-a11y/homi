-- Audit (suite) : on ne peut plus savoir si UNE AUTRE membre est abonnée ou fait partie d'un groupe.
\set OA 'e6a00000-0000-4000-8000-000000000001'
\set OB 'e6a00000-0000-4000-8000-000000000002'
\set OG 'e6a00000-0000-4000-8000-0000000000c1'
reset role;
insert into auth.users (id, email) values (:'OA', 'oracle-a@exemple.test'), (:'OB', 'oracle-b@exemple.test');
insert into public.subscriptions (user_id, status, store, period_type, expires_at, will_renew)
  values (:'OA', 'active', 'test', 'monthly', now() + interval '20 days', true);
insert into public.community_groups (id, name, kind) values (:'OG', 'Groupe thématique sensible', 'theme');
insert into public.group_members (group_id, user_id) values (:'OG', :'OA');

-- ---------------------------------------------------------------- la personne elle-même
set role authenticated; set request.jwt.claim.sub = :'OA';
select tests.ok(public.has_premium(), 'oracles : sa propre réponse Premium reste exacte');
select tests.ok(public.is_group_member(:'OG'), 'oracles : sa propre appartenance reste exacte');
select tests.ok(public.plan_limit('children_count') is not null, 'oracles : ses propres limites restent lisibles');

-- ---------------------------------------------------------------- une autre membre
set request.jwt.claim.sub = :'OB';
select tests.ok(not public.has_premium(:'OA'), 'oracles : impossible de savoir si une autre membre est Premium');
select tests.ok(public.plan_limit('children_count', :'OA') is null, 'oracles : les limites d''une autre membre ne sont pas révélées');
select tests.ok(not public.is_group_member(:'OG', :'OA'), 'oracles : impossible de savoir si une autre membre est dans un groupe');
select tests.ok(public.can_see_group(:'OG'), 'oracles : un groupe thématique reste visible');
select tests.throws(format('select public._premium_of(%L)', :'OA'), 'oracles : fonction interne Premium non appelable');
select tests.throws(format('select public._group_member_of(%L, %L)', :'OG', :'OA'), 'oracles : fonction interne d''appartenance non appelable');
reset role;

-- ---------------------------------------------------------------- sans connexion
set role anon; set request.jwt.claim.sub = '';
select tests.ok(not public.has_premium(:'OA'), 'oracles : sans connexion, aucune réponse sur une membre');
select tests.ok(not public.is_blocked_between(:'OA', :'OB'), 'oracles : sans connexion, aucun blocage révélé');
reset role;

-- ---------------------------------------------------------------- le serveur garde la vraie réponse
set request.jwt.claim.sub = '';
select tests.ok(public.has_premium(:'OA'), 'oracles : le serveur obtient la réponse réelle');
select tests.ok(public.is_group_member(:'OG', :'OA'), 'oracles : le serveur obtient l''appartenance réelle');
select tests.ok(position('_group_member_of(' in pg_get_functiondef('public.invite_to_group(uuid,text)'::regprocedure)) > 0,
  'oracles : l''invitation dans un groupe utilise la fonction interne');
