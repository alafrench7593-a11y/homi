/**
 * Icônes originales des suivis (dessin vectoriel propre à Au fil de nous) et teintes douces.
 * Les anciennes grandes cases carrées ont été remplacées par « Mes actions du jour »
 * (src/features/dailyActions/DailyActions.tsx).
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { TrackKey } from '@/lib/domain/trackingCards';

// ─── Teintes douces (jour) et bleu nuit (nuit) ─────────────────────────────────────────────────────

export const TINT: Record<TrackKey, { bg: string; ink: string }> = {
  bottle: { bg: '#FFEFE6', ink: '#D2693C' }, breastfeed: { bg: '#FFE9F0', ink: '#C2416E' }, diaper: { bg: '#E9F4FF', ink: '#3A78B5' },
  sleep: { bg: '#EEEAFF', ink: '#6A52D6' }, meal: { bg: '#EAF7EC', ink: '#3C8C55' }, pumping: { bg: '#FBEAF5', ink: '#A6448A' },
  observation: { bg: '#FFF4E0', ink: '#B7791F' }, growth: { bg: '#E6F6F4', ink: '#2A8A80' }, medication: { bg: '#F1ECFF', ink: '#5E4CC2' },
  appointment: { bg: '#FFEDEB', ink: '#C25145' }, mother_sleep: { bg: '#EAEDFF', ink: '#4F5EC4' }, mood: { bg: '#FFF3E6', ink: '#C27A2C' },
  weight: { bg: '#EEF2F6', ink: '#5B6B7C' },
};
export const NIGHT = { bg: '#141A36', border: '#232B55', text: '#D6DCF5', muted: '#8E97C2', plus: '#2B3670' };

/** Icônes originales (trait arrondi, 24×24). */
export function TrackIcon({ k, color, size = 26 }: { k: TrackKey; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const body = (() => {
    switch (k) {
      case 'bottle': return <><Path {...p} d="M10 2.5h4M10.5 2.5v2.2c0 .8-.6 1.1-1.3 1.6C8 7.1 7.5 8.3 7.5 9.8V19a2.5 2.5 0 0 0 2.5 2.5h4A2.5 2.5 0 0 0 16.5 19V9.8c0-1.5-.5-2.7-1.7-3.5c-.7-.5-1.3-.8-1.3-1.6V2.5" /><Path {...p} d="M7.5 12h3M7.5 15h3M7.5 18h3" /></>;
      case 'breastfeed': return <><Path {...p} d="M12 3.5c3.6 4 6 7.3 6 10.3a6 6 0 0 1-12 0c0-3 2.4-6.3 6-10.3z" /><Path {...p} d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.2" /></>;
      case 'diaper': return <><Path {...p} d="M3.5 7.5h17v3.2c0 5.2-3.8 9-8.5 9s-8.5-3.8-8.5-9z" /><Path {...p} d="M3.5 10.5c2.4 0 3.9 1.3 4.6 3.4M20.5 10.5c-2.4 0-3.9 1.3-4.6 3.4" /><Circle cx="12" cy="7.5" r="0.9" fill={color} /></>;
      case 'sleep': return <><Path {...p} d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" /><Path {...p} d="M15 3.5h3l-3 3.5h3" /></>;
      case 'meal': return <><Path {...p} d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" /><Path {...p} d="M8 20.5h8M16.5 3.5l-3 7M14 3.5l-2.5 7" /></>;
      case 'pumping': return <><Path {...p} d="M7 9a5 5 0 0 1 10 0v1.5H7z" /><Path {...p} d="M10 10.5v3h4v-3M10.5 13.5l-1 7h5l-1-7" /></>;
      case 'observation': return <><Path {...p} d="M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0z" /><Path {...p} d="M12 9v7" /></>;
      case 'growth': return <><Rect {...p} x="4" y="3.5" width="7" height="17" rx="1.5" /><Path {...p} d="M4 7.5h3M4 11.5h4M4 15.5h3M15 20.5V9.5M15 9.5l-2.5 2.5M15 9.5l2.5 2.5" /></>;
      case 'medication': return <><Rect {...p} x="3.2" y="8.3" width="17.6" height="7.4" rx="3.7" transform="rotate(-35 12 12)" /><Path {...p} d="M9.6 8.6l4.8 6.8" /></>;
      case 'appointment': return <><Rect {...p} x="3.5" y="5" width="17" height="15.5" rx="3" /><Path {...p} d="M8 3v4M16 3v4M3.5 10h17" /><Circle cx="12" cy="15" r="1.6" fill={color} /></>;
      case 'mother_sleep': return <><Path {...p} d="M3.5 16.5h17M5 16.5V10a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2v1h6a2 2 0 0 1 2 2v3.5M3.5 19.5v-3M20.5 19.5v-3" /><Path {...p} d="M16 3.5h3l-3 3h3" /></>;
      case 'mood': return <><Circle {...p} cx="12" cy="12" r="8.5" /><Path {...p} d="M8.5 14c.9 1.4 2.1 2 3.5 2s2.6-.6 3.5-2" /><Circle cx="9" cy="10" r="1" fill={color} /><Circle cx="15" cy="10" r="1" fill={color} /></>;
      case 'weight': return <><Rect {...p} x="3.5" y="4" width="17" height="16.5" rx="4" /><Path {...p} d="M8.5 9.5a5 5 0 0 1 7 0L13 12" /></>;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">{body}</Svg>;
}
