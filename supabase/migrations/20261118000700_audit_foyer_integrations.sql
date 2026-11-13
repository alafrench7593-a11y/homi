-- =====================================================================
-- Audit n°7 « Parcours du foyer et intégrations » (18/11/2026) — correctifs
-- Rapport : docs/audit/07_foyer_integrations.md ; tests : supabase/tests/sql/98y_audit_foyer.sql.
--
--   F1 moyenne : accept_household_invitation() appliquée par une personne DÉJÀ membre du foyer réécrivait ses droits
--                (« on conflict do update ») sans changer son rôle : un co-parent qui ouvre le lien destiné à la
--                nounou devenait un co-parent limité au quotidien et aux listes, à un seul enfant, grossesse fermée ;
--                une nounou qui ouvre le lien du co-parent restait « nounou » avec tous les domaines ; l'invitation
--                était consommée et la vraie destinataire recevait « Invitation invalide ou expirée ».
--                → refus explicite « Vous faites déjà partie de ce foyer. » ; l'invitation reste utilisable ; les
--                droits d'un membre ne changent que par la propriétaire (Réglages > Famille, set_member_scope).
--   F2 basse   : calendar_feed_data() renvoyait les missions REFUSÉES (statut « todo ») sans mission_state : le filtre
--                commun itemsBetween (« mission refusée : plus dans l'agenda ») ne pouvait pas s'appliquer, la mission
--                restait dans l'agenda externe (Google, Apple, Outlook) de la personne qui l'avait refusée.
--                → filtrées côté serveur, et mission_state transmis (même règle que l'agenda de l'application).
--
-- Retour arrière (après accord) : recréer accept_household_invitation depuis 20261114000100_grossesse_nounou_fermee.sql
--   et calendar_feed_data depuis 20261117000100_audit_securite_backend.sql.
-- =====================================================================

-- ---------------------------------------------------------------- F1. invitation acceptée par un membre existant
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
  -- Déjà membre : rien ne change (ni droits, ni enfants, ni grossesse) et l'invitation reste à sa destinataire
  if exists (select 1 from public.household_members where household_id = v_inv.household_id and user_id = auth.uid()) then
    raise exception 'Vous faites déjà partie de ce foyer.' using errcode = '23505',
      hint = 'Les droits d''un membre se modifient dans Réglages > Famille.';
  end if;
  if v_inv.pregnancy_access then perform set_config('homi.pregnancy_grant', 'on', true); end if;
  insert into public.household_members(household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit, v_inv.child_scope, v_inv.pregnancy_access);
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
revoke execute on function public.accept_household_invitation(text) from public, anon;
grant execute on function public.accept_household_invitation(text) to authenticated;

-- ---------------------------------------------------------------- F2. flux d'agenda : missions refusées masquées
create or replace function public.calendar_feed_data(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare f public.calendar_feeds; v_from timestamptz := now() - interval '31 days'; v_to timestamptz := now() + interval '366 days';
begin
  select * into f from public.calendar_feeds
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and revoked_at is null;
  if not found or not public.is_member_of(f.household_id, f.user_id) then return null; end if;
  -- les vérifications de droits ci-dessous (can_access_household, can_access_child, can_access_pregnancy)
  -- s'évaluent pour CETTE personne
  perform set_config('request.jwt.claim.sub', f.user_id::text, true);
  update public.calendar_feeds set last_accessed_at = now() where id = f.id;
  return jsonb_build_object(
    'feed', jsonb_build_object('id', f.id, 'label', f.label, 'include_health_titles', f.include_health_titles),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public.family_events e
        where e.household_id = f.household_id and public.can_access_household(e.household_id, 'lists', false)
          and (e.child_id is null or public.can_access_child(e.child_id))
          and (e.recurrence is not null or (e.starts_at < v_to and coalesce(e.ends_at, e.starts_at) > v_from))), '[]'::jsonb),
    'appointments', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'starts_at', a.starts_at, 'location_label', a.location_label, 'kind', a.kind, 'private_to_creator', a.private_to_creator))
        from public.appointments a
        where a.household_id = f.household_id and public.can_access_household(a.household_id, 'health', false)
          and (a.child_id is null or public.can_access_child(a.child_id))
          and (a.pregnancy_id is null or public.can_access_pregnancy(a.pregnancy_id))
          and (not a.private_to_creator or a.created_by = f.user_id) and a.starts_at between v_from and v_to), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'status', t.status, 'assignee_id', t.assignee_id, 'mission_state', t.mission_state))
        from public.family_tasks t
        where t.household_id = f.household_id and public.can_access_household(t.household_id, 'lists', false)
          and (t.child_id is null or public.can_access_child(t.child_id))
          and t.due_at between v_from and v_to and t.status <> 'cancelled'
          and t.mission_state is distinct from 'declined'), '[]'::jsonb),
    'shifts', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'user_id', s.user_id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'status', s.status))
        from public.care_shifts s
        where s.household_id = f.household_id and public.can_access_household(s.household_id, 'lists', false)
          and (s.kind = 'night' or s.user_id = f.user_id) and s.starts_at between v_from and v_to), '[]'::jsonb)
  );
end $$;
revoke execute on function public.calendar_feed_data(text) from public, anon, authenticated;
grant execute on function public.calendar_feed_data(text) to service_role;
