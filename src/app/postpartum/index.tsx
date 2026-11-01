/**
 * « Après la naissance » : l'espace post-partum de la mère.
 * Privé par défaut. Le suivi ne s'arrête jamais tout seul : il continue tant qu'elle le souhaite.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton, ErrorView } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, Icon, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { DangerPanel, SupportPlanCard } from '@/features/postpartum';
import { usePostpartumCheckins, usePostpartumSettings, useSaveSettings } from '@/lib/data/hooks-postpartum';
import { useReminders } from '@/lib/data/hooks';
import { friendlyError, useSaveReminder, useToggleReminder } from '@/lib/data/hooks-settings';
import { NEEDS, persistentLowDays, supportPlan } from '@/lib/domain/postpartum';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const CHECKIN_LINK = '/postpartum/checkin';

export default function PostpartumHome() {
  const t = useTheme();
  const toast = useToast();
  const today = todayISO();
  const settingsQ = usePostpartumSettings();
  const checkinsQ = usePostpartumCheckins(30);
  const saveSettings = useSaveSettings();
  const { data: reminders } = useReminders();
  const saveReminder = useSaveReminder();
  const toggleExisting = useToggleReminder();
  const [showDanger, setShowDanger] = useState(false);
  const [dateText, setDateText] = useState('');

  const settings = settingsQ.data;
  const checkins = checkinsQ.data ?? [];
  const todayCheckin = checkins.find((c) => c.checkin_date === today);
  const lowDays = persistentLowDays(checkins, today);
  const plan = useMemo(() => (todayCheckin ? supportPlan(todayCheckin, { persistentLowDays: lowDays, country: settings?.country }) : null), [todayCheckin, lowDays, settings?.country]);
  const reminder = reminders?.find((r) => r.deep_link === CHECKIN_LINK);
  const daysSince = settings?.delivery_date ? Math.floor((Date.parse(today) - Date.parse(settings.delivery_date)) / 86400000) : null;

  async function toggleReminder(on: boolean) {
    try {
      if (on && reminder) {
        await toggleExisting.mutateAsync({ id: reminder.id, enabled: true });
      } else if (on) {
        const [h, m] = (settings?.reminder_time ?? '20:00').split(':').map(Number);
        // Texte volontairement neutre : rien de personnel sur l'écran verrouillé
        await saveReminder.mutateAsync({ draft: { title: tr('u5.pp_home.rem_title'), body: tr('u5.pp_home.rem_body'), category: 'postnatal', schedule: { type: 'daily', hour: h, minute: m }, enabled: true, deep_link: CHECKIN_LINK } });
      } else if (reminder) await toggleExisting.mutateAsync({ id: reminder.id, enabled: false });
      await saveSettings.mutateAsync({ existing: !!settings, patch: { reminders_enabled: on } });
      toast(on ? tr('u5.pp_home.rem_on') : tr('u5.pp_home.rem_off'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function saveDelivery() {
    const iso = frToISO(dateText);
    if (!iso || iso > today) return toast(tr('u5.pp_home.date_bad'), 'error');
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { delivery_date: iso } });
      setDateText('');
      toast(tr('u5.pp_home.date_saved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const loading = settingsQ.isLoading || checkinsQ.isLoading;
  const failed = (settingsQ.isError && !settingsQ.data) || (checkinsQ.isError && !checkinsQ.data);

  return (
    <Screen back title={tr('u5.pp_home.title')} subtitle={tr('u5.pp_home.subtitle')}
      action={{ label: todayCheckin ? tr('u5.pp_history.reread') : tr('u5.pp_checkin.title'), icon: 'feather', onPress: () => router.push(CHECKIN_LINK), testID: 'pp-main-action' }}>
      <TodaySummary items={[
        { icon: 'check-circle', value: todayCheckin ? tr('u5.pp_home.noted') : '—', label: tr('u5.pp_home.today_lbl') },
        { icon: 'sun', value: daysSince != null && daysSince >= 0 ? `J+${daysSince}` : '—', label: tr('u5.pp_home.since_birth') },
        { icon: 'bell', value: reminder?.enabled ? tr('u5.pp_home.on') : '—', label: tr('u5.pp_home.evening_rem') },
      ]} />
      <Banner tone="info" icon="lock">
        {tr('u5.pp_home.privacy')}
      </Banner>

      <Card tone="soft" onPress={() => setShowDanger((v) => !v)} accessibilityLabel={tr('u5.pp_home.help_a11y')}>
        <Row>
          <Icon name="life-buoy" color={t.colors.danger} />
          <Text weight="bold" style={{ flex: 1 }}>{tr('u5.pp_home.help')}</Text>
          <Icon name={showDanger ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
        </Row>
      </Card>
      {showDanger ? <DangerPanel country={settings?.country} /> : null}

      {loading ? <Skeleton kind="card" rows={2} /> : null}
      {failed ? <ErrorView error={settingsQ.error ?? checkinsQ.error} onRetry={() => { void settingsQ.refetch(); void checkinsQ.refetch(); }} /> : null}

      {!loading && !failed ? (
        <>
          <SectionTitle title={tr('u5.pp_home.today')} />
          {todayCheckin ? (
            <>
              <Card onPress={() => router.push(CHECKIN_LINK)} accessibilityLabel={tr('u5.pp_home.edit_a11y')}>
                <Row>
                  <Icon name="check-circle" color={t.colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">{tr('u5.pp_home.done')}</Text>
                    <Text variant="small" muted>
                      {todayCheckin.needs.filter((n) => n !== 'no_answer').map((n) => NEEDS.find((x) => x.value === n)?.label).filter(Boolean).join(' · ') || tr('u5.pp_home.tap')}
                    </Text>
                  </View>
                  <Icon name="edit-2" size={18} color={t.colors.textMuted} />
                </Row>
              </Card>
              {plan ? <SupportPlanCard plan={plan} country={settings?.country} /> : null}
            </>
          ) : (
            <Card>
              <Text weight="bold">{tr('u5.pp_home.how')}</Text>
              <Text variant="small" muted style={{ marginTop: 4 }}>{tr('u5.pp_home.how_sub')}</Text>
              <Row style={{ marginTop: spacing.sm }} wrap>
                <Button label={tr('u5.pp_checkin.title')} icon="feather" size="sm" variant="secondary" onPress={() => router.push(CHECKIN_LINK)} />
                <Button label={tr('u5.pp_home.not_today')} size="sm" variant="ghost" onPress={() => toast(tr('u5.pp_home.ok_care'))} />
              </Row>
            </Card>
          )}

          {!todayCheckin && lowDays >= 5 ? <SupportPlanCard plan={supportPlan({}, { persistentLowDays: lowDays })} /> : null}

          <SectionTitle title={tr('u5.pp_home.space')} />
          <Card>
            {[
              { icon: 'trending-up' as const, title: tr('u5.pp_history.title'), subtitle: tr('u5.pp_home.l_prog'), to: '/postpartum/history' },
              { icon: 'book-open' as const, title: tr('u5.pp_home.l_under'), subtitle: tr('u5.pp_home.l_under_s'), to: '/postpartum/understand' },
              { icon: 'users' as const, title: tr('u5.pp_home.l_plan'), subtitle: tr('u5.pp_home.l_plan_s'), to: '/postpartum/support' },
              { icon: 'share-2' as const, title: tr('u5.pp_home.l_share'), subtitle: settings && (settings.share_rest_need || settings.share_availability || settings.share_relay_requests || settings.share_summary) ? tr('u5.pp_home.l_share_on') : tr('u5.pp_home.l_share_off'), to: '/postpartum/sharing' },
              { icon: 'heart' as const, title: tr('u5.pp_home.l_phys'), subtitle: tr('u5.pp_home.l_phys_s'), to: '/me' },
            ].map((l, i) => (
              <StaggerItem key={l.to} index={i}>
                <ListRow icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />
              </StaggerItem>
            ))}
          </Card>

          <SectionTitle title={tr('u5.pp_home.settings')} />
          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <Text weight="medium">{tr('u5.pp_home.rem')}</Text>
                <Text variant="caption" muted>{tr('u5.pp_home.rem_sub')}</Text>
              </View>
              <Toggle label={tr('u5.pp_home.rem')} value={!!reminder?.enabled} onChange={(v) => void toggleReminder(v)} />
            </Row>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              <Text weight="medium">{tr('u5.pp_home.delivery')}</Text>
              {settings?.delivery_date ? (
                <Text variant="small" muted>
                  {daysSince != null && daysSince >= 0 ? tr('u5.pp_home.since_days', { date: toFrDate(settings.delivery_date), count: daysSince }) : tr('u5.pp_home.since_none', { date: toFrDate(settings.delivery_date) })}
                </Text>
              ) : (
                <Text variant="small" muted>{tr('u5.pp_home.opt')}</Text>
              )}
              <Row>
                <View style={{ flex: 1 }}><Field label={tr('u5.pp_home.date_lbl')} optional value={dateText} onChangeText={setDateText} keyboardType="numbers-and-punctuation" placeholder="12/09/2026" /></View>
                <Button label={tr('u5.pp_checkin.save')} size="sm" variant="secondary" onPress={saveDelivery} disabled={!dateText} loading={saveSettings.isPending} style={{ alignSelf: 'flex-end' }} />
              </Row>
            </View>
          </Card>
          <Text variant="caption" muted>{tr('u5.pp_home.foot')}</Text>
        </>
      ) : null}
    </Screen>
  );
}
