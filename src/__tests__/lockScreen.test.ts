/** Écran verrouillé : un rappel de traitement n'affiche ni prénom, ni médicament, ni dose. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn(), AndroidImportance: { HIGH: 4, DEFAULT: 3 }, AndroidNotificationVisibility: { PRIVATE: 0 }, SchedulableTriggerInputTypes: {} }));
jest.mock('expo-device', () => ({ isDevice: false }));
import { lockScreenText } from '@/lib/notifications';

test('traitement d’un enfant : texte neutre', () => {
  const t = lockScreenText({ title: 'Noé · Traitement prescrit', body: '5 ml matin et soir', category: 'medication', treatment_id: 'tr-1' });
  expect(t.title).toBe('Rappel de traitement');
  expect(JSON.stringify(t)).not.toMatch(/Noé|5 ml/);
});
test('médicament de la personne elle-même : texte neutre aussi', () => {
  expect(lockScreenText({ title: 'Mon traitement', body: 'détail', category: 'medication', treatment_id: null }).title).toBe('Rappel de traitement');
});
test('autres rappels : texte choisi par la personne', () => {
  expect(lockScreenText({ title: 'Rendez-vous pédiatre', body: 'Vaccins', category: 'appointment', treatment_id: null })).toEqual({ title: 'Rendez-vous pédiatre', body: 'Vaccins' });
});
