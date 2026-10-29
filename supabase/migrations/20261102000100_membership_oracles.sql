-- =====================================================================
-- Audit du 29/10/2026 (suite) : quatre fonctions répondaient pour N'IMPORTE QUELLE personne.
--   has_premium(x), plan_limit(clé, x) : savoir si une autre membre est abonnée ;
--   is_group_member(groupe, x), can_see_group(groupe, x) : savoir si une autre membre fait partie
--   d'un groupe (ex. groupe thématique « fausse couche »), alors que la liste des membres est privée.
-- Correctif :
--   * la logique réelle passe dans des fonctions internes (_premium_of, _plan_limit_of,
--     _group_member_of), non appelables par l'application ;
--   * les fonctions publiques ne répondent que pour soi-même (ou pour le serveur / la modération) ;
--     pour une autre personne elles répondent « non » ;
--   * les fonctions du serveur qui ont BESOIN de la réponse pour une autre personne (partage du
--     cycle, invitation dans un groupe, mentions, quotas déclenchés par la base…) sont réécrites
--     automatiquement depuis leur définition ACTUELLE pour appeler la fonction interne ;
--   * is_blocked_between : le rôle anonyme (sans connexion) obtenait la réponse réelle ; corrigé.
-- Les règles d'accès et l'application appellent toutes ces fonctions pour soi-même : comportement
-- inchangé pour elles.
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

-- Qui peut obtenir la réponse réelle pour p_user : soi-même, le serveur (pas de session
-- utilisatrice et pas le rôle anonyme), la modération.
create or replace function public._asks_for_self(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user is not distinct from auth.uid()
      or (auth.uid() is null and coalesce(auth.role(), '') not in ('anon', 'authenticated'))
      or public.has_role('moderator');
$$;

-- 1. Fonctions internes : logique inchangée, copiée des dernières définitions ---------------
create or replace function public._premium_of(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.status in ('trial','active','grace','cancelled')
      and (s.expires_at is null or s.expires_at > now())
      and (
        s.user_id = p_user
        or s.user_id in (
          select owner.user_id from public.household_members me
          join public.household_members owner on owner.household_id = me.household_id and owner.role = 'owner'
          where me.user_id = p_user
        )
      )
  );
$$;

create or replace function public._plan_limit_of(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case when public._premium_of(p_user) then premium_value else free_value end
  from public.plan_limits where key = p_key;
$$;

create or replace function public._group_member_of(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group and user_id = p_user);
$$;

revoke execute on function public._premium_of(uuid) from public, anon, authenticated;
revoke execute on function public._plan_limit_of(text, uuid) from public, anon, authenticated;
revoke execute on function public._group_member_of(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._asks_for_self(uuid) from public, anon;
grant execute on function public._premium_of(uuid), public._plan_limit_of(text, uuid), public._group_member_of(uuid, uuid) to service_role;

-- 2. Fonctions du serveur qui interrogent pour une autre personne : réécrites depuis leur
--    définition actuelle (rien d'autre ne change dans leur code) ----------------------------
do $$
declare
  r record;
  v_def text;
  v_new text;
begin
  for r in
    select * from (values
      ('public.cycle_shared_with_me()',      'public.has_premium(',     'public._premium_of('),
      ('public.cycle_share_check()',         'public.has_premium(',     'public._premium_of('),
      ('public.partner_cycle(uuid)',         'public.has_premium(',     'public._premium_of('),
      ('public.community_profile_premium()', 'public.has_premium(',     'public._premium_of('),
      ('public.cycle_tags_limit()',          'public.has_premium(',     'public._premium_of('),
      ('public.premium_badge(uuid)',         'public.has_premium(',     'public._premium_of('),
      ('public.enforce_custom_reminders()',  'public.plan_limit(',      'public._plan_limit_of('),
      ('public.invite_to_group(uuid,text)',  'public.is_group_member(', 'public._group_member_of('),
      ('public.notify_mentions(uuid,uuid,uuid,text,uuid[])', 'public.is_group_member(', 'public._group_member_of('),
      ('public.posts_group_guard()',         'public.is_group_member(', 'public._group_member_of('),
      ('public.comments_group_guard()',      'public.is_group_member(', 'public._group_member_of(')
    ) as t(fn, old_call, new_call)
  loop
    v_def := pg_get_functiondef(r.fn::regprocedure);
    if position(r.old_call in v_def) = 0 then
      raise exception 'Migration oracles : % n''appelle pas %', r.fn, r.old_call;
    end if;
    v_new := replace(v_def, r.old_call, r.new_call);
    execute v_new;
  end loop;
end $$;

-- 3. Fonctions publiques : réponse réelle pour soi-même seulement ----------------------------
create or replace function public.has_premium(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select public._asks_for_self(p_user) and public._premium_of(p_user);
$$;

create or replace function public.plan_limit(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case when public._asks_for_self(p_user) then public._plan_limit_of(p_key, p_user) end;
$$;

create or replace function public.is_group_member(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select public._asks_for_self(p_user) and public._group_member_of(p_group, p_user);
$$;

create or replace function public.can_see_group(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_groups g where g.id = p_group and (
    (g.kind in ('theme', 'cohort') and not g.archived)
    or (public._asks_for_self(p_user) and exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = p_user))
    or public.has_role('moderator')));
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when not (public._asks_for_self(a) or public._asks_for_self(b)) then false
    else exists (select 1 from public.user_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
  end;
$$;

-- =====================================================================
-- Retour arrière (à exécuter à la main si besoin) :
--   1. recréer has_premium, plan_limit, is_group_member, can_see_group depuis
--      20261015000300_services.sql et 20261023000100_community_social.sql, et is_blocked_between
--      depuis 20261101000100_security_audit.sql ;
--   2. dans les 11 fonctions de la section 2, remplacer _premium_of( / _plan_limit_of( /
--      _group_member_of( par has_premium( / plan_limit( / is_group_member( (même bloc DO, sens inverse) ;
--   3. drop function public._premium_of(uuid), public._plan_limit_of(text, uuid),
--      public._group_member_of(uuid, uuid), public._asks_for_self(uuid);
-- Aucune donnée n'est modifiée par cette migration.
-- =====================================================================
