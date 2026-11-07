/**
 * Administration : statistiques agrégées, file de modération, annonce générale, état de validation des articles.
 * Visible uniquement pour les rôles admin / moderator. Chaque fonction serveur revérifie le rôle (has_role).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Divider, Field, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { isDemo } from '@/lib/backend';
import {
  friendlyError, useAdminStats, useAllArticles, useBroadcast, useModerate, useModerationQueue, useMyRoles, type ModAction, type ModItem,
} from '@/lib/data/hooks-settings';
import { timeAgo } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const statusLabel = (): Record<string, string> => ({ visible: tr('u5.admin.st_visible'), hidden: tr('u5.admin.st_hidden'), pending_review: tr('u5.admin.st_pending'), removed: tr('u5.admin.st_removed') });
const articleStatus = (): Record<string, string> => ({ draft: tr('u5.admin.as_draft'), in_review: tr('u5.admin.as_review'), published: tr('u5.admin.as_published'), archived: tr('u5.admin.as_archived') });
const journeyLabel = (): Record<string, string> => ({ avoid: tr('u5.admin.j_avoid'), ttc: tr('u5.admin.j_ttc'), pregnant: tr('u5.admin.j_pregnant'), newborn: tr('u5.admin.j_newborn'), child: tr('u5.admin.j_child'), family: tr('u5.admin.j_family') });

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, gap: 2 }} accessible accessibilityLabel={tr('u5.admin.stat_a11y', { label, value: value ?? tr('u5.admin.unknown') })}>
      <Text variant="heading">{value ?? '—'}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

function ModerationCard({ item }: { item: ModItem }) {
  const t = useTheme();
  const toast = useToast();
  const moderate = useModerate();
  const act = async (action: ModAction, label: string) => {
    if (moderate.isPending) return;
    if (action === 'remove' && !(await confirm(tr('u5.admin.rm_t'), tr('u5.admin.rm_b'), tr('u5.admin.delete')))) return;
    try {
      await moderate.mutateAsync({ item, action });
      toast(label);
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  };
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" weight="bold" color={item.status === 'visible' ? t.colors.textMuted : t.colors.danger}>
          {`${item.kind === 'post' ? tr('u5.admin.post') : tr('u5.admin.comment')} · ${statusLabel()[item.status] ?? item.status}`}
        </Text>
        <Text variant="caption" muted>{timeAgo(item.created_at)}</Text>
      </Row>
      {item.title ? <Text weight="bold" style={{ marginTop: 4 }}>{item.title}</Text> : null}
      <Text variant="small" numberOfLines={6} style={{ marginTop: 2 }}>{item.body}</Text>
      {item.report_count ? <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u5.admin.reports', { count: item.report_count })}</Text> : null}
      <Row wrap style={{ marginTop: spacing.sm }}>
        {item.status !== 'visible' ? <Button label={tr('u5.admin.restore')} size="sm" variant="secondary" disabled={moderate.isPending} onPress={() => act('restore', tr('u5.admin.restored'))} /> : null}
        {item.status === 'visible' ? <Button label={tr('u5.admin.hide')} size="sm" variant="secondary" disabled={moderate.isPending} onPress={() => act('hide', tr('u5.admin.hidden'))} /> : null}
        {item.report_count && item.status === 'visible' ? <Button label={tr('u5.admin.dismiss')} size="sm" variant="ghost" disabled={moderate.isPending} onPress={() => act('dismiss_report', tr('u5.admin.dismissed'))} /> : null}
        <Button label={tr('u5.admin.delete')} size="sm" variant="ghost" disabled={moderate.isPending} onPress={() => act('remove', tr('u5.admin.removed'))} />
      </Row>
    </Card>
  );
}

export default function AdminScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { isAdmin, isModerator, isEditor, isLoading } = useMyRoles();
  const [preview, setPreview] = useState(false);
  const admin = isAdmin || preview;
  const moderator = isModerator || preview;
  const editor = isEditor || preview;

  const stats = useAdminStats(admin);
  const queue = useModerationQueue(moderator);
  const articles = useAllArticles(editor);
  const broadcast = useBroadcast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [bErrors, setBErrors] = useState<Record<string, string>>({});

  const articleOverview = useMemo(() => {
    const list = articles.data ?? [];
    const byStatus: Record<string, number> = {};
    for (const a of list) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    const published = list.filter((a) => a.status === 'published');
    const unreviewed = published.filter((a) => !a.reviewer_name || !a.validated_at);
    const yearAgo = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);
    const stale = published.filter((a) => a.validated_at && a.validated_at < yearAgo);
    const safetyUnreviewed = unreviewed.filter((a) => a.is_safety_critical);
    return { total: list.length, byStatus, unreviewed, stale, safetyUnreviewed };
  }, [articles.data]);

  async function send() {
    const e: Record<string, string> = {};
    if (title.trim().length < 3 || title.trim().length > 80) e.title = tr('u5.admin.e_title');
    if (body.trim().length < 3 || body.trim().length > 240) e.body = tr('u5.admin.e_body');
    if (link.trim() && !link.trim().startsWith('/')) e.link = tr('u5.admin.e_link');
    setBErrors(e);
    if (Object.keys(e).length) return;
    const ok = await confirm(
      tr('u5.admin.send_t'),
      tr('u5.admin.send_b', { title: title.trim(), body: body.trim() }),
      tr('u5.admin.send_ok'),
    );
    if (!ok || broadcast.isPending) return;
    try {
      const n = await broadcast.mutateAsync({ title: title.trim(), body: body.trim(), deepLink: link.trim() || null });
      toast(tr('u5.admin.sent', { count: n }));
      setTitle(''); setBody(''); setLink('');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  if (isLoading) return <Screen back title={tr('u5.admin.title')}><Skeleton kind="detail" rows={5} /></Screen>;

  if (!moderator && !editor) {
    return (
      <Screen back title={tr('u5.admin.denied')}>
        <Card tone="soft">
          <Text weight="bold">{tr('u5.admin.team_only')}</Text>
          <Text variant="small" muted style={{ marginTop: 4 }}>{tr('u5.admin.team_only_b')}</Text>
          <Button label={tr('u5.admin.back')} size="sm" variant="secondary" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} />
        </Card>
        {isDemo ? (
          <Banner tone="demo" title={tr('u5.admin.demo')} action={<Button label={tr('u5.admin.preview')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => setPreview(true)} />}>
            {tr('u5.admin.demo_b')}
          </Banner>
        ) : null}
      </Screen>
    );
  }

  const queueLoading = queue.isLoading && !queue.data;
  const queueError = queue.isError && !queue.data;
  const queueRows = moderator && !queueLoading && !queueError ? (queue.data ?? []) : [];

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
      {preview ? <Banner tone="demo" title={tr('u5.admin.preview_t')}>{tr('u5.admin.preview_b')}</Banner> : null}

      {admin ? (
        <>
          <SectionTitle title={tr('u5.admin.figures')} action={tr('u5.admin.refresh')} onAction={() => stats.refetch()} />
          {stats.isLoading && !stats.data ? <Skeleton kind="card" rows={1} /> : stats.isError && !stats.data ? (
            <ErrorView error={stats.error} onRetry={() => void stats.refetch()} title={tr('u5.admin.stats_err')} />
          ) : (
            <Card>
              <Row wrap>
                <Stat label={tr('u5.admin.s_acc')} value={stats.data?.accounts} />
                <Stat label={tr('u5.admin.s_onb')} value={stats.data?.onboarded} />
                <Stat label={tr('u5.admin.s_preg')} value={stats.data?.active_pregnancies} />
                <Stat label={tr('u5.admin.s_mult')} value={stats.data?.multiple_pregnancies} />
                <Stat label={tr('u5.admin.s_child')} value={stats.data?.children} />
                <Stat label={tr('u5.admin.s_prem')} value={stats.data?.premium} />
                <Stat label={tr('u5.admin.s_posts')} value={stats.data?.posts_7d} />
                <Stat label={tr('u5.admin.s_rep')} value={stats.data?.open_reports} />
              </Row>
              {stats.data?.journeys && Object.keys(stats.data.journeys).length ? (
                <View style={{ marginTop: spacing.sm, gap: 2 }}>
                  <Text variant="label">{tr('u5.admin.journeys')}</Text>
                  {Object.entries(stats.data.journeys).sort((a, b) => b[1] - a[1]).map(([j, n]) => (
                    <Row key={j} style={{ justifyContent: 'space-between' }}><Text variant="small">{journeyLabel()[j] ?? j}</Text><Text variant="small" weight="bold">{n}</Text></Row>
                  ))}
                </View>
              ) : null}
              <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{tr('u5.admin.agg')}</Text>
            </Card>
          )}
        </>
      ) : null}

      {moderator ? (
        <>
          <SectionTitle title={tr('u5.admin.queue')} action={tr('u5.admin.refresh')} onAction={() => queue.refetch()} />
          {queueLoading ? <Skeleton kind="card" rows={2} /> : queueError ? (
            <ErrorView error={queue.error} onRetry={() => void queue.refetch()} title={tr('u5.admin.queue_err')} />
          ) : null}
        </>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>

      {moderator ? <Button label={tr('fb.admin.open_btn')} icon="message-circle" variant="secondary" onPress={() => router.push('/admin/feedback')} testID="admin-open-feedback" /> : null}
      {editor ? <Button label={tr('u5.admin.b_recipes')} icon="book-open" variant="secondary" onPress={() => router.push('/admin/recipes')} testID="admin-open-recipes" /> : null}
      {editor ? <Button label={tr('u5.admin.b_import')} icon="upload" variant="secondary" onPress={() => router.push('/admin/import-recipes')} testID="admin-open-import" /> : null}
      {editor ? <Button label={tr('u5.admin.b_products')} icon="shopping-bag" variant="secondary" onPress={() => router.push('/admin/products')} testID="admin-open-products" /> : null}
      {editor ? <Button label={tr('u5.admin.b_resources')} icon="link" variant="secondary" onPress={() => router.push('/admin/resources')} testID="admin-open-resources" /> : null}
      {editor ? (
        <>
          <SectionTitle title={tr('u5.admin.articles')} />
          {articles.isLoading && !articles.data ? <Skeleton kind="card" rows={1} /> : articles.isError && !articles.data ? (
            <ErrorView error={articles.error} onRetry={() => void articles.refetch()} title={tr('u5.admin.articles_err')} />
          ) : (
            <Card>
              <Row wrap>
                {Object.entries(articleStatus()).map(([k, label]) => <Stat key={k} label={label} value={articleOverview.byStatus[k] ?? 0} />)}
              </Row>
              <Divider />
              <Text variant="small">{tr('u5.admin.unrev', { count: articleOverview.unreviewed.length })}</Text>
              {articleOverview.safetyUnreviewed.length ? (
                <Text variant="small" weight="bold">{tr('u5.admin.unrev_safety', { count: articleOverview.safetyUnreviewed.length })}</Text>
              ) : null}
              <Text variant="small">{tr('u5.admin.stale', { count: articleOverview.stale.length })}</Text>
              {articleOverview.unreviewed.slice(0, 8).map((a) => (
                <Text key={a.id} variant="caption" muted>{`• ${a.title}${a.is_safety_critical ? ` (${tr('u5.admin.safety')})` : ''}`}</Text>
              ))}
              {articleOverview.unreviewed.length > 8 ? <Text variant="caption" muted>{tr('u5.admin.others', { count: articleOverview.unreviewed.length - 8 })}</Text> : null}
              <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('u5.admin.no_invent')}</Text>
            </Card>
          )}
        </>
      ) : null}

      {admin ? (
        <>
          <SectionTitle title={tr('u5.admin.broadcast')} />
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Banner tone="warning">{tr('u5.admin.broadcast_w')}</Banner>
              <Field label={tr('u5.admin.f_title')} value={title} onChangeText={setTitle} maxLength={80} error={bErrors.title} />
              <Field label={tr('u5.admin.f_msg')} value={body} onChangeText={setBody} maxLength={240} multiline error={bErrors.body} />
              <Field label={tr('u5.admin.f_link')} optional value={link} onChangeText={setLink} autoCapitalize="none" placeholder="/settings/subscription" error={bErrors.link} />
              <Button label={tr('u5.admin.send')} icon="send" loading={broadcast.isPending} onPress={send} />
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen back scroll={false} padded={false} title={tr('u5.admin.title')} subtitle={admin ? tr('u5.admin.sub_admin') : tr('u5.admin.sub_mod')}>
      <VirtualList
        data={queueRows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) => <ModerationCard item={item} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={moderator && !queueLoading && !queueError ? (
          <EmptyState
            icon="check-circle"
            title={tr('u5.admin.empty_t')}
            body={tr('u5.admin.empty_b')}
            action={{ label: tr('u5.admin.refresh'), icon: 'refresh-cw', onPress: () => void queue.refetch() }}
          />
        ) : null}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
