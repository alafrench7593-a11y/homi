/** iOS / Android : Skia est natif, la courbe se rend tout de suite. (Web : MeasureCurveHost.web.tsx.) */
import React from 'react';
import MeasureCurveCanvas, { type MeasureCurveCanvasProps } from './MeasureCurveCanvas';

export function MeasureCurveSkia(props: MeasureCurveCanvasProps) {
  return <MeasureCurveCanvas {...props} />;
}
