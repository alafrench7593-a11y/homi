-- =====================================================================
-- Export RGPD (« Exporter mes données ») des outils du 28/11/2026 : dépenses, animaux, portions préparées, lecture.
-- La version brute précédente est gardée sous un autre nom et complétée ; export_my_data() (security invoker, filtre
-- sous RLS) reste inchangée : une ligne non visible n'apparaît pas, sauf si la personne en est l'autrice.
-- Tests : supabase/tests/sql/98zg_depenses_foyer.sql, 98zh_animaux.sql, 98zi_portions_lecture.sql
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_proc where proname = '_export_my_data_raw_outils_foyer' and pronamespace = 'public'::regnamespace) then
    alter function public._export_my_data_raw() rename to _export_my_data_raw_outils_foyer;
  end if;
end $$;
revoke execute on function public._export_my_data_raw_outils_foyer() from public, anon, authenticated;
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_h uuid[];
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilise export_my_data().' using errcode = '42501';
  end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  return public._export_my_data_raw_outils_foyer() || jsonb_build_object(
    'household_expenses', (select coalesce(jsonb_agg(to_jsonb(e) order by e.spent_on, e.created_at), '[]') from public.household_expenses e
                           where e.household_id = any(v_h) or e.created_by = v_uid),
    'pets', jsonb_build_object(
      'pets', (select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at), '[]') from public.pets p where p.household_id = any(v_h) or p.created_by = v_uid),
      'care', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]') from public.pet_care c where c.household_id = any(v_h) or c.created_by = v_uid)),
    'prepared_portions', jsonb_build_object(
      'batches', (select coalesce(jsonb_agg(to_jsonb(p) order by p.prepared_on), '[]') from public.prepared_portions p where p.household_id = any(v_h) or p.created_by = v_uid),
      'uses', (select coalesce(jsonb_agg(to_jsonb(u) order by u.used_at), '[]') from public.prepared_portion_uses u where u.household_id = any(v_h) or u.used_by = v_uid)),
    'reading', jsonb_build_object(
      'logs', (select coalesce(jsonb_agg(to_jsonb(r) order by r.read_on), '[]') from public.reading_logs r where r.household_id = any(v_h) or r.created_by = v_uid),
      'favorites', (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at), '[]') from public.reading_favorites f where f.household_id = any(v_h) or f.created_by = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------- Retour arrière
-- drop function public._export_my_data_raw(); alter function public._export_my_data_raw_outils_foyer() rename to
--   _export_my_data_raw; grant execute on function public._export_my_data_raw() to authenticated;
