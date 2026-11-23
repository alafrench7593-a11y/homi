-- =====================================================================
-- Fondations du foyer (13/11/2026) — D. Événements métier typés (bus entre modules, « outbox »)
--
-- Aujourd'hui chaque synchronisation entre modules est codée en dur dans un déclencheur (ex. demande acceptée
-- → mise à jour de la tâche). Avec 13 synchronisations prévues (missions, nounou, courses, stock, budget…),
-- ce couplage direct risque cascades et boucles. Socle posé ici :
--   * household_events : un événement TYPÉ (enum household_event_type) par fait métier, avec foyer, acteur,
--     entité, charge utile JSON (≤ 8 Ko), idempotency_key UNIQUE et statut de traitement
--     (pending → processing → done | failed | skipped), tentatives, prochain essai, dernière erreur.
--   * _emit_household_event() : émission IDEMPOTENTE (même clé = même événement, jamais de doublon, même
--     si le fait est rejoué : file hors ligne, double clic, nouvelle tentative du serveur).
--   * Anti-boucle : un consommateur déclare l'événement qu'il traite (set_config('homi.event_id', …, true),
--     voir _begin_event_processing) ; tout événement émis pendant ce traitement hérite de l'origine
--     (origin_event_id, root_event_id) et d'une profondeur + 1. Au-delà de 3 niveaux, ou si le même
--     (type, entité) apparaît déjà dans la chaîne, l'événement est enregistré « skipped » (trace conservée)
--     et n'est jamais traité : la saisie métier n'est pas bloquée.
--   * Consommation par le serveur seulement : claim_household_events() (FOR UPDATE SKIP LOCKED, plusieurs
--     consommateurs possibles sans double traitement) et finish_household_event() (réessai avec délai
--     croissant, abandon « failed » après 5 tentatives).
--   * Lecture : propriétaire et co-parents du foyer ; aucun client ne peut émettre, modifier ou effacer.
--   * Exemple réel branché : tâche terminée → « task.completed » (déclencheur sur family_tasks), clé
--     task.completed:<tâche>:<horodatage de fin> (rouvrir puis terminer à nouveau = nouvel événement).
-- Les 13 synchronisations ne sont PAS branchées ici (voir HOMI_SYNC_ARCHITECTURE.md).
--
-- Ajouter un type : alter type public.household_event_type add value '<module>.<fait>'; (migration dédiée)
-- Retour arrière : drop trigger family_tasks_events on public.family_tasks; drop table public.household_events;
--   drop function public._emit_household_event, public.claim_household_events, public.finish_household_event,
--   public._begin_event_processing, public.family_tasks_emit_events; drop type public.household_event_type;
-- =====================================================================

do $$ begin
  create type public.household_event_type as enum (
    'task.created', 'task.assigned', 'task.completed', 'task.reopened', 'task.cancelled',
    'care_request.created', 'care_request.accepted', 'care_request.declined',
    'shopping.item_added', 'shopping.item_checked',
    'document.shared', 'member.joined', 'member.left', 'member.rights_changed',
    'timesheet.submitted', 'timesheet.validated', 'contract.updated',
    'expense.recorded', 'stock.low', 'child.safety_updated');
exception when duplicate_object then null; end $$;

create table if not exists public.household_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type public.household_event_type not null,
  actor_id uuid,                                     -- NULL = serveur
  entity_table text not null check (entity_table ~ '^[a-z_]{2,63}$'),
  entity_id text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 8192),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 200),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed', 'skipped')),
  attempts smallint not null default 0,
  available_at timestamptz not null default now(),
  depth smallint not null default 0 check (depth >= 0),
  origin_event_id uuid references public.household_events(id) on delete set null,
  root_event_id uuid,
  last_error text check (char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists household_events_todo_idx on public.household_events(available_at) where status = 'pending';
create index if not exists household_events_household_idx on public.household_events(household_id, created_at desc);
create index if not exists household_events_origin_idx on public.household_events(origin_event_id);

-- Événement en cours de traitement dans CETTE transaction (posé par le consommateur), sinon NULL
create or replace function public._current_event_id()
returns uuid language sql stable as $$
  select nullif(current_setting('homi.event_id', true), '')::uuid;
$$;

create or replace function public._emit_household_event(
  p_household uuid, p_type public.household_event_type, p_entity_table text, p_entity_id text,
  p_payload jsonb, p_idempotency_key text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_parent public.household_events; v_depth smallint := 0; v_status text := 'pending'; v_error text;
  c_max_depth constant smallint := 3;
begin
  if p_household is null or p_idempotency_key is null then
    raise exception 'Événement incomplet (foyer et clé d''idempotence obligatoires)' using errcode = '22023';
  end if;
  -- Rejoué : même clé → même événement, rien de nouveau
  select id into v_id from public.household_events where idempotency_key = p_idempotency_key;
  if found then return v_id; end if;

  select * into v_parent from public.household_events where id = public._current_event_id();
  if found then
    v_depth := v_parent.depth + 1;
    if v_depth > c_max_depth then
      v_status := 'skipped'; v_error := 'anti-boucle : profondeur maximale atteinte';
    elsif exists (
      with recursive chain as (
        select e.id, e.type, e.entity_table, e.entity_id, e.origin_event_id, 0 as n from public.household_events e where e.id = v_parent.id
        union all
        select e.id, e.type, e.entity_table, e.entity_id, e.origin_event_id, c.n + 1 from public.household_events e join chain c on e.id = c.origin_event_id where c.n < 10)
      select 1 from chain where type = p_type and entity_table = p_entity_table and entity_id is not distinct from p_entity_id) then
      v_status := 'skipped'; v_error := 'anti-boucle : même fait déjà présent dans la chaîne d''origine';
    end if;
  end if;

  insert into public.household_events (household_id, type, actor_id, entity_table, entity_id, payload, idempotency_key,
                                        status, depth, origin_event_id, root_event_id, last_error, processed_at)
  values (p_household, p_type, auth.uid(), p_entity_table, p_entity_id, coalesce(p_payload, '{}'::jsonb), p_idempotency_key,
          v_status, v_depth, v_parent.id, coalesce(v_parent.root_event_id, v_parent.id), v_error,
          case when v_status = 'skipped' then now() end)
  on conflict (idempotency_key) do nothing
  returning id into v_id;
  if v_id is null then -- course entre deux émissions identiques : l'autre a gagné
    select id into v_id from public.household_events where idempotency_key = p_idempotency_key;
  end if;
  return v_id;
end $$;
revoke execute on function public._emit_household_event(uuid, public.household_event_type, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public._emit_household_event(uuid, public.household_event_type, text, text, jsonb, text) to service_role;

-- Consommateur (serveur) : réserve des événements à traiter sans double traitement
create or replace function public.claim_household_events(p_limit int default 50, p_types public.household_event_type[] default null)
returns setof public.household_events language sql security definer set search_path = public as $$
  update public.household_events e set status = 'processing', attempts = e.attempts + 1
  where e.id in (
    select id from public.household_events
    where status = 'pending' and available_at <= now() and (p_types is null or type = any(p_types))
    order by created_at limit greatest(1, least(coalesce(p_limit, 50), 500))
    for update skip locked)
  returning e.*;
$$;

-- Le consommateur déclare l'événement qu'il traite (même transaction) : les émissions suivantes en héritent
create or replace function public._begin_event_processing(p_event uuid)
returns void language sql as $$
  select set_config('homi.event_id', coalesce(p_event::text, ''), true);
$$;

create or replace function public.finish_household_event(p_event uuid, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.household_events set
    status = case when p_ok then 'done' when attempts >= 5 then 'failed' else 'pending' end,
    available_at = case when p_ok then available_at else now() + make_interval(mins => power(2, least(attempts, 6))::int) end,
    last_error = case when p_ok then null else left(p_error, 1000) end,
    processed_at = case when p_ok or attempts >= 5 then now() end
  where id = p_event and status = 'processing';
end $$;
revoke execute on function public.claim_household_events(int, public.household_event_type[]) from public, anon, authenticated;
revoke execute on function public.finish_household_event(uuid, boolean, text) from public, anon, authenticated;
revoke execute on function public._begin_event_processing(uuid) from public, anon, authenticated;
grant execute on function public.claim_household_events(int, public.household_event_type[]), public.finish_household_event(uuid, boolean, text),
  public._begin_event_processing(uuid) to service_role;

alter table public.household_events enable row level security;
drop policy if exists household_events_sel on public.household_events;
create policy household_events_sel on public.household_events for select to authenticated
  using (exists (select 1 from public.household_members m
                 where m.household_id = household_events.household_id and m.user_id = auth.uid() and m.role in ('owner', 'coparent')));
revoke insert, update, delete, truncate on public.household_events from anon, authenticated;
grant select on public.household_events to authenticated;

-- Exemple réel : tâche terminée → événement « task.completed » (et réouverture → « task.reopened »)
create or replace function public.family_tasks_emit_events()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_at timestamptz;
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    v_at := coalesce(new.done_at, now());
    perform public._emit_household_event(new.household_id, 'task.completed', 'family_tasks', new.id::text,
      jsonb_build_object('task_id', new.id, 'category', new.category, 'done_by', new.done_by, 'done_at', v_at,
                         'assignee_id', new.assignee_id, 'routine_id', new.routine_id),
      'task.completed:' || new.id || ':' || to_char(v_at at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US'));
  elsif tg_op = 'UPDATE' and old.status = 'done' and new.status = 'todo' then
    perform public._emit_household_event(new.household_id, 'task.reopened', 'family_tasks', new.id::text,
      jsonb_build_object('task_id', new.id),
      'task.reopened:' || new.id || ':' || to_char(coalesce(old.done_at, now()) at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US'));
  end if;
  return null;
end $$;
revoke execute on function public.family_tasks_emit_events() from public, anon, authenticated;
drop trigger if exists family_tasks_events on public.family_tasks;
create trigger family_tasks_events after insert or update of status on public.family_tasks
  for each row execute function public.family_tasks_emit_events();
