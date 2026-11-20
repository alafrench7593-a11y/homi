-- =====================================================================
-- Portions préparées (28/11/2026) — outil 122 « Gestion des portions préparées »
-- Écran : src/app/meals/portions.tsx ; tests : supabase/tests/sql/98zi_portions_lecture.sql,
-- src/__tests__/foyerTools.test.ts
--
-- ADDITIF ET IDEMPOTENT.
--  1. prepared_portions     : lot de portions préparées à l'avance (nom, recette de la bibliothèque facultative, enfant
--                             facultatif, nombre, date de préparation, congélateur ou réfrigérateur, date limite SAISIE
--                             par le parent — aucune durée de conservation n'est inventée ni calculée par la base).
--  2. prepared_portion_uses : chaque utilisation (une ligne, identifiant posé sur l'appareil : un envoi répété hors
--                             ligne ne décompte jamais deux fois). Le reste = nombre préparé − utilisations ; la base
--                             refuse d'utiliser plus que ce qui reste.
--  Accès : parents du foyer (propriétaire, co-parent). Nounou, non-membre, ancien membre : rien.
-- Retour arrière : en fin de fichier.
-- =====================================================================

create table if not exists public.prepared_portions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  recipe_slug text check (recipe_slug is null or recipe_slug ~ '^[a-z0-9-]{1,120}$'),
  portions_total smallint not null check (portions_total between 1 and 200),
  prepared_on date not null default current_date check (prepared_on >= date '2000-01-01' and prepared_on < date '2100-01-01'),
  storage text not null check (storage in ('freezer', 'fridge')),
  use_by date check (use_by is null or use_by < date '2100-01-01'),
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (use_by is null or use_by >= prepared_on)
);
create index if not exists prepared_portions_household_idx on public.prepared_portions(household_id, prepared_on);
create index if not exists prepared_portions_child_idx on public.prepared_portions(child_id);
create index if not exists prepared_portions_created_by_idx on public.prepared_portions(created_by);

create table if not exists public.prepared_portion_uses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  portion_id uuid not null references public.prepared_portions(id) on delete cascade,
  count smallint not null default 1 check (count between 1 and 50),
  used_at timestamptz not null default now(),
  used_by uuid default auth.uid() references auth.users(id) on delete set null
);
create index if not exists prepared_portion_uses_portion_idx on public.prepared_portion_uses(portion_id, used_at);
create index if not exists prepared_portion_uses_household_idx on public.prepared_portion_uses(household_id);
create index if not exists prepared_portion_uses_used_by_idx on public.prepared_portion_uses(used_by);

-- Lot : l'enfant est du même foyer ; le nombre préparé ne descend pas sous ce qui a déjà été utilisé
create or replace function public._prepared_portion_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_used int;
begin
  if new.child_id is not null and (tg_op = 'INSERT' or new.child_id is distinct from old.child_id)
     and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant d''un autre foyer' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(sum(count), 0) into v_used from public.prepared_portion_uses where portion_id = new.id;
    if new.portions_total < v_used then raise exception 'Moins de portions que celles déjà utilisées' using errcode = '23514'; end if;
  end if;
  return new;
end $$;
revoke execute on function public._prepared_portion_guard() from public, anon, authenticated;

-- Utilisation : foyer repris du lot ; jamais plus que ce qui reste (verrou sur le lot : deux téléphones à la fois)
create or replace function public._prepared_portion_use_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_h uuid; v_total int; v_used int;
begin
  select household_id, portions_total into v_h, v_total from public.prepared_portions where id = new.portion_id for update;
  if v_h is null then raise exception 'Lot introuvable' using errcode = '23503'; end if;
  new.household_id := v_h;
  if tg_op = 'INSERT' and auth.uid() is not null then new.used_by := auth.uid(); end if;
  if tg_op = 'UPDATE' then new.used_by := old.used_by; end if;
  select coalesce(sum(count), 0) into v_used from public.prepared_portion_uses where portion_id = new.portion_id and id <> new.id;
  if v_used + new.count > v_total then raise exception 'Plus aucune portion dans ce lot' using errcode = '23514'; end if;
  return new;
end $$;
revoke execute on function public._prepared_portion_use_guard() from public, anon, authenticated;

drop trigger if exists prepared_portions_guard on public.prepared_portions;
create trigger prepared_portions_guard before insert or update on public.prepared_portions
  for each row execute function public._prepared_portion_guard();
drop trigger if exists prepared_portions_keep_author on public.prepared_portions;
create trigger prepared_portions_keep_author before insert or update on public.prepared_portions
  for each row execute function public._keep_author('created_by');
drop trigger if exists prepared_portions_touch on public.prepared_portions;
create trigger prepared_portions_touch before update on public.prepared_portions
  for each row execute function public.touch_updated_at();
drop trigger if exists prepared_portion_uses_guard on public.prepared_portion_uses;
create trigger prepared_portion_uses_guard before insert or update on public.prepared_portion_uses
  for each row execute function public._prepared_portion_use_guard();
do $$
declare t text;
begin
  foreach t in array array['prepared_portions', 'prepared_portion_uses'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
end $$;

alter table public.prepared_portions enable row level security;
alter table public.prepared_portion_uses enable row level security;
do $$
declare t text;
begin
  foreach t in array array['prepared_portions', 'prepared_portion_uses'] loop
    execute format('drop policy if exists %I on public.%I', t || '_parents', t);
    execute format('create policy %I on public.%I for all to authenticated using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id))', t || '_parents', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.prepared_portion_uses, public.prepared_portions;
-- drop function if exists public._prepared_portion_use_guard(), public._prepared_portion_guard();
