/**
 * Accueil recomposé (16/11/2026) — deux présentations d'une tâche ou mission du jour :
 *
 *  - `TodayFocus` : la PROCHAINE ACTION UTILE, point focal unique de l'écran (verre optique / halo :
 *    `OpticalSurface`). Le seul bouton plein de l'accueil est ici (« J'accepte » ou « C'est fait »).
 *  - `TodayAgendaRow` : une ligne d'agenda lisible (surface mate) : heure, titre, responsable (avatar + prénom),
 *    statut (icône + libellé, jamais la couleur seule), « demandée par » quand la demandeuse n'est pas la responsable.
 *    Une case à cocher discrète (`CompletionCheck`, 48 px) termine la tâche quand c'est permis ; toucher la ligne
 *    ouvre le détail (transition carte → détail, `CardSource`). Plus de gros bouton ni de badges empilés.
 *
 * Uniquement des jetons du thème (`useTheme()`), les composants partagés et `src/motion` / `src/features/scene`.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { missionHref, STATE_LABEL, STATE_TONE } from '@/lib/domain/missions';
import { CompletionCheck } from '@/motion';
import { CardSource, OpticalSurface } from '@/features/scene';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import type { TodayStatus, TodayTask } from './todayModel';
import type { TodayPerson } from './useHomeToday';
import type { DoneMarkProps } from './DoneMark';

export const STATUS_ICON: Record<TodayStatus, IconName> = {
  pending: 'inbox', postponed: 'clock', accepted: 'thumbs-up', in_progress: 'play-circle', done: 'check-circle',
  declined: 'x-circle', cancelled: 'slash', todo: 'circle', open: 'user-plus',
};

export function statusLabel(x: Pick<TodayTask, 'status' | 'kind'>): string {
  if (x.status === 'todo') return tr('ht.status.todo');
  if (x.status === 'open') return tr('ht.status.open');
  if (x.status === 'done' && x.kind === 'task') return tr('ht.status.done');
  return tr(STATE_LABEL[x.status] as TKey);
}

export function useStatusColor() {
  const t = useTheme();
  return (s: TodayStatus) => {
    const tone = s === 'todo' ? 'calm' : s === 'open' ? 'accent' : STATE_TONE[s];
    return tone === 'accent' ? t.colors.primary : tone === 'done' ? t.colors.success : tone === 'calm' ? t.colors.text : t.colors.textMuted;
  };
}

/** Heure de la ligne : « 17:30 », « Dans la journée », ou « Prévue mar. 12 nov. » (échéance passée, ton neutre). */
export function whenLabel(x: Pick<TodayTask, 'dueAt' | 'timed' | 'late'>): string {
  if (x.late && x.dueAt) return tr('ht.since', { date: formatDate(x.dueAt, { weekday: 'short', day: 'numeric', month: 'short' }) });
  if (x.timed && x.dueAt) return formatTime(x.dueAt);
  return tr('ht.allDay');
}

export const openTask = (x: Pick<TodayTask, 'id' | 'kind'>) => router.push((x.kind === 'mission' ? missionHref(x.id) : '/family') as never);

/**
 * « Demandée par … » : seulement pour une mission dont la demandeuse n'est pas la responsable (ex. Sam demande à
 * Camille) — corrige l'ancien « Camille · Mission » qui laissait croire que la mission venait de Camille.
 */
export function requestedByLabel(x: Pick<TodayTask, 'kind' | 'ownerId' | 'creatorId'>, creator: TodayPerson | null): string | null {
  if (x.kind !== 'mission' || !x.creatorId || x.creatorId === x.ownerId || !creator) return null;
  return creator.isMe ? tr('mis.fromYou') : tr('mis.from', { person: creator.name });
}

/** Libellé lu par les lecteurs d'écran : titre, statut, responsable, heure, demandeuse. */
export function rowA11y(x: TodayTask, owner: TodayPerson, requested: string | null, status: string): string {
  return [x.title, status, x.ownerId ? tr('ht.by', { name: owner.name }) : tr('ht.nobody'), whenLabel(x), requested].filter(Boolean).join('. ');
}

/** Responsable (avatar + prénom) puis statut (icône + libellé) : une seule ligne de métadonnées, qui peut passer à la ligne. */
function Meta({ x, owner, status, requested, size = 22 }: { x: TodayTask; owner: TodayPerson; status: TodayStatus; requested: string | null; size?: number }) {
  const t = useTheme();
  const colorOf = useStatusColor();
  const color = colorOf(status);
  const label = statusLabel({ status, kind: x.kind });
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          {x.ownerId ? (
            <UserAvatar path={owner.avatarPath} initial={owner.initial} size={size} testID={`today-avatar-${x.id}`} />
          ) : (
            <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
              <Icon name="user-plus" size={Math.round(size * 0.55)} color={t.colors.primary} />
            </View>
          )}
          <Text variant="small" weight="medium" numberOfLines={1} testID={`today-owner-${x.id}`} style={{ flexShrink: 1 }}>{x.ownerId ? owner.name : tr('ht.nobody')}</Text>
        </View>
        <View testID={`today-status-${x.id}`} accessibilityLabel={tr('ht.statusA11y', { status: label })} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name={STATUS_ICON[status]} size={14} color={color} />
          <Text variant="small" weight="bold" color={color}>{label}</Text>
        </View>
      </View>
      {requested ? <Text variant="caption" muted numberOfLines={1} testID={`today-requested-${x.id}`}>{requested}</Text> : null}
    </View>
  );
}

export interface TodayFocusProps {
  x: TodayTask;
  owner: TodayPerson;
  creator: TodayPerson | null;
  /** Validation optimiste en cours ou réussie sur cet écran (filet de succès). */
  celebrate?: boolean;
  busy?: 'complete' | 'accept' | null;
  onComplete: (x: TodayTask) => void;
  onAccept: (x: TodayTask) => void;
  DoneComponent: React.ComponentType<DoneMarkProps>;
}

/** Point focal unique : la prochaine action utile (une seule action pleine). */
export function TodayFocus({ x, owner, creator, celebrate = false, busy, onComplete, onAccept, DoneComponent }: TodayFocusProps) {
  const t = useTheme();
  const colorOf = useStatusColor();
  const done = x.done || celebrate;
  const status: TodayStatus = done ? 'done' : x.status;
  const requested = requestedByLabel(x, creator);
  const a11y = rowA11y(x, owner, requested, statusLabel({ status, kind: x.kind }));
  // Une seule action pleine : répondre d'abord si la mission attend ma réponse, sinon terminer
  const primary: 'accept' | 'complete' | null = done ? null : x.canAccept ? 'accept' : x.canComplete ? 'complete' : null;
  return (
    <OpticalSurface testID="today-emphasis" tone={celebrate ? 'success' : 'action'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <DoneComponent done={done} celebrate={celebrate} icon={x.awaitsMe ? 'inbox' : 'arrow-right-circle'} color={done ? t.colors.success : t.colors.primary} size={20} />
        <Text variant="caption" weight="bold" color={t.colors.primary} accessibilityRole="header" style={{ flex: 1 }}>{x.awaitsMe ? tr('ht.awaitsYou') : tr('ht.now')}</Text>
        <Text variant="small" weight="bold" color={colorOf(status)}>{whenLabel(x)}</Text>
      </View>
      <CardSource sourceKey={`today:${x.id}`} onOpen={() => openTask(x)} testID={`today-open-${x.id}`} accessibilityLabel={a11y} accessibilityHint={tr('ht.openHint')}
        style={{ gap: spacing.xs, minHeight: MIN_TOUCH }}>
        <Text variant="heading" numberOfLines={3} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{x.title}</Text>
        <Meta x={x} owner={owner} status={status} requested={requested} size={26} />
      </CardSource>
      {primary === 'accept' ? (
        <Button label={tr('mis.reply.accept')} icon="thumbs-up" full onPress={() => onAccept(x)} loading={busy === 'accept'} disabled={!!busy}
          testID={`today-accept-${x.id}`} accessibilityLabel={tr('ht.acceptA11y', { title: x.title })} />
      ) : primary === 'complete' ? (
        <Button label={x.kind === 'mission' ? tr('mis.reply.complete') : tr('ht.markDone')} icon="check" full onPress={() => onComplete(x)} loading={busy === 'complete'} disabled={!!busy}
          testID={`today-complete-${x.id}`} accessibilityLabel={tr('ht.completeA11y', { title: x.title })} />
      ) : null}
    </OpticalSurface>
  );
}

export interface TodayAgendaRowProps {
  x: TodayTask;
  owner: TodayPerson;
  creator: TodayPerson | null;
  celebrate?: boolean;
  busy?: boolean;
  onComplete: (x: TodayTask) => void;
}

/** Ligne d'agenda d'une tâche / mission : une ligne, case à cocher discrète, détail au toucher. */
export function TodayAgendaRow({ x, owner, creator, celebrate = false, busy, onComplete }: TodayAgendaRowProps) {
  const t = useTheme();
  const done = x.done || celebrate;
  const status: TodayStatus = done ? 'done' : x.status;
  const requested = requestedByLabel(x, creator);
  const a11y = rowA11y(x, owner, requested, statusLabel({ status, kind: x.kind }));
  const checkable = x.canComplete || celebrate;
  return (
    <View testID={`today-row-${x.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, opacity: x.done && !celebrate ? 0.72 : 1 }}>
      <CardSource grow sourceKey={`today:${x.id}`} onOpen={() => openTask(x)} testID={`today-open-${x.id}`} accessibilityLabel={a11y} accessibilityHint={tr('ht.openHint')}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingVertical: spacing.xs }}>
        <View style={{ width: 56, paddingTop: 1 }}>
          <Text variant="small" weight="bold" numberOfLines={2} color={x.late ? t.colors.warning : t.colors.text}>{whenLabel(x)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text weight="bold" numberOfLines={3} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{x.title}</Text>
          <Meta x={x} owner={owner} status={status} requested={requested} />
        </View>
      </CardSource>
      {checkable ? (
        <CompletionCheck done={done} disabled={!!busy && !done} onToggle={(next) => { if (next && !done) onComplete(x); }}
          label={tr('ht.completeA11y', { title: x.title })} testID={`today-complete-${x.id}`} size={26}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH }} />
      ) : <View style={{ width: MIN_TOUCH }} />}
    </View>
  );
}
