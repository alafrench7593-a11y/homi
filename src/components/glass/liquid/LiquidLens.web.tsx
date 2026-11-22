/**
 * Verre liquide — rendu WEB (barre de l'Accueil, laboratoire).
 *
 * Accès à l'image derrière le verre : un shader WebGL2 ne voit PAS les pixels de la page (DOM) placés derrière lui ;
 * il faudrait recopier l'écran à chaque image (html2canvas : lent, sans texte sélectionnable). On utilise donc la
 * composition du navigateur : `backdrop-filter: url(#filtre)` applique un filtre SVG au contenu RÉEL qui passe
 * derrière (cartes de l'Accueil, en direct, sans boucle JS). Vérifié dans Chromium 157 (flou ET déplacement par
 * `feImage`). Safari et Firefox ignorent `url()` dans `backdrop-filter` : repli dépoli (`blur() saturate()`), lisible.
 *
 * Graphe du filtre : dépoli (flou) → déplacement par la carte de la lèvre (trois passes décalées R/V/B quand la frange
 * est > 0, recombinées en « screen ») → légère saturation. Le reflet est une image calquée au-dessus (lumière fixe).
 * Calques décoratifs : `pointerEvents: none`, cachés aux lecteurs d'écran. Les icônes et libellés sont posés AU-DESSUS
 * (enfants du parent) : jamais filtrés, nets et cliquables.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useReduceTransparency } from '../../surfaces/nativeGlass';
import { displacementMap, highlightMap } from './maps';
import type { LensParams } from './params';
import { lensFrame, type LiquidLensProps } from './frame';

let seq = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Chromium (Chrome, Edge, Opera…) applique les filtres SVG en `backdrop-filter`. WebKit (Safari, tout iOS) non. */
export function supportsSvgBackdrop(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  if (/CriOS|FxiOS|EdgiOS|Firefox\//.test(ua)) return false;
  return /Chrome\/|Chromium\//.test(ua);
}

function toDataUrl(data: Uint8ClampedArray, w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  return c.toDataURL('image/png');
}

function el(name: string, attrs: Record<string, string | number>) {
  const e = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** Construit le filtre SVG (dans un <svg> caché, propre à l'instance). */
function buildFilter(id: string, w: number, h: number, map: string, p: LensParams): SVGElement {
  const f = el('filter', { id, x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  f.appendChild(el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: p.frost, result: 'frost' }));
  const img = el('feImage', { x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'map' });
  img.setAttribute('href', map);
  f.appendChild(img);
  const scale = p.refraction * 2; // déplacement = scale × (canal − 0,5) → au plus `refraction` pt
  if (p.fringe > 0) {
    const spread = p.fringe * 0.35;
    const pass = (s: number, row: string, out: string) => {
      f.appendChild(el('feDisplacementMap', { in: 'frost', in2: 'map', scale: s, xChannelSelector: 'R', yChannelSelector: 'G', result: `${out}d` }));
      f.appendChild(el('feColorMatrix', { in: `${out}d`, type: 'matrix', values: row, result: out }));
    };
    pass(scale * (1 + spread), '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r');
    pass(scale, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g');
    pass(scale * (1 - spread), '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b');
    f.appendChild(el('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' }));
    f.appendChild(el('feBlend', { in: 'rg', in2: 'b', mode: 'screen', result: 'lens' }));
  } else {
    f.appendChild(el('feDisplacementMap', { in: 'frost', in2: 'map', scale, xChannelSelector: 'R', yChannelSelector: 'G', result: 'lens' }));
  }
  f.appendChild(el('feColorMatrix', { in: 'lens', type: 'saturate', values: 1.12 }));
  return f;
}

export function LiquidLensMaterial({ radius, params, testID = 'liquid-lens' }: LiquidLensProps) {
  const t = useTheme();
  const opaque = useReduceTransparency();
  const ref = useRef<View>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useMemo(() => `homi-lens-${++seq}`, []);
  const svgMode = useMemo(() => supportsSvgBackdrop(), []);
  const w = Math.round(size.w), h = Math.round(size.h);
  const geo = { width: w, height: h, radius: Math.min(radius, h / 2) };

  // Cartes : recalculées seulement si la taille ou un réglage change (jamais à chaque image)
  const maps = useMemo(() => {
    if (!w || !h || opaque) return null;
    return {
      lens: svgMode && params.refraction > 0 ? toDataUrl(displacementMap(geo, params), w, h) : '',
      light: params.highlight > 0 ? toDataUrl(highlightMap(geo, params), w, h) : '',
    };
  }, [w, h, radius, opaque, svgMode, params.bezel, params.thickness, params.refraction, params.highlight, params.lightAngle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtre SVG + backdrop-filter posés directement sur le nœud DOM (style que react-native-web ne transmet pas)
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || !w || !h) return undefined;
    if (opaque) { node.style.backdropFilter = ''; node.style.setProperty('-webkit-backdrop-filter', ''); return undefined; }
    if (!svgMode || !maps?.lens) {
      const css = `blur(${Math.max(6, params.frost * 2 + 6)}px) saturate(1.6)`;
      node.style.backdropFilter = css; node.style.setProperty('-webkit-backdrop-filter', css);
      return undefined;
    }
    const svg = el('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute;width:0;height:0;pointer-events:none' });
    svg.appendChild(buildFilter(id, w, h, maps.lens, params));
    document.body.appendChild(svg);
    node.style.backdropFilter = `url(#${id})`;
    node.setAttribute('data-lens', 'svg');
    return () => { svg.remove(); node.style.backdropFilter = ''; };
  }, [id, w, h, opaque, svgMode, maps, params]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (Math.round(s.w) === Math.round(width) && Math.round(s.h) === Math.round(height) ? s : { w: width, h: height }));
  };
  const frame = lensFrame(t, params, radius, opaque);
  return (
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID}
      onLayout={onLayout} style={[StyleSheet.absoluteFill, frame.outer]}>
      <View ref={ref} testID={`${testID}-backdrop`} style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }, frame.fill]} />
      {!opaque && maps?.light ? (
        <Image source={{ uri: maps.light }} testID={`${testID}-light`} style={[StyleSheet.absoluteFill, { borderRadius: radius, width: '100%', height: '100%' }]} resizeMode="stretch" />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius }, frame.lip]} />
    </View>
  );
}

