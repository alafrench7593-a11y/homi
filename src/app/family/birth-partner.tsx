/**
 * 48 — Préparation du coparent à l'accouchement : numéros, trajet, sac, papiers, que faire quand le travail commence,
 * rôle du coparent. Réutilise les listes de préparation (checklists « coparent » + points, la note porte le numéro ou le
 * trajet). La liste est PRIVÉE à sa création ; seule la personne qui l'a créée la partage avec l'autre parent.
 * Contenu pratique, non médical.
 */
import React, { useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, haptic, Icon, IconButton, ListGroup, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { SwitchRow } from '@/features/couple/CoupleKit';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useOtherParent } from '@/lib/data/hooks-calmMoments';
import {
  useCreatePartnerPrep, useDeletePartnerPrep, useDeletePrepItem, usePartnerPrepLists, usePrepItems, useSavePrepItem, useSharePartnerPrep, type PrepChecklist,
} from '@/lib/data/hooks-birthCare';
import { copyText } from '@/features/bottle';
import { groupOfPosition, itemHint, keyOfPosition, PREP_GROUPS, prepText } from '@/features/birth/partnerPrep';
import type { ChecklistItem } from '@/lib/types';

function ItemRow({ item, onToggle, onEdit }: { item: ChecklistItem & { _pending?: boolean }; onToggle: () => void; onEdit: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
      <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: item.done }} accessibilityLabel={item.label} onPress={onToggle} hitSlop={8}
        testID={`bpp-check-${item.position}`} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={item.done ? 'check-square' : 'square'} size={22} color={item.done ? t.colors.primary : t.colors.textMuted} />
      </Tappable>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('bpp.editA11y', { label: item.label })} onPress={onEdit} style={{ flex: 1, paddingVertical: spacing.xs }} testID={`bpp-item-${item.position}`}>
        <Text weight="medium">{item.label}</Text>
        {item.note ? <Text variant="small" muted testID={`bpp-note-${item.position}`}>{item.note}</Text> : null}
      </Tappable>
    </View>
  );
}

function ItemSheet({ item, list, onClose }: { item: (ChecklistItem | { new: true }) | null; list: PrepChecklist; onClose: () => void }) {
  const toast = useToast();
  const save = useSavePrepItem();
  const del = useDeletePrepItem();
  const existing = item && !('new' in item) ? item : null;
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  React.useEffect(() => { setLabel(existing?.label ?? ''); setNote(existing?.note ?? ''); }, [existing?.id, item]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!item) return null;
  const key = existing ? keyOfPosition(existing.position) : null;
  async function submit() {
    if (!label.trim()) return toast(tr('bpp.err.label'), 'error');
    try {
      await save.mutateAsync({ ...(existing ?? {}), checklist_id: list.id, household_id: list.household_id, label: label.trim().slice(0, 160), note: note.trim() || null,
        position: existing?.position ?? 1000 + Date.now() % 100000 * 10 + 1, done: existing?.done ?? false });
      toast(tr('bpp.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!existing || !(await confirm(tr('bpp.deleteItem'), tr('bpp.deleteItemQ'), tr('bpp.deleteItem')))) return;
    try { await del.mutateAsync(existing.id); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={existing ? tr('bpp.editItem') : tr('bpp.addItem')}>
      <Field label={tr('bpp.label')} value={label} onChangeText={setLabel} maxLength={160} testID="bpp-f-label" />
      <Field label={tr('bpp.noteLabel')} optional value={note} onChangeText={setNote} maxLength={500} multiline hint={key ? itemHint(key) : undefined} testID="bpp-f-note" />
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="bpp-f-save" />
      {existing ? <Button label={tr('bpp.deleteItem')} variant="ghost" icon="trash-2" onPress={() => void remove()} /> : null}
    </GlassSheet>
  );
}

function PrepList({ list }: { list: PrepChecklist }) {
  const toast = useToast();
  const me = useUserId();
  const other = useOtherParent();
  const { nameOf } = usePeople();
  const itemsQ = usePrepItems(list.id);
  const save = useSavePrepItem();
  const share = useSharePartnerPrep();
  const delList = useDeletePartnerPrep();
  const [editing, setEditing] = useState<(ChecklistItem | { new: true }) | null>(null);
  const items = itemsQ.data ?? [];
  const mine = list.created_by === me;
  const groups = useMemo(() => [...PREP_GROUPS.map((g) => ({ key: g.key as string, icon: g.icon, items: items.filter((i) => groupOfPosition(i.position) === g.key) })),
    { key: 'other', icon: 'plus-circle' as const, items: items.filter((i) => groupOfPosition(i.position) == null) }].filter((g) => g.items.length), [items]);
  const done = items.filter((i) => i.done).length;

  async function toggle(i: ChecklistItem) {
    haptic(i.done ? 'selection' : 'success');
    try { await save.mutateAsync({ ...i, done: !i.done }); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function setShared(v: boolean) {
    try { await share.mutateAsync({ id: list.id, shared: v }); toast(v ? tr('bpp.sharedToast', { name: other?.name ?? tr('bpp.otherParent') }) : tr('bpp.privateToast'), 'success'); }
    catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function shareText() {
    const text = prepText(list.title, items);
    try {
      if (Platform.OS === 'web') { await copyText(text); toast(tr('bpp.copied'), 'success'); } else await Share.share({ title: list.title, message: text });
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function removeList() {
    if (!(await confirm(tr('bpp.deleteList'), tr('bpp.deleteListQ'), tr('bpp.deleteList')))) return;
    try { await delList.mutateAsync(list.id); toast(tr('bpp.deleted'), 'success'); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <View style={{ gap: spacing.md }}>
      <Card testID="bpp-share">
        {mine ? (
          <>
            <SwitchRow label={other ? tr('bpp.shareWith', { name: other.name }) : tr('bpp.shareWithOther')} value={!list.private_to_creator} onChange={(v) => void setShared(v)} testID="bpp-share-toggle" />
            <Text variant="small" muted testID="bpp-share-state">{list.private_to_creator ? tr('bpp.privateState') : tr('bpp.sharedState')}</Text>
          </>
        ) : <Text variant="small" muted>{tr('bpp.sharedBy', { name: nameOf(list.created_by) })}</Text>}
        <Text variant="caption" muted>{tr('bpp.progress', { done, total: items.length })}</Text>
      </Card>
      {itemsQ.isLoading && !itemsQ.data ? <Skeleton rows={4} /> : groups.map((g) => (
        <ListGroup key={g.key} title={tr(`bpp.group.${g.key}` as TKey)} testID={`bpp-group-${g.key}`}>
          {g.items.map((i) => <ItemRow key={i.id} item={i} onToggle={() => void toggle(i)} onEdit={() => setEditing(i)} />)}
        </ListGroup>
      ))}
      <Row wrap gap={spacing.sm}>
        <Button label={tr('bpp.addItem')} icon="plus" size="sm" variant="secondary" onPress={() => setEditing({ new: true })} testID="bpp-add" />
        <Button label={Platform.OS === 'web' ? tr('bpp.copy') : tr('bpp.shareText')} icon="share" size="sm" variant="ghost" onPress={() => void shareText()} testID="bpp-text" />
        <Button label={tr('ctr.emergency')} icon="phone" size="sm" variant="ghost" onPress={() => router.push('/emergency')} />
      </Row>
      {mine ? <Button label={tr('bpp.deleteList')} variant="ghost" icon="trash-2" onPress={() => void removeList()} testID="bpp-delete" /> : null}
      <ItemSheet item={editing} list={list} onClose={() => setEditing(null)} />
    </View>
  );
}

export default function BirthPartnerPrep() {
  const toast = useToast();
  const q = usePartnerPrepLists();
  const create = useCreatePartnerPrep();
  const me = useUserId();
  // Les listes « coparent » créées ici (avec une autrice) ; les anciennes listes du modèle restent dans « Listes »
  const lists = (q.data ?? []).filter((l) => l.created_by);
  const mineFirst = [...lists].sort((a, b) => Number(b.created_by === me) - Number(a.created_by === me));
  const list = mineFirst[0] ?? null;
  async function start() {
    try {
      const r = await create.mutateAsync({ title: tr('bpp.listTitle') });
      toast(r.queued ? tr('bpp.createdOffline') : tr('bpp.created'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  if (q.isLoading && !q.data) return <Screen back title={tr('bpp.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('bpp.title')} subtitle={tr('bpp.subtitle')} tool={false}>
      <Text muted>{tr('bpp.intro')}</Text>
      {list ? <PrepList list={list} /> : (
        <>
          <EmptyState icon="briefcase" title={tr('bpp.emptyTitle')} body={tr('bpp.emptyBody')} action={{ label: tr('bpp.create'), onPress: () => void start() }} />
          <Button label={tr('bpp.create')} icon="plus" loading={create.isPending} onPress={() => void start()} testID="bpp-create" />
        </>
      )}
      <Banner tone="info" icon="lock">{tr('bpp.privacy')}</Banner>
    </Screen>
  );
}
