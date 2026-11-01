/**
 * Contenu des widgets et actions rapides (iOS, Android) selon le profil affiché. Les widgets natifs demandent une
 * version compilée de l'application (EAS) : ce module prépare leurs données, testées, et applique la règle de
 * confidentialité : AUCUNE information sensible sur l'écran verrouillé sans l'accord explicite de l'utilisatrice.
 */
import { t as tr, localeTag, getLocale } from '@/i18n';

export interface WidgetInput {
  scope: 'baby' | 'child' | 'pregnancy' | 'cycle' | 'other';
  childName?: string | null;
  lastBottleAt?: string | null;
  nextBottleAt?: string | null;
  sleepingSince?: string | null;
  weeksSA?: number | null;
  nextPeriodOn?: string | null;
  nextAppointment?: { title: string; at: string } | null;
  nextReminder?: { title: string; at: string } | null;
}
export interface WidgetLine { key: string; label: string; value: string; sensitive: boolean }
export interface WidgetSnapshot { title: string; lines: WidgetLine[]; quickAction: { label: string; url: string } | null }

const hm = (iso: string, tz?: string) => {
  const s = new Date(iso).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit', timeZone: tz });
  return getLocale() === 'en' ? s : s.replace(':', ' h ');
};
const dm = (iso: string, tz?: string) => new Date(iso).toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });

export function widgetSnapshot(i: WidgetInput, opts: { lockScreenDetails: boolean; tz?: string } = { lockScreenDetails: false }): WidgetSnapshot {
  const lines: WidgetLine[] = [];
  if ((i.scope === 'baby' || i.scope === 'child') && i.childName) {
    if (i.sleepingSince) lines.push({ key: 'sleep', label: tr('l6.widget.sleeping'), value: tr('l6.widget.since', { time: hm(i.sleepingSince, opts.tz) }), sensitive: false });
    if (i.lastBottleAt) lines.push({ key: 'bottle', label: tr('l6.widget.lastBottle'), value: hm(i.lastBottleAt, opts.tz), sensitive: false });
    if (i.nextBottleAt) lines.push({ key: 'nextBottle', label: tr('l6.widget.nextBottle'), value: hm(i.nextBottleAt, opts.tz), sensitive: false });
  }
  if (i.scope === 'pregnancy' && i.weeksSA != null) lines.push({ key: 'sa', label: tr('l6.widget.pregnancy'), value: tr('l6.widget.weeks', { n: String(i.weeksSA) }), sensitive: true });
  if (i.scope === 'cycle' && i.nextPeriodOn) lines.push({ key: 'cycle', label: tr('l6.widget.nextPeriod'), value: dm(i.nextPeriodOn, opts.tz), sensitive: true });
  if (i.nextAppointment) lines.push({ key: 'appt', label: tr('l6.widget.nextAppt'), value: `${dm(i.nextAppointment.at, opts.tz)} · ${i.nextAppointment.title}`, sensitive: true });
  if (i.nextReminder) lines.push({ key: 'reminder', label: tr('l6.widget.nextReminder'), value: `${hm(i.nextReminder.at, opts.tz)} · ${i.nextReminder.title}`, sensitive: true });
  // Écran verrouillé : sans accord explicite, rien de sensible (grossesse, cycle, santé, intitulés) ni le prénom
  const safe = opts.lockScreenDetails ? lines : lines.map((l) => (l.sensitive ? { ...l, value: tr('l6.widget.openApp') } : l));
  const title = opts.lockScreenDetails && i.childName ? i.childName : 'Au fil de nous';
  const quickAction = i.scope === 'baby' ? { label: tr('l6.widget.qaBottle'), url: '/track/bottle' }
    : i.scope === 'child' ? { label: tr('l6.widget.qaMeal'), url: '/track/meal' }
    : i.scope === 'cycle' ? { label: tr('l6.widget.qaPeriod'), url: '/cycle/calendar' }
    : i.scope === 'pregnancy' ? { label: tr('l6.widget.qaMood'), url: '/me/mood' } : null;
  return { title, lines: safe, quickAction };
}
