-- =====================================================================
-- Communauté « Sorties & rencontres » :
--  · place_suggestions : lieux publics proposés par les membres. Jamais affichés avant validation par la
--    modération ; toujours présentés comme « proposé par un membre » ; équipements et horaires « selon un
--    membre », jamais comme confirmés.
--  · community_meetups : rencontres DE GROUPE (3 places au moins) proposées par une utilisatrice, uniquement
--    dans un lieu public référencé (OpenStreetMap, établissement Google, ou lieu proposé et validé) : aucune
--    adresse personnelle, aucun rendez-vous à deux, aucune messagerie. Texte contrôlé comme les publications
--    (coordonnées personnelles -> à relire par la modération).
--  · meetup_participants : « Je participe » / annuler ; la liste des participantes n'est jamais publique (seul le
--    nombre de places restantes l'est) ; blocages respectés dans les deux sens.
--  · reports : une annonce de rencontre ou un lieu proposé peuvent être signalés (en plus des publications,
--    commentaires et membres).
-- Retour arrière :
--   drop table public.meetup_participants, public.community_meetups, public.place_suggestions;
--   alter table public.reports drop column meetup_id, drop column place_suggestion_id; (rétablir reports_target_check)
--   (puis restaurer export_my_data précédent : _export_my_data_v17)
-- =====================================================================

create table if not exists public.place_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category ~ '^[a-z_]{2,40}$'),
  address_public text not null check (char_length(address_public) between 5 and 240),
  city text check (city is null or char_length(city) <= 80),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  min_age smallint check (min_age is null or min_age between 0 and 18),
  max_age smallint check (max_age is null or max_age between 0 and 18),
  equipment text[] not null default '{}' check (equipment <@ array['stroller','highchair','changing_table','baby_area']::text[]),
  activities text check (activities is null or char_length(activities) <= 500),
  hours_text text check (hours_text is null or char_length(hours_text) <= 200),
  website text check (website is null or website ~ '^https://'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists place_suggestions_geo on public.place_suggestions(status, lat, lon);
alter table public.place_suggestions enable row level security;
drop policy if exists place_sugg_read on public.place_suggestions;
create policy place_sugg_read on public.place_suggestions for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or public.has_role('moderator'));
drop policy if exists place_sugg_insert on public.place_suggestions;
create policy place_sugg_insert on public.place_suggestions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists place_sugg_delete_own on public.place_suggestions;
create policy place_sugg_delete_own on public.place_suggestions for delete to authenticated using ((user_id = auth.uid() and status = 'pending') or public.has_role('moderator'));
drop policy if exists place_sugg_moderate on public.place_suggestions;
create policy place_sugg_moderate on public.place_suggestions for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Toujours « en attente » à la création (seule la modération valide)
create or replace function public.place_suggestion_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.moderated_at := null;
    if public.community_text_needs_review(coalesce(new.name, '') || ' ' || coalesce(new.activities, '') || ' ' || coalesce(new.hours_text, '')) then
      -- reste en attente ; la modération verra la suggestion comme toute autre
      null;
    end if;
  elsif new.status is distinct from old.status then
    new.moderated_at := now();
  end if;
  if new.min_age is not null and new.max_age is not null and new.max_age < new.min_age then
    raise exception 'Tranche d''âge invalide' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists place_suggestion_guard on public.place_suggestions;
create trigger place_suggestion_guard before insert or update on public.place_suggestions for each row execute function public.place_suggestion_guard();

create table if not exists public.community_meetups (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  activity text not null check (char_length(activity) between 3 and 500),
  -- lieu public référencé : osm:node/123, google:ChIJ…, sugg:<uuid d'un lieu validé>
  place_ref text not null check (place_ref ~ '^(osm:(node|way|relation)/[0-9]{1,15}|google:[A-Za-z0-9_-]{10,200}|sugg:[0-9a-f-]{36})$'),
  place_name text not null check (char_length(place_name) between 2 and 160),
  place_address text check (place_address is null or char_length(place_address) <= 240),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  city_label text check (city_label is null or char_length(city_label) <= 80),
  starts_at timestamptz not null,
  duration_min smallint not null default 90 check (duration_min between 30 and 240),
  child_age_min smallint not null default 0 check (child_age_min between 0 and 10),
  child_age_max smallint not null default 10 check (child_age_max between 0 and 10),
  for_pregnant boolean not null default false,
  capacity smallint not null check (capacity between 3 and 20),
  participants_count smallint not null default 0,
  status text not null default 'visible' check (status in ('visible','pending_review','cancelled','removed')),
  created_at timestamptz not null default now(),
  check (child_age_max >= child_age_min)
);
create index if not exists community_meetups_when on public.community_meetups(status, starts_at);
alter table public.community_meetups enable row level security;
drop policy if exists meetups_read on public.community_meetups;
create policy meetups_read on public.community_meetups for select to authenticated using (
  (status in ('visible','cancelled') and not public.is_blocked_between(organizer_id, auth.uid()))
  or organizer_id = auth.uid() or public.has_role('moderator'));
drop policy if exists meetups_insert on public.community_meetups;
create policy meetups_insert on public.community_meetups for insert to authenticated with check (organizer_id = auth.uid());
drop policy if exists meetups_update on public.community_meetups;
create policy meetups_update on public.community_meetups for update to authenticated using (organizer_id = auth.uid() or public.has_role('moderator')) with check (organizer_id = auth.uid() or public.has_role('moderator'));

create or replace function public.meetup_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_profile public.community_profiles;
begin
  -- mises à jour internes (compteur de places, mise de côté après signalements) : tenues par les déclencheurs
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1 then return new; end if;
  if public.has_role('moderator') and tg_op = 'UPDATE' then return new; end if;
  if tg_op = 'INSERT' then
    select * into v_profile from public.community_profiles where user_id = auth.uid();
    if v_profile.user_id is null then raise exception 'Créez d''abord votre profil communautaire' using errcode = 'P0001'; end if;
    if v_profile.suspended_until is not null and v_profile.suspended_until > now() then raise exception 'Compte suspendu' using errcode = 'P0001'; end if;
    if new.starts_at < now() + interval '1 hour' or new.starts_at > now() + interval '60 days' then
      raise exception 'La rencontre doit avoir lieu entre 1 heure et 60 jours à partir de maintenant' using errcode = 'P0001';
    end if;
    if new.place_ref like 'sugg:%' and not exists (select 1 from public.place_suggestions s where 'sugg:' || s.id::text = new.place_ref and s.status = 'approved') then
      raise exception 'Choisissez un lieu public validé' using errcode = 'P0001';
    end if;
    new.participants_count := 0;
    new.status := case when public.community_text_needs_review(new.title || ' ' || new.activity) then 'pending_review' else 'visible' end;
  else
    -- l'organisatrice peut annuler ou corriger le texte ; jamais republier une annonce retirée par la modération
    if old.status = 'removed' then raise exception 'Annonce retirée par la modération' using errcode = 'P0001'; end if;
    if new.status not in ('visible','cancelled','pending_review') then raise exception 'Statut non autorisé' using errcode = '42501'; end if;
    -- seule la modération remet en ligne une annonce à relire
    if old.status = 'pending_review' and new.status = 'visible' then new.status := 'pending_review'; end if;
    if new.place_ref <> old.place_ref or new.capacity < old.participants_count then raise exception 'Modification impossible' using errcode = 'P0001'; end if;
    new.participants_count := old.participants_count;
    if (new.title, new.activity) is distinct from (old.title, old.activity) and new.status = 'visible'
       and public.community_text_needs_review(new.title || ' ' || new.activity) then new.status := 'pending_review'; end if;
  end if;
  return new;
end $$;
drop trigger if exists meetup_guard on public.community_meetups;
create trigger meetup_guard before insert or update on public.community_meetups for each row execute function public.meetup_guard();

create table if not exists public.meetup_participants (
  meetup_id uuid not null references public.community_meetups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);
alter table public.meetup_participants enable row level security;
-- Chacune ne voit que sa propre participation (la liste n'est jamais publique)
drop policy if exists meetup_part_own on public.meetup_participants;
create policy meetup_part_own on public.meetup_participants for select to authenticated using (user_id = auth.uid() or public.has_role('moderator'));
drop policy if exists meetup_part_insert on public.meetup_participants;
create policy meetup_part_insert on public.meetup_participants for insert to authenticated with check (user_id = auth.uid());
drop policy if exists meetup_part_delete on public.meetup_participants;
create policy meetup_part_delete on public.meetup_participants for delete to authenticated using (user_id = auth.uid());

create or replace function public.meetup_participant_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare m public.community_meetups;
begin
  select * into m from public.community_meetups where id = coalesce(new.meetup_id, old.meetup_id) for update;
  if tg_op = 'INSERT' then
    if m.id is null or m.starts_at < now()
       or not (m.status = 'visible' or (m.status = 'pending_review' and new.user_id = m.organizer_id)) then
      raise exception 'Inscription impossible' using errcode = 'P0001';
    end if;
    if public.is_blocked_between(m.organizer_id, new.user_id) then raise exception 'Inscription impossible' using errcode = 'P0001'; end if;
    if m.participants_count >= m.capacity then raise exception 'Cette rencontre est complète' using errcode = 'P0001'; end if;
    update public.community_meetups set participants_count = participants_count + 1 where id = m.id;
    return new;
  end if;
  if m.id is not null then update public.community_meetups set participants_count = greatest(0, participants_count - 1) where id = m.id; end if;
  return old;
end $$;
drop trigger if exists meetup_participant_guard on public.meetup_participants;
create trigger meetup_participant_guard before insert or delete on public.meetup_participants for each row execute function public.meetup_participant_guard();
-- L'organisatrice participe d'office
create or replace function public.meetup_organizer_joins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('visible','pending_review') then
    insert into public.meetup_participants(meetup_id, user_id) values (new.id, new.organizer_id) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists meetup_organizer_joins on public.community_meetups;
create trigger meetup_organizer_joins after insert on public.community_meetups for each row execute function public.meetup_organizer_joins();

-- Signalements : annonce de rencontre ou lieu proposé
alter table public.reports add column if not exists meetup_id uuid references public.community_meetups(id) on delete cascade;
alter table public.reports add column if not exists place_suggestion_id uuid references public.place_suggestions(id) on delete cascade;
alter table public.reports drop constraint if exists reports_target_check;
alter table public.reports add constraint reports_target_check check (num_nonnulls(post_id, comment_id, reported_user, meetup_id, place_suggestion_id) = 1);
create unique index if not exists reports_unique_meetup on public.reports(reporter_id, meetup_id) where meetup_id is not null and status = 'open';
create unique index if not exists reports_unique_place_sugg on public.reports(reporter_id, place_suggestion_id) where place_suggestion_id is not null and status = 'open';
-- Trois signalements ouverts : l'annonce est mise de côté jusqu'à la décision de la modération
create or replace function public.meetup_auto_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.meetup_id is not null and (select count(*) from public.reports where meetup_id = new.meetup_id and status = 'open') >= 3 then
    update public.community_meetups set status = 'pending_review' where id = new.meetup_id and status = 'visible';
  end if;
  return new;
end $$;
drop trigger if exists meetup_auto_review on public.reports;
create trigger meetup_auto_review after insert on public.reports for each row execute function public.meetup_auto_review();

-- Export RGPD
alter function public.export_my_data() rename to _export_my_data_v17;
revoke execute on function public._export_my_data_v17() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public._export_my_data_v17() || jsonb_build_object(
    'community_meetups', (select coalesce(jsonb_agg(to_jsonb(m) order by m.starts_at), '[]') from public.community_meetups m where m.organizer_id = auth.uid()),
    'meetup_participations', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.meetup_participants p where p.user_id = auth.uid()),
    'place_suggestions', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.place_suggestions s where s.user_id = auth.uid()));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
