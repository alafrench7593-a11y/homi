/**
 * « Tous mes outils » : chaque outil réel, rangé par catégorie (alimentation, sommeil, changes…),
 * avec recherche, filtres, favoris et raccourcis. Les cartes affichent un état utile tiré des vraies
 * données (dernier biberon, relais de cette nuit…), jamais une valeur inventée.
 * Les urgences restent visibles en haut, sans animation.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { ToolCard, ToolShortcut } from '@/components/ToolCard';
import { QuickAddGrid } from '@/components/Dock';
import { glyphColor, tint, ToolGlyph } from '@/components/ToolGlyph';
import { Button, Chip, Field, haptic, Icon, Text } from '@/components/ui';
import { useActivePregnancy, useActiveSubject, useChildren, useProfile } from '@/lib/data/hooks';
import { useToolStatuses } from '@/lib/data/hooks-tools';
import { favoriteTools, groupByTheme, searchTools, statusKeyFor, THEMES, toggleFavorite, toolCatalog, type CatalogTool, type ToolTheme } from '@/lib/domain/toolCatalog';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const GAP = spacing.sm;
/** Largeur utile maximale (tablette, ordinateur) : la grille reste lisible et centrée. */
const MAX_W = 1080;

export default function Tools() {
  const t = useTheme();
  const toast = useToast();
  const { width: winW } = useWindowDimensions();
  const profileQ = useProfile();
  const { data: profile } = profileQ;
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const { subject } = useActiveSubject();
  const childId = subject.type === 'child' ? subject.id : children?.[0]?.id;
  const catalog = useMemo(() => toolCatalog({ journeys: profile?.journeys ?? [], hasPregnancy: !!pregnancy, childId, childCount: children?.length ?? 0 }), [profile, pregnancy, childId, children]);
  const { statuses } = useToolStatuses(childId);
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const filter = useUiStore((s) => s.toolFilter);
  const setFilter = useUiStore((s) => s.setToolFilter);
  const [q, setQ] = useState('');

  const favs = useMemo(() => favoriteTools(catalog, favIds), [catalog, favIds]);
  const present = useMemo(() => new Set(catalog.map((x) => x.theme)), [catalog]);
  const activeFilter = filter === 'fav' || filter === 'all' || present.has(filter as ToolTheme) ? filter : 'all';
  const visible = useMemo(() => {
    let list = searchTools(catalog, q);
    if (activeFilter === 'fav') list = favoriteTools(list, favIds);
    else if (activeFilter !== 'all') list = list.filter((x) => x.theme === activeFilter);
    return list;
  }, [catalog, q, activeFilter, favIds]);
  const groups = useMemo(() => (activeFilter === 'fav' ? [{ key: 'fav' as const, title: 'Mes raccourcis', short: '', items: visible }] : groupByTheme(visible)), [visible, activeFilter]);
  const urgent = catalog.find((x) => x.urgent);

  // grille : 2 colonnes sur téléphone, 3 sur tablette, 4 sur grand écran ; largeur MESURÉE du contenu
  // (l'application peut être affichée dans un cadre plus étroit que la fenêtre)
  const [measured, setMeasured] = useState(0);
  const inner = measured || Math.min(winW, MAX_W) - spacing.lg * 2;
  const cols = inner >= 860 ? 4 : inner >= 560 ? 3 : 2;
  const cardW = Math.floor((inner - GAP * (cols - 1)) / cols);

  function toggleFav(tool: CatalogTool) {
    const on = !favIds.includes(tool.id);
    setFavIds(toggleFavorite(favIds, tool.id));
    toast(on ? `« ${tool.label} » ajouté à vos raccourcis.` : `« ${tool.label} » retiré des raccourcis.`);
  }
  const statusOf = (tool: CatalogTool) => { const k = statusKeyFor(tool); return k ? statuses[k] : undefined; };

  return (
    <Screen title="Outils" subtitle="Tous vos outils, rangés par usage. Touchez l’étoile pour garder un raccourci." bottomInset={96} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      <View onLayout={(e) => setMeasured(Math.floor(e.nativeEvent.layout.width))} style={{ height: 0, alignSelf: 'stretch', marginBottom: -spacing.md }} />
      {urgent ? <UrgentStrip tool={urgent} /> : null}
      {/* Ajout rapide (anciennement derrière le bouton « + ») : toujours à portée */}
      {!q && activeFilter === 'all' ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">Ajouter maintenant</Text>
          <QuickAddGrid compact />
        </View>
      ) : null}

      <Field label="Rechercher un outil" value={q} onChangeText={setQ} placeholder="Biberon, relais, vaccins…" returnKeyType="search" autoCorrect={false} accessibilityLabel="Rechercher un outil" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }} style={{ marginHorizontal: -2, flexGrow: 0 }} accessibilityRole="tablist" accessibilityLabel="Filtrer les outils">
        <Chip label="Tous" selected={activeFilter === 'all'} onPress={() => { haptic('selection'); setFilter('all'); }} />
        <Chip label={`Favoris${favs.length ? ` (${favs.length})` : ''}`} icon="star" selected={activeFilter === 'fav'} onPress={() => { haptic('selection'); setFilter('fav'); }} />
        {THEMES.filter((th) => present.has(th.key)).map((th) => (
          <Chip key={th.key} label={th.short} selected={activeFilter === th.key} onPress={() => { haptic('selection'); setFilter(activeFilter === th.key ? 'all' : th.key); }} accessibilityLabel={`Filtrer : ${th.title}`} />
        ))}
      </ScrollView>

      {activeFilter === 'all' && !q && favs.length ? (
        <Appear kind="soft" delay={0.05} style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">Mes raccourcis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
            {favs.map((tool) => <ToolShortcut key={tool.id} tool={tool} status={statusOf(tool)} />)}
          </ScrollView>
        </Appear>
      ) : null}

      {profileQ.isLoading && !profile ? <Skeleton kind="card" rows={4} /> : profileQ.isError && !profile ? (
        <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title="Impossible d’afficher vos outils" />
      ) : !visible.length ? (
        activeFilter === 'fav' && !q
          ? <EmptyState icon="star" title="Aucun raccourci pour l’instant" body="Touchez l’étoile d’un outil pour le retrouver ici et en haut de cette page." />
          : <EmptyState icon="search" title="Aucun outil trouvé" body="Essayez un autre mot, ou retirez le filtre." action={{ label: 'Tout afficher', onPress: () => { setQ(''); setFilter('all'); } }} />
      ) : groups.map((g, gi) => (
        <Appear key={g.key} kind="soft" delay={0.05 + Math.min(gi, 6) * 0.06} style={{ gap: spacing.sm }}>
          <SectionHead theme={g.key === 'fav' ? null : g.key} title={g.title} count={g.items.length} index={gi} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {g.items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} width={cardW} status={statusOf(tool)} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} />
            ))}
          </View>
        </Appear>
      ))}
      <Button label="Changer ou ajouter un parcours" variant="secondary" icon="refresh-cw" onPress={() => router.push('/journeys')} full />
    </Screen>
  );
}

/** En-tête de catégorie : petit glyphe du thème (joue son animation une fois), titre, nombre d'outils. */
function SectionHead({ theme, title, count, index }: { theme: ToolTheme | null; title: string; count: number; index: number }) {
  const t = useTheme();
  const [play, setPlay] = useState(0);
  React.useEffect(() => { const id = setTimeout(() => setPlay(1), 220 + Math.min(index, 6) * 90); return () => clearTimeout(id); }, [index]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36 }}>
      {theme ? <ToolGlyph theme={theme} icon={THEME_ICON[theme]} size={32} play={play} /> : <Icon name="star" size={20} color={t.colors.primary} />}
      <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
      <Text variant="caption" muted accessibilityLabel={`${count} outil${count > 1 ? 's' : ''}`}>{count}</Text>
    </View>
  );
}

const THEME_ICON: Record<ToolTheme, React.ComponentProps<typeof Icon>['name']> = {
  feeding: 'coffee', sleep: 'moon', diapers: 'wind', teeth: 'circle', growth: 'trending-up', health: 'activity', mood: 'smile', pregnancy: 'heart',
  cycle: 'refresh-cw', scanner: 'maximize', calendar: 'calendar', tasks: 'check-square', relay: 'moon', metime: 'sun', prevention: 'feather',
  memories: 'book', reminders: 'bell', resources: 'book-open',
};

/** Urgences : toujours visibles, immédiates, sans animation. */
function UrgentStrip({ tool }: { tool: CatalogTool }) {
  const t = useTheme();
  const c = glyphColor(t, tool.theme, true);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Urgences : 15, 112, 3114. Ouvrir les numéros utiles."
      onPress={() => router.push('/emergency')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: pressed ? tint(c, 0.2) : t.colors.dangerSoft, borderWidth: 1, borderColor: tint(c, 0.35) })}
    >
      <Icon name="life-buoy" size={20} color={c} />
      <Text weight="bold" style={{ flex: 1, color: c }}>Urgences · 15 · 112 · 3114</Text>
      <Icon name="chevron-right" size={18} color={c} />
    </Pressable>
  );
}

