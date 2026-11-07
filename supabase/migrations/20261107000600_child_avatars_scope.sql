-- =====================================================================
-- Photo de profil des enfants (07/11/2026) — durcissement de l'espace « avatars ».
--
-- Avant : tout membre du foyer ayant le domaine « profile » pouvait lire, déposer et supprimer les fichiers
-- <foyer>/children/<enfant>…, même pour un enfant hors de son périmètre (child_scope).
-- Maintenant : pour un chemin d'enfant, il faut AUSSI avoir accès à cet enfant (can_access_child),
-- comme pour l'album photo. Les autres chemins du foyer gardent la règle d'avant.
--
-- Chemins d'enfant acceptés : <foyer>/children/<enfant>.jpg (photos de naissance existantes)
--                             <foyer>/children/<enfant>/<uuid>.jpg (photo de profil, nouvelle à chaque changement)
--
-- Retour arrière (après accord) : recréer les 3 politiques d'origine de 20261015000500_account_storage_admin.sql
--   create policy "avatars read" on storage.objects for select to authenticated
--     using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', false));
--   create policy "avatars write" on storage.objects for insert to authenticated
--     with check (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true));
--   create policy "avatars delete" on storage.objects for delete to authenticated
--     using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true));
--   drop function public.avatar_child_ok(text);
-- =====================================================================

-- Le fichier concerne-t-il un enfant, et si oui, la personne a-t-elle accès à cet enfant (et l'enfant au foyer) ?
create or replace function public.avatar_child_ok(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_child uuid;
begin
  if split_part(p_name, '/', 2) <> 'children' then return true; end if;
  begin
    v_child := (regexp_replace(split_part(p_name, '/', 3), '\.jpg$', ''))::uuid;
  exception when others then
    return false;
  end;
  return public.can_access_child(v_child)
     and exists (select 1 from public.children c where c.id = v_child and c.household_id = public.storage_household(p_name));
end $$;
revoke execute on function public.avatar_child_ok(text) from public, anon;
grant execute on function public.avatar_child_ok(text) to authenticated;

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', false)
         and public.avatar_child_ok(name));

drop policy if exists "avatars write" on storage.objects;
create policy "avatars write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true)
              and public.avatar_child_ok(name));

drop policy if exists "avatars delete" on storage.objects;
create policy "avatars delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true)
         and public.avatar_child_ok(name));
