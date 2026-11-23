/**
 * Barres tactiles datées (23/11/2026) — même lecture que les courbes de mesures (src/components/measureCurve) :
 *  · le doigt (glisser), la souris (survol, web), le clavier (←/→, Début/Fin, Entrée) et VoiceOver / TalkBack (balayage
 *    haut/bas) sélectionnent la barre la plus proche ; la date et la valeur changent ENSEMBLE (ligne de lecture + bulle
 *    au-dessus de la barre + bord épais) ; la sélection reste au relâchement et vit dans l'adresse (fournie par l'écran) ;
 *  · un jour sans rien de noté = repère en pointillés, jamais une barre à zéro ;
 *  · « Ouvrir la fiche » (ou un toucher bref sur la barre déjà choisie) ouvre la saisie d'origine quand elle existe.
 */
import React, { useRef, useState } from 'react';
import { Platform, View, type GestureResponderEvent } from 'react-native';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { GlassButton } from '@/components/glass';
import { haptic, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { nearestBar, stepBar, type TouchBar } from '@/lib/domain/finishTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const BUBBLE_W = 140;
const TOP = 40;
const AXIS = 22;

export function TouchBars<B extends TouchBar>({ bars, selected, onSelect, onOpen, canOpen, valueText, dateText, axisText, colorOf, title, height = 190, testID, hint }: {
  bars: readonly B[];
  /** Indice choisi (-1 : aucun) */
  selected: number;
  onSelect: (bar: B) => void;
  onOpen?: (bar: B) => void;
  canOpen?: (bar: B) => boolean;
  /** Valeur lue (« 28 jours », « Rien de noté ») */
  valueText: (bar: B) => string;
  /** Date lue (« Cycle du 3 octobre », « Mardi 12 novembre ») */
  dateText: (bar: B) => string;
  /** Repère court sous l'axe (« 3 oct. ») */
  axisText: (bar: B) => string;
  colorOf?: (bar: B) => string;
  /** Nom du graphique pour les lecteurs d'écran */
  title: string;
  height?: number;
  testID: string;
  hint?: string;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const gesture = useRef({ x: 0, moved: false, was: -1 });
  const sel = selected >= 0 ? bars[selected] : null;
  const max = Math.max(1, ...bars.map((b) => b.value ?? 0));
  const cell = width / Math.max(1, bars.length);
  const barW = Math.max(3, Math.min(28, cell * 0.62));
  const plotH = height - TOP - AXIS;
  const centers = bars.map((_, i) => cell * i + cell / 2);
  const barH = (b: B) => (b.value == null ? 0 : Math.max(4, (b.value / max) * plotH));
  const readout = sel ? tr('ft.bars.readout', { date: dateText(sel), value: valueText(sel) }) : tr('ft.bars.pick');
  const openable = !!(sel && onOpen && (canOpen ? canOpen(sel) : true));

  const pick = (k: number) => {
    const b = bars[k];
    if (b && k !== selected) { haptic('selection'); onSelect(b); }
  };
  const open = () => { if (sel && openable) onOpen!(sel); };
  const at = (x: number) => nearestBar(centers, x);
  // repères sous l'axe : premier, milieu, dernier (lisibles même sur 31 barres)
  const marks = bars.length <= 8 ? bars.map((_, i) => i) : [0, Math.floor((bars.length - 1) / 2), bars.length - 1];

  const webProps = Platform.OS === 'web' ? {
    tabIndex: 0,
    onPointerMove: (e: { nativeEvent: { offsetX?: number; locationX?: number } }) => { if (bars.length) pick(at(e.nativeEvent.offsetX ?? e.nativeEvent.locationX ?? 0)); },
    onKeyDown: (e: { key: string; preventDefault?: () => void; nativeEvent?: { key?: string } }) => {
      const key = e.key ?? e.nativeEvent?.key;
      const map: Record<string, () => void> = {
        ArrowLeft: () => pick(stepBar(selected, -1, bars.length)), ArrowDown: () => pick(stepBar(selected, -1, bars.length)),
        ArrowRight: () => pick(stepBar(selected, 1, bars.length)), ArrowUp: () => pick(stepBar(selected, 1, bars.length)),
        Home: () => pick(0), End: () => pick(bars.length - 1), Enter: open, ' ': open,
      };
      if (map[key]) { e.preventDefault?.(); map[key](); }
    },
  } as object : {};

  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      <Text variant="small" weight="bold" style={TABULAR} testID={`${testID}-readout`} accessibilityLiveRegion="polite" numberOfLines={2}>{readout}</Text>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} testID={`${testID}-plot`}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: TOP + plotH, height: 0, borderTopWidth: 1, borderColor: t.colors.border }} />
        {width ? bars.map((b, i) => {
          const on = i === selected;
          const h = barH(b);
          const color = colorOf ? colorOf(b) : t.colors.primary;
          return b.value == null ? (
            <View key={b.id} pointerEvents="none" testID={`${testID}-empty-${b.id}`}
              style={{ position: 'absolute', left: centers[i] - barW / 2, width: barW, top: TOP + plotH - 10, height: 10, borderRadius: 3, borderWidth: on ? 2 : 1, borderStyle: 'dashed', borderColor: on ? t.colors.text : t.colors.border }} />
          ) : (
            <View key={b.id} pointerEvents="none" testID={`${testID}-bar-${b.id}`}
              style={{ position: 'absolute', left: centers[i] - barW / 2, width: barW, top: TOP + plotH - h, height: h, borderRadius: Math.min(6, barW / 2), backgroundColor: color, opacity: sel && !on ? 0.55 : 1, borderWidth: on ? 2 : 0, borderColor: t.colors.text }} />
          );
        }) : null}
        {/* Bulle de la barre choisie : la valeur au-dessus de la barre */}
        {width && sel ? (
          <View pointerEvents="none" testID={`${testID}-bubble`} style={{ position: 'absolute', width: BUBBLE_W, alignItems: 'center', left: Math.max(0, Math.min(width - BUBBLE_W, centers[selected] - BUBBLE_W / 2)), top: Math.max(0, TOP + plotH - barH(sel) - 36) }}>
            <View style={{ backgroundColor: t.colors.text, ...whoopEdge(t, t.colors.text), borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={[TABULAR, { color: t.colors.surface, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19 }]} numberOfLines={1}>{valueText(sel)}</Text>
            </View>
          </View>
        ) : null}
        {width ? marks.map((i) => (
          <Text key={`x${bars[i].id}`} variant="caption" muted numberOfLines={1} pointerEvents="none"
            style={[TABULAR, { position: 'absolute', width: 64, textAlign: 'center', left: Math.max(0, Math.min(width - 64, centers[i] - 32)), top: TOP + plotH + 4 }]}>{axisText(bars[i])}</Text>
        )) : null}
        {/* Couche de lecture : doigt, souris (survol), clavier, VoiceOver / TalkBack */}
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          testID={`${testID}-touch`}
          accessible accessibilityRole="adjustable"
          accessibilityLabel={sel ? tr('ft.bars.a11y', { title, pos: selected + 1, count: bars.length, readout }) : title}
          accessibilityHint={tr('ft.bars.a11yHint')}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment') pick(stepBar(selected, 1, bars.length));
            else if (e.nativeEvent.actionName === 'decrement') pick(stepBar(selected, -1, bars.length));
            else if (e.nativeEvent.actionName === 'activate') open();
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e: GestureResponderEvent) => { gesture.current = { x: e.nativeEvent.locationX, moved: false, was: selected }; pick(at(e.nativeEvent.locationX)); }}
          onResponderMove={(e: GestureResponderEvent) => { if (Math.abs(e.nativeEvent.locationX - gesture.current.x) > 8) gesture.current.moved = true; pick(at(e.nativeEvent.locationX)); }}
          onResponderRelease={(e: GestureResponderEvent) => {
            // toucher bref sur la barre DÉJÀ choisie : la fiche s'ouvre (le premier toucher ne fait que choisir)
            if (!gesture.current.moved && at(e.nativeEvent.locationX) === gesture.current.was) open();
          }}
          {...webProps}
        />
      </View>
      <Text variant="caption" muted>{hint ?? tr('ft.bars.hint')}</Text>
      {onOpen ? (
        <GlassButton variant="primary" icon="edit-2" label={tr('ft.bars.open')} testID={`${testID}-open`} disabled={!openable} onPress={open} style={{ alignSelf: 'flex-start' }} />
      ) : null}
    </View>
  );
}
