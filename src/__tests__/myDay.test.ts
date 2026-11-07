import { agendaItems, isoWeekday, remindersOn, sortDay, upcoming, type DayReminder } from '@/lib/domain/myDay';

const DAY = '2026-11-07'; // samedi
const r = (id: string, schedule: DayReminder['schedule'], extra: Partial<DayReminder> = {}): DayReminder => ({ id, title: id, schedule, enabled: true, snoozed_until: null, ...extra });

describe('Ma journée', () => {
  it('jour de la semaine ISO', () => { expect(isoWeekday(DAY)).toBe(6); expect(isoWeekday('2026-11-08')).toBe(7); expect(isoWeekday('2026-11-09')).toBe(1); });
  it('rappels du jour selon leur programmation', () => {
    const list = remindersOn([
      r('vitamine', { type: 'daily', hour: 8, minute: 30 }),
      r('piscine', { type: 'weekly', weekdays: [6], hour: 10, minute: 0 }),
      r('lundi', { type: 'weekly', weekdays: [1], hour: 9, minute: 0 }),
      r('pédiatre', { type: 'once', at: new Date(2026, 10, 7, 14, 15).toISOString() }),
      r('demain', { type: 'once', at: new Date(2026, 10, 8, 9, 0).toISOString() }),
      r('fini', { type: 'daily', hour: 7, minute: 0, until: '2026-11-01' }),
      r('off', { type: 'daily', hour: 7, minute: 0 }, { enabled: false }),
      r('pause', { type: 'daily', hour: 7, minute: 0 }, { snoozed_until: new Date(2026, 10, 9, 12).toISOString() }),
      r('eau', { type: 'interval', minutes: 120, from_hour: 8, to_hour: 20 }),
    ], DAY);
    expect(list.map((x) => `${x.title}@${x.time}`).sort()).toEqual(['eau@08:00', 'piscine@10:00', 'pédiatre@14:15', 'vitamine@08:30'].sort());
    expect(list.find((x) => x.title === 'eau')!.every).toEqual({ minutes: 120, fromHour: 8, toHour: 20 });
  });
  it('agenda : journée entière sans heure, tri par heure, rendez-vous avant rappel', () => {
    const items = agendaItems([
      { key: 'a', source: 'appointment', refId: 'a', title: 'Vaccin Lina', starts: new Date(2026, 10, 7, 10, 0).toISOString(), ends: new Date(2026, 10, 7, 10, 30).toISOString(), allDay: false },
      { key: 'b', source: 'event', refId: 'b', title: 'Anniversaire', starts: new Date(2026, 10, 7).toISOString(), ends: new Date(2026, 10, 8).toISOString(), allDay: true },
    ], DAY);
    const all = sortDay([...items, ...remindersOn([r('Rappel 10h', { type: 'daily', hour: 10, minute: 0 })], DAY)]);
    expect(all.map((x) => x.title)).toEqual(['Anniversaire', 'Vaccin Lina', 'Rappel 10h']);
    expect(all[0].time).toBeNull();
  });
  it('« à venir » garde les éléments sans heure et les rappels à intervalle', () => {
    const items = sortDay(remindersOn([r('matin', { type: 'daily', hour: 8, minute: 0 }), r('soir', { type: 'daily', hour: 20, minute: 0 }), r('eau', { type: 'interval', minutes: 60, from_hour: 8, to_hour: 20 })], DAY));
    expect(upcoming(items, '12:00').map((x) => x.title)).toEqual(['eau', 'soir']);
  });
});
