-- Abonnement Premium « strict » (08/11/2026)
--
-- Décision produit : sans Premium (abonnement personnel, ou partagé par le co-parent abonné), un compte garde
-- l'inscription, la connexion, l'onboarding, son profil, ses réglages, la consultation, l'export et la suppression
-- de ses données, et les numéros d'urgence. Toute NOUVELLE saisie de suivi est réservée au Premium.
--
--  1. premium_policy : interrupteur unique (strict = vrai par défaut), modifiable par un admin seulement.
--     Il permet de revenir au modèle précédent sans nouvelle migration si besoin.
--  2. _require_premium_write() : déclencheur BEFORE INSERT OR UPDATE sur les tables de suivi.
--     Jamais bloqués : la lecture (SELECT), la suppression (DELETE, donc l'effacement du compte), les écritures
--     du serveur (auth.uid() nul : service_role, tâches planifiées), les écritures en cascade d'un autre
--     déclencheur (pg_trigger_depth() > 1), les modératrices et admins.
--     Exception : l'offre « Assistant IA » (5 €/mois) ouvre les tables de l'assistant.
--  3. Le mois gratuit des outils est supprimé : un outil s'utilise avec le Premium, ou s'il a déjà été acheté
--     (achats à vie existants honorés, y compris l'achat d'un parent du foyer). Plus aucune vente d'outil à l'unité.
--
-- Aucune donnée n'est modifiée ni supprimée. Les tables non listées (profil, consentements, confidentialité,
-- foyer, parcours, enfants, grossesse, rappels créés à l'onboarding, signalements, blocages, avis sur l'appli,
-- compteurs serveur) restent libres.
--
-- Retour arrière :
--   update public.premium_policy set strict = false;              -- désactive le verrouillage sans rien supprimer
--   ou, complet : drop trigger <table>_premium_write on public.<table> (pour chaque table de la liste ci-dessous) ;
--   drop function public._require_premium_write(); drop function public.premium_strict();
--   drop table public.premium_policy; puis ré-appliquer 20261107000200_offres_ia_outils.sql (sections 3 et 5).

-- 1. Interrupteur ------------------------------------------------------------------------------------------------
create table if not exists public.premium_policy (
  id boolean primary key default true check (id),
  strict boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.premium_policy (id, strict) values (true, true) on conflict (id) do nothing;
alter table public.premium_policy enable row level security;
drop policy if exists premium_policy_read on public.premium_policy;
create policy premium_policy_read on public.premium_policy for select to authenticated using (true);
drop policy if exists premium_policy_admin on public.premium_policy;
create policy premium_policy_admin on public.premium_policy for update to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
grant select, update on public.premium_policy to authenticated;

create or replace function public.premium_strict()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select strict from public.premium_policy where id), true);
$$;
grant execute on function public.premium_strict() to authenticated;

-- 2. Garde d'écriture ------------------------------------------------------------------------------------------
create or replace function public._require_premium_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or pg_trigger_depth() > 1 or not public.premium_strict() then return new; end if;
  if public._premium_of(v_uid) or public.has_role('moderator') then return new; end if;
  if tg_argv[0] = 'ai' and public._ai_plan_of(v_uid) then return new; end if;
  raise exception 'Fonction Premium : abonnement requis pour enregistrer de nouvelles données'
    using errcode = 'P0001', hint = 'premium_required';
end $$;
revoke execute on function public._require_premium_write() from public, anon, authenticated;

do $$
declare
  t text;
  tracked text[] := array[
    -- suivi bébé et enfants
    'bottles','bottle_timers','breastfeeds','pumpings','diapers','sleeps','sleep_feedback','bedtime_routines',
    'child_measurements','child_milestones','child_steps','child_observations','child_wellbeing','child_photos',
    'child_needs','child_need_entries','child_treatments','treatment_logs','child_vaccinations','child_vaccine_postponements',
    'child_health_trackers','child_health_items','child_health_entries','child_food_settings','food_introductions','food_tastings',
    'album_photos','album_shares','kid_products',
    -- grossesse, cycle, fertilité, contraception, post-partum
    'pregnancy_symptom_logs','maternal_weights','period_entries','symptom_logs','bleeding_logs','discharge_logs',
    'ovulation_tests','pregnancy_tests','fertility_observations','intercourse_logs','cycle_journal','cycle_custom_items',
    'cycle_insight_feedback','cycle_shares','contraception_methods','contraception_logs','consultation_questions',
    'postpartum_checkins','postpartum_actions','postpartum_shared_status','support_circle',
    -- moi, famille, organisation
    'mood_checkins','parent_sleep_logs','exhaustion_checkins','daily_checks','my_treatments','my_treatment_logs',
    'couple_checkins','offduty_periods','care_requests','care_shifts','house_notes','notes','family_tasks','family_task_events',
    'family_events','family_papers','family_domains','family_prep','routines','appointments','calendar_feeds',
    'checklists','checklist_items','documents','name_votes','name_favorites',
    -- repas, courses, produits, lieux
    'meals','meal_plans','meal_plan_items','shopping_lists','shopping_items','recipe_favorites','recipe_dislikes','recipe_reviews',
    'product_scans','scan_results','scan_favorites','avoid_products','favorites','place_favorites','place_reports','place_suggestions',
    -- communauté
    'posts','comments','post_photos','post_likes','post_polls','poll_options','poll_votes','saved_posts','saved_folders',
    'member_follows','forum_subscriptions','group_members','group_invitations','community_groups','community_albums',
    'community_meetups','meetup_participants','event_registrations'
  ];
  ai text[] := array['assistant_conversations','assistant_messages','assistant_feedback'];
begin
  foreach t in array tracked loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
      execute format('create trigger %I before insert or update on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'premium');
    end if;
  end loop;
  foreach t in array ai loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists %I on public.%I', t || '_premium_write', t);
      execute format('create trigger %I before insert or update on public.%I for each row execute function public._require_premium_write(%L)', t || '_premium_write', t, 'ai');
    end if;
  end loop;
end $$;

-- 3. Outils : plus de mois gratuit, achats à vie existants honorés ----------------------------------------------
create or replace function public._has_tool_of(p_tool text, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user is not null and (
    not exists (select 1 from public.paid_tools t where t.key = p_tool)
    or public._premium_of(p_user)
    or exists (
      select 1 from public.paid_tools t
      where t.key = p_tool and (
        public._grant_active(p_user, t.entitlement)
        or exists (select 1 from public.household_members me
                   join public.household_members other on other.household_id = me.household_id and other.user_id <> me.user_id
                   where me.user_id = p_user and me.role in ('owner','coparent') and other.role in ('owner','coparent')
                     and public._grant_active(other.user_id, t.entitlement)))));
$$;

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'premium', public._premium_of(auth.uid()),
    'ai', public._ai_plan_of(auth.uid()),
    'trial_until', null,
    'strict', public.premium_strict(),
    'tools', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'product_id', t.product_id,
        'owned', public._grant_active(auth.uid(), t.entitlement), 'allowed', public._has_tool_of(t.key, auth.uid())) order by t.position)
      from public.paid_tools t), '[]'::jsonb))
  where auth.uid() is not null;
$$;
