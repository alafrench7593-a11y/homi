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
import { toolName } from '@/lib/domain/toolCatalog';
import { lactationSuggestions } from '@/features/feeding/issues';

export default function ConsultQuestions() {
  const { child: childId, for: scope, theme: themeParam } = useLocalSearchParams<{ child?: string; for?: string; theme?: string }>();
  const child = useChild(typeof childId === 'string' ? childId : null);
  // 57 / 81 : listes à thème (questions postnatales, questions pour la consultante en lactation)
  const theme = themeParam === 'postnatal' || themeParam === 'lactation' ? themeParam : null;
  const journey = theme === 'postnatal' ? 'postpartum' : child ? 'child' : scope === 'pregnancy' ? 'pregnancy' : 'general';
  const subtitle = theme ? tr(`cq.theme.${theme}`) : child ? child.first_name : scope === 'pregnancy' ? tr('cq.pregnancy') : tr('cq.me');
  return (
    <Screen back title={toolName('consult_questions')} subtitle={subtitle}>
      <Text muted>{tr('cq.intro')}</Text>
      <ConsultationChecklist journey={journey} childId={theme ? null : child?.id ?? null} theme={theme} withUnthemed={theme === 'postnatal'}
        suggestions={theme === 'lactation' ? lactationSuggestions() : undefined} testID="cq-list" />
    </Screen>
  );
}
