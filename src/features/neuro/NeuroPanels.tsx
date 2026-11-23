/**
 * Profil sensoriel et journal de situations (module Neuro, 23/11/2026).
 * Réutilise `child_need_entries` via useAddNeedEntry / useNeedEntries : aucune table nouvelle.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Row, SectionTitle, Text } from '@/components/ui';
import { useAddNeedEntry, useNeedEntries } from '@/lib/data/hooks-needs';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO, formatDateFr } from '@/lib/domain/dates';
import {
  encodeSensory, encodeSituation, latestSensory, SENSE_LEVELS, SENSES, sensoryLines, situationValid, whatHelps,
  type Sense, type SenseLevel, type SensoryProfile, type Situation,
} from '@/lib/neuro/structured';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const senseLabel = (s: Sense) => tr(`nds.sense.${s}` as TKey);
const levelLabel = (l: SenseLevel) => tr(`nds.level.${l}` as TKey);

/** Profil sensoriel : 7 sens × évite / recherche / sans souci, + ce qui apaise / à éviter. Imprimable. */
export function SensoryProfileCard({ childId }: { childId: string }) {
  const toast = useToast();
  const { data: entries } = useNeedEntries(childId, 'observation');
  const current = useMemo(() => latestSensory(entries), [entries]);
  const add = useAddNeedEntry();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SensoryProfile>({ levels: {}, calms: '', avoid: '' });

  const lines = current ? sensoryLines(current.profile, senseLabel, levelLabel, tr('nds.calms'), tr('nds.avoid')) : [];
  const edit = () => { setDraft(current?.profile ?? { levels: {}, calms: '', avoid: '' }); setOpen(true); };
  const save = async () => {
    try {
      // Nouvelle version datée : l'historique montre l'évolution du profil
      await add.mutateAsync({ child_id: childId, kind: 'observation', title: tr('nds.sensory.title'), body: encodeSensory(draft), occurred_on: todayISO() });
      setOpen(false); toast(tr('nd.saved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  };
  const print = () => router.push(`/print?kind=checklist&title=${encodeURIComponent(tr('nds.sensory.printTitle'))}&lines=${encodeURIComponent(lines.join('\n'))}` as never);

  return (
    <View style={{ gap: spacing.sm }} testID="sensory-card">
      <SectionTitle title={tr('nds.sensory.title')} />
      <Card>
        {current ? (
          <View style={{ gap: 4 }}>
            {lines.length ? lines.map((l) => <Text key={l}>{l}</Text>) : <Text muted>{tr('nds.sensory.allOk')}</Text>}
            <Text variant="caption" muted>{tr('nds.sensory.updated', { date: formatDateFr(current.entry.occurred_on) })}</Text>
          </View>
        ) : <Text muted>{tr('nds.sensory.intro')}</Text>}
        <Row wrap>
          <Button label={current ? tr('nds.sensory.edit') : tr('nds.sensory.start')} icon="edit-2" size="sm" onPress={edit} testID="sensory-edit" />
          {lines.length ? <Button label={tr('nds.print')} icon="printer" variant="secondary" size="sm" onPress={print} testID="sensory-print" /> : null}
        </Row>
      </Card>
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('nds.sensory.title')}>
        <Text variant="caption" muted>{tr('nds.sensory.hint')}</Text>
        {SENSES.map((s) => (
          <View key={s} style={{ gap: 4 }}>
            <Text>{senseLabel(s)}</Text>
            <Row wrap>{SENSE_LEVELS.map((l) => (
              <Chip key={l} label={levelLabel(l)} selected={draft.levels[s] === l} testID={`sense-${s}-${l}`}
                onPress={() => { haptic('selection'); setDraft((d) => ({ ...d, levels: { ...d.levels, [s]: d.levels[s] === l ? undefined : l } })); }} />
            ))}</Row>
          </View>
        ))}
        <Field label={tr('nds.calms')} optional value={draft.calms} onChangeText={(v) => setDraft((d) => ({ ...d, calms: v }))} maxLength={300} placeholder={tr('nds.calmsPh')} testID="sensory-calms" />
        <Field label={tr('nds.avoid')} optional value={draft.avoid} onChangeText={(v) => setDraft((d) => ({ ...d, avoid: v }))} maxLength={300} testID="sensory-avoid" />
        <Button label={tr('common.save')} loading={add.isPending} onPress={() => void save()} testID="sensory-save" />
      </Sheet>
    </View>
  );
}

const EMPTY: Situation = { before: '', during: '', after: '', helped: '', intensity: null };

/** Journal de situations (avant / pendant / après / ce qui a aidé) : factuel, sans jugement ni interprétation. */
export function SituationJournal({ childId }: { childId: string }) {
  const toast = useToast();
  const { data: entries } = useNeedEntries(childId, 'observation');
  const helps = useMemo(() => whatHelps(entries), [entries]);
  const add = useAddNeedEntry();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Situation>(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof Situation) => (v: string) => setS((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (!situationValid(s)) { setErr(tr('nds.sit.err')); return; }
    try {
      const title = (s.during.trim().slice(0, 100) || tr('nds.sit.title'));
      await add.mutateAsync({ child_id: childId, kind: 'observation', title: `${tr('nds.sit.prefix')} · ${title}`.slice(0, 120), body: encodeSituation(s), occurred_on: todayISO() });
      setOpen(false); setS(EMPTY); setErr(null); toast(tr('nd.saved'), 'success');
    } catch (e) { setErr(friendlyError(e)); }
  };

  return (
    <View style={{ gap: spacing.sm }} testID="situation-journal">
      <Button label={tr('nds.sit.add')} icon="plus-circle" variant="secondary" onPress={() => setOpen(true)} testID="situation-add" />
      {helps.length ? <Banner tone="info">{tr('nds.sit.helps', { list: helps.join(', ') })}</Banner> : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('nds.sit.title')}>
        {err ? <Banner tone="danger">{err}</Banner> : null}
        <Text variant="caption" muted>{tr('nds.sit.hint')}</Text>
        <Field label={tr('nds.sit.before')} optional value={s.before} onChangeText={set('before')} maxLength={300} placeholder={tr('nds.sit.beforePh')} testID="sit-before" />
        <Field label={tr('nds.sit.during')} value={s.during} onChangeText={set('during')} maxLength={300} multiline testID="sit-during" />
        <Field label={tr('nds.sit.after')} optional value={s.after} onChangeText={set('after')} maxLength={300} testID="sit-after" />
        <Field label={tr('nds.sit.helped')} optional value={s.helped} onChangeText={set('helped')} maxLength={300} placeholder={tr('nds.sit.helpedPh')} testID="sit-helped" />
        <Text>{tr('nds.sit.intensity')}</Text>
        <Row wrap>{[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} label={String(n)} selected={s.intensity === n} testID={`sit-int-${n}`} onPress={() => setS((x) => ({ ...x, intensity: x.intensity === n ? null : n }))} />
        ))}</Row>
        <Button label={tr('common.save')} loading={add.isPending} onPress={() => void save()} testID="sit-save" />
      </Sheet>
    </View>
  );
}
