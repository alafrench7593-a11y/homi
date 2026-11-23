-- =====================================================================
-- Développement et éducation (30/11/2026) — outils 129 « Journal du développement du langage » et 132 « Jeux
-- éducatifs adaptés à l'âge ». Écrans : src/app/child/[id]/language.tsx, src/app/child/[id]/games.tsx
-- Tests : supabase/tests/sql/98zk_partiels2.sql, src/__tests__/partiels2.test.ts
--
-- ADDITIF ET IDEMPOTENT.
--  1. child_language_entries : premiers mots, phrases, langues parlées à la maison, notes (une frise par enfant).
--     Aucune norme : la date est celle que le parent a notée.
--  2. child_game_marks       : jeu du catalogue HOMI (écrit à l'avance dans l'application, src/content/games) mis en
--     favori ou « on l'a fait » pour un enfant (une ligne par enfant et par jeu).
--  Accès : parents de l'enfant (propriétaire, co-parent, périmètre d'enfants respecté). Nounou, non-membre, ancien
--  membre : rien.
-- Retour arrière : en fin de fichier.
-- =====================================================================

create table if not exists public.child_language_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('word', 'sentence', 'language', 'note')),
  text text not null check (char_length(btrim(text)) between 1 and 200),
  language text check (language is null or char_length(btrim(language)) between 1 and 40),
  said_on date check (said_on is null or (said_on >= date '2000-01-01' and said_on < date '2100-01-01')),
  note text check (note is null or char_length(note) <= 500),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists child_language_entries_child_idx on public.child_language_entries(child_id, said_on);
create index if not exists child_language_entries_household_idx on public.child_language_entries(household_id);
create index if not exists child_language_entries_created_by_idx on public.child_language_entries(created_by);

create table if not exists public.child_game_marks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  game_key text not null check (game_key ~ '^[a-z0-9_]{2,40}$'),
  favorite boolean not null default false,
  done_count smallint not null default 0 check (done_count between 0 and 999),
  last_done_on date check (last_done_on is null or (last_done_on >= date '2000-01-01' and last_done_on < date '2100-01-01')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (done_count = 0 or last_done_on is not null)
);
create unique index if not exists child_game_marks_uniq on public.child_game_marks(child_id, game_key);
create index if not exists child_game_marks_household_idx on public.child_game_marks(household_id);
create index if not exists child_game_marks_created_by_idx on public.child_game_marks(created_by);

do $$
declare t text;
begin
  foreach t in array array['child_language_entries', 'child_game_marks'] loop
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
-- drop table if exists public.child_game_marks, public.child_language_entries;
