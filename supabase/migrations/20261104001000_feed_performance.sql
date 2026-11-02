-- =====================================================================
-- Au fil de nous — Performance des fils de la communauté (campagne QA, lot E : E-01, E-02)
--
-- Constat (1 000 comptes, 3 000 publications, 15 000 commentaires) :
--   * fil global forum_feed (tri par date, limit 100) : 0,8 à 2,9 s ; au-delà de 8 s dès 50 personnes ;
--   * commentaires d'un membre (comment_feed filtré sur author_handle) : 12 à 25 s ;
--   * publications d'un membre (forum_feed filtré sur author_handle) : 1,1 s.
-- Cause : les conditions des vues appellent, pour CHAQUE ligne de posts / comments, des fonctions
-- SECURITY DEFINER imbriquées (is_blocked_between → _asks_for_self → has_role, can_see_group),
-- non « inlinables » et préparées à chaque appel (0,4 ms par ligne pour is_blocked_between seule).
-- Le filtre sur author_handle (colonne calculée) ne peut utiliser aucun index.
--
-- Correctif (aucune règle de visibilité ne change) :
--   1. Vues forum_feed et comment_feed réécrites avec EXACTEMENT les mêmes colonnes et les mêmes
--      lignes visibles, mais des conditions calculées une seule fois par requête ou par index :
--        - auth.uid() et has_role('moderator') ne dépendent que de la session → (select …),
--          évalués une seule fois (InitPlan) au lieu d'une fois par ligne ;
--        - is_blocked_between(autrice, auth.uid()) : dans ces vues la personne qui demande est
--          toujours l'une des deux (b = auth.uid(), non nul), donc la fonction donne la réponse
--          réelle « un blocage existe dans un sens ou dans l'autre » → deux NOT EXISTS sur
--          user_blocks (clé primaire blocker_id, blocked_id) ;
--        - can_see_group(groupe) (pour soi-même) → le même EXISTS sur community_groups /
--          group_members, écrit en ligne (groupe thématique ou cohorte non archivé, membre, modération) ;
--        - author_badge : premium_badge() n'est appelée que si la personne a choisi d'afficher
--          le badge (même résultat : premium_badge renvoie faux sinon).
--      security_barrier est CONSERVÉ : les filtres de l'API restent appliqués après ces conditions.
--   2. Index posts(created_at, id), posts(forum_id, created_at, id), comments(author_id, created_at, id) :
--      lecture dans l'ordre chronologique inverse, reprise exacte d'un lot à l'autre (clé date + id).
--   3. Lecture en deux étages, sans recopier les règles de visibilité :
--      PostgreSQL ne « déplie » pas une vue security_barrier : « select * from forum_feed order by
--      created_at desc limit 100 » calcule donc toutes les lignes visibles et toutes les colonnes
--      (photos, sondage, badge…) avant de trier. Les fonctions ci-dessous :
--        a. lisent par index, dans l'ordre, un lot d'identifiants CANDIDATS (sans aucune règle :
--           tout le forum, ou toutes les lignes du membre) ;
--        b. relisent ces identifiants DANS la vue (forum_feed / comment_feed) : c'est la vue, et elle
--           seule, qui décide de ce qui est visible et calcule les colonnes, pour ce lot seulement ;
--        c. recommencent avec le lot suivant tant qu'il manque des lignes pour atteindre la limite.
--      Résultat = les N premières lignes visibles par date décroissante, exactement comme la vue
--      filtrée et triée (départage des dates identiques par l'identifiant).
--        community_feed(forum, limite)   → fil global ou d'une catégorie (useCommunityFeed) ;
--        member_posts(pseudo, limite)    → = forum_feed where author_handle = pseudo (useMemberPosts) ;
--        member_comments(pseudo, limite) → = comment_feed where author_handle = pseudo (useMemberComments).
--      Une publication anonyme n'a pas de pseudo dans la vue → jamais renvoyée par pseudo (anonymat
--      inchangé). SECURITY DEFINER uniquement pour l'étage a (lire les identifiants candidats sans
--      la RLS) : aucun identifiant interne n'est renvoyé, seules les lignes de la vue le sont.
--      Les filtres « enregistrées », « aimées », « mes publications » restent sur la vue : ils
--      passent déjà par un index (moins de 3 ms mesurées).
--
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

-- 2. Index -------------------------------------------------------------
-- (création simple, pas CONCURRENTLY : les migrations s'exécutent dans une transaction ;
--  verrou bref en écriture sur posts / comments pendant la construction)
create index if not exists posts_created_at_idx on public.posts (created_at, id);
create index if not exists posts_forum_created_at_idx on public.posts (forum_id, created_at, id);
create index if not exists comments_author_created_at_idx on public.comments (author_id, created_at, id);

-- 1. Vues --------------------------------------------------------------
-- Mêmes colonnes, même ordre, mêmes types que 20261101000100_security_audit.sql (forum_feed)
-- et 20261023000100_community_social.sql (comment_feed).
create or replace view public.forum_feed with (security_barrier = true) as
  select p.id, p.forum_id, f.slug as forum_slug, p.title, p.body, p.kind, p.anonymous, p.area_label, p.status,
         p.like_count, p.comment_count, p.created_at, p.edited_at,
         case when p.anonymous then null::text else cp.pseudonym end as pseudonym,
         case when p.anonymous then null::text else cp.handle end as author_handle,
         case when p.anonymous then null::text else cp.avatar_path end as avatar_path,
         case when p.anonymous then null::text else cp.avatar_preset end as avatar_preset,
         p.author_id = (select auth.uid()) as is_mine,
         exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = (select auth.uid())) as liked,
         exists (select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = (select auth.uid())) as saved,
         case
           -- publication anonyme : le chemin d'une photo commence par l'identifiant de l'autrice → jamais montré aux autres
           when p.anonymous and p.author_id is distinct from (select auth.uid()) and not (select public.has_role('moderator')) then '[]'::jsonb
           else coalesce((select jsonb_agg(jsonb_build_object('path', ph.path, 'width', ph.width, 'height', ph.height) order by ph.position)
                          from public.post_photos ph where ph.post_id = p.id), '[]'::jsonb)
         end as photos,
         p.search,
         p.group_id, g.name as group_name, g.kind as group_kind, p.pinned_at,
         -- Abonnement à l'autrice : jamais pour une publication anonyme (sinon l'anonymat serait levé)
         not p.anonymous and exists (select 1 from public.member_follows mf where mf.follower_id = (select auth.uid()) and mf.followee_id = p.author_id) as following_author,
         -- premium_badge(x) = show_premium_badge de x ET abonnement actif : appelée seulement si le badge est choisi
         case when p.anonymous or not coalesce(cp.show_premium_badge, false) then false else public.premium_badge(p.author_id) end as author_badge,
         case when p.anonymous then null::text else cp.accent end as author_accent,
         (select s.folder_id from public.saved_posts s where s.post_id = p.id and s.user_id = (select auth.uid())) as saved_folder_id,
         case when exists (select 1 from public.post_polls pp where pp.post_id = p.id) then public.poll_summary(p.id) else null::jsonb end as poll
  from public.posts p
  left join public.community_profiles cp on cp.user_id = p.author_id
  left join public.forums f on f.id = p.forum_id
  left join public.community_groups g on g.id = p.group_id
  where (select auth.uid()) is not null
    -- = (p.group_id is null or can_see_group(p.group_id) or p.author_id = auth.uid())
    and (p.group_id is null
         or p.author_id = (select auth.uid())
         or exists (select 1 from public.community_groups vg where vg.id = p.group_id and (
              (vg.kind in ('theme', 'cohort') and not vg.archived)
              or (select public.has_role('moderator'))
              or exists (select 1 from public.group_members m where m.group_id = vg.id and m.user_id = (select auth.uid())))))
    -- = ((p.status = 'visible' and not is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or has_role('moderator'))
    and (p.author_id = (select auth.uid())
         or (select public.has_role('moderator'))
         or (p.status = 'visible'
             and not exists (select 1 from public.user_blocks b where b.blocker_id = p.author_id and b.blocked_id = (select auth.uid()))
             and not exists (select 1 from public.user_blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id)));

create or replace view public.comment_feed with (security_barrier = true) as
  select c.id, c.post_id, c.parent_id, c.body, c.status, c.created_at, c.edited_at,
         (c.author_id = p.author_id) as is_op,
         (p.anonymous and c.author_id = p.author_id) as anonymous,
         case when p.anonymous and c.author_id = p.author_id then null::text else cp.pseudonym end as pseudonym,
         case when p.anonymous and c.author_id = p.author_id then null::text else cp.handle end as author_handle,
         case when p.anonymous and c.author_id = p.author_id then null::text else cp.avatar_path end as avatar_path,
         case when p.anonymous and c.author_id = p.author_id then null::text else cp.avatar_preset end as avatar_preset,
         (c.author_id = (select auth.uid())) as is_mine,
         p.title as post_title, left(p.body, 140) as post_excerpt,
         case when (p.anonymous and c.author_id = p.author_id) or not coalesce(cp.show_premium_badge, false) then false
              else public.premium_badge(c.author_id) end as author_badge
  from public.comments c
  join public.posts p on p.id = c.post_id
  left join public.community_profiles cp on cp.user_id = c.author_id
  where (select auth.uid()) is not null
    -- = (p.group_id is null or can_see_group(p.group_id) or p.author_id = auth.uid() or c.author_id = auth.uid())
    and (p.group_id is null
         or p.author_id = (select auth.uid())
         or c.author_id = (select auth.uid())
         or exists (select 1 from public.community_groups vg where vg.id = p.group_id and (
              (vg.kind in ('theme', 'cohort') and not vg.archived)
              or (select public.has_role('moderator'))
              or exists (select 1 from public.group_members m where m.group_id = vg.id and m.user_id = (select auth.uid())))))
    -- = ((c.status = 'visible' and not is_blocked_between(c.author_id, auth.uid())
    --     and ((p.status = 'visible' and not is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or has_role('moderator')))
    --    or c.author_id = auth.uid() or has_role('moderator'))
    and (c.author_id = (select auth.uid())
         or (select public.has_role('moderator'))
         or (c.status = 'visible'
             and not exists (select 1 from public.user_blocks b where b.blocker_id = c.author_id and b.blocked_id = (select auth.uid()))
             and not exists (select 1 from public.user_blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = c.author_id)
             and (p.author_id = (select auth.uid())
                  or (p.status = 'visible'
                      and not exists (select 1 from public.user_blocks b where b.blocker_id = p.author_id and b.blocked_id = (select auth.uid()))
                      and not exists (select 1 from public.user_blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id)))));

-- Droits inchangés (create or replace view les conserve ; rappel explicite)
revoke all on public.forum_feed, public.comment_feed from anon;
grant select on public.forum_feed, public.comment_feed to authenticated;

-- 3. Lecture en deux étages ----------------------------------------------
-- Étage commun aux publications : fil global, fil d'une catégorie, publications d'un membre.
create or replace function public._forum_feed_page(p_forum uuid, p_handle text, p_limit int)
returns setof public.forum_feed language plpgsql stable security definer set search_path = public as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_batch int := least(greatest(coalesce(p_limit, 100), 1), 100) * 2;
  v_author uuid;     -- pseudo unique (contrainte community_profiles_handle_key) → au plus une personne
  v_ids uuid[];
  v_cnt int;
  v_n int;
  v_found int := 0;
  -- clé (date, id) du dernier candidat lu : le lot suivant commence juste après (created_at et id sont non nuls)
  v_at timestamptz := 'infinity';
  v_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
begin
  if auth.uid() is null then return; end if;
  if p_handle is not null then
    select cp.user_id into v_author from public.community_profiles cp where cp.handle = p_handle;
    if v_author is null then return; end if;
  end if;
  loop
    -- a. candidats, dans l'ordre (index), sans règle de visibilité ; une requête par cas pour que
    --    chacune garde son index même avec un plan générique
    if v_author is not null then
      select array_agg(x.id order by x.created_at desc, x.id desc), count(*) into v_ids, v_cnt
      from (select p.id, p.created_at from public.posts p
            where p.author_id = v_author and not p.anonymous and (p.created_at, p.id) < (v_at, v_id)
            order by p.created_at desc, p.id desc limit v_batch) x;
    elsif p_forum is not null then
      select array_agg(x.id order by x.created_at desc, x.id desc), count(*) into v_ids, v_cnt
      from (select p.id, p.created_at from public.posts p
            where p.forum_id = p_forum and (p.created_at, p.id) < (v_at, v_id)
            order by p.created_at desc, p.id desc limit v_batch) x;
    else
      select array_agg(x.id order by x.created_at desc, x.id desc), count(*) into v_ids, v_cnt
      from (select p.id, p.created_at from public.posts p
            where (p.created_at, p.id) < (v_at, v_id)
            order by p.created_at desc, p.id desc limit v_batch) x;
    end if;
    exit when v_cnt = 0;
    select p.created_at, p.id into v_at, v_id from public.posts p where p.id = v_ids[v_cnt];
    -- b. visibilité et colonnes : la vue, pour ce lot seulement
    return query
      select f.* from public.forum_feed f
      where f.id = any (v_ids)
        and (p_forum is null or f.forum_id = p_forum)
        and (p_handle is null or f.author_handle = p_handle)
      order by f.created_at desc, f.id desc
      limit v_limit - v_found;
    get diagnostics v_n = row_count;
    v_found := v_found + v_n;
    -- c. lot suivant (plus grand) s'il manque des lignes et s'il reste des candidats
    exit when v_found >= v_limit or v_cnt < v_batch;
    v_batch := least(v_batch * 2, 2000);
  end loop;
end $$;

create or replace function public.community_feed(p_forum uuid default null, p_limit int default 100)
returns setof public.forum_feed language sql stable security definer set search_path = public as $$
  select * from public._forum_feed_page(p_forum, null, p_limit);
$$;

create or replace function public.member_posts(p_handle text, p_limit int default 100)
returns setof public.forum_feed language sql stable security definer set search_path = public as $$
  select * from public._forum_feed_page(null, p_handle, p_limit) where p_handle is not null;
$$;

create or replace function public.member_comments(p_handle text, p_limit int default 100)
returns setof public.comment_feed language plpgsql stable security definer set search_path = public as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_batch int := least(greatest(coalesce(p_limit, 100), 1), 100) * 2;
  v_author uuid;     -- pseudo unique (contrainte community_profiles_handle_key) → au plus une personne
  v_ids uuid[];
  v_cnt int;
  v_n int;
  v_found int := 0;
  v_at timestamptz := 'infinity';
  v_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
begin
  if auth.uid() is null or p_handle is null then return; end if;
  select cp.user_id into v_author from public.community_profiles cp where cp.handle = p_handle;
  if v_author is null then return; end if;
  loop
    -- a. candidats : commentaires du membre, dans l'ordre (index comments(author_id, created_at, id))
    select array_agg(x.id order by x.created_at desc, x.id desc), count(*) into v_ids, v_cnt
    from (select c.id, c.created_at from public.comments c
          where c.author_id = v_author and (c.created_at, c.id) < (v_at, v_id)
          order by c.created_at desc, c.id desc limit v_batch) x;
    exit when v_cnt = 0;
    select c.created_at, c.id into v_at, v_id from public.comments c where c.id = v_ids[v_cnt];
    -- b. visibilité, anonymat et colonnes : la vue, pour ce lot seulement
    return query
      select v.* from public.comment_feed v
      where v.id = any (v_ids) and v.author_handle = p_handle
      order by v.created_at desc, v.id desc
      limit v_limit - v_found;
    get diagnostics v_n = row_count;
    v_found := v_found + v_n;
    -- c. lot suivant (plus grand) s'il manque des lignes et s'il reste des candidats
    exit when v_found >= v_limit or v_cnt < v_batch;
    v_batch := least(v_batch * 2, 2000);
  end loop;
end $$;

revoke execute on function public._forum_feed_page(uuid, text, int) from public, anon, authenticated;
revoke execute on function public.community_feed(uuid, int), public.member_posts(text, int), public.member_comments(text, int) from public, anon;
grant execute on function public.community_feed(uuid, int), public.member_posts(text, int), public.member_comments(text, int) to authenticated;

-- =====================================================================
-- Retour arrière (à exécuter à la main si besoin) :
--   drop function if exists public.community_feed(uuid, int), public.member_posts(text, int),
--     public.member_comments(text, int), public._forum_feed_page(uuid, text, int);
--   -- l'application (useCommunityFeed / useMemberPosts / useMemberComments, src/lib/data/hooks-community.ts)
--   -- doit alors revenir aux vues : forum_feed (filtre forum_id ou author_handle) et comment_feed (author_handle),
--   -- tri created_at décroissant, limit 100
--   recréer public.forum_feed depuis 20261101000100_security_audit.sql (create or replace view … section 2)
--   et public.comment_feed depuis 20261023000100_community_social.sql (create view public.comment_feed …,
--   en « create or replace view ») ; puis
--   drop index if exists public.posts_created_at_idx, public.posts_forum_created_at_idx,
--     public.comments_author_created_at_idx;
-- Aucune donnée n'est modifiée par cette migration.
-- =====================================================================
