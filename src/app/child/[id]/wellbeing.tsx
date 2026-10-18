/**
 * Humeur et bien-être de l'enfant : un journal descriptif (pleurs, énergie, appétit, sommeil,
 * confort digestif, événements inhabituels). Aucune conclusion médicale à partir d'un comportement.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, haptic, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, useRows } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { WELLBEING_SCALES } from '@/lib/domain/childCare';
import { insertOrQueue } from '@/lib/offline';
import { spacing } from '@/theme/tokens';

type Scales = Partial<Record<(typeof WELLBEING_SCALES)[number]['key'], 1 | 2 | 3>>;
interface Entry { id: string; at: string; mood: number | null; unusual_event: string | null; note: string | null; crying: number | null; irritability: number | null; energy: number | null; appetite: number | null; sleep: number | null; digestive_comfort: number | null }
const MOODS = ['Très difficile', 'Difficile', 'Entre les deux', 'Plutôt bien', 'Très bien'];

export default function ChildWellbeing() {
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const q = useRows<Entry>(['child_wellbeing', id ?? ''], id ? { table: 'child_wellbeing', filters: [eq('child_id', id)], order: [{ col: 'at', asc: false }], limit: 60 } : null);
  const [mood, setMood] = useState<number | null>(null);
  const [scales, setScales] = useState<Scales>({});
  const [unusual, setUnusual] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!child) return;
    if (!mood && !Object.keys(scales).length && !unusual.trim() && !note.trim()) return toast('Notez au moins une chose.', 'error');
    setSaving(true);
    try {
      await insertOrQueue('child_wellbeing', { child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), mood, ...scales, unusual_event: unusual.trim() || null, note: note.trim() || null });
      inv('child_wellbeing');
      haptic('success');
      toast('Noté.');
      setMood(null); setScales({}); setUnusual(''); setNote('');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }
  async function remove(e: Entry) {
    if (!(await confirm('Supprimer cette note ?', new Date(e.at).toLocaleString('fr-FR'), 'Supprimer'))) return;
    try { await backend.remove('child_wellbeing', [eq('id', e.id)]); inv('child_wellbeing'); toast('Supprimé.'); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  const describe = (e: Entry) => [e.mood ? MOODS[e.mood - 1] : null, ...WELLBEING_SCALES.map((s) => (e[s.key] ? `${s.label} : ${s.levels[(e[s.key] as number) - 1].toLowerCase()}` : null)), e.unusual_event].filter(Boolean).join(' · ');

  return (
    <Screen back title="Humeur et bien-être" subtitle={child ? `${child.first_name} — un journal, pas un bilan` : undefined}>
      <Card>
        <Text weight="bold">Aujourd’hui, plutôt…</Text>
        <Row wrap style={{ marginTop: spacing.xs }}>{MOODS.map((m, i) => <Chip key={m} label={m} selected={mood === i + 1} onPress={() => setMood(mood === i + 1 ? null : i + 1)} />)}</Row>
      </Card>
      <Card>
        <View style={{ gap: spacing.sm }}>
          {WELLBEING_SCALES.map((s) => (
            <View key={s.key} style={{ gap: 4 }}>
              <Text weight="medium">{s.label}</Text>
              <Row wrap>{s.levels.map((l, i) => <Chip key={l} label={l} selected={scales[s.key] === i + 1} onPress={() => setScales((c) => ({ ...c, [s.key]: c[s.key] === i + 1 ? undefined : ((i + 1) as 1 | 2 | 3) }))} />)}</Row>
            </View>
          ))}
          <Field label="Événement inhabituel" optional value={unusual} onChangeText={setUnusual} maxLength={300} placeholder="Première journée à la crèche, vaccin, visite…" />
          <Field label="Note" optional multiline value={note} onChangeText={setNote} maxLength={2000} />
          <Button label="Enregistrer" onPress={save} loading={saving} />
        </View>
      </Card>
      <Text variant="caption" muted>Un comportement isolé ne veut rien dire à lui seul. Si quelque chose vous inquiète ou dure, parlez-en à votre médecin.</Text>

      <SectionTitle title="Notes précédentes" />
      {q.isLoading && !q.data ? <Skeleton rows={2} /> : null}
      {q.data && !q.data.length ? <EmptyState icon="smile" title="Rien de noté pour l’instant" /> : null}
      {(q.data ?? []).map((e, i) => (
        <StaggerItem key={e.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="smile" title={new Date(e.at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} subtitle={[describe(e), e.note].filter(Boolean).join(' — ')} right={<Button label="Supprimer" size="sm" variant="ghost" onPress={() => remove(e)} />} />
          </Card>
        </StaggerItem>
      ))}
    </Screen>
  );
}
