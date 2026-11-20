-- Mesure du parcours « première réussite » et du paywall (03/12/2026) — NON APPLIQUÉE en production (à déployer
-- avec deployer-migrations.command après relecture). Voir docs/PAYWALL_ONBOARDING.md.
--
-- 1. analytics_events : événements du parcours (onboarding_started, demo_completed, paywall_viewed, plan_selected,
--    paywall_closed, account_required, purchase_outcome, trial_confirmed, reminder_set), écrits par l'application
--    SEULEMENT si la personne a accepté la mesure d'audience (privacy_settings.analytics_enabled) ; propriétés en liste
--    blanche (étape de vie, besoin, formule, variante A/B…), jamais de donnée de santé, d'enfant ou de journal.
--    Lecture : aucune pour les comptes (service_role seulement).
-- 2. conversion_events : first_billing_confirmed, écrit par le webhook RevenueCat (service_role), dédoublonné par
--    transaction (unique kind + transaction_id).
-- 3. paywall_ab_results : métrique principale du test A/B (première facturation confirmée / personnes exposées).

create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  install_id uuid not null,
  name text not null check (name in ('onboarding_started', 'demo_completed', 'paywall_viewed', 'plan_selected', 'paywall_closed',
    'account_required', 'purchase_outcome', 'trial_confirmed', 'reminder_set')),
  props jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- Liste blanche des propriétés (miroir de src/lib/analytics/events.ts : ALLOWED_PROPS)
  constraint analytics_events_props_allowed check (
    jsonb_typeof(props) = 'object'
    and (props - array['stage', 'need', 'tier', 'period', 'variant', 'direction', 'trial', 'outcome', 'source', 'step']) = '{}'::jsonb
    and pg_column_size(props) < 1024)
);
create index if not exists analytics_events_name_idx on public.analytics_events (name, occurred_at);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to authenticated;
grant usage, select on sequence public.analytics_events_id_seq to authenticated;

drop policy if exists analytics_events_insert_consented on public.analytics_events;
create policy analytics_events_insert_consented on public.analytics_events for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.privacy_settings ps where ps.user_id = auth.uid() and ps.analytics_enabled)
  );

create table if not exists public.conversion_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('first_billing_confirmed')),
  transaction_id text not null,
  product_id text,
  after_trial boolean not null default false,
  store text,
  environment text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint conversion_events_unique_tx unique (kind, transaction_id)
);
create index if not exists conversion_events_user_idx on public.conversion_events (user_id);
alter table public.conversion_events enable row level security;
revoke all on public.conversion_events from anon, authenticated;

-- Métrique principale du test A/B « titre du paywall » : personnes exposées (paywall_viewed) par variante,
-- et parmi elles celles dont la première facturation est confirmée par la boutique (production seulement).
create or replace view public.paywall_ab_results with (security_invoker = true) as
with exposed as (
  select distinct on (e.user_id) e.user_id, e.props->>'variant' as variant, e.occurred_at
  from public.analytics_events e
  where e.name = 'paywall_viewed' and e.props ? 'variant'
  order by e.user_id, e.occurred_at
)
select x.variant,
  count(*) as exposed,
  count(c.user_id) as first_billing_confirmed,
  round(count(c.user_id)::numeric / nullif(count(*), 0), 4) as conversion_rate
from exposed x
left join lateral (
  select ce.user_id from public.conversion_events ce
  where ce.user_id = x.user_id and ce.kind = 'first_billing_confirmed' and ce.occurred_at >= x.occurred_at
    and coalesce(ce.environment, 'PRODUCTION') = 'PRODUCTION'
  limit 1
) c on true
group by x.variant;
revoke all on public.paywall_ab_results from anon, authenticated;

-- ---------------------------------------------------------------- Export RGPD (« Exporter mes données »)
-- Mes événements de mesure et mes conversions figurent dans l'export (même principe que 20261130100600_export_partiels2).
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_paywall' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_paywall;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_paywall() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_raw_paywall() || jsonb_build_object(
    'analytics_events', (select coalesce(jsonb_agg(jsonb_build_object('name', e.name, 'props', e.props, 'occurred_at', e.occurred_at) order by e.occurred_at), '[]')
                         from public.analytics_events e where e.user_id = v_uid),
    'conversion_events', (select coalesce(jsonb_agg(jsonb_build_object('kind', c.kind, 'product_id', c.product_id, 'after_trial', c.after_trial, 'occurred_at', c.occurred_at) order by c.occurred_at), '[]')
                          from public.conversion_events c where c.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;
-- Retour arrière : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_paywall()
--   rename to _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
--   drop view public.paywall_ab_results; drop table public.conversion_events; drop table public.analytics_events;
