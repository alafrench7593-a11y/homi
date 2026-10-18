-- =====================================================================
-- Agenda familial : événements du foyer (activités, routines, courses,
-- dates importantes…), avec récurrence simple. Les rendez-vous, tâches et
-- relais existants sont affichés à côté, sans être dupliqués.
-- Domaine de permission : « lists » (Listes et organisation).
-- =====================================================================
create table public.family_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  kind text not null default 'custom' check (kind in ('activity','routine','shopping','important','school','custom')),
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location_label text check (char_length(location_label) <= 160),
  notes text check (char_length(notes) <= 2000),
  -- { "type": "daily"|"weekly"|"monthly", "every": 1..12, "until": "AAAA-MM-JJ" }
  recurrence jsonb check (recurrence is null or (recurrence ? 'type' and recurrence->>'type' in ('daily','weekly','monthly')
                          and coalesce((recurrence->>'every')::int, 1) between 1 and 12)),
  timezone text not null default 'Europe/Paris' check (char_length(timezone) <= 64),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  check (ends_at is null or ends_at - starts_at <= interval '14 days')
);
create index family_events_household_idx on public.family_events(household_id, starts_at);
select public._apply_household_policies('family_events', 'lists');

create or replace function public.family_events_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Cet enfant ne fait pas partie du foyer.' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then
    if new.household_id <> old.household_id then raise exception 'Un événement ne change pas de foyer.' using errcode = '22023'; end if;
    new.updated_at := now(); new.updated_by := auth.uid();
  end if;
  return new;
end $$;
create trigger family_events_touch before insert or update on public.family_events
  for each row execute function public.family_events_touch();
