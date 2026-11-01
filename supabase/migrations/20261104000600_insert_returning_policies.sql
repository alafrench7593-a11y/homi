-- =====================================================================
-- Campagne QA du 02/11/2026 — bug P0 : « ajouter un enfant », « ajouter une grossesse »,
-- « publier dans la communauté » et « créer un album » échouaient sur le vrai serveur.
--
-- Cause : l'application enregistre puis relit la ligne créée (INSERT … RETURNING, comme le fait
-- PostgREST avec .select()). Postgres applique alors aussi la règle de LECTURE à la nouvelle ligne.
-- Pour ces 4 tables, la règle de lecture appelait une fonction qui RELIT la table par son id
-- (can_access_child(id), can_access_pregnancy(id), can_read_post(id), can_read_album(id)) :
-- pendant l'insertion, la fonction ne voit pas encore la nouvelle ligne → « new row violates
-- row-level security policy » et rien n'est enregistré.
--
-- Correctif : mêmes règles, mot pour mot, mais calculées à partir des COLONNES de la ligne
-- (fonctions _row_* qui ne relisent pas la table). Aucune règle n'est assouplie :
--   enfants   : propriétaire du foyer, ou membre sans restriction d'enfants, ou enfant dans son périmètre ;
--   grossesses: propriétaire, ou accès grossesse accordé, ou personne qui porte la grossesse ;
--   publications : visibles et non bloquées (groupe visible) — ou autrice — ou modération ;
--   albums    : propriétaire, ou partage reçu sans blocage.
-- Les fonctions can_* d'origine restent en place (utilisées ailleurs).
-- Retour arrière : en fin de fichier.
-- =====================================================================

create or replace function public._row_child_access(p_household uuid, p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid()
      and (m.role = 'owner' or m.child_scope is null or p_child = any(m.child_scope))
  );
$$;

create or replace function public._row_pregnancy_access(p_household uuid, p_carrier uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid()
      and (m.role = 'owner' or m.pregnancy_access or p_carrier = auth.uid())
  );
$$;

create or replace function public._row_post_readable(p_author uuid, p_group uuid, p_status text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and (p_group is null or public.can_see_group(p_group) or p_author = auth.uid())
    and ((p_status = 'visible' and not public.is_blocked_between(p_author, auth.uid())) or p_author = auth.uid() or public.has_role('moderator'));
$$;

create or replace function public._row_album_readable(p_album uuid, p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_owner = auth.uid()
    or (exists (select 1 from public.album_shares s where s.album_id = p_album and s.user_id = auth.uid())
        and not public.is_blocked_between(p_owner, auth.uid())));
$$;

revoke execute on function public._row_child_access(uuid, uuid) from public, anon;
revoke execute on function public._row_pregnancy_access(uuid, uuid) from public, anon;
revoke execute on function public._row_post_readable(uuid, uuid, text) from public, anon;
revoke execute on function public._row_album_readable(uuid, uuid) from public, anon;
grant execute on function public._row_child_access(uuid, uuid) to authenticated;
grant execute on function public._row_pregnancy_access(uuid, uuid) to authenticated;
grant execute on function public._row_post_readable(uuid, uuid, text) to authenticated;
grant execute on function public._row_album_readable(uuid, uuid) to authenticated;

drop policy if exists children_scope on public.children;
create policy children_scope on public.children as restrictive for all to authenticated
  using (public._row_child_access(household_id, id)) with check (true);

drop policy if exists pregnancies_scope on public.pregnancies;
create policy pregnancies_scope on public.pregnancies as restrictive for all to authenticated
  using (public._row_pregnancy_access(household_id, carrier_user_id)) with check (true);

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
  using (public._row_post_readable(author_id, group_id, status));

drop policy if exists albums_read on public.community_albums;
create policy albums_read on public.community_albums for select to authenticated
  using (public._row_album_readable(id, owner_id));

-- Retour arrière :
-- drop policy if exists children_scope on public.children;
-- create policy children_scope on public.children as restrictive for all to authenticated using (public.can_access_child(id)) with check (true);
-- drop policy if exists pregnancies_scope on public.pregnancies;
-- create policy pregnancies_scope on public.pregnancies as restrictive for all to authenticated using (public.can_access_pregnancy(id)) with check (true);
-- drop policy if exists posts_read on public.posts;
-- create policy posts_read on public.posts for select to authenticated using (public.can_read_post(id));
-- drop policy if exists albums_read on public.community_albums;
-- create policy albums_read on public.community_albums for select to authenticated using (public.can_read_album(id));
-- drop function if exists public._row_child_access(uuid, uuid), public._row_pregnancy_access(uuid, uuid),
--   public._row_post_readable(uuid, uuid, text), public._row_album_readable(uuid, uuid);
