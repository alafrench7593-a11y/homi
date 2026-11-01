/**
 * Ce que je partage : la mère choisit, champ par champ, ce que son foyer peut voir.
 * Fermé par défaut, révocable à tout moment. Le serveur refiltre tout ce qui n'est pas autorisé.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useHousehold, useHouseholdId } from '@/lib/data/hooks';
import { useMySharedStatus, usePostpartumSettings, useSaveSettings, useStopSharing, useUpdateShared } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AVAILABILITY_LABEL, REST_LABEL, anySharing, helpIdeas, type PostpartumSettings, type SharedStatus } from '@/lib/domain/postpartum';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type ShareKey = 'share_rest_need' | 'share_availability' | 'share_relay_requests' | 'share_summary';
const shareOptions = (): { key: ShareKey; title: string; detail: string }[] => [
  { key: 'share_rest_need', title: tr('u5.pp_share.o_rest'), detail: tr('u5.pp_share.o_rest_d') },
  { key: 'share_availability', title: tr('u5.pp_share.o_avail'), detail: tr('u5.pp_share.o_avail_d') },
  { key: 'share_relay_requests', title: tr('u5.pp_share.o_relay'), detail: tr('u5.pp_share.o_relay_d') },
  { key: 'share_summary', title: tr('u5.pp_share.o_sum'), detail: tr('u5.pp_share.o_sum_d') },
];

export default function PostpartumSharing() {
  const toast = useToast();
  const SHARE_OPTIONS = shareOptions();
  const hid = useHouseholdId();
  const household = useHousehold();
  const settingsQ = usePostpartumSettings();
  const settings = settingsQ.data;
  const saveSettings = useSaveSettings();
  const mine = useMySharedStatus();
  const update = useUpdateShared();
  const stop = useStopSharing();
  const [value, setValue] = useState<Partial<SharedStatus>>({});

  useEffect(() => {
    if (mine.data) setValue({ rest_need: mine.data.rest_need, availability: mine.data.availability, relay_requested: mine.data.relay_requested, relay_note: mine.data.relay_note, summary: mine.data.summary });
  }, [mine.data?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(key: ShareKey, on: boolean) {
    if (!hid) return toast(tr('u5.pp_share.need_home'), 'error');
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { [key]: on, share_household_id: hid } as Partial<PostpartumSettings> });
      toast(on ? tr('u5.pp_share.allowed') : tr('u5.pp_share.stopped'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function publish(next: Partial<SharedStatus>) {
    if (!settings) return;
    try {
      await update.mutateAsync({ settings, exists: !!mine.data, value: next });
      toast(tr('u5.pp_share.published'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function stopAll() {
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false } });
      await stop.mutateAsync().catch(() => undefined);
      setValue({});
      toast(tr('u5.pp_share.none'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (settingsQ.isLoading && !settingsQ.data) return <Screen back title={tr('u5.pp_home.l_share')}><Skeleton kind="detail" rows={4} /></Screen>;
  const s = settings ?? { share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false };
  const sharing = anySharing(s);

  return (
    <Screen back title={tr('u5.pp_home.l_share')} subtitle={household ? tr('u5.pp_share.with_home', { name: household.name }) : tr('u5.pp_share.with_yours')}
      action={sharing ? { label: tr('u5.pp_share.publish'), icon: 'send', onPress: () => void publish(value), disabled: update.isPending, testID: 'pp-share-publish' } : undefined}>
      <TodaySummary title={tr('u5.pp_share.my_share')} items={[
        { icon: sharing ? 'eye' : 'eye-off', value: sharing ? tr('u5.pp_share.active') : tr('u5.pp_share.private'), label: tr('u5.pp_share.state') },
        { icon: 'sliders', value: `${SHARE_OPTIONS.filter((o) => !!s[o.key]).length}/${SHARE_OPTIONS.length}`, label: tr('u5.pp_share.allowed_n') },
        { icon: 'send', value: mine.data ? tr('u5.pp_share.yes') : '—', label: tr('u5.pp_share.pub_lbl') },
      ]} />
      <Banner tone="info" icon="lock">
        {tr('u5.pp_share.banner')}
      </Banner>

      <SectionTitle title={tr('u5.pp_share.allow')} />
      <Card>
        {SHARE_OPTIONS.map((o) => (
          <Row key={o.key} style={{ alignItems: 'flex-start', paddingVertical: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">{o.title}</Text>
              <Text variant="caption" muted>{o.detail}</Text>
            </View>
            <Toggle label={o.title} value={!!s[o.key]} onChange={(v) => void toggle(o.key, v)} />
          </Row>
        ))}
      </Card>

      {sharing ? (
        <>
          <SectionTitle title={tr('u5.pp_share.pub_now')} />
          <Card>
            <View style={{ gap: spacing.md }}>
              {s.share_rest_need ? (
                <View style={{ gap: 6 }}>
                  <Text weight="medium">{tr('u5.pp_share.rest')}</Text>
                  <Row wrap>{(Object.keys(REST_LABEL) as (keyof typeof REST_LABEL)[]).map((k) => <Chip key={k} label={REST_LABEL[k]} selected={value.rest_need === k} onPress={() => setValue({ ...value, rest_need: value.rest_need === k ? null : k })} />)}</Row>
                </View>
              ) : null}
              {s.share_availability ? (
                <View style={{ gap: 6 }}>
                  <Text weight="medium">{tr('u5.pp_share.avail')}</Text>
                  <Row wrap>{(Object.keys(AVAILABILITY_LABEL) as (keyof typeof AVAILABILITY_LABEL)[]).map((k) => <Chip key={k} label={AVAILABILITY_LABEL[k]} selected={value.availability === k} onPress={() => setValue({ ...value, availability: value.availability === k ? null : k })} />)}</Row>
                </View>
              ) : null}
              {s.share_relay_requests ? (
                <View style={{ gap: 6 }}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <Text weight="medium" style={{ flex: 1 }}>{tr('u5.pp_share.ask_relay')}</Text>
                    <Toggle label={tr('u5.pp_share.ask_relay')} value={!!value.relay_requested} onChange={(v) => setValue({ ...value, relay_requested: v })} />
                  </Row>
                  {value.relay_requested ? <Field label={tr('u5.pp_share.note')} optional value={value.relay_note ?? ''} onChangeText={(x) => setValue({ ...value, relay_note: x })} maxLength={200} placeholder={tr('u5.pp_share.note_ph')} /> : null}
                </View>
              ) : null}
              {s.share_summary ? <Field label={tr('u5.pp_share.summary')} optional multiline value={value.summary ?? ''} onChangeText={(x) => setValue({ ...value, summary: x })} maxLength={500} hint={tr('u5.pp_share.summary_hint')} /> : null}
            </View>
          </Card>

          <SectionTitle title={tr('u5.pp_share.sees')} />
          <Card tone="soft">
            {!mine.data ? <Text variant="small" muted>{tr('u5.pp_share.nothing')}</Text> : (
              <>
                {mine.data.rest_need ? <ListRow icon="moon" title={REST_LABEL[mine.data.rest_need]} /> : null}
                {mine.data.availability ? <ListRow icon="clock" title={AVAILABILITY_LABEL[mine.data.availability]} /> : null}
                {mine.data.relay_requested ? <ListRow icon="repeat" title={tr('u5.pp_partner.relay')} subtitle={mine.data.relay_note ?? undefined} /> : null}
                {mine.data.summary ? <ListRow icon="message-circle" title={tr('u5.pp_share.her_summary')} subtitle={mine.data.summary} /> : null}
                <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u5.pp_share.ideas', { idea: helpIdeas(mine.data)[0] })}</Text>
              </>
            )}
          </Card>
          <Button label={tr('u5.pp_share.stop_all')} variant="ghost" icon="eye-off" onPress={stopAll} loading={stop.isPending} />
        </>
      ) : null}
    </Screen>
  );
}
