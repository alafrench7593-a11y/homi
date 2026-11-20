/**
 * Sections d'outils de l'accueil (20/11/2026) — modules de la configuration déclarative (homeLayout.ts), réordonnables
 * et masquables comme les autres :
 *  - « Pour toi aujourd'hui » : 6 à 10 outils choisis par le moteur déterministe (src/lib/personalization), chacun
 *    avec sa RAISON en petit ; appui long : épingler (toujours visible) ou « Ne plus me proposer » (jamais recommandé,
 *    rien n'est supprimé, rétablissable dans « Personnaliser ») ;
 *  - « Continuer » : les outils ouverts récemment ;
 *  - « Ton enfant » : les outils de l'enfant sélectionné dans le sélecteur de profil (sinon le plus jeune) ;
 *  - « Explorer les outils » : la recherche universelle et le catalogue complet.
 * « Tes favoris » est le module existant des outils épinglés en favori (PinnedTools).
 */
import React, { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Button, haptic, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { ToolSearchButton } from '@/features/hubs/ToolSearch';
import { ToolTile } from '@/features/toolHub/ToolTile';
import { useToolHub, type ToolEntry } from '@/features/toolHub/useToolHub';
import { useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { reasonText, type Recommendation } from '@/lib/personalization';
import { canonicalToolId } from '@/lib/journeys/tools';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useChildRecommendations, useRecommendations } from './useRecommendations';

function Title({ title, sub, testID }: { title: string; sub?: string; testID?: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.xxs, gap: 2 }} testID={testID}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      {sub ? <Text variant="caption" muted>{sub}</Text> : null}
    </View>
  );
}

/** Grille de tuiles (2 colonnes, 3 au-delà de 520 pt) : largeur calculée, aucune mesure. */
function useTileWidth() {
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 720) - spacing.lg * 2;
  const cols = width >= 520 ? 3 : 2;
  return Math.floor((inner - spacing.xs * (cols - 1)) / cols);
}

type Item = { rec: Recommendation; entry: ToolEntry };

function useEntries(recs: Recommendation[], hub: ReturnType<typeof useToolHub>): Item[] {
  return useMemo(() => recs.map((rec) => {
    const entry = hub.resolve(rec.id, rec.childId ? { type: 'child', id: rec.childId } : null);
    return entry ? { rec, entry } : null;
  }).filter((x): x is Item => !!x), [recs, hub]);
}

function RecTiles({ items, testPrefix, hub, onMenu }: { items: Item[]; testPrefix: string; hub: ReturnType<typeof useToolHub>; onMenu?: (it: Item) => void }) {
  const w = useTileWidth();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {items.map((it, i) => (
        <ToolTile key={it.entry.tool.id} tool={it.entry.tool} index={i} width={w} reason={reasonText(it.rec.reason)} testID={`${testPrefix}-${it.entry.tool.id}`}
          onPress={() => hub.openNow(it.entry)} onLongPress={onMenu ? () => { haptic('selection'); onMenu(it); } : undefined}
          a11yHint={onMenu ? tr('pz.home.menuHint') : undefined} />
      ))}
    </View>
  );
}

/** « Pour toi aujourd'hui ». */
export function ForYouModule() {
  const hub = useToolHub();
  const { forYou } = useRecommendations();
  const items = useEntries(forYou, hub);
  const pinned = useUiStore((s) => s.toolPinned);
  const hidden = useUiStore((s) => s.toolHidden);
  const setPinned = useUiStore((s) => s.setToolPinned);
  const setHidden = useUiStore((s) => s.setToolHidden);
  const toast = useToast();
  const [menu, setMenu] = useState<Item | null>(null);
  if (!items.length) return null;
  const id = menu ? canonicalToolId(menu.rec.id) ?? menu.rec.id : null;
  const isPinned = !!id && pinned.includes(id);
  return (
    <View testID="home-for-you" style={{ gap: spacing.xs }}>
      <Title title={tr('pz.home.forYou')} sub={tr('pz.home.forYouSub')} />
      <RecTiles items={items} testPrefix="home-for-you" hub={hub} onMenu={setMenu} />
      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.entry.tool.label ?? ''}>
        <View style={{ gap: spacing.xs }} testID="home-for-you-menu">
          {menu ? <Text variant="small" muted>{reasonText(menu.rec.reason)}</Text> : null}
          <Button label={tr('pz.home.open')} icon="arrow-right" full onPress={() => { const m = menu; setMenu(null); if (m) hub.openNow(m.entry); }} testID="home-for-you-open" />
          <Button label={isPinned ? tr('pz.home.unpin') : tr('pz.home.pin')} icon="bookmark" variant="secondary" full testID="home-for-you-pin"
            onPress={() => { if (!id) return; setPinned(isPinned ? pinned.filter((x) => x !== id) : [id, ...pinned]); toast(tr(isPinned ? 'pz.home.unpinned' : 'pz.home.pinned', { name: menu!.entry.tool.label })); setMenu(null); }} />
          <Button label={tr('pz.home.hide')} icon="eye-off" variant="outline" full testID="home-for-you-hide"
            onPress={() => { if (!id) return; setHidden([...hidden.filter((x) => x !== id), id]); setPinned(pinned.filter((x) => x !== id)); toast(tr('pz.home.hidden', { name: menu!.entry.tool.label })); setMenu(null); }} />
        </View>
      </Sheet>
    </View>
  );
}

/** « Continuer » : les outils ouverts récemment. */
export function ContinueModule() {
  const hub = useToolHub();
  const list = hub.recents.slice(0, 4);
  const w = useTileWidth();
  if (!list.length) return null;
  return (
    <View testID="home-continue" style={{ gap: spacing.xs }}>
      <Title title={tr('pz.home.continue')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {list.map((e, i) => <ToolTile key={e.tool.id} tool={e.tool} profile={e.profile} index={i} width={w} testID={`home-continue-${e.tool.id}`} onPress={() => hub.openNow(e)} />)}
      </View>
    </View>
  );
}

/** « Ton enfant » : l'enfant du sélecteur de profil (sinon le plus jeune enfant suivi). */
export function YourChildModule() {
  const hub = useToolHub();
  const scope = useScope();
  const { data: children } = useTrackedChildren();
  const child = scope.child ?? [...(children ?? [])].sort((a, b) => b.birth_date.localeCompare(a.birth_date))[0] ?? null;
  const recs = useChildRecommendations(child?.id ?? null);
  const items = useEntries(recs, hub);
  if (!child || !items.length) return null;
  return (
    <View testID="home-your-child" style={{ gap: spacing.xs }}>
      <Title title={tr('pz.home.yourChildOf', { name: child.first_name })} sub={(children?.length ?? 0) > 1 ? tr('pz.home.yourChildSwitch') : undefined} testID={`home-your-child-${child.id}`} />
      <RecTiles items={items} testPrefix="home-child-tool" hub={hub} />
    </View>
  );
}

/** « Explorer les outils » : recherche universelle (barre) et catalogue complet. */
export function ExploreModule() {
  const t = useTheme();
  return (
    <View testID="home-explore" style={{ gap: spacing.xs }}>
      <Title title={tr('pz.home.explore')} />
      <ToolSearchButton testID="home-search" />
      <Tappable accessibilityRole="button" accessibilityLabel={tr('pz.home.exploreAll')} testID="home-explore-all" onPress={() => router.push('/tools' as never)} bare
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.xxs }}>
        <Icon name="grid" size={16} color={t.colors.primary} />
        <Text weight="bold" color={t.colors.primary} style={{ flex: 1 }}>{tr('pz.home.exploreAll')}</Text>
        <Icon name="chevron-right" size={16} color={t.colors.primary} />
      </Tappable>
    </View>
  );
}

/** Éditeur : outils masqués de « Pour toi » (rétablir) — rien n'est supprimé. */
export function HiddenToolsEditor() {
  const hub = useToolHub();
  const hidden = useUiStore((s) => s.toolHidden);
  const setHidden = useUiStore((s) => s.setToolHidden);
  const pinned = useUiStore((s) => s.toolPinned);
  const setPinned = useUiStore((s) => s.setToolPinned);
  const label = (id: string) => hub.resolve(id)?.tool.label ?? id;
  return (
    <View style={{ gap: spacing.xs }} testID="home-edit-foryou">
      <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('pz.home.forYou')}</Text>
      {!pinned.length && !hidden.length ? <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('pz.home.editEmpty')}</Text> : null}
      {pinned.map((id) => <Button key={`p-${id}`} label={tr('pz.home.unpinNamed', { name: label(id) })} icon="bookmark" variant="secondary" full onPress={() => setPinned(pinned.filter((x) => x !== id))} />)}
      {hidden.map((id) => <Button key={`h-${id}`} label={tr('pz.home.restore', { name: label(id) })} icon="eye" variant="secondary" full testID={`home-edit-restore-${id}`} onPress={() => setHidden(hidden.filter((x) => x !== id))} />)}
    </View>
  );
}
