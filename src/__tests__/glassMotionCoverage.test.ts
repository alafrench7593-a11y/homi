/**
 * Liquid Glass + Full Motion « partout » (21/11/2026, docs/DA_LIQUID_GLASS.md § 11) :
 *  - couverture MESURÉE par scripts/da/coverage.mjs (AST, 300 routes) : ≥ 90 % des routes conformes, bibliothèque
 *    sans appui nu ni Modal posée à la main ;
 *  - listes vivantes : pas d'animation au montage, état immédiat avec Réduire les animations, fondu court la nuit ;
 *  - l'assistante s'appelle « Aura » partout dans les textes visibles (5 langues, mentions, avertissement du serveur).
 */

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { listItemMotion, LIST_MOTION } from '@/motion/ListMotion';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execFileSync } = require('child_process') as { execFileSync(cmd: string, args: string[], o: { encoding: 'utf8' }): string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; readdirSync(p: string): string[] };

describe('couverture Liquid Glass + mouvement', () => {
  it('≥ 90 % des routes conformes, bibliothèque sans appui nu', () => {
    const out = execFileSync('node', ['scripts/da/coverage.mjs', '--min', '90'], { encoding: 'utf8' });
    const pct = Number(/conformes : \d+ \(([\d.]+) %\)/.exec(out)?.[1]);
    expect(pct).toBeGreaterThanOrEqual(90);
    expect(out).toMatch(/appuis nus : 0 · Modal à la main : 0/);
  }, 120000);
});

describe('listes vivantes (MotionItem)', () => {
  it('au montage : aucune apparition ; ajout réel : apparition à sa place, voisines qui glissent', () => {
    expect(listItemMotion('full', { animateIn: false, count: 3 }).entering).toBeUndefined();
    const added = listItemMotion('full', { animateIn: true, count: 3 });
    expect(added.entering).toBeDefined();
    expect(added.exiting).toBeDefined();
    expect(added.layout).toBeDefined();
  });
  it('longue liste : seul l’élément touché s’anime ; Réduire les animations : changement immédiat ; nuit : fondu', () => {
    expect(listItemMotion('full', { animateIn: true, count: LIST_MOTION.layoutMax + 1 }).layout).toBeUndefined();
    expect(listItemMotion('off', { animateIn: true, count: 2 })).toEqual({ entering: undefined, exiting: undefined, layout: undefined });
    const night = listItemMotion('minimal', { animateIn: true, count: 2 });
    expect(night.entering).toBeDefined();
    expect(night.layout).toBeUndefined();
  });
});

describe('« Aura » (et non « HOMI Aura ») dans les textes visibles', () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const files = [
    ...['fr', 'en', 'de', 'es', 'it'].flatMap((l) => fs.readdirSync(`src/i18n/${l}`).map((f) => `src/i18n/${l}/${f}`)),
    'src/content/legal.ts', 'supabase/functions/_shared/aura-guard.ts', 'supabase/functions/_shared/aura-prompt.ts',
  ];
  it.each(files)('%s', (f) => {
    expect(strip(fs.readFileSync(f, 'utf8'))).not.toMatch(/HOMI[\s -]Aura/);
  });
});
