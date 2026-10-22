-- =====================================================================
-- Grossesse et vaccins : « Comment je me sens aujourd'hui ? », calendrier des échographies, calendrier vaccinal
-- versionné, vaccins reportés, documents joints.
--  · pregnancy_symptom_logs : symptômes notés par la personne enceinte (strictement personnels, jamais visibles
--    du foyer), intensité, heure de début, fréquence, note. Exportés et effacés avec ses données.
--  · appointments.document_ids / child_vaccinations.document_ids : documents du foyer joints (ordonnance,
--    compte rendu, photo du carnet). Aucune copie : seulement des identifiants.
--  · child_vaccine_postponements : une dose du calendrier « reportée » par le parent (jusqu'à une date, note).
--  · vaccine_calendars : base de règles versionnée (pays, version, date d'effet, règles, source officielle),
--    lisible par tous les comptes, modifiable seulement par l'administration : le calendrier de l'année suivante
--    se publie sans nouvelle version de l'application. L'application garde une copie intégrée (repli hors ligne).
-- Retour arrière :
--   drop table public.pregnancy_symptom_logs, public.child_vaccine_postponements, public.vaccine_calendars;
--   alter table public.appointments drop column document_ids; alter table public.child_vaccinations drop column document_ids;
--   (puis restaurer export_my_data précédent : _export_my_data_v15)
-- =====================================================================

create table if not exists public.pregnancy_symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  symptom text not null check (symptom ~ '^[a-z_]{2,40}$'),
  intensity smallint check (intensity is null or intensity between 1 and 3),
  started_at timestamptz,
  frequency text check (frequency is null or frequency in ('once','several','continuous')),
  note text check (note is null or char_length(note) <= 1000),
  week_sa smallint check (week_sa is null or week_sa between 0 and 45),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists pregnancy_symptom_logs_idx on public.pregnancy_symptom_logs(user_id, logged_at desc);
select public._apply_owner_policies('pregnancy_symptom_logs');

alter table public.appointments add column if not exists document_ids uuid[] not null default '{}';
alter table public.child_vaccinations add column if not exists document_ids uuid[] not null default '{}';
-- Clé du calendrier pour les échographies (echo_1, echo_2, echo_3), comme pour les vaccins
alter table public.appointments drop constraint if exists appointments_document_ids_len;
alter table public.appointments add constraint appointments_document_ids_len check (cardinality(document_ids) <= 20);

create table if not exists public.child_vaccine_postponements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  calendar_key text not null check (calendar_key ~ '^[a-z0-9_]{2,40}$'),
  postponed_to date,
  note text check (note is null or char_length(note) <= 500),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (child_id, calendar_key)
);
select public._apply_household_policies('child_vaccine_postponements', 'health');
drop trigger if exists child_vaccine_postponements_child on public.child_vaccine_postponements;
create trigger child_vaccine_postponements_child before insert or update on public.child_vaccine_postponements for each row execute function public.child_in_household();

create table if not exists public.vaccine_calendars (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country ~ '^[A-Z]{2}$'),
  version text not null check (char_length(version) between 4 and 20),
  label text not null check (char_length(label) between 3 and 200),
  effective_from date not null,
  updated_on date not null,
  source_url text not null check (source_url ~ '^https://'),
  rules jsonb not null check (jsonb_typeof(rules) = 'array'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (country, version)
);
alter table public.vaccine_calendars enable row level security;
drop policy if exists vaccine_calendars_read on public.vaccine_calendars;
create policy vaccine_calendars_read on public.vaccine_calendars for select to authenticated using (published or public.has_role('admin'));
drop policy if exists vaccine_calendars_admin on public.vaccine_calendars;
create policy vaccine_calendars_admin on public.vaccine_calendars for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Export RGPD : symptômes de grossesse et vaccins reportés des enfants du foyer
alter function public.export_my_data() rename to _export_my_data_v15;
revoke execute on function public._export_my_data_v15() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public._export_my_data_v15() || jsonb_build_object(
    'pregnancy_symptom_logs', (select coalesce(jsonb_agg(to_jsonb(s) order by s.logged_at), '[]') from public.pregnancy_symptom_logs s where s.user_id = auth.uid()),
    'child_vaccine_postponements', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.child_vaccine_postponements p
      where public.can_access_household(p.household_id, 'health', false)));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
