/**
 * Modules du tableau de bord « Aujourd'hui » ajoutés le 17/11/2026 : entrée fixe « Outils », articles en format
 * compact, tâches du foyer, infos d'un enfant, outils favoris épinglés, et l'éditeur « Personnaliser » (le même sur
 * place et dans Réglages › Mon accueil).
 * Aucune carte n'est étirée par son conteneur : hauteurs dictées par le contenu (ni `flex: 1` vertical, ni hauteur en %).
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { useScreenReorderScroll } from '@/components/screenChrome';
import { Cascade, ReorderList, SkeletonBone, SkeletonPulse, type ReorderItemInfo } from '@/motion';
import { QuickActionPicker } from '@/components/Dock';
import { Tappable } from '@/components/Tappable';
import { Button, Chip, haptic, Icon, IconButton, ListGroup, ListRow, Text, Toggle, type IconName } from '@/components/ui';
import { ChildDailyActions } from '@/features/dailyActions/DailyActions';
import { HomiIcon } from '@/brand/icons';
import { ToolLogo, toolLogoDef } from '@/brand/toolLogo';

/** Logos montrés par l'entrée « Mes outils » quand la personne n'a pas encore de favoris. */
const TOOLS_ENTRY_DEFAULT = ['family_calendar', 'kid_sleep', 'meals'];
import { useAllToolEntries, useOpenEntry } from '@/features/hubs/ToolSearch';
import { openTool } from '@/components/ToolCard';
import { useJourneyState, useTrackedChildren } from '@/lib/data/hooks';
import { isLocked } from '@/lib/domain/content';
import { favoriteTools, toggleFavorite } from '@/lib/domain/toolCatalog';
import type { ArticleSummary } from '@/lib/types';
import { useUiStore } from '@/lib/store';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { HOME_MODULES, resolveHomeLayout, setModuleVisible, type HomeLayout, type HomeModuleKey, type HomeSituation } from './homeLayout';
import { useHomeToday } from './useHomeToday';
import { useTourAnchor } from '@/features/tour/anchors';
import { HiddenToolsEditor } from './ToolSections';

const CHILD_INFO: HomeModuleKey = 'childInfo';

/** Titre de module (même gabarit pour tous les modules ajoutés). */
function ModuleTitle({ title, action, onAction, testID }: { title: string; action?: string; onAction?: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xxs, minHeight: 28 }}>
      <Text variant="label" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
      {action && onAction ? (
        <Tappable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} testID={testID} hitSlop={10} bare>
          <Text variant="small" weight="bold" color={t.colors.primary}>{action}</Text>
        </Tappable>
      ) : null}
    </View>
  );
}

/**
 * Squelette du résumé de profil (carte principale de l'accueil) : même carte (rayon, liseré, marges) et à peu près la
 * même hauteur que le résumé qui arrive — pas de saut de mise en page ; os qui respirent ensemble.
 */
export function HomeCardSkeleton() {
  const t = useTheme();
  return (
    <SkeletonPulse label={tr('common.loadingA11y')} testID="home-main-skeleton"
      style={{ borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surface, padding: spacing.md, gap: spacing.sm, minHeight: 168 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <SkeletonBone width={52} height={52} radius={26} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBone width="58%" height={18} />
          <SkeletonBone width="36%" height={12} />
        </View>
      </View>
      <SkeletonBone width="100%" height={12} />
      <SkeletonBone width="84%" height={12} />
      <SkeletonBone width="100%" height={44} radius={radius.control} style={{ marginTop: 4 }} />
    </SkeletonPulse>
  );
}

/** Entrée FIXE et évidente en tête d'Aujourd'hui : tous les outils (recherche, favoris, par thème). */
export function ToolsEntry() {
  const t = useTheme();
  const anchor = useTourAnchor('tools-entry');
  const favs = useUiStore((s) => s.toolFavorites);
  const stack = [...new Set([...favs.filter((id) => toolLogoDef(id)), ...TOOLS_ENTRY_DEFAULT])].slice(0, 3);
  return (
    <View {...anchor}>
    <Tappable accessibilityRole="button" accessibilityLabel={`${tr('hm.toolsEntry')}. ${tr('hm.toolsEntrySub')}`} testID="home-tools-entry" onPress={() => { haptic('selection'); router.push('/tools'); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.lg, borderWidth: 1,
        borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
      {/* trois logos d'outils de la personne (favoris, sinon outils du quotidien) : l'entrée montre SES mini-apps */}
      <View style={{ width: 66, height: 40 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {stack.map((id, i) => (
          <View key={id} style={{ position: 'absolute', left: i * 17, top: i % 2 ? 7 : 1, zIndex: 3 - i }}>
            <ToolLogo id={id} size={30} variant="compact" />
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="bold">{tr('hm.toolsEntry')}</Text>
        <Text variant="caption" muted>{tr('hm.toolsEntrySub')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
    </View>
  );
}

/** Articles en format compact : trois lectures adaptées au profil, une ligne chacune (titre sur deux lignes au plus). */
export function ArticlesCompact({ articles, premium }: { articles: ArticleSummary[]; premium: boolean }) {
  const t = useTheme();
  if (!articles.length) return null;
  return (
    <View testID="home-articles" style={{ gap: spacing.xs }}>
      <ModuleTitle title={tr('hm.articles')} action={tr('hm.articlesAll')} onAction={() => router.push('/library')} testID="home-articles-all" />
      <ListGroup>
        {articles.slice(0, 3).map((a) => (
          <ListRow key={a.slug} icon="book-open" title={a.title} testID={`home-article-${a.slug}`} onPress={() => router.push(`/article/${a.slug}`)}
            right={isLocked(a, premium) ? <Icon name="lock" size={14} color={t.colors.textMuted} /> : undefined} />
        ))}
      </ListGroup>
    </View>
  );
}

/** Tâches du foyer du jour (toutes les personnes), quelle que soit la journée filtrée par profil. */
export function FamilyTasksModule() {
  const d = useHomeToday();
  const todo = d.model.tasks.filter((x) => !x.done);
  return (
    <View testID="home-family-tasks" style={{ gap: spacing.xs }}>
      <ModuleTitle title={tr('hm.familyTasks')} action={tr('hm.familyTasksAll')} onAction={() => router.push('/family')} testID="home-family-tasks-all" />
      {todo.length ? (
        <ListGroup>
          {todo.slice(0, 4).map((x) => (
            <ListRow key={x.id} icon={x.kind === 'mission' ? 'send' : 'check-square'} title={x.title} subtitle={d.person(x.ownerId).name} onPress={() => router.push('/family')} />
          ))}
        </ListGroup>
      ) : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.familyTasksEmpty')}</Text>}
    </View>
  );
}

/** Infos d'un enfant choisi, visibles depuis n'importe quel profil (masqué quand cet enfant est déjà le profil affiché). */
export function ChildInfoModule({ activeChildId }: { activeChildId: string | null }) {
  const { data: children } = useTrackedChildren();
  const js = useJourneyState();
  const chosen = useUiStore((s) => s.homeChildId);
  const child = children?.find((c) => c.id === chosen) ?? children?.[0];
  if (!child || child.id === activeChildId) return null;
  return (
    <View testID="home-child-info" style={{ gap: spacing.xs }}>
      <ModuleTitle title={tr('hm.childInfoOf', { name: child.first_name })} />
      <ChildDailyActions child={child} journey={js.childType(child.id) === 'baby' ? 'baby' : 'child'} />
    </View>
  );
}

/** Outils favoris épinglés sur l'accueil (les mêmes favoris que dans « Outils » : une seule liste). */
export function PinnedTools() {
  const reduce = useReduceMotion();
  const favIds = useUiStore((s) => s.toolFavorites);
  const { entries } = useAllToolEntries();
  const onOpen = useOpenEntry();
  const favs = favoriteTools(entries.map((e) => e.tool), favIds);
  return (
    <View testID="home-pinned-tools" style={{ gap: spacing.xs }}>
      <ModuleTitle title={tr('hm.tools')} action={tr('hm.toolsManage')} onAction={() => router.push('/tools')} testID="home-pinned-manage" />
      {favs.length ? (
        <ListGroup>
          {favs.slice(0, 5).map((tool, i) => {
            const e = entries.find((x) => x.tool.id === tool.id)!;
            // entrée animée (une fois, au montage) : un outil tout juste épinglé apparaît en douceur
            return <Cascade key={tool.id} index={i}><ListRow icon={tool.icon} title={tool.label} subtitle={e.profile} testID={`home-pinned-${tool.id}`} onPress={() => { onOpen(e); openTool(tool, undefined, reduce); }} /></Cascade>;
          })}
        </ListGroup>
      ) : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.toolsEmpty')}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ « Personnaliser »
const SITUATION_ICON: Record<HomeSituation, IconName> = { pregnancy: 'heart', newborn: 'smile', child: 'smile', couple: 'users', family: 'users', cycle: 'refresh-cw', me: 'user', coparent: 'user-check' };

/**
 * Éditeur de l'accueil : réordonner, masquer / afficher les modules, choisir les actions rapides, épingler des outils,
 * choisir l'enfant du module « Infos d'un enfant », afficher les tâches familiales, rétablir la configuration par défaut.
 * Chaque changement est enregistré tout de suite (sur l'appareil, pour la situation affichée).
 */
export function HomeEditor({ situation, onDone }: { situation: HomeSituation; onDone?: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const reorderScroll = useScreenReorderScroll();
  const saved = useUiStore((s) => s.homeLayouts[situation]);
  const save = useUiStore((s) => s.setHomeLayoutFor);
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const homeChildId = useUiStore((s) => s.homeChildId);
  const setHomeChildId = useUiStore((s) => s.setHomeChildId);
  const setQuickFavs = useUiStore((s) => s.setQuickActionFavorites);
  const quickFavs = useUiStore((s) => s.quickActionFavorites);
  const dailyFavs = useUiStore((s) => s.dailyActionFavorites);
  const setDailyFavs = useUiStore((s) => s.setDailyActionFavorites);
  const { data: children } = useTrackedChildren();
  const { entries } = useAllToolEntries();
  const [picking, setPicking] = useState(false);
  const layout = resolveHomeLayout(situation, saved);
  const set = (l: HomeLayout) => save(situation, l);
  const favs = favoriteTools(entries.map((e) => e.tool), favIds);
  const childId = children?.find((c) => c.id === homeChildId)?.id ?? children?.[0]?.id ?? null;

  function reset() {
    save(situation, null);
    for (const k of Object.keys(quickFavs)) setQuickFavs(k, null);
    for (const k of Object.keys(dailyFavs ?? {})) setDailyFavs(k, null);
    setHomeChildId(null);
    toast(tr('hm.resetDone'));
  }
  const label = (k: HomeModuleKey) => tr(HOME_MODULES.find((m) => m.key === k)!.label);
  // Visite guidée : le doigt fantôme montre le glisser-déposer sur la liste des modules
  const reorderAnchor = useTourAnchor('home-editor');

  return (
    <View testID="home-editor" style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon name={SITUATION_ICON[situation]} size={18} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header">{tr('hm.editTitle')}</Text>
          <Text variant="small" muted testID="home-editor-situation">{tr('hm.editFor', { name: tr(`hm.situation.${situation}`) })}</Text>
        </View>
        {onDone ? <Button label={tr('hm.done')} size="sm" onPress={onDone} testID="home-editor-done" /> : null}
      </View>

      {/* Modules : ordre (glisser-déposer) et visibilité. L'en-tête (bonjour, date, profil, Outils) reste fixe. */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.modules')}</Text>
        <Text variant="caption" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('glass.reorder.hint')}</Text>
        <View {...reorderAnchor}>
        <ReorderList
          data={layout.order}
          keyOf={(k) => k}
          gap={spacing.xs}
          scroll={reorderScroll ?? undefined}
          moveUpLabel={tr('glass.reorder.up')}
          moveDownLabel={tr('glass.reorder.down')}
          testID="home-edit-modules"
          onReorder={(keys) => { set({ ...layout, order: keys as HomeModuleKey[] }); toast(tr('glass.reorder.saved')); }}
          renderItem={(key, info) => (
            <ModuleRow moduleKey={key} label={label(key)} detail={HOME_MODULES.find((x) => x.key === key)?.detail} index={info.index} total={layout.order.length}
              visible={!layout.hidden.includes(key)} lifted={info.active} a11y={info.a11y} moveUp={info.moveUp} moveDown={info.moveDown}
              onVisible={(v) => set(setModuleVisible(layout, key, v))} />
          )}
        />
        </View>
      </View>

      {/* Actions rapides du profil affiché (bouton central de la barre) */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.quick')}</Text>
        {picking ? <QuickActionPicker onDone={() => setPicking(false)} />
          : <Button label={tr('qa.customize')} icon="sliders" variant="secondary" full onPress={() => setPicking(true)} testID="home-edit-quick" />}
      </View>

      {/* Infos d'un enfant : lequel afficher */}
      {children && children.length ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.childInfo')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {children.map((c) => (
              <Chip key={c.id} label={c.first_name} selected={!layout.hidden.includes(CHILD_INFO) && c.id === childId} testID={`home-edit-child-${c.id}`}
                onPress={() => { setHomeChildId(c.id); set(setModuleVisible(layout, CHILD_INFO, true)); }} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Outils favoris épinglés */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.tools')}</Text>
        {favs.length ? (
          // Outils épinglés : même glisser-déposer (ordre des favoris, une seule liste partout), retrait en un appui
          <ReorderList
            data={favs}
            keyOf={(tool) => tool.id}
            gap={spacing.xs}
            scroll={reorderScroll ?? undefined}
            moveUpLabel={tr('glass.reorder.up')}
            moveDownLabel={tr('glass.reorder.down')}
            testID="home-edit-pinned"
            onReorder={(keys) => { setFavIds([...keys, ...favIds.filter((x) => !keys.includes(x))]); toast(tr('glass.reorder.saved')); }}
            renderItem={(tool, info) => (
              <PinnedRow id={tool.id} icon={tool.icon} label={tool.label} index={info.index} total={favs.length} lifted={info.active} a11y={info.a11y}
                moveUp={info.moveUp} moveDown={info.moveDown} onUnpin={() => { setFavIds(toggleFavorite(favIds, tool.id)); toast(tr('th.ui.favRemoved', { label: tool.label })); }} />
            )}
          />
        ) : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.toolsEmpty')}</Text>}
        <Button label={tr('hm.pin')} icon="star" variant="secondary" full testID="home-edit-pin"
          onPress={() => { set(setModuleVisible(layout, 'tools', true)); router.push('/tools'); }} />
      </View>

      {/* « Pour toi aujourd'hui » : épinglés et masqués (rien n'est supprimé) */}
      <HiddenToolsEditor />

      <Button label={tr('hm.reset')} icon="rotate-ccw" variant="outline" full onPress={reset} testID="home-edit-reset" />
      <Text variant="caption" muted>{tr('u1.home.local')}</Text>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ rangées réordonnables
type RowA11y = ReorderItemInfo['a11y'];

/** Actions « monter / descendre » sur le web (pas d'actions d'accessibilité nommées) : boutons masqués à l'œil, lus et activables par les lecteurs d'écran et au clavier. */
function WebMoveButtons({ name, index, total, moveUp, moveDown, testID }: { name: string; index: number; total: number; moveUp: () => void; moveDown: () => void; testID: string }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={SR_ONLY}>
      <Pressable accessibilityRole="button" accessibilityLabel={tr('u1.home.up', { name })} disabled={index === 0} onPress={moveUp} testID={`home-edit-up-${testID}`} />
      <Pressable accessibilityRole="button" accessibilityLabel={tr('u1.home.down', { name })} disabled={index === total - 1} onPress={moveDown} testID={`home-edit-down-${testID}`} />
    </View>
  );
}

/** Poignée (≡) : signale le glisser-déposer ; la carte entière se soulève à l'appui long. */
function Grip({ lifted }: { lifted: boolean }) {
  const t = useTheme();
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 28, alignItems: 'center' }}><Icon name="menu" size={18} color={lifted ? t.colors.primary : t.colors.textMuted} /></View>;
}

function rowStyle(t: ReturnType<typeof useTheme>, lifted: boolean) {
  return { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs, minHeight: 60, paddingVertical: 6, paddingLeft: spacing.xs, paddingRight: spacing.xxs,
    borderRadius: radius.lg, borderWidth: lifted ? 1.5 : StyleSheet.hairlineWidth, borderColor: lifted ? t.tokens.border.active : t.colors.border, backgroundColor: t.colors.surface };
}

/** Module de l'accueil : poignée, nom, détail, interrupteur « afficher » ; actions monter / descendre pour VoiceOver. */
function ModuleRow({ moduleKey, label, detail, index, total, visible, lifted, a11y, moveUp, moveDown, onVisible }: {
  moduleKey: HomeModuleKey; label: string; detail?: TKey; index: number; total: number; visible: boolean; lifted: boolean; a11y: RowA11y; moveUp: () => void; moveDown: () => void; onVisible: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View testID={`home-edit-${moduleKey}`} style={rowStyle(t, lifted)}>
      <Grip lifted={lifted} />
      <View accessible accessibilityLabel={tr('glass.reorder.position', { name: label, n: index + 1, total })} accessibilityHint={tr('glass.reorder.hint')} {...a11y}
        style={{ flex: 1, minWidth: 0, opacity: visible ? 1 : 0.6 }}>
        <Text weight="medium">{label}</Text>
        {detail ? <Text variant="caption" muted>{tr(detail)}</Text> : null}
      </View>
      <WebMoveButtons name={label} index={index} total={total} moveUp={moveUp} moveDown={moveDown} testID={moduleKey} />
      <View testID={`home-edit-toggle-${moduleKey}`}><Toggle label={tr('u1.home.show', { name: label })} value={visible} onChange={onVisible} /></View>
    </View>
  );
}

/** Outil épinglé : poignée, pictogramme, nom, retrait ; actions monter / descendre pour VoiceOver. */
function PinnedRow({ id, icon, label, index, total, lifted, a11y, moveUp, moveDown, onUnpin }: {
  id: string; icon: IconName; label: string; index: number; total: number; lifted: boolean; a11y: RowA11y; moveUp: () => void; moveDown: () => void; onUnpin: () => void;
}) {
  const t = useTheme();
  return (
    <View testID={`home-edit-pinned-${id}`} style={rowStyle(t, lifted)}>
      <Grip lifted={lifted} />
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
        <Icon name={icon} size={16} color={t.colors.primary} />
      </View>
      <View accessible accessibilityLabel={tr('glass.reorder.position', { name: label, n: index + 1, total })} accessibilityHint={tr('glass.reorder.hint')} {...a11y} style={{ flex: 1, minWidth: 0 }}>
        <Text weight="medium">{label}</Text>
      </View>
      <WebMoveButtons name={label} index={index} total={total} moveUp={moveUp} moveDown={moveDown} testID={`pin-${id}`} />
      <IconButton icon="x" label={tr('hm.unpin', { name: label })} onPress={onUnpin} testID={`home-edit-unpin-${id}`} />
    </View>
  );
}

/** Masqué à l'œil, présent pour les lecteurs d'écran (web). */
const SR_ONLY = { position: 'absolute' as const, width: 1, height: 1, overflow: 'hidden' as const, opacity: 0, left: 0, top: 0 };
