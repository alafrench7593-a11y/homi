/** Questions à préparer avant une consultation (parcours « concevoir »). */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { ConsultationChecklist } from '@/components/Fertility';

export default function FertilityConsultationScreen() {
  return (
    <Screen back title="Mes questions" subtitle="À garder sous la main pour votre prochain rendez-vous.">
      <ConsultationChecklist journey="ttc" />
      <Button label="Examens et consultations possibles" variant="ghost" icon="activity" onPress={() => router.push('/fertility/exams' as never)} />
    </Screen>
  );
}
