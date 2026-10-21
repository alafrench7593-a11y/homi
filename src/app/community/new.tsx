/**
 * Écrire ou modifier une publication : catégorie, question ou témoignage, titre facultatif, texte, jusqu'à 4 photos
 * (recompressées, sans géolocalisation ni métadonnées), pseudonyme habituel ou publication anonyme, aperçu,
 * avertissement avant de publier une information sensible, puis « Publier ».
 * Rien n'est jamais publié automatiquement (ni conversation avec l'assistant, ni donnée de suivi, ni photo privée).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Icon, Row, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Avatar, CategorySheet, CommunityImage, spaceIcon } from '@/features/community';
import { useCommunityProfile, usePost } from '@/lib/data/hooks';
import { useCreatePost, useSpaces, useUpdatePost, type DraftPhoto } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { sensitiveHints } from '@/lib/domain/communityRules';
import { MAX_PHOTOS, prepareCommunityPhoto } from '@/lib/community/photos';
import { pickPhotos } from '@/lib/documents/io';
import type { FeedPhoto } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

interface LocalPhoto extends DraftPhoto { previewUri: string }

export default function Composer() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ forum?: string; edit?: string }>();
  const editId = typeof params.edit === 'string' && params.edit ? params.edit : null;
  const spaces = useSpaces();
  const meQ = useCommunityProfile();
  const me = meQ.data;
  const existing = usePost(editId);
  const create = useCreatePost();
  const update = useUpdatePost();
  const [forumId, setForumId] = useState(typeof params.forum === 'string' ? params.forum : '');
  const [kind, setKind] = useState<'question' | 'testimony'>('question');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [kept, setKept] = useState<FeedPhoto[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<LocalPhoto[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [warned, setWarned] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = existing.data;
    if (!editId || !p) return;
    setForumId(p.forum_id); setKind(p.kind ?? 'question'); setTitle(p.title ?? ''); setBody(p.body); setAnonymous(!!p.anonymous); setKept(p.photos ?? []);
  }, [editId, existing.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const forum = spaces.all.find((f) => f.id === forumId) ?? null;
  const hints = useMemo(() => sensitiveHints(`${title} ${body}`), [title, body]);
  const photoCount = kept.length + added.length;
  const busy = create.isPending || update.isPending;

  async function addPhotos() {
    if (photoCount >= MAX_PHOTOS) return;
    const res = await pickPhotos(true);
    if (res === 'denied') { toast('Autorisez l’accès aux photos dans les réglages du téléphone.', 'error'); return; }
    const chosen = res.slice(0, MAX_PHOTOS - photoCount);
    if (res.length > chosen.length) toast(`${MAX_PHOTOS} photos au maximum par publication.`, 'info');
    setPreparing(true);
    try {
      const ready: LocalPhoto[] = [];
      for (const r of chosen) {
        const p = await prepareCommunityPhoto(r.uri);
        ready.push({ uri: r.uri, bytes: p.bytes, width: p.width, height: p.height, previewUri: p.previewUri });
      }
      setAdded((a) => [...a, ...ready]);
    } catch {
      toast('Cette photo n’a pas pu être préparée. Essayez-en une autre.', 'error');
    } finally { setPreparing(false); }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!forumId) e.forum = 'Choisissez une catégorie.';
    if (title.trim() && title.trim().length < 3) e.title = 'Au moins 3 caractères, ou laissez vide.';
    if (!body.trim()) e.body = 'Écrivez votre message.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function publish() {
    if (busy || preparing || !validate()) return;
    // Avertissement avant de publier une information sensible
    if (hints.length && !warned) { setWarned(true); setPreview(true); return; }
    if (hints.some((h) => h.blocking) && !(await confirm('Publier malgré l’avertissement ?', 'Votre publication sera relue par la modération avant d’être visible. Nous vous conseillons de retirer ces informations.', 'Publier quand même', false))) return;
    try {
      const res = editId
        ? await update.mutateAsync({ id: editId, forumId, title, body, kind, removePaths: removed, addPhotos: added, keptCount: kept.length })
        : await create.mutateAsync({ forumId, title, body, kind, anonymous, photos: added });
      const review = res?.status === 'pending_review';
      toast(review ? 'Publication envoyée en relecture avant d’être visible.' : editId ? 'Publication modifiée.' : 'Publication en ligne.', review ? 'info' : 'success');
      router.replace(`/community/post/${res.id}`);
    } catch (err) {
      setErrors({ _: friendlyError(err, 'Publication impossible. Réessayez dans un instant.') });
    }
  }

  if ((meQ.isLoading && !me) || (editId && existing.isLoading && !existing.data)) return <Screen back title="Publication"><Skeleton kind="detail" rows={4} /></Screen>;
  if (meQ.isError && !me) return <Screen back title="Publication"><ErrorView error={meQ.error} onRetry={() => void meQ.refetch()} /></Screen>;
  if (!me) {
    return (
      <Screen back title="Nouvelle publication">
        <Banner tone="info">{'Créez d’abord votre profil communautaire : pseudonyme, identifiant « @ » et avatar.'}</Banner>
        <Button label="Créer mon profil" onPress={() => router.replace({ pathname: '/community/profile', params: { next: 'new' } })} />
      </Screen>
    );
  }
  if (editId && existing.data && !existing.data.is_mine) return <Screen back title="Publication"><Banner tone="danger">{'Vous ne pouvez modifier que vos propres publications.'}</Banner></Screen>;

  const identity = anonymous ? 'Membre anonyme' : me.pseudonym;
  return (
    <Screen back title={editId ? 'Modifier la publication' : 'Nouvelle publication'}>
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      <Segmented label="Mode" value={preview ? 'preview' : 'write'} onChange={(v) => setPreview(v === 'preview')} options={[{ value: 'write', label: 'Écrire' }, { value: 'preview', label: 'Aperçu' }]} />

      {preview ? (
        <View style={{ gap: spacing.sm }} testID="composer-preview">
          {hints.length ? (
            <Banner tone={hints.some((h) => h.blocking) ? 'warning' : 'info'} title="Avant de publier">
              {hints.map((h) => `• ${h.text}`).join('\n')}
            </Banner>
          ) : null}
          <Card>
            <Row style={{ alignItems: 'center' }}>
              <Avatar path={anonymous ? null : me.avatar_path} preset={anonymous ? null : me.avatar_preset ?? 'moon'} anonymous={anonymous} size={42} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{identity}</Text>
                <Text variant="caption" muted>{anonymous ? 'Votre pseudonyme et votre identifiant ne seront pas affichés' : `@${me.handle} · à l’instant`}</Text>
              </View>
            </Row>
            <Row wrap gap={6} style={{ marginTop: 6 }}>
              {forum ? <Chip label={forum.title} icon={spaceIcon(forum)} /> : null}
              {kind === 'testimony' ? <Chip label="Témoignage" /> : null}
            </Row>
            {title.trim() ? <Text weight="bold" style={{ marginTop: 6 }}>{title.trim()}</Text> : null}
            <Text style={{ marginTop: 4 }}>{body.trim() || '…'}</Text>
            {photoCount ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }}>
                {kept.map((p) => <CommunityImage key={p.path} path={p.path} style={{ width: '48%', aspectRatio: 1, borderRadius: radius.md }} />)}
                {added.map((p) => <Image key={p.previewUri.slice(-40)} source={{ uri: p.previewUri }} style={{ width: '48%', aspectRatio: 1, borderRadius: radius.md }} />)}
              </View>
            ) : null}
          </Card>
          <Button label="Modifier mon texte" variant="ghost" icon="edit-3" onPress={() => setPreview(false)} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {spaces.primary.map((f) => <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={f.id === forumId} onPress={() => setForumId(f.id)} testID={`composer-cat-${f.slug}`} />)}
            {forum && !spaces.primary.some((f) => f.id === forum.id) ? <Chip label={forum.title} icon={spaceIcon(forum)} selected /> : null}
            <Chip label="Toutes les catégories" icon="grid" onPress={() => setAllOpen(true)} testID="composer-all-categories" />
          </ScrollView>
          {errors.forum ? <Text variant="small" color={t.colors.danger}>{errors.forum}</Text> : forum ? <Text variant="small" muted>{forum.description}</Text> : null}
          <Segmented label="Type de publication" value={kind} onChange={setKind} options={[{ value: 'question', label: 'Question' }, { value: 'testimony', label: 'Témoignage' }]} />
          <Field label="Titre" optional value={title} onChangeText={setTitle} maxLength={140} error={errors.title} testID="composer-title" />
          <Field label={kind === 'testimony' ? 'Votre témoignage' : 'Votre question'} value={body} onChangeText={setBody} multiline maxLength={8000} error={errors.body} style={{ minHeight: 140, textAlignVertical: 'top' }} testID="composer-body"
            hint={`${body.length} / 8000`} />
          {hints.length ? <Text variant="small" color={hints.some((h) => h.blocking) ? t.colors.danger : t.colors.textMuted} testID="composer-hint">{hints[0].text}</Text> : null}

          <Text variant="label">{`Photos (${photoCount}/${MAX_PHOTOS})`}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} testID="composer-photos">
            {kept.map((p) => (
              <View key={p.path} style={{ width: 84, height: 84 }}>
                <CommunityImage path={p.path} style={{ width: 84, height: 84, borderRadius: radius.md }} />
                <Tappable accessibilityRole="button" accessibilityLabel="Supprimer cette photo" onPress={() => { setKept((k) => k.filter((x) => x.path !== p.path)); setRemoved((r) => [...r, p.path]); }} style={{ position: 'absolute', top: -8, right: -8, width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(20,10,17,0.75)', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} color="#FFFFFF" /></View>
                </Tappable>
              </View>
            ))}
            {added.map((p, i) => (
              <View key={`${i}-${p.previewUri.slice(-24)}`} style={{ width: 84, height: 84 }}>
                <Image source={{ uri: p.previewUri }} style={{ width: 84, height: 84, borderRadius: radius.md }} accessibilityLabel={`Photo ajoutée ${i + 1}`} />
                <Tappable accessibilityRole="button" accessibilityLabel="Retirer cette photo" onPress={() => setAdded((a) => a.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -8, right: -8, width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(20,10,17,0.75)', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} color="#FFFFFF" /></View>
                </Tappable>
              </View>
            ))}
            {photoCount < MAX_PHOTOS ? (
              <Tappable accessibilityRole="button" accessibilityLabel="Ajouter des photos" onPress={addPhotos} testID="composer-add-photo"
                style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Icon name={preparing ? 'loader' : 'image'} color={t.colors.textMuted} />
                <Text variant="caption" muted>{preparing ? 'Préparation…' : 'Ajouter'}</Text>
              </Tappable>
            ) : null}
          </View>
          <Text variant="caption" muted>Les photos sont réduites et nettoyées sur votre téléphone : la localisation et les autres métadonnées sont retirées avant l’envoi. Évitez les visages d’enfants reconnaissables.</Text>

          {!editId ? (
            <>
              <Text variant="label">Publier sous</Text>
              <Segmented label="Identité" value={anonymous ? 'anon' : 'me'} onChange={(v) => setAnonymous(v === 'anon')} options={[{ value: 'me', label: `@${me.handle}` }, { value: 'anon', label: 'Anonyme' }]} />
              {anonymous ? <Text variant="caption" muted testID="composer-anon-help">Les autres membres ne verront ni votre pseudonyme, ni votre identifiant, ni votre avatar — y compris dans vos réponses à cette publication. La modération peut toujours agir en cas d’abus.</Text> : null}
            </>
          ) : <Text variant="caption" muted>{anonymous ? 'Publication anonyme (ne change pas après publication).' : `Publiée sous @${me.handle}.`}</Text>}
        </View>
      )}

      <Banner tone="info">{'Rien n’est publié automatiquement : ni vos conversations avec l’assistant, ni vos données de suivi, ni vos photos privées. Un témoignage médical reste une expérience personnelle, pas un conseil.'}</Banner>
      <Button label={warned && hints.length ? 'Publier quand même' : editId ? 'Enregistrer les modifications' : 'Publier'} size="lg" loading={busy} disabled={preparing} onPress={publish} testID="composer-publish" />
      <CategorySheet visible={allOpen} onClose={() => setAllOpen(false)} forums={spaces.all} selected={forumId || null} onSelect={(id) => setForumId(id ?? '')} />
    </Screen>
  );
}
