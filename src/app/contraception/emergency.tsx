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

const prettyPhone = (p: string) => p.replace(/(\d)(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

export default function EmergencyContraceptionScreen() {
  const toast = useToast();
  return (
    <Screen back title="Contraception d’urgence" subtitle="Le plus tôt possible après le rapport.">
      <Banner tone="warning" title="Agir vite">{EMERGENCY_INTRO}</Banner>
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
      <Banner tone="info" title="Demandez conseil">Un pharmacien, un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à choisir et répondre à vos questions, sans jugement.</Banner>
      {EMERGENCY_CONTACTS.map((c) => (
        <Card key={c.phone}>
          <Text weight="bold">{c.label}</Text>
          <Text variant="small" muted>{c.description}</Text>
          <Button label={`Appeler le ${prettyPhone(c.phone)}`} icon="phone" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => Linking.openURL(`tel:${c.phone}`).catch(() => toast(`Appel impossible depuis cet appareil. Composez le ${prettyPhone(c.phone)}.`, 'error'))} />
        </Card>
      ))}
    </Screen>
  );
}
