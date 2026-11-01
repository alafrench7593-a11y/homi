/** Questions à préparer avant une consultation (parcours « éviter une grossesse »). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ConsultationChecklist } from '@/components/Fertility';
import { t as tr } from '@/i18n';

export default function ContraceptionConsultationScreen() {
  return (
    <Screen back title={tr('u7.contra.consult.title')} subtitle={tr('u7.contra.consult.subtitle')}>
      <ConsultationChecklist journey="avoid" />
    </Screen>
  );
}
