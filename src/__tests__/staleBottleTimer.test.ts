/** F-09 (QA 02/11/2026) : un rappel biberon échu depuis plus de 12 h n'est plus affiché. */
import { isStaleTimer } from '@/lib/domain/bottleTimer';

it('rappel échu : affiché jusqu’à 12 h, masqué ensuite', () => {
  const now = new Date('2026-12-29T10:00:00Z');
  expect(isStaleTimer({ due_at: '2026-12-29T09:00:00Z' }, now)).toBe(false);
  expect(isStaleTimer({ due_at: '2026-12-28T21:59:00Z' }, now)).toBe(true);
  expect(isStaleTimer({ due_at: '2026-12-01T08:00:00Z' }, now)).toBe(true);
  expect(isStaleTimer(null, now)).toBe(false);
});
