/**
 * Carte d'une mission (listes Reçues / Envoyées) et pastille d'état. Verre HOMI (Card), mouvement de src/motion
 * (LiftCard : la carte s'élève avant d'ouvrir le détail). Aucun « vu », aucun compteur par personne.
 */
import React from 'react';
import { View } from 'react-native';
import { LiftCard } from '@/motion';
import { Icon, Text } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import { categoryOf } from '@/lib/domain/familyLoad';
import { STATE_LABEL, STATE_TONE, viewerOf, type Mission, type MissionState } from '@/lib/domain/missions';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { fmtWhen } from '@/features/familyLoad';

export function missionWhen(m: Pick<Mission, 'due_at' | 'all_day'>): string {
  if (!m.due_at) return tr('mis.noDue');
  return m.all_day ? tr('mis.allDay', { date: formatDate(m.due_at, { weekday: 'short', day: 'numeric', month: 'short' }) }) : fmtWhen(m.due_at);
}

export function StatePill({ state, testID }: { state: MissionState; testID?: string }) {
  const t = useTheme();
  const tone = STATE_TONE[state];
  const c = tone === 'accent' ? t.colors.primary : tone === 'done' ? t.colors.success : tone === 'calm' ? t.colors.text : t.colors.textMuted;
  return (
    <View testID={testID} accessibilityRole="text" style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 26, borderRadius: radius.pill,
      backgroundColor: tint(c, t.isDark ? 0.22 : 0.12), borderWidth: 1, borderColor: tint(c, 0.3) }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
      <Text variant="caption" weight="bold" color={c}>{tr(STATE_LABEL[state])}</Text>
    </View>
  );
}

export function MissionCard({ m, me, labelOf, onOpen }: { m: Mission; me: string; labelOf: (id: string | null | undefined) => string; onOpen: () => void }) {
  const t = useTheme();
  const v = viewerOf(m, me);
  const cat = categoryOf(m.category);
  const who = v === 'creator' ? (m.assignee_id ? tr('mis.to', { person: labelOf(m.assignee_id) }) : tr('mis.open')) : m.created_by === me ? tr('mis.fromYou') : tr('mis.from', { person: labelOf(m.created_by) });
  const dim = m.mission_state === 'done' || m.mission_state === 'cancelled';
  return (
    <LiftCard testID={`mission-${m.id}`} accessibilityLabel={`${m.title}. ${tr(STATE_LABEL[m.mission_state])}. ${who}`} onOpen={onOpen} radius={radius.lg} shadowColor={palette.night}
      style={{ padding: spacing.md, gap: spacing.xs, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, opacity: dim ? 0.78 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, t.isDark ? 0.2 : 0.1) }}>
          <Icon name={cat.icon} size={20} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text weight="bold">{m.title}</Text>
          <Text variant="small" muted>{[who, missionWhen(m)].join(' · ')}</Text>
          {m.product_label ? <Text variant="caption" muted>{tr('mis.detail.product', { label: m.product_label })}</Text> : null}
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </View>
      <StatePill state={m.mission_state} />
    </LiftCard>
  );
}
