/**
 * Alertes produits rappelés : les produits de l'historique du scanner (et donc des favoris, qui en font partie)
 * sont comparés aux rappels officiels publiés sur RappelConso (site du gouvernement français). Une alerte
 * arrive dans « Notifications » quand un de ces produits est rappelé.
 * Nouveau (07/11/2026) : « Prévenir aussi mon foyer », désactivé par défaut — l'historique du scanner peut
 * être intime (test de grossesse, protections…). Activé, les autres membres du foyer reçoivent l'alerte.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, ListRow, SectionTitle, Text, Toggle } from '@/components/ui';
import { backend, eq, isDemo } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useHouseholdMembers, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useRecallPrefs, useSetRecallShare } from '@/lib/data/hooks-tools6';
import { openLink } from '@/lib/links';
import type { AppNotification } from '@/lib/types';
import { formatDate, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function RecallAlerts() {
  const toast = useToast();
  const inv = useInvalidate();
  const uid = useUserId();
  const members = useHouseholdMembers().data ?? [];
  const prefs = useRecallPrefs();
  const setShare = useSetRecallShare();
  const share = !!prefs.data?.[0]?.share_household;
  const alerts = useRows<AppNotification>(['notifications', 'recalls', uid ?? ''], uid ? { table: 'notifications', filters: [eq('user_id', uid), eq('category', 'product_recall')], order: [{ col: 'created_at', asc: false }], limit: 50 } : null);
  const scans = useRows<{ barcode: string | null }>(['product_scans', 'recall-count', uid ?? ''], uid ? { table: 'product_scans', columns: 'barcode', filters: [eq('user_id', uid)], limit: 500 } : null);
  const followed = new Set((scans.data ?? []).map((s) => s.barcode).filter(Boolean)).size;
  const [busy, setBusy] = useState(false);
  const list = alerts.data ?? [];

  async function checkNow() {
    setBusy(true);
    try {
      const r = await backend.invoke<{ checked?: number; skipped?: string }>('product-lookup', { action: 'recall_watch' });
      inv('notifications');
      if (r?.skipped === 'rate_limited') toast(tr('rc.rateLimited'), 'info');
      else toast(tr('rc.checked', { count: r?.checked ?? 0 }));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function toggleShare(v: boolean) {
    try { await setShare.mutateAsync(v); toast(v ? tr('rc.shareOn') : tr('rc.shareOff')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.recall_alerts')} subtitle={tr('tool.recall_alerts.sub')}>
      <Text muted>{tr('rc.intro')}</Text>
      <TodaySummary title={tr('rc.summary')} items={[
        { icon: 'package', value: String(followed), label: tr('rc.followed'), testID: 'rc-followed' },
        { icon: 'alert-triangle', value: String(list.length), label: tr('rc.alerts') },
      ]} />
      {isDemo ? <Banner tone="demo">{tr('rc.demo')}</Banner> : null}
      <Button label={tr('rc.checkNow')} icon="refresh-cw" loading={busy} onPress={() => void checkNow()} testID="rc-check" />
      <Text variant="small" muted>{tr('rc.how')}</Text>

      {members.length > 1 ? (
        <Card testID="rc-share">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{tr('rc.share')}</Text>
              <Text variant="small" muted>{tr('rc.shareD')}</Text>
            </View>
            <Toggle label={tr('rc.share')} value={share} onChange={(v) => void toggleShare(v)} />
          </View>
        </Card>
      ) : null}

      <SectionTitle title={tr('rc.received')} />
      {!list.length ? <Card tone="soft"><Text muted>{tr('rc.none')}</Text></Card> : (
        <Card padded={false}>
          {list.map((n) => (
            <ListRow key={n.id} icon="alert-triangle" title={n.title} subtitle={`${formatDate(n.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}${n.body ? ` · ${n.body}` : ''}`}
              onPress={n.deep_link && n.deep_link !== '/scanner/recalls' ? () => router.push(n.deep_link as never) : undefined} />
          ))}
        </Card>
      )}
      <Banner tone="info" icon="info">{tr('rc.whatToDo')}</Banner>
      <Button label={tr('rc.official')} icon="external-link" variant="secondary" onPress={() => openLink('https://rappel.conso.gouv.fr', toast)} />
      <Button label={tr('rc.history')} icon="clock" variant="ghost" onPress={() => router.push('/scanner/history')} />
    </Screen>
  );
}
