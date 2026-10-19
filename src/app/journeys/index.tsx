/**
 * « Modifier mon parcours » : parcours actifs, changement (confirmation → archiver ou supprimer → fermeture
 * de l'ancien → nouveau parcours propre → outils, accueil et rappels recalculés) et « Mes parcours précédents ».
 * Plusieurs parcours à la fois sont possibles (enceinte avec deux enfants, par exemple).
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Sheet, useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, haptic, Icon, ListRow, SectionTitle, Text } from '@/components/ui';
import { ChangeSheet, JOURNEY_ICON, journeyDates, journeyLabel, useJourneyProfileLabel, type ChangeRequest } from '@/features/journeys';
import { useUserId } from '@/lib/auth';
import { ensureHousehold, useActivePregnancy, useActiveSubject, useChildren, useHouseholdId, useJourneyState } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { childAge } from '@/lib/domain/child';
import { useRunJourneyOps } from '@/lib/journeys/manager';
import { closeOps, planChange, type ChangeTarget, type CloseMode, type JourneyRow, type JourneyType } from '@/lib/journeys/model';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

/** Les six parcours demandés, plus le simple suivi du cycle (conservé). */
const CHOICES: { type: JourneyType; key: string }[] = [
  { type: 'avoid', key: 'avoid' }, { type: 'ttc', key: 'ttc' }, { type: 'pregnancy', key: 'pregnancy' },
  { type: 'postpartum', key: 'postpartum' }, { type: 'baby', key: 'baby' }, { type: 'child', key: 'child' }, { type: 'cycle', key: 'cycle' },
];

type Pending = ChangeRequest & { target: ChangeTarget | null; closingRow: JourneyRow | null; reason: string };

export default function Journeys() {
  const t = useTheme();
  const toast = useToast();
  const userId = useUserId();
  const hid = useHouseholdId();
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { data: allChildren } = useChildren();
  const { setSubject } = useActiveSubject();
  const profileLabel = useJourneyProfileLabel();
  const { run, busy } = useRunJourneyOps();
  const [pending, setPending] = useState<Pending | null>(null);
  const [pickChild, setPickChild] = useState<'baby' | 'child' | null>(null);

  const hasActive = (type: JourneyType) => js.active.some((r) => r.type === type);

  function choose(type: JourneyType) {
    haptic('selection');
    if (type === 'pregnancy') { router.push(pregnancy ? '/pregnancy' : '/pregnancy/start'); return; }
    if (type === 'postpartum') {
      if (pregnancy) { router.push('/pregnancy/end'); return; }
      if (hasActive('postpartum')) { toast(tr('pj.already'), 'info'); return; }
      setPending({ title: tr('pj.change.title'), next: journeyLabel('postpartum'), target: { type: 'postpartum' }, closingRow: null, reason: 'changed' });
      return;
    }
    if (type === 'baby' && pregnancy) { router.push('/pregnancy/end?outcome=born'); return; }
    if (type === 'baby' || type === 'child') { setPickChild(type); return; }
    // éviter / projet bébé / cycle : un seul parcours « corps » actif à la fois
    if (js.body?.type === type) { toast(tr('pj.already'), 'info'); return; }
    const closing = js.body;
    setPending({
      title: tr('pj.change.title'), next: journeyLabel(type), target: { type: type as ChangeTarget['type'] },
      closing, closingRow: closing, closingLabel: closing ? profileLabel(closing, allChildren) : undefined, reason: 'changed',
    });
  }

  function chooseChild(childId: string, type: 'baby' | 'child') {
    setPickChild(null);
    const current = js.active.find((r) => (r.type === 'baby' || r.type === 'child') && r.child_id === childId);
    if (current?.type === type) { toast(tr('pj.already'), 'info'); return; }
    const name = allChildren?.find((c) => c.id === childId)?.first_name ?? '';
    setPending({ title: tr('pj.change.title'), next: tr(type === 'baby' ? 'pj.profile.baby' : 'pj.profile.child', { name }), target: { type, childId, householdId: hid }, closing: null, closingRow: null, reason: 'changed' });
  }

  function end(j: JourneyRow) {
    if (j.type === 'pregnancy') { router.push('/pregnancy/end'); return; }
    setPending({ title: tr('pj.end.title'), next: null, target: null, closing: j, closingRow: j, closingLabel: profileLabel(j, allChildren), reason: j.type === 'baby' || j.type === 'child' ? 'grew_up' : 'changed' });
  }

  async function confirmChange(mode: CloseMode) {
    if (!pending || !userId) return;
    try {
      const today = todayISO();
      const h = pending.target?.type === 'baby' || pending.target?.type === 'child' ? pending.target.householdId ?? hid ?? (await ensureHousehold()) : null;
      const ops = pending.target
        ? planChange(js.rows, userId, { ...pending.target, householdId: h ?? pending.target.householdId }, mode, today, pregnancy ? [pregnancy.id] : [])
        : closeOps(pending.closingRow!, mode, pending.reason, today, !!pregnancy && pending.closingRow?.pregnancy_id === pregnancy.id);
      await run(ops);
      // Le profil affiché suit le nouveau parcours ; l'accueil, les outils et les rappels sont recalculés
      if (pending.target?.type === 'baby' || pending.target?.type === 'child') setSubject({ type: 'child', id: pending.target.childId! });
      else if (pending.target?.type === 'postpartum') setSubject({ type: 'postpartum' });
      else if (pending.target) setSubject({ type: 'me' });
      else setSubject(null);
      haptic('success');
      toast(mode === 'delete' && pending.closingRow ? tr('pj.toast.deleted') : tr('pj.toast.changed'), 'success');
      setPending(null);
      router.replace('/(tabs)');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const kidsFor = (type: 'baby' | 'child') => (allChildren ?? []).filter((c) => (type === 'baby' ? childAge(c.birth_date).months < 24 : true));

  return (
    <Screen back title={tr('pj.editJourney')} subtitle={tr('pj.manager.subtitle')}>
      {js.query.isLoading && !js.loaded ? <Skeleton rows={4} /> : js.query.isError && !js.loaded ? (
        <ErrorView error={js.query.error} onRetry={() => void js.query.refetch()} title={tr('journeys.loadError')} />
      ) : (
        <>
          <SectionTitle title={tr('pj.manager.active')} />
          <Card>
            {js.active.length ? js.active.map((j) => (
              <ListRow
                key={j.id}
                icon={JOURNEY_ICON[j.type]}
                title={profileLabel(j, allChildren)}
                subtitle={journeyDates(j)}
                right={<Button label={tr('pj.end.button')} size="sm" variant="secondary" onPress={() => end(j)} testID={`end-${j.type}`} />}
              />
            )) : <Text muted testID="no-active">{tr('pj.manager.noneActive')}</Text>}
          </Card>
          {js.active.filter((r) => r.type !== 'pregnancy').length + (pregnancy ? 1 : 0) > 1 ? <Text variant="small" muted>{tr('pj.manager.multi')}</Text> : null}

          <SectionTitle title={tr('pj.manager.choose')} />
          <View style={{ gap: spacing.xs }} accessibilityRole="list">
            {CHOICES.map((c) => {
              const on = c.type === 'pregnancy' ? !!pregnancy : hasActive(c.type);
              return (
                <Pressable
                  key={c.key}
                  testID={`choose-${c.type}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${tr(`pj.choice.${c.type}` as TKey)}. ${tr(`pj.choice.${c.type}.hint` as TKey)}`}
                  onPress={() => choose(c.type)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? t.colors.accentSoft : pressed ? t.colors.surfaceAlt : t.colors.surface })}
                >
                  <Icon name={JOURNEY_ICON[c.type]} color={on ? t.colors.primary : t.colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">{tr(`pj.choice.${c.type}` as TKey)}</Text>
                    <Text variant="small" muted>{tr(`pj.choice.${c.type}.hint` as TKey)}</Text>
                  </View>
                  {on ? <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('pj.activeBadge')}</Text> : <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
                </Pressable>
              );
            })}
          </View>
          {js.body?.type !== 'pregnancy' ? (
            <Button label={tr('pj.start.button')} icon="heart" onPress={() => router.push('/pregnancy/start')} full testID="start-pregnancy" />
          ) : null}

          <SectionTitle title={tr('pj.manager.previous')} />
          <Card>
            {js.archived.length ? js.archived.map((j) => (
              <ListRow key={j.id} icon={JOURNEY_ICON[j.type]} title={profileLabel(j, allChildren)} subtitle={`${journeyDates(j)}${j.end_reason ? ` · ${tr(`pj.reason.${j.end_reason}` as TKey)}` : ''}`} onPress={() => router.push(`/journeys/${j.id}`)} />
            )) : <Text muted testID="no-archived">{tr('pj.manager.noneArchived')}</Text>}
          </Card>
          <Banner tone="info">{tr('pj.manager.privacy')}</Banner>
        </>
      )}

      <ChangeSheet req={pending} onClose={() => setPending(null)} onConfirm={(m) => void confirmChange(m)} busy={busy} />
      <Sheet visible={!!pickChild} onClose={() => setPickChild(null)} title={pickChild ? tr(`pj.choice.${pickChild}` as TKey) : ''}>
        {pickChild && kidsFor(pickChild).map((c) => (
          <ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => chooseChild(c.id, pickChild)} />
        ))}
        <Button label={tr('pj.addChild')} icon="plus" variant="secondary" onPress={() => { setPickChild(null); router.push('/profiles/new?kind=child'); }} full testID="add-child" />
      </Sheet>
    </Screen>
  );
}
