/**
 * Température basale et glaire cervicale (facultatif). Données strictement personnelles.
 * Le graphique est DESCRIPTIF : il ne confirme ni une ovulation, ni une grossesse.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { LineChart } from '@/components/Charts';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Card, Chip, Field, haptic, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { PrivateBanner } from '@/components/Fertility';
import { ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useFertilityObservations, useSaveObservation } from '@/lib/data/hooks-fertility';
import { bbtSeries, parseTemperature } from '@/lib/domain/cycle';
import { addDays, formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { CERVICAL_MUCUS, type CervicalMucus } from '@/lib/types-fertility';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const mucusLabel = (v: CervicalMucus | null) => CERVICAL_MUCUS.find((m) => m.value === v)?.label ?? null;

export default function BodyScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const obsQ = useFertilityObservations(120);
  const { data } = obsQ;
  const save = useSaveObservation();
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [temp, setTemp] = useState('');
  const [mucus, setMucus] = useState<CervicalMucus | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = data ?? [];
  const points = useMemo(() => bbtSeries(list, 45), [list]);
  const since = addDays(todayISO(), -45);
  const sorted = useMemo(() => [...list].sort((a, b) => b.observed_on.localeCompare(a.observed_on)), [list]);
  const lastTemp = sorted.find((o) => o.bbt_celsius != null) ?? null;
  const lastMucus = sorted.find((o) => o.cervical_mucus != null) ?? null;

  async function submit() {
    const iso = frToISO(date);
    const e: Record<string, string> = {};
    if (!iso || iso > todayISO()) e.date = tr('u3.fertBody.dateInvalid');
    const bbt = temp.trim() ? parseTemperature(temp) : null;
    if (temp.trim() && bbt == null) e.temp = tr('u3.fertBody.tempInvalid');
    if (!temp.trim() && !mucus && !note.trim()) e.temp = tr('u3.fertBody.needOne');
    setErrors(e);
    if (Object.keys(e).length || !iso) return;
    try {
      await save.mutateAsync({ observed_on: iso, bbt_celsius: bbt, cervical_mucus: mucus, note: note.trim() || null });
      haptic('success');
      setTemp('');
      setMucus(null);
      setNote('');
      toast(tr('u3.fertBody.saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(id: string, on: string) {
    if (!(await confirm(tr('u3.fertBody.delTitle', { date: formatDateFr(on) }), tr('u3.fertBody.delBody'), tr('u3.fertBody.delOk')))) return;
    try {
      await backend.remove('fertility_observations', [eq('id', id)]);
      inv('fertility_observations');
      toast(tr('u3.fertBody.deleted'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Screen back title={tr('u3.fertBody.title')} subtitle={tr('u3.fertBody.subtitle')}
      action={{ label: tr('u3.fertBody.save'), icon: 'check', onPress: () => void submit(), disabled: save.isPending, testID: 'body-save' }}>
      <TodaySummary title={tr('u3.fertBody.lastObs')} items={[
        { icon: 'thermometer', value: lastTemp ? `${String(lastTemp.bbt_celsius).replace('.', ',')} °C` : '—', label: lastTemp ? formatDateFr(lastTemp.observed_on, false) : tr('u3.fertBody.temperature') },
        { icon: 'droplet', value: lastMucus ? mucusLabel(lastMucus.cervical_mucus) ?? '—' : '—', label: tr('u3.fertBody.mucusShort') },
        { icon: 'calendar', value: String(list.filter((o) => o.observed_on >= since).length), label: tr('u3.fertBody.daysNoted') },
      ]} />
      <PrivateBanner>{tr('u3.fertBody.private')}</PrivateBanner>

      <Card>
        <Field label={tr('u3.fertBody.date')} value={date} onChangeText={setDate} error={errors.date} keyboardType="numbers-and-punctuation" placeholder={tr('u3.fertBody.datePh')} />
        <View style={{ marginTop: spacing.sm }}>
          <Field label={tr('u3.fertBody.wakeTemp')} optional value={temp} onChangeText={setTemp} error={errors.temp} keyboardType="decimal-pad" placeholder="36,55" suffix="°C" hint={tr('u3.fertBody.wakeHint')} />
          {/* reprise en un geste de la dernière valeur notée, à ajuster avant d'enregistrer */}
          {!temp && lastTemp?.bbt_celsius != null ? (
            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Chip icon="corner-down-left" label={tr('u3.fertBody.startFrom', { value: String(lastTemp.bbt_celsius).replace('.', ',') })} onPress={() => setTemp(String(lastTemp.bbt_celsius).replace('.', ','))} testID="body-prefill-temp" />
            </View>
          ) : null}
        </View>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertBody.mucusOpt')}</Text>
        <Row wrap style={{ marginTop: 6 }}>
          {CERVICAL_MUCUS.map((m) => <Chip key={m.value} label={m.label} selected={mucus === m.value} onPress={() => setMucus(mucus === m.value ? null : m.value)} />)}
        </Row>
        <View style={{ marginTop: spacing.sm }}><Field label={tr('u3.fertBody.note')} optional value={note} onChangeText={setNote} maxLength={500} /></View>
        <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u3.fertBody.oneADay')}</Text>
      </Card>

      <SectionTitle title={tr('u3.fertBody.chartTitle')} />
      {obsQ.isLoading && !data ? <Skeleton kind="card" rows={1} /> : obsQ.isError && !data ? (
        <ErrorView error={obsQ.error} onRetry={() => void obsQ.refetch()} title={tr('u3.fertBody.errShow')} />
      ) : points.length >= 2 ? (
        <Card>
          <LineChart points={points} unit="°C" accessibilityLabel={tr('u3.fertBody.wakeTemp')} formatX={(x) => formatDateFr(addDays(since, x), false)} />
          <Text variant="caption" muted>{tr('u3.fertBody.chartNote')}</Text>
        </Card>
      ) : (
        <Card tone="soft"><Text muted>{tr('u3.fertBody.needTwo')}</Text></Card>
      )}
      <Banner tone="info">{tr('u3.fertBody.vary')}</Banner>

      {list.length ? (
        <>
          <SectionTitle title={tr('u3.fertBody.mine')} />
          <Card>
            {list.slice(0, 20).map((o) => (
              <ListRow
                key={o.id}
                icon="thermometer"
                title={formatDateFr(o.observed_on)}
                subtitle={[o.bbt_celsius != null ? `${String(o.bbt_celsius).replace('.', ',')} °C` : null, mucusLabel(o.cervical_mucus), o.note].filter(Boolean).join(' · ')}
                right={<IconButton icon="trash-2" label={tr('u3.fertBody.delA11y', { date: formatDateFr(o.observed_on) })} onPress={() => remove(o.id, o.observed_on)} />}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
