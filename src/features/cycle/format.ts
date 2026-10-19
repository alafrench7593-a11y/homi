/** Dates du cycle (jours calendaires « AAAA-MM-JJ ») affichées dans la langue active, sans décalage de fuseau. */
import { formatDate } from '@/i18n';

export const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) => formatDate(`${iso.slice(0, 10)}T12:00:00`, opts);
export const fmtDayYear = (iso: string) => fmtDay(iso, { day: 'numeric', month: 'long', year: 'numeric' });
