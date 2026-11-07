-- =====================================================================
-- Traitements de la maman (07/11/2026) — migration ADDITIVE.
-- Même principe que child_treatments : le nom et la dose sont RECOPIÉS de l'ordonnance ou de la notice ;
-- l'application ne calcule, ne propose ni ne modifie aucune dose.
-- Strictement PERSONNEL (propriétaire seule) : ni le co-parent ni un autre membre du foyer ne les voit.
--   my_treatments      : le traitement (heures de prise, fréquence, dates, consignes, prescripteur)
--   my_treatment_logs  : chaque prise notée (prise, reportée, ignorée) + note facultative
--   reminders.my_treatment_id : un rappel par heure de prise, supprimé avec le traitement
--
-- Retour arrière (après accord) :
--   drop function public.export_my_data(); alter function public._export_my_data_v25() rename to export_my_data;
--   alter table public.reminders drop column my_treatment_id;
--   drop table public.my_treatment_logs; drop table public.my_treatments;
--   drop function public._my_treatment_log_own(); drop function public._reminder_my_treatment_own();
-- =====================================================================
create table if not exists public.my_treatments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (frequency <> 'weekly' or cardinality(weekdays) > 0)
);
create index if not exists my_treatments_user_idx on public.my_treatments(user_id);
select public._apply_owner_policies('my_treatments');
create trigger my_treatments_touch before update on public.my_treatments for each row execute function public.touch_updated_at();

create table if not exists public.my_treatment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  treatment_id uuid not null references public.my_treatments(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('taken','snoozed','skipped')),
  note text check (char_length(note) <= 1000),
  logged_at timestamptz not null default now(),
  unique (treatment_id, scheduled_for)
);
create index if not exists my_treatment_logs_idx on public.my_treatment_logs(user_id, scheduled_for desc);
select public._apply_owner_policies('my_treatment_logs');

-- On ne note une prise que pour SON propre traitement
create or replace function public._my_treatment_log_own() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.my_treatments t where t.id = new.treatment_id and t.user_id = new.user_id) then
    raise exception 'Traitement inconnu' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._my_treatment_log_own() from public, anon, authenticated;
drop trigger if exists my_treatment_log_own on public.my_treatment_logs;
create trigger my_treatment_log_own before insert or update on public.my_treatment_logs
  for each row execute function public._my_treatment_log_own();

alter table public.reminders add column if not exists my_treatment_id uuid references public.my_treatments(id) on delete cascade;
create index if not exists reminders_my_treatment_idx on public.reminders(my_treatment_id) where my_treatment_id is not null;
-- Un rappel ne peut viser que SON propre traitement
create or replace function public._reminder_my_treatment_own() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.my_treatment_id is not null and not exists (select 1 from public.my_treatments t where t.id = new.my_treatment_id and t.user_id = new.user_id) then
    raise exception 'Traitement inconnu' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._reminder_my_treatment_own() from public, anon, authenticated;
drop trigger if exists reminder_my_treatment_own on public.reminders;
create trigger reminder_my_treatment_own before insert or update of my_treatment_id, user_id on public.reminders
  for each row execute function public._reminder_my_treatment_own();

alter function public.export_my_data() rename to _export_my_data_v25;
revoke execute on function public._export_my_data_v25() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v25() || jsonb_build_object(
    'my_treatments', (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at), '[]') from public.my_treatments t where t.user_id = v_uid),
    'my_treatment_logs', (select coalesce(jsonb_agg(to_jsonb(l) order by l.scheduled_for), '[]') from public.my_treatment_logs l where l.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
