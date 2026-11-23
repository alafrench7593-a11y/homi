/**
 * Aperçu web : Skia s'appuie sur CanvasKit (WebAssembly, `public/canvaskit.wasm`). Le module de dessin n'est chargé
 * qu'APRÈS CanvasKit (même principe que src/features/napLive/SkiaHost.web.tsx) ; en attendant, la zone reste vide à la
 * même hauteur (aucun saut de mise en page) — étiquettes, bulle et couche de lecture sont déjà là.
 */
import React, { Suspense, useEffect, useState } from 'react';
import { View } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { MeasureCurveCanvasProps } from './MeasureCurveCanvas';

const Canvas = React.lazy(() => import('./MeasureCurveCanvas'));
let ready: Promise<void> | null = null;

export function MeasureCurveSkia(props: MeasureCurveCanvasProps) {
  const [ok, setOk] = useState(typeof globalThis !== 'undefined' && !!(globalThis as { CanvasKit?: unknown }).CanvasKit);
  useEffect(() => {
    if (ok) return;
    let alive = true;
    ready ??= LoadSkiaWeb({ locateFile: (f: string) => `/${f}` });
    ready.then(() => { if (alive) setOk(true); }).catch(() => undefined);
    return () => { alive = false; };
  }, [ok]);
  const box = <View style={{ flex: 1 }} testID="measure-curve-loading" />;
  return ok ? <Suspense fallback={box}><Canvas {...props} /></Suspense> : box;
}
