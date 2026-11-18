/**
 * Une catégorie du centre d'outils : la liste de ses outils (liste virtualisée).
 *  1. les outils du profil affiché ;
 *  2. ceux des autres profils du foyer (ouvrir l'un d'eux sélectionne d'abord ce profil) ;
 *  3. « Aussi utile ici » : raccourcis vers des outils dont la catégorie principale est ailleurs (même identifiant,
 *     même favori) ;
 *  4. « À lire » : les guides de lecture rangés dans cette catégorie.
 * Un ancien identifiant de catégorie (« growth ») ouvre la catégorie actuelle ; « community » n'est pas une catégorie
 * d'outils : le lien mène à l'espace Communauté.
 * « account » (Mon compte et réglages) liste les réglages : ce ne sont pas des outils.
 * Une catégorie sans outil pour les profils du foyer l'explique et propose de modifier le parcours.
 * Compte qui n'est QUE nounou : les outils du foyer ne le concernent pas → « Mes gardes » (comme l'onglet Outils).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, VirtualList } from '@/components/States';
import { Text } from '@/components/ui';
import { ToolRow, ToolRowsSkeleton } from '@/features/toolHub/ToolRow';
import { useMemberships, useProfile } from '@/lib/data/hooks';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { useToolHub, type ToolEntry } from '@/features/toolHub/useToolHub';
import { categoryContent, categoryFromParam, categoryLead, categoryTitle, isToolCategory } from '@/lib/domain/toolCatalog';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Item = { kind: 'header'; key: string; title: string } | { kind: 'tool'; key: string; entry: ToolEntry; first: boolean };

export default function ToolCategoryScreen() {
  if (isCaregiverOnly(useMemberships().data)) return <Redirect href={'/garde' as never} />;
  return <ToolCategory />;
}

function ToolCategory() {
  const { category: param } = useLocalSearchParams<{ category: string }>();
  const category = categoryFromParam(param) ?? param;
  const hub = useToolHub();
  const profileQ = useProfile();
  const loading = profileQ.isLoading && !profileQ.data;
  const valid = isToolCategory(category);

  const items = useMemo<Item[]>(() => {
    if (!valid) return [];
    const out: Item[] = [];
    const push = (title: string | null, key: string, entries: ToolEntry[]) => {
      if (!entries.length) return;
      if (title) out.push({ kind: 'header', key: `h-${key}`, title });
      entries.forEach((entry, i) => out.push({ kind: 'tool', key: `${key}-${entry.tool.id}`, entry, first: i === 0 }));
    };
    if (category === 'account') {
      push(null, 'account', hub.account.map((tool) => ({ tool })));
      return out;
    }
    const mine = hub.all.filter((e) => !e.subject && e.tool.category === category);
    push(null, 'mine', mine);
    // autres profils : un groupe par profil, dans l'ordre du foyer
    const groups = new Map<string, ToolEntry[]>();
    for (const e of hub.all) {
      if (!e.subject || e.tool.category !== category) continue;
      const k = e.profile ?? '';
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    for (const [name, list] of groups) push(name || tr('th.ui.others'), `other-${name}`, list);
    const seen = new Set<string>();
    const readings = hub.all.flatMap((e) => categoryContent([e.tool], category).readings.map((tool) => ({ ...e, tool })))
      .filter((e) => !seen.has(e.tool.id) && (seen.add(e.tool.id), true));
    // raccourcis contextuels : outils rangés ailleurs, proposés ici aussi (une entrée par outil, profil affiché d'abord)
    const shortcuts = hub.all.filter((e) => e.tool.category !== category && (e.tool.also as string[]).includes(category));
    push(tr('th.ui.shortcuts'), 'also', shortcuts);
    push(tr('th.ui.readings'), 'read', readings);
    return out;
  }, [valid, category, hub.all, hub.account]);

  if (category === 'community') return <Redirect href={'/(tabs)/community' as never} />;
  if (!valid) {
    return (
      <Screen back title={tr('th.ui.title')} tool={false}>
        <EmptyState icon="search" title={tr('th.ui.unknownCat')} action={{ label: tr('th.ui.backToTools'), onPress: () => router.replace('/tools' as never) }} />
      </Screen>
    );
  }

  return (
    <Screen back title={categoryTitle(category)} subtitle={categoryLead(category)} scroll={false} tool={false}>
      <VirtualList
        data={items}
        keyExtractor={(it) => it.key}
        testID={`tools-category-list-${category}`}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl, alignSelf: 'center', width: '100%', maxWidth: 720 }}
        initialNumToRender={10}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={loading ? <ToolRowsSkeleton rows={5} testID="tools-category-skeleton" /> : (
          <EmptyState icon="compass" title={tr('th.ui.catEmpty')} body={tr('th.ui.catEmptyB')}
            action={{ label: tr('th.ui.catEmptyAction'), onPress: () => router.push('/journeys' as never) }} />
        )}
        renderItem={({ item }) => item.kind === 'header' ? (
          <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xs }}>
            <Text variant="heading" accessibilityRole="header">{item.title}</Text>
          </View>
        ) : (
          <ToolRow tool={item.entry.tool} first={item.first} favorite={hub.favSet.has(item.entry.tool.id)} onToggleFavorite={hub.toggleFav}
            opensDirectly={hub.opensDirectly(item.entry.tool)} onPress={() => hub.press(item.entry)} onLongPress={() => hub.longPress(item.entry)} />
        )}
      />
      {hub.sheetNode}
    </Screen>
  );
}
