/** Comprendre le risque de grossesse : explication générale, sans probabilité individuelle ni garantie. */
import React from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { ADVICE_SOURCES, orderSources } from '@/lib/advice/sources';
import { useRegion } from '@/features/cycle/AdviceCard';
import { Glass, Ink, Rise } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { getLocale, t as tr } from '@/i18n';

export default function RiskScreen() {
  const region = useRegion();
  const sources = orderSources(['qsEC', 'spEC', 'nhsPregnancyTest'], getLocale() === 'en' ? 'en' : 'fr', region);
  return (
    <Screen back title={tr('adv.risk.title')}>
      {(['p1', 'p2', 'p3', 'p4', 'p5'] as const).map((p, i) => (
        <Rise key={p} delay={i * 50}><Glass><Ink>{tr(`adv.risk.${p}`)}</Ink></Glass></Rise>
      ))}
      <Button label={tr('pro.search')} icon="search" onPress={() => router.push('/cycle/professional?reason=sex_risk' as never)} full />
      <Glass>
        <Ink weight="bold">{tr('adv.risk.official')}</Ink>
        {sources.map((s) => <Button key={s.id} label={`${s.org} — ${s.title}`} variant="ghost" size="sm" icon="external-link" onPress={() => Linking.openURL(s.url).catch(() => undefined)} />)}
        <Ink variant="caption" soft>{tr('adv.ui.reviewed', { date: fmtDayYear(ADVICE_SOURCES.qsEC.checkedOn) })}</Ink>
      </Glass>
    </Screen>
  );
}
