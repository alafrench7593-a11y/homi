-- Passe « Paywall Designer » (04/12/2026) — NON APPLIQUÉE en production (à déployer avec deployer-migrations.command
-- après relecture, APRÈS 20261203000100_paywall_analytics.sql). Voir docs/PAYWALL_ONBOARDING.md § 10.
--
-- Trois événements de plus dans analytics_events (miroir de src/lib/analytics/events.ts : EVENT_NAMES), pour voir où
-- les gens quittent le parcours (onboarding.md § 6 du skill) :
--   onboarding_step_viewed (step)          : chaque écran du parcours /start (stage, need, demo, result) ;
--   onboarding_answer      (step, stage|need) : réponse à une question (étape de vie, besoin) ;
--   purchase_started       (tier, period, trial) : appui sur le bouton d'achat, compte connecté.
-- Mêmes règles qu'avant : consentement « mesure d'audience » obligatoire (RLS), propriétés en liste blanche inchangée.

alter table public.analytics_events drop constraint if exists analytics_events_name_check;
alter table public.analytics_events add constraint analytics_events_name_check check (name in (
  'onboarding_started', 'demo_completed', 'paywall_viewed', 'plan_selected', 'paywall_closed',
  'account_required', 'purchase_outcome', 'trial_confirmed', 'reminder_set',
  'onboarding_step_viewed', 'onboarding_answer', 'purchase_started'));
