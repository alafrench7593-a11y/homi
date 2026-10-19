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

const STATUS_LABEL: Record<string, string> = { visible: 'Visible', hidden: 'Masqué', pending_review: 'En attente de relecture', removed: 'Supprimé' };
const ARTICLE_STATUS: Record<string, string> = { draft: 'Brouillons', in_review: 'En relecture', published: 'Publiés', archived: 'Archivés' };
const JOURNEY_LABEL: Record<string, string> = { avoid: 'Contraception', ttc: 'Projet de bébé', pregnant: 'Grossesse', newborn: 'Nouveau-né', child: 'Enfant', family: 'Famille' };

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, gap: 2 }} accessible accessibilityLabel={`${label} : ${value ?? 'inconnu'}`}>
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
    if (action === 'remove' && !(await confirm('Supprimer ce contenu ?', 'Il ne sera plus visible par personne. L’action est journalisée.', 'Supprimer'))) return;
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
          {`${item.kind === 'post' ? 'Publication' : 'Commentaire'} · ${STATUS_LABEL[item.status] ?? item.status}`}
        </Text>
        <Text variant="caption" muted>{timeAgo(item.created_at)}</Text>
      </Row>
      {item.title ? <Text weight="bold" style={{ marginTop: 4 }}>{item.title}</Text> : null}
      <Text variant="small" numberOfLines={6} style={{ marginTop: 2 }}>{item.body}</Text>
      {item.report_count ? <Text variant="caption" muted style={{ marginTop: 4 }}>{`${item.report_count} signalement${item.report_count > 1 ? 's' : ''}`}</Text> : null}
      <Row wrap style={{ marginTop: spacing.sm }}>
        {item.status !== 'visible' ? <Button label="Rétablir" size="sm" variant="secondary" disabled={moderate.isPending} onPress={() => act('restore', 'Contenu rétabli.')} /> : null}
        {item.status === 'visible' ? <Button label="Masquer" size="sm" variant="secondary" disabled={moderate.isPending} onPress={() => act('hide', 'Contenu masqué.')} /> : null}
        {item.report_count && item.status === 'visible' ? <Button label="Classer sans suite" size="sm" variant="ghost" disabled={moderate.isPending} onPress={() => act('dismiss_report', 'Signalements classés.')} /> : null}
        <Button label="Supprimer" size="sm" variant="ghost" disabled={moderate.isPending} onPress={() => act('remove', 'Contenu supprimé.')} />
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
    if (title.trim().length < 3 || title.trim().length > 80) e.title = 'Titre de 3 à 80 caractères.';
    if (body.trim().length < 3 || body.trim().length > 240) e.body = 'Message de 3 à 240 caractères.';
    if (link.trim() && !link.trim().startsWith('/')) e.link = 'Lien interne commençant par « / » (ex. /settings/subscription).';
    setBErrors(e);
    if (Object.keys(e).length) return;
    const ok = await confirm(
      'Envoyer cette annonce à tous les comptes ?',
      `« ${title.trim()} »\n\n${body.trim()}\n\nElle apparaîtra dans le centre de notifications de chaque personne. Cette action ne peut pas être annulée.`,
      'Envoyer',
    );
    if (!ok || broadcast.isPending) return;
    try {
      const n = await broadcast.mutateAsync({ title: title.trim(), body: body.trim(), deepLink: link.trim() || null });
      toast(`Annonce envoyée à ${n} compte${n > 1 ? 's' : ''}.`);
      setTitle(''); setBody(''); setLink('');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  if (isLoading) return <Screen back title="Administration"><Skeleton kind="detail" rows={5} /></Screen>;

  if (!moderator && !editor) {
    return (
      <Screen back title="Accès réservé">
        <Card tone="soft">
          <Text weight="bold">Cet espace est réservé à l’équipe</Text>
          <Text variant="small" muted style={{ marginTop: 4 }}>Il permet à l’équipe de modération et d’administration de veiller sur la communauté. Si vous pensez devoir y accéder, contactez l’administrateur de l’application.</Text>
          <Button label="Retour aux réglages" size="sm" variant="secondary" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} />
        </Card>
        {isDemo ? (
          <Banner tone="demo" title="Mode démonstration" action={<Button label="Afficher un aperçu" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => setPreview(true)} />}>
            {'Aucun rôle n’existe hors connexion à Supabase. Vous pouvez afficher un aperçu du tableau de bord avec les données de cet appareil.'}
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
      {preview ? <Banner tone="demo" title="Aperçu de démonstration">{'Données de cet appareil uniquement. Une annonce n’est envoyée qu’à vous-même.'}</Banner> : null}

      {admin ? (
        <>
          <SectionTitle title="En chiffres" action="Actualiser" onAction={() => stats.refetch()} />
          {stats.isLoading && !stats.data ? <Skeleton kind="card" rows={1} /> : stats.isError && !stats.data ? (
            <ErrorView error={stats.error} onRetry={() => void stats.refetch()} title="Statistiques indisponibles" />
          ) : (
            <Card>
              <Row wrap>
                <Stat label="Comptes" value={stats.data?.accounts} />
                <Stat label="Parcours d’accueil terminés" value={stats.data?.onboarded} />
                <Stat label="Grossesses en cours" value={stats.data?.active_pregnancies} />
                <Stat label="dont grossesses multiples" value={stats.data?.multiple_pregnancies} />
                <Stat label="Profils enfants" value={stats.data?.children} />
                <Stat label="Abonnements actifs" value={stats.data?.premium} />
                <Stat label="Publications (7 jours)" value={stats.data?.posts_7d} />
                <Stat label="Signalements ouverts" value={stats.data?.open_reports} />
              </Row>
              {stats.data?.journeys && Object.keys(stats.data.journeys).length ? (
                <View style={{ marginTop: spacing.sm, gap: 2 }}>
                  <Text variant="label">Parcours déclarés</Text>
                  {Object.entries(stats.data.journeys).sort((a, b) => b[1] - a[1]).map(([j, n]) => (
                    <Row key={j} style={{ justifyContent: 'space-between' }}><Text variant="small">{JOURNEY_LABEL[j] ?? j}</Text><Text variant="small" weight="bold">{n}</Text></Row>
                  ))}
                </View>
              ) : null}
              <Text variant="caption" muted style={{ marginTop: spacing.sm }}>Agrégats uniquement : aucune donnée individuelle n’est consultable ici.</Text>
            </Card>
          )}
        </>
      ) : null}

      {moderator ? (
        <>
          <SectionTitle title="File de modération" action="Actualiser" onAction={() => queue.refetch()} />
          {queueLoading ? <Skeleton kind="card" rows={2} /> : queueError ? (
            <ErrorView error={queue.error} onRetry={() => void queue.refetch()} title="File de modération indisponible" />
          ) : null}
        </>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>

      {editor ? <Button label="Recettes : relecture et validation" icon="book-open" variant="secondary" onPress={() => router.push('/admin/recipes')} testID="admin-open-recipes" /> : null}
      {editor ? (
        <>
          <SectionTitle title="Validation des articles" />
          {articles.isLoading && !articles.data ? <Skeleton kind="card" rows={1} /> : articles.isError && !articles.data ? (
            <ErrorView error={articles.error} onRetry={() => void articles.refetch()} title="Articles indisponibles" />
          ) : (
            <Card>
              <Row wrap>
                {Object.entries(ARTICLE_STATUS).map(([k, label]) => <Stat key={k} label={label} value={articleOverview.byStatus[k] ?? 0} />)}
              </Row>
              <Divider />
              <Text variant="small">{`Publiés sans relecture professionnelle enregistrée : ${articleOverview.unreviewed.length}`}</Text>
              {articleOverview.safetyUnreviewed.length ? (
                <Text variant="small" weight="bold">{`dont ${articleOverview.safetyUnreviewed.length} article${articleOverview.safetyUnreviewed.length > 1 ? 's' : ''} de sécurité — à faire relire en priorité`}</Text>
              ) : null}
              <Text variant="small">{`Relus il y a plus d’un an : ${articleOverview.stale.length}`}</Text>
              {articleOverview.unreviewed.slice(0, 8).map((a) => (
                <Text key={a.id} variant="caption" muted>{`• ${a.title}${a.is_safety_critical ? ' (sécurité)' : ''}`}</Text>
              ))}
              {articleOverview.unreviewed.length > 8 ? <Text variant="caption" muted>{`… et ${articleOverview.unreviewed.length - 8} autres`}</Text> : null}
              <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Un relecteur n’est jamais inventé : le champ reste vide tant qu’aucun professionnel n’a validé l’article.</Text>
            </Card>
          )}
        </>
      ) : null}

      {admin ? (
        <>
          <SectionTitle title="Annonce à tous" />
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Banner tone="warning">{'À réserver aux informations importantes (maintenance, nouveauté majeure, alerte officielle). Pas de message commercial.'}</Banner>
              <Field label="Titre" value={title} onChangeText={setTitle} maxLength={80} error={bErrors.title} />
              <Field label="Message" value={body} onChangeText={setBody} maxLength={240} multiline error={bErrors.body} />
              <Field label="Lien dans l’application" optional value={link} onChangeText={setLink} autoCapitalize="none" placeholder="/settings/subscription" error={bErrors.link} />
              <Button label="Envoyer l’annonce" icon="send" loading={broadcast.isPending} onPress={send} />
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen back scroll={false} padded={false} title="Administration" subtitle={admin ? 'Statistiques anonymisées, modération, annonces.' : 'Modération de la communauté.'}>
      <VirtualList
        data={queueRows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) => <ModerationCard item={item} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={moderator && !queueLoading && !queueError ? (
          <EmptyState
            icon="check-circle"
            title="Rien à examiner pour le moment"
            body="Aucun contenu signalé, masqué ou en attente."
            action={{ label: 'Actualiser', icon: 'refresh-cw', onPress: () => void queue.refetch() }}
          />
        ) : null}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
