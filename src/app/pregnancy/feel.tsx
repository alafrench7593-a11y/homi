/**
 * « Comment je me sens aujourd'hui ? » (profil grossesse) : symptômes, intensité, heure de début, fréquence, note ;
 * modification et suppression. Après validation, une petite carte adaptée à la semaine de grossesse :
 *  1. « Fréquent à ce stade ? » 2. « Ce qui peut parfois aider » 3. « Quand demander conseil ».
 * Jamais « c'est normal », « aucun danger » ni « inutile de consulter » ; aucun diagnostic.
 * Symptôme intense, inhabituel ou inquiétant : informations de sécurité et contacts (maternité, professionnel, urgences).
 * Données strictement personnelles (jamais visibles du foyer). Gratuit.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { callNumber, openLink } from '@/lib/links';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useActivePregnancy } from '@/lib/data/hooks';
import { useDeleteSymptom, usePregnancySymptoms, useSaveSymptoms, type PregnancySymptomLog } from '@/lib/data/hooks-care';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { symptomCard, symptomsFor, type Frequency, type Intensity, type SafetyLevel, type SymptomCard } from '@/lib/domain/pregnancyCare';
import { NOT_ADVICE, SAFETY_CONTACTS, type SymptomKey } from '@/content/pregnancyCare';
import { formatDate, t as tr, type TKey } from '@/i18n';

import { useTheme } from '@/theme/ThemeProvider';
import { frequentValues, withFrequentFirst } from '@/lib/domain/quickPicks';
import { spacing } from '@/theme/tokens';
import { useTapShield } from '@/features/tapShield';

const FREQS: Frequency[] = ['once', 'several', 'continuous'];
const symLabel = (k: string) => tr(`care.sym.${k}` as TKey);

interface Draft { id?: string; symptoms: SymptomKey[]; intensity: Intensity | null; time: string; frequency: Frequency | null; note: string; worried: boolean }
/** Heure locale « HH:MM » (formatDate ajoute la date : le champ ne serait plus valide en modification). */
const hhmm = (iso: string) => { const x = new Date(iso); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
const EMPTY: Draft = { symptoms: [], intensity: null, time: '', frequency: null, note: '', worried: false };

export default function Feel() {
  const t = useTheme();
  const toast = useToast();
  const pregnancy = useActivePregnancy();
  const week = pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : 0;
  const logs = usePregnancySymptoms().data ?? [];
  const save = useSaveSymptoms();
  const del = useDeleteSymptom();
  const [d, setD] = useState<Draft>(EMPTY);
  const [cards, setCards] = useState<SymptomCard[] | null>(null);
  // Les cartes (et leurs alertes de sécurité) remplacent le formulaire : un double appui sur « Enregistrer » ne les masque pas
  const { arm, guard } = useTapShield();
  // Mes symptômes fréquents (d'après MES saisies) : en tête des choix et notables en un seul tap
  const frequent = useMemo(() => frequentValues(logs.map((l) => ({ value: l.symptom as SymptomKey, at: l.logged_at })), 4), [logs]);
  const options = useMemo(() => withFrequentFirst(symptomsFor(week), frequent), [week, frequent]);
  const [more, setMore] = useState(false);
  const todayKey = new Date().toDateString();
  const todayCount = logs.filter((l) => new Date(l.logged_at).toDateString() === todayKey).length;

  function toggle(k: SymptomKey) {
    if (d.id) return setD({ ...d, symptoms: [k] });
    setD({ ...d, symptoms: d.symptoms.includes(k) ? d.symptoms.filter((x) => x !== k) : [...d.symptoms, k] });
  }
  function startedAt(): string | null {
    const m = d.time.trim().match(/^(\d{1,2})[:h ]?(\d{2})?$/i);
    if (!m) return null;
    const x = new Date(); x.setHours(Number(m[1]), Number(m[2] ?? 0), 0, 0);
    return x.getTime() > Date.now() ? null : x.toISOString();
  }
  async function submit() {
    if (!d.symptoms.length) return toast(tr('care.feel.pick'), 'info');
    if (d.time.trim() && !startedAt()) return toast(tr('care.feel.errTime'), 'error');
    const rows = d.symptoms.map((symptom) => ({ pregnancy_id: pregnancy?.id ?? null, symptom, intensity: d.intensity, started_at: startedAt(), frequency: d.frequency, note: d.note.trim() || null, week_sa: pregnancy ? week : null }));
    try {
      await save.mutateAsync({ id: d.id, rows });
      arm();
      setCards(d.symptoms.map((symptom) => symptomCard({ symptom, intensity: d.intensity, frequency: d.frequency, weekSA: week, worried: d.worried })));
      toast(tr(d.id ? 'care.feel.updated' : 'care.feel.saved'), 'success');
      setD(EMPTY);
      setMore(false);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  /** Un tap sur un symptôme fréquent : noté maintenant, la carte d'information s'affiche (modifiable ensuite). */
  async function quickLog(symptom: SymptomKey) {
    try {
      await save.mutateAsync({ rows: [{ pregnancy_id: pregnancy?.id ?? null, symptom, intensity: null, started_at: null, frequency: null, note: null, week_sa: pregnancy ? week : null }] });
      setCards([symptomCard({ symptom, intensity: null, frequency: null, weekSA: week, worried: false })]);
      toast(tr('care.feel.saved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function edit(l: PregnancySymptomLog) {
    setCards(null);
    setD({ id: l.id, symptoms: [l.symptom as SymptomKey], intensity: l.intensity, time: l.started_at ? hhmm(l.started_at) : '', frequency: l.frequency, note: l.note ?? '', worried: false });
    setMore(!!(l.started_at || l.frequency || l.note));
  }
  async function remove(l: PregnancySymptomLog) {
    if (!(await confirm(tr('care.feel.deleteTitle'), symLabel(l.symptom), tr('common.delete')))) return;
    try { await del.mutateAsync(l.id); toast(tr('care.feel.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('care.feel.title')} subtitle={pregnancy ? tr('care.feel.subtitle', { w: week }) : undefined}
      action={cards
        ? { label: tr('care.feel.another'), icon: 'plus', onPress: guard(() => setCards(null)), testID: 'feel-another' }
        : { label: tr(d.id ? 'common.save' : 'care.feel.save'), icon: 'check', onPress: () => submit(), disabled: save.isPending, testID: 'feel-save' }}>
      <TodaySummary items={[
        { icon: 'feather', value: String(todayCount), label: tr('care.feel.sumToday') },
        { icon: 'clock', value: logs[0] ? symLabel(logs[0].symptom) : '—', label: tr('care.feel.sumLast') },
        { icon: 'moon', value: pregnancy ? tr('care.cal.sa', { w: week }) : '—', label: tr('care.feel.sumWeek') },
      ]} />
      {frequent.length && !cards && !d.id ? (
        <View style={{ gap: 6 }} testID="feel-quick">
          <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('pc.feel.quick' as TKey)}</Text>
          <Row wrap>
            {frequent.map((k) => <Button key={k} label={symLabel(k)} icon="plus" size="sm" variant="secondary" onPress={() => void quickLog(k)} disabled={save.isPending} testID={`feel-quick-${k}`} />)}
          </Row>
        </View>
      ) : null}
      {cards ? (
        <View style={{ gap: spacing.sm }} testID="feel-cards">
          {cards.map((c) => <SymptomInfo key={c.symptom} c={c} week={week} />)}
        </View>
      ) : (
        <Card>
          <View style={{ gap: spacing.sm }} testID="feel-form">
            <Text variant="label">{tr(d.id ? 'care.feel.editing' : 'care.feel.pickLabel')}</Text>
            <Row wrap>
              {options.map((k) => <Chip key={k} label={symLabel(k)} selected={d.symptoms.includes(k)} onPress={() => toggle(k)} testID={`feel-sym-${k}`} />)}
            </Row>
            <Text variant="label">{tr('care.feel.intensity')}</Text>
            <Row wrap>
              {([1, 2, 3] as Intensity[]).map((n) => <Chip key={n} label={tr(`care.feel.int${n}` as TKey)} selected={d.intensity === n} onPress={() => setD({ ...d, intensity: d.intensity === n ? null : n })} testID={`feel-intensity-${n}`} />)}
            </Row>
            {more ? (
              <>
                <Field label={tr('care.feel.start')} optional value={d.time} onChangeText={(v) => setD({ ...d, time: v })} placeholder="08:30" keyboardType="numbers-and-punctuation" hint={tr('care.feel.startHint')} testID="feel-time" />
                <Text variant="label">{tr('care.feel.frequency')}</Text>
                <Row wrap>
                  {FREQS.map((f) => <Chip key={f} label={tr(`care.feel.freq.${f}` as TKey)} selected={d.frequency === f} onPress={() => setD({ ...d, frequency: d.frequency === f ? null : f })} testID={`feel-freq-${f}`} />)}
                </Row>
                <Field label={tr('care.feel.note')} optional value={d.note} onChangeText={(v) => setD({ ...d, note: v })} maxLength={1000} multiline testID="feel-note" />
              </>
            ) : (
              <Button label={[tr('care.feel.start'), tr('care.feel.frequency'), tr('care.feel.note')].join(' · ')} size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }} onPress={() => setMore(true)} testID="feel-more" />
            )}
            {/* Libellé visible à côté de l'interrupteur (il n'était lu que par les lecteurs d'écran) */}
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ flex: 1 }}>{tr('care.feel.worried')}</Text>
              <Toggle label={tr('care.feel.worried')} value={d.worried} onChange={(v) => setD({ ...d, worried: v })} />
            </Row>
            {d.id ? <Button label={tr('common.cancel')} variant="ghost" onPress={() => setD(EMPTY)} /> : null}
            <Text variant="caption" muted>{tr('care.feel.private')}</Text>
          </View>
        </Card>
      )}

      <SectionTitle title={tr('care.feel.history')} />
      {!logs.length ? <EmptyState icon="feather" title={tr('care.feel.none')} body={tr('care.feel.noneBody')} /> : null}
      {logs.slice(0, 30).map((l) => (
        <Card key={l.id} style={{ paddingVertical: spacing.sm }}>
          <View testID={`feel-entry-${l.id}`}>
            <Row style={{ alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text weight="bold">{symLabel(l.symptom)}{l.intensity ? ` · ${tr(`care.feel.int${l.intensity}` as TKey).toLowerCase()}` : ''}</Text>
                <Text variant="caption" muted>
                  {formatDate(l.logged_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {l.week_sa != null ? ` · ${tr('care.cal.sa', { w: l.week_sa })}` : ''}
                  {l.frequency ? ` · ${tr(`care.feel.freq.${l.frequency}` as TKey).toLowerCase()}` : ''}
                </Text>
                {l.note ? <Text variant="small" muted>{l.note}</Text> : null}
              </View>
              <Button label={tr('care.feel.edit')} size="sm" variant="ghost" onPress={() => edit(l)} testID={`feel-edit-${l.id}`} />
              <Button label={tr('common.delete')} size="sm" variant="ghost" onPress={() => remove(l)} testID={`feel-delete-${l.id}`} />
            </Row>
          </View>
        </Card>
      ))}
      <Text variant="caption" muted>{NOT_ADVICE}</Text>
      <Tappable accessibilityRole="link" onPress={() => router.push('/emergency')} style={{ minHeight: 40, justifyContent: 'center' }}>
        <Text variant="small" weight="bold" color={t.colors.primary}>{tr('care.feel.emergencyLink')}</Text>
      </Tappable>
    </Screen>
  );
}

const SAFETY_TONE: Record<Exclude<SafetyLevel, null>, 'danger' | 'warning'> = { emergency: 'danger', maternity: 'danger', soon: 'warning' };

export function SymptomInfo({ c, week }: { c: SymptomCard; week: number }) {
  const t = useTheme();
  const toast = useToast();
  return (
    <Card>
      <View style={{ gap: spacing.xs }} testID={`feel-card-${c.symptom}`}>
        <Text variant="heading">{symLabel(c.symptom)}</Text>
        <Text variant="caption" muted>{tr('care.cal.sa', { w: week })}</Text>
        {c.safety ? (
          <View testID={`feel-safety-${c.safety}`}>
            <Banner tone={SAFETY_TONE[c.safety]} title={tr(`care.safety.${c.safety}.title` as TKey)}>
              <Text variant="small">{tr(`care.safety.${c.safety}.body` as TKey)}</Text>
              <Row wrap style={{ marginTop: 6 }}>
                {c.safety === 'emergency' ? SAFETY_CONTACTS.slice(0, 2).map((x) => <Button key={x.key} label={tr('care.safety.call', { label: x.label, phone: x.phone })} size="sm" icon="phone" onPress={() => callNumber(x.phone, toast)} />) : null}
                <Button label={tr('care.safety.numbers')} size="sm" variant="secondary" icon="life-buoy" onPress={() => router.push('/emergency')} />
              </Row>
            </Banner>
          </View>
        ) : null}
        <Part icon="help-circle" title={tr('care.feel.part1')}>
          <Text variant="small">{tr(`care.feel.freq_${c.frequent}` as TKey)}</Text>
        </Part>
        <Part icon="feather" title={tr('care.feel.part2')}>
          {c.help.map((h) => <Text key={h} variant="small">• {h}</Text>)}
        </Part>
        <Part icon="message-circle" title={tr('care.feel.part3')}>
          {c.ask.map((h) => <Text key={h} variant="small">• {h}</Text>)}
        </Part>
        {c.sources.map((s) => (
          <Tappable key={s.url} accessibilityRole="link" onPress={() => openLink(s.url, toast)} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Text variant="caption" color={t.colors.primary}>{s.label}{s.published ? ` (${formatDate(`${s.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''} · {tr('care.consulted', { date: formatDate(`${s.consulted_on}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
          </Tappable>
        ))}
      </View>
    </Card>
  );
}

function Part({ icon, title, children }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2, marginTop: 4 }}>
      <Row style={{ alignItems: 'center', gap: 6 }}><Icon name={icon} size={15} color={t.colors.primary} /><Text weight="bold">{title}</Text></Row>
      {children}
    </View>
  );
}
