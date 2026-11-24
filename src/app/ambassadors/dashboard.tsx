/**
 * Tableau de bord ambassadeur : AGRÉGATS seulement (clics, inscriptions, abonnés payants, montants par statut).
 * Aucun identifiant, e-mail ni donnée familiale d'un client n'arrive ici (affiliate_my_summary côté serveur).
 */
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, SectionTitle, Text } from '@/components/ui';
import { affiliateLink, formatMinor, PROGRAM, useAffiliateSummary, useCreateAffiliateLink } from '@/lib/data/hooks-ambassadors';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { formatNumber, t as tr, type TKey } from '@/i18n';

const GRID = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: spacing.sm } as const;

function Stat({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={{ width: '47%', flexGrow: 1 }}>
      <Card testID={testID}>
        <Text variant="caption" muted>{label}</Text>
        <Text variant="heading">{value}</Text>
      </Card>
    </View>
  );
}

export default function AmbassadorDashboard() {
  const q = useAffiliateSummary();
  const createLink = useCreateAffiliateLink();
  const toast = useToast();
  const [campaign, setCampaign] = useState('');
  const s = q.data;

  if (q.isLoading && !s) return <Screen back title={tr('amb.dash.title')}><Skeleton kind="card" rows={3} /></Screen>;
  if (q.isError && !s) return <Screen back title={tr('amb.dash.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  if (!s) {
    return (
      <Screen back title={tr('amb.dash.title')}>
        <EmptyState icon="users" title={tr('amb.dash.none')} />
        <Button label={tr('amb.cta.apply')} full onPress={() => router.replace('/ambassadors/apply')} testID="amb-dash-apply" />
      </Screen>
    );
  }
  const link = affiliateLink(s.code);
  const share = () => void Share.share({ message: tr('amb.dash.shareText', { code: s.code, link: link ?? '' }).trim() }).catch(() => undefined);

  return (
    <Screen back title={tr('amb.dash.title')} subtitle={tr(`amb.status.${s.status}` as TKey)}>
      {s.status === 'active' ? (
        <Card testID="amb-dash-link">
          <Text variant="caption" muted>{tr('amb.dash.link')}</Text>
          {link ? <Text weight="bold" selectable>{link}</Text> : <Text>{tr('amb.dash.noLink', { code: s.code })}</Text>}
          <Button label={tr('amb.dash.share')} icon="share" variant="secondary" style={{ marginTop: spacing.xs }} onPress={share} testID="amb-dash-share" />
        </Card>
      ) : (
        <Banner tone={s.status === 'pending' ? 'info' : 'warning'}>{tr(`amb.status.${s.status}` as TKey)}</Banner>
      )}

      <View style={GRID}>
        <Stat label={tr('amb.dash.clicks')} value={formatNumber(s.clicks_30d)} testID="amb-stat-clicks" />
        <Stat label={tr('amb.dash.signups')} value={formatNumber(s.signups)} />
        <Stat label={tr('amb.dash.paying')} value={formatNumber(s.paying)} testID="amb-stat-paying" />
      </View>

      {s.by_currency.map((c) => (
        <View key={c.currency} style={{ gap: spacing.sm }}>
          <SectionTitle title={c.currency} />
          <View style={GRID}>
            <Stat label={tr('amb.dash.month')} value={formatMinor(c.month_minor, c.currency)} />
            <Stat label={tr('amb.dash.pending')} value={formatMinor(c.pending_minor, c.currency)} />
            <Stat label={tr('amb.dash.available')} value={formatMinor(c.available_minor, c.currency)} />
            <Stat label={tr('amb.dash.paid')} value={formatMinor(c.paid_minor, c.currency)} />
          </View>
        </View>
      ))}
      <Text variant="small" muted>{tr('amb.dash.threshold', { threshold: formatMinor(PROGRAM.thresholdMinor, 'EUR') })}</Text>

      {s.status === 'active' ? (
        <Card>
          <Field label={tr('amb.dash.newCampaign')} value={campaign} onChangeText={setCampaign} autoCapitalize="none" maxLength={32} />
          {s.links.filter((l) => l.campaign && !l.disabled).map((l) => (
            <Text key={l.campaign} variant="small" selectable>{affiliateLink(s.code, l.campaign) ?? l.campaign}</Text>
          ))}
          <Button label={tr('amb.dash.addLink')} variant="secondary" disabled={!/^[a-z0-9-]{1,32}$/i.test(campaign) || createLink.isPending}
            onPress={() => createLink.mutate(campaign, { onSuccess: () => { setCampaign(''); toast(tr('amb.dash.copied'), 'success'); }, onError: (e) => toast(friendlyError(e), 'error') })} />
        </Card>
      ) : null}
    </Screen>
  );
}
