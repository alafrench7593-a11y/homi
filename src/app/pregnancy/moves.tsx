/**
 * Mouvements de bébé (script 38 « Il ne sent jamais les coups ») : noter ce que l'on sent, jour après jour, pour
 * apprendre à connaître son bébé et le montrer à la sage-femme. Aucun « compte à atteindre », aucune réassurance :
 * si le bébé bouge moins que d'habitude ou plus du tout, on appelle la maternité, de jour comme de nuit.
 * Les notes sont les mêmes que celles de « Comment je me sens » (symptôme « mouvements ») : rien n'est dupliqué.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { useActivePregnancy } from '@/lib/data/hooks';
import { useDeleteSymptom, usePregnancySymptoms, useSaveSymptoms } from '@/lib/data/hooks-care';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { callNumber } from '@/lib/links';
import { formatDate, formatTime, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Level = 1 | 2 | 3;
const LEVELS: { v: Level; key: 'less' | 'usual' | 'more' }[] = [{ v: 1, key: 'less' }, { v: 2, key: 'usual' }, { v: 3, key: 'more' }];

export default function PregnancyMoves() {
  const toast = useToast();
  const pregnancy = useActivePregnancy();
  const logsQ = usePregnancySymptoms(200);
  const save = useSaveSymptoms();
  const del = useDeleteSymptom();
  const [level, setLevel] = useState<Level | null>(null);
  const [note, setNote] = useState('');
  const week = pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null;
  const logs = useMemo(() => (logsQ.data ?? []).filter((l) => l.symptom === 'movements'), [logsQ.data]);
  const today = logs.filter((l) => new Date(l.logged_at).toDateString() === new Date().toDateString());

  async function add() {
    if (!level) return toast(tr('pm.pick'), 'info');
    try {
      await save.mutateAsync({ rows: [{ pregnancy_id: pregnancy?.id ?? null, symptom: 'movements', intensity: level, started_at: new Date().toISOString(), frequency: null, note: note.trim() || null, week_sa: week }] });
      setNote(''); setLevel(null);
      toast(tr('pm.saved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.preg_moves')} subtitle={week != null ? tr('pm.week', { week }) : undefined}
      action={{ label: tr('pm.add'), icon: 'plus', onPress: () => void add(), testID: 'moves-save', disabled: save.isPending }}>
      <Banner tone="warning" icon="phone" action={<Button label={tr('pm.callMaternity')} icon="phone" variant="secondary" onPress={() => router.push('/emergency')} />}>
        {tr('pm.safety')}
      </Banner>
      <TodaySummary title={tr('pm.today')} items={[
        { icon: 'activity', value: String(today.length), label: tr('pm.todayCount') },
        { icon: 'clock', value: logs[0] ? formatTime(logs[0].logged_at) : '—', label: tr('pm.last') },
      ]} />
      <Card>
        <Text weight="bold">{tr('pm.how')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
          {LEVELS.map((l) => <Chip key={l.v} label={tr(`pm.level.${l.key}`)} selected={level === l.v} onPress={() => setLevel(l.v)} testID={`moves-level-${l.key}`} />)}
        </View>
        <Field label={tr('pm.note')} optional value={note} onChangeText={setNote} maxLength={300} placeholder={tr('pm.notePh')} />
        {level === 1 && <Banner tone="danger" icon="phone">{tr('pm.lessWarning')}</Banner>}
      </Card>
      <Text variant="caption" muted>{tr('pm.hint')}</Text>
      <SectionTitle title={tr('pm.history')} />
      {!logs.length ? <EmptyState icon="activity" title={tr('pm.none')} body={tr('pm.noneD')} /> : (
        <Card padded={false}>
          {logs.slice(0, 60).map((l) => (
            <ListRow key={l.id} icon="activity" title={tr(`pm.level.${LEVELS.find((x) => x.v === l.intensity)?.key ?? 'usual'}`)}
              subtitle={`${formatDate(l.logged_at, { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTime(l.logged_at)}${l.note ? ` · ${l.note}` : ''}`}
              onPress={async () => { if (await confirm(tr('common.delete'), tr('pm.deleteQ'), tr('common.delete'))) await del.mutateAsync(l.id).catch((e) => toast(friendlyError(e), 'error')); }} />
          ))}
        </Card>
      )}
      <Button label={tr('pm.call15')} icon="phone" variant="secondary" onPress={() => callNumber('15', toast)} />
    </Screen>
  );
}
