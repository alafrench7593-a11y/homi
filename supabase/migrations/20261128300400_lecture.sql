-- =====================================================================
-- Lecture (28/11/2026) — outils 133 « Suivi des habitudes de lecture » et 134 « Bibliothèque d'histoires »
-- Écrans : src/app/reading/* ; tests : supabase/tests/sql/98zi_portions_lecture.sql, src/__tests__/foyerTools.test.ts
--
-- ADDITIF ET IDEMPOTENT.
--  1. reading_logs      : une lecture par enfant (livre ou histoire de la bibliothèque HOMI, date, durée facultative,
--                         qui a lu — un adulte du foyer ou un nom libre —, réaction de l'enfant, note).
--  2. reading_favorites : livres préférés d'un enfant (un titre une seule fois par enfant).
--  Les histoires de la bibliothèque sont écrites à l'avance dans l'application (src/content/stories) : aucune table.
--  Accès : parents de l'enfant (propriétaire, co-parent, périmètre d'enfants respecté). Nounou, non-membre, ancien
--  membre : rien.
-- Retour arrière : en fin de fichier.
-- =====================================================================

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  story_key text check (story_key is null or story_key ~ '^[a-z0-9_-]{1,40}$'),
  read_on date not null default current_date check (read_on >= date '2000-01-01' and read_on < date '2100-01-01'),
  minutes smallint check (minutes is null or minutes between 1 and 300),
  reader_id uuid references auth.users(id) on delete set null,
  reader_label text check (reader_label is null or char_length(btrim(reader_label)) between 1 and 40),
  reaction text check (reaction is null or reaction in ('loved', 'liked', 'calm', 'not_today')),
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reading_logs_child_idx on public.reading_logs(child_id, read_on);
create index if not exists reading_logs_household_idx on public.reading_logs(household_id);
create index if not exists reading_logs_reader_idx on public.reading_logs(reader_id);
create index if not exists reading_logs_created_by_idx on public.reading_logs(created_by);

create table if not exists public.reading_favorites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists reading_favorites_uniq on public.reading_favorites(child_id, lower(btrim(title)));
create index if not exists reading_favorites_household_idx on public.reading_favorites(household_id);
create index if not exists reading_favorites_created_by_idx on public.reading_favorites(created_by);

-- Lecteur : un adulte du foyer (jamais une personne extérieure)
create or replace function public._reading_reader_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reader_id is not null and (tg_op = 'INSERT' or new.reader_id is distinct from old.reader_id)
     and not exists (select 1 from public.household_members m where m.household_id = new.household_id and m.user_id = new.reader_id) then
    raise exception 'Lecteur hors du foyer' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._reading_reader_guard() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['reading_logs', 'reading_favorites'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_household', t);
    execute format('create trigger %I before insert or update of child_id on public.%I for each row execute function public.set_household_from_child()', t || '_household', t);
    execute format('drop trigger if exists %I on public.%I', t || '_keep_author', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)', t || '_keep_author', t, 'created_by');
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
end $$;
drop trigger if exists reading_logs_touch on public.reading_logs;
create trigger reading_logs_touch before update on public.reading_logs for each row execute function public.touch_updated_at();
-- après le rattachement au foyer (ordre alphabétique des déclencheurs : « z »)
drop trigger if exists reading_logs_zreader on public.reading_logs;
create trigger reading_logs_zreader before insert or update on public.reading_logs
  for each row execute function public._reading_reader_guard();

alter table public.reading_logs enable row level security;
alter table public.reading_favorites enable row level security;
do $$
declare t text;
begin
  foreach t in array array['reading_logs', 'reading_favorites'] loop
    execute format('drop policy if exists %I on public.%I', t || '_parents', t);
    execute format('create policy %I on public.%I for all to authenticated using (public._is_parent_of(child_id)) with check (public._is_parent_of(child_id))', t || '_parents', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.reading_favorites, public.reading_logs;
-- drop function if exists public._reading_reader_guard();
