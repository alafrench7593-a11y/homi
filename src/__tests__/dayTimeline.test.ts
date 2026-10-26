import { agoLabel, lastSide, nowMinute, quickDiaperRow, recentFoods, recentlyOffered, toDayEvents } from '@/lib/domain/dayTimeline';

const day = new Date(2026, 9, 26, 15, 0);
const at = (h: number, m = 0, d = 26) => new Date(2026, 9, d, h, m).toISOString();

describe('frise du jour (bébé au quotidien)', () => {
  it('couches : seulement celles du jour, triées, avec mouillée / selles', () => {
    const ev = toDayEvents('diaper', [{ id: 'b', at: at(9), wet: true, stool: true }, { id: 'a', at: at(7), wet: true, stool: false }, { id: 'x', at: at(23, 0, 25), wet: true }], day, day);
    expect(ev.map((e) => e.id)).toEqual(['a', 'b']);
    expect(ev[0].start).toBe(7 * 60);
    expect(ev[1].stool).toBe(true);
  });
  it('sommeil commencé la veille : coupé à minuit ; sommeil en cours : jusqu’à maintenant', () => {
    const ev = toDayEvents('sleep', [{ started_at: at(21, 0, 25), ended_at: at(6) }, { started_at: at(14) , ended_at: null }], day, day);
    expect(ev[0]).toMatchObject({ start: 0, end: 360, open: false });
    expect(ev[1]).toMatchObject({ start: 840, end: 900, open: true });
  });
  it('maintenant sur la frise ; un autre jour : rien', () => {
    expect(nowMinute(day, day)).toBe(900);
    expect(nowMinute(new Date(2026, 9, 25), day)).toBeNull();
  });
  it('dernier côté noté (rappel, jamais une consigne)', () => {
    expect(lastSide([{ side: 'left' as const, started_at: at(8) }, { side: 'right' as const, started_at: at(11) }])).toEqual({ side: 'right', at: at(11) });
    expect(lastSide([])).toBeNull();
  });
  it('couche en un geste : mouillée, selles, les deux', () => {
    expect(quickDiaperRow('wet', day)).toMatchObject({ wet: true, stool: false });
    expect(quickDiaperRow('stool', day)).toMatchObject({ wet: false, stool: true });
    expect(quickDiaperRow('both', day)).toMatchObject({ wet: true, stool: true, at: day.toISOString() });
  });
  it('« il y a » lisible', () => {
    expect(agoLabel(at(14, 35), day)).toBe('il y a 25 min');
    expect(agoLabel(at(12, 50), day)).toBe('il y a 2 h 10');
    expect(agoLabel(at(15), day)).toBe('à l’instant');
  });
  it('aliments proposés récemment : du plus récent, sans doublon, 30 jours', () => {
    const tastings = [
      { food_key: 'carotte', food_name: 'Carotte', tasted_on: '2026-10-20' },
      { food_key: 'pomme', food_name: 'Pomme', tasted_on: '2026-10-25' },
      { food_key: 'carotte', food_name: 'Carotte', tasted_on: '2026-10-24' },
      { food_key: 'poire', food_name: 'Poire', tasted_on: '2026-08-01' },
    ];
    expect(recentlyOffered(tastings, '2026-10-26')).toEqual(['pomme', 'carotte']);
    expect(recentFoods([{ at: at(8), foods: ['Pomme', 'carotte'] }, { at: at(12), foods: ['Carotte'] }])).toEqual(['Carotte', 'Pomme']);
  });
});
