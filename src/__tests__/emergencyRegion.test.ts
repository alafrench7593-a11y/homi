/** D-01 (QA 02/11/2026, P1) : numéros d'urgence selon le pays de résidence, traduits. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { setLocale } from '@/i18n';
import { emergencyItems, primaryEmergencyPhone } from '@/lib/domain/emergencyNumbers';
import type { EmergencyResource } from '@/lib/types';

const row = (phone: string, label: string, description: string): EmergencyResource =>
  ({ id: phone, country: 'FR', label, phone, description, kind: 'emergency', available: '24 h/24, 7 j/7', position: 1, active: true });
const FR_ROWS = [row('15', 'SAMU', 'Urgence médicale'), row('3114', 'Prévention du suicide', 'Gratuit'), row('119', 'Enfance en danger', 'Si un enfant…')];

afterEach(() => setLocale('fr'));

it('Royaume-Uni : 999 en premier, aucun numéro français, textes anglais', () => {
  setLocale('en');
  const items = emergencyItems('GB', FR_ROWS, 'en');
  expect(items.map((i) => i.phone)).toEqual(['999', '112']);
  expect(primaryEmergencyPhone('GB')).toBe('999');
  expect(items[0].label).toBe('Emergency services (United Kingdom)');
  expect(JSON.stringify(items)).not.toMatch(/[àéèç]|Urgence/);
});

it('États-Unis : 911 ; autre pays : 112', () => {
  expect(primaryEmergencyPhone('US')).toBe('911');
  expect(primaryEmergencyPhone('OTHER')).toBe('112');
  expect(emergencyItems('OTHER', FR_ROWS, 'fr').map((i) => i.phone)).toEqual(['112']);
});

it('France en anglais : numéros français, libellés traduits', () => {
  setLocale('en');
  const items = emergencyItems('FR', FR_ROWS, 'en');
  expect(items.map((i) => i.phone)).toEqual(['15', '3114', '119']);
  expect(items[2].label).toBe('Children at risk');
  expect(primaryEmergencyPhone('FR')).toBe('15');
});

it('France en français : textes de la base conservés ; sans base, liste de secours', () => {
  expect(emergencyItems('FR', FR_ROWS, 'fr')[0].description).toBe('Urgence médicale');
  expect(emergencyItems('FR', [], 'fr').map((i) => i.phone)).toEqual(['15', '112', '3114']);
  expect(emergencyItems('FR', undefined, 'fr').every((i) => i.label && i.description)).toBe(true);
});
