-- =====================================================================
-- Toi & Moi — Espaces de la communauté, réponses en fil, recherche
-- - 15 espaces séparés, ouverts à toutes et tous quel que soit le parcours
-- - réponses à un commentaire (un seul niveau), notifications de réponse
-- - recherche plein texte (français) sur les publications
-- - pseudonyme distinct du nom et de l'adresse e-mail
-- Migration idempotente : rejouable sur une base existante.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Espaces (forums) : renommages puis upsert par slug
-- ---------------------------------------------------------------------
update public.forums set slug = 'eviter-grossesse'
 where slug = 'contraception' and not exists (select 1 from public.forums where slug = 'eviter-grossesse');

insert into public.forums (slug, title, description, journeys, icon, is_local, position, archived) values
 ('eviter-grossesse','Éviter une grossesse','Contraception, oublis, questions avant une consultation, ressentis.','{avoid}','shield',false,1,false),
 ('projet-bebe','Projet bébé','Essayer d''avoir un enfant, attendre, espérer, se soutenir.','{ttc}','sparkles',false,2,false),
 ('fertilite','Fertilité','Parcours de PMA, examens, attente et soutien entre personnes concernées.','{ttc}','fertility',false,3,false),
 ('grossesse','Grossesse','Questions et partages pendant la grossesse.','{pregnant}','moon',false,4,false),
 ('jumeaux-triples','Jumeaux et triplés','Grossesses multiples et familles de jumeaux ou triplés.','{pregnant,newborn,child}','twins',false,5,false),
 ('accouchement','Accouchement','Se préparer, raconter son accouchement, projet de naissance.','{pregnant}','birth',false,6,false),
 ('post-partum','Post-partum','Après la naissance : récupération, émotions, quotidien.','{newborn}','heart',false,7,false),
 ('allaitement','Allaitement','Allaitement, tire-lait, sevrage, et allaitement mixte.','{newborn}','drop',false,8,false),
 ('biberon','Biberon','Préparation, quantités, choix du lait, passage au biberon.','{newborn}','bottle',false,9,false),
 ('sommeil','Sommeil','Nuits, siestes, rituels du coucher, fatigue des parents.','{newborn,child}','sleep',false,10,false),
 ('diversification','Diversification','Premiers repas, textures, allergènes, idées de menus.','{newborn,child}','food',false,11,false),
 ('parents-bebes','Parents de bébés','Le quotidien avec un bébé de 0 à 2 ans.','{newborn,child}','baby',false,12,false),
 ('parents-enfants','Parents d’enfants','De 2 à 10 ans : école, émotions, organisation.','{child,family}','sun',false,13,false),
 ('familles-nombreuses','Familles nombreuses','Organiser la vie avec plusieurs enfants.','{family}','users',false,14,false),
 ('rencontres-locales','Rencontres locales','Proposer une rencontre dans un lieu public, par zone générale uniquement.','{}','map',true,15,false)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, journeys = excluded.journeys, icon = excluded.icon,
  is_local = excluded.is_local, position = excluded.position, archived = false;

-- Tout autre espace est archivé (ses publications restent consultables dans le fil)
update public.forums set archived = true
 where slug not in ('eviter-grossesse','projet-bebe','fertilite','grossesse','jumeaux-triples','accouchement','post-partum',
                    'allaitement','biberon','sommeil','diversification','parents-bebes','parents-enfants','familles-nombreuses','rencontres-locales');

-- ---------------------------------------------------------------------
-- 2. Réponses en fil (comments.parent_id existe déjà depuis 0004)
-- ---------------------------------------------------------------------
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments(parent_id) where parent_id is not null;

-- Une réponse vise un commentaire de la MÊME publication ; une réponse à une
-- réponse est rattachée au commentaire racine (un seul niveau d'imbrication).
create or replace function public.comment_thread_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_parent public.comments;
begin
  if new.parent_id is null then return new; end if;
  select * into v_parent from public.comments where id = new.parent_id;
  if v_parent.id is null or v_parent.post_id <> new.post_id then
    raise exception 'Le commentaire auquel vous répondez est introuvable' using errcode = 'P0001';
  end if;
  if v_parent.status <> 'visible' then
    raise exception 'Impossible de répondre à ce commentaire' using errcode = 'P0001';
  end if;
  if public.is_blocked_between(v_parent.author_id, new.author_id) then
    raise exception 'Impossible de répondre à ce commentaire' using errcode = '42501';
  end if;
  if v_parent.parent_id is not null then
    -- La personne à qui l'on répond reste notifiée, même si la réponse est rattachée au commentaire racine
    if new.status = 'visible' and v_parent.author_id <> new.author_id
       and v_parent.author_id <> (select author_id from public.comments where id = v_parent.parent_id) then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (v_parent.author_id, 'community_reply',
              coalesce((select pseudonym from public.community_profiles where user_id = new.author_id), 'Quelqu''un') || ' a répondu à votre commentaire',
              left(new.body, 120), '/community/post/' || new.post_id,
              jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'parent_id', v_parent.parent_id));
    end if;
    new.parent_id := v_parent.parent_id;
  end if;
  return new;
end $$;
drop trigger if exists comments_thread on public.comments;
-- « comments_thread » s'exécute après « comments_guard » (ordre alphabétique)
create trigger comments_thread before insert on public.comments for each row execute function public.comment_thread_guard();

-- Notifications : réponse à mon commentaire (community_reply), commentaire
-- sur ma publication (community_comment). Jamais de notification entre
-- personnes qui se sont bloquées, ni pour un contenu en relecture.
create or replace function public.on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_post public.posts; v_parent_author uuid; v_pseudo text;
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id returning * into v_post;
  if new.status <> 'visible' then return new; end if;
  select pseudonym into v_pseudo from public.community_profiles where user_id = new.author_id;
  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id
       and not public.is_blocked_between(v_parent_author, new.author_id) then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (v_parent_author, 'community_reply', coalesce(v_pseudo,'Quelqu''un') || ' a répondu à votre commentaire',
              left(new.body, 120), '/community/post/' || new.post_id,
              jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'parent_id', new.parent_id));
    end if;
  end if;
  if v_post.author_id <> new.author_id and v_post.author_id is distinct from v_parent_author
     and not public.is_blocked_between(v_post.author_id, new.author_id)
     and not exists (select 1 from public.notifications n where n.user_id = v_post.author_id and n.payload ->> 'comment_id' = new.id::text) then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
    values (v_post.author_id, 'community_comment', coalesce(v_pseudo,'Quelqu''un') || ' a commenté votre publication',
            left(new.body, 120), '/community/post/' || new.post_id, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Recherche plein texte (la RLS s'applique : fonction SECURITY INVOKER)
-- ---------------------------------------------------------------------
create or replace function public.search_posts(p_query text, p_forum uuid default null, p_limit int default 50)
returns setof public.forum_feed language sql stable security invoker set search_path = public as $$
  select f.* from public.forum_feed f
  where f.status = 'visible'
    and (p_forum is null or f.forum_id = p_forum)
    and char_length(trim(coalesce(p_query, ''))) >= 2
    and (f.search @@ websearch_to_tsquery('french', p_query)
         or f.title ilike '%' || trim(p_query) || '%'
         or f.body ilike '%' || trim(p_query) || '%')
  order by ts_rank(f.search, websearch_to_tsquery('french', p_query)) desc, f.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- ---------------------------------------------------------------------
-- 4. Pseudonyme : jamais le nom affiché ni l'identifiant de l'e-mail
-- ---------------------------------------------------------------------
create or replace function public.pseudonym_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_email text; v_p text := lower(trim(new.pseudonym));
begin
  new.pseudonym := trim(new.pseudonym);
  select lower(trim(display_name)) into v_name from public.profiles where id = new.user_id;
  select lower(split_part(email, '@', 1)) into v_email from auth.users where id = new.user_id;
  if (v_name is not null and v_name <> '' and v_p = v_name) or (v_email is not null and v_email <> '' and v_p = v_email) then
    raise exception 'Choisissez un pseudonyme différent de votre prénom et de votre adresse e-mail' using errcode = 'P0001', hint = 'pseudonym_identifying';
  end if;
  return new;
end $$;
drop trigger if exists community_profiles_pseudonym on public.community_profiles;
create trigger community_profiles_pseudonym before insert or update of pseudonym on public.community_profiles
  for each row execute function public.pseudonym_guard();
