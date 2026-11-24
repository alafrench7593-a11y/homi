jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { assignStoryVariant } from '@/features/firstWin/model';
import { storySlides, transformTitleKey } from '@/features/firstWin/PaywallStory';
import { defaultOfferKey } from '@/features/firstWin/offer';
import { t } from '@/i18n';

describe('paywall « histoire » (24/11/2026)', () => {
  it('ordre : transformation → confiance → fondateurs (sources validées), jamais de prix avant', () => {
    expect(storySlides()).toEqual(['transform', 'trust', 'founders']);
  });
  it('tirage stable par installation, proche de 50/50', () => {
    expect(assignStoryVariant('abc')).toBe(assignStoryVariant('abc'));
    const n = Array.from({ length: 2000 }, (_, i) => assignStoryVariant(`id-${i}`)).filter((v) => v === 'story').length;
    expect(n).toBeGreaterThan(900);
    expect(n).toBeLessThan(1100);
  });
  it('titre selon le besoin, générique sinon ; textes présents', () => {
    expect(transformTitleKey(null)).toBe('pw4.t.title.generic');
    expect(t(transformTitleKey('relay'))).toBe('Se relayer, sans tout réexpliquer.');
    expect(t('pw4.trust.source')).toContain('pas une note de l’App Store');
  });
  it('variante « histoire » : annuel présélectionné s’il existe, sinon le mensuel', () => {
    const cards = [{ key: 'premium:monthly' }, { key: 'premium:annual' }];
    expect(defaultOfferKey(cards, 'premium:annual')).toBe('premium:annual');
    expect(defaultOfferKey([{ key: 'premium:monthly' }], 'premium:annual')).toBe('premium:monthly');
  });
});
