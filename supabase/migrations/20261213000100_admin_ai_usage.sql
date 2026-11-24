-- =====================================================================
-- Tableau de bord admin des coûts IA (Aura Vision, lot 2 — 24/11/2026).
-- Lit UNIQUEMENT les réserves de crédits (action, statut, coût, date) : aucun texte, aucune donnée de famille,
-- aucun identifiant de compte dans le résultat. Coûts en euros = ESTIMATIONS saisies par la propriétaire
-- (table ai_cost_estimates, lisible des seuls admins), jamais une facture du fournisseur.
-- =====================================================================

create table if not exists public.ai_cost_estimates (
  action text primary key check (action ~ '^[a-z0-9_]{2,40}$'),
  eur_per_call numeric(10,5) not null check (eur_per_call >= 0 and eur_per_call < 10),
  source text not null default 'estimation' check (char_length(source) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.ai_cost_estimates enable row level security;
revoke all on public.ai_cost_estimates from anon, authenticated;
-- Aucune politique : lecture et écriture passent par les fonctions admin ci-dessous (rôle revérifié).

create or replace function public.admin_ai_usage(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d integer := least(greatest(coalesce(p_days, 30), 1), 365);
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  return jsonb_build_object(
    'days', d,
    'ai_enabled', public._ai_enabled(),
    'paying', (select count(*) from public.subscriptions where status in ('active','grace')),
    'actions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'action', a.action,
        'requests', a.requests, 'billed', a.billed, 'refunded', a.refunded,
        'credits', a.credits, 'users', a.users,
        'eur_per_call', e.eur_per_call, 'eur_estimate', round(e.eur_per_call * a.billed, 4), 'source', e.source
      ) order by a.requests desc)
      from (
        select r.action, count(*) requests,
               count(*) filter (where r.status = 'committed') billed,
               count(*) filter (where r.status in ('released','expired')) refunded,
               coalesce(sum(r.cost) filter (where r.status = 'committed'), 0) credits,
               count(distinct r.user_id) users
        from public.credit_reservations r
        where r.created_at > now() - make_interval(days => d)
        group by r.action
      ) a left join public.ai_cost_estimates e on e.action = a.action), '[]'::jsonb),
    -- Répartition des crédits consommés par compte (médiane, 95e centile, maximum) : repère les usages extrêmes
    -- sans nommer personne.
    'per_user', (
      select jsonb_build_object(
        'p50', coalesce(percentile_cont(0.5) within group (order by c), 0),
        'p95', coalesce(percentile_cont(0.95) within group (order by c), 0),
        'max', coalesce(max(c), 0))
      from (select sum(cost) c from public.credit_reservations
            where status = 'committed' and created_at > now() - make_interval(days => d) group by user_id) u)
  );
end $$;

create or replace function public.admin_set_ai_cost(p_action text, p_eur numeric, p_source text default 'estimation')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  insert into public.ai_cost_estimates (action, eur_per_call, source) values (p_action, p_eur, coalesce(p_source, 'estimation'))
  on conflict (action) do update set eur_per_call = excluded.eur_per_call, source = excluded.source, updated_at = now();
end $$;

revoke all on function public.admin_ai_usage(integer) from public, anon;
revoke all on function public.admin_set_ai_cost(text, numeric, text) from public, anon;
grant execute on function public.admin_ai_usage(integer) to authenticated;
grant execute on function public.admin_set_ai_cost(text, numeric, text) to authenticated;
