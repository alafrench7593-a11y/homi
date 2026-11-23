/**
 * HOMI Print Studio — supports imprimables pour l'enfant, préparés et validés par le parent (aucun écran, aucun compte
 * enfant) : routine visuelle, Maintenant / Ensuite, cartes de communication, histoire sociale, checklist. A4 ou compact.
 * Paramètres : `kind` (routine|nownext|cards|story|checklist), `routine` (id), `title`, `lines` (une ligne par étape).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Button, Chip, Field, Segmented, Text } from '@/components/ui';
import { useKidRoutines } from '@/lib/data/hooks-tools6';
import { useTrackedChildren } from '@/lib/data/hooks';
import { cardsSheet, checklistSheet, ESSENTIAL_CARDS, nowNextSheet, routineSheet, storySheet, type PrintFormat } from '@/lib/print/templates';
import { printSheet } from '@/lib/print/printSheet';
import { getLocale, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Kind = 'routine' | 'nownext' | 'cards' | 'story' | 'checklist';
const KINDS: Kind[] = ['routine', 'nownext', 'cards', 'story', 'checklist'];
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export default function PrintStudio() {
  const p = useLocalSearchParams<{ kind?: string; routine?: string; title?: string; lines?: string }>();
  const toast = useToast();
  const [kind, setKind] = useState<Kind>(KINDS.includes(p.kind as Kind) ? (p.kind as Kind) : 'routine');
  const [format, setFormat] = useState<PrintFormat>('a4');
  const routines = useKidRoutines();
  const { data: children } = useTrackedChildren();
  const [routineId, setRoutineId] = useState<string | null>(typeof p.routine === 'string' ? p.routine : null);
  const [now, setNow] = useState(''); const [next, setNext] = useState('');
  const [picked, setPicked] = useState<string[]>(ESSENTIAL_CARDS.slice(0, 8).map((c) => c.key));
  const [extra, setExtra] = useState('');
  const [title, setTitle] = useState(typeof p.title === 'string' ? p.title.slice(0, 80) : '');
  const [body, setBody] = useState(typeof p.lines === 'string' ? p.lines.slice(0, 4000) : '');
  const [busy, setBusy] = useState(false);
  const lang = getLocale();
  const list = (routines.data ?? []).filter((r) => r.active !== false);
  const routine = list.find((r) => r.id === routineId) ?? (list.length === 1 ? list[0] : null);

  const html = useMemo((): string | null => {
    if (kind === 'routine') {
      if (!routine) return null;
      const child = children?.find((c) => c.id === routine.child_id)?.first_name ?? null;
      return routineSheet({ title: routine.title, childName: child, steps: routine.steps, format, lang });
    }
    if (kind === 'nownext') return now.trim() && next.trim() ? nowNextSheet({ now: { label: now }, next: { label: next }, labels: { now: tr('pst.now'), next: tr('pst.next') }, format, lang }) : null;
    if (kind === 'cards') {
      const cards = [...ESSENTIAL_CARDS.filter((c) => picked.includes(c.key)).map((c) => ({ icon: c.icon, label: tr(`pst.card.${c.key}` as TKey) })), ...lines(extra).map((label) => ({ label }))];
      return cards.length ? cardsSheet({ title: title.trim() || tr('pst.cardsTitle'), cards, format, lang }) : null;
    }
    if (kind === 'story') return title.trim() && lines(body).length ? storySheet({ title, pages: lines(body).map((label) => ({ label })), format, lang }) : null;
    return title.trim() && lines(body).length ? checklistSheet({ title, items: lines(body), format, lang }) : null;
  }, [kind, routine, children, format, lang, now, next, picked, extra, title, body]);

  async function print() {
    if (!html || busy) return;
    setBusy(true);
    try { await printSheet(html); } catch { toast(tr('pst.failed'), 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('pst.title')} subtitle={tr('pst.sub')}>
      <Segmented label={tr('pst.kind')} value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k, label: tr(`pst.k.${k}` as TKey), testID: `ps-kind-${k}` }))} />
      <Text variant="small" muted>{tr(`pst.k.${kind}.hint` as TKey)}</Text>

      {kind === 'routine' ? (
        list.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {list.map((r) => <Chip key={r.id} label={r.title} selected={routine?.id === r.id} onPress={() => setRoutineId(r.id)} testID={`ps-routine-${r.id}`} />)}
          </View>
        ) : <Text variant="small" testID="ps-no-routine">{tr('pst.noRoutine')}</Text>
      ) : null}

      {kind === 'nownext' ? (
        <>
          <Field label={tr('pst.now')} value={now} onChangeText={setNow} maxLength={60} placeholder={tr('pst.nowPh')} testID="ps-now" />
          <Field label={tr('pst.next')} value={next} onChangeText={setNext} maxLength={60} placeholder={tr('pst.nextPh')} testID="ps-next" />
        </>
      ) : null}

      {kind === 'cards' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {ESSENTIAL_CARDS.map((c) => (
              <Chip key={c.key} label={`${c.icon} ${tr(`pst.card.${c.key}` as TKey)}`} selected={picked.includes(c.key)}
                onPress={() => setPicked((x) => (x.includes(c.key) ? x.filter((y) => y !== c.key) : [...x, c.key]))} testID={`ps-card-${c.key}`} />
            ))}
          </View>
          <Field label={tr('pst.extraCards')} optional value={extra} onChangeText={setExtra} multiline maxLength={600} placeholder={tr('pst.extraPh')} testID="ps-extra" />
        </>
      ) : null}

      {kind === 'story' || kind === 'checklist' || kind === 'cards' ? (
        <Field label={tr('pst.titleField')} optional={kind === 'cards'} value={title} onChangeText={setTitle} maxLength={80} placeholder={tr(`pst.${kind}.titlePh` as TKey)} testID="ps-title" />
      ) : null}
      {kind === 'story' || kind === 'checklist' ? (
        <Field label={tr(kind === 'story' ? 'pst.storyLines' : 'pst.checkLines')} value={body} onChangeText={setBody} multiline maxLength={4000}
          placeholder={tr(`pst.${kind}.linesPh` as TKey)} hint={tr('pst.oneLine')} testID="ps-lines" />
      ) : null}

      <Segmented label={tr('pst.format')} value={format} onChange={setFormat} options={[{ value: 'a4', label: 'A4', testID: 'ps-a4' }, { value: 'compact', label: tr('pst.compact'), testID: 'ps-compact' }]} />
      <Button label={tr('pst.print')} icon="printer" full loading={busy} disabled={!html} onPress={() => void print()} testID="ps-print" />
      {!html ? <Text variant="caption" muted center testID="ps-missing">{tr('pst.missing')}</Text> : null}
      <Text variant="caption" muted center>{tr('pst.noScreen')}</Text>
    </Screen>
  );
}
