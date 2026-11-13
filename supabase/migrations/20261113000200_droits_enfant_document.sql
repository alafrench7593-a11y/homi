-- =====================================================================
-- Fondations du foyer (13/11/2026) — B. Droits par enfant et par document
--
-- Existant (20261021000500_premium.sql) : household_members.child_scope (uuid[]) + politiques RESTRICTIVES
-- « <table>_child_id_scope » sur les tables du foyer qui portent child_id. child_scope NULL voulait dire
-- « tous les enfants » pour TOUS les rôles, y compris la nounou.
--
-- Nouvelles règles (appliquées par la RLS, jamais par l'application seule) :
--  1. Enfants autorisés : propriétaire = tous ; co-parent sans choix (NULL) = tous ; NOUNOU sans choix (NULL)
--     = AUCUN enfant tant que la famille n'a pas choisi. Une seule règle (_member_child_allowed) sert
--     can_access_child() et _row_child_access(). Les nounous et invitations déjà présentes sont
--     migrées SANS perte d'accès : leur périmètre devient la liste explicite des enfants actuels du foyer.
--  2. Politiques de périmètre (re)posées sur TOUTES les tables du foyer qui portent child_id / pregnancy_id
--     (7 tables créées après le 21/10 n'en avaient pas : child_steps, child_vaccine_postponements,
--     custody_plans, family_papers, food_tastings, house_notes, kid_routines) et sur les tables rattachées
--     à un enfant par leur parent (treatment_logs, kid_routine_checks, custody_exceptions).
--  3. Une nounou voit la fiche des enfants qui lui sont confiés même sans le domaine « profile »
--     (prénom, âge, allergies déclarées, habitudes : informations de sécurité), et child_safety_card()
--     lui donne les consignes critiques (allergies, traitements, contacts, apaisement) de ces enfants,
--     sans ouvrir tout le domaine « santé ».
--  4. Documents : partage document par document (table document_shares). Pour une nounou, un document
--     non partagé explicitement est INVISIBLE (même avec le domaine « documents ») ; un document partagé
--     est lisible même sans ce domaine. Seule la personne qui l'a déposé, ou la propriétaire du foyer
--     pour un document non privé, peut le partager. Fichier (storage) : même règle (la politique de
--     lecture du stockage relit public.documents sous RLS). Les papiers de la famille (family_papers)
--     restent invisibles pour une nounou.
--  5. Révocation : retirer un membre (delete household_members) coupe tout à la seconde (plus de ligne =
--     plus aucun droit) et efface ses partages de documents.
--
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- 1. Une seule règle pour l'accès aux enfants -----------------------------------------------------
create or replace function public._member_child_allowed(p_role text, p_scope uuid[], p_child uuid)
returns boolean language sql immutable as $$
  select case
    when p_role = 'owner' then true
    when p_scope is null then p_role <> 'caregiver'   -- nounou : aucun enfant tant que rien n'est choisi
    else p_child = any(p_scope) end;
$$;

create or replace function public.can_access_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    join public.household_members m on m.household_id = c.household_id and m.user_id = auth.uid()
    where c.id = p_child and public._member_child_allowed(m.role, m.child_scope, p_child)
  );
$$;

create or replace function public._row_child_access(p_household uuid, p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid()
      and public._member_child_allowed(m.role, m.child_scope, p_child)
  );
$$;

-- Migration des nounous existantes : aucun accès perdu (liste explicite des enfants actuels)
update public.household_members m
   set child_scope = coalesce((select array_agg(c.id order by c.created_at) from public.children c where c.household_id = m.household_id), '{}')
 where m.role = 'caregiver' and m.child_scope is null;
update public.household_invitations i
   set child_scope = coalesce((select array_agg(c.id order by c.created_at) from public.children c where c.household_id = i.household_id), '{}')
 where i.role = 'caregiver' and i.child_scope is null and i.accepted_at is null and i.revoked_at is null;

-- 2. Politiques de périmètre sur toutes les tables portant un enfant ou une grossesse ---------------
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

-- Tables rattachées à un enfant par leur ligne parente (lecture du parent sans RLS : security definer)
create or replace function public._child_scope_via(p_parent text, p_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_child uuid;
begin
  if p_id is null then return true; end if;
  if p_parent = 'child_treatments' then select child_id into v_child from public.child_treatments where id = p_id;
  elsif p_parent = 'kid_routines' then select child_id into v_child from public.kid_routines where id = p_id;
  elsif p_parent = 'custody_plans' then select child_id into v_child from public.custody_plans where id = p_id;
  else return false; end if;
  return v_child is null or public.can_access_child(v_child);
end $$;
revoke execute on function public._child_scope_via(text, uuid) from public, anon;
grant execute on function public._child_scope_via(text, uuid) to authenticated;

drop policy if exists treatment_logs_child_scope on public.treatment_logs;
create policy treatment_logs_child_scope on public.treatment_logs as restrictive for all to authenticated
  using (public._child_scope_via('child_treatments', treatment_id)) with check (public._child_scope_via('child_treatments', treatment_id));
drop policy if exists kid_routine_checks_child_scope on public.kid_routine_checks;
create policy kid_routine_checks_child_scope on public.kid_routine_checks as restrictive for all to authenticated
  using (public._child_scope_via('kid_routines', routine_id)) with check (public._child_scope_via('kid_routines', routine_id));
drop policy if exists custody_exceptions_child_scope on public.custody_exceptions;
create policy custody_exceptions_child_scope on public.custody_exceptions as restrictive for all to authenticated
  using (public._child_scope_via('custody_plans', plan_id)) with check (public._child_scope_via('custody_plans', plan_id));

-- 3. Nounou : fiche des enfants confiés et consignes de sécurité ----------------------------------
drop policy if exists children_caregiver_sel on public.children;
create policy children_caregiver_sel on public.children for select to authenticated
  using (public._is_caregiver_in(household_id));   -- + politique restrictive children_scope (enfants confiés seulement)

-- Consignes critiques d'un enfant pour toute personne autorisée sur cet enfant (y compris une nounou
-- sans le domaine « santé ») : allergies, traitements, contacts, façons d'apaiser. Rien d'autre.
create or replace function public.child_safety_card(p_child uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if auth.uid() is null or not public.can_access_child(p_child) then
    raise exception 'Accès refusé à ce profil' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'child_id', c.id, 'first_name', c.first_name, 'birth_date', c.birth_date,
    'allergies_declared', c.allergies_declared, 'habits', c.habits,
    'items', coalesce((select jsonb_agg(jsonb_build_object('kind', i.kind, 'label', i.label, 'details', i.details) order by i.kind, i.created_at)
                       from public.child_health_items i where i.child_id = c.id and i.kind in ('allergy', 'treatment', 'contact', 'soothe')), '[]'::jsonb),
    'treatments', coalesce((select jsonb_agg(jsonb_build_object('name', t.name) order by t.created_at)
                            from public.child_treatments t where t.child_id = c.id and coalesce(t.active, true)), '[]'::jsonb))
    into v
  from public.children c where c.id = p_child;
  return v;
end $$;
revoke execute on function public.child_safety_card(uuid) from public, anon;
grant execute on function public.child_safety_card(uuid) to authenticated;

-- 4. Partage document par document ----------------------------------------------------------------
create table if not exists public.document_shares (
  document_id uuid not null references public.documents(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
);
create index if not exists document_shares_user_idx on public.document_shares(user_id, household_id);
create index if not exists document_shares_household_idx on public.document_shares(household_id);
create index if not exists document_shares_shared_by_idx on public.document_shares(shared_by);

-- Partage possible : déposant·e du document, ou propriétaire du foyer si le document n'est pas privé
create or replace function public._can_share_document(p_document uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.documents d
    where d.id = p_document
      and (d.uploaded_by = auth.uid() or (not d.private_to_uploader and public.is_household_owner(d.household_id))));
$$;
create or replace function public._document_shared_with_me(p_document uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.document_shares s
    join public.household_members m on m.household_id = s.household_id and m.user_id = s.user_id
    where s.document_id = p_document and s.user_id = auth.uid());
$$;
-- Visibilité d'un document pour la personne connectée (règle restrictive) :
-- membre non-nounou (le reste des règles s'applique), déposant·e, ou partage explicite.
create or replace function public._document_visible(p_household uuid, p_document uuid, p_uploaded_by uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_uploaded_by = auth.uid()
    or exists (select 1 from public.household_members m where m.household_id = p_household and m.user_id = auth.uid() and m.role <> 'caregiver')
    or public._document_shared_with_me(p_document));
$$;
revoke execute on function public._can_share_document(uuid), public._document_shared_with_me(uuid), public._document_visible(uuid, uuid, uuid) from public, anon;
grant execute on function public._can_share_document(uuid), public._document_shared_with_me(uuid), public._document_visible(uuid, uuid, uuid) to authenticated;

-- Le foyer du partage est TOUJOURS celui du document (jamais fourni par l'appareil)
create or replace function public.document_shares_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select d.household_id into new.household_id from public.documents d where d.id = new.document_id;
  if new.household_id is null then raise exception 'Document inconnu' using errcode = '23503'; end if;
  if not exists (select 1 from public.household_members m where m.household_id = new.household_id and m.user_id = new.user_id) then
    raise exception 'Cette personne ne fait pas partie du foyer' using errcode = '42501';
  end if;
  if auth.uid() is not null then new.shared_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists document_shares_guard on public.document_shares;
create trigger document_shares_guard before insert or update on public.document_shares
  for each row execute function public.document_shares_guard();

alter table public.document_shares enable row level security;
drop policy if exists document_shares_sel on public.document_shares;
create policy document_shares_sel on public.document_shares for select to authenticated
  using (user_id = auth.uid() or (public.can_access_household(household_id, 'documents', false) and not public._is_caregiver_in(household_id)));
drop policy if exists document_shares_ins on public.document_shares;
create policy document_shares_ins on public.document_shares for insert to authenticated
  with check (public._can_share_document(document_id));
drop policy if exists document_shares_del on public.document_shares;
create policy document_shares_del on public.document_shares for delete to authenticated
  using (user_id = auth.uid() or public._can_share_document(document_id));
revoke update, truncate on public.document_shares from anon, authenticated;

drop policy if exists documents_shared_sel on public.documents;
create policy documents_shared_sel on public.documents for select to authenticated
  using (public._document_shared_with_me(id));
drop policy if exists documents_caregiver_share on public.documents;
create policy documents_caregiver_share on public.documents as restrictive for all to authenticated
  using (public._document_visible(household_id, id, uploaded_by)) with check (public._document_visible(household_id, id, uploaded_by));

drop policy if exists family_papers_not_caregiver on public.family_papers;
create policy family_papers_not_caregiver on public.family_papers as restrictive for all to authenticated
  using (not public._is_caregiver_in(household_id)) with check (not public._is_caregiver_in(household_id));

-- 5. Révocation : départ ou retrait d'un membre → ses partages disparaissent aussi ---------------------
create or replace function public.household_members_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.document_shares where household_id = old.household_id and user_id = old.user_id;
  return old;
end $$;
drop trigger if exists household_members_cleanup on public.household_members;
create trigger household_members_cleanup after delete on public.household_members
  for each row execute function public.household_members_after_delete();

-- Changement de rôle (co-parent ↔ nounou) : le périmètre d'enfants se recalcule explicitement
-- (un co-parent sans choix « tous les enfants » devenu nounou ne garde pas tout par accident).
create or replace function public.household_members_role_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'caregiver' and old.role <> 'caregiver' and new.child_scope is null then
    new.child_scope := '{}';
  end if;
  return new;
end $$;
drop trigger if exists household_members_role_guard on public.household_members;
create trigger household_members_role_guard before update of role on public.household_members
  for each row execute function public.household_members_role_guard();

-- =====================================================================
-- Retour arrière (à la main) :
--   drop policy documents_caregiver_share on public.documents; drop policy documents_shared_sel on public.documents;
--   drop policy family_papers_not_caregiver on public.family_papers; drop policy children_caregiver_sel on public.children;
--   drop policy treatment_logs_child_scope on public.treatment_logs; drop policy kid_routine_checks_child_scope on public.kid_routine_checks;
--   drop policy custody_exceptions_child_scope on public.custody_exceptions;
--   drop trigger household_members_cleanup on public.household_members; drop trigger household_members_role_guard on public.household_members;
--   drop table public.document_shares;
--   puis ré-appliquer can_access_child (20261021000500_premium.sql) et _row_child_access (20261104000600).
--   Les périmètres explicites posés sur les nounous existantes peuvent rester (même accès qu'avant).
-- =====================================================================
