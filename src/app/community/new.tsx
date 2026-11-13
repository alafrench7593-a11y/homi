/**
 * Écrire ou modifier une publication : catégorie, question ou témoignage, titre facultatif, texte, jusqu'à 4 photos
 * (recompressées, sans géolocalisation ni métadonnées), pseudonyme habituel ou publication anonyme, aperçu,
 * avertissement avant de publier une information sensible, puis « Publier ».
 * Aussi : publier dans un groupe, ajouter un sondage (2 à 6 choix, votes anonymes), mentionner un membre (@identifiant).
 * Rien n'est jamais publié automatiquement (ni conversation avec l'assistant, ni donnée de suivi, ni photo privée).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Icon, Row, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Avatar, CategorySheet, CommunityImage, spaceIcon } from '@/features/community';
import { useCommunityProfile, usePost } from '@/lib/data/hooks';
import { useCreatePost, useSpaces, useUpdatePost, type DraftPhoto } from '@/lib/data/hooks-community';
import { useGroup, useSearchMembers } from '@/lib/data/hooks-social';
import { completeMention, localizeGroupName, mentionQuery, pollOptionsError } from '@/lib/domain/communitySocial';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { friendlyError } from '@/lib/data/hooks-settings';
import { sensitiveHints } from '@/lib/domain/communityRules';
import { MAX_PHOTOS, prepareCommunityPhoto } from '@/lib/community/photos';
import { pickPhotos } from '@/lib/documents/io';
import type { FeedPhoto } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

interface LocalPhoto extends DraftPhoto { previewUri: string }

export default function Composer() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ forum?: string; edit?: string; group?: string; title?: string; kind?: string }>();
  const editId = typeof params.edit === 'string' && params.edit ? params.edit : null;
  const groupId = !editId && typeof params.group === 'string' && params.group ? params.group : null;
  const groupQ = useGroup(groupId);
  const spaces = useSpaces();
  const meQ = useCommunityProfile();
  const me = meQ.data;
  const existing = usePost(editId);
  const create = useCreatePost();
  const update = useUpdatePost();
  const [forumId, setForumId] = useState(typeof params.forum === 'string' ? params.forum : '');
  const [kind, setKind] = useState<'question' | 'testimony'>(params.kind === 'testimony' ? 'testimony' : 'question');
  const [title, setTitle] = useState(typeof params.title === 'string' ? params.title.slice(0, 140) : '');
  const [pollOn, setPollOn] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [pollDays, setPollDays] = useState<number | null>(null);
  const [body, setBody] = useState('');
  // B-12 : texte collé trop long → coupé à 8 000 caractères, en le disant
  const [bodyCut, setBodyCut] = useState(false);
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

  // Publication dans un groupe : catégorie « Questions générales » par défaut (modifiable)
  useEffect(() => {
    if (groupId && !forumId) { const f = spaces.all.find((x) => x.slug === 'questions-generales'); if (f) setForumId(f.id); }
  }, [groupId, forumId, spaces.all]);
  const mq = mentionQuery(body);
  const mentionResults = useSearchMembers(mq && mq.length >= 2 ? mq : '');
  const forum = spaces.all.find((f) => f.id === forumId) ?? null;
  const hints = useMemo(() => sensitiveHints(`${title} ${body}`), [title, body]);
  const photoCount = kept.length + added.length;
  const busy = create.isPending || update.isPending;

  async function addPhotos() {
    if (photoCount >= MAX_PHOTOS) return;
    const res = await pickPhotos(true);
    if (res === 'denied') { toast(tr('cm2.photosDenied'), 'error'); return; }
    const chosen = res.slice(0, MAX_PHOTOS - photoCount);
    if (res.length > chosen.length) toast(tr('cm2.new.maxPhotos', { max: String(MAX_PHOTOS) }), 'info');
    setPreparing(true);
    try {
      const ready: LocalPhoto[] = [];
      for (const r of chosen) {
        const p = await prepareCommunityPhoto(r.uri);
        ready.push({ uri: r.uri, bytes: p.bytes, width: p.width, height: p.height, previewUri: p.previewUri });
      }
      setAdded((a) => [...a, ...ready]);
    } catch {
      toast(tr('cm2.new.photoFailed'), 'error');
    } finally { setPreparing(false); }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!forumId) e.forum = tr('cm2.new.errCategory');
    if (title.trim() && title.trim().length < 3) e.title = tr('cm2.new.errTitle');
    if (!body.trim()) e.body = tr('cm2.new.errBody');
    if (pollOn && !editId) { const pe = pollOptionsError(pollOptions); if (pe) e.poll = pe; }
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function publish() {
    if (busy || preparing || !validate()) return;
    Keyboard.dismiss();
    // Avertissement avant de publier une information sensible
    if (hints.length && !warned) { setWarned(true); setPreview(true); return; }
    if (hints.some((h) => h.blocking) && !(await confirm(tr('cm2.new.warnTitle'), tr('cm2.new.warnBody'), tr('cm2.publishAnyway'), false))) return;
    try {
      const res = editId
        ? await update.mutateAsync({ id: editId, forumId, title, body, kind, removePaths: removed, addPhotos: added, keptCount: kept.length })
        : await create.mutateAsync({ forumId, title, body, kind, anonymous, photos: added, groupId,
          poll: pollOn ? { options: pollOptions.map((o) => o.trim()).filter(Boolean), multiple: pollMultiple, closesInDays: pollDays } : null });
      const review = res?.status === 'pending_review';
      toast(review ? tr('cm2.new.sentForReview') : editId ? tr('cm2.new.updated') : tr('cm2.new.online'), review ? 'info' : 'success');
      router.replace(`/community/post/${res.id}`);
    } catch (err) {
      setErrors({ _: friendlyError(err, tr('cm2.publishFailed')) });
    }
  }

  if ((meQ.isLoading && !me) || (editId && existing.isLoading && !existing.data)) return <Screen back title={tr('cm2.new.screenTitle')}><Skeleton kind="detail" rows={4} /></Screen>;
  if (meQ.isError && !me) return <Screen back title={tr('cm2.new.screenTitle')}><ErrorView error={meQ.error} onRetry={() => void meQ.refetch()} /></Screen>;
  if (!me) {
    return (
      <Screen back title={tr('cm2.new.newTitle')}>
        <Banner tone="info">{tr('cm2.new.needProfile')}</Banner>
        <Button label={tr('cm2.new.createProfile')} onPress={() => router.replace({ pathname: '/community/profile', params: { next: 'new' } })} />
      </Screen>
    );
  }
  if (editId && existing.data && !existing.data.is_mine) return <Screen back title={tr('cm2.new.screenTitle')}><Banner tone="danger">{tr('cm2.new.notMine')}</Banner></Screen>;

  const identity = anonymous ? tr('cm2.new.anonymousMember') : me.pseudonym;
  return (
    <Screen back title={editId ? tr('cm2.new.editTitle') : tr('cm2.new.newTitle')}>
      {errors._ ? <Banner tone="danger">{errors._}</Banner> : null}
      {groupId && groupQ.data ? (
        <Banner tone="info" title={tr('cm2.new.inGroup', { name: localizeGroupName(groupQ.data.name) })}>{groupQ.data.kind === 'private' ? tr('cm2.new.groupPrivate') : tr('cm2.new.groupPublic')}</Banner>
      ) : null}
      <Segmented label={tr('cm2.new.mode')} value={preview ? 'preview' : 'write'} onChange={(v) => setPreview(v === 'preview')} options={[{ value: 'write', label: tr('cm2.new.write') }, { value: 'preview', label: tr('cm2.new.preview') }]} />

      {preview ? (
        <View style={{ gap: spacing.sm }} testID="composer-preview">
          {hints.length ? (
            <Banner tone={hints.some((h) => h.blocking) ? 'warning' : 'info'} title={tr('cm2.new.beforePublish')}>
              {hints.map((h) => `• ${h.text}`).join('\n')}
            </Banner>
          ) : null}
          <Card>
            <Row style={{ alignItems: 'center' }}>
              <Avatar path={anonymous ? null : me.avatar_path} preset={anonymous ? null : me.avatar_preset ?? 'moon'} anonymous={anonymous} size={42} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{identity}</Text>
                <Text variant="caption" muted>{anonymous ? tr('cm2.new.anonPreview') : tr('cm2.new.justNow', { handle: String(me.handle) })}</Text>
              </View>
            </Row>
            <Row wrap gap={6} style={{ marginTop: 6 }}>
              {forum ? <Chip label={forum.title} icon={spaceIcon(forum)} /> : null}
              {kind === 'testimony' ? <Chip label={tr('cm2.new.testimony')} /> : null}
            </Row>
            {title.trim() ? <Text weight="bold" style={{ marginTop: 6 }}>{title.trim()}</Text> : null}
            <Text style={{ marginTop: 4 }}>{body.trim() || '…'}</Text>
            {pollOn ? <View style={{ gap: 4, marginTop: spacing.xs }}>{pollOptions.filter((o) => o.trim()).map((o, i) => <Text key={i} variant="small">{`○ ${o.trim()}`}</Text>)}</View> : null}
            {photoCount ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }}>
                {kept.map((p) => <CommunityImage key={p.path} path={p.path} style={{ width: '48%', aspectRatio: 1, borderRadius: radius.md }} />)}
                {added.map((p) => <Image key={p.previewUri.slice(-40)} source={{ uri: p.previewUri }} style={{ width: '48%', aspectRatio: 1, borderRadius: radius.md }} />)}
              </View>
            ) : null}
          </Card>
          <Button label={tr('cm2.new.editText')} variant="ghost" icon="edit-3" onPress={() => setPreview(false)} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">{tr('cm2.new.category')}</Text>
          <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {spaces.primary.map((f) => <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={f.id === forumId} onPress={() => setForumId(f.id)} testID={`composer-cat-${f.slug}`} />)}
            {forum && !spaces.primary.some((f) => f.id === forum.id) ? <Chip label={forum.title} icon={spaceIcon(forum)} selected /> : null}
            <Chip label={tr('cm2.new.allCategories')} icon="grid" onPress={() => setAllOpen(true)} testID="composer-all-categories" />
          </ScrollView>
          {errors.forum ? <Text variant="small" color={t.colors.danger}>{errors.forum}</Text> : forum ? <Text variant="small" muted>{forum.description}</Text> : null}
          <Segmented label={tr('cm2.new.postType')} value={kind} onChange={setKind} options={[{ value: 'question', label: tr('cm2.new.question') }, { value: 'testimony', label: tr('cm2.new.testimony') }]} />
          <Field label={tr('cm2.new.titleField')} optional value={title} onChangeText={setTitle} maxLength={140} error={errors.title} testID="composer-title" />
          <Field label={kind === 'testimony' ? tr('cm2.new.yourTestimony') : tr('cm2.new.yourQuestion')} value={body} onChangeText={(v) => { setBodyCut(v.length > 8000); setBody(v.slice(0, 8000)); }} multiline error={errors.body} style={{ minHeight: 140, textAlignVertical: 'top' }} testID="composer-body"
            hint={bodyCut ? tr('cm2.new.bodyCut') : `${body.length} / 8000`} />
          {mq && mentionResults.data?.length ? (
            <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }} testID="composer-mentions">
              {mentionResults.data.slice(0, 6).map((m) => <Chip key={m.handle} label={`@${m.handle}`} icon="at-sign" onPress={() => setBody((b) => completeMention(b, m.handle))} />)}
            </ScrollView>
          ) : null}
          {hints.length ? <Text variant="small" color={hints.some((h) => h.blocking) ? t.colors.danger : t.colors.textMuted} testID="composer-hint">{hints[0].text}</Text> : null}
          {!editId ? (
            <Card tone="soft" testID="composer-poll">
              <ToggleRow label={tr('cm2.new.addPoll')} hint={tr('cm2.new.addPollHint')} value={pollOn} onChange={setPollOn} />
              {pollOn ? (
                <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                  {pollOptions.map((o, i) => (
                    <Row key={i}>
                      <View style={{ flex: 1 }}><Field label={tr('cm2.new.pollChoice', { n: String(i + 1) })} value={o} maxLength={80} onChangeText={(v) => setPollOptions((list) => list.map((x, j) => (j === i ? v : x)))} testID={`composer-poll-${i}`} /></View>
                      {pollOptions.length > 2 ? <Tappable accessibilityRole="button" accessibilityLabel={tr('cm2.new.pollRemove', { n: String(i + 1) })} onPress={() => setPollOptions((list) => list.filter((_, j) => j !== i))} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={16} color={t.colors.textMuted} /></Tappable> : null}
                    </Row>
                  ))}
                  {pollOptions.length < 6 ? <Button label={tr('cm2.new.pollAdd')} icon="plus" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setPollOptions((list) => [...list, ''])} testID="composer-poll-add" /> : null}
                  <ToggleRow label={tr('cm2.new.pollMultiple')} value={pollMultiple} onChange={setPollMultiple} />
                  <Row wrap gap={6}>
                    {([null, 1, 3, 7] as const).map((d) => {
                      const l = d == null ? tr('cm2.new.pollNoEnd') : tr('cm2.new.pollDays', { count: String(d) });
                      return <Chip key={l} label={l} selected={pollDays === d} onPress={() => setPollDays(d)} />;
                    })}
                  </Row>
                  {errors.poll ? <Text variant="small" color={t.colors.danger}>{errors.poll}</Text> : null}
                </View>
              ) : null}
            </Card>
          ) : null}

          <Text variant="label">{tr('cm2.new.photos', { count: String(photoCount), max: String(MAX_PHOTOS) })}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} testID="composer-photos">
            {kept.map((p) => (
              <View key={p.path} style={{ width: 84, height: 84 }}>
                <CommunityImage path={p.path} style={{ width: 84, height: 84, borderRadius: radius.md }} />
                <Tappable accessibilityRole="button" accessibilityLabel={tr('cm2.new.deletePhoto')} onPress={() => { setKept((k) => k.filter((x) => x.path !== p.path)); setRemoved((r) => [...r, p.path]); }} style={{ position: 'absolute', top: -8, right: -8, width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(15,11,20,0.75)', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} color="#FFFFFF" /></View>
                </Tappable>
              </View>
            ))}
            {added.map((p, i) => (
              <View key={`${i}-${p.previewUri.slice(-24)}`} style={{ width: 84, height: 84 }}>
                <Image source={{ uri: p.previewUri }} style={{ width: 84, height: 84, borderRadius: radius.md }} accessibilityLabel={tr('cm2.new.addedPhoto', { n: String(i + 1) })} />
                <Tappable accessibilityRole="button" accessibilityLabel={tr('cm2.new.removePhoto')} onPress={() => setAdded((a) => a.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -8, right: -8, width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(15,11,20,0.75)', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} color="#FFFFFF" /></View>
                </Tappable>
              </View>
            ))}
            {photoCount < MAX_PHOTOS ? (
              <Tappable accessibilityRole="button" accessibilityLabel={tr('cm2.new.addPhotos')} onPress={addPhotos} testID="composer-add-photo"
                style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Icon name={preparing ? 'loader' : 'image'} color={t.colors.textMuted} />
                <Text variant="caption" muted>{preparing ? tr('cm2.new.preparing') : tr('cm2.new.add')}</Text>
              </Tappable>
            ) : null}
          </View>
          <Text variant="caption" muted>{tr('cm2.new.photosNote')}</Text>

          {!editId ? (
            <>
              <Text variant="label">{tr('cm2.new.publishAs')}</Text>
              <Segmented label={tr('cm2.new.identity')} value={anonymous ? 'anon' : 'me'} onChange={(v) => setAnonymous(v === 'anon')} options={[{ value: 'me', label: `@${me.handle}` }, { value: 'anon', label: tr('cm2.new.anonymous') }]} />
              {anonymous ? <Text variant="caption" muted testID="composer-anon-help">{tr('cm2.new.anonHelp')}</Text> : null}
            </>
          ) : <Text variant="caption" muted>{anonymous ? tr('cm2.new.anonFixed') : tr('cm2.new.publishedAs', { handle: String(me.handle) })}</Text>}
        </View>
      )}

      <Banner tone="info">{tr('cm2.new.nothingAuto')}</Banner>
      <Button label={warned && hints.length ? tr('cm2.publishAnyway') : editId ? tr('cm2.new.saveChanges') : tr('cm2.publish')} size="lg" loading={busy} disabled={preparing} onPress={publish} testID="composer-publish" />
      <CategorySheet visible={allOpen} onClose={() => setAllOpen(false)} forums={spaces.all} selected={forumId || null} onSelect={(id) => setForumId(id ?? '')} />
    </Screen>
  );
}
