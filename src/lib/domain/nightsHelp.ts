/**
 * « M'aider pour les nuits » (logique pure, testée) : bilan du sommeil d'UN enfant d'après les relevés du parent,
 * suggestions souples pour aujourd'hui, accompagnement « La nuit est difficile » et résumé chiffré (sans prénom)
 * transmis à l'assistant IA seulement si le parent l'autorise.
 * Jamais de conclusion à partir d'une seule journée : il faut au moins 3 jours notés pour parler de moyennes et de
 * tendances. Ce sont des constats et des repères, jamais une norme, un diagnostic ou une méthode imposée.
 */
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
  if (!r.enough) return [`${r.daysNoted} jour${r.daysNoted > 1 ? 's' : ''} noté${r.daysNoted > 1 ? 's' : ''} sur les 7 derniers : il en faut au moins ${MIN_DAYS_FOR_REVIEW} pour un bilan. Une seule journée ne dit rien du rythme habituel.`];
  const out = [`${r.daysNoted} jours notés sur les 7 derniers.`];
  if (r.napsPerDay != null) out.push(`Siestes : ${String(r.napsPerDay).replace('.', ',')} par jour en moyenne${r.napMinutes ? `, ${duration(r.napMinutes)} au total` : ''}.`);
  if (r.wakeWindow != null) out.push(`Temps d’éveil habituel : environ ${duration(r.wakeWindow)} entre deux sommeils.`);
  if (r.usualBedtime != null) out.push(`Coucher habituel : vers ${hm(r.usualBedtime).replace(':', ' h ')}.`);
  if (r.nightMinutes) out.push(`Nuit notée : ${duration(r.nightMinutes)} en moyenne.`);
  if (r.nightWakeups != null) out.push(r.nightWakeups ? `Réveils nocturnes notés : ${String(r.nightWakeups).replace('.', ',')} par nuit en moyenne.` : 'Aucun réveil nocturne noté.');
  return out;
}

/** Petits conseils doux selon l'âge et le rythme observé (jamais une méthode imposée, jamais laisser pleurer). */
export function gentleTips(ageMonths: number, r: SleepReview, plan: SleepPlan | null): string[] {
  const ref = referenceFor(ageMonths);
  const tips: string[] = [];
  if (ageMonths < 3) tips.push('À cet âge, les réveils de nuit sont habituels : suivre son rythme et répondre à ses pleurs est conseillé.');
  if (plan?.nextNap && !plan.nextNap.overdue) tips.push('Observez ses signes de fatigue (bâillements, regard dans le vague, frottement des yeux) : ils priment toujours sur l’heure estimée.');
  if (r.enough && r.nightWakeups != null && r.nightWakeups >= 2) tips.push('La nuit, gardez une lumière très douce, une voix basse et des gestes calmes, puis recouchez-le rapidement.');
  if (r.enough && r.napsPerDay != null && ref.naps && r.napsPerDay < ref.naps - 0.5) tips.push(`Les siestes notées sont moins nombreuses que les repères courants pour son âge (${ref.label}) : un moment calme en journée peut l’aider, sans obligation.`);
  if (r.enough && r.changes.some((c) => c.kind === 'night_shorter' || c.kind === 'more_wakeups')) tips.push('Les nuits ont changé ces derniers jours : poussée dentaire, rhume, étape de développement ou changement de rythme sont fréquents. Si cela dure ou vous inquiète, parlez-en à son médecin ou à la PMI.');
  tips.push('Un même ordre chaque soir (bain ou toilette, pyjama, histoire, câlin) aide à repérer le moment du coucher.');
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
export const NIGHT_OBSERVATIONS: { key: NightObservation; label: string }[] = [
  { key: 'many_wakings', label: 'Il se réveille souvent' },
  { key: 'cannot_settle', label: 'Il n’arrive pas à se rendormir' },
  { key: 'crying', label: 'Il pleure beaucoup' },
  { key: 'hungry', label: 'Il semble avoir faim' },
  { key: 'early_waking', label: 'Réveil très tôt' },
  { key: 'unwell', label: 'Il me semble malade ou inconfortable' },
  { key: 'parent_exhausted', label: 'Je suis à bout' },
];

/** Signes qui demandent de l'aide sans attendre (le module ne tente pas de les gérer). */
export const WORRYING_SIGNS: { key: string; label: string }[] = [
  { key: 'fever_young', label: 'Fièvre (38 °C ou plus) chez un bébé de moins de 3 mois' },
  { key: 'breathing', label: 'Respiration difficile, rapide ou avec des pauses, lèvres bleues' },
  { key: 'floppy', label: 'Bébé mou, très somnolent, difficile à réveiller' },
  { key: 'no_feeding', label: 'Refuse de boire, ou très peu de couches mouillées' },
  { key: 'rash', label: 'Taches rouges qui ne s’effacent pas à la pression' },
  { key: 'unusual_cry', label: 'Pleurs inhabituels, geignements, convulsions' },
  { key: 'harm', label: 'J’ai peur de m’énerver contre bébé ou de lui faire du mal' },
];

export interface NightStep { title: string; points: string[] }
/** Pistes générales et douces selon ce que le parent observe. Jamais « laisser pleurer », jamais de culpabilité. */
export function nightPistes(obs: NightObservation[], ageMonths: number): NightStep[] {
  const out: NightStep[] = [];
  const has = (k: NightObservation) => obs.includes(k);
  if (has('parent_exhausted')) out.push({ title: 'D’abord vous', points: [
    'Ce que vous ressentez est fréquent et ne fait pas de vous un mauvais parent.',
    'Si la tension monte, posez bébé sur le dos dans son lit, en sécurité, et sortez quelques minutes respirer. Ne le secouez jamais.',
    'Si un autre adulte est là, passez-lui le relais, même pour un court moment.',
  ] });
  if (has('hungry') || (ageMonths < 6 && (has('many_wakings') || has('crying')))) out.push({ title: 'Faim et confort', points: [
    ageMonths < 6 ? 'À cet âge, les repas de nuit sont souvent encore utiles : proposez le sein ou le biberon s’il montre des signes de faim.' : 'S’il semble avoir faim, un repas de nuit peut encore arriver ; notez-le pour en parler au besoin avec son médecin.',
    'Vérifiez la couche, la température (chambre à 18–20 °C, nuque ni moite ni froide) et la turbulette.',
  ] });
  if (has('many_wakings') || has('cannot_settle') || has('early_waking')) out.push({ title: 'L’aider à se rendormir, en douceur', points: [
    'Lumière très faible, voix basse, peu de mots et de gestes : la nuit reste calme et ennuyeuse.',
    'Restez près de lui, posez une main sur lui, bercez-le ou prenez-le dans les bras si cela l’apaise : il n’y a pas de mauvaise façon de le rassurer.',
    'Attendre quelques instants avant d’intervenir peut lui laisser le temps de se rendormir seul, mais vous n’êtes jamais obligé·e de le laisser pleurer.',
  ] });
  if (has('crying')) out.push({ title: 'Quand il pleure beaucoup', points: [
    'Les pleurs sont sa façon de communiquer : tenez-le contre vous, marchez doucement, parlez-lui ou chantez à voix basse.',
    'Si rien ne l’apaise et que les pleurs vous semblent inhabituels, n’attendez pas : appelez son médecin ou le 15.',
  ] });
  if (has('unwell')) out.push({ title: 'S’il semble malade ou inconfortable', points: [
    'Prenez sa température si vous avez un doute ; un bébé malade dort souvent moins bien.',
    'Ce module ne peut pas évaluer un problème de santé : en cas de doute, appelez son médecin, la permanence de soins (116 117) ou le 15 si c’est urgent.',
  ] });
  if (!out.length) out.push({ title: 'Quelques repères', points: ['Gardez la nuit calme et sombre, répondez à ses besoins, et notez ce qui se passe pour en parler plus tard si cela dure.'] });
  return out;
}

/** Derniers événements de la nuit, en phrases courtes. */
export function lastEvents(own: SleepRecord[], feedsAt: string[], now = new Date()): string[] {
  const N = now.getTime();
  const out: string[] = [];
  const recent = own.filter((s) => Date.parse(s.started_at) <= N && N - Date.parse(s.started_at) < 20 * 60 * MIN);
  const night = [...recent].reverse().find((s) => sleepKind(s) === 'night');
  if (night) {
    out.push(`Nuit commencée à ${clock(Date.parse(night.started_at))}${night.ended_at ? `, terminée à ${clock(Date.parse(night.ended_at))}` : ''}.`);
    const w = Math.max(night.wake_events?.length ?? 0, night.wakeups ?? 0);
    out.push(w ? `${w} réveil${w > 1 ? 's' : ''} noté${w > 1 ? 's' : ''} cette nuit.` : 'Aucun réveil noté cette nuit.');
  } else if (recent.length) {
    const last = recent[recent.length - 1];
    out.push(`Dernier sommeil noté : ${clock(Date.parse(last.started_at))}${last.ended_at ? ` – ${clock(Date.parse(last.ended_at))}` : ' (en cours)'}.`);
  }
  const lastFeed = feedsAt.filter((f) => Date.parse(f) <= N && N - Date.parse(f) < 12 * 60 * MIN).sort().pop();
  if (lastFeed) out.push(`Dernier repas noté : ${clock(Date.parse(lastFeed))}.`);
  if (!out.length) out.push('Rien n’a été noté ces dernières heures.');
  return out;
}
