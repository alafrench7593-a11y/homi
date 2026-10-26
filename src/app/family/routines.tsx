/**
 * Routines : listes d'étapes réutilisables (sac, coucher, lendemain, courses…).
 * « Lancer » montre d'abord les tâches qui seront créées ; rien n'est créé sans validation.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { parseFrDateTime } from '@/features/familyLoad';
import { useBatchTasks, useDeleteRoutine, usePeople, useRoutines, useSaveRoutine } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { ROUTINE_TEMPLATES, routinePreview, type Routine } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

type Draft = { id?: string; title: string; kind: Routine['kind']; items: string; assignee: string | null };

export default function Routines() {
  const toast = useToast();
  const q = useRoutines();
  const save = useSaveRoutine();
  const del = useDeleteRoutine();
  const batch = useBatchTasks();
  const { people, labelOf } = usePeople();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [launch, setLaunch] = useState<Routine | null>(null);
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [time, setTime] = useState('18h');

  async function submit() {
    if (!draft) return;
    const items = draft.items.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 30);
    if (!draft.title.trim() || !items.length) return toast('Un titre et au moins une étape.', 'error');
    try {
      await save.mutateAsync({ id: draft.id, input: { title: draft.title.trim().slice(0, 80), kind: draft.kind, items, default_assignee: draft.assignee } });
      toast(draft.id ? 'Routine modifiée.' : 'Routine créée.');
      setDraft(null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function remove(r: Routine) {
    if (!(await confirm('Supprimer cette routine ?', r.title, 'Supprimer'))) return;
    try { await del.mutateAsync(r.id); toast('Routine supprimée.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const due = parseFrDateTime(date, time);
  const preview = launch ? routinePreview(launch, due ?? null) : [];

  async function run() {
    if (!launch || due === undefined) return toast('Date ou heure non reconnue.', 'error');
    try {
      await batch.mutateAsync({ create: preview.map((p) => ({ ...p, routine_id: launch.id })) });
      toast(`${preview.length} tâche${preview.length > 1 ? 's' : ''} ajoutée${preview.length > 1 ? 's' : ''}.`);
      setLaunch(null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const list = q.data ?? [];
  return (
    <Screen back title="Routines" subtitle="Ce qui revient souvent, préparé une fois pour toutes."
      action={{ label: 'Nouvelle routine', icon: 'plus', onPress: () => setDraft({ title: '', kind: 'custom', items: '', assignee: null }), testID: 'routines-new' }}>
      {q.data ? (
        <TodaySummary title="Mes routines" items={[
          { icon: 'list', value: String(list.length), label: list.length > 1 ? 'Routines' : 'Routine' },
          { icon: 'check-square', value: String(list.reduce((n, r) => n + r.items.length, 0)), label: 'Étapes préparées' },
          { icon: 'user-check', value: String(list.filter((r) => r.default_assignee).length), label: 'Déjà confiées' },
        ]} />
      ) : null}
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.data && !list.length ? <EmptyState icon="list" title="Aucune routine" body="Partez d’un modèle ci-dessous, puis adaptez-le." /> : null}
      {list.map((r, i) => (
        <StaggerItem key={r.id} index={i}>
          <Card>
            <ListRow icon="list" title={r.title} subtitle={`${r.items.length} étape${r.items.length > 1 ? 's' : ''}${r.default_assignee ? ` · ${labelOf(r.default_assignee)}` : ''}`} onPress={() => setDraft({ id: r.id, title: r.title, kind: r.kind, items: r.items.join('\n'), assignee: r.default_assignee })} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label="Lancer" size="sm" icon="play" onPress={() => setLaunch(r)} />
              <Button label="Supprimer" size="sm" variant="ghost" onPress={() => remove(r)} />
            </Row>
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title="Modèles" />
      <Row wrap>
        {ROUTINE_TEMPLATES.map((m) => <Chip key={m.kind} label={m.title} icon="plus" onPress={() => setDraft({ title: m.title, kind: m.kind, items: m.items.join('\n'), assignee: null })} />)}
        <Chip label="Routine vide" icon="plus" onPress={() => setDraft({ title: '', kind: 'custom', items: '', assignee: null })} />
      </Row>

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Modifier la routine' : 'Nouvelle routine'}>
        {draft ? (
          <View style={{ gap: spacing.sm }}>
            <Field label="Titre" value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} maxLength={80} />
            <Field label="Étapes" hint="Une par ligne (30 au plus)." multiline value={draft.items} onChangeText={(v) => setDraft({ ...draft, items: v })} style={{ minHeight: 140, textAlignVertical: 'top' }} />
            <Text variant="label">Confiée par défaut à</Text>
            <Row wrap>
              <Chip label="Personne" selected={!draft.assignee} onPress={() => setDraft({ ...draft, assignee: null })} />
              {people.map((p) => <Chip key={p.id} label={p.label} selected={draft.assignee === p.id} onPress={() => setDraft({ ...draft, assignee: p.id })} />)}
            </Row>
            <Button label="Enregistrer" full onPress={submit} loading={save.isPending} />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={!!launch} onClose={() => setLaunch(null)} title={launch ? `Lancer « ${launch.title} »` : ''}>
        {launch ? (
          <View style={{ gap: spacing.sm }}>
            <Row>
              <View style={{ flex: 3 }}><Field label="Pour le" value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
              <View style={{ flex: 2 }}><Field label="Heure" value={time} onChangeText={setTime} placeholder="18h" /></View>
            </Row>
            <Text variant="label">Ces tâches vont être ajoutées</Text>
            <Card tone="soft">{preview.map((p) => <ListRow key={p.title} icon="check-square" title={p.title} subtitle={labelOf(p.assignee_id)} />)}</Card>
            <Button label="Valider et ajouter" icon="check" full onPress={run} loading={batch.isPending} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
