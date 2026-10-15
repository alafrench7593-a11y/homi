/** Nouvelle publication : n'importe quel espace, quel que soit le parcours. */
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Field, Row, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { spaceIcon } from '@/features/community';
import { useCommunityProfile } from '@/lib/data/hooks';
import { useCreatePost, useSpaces } from '@/lib/data/hooks-community';
import type { Forum } from '@/lib/types';

export default function NewPost() {
  const toast = useToast();
  const params = useLocalSearchParams<{ forum?: string }>();
  const spaces = useSpaces();
  const { data: me } = useCommunityProfile();
  const create = useCreatePost();
  const [forumId, setForumId] = useState(params.forum || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [area, setArea] = useState(me?.area_label ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const forum = spaces.all.find((f) => f.id === forumId);

  async function publish() {
    const e: Record<string, string> = {};
    if (!forumId) e.forum = 'Choisissez un espace.';
    if (title.trim().length < 3) e.title = 'Au moins 3 caractères.';
    if (!body.trim()) e.body = 'Écrivez votre message.';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const p = await create.mutateAsync({ forumId, title, body, areaLabel: forum?.is_local ? area : null });
      toast(p?.status === 'pending_review' ? 'Publication envoyée en relecture avant d’être visible.' : 'Publication en ligne.', p?.status === 'pending_review' ? 'info' : 'success');
      router.replace(`/community/post/${p.id}`);
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Publication impossible.' });
    }
  }

  if (!me) {
    return (
      <Screen back title="Nouvelle publication">
        <Banner tone="info">{'Choisissez d’abord un pseudonyme : il sera le seul élément visible par les autres membres.'}</Banner>
        <Button label="Choisir mon pseudonyme" onPress={() => router.replace('/community/profile')} />
      </Screen>
    );
  }

  const chips = (list: Forum[]) => (
    <Row wrap>{list.map((f) => <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={f.id === forumId} onPress={() => setForumId(f.id)} />)}</Row>
  );

  return (
    <Screen back title="Nouvelle publication" subtitle={`Publiée sous le pseudonyme « ${me.pseudonym} »`}>
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      {spaces.mine.length ? (
        <>
          <Text variant="label">Mes espaces</Text>
          {chips(spaces.mine)}
          <Text variant="label">Autres espaces</Text>
        </>
      ) : <Text variant="label">Espace</Text>}
      {chips(spaces.others)}
      {errors.forum ? <Text variant="small" color="#B23B3B">{errors.forum}</Text> : null}
      {forum ? <Text variant="small" muted>{forum.description}</Text> : null}
      <Field label="Titre" value={title} onChangeText={setTitle} maxLength={140} error={errors.title} />
      <Field label="Message" value={body} onChangeText={setBody} multiline maxLength={8000} error={errors.body} style={{ minHeight: 140, textAlignVertical: 'top' }} />
      {forum?.is_local && (
        <Field label="Zone générale" optional value={area} onChangeText={setArea} placeholder="ex. Lyon et alentours" hint="Jamais d’adresse personnelle. Proposez de vous retrouver dans un lieu public." maxLength={60} />
      )}
      <Banner tone="info">{'Vos conversations avec l’assistant ne sont jamais publiées. Évitez de partager des informations permettant de vous identifier.'}</Banner>
      <Button label="Publier" size="lg" loading={create.isPending} onPress={publish} />
    </Screen>
  );
}
