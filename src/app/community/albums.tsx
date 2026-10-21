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
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

function AlbumCard({ a }: { a: CommunityAlbum }) {
  const t = useTheme();
  return (
    <Card onPress={() => router.push(`/community/album/${a.id}` as never)} accessibilityLabel={`Album ${a.title}`} testID={`album-${a.id}`}>
      <Row>
        <View style={{ width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          {a.cover ? <CommunityImage path={a.cover} style={{ width: 56, height: 56 }} accessibilityLabel="" /> : <Icon name="image" size={20} color={t.colors.textMuted} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold">{a.title}</Text>
          <Text variant="caption" muted>{[`${a.photo_count} photo${a.photo_count > 1 ? 's' : ''}`, a.is_mine ? (a.shared_with?.length ? `partagé avec ${a.shared_with.length} membre${a.shared_with.length > 1 ? 's' : ''}` : 'privé') : `de @${a.owner_handle}`].join(' · ')}</Text>
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
    <Screen back title="Albums photo" subtitle="Privés, ou partagés avec les membres de votre choix">
      <Button label="Créer un album" icon="plus" onPress={() => (access.require(<Text variant="small">{'Un album « Premiers pas » partagé avec deux amies de la maternité, et personne d’autre.'}</Text>) ? setCreating(true) : undefined)} testID="album-create" />
      {!access.premium ? <Row gap={6}><PremiumBadge /><Text variant="caption" muted style={{ flex: 1 }}>Voir les albums partagés avec vous reste gratuit.</Text></Row> : null}
      <SectionTitle title="Mes albums" />
      {albums.isLoading && !albums.data ? <Skeleton kind="list" rows={2} /> : mine.length ? <View style={{ gap: spacing.sm }}>{mine.map((a) => <AlbumCard key={a.id} a={a} />)}</View>
        : <EmptyState icon="image" title="Aucun album" body="Les photos sont nettoyées de leurs métadonnées (position GPS comprise) avant l’envoi." />}
      {shared.length ? (
        <>
          <SectionTitle title="Partagés avec moi" />
          <View style={{ gap: spacing.sm }}>{shared.map((a) => <AlbumCard key={a.id} a={a} />)}</View>
        </>
      ) : null}
      <Sheet visible={creating} onClose={() => setCreating(false)} title="Nouvel album">
        <View style={{ gap: spacing.sm }}>
          <Field label="Titre" value={title} onChangeText={setTitle} maxLength={80} placeholder="Premiers pas" testID="album-title" />
          <Text variant="caption" muted>L’album est privé : vous choisirez ensuite avec qui le partager.</Text>
          <Button label="Créer" icon="check" disabled={!title.trim()} loading={act.isPending} onPress={() => void create()} testID="album-create-submit" />
        </View>
      </Sheet>
    </Screen>
  );
}
