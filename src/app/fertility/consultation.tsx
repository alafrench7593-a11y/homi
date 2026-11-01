/** Questions à préparer avant une consultation (parcours « concevoir »). */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { ConsultationChecklist } from '@/components/Fertility';
import { t as tr } from '@/i18n';

export default function FertilityConsultationScreen() {
  return (
    <Screen back title={tr('u3.fertConsult.title')} subtitle={tr('u3.fertConsult.subtitle')}>
      <ConsultationChecklist journey="ttc" />
      <Button label={tr('u3.fertConsult.btn')} variant="ghost" icon="activity" onPress={() => router.push('/fertility/exams' as never)} />
    </Screen>
  );
}
