-- Mesure du paywall (03/12/2026) : migration 20261203000100_paywall_analytics.
-- Consentement respecté (aucune écriture sans analytics_enabled), propriétés en liste blanche, aucune lecture par les
-- comptes, first_billing_confirmed dédoublonné par transaction, métrique A/B par variante.
reset role;
\set PA 'f30d0000-0000-4000-8000-000000000001'
\set PB 'f30d0000-0000-4000-8000-000000000002'
\set IN 'f30d0000-0000-4000-8000-0000000000e1'
insert into auth.users (id, email) values (:'PA', 'pw-a@exemple.test'), (:'PB', 'pw-b@exemple.test') on conflict do nothing;
insert into public.privacy_settings (user_id, analytics_enabled) values (:'PA', true), (:'PB', false)
  on conflict (user_id) do update set analytics_enabled = excluded.analytics_enabled;

-- ================================================================ 1. consentement
set role authenticated; set request.jwt.claim.sub = :'PA';
insert into public.analytics_events (install_id, name, props, occurred_at)
  values (:'IN', 'paywall_viewed', '{"variant":"need","stage":"baby","need":"feed_sleep"}', now() - interval '5 days');
select tests.ok(true, 'paywall : un compte qui a accepté la mesure peut écrire un événement');
select tests.throws($$ insert into public.analytics_events (install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-0000000000e1', 'paywall_viewed', '{"child_name":"Lou"}', now()) $$,
  'paywall : une propriété hors liste blanche est refusée');
select tests.throws($$ insert into public.analytics_events (install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-0000000000e1', 'mood_logged', '{}', now()) $$,
  'paywall : un nom d''événement inconnu est refusé');
select tests.throws($$ insert into public.analytics_events (user_id, install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-000000000002', 'f30d0000-0000-4000-8000-0000000000e1', 'paywall_viewed', '{}', now()) $$,
  'paywall : impossible d''écrire au nom d''un autre compte');
select tests.throws($$ select count(*) from public.analytics_events $$, 'paywall : aucun compte ne relit les événements');
select tests.throws($$ select count(*) from public.conversion_events $$, 'paywall : aucun compte ne relit les conversions');

set request.jwt.claim.sub = :'PB';
select tests.throws($$ insert into public.analytics_events (install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-0000000000e1', 'paywall_viewed', '{"variant":"generic"}', now()) $$,
  'paywall : sans consentement à la mesure, aucune écriture');

-- ================================================================ 2. first_billing_confirmed (service_role)
reset role; set request.jwt.claim.sub = '';
insert into public.conversion_events (user_id, kind, transaction_id, product_id, after_trial, store, environment, occurred_at)
  values (:'PA', 'first_billing_confirmed', 'tx-1', 'homi_premium_monthly', true, 'APP_STORE', 'PRODUCTION', now())
  on conflict (kind, transaction_id) do nothing;
insert into public.conversion_events (user_id, kind, transaction_id, product_id, after_trial, store, environment, occurred_at)
  values (:'PA', 'first_billing_confirmed', 'tx-1', 'homi_premium_monthly', true, 'APP_STORE', 'PRODUCTION', now())
  on conflict (kind, transaction_id) do nothing;
select tests.ok((select count(*) from public.conversion_events where transaction_id = 'tx-1') = 1,
  'paywall : un webhook rejoué n''écrit qu''une première facturation (dédoublonnage par transaction)');

-- ================================================================ 3. métrique A/B
select tests.ok((select exposed = 1 and first_billing_confirmed = 1 from public.paywall_ab_results where variant = 'need'),
  'paywall : la variante « need » compte 1 exposé et 1 première facturation confirmée');

-- ================================================================ 4. suppression du compte : tout part avec lui
delete from auth.users where id in (:'PA', :'PB');
select tests.ok((select count(*) from public.analytics_events where user_id = :'PA') = 0
  and (select count(*) from public.conversion_events where user_id = :'PA') = 0,
  'paywall : la suppression du compte efface ses événements et conversions');
