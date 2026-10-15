-- L'export RGPD inclut aussi le carnet « Mon sommeil » (données de la seule personne qui exporte).
alter function public.export_my_data() rename to _export_my_data_v2;
revoke execute on function public._export_my_data_v2() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_v2();
  v := jsonb_set(v, '{personal}', (v -> 'personal') || jsonb_build_object(
    'parent_sleep_logs', (select coalesce(jsonb_agg(t order by log_date), '[]') from public.parent_sleep_logs t where user_id = v_uid)
  ));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
