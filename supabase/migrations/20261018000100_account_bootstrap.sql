-- =====================================================================
-- Toi & Moi — Inscription : création atomique du compte
-- * le trigger d'inscription crée profil + confidentialité + foyer
--   « Ma famille » dans la MÊME transaction que la ligne auth.users ;
-- * rattrapage au login (ensure_my_account) si une ligne manque ;
-- * consentements d'inscription (CGU, politique de confidentialité, majorité) ;
-- * reprise de l'onboarding (profiles.onboarding_state) ;
-- * un coparent qui accepte une invitation perd son foyer automatique VIDE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colonnes
-- ---------------------------------------------------------------------
-- Foyer créé automatiquement à l'inscription (ou par le rattrapage)
alter table public.households
  add column if not exists auto_created boolean not null default false;

-- État de reprise de l'onboarding (étape courante, réponses partielles…)
alter table public.profiles
  add column if not exists onboarding_state jsonb;
alter table public.profiles
  drop constraint if exists profiles_onboarding_state_size;
alter table public.profiles
  add constraint profiles_onboarding_state_size
  check (onboarding_state is null or pg_column_size(onboarding_state) < 20000);

-- ---------------------------------------------------------------------
-- Consentements : nouvelles finalités
-- ---------------------------------------------------------------------
do $$
declare v_name text;
begin
  -- Supprime la contrainte CHECK existante portant sur « purpose », quel que soit son nom
  for v_name in
    select c.conname from pg_constraint c
     where c.conrelid = 'public.consents'::regclass and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%purpose%'
  loop
    execute format('alter table public.consents drop constraint %I', v_name);
  end loop;
end $$;
alter table public.consents add constraint consents_purpose_check check (purpose in
  ('terms','privacy_policy','adult_confirmation','health_data','analytics','crash_reports',
   'ai_assistant','document_reading','marketing'));

-- ---------------------------------------------------------------------
-- Inscription : profil + confidentialité + foyer, atomiquement
-- (le trigger on_household_created ajoute l'adhésion « owner »)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.privacy_settings (user_id) values (new.id) on conflict do nothing;
  if not exists (select 1 from public.household_members where user_id = new.id) then
    insert into public.households (name, created_by, auto_created) values ('Ma famille', new.id, true);
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Rattrapage au login : idempotent, pour l'utilisateur connecté
-- ---------------------------------------------------------------------
create or replace function public.ensure_my_account()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_profile_created boolean := false;
  v_household_created boolean := false;
  v_household uuid;
  v_n int;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  -- Sérialise les appels concurrents d'un même utilisateur (pas de double foyer)
  perform pg_advisory_xact_lock(hashtextextended('ensure_my_account:' || v_uid::text, 0));

  insert into public.profiles (id) values (v_uid) on conflict do nothing;
  get diagnostics v_n = row_count;
  v_profile_created := v_n > 0;

  insert into public.privacy_settings (user_id) values (v_uid) on conflict do nothing;

  -- Foyer de référence : celui dont on est propriétaire, sinon le plus ancien
  select household_id into v_household from public.household_members
   where user_id = v_uid
   order by (role = 'owner') desc, joined_at, household_id
   limit 1;

  if v_household is null then
    insert into public.households (name, created_by, auto_created)
    values ('Ma famille', v_uid, true)
    returning id into v_household;
    v_household_created := true;
  end if;

  return jsonb_build_object(
    'profile_created', v_profile_created,
    'household_created', v_household_created,
    'household_id', v_household);
end $$;
revoke execute on function public.ensure_my_account() from public, anon;
grant execute on function public.ensure_my_account() to authenticated;

-- ---------------------------------------------------------------------
-- Consentements d'inscription (CGU, confidentialité, majorité)
-- ---------------------------------------------------------------------
create or replace function public.record_signup_consents(
  p_terms_version text, p_privacy_version text, p_is_adult boolean)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_at timestamptz := now();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_is_adult is not true then
    raise exception 'Vous devez avoir 18 ans ou plus' using errcode = '22023';
  end if;
  if coalesce(trim(p_terms_version), '') = '' or coalesce(trim(p_privacy_version), '') = '' then
    raise exception 'Version des conditions manquante' using errcode = '22023';
  end if;
  if char_length(p_terms_version) > 40 or char_length(p_privacy_version) > 40 then
    raise exception 'Version des conditions invalide' using errcode = '22023';
  end if;
  insert into public.consents (user_id, purpose, granted, version, created_at) values
    (v_uid, 'terms', true, p_terms_version, v_at),
    (v_uid, 'privacy_policy', true, p_privacy_version, v_at),
    (v_uid, 'adult_confirmation', true, p_terms_version, v_at);
  return v_at;
end $$;
revoke execute on function public.record_signup_consents(text, text, boolean) from public, anon;
grant execute on function public.record_signup_consents(text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- Foyer automatique vide ? (aucun autre membre, aucune donnée rattachée)
-- Parcourt dynamiquement toutes les tables ayant une clé étrangère vers
-- households (hors household_members, vérifiée à part) + le stockage.
-- ---------------------------------------------------------------------
create or replace function public.household_is_empty_auto(p_household uuid, p_user uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r record; v_found boolean;
begin
  if not exists (select 1 from public.households
                  where id = p_household and auto_created and created_by = p_user) then
    return false;
  end if;
  -- Le seul membre doit être p_user, en tant que propriétaire
  if exists (select 1 from public.household_members
              where household_id = p_household and (user_id <> p_user or role <> 'owner'))
     or not exists (select 1 from public.household_members
                     where household_id = p_household and user_id = p_user) then
    return false;
  end if;
  -- Toute ligne d'une table rattachée au foyer = donnée à conserver
  for r in
    select c.conrelid::regclass as tbl, a.attname as col
      from pg_constraint c
      cross join lateral unnest(c.conkey, c.confkey) as k(src, dst)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.src
      join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = k.dst
     where c.contype = 'f'
       and c.confrelid = 'public.households'::regclass
       and fa.attname = 'id'
       and c.conrelid <> 'public.household_members'::regclass
  loop
    execute format('select exists (select 1 from %s where %I = $1)', r.tbl, r.col)
      into v_found using p_household;
    if v_found then return false; end if;
  end loop;
  -- Fichiers déposés dans le dossier du foyer
  if exists (select 1 from storage.objects
              where split_part(name, '/', 1) = p_household::text) then
    return false;
  end if;
  return true;
end $$;
revoke execute on function public.household_is_empty_auto(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Acceptation d'invitation (signature et comportement inchangés)
-- + suppression du foyer automatique vide de la personne invitée
-- ---------------------------------------------------------------------
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
  insert into public.household_members(household_id, user_id, role, can_view, can_edit)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit)
  on conflict (household_id, user_id) do update
    set can_view = excluded.can_view, can_edit = excluded.can_edit;
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

-- ---------------------------------------------------------------------
-- Rattrapage des comptes existants (aucun utilisateur sans profil ni foyer)
-- ---------------------------------------------------------------------
insert into public.profiles (id) select u.id from auth.users u on conflict do nothing;
insert into public.privacy_settings (user_id) select u.id from auth.users u on conflict do nothing;
insert into public.households (name, created_by, auto_created)
select 'Ma famille', u.id, true from auth.users u
 where not exists (select 1 from public.household_members m where m.user_id = u.id);
