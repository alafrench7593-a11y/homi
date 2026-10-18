/** Listes de préparation : valise de maternité, affaires de bébé, démarches… */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/Screen';
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

type TemplateKind = Exclude<ChecklistKind, 'custom'>;
const iconOf = (kind: ChecklistKind): IconName => (kind === 'custom' ? 'list' : (CHECKLIST_TEMPLATES[kind].icon as IconName));

function ProgressBar({ done, total }: { done: number; total: number }) {
  const t = useTheme();
  return <AnimatedProgress value={total ? done / total : 0} color={t.colors.primary} track={t.colors.surfaceAlt} height={6} accessibilityLabel={`${done} sur ${total} fait`} />;
}

function ChecklistDetail({ list, onClose }: { list: Checklist; onClose: () => void }) {
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
  const done = (items ?? []).filter((i) => i.done).length;

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
    if (!clean) return setError('Indiquez un élément.');
    if (clean.length > 160) return setError('160 caractères maximum.');
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
      toast(`« ${item.label} » retiré.`, 'info');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function removeList() {
    if (!(await confirm(`Supprimer « ${list.title} » ?`, 'La liste et tous ses éléments seront supprimés pour toutes les personnes du foyer.', 'Supprimer'))) return;
    setRemoving(true);
    try {
      await backend.remove('checklist_items', [eq('checklist_id', list.id)]).catch(() => undefined);
      await backend.remove('checklists', [eq('id', list.id)]);
      inv('checklists', 'checklist_items');
      toast('Liste supprimée.');
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
          <IconButton icon="chevron-up" label="Refermer la liste" onPress={onClose} />
        </Row>
        <Text variant="small" muted>{done} sur {items?.length ?? 0} fait{done > 1 ? 's' : ''}</Text>
        <ProgressBar done={done} total={items?.length ?? 0} />
        {isLoading && !items ? <Skeleton kind="detail" rows={4} /> : itemsQ.isError && !items ? (
          <ErrorView error={itemsQ.error} onRetry={() => void itemsQ.refetch()} title="Impossible d’afficher cette liste" />
        ) : (
          <View>
            {(items ?? []).map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={item.label}
                  onPress={() => toggle(item)}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 4, paddingVertical: 6, borderRadius: radius.md, opacity: pressed ? 0.7 : 1 })}
                >
                  <Icon name={item.done ? 'check-square' : 'square'} color={item.done ? t.colors.success : t.colors.textMuted} />
                  <Text style={{ flex: 1, textDecorationLine: item.done ? 'line-through' : 'none' }} muted={item.done}>{item.label}</Text>
                </Pressable>
                <IconButton icon="trash-2" size={17} color={t.colors.textMuted} label={`Retirer ${item.label}`} onPress={() => removeItem(item)} />
              </View>
            ))}
            {!items?.length && <Text muted>Cette liste est vide.</Text>}
          </View>
        )}
        <Field label="Ajouter un élément" value={label} onChangeText={(v) => { setLabel(v); setError(null); }} maxLength={160} error={error} onSubmitEditing={add} returnKeyType="done" />
        <Button label="Ajouter" icon="plus" size="sm" variant="secondary" loading={adding} onPress={add} style={{ alignSelf: 'flex-start' }} />
        <Button label="Supprimer la liste" icon="trash-2" variant="ghost" size="sm" loading={removing} onPress={removeList} style={{ alignSelf: 'flex-start' }} />
      </View>
    </Card>
  );
}

export default function ListsScreen() {
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
      toast('Liste créée.');
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
    if (!clean) return setTitleError('Donnez un titre à la liste.');
    if (clean.length > 80) return setTitleError('80 caractères maximum.');
    setTitleError(null);
    create('custom', clean, []);
  }

  return (
    <Screen back title="Listes de préparation" subtitle="Cochez à deux, chacun de son côté.">
      {!premium && (
        <Text variant="small" muted>{count} liste{count > 1 ? 's' : ''} sur {limit} dans la version gratuite.</Text>
      )}
      {atLimit ? (
        <View style={{ gap: spacing.sm }}>
          <Banner tone="warning" title="Limite de la version gratuite">{`Vous avez atteint ${limit} listes. Supprimez une liste terminée ou passez à Toi & Moi Plus pour en créer davantage.`}</Banner>
          <PremiumGate feature="Listes illimitées"><View /></PremiumGate>
        </View>
      ) : (
        <Button label="Nouvelle liste" icon="plus" onPress={() => setCreating(true)} />
      )}

      {isLoading && !lists ? <Skeleton rows={3} /> : listsQ.isError && !lists ? (
        <ErrorView error={listsQ.error} onRetry={() => void listsQ.refetch()} title="Impossible d’afficher vos listes" />
      ) : !lists?.length ? (
        <EmptyState icon="check-square" title="Aucune liste pour l’instant" body="Partez d’un modèle (valise de maternité, démarches…) puis adaptez-le à votre famille." action={atLimit ? undefined : { label: 'Créer une liste', onPress: () => setCreating(true) }} />
      ) : (
        <>
          {open && <ChecklistDetail key={open.id} list={open} onClose={() => setOpenId(null)} />}
          <SectionTitle title={open ? 'Autres listes' : 'Vos listes'} />
          <Card>
            {lists.filter((l) => l.id !== openId).map((l) => {
              const items = (allItems ?? []).filter((i) => i.checklist_id === l.id);
              const done = items.filter((i) => i.done).length;
              return (
                <View key={l.id} style={{ gap: 4, paddingBottom: spacing.xs }}>
                  <ListRow icon={iconOf(l.kind)} title={l.title} subtitle={items.length ? `${done} sur ${items.length} fait${done > 1 ? 's' : ''}` : 'Vide'} onPress={() => setOpenId(l.id)} />
                  {items.length > 0 && <ProgressBar done={done} total={items.length} />}
                </View>
              );
            })}
            {lists.every((l) => l.id === openId) && <Text muted>Aucune autre liste.</Text>}
          </Card>
        </>
      )}

      <Sheet visible={creating} onClose={() => setCreating(false)} title="Nouvelle liste">
        {limitReached && !premium ? (
          <PremiumGate feature="Listes illimitées"><View /></PremiumGate>
        ) : (
          <>
            <Text variant="label">À partir d’un modèle</Text>
            {(Object.keys(CHECKLIST_TEMPLATES) as TemplateKind[]).map((k) => {
              const tpl = CHECKLIST_TEMPLATES[k];
              return (
                <ListRow
                  key={k}
                  icon={tpl.icon as IconName}
                  title={tpl.title}
                  subtitle={`${tpl.items.length} éléments${usedKinds.has(k) ? ' · vous avez déjà cette liste' : ''}`}
                  onPress={() => { if (!busy) create(k, tpl.title, tpl.items); }}
                />
              );
            })}
            <Text variant="label" style={{ marginTop: spacing.sm }}>Ou une liste vierge</Text>
            <Field label="Titre" value={customTitle} onChangeText={(v) => { setCustomTitle(v); setTitleError(null); }} maxLength={80} error={titleError} placeholder="Courses de la semaine 36" />
            <Button label="Créer la liste" loading={busy} onPress={createCustom} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
