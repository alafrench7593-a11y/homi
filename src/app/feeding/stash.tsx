/**
 * Réserve de lait : stock restant (somme des portions disponibles), ajouter, utiliser, jeter, historique.
 * AUCUNE date limite de conservation n'est affichée : l'écran renvoie aux recommandations des professionnels.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, haptic, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { TimePicker } from '@/features/tracking';
import { useFeedingChild } from '@/features/lactation';
import { useArticles } from '@/lib/data/hooks';
import { useAddStash, useDeleteStash, useMilkStash, useUpdateStash } from '@/lib/data/hooks-lactation';
import { friendlyError } from '@/lib/data/hooks-settings';
import { sortStash, STASH_STORAGES, stashRemaining, stashRow, stashTransition, type StashStorage } from '@/lib/domain/lactation';
import { formatTime } from '@/lib/domain/dates';
import type { MilkStashRecord } from '@/lib/types-lactation';
import { uuid } from '@/lib/uuid';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr, type TKey } from '@/i18n';

const CONSERVATION_ARTICLE = 'allaiter-ou-tirer-son-lait-reprise-du-travail-droits-organisation-conservation';
const storageLabel = (s: StashStorage) => tr(`lac.stash.storage.${s}` as TKey);
const when = (iso: string) => {
  let d = iso.slice(0, 10);
  try { d = new Date(iso).toLocaleDateString(localeTag(), { day: 'numeric', month: 'short' }); } catch { /* format par défaut */ }
  return `${d} · ${formatTime(iso)}`;
};

export default function MilkStash() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ child?: string }>();
  const { child, loading, name } = useFeedingChild(params.child);
  const q = useMilkStash(child?.id);
  const add = useAddStash();
  const update = useUpdateStash();
  const del = useDeleteStash();
  const { data: articles } = useArticles();
  const article = articles?.find((a) => a.slug === CONSERVATION_ARTICLE) ?? null;
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState('');
  const [collected, setCollected] = useState(new Date());
  const [storage, setStorage] = useState<StashStorage>('fridge');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Screen back title={tr('lac.stash.title')}><Skeleton kind="card" rows={2} /></Screen>;
  if (!child) return <Screen back title={tr('lac.stash.title')}><EmptyState icon="user-plus" title={tr('lac.home.noChild')} /></Screen>;
  const rows = q.data ?? [];
  const stock = stashRemaining(rows);
  const { available, past } = sortStash(rows);

  function openAdd() {
    setVolume(''); setCollected(new Date()); setStorage('fridge'); setLocation(''); setNote(''); setError(null);
    setOpen(true);
  }

  async function saveAdd() {
    setError(null);
    const v = volume.trim() ? Number(volume.trim()) : null;
    const res = stashRow({ volumeMl: v != null && Number.isFinite(v) ? v : null, collectedAt: collected, storage, location, note }, new Date());
    if ('error' in res) return setError(tr(`lac.stash.err.${res.error}` as TKey));
    try {
      const sent = await add.mutateAsync({ client_id: uuid(), child_id: child!.id, household_id: child!.household_id, ...res.row });
      haptic('success');
      toast(sent === 'queued' ? tr('lac.stash.queued') : tr('lac.stash.added'), sent === 'queued' ? 'info' : 'success');
      setOpen(false);
    } catch (e) {
      setError(friendlyError(e, tr('lac.stash.err.fail')));
    }
  }

  async function transition(p: MilkStashRecord, to: 'used' | 'discarded') {
    const ask = to === 'used' ? [tr('lac.stash.useAsk'), tr('lac.stash.useBody', { ml: p.volume_ml }), tr('lac.stash.use')] : [tr('lac.stash.discardAsk'), tr('lac.stash.discardBody', { ml: p.volume_ml }), tr('lac.stash.discard')];
    if (!(await confirm(ask[0], ask[1], ask[2], to === 'discarded'))) return;
    const res = stashTransition(p, to, new Date());
    if ('error' in res) { toast(tr(`lac.stash.err.${res.error}` as TKey), 'error'); return; }
    try {
      const n = await update.mutateAsync({ id: p.id, patch: res.patch });
      if (n === 0) { toast(tr('lac.stash.already'), 'info'); return; }
      haptic('success');
      toast(to === 'used' ? tr('lac.stash.used') : tr('lac.stash.discarded'));
    } catch (e) {
      toast(friendlyError(e, tr('lac.stash.err.fail')), 'error');
    }
  }

  async function remove(p: MilkStashRecord) {
    if (!(await confirm(tr('lac.stash.delAsk'), tr('lac.stash.delBody'), tr('lac.stash.delete')))) return;
    try { await del.mutateAsync(p.id); toast(tr('lac.stash.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('lac.stash.title')} subtitle={name ? tr('lac.timer.forName', { name }) : undefined}
      action={{ label: tr('lac.stash.add'), icon: 'plus', testID: 'stash-add', onPress: openAdd }}>
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : (
        <Card testID="stash-summary" accessibilityLabel={`${tr('lac.stash.remaining')} : ${tr('lac.stash.remainingValue', { ml: stock.ml })}, ${tr('lac.stash.portions', { count: stock.count })}`}>
          <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('lac.stash.remaining')}</Text>
          <Text variant="title" testID="stash-remaining">{tr('lac.stash.remainingValue', { ml: stock.ml })}</Text>
          <Text muted>{tr('lac.stash.portions', { count: stock.count })}</Text>
          {stock.count ? (
            <Text variant="small" muted style={{ marginTop: 4 }}>
              {STASH_STORAGES.filter((s) => stock.byStorage[s].count).map((s) => tr('lac.stash.byStorage', { storage: storageLabel(s), ml: stock.byStorage[s].ml })).join(' · ')}
            </Text>
          ) : null}
        </Card>
      )}
      <Banner tone="info" icon="info" action={article ? <Button label={tr('lac.stash.rulesArticle')} size="sm" variant="secondary" onPress={() => router.push(`/article/${article.slug}` as never)} /> : undefined}>
        {tr('lac.stash.rules')}
      </Banner>

      <SectionTitle title={tr('lac.stash.available')} />
      {available.length ? (
        <View style={{ gap: spacing.sm }} testID="stash-available">
          {available.map((p) => (
            <Card key={p.id ?? p.client_id}>
              <Text weight="bold">{tr('lac.stash.portion', { ml: p.volume_ml, storage: storageLabel(p.storage) })}</Text>
              <Text variant="small" muted>{[tr('lac.stash.collected', { date: when(p.collected_at) }), p.location].filter(Boolean).join(' · ')}</Text>
              {p.note ? <Text variant="small" muted>{p.note}</Text> : null}
              <Row style={{ marginTop: spacing.xs }}>
                <Button label={tr('lac.stash.use')} icon="check" size="lg" variant="secondary" style={{ flex: 1 }} accessibilityLabel={tr('lac.stash.useA11y', { ml: p.volume_ml })} onPress={() => void transition(p, 'used')} testID="stash-use" />
                <Button label={tr('lac.stash.discard')} icon="trash-2" size="lg" variant="ghost" style={{ flex: 1 }} accessibilityLabel={tr('lac.stash.discardA11y', { ml: p.volume_ml })} onPress={() => void transition(p, 'discarded')} testID="stash-discard" />
              </Row>
            </Card>
          ))}
        </View>
      ) : <Text muted>{tr('lac.stash.availableEmpty')}</Text>}
      <Button label={tr('lac.stash.addBottle')} icon="coffee" variant="ghost" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: child.id } })} style={{ alignSelf: 'flex-start' }} />

      <SectionTitle title={tr('lac.stash.history')} />
      {past.length ? (
        <Card padded={false} testID="stash-history">
          {past.slice(0, 40).map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text weight="bold">{tr('lac.stash.portion', { ml: p.volume_ml, storage: storageLabel(p.storage) })}</Text>
                <Text variant="small" muted>{p.status_at ? tr(p.status === 'used' ? 'lac.stash.statusUsed' : 'lac.stash.statusDiscarded', { date: when(p.status_at) }) : ''}</Text>
              </View>
              <Button label={tr('lac.stash.delete')} icon="x" size="sm" variant="ghost" onPress={() => void remove(p)} />
            </View>
          ))}
        </Card>
      ) : <Text muted color={t.colors.textMuted}>{tr('lac.stash.historyEmpty')}</Text>}

      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('lac.stash.addTitle')}>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <Field label={tr('lac.stash.volume')} value={volume} onChangeText={setVolume} keyboardType="number-pad" suffix="ml" testID="stash-volume" />
        <TimePicker value={collected} onChange={setCollected} label={tr('lac.stash.collectedAt')} />
        <Segmented label={tr('lac.pump.storage')} value={storage} onChange={setStorage} options={STASH_STORAGES.map((s) => ({ value: s, label: storageLabel(s), testID: `stash-storage-${s}` }))} />
        <Field label={tr('lac.stash.location')} optional value={location} onChangeText={setLocation} placeholder={tr('lac.stash.locationPh')} maxLength={120} />
        <Field label={tr('lac.stash.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} />
        <Text variant="caption" muted>{tr('lac.stash.rules')}</Text>
        <Button label={tr('lac.stash.saveAdd')} icon="check" size="lg" full onPress={() => saveAdd()} testID="stash-save" />
      </Sheet>
    </Screen>
  );
}
