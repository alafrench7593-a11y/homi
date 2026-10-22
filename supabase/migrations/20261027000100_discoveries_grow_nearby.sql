-- =====================================================================
-- « Ses découvertes » (carnet de diversification), « Je grandis » (étapes du développement), « Près de chez moi ».
--  · food_introductions (existant) devient la fiche de chaque aliment de l'enfant : statut (pas encore proposé,
--    goûté, apprécié, refusé pour le moment), réaction observée, texture, préparation, note, favori. Les lignes
--    existantes restent valides (statut « goûté »).
--  · food_tastings : historique de chaque fois où l'aliment est proposé (jamais effacé par une mise à jour).
--  · Version gratuite : un nombre limité d'aliments suivis par enfant (plan_limits.food_discoveries_per_child) ;
--    les aliments déjà notés restent toujours lisibles et modifiables (remplace la restriction Premium totale).
--  · development_steps : catalogue des étapes (clé, catégorie, repère d'âge général, étape principale) publié par
--    l'application, modifiable par l'administration ; child_steps : ce que le parent a observé pour chaque enfant.
--    Les étapes non principales (suivi complet) sont Premium, vérifié ici ; « je ne souhaite pas la suivre » est
--    toujours possible.
--  · place_favorites : lieux publics enregistrés par la personne (strictement personnels : jamais visibles du
--    foyer ni des autres membres) ; place_reports : signalement d'une information incorrecte (lu par la modération).
--    Aucune position de la personne n'est enregistrée.
-- Retour arrière :
--   drop table public.food_tastings, public.child_steps, public.development_steps, public.place_favorites, public.place_reports;
--   alter table public.food_introductions drop column food_key, drop column status, drop column reaction, drop column texture,
--     drop column preparation, drop column note, drop column favorite, drop column updated_at;
--   (rétablir le déclencheur food_introductions_premium et export_my_data : _export_my_data_v16)
-- =====================================================================

-- 1. Fiche de chaque aliment
alter table public.food_introductions alter column first_tried_on drop not null;
alter table public.food_introductions add column if not exists food_key text check (food_key is null or food_key ~ '^[a-z0-9_]{2,40}$');
alter table public.food_introductions add column if not exists status text not null default 'tasted' check (status in ('not_yet','tasted','liked','refused'));
alter table public.food_introductions add column if not exists reaction boolean not null default false;
alter table public.food_introductions add column if not exists texture text check (texture is null or texture in ('smooth','mashed','soft_pieces','pieces','family'));
alter table public.food_introductions add column if not exists preparation text check (preparation is null or char_length(preparation) <= 120);
alter table public.food_introductions add column if not exists note text check (note is null or char_length(note) <= 1000);
alter table public.food_introductions add column if not exists favorite boolean not null default false;
alter table public.food_introductions add column if not exists created_at timestamptz not null default now();
alter table public.food_introductions add column if not exists updated_at timestamptz not null default now();
create unique index if not exists food_introductions_key_uidx on public.food_introductions(child_id, food_key) where food_key is not null;
-- Un aliment goûté a une date de découverte
alter table public.food_introductions drop constraint if exists food_introductions_date_when_tried;
alter table public.food_introductions add constraint food_introductions_date_when_tried check (status = 'not_yet' or first_tried_on is not null);

-- Quota gratuit (remplace la fonction Premium totale) : on peut toujours lire, modifier et supprimer
insert into public.plan_limits (key, free_value, premium_value, description) values
  ('food_discoveries_per_child', 15, 1000, 'Aliments suivis par enfant dans « Ses découvertes »')
on conflict (key) do update set free_value = excluded.free_value, premium_value = excluded.premium_value, description = excluded.description;
drop trigger if exists food_introductions_premium on public.food_introductions;
create or replace function public.enforce_food_discoveries()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  select count(*) into v_count from public.food_introductions where child_id = new.child_id;
  if v_count >= public.plan_limit('food_discoveries_per_child', auth.uid()) then
    raise exception 'Limite de la version gratuite atteinte (food_discoveries_per_child)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists food_introductions_quota on public.food_introductions;
create trigger food_introductions_quota before insert on public.food_introductions for each row execute function public.enforce_food_discoveries();
drop trigger if exists food_introductions_child on public.food_introductions;
create trigger food_introductions_child before insert or update on public.food_introductions for each row execute function public.child_in_household();

-- 2. Historique des propositions
create table if not exists public.food_tastings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  food_key text check (food_key is null or food_key ~ '^[a-z0-9_]{2,40}$'),
  food_name text not null check (char_length(food_name) between 1 and 60),
  tasted_on date not null,
  status text not null check (status in ('tasted','liked','refused')),
  reaction boolean not null default false,
  reaction_note text check (reaction_note is null or char_length(reaction_note) <= 1000),
  texture text check (texture is null or texture in ('smooth','mashed','soft_pieces','pieces','family')),
  preparation text check (preparation is null or char_length(preparation) <= 120),
  note text check (note is null or char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists food_tastings_idx on public.food_tastings(child_id, tasted_on desc);
select public._apply_household_policies('food_tastings', 'daily');
drop trigger if exists food_tastings_child on public.food_tastings;
create trigger food_tastings_child before insert or update on public.food_tastings for each row execute function public.child_in_household();

-- 3. Étapes du développement
create table if not exists public.development_steps (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  category text not null check (category in ('gross_motor','fine_motor','communication','language','social','emotions','awakening','autonomy','eating','sleep')),
  around_from smallint not null check (around_from between 0 and 120),
  around_to smallint not null check (around_to between 0 and 120),
  main boolean not null default false,
  updated_on date not null default current_date,
  check (around_to >= around_from)
);
alter table public.development_steps enable row level security;
drop policy if exists development_steps_read on public.development_steps;
create policy development_steps_read on public.development_steps for select to authenticated using (true);
drop policy if exists development_steps_admin on public.development_steps;
create policy development_steps_admin on public.development_steps for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
insert into public.development_steps (key, category, around_from, around_to, main) values
  ('lifts_head', 'gross_motor', 1, 3, true),
  ('holds_head', 'gross_motor', 3, 4, true),
  ('rolls_over', 'gross_motor', 5, 7, true),
  ('sits_supported', 'gross_motor', 6, 7, false),
  ('sits_alone', 'gross_motor', 6, 9, true),
  ('moves_around', 'gross_motor', 9, 12, true),
  ('stands_up', 'gross_motor', 10, 12, false),
  ('walks', 'gross_motor', 12, 18, true),
  ('climbs_stairs', 'gross_motor', 16, 24, false),
  ('kicks_ball', 'gross_motor', 23, 30, false),
  ('grasps', 'fine_motor', 3, 6, true),
  ('hand_to_hand', 'fine_motor', 6, 8, true),
  ('empties_fills', 'fine_motor', 9, 12, false),
  ('smiles', 'communication', 1, 2, true),
  ('reacts_voice', 'communication', 2, 3, false),
  ('makes_sounds', 'communication', 2, 6, true),
  ('name', 'communication', 5, 9, true),
  ('waves_bye', 'communication', 8, 12, false),
  ('points', 'communication', 10, 14, true),
  ('first_words', 'language', 9, 14, true),
  ('understands_simple', 'language', 11, 14, false),
  ('says_words', 'language', 16, 20, true),
  ('two_words', 'language', 18, 24, true),
  ('sentences', 'language', 24, 36, true),
  ('familiar_people', 'social', 3, 5, true),
  ('strangers', 'social', 5, 9, false),
  ('imitates', 'social', 11, 18, true),
  ('plays_with_adult', 'social', 23, 30, true),
  ('shows_emotions', 'emotions', 2, 4, true),
  ('laughs', 'emotions', 3, 5, true),
  ('soothed_voice', 'emotions', 4, 6, false),
  ('says_no', 'emotions', 12, 24, false),
  ('mirror', 'awakening', 5, 7, false),
  ('throws_toys', 'awakening', 8, 11, false),
  ('explores', 'awakening', 11, 14, true),
  ('stories', 'awakening', 16, 20, true),
  ('says_me', 'autonomy', 18, 24, false),
  ('spoon_alone', 'autonomy', 22, 26, true),
  ('potty_interest', 'autonomy', 18, 30, true),
  ('food_interest', 'eating', 4, 6, true),
  ('soft_pieces', 'eating', 8, 10, true),
  ('crunchy_pieces', 'eating', 10, 14, false),
  ('longer_nights', 'sleep', 4, 6, true),
  ('two_naps', 'sleep', 10, 14, false),
  ('one_nap', 'sleep', 18, 36, true)
on conflict (key) do update set category = excluded.category, around_from = excluded.around_from, around_to = excluded.around_to, main = excluded.main, updated_on = current_date;

create table if not exists public.child_steps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  step_key text not null references public.development_steps(key) on update cascade,
  status text not null check (status in ('observed','in_progress','not_yet','not_tracked')),
  observed_on date,
  note text check (note is null or char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (child_id, step_key)
);
create index if not exists child_steps_idx on public.child_steps(child_id, updated_at desc);
select public._apply_household_policies('child_steps', 'profile');
drop trigger if exists child_steps_child on public.child_steps;
create trigger child_steps_child before insert or update on public.child_steps for each row execute function public.child_in_household();
-- Suivi complet (étapes non principales) : Premium ; « je ne souhaite pas la suivre » reste toujours possible
create or replace function public.child_steps_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'not_tracked'
     and not coalesce((select main from public.development_steps where key = new.step_key), false)
     and not public.has_premium(auth.uid()) then
    raise exception 'Fonction Premium (development_full)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists child_steps_premium on public.child_steps;
create trigger child_steps_premium before insert or update of status on public.child_steps for each row execute function public.child_steps_premium();

-- 4. Près de chez moi : favoris personnels et signalements (aucune position de la personne)
create table if not exists public.place_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null check (place_id ~ '^[a-z]+:[A-Za-z0-9/_.-]{1,80}$'),
  name text not null check (char_length(name) between 1 and 160),
  kind text not null check (kind ~ '^[a-z_]{2,40}$'),
  address text check (address is null or char_length(address) <= 240),
  lat double precision check (lat is null or lat between -90 and 90),
  lon double precision check (lon is null or lon between -180 and 180),
  source text check (source is null or char_length(source) <= 120),
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);
select public._apply_owner_policies('place_favorites');

create table if not exists public.place_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null check (place_id ~ '^[a-z]+:[A-Za-z0-9/_.-]{1,80}$'),
  place_name text not null check (char_length(place_name) between 1 and 160),
  reason text not null check (reason in ('closed','hours','address','contact','accessibility','not_family','other')),
  comment text check (comment is null or char_length(comment) <= 1000),
  status text not null default 'open' check (status in ('open','fixed','dismissed')),
  created_at timestamptz not null default now()
);
select public._apply_owner_policies('place_reports');
drop policy if exists place_reports_admin on public.place_reports;
create policy place_reports_admin on public.place_reports for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- 5. Export RGPD
alter function public.export_my_data() rename to _export_my_data_v16;
revoke execute on function public._export_my_data_v16() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public._export_my_data_v16() || jsonb_build_object(
    'food_tastings', (select coalesce(jsonb_agg(to_jsonb(t) order by t.tasted_on), '[]') from public.food_tastings t
      where public.can_access_household(t.household_id, 'daily', false)),
    'child_steps', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.child_steps s
      where public.can_access_household(s.household_id, 'profile', false)),
    'place_favorites', (select coalesce(jsonb_agg(to_jsonb(f)), '[]') from public.place_favorites f where f.user_id = auth.uid()),
    'place_reports', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from public.place_reports r where r.user_id = auth.uid()));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
