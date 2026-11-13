/**
 * Ligne d'une tâche ou d'une mission du jour : responsable (avatar ou initiale + prénom), heure, statut (icône ET
 * libellé, jamais la couleur seule), et l'action possible d'ici (« J'accepte », « C'est terminé », « Fait »).
 * La personne qui ne peut pas terminer (mission de quelqu'un d'autre) ne voit aucun bouton : seulement qui s'en charge.
 *
 * `emphasis` : ligne « à faire maintenant » (mission qui m'attend, ou ma prochaine tâche). Rendue aujourd'hui par une
 * surface teintée du thème ; le design system peut la rendre en halo (GlowCard) en remplaçant `TodayEmphasisSurface`.
 * Uniquement des jetons du thème (`useTheme()`), aucune couleur écrite en dur.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { missionHref, STATE_LABEL, STATE_TONE } from '@/lib/domain/missions';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import type { TodayStatus, TodayTask } from './todayModel';
import type { TodayPerson } from './useHomeToday';
import type { DoneMarkProps } from './DoneMark';

const STATUS_ICON: Record<TodayStatus, IconName> = {
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

/** Surface de la ligne mise en avant. Point de branchement du halo du design system (GlowCard). */
export function TodayEmphasisSurface({ children, label, testID }: { children: React.ReactNode; label: string; testID?: string }) {
  const t = useTheme();
  return (
    <Card tone="lavender" testID={testID} style={{ gap: spacing.xs, borderColor: t.colors.primary, borderWidth: 1.5 }}>
      <Text variant="caption" weight="bold" color={t.colors.primary} accessibilityRole="header">{label}</Text>
      {children}
    </Card>
  );
}

export interface TodayTaskRowProps {
  x: TodayTask;
  owner: TodayPerson;
  /** Ligne « à faire maintenant » : surface mise en avant (halo possible côté design system). */
  emphasis?: boolean;
  /** Validation optimiste en cours ou réussie sur cet écran (joue l'animation). */
  celebrate?: boolean;
  busy?: 'complete' | 'accept' | null;
  onComplete: (x: TodayTask) => void;
  onAccept: (x: TodayTask) => void;
  DoneComponent: React.ComponentType<DoneMarkProps>;
}

export function TodayTaskRow({ x, owner, emphasis, celebrate = false, busy, onComplete, onAccept, DoneComponent }: TodayTaskRowProps) {
  const t = useTheme();
  const colorOf = useStatusColor();
  const done = x.done || !!celebrate;
  const status: TodayStatus = done ? 'done' : x.status;
  const color = colorOf(status);
  const label = statusLabel({ status, kind: x.kind });
  const when = whenLabel(x);
  const who = x.ownerId ? owner.name : tr('ht.nobody');
  const a11y = [x.title, label, x.ownerId ? tr('ht.by', { name: who }) : who, when].join('. ');

  const body = (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }} testID={`today-row-${x.id}`}>
      {x.ownerId ? (
        <UserAvatar path={owner.avatarPath} initial={owner.initial} size={36} testID={`today-avatar-${x.id}`} />
      ) : (
        <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt, borderWidth: 1, borderColor: t.colors.border }}>
          <Icon name="user-plus" size={16} color={t.colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Tappable accessibilityRole="button" accessibilityLabel={a11y} accessibilityHint={tr('ht.openHint')} onPress={() => openTask(x)} pressScale={0.99}
          testID={`today-open-${x.id}`} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', gap: 2 }}>
          <Text weight="bold" numberOfLines={2} style={{ textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.75 : 1 }}>{x.title}</Text>
          <Text variant="small" muted numberOfLines={2}>{[who, when, x.kind === 'mission' ? tr('ht.mission') : null].filter(Boolean).join(' · ')}</Text>
        </Tappable>
        {/* Statut (icône + libellé) et actions possibles sur une même ligne, qui passe à la ligne sur petit écran */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }}>
          <View testID={`today-status-${x.id}`} accessibilityRole="text" accessibilityLabel={tr('ht.statusA11y', { status: label })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 10, minHeight: 28, borderRadius: radius.pill, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt }}>
            <DoneComponent done={done} celebrate={!!celebrate} icon={STATUS_ICON[status]} color={color} size={20} />
            <Text variant="caption" weight="bold" color={color}>{label}</Text>
          </View>
          {!done && x.canAccept ? (
            <Button label={tr('mis.reply.accept')} icon="thumbs-up" variant="secondary" onPress={() => onAccept(x)} loading={busy === 'accept'} disabled={!!busy}
              testID={`today-accept-${x.id}`} accessibilityLabel={tr('ht.acceptA11y', { title: x.title })} />
          ) : null}
          {!done && x.canComplete ? (
            <Button label={x.kind === 'mission' ? tr('mis.reply.complete') : tr('ht.markDone')} icon="check" variant={emphasis || x.rank <= 1 ? 'primary' : 'secondary'}
              onPress={() => onComplete(x)} loading={busy === 'complete'} disabled={!!busy} testID={`today-complete-${x.id}`}
              accessibilityLabel={tr('ht.completeA11y', { title: x.title })} />
          ) : null}
        </View>
      </View>
    </View>
  );

  if (emphasis && (!x.done || celebrate)) return <TodayEmphasisSurface label={x.awaitsMe ? tr('ht.awaitsYou') : tr('ht.now')} testID="today-emphasis">{body}</TodayEmphasisSurface>;
  return body;
}
