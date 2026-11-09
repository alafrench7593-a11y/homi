/**
 * Briques « mini-app » communes à tous les outils :
 * - `TodaySummary` : le résumé du jour en grosses tuiles (valeur + libellé court), lisible d'un coup d'œil ;
 * - `MiniBars` : petite tendance en barres (7 derniers jours…), sans axe ni légende superflue ;
 * - `HistoryHeader` : titre d'historique avec compteur.
 * Les valeurs viennent toujours des vraies données de l'écran ; « — » quand rien n'est encore noté.
 */
import { t as tr } from '@/i18n';
import React from 'react';
import { Platform, View } from 'react-native';
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

export function TodaySummary({ title = tr('u7.today'), items, testID }: { title?: string; items: SummaryItem[]; testID?: string }) {
  const t = useTheme();
  const accent = useToolAccent();
  return (
    <View style={{ gap: spacing.xs }} testID={testID ?? 'miniapp-today'} accessibilityRole="summary" accessibilityLabel={`${title} : ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
      <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.map((it, i) => (
          <GlassSurface key={i} fill={t.colors.surface} depth={1} radius={20} style={{ flexGrow: 1, flexBasis: items.length > 2 ? '30%' : '45%', minWidth: 96 }}>
            {/* Marge latérale 10 px (au lieu de 16) : « Symptômes », « (estimation) » tiennent sur leur ligne dans une tuile de 100 px */}
            <View style={{ paddingVertical: spacing.md, paddingHorizontal: 10, gap: 4 }} testID={it.testID}>
              {it.icon ? (
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(accent, t.isDark ? 0.22 : 0.14) }}>
                  <Icon name={it.icon} size={15} color={accent} />
                </View>
              ) : null}
              {/* Pas de limite de lignes : valeur et libellé restent entiers (jamais « … »), la tuile s'adapte */}
              <Text weight="bold" style={valueStyle(it.value, items.length)}>{it.value}</Text>
              <Text variant="caption" muted style={Platform.OS === 'web' ? ({ hyphens: 'auto' } as object) : undefined}>{it.label}</Text>
            </View>
          </GlassSurface>
        ))}
      </View>
    </View>
  );
}

/** Taille de la valeur selon sa longueur : jamais coupée par « … » (le web ne réduit pas le texte tout seul). */
export function valueStyle(value: string, count: number) {
  const n = value.length + (count > 2 ? 2 : 0);
  const size = n <= 5 ? 24 : n <= 7 ? 20 : n <= 10 ? 17 : 15;
  // D-16 : césure à la syllabe (selon <html lang>) plutôt qu'au milieu d'une lettre sur le web
  return { fontSize: size, lineHeight: Math.round(size * 1.2), ...(Platform.OS === 'web' ? ({ hyphens: 'auto', wordBreak: 'normal', overflowWrap: 'anywhere' } as object) : {}) };
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
