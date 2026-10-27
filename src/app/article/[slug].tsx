/** Lecture d'un article : contenu, sources, dates et statut de relecture. */
import { Tappable } from '@/components/Tappable';
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ArticleBody, readingMinutes } from '@/features/articleBody';
import { PremiumGate } from '@/components/Family';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Divider, FavoriteButton, Icon, IconButton, Row, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useArticles, useInvalidate, usePremium, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useUserId } from '@/lib/auth';
import { isLocked } from '@/lib/domain/content';
import { formatDateFr } from '@/lib/domain/dates';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function ArticleScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const articlesQ = useArticles();
  const { data: articles, isLoading } = articlesQ;
  const [saving, setSaving] = useState(false);
  const premium = usePremium();
  const a = articles?.find((x) => x.slug === slug);
  const { data: fav } = useRows<{ item_id: string }>(['favorites', a?.id ?? ''], a ? { table: 'favorites', filters: [{ col: 'item_id', op: 'eq', value: a.id }] } : null);
  const saved = !!fav?.length;

  async function toggleFav() {
    if (!a || saving) return;
    setSaving(true);
    try {
      if (saved) await backend.remove('favorites', [{ col: 'item_id', op: 'eq', value: a.id }, { col: 'user_id', op: 'eq', value: userId }]);
      else await backend.insert('favorites', { user_id: userId, item_type: 'article', item_id: a.id });
      inv('favorites');
      toast(saved ? 'Retiré des favoris.' : 'Ajouté aux favoris.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !articles) return <Screen back><Skeleton kind="detail" rows={8} /></Screen>;
  if (articlesQ.isError && !articles) return <Screen back title="Article"><ErrorView error={articlesQ.error} onRetry={() => void articlesQ.refetch()} title="Impossible d’afficher cet article" /></Screen>;
  if (!a) {
    return (
      <Screen back title="Article introuvable">
        <EmptyState icon="book-open" title="Cet article n’existe pas ou n’est plus disponible" body="Il a peut-être été retiré ou mis à jour. Retrouvez tous les articles dans la bibliothèque." action={{ label: 'Ouvrir la bibliothèque', icon: 'book-open', onPress: () => router.replace('/library') }} />
        <Button label="Retour" variant="ghost" icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Screen>
    );
  }

  const body = <ArticleBody source={a.body_md} />;
  // Relu ou validé seulement si une personne (nom + qualification) est enregistrée ; sinon « À vérifier »
  const raw = a.editorial_status ?? 'to_review';
  const status = (raw === 'reviewed' || raw === 'validated') && !(a.reviewer_name && a.reviewer_qualification) ? 'to_review' : raw;
  return (
    <Screen back right={<FavoriteButton icon="bookmark" active={!!saved} labelOn="Retirer des favoris" labelOff="Ajouter aux favoris" onPress={toggleFav} />}>
      <Row style={{ alignItems: 'center' }}>
        <Icon name="clock" size={14} color={t.colors.textMuted} />
        <Text variant="caption" muted testID="article-reading-time">{readingMinutes(a.body_md)} min de lecture</Text>
      </Row>
      <Text variant="title" accessibilityRole="header">{a.title}</Text>
      <Text italic color={t.colors.primary}>{a.summary}</Text>
      {/* Statut éditorial réel : jamais « relu » ou « validé » sans le nom et la qualification de la personne */}
      <View testID="article-status">
        <Banner tone={status === 'validated' || status === 'reviewed' ? 'success' : 'warning'} title={tr(`art.status.${status}` as TKey)}>
          {status === 'validated' || status === 'reviewed'
            ? tr(`art.statusBody.${status}` as TKey, { name: a.reviewer_name ?? '', qualification: a.reviewer_qualification ?? '' })
            : `${tr(`art.statusBody.${status}` as TKey)} ${tr('art.notAdvice')}`}
        </Banner>
      </View>
      {isLocked(a, premium) ? <PremiumGate feature="Article réservé à l’abonnement">{body}</PremiumGate> : body}
      <Divider />
      <Card tone="soft">
        <Text weight="bold">{tr('art.references')}</Text>
        {a.sources.length ? a.sources.map((s) => (
          <Tappable key={s.url} accessibilityRole="link" onPress={() => void Linking.openURL(s.url).catch(() => toast('Impossible d’ouvrir ce lien sur cet appareil.', 'error'))} style={{ marginTop: 6, alignSelf: 'stretch' }}>
            <Icon name="external-link" size={14} color={t.colors.primary} />
            <Text variant="small" color={t.colors.text} style={{ flex: 1 }}>
              {s.label}{s.published ? ` — ${tr('art.published', { date: formatDateFr(s.published) })}` : ''}{s.consulted_on ? ` (${tr('art.consulted', { date: formatDateFr(s.consulted_on) })})` : ''}
            </Text>
          </Tappable>
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
