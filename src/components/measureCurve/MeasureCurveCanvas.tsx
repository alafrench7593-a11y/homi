/**
 * Dessin Skia de la courbe de mesures (Victory Native XL 42) : segments DROITS entre les mesures réelles (aucun lissage,
 * aucune interpolation inventée), un point par mesure, repère vertical en pointillés sur la mesure sélectionnée.
 * Repère de référence facultatif (ex. OMS) : bande 15e–85e très pâle et médiane en tirets, découpés à la zone du graphique.
 * Domaine et marges EXPLICITES : la projection est exactement celle de `projector` (src/lib/domain/measureCurve.ts),
 * ce qui permet aux étiquettes et à la couche de lecture (React Native) de tomber sur les mêmes pixels.
 */
import React, { useMemo } from 'react';
import { Circle, DashPathEffect, Group, Line as SkLine, Path, Skia, vec } from '@shopify/react-native-skia';
import { CartesianChart, Line } from 'victory-native';
import type { CurveBox, CurveDomain } from '@/lib/domain/measureCurve';

export interface CurveReference { band?: { x: number; lo: number; hi: number }[]; median?: { x: number; y: number }[] }

export interface MeasureCurveCanvasProps {
  rows: readonly { x: number; y: number }[];
  domain: CurveDomain;
  box: Pick<CurveBox, 'left' | 'right' | 'top' | 'bottom'>;
  selected: number;
  colors: { line: string; ink: string; ref: string; halo: string };
  reference?: CurveReference | null;
}

export default function MeasureCurveCanvas({ rows, domain, box, selected, colors, reference }: MeasureCurveCanvasProps) {
  const data = useMemo(() => rows.map((r) => ({ x: r.x, y: r.y })), [rows]);
  return (
    <CartesianChart data={data} xKey="x" yKeys={['y']} domain={{ x: [domain.x0, domain.x1], y: [domain.y0, domain.y1] }}
      padding={{ left: box.left, right: box.right, top: box.top, bottom: box.bottom }}
      // Grille et étiquettes : dessinées par l'écran (polices du thème) ; aucune grille Victory par-dessus
      xAxis={{ tickCount: 0, lineWidth: 0 }} yAxis={[{ tickCount: 0, lineWidth: 0 }]} frame={{ lineWidth: 0 }}>
      {({ points, chartBounds, xScale, yScale }) => {
        const clip = Skia.XYWHRect(chartBounds.left, chartBounds.top, chartBounds.right - chartBounds.left, chartBounds.bottom - chartBounds.top);
        let band: ReturnType<typeof Skia.Path.Make> | null = null;
        let median: ReturnType<typeof Skia.Path.Make> | null = null;
        if (reference?.band?.length) {
          band = Skia.Path.Make();
          reference.band.forEach((b, i) => (i ? band!.lineTo(xScale(b.x), yScale(b.hi)) : band!.moveTo(xScale(b.x), yScale(b.hi))));
          reference.band.slice().reverse().forEach((b) => band!.lineTo(xScale(b.x), yScale(b.lo)));
          band.close();
        }
        if (reference?.median?.length) {
          median = Skia.Path.Make();
          reference.median.forEach((m, i) => (i ? median!.lineTo(xScale(m.x), yScale(m.y)) : median!.moveTo(xScale(m.x), yScale(m.y))));
        }
        const sel = points.y[selected];
        return (
          <>
            <Group clip={clip}>
              {band ? <Path path={band} color={colors.ref} opacity={0.14} /> : null}
              {median ? <Path path={median} color={colors.ref} style="stroke" strokeWidth={1.2} opacity={0.55}><DashPathEffect intervals={[5, 4]} /></Path> : null}
            </Group>
            {sel && sel.y != null ? (
              <SkLine p1={vec(sel.x, chartBounds.top - box.top + 6)} p2={vec(sel.x, chartBounds.bottom)} color={colors.ink} strokeWidth={1} opacity={0.45}>
                <DashPathEffect intervals={[3, 4]} />
              </SkLine>
            ) : null}
            {points.y.length > 1 ? <Line points={points.y} color={colors.line} strokeWidth={2.5} curveType="linear" /> : null}
            {points.y.map((p, k) => (p.y == null ? null : (
              <Circle key={k} cx={p.x} cy={p.y} r={k === selected ? 6.5 : 4} color={colors.line} />
            )))}
            {sel && sel.y != null ? <Circle cx={sel.x} cy={sel.y} r={10} color={colors.halo} style="stroke" strokeWidth={2} /> : null}
          </>
        );
      }}
    </CartesianChart>
  );
}
