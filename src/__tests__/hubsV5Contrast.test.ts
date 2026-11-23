/**
 * Contrastes des écrans recomposés en v5 (hubs, semaine de grossesse, dents, page introuvable), clair et sombre :
 * chaque couple texte / fond nouveau ≥ 4,5:1 ; pictogrammes porteurs de sens (alerte, coche de dent notée,
 * jalon « en ce moment ») ≥ 3:1 (WCAG 1.4.11).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import { buildTheme, linesOf, type ThemeName } from '@/theme/tokens';
import { contrastRatio, over, stack } from '@/theme/contrast';
import { alertIconOn } from '@/features/hubs/HubList';

const MODES: ThemeName[] = ['light', 'dark'];
/** Texte (ou picto) posé sur une couche, elle-même posée sur une carte (surface) au-dessus du fond de page. */
const ratio = (t: ReturnType<typeof buildTheme>, fg: string, bg: string) => { const base = stack(t.colors.background, t.colors.surface, bg); return contrastRatio(over(fg, base), base); };

describe.each(MODES.map((m) => [m]))('v5 hubs / grossesse / dents — %s', (mode) => {
  const t = buildTheme(mode);
  const c = t.colors;
  const well = linesOf(t).iconWell;

  it.each([
    ['titre d’outil sur la liste', c.text, c.surface],
    ['sous-titre d’outil', c.textMuted, c.surface],
    ['état « accent » d’un outil', c.primary, c.surface],
    ['rangée pressée', c.text, c.surfaceAlt],
    ['sous-titre sur rangée pressée', c.textMuted, c.surfaceAlt],
    ['Urgences : libellé', c.danger, c.dangerSoft],
    ['Urgences : numéros', c.text, c.dangerSoft],
    ['capsule de profil choisie', t.tokens.action.text, t.tokens.action.fill],
    ['semaine choisie', t.tokens.action.text, t.tokens.action.fill],
    ['semaine actuelle (case)', c.primary, well],
    ['« Des jumeaux », trimestre en cours', c.primary, c.background],
    ['trimestre en cours sur la carte', c.primary, c.surface],
    ['légendes, jalons passés', c.textMuted, c.surface],
    ['repère de légende, page introuvable', c.textMuted, c.background],
  ])('%s ≥ 4,5:1', (_n, fg, bg) => {
    expect(ratio(t, fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['icône d’alerte sur sa pastille', alertIconOn(t), c.danger],
    ['coche d’une dent notée', c.primaryText, c.primary],
    ['jalon « en ce moment »', c.primaryText, c.primary],
    ['icône d’outil sur sa pastille', c.primary, well],
    ['contour d’une dent pas encore notée', c.textMuted, c.surfaceAlt],
    ['repère de progression sur la piste', c.primary, linesOf(t).track],
  ])('%s ≥ 3:1', (_n, fg, bg) => {
    expect(ratio(t, fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
