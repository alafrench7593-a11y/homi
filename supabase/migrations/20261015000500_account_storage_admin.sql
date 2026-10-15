-- =====================================================================
-- Toi & Moi — 0005 Stockage privé, compte (export / suppression),
-- limitation de débit, administration
-- =====================================================================

-- ---------------------------------------------------------------------
-- Stockage privé : chemins « <household_id>/<…> »
-- Accès uniquement via URL signée temporaire (aucun bucket public).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 26214400,
        array['application/pdf','image/jpeg','image/png','image/heic','image/webp']),
       ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create or replace function public.storage_household(p_name text)
returns uuid language plpgsql immutable as $$
begin
  return (split_part(p_name, '/', 1))::uuid;
exception when others then
  return null;
end $$;

create policy "documents read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.documents d where d.storage_path = name)); -- la RLS de documents s'applique
create policy "documents upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_access_household(public.storage_household(name), 'documents', true));
create policy "documents delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (owner = auth.uid() or public.is_household_owner(public.storage_household(name))));

create policy "avatars read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', false));
create policy "avatars write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true));
create policy "avatars delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.can_access_household(public.storage_household(name), 'profile', true));

-- ---------------------------------------------------------------------
-- Blocage depuis une publication / un commentaire (sans exposer l'id)
-- ---------------------------------------------------------------------
create or replace function public.block_author(p_post uuid default null, p_comment uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  if p_post is not null then select author_id into v_author from public.posts where id = p_post;
  else select author_id into v_author from public.comments where id = p_comment; end if;
  if v_author is null or v_author = auth.uid() then return; end if;
  insert into public.user_blocks(blocker_id, blocked_id) values (auth.uid(), v_author) on conflict do nothing;
end $$;

-- ---------------------------------------------------------------------
-- Limitation de débit pour les fonctions backend
-- ---------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security; -- aucune politique : service_role uniquement

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
        v_hits int;
begin
  insert into public.rate_limits(key, window_start, hits) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_limit;
end $$;
revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Export des données (RGPD, article 20)
-- ---------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb; v_h uuid[];
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select coalesce(array_agg(household_id), '{}') into v_h from public.household_members where user_id = v_uid;
  v := jsonb_build_object(
    'exported_at', now(),
    'format', 'toi-et-moi-export-v1',
    'profile', (select to_jsonb(p) from public.profiles p where id = v_uid),
    'privacy_settings', (select to_jsonb(s) from public.privacy_settings s where user_id = v_uid),
    'consents', (select coalesce(jsonb_agg(c order by created_at), '[]') from public.consents c where user_id = v_uid),
    'personal', jsonb_build_object(
      'period_entries', (select coalesce(jsonb_agg(t), '[]') from public.period_entries t where user_id = v_uid),
      'symptom_logs', (select coalesce(jsonb_agg(t), '[]') from public.symptom_logs t where user_id = v_uid),
      'ovulation_tests', (select coalesce(jsonb_agg(t), '[]') from public.ovulation_tests t where user_id = v_uid),
      'pregnancy_tests', (select coalesce(jsonb_agg(t), '[]') from public.pregnancy_tests t where user_id = v_uid),
      'maternal_weights', (select coalesce(jsonb_agg(t), '[]') from public.maternal_weights t where user_id = v_uid),
      'mood_checkins', (select coalesce(jsonb_agg(t), '[]') from public.mood_checkins t where user_id = v_uid),
      'reminders', (select coalesce(jsonb_agg(t), '[]') from public.reminders t where user_id = v_uid),
      'assistant_conversations', (select coalesce(jsonb_agg(jsonb_build_object('conversation', c,
          'messages', (select coalesce(jsonb_agg(m order by m.created_at), '[]') from public.assistant_messages m where m.conversation_id = c.id))), '[]')
        from public.assistant_conversations c where c.user_id = v_uid),
      'favorites', (select coalesce(jsonb_agg(t), '[]') from public.favorites t where user_id = v_uid)
    ),
    'households', (select coalesce(jsonb_agg(jsonb_build_object(
        'household', h,
        'pregnancies', (select coalesce(jsonb_agg(x), '[]') from public.pregnancies x where x.household_id = h.id),
        'expected_babies', (select coalesce(jsonb_agg(x), '[]') from public.expected_babies x where x.household_id = h.id),
        'children', (select coalesce(jsonb_agg(x), '[]') from public.children x where x.household_id = h.id),
        'measurements', (select coalesce(jsonb_agg(x), '[]') from public.child_measurements x where x.household_id = h.id),
        'breastfeeds', (select coalesce(jsonb_agg(x), '[]') from public.breastfeeds x where x.household_id = h.id),
        'bottles', (select coalesce(jsonb_agg(x), '[]') from public.bottles x where x.household_id = h.id),
        'pumpings', (select coalesce(jsonb_agg(x), '[]') from public.pumpings x where x.household_id = h.id),
        'meals', (select coalesce(jsonb_agg(x), '[]') from public.meals x where x.household_id = h.id),
        'diapers', (select coalesce(jsonb_agg(x), '[]') from public.diapers x where x.household_id = h.id),
        'sleeps', (select coalesce(jsonb_agg(x), '[]') from public.sleeps x where x.household_id = h.id),
        'observations', (select coalesce(jsonb_agg(x), '[]') from public.child_observations x where x.household_id = h.id),
        'appointments', (select coalesce(jsonb_agg(x), '[]') from public.appointments x where x.household_id = h.id),
        'checklists', (select coalesce(jsonb_agg(jsonb_build_object('list', l, 'items',
            (select coalesce(jsonb_agg(i order by i.position), '[]') from public.checklist_items i where i.checklist_id = l.id))), '[]')
          from public.checklists l where l.household_id = h.id),
        'documents', (select coalesce(jsonb_agg(to_jsonb(x) - 'storage_path'), '[]') from public.documents x
          where x.household_id = h.id and (not x.private_to_uploader or x.uploaded_by = v_uid))
      )), '[]') from public.households h where h.id = any(v_h)),
    'community', jsonb_build_object(
      'profile', (select to_jsonb(c) from public.community_profiles c where user_id = v_uid),
      'posts', (select coalesce(jsonb_agg(to_jsonb(p) - 'search'), '[]') from public.posts p where p.author_id = v_uid),
      'comments', (select coalesce(jsonb_agg(c), '[]') from public.comments c where author_id = v_uid)
    )
  );
  return v;
end $$;

-- ---------------------------------------------------------------------
-- Suppression du compte
-- Appelée par la fonction backend « delete-account » (service_role),
-- qui supprime ensuite les fichiers renvoyés du stockage.
-- Un foyer partagé est transmis au coparent le plus ancien ;
-- un foyer sans autre membre est supprimé avec toutes ses données.
-- ---------------------------------------------------------------------
create or replace function public.delete_user_account(p_user uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare v_h record; v_next uuid; v_paths text[] := '{}';
begin
  for v_h in select household_id from public.household_members where user_id = p_user and role = 'owner' loop
    select user_id into v_next from public.household_members
     where household_id = v_h.household_id and user_id <> p_user order by joined_at limit 1;
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
  -- documents privés déposés dans un foyer conservé
  v_paths := v_paths || coalesce((select array_agg(storage_path) from public.documents where uploaded_by = p_user), '{}');
  delete from auth.users where id = p_user; -- cascade sur toutes les données personnelles
  return v_paths;
end $$;
revoke execute on function public.delete_user_account(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Administration : statistiques anonymisées (agrégats uniquement)
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  return jsonb_build_object(
    'accounts', (select count(*) from public.profiles),
    'onboarded', (select count(*) from public.profiles where onboarding_completed),
    'active_pregnancies', (select count(*) from public.pregnancies where status = 'active'),
    'multiple_pregnancies', (select count(*) from public.pregnancies where status = 'active' and multiplicity in ('twins','triplets','more')),
    'children', (select count(*) from public.children where not archived),
    'premium', (select count(*) from public.subscriptions where status in ('trial','active','grace')),
    'posts_7d', (select count(*) from public.posts where created_at > now() - interval '7 days'),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'journeys', (select coalesce(jsonb_object_agg(j, n), '{}') from
                  (select unnest(journeys) j, count(*) n from public.profiles group by 1) s)
  );
end $$;

create or replace function public.admin_broadcast(p_title text, p_body text, p_deep_link text default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.has_role('admin') then raise exception 'Accès réservé' using errcode = '42501'; end if;
  insert into public.notifications(user_id, category, title, body, deep_link)
  select id, 'system', p_title, p_body, p_deep_link from public.profiles;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Rappel officiel publié -> notification aux personnes ayant scanné ce produit
create or replace function public.on_product_recall()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
  select distinct s.user_id, 'product_recall', 'Rappel officiel : ' || new.title, new.reason,
         '/scanner/recall/' || new.id, jsonb_build_object('recall_id', new.id)
  from public.product_scans s
  where (new.product_id is not null and s.product_id = new.product_id)
     or (new.barcode is not null and s.barcode = new.barcode);
  return new;
end $$;
create trigger product_recalls_notify after insert on public.product_recalls for each row execute function public.on_product_recall();

-- Les fonctions utilitaires de génération de politiques ne sont plus nécessaires côté client
revoke execute on function public._apply_household_policies(text, text) from public, anon, authenticated;
revoke execute on function public._apply_owner_policies(text) from public, anon, authenticated;
