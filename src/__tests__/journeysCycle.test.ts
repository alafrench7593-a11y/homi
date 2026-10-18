jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
import { setLocale } from '@/i18n';
import { journeyOptions, mainJourneys, quickActionsFor, reminderSuggestions, toolCategories } from '@/lib/domain/journeys';
import { toolCatalog } from '@/lib/domain/toolCatalog';

afterEach(() => setLocale('fr'));

describe('parcours « suivre mon cycle »', () => {
  it('est proposé, sans objectif de grossesse', () => {
    const o = journeyOptions().find((x) => x.key === 'cycle');
    expect(o?.label).toBe('Je veux simplement suivre mon cycle');
    expect(mainJourneys(['cycle'])).toEqual(['cycle']);
  });
  it('mène à l’écran de cycle neutre et à des raccourcis adaptés', () => {
    const cats = toolCategories({ journeys: ['cycle'], hasPregnancy: false, childCount: 0 });
    expect(cats.find((c) => c.key === 'cycle')?.items[0].href).toBe('/cycle');
    expect(quickActionsFor('me', ['cycle'])).toEqual(['period', 'mood', 'mysleep', 'appointment']);
    expect(toolCatalog({ journeys: ['cycle'], hasPregnancy: false, childCount: 0 }).some((x) => x.href === '/cycle' && x.theme === 'cycle')).toBe(true);
  });
  it('ne double pas la catégorie quand « concevoir » ou « éviter » est déjà choisi', () => {
    const cats = toolCategories({ journeys: ['cycle', 'ttc'], hasPregnancy: false, childCount: 0 });
    expect(cats.some((c) => c.key === 'cycle')).toBe(false);
  });
  it('propose un rappel facultatif vers /cycle', () => {
    const r = reminderSuggestions(['cycle']);
    expect(r.map((x) => x.deep_link)).toEqual(['/cycle']);
  });
});

describe('textes des parcours et rappels dans la langue active', () => {
  it('anglais : libellés naturels, heure et jour localisés', () => {
    setLocale('en');
    expect(journeyOptions().map((o) => o.label)).toContain('I’m pregnant');
    const weight = reminderSuggestions(['pregnant']).find((r) => r.key === 'weight')!;
    expect(weight.label).toMatch(/^My weight, once a week \(Monday 0?8:00(\s?AM)?\)$/);
    expect(weight.title).toBe('My weight');
  });
  it('français : « lundi 08:00 »', () => {
    const weight = reminderSuggestions(['pregnant']).find((r) => r.key === 'weight')!;
    expect(weight.label).toBe('Mon poids, une fois par semaine (lundi 08:00)');
  });
});
