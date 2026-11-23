-- =====================================================================
-- Missions familiales (14/11/2026, phase 4) — HOMI_MISSIONS_SPEC.md
--
-- DÉCISION : une mission EST une family_task enrichie (pas de nouvelle table). Une seule source de vérité pour
-- l'agenda (tâches datées), l'historique (family_task_events), la récurrence, le hors ligne (client_id/version),
-- l'audit et les événements du foyer. Une tâche ordinaire a mission_state NULL ; une mission a un état fin :
--   pending (À accepter) · accepted (Acceptée) · in_progress (En cours) · done (Terminée) · declined (Refusée)
--   · postponed (Reportée) · cancelled (Annulée)
-- status (todo/done/cancelled, lu par tous les écrans existants) reste cohérent : contrainte family_tasks_mission_status_ck.
--
-- 1. Colonnes : mission_state, child_id (enfant associé, périmètre nounou appliqué), pet_id (module animaux à venir :
--    colonne nullable SANS clé étrangère), shopping_item_id + product_label (produit associé), document_id (pièce jointe =
--    un document du foyer, sous ses propres droits), domain_key (responsabilité, family_domains), all_day,
--    responded_at, last_reminded_at. Catégories ajoutées : pets, childcare, health.
-- 2. Transitions validées CÔTÉ SERVEUR : create_mission() et mission_respond() (security definer). Un client ne peut ni
--    créer une ligne « mission » directement, ni changer son état, son destinataire ou son statut par un update direct
--    (family_tasks_mission_guard). Seul le destinataire accepte / refuse / propose un autre moment / commence / termine /
--    demande une précision ; seul le créateur annule, propose à quelqu'un d'autre, ou envoie un rappel (1 par 24 h).
--    Refus : justification FACULTATIVE (≤ 300 caractères).
-- 3. Historique horodaté obligatoire (family_task_events, nouveaux types) et NON MODIFIABLE (ajout seul, même pour le
--    serveur ; seule la suppression de la tâche ou du foyer l'efface ; un compte supprimé y devient anonyme).
-- 4. Synchronisations branchées via household_events (types mission.*), traitées par UN consommateur
--    (_consume_mission_event) : notification neutre au bon destinataire, article de courses lié créé à l'acceptation
--    (sans doublon : client_id déterministe + article identique déjà présent), coché à la fin. Le consommateur est
--    appelé tout de suite après l'émission (_dispatch_household_event, même transaction, erreur isolée) et par un
--    passage planifié (process_household_events, serveur) pour ce qui aurait échoué. Aucun déclencheur ad hoc.
--    L'agenda n'a rien à synchroniser : une mission datée EST une tâche datée (déjà lue par l'agenda).
-- 5. Interdits respectés : aucun score, aucun classement, aucune preuve de lecture (read_at jamais lu ici), relances
--    limitées (1 rappel par 24 h, à l'initiative du créateur), rien de déduit d'une lecture.
--
-- Tests : supabase/tests/sql/98m_missions.sql
-- Retour arrière : drop function public.create_mission, public.mission_respond, public._consume_mission_event,
--   public._dispatch_household_event, public.process_household_events, public._mission_next_state,
--   public._mission_domain_of, public._mission_notification, public._mission_can_receive;
--   drop trigger family_tasks_mission_guard on public.family_tasks; drop trigger family_task_events_append_only on
--   public.family_task_events; drop policy family_tasks_child_id_scope on public.family_tasks;
--   drop policy family_task_events_task_scope on public.family_task_events; recréer family_tasks_after depuis
--   20261019000600_security_review_fixes.sql ; alter table public.family_tasks drop column mission_state, … (colonnes § 1).
-- =====================================================================

-- ---------------------------------------------------------------- 1. colonnes
alter table public.family_tasks add column if not exists mission_state text
  check (mission_state in ('pending', 'accepted', 'in_progress', 'done', 'declined', 'postponed', 'cancelled'));
alter table public.family_tasks add column if not exists child_id uuid references public.children(id) on delete set null;
alter table public.family_tasks add column if not exists pet_id uuid;            -- module animaux à venir (pas de clé étrangère)
alter table public.family_tasks add column if not exists shopping_item_id uuid references public.shopping_items(id) on delete set null;
alter table public.family_tasks add column if not exists product_label text check (char_length(btrim(product_label)) between 1 and 120);
alter table public.family_tasks add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.family_tasks add column if not exists domain_key text check (domain_key ~ '^[a-z_]{2,40}$');
alter table public.family_tasks add column if not exists all_day boolean not null default false;
alter table public.family_tasks add column if not exists responded_at timestamptz;
alter table public.family_tasks add column if not exists last_reminded_at timestamptz;

alter table public.family_tasks drop constraint if exists family_tasks_mission_status_ck;
alter table public.family_tasks add constraint family_tasks_mission_status_ck check (
  mission_state is null or ((mission_state = 'done') = (status = 'done') and (mission_state = 'cancelled') = (status = 'cancelled')));
alter table public.family_tasks drop constraint if exists family_tasks_category_check;
alter table public.family_tasks add constraint family_tasks_category_check check (category in
  ('feeding','diapers','sleep','shopping','packing','appointments','housework','admin','organization','parent_rest','other','pets','childcare','health'));

create index if not exists family_tasks_missions_idx on public.family_tasks(household_id, assignee_id, mission_state) where mission_state is not null;
create index if not exists family_tasks_child_id_idx on public.family_tasks(child_id) where child_id is not null;
create index if not exists family_tasks_shopping_item_idx on public.family_tasks(shopping_item_id) where shopping_item_id is not null;
create index if not exists family_tasks_document_idx on public.family_tasks(document_id) where document_id is not null;

alter table public.family_task_events drop constraint if exists family_task_events_kind_check;
alter table public.family_task_events add constraint family_task_events_kind_check check (kind in
  ('created','assigned','unassigned','done','reopened','postponed','updated','cancelled','accepted','declined','started','question','reminded'));

-- Périmètre nounou : une mission liée à un enfant non confié est invisible et non modifiable (comme toute table à child_id)
drop policy if exists family_tasks_child_id_scope on public.family_tasks;
create policy family_tasks_child_id_scope on public.family_tasks as restrictive for all to authenticated
  using (child_id is null or public.can_access_child(child_id)) with check (child_id is null or public.can_access_child(child_id));
-- L'historique d'une tâche invisible l'est aussi (titres, justification facultative d'un refus)
drop policy if exists family_task_events_task_scope on public.family_task_events;
create policy family_task_events_task_scope on public.family_task_events as restrictive for select to authenticated
  using (exists (select 1 from public.family_tasks t where t.id = family_task_events.task_id));

-- ---------------------------------------------------------------- 3. historique en ajout seul
create or replace function public.family_task_events_append_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'TRUNCATE' then raise exception 'Historique des tâches : effacement interdit.' using errcode = '42501'; end if;
  if tg_op = 'UPDATE' then
    -- Seule exception : un compte supprimé devient anonyme (on delete set null)
    if new.actor_id is null and old.actor_id is not null
       and (new.id, new.task_id, new.household_id, new.kind, new.detail, new.created_at) = (old.id, old.task_id, old.household_id, old.kind, old.detail, old.created_at) then
      return new;
    end if;
    raise exception 'Historique des tâches : une entrée ne se modifie pas.' using errcode = '42501';
  end if;
  -- DELETE : seulement par la suppression de la tâche ou du foyer (cascade)
  if exists (select 1 from public.family_tasks where id = old.task_id) and exists (select 1 from public.households where id = old.household_id) then
    raise exception 'Historique des tâches : une entrée ne s''efface pas.' using errcode = '42501';
  end if;
  return old;
end $$;
revoke execute on function public.family_task_events_append_only() from public, anon, authenticated;
drop trigger if exists family_task_events_append_only on public.family_task_events;
create trigger family_task_events_append_only before update or delete on public.family_task_events
  for each row execute function public.family_task_events_append_only();
drop trigger if exists family_task_events_no_truncate on public.family_task_events;
create trigger family_task_events_no_truncate before truncate on public.family_task_events
  for each statement execute function public.family_task_events_append_only();
revoke insert, update, delete, truncate on public.family_task_events from anon, authenticated;

-- ---------------------------------------------------------------- 2. règles pures (miroir : src/lib/domain/missions.ts)
-- État suivant d'une mission pour une action ; NULL = transition interdite.
create or replace function public._mission_next_state(p_state text, p_action text)
returns text language sql immutable as $$
  select case p_action
    when 'accept'   then case when p_state in ('pending', 'postponed') then 'accepted' end
    when 'start'    then case when p_state in ('pending', 'accepted', 'postponed') then 'in_progress' end
    when 'complete' then case when p_state in ('pending', 'accepted', 'in_progress', 'postponed') then 'done' end
    when 'decline'  then case when p_state in ('pending', 'accepted', 'in_progress', 'postponed') then 'declined' end
    when 'postpone' then case when p_state in ('pending', 'accepted', 'in_progress', 'postponed') then 'postponed' end
    when 'ask'      then case when p_state in ('pending', 'accepted', 'in_progress', 'postponed') then p_state end
    when 'cancel'   then case when p_state in ('pending', 'accepted', 'in_progress', 'postponed', 'declined') then 'cancelled' end
    when 'reassign' then case when p_state in ('pending', 'declined') then 'pending' end
    when 'remind'   then case when p_state in ('pending', 'accepted', 'postponed') then p_state end
  end;
$$;

-- Domaine de responsabilité d'une catégorie (family_domains.key)
create or replace function public._mission_domain_of(p_category text)
returns text language sql immutable as $$
  select case p_category
    when 'shopping' then 'shopping' when 'feeding' then 'meals' when 'diapers' then 'baby' when 'sleep' then 'nights'
    when 'packing' then 'childcare' when 'childcare' then 'childcare' when 'appointments' then 'health' when 'health' then 'health'
    when 'housework' then 'home' when 'organization' then 'home' when 'admin' then 'admin' when 'pets' then 'pets' end;
$$;

-- Peut recevoir une mission : membre du foyer, accès à l'organisation (« lists »), enfant associé autorisé
create or replace function public._mission_can_receive(p_household uuid, p_user uuid, p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members m
                 where m.household_id = p_household and m.user_id = p_user
                   and (m.role = 'owner' or 'lists' = any(m.can_view))
                   and (p_child is null or public._member_child_allowed(m.role, m.child_scope, p_child)));
$$;
revoke execute on function public._mission_can_receive(uuid, uuid, uuid) from public, anon, authenticated;

-- Texte NEUTRE de la notification (miroir : missionNotification() dans src/lib/domain/missions.ts).
-- Écran verrouillé : send-push remplace ce texte par un texte générique, sauf choix explicite de la personne.
create or replace function public._mission_notification(p_type text, p_title text, out title text, out body text)
language sql immutable as $$
  select left(case p_type
      when 'mission.requested' then 'Nouvelle mission : '
      when 'mission.accepted'  then 'Mission acceptée : '
      when 'mission.declined'  then 'Mission non prise : '
      when 'mission.postponed' then 'Autre moment proposé : '
      when 'mission.completed' then 'Mission terminée : '
      when 'mission.cancelled' then 'Mission annulée : '
      when 'mission.question'  then 'Une précision est demandée : '
      when 'mission.reminded'  then 'Petit rappel : '
    end || p_title, 160),
    case p_type
      when 'mission.requested' then 'Ouvrez HOMI pour répondre quand vous le pouvez.'
      when 'mission.declined'  then 'Vous pouvez la proposer à quelqu’un d’autre.'
      when 'mission.postponed' then 'Ouvrez HOMI pour voir le moment proposé.'
      when 'mission.question'  then 'Ouvrez HOMI pour répondre.'
      else 'Ouvrez HOMI pour voir le détail.' end;
$$;

-- ---------------------------------------------------------------- garde : la mission ne change d'état que par ses réponses
create or replace function public._mission_rpc_active()
returns boolean language sql stable as $$
  select coalesce(current_setting('homi.mission_action', true), '') = 'on';
$$;

create or replace function public.family_tasks_mission_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Liens toujours dans le même foyer (tâches et missions)
  if new.child_id is not null and not exists (select 1 from public.children where id = new.child_id and household_id = new.household_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.shopping_item_id is not null and not exists (select 1 from public.shopping_items where id = new.shopping_item_id and household_id = new.household_id) then
    raise exception 'Article de courses introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.document_id is not null and not exists (select 1 from public.documents where id = new.document_id and household_id = new.household_id) then
    raise exception 'Document introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if public._mission_rpc_active() or auth.uid() is null then return new; end if;   -- fonctions serveur, service
  if tg_op = 'INSERT' then
    if new.mission_state is not null then raise exception 'Une mission se crée avec « Nouvelle mission ».' using errcode = '42501'; end if;
    return new;
  end if;
  if old.mission_state is null then
    if new.mission_state is not null then raise exception 'Une tâche devient une mission avec « Nouvelle mission ».' using errcode = '42501'; end if;
    return new;
  end if;
  if (new.mission_state, new.status, new.assignee_id, new.responded_at, new.last_reminded_at)
     is distinct from (old.mission_state, old.status, old.assignee_id, old.responded_at, old.last_reminded_at) then
    raise exception 'Une mission change d''état par ses réponses (accepter, terminer…).' using errcode = '42501';
  end if;
  if auth.uid() is distinct from old.created_by and
     (new.title, new.notes, new.due_at, new.all_day, new.priority, new.category, new.recurrence, new.essential, new.child_id, new.pet_id,
      new.shopping_item_id, new.product_label, new.document_id, new.domain_key)
     is distinct from
     (old.title, old.notes, old.due_at, old.all_day, old.priority, old.category, old.recurrence, old.essential, old.child_id, old.pet_id,
      old.shopping_item_id, old.product_label, old.document_id, old.domain_key) then
    raise exception 'Seule la personne qui a demandé la mission la modifie ; vous pouvez proposer un autre moment.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.family_tasks_mission_guard() from public, anon, authenticated;
drop trigger if exists family_tasks_mission_guard on public.family_tasks;
create trigger family_tasks_mission_guard before insert or update on public.family_tasks
  for each row execute function public.family_tasks_mission_guard();

-- Historique et notifications des tâches (version de 20261019000600 + missions) :
--  * une mission n'est pas notifiée ici (le consommateur des événements le fait, texte neutre) ;
--  * pendant une réponse de mission, mission_respond écrit lui-même l'entrée d'historique (plus précise) ;
--  * mission récurrente terminée : l'occurrence suivante est une mission « À accepter », sans notification
--    (pas de relance automatique) ; le produit associé est repris, l'article de courses non (nouvel achat).
create or replace function public.family_tasks_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_kind text; v_every int; v_next timestamptz; v_rpc boolean := public._mission_rpc_active();
begin
  if tg_op = 'INSERT' then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), 'created', jsonb_build_object('assignee', new.assignee_id) ||
              case when new.mission_state is not null then jsonb_build_object('mission', true) else '{}'::jsonb end);
    if new.mission_state is null then perform public.family_task_notify(new); end if;
    return new;
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
      values (new.id, new.household_id, auth.uid(), case when new.assignee_id is null then 'unassigned' else 'assigned' end,
              jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
    if new.mission_state is null then perform public.family_task_notify(new); end if;
  end if;
  if new.status is distinct from old.status then
    v_kind := case new.status when 'done' then 'done' when 'cancelled' then 'cancelled' else 'reopened' end;
    if not v_rpc then
      insert into public.family_task_events(task_id, household_id, actor_id, kind) values (new.id, new.household_id, auth.uid(), v_kind);
    end if;
    if new.status = 'done' and new.recurrence is not null and new.due_at is not null then
      v_every := coalesce((new.recurrence->>'every')::int, 1);
      v_next := case new.recurrence->>'type'
        when 'daily' then new.due_at + make_interval(days => v_every)
        when 'weekly' then new.due_at + make_interval(weeks => v_every)
        else new.due_at + make_interval(months => v_every) end;
      if not exists (select 1 from public.family_tasks t where t.household_id = new.household_id and t.title = new.title and t.due_at = v_next and t.status = 'todo') then
        insert into public.family_tasks(household_id, title, category, due_at, assignee_id, priority, essential, recurrence, notes, routine_id, created_by,
                                        mission_state, child_id, pet_id, product_label, document_id, domain_key, all_day)
          values (new.household_id, new.title, new.category, v_next, new.assignee_id, new.priority, new.essential, new.recurrence, new.notes, new.routine_id, new.created_by,
                  case when new.mission_state is not null then 'pending' end, new.child_id, new.pet_id, new.product_label, new.document_id, new.domain_key, new.all_day);
      end if;
    end if;
  elsif new.due_at is distinct from old.due_at and old.due_at is not null and new.due_at > old.due_at then
    if not v_rpc then
      insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
        values (new.id, new.household_id, auth.uid(), 'postponed', jsonb_build_object('from', old.due_at, 'to', new.due_at));
    end if;
  elsif not v_rpc and (new.title is distinct from old.title or new.notes is distinct from old.notes or new.priority is distinct from old.priority or new.category is distinct from old.category) then
    insert into public.family_task_events(task_id, household_id, actor_id, kind) values (new.id, new.household_id, auth.uid(), 'updated');
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- 4. consommateur des événements mission.*
create or replace function public._consume_mission_event(e public.household_events)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.family_tasks; n record; v_to uuid; v_open boolean := false; v_list uuid; v_item uuid; v_label text; v_key uuid;
  v_prev text := coalesce(current_setting('homi.mission_action', true), '');
begin
  select * into t from public.family_tasks where id = nullif(e.payload ->> 'task_id', '')::uuid and household_id = e.household_id;
  if not found then return; end if;                                  -- mission supprimée entre-temps : rien à faire

  -- a) Notification au bon destinataire (texte neutre ; jamais à l'auteur du fait ; une seule fois par événement)
  v_to := case e.type::text
    when 'mission.requested' then t.assignee_id
    when 'mission.reminded'  then t.assignee_id
    when 'mission.cancelled' then t.assignee_id
    when 'mission.started'   then null
    else t.created_by end;
  v_open := e.type::text = 'mission.requested' and t.assignee_id is null;   -- mission « à prendre » : tout le foyer concerné
  if e.type::text <> 'mission.started' and (v_to is not null or v_open) then
    select * into n from public._mission_notification(e.type::text, t.title);
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      select m.user_id, 'family', n.title, n.body, '/family/missions/' || t.id,
             jsonb_build_object('task_id', t.id, 'event_id', e.id, 'mission', e.type::text)
      from public.household_members m
      where m.household_id = t.household_id
        and m.user_id is distinct from e.actor_id
        and (case when v_open then m.user_id is distinct from t.created_by else m.user_id = v_to end)
        and (m.role = 'owner' or 'lists' = any(m.can_view))
        and (t.child_id is null or public._member_child_allowed(m.role, m.child_scope, t.child_id))
        and not exists (select 1 from public.notifications x where x.user_id = m.user_id and x.payload ->> 'event_id' = e.id::text);
  end if;

  -- b) Mission d'achat acceptée (ou commencée) : l'article de courses lié existe, une seule fois
  if e.type::text in ('mission.accepted', 'mission.started') and t.shopping_item_id is null and t.mission_state in ('accepted', 'in_progress')
     and (t.product_label is not null or t.category = 'shopping') then
    v_label := left(btrim(coalesce(t.product_label, t.title)), 120);
    select id into v_list from public.shopping_lists where household_id = t.household_id order by created_at desc limit 1;
    if v_list is null then
      insert into public.shopping_lists(household_id, title, created_by) values (t.household_id, 'Courses', coalesce(e.actor_id, t.created_by))
        returning id into v_list;
    end if;
    -- Article identique déjà sur la liste (pas encore acheté) : on s'y rattache au lieu d'en créer un second
    select id into v_item from public.shopping_items
      where list_id = v_list and not checked and lower(btrim(label)) = lower(v_label) order by position, id limit 1;
    if v_item is null then
      v_key := md5('mission-item:' || t.id::text)::uuid;               -- même mission = même article, même rejoué
      insert into public.shopping_items(list_id, household_id, label, client_id, position)
        values (v_list, t.household_id, v_label, v_key, coalesce((select max(position) + 1 from public.shopping_items where list_id = v_list), 0))
        on conflict (household_id, client_id) do nothing
        returning id into v_item;
      if v_item is null then select id into v_item from public.shopping_items where household_id = t.household_id and client_id = v_key; end if;
    end if;
    perform set_config('homi.mission_action', 'on', true);
    update public.family_tasks set shopping_item_id = v_item where id = t.id and shopping_item_id is null;
    perform set_config('homi.mission_action', v_prev, true);
  end if;

  -- c) Mission terminée : l'article lié est coché (une seule fois ; jamais décoché par ce chemin)
  if e.type::text = 'mission.completed' and t.shopping_item_id is not null then
    update public.shopping_items set checked = true, checked_by = coalesce(e.actor_id, checked_by), checked_at = now()
      where id = t.shopping_item_id and household_id = t.household_id and not checked;
  end if;
end $$;
revoke execute on function public._consume_mission_event(public.household_events) from public, anon, authenticated;

-- Traite UN événement tout de suite (après son émission), erreur isolée : en cas d'échec il redevient « à traiter »
-- (nouvel essai par process_household_events) et la saisie métier n'est jamais annulée.
create or replace function public._dispatch_household_event(p_event uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e public.household_events;
begin
  update public.household_events set status = 'processing', attempts = attempts + 1
   where id = p_event and status = 'pending' and available_at <= now()
   returning * into e;
  if not found then return; end if;                                  -- déjà traité, sauté (anti-boucle) ou réservé ailleurs
  begin
    perform public._begin_event_processing(e.id);
    if e.type::text like 'mission.%' then perform public._consume_mission_event(e); end if;
    perform public._begin_event_processing(null);
    perform public.finish_household_event(e.id, true);
  exception when others then
    perform public._begin_event_processing(null);
    perform public.finish_household_event(e.id, false, sqlerrm);
  end;
end $$;
revoke execute on function public._dispatch_household_event(uuid) from public, anon, authenticated;

-- Passage planifié (serveur : pg_cron ou fonction planifiée, non déployé ici) : traite ce qui attend encore.
create or replace function public.process_household_events(p_limit int default 100)
returns int language plpgsql security definer set search_path = public as $$
declare e public.household_events; v_n int := 0;
begin
  for e in select * from public.claim_household_events(p_limit, array['mission.requested', 'mission.accepted', 'mission.declined',
      'mission.postponed', 'mission.started', 'mission.completed', 'mission.cancelled', 'mission.question', 'mission.reminded']::public.household_event_type[])
  loop
    begin
      perform public._begin_event_processing(e.id);
      perform public._consume_mission_event(e);
      perform public._begin_event_processing(null);
      perform public.finish_household_event(e.id, true);
      v_n := v_n + 1;
    exception when others then
      perform public._begin_event_processing(null);
      perform public.finish_household_event(e.id, false, sqlerrm);
    end;
  end loop;
  return v_n;
end $$;
revoke execute on function public.process_household_events(int) from public, anon, authenticated;
grant execute on function public.process_household_events(int) to service_role;

-- ---------------------------------------------------------------- RPC : créer une mission
create or replace function public.create_mission(
  p_household uuid, p_title text, p_assignee uuid default null, p_category text default 'other', p_notes text default null,
  p_due_at timestamptz default null, p_all_day boolean default false, p_priority text default 'normal', p_recurrence jsonb default null,
  p_child_id uuid default null, p_pet_id uuid default null, p_shopping_item_id uuid default null, p_product_label text default null,
  p_document_id uuid default null, p_domain_key text default null, p_client_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_domain text; v_assignee uuid := p_assignee; t public.family_tasks; v_event uuid;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if not public.can_access_household(p_household, 'lists', true) then
    raise exception 'Vous ne pouvez pas créer de mission dans ce foyer.' using errcode = '42501';
  end if;
  -- Rejoué (double appui, nouvel essai après une coupure) : la mission déjà créée est renvoyée, rien de neuf
  if p_client_id is not null then
    select * into t from public.family_tasks where household_id = p_household and client_id = p_client_id;
    if found then return to_jsonb(t); end if;
  end if;
  if p_child_id is not null and not public.can_access_child(p_child_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  v_domain := coalesce(p_domain_key, public._mission_domain_of(p_category));
  -- Responsable du domaine : la mission lui arrive sans que personne n'ait à organiser le travail de l'autre
  if v_assignee is null and v_domain is not null then
    select d.owner_id into v_assignee from public.family_domains d
     where d.household_id = p_household and d.key = v_domain and d.owner_id is distinct from v_uid
       and public._mission_can_receive(p_household, d.owner_id, p_child_id);
  end if;
  if v_assignee = v_uid then
    raise exception 'Une mission s''adresse à quelqu''un d''autre ; pour vous-même, notez une tâche.' using errcode = '22023';
  end if;
  if v_assignee is not null and not public._mission_can_receive(p_household, v_assignee, p_child_id) then
    raise exception 'Cette personne ne peut pas recevoir cette mission (hors du foyer, sans accès à l''organisation ou à cet enfant).' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 1000 then raise exception 'Description trop longue.' using errcode = '22023'; end if;

  perform set_config('homi.mission_action', 'on', true);
  insert into public.family_tasks(household_id, title, category, due_at, all_day, assignee_id, priority, recurrence, notes, child_id, pet_id,
                                  shopping_item_id, product_label, document_id, domain_key, client_id, mission_state, status)
  values (p_household, btrim(p_title), coalesce(p_category, 'other'), p_due_at, coalesce(p_all_day, false), v_assignee, coalesce(p_priority, 'normal'),
          p_recurrence, nullif(btrim(p_notes), ''), p_child_id, p_pet_id, p_shopping_item_id, nullif(btrim(p_product_label), ''), p_document_id,
          v_domain, p_client_id, 'pending', 'todo')
  returning * into t;
  perform set_config('homi.mission_action', '', true);

  v_event := public._emit_household_event(t.household_id, 'mission.requested', 'family_tasks', t.id::text,
    jsonb_build_object('task_id', t.id, 'title', t.title, 'assignee_id', t.assignee_id, 'created_by', t.created_by, 'category', t.category,
                       'due_at', t.due_at, 'child_id', t.child_id, 'domain_key', t.domain_key),
    'mission.requested:' || t.id || ':created');
  perform public._dispatch_household_event(v_event);
  select * into t from public.family_tasks where id = t.id;
  return to_jsonb(t);
end $$;
revoke execute on function public.create_mission(uuid, text, uuid, text, text, timestamptz, boolean, text, jsonb, uuid, uuid, uuid, text, uuid, text, uuid) from public, anon;
grant execute on function public.create_mission(uuid, text, uuid, text, text, timestamptz, boolean, text, jsonb, uuid, uuid, uuid, text, uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------- RPC : répondre / agir sur une mission
-- Actions : accept · decline · postpone (p_due_at) · start · complete · ask (p_note) — destinataire
--           cancel · reassign (p_assignee) · remind (1 par 24 h) — créateur
-- Résultat : { status: ok | not_found | conflict, row?, unchanged? } ; refus de droit ou de transition = erreur explicite.
create or replace function public.mission_respond(p_task uuid, p_action text, p_note text default null, p_due_at timestamptz default null,
  p_assignee uuid default null, p_expected_version integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); t public.family_tasks; m public.household_members; v_next text; v_target text; v_kind text; v_type text;
  v_log uuid; v_event uuid; v_assignee uuid; v_creator_action boolean := p_action in ('cancel', 'reassign', 'remind');
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_action not in ('accept', 'decline', 'postpone', 'start', 'complete', 'ask', 'cancel', 'reassign', 'remind') then
    raise exception 'Action inconnue : %', p_action using errcode = '22023';
  end if;
  select * into t from public.family_tasks where id = p_task for update;
  if not found or t.mission_state is null then return jsonb_build_object('status', 'not_found'); end if;
  -- Ce que la personne ne peut pas voir n'existe pas pour elle (autre foyer, ex-membre, enfant non confié)
  select * into m from public.household_members where household_id = t.household_id and user_id = v_uid;
  if not found or not (m.role = 'owner' or 'lists' = any(m.can_view))
     or (t.child_id is not null and not public._member_child_allowed(m.role, m.child_scope, t.child_id)) then
    return jsonb_build_object('status', 'not_found');
  end if;
  if p_expected_version is not null and p_expected_version <> t.version then
    return jsonb_build_object('status', 'conflict', 'row', to_jsonb(t));
  end if;

  if v_creator_action then
    if v_uid is distinct from t.created_by then
      raise exception 'Seule la personne qui a demandé la mission peut faire cela.' using errcode = '42501';
    end if;
  elsif t.assignee_id is null then
    -- Mission « à prendre » : quelqu'un d'autre que le créateur la prend (accepter, commencer ou terminer)
    if v_uid = t.created_by or p_action not in ('accept', 'start', 'complete') then
      raise exception 'Cette mission attend que quelqu''un la prenne.' using errcode = '42501';
    end if;
  elsif t.assignee_id <> v_uid then
    raise exception 'Cette mission s''adresse à quelqu''un d''autre.' using errcode = '42501';
  end if;

  v_next := public._mission_next_state(t.mission_state, p_action);
  v_target := case p_action when 'accept' then 'accepted' when 'start' then 'in_progress' when 'complete' then 'done'
                            when 'decline' then 'declined' when 'cancel' then 'cancelled' end;
  if v_next is null then
    -- Même réponse rejouée (double appui, file hors ligne) : rien de neuf, pas d'erreur
    if v_target is not null and t.mission_state = v_target then
      return jsonb_build_object('status', 'ok', 'unchanged', true, 'row', to_jsonb(t));
    end if;
    raise exception 'Cette réponse n''est plus possible (mission « %s »).', t.mission_state using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 300 then raise exception 'Message trop long (300 caractères).' using errcode = '22023'; end if;
  if p_action = 'postpone' and (p_due_at is null or p_due_at < now() - interval '5 minutes') then
    raise exception 'Choisissez un moment à venir.' using errcode = '22023';
  end if;
  if p_action = 'remind' and t.last_reminded_at is not null and t.last_reminded_at > now() - interval '24 hours' then
    raise exception 'Un seul rappel par jour : la personne a déjà été prévenue.' using errcode = '22023';
  end if;
  v_assignee := case when p_action = 'reassign' then p_assignee
                     when t.assignee_id is null and p_action in ('accept', 'start', 'complete') then v_uid
                     else t.assignee_id end;
  if p_action = 'reassign' and (p_assignee is null or p_assignee = t.created_by or not public._mission_can_receive(t.household_id, p_assignee, t.child_id)) then
    raise exception 'Cette personne ne peut pas recevoir cette mission.' using errcode = '22023';
  end if;

  perform set_config('homi.mission_action', 'on', true);
  update public.family_tasks set
    mission_state = v_next,
    status = case v_next when 'done' then 'done' when 'cancelled' then 'cancelled' else 'todo' end,
    assignee_id = v_assignee,
    due_at = case when p_action = 'postpone' then p_due_at else due_at end,
    responded_at = case when p_action in ('accept', 'decline', 'postpone', 'start', 'complete') then now() else responded_at end,
    last_reminded_at = case when p_action = 'remind' then now() else last_reminded_at end
  where id = t.id
  returning * into t;
  perform set_config('homi.mission_action', '', true);

  -- Historique horodaté (ajout seul)
  v_kind := case p_action when 'accept' then 'accepted' when 'decline' then 'declined' when 'postpone' then 'postponed' when 'start' then 'started'
                          when 'complete' then 'done' when 'ask' then 'question' when 'cancel' then 'cancelled' when 'reassign' then 'assigned' else 'reminded' end;
  insert into public.family_task_events(task_id, household_id, actor_id, kind, detail)
    values (t.id, t.household_id, v_uid, v_kind, jsonb_strip_nulls(jsonb_build_object('mission', true, 'action', p_action, 'state', v_next,
            'note', nullif(btrim(p_note), ''), 'to', case when p_action = 'postpone' then to_jsonb(p_due_at) when p_action = 'reassign' then to_jsonb(p_assignee) end)))
    returning id into v_log;

  -- Fait métier publié une fois (clé = entrée d'historique), traité par le consommateur
  v_type := case p_action when 'accept' then 'mission.accepted' when 'decline' then 'mission.declined' when 'postpone' then 'mission.postponed'
                          when 'start' then 'mission.started' when 'complete' then 'mission.completed' when 'ask' then 'mission.question'
                          when 'cancel' then 'mission.cancelled' when 'reassign' then 'mission.requested' else 'mission.reminded' end;
  v_event := public._emit_household_event(t.household_id, v_type::public.household_event_type, 'family_tasks', t.id::text,
    jsonb_strip_nulls(jsonb_build_object('task_id', t.id, 'title', t.title, 'state', v_next, 'assignee_id', t.assignee_id, 'created_by', t.created_by,
                                         'due_at', t.due_at, 'shopping_item_id', t.shopping_item_id)),
    v_type || ':' || t.id || ':' || v_log);
  perform public._dispatch_household_event(v_event);
  select * into t from public.family_tasks where id = t.id;
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(t));
end $$;
revoke execute on function public.mission_respond(uuid, text, text, timestamptz, uuid, integer) from public, anon;
grant execute on function public.mission_respond(uuid, text, text, timestamptz, uuid, integer) to authenticated;
