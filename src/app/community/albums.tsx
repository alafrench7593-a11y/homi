/**
 * Albums photo de la communauté : les miens (création Premium) et ceux que des membres partagent avec moi.
 * Un album n'est jamais public : privé, ou partagé avec des membres choisis un par un.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Field, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { CommunityImage } from '@/features/community';
import { PremiumBadge } from '@/features/communitySocial';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useAlbumAction, useAlbums } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isPremiumRequired } from '@/lib/premium/features';
import type { CommunityAlbum } from '@/lib/types';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

function AlbumCard({ a }: { a: CommunityAlbum }) {
  const t = useTheme();
  return (
    <Card onPress={() => router.push(`/community/album/${a.id}` as never)} accessibilityLabel={tr('cm3.albums.a11y', { title: a.title })} testID={`album-${a.id}`}>
      <Row>
        <View style={{ width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          {a.cover ? <CommunityImage path={a.cover} style={{ width: 56, height: 56 }} accessibilityLabel="" /> : <Icon name="image" size={20} color={t.colors.textMuted} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold">{a.title}</Text>
          <Text variant="caption" muted>{[tr('cm3.albums.photos', { count: a.photo_count }), a.is_mine ? (a.shared_with?.length ? tr('cm3.albums.sharedWith', { count: a.shared_with.length }) : tr('cm3.albums.private')) : tr('cm3.albums.from', { handle: a.owner_handle ?? '' })].join(' · ')}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}

export default function Albums() {
  const toast = useToast();
  const albums = useAlbums();
  const act = useAlbumAction();
  const access = usePremiumAccess('community_albums');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const list = albums.data ?? [];
  const mine = list.filter((a) => a.is_mine);
  const shared = list.filter((a) => !a.is_mine);

  async function create() {
    try {
      const id = await act.mutateAsync({ kind: 'create', title });
      setCreating(false); setTitle('');
      if (id) router.push(`/community/album/${id}` as never);
    } catch (e) { if (isPremiumRequired(e)) { setCreating(false); access.showPreview(); } else toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('cm3.albums.title')} subtitle={tr('cm3.albums.subtitle')}>
      <Button label={tr('cm3.albums.create')} icon="plus" onPress={() => (access.require(<Text variant="small">{tr('cm3.albums.createPreview')}</Text>) ? setCreating(true) : undefined)} testID="album-create" />
      {!access.premium ? <Row gap={6}><PremiumBadge /><Text variant="caption" muted style={{ flex: 1 }}>{tr('cm3.albums.freeViewing')}</Text></Row> : null}
      <SectionTitle title={tr('cm3.albums.mine')} />
      {albums.isLoading && !albums.data ? <Skeleton kind="list" rows={2} /> : mine.length ? <View style={{ gap: spacing.sm }}>{mine.map((a) => <AlbumCard key={a.id} a={a} />)}</View>
        : <EmptyState icon="image" title={tr('cm3.albums.emptyTitle')} body={tr('cm3.albums.metadata')} />}
      {shared.length ? (
        <>
          <SectionTitle title={tr('cm3.albums.sharedWithMe')} />
          <View style={{ gap: spacing.sm }}>{shared.map((a) => <AlbumCard key={a.id} a={a} />)}</View>
        </>
      ) : null}
      <Sheet visible={creating} onClose={() => setCreating(false)} title={tr('cm3.albums.newTitle')}>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('cm3.albums.titleLabel')} value={title} onChangeText={setTitle} maxLength={80} placeholder={tr('cm3.albums.titlePlaceholder')} testID="album-title" />
          <Text variant="caption" muted>{tr('cm3.albums.privateHint')}</Text>
          <Button label={tr('cm3.albums.createSubmit')} icon="check" disabled={!title.trim()} loading={act.isPending} onPress={() => void create()} testID="album-create-submit" />
        </View>
      </Sheet>
    </Screen>
  );
}
