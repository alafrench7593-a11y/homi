-- =====================================================================================================================
-- Confidentialité entre adultes du foyer, profil familial, missions terminées (19/11/2026). Migration ADDITIVE :
-- colonnes nullables / avec défaut, politiques RESTRICTIVES ajoutées, fonctions remplacées ; aucune donnée réécrite.
-- Principe : la confidentialité suit la PROPRIÉTÉ de la donnée (jamais le genre ni le rôle). Les données privées d'un
-- adulte ne sont lisibles que par lui ; les données familiales par les membres autorisés ; un partage volontaire
-- seulement par ses destinataires. Appartenir au même foyer ne donne jamais un accès global.
-- =====================================================================================================================

-- ---------------------------------------------------------------- 0. utilitaires
-- Adulte (propriétaire ou co-parent) ACTIF du foyer : un membre retiré perd tout, immédiatement.
create or replace function public._is_parent_in(p_household uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select p_household is not null and p_user is not null and exists (
    select 1 from public.household_members m where m.household_id = p_household and m.user_id = p_user and m.role in ('owner', 'coparent'));
$$;
revoke execute on function public._is_parent_in(uuid, uuid) from public, anon;
grant execute on function public._is_parent_in(uuid, uuid) to authenticated;

-- Prénom affiché (premier mot, 40 caractères) : sert aux textes de notification, rien d'autre du profil.
create or replace function public._first_name_of(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select nullif(left(split_part(btrim(regexp_replace(coalesce(p.display_name, ''), '\s+', ' ', 'g')), ' ', 1), 40), '')
  from public.profiles p where p.id = p_user;
$$;
revoke execute on function public._first_name_of(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- 1. grossesse : donnée de la personne enceinte
-- Avant : tout adulte du foyer avec pregnancy_access (vrai par défaut pour un co-parent) et la propriétaire du foyer
-- lisaient la grossesse d'une autre personne, sans qu'elle l'ait choisi. Désormais, quand la grossesse a une
-- personne enceinte identifiée (carrier_user_id), seule elle la lit… sauf partage explicite de SA part :
--  * share_basics  : terme, semaine, rendez-vous et liste de grossesse, profil « bébé à venir » ;
--  * share_medical : notes et documents rattachés à la grossesse (désactivé par défaut).
-- NULL = pas encore choisi = non partagé. Grossesse sans personne identifiée (carrier_user_id NULL, profil créé pour
-- le foyer) : règle d'avant inchangée.
alter table public.pregnancies add column if not exists share_basics boolean;
alter table public.pregnancies add column if not exists share_medical boolean;
comment on column public.pregnancies.share_basics is 'Partage choisi par la personne enceinte : terme, semaine, rendez-vous (NULL = non partagé).';
comment on column public.pregnancies.share_medical is 'Partage choisi par la personne enceinte : notes et documents de grossesse (NULL = non partagé).';

create or replace function public._pregnancy_visible(p_household uuid, p_carrier uuid, p_shared boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid()
      and (p_carrier = auth.uid()
           or ((m.role = 'owner' or m.pregnancy_access) and (p_carrier is null or coalesce(p_shared, false)))));
$$;
revoke execute on function public._pregnancy_visible(uuid, uuid, boolean) from public, anon;
grant execute on function public._pregnancy_visible(uuid, uuid, boolean) to authenticated;

-- Même signature qu'avant (utilisée par les politiques des tables à pregnancy_id) : partage « essentiel ».
create or replace function public.can_access_pregnancy(p_pregnancy uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pregnancies p
                 where p.id = p_pregnancy and public._pregnancy_visible(p.household_id, p.carrier_user_id, p.share_basics));
$$;

-- Notes et documents d'une grossesse : partage « médical » (ou l'autrice / la personne qui a déposé le document).
create or replace function public._pregnancy_medical_access(p_pregnancy uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pregnancies p
                 where p.id = p_pregnancy and public._pregnancy_visible(p.household_id, p.carrier_user_id, p.share_medical));
$$;
revoke execute on function public._pregnancy_medical_access(uuid) from public, anon;
grant execute on function public._pregnancy_medical_access(uuid) to authenticated;

drop policy if exists pregnancies_scope on public.pregnancies;
create policy pregnancies_scope on public.pregnancies as restrictive for all to authenticated
  using (public._pregnancy_visible(household_id, carrier_user_id, share_basics)) with check (true);

drop policy if exists notes_pregnancy_medical on public.notes;
create policy notes_pregnancy_medical on public.notes as restrictive for all to authenticated
  using (pregnancy_id is null or author_id = auth.uid() or public._pregnancy_medical_access(pregnancy_id)) with check (true);
drop policy if exists documents_pregnancy_medical on public.documents;
create policy documents_pregnancy_medical on public.documents as restrictive for all to authenticated
  using (pregnancy_id is null or uploaded_by = auth.uid() or public._pregnancy_medical_access(pregnancy_id)) with check (true);

-- Seule la personne enceinte change ses partages (ou la propriétaire pour une grossesse sans personne identifiée).
create or replace function public.pregnancies_share_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;                                   -- service, fonctions serveur
  if (new.share_basics, new.share_medical) is distinct from (old.share_basics, old.share_medical)
     and auth.uid() is distinct from coalesce(old.carrier_user_id, case when public.is_household_owner(old.household_id) then auth.uid() end) then
    raise exception 'Seule la personne concernée choisit ce qu''elle partage de sa grossesse.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.pregnancies_share_guard() from public, anon, authenticated;
drop trigger if exists pregnancies_share_guard on public.pregnancies;
create trigger pregnancies_share_guard before update of share_basics, share_medical on public.pregnancies
  for each row execute function public.pregnancies_share_guard();

-- Réglage depuis « Mes informations » (la personne enceinte n'a pas forcément le droit d'écrire le domaine grossesse).
create or replace function public.set_pregnancy_sharing(p_pregnancy uuid, p_basics boolean, p_medical boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p public.pregnancies;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into p from public.pregnancies where id = p_pregnancy for update;
  if not found or p.carrier_user_id is distinct from auth.uid() then
    raise exception 'Seule la personne concernée choisit ce qu''elle partage de sa grossesse.' using errcode = '42501';
  end if;
  update public.pregnancies set share_basics = coalesce(p_basics, false), share_medical = coalesce(p_medical, false) and coalesce(p_basics, false)
   where id = p_pregnancy;
end $$;
revoke execute on function public.set_pregnancy_sharing(uuid, boolean, boolean) from public, anon;
grant execute on function public.set_pregnancy_sharing(uuid, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------- 2. rendez-vous personnels d'un adulte
-- Avant : un rendez-vous « pour moi » (for_parent, ex. gynécologue, psychologue) était lisible par tout membre ayant
-- le domaine santé, sauf case « privé » cochée. Désormais : réservé à son autrice, sauf partage explicite.
alter table public.appointments add column if not exists shared_with_household boolean;
comment on column public.appointments.shared_with_household is 'Rendez-vous « pour moi » partagé volontairement avec le foyer (NULL = non).';
drop policy if exists appointments_for_parent_owner on public.appointments;
create policy appointments_for_parent_owner on public.appointments as restrictive for all to authenticated
  using (not for_parent or created_by = auth.uid() or coalesce(shared_with_household, false)) with check (true);

-- ---------------------------------------------------------------- 3. post-partum partagé : les parents seulement
-- Avant : tout membre (nounou comprise) lisait l'état partagé (besoin de repos, résumé). Partage destiné à l'autre
-- adulte : la personne elle-même et les parents actifs du foyer.
drop policy if exists postpartum_shared_parents on public.postpartum_shared_status;
create policy postpartum_shared_parents on public.postpartum_shared_status as restrictive for select to authenticated
  using (user_id = auth.uid() or public._is_parent_in(household_id));

-- ---------------------------------------------------------------- 4. profil familial visible et réglages de partage
create table if not exists public.family_member_profiles (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  family_label text check (family_label is null or char_length(btrim(family_label)) between 1 and 24),
  share_missions boolean not null default true,
  share_domains boolean not null default true,
  share_availability boolean not null default false,
  share_calendar boolean not null default true,
  share_activities boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists family_member_profiles_user_idx on public.family_member_profiles(user_id);
alter table public.family_member_profiles enable row level security;
drop policy if exists family_member_profiles_read on public.family_member_profiles;
create policy family_member_profiles_read on public.family_member_profiles for select to authenticated
  using (user_id = auth.uid() or (public.is_household_member(household_id) and public.is_member_of(household_id, user_id)));
drop policy if exists family_member_profiles_own on public.family_member_profiles;
create policy family_member_profiles_own on public.family_member_profiles for all to authenticated
  using (user_id = auth.uid() and public.is_household_member(household_id))
  with check (user_id = auth.uid() and public.is_household_member(household_id));
revoke all on public.family_member_profiles from anon;
grant select, insert, update, delete on public.family_member_profiles to authenticated;
-- Un adulte retiré du foyer : son profil familial de ce foyer disparaît avec lui (aucune trace exposée ensuite).
create or replace function public.family_member_profiles_on_leave()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.family_member_profiles where household_id = old.household_id and user_id = old.user_id;
  return old;
end $$;
revoke execute on function public.family_member_profiles_on_leave() from public, anon, authenticated;
drop trigger if exists family_member_profiles_on_leave on public.household_members;
create trigger family_member_profiles_on_leave after delete on public.household_members
  for each row execute function public.family_member_profiles_on_leave();

-- ---------------------------------------------------------------- 5. préférences de notification
alter table public.notification_settings add column if not exists mission_done boolean not null default true;
alter table public.notification_settings add column if not exists couple_discreet boolean not null default false;
comment on column public.notification_settings.mission_done is '« <Prénom> a terminé : <mission> » pour les missions que j''ai demandées.';
comment on column public.notification_settings.couple_discreet is 'Se comprendre : notification sans le prénom de l''expéditeur.';

-- ---------------------------------------------------------------- 6. missions terminées
-- Historique « Terminées » paginé (Famille → Missions → Terminées) sans charger l'écran principal.
create index if not exists family_tasks_mission_done_idx on public.family_tasks (household_id, done_at desc) where mission_state = 'done';

-- Consommateur des événements mission.* (version de 20261115000200_courses_stocks.sql) + :
--  * « <Prénom> a terminé : <mission> » ;
--  * seulement si la demandeuse a gardé ce type de notification (notification_settings.mission_done).
create or replace function public._consume_mission_event(e public.household_events)
returns void language plpgsql security definer set search_path = public as $function$
declare
  t public.family_tasks; n record; v_to uuid; v_open boolean := false; v_list uuid; v_item uuid; v_label text; v_key uuid; v_stock uuid;
  v_prev text := coalesce(current_setting('homi.mission_action', true), '');
begin
  select * into t from public.family_tasks where id = nullif(e.payload ->> 'task_id', '')::uuid and household_id = e.household_id;
  if not found then return; end if;

  -- a) Notification au bon destinataire (texte neutre ; jamais à l'auteur du fait ; une seule fois par événement)
  v_to := case e.type::text
    when 'mission.requested' then t.assignee_id
    when 'mission.reminded'  then t.assignee_id
    when 'mission.cancelled' then t.assignee_id
    when 'mission.started'   then null
    else t.created_by end;
  v_open := e.type::text = 'mission.requested' and t.assignee_id is null;
  if e.type::text <> 'mission.started' and (v_to is not null or v_open) then
    select * into n from public._mission_notification(e.type::text, t.title);
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      select m.user_id, 'family',
             -- Mission terminée : « <Prénom> a terminé : <mission> » (prénom affiché de la personne qui l'a faite)
             case when e.type::text = 'mission.completed' then left(coalesce(public._first_name_of(e.actor_id), 'Quelqu’un') || ' a terminé : ' || t.title, 160) else n.title end,
             n.body, '/family/missions/' || t.id,
             jsonb_build_object('task_id', t.id, 'event_id', e.id, 'mission', e.type::text)
      from public.household_members m
      where m.household_id = t.household_id
        and m.user_id is distinct from e.actor_id
        and (case when v_open then m.user_id is distinct from t.created_by else m.user_id = v_to end)
        and (m.role = 'owner' or 'lists' = any(m.can_view))
        and (t.child_id is null or public._member_child_allowed(m.role, m.child_scope, t.child_id))
        -- préférence de la personne : « Mission terminée » seulement si elle l'a gardée active (par défaut : oui)
        and not (e.type::text = 'mission.completed'
                 and exists (select 1 from public.notification_settings s where s.user_id = m.user_id and not s.mission_done))
        and not exists (select 1 from public.notifications x where x.user_id = m.user_id and x.payload ->> 'event_id' = e.id::text);
  end if;

  -- b) Mission d'achat acceptée (ou commencée) : l'article de courses lié existe, une seule fois, relié au stock
  if e.type::text in ('mission.accepted', 'mission.started') and t.shopping_item_id is null and t.mission_state in ('accepted', 'in_progress')
     and (t.product_label is not null or t.category = 'shopping') then
    v_label := left(btrim(coalesce(t.product_label, t.title)), 120);
    v_stock := coalesce(t.stock_id, public._stock_match(t.household_id, v_label));
    select id into v_list from public.shopping_lists where household_id = t.household_id order by created_at desc limit 1;
    if v_list is null then
      insert into public.shopping_lists(household_id, title, created_by) values (t.household_id, 'Courses', coalesce(e.actor_id, t.created_by))
        returning id into v_list;
    end if;
    select id into v_item from public.shopping_items
      where list_id = v_list and not checked and public._norm_label(label) = public._norm_label(v_label) order by position, id limit 1;
    if v_item is null then
      v_key := md5('mission-item:' || t.id::text)::uuid;
      insert into public.shopping_items(list_id, household_id, label, client_id, position, stock_id, category, assignee_id)
        values (v_list, t.household_id, v_label, v_key, coalesce((select max(position) + 1 from public.shopping_items where list_id = v_list), 0),
                v_stock, (select category from public.household_stocks where id = v_stock), t.assignee_id)
        on conflict (household_id, client_id) do nothing
        returning id into v_item;
      if v_item is null then select id into v_item from public.shopping_items where household_id = t.household_id and client_id = v_key; end if;
    elsif v_stock is not null then
      update public.shopping_items set stock_id = v_stock where id = v_item and stock_id is null;
    end if;
    perform set_config('homi.mission_action', 'on', true);
    update public.family_tasks set shopping_item_id = v_item where id = t.id and shopping_item_id is null;
    perform set_config('homi.mission_action', v_prev, true);
  end if;

  -- c) Mission terminée : l'article lié est coché (une seule fois ; jamais décoché par ce chemin). Le fait
  --    shopping.item_checked qui en découle retrouvera la mission déjà terminée : aucune boucle.
  if e.type::text = 'mission.completed' and t.shopping_item_id is not null then
    update public.shopping_items set checked = true, checked_by = coalesce(e.actor_id, checked_by), checked_at = now()
      where id = t.shopping_item_id and household_id = t.household_id and not checked;
  end if;
end $function$;
revoke execute on function public._consume_mission_event(public.household_events) from public, anon, authenticated;
