-- =====================================================================
-- Fondations du foyer (13/11/2026) — F. Notifications respectueuses appliquées par le SERVEUR
--
-- Avant : les heures calmes n'existaient que sur le téléphone (notifications locales) ; la fonction
-- send-push envoyait les notifications du serveur à toute heure, avec leur titre réel.
--
-- 1. notification_settings (une ligne par personne, strictement personnelle) : heures calmes (activées,
--    début, fin, fuseau horaire IANA) et « détail sur l'écran verrouillé » (FAUX par défaut).
--    Sans ligne : heures calmes 22 h → 7 h (Europe/Paris) et textes génériques (mêmes valeurs par défaut
--    que l'application, src/lib/domain/autoNotifs.ts).
-- 2. notifications.deliver_after : envoi différé (fin des heures calmes) posé par send-push ;
--    notifications.urgent : jamais différée (posée par le serveur seulement : aucun client ne peut insérer
--    de notification). Une notification n'est JAMAIS marquée lue par l'envoi (read_at n'est écrit que par
--    la personne elle-même dans l'application) : pas de preuve de lecture.
-- 3. push_quiet_until(user, instant) : fin des heures calmes en cours pour cette personne (NULL si hors
--    heures calmes), utilisée par send-push ; réservée au serveur.
--
-- Retour arrière : drop table public.notification_settings; drop function public.push_quiet_until(uuid, timestamptz);
--   alter table public.notifications drop column deliver_after, drop column urgent;
-- =====================================================================

create table if not exists public.notification_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  quiet_enabled boolean not null default true,
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  time_zone text not null default 'Europe/Paris' check (char_length(time_zone) between 1 and 64),
  lockscreen_details boolean not null default false,
  updated_at timestamptz not null default now()
);
-- Fuseau inconnu refusé (sinon le serveur ne saurait pas calculer l'heure locale)
create or replace function public.notification_settings_check()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.time_zone) then
    raise exception 'Fuseau horaire inconnu : %', new.time_zone using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists notification_settings_check on public.notification_settings;
create trigger notification_settings_check before insert or update on public.notification_settings
  for each row execute function public.notification_settings_check();
select public._apply_owner_policies('notification_settings');

alter table public.notifications add column if not exists deliver_after timestamptz;
alter table public.notifications add column if not exists urgent boolean not null default false;
create index if not exists notifications_push_todo_idx on public.notifications(coalesce(deliver_after, created_at)) where pushed_at is null;

-- Fin des heures calmes en cours (NULL : pas d'heures calmes à cet instant)
create or replace function public.push_quiet_until(p_user uuid, p_at timestamptz default now())
returns timestamptz language plpgsql stable security definer set search_path = public as $$
declare s public.notification_settings; v_local timestamp; v_t time; v_end timestamp;
begin
  select * into s from public.notification_settings where user_id = p_user;
  if not found then
    s.quiet_enabled := true; s.quiet_start := '22:00'; s.quiet_end := '07:00'; s.time_zone := 'Europe/Paris';
  end if;
  if not s.quiet_enabled or s.quiet_start = s.quiet_end then return null; end if;
  v_local := p_at at time zone s.time_zone;
  v_t := v_local::time;
  if s.quiet_start < s.quiet_end then                         -- ex. 13 h → 15 h (même jour)
    if v_t >= s.quiet_start and v_t < s.quiet_end then v_end := v_local::date + s.quiet_end; end if;
  else                                                         -- ex. 22 h → 7 h (passe minuit)
    if v_t >= s.quiet_start then v_end := v_local::date + 1 + s.quiet_end;
    elsif v_t < s.quiet_end then v_end := v_local::date + s.quiet_end; end if;
  end if;
  return case when v_end is null then null else v_end at time zone s.time_zone end;
end $$;
revoke execute on function public.push_quiet_until(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.push_quiet_until(uuid, timestamptz) to service_role;

-- Une personne ne peut pas se fabriquer une notification « urgente » ni décider de son envoi :
-- seules read_at (lue par elle-même) reste modifiable par l'application.
create or replace function public.notifications_client_guard()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and pg_trigger_depth() = 1 then
    new.urgent := old.urgent; new.deliver_after := old.deliver_after; new.pushed_at := old.pushed_at;
  end if;
  return new;
end $$;
drop trigger if exists notifications_client_guard on public.notifications;
create trigger notifications_client_guard before update on public.notifications
  for each row execute function public.notifications_client_guard();
