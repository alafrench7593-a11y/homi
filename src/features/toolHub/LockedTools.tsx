/**
 * « Autres outils » (23/11/2026, demande de la propriétaire) : les outils qui ne concernent aucun profil du foyer
 * restent visibles, GRISÉS, avec un cadenas. Un appui explique quel parcours les débloque et mène à « Modifier mon
 * parcours » (plusieurs parcours à la fois sont possibles). Rien n'est ajouté sans l'action de la personne.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { Button, Icon, Text } from '@/components/ui';
import { lockedTools, type CatalogTool } from '@/lib/domain/toolCatalog';
import type { Scope } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const scopeList = (scopes: Scope[]) => scopes.map((s) => tr(`kn.scope.${s}` as TKey)).join(', ');

export function LockedTools({ reachable }: { reachable: ReadonlySet<string> }) {
  const t = useTheme();
  const items = useMemo(() => lockedTools(reachable), [reachable]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ tool: CatalogTool; scopes: Scope[] } | null>(null);
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.xs }} testID="tools-locked">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="lock" size={16} color={t.colors.textMuted} />
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{tr('lk.title')}</Text>
      </View>
      <Text variant="small" muted>{tr('lk.sub')}</Text>
      <Button label={open ? tr('lk.hide') : tr('lk.show', { count: items.length })} variant="secondary" size="sm" icon={open ? 'chevron-up' : 'chevron-down'}
        style={{ alignSelf: 'flex-start' }} onPress={() => setOpen((v) => !v)} testID="tools-locked-toggle" />
      {open ? items.map(({ tool, scopes }) => (
        <Tappable key={tool.id} accessibilityRole="button" accessibilityLabel={tr('lk.a11y', { tool: tool.label })} testID={`tools-locked-${tool.id}`}
          onPress={() => setPicked({ tool, scopes })}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingHorizontal: spacing.sm, borderRadius: radius.md,
            backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' })}>
          {/* Grisé : pictogramme et nom estompés ; le parcours qui débloque reste lisible (texte secondaire) */}
          <View style={{ opacity: 0.4 }}><ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} size={36} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text weight="bold" color={t.colors.textMuted}>{tool.label}</Text>
            <Text variant="caption" muted>{tr('lk.for', { list: scopeList(scopes) })}</Text>
          </View>
          <Icon name="lock" size={16} color={t.colors.textMuted} />
        </Tappable>
      )) : null}
      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={picked ? tr('lk.sheet.title', { tool: picked.tool.label }) : ''}>
        {picked ? (
          <View style={{ gap: spacing.sm }} testID="tools-locked-sheet">
            {picked.tool.sub ? <Text muted>{picked.tool.sub}</Text> : null}
            <Text>{tr('lk.sheet.body', { list: scopeList(picked.scopes) })}</Text>
            <Button label={tr('lk.sheet.cta')} icon="unlock" full testID="tools-locked-unlock" onPress={() => { setPicked(null); router.push('/journeys' as never); }} />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
