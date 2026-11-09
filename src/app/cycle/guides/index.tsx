/** Fiches pédagogiques sur les pertes : 10 fiches illustrées, sources citées, aucune n'est un diagnostic. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Row } from '@/components/ui';
import { GUIDES, GUIDES_CHECKED_ON, guideLang } from '@/content/dischargeGuides';
import { GuideArt } from '@/features/cycle/GuideArt';
import { Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function GuidesIndex() {
  const c = useCyclePalette();
  const lang = guideLang();
  return (
    <Screen back title={tr('cy.guides.title')} subtitle={tr('cy.guides.subtitle')}>
      <View style={{ padding: spacing.sm, borderRadius: 14, backgroundColor: c.powder }}>
        <Ink variant="small">{tr('cy.guides.notice')}</Ink>
      </View>
      {GUIDES.map((g, i) => (
        <Rise key={g.slug} delay={Math.min(i, 8) * 35}>
          <Glass onPress={() => router.push(`/cycle/guides/${g.slug}` as never)} accessibilityLabel={g[lang].title} accessibilityHint={tr('cy.guides.openHint')}>
            <Row style={{ alignItems: 'center' }}>
              <GuideArt tone={g.tone} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="bold">{g[lang].title}</Ink>
                <Ink variant="caption" soft>{g[lang].observe[0]}</Ink>
              </View>
            </Row>
          </Glass>
        </Rise>
      ))}
      <Ink variant="caption" soft>{tr('cy.guides.checked', { date: fmtDayYear(GUIDES_CHECKED_ON) })}</Ink>
    </Screen>
  );
}
