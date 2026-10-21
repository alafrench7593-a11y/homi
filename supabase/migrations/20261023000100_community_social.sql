-- =====================================================================
-- Communauté : mini-réseau social (23 octobre 2026)
--  · Suivre un membre, s'abonner à une catégorie, fil « Abonnements », mentions @identifiant.
--  · Publications épinglées, sondages (votes anonymes), groupes thématiques, groupes par mois de naissance
--    ou de terme prévu, groupes privés sur invitation (création Premium).
--  · Premium : profil personnalisé (couleur, bannière, présentation enrichie), badge discret et facultatif,
--    albums privés ou partagés, dossiers d'enregistrements, recherche avancée, journal d'activité.
--  · Fidélisation utile : réglages du résumé du matin et du soir, question du jour facultative.
-- Principes : aucune popularité affichée (pas de nombre d'abonnés public, pas de classement) ; une publication
-- anonyme n'est jamais rattachée à son autrice (ni abonnements, ni mentions, ni notifications d'abonnés) ;
-- tout ce qui a été créé reste lisible après la fin d'un abonnement (seules les NOUVELLES créations Premium sont en pause).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Limites Gratuit / Premium
-- ---------------------------------------------------------------------
insert into public.plan_limits (key, free_value, premium_value, description) values
  ('private_groups_count', 0, 10, 'Groupes privés créés'),
  ('albums_count', 0, 50, 'Albums photo de la communauté'),
  ('saved_folders_count', 0, 50, 'Dossiers d''enregistrements'),
  ('community_ai_per_month', 0, 200, 'Résumés et traductions de discussions par mois')
on conflict (key) do update set free_value = excluded.free_value, premium_value = excluded.premium_value, description = excluded.description;

-- Erreur « Fonction Premium » homogène (l'interface affiche alors l'aperçu de l'abonnement)
create or replace function public.assert_premium(p_feature text)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_premium(auth.uid()) then
    raise exception 'Fonction Premium (%)', p_feature using errcode = 'P0001', hint = 'premium_required';
  end if;
end $$;
revoke execute on function public.assert_premium(text) from public, anon;
grant execute on function public.assert_premium(text) to authenticated;

-- ---------------------------------------------------------------------
-- 1. Profil : personnalisation Premium et badge facultatif
-- ---------------------------------------------------------------------
alter table public.community_profiles
  add column if not exists accent text,
  add column if not exists banner text,
  add column if not exists about text,
  add column if not exists show_premium_badge boolean not null default false;
alter table public.community_profiles drop constraint if exists community_profiles_accent_check;
alter table public.community_profiles add constraint community_profiles_accent_check
  check (accent is null or accent in ('rose','lavande','menthe','peche','ciel','sable'));
alter table public.community_profiles drop constraint if exists community_profiles_banner_check;
alter table public.community_profiles add constraint community_profiles_banner_check
  check (banner is null or banner in ('aube','nuit','prairie','ocean','nacre'));
alter table public.community_profiles drop constraint if exists community_profiles_about_check;
alter table public.community_profiles add constraint community_profiles_about_check check (about is null or char_length(about) <= 1200);

-- Nouvelle personnalisation : Premium. Ce qui existe déjà reste affiché, et peut toujours être RETIRÉ.
create or replace function public.community_profile_premium()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_new boolean;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  new.about := nullif(trim(new.about), '');
  if tg_op = 'INSERT' then
    v_new := new.accent is not null or new.banner is not null or new.about is not null or new.show_premium_badge;
  else
    v_new := (new.accent is not null and new.accent is distinct from old.accent)
          or (new.banner is not null and new.banner is distinct from old.banner)
          or (new.about is not null and new.about is distinct from old.about)
          or (new.show_premium_badge and not old.show_premium_badge);
  end if;
  if v_new and not public.has_premium(new.user_id) then
    raise exception 'Fonction Premium (community_profile)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists community_profiles_premium on public.community_profiles;
create trigger community_profiles_premium before insert or update on public.community_profiles
  for each row execute function public.community_profile_premium();

-- Badge : seulement si la personne l'a choisi ET que son abonnement est actif
create or replace function public.premium_badge(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select show_premium_badge from public.community_profiles where user_id = p_user), false) and public.has_premium(p_user);
$$;
revoke execute on function public.premium_badge(uuid) from public, anon;

-- ---------------------------------------------------------------------
-- 2. Suivre un membre ; s'abonner à une catégorie
-- ---------------------------------------------------------------------
create table if not exists public.member_follows (
  follower_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists member_follows_followee_idx on public.member_follows(followee_id);
alter table public.member_follows enable row level security;
-- Lecture : seulement les personnes que JE suis (la liste de mes abonné·es n'est jamais exposée)
drop policy if exists follows_read on public.member_follows;
create policy follows_read on public.member_follows for select to authenticated using (follower_id = auth.uid());
drop policy if exists follows_delete on public.member_follows;
create policy follows_delete on public.member_follows for delete to authenticated using (follower_id = auth.uid());
-- Création uniquement via follow_member (identifiant public, blocage vérifié)

create table if not exists public.forum_subscriptions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  forum_id uuid not null references public.forums(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, forum_id)
);
alter table public.forum_subscriptions enable row level security;
drop policy if exists forum_subs_own on public.forum_subscriptions;
create policy forum_subs_own on public.forum_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.follow_member(p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_target uuid; v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if not exists (select 1 from public.community_profiles where user_id = v_me) then
    raise exception 'Créez votre profil communautaire pour suivre un membre' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = v_me then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  if public.is_blocked_between(v_me, v_target) then raise exception 'Impossible de suivre ce membre' using errcode = '42501'; end if;
  insert into public.member_follows (follower_id, followee_id) values (v_me, v_target) on conflict do nothing;
  if found then
    -- Une seule notification par personne et par semaine (pas de rafale « suivre / ne plus suivre »)
    if not exists (select 1 from public.notifications where user_id = v_target and category = 'community_follow'
                   and payload ->> 'follower' = (select handle from public.community_profiles where user_id = v_me)
                   and created_at > now() - interval '7 days') then
      perform public.community_notify(v_target, 'new_follower', 'community_follow',
        (select pseudonym from public.community_profiles where user_id = v_me) || ' suit maintenant vos publications', null,
        '/community/u/' || (select handle from public.community_profiles where user_id = v_me),
        jsonb_build_object('follower', (select handle from public.community_profiles where user_id = v_me)));
    end if;
  end if;
end $$;

create or replace function public.unfollow_member(p_handle text)
returns void language sql security definer set search_path = public as $$
  delete from public.member_follows where follower_id = auth.uid()
    and followee_id = (select user_id from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, '')))));
$$;

-- Les membres que je suis (identifiants publics uniquement)
create or replace function public.my_follows()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('handle', cp.handle, 'pseudonym', cp.pseudonym, 'avatar_path', cp.avatar_path,
           'avatar_preset', cp.avatar_preset, 'since', f.created_at) order by f.created_at desc), '[]')
  from public.member_follows f join public.community_profiles cp on cp.user_id = f.followee_id
  where f.follower_id = auth.uid() and not public.is_blocked_between(f.followee_id, auth.uid());
$$;

-- Recherche de membres (pseudonyme ou identifiant) ; jamais d'informations privées
create or replace function public.search_members(p_query text, p_limit int default 20)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.rank, x.handle), '[]') from (
    select cp.handle, cp.pseudonym, cp.avatar_path, cp.avatar_preset,
           exists (select 1 from public.member_follows f where f.follower_id = auth.uid() and f.followee_id = cp.user_id) as is_following,
           case when cp.handle = lower(trim(leading '@' from trim(p_query))) then 0 when cp.handle like lower(trim(leading '@' from trim(p_query))) || '%' then 1 else 2 end as rank
    from public.community_profiles cp
    where auth.uid() is not null and char_length(trim(coalesce(p_query, ''))) >= 2
      and cp.user_id <> auth.uid()
      and not public.is_blocked_between(cp.user_id, auth.uid())
      and (cp.handle ilike '%' || lower(trim(leading '@' from trim(p_query))) || '%' or cp.pseudonym ilike '%' || trim(p_query) || '%')
    limit least(greatest(coalesce(p_limit, 20), 1), 50)) x;
$$;

revoke execute on function public.follow_member(text), public.unfollow_member(text), public.my_follows(), public.search_members(text, int) from public, anon;
grant execute on function public.follow_member(text), public.unfollow_member(text), public.my_follows(), public.search_members(text, int) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Groupes : thématiques, par mois de naissance / terme prévu, privés sur invitation
-- ---------------------------------------------------------------------
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null check (char_length(name) between 3 and 60),
  description text check (description is null or char_length(description) <= 400),
  kind text not null check (kind in ('theme', 'cohort', 'private')),
  cohort_type text check (cohort_type is null or cohort_type in ('birth', 'due')),
  cohort_month date,
  icon text,
  owner_id uuid references auth.users(id) on delete set null,
  member_count int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  check ((kind = 'cohort') = (cohort_type is not null and cohort_month is not null)),
  check (kind <> 'private' or owner_id is not null or archived)
);
create unique index if not exists community_groups_cohort_key on public.community_groups(cohort_type, cohort_month) where kind = 'cohort';

create table if not exists public.group_members (
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members(user_id);

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  invited_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create unique index if not exists group_invitations_pending_key on public.group_invitations(group_id, invited_id) where status = 'pending';

-- Publications dans un groupe, épinglage
alter table public.posts add column if not exists group_id uuid references public.community_groups(id) on delete cascade;
alter table public.posts add column if not exists pinned_at timestamptz;
create index if not exists posts_group_idx on public.posts(group_id, created_at desc) where group_id is not null;

create or replace function public.is_group_member(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = p_user);
$$;
create or replace function public.can_see_group(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_groups g where g.id = p_group and (
    (g.kind in ('theme', 'cohort') and not g.archived)
    or exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = p_user)
    or public.has_role('moderator')));
$$;

alter table public.community_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
drop policy if exists groups_read on public.community_groups;
create policy groups_read on public.community_groups for select to authenticated using (
  public.can_see_group(community_groups.id)
  or exists (select 1 from public.group_invitations i where i.group_id = community_groups.id and i.invited_id = auth.uid() and i.status = 'pending'));
drop policy if exists groups_admin on public.community_groups;
create policy groups_admin on public.community_groups for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
-- Mes adhésions seulement (la liste complète des membres n'est jamais publique)
drop policy if exists group_members_own on public.group_members;
create policy group_members_own on public.group_members for select to authenticated using (user_id = auth.uid());
drop policy if exists group_members_leave on public.group_members;
create policy group_members_leave on public.group_members for delete to authenticated using (user_id = auth.uid() and role <> 'owner');
drop policy if exists group_invitations_read on public.group_invitations;
create policy group_invitations_read on public.group_invitations for select to authenticated using (invited_id = auth.uid() or invited_by = auth.uid());

create or replace function public.on_group_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.community_groups set member_count = member_count + 1 where id = new.group_id; return new;
  else update public.community_groups set member_count = greatest(member_count - 1, 0) where id = old.group_id; return old; end if;
end $$;
drop trigger if exists group_members_count on public.group_members;
create trigger group_members_count after insert or delete on public.group_members for each row execute function public.on_group_member();

-- Groupes thématiques ouverts
insert into public.community_groups (slug, name, description, kind, icon) values
  ('parents-solo', 'Parents solos', 'S’organiser seul·e avec ses enfants, trouver du relais, se soutenir.', 'theme', 'users'),
  ('retour-au-travail', 'Retour au travail', 'Mode de garde, tire-lait au bureau, organisation, fatigue.', 'theme', 'briefcase'),
  ('prematurite', 'Naissance prématurée', 'Néonatologie, retour à la maison, âge corrigé : des parents qui sont passés par là.', 'theme', 'heart'),
  ('allaitement-long', 'Allaitement après 6 mois', 'Allaitement prolongé, diversification, sevrage en douceur.', 'theme', 'drop'),
  ('papas', 'Papas', 'Un espace pour les pères et les coparents.', 'theme', 'user'),
  ('handicap-maladie', 'Enfant malade ou en situation de handicap', 'Démarches, soins, fatigue, fratrie : partager son quotidien.', 'theme', 'shield')
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon;

create or replace function public.cohort_name(p_type text, p_month date)
returns text language sql immutable as $$
  select case p_type when 'birth' then 'Bébés nés en ' else 'Terme prévu en ' end
    || (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from p_month)::int]
    || ' ' || extract(year from p_month)::int;
$$;

-- Rejoindre un groupe ouvert (thème ou cohorte déjà créée)
create or replace function public.join_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.community_groups;
begin
  if not exists (select 1 from public.community_profiles where user_id = auth.uid()) then
    raise exception 'Créez votre profil communautaire pour rejoindre un groupe' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  select * into v from public.community_groups where id = p_group;
  if v.id is null or v.archived then raise exception 'Groupe introuvable' using errcode = 'P0001'; end if;
  if v.kind = 'private' then
    -- Groupe privé : uniquement sur invitation (accepter l'invitation l'ajoute)
    raise exception 'Ce groupe est privé : il faut une invitation' using errcode = '42501';
  end if;
  insert into public.group_members (group_id, user_id) values (p_group, auth.uid()) on conflict do nothing;
end $$;

-- Groupe par mois de naissance ou de terme prévu : créé à la première adhésion.
-- Seuls le TYPE et le MOIS sont transmis (jamais le prénom ni la date exacte).
create or replace function public.join_cohort_group(p_type text, p_month date)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_month date := date_trunc('month', p_month)::date; v_id uuid;
begin
  if p_type not in ('birth', 'due') then raise exception 'Type de groupe inconnu' using errcode = '22023'; end if;
  if p_type = 'birth' and (v_month > date_trunc('month', now())::date or v_month < (date_trunc('month', now()) - interval '6 years')::date) then
    raise exception 'Mois de naissance hors des groupes proposés' using errcode = '22023';
  end if;
  if p_type = 'due' and (v_month < (date_trunc('month', now()) - interval '2 months')::date or v_month > (date_trunc('month', now()) + interval '10 months')::date) then
    raise exception 'Mois de terme hors des groupes proposés' using errcode = '22023';
  end if;
  insert into public.community_groups (slug, name, description, kind, cohort_type, cohort_month, icon)
  values ((case p_type when 'birth' then 'naissance-' else 'terme-' end) || to_char(v_month, 'YYYY-MM'), public.cohort_name(p_type, v_month),
          case p_type when 'birth' then 'Les parents d’enfants nés le même mois : étapes, nuits, premières fois.' else 'Les futurs parents qui attendent leur bébé le même mois.' end,
          'cohort', p_type, v_month, case p_type when 'birth' then 'gift' else 'moon' end)
  on conflict (slug) do nothing;
  select id into v_id from public.community_groups where kind = 'cohort' and cohort_type = p_type and cohort_month = v_month;
  perform public.join_group(v_id);
  return v_id;
end $$;

create or replace function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.group_members where group_id = p_group and user_id = auth.uid() and role = 'owner') then
    raise exception 'Vous avez créé ce groupe : supprimez-le ou gardez-le' using errcode = 'P0001';
  end if;
  delete from public.group_members where group_id = p_group and user_id = auth.uid();
end $$;

-- Groupe privé : création Premium (les groupes existants continuent de fonctionner après l'abonnement)
create or replace function public.create_private_group(p_name text, p_description text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_count int;
begin
  if not exists (select 1 from public.community_profiles where user_id = auth.uid()) then
    raise exception 'Créez votre profil communautaire' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  perform public.assert_premium('community_groups');
  select count(*) into v_count from public.community_groups where owner_id = auth.uid() and kind = 'private' and not archived;
  if v_count >= public.plan_limit('private_groups_count', auth.uid()) then
    raise exception 'Limite de groupes privés atteinte' using errcode = 'P0001', hint = 'premium_required';
  end if;
  if public.community_text_needs_review(coalesce(p_name, '') || ' ' || coalesce(p_description, '')) then
    raise exception 'Retirez les informations personnelles (téléphone, adresse…) du nom ou de la description' using errcode = 'P0001';
  end if;
  insert into public.community_groups (name, description, kind, owner_id, icon)
  values (trim(p_name), nullif(trim(p_description), ''), 'private', auth.uid(), 'lock') returning id into v_id;
  insert into public.group_members (group_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end $$;

create or replace function public.invite_to_group(p_group uuid, p_handle text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_target uuid; v_id uuid; v_group public.community_groups;
begin
  select * into v_group from public.community_groups where id = p_group;
  if v_group.id is null or v_group.kind <> 'private' or v_group.owner_id <> auth.uid() or v_group.archived then
    raise exception 'Seule la créatrice du groupe peut inviter' using errcode = '42501';
  end if;
  perform public.assert_premium('community_groups');
  if v_group.member_count >= 100 then raise exception 'Un groupe privé compte 100 membres au plus' using errcode = 'P0001'; end if;
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = auth.uid() then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  if public.is_blocked_between(v_target, auth.uid()) then raise exception 'Impossible d''inviter ce membre' using errcode = '42501'; end if;
  if public.is_group_member(p_group, v_target) then raise exception 'Ce membre fait déjà partie du groupe' using errcode = 'P0001'; end if;
  insert into public.group_invitations (group_id, invited_id, invited_by) values (p_group, v_target, auth.uid())
    on conflict (group_id, invited_id) where status = 'pending' do nothing returning id into v_id;
  if v_id is null then raise exception 'Une invitation est déjà en attente' using errcode = 'P0001'; end if;
  perform public.community_notify(v_target, 'group_invite', 'community_group',
    (select pseudonym from public.community_profiles where user_id = auth.uid()) || ' vous invite dans le groupe privé « ' || v_group.name || ' »',
    'Acceptez ou refusez l’invitation : vous seul·e décidez.', '/community/group/' || p_group || '?invite=' || v_id,
    jsonb_build_object('group_id', p_group, 'invitation_id', v_id));
  return v_id;
end $$;

create or replace function public.respond_group_invitation(p_invitation uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare v public.group_invitations;
begin
  select * into v from public.group_invitations where id = p_invitation and invited_id = auth.uid() and status = 'pending';
  if v.id is null then raise exception 'Invitation introuvable ou déjà traitée' using errcode = 'P0001'; end if;
  if p_accept and not exists (select 1 from public.community_profiles where user_id = auth.uid()) then
    raise exception 'Créez votre profil communautaire pour rejoindre ce groupe' using errcode = 'P0001', hint = 'pseudonym_required';
  end if;
  update public.group_invitations set status = case when p_accept then 'accepted' else 'declined' end, answered_at = now() where id = v.id;
  if p_accept then insert into public.group_members (group_id, user_id) values (v.group_id, auth.uid()) on conflict do nothing; end if;
  return v.group_id;
end $$;

-- Retirer un membre de son groupe privé (toujours possible, même sans abonnement)
create or replace function public.remove_group_member(p_group uuid, p_handle text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.community_groups where id = p_group and owner_id = auth.uid()) then
    raise exception 'Seule la créatrice du groupe peut retirer un membre' using errcode = '42501';
  end if;
  delete from public.group_members where group_id = p_group and role <> 'owner'
    and user_id = (select user_id from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, '')))));
end $$;

-- Supprimer son groupe privé (publications du groupe comprises)
create or replace function public.delete_private_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.community_groups where id = p_group and owner_id = auth.uid() and kind = 'private') then
    raise exception 'Seule la créatrice du groupe peut le supprimer' using errcode = '42501';
  end if;
  delete from public.community_groups where id = p_group;
end $$;

-- Mes groupes + groupes ouverts, avec mon statut ; détail d'un groupe (membres visibles UNIQUEMENT dans un groupe privé, par ses membres)
create or replace function public.community_groups_overview()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'slug', g.slug, 'name', g.name, 'description', g.description, 'kind', g.kind,
           'cohort_type', g.cohort_type, 'cohort_month', g.cohort_month, 'icon', g.icon, 'member_count', g.member_count,
           'is_member', public.is_group_member(g.id), 'is_owner', g.owner_id = auth.uid(),
           'pending_invitation', (select i.id from public.group_invitations i where i.group_id = g.id and i.invited_id = auth.uid() and i.status = 'pending'),
           'last_post_at', (select max(p.created_at) from public.posts p where p.group_id = g.id and p.status = 'visible'))
         order by (g.kind = 'private') desc, g.kind, g.cohort_month desc nulls last, g.name), '[]')
  from public.community_groups g
  where auth.uid() is not null and not g.archived
    and (g.kind in ('theme') or public.is_group_member(g.id)
         or exists (select 1 from public.group_invitations i where i.group_id = g.id and i.invited_id = auth.uid() and i.status = 'pending'));
$$;

create or replace function public.group_detail(p_group uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.community_groups; v_member boolean;
begin
  select * into g from public.community_groups where id = p_group;
  if g.id is null then return null; end if;
  v_member := public.is_group_member(p_group);
  if not (public.can_see_group(p_group) or exists (select 1 from public.group_invitations where group_id = p_group and invited_id = auth.uid() and status = 'pending')) then
    return null;
  end if;
  return jsonb_build_object('id', g.id, 'name', g.name, 'description', g.description, 'kind', g.kind, 'cohort_type', g.cohort_type,
    'cohort_month', g.cohort_month, 'icon', g.icon, 'member_count', g.member_count, 'is_member', v_member, 'is_owner', g.owner_id = auth.uid(),
    -- Inviter de nouveaux membres : Premium (indiqué à la créatrice seule)
    'can_invite', case when g.owner_id = auth.uid() and g.kind = 'private' then public.has_premium(auth.uid()) else null end,
    'pending_invitation', (select id from public.group_invitations where group_id = p_group and invited_id = auth.uid() and status = 'pending'),
    'members', case when g.kind = 'private' and v_member then (
        select coalesce(jsonb_agg(jsonb_build_object('handle', cp.handle, 'pseudonym', cp.pseudonym, 'avatar_path', cp.avatar_path,
                 'avatar_preset', cp.avatar_preset, 'role', m.role) order by m.role desc, cp.pseudonym), '[]')
        from public.group_members m join public.community_profiles cp on cp.user_id = m.user_id where m.group_id = p_group) else null end,
    'invitations', case when g.owner_id = auth.uid() then (
        select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'handle', cp.handle, 'status', i.status, 'created_at', i.created_at) order by i.created_at desc), '[]')
        from public.group_invitations i join public.community_profiles cp on cp.user_id = i.invited_id where i.group_id = p_group and i.status = 'pending') else null end);
end $$;

revoke execute on function public.join_group(uuid), public.join_cohort_group(text, date), public.leave_group(uuid), public.create_private_group(text, text),
  public.invite_to_group(uuid, text), public.respond_group_invitation(uuid, boolean), public.remove_group_member(uuid, text),
  public.delete_private_group(uuid), public.community_groups_overview(), public.group_detail(uuid) from public, anon;
grant execute on function public.join_group(uuid), public.join_cohort_group(text, date), public.leave_group(uuid), public.create_private_group(text, text),
  public.invite_to_group(uuid, text), public.respond_group_invitation(uuid, boolean), public.remove_group_member(uuid, text),
  public.delete_private_group(uuid), public.community_groups_overview(), public.group_detail(uuid) to authenticated;


create or replace function public.posts_group_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.group_id is not null and not public.is_group_member(new.group_id, new.author_id) then
    raise exception 'Rejoignez ce groupe pour y publier' using errcode = '42501';
  end if;
  new.pinned_at := null;
  return new;
end $$;
drop trigger if exists posts_group_guard on public.posts;
create trigger posts_group_guard before insert on public.posts for each row execute function public.posts_group_guard();

-- Commenter dans un groupe : il faut en être membre
create or replace function public.comments_group_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from public.posts where id = new.post_id;
  if v_group is not null and not public.is_group_member(v_group, new.author_id) then
    raise exception 'Rejoignez ce groupe pour répondre' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists comments_group_guard on public.comments;
create trigger comments_group_guard before insert on public.comments for each row execute function public.comments_group_guard();

-- Champs protégés (reprend la v2) : le groupe et l'épinglage ne se changent pas par une simple modification
create or replace function public.protect_post_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or public.has_role('moderator') then return new; end if;
  if new.status is distinct from old.status and not (new.status = 'removed' and old.author_id = auth.uid()) then
    raise exception 'Modification du statut interdite' using errcode = '42501';
  end if;
  new.report_count := old.report_count; new.like_count := old.like_count; new.comment_count := old.comment_count;
  new.author_id := old.author_id; new.anonymous := old.anonymous; new.created_at := old.created_at;
  new.group_id := old.group_id;
  if coalesce(current_setting('toietmoi.allow_pin', true), '') <> '1' then new.pinned_at := old.pinned_at; end if;
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

-- Épingler : la modération (catégories) ou la créatrice d'un groupe privé (dans son groupe). 3 épinglées au plus par lieu.
create or replace function public.pin_post(p_post uuid, p_pin boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v public.posts;
begin
  select * into v from public.posts where id = p_post;
  if v.id is null then raise exception 'Publication introuvable' using errcode = 'P0001'; end if;
  if not (public.has_role('moderator')
          or (v.group_id is not null and exists (select 1 from public.community_groups g where g.id = v.group_id and g.owner_id = auth.uid() and g.kind = 'private'))) then
    raise exception 'Épinglage réservé à la modération ou à la créatrice du groupe' using errcode = '42501';
  end if;
  if p_pin and (select count(*) from public.posts where pinned_at is not null and status = 'visible' and id <> p_post
                 and ((v.group_id is null and group_id is null and forum_id = v.forum_id) or (v.group_id is not null and group_id = v.group_id))) >= 3 then
    raise exception '3 publications épinglées au plus' using errcode = 'P0001';
  end if;
  perform set_config('toietmoi.allow_pin', '1', true);
  update public.posts set pinned_at = case when p_pin then now() else null end where id = p_post;
  perform set_config('toietmoi.allow_pin', '', true);
end $$;
revoke execute on function public.pin_post(uuid, boolean) from public, anon;
grant execute on function public.pin_post(uuid, boolean) to authenticated;

-- Lecture d'une publication : règles v2 + groupes
create or replace function public.can_read_post(p_post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = p_post and auth.uid() is not null
    and (p.group_id is null or public.can_see_group(p.group_id) or p.author_id = auth.uid())
    and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator')));
$$;
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (public.can_read_post(id));

-- ---------------------------------------------------------------------
-- 4. Sondages (votes anonymes : seuls les totaux sont visibles)
-- ---------------------------------------------------------------------
create table if not exists public.post_polls (
  post_id uuid primary key references public.posts(id) on delete cascade,
  multiple boolean not null default false,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.post_polls(post_id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  position smallint not null check (position between 0 and 5),
  unique (post_id, position)
);
create table if not exists public.poll_votes (
  post_id uuid not null references public.post_polls(post_id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);
create index if not exists poll_votes_post_idx on public.poll_votes(post_id, user_id);
alter table public.post_polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
drop policy if exists polls_read on public.post_polls;
create policy polls_read on public.post_polls for select to authenticated using (public.can_read_post(post_id));
drop policy if exists polls_insert on public.post_polls;
create policy polls_insert on public.post_polls for insert to authenticated with check (public.is_my_post(post_id));
drop policy if exists poll_options_read on public.poll_options;
create policy poll_options_read on public.poll_options for select to authenticated using (public.can_read_post(post_id));
drop policy if exists poll_options_insert on public.poll_options;
create policy poll_options_insert on public.poll_options for insert to authenticated
  with check (public.is_my_post(post_id) and not exists (select 1 from public.poll_votes v where v.post_id = poll_options.post_id));
-- Ses propres votes uniquement (personne ne voit qui a voté quoi)
drop policy if exists poll_votes_own on public.poll_votes;
create policy poll_votes_own on public.poll_votes for select to authenticated using (user_id = auth.uid());

create or replace function public.poll_option_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.poll_options where post_id = new.post_id) >= 6 then
    raise exception '6 choix au plus dans un sondage' using errcode = 'P0001';
  end if;
  if public.community_text_needs_review(new.label) then raise exception 'Retirez les informations personnelles du choix' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists poll_options_limit on public.poll_options;
create trigger poll_options_limit before insert on public.poll_options for each row execute function public.poll_option_limit();

create or replace function public.vote_poll(p_post uuid, p_options uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare v public.post_polls; v_n int;
begin
  if not public.can_read_post(p_post) then raise exception 'Sondage introuvable' using errcode = 'P0001'; end if;
  select * into v from public.post_polls where post_id = p_post;
  if v.post_id is null then raise exception 'Sondage introuvable' using errcode = 'P0001'; end if;
  if v.closes_at is not null and v.closes_at < now() then raise exception 'Ce sondage est terminé' using errcode = 'P0001'; end if;
  if (select group_id from public.posts where id = p_post) is not null and not public.is_group_member((select group_id from public.posts where id = p_post)) then
    raise exception 'Rejoignez ce groupe pour voter' using errcode = '42501';
  end if;
  v_n := coalesce(array_length(p_options, 1), 0);
  if v_n = 0 then delete from public.poll_votes where post_id = p_post and user_id = auth.uid(); return; end if;
  if not v.multiple and v_n > 1 then raise exception 'Un seul choix possible' using errcode = 'P0001'; end if;
  if exists (select 1 from unnest(p_options) o where o not in (select id from public.poll_options where post_id = p_post)) then
    raise exception 'Choix inconnu' using errcode = 'P0001';
  end if;
  delete from public.poll_votes where post_id = p_post and user_id = auth.uid();
  insert into public.poll_votes (post_id, option_id, user_id) select p_post, o, auth.uid() from unnest(p_options) o;
end $$;
revoke execute on function public.vote_poll(uuid, uuid[]) from public, anon;
grant execute on function public.vote_poll(uuid, uuid[]) to authenticated;

create or replace function public.poll_summary(p_post uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when pp.post_id is null then null else jsonb_build_object(
    'multiple', pp.multiple, 'closes_at', pp.closes_at, 'closed', pp.closes_at is not null and pp.closes_at < now(),
    'total', (select count(distinct v.user_id) from public.poll_votes v where v.post_id = pp.post_id),
    'options', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label,
                  'votes', (select count(*) from public.poll_votes v where v.option_id = o.id),
                  'mine', exists (select 1 from public.poll_votes v where v.option_id = o.id and v.user_id = auth.uid())) order by o.position), '[]')
                from public.poll_options o where o.post_id = pp.post_id)) end
  from (select 1) one left join public.post_polls pp on pp.post_id = p_post;
$$;
revoke execute on function public.poll_summary(uuid) from public, anon;

-- ---------------------------------------------------------------------
-- 5. Enregistrements : dossiers (Premium) ; sujets consultés (privés) ; activité
-- ---------------------------------------------------------------------
create table if not exists public.saved_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.saved_folders enable row level security;
drop policy if exists saved_folders_own on public.saved_folders;
create policy saved_folders_own on public.saved_folders for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.saved_posts add column if not exists folder_id uuid references public.saved_folders(id) on delete set null;

create or replace function public.saved_folders_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_premium('saved_folders');
  if (select count(*) from public.saved_folders where user_id = new.user_id) >= public.plan_limit('saved_folders_count', new.user_id) then
    raise exception 'Limite de dossiers atteinte' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists saved_folders_premium on public.saved_folders;
create trigger saved_folders_premium before insert on public.saved_folders for each row execute function public.saved_folders_premium();

-- Ranger dans un dossier : Premium ; retirer d'un dossier reste toujours possible
create or replace function public.saved_posts_folder()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.folder_id is not null and new.folder_id is distinct from (case when tg_op = 'UPDATE' then old.folder_id else null end) then
    perform public.assert_premium('saved_folders');
    if not exists (select 1 from public.saved_folders where id = new.folder_id and user_id = new.user_id) then
      raise exception 'Dossier introuvable' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists saved_posts_folder on public.saved_posts;
create trigger saved_posts_folder before insert or update of folder_id on public.saved_posts for each row execute function public.saved_posts_folder();

-- Sujets consultés : servent UNIQUEMENT à classer « Pour vous » ; visibles et effaçables par la personne seule
create table if not exists public.community_topic_views (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  forum_id uuid not null references public.forums(id) on delete cascade,
  views int not null default 0,
  last_at timestamptz not null default now(),
  primary key (user_id, forum_id)
);
alter table public.community_topic_views enable row level security;
drop policy if exists topic_views_own_read on public.community_topic_views;
create policy topic_views_own_read on public.community_topic_views for select to authenticated using (user_id = auth.uid());
drop policy if exists topic_views_own_delete on public.community_topic_views;
create policy topic_views_own_delete on public.community_topic_views for delete to authenticated using (user_id = auth.uid());

create or replace function public.note_topic_view(p_post uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_forum uuid;
begin
  if auth.uid() is null or not public.can_read_post(p_post) then return; end if;
  select forum_id into v_forum from public.posts where id = p_post;
  insert into public.community_topic_views (user_id, forum_id, views, last_at) values (auth.uid(), v_forum, 1, now())
  on conflict (user_id, forum_id) do update set views = least(public.community_topic_views.views + 1, 10000), last_at = now();
end $$;
revoke execute on function public.note_topic_view(uuid) from public, anon;
grant execute on function public.note_topic_view(uuid) to authenticated;

-- Journal d'activité (Premium) : chronologie de mes publications, réponses, réactions et enregistrements.
-- Les listes « Publications », « Réponses », « Aimées » et « Enregistrées » restent complètes et gratuites.
create or replace function public.my_community_activity(p_before timestamptz default null, p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_before timestamptz := coalesce(p_before, now() + interval '1 minute');
begin
  perform public.assert_premium('community_history');
  return (select coalesce(jsonb_agg(a order by a.at desc), '[]') from (
    select * from (
      select 'post' as kind, p.created_at as at, p.id as post_id, coalesce(p.title, left(p.body, 90)) as label from public.posts p where p.author_id = v_uid and p.created_at < v_before
      union all
      select 'comment', c.created_at, c.post_id, left(c.body, 90) from public.comments c where c.author_id = v_uid and c.created_at < v_before
      union all
      select 'like', l.created_at, l.post_id, coalesce(p.title, left(p.body, 90)) from public.post_likes l join public.posts p on p.id = l.post_id where l.user_id = v_uid and l.created_at < v_before
      union all
      select 'save', s.created_at, s.post_id, coalesce(p.title, left(p.body, 90)) from public.saved_posts s join public.posts p on p.id = s.post_id where s.user_id = v_uid and s.created_at < v_before
    ) u order by at desc limit least(greatest(coalesce(p_limit, 50), 1), 200)) a);
end $$;
revoke execute on function public.my_community_activity(timestamptz, int) from public, anon;
grant execute on function public.my_community_activity(timestamptz, int) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Albums photo (Premium) : privés ou partagés avec des membres choisis
-- ---------------------------------------------------------------------
create table if not exists public.community_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  description text check (description is null or char_length(description) <= 400),
  created_at timestamptz not null default now()
);
create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.community_albums(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null unique check (path ~ '^[0-9a-f-]{36}/album-[A-Za-z0-9_.-]{1,80}$'),
  width int check (width between 1 and 8000),
  height int check (height between 1 and 8000),
  created_at timestamptz not null default now()
);
create table if not exists public.album_shares (
  album_id uuid not null references public.community_albums(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (album_id, user_id)
);
alter table public.community_albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.album_shares enable row level security;

create or replace function public.can_read_album(p_album uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_albums a where a.id = p_album and auth.uid() is not null and (
    a.owner_id = auth.uid()
    or (exists (select 1 from public.album_shares s where s.album_id = a.id and s.user_id = auth.uid()) and not public.is_blocked_between(a.owner_id, auth.uid()))));
$$;
drop policy if exists albums_read on public.community_albums;
create policy albums_read on public.community_albums for select to authenticated using (public.can_read_album(id));
drop policy if exists albums_insert on public.community_albums;
create policy albums_insert on public.community_albums for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists albums_update on public.community_albums;
create policy albums_update on public.community_albums for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists albums_delete on public.community_albums;
create policy albums_delete on public.community_albums for delete to authenticated using (owner_id = auth.uid());
drop policy if exists album_photos_read on public.album_photos;
create policy album_photos_read on public.album_photos for select to authenticated using (public.can_read_album(album_id));
drop policy if exists album_photos_insert on public.album_photos;
create policy album_photos_insert on public.album_photos for insert to authenticated
  with check (owner_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text
              and exists (select 1 from public.community_albums a where a.id = album_id and a.owner_id = auth.uid()));
drop policy if exists album_photos_delete on public.album_photos;
create policy album_photos_delete on public.album_photos for delete to authenticated using (owner_id = auth.uid());
-- Partages : la propriétaire voit la liste ; la personne invitée voit sa propre ligne et peut se retirer
drop policy if exists album_shares_read on public.album_shares;
create policy album_shares_read on public.album_shares for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.community_albums a where a.id = album_id and a.owner_id = auth.uid()));
drop policy if exists album_shares_delete on public.album_shares;
create policy album_shares_delete on public.album_shares for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.community_albums a where a.id = album_id and a.owner_id = auth.uid()));

create or replace function public.albums_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_premium('community_albums');
  if tg_table_name = 'community_albums' then
    if (select count(*) from public.community_albums where owner_id = new.owner_id) >= public.plan_limit('albums_count', new.owner_id) then
      raise exception 'Limite d''albums atteinte' using errcode = 'P0001', hint = 'premium_required';
    end if;
  else
    if (select count(*) from public.album_photos ap where ap.album_id = (to_jsonb(new) ->> 'album_id')::uuid) >= 200 then
      raise exception '200 photos au plus par album' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists community_albums_premium on public.community_albums;
create trigger community_albums_premium before insert on public.community_albums for each row execute function public.albums_premium();
drop trigger if exists album_photos_premium on public.album_photos;
create trigger album_photos_premium before insert on public.album_photos for each row execute function public.albums_premium();

create or replace function public.share_album(p_album uuid, p_handle text)
returns void language plpgsql security definer set search_path = public as $$
declare v_target uuid; v_title text;
begin
  select title into v_title from public.community_albums where id = p_album and owner_id = auth.uid();
  if v_title is null then raise exception 'Album introuvable' using errcode = '42501'; end if;
  perform public.assert_premium('community_albums');
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = auth.uid() then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  if public.is_blocked_between(v_target, auth.uid()) then raise exception 'Impossible de partager avec ce membre' using errcode = '42501'; end if;
  if (select count(*) from public.album_shares where album_id = p_album) >= 30 then raise exception '30 personnes au plus par album' using errcode = 'P0001'; end if;
  insert into public.album_shares (album_id, user_id) values (p_album, v_target) on conflict do nothing;
  if found then
    perform public.community_notify(v_target, 'group_invite', 'community_group',
      (select pseudonym from public.community_profiles where user_id = auth.uid()) || ' partage un album avec vous : « ' || v_title || ' »',
      null, '/community/album/' || p_album, jsonb_build_object('album_id', p_album));
  end if;
end $$;

create or replace function public.my_albums()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'description', a.description, 'created_at', a.created_at,
           'is_mine', a.owner_id = auth.uid(),
           'owner_handle', (select handle from public.community_profiles where user_id = a.owner_id),
           'owner_pseudonym', (select pseudonym from public.community_profiles where user_id = a.owner_id),
           'photo_count', (select count(*) from public.album_photos ph where ph.album_id = a.id),
           'cover', (select ph.path from public.album_photos ph where ph.album_id = a.id order by ph.created_at limit 1),
           'shared_with', case when a.owner_id = auth.uid() then (select coalesce(jsonb_agg(cp.handle order by cp.handle), '[]')
              from public.album_shares s join public.community_profiles cp on cp.user_id = s.user_id where s.album_id = a.id) else null end)
         order by a.created_at desc), '[]')
  from public.community_albums a where public.can_read_album(a.id);
$$;
revoke execute on function public.share_album(uuid, text), public.my_albums() from public, anon;
grant execute on function public.share_album(uuid, text), public.my_albums() to authenticated;

-- Stockage : photos d'albums lisibles par la propriétaire et les personnes avec qui l'album est partagé
create or replace function public.community_object_readable(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    split_part(p_name, '/', 1) = auth.uid()::text
    or exists (select 1 from public.community_profiles where avatar_path = p_name)
    or exists (select 1 from public.post_photos ph where ph.path = p_name and public.can_read_post(ph.post_id))
    or exists (select 1 from public.album_photos ap where ap.path = p_name and public.can_read_album(ap.album_id)));
$$;

-- ---------------------------------------------------------------------
-- 7. Ateliers et rencontres (Premium) : programmés par l'équipe ; lien transmis aux inscrit·es seulement
-- ---------------------------------------------------------------------
create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text,
  kind text not null default 'atelier' check (kind in ('atelier', 'rencontre')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  premium_only boolean not null default true,
  join_url text,
  capacity int check (capacity is null or capacity > 0),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.event_registrations (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.community_events enable row level security;
alter table public.event_registrations enable row level security;
drop policy if exists events_read on public.community_events;
create policy events_read on public.community_events for select to authenticated using (not archived or public.has_role('admin'));
drop policy if exists events_admin on public.community_events;
create policy events_admin on public.community_events for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
revoke select on public.community_events from anon, authenticated;
grant select (id, title, description, kind, starts_at, ends_at, premium_only, capacity, archived, created_at) on public.community_events to authenticated;
drop policy if exists event_reg_own on public.event_registrations;
create policy event_reg_own on public.event_registrations for select to authenticated using (user_id = auth.uid());
drop policy if exists event_reg_insert on public.event_registrations;
create policy event_reg_insert on public.event_registrations for insert to authenticated with check (user_id = auth.uid());
drop policy if exists event_reg_delete on public.event_registrations;
create policy event_reg_delete on public.event_registrations for delete to authenticated using (user_id = auth.uid());

create or replace function public.event_registration_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare e public.community_events;
begin
  select * into e from public.community_events where id = new.event_id;
  if e.id is null or e.archived or e.starts_at < now() then raise exception 'Inscription impossible' using errcode = 'P0001'; end if;
  if e.premium_only then perform public.assert_premium('community_events'); end if;
  if e.capacity is not null and (select count(*) from public.event_registrations where event_id = e.id) >= e.capacity then
    raise exception 'Cet atelier est complet' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists event_registration_guard on public.event_registrations;
create trigger event_registration_guard before insert on public.event_registrations for each row execute function public.event_registration_guard();

create or replace function public.event_join_link(p_event uuid)
returns text language sql stable security definer set search_path = public as $$
  select e.join_url from public.community_events e
  where e.id = p_event and exists (select 1 from public.event_registrations r where r.event_id = e.id and r.user_id = auth.uid());
$$;
revoke execute on function public.event_join_link(uuid) from public, anon;
grant execute on function public.event_join_link(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Notifications : nouveaux types (désactivables séparément) ; résumé du matin et du soir
-- ---------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_category_check;
alter table public.notifications add constraint notifications_category_check
  check (category in ('reminder','community_reply','community_comment','community_like','community_saved','community_moderation',
                      'community_follow','community_mention','community_group',
                      'assistant','subscription','product_recall','system','family'));

alter table public.community_notification_prefs
  add column if not exists mention boolean not null default true,
  add column if not exists new_follower boolean not null default true,
  add column if not exists followed_post boolean not null default false,
  add column if not exists group_activity boolean not null default true,
  add column if not exists group_invite boolean not null default true;

create or replace function public.community_notify(p_user uuid, p_kind text, p_category text, p_title text, p_body text, p_link text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_on boolean;
begin
  if p_user is null then return; end if;
  select case p_kind when 'post_comment' then post_comment when 'comment_reply' then comment_reply when 'reaction' then reaction
                     when 'saved_reply' then saved_reply when 'moderation' then moderation when 'mention' then mention
                     when 'new_follower' then new_follower when 'followed_post' then followed_post
                     when 'group_activity' then group_activity when 'group_invite' then group_invite else true end
    into v_on from public.community_notification_prefs where user_id = p_user;
  -- Valeur par défaut d'un type jamais réglé : activé, sauf les nouvelles publications des membres suivis (trop fréquentes)
  if coalesce(v_on, p_kind <> 'followed_post') then
    insert into public.notifications(user_id, category, title, body, deep_link, payload) values (p_user, p_category, p_title, p_body, p_link, p_payload);
  end if;
end $$;
revoke execute on function public.community_notify(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;

create table if not exists public.daily_digest_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  morning boolean not null default false,
  morning_time time not null default '08:00',
  evening boolean not null default false,
  evening_time time not null default '20:30',
  question boolean not null default true,
  hidden_items text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (hidden_items <@ array['events','sleep','bottle','pregnancy','groups','replies','recipes','articles','question']::text[])
);
alter table public.daily_digest_prefs enable row level security;
drop policy if exists digest_own on public.daily_digest_prefs;
create policy digest_own on public.daily_digest_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mentions @identifiant (5 au plus par texte) : la personne mentionnée doit pouvoir lire la publication
create or replace function public.community_mentioned(p_text text)
returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct m[2]), '{}') from (
    select regexp_matches(lower(coalesce(p_text, '')), '(^|[^a-z0-9_@])@([a-z0-9_]{3,20})', 'g') as m limit 5) x;
$$;

create or replace function public.notify_mentions(p_author uuid, p_post uuid, p_comment uuid, p_text text, p_skip uuid[])
returns uuid[] language plpgsql security definer set search_path = public as $$
declare v_handle text; v_user uuid; v_post public.posts; v_done uuid[] := coalesce(p_skip, '{}');
begin
  select * into v_post from public.posts where id = p_post;
  foreach v_handle in array public.community_mentioned(p_text) loop
    select user_id into v_user from public.community_profiles where handle = v_handle;
    if v_user is null or v_user = any(v_done) or public.is_blocked_between(v_user, p_author) then continue; end if;
    if v_post.group_id is not null and not public.is_group_member(v_post.group_id, v_user) then continue; end if;
    perform public.community_notify(v_user, 'mention', 'community_mention',
      public.community_actor_label(p_author, p_post) || ' vous a mentionné·e', left(p_text, 120),
      '/community/post/' || p_post || coalesce('?comment=' || p_comment, ''), jsonb_build_object('post_id', p_post, 'comment_id', p_comment));
    v_done := v_done || v_user;
  end loop;
  return v_done;
end $$;
revoke execute on function public.notify_mentions(uuid, uuid, uuid, text, uuid[]) from public, anon, authenticated;

-- Nouvelle publication : mentions, membres qui me suivent (jamais pour une publication anonyme), groupe privé
create or replace function public.on_post_social()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_done uuid[]; v_user uuid; v_who text; v_group public.community_groups; v_link text := '/community/post/' || new.id;
begin
  if new.status <> 'visible' then return new; end if;
  v_done := public.notify_mentions(new.author_id, new.id, null, coalesce(new.title, '') || ' ' || new.body, array[new.author_id]);
  v_who := (select pseudonym from public.community_profiles where user_id = new.author_id);
  if new.group_id is not null then
    select * into v_group from public.community_groups where id = new.group_id;
  end if;
  if not new.anonymous and (v_group.id is null or v_group.kind <> 'private') then
    for v_user in select follower_id from public.member_follows where followee_id = new.author_id loop
      if v_user = any(v_done) or public.is_blocked_between(v_user, new.author_id) then continue; end if;
      perform public.community_notify(v_user, 'followed_post', 'community_follow', v_who || ' a publié', left(coalesce(new.title, new.body), 120), v_link,
        jsonb_build_object('post_id', new.id));
      v_done := v_done || v_user;
    end loop;
  end if;
  -- Groupe privé : une notification par membre et par groupe toutes les 6 heures au plus
  if v_group.kind = 'private' then
    for v_user in select user_id from public.group_members where group_id = v_group.id loop
      if v_user = any(v_done) or public.is_blocked_between(v_user, new.author_id) then continue; end if;
      if exists (select 1 from public.notifications where user_id = v_user and category = 'community_group'
                 and payload ->> 'group_id' = v_group.id::text and payload ? 'post_id' and created_at > now() - interval '6 hours') then continue; end if;
      perform public.community_notify(v_user, 'group_activity', 'community_group', 'Nouvelle publication dans « ' || v_group.name || ' »',
        left(coalesce(new.title, new.body), 120), v_link, jsonb_build_object('post_id', new.id, 'group_id', v_group.id));
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists posts_social on public.posts;
create trigger posts_social after insert on public.posts for each row execute function public.on_post_social();

-- Commentaire : reprend la v2 + mentions
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
  v_done := public.notify_mentions(new.author_id, new.post_id, new.id, new.body, v_done);
  for v_saver in select user_id from public.saved_posts where post_id = new.post_id loop
    if not v_saver = any(v_done) and not public.is_blocked_between(v_saver, new.author_id) then
      perform public.community_notify(v_saver, 'saved_reply', 'community_saved', 'Nouvelle réponse dans une publication enregistrée',
        left(new.body, 120), v_link, jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
    end if;
  end loop;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 9. Fils de lecture : groupes, épinglage, sondage, badge, « je suis cette personne »
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
         p.search,
         p.group_id, g.name as group_name, g.kind as group_kind, p.pinned_at,
         -- Abonnement à l'autrice : jamais pour une publication anonyme (sinon l'anonymat serait levé)
         (not p.anonymous and exists (select 1 from public.member_follows mf where mf.follower_id = auth.uid() and mf.followee_id = p.author_id)) as following_author,
         case when p.anonymous then false else public.premium_badge(p.author_id) end as author_badge,
         case when p.anonymous then null else cp.accent end as author_accent,
         (select s.folder_id from public.saved_posts s where s.post_id = p.id and s.user_id = auth.uid()) as saved_folder_id,
         case when exists (select 1 from public.post_polls pp where pp.post_id = p.id) then public.poll_summary(p.id) else null end as poll
  from public.posts p
  left join public.community_profiles cp on cp.user_id = p.author_id
  left join public.forums f on f.id = p.forum_id
  left join public.community_groups g on g.id = p.group_id
  where auth.uid() is not null
    and (p.group_id is null or public.can_see_group(p.group_id) or p.author_id = auth.uid())
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
         p.title as post_title, left(p.body, 140) as post_excerpt,
         case when p.anonymous and c.author_id = p.author_id then false else public.premium_badge(c.author_id) end as author_badge
  from public.comments c
  join public.posts p on p.id = c.post_id
  left join public.community_profiles cp on cp.user_id = c.author_id
  where auth.uid() is not null
    and (p.group_id is null or public.can_see_group(p.group_id) or p.author_id = auth.uid() or c.author_id = auth.uid())
    and ((c.status = 'visible' and not public.is_blocked_between(c.author_id, auth.uid())
          and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator')))
         or c.author_id = auth.uid() or public.has_role('moderator'));

revoke all on public.forum_feed, public.comment_feed from anon;
grant select on public.forum_feed, public.comment_feed to authenticated;

-- Recherche simple (gratuite) : texte, catégorie
create or replace function public.search_posts(p_query text, p_forum uuid default null, p_limit int default 50)
returns setof public.forum_feed language sql stable security invoker set search_path = public as $$
  select f.* from public.forum_feed f
  where f.status = 'visible'
    and (f.group_kind is null or f.group_kind <> 'private')
    and (p_forum is null or f.forum_id = p_forum)
    and char_length(trim(coalesce(p_query, ''))) >= 2
    and (f.search @@ websearch_to_tsquery('french', p_query)
         or coalesce(f.title, '') ilike '%' || trim(p_query) || '%'
         or f.body ilike '%' || trim(p_query) || '%')
  order by ts_rank(f.search, websearch_to_tsquery('french', p_query)) desc, f.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- Recherche avancée (Premium) : plusieurs catégories, type, photos, période, sans réponse, membre, groupe
create or replace function public.search_posts_advanced(p_query text default null, p_forums uuid[] default null, p_kind text default null,
  p_with_photos boolean default false, p_since timestamptz default null, p_unanswered boolean default false, p_handle text default null,
  p_group uuid default null, p_limit int default 50)
returns setof public.forum_feed language plpgsql stable security invoker set search_path = public as $$
begin
  perform public.assert_premium('community_search');
  return query select f.* from public.forum_feed f
  where f.status = 'visible'
    and (p_group is not null and f.group_id = p_group or p_group is null and (f.group_kind is null or f.group_kind <> 'private'))
    and (p_forums is null or cardinality(p_forums) = 0 or f.forum_id = any(p_forums))
    and (p_kind is null or (p_kind = 'poll' and f.poll is not null) or (p_kind in ('question', 'testimony') and f.kind = p_kind and f.poll is null))
    and (not coalesce(p_with_photos, false) or jsonb_array_length(f.photos) > 0)
    and (p_since is null or f.created_at >= p_since)
    and (not coalesce(p_unanswered, false) or f.comment_count = 0)
    and (p_handle is null or f.author_handle = lower(trim(leading '@' from trim(p_handle))))
    and (char_length(trim(coalesce(p_query, ''))) < 2
         or f.search @@ websearch_to_tsquery('french', p_query)
         or coalesce(f.title, '') ilike '%' || trim(p_query) || '%'
         or f.body ilike '%' || trim(p_query) || '%')
  order by f.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end $$;
revoke execute on function public.search_posts(text, uuid, int), public.search_posts_advanced(text, uuid[], text, boolean, timestamptz, boolean, text, uuid, int) from public, anon;
grant execute on function public.search_posts(text, uuid, int), public.search_posts_advanced(text, uuid[], text, boolean, timestamptz, boolean, text, uuid, int) to authenticated;

-- ---------------------------------------------------------------------
-- 10. Profils : abonnements, personnalisation, badge (sans nombre d'abonné·es public)
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
    'accent', v.accent, 'banner', v.banner, 'about', v.about, 'show_premium_badge', v.show_premium_badge,
    'premium', public.has_premium(v_uid), 'premium_badge', public.premium_badge(v_uid),
    'posts_count', (select count(*) from public.posts where author_id = v_uid and status <> 'removed'),
    'comments_count', (select count(*) from public.comments where author_id = v_uid and status <> 'removed'),
    'photos_count', (select count(*) from public.post_photos where author_id = v_uid),
    'likes_count', (select count(*) from public.post_likes where user_id = v_uid),
    'saved_count', (select count(*) from public.saved_posts where user_id = v_uid),
    'following_count', (select count(*) from public.member_follows where follower_id = v_uid),
    -- Visible par la personne SEULE (jamais affiché sur son profil public)
    'followers_count', (select count(*) from public.member_follows where followee_id = v_uid));
end $$;

create or replace function public.community_member(p_handle text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v public.community_profiles; v_uid uuid := auth.uid(); v_out jsonb;
begin
  if v_uid is null then return null; end if;
  select * into v from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v.user_id is null then return null; end if;
  if v.user_id <> v_uid and exists (select 1 from public.user_blocks where blocker_id = v.user_id and blocked_id = v_uid) then
    return jsonb_build_object('handle', v.handle, 'pseudonym', v.pseudonym, 'unavailable', true, 'is_me', false, 'blocked', false);
  end if;
  v_out := jsonb_build_object('handle', v.handle, 'pseudonym', v.pseudonym, 'avatar_path', v.avatar_path, 'avatar_preset', v.avatar_preset,
    'is_me', v.user_id = v_uid, 'blocked', exists (select 1 from public.user_blocks where blocker_id = v_uid and blocked_id = v.user_id),
    'is_following', exists (select 1 from public.member_follows where follower_id = v_uid and followee_id = v.user_id),
    'premium_badge', public.premium_badge(v.user_id), 'accent', v.accent, 'banner', v.banner,
    'visibility', v.visibility, 'unavailable', false);
  if v.visibility = 'members' or v.user_id = v_uid then
    v_out := v_out || jsonb_build_object('bio', v.bio, 'about', v.about, 'journey_label', v.journey_label,
      'joined_month', to_char(date_trunc('month', v.created_at), 'YYYY-MM'),
      'posts_count', (select count(*) from public.posts p where p.author_id = v.user_id and p.status = 'visible' and not p.anonymous
                        and (p.group_id is null or public.can_see_group(p.group_id))),
      'comments_count', (select count(*) from public.comments c join public.posts p on p.id = c.post_id
                         where c.author_id = v.user_id and c.status = 'visible' and not (p.anonymous and p.author_id = c.author_id)
                           and (p.group_id is null or public.can_see_group(p.group_id))),
      'photos_count', (select count(*) from public.post_photos ph join public.posts p on p.id = ph.post_id
                       where p.author_id = v.user_id and p.status = 'visible' and not p.anonymous and (p.group_id is null or public.can_see_group(p.group_id))));
  end if;
  return v_out;
end $$;

-- ---------------------------------------------------------------------
-- 11. Blocage : arrête aussi les abonnements et les partages d'albums
-- ---------------------------------------------------------------------
create or replace function public.on_block_unfollow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.member_follows where (follower_id = new.blocker_id and followee_id = new.blocked_id) or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  delete from public.album_shares s using public.community_albums a
   where s.album_id = a.id and ((a.owner_id = new.blocker_id and s.user_id = new.blocked_id) or (a.owner_id = new.blocked_id and s.user_id = new.blocker_id));
  return new;
end $$;
drop trigger if exists user_blocks_unfollow on public.user_blocks;
create trigger user_blocks_unfollow after insert on public.user_blocks for each row execute function public.on_block_unfollow();

-- ---------------------------------------------------------------------
-- 12. Export RGPD : abonnements, groupes, sondages, albums, dossiers, sujets consultés, réglages
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v12;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  return public._export_my_data_v12() || jsonb_build_object(
    'community_following', public.my_follows(),
    'community_forum_subscriptions', (select coalesce(jsonb_agg(jsonb_build_object('forum', f.slug, 'since', s.created_at)), '[]')
                                       from public.forum_subscriptions s join public.forums f on f.id = s.forum_id where s.user_id = v_uid),
    'community_groups', (select coalesce(jsonb_agg(jsonb_build_object('group', g.name, 'kind', g.kind, 'role', m.role, 'joined_at', m.joined_at)), '[]')
                         from public.group_members m join public.community_groups g on g.id = m.group_id where m.user_id = v_uid),
    'community_poll_votes', (select coalesce(jsonb_agg(jsonb_build_object('post_id', v.post_id, 'option', o.label, 'at', v.created_at)), '[]')
                             from public.poll_votes v join public.poll_options o on o.id = v.option_id where v.user_id = v_uid),
    'community_albums', (select coalesce(jsonb_agg(jsonb_build_object('title', a.title, 'created_at', a.created_at,
                           'photos', (select coalesce(jsonb_agg(ph.path), '[]') from public.album_photos ph where ph.album_id = a.id))), '[]')
                         from public.community_albums a where a.owner_id = v_uid),
    'community_saved_folders', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'created_at', created_at)), '[]') from public.saved_folders where user_id = v_uid),
    'community_topic_views', (select coalesce(jsonb_agg(jsonb_build_object('forum', f.slug, 'views', t.views, 'last_at', t.last_at)), '[]')
                              from public.community_topic_views t join public.forums f on f.id = t.forum_id where t.user_id = v_uid),
    'daily_digest_prefs', (select to_jsonb(d) from public.daily_digest_prefs d where user_id = v_uid),
    'community_event_registrations', (select coalesce(jsonb_agg(jsonb_build_object('event', e.title, 'starts_at', e.starts_at)), '[]')
                                      from public.event_registrations r join public.community_events e on e.id = r.event_id where r.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_v12() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- ---------------------------------------------------------------------
-- 13. Quota mensuel des résumés et traductions (fonction community-ai, Premium)
-- ---------------------------------------------------------------------
create or replace function public.consume_feature_quota(p_key text)
returns table(allowed boolean, used int, quota int)
language plpgsql security definer set search_path = public as $$
declare v_month date := date_trunc('month', now())::date; v_quota int; v_used int;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_key not in ('voice_entries_per_month', 'summary_exports_per_month', 'community_ai_per_month') then raise exception 'Quota inconnu' using errcode = '22023'; end if;
  v_quota := public.plan_limit(p_key, auth.uid());
  insert into public.feature_usage (user_id, feature, month, used) values (auth.uid(), p_key, v_month, 0) on conflict do nothing;
  update public.feature_usage f set used = f.used + 1
   where f.user_id = auth.uid() and f.feature = p_key and f.month = v_month and f.used < v_quota
   returning f.used into v_used;
  if v_used is null then
    select f.used into v_used from public.feature_usage f where f.user_id = auth.uid() and f.feature = p_key and f.month = v_month;
    return query select false, v_used, v_quota;
  else
    return query select true, v_used, v_quota;
  end if;
end $$;
revoke execute on function public.consume_feature_quota(text) from public, anon;
grant execute on function public.consume_feature_quota(text) to authenticated;
