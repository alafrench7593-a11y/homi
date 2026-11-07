-- =====================================================================
-- Offres du 07/11/2026 — migration ADDITIVE (aucune table, colonne ni donnée supprimée)
--  1. Assistant IA à 5 €/mois (droit RevenueCat ASSISTANT_IA) : 250 questions à l'assistant en ligne par mois
--     (le Premium complet garde ses 300). Le mois offert est l'offre d'essai de la boutique.
--  2. 10 outils « à vie » à 1 € (un droit RevenueCat par outil). Mois gratuit : 30 jours après la création du
--     compte, et au plus tôt jusqu'au 07/12/2026 pour les comptes existants (personne n'est bloqué du jour au
--     lendemain). Sans achat après l'essai : les données saisies restent consultables et exportables ; seul
--     l'ajout est réservé. Le Premium complet inclut tous les outils. Un outil acheté par un parent sert au foyer.
--  3. Droits écrits par le SERVEUR uniquement (fonctions revenuecat-webhook / subscription-sync), lus par la
--     personne elle-même.
-- Retour arrière (à la main) :
--   drop trigger pma_protocols_tool on public.pma_protocols; (idem pour les 6 autres déclencheurs « _tool »)
--   drop function public._enforce_tool(); drop function public.my_access(); drop function public.has_tool(text);
--   drop function public._has_tool_of(text, uuid); drop function public._tool_trial_until(uuid);
--   drop function public._ai_plan_of(uuid); drop function public._grant_active(uuid, text);
--   _plan_limit_of : réappliquer la définition de 20261102000100_membership_oracles.sql
--   drop table public.paid_tools; drop table public.entitlement_grants;  (PERTE des droits copiés de RevenueCat,
--   qui restent dans RevenueCat et sont recopiés à la prochaine synchronisation)
-- =====================================================================

-- 1. Droits achetés (hors Premium, qui reste dans « subscriptions ») ------------------------------------------
create table if not exists public.entitlement_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null check (entitlement ~ '^[A-Z0-9_]{3,64}$'),
  product_id text check (char_length(product_id) <= 120),
  store text check (char_length(store) <= 40),
  active boolean not null default false,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement)
);
alter table public.entitlement_grants enable row level security;
drop policy if exists entitlement_grants_self on public.entitlement_grants;
create policy entitlement_grants_self on public.entitlement_grants for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete, truncate on public.entitlement_grants from anon, authenticated;

-- 2. Catalogue des outils payants (lecture pour tous ; modifié seulement par migration) --------------------------
create table if not exists public.paid_tools (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  entitlement text not null unique check (entitlement ~ '^TOOL_[A-Z0-9_]{2,40}$'),
  product_id text not null unique,
  position int not null default 0
);
alter table public.paid_tools enable row level security;
drop policy if exists paid_tools_read on public.paid_tools;
create policy paid_tools_read on public.paid_tools for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.paid_tools from anon, authenticated;
insert into public.paid_tools (key, entitlement, product_id, position) values
  ('pma_tracker', 'TOOL_PMA_TRACKER', 'aufildenous_tool_pma_tracker', 1),
  ('custody', 'TOOL_CUSTODY', 'aufildenous_tool_custody', 2),
  ('kid_routines', 'TOOL_KID_ROUTINES', 'aufildenous_tool_kid_routines', 3),
  ('bottle_scoops', 'TOOL_BOTTLE_SCOOPS', 'aufildenous_tool_bottle_scoops', 4),
  ('contraception_journal', 'TOOL_CONTRACEPTION_JOURNAL', 'aufildenous_tool_contraception_journal', 5),
  ('kid_steps', 'TOOL_KID_STEPS', 'aufildenous_tool_kid_steps', 6),
  ('cycle_kit', 'TOOL_CYCLE_KIT', 'aufildenous_tool_cycle_kit', 7),
  ('cycle_stats', 'TOOL_CYCLE_STATS', 'aufildenous_tool_cycle_stats', 8),
  ('meal_rankings', 'TOOL_MEAL_RANKINGS', 'aufildenous_tool_meal_rankings', 9),
  ('family_review', 'TOOL_FAMILY_REVIEW', 'aufildenous_tool_family_review', 10)
on conflict (key) do nothing;

-- 3. Règles internes (non appelables par l'application) --------------------------------------------------------
create or replace function public._grant_active(p_user uuid, p_entitlement text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.entitlement_grants g
    where g.user_id = p_user and g.entitlement = p_entitlement and g.active and (g.expires_at is null or g.expires_at > now()));
$$;

create or replace function public._ai_plan_of(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select public._grant_active(p_user, 'ASSISTANT_IA');
$$;

-- Fin du mois gratuit des outils : 30 jours après l'inscription, jamais avant le 07/12/2026
create or replace function public._tool_trial_until(p_user uuid)
returns timestamptz language sql stable security definer set search_path = public, auth as $$
  select greatest(coalesce((select created_at from auth.users where id = p_user), now()) + interval '30 days', timestamptz '2026-12-07 00:00:00+01');
$$;

-- Outil utilisable : outil gratuit, Premium, mois gratuit en cours, ou outil acheté par soi ou par un parent du foyer
create or replace function public._has_tool_of(p_tool text, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user is not null and (
    not exists (select 1 from public.paid_tools t where t.key = p_tool)
    or public._premium_of(p_user)
    or now() < public._tool_trial_until(p_user)
    or exists (
      select 1 from public.paid_tools t
      where t.key = p_tool and (
        public._grant_active(p_user, t.entitlement)
        or exists (select 1 from public.household_members me
                   join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
                   where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
                     and public._grant_active(other.user_id, t.entitlement)))));
$$;

revoke execute on function public._grant_active(uuid, text) from public, anon, authenticated;
revoke execute on function public._ai_plan_of(uuid) from public, anon, authenticated;
revoke execute on function public._tool_trial_until(uuid) from public, anon, authenticated;
revoke execute on function public._has_tool_of(text, uuid) from public, anon, authenticated;
grant execute on function public._grant_active(uuid, text), public._ai_plan_of(uuid), public._tool_trial_until(uuid), public._has_tool_of(text, uuid) to service_role;

-- 4. Quota de l'assistant : 250 questions avec l'offre Assistant IA (Premium inchangé) ----------------------------
create or replace function public._plan_limit_of(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case
    when public._premium_of(p_user) then premium_value
    when p_key = 'assistant_questions_per_month' and public._ai_plan_of(p_user) then greatest(free_value, 250)
    else free_value end
  from public.plan_limits where key = p_key;
$$;

-- 5. Lecture pour soi-même ---------------------------------------------------------------------------------------
create or replace function public.has_tool(p_tool text)
returns boolean language sql stable security definer set search_path = public as $$
  select public._has_tool_of(p_tool, auth.uid());
$$;
revoke execute on function public.has_tool(text) from public, anon;
grant execute on function public.has_tool(text) to authenticated;

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'premium', public._premium_of(auth.uid()),
    'ai', public._ai_plan_of(auth.uid()),
    'trial_until', public._tool_trial_until(auth.uid()),
    'tools', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'product_id', t.product_id,
        'owned', public._grant_active(auth.uid(), t.entitlement), 'allowed', public._has_tool_of(t.key, auth.uid())) order by t.position)
      from public.paid_tools t), '[]'::jsonb))
  where auth.uid() is not null;
$$;
revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- 6. Ajout réservé après l'essai (lecture, modification et suppression restent possibles) -----------------------
create or replace function public._enforce_tool() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public._has_tool_of(tg_argv[0], auth.uid()) then
    raise exception 'Fonction Premium : outil à débloquer (%)', tg_argv[0] using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
revoke execute on function public._enforce_tool() from public, anon, authenticated;

drop trigger if exists pma_protocols_tool on public.pma_protocols;
create trigger pma_protocols_tool before insert on public.pma_protocols for each row execute function public._enforce_tool('pma_tracker');
drop trigger if exists pma_meds_tool on public.pma_meds;
create trigger pma_meds_tool before insert on public.pma_meds for each row execute function public._enforce_tool('pma_tracker');
drop trigger if exists pma_logs_tool on public.pma_logs;
create trigger pma_logs_tool before insert on public.pma_logs for each row execute function public._enforce_tool('pma_tracker');
drop trigger if exists custody_plans_tool on public.custody_plans;
create trigger custody_plans_tool before insert on public.custody_plans for each row execute function public._enforce_tool('custody');
drop trigger if exists custody_exceptions_tool on public.custody_exceptions;
create trigger custody_exceptions_tool before insert on public.custody_exceptions for each row execute function public._enforce_tool('custody');
drop trigger if exists kid_routines_tool on public.kid_routines;
create trigger kid_routines_tool before insert on public.kid_routines for each row execute function public._enforce_tool('kid_routines');
drop trigger if exists kid_routine_checks_tool on public.kid_routine_checks;
create trigger kid_routine_checks_tool before insert on public.kid_routine_checks for each row execute function public._enforce_tool('kid_routines');

-- 7. Export RGPD : les droits achetés font partie des données de la personne ------------------------------------
alter function public.export_my_data() rename to _export_my_data_v21;
revoke execute on function public._export_my_data_v21() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v21() || jsonb_build_object(
    'entitlement_grants', (select coalesce(jsonb_agg(to_jsonb(g) order by g.entitlement), '[]') from public.entitlement_grants g where g.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
