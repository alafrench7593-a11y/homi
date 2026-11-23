-- Audit de confidentialité du 23/11/2026 : trois fuites rejouées sur base locale (familles fictives), corrigées ici.
-- NON DÉPLOYÉ : à appliquer en production après validation de la propriétaire.
--
-- B1. Journal d'audit du foyer : un co-parent limité à certains enfants (child_scope) ou sans accès à la grossesse
--     lisait les titres d'éléments d'un autre enfant ou de la grossesse (« Bilan psy de … »). La lecture exige
--     désormais, en plus du rôle et du domaine, l'accès à l'enfant / à la grossesse de la ligne, et le respect des
--     éléments privés (privé à la personne qui a déposé / créé, « pour moi »).
create or replace function public._audit_row_readable(p_before jsonb, p_after jsonb, p_actor uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r jsonb := coalesce(p_after, p_before); v_child uuid; v_preg uuid;
begin
  if r is null then return true; end if;
  begin v_child := nullif(coalesce(p_after->>'child_id', p_before->>'child_id'), '')::uuid; exception when others then return false; end;
  begin v_preg := nullif(coalesce(p_after->>'pregnancy_id', p_before->>'pregnancy_id'), '')::uuid; exception when others then return false; end;
  if v_child is not null and not public.can_access_child(v_child) then return false; end if;
  if v_preg is not null and not public._pregnancy_medical_access(v_preg) then return false; end if;
  if (coalesce((r->>'private_to_uploader')::boolean, false) or coalesce((r->>'private_to_creator')::boolean, false)
      or (coalesce((r->>'for_parent')::boolean, false) and not coalesce((r->>'shared_with_household')::boolean, false)))
     and p_actor is distinct from auth.uid() then return false; end if;
  return true;
end $$;
revoke execute on function public._audit_row_readable(jsonb, jsonb, uuid) from public, anon;
grant execute on function public._audit_row_readable(jsonb, jsonb, uuid) to authenticated;

drop policy if exists household_audit_log_sel on public.household_audit_log;
create policy household_audit_log_sel on public.household_audit_log for select to authenticated
  using (public._audit_readable(household_id, domain) and public._audit_row_readable(before, after, actor_id));

-- B2. Outils parent liés à un enfant sans le périmètre par enfant : relais biberon, stock de lait, portions préparées,
--     dépenses. Même politique restrictive que toutes les tables de suivi (*_child_id_scope).
do $$
declare t text;
begin
  foreach t in array array['bottle_relays', 'milk_stock', 'prepared_portions', 'household_expenses'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', t || '_child_id_scope', t);
    execute format('create policy %I on public.%I as restrictive for all to authenticated using (child_id is null or public.can_access_child(child_id)) with check (child_id is null or public.can_access_child(child_id))', t || '_child_id_scope', t);
  end loop;
end $$;

-- B3. Flux d'agenda (iCal) : le rendez-vous « pour moi » d'un parent partait dans l'agenda de l'autre.
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
          and (not a.private_to_creator or a.created_by = f.user_id)
          -- rendez-vous « pour moi » d'un parent : jamais dans l'agenda de l'autre (même règle que appointments_for_parent_owner)
          and (not coalesce(a.for_parent, false) or a.created_by = f.user_id or coalesce(a.shared_with_household, false))
          and a.starts_at between v_from and v_to), '[]'::jsonb),
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

revoke execute on function public.calendar_feed_data(text) from public, anon, authenticated;
grant execute on function public.calendar_feed_data(text) to service_role;
