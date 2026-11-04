/** Listes de préparation : valise de maternité, affaires de bébé, démarches… */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { ProgressBar as AnimatedProgress } from '@/components/Motion';
import { PremiumGate } from '@/components/Family';
import { Banner, Button, Card, Field, haptic, Icon, IconButton, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useAllChecklistItems, useChecklistItems, useChecklists, useHouseholdId, useInvalidate, usePremium } from '@/lib/data/hooks';
import { isPremiumError, usePlanLimit } from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { CHECKLIST_TEMPLATES } from '@/content/checklists';
import type { Checklist, ChecklistItem, ChecklistKind } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { progressOf } from '@/lib/domain/quickPicks';
import { t as tr } from '@/i18n';

type TemplateKind = Exclude<ChecklistKind, 'custom'>;
const iconOf = (kind: ChecklistKind): IconName => (kind === 'custom' ? 'list' : (CHECKLIST_TEMPLATES[kind].icon as IconName));

function ProgressBar({ done, total }: { done: number; total: number }) {
  const t = useTheme();
  return <AnimatedProgress value={total ? done / total : 0} color={t.colors.primary} track={t.colors.surfaceAlt} height={6} accessibilityLabel={tr('u2.lists.progress_a11y', { done, total })} />;
}

export function ChecklistDetail({ list, onClose }: { list: Checklist; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const itemsQ = useChecklistItems(list.id);
  const { data: items, isLoading } = itemsQ;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const done = (items ?? []).filter((i) => i.done).length;
  const prog = progressOf(items ?? []);
  // À faire d'abord (dans l'ordre de la liste), les éléments cochés repliés en bas
  const todo = (items ?? []).filter((i) => !i.done);
  const doneList = (items ?? []).filter((i) => i.done);

  async function toggle(item: ChecklistItem) {
    if (busyId === item.id) return;
    haptic(item.done ? 'selection' : 'success');
    setBusyId(item.id);
    try {
      await backend.update('checklist_items', { done: !item.done, done_by: item.done ? null : userId }, [eq('id', item.id)]);
      inv('checklist_items');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function add() {
    const clean = label.trim();
    if (!clean) return setError(tr('u2.lists.need_item'));
    if (clean.length > 160) return setError(tr('u2.lists.max160'));
    setError(null);
    setAdding(true);
    try {
      const position = Math.max(-1, ...(items ?? []).map((i) => i.position)) + 1;
      await backend.insert('checklist_items', { checklist_id: list.id, household_id: list.household_id, label: clean, position });
      inv('checklist_items');
      setLabel('');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(item: ChecklistItem) {
    if (busyId === item.id) return;
    setBusyId(item.id);
    try {
      await backend.remove('checklist_items', [eq('id', item.id)]);
      inv('checklist_items');
      toast(tr('u2.lists.item_removed', { label: item.label }), 'info');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function removeList() {
    if (!(await confirm(tr('u2.lists.delete_title', { title: list.title }), tr('u2.lists.delete_body'), tr('u2.lists.delete')))) return;
    setRemoving(true);
    try {
      await backend.remove('checklist_items', [eq('checklist_id', list.id)]).catch(() => undefined);
      await backend.remove('checklists', [eq('id', list.id)]);
      inv('checklists', 'checklist_items');
      toast(tr('u2.lists.deleted'));
      onClose();
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <Row>
          <Icon name={iconOf(list.kind)} color={t.colors.primary} />
          <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{list.title}</Text>
          <IconButton icon="chevron-up" label={tr('u2.lists.close')} onPress={onClose} />
        </Row>
        <Row style={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="small" muted>{tr('u2.lists.done_of', { done, total: items?.length ?? 0, count: done })}</Text>
          <Text weight="bold" color={t.colors.primary} testID="list-pct">{prog.pct} %</Text>
        </Row>
        <ProgressBar done={done} total={items?.length ?? 0} />
        {/* ajout rapide en haut : Entrée ajoute et garde le clavier ouvert pour enchaîner */}
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field label={tr('u2.lists.add_item')} value={label} onChangeText={(v) => { setLabel(v); setError(null); }} maxLength={160} error={error} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} />
          </View>
          <IconButton icon="plus" tone="primary" label={tr('u2.lists.add')} onPress={add} disabled={adding} />
        </Row>
        {isLoading && !items ? <Skeleton kind="detail" rows={4} /> : itemsQ.isError && !items ? (
          <ErrorView error={itemsQ.error} onRetry={() => void itemsQ.refetch()} title={tr('u2.lists.load_error')} />
        ) : (
          <View>
            {[...todo, ...(showDone ? doneList : [])].map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Tappable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={item.label}
                  onPress={() => toggle(item)}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 4, paddingVertical: 6, borderRadius: radius.md, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: item.done ? 0 : 2, borderColor: t.colors.border, backgroundColor: item.done ? t.colors.gold : 'transparent' }}>
                    {item.done ? <Icon name="check" size={15} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={{ flex: 1, textDecorationLine: item.done ? 'line-through' : 'none' }} muted={item.done}>{item.label}</Text>
                </Tappable>
                <IconButton icon="trash-2" size={17} color={t.colors.textMuted} label={tr('u2.lists.remove_item', { label: item.label })} onPress={() => removeItem(item)} />
              </View>
            ))}
            {!items?.length && <Text muted>{tr('u2.lists.empty')}</Text>}
            {items?.length && !todo.length ? <Text muted center style={{ paddingVertical: spacing.sm }}>{tr('u2.lists.all_done')}</Text> : null}
            {doneList.length ? (
              <Button label={showDone ? tr('u2.lists.hide_done') : tr('u2.lists.show_done', { count: doneList.length })} icon={showDone ? 'chevron-up' : 'chevron-down'} size="sm" variant="ghost" onPress={() => setShowDone((v) => !v)} style={{ alignSelf: 'flex-start' }} testID="list-toggle-done" />
            ) : null}
          </View>
        )}
        <Button label={tr('u2.lists.delete_list')} icon="trash-2" variant="ghost" size="sm" loading={removing} onPress={removeList} style={{ alignSelf: 'flex-start' }} />
      </View>
    </Card>
  );
}

export default function ListsScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const premium = usePremium();
  const limit = usePlanLimit('checklists_count');
  const pregnancy = useActivePregnancy();
  const listsQ = useChecklists();
  const { data: lists, isLoading } = listsQ;
  const { data: allItems } = useAllChecklistItems();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const count = lists?.length ?? 0;
  const atLimit = !premium && (count >= limit || limitReached);
  const open = lists?.find((l) => l.id === openId) ?? null;
  const usedKinds = new Set((lists ?? []).map((l) => l.kind));

  async function create(kind: ChecklistKind, title: string, labels: string[]) {
    setBusy(true);
    try {
      const h = hid ?? (await ensureHousehold());
      const [list] = await backend.insert<Checklist>('checklists', { household_id: h, pregnancy_id: pregnancy?.id ?? null, kind, title });
      if (labels.length) await backend.insert('checklist_items', labels.map((label, i) => ({ checklist_id: list.id, household_id: h, label, position: i })));
      inv('checklists', 'checklist_items', 'memberships');
      haptic('success');
      toast(tr('u2.lists.created'));
      setCreating(false);
      setCustomTitle('');
      setOpenId(list.id);
    } catch (e) {
      if (isPremiumError(e)) setLimitReached(true);
      else toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  function createCustom() {
    const clean = customTitle.trim();
    if (!clean) return setTitleError(tr('u2.lists.need_title'));
    if (clean.length > 80) return setTitleError(tr('u2.lists.max80'));
    setTitleError(null);
    create('custom', clean, []);
  }

  const totalItems = (allItems ?? []).filter((i) => (lists ?? []).some((l) => l.id === i.checklist_id));
  const doneItems = totalItems.filter((i) => i.done).length;
  // « Reprendre » : la liste commencée la plus avancée qui n'est pas terminée (sinon la première non terminée)
  const resume = (lists ?? []).map((l) => {
    const its = (allItems ?? []).filter((i) => i.checklist_id === l.id);
    const p = progressOf(its);
    return { list: l, left: p.total - p.done, pct: p.pct, started: p.done > 0 };
  }).filter((x) => x.left > 0).sort((a, b) => Number(b.started) - Number(a.started) || b.pct - a.pct)[0] ?? null;

  return (
    <Screen back title={tr('u2.lists.title')} subtitle={tr('u2.lists.subtitle')}
      action={atLimit ? undefined : { label: tr('u2.lists.new'), icon: 'plus', onPress: () => setCreating(true), testID: 'lists-new' }}>
      <TodaySummary title={tr('u2.lists.my_prep')} items={[
        { icon: 'list', value: premium ? String(count) : `${count}/${limit}`, label: count > 1 ? tr('u2.lists.lists') : tr('u2.lists.list') },
        { icon: 'check-square', value: totalItems.length ? `${doneItems}/${totalItems.length}` : '—', label: tr('u2.lists.ticked') },
        { icon: 'pie-chart', value: totalItems.length ? `${Math.round((doneItems / totalItems.length) * 100)} %` : '—', label: tr('u2.lists.progress') },
      ]} />
      {atLimit ? (
        <View style={{ gap: spacing.sm }}>
          <Banner tone="warning" title={tr('u2.lists.limit_title')}>{tr('u2.lists.limit_body', { limit })}</Banner>
          <PremiumGate feature={tr('u2.lists.unlimited')}><View /></PremiumGate>
        </View>
      ) : null}

      {isLoading && !lists ? <Skeleton rows={3} /> : listsQ.isError && !lists ? (
        <ErrorView error={listsQ.error} onRetry={() => void listsQ.refetch()} title={tr('u2.lists.lists_error')} />
      ) : !lists?.length ? (
        <EmptyState icon="check-square" title={tr('u2.lists.none_title')} body={tr('u2.lists.none_body')} action={atLimit ? undefined : { label: tr('u2.lists.create'), onPress: () => setCreating(true) }} />
      ) : (
        <>
          {!open && resume ? (
            <Tappable accessibilityRole="button" accessibilityLabel={tr('u2.lists.resume_a11y', { title: resume.list.title })} onPress={() => setOpenId(resume.list.id)} testID="lists-resume">
              <Card tone="lavender">
                <Row>
                  <Icon name={iconOf(resume.list.kind)} color={t.colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="caption" muted>{tr('u2.lists.resume')}</Text>
                    <Text weight="bold">{resume.list.title}</Text>
                    <Text variant="small" muted>{tr('u2.lists.left', { count: resume.left, pct: resume.pct })}</Text>
                  </View>
                  <Icon name="chevron-right" color={t.colors.textMuted} />
                </Row>
              </Card>
            </Tappable>
          ) : null}
          {open && <ChecklistDetail key={open.id} list={open} onClose={() => setOpenId(null)} />}
          <SectionTitle title={open ? tr('u2.lists.others') : tr('u2.lists.yours')} />
          <Card>
            {lists.filter((l) => l.id !== openId).map((l) => {
              const items = (allItems ?? []).filter((i) => i.checklist_id === l.id);
              const done = items.filter((i) => i.done).length;
              return (
                <View key={l.id} style={{ gap: 4, paddingBottom: spacing.xs }}>
                  <ListRow icon={iconOf(l.kind)} title={l.title} subtitle={items.length ? tr('u2.lists.done_of', { done, total: items.length, count: done }) : tr('u2.lists.blank')} onPress={() => setOpenId(l.id)} />
                  {items.length > 0 && <ProgressBar done={done} total={items.length} />}
                </View>
              );
            })}
            {lists.every((l) => l.id === openId) && <Text muted>{tr('u2.lists.no_other')}</Text>}
          </Card>
        </>
      )}

      <Sheet visible={creating} onClose={() => setCreating(false)} title={tr('u2.lists.new')}>
        {limitReached && !premium ? (
          <PremiumGate feature={tr('u2.lists.unlimited')}><View /></PremiumGate>
        ) : (
          <>
            <Text variant="label">{tr('u2.lists.from_template')}</Text>
            {(Object.keys(CHECKLIST_TEMPLATES) as TemplateKind[]).map((k) => {
              const tpl = CHECKLIST_TEMPLATES[k];
              return (
                <ListRow
                  key={k}
                  icon={tpl.icon as IconName}
                  title={tpl.title}
                  subtitle={`${tr('u2.lists.items_count', { count: tpl.items.length })}${usedKinds.has(k) ? ` · ${tr('u2.lists.already')}` : ''}`}
                  onPress={() => { if (!busy) create(k, tpl.title, tpl.items); }}
                />
              );
            })}
            <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u2.lists.blank_list')}</Text>
            <Field label={tr('u2.lists.f_title')} value={customTitle} onChangeText={(v) => { setCustomTitle(v); setTitleError(null); }} maxLength={80} error={titleError} placeholder={tr('u2.lists.ph')} />
            <Button label={tr('u2.lists.create_btn')} loading={busy} onPress={createCustom} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
