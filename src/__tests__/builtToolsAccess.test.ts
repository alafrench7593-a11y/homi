/**
 * Outils construits le 20/11/2026 (anciens « absents » de la liste des 200) : chacun est une entrée visible du
 * catalogue, ouverte sur sa route, réservée au Premium, et fermée à la nounou — sauf « Laits infantiles » (lecture).
 */
import { gateFor } from '@/lib/premium/access';
import { H200_BY_N } from '@/lib/journeys/homi200';
import { resolveTool } from '@/lib/journeys/tools';
import type { AccessInfo } from '@/lib/premium/offers';

const BUILT: [number, string][] = [
  [39, '/pregnancy/contractions'], [44, '/pregnancy/birth-plan'], [48, '/family/birth-partner'], [58, '/postpartum/pelvic'], [60, '/postpartum/healing'],
  [73, '/feeding/milk-stock'], [74, '/feeding/milk-stock'], [76, '/feeding/difficulties'], [77, '/feeding/difficulties'], [79, '/feeding/formula'],
  [122, '/meals/portions'], [133, '/reading'], [134, '/reading/stories'], [161, '/family/my-place'], [172, '/family/calm'], [179, '/family/moments'],
  [186, '/family/expenses'], [189, '/family/pets'],
];
const nanny = { caregiver: true, strict: true, ai: false, tools: [] } as unknown as AccessInfo;

describe('outils construits le 20/11/2026', () => {
  it('disponibles, sur leur route', () => {
    for (const [n, route] of BUILT) {
      const e = H200_BY_N[n];
      expect([n, e.isAvailable]).toEqual([n, true]);
      const r = resolveTool(e.id)!;
      const href = e.kind === 'view' ? r.sub!.href({ scope: 'baby', childId: 'c1', babyId: 'c1', postpartum: true }) ?? r.sub!.href({ scope: 'pregnancy', pregnancyId: 'p' }) : r.def.href({ scope: 'family' });
      expect([n, (href ?? '').split('?')[0]]).toEqual([n, route]);
    }
  });

  it('Premium ; la nounou ne voit que « Laits infantiles »', () => {
    for (const [n, route] of BUILT) {
      expect([n, gateFor(route, false)]).toEqual([n, 'locked']);
      expect([n, gateFor(route, true)]).toEqual([n, 'open']);
      expect([n, gateFor(route, false, nanny)]).toEqual([n, n === 79 ? 'open' : 'locked']);
    }
  });
});
