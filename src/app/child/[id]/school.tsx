/** École ou mode de garde : établissement, classe, contacts, aménagements décidés avec l'école, notes datées. */
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Field, ListRow, Text } from '@/components/ui';
import { useChild } from '@/lib/data/hooks';
import { useAddNeedEntry, useDeleteNeedEntry, useNeedEntries } from '@/lib/data/hooks-needs';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatDateFr, todayISO } from '@/lib/domain/dates';
import { t as tr } from '@/i18n';
import { toolName } from '@/lib/domain/toolCatalog';

export default function ChildSchool() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const toast = useToast();
  const entriesQ = useNeedEntries(id, 'school');
  const { data: entries, isLoading } = entriesQ;
  // Erreur réseau : on ne l'affiche jamais comme « aucune note »
  const loadFailed = entriesQ.isError && !entries;
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
    <Screen back title={toolName('kid_school')} subtitle={child?.first_name}
      action={{ label: tr('common.save'), icon: 'check', onPress: () => save(), testID: 'school-save', disabled: add.isPending }}>
      <TodaySummary title={tr('mb.sc.title')} items={[
        { icon: 'book', value: loadFailed ? '—' : String(entries?.length ?? 0), label: tr('mb.sc.count') },
        { icon: 'clock', value: last ? formatDateFr(last.occurred_on) : '—', label: tr('mb.sc.last') },
      ]} />
      <Text muted>{tr('sc.schoolIntro')}</Text>
      {/* Espace Nounou (21/11/2026) : carnet de la journée, photos privées, messages et accès de la nounou */}
      <Card>
        <Text weight="bold">{tr('nn.space.title')}</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>{tr('nn.home.parentSub')}</Text>
        <Button label={tr('nn.space.of', { name: child?.first_name ?? '' })} icon="home" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push(`/garde/${id}` as never)} testID="school-open-nanny" />
      </Card>
      <Card>
        <Field label={tr('sc.title')} value={title} onChangeText={setTitle} maxLength={120} placeholder={tr('sc.placeholder')} testID="school-title" />
        <Field label={tr('sc.body')} optional value={body} onChangeText={setBody} multiline maxLength={4000} />
      </Card>
      {isLoading && !entries ? <Skeleton rows={2} /> : loadFailed ? (
        <ErrorView error={entriesQ.error} onRetry={() => void entriesQ.refetch()} />
      ) : !entries?.length ? <EmptyState icon="book" title={tr('sc.none')} /> : (
        <Card>
          {entries.map((e) => (
            <ListRow key={e.id} icon="book" title={e.title} subtitle={`${formatDateFr(e.occurred_on)}${e.body ? ` · ${e.body}` : ''}`}
              onPress={async () => { if (await confirm(tr('nd.entry.deleteTitle'), e.title, tr('common.delete'))) await del.mutateAsync(e.id).catch((err) => toast(friendlyError(err), 'error')); }} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
