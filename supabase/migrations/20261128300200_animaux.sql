-- =====================================================================
-- Animaux du foyer (28/11/2026) — outil 189 « Suivi des soins et tâches pour les animaux »
-- Écrans : src/app/family/pets/* ; tests : supabase/tests/sql/98zh_animaux.sql, src/__tests__/foyerTools.test.ts
--
-- ADDITIF ET IDEMPOTENT.
--  1. pets      : fiche d'un animal (nom, espèce, date de naissance facultative, vétérinaire, notes).
--  2. pet_care  : soins (vaccin, vermifuge, antipuce, visite…) avec la date FAITE et la prochaine date, toutes deux
--                 SAISIES par le parent. Aucun calendrier vétérinaire n'est proposé ni calculé.
--  3. pet_id des tâches du foyer (family_tasks, missions) et des stocks (household_stocks) : colonne prévue sans clé
--     étrangère depuis 20261114000300 / 20261115000200. Elle devient une vraie référence (« not valid » : aucune ligne
--     existante n'est relue ni modifiée), mise à vide si l'animal est supprimé, et l'animal doit être du même foyer.
--     Les tâches récurrentes (nourrir, promener, litière) sont des missions ordinaires : mêmes règles, même historique.
--  Accès : parents du foyer (propriétaire, co-parent). Une nounou, un non-membre, un ancien membre : rien.
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Fiches
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  species text not null check (species in ('dog', 'cat', 'rabbit', 'rodent', 'bird', 'fish', 'reptile', 'other')),
  birth_date date check (birth_date is null or (birth_date >= date '1970-01-01' and birth_date <= current_date + 1)),
  vet_name text check (vet_name is null or char_length(vet_name) <= 80),
  vet_phone text check (vet_phone is null or char_length(vet_phone) <= 40),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pets_household_idx on public.pets(household_id, created_at);
create index if not exists pets_created_by_idx on public.pets(created_by);

-- ---------------------------------------------------------------- 2. Soins et rappels (dates saisies)
create table if not exists public.pet_care (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  kind text not null check (kind in ('vaccine', 'deworming', 'flea', 'vet', 'grooming', 'other')),
  label text check (label is null or char_length(btrim(label)) between 1 and 80),
  done_on date check (done_on is null or (done_on >= date '1970-01-01' and done_on < date '2100-01-01')),
  next_due date check (next_due is null or (next_due >= date '1970-01-01' and next_due < date '2100-01-01')),
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (done_on is not null or next_due is not null)
);
create index if not exists pet_care_pet_idx on public.pet_care(pet_id, next_due);
create index if not exists pet_care_household_idx on public.pet_care(household_id);
create index if not exists pet_care_created_by_idx on public.pet_care(created_by);

-- Soin : foyer repris de l'animal (jamais celui envoyé)
create or replace function public._pet_care_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.pets where id = new.pet_id;
  if new.household_id is null then raise exception 'Animal introuvable' using errcode = '23503'; end if;
  return new;
end $$;
revoke execute on function public._pet_care_household() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['pets', 'pet_care'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_keep_author', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)', t || '_keep_author', t, 'created_by');
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;
drop trigger if exists pet_care_household on public.pet_care;
create trigger pet_care_household before insert or update of pet_id, household_id on public.pet_care
  for each row execute function public._pet_care_household();

alter table public.pets enable row level security;
alter table public.pet_care enable row level security;
do $$
declare t text;
begin
  foreach t in array array['pets', 'pet_care'] loop
    execute format('drop policy if exists %I on public.%I', t || '_parents', t);
    execute format('create policy %I on public.%I for all to authenticated using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id))', t || '_parents', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- 3. pet_id des missions et des stocks
-- Référence réelle (les lignes existantes ne sont pas relues : « not valid »), mise à vide à la suppression de l'animal.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'family_tasks_pet_id_fkey' and conrelid = 'public.family_tasks'::regclass) then
    alter table public.family_tasks add constraint family_tasks_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'household_stocks_pet_id_fkey' and conrelid = 'public.household_stocks'::regclass) then
    alter table public.household_stocks add constraint household_stocks_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete set null not valid;
  end if;
end $$;
create index if not exists family_tasks_pet_idx on public.family_tasks(pet_id) where pet_id is not null;
create index if not exists household_stocks_pet_idx on public.household_stocks(pet_id) where pet_id is not null;

-- L'animal rattaché à une mission ou à un stock est du même foyer (vérifié quand la valeur change)
create or replace function public._pet_same_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pet_id is not null and (tg_op = 'INSERT' or new.pet_id is distinct from old.pet_id)
     and not exists (select 1 from public.pets p where p.id = new.pet_id and p.household_id = new.household_id) then
    raise exception 'Animal d''un autre foyer' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._pet_same_household() from public, anon, authenticated;
drop trigger if exists family_tasks_pet_guard on public.family_tasks;
create trigger family_tasks_pet_guard before insert or update of pet_id on public.family_tasks
  for each row execute function public._pet_same_household();
drop trigger if exists household_stocks_pet_guard on public.household_stocks;
create trigger household_stocks_pet_guard before insert or update of pet_id on public.household_stocks
  for each row execute function public._pet_same_household();

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop trigger if exists family_tasks_pet_guard on public.family_tasks;
-- drop trigger if exists household_stocks_pet_guard on public.household_stocks;
-- alter table public.family_tasks drop constraint if exists family_tasks_pet_id_fkey;
-- alter table public.household_stocks drop constraint if exists household_stocks_pet_id_fkey;
-- drop table if exists public.pet_care, public.pets;
-- drop function if exists public._pet_same_household(), public._pet_care_household();
