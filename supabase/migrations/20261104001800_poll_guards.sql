-- =====================================================================
-- Campagne QA du 02/11/2026, B-14 (P4) : par l'API, un sondage pouvait n'avoir qu'un seul choix,
-- ou être déjà clos à sa création (l'appli, elle, impose 2 à 6 choix et une fin future).
-- → une fin de sondage doit suivre sa création (nouvelles lignes : NOT VALID) ; on ne vote pas
--   dans un sondage de moins de deux choix. Additif. Retour arrière en fin de fichier.
-- =====================================================================
alter table public.post_polls drop constraint if exists post_polls_closes_after_creation;
alter table public.post_polls add constraint post_polls_closes_after_creation
  check (closes_at is null or closes_at > created_at) not valid;

create or replace function public.vote_poll(p_post uuid, p_options uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare v public.post_polls; v_n int;
begin
  if not public.can_read_post(p_post) then raise exception 'Sondage introuvable' using errcode = 'P0001'; end if;
  select * into v from public.post_polls where post_id = p_post;
  if v.post_id is null then raise exception 'Sondage introuvable' using errcode = 'P0001'; end if;
  if v.closes_at is not null and v.closes_at < now() then raise exception 'Ce sondage est terminé' using errcode = 'P0001'; end if;
  -- B-14 : un sondage doit proposer au moins deux choix
  if (select count(*) from public.poll_options where post_id = p_post) < 2 then
    raise exception 'Sondage incomplet : il faut au moins deux choix' using errcode = 'P0001';
  end if;
  if (select group_id from public.posts where id = p_post) is not null and not public.is_group_member((select group_id from public.posts where id = p_post)) then
    raise exception 'Rejoignez ce groupe pour voter' using errcode = '42501';
  end if;
  v_n := coalesce(array_length(p_options, 1), 0);
  if v_n = 0 then delete from public.poll_votes where post_id = p_post and user_id = auth.uid(); return; end if;
  if not v.multiple and v_n > 1 then raise exception 'Un seul choix possible' using errcode = 'P0001'; end if;
  if exists (select 1 from unnest(p_options) o where o not in (select id from public.poll_options where post_id = p_post)) then
    raise exception 'Choix inconnu' using errcode = 'P0001';
  end if;
  delete from public.poll_votes where post_id = p_post and user_id = auth.uid();
  insert into public.poll_votes (post_id, option_id, user_id) select p_post, o, auth.uid() from unnest(p_options) o;
end $$;
revoke execute on function public.vote_poll(uuid, uuid[]) from public, anon;
grant execute on function public.vote_poll(uuid, uuid[]) to authenticated;

-- Retour arrière :
-- alter table public.post_polls drop constraint if exists post_polls_closes_after_creation;
-- (vote_poll : reprendre la définition de 20261023000100_community_social.sql)
