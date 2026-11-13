-- =====================================================================
-- Missions familiales (14/11/2026) — types d'événements métier (migration dédiée, comme le prévoit
-- 20261113000400_evenements_foyer.sql : une valeur ajoutée à un énuméré n'est utilisable qu'après validation).
-- Retour arrière : impossible de retirer une valeur d'un énuméré sans le recréer ; les valeurs inutilisées sont sans effet.
-- =====================================================================
alter type public.household_event_type add value if not exists 'mission.requested';
alter type public.household_event_type add value if not exists 'mission.accepted';
alter type public.household_event_type add value if not exists 'mission.declined';
alter type public.household_event_type add value if not exists 'mission.postponed';
alter type public.household_event_type add value if not exists 'mission.started';
alter type public.household_event_type add value if not exists 'mission.completed';
alter type public.household_event_type add value if not exists 'mission.cancelled';
alter type public.household_event_type add value if not exists 'mission.question';
alter type public.household_event_type add value if not exists 'mission.reminded';
