/**
 * Fiches pédagogiques sur les pertes : 10 fiches illustrées, sources citées, aucune n'est un diagnostic.
 * Contenus longs : « Reprendre la lecture » (dernière fiche ouverte) et favoris (étoile), sur cet appareil.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { IconButton, Row } from '@/components/ui';
import { useGuideReading } from '@/features/cycleTrack/readingStore';
import { resumeSlug } from '@/lib/domain/cycleTrack';
import { GUIDES, GUIDES_CHECKED_ON, guideLang } from '@/content/dischargeGuides';
import { GuideArt } from '@/features/cycle/GuideArt';
import { Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { fmtDayYear } from '@/features/cycle/format';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function GuidesIndex() {
  const c = useCyclePalette();
  const lang = guideLang();
  const { favorites, last, toggle } = useGuideReading();
  const resume = resumeSlug(last, GUIDES.map((g) => g.slug));
  const resumeGuide = resume ? GUIDES.find((g) => g.slug === resume) ?? null : null;
  // Favoris d'abord (ordre d'ajout), puis le reste dans l'ordre du catalogue
  const ordered = [...favorites.map((s) => GUIDES.find((g) => g.slug === s)).filter((g): g is (typeof GUIDES)[number] => !!g), ...GUIDES.filter((g) => !favorites.includes(g.slug))];
  return (
    <Screen back title={tr('cy.guides.title')} subtitle={tr('cy.guides.subtitle')}>
      <View style={{ padding: spacing.sm, borderRadius: 14, backgroundColor: c.powder }}>
        <Ink variant="small">{tr('cy.guides.notice')}</Ink>
      </View>
      {resumeGuide ? (
        <Glass onPress={() => router.push(`/cycle/guides/${resumeGuide.slug}` as never)} accessibilityLabel={tr('cy.tk.read.resumeA11y', { title: resumeGuide[lang].title })}>
          <Row style={{ alignItems: 'center' }}>
            <GuideArt tone={resumeGuide.tone} size={44} />
            <View style={{ flex: 1, gap: 2 }} testID="guides-resume">
              <Ink variant="caption" soft>{tr('cy.tk.read.resume')}</Ink>
              <Ink weight="bold">{resumeGuide[lang].title}</Ink>
            </View>
          </Row>
        </Glass>
      ) : null}
      {ordered.map((g, i) => (
        <Rise key={g.slug} delay={Math.min(i, 8) * 35}>
          <Glass onPress={() => router.push(`/cycle/guides/${g.slug}` as never)} accessibilityLabel={g[lang].title} accessibilityHint={tr('cy.guides.openHint')}>
            <Row style={{ alignItems: 'center' }}>
              <GuideArt tone={g.tone} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="bold">{g[lang].title}</Ink>
                <Ink variant="caption" soft>{g[lang].observe[0]}</Ink>
              </View>
              <IconButton icon="star" color={favorites.includes(g.slug) ? c.ink : c.inkSoft} tone={favorites.includes(g.slug) ? 'filled' : 'plain'} testID={`guide-fav-${g.slug}`}
                label={favorites.includes(g.slug) ? tr('cy.tk.read.unfav', { title: g[lang].title }) : tr('cy.tk.read.fav', { title: g[lang].title })} onPress={() => toggle(g.slug)} />
            </Row>
          </Glass>
        </Rise>
      ))}
      <Ink variant="caption" soft>{tr('cy.guides.checked', { date: fmtDayYear(GUIDES_CHECKED_ON) })}</Ink>
    </Screen>
  );
}
