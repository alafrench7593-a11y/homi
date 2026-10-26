import { bottleDayPlan, nextSlot, usualMl } from '@/lib/domain/bottleDayPlan';

const at = (h: number, m = 0) => { const d = new Date(2026, 9, 26, h, m); return d.toISOString(); };
const b = (id: string, h: number, m = 0, prepared: number | null = 180) => ({ id, at: at(h, m), prepared_ml: prepared, consumed_ml: prepared ? prepared - 20 : null });

describe('journée biberons', () => {
  it('après le premier biberon, propose toute la journée selon le délai choisi par le parent', () => {
    const slots = bottleDayPlan({ todays: [b('1', 7)], intervalMinutes: 180, now: new Date(2026, 9, 26, 7, 5) });
    expect(slots.map((s) => new Date(s.at).getHours())).toEqual([7, 10, 13, 16, 19, 22]);
    expect(slots[0].status).toBe('done');
    expect(slots[1].status).toBe('next');
    expect(slots.slice(2).every((s) => s.status === 'planned')).toBe(true);
    expect(slots[1].suggestedMl).toBe(180);
  });
  it('le suivant suit le dernier biberon réellement noté', () => {
    const slots = bottleDayPlan({ todays: [b('1', 7), b('2', 10, 30)], intervalMinutes: 180, now: new Date(2026, 9, 26, 11) });
    expect(nextSlot(slots)!.at).toBe(at(13, 30));
  });
  it('créneaux oubliés : proposés « à remplir », le suivant est le premier non dépassé', () => {
    const slots = bottleDayPlan({ todays: [b('1', 7)], intervalMinutes: 180, now: new Date(2026, 9, 26, 14) });
    expect(slots.filter((s) => s.status === 'missed').map((s) => new Date(s.at).getHours())).toEqual([10, 13]);
    expect(new Date(nextSlot(slots)!.at).getHours()).toBe(16);
  });
  it('sans délai choisi : aucun créneau inventé ; sans biberon : rien', () => {
    expect(bottleDayPlan({ todays: [b('1', 7)], intervalMinutes: null }).length).toBe(1);
    expect(bottleDayPlan({ todays: [], intervalMinutes: 180 })).toEqual([]);
  });
  it('quantité : celle du rappel, sinon la dernière préparée, jamais calculée', () => {
    expect(usualMl([b('1', 7, 0, 150), b('2', 10, 0, 170)], null)).toBe(170);
    expect(usualMl([b('1', 7, 0, 150)], 200)).toBe(200);
    expect(usualMl([b('1', 7, 0, null)], null)).toBeNull();
  });
});
