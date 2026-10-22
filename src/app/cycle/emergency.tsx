/**
 * Contraception d'urgence : informations officielles françaises, datées et sourcées. Toujours gratuites,
 * accessibles sans compte Premium et sans donnée enregistrée. Jamais de calcul de risque ni de recommandation de méthode.
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmergencyInfo } from '@/features/cycle3/InsightCard';
import { t as tr } from '@/i18n';

export default function CycleEmergency() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const iso = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  const hours = iso ? Math.max(0, Math.round((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 3600000)) : null;
  return (
    <Screen back title={tr('c3.ec.title')}>
      <EmergencyInfo date={iso} hoursSince={hours} />
    </Screen>
  );
}
