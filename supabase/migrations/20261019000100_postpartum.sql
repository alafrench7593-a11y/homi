-- =====================================================================
-- Suivi post-partum de la mère.
--
-- Principes (non négociables) :
--  * tout est PRIVÉ par défaut : propriétaire uniquement, aucun accès foyer ;
--  * la mère choisit ce qu'elle partage, champ par champ ; le partage est
--    filtré ICI, côté serveur (un client modifié ne peut rien publier de plus) ;
--  * révoquer un partage efface aussitôt l'information partagée ;
--  * aucun score, aucun diagnostic : des réponses déclarées, rien de calculé
--    n'est stocké ; aucune donnée n'est utilisable pour de la publicité.
-- =====================================================================

-- ---------------------------------------------------------------- réglages et plan de soutien
create table public.postpartum_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  delivery_date date,
  -- Le suivi ne s'arrête jamais tout seul : la mère décide quand elle n'en veut plus
  active boolean not null default true,
  reminders_enabled boolean not null default false,
  reminder_time time not null default '20:00',
  country text not null default 'FR' check (country ~ '^[A-Z]{2}$'),
  -- Partage avec le foyer : tout est fermé par défaut
  share_household_id uuid references public.households(id) on delete set null,
  share_rest_need boolean not null default false,
  share_availability boolean not null default false,
  share_relay_requests boolean not null default false,
  share_summary boolean not null default false,
  share_appointments boolean not null default false,
  -- Plan de soutien (peut être préparé avant l'accouchement)
  plan_rest_needs text[] not null default '{}' check (cardinality(plan_rest_needs) <= 12),
  plan_tasks_to_delegate text[] not null default '{}' check (cardinality(plan_tasks_to_delegate) <= 20),
  plan_notes text check (char_length(plan_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger postpartum_settings_touch before update on public.postpartum_settings
  for each row execute function public.touch_updated_at();
alter table public.postpartum_settings enable row level security;
create policy postpartum_settings_owner on public.postpartum_settings for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (share_household_id is null or public.is_household_member(share_household_id)));
revoke all on public.postpartum_settings from anon;

-- ---------------------------------------------------------------- check-in quotidien (une entrée par jour, modifiable)
create table public.postpartum_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  checkin_date date not null,
  -- Échelles déclarées 1..5, toutes facultatives
  feeling smallint check (feeling between 1 and 5),
  mood smallint check (mood between 1 and 5),
  fatigue smallint check (fatigue between 1 and 5),
  stress smallint check (stress between 1 and 5),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  supported smallint check (supported between 1 and 5),
  coping smallint check (coping between 1 and 5),
  rest_need smallint check (rest_need between 1 and 5),
  help_need smallint check (help_need between 1 and 5),
  needs text[] not null default '{}'
    check (needs <@ array['rest','relay','talk','practical','professional','other','no_answer']::text[] and cardinality(needs) <= 7),
  need_other text check (char_length(need_other) <= 300),
  comment text check (char_length(comment) <= 3000),
  -- Récupération physique (facultatif)
  physical_fatigue smallint check (physical_fatigue between 1 and 5),
  pain smallint check (pain between 1 and 5),
  pain_note text check (char_length(pain_note) <= 500),
  recovery smallint check (recovery between 1 and 5),
  feeding_note text check (char_length(feeding_note) <= 1000),
  difficulties text check (char_length(difficulties) <= 1000),
  -- Uniquement le fait que l'orientation urgente a été montrée (pas le détail des réponses)
  urgent_orientation_shown boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint postpartum_checkins_one_per_day unique (user_id, checkin_date)
);
create index postpartum_checkins_idx on public.postpartum_checkins(user_id, checkin_date desc);
create trigger postpartum_checkins_touch before update on public.postpartum_checkins
  for each row execute function public.touch_updated_at();
select public._apply_owner_policies('postpartum_checkins');
revoke all on public.postpartum_checkins from anon;

-- ---------------------------------------------------------------- contacts de confiance et professionnels
create table public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('trusted','professional')),
  name text not null check (char_length(name) between 1 and 80),
  relation text check (char_length(relation) <= 80),
  phone text check (phone ~ '^[0-9+ ().-]{2,30}$'),
  email text check (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  note text check (char_length(note) <= 500),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index trusted_contacts_idx on public.trusted_contacts(user_id, kind, position);
select public._apply_owner_policies('trusted_contacts');
revoke all on public.trusted_contacts from anon;

-- ---------------------------------------------------------------- démarches que la mère choisit de noter
-- (l'app n'écrit jamais ici à sa place : « rendez-vous pris » n'est noté que si elle le dit)
create table public.postpartum_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  done_on date not null default current_date,
  kind text not null check (kind in ('appointment_booked','professional_contacted','talked','rest_taken','relay_received','other')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index postpartum_actions_idx on public.postpartum_actions(user_id, done_on desc);
select public._apply_owner_policies('postpartum_actions');
revoke all on public.postpartum_actions from anon;

-- ---------------------------------------------------------------- ce que la mère partage avec son foyer
create table public.postpartum_shared_status (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  rest_need text check (rest_need in ('none','some','high')),
  availability text check (availability in ('available','resting','unavailable')),
  relay_requested boolean not null default false,
  relay_note text check (char_length(relay_note) <= 200),
  summary text check (char_length(summary) <= 500),
  updated_at timestamptz not null default now()
);
create index postpartum_shared_status_household_idx on public.postpartum_shared_status(household_id);

-- Filtre serveur : seuls les champs autorisés dans les réglages de la mère passent
create or replace function public.postpartum_filter_shared()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.postpartum_settings;
begin
  select * into s from public.postpartum_settings where user_id = new.user_id;
  if s.user_id is null or s.share_household_id is null or s.share_household_id <> new.household_id then
    raise exception 'Partage non autorisé : choisissez d''abord ce que vous voulez partager, et avec quel foyer.' using errcode = '42501';
  end if;
  if not s.share_rest_need then new.rest_need := null; end if;
  if not s.share_availability then new.availability := null; end if;
  if not s.share_relay_requests then new.relay_requested := false; new.relay_note := null; end if;
  if not s.share_summary then new.summary := null; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger postpartum_shared_status_filter before insert or update on public.postpartum_shared_status
  for each row execute function public.postpartum_filter_shared();

-- Révocation immédiate : décocher un partage efface ce qui était visible
create or replace function public.postpartum_apply_revocation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.share_household_id is distinct from old.share_household_id
     or not (new.share_rest_need or new.share_availability or new.share_relay_requests or new.share_summary) then
    delete from public.postpartum_shared_status where user_id = new.user_id;
    return new;
  end if;
  update public.postpartum_shared_status set
    rest_need = case when new.share_rest_need then rest_need end,
    availability = case when new.share_availability then availability end,
    relay_requested = case when new.share_relay_requests then relay_requested else false end,
    relay_note = case when new.share_relay_requests then relay_note end,
    summary = case when new.share_summary then summary end
  where user_id = new.user_id;
  return new;
end $$;
create trigger postpartum_settings_revoke after update on public.postpartum_settings
  for each row execute function public.postpartum_apply_revocation();

alter table public.postpartum_shared_status enable row level security;
-- La mère gère sa ligne
create policy postpartum_shared_owner on public.postpartum_shared_status for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_household_member(household_id));
-- Les membres du foyer choisi ne voient QUE cette ligne (déjà filtrée), jamais les check-ins
create policy postpartum_shared_household_read on public.postpartum_shared_status for select to authenticated
  using (public.is_household_member(household_id));
revoke all on public.postpartum_shared_status from anon;

-- ---------------------------------------------------------------- questions pour la consultation post-partum
alter table public.consultation_questions drop constraint if exists consultation_questions_journey_check;
alter table public.consultation_questions add constraint consultation_questions_journey_check
  check (journey in ('ttc','avoid','postpartum'));

-- ---------------------------------------------------------------- export RGPD
alter function public.export_my_data() rename to _export_my_data_v5;
revoke execute on function public._export_my_data_v5() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_v5();
  v := jsonb_set(v, '{personal}', (v -> 'personal') || jsonb_build_object(
    'postpartum_settings', (select coalesce(jsonb_agg(t), '[]') from public.postpartum_settings t where user_id = v_uid),
    'postpartum_checkins', (select coalesce(jsonb_agg(t order by checkin_date), '[]') from public.postpartum_checkins t where user_id = v_uid),
    'trusted_contacts', (select coalesce(jsonb_agg(t order by kind, position), '[]') from public.trusted_contacts t where user_id = v_uid),
    'postpartum_actions', (select coalesce(jsonb_agg(t order by done_on), '[]') from public.postpartum_actions t where user_id = v_uid),
    'postpartum_shared_status', (select coalesce(jsonb_agg(t), '[]') from public.postpartum_shared_status t where user_id = v_uid)
  ));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
