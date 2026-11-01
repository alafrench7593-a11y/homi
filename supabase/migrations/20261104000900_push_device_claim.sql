-- =====================================================================
-- Campagne QA du 02/11/2026 (lot A) — A-03 (P1) : téléphone partagé et déconnexion.
-- Problème : le jeton push d'un téléphone restait rattaché au PREMIER compte. Après déconnexion et
-- connexion d'un autre compte, l'enregistrement du jeton était refusé (ligne d'un autre compte) et
-- l'erreur ignorée : le téléphone recevait les notifications du premier compte, jamais celles du second.
-- Correctif : claim_push_device rattache le jeton à la personne connectée (retiré de tout autre compte) ;
-- release_push_device le retire à la déconnexion. Additif. Retour arrière en fin de fichier.
-- =====================================================================
create or replace function public.claim_push_device(p_token text, p_platform text, p_label text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_token is null or p_token !~ '^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]{10,}\]$' then
    raise exception 'Jeton invalide' using errcode = '22023';
  end if;
  delete from public.push_devices where expo_push_token = p_token and user_id <> auth.uid();
  insert into public.push_devices (user_id, expo_push_token, platform, device_label, last_seen_at)
  values (auth.uid(), p_token, left(coalesce(p_platform, ''), 20), left(p_label, 80), now())
  on conflict (expo_push_token) do update set user_id = auth.uid(), platform = excluded.platform,
    device_label = excluded.device_label, last_seen_at = now();
end $$;

create or replace function public.release_push_device(p_token text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_devices where expo_push_token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.claim_push_device(text, text, text) from public, anon;
revoke execute on function public.release_push_device(text) from public, anon;
grant execute on function public.claim_push_device(text, text, text) to authenticated;
grant execute on function public.release_push_device(text) to authenticated;
-- Retour arrière : drop function if exists public.claim_push_device(text, text, text), public.release_push_device(text);
