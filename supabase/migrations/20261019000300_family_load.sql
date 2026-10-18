-- =====================================================================
-- Partage de la charge familiale : tâches, demandes de relais, créneaux
-- (relais de nuit, temps pour soi), routines.
--
-- Domaine de permission : « lists » (renommé dans l'app « Listes et
-- organisation ») — aucun nouveau droit à distribuer, aucun membre existant
-- ne perd ni ne gagne d'accès.
-- Pas de classement, pas de score : l'historique sert à se coordonner.
-- =====================================================================

-- ---------------------------------------------------------------- notifications : nouvelle catégorie « family »
alter table public.notifications drop constraint if exists notifications_category_check;
alter table public.notifications add constraint notifications_category_check
  check (category in ('reminder','community_reply','community_comment','assistant','subscription','product_recall','system','family'));

-- Membre du foyer ? (pour contrôler un responsable ou un destinataire)
create or replace function public.is_member_of(p_household uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members where household_id = p_household and user_id = p_user);
$$;

-- ---------------------------------------------------------------- tâches
create table public.family_tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null default 'other' check (category in ('feeding','diapers','sleep','shopping','packing','appointments','housework','admin','organization','parent_rest','other')),
  due_at timestamptz,
  assignee_id uuid references auth.users(id) on delete set null,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  essential boolean not null default false,
  -- { "type": "daily"|"weekly"|"monthly", "every": 1..12 }
  recurrence jsonb check (recurrence is null or (recurrence ? 'type' and recurrence->>'type' in ('daily','weekly','monthly')
                          and coalesce((recurrence->>'every')::int, 1) between 1 and 12)),
  status text not null default 'todo' check (status in ('todo','done','cancelled')),
  done_at timestamptz,
  done_by uuid references auth.users(id) on delete set null,
  notes text check (char_length(notes) <= 1000),
  routine_id uuid,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index family_tasks_household_idx on public.family_tasks(household_id, status, due_at);
select public._apply_household_policies('family_tasks', 'lists');

create table public.family_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.family_tasks(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('created','assigned','unassigned','done','reopened','postponed','updated','cancelled')),
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index family_task_events_idx on public.family_task_events(household_id, created_at desc);
alter table public.family_task_events enable row level security;
-- Lecture seule pour le foyer ; écrit uniquement par le déclencheur
create policy family_task_events_sel on public.family_task_events for select to authenticated
  using (public.can_access_household(household_id, 'lists', false));

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
    new.done_at := coalesce(new.done_at, now()); new.done_by := coalesce(new.done_by, auth.uid());
  elsif new.status <> 'done' then
    new.done_at := null; new.done_by := null;
  end if;
  return new;
end $$;
create trigger family_tasks_before before insert or update on public.family_tasks
  for each row execute function public.family_tasks_before();

create or replace function public.family_tasks_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_kind text; v_every int; v_next timestamptz;
begin
  if tg_op = 'INSERT' then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), 'created', jsonb_build_object('assignee', new.assignee_id));
    if new.assignee_id is not null and new.assignee_id is distinct from auth.uid() then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (new.assignee_id, 'family', 'Une tâche vous est confiée', left(new.title, 120), '/family', jsonb_build_object('task_id', new.id));
    end if;
    return new;
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), case when new.assignee_id is null then 'unassigned' else 'assigned' end,
              jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
    if new.assignee_id is not null and new.assignee_id is distinct from auth.uid() then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (new.assignee_id, 'family', 'Une tâche vous est confiée', left(new.title, 120), '/family', jsonb_build_object('task_id', new.id));
    end if;
  end if;
  if new.status is distinct from old.status then
    v_kind := case new.status when 'done' then 'done' when 'cancelled' then 'cancelled' else 'reopened' end;
    insert into public.family_task_events(task_id, household_id, actor_id, kind) values (new.id, new.household_id, auth.uid(), v_kind);
    -- Tâche récurrente terminée : la suivante est créée (une seule fois)
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
create trigger family_tasks_after after insert or update on public.family_tasks
  for each row execute function public.family_tasks_after();

-- ---------------------------------------------------------------- demandes (relais, repos, aide, échange…)
create table public.care_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('relay','taking_over','rest','take_task','available','swap_slot','help_today')),
  message text check (char_length(message) <= 300),
  task_id uuid references public.family_tasks(id) on delete cascade,
  shift_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'open' check (status in ('open','accepted','declined','cancelled','done')),
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (kind <> 'take_task' or task_id is not null)
);
create index care_requests_household_idx on public.care_requests(household_id, status, created_at desc);
alter table public.care_requests enable row level security;
create policy care_requests_sel on public.care_requests for select to authenticated
  using (public.can_access_household(household_id, 'lists', false));
create policy care_requests_ins on public.care_requests for insert to authenticated
  with check (from_user = auth.uid() and public.can_access_household(household_id, 'lists', false));
-- Mise à jour : l'auteur (annuler, clore) ou un autre membre (accepter / décliner) — contrôlé par le déclencheur
create policy care_requests_upd on public.care_requests for update to authenticated
  using (public.can_access_household(household_id, 'lists', false))
  with check (public.can_access_household(household_id, 'lists', false));
create policy care_requests_del on public.care_requests for delete to authenticated
  using (from_user = auth.uid());

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
    new.status := 'open'; new.responded_by := null; new.responded_at := null;
    return new;
  end if;
  if (new.household_id, new.from_user, new.kind, new.task_id, new.to_user, new.created_at) is distinct from (old.household_id, old.from_user, old.kind, old.task_id, old.to_user, old.created_at) then
    raise exception 'Cette demande ne peut pas être modifiée ainsi.' using errcode = '42501';
  end if;
  if auth.uid() = old.from_user then
    if new.status not in ('open','cancelled','done') then raise exception 'Vous ne pouvez pas répondre à votre propre demande.' using errcode = '42501'; end if;
  else
    if old.to_user is not null and old.to_user <> auth.uid() then raise exception 'Cette demande s''adresse à quelqu''un d''autre.' using errcode = '42501'; end if;
    if old.status <> 'open' or new.status not in ('accepted','declined') then raise exception 'Cette demande n''attend plus de réponse.' using errcode = '42501'; end if;
    if (new.message, new.starts_at, new.ends_at) is distinct from (old.message, old.starts_at, old.ends_at) then raise exception 'Seule la réponse peut être modifiée.' using errcode = '42501'; end if;
    new.responded_by := auth.uid(); new.responded_at := now();
  end if;
  return new;
end $$;
create trigger care_requests_guard before insert or update on public.care_requests
  for each row execute function public.care_requests_guard();

create or replace function public.care_requests_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  v_title := case new.kind
    when 'relay' then 'Demande de relais' when 'taking_over' then 'Relais pris' when 'rest' then 'Besoin de repos' when 'take_task' then 'Peux-tu prendre cette tâche ?'
    when 'available' then 'Disponible pour aider' when 'swap_slot' then 'Échange de créneau proposé' else 'Besoin d’aide aujourd’hui' end;
  if tg_op = 'INSERT' then
    -- Texte neutre : rien de personnel sur l'écran verrouillé
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
    -- « Peux-tu prendre cette tâche ? » acceptée : la tâche change de responsable
    if new.status = 'accepted' and new.kind = 'take_task' and new.task_id is not null then
      update public.family_tasks set assignee_id = new.responded_by where id = new.task_id;
    end if;
    -- Échange de créneau accepté : le créneau change de responsable
    if new.status = 'accepted' and new.kind = 'swap_slot' and new.shift_id is not null then
      update public.care_shifts set user_id = new.responded_by, status = 'swapped' where id = new.shift_id and household_id = new.household_id;
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- créneaux : relais de nuit et temps pour soi
create table public.care_shifts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('night','me_time')),
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'planned' check (status in ('planned','confirmed','swapped','cancelled')),
  note text check (char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '24 hours')
);
create index care_shifts_household_idx on public.care_shifts(household_id, starts_at);
select public._apply_household_policies('care_shifts', 'lists');

create or replace function public.care_shifts_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member_of(new.household_id, new.user_id) then
    raise exception 'La personne choisie ne fait pas partie du foyer.' using errcode = '22023';
  end if;
  -- Un temps pour soi appartient à la personne : elle seule le pose ou le modifie
  if new.kind = 'me_time' and new.user_id <> auth.uid() and (tg_op = 'INSERT' or old.user_id <> new.user_id) then
    raise exception 'Chacun réserve son propre temps pour soi.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger care_shifts_guard before insert or update on public.care_shifts
  for each row execute function public.care_shifts_guard();

alter table public.care_requests add constraint care_requests_shift_fk foreign key (shift_id) references public.care_shifts(id) on delete cascade;
create trigger care_requests_after after insert or update on public.care_requests
  for each row execute function public.care_requests_after();

-- ---------------------------------------------------------------- routines
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  kind text not null default 'custom' check (kind in ('bag','meals','bedtime','tomorrow','shopping','weekly','appointment','rest','custom')),
  items text[] not null default '{}' check (cardinality(items) between 1 and 30),
  default_assignee uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index routines_household_idx on public.routines(household_id);
select public._apply_household_policies('routines', 'lists');
alter table public.family_tasks add constraint family_tasks_routine_fk foreign key (routine_id) references public.routines(id) on delete set null;
