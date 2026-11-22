/**
 * Frise du jour touchable (même principe que NapDayBand) pour l'allaitement et le tire-lait (22/11/2026).
 *  · 0 h – 24 h (les tétées ont lieu la nuit aussi) ; une tétée qui a commencé la veille part de 0 h.
 *  · Allaitement : DEUX couloirs, Gauche en haut, Droite en bas (lisible sans la couleur) ; « les deux » sans
 *    répartition = bloc hachuré sur les deux couloirs ; tétée sans durée notée = repère en tirets.
 *  · Tire-lait : un couloir, un repère par séance dont la hauteur suit les ml.
 *  · Rien de noté = ligne pointillée. Le doigt glisse : l'élément le plus proche est lu (retour haptique), un toucher
 *    bref ouvre sa fiche. Après une correction, l'ancienne étendue reste marquée en pointillé un instant.
 *  · Liste équivalente juste dessous (lecteurs d'écran, gros doigts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export const TABULAR = { fontVariant: ['tabular-nums' as const] };

export interface BandPiece { lane: 0 | 1 | 'all'; start: number; end: number; kind?: 'solid' | 'hatch' | 'unknown'; height?: number }
export interface BandItem { id: string; start: number; end: number; pieces: BandPiece[]; ongoing?: boolean; note?: string | null; text: string; testID?: string }

/** Élément sous le doigt : celui qui contient la minute, sinon le plus proche à 25 min près. */
export function pickItem(items: readonly BandItem[], minute: number): BandItem | null {
  const inside = items.find((i) => minute >= i.start && minute <= i.end);
  if (inside) return inside;
  let best: BandItem | null = null; let gap = 25;
  for (const i of items) { const d = Math.min(Math.abs(i.start - minute), Math.abs(i.end - minute)); if (d <= gap) { gap = d; best = i; } }
  return best;
}

function Hatch({ color }: { color: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {Array.from({ length: 30 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', top: -20, bottom: -20, left: i * 6 - 30, width: 1.5, backgroundColor: color, opacity: 0.6, transform: [{ rotate: '35deg' }] }} />
      ))}
    </View>
  );
}

/** Ancienne étendue en pointillé après une correction (2,2 s ; 4 s si Réduire les animations), largeur animée. */
function Moving({ left, width, top, height, children }: { left: number; width: number; top: number; height: number; children: React.ReactNode }) {
  const m = useMotion();
  const t = useTheme();
  const w = useRef(new Animated.Value(width)).current;
  const prev = useRef(width);
  const [ghost, setGhost] = useState<number | null>(null);
  useEffect(() => {
    if (Math.abs(prev.current - width) < 0.5) return;
    const old = prev.current; prev.current = width;
    setGhost(old);
    const clear = setTimeout(() => setGhost(null), m.off ? 4000 : 2200);
    if (m.off) w.setValue(width);
    else Animated.timing(w, { toValue: width, duration: 600, easing: Easing.bezier(0.2, 0.9, 0.2, 1), useNativeDriver: false }).start();
    return () => clearTimeout(clear);
  }, [width, m.off, w]);
  return (
    <>
      {ghost != null ? <View pointerEvents="none" testID="bt-band-ghost" style={{ position: 'absolute', left, width: ghost, top, height, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted }} /> : null}
      <Animated.View style={{ position: 'absolute', left, top, height, width: w }}>{children}</Animated.View>
    </>
  );
}

export function SessionBand({ title, total, items, lanes, now, selectedId, onSelect, onOpen, focusId, onClearFocus, a11y, hint, testID = 'bt-band', legend }: {
  title: string; total: string; items: BandItem[];
  /** Libellés des couloirs (allaitement : Gauche / Droite) ; vide : un seul couloir. */
  lanes: string[];
  now: Date; selectedId?: string | null; onSelect?: (id: string | null) => void; onOpen: (id: string) => void;
  focusId?: string | null; onClearFocus?: () => void; a11y: string; hint: string; testID?: string;
  legend: { kind: 'solid' | 'hatch' | 'gap' | 'unknown'; label: string }[];
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [sel, setSelState] = useState<string | null>(selectedId ?? null);
  const setSel = (id: string | null) => { setSelState(id); onSelect?.(id); };
  useEffect(() => { if (selectedId !== undefined && selectedId !== sel) setSelState(selectedId); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedId]);
  useEffect(() => { if (sel && !items.some((i) => i.id === sel)) setSel(null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [items]);
  // Zoom sur la séance ouverte : bornes calculées une fois, puis FIGÉES (une correction se voit sur la même échelle)
  const [zoom, setZoom] = useState<{ id: string; lo: number; hi: number } | null>(null);
  useEffect(() => {
    if (!focusId) { setZoom(null); return; }
    if (zoom?.id === focusId) return;
    const it = items.find((i) => i.id === focusId);
    if (!it) return;
    const lo = Math.max(0, Math.floor((it.start - 60) / 60) * 60);
    setZoom({ id: focusId, lo, hi: Math.min(1440, Math.max(lo + 180, Math.ceil((it.end + 45) / 60) * 60)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, items]);
  const LO = zoom?.lo ?? 0; const HI = zoom?.hi ?? 1440;
  const step = zoom ? 60 : 180;
  const ticks = Array.from({ length: Math.floor((HI - LO) / step) + 1 }, (_, k) => LO + k * step);
  const x = (m: number) => ((Math.min(HI, Math.max(LO, m)) - LO) / (HI - LO)) * width;
  const startX = useRef(0); const moved = useRef(false);
  const minuteAt = (e: GestureResponderEvent) => LO + (Math.max(0, Math.min(width, e.nativeEvent.locationX)) / width) * (HI - LO);
  const touch = (e: GestureResponderEvent) => {
    if (!width) return;
    const p = pickItem(items, minuteAt(e));
    if ((p?.id ?? null) !== sel) { if (p) haptic('selection'); setSel(p?.id ?? null); }
  };
  const two = lanes.length === 2;
  const H = 64; const laneTop = (l: BandPiece['lane']) => (l === 'all' || !two ? 8 : l === 0 ? 8 : 36); const laneH = (l: BandPiece['lane']) => (l === 'all' || !two ? 48 : 20);
  const selItem = items.find((i) => i.id === sel) ?? null;
  const nowM = now.getHours() * 60 + now.getMinutes();
  return (
    <Glass variant="card" radius={radius.xl} testID={testID} contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text variant="label" accessibilityRole="header">{title}</Text>
        <Text variant="small" muted style={TABULAR} testID={`${testID}-total`}>{total}</Text>
      </View>
      {zoom ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4 }}>
          <GlassButton size="sm" variant="tertiary" icon="maximize-2" label={tr('bt.band.allDay')} testID={`${testID}-all-day`} onPress={() => { setZoom(null); onClearFocus?.(); }} />
        </View>
      ) : null}
      <View style={{ minHeight: 44, justifyContent: 'center' }} accessibilityLiveRegion="polite" testID={`${testID}-selection`}>
        {selItem ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold" style={TABULAR}>{selItem.text}</Text>
              {selItem.note ? <Text variant="small" muted numberOfLines={2}>{selItem.note}</Text> : null}
            </View>
            <GlassButton size="sm" variant="secondary" icon="chevron-right" label={tr('bt.band.open')} onPress={() => onOpen(selItem.id)} testID={`${testID}-open`} />
          </View>
        ) : <Text variant="small" muted>{hint}</Text>}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {two ? (
          <View style={{ width: 22, height: H }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text variant="caption" weight="bold" style={{ position: 'absolute', top: 10 }}>{lanes[0].slice(0, 1)}</Text>
            <Text variant="caption" weight="bold" style={{ position: 'absolute', top: 38 }}>{lanes[1].slice(0, 1)}</Text>
          </View>
        ) : null}
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => { startX.current = e.nativeEvent.locationX; moved.current = false; touch(e); }}
          onResponderMove={(e) => { if (Math.abs(e.nativeEvent.locationX - startX.current) > 8) moved.current = true; touch(e); }}
          onResponderRelease={(e) => {
            if (moved.current || !width) return;
            const p = pickItem(items, minuteAt(e));
            if (p) onOpen(p.id);
          }}
          accessible accessibilityRole="adjustable" accessibilityLabel={a11y}
          testID={`${testID}-track`}
          style={{ flex: 1, height: H }}
        >
          {/* Rien de noté : ligne(s) pointillée(s) */}
          {(two ? [18, 46] : [32]).map((y) => <View key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, borderTopWidth: 2, borderStyle: 'dotted', borderColor: t.colors.textMuted, opacity: 0.45 }} />)}
          {width ? items.filter((i) => i.end >= LO && i.start <= HI).flatMap((i) => i.pieces.filter((p) => p.end >= LO && p.start <= HI).map((p, k) => {
            const on = sel === i.id;
            const left = x(p.start); const w = Math.max(6, x(p.end) - left);
            const top0 = laneTop(p.lane); const h0 = laneH(p.lane);
            const h = p.height != null ? Math.max(6, Math.round(h0 * p.height)) : h0;
            const top = top0 + (h0 - h);
            const last = k === i.pieces.length - 1;
            return (
              <Moving key={`${i.id}:${k}`} left={left} width={w} top={top} height={h}>
                <View testID={k === 0 ? (i.testID ?? `${testID}-item-${i.id}`) : undefined}
                  style={{ flex: 1, borderRadius: 6, overflow: 'hidden',
                    backgroundColor: p.kind === 'unknown' || p.kind === 'hatch' ? 'transparent' : t.colors.text,
                    opacity: on ? 1 : 0.86,
                    borderWidth: p.kind === 'unknown' || p.kind === 'hatch' || on ? 1.5 : 0, borderStyle: p.kind === 'unknown' ? 'dashed' : 'solid',
                    borderColor: on ? t.colors.primary : t.colors.text }}>
                  {p.kind === 'hatch' ? <Hatch color={t.colors.text} /> : null}
                  {i.ongoing && last ? <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, backgroundColor: t.colors.primary }} /> : null}
                </View>
              </Moving>
            );
          })) : null}
          {width && items.some((i) => i.note) ? items.filter((i) => i.note && i.start >= LO && i.start <= HI).map((i) => (
            <View key={`n${i.id}`} pointerEvents="none" style={{ position: 'absolute', top: 0, left: Math.max(0, x((i.start + i.end) / 2) - 4), width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary, borderWidth: 1.5, borderColor: t.colors.background }} />
          )) : null}
          {width && nowM >= LO && nowM <= HI ? <View pointerEvents="none" style={{ position: 'absolute', left: x(nowM) - 1, top: 2, bottom: 2, width: 2, borderRadius: 1, backgroundColor: t.colors.primary }} /> : null}
        </View>
      </View>
      <View style={{ height: 16, marginLeft: two ? 28 : 0 }}>
        {width ? ticks.map((m) => (
          <Text key={m} variant="caption" muted style={[{ position: 'absolute', left: x(m) - 14, width: 28, textAlign: 'center' }, TABULAR]}>{`${Math.floor(m / 60)}h`}</Text>
        )) : null}
      </View>
      <Legend items={legend} />
      {items.length ? (
        <View style={{ gap: 2 }} testID={`${testID}-list`}>
          {[...items].reverse().map((i) => (
            <Tappable key={i.id} accessibilityRole="button" accessibilityLabel={i.note ? `${i.text}. ${tr('bt.row.noteA11y', { note: i.note })}` : i.text}
              onPress={() => { setSel(i.id); onOpen(i.id); }} testID={`${testID}-row`}
              style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: i.ongoing ? t.colors.primary : t.colors.text }} />
              <Text style={[{ flex: 1 }, TABULAR]}>{i.text}</Text>
              {i.note ? <Icon name="message-square" size={16} color={t.colors.primary} /> : null}
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          ))}
        </View>
      ) : null}
    </Glass>
  );
}

function Legend({ items }: { items: { kind: 'solid' | 'hatch' | 'gap' | 'unknown'; label: string }[] }) {
  const t = useTheme();
  const sw = { width: 18, height: 10, borderRadius: 3 };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {items.map((it) => (
        <View key={it.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {it.kind === 'solid' ? <View style={[sw, { backgroundColor: t.colors.text }]} />
            : it.kind === 'hatch' ? <View style={[sw, { borderWidth: 1.5, borderColor: t.colors.text, overflow: 'hidden' }]}><Hatch color={t.colors.text} /></View>
            : it.kind === 'unknown' ? <View style={[sw, { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.text }]} />
            : <View style={{ width: 18, borderTopWidth: 2, borderStyle: 'dotted', borderColor: t.colors.textMuted }} />}
          <Text variant="caption" muted>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Semaine en barres : jour sans saisie = cadre pointillé « — » (rien de noté), jamais une barre à zéro. */
export function WeekBars({ title, days, testID }: { title: string; days: { key: string; label: string; value: number | null; text: string; a11y: string }[]; testID: string }) {
  const t = useTheme();
  const max = Math.max(1, ...days.map((d) => d.value ?? 0));
  return (
    <Glass variant="card" radius={radius.xl} testID={testID} contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 96 }}>
        {days.map((d) => (
          <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessible accessibilityLabel={d.a11y}>
            <Text variant="caption" muted numberOfLines={1} style={TABULAR}>{d.text}</Text>
            {d.value == null
              ? <View testID={`${testID}-none`} style={{ width: '70%', height: 36, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dotted', borderColor: t.colors.textMuted }} />
              : <View style={{ width: '70%', height: Math.max(4, Math.round((d.value / max) * 60)), borderRadius: 6, backgroundColor: t.colors.text }} />}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {days.map((d) => <Text key={d.key} variant="caption" muted center style={{ flex: 1 }} numberOfLines={1}>{d.label}</Text>)}
      </View>
      <Text variant="caption" muted>{tr('bt.week.legend')}</Text>
    </Glass>
  );
}

/** Horloge qui avance : chaque seconde pendant une séance en cours, sinon toutes les 30 s. */
export function useTicker(live: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), live ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [live]);
  return now;
}

