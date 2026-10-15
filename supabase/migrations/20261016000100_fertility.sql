-- =====================================================================
-- Toi & Moi — 0006 Parcours fertilité : « Je souhaite concevoir » (ttc)
-- et « Je souhaite éviter une grossesse » (avoid).
--
-- Données INTIMES (rapports, température, glaire, contraception) :
--   -> strictement personnelles (RLS propriétaire uniquement), jamais
--      partagées avec le foyer ni le coparent, absentes de tout export
--      destiné à un tiers. Seul l'export RGPD de la personne elle-même
--      (export_my_data) les contient.
-- Questions pour une consultation :
--   -> personnelles par défaut ; partageables avec le foyer UNIQUEMENT si
--      la personne coche « partager » (domaine de permission « health »).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rapports (parcours « concevoir ») — facultatif, PRIVÉ
-- Volontairement sans household_id : aucune politique de foyer possible.
-- ---------------------------------------------------------------------
create table public.intercourse_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occurred_on date not null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index intercourse_logs_idx on public.intercourse_logs(user_id, occurred_on desc);

-- ---------------------------------------------------------------------
-- Observations du corps : température basale et glaire cervicale
-- (une ligne par jour, chaque mesure est facultative)
-- ---------------------------------------------------------------------
create table public.fertility_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  observed_on date not null,
  bbt_celsius numeric(4,2) check (bbt_celsius between 34 and 40),
  cervical_mucus text check (cervical_mucus in ('dry','sticky','creamy','watery','egg_white')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, observed_on),
  check (bbt_celsius is not null or cervical_mucus is not null or note is not null)
);

-- ---------------------------------------------------------------------
-- Méthodes de contraception suivies (parcours « éviter une grossesse »)
-- ---------------------------------------------------------------------
create table public.contraception_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  method text not null check (method in
    ('pill','iud_copper','iud_hormonal','implant','patch','ring','injection','condom','internal_condom','diaphragm','sterilisation','natural','other')),
  label text check (char_length(label) <= 80),
  started_on date,
  renewal_due_on date,
  active boolean not null default true,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (renewal_due_on is null or started_on is null or renewal_due_on >= started_on)
);
create trigger contraception_methods_touch before update on public.contraception_methods
  for each row execute function public.touch_updated_at();

select public._apply_owner_policies(t) from unnest(array[
  'intercourse_logs','fertility_observations','contraception_methods']) t;

-- Aucun accès anonyme, même en lecture (défense en profondeur en plus de la RLS)
revoke all on public.intercourse_logs, public.fertility_observations, public.contraception_methods from anon;

-- ---------------------------------------------------------------------
-- Questions à préparer avant une consultation (liste modifiable)
-- ---------------------------------------------------------------------
create table public.consultation_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  journey text not null check (journey in ('ttc','avoid')),
  question text not null check (char_length(question) between 1 and 300),
  answer text check (char_length(answer) <= 1000),
  done boolean not null default false,
  shared boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not shared or household_id is not null)
);
create index consultation_questions_idx on public.consultation_questions(user_id, journey, position);
create trigger consultation_questions_touch before update on public.consultation_questions
  for each row execute function public.touch_updated_at();

alter table public.consultation_questions enable row level security;
-- Lecture : l'autrice, ou un membre du foyer ayant le domaine « santé » si la question est partagée
create policy consultation_questions_sel on public.consultation_questions for select to authenticated
  using (user_id = auth.uid()
         or (shared and household_id is not null and public.can_access_household(household_id, 'health', false)));
-- Écriture : uniquement l'autrice, et seulement vers un foyer dont elle est membre
create policy consultation_questions_ins on public.consultation_questions for insert to authenticated
  with check (user_id = auth.uid() and (household_id is null or public.is_household_member(household_id)));
create policy consultation_questions_upd on public.consultation_questions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (household_id is null or public.is_household_member(household_id)));
create policy consultation_questions_del on public.consultation_questions for delete to authenticated
  using (user_id = auth.uid());
revoke all on public.consultation_questions from anon;

-- ---------------------------------------------------------------------
-- Export RGPD : on complète l'export existant avec les nouvelles données
-- personnelles (uniquement celles de la personne qui exporte).
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_base;
revoke execute on function public._export_my_data_base() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_base();
  v := jsonb_set(v, '{personal}', (v -> 'personal') || jsonb_build_object(
    'intercourse_logs', (select coalesce(jsonb_agg(t order by occurred_on), '[]') from public.intercourse_logs t where user_id = v_uid),
    'fertility_observations', (select coalesce(jsonb_agg(t order by observed_on), '[]') from public.fertility_observations t where user_id = v_uid),
    'contraception_methods', (select coalesce(jsonb_agg(t order by created_at), '[]') from public.contraception_methods t where user_id = v_uid),
    'consultation_questions', (select coalesce(jsonb_agg(t order by journey, position), '[]') from public.consultation_questions t where user_id = v_uid)
  ));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
