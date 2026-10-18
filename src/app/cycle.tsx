/**
 * Suivi du cycle : règles, symptômes, tests.
 * Les dates calculées sont TOUJOURS des estimations : elles ne garantissent rien et ne remplacent pas une contraception.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, usePeriods, useProfile, useTests } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useSymptomLogs } from '@/lib/data/hooks-me';
import { useFertilityJourney } from '@/lib/data/hooks-fertility';
import { addDays, daysBetween, formatDateFr, frToISO, parseISODate, todayISO } from '@/lib/domain/dates';
import { cycleDayKind, estimateCycle, type CycleDayKind } from '@/lib/domain/cycle';
import { toFrDate } from '@/lib/validation';
import type { PeriodEntry } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Flow = NonNullable<PeriodEntry['flow']> | 'none';
type TestKind = 'ovulation_tests' | 'pregnancy_tests';

const FLOW_LABEL: Record<NonNullable<PeriodEntry['flow']>, string> = { light: 'léger', medium: 'moyen', heavy: 'abondant' };
const RELIABILITY_LABEL = { insufficient: 'Données insuffisantes', low: 'Fiabilité faible', moderate: 'Fiabilité modérée' } as const;
const SYMPTOMS = ['Crampes', 'Maux de tête', 'Seins sensibles', 'Ballonnements', 'Fatigue', 'Humeur changeante', 'Acné', 'Glaire fertile', 'Saignements légers', 'Nausées'];
const TEST_RESULTS: Record<TestKind, { value: string; label: string }[]> = {
  ovulation_tests: [{ value: 'negative', label: 'Négatif' }, { value: 'positive', label: 'Positif' }, { value: 'peak', label: 'Pic' }, { value: 'invalid', label: 'Non lisible' }],
  pregnancy_tests: [{ value: 'negative', label: 'Négatif' }, { value: 'positive', label: 'Positif' }, { value: 'faint', label: 'Trait léger' }, { value: 'invalid', label: 'Non lisible' }],
};
const resultLabel = (kind: TestKind, v: string) => TEST_RESULTS[kind].find((r) => r.value === v)?.label ?? v;

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_KIND_LABEL: Record<Exclude<CycleDayKind, null>, string> = {
  period: 'règles saisies', fertile_estimate: 'fenêtre fertile estimée', ovulation_estimate: 'ovulation estimée', next_period_estimate: 'règles estimées',
};

/** Calendrier de 5 semaines à partir du lundi de la semaine en cours. */
function CycleCalendar({ entries, est }: { entries: PeriodEntry[]; est: ReturnType<typeof estimateCycle> }) {
  const t = useTheme();
  const today = todayISO();
  const offset = (parseISODate(today).getUTCDay() + 6) % 7;
  const start = addDays(today, -offset);
  const days = Array.from({ length: 35 }, (_, i) => addDays(start, i));
  const color = (k: CycleDayKind) =>
    k === 'period' ? t.colors.heart : k === 'next_period_estimate' ? t.colors.heart + '55' : k === 'ovulation_estimate' ? t.colors.lavender : k === 'fertile_estimate' ? t.colors.lavender + '44' : 'transparent';
  return (
    <View style={{ gap: 4 }}>
      <Row gap={4}>{WEEKDAYS.map((d, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{d}</Text>)}</Row>
      {[0, 1, 2, 3, 4].map((w) => (
        <Row key={w} gap={4}>
          {days.slice(w * 7, w * 7 + 7).map((d) => {
            const k = cycleDayKind(d, entries, est);
            const isToday = d === today;
            return (
              <View
                key={d}
                accessible
                accessibilityLabel={`${formatDateFr(d, false)}${isToday ? ", aujourd’hui" : ''}${k ? `, ${DAY_KIND_LABEL[k]}` : ''}`}
                style={{ flex: 1, aspectRatio: 1, maxHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: color(k), borderWidth: isToday ? 1.5 : 0, borderColor: t.colors.primary }}
              >
                <Text variant="caption" weight={isToday ? 'bold' : 'regular'} color={k === 'period' ? '#fff' : undefined}>{parseISODate(d).getUTCDate()}</Text>
              </View>
            );
          })}
        </Row>
      ))}
      <Row wrap style={{ marginTop: 4 }}>
        {([['period', 'Règles saisies'], ['next_period_estimate', 'Règles estimées'], ['fertile_estimate', 'Fenêtre fertile estimée'], ['ovulation_estimate', 'Ovulation estimée']] as const).map(([k, l]) => (
          <Row key={k} gap={6}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color(k) }} />
            <Text variant="caption" muted>{l}</Text>
          </Row>
        ))}
      </Row>
    </View>
  );
}

/**
 * Les personnes ayant choisi un parcours fertilité sont redirigées vers l'écran dédié :
 * « concevoir » -> /fertility, « éviter une grossesse » -> /contraception.
 */
export default function CycleRoute() {
  const journey = useFertilityJourney();
  const profileQ = useProfile();
  if (profileQ.isLoading) {
    return (
      <Screen back title="Mon cycle" subtitle="Vos saisies, vos repères — à votre rythme.">
        <Skeleton kind="card" rows={3} />
      </Screen>
    );
  }
  if (journey === 'ttc') return <Redirect href={'/fertility' as never} />;
  if (journey === 'avoid') return <Redirect href={'/contraception' as never} />;
  return <CycleScreen />;
}

function CycleScreen() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const periodsQ = usePeriods();
  const { data: periods } = periodsQ;
  const symptomsQ = useSymptomLogs(30);
  const { data: symptomLogs } = symptomsQ;
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const [busy, setBusy] = useState<string | null>(null);

  const [start, setStart] = useState(toFrDate(todayISO()));
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState<Flow>('none');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [testKind, setTestKind] = useState<TestKind>('ovulation_tests');
  const [testResult, setTestResult] = useState<string | null>(null);

  const entries = useMemo(() => periods ?? [], [periods]);
  const est = useMemo(() => estimateCycle(entries), [entries]);
  const testsQ = testKind === 'ovulation_tests' ? ovuQ : pregQ;
  const tests = testsQ.data;

  /** Exécute une écriture : bouton occupé pendant l'envoi, erreur affichée en français. */
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

  async function addPeriod() {
    const s = frToISO(start);
    const e = end.trim() ? frToISO(end) : null;
    const errs: Record<string, string> = {};
    if (!s || s > todayISO()) errs.start = 'Date invalide (JJ/MM/AAAA, pas dans le futur).';
    if (end.trim() && (!e || (s && e < s))) errs.end = 'Date de fin invalide ou antérieure au début.';
    if (s && e && daysBetween(s, e) > 15) errs.end = 'Durée inhabituelle : vérifiez la date de fin.';
    if (s && entries.some((p) => p.start_date === s)) errs.start = 'Des règles commencent déjà à cette date.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await run('period', async () => {
      await insertOrQueue('period_entries', { user_id: userId, start_date: s, end_date: e, flow: flow === 'none' ? null : flow, note: note.trim() || null });
      inv('period_entries');
      haptic('success');
      setEnd('');
      setNote('');
      setFlow('none');
      toast('Règles enregistrées.');
    });
  }

  async function endToday(p: PeriodEntry) {
    const today = todayISO();
    if (today < p.start_date) return;
    await run(`end-${p.id}`, async () => {
      await backend.update('period_entries', { end_date: today }, [eq('id', p.id)]);
      inv('period_entries');
      toast('Fin des règles enregistrée.');
    });
  }

  async function removeRow(table: string, id: string, what: string) {
    if (!(await confirm(`Supprimer ${what} ?`, 'Cette action est définitive.', 'Supprimer'))) return;
    await run(`del-${id}`, async () => {
      await backend.remove(table, [eq('id', id)]);
      inv(table);
    });
  }

  async function saveSymptoms() {
    if (!symptoms.length) return toast('Choisissez au moins un symptôme.', 'info');
    await run('symptoms', async () => {
      await insertOrQueue('symptom_logs', { user_id: userId, logged_on: todayISO(), symptoms });
      inv('symptom_logs');
      setSymptoms([]);
      toast('Symptômes notés.');
    });
  }

  async function saveTest() {
    if (!testResult) return toast('Choisissez un résultat.', 'info');
    await run('test', async () => {
      await insertOrQueue(testKind, { user_id: userId, tested_at: new Date().toISOString(), result: testResult });
      inv(testKind);
      setTestResult(null);
      toast('Test enregistré.');
    });
  }

  const periodsLoading = periodsQ.isLoading && !periods;
  const periodsFailed = periodsQ.isError && !periods;
  const history = useMemo(() => entries.slice().reverse(), [entries]);

  return (
    <Screen back title="Mon cycle" subtitle="Vos saisies, vos repères — à votre rythme." scroll={false} padded={false}>
      <VirtualList
        data={periodsLoading || periodsFailed ? [] : history}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="warning" title="Estimation, sans garantie">
              {'Les dates affichées sont calculées à partir de vos saisies. Elles ne garantissent pas une grossesse, ne permettent pas de l’éviter et ne remplacent pas une contraception.'}
            </Banner>

            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold">Mes estimations</Text>
                <Text variant="caption" muted>{RELIABILITY_LABEL[est.reliability]}</Text>
              </Row>
              {est.nextPeriod ? (
                <View style={{ gap: 4, marginTop: spacing.xs }}>
                  <Text>Prochaines règles estimées : <Text weight="bold">vers le {formatDateFr(est.nextPeriod, false)}</Text></Text>
                  {est.fertileWindow && <Text variant="small">Fenêtre fertile estimée : du {formatDateFr(est.fertileWindow.start, false)} au {formatDateFr(est.fertileWindow.end, false)}</Text>}
                  {est.averageLength != null && <Text variant="small" muted>Durée moyenne de vos cycles : {String(est.averageLength).replace('.', ',')} jours{est.variability != null ? ` (variation ± ${String(est.variability).replace('.', ',')} j)` : ''}</Text>}
                </View>
              ) : (
                <Text muted style={{ marginTop: spacing.xs }}>Ajoutez la date de vos dernières règles pour afficher des estimations.</Text>
              )}
              {periodsQ.isLoading && !periods ? <View style={{ marginTop: spacing.sm }}><Skeleton kind="detail" rows={2} /></View> : null}
              {entries.length > 0 && <View style={{ marginTop: spacing.md }}><CycleCalendar entries={entries} est={est} /></View>}
              <View style={{ marginTop: spacing.sm, gap: 2 }}>
                {est.caveats.map((c) => <Text key={c} variant="caption" muted>• {c}</Text>)}
              </View>
            </Card>

            <SectionTitle title="Noter des règles" />
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}><Field label="Début" value={start} onChangeText={setStart} error={errors.start} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" /></View>
                <View style={{ flex: 1 }}><Field label="Fin" optional value={end} onChangeText={setEnd} error={errors.end} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" /></View>
              </Row>
              <View style={{ gap: 6, marginTop: spacing.sm }}>
                <Text variant="label">Flux (facultatif)</Text>
                <Segmented label="Flux" value={flow} onChange={setFlow} options={[{ value: 'none', label: '—' }, { value: 'light', label: 'Léger' }, { value: 'medium', label: 'Moyen' }, { value: 'heavy', label: 'Abondant' }]} />
              </View>
              <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={1000} /></View>
              <Button label="Enregistrer" icon="plus" style={{ marginTop: spacing.sm }} loading={busy === 'period'} onPress={addPeriod} />
            </Card>
            <SectionTitle title="Historique des règles" />
            {periodsLoading ? <Skeleton rows={2} /> : null}
            {periodsFailed ? <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} title="Impossible d’afficher vos règles" /> : null}
          </View>
        )}
        ListEmptyComponent={periodsLoading || periodsFailed ? null : <EmptyState icon="droplet" title="Aucune saisie pour l’instant" body="Notez le début de vos dernières règles ci-dessus pour afficher des estimations." />}
        renderItem={({ item: p }) => (
          <Card style={{ paddingVertical: spacing.xs }}>
            <ListRow
              icon="droplet"
              title={p.end_date ? `Du ${formatDateFr(p.start_date, false)} au ${formatDateFr(p.end_date)}` : `Depuis le ${formatDateFr(p.start_date)}`}
              subtitle={[p.flow ? `Flux ${FLOW_LABEL[p.flow]}` : null, p.note].filter(Boolean).join(' · ') || undefined}
              right={
                <Row gap={0}>
                  {!p.end_date && p.start_date <= todayISO() && <Button label="Fin aujourd’hui" size="sm" variant="ghost" loading={busy === `end-${p.id}`} onPress={() => endToday(p)} />}
                  <Button label="Supprimer" size="sm" variant="ghost" loading={busy === `del-${p.id}`} onPress={() => removeRow('period_entries', p.id, 'ces règles')} accessibilityLabel={`Supprimer les règles du ${formatDateFr(p.start_date)}`} />
                </Row>
              }
            />
          </Card>
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <SectionTitle title="Symptômes du jour" />
            <Card>
              <Row wrap>
                {SYMPTOMS.map((s) => <Chip key={s} label={s} selected={symptoms.includes(s)} onPress={() => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />)}
              </Row>
              <Button label="Noter ces symptômes" variant="secondary" style={{ marginTop: spacing.sm }} loading={busy === 'symptoms'} onPress={saveSymptoms} />
              {symptomsQ.isLoading && !symptomLogs ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
              {symptomsQ.isError && !symptomLogs ? <View style={{ marginTop: spacing.sm }}><ErrorView error={symptomsQ.error} onRetry={() => void symptomsQ.refetch()} title="Impossible d’afficher vos symptômes" /></View> : null}
              {(symptomLogs ?? []).slice(0, 8).map((l) => (
                <ListRow key={l.id} icon="clipboard" title={formatDateFr(l.logged_on)} subtitle={l.symptoms.join(', ')} right={<Button label="Supprimer" size="sm" variant="ghost" loading={busy === `del-${l.id}`} onPress={() => removeRow('symptom_logs', l.id, 'ces symptômes')} accessibilityLabel={`Supprimer les symptômes du ${formatDateFr(l.logged_on)}`} />} />
              ))}
            </Card>

            <SectionTitle title="Tests" />
            <Card>
              <Segmented label="Type de test" value={testKind} onChange={(v) => { setTestKind(v); setTestResult(null); }} options={[{ value: 'ovulation_tests', label: 'Ovulation' }, { value: 'pregnancy_tests', label: 'Grossesse' }]} />
              <Row wrap style={{ marginTop: spacing.sm }}>
                {TEST_RESULTS[testKind].map((r) => <Chip key={r.value} label={r.label} selected={testResult === r.value} onPress={() => setTestResult(r.value)} />)}
              </Row>
              <Text variant="caption" muted style={{ marginTop: 6 }}>
                {testKind === 'pregnancy_tests' ? 'Un test de grossesse se lit selon la notice du fabricant. En cas de doute, un dosage sanguin prescrit par un professionnel est plus fiable.' : 'Un test d’ovulation signale une hausse hormonale ; il ne confirme pas l’ovulation.'}
              </Text>
              <Button label="Enregistrer le test" variant="secondary" style={{ marginTop: spacing.sm }} loading={busy === 'test'} onPress={saveTest} />
              {testsQ.isLoading && !tests ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
              {testsQ.isError && !tests ? <View style={{ marginTop: spacing.sm }}><ErrorView error={testsQ.error} onRetry={() => void testsQ.refetch()} title="Impossible d’afficher vos tests" /></View> : null}
              {(tests ?? []).slice(0, 10).map((x) => (
                <ListRow
                  key={x.id}
                  icon="check-square"
                  title={`${resultLabel(testKind, x.result)} · ${new Date(x.tested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                  subtitle={x.note ?? undefined}
                  right={<Button label="Supprimer" size="sm" variant="ghost" loading={busy === `del-${x.id}`} onPress={() => removeRow(testKind, x.id, 'ce test')} accessibilityLabel={`Supprimer le test du ${new Date(x.tested_at).toLocaleDateString('fr-FR')}`} />}
                />
              ))}
            </Card>
          </View>
        )}
      />
    </Screen>
  );
}
