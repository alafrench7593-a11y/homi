-- =====================================================================
-- HOMI Ambassadors — MVP (24/11/2026). Conception : docs/ambassadors/HOMI_AFFILIATE_ARCHITECTURE.md
--  - Données d'affiliation SÉPARÉES des données familiales : aucune table ici ne référence un enfant, une grossesse
--    ou un contenu ; un ambassadeur ne lit QUE des agrégats (fonction affiliate_my_summary), jamais un client.
--  - Attribution : dernier code valide avant la première transaction payée, fenêtre configurable (30 j), FIGÉE à la
--    première commission ; auto-affiliation refusée.
--  - Grand livre en unités mineures entières (bigint, centimes) + devise ; aucune ligne de montant modifiée :
--    un remboursement crée une écriture négative. Idempotence : (transaction, nature) unique.
--  - Écriture des commissions : rôle serveur uniquement (webhook RevenueCat), jamais un client.
-- =====================================================================

-- Rôles d'administration distincts (finance, support, marketing) en plus des rôles existants
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('admin', 'moderator', 'editor', 'finance', 'support', 'marketing'));

-- ---------------------------------------------------------------- règles de commission (configurables)
create table public.affiliate_commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  percent_bp integer not null default 3000 check (percent_bp between 0 and 5000),   -- 3000 = 30 % de l'encaissé net
  fixed_minor bigint not null default 0 check (fixed_minor >= 0),
  months integer not null default 6 check (months between 1 and 36),              -- durée commissionnée après le 1er paiement
  hold_days integer not null default 45 check (hold_days between 0 and 180),       -- délai avant disponibilité
  attribution_days integer not null default 30 check (attribution_days between 1 and 90),
  product_ids text[],                                                              -- null : tous les produits d'abonnement
  active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now()
);
insert into public.affiliate_commission_rules (name) values ('Programme de lancement');

-- ---------------------------------------------------------------- ambassadeurs
create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9-]{2,23}$'),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  contact_email text not null check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(contact_email) <= 200),
  country text not null check (country ~ '^[A-Z]{2}$'),
  language text not null default 'fr' check (language in ('fr', 'en', 'es', 'de', 'it')),
  profile_type text not null check (profile_type in ('maman', 'papa', 'createur', 'influenceur', 'ugc', 'blogueur', 'communaute', 'accompagnant', 'media', 'partenaire', 'autre')),
  socials jsonb not null default '[]'::jsonb check (jsonb_typeof(socials) = 'array' and jsonb_array_length(socials) <= 8),
  audience_size integer check (audience_size is null or audience_size between 0 and 100000000),
  topics text[] not null default '{}' check (cardinality(topics) <= 12),
  promo_channel text check (promo_channel is null or char_length(promo_channel) <= 500),
  tier text not null default 'starter' check (tier in ('starter', 'ambassador', 'pro', 'elite')),
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- liens par campagne / fonctionnalité (l'ambassadeur les crée ; le code reste le même)
create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  campaign text not null default '' check (campaign ~ '^[a-z0-9-]{0,32}$'),
  feature text not null default '' check (feature ~ '^[a-z0-9-]{0,32}$'),
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (affiliate_id, campaign, feature)
);

-- clics AGRÉGÉS par jour (aucune adresse IP, aucun identifiant d'appareil)
create table public.affiliate_clicks (
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  day date not null default current_date,
  campaign text not null default '',
  feature text not null default '',
  clicks integer not null default 0 check (clicks >= 0),
  primary key (affiliate_id, day, campaign, feature)
);

-- une attribution par compte client
create table public.affiliate_attributions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  source text not null check (source in ('link', 'code', 'web')),
  campaign text not null default '',
  feature text not null default '',
  attributed_at timestamptz not null default now(),
  locked_at timestamptz                      -- première transaction payée : plus aucun changement
);
create index affiliate_attributions_affiliate_idx on public.affiliate_attributions (affiliate_id);

-- grand livre
create table public.affiliate_ledger (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  customer_id uuid references auth.users(id) on delete set null,   -- jamais exposé à l'ambassadeur
  kind text not null check (kind in ('commission', 'reversal', 'adjustment', 'payout')),
  status text not null check (status in ('pending', 'available', 'paid', 'reversed')),
  amount_minor bigint not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  transaction_id text,
  product_id text,
  rule_id uuid references public.affiliate_commission_rules(id),
  net_minor bigint,                                                  -- base encaissée nette (traçabilité)
  available_at timestamptz,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check ((kind = 'commission' and amount_minor >= 0) or (kind in ('reversal', 'payout') and amount_minor <= 0) or kind = 'adjustment')
);
create unique index affiliate_ledger_tx_kind_uq on public.affiliate_ledger (transaction_id, kind) where transaction_id is not null and kind in ('commission', 'reversal');
create index affiliate_ledger_affiliate_idx on public.affiliate_ledger (affiliate_id, created_at desc);

create table public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'processing' check (status in ('processing', 'paid', 'failed')),
  reference text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.affiliate_audit_logs (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id),
  action text not null,
  affiliate_id uuid references public.affiliates(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS : rien en lecture directe pour les ambassadeurs
alter table public.affiliate_commission_rules enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_attributions enable row level security;
alter table public.affiliate_ledger enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.affiliate_audit_logs enable row level security;

-- l'ambassadeur lit sa fiche et ses liens ; l'administration (admin, finance, support, marketing) lit tout
create policy affiliates_self_or_staff on public.affiliates for select to authenticated
  using (user_id = auth.uid() or public.has_role('finance') or public.has_role('support') or public.has_role('marketing'));
create policy affiliate_links_self on public.affiliate_links for select to authenticated
  using (exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid()) or public.has_role('marketing'));
create policy affiliate_rules_staff on public.affiliate_commission_rules for select to authenticated using (public.has_role('finance'));
create policy affiliate_rules_admin_write on public.affiliate_commission_rules for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy affiliate_ledger_finance on public.affiliate_ledger for select to authenticated using (public.has_role('finance'));
create policy affiliate_payouts_finance on public.affiliate_payouts for select to authenticated using (public.has_role('finance'));
create policy affiliate_audit_admin on public.affiliate_audit_logs for select to authenticated using (public.has_role('admin'));
-- pas de politique sur affiliate_clicks ni affiliate_attributions : lecture et écriture par fonctions seulement

-- ---------------------------------------------------------------- candidature (web ou app, compte HOMI connecté)
create or replace function public.affiliate_apply(
  p_code text, p_first_name text, p_last_name text, p_contact_email text, p_country text, p_language text,
  p_profile_type text, p_terms_version text, p_socials jsonb default '[]'::jsonb, p_audience_size integer default null,
  p_topics text[] default '{}', p_promo_channel text default null
) returns public.affiliates language plpgsql security definer set search_path = public as $$
declare v public.affiliates;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  insert into public.affiliates (user_id, code, first_name, last_name, contact_email, country, language, profile_type,
    socials, audience_size, topics, promo_channel, terms_version)
  values (auth.uid(), lower(btrim(p_code)), btrim(p_first_name), btrim(p_last_name), lower(btrim(p_contact_email)), upper(p_country),
    coalesce(p_language, 'fr'), p_profile_type, coalesce(p_socials, '[]'::jsonb), p_audience_size, coalesce(p_topics, '{}'), p_promo_channel, p_terms_version)
  returning * into v;
  insert into public.affiliate_links (affiliate_id) values (v.id);
  insert into public.affiliate_audit_logs (actor, action, affiliate_id) values (auth.uid(), 'apply', v.id);
  return v;
exception when unique_violation then
  raise exception 'Ce code est déjà pris, ou tu as déjà une candidature' using errcode = '23505';
end $$;

-- validation / refus / suspension (support ou admin), journalisée
create or replace function public.affiliate_set_status(p_affiliate uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('support') then raise exception 'Réservé à l''administration' using errcode = '42501'; end if;
  if p_status not in ('active', 'suspended', 'rejected') then raise exception 'Statut inconnu'; end if;
  update public.affiliates set status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() where id = p_affiliate;
  insert into public.affiliate_audit_logs (actor, action, affiliate_id, detail) values (auth.uid(), 'status:' || p_status, p_affiliate, jsonb_build_object('note', p_note));
end $$;

-- lien de campagne (l'ambassadeur actif)
create or replace function public.affiliate_create_link(p_campaign text, p_feature text default '')
returns public.affiliate_links language plpgsql security definer set search_path = public as $$
declare a public.affiliates; v public.affiliate_links;
begin
  select * into a from public.affiliates where user_id = auth.uid() and status = 'active';
  if a.id is null then raise exception 'Compte ambassadeur non actif' using errcode = '42501'; end if;
  insert into public.affiliate_links (affiliate_id, campaign, feature) values (a.id, lower(coalesce(p_campaign, '')), lower(coalesce(p_feature, '')))
    on conflict (affiliate_id, campaign, feature) do update set disabled = false returning * into v;
  return v;
end $$;

-- ---------------------------------------------------------------- clic (page /r/<code>, visiteur anonyme)
create or replace function public.affiliate_record_click(p_code text, p_campaign text default '', p_feature text default '')
returns boolean language plpgsql security definer set search_path = public as $$
declare a_id uuid; c text := lower(coalesce(p_campaign, '')); f text := lower(coalesce(p_feature, ''));
begin
  if c !~ '^[a-z0-9-]{0,32}$' or f !~ '^[a-z0-9-]{0,32}$' then c := ''; f := ''; end if;
  select id into a_id from public.affiliates where code = lower(btrim(p_code)) and status = 'active';
  if a_id is null then return false; end if;
  insert into public.affiliate_clicks (affiliate_id, day, campaign, feature, clicks) values (a_id, current_date, c, f, 1)
    on conflict (affiliate_id, day, campaign, feature) do update set clicks = affiliate_clicks.clicks + 1;
  return true;
end $$;

-- ---------------------------------------------------------------- attribution (compte client connecté)
-- Dernier code valide gagne tant qu'aucune transaction payée n'a eu lieu ; auto-affiliation refusée.
create or replace function public.affiliate_attach(p_code text, p_source text default 'code', p_campaign text default '', p_feature text default '')
returns text language plpgsql security definer set search_path = public as $$
declare a public.affiliates; cur public.affiliate_attributions;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_source not in ('link', 'code', 'web') then raise exception 'Source inconnue'; end if;
  select * into a from public.affiliates where code = lower(btrim(p_code)) and status = 'active';
  if a.id is null then return 'unknown_code'; end if;
  if a.user_id = auth.uid() then return 'self'; end if;
  select * into cur from public.affiliate_attributions where user_id = auth.uid();
  if cur.locked_at is not null then return 'locked'; end if;
  insert into public.affiliate_attributions (user_id, affiliate_id, source, campaign, feature, attributed_at)
  values (auth.uid(), a.id, p_source, lower(coalesce(p_campaign, '')), lower(coalesce(p_feature, '')), now())
  on conflict (user_id) do update set affiliate_id = excluded.affiliate_id, source = excluded.source,
    campaign = excluded.campaign, feature = excluded.feature, attributed_at = now();
  return 'ok';
end $$;

-- ---------------------------------------------------------------- commissions (serveur : webhook RevenueCat)
-- p_net_minor : encaissé NET (après TVA et commission de la boutique), calculé côté serveur à partir de l'événement.
create or replace function public.affiliate_record_commission(
  p_customer uuid, p_transaction_id text, p_product_id text, p_net_minor bigint, p_currency text, p_paid_at timestamptz
) returns text language plpgsql security definer set search_path = public as $$
declare att public.affiliate_attributions; a public.affiliates; r public.affiliate_commission_rules; amt bigint; first_paid timestamptz;
begin
  if p_transaction_id is null or p_net_minor is null or p_net_minor < 0 then return 'invalid'; end if;
  select * into att from public.affiliate_attributions where user_id = p_customer for update;
  if att.user_id is null then return 'no_attribution'; end if;
  select * into a from public.affiliates where id = att.affiliate_id;
  if a.status <> 'active' then return 'affiliate_inactive'; end if;
  select * into r from public.affiliate_commission_rules
    where active and valid_from <= p_paid_at and (valid_to is null or valid_to > p_paid_at)
      and (product_ids is null or p_product_id = any(product_ids))
    order by valid_from desc limit 1;
  if r.id is null then return 'no_rule'; end if;
  if att.locked_at is null then
    -- première transaction payée : le code doit dater de moins de la fenêtre d'attribution
    if att.attributed_at < p_paid_at - make_interval(days => r.attribution_days) then return 'attribution_expired'; end if;
    update public.affiliate_attributions set locked_at = p_paid_at where user_id = p_customer;
    first_paid := p_paid_at;
  else
    first_paid := att.locked_at;
  end if;
  if p_paid_at >= first_paid + make_interval(months => r.months) then return 'period_over'; end if;
  amt := (p_net_minor * r.percent_bp) / 10000 + r.fixed_minor;
  insert into public.affiliate_ledger (affiliate_id, customer_id, kind, status, amount_minor, currency, transaction_id, product_id, rule_id, net_minor, available_at)
  values (a.id, p_customer, 'commission', 'pending', amt, upper(p_currency), p_transaction_id, p_product_id, r.id, p_net_minor, p_paid_at + make_interval(days => r.hold_days))
  on conflict (transaction_id, kind) where transaction_id is not null and kind in ('commission', 'reversal') do nothing;
  if not found then return 'duplicate'; end if;
  return 'ok';
end $$;

-- remboursement / révocation : écriture négative (même si la commission a déjà été versée : elle sera déduite)
create or replace function public.affiliate_reverse_commission(p_transaction_id text, p_note text default 'refund')
returns text language plpgsql security definer set search_path = public as $$
declare c public.affiliate_ledger;
begin
  select * into c from public.affiliate_ledger where transaction_id = p_transaction_id and kind = 'commission';
  if c.id is null then return 'no_commission'; end if;
  insert into public.affiliate_ledger (affiliate_id, customer_id, kind, status, amount_minor, currency, transaction_id, product_id, rule_id, note)
  values (c.affiliate_id, c.customer_id, 'reversal', case when c.status = 'paid' then 'available' else 'reversed' end, -c.amount_minor, c.currency, p_transaction_id, c.product_id, c.rule_id, p_note)
  on conflict (transaction_id, kind) where transaction_id is not null and kind in ('commission', 'reversal') do nothing;
  if not found then return 'duplicate'; end if;
  -- une commission encore en attente devient « annulée » (statut seulement ; le montant reste tracé)
  update public.affiliate_ledger set status = 'reversed' where id = c.id and status = 'pending';
  return 'ok';
end $$;

-- passage « en attente » → « disponible » après le délai (tâche planifiée)
create or replace function public.affiliate_release_due() returns integer language sql security definer set search_path = public as $$
  with u as (update public.affiliate_ledger set status = 'available' where kind = 'commission' and status = 'pending' and available_at <= now() returning 1)
  select count(*)::int from u;
$$;

-- versement manuel validé par la finance (aucun paiement réel déclenché ici : enregistrement du virement)
create or replace function public.affiliate_record_payout(p_affiliate uuid, p_currency text, p_reference text)
returns public.affiliate_payouts language plpgsql security definer set search_path = public as $$
declare total bigint; p public.affiliate_payouts;
begin
  if not public.has_role('finance') then raise exception 'Réservé à la finance' using errcode = '42501'; end if;
  select coalesce(sum(amount_minor), 0) into total from public.affiliate_ledger
    where affiliate_id = p_affiliate and currency = upper(p_currency) and status = 'available';
  if total < 3000 then raise exception 'Seuil de versement non atteint (30,00)'; end if;
  insert into public.affiliate_payouts (affiliate_id, amount_minor, currency, status, reference, created_by, paid_at)
    values (p_affiliate, total, upper(p_currency), 'paid', p_reference, auth.uid(), now()) returning * into p;
  update public.affiliate_ledger set status = 'paid' where affiliate_id = p_affiliate and currency = upper(p_currency) and status = 'available';
  insert into public.affiliate_ledger (affiliate_id, kind, status, amount_minor, currency, note, created_by)
    values (p_affiliate, 'payout', 'paid', -total, upper(p_currency), p_reference, auth.uid());
  insert into public.affiliate_audit_logs (actor, action, affiliate_id, detail) values (auth.uid(), 'payout', p_affiliate, jsonb_build_object('amount_minor', total, 'currency', upper(p_currency), 'reference', p_reference));
  return p;
end $$;

-- ---------------------------------------------------------------- tableau de bord : AGRÉGATS seulement
create or replace function public.affiliate_my_summary() returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.affiliates;
begin
  select * into a from public.affiliates where user_id = auth.uid();
  if a.id is null then return null; end if;
  return jsonb_build_object(
    'code', a.code, 'status', a.status, 'tier', a.tier,
    'clicks_30d', (select coalesce(sum(clicks), 0) from public.affiliate_clicks where affiliate_id = a.id and day > current_date - 30),
    'signups', (select count(*) from public.affiliate_attributions where affiliate_id = a.id),
    'paying', (select count(*) from public.affiliate_attributions where affiliate_id = a.id and locked_at is not null),
    'by_currency', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select currency,
          sum(amount_minor) filter (where status = 'pending' and kind = 'commission') as pending_minor,
          sum(amount_minor) filter (where status = 'available') as available_minor,
          -sum(amount_minor) filter (where kind = 'payout') as paid_minor,
          sum(amount_minor) filter (where kind = 'commission' and created_at >= date_trunc('month', now())) as month_minor
        from public.affiliate_ledger where affiliate_id = a.id group by currency) x),
    'links', (select coalesce(jsonb_agg(jsonb_build_object('campaign', campaign, 'feature', feature, 'disabled', disabled) order by created_at), '[]'::jsonb)
        from public.affiliate_links where affiliate_id = a.id)
  );
end $$;

-- ---------------------------------------------------------------- droits d'exécution
revoke all on function public.affiliate_record_commission(uuid, text, text, bigint, text, timestamptz) from public, anon, authenticated;
revoke all on function public.affiliate_reverse_commission(text, text) from public, anon, authenticated;
revoke all on function public.affiliate_release_due() from public, anon, authenticated;
grant execute on function public.affiliate_record_commission(uuid, text, text, bigint, text, timestamptz) to service_role;
grant execute on function public.affiliate_reverse_commission(text, text) to service_role;
grant execute on function public.affiliate_release_due() to service_role;
revoke all on function public.affiliate_record_click(text, text, text) from public;
grant execute on function public.affiliate_record_click(text, text, text) to anon, authenticated;
revoke all on function public.affiliate_apply(text, text, text, text, text, text, text, text, jsonb, integer, text[], text) from public, anon;
grant execute on function public.affiliate_apply(text, text, text, text, text, text, text, text, jsonb, integer, text[], text) to authenticated;
revoke all on function public.affiliate_attach(text, text, text, text) from public, anon;
grant execute on function public.affiliate_attach(text, text, text, text) to authenticated;
revoke all on function public.affiliate_create_link(text, text) from public, anon;
grant execute on function public.affiliate_create_link(text, text) to authenticated;
revoke all on function public.affiliate_my_summary() from public, anon;
grant execute on function public.affiliate_my_summary() to authenticated;
revoke all on function public.affiliate_set_status(uuid, text, text) from public, anon;
grant execute on function public.affiliate_set_status(uuid, text, text) to authenticated;
revoke all on function public.affiliate_record_payout(uuid, text, text) from public, anon;
grant execute on function public.affiliate_record_payout(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------- index des clés étrangères
create index affiliate_audit_logs_actor_idx on public.affiliate_audit_logs (actor);
create index affiliate_audit_logs_affiliate_idx on public.affiliate_audit_logs (affiliate_id);
create index affiliate_ledger_created_by_idx on public.affiliate_ledger (created_by);
create index affiliate_ledger_customer_idx on public.affiliate_ledger (customer_id);
create index affiliate_ledger_rule_idx on public.affiliate_ledger (rule_id);
create index affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id);
create index affiliate_payouts_created_by_idx on public.affiliate_payouts (created_by);
create index affiliates_reviewed_by_idx on public.affiliates (reviewed_by);

-- ---------------------------------------------------------------- export RGPD (même chaînage que 20261203000100)
-- Ambassadeur : sa fiche, son grand livre (sans identifiant client), ses versements. Client : le code qui lui est attribué.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_ambassadors' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_ambassadors;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_ambassadors() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_aff uuid;
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  select id into v_aff from public.affiliates where user_id = v_uid;
  return public._export_my_data_raw_ambassadors() || jsonb_build_object(
    'affiliates', (select to_jsonb(a) - 'reviewed_by' from public.affiliates a where a.user_id = v_uid),
    'affiliate_ledger', (select coalesce(jsonb_agg(to_jsonb(l) - 'customer_id' - 'created_by' order by l.created_at), '[]')
                         from public.affiliate_ledger l where l.affiliate_id = v_aff),
    'affiliate_payouts', (select coalesce(jsonb_agg(to_jsonb(p) - 'created_by' order by p.created_at), '[]')
                          from public.affiliate_payouts p where p.affiliate_id = v_aff),
    'affiliate_attributions', (select jsonb_build_object('code', a.code, 'source', t.source, 'attributed_at', t.attributed_at, 'locked_at', t.locked_at)
                               from public.affiliate_attributions t join public.affiliates a on a.id = t.affiliate_id where t.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;
