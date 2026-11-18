/**
 * Espace Nounou d'un enfant : carnet de liaison du jour (chronologie, auteur et heure de chaque saisie), ajout rapide
 * à une main, sieste en cours terminée d'un appui, liens vers la journée, les photos, les messages et — pour les
 * parents — les accès et réglages. Les saisies sont celles du suivi existant (mêmes tables).
 */
import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { todayISO } from '@/lib/domain/dates';
import { useOfflineStore } from '@/lib/offline';
import { friendlyError } from '@/lib/data/hooks-settings';
import { purgeExpiredCarePhotos, useCareChild, useCareDay, useCareMemberNames, useEndSleep } from '@/lib/data/hooks-nounou';
import { flushCareOutbox } from '@/lib/nounou/photoUpload';
import { AbsenceNote, CareRow, useAuthorLabel } from '@/features/nounou/CareUI';

const QUICK: { type: string; icon: IconName; label: TKey }[] = [
  { type: 'bottle', icon: 'droplet', label: 'nn.kind.bottle' },
  { type: 'meal', icon: 'coffee', label: 'nn.kind.meal' },
  { type: 'sleep', icon: 'moon', label: 'nn.kind.sleep' },
  { type: 'diaper', icon: 'refresh-cw', label: 'nn.kind.diaper' },
  { type: 'activity', icon: 'sun', label: 'nn.kind.activity' },
  { type: 'observation', icon: 'eye', label: 'nn.kind.observation' },
  { type: 'arrival', icon: 'log-in', label: 'nn.kind.arrival' },
  { type: 'departure', icon: 'log-out', label: 'nn.kind.departure' },
];

function QuickTile({ icon, label, onPress, testID, tone }: { icon: IconName; label: string; onPress: () => void; testID: string; tone?: 'danger' }) {
  const t = useTheme();
  const danger = tone === 'danger';
  return (
    <Tappable onPress={onPress} testID={testID} accessibilityRole="button" accessibilityLabel={label}
      style={{ flexGrow: 1, flexBasis: '30%', minWidth: 92, minHeight: 76, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: danger ? t.colors.dangerSoft : t.colors.surface, borderWidth: 1, borderColor: danger ? t.colors.danger : t.colors.border }}>
      <Icon name={icon} size={24} color={danger ? t.colors.danger : t.colors.primary} />
      <Text weight="bold" center variant="small" color={danger ? t.colors.danger : undefined}>{label}</Text>
    </Tappable>
  );
}

export default function CareSpace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useUserId();
  const toast = useToast();
  const { child, role, loading, photosAllowed } = useCareChild(id);
  const day = todayISO();
  const dayQ = useCareDay(child ? id : null, day);
  const names = useCareMemberNames(child?.household_id);
  const authorOf = useAuthorLabel(names.data);
  const endSleep = useEndSleep();
  const pendingCount = useOfflineStore((s) => s.pending.filter((p) => p.row.child_id === id).length);

  // Parents : purge des photos dont la conservation est dépassée (en plus de la purge planifiée côté serveur)
  useEffect(() => { if (role === 'parent') void purgeExpiredCarePhotos(); }, [role]);
  // Photos en attente : renvoyées au retour du réseau ou au premier plan
  useEffect(() => {
    void flushCareOutbox(me);
    const a = NetInfo.addEventListener((s) => { if (s.isConnected) void flushCareOutbox(me); });
    const b = AppState.addEventListener('change', (s) => { if (s === 'active') { void flushCareOutbox(me); void dayQ.refetch(); } });
    return () => { a(); b.remove(); };
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Screen back title={tr('nn.space.title')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child || !role) {
    return (
      <Screen back title={tr('nn.space.title')} tool={false}>
        <EmptyState icon="lock" title={tr('nn.space.noAccess')} body={tr('nn.space.noAccessBody')} action={{ label: tr('nn.home.title'), onPress: () => router.replace('/garde' as never) }} />
      </Screen>
    );
  }
  const items = dayQ.items ?? [];
  const openSleep = items.find((i) => i.kind === 'sleep' && !i.endAt && !i.pending);
  const go = (type: string) => router.push(`/garde/${id}/ajouter?type=${type}` as never);
  return (
    <Screen back title={tr('nn.space.of', { name: child.first_name })} subtitle={role === 'caregiver' ? tr('nn.space.subCaregiver') : tr('nn.space.subParent')} tool={false}>
      {pendingCount ? <Banner tone="info" icon="upload-cloud" title={tr('nn.pendingTitle', { count: pendingCount })}>{tr('nn.pendingBody')}</Banner> : null}
      {openSleep ? (
        <Card tone="lavender" testID="care-open-sleep">
          <Text weight="bold">{tr('nn.sleep.ongoing')}</Text>
          <Button label={tr('nn.sleep.end')} icon="sunrise" size="lg" full style={{ marginTop: spacing.sm }} loading={endSleep.isPending}
            onPress={() => endSleep.mutateAsync(openSleep.id).then(() => toast(tr('nn.saved'), 'success')).catch((e) => toast(friendlyError(e), 'error'))} testID="care-end-sleep-main" />
        </Card>
      ) : null}
      <Text variant="label">{tr('nn.add.cta')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {QUICK.filter((q) => !(q.type === 'sleep' && openSleep)).map((q) => <QuickTile key={q.type} icon={q.icon} label={tr(q.label)} onPress={() => go(q.type)} testID={`care-quick-${q.type}`} />)}
        {role === 'caregiver' && photosAllowed ? <QuickTile icon="camera" label={tr('nn.kind.photo')} onPress={() => router.push(`/garde/${id}/photo` as never)} testID="care-quick-photo" /> : null}
        <QuickTile icon="alert-triangle" label={tr('nn.kind.important')} tone="danger" onPress={() => go('important')} testID="care-quick-important" />
      </View>
      <Card>
        <Text variant="heading">{tr('nn.journal.today')}</Text>
        {dayQ.isLoading && !dayQ.items ? <Skeleton rows={3} /> : dayQ.isError && !dayQ.items ? (
          <ErrorView error={dayQ.error} onRetry={() => void dayQ.refetch()} />
        ) : !items.length ? (
          <Text muted style={{ marginTop: spacing.xs }} testID="care-journal-empty">{tr('nn.journal.empty')}</Text>
        ) : items.map((it) => (
          <CareRow key={`${it.kind}-${it.id}`} item={it} author={authorOf(it.authorId, it.origin)} ending={endSleep.isPending}
            onEndSleep={() => endSleep.mutateAsync(it.id).catch((e) => toast(friendlyError(e), 'error'))} />
        ))}
        <View style={{ marginTop: spacing.xs }}><AbsenceNote /></View>
      </Card>
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('nn.day.title', { name: child.first_name })} icon="calendar" variant="secondary" full onPress={() => router.push(`/garde/${id}/journee` as never)} testID="care-open-day" />
        <Button label={tr('nn.album.title')} icon="image" variant="secondary" full onPress={() => router.push(`/garde/${id}/photos` as never)} testID="care-open-photos" />
        <Button label={tr('nn.msg.title')} icon="message-circle" variant="secondary" full onPress={() => router.push(`/garde/${id}/messages` as never)} testID="care-open-messages" />
        {role === 'parent' ? <Button label={tr('nn.access.title')} icon="shield" variant="secondary" full onPress={() => router.push(`/garde/${id}/acces` as never)} testID="care-open-access" /> : null}
      </View>
    </Screen>
  );
}
