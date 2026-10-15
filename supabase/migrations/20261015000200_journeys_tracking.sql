-- =====================================================================
-- Toi & Moi — 0002 Parcours, grossesses, enfants et suivi quotidien
-- Deux familles de tables :
--   * données du FOYER (bébé, enfants, rendez-vous, listes, documents)
--     -> partageables avec un coparent selon un domaine de permission ;
--   * données PERSONNELLES (cycle, tests, poids, humeur)
--     -> visibles uniquement par la personne concernée.
-- =====================================================================

-- Génère les 4 politiques standard d'une table de foyer
create or replace function public._apply_household_policies(p_table text, p_domain text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format('create policy %I on public.%I for select to authenticated using (public.can_access_household(household_id, %L, false))', p_table||'_sel', p_table, p_domain);
  execute format('create policy %I on public.%I for insert to authenticated with check (public.can_access_household(household_id, %L, true))', p_table||'_ins', p_table, p_domain);
  execute format('create policy %I on public.%I for update to authenticated using (public.can_access_household(household_id, %L, true)) with check (public.can_access_household(household_id, %L, true))', p_table||'_upd', p_table, p_domain, p_domain);
  execute format('create policy %I on public.%I for delete to authenticated using (public.can_access_household(household_id, %L, true))', p_table||'_del', p_table, p_domain);
end $$;

-- Politiques d'une table strictement personnelle
create or replace function public._apply_owner_policies(p_table text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', p_table||'_owner', p_table);
end $$;

-- =====================================================================
-- Grossesses et bébés attendus
-- =====================================================================
create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  carrier_user_id uuid references auth.users(id) on delete set null,
  due_date date not null,
  lmp_date date,
  due_date_source text not null default 'due_date' check (due_date_source in ('due_date','lmp','professional')),
  multiplicity text not null default 'single' check (multiplicity in ('single','twins','triplets','more','unknown')),
  status text not null default 'active' check (status in ('active','born','ended')),
  reminders_wanted text[] not null default '{}',
  topics text[] not null default '{}',
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lmp_date is null or lmp_date < due_date)
);
create index pregnancies_household_idx on public.pregnancies(household_id) where status = 'active';
create trigger pregnancies_touch before update on public.pregnancies for each row execute function public.touch_updated_at();

create table public.expected_babies (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  nickname text check (char_length(nickname) <= 40),
  notes text check (char_length(notes) <= 4000),
  unique (pregnancy_id, position)
);

-- =====================================================================
-- Enfants
-- =====================================================================
create table public.children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  birth_date date not null check (birth_date > date '1990-01-01'),
  sex text check (sex in ('female','male','unspecified')),
  photo_path text,
  from_pregnancy_id uuid references public.pregnancies(id) on delete set null,
  multiple_group uuid,
  enabled_tracking text[] not null default array['breastfeed','bottle','diaper','sleep','meal','growth']::text[],
  allergies_declared text[] not null default '{}',
  habits text check (char_length(habits) <= 4000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_household_idx on public.children(household_id) where not archived;
create trigger children_touch before update on public.children for each row execute function public.touch_updated_at();

-- Le household_id des tables filles est TOUJOURS recopié depuis le parent :
-- impossible de rattacher une donnée à un foyer étranger.
create or replace function public.set_household_from_child()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.children where id = new.child_id;
  if new.household_id is null then raise exception 'Enfant introuvable' using errcode = '23503'; end if;
  return new;
end $$;

create or replace function public.set_household_from_pregnancy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.pregnancies where id = new.pregnancy_id;
  if new.household_id is null then raise exception 'Grossesse introuvable' using errcode = '23503'; end if;
  return new;
end $$;

create trigger expected_babies_household before insert or update of pregnancy_id on public.expected_babies
  for each row execute function public.set_household_from_pregnancy();

create table public.child_measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5,3) check (weight_kg between 0.3 and 80),
  height_cm numeric(5,1) check (height_cm between 20 and 180),
  head_cm numeric(4,1) check (head_cm between 20 and 65),
  source text not null default 'home' check (source in ('home','professional')),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (weight_kg is not null or height_cm is not null or head_cm is not null)
);
create index child_measurements_idx on public.child_measurements(child_id, measured_on desc);

create table public.child_milestones (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('milestone','memory','tooth','learning','habit')),
  title text not null check (char_length(title) between 1 and 120),
  happened_on date,
  note text check (char_length(note) <= 4000),
  created_at timestamptz not null default now()
);
create index child_milestones_idx on public.child_milestones(child_id, happened_on desc);

-- Allergies déclarées, traitements prescrits saisis, vaccins à vérifier, contacts utiles
create table public.child_health_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('vaccine_to_check','allergy','treatment','contact')),
  label text not null check (char_length(label) between 1 and 160),
  details text check (char_length(details) <= 2000),
  due_on date,
  done_on date,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Suivi quotidien (client_id = idempotence pour la synchro hors ligne)
-- =====================================================================
create table public.breastfeeds (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  side text not null check (side in ('left','right','both')),
  started_at timestamptz not null,
  ended_at timestamptz,
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.pumpings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null,
  amount_ml int not null check (amount_ml between 0 and 1000),
  side text check (side in ('left','right','both')),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.bottles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null,
  prepared_ml int check (prepared_ml between 0 and 500),
  consumed_ml int check (consumed_ml between 0 and 500),
  milk_type text check (char_length(milk_type) <= 80),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (prepared_ml is null or consumed_ml is null or consumed_ml <= prepared_ml)
);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  is_major_allergen boolean not null default false,
  allergen_group text,
  source text,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null,
  description text check (char_length(description) <= 500),
  foods text[] not null default '{}',
  texture text check (texture in ('smooth','mashed','pieces','family')),
  reaction_note text check (char_length(reaction_note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.food_introductions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  food_name text not null,
  first_tried_on date not null,
  reaction_note text check (char_length(reaction_note) <= 1000),
  unique (child_id, food_name)
);

create table public.diapers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null,
  wet boolean not null default false,
  stool boolean not null default false,
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (wet or stool or note is not null)
);

create table public.sleeps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  wakeups smallint not null default 0 check (wakeups between 0 and 50),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
-- Un seul sommeil « en cours » par enfant
create unique index sleeps_one_open_per_child on public.sleeps(child_id) where ended_at is null;

-- Température, médicament déjà prescrit, symptôme observé, note
create table public.child_observations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  at timestamptz not null,
  kind text not null check (kind in ('temperature','medication','symptom','note')),
  value_num numeric(5,2),
  label text check (char_length(label) <= 160),
  note text check (char_length(note) <= 2000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind <> 'temperature' or value_num between 30 and 45)
);

do $$
declare t text;
begin
  foreach t in array array['child_measurements','child_milestones','child_health_items','breastfeeds','pumpings',
                           'bottles','meals','food_introductions','diapers','sleeps','child_observations'] loop
    execute format('create trigger %I before insert or update of child_id on public.%I for each row execute function public.set_household_from_child()', t||'_household', t);
    execute format('create index %I on public.%I(household_id)', t||'_household_idx', t);
  end loop;
  foreach t in array array['bottles','meals','diapers','child_observations','pumpings'] loop
    execute format('create index %I on public.%I(child_id, at desc)', t||'_child_at_idx', t);
  end loop;
end $$;
create index breastfeeds_child_started on public.breastfeeds(child_id, started_at desc);
create index sleeps_child_started on public.sleeps(child_id, started_at desc);

-- =====================================================================
-- Données personnelles (cycle, tests, poids, humeur)
-- =====================================================================
create table public.period_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow text check (flow in ('light','medium','heavy')),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  unique (user_id, start_date)
);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null,
  symptoms text[] not null default '{}',
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table public.ovulation_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tested_at timestamptz not null,
  result text not null check (result in ('negative','positive','peak','invalid')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table public.pregnancy_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tested_at timestamptz not null,
  result text not null check (result in ('negative','positive','faint','invalid')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table public.maternal_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  measured_on date not null,
  weight_kg numeric(5,2) not null check (weight_kg between 25 and 300),
  note text check (char_length(note) <= 1000),
  professional_note text check (char_length(professional_note) <= 1000),
  created_at timestamptz not null default now()
);
create index maternal_weights_idx on public.maternal_weights(user_id, measured_on desc);

create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  checked_at timestamptz not null default now(),
  mood smallint not null check (mood between 1 and 5),
  feelings text[] not null default '{}',
  safety_concern boolean not null default false,
  journal text check (char_length(journal) <= 6000),
  created_at timestamptz not null default now()
);
create index mood_checkins_idx on public.mood_checkins(user_id, checked_at desc);

select public._apply_owner_policies(t) from unnest(array[
  'period_entries','symptom_logs','ovulation_tests','pregnancy_tests','maternal_weights','mood_checkins']) t;

-- =====================================================================
-- Rendez-vous, notes, listes, documents, prénoms
-- =====================================================================
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  for_parent boolean not null default false,
  kind text not null check (kind in ('consultation','ultrasound','exam','blood_test','pediatric','postnatal','vaccination','perineal_rehab','other')),
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  location_label text check (char_length(location_label) <= 160),
  notes text check (char_length(notes) <= 4000),
  questions text[] not null default '{}',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index appointments_upcoming_idx on public.appointments(household_id, starts_at);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete cascade,
  expected_baby_id uuid references public.expected_babies(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  private_to_author boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete cascade,
  kind text not null check (kind in ('maternity_bag','baby_items','home','admin','purchases','coparent','siblings','multiples','custom')),
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  done boolean not null default false,
  done_by uuid references auth.users(id) on delete set null,
  position int not null default 0,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index checklist_items_idx on public.checklist_items(checklist_id, position);

create or replace function public.set_household_from_checklist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.checklists where id = new.checklist_id;
  if new.household_id is null then raise exception 'Liste introuvable' using errcode = '23503'; end if;
  return new;
end $$;
create trigger checklist_items_household before insert or update of checklist_id on public.checklist_items
  for each row execute function public.set_household_from_checklist();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  child_id uuid references public.children(id) on delete set null,
  category text not null check (category in ('ultrasound','report','blood_test','prescription','letter','photo','other')),
  title text not null check (char_length(title) between 1 and 120),
  doc_date date,
  notes text check (char_length(notes) <= 4000),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/heic','image/webp')),
  size_bytes int not null check (size_bytes between 1 and 26214400),
  private_to_uploader boolean not null default false,
  created_at timestamptz not null default now()
);
create index documents_household_idx on public.documents(household_id, created_at desc);

-- Extraction automatique : toujours « à vérifier » tant que la personne n'a pas confirmé
create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  fields jsonb not null default '{}',
  status text not null default 'to_verify' check (status in ('to_verify','verified','rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.set_household_from_document()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.documents where id = new.document_id;
  if new.household_id is null then raise exception 'Document introuvable' using errcode = '23503'; end if;
  return new;
end $$;
create trigger document_extractions_household before insert on public.document_extractions
  for each row execute function public.set_household_from_document();

create table public.baby_names (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  usage text[] not null check (usage <@ array['feminine','masculine','mixed']::text[]),
  origin text,
  meaning text,
  popularity_rank int,
  popularity_source text,
  created_at timestamptz not null default now()
);

create table public.name_favorites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  list_label text not null default 'Favoris',
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, list_label, name)
);

create table public.name_votes (
  favorite_id uuid not null references public.name_favorites(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 0, 1)),
  primary key (favorite_id, user_id)
);

-- =====================================================================
-- RLS des tables de foyer
-- =====================================================================
select public._apply_household_policies('pregnancies', 'pregnancy');
select public._apply_household_policies('expected_babies', 'pregnancy');
select public._apply_household_policies('children', 'profile');
select public._apply_household_policies('child_measurements', 'health');
select public._apply_household_policies('child_milestones', 'profile');
select public._apply_household_policies('child_health_items', 'health');
select public._apply_household_policies('breastfeeds', 'daily');
select public._apply_household_policies('pumpings', 'daily');
select public._apply_household_policies('bottles', 'daily');
select public._apply_household_policies('meals', 'daily');
select public._apply_household_policies('food_introductions', 'daily');
select public._apply_household_policies('diapers', 'daily');
select public._apply_household_policies('sleeps', 'daily');
select public._apply_household_policies('child_observations', 'daily');
select public._apply_household_policies('appointments', 'health');
select public._apply_household_policies('checklists', 'lists');
select public._apply_household_policies('checklist_items', 'lists');
select public._apply_household_policies('document_extractions', 'documents');
select public._apply_household_policies('name_favorites', 'names');

-- Notes : une note privée n'est visible que par son auteur
alter table public.notes enable row level security;
create policy notes_sel on public.notes for select to authenticated
  using (public.can_access_household(household_id, 'profile', false) and (not private_to_author or author_id = auth.uid()));
create policy notes_ins on public.notes for insert to authenticated
  with check (author_id = auth.uid() and public.can_access_household(household_id, 'profile', false));
create policy notes_mod on public.notes for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy notes_del on public.notes for delete to authenticated using (author_id = auth.uid());

-- Documents : domaine « documents » + option « privé à la personne qui l'a déposé »
alter table public.documents enable row level security;
create policy documents_sel on public.documents for select to authenticated
  using (public.can_access_household(household_id, 'documents', false) and (not private_to_uploader or uploaded_by = auth.uid()));
create policy documents_ins on public.documents for insert to authenticated
  with check (uploaded_by = auth.uid() and public.can_access_household(household_id, 'documents', true));
create policy documents_upd on public.documents for update to authenticated
  using (uploaded_by = auth.uid() or public.is_household_owner(household_id))
  with check (public.can_access_household(household_id, 'documents', true));
create policy documents_del on public.documents for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_household_owner(household_id));

-- Votes de prénoms : chacun vote pour soi, tout le foyer voit les votes
alter table public.name_votes enable row level security;
create policy name_votes_sel on public.name_votes for select to authenticated using (public.can_access_household(household_id, 'names', false));
create policy name_votes_own on public.name_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_access_household(household_id, 'names', true));
create or replace function public.set_household_from_favorite()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.name_favorites where id = new.favorite_id;
  if new.household_id is null then raise exception 'Prénom introuvable' using errcode = '23503'; end if;
  return new;
end $$;
create trigger name_votes_household before insert on public.name_votes for each row execute function public.set_household_from_favorite();

-- Catalogues publics en lecture seule
alter table public.foods enable row level security;
alter table public.baby_names enable row level security;
create policy foods_read on public.foods for select to anon, authenticated using (true);
create policy foods_admin on public.foods for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy baby_names_read on public.baby_names for select to anon, authenticated using (true);
create policy baby_names_admin on public.baby_names for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

-- Les références optionnelles (enfant, grossesse, bébé attendu) doivent appartenir au MÊME foyer
create or replace function public.check_subjects_same_household()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb := to_jsonb(new);
begin
  if v ? 'child_id' and (v->>'child_id') is not null and not exists
     (select 1 from public.children where id = (v->>'child_id')::uuid and household_id = new.household_id) then
    raise exception 'Enfant hors du foyer' using errcode = '42501';
  end if;
  if v ? 'pregnancy_id' and (v->>'pregnancy_id') is not null and not exists
     (select 1 from public.pregnancies where id = (v->>'pregnancy_id')::uuid and household_id = new.household_id) then
    raise exception 'Grossesse hors du foyer' using errcode = '42501';
  end if;
  if v ? 'expected_baby_id' and (v->>'expected_baby_id') is not null and not exists
     (select 1 from public.expected_babies where id = (v->>'expected_baby_id')::uuid and household_id = new.household_id) then
    raise exception 'Bébé hors du foyer' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['appointments','notes','checklists','documents'] loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.check_subjects_same_household()', t||'_same_household', t);
  end loop;
end $$;

-- Une mesure de poids maternel ne peut référencer qu'une grossesse accessible
create or replace function public.check_maternal_weight_pregnancy()
returns trigger language plpgsql as $$
begin
  if new.pregnancy_id is not null and not exists (select 1 from public.pregnancies where id = new.pregnancy_id) then
    raise exception 'Grossesse inaccessible' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger maternal_weights_pregnancy before insert or update on public.maternal_weights
  for each row execute function public.check_maternal_weight_pregnancy();
