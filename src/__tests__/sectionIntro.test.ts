/** Introductions d'Aura par section : chaque action mène à un écran qui existe, textes présents dans les 5 langues. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { APP_ROUTES } from '@/lib/routes.generated';
import { INTRO_ACTIONS, INTRO_SECTIONS } from '@/features/aura/SectionIntro';
import { t as tr } from '@/i18n';

const exists = (href: string) => {
  const path = href.split('?')[0];
  return APP_ROUTES.some((r) => new RegExp(`^${r.replace(/\[[^\]]+\]/g, '[^/]+').replace(/\(([^)]+)\)\//g, '')}$`).test(path));
};

describe('introductions par section', () => {
  it.each(INTRO_SECTIONS.flatMap((s) => INTRO_ACTIONS[s].flatMap((a) => [[s, a.key, a.href('c1')], [s, a.key, a.href(null)]])))('%s · %s → %s existe', (_s, _k, href) => {
    expect(exists(href as string)).toBe(true);
  });
  it('titres, textes et actions traduits', () => {
    const dict = new Proxy({}, { get: (_o, k: string) => { const v = tr(k as never); return v === k ? undefined : v; } }) as Record<string, unknown>;
    for (const s of INTRO_SECTIONS) {
      expect(dict[`aura.intro.${s}.title`]).toBeTruthy();
      expect(dict[`aura.intro.${s}.body`]).toBeTruthy();
      for (const a of INTRO_ACTIONS[s]) expect(dict[`aura.intro.act.${a.key}`]).toBeTruthy();
    }
    expect(String(dict['aura.intro.cycle.body'])).toMatch(/contraception/);
    expect(String(dict['aura.intro.postpartum.body'])).toMatch(/diagnostic/);
  });
});
