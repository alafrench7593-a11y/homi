/**
 * Données d'exemple de l'intro (tuiles et agenda fictifs) — reprises de l'ancienne étape « démo » de l'onboarding,
 * qui n'existe plus depuis l'onboarding en 6 étapes. Valeurs fictives, formatées dans la langue.
 */
import type { TileTint } from '@/components/controls';
import type { IconName } from '@/components/ui';
import type { TodayTask } from '@/features/homeToday/todayModel';
import { formatDate, formatNumber, formatTime, t as tr, type TKey } from '@/i18n';
import { primarySituation, type Assignee, type OnboardingAnswers, type TaskKey } from '@/lib/onboarding/personalize';

export interface Tile { key: string; label: string; value: string; unit?: string; context: string; icon: IconName; tint: TileTint; series?: number[] }

const at = (h: number, m: number, plusDays = 0) => { const d = new Date(); d.setDate(d.getDate() + plusDays); d.setHours(h, m, 0, 0); return d; };

/** Tuiles d'exemple selon la situation principale (valeurs fictives, formatées dans la langue). */
export function demoTiles(a: OnboardingAnswers): Tile[] {
  const appt = at(14, 30, 2);
  const apptValue = `${formatDate(appt, { weekday: 'short' })} ${formatTime(appt)}`;
  switch (primarySituation(a)) {
    case 'baby': return [
      { key: 'bottles', label: tr('o2.tile.bottles.label'), value: formatNumber(5), context: tr('o2.tile.bottles.ctx', { ml: formatNumber(750) }), icon: 'coffee', tint: 'accent', series: [110, 140, 150, 130, 160, 150] },
      { key: 'sleep', label: tr('o2.tile.sleep.label'), value: formatNumber(100), unit: tr('o2.tile.sleep.unit'), context: tr('o2.tile.sleep.ctx'), icon: 'moon', tint: 'accent2' },
    ];
    case 'pregnant': return [
      { key: 'preg', label: tr('o2.tile.preg.label'), value: formatNumber(24), unit: tr('o2.tile.preg.unit'), context: tr('o2.tile.preg.ctx'), icon: 'moon', tint: 'accent' },
      { key: 'appt', label: tr('o2.tile.appt.label'), value: apptValue, context: tr('o2.tile.appt.ctxPreg'), icon: 'calendar', tint: 'accent2' },
    ];
    case 'ttc': return [
      { key: 'day', label: tr('o2.tile.cycleDay.label'), value: formatNumber(12), context: tr('o2.tile.fertile.ctx'), icon: 'sunrise', tint: 'accent' },
      { key: 'symptoms', label: tr('o2.tile.symptoms.label'), value: formatNumber(4), context: tr('o2.tile.symptoms.ctx'), icon: 'activity', tint: 'accent2' },
    ];
    case 'cycle': return [
      { key: 'day', label: tr('o2.tile.cycleDay.label'), value: formatNumber(18), context: tr('o2.tile.period.ctx'), icon: 'calendar', tint: 'accent' },
      { key: 'symptoms', label: tr('o2.tile.symptoms.label'), value: formatNumber(4), context: tr('o2.tile.symptoms.ctx'), icon: 'activity', tint: 'accent2' },
    ];
    case 'kids': return [
      { key: 'missions', label: tr('o2.tile.missions.label'), value: formatNumber(6), context: tr('o2.tile.missions.ctx', { done: formatNumber(4) }), icon: 'send', tint: 'accent', series: [1, 2, 2, 3, 4] },
      { key: 'appt', label: tr('o2.tile.appt.label'), value: apptValue, context: tr('o2.tile.appt.ctxKid'), icon: 'calendar', tint: 'accent2' },
    ];
    default: return [
      { key: 'shopping', label: tr('o2.tile.shopping.label'), value: formatNumber(12), unit: tr('o2.tile.shopping.unit'), context: tr('o2.tile.shopping.ctx'), icon: 'shopping-cart', tint: 'accent' },
      { key: 'missions', label: tr('o2.tile.missions.label'), value: formatNumber(6), context: tr('o2.tile.missions.ctx', { done: formatNumber(4) }), icon: 'send', tint: 'accent2' },
    ];
  }
}

/** Heure plausible de chaque tâche dans la journée d'exemple. */
const TASK_TIME: Record<TaskKey, [number, number]> = {
  night: [3, 0], nanny: [8, 0], daycare: [8, 15], appt: [9, 30], meals: [17, 30], shopping: [18, 0], bag: [19, 30], school: [19, 0], laundry: [20, 0], admin: [20, 30],
};

/** Agenda d'exemple : les tâches du temps 4 avec leur responsable. */
export function demoAgenda(deck: TaskKey[], split: OnboardingAnswers['split']): TodayTask[] {
  return [...deck.slice(0, 3)].sort((x, y) => TASK_TIME[x][0] * 60 + TASK_TIME[x][1] - (TASK_TIME[y][0] * 60 + TASK_TIME[y][1])).map((k, i) => {
    const who: Assignee = split[k] ?? 'me';
    const owner = who === 'later' ? null : who;
    return {
      id: `demo-${k}`, title: tr(`o2.task.${k}` as TKey), kind: who === 'other' ? 'mission' : 'task', ownerId: owner, creatorId: 'me',
      dueAt: at(TASK_TIME[k][0], TASK_TIME[k][1]).toISOString(), timed: true, late: false,
      status: who === 'other' ? 'accepted' : who === 'later' ? 'open' : 'todo', done: false, awaitsMe: false,
      canComplete: who === 'me', canAccept: false, rank: i, raw: {} as never,
    };
  });
}
