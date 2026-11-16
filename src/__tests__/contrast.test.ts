/**
 * Accessibilité : contrastes AA (WCAG 2.1) de HOMI v5 « Lumière corail ».
 *
 * Décision de la propriétaire (16/11/2026) : UNE seule identité (corail, rose chaud, lilas rare, encre prune), plus de
 * palettes au choix ni d'Auto ; fond UNI (plus aucune scène) ; trois apparences (clair, sombre, nuit interne).
 *
 * Pour clair / sombre / nuit : texte, texte secondaire, liens (primaire), accent lilas et les quatre statuts
 * ≥ 4,5:1 sur le fond, chaque surface (carte, surface élevée, creux, teintes de carte, indicateur de sélection,
 * tuiles teintées). Texte de CHAQUE variante de bouton ≥ 4,5:1 sur son aplat. Bandeaux lisibles. Le rouge d'alerte
 * santé reste distinct du corail et du rose (teinte) et a toujours une icône.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import {
  bannerColors, buildTheme, IDENTITY, innerLight, LEGACY_PALETTE, migratePalette, NEUTRALS, PALETTE_NAMES, PALETTES,
  SIGNATURE_PALETTE, themes, type Theme, type ThemeName,
} from '@/theme/tokens';
import { contrastRatio, over, parseColor, stack, type RGB } from '@/theme/contrast';
import { BANNER_ICON, buttonColors, type ButtonVariant } from '@/components/ui';

const AA = 4.5;
const MODES: ThemeName[] = ['light', 'dark', 'night'];

const tileLayer = (t: Theme, tint: string) => { const l = innerLight(t, tint); return `rgba(${parseColor(l.color).rgb.join(',')},${l.opacity})`; };

/** Tout ce qui peut se trouver sous un texte : le fond uni, puis chaque surface posée dessus. */
function bases(t: Theme): [string, RGB][] {
  const c = t.colors;
  const m = t.material;
  const page = parseColor(c.background).rgb;
  const fills: [string, string[]][] = [
    ['fond', []],
    ['surface', [m.surfaces.matte.fill]],
    ['surface élevée', [m.surfaces.optical.fill]],
    ['surface élevée (frosted)', [m.surfaces.frosted.fill]],
    ['carte secondaire', [c.surfaceAlt]],
    ['creux', [m.glass.inset.fill]],
    ['creux sur carte', [c.surface, m.glass.inset.fill]],
    ['indicateur de sélection sur rail', [m.glass.inset.fill, m.lens.fill]],
    ['teinte soft', [m.cardTint.soft]], ['teinte lavande', [m.cardTint.lavender]], ['teinte or', [m.cardTint.gold]],
    ['pastille d’icône', [m.lines.iconWell]],
    ['commande secondaire', [m.lines.controlFill]],
    ['tuile accent', [m.surfaces.matte.fill, tileLayer(t, t.tokens.accent.glow[0])]],
    ['tuile accent 2', [m.surfaces.matte.fill, tileLayer(t, t.tokens.accent.glow[1])]],
  ];
  return fills.map(([label, layers]) => [label, layers.reduce<RGB>((acc, l) => over(l, acc), page)]);
}

function checkTheme(t: Theme) {
  const c = t.colors;
  const s = t.tokens.status;
  const inks: Record<string, string> = {
    texte: c.text, 'texte secondaire': c.textMuted, primaire: c.primary, lilas: c.lavender,
    succès: s.success, attention: s.warning, erreur: s.danger, info: s.info,
  };
  const failures: string[] = [];
  for (const [k, fg] of Object.entries(inks)) {
    for (const [label, b] of bases(t)) { const x = contrastRatio(fg, b); if (x < AA) failures.push(`${k} ${fg} sur ${label} : ${x.toFixed(2)}`); }
  }
  for (const stop of t.material.primaryGradient) {
    const r = contrastRatio(c.primaryText, stop);
    if (r < AA) failures.push(`aplat principal ${c.primaryText} sur ${stop} : ${r.toFixed(2)}`);
  }
  // jetons sémantiques = rôles historiques (aucun écran ne voit deux vérités)
  expect(t.tokens.text.primary).toBe(c.text);
  expect(t.tokens.text.secondary).toBe(c.textMuted);
  expect(t.tokens.accent.accent).toBe(c.primary);
  expect(t.material.surfaces.matte.fill).toBe(c.surface);
  return failures;
}

describe.each(MODES)('thème %s', (mode) => {
  const t = buildTheme(mode);
  it('texte, liens, lilas et statuts ≥ 4,5:1 sur le fond et toutes les surfaces', () => {
    expect(checkTheme(t)).toEqual([]);
  });
  it('chaque variante de bouton : libellé ≥ 4,5:1 sur son aplat (posé sur le fond et sur une carte)', () => {
    const failures: string[] = [];
    const variants: ButtonVariant[] = ['primary', 'onHero', 'secondary', 'outline', 'ghost', 'link', 'icon', 'danger', 'night'];
    for (const v of variants) {
      const b = buttonColors(t, v);
      for (const under of [t.colors.background, t.colors.surface]) {
        const bg = b.bg === 'transparent' ? parseColor(under).rgb : over(b.bg, parseColor(under).rgb);
        const r = contrastRatio(b.fg, bg);
        if (r < AA) failures.push(`${v} ${b.fg} sur ${b.bg}/${under} : ${r.toFixed(2)}`);
      }
    }
    expect(failures).toEqual([]);
  });
  it('action principale : texte clair sur aplat profond (jeton `action`)', () => {
    expect(contrastRatio(t.tokens.action.text, t.tokens.action.fill)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(t.tokens.onHero.text, t.tokens.onHero.fill)).toBeGreaterThanOrEqual(AA);
  });
  it('bandeaux lisibles (accent et texte)', () => {
    const failures: string[] = [];
    for (const [tone, b] of Object.entries(bannerColors(t))) {
      const bg = over(b.bg, parseColor(t.colors.background).rgb);
      if (contrastRatio(b.fg, bg) < AA) failures.push(`${tone} fg`);
      if (contrastRatio(t.colors.text, bg) < AA) failures.push(`${tone} texte`);
    }
    expect(failures).toEqual([]);
  });
  it('tuiles teintées aux couleurs des statuts', () => {
    const s = t.tokens.status;
    const failures: string[] = [];
    for (const tint of [s.success, s.warning, s.danger, s.info]) {
      const tile = stack(t.material.surfaces.matte.fill, tileLayer(t, tint));
      for (const fg of [t.colors.text, t.colors.textMuted, tint]) if (contrastRatio(fg, tile) < AA) failures.push(`${fg} sur tuile ${tint}`);
    }
    expect(failures).toEqual([]);
  });
  it('fond uni : plus de dégradé de page', () => {
    expect(new Set(t.colors.gradient).size).toBe(1);
    expect(t.colors.gradient[0]).toBe(t.colors.background);
  });
  it('surfaces opaques, sans flou ni ombre colorée', () => {
    for (const s of Object.values(t.material.surfaces)) { expect(parseColor(s.fill).a).toBe(1); expect(s.blur).toBe(0); expect(s.glow).toBe(0); }
    for (const l of Object.values(t.material.glass)) expect(l.blur).toBe(0);
  });
});

// Identité v5 verrouillée (décision de la propriétaire, 16/11/2026) : toute modification doit être volontaire
// (mettre à jour HOMI_DESIGN_SYSTEM.md et ce test).
it('identité HOMI v5 (couleurs verrouillées)', () => {
  expect(IDENTITY).toEqual({
    coral: '#F2826F', coralDeep: '#B5452F', coralGlow: '#FFA08A',
    rose: '#EC7E9C', roseDeep: '#A8365F', roseGlow: '#F4A3C0',
    lilac: '#B9A6F2', lilacDeep: '#6A4FB8', lilacGlow: '#C9B6FF',
    plum: '#2A1621', plumAction: '#3B1D2C',
  });
  expect(themes.light.colors.background).toBe('#FBF4F2');
  expect(themes.light.colors.surface).toBe('#FFFFFF');
  expect(themes.light.colors.text).toBe('#2A1621');
  expect(themes.dark.colors.background).toBe('#1A1217');
  expect(themes.light.tokens.action.fill).toBe('#3B1D2C');
  expect(themes.dark.tokens.action.fill).toBe('#FFA08A');
  expect(PALETTE_NAMES).toEqual(['homi']);
  expect(SIGNATURE_PALETTE).toBe('homi');
  expect(PALETTES.homi).toEqual({ ink: ['#B5452F', '#A8365F'], glow: ['#FFA08A', '#F4A3C0'] });
  expect(themes.light.tokens.status).toEqual({ success: '#1B6B3A', warning: '#8A4B00', danger: '#B3111B', info: '#1D5AA6' });
  expect(themes.dark.tokens.status).toEqual({ success: '#8BE0A6', warning: '#F7C770', danger: '#FF6B6B', info: '#9CC4FF' });
});

it('halo corail : jeton dédié (corail → rose → lilas), éteint la nuit', () => {
  expect(themes.light.tokens.halo).toMatchObject({ color: IDENTITY.coral, color2: IDENTITY.rose, color3: IDENTITY.lilac });
  expect(themes.light.tokens.halo.intensity).toBeGreaterThan(0);
  expect(themes.dark.tokens.halo.intensity).toBeGreaterThan(0);
  expect(themes.night.tokens.halo.intensity).toBe(0);
});

it('le fond sombre est un prune-anthracite (jamais noir pur), le fond clair un ivoire rosé', () => {
  const [r, g, b] = parseColor(themes.dark.colors.background).rgb;
  expect(Math.max(r, g, b)).toBeGreaterThan(16); // pas noir pur
  expect(r).toBeGreaterThan(g); // teinte prune (rouge + bleu > vert)
  expect(b).toBeGreaterThan(g);
  const [R, G, B] = parseColor(themes.light.colors.background).rgb;
  expect(R).toBeGreaterThan(G); expect(R).toBeGreaterThan(B); // rosé
  expect(Math.min(R, G, B)).toBeGreaterThan(235); // très clair
});

it('migration : toute ancienne palette (v3, v4, Auto, inconnue) devient l’identité unique', () => {
  for (const old of ['auto', 'peche', 'lilas', 'lagune', 'ambre', 'turquoise', 'menthe', 'aurore', 'iris', 'crepuscule', 'inconnue', null, undefined]) {
    expect(migratePalette(old)).toBe('homi');
  }
  for (const v of Object.values(LEGACY_PALETTE)) expect(v).toBe('homi');
});

it('chaque statut a une icône en plus de la couleur (bandeaux)', () => {
  for (const tone of ['info', 'warning', 'danger', 'success', 'demo'] as const) expect(BANNER_ICON[tone]).toBeTruthy();
  expect(new Set(Object.values(BANNER_ICON)).size).toBe(Object.keys(BANNER_ICON).length);
});

/** Teinte (°) d'une couleur #RRGGBB. */
function hue(hex: string) {
  const [r, g, b] = parseColor(hex).rgb.map((x) => x / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueDist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

it('le rouge d’alerte santé reste distinct du corail et du rose (teinte), en clair et en sombre', () => {
  for (const mode of ['light', 'dark'] as const) {
    const t = themes[mode];
    const danger = hue(t.tokens.status.danger);
    expect(t.tokens.status.danger).not.toBe(t.colors.primary);
    expect(hueDist(danger, hue(t.tokens.accent.accent))).toBeGreaterThanOrEqual(8);
    expect(hueDist(danger, hue(t.tokens.accent.accent2))).toBeGreaterThanOrEqual(8);
    // l'action principale n'est jamais rouge d'alerte
    expect(t.tokens.action.fill).not.toBe(t.tokens.status.danger);
  }
});

it('statuts distincts de l’accent', () => {
  for (const mode of ['light', 'dark'] as const) {
    const t = themes[mode];
    for (const s of Object.values(t.tokens.status)) expect(s).not.toBe(t.colors.primary);
  }
});

it('neutres : encre prune profonde (jamais noir pur)', () => {
  expect(NEUTRALS.ink).not.toBe('#000000');
  const [r, g, b] = parseColor(NEUTRALS.ink).rgb;
  expect(r).toBeGreaterThan(g);
  expect(b).toBeGreaterThan(g);
});
