-- =====================================================================
-- Compléments du suivi de l'enfant (ajouts non destructifs) :
--  * biberon chronométré (début, pause, reprise, fin) ;
--  * sommeil : sieste / nuit, heure de chaque réveil ;
--  * changes : couleur et consistance des selles, sang vu ;
--  * observations : vomissements, régurgitations, diarrhée, douleurs, ballonnements, pleurs ;
--  * humeur et bien-être de l'enfant ;
--  * étapes de développement par domaine ;
--  * suivi de santé configurable (mesures et observations, seuils UNIQUEMENT issus d'un plan
--    médical validé, jamais calculés ni proposés par l'application) ;
--  * registre des vaccins administrés ;
--  * liste de produits à éviter.
-- Aucune dose, aucun traitement, aucun diagnostic.
-- =====================================================================

-- ---------------------------------------------------------------- biberon chronométré
alter table public.bottles add column if not exists started_at timestamptz;
alter table public.bottles add column if not exists ended_at timestamptz;
alter table public.bottles add column if not exists paused_at timestamptz;
alter table public.bottles add column if not exists paused_seconds int not null default 0 check (paused_seconds between 0 and 86400);
alter table public.bottles add column if not exists in_progress boolean not null default false;
alter table public.bottles add constraint bottles_chrono_order check (ended_at is null or started_at is null or ended_at >= started_at);
alter table public.bottles add constraint bottles_chrono_running check (not in_progress or (started_at is not null and ended_at is null));
create unique index if not exists bottles_one_running_per_child on public.bottles(child_id) where in_progress;
comment on column public.bottles.started_at is 'Chronomètre : début de la prise (horodatage fiable, le temps écoulé est recalculé à partir de lui).';

-- ---------------------------------------------------------------- sommeil
alter table public.sleeps add column if not exists kind text check (kind in ('nap','night'));
-- [{ "at": "2026-10-18T02:10:00Z", "minutes": 15 }]
alter table public.sleeps add column if not exists wake_events jsonb not null default '[]'::jsonb
  check (jsonb_typeof(wake_events) = 'array' and jsonb_array_length(wake_events) <= 50);

-- ---------------------------------------------------------------- changes
alter table public.diapers add column if not exists stool_color text check (stool_color in ('yellow','green','brown','black','red','pale','other'));
alter table public.diapers add column if not exists stool_consistency text check (stool_consistency in ('liquid','soft','formed','hard'));
alter table public.diapers add column if not exists blood_seen boolean not null default false;

-- ---------------------------------------------------------------- observations
alter table public.child_observations drop constraint if exists child_observations_kind_check;
alter table public.child_observations add constraint child_observations_kind_check
  check (kind in ('temperature','medication','symptom','note','vomit','regurgitation','diarrhea','abdominal_pain','bloating','crying'));
alter table public.child_observations add column if not exists temp_method text check (temp_method in ('rectal','axillary','ear','forehead','other'));
alter table public.child_observations add column if not exists intensity smallint check (intensity between 1 and 3);

-- ---------------------------------------------------------------- humeur et bien-être de l'enfant
create table public.child_wellbeing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null default now(),
  mood smallint check (mood between 1 and 5),
  crying smallint check (crying between 1 and 3),
  irritability smallint check (irritability between 1 and 3),
  energy smallint check (energy between 1 and 3),
  appetite smallint check (appetite between 1 and 3),
  sleep smallint check (sleep between 1 and 3),
  digestive_comfort smallint check (digestive_comfort between 1 and 3),
  unusual_event text check (char_length(unusual_event) <= 300),
  note text check (char_length(note) <= 2000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index child_wellbeing_idx on public.child_wellbeing(child_id, at desc);
select public._apply_household_policies('child_wellbeing', 'daily');

-- ---------------------------------------------------------------- développement
alter table public.child_milestones add column if not exists domain text
  check (domain in ('motor','language','communication','social','autonomy','learning','eating','sleep','other'));

-- ---------------------------------------------------------------- suivi de santé configurable
create table public.child_health_trackers (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('measure','observation')),
  label text not null check (char_length(label) between 1 and 80),
  unit text check (char_length(unit) <= 20),
  -- Consignes écrites par le professionnel, recopiées par le parent (jamais générées)
  plan_note text check (char_length(plan_note) <= 2000),
  plan_by text check (char_length(plan_by) <= 120),
  plan_date date,
  low_threshold numeric(10,3),
  high_threshold numeric(10,3),
  thresholds_from_plan boolean not null default false,
  contexts text[] not null default '{}' check (cardinality(contexts) <= 12),
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Un seuil n'existe que s'il vient du plan validé par le professionnel de l'enfant
  check ((low_threshold is null and high_threshold is null) or (thresholds_from_plan and plan_by is not null)),
  check (low_threshold is null or high_threshold is null or low_threshold < high_threshold),
  check (kind = 'measure' or (low_threshold is null and high_threshold is null and unit is null))
);
create index child_health_trackers_idx on public.child_health_trackers(child_id);
select public._apply_household_policies('child_health_trackers', 'health');

create table public.child_health_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  tracker_id uuid not null references public.child_health_trackers(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null default now(),
  value numeric(10,3),
  context text check (char_length(context) <= 80),
  note text check (char_length(note) <= 2000),
  -- Observation du parent, donnée importée, ou information confirmée par un professionnel
  source text not null default 'parent' check (source in ('parent','imported','professional')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (value is not null or note is not null or context is not null)
);
create index child_health_entries_idx on public.child_health_entries(tracker_id, at desc);
select public._apply_household_policies('child_health_entries', 'health');

create or replace function public.child_health_entries_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare tr public.child_health_trackers;
begin
  select * into tr from public.child_health_trackers where id = new.tracker_id;
  if tr.id is null or tr.child_id <> new.child_id or tr.household_id <> new.household_id then
    raise exception 'Suivi introuvable pour cet enfant.' using errcode = '22023';
  end if;
  if tr.kind = 'observation' and new.value is not null then
    raise exception 'Ce suivi accepte des observations, pas des mesures.' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger child_health_entries_guard before insert or update on public.child_health_entries
  for each row execute function public.child_health_entries_guard();

-- ---------------------------------------------------------------- vaccins administrés (registre)
create table public.child_vaccinations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  vaccine text not null check (char_length(vaccine) between 1 and 120),
  given_on date not null,
  dose_label text check (char_length(dose_label) <= 60),
  lot text check (char_length(lot) <= 40),
  given_by text check (char_length(given_by) <= 120),
  source text not null default 'parent' check (source in ('parent','carnet','professional')),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (given_on <= current_date)
);
create index child_vaccinations_idx on public.child_vaccinations(child_id, given_on desc);
select public._apply_household_policies('child_vaccinations', 'health');

-- ---------------------------------------------------------------- produits à éviter
create table public.avoid_products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  barcode text check (barcode ~ '^[0-9]{6,14}$'),
  product_name text not null check (char_length(product_name) between 1 and 160),
  reason text check (char_length(reason) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index avoid_products_unique on public.avoid_products(household_id, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid), barcode) where barcode is not null;
select public._apply_household_policies('avoid_products', 'health');

-- Cohérence enfant / foyer pour les nouvelles tables liées à un enfant
create or replace function public.child_in_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Cet enfant ne fait pas partie du foyer.' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger child_wellbeing_child before insert or update on public.child_wellbeing for each row execute function public.child_in_household();
create trigger child_health_trackers_child before insert or update on public.child_health_trackers for each row execute function public.child_in_household();
create trigger child_vaccinations_child before insert or update on public.child_vaccinations for each row execute function public.child_in_household();
create trigger avoid_products_child before insert or update on public.avoid_products for each row execute function public.child_in_household();
