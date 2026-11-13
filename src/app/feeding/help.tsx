/**
 * « Quand l'allaitement devient difficile » : aucun contenu médical nouveau. L'écran rassemble les articles
 * sourcés de la bibliothèque, les annuaires déjà vérifiés de l'application et les numéros d'urgence.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, ListRow, SectionTitle, Text } from '@/components/ui';
import { useArticles } from '@/lib/data/hooks';
import { DIRECTORIES, directoryUrl } from '@/lib/domain/nearby';
import { callNumber, openLink } from '@/lib/links';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Articles existants de la bibliothèque sur les difficultés de l'allaitement (seuls ceux publiés s'affichent). */
const SLUGS = [
  'allaitement-crevasses-douleurs-mamelons', 'allaitement-engorgement-mastite', 'muguet-et-allaitement-soigner-maman-et-bebe',
  'allaitement-debuter', 'allaitement-mixte-en-pratique', 'allaiter-ou-tirer-son-lait-reprise-du-travail-droits-organisation-conservation',
];

export default function FeedingHelp() {
  const toast = useToast();
  const { data: articles, isLoading } = useArticles();
  const list = SLUGS.map((s) => articles?.find((a) => a.slug === s)).filter((a): a is NonNullable<typeof a> => !!a);
  const dirs = DIRECTORIES.filter((d) => d.kind === 'breastfeeding' || d.kind === 'social_centre' || (d.kind === 'isolated_support' && !!d.url));

  return (
    <Screen back title={tr('lac.help.title')}>
      <Text>{tr('lac.help.intro')}</Text>
      <Banner tone="danger" icon="phone" title={tr('lac.help.urgent')} action={<Button label={tr('lac.help.emergency')} size="sm" variant="secondary" icon="phone" onPress={() => router.push('/emergency')} testID="help-emergency" />}>
        {tr('lac.help.urgentBody')}
      </Banner>

      <SectionTitle title={tr('lac.help.articles')} />
      {list.length ? (
        <Card padded={false} testID="help-articles">
          {list.map((a) => <ListRow key={a.slug} icon="book-open" title={a.title} subtitle={a.summary ?? undefined} onPress={() => router.push(`/article/${a.slug}` as never)} />)}
        </Card>
      ) : <Text muted>{isLoading ? '…' : tr('lac.help.noArticles')}</Text>}

      <SectionTitle title={tr('lac.help.pros')} />
      <Text>{tr('lac.help.prosBody')}</Text>
      <View style={{ gap: spacing.sm }} testID="help-directories">
        {dirs.map((d) => {
          const url = directoryUrl(d, null);
          return (
            <Card key={`${d.kind}-${d.title}`}>
              <Text weight="bold">{d.title}</Text>
              <Text variant="small" muted>{d.body}</Text>
              <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('lac.help.source', { source: d.source })}</Text>
              {url ? <Button label={tr('lac.help.open')} icon="external-link" size="sm" variant="secondary" onPress={() => openLink(url, toast)} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} /> : null}
              {d.phone ? <Button label={tr('lac.help.call', { phone: d.phone })} icon="phone" size="sm" variant="secondary" onPress={() => callNumber(d.phone!, toast)} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} /> : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
