/**
 * Onglet « hub » HOMI (Santé, Bébé, Famille) : construit à partir du catalogue des outils, jamais d'une liste
 * écrite à la main. Ordre : recherche universelle · profil affiché · accès directs (anciens onglets Questions,
 * Suivi, Agenda) · favoris du hub · outils par thème (4 par thème, « Voir plus » pour le reste : pas de mur de
 * boutons) · outils des autres profils · communauté contextuelle · tous les outils.
 * Urgences en tête, sans animation.
 *
 * Mouvement (src/motion) : les sections apparaissent en cascade (`Cascade`, +45 ms par rang, plafond 360 ms) ;
 * accès directs et rappel communauté s'élèvent avant d'ouvrir leur page (`LiftCard`) ; cartes d'outils : voir
 * ToolCard. Réduire les animations / économie d'énergie : tout est en place d'emblée ; nuit : fondus courts.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Cascade, LiftCard } from '@/motion';
import { Tappable } from '@/components/Tappable';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { ToolCard, ToolShortcut } from '@/components/ToolCard';
import { glyphColor, tint, ToolGlyph } from '@/components/ToolGlyph';
import { ProfileSwitcher } from '@/components/Family';
import { Button, Icon, Text } from '@/components/ui';
import { useProfile } from '@/lib/data/hooks';
import { useToolStatuses } from '@/lib/data/hooks-tools';
import { favoriteTools, statusKeyFor, THEME_TITLE, toggleFavorite, type CatalogTool, type ToolTheme } from '@/lib/domain/toolCatalog';
import { SPACE_FOR_SCOPE } from '@/lib/journeys/tools';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { lines, palette, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { HUB_ENTRIES, hubGroups, hubTools, THEME_ICON, type HubKey } from './hubMap';
import { ToolSearchButton, useAllToolEntries, useOpenEntry, type ToolEntry } from './ToolSearch';

const GAP = spacing.sm;
const MAX_W = 1080;
const PREVIEW = 4;

const TITLE: Record<HubKey, { title: TKey; sub: TKey }> = {
  health: { title: 'nav.hub.health.title', sub: 'nav.hub.health.sub' },
  baby: { title: 'nav.hub.baby.title', sub: 'nav.hub.baby.sub' },
  family: { title: 'nav.hub.family.title', sub: 'nav.hub.family.sub' },
};

export function HubScreen({ hub }: { hub: HubKey }) {
  const t = useTheme();
  const toast = useToast();
  const { width: winW } = useWindowDimensions();
  const profileQ = useProfile();
  const { scope, catalog, others } = useAllToolEntries();
  const childId = scope.childId ?? (scope.scope === 'postpartum' ? scope.babyId : null);
  const { statuses } = useToolStatuses(childId);
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const onOpen = useOpenEntry();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // Onglet Bébé vu depuis un profil adulte (grossesse, moi, famille) : les outils des enfants sont dépliés d'office
  const kidShown = scope.scope === 'baby' || scope.scope === 'child';
  const othersOpen = open.__others ?? (hub === 'baby' && !kidShown);

  const tools = useMemo(() => hubTools(catalog, hub), [catalog, hub]);
  const urgent = useMemo(() => tools.filter((x) => x.urgent), [tools]);
  const groups = useMemo(() => hubGroups(tools.filter((x) => !x.urgent), hub), [tools, hub]);
  const favs = useMemo(() => favoriteTools(tools, favIds).filter((x) => !x.urgent), [tools, favIds]);
  const otherGroups = useMemo(() => others.map((o) => ({ ...o, tools: hubTools(o.tools, hub) })).filter((o) => o.tools.length), [others, hub]);

  const [measured, setMeasured] = useState(0);
  const inner = measured || Math.min(winW, MAX_W) - spacing.lg * 2;
  const cols = inner >= 860 ? 4 : inner >= 560 ? 3 : 2;
  const cardW = Math.floor((inner - GAP * (cols - 1)) / cols);

  const statusOf = (tool: CatalogTool) => { const k = statusKeyFor(tool); return k ? statuses[k] : undefined; };
  function toggleFav(tool: CatalogTool) {
    const on = !favIds.includes(tool.id);
    setFavIds(toggleFavorite(favIds, tool.id));
    toast(on ? tr('u3.tools.favAdd', { label: tool.label }) : tr('u3.tools.favDel', { label: tool.label }));
  }
  const entry = (tool: CatalogTool, o?: (typeof others)[number]): ToolEntry => ({ tool, subject: o?.subject, profile: o?.title });
  const space = SPACE_FOR_SCOPE[scope.scope];

  return (
    <Screen account title={tr(TITLE[hub].title)} subtitle={tr(TITLE[hub].sub)} tool={false} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      <View onLayout={(e) => setMeasured(Math.floor(e.nativeEvent.layout.width))} style={{ height: 0, alignSelf: 'stretch', marginBottom: -spacing.md }} />
      <View testID={`hub-${hub}`} style={{ gap: spacing.md }}>
        {urgent.map((u) => <UrgentStrip key={u.id} tool={u} />)}
        <ToolSearchButton testID={`hub-${hub}-search`} />
        <View accessibilityLabel={tr('pj.tools.scopeA11y')} style={{ gap: 4 }}>
          <Text variant="caption" muted>{tr('pj.tools.for')}</Text>
          <ProfileSwitcher />
        </View>

        {/* Accès directs : les pages des anciens onglets (Questions, Suivi, Agenda) */}
        {HUB_ENTRIES[hub].map((e, i) => (
          <Cascade key={e.href} index={1 + i}>
          <LiftCard testID={e.testID} accessibilityLabel={`${tr(e.title)}. ${tr(e.sub)}`} onOpen={() => router.push(e.href as never)} radius={radius.lg} shadowColor={palette.night}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg,
              backgroundColor: tint(t.colors.primary, t.isDark ? 0.12 : 0.08), borderWidth: 1, borderColor: tint(t.colors.primary, 0.22) }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary }}>
              <Icon name={e.icon} size={20} color={t.colors.primaryText} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold">{tr(e.title)}</Text>
              <Text variant="small" muted>{tr(e.sub)}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.colors.primary} />
          </LiftCard>
          </Cascade>
        ))}

        {favs.length ? (
          <Cascade index={2} style={{ gap: spacing.xs }}>
            <Text variant="heading" accessibilityRole="header">{tr('nav.hub.favs')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
              {favs.map((tool) => <ToolShortcut key={tool.id} tool={tool} status={statusOf(tool)} beforeOpen={() => onOpen(entry(tool))} />)}
            </ScrollView>
          </Cascade>
        ) : null}

        {profileQ.isLoading && !profileQ.data ? <Skeleton kind="card" rows={3} /> : profileQ.isError && !profileQ.data ? (
          <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
        ) : !groups.length && !otherGroups.length ? (
          <EmptyState icon="compass" title={tr('nav.hub.empty')} body={tr('nav.hub.emptyB')} action={{ label: tr('pj.editJourney'), onPress: () => router.push('/journeys') }} />
        ) : groups.map((g, gi) => {
          const more = g.items.length > PREVIEW && !open[g.theme];
          return (
            <Cascade key={g.theme} index={3 + gi} style={{ gap: spacing.sm }}>
              <SectionHead theme={g.theme} count={g.items.length} index={gi} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {(more ? g.items.slice(0, PREVIEW) : g.items).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} width={cardW} status={statusOf(tool)} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} beforeOpen={() => onOpen(entry(tool))} />
                ))}
              </View>
              {g.items.length > PREVIEW ? (
                <Button label={open[g.theme] ? tr('pj.tools.less') : tr('pj.tools.more', { count: g.items.length - PREVIEW })} variant="ghost" size="sm" icon={open[g.theme] ? 'chevron-up' : 'chevron-down'}
                  style={{ alignSelf: 'flex-start' }} testID={`hub-more-${g.theme}`} onPress={() => setOpen({ ...open, [g.theme]: !open[g.theme] })} />
              ) : null}
            </Cascade>
          );
        })}

        {otherGroups.length ? (
          othersOpen ? (
            <View testID={`hub-${hub}-others`} style={{ gap: spacing.md }}>
              <View style={{ gap: 2 }}>
                <Text variant="title" accessibilityRole="header">{tr('u3.tools.others')}</Text>
                <Text variant="small" muted>{tr('u3.tools.othersB')}</Text>
              </View>
              {otherGroups.map((o) => (
                <View key={o.key} style={{ gap: spacing.sm }}>
                  <Text variant="heading" accessibilityRole="header">{o.title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                    {o.tools.map((tool) => (
                      <ToolCard key={`${o.key}-${tool.id}`} tool={tool} width={cardW} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} beforeOpen={() => onOpen(entry(tool, o))} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : <Button label={tr('pj.tools.otherShow')} icon="users" variant="secondary" onPress={() => setOpen({ ...open, __others: true })} testID={`hub-${hub}-others-show`} full />
        ) : null}

        {/* La communauté n'est jamais cachée : rappel contextuel (forum du profil affiché) */}
        <LiftCard testID={`hub-${hub}-community`} accessibilityLabel={`${tr('nav.hub.community')}. ${tr('nav.hub.communitySub')}`}
          onOpen={() => router.push((space ? `/community?space=${space}` : '/community') as never)} radius={radius.lg} shadowColor={palette.night}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, padding: spacing.md, borderRadius: radius.lg,
            backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.isDark ? t.colors.border : lines.light.hairline }}>
          <Icon name="message-circle" size={22} color={t.colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{tr('nav.hub.community')}</Text>
            <Text variant="small" muted>{tr('nav.hub.communitySub')}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </LiftCard>

        <Button label={tr('pj.allTools')} icon="grid" variant="secondary" onPress={() => router.push('/tools')} full testID={`hub-${hub}-all-tools`} />
      </View>
    </Screen>
  );
}

/** En-tête de thème : glyphe animé une fois, titre, nombre d'outils. */
function SectionHead({ theme, count, index }: { theme: ToolTheme; count: number; index: number }) {
  const [play, setPlay] = useState(0);
  React.useEffect(() => { const id = setTimeout(() => setPlay(1), 220 + Math.min(index, 6) * 90); return () => clearTimeout(id); }, [index]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36 }}>
      <ToolGlyph theme={theme} icon={THEME_ICON[theme]} size={32} play={play} />
      <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{THEME_TITLE[theme]}</Text>
      <Text variant="caption" muted accessibilityLabel={tr('u3.tools.count', { count })}>{count}</Text>
    </View>
  );
}

/** Urgences : toujours visibles, immédiates, sans animation. */
function UrgentStrip({ tool }: { tool: CatalogTool }) {
  const t = useTheme();
  const c = glyphColor(t, tool.theme, true);
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={tool.sub ? `${tool.label}. ${tool.sub}` : tool.label} onPress={() => router.push(tool.href as never)} testID={`hub-urgent-${tool.key}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: pressed ? tint(c, 0.2) : t.colors.dangerSoft, borderWidth: 1, borderColor: tint(c, 0.35) })}>
      <Icon name="life-buoy" size={20} color={c} />
      <Text weight="bold" style={{ flex: 1, color: c }}>{tool.label}</Text>
      <Icon name="chevron-right" size={18} color={c} />
    </Tappable>
  );
}
