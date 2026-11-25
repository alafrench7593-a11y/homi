-- Invitation du coparent en moins de 30 secondes (26/11/2026)
--  - code à 6 chiffres, usage unique, valable 48 h, un seul code actif par foyer (renouveler = l'ancien est annulé) ;
--  - le code est une seconde forme de clé de la MÊME invitation : token_hash = sha256('c6:' || code) ; l'acceptation
--    reste accept_household_invitation (droits, enfants, grossesse, foyer vide supprimé, garde) ;
--  - essais limités côté serveur : 10 échecs par heure et par personne (ou par adresse avant inscription), pour les
--    deux voies (aperçu et acceptation) — 1 000 000 de codes, impossible à balayer ;
--  - aperçu avant inscription : seulement le prénom de la personne qui invite et l'échéance ;
--  - le parent principal est prévenu dès que l'invitation est acceptée.
-- Retour arrière : drop function create_household_invite_code(uuid), preview_invite_code(text), invite_rate_guard(text, boolean);
--   recréer accept_household_invitation depuis 20261118000700 ; drop table invite_code_attempts ;
--   alter table household_invitations drop column short_code.

alter table public.household_invitations add column if not exists short_code boolean not null default false;

create table if not exists public.invite_code_attempts (
  id bigint generated always as identity primary key,
  actor text not null,
  at timestamptz not null default now()
);
create index if not exists invite_code_attempts_actor_at on public.invite_code_attempts(actor, at desc);
alter table public.invite_code_attempts enable row level security; -- aucune politique : invisible aux clients

-- Identité de l'essai : la personne connectée, sinon l'adresse de la requête (PostgREST), sinon « anonyme »
create or replace function public.invite_actor() returns text language sql stable set search_path = public as $$
  select coalesce(auth.uid()::text,
    'ip:' || nullif(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), ''),
    'anon');
$$;

-- Garde : refuse au-delà de 10 échecs en une heure ; p_failed = true enregistre un échec
create or replace function public.invite_rate_guard(p_actor text, p_failed boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_failed then
    insert into public.invite_code_attempts(actor) values (p_actor);
    delete from public.invite_code_attempts where at < now() - interval '1 day';
    return;
  end if;
  if (select count(*) from public.invite_code_attempts where actor = p_actor and at > now() - interval '1 hour') >= 10 then
    raise exception 'Trop d''essais. Réessaie dans une heure.' using errcode = '54000';
  end if;
end $$;
revoke execute on function public.invite_rate_guard(text, boolean) from public, anon, authenticated;

-- Code à 6 chiffres (propriétaire du foyer seulement) ; renvoie { code, expires_at }
create or replace function public.create_household_invite_code(p_household uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_code text; v_hash text; v_exp timestamptz := now() + interval '48 hours'; i int := 0;
begin
  if not public.is_household_owner(p_household) then
    raise exception 'Seul le propriétaire du foyer peut inviter' using errcode = '42501';
  end if;
  -- un seul code actif par foyer
  update public.household_invitations set revoked_at = now()
   where household_id = p_household and short_code and accepted_at is null and revoked_at is null;
  loop
    i := i + 1;
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    v_hash := encode(digest('c6:' || v_code, 'sha256'), 'hex');
    exit when not exists (select 1 from public.household_invitations where token_hash = v_hash and accepted_at is null and revoked_at is null and expires_at > now());
    if i > 20 then raise exception 'Réessaie dans un instant' using errcode = '55000'; end if;
  end loop;
  perform set_config('homi.pregnancy_grant', 'on', true);
  insert into public.household_invitations(household_id, invited_by, token_hash, role, can_view, can_edit, child_scope, pregnancy_access, expires_at, short_code)
  values (p_household, auth.uid(), v_hash, 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'],
          array['daily','lists','names'], null, true, v_exp, true);
  perform set_config('homi.pregnancy_grant', '', true);
  return jsonb_build_object('code', v_code, 'expires_at', v_exp);
end $$;
revoke execute on function public.create_household_invite_code(uuid) from public, anon;
grant execute on function public.create_household_invite_code(uuid) to authenticated;

-- Aperçu (avant ou après inscription) : prénom de la personne qui invite + échéance ; rien d'autre
create or replace function public.preview_invite_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_actor text := public.invite_actor(); v_inv public.household_invitations; v_name text;
begin
  perform public.invite_rate_guard(v_actor);
  if coalesce(p_code, '') !~ '^[0-9]{6}$' then perform public.invite_rate_guard(v_actor, true); return null; end if;
  select * into v_inv from public.household_invitations
   where token_hash = encode(digest('c6:' || p_code, 'sha256'), 'hex') and accepted_at is null and revoked_at is null and expires_at > now();
  if not found then perform public.invite_rate_guard(v_actor, true); return null; end if;
  select nullif(split_part(trim(coalesce(display_name, '')), ' ', 1), '') into v_name from public.profiles where id = v_inv.invited_by;
  return jsonb_build_object('inviter', v_name, 'expires_at', v_inv.expires_at, 'role', v_inv.role);
end $$;
revoke execute on function public.preview_invite_code(text) from public;
grant execute on function public.preview_invite_code(text) to anon, authenticated;

-- Acceptation (corps de 20261118000700) + limite d'essais + parent principal prévenu
create or replace function public.accept_household_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_inv public.household_invitations; v_h uuid; v_actor text;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v_actor := auth.uid()::text;
  perform public.invite_rate_guard(v_actor);
  select * into v_inv from public.household_invitations
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and accepted_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then
    -- Code à 6 chiffres : l'échec est COMPTÉ puis on renvoie null (une exception annulerait aussi le comptage) ;
    -- l'application affiche « code invalide ». Long jeton (lien) : erreur comme avant.
    if p_token like 'c6:%' then perform public.invite_rate_guard(v_actor, true); return null; end if;
    raise exception 'Invitation invalide ou expirée' using errcode = 'P0002';
  end if;
  -- Déjà membre : rien ne change (ni droits, ni enfants, ni grossesse) et l'invitation reste à sa destinataire
  if exists (select 1 from public.household_members where household_id = v_inv.household_id and user_id = auth.uid()) then
    raise exception 'Tu fais déjà partie de ce foyer.' using errcode = '23505',
      hint = 'Les droits d''un membre se modifient dans Réglages > Famille.';
  end if;
  if v_inv.pregnancy_access then perform set_config('homi.pregnancy_grant', 'on', true); end if;
  insert into public.household_members(household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access)
  values (v_inv.household_id, auth.uid(), v_inv.role, v_inv.can_view, v_inv.can_edit, v_inv.child_scope, v_inv.pregnancy_access);
  perform set_config('homi.pregnancy_grant', '', true);
  update public.household_invitations set accepted_at = now() where id = v_inv.id;

  -- Le foyer « Ma famille » créé à l'inscription devient inutile s'il est vide
  for v_h in
    select h.id from public.households h
      join public.household_members m on m.household_id = h.id and m.user_id = auth.uid() and m.role = 'owner'
     where h.auto_created and h.id <> v_inv.household_id
     for update of h
  loop
    if public.household_is_empty_auto(v_h, auth.uid()) then
      delete from public.households where id = v_h;
    end if;
  end loop;

  -- Le parent qui a invité est prévenu (titre neutre, aucune donnée de santé)
  if v_inv.invited_by is not null and v_inv.invited_by <> auth.uid() then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
    values (v_inv.invited_by, 'system', 'Invitation acceptée',
            coalesce((select nullif(split_part(trim(coalesce(display_name, '')), ' ', 1), '') from public.profiles where id = auth.uid()), 'Ton coparent')
              || ' a rejoint ton espace familial.',
            '/settings/family', jsonb_build_object('kind', 'invite_accepted', 'household_id', v_inv.household_id));
  end if;

  return v_inv.household_id;
end $$;
revoke execute on function public.accept_household_invitation(text) from public, anon;
grant execute on function public.accept_household_invitation(text) to authenticated;
