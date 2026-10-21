/**
 * Sommeil intelligent (Premium) d'un enfant : rythme moyen, prochain repos estimé d'après les relevés de la famille,
 * changements d'habitude (constats, jamais un diagnostic), graphiques 7 / 30 jours, routine du coucher personnalisable,
 * rappels facultatifs, récapitulatifs du jour et de la semaine, repères généraux selon l'âge.
 * Rien n'est promis : chaque enfant dort à son rythme, et l'estimation n'est pas une consigne médicale.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BarChart } from '@/components/Charts';
import { PremiumSection } from '@/components/Premium';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { SleepQuickButtons } from '@/features/sleep';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useLogs, useRows } from '@/lib/data/hooks';
import { friendlyError, useSaveReminder } from '@/lib/data/hooks-settings';
import { formatDuration } from '@/lib/domain/dates';
import { formatClock } from '@/lib/domain/bottleTimer';
import { childAge } from '@/lib/domain/child';
import { habitChanges, MIN_SAMPLES, nextRestEstimate, sleepDay, sleepRhythm, sleepSeries, weeklySleepRecap } from '@/lib/domain/sleepEstimate';
import type { Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';

interface Routine { id: string; child_id: string; household_id: string; bedtime: string | null; steps: string[]; remind: boolean }
const SUGGESTED = ['Bain', 'Pyjama', 'Brossage des dents', 'Histoire', 'Câlin', 'Chanson', 'Veilleuse'];

function ageTips(months: number): string[] {
  if (months < 4) return ['Les nuits sont encore entrecoupées par les repas : c’est habituel à cet âge.', 'Couchez toujours votre bébé sur le dos, dans un lit sans oreiller, couette ni tour de lit.'];
  if (months < 12) return ['Un rituel court et toujours dans le même ordre aide à reconnaître le moment du coucher.', 'Couchage sur le dos, gigoteuse plutôt que couverture, pièce non surchauffée.'];
  if (months < 36) return ['Les siestes évoluent beaucoup entre 1 et 3 ans : suivez les signes de fatigue plutôt que l’horloge.', 'Écrans à éviter avant le coucher ; une lumière douce et un moment calme aident.'];
  return ['Des horaires réguliers, même le week-end, aident l’endormissement.', 'Pas d’écran dans la chambre ni dans l’heure qui précède le coucher.'];
}

export default function SleepInsights() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const toast = useToast();
  const inv = useInvalidate();
  const child = useChild(childId);
  const [range, setRange] = useState<7 | 30>(7);
  const { data: sleeps, isLoading } = useLogs<Sleep>('sleep', childId, 30);
  const routineQ = useRows<Routine>(['bedtime_routines', childId ?? ''], childId ? { table: 'bedtime_routines', filters: [eq('child_id', childId)], limit: 1 } : null);
  const routine = routineQ.data?.[0] ?? null;
  const saveReminder = useSaveReminder();
  const [bedtime, setBedtime] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [remind, setRemind] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (routine) { setBedtime(routine.bedtime?.slice(0, 5) ?? ''); setSteps(routine.steps); setRemind(routine.remind); } }, [routine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const list = sleeps ?? [];
  const rhythm = useMemo(() => sleepRhythm(list, now, 7), [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const series = useMemo(() => sleepSeries(list, now, range), [list, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const changes = useMemo(() => habitChanges(list, now), [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const est = nextRestEstimate(list, now);
  const today = sleepDay(list, now, now);
  if (!child) return <Screen back title="Sommeil"><Skeleton kind="detail" rows={4} /></Screen>;
  const name = child.first_name;

  async function remindRest(at: Date) {
    const when = new Date(at.getTime() - 10 * 60_000);
    if (when.getTime() <= Date.now()) { toast('L’heure estimée est déjà proche : pas de rappel programmé.', 'info'); return; }
    try {
      await saveReminder.mutateAsync({ draft: { title: `Repos de ${name}`, body: 'Estimation d’après vos relevés : observez les signes de fatigue.', category: 'tracking', schedule: { type: 'once', at: when.toISOString() }, enabled: true, deep_link: `/sleep/${child!.id}`, child_id: child!.id } });
      toast(`Rappel programmé à ${formatClock(when.toISOString())}.`, 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function saveRoutine() {
    const m = bedtime.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?$/);
    if (bedtime.trim() && (!m || Number(m[1]) > 23)) { toast('Heure attendue au format HH:MM (ex. 19:45).', 'error'); return; }
    const hm = m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : null;
    setSaving(true);
    try {
      const row = { bedtime: hm, steps, remind: remind && !!hm, updated_at: new Date().toISOString() };
      if (routine) await backend.update('bedtime_routines', row, [eq('id', routine.id)]);
      else await backend.insert('bedtime_routines', { ...row, child_id: child!.id, household_id: child!.household_id });
      // Rappel facultatif, créé seulement si la personne l'a demandé (15 min avant l'heure choisie)
      const existing = await backend.select<{ id: string }>({ table: 'reminders', filters: [eq('child_id', child!.id), eq('deep_link', `/sleep/${child!.id}?routine=1`)] });
      for (const r of existing) await backend.remove('reminders', [eq('id', r.id)]);
      if (remind && hm) {
        const [h, mi] = hm.split(':').map(Number);
        const at = h * 60 + mi - 15;
        await saveReminder.mutateAsync({ draft: { title: `Routine du coucher de ${name}`, body: steps.slice(0, 3).join(' · ') || null, category: 'tracking', schedule: { type: 'daily', hour: Math.floor((at + 1440) % 1440 / 60), minute: (at + 1440) % 60 }, enabled: true, deep_link: `/sleep/${child!.id}?routine=1`, child_id: child!.id } });
      }
      inv('bedtime_routines', 'reminders');
      toast('Routine enregistrée.', 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }

  const h = (min: number) => formatDuration(min);
  return (
    <Screen back title={`Sommeil de ${name}`} subtitle={childAge(child.birth_date).label}>
      <SleepQuickButtons child={child} />
      <Card>
        <Text weight="bold">Aujourd’hui</Text>
        <Text variant="small">{`${today.naps} sieste(s) · ${h(today.napMinutes)} · nuit ${h(today.nightMinutes)}${today.nightWakeups ? ` · ${today.nightWakeups} réveil(s)` : ''}`}</Text>
      </Card>

      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{`${rhythm.days} jour(s) noté(s) cette semaine : Premium en tire le rythme moyen de ${name}, son prochain repos estimé et les changements d’habitude.`}</Text>}>
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title="Prochain repos" />
          <View testID="sleep-next">
            <Card>
              {isLoading ? <Skeleton rows={1} /> : est.kind === 'asleep' ? <Text>{`Endormi·e depuis ${formatClock(est.since)}.`}</Text>
                : est.kind === 'not_enough' ? <Text variant="small" muted>{`Notez au moins ${MIN_SAMPLES + 1} siestes ou nuits : l’estimation se calcule uniquement sur vos propres relevés.`}</Text>
                : (
                  <>
                    <Text weight="bold">{`Vers ${formatClock(est.at.toISOString())}`}</Text>
                    <Text variant="caption" muted>{`Temps d’éveil médian de ${h(est.medianMinutes)} sur vos ${est.samples} derniers relevés. Une estimation, pas une consigne : les signes de fatigue de ${name} priment.`}</Text>
                    <Button label="Me rappeler 10 min avant" size="sm" variant="secondary" icon="bell" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => remindRest(est.at)} testID="sleep-remind" />
                  </>
                )}
            </Card>
          </View>

          <SectionTitle title="Rythme moyen (7 jours)" />
          <View testID="sleep-rhythm">
            <Card>
              {rhythm.days ? (
                <>
                  <Text>{`${String(rhythm.naps).replace('.', ',')} sieste(s) par jour · ${h(rhythm.napMinutes)}`}</Text>
                  <Text>{`Nuit : ${h(rhythm.nightMinutes)} · total ${h(rhythm.totalMinutes)}`}</Text>
                  <Text variant="small" muted>{`Calculé sur ${rhythm.days} jour(s) noté(s) ; les jours sans relevé ne comptent pas.`}</Text>
                </>
              ) : <Text variant="small" muted>Pas encore de journée complète notée.</Text>}
            </Card>
          </View>

          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle title="Graphique" />
            <Row><Chip label="7 jours" selected={range === 7} onPress={() => setRange(7)} /><Chip label="30 jours" selected={range === 30} onPress={() => setRange(30)} /></Row>
          </Row>
          <Card>
            <BarChart data={series.map((d) => ({ label: range === 7 ? d.date.toLocaleDateString('fr-FR', { weekday: 'narrow' }) : String(d.date.getDate()), value: Math.round((d.total / 60) * 10) / 10 }))} unit="h" accessibilityLabel={`Heures de sommeil notées par jour, ${range} derniers jours`} />
          </Card>

          <SectionTitle title="Changements d’habitude" />
          <View testID="sleep-changes">
            <Card>
              {changes.length ? changes.map((c) => <Text key={c.kind} variant="small">{`• ${c.text}`}</Text>) : <Text variant="small" muted>Aucun changement marqué dans les relevés récents.</Text>}
              <Text variant="caption" muted style={{ marginTop: 4 }}>Simple constat de vos relevés, pas un diagnostic. En cas d’inquiétude (fièvre, gêne respiratoire, enfant inhabituel), demandez un avis médical.</Text>
            </Card>
          </View>

          <SectionTitle title="Récapitulatif de la semaine" />
          <View testID="sleep-weekly"><Card>{weeklySleepRecap(list, now).map((l) => <Text key={l} variant="small">{l}</Text>)}{!rhythm.days ? <Text variant="small" muted>Rien de noté cette semaine.</Text> : null}</Card></View>
        </View>
      </PremiumSection>

      <SectionTitle title="Routine du coucher" />
      <PremiumSection feature="bedtime_routine" name={name} preview={<Text variant="small">{`Par exemple : ${SUGGESTED.slice(0, 4).join(' → ')}, avec un rappel à l’heure qui vous convient.`}</Text>}>
        <View testID="bedtime-routine">
          <Card>
            <Field label="Heure du coucher" optional value={bedtime} onChangeText={setBedtime} placeholder="19:45" keyboardType="numbers-and-punctuation" maxLength={5} testID="routine-time" />
            {steps.map((s, i) => (
              <Row key={`${s}-${i}`} style={{ alignItems: 'center' }}>
                <Text style={{ flex: 1 }}>{`${i + 1}. ${s}`}</Text>
                <IconButton icon="arrow-up" label={`Monter « ${s} »`} onPress={() => i && setSteps((xs) => { const c = [...xs]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })} />
                <IconButton icon="x" label={`Retirer « ${s} »`} onPress={() => setSteps((xs) => xs.filter((_, j) => j !== i))} />
              </Row>
            ))}
            <Row wrap>{SUGGESTED.filter((s) => !steps.includes(s)).map((s) => <Chip key={s} label={`+ ${s}`} onPress={() => steps.length < 12 && setSteps([...steps, s])} />)}</Row>
            <Row style={{ alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field label="Autre étape" optional value={newStep} onChangeText={setNewStep} maxLength={40} /></View>
              <Button label="Ajouter" size="sm" variant="secondary" onPress={() => { if (newStep.trim() && steps.length < 12) { setSteps([...steps, newStep.trim()]); setNewStep(''); } }} />
            </Row>
            <Toggle label="Me rappeler la routine 15 min avant" value={remind} onChange={setRemind} />
            <Button label="Enregistrer la routine" onPress={saveRoutine} loading={saving} testID="routine-save" />
          </Card>
        </View>
      </PremiumSection>

      <SectionTitle title={`Repères pour l’âge de ${name}`} />
      <Card tone="soft">
        {ageTips(childAge(child.birth_date).months).map((x) => <Text key={x} variant="small">{`• ${x}`}</Text>)}
        <Button label="Articles sur le sommeil" size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/library', params: { cat: 'sommeil' } })} />
      </Card>
      <Banner tone="info">{'Chaque enfant dort à son rythme. Ces chiffres décrivent vos relevés ; ils ne promettent pas de nuits complètes et ne remplacent pas l’avis d’un professionnel.'}</Banner>
    </Screen>
  );
}
