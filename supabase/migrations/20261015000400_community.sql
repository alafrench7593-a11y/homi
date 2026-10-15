-- =====================================================================
-- Toi & Moi — 0004 Communauté et modération
-- =====================================================================

create table public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pseudonym text not null unique check (pseudonym ~ '^[A-Za-zÀ-ÿ0-9_.\- ]{3,24}$'),
  area_label text check (char_length(area_label) <= 60), -- zone générale (ex. « Lyon et alentours »), jamais d'adresse
  suspended_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.forums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  journeys text[] not null default '{}',
  icon text,
  is_local boolean not null default false,
  position int not null default 0,
  archived boolean not null default false
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.forums(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 8000),
  area_label text check (char_length(area_label) <= 60),
  status text not null default 'visible' check (status in ('visible','pending_review','hidden','removed')),
  report_count int not null default 0,
  like_count int not null default 0,
  comment_count int not null default 0,
  search tsvector generated always as (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(body,''))) stored,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index posts_forum_idx on public.posts(forum_id, created_at desc) where status = 'visible';
create index posts_search_idx on public.posts using gin(search);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible','pending_review','hidden','removed')),
  report_count int not null default 0,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id, created_at);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (reason in ('harassment','medical_misinformation','spam','personal_data','danger','inappropriate','other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);
create unique index reports_unique_post on public.reports(reporter_id, post_id) where post_id is not null;
create unique index reports_unique_comment on public.reports(reporter_id, comment_id) where comment_id is not null;

create table public.moderation_terms (
  id uuid primary key default gen_random_uuid(),
  pattern text not null unique,       -- expression régulière insensible à la casse
  action text not null check (action in ('review','block')),
  reason text not null
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  comment_id uuid references public.comments(id) on delete set null,
  action text not null check (action in ('hide','restore','remove','warn','suspend','unsuspend','auto_hide','auto_review','dismiss_report')),
  reason text,
  suspended_until timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Logique de modération
-- ---------------------------------------------------------------------
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.community_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_text text; v_term record; v_recent int; v_profile public.community_profiles;
begin
  select * into v_profile from public.community_profiles where user_id = new.author_id;
  if v_profile.user_id is null then
    raise exception 'Choisissez un pseudonyme avant de publier' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  if v_profile.suspended_until is not null and v_profile.suspended_until > now() then
    raise exception 'Votre compte communauté est suspendu jusqu''au %', to_char(v_profile.suspended_until, 'DD/MM/YYYY') using errcode = '42501';
  end if;
  -- Limitation de débit anti-abus
  if tg_table_name = 'posts' then
    select count(*) into v_recent from public.posts where author_id = new.author_id and created_at > now() - interval '1 hour';
    if v_recent >= 8 then raise exception 'Trop de publications en peu de temps, réessayez plus tard' using errcode = 'P0001'; end if;
    v_text := new.title || ' ' || new.body;
  else
    select count(*) into v_recent from public.comments where author_id = new.author_id and created_at > now() - interval '10 minutes';
    if v_recent >= 20 then raise exception 'Trop de commentaires en peu de temps, réessayez plus tard' using errcode = 'P0001'; end if;
    v_text := new.body;
    if exists (select 1 from public.posts p where p.id = new.post_id and public.is_blocked_between(p.author_id, new.author_id)) then
      raise exception 'Impossible de répondre à cette publication' using errcode = '42501';
    end if;
  end if;
  -- Données personnelles évidentes : numéros de téléphone et e-mails -> relecture
  if v_text ~* '(\+33|0)[1-9]([ .-]?[0-9]{2}){4}' or v_text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    new.status := 'pending_review';
  end if;
  for v_term in select * from public.moderation_terms loop
    if v_text ~* v_term.pattern then
      if v_term.action = 'block' then
        raise exception 'Ce contenu ne respecte pas les règles de la communauté (%)', v_term.reason using errcode = 'P0001';
      end if;
      new.status := 'pending_review';
    end if;
  end loop;
  return new;
end $$;
create trigger posts_guard before insert on public.posts for each row execute function public.community_guard();
create trigger comments_guard before insert on public.comments for each row execute function public.community_guard();

-- Masquage automatique au 3e signalement, compteur et historique
create or replace function public.on_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if new.post_id is not null then
    update public.posts set report_count = report_count + 1 where id = new.post_id returning report_count into v_count;
    if v_count >= 3 then
      update public.posts set status = 'hidden' where id = new.post_id and status = 'visible';
      insert into public.moderation_actions(post_id, action, reason) values (new.post_id, 'auto_hide', '3 signalements');
    end if;
  else
    update public.comments set report_count = report_count + 1 where id = new.comment_id returning report_count into v_count;
    if v_count >= 3 then
      update public.comments set status = 'hidden' where id = new.comment_id and status = 'visible';
      insert into public.moderation_actions(comment_id, action, reason) values (new.comment_id, 'auto_hide', '3 signalements');
    end if;
  end if;
  return new;
end $$;
create trigger reports_after after insert on public.reports for each row execute function public.on_report();

-- Compteurs et notifications de réponse
create or replace function public.on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_post public.posts; v_parent_author uuid; v_pseudo text;
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id returning * into v_post;
  if new.status <> 'visible' then return new; end if;
  select pseudonym into v_pseudo from public.community_profiles where user_id = new.author_id;
  if v_post.author_id <> new.author_id then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
    values (v_post.author_id, 'community_comment', coalesce(v_pseudo,'Quelqu''un') || ' a commenté votre publication',
            left(new.body, 120), '/community/post/' || new.post_id, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
  end if;
  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author not in (new.author_id, v_post.author_id) then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (v_parent_author, 'community_reply', coalesce(v_pseudo,'Quelqu''un') || ' vous a répondu',
              left(new.body, 120), '/community/post/' || new.post_id, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
    end if;
  end if;
  return new;
end $$;
create trigger comments_after after insert on public.comments for each row execute function public.on_comment();

create or replace function public.on_comment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end $$;
create trigger comments_after_delete after delete on public.comments for each row execute function public.on_comment_delete();

create or replace function public.on_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger likes_after after insert or delete on public.post_likes for each row execute function public.on_like();

-- Un auteur ne peut modifier que le texte de sa publication (pas son statut ni ses compteurs)
create or replace function public.protect_post_fields()
returns trigger language plpgsql as $$
begin
  -- Mises à jour internes (compteurs, masquage automatique) : déclenchées par un autre trigger
  if pg_trigger_depth() > 1 or public.has_role('moderator') then return new; end if;
  if new.status is distinct from old.status and not (new.status = 'removed' and new.author_id = auth.uid()) then
    raise exception 'Modification du statut interdite' using errcode = '42501';
  end if;
  new.report_count := old.report_count; new.like_count := old.like_count; new.comment_count := old.comment_count;
  new.author_id := old.author_id; new.forum_id := old.forum_id;
  new.edited_at := now();
  return new;
end $$;
create trigger posts_protect before update on public.posts for each row execute function public.protect_post_fields();

-- Sanctions (modérateurs)
create or replace function public.moderate(p_action text, p_post uuid default null, p_comment uuid default null,
                                           p_user uuid default null, p_reason text default null, p_days int default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_until timestamptz;
begin
  if not public.has_role('moderator') then raise exception 'Accès réservé à la modération' using errcode = '42501'; end if;
  if p_action in ('hide','restore','remove') then
    if p_post is not null then
      update public.posts set status = case p_action when 'hide' then 'hidden' when 'remove' then 'removed' else 'visible' end where id = p_post;
      update public.reports set status = 'resolved' where post_id = p_post and status = 'open';
    end if;
    if p_comment is not null then
      update public.comments set status = case p_action when 'hide' then 'hidden' when 'remove' then 'removed' else 'visible' end where id = p_comment;
      update public.reports set status = 'resolved' where comment_id = p_comment and status = 'open';
    end if;
  elsif p_action = 'suspend' then
    v_until := now() + make_interval(days => coalesce(p_days, 7));
    update public.community_profiles set suspended_until = v_until where user_id = p_user;
  elsif p_action = 'unsuspend' then
    update public.community_profiles set suspended_until = null where user_id = p_user;
  elsif p_action = 'dismiss_report' then
    update public.reports set status = 'dismissed' where (post_id = p_post or comment_id = p_comment) and status = 'open';
  elsif p_action <> 'warn' then
    raise exception 'Action inconnue';
  end if;
  insert into public.moderation_actions(moderator_id, target_user_id, post_id, comment_id, action, reason, suspended_until)
  values (auth.uid(), p_user, p_post, p_comment, p_action, p_reason, v_until);
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.community_profiles enable row level security;
alter table public.forums enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_terms enable row level security;
alter table public.moderation_actions enable row level security;

-- Les pseudonymes sont publics pour les membres connectés (pas d'autre donnée)
create policy cp_read on public.community_profiles for select to authenticated using (true);
create policy cp_insert on public.community_profiles for insert to authenticated with check (user_id = auth.uid() and suspended_until is null);
create policy cp_update on public.community_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cp_mod on public.community_profiles for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

create policy forums_read on public.forums for select to authenticated using (not archived or public.has_role('moderator'));
create policy forums_admin on public.forums for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy posts_read on public.posts for select to authenticated using (
  (status = 'visible' and not public.is_blocked_between(author_id, auth.uid()))
  or author_id = auth.uid() or public.has_role('moderator'));
create policy posts_insert on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid() or public.has_role('moderator')) with check (author_id = auth.uid() or public.has_role('moderator'));
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid() or public.has_role('moderator'));

create policy comments_read on public.comments for select to authenticated using (
  ((status = 'visible' and not public.is_blocked_between(author_id, auth.uid()))
   and exists (select 1 from public.posts p where p.id = post_id))
  or author_id = auth.uid() or public.has_role('moderator'));
create policy comments_insert on public.comments for insert to authenticated with check (
  author_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and p.status = 'visible'));
create policy comments_delete on public.comments for delete to authenticated using (author_id = auth.uid() or public.has_role('moderator'));

create policy likes_own on public.post_likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_own on public.saved_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy blocks_own on public.user_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_own_read on public.reports for select to authenticated using (reporter_id = auth.uid() or public.has_role('moderator'));
create policy reports_mod on public.reports for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

create policy terms_mod on public.moderation_terms for all to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));
create policy actions_mod on public.moderation_actions for select to authenticated using (public.has_role('moderator'));

-- Vue publique : pseudonyme à la place de l'identifiant
create view public.forum_feed with (security_invoker = true) as
  select p.id, p.forum_id, p.title, p.body, p.area_label, p.status, p.like_count, p.comment_count,
         p.created_at, p.edited_at, cp.pseudonym, (p.author_id = auth.uid()) as is_mine,
         exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked,
         exists (select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = auth.uid()) as saved,
         p.search
  from public.posts p left join public.community_profiles cp on cp.user_id = p.author_id;

create view public.comment_feed with (security_invoker = true) as
  select c.id, c.post_id, c.parent_id, c.body, c.status, c.created_at, cp.pseudonym, (c.author_id = auth.uid()) as is_mine
  from public.comments c left join public.community_profiles cp on cp.user_id = c.author_id;
