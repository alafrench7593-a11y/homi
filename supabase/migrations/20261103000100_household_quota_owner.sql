-- Correctif de 20261102000100_membership_oracles : depuis que plan_limit(clé, autre_personne)
-- renvoie NULL quand on interroge pour quelqu'un d'autre, le quota du foyer (documents, listes,
-- enfants) calculé sur le PROPRIÉTAIRE n'était plus appliqué quand un coparent ajoutait un élément
-- (v_count >= NULL n'est jamais vrai). Le déclencheur utilise désormais la fonction interne
-- _plan_limit_of, comme les autres fonctions serveur réécrites. Rien d'autre ne change.
-- Retour arrière : réexécuter la définition de 20261015000300_services.sql (enforce_household_quota).
create or replace function public.enforce_household_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_key text := tg_argv[0]; v_count int; v_limit int; v_owner uuid;
begin
  select user_id into v_owner from public.household_members where household_id = new.household_id and role = 'owner';
  v_limit := public._plan_limit_of(v_key, v_owner);
  execute format('select count(*) from public.%I where household_id = $1', tg_table_name) into v_count using new.household_id;
  if v_limit is not null and v_count >= v_limit then
    raise exception 'Limite de la version gratuite atteinte (%)', v_key using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
