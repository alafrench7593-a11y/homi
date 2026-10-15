/** Questions à préparer avant une consultation (parcours « éviter une grossesse »). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ConsultationChecklist } from '@/components/Fertility';

export default function ContraceptionConsultationScreen() {
  return (
    <Screen back title="Mes questions" subtitle="À garder sous la main pour votre prochain rendez-vous.">
      <ConsultationChecklist journey="avoid" />
    </Screen>
  );
}
