-- =====================================================================
-- Premium Famille (13/11/2026) — deux comptes Premium reliés à un espace familial.
--
-- Décision du propriétaire : Premium Individuel 10,99 €/mois (produits existants aufildenous_premium_*), Premium Famille
-- 15,99 €/mois (produit à créer : aufildenous_family_monthly, droit RevenueCat AU_FIL_DE_NOUS_FAMILLE). Les prix ne sont
-- PAS stockés ici : ils viennent de la boutique. Aucune formule Famille 6 mois / 12 mois n'existe à ce jour.
--
-- 1. Reconnaissance de la formule Famille (_is_family_plan) : droit 'AU_FIL_DE_NOUS_FAMILLE' dans la colonne
--    subscriptions.entitlement (écrite par le webhook RevenueCat) OU identifiant de produit commençant par
--    'aufildenous_family' (Google Play : « abonnement:offre-de-base » → partie avant « : »).
-- 2. Décision du propriétaire du 13/11/2026 (« enlève premium partagé avec quelqu'un ») : le Premium INDIVIDUEL n'est
--    plus JAMAIS partagé. Avant (20261105000100_subscription_v2.sql), tout Premium actif donnait aussi le Premium à UN
--    co-parent. Seul le Premium Famille donne désormais le Premium à un second compte.
--    Transition : l'application n'est pas publiée (TestFlight seulement). À l'application de cette migration, le
--    partenaire d'un abonné INDIVIDUEL existant perd immédiatement le Premium partagé : ses données restent intactes et
--    consultables (verrou Premium strict : lecture, export et suppression toujours libres), seules les nouvelles saisies
--    réservées au Premium lui sont refusées tant qu'il n'a pas son propre Premium ou un Premium Famille partagé.
--    Aucune ligne `subscriptions` n'est modifiée ; aucune donnée supprimée.
-- 3. _premium_of : le titulaire garde toujours son Premium ; le partenaire (UN seul adulte, choisi par la règle
--    déterministe existante _premium_partner_of : co-parent arrivé le premier, jamais un accompagnant) le reçoit
--    UNIQUEMENT si la formule est Famille. Expiration, résiliation,
--    remboursement, pause : mêmes règles qu'avant (_subscription_grants). Changement de formule : la ligne
--    `subscriptions` change de produit, le partage suit immédiatement. Partenaire retiré ou parti : plus rien,
--    immédiatement (aucune donnée supprimée).
-- 4. my_premium_share() : ajoute la formule ('family' / 'individual') et, pour le titulaire
--    d'un Premium Individuel non partagé, le partenaire qui EN PROFITERAIT avec Premium Famille (rôle seulement).
-- 5. renounce_household_access(foyer, domaines) : un membre (hors propriétaire) peut RETIRER lui-même des domaines de
--    ses propres droits (voir / modifier). Jamais en ajouter. « Chacun peut retirer ses propres autorisations. »
-- 6. Écritures : `subscriptions` reste en écriture réservée au service_role (aucune politique d'écriture, droits
--    retirés à anon / authenticated depuis 20261105000100).
--
-- Aucune table, colonne ou donnée supprimée. Aucun prix écrit. Jamais appliquée en production par l'agent.
--
-- Retour arrière (remet le partage du Premium Individuel avec UN co-parent) :
--   ré-appliquer les définitions de _premium_of et my_premium_share de 20261105000100_subscription_v2.sql,
--   puis : drop function public.renounce_household_access(uuid, text[]); drop function public._is_family_plan(text, text);
-- =====================================================================

-- 1. Formule Famille ---------------------------------------------------------------------------------------------
create or replace function public._is_family_plan(p_entitlement text, p_product text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(p_entitlement, '') = 'AU_FIL_DE_NOUS_FAMILLE'
      or split_part(lower(coalesce(p_product, '')), ':', 1) like 'aufildenous\_family%';
$$;
revoke execute on function public._is_family_plan(text, text) from public, anon, authenticated;
grant execute on function public._is_family_plan(text, text) to service_role;

-- 3. Droits Premium ----------------------------------------------------------------------------------------------
create or replace function public._premium_of(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and (
        s.user_id = p_user
        or (
          public._is_family_plan(s.entitlement, s.product_id)
          and s.user_id in (
            select other.user_id from public.household_members me
            join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
            where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
          )
          and public._premium_partner_of(s.user_id) = p_user
        )
      )
  );
$$;
-- _premium_of : droits inchangés (create or replace conserve les droits : service_role seulement)

-- 4. Partage vu par la personne connectée ------------------------------------------------------------------------
create or replace function public.my_premium_share()
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  own as (
    select s.user_id, public._is_family_plan(s.entitlement, s.product_id) as family from public.subscriptions s, me
    where s.user_id = me.id and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
  ),
  candidate as (select public._premium_partner_of(me.id) as id from me where exists (select 1 from own)),
  partner as (
    select c.id from candidate c
    where c.id is not null and (select family from own)
  ),
  giver as (
    select s.user_id as id, public._is_family_plan(s.entitlement, s.product_id) as family from public.subscriptions s, me
    where s.user_id <> me.id and public._subscription_grants(s.status, s.expires_at, s.store, s.period_type)
      and public._is_family_plan(s.entitlement, s.product_id)
      and s.user_id in (
        select other.user_id from public.household_members m
        join public.household_members other on other.household_id = m.household_id and other.user_id <> m.user_id
        where m.user_id = me.id and m.role in ('owner','coparent') and other.role in ('owner','coparent'))
      and public._premium_partner_of(s.user_id) = me.id
    order by s.user_id limit 1
  )
  select jsonb_build_object(
    'plan', (select case when o.family then 'family' else 'individual' end from own o),
    'shared_with', (select jsonb_build_object('user_id', p.id, 'display_name', pr.display_name)
                    from partner p left join public.profiles pr on pr.id = p.id),
    -- Titulaire d'un Premium Individuel non partagé : le partenaire qui en profiterait avec Premium Famille (rôle seulement)
    'family_candidate', (select jsonb_build_object('user_id', c.id, 'role', hm.role)
                         from candidate c
                         join lateral (select m.role from public.household_members m where m.user_id = c.id
                                        and m.household_id in (select household_id from public.household_members where user_id = (select id from me))
                                        order by m.joined_at limit 1) hm on true
                         where c.id is not null and not exists (select 1 from partner)),
    'shared_by', (select jsonb_build_object('user_id', g.id, 'display_name', pr.display_name, 'plan', case when g.family then 'family' else 'individual' end)
                  from giver g left join public.profiles pr on pr.id = g.id)
  )
  from me where me.id is not null;
$$;
revoke execute on function public.my_premium_share() from public, anon;
grant execute on function public.my_premium_share() to authenticated;

-- 5. Retirer soi-même ses propres autorisations ------------------------------------------------------------------
create or replace function public.renounce_household_access(p_household uuid, p_domains text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_domains is null or cardinality(p_domains) = 0 then return; end if;
  if exists (select 1 from unnest(p_domains) d where d not in ('daily','health','documents','pregnancy','lists','names','profile')) then
    raise exception 'Domaine inconnu' using errcode = '22023';
  end if;
  -- Ne peut que RETIRER : les nouveaux tableaux sont des sous-ensembles des anciens
  update public.household_members
     set can_view = array(select x from unnest(can_view) x where x <> all (p_domains)),
         can_edit = array(select x from unnest(can_edit) x where x <> all (p_domains))
   where household_id = p_household and user_id = auth.uid() and role <> 'owner';
  if not found then raise exception 'Réservé aux membres invités du foyer' using errcode = '42501'; end if;
end $$;
revoke execute on function public.renounce_household_access(uuid, text[]) from public, anon;
grant execute on function public.renounce_household_access(uuid, text[]) to authenticated;
