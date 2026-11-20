-- =====================================================================
-- Naissance, post-partum, allaitement (27/11/2026) — outils 39, 44, 48, 58, 60, 73, 74, 76, 77, 79
-- Écrans : src/app/pregnancy/contractions.tsx, src/app/pregnancy/birth-plan.tsx, src/app/family/birth-partner.tsx,
--          src/app/postpartum/pelvic.tsx, src/app/postpartum/healing.tsx, src/app/feeding/*.tsx
-- Tests : supabase/tests/sql/98zg_naissance_postpartum_allaitement.sql, src/__tests__/birthFeeding.test.ts
--
-- ADDITIF ET IDEMPOTENT : nouvelles tables, deux colonnes ajoutées à checklists (valeurs par défaut sans effet sur
-- l'existant), politiques restrictives supplémentaires. Aucune donnée réécrite.
--
--  1. contractions            : chronomètre des contractions (39). PERSONNEL (la personne qui chronomètre). Horodatages
--                               absolus (début, fin) : rien ne dépend d'un compteur gardé en mémoire. Aucun seuil médical.
--  2. birth_plans             : projet de naissance (44), un par personne et par grossesse ; réponses par section (jsonb).
--                               PERSONNEL ; partage par l'export de l'application (PDF / texte), jamais par la base.
--  3. checklists (+2 colonnes): created_by, private_to_creator. Préparation du coparent à l'accouchement (48) = une liste
--                               de genre « coparent » rattachée à la grossesse, privée tant que son autrice ne la partage
--                               pas avec le foyer (politiques RESTRICTIVES ajoutées aux politiques du foyer existantes).
--  4. postpartum_care_logs    : séances de rééducation périnéale prescrites (58 : prévue / faite / manquée, rappel) et
--                               journal de cicatrisation (60 : ressenti, douleur 0–10, note, photo facultative = document
--                               PRIVÉ de la personne). PERSONNEL. Aucun conseil médical, aucune interprétation de photo.
--  5. milk_stock              : stock de lait maternel (73/74) : contenants datés, lieu, quantité, date limite SAISIE
--                               (préremplie par l'application à partir des durées sourcées du guide HOMI, modifiable),
--                               lien facultatif vers la séance de tire-lait (pumpings, 71/72). Parents du foyer.
--  6. breastfeeding_issues    : difficultés d'allaitement et douleurs pendant les tétées (76/77) : date, sein, type,
--                               douleur 0–10, note, tétée liée facultative. PERSONNEL (le corps de la personne).
--  7. formula_changes         : historique des laits infantiles (79) : marque, type, début / fin, raison, observations.
--                               Parents de l'enfant ; lecture par la nounou confirmée de CET enfant (biberons).
--  8. Export RGPD             : ces données dans « Exporter mes données ».
--
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Contractions (personnel)
create table if not exists public.contractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  session_id uuid not null,
  started_at timestamptz not null check (started_at >= timestamptz '2000-01-01' and started_at < timestamptz '2100-01-01'),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  -- une contraction : fin après le début, au plus 30 minutes (au-delà, une saisie oubliée : à corriger)
  check (ended_at is null or (ended_at > started_at and ended_at - started_at <= interval '30 minutes'))
);
create index if not exists contractions_user_idx on public.contractions(user_id, started_at desc);
create index if not exists contractions_session_idx on public.contractions(session_id);
create index if not exists contractions_pregnancy_idx on public.contractions(pregnancy_id);

-- ---------------------------------------------------------------- 2. Projet de naissance (personnel)
create or replace function public._birth_plan_answers_ok(p jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare k text; v jsonb; c jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' or char_length(p::text) > 30000 then return false; end if;
  for k, v in select * from jsonb_each(p) loop
    if k !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(v) <> 'object' then return false; end if;
    if v ? 'choices' then
      if jsonb_typeof(v -> 'choices') <> 'array' or jsonb_array_length(v -> 'choices') > 20 then return false; end if;
      for c in select * from jsonb_array_elements(v -> 'choices') loop
        if jsonb_typeof(c) <> 'string' or (c #>> '{}') !~ '^[a-z0-9_]{1,40}$' then return false; end if;
      end loop;
    end if;
    if v ? 'note' and (jsonb_typeof(v -> 'note') <> 'string' or char_length(v ->> 'note') > 1000) then return false; end if;
  end loop;
  return true;
end $$;

create table if not exists public.birth_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (public._birth_plan_answers_ok(answers)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birth_plans_one_per_pregnancy unique (user_id, pregnancy_id)
);
create index if not exists birth_plans_pregnancy_idx on public.birth_plans(pregnancy_id);

-- La grossesse doit être visible de la personne (la sienne, ou partagée avec elle)
create or replace function public._birth_plan_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not exists (select 1 from public.pregnancies p
       join public.household_members m on m.household_id = p.household_id and m.user_id = auth.uid()
       where p.id = new.pregnancy_id) then
    raise exception 'Grossesse introuvable.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._birth_plan_guard() from public, anon, authenticated;
drop trigger if exists birth_plans_guard on public.birth_plans;
create trigger birth_plans_guard before insert or update on public.birth_plans for each row execute function public._birth_plan_guard();

-- ---------------------------------------------------------------- 3. Listes privées : préparation du coparent (48)
alter table public.checklists add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.checklists add column if not exists private_to_creator boolean not null default false;
create index if not exists checklists_created_by_idx on public.checklists(created_by);
drop trigger if exists checklists_keep_author on public.checklists;
create trigger checklists_keep_author before insert or update on public.checklists
  for each row execute function public._keep_author('created_by');

-- Une liste privée n'existe que pour son autrice ; seule elle peut la partager (ou la reprendre)
create or replace function public._checklist_visible(p_list uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.checklists l where l.id = p_list and (not l.private_to_creator or l.created_by = auth.uid()));
$$;
revoke execute on function public._checklist_visible(uuid) from public, anon;
grant execute on function public._checklist_visible(uuid) to authenticated, service_role;

create or replace function public._checklist_privacy_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and auth.uid() is not null and tg_op = 'UPDATE'
     and new.private_to_creator is distinct from old.private_to_creator and old.created_by is distinct from auth.uid() then
    raise exception 'Seule la personne qui a créé la liste choisit de la partager.' using errcode = '42501';
  end if;
  if new.private_to_creator and new.created_by is null then
    raise exception 'Une liste privée a une autrice.' using errcode = '22023';
  end if;
  return new;
end $$;
revoke execute on function public._checklist_privacy_guard() from public, anon, authenticated;
drop trigger if exists checklists_zprivacy on public.checklists;
create trigger checklists_zprivacy before insert or update on public.checklists for each row execute function public._checklist_privacy_guard();

drop policy if exists checklists_private_scope on public.checklists;
create policy checklists_private_scope on public.checklists as restrictive for all to authenticated
  using (not private_to_creator or created_by = auth.uid()) with check (not private_to_creator or created_by = auth.uid());
drop policy if exists checklist_items_private_scope on public.checklist_items;
create policy checklist_items_private_scope on public.checklist_items as restrictive for all to authenticated
  using (public._checklist_visible(checklist_id)) with check (public._checklist_visible(checklist_id));

-- ---------------------------------------------------------------- 4. Rééducation périnéale et cicatrisation (personnel)
create table if not exists public.postpartum_care_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('pelvic_session', 'healing')),
  at timestamptz not null check (at >= timestamptz '2000-01-01' and at < timestamptz '2100-01-01'),
  status text check (status in ('planned', 'done', 'missed')),
  practitioner text check (practitioner is null or char_length(btrim(practitioner)) between 1 and 80),
  feeling text check (feeling in ('better', 'same', 'worse')),
  pain smallint check (pain between 0 and 10),
  note text check (note is null or char_length(note) <= 1000),
  document_id uuid references public.documents(id) on delete set null,
  reminder_id uuid references public.reminders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'pelvic_session' and status is not null and feeling is null) or (kind = 'healing' and status is null and practitioner is null))
);
create index if not exists postpartum_care_logs_user_idx on public.postpartum_care_logs(user_id, kind, at desc);
create index if not exists postpartum_care_logs_document_idx on public.postpartum_care_logs(document_id);
create index if not exists postpartum_care_logs_reminder_idx on public.postpartum_care_logs(reminder_id);

-- Photo et rappel : ceux de la personne elle-même ; la photo reste privée (jamais partagée avec le foyer)
create or replace function public._postpartum_care_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.document_id is not null and not exists (select 1 from public.documents d
       where d.id = new.document_id and d.uploaded_by = auth.uid() and d.private_to_uploader) then
    raise exception 'La photo doit être un document privé de la personne.' using errcode = '42501';
  end if;
  if auth.uid() is not null and new.reminder_id is not null and not exists (select 1 from public.reminders r where r.id = new.reminder_id and r.user_id = auth.uid()) then
    raise exception 'Rappel introuvable.' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._postpartum_care_guard() from public, anon, authenticated;
drop trigger if exists postpartum_care_logs_guard on public.postpartum_care_logs;
create trigger postpartum_care_logs_guard before insert or update on public.postpartum_care_logs for each row execute function public._postpartum_care_guard();

-- ---------------------------------------------------------------- 5. Stock de lait maternel (parents du foyer)
create table if not exists public.milk_stock (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  pumping_id uuid references public.pumpings(id) on delete set null,
  expressed_at timestamptz not null check (expressed_at >= timestamptz '2000-01-01' and expressed_at < timestamptz '2100-01-01'),
  amount_ml int not null check (amount_ml between 1 and 1000),
  location text not null check (location in ('fridge', 'freezer', 'room')),
  thawed_at timestamptz,
  use_by timestamptz not null,
  status text not null default 'stored' check (status in ('stored', 'used', 'discarded')),
  closed_at timestamptz,
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (use_by > expressed_at and use_by - expressed_at <= interval '400 days'),
  check (thawed_at is null or thawed_at >= expressed_at),
  check ((status = 'stored') = (closed_at is null))
);
create index if not exists milk_stock_household_idx on public.milk_stock(household_id, status, use_by);
create index if not exists milk_stock_child_idx on public.milk_stock(child_id);
create index if not exists milk_stock_pumping_idx on public.milk_stock(pumping_id);
create index if not exists milk_stock_created_by_idx on public.milk_stock(created_by);

-- Enfant et séance de tire-lait : du même foyer
create or replace function public._milk_stock_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.pumping_id is not null and not exists (select 1 from public.pumpings p where p.id = new.pumping_id and p.household_id = new.household_id) then
    raise exception 'Séance de tire-lait introuvable dans ce foyer.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._milk_stock_guard() from public, anon, authenticated;
drop trigger if exists milk_stock_guard on public.milk_stock;
create trigger milk_stock_guard before insert or update on public.milk_stock for each row execute function public._milk_stock_guard();

-- ---------------------------------------------------------------- 6. Difficultés et douleurs d'allaitement (personnel)
create table if not exists public.breastfeeding_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  breastfeed_id uuid references public.breastfeeds(id) on delete set null,
  at timestamptz not null check (at >= timestamptz '2000-01-01' and at < timestamptz '2100-01-01'),
  side text check (side in ('left', 'right', 'both')),
  kind text not null check (kind in ('latch', 'sore_nipple', 'cracked', 'engorgement', 'blocked_duct', 'low_supply', 'oversupply', 'baby_sleepy', 'pain_only', 'other')),
  pain smallint check (pain between 0 and 10),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists breastfeeding_issues_user_idx on public.breastfeeding_issues(user_id, at desc);
create index if not exists breastfeeding_issues_child_idx on public.breastfeeding_issues(child_id);
create index if not exists breastfeeding_issues_feed_idx on public.breastfeeding_issues(breastfeed_id);

create or replace function public._breastfeeding_issue_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.child_id is not null and not public._is_parent_of(new.child_id) then
    raise exception 'Enfant introuvable.' using errcode = '22023';
  end if;
  if new.breastfeed_id is not null and not exists (select 1 from public.breastfeeds b where b.id = new.breastfeed_id and b.child_id is not distinct from new.child_id) then
    raise exception 'Tétée introuvable pour cet enfant.' using errcode = '22023';
  end if;
  return new;
end $$;
revoke execute on function public._breastfeeding_issue_guard() from public, anon, authenticated;
drop trigger if exists breastfeeding_issues_guard on public.breastfeeding_issues;
create trigger breastfeeding_issues_guard before insert or update on public.breastfeeding_issues for each row execute function public._breastfeeding_issue_guard();

-- ---------------------------------------------------------------- 7. Laits infantiles (parents ; lecture nounou confirmée)
create table if not exists public.formula_changes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  brand text not null check (char_length(btrim(brand)) between 1 and 80),
  kind text not null check (kind in ('first_age', 'second_age', 'growing', 'hydrolysed', 'anti_regurgitation', 'lactose_free', 'thickened', 'other')),
  started_on date not null check (started_on >= date '2000-01-01' and started_on < date '2100-01-01'),
  ended_on date,
  reason text check (reason in ('start', 'age', 'professional_advice', 'tolerance', 'availability', 'price', 'preference', 'other')),
  observations text check (observations is null or char_length(observations) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_on is null or ended_on >= started_on)
);
create index if not exists formula_changes_child_idx on public.formula_changes(child_id, started_on desc);
create index if not exists formula_changes_household_idx on public.formula_changes(household_id);
create index if not exists formula_changes_created_by_idx on public.formula_changes(created_by);

-- ---------------------------------------------------------------- Déclencheurs communs
do $$
declare t text;
begin
  foreach t in array array['milk_stock', 'formula_changes'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_keep_author', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)', t || '_keep_author', t, 'created_by');
  end loop;
  foreach t in array array['contractions', 'birth_plans', 'postpartum_care_logs', 'milk_stock', 'breastfeeding_issues', 'formula_changes'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
end $$;
drop trigger if exists formula_changes_touch on public.formula_changes;
create trigger formula_changes_touch before update on public.formula_changes for each row execute function public.touch_updated_at();
drop trigger if exists formula_changes_household on public.formula_changes;
create trigger formula_changes_household before insert or update of child_id on public.formula_changes
  for each row execute function public.set_household_from_child();

-- ---------------------------------------------------------------- Accès (RLS)
alter table public.contractions enable row level security;
alter table public.birth_plans enable row level security;
alter table public.postpartum_care_logs enable row level security;
alter table public.milk_stock enable row level security;
alter table public.breastfeeding_issues enable row level security;
alter table public.formula_changes enable row level security;

-- Données personnelles : la personne seule (ni le foyer, ni la nounou, ni un ancien membre)
do $$
declare t text;
begin
  foreach t in array array['contractions', 'birth_plans', 'postpartum_care_logs', 'breastfeeding_issues'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_owner', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Stock de lait : parents du foyer
drop policy if exists milk_stock_parents on public.milk_stock;
create policy milk_stock_parents on public.milk_stock for all to authenticated
  using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id));
grant select, insert, update, delete on public.milk_stock to authenticated;
revoke all on public.milk_stock from anon;

-- Laits infantiles : parents de l'enfant (tout) ; nounou confirmée de CET enfant (lecture : elle prépare les biberons)
drop policy if exists formula_changes_sel on public.formula_changes;
create policy formula_changes_sel on public.formula_changes for select to authenticated
  using (public._is_parent_of(child_id) or public._childcare_active(child_id));
drop policy if exists formula_changes_ins on public.formula_changes;
create policy formula_changes_ins on public.formula_changes for insert to authenticated with check (public._is_parent_of(child_id));
drop policy if exists formula_changes_upd on public.formula_changes;
create policy formula_changes_upd on public.formula_changes for update to authenticated
  using (public._is_parent_of(child_id)) with check (public._is_parent_of(child_id));
drop policy if exists formula_changes_del on public.formula_changes;
create policy formula_changes_del on public.formula_changes for delete to authenticated using (public._is_parent_of(child_id));
grant select, insert, update, delete on public.formula_changes to authenticated;
revoke all on public.formula_changes from anon;

-- ---------------------------------------------------------------- 8. Export RGPD (« Exporter mes données »)
-- Même principe que 20261125000100_avant_garde.sql : la version brute courante est gardée sous un autre nom et
-- complétée ; export_my_data() (security invoker) filtre ensuite sous RLS.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_absents1' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_absents1;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_absents1() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_h uuid[];
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  return public._export_my_data_raw_absents1() || jsonb_build_object('birth_feeding', jsonb_build_object(
    'contractions', (select coalesce(jsonb_agg(to_jsonb(c) order by c.started_at), '[]') from public.contractions c where c.user_id = v_uid),
    'birth_plans', (select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at), '[]') from public.birth_plans b where b.user_id = v_uid),
    'postpartum_care', (select coalesce(jsonb_agg(to_jsonb(p) order by p.at), '[]') from public.postpartum_care_logs p where p.user_id = v_uid),
    'breastfeeding_issues', (select coalesce(jsonb_agg(to_jsonb(i) order by i.at), '[]') from public.breastfeeding_issues i where i.user_id = v_uid),
    'milk_stock', (select coalesce(jsonb_agg(to_jsonb(s) order by s.expressed_at), '[]') from public.milk_stock s
                   where s.household_id = any(v_h) or s.created_by = v_uid),
    'formula_changes', (select coalesce(jsonb_agg(to_jsonb(f) order by f.started_on), '[]') from public.formula_changes f
                        where f.household_id = any(v_h) or f.created_by = v_uid),
    'calm_mode', (select to_jsonb(m) from public.calm_modes m where m.user_id = v_uid),
    'calm_requests', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at), '[]') from public.calm_requests r where r.from_user = v_uid or r.to_user = v_uid),
    'couple_moments', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]') from public.couple_moments m where m.from_user = v_uid or m.to_user = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.contractions, public.birth_plans, public.postpartum_care_logs, public.milk_stock,
--   public.breastfeeding_issues, public.formula_changes;
-- drop policy checklists_private_scope on public.checklists; drop policy checklist_items_private_scope on public.checklist_items;
-- drop trigger checklists_zprivacy on public.checklists; drop trigger checklists_keep_author on public.checklists;
-- update public.checklists set private_to_creator = false; (puis, si voulu) alter table public.checklists drop column private_to_creator, drop column created_by;
-- drop function public._checklist_visible(uuid), public._checklist_privacy_guard(), public._birth_plan_answers_ok(jsonb),
--   public._birth_plan_guard(), public._postpartum_care_guard(), public._milk_stock_guard(), public._breastfeeding_issue_guard();
-- Export : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_absents1() rename to
--   _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
