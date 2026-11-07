-- =====================================================================
-- « C'est fait » (07/11/2026) — migration ADDITIVE.
-- daily_checks : la personne valide un rappel (vitamine, médicament de routine, rappel perso…) pour UN jour donné,
-- depuis la notification (« C'est fait ») ou depuis « Ma journée ». Un rappel validé n'est pas re-rappelé ce jour-là
-- (report) et apparaît coché. Strictement personnel (propriétaire seul), comme les rappels.
-- Les tâches du foyer, elles, se valident dans family_tasks (status = 'done', done_at, done_by) : rien à ajouter.
--
-- Retour arrière (après accord) :
--   drop function public.export_my_data(); alter function public._export_my_data_v24() rename to export_my_data;
--   drop table public.daily_checks;
-- =====================================================================
create table if not exists public.daily_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  on_date date not null,
  done_at timestamptz not null default now(),
  source text not null default 'app' check (source in ('app', 'notification')),
  unique (user_id, reminder_id, on_date),
  constraint daily_checks_date_check check (on_date between date '2020-01-01' and current_date + 1)
);
create index if not exists daily_checks_user_date_idx on public.daily_checks(user_id, on_date desc);
create index if not exists daily_checks_reminder_idx on public.daily_checks(reminder_id);
select public._apply_owner_policies('daily_checks');

-- On ne valide que ses propres rappels
create or replace function public._daily_check_own_reminder() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.reminders r where r.id = new.reminder_id and r.user_id = new.user_id) then
    raise exception 'Rappel inconnu' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._daily_check_own_reminder() from public, anon, authenticated;
drop trigger if exists daily_check_own_reminder on public.daily_checks;
create trigger daily_check_own_reminder before insert or update on public.daily_checks
  for each row execute function public._daily_check_own_reminder();

alter function public.export_my_data() rename to _export_my_data_v24;
revoke execute on function public._export_my_data_v24() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v24() || jsonb_build_object(
    'daily_checks', (select coalesce(jsonb_agg(to_jsonb(c) order by c.on_date), '[]') from public.daily_checks c where c.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
