/** Urgences : toujours gratuit, accessible sans compte et depuis tous les écrans. */
import React from 'react';
import { Linking } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmergencyList } from '@/components/Family';
import { Banner, Card, Text } from '@/components/ui';
import { getLocale, t as tr } from '@/i18n';
import { REGIONS } from '@/i18n/locales';
import { primaryEmergencyPhone, useEmergencyRegion } from '@/lib/domain/emergencyNumbers';

export default function Emergency() {
  const toast = useToast();
  const region = useEmergencyRegion();
  const phone = primaryEmergencyPhone(region);
  const country = REGIONS.find((r) => r.code === region);
  return (
    <Screen back title={tr('u7.emergency.title')} subtitle={tr('u7.emergency.subtitle')}
      action={{ label: region === 'FR' ? tr('u7.emergency.call15') : tr('u7.emergency.callPhone', { phone }), icon: 'phone', testID: 'emergency-call-15',
        onPress: () => { Linking.openURL(`tel:${phone}`).catch(() => toast(tr('u7.emergency.callFail', { phone }), 'error')); } }}>
      {/* les numéros d'abord, sans animation ni texte à lire avant */}
      <EmergencyList />
      {region !== 'FR' ? (
        <Text variant="small" muted>{tr('u7.emg.regionNote', { country: country ? (getLocale() === 'fr' ? country.fr : country.en) : region })}</Text>
      ) : null}
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
