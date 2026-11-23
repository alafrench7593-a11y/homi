/** Agenda : saisies réelles acceptées (signalement du 23/11/2026, « impossible d'enregistrer »). */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { lenientFrDate, parseFrDateTime } from '@/features/familyLoad';

const local = (iso: string | null | undefined) => (iso ? new Date(iso) : null);
describe('agenda : date et heure saisies à la main', () => {
  it('heures : 14h30, 14H30, 14 h 30, 14:30, 14.30, 14 heures, 9h', () => {
    for (const t of ['14h30', '14H30', '14 h 30', '14:30', '14.30']) {
      const d = local(parseFrDateTime('25/11/2026', t));
      expect([t, d?.getHours(), d?.getMinutes()]).toEqual([t, 14, 30]);
    }
    expect(local(parseFrDateTime('25/11/2026', '14 heures'))?.getHours()).toBe(14);
    expect(local(parseFrDateTime('25/11/2026', '9h'))?.getHours()).toBe(9);
  });
  it('dates : année en cours si absente, année sur deux chiffres, date impossible refusée', () => {
    expect(lenientFrDate('25/11', new Date(2026, 10, 23))).toBe('2026-11-25');
    expect(lenientFrDate('25/11/26')).toBe('2026-11-25');
    expect(lenientFrDate('25-11-2026')).toBe('2026-11-25');
    expect(lenientFrDate('31/02')).toBeNull();
    expect(parseFrDateTime('25/11/2026', '25h')).toBeUndefined();
    expect(parseFrDateTime('', '')).toBeNull();
  });
});
