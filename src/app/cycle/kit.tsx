/**
 * Trousse règles (script 8 « Plus une seule protection ») : un rappel deux jours avant les règles estimées pour
 * vérifier son sac, et la petite liste de ce qu'on y garde — dont une protection de plus pour une autre.
 * Le rappel est un rappel ordinaire (table reminders), reprogrammé à chaque nouvelle estimation du cycle.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, ListRow, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate, useReminders } from '@/lib/data/hooks';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, daysBetween, todayISO } from '@/lib/domain/dates';
import { formatDate, t as tr, type TKey } from '@/i18n';

export const KIT_LINK = '/cycle/kit';
const ITEMS = ['pads', 'spare', 'bag', 'wipes', 'pain', 'underwear'] as const;

export default function CycleKit() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { est } = useCycleEstimates();
  const { data: reminders } = useReminders();
  const [busy, setBusy] = useState(false);
  const next = est.nextPeriod;
  const remindOn = next ? addDays(next, -2) : null;
  const existing = (reminders ?? []).find((r) => r.deep_link === KIT_LINK && r.enabled);
  const existingAt = existing?.schedule.type === 'once' ? existing.schedule.at : null;
  const upToDate = !!existingAt && !!remindOn && existingAt.slice(0, 10) === remindOn;

  async function setReminder() {
    if (!remindOn) return;
    setBusy(true);
    try {
      const [y, m, d] = remindOn.split('-').map(Number);
      const at = new Date(y, m - 1, d, 9, 0);
      if (at.getTime() <= Date.now()) { toast(tr('kit.tooLate'), 'info'); return; }
      const row = { user_id: userId, household_id: null, category: 'custom' as const, title: tr('kit.reminderTitle'), body: tr('kit.reminderBody'), schedule: { type: 'once' as const, at: at.toISOString() }, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: KIT_LINK };
      if (existing) await backend.update('reminders', row, [eq('id', existing.id)]);
      else await backend.insert('reminders', row);
      inv('reminders');
      toast(tr('kit.set', { date: formatDate(remindOn, { weekday: 'long', day: 'numeric', month: 'long' }) }));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!existing) return;
    try { await backend.remove('reminders', [eq('id', existing.id)]); inv('reminders'); toast(tr('kit.removed')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.cycle_kit')} subtitle={tr('tool.cycle_kit.sub')}>
      <Text muted>{tr('kit.intro')}</Text>
      <Card>
        {next ? (
          <>
            <Text weight="bold">{tr('kit.next', { date: formatDate(next, { weekday: 'long', day: 'numeric', month: 'long' }), count: daysBetween(todayISO(), next) })}</Text>
            <Text variant="small" muted>{tr('kit.estimate')}</Text>
            {upToDate ? <Banner tone="success">{tr('kit.planned', { date: formatDate(remindOn!, { weekday: 'long', day: 'numeric', month: 'long' }) })}</Banner> : null}
            <Button label={upToDate ? tr('kit.replan') : existing ? tr('kit.update') : tr('kit.remind')} icon="bell" loading={busy} onPress={() => void setReminder()} testID="kit-remind" />
            {existing ? <Button label={tr('kit.remove')} variant="ghost" icon="bell-off" onPress={() => void remove()} /> : null}
          </>
        ) : (
          <>
            <Text weight="bold">{tr('kit.noEstimate')}</Text>
            <Text variant="small" muted>{tr('kit.noEstimateD')}</Text>
            <Button label={tr('kit.logPeriod')} icon="droplet" variant="secondary" onPress={() => router.push('/cycle')} />
          </>
        )}
      </Card>
      <Card padded={false}>
        {ITEMS.map((k) => <ListRow key={k} icon={k === 'spare' ? 'heart' : 'check'} title={tr(`kit.item.${k}` as TKey)} />)}
      </Card>
      <Text variant="caption" muted>{tr('kit.footer')}</Text>
    </Screen>
  );
}
