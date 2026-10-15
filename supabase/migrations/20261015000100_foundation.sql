-- =====================================================================
-- Toi & Moi — 0001 Fondations : profils, rôles, consentements, foyers
-- Principe : RLS activée sur TOUTES les tables. Aucune donnée privée
-- n'est lisible par un autre utilisateur sans autorisation explicite.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profils (1 ligne par compte)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  journeys text[] not null default '{}'
    check (journeys <@ array['avoid','ttc','pregnant','newborn','child','family']::text[]),
  interests text[] not null default '{}',
  locale text not null default 'fr' check (locale in ('fr','en')),
  timezone text not null default 'Europe/Paris',
  onboarding_completed boolean not null default false,
  home_shortcuts text[] not null default array['bottle','diaper','sleep','question']::text[],
  hide_weight_module boolean not null default false,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.privacy_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Rôles applicatifs (administration / modération)
-- ---------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','moderator','editor')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(p_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and (role = p_role or role = 'admin')
  );
$$;

-- ---------------------------------------------------------------------
-- Consentements (RGPD) et paramètres de confidentialité
-- ---------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in
    ('terms','health_data','analytics','crash_reports','ai_assistant','document_reading','marketing')),
  granted boolean not null,
  version text not null default '2026-10',
  created_at timestamptz not null default now()
);
create index consents_user_idx on public.consents(user_id, purpose, created_at desc);

create table public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analytics_enabled boolean not null default false,
  crash_reports_enabled boolean not null default false,
  ai_history_enabled boolean not null default true,
  community_visible boolean not null default true,
  retention_months int not null default 36 check (retention_months between 6 and 120),
  updated_at timestamptz not null default now()
);
create trigger privacy_touch before update on public.privacy_settings
  for each row execute function public.touch_updated_at();

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Foyers et partage familial
-- ---------------------------------------------------------------------
-- Domaines de permission : daily (tétées, couches, sommeil, repas),
-- health (mesures, rendez-vous, vaccins, traitements), documents,
-- pregnancy, lists, names, profile.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ma famille' check (char_length(name) between 1 and 60),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','coparent','caregiver')),
  can_view text[] not null default array['daily','health','documents','pregnancy','lists','names','profile']::text[],
  can_edit text[] not null default array['daily','lists','names']::text[],
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members(user_id);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text,
  token_hash text not null unique,
  role text not null default 'coparent' check (role in ('coparent','caregiver')),
  can_view text[] not null,
  can_edit text[] not null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Accès d'un utilisateur à un foyer pour un domaine.
create or replace function public.can_access_household(p_household uuid, p_domain text, p_write boolean default false)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household
      and m.user_id = auth.uid()
      and (
        m.role = 'owner'
        or (not p_write and p_domain = any(m.can_view))
        or (p_write and p_domain = any(m.can_edit))
      )
  );
$$;

create or replace function public.is_household_member(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members
    where household_id = p_household and user_id = auth.uid());
$$;

create or replace function public.is_household_owner(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members
    where household_id = p_household and user_id = auth.uid() and role = 'owner');
$$;

-- Le créateur d'un foyer en devient automatiquement propriétaire
create or replace function public.handle_new_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.household_members (household_id, user_id, role, can_view, can_edit)
  values (new.id, new.created_by, 'owner',
          array['daily','health','documents','pregnancy','lists','names','profile'],
          array['daily','health','documents','pregnancy','lists','names','profile']);
  return new;
end $$;
create trigger on_household_created after insert on public.households
  for each row execute function public.handle_new_household();

-- Création d'un foyer (RPC : renvoie l'id après insertion du propriétaire)
create or replace function public.create_household(p_name text default 'Ma famille')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  insert into public.households(name, created_by) values (coalesce(nullif(trim(p_name),''),'Ma famille'), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- Invitation : création (renvoie le jeton en clair UNE seule fois)
create or replace function public.create_household_invitation(
  p_household uuid, p_role text default 'coparent',
  p_can_view text[] default array['daily','health','documents','pregnancy','lists','names','profile'],
  p_can_edit text[] default array['daily','lists','names'],
  p_email text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_token text;
begin
  if not public.is_household_owner(p_household) then
    raise exception 'Seul le propriétaire du foyer peut inviter' using errcode = '42501';
  end if;
  v_token := encode(gen_random_bytes(18), 'hex');
  insert into public.household_invitations(household_id, invited_by, email, token_hash, role, can_view, can_edit)
  values (p_household, auth.uid(), p_email, encode(digest(v_token, 'sha256'), 'hex'), p_role, p_can_view, p_can_edit);
  return v_token;
end $$;

create or replace function public.accept_household_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_inv public.household_invitations;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into v_inv from public.household_invitations
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and accepted_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then raise exception 'Invitation invalide ou expirée' using errcode = 'P0002'; end if;
  insert into public.household_members(household_id, user_id, role, can_view, can_edit)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit)
  on conflict (household_id, user_id) do update
    set can_view = excluded.can_view, can_edit = excluded.can_edit;
  update public.household_invitations set accepted_at = now() where id = v_inv.id;
  return v_inv.household_id;
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.consents enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy roles_self_select on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy roles_admin_write on public.user_roles for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy consents_self on public.consents for select to authenticated using (user_id = auth.uid());
create policy consents_insert on public.consents for insert to authenticated with check (user_id = auth.uid());

create policy privacy_self_select on public.privacy_settings for select to authenticated using (user_id = auth.uid());
create policy privacy_self_update on public.privacy_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy households_member_select on public.households for select to authenticated
  using (public.is_household_member(id));
create policy households_insert on public.households for insert to authenticated with check (created_by = auth.uid());
create policy households_owner_update on public.households for update to authenticated
  using (public.is_household_owner(id)) with check (public.is_household_owner(id));
create policy households_owner_delete on public.households for delete to authenticated using (public.is_household_owner(id));

-- Un membre voit les membres de ses foyers ; seul le propriétaire modifie les droits ;
-- un membre peut se retirer lui-même ; le propriétaire peut révoquer un accès.
create policy members_select on public.household_members for select to authenticated
  using (public.is_household_member(household_id));
create policy members_owner_update on public.household_members for update to authenticated
  using (public.is_household_owner(household_id) and role <> 'owner')
  with check (public.is_household_owner(household_id) and role <> 'owner');
create policy members_delete on public.household_members for delete to authenticated
  using ((user_id = auth.uid() and role <> 'owner') or (public.is_household_owner(household_id) and role <> 'owner'));

create policy invitations_owner on public.household_invitations for select to authenticated
  using (public.is_household_owner(household_id));
create policy invitations_owner_revoke on public.household_invitations for update to authenticated
  using (public.is_household_owner(household_id)) with check (public.is_household_owner(household_id));
