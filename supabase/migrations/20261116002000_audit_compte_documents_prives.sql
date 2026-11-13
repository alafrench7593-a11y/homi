-- =====================================================================
-- Audit n° 2 « Authentification et compte » (13/11/2026)
--
-- 1. Documents PRIVÉS (private_to_uploader, valeur par défaut) : le journal d'audit du foyer recopiait leur
--    titre et leurs notes (« after » de l'ajout, « before » de la suppression). Or le journal est lisible par la
--    propriétaire et les co-parents ayant le droit « documents » : le titre d'un document privé d'une autre personne
--    devenait lisible, et le restait APRÈS la suppression de son compte (delete_user_account efface ses documents
--    privés, ce qui ajoutait une entrée « delete » avec le titre). Désormais :
--      * une ligne de documents privée (état final : NEW pour ajout / modification, OLD pour suppression) n'est
--        jamais journalisée ;
--      * les entrées déjà écrites pour des documents privés sont effacées (seule exception à l'ajout seul, faite
--        ici par la migration, garde désactivée le temps de l'opération).
-- 2. Export RGPD (export_my_data) : ajoute les données de compte qui manquaient (abonnements suivis dans la
--    communauté, liens d'agenda sans leur empreinte, alertes de rappel produit, appareils de notification sans
--    jeton, rôles).
--
-- Retour arrière : reprendre _audit_row() de 20261113000300_journal_audit.sql ;
--   drop function public.export_my_data(); alter function public._export_my_data_audit2() rename to export_my_data;
--   grant execute on function public.export_my_data() to authenticated;
-- =====================================================================

create or replace function public._audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old jsonb; v_new jsonb; v_h uuid; v_before jsonb; v_after jsonb; v_row text; v_uid uuid := auth.uid();
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  -- Document privé : ni son titre ni ses notes ne doivent devenir lisibles par les autres membres via le journal
  if tg_table_name = 'documents'
     and coalesce((coalesce(v_new, v_old) ->> 'private_to_uploader')::boolean, false) then
    return null;
  end if;
  v_h := coalesce(nullif(v_new ->> 'household_id', ''), nullif(v_old ->> 'household_id', ''))::uuid;
  -- Foyer en cours de suppression (cascade) : rien à journaliser, le journal part avec le foyer
  if v_h is null or not exists (select 1 from public.households where id = v_h) then return null; end if;
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(e.key, v_old -> e.key), jsonb_object_agg(e.key, e.value)
      into v_before, v_after
      from jsonb_each(v_new) e where (v_old -> e.key) is distinct from e.value;
    v_before := public._audit_summary(v_before);
    v_after := public._audit_summary(v_after);
    if v_after = '{}'::jsonb and v_before = '{}'::jsonb then return null; end if; -- seuls des champs techniques ont changé
  elsif tg_op = 'INSERT' then
    v_after := public._audit_summary(v_new);
  else
    v_before := public._audit_summary(v_old);
  end if;
  v_row := coalesce(v_new ->> 'id', v_old ->> 'id',
                    (coalesce(v_new, v_old) ->> 'document_id') || ':' || (coalesce(v_new, v_old) ->> 'user_id'),
                    coalesce(v_new, v_old) ->> 'user_id');
  insert into public.household_audit_log (household_id, actor_id, origin, table_name, domain, row_id, action, before, after)
  values (v_h, v_uid, case when v_uid is null then 'server' else 'client' end, tg_table_name, tg_argv[0], v_row, lower(tg_op), v_before, v_after);
  return null;
end $$;
revoke execute on function public._audit_row() from public, anon, authenticated;

-- Entrées déjà écrites pour des documents privés (existants, ou supprimés mais marqués privés dans le journal)
alter table public.household_audit_log disable trigger household_audit_log_guard;
delete from public.household_audit_log l
 where l.table_name = 'documents'
   and (l.row_id in (select d.id::text from public.documents d where d.private_to_uploader)
        or l.row_id in (select x.row_id from public.household_audit_log x
                         where x.table_name = 'documents'
                           and (coalesce((x.after ->> 'private_to_uploader')::boolean, false)
                                or coalesce((x.before ->> 'private_to_uploader')::boolean, false))));
alter table public.household_audit_log enable trigger household_audit_log_guard;

-- ------------------------------------------------------------------ export : données de compte manquantes
alter function public.export_my_data() rename to _export_my_data_audit2;
revoke execute on function public._export_my_data_audit2() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_audit2() || jsonb_build_object('account_extra', jsonb_build_object(
    'following', (select coalesce(jsonb_agg(jsonb_build_object('followee_id', f.followee_id, 'created_at', f.created_at) order by f.created_at), '[]')
                    from public.member_follows f where f.follower_id = v_uid),
    'calendar_feeds', (select coalesce(jsonb_agg(to_jsonb(c) - 'token_hash' order by c.created_at), '[]')
                    from public.calendar_feeds c where c.user_id = v_uid),
    'scan_recall_alerts', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at), '[]')
                    from public.scan_recall_alerts a where a.user_id = v_uid),
    'push_devices', (select coalesce(jsonb_agg(to_jsonb(p) - 'expo_push_token'), '[]')
                    from public.push_devices p where p.user_id = v_uid),
    'roles', (select coalesce(jsonb_agg(r.role), '[]') from public.user_roles r where r.user_id = v_uid)));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
