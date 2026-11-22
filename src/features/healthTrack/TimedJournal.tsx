/**
 * Journal horodaté commun aux mini-apps Santé et soins (observations, prises de médicament, humeur) — 22/11/2026.
 *  · `HeroEntry` : la donnée principale en grand (« 38,4 °C », « 2 / 3 prises »), chiffres de largeur fixe, l'unité ou
 *    la période juste dessous, toucher = ouvrir la saisie ;
 *  · `JournalList` : une ligne par saisie — heure en colonne fixe à gauche, pastille, libellé + détail, chevron ;
 *    une journée sans saisie affiche « rien de noté » en pointillé (jamais un zéro) ;
 * Même dessin que les journaux rapides (src/features/quickTrack/DiaperLog.tsx) pour que le geste se reconnaisse.
 */
import React from 'react';
import { View } from 'react-native';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export const TABULAR = { fontVariant: ['tabular-nums' as const] };

export interface JournalRow {
  id: string;
  /** Heure affichée en colonne (« 14 h 20 ») */
  time: string;
  icon: IconName;
  title: string;
  detail?: string | null;
  /** Une note est jointe (petite bulle) */
  hasNote?: boolean;
  /** Forme qui porte l'état (sélection / statut) sans dépendre de la couleur */
  mark?: 'filled' | 'outline' | 'dashed';
  a11y?: string;
}

export function HeroEntry({ label, value, unit, sub, icon, onPress, a11y, testID }: {
  label: string; value: string; unit?: string | null; sub?: string | null; icon: IconName; onPress?: () => void; a11y: string; testID: string;
}) {
  const t = useTheme();
  const body = (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name={icon} size={16} color={t.colors.textMuted} />
        <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2}>{label}</Text>
        {onPress ? <Icon name="chevron-right" size={18} color={t.colors.textMuted} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexWrap: 'wrap' }}>
        <Text testID={`${testID}-value`} maxFontSizeMultiplier={1.3} style={[{ fontSize: 44, lineHeight: 50, letterSpacing: -1.2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{value}</Text>
        {unit ? <Text testID={`${testID}-unit`} style={{ fontSize: 20, fontFamily: fonts.bodyBold, color: t.colors.textMuted }}>{unit}</Text> : null}
      </View>
      {sub ? <Text weight="bold" style={TABULAR} testID={`${testID}-sub`}>{sub}</Text> : null}
    </Glass>
  );
  if (!onPress) return <View testID={testID} accessible accessibilityLabel={a11y}>{body}</View>;
  return (
    <Tappable accessibilityRole="button" testID={testID} accessibilityLabel={a11y} onPress={() => { haptic('selection'); onPress(); }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {body}
    </Tappable>
  );
}

/** Liste d'une journée : en-tête (date + compte), lignes, ou « rien de noté » en pointillé. */
export function JournalList({ title, count, rows, onOpen, emptyLabel, testID, openHint }: {
  title: string; count?: string | null; rows: readonly JournalRow[]; onOpen?: (id: string) => void; emptyLabel: string; testID: string; openHint?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
        {count ? <Text variant="caption" muted style={TABULAR} testID={`${testID}-count`}>{count}</Text> : null}
      </View>
      {rows.length ? rows.map((r) => {
        const inner = (
          <>
            <Text weight="bold" style={[{ width: 72 }, TABULAR]}>{r.time}</Text>
            <View style={{
              width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              borderWidth: r.mark === 'filled' ? 0 : 1.5, borderStyle: r.mark === 'dashed' ? 'dashed' : 'solid', borderColor: t.colors.textMuted,
              backgroundColor: r.mark === 'filled' ? t.colors.text : 'transparent',
            }}>
              <Icon name={r.icon} size={14} color={r.mark === 'filled' ? t.colors.surface : t.colors.text} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2}>{r.title}</Text>
              {r.detail ? <Text variant="caption" muted numberOfLines={2} style={TABULAR}>{r.detail}</Text> : null}
            </View>
            {r.hasNote ? <Icon name="message-square" size={14} color={t.colors.textMuted} /> : null}
            {onOpen ? <Icon name="chevron-right" size={16} color={t.colors.textMuted} /> : null}
          </>
        );
        const style = { minHeight: MIN_TOUCH, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, paddingVertical: 4 };
        return onOpen ? (
          <Tappable key={r.id} accessibilityRole="button" testID={`${testID}-row-${r.id}`} onPress={() => { haptic('selection'); onOpen(r.id); }}
            accessibilityLabel={`${r.a11y ?? `${r.time}, ${r.title}${r.detail ? `, ${r.detail}` : ''}`}${openHint ? `. ${openHint}` : ''}`}
            style={({ pressed }) => ({ ...style, opacity: pressed ? 0.6 : 1 })}>
            {inner}
          </Tappable>
        ) : <View key={r.id} style={style} testID={`${testID}-row-${r.id}`}>{inner}</View>;
      }) : (
        <View testID={`${testID}-none`} style={{ minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm }}>
          <Text variant="small" muted center>{emptyLabel}</Text>
        </View>
      )}
    </View>
  );
}
