-- =====================================================================
-- Communauté v2 : véritable forum parental.
--  · Profil communautaire : identifiant unique « @… », présentation, avatar (illustration ou photo),
--    parcours facultatif, visibilité du profil, acceptation des règles.
--  · 14 catégories ; publications : question ou témoignage, titre facultatif, anonymat, jusqu'à 4 photos,
--    modification de ses publications et commentaires.
--  · Notifications par type (désactivables séparément) : commentaire, réponse, réaction, nouvelle réponse
--    dans une publication enregistrée, modération. Lien direct vers la publication ou le commentaire.
--  · Confidentialité : l'auteur réel d'une publication anonyme n'est JAMAIS lisible par les autres membres
--    (droits par colonne : author_id illisible ; lectures via les vues forum_feed / comment_feed).
--    La présentation et le parcours d'un profil « minimal » ne sont lisibles que par sa propriétaire.
--  · Sécurité renforcée : adresse, date de naissance complète, coordonnées GPS, liens multiples → relecture ;
--    doublons refusés ; stockage « community » privé (chemin = identifiant de l'autrice).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Catégories (14). Les anciens espaces sont renommés ou fusionnés ; aucune publication n'est perdue.
-- ---------------------------------------------------------------------
alter table public.posts disable trigger posts_protect;

update public.forums set slug = 'suivi-cycle' where slug = 'eviter-grossesse' and not exists (select 1 from public.forums where slug = 'suivi-cycle');
update public.forums set slug = 'nouveau-ne' where slug = 'parents-bebes' and not exists (select 1 from public.forums where slug = 'nouveau-ne');
update public.forums set slug = 'plusieurs-enfants' where slug = 'familles-nombreuses' and not exists (select 1 from public.forums where slug = 'plusieurs-enfants');

insert into public.forums (slug, title, description, journeys, icon, is_local, position, archived) values
 ('suivi-cycle','Suivi du cycle','Cycle, règles, contraception, symptômes : partager son expérience.','{avoid,cycle}','cycle',false,1,false),
 ('projet-bebe','Projet bébé','Essayer d''avoir un enfant, parcours de PMA, attendre, espérer, se soutenir.','{ttc}','sparkles',false,2,false),
 ('grossesse','Grossesse','Questions et témoignages pendant la grossesse, jusqu''à l''accouchement.','{pregnant}','moon',false,3,false),
 ('jumeaux-triples','Jumeaux et triplés','Grossesses multiples et familles de jumeaux ou triplés.','{pregnant,newborn,child}','twins',false,4,false),
 ('nouveau-ne','Nouveau-né','Les premières semaines et les premiers mois avec bébé.','{newborn}','baby',false,5,false),
 ('allaitement','Allaitement','Allaitement, tire-lait, sevrage, allaitement mixte.','{newborn}','drop',false,6,false),
 ('biberon','Biberon','Préparation, quantités, choix du lait, passage au biberon.','{newborn}','bottle',false,7,false),
 ('sommeil','Sommeil','Nuits, siestes, rituels du coucher, fatigue des parents.','{newborn,child}','sleep',false,8,false),
 ('diversification','Diversification et repas','Premiers repas, textures, idées de menus, repas en famille.','{newborn,child}','food',false,9,false),
 ('sante-developpement','Santé et développement','Croissance, étapes, petits soucis du quotidien : des témoignages, pas des diagnostics.','{newborn,child}','health',false,10,false),
 ('neurodeveloppement','Troubles neurodéveloppementaux','TDAH, TSA, DYS, langage… parcours, démarches et soutien entre parents.','{child}','brain',false,11,false),
 ('post-partum','Post-partum et bien-être de la mère','Après la naissance : récupération, émotions, fatigue, se faire aider.','{newborn}','heart',false,12,false),
 ('plusieurs-enfants','Parents de plusieurs enfants','Organiser la vie avec plusieurs enfants, fratrie, jalousie.','{family}','users',false,13,false),
 ('questions-generales','Questions générales','Tout le reste : organisation, école, mode de garde, vie de famille.','{}','chat',false,14,false)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, journeys = excluded.journeys, icon = excluded.icon,
  is_local = excluded.is_local, position = excluded.position, archived = false;

-- Fusion des espaces qui disparaissent : leurs publications rejoignent la catégorie la plus proche
update public.posts set forum_id = (select id from public.forums where slug = 'projet-bebe') where forum_id = (select id from public.forums where slug = 'fertilite');
update public.posts set forum_id = (select id from public.forums where slug = 'grossesse') where forum_id = (select id from public.forums where slug = 'accouchement');
update public.posts set forum_id = (select id from public.forums where slug = 'questions-generales')
  where forum_id in (select id from public.forums where slug in ('parents-enfants', 'rencontres-locales'));
update public.forums set archived = true
 where slug not in ('suivi-cycle','projet-bebe','grossesse','jumeaux-triples','nouveau-ne','allaitement','biberon','sommeil','diversification',
                    'sante-developpement','neurodeveloppement','post-partum','plusieurs-enfants','questions-generales');

alter table public.posts enable trigger posts_protect;

-- ---------------------------------------------------------------------
-- 2. Profil communautaire
-- ---------------------------------------------------------------------
alter table public.community_profiles
  add column if not exists handle text,
  add column if not exists bio text,
  add column if not exists avatar_path text,
  add column if not exists avatar_preset text,
  add column if not exists journey_label text,
  add column if not exists visibility text not null default 'members',
  add column if not exists rules_accepted_at timestamptz,
  add column if not exists updated_at timestamptz;
alter table public.community_profiles drop constraint if exists community_profiles_bio_check;
alter table public.community_profiles add constraint community_profiles_bio_check check (bio is null or char_length(bio) <= 280);
alter table public.community_profiles drop constraint if exists community_profiles_visibility_check;
alter table public.community_profiles add constraint community_profiles_visibility_check check (visibility in ('members', 'minimal'));
alter table public.community_profiles drop constraint if exists community_profiles_avatar_preset_check;
alter table public.community_profiles add constraint community_profiles_avatar_preset_check
  check (avatar_preset is null or avatar_preset in ('moon','sun','leaf','cloud','star','heart','wave','flower','bird','whale','bear','rainbow'));
alter table public.community_profiles drop constraint if exists community_profiles_journey_label_check;
alter table public.community_profiles add constraint community_profiles_journey_label_check
  check (journey_label is null or journey_label in ('cycle','projet','grossesse','jumeaux','bebe','enfant','famille','postpartum'));

-- Identifiant : minuscules, chiffres et « _ », 3 à 20 caractères, unique ; généré si absent
create or replace function public.community_handle_base(p text)
returns text language sql immutable as $$
  select coalesce(nullif(left(trim(both '_' from regexp_replace(
    translate(lower(coalesce(p, '')), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa'),
    '[^a-z0-9_]+', '_', 'g')), 16), ''), 'membre');
$$;

create or replace function public.community_profile_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_base text; v_try text; v_n int := 0;
begin
  if new.handle is null or trim(new.handle) = '' then
    v_base := public.community_handle_base(new.pseudonym);
    if char_length(v_base) < 3 then v_base := v_base || '_' || 'membre'; end if;
    v_try := v_base;
    while exists (select 1 from public.community_profiles where handle = v_try and user_id <> new.user_id) loop
      v_n := v_n + 1;
      v_try := left(v_base, 15) || '_' || (100 + floor(random() * 900))::int::text;
      if v_n > 50 then v_try := 'membre_' || substr(md5(new.user_id::text || clock_timestamp()::text), 1, 8); end if;
    end loop;
    new.handle := v_try;
  else
    new.handle := lower(trim(leading '@' from trim(new.handle)));
    if new.handle !~ '^[a-z0-9_]{3,20}$' then
      raise exception 'Identifiant : 3 à 20 caractères, lettres minuscules, chiffres ou « _ »' using errcode = 'P0001', hint = 'handle_invalid';
    end if;
    if new.handle in ('admin','administrateur','moderation','moderateur','toietmoi','toi_et_moi','support','anonyme','equipe') then
      raise exception 'Cet identifiant est réservé' using errcode = 'P0001', hint = 'handle_reserved';
    end if;
  end if;
  -- Avatar photo : uniquement un fichier déposé par la personne elle-même
  if new.avatar_path is not null and split_part(new.avatar_path, '/', 1) <> new.user_id::text then
    raise exception 'Photo de profil invalide' using errcode = '42501';
  end if;
  new.bio := nullif(trim(new.bio), '');
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists community_profiles_guard on public.community_profiles;
create trigger community_profiles_guard before insert or update on public.community_profiles
  for each row execute function public.community_profile_guard();

update public.community_profiles set handle = null where handle is null;
alter table public.community_profiles alter column handle set not null;
create unique index if not exists community_profiles_handle_key on public.community_profiles(handle);

-- Une personne ne peut pas se lever elle-même une suspension
create or replace function public.community_profile_protect()
returns trigger language plpgsql as $$
begin
  if pg_trigger_depth() > 1 or public.has_role('moderator') then return new; end if;
  new.suspended_until := old.suspended_until;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists community_profiles_protect on public.community_profiles;
create trigger community_profiles_protect before update on public.community_profiles
  for each row execute function public.community_profile_protect();

-- Lecture directe limitée aux informations publiques ; le reste passe par les fonctions ci-dessous
revoke select on public.community_profiles from anon, authenticated;
grant select (user_id, pseudonym, handle, avatar_path, avatar_preset, created_at) on public.community_profiles to authenticated;

-- ---------------------------------------------------------------------
-- 3. Publications et commentaires
-- ---------------------------------------------------------------------
alter table public.posts alter column title drop not null;
alter table public.posts drop constraint if exists posts_title_check;
alter table public.posts add constraint posts_title_check check (title is null or char_length(title) between 3 and 140);
alter table public.posts add column if not exists kind text not null default 'question';
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('question', 'testimony'));
alter table public.posts add column if not exists anonymous boolean not null default false;
alter table public.comments add column if not exists edited_at timestamptz;

-- L'auteur réel (author_id) n'est lisible que par le serveur : indispensable pour l'anonymat
revoke select on public.posts from anon, authenticated;
grant select (id, forum_id, title, body, area_label, status, report_count, like_count, comment_count, search, created_at, edited_at, kind, anonymous)
  on public.posts to authenticated;
revoke select on public.comments from anon, authenticated;
grant select (id, post_id, parent_id, body, status, report_count, created_at, edited_at) on public.comments to authenticated;

-- Texte : termes bloquants (erreur) ou informations à relire. Renvoie true si le contenu doit être relu.
create or replace function public.community_text_needs_review(p_text text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_term record; v_review boolean := false;
begin
  for v_term in select * from public.moderation_terms loop
    if p_text ~* v_term.pattern then
      if v_term.action = 'block' then
        raise exception 'Ce contenu ne respecte pas les règles de la communauté (%)', v_term.reason using errcode = 'P0001';
      end if;
      v_review := true;
    end if;
  end loop;
  return v_review
    -- téléphone, e-mail
    or p_text ~* '(\+33|0)[1-9]([ .-]?[0-9]{2}){4}'
    or p_text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    -- adresse postale
    or p_text ~* '\m[0-9]{1,4}( ?(bis|ter))?,? (rue|avenue|av\.|boulevard|bd|allée|allee|impasse|chemin|place|quai|route|cours|square) '
    -- date de naissance complète
    or p_text ~* '(\mnée?s?\M|naissance|anniversaire)[^.!?]{0,40}\m[0-3]?[0-9][/.-][01]?[0-9][/.-]((19|20)[0-9]{2}|[0-9]{2})\M'
    -- coordonnées GPS
    or p_text ~ '-?[0-9]{1,2}\.[0-9]{4,} *, *-?[0-9]{1,3}\.[0-9]{4,}'
    -- liens multiples (publicité)
    or (select count(*) from regexp_matches(p_text, 'https?://', 'g')) >= 3;
end $$;

create or replace function public.community_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_text text; v_recent int; v_profile public.community_profiles;
begin
  select * into v_profile from public.community_profiles where user_id = new.author_id;
  if v_profile.user_id is null then
    raise exception 'Choisissez un pseudonyme avant de publier' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  if v_profile.suspended_until is not null and v_profile.suspended_until > now() then
    raise exception 'Votre compte communauté est suspendu jusqu''au %', to_char(v_profile.suspended_until, 'DD/MM/YYYY') using errcode = '42501';
  end if;
  -- Limitation du spam : débit et doublons
  if tg_table_name = 'posts' then
    select count(*) into v_recent from public.posts where author_id = new.author_id and created_at > now() - interval '1 hour';
    if v_recent >= 8 then raise exception 'Trop de publications en peu de temps, réessayez plus tard' using errcode = 'P0001'; end if;
    if exists (select 1 from public.posts where author_id = new.author_id and body = new.body and created_at > now() - interval '24 hours') then
      raise exception 'Vous avez déjà publié ce message' using errcode = 'P0001', hint = 'duplicate';
    end if;
    if exists (select 1 from public.forums where id = new.forum_id and archived) then
      raise exception 'Cette catégorie n''accepte plus de publications' using errcode = 'P0001';
    end if;
    v_text := coalesce(new.title, '') || ' ' || new.body;
  else
    select count(*) into v_recent from public.comments where author_id = new.author_id and created_at > now() - interval '10 minutes';
    if v_recent >= 20 then raise exception 'Trop de commentaires en peu de temps, réessayez plus tard' using errcode = 'P0001'; end if;
    if exists (select 1 from public.comments where author_id = new.author_id and post_id = new.post_id and body = new.body and created_at > now() - interval '10 minutes') then
      raise exception 'Vous avez déjà envoyé ce commentaire' using errcode = 'P0001', hint = 'duplicate';
    end if;
    v_text := new.body;
    if exists (select 1 from public.posts p where p.id = new.post_id and public.is_blocked_between(p.author_id, new.author_id)) then
      raise exception 'Impossible de répondre à cette publication' using errcode = '42501';
    end if;
  end if;
  if public.community_text_needs_review(v_text) then new.status := 'pending_review'; end if;
  return new;
end $$;

-- Modification de sa publication : texte, titre, type et catégorie ; l'anonymat et le statut ne changent pas
create or replace function public.protect_post_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or public.has_role('moderator') then return new; end if;
  if new.status is distinct from old.status and not (new.status = 'removed' and old.author_id = auth.uid()) then
    raise exception 'Modification du statut interdite' using errcode = '42501';
  end if;
  new.report_count := old.report_count; new.like_count := old.like_count; new.comment_count := old.comment_count;
  new.author_id := old.author_id; new.anonymous := old.anonymous; new.created_at := old.created_at;
  if new.forum_id is distinct from old.forum_id and exists (select 1 from public.forums where id = new.forum_id and archived) then
    new.forum_id := old.forum_id;
  end if;
  if (new.title is distinct from old.title or new.body is distinct from old.body) then
    new.edited_at := now();
    if new.status = 'visible' and public.community_text_needs_review(coalesce(new.title, '') || ' ' || new.body) then
      new.status := 'pending_review';
    end if;
  end if;
  return new;
end $$;

create or replace function public.protect_comment_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or public.has_role('moderator') then return new; end if;
  if new.status is distinct from old.status then raise exception 'Modification du statut interdite' using errcode = '42501'; end if;
  new.post_id := old.post_id; new.parent_id := old.parent_id; new.author_id := old.author_id;
  new.report_count := old.report_count; new.created_at := old.created_at;
  if new.body is distinct from old.body then
    new.edited_at := now();
    if new.status = 'visible' and public.community_text_needs_review(new.body) then new.status := 'pending_review'; end if;
  end if;
  return new;
end $$;
drop trigger if exists comments_protect on public.comments;
create trigger comments_protect before update on public.comments for each row execute function public.protect_comment_fields();
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated
  using (author_id = auth.uid() or public.has_role('moderator')) with check (author_id = auth.uid() or public.has_role('moderator'));

-- Lecture d'une publication (mêmes règles que la RLS) : utilisée par les photos et le stockage
create or replace function public.can_read_post(p_post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = p_post and auth.uid() is not null and (
    (p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator')));
$$;
create or replace function public.is_my_post(p_post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = p_post and author_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 4. Photos des publications (stockage privé « community »)
-- ---------------------------------------------------------------------
create table if not exists public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null unique check (path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_.-]{1,80}$'),
  width int check (width between 1 and 8000),
  height int check (height between 1 and 8000),
  position smallint not null default 0 check (position between 0 and 3),
  created_at timestamptz not null default now()
);
create index if not exists post_photos_post_idx on public.post_photos(post_id, position);
alter table public.post_photos enable row level security;
drop policy if exists post_photos_read on public.post_photos;
create policy post_photos_read on public.post_photos for select to authenticated using (public.can_read_post(post_id));
drop policy if exists post_photos_insert on public.post_photos;
create policy post_photos_insert on public.post_photos for insert to authenticated
  with check (author_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text and public.is_my_post(post_id));
drop policy if exists post_photos_delete on public.post_photos;
create policy post_photos_delete on public.post_photos for delete to authenticated using (author_id = auth.uid() or public.has_role('moderator'));
revoke select on public.post_photos from anon, authenticated;
grant select (id, post_id, path, width, height, position, created_at) on public.post_photos to authenticated;

create or replace function public.post_photos_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.post_photos where post_id = new.post_id) >= 4 then
    raise exception '4 photos au maximum par publication' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists post_photos_limit on public.post_photos;
create trigger post_photos_limit before insert on public.post_photos for each row execute function public.post_photos_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create or replace function public.community_object_readable(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    split_part(p_name, '/', 1) = auth.uid()::text
    or exists (select 1 from public.community_profiles where avatar_path = p_name)
    or exists (select 1 from public.post_photos ph where ph.path = p_name and public.can_read_post(ph.post_id)));
$$;
drop policy if exists "community read" on storage.objects;
create policy "community read" on storage.objects for select to authenticated
  using (bucket_id = 'community' and public.community_object_readable(name));
drop policy if exists "community upload" on storage.objects;
create policy "community upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "community delete" on storage.objects;
create policy "community delete" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and split_part(name, '/', 1) = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 5. Fils de lecture : pseudonyme à la place de l'identifiant, anonymat respecté.
--    Vues exécutées avec les droits du propriétaire ; leurs conditions reprennent exactement la RLS.
-- ---------------------------------------------------------------------
drop function if exists public.search_posts(text, uuid, int);
drop view if exists public.forum_feed;
drop view if exists public.comment_feed;

create view public.forum_feed with (security_barrier = true) as
  select p.id, p.forum_id, f.slug as forum_slug, p.title, p.body, p.kind, p.anonymous, p.area_label, p.status,
         p.like_count, p.comment_count, p.created_at, p.edited_at,
         case when p.anonymous then null else cp.pseudonym end as pseudonym,
         case when p.anonymous then null else cp.handle end as author_handle,
         case when p.anonymous then null else cp.avatar_path end as avatar_path,
         case when p.anonymous then null else cp.avatar_preset end as avatar_preset,
         (p.author_id = auth.uid()) as is_mine,
         exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked,
         exists (select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = auth.uid()) as saved,
         coalesce((select jsonb_agg(jsonb_build_object('path', ph.path, 'width', ph.width, 'height', ph.height) order by ph.position)
                   from public.post_photos ph where ph.post_id = p.id), '[]'::jsonb) as photos,
         p.search
  from public.posts p
  left join public.community_profiles cp on cp.user_id = p.author_id
  left join public.forums f on f.id = p.forum_id
  where auth.uid() is not null
    and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid()))
         or p.author_id = auth.uid() or public.has_role('moderator'));

create view public.comment_feed with (security_barrier = true) as
  select c.id, c.post_id, c.parent_id, c.body, c.status, c.created_at, c.edited_at,
         (c.author_id = p.author_id) as is_op,
         (p.anonymous and c.author_id = p.author_id) as anonymous,
         case when p.anonymous and c.author_id = p.author_id then null else cp.pseudonym end as pseudonym,
         case when p.anonymous and c.author_id = p.author_id then null else cp.handle end as author_handle,
         case when p.anonymous and c.author_id = p.author_id then null else cp.avatar_path end as avatar_path,
         case when p.anonymous and c.author_id = p.author_id then null else cp.avatar_preset end as avatar_preset,
         (c.author_id = auth.uid()) as is_mine,
         p.title as post_title, left(p.body, 140) as post_excerpt
  from public.comments c
  join public.posts p on p.id = c.post_id
  left join public.community_profiles cp on cp.user_id = c.author_id
  where auth.uid() is not null
    and ((c.status = 'visible' and not public.is_blocked_between(c.author_id, auth.uid())
          and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator')))
         or c.author_id = auth.uid() or public.has_role('moderator'));

revoke all on public.forum_feed, public.comment_feed from anon;
grant select on public.forum_feed, public.comment_feed to authenticated;

create or replace function public.search_posts(p_query text, p_forum uuid default null, p_limit int default 50)
returns setof public.forum_feed language sql stable security invoker set search_path = public as $$
  select f.* from public.forum_feed f
  where f.status = 'visible'
    and (p_forum is null or f.forum_id = p_forum)
    and char_length(trim(coalesce(p_query, ''))) >= 2
    and (f.search @@ websearch_to_tsquery('french', p_query)
         or coalesce(f.title, '') ilike '%' || trim(p_query) || '%'
         or f.body ilike '%' || trim(p_query) || '%')
  order by ts_rank(f.search, websearch_to_tsquery('french', p_query)) desc, f.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- ---------------------------------------------------------------------
-- 6. Profils : le sien (complet) et celui d'un membre (selon ses choix de visibilité)
-- ---------------------------------------------------------------------
create or replace function public.my_community_profile()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v public.community_profiles; v_uid uuid := auth.uid();
begin
  select * into v from public.community_profiles where user_id = v_uid;
  if v.user_id is null then return null; end if;
  return jsonb_build_object(
    'user_id', v.user_id, 'pseudonym', v.pseudonym, 'handle', v.handle, 'bio', v.bio, 'avatar_path', v.avatar_path,
    'avatar_preset', v.avatar_preset, 'journey_label', v.journey_label, 'visibility', v.visibility, 'area_label', v.area_label,
    'suspended_until', v.suspended_until, 'rules_accepted_at', v.rules_accepted_at, 'created_at', v.created_at,
    'posts_count', (select count(*) from public.posts where author_id = v_uid and status <> 'removed'),
    'comments_count', (select count(*) from public.comments where author_id = v_uid and status <> 'removed'),
    'photos_count', (select count(*) from public.post_photos where author_id = v_uid),
    'likes_count', (select count(*) from public.post_likes where user_id = v_uid),
    'saved_count', (select count(*) from public.saved_posts where user_id = v_uid));
end $$;

create or replace function public.community_member(p_handle text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v public.community_profiles; v_uid uuid := auth.uid(); v_out jsonb;
begin
  if v_uid is null then return null; end if;
  select * into v from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v.user_id is null then return null; end if;
  -- Une personne qui m'a bloquée : profil indisponible
  if v.user_id <> v_uid and exists (select 1 from public.user_blocks where blocker_id = v.user_id and blocked_id = v_uid) then
    return jsonb_build_object('handle', v.handle, 'pseudonym', v.pseudonym, 'unavailable', true, 'is_me', false, 'blocked', false);
  end if;
  v_out := jsonb_build_object('handle', v.handle, 'pseudonym', v.pseudonym, 'avatar_path', v.avatar_path, 'avatar_preset', v.avatar_preset,
    'is_me', v.user_id = v_uid, 'blocked', exists (select 1 from public.user_blocks where blocker_id = v_uid and blocked_id = v.user_id),
    'visibility', v.visibility, 'unavailable', false);
  if v.visibility = 'members' or v.user_id = v_uid then
    v_out := v_out || jsonb_build_object('bio', v.bio, 'journey_label', v.journey_label,
      'joined_month', to_char(date_trunc('month', v.created_at), 'YYYY-MM'),
      'posts_count', (select count(*) from public.posts where author_id = v.user_id and status = 'visible' and not anonymous),
      'comments_count', (select count(*) from public.comments c join public.posts p on p.id = c.post_id
                         where c.author_id = v.user_id and c.status = 'visible' and not (p.anonymous and p.author_id = c.author_id)),
      'photos_count', (select count(*) from public.post_photos ph join public.posts p on p.id = ph.post_id
                       where p.author_id = v.user_id and p.status = 'visible' and not p.anonymous));
  end if;
  return v_out;
end $$;

create or replace function public.block_member(p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_target uuid;
begin
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = auth.uid() then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  insert into public.user_blocks (blocker_id, blocked_id) values (auth.uid(), v_target) on conflict do nothing;
end $$;
revoke execute on function public.my_community_profile(), public.community_member(text), public.block_member(text) from public, anon;
grant execute on function public.my_community_profile(), public.community_member(text), public.block_member(text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Notifications communautaires, désactivables séparément
-- ---------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_category_check;
alter table public.notifications add constraint notifications_category_check
  check (category in ('reminder','community_reply','community_comment','community_like','community_saved','community_moderation',
                      'assistant','subscription','product_recall','system','family'));

create table if not exists public.community_notification_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  post_comment boolean not null default true,
  comment_reply boolean not null default true,
  reaction boolean not null default true,
  saved_reply boolean not null default true,
  moderation boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.community_notification_prefs enable row level security;
drop policy if exists cnp_own on public.community_notification_prefs;
create policy cnp_own on public.community_notification_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.community_notify(p_user uuid, p_kind text, p_category text, p_title text, p_body text, p_link text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_on boolean;
begin
  if p_user is null then return; end if;
  select case p_kind when 'post_comment' then post_comment when 'comment_reply' then comment_reply when 'reaction' then reaction
                     when 'saved_reply' then saved_reply when 'moderation' then moderation else true end
    into v_on from public.community_notification_prefs where user_id = p_user;
  if coalesce(v_on, true) then
    insert into public.notifications(user_id, category, title, body, deep_link, payload) values (p_user, p_category, p_title, p_body, p_link, p_payload);
  end if;
end $$;
revoke execute on function public.community_notify(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;

-- Nom affiché dans une notification : jamais l'identité de l'auteur d'une publication anonyme
create or replace function public.community_actor_label(p_user uuid, p_post uuid)
returns text language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from public.posts where id = p_post and anonymous and author_id = p_user) then 'L’auteur·rice de la publication'
              else coalesce((select pseudonym from public.community_profiles where user_id = p_user), 'Quelqu’un') end;
$$;

create or replace function public.comment_thread_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_parent public.comments;
begin
  if new.parent_id is null then return new; end if;
  select * into v_parent from public.comments where id = new.parent_id;
  if v_parent.id is null or v_parent.post_id <> new.post_id then
    raise exception 'Le commentaire auquel vous répondez est introuvable' using errcode = 'P0001';
  end if;
  if v_parent.status <> 'visible' then raise exception 'Impossible de répondre à ce commentaire' using errcode = 'P0001'; end if;
  if public.is_blocked_between(v_parent.author_id, new.author_id) then
    raise exception 'Impossible de répondre à ce commentaire' using errcode = '42501';
  end if;
  if v_parent.parent_id is not null then
    -- Réponse à une réponse : rattachée au commentaire racine ; la personne à qui l'on répond reste notifiée
    if new.status = 'visible' and v_parent.author_id <> new.author_id
       and v_parent.author_id <> (select author_id from public.comments where id = v_parent.parent_id) then
      perform public.community_notify(v_parent.author_id, 'comment_reply', 'community_reply',
        public.community_actor_label(new.author_id, new.post_id) || ' a répondu à votre commentaire', left(new.body, 120),
        '/community/post/' || new.post_id || '?comment=' || v_parent.id,
        jsonb_build_object('post_id', new.post_id, 'parent_id', v_parent.parent_id, 'reply_to', v_parent.id));
    end if;
    new.parent_id := v_parent.parent_id;
  end if;
  return new;
end $$;

create or replace function public.on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_post public.posts; v_parent_author uuid; v_who text; v_link text; v_done uuid[]; v_saver uuid;
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id returning * into v_post;
  if new.status <> 'visible' then return new; end if;
  v_who := public.community_actor_label(new.author_id, new.post_id);
  v_link := '/community/post/' || new.post_id || '?comment=' || new.id;
  v_done := array[new.author_id];
  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and not v_parent_author = any(v_done) and not public.is_blocked_between(v_parent_author, new.author_id) then
      perform public.community_notify(v_parent_author, 'comment_reply', 'community_reply', v_who || ' a répondu à votre commentaire',
        left(new.body, 120), v_link, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'parent_id', new.parent_id));
    end if;
    v_done := v_done || v_parent_author;
  end if;
  if not v_post.author_id = any(v_done) and not public.is_blocked_between(v_post.author_id, new.author_id) then
    perform public.community_notify(v_post.author_id, 'post_comment', 'community_comment', v_who || ' a commenté votre publication',
      left(new.body, 120), v_link, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
  end if;
  v_done := v_done || v_post.author_id;
  -- Publications enregistrées : nouvelle réponse
  for v_saver in select user_id from public.saved_posts where post_id = new.post_id loop
    if not v_saver = any(v_done) and not public.is_blocked_between(v_saver, new.author_id) then
      perform public.community_notify(v_saver, 'saved_reply', 'community_saved', 'Nouvelle réponse dans une publication enregistrée',
        left(new.body, 120), v_link, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
    end if;
  end loop;
  return new;
end $$;

create or replace function public.on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id returning author_id into v_author;
    -- Une seule notification de réaction par publication et par jour (pas de rafale)
    if v_author is not null and v_author <> new.user_id and not public.is_blocked_between(v_author, new.user_id)
       and not exists (select 1 from public.notifications n where n.user_id = v_author and n.category = 'community_like'
                       and n.payload ->> 'post_id' = new.post_id::text and n.created_at > now() - interval '24 hours') then
      perform public.community_notify(v_author, 'reaction', 'community_like',
        coalesce((select pseudonym from public.community_profiles where user_id = new.user_id), 'Quelqu’un') || ' a aimé votre publication',
        null, '/community/post/' || new.post_id, jsonb_build_object('post_id', new.post_id));
    end if;
    return new;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;

-- Modération : l'autrice est informée (publication ou commentaire masqué, supprimé ou rétabli)
create or replace function public.on_moderated()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_link text; v_what text; v_post uuid;
begin
  if new.status is not distinct from old.status or auth.uid() is not distinct from new.author_id then return new; end if;
  if tg_table_name = 'posts' then
    v_post := new.id; v_link := '/community/post/' || new.id; v_what := 'Votre publication';
  else
    v_post := new.post_id; v_link := '/community/post/' || new.post_id || '?comment=' || new.id; v_what := 'Votre commentaire';
  end if;
  if new.status in ('hidden', 'removed') and old.status in ('visible', 'pending_review') then
    perform public.community_notify(new.author_id, 'moderation', 'community_moderation',
      v_what || case when new.status = 'removed' then ' a été retiré par la modération' else ' a été masqué en attendant la modération' end,
      'Il ne respecte peut-être pas les règles de la communauté. Vous pouvez le retrouver dans « Moi ».', v_link,
      jsonb_build_object('post_id', v_post, 'status', new.status));
  elsif new.status = 'visible' and old.status in ('pending_review', 'hidden') then
    perform public.community_notify(new.author_id, 'moderation', 'community_moderation', v_what || ' est maintenant visible',
      null, v_link, jsonb_build_object('post_id', v_post, 'status', new.status));
  end if;
  return new;
end $$;
drop trigger if exists posts_moderated on public.posts;
create trigger posts_moderated after update of status on public.posts for each row execute function public.on_moderated();
drop trigger if exists comments_moderated on public.comments;
create trigger comments_moderated after update of status on public.comments for each row execute function public.on_moderated();

-- File de modération : lecture complète réservée aux modérateurs (auteur compris, pour une sanction)
create or replace function public.moderation_queue()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role('moderator') then raise exception 'Accès réservé à la modération' using errcode = '42501'; end if;
  return jsonb_build_object(
    'posts', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'body', body, 'status', status, 'report_count', report_count,
                'created_at', created_at, 'author_id', author_id, 'anonymous', anonymous) order by created_at desc), '[]')
              from (select * from public.posts where status in ('hidden', 'pending_review') or (status = 'visible' and report_count > 0) order by created_at desc limit 200) x),
    'comments', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'post_id', post_id, 'body', body, 'status', status, 'report_count', report_count,
                'created_at', created_at, 'author_id', author_id) order by created_at desc), '[]')
              from (select * from public.comments where status in ('hidden', 'pending_review') or (status = 'visible' and report_count > 0) order by created_at desc limit 200) y),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('report_id', r.id, 'handle', cp.handle, 'pseudonym', cp.pseudonym, 'user_id', r.reported_user,
                'reason', r.reason, 'details', r.details, 'created_at', r.created_at) order by r.created_at desc), '[]')
              from public.reports r left join public.community_profiles cp on cp.user_id = r.reported_user where r.reported_user is not null and r.status = 'open'),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('action', action, 'reason', reason, 'post_id', post_id, 'comment_id', comment_id,
                'created_at', created_at, 'automatic', moderator_id is null) order by created_at desc), '[]')
              from (select * from public.moderation_actions order by created_at desc limit 100) z));
end $$;
revoke execute on function public.moderation_queue() from public, anon;
grant execute on function public.moderation_queue() to authenticated;

-- ---------------------------------------------------------------------
-- 7 bis. Signaler un membre (depuis son profil), sans exposer son identifiant
-- ---------------------------------------------------------------------
alter table public.reports add column if not exists reported_user uuid references auth.users(id) on delete cascade;
alter table public.reports drop constraint if exists reports_check;
alter table public.reports drop constraint if exists reports_target_check;
alter table public.reports add constraint reports_target_check check (num_nonnulls(post_id, comment_id, reported_user) = 1);
create unique index if not exists reports_unique_member on public.reports(reporter_id, reported_user) where reported_user is not null and status = 'open';

create or replace function public.on_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if new.post_id is not null then
    update public.posts set report_count = report_count + 1 where id = new.post_id returning report_count into v_count;
    if v_count >= 3 then
      update public.posts set status = 'hidden' where id = new.post_id and status = 'visible';
      if found then insert into public.moderation_actions(post_id, action, reason) values (new.post_id, 'auto_hide', '3 signalements'); end if;
    end if;
  elsif new.comment_id is not null then
    update public.comments set report_count = report_count + 1 where id = new.comment_id returning report_count into v_count;
    if v_count >= 3 then
      update public.comments set status = 'hidden' where id = new.comment_id and status = 'visible';
      if found then insert into public.moderation_actions(comment_id, action, reason) values (new.comment_id, 'auto_hide', '3 signalements'); end if;
    end if;
  end if;
  return new;
end $$;

create or replace function public.report_member(p_handle text, p_reason text, p_details text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_target uuid;
begin
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = auth.uid() then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  if exists (select 1 from public.reports where reporter_id = auth.uid() and reported_user = v_target and status = 'open') then
    raise exception 'Vous avez déjà signalé ce membre' using errcode = 'P0001';
  end if;
  insert into public.reports (reporter_id, reported_user, reason, details) values (auth.uid(), v_target, p_reason, nullif(trim(p_details), ''));
end $$;
revoke execute on function public.report_member(text, text, text) from public, anon;
grant execute on function public.report_member(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Export RGPD : profil complet, photos, réglages des notifications
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v11;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  return public._export_my_data_v11() || jsonb_build_object(
    'community_profile', public.my_community_profile(),
    'community_posts', (select coalesce(jsonb_agg(to_jsonb(p) - 'search'), '[]') from public.posts p where p.author_id = v_uid),
    'community_comments', (select coalesce(jsonb_agg(c), '[]') from public.comments c where c.author_id = v_uid),
    'community_photos', (select coalesce(jsonb_agg(jsonb_build_object('post_id', post_id, 'path', path, 'created_at', created_at)), '[]') from public.post_photos where author_id = v_uid),
    'community_notification_prefs', (select to_jsonb(n) from public.community_notification_prefs n where user_id = v_uid),
    'community_blocks', (select coalesce(jsonb_agg(jsonb_build_object('handle', cp.handle, 'since', b.created_at)), '[]')
                         from public.user_blocks b left join public.community_profiles cp on cp.user_id = b.blocked_id where b.blocker_id = v_uid));
end $$;
revoke execute on function public._export_my_data_v11() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
