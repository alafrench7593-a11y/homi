/**
 * Accessibilité : contrastes AA (WCAG 2.1) des couleurs de texte et de statut, HOMI v4 « lumière minérale ».
 *
 * Décision du propriétaire (14/11/2026) : la v3 « désert sci-fi » turquoise est REMPLACÉE par la v4 — ivoire
 * lumineux, bleu brume, pêche et reflets lilas en clair ; obsidienne, verre fumé et lumière directionnelle en
 * sombre ; quatre palettes (Brume pêche, Aurore lilas, Lagune turquoise, Ambre minéral) + Auto ; une ambiance par
 * espace (Accueil, Santé, Bébé, Famille, Communauté, Réglages). Le test verrouillé change en conséquence.
 *
 * Pour CHAQUE combinaison {4 palettes} × {clair, sombre, nuit} × {6 espaces} ET pour chaque mélange que l'Auto peut
 * afficher (toutes les 5 minutes sur 24 h) : texte, texte secondaire, liens (primaire), accent 2 et les quatre statuts
 * ≥ 4,5:1 sur :
 *  - le fond, son dégradé et CHAQUE couleur de la scène de l'espace (ciel, lumière, brume, pierres, face éclairée,
 *    sol, fenêtre) — le texte des écrans peut se poser directement sur la scène ;
 *  - chaque matière posée sur chacune de ces couleurs : verre optique (remplissage + lumière interne + reflet),
 *    verre givré / fumé, surface mate, creux, LENTILLE (sur le rail en creux), teintes de carte, tuiles éclairées.
 * Exclus (traits décoratifs ≤ 2 px, jamais une zone sous un texte) : arêtes éclairées des pierres, reflets.
 * Texte des boutons principaux ≥ 4,5:1 sur chaque arrêt de leur dégradé ; bandeaux lisibles.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import {
  AUTO_SCHEDULE, autoPaletteAt, bannerColors, blendAccents, buildTheme, innerLight, LEGACY_PALETTE, migratePalette, NEUTRALS, PALETTE_NAMES, PALETTES,
  SIGNATURE_PALETTE, themes, type PaletteName, type Theme, type ThemeName,
} from '@/theme/tokens';
import { AMBIANCES, SPACE_KEYS, spaceScene, type SpaceKey } from '@/theme/ambiance';
import { contrastRatio, over, parseColor, stack, type RGB } from '@/theme/contrast';
import { BANNER_ICON } from '@/components/ui';

const AA = 4.5;
const MODES: ThemeName[] = ['light', 'dark', 'night'];

/** Toutes les couleurs « de page » d'un espace : fond, dégradé et chaque zone de sa scène. */
function scenePages(t: Theme, space: SpaceKey): [string, RGB][] {
  const c = t.colors;
  const s = spaceScene(t, space);
  const opaque: [string, string][] = [
    ['fond', c.background], ['dégradé0', c.gradient[0]], ['dégradé1', c.gradient[1]], ['dégradé2', c.gradient[2]],
    ['ciel haut', s.sky[0]], ['ciel', s.sky[1]], ['ciel bas', s.sky[2]], ['lumière', s.light], ['brume', s.haze],
    ['pierre lointaine', s.stones[0]], ['pierre', s.stones[1]], ['pierre proche', s.stones[2]], ['face éclairée', s.facet],
    ['sol', s.floor[0]], ['sol bas', s.floor[1]], ['fenêtre', s.window],
  ];
  return opaque.map(([k, v]) => [`${space}/${k}`, parseColor(v).rgb]);
}

const tileLayer = (t: Theme, tint: string) => { const l = innerLight(t, tint); return `rgba(${parseColor(l.color).rgb.join(',')},${l.opacity})`; };

/** Tout ce qui peut se trouver sous un texte : pages de chaque scène, puis chaque matière posée dessus. */
function bases(t: Theme, spaces: SpaceKey[] = SPACE_KEYS): [string, RGB][] {
  const c = t.colors;
  const m = t.material;
  const pages = spaces.flatMap((sp) => scenePages(t, sp));
  const out: [string, RGB][] = [...pages];
  const fills: [string, string[]][] = [
    ['mate', [m.surfaces.matte.fill]],
    ['verre givré/fumé', [m.surfaces.frosted.fill]],
    ['verre givré/fumé + reflet', [m.surfaces.frosted.fill, m.surfaces.frosted.inner[0]]],
    ['verre optique', [m.surfaces.optical.fill]],
    ['verre optique + lumière interne', [m.surfaces.optical.fill, m.surfaces.optical.inner[0]]],
    ['verre optique + lumière interne + reflet spéculaire', [m.surfaces.optical.fill, m.surfaces.optical.inner[0], m.light.sheen]],
    ['verre optique + lumière interne basse', [m.surfaces.optical.fill, m.surfaces.optical.inner[1]]],
    ['lentille sur rail', [m.glass.inset.fill, m.lens.fill]],
    ['lentille sur verre optique', [m.surfaces.optical.fill, m.lens.fill]],
    ['lentille + ombre interne', [m.glass.inset.fill, m.lens.fill, m.lens.shade]],
    ['carte secondaire', [c.surfaceAlt]],
    ['creux', [m.glass.inset.fill]],
    ['teinte soft', [m.cardTint.soft]], ['teinte lavande', [m.cardTint.lavender]], ['teinte or', [m.cardTint.gold]],
    ['tuile accent', [m.surfaces.matte.fill, tileLayer(t, t.tokens.accent.glow[0])]],
    ['tuile accent 2', [m.surfaces.matte.fill, tileLayer(t, t.tokens.accent.glow[1])]],
  ];
  for (const [label, layers] of fills) {
    for (const [pk, p] of pages) out.push([`${label}/${pk}`, layers.reduce<RGB>((acc, l) => over(l, acc), p)]);
  }
  return out;
}

function checkTheme(t: Theme, spaces: SpaceKey[] = SPACE_KEYS) {
  const c = t.colors;
  const s = t.tokens.status;
  const inks: Record<string, string> = {
    texte: c.text, 'texte secondaire': c.textMuted, primaire: c.primary, 'accent 2': c.lavender,
    succès: s.success, attention: s.warning, erreur: s.danger, info: s.info,
  };
  const all = bases(t, spaces);
  const failures: string[] = [];
  for (const [k, fg] of Object.entries(inks)) {
    let w = { ratio: Infinity, on: '' };
    for (const [label, b] of all) { const x = contrastRatio(fg, b); if (x < w.ratio) w = { ratio: x, on: label }; }
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
    it(`${mode} : texte, liens et statuts ≥ 4,5:1 sur les 6 scènes d'espace et toutes les matières (lentille comprise)`, () => {
      expect(checkTheme(buildTheme(mode, PALETTES[p], p))).toEqual([]);
    });
    it(`${mode} : bandeaux lisibles (accent et texte) sur toutes les scènes`, () => {
      const t = buildTheme(mode, PALETTES[p], p);
      const failures: string[] = [];
      for (const [tone, b] of Object.entries(bannerColors(t))) {
        for (const sp of SPACE_KEYS) for (const [pk, page] of scenePages(t, sp)) {
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
        const tile = stack(t.material.surfaces.matte.fill, tileLayer(t, tint));
        for (const fg of [t.colors.text, t.colors.textMuted, tint]) if (contrastRatio(fg, tile) < AA) failures.push(`${fg} sur tuile ${tint}`);
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('palette Auto : chaque mélange affichable reste lisible', () => {
  const day = new Date(2026, 10, 14, 0, 0, 0);
  const samples = Array.from({ length: 24 * 12 }, (_, i) => new Date(day.getTime() + i * 5 * 60_000));
  for (const mode of MODES) {
    it(`${mode} : 288 instants (toutes les 5 min), chaque espace`, () => {
      const failures: string[] = [];
      const done = new Set<string>();
      for (const d of samples) {
        const a = autoPaletteAt(d);
        const key = `${a.from}>${a.to}@${a.k}`;
        if (done.has(key)) continue; // même mélange affiché : déjà vérifié
        done.add(key);
        const t = buildTheme(mode, blendAccents(PALETTES[a.from], PALETTES[a.to], a.k), a.dominant);
        for (const f of checkTheme(t)) failures.push(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${f}`);
      }
      expect(done.size).toBeGreaterThanOrEqual(4 * 12);
      expect(failures).toEqual([]);
    });
  }
});

describe('changement de palette animé : chaque étape intermédiaire reste lisible', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`${mode} : 4 × 3 transitions, 3 étapes chacune, chaque espace`, () => {
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
  const at = (h: number, m = 0) => new Date(2026, 10, 14, h, m, 0);
  it('matin Brume pêche, journée Lagune turquoise, fin de journée Ambre minéral, soir et nuit Aurore lilas', () => {
    expect(autoPaletteAt(at(8)).dominant).toBe('peche');
    expect(autoPaletteAt(at(14)).dominant).toBe('lagune');
    expect(autoPaletteAt(at(19)).dominant).toBe('ambre');
    expect(autoPaletteAt(at(23)).dominant).toBe('lilas');
    expect(autoPaletteAt(at(3)).dominant).toBe('lilas');
    expect(AUTO_SCHEDULE.map((s) => s.palette)).toEqual(['peche', 'lagune', 'ambre', 'lilas']);
    expect(new Set(AUTO_SCHEDULE.map((s) => s.palette))).toEqual(new Set(PALETTE_NAMES)); // chaque palette a son moment
  });
  it('hors transition : palette pure (k = 0), prochain changement 30 min avant la bascule', () => {
    const s = autoPaletteAt(at(14, 7));
    expect(s.k).toBe(0);
    expect(s.from).toBe(s.to);
    expect(s.next.getHours()).toBe(16);
    expect(s.next.getMinutes()).toBe(30);
    expect(s.upcoming.palette).toBe('ambre');
    expect(s.upcoming.at.getHours()).toBe(17);
  });
  it('fondu de 60 min par paliers de 5 min, jamais de saut (≤ 1/12 par palier), déterministe', () => {
    let prev = -1;
    const ks: number[] = [];
    for (let m = -35; m <= 35; m++) {
      const d = new Date(at(17).getTime() + m * 60_000);
      const s = autoPaletteAt(d);
      const k = s.from === 'lagune' && s.to === 'ambre' ? s.k : s.to === 'ambre' && s.from === 'ambre' ? 1 : 0;
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
    const a = autoPaletteAt(new Date(2026, 10, 14, 23, 59));
    const b = autoPaletteAt(new Date(2026, 10, 15, 0, 1));
    expect(a.dominant).toBe('lilas');
    expect(b.dominant).toBe('lilas');
    const early = autoPaletteAt(at(5, 50));
    expect([early.from, early.to]).toEqual(['lilas', 'peche']);
  });
});

// Palette v4 verrouillée (décision du propriétaire, 14/11/2026) : toute modification doit être volontaire
// (mettre à jour HOMI_DESIGN_SYSTEM.md et ce test).
const LOCKED: Record<PaletteName, { ink: [string, string]; glow: [string, string] }> = {
  peche: { ink: ['#9A4122', '#3A5878'], glow: ['#FFB08E', '#A9C4E8'] },
  lilas: { ink: ['#5B3DB0', '#8A3866'], glow: ['#C8B5FF', '#F4B4D2'] },
  lagune: { ink: ['#00636A', '#2D5786'], glow: ['#55DCD2', '#A4C4F0'] },
  ambre: { ink: ['#7C4A0C', '#7A4030'], glow: ['#F0BC6C', '#E6A890'] },
};
it('palette de marque HOMI v4 (couleurs verrouillées)', () => {
  expect(NEUTRALS.ivory).toBe('#F6F3EE');
  expect(NEUTRALS.obsidian).toBe('#07080B');
  expect([NEUTRALS.mist, NEUTRALS.peach, NEUTRALS.lilac]).toEqual(['#D3DEEA', '#F4D6C4', '#E0D8F3']);
  expect(themes.light.colors.background).toBe('#F6F3EE');
  expect(themes.dark.colors.background).toBe('#07080B');
  expect(SIGNATURE_PALETTE).toBe('peche');
  expect(themes.dark.palette).toBe('peche');
  expect(PALETTE_NAMES).toEqual(['peche', 'lilas', 'lagune', 'ambre']);
  expect(PALETTES).toEqual(LOCKED);
  // le sens des statuts ne change pas avec la v4
  expect(themes.light.tokens.status).toEqual({ success: '#1B6234', warning: '#7A4600', danger: '#A51F2B', info: '#1D5AA6' });
  expect(themes.dark.tokens.status).toEqual({ success: '#8BE0A6', warning: '#F7C770', danger: '#FF9A93', info: '#9CC4FF' });
});

it('ambiances : chaque espace a sa composition, sa lumière et son accent secondaire (aucune couleur de statut)', () => {
  const comps = new Set(SPACE_KEYS.map((s) => AMBIANCES[s].composition));
  expect(comps.size).toBe(SPACE_KEYS.length);
  const lights = new Set(SPACE_KEYS.map((s) => `${AMBIANCES[s].light.x},${AMBIANCES[s].light.y}`));
  expect(lights.size).toBe(SPACE_KEYS.length);
  for (const mode of ['light', 'dark'] as const) {
    const t = buildTheme(mode, PALETTES.peche, 'peche');
    const hues = new Set(SPACE_KEYS.map((s) => spaceScene(t, s).hue));
    expect(hues.size).toBe(SPACE_KEYS.length);
    const statuses = Object.values(t.tokens.status);
    for (const s of SPACE_KEYS) expect(statuses).not.toContain(spaceScene(t, s).hue);
  }
});

it('migration : chaque palette v3 va vers la palette v4 la plus proche (distance RVB des encres et des lueurs)', () => {
  const V3: Record<string, { ink: [string, string]; glow: [string, string] }> = {
    turquoise: { ink: ['#00646A', '#7A4E12'], glow: ['#46E3D6', '#E9C58C'] },
    aurore: { ink: ['#0A6176', '#5E36C4'], glow: ['#6FE3F5', '#C4B2FF'] },
    crepuscule: { ink: ['#A63A1C', '#8A4D00'], glow: ['#FF9C84', '#FFC56E'] },
    menthe: { ink: ['#0A6459', '#256A28'], glow: ['#5EE6D0', '#93E89A'] },
    iris: { ink: ['#4540C8', '#A11F60'], glow: ['#A9B2FF', '#F7A4CF'] },
  };
  const d = (a: string, b: string) => { const A = parseColor(a).rgb; const B = parseColor(b).rgb; return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  const dist = (o: typeof V3[string], n: PaletteName) => d(o.ink[0], PALETTES[n].ink[0]) + d(o.ink[1], PALETTES[n].ink[1]) + d(o.glow[0], PALETTES[n].glow[0]) + d(o.glow[1], PALETTES[n].glow[1]);
  for (const [old, acc] of Object.entries(V3)) {
    const nearest = [...PALETTE_NAMES].sort((x, y) => dist(acc, x) - dist(acc, y))[0];
    expect([old, LEGACY_PALETTE[old]]).toEqual([old, nearest]);
    expect(migratePalette(old)).toBe(nearest);
  }
  expect(migratePalette('auto')).toBe('auto');
  expect(migratePalette(undefined)).toBe('auto');
  expect(migratePalette('lagune')).toBe('lagune');
  expect(migratePalette('inconnue')).toBe(SIGNATURE_PALETTE);
});

it('le fond sombre est une obsidienne froide et neutre, le fond clair un ivoire lumineux chaud', () => {
  const [r, g, b] = parseColor(themes.dark.colors.background).rgb;
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(6); // presque neutre
  expect(b).toBeGreaterThanOrEqual(r); // froid, jamais violet
  expect(g).toBeGreaterThanOrEqual(r);
  const [R, , B] = parseColor(themes.light.colors.background).rgb;
  expect(R).toBeGreaterThan(B); // chaud
});

it('la surface mate est opaque (pas de verre pour les listes et les données)', () => {
  for (const mode of MODES) for (const p of PALETTE_NAMES) expect(parseColor(buildTheme(mode, PALETTES[p], p).material.surfaces.matte.fill).a).toBe(1);
});

it('la lentille grossit sans colorer : plus claire que le rail qu’elle survole, accent lisible dessus', () => {
  for (const p of PALETTE_NAMES) for (const mode of ['light', 'dark'] as const) {
    const t = buildTheme(mode, PALETTES[p], p);
    const page = parseColor(t.colors.background).rgb;
    const rail = over(t.material.glass.inset.fill, page);
    const lens = over(t.material.lens.fill, rail);
    const lum = (x: RGB) => x[0] * 0.2126 + x[1] * 0.7152 + x[2] * 0.0722;
    if (mode === 'light') expect(lum(lens)).toBeGreaterThan(lum(rail));
    else expect(lum(lens)).toBeGreaterThan(lum(rail));
    expect(contrastRatio(t.colors.primary, lens)).toBeGreaterThanOrEqual(AA);
  }
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
    expect(t.tokens.status.warning).not.toBe(t.colors.primary);
  }
});
