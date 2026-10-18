/**
 * Agenda familial : la logique pure vit dans supabase/functions/_shared/calendar.ts, partagée avec
 * le flux d'abonnement iCalendar du serveur (fonction « calendar-feed »). Ré-export pour l'application.
 */
export * from '../../../supabase/functions/_shared/calendar.ts';
