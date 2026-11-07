/**
 * Point de couple de la semaine (10 minutes, guidé) : la semaine qui vient (agenda), ce qui reste à faire et pour qui,
 * qui porte quels domaines, puis trois questions — ce qui pèse, ce qu'on décide, un merci. Visible des seuls parents.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Button, Card, Field, ListRow, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { useFamilyEvents, useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useCoupleCheckins, useDomains } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, todayISO } from '@/lib/domain/dates';
import { mondayOf } from '@/lib/domain/custody';
import { DOMAINS } from '@/lib/domain/mentalLoad';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function CoupleWeek() {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const { people, labelOf } = usePeople();
  const week = mondayOf(addDays(todayISO(), 1));
  const until = addDays(week, 7);
  const events = (useFamilyEvents().data ?? []).filter((e) => e.starts_at.slice(0, 10) >= todayISO() && e.starts_at.slice(0, 10) < until);
  const open = (useFamilyTasks().data ?? []).filter((x) => x.status === 'todo');
  const domains = useDomains().data ?? [];
  const checkQ = useCoupleCheckins();
  const current = (checkQ.data ?? []).find((c) => c.week_of === week);
  const past = (checkQ.data ?? []).filter((c) => c.week_of !== week).slice(0, 4);
  const [heavy, setHeavy] = useState('');
  const [decisions, setDecisions] = useState('');
  const [thanks, setThanks] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setHeavy(current?.heavy ?? ''); setDecisions(current?.decisions ?? ''); setThanks(current?.thanks ?? ''); }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const perPerson = useMemo(() => people.map((p) => ({ ...p, n: open.filter((x) => x.assignee_id === p.id).length })), [people, open]);

  async function save() {
    if (!hid) return;
    setBusy(true);
    try {
      const row = { heavy: heavy.trim() || null, decisions: decisions.trim() || null, thanks: thanks.trim() || null };
      if (current) await backend.update('couple_checkins', row, [eq('id', current.id)]);
      else await backend.insert('couple_checkins', { ...row, household_id: hid, week_of: week });
      inv('couple_checkins');
      toast(tr('cm.cp.saved'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('tool.couple_week')} subtitle={tr('cm.cp.week', { date: formatDate(week, { day: 'numeric', month: 'long' }) })}>
      <Text muted>{tr('cm.cp.intro')}</Text>
      <SectionTitle title={tr('cm.cp.s1')} />
      <Card padded={false} testID="cp-events">
        {events.length ? events.slice(0, 12).map((e) => <ListRow key={e.id} icon="calendar" title={e.title} subtitle={formatDate(e.starts_at, { weekday: 'long', day: 'numeric', hour: e.all_day ? undefined : '2-digit', minute: e.all_day ? undefined : '2-digit' })} />)
          : <ListRow icon="calendar" title={tr('cm.cp.noEvents')} onPress={() => router.push('/calendar')} />}
      </Card>
      <SectionTitle title={tr('cm.cp.s2')} />
      <Card testID="cp-tasks">
        <Text variant="small">{tr('cm.cp.open', { count: open.length })}</Text>
        {perPerson.map((p) => <Text key={p.id} variant="small">• {p.label} : {p.n}</Text>)}
        <Text variant="small">• {tr('cm.cp.nobody')} : {open.filter((x) => !x.assignee_id).length}</Text>
      </Card>
      <SectionTitle title={tr('cm.cp.s3')} />
      <Card>
        {DOMAINS.filter((k) => domains.some((d) => d.key === k && d.owner_id)).map((k) => <Text key={k} variant="small">• {tr(`cm.domain.${k}` as TKey)} : {labelOf(domains.find((d) => d.key === k)!.owner_id)}</Text>)}
        <Text variant="small" muted>{tr('cm.cp.freeDomains', { count: DOMAINS.filter((k) => !domains.some((d) => d.key === k && d.owner_id)).length })}</Text>
        <Button label={tr('tool.family_domains')} size="sm" variant="ghost" onPress={() => router.push('/family/domains')} />
      </Card>
      <SectionTitle title={tr('cm.cp.s4')} />
      <Card>
        <Field label={tr('cm.cp.heavy')} optional value={heavy} onChangeText={setHeavy} maxLength={1000} multiline placeholder={tr('cm.cp.heavyPh')} testID="cp-heavy" />
        <Field label={tr('cm.cp.decisions')} optional value={decisions} onChangeText={setDecisions} maxLength={2000} multiline placeholder={tr('cm.cp.decisionsPh')} />
        <Field label={tr('cm.cp.thanks')} optional value={thanks} onChangeText={setThanks} maxLength={500} placeholder={tr('cm.cp.thanksPh')} />
        <Button label={tr('common.save')} loading={busy} onPress={() => void save()} testID="cp-save" />
      </Card>
      {past.length ? (
        <>
          <SectionTitle title={tr('cm.cp.past')} />
          {past.map((c) => (
            <Card key={c.id} tone="soft">
              <Text weight="bold">{formatDate(c.week_of, { day: 'numeric', month: 'long' })}</Text>
              {c.decisions ? <Text variant="small">{c.decisions}</Text> : null}
            </Card>
          ))}
        </>
      ) : null}
      <Text variant="caption" muted>{tr('cm.cp.private')}</Text>
    </Screen>
  );
}
