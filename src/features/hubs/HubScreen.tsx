/**
 * Onglet « hub » HOMI (Moi, Enfant / Grossesse, Famille) : construit à partir du catalogue des outils, jamais d'une
 * liste écrite à la main. Refonte du 17/11/2026 : le sélecteur de profil universel (rangée d'avatars + indicateur de
 * pages) remplace les capsules ; glisser à gauche / à droite passe au profil voisin (d'un enfant à l'autre).
 * `themes` / `excludeThemes` : quand l'onglet Enfant devient « Grossesse » (grossesse sans enfant), il affiche les
 * outils de la grossesse et l'onglet Moi ne les répète pas (une seule destination par outil).
 *
 * Ordre (lecture de haut en bas, d'une main) :
 *  1. Urgences — EN TÊTE, rouge d'alerte, icône + libellé, ouverture immédiate ;
 *  2. recherche d'outil (tous les profils) ;
 *  3. profil affiché : rangée d'avatars « Moi · Grossesse · enfants · Famille » (`ProfileSwitcher`) ;
 *  4. accès directs (anciens onglets Questions, Suivi, Agenda ; courses, stocks) ;
 *  5. favoris ;
 *  6. outils REGROUPÉS PAR USAGE (thèmes du hub) en listes à séparateurs : 4 rangées, puis « Voir les N autres »
 *     dans le même groupe (pas de mur) ;
 *  7. outils des autres profils (dépliables) ;
 *  8. « Ailleurs dans HOMI » (communauté du profil) et « Tous mes outils » en bas, à portée de pouce.
 * Plus de grille de cartes, plus de compteur par thème (badge redondant), plus d'élévation à l'ouverture.
 *
 * Mouvement : les groupes apparaissent en cascade courte (`Cascade`, une fois) ; rien ne bouge ensuite. Réduire les
 * animations / économie d'énergie : tout est en place d'emblée.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Cascade } from '@/motion';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Text } from '@/components/ui';
import { useProfile } from '@/lib/data/hooks';
import { useToolStatuses } from '@/lib/data/hooks-tools';
import { favoriteTools, statusKeyFor, THEME_TITLE, toggleFavorite, type CatalogTool, type ToolTheme } from '@/lib/domain/toolCatalog';
import { SPACE_FOR_SCOPE } from '@/lib/journeys/tools';
import { useUiStore } from '@/lib/store';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { HUB_ENTRIES, hubGroups, hubTools, type HubKey } from './hubMap';
import { HubGroup, HubRow, HubToolRow, UrgentRow } from './HubList';
import { ProfileSwipe, ProfileSwitcher } from '@/components/ProfileSwitcher';
import { ToolSearchButton, useAllToolEntries, useOpenEntry, type ToolEntry } from './ToolSearch';

const MAX_W = 720;
const PREVIEW = 4;

const TITLE: Record<HubKey, { title: TKey; sub: TKey }> = {
  health: { title: 'nav.hub.me.title', sub: 'nav.hub.me.sub' },
  baby: { title: 'nav.hub.child.title', sub: 'nav.hub.child.sub' },
  family: { title: 'nav.hub.family.title', sub: 'nav.hub.family.sub' },
};

export interface HubScreenProps {
  hub: HubKey;
  /** Identifiant des testID (défaut : `hub`) : l'onglet « Grossesse » affiche le hub Santé sous l'identifiant `baby`. */
  id?: string;
  /** Ne garder que ces thèmes (onglet « Grossesse »). */
  themes?: ToolTheme[];
  /** Thèmes déjà montrés par un autre onglet. */
  excludeThemes?: ToolTheme[];
  title?: TKey;
  subtitle?: TKey;
}

export function HubScreen({ hub, id = hub, themes, excludeThemes, title, subtitle }: HubScreenProps) {
  const toast = useToast();
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
  const keep = useMemo(() => {
    const only = themes ? new Set(themes) : null;
    const not = new Set(excludeThemes ?? []);
    return (x: CatalogTool) => (!only || only.has(x.theme)) && !not.has(x.theme);
  }, [themes, excludeThemes]);
  const tools = useMemo(() => hubTools(catalog, hub).filter(keep), [catalog, hub, keep]);
  const urgent = useMemo(() => tools.filter((x) => x.urgent), [tools]);
  const groups = useMemo(() => hubGroups(tools.filter((x) => !x.urgent), hub), [tools, hub]);
  const favs = useMemo(() => favoriteTools(tools, favIds).filter((x) => !x.urgent), [tools, favIds]);
  const otherGroups = useMemo(() => others.map((o) => ({ ...o, tools: hubTools(o.tools, hub).filter(keep) })).filter((o) => o.tools.length), [others, hub, keep]);
  // Vu depuis un profil qui n'a pas d'outil ici (onglet Enfant depuis « Moi », onglet Grossesse depuis un autre profil) :
  // les outils des autres profils sont dépliés d'office
  const othersOpen = open.__others ?? ((hub === 'baby' && !kidShown) || (!!themes && !groups.length));

  const statusOf = (tool: CatalogTool) => { const k = statusKeyFor(tool); return k ? statuses[k] : undefined; };
  function toggleFav(tool: CatalogTool) {
    const on = !favIds.includes(tool.id);
    setFavIds(toggleFavorite(favIds, tool.id));
    toast(on ? tr('u3.tools.favAdd', { label: tool.label }) : tr('u3.tools.favDel', { label: tool.label }));
  }
  const entry = (tool: CatalogTool, o?: (typeof others)[number]): ToolEntry => ({ tool, subject: o?.subject, profile: o?.title });
  const space = SPACE_FOR_SCOPE[scope.scope];
  const row = (tool: CatalogTool, o?: (typeof others)[number]) => (
    <HubToolRow key={`${o?.key ?? ''}-${tool.id}`} tool={tool} status={o ? undefined : statusOf(tool)} favorite={favIds.includes(tool.id)} onToggleFavorite={toggleFav} beforeOpen={() => onOpen(entry(tool, o))} />
  );

  return (
    <Screen account title={tr(title ?? TITLE[hub].title)} subtitle={tr(subtitle ?? TITLE[hub].sub)} tool={false} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      {/* Profil affiché : la même rangée d'avatars que sur Aujourd'hui, avec l'indicateur de pages */}
      <ProfileSwitcher pager testID={`hub-${id}-profiles`} />
      <ProfileSwipe>
      <View testID={`hub-${id}`} style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          {urgent.map((u) => <UrgentRow key={u.id} tool={u} />)}
          <ToolSearchButton testID={`hub-${id}-search`} />
        </View>

        {/* Accès directs : les pages des anciens onglets (Questions, Suivi, Agenda) et le quotidien du foyer */}
        {themes ? null : (
          <HubGroup testID={`hub-${id}-entries`}>
            {HUB_ENTRIES[hub].map((e) => <HubRow key={e.href} testID={e.testID} icon={e.icon} title={tr(e.title)} subtitle={tr(e.sub)} onPress={() => router.push(e.href as never)} />)}
          </HubGroup>
        )}

        {favs.length ? (
          <Cascade index={1}>
            <HubGroup title={tr('nav.hub.favs')} testID={`hub-${id}-favs`}>{favs.map((tool) => row(tool))}</HubGroup>
          </Cascade>
        ) : null}

        {profileQ.isLoading && !profileQ.data ? <Skeleton kind="card" rows={3} /> : profileQ.isError && !profileQ.data ? (
          <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
        ) : !groups.length && !otherGroups.length ? (
          <EmptyState icon="compass" title={tr('nav.hub.empty')} body={tr('nav.hub.emptyB')} action={{ label: tr('pj.editJourney'), onPress: () => router.push('/journeys') }} />
        ) : groups.map((g, gi) => {
          const extra = g.items.length - PREVIEW;
          const shown = extra > 0 && !open[g.theme] ? g.items.slice(0, PREVIEW) : g.items;
          return (
            <Cascade key={g.theme} index={2 + gi}>
              <HubGroup title={THEME_TITLE[g.theme]} testID={`hub-group-${g.theme}`}>
                {shown.map((tool) => row(tool))}
                {extra > 0 ? (
                  <HubRow key="__more" testID={`hub-more-${g.theme}`} icon={open[g.theme] ? 'chevron-up' : 'more-horizontal'} trailing={open[g.theme] ? 'chevron-up' : 'chevron-down'}
                    title={open[g.theme] ? tr('pj.tools.less') : tr('pj.tools.more', { count: extra })} onPress={() => setOpen({ ...open, [g.theme]: !open[g.theme] })} />
                ) : null}
              </HubGroup>
            </Cascade>
          );
        })}

        {otherGroups.length ? (
          othersOpen ? (
            <View testID={`hub-${id}-others`} style={{ gap: spacing.md }}>
              <View style={{ gap: 2, paddingHorizontal: spacing.xxs }}>
                <Text variant="heading" accessibilityRole="header">{tr('u3.tools.others')}</Text>
                <Text variant="small" muted>{tr('u3.tools.othersB')}</Text>
              </View>
              {otherGroups.map((o) => <HubGroup key={o.key} title={o.title}>{o.tools.map((tool) => row(tool, o))}</HubGroup>)}
            </View>
          ) : <Button label={tr('pj.tools.otherShow')} icon="users" variant="secondary" onPress={() => setOpen({ ...open, __others: true })} testID={`hub-${id}-others-show`} full />
        ) : null}

        {/* En bas, à portée de pouce : la communauté du profil (jamais cachée) et tous les outils */}
        <View style={{ gap: spacing.sm }}>
          <HubGroup title={tr('h5.hub.elsewhere')}>
            <HubRow testID={`hub-${id}-community`} icon="message-circle" title={tr('nav.hub.community')} subtitle={tr('nav.hub.communitySub')}
              onPress={() => router.push((space ? `/community?space=${space}` : '/community') as never)} />
          </HubGroup>
          <Button label={tr('pj.allTools')} icon="grid" variant="secondary" onPress={() => router.push('/tools')} full testID={`hub-${id}-all-tools`} />
        </View>
      </View>
      </ProfileSwipe>
    </Screen>
  );
}
