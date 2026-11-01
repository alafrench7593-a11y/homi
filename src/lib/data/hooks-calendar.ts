/**
 * Abonnement d'agenda (iCalendar) : liens secrets propres à la personne, révocables.
 * Le jeton n'est connu qu'au moment de la création (la base n'en garde que l'empreinte).
 */
import { t as tr } from '@/i18n';
import { useMutation } from '@tanstack/react-query';
import { backend, backendUrl, eq } from '@/lib/backend';
import { useInvalidate, useRows } from './hooks';
import { useUserId } from '@/lib/auth';

export interface CalendarFeed { id: string; label: string; include_health_titles: boolean; created_at: string; last_accessed_at: string | null; revoked_at: string | null }

export function feedUrl(token: string): string | null {
  return backendUrl ? `${backendUrl}/functions/v1/calendar-feed?token=${encodeURIComponent(token)}` : null;
}
/** Adresse « webcal: » : ouvre directement l'abonnement dans Apple Calendrier et Outlook. */
export const webcalUrl = (https: string) => https.replace(/^https?:\/\//, 'webcal://');

export function useCalendarFeeds(enabled: boolean) {
  const userId = useUserId();
  return useRows<CalendarFeed>(['calendar_feeds'], userId && enabled ? {
    table: 'calendar_feeds', columns: 'id,label,include_health_titles,created_at,last_accessed_at,revoked_at',
    filters: [eq('user_id', userId), { col: 'revoked_at', op: 'is', value: null }], order: [{ col: 'created_at', asc: false }],
  } : null);
}

export function useCreateCalendarFeed() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { householdId: string; includeHealthTitles: boolean }) => {
      const rows = await backend.rpc<{ id: string; token: string }[] | { id: string; token: string }>('create_calendar_feed', { p_household: a.householdId, p_include_health_titles: a.includeHealthTitles });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.token) throw new Error(tr('l3.calendar.link_failed'));
      return row;
    },
    onSuccess: () => inv('calendar_feeds'),
  });
}

export function useRevokeCalendarFeed() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.rpc('revoke_calendar_feed', { p_id: id }), onSuccess: () => inv('calendar_feeds') });
}
