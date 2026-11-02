/** D-03, D-04, D-06 à D-09 (QA 02/11/2026) : libellés fixes affichés en anglais dans la version anglaise. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { setLocale } from '@/i18n';
import { CHILD_TABS } from '@/lib/domain/childTabs';
import { cohortName, localizeGroupName } from '@/lib/domain/communitySocial';
import { PLAN_REST_IDEAS } from '@/lib/domain/postpartum';
import { CATEGORY_GROUPS } from '@/content/articles/rows';

afterEach(() => setLocale('fr'));

it('onglets de la fiche enfant, idées du plan, guides de la bibliothèque', () => {
  expect(CHILD_TABS[0].label).toBe('Aperçu');
  setLocale('en');
  expect(CHILD_TABS.map((t) => t.label)).toEqual(['Overview', 'Growth', 'Milestones', 'Health', 'Food', 'Special needs']);
  expect(PLAN_REST_IDEAS[0]).toBe('A protected nap every day');
  expect(CATEGORY_GROUPS[0].title).toBe('My cycle and my health');
  setLocale('fr');
  expect(CATEGORY_GROUPS[0].title).toBe('Mon cycle et ma santé');
});

it('groupes par mois : nom du serveur (français) traduit à l’affichage', () => {
  expect(cohortName('due', '2027-02', 'fr')).toBe('Terme prévu en février 2027');
  expect(localizeGroupName('Terme prévu en février 2027', 'en')).toBe('Due in February 2027');
  expect(localizeGroupName('Bébés nés en août 2026', 'en')).toBe('Babies born in August 2026');
  expect(localizeGroupName('Allaitement', 'en')).toBe('Allaitement');
  expect(localizeGroupName('Terme prévu en février 2027', 'fr')).toBe('Terme prévu en février 2027');
});
