-- =====================================================================
-- Fondations du foyer (13/11/2026) — A. Professionnel invité (nounou) et Premium strict
--
-- Constat (HOMI_GLOBAL_AUDIT.md, risque 1) : avec premium_policy.strict = vrai, _require_premium_write()
-- refusait toute saisie d'un compte sans Premium ; or _premium_of() n'accorde jamais le Premium du foyer
-- à un membre « caregiver ». Une nounou invitée ne pouvait donc rien enregistrer (biberon, change, tâche…).
--
-- Règle produit : la famille paie, pas la nounou. Une saisie faite par un membre « caregiver » ACTIF
-- (ligne présente dans household_members) sur une donnée DU FOYER où il est invité (colonne household_id
-- de la ligne = ce foyer) n'est jamais bloquée par l'abonnement. Ce qui reste inchangé :
--   * les droits : la RLS (domaines can_view/can_edit, enfants autorisés, documents partagés) décide
--     toujours de ce que la nounou peut lire ou écrire ; l'exemption ne porte QUE sur l'abonnement ;
--   * _premium_of() : la nounou ne reçoit pas le Premium (pas d'accès à ses propres outils Premium,
--     communauté, cycle…) ; seules ses saisies dans le foyer qui l'emploie sont exemptées ;
--   * un membre retiré du foyer perd l'exemption à la seconde (plus de ligne household_members).
-- my_access() expose « caregiver » (vrai si la personne est nounou dans au moins un foyer) pour que
-- l'application ouvre les écrans de garde (src/lib/premium/access.ts, gateFor).
--
-- Retour arrière : ré-appliquer _require_premium_write() et my_access() de 20261108000300_premium_strict.sql,
-- puis drop function public._is_caregiver_in(uuid).
-- =====================================================================

-- Nounou active dans ce foyer ? (personne connectée seulement : aucun oracle sur autrui)
create or replace function public._is_caregiver_in(p_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_household is not null and auth.uid() is not null and exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid() and m.role = 'caregiver');
$$;
revoke execute on function public._is_caregiver_in(uuid) from public, anon;
grant execute on function public._is_caregiver_in(uuid) to authenticated, service_role;

create or replace function public._require_premium_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_household uuid;
begin
  if v_uid is null or pg_trigger_depth() > 1 or not public.premium_strict() then return new; end if;
  if public._premium_of(v_uid) or public.has_role('moderator') then return new; end if;
  if tg_argv[0] = 'ai' and public._ai_plan_of(v_uid) then return new; end if;
  -- Nounou : saisie dans le foyer qui l'emploie (la famille paie). La ligne doit porter le foyer.
  if tg_argv[0] = 'premium' then
    v_household := nullif(to_jsonb(new) ->> 'household_id', '')::uuid;
    if public._is_caregiver_in(v_household) then return new; end if;
  end if;
  raise exception 'Fonction Premium : abonnement requis pour enregistrer de nouvelles données'
    using errcode = 'P0001', hint = 'premium_required';
end $$;
revoke execute on function public._require_premium_write() from public, anon, authenticated;

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'premium', public._premium_of(auth.uid()),
    'ai', public._ai_plan_of(auth.uid()),
    'trial_until', null,
    'strict', public.premium_strict(),
    -- Nounou dans au moins un foyer : saisies de garde jamais bloquées par l'abonnement
    'caregiver', exists (select 1 from public.household_members m where m.user_id = auth.uid() and m.role = 'caregiver'),
    'tools', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'product_id', t.product_id,
        'owned', public._grant_active(auth.uid(), t.entitlement), 'allowed', public._has_tool_of(t.key, auth.uid())) order by t.position)
      from public.paid_tools t), '[]'::jsonb))
  where auth.uid() is not null;
$$;
