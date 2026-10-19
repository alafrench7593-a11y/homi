/**
 * Composants partagés des parcours « concevoir » (/fertility) et « éviter une grossesse » (/contraception).
 * Toute date d'ovulation / de fertilité est affichée comme une ESTIMATION.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart, StatPill } from './Charts';
import { confirm, Sheet, useToast } from './Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from './ui';
import { EmptyState, ErrorView, Skeleton, VirtualList } from './States';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useHouseholdId, useInvalidate, usePeriods, useReminders, useTests } from '@/lib/data/hooks';
import { useSymptomLogs } from '@/lib/data/hooks-me';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError, useDeleteReminder, useToggleReminder } from '@/lib/data/hooks-settings';
import { useAddQuestions, useConsultationQuestions, useJourneyArticles, useShareQuestion } from '@/lib/data/hooks-fertility';
import { addDays, daysBetween, formatDateFr, frToISO, todayISO, type ISODate } from '@/lib/domain/dates';
import { cycleHistory, monthGrid, type CycleEstimate } from '@/lib/domain/cycle';
import { describeSchedule, validateSchedule, type ReminderSchedule, type Weekday } from '@/lib/domain/reminders';
import { toFrDate } from '@/lib/validation';
import { QUESTION_SUGGESTIONS, type ReminderPreset } from '@/content/fertility';
import type { PeriodEntry } from '@/lib/types';
import type { FertilityJourney } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export const RELIABILITY_LABEL = { insufficient: 'Données insuffisantes', low: 'Fiabilité faible', moderate: 'Fiabilité modérée' } as const;
export const fmt = (d: ISODate) => formatDateFr(d, false);
export const num = (n: number) => String(n).replace('.', ',');

// ---------------------------------------------------------------- étiquette « estimation »
export function EstimateTag() {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.colors.lavender + '22' }}>
      <Text variant="caption" weight="bold" color={t.colors.lavender}>estimation</Text>
    </View>
  );
}

/** Ligne « libellé : valeur » avec l'étiquette estimation. */
export function EstimateLine({ label, value, estimate = true }: { label: string; value: string; estimate?: boolean }) {
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      <Row gap={6} wrap>
        <Text variant="small" muted>{label}</Text>
        {estimate ? <EstimateTag /> : null}
      </Row>
      <Text weight="bold">{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- calendrier mensuel
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export interface CalendarStyle { bg: string; fg?: string; label: string }

export function MonthCalendar<K extends string | null>({ kindOf, styleOf, legend, dotsOf, onDayPress, selected }: {
  kindOf: (day: ISODate) => K;
  styleOf: (k: K) => CalendarStyle | null;
  legend: K[];
  /** Pastilles de couleur sous le numéro du jour (événements notés). */
  dotsOf?: (day: ISODate) => string[];
  onDayPress?: (day: ISODate) => void;
  selected?: ISODate | null;
}) {
  const t = useTheme();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const shift = (d: number) => setCursor((c) => {
    const m = c.m + d;
    return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });
  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label="Mois précédent" onPress={() => shift(-1)} />
        <Text weight="bold" accessibilityRole="header">{`${MONTHS[cursor.m]} ${cursor.y}`}</Text>
        <IconButton icon="chevron-right" label="Mois suivant" onPress={() => shift(1)} />
      </Row>
      <Row gap={4}>{WEEKDAYS.map((d, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{d}</Text>)}</Row>
      {Array.from({ length: days.length / 7 }, (_, w) => (
        <Row key={w} gap={4}>
          {days.slice(w * 7, w * 7 + 7).map((d) => {
            const k = kindOf(d);
            const s = styleOf(k);
            const inMonth = d.startsWith(monthPrefix);
            const isToday = d === today;
            const dots = dotsOf?.(d) ?? [];
            const isSel = selected === d;
            const style = { flex: 1, aspectRatio: 1, maxHeight: 44, borderRadius: radius.sm, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: s?.bg ?? 'transparent', borderWidth: isSel ? 2 : isToday ? 1.5 : 0, borderColor: isSel ? t.colors.text : t.colors.primary, opacity: inMonth ? 1 : 0.35 };
            const label = `${formatDateFr(d)}${isToday ? ', aujourd’hui' : ''}${s ? `, ${s.label}` : ''}${dots.length ? `, ${dots.length} élément(s) noté(s)` : ''}`;
            const inner = (
              <>
                <Text variant="caption" weight={isToday || isSel ? 'bold' : 'regular'} color={s?.fg}>{Number(d.slice(8, 10))}</Text>
                {dots.length ? (
                  <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3 }}>
                    {dots.slice(0, 4).map((c, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c }} />)}
                  </View>
                ) : null}
              </>
            );
            return onDayPress ? (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: isSel }} onPress={() => onDayPress(d)} style={style}>{inner}</Pressable>
            ) : (
              <View key={d} accessible accessibilityLabel={label} style={style}>{inner}</View>
            );
          })}
        </Row>
      ))}
      <View style={{ marginTop: 4, gap: 4 }}>
        {legend.map((k) => {
          const s = styleOf(k);
          if (!s) return null;
          return (
            <Row key={String(k)} gap={6}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.bg, borderWidth: 1, borderColor: t.colors.border }} />
              <Text variant="caption" muted style={{ flex: 1 }}>{s.label}</Text>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- navigation
export function NavCard({ items }: { items: { icon: IconName; title: string; subtitle: string; to: string }[] }) {
  return (
    <Card>
      {items.map((l) => <ListRow key={l.to} icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />)}
    </Card>
  );
}

// ---------------------------------------------------------------- règles
const FLOW_LABEL: Record<NonNullable<PeriodEntry['flow']>, string> = { spotting: 'très léger (spotting)', light: 'léger', medium: 'moyen', heavy: 'abondant', very_heavy: 'très abondant' };
type Flow = NonNullable<PeriodEntry['flow']> | 'none';

export function PeriodLogger() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const periodsQ = usePeriods();
  const periods = periodsQ.data;
  const entries = useMemo(() => periods ?? [], [periods]);
  const [start, setStart] = useState(toFrDate(todayISO()));
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState<Flow>('none');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add() {
    const s = frToISO(start);
    const e = end.trim() ? frToISO(end) : null;
    const errs: Record<string, string> = {};
    if (!s || s > todayISO()) errs.start = 'Date invalide (JJ/MM/AAAA, pas dans le futur).';
    if (end.trim() && (!e || (s && e < s))) errs.end = 'Date de fin invalide ou antérieure au début.';
    if (s && e && daysBetween(s, e) > 15) errs.end = 'Durée inhabituelle : vérifiez la date de fin.';
    if (s && entries.some((p) => p.start_date === s)) errs.start = 'Des règles commencent déjà à cette date.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await insertOrQueue('period_entries', { user_id: userId, start_date: s, end_date: e, flow: flow === 'none' ? null : flow, note: null });
      inv('period_entries');
      haptic('success');
      setEnd('');
      setFlow('none');
      toast('Règles enregistrées.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function endToday(p: PeriodEntry) {
    setBusyId(p.id);
    try {
      await backend.update('period_entries', { end_date: todayISO() }, [eq('id', p.id)]);
      inv('period_entries');
      toast('Fin des règles enregistrée.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: PeriodEntry) {
    if (!(await confirm('Supprimer ces règles ?', 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await backend.remove('period_entries', [eq('id', p.id)]);
      inv('period_entries');
      toast('Règles supprimées.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <>
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}><Field label="Début" value={start} onChangeText={setStart} error={errors.start} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" /></View>
          <View style={{ flex: 1 }}><Field label="Fin" optional value={end} onChangeText={setEnd} error={errors.end} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" /></View>
        </Row>
        <View style={{ gap: 6, marginTop: spacing.sm }}>
          <Text variant="label">Flux (facultatif)</Text>
          <Segmented label="Flux" value={flow} onChange={setFlow} options={[{ value: 'none', label: '—' }, { value: 'spotting', label: 'Spotting' }, { value: 'light', label: 'Léger' }, { value: 'medium', label: 'Moyen' }, { value: 'heavy', label: 'Abondant' }, { value: 'very_heavy', label: 'Très abondant' }]} />
        </View>
        <Button label="Enregistrer mes règles" icon="plus" style={{ marginTop: spacing.sm }} loading={saving} onPress={add} />
      </Card>
      {periodsQ.isLoading && !periods ? <Skeleton rows={2} /> : null}
      {periodsQ.isError && !periods ? <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} title="Impossible d’afficher vos règles" /> : null}
      {entries.length ? (
        <Card>
          <Text weight="bold">Règles saisies</Text>
          {entries.slice().reverse().slice(0, 12).map((p) => (
            <ListRow
              key={p.id}
              icon="droplet"
              title={p.end_date ? `Du ${fmt(p.start_date)} au ${formatDateFr(p.end_date)}` : `Depuis le ${formatDateFr(p.start_date)}`}
              subtitle={p.flow ? `Flux ${FLOW_LABEL[p.flow]}` : undefined}
              right={
                <Row gap={0}>
                  {!p.end_date && p.start_date <= todayISO() ? <Button label="Fin aujourd’hui" size="sm" variant="ghost" loading={busyId === p.id} onPress={() => endToday(p)} /> : null}
                  <IconButton icon="trash-2" label={`Supprimer les règles du ${formatDateFr(p.start_date)}`} onPress={() => remove(p)} />
                </Row>
              }
            />
          ))}
        </Card>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- symptômes
const SYMPTOMS = ['Crampes', 'Maux de tête', 'Seins sensibles', 'Ballonnements', 'Fatigue', 'Humeur changeante', 'Acné', 'Douleur pelvienne', 'Saignements légers', 'Nausées', 'Libido en hausse', 'Libido en baisse'];

export function SymptomLogger() {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const logsQ = useSymptomLogs(30);
  const logs = logsQ.data;
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!symptoms.length && !note.trim()) return toast('Choisissez au moins un symptôme ou écrivez une note.', 'info');
    setSaving(true);
    try {
      await insertOrQueue('symptom_logs', { user_id: userId, logged_on: todayISO(), symptoms, note: note.trim() || null });
      inv('symptom_logs');
      setSymptoms([]);
      setNote('');
      toast('Symptômes notés.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer cette saisie ?', 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await backend.remove('symptom_logs', [eq('id', id)]);
      inv('symptom_logs');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Card>
      <Row wrap>
        {SYMPTOMS.map((s) => <Chip key={s} label={s} selected={symptoms.includes(s)} onPress={() => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />)}
      </Row>
      <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={2000} /></View>
      <Button label="Noter pour aujourd’hui" variant="secondary" style={{ marginTop: spacing.sm }} loading={saving} onPress={save} />
      <Text variant="caption" muted style={{ marginTop: 6 }}>Une douleur intense, des saignements inhabituels ou de la fièvre justifient d’en parler rapidement à un professionnel.</Text>
      {logsQ.isLoading && !logs ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
      {logsQ.isError && !logs ? <View style={{ marginTop: spacing.sm }}><ErrorView error={logsQ.error} onRetry={() => void logsQ.refetch()} title="Impossible d’afficher vos symptômes" /></View> : null}
      {(logs ?? []).slice(0, 8).map((l) => (
        <ListRow key={l.id} icon="clipboard" title={formatDateFr(l.logged_on)} subtitle={[l.symptoms.join(', '), l.note].filter(Boolean).join(' · ')} right={<IconButton icon="trash-2" label={`Supprimer la saisie du ${formatDateFr(l.logged_on)}`} onPress={() => remove(l.id)} />} />
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------- tests
type TestKind = 'ovulation_tests' | 'pregnancy_tests';
const TEST_RESULTS: Record<TestKind, { value: string; label: string }[]> = {
  ovulation_tests: [{ value: 'negative', label: 'Négatif' }, { value: 'positive', label: 'Positif' }, { value: 'peak', label: 'Pic' }, { value: 'invalid', label: 'Non lisible' }],
  pregnancy_tests: [{ value: 'negative', label: 'Négatif' }, { value: 'positive', label: 'Positif' }, { value: 'faint', label: 'Trait léger' }, { value: 'invalid', label: 'Non lisible' }],
};
const TEST_HELP: Record<TestKind, string> = {
  ovulation_tests: 'Un test d’ovulation détecte une hausse hormonale (LH) qui précède souvent l’ovulation ; il ne confirme pas que l’ovulation a eu lieu.',
  pregnancy_tests: 'Un test de grossesse se lit selon la notice du fabricant, idéalement à partir du jour des règles attendues. En cas de doute, une prise de sang prescrite par un professionnel est plus fiable.',
};

export function TestLogger({ kinds }: { kinds: TestKind[] }) {
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const [kind, setKind] = useState<TestKind>(kinds[0]);
  const [result, setResult] = useState<string | null>(null);
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const q = kind === 'ovulation_tests' ? ovuQ : pregQ;
  const list = q.data;
  const label = (v: string) => TEST_RESULTS[kind].find((r) => r.value === v)?.label ?? v;
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!result) return toast('Choisissez un résultat.', 'info');
    setSaving(true);
    try {
      await insertOrQueue(kind, { user_id: userId, tested_at: new Date().toISOString(), result });
      inv(kind);
      setResult(null);
      toast('Test enregistré.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer ce test ?', 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await backend.remove(kind, [eq('id', id)]);
      inv(kind);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <Card>
      {kinds.length > 1 ? (
        <Segmented label="Type de test" value={kind} onChange={(v) => { setKind(v); setResult(null); }} options={[{ value: 'ovulation_tests', label: 'Ovulation' }, { value: 'pregnancy_tests', label: 'Grossesse' }]} />
      ) : <Text weight="bold">{kind === 'pregnancy_tests' ? 'Test de grossesse' : 'Test d’ovulation'}</Text>}
      <Row wrap style={{ marginTop: spacing.sm }}>
        {TEST_RESULTS[kind].map((r) => <Chip key={r.value} label={r.label} selected={result === r.value} onPress={() => setResult(r.value)} />)}
      </Row>
      <Text variant="caption" muted style={{ marginTop: 6 }}>{TEST_HELP[kind]}</Text>
      <Button label="Enregistrer le test" variant="secondary" style={{ marginTop: spacing.sm }} loading={saving} onPress={save} />
      {q.isLoading && !list ? <View style={{ marginTop: spacing.sm }}><Skeleton rows={2} /></View> : null}
      {q.isError && !list ? <View style={{ marginTop: spacing.sm }}><ErrorView error={q.error} onRetry={() => void q.refetch()} title="Impossible d’afficher vos tests" /></View> : null}
      {(list ?? []).slice(0, 10).map((x) => (
        <ListRow
          key={x.id}
          icon="check-square"
          title={`${label(x.result)} · ${new Date(x.tested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
          right={<IconButton icon="trash-2" label={`Supprimer le test du ${new Date(x.tested_at).toLocaleDateString('fr-FR')}`} onPress={() => remove(x.id)} />}
        />
      ))}
    </Card>
  );
}

// ---------------------------------------------------------------- historique des cycles
/**
 * Historique des cycles, rendu en liste virtualisée : à placer dans un <Screen scroll={false} padded={false}>.
 * `addRoute` : écran où noter ses règles (action de l'état vide).
 */
export function CycleHistoryView({ est, addRoute, bottomPadding = 0 }: { est: CycleEstimate; addRoute: string; bottomPadding?: number }) {
  const periodsQ = usePeriods();
  const periods = periodsQ.data;
  const history = useMemo(() => cycleHistory(periods ?? []), [periods]);
  const done = history.filter((c) => !c.current && !c.unusual && c.length != null);
  const lengths = done.map((c) => c.length as number);
  const loading = periodsQ.isLoading && !periods;
  const failed = periodsQ.isError && !periods;
  const header = loading ? <Skeleton rows={4} /> : failed ? (
    <ErrorView error={periodsQ.error} onRetry={() => void periodsQ.refetch()} title="Impossible d’afficher l’historique" />
  ) : history.length ? (
    <View style={{ gap: spacing.md }}>
      {lengths.length ? (
        <Row wrap>
          <StatPill value={est.averageLength != null ? `${num(est.averageLength)} j` : '—'} label="Durée moyenne (6 derniers)" />
          <StatPill value={`${Math.min(...lengths)} j`} label="Plus court" />
          <StatPill value={`${Math.max(...lengths)} j`} label="Plus long" />
        </Row>
      ) : null}
      {lengths.length >= 2 ? (
        <Card>
          <BarChart data={done.slice(0, 8).reverse().map((c) => ({ label: fmt(c.start).replace(/ .*/, '') + '/' + c.start.slice(5, 7), value: c.length as number }))} unit="jours" accessibilityLabel="Durée de vos derniers cycles" />
          <Text variant="caption" muted>Durée de vos derniers cycles, en jours. Graphique descriptif.</Text>
        </Card>
      ) : null}
    </View>
  ) : null;
  return (
    <VirtualList
      data={loading || failed ? [] : history}
      keyExtractor={(c) => c.start}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: bottomPadding, gap: spacing.sm }}
      ListHeaderComponent={header}
      ListEmptyComponent={loading || failed ? null : (
        <EmptyState icon="rotate-ccw" title="Aucun cycle pour l’instant" body="Ajoutez vos dates de règles pour retrouver ici l’historique de vos cycles." action={{ label: 'Noter mes règles', icon: 'droplet', onPress: () => router.push(addRoute as never) }} />
      )}
      renderItem={({ item: c }) => (
        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow
            icon={c.current ? 'circle' : 'rotate-ccw'}
            title={c.current ? `Cycle en cours depuis le ${formatDateFr(c.start)}` : `Du ${fmt(c.start)} au ${formatDateFr(c.end!)}`}
            subtitle={[
              c.length != null ? `${c.length} jours${c.unusual ? ' (inhabituel : vérifiez vos saisies)' : ''}` : `Jour ${daysBetween(c.start, todayISO()) + 1}`,
              c.periodLength != null ? `règles ${c.periodLength} j` : null,
              c.ovulationEstimate ? `ovulation estimée a posteriori vers le ${fmt(c.ovulationEstimate)} (estimation)` : null,
            ].filter(Boolean).join(' · ')}
          />
        </Card>
      )}
    />
  );
}

// ---------------------------------------------------------------- articles du parcours
export function JourneyArticles({ journey }: { journey: FertilityJourney }) {
  const q = useJourneyArticles(journey);
  const { data } = q;
  if (q.isLoading && !data.length) return <Skeleton rows={2} />;
  if (q.isError && !data.length) return <ErrorView error={q.error} onRetry={() => void q.refetch()} title="Impossible d’afficher les articles" />;
  if (!data.length) return <EmptyState icon="book-open" title="Articles bientôt disponibles" body="Les articles de ce parcours arrivent bientôt dans la bibliothèque." action={{ label: 'Ouvrir la bibliothèque', icon: 'book-open', onPress: () => router.push('/library' as never) }} />;
  return (
    <Card>
      {data.map((a) => <ListRow key={a.id} icon="book-open" title={a.title} subtitle={a.summary} onPress={() => router.push(`/article/${a.slug}` as never)} />)}
    </Card>
  );
}

// ---------------------------------------------------------------- questions pour la consultation
export function ConsultationChecklist({ journey }: { journey: FertilityJourney }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const householdId = useHouseholdId();
  const questionsQ = useConsultationQuestions(journey);
  const { data } = questionsQ;
  const add = useAddQuestions(journey);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const share = useShareQuestion();
  const [text, setText] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const list = data ?? [];
  const existing = new Set(list.map((q) => q.question));
  const suggestions = QUESTION_SUGGESTIONS[journey].filter((s) => !existing.has(s));
  const nextPos = list.length ? Math.max(...list.map((q) => q.position)) + 1 : 0;

  async function addQuestions(qs: string[]) {
    const clean = qs.map((q) => q.trim()).filter(Boolean);
    if (!clean.length) return;
    try {
      await add.mutateAsync({ questions: clean, startPosition: nextPos });
      setText('');
      haptic('success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function update(id: string, patch: Record<string, unknown>): Promise<boolean> {
    try {
      await backend.update('consultation_questions', patch, [eq('id', id)]);
      inv('consultation_questions');
      return true;
    } catch (err) {
      toast(friendlyError(err), 'error');
      return false;
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer cette question ?', 'Cette action est définitive.', 'Supprimer'))) return;
    try {
      await backend.remove('consultation_questions', [eq('id', id)]);
      inv('consultation_questions');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function saveAnswer(id: string) {
    setSavingAnswer(true);
    const ok = await update(id, { answer: answer.trim() || null });
    setSavingAnswer(false);
    if (!ok) return;
    setOpen(null);
    toast('Réponse enregistrée.');
  }

  return (
    <>
      <Card>
        <Field label="Ajouter une question" value={text} onChangeText={setText} maxLength={300} placeholder="ex. Combien de temps attendre avant de consulter ?" onSubmitEditing={() => addQuestions([text])} />
        <Button label="Ajouter" icon="plus" variant="secondary" style={{ marginTop: spacing.sm }} loading={add.isPending} onPress={() => addQuestions([text])} />
      </Card>
      {questionsQ.isLoading && !data ? <Skeleton rows={3} /> : null}
      {questionsQ.isError && !data ? <ErrorView error={questionsQ.error} onRetry={() => void questionsQ.refetch()} title="Impossible d’afficher vos questions" /> : null}
      {list.length ? (
        <Card>
          {list.map((q) => (
            <View key={q.id} style={{ paddingVertical: spacing.xs, gap: 6, borderBottomWidth: 0.5, borderColor: t.colors.border }}>
              <Row style={{ alignItems: 'flex-start' }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: q.done }}
                  accessibilityLabel={`${q.question}${q.done ? ', posée' : ''}`}
                  onPress={() => update(q.id, { done: !q.done })}
                  hitSlop={11}
                  style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: q.done ? t.colors.success : t.colors.border, backgroundColor: q.done ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
                >
                  {q.done ? <Icon name="check" size={16} color="#fff" /> : null}
                </Pressable>
                <Pressable style={{ flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={`Ajouter une réponse à : ${q.question}`} onPress={() => { setOpen(q.id); setAnswer(q.answer ?? ''); }}>
                  <Text style={{ textDecorationLine: q.done ? 'line-through' : 'none' }} muted={q.done}>{q.question}</Text>
                  {q.answer ? <Text variant="small" muted>{`Réponse notée : ${q.answer}`}</Text> : null}
                  {q.shared ? <Text variant="caption" color={t.colors.lavender}>Partagée avec votre foyer</Text> : null}
                </Pressable>
                <IconButton icon="trash-2" label={`Supprimer la question ${q.question}`} onPress={() => remove(q.id)} />
              </Row>
            </View>
          ))}
          <Text variant="caption" muted style={{ marginTop: 6 }}>Cochez une question une fois posée ; touchez-la pour noter la réponse.</Text>
        </Card>
      ) : null}
      {suggestions.length ? (
        <>
          <SectionTitle title="Suggestions" action={suggestions.length > 1 ? 'Tout ajouter' : undefined} onAction={() => addQuestions(suggestions)} />
          <Card tone="soft">
            {suggestions.map((s) => <ListRow key={s} icon="plus-circle" title={s} onPress={() => addQuestions([s])} />)}
          </Card>
        </>
      ) : null}
      <Sheet visible={!!open} onClose={() => setOpen(null)} title="Ma question">
        {(() => {
          const q = list.find((x) => x.id === open);
          if (!q) return null;
          return (
            <>
              <Text weight="medium">{q.question}</Text>
              <Field label="Réponse ou notes" optional value={answer} onChangeText={setAnswer} maxLength={1000} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">Partager avec mon foyer</Text>
                  <Text variant="caption" muted>{householdId ? 'Visible par les membres ayant accès au domaine « santé ». Désactivé par défaut.' : 'Aucun foyer : cette question reste privée.'}</Text>
                </View>
                <Toggle label="Partager cette question avec mon foyer" value={q.shared} onChange={async (v) => {
                  if (!householdId) return toast('Créez ou rejoignez un foyer pour partager une question.', 'info');
                  try { await share.mutateAsync({ id: q.id, shared: v }); } catch (err) { toast(friendlyError(err), 'error'); }
                }} />
              </Row>
              <Button label="Enregistrer" loading={savingAnswer} onPress={() => saveAnswer(q.id)} />
            </>
          );
        })()}
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- rappels du parcours
const WEEKDAY_CHIPS: { d: Weekday; label: string }[] = [
  { d: 1, label: 'Lun' }, { d: 2, label: 'Mar' }, { d: 3, label: 'Mer' }, { d: 4, label: 'Jeu' }, { d: 5, label: 'Ven' }, { d: 6, label: 'Sam' }, { d: 7, label: 'Dim' },
];

function parseTime(s: string): { hour: number; minute: number } | null {
  const m = s.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{0,2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/** Planification d'un rappel proposé ; renvoie une erreur lisible si la saisie est invalide. */
export function presetSchedule(kind: ReminderPreset['kind'], v: { time: string; date: string; weekday: Weekday }): { schedule?: ReminderSchedule; error?: string } {
  const tm = parseTime(v.time);
  if (!tm) return { error: 'Heure attendue au format HH:MM (ex. 08:30).' };
  if (kind === 'daily') return { schedule: { type: 'daily', ...tm } };
  if (kind === 'weekly') return { schedule: { type: 'weekly', weekdays: [v.weekday], ...tm } };
  const iso = frToISO(v.date);
  if (!iso) return { error: 'Date attendue au format JJ/MM/AAAA.' };
  const [y, mo, d] = iso.split('-').map(Number);
  const at = new Date(y, mo - 1, d, tm.hour, tm.minute);
  if (at.getTime() <= Date.now()) return { error: 'Choisissez un moment dans le futur.' };
  return { schedule: { type: 'once', at: at.toISOString() } };
}

export function JourneyReminders({ presets, deepLink, defaultDates }: { presets: ReminderPreset[]; deepLink: '/fertility' | '/contraception'; defaultDates?: Partial<Record<string, ISODate | null>> }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const remindersQ = useReminders();
  const reminders = remindersQ.data;
  const toggle = useToggleReminder();
  const del = useDeleteReminder();
  const [preset, setPreset] = useState<ReminderPreset | null>(null);
  const [time, setTime] = useState('08:00');
  const [date, setDate] = useState('');
  const [weekday, setWeekday] = useState<Weekday>(1);
  // Notifications neutres par défaut (texte détaillé seulement si la personne l'a explicitement choisi)
  const { prefs: cyclePrefs } = useCyclePreferences();
  const [discreet, setDiscreet] = useState(!cyclePrefs.detailed_notifications);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mine = (reminders ?? []).filter((r) => r.deep_link?.startsWith(deepLink));

  function openPreset(p: ReminderPreset) {
    setPreset(p);
    setError(null);
    setTime(p.key === 'bbt' ? '07:00' : '09:00');
    const d = defaultDates?.[p.key];
    setDate(toFrDate(d && d > todayISO() ? d : addDays(todayISO(), 1)));
  }

  async function create() {
    if (!preset) return;
    const { schedule, error: e } = presetSchedule(preset.kind, { time, date, weekday });
    setError(e ?? null);
    if (!schedule || !validateSchedule(schedule)) return;
    setSaving(true);
    try {
      await backend.insert('reminders', {
        user_id: userId, household_id: null, category: preset.category,
        title: discreet ? preset.discreetTitle : preset.title, body: null, schedule,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: deepLink,
      });
      inv('reminders'); // la liste relue reprogramme les notifications locales
      haptic('success');
      toast('Rappel créé.');
      setPreset(null);
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer ce rappel ?', 'Les notifications programmées seront annulées.', 'Supprimer'))) return;
    try { await del.mutateAsync(id); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  async function setEnabled(id: string, enabled: boolean) {
    try { await toggle.mutateAsync({ id, enabled }); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  return (
    <>
      {remindersQ.isLoading && !reminders ? <Skeleton rows={2} /> : remindersQ.isError && !reminders ? (
        <ErrorView error={remindersQ.error} onRetry={() => void remindersQ.refetch()} title="Impossible d’afficher vos rappels" />
      ) : mine.length ? (
        <Card>
          {mine.map((r) => (
            <Row key={r.id} style={{ paddingVertical: spacing.xs }}>
              <View style={{ flex: 1, opacity: r.enabled ? 1 : 0.55 }}>
                <Text weight="medium">{r.title}</Text>
                <Text variant="small" muted>{validateSchedule(r.schedule) ? describeSchedule(r.schedule) : 'Planification à corriger'}</Text>
              </View>
              <Toggle label={`${r.enabled ? 'Désactiver' : 'Activer'} le rappel ${r.title}`} value={r.enabled} onChange={(v) => void setEnabled(r.id, v)} />
              <IconButton icon="trash-2" label={`Supprimer le rappel ${r.title}`} onPress={() => remove(r.id)} />
            </Row>
          ))}
        </Card>
      ) : (
        <Card tone="soft"><Text muted>Aucun rappel pour l’instant. Choisissez un modèle ci-dessous : vous réglez l’heure, la date et le titre affiché.</Text></Card>
      )}
      <SectionTitle title="Créer un rappel" />
      <Card>
        {presets.map((p) => <ListRow key={p.key} icon="bell" title={p.title} subtitle={p.hint} onPress={() => openPreset(p)} />)}
      </Card>
      <Button label="Tous mes rappels" variant="ghost" icon="settings" onPress={() => router.push('/settings/reminders' as never)} />
      <Sheet visible={!!preset} onClose={() => setPreset(null)} title={preset?.title ?? 'Rappel'}>
        {preset ? (
          <>
            <Text variant="small" muted>{preset.hint}</Text>
            {preset.kind === 'once' ? <Field label="Date" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" hint={defaultDates?.[preset.key] ? 'Date pré-remplie à partir d’une estimation : ajustez-la si besoin.' : undefined} /> : null}
            {preset.kind === 'weekly' ? (
              <View style={{ gap: 6 }}>
                <Text variant="label">Jour</Text>
                <Row wrap>{WEEKDAY_CHIPS.map((w) => <Chip key={w.d} label={w.label} selected={weekday === w.d} onPress={() => setWeekday(w.d)} />)}</Row>
              </View>
            ) : null}
            <Field label="Heure" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="HH:MM" />
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text weight="medium">Titre discret</Text>
                <Text variant="caption" muted>{`Affiché sur l’écran verrouillé : « ${discreet ? preset.discreetTitle : preset.title} ».`}</Text>
              </View>
              <Toggle label="Utiliser un titre discret" value={discreet} onChange={setDiscreet} />
            </Row>
            {error ? <Text variant="small" color={t.colors.danger}>{error}</Text> : null}
            <Button label="Créer le rappel" loading={saving} onPress={create} />
          </>
        ) : null}
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- bandeau « privé »
export function PrivateBanner({ children }: { children: string }) {
  return <Banner tone="info" icon="lock" title="Privé — visible uniquement par vous">{children}</Banner>;
}
