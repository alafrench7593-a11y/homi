/**
 * Espace « Moi aussi » : la santé et le bien-être de l'adulte, notamment après la naissance.
 * Ton doux, aucune injonction. Les numéros d'urgence restent toujours gratuits et visibles.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { GlassSurface } from '@/components/Glass';
import { Tappable } from '@/components/Tappable';
import { EmergencyList } from '@/components/Family';
import { Banner, Card, Icon, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useAppointments, useArticles, useDocuments, useMoods } from '@/lib/data/hooks';
import { useParentSleepLogs } from '@/lib/data/hooks-sleep';
import { nightLabel, nightMinutes } from '@/lib/domain/parentSleep';
import { formatDate, t as tr } from '@/i18n';
import { formatDuration } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Thèmes de récupération, reliés aux articles de la bibliothèque quand ils existent. */
const rehab = (): { key: string; icon: IconName; title: string; text: string; slugs: string[]; tags: string[] }[] => [
  {
    key: 'perinee', icon: 'feather', title: tr('u8.me.rehab.perinee.title'),
    text: tr('u8.me.rehab.perinee.text'),
    slugs: ['perinee-role'], tags: ['perinee'],
  },
  {
    key: 'abdos', icon: 'activity', title: tr('u8.me.rehab.abdos.title'),
    text: tr('u8.me.rehab.abdos.text'),
    slugs: ['diastasis'], tags: ['abdominaux'],
  },
  {
    key: 'emotions', icon: 'cloud', title: tr('u8.me.rehab.emotions.title'),
    text: tr('u8.me.rehab.emotions.text'),
    slugs: ['baby-blues-ou-depression', 'demander-de-l-aide'], tags: ['emotions'],
  },
  {
    key: 'corps', icon: 'sun', title: tr('u8.me.rehab.corps.title'),
    text: tr('u8.me.rehab.corps.text'),
    slugs: ['hormones-apres-naissance', 'cesarienne'], tags: ['hormones'],
  },
];

export default function MeSpace() {
  const t = useTheme();
  const { data: articles } = useArticles();
  const { data: moods } = useMoods(1);
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: documents } = useDocuments();
  const { data: sleepLogs } = useParentSleepLogs(1);

  const lastMood = moods?.[0];
  const lastNight = sleepLogs?.[0];
  const lastNightMinutes = lastNight ? nightMinutes(lastNight) : null;
  const nextAppt = appointments?.find((a) => a.for_parent) ?? appointments?.[0];

  const links: { icon: IconName; title: string; subtitle: string; to: string }[] = [
    { icon: 'sun', title: tr('u8.me.l.postpartum'), subtitle: tr('u8.me.l.postpartumSub'), to: '/postpartum' },
    { icon: 'heart', title: tr('u8.me.l.mood'), subtitle: lastMood ? tr('u8.me.l.moodLast', { date: formatDate(lastMood.checked_at, { day: 'numeric', month: 'long' }) }) : tr('u8.me.l.moodNone'), to: '/me/mood' },
    { icon: 'moon', title: tr('u8.me.l.sleep'), subtitle: lastNight ? `${nightLabel(lastNight.log_date)}${lastNightMinutes != null ? ` · ${formatDuration(lastNightMinutes)}` : ''}` : tr('u8.me.l.sleepNone'), to: '/me/sleep' },
    { icon: 'circle', title: tr('u8.me.l.cycle'), subtitle: tr('u8.me.l.cycleSub'), to: '/cycle' },
    { icon: 'calendar', title: tr('u8.me.l.appts'), subtitle: nextAppt ? tr('u8.me.l.apptNext', { title: nextAppt.title }) : tr('u8.me.l.apptNone'), to: '/appointments' },
    { icon: 'folder', title: tr('u8.me.l.docs'), subtitle: documents?.length ? tr('u8.me.l.docCount', { count: documents.length }) : tr('u8.me.l.docsNone'), to: '/documents' },
  ];

  return (
    <Screen back title={tr('u8.me.title')} subtitle={tr('u8.me.subtitle')}
      action={{ label: tr('u8.me.l.mood'), icon: 'heart', onPress: () => router.push('/me/mood'), testID: 'me-main-action' }}>
      <TodaySummary title={tr('u8.me.forMe')} items={[
        { icon: 'moon', value: lastNightMinutes != null ? formatDuration(lastNightMinutes) : '—', label: lastNight ? nightLabel(lastNight.log_date) : tr('u8.me.lastNight') },
        { icon: 'heart', value: lastMood ? formatDate(lastMood.checked_at, { day: 'numeric', month: 'short' }) : '—', label: tr('u8.me.lastCheck') },
        { icon: 'calendar', value: nextAppt ? formatDate(nextAppt.starts_at, { day: 'numeric', month: 'short' }) : '—', label: tr('u8.me.nextAppt') },
      ]} />

      <Text variant="small" muted>{tr('u8.me.intro')}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {links.map((l) => (
          <View key={l.to} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Tappable accessibilityRole="button" accessibilityLabel={`${l.title}. ${l.subtitle}`} onPress={() => router.push(l.to as never)}>
              <GlassSurface fill={t.colors.surface} depth={1} radius={20}>
                <View style={{ padding: spacing.md, gap: 6, minHeight: 96 }}>
                  <Icon name={l.icon} size={20} color={t.colors.primary} />
                  <Text weight="bold" numberOfLines={1}>{l.title}</Text>
                  <Text variant="caption" muted numberOfLines={2}>{l.subtitle}</Text>
                </View>
              </GlassSurface>
            </Tappable>
          </View>
        ))}
      </View>

      <Card onPress={() => router.push('/postpartum/partner')} accessibilityLabel={tr('u8.me.partnerA11y')}>
        <ListRow icon="users" title={tr('u8.me.partner')} subtitle={tr('u8.me.partnerSub')} />
      </Card>

      <SectionTitle title={tr('u8.me.recover')} />
      <Text variant="small" muted>{tr('u8.me.recoverIntro')}</Text>
      {rehab().map((r) => {
        const related = (articles ?? []).filter((a) => r.slugs.includes(a.slug) || a.tags.some((tag) => r.tags.includes(tag)));
        return (
          <Card key={r.key} tone="lavender">
            <Row style={{ alignItems: 'flex-start' }}>
              <Icon name={r.icon} color={t.colors.lavender} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text weight="bold">{r.title}</Text>
                <Text variant="small">{r.text}</Text>
              </View>
            </Row>
            {related.length > 0 && (
              <View style={{ marginTop: spacing.xs }}>
                {related.slice(0, 2).map((a) => (
                  <ListRow key={a.id} icon="book-open" title={a.title} subtitle={tr('u8.me.readArticle')} onPress={() => router.push(`/article/${a.slug}` as never)} />
                ))}
              </View>
            )}
          </Card>
        );
      })}

      <Banner tone="info" title={tr('u8.me.whenTitle')}>
        {tr('u8.me.whenBody')}
      </Banner>

      <SectionTitle title={tr('u8.me.helpNow')} />
      <Text variant="small" muted>{tr('u8.me.helpNowSub')}</Text>
      <EmergencyList compact />
      <ListRow icon="life-buoy" title={tr('u8.me.allHelp')} subtitle={tr('u8.me.allHelpSub')} onPress={() => router.push('/emergency')} />
    </Screen>
  );
}
