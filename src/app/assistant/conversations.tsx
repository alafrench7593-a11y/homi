/**
 * Mes conversations avec Aura (25/11/2026) : historique gardé SUR CE TÉLÉPHONE, pour ce compte seulement.
 * Recherche, reprise, renommage, suppression (une ou toutes). Jamais partagé avec le coparent.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Card, Field, ListRow, Text } from '@/components/ui';
import { confirm } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { clearConversations, deleteConversation, loadConversations, renameConversation, searchConversations, type StoredConversation } from '@/lib/aura/history';
import { formatDate, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function AuraConversations() {
  const userId = useUserId();
  const [list, setList] = useState<StoredConversation[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const reload = useCallback(() => { if (userId) void loadConversations(userId).then(setList); }, [userId]);
  useFocusEffect(reload);
  const shown = useMemo(() => searchConversations(list, query), [list, query]);

  async function remove(c: StoredConversation) {
    if (!userId || !(await confirm(tr('aura.hist.deleteQ'), c.title, tr('aura.hist.delete')))) return;
    await deleteConversation(userId, c.id); reload();
  }
  async function removeAll() {
    if (!userId || !(await confirm(tr('aura.hist.deleteAllQ'), tr('aura.hist.deleteAllBody'), tr('aura.hist.deleteAll')))) return;
    await clearConversations(userId); reload();
  }
  async function saveTitle() {
    if (!userId || !editing) return;
    await renameConversation(userId, editing.id, editing.title); setEditing(null); reload();
  }

  return (
    <Screen back title={tr('aura.hist.title')} subtitle={tr('aura.hist.sub')}
      footer={<Button label={tr('aura.hist.new')} icon="edit" onPress={() => router.replace('/assistant' as never)} testID="aura-hist-new" full />}>
      {list.length ? <Field label={tr('aura.hist.search')} value={query} onChangeText={setQuery} autoCorrect={false} testID="aura-hist-search" /> : null}
      {!list.length ? (
        <Card><Text variant="small" muted testID="aura-hist-empty">{tr('aura.hist.empty')}</Text></Card>
      ) : !shown.length ? (
        <Text variant="small" muted testID="aura-hist-none">{tr('aura.hist.none')}</Text>
      ) : (
        <Card testID="aura-hist-list">
          {shown.map((c) => editing?.id === c.id ? (
            <View key={c.id} style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
              <Field label={tr('aura.hist.rename')} value={editing.title} onChangeText={(v) => setEditing({ id: c.id, title: v })} maxLength={80} autoFocus testID="aura-hist-title" />
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Button label={tr('aura.hist.save')} size="sm" onPress={() => void saveTitle()} testID="aura-hist-save" />
                <Button label={tr('aura.hist.cancel')} size="sm" variant="ghost" onPress={() => setEditing(null)} />
              </View>
            </View>
          ) : (
            <View key={c.id}>
              <ListRow icon="message-circle" title={c.title} subtitle={formatDate(c.updatedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                onPress={() => router.push({ pathname: '/assistant', params: { conv: c.id } } as never)} testID={`aura-hist-${c.id}`} />
              <View style={{ flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end' }}>
                <Button label={tr('aura.hist.rename')} size="sm" variant="ghost" onPress={() => setEditing({ id: c.id, title: c.title })} testID={`aura-hist-rename-${c.id}`} />
                <Button label={tr('aura.hist.delete')} size="sm" variant="ghost" onPress={() => void remove(c)} testID={`aura-hist-delete-${c.id}`} />
              </View>
            </View>
          ))}
        </Card>
      )}
      {list.length ? <Button label={tr('aura.hist.deleteAll')} variant="ghost" onPress={() => void removeAll()} testID="aura-hist-delete-all" /> : null}
      <Text variant="caption" muted center>{tr('aura.hist.privacy')}</Text>
    </Screen>
  );
}
