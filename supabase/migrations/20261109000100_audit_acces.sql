-- Audit des accès (09/11/2026) — correctifs de l'audit de sécurité (relus et ajoutés par l'agent principal).
-- Aucune donnée modifiée ni supprimée ; aucun prix ni formule changé.
--
-- 1. Premium strict : l'assistant IA n'accorde plus de questions « gratuites » (5/mois) à un compte sans Premium ni
--    offre « Assistant IA ». La fonction serveur « assistant » réserve le quota par consume_assistant_quota()
--    → _plan_limit_of('assistant_questions_per_month'). Sans historique activé, rien n'est écrit dans les tables
--    protégées par _require_premium_write() : le verrou strict était donc contourné (appels Gemini payants).
--    Quand l'interrupteur strict est coupé (premium_policy.strict = false), l'ancien modèle (5 gratuites) revient.
-- 2. is_member_of(foyer, personne) : appelable par anon et par tout compte, elle révélait si une personne
--    quelconque appartient à un foyer quelconque (oracle d'appartenance). Elle ne répond plus que pour soi-même,
--    pour un foyer dont on est membre, ou pour le serveur (auth.uid() nul : service, déclencheurs).
--
-- Retour arrière : ré-appliquer la définition de _plan_limit_of de 20261107000200_offres_ia_outils.sql (section 4)
-- et celle de is_member_of de 20261019000300_family_load.sql, puis
-- « grant execute on function public.is_member_of(uuid, uuid) to anon; ».

create or replace function public._plan_limit_of(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case
    when public._premium_of(p_user) then premium_value
    when p_key = 'assistant_questions_per_month' and public._ai_plan_of(p_user) then greatest(free_value, 250)
    when p_key = 'assistant_questions_per_month' and public.premium_strict() then 0
    else free_value end
  from public.plan_limits where key = p_key;
$$;

create or replace function public.is_member_of(p_household uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (auth.uid() is null or p_user = auth.uid() or public.is_household_member(p_household))
     and exists (select 1 from public.household_members where household_id = p_household and user_id = p_user);
$$;
revoke execute on function public.is_member_of(uuid, uuid) from public, anon;
grant execute on function public.is_member_of(uuid, uuid) to authenticated, service_role;
