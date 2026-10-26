/** École ou mode de garde : établissement, classe, contacts, aménagements décidés avec l'école, notes datées. */
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Card, Field, ListRow, Text } from '@/components/ui';
import { useChild } from '@/lib/data/hooks';
import { useAddNeedEntry, useDeleteNeedEntry, useNeedEntries } from '@/lib/data/hooks-needs';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatDateFr, todayISO } from '@/lib/domain/dates';
import { t as tr } from '@/i18n';

export default function ChildSchool() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const toast = useToast();
  const { data: entries, isLoading } = useNeedEntries(id, 'school');
  const add = useAddNeedEntry();
  const del = useDeleteNeedEntry();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  async function save() {
    if (!title.trim() || !id) { toast(tr('nd.entry.errTitle'), 'error'); return; }
    try { await add.mutateAsync({ child_id: id, kind: 'school', title: title.trim(), body: body.trim() || null, occurred_on: todayISO() }); setTitle(''); setBody(''); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  const last = entries?.[0];
  return (
    <Screen back title={tr('tool.child_school')} subtitle={child?.first_name}
      action={{ label: tr('common.save'), icon: 'check', onPress: () => void save(), testID: 'school-save', disabled: add.isPending }}>
      <TodaySummary title={tr('mb.sc.title')} items={[
        { icon: 'book', value: String(entries?.length ?? 0), label: tr('mb.sc.count') },
        { icon: 'clock', value: last ? formatDateFr(last.occurred_on) : '—', label: tr('mb.sc.last') },
      ]} />
      <Text muted>{tr('sc.intro')}</Text>
      <Card>
        <Field label={tr('sc.title')} value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('sc.placeholder')} testID="school-title" />
        <Field label={tr('sc.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} />
      </Card>
      {isLoading ? <Skeleton rows={2} /> : !entries?.length ? <EmptyState icon="book" title={tr('sc.none')} /> : (
        <Card>
          {entries.map((e) => (
            <ListRow key={e.id} icon="book" title={e.title} subtitle={`${formatDateFr(e.occurred_on)}${e.body ? ` · ${e.body}` : ''}`}
              onPress={async () => { if (await confirm(tr('nd.entry.deleteTitle'), e.title, tr('common.delete'))) await del.mutateAsync(e.id).catch(() => undefined); }} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
