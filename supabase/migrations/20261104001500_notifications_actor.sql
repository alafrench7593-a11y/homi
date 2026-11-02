-- =====================================================================
-- Campagne QA du 02/11/2026, A-06 (P2, RGPD) : après la suppression d'un compte, les notifications
-- reçues par les autres (« InesQA a commenté votre publication », extrait du commentaire, lien)
-- restaient visibles, avec le pseudonyme et le texte de la personne supprimée.
--
-- 1. Les nouvelles notifications de la communauté retiennent qui les a provoquées (payload.actor,
--    pris de la session en cours). Pas pour la modération : l'action d'une modératrice ne doit pas
--    disparaître avec son compte.
-- 2. Un commentaire supprimé (par son autrice, la modération ou avec le compte) emporte ses
--    notifications, comme les publications depuis 20261104000700 (B-09).
-- 3. delete_user_account efface aussi les notifications dont la personne est l'actrice.
-- Additif : aucune donnée existante n'est modifiée. Retour arrière en fin de fichier.
-- =====================================================================

create or replace function public.community_notify(p_user uuid, p_kind text, p_category text, p_title text, p_body text, p_link text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_on boolean; v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if p_user is null then return; end if;
  select case p_kind when 'post_comment' then post_comment when 'comment_reply' then comment_reply when 'reaction' then reaction
                     when 'saved_reply' then saved_reply when 'moderation' then moderation when 'mention' then mention
                     when 'new_follower' then new_follower when 'followed_post' then followed_post
                     when 'group_activity' then group_activity when 'group_invite' then group_invite else true end
    into v_on from public.community_notification_prefs where user_id = p_user;
  -- A-06 : actrice de la notification (jamais pour la modération)
  if p_kind <> 'moderation' and auth.uid() is not null and not (v_payload ? 'actor') then
    v_payload := v_payload || jsonb_build_object('actor', auth.uid());
  end if;
  -- Valeur par défaut d'un type jamais réglé : activé, sauf les nouvelles publications des membres suivis (trop fréquentes)
  if coalesce(v_on, p_kind <> 'followed_post') then
    insert into public.notifications(user_id, category, title, body, deep_link, payload) values (p_user, p_category, p_title, p_body, p_link, v_payload);
  end if;
end $$;
revoke execute on function public.community_notify(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.comment_delete_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications where payload ->> 'comment_id' = old.id::text;
  return old;
end $$;
drop trigger if exists comment_delete_notifications on public.comments;
create trigger comment_delete_notifications after delete on public.comments
  for each row execute function public.comment_delete_notifications();

create index if not exists notifications_actor_idx on public.notifications ((payload ->> 'actor')) where payload ? 'actor';

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
  -- A-06 : notifications reçues par les autres et provoquées par la personne (pseudonyme, extraits)
  delete from public.notifications where payload ->> 'actor' = p_user::text;
  delete from auth.users where id = p_user; -- cascade : publications et commentaires emportent leurs notifications
  return v_paths;
end $$;
revoke execute on function public.delete_user_account(uuid) from public, anon, authenticated;

-- Retour arrière :
-- drop trigger if exists comment_delete_notifications on public.comments; drop function if exists public.comment_delete_notifications();
-- drop index if exists public.notifications_actor_idx;
-- (community_notify : reprendre 20261023000100_community_social.sql ; delete_user_account : reprendre 20261104000800_account_deletion_qa.sql)
