-- =====================================================================
-- Six outils (07/11/2026) — migration ADDITIVE : aucune table, colonne ni donnée supprimée.
--  1. Rappel partagé avec le foyer : colonne reminders.shared (défaut false) + lecture par les membres
--     du foyer. Seule la personne qui a créé le rappel peut le modifier ou le supprimer (politique existante).
--  2. Suivi PMA (IIU, FIV, ICSI, TEC…) : protocoles, traitements tels qu'écrits sur l'ordonnance, journal
--     des prises et des étapes. Strictement personnel (user_id = auth.uid()). Aucune dose n'est proposée.
--  3. Alertes produits rappelés : préférence « prévenir aussi mon foyer » (désactivée par défaut, car
--     l'historique du scanner peut être intime) ; _notify_recall prévient en plus les membres du foyer
--     des personnes qui l'ont activée. Le comportement existant est conservé à l'identique.
--  4. Routines en pictogrammes pour l'enfant : routines + cases cochées du jour (domaine « daily » du foyer).
--  5. Garde alternée : rythme (cycle de 7 à 28 jours, A/B), heure et lieu de passation, exceptions
--     (vacances, échanges) — domaine « daily » du foyer.
--  6. Export RGPD : les nouvelles tables sont ajoutées (version précédente conservée).
--
-- Retour arrière (à la main, PERTE des données saisies dans les nouveaux outils) :
--   drop function public.export_my_data(); alter function public._export_my_data_v20() rename to export_my_data;
--   -- _notify_recall : réappliquer la définition de supabase/migrations/20261016000600_scanner.sql
--   drop table public.custody_exceptions, public.custody_plans, public.kid_routine_checks, public.kid_routines,
--     public.recall_watch_prefs, public.pma_logs, public.pma_meds, public.pma_protocols;
--   drop policy reminders_household_read on public.reminders; alter table public.reminders drop column shared;
-- =====================================================================

-- 1. Rappels partagés ---------------------------------------------------------------------------
alter table public.reminders add column if not exists shared boolean not null default false;
drop policy if exists reminders_household_read on public.reminders;
create policy reminders_household_read on public.reminders for select to authenticated
  using (shared and household_id is not null and public.is_household_member(household_id));
create index if not exists reminders_shared_idx on public.reminders(household_id) where shared;

-- 2. Suivi PMA ----------------------------------------------------------------------------------
create table if not exists public.pma_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'other' check (kind in ('iiu','fiv','icsi','tec','stimulation','other')),
  label text not null check (char_length(label) between 1 and 80),
  started_on date not null,
  ended_on date check (ended_on is null or ended_on >= started_on),
  center text check (char_length(center) <= 120),
  center_phone text check (char_length(center_phone) <= 30),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists pma_protocols_user_idx on public.pma_protocols(user_id, started_on desc);
select public._apply_owner_policies('pma_protocols');

create table if not exists public.pma_meds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  protocol_id uuid not null references public.pma_protocols(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  route text not null default 'other' check (route in ('injection','oral','vaginal','patch','nasal','other')),
  -- recopié de l'ordonnance par la personne ; jamais calculé ni proposé par l'application
  dose_text text check (char_length(dose_text) <= 120),
  take_time time,
  start_on date,
  end_on date check (end_on is null or start_on is null or end_on >= start_on),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists pma_meds_protocol_idx on public.pma_meds(protocol_id);
create index if not exists pma_meds_user_idx on public.pma_meds(user_id);
select public._apply_owner_policies('pma_meds');

create table if not exists public.pma_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  protocol_id uuid not null references public.pma_protocols(id) on delete cascade,
  med_id uuid references public.pma_meds(id) on delete set null,
  kind text not null check (kind in ('dose','monitoring','ultrasound','blood','trigger','retrieval','transfer','test','note')),
  happened_at timestamptz not null default now(),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists pma_logs_protocol_idx on public.pma_logs(protocol_id, happened_at desc);
create index if not exists pma_logs_med_idx on public.pma_logs(med_id);
create index if not exists pma_logs_user_idx on public.pma_logs(user_id);
select public._apply_owner_policies('pma_logs');

-- Un traitement ou une note ne peut être rattaché qu'à un protocole de la même personne
create or replace function public._pma_same_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.pma_protocols p where p.id = new.protocol_id and p.user_id = new.user_id) then
    raise exception 'Protocole introuvable' using errcode = '42501';
  end if;
  if tg_table_name = 'pma_logs' then
    if (to_jsonb(new)->>'med_id') is not null
       and not exists (select 1 from public.pma_meds m where m.id = (to_jsonb(new)->>'med_id')::uuid and m.user_id = new.user_id) then
      raise exception 'Traitement introuvable' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public._pma_same_owner() from public, anon, authenticated;
drop trigger if exists pma_meds_owner on public.pma_meds;
create trigger pma_meds_owner before insert or update on public.pma_meds for each row execute function public._pma_same_owner();
drop trigger if exists pma_logs_owner on public.pma_logs;
create trigger pma_logs_owner before insert or update on public.pma_logs for each row execute function public._pma_same_owner();

-- 3. Alertes produits rappelés : partage avec le foyer (opt-in) ----------------------------------
create table if not exists public.recall_watch_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  share_household boolean not null default false,
  updated_at timestamptz not null default now()
);
select public._apply_owner_policies('recall_watch_prefs');

create or replace function public._notify_recall(p_recall uuid, p_user uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare r public.product_recalls; v_count int; v_family int;
begin
  select * into r from public.product_recalls where id = p_recall;
  if not found then return 0; end if;
  -- (a) inchangé : les personnes dont l'historique (ou les favoris, qui pointent vers l'historique) contient le produit
  with targets as (
    select distinct s.user_id, (array_agg(s.id order by s.created_at desc))[1] as scan_id
    from public.product_scans s
    where (p_user is null or s.user_id = p_user)
      and ((r.product_id is not null and s.product_id = r.product_id)
        or (s.barcode is not null and (s.barcode = r.barcode or s.barcode = any(r.gtins))))
    group by s.user_id
  ), ins as (
    insert into public.scan_recall_alerts(user_id, recall_id)
    select user_id, r.id from targets
    on conflict do nothing
    returning user_id
  )
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
  select t.user_id, 'product_recall',
         case when r.is_demo then 'Rappel (démonstration) : ' else 'Rappel officiel : ' end || r.title,
         left(r.reason, 240),
         '/scanner/result/' || t.scan_id,
         jsonb_build_object('recall_id', r.id, 'scan_id', t.scan_id, 'is_demo', r.is_demo)
  from targets t join ins on ins.user_id = t.user_id;
  get diagnostics v_count = row_count;

  -- (b) nouveau : les autres membres du foyer de celles et ceux qui ont choisi « prévenir aussi mon foyer »
  with owners as (
    select distinct s.user_id
    from public.product_scans s
    join public.recall_watch_prefs p on p.user_id = s.user_id and p.share_household
    where (p_user is null or s.user_id = p_user)
      and ((r.product_id is not null and s.product_id = r.product_id)
        or (s.barcode is not null and (s.barcode = r.barcode or s.barcode = any(r.gtins))))
  ), family as (
    select distinct m2.user_id
    from owners o
    join public.household_members m1 on m1.user_id = o.user_id
    join public.household_members m2 on m2.household_id = m1.household_id and m2.user_id <> o.user_id
  ), ins2 as (
    insert into public.scan_recall_alerts(user_id, recall_id)
    select user_id, r.id from family
    on conflict do nothing
    returning user_id
  )
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
  select i.user_id, 'product_recall',
         case when r.is_demo then 'Rappel (démonstration) dans votre foyer : ' else 'Rappel officiel dans votre foyer : ' end || r.title,
         left(r.reason, 240),
         '/scanner/recalls',
         jsonb_build_object('recall_id', r.id, 'is_demo', r.is_demo, 'household', true)
  from ins2 i;
  get diagnostics v_family = row_count;
  return v_count + v_family;
end $$;
revoke execute on function public._notify_recall(uuid, uuid) from public, anon, authenticated;

-- 4. Routines en pictogrammes pour l'enfant ------------------------------------------------------
create table if not exists public.kid_routines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  moment text not null default 'custom' check (moment in ('morning','evening','afterschool','weekend','custom')),
  -- [{ "icon": "toothbrush", "label": "Je me brosse les dents" }, …] — 1 à 15 étapes
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 15),
  position int not null default 0,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists kid_routines_household_idx on public.kid_routines(household_id);
create index if not exists kid_routines_child_idx on public.kid_routines(child_id);
create index if not exists kid_routines_created_by_idx on public.kid_routines(created_by);
select public._apply_household_policies('kid_routines', 'daily');

create table if not exists public.kid_routine_checks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  routine_id uuid not null references public.kid_routines(id) on delete cascade,
  on_date date not null,
  step int not null check (step between 0 and 14),
  done_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (routine_id, on_date, step)
);
create index if not exists kid_routine_checks_household_idx on public.kid_routine_checks(household_id, on_date);
create index if not exists kid_routine_checks_done_by_idx on public.kid_routine_checks(done_by);
select public._apply_household_policies('kid_routine_checks', 'daily');

-- 5. Garde alternée ------------------------------------------------------------------------------
create table if not exists public.custody_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  label_a text not null check (char_length(label_a) between 1 and 40),
  label_b text not null check (char_length(label_b) between 1 and 40),
  pattern text not null default 'custom' check (pattern in ('week','2255','223','custom')),
  -- un caractère par jour à partir de anchor_on : A = chez label_a, B = chez label_b ; le cycle se répète
  cycle text not null check (cycle ~ '^[AB]{7,28}$'),
  anchor_on date not null,
  handover_time time,
  handover_place text check (char_length(handover_place) <= 120),
  notes text check (char_length(notes) <= 1000),
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists custody_plans_household_idx on public.custody_plans(household_id);
create index if not exists custody_plans_child_idx on public.custody_plans(child_id);
create index if not exists custody_plans_created_by_idx on public.custody_plans(created_by);
drop trigger if exists custody_plans_touch on public.custody_plans;
create trigger custody_plans_touch before update on public.custody_plans for each row execute function public.touch_updated_at();
select public._apply_household_policies('custody_plans', 'daily');

create table if not exists public.custody_exceptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_id uuid not null references public.custody_plans(id) on delete cascade,
  from_on date not null,
  to_on date not null check (to_on >= from_on),
  side text not null check (side in ('A','B')),
  note text check (char_length(note) <= 200),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists custody_exceptions_plan_idx on public.custody_exceptions(plan_id, from_on);
create index if not exists custody_exceptions_household_idx on public.custody_exceptions(household_id);
create index if not exists custody_exceptions_created_by_idx on public.custody_exceptions(created_by);
select public._apply_household_policies('custody_exceptions', 'daily');

-- Index oublié par 20261105000200_consult_questions_everywhere (clé étrangère child_id)
create index if not exists consultation_questions_child_id_fk_idx on public.consultation_questions(child_id);

-- 6. Export RGPD ---------------------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v20;
revoke execute on function public._export_my_data_v20() from public, anon, authenticated;

create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v20() || jsonb_build_object(
    'pma_protocols', (select coalesce(jsonb_agg(to_jsonb(p) order by p.started_on), '[]') from public.pma_protocols p where p.user_id = v_uid),
    'pma_meds', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]') from public.pma_meds m where m.user_id = v_uid),
    'pma_logs', (select coalesce(jsonb_agg(to_jsonb(l) order by l.happened_at), '[]') from public.pma_logs l where l.user_id = v_uid),
    'recall_watch_prefs', (select coalesce(jsonb_agg(to_jsonb(w)), '[]') from public.recall_watch_prefs w where w.user_id = v_uid),
    'kid_routines', (select coalesce(jsonb_agg(to_jsonb(k) order by k.position), '[]') from public.kid_routines k
      where public.can_access_household(k.household_id, 'daily', false) and (k.child_id is null or public.can_access_child(k.child_id))),
    'kid_routine_checks', (select coalesce(jsonb_agg(to_jsonb(c) order by c.on_date), '[]') from public.kid_routine_checks c
      where public.can_access_household(c.household_id, 'daily', false)),
    'custody_plans', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]') from public.custody_plans c
      where public.can_access_household(c.household_id, 'daily', false) and (c.child_id is null or public.can_access_child(c.child_id))),
    'custody_exceptions', (select coalesce(jsonb_agg(to_jsonb(e) order by e.from_on), '[]') from public.custody_exceptions e
      where public.can_access_household(e.household_id, 'daily', false))
  );
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
