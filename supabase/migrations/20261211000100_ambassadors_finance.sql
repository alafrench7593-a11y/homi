-- =====================================================================
-- HOMI Ambassadors — sécurisation financière (audit du 24/11/2026, docs/ambassadors/HOMI_AMBASSADORS_FINANCIAL_AUDIT.md)
--  1. Arrondi unique : demi-unité supérieure (half-up), par transaction, en unités mineures entières
--     (10,62 € net × 30 % = 3,186 → 3,19 € ; 6 × 3,19 = 19,14 €). Même règle côté serveur TS et simulateurs.
--  2. Au plus `months` paiements commissionnés par client (en plus de la fenêtre de 6 mois) : un renouvellement
--     daté quelques secondes trop tôt ne crée jamais une 7e commission.
--  3. Client DÉJÀ payant avant l'attribution (première facturation confirmée sur une autre transaction) : aucune commission.
--  4. Transactions de test (environnement sandbox) : jamais de commission.
--  5. Traçabilité : brut, taxe, commission boutique, taux, version des conditions, événement, environnement, boutique.
--  6. Grand livre en ajout seul : aucun montant/transaction modifiable, aucune suppression, transitions de statut contrôlées.
-- Retour arrière : restaurer la fonction de 20261209000100 ; les colonnes ajoutées sont facultatives.
-- =====================================================================

alter table public.affiliate_ledger
  add column if not exists gross_minor bigint,
  add column if not exists tax_bp integer check (tax_bp is null or tax_bp between 0 and 10000),
  add column if not exists store_fee_bp integer check (store_fee_bp is null or store_fee_bp between 0 and 10000),
  add column if not exists rate_bp integer check (rate_bp is null or rate_bp between 0 and 10000),
  add column if not exists terms_version text,
  add column if not exists event_id text,
  add column if not exists environment text check (environment is null or environment in ('production', 'sandbox')),
  add column if not exists store text;

-- (index par client déjà présent : affiliate_ledger_customer_idx, 20261209000100)

-- ---------------------------------------------------------------- grand livre en ajout seul
create or replace function public._affiliate_ledger_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' then raise exception 'Grand livre Ambassadors : suppression interdite (écriture compensatoire)' using errcode = '42501'; end if;
  if new.amount_minor is distinct from old.amount_minor or new.currency is distinct from old.currency or new.kind is distinct from old.kind
     or new.affiliate_id is distinct from old.affiliate_id or new.transaction_id is distinct from old.transaction_id
     or new.net_minor is distinct from old.net_minor or new.rate_bp is distinct from old.rate_bp or new.gross_minor is distinct from old.gross_minor then
    raise exception 'Grand livre Ambassadors : montant et références non modifiables' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'pending' and new.status in ('available', 'reversed'))
    or (old.status = 'available' and new.status = 'paid')) then
    raise exception 'Grand livre Ambassadors : transition de statut interdite (% → %)', old.status, new.status using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists affiliate_ledger_guard on public.affiliate_ledger;
create trigger affiliate_ledger_guard before update or delete on public.affiliate_ledger
  for each row execute function public._affiliate_ledger_guard();

-- ---------------------------------------------------------------- attribution : pas de client déjà payant
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
  -- déjà abonné payant avant toute attribution : aucune recommandation possible
  if exists (select 1 from public.conversion_events e where e.user_id = auth.uid() and e.kind = 'first_billing_confirmed') then return 'already_customer'; end if;
  insert into public.affiliate_attributions (user_id, affiliate_id, source, campaign, feature, attributed_at)
  values (auth.uid(), a.id, p_source, lower(coalesce(p_campaign, '')), lower(coalesce(p_feature, '')), now())
  on conflict (user_id) do update set affiliate_id = excluded.affiliate_id, source = excluded.source,
    campaign = excluded.campaign, feature = excluded.feature, attributed_at = now();
  return 'ok';
end $$;

-- ---------------------------------------------------------------- commission (serveur uniquement)
drop function if exists public.affiliate_record_commission(uuid, text, text, bigint, text, timestamptz);
create or replace function public.affiliate_record_commission(
  p_customer uuid, p_transaction_id text, p_product_id text, p_net_minor bigint, p_currency text, p_paid_at timestamptz,
  p_gross_minor bigint default null, p_tax_bp integer default null, p_store_fee_bp integer default null,
  p_event_id text default null, p_environment text default null, p_store text default null
) returns text language plpgsql security definer set search_path = public as $$
declare att public.affiliate_attributions; a public.affiliates; r public.affiliate_commission_rules; amt bigint; first_paid timestamptz; n_paid integer;
begin
  if p_transaction_id is null or p_net_minor is null or p_net_minor < 0 then return 'invalid'; end if;
  if lower(coalesce(p_environment, 'production')) = 'sandbox' then return 'sandbox_ignored'; end if;
  select * into att from public.affiliate_attributions where user_id = p_customer for update;   -- sérialise un même client
  if att.user_id is null then return 'no_attribution'; end if;
  select * into a from public.affiliates where id = att.affiliate_id;
  if a.status <> 'active' then return 'affiliate_inactive'; end if;
  select * into r from public.affiliate_commission_rules
    where active and valid_from <= p_paid_at and (valid_to is null or valid_to > p_paid_at)
      and (product_ids is null or p_product_id = any(product_ids))
    order by valid_from desc limit 1;
  if r.id is null then return 'no_rule'; end if;
  if att.locked_at is null then
    if att.attributed_at < p_paid_at - make_interval(days => r.attribution_days) then return 'attribution_expired'; end if;
    -- première facturation déjà confirmée sur une AUTRE transaction : client existant, pas une recommandation
    if exists (select 1 from public.conversion_events e where e.user_id = p_customer and e.kind = 'first_billing_confirmed'
               and e.transaction_id <> p_transaction_id and e.occurred_at < p_paid_at) then return 'already_customer'; end if;
    update public.affiliate_attributions set locked_at = p_paid_at where user_id = p_customer;
    first_paid := p_paid_at;
  else
    first_paid := att.locked_at;
  end if;
  if p_paid_at >= first_paid + make_interval(months => r.months) then return 'period_over'; end if;
  select count(*) into n_paid from public.affiliate_ledger
    where customer_id = p_customer and kind = 'commission' and status <> 'reversed' and transaction_id <> p_transaction_id;
  if n_paid >= r.months then return 'period_over'; end if;
  amt := (p_net_minor * r.percent_bp + 5000) / 10000 + r.fixed_minor;   -- arrondi half-up par transaction
  insert into public.affiliate_ledger (affiliate_id, customer_id, kind, status, amount_minor, currency, transaction_id, product_id, rule_id,
    net_minor, available_at, gross_minor, tax_bp, store_fee_bp, rate_bp, terms_version, event_id, environment, store)
  values (a.id, p_customer, 'commission', 'pending', amt, upper(p_currency), p_transaction_id, p_product_id, r.id,
    p_net_minor, p_paid_at + make_interval(days => r.hold_days), p_gross_minor, p_tax_bp, p_store_fee_bp, r.percent_bp, a.terms_version,
    p_event_id, case when p_environment is null then null else lower(p_environment) end, p_store)
  on conflict (transaction_id, kind) where transaction_id is not null and kind in ('commission', 'reversal') do nothing;
  if not found then return 'duplicate'; end if;
  return 'ok';
end $$;
revoke all on function public.affiliate_record_commission(uuid, text, text, bigint, text, timestamptz, bigint, integer, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.affiliate_record_commission(uuid, text, text, bigint, text, timestamptz, bigint, integer, integer, text, text, text) to service_role;

-- ---------------------------------------------------------------- versement : verrou + référence unique (jamais deux fois)
create unique index if not exists affiliate_payouts_reference_uq on public.affiliate_payouts (lower(reference)) where reference is not null;
create or replace function public.affiliate_record_payout(p_affiliate uuid, p_currency text, p_reference text)
returns public.affiliate_payouts language plpgsql security definer set search_path = public as $$
declare total bigint; p public.affiliate_payouts;
begin
  if not public.has_role('finance') then raise exception 'Réservé à la finance' using errcode = '42501'; end if;
  if coalesce(btrim(p_reference), '') = '' then raise exception 'Référence du virement obligatoire'; end if;
  perform 1 from public.affiliates where id = p_affiliate for update;   -- deux validations simultanées : l'une attend l'autre
  if not found then raise exception 'Ambassadeur inconnu'; end if;
  if exists (select 1 from public.affiliate_payouts where lower(reference) = lower(btrim(p_reference))) then
    raise exception 'Référence déjà utilisée : versement déjà enregistré' using errcode = '23505';
  end if;
  select coalesce(sum(amount_minor), 0) into total from public.affiliate_ledger
    where affiliate_id = p_affiliate and currency = upper(p_currency) and status = 'available';
  if total < 3000 then raise exception 'Seuil de versement non atteint (30,00)'; end if;
  insert into public.affiliate_payouts (affiliate_id, amount_minor, currency, status, reference, created_by, paid_at)
    values (p_affiliate, total, upper(p_currency), 'paid', btrim(p_reference), auth.uid(), now()) returning * into p;
  update public.affiliate_ledger set status = 'paid' where affiliate_id = p_affiliate and currency = upper(p_currency) and status = 'available';
  insert into public.affiliate_ledger (affiliate_id, kind, status, amount_minor, currency, note, created_by)
    values (p_affiliate, 'payout', 'paid', -total, upper(p_currency), btrim(p_reference), auth.uid());
  insert into public.affiliate_audit_logs (actor, action, affiliate_id, detail) values (auth.uid(), 'payout', p_affiliate, jsonb_build_object('amount_minor', total, 'currency', upper(p_currency), 'reference', btrim(p_reference)));
  return p;
end $$;
