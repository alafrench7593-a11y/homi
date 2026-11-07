/**
 * « Je décroche » : pendant quelques heures (24 h au plus), l'autre parent prend le relais. Il est prévenu (demande
 * « besoin de repos »), et mes rappels personnels non médicaux sont mis en pause jusqu'à la fin, puis reprennent seuls.
 * Les rappels de médicament et les rappels partagés ne sont jamais coupés.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Text } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useOffDuty, useStartOffDuty, useStopOffDuty } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { formatTime, t as tr } from '@/i18n';

const HOURS = [1, 2, 3, 4, 8, 12];

export default function OffDuty() {
  const toast = useToast();
  const me = useUserId();
  const { people, labelOf } = usePeople();
  const others = people.filter((p) => p.id !== me);
  const periods = (useOffDuty().data ?? []).filter((p) => Date.parse(p.ends_at) > Date.now());
  const mine = periods.find((p) => p.user_id === me);
  const theirs = periods.filter((p) => p.user_id !== me);
  const start = useStartOffDuty();
  const stop = useStopOffDuty();
  const [hours, setHours] = useState(3);
  const [relay, setRelay] = useState<string | null>(others[0]?.id ?? null);
  const [message, setMessage] = useState('');

  async function go() {
    try {
      await start.mutateAsync({ hours, relayTo: relay ?? others[0]?.id ?? null, message: message.trim() || tr('cm.off.defaultMsg', { count: hours }) });
      toast(tr('cm.off.started'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Screen back title={tr('tool.offduty')} subtitle={tr('tool.offduty.sub')}>
      {theirs.map((p) => (
        <Banner key={p.id} tone="warning" icon="moon" title={tr('cm.off.theirs', { person: labelOf(p.user_id) })}>{tr('cm.off.theirsD', { time: formatTime(p.ends_at) })}</Banner>
      ))}
      {mine ? (
        <Card tone="lavender" testID="off-active">
          <Text variant="title">{tr('cm.off.active')}</Text>
          <Text>{tr('cm.off.until', { time: formatTime(mine.ends_at), person: labelOf(mine.relay_to) })}</Text>
          <Button label={tr('cm.off.stop')} variant="secondary" style={{ marginTop: spacing.sm }} loading={stop.isPending} onPress={() => void stop.mutateAsync(mine.id).then(() => toast(tr('cm.off.stopped'))).catch((e) => toast(friendlyError(e), 'error'))} testID="off-stop" />
        </Card>
      ) : (
        <>
          <Text muted>{tr('cm.off.intro')}</Text>
          {!others.length ? <Banner tone="info" icon="user-plus">{tr('cm.off.alone')}</Banner> : null}
          <Card>
            <Text variant="label">{tr('cm.off.howLong')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{HOURS.map((h) => <Chip key={h} label={tr('cm.off.hours', { count: h })} selected={hours === h} onPress={() => setHours(h)} testID={`off-h-${h}`} />)}</View>
            {others.length > 1 ? (
              <>
                <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('cm.off.who')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{others.map((p) => <Chip key={p.id} label={p.label} selected={relay === p.id} onPress={() => setRelay(p.id)} />)}</View>
              </>
            ) : null}
            <Field label={tr('cm.off.msg')} optional value={message} onChangeText={setMessage} maxLength={280} placeholder={tr('cm.off.msgPh')} />
          </Card>
          <Button label={tr('cm.off.go', { count: hours })} icon="moon" loading={start.isPending} disabled={!others.length} onPress={() => void go()} testID="off-go" />
          <Text variant="small" muted>{tr('cm.off.what')}</Text>
        </>
      )}
    </Screen>
  );
}
