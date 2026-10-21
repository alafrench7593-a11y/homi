/**
 * Contenu des widgets et actions rapides (iOS, Android) selon le profil affiché. Les widgets natifs demandent une
 * version compilée de l'application (EAS) : ce module prépare leurs données, testées, et applique la règle de
 * confidentialité : AUCUNE information sensible sur l'écran verrouillé sans l'accord explicite de l'utilisatrice.
 */
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

const hm = (iso: string, tz?: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).replace(':', ' h ');
const dm = (iso: string, tz?: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });

export function widgetSnapshot(i: WidgetInput, opts: { lockScreenDetails: boolean; tz?: string } = { lockScreenDetails: false }): WidgetSnapshot {
  const lines: WidgetLine[] = [];
  if ((i.scope === 'baby' || i.scope === 'child') && i.childName) {
    if (i.sleepingSince) lines.push({ key: 'sleep', label: 'Sommeil en cours', value: `depuis ${hm(i.sleepingSince, opts.tz)}`, sensitive: false });
    if (i.lastBottleAt) lines.push({ key: 'bottle', label: 'Dernier biberon', value: hm(i.lastBottleAt, opts.tz), sensitive: false });
    if (i.nextBottleAt) lines.push({ key: 'nextBottle', label: 'Prochain rappel biberon', value: hm(i.nextBottleAt, opts.tz), sensitive: false });
  }
  if (i.scope === 'pregnancy' && i.weeksSA != null) lines.push({ key: 'sa', label: 'Grossesse', value: `${i.weeksSA} SA`, sensitive: true });
  if (i.scope === 'cycle' && i.nextPeriodOn) lines.push({ key: 'cycle', label: 'Prochaines règles (estimation)', value: dm(i.nextPeriodOn, opts.tz), sensitive: true });
  if (i.nextAppointment) lines.push({ key: 'appt', label: 'Prochain rendez-vous', value: `${dm(i.nextAppointment.at, opts.tz)} · ${i.nextAppointment.title}`, sensitive: true });
  if (i.nextReminder) lines.push({ key: 'reminder', label: 'Prochain rappel', value: `${hm(i.nextReminder.at, opts.tz)} · ${i.nextReminder.title}`, sensitive: true });
  // Écran verrouillé : sans accord explicite, rien de sensible (grossesse, cycle, santé, intitulés) ni le prénom
  const safe = opts.lockScreenDetails ? lines : lines.map((l) => (l.sensitive ? { ...l, value: 'Ouvrir Toi & Moi pour voir' } : l));
  const title = opts.lockScreenDetails && i.childName ? i.childName : 'Toi & Moi';
  const quickAction = i.scope === 'baby' ? { label: 'Noter un biberon', url: '/track/bottle' }
    : i.scope === 'child' ? { label: 'Noter un repas', url: '/track/meal' }
    : i.scope === 'cycle' ? { label: 'Noter mes règles', url: '/cycle/calendar' }
    : i.scope === 'pregnancy' ? { label: 'Mon humeur', url: '/me/mood' } : null;
  return { title, lines: safe, quickAction };
}
