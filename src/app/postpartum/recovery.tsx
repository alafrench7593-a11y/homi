/**
 * Récupération physique après l'accouchement : cicatrisation, rééducation périnéale, rééducation abdominale.
 * Repères généraux tirés de sources officielles ; rien ici ne remplace l'examen de la consultation postnatale.
 */
import React from 'react';
import { Linking, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Card, ListRow, Text } from '@/components/ui';
import { RecoveryWarnings } from '@/features/postpartum';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const HAS = 'https://www.has-sante.fr/upload/docs/application/pdf/synthese_post_partum.pdf';

export default function PostpartumRecovery() {
  const t = useTheme();
  const section = (title: string, lines: string[], article?: { slug: string; label: string }) => (
    <Card>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {lines.map((l) => <Text key={l} variant="small" style={{ marginTop: 6 }}>{l}</Text>)}
      {article ? <ListRow icon="book-open" title={article.label} onPress={() => router.push(`/article/${article.slug}`)} /> : null}
    </Card>
  );
  return (
    <Screen back title={tr('pr.title')} subtitle={tr('pr.subtitle')}>
      <Banner tone="info">{tr('pr.intro')}</Banner>
      {section(tr('pr.scar.title'), [tr('pr.scar.1'), tr('pr.scar.2')], { slug: 'cesarienne', label: tr('pr.scar.article') })}
      {section(tr('pr.perineum.title'), [tr('pr.perineum.1'), tr('pr.perineum.2'), tr('pr.perineum.3')], { slug: 'perinee-role', label: tr('pr.perineum.article') })}
      {section(tr('pr.abdo.title'), [tr('pr.abdo.1'), tr('pr.abdo.2')], { slug: 'diastasis', label: tr('pr.abdo.article') })}
      <RecoveryWarnings />
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HAS)} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text variant="caption" color={t.colors.primary}>{tr('pr.source')}</Text>
      </Pressable>
    </Screen>
  );
}
