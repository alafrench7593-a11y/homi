-- =====================================================================
-- Programme Ambassadeurs HOMI (24/11/2026, demande de la propriétaire)
--
-- Source de vérité unique : `ambassador_terms` (conditions VERSIONNÉES). Une seule version « active » ; publier une
-- nouvelle version n'altère jamais les commissions déjà acquises (chaque commission garde son numéro de version, son
-- taux et ses montants). Aucun prix ni taux dans le code de l'interface : le site, l'app, Aura et le simulateur lisent
-- la version active (lecture publique, aucune donnée personnelle).
--
-- Règles (version 1, modifiables sans nouvelle version de l'app) :
--   inscription gratuite ; 30 % des revenus NETS éligibles (prix − TVA − commission du store) ; 6 premiers mois
--   PAYÉS de chaque abonné apporté ; rien sur un téléchargement ni sur un essai non converti ; une transaction
--   remboursée est annulée ; versement mensuel à partir de 50 € ; aucun plafond ; niveaux Starter 30 %, Silver 31 %,
--   Gold 33 %, Elite 35 % (les niveaux supérieurs restent DÉSACTIVÉS tant que la propriétaire ne les ouvre pas).
--
-- Écritures sensibles (commissions, annulations, versements) : uniquement par le serveur (webhook RevenueCat) ou un
-- compte admin. Un ambassadeur ne voit que SES commissions, jamais l'identité des abonnés qu'il a apportés.
-- Montants en centimes (entiers) : aucun arrondi flottant.
-- =====================================================================

create table if not exists public.ambassador_terms (
  version int primary key,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  effective_from timestamptz not null default now(),
  -- Commissions
  base_rate numeric(5,2) not null default 30 check (base_rate between 0 and 50),
  max_rate numeric(5,2) not null default 35 check (max_rate between 0 and 50),
  tiers jsonb not null,                       -- [{key,label,rate,min_conversions,enabled}]
  commission_months int not null default 6 check (commission_months between 1 and 36),
  hold_days int not null default 30 check (hold_days between 0 and 120),   -- délai avant « payable » (remboursements)
  payout_threshold_cents int not null default 5000 check (payout_threshold_cents >= 0),
  payout_frequency text not null default 'monthly' check (payout_frequency in ('monthly')),
  -- Périmètre
  eligible_products text[] not null,          -- identifiants store des abonnements rémunérés
  countries text[] not null default array['FR','BE','CH','LU','MC'],
  currencies text[] not null default array['EUR'],
  -- Simulateur et pages publiques : prix de RÉFÉRENCE (les prix réels de l'app viennent toujours du store)
  reference jsonb not null,                   -- {currency, vat_rate, store_fee_rate, plans:[{key,label,price,months}], family_supplement}
  bonuses jsonb not null default '[]',
  campaigns jsonb not null default '[]',
  -- Futures lignes de revenus (boutique, vêtements…) : préparées, désactivées
  product_lines jsonb not null default '[]',  -- [{key,label,kind:'digital'|'physical',rate,enabled}]
  conditions_md text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists ambassador_terms_one_active on public.ambassador_terms ((status)) where status = 'active';

create table if not exists public.ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  code text not null unique check (code ~ '^[A-Z0-9]{4,16}$'),
  display_name text not null check (char_length(display_name) between 2 and 80),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 254),
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended', 'rejected')),
  tier text not null default 'starter',
  rate_override numeric(5,2) check (rate_override is null or rate_override between 0 and 50),
  terms_version int not null references public.ambassador_terms(version),
  legal_status text not null check (legal_status in ('particulier', 'auto_entrepreneur', 'societe')),
  siret text check (siret is null or siret ~ '^[0-9]{14}$'),
  social_links jsonb not null default '[]',
  audience text check (audience is null or char_length(audience) <= 500),
  accepted_terms_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create unique index if not exists ambassadors_email_once on public.ambassadors (lower(email));

-- Qui a été apporté par qui (une seule attribution par compte ; jamais soi-même ; figée au premier paiement)
create table if not exists public.referral_attributions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  code text not null,
  source text not null default 'code' check (source in ('code', 'link')),
  attributed_at timestamptz not null default now(),
  locked_at timestamptz
);
create index if not exists referral_attributions_amb on public.referral_attributions (ambassador_id);

create table if not exists public.ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  reference text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (ambassador_id, period)
);

create table if not exists public.ambassador_commissions (
  id bigserial primary key,
  ambassador_id uuid not null references public.ambassadors(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  transaction_id text not null unique,                 -- un webhook rejoué n'écrit jamais deux fois
  product_id text not null,
  product_line text not null default 'subscription',
  period_index int not null check (period_index >= 1),  -- n-ième paiement rémunéré de cet abonné
  price_cents int not null check (price_cents >= 0),
  tax_cents int not null check (tax_cents >= 0),
  store_fee_cents int not null check (store_fee_cents >= 0),
  net_cents int not null check (net_cents >= 0),
  rate numeric(5,2) not null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null,
  terms_version int not null references public.ambassador_terms(version),
  status text not null default 'pending' check (status in ('pending', 'payable', 'paid', 'reversed')),
  occurred_at timestamptz not null,
  available_at timestamptz not null,
  payout_id uuid references public.ambassador_payouts(id) on delete set null,
  reversed_reason text,
  created_at timestamptz not null default now()
);
create index if not exists ambassador_commissions_amb on public.ambassador_commissions (ambassador_id, status);

-- ---------------------------------------------------------------- droits
alter table public.ambassador_terms enable row level security;
alter table public.ambassadors enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.ambassador_commissions enable row level security;
alter table public.ambassador_payouts enable row level security;

revoke all on public.ambassador_terms, public.ambassadors, public.referral_attributions, public.ambassador_commissions, public.ambassador_payouts from anon, authenticated;
-- Le public (site, simulateur, app) lit la vue ambassador_terms_public (version active).
-- (aucune colonne personnelle dans cette table : lecture publique de la seule version active)
grant select on public.ambassador_terms to anon, authenticated;
drop policy if exists ambassador_terms_read on public.ambassador_terms;
create policy ambassador_terms_read on public.ambassador_terms for select using (status = 'active' or public.has_role('admin'));
-- Ambassadeur : sa fiche, ses commissions, ses versements (lecture seule)
grant select on public.ambassadors, public.ambassador_commissions, public.ambassador_payouts, public.referral_attributions to authenticated;
drop policy if exists ambassadors_own on public.ambassadors;
create policy ambassadors_own on public.ambassadors for select using (user_id = auth.uid() or public.has_role('admin'));
drop policy if exists ambassador_commissions_own on public.ambassador_commissions;
create policy ambassador_commissions_own on public.ambassador_commissions for select
  using (public.has_role('admin') or ambassador_id in (select id from public.ambassadors where user_id = auth.uid()));
drop policy if exists ambassador_payouts_own on public.ambassador_payouts;
create policy ambassador_payouts_own on public.ambassador_payouts for select
  using (public.has_role('admin') or ambassador_id in (select id from public.ambassadors where user_id = auth.uid()));
-- Abonné : il voit qu'il a été recommandé (sans données de l'ambassadeur au-delà du code)
drop policy if exists referral_attributions_own on public.referral_attributions;
create policy referral_attributions_own on public.referral_attributions for select using (user_id = auth.uid() or public.has_role('admin'));

-- ---------------------------------------------------------------- calcul (identique à src/lib/ambassador/commission.ts)
-- net = prix − TVA − commission du store ; commission = arrondi(net × taux / 100). TVA incluse dans le prix TTC.
create or replace function public.ambassador_split(p_price_cents int, p_vat_rate numeric, p_store_fee_rate numeric, p_rate numeric)
returns table (tax_cents int, store_fee_cents int, net_cents int, amount_cents int)
language sql immutable set search_path = public as $$
  with ht as (select round(p_price_cents / (1 + coalesce(p_vat_rate, 0) / 100.0))::int as v),
       fee as (select round((select v from ht) * coalesce(p_store_fee_rate, 0) / 100.0)::int as v)
  select p_price_cents - (select v from ht), (select v from fee), (select v from ht) - (select v from fee),
         round(((select v from ht) - (select v from fee)) * p_rate / 100.0)::int
$$;

create or replace view public.ambassador_terms_public with (security_invoker = true) as
  select version, effective_from, base_rate, max_rate, tiers, commission_months, hold_days, payout_threshold_cents, payout_frequency,
         eligible_products, countries, currencies, reference, bonuses, campaigns, product_lines, conditions_md
  from public.ambassador_terms where status = 'active';
grant select on public.ambassador_terms_public to anon, authenticated;

create or replace function public.ambassador_active_terms() returns public.ambassador_terms
language sql stable security definer set search_path = public as $$
  select * from public.ambassador_terms where status = 'active' limit 1
$$;

-- Taux d'un ambassadeur : dérogation admin, sinon niveau (s'il est ouvert), sinon taux de base ; jamais au-delà du maximum
create or replace function public.ambassador_rate_of(p_ambassador uuid) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare a public.ambassadors; t public.ambassador_terms; r numeric;
begin
  select * into a from public.ambassadors where id = p_ambassador;
  t := public.ambassador_active_terms();
  if a.id is null or t.version is null then return null; end if;
  select (x->>'rate')::numeric into r from jsonb_array_elements(t.tiers) x where x->>'key' = a.tier and coalesce((x->>'enabled')::boolean, false);
  return least(coalesce(a.rate_override, r, t.base_rate), t.max_rate);
end $$;

-- ---------------------------------------------------------------- candidature (site ou app)
create or replace function public.ambassador_apply(p_name text, p_email text, p_code text, p_legal_status text,
  p_siret text default null, p_social jsonb default '[]', p_audience text default null, p_accept boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ambassador_terms; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  -- Candidature avec un compte HOMI (gratuit) : aucune fonction sensible n'est appelable sans compte (règle S9)
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  t := public.ambassador_active_terms();
  if t.version is null then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if not coalesce(p_accept, false) then return jsonb_build_object('ok', false, 'reason', 'terms'); end if;
  if c !~ '^[A-Z0-9]{4,16}$' then return jsonb_build_object('ok', false, 'reason', 'code_format'); end if;
  if exists (select 1 from public.ambassadors where code = c) then return jsonb_build_object('ok', false, 'reason', 'code_taken'); end if;
  if exists (select 1 from public.ambassadors where lower(email) = lower(trim(p_email))) then return jsonb_build_object('ok', false, 'reason', 'already'); end if;
  if exists (select 1 from public.ambassadors where user_id = auth.uid()) then return jsonb_build_object('ok', false, 'reason', 'already'); end if;
  insert into public.ambassadors (user_id, code, display_name, email, legal_status, siret, social_links, audience, terms_version)
  values (auth.uid(), c, trim(p_name), lower(trim(p_email)), p_legal_status, nullif(trim(coalesce(p_siret, '')), ''),
          coalesce(p_social, '[]'), nullif(trim(coalesce(p_audience, '')), ''), t.version);
  return jsonb_build_object('ok', true, 'status', 'pending', 'code', c);
exception when check_violation then return jsonb_build_object('ok', false, 'reason', 'invalid');
end $$;
revoke execute on function public.ambassador_apply(text, text, text, text, text, jsonb, text, boolean) from public, anon;
grant execute on function public.ambassador_apply(text, text, text, text, text, jsonb, text, boolean) to authenticated;

-- ---------------------------------------------------------------- code saisi par un nouveau parent (lien ou saisie)
create or replace function public.ambassador_claim(p_code text, p_source text default 'code')
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.ambassadors; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into a from public.ambassadors where code = c and status = 'approved';
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
  if a.user_id = auth.uid() then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  if exists (select 1 from public.referral_attributions where user_id = auth.uid()) then return jsonb_build_object('ok', false, 'reason', 'already'); end if;
  -- Déjà abonné avant le code : pas d'attribution rétroactive
  if exists (select 1 from public.conversion_events where user_id = auth.uid()) then return jsonb_build_object('ok', false, 'reason', 'already_paying'); end if;
  insert into public.referral_attributions (user_id, ambassador_id, code, source) values (auth.uid(), a.id, c, case when p_source = 'link' then 'link' else 'code' end);
  return jsonb_build_object('ok', true, 'name', a.display_name);
end $$;
grant execute on function public.ambassador_claim(text, text) to authenticated;

-- ---------------------------------------------------------------- serveur : paiement réel → commission
-- Appelé par le webhook RevenueCat pour chaque paiement réellement encaissé (premier paiement après l'essai,
-- renouvellement). Les essais, téléchargements et paiements à 0 ne passent jamais ici avec un montant > 0.
create or replace function public._ambassador_accrue(p_user uuid, p_transaction text, p_product text, p_price_cents int,
  p_currency text, p_vat_rate numeric, p_store_fee_rate numeric, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare att public.referral_attributions; a public.ambassadors; t public.ambassador_terms; n int; r numeric; s record;
begin
  t := public.ambassador_active_terms();
  if t.version is null then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  select * into att from public.referral_attributions where user_id = p_user;
  if att.user_id is null then return jsonb_build_object('ok', false, 'reason', 'no_referral'); end if;
  select * into a from public.ambassadors where id = att.ambassador_id;
  if a.status <> 'approved' then return jsonb_build_object('ok', false, 'reason', 'not_approved'); end if;
  if coalesce(p_price_cents, 0) <= 0 then return jsonb_build_object('ok', false, 'reason', 'free'); end if;
  if not (p_product = any (t.eligible_products)) then return jsonb_build_object('ok', false, 'reason', 'product'); end if;
  if not (upper(p_currency) = any (t.currencies)) then return jsonb_build_object('ok', false, 'reason', 'currency'); end if;
  if exists (select 1 from public.ambassador_commissions where transaction_id = p_transaction) then return jsonb_build_object('ok', true, 'duplicate', true); end if;
  select count(*) into n from public.ambassador_commissions where referred_user_id = p_user and ambassador_id = a.id and status <> 'reversed';
  if n >= t.commission_months then return jsonb_build_object('ok', false, 'reason', 'window_over'); end if;
  r := public.ambassador_rate_of(a.id);
  select * into s from public.ambassador_split(p_price_cents, p_vat_rate, p_store_fee_rate, r);
  insert into public.ambassador_commissions (ambassador_id, referred_user_id, transaction_id, product_id, period_index,
    price_cents, tax_cents, store_fee_cents, net_cents, rate, amount_cents, currency, terms_version, occurred_at, available_at)
  values (a.id, p_user, p_transaction, p_product, n + 1, p_price_cents, s.tax_cents, s.store_fee_cents, s.net_cents, r,
    s.amount_cents, upper(p_currency), t.version, p_at, p_at + make_interval(days => t.hold_days));
  update public.referral_attributions set locked_at = coalesce(locked_at, p_at) where user_id = p_user;
  return jsonb_build_object('ok', true, 'amount_cents', s.amount_cents, 'period_index', n + 1);
end $$;

-- Remboursement : la commission est annulée (même déjà payable ; déjà versée → déduite du prochain versement par l'admin)
create or replace function public._ambassador_reverse(p_transaction text, p_reason text default 'refund')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.ambassador_commissions set status = 'reversed', reversed_reason = p_reason
  where transaction_id = p_transaction and status in ('pending', 'payable', 'paid');
  return found;
end $$;

-- Tâche quotidienne : fin du délai de remboursement → payable
create or replace function public.ambassador_release_due() returns int
language sql security definer set search_path = public as $$
  with u as (update public.ambassador_commissions set status = 'payable' where status = 'pending' and available_at <= now() returning 1)
  select count(*)::int from u
$$;

revoke execute on function public._ambassador_accrue(uuid, text, text, int, text, numeric, numeric, timestamptz) from public, anon, authenticated;
revoke execute on function public._ambassador_reverse(text, text) from public, anon, authenticated;
revoke execute on function public.ambassador_release_due() from public, anon, authenticated;

-- ---------------------------------------------------------------- tableau de bord de l'ambassadeur (lecture)
create or replace function public.my_ambassador() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.ambassadors; t public.ambassador_terms;
begin
  select * into a from public.ambassadors where user_id = auth.uid();
  if a.id is null then return null; end if;
  t := public.ambassador_active_terms();
  return jsonb_build_object(
    'status', a.status, 'code', a.code, 'tier', a.tier, 'rate', public.ambassador_rate_of(a.id),
    'commission_months', t.commission_months, 'payout_threshold_cents', t.payout_threshold_cents, 'hold_days', t.hold_days,
    'referred', (select count(*) from public.referral_attributions where ambassador_id = a.id),
    'converted', (select count(distinct referred_user_id) from public.ambassador_commissions where ambassador_id = a.id and status <> 'reversed'),
    'pending_cents', (select coalesce(sum(amount_cents), 0) from public.ambassador_commissions where ambassador_id = a.id and status = 'pending'),
    'payable_cents', (select coalesce(sum(amount_cents), 0) from public.ambassador_commissions where ambassador_id = a.id and status = 'payable'),
    'paid_cents', (select coalesce(sum(amount_cents), 0) from public.ambassador_commissions where ambassador_id = a.id and status = 'paid'),
    'reversed_cents', (select coalesce(sum(amount_cents), 0) from public.ambassador_commissions where ambassador_id = a.id and status = 'reversed'),
    'month_cents', (select coalesce(sum(amount_cents), 0) from public.ambassador_commissions where ambassador_id = a.id and status <> 'reversed'
                     and date_trunc('month', occurred_at) = date_trunc('month', now())),
    'next_available_at', (select min(available_at) from public.ambassador_commissions where ambassador_id = a.id and status = 'pending'),
    'currency', coalesce((t.reference->>'currency'), 'EUR'));
end $$;
grant execute on function public.my_ambassador() to authenticated;

-- ---------------------------------------------------------------- administration
create or replace function public.admin_ambassador_set(p_ambassador uuid, p_status text, p_tier text default null, p_rate_override numeric default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  update public.ambassadors set status = coalesce(p_status, status), tier = coalesce(p_tier, tier), rate_override = p_rate_override,
    approved_at = case when p_status = 'approved' and approved_at is null then now() else approved_at end
  where id = p_ambassador;
end $$;
grant execute on function public.admin_ambassador_set(uuid, text, text, numeric) to authenticated;

-- Publier de nouvelles conditions : nouvelle version active, l'ancienne archivée (commissions acquises inchangées)
create or replace function public.admin_publish_ambassador_terms(p_terms jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare v int; cur public.ambassador_terms;
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  cur := public.ambassador_active_terms();
  select coalesce(max(version), 0) + 1 into v from public.ambassador_terms;
  if coalesce((p_terms->>'base_rate')::numeric, cur.base_rate) > coalesce((p_terms->>'max_rate')::numeric, cur.max_rate) then
    raise exception 'Taux de base supérieur au maximum' using errcode = '22023';
  end if;
  update public.ambassador_terms set status = 'archived' where status = 'active';
  insert into public.ambassador_terms (version, status, base_rate, max_rate, tiers, commission_months, hold_days, payout_threshold_cents,
    eligible_products, countries, currencies, reference, bonuses, campaigns, product_lines, conditions_md)
  values (v, 'active',
    coalesce((p_terms->>'base_rate')::numeric, cur.base_rate), coalesce((p_terms->>'max_rate')::numeric, cur.max_rate),
    coalesce(p_terms->'tiers', cur.tiers), coalesce((p_terms->>'commission_months')::int, cur.commission_months),
    coalesce((p_terms->>'hold_days')::int, cur.hold_days), coalesce((p_terms->>'payout_threshold_cents')::int, cur.payout_threshold_cents),
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_terms->'eligible_products') x), cur.eligible_products),
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_terms->'countries') x), cur.countries),
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_terms->'currencies') x), cur.currencies),
    coalesce(p_terms->'reference', cur.reference), coalesce(p_terms->'bonuses', cur.bonuses), coalesce(p_terms->'campaigns', cur.campaigns),
    coalesce(p_terms->'product_lines', cur.product_lines), coalesce(p_terms->>'conditions_md', cur.conditions_md));
  return v;
end $$;
grant execute on function public.admin_publish_ambassador_terms(jsonb) to authenticated;

-- ---------------------------------------------------------------- version 1 (validée par la propriétaire le 24/11/2026)
insert into public.ambassador_terms (version, status, base_rate, max_rate, tiers, commission_months, hold_days, payout_threshold_cents,
  eligible_products, reference, product_lines, conditions_md)
values (1, 'active', 30, 35,
  '[{"key":"starter","label":"HOMI Starter","rate":30,"min_conversions":0,"enabled":true},
    {"key":"silver","label":"HOMI Silver","rate":31,"min_conversions":25,"enabled":false},
    {"key":"gold","label":"HOMI Gold","rate":33,"min_conversions":100,"enabled":false},
    {"key":"elite","label":"HOMI Elite","rate":35,"min_conversions":500,"enabled":false}]',
  6, 30, 5000,
  array['homi_premium_monthly', 'homi_premium_6months', 'homi_premium_annual', 'homi_family_monthly_v2'],
  '{"currency":"EUR","vat_rate":20,"store_fee_rate":15,"trial_days":3,"family_supplement":5,
    "plans":[{"key":"monthly","label":"HOMI Premium mensuel","price":14.99,"months":1},
             {"key":"semiannual","label":"HOMI Premium 6 mois","price":69.99,"months":6},
             {"key":"annual","label":"HOMI Premium annuel","price":119.99,"months":12}],
    "note":"Prix de référence en France. Dans l’app, le prix affiché est toujours celui de l’App Store (pays, devise)."}',
  '[{"key":"store","label":"HOMI Store","kind":"physical","rate":null,"enabled":false},
    {"key":"wear","label":"HOMI Wear","kind":"physical","rate":null,"enabled":false},
    {"key":"smart","label":"HOMI Smart","kind":"physical","rate":null,"enabled":false},
    {"key":"play","label":"HOMI Play","kind":"physical","rate":null,"enabled":false},
    {"key":"books","label":"HOMI Books","kind":"physical","rate":null,"enabled":false},
    {"key":"box","label":"HOMI Box","kind":"physical","rate":null,"enabled":false},
    {"key":"mama","label":"HOMI Mama","kind":"physical","rate":null,"enabled":false},
    {"key":"learn","label":"HOMI Learn","kind":"physical","rate":null,"enabled":false},
    {"key":"home","label":"HOMI Home","kind":"physical","rate":null,"enabled":false}]',
  'Inscription gratuite. Commission sur les revenus nets éligibles des six premiers mois payants de chaque abonné apporté. Aucune commission sur les téléchargements, les essais non convertis ni les transactions remboursées. Versement mensuel à partir de 50 €. Revenus non garantis. Toute publication doit porter la mention « Publicité » ou « Collaboration commerciale ».')
on conflict (version) do nothing;

-- ---------------------------------------------------------------- index des clés étrangères
create index if not exists ambassador_commissions_payout on public.ambassador_commissions (payout_id);
create index if not exists ambassador_commissions_referred on public.ambassador_commissions (referred_user_id);
create index if not exists ambassador_commissions_terms on public.ambassador_commissions (terms_version);
create index if not exists ambassadors_terms on public.ambassadors (terms_version);

-- ---------------------------------------------------------------- export RGPD (« Exporter mes données »)
-- Fiche ambassadeur, commissions et versements de la personne ; pour un parent apporté : le code utilisé.
-- Jamais l'identité des abonnés apportés. Les conditions publiques (ambassador_terms) sont citées par leur version.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_ambassadeurs' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_ambassadeurs;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_ambassadeurs() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); a public.ambassadors;
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  select * into a from public.ambassadors where user_id = v_uid;
  return public._export_my_data_raw_ambassadeurs() || jsonb_build_object(
    'ambassador', case when a.id is null then null else jsonb_build_object('code', a.code, 'display_name', a.display_name, 'email', a.email,
      'status', a.status, 'tier', a.tier, 'legal_status', a.legal_status, 'siret', a.siret, 'social_links', a.social_links,
      'terms_version', a.terms_version, 'terms', (select to_jsonb(t) from public.ambassador_terms t where t.version = a.terms_version),
      'accepted_terms_at', a.accepted_terms_at, 'created_at', a.created_at) end,
    'ambassador_commissions', (select coalesce(jsonb_agg(jsonb_build_object('product_id', c.product_id, 'period_index', c.period_index,
      'net_cents', c.net_cents, 'rate', c.rate, 'amount_cents', c.amount_cents, 'currency', c.currency, 'status', c.status,
      'occurred_at', c.occurred_at) order by c.occurred_at), '[]') from public.ambassador_commissions c where c.ambassador_id = a.id),
    'ambassador_payouts', (select coalesce(jsonb_agg(jsonb_build_object('period', p.period, 'amount_cents', p.amount_cents, 'status', p.status, 'sent_at', p.sent_at)), '[]')
      from public.ambassador_payouts p where p.ambassador_id = a.id),
    'referral_attributions', (select coalesce(jsonb_agg(jsonb_build_object('code', r.code, 'source', r.source, 'attributed_at', r.attributed_at)), '[]')
      from public.referral_attributions r where r.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- Aucune fonction du programme n'est exécutable sans compte (règle S9) ; l'app passe par un compte connecté
revoke execute on function public.ambassador_active_terms() from public, anon;
revoke execute on function public.ambassador_rate_of(uuid) from public, anon, authenticated;
revoke execute on function public.ambassador_claim(text, text) from public, anon;
grant execute on function public.ambassador_claim(text, text) to authenticated;
revoke execute on function public.my_ambassador() from public, anon;
grant execute on function public.my_ambassador() to authenticated;
revoke execute on function public.admin_ambassador_set(uuid, text, text, numeric) from public, anon;
grant execute on function public.admin_ambassador_set(uuid, text, text, numeric) to authenticated;
revoke execute on function public.admin_publish_ambassador_terms(jsonb) from public, anon;
grant execute on function public.admin_publish_ambassador_terms(jsonb) to authenticated;
