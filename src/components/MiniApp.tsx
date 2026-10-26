/**
 * Briques « mini-app » communes à tous les outils :
 * - `TodaySummary` : le résumé du jour en grosses tuiles (valeur + libellé court), lisible d'un coup d'œil ;
 * - `MiniBars` : petite tendance en barres (7 derniers jours…), sans axe ni légende superflue ;
 * - `HistoryHeader` : titre d'historique avec compteur.
 * Les valeurs viennent toujours des vraies données de l'écran ; « — » quand rien n'est encore noté.
 */
import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { Icon, Text, type IconName } from './ui';
import { GlassSurface } from './Glass';
import { glyphColor, tint } from './ToolGlyph';
import { toolForPath } from '@/lib/domain/toolForPath';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export interface SummaryItem { value: string; label: string; icon?: IconName; testID?: string }

/** Couleur de l'outil affiché (celle de son glyphe), ou la couleur principale. */
export function useToolAccent() {
  const t = useTheme();
  const pathname = usePathname();
  const tool = React.useMemo(() => toolForPath(pathname), [pathname]);
  return tool ? glyphColor(t, tool.theme, tool.urgent) : t.colors.primary;
}

export function TodaySummary({ title = "Aujourd'hui", items, testID }: { title?: string; items: SummaryItem[]; testID?: string }) {
  const t = useTheme();
  const accent = useToolAccent();
  return (
    <View style={{ gap: spacing.xs }} testID={testID ?? 'miniapp-today'} accessibilityRole="summary" accessibilityLabel={`${title} : ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
      <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.map((it, i) => (
          <GlassSurface key={i} fill={t.colors.surface} depth={1} radius={20} style={{ flexGrow: 1, flexBasis: items.length > 2 ? '30%' : '45%', minWidth: 96 }}>
            <View style={{ padding: spacing.md, gap: 4 }} testID={it.testID}>
              {it.icon ? (
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(accent, t.isDark ? 0.22 : 0.14) }}>
                  <Icon name={it.icon} size={15} color={accent} />
                </View>
              ) : null}
              <Text weight="bold" style={{ fontSize: 24, lineHeight: 29 }} numberOfLines={1} adjustsFontSizeToFit>{it.value}</Text>
              <Text variant="caption" muted numberOfLines={2}>{it.label}</Text>
            </View>
          </GlassSurface>
        ))}
      </View>
    </View>
  );
}

/** Petite tendance en barres : la dernière barre (aujourd'hui) est mise en avant. */
export function MiniBars({ values, labels, height = 64, testID }: { values: number[]; labels?: string[]; height?: number; testID?: string }) {
  const t = useTheme();
  const accent = useToolAccent();
  const max = Math.max(1, ...values);
  return (
    <View style={{ gap: 4 }} testID={testID} accessibilityRole="image" accessibilityLabel={labels ? values.map((v, i) => `${labels[i]} ${v}`).join(', ') : values.join(', ')}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, height: Math.max(4, (v / max) * height), borderRadius: 6, backgroundColor: i === values.length - 1 ? accent : tint(accent, t.isDark ? 0.35 : 0.28) }} />
        ))}
      </View>
      {labels ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {labels.map((l, i) => <Text key={i} variant="caption" muted center style={{ flex: 1, fontSize: 11 }}>{l}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

export function HistoryHeader({ title = 'Historique', count }: { title?: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {count != null ? <Text variant="caption" muted>{count}</Text> : null}
    </View>
  );
}
