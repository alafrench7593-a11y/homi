/**
 * Accessibilité : contrastes AA (WCAG 2.1) des couleurs de texte et de statut, HOMI v3 « désert sci-fi ».
 *
 * Décision du propriétaire (13/11/2026) : « Lumière sur graphite » (v2) est REMPLACÉE par la v3 — obsidienne +
 * turquoise en sombre, ivoire minéral + verre givré en clair, palette signature Turquoise ajoutée (Auto, Turquoise,
 * Aurore, Crépuscule, Menthe, Iris). Le test verrouillé change en conséquence.
 *
 * Pour CHAQUE combinaison {5 palettes} × {clair, sombre, nuit} ET pour chaque mélange que l'Auto peut afficher
 * (toutes les 5 minutes sur 24 h) : texte, texte secondaire, liens (primaire), accent 2 et les quatre statuts
 * ≥ 4,5:1 sur :
 *  - le fond, son dégradé et CHAQUE couleur de la scène (ciel, horizon, astre, dunes, arche, maison de verre,
 *    fenêtre éclairée, eau) — le texte des écrans peut se poser directement sur la scène ;
 *  - chaque matière posée sur chacune de ces couleurs : verre optique (remplissage + dégradé interne), verre
 *    fumé / givré, surface mate, creux, teintes de carte, tuiles éclairées de l'intérieur.
 * Exclus (traits décoratifs ≤ 2 px, jamais une zone sous un texte) : liseré de l'astre, arête de l'arche, reflets
 * de l'eau. Texte des boutons principaux ≥ 4,5:1 sur chaque arrêt de leur dégradé ; bandeaux lisibles.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import {
  AUTO_SCHEDULE, autoPaletteAt, bannerColors, blendAccents, buildTheme, innerLight, NEUTRALS, PALETTE_NAMES, PALETTES, SIGNATURE_PALETTE, themes,
  type PaletteName, type Theme, type ThemeName,
} from '@/theme/tokens';
import { contrastRatio, over, parseColor, stack, type RGB } from '@/theme/contrast';
import { BANNER_ICON } from '@/components/ui';

const AA = 4.5;
const MODES: ThemeName[] = ['light', 'dark', 'night'];

/** Toutes les couleurs « de page » : fond, dégradé et chaque zone de la scène (les translucides mêlées au ciel). */
function scenePages(t: Theme): [string, RGB][] {
  const c = t.colors;
  const s = t.material.scene;
  const opaque: [string, string][] = [
    ['fond', c.background], ['dégradé0', c.gradient[0]], ['dégradé1', c.gradient[1]], ['dégradé2', c.gradient[2]],
    ['ciel haut', s.sky[0]], ['ciel', s.sky[1]], ['ciel horizon', s.sky[2]], ['lueur horizon', s.horizon],
    ['astre clair', s.planet[0]], ['astre ombre', s.planet[1]],
    ['dune lointaine', s.dunes[0]], ['dune', s.dunes[1]], ['dune proche', s.dunes[2]],
    ['arche', s.arch], ['fenêtre', s.window], ['eau', s.water[0]], ['eau basse', s.water[1]],
  ];
  const out: [string, RGB][] = opaque.map(([k, v]) => [k, parseColor(v).rgb]);
  // maison de verre (translucide) posée sur les dunes et le ciel
  for (const [k, v] of [['dune', s.dunes[1]], ['ciel', s.sky[2]], ['astre', s.planet[0]]] as const) out.push([`maison/${k}`, over(s.house, parseColor(v).rgb)]);
  return out;
}

/** Tout ce qui peut se trouver sous un texte : pages de la scène, puis chaque matière posée dessus. */
function bases(t: Theme): [string, RGB][] {
  const c = t.colors;
  const m = t.material;
  const pages = scenePages(t);
  const out: [string, RGB][] = [...pages];
  const fills: [string, string[]][] = [
    ['mate', [m.surfaces.matte.fill]],
    ['verre fumé/givré', [m.surfaces.frosted.fill]],
    ['verre fumé/givré + reflet', [m.surfaces.frosted.fill, m.surfaces.frosted.inner[0]]],
    ['verre optique', [m.surfaces.optical.fill]],
    ['verre optique + lumière interne', [m.surfaces.optical.fill, m.surfaces.optical.inner[0]]],
    ['verre optique + lumière interne + reflet spéculaire', [m.surfaces.optical.fill, m.surfaces.optical.inner[0], m.light.sheen]],
    ['carte secondaire', [c.surfaceAlt]],
    ['creux', [m.glass.inset.fill]],
    ['teinte soft', [m.cardTint.soft]], ['teinte lavande', [m.cardTint.lavender]], ['teinte or', [m.cardTint.gold]],
    // tuile de données éclairée de l'intérieur (cœur du dégradé radial), aux couleurs de la palette
    ['tuile accent', [m.surfaces.matte.fill, ...(() => { const l = innerLight(t, t.tokens.accent.glow[0]); return [`rgba(${parseColor(l.color).rgb.join(',')},${l.opacity})`]; })()]],
    ['tuile accent 2', [m.surfaces.matte.fill, ...(() => { const l = innerLight(t, t.tokens.accent.glow[1]); return [`rgba(${parseColor(l.color).rgb.join(',')},${l.opacity})`]; })()]],
  ];
  for (const [label, layers] of fills) {
    for (const [pk, p] of pages) out.push([`${label}/${pk}`, layers.reduce<RGB>((acc, l) => over(l, acc), p)]);
  }
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
  expect(t.material.surfaces.matte.fill).toBe(c.surface);
  return failures;
}

describe.each(PALETTE_NAMES)('palette %s', (p) => {
  for (const mode of MODES) {
    it(`${mode} : texte, liens et statuts ≥ 4,5:1 sur la scène et toutes les matières`, () => {
      expect(checkTheme(buildTheme(mode, PALETTES[p], p))).toEqual([]);
    });
    it(`${mode} : bandeaux lisibles (accent et texte) sur toute la scène`, () => {
      const t = buildTheme(mode, PALETTES[p], p);
      const failures: string[] = [];
      for (const [tone, b] of Object.entries(bannerColors(t))) {
        for (const [pk, page] of scenePages(t)) {
          const bg = over(b.bg, page);
          if (contrastRatio(b.fg, bg) < AA) failures.push(`${tone} fg/${pk}`);
          if (contrastRatio(t.colors.text, bg) < AA) failures.push(`${tone} texte/${pk}`);
        }
      }
      expect(failures).toEqual([]);
    });
    it(`${mode} : tuiles éclairées de l'intérieur aux couleurs des statuts`, () => {
      const t = buildTheme(mode, PALETTES[p], p);
      const s = t.tokens.status;
      const failures: string[] = [];
      for (const tint of [s.success, s.warning, s.danger, s.info]) {
        const l = innerLight(t, tint);
        const tile = stack(t.material.surfaces.matte.fill, `rgba(${parseColor(l.color).rgb.join(',')},${l.opacity})`);
        for (const fg of [t.colors.text, t.colors.textMuted, tint]) if (contrastRatio(fg, tile) < AA) failures.push(`${fg} sur tuile ${tint}`);
      }
      expect(failures).toEqual([]);
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

describe('changement de palette animé : chaque étape intermédiaire reste lisible', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`${mode} : 5 × 4 transitions, 4 étapes chacune`, () => {
      const failures: string[] = [];
      for (const a of PALETTE_NAMES) for (const b of PALETTE_NAMES) {
        if (a === b) continue;
        for (const k of [0.25, 0.5, 0.75]) for (const f of checkTheme(buildTheme(mode, blendAccents(PALETTES[a], PALETTES[b], k), b))) failures.push(`${a}→${b}@${k} ${f}`);
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('palette Auto : plages horaires et transitions', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 13, h, m, 0);
  it('matin Menthe, journée Turquoise (signature), fin de journée Crépuscule, soir et nuit Iris', () => {
    expect(autoPaletteAt(at(8)).dominant).toBe('menthe');
    expect(autoPaletteAt(at(14)).dominant).toBe('turquoise');
    expect(autoPaletteAt(at(19)).dominant).toBe('crepuscule');
    expect(autoPaletteAt(at(23)).dominant).toBe('iris');
    expect(autoPaletteAt(at(3)).dominant).toBe('iris');
    expect(AUTO_SCHEDULE.map((s) => s.palette)).toEqual(['menthe', 'turquoise', 'crepuscule', 'iris']);
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
      const k = s.from === 'turquoise' && s.to === 'crepuscule' ? s.k : s.to === 'crepuscule' && s.from === 'crepuscule' ? 1 : 0;
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

// Palette v3 verrouillée (décision du propriétaire, 13/11/2026) : toute modification doit être volontaire
// (mettre à jour HOMI_DESIGN_SYSTEM.md, HOMI_BRAND.md et ce test).
it('palette de marque HOMI v3 (couleurs verrouillées)', () => {
  expect(NEUTRALS.ivory).toBe('#F1EEE7');
  expect(NEUTRALS.obsidian).toBe('#06090B');
  expect(themes.light.colors.background).toBe('#F1EEE7');
  expect(themes.dark.colors.background).toBe('#06090B');
  expect(SIGNATURE_PALETTE).toBe('turquoise');
  expect(themes.dark.palette).toBe('turquoise');
  const locked: Record<PaletteName, { ink: [string, string]; glow: [string, string] }> = {
    turquoise: { ink: ['#00646A', '#7A4E12'], glow: ['#46E3D6', '#E9C58C'] },
    aurore: { ink: ['#0A6176', '#5E36C4'], glow: ['#6FE3F5', '#C4B2FF'] },
    crepuscule: { ink: ['#A63A1C', '#8A4D00'], glow: ['#FF9C84', '#FFC56E'] },
    menthe: { ink: ['#0A6459', '#256A28'], glow: ['#5EE6D0', '#93E89A'] },
    iris: { ink: ['#4540C8', '#A11F60'], glow: ['#A9B2FF', '#F7A4CF'] },
  };
  expect(PALETTES).toEqual(locked);
  expect(themes.light.colors.danger).toBe('#A51F2B');
  expect(themes.dark.colors.danger).toBe('#FF9A93');
});

it('le fond sombre est une obsidienne froide (pas violette) et le fond clair un ivoire minéral chaud', () => {
  const [r, g, b] = parseColor(themes.dark.colors.background).rgb;
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(6); // presque neutre
  expect(b).toBeGreaterThanOrEqual(r); // froid (bleu-vert), jamais violet
  expect(g).toBeGreaterThanOrEqual(r);
  const [R, , B] = parseColor(themes.light.colors.background).rgb;
  expect(R).toBeGreaterThan(B); // chaud
});

it('la surface mate est opaque (pas de verre pour les listes et les données)', () => {
  for (const mode of MODES) for (const p of PALETTE_NAMES) expect(parseColor(buildTheme(mode, PALETTES[p], p).material.surfaces.matte.fill).a).toBe(1);
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
