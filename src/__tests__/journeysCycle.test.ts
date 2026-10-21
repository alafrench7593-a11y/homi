jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
import { setLocale } from '@/i18n';
import { journeyOptions, mainJourneys, reminderSuggestions } from '@/lib/domain/journeys';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { quickFor } from '@/lib/journeys/tools';

afterEach(() => setLocale('fr'));

describe('parcours « suivre mon cycle »', () => {
  it('est proposé, sans objectif de grossesse', () => {
    const o = journeyOptions().find((x) => x.key === 'cycle');
    expect(o?.label).toBe('Suivre mon cycle');
    expect(mainJourneys(['cycle'])).toEqual(['cycle']);
  });
  it('mène à l’écran de cycle neutre et à des raccourcis adaptés', () => {
    expect(quickFor({ scope: 'cycle' })).toEqual(['period', 'symptom', 'mood', 'mysleep']);
    expect(toolCatalog({ scope: 'cycle' }).some((x) => x.href === '/cycle' && x.theme === 'cycle')).toBe(true);
  });
  it('propose un rappel facultatif vers /cycle, rattaché au parcours', () => {
    const r = reminderSuggestions(['cycle']);
    expect(r.map((x) => x.deep_link)).toEqual(['/cycle']);
    expect(r[0].journey_type).toBe('cycle');
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
  it('français : « lundi 08:00 », rappel rattaché à la grossesse', () => {
    const weight = reminderSuggestions(['pregnant']).find((r) => r.key === 'weight')!;
    expect(weight.label).toBe('Mon poids, une fois par semaine (lundi 08:00)');
    expect(weight.journey_type).toBe('pregnancy');
  });
});
