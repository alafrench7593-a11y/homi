/**
 * Accessibilité : contrastes AA (WCAG 2.1) des couleurs de texte et de statut, HOMI v2.
 *
 * Décision de la propriétaire (13/11/2026) : la palette perle / prune / lilas est REMPLACÉE par « lumière sur
 * graphite » — neutres ivoire / graphite et quatre palettes (Aurore, Crépuscule, Menthe, Iris) + Auto. Le test
 * verrouillé change en conséquence : il porte désormais sur les neutres et les encres des quatre palettes.
 *
 * Pour CHAQUE combinaison {Aurore, Crépuscule, Menthe, Iris} × {clair, sombre, nuit} ET pour chaque mélange que
 * l'Auto peut afficher (toutes les 5 minutes sur 24 h) : texte, texte secondaire, liens (primaire), accent 2 et
 * les quatre statuts ≥ 4,5:1 sur le fond, les trois arrêts du dégradé, les cartes et les trois niveaux de verre ;
 * texte des boutons principaux ≥ 4,5:1 sur chaque arrêt de leur dégradé ; bandeaux lisibles.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import {
  AUTO_SCHEDULE, autoPaletteAt, bannerColors, blendAccents, buildTheme, NEUTRALS, PALETTE_NAMES, PALETTES, themes,
  type PaletteName, type Theme, type ThemeName,
} from '@/theme/tokens';
import { contrastRatio, over, parseColor, type RGB } from '@/theme/contrast';
import { BANNER_ICON } from '@/components/ui';

const AA = 4.5;
const MODES: ThemeName[] = ['light', 'dark', 'night'];

/** Tout ce qui peut se trouver sous un texte : fond, dégradé, puis chaque surface posée dessus. */
function bases(t: Theme): [string, RGB][] {
  const c = t.colors;
  const pages = [c.background, ...c.gradient].map((x) => parseColor(x).rgb);
  const out: [string, RGB][] = pages.map((p, i) => [`page${i}`, p]);
  const fills: [string, string][] = [
    ['carte', c.surface], ['carte secondaire', c.surfaceAlt],
    ['verre creux', t.material.glass.inset.fill], ['verre carte', t.material.glass.raised.fill], ['verre flottant', t.material.glass.floating.fill],
    ['teinte soft', t.material.cardTint.soft], ['teinte lavande', t.material.cardTint.lavender], ['teinte or', t.material.cardTint.gold],
  ];
  for (const [label, fill] of fills) for (const [i, p] of pages.entries()) out.push([`${label}/${i}`, over(fill, p)]);
  return out;
}

function worst(fg: string, t: Theme): { ratio: number; on: string } {
  let r = { ratio: Infinity, on: '' };
  for (const [label, b] of bases(t)) {
    const x = contrastRatio(fg, b);
    if (x < r.ratio) r = { ratio: x, on: label };
  }
  return r;
}

function checkTheme(t: Theme) {
  const c = t.colors;
  const s = t.tokens.status;
  const inks: Record<string, string> = {
    texte: c.text, 'texte secondaire': c.textMuted, primaire: c.primary, 'accent 2': c.lavender,
    succès: s.success, attention: s.warning, erreur: s.danger, info: s.info,
  };
  const failures: string[] = [];
  for (const [k, fg] of Object.entries(inks)) {
    const w = worst(fg, t);
    if (w.ratio < AA) failures.push(`${k} ${fg} sur ${w.on} : ${w.ratio.toFixed(2)}`);
  }
  for (const stop of t.material.primaryGradient) {
    const r = contrastRatio(c.primaryText, stop);
    if (r < AA) failures.push(`bouton principal ${c.primaryText} sur ${stop} : ${r.toFixed(2)}`);
  }
  // jetons sémantiques = rôles historiques (aucun écran ne voit deux vérités)
  expect(t.tokens.text.primary).toBe(c.text);
  expect(t.tokens.text.secondary).toBe(c.textMuted);
  expect(t.tokens.accent.accent).toBe(c.primary);
  return failures;
}

describe.each(PALETTE_NAMES)('palette %s', (p) => {
  for (const mode of MODES) {
    it(`${mode} : texte, liens et statuts ≥ 4,5:1 sur toutes les surfaces`, () => {
      expect(checkTheme(buildTheme(mode, PALETTES[p], p))).toEqual([]);
    });
    it(`${mode} : bandeaux lisibles (accent et texte)`, () => {
      const t = buildTheme(mode, PALETTES[p], p);
      const pages = [t.colors.background, ...t.colors.gradient].map((x) => parseColor(x).rgb);
      for (const [tone, b] of Object.entries(bannerColors(t))) {
        for (const page of pages) {
          const bg = over(b.bg, page);
          expect([tone, 'fg', contrastRatio(b.fg, bg) >= AA]).toEqual([tone, 'fg', true]);
          expect([tone, 'texte', contrastRatio(t.colors.text, bg) >= AA]).toEqual([tone, 'texte', true]);
        }
      }
    });
  }
});

describe('palette Auto : chaque mélange affichable reste lisible', () => {
  const day = new Date(2026, 10, 13, 0, 0, 0);
  const samples = Array.from({ length: 24 * 12 }, (_, i) => new Date(day.getTime() + i * 5 * 60_000));
  for (const mode of MODES) {
    it(`${mode} : 288 instants (toutes les 5 min)`, () => {
      const failures: string[] = [];
      for (const d of samples) {
        const a = autoPaletteAt(d);
        const t = buildTheme(mode, blendAccents(PALETTES[a.from], PALETTES[a.to], a.k), a.dominant);
        for (const f of checkTheme(t)) failures.push(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${f}`);
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('palette Auto : plages horaires et transitions', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 13, h, m, 0);
  it('matin Menthe, journée Aurore, fin de journée Crépuscule, soir et nuit Iris', () => {
    expect(autoPaletteAt(at(8)).dominant).toBe('menthe');
    expect(autoPaletteAt(at(14)).dominant).toBe('aurore');
    expect(autoPaletteAt(at(19)).dominant).toBe('crepuscule');
    expect(autoPaletteAt(at(23)).dominant).toBe('iris');
    expect(autoPaletteAt(at(3)).dominant).toBe('iris');
    expect(AUTO_SCHEDULE.map((s) => s.palette)).toEqual(['menthe', 'aurore', 'crepuscule', 'iris']);
  });
  it('hors transition : palette pure (k = 0), prochain changement 30 min avant la bascule', () => {
    const s = autoPaletteAt(at(14, 7));
    expect(s.k).toBe(0);
    expect(s.from).toBe(s.to);
    expect(s.next.getHours()).toBe(16);
    expect(s.next.getMinutes()).toBe(30);
    expect(s.upcoming.palette).toBe('crepuscule');
    expect(s.upcoming.at.getHours()).toBe(17);
  });
  it('fondu de 60 min par paliers de 5 min, jamais de saut (≤ 1/12 par palier), déterministe', () => {
    let prev = -1;
    const ks: number[] = [];
    for (let m = -35; m <= 35; m++) {
      const d = new Date(at(17).getTime() + m * 60_000);
      const s = autoPaletteAt(d);
      const k = s.from === 'aurore' && s.to === 'crepuscule' ? s.k : s.to === 'crepuscule' && s.from === 'crepuscule' ? 1 : 0;
      ks.push(k);
      expect(autoPaletteAt(d)).toEqual(s); // même instant → même résultat (aucun hasard)
    }
    for (const k of ks) {
      if (prev >= 0) expect(Math.abs(k - prev)).toBeLessThanOrEqual(1 / 12 + 1e-9);
      prev = k;
    }
    expect(autoPaletteAt(at(17)).k).toBeCloseTo(0.5, 5);
  });
  it('la nuit (21 h → 6 h) traverse minuit sans rupture', () => {
    const a = autoPaletteAt(new Date(2026, 10, 13, 23, 59));
    const b = autoPaletteAt(new Date(2026, 10, 14, 0, 1));
    expect(a.dominant).toBe('iris');
    expect(b.dominant).toBe('iris');
    const early = autoPaletteAt(at(5, 50));
    expect([early.from, early.to]).toEqual(['iris', 'menthe']);
  });
});

// Palette v2 verrouillée (décision de la propriétaire, 13/11/2026) : toute modification doit être volontaire
// (mettre à jour HOMI_DESIGN_SYSTEM.md, HOMI_BRAND.md et ce test).
it('palette de marque HOMI v2 (couleurs verrouillées)', () => {
  expect(NEUTRALS.ivory).toBe('#F4F1EB');
  expect(NEUTRALS.graphite).toBe('#0D0E11');
  expect(themes.light.colors.background).toBe('#F4F1EB');
  expect(themes.dark.colors.background).toBe('#0D0E11');
  const locked: Record<PaletteName, { ink: [string, string]; glow: [string, string] }> = {
    aurore: { ink: ['#0A6176', '#5E36C4'], glow: ['#6FE3F5', '#C4B2FF'] },
    crepuscule: { ink: ['#A63A1C', '#8A4D00'], glow: ['#FF9C84', '#FFC56E'] },
    menthe: { ink: ['#0A6459', '#256A28'], glow: ['#5EE6D0', '#93E89A'] },
    iris: { ink: ['#4540C8', '#A11F60'], glow: ['#A9B2FF', '#F7A4CF'] },
  };
  expect(PALETTES).toEqual(locked);
  expect(themes.light.colors.danger).toBe('#A51F2B');
  expect(themes.dark.colors.danger).toBe('#FF9A93');
});

it('le fond sombre est graphite (pas violet) et le fond clair ivoire chaud', () => {
  const [r, g, b] = parseColor(themes.dark.colors.background).rgb;
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(6); // neutre
  const [R, G, B] = parseColor(themes.light.colors.background).rgb;
  expect(R).toBeGreaterThan(B); // chaud
});

it('chaque statut a une icône en plus de la couleur (bandeaux)', () => {
  for (const tone of ['info', 'warning', 'danger', 'success', 'demo'] as const) expect(BANNER_ICON[tone]).toBeTruthy();
  expect(new Set(Object.values(BANNER_ICON)).size).toBe(Object.keys(BANNER_ICON).length);
});

it('les statuts restent distincts de l’accent de chaque palette (teinte ou icône)', () => {
  for (const p of PALETTE_NAMES) for (const mode of ['light', 'dark'] as const) {
    const t = buildTheme(mode, PALETTES[p], p);
    expect(t.tokens.status.danger).not.toBe(t.colors.primary);
    expect(t.tokens.status.success).not.toBe(t.colors.primary);
  }
});
