-- Assistant IA payant dans tous les cas (10/11/2026, décision de David : « l'assistant IA est disponible uniquement à
-- l'abonnement »). Avant : sans Premium ni offre « Assistant IA », un compte gardait 5 questions gratuites par mois
-- tant que le verrou Premium strict était coupé (premium_policy.strict = false, état actuel en production). Le
-- rallumage de l'assistant ne dépend donc plus de l'ordre d'activation du verrou.
--   premium_policy.assistant_paid (vrai par défaut) : aucune question gratuite sans Premium ni offre « Assistant IA ».
-- Seule la clé 'assistant_questions_per_month' change ; les autres limites gardent leur comportement.
-- Aucune donnée modifiée ni supprimée ; aucun prix changé.
-- Désactivation sans migration (admin) : update public.premium_policy set assistant_paid = false;
-- Retour arrière complet : ré-appliquer _plan_limit_of de 20261109000100_audit_acces.sql, puis
--   alter table public.premium_policy drop column assistant_paid; drop function public.assistant_paid();

alter table public.premium_policy add column if not exists assistant_paid boolean not null default true;

create or replace function public.assistant_paid()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select assistant_paid from public.premium_policy where id), true);
$$;
grant execute on function public.assistant_paid() to authenticated, service_role;

create or replace function public._plan_limit_of(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case
    when public._premium_of(p_user) then premium_value
    when p_key = 'assistant_questions_per_month' and public._ai_plan_of(p_user) then greatest(free_value, 250)
    when p_key = 'assistant_questions_per_month' and (public.premium_strict() or public.assistant_paid()) then 0
    else free_value end
  from public.plan_limits where key = p_key;
$$;
