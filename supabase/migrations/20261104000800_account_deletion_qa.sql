-- =====================================================================
-- Campagne QA du 02/11/2026 (lot A) — suppression de compte : deux bugs P0.
--
-- A-01 : quand la propriétaire supprimait son compte, le foyer passait au membre le plus ancien,
--   QUEL QUE SOIT son rôle : une nounou (caregiver) devenait propriétaire, voyait tous les enfants
--   et pouvait exclure le coparent. → le foyer n'est transmis qu'à un COPARENT ; sans coparent, il
--   est supprimé comme lorsqu'il n'y a plus personne (la nounou perd l'accès, ce qui est attendu).
-- A-02 : les documents PARTAGÉS déposés par la personne supprimée dans un foyer conservé (ex. le carnet
--   de santé de l'enfant chez le coparent) étaient effacés (clé étrangère en cascade + fichier).
--   → seuls ses documents PRIVÉS sont effacés ; les documents partagés restent au foyer, sans autrice.
-- Additif : aucune donnée existante modifiée. Retour arrière en fin de fichier.
-- =====================================================================

alter table public.documents alter column uploaded_by drop not null;
alter table public.documents drop constraint if exists documents_uploaded_by_fkey;
alter table public.documents add constraint documents_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users(id) on delete set null;

create or replace function public.delete_user_account(p_user uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare v_h record; v_next uuid; v_paths text[] := '{}';
begin
  for v_h in select household_id from public.household_members where user_id = p_user and role = 'owner' loop
    -- Transmission uniquement à un coparent (jamais à une nounou ni à une autre personne invitée)
    select user_id into v_next from public.household_members
     where household_id = v_h.household_id and user_id <> p_user and role = 'coparent'
     order by joined_at limit 1;
    if v_next is null then
      v_paths := v_paths || coalesce((select array_agg(storage_path) from public.documents where household_id = v_h.household_id), '{}');
      delete from public.households where id = v_h.household_id;
    else
      update public.household_members
         set role = 'owner',
             can_view = array['daily','health','documents','pregnancy','lists','names','profile'],
             can_edit = array['daily','health','documents','pregnancy','lists','names','profile']
       where household_id = v_h.household_id and user_id = v_next;
      update public.households set created_by = v_next where id = v_h.household_id;
    end if;
  end loop;
  -- Documents PRIVÉS déposés dans un foyer conservé : effacés (ligne + fichier).
  -- Les documents partagés restent au foyer (uploaded_by passe à null à la suppression du compte).
  v_paths := v_paths || coalesce((select array_agg(storage_path) from public.documents where uploaded_by = p_user and private_to_uploader), '{}');
  delete from public.documents where uploaded_by = p_user and private_to_uploader;
  delete from auth.users where id = p_user; -- cascade sur toutes les données personnelles
  return v_paths;
end $$;
revoke execute on function public.delete_user_account(uuid) from public, anon, authenticated;

-- Retour arrière :
-- alter table public.documents drop constraint if exists documents_uploaded_by_fkey;
-- alter table public.documents add constraint documents_uploaded_by_fkey foreign key (uploaded_by) references auth.users(id) on delete cascade;
-- (delete_user_account : reprendre la définition de 20261015000500_account_storage_admin.sql)

-- A-05 (P1) : les photos de naissance (bucket « avatars », chemin <foyer>/children/<enfant>.jpg)
-- n'étaient jamais effacées quand le foyer disparaît avec le compte. Liste des fichiers à effacer,
-- même règle que delete_user_account (foyers dont la personne est propriétaire et sans coparent).
create or replace function public.avatar_paths_for_account(p_user uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(c.photo_path), '{}')
  from public.children c
  join public.household_members m on m.household_id = c.household_id and m.user_id = p_user and m.role = 'owner'
  where c.photo_path is not null
    and not exists (select 1 from public.household_members o where o.household_id = c.household_id and o.user_id <> p_user and o.role = 'coparent');
$$;
revoke execute on function public.avatar_paths_for_account(uuid) from public, anon, authenticated;
-- Retour arrière : drop function if exists public.avatar_paths_for_account(uuid);
