jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { appleRedeemUrl, outcomeKey } from '@/features/firstWin/AmbassadorCode';
import { t } from '@/i18n';

describe('« J’ai un code ambassadeur » (24/11/2026)', () => {
  it('adresse officielle d’Apple, code pré-rempli en lettres et chiffres', () => {
    expect(appleRedeemUrl('6834794892', 'lea-20')).toBe('https://apps.apple.com/redeem?ctx=offercodes&id=6834794892&code=LEA20');
  });
  it('chaque issue a un texte ; aucune ne promet un prix', () => {
    for (const o of ['ok', 'locked', 'unknown_code', 'self', 'already_customer', 'invalid', 'network', 'saved', 'web', 'android'] as const) {
      const s = t(outcomeKey(o));
      expect(s).not.toMatch(/pw5\./);
      expect(s).not.toMatch(/\d+ ?€|%/);
    }
    expect(t('pw5.code.note')).toContain('Apple');
  });
});
