jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
import { readingMinutes, splitFaq, splitSections } from '@/features/articleBody';

describe('lecture d’article en sections', () => {
  const md = 'Intro.\n\n## En bref\n- Un\n- Deux\n\n## Comprendre\nTexte.\n\n## Questions fréquentes\n**Quand ?** Réponse A.\n\n**Pourquoi ?** Réponse B.\n\nSuite B.\n\n## Quand demander conseil\nAppelez le 15.';
  it('découpe en sections et garde l’introduction', () => {
    const { intro, sections } = splitSections(md);
    expect(intro).toBe('Intro.');
    expect(sections.map((s) => s.title)).toEqual(['En bref', 'Comprendre', 'Questions fréquentes', 'Quand demander conseil']);
  });
  it('questions fréquentes : paires question / réponse, paragraphes suivants rattachés', () => {
    const faq = splitFaq(splitSections(md).sections[2].body);
    expect(faq).toEqual([{ q: 'Quand ?', a: 'Réponse A.' }, { q: 'Pourquoi ?', a: 'Réponse B.\n\nSuite B.' }]);
  });
  it('temps de lecture jamais nul', () => {
    expect(readingMinutes('un mot')).toBe(1);
    expect(readingMinutes(Array(1000).fill('mot').join(' '))).toBe(5);
  });
});
