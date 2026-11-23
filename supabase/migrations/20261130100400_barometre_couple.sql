-- =====================================================================
-- Baromètre du couple (30/11/2026) — outil 177. Écran : src/app/family/couple.tsx (« Point de couple »).
-- Tests : supabase/tests/sql/98zk_partiels2.sql
--
-- ADDITIF ET IDEMPOTENT. Une jauge hebdomadaire FACULTATIVE et PERSONNELLE : chacun dit « comment je vis notre
-- semaine » (5 positions décrites par des mots, jamais un score), avec un mot facultatif. Privée par défaut ;
-- partagée seulement si la personne le choisit. Aucune moyenne, aucun écart, aucune comparaison entre partenaires
-- n'est calculé (ni ici, ni dans l'application).
-- Accès : chacun lit SES jauges et celles que l'autre parent a PARTAGÉES ; il faut être parent actif du foyer
-- (propriétaire ou co-parent), et l'autrice ou l'auteur aussi. Nounou, non-membre, ancien membre : rien.
-- Retour arrière : en fin de fichier.
-- =====================================================================
create table if not exists public.couple_barometer (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_of date not null check (extract(isodow from week_of) = 1 and week_of >= date '2020-01-01' and week_of < date '2100-01-01'),
  level smallint not null check (level between 1 and 5),
  word text check (word is null or char_length(btrim(word)) between 1 and 200),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists couple_barometer_uniq on public.couple_barometer(household_id, user_id, week_of);
create index if not exists couple_barometer_user_idx on public.couple_barometer(user_id);

-- L'autrice ou l'auteur ne change jamais (une jauge ne peut pas être attribuée à l'autre)
create or replace function public._couple_barometer_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id or new.household_id is distinct from old.household_id) then
    raise exception 'Jauge : autrice et foyer non modifiables' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists couple_barometer_guard on public.couple_barometer;
create trigger couple_barometer_guard before update on public.couple_barometer for each row execute function public._couple_barometer_guard();
drop trigger if exists couple_barometer_touch on public.couple_barometer;
create trigger couple_barometer_touch before update on public.couple_barometer for each row execute function public.touch_updated_at();

alter table public.couple_barometer enable row level security;
drop policy if exists couple_barometer_read on public.couple_barometer;
create policy couple_barometer_read on public.couple_barometer for select to authenticated
  using (public._is_parent_in(household_id) and (user_id = auth.uid() or (shared and public._is_parent_in(household_id, user_id))));
drop policy if exists couple_barometer_write on public.couple_barometer;
create policy couple_barometer_write on public.couple_barometer for insert to authenticated
  with check (user_id = auth.uid() and public._is_parent_in(household_id));
drop policy if exists couple_barometer_update on public.couple_barometer;
create policy couple_barometer_update on public.couple_barometer for update to authenticated
  using (user_id = auth.uid() and public._is_parent_in(household_id)) with check (user_id = auth.uid() and public._is_parent_in(household_id));
drop policy if exists couple_barometer_delete on public.couple_barometer;
create policy couple_barometer_delete on public.couple_barometer for delete to authenticated
  using (user_id = auth.uid() and public._is_parent_in(household_id));
grant select, insert, update, delete on public.couple_barometer to authenticated;
revoke all on public.couple_barometer from anon;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.couple_barometer; drop function if exists public._couple_barometer_guard();
