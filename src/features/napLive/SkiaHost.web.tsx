/**
 * Aperçu web : Skia s'appuie sur CanvasKit (WebAssembly, `public/canvaskit.wasm`, copié à l'installation par
 * scripts/setup-skia-web.js). Le module du graphique n'est chargé qu'APRÈS CanvasKit ; en attendant, une réserve de
 * même hauteur (aucun saut de mise en page).
 */
import React, { Suspense, useEffect, useState } from 'react';
import { View } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { NapCompareProps } from './NapCompareChart';

const Chart = React.lazy(() => import('./NapCompareChart'));
let ready: Promise<void> | null = null;

export function NapCompare(props: NapCompareProps) {
  const [ok, setOk] = useState(typeof globalThis !== 'undefined' && !!(globalThis as { CanvasKit?: unknown }).CanvasKit);
  useEffect(() => {
    if (ok) return;
    let alive = true;
    ready ??= LoadSkiaWeb({ locateFile: (f: string) => `/${f}` });
    ready.then(() => { if (alive) setOk(true); }).catch(() => undefined);
    return () => { alive = false; };
  }, [ok]);
  const box = <View style={{ height: (props.height ?? 150) + 24 }} testID="nap-compare-loading" />;
  return ok ? <Suspense fallback={box}><Chart {...props} /></Suspense> : box;
}
