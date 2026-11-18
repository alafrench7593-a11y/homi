/**
 * Onglet « hub » HOMI (Moi, Enfant / Grossesse, Famille) : construit à partir du CATALOGUE CENTRAL des outils
 * (src/lib/journeys/tools.ts), jamais d'une liste écrite à la main. Chaque outil y a le même identifiant, le même nom,
 * la même description, le même pictogramme, la même destination, la même règle d'accès et le même favori que dans
 * « Mes outils » : il est rendu par `ToolLinks` (rangée `ToolRow`).
 *
 * Ordre (lecture de haut en bas, d'une main) :
 *  1. profil affiché : rangée d'avatars (`ProfileSwitcher`) ; glisser passe au profil voisin ;
 *  2. Urgences — EN TÊTE, rouge d'alerte, ouverture immédiate ; recherche d'outil (tous les profils) ;
 *  3. « Ouverts récemment » et « Mes favoris » de cet onglet, pour le profil affiché ;
 *  4. une sélection PAR CATÉGORIE (4 outils au plus : les plus pertinents pour le profil), chacune terminée par un
 *     accès NOMMÉ à la catégorie complète (« Tous les outils de sommeil », « Explorer les outils de santé »…) qui
 *     ouvre `/tools/<catégorie>`. Plus de regroupement par les 18 thèmes techniques, plus de liste repliée,
 *     plus d'accès direct qui double un outil listé juste en dessous ;
 *  5. si le profil affiché n'a rien ici (onglet Enfant vu depuis « Moi ») : la sélection des autres profils du foyer ;
 *  6. « Mes outils » en bas, à portée de pouce. La Communauté s'ouvre par le bouton en haut à droite de l'en-tête.
 * `categories` / `excludeCategories` : quand l'onglet Enfant devient « Grossesse » (grossesse sans enfant), il
 * affiche les outils de la grossesse et l'onglet Moi ne les répète pas (une seule destination par outil).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Cascade } from '@/motion';
import { EmptyState, ErrorView } from '@/components/States';
import { ToolRowsSkeleton } from '@/features/toolHub/ToolRow';
import { Button, Text } from '@/components/ui';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { useToolHub } from '@/features/toolHub/useToolHub';
import { useProfile } from '@/lib/data/hooks';
import { useToolStatuses } from '@/lib/data/hooks-tools';
import { categoryTitle, statusKeyFor, type CatalogTool } from '@/lib/domain/toolCatalog';
import type { ToolShelf } from '@/lib/journeys/tools';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { hubSelection, hubTools, type HubKey } from './hubMap';
import { UrgentRow } from './HubList';
import { ProfileSwipe, ProfileSwitcher, useActiveProfileKey } from '@/components/ProfileSwitcher';
import { ProfileStage } from '@/components/profileTransition';
import { ToolSearchButton } from './ToolSearch';

const MAX_W = 720;
/** Récents et favoris montrés en tête d'un onglet. */
const RECENT_MAX = 3;

const TITLE: Record<HubKey, { title: TKey; sub: TKey }> = {
  health: { title: 'nav.hub.me.title', sub: 'nav.hub.me.sub' },
  baby: { title: 'nav.hub.child.title', sub: 'nav.hub.child.sub' },
  family: { title: 'nav.hub.family.title', sub: 'nav.hub.family.sub' },
};

export interface HubScreenProps {
  hub: HubKey;
  /** Identifiant des testID (défaut : `hub`) : l'onglet « Grossesse » affiche le hub Moi sous l'identifiant `baby`. */
  id?: string;
  /** Ne garder que ces catégories (onglet « Grossesse »). */
  categories?: ToolShelf[];
  /** Catégories déjà montrées par un autre onglet. */
  excludeCategories?: ToolShelf[];
  title?: TKey;
  subtitle?: TKey;
}

export function HubScreen({ hub, id = hub, categories, excludeCategories, title, subtitle }: HubScreenProps) {
  const profileQ = useProfile();
  const profileKey = useActiveProfileKey();
  const th = useToolHub();
  const { scope, catalog, byProfile, favSet, recentIds } = th;
  const childId = scope.childId ?? (scope.scope === 'postpartum' ? scope.babyId : null);
  const { statuses } = useToolStatuses(childId);
  const keep = useMemo(() => {
    const only = categories ? new Set<string>(categories) : null;
    const not = new Set<string>(excludeCategories ?? []);
    return (x: CatalogTool) => (!only || only.has(x.category)) && !not.has(x.category);
  }, [categories, excludeCategories]);
  const tools = useMemo(() => hubTools(catalog, hub, scope.scope).filter(keep), [catalog, hub, scope.scope, keep]);
  const urgent = useMemo(() => tools.filter((x) => x.urgent), [tools]);
  const groups = useMemo(() => hubSelection(tools, hub, scope.scope), [tools, hub, scope.scope]);
  const here = useMemo(() => new Set(tools.filter((x) => !x.urgent).map((x) => x.id)), [tools]);
  const favIds = useMemo(() => [...favSet].filter((x) => here.has(x)), [favSet, here]);
  const recents = useMemo(() => recentIds.filter((x) => here.has(x) && !favSet.has(x)).slice(0, RECENT_MAX), [recentIds, here, favSet]);
  // Profil affiché sans outil ici (onglet Enfant vu depuis « Moi », onglet Grossesse vu depuis un enfant) : les autres profils
  const others = useMemo(() => (groups.length ? [] : byProfile.map((p) => ({ ...p, groups: hubSelection(hubTools(p.tools, hub, p.ctx.scope).filter(keep), hub, p.ctx.scope) })).filter((p) => p.groups.length)),
    [groups.length, byProfile, hub, keep]);

  const status = useMemo(() => {
    const out: Record<string, string> = {};
    for (const x of tools) { const k = statusKeyFor(x); const st = k ? statuses[k] : undefined; if (st) out[x.id] = st.text; }
    return out;
  }, [tools, statuses]);

  return (
    <Screen account title={tr(title ?? TITLE[hub].title)} subtitle={tr(subtitle ?? TITLE[hub].sub)} tool={false} bottomInset={TAB_SCREEN_INSET} contentStyle={{ alignSelf: 'center', width: '100%', maxWidth: MAX_W }}>
      {/* Profil affiché : la même rangée d'avatars que sur Aujourd'hui, avec l'indicateur de pages */}
      <ProfileSwitcher pager testID={`hub-${id}-profiles`} />
      <ProfileSwipe>
      <ProfileStage profileKey={profileKey}>
      <View testID={`hub-${id}`} style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          {urgent.map((u) => <UrgentRow key={u.id} tool={u} />)}
          <ToolSearchButton testID={`hub-${id}-search`} />
        </View>

        {recents.length ? <Cascade index={1}><ToolLinks ids={recents} title={tr('th.ui.recents')} status={status} testID={`hub-${id}-recents`} /></Cascade> : null}
        {favIds.length ? <Cascade index={1}><ToolLinks ids={favIds} title={tr('th.ui.favs')} status={status} testID={`hub-${id}-favs`} /></Cascade> : null}

        {profileQ.isLoading && !profileQ.data ? <ToolRowsSkeleton rows={4} testID={`hub-${id}-skeleton`} /> : profileQ.isError && !profileQ.data ? (
          <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('u3.tools.errTools')} />
        ) : !groups.length && !others.length ? (
          <EmptyState icon="compass" title={tr('nav.hub.empty')} body={tr('nav.hub.emptyB')} action={{ label: tr('pj.editJourney'), onPress: () => router.push('/journeys') }} />
        ) : groups.map((g, gi) => (
          <Cascade key={g.category} index={2 + gi}>
            <ToolLinks ids={g.items.map((x) => x.id)} title={categoryTitle(g.category)} allOf={g.category} status={status} testID={`hub-group-${g.category}`} />
          </Cascade>
        ))}

        {others.length ? (
          <View testID={`hub-${id}-others`} style={{ gap: spacing.lg }}>
            <View style={{ gap: 2 }}>
              <Text variant="heading" accessibilityRole="header">{tr('u3.tools.others')}</Text>
              <Text variant="small" muted>{tr('u3.tools.othersB')}</Text>
            </View>
            {others.map((o) => (
              <ToolLinks key={o.key} ids={o.groups.flatMap((g) => g.items.slice(0, 2).map((x) => x.id))} subject={o.subject} title={o.title} profileInTitle
                allOf={o.groups.map((g) => g.category)} testID={`hub-${id}-other-${o.key}`} />
            ))}
          </View>
        ) : null}

        {/* En bas, à portée de pouce : tous les outils */}
        <Button label={tr('pj.allTools')} icon="grid" variant="secondary" onPress={() => router.push('/tools')} full testID={`hub-${id}-all-tools`} />
      </View>
      </ProfileStage>
      </ProfileSwipe>
    </Screen>
  );
}
