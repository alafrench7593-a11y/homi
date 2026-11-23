-- =====================================================================
-- Audit n°3 « Sécurité backend et permissions » (17/11/2026) — correctifs
-- Rapport : docs/audit/03_securite_backend.md ; tests : supabase/tests/sql/98x_audit_securite_failles.sql (reproductions)
-- et 98z_securite_generique.sql (vérifications génériques sur toutes les tables).
--
--   S1 critique : export_my_data() (security definer) recopiait TOUT le foyer, sans domaine, sans périmètre d'enfants,
--                 sans partage de document ni grossesse fermée : une nounou ou un co-parent limité exportait ce qu'il
--                 ne peut pas lire. → l'export brut (_export_my_data_raw, inchangé) n'est appelable que par
--                 export_my_data(), devenue security INVOKER : elle retire chaque ligne de foyer (id + household_id)
--                 que la personne ne peut pas lire SOUS RLS, sauf si elle en est l'autrice.
--   S2 critique : household_members.user_id / household_id / joined_at modifiables par la propriétaire → inscription
--                 forcée de n'importe quel compte (identifiant visible dans la communauté) : prénom, photo de profil,
--                 notifications, partage du Premium de la victime. → figés pour un client.
--   S3 haute    : calendar_feed_data() ignorait le périmètre d'enfants et de grossesse (titres de tâches, événements,
--                 rendez-vous d'un enfant non confié dans l'agenda externe de la nounou). → filtres ajoutés.
--   S4 haute    : pregnancies.carrier_user_id libre → un co-parent ouvrait la grossesse à la nounou (contournement de
--                 l'accord explicite de la propriétaire) et la fermait à la mère. → seule la propriétaire désigne une
--                 autre personne ; chacun peut se désigner soi-même ou retirer la porteuse s'il est la porteuse.
--   S5 haute    : family_tasks.created_by falsifiable → le destinataire d'une mission s'en déclarait l'auteur, puis
--                 l'annulait, la réattribuait ou la modifiait ; usurpation du « demandé par ».
--   S6 moyenne  : documents.uploaded_by modifiable → la propriétaire confisquait le document d'un co-parent (privé à
--                 elle-même) et contournait l'accord « lecture automatique » du vrai déposant.
--   S7 basse    : auteurs falsifiables sur les saisies du foyer (created_by, logged_by, done_by des routines…).
--      → S5-S7 : déclencheur _keep_author : pour une écriture DIRECTE d'un client (rôle authenticated), l'auteur est la
--        personne connectée à la création et ne change plus ensuite. Le code serveur (fonctions security definer,
--        service) n'est pas concerné.
--   S8 basse    : create_mission rejouée avec le client_id d'une mission d'un enfant non confié la renvoyait en entier.
--   S9 basse    : fonctions security definer exécutables par anon sans nécessité (défense en profondeur).
--
-- Retour arrière (après accord) : drop trigger … _keep_author sur les tables listées en 3 ; drop function
--   public._keep_author(), public._household_members_identity_guard(), public._pregnancies_carrier_guard(),
--   public._export_prune(jsonb, uuid[], text) ; restaurer export_my_data (security definer) depuis
--   20261115000200_courses_stocks.sql, calendar_feed_data depuis 20261021000300_calendar_feeds.sql (ou sa dernière
--   version), create_mission depuis 20261114000300_missions.sql ; regrant execute … to anon si nécessaire.
-- =====================================================================

-- ---------------------------------------------------------------- S2. identité d'un membre figée
-- security INVOKER (comme _keep_author ci-dessous) : seule une écriture directe d'un client est concernée.
create or replace function public._household_members_identity_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.user_id, new.household_id, new.joined_at) is distinct from (old.user_id, old.household_id, old.joined_at) then
    raise exception 'Un membre ne se remplace pas : retirez-le puis invitez la bonne personne.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._household_members_identity_guard() from public, anon, authenticated;
drop trigger if exists household_members_identity_guard on public.household_members;
create trigger household_members_identity_guard before update on public.household_members
  for each row execute function public._household_members_identity_guard();

-- ---------------------------------------------------------------- S4. porteuse de la grossesse
create or replace function public._pregnancies_carrier_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_owner boolean;
begin
  if v_uid is null then return new; end if;                                   -- serveur, service
  if tg_op = 'UPDATE' and new.carrier_user_id is not distinct from old.carrier_user_id then return new; end if;
  v_owner := public.is_household_owner(new.household_id);
  -- Changer une porteuse déjà désignée : la propriétaire ou la porteuse elle-même
  if tg_op = 'UPDATE' and old.carrier_user_id is not null and not v_owner and old.carrier_user_id <> v_uid then
    raise exception 'Seule la propriétaire du foyer (ou la porteuse) change la porteuse de la grossesse.' using errcode = '42501';
  end if;
  -- Désigner quelqu'un d'autre que soi : la propriétaire, et seulement un membre du foyer
  if new.carrier_user_id is not null and new.carrier_user_id <> v_uid
     and not (v_owner and exists (select 1 from public.household_members m where m.household_id = new.household_id and m.user_id = new.carrier_user_id)) then
    raise exception 'Seule la propriétaire du foyer désigne une autre personne comme porteuse.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._pregnancies_carrier_guard() from public, anon, authenticated;
drop trigger if exists pregnancies_carrier_guard on public.pregnancies;
create trigger pregnancies_carrier_guard before insert or update of carrier_user_id on public.pregnancies
  for each row execute function public._pregnancies_carrier_guard();

-- ---------------------------------------------------------------- S5-S7. auteurs posés par le serveur
-- security INVOKER volontairement : current_user vaut « authenticated » pour une écriture directe de l'application,
-- et le propriétaire des fonctions pour le code serveur (security definer), qui garde la main sur ces colonnes.
create or replace function public._keep_author()
returns trigger language plpgsql set search_path = public as $$
declare v_col text := tg_argv[0]; v_new jsonb := to_jsonb(new); v_val uuid;
begin
  if current_user not in ('authenticated', 'anon') or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    v_val := auth.uid();
  else
    v_val := nullif(to_jsonb(old) ->> v_col, '')::uuid;
  end if;
  if (v_new ->> v_col) is distinct from v_val::text then
    new := jsonb_populate_record(new, jsonb_build_object(v_col, v_val));
  end if;
  return new;
end $$;
revoke execute on function public._keep_author() from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select c.relname, a.attname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not a.attisdropped and a.atttypid = 'uuid'::regtype
             and (a.attname in ('created_by', 'uploaded_by', 'logged_by') or (c.relname = 'kid_routine_checks' and a.attname = 'done_by'))
             and exists (select 1 from pg_attribute h where h.attrelid = c.oid and h.attname = 'household_id' and not h.attisdropped)
           order by 1 loop
    execute format('drop trigger if exists %I on public.%I', r.relname || '_keep_author', r.relname);
    -- <table>_keep_author passe avant les gardes « …_mission_guard », « …_stock_guard » (ordre alphabétique) ;
    -- celles-ci comparent de toute façon à l'ancienne ligne (old)
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._keep_author(%L)',
                   r.relname || '_keep_author', r.relname, r.attname);
  end loop;
end $$;
-- invitations : posées par create_household_invitation (serveur) ; la propriétaire ne change pas l'invitant
drop trigger if exists household_invitations_keep_author on public.household_invitations;
create trigger household_invitations_keep_author before update on public.household_invitations
  for each row execute function public._keep_author('invited_by');

-- ---------------------------------------------------------------- S3. flux d'agenda : périmètre d'enfants et de grossesse
create or replace function public.calendar_feed_data(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare f public.calendar_feeds; v_from timestamptz := now() - interval '31 days'; v_to timestamptz := now() + interval '366 days';
begin
  select * into f from public.calendar_feeds
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and revoked_at is null;
  if not found or not public.is_member_of(f.household_id, f.user_id) then return null; end if;
  -- les vérifications de droits ci-dessous (can_access_household, can_access_child, can_access_pregnancy)
  -- s'évaluent pour CETTE personne
  perform set_config('request.jwt.claim.sub', f.user_id::text, true);
  update public.calendar_feeds set last_accessed_at = now() where id = f.id;
  return jsonb_build_object(
    'feed', jsonb_build_object('id', f.id, 'label', f.label, 'include_health_titles', f.include_health_titles),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public.family_events e
        where e.household_id = f.household_id and public.can_access_household(e.household_id, 'lists', false)
          and (e.child_id is null or public.can_access_child(e.child_id))
          and (e.recurrence is not null or (e.starts_at < v_to and coalesce(e.ends_at, e.starts_at) > v_from))), '[]'::jsonb),
    'appointments', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'starts_at', a.starts_at, 'location_label', a.location_label, 'kind', a.kind, 'private_to_creator', a.private_to_creator))
        from public.appointments a
        where a.household_id = f.household_id and public.can_access_household(a.household_id, 'health', false)
          and (a.child_id is null or public.can_access_child(a.child_id))
          and (a.pregnancy_id is null or public.can_access_pregnancy(a.pregnancy_id))
          and (not a.private_to_creator or a.created_by = f.user_id) and a.starts_at between v_from and v_to), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'due_at', t.due_at, 'status', t.status, 'assignee_id', t.assignee_id))
        from public.family_tasks t
        where t.household_id = f.household_id and public.can_access_household(t.household_id, 'lists', false)
          and (t.child_id is null or public.can_access_child(t.child_id))
          and t.due_at between v_from and v_to and t.status <> 'cancelled'), '[]'::jsonb),
    'shifts', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'user_id', s.user_id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'status', s.status))
        from public.care_shifts s
        where s.household_id = f.household_id and public.can_access_household(s.household_id, 'lists', false)
          and (s.kind = 'night' or s.user_id = f.user_id) and s.starts_at between v_from and v_to), '[]'::jsonb)
  );
end $$;
revoke execute on function public.calendar_feed_data(text) from public, anon, authenticated;
grant execute on function public.calendar_feed_data(text) to service_role;

-- ---------------------------------------------------------------- S1. export RGPD sous RLS
alter function public.export_my_data() rename to _export_my_data_v29;
revoke execute on function public._export_my_data_v29() from public, anon, authenticated;

-- Export brut (inchangé) : appelable seulement depuis export_my_data() (réglage local à la transaction, qu'un client
-- ne peut pas poser : même principe que homi.mission_action / homi.stock_action).
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_v29();
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- Retire d'un document JSON toute ligne de foyer (objet portant id + household_id) absente de p_visible, sauf si la
-- personne en est l'autrice. Fonction pure.
create or replace function public._export_prune(p_doc jsonb, p_visible uuid[], p_me text)
returns jsonb language plpgsql immutable set search_path = public as $$
declare k text; v jsonb; out jsonb; e jsonb;
begin
  if p_doc is null then return null; end if;
  if jsonb_typeof(p_doc) = 'object' then
    if p_doc ? 'id' and p_doc ? 'household_id' and (p_doc ->> 'id') ~ '^[0-9a-fA-F-]{36}$'
       and not ((p_doc ->> 'id')::uuid = any(p_visible))
       and not exists (select 1 from jsonb_each_text(p_doc) a
                       where a.key in ('user_id', 'created_by', 'uploaded_by', 'author_id', 'actor_id', 'from_user', 'logged_by', 'added_by', 'shared_by', 'done_by')
                         and a.value = p_me) then
      return 'null'::jsonb;                                                     -- marqueur : ligne retirée
    end if;
    out := '{}'::jsonb;
    for k, v in select * from jsonb_each(p_doc) loop
      out := out || jsonb_build_object(k, public._export_prune(v, p_visible, p_me));
    end loop;
    return out;
  elsif jsonb_typeof(p_doc) = 'array' then
    out := '[]'::jsonb;
    for e in select * from jsonb_array_elements(p_doc) loop
      v := public._export_prune(e, p_visible, p_me);
      -- une ligne retirée disparaît du tableau (un null d'origine reste)
      if not (v = 'null'::jsonb and e <> 'null'::jsonb) then out := out || jsonb_build_array(v); end if;
    end loop;
    return out;
  end if;
  return p_doc;
end $$;

-- security INVOKER : la liste des lignes lisibles est calculée SOUS LA RLS de la personne connectée.
create or replace function public.export_my_data()
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v_uid uuid := auth.uid(); v_raw jsonb; v_visible uuid[] := '{}'; v_part uuid[]; r record;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  perform set_config('homi.export_filter', 'on', true);
  v_raw := public._export_my_data_raw();
  perform set_config('homi.export_filter', '', true);
  for r in select c.relname from pg_class c
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
             and case when exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'household_id' and not a.attisdropped)
                       and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'id' and a.atttypid = 'uuid'::regtype and not a.attisdropped)
                      then has_column_privilege(c.oid, 'id', 'SELECT') and has_column_privilege(c.oid, 'household_id', 'SELECT') else false end loop
    execute format('select array_agg(id) from public.%I where household_id is not null', r.relname) into v_part;
    v_visible := v_visible || coalesce(v_part, '{}');
  end loop;
  return public._export_prune(v_raw, v_visible, v_uid::text);
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- ---------------------------------------------------------------- S8. create_mission : rejeu limité à ce que l'on voit
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.create_mission(uuid, text, uuid, text, text, timestamptz, boolean, text, jsonb, uuid, uuid, uuid, text, uuid, text, uuid)'::regprocedure);
  if position('if found then return to_jsonb(t); end if;' in v_def) = 0 then
    raise exception 'create_mission : version inattendue, correctif S8 à reprendre à la main';
  end if;
  v_def := replace(v_def, 'if found then return to_jsonb(t); end if;',
    'if found then
      if t.child_id is not null and not public.can_access_child(t.child_id) then
        raise exception ''Identifiant de saisie déjà utilisé.'' using errcode = ''23505'';
      end if;
      return to_jsonb(t);
    end if;');
  execute v_def;
end $$;

-- ---------------------------------------------------------------- S9. anon : seules les fonctions des politiques publiques
-- (articles, vidéos, ressources d'urgence lisibles sans compte : has_role, has_premium ; réglages publics de l'offre ;
-- is_blocked_between, qui répond « faux » sans compte : contrat du test 66_membership_oracles).
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as f from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.prorettype <> 'trigger'::regtype
             and p.proname not in ('has_role', 'has_premium', 'premium_strict', 'assistant_paid', 'premium_article_teasers', 'is_blocked_between')
             and has_function_privilege('anon', p.oid, 'execute') loop
    -- le retrait de PUBLIC ne doit rien enlever aux comptes connectés ni au serveur
    if has_function_privilege('authenticated', r.f, 'execute') then execute format('grant execute on function %s to authenticated', r.f); end if;
    if has_function_privilege('service_role', r.f, 'execute') then execute format('grant execute on function %s to service_role', r.f); end if;
    execute format('revoke execute on function %s from public, anon', r.f);
  end loop;
end $$;
