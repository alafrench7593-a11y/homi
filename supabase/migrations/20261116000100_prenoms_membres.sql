-- =====================================================================
-- Prénoms des membres du foyer (16/11/2026) — correctif « Coparent » au lieu de « Sam »
--
-- Les profils restent illisibles entre membres (profiles_self_select). Jusqu'ici, l'application nommait les autres
-- membres par leur RÔLE (« Coparent », « Nounou ») : illisible, et source de confusions (« Camille » affiché sur une
-- mission demandée par Sam). Cette fonction expose UNIQUEMENT, pour chaque membre ACTIF (ligne household_members
-- présente) d'un foyer dont la personne connectée est elle-même membre active :
--   household_id, user_id, role (déjà lisible dans household_members), prénom affiché (display_name nettoyé,
--   40 caractères au plus) et chemin de la photo (lien signé obtenu ensuite, sous la politique de stockage existante).
-- Rien d'autre du profil (ni e-mail, ni parcours, ni langue, ni réglages).
--
-- Règles :
--   * propriétaire et co-parent : tous les membres de leurs foyers (y compris la nounou qu'ils emploient) ;
--   * nounou (caregiver) : elle-même et les PARENTS (propriétaire, co-parents) du foyer qui l'emploie — jamais les
--     autres professionnels invités du foyer ;
--   * autre foyer, ex-membre (ligne supprimée = révocation, départ, compte supprimé), visiteur sans compte : rien.
-- p_household NULL : tous mes foyers ; sinon ce foyer seulement (vide si je n'en suis pas membre).
--
-- Tests : supabase/tests/sql/98n_prenoms_membres.sql
-- Retour arrière (après accord) : drop function public.household_member_names(uuid);
-- =====================================================================

create or replace function public.household_member_names(p_household uuid default null)
returns table (household_id uuid, user_id uuid, role text, display_name text, avatar_path text)
language sql stable security definer set search_path = public as $$
  select o.household_id, o.user_id, o.role,
         nullif(left(btrim(regexp_replace(coalesce(p.display_name, ''), '\s+', ' ', 'g')), 40), '') as display_name,
         p.avatar_path
  from public.household_members me
  join public.household_members o on o.household_id = me.household_id
  left join public.profiles p on p.id = o.user_id
  where auth.uid() is not null
    and me.user_id = auth.uid()
    and (p_household is null or me.household_id = p_household)
    and (me.role in ('owner', 'coparent') or o.role in ('owner', 'coparent') or o.user_id = auth.uid())
  order by o.household_id, (o.role = 'owner') desc, o.joined_at;
$$;
comment on function public.household_member_names(uuid) is
  'Prénom affiché + photo des membres actifs de mes foyers (nounou : parents seulement). Rien d''autre du profil.';
revoke execute on function public.household_member_names(uuid) from public, anon;
grant execute on function public.household_member_names(uuid) to authenticated;
