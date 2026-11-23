-- =====================================================================
-- École et activités (30/11/2026) — outils 136 « Calendrier des activités extrascolaires » et 137 « Suivi des
-- devoirs ». Écrans : src/app/child/[id]/activities.tsx, src/app/child/[id]/homework.tsx (depuis « École »),
-- agenda familial (/calendar) et journée de l'accueil. Tests : supabase/tests/sql/98zk_partiels2.sql
--
-- ADDITIF ET IDEMPOTENT.
--  1. child_activities : une activité rattachée à l'enfant (nom, lieu, créneaux hebdomadaires récurrents, période,
--     matériel, contact, rappel). Les créneaux : [{"day":1..7 (lundi = 1),"from":"HH:MM","to":"HH:MM"}], 1 à 7.
--  2. child_homework   : un devoir (matière, consigne, échéance, fait / à faire, qui l'a coché).
--  Accès : parents de l'enfant (propriétaire, co-parent, périmètre d'enfants respecté). Nounou, non-membre, ancien
--  membre : rien. Les rappels sont des rappels personnels (table reminders) posés par l'appareil.
-- Retour arrière : en fin de fichier.
-- =====================================================================

create or replace function public._activity_slots_ok(p jsonb)
returns boolean language sql immutable set search_path = public as $$
  select jsonb_typeof(p) = 'array' and jsonb_array_length(p) between 1 and 7 and not exists (
    select 1 from jsonb_array_elements(p) s
    where jsonb_typeof(s) <> 'object'
       or coalesce(s->>'day', '') !~ '^[1-7]$'
       or coalesce(s->>'from', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or coalesce(s->>'to', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or (s->>'to') <= (s->>'from'));
$$;

create table if not exists public.child_activities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  place text check (place is null or char_length(place) <= 160),
  slots jsonb not null check (public._activity_slots_ok(slots)),
  starts_on date check (starts_on is null or (starts_on >= date '2000-01-01' and starts_on < date '2100-01-01')),
  ends_on date check (ends_on is null or (ends_on >= date '2000-01-01' and ends_on < date '2100-01-01')),
  equipment text check (equipment is null or char_length(equipment) <= 300),
  contact_name text check (contact_name is null or char_length(btrim(contact_name)) between 1 and 80),
  contact_phone text check (contact_phone is null or contact_phone ~ '^[0-9+(). -]{4,30}$'),
  note text check (note is null or char_length(note) <= 500),
  reminder_minutes smallint check (reminder_minutes is null or reminder_minutes in (15, 30, 60, 120)),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index if not exists child_activities_child_idx on public.child_activities(child_id);
create index if not exists child_activities_household_idx on public.child_activities(household_id);
create index if not exists child_activities_created_by_idx on public.child_activities(created_by);

create table if not exists public.child_homework (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 60),
  instructions text not null check (char_length(btrim(instructions)) between 1 and 500),
  due_on date not null check (due_on >= date '2000-01-01' and due_on < date '2100-01-01'),
  done_at timestamptz,
  done_by uuid references auth.users(id) on delete set null,
  remind_eve boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists child_homework_child_idx on public.child_homework(child_id, due_on);
create index if not exists child_homework_household_idx on public.child_homework(household_id);
create index if not exists child_homework_created_by_idx on public.child_homework(created_by);
create index if not exists child_homework_done_by_idx on public.child_homework(done_by);

-- « Fait » : la personne qui coche est posée par le serveur ; décocher efface les deux
create or replace function public._homework_done()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.done_at is null then new.done_by := null;
  elsif tg_op = 'INSERT' or old.done_at is null then new.done_by := auth.uid();
  else new.done_by := old.done_by;
  end if;
  return new;
end $$;
drop trigger if exists child_homework_done on public.child_homework;
create trigger child_homework_done before insert or update on public.child_homework for each row execute function public._homework_done();

do $$
declare t text;
begin
  foreach t in array array['child_activities', 'child_homework'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_household', t);
    execute format('create trigger %I before insert or update of child_id on public.%I for each row execute function public.set_household_from_child()', t || '_household', t);
    execute format('drop trigger if exists %I on public.%I', t || '_keep_author', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)', t || '_keep_author', t, 'created_by');
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_parents', t);
    execute format('create policy %I on public.%I for all to authenticated using (public._is_parent_of(child_id)) with check (public._is_parent_of(child_id))', t || '_parents', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.child_homework, public.child_activities;
-- drop function if exists public._homework_done(); drop function if exists public._activity_slots_ok(jsonb);
