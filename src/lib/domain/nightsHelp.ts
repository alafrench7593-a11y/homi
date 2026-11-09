/**
 * « M'aider pour les nuits » (logique pure, testée) : bilan du sommeil d'UN enfant d'après les relevés du parent,
 * suggestions souples pour aujourd'hui, accompagnement « La nuit est difficile » et résumé chiffré (sans prénom)
 * transmis à l'assistant IA seulement si le parent l'autorise.
 * Jamais de conclusion à partir d'une seule journée : il faut au moins 3 jours notés pour parler de moyennes et de
 * tendances. Ce sont des constats et des repères, jamais une norme, un diagnostic ou une méthode imposée.
 */
import { localeTag, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';
import { habitChanges, sleepRhythm, wakeWindows, type HabitChange } from './sleepEstimate';
import { clock, median, ownSleeps, referenceFor, sleepKind, type SleepPlan, type SleepProfile, type SleepRecord } from './sleepPlanner';
import type { SleepLog } from './daily';
import type { SleepContext } from '../../../supabase/functions/_shared/assistant-prompt';

export const MIN_DAYS_FOR_REVIEW = 3;
const MIN = 60_000;
const DAY = 86_400_000;

export interface SleepReview {
  /** Jours avec au moins un sommeil noté parmi les 7 derniers (aujourd'hui exclu) */
  daysNoted: number;
  enough: boolean;
  napsPerDay: number | null;
  napMinutes: number | null;
  nightMinutes: number | null;
  nightWakeups: number | null;
  /** Temps d'éveil habituel (médiane, minutes) */
  wakeWindow: number | null;
  /** Heure habituelle du coucher (médiane des débuts de nuit), en minutes depuis minuit */
  usualBedtime: number | null;
  changes: HabitChange[];
  /** Dernière nuit notée : réveils */
  lastNightWakeups: number | null;
}

/** Bilan sur les 7 derniers jours. Sans au moins 3 jours notés : seulement le nombre de jours, aucune moyenne. */
export function sleepReview(sleeps: SleepRecord[], childId: string, now = new Date()): SleepReview {
  const own = ownSleeps(sleeps, childId);
  const logs = own as unknown as SleepLog[];
  const r = sleepRhythm(logs, now, 7);
  const enough = r.days >= MIN_DAYS_FOR_REVIEW;
  const from = now.getTime() - 7 * DAY;
  const nights = own.filter((s) => sleepKind(s) === 'night' && Date.parse(s.started_at) >= from && Date.parse(s.started_at) <= now.getTime());
  // Coucher : minutes depuis midi pour ne pas couper la nuit à minuit
  const bedtimes = nights.map((s) => { const d = new Date(s.started_at); const m = d.getHours() * 60 + d.getMinutes(); return m < 12 * 60 ? m + 1440 : m; });
  const windows = wakeWindows(logs, now, 7);
  const lastNight = nights[nights.length - 1];
  return {
    daysNoted: r.days, enough,
    napsPerDay: enough ? r.naps : null,
    napMinutes: enough ? r.napMinutes : null,
    nightMinutes: enough ? r.nightMinutes : null,
    nightWakeups: enough ? r.wakeups : null,
    wakeWindow: enough && windows.length >= 3 ? Math.round(median(windows) / 5) * 5 : null,
    usualBedtime: enough && bedtimes.length >= 3 ? Math.round(median(bedtimes) / 5) * 5 % 1440 : null,
    changes: enough ? habitChanges(logs, now) : [],
    lastNightWakeups: lastNight ? Math.max(lastNight.wake_events?.length ?? 0, lastNight.wakeups ?? 0) : null,
  };
}

export const hm = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const hmOf = (ms: number) => { const d = new Date(ms); return hm(d.getHours() * 60 + d.getMinutes()); };
export const duration = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, '0')}` : `${Math.round(minutes)} min`);

/** Phrases du bilan (constats). */
export function reviewLines(r: SleepReview): string[] {
  // Virgule décimale partout sauf en anglais (fr, es, de, it).
  const dec = (n: number) => (localeTag().startsWith('en') ? String(n) : String(n).replace('.', ','));
  if (!r.enough) return [tr('l2.nh.notEnough', { count: r.daysNoted, min: MIN_DAYS_FOR_REVIEW })];
  const out = [tr('l2.nh.daysNoted', { n: r.daysNoted })];
  if (r.napsPerDay != null) out.push(tr('l2.nh.naps', { naps: dec(r.napsPerDay), total: r.napMinutes ? tr('l2.nh.napsTotal', { d: duration(r.napMinutes) }) : '' }));
  if (r.wakeWindow != null) out.push(tr('l2.nh.wakeWindow', { d: duration(r.wakeWindow) }));
  if (r.usualBedtime != null) out.push(tr('l2.nh.bedtime', { t: localeTag().startsWith('fr') ? hm(r.usualBedtime).replace(':', ' h ') : hm(r.usualBedtime) }));
  if (r.nightMinutes) out.push(tr('l2.nh.night', { d: duration(r.nightMinutes) }));
  if (r.nightWakeups != null) out.push(r.nightWakeups ? tr('l2.nh.wakeups', { n: dec(r.nightWakeups) }) : tr('l2.nh.noWakeups'));
  return out;
}

/** Petits conseils doux selon l'âge et le rythme observé (jamais une méthode imposée, jamais laisser pleurer). */
export function gentleTips(ageMonths: number, r: SleepReview, plan: SleepPlan | null): string[] {
  const ref = referenceFor(ageMonths);
  const tips: string[] = [];
  if (ageMonths < 3) tips.push(tr('l2.nh.tip.young'));
  if (plan?.nextNap && !plan.nextNap.overdue) tips.push(tr('l2.nh.tip.tired'));
  if (r.enough && r.nightWakeups != null && r.nightWakeups >= 2) tips.push(tr('l2.nh.tip.dim'));
  if (r.enough && r.napsPerDay != null && ref.naps && r.napsPerDay < ref.naps - 0.5) tips.push(tr('l2.nh.tip.fewNaps', { label: ref.label }));
  if (r.enough && r.changes.some((c) => c.kind === 'night_shorter' || c.kind === 'more_wakeups')) tips.push(tr('l2.nh.tip.changed'));
  tips.push(tr('l2.nh.tip.routine'));
  return tips.slice(0, 4);
}

/** Résumé chiffré transmis à l'IA (si le parent l'autorise) : aucun prénom, aucun texte libre. */
export function sleepContextFor(ageMonths: number, correctedMonths: number | null, r: SleepReview, plan: SleepPlan | null, profile: SleepProfile | null): SleepContext {
  return {
    ageMonths, correctedAgeMonths: correctedMonths, daysNoted: r.daysNoted,
    napsPerDay: r.napsPerDay, napMinutes: r.napMinutes, nightMinutes: r.nightMinutes, nightWakeups: r.nightWakeups,
    wakeWindowMinutes: r.wakeWindow, usualBedtime: r.usualBedtime != null ? hm(r.usualBedtime) : null,
    nextNapAt: plan?.nextNap && !plan.nextNap.overdue ? hmOf(plan.nextNap.at) : null,
    bedtimeAt: plan?.bedtime && !plan.bedtime.overdue ? hmOf(plan.bedtime.at) : null,
    routineMinutes: profile?.routine_minutes ?? null,
    changes: r.changes.map((c) => c.kind),
    difficulties: profile?.difficulties ?? [],
  };
}

// ─── « La nuit est difficile » ────────────────────────────────────────────────────────────────────

export type NightObservation = 'many_wakings' | 'cannot_settle' | 'crying' | 'hungry' | 'early_waking' | 'unwell' | 'parent_exhausted';
const OBS_FR: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Il se réveille souvent' },
  { key: 'cannot_settle', label: 'Il n’arrive pas à se rendormir' },
  { key: 'crying', label: 'Il pleure beaucoup' },
  { key: 'hungry', label: 'Il semble avoir faim' },
  { key: 'early_waking', label: 'Réveil très tôt' },
  { key: 'unwell', label: 'Il me semble malade ou inconfortable' },
  { key: 'parent_exhausted', label: 'Je suis à bout' },
];
const OBS_EN: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Wakes up often' },
  { key: 'cannot_settle', label: 'Cannot get back to sleep' },
  { key: 'crying', label: 'Cries a lot' },
  { key: 'hungry', label: 'Seems hungry' },
  { key: 'early_waking', label: 'Wakes very early' },
  { key: 'unwell', label: 'Seems unwell or uncomfortable' },
  { key: 'parent_exhausted', label: 'I am exhausted' },
];
const OBS_ES: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Se despierta a menudo' },
  { key: 'cannot_settle', label: 'No consigue volver a dormirse' },
  { key: 'crying', label: 'Llora mucho' },
  { key: 'hungry', label: 'Parece tener hambre' },
  { key: 'early_waking', label: 'Se despierta muy temprano' },
  { key: 'unwell', label: 'Me parece que está enfermo o incómodo' },
  { key: 'parent_exhausted', label: 'No puedo más' },
];
const OBS_DE: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Wacht oft auf' },
  { key: 'cannot_settle', label: 'Schläft nicht wieder ein' },
  { key: 'crying', label: 'Weint viel' },
  { key: 'hungry', label: 'Scheint Hunger zu haben' },
  { key: 'early_waking', label: 'Wacht sehr früh auf' },
  { key: 'unwell', label: 'Wirkt krank oder unwohl' },
  { key: 'parent_exhausted', label: 'Ich bin am Ende meiner Kräfte' },
];
const OBS_IT: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Si sveglia spesso' },
  { key: 'cannot_settle', label: 'Non riesce a riaddormentarsi' },
  { key: 'crying', label: 'Piange molto' },
  { key: 'hungry', label: 'Sembra avere fame' },
  { key: 'early_waking', label: 'Si sveglia molto presto' },
  { key: 'unwell', label: 'Mi sembra malato o a disagio' },
  { key: 'parent_exhausted', label: 'Sono allo stremo' },
];
export const NIGHT_OBSERVATIONS: { key: NightObservation; label: string }[] = localized(OBS_FR, OBS_EN, { es: OBS_ES, de: OBS_DE, it: OBS_IT });

/** Signes qui demandent de l'aide sans attendre (le module ne tente pas de les gérer). */
const WORRYING_FR: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Fièvre (38 °C ou plus) chez un bébé de moins de 3 mois' },
  { key: 'breathing', label: 'Respiration difficile, rapide ou avec des pauses, lèvres bleues' },
  { key: 'floppy', label: 'Bébé mou, très somnolent, difficile à réveiller' },
  { key: 'no_feeding', label: 'Refuse de boire, ou très peu de couches mouillées' },
  { key: 'rash', label: 'Taches rouges qui ne s’effacent pas à la pression' },
  { key: 'unusual_cry', label: 'Pleurs inhabituels, geignements, convulsions' },
  { key: 'harm', label: 'J’ai peur de m’énerver contre bébé ou de lui faire du mal' },
];
const WORRYING_EN: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Fever (38 °C or above) in a baby under 3 months' },
  { key: 'breathing', label: 'Breathing that is difficult, fast or with pauses, blue lips' },
  { key: 'floppy', label: 'Floppy baby, very drowsy, hard to wake' },
  { key: 'no_feeding', label: 'Refuses to feed, or very few wet nappies' },
  { key: 'rash', label: 'Red spots that do not fade under pressure' },
  { key: 'unusual_cry', label: 'Unusual crying, whimpering, convulsions' },
  { key: 'harm', label: 'I am afraid of losing my temper with baby or of hurting them' },
];
const WORRYING_ES: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Fiebre (38 °C o más) en un bebé de menos de 3 meses' },
  { key: 'breathing', label: 'Respiración difícil, rápida o con pausas, labios azulados' },
  { key: 'floppy', label: 'Bebé flácido, muy adormilado, difícil de despertar' },
  { key: 'no_feeding', label: 'Se niega a comer, o muy pocos pañales mojados' },
  { key: 'rash', label: 'Manchas rojas que no desaparecen al presionarlas' },
  { key: 'unusual_cry', label: 'Llanto inusual, quejidos, convulsiones' },
  { key: 'harm', label: 'Tengo miedo de enfadarme con el bebé o de hacerle daño' },
];
const WORRYING_DE: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Fieber (38 °C oder mehr) bei einem Baby unter 3 Monaten' },
  { key: 'breathing', label: 'Schwere, schnelle Atmung oder Atempausen, blaue Lippen' },
  { key: 'floppy', label: 'Baby schlaff, sehr schläfrig, schwer zu wecken' },
  { key: 'no_feeding', label: 'Verweigert das Trinken, oder sehr wenige nasse Windeln' },
  { key: 'rash', label: 'Rote Flecken, die auf Druck nicht verblassen' },
  { key: 'unusual_cry', label: 'Ungewöhnliches Weinen, Wimmern, Krampfanfälle' },
  { key: 'harm', label: 'Ich habe Angst, die Beherrschung zu verlieren oder dem Baby wehzutun' },
];
const WORRYING_IT: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Febbre (38 °C o più) in un bebè con meno di 3 mesi' },
  { key: 'breathing', label: 'Respiro difficile, rapido o con pause, labbra blu' },
  { key: 'floppy', label: 'Bebè molle, molto sonnolento, difficile da svegliare' },
  { key: 'no_feeding', label: 'Rifiuta di bere, o pochissimi pannolini bagnati' },
  { key: 'rash', label: 'Macchie rosse che non scompaiono alla pressione' },
  { key: 'unusual_cry', label: 'Pianto insolito, lamenti, convulsioni' },
  { key: 'harm', label: 'Ho paura di arrabbiarmi con il bebè o di fargli del male' },
];
export const WORRYING_SIGNS: { key: string; label: string }[] = localized(WORRYING_FR, WORRYING_EN, { es: WORRYING_ES, de: WORRYING_DE, it: WORRYING_IT });

export interface NightStep { title: string; points: string[] }
/** Pistes générales et douces selon ce que le parent observe. Jamais « laisser pleurer », jamais de culpabilité. */
export function nightPistes(obs: NightObservation[], ageMonths: number): NightStep[] {
  const out: NightStep[] = [];
  const has = (k: NightObservation) => obs.includes(k);
  if (has('parent_exhausted')) out.push({ title: tr('l2.nh.p.you.title'), points: [tr('l2.nh.p.you.1'), tr('l2.nh.p.you.2'), tr('l2.nh.p.you.3')] });
  if (has('hungry') || (ageMonths < 6 && (has('many_wakings') || has('crying')))) out.push({ title: tr('l2.nh.p.food.title'), points: [
    ageMonths < 6 ? tr('l2.nh.p.food.young') : tr('l2.nh.p.food.older'),
    tr('l2.nh.p.food.check'),
  ] });
  if (has('many_wakings') || has('cannot_settle') || has('early_waking')) out.push({ title: tr('l2.nh.p.settle.title'), points: [tr('l2.nh.p.settle.1'), tr('l2.nh.p.settle.2'), tr('l2.nh.p.settle.3')] });
  if (has('crying')) out.push({ title: tr('l2.nh.p.cry.title'), points: [tr('l2.nh.p.cry.1'), tr('l2.nh.p.cry.2')] });
  if (has('unwell')) out.push({ title: tr('l2.nh.p.unwell.title'), points: [tr('l2.nh.p.unwell.1'), tr('l2.nh.p.unwell.2')] });
  if (!out.length) out.push({ title: tr('l2.nh.p.refs.title'), points: [tr('l2.nh.p.refs.1')] });
  return out;
}

/** Derniers événements de la nuit, en phrases courtes. */
export function lastEvents(own: SleepRecord[], feedsAt: string[], now = new Date()): string[] {
  const N = now.getTime();
  const out: string[] = [];
  const recent = own.filter((s) => Date.parse(s.started_at) <= N && N - Date.parse(s.started_at) < 20 * 60 * MIN);
  const night = [...recent].reverse().find((s) => sleepKind(s) === 'night');
  if (night) {
    out.push(tr('l2.nh.ev.night', { start: clock(Date.parse(night.started_at)), end: night.ended_at ? tr('l2.nh.ev.nightEnd', { t: clock(Date.parse(night.ended_at)) }) : '' }));
    const w = Math.max(night.wake_events?.length ?? 0, night.wakeups ?? 0);
    out.push(w ? tr('l2.nh.ev.wakings', { count: w }) : tr('l2.nh.ev.noWakings'));
  } else if (recent.length) {
    const last = recent[recent.length - 1];
    out.push(tr('l2.nh.ev.lastSleep', { start: clock(Date.parse(last.started_at)), end: last.ended_at ? tr('l2.nh.ev.lastSleepEnd', { t: clock(Date.parse(last.ended_at)) }) : tr('l2.nh.ev.ongoing') }));
  }
  const lastFeed = feedsAt.filter((f) => Date.parse(f) <= N && N - Date.parse(f) < 12 * 60 * MIN).sort().pop();
  if (lastFeed) out.push(tr('l2.nh.ev.lastFeed', { t: clock(Date.parse(lastFeed)) }));
  if (!out.length) out.push(tr('l2.nh.ev.nothing'));
  return out;
}
