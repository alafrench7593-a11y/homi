-- =====================================================================
-- Parcours : une vraie structure au lieu d'une simple liste globale (profiles.journeys).
--  - user_journeys : un parcours = un type, une date de début, une date de fin facultative, un statut (actif / archivé),
--    un profil associé (grossesse ou enfant). Plusieurs parcours peuvent être actifs (ex. grossesse + enfants),
--    mais jamais deux parcours « corps » incompatibles en même temps (éviter / projet bébé / cycle / grossesse).
--  - profiles.journeys devient une valeur CALCULÉE à partir des parcours actifs (compatibilité avec l'existant).
--  - Archiver un parcours désactive ses rappels (plus de notifications d'un ancien parcours).
--  - Grossesse : dates de conception et de test positif, terme estimé, motif de fin (respectueux).
--  - Naissance : heure, poids, taille, terme. Besoins particuliers et traitements prescrits de l'enfant.
-- Les données existantes sont conservées : la migration crée les parcours à partir des valeurs actuelles.
-- =====================================================================

-- 1. Grossesse : informations de départ et motif de fin
alter table public.pregnancies
  add column if not exists conception_date date,
  add column if not exists positive_test_date date,
  add column if not exists end_reason text check (end_reason in ('born','ended','unspecified'));
alter table public.pregnancies drop constraint if exists pregnancies_due_date_source_check;
alter table public.pregnancies add constraint pregnancies_due_date_source_check
  check (due_date_source in ('due_date','lmp','professional','conception','positive_test'));

-- 2. Naissance
alter table public.children
  add column if not exists birth_time time,
  add column if not exists birth_weight_g int check (birth_weight_g between 300 and 7000),
  add column if not exists birth_length_cm numeric(4,1) check (birth_length_cm between 20 and 70),
  add column if not exists birth_term_weeks smallint check (birth_term_weeks between 20 and 45);

-- 3. Parcours
create table if not exists public.user_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  type text not null check (type in ('avoid','ttc','cycle','pregnancy','postpartum','baby','child')),
  status text not null default 'active' check (status in ('active','archived')),
  started_on date not null default current_date,
  ended_on date,
  end_reason text check (end_reason in ('changed','pregnancy','born','ended','unspecified','grew_up','migrated')),
  pregnancy_id uuid references public.pregnancies(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'pregnancy' or pregnancy_id is not null),
  -- seul un parcours « grossesse » est rattaché à une grossesse (la supprimer n'efface jamais un post-partum)
  check (type = 'pregnancy' or pregnancy_id is null),
  check (status = 'active' or ended_on is not null),
  check (ended_on is null or ended_on >= started_on)
);
create index if not exists user_journeys_user_idx on public.user_journeys(user_id, status);
-- Un seul parcours « corps » actif (éviter / projet bébé / cycle / grossesse) ; un seul post-partum ; un parcours par enfant
create unique index if not exists user_journeys_body_active on public.user_journeys(user_id) where status = 'active' and type in ('avoid','ttc','cycle','pregnancy');
create unique index if not exists user_journeys_postpartum_active on public.user_journeys(user_id) where status = 'active' and type = 'postpartum';
create unique index if not exists user_journeys_child_active on public.user_journeys(user_id, child_id) where status = 'active' and type in ('baby','child') and child_id is not null;

alter table public.user_journeys enable row level security;
-- La personne gère ses parcours ; le foyer voit seulement les parcours familiaux (grossesse, bébé, enfant), jamais le cycle
create policy user_journeys_owner on public.user_journeys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_journeys_family_read on public.user_journeys for select to authenticated
  using (household_id is not null and type in ('pregnancy','baby','child')
         and public.can_access_household(household_id, case when type = 'pregnancy' then 'pregnancy' else 'profile' end, false));
revoke all on public.user_journeys from anon;
create trigger user_journeys_touch before update on public.user_journeys for each row execute function public.touch_updated_at();

-- 4. Rappels : rattachés au parcours qui les a créés
alter table public.reminders add column if not exists journey_type text
  check (journey_type in ('avoid','ttc','cycle','pregnancy','postpartum','baby','child'));

-- 5. profiles.journeys calculé + rappels désactivés à l'archivage
create or replace function public.sync_profile_journeys(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v text[];
begin
  select coalesce(array_agg(distinct j), '{}') into v from (
    select case type when 'pregnancy' then 'pregnant' when 'postpartum' then 'newborn' when 'baby' then 'newborn' else type end as j
    from public.user_journeys where user_id = p_user and status = 'active'
    union all
    select 'family' where (select count(*) from public.user_journeys where user_id = p_user and status = 'active' and type in ('baby','child')) >= 2
  ) s;
  update public.profiles set journeys = v where id = p_user and journeys is distinct from v;
end $$;
revoke execute on function public.sync_profile_journeys(uuid) from public, anon, authenticated;

create or replace function public.user_journeys_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.status = 'active' and (tg_op = 'DELETE' or new.status = 'archived') then
    -- Plus de notifications de l'ancien parcours (le rappel reste visible et réactivable par la personne)
    update public.reminders set enabled = false
      where user_id = old.user_id and enabled and (
        -- bébé / enfant : seulement les rappels de CET enfant liés au parcours (jamais ceux d'un autre enfant, ni ses traitements)
        (old.type in ('baby','child') and old.child_id is not null and child_id = old.child_id and journey_type = old.type)
        -- grossesse : ses rappels (et ceux rattachés au parcours grossesse)
        or (old.type = 'pregnancy' and (pregnancy_id = old.pregnancy_id or (journey_type = 'pregnancy' and pregnancy_id is null)))
        -- parcours personnels (éviter, projet bébé, cycle, post-partum)
        or (old.type in ('avoid','ttc','cycle','postpartum') and journey_type = old.type));
  end if;
  perform public.sync_profile_journeys(coalesce(new.user_id, old.user_id));
  return null;
end $$;
create trigger user_journeys_after after insert or update or delete on public.user_journeys for each row execute function public.user_journeys_after();

-- 6. Besoins particuliers et traitements de l'enfant (foyer, domaine « santé »)
create table if not exists public.child_needs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null unique references public.children(id) on delete cascade,
  kinds text[] not null default '{}' check (kinds <@ array['adhd','asd','dys','language','dcd','tics','sensory','assessment','other']::text[]),
  other_label text check (char_length(other_label) <= 80),
  notes text check (char_length(notes) <= 4000),
  updated_at timestamptz not null default now()
);
create table if not exists public.child_need_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('appointment','assessment','professional','observation','progress','emotion','sleep','routine','school')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text check (char_length(body) <= 4000),
  occurred_on date not null default current_date,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists child_need_entries_idx on public.child_need_entries(child_id, occurred_on desc);
-- Traitement : recopié EXACTEMENT de l'ordonnance ; l'application ne calcule ni ne modifie aucune dose
create table if not exists public.child_treatments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  dose_text text not null check (char_length(btrim(dose_text)) between 1 and 120),
  times text[] not null check (cardinality(times) between 1 and 6),
  frequency text not null default 'daily' check (frequency in ('daily','weekly','as_prescribed')),
  weekdays smallint[] not null default '{}',
  start_date date not null,
  end_date date,
  instructions text check (char_length(instructions) <= 2000),
  prescriber text check (char_length(prescriber) <= 120),
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (frequency <> 'weekly' or cardinality(weekdays) > 0)
);
create table if not exists public.treatment_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  treatment_id uuid not null references public.child_treatments(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('taken','snoozed','skipped')),
  note text check (char_length(note) <= 1000),
  logged_by uuid default auth.uid() references auth.users(id) on delete set null,
  logged_at timestamptz not null default now(),
  unique (treatment_id, scheduled_for)
);
select public._apply_household_policies('child_needs', 'health');
select public._apply_household_policies('child_need_entries', 'health');
select public._apply_household_policies('child_treatments', 'health');
select public._apply_household_policies('treatment_logs', 'health');
revoke all on public.child_needs, public.child_need_entries, public.child_treatments, public.treatment_logs from anon;
create trigger child_treatments_touch before update on public.child_treatments for each row execute function public.touch_updated_at();
alter table public.reminders add column if not exists treatment_id uuid references public.child_treatments(id) on delete cascade;

-- 6 bis. Suppression définitive d'un parcours demandée par l'utilisatrice.
-- Seules les données datées de la période de CE parcours sont effacées, jamais celles d'un autre parcours
-- (un jour partagé avec un autre parcours de cycle est conservé). Grossesse : la grossesse et tout ce qui lui
-- appartient (bébés attendus, listes, rendez-vous, rappels, poids). Bébé ou enfant : le profil de l'enfant est
-- conservé (il se supprime depuis sa fiche) ; seul le parcours est effacé.
create or replace function public.delete_journey(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare j public.user_journeys; v_from date; v_to date; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into j from public.user_journeys where id = p_id and user_id = v_uid;
  if not found then raise exception 'Parcours introuvable' using errcode = 'P0002'; end if;
  v_from := j.started_on; v_to := coalesce(j.ended_on, current_date);
  if j.type in ('avoid', 'ttc', 'cycle') then
    create temp table if not exists _keep_days (d date primary key) on commit drop;
    delete from _keep_days;
    insert into _keep_days select generate_series(o.started_on, coalesce(o.ended_on, current_date), interval '1 day')::date
      from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type in ('avoid', 'ttc', 'cycle') on conflict do nothing;
    delete from public.period_entries where user_id = v_uid and start_date between v_from and v_to and start_date not in (select d from _keep_days);
    delete from public.symptom_logs where user_id = v_uid and logged_on between v_from and v_to and logged_on not in (select d from _keep_days);
    delete from public.discharge_logs where user_id = v_uid and observed_at::date between v_from and v_to and observed_at::date not in (select d from _keep_days);
    delete from public.bleeding_logs where user_id = v_uid and occurred_on between v_from and v_to and occurred_on not in (select d from _keep_days);
    delete from public.cycle_journal where user_id = v_uid and entry_on between v_from and v_to and entry_on not in (select d from _keep_days);
    delete from public.fertility_observations where user_id = v_uid and observed_on between v_from and v_to and observed_on not in (select d from _keep_days);
    delete from public.ovulation_tests where user_id = v_uid and tested_at::date between v_from and v_to and tested_at::date not in (select d from _keep_days);
    delete from public.pregnancy_tests where user_id = v_uid and tested_at::date between v_from and v_to and tested_at::date not in (select d from _keep_days);
    delete from public.intercourse_logs where user_id = v_uid and occurred_on between v_from and v_to and occurred_on not in (select d from _keep_days);
    -- rappels : arrêtés seulement si aucun parcours actif du même type ne les utilise encore
    if not exists (select 1 from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type = j.type and o.status = 'active') then
      update public.reminders set enabled = false where user_id = v_uid and journey_type = j.type;
    end if;
  elsif j.type = 'pregnancy' then
    -- Grossesse encore suivie dans un autre parcours actif (conjoint) : seul MON parcours est effacé
    if not exists (select 1 from public.user_journeys o where o.pregnancy_id = j.pregnancy_id and o.id <> j.id and o.status = 'active') then
      delete from public.maternal_weights where pregnancy_id = j.pregnancy_id;
      delete from public.pregnancies where id = j.pregnancy_id; -- bébés attendus, listes, rendez-vous, rappels : en cascade
    end if;
  elsif j.type = 'postpartum' then
    delete from public.postpartum_checkins where user_id = v_uid and checkin_date between v_from and v_to;
    delete from public.postpartum_actions where user_id = v_uid and done_on between v_from and v_to;
    if j.status = 'active' or not exists (select 1 from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type = 'postpartum' and o.status = 'active') then
      delete from public.postpartum_shared_status where user_id = v_uid;
      update public.postpartum_settings set active = false where user_id = v_uid;
    end if;
  end if;
  delete from public.user_journeys where id = j.id;
end $$;
revoke execute on function public.delete_journey(uuid) from public, anon;
grant execute on function public.delete_journey(uuid) to authenticated;

-- 7. Création des parcours à partir des données actuelles (rien n'est supprimé)
alter table public.user_journeys disable trigger user_journeys_after;
do $$
declare p record; v_body text; v_preg uuid; c record;
begin
  for p in select id, journeys from public.profiles loop
    v_preg := null;
    if 'pregnant' = any(p.journeys) then
      select pr.id into v_preg from public.pregnancies pr
        join public.household_members hm on hm.household_id = pr.household_id and hm.user_id = p.id
        where pr.status = 'active' order by (pr.carrier_user_id = p.id) desc nulls last, pr.created_at desc limit 1;
    end if;
    -- Parcours « corps » : grossesse active d'abord, sinon projet bébé, éviter, cycle (un seul actif)
    v_body := case when v_preg is not null then 'pregnancy' when 'ttc' = any(p.journeys) then 'ttc' when 'avoid' = any(p.journeys) then 'avoid' when 'cycle' = any(p.journeys) then 'cycle' end;
    if v_body = 'pregnancy' then
      insert into public.user_journeys (user_id, household_id, type, pregnancy_id, started_on)
        select p.id, pr.household_id, 'pregnancy', pr.id, least(coalesce(pr.lmp_date, pr.created_at::date), current_date) from public.pregnancies pr where pr.id = v_preg;
    elsif v_body is not null then
      -- Commencé à la création du compte (ou à la première règle notée) : toutes les données existantes lui appartiennent
      insert into public.user_journeys (user_id, type, started_on) values (p.id, v_body, least(current_date,
        coalesce((select u.created_at::date from auth.users u where u.id = p.id), current_date),
        coalesce((select min(pe.start_date) from public.period_entries pe where pe.user_id = p.id), current_date)));
    end if;
    -- Les autres parcours « corps » cochés restent visibles dans « Mes parcours précédents »
    insert into public.user_journeys (user_id, type, status, ended_on, end_reason)
      select p.id, t, 'archived', current_date, 'migrated' from unnest(array['ttc','avoid','cycle']) t
      where t = any(p.journeys) and t is distinct from v_body;
    -- Enfants : un parcours par enfant du foyer (bébé avant 2 ans, enfant ensuite)
    -- (tous les enfants du foyer, quel que soit l'ancien choix : aucun enfant ne disparaît du sélecteur)
    if true then
      for c in select ch.id, ch.household_id, ch.birth_date from public.children ch
          join public.household_members hm on hm.household_id = ch.household_id and hm.user_id = p.id where not ch.archived loop
        insert into public.user_journeys (user_id, household_id, type, child_id, started_on)
          values (p.id, c.household_id, case when c.birth_date > current_date - 730 then 'baby' else 'child' end, c.id, least(c.birth_date, current_date));
      end loop;
    end if;
  end loop;
end $$;
alter table public.user_journeys enable trigger user_journeys_after;
do $$ declare p record; begin for p in select id from public.profiles loop perform public.sync_profile_journeys(p.id); end loop; end $$;

-- 7 bis. Poids saisis sans grossesse associée : rattachés à la grossesse active de la personne s'ils datent
-- de cette grossesse (sinon ils restent sans lien et n'apparaissent dans aucune nouvelle grossesse)
update public.maternal_weights w set pregnancy_id = pr.id
  from public.pregnancies pr
  join public.household_members hm on hm.household_id = pr.household_id
  where w.pregnancy_id is null and pr.status = 'active' and hm.user_id = w.user_id
    and (pr.carrier_user_id is null or pr.carrier_user_id = w.user_id)
    and w.measured_on >= coalesce(pr.lmp_date, pr.due_date - 287);

-- 7 ter. Chaque rappel appartient à un parcours (déduit du lien s'il n'est pas indiqué) : archiver ce parcours l'arrête
create or replace function public._reminder_journey_type(p_user uuid, p_link text, p_pregnancy uuid, p_child uuid)
returns text language sql stable security invoker set search_path = public as $$
  -- Exécutée avec les droits de la personne (RLS) : ne lit que SES parcours, ne révèle rien d'autrui
  select case
    when p_pregnancy is not null or p_link like '/pregnancy%' then 'pregnancy'
    when p_link like '/fertility%' then 'ttc'
    when p_link like '/contraception%' then 'avoid'
    when p_link like '/cycle%' then coalesce((select type from public.user_journeys where user_id = p_user and user_id = auth.uid() and status = 'active' and type in ('avoid','ttc','cycle') limit 1), 'cycle')
    when p_link like '/postpartum%' then 'postpartum'
    when p_child is not null and (p_link like '/bottle%' or p_link like '/track%') then 'baby'
    else null end
$$;
revoke execute on function public._reminder_journey_type(uuid, text, uuid, uuid) from public, anon;
grant execute on function public._reminder_journey_type(uuid, text, uuid, uuid) to authenticated;
create or replace function public.reminders_journey_type() returns trigger language plpgsql set search_path = public as $$
begin
  if new.journey_type is null then new.journey_type := public._reminder_journey_type(new.user_id, new.deep_link, new.pregnancy_id, new.child_id); end if;
  return new;
end $$;
drop trigger if exists reminders_journey_type on public.reminders;
create trigger reminders_journey_type before insert on public.reminders for each row execute function public.reminders_journey_type();
update public.reminders r set journey_type = case
    when r.pregnancy_id is null and r.deep_link like '/cycle%' then coalesce((select j.type from public.user_journeys j where j.user_id = r.user_id and j.status = 'active' and j.type in ('avoid','ttc','cycle') limit 1), 'cycle')
    else public._reminder_journey_type(r.user_id, r.deep_link, r.pregnancy_id, r.child_id) end
  where r.journey_type is null;

-- 8. Export RGPD : parcours inclus
alter function public.export_my_data() rename to _export_my_data_v8;
revoke execute on function public._export_my_data_v8() from public, anon, authenticated;
create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v8() || jsonb_build_object(
    'user_journeys', (select coalesce(jsonb_agg(x order by x.started_on), '[]') from public.user_journeys x where x.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
