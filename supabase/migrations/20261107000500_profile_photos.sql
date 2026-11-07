-- =====================================================================
-- Photo de profil (07/11/2026) — migration ADDITIVE.
--
-- * profiles.avatar_path : chemin de la photo dans l'espace PRIVÉ « profile-photos » (null = initiale).
-- * Chemin imposé : <user_id>/<uuid>.jpg — chacun ne dépose et ne supprime que dans SON dossier.
-- * Lecture du fichier : la personne elle-même et les membres d'un foyer qu'elle partage (autre parent,
--   nounou, grands-parents), uniquement par lien signé temporaire. Jamais d'accès public.
-- * member_avatars() : le chemin de la photo des membres de mes foyers (les profils restent illisibles
--   entre membres : seul ce champ est partagé).
-- * Suppression du compte : la fonction delete-account efface le dossier <user_id>/ de « profile-photos ».
-- * Export RGPD : avatar_path figure déjà dans « profile » (to_jsonb du profil).
--
-- Retour arrière (après accord) :
--   drop function public.member_avatars();
--   drop policy "profile photos read" on storage.objects; drop policy "profile photos upload" on storage.objects;
--   drop policy "profile photos delete" on storage.objects;
--   delete from storage.buckets where id = 'profile-photos';   -- (après avoir vidé le bucket)
--   alter table public.profiles drop column avatar_path;
-- =====================================================================

alter table public.profiles add column if not exists avatar_path text
  check (avatar_path is null or (avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' and split_part(avatar_path, '/', 1) = id::text));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- Deux personnes partagent-elles un foyer ?
create or replace function public.shares_household_with(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (p_other = auth.uid() or exists (
    select 1 from public.household_members a
    join public.household_members b on b.household_id = a.household_id
    where a.user_id = auth.uid() and b.user_id = p_other));
$$;
revoke execute on function public.shares_household_with(uuid) from public, anon;
grant execute on function public.shares_household_with(uuid) to authenticated;

drop policy if exists "profile photos read" on storage.objects;
create policy "profile photos read" on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos'
         and split_part(name, '/', 1) ~ '^[0-9a-f-]{36}$'
         and public.shares_household_with(split_part(name, '/', 1)::uuid));

drop policy if exists "profile photos upload" on storage.objects;
create policy "profile photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos'
              and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
              and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "profile photos delete" on storage.objects;
create policy "profile photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text);

-- Photos des membres de mes foyers (moi compris). Rien d'autre du profil n'est exposé.
create or replace function public.member_avatars()
returns table (user_id uuid, avatar_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.avatar_path
  from public.profiles p
  where p.avatar_path is not null and public.shares_household_with(p.id);
$$;
revoke execute on function public.member_avatars() from public, anon;
grant execute on function public.member_avatars() to authenticated;
