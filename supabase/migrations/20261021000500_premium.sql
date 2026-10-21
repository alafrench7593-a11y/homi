-- =====================================================================
-- Offre Premium (21 octobre 2026) : quotas mensuels par fonction, fonctions réservées vérifiées côté serveur,
-- partage coparent par profil, contenus premium protégés.
-- Principes (toujours gratuits) : urgences, ressources post-partum, rappels officiels de produits, suppression du compte,
-- export légal, consentements, signalement, LECTURE de toutes les données déjà créées (même après la fin de l'abonnement),
-- rappels de médicaments prescrits et de biberon.
-- =====================================================================

-- 1. Nouvelles limites (gratuit / Premium)
insert into public.plan_limits (key, free_value, premium_value, description) values
  ('voice_entries_per_month', 3, 1000, 'Saisies vocales ou en une phrase par mois'),
  ('summary_exports_per_month', 1, 200, 'Résumés exportés en PDF ou partagés par mois'),
  ('custom_reminders_count', 5, 300, 'Rappels personnels actifs (hors médicaments prescrits, biberons et vaccins)')
on conflict (key) do update set free_value = excluded.free_value, premium_value = excluded.premium_value, description = excluded.description;

-- 2. Quotas mensuels génériques (consommés côté serveur, jamais par l'application seule)
create table if not exists public.feature_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature ~ '^[a-z_]+_per_month$'),
  month date not null,
  used int not null default 0 check (used >= 0),
  primary key (user_id, feature, month)
);
alter table public.feature_usage enable row level security;
drop policy if exists feature_usage_self on public.feature_usage;
create policy feature_usage_self on public.feature_usage for select to authenticated using (user_id = auth.uid());

create or replace function public.consume_feature_quota(p_key text)
returns table(allowed boolean, used int, quota int)
language plpgsql security definer set search_path = public as $$
declare v_month date := date_trunc('month', now())::date; v_quota int; v_used int;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_key not in ('voice_entries_per_month', 'summary_exports_per_month') then raise exception 'Quota inconnu' using errcode = '22023'; end if;
  v_quota := public.plan_limit(p_key, auth.uid());
  insert into public.feature_usage (user_id, feature, month, used) values (auth.uid(), p_key, v_month, 0) on conflict do nothing;
  update public.feature_usage f set used = f.used + 1
   where f.user_id = auth.uid() and f.feature = p_key and f.month = v_month and f.used < v_quota
   returning f.used into v_used;
  if v_used is null then
    select f.used into v_used from public.feature_usage f where f.user_id = auth.uid() and f.feature = p_key and f.month = v_month;
    return query select false, v_used, v_quota;
  else
    return query select true, v_used, v_quota;
  end if;
end $$;
revoke execute on function public.consume_feature_quota(text) from public, anon;
grant execute on function public.consume_feature_quota(text) to authenticated;

create or replace function public.feature_quota_status(p_key text)
returns table(used int, quota int, remaining int)
language sql stable security definer set search_path = public as $$
  select coalesce((select f.used from public.feature_usage f where f.user_id = auth.uid() and f.feature = p_key and f.month = date_trunc('month', now())::date), 0),
         public.plan_limit(p_key, auth.uid()),
         greatest(public.plan_limit(p_key, auth.uid()) - coalesce((select f.used from public.feature_usage f where f.user_id = auth.uid() and f.feature = p_key and f.month = date_trunc('month', now())::date), 0), 0);
$$;
revoke execute on function public.feature_quota_status(text) from public, anon;
grant execute on function public.feature_quota_status(text) to authenticated;

-- 3. Fonctions réservées : vérification serveur (l'interface présente d'abord un aperçu, mais c'est ici que la règle s'applique)
create or replace function public.require_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_premium(auth.uid()) then
    raise exception 'Fonction Premium (%)', tg_argv[0] using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;

-- Menus hebdomadaires (la bibliothèque, les favoris et la liste de courses d'une recette restent gratuits)
drop trigger if exists meal_plans_premium on public.meal_plans;
create trigger meal_plans_premium before insert on public.meal_plans for each row execute function public.require_premium('weekly_menu');

-- Invitation d'un coparent (la révocation, le retrait d'un membre et le départ du foyer restent toujours possibles)
drop trigger if exists invitations_premium on public.household_invitations;
create trigger invitations_premium before insert on public.household_invitations for each row execute function public.require_premium('coparent_invite');

-- Suivi de la diversification : ajouter un aliment est Premium ; les aliments déjà notés restent lisibles et modifiables
drop trigger if exists food_introductions_premium on public.food_introductions;
create trigger food_introductions_premium before insert on public.food_introductions for each row execute function public.require_premium('diversification');

-- Réponses de l'assistant enregistrées (relire celles déjà enregistrées reste gratuit)
create or replace function public.assistant_save_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.saved and not coalesce(old.saved, false) and not public.has_premium(auth.uid()) then
    raise exception 'Fonction Premium (assistant_saved)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists assistant_save_premium on public.assistant_messages;
create trigger assistant_save_premium before update of saved on public.assistant_messages for each row execute function public.assistant_save_premium();

-- Rappels personnels : quota (jamais pour un médicament prescrit, un biberon, un vaccin ou un rendez-vous)
create or replace function public.enforce_custom_reminders()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int; v_limit int;
begin
  if new.category <> 'custom' or new.treatment_id is not null then return new; end if;
  v_limit := public.plan_limit('custom_reminders_count', new.user_id);
  select count(*) into v_count from public.reminders where user_id = new.user_id and category = 'custom' and treatment_id is null and enabled;
  if v_count >= v_limit then
    raise exception 'Limite de la version gratuite atteinte (custom_reminders_count)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists reminders_custom_quota on public.reminders;
create trigger reminders_custom_quota before insert on public.reminders for each row execute function public.enforce_custom_reminders();

-- 4. Routine du coucher personnalisable (Premium), par enfant
create table if not exists public.bedtime_routines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null unique references public.children(id) on delete cascade,
  bedtime time,
  steps text[] not null default '{}' check (cardinality(steps) <= 12),
  remind boolean not null default false,
  updated_at timestamptz not null default now()
);
select public._apply_household_policies('bedtime_routines', 'daily');
drop trigger if exists bedtime_routines_premium on public.bedtime_routines;
create trigger bedtime_routines_premium before insert on public.bedtime_routines for each row execute function public.require_premium('bedtime_routine');

-- 5. Partage coparent PAR PROFIL : le propriétaire choisit les enfants (et la grossesse) accessibles à chaque membre.
--    child_scope NULL = tous les enfants (comportement d'avant) ; le propriétaire voit toujours tout.
alter table public.household_members add column if not exists child_scope uuid[];
alter table public.household_members add column if not exists pregnancy_access boolean not null default true;
alter table public.household_invitations add column if not exists child_scope uuid[];
alter table public.household_invitations add column if not exists pregnancy_access boolean not null default true;

create or replace function public.can_access_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    join public.household_members m on m.household_id = c.household_id and m.user_id = auth.uid()
    where c.id = p_child and (m.role = 'owner' or m.child_scope is null or p_child = any(m.child_scope))
  );
$$;
create or replace function public.can_access_pregnancy(p_pregnancy uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pregnancies p
    join public.household_members m on m.household_id = p.household_id and m.user_id = auth.uid()
    where p.id = p_pregnancy and (m.role = 'owner' or m.pregnancy_access or p.carrier_user_id = auth.uid())
  );
$$;
revoke execute on function public.can_access_child(uuid), public.can_access_pregnancy(uuid) from public, anon;
grant execute on function public.can_access_child(uuid), public.can_access_pregnancy(uuid) to authenticated;

-- Politiques RESTRICTIVES ajoutées à toutes les tables du foyer qui portent un enfant ou une grossesse :
-- elles ne retirent l'accès qu'à un membre limité par le propriétaire ; rien ne change pour les autres.
do $$
declare r record;
begin
  for r in
    select c.table_name, c.column_name from information_schema.columns c
    join information_schema.columns h on h.table_schema = c.table_schema and h.table_name = c.table_name and h.column_name = 'household_id'
    join pg_class k on k.relname = c.table_name and k.relnamespace = 'public'::regnamespace and k.relkind = 'r' and k.relrowsecurity
    where c.table_schema = 'public' and c.column_name in ('child_id', 'pregnancy_id')
  loop
    execute format('drop policy if exists %I on public.%I', r.table_name || '_' || r.column_name || '_scope', r.table_name);
    execute format('create policy %I on public.%I as restrictive for all to authenticated using (%I is null or %s) with check (%I is null or %s)',
      r.table_name || '_' || r.column_name || '_scope', r.table_name, r.column_name,
      case when r.column_name = 'child_id' then format('public.can_access_child(%I)', r.column_name) else format('public.can_access_pregnancy(%I)', r.column_name) end,
      r.column_name,
      case when r.column_name = 'child_id' then format('public.can_access_child(%I)', r.column_name) else format('public.can_access_pregnancy(%I)', r.column_name) end);
  end loop;
end $$;
drop policy if exists children_scope on public.children;
create policy children_scope on public.children as restrictive for all to authenticated using (public.can_access_child(id)) with check (true);
drop policy if exists pregnancies_scope on public.pregnancies;
create policy pregnancies_scope on public.pregnancies as restrictive for all to authenticated using (public.can_access_pregnancy(id)) with check (true);

-- Choix des profils par le propriétaire (immédiat ; retirer un enfant coupe l'accès à ses données à la seconde)
create or replace function public.set_member_scope(p_household uuid, p_user uuid, p_child_scope uuid[], p_pregnancy_access boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_owner(p_household) then raise exception 'Seul le propriétaire du foyer peut choisir les profils partagés' using errcode = '42501'; end if;
  if p_child_scope is not null and exists (select 1 from unnest(p_child_scope) x where x not in (select id from public.children where household_id = p_household)) then
    raise exception 'Profil inconnu dans ce foyer' using errcode = '22023';
  end if;
  update public.household_members set child_scope = p_child_scope, pregnancy_access = coalesce(p_pregnancy_access, true)
   where household_id = p_household and user_id = p_user and role <> 'owner';
end $$;
revoke execute on function public.set_member_scope(uuid, uuid, uuid[], boolean) from public, anon;
grant execute on function public.set_member_scope(uuid, uuid, uuid[], boolean) to authenticated;

-- Invitation avec choix des profils (remplace la version précédente : mêmes paramètres + profils)
drop function if exists public.create_household_invitation(uuid, text, text[], text[], text);
create or replace function public.create_household_invitation(
  p_household uuid, p_role text default 'coparent',
  p_can_view text[] default array['daily','health','documents','pregnancy','lists','names','profile'],
  p_can_edit text[] default array['daily','lists','names'],
  p_email text default null,
  p_child_scope uuid[] default null,
  p_pregnancy_access boolean default true)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_token text;
begin
  if not public.is_household_owner(p_household) then
    raise exception 'Seul le propriétaire du foyer peut inviter' using errcode = '42501';
  end if;
  if p_child_scope is not null and exists (select 1 from unnest(p_child_scope) x where x not in (select id from public.children where household_id = p_household)) then
    raise exception 'Profil inconnu dans ce foyer' using errcode = '22023';
  end if;
  v_token := encode(gen_random_bytes(18), 'hex');
  insert into public.household_invitations(household_id, invited_by, email, token_hash, role, can_view, can_edit, child_scope, pregnancy_access)
  values (p_household, auth.uid(), p_email, encode(digest(v_token, 'sha256'), 'hex'), p_role, p_can_view, p_can_edit, p_child_scope, coalesce(p_pregnancy_access, true));
  return v_token;
end $$;
revoke execute on function public.create_household_invitation(uuid, text, text[], text[], text, uuid[], boolean) from public, anon;
grant execute on function public.create_household_invitation(uuid, text, text[], text[], text, uuid[], boolean) to authenticated;

create or replace function public.accept_household_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_inv public.household_invitations; v_h uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into v_inv from public.household_invitations
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and accepted_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then raise exception 'Invitation invalide ou expirée' using errcode = 'P0002'; end if;
  insert into public.household_members(household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit, v_inv.child_scope, v_inv.pregnancy_access)
  on conflict (household_id, user_id) do update
    set can_view = excluded.can_view, can_edit = excluded.can_edit, child_scope = excluded.child_scope, pregnancy_access = excluded.pregnancy_access;
  update public.household_invitations set accepted_at = now() where id = v_inv.id;

  -- Le foyer « Ma famille » créé à l'inscription devient inutile s'il est vide
  for v_h in
    select h.id from public.households h
      join public.household_members m on m.household_id = h.id and m.user_id = auth.uid() and m.role = 'owner'
     where h.auto_created and h.id <> v_inv.household_id
     for update of h
  loop
    if public.household_is_empty_auto(v_h, auth.uid()) then
      delete from public.households where id = v_h;
    end if;
  end loop;

  return v_inv.household_id;
end $$;

-- 6. Contenus premium (articles, vidéos) : le texte d'un contenu premium n'est lisible qu'avec l'abonnement.
--    Un contenu de sécurité n'est jamais premium (contrainte existante) ; un aperçu (titre, résumé) reste visible.
drop policy if exists articles_read on public.articles;
create policy articles_read on public.articles for select to anon, authenticated
  using ((status = 'published' and (not is_premium or is_safety_critical or public.has_premium(auth.uid()))) or public.has_role('editor'));
create or replace function public.premium_article_teasers()
returns table(id uuid, slug text, title text, summary text, category_id uuid, journeys text[], is_premium boolean)
language sql stable security definer set search_path = public as $$
  select a.id, a.slug, a.title, a.summary, a.category_id, a.journeys::text[], a.is_premium from public.articles a
   where a.status = 'published' and a.is_premium and not a.is_safety_critical;
$$;
grant execute on function public.premium_article_teasers() to anon, authenticated;
