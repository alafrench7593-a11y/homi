-- =====================================================================
-- Corrections issues de la relecture de sécurité indépendante.
--  1. Export RGPD : les rendez-vous privés des autres membres n'y figurent plus ;
--     les nouvelles données du foyer y sont ajoutées selon les droits de chacun.
--  2. Échange de créneau : seul un relais de NUIT de l'auteur de la demande peut être échangé ;
--     le créneau visé ne peut plus être changé après coup.
--  3. Temps pour soi : seul son propriétaire peut le modifier ou le supprimer.
--  4. Partage post-partum : invisible dès que la mère quitte le foyer.
--  5. Tâche confiée : notification neutre, et seulement si la personne a accès à l'organisation.
--  8. « Fait par » : toujours la personne connectée.
--  9. Une demande traitée ne peut pas être rouverte.
-- 10. Repères de santé : le nom du professionnel ne peut pas être vide.
-- =====================================================================

-- ---------------------------------------------------------------- 2 + 9. demandes
create or replace function public.care_requests_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.to_user is not null and (new.to_user = new.from_user or not public.is_member_of(new.household_id, new.to_user)) then
      raise exception 'Destinataire invalide.' using errcode = '22023';
    end if;
    if new.task_id is not null and not exists (select 1 from public.family_tasks where id = new.task_id and household_id = new.household_id) then
      raise exception 'Tâche introuvable dans ce foyer.' using errcode = '22023';
    end if;
    if new.shift_id is not null and (new.kind <> 'swap_slot' or not exists (
         select 1 from public.care_shifts s where s.id = new.shift_id and s.household_id = new.household_id and s.kind = 'night' and s.user_id = new.from_user)) then
      raise exception 'Seul un de vos relais de nuit peut être proposé à l''échange.' using errcode = '22023';
    end if;
    if new.kind = 'swap_slot' and new.shift_id is null then
      raise exception 'Choisissez la nuit à échanger.' using errcode = '22023';
    end if;
    new.status := 'open'; new.responded_by := null; new.responded_at := null;
    return new;
  end if;
  if (new.household_id, new.from_user, new.kind, new.task_id, new.to_user, new.created_at, new.shift_id)
     is distinct from (old.household_id, old.from_user, old.kind, old.task_id, old.to_user, old.created_at, old.shift_id) then
    raise exception 'Cette demande ne peut pas être modifiée ainsi.' using errcode = '42501';
  end if;
  if auth.uid() = old.from_user then
    if new.status not in ('open','cancelled','done') then raise exception 'Vous ne pouvez pas répondre à votre propre demande.' using errcode = '42501'; end if;
    if new.status = 'open' and old.status <> 'open' then raise exception 'Une demande traitée ne peut pas être rouverte : créez-en une nouvelle.' using errcode = '42501'; end if;
    if new.responded_by is distinct from old.responded_by or new.responded_at is distinct from old.responded_at then raise exception 'Seule la personne qui répond est enregistrée.' using errcode = '42501'; end if;
  else
    if old.to_user is not null and old.to_user <> auth.uid() then raise exception 'Cette demande s''adresse à quelqu''un d''autre.' using errcode = '42501'; end if;
    if old.status <> 'open' or new.status not in ('accepted','declined') then raise exception 'Cette demande n''attend plus de réponse.' using errcode = '42501'; end if;
    if (new.message, new.starts_at, new.ends_at) is distinct from (old.message, old.starts_at, old.ends_at) then raise exception 'Seule la réponse peut être modifiée.' using errcode = '42501'; end if;
    new.responded_by := auth.uid(); new.responded_at := now();
  end if;
  return new;
end $$;

create or replace function public.care_requests_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  v_title := case new.kind
    when 'relay' then 'Demande de relais' when 'taking_over' then 'Relais pris' when 'rest' then 'Besoin de repos' when 'take_task' then 'Peux-tu prendre cette tâche ?'
    when 'available' then 'Disponible pour aider' when 'swap_slot' then 'Échange de créneau proposé' else 'Besoin d’aide aujourd’hui' end;
  if tg_op = 'INSERT' then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      select m.user_id, 'family', v_title, 'Ouvrez l’application pour répondre.', '/family', jsonb_build_object('request_id', new.id)
      from public.household_members m
      where m.household_id = new.household_id and m.user_id <> new.from_user
        and (new.to_user is null or m.user_id = new.to_user)
        and (m.role = 'owner' or 'lists' = any(m.can_view));
    return new;
  end if;
  if new.status is distinct from old.status and new.status in ('accepted','declined') then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (new.from_user, 'family', case when new.status = 'accepted' then 'Demande acceptée' else 'Demande déclinée' end, v_title, '/family', jsonb_build_object('request_id', new.id));
    if new.status = 'accepted' and new.kind = 'take_task' and new.task_id is not null then
      update public.family_tasks set assignee_id = new.responded_by where id = new.task_id and household_id = new.household_id;
    end if;
    if new.status = 'accepted' and new.kind = 'swap_slot' and new.shift_id is not null then
      update public.care_shifts set user_id = new.responded_by, status = 'swapped'
        where id = new.shift_id and household_id = new.household_id and kind = 'night' and user_id = new.from_user;
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- 3. temps pour soi
create or replace function public.care_shifts_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.kind = 'me_time' and old.user_id <> auth.uid() then
      raise exception 'Seule la personne concernée peut supprimer son temps pour soi.' using errcode = '42501';
    end if;
    return old;
  end if;
  if not public.is_member_of(new.household_id, new.user_id) then
    raise exception 'La personne choisie ne fait pas partie du foyer.' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' and new.kind <> old.kind then
    raise exception 'Le type d''un créneau ne change pas.' using errcode = '22023';
  end if;
  if new.kind = 'me_time' and (new.user_id <> auth.uid() or (tg_op = 'UPDATE' and old.user_id <> auth.uid())) then
    raise exception 'Chacun gère son propre temps pour soi.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists care_shifts_guard on public.care_shifts;
create trigger care_shifts_guard before insert or update or delete on public.care_shifts
  for each row execute function public.care_shifts_guard();

-- ---------------------------------------------------------------- 4. partage post-partum et départ du foyer
drop policy if exists postpartum_shared_household_read on public.postpartum_shared_status;
create policy postpartum_shared_household_read on public.postpartum_shared_status for select to authenticated
  using (public.is_household_member(household_id) and public.is_member_of(household_id, user_id));

create or replace function public.postpartum_on_member_leave()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.postpartum_shared_status where user_id = old.user_id and household_id = old.household_id;
  update public.postpartum_settings set share_household_id = null where user_id = old.user_id and share_household_id = old.household_id;
  return old;
end $$;
create trigger postpartum_member_leave after delete on public.household_members
  for each row execute function public.postpartum_on_member_leave();

-- ---------------------------------------------------------------- 5 + 8. tâches
create or replace function public.family_tasks_before()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assignee_id is not null and not public.is_member_of(new.household_id, new.assignee_id) then
    raise exception 'La personne choisie ne fait pas partie du foyer.' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then
    if new.household_id <> old.household_id then raise exception 'Une tâche ne change pas de foyer.' using errcode = '22023'; end if;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    -- « Fait par » est toujours la personne connectée (jamais choisi par l'application)
    new.done_at := now(); new.done_by := coalesce(auth.uid(), new.done_by);
  elsif new.status = 'done' then
    new.done_at := old.done_at; new.done_by := old.done_by;
  else
    new.done_at := null; new.done_by := null;
  end if;
  return new;
end $$;

create or replace function public.family_task_notify(p_task public.family_tasks)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_task.assignee_id is null or p_task.assignee_id is not distinct from auth.uid() then return; end if;
  -- Texte neutre sur l'écran verrouillé, et seulement pour qui a accès à l'organisation familiale
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
    select p_task.assignee_id, 'family', 'Une tâche vous est confiée', 'Ouvrez l’application pour la voir.', '/family', jsonb_build_object('task_id', p_task.id)
    from public.household_members m
    where m.household_id = p_task.household_id and m.user_id = p_task.assignee_id and (m.role = 'owner' or 'lists' = any(m.can_view));
end $$;
revoke execute on function public.family_task_notify(public.family_tasks) from public, anon, authenticated;

create or replace function public.family_tasks_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_kind text; v_every int; v_next timestamptz;
begin
  if tg_op = 'INSERT' then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), 'created', jsonb_build_object('assignee', new.assignee_id));
    perform public.family_task_notify(new);
    return new;
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), case when new.assignee_id is null then 'unassigned' else 'assigned' end,
              jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
    perform public.family_task_notify(new);
  end if;
  if new.status is distinct from old.status then
    v_kind := case new.status when 'done' then 'done' when 'cancelled' then 'cancelled' else 'reopened' end;
    insert into public.family_task_events(task_id, household_id, actor_id, kind) values (new.id, new.household_id, auth.uid(), v_kind);
    if new.status = 'done' and new.recurrence is not null and new.due_at is not null then
      v_every := coalesce((new.recurrence->>'every')::int, 1);
      v_next := case new.recurrence->>'type'
        when 'daily' then new.due_at + make_interval(days => v_every)
        when 'weekly' then new.due_at + make_interval(weeks => v_every)
        else new.due_at + make_interval(months => v_every) end;
      if not exists (select 1 from public.family_tasks t where t.household_id = new.household_id and t.title = new.title and t.due_at = v_next and t.status = 'todo') then
        insert into public.family_tasks(household_id, title, category, due_at, assignee_id, priority, essential, recurrence, notes, routine_id, created_by)
          values (new.household_id, new.title, new.category, v_next, new.assignee_id, new.priority, new.essential, new.recurrence, new.notes, new.routine_id, new.created_by);
      end if;
    end if;
  elsif new.due_at is distinct from old.due_at and old.due_at is not null and new.due_at > old.due_at then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), 'postponed', jsonb_build_object('from', old.due_at, 'to', new.due_at));
  elsif new.title is distinct from old.title or new.notes is distinct from old.notes or new.priority is distinct from old.priority or new.category is distinct from old.category then
    insert into public.family_task_events(task_id, household_id, actor_id, kind) values (new.id, new.household_id, auth.uid(), 'updated');
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- 10. repères de santé
alter table public.child_health_trackers add constraint child_health_trackers_plan_by_not_blank
  check ((low_threshold is null and high_threshold is null) or char_length(btrim(coalesce(plan_by, ''))) > 0);

-- ---------------------------------------------------------------- 1. export RGPD
alter function public.export_my_data() rename to _export_my_data_v6;
revoke execute on function public._export_my_data_v6() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_v6();
  v := jsonb_set(v, '{households}', coalesce((
    select jsonb_agg(
      (h - 'appointments') || jsonb_build_object(
        -- Rendez-vous : jamais ceux qu'un autre membre a gardés privés
        'appointments', coalesce((select jsonb_agg(a) from jsonb_array_elements(h -> 'appointments') a
                                  where not coalesce((a ->> 'private_to_creator')::boolean, false) or a ->> 'created_by' = v_uid::text), '[]'::jsonb),
        'family_tasks', case when public.can_access_household(hid, 'lists', false) then (select coalesce(jsonb_agg(x), '[]') from public.family_tasks x where x.household_id = hid) else '[]'::jsonb end,
        'care_requests', case when public.can_access_household(hid, 'lists', false) then (select coalesce(jsonb_agg(x), '[]') from public.care_requests x where x.household_id = hid) else '[]'::jsonb end,
        'care_shifts', case when public.can_access_household(hid, 'lists', false) then (select coalesce(jsonb_agg(x), '[]') from public.care_shifts x where x.household_id = hid) else '[]'::jsonb end,
        'routines', case when public.can_access_household(hid, 'lists', false) then (select coalesce(jsonb_agg(x), '[]') from public.routines x where x.household_id = hid) else '[]'::jsonb end,
        'family_events', case when public.can_access_household(hid, 'lists', false) then (select coalesce(jsonb_agg(x), '[]') from public.family_events x where x.household_id = hid) else '[]'::jsonb end,
        'child_wellbeing', case when public.can_access_household(hid, 'daily', false) then (select coalesce(jsonb_agg(x), '[]') from public.child_wellbeing x where x.household_id = hid) else '[]'::jsonb end,
        'child_health_trackers', case when public.can_access_household(hid, 'health', false) then (select coalesce(jsonb_agg(x), '[]') from public.child_health_trackers x where x.household_id = hid) else '[]'::jsonb end,
        'child_health_entries', case when public.can_access_household(hid, 'health', false) then (select coalesce(jsonb_agg(x), '[]') from public.child_health_entries x where x.household_id = hid) else '[]'::jsonb end,
        'child_vaccinations', case when public.can_access_household(hid, 'health', false) then (select coalesce(jsonb_agg(x), '[]') from public.child_vaccinations x where x.household_id = hid) else '[]'::jsonb end,
        'avoid_products', case when public.can_access_household(hid, 'health', false) then (select coalesce(jsonb_agg(x), '[]') from public.avoid_products x where x.household_id = hid) else '[]'::jsonb end
      ))
    from (select h, (h -> 'household' ->> 'id')::uuid as hid from jsonb_array_elements(v -> 'households') h) s
  ), '[]'::jsonb));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
