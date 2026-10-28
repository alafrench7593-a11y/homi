-- =====================================================================
-- Au fil de nous — Album photo par enfant (ajout, non destructif)
--
-- * Espace de stockage PRIVÉ « child-photos » : aucun accès public,
--   lecture uniquement par URL signée temporaire.
-- * Chemin : <household_id>/<child_id>/<uuid>.jpg
-- * Droits : ceux du foyer (domaine « profile », comme les moments de vie)
--   ET l'accès à cet enfant (child_scope). Une photo « privée » n'est
--   visible que par la personne qui l'a ajoutée.
-- * Suppression du compte : les photos des foyers supprimés et les photos
--   privées de la personne sont renvoyées pour effacement des fichiers ;
--   les photos partagées avec un foyer conservé restent à ce foyer.
--
-- Retour arrière (si besoin) :
--   drop function if exists public.child_photo_paths_for_account(uuid);
--   drop function if exists public.forget_private_child_photos(uuid);
--   drop table if exists public.child_photos;
--   delete from storage.buckets where id = 'child-photos';
--   (+ suppression des 4 politiques « child photos … » sur storage.objects)
--   drop function public.export_my_data(); alter function public._export_my_data_v18() rename to export_my_data;
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('child-photos', 'child-photos', false, 8388608, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

create table if not exists public.child_photos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  storage_path text not null unique,
  taken_on date not null default current_date,
  caption text check (caption is null or char_length(caption) <= 500),
  visibility text not null default 'household' check (visibility in ('household','private')),
  width int check (width is null or width between 1 and 10000),
  height int check (height is null or height between 1 and 10000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_photos_path_check check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
    and split_part(storage_path, '/', 1) = household_id::text
    and split_part(storage_path, '/', 2) = child_id::text
  ),
  constraint child_photos_date_check check (taken_on >= date '1990-01-01' and taken_on <= current_date + 1)
);
create index if not exists child_photos_child_idx on public.child_photos(child_id, taken_on desc, created_at desc);

-- L'enfant doit appartenir au foyer indiqué (impossible de rattacher une photo à un autre foyer)
create or replace function public.child_photos_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant inconnu dans ce foyer' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    -- seuls la légende, la date et la visibilité se modifient
    if new.storage_path <> old.storage_path or new.child_id <> old.child_id or new.household_id <> old.household_id
       or new.created_by is distinct from old.created_by then
      raise exception 'Modification non autorisée' using errcode = '42501';
    end if;
    -- une photo privée ne peut être rendue visible que par la personne qui l'a ajoutée
    if old.visibility = 'private' and new.visibility <> 'private' and old.created_by is distinct from auth.uid() then
      raise exception 'Modification non autorisée' using errcode = '42501';
    end if;
    new.updated_at := now();
  else
    new.created_by := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists child_photos_guard on public.child_photos;
create trigger child_photos_guard before insert or update on public.child_photos
  for each row execute function public.child_photos_guard();

alter table public.child_photos enable row level security;

drop policy if exists "child photos read" on public.child_photos;
create policy "child photos read" on public.child_photos for select to authenticated using (
  created_by = auth.uid()
  or (visibility = 'household'
      and public.can_access_household(household_id, 'profile', false)
      and public.can_access_child(child_id))
);

drop policy if exists "child photos insert" on public.child_photos;
create policy "child photos insert" on public.child_photos for insert to authenticated with check (
  public.can_access_household(household_id, 'profile', true)
  and public.can_access_child(child_id)
);

drop policy if exists "child photos update" on public.child_photos;
create policy "child photos update" on public.child_photos for update to authenticated
  using (
    public.can_access_child(child_id)
    and (created_by = auth.uid()
         or (visibility = 'household' and public.can_access_household(household_id, 'profile', true)))
  )
  with check (
    public.can_access_child(child_id)
    and (created_by = auth.uid()
         or (visibility = 'household' and public.can_access_household(household_id, 'profile', true)))
  );

drop policy if exists "child photos delete" on public.child_photos;
create policy "child photos delete" on public.child_photos for delete to authenticated using (
  created_by = auth.uid()
  or (visibility = 'household' and public.is_household_owner(household_id))
);

grant select, insert, update, delete on public.child_photos to authenticated;
revoke all on public.child_photos from anon;

-- ---------------------------------------------------------------------
-- Fichiers : lecture si la ligne correspondante est visible (la RLS de
-- child_photos s'applique), dépôt seulement dans <foyer>/<enfant>/ autorisés.
-- ---------------------------------------------------------------------
drop policy if exists "child photos files read" on storage.objects;
create policy "child photos files read" on storage.objects for select to authenticated
  using (bucket_id = 'child-photos' and exists (select 1 from public.child_photos p where p.storage_path = name));

drop policy if exists "child photos files upload" on storage.objects;
create policy "child photos files upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'child-photos'
    and public.can_access_household(public.storage_household(name), 'profile', true)
    and public.can_access_child((case when split_part(name, '/', 2) ~ '^[0-9a-f-]{36}$' then split_part(name, '/', 2) end)::uuid)
    and exists (select 1 from public.children c
                where c.id::text = split_part(name, '/', 2) and c.household_id = public.storage_household(name))
  );

drop policy if exists "child photos files delete" on storage.objects;
create policy "child photos files delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'child-photos'
    and (owner = auth.uid() or public.is_household_owner(public.storage_household(name)))
  );

-- ---------------------------------------------------------------------
-- Suppression du compte : chemins des fichiers à effacer AVANT
-- delete_user_account (foyers qui vont disparaître + photos privées).
-- Réservé au serveur (service_role).
-- ---------------------------------------------------------------------
create or replace function public.child_photo_paths_for_account(p_user uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare v_paths text[];
begin
  select coalesce(array_agg(distinct p.storage_path), '{}') into v_paths
  from public.child_photos p
  where (p.created_by = p_user and p.visibility = 'private')
     or p.household_id in (
       select m.household_id from public.household_members m
       where m.user_id = p_user and m.role = 'owner'
         and not exists (select 1 from public.household_members o
                         where o.household_id = m.household_id and o.user_id <> p_user));
  return v_paths;
end $$;
revoke execute on function public.child_photo_paths_for_account(uuid) from public, anon, authenticated;

-- Appelée APRÈS l'effacement des fichiers : retire les lignes des photos privées
-- (sinon elles survivraient, sans auteur, dans un foyer conservé).
create or replace function public.forget_private_child_photos(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  delete from public.child_photos where created_by = p_user and visibility = 'private';
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function public.forget_private_child_photos(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Export RGPD : légendes, dates et chemins des photos que la personne
-- a ajoutées (les fichiers eux-mêmes restent téléchargeables dans l'album).
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v18;
revoke execute on function public._export_my_data_v18() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public._export_my_data_v18() || jsonb_build_object(
    'child_photos', (select coalesce(jsonb_agg(jsonb_build_object(
        'child_id', p.child_id, 'taken_on', p.taken_on, 'caption', p.caption, 'visibility', p.visibility,
        'storage_path', p.storage_path, 'created_at', p.created_at) order by p.taken_on), '[]')
      from public.child_photos p where p.created_by = auth.uid()));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
