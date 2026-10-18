/**
 * Ma contraception (méthode suivie, date de renouvellement) et rappels choisis par la personne :
 * pilule quotidienne, patch hebdomadaire, anneau, injection, renouvellement d'implant / DIU, ordonnance.
 * Données strictement personnelles (RLS propriétaire).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { JourneyReminders, PrivateBanner } from '@/components/Fertility';
import { ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useContraceptionMethods, useSaveContraceptionMethod } from '@/lib/data/hooks-fertility';
import { addDays, formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { AVOID_REMINDER_PRESETS, CONTRACEPTION_METHODS, methodTitle } from '@/content/fertility';
import type { ContraceptionMethod, ContraceptionMethodKind } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const KINDS: { value: ContraceptionMethodKind; label: string }[] = [
  ...CONTRACEPTION_METHODS.map((m) => ({ value: m.kind, label: m.title })),
  { value: 'other', label: 'Autre' },
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
    if (f.started.trim() && !started) e.started = 'Format attendu : JJ/MM/AAAA.';
    if (f.renewal.trim() && !renewal) e.renewal = 'Format attendu : JJ/MM/AAAA.';
    if (started && renewal && renewal < started) e.renewal = 'La date de renouvellement doit suivre la date de début.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = { method: f.method, label: f.label.trim() || null, started_on: started, renewal_due_on: renewal, note: f.note.trim() || null, active: f.active };
    try {
      await save.mutateAsync({ id: editing && editing !== 'new' ? editing.id : undefined, row });
      toast('Contraception enregistrée.');
      setEditing(null);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(m: ContraceptionMethod) {
    if (!(await confirm('Supprimer cette méthode ?', 'Vos rappels existants ne sont pas supprimés.', 'Supprimer'))) return;
    setRemoving(true);
    try {
      await backend.remove('contraception_methods', [eq('id', m.id)]);
      inv('contraception_methods');
      setEditing(null);
      toast('Méthode supprimée.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setRemoving(false);
    }
  }

  const renewalHint = CONTRACEPTION_METHODS.find((m) => m.kind === f.method)?.renewalYears;
  return (
    <Screen back title="Ma méthode et mes rappels" subtitle="Vous choisissez vos rappels et ce qui s’affiche.">
      <PrivateBanner>Votre contraception n’est jamais partagée avec votre foyer ni votre coparent.</PrivateBanner>

      <SectionTitle title="Ma contraception" />
      {methodsQ.isLoading && !methods ? <Skeleton rows={1} /> : methodsQ.isError && !methods ? (
        <ErrorView error={methodsQ.error} onRetry={() => void methodsQ.refetch()} title="Impossible d’afficher votre contraception" />
      ) : (
      <Card>
        {list.map((m) => (
          <ListRow
            key={m.id}
            icon="shield"
            title={`${m.label || methodTitle(m.method)}${m.active ? '' : ' (arrêtée)'}`}
            subtitle={[m.started_on ? `Depuis le ${formatDateFr(m.started_on)}` : null, m.renewal_due_on ? `À renouveler le ${formatDateFr(m.renewal_due_on)}` : null].filter(Boolean).join(' · ') || undefined}
            onPress={() => open(m)}
          />
        ))}
        {!list.length ? <Text muted>Aucune méthode renseignée.</Text> : null}
        <Button label="Ajouter une méthode" icon="plus" variant="secondary" size="sm" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => open()} />
      </Card>
      )}

      <SectionTitle title="Mes rappels" />
      <JourneyReminders presets={AVOID_REMINDER_PRESETS} deepLink="/contraception" defaultDates={{ renewal: renewalDue ? addDays(renewalDue, -30) : null }} />
      <Text variant="caption" muted>En cas d’oubli ou de retard, suivez la notice de votre contraception et demandez conseil à un pharmacien ou à votre médecin : la contraception d’urgence peut être nécessaire.</Text>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle méthode' : 'Ma méthode'}>
        <Text variant="label">Méthode</Text>
        <Row wrap>
          {KINDS.map((k) => (
            <Chip key={k.value} label={k.label} selected={f.method === k.value} onPress={() => setF((p) => ({ ...p, method: k.value, renewal: p.renewal || suggestRenewal(k.value, p.started) }))} />
          ))}
        </Row>
        <Field label="Nom (marque, modèle)" optional value={f.label} onChangeText={(v) => setF((p) => ({ ...p, label: v }))} maxLength={80} />
        <Field label="Date de début" optional value={f.started} onChangeText={(v) => setF((p) => ({ ...p, started: v }))} error={errors.started} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" />
        <Field
          label="Date de renouvellement"
          optional
          value={f.renewal}
          onChangeText={(v) => setF((p) => ({ ...p, renewal: v }))}
          error={errors.renewal}
          keyboardType="numbers-and-punctuation"
          placeholder="JJ/MM/AAAA"
          hint={renewalHint ? 'Durée indicative selon le modèle : vérifiez la date indiquée par votre professionnel.' : 'Date de fin d’ordonnance, prochaine injection…'}
        />
        <Field label="Note" optional value={f.note} onChangeText={(v) => setF((p) => ({ ...p, note: v }))} maxLength={500} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="medium">Méthode utilisée actuellement</Text>
          <Toggle label="Méthode utilisée actuellement" value={f.active} onChange={(v) => setF((p) => ({ ...p, active: v }))} />
        </Row>
        <Button label="Enregistrer" loading={save.isPending} onPress={submit} />
        {editing && editing !== 'new' ? (
          <View><Button label="Supprimer" variant="ghost" icon="trash-2" loading={removing} onPress={() => remove(editing)} /></View>
        ) : null}
        <Text variant="caption" color={t.colors.textMuted}>Changer ou arrêter une méthode se discute avec un professionnel pour éviter une période sans protection.</Text>
      </Sheet>
    </Screen>
  );
}
