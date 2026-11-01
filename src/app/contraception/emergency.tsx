/**
 * Contraception d'urgence : informations publiques uniquement (délais, accès en France).
 * Aucun conseil de posologie : orientation systématique vers un pharmacien ou un médecin.
 */
import React from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Text } from '@/components/ui';
import { EMERGENCY_CONTACTS, EMERGENCY_FACTS, EMERGENCY_INTRO, EMERGENCY_OPTIONS } from '@/content/fertility';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const prettyPhone = (p: string) => p.replace(/(\d)(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

export default function EmergencyContraceptionScreen() {
  const toast = useToast();
  return (
    <Screen back title={tr('u7.contra.emerg.title')} subtitle={tr('u7.contra.emerg.subtitle')}>
      <Banner tone="warning" title={tr('u7.contra.emerg.actFast')}>{EMERGENCY_INTRO}</Banner>
      {EMERGENCY_OPTIONS.map((o) => (
        <Card key={o.title}>
          <Text weight="bold">{o.title}</Text>
          <Text variant="small" style={{ marginTop: 2 }}>{o.delay}</Text>
          <Text variant="small" muted style={{ marginTop: 2 }}>{o.text}</Text>
        </Card>
      ))}
      <Card tone="soft">
        <View style={{ gap: 6 }}>{EMERGENCY_FACTS.map((f) => <Text key={f} variant="small">{`• ${f}`}</Text>)}</View>
      </Card>
      <Banner tone="info" title={tr('u7.contra.emerg.adviceTitle')}>{tr('u7.contra.emerg.adviceBody')}</Banner>
      {EMERGENCY_CONTACTS.map((c) => (
        <Card key={c.phone}>
          <Text weight="bold">{c.label}</Text>
          <Text variant="small" muted>{c.description}</Text>
          <Button label={tr('u7.contra.emerg.call', { phone: prettyPhone(c.phone) })} icon="phone" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => Linking.openURL(`tel:${c.phone}`).catch(() => toast(tr('u7.contra.emerg.callFail', { phone: prettyPhone(c.phone) }), 'error'))} />
        </Card>
      ))}
    </Screen>
  );
}
