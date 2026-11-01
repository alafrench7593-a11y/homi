/** Comprendre ce que je traverse : baby blues, signes qui méritent d'en parler, à qui s'adresser. Sources officielles. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { Banner, Text } from '@/components/ui';
import { RecoveryWarnings, SectionCard } from '@/features/postpartum';
import { UNDERSTAND } from '@/content/postpartum';
import { t as tr } from '@/i18n';

export default function PostpartumUnderstand() {
  return (
    <Screen back title={tr('u5.pp_home.l_under')} subtitle={tr('u5.pp_understand.subtitle')}>
      <Banner tone="info">{tr('u5.pp_understand.banner')}</Banner>
      {UNDERSTAND.map((s, i) => <SectionCard key={s.id} s={s} index={i} />)}
      <RecoveryWarnings />
      <Text variant="caption" muted>{tr('u5.pp_understand.checked')}</Text>
    </Screen>
  );
}
