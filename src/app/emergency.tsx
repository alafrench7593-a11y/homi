/** Urgences : toujours gratuit, accessible sans compte et depuis tous les écrans. */
import React from 'react';
import { Linking } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmergencyList } from '@/components/Family';
import { Banner, Card, Text } from '@/components/ui';
import { t as tr } from '@/i18n';

export default function Emergency() {
  const toast = useToast();
  return (
    <Screen back title={tr('u7.emergency.title')} subtitle={tr('u7.emergency.subtitle')}
      action={{ label: tr('u7.emergency.call15'), icon: 'phone', testID: 'emergency-call-15',
        onPress: () => { Linking.openURL('tel:15').catch(() => toast(tr('u7.emergency.callFail', { phone: '15' }), 'error')); } }}>
      {/* les numéros d'abord, sans animation ni texte à lire avant */}
      <EmergencyList />
      <Banner tone="danger" title={tr('u7.emergency.dangerTitle')}>
        {tr('u7.emergency.dangerBody')}
      </Banner>
      <Card tone="soft">
        <Text weight="bold">{tr('u7.emergency.notAlone')}</Text>
        <Text variant="small" style={{ marginTop: 6 }}>
          {tr('u7.emergency.notAloneBody')}
        </Text>
      </Card>
      <Text variant="caption" muted>{tr('u7.emergency.free')}</Text>
    </Screen>
  );
}
