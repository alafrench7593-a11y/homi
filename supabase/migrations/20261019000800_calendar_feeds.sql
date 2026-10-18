-- =====================================================================
-- Abonnement iCalendar : un lien secret, propre à une personne, que Google Agenda, Apple
-- Calendrier ou Outlook interrogent régulièrement (synchronisation à sens unique).
--  - le jeton n'est JAMAIS stocké : seulement son empreinte SHA-256 ; il est montré une fois ;
--  - révocable à tout moment, et sans effet si la personne quitte le foyer ;
--  - mêmes droits que dans l'application : un rendez-vous de santé n'apparaît que si la personne a
--    le droit de les voir, un rendez-vous privé seulement pour sa créatrice, le temps pour soi
--    seulement pour la personne concernée ; titres de santé neutres par défaut ;
--  - lecture des données réservée au rôle serveur (fonction « calendar-feed »).
-- =====================================================================
create table public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Agenda familial' check (char_length(label) between 1 and 60),
  include_health_titles boolean not null default false,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  revoked_at timestamptz
);
create index calendar_feeds_user_idx on public.calendar_feeds(user_id) where revoked_at is null;
alter table public.calendar_feeds enable row level security;
-- La personne voit ses liens (sans le jeton) ; création et révocation passent par les fonctions ci-dessous
create policy calendar_feeds_sel on public.calendar_feeds for select to authenticated using (user_id = auth.uid());
-- l'empreinte du jeton n'est lisible par personne côté application
revoke all on public.calendar_feeds from authenticated, anon;
grant select (id, user_id, household_id, label, include_health_titles, created_at, last_accessed_at, revoked_at) on public.calendar_feeds to authenticated;

create or replace function public.create_calendar_feed(p_household uuid, p_include_health_titles boolean default false, p_label text default 'Agenda familial')
returns table (id uuid, token text) language plpgsql security definer set search_path = public, extensions as $$
declare v_token text; v_id uuid;
begin
  if auth.uid() is null or not public.is_member_of(p_household, auth.uid()) then
    raise exception 'Vous n''avez pas l''autorisation de faire cette action.' using errcode = '42501';
  end if;
  if (select count(*) from public.calendar_feeds f where f.user_id = auth.uid() and f.revoked_at is null) >= 5 then
    raise exception 'Cinq liens actifs au plus : révoquez-en un d''abord.' using errcode = 'P0001';
  end if;
  v_token := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.calendar_feeds(user_id, household_id, token_hash, include_health_titles, label)
    values (auth.uid(), p_household, encode(extensions.digest(v_token, 'sha256'), 'hex'), coalesce(p_include_health_titles, false), coalesce(nullif(trim(p_label), ''), 'Agenda familial'))
    returning calendar_feeds.id into v_id;
  return query select v_id, v_token;
end $$;
revoke all on function public.create_calendar_feed(uuid, boolean, text) from public, anon;
grant execute on function public.create_calendar_feed(uuid, boolean, text) to authenticated;

create or replace function public.revoke_calendar_feed(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.calendar_feeds set revoked_at = now() where id = p_id and user_id = auth.uid() and revoked_at is null;
  if not found then raise exception 'Lien introuvable.' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.revoke_calendar_feed(uuid) from public, anon;
grant execute on function public.revoke_calendar_feed(uuid) to authenticated;

-- Données du flux, avec les droits de la personne propriétaire du lien. Réservé au serveur.
create or replace function public.calendar_feed_data(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare f public.calendar_feeds; v_from timestamptz := now() - interval '31 days'; v_to timestamptz := now() + interval '366 days';
begin
  select * into f from public.calendar_feeds
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and revoked_at is null;
  if not found or not public.is_member_of(f.household_id, f.user_id) then return null; end if;
  -- les vérifications de droits ci-dessous (can_access_household) s'évaluent pour CETTE personne
  perform set_config('request.jwt.claim.sub', f.user_id::text, true);
  update public.calendar_feeds set last_accessed_at = now() where id = f.id;
  return jsonb_build_object(
    'feed', jsonb_build_object('id', f.id, 'label', f.label, 'include_health_titles', f.include_health_titles),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public.family_events e
        where e.household_id = f.household_id and public.can_access_household(e.household_id, 'lists', false)
          and (e.recurrence is not null or (e.starts_at < v_to and coalesce(e.ends_at, e.starts_at) > v_from))), '[]'::jsonb),
    'appointments', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'starts_at', a.starts_at, 'location_label', a.location_label, 'kind', a.kind, 'private_to_creator', a.private_to_creator))
        from public.appointments a
        where a.household_id = f.household_id and public.can_access_household(a.household_id, 'health', false)
          and (not a.private_to_creator or a.created_by = f.user_id) and a.starts_at between v_from and v_to), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'status', t.status, 'assignee_id', t.assignee_id))
        from public.family_tasks t
        where t.household_id = f.household_id and public.can_access_household(t.household_id, 'lists', false)
          and t.due_at between v_from and v_to and t.status <> 'cancelled'), '[]'::jsonb),
    'shifts', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'user_id', s.user_id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'status', s.status))
        from public.care_shifts s
        where s.household_id = f.household_id and public.can_access_household(s.household_id, 'lists', false)
          and (s.kind = 'night' or s.user_id = f.user_id) and s.starts_at between v_from and v_to), '[]'::jsonb)
  );
end $$;
revoke all on function public.calendar_feed_data(text) from public, anon, authenticated;
grant execute on function public.calendar_feed_data(text) to service_role;
