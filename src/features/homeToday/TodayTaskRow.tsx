/**
 * Accueil recomposé (16/11/2026) — deux présentations d'une tâche ou mission du jour :
 *
 *  - `TodayFocus` : la demande en tête (v5 : carte isolée, sans verre ni halo). Le seul bouton plein de l'accueil
 *    est ici (« J'accepte » ou « C'est fait »).
 *  - `TodayAgendaRow` : une ligne de chronologie (v5 : heure alignée dans une colonne tabulaire, fil fin, statut en
 *    capsule courte — jamais la couleur seule —, responsable avatar + prénom, « demandée par » quand la demandeuse
 *    n'est pas la responsable).
 *    Une case à cocher discrète (`CompletionCheck`, 48 px) termine la tâche quand c'est permis ; toucher la ligne
 *    ouvre le détail (transition carte → détail, `CardSource`). Plus de gros bouton ni de badges empilés.
 *
 * Uniquement des jetons du thème (`useTheme()`), les composants partagés et `src/motion` / `src/features/scene`.
 */
import { glassEdge } from '@/components/glass/GlassRim';
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { DayRail, StatusPill, type DayState, type PillTone } from '@/features/day5/DayParts';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { missionHref, STATE_LABEL, STATE_TONE } from '@/lib/domain/missions';
import { CompletionCheck } from '@/motion';
import { CardSource } from '@/features/scene';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
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

/** Ton de la capsule de statut (jamais la couleur seule : la capsule porte toujours son libellé). */
export function statusTone(s: TodayStatus, late?: boolean): PillTone {
  if (late && s !== 'done') return 'late';
  if (s === 'done') return 'done';
  if (s === 'pending' || s === 'postponed' || s === 'open' || s === 'in_progress') return 'accent';
  return 'muted';
}

/** Statut (capsule courte) puis responsable (avatar + prénom) : une seule ligne de métadonnées, qui peut passer à la ligne. */
function Meta({ x, owner, status, requested, size = 22, overdue }: { x: TodayTask; owner: TodayPerson; status: TodayStatus; requested: string | null; size?: number; overdue?: boolean }) {
  const t = useTheme();
  // Tâche à moi dont l'heure est passée : « En retard » (la capsule dit pourquoi elle est en tête)
  const late = !!overdue && status !== 'done';
  const label = late ? tr('d5.state.late') : statusLabel({ status, kind: x.kind });
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: 4 }}>
        <StatusPill label={label} tone={late ? 'late' : statusTone(status, x.late)} testID={`today-status-${x.id}`} accessibilityLabel={tr('ht.statusA11y', { status: label })} />
        {/* Tâche « à prendre » : la capsule le dit déjà, pas de second « À prendre » */}
        {status === 'open' && !x.ownerId ? null : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          {x.ownerId ? (
            <UserAvatar path={owner.avatarPath} initial={owner.initial} size={size} testID={`today-avatar-${x.id}`} />
          ) : (
            <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
              <Icon name="user-plus" size={Math.round(size * 0.55)} color={t.colors.primary} />
            </View>
          )}
          <Text variant="small" muted numberOfLines={1} testID={`today-owner-${x.id}`} style={{ flexShrink: 1 }}>{x.ownerId ? owner.name : tr('ht.nobody')}</Text>
        </View>}
      </View>
      {requested ? <Text variant="caption" muted numberOfLines={2} testID={`today-requested-${x.id}`}>{requested}</Text> : null}
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

/**
 * La demande en tête (carte isolée) : ce qui attend ma réponse, ou ma prochaine tâche. Porte la SEULE action
 * principale de l'écran (« J'accepte » ou « C'est fait »).
 */
export function TodayFocus({ x, owner, creator, celebrate = false, busy, onComplete, onAccept, DoneComponent }: TodayFocusProps) {
  const t = useTheme();
  const done = x.done || celebrate;
  const status: TodayStatus = done ? 'done' : x.status;
  const requested = requestedByLabel(x, creator);
  const a11y = rowA11y(x, owner, requested, statusLabel({ status, kind: x.kind }));
  // Une seule action pleine : répondre d'abord si la mission attend ma réponse, sinon terminer
  const primary: 'accept' | 'complete' | null = done ? null : x.canAccept ? 'accept' : x.canComplete ? 'complete' : null;
  const late = x.late && !done;
  const kickerColor = late ? t.tokens.status.warning : t.colors.primary;
  return (
    <View testID="today-emphasis" style={{ ...glassEdge(t), gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1,
      borderColor: celebrate ? t.tokens.status.success : t.colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <DoneComponent done={done} celebrate={celebrate} icon={x.awaitsMe ? 'inbox' : 'arrow-right-circle'} color={done ? t.colors.success : kickerColor} size={18} />
        <Text variant="caption" weight="bold" color={kickerColor} accessibilityRole="header" style={{ flex: 1 }}>{x.awaitsMe ? tr('ht.awaitsYou') : late ? tr('d5.state.late') : tr('ht.now')}</Text>
        <Text variant="small" weight="bold" color={late ? t.tokens.status.warning : t.colors.text} style={{ fontVariant: ['tabular-nums'] }}>{whenLabel(x)}</Text>
      </View>
      <CardSource sourceKey={`today:${x.id}`} onOpen={() => openTask(x)} testID={`today-open-${x.id}`} accessibilityLabel={a11y} accessibilityHint={tr('ht.openHint')}
        style={{ gap: spacing.xs, minHeight: MIN_TOUCH }}>
        <Text variant="heading" numberOfLines={3} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{x.title}</Text>
        <Meta x={x} owner={owner} status={status} requested={requested} size={24} />
      </CardSource>
      {primary === 'accept' ? (
        <Button label={tr('mis.reply.accept')} full onPress={() => onAccept(x)} loading={busy === 'accept'} disabled={!!busy}
          testID={`today-accept-${x.id}`} accessibilityLabel={tr('ht.acceptA11y', { title: x.title })} />
      ) : primary === 'complete' ? (
        <Button label={x.kind === 'mission' ? tr('mis.reply.complete') : tr('ht.markDone')} full onPress={() => onComplete(x)} loading={busy === 'complete'} disabled={!!busy}
          testID={`today-complete-${x.id}`} accessibilityLabel={tr('ht.completeA11y', { title: x.title })} />
      ) : null}
    </View>
  );
}

export interface TodayAgendaRowProps {
  x: TodayTask;
  owner: TodayPerson;
  creator: TodayPerson | null;
  celebrate?: boolean;
  busy?: boolean;
  onComplete: (x: TodayTask) => void;
  /** État sur le fil de la journée (point et couleur de l'heure) ; défaut : déduit de la tâche. */
  state?: DayState;
  first?: boolean;
  last?: boolean;
}

/** Heure de la colonne (courte, alignée) : « 17:30 », « 12 nov. » (échéance d'un jour passé), « Journée ». */
export function railTime(x: Pick<TodayTask, 'dueAt' | 'timed' | 'late'>): string {
  if (x.late && x.dueAt) return formatDate(x.dueAt, { day: 'numeric', month: 'short' });
  if (x.timed && x.dueAt) return formatTime(x.dueAt);
  return tr('d5.anytime');
}

/** Ligne de chronologie d'une tâche / mission : heure alignée, fil, titre, statut en capsule, case à cocher discrète. */
export function TodayAgendaRow({ x, owner, creator, celebrate = false, busy, onComplete, state, first, last }: TodayAgendaRowProps) {
  const done = x.done || celebrate;
  const status: TodayStatus = done ? 'done' : x.status;
  const requested = requestedByLabel(x, creator);
  const a11y = rowA11y(x, owner, requested, statusLabel({ status, kind: x.kind }));
  const checkable = x.canComplete || celebrate;
  const st: DayState = done ? 'done' : state ?? (x.late ? 'late' : x.timed ? 'later' : 'anytime');
  return (
    <View testID={`today-row-${x.id}`} style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, paddingRight: spacing.xs, opacity: x.done && !celebrate ? 0.78 : 1 }}>
      <CardSource grow sourceKey={`today:${x.id}`} onOpen={() => openTask(x)} testID={`today-open-${x.id}`} accessibilityLabel={a11y} accessibilityHint={tr('ht.openHint')}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingVertical: spacing.sm }}>
        <DayRail time={railTime(x)} state={st} first={first} last={last} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text weight="medium" numberOfLines={3} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{x.title}</Text>
          <Meta x={x} owner={owner} status={status} requested={requested} overdue={st === 'late' && x.canComplete} />
        </View>
      </CardSource>
      {checkable ? (
        <CompletionCheck done={done} disabled={!!busy && !done} onToggle={(next) => { if (next && !done) onComplete(x); }}
          label={tr('ht.completeA11y', { title: x.title })} testID={`today-complete-${x.id}`} size={24}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH }} />
      ) : <View style={{ width: MIN_TOUCH }} />}
    </View>
  );
}
