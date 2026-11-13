/**
 * Recherche universelle des outils (HOMI) : un champ en haut de l'Accueil et des onglets hub ouvre une feuille
 * qui cherche dans TOUS les outils (profil affiché + autres profils : chaque enfant, grossesse, moi, famille).
 * Champ vide : favoris puis récents. Un outil d'un autre profil sélectionne ce profil avant de s'ouvrir.
 * Réutilise `searchTools` et `favoriteTools` du catalogue (aucune liste parallèle).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from '@/components/Overlays';
import { openTool, ToolShortcut } from '@/components/ToolCard';
import { ToolGlyph } from '@/components/ToolGlyph';
import { Tappable } from '@/components/Tappable';
import { Button, Field, haptic, Icon, Text } from '@/components/ui';
import { useActiveSubject } from '@/lib/data/hooks';
import { useOtherProfileTools } from '@/lib/data/hooks-alltools';
import { useScope } from '@/lib/data/hooks-scope';
import { favoriteTools, searchTools, THEME_TITLE, toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import type { ActiveSubject } from '@/lib/store';
import { useUiStore } from '@/lib/store';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { hubOf } from './hubMap';
import { useRecentTools } from './recentTools';

const HUB_LABEL: Record<ReturnType<typeof hubOf>, TKey> = { health: 'nav.tab.health', baby: 'nav.tab.baby', family: 'nav.tab.family' };
const MAX_RESULTS = 40;

export interface ToolEntry { tool: CatalogTool; subject?: ActiveSubject; profile?: string }

/** Tous les outils atteignables : profil affiché d'abord, puis ceux des autres profils (dédoublonnés). */
export function useAllToolEntries() {
  const scope = useScope();
  const catalog = useMemo(() => toolCatalog(scope), [scope]);
  const others = useOtherProfileTools(catalog);
  const entries = useMemo<ToolEntry[]>(() => [
    ...catalog.map((tool) => ({ tool })),
    ...others.flatMap((o) => o.tools.map((tool) => ({ tool, subject: o.subject, profile: o.title }))),
  ], [catalog, others]);
  return { scope, catalog, others, entries };
}

/** Ouvre un outil depuis la navigation HOMI : sélectionne son profil si besoin et le note dans les récents. */
export function useOpenEntry() {
  const { setSubject } = useActiveSubject();
  const addRecent = useRecentTools((s) => s.addRecent);
  return (e: ToolEntry) => {
    if (e.subject) setSubject(e.subject);
    addRecent(e.tool.id);
  };
}

/** Champ d'accès à la recherche (bouton qui ressemble à un champ, ≥ 48 px). */
export function ToolSearchButton({ testID = 'tool-search-open' }: { testID?: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tappable
        testID={testID}
        accessibilityRole="search"
        accessibilityLabel={tr('nav.search.button')}
        accessibilityHint={tr('nav.search.hint')}
        onPress={() => { haptic('selection'); setOpen(true); }}
        pressScale={0.985}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.pill,
          backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border })}
      >
        <Icon name="search" size={19} color={t.colors.primary} />
        <Text muted style={{ flex: 1 }} numberOfLines={1}>{tr('nav.search.button')}</Text>
        <Icon name="star" size={16} color={t.colors.textMuted} />
      </Tappable>
      <ToolSearchSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ToolSearchSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const reduce = useReduceMotion();
  const [q, setQ] = useState('');
  const { entries } = useAllToolEntries();
  const favIds = useUiStore((s) => s.toolFavorites);
  const recentIds = useRecentTools((s) => s.recentTools);
  const onOpen = useOpenEntry();

  const byId = useMemo(() => { const m = new Map<string, ToolEntry>(); for (const e of entries) if (!m.has(e.tool.id)) m.set(e.tool.id, e); return m; }, [entries]);
  const allTools = useMemo(() => [...byId.values()].map((e) => e.tool), [byId]);
  const results = useMemo(() => (q.trim() ? searchTools(allTools, q).slice(0, MAX_RESULTS).map((x) => byId.get(x.id)!) : []), [q, allTools, byId]);
  const favs = useMemo(() => favoriteTools(allTools, favIds).map((x) => byId.get(x.id)!), [allTools, favIds, byId]);
  const recents = useMemo(() => favoriteTools(allTools, recentIds).map((x) => byId.get(x.id)!), [allTools, recentIds, byId]);

  const close = () => { setQ(''); onClose(); };
  const open = (e: ToolEntry) => {
    haptic('selection');
    onOpen(e);
    close();
    // la feuille se ferme avant la navigation (le modal ne reste pas au-dessus de l'outil)
    setTimeout(() => openTool(e.tool, undefined, true), reduce ? 0 : 180);
  };

  return (
    <Sheet visible={visible} onClose={close} title={tr('nav.search.title')}>
      <View testID="tool-search-sheet" style={{ gap: spacing.md }}>
        <Field label={tr('nav.search.title')} value={q} onChangeText={setQ} placeholder={tr('nav.search.ph')} autoFocus returnKeyType="search" autoCorrect={false}
          accessibilityLabel={tr('nav.search.title')} testID="tool-search-input" />
        {q.trim() ? (
          results.length ? (
            <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
              <Text variant="caption" muted>{tr('nav.search.count', { count: results.length })}</Text>
              {results.map((e) => <ResultRow key={`${e.profile ?? ''}-${e.tool.id}`} entry={e} onPress={() => open(e)} />)}
            </View>
          ) : (
            <View style={{ gap: spacing.xs, alignItems: 'flex-start' }}>
              <Text weight="bold">{tr('nav.search.empty')}</Text>
              <Text variant="small" muted>{tr('nav.search.emptyB')}</Text>
            </View>
          )
        ) : (
          <>
            {favs.length ? <ShortcutRow title={tr('nav.search.favs')} icon="star" entries={favs} onOpen={onOpen} close={close} /> : null}
            {recents.length ? <ShortcutRow title={tr('nav.search.recents')} icon="clock" entries={recents} onOpen={onOpen} close={close} /> : null}
            {!favs.length && !recents.length ? <Text variant="small" muted>{tr('nav.search.hint')}</Text> : null}
          </>
        )}
        <Button label={tr('pj.allTools')} icon="grid" variant="secondary" full testID="tool-search-all"
          onPress={() => { close(); setTimeout(() => router.push('/tools'), reduce ? 0 : 180); }} />
      </View>
    </Sheet>
  );
}

function ShortcutRow({ title, icon, entries, onOpen, close }: { title: string; icon: 'star' | 'clock'; entries: ToolEntry[]; onOpen: (e: ToolEntry) => void; close: () => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={16} color={t.colors.primary} />
        <Text weight="bold" accessibilityRole="header">{title}</Text>
      </View>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
        {entries.map((e) => <ToolShortcut key={e.tool.id} tool={e.tool} beforeOpen={() => { onOpen(e); close(); }} />)}
      </ScrollView>
    </View>
  );
}

function ResultRow({ entry, onPress }: { entry: ToolEntry; onPress: () => void }) {
  const t = useTheme();
  const { tool } = entry;
  const where = [tr(HUB_LABEL[hubOf(tool)]), THEME_TITLE[tool.theme], entry.profile].filter(Boolean).join(' · ');
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${tool.label}, ${where}`} onPress={onPress} testID={`tool-search-result-${tool.key}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingHorizontal: spacing.xs, paddingVertical: 6, borderRadius: radius.md,
        backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' })}>
      <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold">{tool.label}</Text>
        <Text variant="caption" muted numberOfLines={1}>{where}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}
