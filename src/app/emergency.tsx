/** Urgences : toujours gratuit, accessible sans compte et depuis tous les écrans. */
import React from 'react';
import { Linking } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmergencyList } from '@/components/Family';
import { Banner, Card, Text } from '@/components/ui';

export default function Emergency() {
  const toast = useToast();
  return (
    <Screen back title="Besoin d’aide maintenant" subtitle="Ces numéros sont gratuits. Touchez pour appeler."
      action={{ label: 'Appeler le 15 (SAMU)', icon: 'phone', testID: 'emergency-call-15',
        onPress: () => { Linking.openURL('tel:15').catch(() => toast('Impossible de lancer l’appel ici : composez le 15 depuis votre téléphone.', 'error')); } }}>
      {/* les numéros d'abord, sans animation ni texte à lire avant */}
      <EmergencyList />
      <Banner tone="danger" title="Danger immédiat">
        {'Si vous ou votre enfant êtes en danger, si vous pensez au suicide, ou si vous avez peur de faire du mal à vous-même ou à quelqu’un : appelez maintenant.'}
      </Banner>
      <Card tone="soft">
        <Text weight="bold">Vous n’êtes pas seule, vous n’êtes pas seul</Text>
        <Text variant="small" style={{ marginTop: 6 }}>
          Si vous le pouvez, demandez à une personne de confiance de rester avec vous. Votre sage-femme, votre médecin traitant, la PMI ou les urgences peuvent vous aider, de jour comme de nuit.
        </Text>
      </Card>
      <Text variant="caption" muted>Ces ressources restent gratuites et disponibles quel que soit votre abonnement.</Text>
    </Screen>
  );
}
