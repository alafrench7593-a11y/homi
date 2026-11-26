/** Taille d'un document affichée dans la langue choisie (unités et séparateur décimal), refonte lot 5. */
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { setLocale } from '@/i18n';
import { formatSize } from '@/features/documents';

afterEach(() => setLocale('fr'));

describe('formatSize', () => {
  it('français : Ko / Mo et virgule décimale', () => {
    setLocale('fr');
    expect(formatSize(12 * 1024)).toBe('12 Ko');
    expect(formatSize(100)).toBe('1 Ko');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1,5 Mo');
  });
  it('anglais : KB / MB et point décimal', () => {
    setLocale('en');
    expect(formatSize(12 * 1024)).toBe('12 KB');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
