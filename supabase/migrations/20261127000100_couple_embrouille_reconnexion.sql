-- =====================================================================
-- Couple (27/11/2026) — 172 « Mode embrouille » et 179 « Missions de reconnexion »
-- Écrans : src/app/family/calm.tsx, src/app/family/moments.tsx ; tests : supabase/tests/sql/98zf_couple_embrouille_reconnexion.sql,
-- src/__tests__/calmMoments.test.ts
--
-- ADDITIF ET IDEMPOTENT : nouvelles tables, politiques et fonctions. Aucune donnée réécrite.
--
--  1. calm_modes     : interrupteur PERSONNEL (une ligne par personne, elle seule la lit et l'écrit). Activer ou couper
--                      ne prévient personne : ce n'est jamais présenté comme un reproche fait à l'autre.
--  2. calm_requests  : demandes pratiques envoyées pendant le mode (modèle + date / heure + enfant). Chaque demande EST
--                      une mission (create_mission) : mêmes réponses (mission_respond : accepter, ne peut pas, terminé),
--                      même historique (family_task_events), mêmes notifications neutres. AUCUN texte libre : la mission
--                      est créée sans description ; le modèle est vérifié par le serveur. Lisible par l'expéditeur et le
--                      destinataire seulement (parents du foyer). Aucune statistique, aucun compteur.
--  3. couple_moments : propositions de moments à deux (bibliothèque écrite à l'avance, côté application : idea_key),
--                      acceptées ou déclinées SANS justification (aucune colonne de texte), planifiables (planned_at,
--                      lu par l'agenda de l'application), historique des moments passés. Lisibles par les deux adultes
--                      concernés seulement ; transitions par couple_moment_respond (le serveur vérifie qui fait quoi).
--
-- Retour arrière : en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Mode embrouille : interrupteur personnel
create table if not exists public.calm_modes (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  active boolean not null default false,
  changed_at timestamptz not null default now()
);
alter table public.calm_modes enable row level security;
drop policy if exists calm_modes_owner on public.calm_modes;
create policy calm_modes_owner on public.calm_modes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.calm_modes to authenticated;
revoke all on public.calm_modes from anon;

create or replace function public._calm_mode_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and auth.uid() is not null then new.user_id := auth.uid(); end if;
  new.changed_at := now();
  return new;
end $$;
revoke execute on function public._calm_mode_touch() from public, anon, authenticated;
drop trigger if exists calm_modes_touch on public.calm_modes;
create trigger calm_modes_touch before insert or update on public.calm_modes for each row execute function public._calm_mode_touch();

-- ---------------------------------------------------------------- 2. Demandes pratiques (missions sans texte libre)
create table if not exists public.calm_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  task_id uuid not null unique references public.family_tasks(id) on delete cascade,
  template_key text not null check (template_key in ('pickup', 'groceries', 'appointment', 'medicine', 'paper', 'night_relay')),
  child_id uuid references public.children(id) on delete set null,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  due_at timestamptz check (due_at is null or (due_at >= timestamptz '2000-01-01' and due_at < timestamptz '2100-01-01')),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index if not exists calm_requests_household_idx on public.calm_requests(household_id, created_at desc);
create index if not exists calm_requests_from_idx on public.calm_requests(from_user);
create index if not exists calm_requests_to_idx on public.calm_requests(to_user);
create index if not exists calm_requests_child_idx on public.calm_requests(child_id);

alter table public.calm_requests enable row level security;
-- Lecture : l'expéditeur et le destinataire, tant qu'ils sont parents du foyer. Aucune écriture directe (fonctions).
drop policy if exists calm_requests_sel on public.calm_requests;
create policy calm_requests_sel on public.calm_requests for select to authenticated
  using ((from_user = auth.uid() or to_user = auth.uid()) and public._is_household_parent(household_id)
         and (child_id is null or public.can_access_child(child_id)));
grant select on public.calm_requests to authenticated;
revoke all on public.calm_requests from anon;

-- Catégorie de mission d'un modèle (responsabilités du foyer, agenda)
create or replace function public._calm_category_of(p_template text)
returns text language sql immutable as $$
  select case p_template
    when 'pickup' then 'childcare' when 'groceries' then 'shopping' when 'appointment' then 'appointments'
    when 'medicine' then 'health' when 'paper' then 'admin' when 'night_relay' then 'childcare' else 'other' end;
$$;

-- Envoi : une mission adressée à l'autre parent, sans description. Rejeu (même p_client_id) : la même demande.
create or replace function public.calm_request_send(p_household uuid, p_template text, p_assignee uuid, p_title text,
  p_due_at timestamptz default null, p_child uuid default null, p_client_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_task jsonb; v_id uuid; r public.calm_requests;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if not public._is_household_parent(p_household) then raise exception 'Réservé aux parents du foyer.' using errcode = '42501'; end if;
  if p_assignee is null or p_assignee = v_uid or not exists (select 1 from public.household_members m
       where m.household_id = p_household and m.user_id = p_assignee and m.role in ('owner', 'coparent')) then
    raise exception 'La demande s''adresse à l''autre parent du foyer.' using errcode = '22023';
  end if;
  if p_template is null or p_template not in ('pickup', 'groceries', 'appointment', 'medicine', 'paper', 'night_relay') then
    raise exception 'Modèle inconnu.' using errcode = '22023';
  end if;
  -- Le titre est le modèle mis en forme par l'application (une ligne, court) ; aucune description n'est acceptée
  if p_title is null or char_length(btrim(p_title)) not between 1 and 120 or p_title ~ '[\r\n]' then
    raise exception 'Titre de demande invalide.' using errcode = '22023';
  end if;
  if p_client_id is not null then
    select c.* into r from public.calm_requests c join public.family_tasks t on t.id = c.task_id
      where c.household_id = p_household and t.client_id = p_client_id;
    if found then return to_jsonb(r); end if;
  end if;
  v_task := public.create_mission(p_household, p_title, p_assignee, public._calm_category_of(p_template), null, p_due_at, false, 'normal',
    null, p_child, null, null, null, null, null, p_client_id);
  v_id := (v_task ->> 'id')::uuid;
  insert into public.calm_requests (household_id, task_id, template_key, child_id, from_user, to_user, due_at)
    values (p_household, v_id, p_template, p_child, v_uid, p_assignee, p_due_at)
    on conflict (task_id) do nothing;
  select * into r from public.calm_requests where task_id = v_id;
  return to_jsonb(r);
end $$;
revoke execute on function public.calm_request_send(uuid, text, uuid, text, timestamptz, uuid, uuid) from public, anon;
grant execute on function public.calm_request_send(uuid, text, uuid, text, timestamptz, uuid, uuid) to authenticated;

-- Modification par l'expéditeur : la date / l'heure seulement (le modèle ne change pas), tant que la demande est ouverte
create or replace function public.calm_request_update(p_id uuid, p_due_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r public.calm_requests; v_state text;
begin
  select * into r from public.calm_requests where id = p_id;
  if not found or r.from_user is distinct from v_uid or not public._is_household_parent(r.household_id) then
    return jsonb_build_object('status', 'not_found');
  end if;
  select mission_state into v_state from public.family_tasks where id = r.task_id;
  if v_state not in ('pending', 'accepted', 'postponed') then
    raise exception 'Cette demande n''est plus modifiable.' using errcode = '22023';
  end if;
  update public.family_tasks set due_at = p_due_at where id = r.task_id;
  update public.calm_requests set due_at = p_due_at where id = p_id returning * into r;
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(r));
end $$;
revoke execute on function public.calm_request_update(uuid, timestamptz) from public, anon;
grant execute on function public.calm_request_update(uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------- 3. Moments à deux (missions de reconnexion)
create table if not exists public.couple_moments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  idea_key text not null check (idea_key ~ '^[a-z0-9_]{1,40}$'),
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'done', 'cancelled')),
  planned_at timestamptz check (planned_at is null or (planned_at >= timestamptz '2000-01-01' and planned_at < timestamptz '2100-01-01')),
  duration_minutes smallint check (duration_minutes is null or duration_minutes between 5 and 600),
  responded_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index if not exists couple_moments_household_idx on public.couple_moments(household_id, created_at desc);
create index if not exists couple_moments_from_idx on public.couple_moments(from_user);
create index if not exists couple_moments_to_idx on public.couple_moments(to_user);

-- Proposition : posée par le serveur (autrice = personne connectée, état « proposé », aucune réponse) ; deux parents
create or replace function public._couple_moment_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- fonctions serveur (couple_moment_respond) et service : pas de garde
  if coalesce(current_setting('homi.moment_rpc', true), '') = 'on' or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.from_user := auth.uid();
    new.status := 'proposed'; new.responded_at := null; new.done_at := null;
    new.created_at := now(); new.updated_at := now();
    if new.to_user = new.from_user or not exists (select 1 from public.household_members m
         where m.household_id = new.household_id and m.user_id = new.to_user and m.role in ('owner', 'coparent')) then
      raise exception 'Une proposition s''adresse à l''autre parent du foyer.' using errcode = '22023';
    end if;
    return new;
  end if;
  raise exception 'Un moment change par ses réponses (accepter, planifier, c''était bien…).' using errcode = '42501';
end $$;
revoke execute on function public._couple_moment_guard() from public, anon, authenticated;
drop trigger if exists couple_moments_guard on public.couple_moments;
create trigger couple_moments_guard before insert or update on public.couple_moments for each row execute function public._couple_moment_guard();

alter table public.couple_moments enable row level security;
drop policy if exists couple_moments_sel on public.couple_moments;
create policy couple_moments_sel on public.couple_moments for select to authenticated
  using ((from_user = auth.uid() or to_user = auth.uid()) and public._is_household_parent(household_id));
drop policy if exists couple_moments_ins on public.couple_moments;
create policy couple_moments_ins on public.couple_moments for insert to authenticated
  with check (from_user = auth.uid() and public._is_household_parent(household_id));
-- Effacer une proposition de l'historique : la personne qui l'a faite
drop policy if exists couple_moments_del on public.couple_moments;
create policy couple_moments_del on public.couple_moments for delete to authenticated
  using (from_user = auth.uid() and public._is_household_parent(household_id));
grant select, insert, delete on public.couple_moments to authenticated;
revoke all on public.couple_moments from anon;

-- Textes neutres des notifications (langue du destinataire) ; jamais l'idée elle-même, jamais de refus notifié
create or replace function public._moment_notification(p_lang text, p_kind text, out title text, out body text)
language sql immutable as $$
  select case p_kind
      when 'proposed' then case coalesce(p_lang, 'fr')
        when 'en' then 'An idea for a moment together' when 'es' then 'Una idea para un momento juntos'
        when 'de' then 'Eine Idee für einen Moment zu zweit' when 'it' then 'Un’idea per un momento insieme'
        else 'Une idée de moment à deux' end
      else case coalesce(p_lang, 'fr')
        when 'en' then 'Your idea for a moment together was accepted' when 'es' then 'Tu idea de momento juntos fue aceptada'
        when 'de' then 'Deine Idee für einen Moment zu zweit wurde angenommen' when 'it' then 'La tua idea di momento insieme è stata accettata'
        else 'Votre idée de moment à deux est acceptée' end end,
    case coalesce(p_lang, 'fr')
      when 'en' then 'Open HOMI when you like.' when 'es' then 'Abre HOMI cuando quieras.'
      when 'de' then 'Öffne HOMI, wann du möchtest.' when 'it' then 'Apri HOMI quando vuoi.'
      else 'Ouvrez HOMI quand vous le souhaitez.' end;
$$;
revoke execute on function public._moment_notification(text, text) from public, anon, authenticated;

create or replace function public._couple_moment_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare n record;
begin
  select * into n from public._moment_notification((select locale from public.profiles where id = new.to_user), 'proposed');
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
    values (new.to_user, 'family', n.title, n.body, '/family/moments', jsonb_build_object('moment_id', new.id));
  return new;
end $$;
revoke execute on function public._couple_moment_notify() from public, anon, authenticated;
drop trigger if exists couple_moments_notify on public.couple_moments;
create trigger couple_moments_notify after insert on public.couple_moments for each row execute function public._couple_moment_notify();

-- Réponses : accept / decline (destinataire, depuis « proposé ») ; plan (l'un ou l'autre, une fois accepté) ;
-- done (l'un ou l'autre, une fois accepté) ; cancel (autrice, avant que ce soit fait). Rejeu : « inchangé ».
create or replace function public.couple_moment_respond(p_id uuid, p_action text, p_planned_at timestamptz default null, p_duration smallint default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); m public.couple_moments; v_target text; n record; v_prev text;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_action not in ('accept', 'decline', 'plan', 'done', 'cancel') then raise exception 'Action inconnue.' using errcode = '22023'; end if;
  select * into m from public.couple_moments where id = p_id for update;
  if not found or (v_uid is distinct from m.from_user and v_uid is distinct from m.to_user) or not public._is_household_parent(m.household_id) then
    return jsonb_build_object('status', 'not_found');
  end if;
  v_prev := m.status;
  v_target := case p_action when 'accept' then 'accepted' when 'decline' then 'declined' when 'done' then 'done' when 'cancel' then 'cancelled' else m.status end;
  if p_action <> 'plan' and m.status = v_target then return jsonb_build_object('status', 'ok', 'unchanged', true, 'row', to_jsonb(m)); end if;
  if p_action in ('accept', 'decline') and (v_uid <> m.to_user or m.status <> 'proposed') then
    raise exception 'Seule la personne à qui le moment est proposé y répond.' using errcode = '42501';
  end if;
  if p_action = 'plan' and (m.status not in ('proposed', 'accepted') or (m.status = 'proposed' and v_uid <> m.to_user)) then
    raise exception 'Un moment se planifie une fois accepté.' using errcode = '22023';
  end if;
  if p_action = 'plan' and p_planned_at is not null and p_planned_at < now() - interval '1 day' then
    raise exception 'Choisissez une date à venir.' using errcode = '22023';
  end if;
  if p_action = 'done' and m.status <> 'accepted' then raise exception 'Seul un moment accepté peut être noté comme passé.' using errcode = '22023'; end if;
  if p_action = 'cancel' and (v_uid <> m.from_user or m.status not in ('proposed', 'accepted')) then
    raise exception 'Seule la personne qui a proposé le moment peut l''annuler.' using errcode = '42501';
  end if;
  perform set_config('homi.moment_rpc', 'on', true);
  update public.couple_moments set
    status = case when p_action = 'plan' then 'accepted' else v_target end,
    planned_at = case when p_action = 'plan' then p_planned_at else planned_at end,
    duration_minutes = case when p_action = 'plan' then coalesce(p_duration, duration_minutes) else duration_minutes end,
    responded_at = case when p_action in ('accept', 'decline') or (p_action = 'plan' and status = 'proposed') then now() else responded_at end,
    done_at = case when p_action = 'done' then now() else done_at end,
    updated_at = now()
  where id = p_id returning * into m;
  perform set_config('homi.moment_rpc', '', true);
  if p_action = 'accept' or (p_action = 'plan' and v_prev = 'proposed') then
    select * into n from public._moment_notification((select locale from public.profiles where id = m.from_user), 'accepted');
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (m.from_user, 'family', n.title, n.body, '/family/moments', jsonb_build_object('moment_id', m.id));
  end if;
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(m));
end $$;
revoke execute on function public.couple_moment_respond(uuid, text, timestamptz, smallint) from public, anon;
grant execute on function public.couple_moment_respond(uuid, text, timestamptz, smallint) to authenticated;

-- ---------------------------------------------------------------- 4. Premium (même règle que les autres outils du foyer)
do $$
declare t text;
begin
  foreach t in array array['calm_modes', 'couple_moments'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
    execute format('create trigger %I before insert on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
  end loop;
end $$;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop function if exists public.calm_request_send(uuid, text, uuid, text, timestamptz, uuid, uuid), public.calm_request_update(uuid, timestamptz),
--   public.couple_moment_respond(uuid, text, timestamptz, smallint), public._couple_moment_guard(), public._couple_moment_notify(),
--   public._moment_notification(text, text), public._calm_category_of(text), public._calm_mode_touch();
-- drop table if exists public.calm_requests, public.couple_moments, public.calm_modes;
-- (les missions envoyées restent des missions ordinaires du foyer : family_tasks n'est pas modifiée)
