/** Une fiche : ce qui s'observe, variations, quoi noter, limites, quand demander un avis, sources (liens officiels). */
import React from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Button, IconButton, Row } from '@/components/ui';
import { useGuideReading } from '@/features/cycleTrack/readingStore';
import { guideBySlug, guideLang, SOURCES } from '@/content/dischargeGuides';
import { GuideArt } from '@/features/cycle/GuideArt';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

function Section({ title, items, icon, delay }: { title: string; items: string[]; icon: 'symptoms' | 'stats' | 'journal' | 'privacy' | 'reminders'; delay: number }) {
  const c = useCyclePalette();
  return (
    <Rise delay={delay}>
      <Glass>
        <Row><CycleIcon name={icon} color={c.mauve} /><Ink weight="bold" style={{ flex: 1 }}>{title}</Ink></Row>
        {items.map((t) => <Ink key={t} variant="small">{`• ${t}`}</Ink>)}
      </Glass>
    </Rise>
  );
}

export default function GuideScreen() {
  const c = useCyclePalette();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const g = guideBySlug(slug ?? '');
  const lang = guideLang();
  const { favorites, toggle, opened } = useGuideReading();
  // Reprise de lecture : la fiche ouverte devient « à reprendre » dans la liste
  React.useEffect(() => { if (g) opened(g.slug); }, [g?.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g) return <Screen back title={tr('cy.guides.title')}><EmptyState icon="book-open" title={tr('cy.guides.notFound')} /></Screen>;
  const x = g[lang];
  return (
    <Screen back title={x.title}
      right={<IconButton icon="star" tone={favorites.includes(g.slug) ? 'filled' : 'plain'} testID="guide-fav"
        label={favorites.includes(g.slug) ? tr('cy.tk.read.unfav', { title: x.title }) : tr('cy.tk.read.fav', { title: x.title })} onPress={() => toggle(g.slug)} />}>
      <Rise>
        <View style={{ alignItems: 'center' }}><GuideArt tone={g.tone} size={132} /></View>
      </Rise>
      <Glass><Ink>{x.intro}</Ink></Glass>
      <Section title={tr('cy.guides.observe')} items={x.observe} icon="symptoms" delay={40} />
      <Section title={tr('cy.guides.variations')} items={x.variations} icon="stats" delay={80} />
      <Section title={tr('cy.guides.note')} items={x.note} icon="journal" delay={120} />
      <Rise delay={160}>
        <Glass>
          <Row><CycleIcon name="privacy" color={c.mauve} /><Ink weight="bold" style={{ flex: 1 }}>{tr('cy.guides.limits')}</Ink></Row>
          <Ink variant="small">{x.limits}</Ink>
        </Glass>
      </Rise>
      <Rise delay={200}>
        <View style={{ padding: spacing.md, borderRadius: 18, backgroundColor: c.powder, gap: 6 }}>
          <Ink weight="bold">{tr('cy.guides.seek')}</Ink>
          {x.seek.map((t) => <Ink key={t} variant="small">{`• ${t}`}</Ink>)}
          <Button label={tr('cy.guides.emergency')} variant="secondary" size="sm" icon="life-buoy" onPress={() => router.push('/emergency')} />
        </View>
      </Rise>
      <Button label={tr('cy.guides.log')} icon="plus" onPress={() => router.push('/cycle/discharge/new' as never)} full />
      <Glass>
        <Ink weight="bold">{tr('cy.guides.sources')}</Ink>
        {g.sources.map((id) => {
          const s = SOURCES[id];
          return (
            <Button key={id} label={`${s.org} — ${s.title}${s.lang !== lang ? ` (${tr(`cy.lang.${s.lang}` as 'cy.lang.en')})` : ''}`} variant="ghost" icon="external-link"
              onPress={() => Linking.openURL(s.url).catch(() => undefined)} />
          );
        })}
        <Ink variant="caption" soft>{tr('cy.guides.disclaimer')}</Ink>
      </Glass>
    </Screen>
  );
}
