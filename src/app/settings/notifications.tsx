/**
 * « Mes notifications » (07/11/2026) : ce que la maman reçoit, au même endroit.
 *  - automatiques : rendez-vous (veille 19 h + 1 h avant), tâches du foyer, échéances à préparer, papiers qui expirent ;
 *  - minuteur biberon (réglage existant) et rappels/médicaments (page des rappels) ;
 *  - heures calmes : les notifications automatiques sont décalées au matin ; médicaments et biberon ne le sont jamais.
 * Réglages propres à CE téléphone ; tout est programmé sur le téléphone, rien n'est envoyé à un service extérieur.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { useAutoNotificationsSync, useAutoPrefs, useSaveAutoPrefs } from '@/lib/data/hooks-autoNotifs';
import { DEFAULT_AUTO_PREFS, type AutoPrefs } from '@/lib/domain/autoNotifs';
import { getBottleNotificationsEnabled, getPermission, notificationsSupported, requestPermission, sendTestNotification, setBottleNotificationsEnabled, syncAutoNotifications, type PermissionState } from '@/lib/notifications';
import { spacing } from '@/theme/tokens';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';

export default function NotificationSettings() {
  const toast = useToast();
  const { data } = useAutoPrefs();
  const save = useSaveAutoPrefs();
  const prefs = data ?? DEFAULT_AUTO_PREFS;
  const plans = useAutoNotificationsSync() ?? [];
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [bottle, setBottle] = useState(true);
  useEffect(() => { void getPermission().then(setPerm); void getBottleNotificationsEnabled().then(setBottle); }, []);
  const set = (patch: Partial<AutoPrefs>) => save.mutate({ ...prefs, ...patch });

  return (
    <Screen back title={tr('nt.title')} subtitle={tr('nt.subtitle')}>
      {!notificationsSupported ? <Banner tone="info" icon="smartphone">{tr('nt.webOnly')}</Banner>
        : perm !== 'granted' ? (
          <Banner tone="warning" icon="bell-off" title={tr('nt.permOff')}
            action={<Button label={tr('nt.permAsk')} size="sm" onPress={() => void requestPermission().then((p) => { setPerm(p); if (p !== 'granted') toast(tr('nt.permDenied'), 'info'); else void syncAutoNotifications(plans).catch(() => undefined); })} testID="nt-perm" />}>
            {tr('nt.permOffD')}
          </Banner>
        ) : null}

      <SectionTitle title={tr('nt.autoTitle')} />
      <Text variant="small" muted>{tr('nt.autoIntro')}</Text>
      <Card testID="nt-auto" style={{ gap: spacing.sm }}>
        <ToggleRow label={tr('nt.appt')} hint={tr('nt.apptD')} value={prefs.appointments} onChange={(v) => set({ appointments: v })} />
        <ToggleRow label={tr('nt.tasks')} hint={tr('nt.tasksD')} value={prefs.tasks} onChange={(v) => set({ tasks: v })} />
        <ToggleRow label={tr('nt.prep')} hint={tr('nt.prepD')} value={prefs.prep} onChange={(v) => set({ prep: v })} />
        <ToggleRow label={tr('nt.papers')} hint={tr('nt.papersD')} value={prefs.papers} onChange={(v) => set({ papers: v })} />
      </Card>

      <SectionTitle title={tr('nt.mineTitle')} />
      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          <ToggleRow label={tr('nt.bottle')} hint={tr('nt.bottleD')} value={bottle} onChange={(v) => { setBottle(v); void setBottleNotificationsEnabled(v); }} />
        </View>
        <ListRow icon="clock" title={tr('nt.bottleOpen')} subtitle={tr('nt.bottleOpenD')} onPress={() => router.push('/track/bottle')} testID="nt-bottle" />
        <View style={{ paddingHorizontal: spacing.md }}>
          <ToggleRow label={tr('med.followPref')} hint={tr('med.followPrefD')} value={prefs.doseFollowUp} onChange={(v) => set({ doseFollowUp: v })} />
        </View>
        <ListRow icon="clipboard" title={tr('med.open')} subtitle={tr('med.openD')} onPress={() => router.push('/medications')} testID="nt-meds" />
        <ListRow icon="bell" title={tr('nt.reminders')} subtitle={tr('nt.remindersD')} onPress={() => router.push('/settings/reminders')} testID="nt-reminders" />
      </Card>

      <SectionTitle title={tr('ms.section')} />
      <Card testID="nt-mood">
        <ToggleRow label={tr('ms.weeklyPref')} hint={tr('ms.weeklyPrefD')} value={prefs.weeklyMood} onChange={(v) => set({ weeklyMood: v })} />
      </Card>

      <SectionTitle title={tr('wb.title')} />
      <Card testID="nt-widget">
        <ToggleRow label={tr('wb.pref')} hint={tr('wb.prefD')} value={prefs.widgetDetails} onChange={(v) => set({ widgetDetails: v })} />
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('wb.howto')}</Text>
      </Card>

      <SectionTitle title={tr('nt.quietTitle')} />
      <Card testID="nt-quiet">
        <ToggleRow label={tr('nt.quiet')} hint={tr('nt.quietD')} value={prefs.quiet} onChange={(v) => set({ quiet: v })} />
        {prefs.quiet ? (
          <>
            <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('nt.quietFrom')}</Text>
            <Row wrap style={{ gap: 6 }}>{[20, 21, 22, 23].map((h) => <Chip key={h} label={tr('nt.hour', { h })} selected={prefs.quietFrom === h} onPress={() => set({ quietFrom: h })} testID={`nt-from-${h}`} />)}</Row>
            <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('nt.quietTo')}</Text>
            <Row wrap style={{ gap: 6 }}>{[6, 7, 8, 9].map((h) => <Chip key={h} label={tr('nt.hour', { h })} selected={prefs.quietTo === h} onPress={() => set({ quietTo: h })} testID={`nt-to-${h}`} />)}</Row>
          </>
        ) : null}
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('nt.quietNote')}</Text>
      </Card>

      <SectionTitle title={tr('nt.nextTitle')} />
      <Card testID="nt-next">
        {plans.length ? plans.slice(0, 6).map((p) => (
          <Text key={p.id} variant="small" style={{ marginTop: 4 }}>• {formatDate(p.at, { weekday: 'short', day: 'numeric', month: 'short' })} {formatTime(p.at)} — {p.title} <Text variant="caption" muted>({tr(`nt.k.${p.kind}` as TKey)})</Text></Text>
        )) : <Text variant="small" muted>{tr('nt.nextNone')}</Text>}
        {plans.length > 6 ? <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('nt.nextMore', { count: plans.length - 6 })}</Text> : null}
      </Card>
      <Text variant="caption" muted>{tr('nt.validate')}</Text>
      {notificationsSupported && perm === 'granted' ? <Button label={tr('nt.test')} icon="bell" variant="ghost" onPress={() => void sendTestNotification().then(() => toast(tr('nt.testSent')))} /> : null}
      <Text variant="caption" muted>{tr('nt.private')}</Text>
    </Screen>
  );
}
