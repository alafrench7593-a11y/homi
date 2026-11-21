-- Refonte de l'onboarding et du paywall (21/11/2026) — NON APPLIQUÉE en production : à déployer APRÈS
-- 20261203000100_paywall_analytics.sql et 20261204000100_paywall_designer_events.sql, AVANT la diffusion de la version
-- qui les envoie (sinon l'envoi de la file d'événements est refusé et la file reste sur l'appareil, 200 au plus).
--
-- Trois événements de plus dans analytics_events (miroir de src/lib/analytics/events.ts : EVENT_NAMES) :
--   demo_started     (stage, need) : la démo guidée s'affiche (une fois par besoin) ;
--   story_opened     (need, variant) : « Lire notre histoire » ouvert sur le paywall ;
--   aura_help_opened (need, variant) : « Une question ? » ouvert sur le paywall.
-- Mêmes règles : consentement « mesure d'audience » obligatoire (RLS), propriétés en liste blanche inchangée, aucune
-- donnée d'enfant ni de journal.

alter table public.analytics_events drop constraint if exists analytics_events_name_check;
alter table public.analytics_events add constraint analytics_events_name_check check (name in (
  'onboarding_started', 'demo_completed', 'paywall_viewed', 'plan_selected', 'paywall_closed',
  'account_required', 'purchase_outcome', 'trial_confirmed', 'reminder_set',
  'onboarding_step_viewed', 'onboarding_answer', 'purchase_started',
  'demo_started', 'story_opened', 'aura_help_opened'));
