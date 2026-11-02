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
import { getLocale, t as tr, type TKey } from '@/i18n';
import { AI_AUTHOR_EN, AI_AUTHOR_FR } from '@/content/articles/authors';
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
      toast(saved ? tr('u3.art.unfav') : tr('u3.art.fav'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !articles) return <Screen back><Skeleton kind="detail" rows={8} /></Screen>;
  if (articlesQ.isError && !articles) return <Screen back title={tr('u3.art.article')}><ErrorView error={articlesQ.error} onRetry={() => void articlesQ.refetch()} title={tr('u3.art.errShow')} /></Screen>;
  if (!a) {
    return (
      <Screen back title={tr('u3.art.notFound')}>
        <EmptyState icon="book-open" title={tr('u3.art.gone')} body={tr('u3.art.goneB')} action={{ label: tr('u3.art.openLib'), icon: 'book-open', onPress: () => router.replace('/library') }} />
        <Button label={tr('u3.art.back')} variant="ghost" icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Screen>
    );
  }

  const body = <ArticleBody source={a.body_md} />;
  // Relu ou validé seulement si une personne (nom + qualification) est enregistrée ; sinon « À vérifier »
  const raw = a.editorial_status ?? 'to_review';
  const status = (raw === 'reviewed' || raw === 'validated') && !(a.reviewer_name && a.reviewer_qualification) ? 'to_review' : raw;
  return (
    <Screen back right={<FavoriteButton icon="bookmark" active={!!saved} labelOn={tr('u3.art.favOff')} labelOff={tr('u3.art.favOn')} onPress={toggleFav} />}>
      <Row style={{ alignItems: 'center' }}>
        <Icon name="clock" size={14} color={t.colors.textMuted} />
        <Text variant="caption" muted testID="article-reading-time">{tr('u3.art.reading', { n: readingMinutes(a.body_md) })}</Text>
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
      {isLocked(a, premium) ? <PremiumGate feature={tr('u3.art.premiumFeat')}>{body}</PremiumGate> : body}
      <Divider />
      <Card tone="soft">
        <Text weight="bold">{tr('art.references')}</Text>
        {a.sources.length ? a.sources.map((s) => (
          <Tappable key={s.url} accessibilityRole="link" onPress={() => void Linking.openURL(s.url).catch(() => toast(tr('u3.fertCompat.linkErr'), 'error'))} style={{ marginTop: 6, alignSelf: 'stretch' }}>
            <Icon name="external-link" size={14} color={t.colors.primary} />
            <Text variant="small" color={t.colors.text} style={{ flex: 1 }}>
              {s.label}{s.published ? ` — ${tr('art.published', { date: formatDateFr(s.published) })}` : ''}{s.consulted_on ? ` (${tr('art.consulted', { date: formatDateFr(s.consulted_on) })})` : ''}
            </Text>
          </Tappable>
        )) : <Text variant="small" muted>{tr('u3.art.noSrc')}</Text>}
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          {a.author_name && <Text variant="caption" muted>{tr('u3.art.author', { name: getLocale() === 'en' && a.author_name === AI_AUTHOR_FR ? AI_AUTHOR_EN : a.author_name })}</Text>}
          <Text variant="caption" muted>{tr('u3.art.review', { who: a.reviewer_name ? `${a.reviewer_name}${a.reviewer_qualification ? `, ${a.reviewer_qualification}` : ''}${a.validated_at ? ` — ${formatDateFr(a.validated_at)}` : ''}` : tr('u3.art.notReviewed') })}</Text>
          <Text variant="caption" muted>{tr('u3.art.updated', { date: formatDateFr(a.updated_on) })}</Text>
        </View>
      </Card>
      <Row>
        <Button label={tr('u3.art.ask')} icon="message-circle" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/assistant/chat', params: { q: tr('u3.art.about', { title: a.title }) } })} />
      </Row>
    </Screen>
  );
}
