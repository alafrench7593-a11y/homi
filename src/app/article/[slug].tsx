/** Lecture d'un article : contenu, sources, dates et statut de relecture. */
import React from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Markdown } from '@/components/Markdown';
import { PremiumGate } from '@/components/Family';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Divider, IconButton, Loading, Row, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useArticles, useInvalidate, usePremium, useRows } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';
import { isLocked } from '@/lib/domain/content';
import { formatDateFr } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function ArticleScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: articles, isLoading } = useArticles();
  const premium = usePremium();
  const a = articles?.find((x) => x.slug === slug);
  const { data: fav } = useRows<{ item_id: string }>(['favorites', a?.id ?? ''], a ? { table: 'favorites', filters: [{ col: 'item_id', op: 'eq', value: a.id }] } : null);
  const saved = !!fav?.length;

  async function toggleFav() {
    if (!a) return;
    if (saved) await backend.remove('favorites', [{ col: 'item_id', op: 'eq', value: a.id }, { col: 'user_id', op: 'eq', value: userId }]);
    else await backend.insert('favorites', { user_id: userId, item_type: 'article', item_id: a.id });
    inv('favorites');
    toast(saved ? 'Retiré des favoris.' : 'Ajouté aux favoris.');
  }

  if (isLoading) return <Screen back><Loading /></Screen>;
  if (!a) return <Screen back title="Article introuvable"><Button label="Retour" onPress={() => router.back()} /></Screen>;

  const body = <Markdown source={a.body_md} />;
  return (
    <Screen back right={<IconButton icon="bookmark" label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'} color={saved ? t.colors.primary : undefined} onPress={toggleFav} />}>
      <Text variant="title" accessibilityRole="header">{a.title}</Text>
      <Text italic color={t.colors.primary}>{a.summary}</Text>
      {!a.reviewer_name && (
        <Banner tone="warning" title="Contenu en attente de relecture professionnelle">
          {'Ce texte a été rédigé à partir de sources officielles mais n’a pas encore été relu par un professionnel de santé. Il ne remplace pas un avis médical.'}
        </Banner>
      )}
      {isLocked(a, premium) ? <PremiumGate feature="Article réservé à l’abonnement">{body}</PremiumGate> : body}
      <Divider />
      <Card tone="soft">
        <Text weight="bold">Sources</Text>
        {a.sources.length ? a.sources.map((s) => (
          <Text key={s.url} variant="small" color={t.colors.primary} accessibilityRole="link" onPress={() => Linking.openURL(s.url)} style={{ marginTop: 6, textDecorationLine: 'underline' }}>
            {s.label}{s.consulted_on ? ` (consulté le ${formatDateFr(s.consulted_on)})` : ''}
          </Text>
        )) : <Text variant="small" muted>Aucune source renseignée.</Text>}
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          {a.author_name && <Text variant="caption" muted>Rédaction : {a.author_name}</Text>}
          <Text variant="caption" muted>Relecture : {a.reviewer_name ? `${a.reviewer_name}${a.reviewer_qualification ? `, ${a.reviewer_qualification}` : ''}${a.validated_at ? ` — ${formatDateFr(a.validated_at)}` : ''}` : 'non encore relu'}</Text>
          <Text variant="caption" muted>Mise à jour : {formatDateFr(a.updated_on)}</Text>
        </View>
      </Card>
      <Row>
        <Button label="Poser une question" icon="message-circle" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/assistant/chat', params: { q: `À propos de « ${a.title} » : ` } })} />
      </Row>
    </Screen>
  );
}
