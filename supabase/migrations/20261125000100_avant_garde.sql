-- =====================================================================
-- Avant la garde (25/11/2026) — outils des parents qui précèdent et encadrent la garde d'un enfant
-- Écrans : src/app/garde/prep/* ; tests : supabase/tests/sql/98ze_avant_garde.sql, src/__tests__/childcarePrep.test.ts
--
-- ADDITIF ET IDEMPOTENT : nouvelles tables, politiques, fonctions ; une catégorie de documents en plus. Aucune donnée
-- réécrite.
--
--  1. childcare_candidates   : nounous, assistantes maternelles, crèches… envisagées par le FOYER (fiche, contact,
--                              disponibilités, tarif saisi, statut). Parents seulement (propriétaire, co-parent) :
--                              une nounou membre du foyer n'en voit RIEN (ni candidates, ni tarifs, ni notes).
--  2. childcare_prep_items   : questions d'entretien et points de la checklist de visite du foyer (modèle traduit
--                              côté application : template_key ; ajouts : label). Parents seulement.
--  3. childcare_prep_answers : réponse notée / point coché, par candidate et par question. Parents seulement.
--  4. childcare_schedules    : planning prévu de la garde d'un enfant (jours et horaires). Parents ; lecture par la
--                              nounou confirmée de CET enfant (ses propres horaires).
--  5. childcare_absences     : absences de l'enfant, congés de la nounou, fermetures. Parents ; la nounou confirmée
--                              voit les absences de l'enfant gardé et SES congés, et saisit ses propres congés.
--  Heures de garde : AUCUNE table nouvelle. Le pointage réutilise les arrivées / départs du carnet de liaison
--  (childcare_events, kind = 'arrival' / 'departure') ; les totaux sont calculés par l'application.
--  Contrats : catégorie « childcare » ajoutée au coffre de documents existant (documents.category).
--
-- Aucun calcul d'aide (CMG, crédit d'impôt) : la base ne stocke que les montants saisis par les parents.
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 0. Parent du foyer (propriétaire ou co-parent)
create or replace function public._is_household_parent(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_household is not null and auth.uid() is not null and exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid() and m.role in ('owner', 'coparent'));
$$;
revoke execute on function public._is_household_parent(uuid) from public, anon;
grant execute on function public._is_household_parent(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- 1. Candidates (comparateur, fiches, tarifs)
create table if not exists public.childcare_candidates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  kind text not null check (kind in ('assmat', 'nanny', 'creche', 'micro_creche', 'shared')),
  status text not null default 'to_contact' check (status in ('to_contact', 'interview', 'visited', 'chosen', 'dismissed')),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 120),
  address text check (address is null or char_length(address) <= 200),
  availability text check (availability is null or char_length(availability) <= 300),
  rate_mode text not null default 'hourly' check (rate_mode in ('hourly', 'monthly')),
  hourly_rate numeric(8,2) check (hourly_rate is null or hourly_rate between 0 and 200),
  hours_per_week numeric(5,2) check (hours_per_week is null or hours_per_week between 0 and 80),
  weeks_per_year smallint not null default 52 check (weeks_per_year between 1 and 52),
  days_per_week numeric(3,1) check (days_per_week is null or days_per_week between 0 and 7),
  monthly_fee numeric(8,2) check (monthly_fee is null or monthly_fee between 0 and 10000),
  meal_fee_per_day numeric(6,2) check (meal_fee_per_day is null or meal_fee_per_day between 0 and 100),
  upkeep_fee_per_day numeric(6,2) check (upkeep_fee_per_day is null or upkeep_fee_per_day between 0 and 100),
  other_monthly numeric(8,2) check (other_monthly is null or other_monthly between 0 and 5000),
  interview_at timestamptz check (interview_at is null or (interview_at >= timestamptz '2000-01-01' and interview_at < timestamptz '2100-01-01')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists childcare_candidates_household_idx on public.childcare_candidates(household_id, created_at);
create index if not exists childcare_candidates_created_by_idx on public.childcare_candidates(created_by);

-- ---------------------------------------------------------------- 2. Questions d'entretien et checklist de visite
create table if not exists public.childcare_prep_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('interview', 'visit')),
  template_key text check (template_key is null or template_key ~ '^[a-z0-9_]{1,40}$'),
  label text check (label is null or char_length(btrim(label)) between 1 and 200),
  position int not null default 0 check (position between 0 and 10000),
  archived boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (template_key is not null or label is not null),
  constraint childcare_prep_items_template_uniq unique (household_id, kind, template_key)
);
create index if not exists childcare_prep_items_created_by_idx on public.childcare_prep_items(created_by);

create table if not exists public.childcare_prep_answers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  candidate_id uuid not null references public.childcare_candidates(id) on delete cascade,
  item_id uuid not null references public.childcare_prep_items(id) on delete cascade,
  answer text check (answer is null or char_length(answer) <= 1000),
  checked boolean not null default false,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint childcare_prep_answers_uniq unique (candidate_id, item_id)
);
create index if not exists childcare_prep_answers_household_idx on public.childcare_prep_answers(household_id);
create index if not exists childcare_prep_answers_item_idx on public.childcare_prep_answers(item_id);
create index if not exists childcare_prep_answers_updated_by_idx on public.childcare_prep_answers(updated_by);

-- Réponse : foyer repris de la candidate ; la question doit être du même foyer ; auteur de la dernière modification
create or replace function public._childcare_answer_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_h uuid;
begin
  select household_id into v_h from public.childcare_candidates where id = new.candidate_id;
  if v_h is null then raise exception 'Candidate introuvable' using errcode = '23503'; end if;
  if not exists (select 1 from public.childcare_prep_items i where i.id = new.item_id and i.household_id = v_h) then
    raise exception 'Question d''un autre foyer' using errcode = '42501';
  end if;
  new.household_id := v_h;
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  return new;
end $$;
revoke execute on function public._childcare_answer_guard() from public, anon, authenticated;
drop trigger if exists childcare_prep_answers_guard on public.childcare_prep_answers;
create trigger childcare_prep_answers_guard before insert or update on public.childcare_prep_answers
  for each row execute function public._childcare_answer_guard();

-- ---------------------------------------------------------------- 3. Planning prévu (calendrier des périodes de garde)
-- days : [{ "wd": 1..7 (lundi = 1), "start": "HH:MM", "end": "HH:MM" }], début avant fin, au plus 14 créneaux
create or replace function public._childcare_days_ok(p jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare e jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 14 then return false; end if;
  for e in select * from jsonb_array_elements(p) loop
    if jsonb_typeof(e) <> 'object' or jsonb_typeof(e -> 'wd') <> 'number' or (e ->> 'wd')::numeric not in (1, 2, 3, 4, 5, 6, 7) then return false; end if;
    if coalesce(e ->> 'start', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(e ->> 'end', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
    if (e ->> 'start') >= (e ->> 'end') then return false; end if;
  end loop;
  return true;
end $$;

create table if not exists public.childcare_schedules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  days jsonb not null default '[]'::jsonb check (public._childcare_days_ok(days)),
  starts_on date not null default current_date,
  ends_on date,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index if not exists childcare_schedules_child_idx on public.childcare_schedules(child_id, starts_on);
create index if not exists childcare_schedules_household_idx on public.childcare_schedules(household_id);
create index if not exists childcare_schedules_created_by_idx on public.childcare_schedules(created_by);

-- ---------------------------------------------------------------- 4. Absences et congés
create table if not exists public.childcare_absences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('child', 'caregiver_leave', 'closure')),
  from_on date not null,
  to_on date not null,
  caregiver_id uuid references auth.users(id) on delete set null,
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (to_on >= from_on and to_on - from_on <= 366),
  check (from_on >= date '2000-01-01' and to_on < date '2100-01-01'),
  check (kind = 'caregiver_leave' or caregiver_id is null)
);
create index if not exists childcare_absences_child_idx on public.childcare_absences(child_id, from_on);
create index if not exists childcare_absences_household_idx on public.childcare_absences(household_id);
create index if not exists childcare_absences_caregiver_idx on public.childcare_absences(caregiver_id);
create index if not exists childcare_absences_created_by_idx on public.childcare_absences(created_by);

-- Une nounou ne saisit que SES congés : genre et personne posés par le serveur
create or replace function public._childcare_absence_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public._is_caregiver_in(new.household_id) and not public._is_household_parent(new.household_id) then
    new.kind := 'caregiver_leave';
    new.caregiver_id := auth.uid();
  end if;
  return new;
end $$;
revoke execute on function public._childcare_absence_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------- 5. Déclencheurs communs
do $$
declare t text;
begin
  foreach t in array array['childcare_candidates', 'childcare_prep_items', 'childcare_schedules', 'childcare_absences'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_keep_author', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)', t || '_keep_author', t, 'created_by');
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
  foreach t in array array['childcare_candidates', 'childcare_schedules'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
  foreach t in array array['childcare_schedules', 'childcare_absences'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_household', t);
    execute format('create trigger %I before insert or update of child_id on public.%I for each row execute function public.set_household_from_child()', t || '_household', t);
  end loop;
end $$;
drop trigger if exists childcare_prep_answers_premium_write on public.childcare_prep_answers;
create trigger childcare_prep_answers_premium_write before insert on public.childcare_prep_answers
  for each row execute function public._require_premium_write('premium');
-- après le rattachement au foyer (ordre alphabétique des déclencheurs : « z »)
drop trigger if exists childcare_absences_zguard on public.childcare_absences;
create trigger childcare_absences_zguard before insert or update on public.childcare_absences
  for each row execute function public._childcare_absence_guard();

-- ---------------------------------------------------------------- 6. Accès (RLS)
alter table public.childcare_candidates enable row level security;
alter table public.childcare_prep_items enable row level security;
alter table public.childcare_prep_answers enable row level security;
alter table public.childcare_schedules enable row level security;
alter table public.childcare_absences enable row level security;

-- Données de sélection (candidates, questions, réponses, tarifs, notes) : parents du foyer seulement
do $$
declare t text;
begin
  foreach t in array array['childcare_candidates', 'childcare_prep_items', 'childcare_prep_answers'] loop
    execute format('drop policy if exists %I on public.%I', t || '_parents', t);
    execute format('create policy %I on public.%I for all to authenticated using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id))', t || '_parents', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Planning : parents de l'enfant (écriture) ; nounou confirmée de CET enfant (lecture)
drop policy if exists childcare_schedules_sel on public.childcare_schedules;
create policy childcare_schedules_sel on public.childcare_schedules for select to authenticated
  using (public._is_parent_of(child_id) or public._childcare_active(child_id));
drop policy if exists childcare_schedules_ins on public.childcare_schedules;
create policy childcare_schedules_ins on public.childcare_schedules for insert to authenticated with check (public._is_parent_of(child_id));
drop policy if exists childcare_schedules_upd on public.childcare_schedules;
create policy childcare_schedules_upd on public.childcare_schedules for update to authenticated
  using (public._is_parent_of(child_id)) with check (public._is_parent_of(child_id));
drop policy if exists childcare_schedules_del on public.childcare_schedules;
create policy childcare_schedules_del on public.childcare_schedules for delete to authenticated using (public._is_parent_of(child_id));
grant select, insert, update, delete on public.childcare_schedules to authenticated;
revoke all on public.childcare_schedules from anon;

-- Absences : parents de l'enfant (tout) ; nounou confirmée de CET enfant : absences de l'enfant et SES congés en
-- lecture, SES congés en écriture (jamais ceux d'une autre nounou, jamais une fermeture)
drop policy if exists childcare_absences_sel on public.childcare_absences;
create policy childcare_absences_sel on public.childcare_absences for select to authenticated
  using (public._is_parent_of(child_id)
      or (public._childcare_active(child_id) and (kind = 'child' or (kind = 'caregiver_leave' and caregiver_id = auth.uid()))));
drop policy if exists childcare_absences_ins on public.childcare_absences;
create policy childcare_absences_ins on public.childcare_absences for insert to authenticated
  with check (public._is_parent_of(child_id)
      or (public._childcare_active(child_id) and kind = 'caregiver_leave' and caregiver_id = auth.uid()));
drop policy if exists childcare_absences_upd on public.childcare_absences;
create policy childcare_absences_upd on public.childcare_absences for update to authenticated
  using (public._is_parent_of(child_id) or (public._childcare_active(child_id) and kind = 'caregiver_leave' and caregiver_id = auth.uid()))
  with check (public._is_parent_of(child_id) or (public._childcare_active(child_id) and kind = 'caregiver_leave' and caregiver_id = auth.uid()));
drop policy if exists childcare_absences_del on public.childcare_absences;
create policy childcare_absences_del on public.childcare_absences for delete to authenticated
  using (public._is_parent_of(child_id) or (public._childcare_active(child_id) and kind = 'caregiver_leave' and caregiver_id = auth.uid()));
grant select, insert, update, delete on public.childcare_absences to authenticated;
revoke all on public.childcare_absences from anon;

-- ---------------------------------------------------------------- 7. Coffre-fort des contrats : catégorie de documents
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check check (category in (
  'ultrasound','report','blood_test','prescription','letter','photo','other',
  'exam_result','consultation','hospital','certificate','vaccination','allergy','chronic','dental','eye','physio','psych','gyneco',
  'prenatal','pregnancy_report','maternity','birth','postnatal',
  'health_book','growth','development',
  'insurance','admin','invoice','appointment','personal','custom',
  -- 25/11/2026 : contrats et papiers de la garde (contrat de travail, règlement de crèche, attestations)
  'childcare'
));

-- ---------------------------------------------------------------- 8. Export RGPD (« Exporter mes données »)
-- La version brute précédente est gardée sous un autre nom et complétée ; export_my_data() (security invoker, filtre
-- sous RLS) reste inchangée : une ligne non visible n'apparaît pas, sauf si la personne en est l'autrice.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_avant_garde' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_avant_garde;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_avant_garde() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_h uuid[];
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilise export_my_data().' using errcode = '42501';
  end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  return public._export_my_data_raw_avant_garde() || jsonb_build_object('childcare_prep', jsonb_build_object(
    'candidates', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]') from public.childcare_candidates c
                   where c.household_id = any(v_h) or c.created_by = v_uid),
    'prep_items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.kind, i.position), '[]') from public.childcare_prep_items i
                   where i.household_id = any(v_h) or i.created_by = v_uid),
    'prep_answers', (select coalesce(jsonb_agg(to_jsonb(a) order by a.updated_at), '[]') from public.childcare_prep_answers a
                     where a.household_id = any(v_h) or a.updated_by = v_uid),
    'schedules', (select coalesce(jsonb_agg(to_jsonb(s) order by s.starts_on), '[]') from public.childcare_schedules s
                  where s.household_id = any(v_h) or s.created_by = v_uid),
    'absences', (select coalesce(jsonb_agg(to_jsonb(b) order by b.from_on), '[]') from public.childcare_absences b
                 where b.household_id = any(v_h) or b.created_by = v_uid or b.caregiver_id = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.childcare_prep_answers, public.childcare_prep_items, public.childcare_candidates,
--   public.childcare_absences, public.childcare_schedules;
-- drop function if exists public._childcare_answer_guard(), public._childcare_absence_guard(), public._childcare_days_ok(jsonb),
--   public._is_household_parent(uuid);
-- Documents : update public.documents set category = 'admin' where category = 'childcare'; puis remettre la contrainte
--   documents_category_check sans 'childcare' (liste de 20261019001200_documents_v2.sql).
-- Export : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_avant_garde() rename to
--   _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
