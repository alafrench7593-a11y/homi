/**
 * Album photo d'un enfant : chronologie par mois, ajout (appareil photo ou galerie), date, légende,
 * visibilité (foyer ou moi seulement), modification et suppression. Photos privées, jamais publiques :
 * l'affichage passe par des liens signés temporaires.
 */
import React, { useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Field, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { pickPhoto } from '@/features/cycleTests';
import { useChild } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  PhotoError, useAddChildPhoto, useCanAddPhotos, useChildPhotos, useDeleteChildPhoto, usePhotoUrl, useUpdateChildPhoto,
} from '@/lib/data/hooks-photos';
import { cleanCaption, groupByMonth, validTakenOn, CAPTION_MAX, type ChildPhoto, type PhotoVisibility } from '@/lib/domain/childPhotos';
import { childAge } from '@/lib/domain/child';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Draft = { mode: 'add'; uri: string } | { mode: 'edit'; photo: ChildPhoto };

export default function ChildAlbum() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const toast = useToast();
  const photosQ = useChildPhotos(id);
  const canAdd = useCanAddPhotos();
  const add = useAddChildPhoto();
  const update = useUpdateChildPhoto();
  const del = useDeleteChildPhoto();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [viewing, setViewing] = useState<ChildPhoto | null>(null);
  const [picking, setPicking] = useState<'camera' | 'library' | null>(null);
  const groups = useMemo(() => groupByMonth(photosQ.data ?? []), [photosQ.data]);

  if (!child) {
    return (
      <Screen back title={tr('alb.title')}>
        {photosQ.isLoading ? <Skeleton rows={3} /> : <EmptyState icon="user-x" title={tr('alb.notFound')} />}
      </Screen>
    );
  }
  const name = child.first_name;

  async function pick(source: 'camera' | 'library') {
    setPicking(source);
    try {
      const r = await pickPhoto(source);
      if (!r) return;
      if ('error' in r) toast(r.error, 'error');
      else setDraft({ mode: 'add', uri: r.uri });
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setPicking(null);
    }
  }

  async function remove(p: ChildPhoto) {
    if (!(await confirm(tr('alb.deleteTitle'), tr('alb.deleteBody'), tr('common.delete')))) return;
    try {
      await del.mutateAsync(p);
      setViewing(null);
      toast(tr('alb.deleted'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const total = photosQ.data?.length ?? 0;
  const last = photosQ.data?.[0];

  return (
    <Screen back title={tr('alb.title')} subtitle={name}>
      <TodaySummary title={tr('alb.title')} items={[
        { icon: 'image', value: String(total), label: tr('alb.count', { count: total }).replace(/^\d+\s*/, '') },
        { icon: 'calendar', value: last ? formatDateFr(last.taken_on, false) : '—', label: tr('alb.date') },
      ]} />
      <Text variant="small" muted>{tr('alb.privacy', { name })}</Text>

      {canAdd ? (
        <Card>
          <Text weight="bold">{tr('alb.add')}</Text>
          <Row wrap style={{ marginTop: spacing.sm }}>
            <Button label={tr('alb.take')} icon="camera" onPress={() => void pick('camera')} loading={picking === 'camera'} disabled={picking === 'library'} testID="album-camera" />
            <Button label={tr('alb.pick')} icon="image" variant="secondary" onPress={() => void pick('library')} loading={picking === 'library'} disabled={picking === 'camera'} testID="album-library" />
          </Row>
        </Card>
      ) : (
        <Banner tone="info">{tr('alb.readOnly')}</Banner>
      )}

      {photosQ.isLoading && !photosQ.data ? <Skeleton kind="card" rows={2} /> : photosQ.isError && !photosQ.data ? (
        <ErrorView error={photosQ.error} onRetry={() => void photosQ.refetch()} title={tr('alb.errLoad')} />
      ) : !total ? (
        <EmptyState icon="image" title={tr('alb.empty')} body={tr('alb.emptyBody', { name })} />
      ) : groups.map((g) => (
        <View key={g.key} style={{ gap: spacing.xs }}>
          <SectionTitle title={capitalize(formatDate(`${g.key}-01T12:00:00`, { month: 'long', year: 'numeric' }))} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID={`album-month-${g.key}`}>
            {g.items.map((p) => <Thumb key={p.id} photo={p} onPress={() => setViewing(p)} />)}
          </View>
        </View>
      ))}

      {draft ? (
        <PhotoForm
          key={draft.mode === 'add' ? draft.uri : draft.photo.id}
          draft={draft}
          childName={name}
          birthDate={child.birth_date}
          busy={add.isPending || update.isPending}
          onClose={() => setDraft(null)}
          onSave={async (v) => {
            try {
              if (draft.mode === 'add') {
                await add.mutateAsync({ child, uri: draft.uri, takenOn: v.takenOn, caption: v.caption, visibility: v.visibility });
                toast(tr('alb.saved'));
              } else {
                await update.mutateAsync({ id: draft.photo.id, takenOn: v.takenOn, caption: v.caption, visibility: v.visibility });
                toast(tr('alb.updated'));
              }
              setDraft(null);
              setViewing(null);
            } catch (e) {
              toast(e instanceof PhotoError ? tr(e.code === 'too_large' ? 'alb.errTooLarge' : 'alb.errUnreadable') : friendlyError(e), 'error');
            }
          }}
        />
      ) : null}

      <Sheet visible={!!viewing && !draft} onClose={() => setViewing(null)} title={viewing ? formatDateFr(viewing.taken_on) : ''}>
        {viewing ? (
          <View style={{ gap: spacing.sm }}>
            <Large photo={viewing} />
            {viewing.taken_on >= child.birth_date ? <Text variant="small" muted>{tr('alb.ageAt', { age: childAge(child.birth_date, viewing.taken_on).label })}</Text> : null}
            {viewing.caption ? <Text>{viewing.caption}</Text> : null}
            {viewing.visibility === 'private' ? <Text variant="caption" muted>{tr('alb.privateBadge')}</Text> : null}
            <Row wrap>
              <Button label={tr('alb.edit')} icon="edit-2" variant="secondary" onPress={() => setDraft({ mode: 'edit', photo: viewing })} />
              <Button label={tr('alb.delete')} icon="trash-2" variant="ghost" loading={del.isPending} onPress={() => void remove(viewing)} />
            </Row>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function capitalize(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function Thumb({ photo, onPress }: { photo: ChildPhoto; onPress: () => void }) {
  const t = useTheme();
  const url = usePhotoUrl(photo.storage_path);
  const label = [formatDateFr(photo.taken_on), photo.caption].filter(Boolean).join(' · ');
  return (
    <Tappable accessibilityRole="imagebutton" accessibilityLabel={label} onPress={onPress}
      style={{ width: '31.5%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.border + '55' }}>
      {url.data ? <Image source={{ uri: url.data }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
      {photo.visibility === 'private' ? (
        <View style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: '#0009', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text variant="caption" color="#fff">{tr('alb.privateBadge')}</Text>
        </View>
      ) : null}
    </Tappable>
  );
}

function Large({ photo }: { photo: ChildPhoto }) {
  const t = useTheme();
  const url = usePhotoUrl(photo.storage_path);
  const ratio = photo.width && photo.height ? photo.width / photo.height : 1;
  if (url.isError) return <Text muted>{tr('alb.imageUnavailable')}</Text>;
  return (
    <View style={{ width: '100%', aspectRatio: ratio, maxHeight: 480, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.border + '55' }}>
      {url.data ? <Image source={{ uri: url.data }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel={photo.caption ?? formatDateFr(photo.taken_on)} /> : null}
    </View>
  );
}

function PhotoForm({ draft, childName, birthDate, busy, onClose, onSave }: {
  draft: Draft; childName: string; birthDate: string; busy: boolean; onClose: () => void;
  onSave: (v: { takenOn: string; caption: string | null; visibility: PhotoVisibility }) => Promise<void>;
}) {
  const initial = draft.mode === 'edit' ? draft.photo : null;
  const [date, setDate] = useState(toFrDate(initial?.taken_on ?? todayISO()));
  const [caption, setCaption] = useState(initial?.caption ?? '');
  const [visibility, setVisibility] = useState<PhotoVisibility>(initial?.visibility ?? 'household');
  const [error, setError] = useState<string | null>(null);
  const previewUri = draft.mode === 'add' ? draft.uri : null;

  async function submit() {
    const iso = frToISO(date);
    if (!iso || !validTakenOn(iso, birthDate, todayISO())) return setError(tr('alb.errDate'));
    const c = cleanCaption(caption);
    if (!c.ok) return setError(tr('alb.errCaption'));
    setError(null);
    await onSave({ takenOn: iso, caption: c.value, visibility });
  }

  return (
    <Sheet visible onClose={busy ? () => undefined : onClose} title={draft.mode === 'add' ? tr('alb.add') : tr('alb.edit')}>
      <View style={{ gap: spacing.sm }}>
        {previewUri ? <Image source={{ uri: previewUri }} style={{ width: '100%', height: 220, borderRadius: radius.md }} resizeMode="cover" accessibilityLabel={tr('alb.add')} /> : null}
        <Field label={tr('alb.date')} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" testID="album-date" />
        <Field label={tr('alb.caption')} optional value={caption} onChangeText={setCaption} maxLength={CAPTION_MAX} multiline placeholder={tr('alb.captionPlaceholder')} testID="album-caption" />
        <Segmented
          label={tr('alb.visibility')}
          value={visibility}
          onChange={setVisibility}
          options={[{ value: 'household', label: tr('alb.vis.household') }, { value: 'private', label: tr('alb.vis.private') }]}
        />
        <Text variant="caption" muted>{visibility === 'household' ? tr('alb.vis.householdHint', { name: childName }) : tr('alb.vis.privateHint')}</Text>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        {busy && draft.mode === 'add' ? <Text variant="small" muted>{tr('alb.saving')}</Text> : null}
        <Button label={tr('alb.save')} icon="check" loading={busy} onPress={() => void submit()} testID="album-save" />
      </View>
    </Sheet>
  );
}
