/**
 * Accessibilité : contrastes AA (WCAG 2.1) de HOMI v7 — HUIT thèmes, en clair, en sombre et en nuit (interne).
 *
 * Pour CHAQUE palette et CHAQUE apparence : texte, texte secondaire, liens (primaire), accent rare et les quatre
 * statuts ≥ 4,5:1 sur le fond et chaque surface (carte, surface élevée, creux, teintes de carte, indicateur de
 * sélection, tuiles teintées, fonds doux de statut). Texte posé sur un accent, libellé de CHAQUE variante de bouton
 * (au repos et pendant l'appui) ≥ 4,5:1. Pictogrammes, anneau de focus et séries de graphiques ≥ 3:1. Bandeaux
 * lisibles. Le rouge d'alerte santé reste distinct des accents (teinte) et a toujours une icône.
 * Les seuils ne se baissent pas : on ajuste les teintes dans src/theme/tokens.ts.
 *
 * La palette par défaut (« Rose poudré et pêche ») est l'identité v5 « Lumière corail », verrouillée ci-dessous.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import {
  ADAPTIVE_PALETTE, bannerColors, buildTheme, DEFAULT_PALETTE, IDENTITY, innerLight, LEGACY_PALETTE, migratePalette, NEUTRALS, PALETTE_NAMES,
  PALETTE_SPECS, PROFILE_KINDS, resolvePalette, SIGNATURE_PALETTE, THEME_STARTS, effectiveMode, themeFor, themes, type PaletteName, type Theme, type ThemeName,
} from '@/theme/tokens';
import { contrastRatio, over, parseColor, stack, type RGB } from '@/theme/contrast';
import { BANNER_ICON, buttonColors, type ButtonVariant } from '@/components/ui';

const AA = 4.5;
/** Grands textes, pictogrammes, éléments graphiques (WCAG 1.4.3 grand texte, 1.4.11). */
const AA_LARGE = 3;
const MODES: ThemeName[] = ['light', 'dark', 'night'];
const CASES: [PaletteName, ThemeName][] = PALETTE_NAMES.flatMap((p) => MODES.map((m): [PaletteName, ThemeName] => [p, m]));

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
    ['fond doux succès', [t.tokens.statusSoft.success]], ['fond doux attention', [t.tokens.statusSoft.warning]],
    ['fond doux alerte', [t.tokens.statusSoft.danger]], ['fond doux info', [t.tokens.statusSoft.info]],
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

describe.each(CASES)('palette %s, thème %s', (paletteName, mode) => {
  const t = buildTheme(mode, paletteName);
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
  it('action principale : texte lisible sur l’aplat, au repos et pendant l’appui (jeton `action`)', () => {
    expect(contrastRatio(t.tokens.action.text, t.tokens.action.fill)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(t.tokens.action.text, t.tokens.action.pressed)).toBeGreaterThanOrEqual(AA);
    expect(t.tokens.action.pressed).not.toBe(t.tokens.action.fill);
    expect(t.tokens.action.disabledFill).not.toBe(t.tokens.action.fill);
    expect(contrastRatio(t.tokens.onHero.text, t.tokens.onHero.fill)).toBeGreaterThanOrEqual(AA);
  });
  it('texte posé sur un accent ≥ 4,5:1 (accent principal et second accent)', () => {
    const failures: string[] = [];
    for (const [k, bg] of [['accent', t.tokens.accent.accent], ['accent 2', t.tokens.accent.accent2]] as const) {
      const r = contrastRatio(t.tokens.text.onAccent, bg);
      if (r < AA) failures.push(`${t.tokens.text.onAccent} sur ${k} ${bg} : ${r.toFixed(2)}`);
    }
    expect(contrastRatio(t.colors.primaryText, t.colors.primary)).toBeGreaterThanOrEqual(AA);
    expect(failures).toEqual([]);
  });
  it('pictogrammes (or, cœur), anneau de focus et séries de graphiques ≥ 3:1 sur le fond et les surfaces', () => {
    const failures: string[] = [];
    const marks: Record<string, string> = { or: t.colors.gold, cœur: t.colors.heart, focus: t.tokens.focus };
    t.tokens.chart.forEach((c, i) => { marks[`série ${i + 1}`] = c; });
    for (const [k, fg] of Object.entries(marks)) {
      for (const [label, b] of bases(t)) { const x = contrastRatio(fg, b); if (x < AA_LARGE) failures.push(`${k} ${fg} sur ${label} : ${x.toFixed(2)}`); }
    }
    expect(failures).toEqual([]);
    expect(t.tokens.chart.length).toBe(6);
    expect(new Set(t.tokens.chart).size).toBe(6);
  });
  it('fonds pâles de la palette (pastilles, tuiles) : texte et texte secondaire ≥ 4,5:1', () => {
    const failures: string[] = [];
    for (const w of t.tokens.decor.wash) {
      for (const fg of [t.colors.text, t.colors.textMuted]) { const r = contrastRatio(fg, stack(t.colors.background, w)); if (r < AA) failures.push(`${fg} sur ${w} : ${r.toFixed(2)}`); }
    }
    expect(failures).toEqual([]);
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

// Thèmes v7 (brief de la propriétaire, 21/11/2026) : couleurs de DÉPART reprises telles quelles (fond / surface / accent /
// texte), ordre du sélecteur, défaut d'une nouvelle installation. Toute modification doit être volontaire (ce test et
// docs/THEMES_AURA.md).
it('huit thèmes : couleurs de départ de la propriétaire, ordre du sélecteur, Olive HOMI par défaut', () => {
  expect(PALETTE_NAMES).toEqual(['nacre', 'graphite', 'sable', 'olive', 'lavande', 'glacier', 'rose', 'amethyste']);
  expect(SIGNATURE_PALETTE).toBe('olive');
  expect(DEFAULT_PALETTE).toBe('olive');
  expect(themes.light).toBe(themeFor('light', 'olive'));
  expect(THEME_STARTS).toEqual({
    nacre: { bg: '#F4F5F8', surface: '#FFFFFF', accent: '#424957', text: '#191D26' },
    graphite: { bg: '#111214', surface: '#24262B', accent: '#E3E5EB', text: '#F5F6F8' },
    sable: { bg: '#F6EDE2', surface: '#FFF6E9', accent: '#674B36', text: '#2D2119' },
    olive: { bg: '#EBEDDF', surface: '#F8F5E8', accent: '#485532', text: '#252D1A' },
    lavande: { bg: '#F7F4FB', surface: '#EDE4F6', accent: '#674A8B', text: '#352345' },
    glacier: { bg: '#EDF4FA', surface: '#DBE9F4', accent: '#315B79', text: '#172C3B' },
    rose: { bg: '#FAF0F3', surface: '#F3DDE5', accent: '#854964', text: '#392331' },
    amethyste: { bg: '#181426', surface: '#272138', accent: '#CBB5F1', text: '#F4EDF9' },
  });
  for (const p of PALETTE_NAMES) {
    const start = THEME_STARTS[p];
    // thème clair : couleurs de départ dans le jeu clair ; thème sombre par nature : dans le jeu sombre, même en « Clair »
    const t = buildTheme('light', p);
    expect(t.isDark).toBe(PALETTE_SPECS[p].scheme === 'dark');
    expect([t.colors.background, t.colors.surface, t.colors.primary, t.colors.text]).toEqual([start.bg, start.surface, start.accent, start.text]);
    // l'action principale est l'accent du thème (bouton « J'accepte » de la référence)
    expect(t.tokens.action.fill).toBe(start.accent);
  }
  // identité v5 conservée comme noms (anciens imports, logo, illustrations)
  expect(IDENTITY.coral).toBe('#F2826F');
  expect(NEUTRALS.ivory).toBe('#FBF4F2');
});

it('contraste ≥ 4,5:1 des couleurs de la propriétaire : texte / fond, texte / surface, texte sur accent, accent / fond', () => {
  const failures: string[] = [];
  for (const p of PALETTE_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const t = buildTheme(mode, p);
      const pairs: [string, string, string][] = [
        ['texte / fond', t.colors.text, t.colors.background],
        ['texte / surface', t.colors.text, t.colors.surface],
        ['texte secondaire / surface', t.colors.textMuted, t.colors.surface],
        ['texte sur accent', t.tokens.text.onAccent, t.tokens.accent.accent],
        ['accent / fond', t.tokens.accent.accent, t.colors.background],
        ['accent / surface', t.tokens.accent.accent, t.colors.surface],
      ];
      for (const [k, fg, bg] of pairs) { const r = contrastRatio(fg, bg); if (r < AA) failures.push(`${p} ${mode} ${k} : ${r.toFixed(2)}`); }
    }
  }
  expect(failures).toEqual([]);
});

it('lueur interne : un jeton par thème et par apparence (décor), éteinte la nuit', () => {
  for (const p of PALETTE_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const g = buildTheme(mode, p).tokens.glow;
      expect(parseColor(g.inner).a).toBe(1);
      expect(parseColor(g.soft).a).toBeLessThan(1);
    }
    expect(parseColor(buildTheme('night', p).tokens.glow.soft).a).toBeLessThan(0.2);
  }
});

it('halo : jeton dédié aux teintes du thème, éteint la nuit', () => {
  expect(themes.light.tokens.halo).toMatchObject({ color: PALETTE_SPECS.olive.decor[0], color2: PALETTE_SPECS.olive.decor[1], color3: PALETTE_SPECS.olive.decor[2] });
  expect(themes.light.tokens.halo.intensity).toBeGreaterThan(0);
  expect(themes.dark.tokens.halo.intensity).toBeGreaterThan(0);
  expect(themes.night.tokens.halo.intensity).toBe(0);
});

it('neutres paramétrés par thème : fonds, texte et accents différents d’un thème à l’autre', () => {
  const light = PALETTE_NAMES.filter((p) => PALETTE_SPECS[p].scheme === 'light');
  for (const mode of ['light', 'dark'] as const) {
    const names = mode === 'light' ? light : PALETTE_NAMES;
    const of = (f: (t: Theme) => string) => new Set(names.map((p) => f(buildTheme(mode, p)))).size;
    expect(of((t) => t.colors.background)).toBe(names.length);
    expect(of((t) => t.colors.text)).toBe(names.length);
    expect(of((t) => t.colors.textMuted)).toBe(names.length);
    expect(of((t) => t.colors.border)).toBe(names.length);
    expect(of((t) => t.colors.primary)).toBe(names.length);
    expect(of((t) => t.tokens.action.fill)).toBe(names.length);
  }
  for (const p of PALETTE_NAMES) {
    // sombre : jamais noir pur, mais profond
    const [r, g, b] = parseColor(buildTheme('dark', p).colors.background).rgb;
    expect(Math.max(r, g, b)).toBeGreaterThan(16);
    expect(Math.max(r, g, b)).toBeLessThan(48);
    if (PALETTE_SPECS[p].scheme === 'light') {
      const [R, G, B] = parseColor(buildTheme('light', p).colors.background).rgb;
      expect(Math.min(R, G, B)).toBeGreaterThan(220);
      expect(buildTheme('light', p).colors.background).not.toBe('#FFFFFF');
    }
    // jeu complet : clair, sombre et nuit, lueur, aperçu du sélecteur
    expect(Object.keys(PALETTE_SPECS[p]).sort()).toEqual(['dark', 'decor', 'glow', 'light', 'night', 'scheme', 'swatch', 'wash']);
  }
});

it('mode Adaptatif : correspondance fixe profil → thème, un thème par profil', () => {
  expect(ADAPTIVE_PALETTE).toEqual({ me: 'rose', pregnancy: 'lavande', child: 'olive', postpartum: 'sable', family: 'glacier' });
  expect(new Set(PROFILE_KINDS.map((k) => ADAPTIVE_PALETTE[k])).size).toBe(PROFILE_KINDS.length);
  for (const k of PROFILE_KINDS) expect(resolvePalette('adaptive', k)).toBe(ADAPTIVE_PALETTE[k]);
  expect(resolvePalette('adaptive', null)).toBe('olive');
  // un thème fixe ne suit pas le profil ; une ancienne préférence devient le thème le plus proche
  expect(resolvePalette('glacier', 'pregnancy')).toBe('glacier');
  expect(resolvePalette('sauge', 'pregnancy')).toBe('olive');
  expect(resolvePalette('lilas', 'pregnancy')).toBe('rose');
  expect(resolvePalette(undefined, 'family')).toBe('olive');
});

it('Noir graphite et Nuit améthyste sont sombres par nature ; les autres suivent l’apparence', () => {
  for (const p of PALETTE_NAMES) {
    const dark = PALETTE_SPECS[p].scheme === 'dark';
    expect(effectiveMode('light', p)).toBe(dark ? 'dark' : 'light');
    expect(effectiveMode('dark', p)).toBe('dark');
    expect(effectiveMode('night', p)).toBe('night');
  }
  expect(PALETTE_NAMES.filter((p) => PALETTE_SPECS[p].scheme === 'dark')).toEqual(['graphite', 'amethyste']);
});

it('Rose poudré (héritier de l’identité v5) : sombre prune-anthracite (jamais noir pur), clair rosé', () => {
  const [r, g, b] = parseColor(buildTheme('dark', 'rose').colors.background).rgb;
  expect(Math.max(r, g, b)).toBeGreaterThan(16); // pas noir pur
  expect(r).toBeGreaterThan(g); // teinte prune (rouge + bleu > vert)
  expect(b).toBeGreaterThan(g);
  const [R, G, B] = parseColor(buildTheme('light', 'rose').colors.background).rgb;
  expect(R).toBeGreaterThan(G); expect(R).toBeGreaterThan(B); // rosé
  expect(Math.min(R, G, B)).toBeGreaterThan(235); // très clair
});

it('migration : chaque ancienne palette devient le thème le plus proche ; un choix v7 est conservé ; rien → défaut', () => {
  // v6 → thème le plus proche (sans perdre le choix de la personne)
  expect([migratePalette('homi'), migratePalette('lavande'), migratePalette('nuit'), migratePalette('sauge'), migratePalette('champagne')])
    .toEqual(['rose', 'lavande', 'glacier', 'olive', 'sable']);
  // v3 / v4 / Auto : lues comme « Rose poudré et pêche » en v6 → Rose poudré
  for (const old of ['auto', 'peche', 'lilas', 'lagune', 'ambre', 'turquoise', 'menthe', 'aurore', 'iris', 'crepuscule']) expect(migratePalette(old)).toBe('rose');
  // nouvelle installation, valeur inconnue : Olive HOMI
  for (const v of ['inconnue', null, undefined, '']) expect(migratePalette(v)).toBe('olive');
  for (const p of PALETTE_NAMES) { expect(migratePalette(p)).toBe(p); expect(Object.keys(LEGACY_PALETTE)).not.toContain(p); }
  expect(migratePalette('adaptive')).toBe('adaptive');
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

it('le rouge d’alerte santé reste distinct des accents (teinte), dans chaque palette, en clair et en sombre', () => {
  for (const [p, mode] of CASES) {
    if (mode === 'night') continue;
    const t = buildTheme(mode, p);
    const danger = hue(t.tokens.status.danger);
    expect(t.tokens.status.danger).not.toBe(t.colors.primary);
    expect(hueDist(danger, hue(t.tokens.accent.accent))).toBeGreaterThanOrEqual(8);
    expect(hueDist(danger, hue(t.tokens.accent.accent2))).toBeGreaterThanOrEqual(8);
    // l'action principale n'est jamais rouge d'alerte
    expect(t.tokens.action.fill).not.toBe(t.tokens.status.danger);
  }
});

it('statuts distincts de l’accent', () => {
  for (const [p, mode] of CASES) {
    const t = buildTheme(mode, p);
    for (const s of Object.values(t.tokens.status)) expect(s).not.toBe(t.colors.primary);
  }
});

it('neutres : encre prune profonde (jamais noir pur)', () => {
  expect(NEUTRALS.ink).not.toBe('#000000');
  const [r, g, b] = parseColor(NEUTRALS.ink).rgb;
  expect(r).toBeGreaterThan(g);
  expect(b).toBeGreaterThan(g);
});
