-- =====================================================================
-- Confidentialité (14/11/2026) — Grossesse fermée par défaut pour une nounou (caregiver)
--
-- Avant : household_members.pregnancy_access et household_invitations.pregnancy_access valaient VRAI par défaut.
-- L'application cochait « grossesse » à faux pour le préréglage nounou, mais une invitation fabriquée par une autre
-- interface (ou un appel RPC sans ce paramètre) ouvrait le suivi de grossesse à une nounou. Comme child_scope
-- (20261113000200), l'accès devient FERMÉ PAR DÉFAUT pour le rôle caregiver :
--   1. Insertion d'un membre ou d'une invitation « caregiver » : pregnancy_access est remis à FAUX, sauf accord
--      explicite de la propriétaire (paramètre p_pregnancy_access = true de create_household_invitation, recopié
--      à l'acceptation de cette invitation, ou set_member_scope après coup). Le marqueur d'accord explicite est
--      local à la transaction (set_config(..., true)) et posé seulement par ces fonctions serveur.
--   2. Changement de rôle co-parent → nounou : pregnancy_access repasse à faux (comme child_scope).
--   3. create_household_invitation : p_pregnancy_access par défaut NULL = « vrai pour un co-parent, faux pour
--      une nounou » ; set_member_scope : NULL = inchangé (avant : NULL ouvrait la grossesse).
--   4. Aucun accès existant n'est retiré : les co-parents gardent leur valeur ; les nounous déjà membres gardent
--      la leur (la propriétaire la voit et la change dans Réglages > Famille). Changement de comportement pour
--      les NOUVEAUX accès seulement.
-- Tests : supabase/tests/sql/98p_grossesse_nounou.sql
-- Retour arrière : drop trigger household_members_pregnancy_default on public.household_members;
--   drop trigger household_invitations_pregnancy_default on public.household_invitations;
--   drop function public._pregnancy_default_closed(); puis recréer create_household_invitation et
--   set_member_scope depuis 20261021000500_premium.sql.
-- =====================================================================

create or replace function public._pregnancy_default_closed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'caregiver' and coalesce(current_setting('homi.pregnancy_grant', true), '') <> 'on' then
    new.pregnancy_access := false;
  end if;
  return new;
end $$;
revoke execute on function public._pregnancy_default_closed() from public, anon, authenticated;

drop trigger if exists household_members_pregnancy_default on public.household_members;
create trigger household_members_pregnancy_default before insert on public.household_members
  for each row execute function public._pregnancy_default_closed();
drop trigger if exists household_invitations_pregnancy_default on public.household_invitations;
create trigger household_invitations_pregnancy_default before insert on public.household_invitations
  for each row execute function public._pregnancy_default_closed();

-- Changement de rôle : le périmètre d'enfants ET la grossesse se recalculent (rien ne suit par accident)
create or replace function public.household_members_role_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'caregiver' and old.role <> 'caregiver' then
    if new.child_scope is null then new.child_scope := '{}'; end if;
    new.pregnancy_access := false;
  end if;
  return new;
end $$;

-- Invitation : défaut selon le rôle ; accord explicite recopié tel quel
drop function if exists public.create_household_invitation(uuid, text, text[], text[], text, uuid[], boolean);
create or replace function public.create_household_invitation(
  p_household uuid, p_role text default 'coparent',
  p_can_view text[] default array['daily','health','documents','pregnancy','lists','names','profile'],
  p_can_edit text[] default array['daily','lists','names'],
  p_email text default null,
  p_child_scope uuid[] default null,
  p_pregnancy_access boolean default null)
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
  if p_pregnancy_access is true then perform set_config('homi.pregnancy_grant', 'on', true); end if;
  insert into public.household_invitations(household_id, invited_by, email, token_hash, role, can_view, can_edit, child_scope, pregnancy_access)
  values (p_household, auth.uid(), p_email, encode(digest(v_token, 'sha256'), 'hex'), p_role, p_can_view, p_can_edit, p_child_scope,
          coalesce(p_pregnancy_access, p_role <> 'caregiver'));
  perform set_config('homi.pregnancy_grant', '', true);
  return v_token;
end $$;
revoke execute on function public.create_household_invitation(uuid, text, text[], text[], text, uuid[], boolean) from public, anon;
grant execute on function public.create_household_invitation(uuid, text, text[], text[], text, uuid[], boolean) to authenticated;

-- Acceptation : l'accord éventuel de l'invitation est recopié (même corps que 20261021000500_premium.sql)
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
  if v_inv.pregnancy_access then perform set_config('homi.pregnancy_grant', 'on', true); end if;
  insert into public.household_members(household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit, v_inv.child_scope, v_inv.pregnancy_access)
  on conflict (household_id, user_id) do update
    set can_view = excluded.can_view, can_edit = excluded.can_edit, child_scope = excluded.child_scope, pregnancy_access = excluded.pregnancy_access;
  perform set_config('homi.pregnancy_grant', '', true);
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

-- Choix après coup par la propriétaire : NULL = inchangé (avant : NULL ouvrait la grossesse)
create or replace function public.set_member_scope(p_household uuid, p_user uuid, p_child_scope uuid[], p_pregnancy_access boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_household_owner(p_household) then raise exception 'Seul le propriétaire du foyer peut choisir les profils partagés' using errcode = '42501'; end if;
  if p_child_scope is not null and exists (select 1 from unnest(p_child_scope) x where x not in (select id from public.children where household_id = p_household)) then
    raise exception 'Profil inconnu dans ce foyer' using errcode = '22023';
  end if;
  update public.household_members set child_scope = p_child_scope, pregnancy_access = coalesce(p_pregnancy_access, pregnancy_access)
   where household_id = p_household and user_id = p_user and role <> 'owner';
end $$;
revoke execute on function public.set_member_scope(uuid, uuid, uuid[], boolean) from public, anon;
grant execute on function public.set_member_scope(uuid, uuid, uuid[], boolean) to authenticated;
