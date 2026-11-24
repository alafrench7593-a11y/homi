-- =====================================================================
-- Tableau de bord admin des coûts IA (20261213000100_admin_ai_usage.sql) : réservé aux admins, comptages justes
-- (facturé / restitué), aucun identifiant ni texte dans le résultat, estimations lisibles des seuls admins.
-- =====================================================================
\set U1  'ad1a0000-0000-4000-8000-000000000001'
\set U2  'ad1a0000-0000-4000-8000-000000000002'
\set ADM 'ad1a0000-0000-4000-8000-0000000000ad'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'U1', 'aiu-1@exemple.test'), (:'U2', 'aiu-2@exemple.test'), (:'ADM', 'aiu-admin@exemple.test');
insert into public.user_roles (user_id, role) values (:'ADM', 'admin');
select tests.set_premium(:'U1', true);
select tests.set_premium(:'U2', true);
select public.credits_grant_monthly(:'U1', 'premium', now() + interval '30 days', false, 'aiu-g1');
select public.credits_grant_monthly(:'U2', 'premium', now() + interval '30 days', false, 'aiu-g2');

-- U1 : deux lectures réussies + une échouée ; U2 : une question
select public.credits_commit(:'U1', ((public.credits_reserve(:'U1', 'document_read', 'aiu-doc-1'))->>'reservation_id')::uuid);
select public.credits_commit(:'U1', ((public.credits_reserve(:'U1', 'document_read', 'aiu-doc-2'))->>'reservation_id')::uuid);
select public.credits_release(:'U1', ((public.credits_reserve(:'U1', 'document_read', 'aiu-doc-3'))->>'reservation_id')::uuid, 'unreadable');
select public.credits_commit(:'U2', ((public.credits_reserve(:'U2', 'assistant_question', 'aiu-q-1'))->>'reservation_id')::uuid);

-- accès
set role authenticated; set request.jwt.claim.sub = :'U1';
select tests.throws($$select public.admin_ai_usage(30)$$, 'coûts IA : refusé à un parent');
select tests.throws($$select public.admin_set_ai_cost('document_read', 0.002)$$, 'coûts IA : estimation non modifiable par un parent');
select tests.throws($$select * from public.ai_cost_estimates$$, 'coûts IA : table des estimations illisible pour un parent');
set role anon; set request.jwt.claim.sub = '';
select tests.throws($$select public.admin_ai_usage(30)$$, 'coûts IA : refusé sans compte');

-- admin
set role authenticated; set request.jwt.claim.sub = :'ADM';
select public.admin_set_ai_cost('document_read', 0.0021, 'Gemini flash-lite, estimation 24/11');
select tests.ok((select (x->>'requests')::int = 3 and (x->>'billed')::int = 2 and (x->>'refunded')::int = 1
                   and (x->>'credits')::int = 10 and (x->>'users')::int = 1 and (x->>'eur_estimate')::numeric = 0.0042
                   and (x->>'eur_per_call')::numeric = 0.0021
                 from jsonb_array_elements(public.admin_ai_usage(30)->'actions') x where x->>'action' = 'document_read'),
  'coûts IA : lectures comptées (3 demandes, 2 facturées, 1 restituée, 10 crédits) avec estimation');
select tests.ok((select x->>'eur_per_call' is null from jsonb_array_elements(public.admin_ai_usage(30)->'actions') x
                 where x->>'action' = 'assistant_question'), 'coûts IA : action sans estimation → coût inconnu, pas zéro');
select tests.ok((public.admin_ai_usage(30)->'per_user'->>'max')::numeric >= 10, 'coûts IA : maximum par compte');
select tests.ok(public.admin_ai_usage(30)::text !~ 'ad1a0000|aiu-', 'coûts IA : aucun identifiant de compte ni clé dans le résultat');
reset role; set request.jwt.claim.sub = '';
