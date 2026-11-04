/**
 * Mes questions pour le rendez-vous (script 80 « J'ai oublié toutes mes questions ») : on note la question dès
 * qu'elle arrive, on montre la liste au début de la consultation, on coche et on note la réponse.
 * Une liste par profil affiché : moi, ma grossesse, chaque enfant.
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ConsultationChecklist } from '@/components/Fertility';
import { Text } from '@/components/ui';
import { useChild } from '@/lib/data/hooks';
import { t as tr } from '@/i18n';

export default function ConsultQuestions() {
  const { child: childId, for: scope } = useLocalSearchParams<{ child?: string; for?: string }>();
  const child = useChild(typeof childId === 'string' ? childId : null);
  const journey = child ? 'child' : scope === 'pregnancy' ? 'pregnancy' : 'general';
  const subtitle = child ? child.first_name : scope === 'pregnancy' ? tr('cq.pregnancy') : tr('cq.me');
  return (
    <Screen back title={tr('tool.consult_questions')} subtitle={subtitle}>
      <Text muted>{tr('cq.intro')}</Text>
      <ConsultationChecklist journey={journey} childId={child?.id ?? null} />
    </Screen>
  );
}
