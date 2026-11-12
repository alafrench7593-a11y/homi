import { DIARY_MAX, diaryPages, groupByMonth, validateDiary } from '@/lib/domain/diary';
import type { MoodCheckin } from '@/lib/types';
import { controlSize, elevation, MIN_TOUCH, typography } from '@/theme/tokens';
import { DICTIONARIES } from '@/i18n/dictionaries';

const page = (id: string, at: string, journal: string | null, mood: MoodCheckin['mood'] = 3): MoodCheckin => ({ id, user_id: 'u', checked_at: at, mood, feelings: [], safety_concern: false, journal });

describe('journal intime', () => {
  it('refuse une page vide, sans humeur ou trop longue', () => {
    expect(validateDiary('   ', 3)).toBe('empty');
    expect(validateDiary('Une belle journée', null)).toBe('mood');
    expect(validateDiary('x'.repeat(DIARY_MAX + 1), 3)).toBe('long');
    expect(validateDiary('x'.repeat(DIARY_MAX), 3)).toBeNull();
    expect(validateDiary('Une belle journée', 4)).toBeNull();
  });

  it('ne garde que les bilans qui portent un texte, du plus récent au plus ancien', () => {
    const list = diaryPages([page('a', '2026-10-02T10:00:00.000Z', 'Premier'), page('b', '2026-11-05T10:00:00.000Z', null), page('c', '2026-11-08T10:00:00.000Z', '  '), page('d', '2026-11-09T10:00:00.000Z', 'Dernier')]);
    expect(list.map((p) => p.id)).toEqual(['d', 'a']);
    expect(diaryPages(undefined)).toEqual([]);
  });

  it('regroupe par mois', () => {
    const g = groupByMonth(diaryPages([page('a', '2026-10-02T10:00:00.000Z', 'A'), page('b', '2026-11-05T10:00:00.000Z', 'B'), page('c', '2026-11-09T10:00:00.000Z', 'C')]));
    expect(g.map((m) => [m.key, m.pages.length])).toEqual([['2026-11', 2], ['2026-10', 1]]);
  });

  it('existe dans les 5 langues, avec les mêmes paramètres', () => {
    for (const lang of ['fr', 'en', 'es', 'de', 'it']) {
      expect(String(DICTIONARIES[lang]['dy.pageA11y'])).toContain('{date}');
      expect(String(DICTIONARIES[lang]['dy.pageA11y'])).toContain('{mood}');
      expect(String(DICTIONARIES[lang]['intro.tagline']).length).toBeGreaterThan(10);
    }
  });
});

describe('jetons de design', () => {
  it('chaque rôle typographique est complet et lisible', () => {
    for (const [role, s] of Object.entries(typography)) {
      expect(s.fontFamily).toBeTruthy();
      expect(s.lineHeight).toBeGreaterThanOrEqual(s.fontSize); // jamais de lignes qui se chevauchent
      expect(s.fontSize).toBeGreaterThanOrEqual(12);
      expect(s.maxScale).toBeGreaterThanOrEqual(1.3);
      expect(['text', 'textMuted', 'primaryText']).toContain(s.color);
      expect(role).toBeTruthy();
    }
    expect(Object.keys(typography)).toEqual(expect.arrayContaining(['display', 'headingXL', 'headingL', 'headingM', 'bodyL', 'bodyM', 'bodyS', 'caption', 'label', 'button']));
  });
  it('les contrôles respectent la zone tactile minimale et les ombres restent discrètes', () => {
    expect(controlSize.md).toBeGreaterThanOrEqual(MIN_TOUCH);
    expect(controlSize.field).toBeGreaterThanOrEqual(MIN_TOUCH);
    expect(elevation.high.shadowOpacity).toBeLessThanOrEqual(0.2);
  });
});
