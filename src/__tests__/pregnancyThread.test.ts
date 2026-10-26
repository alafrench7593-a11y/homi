import { daysUntil, pregnancyThread } from '@/lib/domain/pregnancyThread';

const windows = [
  { key: 'echo_1', from: '2026-06-01', to: '2026-06-21' },
  { key: 'echo_2', from: '2026-08-10', to: '2026-09-07' },
  { key: 'echo_3', from: '2026-10-19', to: '2026-11-22' },
];

describe('fil de la grossesse', () => {
  it('ordre chronologique : fenêtres, rendez-vous, aujourd’hui, terme ; le prochain est mis en avant', () => {
    const items = pregnancyThread({ today: '2026-10-01', due: '2027-02-08', windows, echoAppts: [{ key: 'echo_1', id: 'a1', date: '2026-06-10' }], appts: [{ id: 'c1', date: '2026-10-12' }] });
    expect(items.map((i) => i.key)).toEqual(['echo-echo_1', 'echo-echo_2', 'today', 'appt-c1', 'echo-echo_3', 'due']);
    expect(items.find((i) => i.key === 'echo-echo_1')!.state).toBe('done');
    expect(items.find((i) => i.key === 'echo-echo_1')!.apptId).toBe('a1');
    expect(items.find((i) => i.key === 'appt-c1')!.state).toBe('next');
    expect(items.find((i) => i.key === 'echo-echo_3')!.state).toBe('later');
  });
  it('fenêtre en cours : « maintenant » ; terme passé : non affiché', () => {
    const items = pregnancyThread({ today: '2026-10-25', due: '2026-10-20', windows, echoAppts: [], appts: [] });
    expect(items.find((i) => i.key === 'echo-echo_3')!.state).toBe('now');
    expect(items.some((i) => i.kind === 'due')).toBe(false);
  });
  it('jours restants', () => {
    expect(daysUntil('2026-10-01', '2026-10-12')).toBe(11);
  });
});
