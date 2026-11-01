/**
 * Parcours « Projet bébé » › « Comprendre mon cycle et mes tests ».
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { NavCard } from '@/components/Fertility';
import { useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const GUARANTEES = [
  'u3.fertUnd.g1',
  'u3.fertUnd.g2',
  'u3.fertUnd.g3',
  'u3.fertUnd.g4',
  'u3.fertUnd.g5',
  'u3.fertUnd.g6',
  'u3.fertUnd.g7',
] as const;

export default function UnderstandCycleScreen() {
  const toast = useToast();
  const prefsQ = useCyclePreferences();
  const { prefs } = prefsQ;
  const savePrefs = useSaveCyclePreferences();

  return (
    <Screen back title={tr('u3.fertUnd.title')} subtitle={tr('u3.fertUnd.subtitle')}>
      <Banner tone="info" title={tr('u3.fertUnd.infoT')}>{tr('u3.fertUnd.infoB')}</Banner>

      <Appear kind="soft">
        <NavCard items={[
          { icon: 'droplet', title: tr('u3.fertUnd.n1t'), subtitle: tr('u3.fertUnd.n1s'), to: '/fertility/mucus' },
          { icon: 'camera', title: tr('u3.fertUnd.n2t'), subtitle: tr('u3.fertUnd.n23s'), to: '/fertility/test/ovulation' },
          { icon: 'camera', title: tr('u3.fertUnd.n3t'), subtitle: tr('u3.fertUnd.n23s'), to: '/fertility/test/pregnancy' },
          { icon: 'calendar', title: tr('u3.fertUnd.n4t'), subtitle: tr('u3.fertUnd.n4s'), to: '/fertility/calendar' },
          { icon: 'list', title: tr('u3.fertUnd.n5t'), subtitle: tr('u3.fertUnd.n5s'), to: '/fertility/compatible' },
        ]} />
      </Appear>

      <SectionTitle title={tr('u3.fertUnd.opt')} />
      {prefsQ.isLoading ? <Skeleton kind="card" rows={1} /> : prefsQ.isError && !prefsQ.data ? (
        <ErrorView error={prefsQ.error} onRetry={() => void prefsQ.refetch()} title={tr('u3.fertUnd.errOpt')} />
      ) : (
      <Card>
        <Toggle
          value={prefs.track_intercourse}
          label={tr('u3.fertUnd.tog')}
          onChange={async (v) => {
            try { await savePrefs.mutateAsync({ track_intercourse: v }); } catch (err) { toast(friendlyError(err), 'error'); }
          }}
        />
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u3.fertUnd.togNote')}</Text>
      </Card>
      )}

      <SectionTitle title={tr('u3.fertUnd.conf')} />
      <Card>
        {GUARANTEES.map((g) => (
          <Row key={g} gap={8} style={{ alignItems: 'flex-start', paddingVertical: 3 }}>
            <View style={{ marginTop: 2 }}><Icon name="shield" size={16} /></View>
            <Text variant="small" style={{ flex: 1 }}>{tr(g)}</Text>
          </Row>
        ))}
      </Card>
      <Text variant="caption" muted center style={{ marginBottom: spacing.lg }}>{tr('u3.fertUnd.foot')}</Text>
    </Screen>
  );
}
