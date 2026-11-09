-- Preuves des failles de l'audit du 09/11/2026 (échouent AVANT la migration 20261109000100_audit_acces.sql,
-- réussissent APRÈS). À placer dans supabase/tests/sql/93_audit_correctifs.sql une fois la migration ajoutée.
\set FM 'd0930000-0000-4000-8000-000000000001'
\set FX 'd0930000-0000-4000-8000-000000000002'
\set FI 'd0930000-0000-4000-8000-000000000003'
\set FH 'd0930000-0000-4000-8000-0000000000a1'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'FM', 'preuve-maman@exemple.test'), (:'FX', 'preuve-autre@exemple.test'), (:'FI', 'preuve-ia@exemple.test');
insert into public.households (id, name, created_by) values (:'FH', 'Foyer preuve', :'FM');
insert into public.household_members (household_id, user_id, role) values (:'FH', :'FM', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.entitlement_grants (user_id, entitlement, active) values (:'FI', 'ASSISTANT_IA', true);

-- Faille 1 (P2) : Premium strict contourné par l'assistant (questions IA gratuites)
update public.premium_policy set strict = true;
select tests.ok((select allowed from public.consume_assistant_quota(:'FX')) is not true, 'correctif strict : aucune question IA sans Premium ni offre IA');
select tests.ok((select allowed from public.consume_assistant_quota(:'FI')), 'correctif strict : l''offre Assistant IA garde ses questions');
select tests.set_premium(:'FM', true);
select tests.ok((select allowed from public.consume_assistant_quota(:'FM')), 'correctif strict : une abonnée garde ses questions');
select tests.set_premium(:'FM', false);
update public.premium_policy set strict = false;
select tests.ok((select quota from public.consume_assistant_quota(:'FX')) = 5, 'correctif strict : interrupteur coupé → ancien modèle (5 questions)');

-- Faille 2 (P3) : oracle d'appartenance à un foyer
set role authenticated; set request.jwt.claim.sub = :'FX';
select tests.ok(not public.is_member_of(:'FH', :'FM'), 'correctif oracle : une autre famille ne peut pas tester l''appartenance à un foyer');
select tests.ok(public.is_member_of((select household_id from public.household_members where user_id = auth.uid() limit 1), auth.uid())
  or not exists (select 1 from public.household_members where user_id = auth.uid()), 'correctif oracle : on peut toujours vérifier sa propre appartenance');
set role authenticated; set request.jwt.claim.sub = :'FM';
select tests.ok(public.is_member_of(:'FH', :'FM'), 'correctif oracle : un membre du foyer obtient la réponse');
reset role;
set role anon; set request.jwt.claim.sub = '';
select tests.throws($$select public.is_member_of('d0930000-0000-4000-8000-0000000000a1', 'd0930000-0000-4000-8000-000000000001')$$, 'correctif oracle : refusé sans compte');
reset role;
