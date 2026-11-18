-- =====================================================================
-- Espace Nounou (21/11/2026) — carnet de liaison, photos privées, messagerie parents–nounou
-- Doc : docs/ESPACE_NOUNOU.md ; tests : supabase/tests/sql/98zb_espace_nounou.sql
--
-- ADDITIF ET IDEMPOTENT : nouvelles tables, colonnes NULLABLES, politiques, fonctions. Aucune donnée réécrite.
--
-- Principes :
--  1. Le carnet n'est PAS une copie : biberons, repas, siestes, changes et observations de la nounou sont des lignes
--     des tables de suivi existantes (bottles, meals, sleeps, diapers, child_observations). Chaque ligne porte déjà
--     son enfant, sa date et son auteur (created_by, forcé par _keep_author) ; on ajoute ORIGIN (parent / nounou /
--     garde), posé par le serveur (une nounou ne peut pas se déclarer « parent »). Activités, arrivée et départ
--     n'avaient pas de table : childcare_events (mêmes règles que le suivi, domaine « daily »).
--  2. Invitation : on RÉUTILISE household_invitations et accept_household_invitation (parcours du co-parent
--     inchangé). Une invitation de nounou est créée avec child_scope = '{}' : l'accepter ne montre AUCUN enfant.
--     Le lien (childcare_links) passe « acceptée » ; un parent CONFIRME (childcare_confirm) : l'enfant entre alors
--     dans le périmètre de la nounou et toute la RLS existante (domaines + enfants autorisés) s'applique.
--     Révocation (childcare_revoke) : l'enfant sort du périmètre à la seconde ; plus aucun enfant = membre retiré.
--  3. Photos : seulement si un responsable légal l'a autorisé (childcare_settings.photos_allowed, faux par défaut,
--     horodaté, journalisé dans childcare_consents) ; écriture refusée par la base sinon. Fichiers dans le bucket
--     privé existant « child-photos » (même chemin <foyer>/<enfant>/<uuid>.jpg que l'album : « ajouter aux souvenirs »
--     réutilise le fichier sans copie). Lecture : parents de l'enfant, et l'auteure tant que son accès est actif.
--     Un fichier encore référencé (garde ou album) n'est jamais effacé.
--  4. Messagerie : fil texte par enfant gardé, participants seulement ; AUCUN accusé de lecture, aucun « en ligne »,
--     aucun « vu à » (aucune colonne pour cela, vérifié par les tests).
--  5. Notifications : texte neutre, jamais d'image, jamais de contenu ; prénom ou « bébé » selon la discrétion.
--  6. Conservation des photos configurable (30 jours / 1 an / jusqu'à suppression) : childcare_purge_expired()
--     (à planifier côté serveur) et childcare_purge_now() appelée à l'ouverture de l'espace par un parent.
--
-- Aucune reconnaissance faciale, aucune analyse d'image, aucun usage d'entraînement : la base ne stocke que le
-- fichier, la légende saisie et la réponse déclarée « un seul enfant sur la photo ».
--
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 0. Parent d'un enfant (responsable légal dans l'app)
-- Propriétaire ou co-parent du foyer de l'enfant, avec accès à cet enfant. Personne connectée seulement.
create or replace function public._is_parent_of(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.children c
    join public.household_members m on m.household_id = c.household_id and m.user_id = auth.uid()
    where c.id = p_child and m.role in ('owner', 'coparent')
      and public._member_child_allowed(m.role, m.child_scope, p_child));
$$;
revoke execute on function public._is_parent_of(uuid) from public, anon;
grant execute on function public._is_parent_of(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- 1. Origine des saisies (tables de suivi existantes)
do $$
declare t text;
begin
  foreach t in array array['bottles','breastfeeds','meals','sleeps','diapers','child_observations','child_wellbeing'] loop
    execute format('alter table public.%I add column if not exists origin text', t);
    if not exists (select 1 from pg_constraint where conname = t || '_origin_check' and conrelid = ('public.' || t)::regclass) then
      execute format('alter table public.%I add constraint %I check (origin is null or origin in (''parent'',''caregiver'',''custody''))', t, t || '_origin_check');
    end if;
  end loop;
end $$;

-- Repas : quantité APPROXIMATIVE mangée, telle qu'observée (aucun calcul)
alter table public.meals add column if not exists eaten_amount text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'meals_eaten_amount_check') then
    alter table public.meals add constraint meals_eaten_amount_check check (eaten_amount is null or eaten_amount in ('none','little','half','most','all'));
  end if;
end $$;

-- Observation de la nounou : humeur observée, difficulté, information à transmettre, information importante.
-- La température reste kind = 'temperature' (valeur MESURÉE, aucune interprétation).
alter table public.child_observations add column if not exists mood text;
alter table public.child_observations add column if not exists difficulty text;
alter table public.child_observations add column if not exists to_share text;
alter table public.child_observations add column if not exists important boolean;
alter table public.child_observations add column if not exists important_kind text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'child_observations_childcare_check') then
    alter table public.child_observations add constraint child_observations_childcare_check check (
      (mood is null or mood in ('calm','happy','tired','fussy','sad','other'))
      and (difficulty is null or char_length(difficulty) <= 300)
      and (to_share is null or char_length(to_share) <= 1000)
      and (important_kind is null or important_kind in ('incident','behavior','meal_refused','temperature','contact_parents','other'))
      and (important_kind is null or important is true));
  end if;
end $$;

-- ---------------------------------------------------------------- 2. Activités, arrivée, départ (nouvelle table)
create table if not exists public.childcare_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('activity','arrival','departure')),
  activity_type text check (activity_type is null or activity_type in ('outdoor','play','reading','music','motor','creative','calm','other')),
  at timestamptz not null,
  note text check (note is null or char_length(note) <= 1000),
  origin text check (origin is null or origin in ('parent','caregiver','custody')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind = 'activity' or activity_type is null),
  check (at >= timestamptz '2000-01-01' and at < timestamptz '2100-01-01')
);
create index if not exists childcare_events_child_at_idx on public.childcare_events(child_id, at desc);
create index if not exists childcare_events_household_idx on public.childcare_events(household_id);
create index if not exists childcare_events_created_by_idx on public.childcare_events(created_by);
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'childcare_events' and policyname = 'childcare_events_sel') then
    perform public._apply_household_policies('childcare_events', 'daily');
  end if;
end $$;
drop policy if exists childcare_events_child_id_scope on public.childcare_events;
create policy childcare_events_child_id_scope on public.childcare_events as restrictive for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));
drop trigger if exists childcare_events_household on public.childcare_events;
create trigger childcare_events_household before insert or update of child_id on public.childcare_events
  for each row execute function public.set_household_from_child();
drop trigger if exists childcare_events_keep_author on public.childcare_events;
create trigger childcare_events_keep_author before insert or update on public.childcare_events
  for each row execute function public._keep_author('created_by');
drop trigger if exists childcare_events_premium_write on public.childcare_events;
create trigger childcare_events_premium_write before insert on public.childcare_events
  for each row execute function public._require_premium_write('premium');
grant select, insert, update, delete on public.childcare_events to authenticated;
revoke all on public.childcare_events from anon;

-- Origine posée par le serveur (après le rattachement au foyer : nom de déclencheur en « z »)
create or replace function public._childcare_origin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;                 -- serveur, import : inchangé
  if public._is_caregiver_in(new.household_id) then
    new.origin := 'caregiver';                                     -- une nounou ne se déclare pas « parent »
  elsif new.origin is null or new.origin = 'caregiver' then
    new.origin := 'parent';                                        -- un parent ne se déclare pas « nounou »
  end if;                                                          -- « custody » (garde chez l'autre parent) gardé
  return new;
end $$;
revoke execute on function public._childcare_origin() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['bottles','breastfeeds','meals','sleeps','diapers','child_observations','child_wellbeing','childcare_events'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_zorigin', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._childcare_origin()', t || '_zorigin', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- 3. Liens nounou ↔ enfant (invitation, confirmation, révocation)
create table if not exists public.childcare_links (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  caregiver_id uuid references auth.users(id) on delete cascade,
  invitation_id uuid references public.household_invitations(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  label text check (label is null or char_length(label) between 1 and 60),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  check (confirmed_at is null or (accepted_at is not null and caregiver_id is not null))
);
create unique index if not exists childcare_links_active_uniq on public.childcare_links(child_id, caregiver_id)
  where revoked_at is null and caregiver_id is not null;
create index if not exists childcare_links_caregiver_idx on public.childcare_links(caregiver_id) where revoked_at is null;
create index if not exists childcare_links_household_idx on public.childcare_links(household_id);
create index if not exists childcare_links_invitation_idx on public.childcare_links(invitation_id);
alter table public.childcare_links enable row level security;
drop policy if exists childcare_links_sel on public.childcare_links;
create policy childcare_links_sel on public.childcare_links for select to authenticated
  using (public._is_parent_of(child_id) or caregiver_id = auth.uid());
-- Écriture : uniquement par les fonctions ci-dessous (aucune politique d'insertion / modification)
grant select on public.childcare_links to authenticated;
revoke all on public.childcare_links from anon;

-- Nounou dont l'accès à CET enfant est confirmé, non révoqué, et toujours membre avec l'enfant dans son périmètre
create or replace function public._childcare_active(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.childcare_links l
    join public.household_members m on m.household_id = l.household_id and m.user_id = l.caregiver_id and m.role = 'caregiver'
    where l.child_id = p_child and l.caregiver_id = auth.uid()
      and l.confirmed_at is not null and l.revoked_at is null
      and p_child = any(coalesce(m.child_scope, '{}')));
$$;
revoke execute on function public._childcare_active(uuid) from public, anon;
grant execute on function public._childcare_active(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- 4. Réglages par enfant (autorisation photo, conservation…)
create table if not exists public.childcare_settings (
  child_id uuid primary key references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  photos_allowed boolean not null default false,
  photos_allowed_at timestamptz,
  photos_allowed_by uuid references auth.users(id) on delete set null,
  retention text not null default '30d' check (retention in ('30d','1y','forever')),
  allow_download boolean not null default false,
  notify_name boolean not null default false,          -- discrétion : faux = « bébé » dans les notifications
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.childcare_settings enable row level security;
drop policy if exists childcare_settings_sel on public.childcare_settings;
create policy childcare_settings_sel on public.childcare_settings for select to authenticated
  using (public._is_parent_of(child_id) or public._childcare_active(child_id));
grant select on public.childcare_settings to authenticated;
revoke all on public.childcare_settings from anon;

-- Journal des autorisations (horodaté, jamais modifié)
create table if not exists public.childcare_consents (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  photos_allowed boolean not null,
  text_version text not null default '2026-11-21',
  created_at timestamptz not null default now()
);
create index if not exists childcare_consents_child_idx on public.childcare_consents(child_id, created_at desc);
alter table public.childcare_consents enable row level security;
drop policy if exists childcare_consents_sel on public.childcare_consents;
create policy childcare_consents_sel on public.childcare_consents for select to authenticated using (public._is_parent_of(child_id));
grant select on public.childcare_consents to authenticated;
revoke all on public.childcare_consents from anon;

-- Préférences de notification de CHAQUE parent pour la garde d'un enfant (absence de ligne = tout activé)
create table if not exists public.childcare_notify_prefs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  photos boolean not null default true,
  messages boolean not null default true,
  important boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, child_id)
);
alter table public.childcare_notify_prefs enable row level security;
drop policy if exists childcare_notify_prefs_own on public.childcare_notify_prefs;
create policy childcare_notify_prefs_own on public.childcare_notify_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and (public._is_parent_of(child_id) or public._childcare_active(child_id)));
grant select, insert, update, delete on public.childcare_notify_prefs to authenticated;
revoke all on public.childcare_notify_prefs from anon;

create or replace function public._childcare_can_post_photo(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public._childcare_active(p_child)
     and coalesce((select s.photos_allowed from public.childcare_settings s where s.child_id = p_child), false);
$$;
revoke execute on function public._childcare_can_post_photo(uuid) from public, anon;
grant execute on function public._childcare_can_post_photo(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- 5. Notifications (texte neutre, aucun contenu)
create or replace function public._childcare_notify(p_child uuid, p_kind text, p_author uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record; v_name text; v_title text; v_body text; v_link text; v_show_name boolean; v_household uuid; v_lang text;
begin
  select c.first_name, c.household_id, coalesce(s.notify_name, false) into v_name, v_household, v_show_name
    from public.children c left join public.childcare_settings s on s.child_id = c.id where c.id = p_child;
  if v_household is null then return; end if;
  for r in
    -- parents de l'enfant, + la nounou active pour un message des parents ; jamais l'auteur
    select m.user_id, m.role from public.household_members m
     where m.household_id = v_household and m.user_id is distinct from p_author
       and ((m.role in ('owner','coparent') and public._member_child_allowed(m.role, m.child_scope, p_child))
         or (p_kind = 'message' and m.role = 'caregiver' and exists (
              select 1 from public.childcare_links l where l.child_id = p_child and l.caregiver_id = m.user_id
                and l.confirmed_at is not null and l.revoked_at is null)))
  loop
    if r.role = 'caregiver' and p_kind <> 'message' then continue; end if;
    if exists (select 1 from public.childcare_notify_prefs p where p.user_id = r.user_id and p.child_id = p_child
               and ((p_kind = 'photo' and not p.photos) or (p_kind = 'message' and not p.messages) or (p_kind = 'important' and not p.important))) then
      continue;
    end if;
    select coalesce(pr.locale, 'fr') into v_lang from public.profiles pr where pr.id = r.user_id;
    v_lang := coalesce(v_lang, 'fr');
    v_name := case when v_show_name then (select first_name from public.children where id = p_child)
                   else case v_lang when 'en' then 'baby' when 'de' then 'Baby' when 'es' then 'bebé' when 'it' then 'bebè' else 'bébé' end end;
    if p_kind = 'photo' then
      v_title := case v_lang when 'en' then 'HOMI — New memory' when 'de' then 'HOMI — Neue Erinnerung' when 'es' then 'HOMI — Nuevo recuerdo' when 'it' then 'HOMI — Nuovo ricordo' else 'HOMI — Nouveau souvenir' end;
      v_body := case v_lang when 'en' then format('A new photo of %s is available.', v_name) when 'de' then format('Ein neues Foto von %s ist verfügbar.', v_name)
                 when 'es' then format('Hay una nueva foto de %s disponible.', v_name) when 'it' then format('È disponibile una nuova foto di %s.', v_name)
                 else format('Une nouvelle photo de %s est disponible.', v_name) end;
      v_link := '/garde/' || p_child || '/photos';
    elsif p_kind = 'important' then
      v_title := case v_lang when 'en' then 'HOMI — Important information' when 'de' then 'HOMI — Wichtige Information' when 'es' then 'HOMI — Información importante' when 'it' then 'HOMI — Informazione importante' else 'HOMI — Information importante' end;
      v_body := case v_lang when 'en' then format('The childminder shared important information about %s.', v_name) when 'de' then format('Die Tagesmutter hat eine wichtige Information zu %s geteilt.', v_name)
                 when 'es' then format('La cuidadora ha compartido una información importante sobre %s.', v_name) when 'it' then format('La tata ha condiviso un''informazione importante su %s.', v_name)
                 else format('La nounou a transmis une information importante concernant %s.', v_name) end;
      v_link := '/garde/' || p_child;
    elsif p_kind = 'message' then
      v_title := case v_lang when 'en' then 'HOMI — New message' when 'de' then 'HOMI — Neue Nachricht' when 'es' then 'HOMI — Nuevo mensaje' when 'it' then 'HOMI — Nuovo messaggio' else 'HOMI — Nouveau message' end;
      v_body := case v_lang when 'en' then format('A new message about the care of %s.', v_name) when 'de' then format('Eine neue Nachricht zur Betreuung von %s.', v_name)
                 when 'es' then format('Un nuevo mensaje sobre el cuidado de %s.', v_name) when 'it' then format('Un nuovo messaggio sulla cura di %s.', v_name)
                 else format('Un nouveau message concernant la garde de %s.', v_name) end;
      v_link := '/garde/' || p_child || '/messages';
    elsif p_kind = 'accepted' then
      v_title := case v_lang when 'en' then 'HOMI — Access to confirm' when 'de' then 'HOMI — Zugang bestätigen' when 'es' then 'HOMI — Acceso por confirmar' when 'it' then 'HOMI — Accesso da confermare' else 'HOMI — Accès à confirmer' end;
      v_body := case v_lang when 'en' then 'An invitation was accepted. Confirm the access before anything is shared.' when 'de' then 'Eine Einladung wurde angenommen. Bestätigen Sie den Zugang, bevor etwas geteilt wird.'
                 when 'es' then 'Se ha aceptado una invitación. Confirme el acceso antes de compartir nada.' when 'it' then 'Un invito è stato accettato. Confermi l''accesso prima di condividere qualsiasi cosa.'
                 else 'Une invitation a été acceptée. Confirmez l''accès avant tout partage.' end;
      v_link := '/garde/' || p_child || '/acces';
    else
      continue;
    end if;
    insert into public.notifications (user_id, category, title, body, deep_link, payload, urgent)
    values (r.user_id, 'family', v_title, v_body, v_link, jsonb_build_object('childcare', p_kind, 'child_id', p_child), p_kind = 'important');
  end loop;
end $$;
revoke execute on function public._childcare_notify(uuid, text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- 6. Invitation d'une nounou (mécanisme du foyer réutilisé)
create or replace function public.childcare_invite(p_child uuid, p_label text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_household uuid; v_token text; v_inv uuid; v_link uuid; v_exp timestamptz := now() + interval '72 hours';
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if not public._is_parent_of(p_child) then
    raise exception 'Seul un parent de cet enfant peut inviter une nounou' using errcode = '42501';
  end if;
  select household_id into v_household from public.children where id = p_child;
  v_token := encode(gen_random_bytes(18), 'hex');
  -- Invitation « nounou » du foyer : quotidien seulement, AUCUN enfant tant qu'un parent n'a pas confirmé,
  -- grossesse fermée (déclencheur household_invitations_pregnancy_default), usage unique, 72 h.
  insert into public.household_invitations(household_id, invited_by, token_hash, role, can_view, can_edit, child_scope, pregnancy_access, expires_at)
  values (v_household, auth.uid(), encode(digest(v_token, 'sha256'), 'hex'), 'caregiver', array['daily'], array['daily'], '{}'::uuid[], false, v_exp)
  returning id into v_inv;
  insert into public.childcare_links(household_id, child_id, invitation_id, invited_by, label, expires_at)
  values (v_household, p_child, v_inv, auth.uid(), nullif(btrim(coalesce(p_label, '')), ''), v_exp)
  returning id into v_link;
  return jsonb_build_object('token', v_token, 'link_id', v_link, 'expires_at', v_exp);
end $$;
revoke execute on function public.childcare_invite(uuid, text) from public, anon;
grant execute on function public.childcare_invite(uuid, text) to authenticated;

-- Acceptation par le parcours commun (accept_household_invitation) : le lien passe « acceptée », rien de plus
create or replace function public._childcare_invitation_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
declare l record;
begin
  if new.accepted_at is not null and old.accepted_at is null and auth.uid() is not null then
    for l in update public.childcare_links set caregiver_id = auth.uid(), accepted_at = now()
              where invitation_id = new.id and revoked_at is null and accepted_at is null
              returning child_id
    loop
      perform public._childcare_notify(l.child_id, 'accepted', auth.uid());
    end loop;
  end if;
  return new;
end $$;
revoke execute on function public._childcare_invitation_accepted() from public, anon, authenticated;
drop trigger if exists household_invitations_childcare on public.household_invitations;
create trigger household_invitations_childcare after update of accepted_at on public.household_invitations
  for each row execute function public._childcare_invitation_accepted();

-- Acceptation depuis l'espace nounou : comme le parcours commun, et aussi pour une nounou déjà membre du foyer
-- (deuxième enfant de la même famille) ; jamais pour un parent du foyer.
create or replace function public.childcare_accept(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_inv public.household_invitations; v_role text; v_link uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into v_inv from public.household_invitations
   where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and accepted_at is null and revoked_at is null and expires_at > now();
  if not found then raise exception 'Invitation invalide ou expirée' using errcode = 'P0002'; end if;
  select id into v_link from public.childcare_links where invitation_id = v_inv.id and revoked_at is null;
  if v_link is null then raise exception 'Invitation invalide ou expirée' using errcode = 'P0002'; end if;
  select role into v_role from public.household_members where household_id = v_inv.household_id and user_id = auth.uid();
  if v_role is null then
    perform public.accept_household_invitation(p_token);
  elsif v_role = 'caregiver' then
    if exists (select 1 from public.childcare_links l join public.childcare_links me on me.id = v_link
               where l.child_id = me.child_id and l.caregiver_id = auth.uid() and l.revoked_at is null) then
      raise exception 'Vous gardez déjà cet enfant.' using errcode = '23505';
    end if;
    update public.household_invitations set accepted_at = now() where id = v_inv.id;
  else
    raise exception 'Vous faites déjà partie de ce foyer.' using errcode = '23505';
  end if;
  return jsonb_build_object('household_id', v_inv.household_id, 'link_id', v_link);
end $$;
revoke execute on function public.childcare_accept(text) from public, anon;
grant execute on function public.childcare_accept(text) to authenticated;

-- Ajoute l'enfant au périmètre d'une nounou (fonction interne)
create or replace function public._childcare_scope_add(p_household uuid, p_user uuid, p_child uuid)
returns void language sql security definer set search_path = public as $$
  update public.household_members
     set child_scope = (select array_agg(distinct x) from unnest(coalesce(child_scope, '{}') || p_child) x),
         can_view = (select array_agg(distinct x) from unnest(can_view || array['daily']) x),
         can_edit = (select array_agg(distinct x) from unnest(can_edit || array['daily']) x)
   where household_id = p_household and user_id = p_user and role = 'caregiver';
$$;
revoke execute on function public._childcare_scope_add(uuid, uuid, uuid) from public, anon, authenticated;

-- Confirmation EXPLICITE par un parent : avant elle, la nounou ne voit aucune donnée de l'enfant
create or replace function public.childcare_confirm(p_link uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l public.childcare_links;
begin
  select * into l from public.childcare_links where id = p_link for update;
  if not found or not public._is_parent_of(l.child_id) then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if l.revoked_at is not null then raise exception 'Cet accès a été retiré.' using errcode = '22023'; end if;
  if l.accepted_at is null or l.caregiver_id is null then raise exception 'L''invitation n''a pas encore été acceptée.' using errcode = '22023'; end if;
  if l.confirmed_at is not null then return; end if;
  if not exists (select 1 from public.household_members where household_id = l.household_id and user_id = l.caregiver_id and role = 'caregiver') then
    raise exception 'Cette personne ne fait plus partie du foyer.' using errcode = '22023';
  end if;
  update public.childcare_links set confirmed_at = now(), confirmed_by = auth.uid() where id = p_link;
  perform public._childcare_scope_add(l.household_id, l.caregiver_id, l.child_id);
end $$;
revoke execute on function public.childcare_confirm(uuid) from public, anon;
grant execute on function public.childcare_confirm(uuid) to authenticated;

-- Une nounou déjà membre du foyer garde aussi cet enfant : le geste du parent vaut confirmation
create or replace function public.childcare_add_child(p_child uuid, p_caregiver uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_household uuid; v_link uuid;
begin
  if not public._is_parent_of(p_child) then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select household_id into v_household from public.children where id = p_child;
  if not exists (select 1 from public.household_members where household_id = v_household and user_id = p_caregiver and role = 'caregiver') then
    raise exception 'Cette personne n''est pas nounou dans ce foyer.' using errcode = '22023';
  end if;
  select id into v_link from public.childcare_links where child_id = p_child and caregiver_id = p_caregiver and revoked_at is null;
  if v_link is null then
    insert into public.childcare_links(household_id, child_id, caregiver_id, invited_by, accepted_at, confirmed_at, confirmed_by)
    values (v_household, p_child, p_caregiver, auth.uid(), now(), now(), auth.uid()) returning id into v_link;
  else
    update public.childcare_links set confirmed_at = coalesce(confirmed_at, now()), confirmed_by = coalesce(confirmed_by, auth.uid()),
           accepted_at = coalesce(accepted_at, now()) where id = v_link;
  end if;
  perform public._childcare_scope_add(v_household, p_caregiver, p_child);
  return v_link;
end $$;
revoke execute on function public.childcare_add_child(uuid, uuid) from public, anon;
grant execute on function public.childcare_add_child(uuid, uuid) to authenticated;

-- Révocation immédiate : invitation annulée, enfant retiré du périmètre ; plus aucun enfant → membre retiré
create or replace function public.childcare_revoke(p_link uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l public.childcare_links; v_scope uuid[];
begin
  select * into l from public.childcare_links where id = p_link for update;
  if not found or not public._is_parent_of(l.child_id) then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if l.revoked_at is not null then return; end if;
  update public.childcare_links set revoked_at = now(), revoked_by = auth.uid() where id = p_link;
  if l.invitation_id is not null then
    update public.household_invitations set revoked_at = now() where id = l.invitation_id and accepted_at is null and revoked_at is null;
  end if;
  if l.caregiver_id is not null then
    update public.household_members
       set child_scope = array(select x from unnest(coalesce(child_scope, '{}')) x where x <> l.child_id)
     where household_id = l.household_id and user_id = l.caregiver_id and role = 'caregiver'
     returning child_scope into v_scope;
    if v_scope is not null and cardinality(v_scope) = 0 then
      delete from public.household_members where household_id = l.household_id and user_id = l.caregiver_id and role = 'caregiver';
    end if;
  end if;
end $$;
revoke execute on function public.childcare_revoke(uuid) from public, anon;
grant execute on function public.childcare_revoke(uuid) to authenticated;

-- Réglages (autorisation photo horodatée et journalisée, conservation, téléchargement, discrétion)
create or replace function public.childcare_set_settings(p_child uuid, p_photos_allowed boolean default null, p_retention text default null,
  p_allow_download boolean default null, p_notify_name boolean default null)
returns public.childcare_settings language plpgsql security definer set search_path = public as $$
declare v_household uuid; s public.childcare_settings; v_before boolean;
begin
  if not public._is_parent_of(p_child) then raise exception 'Seul un parent de cet enfant peut modifier ces réglages' using errcode = '42501'; end if;
  if p_retention is not null and p_retention not in ('30d','1y','forever') then raise exception 'Durée de conservation inconnue' using errcode = '22023'; end if;
  select household_id into v_household from public.children where id = p_child;
  insert into public.childcare_settings(child_id, household_id) values (p_child, v_household) on conflict (child_id) do nothing;
  select photos_allowed into v_before from public.childcare_settings where child_id = p_child;
  update public.childcare_settings set
      photos_allowed = coalesce(p_photos_allowed, photos_allowed),
      photos_allowed_at = case when p_photos_allowed is not null and p_photos_allowed is distinct from v_before then now() else photos_allowed_at end,
      photos_allowed_by = case when p_photos_allowed is not null and p_photos_allowed is distinct from v_before then auth.uid() else photos_allowed_by end,
      retention = coalesce(p_retention, retention),
      allow_download = coalesce(p_allow_download, allow_download),
      notify_name = coalesce(p_notify_name, notify_name),
      updated_at = now(), updated_by = auth.uid()
    where child_id = p_child returning * into s;
  if p_photos_allowed is not null and p_photos_allowed is distinct from v_before then
    insert into public.childcare_consents(child_id, household_id, user_id, photos_allowed) values (p_child, v_household, auth.uid(), p_photos_allowed);
  end if;
  return s;
end $$;
revoke execute on function public.childcare_set_settings(uuid, boolean, text, boolean, boolean) from public, anon;
grant execute on function public.childcare_set_settings(uuid, boolean, text, boolean, boolean) to authenticated;

-- Côté nounou : ses gardes (en attente ou actives). Rien sur l'enfant tant que l'accès n'est pas confirmé.
create or replace function public.my_childcare()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'link_id', l.id, 'household_id', l.household_id, 'household_name', h.name,
      'status', case when l.confirmed_at is not null and public._childcare_active(l.child_id) then 'active' else 'pending' end,
      'child', case when l.confirmed_at is not null and public._childcare_active(l.child_id)
                    then jsonb_build_object('id', c.id, 'first_name', c.first_name, 'birth_date', c.birth_date, 'household_id', c.household_id) end,
      'photos_allowed', case when public._childcare_active(l.child_id) then public._childcare_can_post_photo(l.child_id) else false end)
      order by l.confirmed_at nulls last, l.created_at), '[]'::jsonb)
  from public.childcare_links l
  join public.households h on h.id = l.household_id
  join public.children c on c.id = l.child_id
  where auth.uid() is not null and l.caregiver_id = auth.uid() and l.revoked_at is null;
$$;
revoke execute on function public.my_childcare() from public, anon;
grant execute on function public.my_childcare() to authenticated;

-- ---------------------------------------------------------------- 7. Photos de la garde
create table if not exists public.childcare_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  taken_at timestamptz not null default now(),
  caption text check (caption is null or char_length(caption) <= 300),
  origin text not null default 'caregiver' check (origin in ('parent','caregiver','custody')),
  only_this_child boolean not null check (only_this_child),    -- réponse déclarée : aucun autre enfant sur la photo
  storage_path text not null unique,
  width int check (width is null or width between 1 and 10000),
  height int check (height is null or height between 1 and 10000),
  memory_photo_id uuid references public.child_photos(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint childcare_photos_path_check check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    and split_part(storage_path, '/', 1) = household_id::text
    and split_part(storage_path, '/', 2) = child_id::text)
);
create index if not exists childcare_photos_child_idx on public.childcare_photos(child_id, taken_at desc);
create index if not exists childcare_photos_household_idx on public.childcare_photos(household_id);
create index if not exists childcare_photos_author_idx on public.childcare_photos(author_id);
create index if not exists childcare_photos_memory_idx on public.childcare_photos(memory_photo_id);

create or replace function public.childcare_photos_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant inconnu dans ce foyer' using errcode = '42501';
  end if;
  if auth.uid() is not null then
    new.author_id := auth.uid();
    new.origin := case when public._is_caregiver_in(new.household_id) then 'caregiver' else 'parent' end;
  end if;
  if new.taken_at > now() + interval '5 minutes' then new.taken_at := now(); end if;
  return new;
end $$;
revoke execute on function public.childcare_photos_guard() from public, anon, authenticated;
drop trigger if exists childcare_photos_guard on public.childcare_photos;
create trigger childcare_photos_guard before insert on public.childcare_photos for each row execute function public.childcare_photos_guard();

alter table public.childcare_photos enable row level security;
drop policy if exists childcare_photos_sel on public.childcare_photos;
create policy childcare_photos_sel on public.childcare_photos for select to authenticated
  using (public._is_parent_of(child_id) or (author_id = auth.uid() and public._childcare_active(child_id)));
drop policy if exists childcare_photos_ins on public.childcare_photos;
create policy childcare_photos_ins on public.childcare_photos for insert to authenticated
  with check (author_id = auth.uid() and public._childcare_can_post_photo(child_id));
drop policy if exists childcare_photos_del on public.childcare_photos;
create policy childcare_photos_del on public.childcare_photos for delete to authenticated
  using (public._is_parent_of(child_id) or (author_id = auth.uid() and public._childcare_active(child_id)));
grant select, insert, delete on public.childcare_photos to authenticated;
revoke all on public.childcare_photos from anon;

create or replace function public._childcare_photo_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public._childcare_notify(new.child_id, 'photo', new.author_id);
  return new;
end $$;
revoke execute on function public._childcare_photo_inserted() from public, anon, authenticated;
drop trigger if exists childcare_photos_notify on public.childcare_photos;
create trigger childcare_photos_notify after insert on public.childcare_photos for each row execute function public._childcare_photo_inserted();

-- Fichier encore référencé (photo de garde OU album) : jamais effacé
create or replace function public._child_photo_path_referenced(p_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.child_photos where storage_path = p_path)
      or exists (select 1 from public.childcare_photos where storage_path = p_path);
$$;
revoke execute on function public._child_photo_path_referenced(text) from public, anon;
grant execute on function public._child_photo_path_referenced(text) to authenticated, service_role;

create or replace function public._storage_deletion_skip_referenced()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.bucket = 'child-photos' and public._child_photo_path_referenced(new.path) then return null; end if;
  return new;
end $$;
revoke execute on function public._storage_deletion_skip_referenced() from public, anon, authenticated;
drop trigger if exists storage_deletions_skip_referenced on public.storage_deletions;
create trigger storage_deletions_skip_referenced before insert on public.storage_deletions
  for each row execute function public._storage_deletion_skip_referenced();
drop trigger if exists childcare_photos_queue_storage on public.childcare_photos;
create trigger childcare_photos_queue_storage after delete on public.childcare_photos
  for each row execute function public.queue_storage_deletion('child-photos', 'storage_path');

-- Fichiers : dépôt par la nounou autorisée pour CET enfant ; lecture si la ligne de garde est visible (RLS)
drop policy if exists "childcare photos files upload" on storage.objects;
create policy "childcare photos files upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'child-photos'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    and public._childcare_can_post_photo(split_part(name, '/', 2)::uuid)
    and exists (select 1 from public.children c where c.id::text = split_part(name, '/', 2) and c.household_id = public.storage_household(name)));
drop policy if exists "childcare photos files read" on storage.objects;
create policy "childcare photos files read" on storage.objects for select to authenticated
  using (bucket_id = 'child-photos' and exists (select 1 from public.childcare_photos p where p.storage_path = name));
-- Restrictive : un fichier de photo d'enfant encore utilisé (garde ou album) ne s'efface pas
drop policy if exists "child photos files keep referenced" on storage.objects;
create policy "child photos files keep referenced" on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'child-photos' or not public._child_photo_path_referenced(name));

-- Ajout aux souvenirs de l'enfant (album existant) sans copier le fichier
create or replace function public.childcare_photo_to_memories(p_photo uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare p public.childcare_photos; v_id uuid;
begin
  select * into p from public.childcare_photos where id = p_photo for update;
  if not found or not public._is_parent_of(p.child_id) or not public.can_access_household(p.household_id, 'profile', true) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p.memory_photo_id is not null then return p.memory_photo_id; end if;
  select id into v_id from public.child_photos where storage_path = p.storage_path;
  if v_id is null then
    insert into public.child_photos(household_id, child_id, storage_path, taken_on, caption, visibility, width, height)
    values (p.household_id, p.child_id, p.storage_path, least(p.taken_at::date, current_date), p.caption, 'household', p.width, p.height)
    returning id into v_id;
  end if;
  update public.childcare_photos set memory_photo_id = v_id where id = p_photo;
  return v_id;
end $$;
revoke execute on function public.childcare_photo_to_memories(uuid) from public, anon;
grant execute on function public.childcare_photo_to_memories(uuid) to authenticated;

-- ---------------------------------------------------------------- 8. Conservation (purge réelle)
-- À planifier côté serveur (Supabase Cron, quotidien) : select public.childcare_purge_expired();
-- Les fichiers partent ensuite par la file storage_deletions (fonction « storage-cleanup »), sauf ceux ajoutés aux souvenirs.
create or replace function public.childcare_purge_expired(p_household uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  delete from public.childcare_photos p using public.childcare_settings s
   where s.child_id = p.child_id and s.retention <> 'forever'
     and (p_household is null or p.household_id = p_household)
     and p.taken_at < now() - case s.retention when '30d' then interval '30 days' else interval '1 year' end;
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function public.childcare_purge_expired(uuid) from public, anon, authenticated;
grant execute on function public.childcare_purge_expired(uuid) to service_role;

-- Appelée par l'application à l'ouverture de l'espace par un parent (en plus de la purge planifiée)
create or replace function public.childcare_purge_now()
returns int language plpgsql security definer set search_path = public as $$
declare v_n int := 0; h uuid;
begin
  if auth.uid() is null then return 0; end if;
  for h in select household_id from public.household_members where user_id = auth.uid() and role in ('owner','coparent') loop
    v_n := v_n + public.childcare_purge_expired(h);
  end loop;
  return v_n;
end $$;
revoke execute on function public.childcare_purge_now() from public, anon;
grant execute on function public.childcare_purge_now() to authenticated;

-- ---------------------------------------------------------------- 9. Messagerie parents–nounou (texte seulement)
-- Volontairement SANS colonne de lecture, de présence ou de « vu » : aucun moyen de surveiller la disponibilité.
create table if not exists public.childcare_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  important boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists childcare_messages_child_idx on public.childcare_messages(child_id, created_at desc);
create index if not exists childcare_messages_household_idx on public.childcare_messages(household_id);
create index if not exists childcare_messages_author_idx on public.childcare_messages(author_id);
create or replace function public.childcare_messages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select household_id into new.household_id from public.children where id = new.child_id;
  if new.household_id is null then raise exception 'Enfant introuvable' using errcode = '23503'; end if;
  if auth.uid() is not null then new.author_id := auth.uid(); end if;
  new.created_at := now();
  return new;
end $$;
revoke execute on function public.childcare_messages_guard() from public, anon, authenticated;
drop trigger if exists childcare_messages_guard on public.childcare_messages;
create trigger childcare_messages_guard before insert on public.childcare_messages for each row execute function public.childcare_messages_guard();
alter table public.childcare_messages enable row level security;
drop policy if exists childcare_messages_sel on public.childcare_messages;
create policy childcare_messages_sel on public.childcare_messages for select to authenticated
  using (public._is_parent_of(child_id) or public._childcare_active(child_id));
drop policy if exists childcare_messages_ins on public.childcare_messages;
create policy childcare_messages_ins on public.childcare_messages for insert to authenticated
  with check (author_id = auth.uid() and (public._is_parent_of(child_id) or public._childcare_active(child_id)));
grant select, insert on public.childcare_messages to authenticated;
revoke all on public.childcare_messages from anon;

create or replace function public._childcare_message_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public._childcare_notify(new.child_id, 'message', new.author_id);
  return new;
end $$;
revoke execute on function public._childcare_message_inserted() from public, anon, authenticated;
drop trigger if exists childcare_messages_notify on public.childcare_messages;
create trigger childcare_messages_notify after insert on public.childcare_messages for each row execute function public._childcare_message_inserted();

-- Information importante de la nounou (observation marquée) : notification prioritaire, texte neutre
create or replace function public._childcare_important_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.important is true and new.origin = 'caregiver' then
    perform public._childcare_notify(new.child_id, 'important', new.created_by);
  end if;
  return new;
end $$;
revoke execute on function public._childcare_important_inserted() from public, anon, authenticated;
drop trigger if exists child_observations_childcare_important on public.child_observations;
create trigger child_observations_childcare_important after insert on public.child_observations
  for each row execute function public._childcare_important_inserted();

-- ---------------------------------------------------------------- 10. Temps réel (parents)
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['childcare_events','childcare_photos','childcare_messages'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- 11. Index des clés étrangères
create index if not exists childcare_consents_household_idx on public.childcare_consents(household_id);
create index if not exists childcare_consents_user_idx on public.childcare_consents(user_id);
create index if not exists childcare_links_confirmed_by_idx on public.childcare_links(confirmed_by);
create index if not exists childcare_links_invited_by_idx on public.childcare_links(invited_by);
create index if not exists childcare_links_revoked_by_idx on public.childcare_links(revoked_by);
create index if not exists childcare_notify_prefs_child_idx on public.childcare_notify_prefs(child_id);
create index if not exists childcare_settings_household_idx on public.childcare_settings(household_id);
create index if not exists childcare_settings_allowed_by_idx on public.childcare_settings(photos_allowed_by);
create index if not exists childcare_settings_updated_by_idx on public.childcare_settings(updated_by);

-- ---------------------------------------------------------------- 12. Export RGPD (« Exporter mes données »)
-- La version brute précédente est gardée sous un autre nom et complétée ; export_my_data() (security invoker, filtre
-- sous RLS) reste inchangée : une ligne d'un enfant non visible n'apparaît pas, sauf si la personne en est l'autrice.
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_v30' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_v30;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_v30() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_raw_v30() || jsonb_build_object('childcare', jsonb_build_object(
    'links', (select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at), '[]') from public.childcare_links l
              where l.caregiver_id = v_uid or l.invited_by = v_uid or l.confirmed_by = v_uid),
    'settings', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.childcare_settings s
                 where s.household_id in (select household_id from public.household_members where user_id = v_uid and role in ('owner','coparent'))),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]') from public.childcare_consents c where c.user_id = v_uid),
    'notify_prefs', (select coalesce(jsonb_agg(to_jsonb(n)), '[]') from public.childcare_notify_prefs n where n.user_id = v_uid),
    'events', (select coalesce(jsonb_agg(to_jsonb(e) order by e.at), '[]') from public.childcare_events e where e.created_by = v_uid),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'household_id', p.household_id, 'child_id', p.child_id, 'author_id', p.author_id,
                 'taken_at', p.taken_at, 'caption', p.caption, 'storage_path', p.storage_path) order by p.taken_at), '[]')
               from public.childcare_photos p where p.author_id = v_uid),
    'messages', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]') from public.childcare_messages m where m.author_id = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière (après accord, données de garde perdues)
-- drop trigger if exists child_observations_childcare_important on public.child_observations;
-- drop trigger if exists household_invitations_childcare on public.household_invitations;
-- drop trigger if exists storage_deletions_skip_referenced on public.storage_deletions;
-- do $$ declare t text; begin foreach t in array array['bottles','breastfeeds','meals','sleeps','diapers','child_observations','child_wellbeing']
--   loop execute format('drop trigger if exists %I on public.%I', t || '_zorigin', t); end loop; end $$;
-- drop policy if exists "childcare photos files upload" on storage.objects;
-- drop policy if exists "childcare photos files read" on storage.objects;
-- drop policy if exists "child photos files keep referenced" on storage.objects;
-- drop table if exists public.childcare_messages, public.childcare_photos, public.childcare_notify_prefs, public.childcare_consents,
--   public.childcare_settings, public.childcare_links, public.childcare_events;
-- drop function if exists public.childcare_invite(uuid, text), public.childcare_accept(text), public.childcare_confirm(uuid),
--   public.childcare_add_child(uuid, uuid), public.childcare_revoke(uuid), public.childcare_set_settings(uuid, boolean, text, boolean, boolean),
--   public.my_childcare(), public.childcare_photo_to_memories(uuid), public.childcare_purge_expired(uuid), public.childcare_purge_now(),
--   public._childcare_notify(uuid, text, uuid), public._childcare_active(uuid), public._childcare_can_post_photo(uuid), public._is_parent_of(uuid),
--   public._child_photo_path_referenced(text), public._childcare_origin(), public._childcare_scope_add(uuid, uuid, uuid);
-- Export : drop function public._export_my_data_raw(); alter function public._export_my_data_raw_v30() rename to _export_my_data_raw;
--   grant execute on function public._export_my_data_raw() to authenticated;
-- Les colonnes ajoutées (origin, meals.eaten_amount, mood, difficulty, to_share, important, important_kind) peuvent rester (nullables).
