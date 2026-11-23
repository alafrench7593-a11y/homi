/**
 * Filtres du catalogue complet (« Mes outils », 20/11/2026) : puces combinables — Catégorie, Âge, Étape de vie,
 * Favoris, Récents — et la liste filtrée (cartes opaques `ToolRow`), avec un état vide utile (effacer les filtres,
 * catégories). Les outils d'un profil que le foyer n'a pas encore sont listés « à découvrir » : leur fiche mène à
 * « Modifier mon parcours ». Le catalogue reste accessible sans onboarding terminé.
 */
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from '@/components/ui';
import { categoryTitle } from '@/lib/domain/toolCatalog';
import { filterCatalog, lockedEntries, NO_FILTERS, type CatalogFilters } from '@/lib/domain/catalogFilters';
import { TOOL_CATEGORIES } from '@/lib/journeys/tools';
import { CHILD_STAGES, type LifeStage } from '@/lib/personalization/toolMeta';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { ToolRow } from './ToolRow';
import type { useToolHub, ToolEntry } from './useToolHub';

const STAGES: LifeStage[] = ['ttc', 'pregnancy', 'postpartum', 'parent', 'couple', 'household', 'nanny'];

function ChipRow({ label, children, testID }: { label: string; children: React.ReactNode; testID: string }) {
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Text variant="caption" weight="medium" muted>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
        {children}
      </ScrollView>
    </View>
  );
}

export function CatalogFilterBar({ value, onChange }: { value: CatalogFilters; onChange: (f: CatalogFilters) => void }) {
  const set = (p: Partial<CatalogFilters>) => onChange({ ...value, ...p });
  return (
    <View style={{ gap: spacing.xs }} testID="tools-filters">
      <ChipRow label={tr('pz.cat.category')} testID="tools-filter-category">
        {TOOL_CATEGORIES.map((c) => <Chip key={c} label={categoryTitle(c)} selected={value.category === c} testID={`tools-filter-cat-${c}`} onPress={() => set({ category: value.category === c ? null : c })} />)}
      </ChipRow>
      <ChipRow label={tr('pz.cat.age')} testID="tools-filter-age">
        {CHILD_STAGES.map((a) => <Chip key={a} label={tr(`pz.stage.${a}` as TKey)} selected={value.age === a} testID={`tools-filter-age-${a}`} onPress={() => set({ age: value.age === a ? null : a })} />)}
      </ChipRow>
      <ChipRow label={tr('pz.cat.stage')} testID="tools-filter-stage">
        {STAGES.map((s) => <Chip key={s} label={tr(`pz.stage.${s}` as TKey)} selected={value.stage === s} testID={`tools-filter-stage-${s}`} onPress={() => set({ stage: value.stage === s ? null : s })} />)}
      </ChipRow>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Chip label={tr('pz.cat.favorites')} selected={value.favorites} testID="tools-filter-favorites" onPress={() => set({ favorites: !value.favorites })} />
        <Chip label={tr('pz.cat.recents')} selected={value.recents} testID="tools-filter-recents" onPress={() => set({ recents: !value.recents })} />
      </View>
    </View>
  );
}

/** Liste filtrée : outils atteignables, puis « à découvrir » ; état vide utile. */
export function FilteredCatalog({ hub, filters, onClear }: { hub: ReturnType<typeof useToolHub>; filters: CatalogFilters; onClear: () => void }) {
  const { mine, locked, byId } = useMemo(() => {
    const flat = hub.flat.map((e) => e.tool);
    const reachable = new Set(flat.map((x) => x.id));
    const ctx = { favorites: hub.favSet, recents: hub.recentIds };
    return {
      mine: filterCatalog(flat, filters, ctx), byId: new Map(hub.flat.map((e) => [e.tool.id, e])),
      locked: filters.favorites || filters.recents ? [] : filterCatalog(lockedEntries(reachable), filters, ctx),
    };
  }, [hub.flat, hub.favSet, hub.recentIds, filters]);
  const entryOf = (tool: ToolEntry['tool']): ToolEntry => byId.get(tool.id) ?? { tool };
  const total = mine.length + locked.length;
  return (
    <View style={{ gap: spacing.xs }} testID="tools-filtered" accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="caption" muted style={{ flex: 1 }} testID="tools-filtered-count">{tr('pz.cat.count', { count: total })}</Text>
        <Button label={tr('pz.cat.clear')} size="sm" variant="ghost" icon="x" onPress={onClear} testID="tools-filter-clear" />
      </View>
      {!total ? (
        <View style={{ gap: spacing.sm }} testID="tools-filtered-empty">
          <Text variant="heading" accessibilityRole="header">{tr('pz.cat.empty')}</Text>
          <Text muted>{tr('pz.cat.emptyB')}</Text>
          <Button label={tr('pz.cat.clear')} icon="x" variant="secondary" full onPress={onClear} />
        </View>
      ) : null}
      {mine.map((tool, i) => {
        const e = entryOf(tool);
        return <ToolRow key={`f-${tool.id}`} tool={tool} otherProfile={e.profile} first={i === 0} testID={`tools-filtered-${tool.id}`} favorite={hub.favSet.has(tool.id)} onToggleFavorite={hub.toggleFav}
          opensDirectly={hub.opensDirectly(tool)} onPress={() => hub.press(e)} onLongPress={() => hub.longPress(e)} />;
      })}
      {locked.length ? (
        <View style={{ gap: spacing.xs, paddingTop: spacing.sm }} testID="tools-filtered-locked">
          <Text variant="heading" accessibilityRole="header">{tr('pz.cat.locked')}</Text>
          <Text variant="small" muted>{tr('pz.cat.lockedB')}</Text>
          {locked.map((tool, i) => (
            <ToolRow key={`l-${tool.id}`} tool={tool} first={i === 0} testID={`tools-locked-${tool.id}`} favorite={false} onToggleFavorite={() => undefined}
              opensDirectly={false} onPress={() => hub.showSheet({ tool })} onLongPress={() => hub.showSheet({ tool })} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export { NO_FILTERS };
