/**
 * Journée v5 « Lumière corail » (16/11/2026) — briques communes de l'accueil, de l'agenda, du résumé du soir, des
 * biberons et des notifications. Interface CALME et PRÉCISE, lisible d'un coup d'œil :
 *
 *  - `StatusPill` : statut court en capsule (icône facultative + libellé, jamais la couleur seule) ;
 *  - `DayRail` : colonne d'heure (chiffres tabulaires, largeur fixe : les horaires s'alignent) + fil vertical fin
 *    et point d'état (en retard / en cours / ensuite / fait) — AUCUNE animation ambiante (pas de pulsation) ;
 *  - `DayList` / `DayRow` : chronologie dans UNE surface, rangées séparées par des filets fins alignés sur le texte ;
 *  - `DoneButton` : bouton « Fait » unique, cohérent partout (aplat creux, coche, cible ≥ 44 px) ;
 *  - `BriefStrip` : tuiles « en bref » sobres (une surface, chiffres tabulaires, filets verticaux, pas d'icônes).
 *
 * Uniquement des jetons du thème (contrastes ≥ 4,5:1 testés : statuts sur leur teinte, textes sur la surface).
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, MIN_TOUCH, radius, spacing, type Theme } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** État d'une ligne de journée. `later` : à venir (après « ensuite ») ; `anytime` : sans heure. */
export type DayState = 'late' | 'now' | 'next' | 'later' | 'done' | 'past' | 'anytime';
export type PillTone = 'late' | 'accent' | 'done' | 'muted' | 'danger' | 'info';

/** Largeur de la colonne d'heure (« 14:30 », « 12 nov. », « Journée ») : identique partout pour aligner les horaires. */
export const TIME_COL = 58;
/** Largeur du fil (point + trait). */
export const RAIL_COL = 14;

export function toneColor(t: Theme, tone: PillTone): string {
  switch (tone) {
    case 'late': return t.tokens.status.warning;
    case 'danger': return t.tokens.status.danger;
    case 'done': return t.tokens.status.success;
    case 'info': return t.tokens.status.info;
    case 'accent': return t.colors.primary;
    default: return t.colors.textMuted;
  }
}
/** Fond teinté d'une capsule : 10 % (clair) / 18 % (sombre) de sa couleur, posé sur la surface. */
export const pillFill = (t: Theme, color: string) => alpha(color, t.isDark ? 0.18 : 0.1);

export const STATE_TONE: Record<DayState, PillTone> = { late: 'late', now: 'accent', next: 'accent', later: 'muted', done: 'done', past: 'muted', anytime: 'muted' };
export const stateLabel = (s: DayState): string => tr(`d5.state.${s}` as never);

/** Statut court en capsule. */
export function StatusPill({ label, tone = 'muted', icon, testID, accessibilityLabel }: { label: string; tone?: PillTone; icon?: IconName; testID?: string; accessibilityLabel?: string }) {
  const t = useTheme();
  const color = toneColor(t, tone);
  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, minHeight: 22, borderRadius: radius.pill, backgroundColor: pillFill(t, color) }}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <Text variant="caption" weight="bold" color={color} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/** Colonne d'heure + fil vertical fin + point d'état. `first` / `last` : le trait s'arrête au premier / dernier point. */
export function DayRail({ time, state, first, last, timeSub }: { time: string; state: DayState; first?: boolean; last?: boolean; timeSub?: string | null }) {
  const t = useTheme();
  const hot = state === 'now' || state === 'next';
  const timeColor = state === 'late' ? t.tokens.status.warning : hot ? t.colors.primary : state === 'done' || state === 'past' ? t.colors.textMuted : t.colors.text;
  const dot = state === 'late' ? t.tokens.status.warning : hot ? t.colors.primary : state === 'done' ? t.tokens.status.success : 'transparent';
  const ring = state === 'later' || state === 'anytime' || state === 'past' ? t.material.lines.track : dot;
  const line = t.material.lines.hairline;
  return (
    <>
      <View style={{ width: TIME_COL, paddingTop: 1 }}>
        <Text variant="small" weight="bold" color={timeColor} style={{ fontVariant: ['tabular-nums'] }} numberOfLines={2}>{time}</Text>
        {timeSub ? <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }} numberOfLines={1}>{timeSub}</Text> : null}
      </View>
      <View style={{ width: RAIL_COL, alignSelf: 'stretch', alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ position: 'absolute', top: first ? 8 : -spacing.sm, bottom: last ? undefined : -spacing.sm, height: last ? (first ? 0 : 8 + spacing.sm) : undefined, width: StyleSheet.hairlineWidth * 2, backgroundColor: line }} />
        <View style={{ marginTop: 5, width: hot ? 10 : 8, height: hot ? 10 : 8, borderRadius: 5, backgroundColor: dot === 'transparent' ? t.colors.surface : dot, borderWidth: dot === 'transparent' ? 1.5 : 0, borderColor: ring }} />
      </View>
    </>
  );
}

/** Surface d'une chronologie (une carte, rangées séparées par des filets). */
export function DayList({ children, testID, style, footer }: { children: React.ReactNode; testID?: string; style?: StyleProp<ViewStyle>; footer?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View testID={testID} style={[{ backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, paddingVertical: spacing.xxs, overflow: 'hidden' }, style]}>
      {children}
      {footer ? <View style={{ paddingHorizontal: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.material.lines.separator }}>{footer}</View> : null}
    </View>
  );
}

/** Filet fin entre deux rangées, aligné sur le texte (après l'heure et le fil). */
export function DaySeparator() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, marginLeft: spacing.md + TIME_COL + RAIL_COL + spacing.sm * 2, backgroundColor: t.material.lines.separator }} />;
}

export interface DayRowSpec {
  key: string;
  time: string;
  timeSub?: string | null;
  state: DayState;
  title: string;
  sub?: string | null;
  /** Capsule de statut (défaut : celle de l'état, sauf `later` / `anytime` / `past`). */
  pill?: { label: string; tone: PillTone; icon?: IconName } | null;
  onPress?: () => void;
  /** Accessoire à droite (bouton « Fait », case à cocher…) ; sinon un chevron si la ligne s'ouvre. */
  right?: React.ReactNode;
  /** Indication visuelle à droite, DANS la zone touchable (ex. « Noter ») : remplace le chevron. */
  trailing?: React.ReactNode;
  /** Barrer le titre (défaut : état « fait »). */
  strike?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Pastille par défaut d'un état (null quand l'heure suffit). */
export function defaultPill(state: DayState): DayRowSpec['pill'] {
  if (state === 'later' || state === 'anytime' || state === 'past') return null;
  return { label: stateLabel(state), tone: STATE_TONE[state] };
}

/** Une rangée de chronologie : heure | fil | titre + statut + précision | accessoire. */
export function DayRow({ r, first, last }: { r: DayRowSpec; first?: boolean; last?: boolean }) {
  const t = useTheme();
  const pill = r.pill === undefined ? defaultPill(r.state) : r.pill;
  const done = r.strike ?? r.state === 'done';
  const hot = r.state === 'now' || r.state === 'next';
  const a11y = r.accessibilityLabel ?? [r.time, r.title, pill?.label, r.sub].filter(Boolean).join('. ');
  const body = (
    <>
      <DayRail time={r.time} timeSub={r.timeSub} state={r.state} first={first} last={last} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text weight={hot ? 'bold' : 'medium'} numberOfLines={3} color={done ? t.colors.textMuted : t.colors.text} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{r.title}</Text>
        {pill || r.sub ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: spacing.xs, rowGap: 4 }}>
            {pill ? <StatusPill label={pill.label} tone={pill.tone} icon={pill.icon} /> : null}
            {r.sub ? <Text variant="small" muted numberOfLines={2} style={{ flexShrink: 1 }}>{r.sub}</Text> : null}
          </View>
        ) : null}
      </View>
    </>
  );
  const rowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, minHeight: MIN_TOUCH + 8 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, paddingRight: r.right ? spacing.xs : spacing.sm }}>
      {r.onPress ? (
        <Tappable accessibilityRole="button" accessibilityLabel={a11y} accessibilityHint={r.accessibilityHint} onPress={() => { haptic('selection'); r.onPress!(); }} testID={r.testID} pressScale={0.99}
          style={[rowStyle, { flex: 1 }]}>
          {body}
          {r.trailing ?? (!r.right ? <View style={{ paddingTop: 2 }}><Icon name="chevron-right" size={18} color={t.colors.textMuted} /></View> : null)}
        </Tappable>
      ) : (
        <View style={[rowStyle, { flex: 1 }]} testID={r.testID} accessible accessibilityLabel={a11y}>{body}{r.trailing}</View>
      )}
      {r.right ? <View style={{ marginLeft: spacing.xs }}>{r.right}</View> : null}
    </View>
  );
}

/** Chronologie complète : surface + rangées + filets. */
export function DayTimeline({ rows, testID, footer, empty, style }: { rows: DayRowSpec[]; testID?: string; footer?: React.ReactNode; empty?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  if (!rows.length) return empty ? <>{empty}</> : null;
  return (
    <DayList testID={testID} footer={footer} style={style}>
      {rows.map((r, i) => (
        <React.Fragment key={r.key}>
          {i ? <DaySeparator /> : null}
          <DayRow r={r} first={i === 0} last={i === rows.length - 1} />
        </React.Fragment>
      ))}
    </DayList>
  );
}

/** Bouton « Fait » : le même partout (aplat creux, coche, libellé), cible tactile ≥ 44 px. */
export function DoneButton({ onPress, label, icon = 'check', accessibilityLabel, testID, busy }: { onPress: () => void; label?: string; icon?: IconName; accessibilityLabel: string; testID?: string; busy?: boolean }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!busy, busy: !!busy }} disabled={busy} testID={testID} hitSlop={6}
      onPress={onPress} pressScale={0.96}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, minWidth: 64, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.control - 2,
        backgroundColor: t.tokens.surface.sunken, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, opacity: busy ? 0.6 : 1 }}>
      <Icon name={icon} size={15} color={t.colors.text} />
      <Text variant="small" weight="bold">{label ?? tr('d5.done')}</Text>
    </Tappable>
  );
}

/** Indication d'action dans une rangée touchable (« Noter », « Remplir ») : même forme que `DoneButton`, non interactive. */
export function RowCue({ label, icon, strong }: { label: string; icon?: IconName; strong?: boolean }) {
  const t = useTheme();
  const fg = strong ? t.tokens.action.text : t.colors.text;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.control - 2, alignSelf: 'center',
      backgroundColor: strong ? t.tokens.action.fill : t.tokens.surface.sunken, borderWidth: strong ? 0 : StyleSheet.hairlineWidth, borderColor: t.colors.border }}>
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Text variant="small" weight="bold" color={fg}>{label}</Text>
    </View>
  );
}

export interface BriefItem { value: string; label: string; testID?: string }

/** « En bref » : une surface, 2 à 4 cellules (valeur tabulaire + libellé), filets verticaux. Pas d'icônes. */
export function BriefStrip({ items, title, testID }: { items: BriefItem[]; title?: string; testID?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs }} testID={testID} accessibilityRole="summary" accessibilityLabel={`${title ?? tr('d5.brief')} : ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
      {title ? <Text variant="label" muted accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{title}</Text> : null}
      <View style={{ flexDirection: 'row', backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, paddingVertical: spacing.sm }}>
        {items.map((it, i) => (
          <View key={i} testID={it.testID} style={{ flex: 1, minWidth: 0, paddingHorizontal: spacing.sm, gap: 2, borderLeftWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: t.material.lines.separator }}>
            <Text weight="bold" style={{ fontSize: it.value.length > 6 ? 17 : 22, lineHeight: 28, fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>{it.value}</Text>
            <Text variant="caption" muted numberOfLines={3}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Titre de section de la journée (libellé + précision facultative à droite). */
export function DaySection({ title, aside, children, testID }: { title: string; aside?: string | null; children: React.ReactNode; testID?: string }) {
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xxs }}>
        <Text variant="label" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
        {aside ? <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }}>{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}
