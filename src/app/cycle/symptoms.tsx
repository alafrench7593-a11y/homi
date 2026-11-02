/**
 * Symptômes et bien-être d'un jour (aujourd'hui ou un jour passé) : symptômes avec intensité, humeur, énergie,
 * sommeil, stress, note. La saisie d'un jour complète la fiche existante de ce jour (pas de doublon), modifiable et supprimable.
 * Libido : seulement si le suivi de la sexualité est activé dans la confidentialité du cycle.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Button, Field, haptic, Row } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { removeOwn, saveOwn, useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { INTIMATE_SYMPTOMS, SYMPTOM_KEYS, symptomKeysOf, type SymptomKey } from '@/lib/domain/cycleV2';
import { toFrDate } from '@/lib/validation';
import { Choices, Glass, Ink, Rise, Scale, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function SymptomsScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const params = useLocalSearchParams<{ date?: string }>();
  const { prefs } = useCyclePreferences();
  const logsQ = useAllSymptomLogs();
  const [dateText, setDateText] = useState(toFrDate(params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO()));
  const iso = frToISO(dateText);
  const existing = useMemo(() => (iso ? (logsQ.data ?? []).filter((l) => l.logged_on === iso) : []), [logsQ.data, iso]);
  const [keys, setKeys] = useState<SymptomKey[]>([]);
  const [intensity, setIntensity] = useState<Record<string, number>>({});
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Charger la fiche du jour choisi (la plus récente si plusieurs anciennes saisies)
  const current = existing[0] ?? null;
  useEffect(() => {
    setKeys(current ? symptomKeysOf(current) : []);
    setIntensity((current?.intensities as Record<string, number>) ?? {});
    setMood(current?.mood ?? null); setEnergy(current?.energy ?? null); setSleep(current?.sleep ?? null); setStress(current?.stress ?? null);
    setNote(current?.note ?? '');
  }, [current?.id, iso]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = SYMPTOM_KEYS.filter((k) => prefs.track_intercourse || !INTIMATE_SYMPTOMS.includes(k));

  async function save() {
    if (!iso || iso > todayISO()) return setErr(tr('cy.err.dateNotFuture'));
    setErr(null);
    if (!keys.length && mood == null && energy == null && sleep == null && stress == null && !note.trim()) return setErr(tr('cy.sym.empty'));
    setBusy(true);
    try {
      const cleanIntensity = Object.fromEntries(Object.entries(intensity).filter(([k, v]) => keys.includes(k as SymptomKey) && v >= 1 && v <= 3));
      // Les anciennes saisies du même jour sont fusionnées dans une seule fiche
      const row = { logged_on: iso, symptom_keys: keys, symptoms: [], intensities: cleanIntensity, mood, energy, sleep, stress, note: note.trim() || null };
      await saveOwn('symptom_logs', current ? row : { user_id: userId, ...row }, current?.id);
      for (const extra of existing.slice(1)) await removeOwn('symptom_logs', extra.id);
      inv('symptom_logs');
      haptic('success');
      toast(tr('cy.sym.saved', { date: fmtDay(iso) }));
      router.back();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!current || !(await confirm(tr('cy.delete.title', { what: tr('cy.what.symptoms') }), tr('cy.delete.body'), tr('common.delete')))) return;
    try { for (const l of existing) await removeOwn('symptom_logs', l.id); inv('symptom_logs'); toast(tr('cy.deleted')); router.back(); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('cy.sym.title')} subtitle={tr('cy.sym.subtitle')}
      action={{ label: tr('common.save'), icon: 'check', onPress: () => save(), disabled: busy, testID: 'sym-save' }}>
      {/* La fiche du jour, en un coup d'œil (se met à jour pendant la saisie) */}
      <TodaySummary title={iso ? fmtDay(iso) : tr('cy.sym.date')} items={[
        { icon: 'activity', value: String(keys.length), label: tr('cy.sym.list') },
        { icon: 'smile', value: mood ? `${mood}/5` : '—', label: tr('cy.sym.mood') },
        { icon: 'zap', value: energy ? `${energy}/5` : '—', label: tr('cy.sym.energy') },
      ]} />
      <Rise>
        <Glass>
          <Field label={tr('cy.sym.date')} value={dateText} onChangeText={setDateText} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} error={err ?? undefined} />
          {current ? <Ink variant="caption" soft>{tr('cy.sym.editing')}</Ink> : null}
        </Glass>
      </Rise>
      <Rise delay={50}>
        <Glass>
          <Choices label={tr('cy.sym.list')} options={options} value={keys} multi onChange={(v) => setKeys((v as SymptomKey[]) ?? [])} labelOf={(k) => tr(`cy.sym.${k}` as 'cy.sym.cramps')} />
          <Button label={tr('cy.sym.toPain')} variant="ghost" icon="activity" onPress={() => router.push(`/cycle/pain?date=${iso ?? ''}` as never)} full />
          {keys.length ? <Ink variant="caption" soft>{tr('cy.sym.intensityHint')}</Ink> : null}
          {keys.map((k) => (
            <View key={k} style={{ gap: 4 }}>
              <Ink variant="small" weight="medium">{tr(`cy.sym.${k}` as 'cy.sym.cramps')}</Ink>
              <Row gap={6}>
                {[1, 2, 3].map((n) => (
                  <Button key={n} label={tr(`cy.sym.int${n}` as 'cy.sym.int1')} size="sm" variant={intensity[k] === n ? 'primary' : 'secondary'}
                    onPress={() => setIntensity((m) => ({ ...m, [k]: m[k] === n ? 0 : n }))} style={{ flexGrow: 1 }} />
                ))}
              </Row>
            </View>
          ))}
        </Glass>
      </Rise>
      <Rise delay={100}>
        <Glass>
          <Scale label={tr('cy.sym.mood')} value={mood} onChange={setMood} low={tr('cy.scale.low')} high={tr('cy.scale.high')} />
          <Scale label={tr('cy.sym.energy')} value={energy} onChange={setEnergy} low={tr('cy.scale.low')} high={tr('cy.scale.high')} />
          <Scale label={tr('cy.sym.sleep')} value={sleep} onChange={setSleep} low={tr('cy.scale.poor')} high={tr('cy.scale.good')} />
          <Scale label={tr('cy.sym.stress')} value={stress} onChange={setStress} low={tr('cy.scale.calm')} high={tr('cy.scale.tense')} />
        </Glass>
      </Rise>
      <Glass>
        <Field label={tr('cy.sym.note')} optional value={note} onChangeText={setNote} multiline maxLength={2000} style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <Ink variant="caption" soft>{tr('cy.private')}</Ink>
      </Glass>
      {current ? <Button label={tr('cy.sym.delete')} variant="ghost" onPress={remove} full /> : null}
      <View style={{ padding: spacing.sm, borderRadius: 14, backgroundColor: c.powder }}><Ink variant="caption">{tr('cy.sym.notDiagnosis')}</Ink></View>
    </Screen>
  );
}
