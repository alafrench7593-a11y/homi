/** Rappels personnalisables du parcours « concevoir » (table reminders existante). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { JourneyReminders } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { upcomingWindow } from '@/lib/domain/cycle';
import { TTC_REMINDER_PRESETS } from '@/content/fertility';
import { t as tr } from '@/i18n';

export default function FertilityRemindersScreen() {
  const { windows } = useCycleEstimates(2);
  const w = upcomingWindow(windows);
  return (
    <Screen back title={tr('u3.fertRem.title')} subtitle={tr('u3.fertRem.subtitle')}>
      <JourneyReminders presets={TTC_REMINDER_PRESETS} deepLink="/fertility" defaultDates={{ period: w?.nextPeriod ?? null, pregnancy_test: w?.nextPeriod ?? null }} />
    </Screen>
  );
}
