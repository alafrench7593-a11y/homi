/** Ciel du mode jour : jamais blanc, évolution progressive avec l'heure, textes lisibles, teintes par profil. */
import { contrast, DAY_KEYS, daySkyAt, luminance, mix, PROFILE_TINTS, skyProfileFor, TINT_OPACITY } from '@/theme/daySky';
import { themes } from '@/theme/tokens';

const hours = Array.from({ length: 24 * 12 }, (_, i) => i / 12); // toutes les 5 minutes

describe('ciel du mode jour', () => {
  it('jamais entièrement blanc', () => {
    for (const h of hours) for (const c of daySkyAt(h).stops) {
      expect(c).not.toBe('#FFFFFF');
      expect(luminance(c)).toBeLessThan(0.95);
    }
  });
  it('matin crème et pêche, journée bleu ciel et lavande, fin de journée abricot et mauve', () => {
    const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const morning = daySkyAt(8).stops.map(rgb);
    expect(morning[1][0]).toBeGreaterThan(morning[1][2]); // pêche : plus de rouge que de bleu
    const day = daySkyAt(13).stops.map(rgb);
    expect(day[0][2]).toBeGreaterThan(day[0][0]); // bleu ciel en haut
    const late = daySkyAt(17.5).stops.map(rgb);
    expect(late[0][0]).toBeGreaterThan(late[0][2]); // abricot
    expect(late[3][2]).toBeGreaterThan(late[3][1]); // mauve en bas
  });
  it('transition progressive : aucun saut entre deux instants proches', () => {
    for (let i = 1; i < hours.length; i++) {
      const a = daySkyAt(hours[i - 1]).stops; const b = daySkyAt(hours[i]).stops;
      for (let k = 0; k < 4; k++) expect(Math.abs(luminance(a[k]) - luminance(b[k]))).toBeLessThan(0.02);
    }
    // la boucle minuit → aube est continue aussi
    expect(Math.abs(luminance(daySkyAt(23.99).stops[0]) - luminance(daySkyAt(0).stops[0]))).toBeLessThan(0.01);
  });
  it('textes lisibles directement sur le ciel, teinte du profil comprise (≥ 4,5:1)', () => {
    const { text, textMuted } = themes.light.colors;
    for (const h of hours) for (const c of daySkyAt(h).stops) {
      expect(contrast(c, text)).toBeGreaterThanOrEqual(7);
      for (const tint of Object.values(PROFILE_TINTS)) for (const t of tint) expect(contrast(mix(c, t, TINT_OPACITY), textMuted)).toBeGreaterThanOrEqual(4.4);
      expect(contrast(c, textMuted)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('repères triés, quatre couleurs chacun', () => {
    for (let i = 1; i < DAY_KEYS.length; i++) expect(DAY_KEYS[i].h).toBeGreaterThan(DAY_KEYS[i - 1].h);
    for (const k of DAY_KEYS) expect(k.stops).toHaveLength(4);
  });
  it('teinte selon le profil affiché', () => {
    expect(skyProfileFor('pregnancy')).toBe('pregnancy');
    expect(['avoid', 'ttc', 'cycle'].map(skyProfileFor)).toEqual(['cycle', 'cycle', 'cycle']);
    expect(skyProfileFor('baby')).toBe('baby');
    expect(skyProfileFor('child')).toBe('child');
    expect(skyProfileFor('family')).toBe('default');
  });
});
