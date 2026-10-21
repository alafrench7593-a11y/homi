/**
 * Parcours : libellés, cartes d'accueil propres à chaque profil, et fenêtre de confirmation
 * « archiver ou supprimer les anciennes données » (archivage par défaut).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from '@/components/Overlays';
import { Button, Card, haptic, Icon, type IconName, Row, Text } from '@/components/ui';
import { FamilyHomeCard } from '@/features/familyLoad';
import { useActivePregnancy, useActiveSubject, useExpectedBabies, useJourneyState, useTrackedChildren } from '@/lib/data/hooks';
import { useTreatments } from '@/lib/data/hooks-needs';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import type { CloseMode, JourneyRow, JourneyType } from '@/lib/journeys/model';
import type { Child } from '@/lib/types';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export const JOURNEY_ICON: Record<JourneyType, IconName> = {
  avoid: 'shield', ttc: 'sunrise', cycle: 'calendar', pregnancy: 'moon', postpartum: 'heart', baby: 'smile', child: 'users',
};
export const journeyLabel = (type: JourneyType) => tr(`pj.type.${type}` as TKey);
/** Profil associé à un parcours (« Bébé Lina », « Grossesse · terme le 12 mars »). */
export function useJourneyProfileLabel() {
  const { data: children } = useTrackedChildren();
  return (j: JourneyRow, allChildren?: Child[]) => {
    const kids = allChildren ?? children ?? [];
    if ((j.type === 'baby' || j.type === 'child') && j.child_id) {
      const c = kids.find((x) => x.id === j.child_id);
      return c ? tr(j.type === 'baby' ? 'pj.profile.baby' : 'pj.profile.child', { name: c.first_name }) : journeyLabel(j.type);
    }
    return journeyLabel(j.type);
  };
}
export const journeyDates = (j: JourneyRow) => (j.ended_on
  ? tr('pj.dates.range', { from: formatDate(j.started_on, { day: 'numeric', month: 'short', year: 'numeric' }), to: formatDate(j.ended_on, { day: 'numeric', month: 'short', year: 'numeric' }) })
  : tr('pj.dates.since', { from: formatDate(j.started_on, { day: 'numeric', month: 'short', year: 'numeric' }) }));

// ---------------------------------------------------------------- confirmation de changement
export interface ChangeRequest { title: string; next?: string | null; closing?: JourneyRow | null; closingLabel?: string; allowDelete?: boolean }

/**
 * Étapes 1 et 2 du changement : confirmation, puis « archiver (par défaut) ou supprimer » les anciennes données.
 * Ne fait rien elle-même : `onConfirm(mode)` reçoit le choix.
 */
export function ChangeSheet({ req, onClose, onConfirm, busy }: { req: ChangeRequest | null; onClose: () => void; onConfirm: (mode: CloseMode) => void; busy?: boolean }) {
  const t = useTheme();
  const [mode, setMode] = useState<CloseMode>('archive');
  React.useEffect(() => { if (req) setMode('archive'); }, [req]);
  const closing = req?.closing;
  const opt = (m: CloseMode, title: string, body: string, icon: IconName) => (
    <Tappable
      key={m}
      testID={`mode-${m}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: mode === m }}
      accessibilityLabel={`${title}. ${body}`}
      onPress={() => { haptic('selection'); setMode(m); }}
      style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: mode === m ? (m === 'delete' ? t.colors.danger : t.colors.primary) : t.colors.border, backgroundColor: mode === m ? t.colors.surfaceAlt : t.colors.surface }}
    >
      <Icon name={icon} color={m === 'delete' ? t.colors.danger : t.colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold">{title}</Text>
        <Text variant="small" muted>{body}</Text>
      </View>
      <Icon name={mode === m ? 'check-circle' : 'circle'} color={mode === m ? t.colors.primary : t.colors.textMuted} />
    </Tappable>
  );
  return (
    <Sheet visible={!!req} onClose={onClose} title={req?.title ?? ''}>
      {req?.next ? <Text>{tr('pj.change.next', { name: req.next })}</Text> : null}
      {closing ? (
        <>
          <Text>{tr('pj.change.closing', { name: req?.closingLabel ?? journeyLabel(closing.type) })}</Text>
          {closing.type === 'pregnancy' ? <Text variant="small" muted>{tr('pj.change.pregnancyNote')}</Text> : null}
          <Text weight="bold" style={{ marginTop: spacing.xs }}>{tr('pj.change.dataQuestion')}</Text>
          {opt('archive', tr('pj.mode.archive'), tr('pj.mode.archiveBody'), 'archive')}
          {req?.allowDelete !== false ? opt('delete', tr('pj.mode.delete'), closing.type === 'baby' || closing.type === 'child' ? tr('pj.mode.deleteChildBody') : tr('pj.mode.deleteBody'), 'trash-2') : null}
          <Text variant="caption" muted>{tr('pj.change.reminders')}</Text>
        </>
      ) : null}
      <Button label={mode === 'delete' && closing ? tr('pj.change.confirmDelete') : tr('pj.change.confirm')} variant={mode === 'delete' && closing ? 'danger' : 'primary'} onPress={() => onConfirm(mode)} loading={busy} full testID="change-confirm" />
      <Button label={tr('common.cancel')} variant="ghost" onPress={onClose} full />
    </Sheet>
  );
}

// ---------------------------------------------------------------- cartes d'accueil
/** Enfant de plus de 2 ans : croissance, repas, besoins particuliers — pas de biberons ni de couches. */
export function ChildHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const { data: treatments } = useTreatments(child.id);
  const active = (treatments ?? []).filter((x) => x.active && (!x.end_date || x.end_date >= new Date().toISOString().slice(0, 10)));
  const link = (icon: IconName, label: string, href: string, testID?: string) => (
    <Tappable key={href} testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href as never)}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.background })}>
      <Icon name={icon} size={18} color={t.colors.primary} />
      <Text variant="small" weight="bold" style={{ flex: 1 }}>{label}</Text>
    </Tappable>
  );
  return (
    <Card>
      <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('pj.profile.child', { name: child.first_name }).toUpperCase()}</Text>
      <Text variant="title" style={{ marginTop: 2 }}>{child.first_name}</Text>
      <Text variant="small" muted>{childAge(child.birth_date).label}</Text>
      {active.length ? <Text variant="small" style={{ marginTop: spacing.xs }}>{tr('pj.child.treatments', { count: active.length })}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
        {link('trending-up', tr('tool.kid_growth'), `/child/${child.id}/growth`)}
        {link('compass', tr('tool.kid_needs'), `/child/${child.id}/needs`, 'home-needs')}
        {link('smile', tr('pj.child.profile'), `/child/${child.id}`)}
      </View>
    </Card>
  );
}

/** « Toute la famille » : chaque profil suivi, puis l'organisation du foyer. Toucher un profil l'affiche. */
export function FamilyOverview() {
  const t = useTheme();
  const { setSubject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { data: children } = useTrackedChildren();
  const js = useJourneyState();
  const rows: { key: string; icon: IconName; title: string; sub: string; onPress: () => void }[] = [];
  if (pregnancy) {
    const names = babies?.map((b) => b.nickname).filter(Boolean).join(' · ');
    rows.push({ key: 'p', icon: 'moon', title: names || tr('pj.subject.pregnancy'), sub: pregnancyProgress(pregnancy.due_date).label, onPress: () => setSubject({ type: 'pregnancy', id: pregnancy.id }) });
  }
  for (const c of children ?? []) {
    rows.push({ key: c.id, icon: 'smile', title: tr(js.childType(c.id) === 'baby' ? 'pj.profile.baby' : 'pj.profile.child', { name: c.first_name }), sub: childAge(c.birth_date).label, onPress: () => setSubject({ type: 'child', id: c.id }) });
  }
  return (
    <View style={{ gap: spacing.xs }}>
      <Card>
        <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('pj.family.title')}</Text>
        {rows.map((r) => (
          <Tappable key={r.key} accessibilityRole="button" accessibilityLabel={`${r.title}, ${r.sub}`} onPress={() => { haptic('selection'); r.onPress(); }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, opacity: pressed ? 0.7 : 1 })}>
            <Icon name={r.icon} color={t.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{r.title}</Text>
              <Text variant="small" muted>{r.sub}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
          </Tappable>
        ))}
      </Card>
      <FamilyHomeCard />
    </View>
  );
}

export function NoJourneyCard() {
  return (
    <Card onPress={() => router.push('/journeys')} accessibilityLabel={tr('pj.none.title')}>
      <Row>
        <Icon name="compass" />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('pj.none.title')}</Text>
          <Text variant="small" muted>{tr('pj.none.body')}</Text>
        </View>
        <Icon name="chevron-right" size={18} />
      </Row>
    </Card>
  );
}
