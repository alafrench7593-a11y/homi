/** F-10 (QA 02/11/2026) : nuit du changement d'heure, heure saisie inexistante ou présente deux fois (Paris). */
process.env.TZ = 'Europe/Paris';
import { resolveTypedTime } from '@/lib/domain/typedTime';

it('passage à l’heure d’été : 2 h 30 n’existe pas', () => {
  const now = new Date('2027-03-28T05:00:00Z'); // 7 h à Paris
  expect(resolveTypedTime(2, 30, { now }).dst).toBe('missing');
  expect(resolveTypedTime(4, 0, { now }).dst).toBeNull();
});

it('retour à l’heure d’hiver : 2 h 30 existe deux fois', () => {
  const now = new Date('2026-10-25T06:00:00Z'); // 7 h à Paris
  expect(['twiceFirst', 'twiceSecond']).toContain(resolveTypedTime(2, 30, { now }).dst);
  expect(resolveTypedTime(5, 0, { now }).dst).toBeNull();
});

it('jour ordinaire : aucune remarque', () => {
  expect(resolveTypedTime(2, 30, { now: new Date('2026-11-03T08:00:00Z') }).dst).toBeNull();
});
