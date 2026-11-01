/**
 * Ma contraception (méthode suivie, date de renouvellement) et rappels choisis par la personne :
 * pilule quotidienne, patch hebdomadaire, anneau, injection, renouvellement d'implant / DIU, ordonnance.
 * Données strictement personnelles (RLS propriétaire).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { JourneyReminders, PrivateBanner } from '@/components/Fertility';
import { ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useContraceptionMethods, useSaveContraceptionMethod } from '@/lib/data/hooks-fertility';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { AVOID_REMINDER_PRESETS, CONTRACEPTION_METHODS, methodTitle } from '@/content/fertility';
import type { ContraceptionMethod, ContraceptionMethodKind } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate } from '@/i18n';

const fd = (iso: string, withYear = true) => formatDate(`${iso}T00:00:00Z`, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });

const kinds = (): { value: ContraceptionMethodKind; label: string }[] => [
  ...CONTRACEPTION_METHODS.map((m) => ({ value: m.kind, label: m.title })),
  { value: 'other', label: tr('u7.contra.rem.other') },
];

interface Form { method: ContraceptionMethodKind; label: string; started: string; renewal: string; note: string; active: boolean }
const emptyForm = (): Form => ({ method: 'pill', label: '', started: toFrDate(todayISO()), renewal: '', note: '', active: true });

export default function ContraceptionRemindersScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const methodsQ = useContraceptionMethods();
  const { data: methods } = methodsQ;
  const [removing, setRemoving] = useState(false);
  const save = useSaveContraceptionMethod();
  const [editing, setEditing] = useState<ContraceptionMethod | 'new' | null>(null);
  const [f, setF] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = methods ?? [];
  const renewalDue = list.find((m) => m.active && m.renewal_due_on)?.renewal_due_on ?? null;
  const current = list.find((m) => m.active) ?? null;

  function open(m?: ContraceptionMethod) {
    setErrors({});
    setEditing(m ?? 'new');
    setF(m ? { method: m.method, label: m.label ?? '', started: toFrDate(m.started_on), renewal: toFrDate(m.renewal_due_on), note: m.note ?? '', active: m.active } : emptyForm());
  }

  function suggestRenewal(method: ContraceptionMethodKind, started: string) {
    const years = CONTRACEPTION_METHODS.find((m) => m.kind === method)?.renewalYears;
    const s = frToISO(started);
    return years && s ? toFrDate(addDays(s, Math.round(years * 365.25))) : '';
  }

  async function submit() {
    const e: Record<string, string> = {};
    const started = f.started.trim() ? frToISO(f.started) : null;
    const renewal = f.renewal.trim() ? frToISO(f.renewal) : null;
    if (f.started.trim() && !started) e.started = tr('u7.contra.rem.formatErr');
    if (f.renewal.trim() && !renewal) e.renewal = tr('u7.contra.rem.formatErr');
    if (started && renewal && renewal < started) e.renewal = tr('u7.contra.rem.renewalAfter');
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = { method: f.method, label: f.label.trim() || null, started_on: started, renewal_due_on: renewal, note: f.note.trim() || null, active: f.active };
    try {
      await save.mutateAsync({ id: editing && editing !== 'new' ? editing.id : undefined, row });
      toast(tr('u7.contra.rem.saved'));
      setEditing(null);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(m: ContraceptionMethod) {
    if (!(await confirm(tr('u7.contra.rem.delConfirm'), tr('u7.contra.rem.delBody'), tr('u7.contra.rem.delete')))) return;
    setRemoving(true);
    try {
      await backend.remove('contraception_methods', [eq('id', m.id)]);
      inv('contraception_methods');
      setEditing(null);
      toast(tr('u7.contra.rem.deleted'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setRemoving(false);
    }
  }

  const renewalHint = CONTRACEPTION_METHODS.find((m) => m.kind === f.method)?.renewalYears;
  return (
    <Screen back title={tr('u7.contra.rem.title')} subtitle={tr('u7.contra.rem.subtitle')}
      action={{ label: tr('u7.contra.index.addMethod'), icon: 'plus', onPress: () => open(), testID: 'contra-add-method' }}>
      <TodaySummary title={tr('u7.contra.index.myContra')} items={[
        { icon: 'shield', value: current ? current.label || methodTitle(current.method) : '—', label: tr('u7.contra.rem.currentMethod') },
        { icon: 'refresh-cw', value: renewalDue ? fd(renewalDue, false) : '—', label: tr('u7.contra.rem.renewal') },
      ]} />
      <PrivateBanner>{tr('u7.contra.rem.private')}</PrivateBanner>

      <SectionTitle title={tr('u7.contra.index.myContra')} />
      {methodsQ.isLoading && !methods ? <Skeleton rows={1} /> : methodsQ.isError && !methods ? (
        <ErrorView error={methodsQ.error} onRetry={() => void methodsQ.refetch()} title={tr('u7.contra.index.contraError')} />
      ) : (
      <Card>
        {list.map((m) => (
          <ListRow
            key={m.id}
            icon="shield"
            title={`${m.label || methodTitle(m.method)}${m.active ? '' : tr('u7.contra.rem.stopped')}`}
            subtitle={[m.started_on ? tr('u7.contra.index.since', { date: fd(m.started_on) }) : null, m.renewal_due_on ? tr('u7.contra.index.renewOn', { date: fd(m.renewal_due_on) }) : null].filter(Boolean).join(' · ') || undefined}
            onPress={() => open(m)}
          />
        ))}
        {!list.length ? <Text muted>{tr('u7.contra.rem.none')}</Text> : null}
      </Card>
      )}

      <SectionTitle title={tr('u7.contra.rem.myReminders')} />
      <JourneyReminders presets={AVOID_REMINDER_PRESETS} deepLink="/contraception" defaultDates={{ renewal: renewalDue ? addDays(renewalDue, -30) : null }} />
      <Text variant="caption" muted>{tr('u7.contra.rem.missedNote')}</Text>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? tr('u7.contra.rem.newMethod') : tr('u7.contra.index.myMethod')}>
        <Text variant="label">{tr('u7.contra.rem.method')}</Text>
        <Row wrap>
          {kinds().map((k) => (
            <Chip key={k.value} label={k.label} selected={f.method === k.value} onPress={() => setF((p) => ({ ...p, method: k.value, renewal: p.renewal || suggestRenewal(k.value, p.started) }))} />
          ))}
        </Row>
        <Field label={tr('u7.contra.rem.name')} optional value={f.label} onChangeText={(v) => setF((p) => ({ ...p, label: v }))} maxLength={80} />
        <Field label={tr('u7.contra.rem.start')} optional value={f.started} onChangeText={(v) => setF((p) => ({ ...p, started: v }))} error={errors.started} keyboardType="numbers-and-punctuation" placeholder={tr('u7.contra.rem.datePh')} />
        <Field
          label={tr('u7.contra.rem.renewalDate')}
          optional
          value={f.renewal}
          onChangeText={(v) => setF((p) => ({ ...p, renewal: v }))}
          error={errors.renewal}
          keyboardType="numbers-and-punctuation"
          placeholder={tr('u7.contra.rem.datePh')}
          hint={renewalHint ? tr('u7.contra.rem.hintYears') : tr('u7.contra.rem.hintOther')}
        />
        <Field label={tr('u7.contra.rem.note')} optional value={f.note} onChangeText={(v) => setF((p) => ({ ...p, note: v }))} maxLength={500} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="medium">{tr('u7.contra.rem.inUse')}</Text>
          <Toggle label={tr('u7.contra.rem.inUse')} value={f.active} onChange={(v) => setF((p) => ({ ...p, active: v }))} />
        </Row>
        <Button label={tr('u7.contra.rem.save')} loading={save.isPending} onPress={submit} />
        {editing && editing !== 'new' ? (
          <View><Button label={tr('u7.contra.rem.delete')} variant="ghost" icon="trash-2" loading={removing} onPress={() => remove(editing)} /></View>
        ) : null}
        <Text variant="caption" color={t.colors.textMuted}>{tr('u7.contra.rem.footer')}</Text>
      </Sheet>
    </Screen>
  );
}
