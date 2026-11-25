import { matchIntent, resolveIntent } from '@/lib/aura/intents';

const child = { id: 'c1', first_name: 'Lina', household_id: 'h1' } as never;
const ctx = (now: Date, bottles: { at: string; consumed_ml: number | null; child_id: string }[] = []) => ({
  now, children: [child], activeChildId: 'c1', catalog: [], member: { role: 'owner' }, sleeps: [], bottles, t: (k: string, p?: Record<string, unknown>) => `${k} ${JSON.stringify(p ?? {})}`,
  clock: (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
}) as never;

describe('Aura enregistre les biberons dits en phrase (25/11/2026)', () => {
  it('« 6 fois depuis midi toutes les 2 h » → 12:00, 14:00 … 22:00', () => {
    expect(matchIntent('Lina a pris 6 fois son biberon à partir de midi toutes les 2h')).toEqual({ kind: 'log_bottle', ml: null, times: ['12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] });
  });
  it('« biberon de 150 ml à 14h » → une heure précise et la quantité', () => {
    expect(matchIntent('biberon de 150 ml à 14h30')).toEqual({ kind: 'log_bottle', ml: 150, times: ['14:30'] });
  });
  it('« il vient de boire 150 ml » reste la règle « maintenant »', () => {
    expect(matchIntent('il vient de boire 150 ml au biberon')).toEqual({ kind: 'log_bottle', ml: 150 });
  });
  it('à confirmer : jamais dans le futur, jamais deux fois la même heure', () => {
    const now = new Date(2026, 10, 25, 17, 0);
    const r = resolveIntent({ kind: 'log_bottle', ml: null, times: ['12:00', '14:00', '16:00', '18:00'], childId: 'c1' } as never,
      ctx(now, [{ at: new Date(2026, 10, 25, 14, 5).toISOString(), consumed_ml: 120, child_id: 'c1' }]));
    expect(r.status).toBe('confirm');
    const rows = (r as unknown as { write: { rows: { at: string }[] } }).write.rows;
    expect(rows.map((x) => new Date(x.at).getHours())).toEqual([12, 16]);
  });
});
