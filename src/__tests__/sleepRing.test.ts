import { arcPath, clockAngle, sleepKind, sleepRing } from '@/lib/domain/sleepRing';
import type { Sleep } from '@/lib/types';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString();
const S = (id: string, a: string, b: string | null, over: Partial<Sleep> = {}): Sleep =>
  ({ id, child_id: 'lina', household_id: 'h', started_at: a, ended_at: b, wakeups: 0, created_at: a, created_by: 'u', ...over }) as Sleep;
const NOW = new Date(2026, 10, 24, 15, 0);

describe('anneau du sommeil sur 24 h', () => {
  it('place la nuit et les siestes à leur heure et additionne sans arrondi trompeur', () => {
    const r = sleepRing([S('n', at(23, 20, 30), at(24, 7, 10)), S('s1', at(24, 9, 30), at(24, 10, 15)), S('s2', at(24, 13, 0), at(24, 14, 30))], 'lina', NOW);
    expect(r.nightMin).toBe(640); // 20:30 → 7:10
    expect(r.napMin).toBe(135);
    expect(r.totalMin).toBe(775);
    expect(r.unrecordedMin).toBe(24 * 60 - 775);
    expect(r.arcs.map((a) => a.kind)).toEqual(['night', 'nap', 'nap']);
    expect(r.arcs[1].from).toBeCloseTo(clockAngle(new Date(2026, 10, 24, 9, 30)));
  });

  it('coupe ce qui déborde de la fenêtre et prolonge un sommeil en cours jusqu’à maintenant', () => {
    const r = sleepRing([S('old', at(23, 10, 0), at(23, 16, 0)), S('live', at(24, 14, 0), null)], 'lina', NOW);
    expect(r.arcs.map((a) => a.id)).toEqual(['old', 'live']);
    expect(r.arcs[0].minutes).toBe(60); // 15:00 → 16:00 la veille seulement
    expect(r.arcs[1]).toMatchObject({ ongoing: true, minutes: 60 });
  });

  it('ne compte qu’une fois deux saisies qui se chevauchent', () => {
    const r = sleepRing([S('a', at(24, 9, 0), at(24, 10, 0)), S('b', at(24, 9, 30), at(24, 10, 30))], 'lina', NOW);
    expect(r.totalMin).toBe(90);
  });

  it('ignore les autres enfants et n’invente rien sans données', () => {
    const r = sleepRing([S('x', at(24, 9, 0), at(24, 10, 0), { child_id: 'noe' })], 'lina', NOW);
    expect(r).toMatchObject({ arcs: [], totalMin: 0, unrecordedMin: 1440 });
  });

  it('nuit = type noté, sinon début entre 19 h et 5 h', () => {
    expect(sleepKind({ kind: 'nap', started_at: at(24, 21) })).toBe('nap');
    expect(sleepKind({ kind: null, started_at: at(24, 21) })).toBe('night');
    expect(sleepKind({ kind: null, started_at: at(24, 13) })).toBe('nap');
  });

  it('tracé d’arc : grand arc au-delà de 180°', () => {
    expect(arcPath(50, 50, 40, 0, 90)).toMatch(/A 40 40 0 0 1/);
    expect(arcPath(50, 50, 40, 0, 270)).toMatch(/A 40 40 0 1 1/);
  });
});
