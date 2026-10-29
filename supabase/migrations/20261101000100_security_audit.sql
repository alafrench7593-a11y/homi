-- =====================================================================
-- Au fil de nous — Audit de sécurité du 29 octobre 2026 (ajout, non destructif)
--
-- 1. Anonymat dans la communauté : community_actor_label(utilisateur, publication) répondait à
--    n'importe quelle membre connectée « L'auteur·rice de la publication » quand on lui donnait le
--    bon identifiant : en parcourant les identifiants visibles des profils, on retrouvait le
--    pseudonyme de l'autrice d'une publication anonyme. Fonction réservée au serveur
--    (seuls les déclencheurs de notification, en SECURITY DEFINER, l'appellent).
-- 2. Photos d'une publication anonyme : leur chemin « <identifiant de l'autrice>/… » levait aussi
--    l'anonymat. Elles ne sont plus visibles des autres (fil + table), et une publication anonyme
--    ne peut plus recevoir de photo.
-- 3. is_blocked_between(a, b) : n'importe qui pouvait savoir qui a bloqué qui. Réponse réelle
--    seulement si la personne qui demande est l'une des deux (ou le serveur, ou la modération) ;
--    toutes les règles d'accès existantes l'appellent avec auth.uid() : comportement inchangé.
-- 4. TRUNCATE retiré aux rôles anon et authenticated (la RLS ne s'applique pas à TRUNCATE ;
--    l'API ne l'utilise jamais : défense en profondeur).
--
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

-- 1. ------------------------------------------------------------------
revoke execute on function public.community_actor_label(uuid, uuid) from public, anon, authenticated;

-- 3. ------------------------------------------------------------------
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is not null and auth.uid() is distinct from a and auth.uid() is distinct from b
         and not public.has_role('moderator') then false
    else exists (select 1 from public.user_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
  end;
$$;

-- 2. ------------------------------------------------------------------
drop policy if exists post_photos_anonymous_hidden on public.post_photos;
create policy post_photos_anonymous_hidden on public.post_photos as restrictive for select to authenticated using (
  author_id = auth.uid() or public.has_role('moderator')
  or not exists (select 1 from public.posts p where p.id = post_id and p.anonymous)
);

create or replace function public.post_photos_not_anonymous()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.posts p where p.id = new.post_id and p.anonymous) then
    raise exception 'Pas de photo dans une publication anonyme : elle pourrait révéler votre identité.' using errcode = 'P0001', hint = 'anonymous_no_photo';
  end if;
  return new;
end $$;
drop trigger if exists post_photos_not_anonymous on public.post_photos;
create trigger post_photos_not_anonymous before insert on public.post_photos
  for each row execute function public.post_photos_not_anonymous();


-- fichiers : une photo d'une publication anonyme n'est lisible que par son autrice et la modération
create or replace function public.community_object_readable(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    split_part(p_name, '/', 1) = auth.uid()::text
    or exists (select 1 from public.community_profiles where avatar_path = p_name)
    or exists (select 1 from public.post_photos ph join public.posts p on p.id = ph.post_id
               where ph.path = p_name and public.can_read_post(ph.post_id)
                 and (not p.anonymous or public.has_role('moderator')))
    or exists (select 1 from public.album_photos ap where ap.path = p_name and public.can_read_album(ap.album_id)));
$$;

create or replace view public.forum_feed with (security_barrier = true) as
 SELECT p.id,
    p.forum_id,
    f.slug AS forum_slug,
    p.title,
    p.body,
    p.kind,
    p.anonymous,
    p.area_label,
    p.status,
    p.like_count,
    p.comment_count,
    p.created_at,
    p.edited_at,
        CASE
            WHEN p.anonymous THEN NULL::text
            ELSE cp.pseudonym
        END AS pseudonym,
        CASE
            WHEN p.anonymous THEN NULL::text
            ELSE cp.handle
        END AS author_handle,
        CASE
            WHEN p.anonymous THEN NULL::text
            ELSE cp.avatar_path
        END AS avatar_path,
        CASE
            WHEN p.anonymous THEN NULL::text
            ELSE cp.avatar_preset
        END AS avatar_preset,
    p.author_id = auth.uid() AS is_mine,
    (EXISTS ( SELECT 1
           FROM post_likes l
          WHERE l.post_id = p.id AND l.user_id = auth.uid())) AS liked,
    (EXISTS ( SELECT 1
           FROM saved_posts s
          WHERE s.post_id = p.id AND s.user_id = auth.uid())) AS saved,
    CASE
        -- publication anonyme : le chemin d'une photo commence par l'identifiant de l'autrice → jamais montré aux autres
        WHEN p.anonymous AND p.author_id IS DISTINCT FROM auth.uid() AND NOT has_role('moderator'::text) THEN '[]'::jsonb
        ELSE COALESCE(( SELECT jsonb_agg(jsonb_build_object('path', ph.path, 'width', ph.width, 'height', ph.height) ORDER BY ph."position") AS jsonb_agg
           FROM post_photos ph
          WHERE ph.post_id = p.id), '[]'::jsonb)
    END AS photos,
    p.search,
    p.group_id,
    g.name AS group_name,
    g.kind AS group_kind,
    p.pinned_at,
    NOT p.anonymous AND (EXISTS ( SELECT 1
           FROM member_follows mf
          WHERE mf.follower_id = auth.uid() AND mf.followee_id = p.author_id)) AS following_author,
        CASE
            WHEN p.anonymous THEN false
            ELSE premium_badge(p.author_id)
        END AS author_badge,
        CASE
            WHEN p.anonymous THEN NULL::text
            ELSE cp.accent
        END AS author_accent,
    ( SELECT s.folder_id
           FROM saved_posts s
          WHERE s.post_id = p.id AND s.user_id = auth.uid()) AS saved_folder_id,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM post_polls pp
              WHERE pp.post_id = p.id)) THEN poll_summary(p.id)
            ELSE NULL::jsonb
        END AS poll
   FROM posts p
     LEFT JOIN community_profiles cp ON cp.user_id = p.author_id
     LEFT JOIN forums f ON f.id = p.forum_id
     LEFT JOIN community_groups g ON g.id = p.group_id
  WHERE auth.uid() IS NOT NULL AND (p.group_id IS NULL OR can_see_group(p.group_id) OR p.author_id = auth.uid()) AND (p.status = 'visible'::text AND NOT is_blocked_between(p.author_id, auth.uid()) OR p.author_id = auth.uid() OR has_role('moderator'::text));
revoke all on public.forum_feed from anon;
grant select on public.forum_feed to authenticated;

-- 4. ------------------------------------------------------------------
revoke truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate on tables from anon, authenticated;

-- ---------------------------------------------------------------------
-- Retour arrière :
--   grant execute on function public.community_actor_label(uuid, uuid) to authenticated;
--   (is_blocked_between : reprendre la définition de 20261015000400_community.sql)
--   drop policy post_photos_anonymous_hidden on public.post_photos;
--   drop trigger post_photos_not_anonymous on public.post_photos; drop function public.post_photos_not_anonymous();
--   (community_object_readable : reprendre 20261023000100_community_social.sql)
--   (forum_feed : reprendre la définition de 20261023000100_community_social.sql)
--   grant truncate on all tables in schema public to anon, authenticated;
