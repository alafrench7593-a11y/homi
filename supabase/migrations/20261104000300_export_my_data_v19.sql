-- =====================================================================
-- Audit du 01/11/2026 : export RGPD (« Exporter mes données ») incomplet.
-- Problème : 22 tables utilisées par l'application n'étaient jamais exportées (traitements et prises,
-- besoins et étapes de l'enfant, suivi santé, diversification, minuteurs biberon, notes, prénoms,
-- listes de courses et menus, publications aimées et enregistrées, abonnement, notifications…).
-- Correctif : nouvelle version qui AJOUTE ces tables, avec exactement les mêmes droits que la lecture
-- dans l'application (domaine du foyer, enfant accessible, notes et documents privés exclus).
-- Additif : la version précédente est conservée sous le nom _export_my_data_v19.
-- Retour arrière :
--   drop function public.export_my_data(); alter function public._export_my_data_v19() rename to export_my_data;
-- =====================================================================

alter function public.export_my_data() rename to _export_my_data_v19;
revoke execute on function public._export_my_data_v19() from public, anon, authenticated;

create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v19() || jsonb_build_object(
    -- Santé de l'enfant (domaine « health »)
    'child_treatments', (select coalesce(jsonb_agg(to_jsonb(t) order by t.start_date), '[]') from public.child_treatments t
      where public.can_access_household(t.household_id, 'health', false) and (t.child_id is null or public.can_access_child(t.child_id))),
    'treatment_logs', (select coalesce(jsonb_agg(to_jsonb(l) order by l.scheduled_for), '[]') from public.treatment_logs l
      where public.can_access_household(l.household_id, 'health', false)
        and exists (select 1 from public.child_treatments t where t.id = l.treatment_id and (t.child_id is null or public.can_access_child(t.child_id)))),
    'child_needs', (select coalesce(jsonb_agg(to_jsonb(n)), '[]') from public.child_needs n
      where public.can_access_household(n.household_id, 'health', false) and (n.child_id is null or public.can_access_child(n.child_id))),
    'child_need_entries', (select coalesce(jsonb_agg(to_jsonb(e) order by e.occurred_on), '[]') from public.child_need_entries e
      where public.can_access_household(e.household_id, 'health', false) and (e.child_id is null or public.can_access_child(e.child_id))),
    'child_health_items', (select coalesce(jsonb_agg(to_jsonb(h) order by h.due_on), '[]') from public.child_health_items h
      where public.can_access_household(h.household_id, 'health', false) and (h.child_id is null or public.can_access_child(h.child_id))),
    -- Profil de l'enfant (domaine « profile »)
    'child_milestones', (select coalesce(jsonb_agg(to_jsonb(m) order by m.happened_on), '[]') from public.child_milestones m
      where public.can_access_household(m.household_id, 'profile', false) and (m.child_id is null or public.can_access_child(m.child_id))),
    'notes', (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at), '[]') from public.notes n
      where public.can_access_household(n.household_id, 'profile', false) and (not n.private_to_author or n.author_id = v_uid)
        and (n.child_id is null or public.can_access_child(n.child_id))
        and (n.pregnancy_id is null or public.can_access_pregnancy(n.pregnancy_id))),
    -- Quotidien (domaine « daily »)
    'food_introductions', (select coalesce(jsonb_agg(to_jsonb(f) order by f.first_tried_on), '[]') from public.food_introductions f
      where public.can_access_household(f.household_id, 'daily', false) and (f.child_id is null or public.can_access_child(f.child_id))),
    'child_food_settings', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.child_food_settings s
      where public.can_access_household(s.household_id, 'daily', false) and (s.child_id is null or public.can_access_child(s.child_id))),
    'bottle_timers', (select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at), '[]') from public.bottle_timers b
      where public.can_access_household(b.household_id, 'daily', false) and (b.child_id is null or public.can_access_child(b.child_id))),
    -- Listes, menus et organisation (domaine « lists »)
    'meal_plan_items', (select coalesce(jsonb_agg(to_jsonb(i)), '[]') from public.meal_plan_items i
      where public.can_access_household(i.household_id, 'lists', false)),
    'shopping_items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]') from public.shopping_items i
      where public.can_access_household(i.household_id, 'lists', false)),
    'family_task_events', (select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at), '[]') from public.family_task_events e
      where public.can_access_household(e.household_id, 'lists', false)),
    -- Prénoms (domaine « names »)
    'name_favorites', (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at), '[]') from public.name_favorites n
      where public.can_access_household(n.household_id, 'names', false)),
    'name_votes', (select coalesce(jsonb_agg(to_jsonb(v)), '[]') from public.name_votes v where v.user_id = v_uid),
    -- Lectures automatiques de documents : uniquement celles des documents que la personne peut voir
    'document_extractions', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at), '[]') from public.document_extractions x
      join public.documents d on d.id = x.document_id
      where public.can_access_household(d.household_id, 'documents', false) and (not d.private_to_uploader or d.uploaded_by = v_uid)),
    -- Données strictement personnelles
    'recipe_dislikes', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from public.recipe_dislikes r where r.user_id = v_uid),
    'post_likes', (select coalesce(jsonb_agg(jsonb_build_object('post_id', l.post_id, 'created_at', l.created_at)), '[]') from public.post_likes l where l.user_id = v_uid),
    'saved_posts', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.saved_posts s where s.user_id = v_uid),
    'assistant_feedback', (select coalesce(jsonb_agg(to_jsonb(f)), '[]') from public.assistant_feedback f where f.user_id = v_uid),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at), '[]') from public.notifications n where n.user_id = v_uid),
    'subscription', (select coalesce(jsonb_agg(jsonb_build_object('entitlement', s.entitlement, 'status', s.status, 'store', s.store,
        'period_type', s.period_type, 'expires_at', s.expires_at, 'will_renew', s.will_renew)), '[]') from public.subscriptions s where s.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
