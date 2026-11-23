/**
 * 50 — Journal de grossesse et souvenirs, dans « Mon journal » (/me/diary?tab=pregnancy) : un souvenir daté, la semaine
 * (calculée d'après le terme saisi, modifiable), un titre, un texte, jusqu'à 6 photos ou échographies gardées comme
 * documents PRIVÉS du coffre. Visible de la personne seule ; les souvenirs restent après la naissance.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { WhenFields, whenDay, whenOf, type WhenValue } from '@/components/CareInputs';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useDocuments, usePregnancies } from '@/lib/data/hooks';
import { useUploadPrivatePhoto } from '@/lib/data/hooks-birthCare';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteMemory, useDocImageUrl, usePregnancyMemories, useSaveMemory } from '@/lib/data/hooks-partiels';
import { pickPhotos } from '@/lib/documents/io';
import { todayISO } from '@/lib/domain/dates';
import { byTrimester, MAX_PHOTOS, MEMORY_KINDS, parseWeek, validateMemory, weekOn, type MemoryKind, type PregnancyMemory } from './domain';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const LONG = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const;

export function DocPhoto({ id, size, onPress }: { id: string; size: number; onPress?: () => void }) {
  const t = useTheme();
  const doc = useDocuments().data?.find((d) => d.id === id);
  const url = useDocImageUrl(doc?.storage_path).data;
  return (
    <Tappable accessibilityRole="imagebutton" accessibilityLabel={doc?.title ?? tr('pmem.photo')} onPress={onPress ?? (() => router.push(`/documents/${id}`))}
      style={{ width: size, height: size, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      {url ? <Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="cover" accessibilityIgnoresInvertColors /> : <Icon name="image" color={t.colors.textMuted} />}
    </Tappable>
  );
}

function MemorySheet({ memory, visible, onClose, due, pregnancyId }: { memory: PregnancyMemory | null; visible: boolean; onClose: () => void; due: string | null; pregnancyId: string | null }) {
  const toast = useToast();
  const save = useSaveMemory();
  const del = useDeleteMemory();
  const upload = useUploadPrivatePhoto();
  const [kind, setKind] = useState<MemoryKind>('moment');
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [week, setWeek] = useState('');
  const [weekTouched, setWeekTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    const date = memory?.happened_on ?? todayISO();
    setKind(memory?.kind ?? 'moment'); setWhen(whenOf(`${date}T12:00:00`));
    const w = memory ? memory.week_sa : weekOn(due, date);
    setWeek(w == null ? '' : String(w)); setWeekTouched(!!memory);
    setTitle(memory?.title ?? ''); setBody(memory?.body ?? ''); setPhotos(memory?.photo_ids ?? []); setErr(null);
  }, [visible, memory?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  function onDate(v: WhenValue) {
    setWhen(v);
    const d = whenDay(v);
    if (!weekTouched && d) { const w = weekOn(due, d); setWeek(w == null ? '' : String(w)); }
  }
  async function addPhoto() {
    if (photos.length >= MAX_PHOTOS) return toast(tr('pmem.err.photos'), 'info');
    try {
      const picked = await pickPhotos(false);
      if (picked === 'denied') return toast(tr('pmem.photoDenied'), 'error');
      if (!picked[0]) return;
      const id = await upload.mutateAsync({ uri: picked[0].uri, title: title.trim() || tr(`pmem.kind.${kind}` as TKey), category: kind === 'ultrasound' ? 'ultrasound' : 'prenatal' });
      setPhotos((p) => [...p, id]); toast(tr('pmem.photoAdded'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function submit() {
    const date = whenDay(when);
    const w = parseWeek(week);
    const e = validateMemory({ date, week: Number.isNaN(w as number) ? -1 : w, title, body, photos }, todayISO());
    if (e) return setErr(tr(e));
    try {
      const r = await save.mutateAsync({ ...(memory ?? {}), pregnancy_id: memory?.pregnancy_id ?? pregnancyId, happened_on: date!, week_sa: w, kind, title: title.trim() || null, body: body.trim() || null, photo_ids: photos });
      toast(r.queued ? tr('pmem.savedOffline') : tr('pmem.saved'), 'success'); onClose();
    } catch (x) { setErr(friendlyError(x)); }
  }
  async function remove() {
    if (!memory || !(await confirm(tr('pmem.delete'), tr('pmem.deleteQ'), tr('pmem.delete')))) return;
    try { await del.mutateAsync({ id: memory.id, photo_ids: memory.photo_ids, removePhotos: false }); toast(tr('pmem.deleted'), 'success'); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={memory ? tr('pmem.edit') : tr('pmem.add')}>
      <Row wrap>{MEMORY_KINDS.map((k) => <Chip key={k} label={tr(`pmem.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} testID={`pm-f-kind-${k}`} />)}</Row>
      <WhenFields value={when} onChange={onDate} withTime={false} days="past" dateLabel={tr('pmem.date')} testID="pm-f-date" />
      <Field label={tr('pmem.week')} optional value={week} onChangeText={(v) => { setWeek(v); setWeekTouched(true); }} keyboardType="number-pad" suffix={tr('pmem.weekUnit')} hint={due ? tr('pmem.weekHint') : tr('pmem.weekHintNoDue')} testID="pm-f-week" />
      <Field label={tr('pmem.titleField')} optional value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('pmem.titlePh')} testID="pm-f-title" />
      <Field label={tr('pmem.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} placeholder={tr('pmem.bodyPh')} style={{ minHeight: 110, textAlignVertical: 'top' }} testID="pm-f-body" />
      <Text variant="label">{tr('pmem.photos', { count: photos.length, max: MAX_PHOTOS })}</Text>
      {photos.length ? (
        <Row wrap>
          {photos.map((id) => (
            <View key={id} style={{ gap: 2, alignItems: 'center' }}>
              <DocPhoto id={id} size={72} />
              <IconButton icon="x" label={tr('pmem.photoRemove')} onPress={() => setPhotos((p) => p.filter((x) => x !== id))} />
            </View>
          ))}
        </Row>
      ) : null}
      <Button label={tr('pmem.photoAdd')} icon="camera" size="sm" variant="secondary" loading={upload.isPending} disabled={photos.length >= MAX_PHOTOS} onPress={() => void addPhoto()} testID="pm-f-photo" />
      <Text variant="caption" muted>{tr('pmem.photoPrivate')}</Text>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="pm-f-save" />
      {memory ? <Button label={tr('pmem.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="pm-f-delete" /> : null}
    </GlassSheet>
  );
}

export function MemoriesView({ openNew }: { openNew?: boolean }) {
  const t = useTheme();
  const q = usePregnancyMemories();
  const pregnancies = usePregnancies().data ?? [];
  const current = pregnancies.find((p) => p.status === 'active') ?? pregnancies[0] ?? null;
  const list = useMemo(() => q.data ?? [], [q.data]);
  const groups = useMemo(() => byTrimester(list), [list]);
  const [sheet, setSheet] = useState<{ memory: PregnancyMemory | null } | null>(openNew ? { memory: null } : null);
  const photos = list.reduce((n, m) => n + m.photo_ids.length, 0);
  return (
    <View style={{ gap: spacing.md }} testID="pm-view">
      <Text muted>{tr('pmem.intro')}</Text>
      <Button label={tr('pmem.add')} icon="plus" onPress={() => setSheet({ memory: null })} testID="pm-add" />
      {list.length ? <Text variant="caption" muted testID="pm-count">{tr('pmem.countLine', { count: list.length, photos })}</Text> : null}
      {q.isLoading && !q.data ? <Skeleton rows={3} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('pmem.loadErr')} /> : null}
      {q.data && !list.length ? <EmptyState icon="heart" title={tr('pmem.emptyTitle')} body={tr('pmem.emptyBody')} /> : null}
      {groups.map((g, gi) => (
        <View key={`${g.trimester ?? 'x'}-${gi}`} style={{ gap: spacing.sm }}>
          <SectionTitle title={g.trimester ? tr(`pmem.tri.${g.trimester}` as TKey) : tr('pmem.tri.none')} />
          <MotionList style={{ gap: spacing.sm }}>{g.items.map((m) => (
            <MotionItem key={m.id}><Card key={m.id} onPress={() => setSheet({ memory: m })} accessibilityLabel={tr('pmem.cardA11y', { date: formatDate(`${m.happened_on}T12:00:00`, LONG) })} testID={`pm-card-${m.happened_on}`}>
              <View style={{ gap: 4 }}>
                <Text variant="caption" muted>
                  {[formatDate(`${m.happened_on}T12:00:00`, LONG), m.week_sa != null ? tr('pmem.weekShort', { n: m.week_sa }) : null, tr(`pmem.kind.${m.kind}` as TKey), m._pending ? tr('pmem.pending') : null].filter(Boolean).join(' · ')}
                </Text>
                {m.title ? <Text weight="bold">{m.title}</Text> : null}
                {m.body ? <Text numberOfLines={4}>{m.body}</Text> : null}
                {m.photo_ids.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                    {m.photo_ids.map((id) => <DocPhoto key={id} id={id} size={84} />)}
                  </ScrollView>
                ) : null}
              </View>
            </Card></MotionItem>
          ))}</MotionList>
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
        <Icon name="lock" size={14} color={t.colors.textMuted} />
        <Text variant="caption" muted style={{ flex: 1 }}>{tr('pmem.private')}</Text>
      </View>
      <MemorySheet memory={sheet?.memory ?? null} visible={!!sheet} onClose={() => setSheet(null)} due={current?.due_date ?? null} pregnancyId={current?.id ?? null} />
    </View>
  );
}
