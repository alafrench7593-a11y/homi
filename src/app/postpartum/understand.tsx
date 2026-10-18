/** Comprendre ce que je traverse : baby blues, signes qui méritent d'en parler, à qui s'adresser. Sources officielles. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { Banner, Text } from '@/components/ui';
import { RecoveryWarnings, SectionCard } from '@/features/postpartum';
import { UNDERSTAND } from '@/content/postpartum';

export default function PostpartumUnderstand() {
  return (
    <Screen back title="Comprendre ce que je traverse" subtitle="Des repères, pas un diagnostic.">
      <Banner tone="info">{'Rien ici ne permet de savoir ce que vous avez : seul un professionnel peut le faire. Ces repères servent à savoir quand il est utile de demander de l’aide — et la réponse est souvent : dès maintenant, si vous en ressentez le besoin.'}</Banner>
      {UNDERSTAND.map((s, i) => <SectionCard key={s.id} s={s} index={i} />)}
      <RecoveryWarnings />
      <Text variant="caption" muted>Contenus vérifiés le 18 octobre 2026 sur les sites officiels cités.</Text>
    </Screen>
  );
}
