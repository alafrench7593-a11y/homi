-- Assistant IA payant même verrou Premium coupé (migration 20261110000100 + 20261110000200).
\set PX '94000000-0000-4000-8000-000000000001'
\set PI '94000000-0000-4000-8000-000000000002'
\set PM '94000000-0000-4000-8000-000000000003'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'PX', 'payant-x@exemple.test'), (:'PI', 'payant-i@exemple.test'), (:'PM', 'payant-m@exemple.test');
insert into public.entitlement_grants (user_id, entitlement, active) values (:'PI', 'ASSISTANT_IA', true);

update public.premium_policy set strict = false, assistant_paid = true;
select tests.ok(public.assistant_paid(), 'assistant payant : interrupteur actif');
select tests.ok(public._plan_limit_of('assistant_questions_per_month', :'PX') = 0, 'assistant payant : verrou coupé, compte gratuit → 0 question');
select tests.ok((select allowed from public.consume_assistant_quota(:'PX')) is not true, 'assistant payant : première question refusée sans abonnement');
select tests.ok((select allowed from public.consume_assistant_quota(:'PI')), 'assistant payant : l''offre Assistant IA garde ses questions');
select tests.ok(public._plan_limit_of('assistant_questions_per_month', :'PI') = 250, 'assistant payant : offre Assistant IA → 250 questions');
select tests.set_premium(:'PM', true);
select tests.ok((select allowed from public.consume_assistant_quota(:'PM')), 'assistant payant : une abonnée Premium garde ses questions');
select tests.set_premium(:'PM', false);
select tests.ok(public._plan_limit_of('product_scans_per_month', :'PX') = (select free_value from public.plan_limits where key = 'product_scans_per_month'),
  'assistant payant : les autres limites gratuites ne changent pas');
set role authenticated; set request.jwt.claim.sub = :'PX';
-- Un compte normal : la règle d'accès filtre la ligne, la modification ne touche rien (aucune erreur levée)
update public.premium_policy set assistant_paid = false;
reset role;
select tests.ok(public.assistant_paid(), 'assistant payant : un compte ne peut pas couper l''interrupteur');

-- Retour à l'état des autres tests
update public.premium_policy set strict = false, assistant_paid = false;
