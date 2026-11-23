-- =====================================================================
-- Export RGPD (« Exporter mes données ») des outils du 30/11/2026 : langage, jeux, activités, devoirs, baromètre du
-- couple. La version précédente est gardée sous un autre nom et complétée ; export_my_data() (security invoker,
-- filtre sous RLS) reste inchangée. Le baromètre : uniquement MES jauges (celles de l'autre parent ne sont pas à moi).
-- Tests : supabase/tests/sql/98zk_partiels2.sql
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_partiels2' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_partiels2;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_partiels2() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_h uuid[];
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  return public._export_my_data_raw_partiels2() || jsonb_build_object(
    'child_language', (select coalesce(jsonb_agg(to_jsonb(e) order by e.said_on nulls last, e.created_at), '[]') from public.child_language_entries e
                       where e.household_id = any(v_h) or e.created_by = v_uid),
    'child_games', (select coalesce(jsonb_agg(to_jsonb(g) order by g.created_at), '[]') from public.child_game_marks g where g.household_id = any(v_h) or g.created_by = v_uid),
    'child_activities', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at), '[]') from public.child_activities a where a.household_id = any(v_h) or a.created_by = v_uid),
    'child_homework', (select coalesce(jsonb_agg(to_jsonb(h) order by h.due_on, h.created_at), '[]') from public.child_homework h where h.household_id = any(v_h) or h.created_by = v_uid),
    'couple_barometer', (select coalesce(jsonb_agg(to_jsonb(b) order by b.week_of), '[]') from public.couple_barometer b where b.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière
-- drop function public._export_my_data_raw(); alter function public._export_my_data_raw_partiels2() rename to
--   _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
