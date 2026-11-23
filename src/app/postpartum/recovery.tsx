/**
 * Récupération physique après l'accouchement : cicatrisation, rééducation périnéale, rééducation abdominale.
 * Repères généraux tirés de sources officielles ; rien ici ne remplace l'examen de la consultation postnatale.
 * 22/11/2026 : bilans du corps datés en tête (quatorze jours, échelles 1–5 « fatigue physique », « douleurs »,
 * « récupération générale » du Point du jour, « rien de noté », fiche de correction) — CheckinDays réutilisé avec les
 * échelles du corps, même ligne du jour (`postpartum_checkins`). Aucune interprétation, aucun score.
 */
import React from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, ListRow, Text } from '@/components/ui';
import { RecoveryWarnings } from '@/features/postpartum';
import { BODY_SCALES, CheckinDays } from '@/features/pregTrack/CheckinDays';
import { usePostpartumCheckins } from '@/lib/data/hooks-postpartum';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { Tappable } from '@/components/Tappable';

const HAS = 'https://www.has-sante.fr/upload/docs/application/pdf/synthese_post_partum.pdf';

export default function PostpartumRecovery() {
  const t = useTheme();
  const q = usePostpartumCheckins(30);
  const section = (title: string, lines: string[], article?: { slug: string; label: string }) => (
    <Card>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {lines.map((l) => <Text key={l} variant="small" style={{ marginTop: 6 }}>{l}</Text>)}
      {article ? <ListRow icon="book-open" title={article.label} onPress={() => router.push(`/article/${article.slug}`)} /> : null}
    </Card>
  );
  return (
    <Screen back title={tr('pr.rec.title')} subtitle={tr('pr.rec.subtitle')}
      action={{ label: tr('rs.pp.checkin'), icon: 'feather', onPress: () => router.push('/postpartum/checkin'), testID: 'rs-ppb-action' }}>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data ? <CheckinDays list={q.data} scales={BODY_SCALES} id="ppb" title={tr('rs.pp.bodyTitle')} /> : null}
      <Text variant="caption" muted>{tr('rs.pp.bodyNote')}</Text>
      <Banner tone="info">{tr('pr.rec.intro')}</Banner>
      {section(tr('pr.scar.title'), [tr('pr.scar.1'), tr('pr.scar.2')], { slug: 'cesarienne', label: tr('pr.scar.article') })}
      {section(tr('pr.perineum.title'), [tr('pr.perineum.1'), tr('pr.perineum.2'), tr('pr.perineum.3')], { slug: 'perinee-role', label: tr('pr.perineum.article') })}
      {section(tr('pr.abdo.title'), [tr('pr.abdo.1'), tr('pr.abdo.2')], { slug: 'diastasis', label: tr('pr.abdo.article') })}
      <RecoveryWarnings />
      <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(HAS)} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text variant="caption" color={t.colors.primary}>{tr('pr.source')}</Text>
      </Tappable>
    </Screen>
  );
}
