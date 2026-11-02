-- =====================================================================
-- Abonnement v2 (05/11/2026) — « Au fil de nous Premium » : 3 formules (1 mois, 6 mois, 12 mois),
-- un seul droit RevenueCat (AU_FIL_DE_NOUS_PREMIUM), statuts complets, partage limité à 2 adultes.
--
-- 1. Colonnes ajoutées à public.subscriptions (aucune colonne ni donnée supprimée) :
--      started_at      début de l'abonnement (premier achat de la souscription en cours)
--      trial_ends_at   fin de l'essai gratuit (si la période en cours est un essai)
--      price, currency prix réellement payé pour la période en cours, tel que transmis par RevenueCat
--                      (devise de l'achat ; jamais un prix inventé). Nul si inconnu ou gratuit.
--      cancel_reason   raison transmise par RevenueCat (UNSUBSCRIBE, BILLING_ERROR, CUSTOMER_SUPPORT…)
--      refunded_at     date du remboursement (droits retirés immédiatement)
--      billing_issue_at  date du premier échec de paiement non régularisé
--      resumes_at      reprise automatique d'un abonnement mis en pause (Google Play)
--      environment     production / sandbox (achats de test des boutiques)
--      last_sync_at    dernière relecture de RevenueCat par le serveur (fonction subscription-sync)
-- 2. Statuts acceptés : + 'refunded' (remboursé : plus aucun droit) et 'paused' (pause programmée
--    à la fin de la période : droits jusqu'à l'échéance, puis plus rien jusqu'à la reprise).
--    Période : + 'six_months'. Droit par défaut : 'AU_FIL_DE_NOUS_PREMIUM' (les lignes existantes gardent
--    leur valeur ; la colonne n'entre pas dans le calcul des droits).
-- 3. Règle des droits (_subscription_grants) : statut essai / actif / grâce / annulé / en pause ET date
--    d'échéance future. Une échéance NULLE ne donne plus un Premium sans fin, sauf octroi explicite sans
--    fin (boutique 'promotional' ou période 'lifetime', statut actif).
-- 4. Partage familial : l'abonné·e + UN SEUL autre adulte (2 comptes adultes au maximum). Le « co-parent »
--    bénéficiaire est choisi de façon déterministe (_premium_partner_of) :
--      a) parmi les co-parents (rôle 'coparent') des foyers dont l'abonné·e est propriétaire : le premier
--         arrivé (joined_at), puis le plus petit identifiant en cas d'égalité ;
--      b) à défaut, le propriétaire du foyer où l'abonné·e est co-parent (adhésion la plus ancienne).
--    Les accompagnants (rôle 'caregiver' : nounou, grand-parent…) ne reçoivent plus le Premium du foyer.
--    Avant : tout membre d'un foyer dont la propriétaire était abonnée recevait le Premium, sans limite.
-- 5. Écriture : toujours réservée au service_role (aucune politique d'écriture ; droits d'écriture
--    explicitement retirés à anon et authenticated, en plus de la RLS).
-- 6. Export RGPD : les nouvelles colonnes figurent dans la rubrique « subscription ».
-- 7. my_premium_share() : avec qui mon Premium est partagé / qui me le partage (pour soi seulement).
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

-- 1. Colonnes --------------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists price numeric(10,2) check (price is null or price >= 0),
  add column if not exists currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  add column if not exists cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 40),
  add column if not exists refunded_at timestamptz,
  add column if not exists billing_issue_at timestamptz,
  add column if not exists resumes_at timestamptz,
  add column if not exists environment text check (environment is null or environment in ('production','sandbox')),
  add column if not exists last_sync_at timestamptz;

alter table public.subscriptions alter column entitlement set default 'AU_FIL_DE_NOUS_PREMIUM';

-- 2. Statuts et périodes ----------------------------------------------------------------------
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('none','trial','active','grace','cancelled','expired','billing_issue','refunded','paused'));
alter table public.subscriptions drop constraint if exists subscriptions_period_type_check;
alter table public.subscriptions add constraint subscriptions_period_type_check
  check (period_type in ('monthly','six_months','annual','trial','lifetime'));

-- 3. Règle des droits -------------------------------------------------------------------------
create or replace function public._subscription_grants(p_status text, p_expires timestamptz, p_store text, p_period text)
returns boolean language sql stable set search_path = public as $$
  select case
    when p_status is null or p_status not in ('trial','active','grace','cancelled','paused') then false
    when p_expires is not null then p_expires > now()
    -- Échéance inconnue : jamais de Premium sans fin, sauf octroi explicite sans fin
    else p_status = 'active' and (p_store = 'promotional' or p_period = 'lifetime')
  end;
$$;

-- 4. Partage familial : un seul autre adulte -------------------------------------------------
create or replace function public._premium_partner_of(p_subscriber uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.partner from (
    -- a) co-parents des foyers dont l'abonné·e est propriétaire
    select m.user_id as partner, 1 as prio, m.joined_at as since
    from public.household_members o
    join public.household_members m on m.household_id = o.household_id and m.role = 'coparent' and m.user_id <> o.user_id
    where o.user_id = p_subscriber and o.role = 'owner'
    union all
    -- b) propriétaire du foyer où l'abonné·e est co-parent
    select o.user_id, 2, me.joined_at
    from public.household_members me
    join public.household_members o on o.household_id = me.household_id and o.role = 'owner' and o.user_id <> me.user_id
    where me.user_id = p_subscriber and me.role = 'coparent'
  ) c
  order by c.prio, c.since, c.partner
  limit 1;
$$;

create or replace function public._premium_of(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and (
        s.user_id = p_user
        or (
          s.user_id in (
            select other.user_id from public.household_members me
            join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
            where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
          )
          and public._premium_partner_of(s.user_id) = p_user
        )
      )
  );
$$;

revoke execute on function public._subscription_grants(text, timestamptz, text, text) from public, anon, authenticated;
revoke execute on function public._premium_partner_of(uuid) from public, anon, authenticated;
grant execute on function public._subscription_grants(text, timestamptz, text, text), public._premium_partner_of(uuid) to service_role;
-- _premium_of : droits inchangés (create or replace conserve les droits existants : service_role seulement)

-- Partage vu par la personne connectée (jamais pour quelqu'un d'autre)
create or replace function public.my_premium_share()
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  own as (
    select s.user_id from public.subscriptions s, me
    where s.user_id = me.id and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
  ),
  partner as (select public._premium_partner_of(me.id) as id from me where exists (select 1 from own)),
  giver as (
    select s.user_id as id from public.subscriptions s, me
    where s.user_id <> me.id and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and s.user_id in (
        select other.user_id from public.household_members m
        join public.household_members other on other.household_id = m.household_id and other.user_id <> m.user_id
        where m.user_id = me.id and m.role in ('owner','coparent') and other.role in ('owner','coparent'))
      and public._premium_partner_of(s.user_id) = me.id
    order by s.user_id limit 1
  )
  select jsonb_build_object(
    'shared_with', (select jsonb_build_object('user_id', p.id, 'display_name', pr.display_name)
                    from partner p left join public.profiles pr on pr.id = p.id where p.id is not null),
    'shared_by', (select jsonb_build_object('user_id', g.id, 'display_name', pr.display_name)
                  from giver g left join public.profiles pr on pr.id = g.id)
  )
  from me where me.id is not null;
$$;
revoke execute on function public.my_premium_share() from public, anon;
grant execute on function public.my_premium_share() to authenticated;

-- 5. Écriture réservée au serveur (en plus de la RLS sans politique d'écriture) --------------
revoke insert, update, delete, truncate on public.subscriptions from anon, authenticated;

-- 6. Export RGPD : nouvelles colonnes (réécriture ciblée de la définition actuelle) ----------
do $$
declare
  v_def text := pg_get_functiondef('public.export_my_data()'::regprocedure);
  v_old text := '''period_type'', s.period_type, ''expires_at'', s.expires_at, ''will_renew'', s.will_renew)';
  v_new text := '''period_type'', s.period_type, ''expires_at'', s.expires_at, ''will_renew'', s.will_renew, '
             || '''product_id'', s.product_id, ''started_at'', s.started_at, ''trial_ends_at'', s.trial_ends_at, '
             || '''price'', s.price, ''currency'', s.currency, ''cancel_reason'', s.cancel_reason, ''refunded_at'', s.refunded_at, '
             || '''billing_issue_at'', s.billing_issue_at, ''resumes_at'', s.resumes_at, ''environment'', s.environment)';
begin
  if position(v_old in v_def) = 0 then
    raise exception 'Migration abonnement v2 : rubrique « subscription » introuvable dans export_my_data';
  end if;
  execute replace(v_def, v_old, v_new);
end $$;

-- =====================================================================
-- Retour arrière (à exécuter à la main si nécessaire ; les colonnes ajoutées peuvent rester) :
--   -- Règle d'avant (partage illimité, échéance nulle = Premium sans fin) :
--   create or replace function public._premium_of(p_user uuid default auth.uid())
--   returns boolean language sql stable security definer set search_path = public as $$
--     select exists (
--       select 1 from public.subscriptions s
--       where s.status in ('trial','active','grace','cancelled')
--         and (s.expires_at is null or s.expires_at > now())
--         and (s.user_id = p_user or s.user_id in (
--           select owner.user_id from public.household_members me
--           join public.household_members owner on owner.household_id = me.household_id and owner.role = 'owner'
--           where me.user_id = p_user)));
--   $$;
--   drop function if exists public.my_premium_share();
--   drop function if exists public._premium_partner_of(uuid);
--   drop function if exists public._subscription_grants(text, timestamptz, text, text);
--   -- Avant de remettre les anciennes contraintes, convertir les nouveaux statuts / périodes :
--   update public.subscriptions set status = 'expired' where status in ('refunded','paused');
--   update public.subscriptions set period_type = 'monthly' where period_type = 'six_months';
--   alter table public.subscriptions drop constraint subscriptions_status_check;
--   alter table public.subscriptions add constraint subscriptions_status_check
--     check (status in ('none','trial','active','grace','cancelled','expired','billing_issue'));
--   alter table public.subscriptions drop constraint subscriptions_period_type_check;
--   alter table public.subscriptions add constraint subscriptions_period_type_check
--     check (period_type in ('monthly','annual','trial','lifetime'));
--   alter table public.subscriptions alter column entitlement set default 'premium';
--   -- export_my_data : réappliquer supabase/migrations/20261104000300_export_my_data_v19.sql
--   -- Colonnes (facultatif, PERTE des valeurs) :
--   -- alter table public.subscriptions drop column started_at, drop column trial_ends_at, drop column price,
--   --   drop column currency, drop column cancel_reason, drop column refunded_at, drop column billing_issue_at,
--   --   drop column resumes_at, drop column environment, drop column last_sync_at;
-- =====================================================================
