/**
 * « Tous mes outils » : chaque outil réel, rangé par catégorie (alimentation, sommeil, changes…),
 * avec recherche, filtres, favoris et raccourcis. Les cartes affichent un état utile tiré des vraies
 * données (dernier biberon, relais de cette nuit…), jamais une valeur inventée.
 * Les urgences restent visibles en haut, sans animation.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { ToolCard, ToolShortcut } from '@/components/ToolCard';
import { QuickAddGrid, TAB_SCREEN_INSET } from '@/components/Dock';
import { glyphColor, tint, ToolGlyph } from '@/components/ToolGlyph';
import { Button, Chip, Field, haptic, Icon, Text } from '@/components/ui';
import { useProfile } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { useOtherProfileTools } from '@/lib/data/hooks-alltools';
import { useActiveSubject } from '@/lib/data/hooks';
import { ProfileSwitcher } from '@/components/Family';
import { useToolStatuses } from '@/lib/data/hooks-tools';
import { favoriteTools, groupByTheme, searchTools, statusKeyFor, THEMES, toggleFavorite, toolCatalog, type CatalogTool, type ToolTheme } from '@/lib/domain/toolCatalog';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

const GAP = spacing.sm;
/** Largeur utile maximale (tablette, ordinateur) : la grille reste lisible et centrée. */
const MAX_W = 1080;

export default function Tools() {
  const t = useTheme();
  const toast = useToast();
  const { width: winW } = useWindowDimensions();
  const profileQ = useProfile();
  const { data: profile } = profileQ;
  // Registre central : seuls les outils autorisés pour le profil affiché (sélecteur) et son parcours
  const scope = useScope();
  const childId = scope.childId ?? (scope.scope === 'postpartum' ? scope.babyId : null);
  const catalog = useMemo(() => toolCatalog(scope), [scope]);
  const { statuses } = useToolStatuses(childId);
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const filter = useUiStore((s) => s.toolFilter);
  const setFilter = useUiStore((s) => s.setToolFilter);
  const [q, setQ] = useState('');
  // Mode simple : quelques outils par catégorie, « Voir plus » pour le reste
  const simple = useUiStore((s) => s.simpleMode);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const PREVIEW = 4;
  const limited = (key: string, n: number) => simple && !q && !open[key] && n > PREVIEW;

  const favs = useMemo(() => favoriteTools(catalog, favIds), [catalog, favIds]);
  const present = useMemo(() => new Set(catalog.map((x) => x.theme)), [catalog]);
  const activeFilter = filter === 'fav' || filter === 'all' || present.has(filter as ToolTheme) ? filter : 'all';
  const visible = useMemo(() => {
    let list = searchTools(catalog, q);
    if (activeFilter === 'fav') list = favoriteTools(list, favIds);
    else if (activeFilter !== 'all') list = list.filter((x) => x.theme === activeFilter);
    return list;
  }, [catalog, q, activeFilter, favIds]);
  // Favoris : pas d'en-tête « Raccourcis » vide quand seuls des outils d'autres profils sont en favori
  const groups = useMemo(() => (activeFilter === 'fav' ? (visible.length ? [{ key: 'fav' as const, title: tr('u3.tools.shortcuts'), short: '', items: visible }] : []) : groupByTheme(visible)), [visible, activeFilter]);
  const urgent = catalog.find((x) => x.urgent);
  // Tous les outils restent visibles : ceux des autres profils (chaque enfant, grossesse, moi) sont listés ensuite
  const { setSubject } = useActiveSubject();
  const others = useOtherProfileTools(catalog);
  const otherGroups = useMemo(() => others.map((o) => {
    let list = searchTools(o.tools, q);
    if (activeFilter === 'fav') list = favoriteTools(list, favIds);
    else if (activeFilter !== 'all') list = list.filter((x) => x.theme === activeFilter);
    return { ...o, tools: list };
  }).filter((o) => o.tools.length), [others, q, activeFilter, favIds]);
  // Compteur de la puce « Favoris » : aussi les favoris pris dans les outils des autres profils (affichés par ce filtre)
  // Favoris pris dans les outils des autres profils : aussi dans « Mes raccourcis » (ouverture sur le bon profil)
  const otherFavs = useMemo(() => {
    const seen = new Set(favs.map((x) => x.id));
    return others.flatMap((o) => favoriteTools(o.tools, favIds).filter((x) => !seen.has(x.id) && (seen.add(x.id), true)).map((tool) => ({ tool, o })));
  }, [others, favIds, favs]);
  const favCount = useMemo(() => favs.length + others.reduce((n, o) => n + favoriteTools(o.tools, favIds).length, 0), [favs, others, favIds]);

  // grille : 2 colonnes sur téléphone, 3 sur tablette, 4 sur grand écran ; largeur MESURÉE du contenu
  // (l'application peut être affichée dans un cadre plus étroit que la fenêtre)
  const [measured, setMeasured] = useState(0);
  const inner = measured || Math.min(winW, MAX_W) - spacing.lg * 2;
  const cols = inner >= 860 ? 4 : inner >= 560 ? 3 : 2;
  const cardW = Math.floor((inner - GAP * (cols - 1)) / cols);

  function toggleFav(tool: CatalogTool) {
    const on = !favIds.includes(tool.id);
    setFavIds(toggleFavorite(favIds, tool.id));
    toast(on ? tr('u3.tools.favAdd', { label: tool.label }) : tr('u3.tools.favDel', { label: tool.label }));
  }
  const statusOf = (tool: CatalogTool) => { const k = statusKeyFor(tool); return k ? statuses[k] : undefined; };

  return (
    <Screen account title={tr('screen.tools.title')} subtitle={tr('screen.tools.sub')} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      <View onLayout={(e) => setMeasured(Math.floor(e.nativeEvent.layout.width))} style={{ height: 0, alignSelf: 'stretch', marginBottom: -spacing.md }} />
      {urgent ? <UrgentStrip tool={urgent} /> : null}
      {/* Les outils affichés dépendent du profil choisi ici (grossesse, post-partum, chaque enfant, famille, moi) */}
      <View testID="tools-scope" accessibilityLabel={tr('pj.tools.scopeA11y')} style={{ gap: 4 }}>
        <Text variant="caption" muted>{tr('pj.tools.for')}</Text>
        <ProfileSwitcher />
      </View>
      {/* Ajout rapide (anciennement derrière le bouton « + ») : toujours à portée */}
      {!q && activeFilter === 'all' && !simple ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">{tr('u3.tools.addNow')}</Text>
          <QuickAddGrid compact />
        </View>
      ) : null}

      <Field label={tr('u3.tools.search')} value={q} onChangeText={setQ} placeholder={tr('u3.tools.searchPh')} returnKeyType="search" autoCorrect={false} accessibilityLabel={tr('u3.tools.search')} />

      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }} style={{ marginHorizontal: -2, flexGrow: 0 }} accessibilityRole="tablist" accessibilityLabel={tr('u3.tools.filterTools')}>
        <Chip label={tr('u3.tools.all')} selected={activeFilter === 'all'} onPress={() => { haptic('selection'); setFilter('all'); }} />
        <Chip label={`${tr('u3.tools.favs')}${favCount ? ` (${favCount})` : ''}`} icon="star" selected={activeFilter === 'fav'} onPress={() => { haptic('selection'); setFilter('fav'); }} />
        {THEMES.filter((th) => present.has(th.key)).map((th) => (
          <Chip key={th.key} label={th.short} selected={activeFilter === th.key} onPress={() => { haptic('selection'); setFilter(activeFilter === th.key ? 'all' : th.key); }} accessibilityLabel={tr('u3.tools.filter', { title: th.title })} />
        ))}
      </ScrollView>

      {activeFilter === 'all' && !q && (favs.length || otherFavs.length) ? (
        <Appear kind="soft" delay={0.05} style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">{tr('u3.tools.shortcuts')}</Text>
          <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
            {favs.map((tool) => <ToolShortcut key={tool.id} tool={tool} status={statusOf(tool)} />)}
            {otherFavs.map(({ tool, o }) => <ToolShortcut key={`${o.key}-${tool.id}`} tool={tool} beforeOpen={() => setSubject(o.subject)} />)}
          </ScrollView>
        </Appear>
      ) : null}

      {profileQ.isLoading && !profile ? <Skeleton kind="card" rows={4} /> : profileQ.isError && !profile ? (
        <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
      ) : !visible.length && !otherGroups.length ? (
        activeFilter === 'fav' && !q
          ? <EmptyState icon="star" title={tr('u3.tools.noShortcut')} body={tr('u3.tools.noShortcutB')} />
          : <EmptyState icon="search" title={tr('u3.tools.noTool')} body={tr('u3.tools.noToolB')} action={{ label: tr('u3.tools.showAll'), onPress: () => { setQ(''); setFilter('all'); } }} />
      ) : groups.map((g, gi) => (
        <Appear key={g.key} kind="soft" delay={0.05 + Math.min(gi, 6) * 0.06} style={{ gap: spacing.sm }}>
          <SectionHead theme={g.key === 'fav' ? null : g.key} title={g.title} count={g.items.length} index={gi} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {(limited(g.key, g.items.length) ? g.items.slice(0, PREVIEW) : g.items).map((tool) => (
              <ToolCard key={tool.id} tool={tool} width={cardW} status={statusOf(tool)} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} />
            ))}
          </View>
          {simple && !q && g.items.length > PREVIEW ? (
            <Button label={open[g.key] ? tr('pj.tools.less') : tr('pj.tools.more', { count: g.items.length - PREVIEW })} variant="ghost" size="sm" icon={open[g.key] ? 'chevron-up' : 'chevron-down'} style={{ alignSelf: 'flex-start' }} testID={`tools-more-${g.key}`}
              onPress={() => setOpen({ ...open, [g.key]: !open[g.key] })} />
          ) : null}
        </Appear>
      ))}
      {otherGroups.length && simple && !q && !open.__others ? (
        <Button label={tr('pj.tools.otherShow')} icon="users" variant="secondary" onPress={() => setOpen({ ...open, __others: true })} testID="tools-other-show" full />
      ) : null}
      {otherGroups.length && (!simple || q || open.__others) ? (
        <View testID="tools-other-profiles" style={{ gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ gap: 2 }}>
            <Text variant="title" accessibilityRole="header">{tr('u3.tools.others')}</Text>
            <Text variant="small" muted>{tr('u3.tools.othersB')}</Text>
          </View>
          {otherGroups.map((o) => (
            <View key={o.key} style={{ gap: spacing.sm }} testID={`tools-for-${o.key}`}>
              <Text variant="heading" accessibilityRole="header">{o.title}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {o.tools.map((tool) => (
                  <ToolCard key={`${o.key}-${tool.id}`} tool={tool} width={cardW} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} beforeOpen={() => setSubject(o.subject)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      <Button label={tr('pj.editJourney')} variant="secondary" icon="refresh-cw" onPress={() => router.push('/journeys')} full />
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
      <Text variant="caption" muted accessibilityLabel={tr('u3.tools.count', { count })}>{count}</Text>
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
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('u3.tools.urgA11y')}
      onPress={() => router.push('/emergency')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: pressed ? tint(c, 0.2) : t.colors.dangerSoft, borderWidth: 1, borderColor: tint(c, 0.35) })}
    >
      <Icon name="life-buoy" size={20} color={c} />
      <Text weight="bold" style={{ flex: 1, color: c }}>{tr('u3.tools.urg')}</Text>
      <Icon name="chevron-right" size={18} color={c} />
    </Tappable>
  );
}

