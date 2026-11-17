/**
 * Modules du tableau de bord « Aujourd'hui » ajoutés le 17/11/2026 : entrée fixe « Outils », articles en format
 * compact, tâches du foyer, infos d'un enfant, outils favoris épinglés, et l'éditeur « Personnaliser » (le même sur
 * place et dans Réglages › Mon accueil).
 * Aucune carte n'est étirée par son conteneur : hauteurs dictées par le contenu (ni `flex: 1` vertical, ni hauteur en %).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { QuickActionPicker } from '@/components/Dock';
import { Tappable } from '@/components/Tappable';
import { Button, Chip, haptic, Icon, IconButton, ListGroup, ListRow, Text, Toggle, type IconName } from '@/components/ui';
import { ChildDailyActions } from '@/features/dailyActions/DailyActions';
import { useAllToolEntries, useOpenEntry } from '@/features/hubs/ToolSearch';
import { openTool } from '@/components/ToolCard';
import { useJourneyState, useTrackedChildren } from '@/lib/data/hooks';
import { isLocked } from '@/lib/domain/content';
import { favoriteTools, toggleFavorite } from '@/lib/domain/toolCatalog';
import type { ArticleSummary } from '@/lib/types';
import { useUiStore } from '@/lib/store';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { HOME_MODULES, moveModule, resolveHomeLayout, setModuleVisible, type HomeLayout, type HomeModuleKey, type HomeSituation } from './homeLayout';
import { useHomeToday } from './useHomeToday';

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

/** Entrée FIXE et évidente en tête d'Aujourd'hui : tous les outils (recherche, favoris, par thème). */
export function ToolsEntry() {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${tr('hm.toolsEntry')}. ${tr('hm.toolsEntrySub')}`} testID="home-tools-entry" onPress={() => { haptic('selection'); router.push('/tools'); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.lg, borderWidth: 1,
        borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
        <Icon name="grid" size={18} color={t.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="bold">{tr('hm.toolsEntry')}</Text>
        <Text variant="caption" muted>{tr('hm.toolsEntrySub')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
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
          {favs.slice(0, 5).map((tool) => {
            const e = entries.find((x) => x.tool.id === tool.id)!;
            return <ListRow key={tool.id} icon={tool.icon} title={tool.label} subtitle={e.profile} testID={`home-pinned-${tool.id}`} onPress={() => { onOpen(e); openTool(tool, undefined, reduce); }} />;
          })}
        </ListGroup>
      ) : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.toolsEmpty')}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ « Personnaliser »
const SITUATION_ICON: Record<HomeSituation, IconName> = { pregnancy: 'heart', newborn: 'smile', child: 'smile', couple: 'users', family: 'users', cycle: 'refresh-cw', me: 'user' };

/**
 * Éditeur de l'accueil : réordonner, masquer / afficher les modules, choisir les actions rapides, épingler des outils,
 * choisir l'enfant du module « Infos d'un enfant », afficher les tâches familiales, rétablir la configuration par défaut.
 * Chaque changement est enregistré tout de suite (sur l'appareil, pour la situation affichée).
 */
export function HomeEditor({ situation, onDone }: { situation: HomeSituation; onDone?: () => void }) {
  const t = useTheme();
  const toast = useToast();
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

      {/* Modules : ordre et visibilité. L'en-tête (bonjour, date, profil, Outils) reste fixe. */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.modules')}</Text>
        <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface, paddingHorizontal: spacing.sm }}>
          {layout.order.map((key, i) => {
            const m = HOME_MODULES.find((x) => x.key === key)!;
            const visible = !layout.hidden.includes(key);
            return (
              <View key={key} testID={`home-edit-${key}`} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', minHeight: 56, paddingVertical: 4,
                borderTopWidth: i ? 1 : 0, borderTopColor: t.material.lines.separator }}>
                <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 120, opacity: visible ? 1 : 0.6 }}>
                  <Text weight="medium">{tr(m.label)}</Text>
                  {m.detail ? <Text variant="caption" muted>{tr(m.detail)}</Text> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
                  <IconButton icon="arrow-up" label={tr('u1.home.up', { name: label(key) })} disabled={i === 0} onPress={() => set(moveModule(layout, key, -1))} testID={`home-edit-up-${key}`} />
                  <IconButton icon="arrow-down" label={tr('u1.home.down', { name: label(key) })} disabled={i === layout.order.length - 1} onPress={() => set(moveModule(layout, key, 1))} testID={`home-edit-down-${key}`} />
                  <View testID={`home-edit-toggle-${key}`}><Toggle label={tr('u1.home.show', { name: label(key) })} value={visible} onChange={(v) => set(setModuleVisible(layout, key, v))} /></View>
                </View>
              </View>
            );
          })}
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
          <ListGroup>
            {favs.map((tool) => (
              <ListRow key={tool.id} icon={tool.icon} title={tool.label}
                right={<IconButton icon="x" label={tr('hm.unpin', { name: tool.label })} onPress={() => setFavIds(toggleFavorite(favIds, tool.id))} />} />
            ))}
          </ListGroup>
        ) : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('hm.toolsEmpty')}</Text>}
        <Button label={tr('hm.pin')} icon="star" variant="secondary" full testID="home-edit-pin"
          onPress={() => { set(setModuleVisible(layout, 'tools', true)); router.push('/tools'); }} />
      </View>

      <Button label={tr('hm.reset')} icon="rotate-ccw" variant="outline" full onPress={reset} testID="home-edit-reset" />
      <Text variant="caption" muted>{tr('u1.home.local')}</Text>
    </View>
  );
}
