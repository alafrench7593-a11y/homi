/**
 * « Vider ma tête » : on écrit en vrac tout ce qu'on a en tête ; l'application propose un rangement (tâche,
 * rendez-vous, course, papier) et la personne qui porte ce domaine, avec la date si elle est écrite. Rien n'est
 * enregistré sans validation ; chaque élément reste modifiable. Rangement local (aucune IA en ligne, rien n'est envoyé).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, Row, Text } from '@/components/ui';
import { usePeople, useSaveEvent, useBatchTasks } from '@/lib/data/hooks-family-load';
import { useDomains } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { parseBrainDump, taskCategoryOf, type DumpItem, type DumpKind } from '@/lib/domain/mentalLoad';
import { todayISO } from '@/lib/domain/dates';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const KINDS: DumpKind[] = ['task', 'appointment', 'event', 'shopping', 'admin'];
type Row = DumpItem & { assignee: string | null; keep: boolean };

export default function BrainDump() {
  const toast = useToast();
  const { people, labelOf, me } = usePeople();
  const domains = useDomains().data ?? [];
  const batch = useBatchTasks();
  const saveEvent = useSaveEvent();
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const ownerOf = useMemo(() => new Map(domains.map((d) => [d.key, d.owner_id])), [domains]);

  function sort() {
    const items = parseBrainDump(text, todayISO());
    if (!items.length) return toast(tr('cm.dump.empty'), 'info');
    setRows(items.map((i) => ({ ...i, assignee: (i.domain && ownerOf.get(i.domain)) || me || null, keep: true })));
  }
  const patch = (i: number, p: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function save() {
    const kept = rows.filter((r) => r.keep);
    if (!kept.length) return;
    setBusy(true);
    try {
      const tasks = kept.filter((r) => r.kind !== 'event').map((r) => ({
        title: r.text.slice(0, 120), category: taskCategoryOf(r) as never, assignee_id: r.assignee,
        due_at: r.date ? new Date(`${r.date}T${r.time ?? '18:00'}:00`).toISOString() : null, priority: 'normal' as const, essential: false, recurrence: null, notes: null,
      }));
      if (tasks.length) await batch.mutateAsync({ create: tasks });
      for (const e of kept.filter((r) => r.kind === 'event')) {
        const day = e.date ?? todayISO();
        await saveEvent.mutateAsync({ input: { title: e.text.slice(0, 120), kind: 'custom', starts_at: new Date(`${day}T${e.time ?? '09:00'}:00`).toISOString(), ends_at: null, all_day: !e.time, location_label: null, notes: null, recurrence: null, child_id: null } });
      }
      toast(tr('cm.dump.saved', { count: kept.length }));
      setRows([]); setText('');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('tool.brain_dump')} subtitle={tr('tool.brain_dump.sub')}>
      <Text muted>{tr('cm.dump.intro')}</Text>
      <Card>
        <Field label={tr('cm.dump.field')} value={text} onChangeText={setText} multiline maxLength={3000} placeholder={tr('cm.dump.ph')} testID="dump-text" />
        <Button label={tr('cm.dump.sort')} icon="shuffle" onPress={sort} disabled={text.trim().length < 2} testID="dump-sort" />
      </Card>
      {rows.length ? (
        <>
          <Text variant="small" muted>{tr('cm.dump.check')}</Text>
          {rows.map((r, i) => (
            <Card key={i} testID={`dump-item-${i}`} style={{ opacity: r.keep ? 1 : 0.5 }}>
              <Row>
                <Text weight="bold" style={{ flex: 1 }}>{r.text}</Text>
                <IconButton icon={r.keep ? 'x' : 'rotate-ccw'} label={r.keep ? tr('cm.dump.drop') : tr('cm.dump.restore')} onPress={() => patch(i, { keep: !r.keep })} />
              </Row>
              {r.date ? <Text variant="small" muted>{formatDate(r.date, { weekday: 'long', day: 'numeric', month: 'long' })}{r.time ? ` · ${r.time}` : ''}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {KINDS.map((k) => <Chip key={k} label={tr(`cm.kind.${k}` as TKey)} selected={r.kind === k} onPress={() => patch(i, { kind: k })} />)}
              </View>
              {r.kind !== 'event' && people.length > 1 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {people.map((p) => <Chip key={p.id} icon="user" label={p.label} selected={r.assignee === p.id} onPress={() => patch(i, { assignee: p.id })} />)}
                </View>
              ) : null}
              {r.domain && ownerOf.get(r.domain) && r.kind !== 'event' ? <Text variant="caption" muted>{tr('cm.dump.domainOwner', { domain: tr(`cm.domain.${r.domain}` as TKey), person: labelOf(ownerOf.get(r.domain)) })}</Text> : null}
            </Card>
          ))}
          <Button label={tr('cm.dump.save', { count: rows.filter((r) => r.keep).length })} icon="check" loading={busy} onPress={() => void save()} testID="dump-save" />
        </>
      ) : null}
      <Banner tone="info" icon="lock">{tr('cm.dump.private')}</Banner>
      <Row wrap style={{ gap: spacing.xs }}>
        <Button label={tr('tool.family_domains')} size="sm" variant="secondary" icon="users" onPress={() => router.push('/family/domains')} />
        <Button label={tr('tool.family_tasks')} size="sm" variant="ghost" icon="check-square" onPress={() => router.push('/family')} />
      </Row>
    </Screen>
  );
}
