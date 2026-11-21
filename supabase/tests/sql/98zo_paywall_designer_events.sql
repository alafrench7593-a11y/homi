-- Passe Paywall Designer (04/12/2026) : migration 20261204000100_paywall_designer_events.
-- Les trois nouveaux événements sont acceptés (avec consentement), un nom inconnu reste refusé, la liste blanche des
-- propriétés ne change pas.
reset role;
\set PC 'f30d0000-0000-4000-8000-000000000003'
\set IN 'f30d0000-0000-4000-8000-0000000000e2'
insert into auth.users (id, email) values (:'PC', 'pw-c@exemple.test') on conflict do nothing;
insert into public.privacy_settings (user_id, analytics_enabled) values (:'PC', true)
  on conflict (user_id) do update set analytics_enabled = excluded.analytics_enabled;

set role authenticated; set request.jwt.claim.sub = :'PC';
insert into public.analytics_events (install_id, name, props, occurred_at) values
  (:'IN', 'onboarding_step_viewed', '{"step":"need"}', now()),
  (:'IN', 'onboarding_answer', '{"step":"stage","stage":"baby"}', now()),
  (:'IN', 'purchase_started', '{"tier":"premium","period":"annual","trial":true}', now());
select tests.ok(true, 'paywall designer : onboarding_step_viewed, onboarding_answer et purchase_started sont acceptés');
select tests.throws($$ insert into public.analytics_events (install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-0000000000e2', 'onboarding_text', '{}', now()) $$,
  'paywall designer : un nom d''événement inconnu reste refusé');
select tests.throws($$ insert into public.analytics_events (install_id, name, props, occurred_at)
  values ('f30d0000-0000-4000-8000-0000000000e2', 'onboarding_answer', '{"answer":"texte libre"}', now()) $$,
  'paywall designer : une réponse en texte libre (propriété hors liste blanche) est refusée');

reset role; set request.jwt.claim.sub = '';
delete from auth.users where id = :'PC';
