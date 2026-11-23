/** iOS / Android : Skia est natif, le graphique se rend tout de suite. (Web : SkiaHost.web.tsx.) */
import React from 'react';
import NapCompareChart, { type NapCompareProps } from './NapCompareChart';

export function NapCompare(props: NapCompareProps) {
  return <NapCompareChart {...props} />;
}
