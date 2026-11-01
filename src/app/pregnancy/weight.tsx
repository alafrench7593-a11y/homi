/**
 * Suivi du poids pendant la grossesse — facultatif et bienveillant.
 * Aucune cible, aucune comparaison, aucune interprétation, aucune recommandation de régime.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { LineChart } from '@/components/Charts';
import { PremiumGate } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useActivePregnancy, useInvalidate, useMaternalWeights, useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';
import { toFrDate } from '@/lib/validation';
import { t as tr, formatDate } from '@/i18n';

export default function WeightScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const pregnancy = useActivePregnancy();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const insets = useSafeAreaInsets();
  const weightsQ = useMaternalWeights(pregnancy?.id);
  const { data: weights } = weightsQ;
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setBusy(null);
    }
  }
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [kg, setKg] = useState('');
  const [note, setNote] = useState('');
  const [pro, setPro] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);
  // Pré-remplissage : la dernière mesure notée (jamais une cible), ajustable au dixième en un geste
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (prefilled.current || !weights?.length || kg) return;
    prefilled.current = true;
    setKg(String(weights[weights.length - 1].weight_kg).replace('.', ','));
  }, [weights, kg]);
  const nudge = (delta: number) => {
    const v = Number((kg || '0').replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) return;
    setKg((Math.round((v + delta) * 10) / 10).toFixed(1).replace('.', ','));
  };

  async function add() {
    const iso = frToISO(date);
    const v = Number(kg.replace(',', '.'));
    const e: Record<string, string> = {};
    if (!iso || iso > todayISO()) e.date = tr('u2.weight.bad_date');
    if (!Number.isFinite(v) || v < 25 || v > 300) e.kg = tr('u2.weight.bad_kg');
    setErrors(e);
    if (Object.keys(e).length) return;
    await run('add', async () => {
      await insertOrQueue('maternal_weights', { user_id: userId, pregnancy_id: pregnancy?.id ?? null, measured_on: iso, weight_kg: v, note: note.trim() || null, professional_note: pro.trim() || null });
      inv('maternal_weights');
      setKg('');
      setNote('');
      setPro('');
      setShowNotes(false);
      toast(tr('u2.weight.saved'));
    });
  }

  async function remove(id: string) {
    if (!(await confirm(tr('u2.weight.del_title'), tr('u2.weight.del_body'), tr('u2.weight.delete')))) return;
    await run(`del-${id}`, async () => {
      await backend.remove('maternal_weights', [eq('id', id)]);
      inv('maternal_weights');
    });
  }

  async function exportCsv() {
    if (!weights?.length) return toast(tr('u2.weight.nothing_export'), 'info');
    const csv = ['date;poids_kg;note;indication_professionnel', ...weights.map((w) => `${w.measured_on};${String(w.weight_kg).replace('.', ',')};${(w.note ?? '').replace(/;/g, ',')};${(w.professional_note ?? '').replace(/;/g, ',')}`)].join('\n');
    await run('export', async () => {
      await Share.share({ message: csv, title: tr('u2.weight.share_title') });
    });
  }

  async function setHidden(v: boolean) {
    await run('hide', async () => {
      await updateProfile.mutateAsync({ hide_weight_module: v });
      toast(v ? tr('u2.weight.hidden') : tr('u2.weight.shown'));
    });
  }

  async function stopTracking() {
    if (!(await confirm(tr('u2.weight.stop_title'), tr('u2.weight.stop_body'), tr('u2.weight.stop_confirm')))) return;
    await run('stop', async () => {
      if (!pregnancy) return; // jamais les poids d'autres grossesses
      await backend.remove('maternal_weights', [eq('user_id', userId), eq('pregnancy_id', pregnancy.id)]);
      inv('maternal_weights');
      await updateProfile.mutateAsync({ hide_weight_module: true });
      toast(tr('u2.weight.stopped'));
      router.back();
    });
  }

  const points = (weights ?? []).map((w) => ({ x: new Date(w.measured_on).getTime(), y: Number(w.weight_kg), label: formatDate(w.measured_on, { day: 'numeric', month: 'long', timeZone: 'UTC' }) }));

  const loading = weightsQ.isLoading && !weights;
  const failed = weightsQ.isError && !weights;
  const history = (weights ?? []).slice().reverse();
  const last = history[0];

  return (
    <Screen back title={tr('u2.weight.title')} subtitle={tr('u2.weight.subtitle')} scroll={false} padded={false}
      action={{ label: tr('u2.weight.save'), icon: 'check', onPress: () => void add(), disabled: busy === 'add', testID: 'weight-main-action' }}>
      <VirtualList
        data={loading || failed ? [] : history}
        keyExtractor={(w) => w.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <TodaySummary title={tr('u2.weight.tracking')} items={[
              { icon: 'trending-up', value: last ? `${String(last.weight_kg).replace('.', ',')} kg` : '—', label: tr('u2.weight.last') },
              { icon: 'calendar', value: last ? formatDate(last.measured_on, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '—', label: tr('u2.weight.noted_on') },
              { icon: 'list', value: String(history.length), label: history.length > 1 ? tr('u2.weight.measurements') : tr('u2.weight.measurement') },
            ]} />

            <Card>
              <Text weight="bold">{tr('u2.weight.new')}</Text>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 3 }}><Field label={tr('u2.weight.date')} value={date} onChangeText={setDate} error={errors.date} keyboardType="numbers-and-punctuation" /></View>
                <View style={{ flex: 2 }}><Field label={tr('u2.weight.weight')} value={kg} onChangeText={setKg} keyboardType="decimal-pad" suffix="kg" error={errors.kg} /></View>
              </Row>
              {kg ? (
                <Row wrap style={{ justifyContent: 'center' }} testID="weight-steppers">
                  {[-0.5, -0.1, 0.1, 0.5].map((d) => (
                    <Button key={d} label={`${d > 0 ? '+' : '−'}${String(Math.abs(d)).replace('.', ',')}`} size="sm" variant="secondary" onPress={() => nudge(d)} accessibilityLabel={tr(d > 0 ? 'u2.weight.add_kg' : 'u2.weight.remove_kg', { value: String(Math.abs(d)).replace('.', ',') })} testID={`weight-nudge-${d}`} />
                  ))}
                </Row>
              ) : null}
              {last ? <Text variant="caption" muted center>{tr('u2.weight.prefilled')}</Text> : null}
              {showNotes || note || pro ? (
                <>
                  <Field label={tr('u2.weight.note')} optional value={note} onChangeText={setNote} />
                  <Field label={tr('u2.weight.pro')} optional value={pro} onChangeText={setPro} hint={tr('u2.weight.pro_hint')} />
                </>
              ) : (
                <Button label={tr('u2.weight.add_note')} size="sm" variant="ghost" icon="edit-3" style={{ alignSelf: 'flex-start' }} onPress={() => setShowNotes(true)} />
              )}
            </Card>

            {loading ? <Skeleton kind="card" rows={1} /> : failed ? (
              <ErrorView error={weightsQ.error} onRetry={() => void weightsQ.refetch()} title={tr('u2.weight.load_error')} />
            ) : points.length >= 2 ? (
              <Card><Text weight="bold">{tr('u2.weight.mine')}</Text><LineChart points={points} unit="kg" accessibilityLabel={tr('u2.weight.chart_a11y')} formatX={(x) => formatDate(x, { day: 'numeric', month: 'short' })} /></Card>
            ) : (
              <Card tone="soft"><Text muted>{tr('u2.weight.chart_needs_two')}</Text></Card>
            )}
            <Banner tone="info">{tr('u2.weight.banner')}</Banner>

            <SectionTitle title={tr('u2.weight.history')} />
            {loading ? <Skeleton rows={2} /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : <EmptyState icon="trending-up" title={tr('u2.weight.none_title')} body={tr('u2.weight.none_body')} />}
        renderItem={({ item: w }) => (
          <Card style={{ paddingVertical: spacing.xs }}>
            <ListRow title={`${String(w.weight_kg).replace('.', ',')} kg`} subtitle={[formatDate(w.measured_on, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }), w.note, w.professional_note ? tr('u2.weight.pro_prefix', { note: w.professional_note }) : null].filter(Boolean).join(' · ')} right={<Button label={tr('u2.weight.delete')} size="sm" variant="ghost" loading={busy === `del-${w.id}`} accessibilityLabel={tr('u2.weight.delete_a11y', { date: formatDate(w.measured_on, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) })} onPress={() => remove(w.id)} />} />
          </Card>
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <PremiumGate feature={tr('u2.weight.export_feature')}>
              <Button label={tr('u2.weight.export')} variant="secondary" icon="download" loading={busy === 'export'} onPress={exportCsv} />
            </PremiumGate>

            <Card tone="soft">
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ flex: 1 }}>{tr('u2.weight.hide_everywhere')}</Text>
                <Toggle label={tr('u2.weight.hide_toggle')} value={!!profile?.hide_weight_module} onChange={(v) => void setHidden(v)} />
              </Row>
            </Card>
            <Button label={tr('u2.weight.stop')} variant="ghost" loading={busy === 'stop'} onPress={stopTracking} />
          </View>
        )}
      />
    </Screen>
  );
}
