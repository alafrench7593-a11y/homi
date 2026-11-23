/**
 * Contraste WCAG 2.1 (même calcul que src/__tests__/contrast.test.ts) : les couleurs translucides sont d'abord
 * mélangées à ce qu'il y a dessous, puis comparées. Utilisé par les tests du design system (DESIGN_SYSTEM.md).
 */
export type RGB = [number, number, number];

export function parseColor(c: string): { rgb: RGB; a: number } {
  if (c.startsWith('#')) {
    const h = c.slice(1);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB, a };
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`Couleur illisible : ${c}`);
  const p = m[1].split(',').map((x) => parseFloat(x));
  return { rgb: [p[0], p[1], p[2]], a: p[3] ?? 1 };
}

/** Couleur (éventuellement translucide) posée sur une base opaque. */
export function over(top: string, base: RGB): RGB {
  const { rgb, a } = parseColor(top);
  return rgb.map((v, i) => v * a + base[i] * (1 - a)) as RGB;
}

/** Superpose plusieurs couches, de la plus basse (opaque) à la plus haute. */
export function stack(base: string, ...layers: string[]): RGB {
  return layers.reduce<RGB>((acc, l) => over(l, acc), parseColor(base).rgb);
}

function luminance(rgb: RGB) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: RGB | string, b: RGB | string): number {
  const ra = typeof a === 'string' ? parseColor(a).rgb : a;
  const rb = typeof b === 'string' ? parseColor(b).rgb : b;
  const [l1, l2] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
