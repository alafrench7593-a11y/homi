-- =====================================================================
-- Numéros PARTIELS complétés (29/11/2026) — 42, 50, 51/57, 53, 72, 75/83/84 (aucune table), 80, 81, 120/123
-- Écrans étendus (aucun écran parallèle) : /documents/labs (coffre de documents), /me/diary?tab=pregnancy (journal),
--   /postpartum/support?focus=postnatal, /postpartum/checkin, /feeding/milk-stock, /bottle/history?scope=all,
--   /family/nights?focus=bottles, /feeding/difficulties, /child/[id]/discoveries, /track/meal
-- Tests : supabase/tests/sql/98zl_partiels_suivi_allaitement.sql, src/__tests__/partiels1.test.ts
--
-- ADDITIF ET IDEMPOTENT : trois tables, colonnes facultatives (valeurs par défaut sans effet sur l'existant).
-- Aucune donnée réécrite ; aucune valeur médicale, aucune norme ni seuil n'est stocké ou calculé par la base.
--
--  1. lab_results          : valeurs d'analyses SAISIES (42) : nom, valeur, unité, date, référence du laboratoire
--                            recopiée telle quelle (texte, jamais interprétée), document facultatif. PERSONNEL.
--  2. pregnancy_memories   : souvenirs de grossesse (50) : date, semaine saisie, titre, texte, photos et échographies
--                            = documents PRIVÉS de la personne (coffre existant). PERSONNEL. La grossesse peut se
--                            terminer ou être effacée : le souvenir reste (pregnancy_id → null).
--  3. consultation_questions.theme : thème d'une liste de questions (57 « postnatal », 81 « lactation »).
--  4. postpartum_checkins  : cicatrice, périnée (ressenti saisi), saignements (niveau saisi) (53). Personnel (déjà).
--  5. milk_stock           : contenant (sachet, biberon, pot, autre), étiquette ; une séance de tire-lait se range
--                            en plusieurs contenants dont le total ne dépasse pas la quantité tirée (72).
--  6. bottle_relays        : relais de biberons entre parents (80) : qui donne quel biberon, à quelle heure ; relié au
--                            biberon réellement noté. Parents du foyer (ni la nounou, ni un ancien membre).
--  7. food_tastings        : mode de proposition (cuillère / DME), prise en main, issue (mangé / goûté / refusé) (120).
--     meals                : aliments refusés pendant le repas (sous-ensemble des aliments notés) (123).
--  8. Export RGPD.
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Analyses médicales (personnel)
create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  value numeric(14, 4) not null check (value > -1000000000 and value < 1000000000),
  unit text check (unit is null or char_length(btrim(unit)) between 1 and 24),
  measured_on date not null check (measured_on >= date '2000-01-01' and measured_on < date '2100-01-01'),
  -- Référence du laboratoire recopiée telle quelle (« 11,5 – 16 », « < 5 »…) : texte, jamais comparé ni interprété
  lab_reference text check (lab_reference is null or char_length(btrim(lab_reference)) between 1 and 80),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lab_results_user_idx on public.lab_results(user_id, name, measured_on desc);
create index if not exists lab_results_document_idx on public.lab_results(document_id);
create index if not exists lab_results_pregnancy_idx on public.lab_results(pregnancy_id);

-- Document : un document que la personne voit (le sien, ou un document non privé de son foyer) ; grossesse : de son foyer
create or replace function public._lab_result_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Contrôles seulement quand la valeur change (une suppression en cascade, faite par quelqu'un d'autre, passe)
  if auth.uid() is not null and new.document_id is not null and (tg_op = 'INSERT' or new.document_id is distinct from old.document_id)
     and not exists (select 1 from public.documents d
       where d.id = new.document_id
         and (d.uploaded_by = auth.uid() or (not coalesce(d.private_to_uploader, false) and public.is_household_member(d.household_id)))) then
    raise exception 'Document introuvable.' using errcode = '42501';
  end if;
  if auth.uid() is not null and new.pregnancy_id is not null and (tg_op = 'INSERT' or new.pregnancy_id is distinct from old.pregnancy_id)
     and not exists (select 1 from public.pregnancies p
       join public.household_members m on m.household_id = p.household_id and m.user_id = auth.uid() where p.id = new.pregnancy_id) then
    raise exception 'Grossesse introuvable.' using errcode = '22023';
  end if;
  new.name := btrim(new.name);
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._lab_result_guard() from public, anon, authenticated;
drop trigger if exists lab_results_guard on public.lab_results;
create trigger lab_results_guard before insert or update on public.lab_results for each row execute function public._lab_result_guard();

-- ---------------------------------------------------------------- 2. Souvenirs de grossesse (personnel)
create table if not exists public.pregnancy_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete set null,
  happened_on date not null check (happened_on >= date '2000-01-01' and happened_on < date '2100-01-01'),
  week_sa smallint check (week_sa between 0 and 45),
  kind text not null default 'moment' check (kind in ('moment', 'ultrasound', 'belly', 'letter', 'other')),
  title text check (title is null or char_length(btrim(title)) between 1 and 120),
  body text check (body is null or char_length(body) <= 4000),
  photo_ids uuid[] not null default '{}' check (cardinality(photo_ids) <= 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title is not null or body is not null or cardinality(photo_ids) > 0)
);
create index if not exists pregnancy_memories_user_idx on public.pregnancy_memories(user_id, happened_on desc);
create index if not exists pregnancy_memories_pregnancy_idx on public.pregnancy_memories(pregnancy_id);

-- Photos et échographies : des documents PRIVÉS de la personne ; grossesse : de son foyer
create or replace function public._pregnancy_memory_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and (tg_op = 'INSERT' or new.photo_ids is distinct from old.photo_ids)
     and exists (select 1 from unnest(new.photo_ids) x where not exists (select 1 from public.documents d
       where d.id = x and d.uploaded_by = auth.uid() and d.private_to_uploader)) then
    raise exception 'Les photos doivent être des documents privés de la personne.' using errcode = '42501';
  end if;
  if auth.uid() is not null and new.pregnancy_id is not null and (tg_op = 'INSERT' or new.pregnancy_id is distinct from old.pregnancy_id)
     and not exists (select 1 from public.pregnancies p
       join public.household_members m on m.household_id = p.household_id and m.user_id = auth.uid() where p.id = new.pregnancy_id) then
    raise exception 'Grossesse introuvable.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._pregnancy_memory_guard() from public, anon, authenticated;
drop trigger if exists pregnancy_memories_guard on public.pregnancy_memories;
create trigger pregnancy_memories_guard before insert or update on public.pregnancy_memories for each row execute function public._pregnancy_memory_guard();

-- ---------------------------------------------------------------- 3. Thème d'une liste de questions (57, 81)
alter table public.consultation_questions add column if not exists theme text;
alter table public.consultation_questions drop constraint if exists consultation_questions_theme_check;
alter table public.consultation_questions add constraint consultation_questions_theme_check
  check (theme is null or theme in ('postnatal', 'lactation'));
create index if not exists consultation_questions_theme_idx on public.consultation_questions(user_id, theme) where theme is not null;

-- ---------------------------------------------------------------- 4. Check-in post-partum : récupération physique (53)
alter table public.postpartum_checkins add column if not exists scar_feeling text;
alter table public.postpartum_checkins add column if not exists perineum_feeling text;
alter table public.postpartum_checkins add column if not exists bleeding text;
alter table public.postpartum_checkins drop constraint if exists postpartum_checkins_scar_feeling_check;
alter table public.postpartum_checkins add constraint postpartum_checkins_scar_feeling_check
  check (scar_feeling is null or scar_feeling in ('better', 'same', 'worse', 'not_concerned'));
alter table public.postpartum_checkins drop constraint if exists postpartum_checkins_perineum_feeling_check;
alter table public.postpartum_checkins add constraint postpartum_checkins_perineum_feeling_check
  check (perineum_feeling is null or perineum_feeling in ('better', 'same', 'worse', 'not_concerned'));
alter table public.postpartum_checkins drop constraint if exists postpartum_checkins_bleeding_check;
alter table public.postpartum_checkins add constraint postpartum_checkins_bleeding_check
  check (bleeding is null or bleeding in ('none', 'spotting', 'light', 'moderate', 'heavy'));

-- ---------------------------------------------------------------- 5. Stock de lait : contenants et lots (72)
alter table public.milk_stock add column if not exists container text;
alter table public.milk_stock add column if not exists label text;
alter table public.milk_stock drop constraint if exists milk_stock_container_check;
alter table public.milk_stock add constraint milk_stock_container_check check (container is null or container in ('bag', 'bottle', 'jar', 'other'));
alter table public.milk_stock drop constraint if exists milk_stock_label_check;
alter table public.milk_stock add constraint milk_stock_label_check check (label is null or char_length(btrim(label)) between 1 and 40);

-- Même garde qu'avant (enfant et séance du même foyer) + le total des contenants d'une séance ne dépasse pas la quantité tirée
create or replace function public._milk_stock_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pumped int; v_stored int;
begin
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.pumping_id is not null then
    select p.amount_ml into v_pumped from public.pumpings p where p.id = new.pumping_id and p.household_id = new.household_id;
    if not found then
      raise exception 'Séance de tire-lait introuvable dans ce foyer.' using errcode = '22023';
    end if;
    select coalesce(sum(s.amount_ml), 0) into v_stored from public.milk_stock s where s.pumping_id = new.pumping_id and s.id <> new.id;
    if v_pumped is not null and v_stored + new.amount_ml > v_pumped then
      raise exception 'Les contenants dépassent la quantité tirée pendant cette séance.' using errcode = '23514';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._milk_stock_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------- 6. Relais de biberons (parents du foyer)
create table if not exists public.bottle_relays (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  planned_at timestamptz not null check (planned_at >= timestamptz '2000-01-01' and planned_at < timestamptz '2100-01-01'),
  planned_ml int check (planned_ml between 1 and 500),
  assigned_to uuid not null references auth.users(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'given', 'skipped')),
  bottle_id uuid references public.bottles(id) on delete set null,
  given_at timestamptz,
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'given') = (given_at is not null)),
  check (bottle_id is null or status = 'given')
);
create index if not exists bottle_relays_household_idx on public.bottle_relays(household_id, planned_at);
create index if not exists bottle_relays_child_idx on public.bottle_relays(child_id, planned_at);
create index if not exists bottle_relays_assigned_idx on public.bottle_relays(assigned_to);
create index if not exists bottle_relays_bottle_idx on public.bottle_relays(bottle_id);
create index if not exists bottle_relays_created_by_idx on public.bottle_relays(created_by);

-- Enfant du foyer ; personne choisie = un parent du foyer ; biberon relié = celui de cet enfant
create or replace function public._bottle_relay_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.household_members m where m.household_id = new.household_id and m.user_id = new.assigned_to
                   and m.role in ('owner', 'coparent')) then
    raise exception 'La personne choisie n''est pas un parent du foyer.' using errcode = '22023';
  end if;
  if new.bottle_id is not null and not exists (select 1 from public.bottles b where b.id = new.bottle_id and b.child_id = new.child_id) then
    raise exception 'Biberon introuvable pour cet enfant.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public._bottle_relay_guard() from public, anon, authenticated;
drop trigger if exists bottle_relays_guard on public.bottle_relays;
create trigger bottle_relays_guard before insert or update on public.bottle_relays for each row execute function public._bottle_relay_guard();

-- ---------------------------------------------------------------- 7. Diversification menée par l'enfant et refus (120, 123)
alter table public.food_tastings add column if not exists method text;
alter table public.food_tastings add column if not exists grasp text;
alter table public.food_tastings add column if not exists outcome text;
alter table public.food_tastings drop constraint if exists food_tastings_method_check;
alter table public.food_tastings add constraint food_tastings_method_check check (method is null or method in ('spoon', 'blw'));
alter table public.food_tastings drop constraint if exists food_tastings_grasp_check;
alter table public.food_tastings add constraint food_tastings_grasp_check check (grasp is null or grasp in ('palm', 'fingers', 'pincer', 'helped', 'not_taken'));
alter table public.food_tastings drop constraint if exists food_tastings_outcome_check;
alter table public.food_tastings add constraint food_tastings_outcome_check check (outcome is null or outcome in ('ate', 'tasted', 'refused'));
-- Un refus noté reste un refus dans l'historique (jamais « goûté » d'un côté et « refusé » de l'autre)
alter table public.food_tastings drop constraint if exists food_tastings_outcome_status_check;
alter table public.food_tastings add constraint food_tastings_outcome_status_check check (outcome is null or (outcome = 'refused') = (status = 'refused'));

alter table public.meals add column if not exists refused_foods text[] not null default '{}';
alter table public.meals drop constraint if exists meals_refused_foods_check;
alter table public.meals add constraint meals_refused_foods_check check (cardinality(refused_foods) <= 20 and refused_foods <@ foods);

-- ---------------------------------------------------------------- Déclencheurs communs
do $$
declare t text;
begin
  drop trigger if exists bottle_relays_keep_author on public.bottle_relays;
  create trigger bottle_relays_keep_author before insert or update on public.bottle_relays for each row execute function public._keep_author('created_by');
  foreach t in array array['lab_results', 'pregnancy_memories', 'bottle_relays'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
end $$;

-- ---------------------------------------------------------------- Accès (RLS)
alter table public.lab_results enable row level security;
alter table public.pregnancy_memories enable row level security;
alter table public.bottle_relays enable row level security;

-- Données personnelles : la personne seule (ni le foyer, ni la nounou, ni un ancien membre)
do $$
declare t text;
begin
  foreach t in array array['lab_results', 'pregnancy_memories'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_owner', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Relais de biberons : parents du foyer
drop policy if exists bottle_relays_parents on public.bottle_relays;
create policy bottle_relays_parents on public.bottle_relays for all to authenticated
  using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id));
grant select, insert, update, delete on public.bottle_relays to authenticated;
revoke all on public.bottle_relays from anon;

-- ---------------------------------------------------------------- 8. Export RGPD (« Exporter mes données »)
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_partiels1' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_partiels1;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_partiels1() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_h uuid[];
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  return public._export_my_data_raw_partiels1() || jsonb_build_object('partiels1', jsonb_build_object(
    'lab_results', (select coalesce(jsonb_agg(to_jsonb(l) order by l.measured_on, l.created_at), '[]') from public.lab_results l where l.user_id = v_uid),
    'pregnancy_memories', (select coalesce(jsonb_agg(to_jsonb(m) order by m.happened_on, m.created_at), '[]') from public.pregnancy_memories m where m.user_id = v_uid),
    'bottle_relays', (select coalesce(jsonb_agg(to_jsonb(r) order by r.planned_at), '[]') from public.bottle_relays r
                      where r.household_id = any(v_h) or r.created_by = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.lab_results, public.pregnancy_memories, public.bottle_relays;
-- drop function public._lab_result_guard(), public._pregnancy_memory_guard(), public._bottle_relay_guard();
-- alter table public.consultation_questions drop constraint consultation_questions_theme_check, drop column theme;
-- alter table public.postpartum_checkins drop column scar_feeling, drop column perineum_feeling, drop column bleeding;
-- alter table public.milk_stock drop column container, drop column label;  (puis remettre _milk_stock_guard de 20261127000200)
-- alter table public.food_tastings drop constraint food_tastings_outcome_status_check, drop column method, drop column grasp, drop column outcome;
-- alter table public.meals drop constraint meals_refused_foods_check, drop column refused_foods;
-- Export : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_partiels1() rename to
--   _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
