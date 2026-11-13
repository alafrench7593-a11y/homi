/**
 * Missions (refonte 16/11/2026) : ligne de liste lisible (surface mate), statut (icône + libellé), pastille d'état et
 * synthèse en tuiles de résultat. Personnes nommées par leur PRÉNOM (household_member_names), avatar compris.
 * Aucun « vu », aucun compteur par personne, aucun classement.
 */
import React from 'react';
import { View } from 'react-native';
import { Icon, Text, type IconName } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { CardSource, DataTile } from '@/features/scene';
import { categoryOf } from '@/lib/domain/familyLoad';
import { isTerminal, STATE_LABEL, STATE_TONE, viewerOf, type Mission, type MissionState } from '@/lib/domain/missions';
import type { Person } from '@/lib/data/hooks-family-load';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { fmtWhen } from '@/features/familyLoad';

export function missionWhen(m: Pick<Mission, 'due_at' | 'all_day'>): string {
  if (!m.due_at) return tr('mis.noDue');
  return m.all_day ? tr('mis.allDay', { date: formatDate(m.due_at, { weekday: 'short', day: 'numeric', month: 'short' }) }) : fmtWhen(m.due_at);
}

export const STATE_ICON: Record<MissionState, IconName> = {
  pending: 'inbox', accepted: 'thumbs-up', in_progress: 'play-circle', postponed: 'clock', done: 'check-circle', declined: 'x-circle', cancelled: 'slash',
};

export function useStateColor() {
  const t = useTheme();
  return (state: MissionState) => {
    const tone = STATE_TONE[state];
    return tone === 'accent' ? t.colors.primary : tone === 'done' ? t.colors.success : tone === 'calm' ? t.colors.text : t.colors.textMuted;
  };
}

/** Statut en ligne : icône + libellé (jamais la couleur seule). */
export function StateLabel({ state, testID }: { state: MissionState; testID?: string }) {
  const c = useStateColor()(state);
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={STATE_ICON[state]} size={14} color={c} />
      <Text variant="small" weight="bold" color={c}>{tr(STATE_LABEL[state])}</Text>
    </View>
  );
}

/** Pastille d'état (en-tête du détail, stock lié) : icône + libellé, contour discret. */
export function StatePill({ state, testID }: { state: MissionState; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityRole="text" style={{ alignSelf: 'flex-start', paddingHorizontal: 10, minHeight: 28, justifyContent: 'center', borderRadius: radius.pill,
      borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.material.lines.controlFill }}>
      <StateLabel state={state} />
    </View>
  );
}

/** La personne « en face » : pour une mission reçue, qui la demande ; pour une mission envoyée, à qui. */
export function counterpart(m: Mission, me: string): { id: string | null; line: (name: string) => string } {
  const v = viewerOf(m, me);
  if (v === 'creator') return m.assignee_id ? { id: m.assignee_id, line: (name) => tr('mis.to', { person: name }) } : { id: null, line: () => tr('mis.open') };
  if (m.created_by === me) return { id: null, line: () => tr('mis.fromYou') };
  return { id: m.created_by, line: (name) => tr('mis.asks', { person: name }) };
}

export function MissionRow({ m, me, personOf, onOpen }: { m: Mission; me: string; personOf: (id: string | null | undefined) => Person | null; onOpen: () => void }) {
  const t = useTheme();
  const cat = categoryOf(m.category);
  const c = counterpart(m, me);
  const p = personOf(c.id);
  const who = c.line(p?.name ?? tr('u7.people.former'));
  const when = missionWhen(m);
  const dim = m.mission_state === 'done' || m.mission_state === 'cancelled';
  return (
    <CardSource sourceKey={`mission:${m.id}`} onOpen={onOpen} testID={`mission-${m.id}`} accessibilityLabel={[m.title, tr(STATE_LABEL[m.mission_state]), who, when].join('. ')}
      accessibilityHint={tr('ht.openHint')}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: MIN_TOUCH + 12, paddingVertical: spacing.sm, opacity: dim ? 0.72 : 1 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
        <Icon name={cat.icon} size={18} color={t.colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text weight="bold" numberOfLines={2} style={{ textDecorationLine: m.mission_state === 'cancelled' ? 'line-through' : 'none' }}>{m.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {p ? <UserAvatar path={p.avatarPath} initial={p.initial} size={20} /> : null}
          <Text variant="small" muted numberOfLines={1} style={{ flexShrink: 1 }} testID={`mission-who-line-${m.id}`}>{who}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, flexWrap: 'wrap' }}>
          <StateLabel state={m.mission_state} testID={`mission-row-state-${m.id}`} />
          <Text variant="small" muted>{when}</Text>
        </View>
      </View>
      <View style={{ paddingTop: 8 }}><Icon name="chevron-right" size={18} color={t.colors.textMuted} /></View>
    </CardSource>
  );
}

/** Synthèse en tuiles de résultat : à répondre (moi), en cours (foyer), terminées ces 7 derniers jours. */
export function MissionTiles({ all, received, me, now = new Date() }: { all: Mission[]; received: Mission[]; me: string; now?: Date }) {
  const answer = received.filter((m) => (m.mission_state === 'pending' || m.mission_state === 'postponed') && viewerOf(m, me) !== 'creator').length;
  const active = all.filter((m) => m.mission_state === 'accepted' || m.mission_state === 'in_progress').length;
  const week = now.getTime() - 7 * 86400_000;
  const done = all.filter((m) => m.mission_state === 'done' && Date.parse(m.done_at ?? m.updated_at ?? m.created_at) >= week).length;
  const val = (n: number) => (n ? String(n) : null);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} testID="mission-tiles">
      <DataTile value={val(answer)} label={tr('mis.tile.answer')} context={tr('mis.tile.answerCtx')} empty={tr('mis.tile.answerNone')} icon="inbox" tone="accent" testID="mission-tile-answer" />
      <DataTile value={val(active)} label={tr('mis.tile.active')} context={tr('mis.tile.activeCtx')} empty={tr('mis.tile.none')} icon="play-circle" testID="mission-tile-active" />
      <DataTile value={val(done)} label={tr('mis.tile.done')} context={tr('mis.tile.doneCtx')} empty={tr('mis.tile.none')} icon="check-circle" tone="done" testID="mission-tile-done" />
    </View>
  );
}

export const isOpenMission = (m: Mission) => !isTerminal(m.mission_state) && m.mission_state !== 'declined';
