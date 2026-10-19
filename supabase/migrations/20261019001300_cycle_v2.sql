-- =====================================================================
-- Cycle v2 : suivi menstruel complet, données STRICTEMENT PERSONNELLES (user_id = auth.uid()).
--  - Flux sur 5 niveaux (les anciennes valeurs restent valides).
--  - Symptômes structurés : clés contrôlées, intensité, énergie/sommeil/stress/humeur (1–5), note, saisie à une date passée.
--  - Pertes vaginales : quantité, couleur, textures, odeur, symptômes associés, contexte facultatif, note.
--  - Saignements inhabituels : type, quantité, douleur, contexte de grossesse.
--  - Journal intime du cycle.
--  - Préférences : masquer les données sensibles de l'accueil.
-- Aucune de ces tables n'est publiée en temps réel ni lisible par le foyer ou la communauté.
-- =====================================================================

-- 1. Flux : très léger (spotting) → très abondant
alter table public.period_entries drop constraint if exists period_entries_flow_check;
alter table public.period_entries add constraint period_entries_flow_check
  check (flow is null or flow in ('spotting','light','medium','heavy','very_heavy'));
alter table public.period_entries add column if not exists updated_at timestamptz not null default now();

-- 2. Symptômes structurés (l'ancienne colonne « symptoms » reste lisible)
alter table public.symptom_logs
  add column if not exists symptom_keys text[] not null default '{}',
  add column if not exists intensities jsonb not null default '{}',
  add column if not exists mood smallint check (mood between 1 and 5),
  add column if not exists energy smallint check (energy between 1 and 5),
  add column if not exists sleep smallint check (sleep between 1 and 5),
  add column if not exists stress smallint check (stress between 1 and 5),
  add column if not exists updated_at timestamptz not null default now();
alter table public.symptom_logs add constraint symptom_logs_keys_check check (symptom_keys <@ array[
  'cramps','pelvic_pain','back_pain','pain','fatigue','headache','bloating','nausea','breast_tenderness','digestion','constipation',
  'diarrhea','skin','acne','libido_up','libido_down','dizziness','hot_flashes','cravings','insomnia','other']::text[]);
-- intensité : { "cramps": 1..3 } uniquement pour des clés présentes
create or replace function public.symptom_intensities_valid(p jsonb, p_keys text[]) returns boolean language sql immutable as $$
  select jsonb_typeof(p) = 'object' and not exists (
    select 1 from jsonb_each(p) e where not (e.key = any(p_keys)) or jsonb_typeof(e.value) <> 'number' or (e.value)::int not between 1 and 3);
$$;
alter table public.symptom_logs add constraint symptom_logs_intensities_check check (public.symptom_intensities_valid(intensities, symptom_keys));
-- (Plusieurs enregistrements le même jour restent possibles : l'application complète la fiche du jour plutôt que d'en créer une autre.)

-- 3. Pertes vaginales
create table if not exists public.discharge_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  observed_at timestamptz not null default now(),
  amount text check (amount in ('very_low','low','moderate','heavy','very_heavy','unsure')),
  color text check (color in ('clear','white','creamy_white','milky','pink','brown','yellowish','greenish','greyish','other','unsure')),
  textures text[] not null default '{}' check (textures <@ array['fluid','watery','creamy','sticky','elastic','stringy','slippery','thick','lumpy','other']::text[]),
  odor text check (odor in ('none','usual_light','stronger','unusual','unpleasant','unsure')),
  symptoms text[] not null default '{}' check (symptoms <@ array['none','itching','irritation','burning','pain','urinary','painful_sex','dryness','other']::text[]),
  recent_sex boolean,
  contraception boolean,
  pregnancy text check (pregnancy in ('no','known','possible','unknown')),
  intimate_product boolean,
  antibiotics boolean,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- une observation vide n'a pas de sens
  check (amount is not null or color is not null or odor is not null or textures <> '{}' or symptoms <> '{}' or note is not null),
  -- « aucun symptôme » ne se combine pas avec un symptôme
  check (not ('none' = any(symptoms)) or cardinality(symptoms) = 1)
);
create index if not exists discharge_logs_user_idx on public.discharge_logs(user_id, observed_at desc);
select public._apply_owner_policies('discharge_logs');
revoke all on public.discharge_logs from anon;

-- 4. Saignements inhabituels
create table if not exists public.bleeding_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occurred_on date not null,
  kind text not null check (kind in ('between_periods','after_sex','pink_brown','unknown_origin','during_pregnancy')),
  amount text check (amount in ('spotting','light','moderate','heavy','very_heavy')),
  pain boolean,
  pregnancy text check (pregnancy in ('no','known','possible','unknown')),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bleeding_logs_user_idx on public.bleeding_logs(user_id, occurred_on desc);
select public._apply_owner_policies('bleeding_logs');
revoke all on public.bleeding_logs from anon;

-- 5. Journal intime du cycle
create table if not exists public.cycle_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_on date not null,
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cycle_journal_user_idx on public.cycle_journal(user_id, entry_on desc);
select public._apply_owner_policies('cycle_journal');
revoke all on public.cycle_journal from anon;

-- 6. Préférences : masquer les données sensibles sur l'accueil
alter table public.cycle_preferences add column if not exists hide_on_home boolean not null default false;

-- Horodatage des modifications
do $$ declare t text; begin
  foreach t in array array['period_entries','symptom_logs','discharge_logs','bleeding_logs','cycle_journal'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- 7. Export RGPD : les nouvelles tables personnelles sont incluses
alter function public.export_my_data() rename to _export_my_data_v7;
revoke execute on function public._export_my_data_v7() from public, anon, authenticated;
create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v7() || jsonb_build_object(
    'discharge_logs', (select coalesce(jsonb_agg(x order by x.observed_at), '[]') from public.discharge_logs x where x.user_id = v_uid),
    'bleeding_logs', (select coalesce(jsonb_agg(x order by x.occurred_on), '[]') from public.bleeding_logs x where x.user_id = v_uid),
    'cycle_journal', (select coalesce(jsonb_agg(x order by x.entry_on), '[]') from public.cycle_journal x where x.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- 8. Effacer toutes ses données du cycle (sans supprimer le compte). Les photos chiffrées sont effacées par l'application.
create or replace function public.delete_my_cycle_data()
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  delete from public.period_entries where user_id = auth.uid();
  delete from public.symptom_logs where user_id = auth.uid();
  delete from public.discharge_logs where user_id = auth.uid();
  delete from public.bleeding_logs where user_id = auth.uid();
  delete from public.cycle_journal where user_id = auth.uid();
  delete from public.fertility_observations where user_id = auth.uid();
  delete from public.ovulation_tests where user_id = auth.uid();
  delete from public.pregnancy_tests where user_id = auth.uid();
  delete from public.intercourse_logs where user_id = auth.uid();
end $$;
revoke execute on function public.delete_my_cycle_data() from public, anon;
grant execute on function public.delete_my_cycle_data() to authenticated;
