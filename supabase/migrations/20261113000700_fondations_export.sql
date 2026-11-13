-- =====================================================================
-- Fondations du foyer (13/11/2026) — raccords avec l'existant
--  1. « Exporter mes données » (RGPD) inclut les nouvelles tables : réglages de notification, documents
--     partagés avec moi, entrées du journal d'audit et événements dont je suis l'auteur·rice.
--  2. household_is_empty_auto() : le journal d'audit et les événements sont des traces, pas des données
--     du foyer ; ils n'empêchent plus la suppression du foyer automatique vide à l'acceptation d'une invitation.
-- Retour arrière : drop function public.export_my_data(); alter function public._export_my_data_v27() rename to export_my_data;
--   puis ré-appliquer household_is_empty_auto de 20261018000100_account_bootstrap.sql.
-- =====================================================================

alter function public.export_my_data() rename to _export_my_data_v27;
revoke execute on function public._export_my_data_v27() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v27() || jsonb_build_object(
    'notification_settings', (select to_jsonb(s) from public.notification_settings s where s.user_id = v_uid),
    'document_shares', (select coalesce(jsonb_agg(jsonb_build_object('document_id', d.document_id, 'household_id', d.household_id,
        'shared_by', d.shared_by, 'created_at', d.created_at) order by d.created_at), '[]') from public.document_shares d where d.user_id = v_uid or d.shared_by = v_uid),
    'household_audit_log', (select coalesce(jsonb_agg(to_jsonb(a) order by a.occurred_at), '[]') from public.household_audit_log a where a.actor_id = v_uid),
    'household_events', (select coalesce(jsonb_agg(jsonb_build_object('type', e.type, 'household_id', e.household_id, 'entity_table', e.entity_table,
        'entity_id', e.entity_id, 'payload', e.payload, 'created_at', e.created_at) order by e.created_at), '[]') from public.household_events e where e.actor_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.household_is_empty_auto(p_household uuid, p_user uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r record; v_found boolean;
begin
  if not exists (select 1 from public.households
                  where id = p_household and auto_created and created_by = p_user) then
    return false;
  end if;
  -- Le seul membre doit être p_user, en tant que propriétaire
  if exists (select 1 from public.household_members
              where household_id = p_household and (user_id <> p_user or role <> 'owner'))
     or not exists (select 1 from public.household_members
                     where household_id = p_household and user_id = p_user) then
    return false;
  end if;
  -- Toute ligne d'une table rattachée au foyer = donnée à conserver (traces d'audit et événements exclus)
  for r in
    select c.conrelid::regclass as tbl, a.attname as col
      from pg_constraint c
      cross join lateral unnest(c.conkey, c.confkey) as k(src, dst)
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.src
      join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = k.dst
     where c.contype = 'f'
       and c.confrelid = 'public.households'::regclass
       and fa.attname = 'id'
       and c.conrelid not in ('public.household_members'::regclass, 'public.household_audit_log'::regclass, 'public.household_events'::regclass)
  loop
    execute format('select exists (select 1 from %s where %I = $1)', r.tbl, r.col)
      into v_found using p_household;
    if v_found then return false; end if;
  end loop;
  -- Fichiers déposés dans le dossier du foyer
  if exists (select 1 from storage.objects
              where split_part(name, '/', 1) = p_household::text) then
    return false;
  end if;
  return true;
end $$;
revoke execute on function public.household_is_empty_auto(uuid, uuid) from public, anon, authenticated;
