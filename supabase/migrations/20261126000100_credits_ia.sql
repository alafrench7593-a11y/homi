-- =====================================================================
-- Crédits IA (26/11/2026) — grand livre serveur, formule Famille, interrupteur de l'IA.  Migration ADDITIVE.
-- Documentation complète : docs/CREDITS_IA.md.
--
-- Décisions de la propriétaire :
--   * Premium strict conservé : sans abonnement actif, aucun crédit (aucun palier gratuit) ;
--   * Premium 1 000 crédits / mois, Famille 1 500 crédits / mois partagés entre les adultes du foyer ;
--   * packs consommables 300 / 800 / 2 000 crédits (homi_credits_300 | _800 | _2000), achetables seulement
--     avec un abonnement actif (règle de l'application ; le serveur crédite TOUJOURS un achat payé).
-- Règles par défaut (réglables dans credit_settings, sans nouvelle version de l'application) :
--   * consommation : crédits mensuels d'abord, puis crédits achetés (rule.consume_order) ;
--   * les crédits mensuels expirent au renouvellement, sans report (rule.monthly_rollover = false) ;
--   * les crédits achetés n'expirent pas ;
--   * Premium : un compte par payeur, partagé avec le second adulte déjà inclus ; Famille : solde commun du foyer ;
--   * remboursement d'un pack : retrait des crédits non consommés du pack, jamais de solde négatif, la part déjà
--     consommée est journalisée.
--
-- 1. subscriptions.tier (colonne GÉNÉRÉE d'après l'identifiant de produit : homi_family* → 'family', sinon
--    'premium') : aucune écriture à changer, aucune incohérence possible. _premium_of : la formule Famille ouvre
--    Premium à TOUS les adultes (owner / coparent) du foyer de la personne abonnée ; Premium inchangé (1 adulte).
-- 2. credit_settings : coûts par action, octrois, packs, règles, interrupteur « ai.enabled ».
-- 3. credit_accounts : un compte par PAYEUR (payer_id) ; household_id renseigné pour la formule Famille
--    (holder_kind = 'household', colonne générée) ; soldes mensuel et acheté mis en cache sous verrou de ligne.
-- 4. credit_ledger : grand livre APPEND-ONLY (octroi mensuel, achat, réserve, débit, restitution, expiration,
--    remboursement, ajustement) ; clé d'idempotence unique ; référence de transaction RevenueCat.
--    Invariant : monthly_balance = Σ monthly_delta, purchased_balance = Σ purchased_delta.
-- 5. credit_reservations : réserve → débit (résultat livré) ou restitution (échec, coupure) ; une réserve orpheline
--    expire d'elle-même (reservation.ttl_seconds) et ses crédits reviennent.
-- 6. RPC serveur (service_role uniquement : jamais appelables par l'application) : credits_reserve, credits_commit,
--    credits_release, credits_grant_monthly, credits_purchase, credits_refund_purchase, credits_maintenance.
--    RPC lecture (personne connectée) : credits_status, credits_history, credits_config. Vue credit_balances.
-- 7. RLS : lecture de son compte et de son historique, et du compte partagé dont on dépend (second adulte Premium,
--    adultes du foyer Famille) ; un ancien membre perd l'accès à la seconde. AUCUNE écriture par un client.
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

-- 1. Formule (tier) -----------------------------------------------------------------------------
alter table public.subscriptions add column if not exists tier text
  generated always as (case when lower(coalesce(product_id, '')) like 'homi\_family%' then 'family' else 'premium' end) stored;
comment on column public.subscriptions.tier is
  'Formule déduite de l''identifiant de produit (homi_family_* → family ; sinon premium). Colonne générée : jamais écrite.';

create or replace function public._premium_of(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and (
        s.user_id = p_user
        -- Premium : UN seul autre adulte (règle de 20261105000100, inchangée)
        or (
          s.user_id in (
            select other.user_id from public.household_members me
            join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
            where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
          )
          and public._premium_partner_of(s.user_id) = p_user
        )
        -- Famille (26/11/2026) : tous les adultes (owner / coparent) d'un foyer de la personne abonnée
        or (
          s.tier = 'family'
          and s.user_id in (
            select other.user_id from public.household_members me
            join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
            where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
          )
        )
      )
  );
$$;

-- 2. Réglages -----------------------------------------------------------------------------------
create table if not exists public.credit_settings (
  key text primary key check (key ~ '^[a-z0-9_.]{2,64}$'),
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
alter table public.credit_settings enable row level security;
drop policy if exists credit_settings_read on public.credit_settings;
create policy credit_settings_read on public.credit_settings for select to authenticated using (true);
revoke insert, update, delete, truncate on public.credit_settings from anon, authenticated;
revoke select on public.credit_settings from anon;

insert into public.credit_settings (key, value, description) values
  ('ai.enabled', 'true', 'Interrupteur serveur de l''IA (assistant et analyses) : false coupe l''IA sans nouvelle version de l''application.'),
  ('cost.assistant_question', '1', 'Question à l''assistant HOMI IA.'),
  ('cost.tool_analysis', '3', 'Analyse d''un outil (« Analyser avec HOMI IA »).'),
  ('cost.journal_summary', '5', 'Synthèse de journaux choisis.'),
  ('cost.action_plan', '3', 'Plan d''action.'),
  ('cost.document_read', '5', 'Lecture d''un document.'),
  ('cost.scan_explain', '1', 'Explication d''un produit scanné.'),
  ('cost.cycle_photo', '3', 'Analyse d''une photo (cycle).'),
  ('cost.community_summary', '1', 'Résumé ou traduction d''une discussion.'),
  ('grant.premium', '1000', 'Crédits mensuels de Premium (compte du payeur, partagé avec le second adulte).'),
  ('grant.family', '1500', 'Crédits mensuels de Famille (solde commun des adultes du foyer).'),
  ('grant.trial', '50', 'Crédits pendant l''essai gratuit (le total mensuel est accordé à la conversion).'),
  ('grant.dedupe_hours', '12', 'Un second octroi de même formule dans ce délai est ignoré (PRODUCT_CHANGE suivi d''un RENEWAL).'),
  ('packs', '{"homi_credits_300": 300, "homi_credits_800": 800, "homi_credits_2000": 2000}', 'Packs consommables : identifiant de produit → crédits.'),
  ('rule.consume_order', '"monthly_first"', 'monthly_first (défaut) ou purchased_first.'),
  ('rule.monthly_rollover', 'false', 'false : les crédits mensuels restants expirent au renouvellement.'),
  ('rule.purchase_requires_subscription', 'true', 'L''application ne propose les packs qu''avec un abonnement actif.'),
  ('reservation.ttl_seconds', '600', 'Une réserve non réglée au-delà de ce délai est restituée automatiquement.')
on conflict (key) do nothing;

create or replace function public._credit_setting(p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select value from public.credit_settings where key = p_key;
$$;
create or replace function public._credit_int(p_key text, p_default integer)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((select case when jsonb_typeof(value) = 'number' then (value #>> '{}')::integer end
                   from public.credit_settings where key = p_key), p_default);
$$;
create or replace function public._ai_enabled()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.credit_settings where key = 'ai.enabled'), true);
$$;

-- 3. Comptes ------------------------------------------------------------------------------------
create table if not exists public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null unique references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  holder_kind text generated always as (case when household_id is null then 'user' else 'household' end) stored,
  tier text not null default 'premium' check (tier in ('premium','family')),
  monthly_allowance integer not null default 0 check (monthly_allowance >= 0),
  monthly_balance integer not null default 0 check (monthly_balance >= 0),
  purchased_balance integer not null default 0 check (purchased_balance >= 0),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.credit_accounts enable row level security;
create index if not exists credit_accounts_household_idx on public.credit_accounts (household_id);
comment on table public.credit_accounts is
  'Crédits IA : un compte par payeur ; household_id = foyer (formule Famille, solde commun). Écrit uniquement par les RPC credits_*.';

-- 4. Grand livre (append-only) ------------------------------------------------------------------
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.credit_accounts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('monthly_grant','purchase','reserve','debit','release','expire','refund','adjust')),
  amount integer not null,
  monthly_delta integer not null default 0,
  purchased_delta integer not null default 0,
  action text check (action is null or action ~ '^[a-z0-9_]{2,40}$'),
  source text not null default 'system' check (source in ('revenuecat','assistant','system','demo','admin')),
  idempotency_key text not null unique check (char_length(idempotency_key) between 3 and 200),
  rc_transaction_id text check (rc_transaction_id is null or char_length(rc_transaction_id) <= 120),
  product_id text check (product_id is null or char_length(product_id) <= 120),
  reservation_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.credit_ledger enable row level security;
create index if not exists credit_ledger_account_idx on public.credit_ledger (account_id, created_at desc);
create index if not exists credit_ledger_actor_idx on public.credit_ledger (actor_id) where actor_id is not null;
create index if not exists credit_ledger_tx_idx on public.credit_ledger (rc_transaction_id) where rc_transaction_id is not null;

create or replace function public._credit_ledger_append_only() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    -- Seule exception : suppression du compte de l'auteur d'une ligne (actor_id → null), rien d'autre
    if (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') and new.actor_id is null then return new; end if;
    raise exception 'Grand livre des crédits : modification interdite (append-only)' using errcode = '42501';
  end if;
  -- DELETE : seulement par cascade, quand le compte lui-même a été supprimé (suppression du compte utilisateur)
  if exists (select 1 from public.credit_accounts a where a.id = old.account_id) then
    raise exception 'Grand livre des crédits : suppression interdite (append-only)' using errcode = '42501';
  end if;
  return old;
end $$;
drop trigger if exists credit_ledger_append_only on public.credit_ledger;
create trigger credit_ledger_append_only before update or delete on public.credit_ledger
  for each row execute function public._credit_ledger_append_only();
revoke execute on function public._credit_ledger_append_only() from public, anon, authenticated;

-- 5. Réserves -----------------------------------------------------------------------------------
create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.credit_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action ~ '^[a-z0-9_]{2,40}$'),
  cost integer not null check (cost > 0),
  from_monthly integer not null check (from_monthly >= 0),
  from_purchased integer not null check (from_purchased >= 0),
  status text not null default 'held' check (status in ('held','committed','released','expired')),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 120),
  period_start timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (user_id, idempotency_key),
  check (from_monthly + from_purchased = cost)
);
alter table public.credit_reservations enable row level security;
create index if not exists credit_reservations_held_idx on public.credit_reservations (account_id, expires_at) where status = 'held';
-- Aucune politique : les réserves ne sont lues et écrites que par les RPC serveur.

revoke insert, update, delete, truncate on public.credit_accounts, public.credit_ledger, public.credit_reservations from anon, authenticated;
revoke all on public.credit_accounts, public.credit_ledger, public.credit_reservations from anon;
revoke select on public.credit_reservations from authenticated;

-- 6. Qui paie pour qui ? ------------------------------------------------------------------------
-- Payeur dont la personne dépense les crédits : 1) son propre abonnement actif ; 2) un abonnement Famille d'un
-- adulte de son foyer ; 3) l'abonnement Premium d'un adulte qui le lui partage (_premium_partner_of).
-- Sans abonnement actif : aucune ligne (Premium strict : aucun crédit). Un ancien membre n'a plus de ligne.
create or replace function public._credit_payer_of(p_user uuid)
returns table (payer uuid, tier text) language sql stable security definer set search_path = public as $$
  select c.payer, c.tier from (
    select s.user_id as payer, s.tier, 1 as prio
    from public.subscriptions s
    where s.user_id = p_user and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
    union all
    select s.user_id, s.tier, case when s.tier = 'family' then 2 else 3 end
    from public.subscriptions s
    where s.user_id <> p_user and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and s.user_id in (
        select other.user_id from public.household_members me
        join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
        where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent'))
      and (s.tier = 'family' or public._premium_partner_of(s.user_id) = p_user)
  ) c
  where p_user is not null
  order by c.prio, c.payer
  limit 1;
$$;

-- Foyer « Famille » d'un payeur : celui où vivent d'autres adultes (owner / coparent) — de préférence celui qu'il a
-- créé —, sinon son foyer le plus ancien
create or replace function public._credit_family_household(p_payer uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.household_id from public.household_members m
  where m.user_id = p_payer and m.role in ('owner','coparent')
  order by exists (select 1 from public.household_members o where o.household_id = m.household_id and o.user_id <> p_payer
                   and o.role in ('owner','coparent')) desc,
           (m.role = 'owner') desc, m.joined_at, m.household_id
  limit 1;
$$;

create or replace function public._credit_account_id(p_user uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select a.id from public.credit_accounts a join public._credit_payer_of(p_user) p on a.payer_id = p.payer;
$$;
-- Pour la RLS : compte dont dépend la personne CONNECTÉE (jamais d'oracle sur autrui)
create or replace function public._my_credit_account()
returns uuid language sql stable security definer set search_path = public as $$
  select public._credit_account_id(auth.uid()) where auth.uid() is not null;
$$;

-- Compte du payeur (créé au besoin) ; formule et foyer alignés sur son abonnement actuel s'il est actif
create or replace function public._credit_ensure_account(p_payer uuid, p_tier text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_tier text; v_id uuid;
begin
  v_tier := coalesce(p_tier, (select s.tier from public.subscriptions s where s.user_id = p_payer
                               and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)));
  insert into public.credit_accounts (payer_id, tier, household_id)
  values (p_payer, coalesce(v_tier, 'premium'), case when v_tier = 'family' then public._credit_family_household(p_payer) end)
  on conflict (payer_id) do update
    set tier = coalesce(v_tier, credit_accounts.tier),
        household_id = case when coalesce(v_tier, credit_accounts.tier) = 'family' then public._credit_family_household(p_payer) else null end,
        updated_at = now()
    where credit_accounts.tier is distinct from coalesce(v_tier, credit_accounts.tier)
       or credit_accounts.household_id is distinct from
          (case when coalesce(v_tier, credit_accounts.tier) = 'family' then public._credit_family_household(p_payer) end)
  returning id into v_id;
  if v_id is null then select id into v_id from public.credit_accounts where payer_id = p_payer; end if;
  return v_id;
end $$;

-- Restitution d'une réserve (compte VERROUILLÉ par l'appelant). Les crédits mensuels d'une période close ne
-- reviennent pas (ils auraient expiré) : seule la part achetée est rendue, le reste est journalisé.
create or replace function public._credit_settle_release(p_res public.credit_reservations, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.credit_accounts; v_m integer; v_p integer;
begin
  select * into a from public.credit_accounts where id = p_res.account_id;
  v_m := case when p_res.period_start is not distinct from a.period_start then p_res.from_monthly else 0 end;
  v_p := p_res.from_purchased;
  update public.credit_reservations set status = p_status, settled_at = now() where id = p_res.id;
  update public.credit_accounts set monthly_balance = monthly_balance + v_m, purchased_balance = purchased_balance + v_p, updated_at = now()
    where id = a.id;
  insert into public.credit_ledger (account_id, actor_id, kind, amount, monthly_delta, purchased_delta, action, source, idempotency_key, reservation_id, meta)
  values (a.id, p_res.user_id, 'release', v_m + v_p, v_m, v_p, p_res.action, 'system', 'release:' || p_res.id, p_res.id,
          jsonb_build_object('reason', p_reason, 'monthly_lapsed', p_res.from_monthly - v_m));
end $$;

-- Réserves orphelines (fonction coupée, appareil éteint…) : restituées après reservation.ttl_seconds
create or replace function public._credit_expire_orphans(p_account uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare r public.credit_reservations; n integer := 0;
begin
  for r in select * from public.credit_reservations
           where account_id = p_account and status = 'held' and expires_at < now() order by created_at for update loop
    perform public._credit_settle_release(r, 'expired', 'orphan_timeout');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Octroi d'une période (compte VERROUILLÉ par l'appelant) : expiration du reste (sans report), nouveau mensuel
create or replace function public._credit_open_period(p_account uuid, p_allowance integer, p_start timestamptz, p_end timestamptz,
  p_key text, p_source text, p_meta jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare a public.credit_accounts; v_roll boolean := coalesce(public._credit_setting('rule.monthly_rollover') = 'true'::jsonb, false);
begin
  select * into a from public.credit_accounts where id = p_account;
  if a.monthly_balance > 0 and not v_roll then
    insert into public.credit_ledger (account_id, kind, amount, monthly_delta, source, idempotency_key, meta)
    values (a.id, 'expire', -a.monthly_balance, -a.monthly_balance, 'system', 'expire:' || p_key, jsonb_build_object('period_end', a.period_end));
  end if;
  insert into public.credit_ledger (account_id, kind, amount, monthly_delta, source, idempotency_key, meta)
  values (a.id, 'monthly_grant', p_allowance, p_allowance, p_source, p_key, coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('period_end', p_end));
  update public.credit_accounts
    set monthly_balance = case when v_roll then monthly_balance else 0 end + p_allowance,
        monthly_allowance = p_allowance, period_start = p_start, period_end = p_end, updated_at = now()
    where id = a.id;
end $$;

-- Mois suivant d'une formule de 6 ou 12 mois (le renouvellement n'arrive qu'à l'échéance) : décidé par le serveur,
-- d'après l'abonnement enregistré par le webhook (compte VERROUILLÉ par l'appelant).
create or replace function public._credit_roll(p_account uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare a public.credit_accounts; s public.subscriptions; v_start timestamptz; v_end timestamptz; n integer := 0;
begin
  select * into a from public.credit_accounts where id = p_account;
  if a.period_end is null or a.period_end > now() then return 0; end if;
  select * into s from public.subscriptions where user_id = a.payer_id;
  if s.user_id is null or s.status not in ('active','cancelled') or s.expires_at is null
     or s.expires_at <= a.period_end + interval '1 day' or not public._subscription_grants(s.status, s.expires_at, s.store, s.period_type) then
    return 0;
  end if;
  v_start := a.period_end;
  loop
    v_end := least(v_start + interval '1 month', s.expires_at);
    exit when v_end > now() or n > 36;
    v_start := v_end; n := n + 1;
  end loop;
  perform public._credit_open_period(a.id, public._credit_int('grant.' || s.tier, case when s.tier = 'family' then 1500 else 1000 end),
    v_start, v_end, 'roll:' || a.id || ':' || extract(epoch from v_start)::bigint, 'system', jsonb_build_object('tier', s.tier, 'rolled', true));
  return 1;
end $$;

-- 7. RPC serveur --------------------------------------------------------------------------------
-- Réserve atomique (verrou de la ligne du compte : deux réserves simultanées sont traitées l'une après l'autre).
create or replace function public.credits_reserve(p_user uuid, p_action text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_payer uuid; v_tier text; v_acc uuid; a public.credit_accounts; r public.credit_reservations; v_cost integer;
  v_m integer; v_p integer; v_purch_first boolean;
begin
  if p_user is null or p_action is null or p_action !~ '^[a-z0-9_]{2,40}$' then return jsonb_build_object('ok', false, 'error', 'bad_request'); end if;
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9:_.-]{8,120}$' then return jsonb_build_object('ok', false, 'error', 'bad_idempotency_key'); end if;
  if not public._ai_enabled() then return jsonb_build_object('ok', false, 'error', 'ai_disabled'); end if;
  v_cost := public._credit_int('cost.' || p_action, null);
  if v_cost is null or v_cost <= 0 then return jsonb_build_object('ok', false, 'error', 'unknown_action'); end if;
  select p.payer, p.tier into v_payer, v_tier from public._credit_payer_of(p_user) p;
  if v_payer is null then return jsonb_build_object('ok', false, 'error', 'premium_required'); end if;
  v_acc := public._credit_ensure_account(v_payer, v_tier);
  select * into a from public.credit_accounts where id = v_acc for update;
  -- Même clé une seconde fois : la même réserve, jamais un second débit
  select * into r from public.credit_reservations where user_id = p_user and idempotency_key = p_idempotency_key;
  if r.id is not null then
    return jsonb_build_object('ok', true, 'replay', true, 'reservation_id', r.id, 'status', r.status, 'cost', r.cost,
      'monthly_remaining', a.monthly_balance, 'purchased_remaining', a.purchased_balance, 'next_renewal', a.period_end);
  end if;
  perform public._credit_expire_orphans(v_acc);
  perform public._credit_roll(v_acc);
  select * into a from public.credit_accounts where id = v_acc;
  v_purch_first := public._credit_setting('rule.consume_order') = '"purchased_first"'::jsonb;
  if v_purch_first then
    v_p := least(v_cost, a.purchased_balance); v_m := v_cost - v_p;
  else
    v_m := least(v_cost, a.monthly_balance); v_p := v_cost - v_m;
  end if;
  if v_m > a.monthly_balance or v_p > a.purchased_balance then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'cost', v_cost,
      'monthly_remaining', a.monthly_balance, 'purchased_remaining', a.purchased_balance, 'next_renewal', a.period_end, 'tier', a.tier);
  end if;
  insert into public.credit_reservations (account_id, user_id, action, cost, from_monthly, from_purchased, idempotency_key, period_start, expires_at)
  values (v_acc, p_user, p_action, v_cost, v_m, v_p, p_idempotency_key, a.period_start,
          now() + make_interval(secs => public._credit_int('reservation.ttl_seconds', 600)))
  returning * into r;
  update public.credit_accounts set monthly_balance = monthly_balance - v_m, purchased_balance = purchased_balance - v_p, updated_at = now()
    where id = v_acc;
  insert into public.credit_ledger (account_id, actor_id, kind, amount, monthly_delta, purchased_delta, action, source, idempotency_key, reservation_id)
  values (v_acc, p_user, 'reserve', -v_cost, -v_m, -v_p, p_action, 'assistant', 'reserve:' || r.id, r.id);
  return jsonb_build_object('ok', true, 'replay', false, 'reservation_id', r.id, 'status', 'held', 'cost', v_cost,
    'monthly_remaining', a.monthly_balance - v_m, 'purchased_remaining', a.purchased_balance - v_p, 'next_renewal', a.period_end);
end $$;

-- Débit définitif : seulement quand le résultat a été LIVRÉ (fin de diffusion réussie)
create or replace function public.credits_commit(p_user uuid, p_reservation uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.credit_reservations;
begin
  select * into r from public.credit_reservations where id = p_reservation and user_id = p_user for update;
  if r.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if r.status = 'committed' then return jsonb_build_object('ok', true, 'replay', true); end if;
  if r.status <> 'held' then return jsonb_build_object('ok', false, 'error', 'reservation_closed', 'status', r.status); end if;
  update public.credit_reservations set status = 'committed', settled_at = now() where id = r.id;
  insert into public.credit_ledger (account_id, actor_id, kind, amount, action, source, idempotency_key, reservation_id, meta)
  values (r.account_id, r.user_id, 'debit', -r.cost, r.action, 'assistant', 'debit:' || r.id, r.id,
          jsonb_build_object('from_monthly', r.from_monthly, 'from_purchased', r.from_purchased));
  return jsonb_build_object('ok', true, 'replay', false, 'cost', r.cost);
end $$;

-- Restitution : échec de l'IA, coupure pendant la diffusion, réponse bloquée
create or replace function public.credits_release(p_user uuid, p_reservation uuid, p_reason text default 'failed')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.credit_reservations; v_acc uuid;
begin
  select account_id into v_acc from public.credit_reservations where id = p_reservation and user_id = p_user;
  if v_acc is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  perform 1 from public.credit_accounts where id = v_acc for update;
  select * into r from public.credit_reservations where id = p_reservation for update;
  if r.status in ('released','expired') then return jsonb_build_object('ok', true, 'replay', true); end if;
  if r.status <> 'held' then return jsonb_build_object('ok', false, 'error', 'reservation_closed', 'status', r.status); end if;
  perform public._credit_settle_release(r, 'released', left(coalesce(nullif(p_reason, ''), 'failed'), 40));
  return jsonb_build_object('ok', true, 'replay', false);
end $$;

-- Octroi mensuel, déclenché par les événements d'abonnement (webhook RevenueCat) — jamais par l'application
create or replace function public.credits_grant_monthly(p_payer uuid, p_tier text, p_period_end timestamptz, p_trial boolean,
  p_idempotency_key text, p_source text default 'revenuecat')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_acc uuid; a public.credit_accounts; v_allow integer; v_end timestamptz;
begin
  if p_payer is null or p_tier not in ('premium','family') or p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'error', 'bad_request');
  end if;
  v_acc := public._credit_ensure_account(p_payer, p_tier);
  select * into a from public.credit_accounts where id = v_acc for update;
  if exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    return jsonb_build_object('ok', true, 'replay', true, 'monthly_remaining', a.monthly_balance);
  end if;
  v_allow := case when p_trial then public._credit_int('grant.trial', 50)
                  else public._credit_int('grant.' || p_tier, case when p_tier = 'family' then 1500 else 1000 end) end;
  -- PRODUCT_CHANGE suivi d'un RENEWAL pour la même montée de formule : un seul octroi
  if not p_trial and a.period_start is not null and a.period_start > now() - make_interval(hours => public._credit_int('grant.dedupe_hours', 12))
     and a.monthly_allowance = v_allow and a.tier = p_tier then
    return jsonb_build_object('ok', true, 'skipped', 'recent_grant', 'monthly_remaining', a.monthly_balance);
  end if;
  v_end := least(now() + interval '1 month', coalesce(p_period_end, now() + interval '1 month'));
  if v_end <= now() then v_end := now() + interval '1 month'; end if;
  perform public._credit_open_period(v_acc, v_allow, now(), v_end, p_idempotency_key,
    case when p_source in ('revenuecat','system','demo','admin') then p_source else 'revenuecat' end,
    jsonb_build_object('tier', p_tier, 'trial', coalesce(p_trial, false)));
  select * into a from public.credit_accounts where id = v_acc;
  return jsonb_build_object('ok', true, 'replay', false, 'monthly_remaining', a.monthly_balance, 'next_renewal', a.period_end);
end $$;

-- Achat d'un pack consommable (idempotent sur l'identifiant de transaction de la boutique)
create or replace function public.credits_purchase(p_user uuid, p_product text, p_transaction_id text, p_source text default 'revenuecat')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_amount integer; v_payer uuid; v_tier text; v_acc uuid; a public.credit_accounts;
begin
  if p_user is null or p_transaction_id is null or char_length(p_transaction_id) not between 1 and 120 then
    return jsonb_build_object('ok', false, 'error', 'bad_request');
  end if;
  v_amount := (select (value ->> p_product)::integer from public.credit_settings where key = 'packs');
  if v_amount is null or v_amount <= 0 then return jsonb_build_object('ok', false, 'error', 'unknown_product'); end if;
  -- Crédits versés au compte dont la personne dépense (partagé) ; sans abonnement : à son propre compte
  -- (un achat payé est TOUJOURS crédité ; il sera utilisable avec un abonnement actif).
  select p.payer, p.tier into v_payer, v_tier from public._credit_payer_of(p_user) p;
  v_acc := public._credit_ensure_account(coalesce(v_payer, p_user), case when v_payer is not null then v_tier end);
  select * into a from public.credit_accounts where id = v_acc for update;
  if exists (select 1 from public.credit_ledger where idempotency_key = 'purchase:' || p_transaction_id) then
    return jsonb_build_object('ok', true, 'replay', true, 'purchased_remaining', a.purchased_balance);
  end if;
  insert into public.credit_ledger (account_id, actor_id, kind, amount, purchased_delta, source, idempotency_key, rc_transaction_id, product_id)
  values (v_acc, p_user, 'purchase', v_amount, v_amount,
          case when p_source in ('revenuecat','demo','admin') then p_source else 'revenuecat' end,
          'purchase:' || p_transaction_id, p_transaction_id, p_product);
  update public.credit_accounts set purchased_balance = purchased_balance + v_amount, updated_at = now() where id = v_acc;
  return jsonb_build_object('ok', true, 'replay', false, 'credited', v_amount, 'purchased_remaining', a.purchased_balance + v_amount);
end $$;

-- Remboursement d'un pack : retrait des crédits NON consommés (jamais de solde négatif ; part consommée journalisée)
create or replace function public.credits_refund_purchase(p_transaction_id text, p_source text default 'revenuecat')
returns jsonb language plpgsql security definer set search_path = public as $$
declare l public.credit_ledger; a public.credit_accounts; v_remove integer;
begin
  select * into l from public.credit_ledger where idempotency_key = 'purchase:' || p_transaction_id;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select * into a from public.credit_accounts where id = l.account_id for update;
  if exists (select 1 from public.credit_ledger where idempotency_key = 'refund:' || p_transaction_id) then
    return jsonb_build_object('ok', true, 'replay', true);
  end if;
  v_remove := least(l.amount, a.purchased_balance);
  insert into public.credit_ledger (account_id, actor_id, kind, amount, purchased_delta, source, idempotency_key, rc_transaction_id, product_id, meta)
  values (a.id, l.actor_id, 'refund', -v_remove, -v_remove,
          case when p_source in ('revenuecat','demo','admin') then p_source else 'revenuecat' end,
          'refund:' || p_transaction_id, p_transaction_id, l.product_id,
          jsonb_build_object('pack', l.amount, 'removed', v_remove, 'already_consumed', l.amount - v_remove));
  update public.credit_accounts set purchased_balance = purchased_balance - v_remove, updated_at = now() where id = a.id;
  return jsonb_build_object('ok', true, 'replay', false, 'removed', v_remove, 'already_consumed', l.amount - v_remove);
end $$;

-- Maintenance (facultative, à planifier si pg_cron est disponible) : réserves orphelines et mois suivants
create or replace function public.credits_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v uuid; n_exp integer := 0; n_roll integer := 0;
begin
  for v in select distinct account_id from public.credit_reservations where status = 'held' and expires_at < now() loop
    perform 1 from public.credit_accounts where id = v for update;
    n_exp := n_exp + public._credit_expire_orphans(v);
  end loop;
  for v in select id from public.credit_accounts where period_end is not null and period_end <= now() loop
    perform 1 from public.credit_accounts where id = v for update;
    n_roll := n_roll + public._credit_roll(v);
  end loop;
  return jsonb_build_object('expired_reservations', n_exp, 'rolled_accounts', n_roll);
end $$;

-- 8. Lecture par la personne connectée ----------------------------------------------------------
create or replace function public.credits_config()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ai_enabled', public._ai_enabled(),
    'costs', coalesce((select jsonb_object_agg(substr(key, 6), value) from public.credit_settings where key like 'cost.%'), '{}'::jsonb),
    'packs', coalesce(public._credit_setting('packs'), '{}'::jsonb),
    'grants', jsonb_build_object('premium', public._credit_int('grant.premium', 1000), 'family', public._credit_int('grant.family', 1500)),
    'purchase_requires_subscription', coalesce(public._credit_setting('rule.purchase_requires_subscription') = 'true'::jsonb, true))
  where auth.uid() is not null;
$$;

create or replace function public.credits_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); v_payer uuid; v_tier text; v_acc uuid; a public.credit_accounts; v_used integer; v_held integer;
begin
  if me is null then return null; end if;
  select p.payer, p.tier into v_payer, v_tier from public._credit_payer_of(me) p;
  if v_payer is not null then
    select id into v_acc from public.credit_accounts where payer_id = v_payer;
    if v_acc is not null then
      perform 1 from public.credit_accounts where id = v_acc for update;
      perform public._credit_expire_orphans(v_acc);
      perform public._credit_roll(v_acc);
    end if;
  else
    select id into v_acc from public.credit_accounts where payer_id = me;
  end if;
  select * into a from public.credit_accounts where id = v_acc;
  select coalesce(sum(-amount), 0) into v_used from public.credit_ledger
    where account_id = a.id and kind = 'debit' and a.period_start is not null and created_at >= a.period_start;
  select coalesce(sum(cost), 0) into v_held from public.credit_reservations where account_id = a.id and status = 'held';
  return jsonb_build_object(
    'subscribed', v_payer is not null,
    'tier', coalesce(v_tier, a.tier),
    'holder_kind', coalesce(a.holder_kind, case when v_tier = 'family' then 'household' else 'user' end),
    'payer_is_me', v_payer = me,
    'monthly_allowance', coalesce(a.monthly_allowance, 0),
    'monthly_remaining', coalesce(a.monthly_balance, 0),
    'purchased_remaining', coalesce(a.purchased_balance, 0),
    'reserved', v_held,
    'used_this_period', v_used,
    'period_start', a.period_start,
    'next_renewal', a.period_end,
    'ai_enabled', public._ai_enabled());
end $$;

-- Historique paginé (du plus récent au plus ancien) : libellés lisibles côté application, JAMAIS le contenu d'une question
create or replace function public.credits_history(p_before timestamptz default null, p_limit integer default 20)
returns table (id uuid, kind text, amount integer, action text, product_id text, by_me boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.kind, l.amount, l.action, l.product_id, l.actor_id = auth.uid(), l.created_at
  from public.credit_ledger l
  where l.account_id = coalesce(public._credit_account_id(auth.uid()), (select a.id from public.credit_accounts a where a.payer_id = auth.uid()))
    and l.kind in ('monthly_grant','purchase','debit','expire','refund','adjust')
    and (p_before is null or l.created_at < p_before)
    and auth.uid() is not null
  order by l.created_at desc, l.id
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

-- Vue du solde (invocateur : la RLS des comptes s'applique)
create or replace view public.credit_balances with (security_invoker = true) as
  select a.id as account_id, a.payer_id, a.household_id, a.holder_kind, a.tier, a.monthly_allowance,
         a.monthly_balance as monthly_remaining, a.purchased_balance as purchased_remaining,
         coalesce((select sum(-l.amount) from public.credit_ledger l
                   where l.account_id = a.id and l.kind = 'debit' and a.period_start is not null and l.created_at >= a.period_start), 0)::integer as used_this_period,
         a.period_end as next_renewal
  from public.credit_accounts a;
revoke all on public.credit_balances from anon;
grant select on public.credit_balances to authenticated;

-- 9. RLS ----------------------------------------------------------------------------------------
drop policy if exists credit_accounts_read on public.credit_accounts;
create policy credit_accounts_read on public.credit_accounts for select to authenticated
  using (payer_id = auth.uid() or id = public._my_credit_account());
drop policy if exists credit_ledger_read on public.credit_ledger;
create policy credit_ledger_read on public.credit_ledger for select to authenticated
  using (exists (select 1 from public.credit_accounts a where a.id = credit_ledger.account_id));
grant select on public.credit_accounts, public.credit_ledger to authenticated;

-- 10. Accès de l'application : formule visible dans my_access ---------------------------------
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'premium', public._premium_of(auth.uid()),
    'ai', public._ai_plan_of(auth.uid()),
    'trial_until', null,
    'strict', public.premium_strict(),
    -- Nounou dans au moins un foyer : saisies de garde jamais bloquées par l'abonnement
    'caregiver', exists (select 1 from public.household_members m where m.user_id = auth.uid() and m.role = 'caregiver'),
    -- Formule qui ouvre Premium à la personne (26/11/2026) : premium | family | null
    'tier', (select p.tier from public._credit_payer_of(auth.uid()) p),
    'tools', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'product_id', t.product_id,
        'owned', public._grant_active(auth.uid(), t.entitlement), 'allowed', public._has_tool_of(t.key, auth.uid())) order by t.position)
      from public.paid_tools t), '[]'::jsonb))
  where auth.uid() is not null;
$$;

-- 11. Droits d'exécution ------------------------------------------------------------------------
revoke execute on function public._credit_setting(text), public._credit_int(text, integer), public._ai_enabled(),
  public._credit_payer_of(uuid), public._credit_family_household(uuid), public._credit_account_id(uuid),
  public._credit_ensure_account(uuid, text), public._credit_settle_release(public.credit_reservations, text, text),
  public._credit_expire_orphans(uuid), public._credit_open_period(uuid, integer, timestamptz, timestamptz, text, text, jsonb),
  public._credit_roll(uuid),
  public.credits_reserve(uuid, text, text), public.credits_commit(uuid, uuid), public.credits_release(uuid, uuid, text),
  public.credits_grant_monthly(uuid, text, timestamptz, boolean, text, text), public.credits_purchase(uuid, text, text, text),
  public.credits_refund_purchase(text, text), public.credits_maintenance(),
  public.credits_config(), public.credits_status(), public.credits_history(timestamptz, integer)
  from public, anon, authenticated;
-- La politique de lecture des comptes appelle _my_credit_account() (personne connectée seulement)
revoke execute on function public._my_credit_account() from public, anon;
grant execute on function public._my_credit_account() to authenticated;
grant execute on function public.credits_config(), public.credits_status(), public.credits_history(timestamptz, integer) to authenticated;
grant execute on function public.credits_reserve(uuid, text, text), public.credits_commit(uuid, uuid), public.credits_release(uuid, uuid, text),
  public.credits_grant_monthly(uuid, text, timestamptz, boolean, text, text), public.credits_purchase(uuid, text, text, text),
  public.credits_refund_purchase(text, text), public.credits_maintenance(), public._ai_enabled() to service_role;

-- 12. Export RGPD : rubrique « credits » (compte dont je suis payeur, mes mouvements, mes réserves) ------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_pre_credits' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_pre_credits;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_pre_credits() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_raw_pre_credits() || jsonb_build_object('credits', jsonb_build_object(
    'accounts', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at), '[]') from public.credit_accounts a where a.payer_id = v_uid),
    'ledger', (select coalesce(jsonb_agg(jsonb_build_object('kind', l.kind, 'amount', l.amount, 'action', l.action, 'product_id', l.product_id,
                 'rc_transaction_id', l.rc_transaction_id, 'created_at', l.created_at) order by l.created_at), '[]')
               from public.credit_ledger l
               where l.actor_id = v_uid or l.account_id in (select a.id from public.credit_accounts a where a.payer_id = v_uid)),
    'reservations', (select coalesce(jsonb_agg(jsonb_build_object('action', r.action, 'cost', r.cost, 'status', r.status,
                 'created_at', r.created_at, 'settled_at', r.settled_at) order by r.created_at), '[]')
               from public.credit_reservations r where r.user_id = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- =====================================================================
-- Retour arrière (à exécuter à la main si nécessaire) :
--   drop view if exists public.credit_balances;
--   drop function if exists public.credits_history(timestamptz, integer), public.credits_status(), public.credits_config(),
--     public.credits_maintenance(), public.credits_refund_purchase(text, text), public.credits_purchase(uuid, text, text, text),
--     public.credits_grant_monthly(uuid, text, timestamptz, boolean, text, text), public.credits_release(uuid, uuid, text),
--     public.credits_commit(uuid, uuid), public.credits_reserve(uuid, text, text), public._credit_roll(uuid),
--     public._credit_open_period(uuid, integer, timestamptz, timestamptz, text, text, jsonb), public._credit_expire_orphans(uuid),
--     public._credit_settle_release(public.credit_reservations, text, text), public._credit_ensure_account(uuid, text),
--     public._my_credit_account(), public._credit_account_id(uuid), public._credit_family_household(uuid), public._credit_payer_of(uuid),
--     public._ai_enabled(), public._credit_int(text, integer), public._credit_setting(text);
--   drop table if exists public.credit_reservations, public.credit_ledger, public.credit_accounts, public.credit_settings;
--   -- _premium_of et my_access : réappliquer 20261105000100_subscription_v2.sql (§ 4) et 20261113000100_caregiver_premium.sql
--   alter table public.subscriptions drop column if exists tier;
--   -- Export : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_pre_credits() rename to _export_my_data_raw;
--   --   grant execute on function public._export_my_data_raw() to authenticated;
-- =====================================================================
