import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Field, Row, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend } from '@/lib/backend';
import { useCommunityProfile, useForums, useInvalidate } from '@/lib/data/hooks';
import type { FeedPost } from '@/lib/types';

export default function NewPost() {
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ forum?: string }>();
  const { data: forums } = useForums();
  const { data: me } = useCommunityProfile();
  const [forumId, setForumId] = useState(params.forum || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [area, setArea] = useState(me?.area_label ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const forum = forums?.find((f) => f.id === forumId);

  async function publish() {
    const e: Record<string, string> = {};
    if (!forumId) e.forum = 'Choisissez un forum.';
    if (title.trim().length < 3) e.title = 'Au moins 3 caractères.';
    if (!body.trim()) e.body = 'Écrivez votre message.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const [p] = await backend.insert<FeedPost & { status: string }>('posts', { forum_id: forumId, title: title.trim(), body: body.trim(), area_label: forum?.is_local ? area.trim() || null : null });
      inv('forum_feed');
      toast(p?.status === 'pending_review' ? 'Publication envoyée en relecture (elle semble contenir une donnée personnelle).' : 'Publication en ligne.', p?.status === 'pending_review' ? 'info' : 'success');
      router.replace(`/community/post/${p.id}`);
    } catch (err) {
      setErrors({ _: err instanceof Error ? err.message : 'Publication impossible.' });
    } finally {
      setSaving(false);
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

  return (
    <Screen back title="Nouvelle publication" subtitle={`Publiée sous le pseudonyme « ${me.pseudonym} »`}>
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Text variant="label">Forum</Text>
      <Row wrap>{(forums ?? []).map((f) => <Chip key={f.id} label={f.title} selected={f.id === forumId} onPress={() => setForumId(f.id)} />)}</Row>
      {errors.forum ? <Text variant="small" color="#B23B3B">{errors.forum}</Text> : null}
      <Field label="Titre" value={title} onChangeText={setTitle} maxLength={140} error={errors.title} />
      <Field label="Message" value={body} onChangeText={setBody} multiline maxLength={8000} error={errors.body} style={{ minHeight: 140, textAlignVertical: 'top' }} />
      {forum?.is_local && (
        <Field label="Zone générale" optional value={area} onChangeText={setArea} placeholder="ex. Lyon et alentours" hint="Jamais d’adresse personnelle. Proposez de vous retrouver dans un lieu public." maxLength={60} />
      )}
      <Banner tone="info">{'Vos conversations avec l’assistant ne sont jamais publiées. Évitez de partager des informations permettant de vous identifier.'}</Banner>
      <Button label="Publier" size="lg" loading={saving} onPress={publish} />
    </Screen>
  );
}
