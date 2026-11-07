-- =====================================================================
-- Charge mentale (07/11/2026) — migration ADDITIVE (aucune table, colonne ni donnée supprimée)
--  « Vider ma tête » et « Qui y pense » n'ont pas de table : ils écrivent dans family_tasks / family_events
--  et lisent ces tables. Nouvelles tables :
--   1. family_domains : un domaine entier confié à une personne (vaccins et pédiatre, école, anniversaires…)
--   2. family_prep : échéances préparées ou ignorées (rentrée, vacances, anniversaires, papiers qui expirent…)
--   3. offduty_periods : « Je décroche » (période où l'autre parent prend le relais)
--   4. house_notes : carnet de la maison (codes, contacts, tailles, habitudes…)
--   5. couple_checkins : point de couple de la semaine — visible des SEULS parents (owner / coparent)
--   6. exhaustion_checkins : « Je suis à bout » — strictement personnel, aucun diagnostic
--   7. family_papers : papiers importants de la famille (photo dans documents, date d'expiration)
--  « Confier un domaine » et « Échéances préparées » rejoignent les outils à vie (paid_tools).
-- Retour arrière (à la main, PERTE des données de ces outils) :
--   drop function public.export_my_data(); alter function public._export_my_data_v22() rename to export_my_data;
--   delete from public.paid_tools where key in ('family_domains','family_prep');
--   drop table public.family_papers, public.exhaustion_checkins, public.couple_checkins, public.house_notes,
--     public.offduty_periods, public.family_prep, public.family_domains;
-- =====================================================================

-- 1. Domaines confiés --------------------------------------------------------------------------------------------
create table if not exists public.family_domains (
  household_id uuid not null references public.households(id) on delete cascade,
  key text not null check (key ~ '^[a-z_]{2,40}$'),
  owner_id uuid references auth.users(id) on delete set null,
  note text check (char_length(note) <= 300),
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (household_id, key)
);
create index if not exists family_domains_owner_idx on public.family_domains(owner_id);
create index if not exists family_domains_updated_by_idx on public.family_domains(updated_by);
drop trigger if exists family_domains_touch on public.family_domains;
create trigger family_domains_touch before update on public.family_domains for each row execute function public.touch_updated_at();
select public._apply_household_policies('family_domains', 'daily');

-- 2. Échéances préparées -----------------------------------------------------------------------------------------
create table if not exists public.family_prep (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_:\-]{2,80}$'),
  occurs_on date not null,
  status text not null default 'prepared' check (status in ('prepared','skipped')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, key, occurs_on)
);
create index if not exists family_prep_created_by_idx on public.family_prep(created_by);
select public._apply_household_policies('family_prep', 'daily');

-- 3. « Je décroche » ---------------------------------------------------------------------------------------------
create table if not exists public.offduty_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  relay_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours')
);
create index if not exists offduty_periods_household_idx on public.offduty_periods(household_id, ends_at desc);
create index if not exists offduty_periods_user_idx on public.offduty_periods(user_id);
create index if not exists offduty_periods_relay_idx on public.offduty_periods(relay_to);
alter table public.offduty_periods enable row level security;
drop policy if exists offduty_read on public.offduty_periods;
create policy offduty_read on public.offduty_periods for select to authenticated using (public.can_access_household(household_id, 'daily', false));
drop policy if exists offduty_own on public.offduty_periods;
create policy offduty_own on public.offduty_periods for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_household_member(household_id));

-- 4. Carnet de la maison -----------------------------------------------------------------------------------------
create table if not exists public.house_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  section text not null default 'other' check (section in ('codes','contacts','kids','habits','home','health','school','other')),
  title text not null check (char_length(title) between 1 and 80),
  body text check (char_length(body) <= 2000),
  position int not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists house_notes_household_idx on public.house_notes(household_id, section);
create index if not exists house_notes_child_idx on public.house_notes(child_id);
create index if not exists house_notes_created_by_idx on public.house_notes(created_by);
drop trigger if exists house_notes_touch on public.house_notes;
create trigger house_notes_touch before update on public.house_notes for each row execute function public.touch_updated_at();
select public._apply_household_policies('house_notes', 'daily');

-- 5. Point de couple : parents seulement (jamais la nounou ni les grands-parents) ---------------------------------
create table if not exists public.couple_checkins (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_of date not null,
  heavy text check (char_length(heavy) <= 1000),
  decisions text check (char_length(decisions) <= 2000),
  thanks text check (char_length(thanks) <= 500),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, week_of)
);
create index if not exists couple_checkins_created_by_idx on public.couple_checkins(created_by);
drop trigger if exists couple_checkins_touch on public.couple_checkins;
create trigger couple_checkins_touch before update on public.couple_checkins for each row execute function public.touch_updated_at();
alter table public.couple_checkins enable row level security;
drop policy if exists couple_checkins_parents on public.couple_checkins;
create policy couple_checkins_parents on public.couple_checkins for all to authenticated
  using (exists (select 1 from public.household_members m where m.household_id = couple_checkins.household_id and m.user_id = auth.uid() and m.role in ('owner','coparent')))
  with check (exists (select 1 from public.household_members m where m.household_id = couple_checkins.household_id and m.user_id = auth.uid() and m.role in ('owner','coparent')));

-- 6. « Je suis à bout » : strictement personnel ------------------------------------------------------------------
create table if not exists public.exhaustion_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answers smallint[] not null check (cardinality(answers) = 6 and 0 <= all(answers) and 3 >= all(answers)),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists exhaustion_checkins_user_idx on public.exhaustion_checkins(user_id, created_at desc);
select public._apply_owner_policies('exhaustion_checkins');

-- 7. Papiers importants ------------------------------------------------------------------------------------------
create table if not exists public.family_papers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  kind text not null check (kind ~ '^[a-z_]{2,40}$'),
  label text check (char_length(label) <= 80),
  document_id uuid references public.documents(id) on delete set null,
  expires_on date,
  note text check (char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists family_papers_household_idx on public.family_papers(household_id, kind);
create index if not exists family_papers_child_idx on public.family_papers(child_id);
create index if not exists family_papers_document_idx on public.family_papers(document_id);
create index if not exists family_papers_created_by_idx on public.family_papers(created_by);
drop trigger if exists family_papers_touch on public.family_papers;
create trigger family_papers_touch before update on public.family_papers for each row execute function public.touch_updated_at();
select public._apply_household_policies('family_papers', 'documents');

-- 8. Deux nouveaux outils à vie ----------------------------------------------------------------------------------
insert into public.paid_tools (key, entitlement, product_id, position) values
  ('family_domains', 'TOOL_FAMILY_DOMAINS', 'aufildenous_tool_family_domains', 11),
  ('family_prep', 'TOOL_FAMILY_PREP', 'aufildenous_tool_family_prep', 12)
on conflict (key) do nothing;
drop trigger if exists family_domains_tool on public.family_domains;
create trigger family_domains_tool before insert on public.family_domains for each row execute function public._enforce_tool('family_domains');
drop trigger if exists family_prep_tool on public.family_prep;
create trigger family_prep_tool before insert on public.family_prep for each row execute function public._enforce_tool('family_prep');

-- 9. Export RGPD -------------------------------------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v22;
revoke execute on function public._export_my_data_v22() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v22() || jsonb_build_object(
    'family_domains', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.family_domains d where public.can_access_household(d.household_id, 'daily', false)),
    'family_prep', (select coalesce(jsonb_agg(to_jsonb(p) order by p.occurs_on), '[]') from public.family_prep p where public.can_access_household(p.household_id, 'daily', false)),
    'offduty_periods', (select coalesce(jsonb_agg(to_jsonb(o) order by o.starts_at), '[]') from public.offduty_periods o where o.user_id = v_uid),
    'house_notes', (select coalesce(jsonb_agg(to_jsonb(n) order by n.section, n.position), '[]') from public.house_notes n
      where public.can_access_household(n.household_id, 'daily', false) and (n.child_id is null or public.can_access_child(n.child_id))),
    'couple_checkins', (select coalesce(jsonb_agg(to_jsonb(c) order by c.week_of), '[]') from public.couple_checkins c
      where exists (select 1 from public.household_members m where m.household_id = c.household_id and m.user_id = v_uid and m.role in ('owner','coparent'))),
    'exhaustion_checkins', (select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at), '[]') from public.exhaustion_checkins e where e.user_id = v_uid),
    'family_papers', (select coalesce(jsonb_agg(to_jsonb(f) order by f.kind), '[]') from public.family_papers f
      where public.can_access_household(f.household_id, 'documents', false) and (f.child_id is null or public.can_access_child(f.child_id))));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
