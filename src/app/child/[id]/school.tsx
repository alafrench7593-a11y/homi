/** École ou mode de garde : établissement, classe, contacts, aménagements décidés avec l'école, notes datées. */
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Card, Field, ListRow, Text } from '@/components/ui';
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
  return (
    <Screen back title={tr('tool.child_school')} subtitle={child?.first_name}>
      <Text muted>{tr('sc.intro')}</Text>
      <Card>
        <Field label={tr('sc.title')} value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('sc.placeholder')} testID="school-title" />
        <Field label={tr('sc.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} />
        <Button label={tr('common.save')} loading={add.isPending} testID="school-save" onPress={async () => {
          if (!title.trim() || !id) { toast(tr('nd.entry.errTitle'), 'error'); return; }
          try { await add.mutateAsync({ child_id: id, kind: 'school', title: title.trim(), body: body.trim() || null, occurred_on: todayISO() }); setTitle(''); setBody(''); }
          catch (e) { toast(friendlyError(e), 'error'); }
        }} />
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
