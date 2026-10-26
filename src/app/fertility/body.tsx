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
    if (!iso || iso > todayISO()) e.date = 'Date invalide (JJ/MM/AAAA, pas dans le futur).';
    const bbt = temp.trim() ? parseTemperature(temp) : null;
    if (temp.trim() && bbt == null) e.temp = 'Température attendue entre 34 et 40 °C (ex. 36,55).';
    if (!temp.trim() && !mucus && !note.trim()) e.temp = 'Notez au moins une température, une glaire ou une note.';
    setErrors(e);
    if (Object.keys(e).length || !iso) return;
    try {
      await save.mutateAsync({ observed_on: iso, bbt_celsius: bbt, cervical_mucus: mucus, note: note.trim() || null });
      haptic('success');
      setTemp('');
      setMucus(null);
      setNote('');
      toast('Observation enregistrée.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(id: string, on: string) {
    if (!(await confirm(`Supprimer l’observation du ${formatDateFr(on)} ?`, 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await backend.remove('fertility_observations', [eq('id', id)]);
      inv('fertility_observations');
      toast('Observation supprimée.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Screen back title="Température et glaire" subtitle="Si vous souhaitez les noter : c’est entièrement facultatif."
      action={{ label: 'Enregistrer', icon: 'check', onPress: () => void submit(), disabled: save.isPending, testID: 'body-save' }}>
      <TodaySummary title="Dernière observation" items={[
        { icon: 'thermometer', value: lastTemp ? `${String(lastTemp.bbt_celsius).replace('.', ',')} °C` : '—', label: lastTemp ? formatDateFr(lastTemp.observed_on, false) : 'Température' },
        { icon: 'droplet', value: lastMucus ? mucusLabel(lastMucus.cervical_mucus) ?? '—' : '—', label: 'Glaire' },
        { icon: 'calendar', value: String(list.filter((o) => o.observed_on >= since).length), label: 'Jours notés (45 j)' },
      ]} />
      <PrivateBanner>Ces observations ne sont jamais partagées avec votre foyer ni votre coparent.</PrivateBanner>

      <Card>
        <Field label="Date" value={date} onChangeText={setDate} error={errors.date} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" />
        <View style={{ marginTop: spacing.sm }}>
          <Field label="Température au réveil" optional value={temp} onChangeText={setTemp} error={errors.temp} keyboardType="decimal-pad" placeholder="36,55" suffix="°C" hint="Idéalement prise au réveil, avant de se lever, toujours de la même façon." />
          {/* reprise en un geste de la dernière valeur notée, à ajuster avant d'enregistrer */}
          {!temp && lastTemp?.bbt_celsius != null ? (
            <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Chip icon="corner-down-left" label={`Partir de ${String(lastTemp.bbt_celsius).replace('.', ',')} °C`} onPress={() => setTemp(String(lastTemp.bbt_celsius).replace('.', ','))} testID="body-prefill-temp" />
            </View>
          ) : null}
        </View>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Glaire cervicale (facultatif)</Text>
        <Row wrap style={{ marginTop: 6 }}>
          {CERVICAL_MUCUS.map((m) => <Chip key={m.value} label={m.label} selected={mucus === m.value} onPress={() => setMucus(mucus === m.value ? null : m.value)} />)}
        </Row>
        <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={500} /></View>
        <Text variant="caption" muted style={{ marginTop: 6 }}>Une seule observation par jour : enregistrer à nouveau la même date remplace la précédente.</Text>
      </Card>

      <SectionTitle title="Ma température (45 derniers jours)" />
      {obsQ.isLoading && !data ? <Skeleton kind="card" rows={1} /> : obsQ.isError && !data ? (
        <ErrorView error={obsQ.error} onRetry={() => void obsQ.refetch()} title="Impossible d’afficher vos observations" />
      ) : points.length >= 2 ? (
        <Card>
          <LineChart points={points} unit="°C" accessibilityLabel="Température au réveil" formatX={(x) => formatDateFr(addDays(since, x), false)} />
          <Text variant="caption" muted>Graphique descriptif de vos saisies. Une légère hausse durable de la température est souvent observée après l’ovulation, mais ce graphique ne permet ni de confirmer une ovulation, ni de prévoir une grossesse.</Text>
        </Card>
      ) : (
        <Card tone="soft"><Text muted>Notez au moins deux températures pour afficher le graphique.</Text></Card>
      )}
      <Banner tone="info">La température et la glaire peuvent varier avec le sommeil, la fièvre, l’alcool ou les horaires décalés. Elles aident à mieux connaître son corps mais restent des repères.</Banner>

      {list.length ? (
        <>
          <SectionTitle title="Mes observations" />
          <Card>
            {list.slice(0, 20).map((o) => (
              <ListRow
                key={o.id}
                icon="thermometer"
                title={formatDateFr(o.observed_on)}
                subtitle={[o.bbt_celsius != null ? `${String(o.bbt_celsius).replace('.', ',')} °C` : null, mucusLabel(o.cervical_mucus), o.note].filter(Boolean).join(' · ')}
                right={<IconButton icon="trash-2" label={`Supprimer l’observation du ${formatDateFr(o.observed_on)}`} onPress={() => remove(o.id, o.observed_on)} />}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
