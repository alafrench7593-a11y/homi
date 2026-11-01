-- =====================================================================
-- Campagne QA du 02/11/2026 (lot B, communauté) — correctifs serveur, tous additifs.
--
-- B-02 (P1, vie privée) : « Bloquer » l'autrice d'une publication ANONYME enregistrait son identité
--   et l'affichait ensuite dans « Personnes bloquées ». → refusé pour une publication anonyme
--   (il reste « Signaler » et « Masquer »).
-- B-04 (P2) : « J'aime », « Enregistrer » et « Signaler » acceptés sur une publication qu'on ne peut
--   pas lire (groupe privé, publication masquée, autrice qui nous a bloquée). → contrôle de lecture.
-- B-13 (P4) : on pouvait signaler sa propre publication (et déclencher son masquage). → refusé.
-- B-05 (P3) + B-06 (P4) : atelier surréservé en cas d'inscriptions simultanées ; message « complet »
--   pour une personne déjà inscrite. → verrou sur l'atelier, déjà inscrite vérifiée d'abord.
-- B-08 (P3) : l'autrice d'un sondage pouvait ajouter des choix après les votes des AUTRES
--   (le contrôle ne voyait que ses propres votes). → contrôle sur tous les votes.
-- B-09 (P3) : les notifications d'une publication supprimée restaient. → supprimées avec elle.
-- B-11, B-16 (P4) : publication / commentaire faits d'espaces ; atelier qui finit avant de commencer.
--   → contraintes sur les NOUVELLES lignes (NOT VALID : rien d'existant n'est bloqué).
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- B-02 --------------------------------------------------------------
create or replace function public.block_author(p_post uuid default null, p_comment uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_anonymous boolean := false;
begin
  if p_post is not null then select author_id, coalesce(anonymous, false) into v_author, v_anonymous from public.posts where id = p_post;
  else select author_id into v_author from public.comments where id = p_comment; end if;
  if v_anonymous then
    raise exception 'Publication anonyme : vous pouvez la signaler ou la masquer, mais pas bloquer son autrice (son identité reste protégée).' using errcode = 'P0001';
  end if;
  if v_author is null or v_author = auth.uid() then return; end if;
  insert into public.user_blocks(blocker_id, blocked_id) values (auth.uid(), v_author) on conflict do nothing;
end $$;

-- B-04 / B-13 ------------------------------------------------------
drop policy if exists likes_readable on public.post_likes;
create policy likes_readable on public.post_likes as restrictive for insert to authenticated
  with check (public.can_read_post(post_id));
drop policy if exists saved_readable on public.saved_posts;
create policy saved_readable on public.saved_posts as restrictive for insert to authenticated
  with check (public.can_read_post(post_id));
drop policy if exists reports_readable on public.reports;
create policy reports_readable on public.reports as restrictive for insert to authenticated
  with check (post_id is null or (public.can_read_post(post_id) and not public.is_my_post(post_id)));

-- B-05 / B-06 ------------------------------------------------------
create or replace function public.event_registration_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare e public.community_events;
begin
  -- Verrou : deux inscriptions simultanées ne peuvent plus dépasser la capacité
  select * into e from public.community_events where id = new.event_id for update;
  if e.id is null or e.archived or e.starts_at < now() then raise exception 'Inscription impossible' using errcode = 'P0001'; end if;
  if exists (select 1 from public.event_registrations where event_id = e.id and user_id = new.user_id) then
    raise exception 'Vous êtes déjà inscrite à cet atelier' using errcode = 'P0001';
  end if;
  if e.premium_only then perform public.assert_premium('community_events'); end if;
  if e.capacity is not null and (select count(*) from public.event_registrations where event_id = e.id) >= e.capacity then
    raise exception 'Cet atelier est complet' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- B-08 --------------------------------------------------------------
create or replace function public._poll_has_votes(p_post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.poll_votes v where v.post_id = p_post);
$$;
revoke execute on function public._poll_has_votes(uuid) from public, anon;
grant execute on function public._poll_has_votes(uuid) to authenticated;
drop policy if exists poll_options_insert on public.poll_options;
create policy poll_options_insert on public.poll_options for insert to authenticated
  with check (public.is_my_post(post_id) and not public._poll_has_votes(post_id));

-- B-09 --------------------------------------------------------------
create or replace function public.post_delete_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications where payload ->> 'post_id' = old.id::text;
  return old;
end $$;
drop trigger if exists post_delete_notifications on public.posts;
create trigger post_delete_notifications after delete on public.posts
  for each row execute function public.post_delete_notifications();

-- B-11 / B-16 -------------------------------------------------------
alter table public.posts drop constraint if exists posts_body_not_blank;
alter table public.posts add constraint posts_body_not_blank check (char_length(btrim(body)) >= 1) not valid;
alter table public.comments drop constraint if exists comments_body_not_blank;
alter table public.comments add constraint comments_body_not_blank check (char_length(btrim(body)) >= 1) not valid;
alter table public.community_events drop constraint if exists community_events_dates;
alter table public.community_events add constraint community_events_dates check (ends_at is null or ends_at > starts_at) not valid;

-- Retour arrière :
-- alter table public.community_events drop constraint if exists community_events_dates;
-- alter table public.comments drop constraint if exists comments_body_not_blank;
-- alter table public.posts drop constraint if exists posts_body_not_blank;
-- drop trigger if exists post_delete_notifications on public.posts; drop function if exists public.post_delete_notifications();
-- drop policy if exists poll_options_insert on public.poll_options;
-- create policy poll_options_insert on public.poll_options for insert to authenticated
--   with check (public.is_my_post(post_id) and not exists (select 1 from public.poll_votes v where v.post_id = poll_options.post_id));
-- drop function if exists public._poll_has_votes(uuid);
-- drop policy if exists likes_readable on public.post_likes; drop policy if exists saved_readable on public.saved_posts;
-- drop policy if exists reports_readable on public.reports;
-- (block_author et event_registration_guard : reprendre leur définition de 20261015000500 et 20261023000100)
